function reeAPIs() {
	// @pcos-app-mode native

	async function denyUnmanifested(list, token) {
		let privileges = (await modules.tokens.info(token)).privileges;
		let isAllowlist = list.some(a => a.lineType == "allow");
		if (isAllowlist) list = list.filter(a => a.lineType == "allow");
		let disallowedRegistry = [];
		for (let privilege of privileges) {
			if ((!list.some(x => x.data == privilege && x.lineType == "allow") && isAllowlist) || list.some(x => x.data == privilege && x.lineType == "deny")) {
				privileges = privileges.filter(x => x != privilege);
				disallowedRegistry.push(privilege);
			}
		}
		modules.tokens.removePrivileges(token, disallowedRegistry);
		return privileges;
	}

	modules.reeAPIInstance = async function(opts) {
		let {ree, ses, token, taskId, limitations, privateData} = opts;
		let processToken = token;
		let tokenInfo = await modules.tokens.info(token);
		let user = tokenInfo.user;
		let groups = tokenInfo.groups || [];
		let privileges = tokenInfo.privileges;
		let processPipes = [];
		let websockets = [];
		let automatedLogonSessions = {};
		let networkListens = {};
		let connections = {};
		let language = modules.session.attrib(ses, "language") || undefined;
		privileges = await denyUnmanifested(limitations, token);

		async function fs_action(action, privilegeCheck, path, ...xtra) {
			let fsPermissions;
			try {
				fsPermissions = await modules.fs.permissions(path);
			} catch (e) {
				if (e.name == "Error") throw e;
				throw new Error("FS_ACTION_FAILED");
			}
			if (!privilegeCheck(fsPermissions)) throw new Error("PERMISSION_DENIED");
			try {
				let response = await modules.fs[action](path, ...xtra);
				return response;
			} catch (e) {
				if (e.name == "Error") throw e;
				throw new Error("FS_ACTION_FAILED");
			}
		}
		async function recursiveKeyVerify(key, khrl) {
			if (!key) throw new Error("NO_KEY");
			if (key.keyInfo.dates?.since > Date.now()) throw new Error("KEY_NOT_IN_TIME");
			if (Date.now() > key.keyInfo.dates?.until) throw new Error("KEY_NOT_IN_TIME");
			let u8aToHex = (u8a) => Array.from(u8a).map(a => a.toString(16).padStart(2, "0")).join("");
			let hash = u8aToHex(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode((key.keyInfo.key).x))));
			let hexToU8A = (hex) => Uint8Array.from(hex.match(/.{1,2}/g).map(a => parseInt(a, 16)));
			if (khrl.includes(hash)) throw new Error("KEY_REVOKED");
			let signedByKey = modules.ksk_imported;
			if (key.keyInfo.signedBy) {
				signedByKey = JSON.parse(await modules.fs.read(modules.defaultSystem + "/etc/keys/" + key.keyInfo.signedBy, token));
				if (!signedByKey.keyInfo.usages.includes("keyTrust")) throw new Error("NOT_KEY_AUTHORITY");
				await recursiveKeyVerify(signedByKey, khrl);
				signedByKey = await crypto.subtle.importKey("jwk", signedByKey.keyInfo.key, { name: "Ed25519" }, false, ["verify"]);
			}
			if (!await crypto.subtle.verify({ name: "Ed25519" }, signedByKey, hexToU8A(key.signature), new TextEncoder().encode(JSON.stringify(key.keyInfo)))) throw new Error("KEY_SIGNATURE_VERIFICATION_FAILED");
			return true;
		}

		ree.beforeCloseDown(async function() {
			for (let processPipe of processPipes) delete modules.ipc._ipc[processPipe];
			for (let connection in connections) try { networkListens[connections[connection].networkListenID].ws.send(JSON.stringify({
				receiver: connections[connection].from,
				data: {
					type: "connectionful",
					action: "drop",
					connectionID: connection.slice(0, -7),
					gate: connections[connection].gateIfNeeded
				}
			})); } catch {}
			for (let networkListen in networkListens) networkListens[networkListen].ws.removeEventListener("message", networkListens[networkListen].fn);
			for (let websocket of websockets) modules.websocket.close(websocket);
			await modules.tokens.revoke(token);
			for (let i in modules.csps) if (modules.csps[i].hasOwnProperty("removeSameGroupKeys")) modules.csps[i].removeSameGroupKeys(null, taskId);
		});
		let apis = {
			private: {
				setUser: async function(newUser) {
					user = newUser;
					groups = (await modules.users.getUserInfo(newUser, false, token || processToken)).groups || [];
				},
				addPrivilege: (newPrivilege) => !privileges.includes(newPrivilege) && privileges.push(newPrivilege),
				rmPrivilege: (newPrivilege) => privileges.includes(newPrivilege) && privileges.splice(privileges.indexOf(newPrivilege), 1),
				setPrivileges: (newPrivileges) => privileges = newPrivileges,
				reauthorize: async function() {
					let tokenInfo = await modules.tokens.info(token);
					user = tokenInfo.user;
					groups = tokenInfo.groups || [];
					privileges = tokenInfo.privileges;
					privileges = await denyUnmanifested(limitations, token);
				}
			},
			public: {
				getUser: () => user,
				getPrivileges: () => privileges,
				terminate: async function() {
					await ree.closeDown();
				},
				rmPrivilege: async function(privilege) {
					if (!privileges.includes(privilege)) throw new Error("NO_SUCH_PRIVILEGE");
					privileges.splice(privileges.indexOf(privilege), 1);
					await modules.tokens.removePrivilege(token, privilege);
					return true;
				},
				rmPrivileges: async function(privilegesRemoved) {
					privileges = privileges.filter(x => !privilegesRemoved.includes(x));
					await modules.tokens.removePrivileges(token, privilegesRemoved);
					return true;
				},
				switchUser: async function(desiredUser) {
					if (!privileges.includes("SWITCH_USERS_AUTOMATICALLY")) throw new Error("UNAUTHORIZED_ACTION");
					await modules.tokens.halfInitialize(token, desiredUser);
					let tokenInfo = await modules.tokens.info(token);
					user = tokenInfo.user;
					groups = tokenInfo.groups || [];
					return true;
				},
				shutdown: async function(arg) {
					let {isKexec, isReboot, force, token} = arg;
					if (!privileges.includes("SYSTEM_SHUTDOWN")) throw new Error("UNAUTHORIZED_ACTION");
					if (force) {
						try { modules.websocket._handles[modules.network.ws].ws.close(); } catch {}
						modules.session.destroy();
						if (isReboot) return location.reload();
						return modules.killSystem();
					}
					await modules.restart(!isReboot, token || processToken, isKexec);
					return true;
				},
				fs_read: async function(arg) {
					let {path, token} = arg;
					if (!privileges.includes("FS_READ")) throw new Error("UNAUTHORIZED_ACTION");
					return await fs_action("read", (fsPermissions) => fsPermissions.owner == user || fsPermissions.world.includes("r") || groups.includes(fsPermissions.group) || privileges.includes("FS_BYPASS_PERMISSIONS"), path, token || processToken);
				},
				fs_ls: async function(arg) {
					let {path, token} = arg;
					if (!privileges.includes("FS_READ")) throw new Error("UNAUTHORIZED_ACTION");
					return await fs_action("ls",
					(fsPermissions) =>
						fsPermissions.owner == user ||
						groups.includes(fsPermissions.group) ||
						(fsPermissions.world.includes("r") &&
						fsPermissions.world.includes("x")) || privileges.includes("FS_BYPASS_PERMISSIONS"), path, token || processToken);
				},
				fs_write: async function(arg) {
					if (!privileges.includes("FS_WRITE")) throw new Error("UNAUTHORIZED_ACTION");
					let {path, data, token} = arg;
					let pathParent = path.split("/").slice(0, -1).join("/");
					let basename = path.split("/").slice(-1)[0];
					let isCreating = false;
					let fsParentPermissions;
					try {
						if (!(await modules.fs.ls(pathParent, token || processToken)).includes(basename)) isCreating = true;
					} catch (e) {
						throw new Error("CREATION_CHECK_FAILED");
					}

					try {
						fsParentPermissions = await modules.fs.permissions(pathParent, token || processToken);
					} catch (e) {
						throw new Error("PERMISSION_CHECKING_FAILED");
					}
					if (!fsParentPermissions.world.includes("w") && fsParentPermissions.owner != user && !groups.includes(fsParentPermissions.group) && !privileges.includes("FS_BYPASS_PERMISSIONS")) throw new Error("PERMISSION_DENIED");
					
					if (isCreating) {
						try {
							await modules.fs.chown(path, user, token || processToken);
							await modules.fs.chgrp(path, groups[0], token || processToken);
							await modules.fs.chmod(path, "r", token || processToken);
						} catch (e) {
							if (e.name == "Error") throw e;
							throw new Error("PERMISSION_CHANGE_FAILED");
						}
					}
					return await fs_action("write", (fsPermissions) => fsPermissions.owner == user || groups.includes(fsPermissions.group) || fsPermissions.world.includes("w") || privileges.includes("FS_BYPASS_PERMISSIONS"), path, data, token || processToken);
				},
				fs_rm: async function(arg) {
					let {path, token} = arg;
					if (!privileges.includes("FS_REMOVE")) throw new Error("UNAUTHORIZED_ACTION");
					return await fs_action("rm", (fsPermissions) => fsPermissions.owner == user || privileges.includes("FS_BYPASS_PERMISSIONS"), path, token);
				},
				fs_mkdir: async function(arg) {
					let {path, token} = arg;
					if (!privileges.includes("FS_WRITE")) throw new Error("UNAUTHORIZED_ACTION");
					let pathParent = path.split("/").slice(0, -1).join("/");
					let fsPermissions;
					try {
						fsPermissions = await modules.fs.permissions(pathParent, token || processToken);
					} catch (e) {
						throw new Error("PERMISSION_CHECKING_FAILED");
					}
					if (!fsPermissions.world.includes("w") && fsPermissions.owner != user && !groups.includes(fsPermissions.group) && !privileges.includes("FS_BYPASS_PERMISSIONS")) throw new Error("PERMISSION_DENIED");
					try {
						await modules.fs.chown(path, user, token || processToken);
						await modules.fs.chgrp(path, groups[0] || user, token || processToken);
						await modules.fs.chmod(path, "rx", token || processToken);
					} catch (e) {
						if (e.name == "Error") throw e;
						throw new Error("PERMISSION_CHANGE_FAILED");
					}
					try {
						return await modules.fs.mkdir(path, token || processToken);
					} catch (e) {
						if (e.name == "Error") throw e;
						throw new Error("FS_ACTION_FAILED");
					}
				},
				fs_chown: async function(arg) {
					if (!privileges.includes("FS_CHANGE_PERMISSION")) throw new Error("UNAUTHORIZED_ACTION");
					let {path, newUser, token} = arg;
					return await fs_action("chown", (fsPermissions) => fsPermissions.owner == user || privileges.includes("FS_BYPASS_PERMISSIONS"), path, newUser, token || processToken);
				},
				fs_chgrp: async function(arg) {
					if (!privileges.includes("FS_CHANGE_PERMISSION")) throw new Error("UNAUTHORIZED_ACTION");
					let {path, newGrp, token} = arg;
					return await fs_action("chgrp", (fsPermissions) => fsPermissions.owner == user || privileges.includes("FS_BYPASS_PERMISSIONS"), path, newGrp, token || processToken);
				},
				fs_chmod: async function(arg) {
					if (!privileges.includes("FS_CHANGE_PERMISSION")) throw new Error("UNAUTHORIZED_ACTION");
					let {path, newPermissions, token} = arg;
					return await fs_action("chmod", (fsPermissions) => fsPermissions.owner == user || privileges.includes("FS_BYPASS_PERMISSIONS"), path, newPermissions, token || processToken);
				},
				fs_permissions: async function(arg) {
					let {path, token} = arg;
					if (!privileges.includes("FS_READ")) throw new Error("UNAUTHORIZED_ACTION");
					let pathParent = path.split("/").slice(0, -1).join("/");
					if (pathParent != "") {
						let fsPermissions;
						try {
							fsPermissions = await modules.fs.permissions(pathParent, token || processToken);
						} catch (e) {
							throw new Error("PERMISSION_CHECKING_FAILED");
						}
						if (!fsPermissions.world.includes("r") && fsPermissions.owner != user && !privileges.includes("FS_BYPASS_PERMISSIONS")) throw new Error("PERMISSION_DENIED");
					}
					return await fs_action("permissions", () => true, path, token || processToken);
				},
				fs_mounts: async function() {
					if (!privileges.includes("FS_LIST_PARTITIONS")) throw new Error("UNAUTHORIZED_ACTION");
					try {
						return await modules.fs.lsmounts();
					} catch (e) {
						if (e.name == "Error") throw e;
						throw new Error("FS_ACTION_FAILED");
					}
				},
				fs_sync: async function(arg) {
					let {mount, token} = arg;
					if (!privileges.includes("FS_UNMOUNT")) throw new Error("UNAUTHORIZED_ACTION");
					try {
						return await modules.fs.sync(mount, token || processToken);
					} catch (e) {
						if (e.name == "Error") throw e;
						throw new Error("FS_ACTION_FAILED");
					}
				},
				fs_unmount: async function(arg) {
					let {mount, token, force} = arg;
					if (!privileges.includes("FS_UNMOUNT")) throw new Error("UNAUTHORIZED_ACTION");
					try {
						return await modules.fs.unmount(mount, token || processToken, force);
					} catch (e) {
						if (e.name == "Error") throw e;
						throw new Error("FS_ACTION_FAILED");
					}
				},
				fs_mountInfo: async function(mount) {
					if (!privileges.includes("FS_LIST_PARTITIONS")) throw new Error("UNAUTHORIZED_ACTION");
					try {
						return await modules.fs.mountInfo(mount);
					} catch (e) {
						if (e.name == "Error") throw e;
						throw new Error("FS_ACTION_FAILED");
					}
				},
				getSystemMount: async function() {
					if (!privileges.includes("FS_LIST_PARTITIONS")) throw new Error("UNAUTHORIZED_ACTION");
					return modules.defaultSystem;
				},
				createPipe: async function() {
					if (!privileges.includes("IPC_CREATE_PIPE")) throw new Error("UNAUTHORIZED_ACTION");
					let pipe = await modules.ipc.create();
					modules.ipc.declareAccess(pipe, {
						owner: user,
						group: groups[0],
						world: false
					});
					processPipes.push(pipe);
					return pipe;
				},
				listenToPipe: async function(pipe) {
					if (!privileges.includes("IPC_LISTEN_PIPE")) throw new Error("UNAUTHORIZED_ACTION");
					let permissions = await modules.ipc.getIPC(pipe);
					if (permissions.owner != user && !groups.includes(permissions.group) && !permissions.world && !privileges.includes("IPC_BYPASS_PERMISSIONS") && !processPipes.includes(pipe)) throw new Error("PERMISSION_DENIED");
					return await modules.ipc.listenFor(pipe);
				},
				sendToPipe: async function(dataSend) {
					if (!privileges.includes("IPC_SEND_PIPE")) throw new Error("UNAUTHORIZED_ACTION");
					let {pipe, data} = dataSend;
					let permissions = await modules.ipc.getIPC(pipe);
					if (permissions.owner != user && !groups.includes(permissions.group) && !permissions.world && !privileges.includes("IPC_BYPASS_PERMISSIONS") && !processPipes.includes(pipe)) throw new Error("PERMISSION_DENIED");
					return await modules.ipc.send(pipe, data);
				},
				closePipe: async function(pipe) {
					if (!processPipes.includes(pipe)) throw new Error("NOT_OWN_PIPE");
					processPipes.splice(processPipes.indexOf(pipe), 1);
					return delete modules.ipc._ipc[pipe];
				},
				setPipePermissions: async function(opts) {
					if (!privileges.includes("IPC_CHANGE_PERMISSION")) throw new Error("UNAUTHORIZED_ACTION");
					let {pipe, newPermissions} = opts;
					let permissions = await modules.ipc.getIPC(pipe);
					if (permissions.owner != user && !groups.includes(permissions.group) && !permissions.world && !privileges.includes("IPC_BYPASS_PERMISSIONS") && !processPipes.includes(pipe)) throw new Error("PERMISSION_DENIED");
					return await modules.ipc.declareAccess(pipe, newPermissions);
				},
				elevate: async function(newPrivileges) {
					newPrivileges = newPrivileges.filter(privilege => !privileges.includes(privilege));
					newPrivileges = Array.from(new Set(newPrivileges));
					if (!privileges.includes("SWITCH_USERS_AUTOMATICALLY")) throw new Error("UNAUTHORIZED_ACTION");
					privileges.push(...newPrivileges);
					await modules.tokens.addPrivileges(token, newPrivileges);
					privileges = await denyUnmanifested(limitations, token);
					return true;
				},
				getVersion: function() {
					if (!privileges.includes("GET_BUILD")) throw new Error("UNAUTHORIZED_ACTION");
					return modules.pcos_version;
				},
				locale: function() {
					if (!privileges.includes("GET_LOCALE")) throw new Error("UNAUTHORIZED_ACTION");
					return language || navigator.languages[0].split("-")[0].toLowerCase();
				},
				osLocale: function() {
					if (!privileges.includes("GET_LOCALE")) throw new Error("UNAUTHORIZED_ACTION");
					return modules.locales.get("OS_LOCALE", language);
				},
				getUserInfo: async function(arg) {
					let {desiredUser, token, sensitive} = arg;
					if (!privileges.includes("GET_USER_INFO")) throw new Error("UNAUTHORIZED_ACTION");
					if (desiredUser != user && !privileges.includes("USER_INFO_OTHERS")) throw new Error("UNAUTHORIZED_ACTION");
					if (sensitive && desiredUser != user && !privileges.includes("SENSITIVE_USER_INFO_OTHERS")) throw new Error("PERMISSION_DENIED");
					return await modules.users.getUserInfo(desiredUser, sensitive, token || processToken);
				},
				setUserInfo: async function(arg) {
					let {desiredUser, token, info} = arg;
					if (!privileges.includes("SET_USER_INFO")) throw new Error("UNAUTHORIZED_ACTION");
					return await modules.users.moduser(desiredUser, info, token || processToken);
				},
				setOwnSecurityChecks: async function(arg) {
					let {token, checks} = arg;
					if (!privileges.includes("SET_SECURITY_CHECKS")) throw new Error("UNAUTHORIZED_ACTION");
					let allowedTypes = [ "pbkdf2", "informative", "informative_deny", "timeout", "timeout_deny", "serverReport", "pc-totp", "totp", "workingHours", "zkpp" ];
					let sanitizedChecks = [];
					checks.filter(a => allowedTypes.includes(a.type));
					for (let checkIndex in checks) {
						let check = checks[checkIndex];
						if (check.type == "pbkdf2") {
							if (!check.salt || !check.hash) continue;
							check = { type: "pbkdf2", salt: check.salt, hash: check.hash };
						} else if (check.type == "informative" || check.type == "informative_deny") {
							if (!check.message) continue;
							check = { type: check.type, message: check.message };
						} else if (check.type == "timeout" || check.type == "timeout_deny") {
							if (!check.timeout) continue;
							check = { type: check.type, timeout: check.timeout };
						} else if (check.type == "serverReport") {
							if (!check.url) continue;
							check = { type: "serverReport", url: check.url };
						} else if (check.type == "pc-totp" || check.type == "totp") {
							if (!check.secret) continue;
							check = { type: check.type, secret: check.secret };
						} else if (check.type == "workingHours") {
							if (!check.start || !check.end) continue;
							if (typeof check.start.hours !== "number" || typeof check.start.minutes !== "number" || typeof check.start.seconds !== "number") continue;
							if (typeof check.end.hours !== "number" || typeof check.end.minutes !== "number" || typeof check.end.seconds !== "number") continue;
							check = {
								type: "workingHours",
								start: {
									hours: check.start.hours,
									minutes: check.start.minutes,
									seconds: check.start.seconds
								},
								end: {
									hours: check.end.hours,
									minutes: check.end.minutes,
									seconds: check.end.seconds
								}
							};
						} else if (check.type == "zkpp") {
							if (!check.publicKey) continue;
							check = { type: "zkpp", publicKey: check.publicKey };
						}
						sanitizedChecks.push(check);
					}
					let previousUserInfo = await modules.users.getUserInfo(user, false, token || processToken);
					await modules.users.moduser(user, { ...previousUserInfo, securityChecks: sanitizedChecks }, token || processToken);
					return true;
				},
				getNewToken: async function(desiredUser) {
					if (!privileges.includes("ELEVATE_PRIVILEGES")) throw new Error("UNAUTHORIZED_ACTION");
					if (modules.session.attrib(ses, "secureLock")) await modules.session.attrib(ses, "secureLock");
					if (modules.session.active != ses) throw new Error("TRY_AGAIN_LATER");
					let releaseLock;
					let lock = new Promise((resolve) => releaseLock = resolve);
					modules.session.attrib(ses, "secureLock", lock);
					let secureSession = await modules.session.mksession();
					modules.session.attrib(ses, "secureID", secureSession);
					modules.session.attrib(secureSession, "language", language);

					let dom = modules.session.tracker[secureSession].html;
					let ogDom = modules.session.tracker[ses].html;
					let bgfx = document.createElement("div");
					bgfx.classList.add("session", "secure");
					dom.appendChild(bgfx);
					modules.session.attrib(secureSession, "dark", modules.session.attrib(ses, "dark"));
					dom.style.background = ogDom.style.background;
					dom.style.backgroundSize = "100% 100%";

					modules.session.muteAllSessions();
					modules.session.activateSession(secureSession);

					try {
						let logonUI = await modules.authui(secureSession, desiredUser);
						return new Promise(function(resolve) {
							logonUI.hook(async function(result) {
								releaseLock();
								modules.session.attrib(ses, "secureLock", null);
								modules.session.attrib(ses, "secureID", null);
								modules.session.muteAllSessions();
								modules.session.rmsession(secureSession);
								modules.session.activateSession(ses);
								if (result.success == false) return resolve(false);
								return resolve(result.token);
							});
						});
					} catch (e) {
						console.error("authui:", e);
						releaseLock();
						modules.session.attrib(ses, "secureLock", null);
						modules.session.attrib(ses, "secureID", null);
						modules.session.muteAllSessions();
						modules.session.rmsession(secureSession);
						modules.session.activateSession(ses);
						return false;
					}
				},
				getProcessToken: () => processToken,
				setProcessToken: async function(desiredToken) {
					if (!privileges.includes("ELEVATE_PRIVILEGES")) throw new Error("UNAUTHORIZED_ACTION");
					let validation = await modules.tokens.validate(desiredToken, {});
					if (!validation) throw new Error("INVALID_TOKEN");
					token = processToken = desiredToken;
					let tokenInfo = await modules.tokens.info(token);
					user = tokenInfo.user;
					groups = tokenInfo.groups || [];
					privileges = tokenInfo.privileges;
					privileges = await denyUnmanifested(limitations, token);
					return true;
				},
				revokeToken: function(dt) {
					if (!privileges.includes("MANAGE_TOKENS")) throw new Error("UNAUTHORIZED_ACTION");
					return modules.tokens.revoke(dt || processToken);
				},
				forkToken: function(dt) {
					if (!privileges.includes("MANAGE_TOKENS")) throw new Error("UNAUTHORIZED_ACTION");
					return modules.tokens.fork(dt || processToken);
				},
				removeTokenPrivilege: async function(arg) {
					let {token, privilege} = arg;
					if (!privileges.includes("MANAGE_TOKENS")) throw new Error("UNAUTHORIZED_ACTION");
					await modules.tokens.removePrivilege(token, privilege);
					return true;
				},
				removeTokenPrivileges: async function(arg) {
					let {token} = arg;
					if (!privileges.includes("MANAGE_TOKENS")) throw new Error("UNAUTHORIZED_ACTION");
					await modules.tokens.removePrivileges(token, arg.privileges);
					return true;
				},
				estimateStorage: async function() {
					if (!privileges.includes("FS_LIST_PARTITIONS")) throw new Error("UNAUTHORIZED_ACTION");
					let estimate = await navigator.storage.estimate();
					return {
						internal: {
							used: estimate.usage,
							free: estimate.quota - estimate.usage,
							total: estimate.quota
						}
					};
				},
				startTask: async function(arg) {
					let {file, argPassed, token, runInBackground, silent, privateData} = arg;
					if (!privileges.includes("START_TASK")) throw new Error("UNAUTHORIZED_ACTION");
					if (runInBackground && !privileges.includes("START_BACKGROUND_TASK")) throw new Error("UNAUTHORIZED_ACTION");
					if (!token) token = await modules.tokens.fork(processToken);
					try {
						return await modules.tasks.exec(file, argPassed, modules.window(runInBackground ? modules.serviceSession : ses), token, silent, privateData);
					} catch (e) {
						if (e.name == "Error") throw e;
						throw new Error("UNABLE_TO_START_TASK");
					}
				},
				listTasks: async function() {
					if (!privileges.includes("LIST_TASKS")) throw new Error("UNAUTHORIZED_ACTION");
					return modules.tasks.listPublicTasks();
				},
				taskInfo: async function(taskId) {
					if (!privileges.includes("LIST_TASKS")) throw new Error("UNAUTHORIZED_ACTION");
					return await modules.tasks.taskInfo(taskId);
				},
				signalTask: async function(arg) {
					let {taskId, signal} = arg;
					if (!privileges.includes("SIGNAL_TASK")) throw new Error("UNAUTHORIZED_ACTION");
					if (!privileges.includes("TASK_BYPASS_PERMISSIONS")) {
						let taskInfo = await modules.tasks.taskInfo(taskId);
						if (taskInfo.runBy != user) throw new Error("PERMISSION_DENIED");
					}
					return await modules.tasks.sendSignal(taskId, signal);
				},
				lookupLocale: function(key) {   
					if (!privileges.includes("GET_LOCALE")) throw new Error("UNAUTHORIZED_ACTION");
					return modules.locales.get(key, language);
				},
				lookupOtherLocale: function(arg) {
					let {key, locale} = arg;   
					if (!privileges.includes("GET_LOCALE")) throw new Error("UNAUTHORIZED_ACTION");
					return modules.locales.get(key, locale);
				},
				ufTimeInc: function(args) {
					if (!privileges.includes("GET_LOCALE")) throw new Error("UNAUTHORIZED_ACTION");
					return modules.userfriendliness.inconsiderateTime(language, ...args);
				},
				ufInfoUnits: function(args) {
					if (!privileges.includes("GET_LOCALE")) throw new Error("UNAUTHORIZED_ACTION");
					return modules.userfriendliness.informationUnits(language, ...args)
				},
				isDarkThemed: function() {
					if (!privileges.includes("GET_THEME")) throw new Error("UNAUTHORIZED_ACTION");
					return modules.session.attrib(ses, "dark")
				},
				fetchSend: async function(arg) {
					if (!privileges.includes("FETCH_SEND")) throw new Error("UNAUTHORIZED_ACTION");
					let {url, init} = arg;
					let fetc = await fetch(url, init);
					let responseAB;
					if (init.mode != "no-cors" && !init.noArrayBuffer) responseAB = await fetc.arrayBuffer();
					return {
						status: fetc.status,
						statusText: fetc.statusText,
						ok: fetc.ok,
						redirected: fetc.redirected,
						type: fetc.type,
						url: fetc.url,
						headers: Object.fromEntries(Array.from(fetc.headers)),
						arrayBuffer: responseAB,
					};
				},
				switchUserWithSetup: async function(desiredUser) {
					if (!privileges.includes("SWITCH_USERS_AUTOMATICALLY")) throw new Error("UNAUTHORIZED_ACTION");
					await modules.tokens.userInitialize(token, desiredUser);
					let tokenInfo = await modules.tokens.info(token);
					user = tokenInfo.user;
					groups = tokenInfo.groups || [];
					privileges = tokenInfo.privileges;
					privileges = await denyUnmanifested(limitations, token);
					return true;
				},
				runKlvlCode: async function(code) {
					if (!privileges.includes("RUN_KLVL_CODE")) throw new Error("UNAUTHORIZED_ACTION");
					return eval(code);
				},
				cspOperation: async function(arg) {
					if (!privileges.includes("CSP_OPERATIONS")) throw new Error("UNAUTHORIZED_ACTION");
					return modules.csps[arg.cspProvider][arg.operation](arg.cspArgument, taskId);
				},
				availableCsps: async function() {
					if (!privileges.includes("CSP_OPERATIONS")) throw new Error("UNAUTHORIZED_ACTION");
					return Object.keys(modules.csps);
				},
				ufTimeCon: function(args) {
					if (!privileges.includes("GET_LOCALE")) throw new Error("UNAUTHORIZED_ACTION");
					return modules.userfriendliness.considerateTime(language, ...args);
				},
				websocketOpen: async function(arg) {
					if (!privileges.includes("WEBSOCKETS_OPEN")) throw new Error("UNAUTHORIZED_ACTION");
					let handle = await modules.websocket.getHandle(arg);
					websockets.push(handle);
					modules.websocket.assertAccess({ handle, newACL: {
						owner: user,
						group: groups[0],
						world: false
					}});
					return handle;
				},
				listenToWebsocket: async function(arg) {
					if (!privileges.includes("WEBSOCKETS_LISTEN")) throw new Error("UNAUTHORIZED_ACTION");
					let permissions = modules.websocket.assertAccess({ handle: arg.handle });
					if (permissions.owner != user && !groups.includes(permissions.group) && !permissions.world && !privileges.includes("WEBSOCKET_BYPASS_PERMISSIONS") && !websockets.includes(arg.handle)) throw new Error("PERMISSION_DENIED");
					return await modules.websocket.waitForEvent(arg);
				},
				sendToWebsocket: async function(arg) {
					if (!privileges.includes("WEBSOCKETS_SEND")) throw new Error("UNAUTHORIZED_ACTION");
					let permissions = modules.websocket.assertAccess({ handle: arg.handle });
					if (permissions.owner != user && !groups.includes(permissions.group) && !permissions.world && !privileges.includes("WEBSOCKET_BYPASS_PERMISSIONS") && !websockets.includes(arg.handle)) throw new Error("PERMISSION_DENIED");
					return await modules.websocket.send(arg);
				},
				closeWebsocket: async function(websocket) {
					if (!websockets.includes(websocket)) throw new Error("NOT_OWN_WEBSOCKET");
					websockets.splice(websockets.indexOf(websocket), 1);
					return modules.websocket.close(websocket);
				},
				websocketInfo: async function(arg) {
					if (!privileges.includes("WEBSOCKET_INFO")) throw new Error("UNAUTHORIZED_ACTION");
					let permissions = modules.websocket.assertAccess({ handle: arg.handle });
					if (permissions.owner != user && !groups.includes(permissions.group) && !permissions.world && !privileges.includes("WEBSOCKET_BYPASS_PERMISSIONS") && !websockets.includes(arg.handle)) throw new Error("PERMISSION_DENIED");
					return await modules.websocket.getInfo(arg);
				},
				setWebsocketPermissions: async function(arg) {
					if (!privileges.includes("WEBSOCKET_SET_PERMISSIONS")) throw new Error("UNAUTHORIZED_ACTION");
					let permissions = modules.websocket.assertAccess({ handle: arg.handle });
					if (permissions.owner != user && !groups.includes(permissions.group) && !permissions.world && !privileges.includes("WEBSOCKET_BYPASS_PERMISSIONS") && !websockets.includes(arg.handle)) throw new Error("PERMISSION_DENIED");
					return await modules.websocket.assertAccess(arg);
				},
				getPublicSystemID: async function() {
					if (!privileges.includes("IDENTIFY_SYSTEM")) throw new Error("UNAUTHORIZED_ACTION");
					return (modules.core.prefs.read("system_id") || {}).public;
				},
				getPrivateSystemID: async function() {
					if (!privileges.includes("IDENTIFY_SYSTEM_SENSITIVE")) throw new Error("UNAUTHORIZED_ACTION");
					return (modules.core.prefs.read("system_id") || {}).private;
				},
				typeIntoOtherCLI: async function(arg) {
					if (!privileges.includes("CLI_MODIFICATIONS")) throw new Error("UNAUTHORIZED_ACTION");
					if (!modules.tasks.tracker.hasOwnProperty(arg.taskId)) throw new Error("TASK_NOT_FOUND");
					let bypassWorks = modules.tasks.tracker[arg.taskId].apis.public.getProcessToken() == arg.bypass;
					if (!bypassWorks) {
						let taskInfo = await modules.tasks.taskInfo(arg.taskId);
						if (taskInfo.runBy != user && !privileges.includes("TASK_BYPASS_PERMISSIONS")) throw new Error("PERMISSION_DENIED");
					}
					if (!modules.tasks.tracker[arg.taskId].cliio) throw new Error("NO_CLI_ATTACHED");
					return await modules.tasks.tracker[arg.taskId].cliio.xtermInstance.input(arg.text, arg.human);
				},
				getOtherCLIData: async function(arg) {
					if (!privileges.includes("CLI_MODIFICATIONS")) throw new Error("UNAUTHORIZED_ACTION");
					if (!modules.tasks.tracker.hasOwnProperty(arg.taskId)) throw new Error("TASK_NOT_FOUND");
					let bypassWorks = modules.tasks.tracker[arg.taskId].apis.public.getProcessToken() == arg.bypass;
					if (!bypassWorks) {
						let taskInfo = await modules.tasks.taskInfo(arg.taskId);
						if (taskInfo.runBy != user && !privileges.includes("TASK_BYPASS_PERMISSIONS")) throw new Error("PERMISSION_DENIED");
					}
					if (!modules.tasks.tracker[arg.taskId].cliio) throw new Error("NO_CLI_ATTACHED");
					return await modules.tasks.tracker[arg.taskId].cliio.signup();
				},
				waitForOtherCLI: async function(arg) {
					if (!privileges.includes("CLI_MODIFICATIONS")) throw new Error("UNAUTHORIZED_ACTION");
					if (!modules.tasks.tracker.hasOwnProperty(arg.taskId)) throw new Error("TASK_NOT_FOUND");
					let bypassWorks = modules.tasks.tracker[arg.taskId].apis.public.getProcessToken() == arg.bypass;
					if (!bypassWorks) {
						let taskInfo = await modules.tasks.taskInfo(arg.taskId);
						if (taskInfo.runBy != user && !privileges.includes("TASK_BYPASS_PERMISSIONS")) throw new Error("PERMISSION_DENIED");
					}
					if (modules.tasks.tracker[arg.taskId].cliio) return true;
					return await modules.tasks.tracker[arg.taskId].cliio.attachedCLISignUp();
				},
				lldaRead: async function(arg) {
					if (!privileges.includes("LLDISK_READ")) throw new Error("UNAUTHORIZED_ACTION");
					return modules.core.disk.partition(arg.partition).getData();
				},
				lldaWrite: async function(arg) {
					if (!privileges.includes("LLDISK_WRITE")) throw new Error("UNAUTHORIZED_ACTION");
					return modules.core.disk.partition(arg.partition).setData(arg.data);
				},
				lldaList: async function() {
					if (!privileges.includes("LLDISK_LIST_PARTITIONS")) throw new Error("UNAUTHORIZED_ACTION");
					return modules.core.disk.partitions();
				},
				lldaInitPartitions: async function() {
					if (!privileges.includes("LLDISK_INIT_PARTITIONS")) throw new Error("UNAUTHORIZED_ACTION");
					return modules.core.disk.insertPartitionTable();
				},
				lldaRemove: async function(arg) {
					if (!privileges.includes("LLDISK_REMOVE")) throw new Error("UNAUTHORIZED_ACTION");
					return modules.core.disk.partition(arg.partition).remove();
				},
				lldaIDBRead: async function(arg) {
					if (!privileges.includes("LLDISK_IDB_READ")) throw new Error("UNAUTHORIZED_ACTION");
					return modules.core.idb.readPart(arg.key);
				},
				lldaIDBWrite: async function(arg) {
					if (!privileges.includes("LLDISK_IDB_WRITE")) throw new Error("UNAUTHORIZED_ACTION");
					await modules.core.idb.writePart(arg.key, arg.value);
				},
				lldaIDBRemove: async function(arg) {
					if (!privileges.includes("LLDISK_IDB_REMOVE")) throw new Error("UNAUTHORIZED_ACTION");
					await modules.core.idb.removePart(arg.key);
				},
				lldaIDBList: async function() {
					if (!privileges.includes("LLDISK_IDB_LIST")) throw new Error("UNAUTHORIZED_ACTION"); 
					return modules.core.idb.listParts(); 
				},
				lldaIDBSync: async function() {
					if (!privileges.includes("LLDISK_IDB_SYNC")) throw new Error("UNAUTHORIZED_ACTION");
					await modules.core.idb.sync();
				},
				fs_mount: async function(arg) {
					if (!privileges.includes("FS_MOUNT")) throw new Error("UNAUTHORIZED_ACTION");
					if (modules.fs.mounts[arg.mountpoint]) throw new Error("MOUNT_EXISTS");
					modules.fs.mounts[arg.mountpoint] = await modules.mounts[arg.filesystem](arg.filesystemOptions);
				},
				supportedFilesystems: async function() {
					if (!privileges.includes("GET_FILESYSTEMS")) throw new Error("UNAUTHORIZED_ACTION");
					return Object.keys(modules.mounts);
				},
				installedLocales: async function() {
					if (!privileges.includes("GET_LOCALE")) throw new Error("UNAUTHORIZED_ACTION");
					return Object.keys(modules.locales).filter(a => a != "get" && a != "defaultLocale");
				},
				runningServer: async function() {
					if (!privileges.includes("GET_SERVER_URL")) throw new Error("UNAUTHORIZED_ACTION");
					return location.origin;
				},
				fs_isDirectory: async function(arg) {
					if (!privileges.includes("FS_READ")) throw new Error("UNAUTHORIZED_ACTION");
					let {path, token} = arg;
					return await fs_action("isDirectory", (fsPermissions) => fsPermissions.owner == user || fsPermissions.world.includes("r") || groups.includes(fsPermissions.group) || privileges.includes("FS_BYPASS_PERMISSIONS"), path, token || processToken);
				},
				automatedLogonCreate: async function(arg) {
					let { desiredUser, token } = arg;
					if (!privileges.includes("ELEVATE_PRIVILEGES")) throw new Error("UNAUTHORIZED_ACTION");
					let automatedLogon = Array.from(crypto.getRandomValues(new Uint8Array(64))).reduce((a, b) => a + b.toString(16).padStart(2, "0"), "");
					try {
						let access = await modules.users.access(desiredUser, token || processToken);
						access = await access.getNextPrompt();
						automatedLogonSessions[automatedLogon] = access;
					} catch {
						throw new Error("AUTOMATED_LOGON_CREATE_FAILED")
					}
					return automatedLogon;
				},
				automatedLogonGet: async function(arg) {
					if (!privileges.includes("ELEVATE_PRIVILEGES")) throw new Error("UNAUTHORIZED_ACTION");
					try {
						let sharedObj = { ...automatedLogonSessions[arg] };
						delete sharedObj.input;
						return sharedObj;
					} catch (e) {
						throw new Error("AUTOMATED_LOGON_GET_FAILED");
					}
				},
				automatedLogonInput: async function(arg) {
					let { session, input } = arg;
					if (!privileges.includes("ELEVATE_PRIVILEGES")) throw new Error("UNAUTHORIZED_ACTION");
					try {
						automatedLogonSessions[session] = await automatedLogonSessions[session].input(input);
					} catch {
						throw new Error("AUTOMATED_LOGON_INPUT_FAILED");
					}
				},
				automatedLogonDelete: async function(arg) {
					if (!privileges.includes("ELEVATE_PRIVILEGES")) throw new Error("UNAUTHORIZED_ACTION");
					delete automatedLogonSessions[arg];
				},
				setSystemMount: async function(arg) {
					if (!privileges.includes("SET_DEFAULT_SYSTEM")) throw new Error("UNAUTHORIZED_ACTION");
					modules.defaultSystem = arg;
				},
				usedRAM: async function() {
					if (!privileges.includes("GET_SYSTEM_RESOURCES")) throw new Error("UNAUTHORIZED_ACTION");
					try {
						let mem = performance.memory;
						return {
							total: mem.jsHeapSizeLimit,
							used: mem.usedJSHeapSize,
							free: mem.jsHeapSizeLimit - mem.usedJSHeapSize
						}
					} catch {}
					let mem = await performance.measureUserAgentSpecificMemory();
					return {
						total: Infinity,
						used: mem.bytes,
						free: Infinity
					}
				},
				checkBootMode: async function() {
					if (!privileges.includes("GET_BOOT_MODE")) throw new Error("UNAUTHORIZED_ACTION");
					return modules.core.bootMode || "normal";
				},
				getScreenInfo: async function() {
					if (!privileges.includes("GET_SCREEN_INFO")) throw new Error("UNAUTHORIZED_ACTION");
					return {
						width: document.documentElement.clientWidth,
						height: document.documentElement.clientHeight,
						colorDepth: screen.colorDepth,
						orientation: {
							type: screen.orientation.type,
							angle: screen.orientation.angle
						},
						fullWidth: screen.width,
						fullHeight: screen.height,
						availWidth: screen.availWidth,
						availHeight: screen.availHeight,
					}
				},
				waitTermination: async function(arg) {
					if (!privileges.includes("LIST_TASKS")) throw new Error("UNAUTHORIZED_ACTION");
					return modules.tasks.waitTermination(arg);
				},
				consentGetToken: async function(params) {
					if (!privileges.includes("ELEVATE_PRIVILEGES")) throw new Error("UNAUTHORIZED_ACTION");
					if (modules.session.attrib(ses, "secureLock")) await modules.session.attrib(ses, "secureLock");
					if (modules.session.active != ses) throw new Error("TRY_AGAIN_LATER");
					let { desiredUser, intent } = params;
					if (!intent) throw new Error("INTENT_REQUIRED");
					let releaseLock;
					let lock = new Promise((resolve) => releaseLock = resolve);
					modules.session.attrib(ses, "secureLock", lock);
					let secureSession = await modules.session.mksession();
					modules.session.attrib(ses, "secureID", secureSession);
					modules.session.attrib(secureSession, "language", language);

					let dom = modules.session.tracker[secureSession].html;
					let ogDom = modules.session.tracker[ses].html;
					let bgfx = document.createElement("div");
					bgfx.classList.add("session", "secure");
					dom.appendChild(bgfx);
					modules.session.attrib(secureSession, "dark", modules.session.attrib(ses, "dark"));
					dom.style.background = ogDom.style.background;
					dom.style.backgroundSize = "100% 100%";

					modules.session.muteAllSessions();
					modules.session.activateSession(secureSession);
					let task = await modules.tasks.taskInfo(taskId);

					try {
						let logonUI = await modules.consentui(secureSession, {
							user: desiredUser,
							path: task.file,
							args: task.arg,
							intent,
							name: params.name
						});
						return new Promise(function(resolve) {
							logonUI.hook(async function(result) {
								releaseLock();
								modules.session.attrib(ses, "secureLock", null);
								modules.session.attrib(ses, "secureID", null);
								modules.session.muteAllSessions();
								modules.session.rmsession(secureSession);
								modules.session.activateSession(ses);
								if (result.success == false) return resolve(false);
								return resolve(result.token);
							});
						});
					} catch (e) {
						console.error("consentui:", e);
						releaseLock();
						modules.session.attrib(ses, "secureLock", null);
						modules.session.attrib(ses, "secureID", null);
						modules.session.muteAllSessions();
						modules.session.rmsession(secureSession);
						modules.session.activateSession(ses);
						return false;
					}
				},
				networkPing: async function(address) {
					if (!privileges.includes("PCOS_NETWORK_PING")) throw new Error("UNAUTHORIZED_ACTION");
					let websocketHandle = modules.network.ws;
					if (!websocketHandle) throw new Error("NETWORK_UNREACHABLE");
					let websocket = modules.websocket._handles[websocketHandle].ws;
					if (websocket.readyState != 1) throw new Error("NETWORK_UNREACHABLE");
					return Promise.race([ new Promise(async function(resolve, reject) {
						let networkListenID = Array.from(crypto.getRandomValues(new Uint8Array(64))).map(a => a.toString(16).padStart(2, "0")).join("");
						let packetId = Array.from(crypto.getRandomValues(new Uint8Array(32))).map(a => a.toString(16).padStart(2, "0")).join("");
						let resend = Array.from(crypto.getRandomValues(new Uint8Array(32))).map(a => a.toString(16).padStart(2, "0")).join("");
						function eventListener(e) {
							try {
								let packet = JSON.parse(e.data);
								if (packet.packetID == packetId && packet.event == "AddressUnreachable") {
									reject(new Error("ADDRESS_UNREACHABLE"));
									delete networkListens[networkListenID];
									websocket.removeEventListener("message", eventListener);
								}
								if (packet.from == address && packet.data.type == "pong" && packet.data.resend == resend) {
									resolve("success");
									delete networkListens[networkListenID];
									websocket.removeEventListener("message", eventListener);
								}
							} catch {}
						}
						networkListens[networkListenID] = { ws: websocket, fn: eventListener };
						websocket.addEventListener("message", eventListener);
						websocket.send(JSON.stringify({
							receiver: address,
							data: {
								type: "ping",
								resend: resend
							},
							id: packetId
						}))
					}), new Promise((_, reject) => modules.network.runOnClose.then(_ => reject(new Error("NETWORK_CLOSED")))) ]);
				},
				logOut: async function(desiredUser) {
					if (desiredUser != user && !privileges.includes("LOGOUT_OTHERS")) throw new Error("UNAUTHORIZED_ACTION");
					if (desiredUser == user && !privileges.includes("LOGOUT")) throw new Error("UNAUTHORIZED_ACTION");
					if (modules.session.active != ses && !privileges.includes("LOGOUT_OTHERS")) throw new Error("UNAUTHORIZED_ACTION");
					await modules.logOut(desiredUser);
				},
				lock: async function() {
					if (modules.session.active == ses && !privileges.includes("LOGOUT")) throw new Error("UNAUTHORIZED_ACTION");
					if (modules.session.active != ses && !privileges.includes("LOGOUT_OTHERS")) throw new Error("UNAUTHORIZED_ACTION");
					modules.session.muteAllSessions();
					modules.session.activateSession(modules.session.systemSession);
				},
				getPrivateData: () => privateData,
				lull: async function() {
					if (!privileges.includes("LULL_SYSTEM")) throw new Error("UNAUTHORIZED_ACTION");
					if (modules.session.active != ses && !privileges.includes("LULL_SYSTEM_FORCE")) throw new Error("UNAUTHORIZED_ACTION");
					await modules.lull();
				},
				connlessListen: async function(gate) {
					if (!privileges.includes("CONNLESS_LISTEN")) throw new Error("UNAUTHORIZED_ACTION");
					if (!gate.startsWith("user_") && !privileges.includes("CONNLESS_LISTEN_GLOBAL")) throw new Error("UNAUTHORIZED_ACTION");
					let websocketHandle = modules.network.ws;
					if (!websocketHandle) throw new Error("NETWORK_UNREACHABLE");
					let websocket = modules.websocket._handles[websocketHandle].ws;
					if (websocket.readyState != 1) throw new Error("NETWORK_UNREACHABLE");
					return Promise.race([ new Promise(async function(resolve) {
						let networkListenID = Array.from(crypto.getRandomValues(new Uint8Array(64))).map(a => a.toString(16).padStart(2, "0")).join("");
						function eventListener(e) {
							try {
								let packet = JSON.parse(e.data);
								if (packet.data.type == "connectionless" && packet.data.gate == gate) {
									websocket.removeEventListener("message", eventListener);
									delete networkListens[networkListenID];
									resolve(packet);
								}
							} catch {}
						}
						networkListens[networkListenID] = { ws: websocket, fn: eventListener };
						websocket.addEventListener("message", eventListener);
					}), new Promise((_, reject) => modules.network.runOnClose.then(_ => reject(new Error("NETWORK_CLOSED")))) ]);
				},
				connlessSend: async function(sendOpts) {
					if (!privileges.includes("CONNLESS_SEND")) throw new Error("UNAUTHORIZED_ACTION");
					let websocketHandle = modules.network.ws;
					if (!websocketHandle) throw new Error("NETWORK_UNREACHABLE");
					let websocket = modules.websocket._handles[websocketHandle].ws;
					if (websocket.readyState != 1) throw new Error("NETWORK_UNREACHABLE");
					let { gate, address, content } = sendOpts;
					let packetId = Array.from(crypto.getRandomValues(new Uint8Array(32))).map(a => a.toString(16).padStart(2, "0")).join("");
					websocket.send(JSON.stringify({
						receiver: address,
						data: {
							type: "connectionless",
							gate: gate,
							content: content
						},
						id: packetId
					}));
					return Promise.race([ new Promise(async function(resolve, reject) {
						let networkListenID = Array.from(crypto.getRandomValues(new Uint8Array(64))).map(a => a.toString(16).padStart(2, "0")).join("");
						function eventListener(e) {
							try {
								let packet = JSON.parse(e.data);
								if (packet.from) return;
								if (packet.packetID == packetId) {
									websocket.removeEventListener("message", eventListener);
									delete networkListens[networkListenID];
									if (packet.event == "PacketPong") return resolve("success");
									reject(new Error("ADDRESS_UNREACHABLE"));
								}
							} catch {}
						}
						networkListens[networkListenID] = { ws: websocket, fn: eventListener };
						websocket.addEventListener("message", eventListener);
					}), new Promise((_, reject) => modules.network.runOnClose.then(_ => reject(new Error("NETWORK_CLOSED")))) ]);
				},
				getUsers: async function(token) {
					if (!privileges.includes("GET_USER_LIST")) throw new Error("UNAUTHORIZED_ACTION");
					return await modules.users.getUsers(token || processToken);
				},
				getNetworkAddress: async function() {
					if (!privileges.includes("GET_NETWORK_ADDRESS")) throw new Error("UNAUTHORIZED_ACTION");
					return modules.network.address;
				},
				connfulListen: async function(listenOpts) {
					if (!privileges.includes("CONNFUL_LISTEN")) throw new Error("UNAUTHORIZED_ACTION");
					let {gate, key, private: privateKey, verifyClientKeyChain} = listenOpts;
					if (!gate.startsWith("user_") && !privileges.includes("CONNFUL_LISTEN_GLOBAL")) throw new Error("UNAUTHORIZED_ACTION");
					let websocketHandle = modules.network.ws;
					if (!websocketHandle) throw new Error("NETWORK_UNREACHABLE");
					let websocket = modules.websocket._handles[websocketHandle].ws;
					if (websocket.readyState != 1) throw new Error("NETWORK_UNREACHABLE");
					let networkListenID = Array.from(crypto.getRandomValues(new Uint8Array(64))).map(a => a.toString(16).padStart(2, "0")).join("");
					let usableKey = await crypto.subtle.importKey("jwk", privateKey, {name: "Ed25519"}, true, ["sign"]);
					let hexToU8A = (hex) => Uint8Array.from(hex.match(/.{1,2}/g).map(a => parseInt(a, 16)));
					let u8aToHex = (u8a) => Array.from(u8a).map(a => a.toString(16).padStart(2, "0")).join("");
					let _connectionBufferPromise = null;
					let _connectionBufferReject = null;
					let connectionBufferPromise = new Promise((r, j) => [_connectionBufferPromise, _connectionBufferReject] = [r, j]);
					async function eventListener(e) {
						try {
							let packet = JSON.parse(e.data);
							if (!packet.from) return;
							if (packet.data.type == "connectionful" && packet.data.gate == gate && packet.data.action == "start") {
								if (!packet.data.connectionID) return;
								if (connections[packet.data.connectionID + ":server"]) return;
								let ephemeralKey = await crypto.subtle.generateKey({name: "Ed25519"}, true, ["deriveBits"]);
								let exported = await crypto.subtle.exportKey("jwk", ephemeralKey.publicKey);
								exported = {signedBy: "serverKey", usages: ["connfulSecureEphemeral"], key:exported};
								let signature = u8aToHex(new Uint8Array(await crypto.subtle.sign({
									name: "Ed25519"
								}, usableKey, new TextEncoder().encode(JSON.stringify(exported)))));
								let theirUsableKey = await crypto.subtle.importKey("jwk", packet.data.content.keyInfo.key, { name: "X25519" }, true, []);
								let joinedKeys = await crypto.subtle.deriveBits({ name: "X25519", public: theirUsableKey }, ephemeralKey.privateKey, 256);
								let aesUsableKey = await crypto.subtle.importKey("raw", joinedKeys, {name: "AES-GCM"}, true, ["encrypt", "decrypt"]);
								let _dataBufferPromise = null, _rejectDataPromise = null;
								let dataBufferPromise = new Promise((r, j) => [_dataBufferPromise, _rejectDataPromise] = [r, j]);
								connections[packet.data.connectionID + ":server"] = {
									ourKey: ephemeralKey,
									from: packet.from,
									theirMainKeyReceived: false,
									theirKeyRaw: packet.data.content,
									aesUsableKey,
									dataBuffer: [],
									dataBufferPromise,
									_dataBufferPromise,
									_rejectDataPromise,
									networkListenID
								}

								websocket.send(JSON.stringify({
									receiver: packet.from,
									data: {
										type: "connectionful",
										action: "start",
										content: {
											keyInfo: exported,
											signature
										},
										connectionID: packet.data.connectionID
									}
								}));
							} else if (packet.data.type == "connectionful" && packet.data.gate == gate && packet.data.action == "xchange") {
								if (!packet.data.connectionID) return;
								if (!connections.hasOwnProperty(packet.data.connectionID + ":server")) return;
								if (connections[packet.data.connectionID + ":server"].theirMainKeyReceived) return;
								if (connections[packet.data.connectionID + ":server"].dying) return;
								let theirMainKeyDecrypt = JSON.parse(new TextDecoder().decode(await crypto.subtle.decrypt({
									name: "AES-GCM",
									iv: hexToU8A(packet.data.content.iv),
								}, connections[packet.data.connectionID + ":server"].aesUsableKey, hexToU8A(packet.data.content.ct))));
								let usableMainKey = await crypto.subtle.importKey("jwk", theirMainKeyDecrypt.keyInfo.key, { name: "Ed25519" }, true, ["verify"]);
								let verifyKeySignature = await crypto.subtle.verify({ name: "Ed25519" }, usableMainKey, hexToU8A(connections[packet.data.connectionID + ":server"].theirKeyRaw.signature), new TextEncoder().encode(JSON.stringify(connections[packet.data.connectionID + ":server"].theirKeyRaw.keyInfo)));
								if (verifyClientKeyChain && verifyKeySignature) {
									verifyKeySignature = false;
									try {
										let khrlFiles = await modules.fs.ls(modules.defaultSystem + "/etc/keys/khrl", processToken);
										let khrlSignatures = [];
										for (let khrlFile of khrlFiles) {
											let khrl = JSON.parse(await modules.fs.read(modules.defaultSystem + "/etc/keys/khrl/" + khrlFile, processToken));
											let khrlSignature = khrl.signature;
											delete khrl.signature;
											if (await crypto.subtle.verify({ name: "Ed25519" }, modules.ksk_imported, hexToU8A(khrlSignature), new TextEncoder().encode(JSON.stringify(khrl.list)))) {
												khrlSignatures.push(...khrl.list);
											}
										}
										verifyKeySignature = await recursiveKeyVerify(theirMainKeyDecrypt, khrlSignatures);
									} catch {}
								}
								if (!verifyKeySignature || !theirMainKeyDecrypt.keyInfo.usages.includes("connfulSecureClient:" + packet.from)) {
									delete connections[packet.data.connectionID + ":server"];
									websocket.send(JSON.stringify({
										receiver: packet.from,
										data: {
											type: "connectionful",
											action: "drop",
											connectionID: packet.data.connectionID
										}
									}));
									return;
								}
								connections[packet.data.connectionID + ":server"].theirMainKeyReceived = theirMainKeyDecrypt;
								let iv = crypto.getRandomValues(new Uint8Array(16));
								websocket.send(JSON.stringify({
									receiver: packet.from,
									data: {
										type: "connectionful",
										action: "xchange",
										content: {
											iv: u8aToHex(iv),
											ct: u8aToHex(new Uint8Array(await crypto.subtle.encrypt({
												name: "AES-GCM",
												iv
											}, connections[packet.data.connectionID + ":server"].aesUsableKey, new TextEncoder().encode(JSON.stringify(key)))))
										},
										connectionID: packet.data.connectionID
									}
								}));
							} else if (packet.data.type == "connectionful" && packet.data.gate == gate && packet.data.action == "drop") {
								if (!packet.data.connectionID) return;
								if (!connections.hasOwnProperty(packet.data.connectionID + ":server")) return;
								if (connections[packet.data.connectionID + ":server"].dying) return;
								websocket.send(JSON.stringify({
									receiver: packet.from,
									data: {
										type: "connectionful",
										action: "drop",
										connectionID: packet.data.connectionID
									}
								}));
								if (connections[packet.data.connectionID + ":server"]._rejectDataPromise)
									connections[packet.data.connectionID + ":server"]._rejectDataPromise(new Error("CONNECTION_DROPPED"));
								connections[packet.data.connectionID + ":server"].dying = true;
								if (!connections[packet.data.connectionID + ":server"].dataBuffer.length)
									delete connections[packet.data.connectionID + ":server"];
							} else if (packet.data.type == "connectionful" && packet.data.gate == gate && packet.data.action == "nice2meetu") {
								if (!packet.data.connectionID) return;
								if (!connections.hasOwnProperty(packet.data.connectionID + ":server")) return;
								if (!connections[packet.data.connectionID + ":server"].theirMainKeyReceived) return;
								if (!connections[packet.data.connectionID + ":server"].aesUsableKey) return;
								if (connections[packet.data.connectionID + ":server"].dying) return;
								networkListens[networkListenID].connectionBuffer.push(packet.data.connectionID + ":server");
								let _curcbp = _connectionBufferPromise;
								connectionBufferPromise = new Promise((r, j) => [_connectionBufferPromise, _connectionBufferReject] = [r, j]);
								networkListens[networkListenID].connectionBufferPromise = connectionBufferPromise;
								_curcbp();
							} else if (packet.data.type == "connectionful" && packet.data.gate == gate && packet.data.action == "data") {
								if (!packet.data.connectionID) return;
								if (!connections.hasOwnProperty(packet.data.connectionID + ":server")) return;
								if (!connections[packet.data.connectionID + ":server"].aesUsableKey) return;
								if (!connections[packet.data.connectionID + ":server"].theirMainKeyReceived) return;
								if (connections[packet.data.connectionID + ":server"].dying) return;
								if (connections[packet.data.connectionID + ":server"].writingLock) await connections[packet.data.connectionID + ":server"].writingLock;
								let writingLockRelease;
								let writingLock = new Promise(r => writingLockRelease = r);
								connections[packet.data.connectionID + ":server"].writingLock = writingLock;
								connections[packet.data.connectionID + ":server"].dataBuffer.push(new TextDecoder().decode(await crypto.subtle.decrypt({
									name: "AES-GCM",
									iv: hexToU8A(packet.data.content.iv)
								}, connections[packet.data.connectionID + ":server"].aesUsableKey, hexToU8A(packet.data.content.ct))));
								if (!(connections[connID + ":server"].dataBuffer.length - 1)) {
									let _curdbp = connections[packet.data.connectionID + ":server"].dataBufferPromise;
									let _dataBufferPromise = null, _rejectDataPromise = null;
									let dataBufferPromise = new Promise((r, e) => [_dataBufferPromise, _rejectDataPromise] = [r, e]);
									connections[packet.data.connectionID + ":server"].dataBufferPromise = dataBufferPromise;
									connections[packet.data.connectionID + ":server"]._dataBufferPromise = _dataBufferPromise;
									connections[packet.data.connectionID + ":server"]._rejectDataPromise = _rejectDataPromise;
									_curdbp();
								}
								writingLockRelease();
							}
						} catch {}
					}
					networkListens[networkListenID] = { ws: websocket, gate: gate, fn: eventListener, connectionBuffer: [], connectionBufferPromise }
					modules.network.runOnClose.then(function() {
						for (let connectionID in connections) if (connections[connectionID].networkListenID == networkListenID) {
							connections[connectionID].dying = true;
							connections[connectionID]._rejectDataPromise(new Error("NETWORK_CLOSED"));
							if (!connections[connectionID].dataBuffer.length) delete connections[connectionID];
						}
						delete networkListens[networkListenID];
						_connectionBufferReject(new Error("NETWORK_CLOSED"));
					});
					websocket.addEventListener("message", eventListener);
					return networkListenID;
				},
				connfulListenConnections: async function(networkListenID) {
					if (!privileges.includes("CONNFUL_LISTEN")) throw new Error("UNAUTHORIZED_ACTION");
					if (!networkListens.hasOwnProperty(networkListenID)) throw new Error("INVALID_LISTEN_ID");
					if (!networkListens[networkListenID].connectionBuffer.length) await networkListens[networkListenID].connectionBufferPromise;
					let connectionID = networkListens[networkListenID].connectionBuffer[0];
					networkListens[networkListenID].connectionBuffer = networkListens[networkListenID].connectionBuffer.slice(1);
					return connectionID;
				},
				getBuildTime: function() {
					if (!privileges.includes("GET_BUILD")) throw new Error("UNAUTHORIZED_ACTION");
					return modules.build_time;
				},
				connfulConnect: async function(connOpts) {
					if (!privileges.includes("CONNFUL_CONNECT")) throw new Error("UNAUTHORIZED_ACTION");
					let {address, gate, key, private: privateKey, doNotVerifyServer, verifyByDomain} = connOpts;
					let websocketHandle = modules.network.ws;
					if (!websocketHandle) throw new Error("NETWORK_UNREACHABLE");
					let websocket = modules.websocket._handles[websocketHandle].ws;
					if (websocket.readyState != 1) throw new Error("NETWORK_UNREACHABLE");
					let networkListenID = Array.from(crypto.getRandomValues(new Uint8Array(64))).map(a => a.toString(16).padStart(2, "0")).join("");
					let connID = crypto.getRandomValues(new Uint8Array(64)).reduce((a, b) => a + b.toString(16).padStart(2, "0"), "");
					let hexToU8A = (hex) => Uint8Array.from(hex.match(/.{1,2}/g).map(a => parseInt(a, 16)));
					let u8aToHex = (u8a) => Array.from(u8a).map(a => a.toString(16).padStart(2, "0")).join("");
					let newKeyKA, exportedKA;
					if (!key && !privateKey) {
						newKeyKA = await crypto.subtle.generateKey({name: "Ed25519", namedCurve: "P-256"}, true, ["sign", "verify"]);
						exportedKA = await crypto.subtle.exportKey("jwk", newKeyKA.publicKey);
						exportedKA = { keyInfo: { usages: ["connfulSecureClient:" + modules.network.address], key: exportedKA }, signature: null };
						newKeyKA = newKeyKA.privateKey;
					} else {
						newKeyKA = await crypto.subtle.importKey("jwk", privateKey, {name: "Ed25519"}, true, ["sign"]);
						exportedKA = key;
					}
					let ephemeralKey = await crypto.subtle.generateKey({name: "X25519"}, true, ["deriveBits"]);
					let exported = await crypto.subtle.exportKey("jwk", ephemeralKey.publicKey);
					exported = { signedBy: "clientKey", usages: ["connfulSecureEphemeral"], key: exported };
					let signature = u8aToHex(new Uint8Array(await crypto.subtle.sign({ name: "Ed25519" }, newKeyKA, new TextEncoder().encode(JSON.stringify(exported)))));
					let _dataBufferPromise = null;
					let _rejectDataPromise = null;
					let dataBufferPromise = new Promise((r, e) => [_dataBufferPromise, _rejectDataPromise] = [r, e]);
					let _settlePromise = null;
					let _rejectPromise = null;
					let settlePromise = new Promise((r, e) => [_settlePromise, _rejectPromise] = [r, e]);
					let packetID = crypto.getRandomValues(new Uint8Array(32)).reduce((a, b) => a + b.toString(16).padStart(2, "0"), "");
					connections[connID + ":client"] = {
						ourKey: ephemeralKey,
						from: address,
						theirMainKeyReceived: false,
						theirKeyRaw: null,
						aesUsableKey: null,
						networkListenID,
						dataBuffer: [],
						dataBufferPromise,
						settlePromise,
						gateIfNeeded: gate
					}
					async function eventListener(e) {
						try {
							let packet = JSON.parse(e.data);
							if (!packet.from) {
								if (packet.event == "AddressUnreachable" && packet.packetID == packetID)
									_rejectPromise(new Error("ADDRESS_UNREACHABLE"));
								return;
							}
							if (packet.data.gate) return;
							if (packet.data.type == "connectionful" && packet.data.connectionID == connID && packet.data.action == "start") {
								if (connections[connID + ":client"].aesUsableKey) return;
								let theirUsableKey = await crypto.subtle.importKey("jwk", packet.data.content.keyInfo.key, { name: "X25519" }, true, []);
								let joinedKeys = await crypto.subtle.deriveBits({ name: "X25519", public: theirUsableKey }, ephemeralKey.privateKey, 256);
								let aesUsableKey = await crypto.subtle.importKey("raw", joinedKeys, {
									name: "AES-GCM"
								}, true, ["encrypt", "decrypt"]);
								connections[connID + ":client"].aesUsableKey = aesUsableKey;
								connections[connID + ":client"].theirKeyRaw = packet.data.content;
								let iv = crypto.getRandomValues(new Uint8Array(16));
								websocket.send(JSON.stringify({
									receiver: address,
									data: {
										type: "connectionful",
										action: "xchange",
										connectionID: connID,
										content: {
											iv: u8aToHex(iv),
											ct: u8aToHex(new Uint8Array(await crypto.subtle.encrypt({
												name: "AES-GCM",
												iv
											}, aesUsableKey, new TextEncoder().encode(JSON.stringify(exportedKA)))))
										},
										gate
									}
								}));
							} else if (packet.data.type == "connectionful" && packet.data.connectionID == connID && packet.data.action == "xchange") {
								if (connections[connID + ":client"].theirMainKeyReceived) return;
								let theirMainKeyDecrypt = JSON.parse(new TextDecoder().decode(await crypto.subtle.decrypt({
									name: "AES-GCM",
									iv: hexToU8A(packet.data.content.iv)
								}, connections[connID + ":client"].aesUsableKey, hexToU8A(packet.data.content.ct))));
								let usableMainKey = await crypto.subtle.importKey("jwk", theirMainKeyDecrypt.keyInfo.key, {name: "Ed25519"}, true, ["verify"]);
								let verifyKeySignature = await crypto.subtle.verify({ name: "Ed25519" }, usableMainKey, hexToU8A(connections[connID + ":client"].theirKeyRaw.signature), new TextEncoder().encode(JSON.stringify(connections[connID + ":client"].theirKeyRaw.keyInfo)));
								if (!doNotVerifyServer && verifyKeySignature) {
									try {
										let khrlFiles = await modules.fs.ls(modules.defaultSystem + "/etc/keys/khrl", processToken);
										let khrlSignatures = [];
										for (let khrlFile of khrlFiles) {
											let khrl = JSON.parse(await modules.fs.read(modules.defaultSystem + "/etc/keys/khrl/" + khrlFile, processToken));
											let khrlSignature = khrl.signature;
											delete khrl.signature;
											if (await crypto.subtle.verify({ name: "Ed25519" }, modules.ksk_imported, hexToU8A(khrlSignature), new TextEncoder().encode(JSON.stringify(khrl.list)))) {
												khrlSignatures.push(...khrl.list);
											}
										}
										verifyKeySignature = await recursiveKeyVerify(theirMainKeyDecrypt, khrlSignatures);
									} catch {
										verifyKeySignature = false;
									}
								}
								if (!verifyKeySignature || (!theirMainKeyDecrypt.keyInfo.usages.includes("connfulSecureServer:" + address) &&
										!theirMainKeyDecrypt.keyInfo.usages.includes("connfulSecureServer:" + verifyByDomain))) {
									_rejectPromise(new Error("SERVER_SIGNATURE_VERIFICATION_FAILED"));
									websocket.removeEventListener("message", eventListener);
									delete connections[connID + ":client"];
									delete networkListens[networkListenID];
									return websocket.send(JSON.stringify({
										receiver: address,
										data: {
											type: "connectionful",
											action: "drop",
											connectionID: connID,
											gate
										}
									}));
								}
								connections[connID + ":client"].theirMainKeyReceived = theirMainKeyDecrypt;
								websocket.send(JSON.stringify({
									receiver: address,
									data: {
										type: "connectionful",
										action: "nice2meetu",
										connectionID: connID,
										gate
									}
								}));
								_settlePromise();
							} else if (packet.data.type == "connectionful" && packet.data.connectionID == connID && packet.data.action == "drop") {
								if (connections[connID + ":client"].dying) return;
								_rejectPromise(new Error("CONNECTION_DROPPED"));
								if (_rejectDataPromise) _rejectDataPromise(new Error("CONNECTION_DROPPED"));
								websocket.send(JSON.stringify({
									receiver: address,
									data: {
										type: "connectionful",
										action: "drop",
										connectionID: connID,
										gate
									}
								}));
								connections[connID + ":client"].dying = true;
								websocket.removeEventListener("message", eventListener);
								delete networkListens[networkListenID];
								if (!connections[connID + ":client"].dataBuffer.length) delete connections[connID + ":client"];
							} else if (packet.data.type == "connectionful" && packet.data.connectionID == connID && packet.data.action == "data") {
								if (!connections[connID + ":client"].aesUsableKey) return;
								if (!connections[connID + ":client"].theirMainKeyReceived) return;
								if (connections[connID + ":client"].writingLock) await connections[connID + ":client"].writingLock;
								let writingLockRelease;
								let writingLock = new Promise(r => writingLockRelease = r);
								connections[connID + ":client"].writingLock = writingLock;
								connections[connID + ":client"].dataBuffer.push(new TextDecoder().decode(await crypto.subtle.decrypt({
									name: "AES-GCM",
									iv: hexToU8A(packet.data.content.iv)
								}, connections[connID + ":client"].aesUsableKey, hexToU8A(packet.data.content.ct))));
								if (!(connections[connID + ":client"].dataBuffer.length - 1)) {
									_dataBufferPromise();
									dataBufferPromise = new Promise((r, e) => [_dataBufferPromise, _rejectDataPromise] = [r, e]);
									connections[packet.data.connectionID + ":client"].dataBufferPromise = dataBufferPromise;
								}
								writingLockRelease();
							}
						} catch {}
					};
					networkListens[networkListenID] = { ws: websocket, gate: gate, fn: eventListener };
					websocket.addEventListener("message", eventListener);
					websocket.send(JSON.stringify({
						receiver: address,
						data: {
							type: "connectionful",
							action: "start",
							gate,
							connectionID: connID,
							content: { keyInfo: exported, signature }
						},
						id: packetID
					}));
					modules.network.runOnClose.then(function() {
						if (connections.hasOwnProperty(connID + ":client")) {
							connections[connID + ":client"].dying = true;
							if (!connections[connID + ":client"].dataBuffer.length) delete connections[connID + ":client"];
						}
						delete networkListens[networkListenID];
						_rejectPromise(new Error("NETWORK_CLOSED"));
						_rejectDataPromise(new Error("NETWORK_CLOSED"));
					});
					return connID + ":client";
				},
				connfulConnectionSettled: async function(connectionID) {
					if (!privileges.includes("CONNFUL_CONNECT")) throw new Error("UNAUTHORIZED_ACTION");
					if (!connections.hasOwnProperty(connectionID)) throw new Error("NO_SUCH_CONNECTION");
					await connections[connectionID].settlePromise;
				},
				connfulDisconnect: async function(connectionID) {
					if (!privileges.includes("CONNFUL_DISCONNECT")) throw new Error("UNAUTHORIZED_ACTION");
					if (!connections.hasOwnProperty(connectionID)) throw new Error("NO_SUCH_CONNECTION");
					if (connections[connectionID].dying) return;
					networkListens[connections[connectionID].networkListenID].ws.send(JSON.stringify({
						receiver: connections[connectionID].from,
						data: {
							type: "connectionful",
							action: "drop",
							connectionID: connectionID.slice(0, -7),
							gate: connections[connectionID].gateIfNeeded
						}
					}));
				},
				connfulForceDisconnect: async function(connectionID) {
					if (!privileges.includes("CONNFUL_DISCONNECT")) throw new Error("UNAUTHORIZED_ACTION");
					delete connections[connectionID];
				},
				connfulWrite: async function(sendOpts) {
					if (!privileges.includes("CONNFUL_WRITE")) throw new Error("UNAUTHORIZED_ACTION");
					if (!connections.hasOwnProperty(sendOpts.connectionID)) throw new Error("NO_SUCH_CONNECTION");
					if (connections[sendOpts.connectionID].dying) throw new Error("CONNECTION_DROPPED");
					let iv = crypto.getRandomValues(new Uint8Array(16));
					let u8aToHex = (u8a) => Array.from(u8a).map(a => a.toString(16).padStart(2, "0")).join("");
					networkListens[connections[sendOpts.connectionID].networkListenID].ws.send(JSON.stringify({
						receiver: connections[sendOpts.connectionID].from,
						data: {
							type: "connectionful",
							action: "data",
							content: {
								iv: u8aToHex(iv),
								ct: u8aToHex(new Uint8Array(await crypto.subtle.encrypt({
									name: "AES-GCM",
									iv
								}, connections[sendOpts.connectionID].aesUsableKey, new TextEncoder().encode(sendOpts.data))))
							},
							connectionID: sendOpts.connectionID.slice(0, -7),
							gate: connections[sendOpts.connectionID].gateIfNeeded
						}
					}));
				},
				connfulRead: async function(connectionID) {
					if (!privileges.includes("CONNFUL_READ")) throw new Error("UNAUTHORIZED_ACTION");
					if (!connections.hasOwnProperty(connectionID)) throw new Error("NO_SUCH_CONNECTION");
					if (!connections[connectionID].dataBuffer.length) await connections[connectionID].dataBufferPromise;
					let data = connections[connectionID].dataBuffer.shift();
					if (connections[connectionID].dying && connections[connectionID].dataBuffer.length == 0) delete connections[connectionID]; 
					return data;
				},
				connfulAddressGet: async function(connectionID) {
					if (!privileges.includes("CONNFUL_ADDRESS_GET")) throw new Error("UNAUTHORIZED_ACTION");
					if (!connections.hasOwnProperty(connectionID)) throw new Error("NO_SUCH_CONNECTION");
					return connections[connectionID].from;
				},
				connfulIdentityGet: async function(connectionID) {
					if (!privileges.includes("CONNFUL_IDENTITY_GET")) throw new Error("UNAUTHORIZED_ACTION");
					if (!connections.hasOwnProperty(connectionID)) throw new Error("NO_SUCH_CONNECTION");
					return connections[connectionID].theirMainKeyReceived;
				},
				systemUptime: async function() {
					if (!privileges.includes("SYSTEM_UPTIME")) throw new Error("UNAUTHORIZED_ACTION");
					return Math.floor(performance.now());
				},
				networkRawWrite: function(data) {
					if (!privileges.includes("NETWORK_RAW_WRITE")) throw new Error("UNAUTHORIZED_ACTION");
					let websocketHandle = modules.network.ws;
					if (!websocketHandle) throw new Error("NETWORK_UNREACHABLE");
					let websocket = modules.websocket._handles[websocketHandle].ws;
					if (websocket.readyState != 1) throw new Error("NETWORK_UNREACHABLE");
					websocket.send(data);
				},
				networkRawRead: function() {
					if (!privileges.includes("NETWORK_RAW_READ")) throw new Error("UNAUTHORIZED_ACTION");
					let websocketHandle = modules.network.ws;
					if (!websocketHandle) throw new Error("NETWORK_UNREACHABLE");
					let websocket = modules.websocket._handles[websocketHandle].ws;
					if (websocket.readyState != 1) throw new Error("NETWORK_UNREACHABLE");
					return Promise.race([ new Promise(async function(resolve) {
						networkListens[networkListenID] = { ws: websocket, fn: _ => resolve(_.data) };
						websocket.addEventListener("message", eventListener);
					}), new Promise((_, reject) => modules.network.runOnClose.then(_ => reject(new Error("NETWORK_CLOSED")))) ]);
				},
				getHostname: async function() {
					if (!privileges.includes("GET_HOSTNAME")) throw new Error("UNAUTHORIZED_ACTION");
					return modules.network.hostname;
				},
				resolve: async function(name) {
					if (!privileges.includes("RESOLVE_NAME")) throw new Error("UNAUTHORIZED_ACTION");
					let websocketHandle = modules.network.ws;
					if (!websocketHandle) throw new Error("NETWORK_UNREACHABLE");
					let websocket = modules.websocket._handles[websocketHandle].ws;
					if (websocket.readyState != 1) throw new Error("NETWORK_UNREACHABLE");
					let tlds = JSON.parse(await modules.fs.read(modules.defaultSystem + "/etc/tlds.json"));
					function resolveRecursive(name, address) {
						if (tlds.hasOwnProperty(name)) return tlds[name];
						if (address == null) return null;
						return new Promise(function(resolve) {
							let gate = "user_" + Array.from(crypto.getRandomValues(new Uint8Array(16))).map(a => a.toString(16).padStart(2, "0")).join("");
							let networkListenID = Array.from(crypto.getRandomValues(new Uint8Array(64))).map(a => a.toString(16).padStart(2, "0")).join("");
							function eventListener(e) {
								try {
									let packet = JSON.parse(e.data);
									if (packet.data.type == "connectionless" && packet.data.gate == gate && packet.from == address) {
										websocket.removeEventListener("message", eventListener);
										delete networkListens[networkListenID];
										resolve(packet.data.content);
									}
								} catch {}
							}
							networkListens[networkListenID] = { ws: websocket, fn: eventListener };
							websocket.addEventListener("message", eventListener);
							websocket.send(JSON.stringify({
								receiver: address,
								data: {
									type: "connectionless",
									gate: "resolve",
									content: {
										reply: gate,
										query: name
									}
								}
							}));
						});
					}
					let nameParts = name.split(".").reverse();
					let currentResolve;
					for (let part = 0; part < nameParts.length; part++) currentResolve = await resolveRecursive(nameParts.slice(0, part + 1).reverse().join("."), currentResolve);
					return currentResolve;
				},
				patchDiff: function(libraryOptions) {
					if (!privileges.includes("PATCH_DIFF")) throw new Error("UNAUTHORIZED_ACTION");
					if (!window.diff) throw new Error("MODULE_REQUIRED");
					let operations = { diff_core, diff, lcs, calcPatch, applyPatch, calcSlices };
					return [ ...operations[libraryOptions.operation](...libraryOptions.args) ];
				},
				setFirmware: async function(new_flash) {
					if (!privileges.includes("SET_FIRMWARE")) throw new Error("UNAUTHORIZED_ACTION");
					if (modules.core.setFW) {
						await modules.core.setFW(new_flash);
						return;
					}
					localStorage.setItem("runtime_flash", new_flash);
				},
				reloadNetworkConfig: async function() {
					if (!privileges.includes("RELOAD_NETWORK_CONFIG")) throw new Error("UNAUTHORIZED_ACTION");
					await modules.network.reloadConfig();
				},
				batteryStatus: async function() {
					if (!privileges.includes("GET_BATTERY_STATUS")) throw new Error("UNAUTHORIZED_ACTION");
					let battery = await navigator.getBattery();
					return {
						charging: battery.charging,
						level: battery.level,
						chargingTime: battery.chargingTime,
						dischargingTime: battery.dischargingTime
					};
				},
				getUpdateService: async function() {
					if (!privileges.includes("GET_UPDATE_SERVICE")) throw new Error("UNAUTHORIZED_ACTION");
					return modules.network.updates;
				}
			}
		}
		let customAPIs = modules.customAPIs;
		if (customAPIs) {
			for (let api in (customAPIs.public || {})) apis.public[api] = async (...args) => customAPIs.public[api](processToken, ...args);
			for (let api in (customAPIs.private || {})) apis.private[api] = async (...args) => customAPIs.private[api](processToken, ...args);
		}
		return apis;
	}
}
reeAPIs();