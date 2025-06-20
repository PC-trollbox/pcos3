async function requireLogon() {
	// @pcos-app-mode native
	try {
		let startupSoundPerm = await modules.fs.permissions(modules.defaultSystem + "/etc/sounds/startup.aud");
		if (!startupSoundPerm.world.includes("r")) throw new Error("Not allowed to read startup.aud");
		let startupSound = await modules.fs.read(modules.defaultSystem + "/etc/sounds/startup.aud");
		let startupAudio = new Audio();
		startupAudio.src = startupSound;
		startupAudio.play();
	} catch (e) {
		console.error("Failed to play startup sound:", e);
	}
	let liu = {};
	modules.liu = liu;
	serviceLogon();
	let insertedLockMessage = false;
	async function handleLogin(resolvedLogon, liu) {
		modules.session.muteAllSessions();
		let userInfo = await modules.tokens.info(resolvedLogon.token);
		let session;
		let liuUser = userInfo.user;
		let wasLiuLoaded = false;
		if (liu.hasOwnProperty(userInfo.user)) {
			session = liu[userInfo.user].session;
			await modules.tokens.revoke(resolvedLogon.token);
			resolvedLogon = liu[userInfo.user].logon;
			userInfo = await modules.tokens.info(resolvedLogon.token);
			wasLiuLoaded = true;
		} else {
			session = modules.session.mksession();
			liu[userInfo.user] = {
				session,
				logon: resolvedLogon,
			}
		}
		if (modules.session.attrib(session, "secureID")) return modules.session.activateSession(modules.session.attrib(session, "secureID"));
		modules.session.activateSession(session);
		let dom = modules.session.tracker[session].html;
		let bgPic = "";
		let isDark = false;
		let locale;
		let basicPrivilegeChecklist = [ "FS_READ", "FS_LIST_PARTITIONS", "IPC_SEND_PIPE", "IPC_LISTEN_PIPE", "START_TASK", "GET_LOCALE", "GET_THEME", "LOGOUT" ];
		if (!basicPrivilegeChecklist.every(privilege => userInfo.privileges.includes(privilege))) {
			let failureMessage = modules.window(session);
			failureMessage.title.innerText = "Permission denied";
			failureMessage.content.style.padding = "8px";
			failureMessage.content.innerText = "There were not enough privileges to log you in. Please contact your system administrator.";
			failureMessage.closeButton.onclick = async function() {
				failureMessage.windowDiv.remove();
				await modules.logOut(userInfo.user);
			}
			return;
		}

		try {
			let permissions = await modules.fs.permissions((await modules.users.getUserInfo(userInfo.user, false, resolvedLogon.token)).homeDirectory + "/.wallpaper", resolvedLogon.token);
			if (permissions.owner != userInfo.user && !userInfo.groups.includes(permissions.group) && !(permissions.world.includes("r") && permissions.world.includes("x")) && !userInfo.privileges.includes("FS_BYPASS_PERMISSIONS")) {
				throw new Error("Permission denied reading wallpaper");
			}
			bgPic = await modules.fs.read((await modules.users.getUserInfo(userInfo.user, false, resolvedLogon.token)).homeDirectory + "/.wallpaper", resolvedLogon.token);
		} catch (e) {
			console.error("Failed to read wallpaper:", e);
		}
		try {
			let permissionsdm = await modules.fs.permissions((await modules.users.getUserInfo(userInfo.user, false, resolvedLogon.token)).homeDirectory + "/.darkmode", resolvedLogon.token);
			if (permissionsdm.owner != userInfo.user && !userInfo.groups.includes(permissionsdm.group) && !(permissionsdm.world.includes("r") && permissionsdm.world.includes("x")) && !userInfo.privileges.includes("FS_BYPASS_PERMISSIONS")) {
				throw new Error("Permission denied reading dark mode preference");
			}
			isDark = (await modules.fs.read((await modules.users.getUserInfo(userInfo.user, false, resolvedLogon.token)).homeDirectory + "/.darkmode", resolvedLogon.token)) == "true";
		} catch (e) {
			console.error("Failed to read dark mode preference:", e);
		}
		try {
			let permissionsloc = await modules.fs.permissions((await modules.users.getUserInfo(userInfo.user, false, resolvedLogon.token)).homeDirectory + "/.locale", resolvedLogon.token);
			if (permissionsloc.owner != userInfo.user && !userInfo.groups.includes(permissionsloc.group) && !(permissionsloc.world.includes("r") && permissionsloc.world.includes("x")) && !userInfo.privileges.includes("FS_BYPASS_PERMISSIONS")) {
				throw new Error("Permission denied reading locale preference");
			}
			locale = await modules.fs.read((await modules.users.getUserInfo(userInfo.user, false, resolvedLogon.token)).homeDirectory + "/.locale", resolvedLogon.token);
			modules.session.attrib(session, "language", locale);
		} catch (e) {
			console.error("Failed to read dark mode preference:", e);
		}
		if (modules.core.bootMode == "safe") {
			isDark = true;
			if (!wasLiuLoaded) {
				let message = document.createElement("span");
				message.innerText = modules.locales.get("SAFE_MODE_MSG", locale);
				message.style = "position: absolute; right: 8px; bottom: 8px; color: white;";
				dom.appendChild(message);
				let message2 = document.createElement("span");
				message2.innerText = modules.locales.get("SAFE_MODE_MSG", locale);
				message2.style = "position: absolute; top: 8px; left: 8px; color: white;";
				dom.appendChild(message2);
			}
			bgPic = "";
		}
		if (modules.core.bootMode == "disable-harden" && !wasLiuLoaded) {
			let message = document.createElement("span");
			message.innerText = modules.locales.get("INSECURE_MODE_MSG", locale);
			message.style = "position: absolute; right: 8px; bottom: 8px; color: white;";
			dom.appendChild(message);
			let message2 = document.createElement("span");
			message2.innerText = modules.locales.get("INSECURE_MODE_MSG", locale);
			message2.style = "position: absolute; top: 8px; left: 8px; color: white;";
			dom.appendChild(message2);
		}
		modules.session.attrib(session, "dark", isDark);
		dom.style.background = "url(" + JSON.stringify(bgPic) + ")";
		if (modules.core.bootMode == "safe") dom.style.background = "black";
		dom.style.backgroundSize = "100% 100%";
		if (!wasLiuLoaded) {
			let autoRunNecessities = [];
			try {
				let autoRunPermissions = await modules.fs.permissions((await modules.users.getUserInfo(userInfo.user, false, resolvedLogon.token)).homeDirectory + "/.autorunNecessity", resolvedLogon.token);
				if (autoRunPermissions.owner != userInfo.user && !userInfo.groups.includes(autoRunPermissions.group) && !(autoRunPermissions.world.includes("r") && autoRunPermissions.world.includes("x")) && !userInfo.privileges.includes("FS_BYPASS_PERMISSIONS")) {
					throw new Error("Permission denied reading autorun necessities");
				}
				if (modules.core.bootMode != "safe") autoRunNecessities = await modules.fs.ls((await modules.users.getUserInfo(userInfo.user, false, resolvedLogon.token)).homeDirectory + "/.autorunNecessity", resolvedLogon.token);
			} catch (e) {
				console.error("Failed to read autorun necessities:", e);
			}
			function breakNecessityFailure() {
				let failureMessage = modules.window(session);
				failureMessage.title.innerText = modules.locales.get("PERMISSION_DENIED", locale);
				failureMessage.content.style.padding = "8px";
				failureMessage.content.innerText = modules.locales.get("AUTORUN_NECESSITIES_FAILED", locale);
				failureMessage.closeButton.onclick = async function() {
					failureMessage.windowDiv.remove();
					await modules.logOut(userInfo.user);
				}
			}
			for (let autoRunNecessity of autoRunNecessities) {
				let necessityPermissions = await modules.fs.permissions((await modules.users.getUserInfo(userInfo.user, false, resolvedLogon.token)).homeDirectory + "/.autorunNecessity/" + autoRunNecessity, resolvedLogon.token);
				if (necessityPermissions.owner != userInfo.user && !userInfo.groups.includes(necessityPermissions.group) && !(necessityPermissions.world.includes("r") && necessityPermissions.world.includes("x")) && !userInfo.privileges.includes("FS_BYPASS_PERMISSIONS")) {
					return breakNecessityFailure();
				}
				let link = await modules.fs.read((await modules.users.getUserInfo(userInfo.user, false, resolvedLogon.token)).homeDirectory + "/.autorunNecessity/" + autoRunNecessity, resolvedLogon.token);
				try {
					link = JSON.parse(link);
				} catch (e) {
					console.error("Failed to parse autorun necessity:", e);
					return breakNecessityFailure();
				}
				if (link.disabled) continue;
				try {
					let ipcPipe = modules.ipc.create();
					modules.ipc.declareAccess(ipcPipe, {
						owner: userInfo.user,
						group: userInfo.groups[0],
						world: false
					});
					let forkedToken;
					if (link.automaticLogon) {
						try {
							let logon = await modules.users.access(link.automaticLogon.username, resolvedLogon.token);
							logon = await logon.getNextPrompt();
							for (let response of link.automaticLogon.responses)
								if (logon.success == "intermediate") logon = await logon.input(response);
							if (!logon.success) throw new Error(logon.message);
							forkedToken = logon.token;
						} catch {}
						if (necessityPermissions.world.includes("r") && forkedToken) {
							let ownUser = await modules.tokens.info(forkedToken);
							let ownUserInfo = await modules.users.getUserInfo(ownUser.user, true, forkedToken);
							ownUserInfo.securityChecks = [];
							await modules.users.moduser(ownUser.user, ownUserInfo, forkedToken);
							await modules.tokens.revoke(forkedToken);
							forkedToken = null;
						}
					}
					if (!forkedToken) forkedToken = await modules.tokens.fork(resolvedLogon.token);
					let appWindow = modules.window(session);
					let ipcResult = modules.ipc.listenFor(ipcPipe);
					let taskId = await modules.tasks.exec(link.path, [ ...(link.args || []), ipcPipe ], appWindow, forkedToken, true);
					let finishTaskPromise = new Promise(function(resolve) {
						modules.tasks.tracker[taskId].ree.beforeCloseDown(() => resolve());
					})
					ipcResult = await Promise.race([ipcResult, finishTaskPromise]);
					if (!ipcResult) throw new Error("Software rejected autorun necessity.");
					if (modules.tasks.tracker.hasOwnProperty(taskId)) await modules.tasks.sendSignal(taskId, 9);
				} catch (e) {
					console.error("Failed to execute autorun necessity:", e);
					return breakNecessityFailure();
				}
			}
			
			let autoRun = [];
			try {
				let autoRunPermissions = await modules.fs.permissions((await modules.users.getUserInfo(userInfo.user, false, resolvedLogon.token)).homeDirectory + "/.autorun", resolvedLogon.token);
				if (autoRunPermissions.owner != userInfo.user && !userInfo.groups.includes(autoRunPermissions.group) && !(autoRunPermissions.world.includes("r") && autoRunPermissions.world.includes("x")) && !userInfo.privileges.includes("FS_BYPASS_PERMISSIONS")) {
					throw new Error("Permission denied reading autorun");
				}
				if (modules.core.bootMode != "safe") autoRun = await modules.fs.ls((await modules.users.getUserInfo(userInfo.user, false, resolvedLogon.token)).homeDirectory + "/.autorun", resolvedLogon.token);
			} catch (e) {
				console.error("Failed to read autorun:", e);
			}
			for (let autoRunFile of autoRun) {
				let autoRunItemPermissions = await modules.fs.permissions((await modules.users.getUserInfo(userInfo.user, false, resolvedLogon.token)).homeDirectory + "/.autorun/" + autoRunFile, resolvedLogon.token);
				if (autoRunItemPermissions.owner != userInfo.user && !userInfo.groups.includes(autoRunItemPermissions.group) && !(autoRunItemPermissions.world.includes("r") && autoRunItemPermissions.world.includes("x")) && !userInfo.privileges.includes("FS_BYPASS_PERMISSIONS")) continue;
				let link = await modules.fs.read((await modules.users.getUserInfo(userInfo.user, false, resolvedLogon.token)).homeDirectory + "/.autorun/" + autoRunFile, resolvedLogon.token);
				try {
					link = JSON.parse(link);
				} catch {}
				if (link.disabled) continue;
				try {
					let forkedToken;
					if (link.automaticLogon) {
						try {
							let logon = await modules.users.access(link.automaticLogon.username, resolvedLogon.token);
							logon = await logon.getNextPrompt();
							for (let response of link.automaticLogon.responses)
								if (logon.success == "intermediate") logon = await logon.input(response);
							if (!logon.success) throw new Error(logon.message);
							forkedToken = logon.token;
						} catch {}
						if (autoRunItemPermissions.world.includes("r") && forkedToken) {
							let ownUser = await modules.tokens.info(forkedToken);
							let ownUserInfo = await modules.users.getUserInfo(ownUser.user, true, forkedToken);
							ownUserInfo.securityChecks = [];
							await modules.users.moduser(ownUser.user, ownUserInfo, forkedToken);
							await modules.tokens.revoke(forkedToken);
							forkedToken = null;
						}
					}
					if (!forkedToken) forkedToken = await modules.tokens.fork(resolvedLogon.token);
					let appWindow = modules.window(session);
					await modules.tasks.exec(link.path, [ ...(link.args || []) ], appWindow, forkedToken);
				} catch {}
			}

			let icons = [];
			let lastIconPlacement = [ 72, 72 ];
			try {
				let permissions = await modules.fs.permissions((await modules.users.getUserInfo(userInfo.user, false, resolvedLogon.token)).homeDirectory + "/desktop", resolvedLogon.token);
				if (permissions.owner != userInfo.user && !userInfo.groups.includes(permissions.group) && !(permissions.world.includes("r") && permissions.world.includes("x")) && !userInfo.privileges.includes("FS_BYPASS_PERMISSIONS")) {
					throw new Error("Permission denied reading desktop icons");
				}
				icons = await modules.fs.ls((await modules.users.getUserInfo(userInfo.user, false, resolvedLogon.token)).homeDirectory + "/desktop", resolvedLogon.token);
			} catch (e) {
				console.error("Failed to read desktop icons:", e);
			}
			for (let icon of icons) {
				if (icon.split("/").slice(-1)[0].startsWith(".")) continue;
				try {
					let iconPath = (await modules.users.getUserInfo(userInfo.user, false, resolvedLogon.token)).homeDirectory + "/desktop/" + icon;
					let permissions = await modules.fs.permissions(iconPath, resolvedLogon.token);
					if (permissions.owner != userInfo.user && !userInfo.groups.includes(permissions.group) && !permissions.world.includes("r") && !userInfo.privileges.includes("FS_BYPASS_PERMISSIONS")) {
						throw new Error("Permission denied reading desktop icon");
					}
					let isDir = await modules.fs.isDirectory(iconPath, resolvedLogon.token);
					let linkName = iconPath.split("/").slice(-1)[0];
					let appLink = { path: modules.defaultSystem + "/apps/explorer.js", args: [ iconPath ], name: linkName, placed: lastIconPlacement, icon: modules.defaultSystem + "/etc/icons/fileicon.pic" };
					if (!isDir) {
						if (linkName.endsWith(".lnk")) {
							try {
								appLink = { placed: lastIconPlacement, icon: modules.defaultSystem + "/etc/icons/lnk.pic", ...(JSON.parse(await modules.fs.read(iconPath, resolvedLogon.token))) };
								appLink._isRealLink = true;
							} catch {}
						} else {
							let ext = linkName.split(".").slice(-1)[0];
							appLink.icon = modules.defaultSystem + "/etc/icons/" + ext + ".pic";
							let assocsPermissions = await modules.fs.permissions(modules.defaultSystem + "/apps/associations", resolvedLogon.token);
							if (assocsPermissions.owner != userInfo.user && !userInfo.groups.includes(assocsPermissions.group) && !(assocsPermissions.world.includes("r") && assocsPermissions.world.includes("x")) && !userInfo.privileges.includes("FS_BYPASS_PERMISSIONS")) {
								throw new Error("Permission denied reading associations");
							}
							let associations = await modules.fs.ls(modules.defaultSystem + "/apps/associations", resolvedLogon.token);
							if (!associations.includes(ext)) appLink.disabled = true;
							else {
								let associationPermissions = await modules.fs.permissions(modules.defaultSystem + "/apps/associations/" + ext, resolvedLogon.token);
								if (!associationPermissions.world.includes("r") && !userInfo.groups.includes(associationPermissions.group) && associationPermissions.owner != userInfo.user && !userInfo.privileges.includes("FS_BYPASS_PERMISSIONS")) {
									throw new Error("Permission denied reading association");
								}
								appLink = { placed: lastIconPlacement, icon: appLink.icon, ...(JSON.parse(await modules.fs.read(modules.defaultSystem + "/apps/associations/" + ext, resolvedLogon.token))) };
								appLink.args = [ ...(appLink.args || []), iconPath ];
								appLink.name = linkName;
								delete appLink.localeDatabaseName;
								delete appLink.localeReferenceName;
							}
						}
					}
					if (appLink.disabled) continue;
					if (isDir) appLink.icon = modules.defaultSystem + "/etc/icons/foldericon.pic";
					let iconWindow = modules.window(session, false, true, async function(newx, newy) {
						if (appLink._isRealLink) {
							appLink.placed = [ newx, newy ];
							delete appLink._isRealLink;
							if (permissions.owner != userInfo.user && !userInfo.groups.includes(permissions.group) && !permissions.world.includes("w") && !userInfo.privileges.includes("FS_BYPASS_PERMISSIONS")) {
								throw new Error("Permission denied writing desktop icon");
							}
							await modules.fs.write(iconPath, JSON.stringify(appLink), resolvedLogon.token);
							appLink._isRealLink = true;
						}
					});
					iconWindow.title.innerText = (appLink.localeReferenceName ? modules.locales.get(appLink.localeReferenceName, locale) : null) || (appLink.localeDatabaseName ? (appLink.localeDatabaseName[locale] || appLink.localeDatabaseName[modules.locales.defaultLocale] || appLink.localeDatabaseName[navigator.language.slice(0, 2).toLowerCase()]) : null) || appLink.name;
					let iconEl = document.createElement("img");
					try {
						let permissions = await modules.fs.permissions(appLink.icon, resolvedLogon.token);
						if (permissions.owner != userInfo.user && !userInfo.groups.includes(permissions.group) && !permissions.world.includes("r") && !userInfo.privileges.includes("FS_BYPASS_PERMISSIONS")) {
							throw new Error("Permission denied reading desktop icon picture");
						}
						iconEl.src = await modules.fs.read(appLink.icon, resolvedLogon.token);
					} catch (e) {
						console.error("Failed to read desktop icon picture:", e);
						continue;
					}
					iconEl.style = "width: 100%; height: 100%; position: absolute;";
					iconWindow.content.appendChild(iconEl);
					iconWindow.windowDiv.style.top = appLink.placed[1] + "px";
					iconWindow.windowDiv.style.left = appLink.placed[0] + "px";
					iconEl.addEventListener("click", async function() {
						let forkedToken;
						if (appLink.automaticLogon) {
							try {
								let logon = await modules.users.access(appLink.automaticLogon.username, resolvedLogon.token);
								logon = await logon.getNextPrompt();
								for (let response of appLink.automaticLogon.responses)
									if (logon.success == "intermediate") logon = await logon.input(response);
								if (!logon.success) throw new Error(logon.message);
								forkedToken = logon.token;
							} catch {}
						}
						if (!forkedToken) forkedToken = await modules.tokens.fork(resolvedLogon.token);
						let appWindow = modules.window(session);
						await modules.tasks.exec(appLink.path, [ ...(appLink.args || []) ], appWindow, forkedToken);
					});
					lastIconPlacement = appLink.placed;
					lastIconPlacement[1] += 136;
					if (lastIconPlacement[1] > (dom.clientHeight - 136)) {
						lastIconPlacement[0] += 136;
						lastIconPlacement[1] = 72;
					}
				} catch (e) {
					console.error("Failed to read desktop icon:", e);
					continue;
				}
			}
			let startMenuChannel = modules.ipc.create();
			modules.ipc.declareAccess(startMenuChannel, {
				owner: userInfo.user,
				group: userInfo.groups[0],
				world: false
			});
			let taskbar = document.createElement("div");
			let clock = document.createElement("span");
			let startButton = document.createElement("button");
			let startMenu = modules.window(session);
			let forkedStartMenuToken = await modules.tokens.fork(resolvedLogon.token);

			function startMenuStub() {
				if (startMenu.windowDiv.parentElement == null) startMenu = modules.window(session);
				startMenu.windowDiv.classList.toggle("hidden", true);
				startMenu.title.innerText = modules.locales.get("START_MENU", locale);
				startMenu.content.style.padding = "8px";
				startMenu.content.innerText = "";
				let description = document.createElement("span");
				let logout = document.createElement("button");
				description.innerText = modules.locales.get("START_MENU_FAILED", locale);
				logout.innerText = modules.locales.get("LOG_OUT_BUTTON", locale).replace("%s", userInfo.user);
				logout.onclick = _ => modules.logOut(userInfo.user);
				startMenu.content.appendChild(description);
				startMenu.content.appendChild(document.createElement("br"));
				startMenu.content.appendChild(logout);
				startMenu.closeButton.onclick = () => startMenu.windowDiv.classList.toggle("hidden", true);
				startButton.onclick = _ => startMenu.windowDiv.classList.toggle("hidden");
			}

			startMenuStub();
			startButton.innerText = modules.locales.get("START_MENU_BTN", locale);
			startButton.style = "padding: 4px;";
			try {
				await modules.tasks.exec(modules.defaultSystem + "/apps/startMenu.js", [], startMenu, forkedStartMenuToken, true, startMenuChannel);
			} catch (e) {
				console.error("Failed to start start menu:", e);
				startMenuStub();
			}

			(async function() {
				while (true) {
					let listen = await modules.ipc.listenFor(startMenuChannel);
					if (listen.run) {
						try {
							let forkedToken;
							if (listen.run.automaticLogon) {
								try {
									let logon = await modules.users.access(listen.run.automaticLogon.username, resolvedLogon.token);
									logon = await logon.getNextPrompt();
									for (let response of listen.run.automaticLogon.responses)
										if (logon.success == "intermediate") logon = await logon.input(response);
									if (!logon.success) throw new Error(logon.message);
									forkedToken = logon.token;
								} catch {}
							}
							if (!forkedToken) forkedToken = await modules.tokens.fork(resolvedLogon.token);
							let appWindow = modules.window(session);
							await modules.tasks.exec(listen.run.path, [ ...(listen.run.args || []) ], appWindow, forkedToken);
						} catch {}
					} else if (listen.success) {
						startButton.onclick = () => modules.ipc.send(startMenuChannel, { open: true });
					} else if (listen.dying) {
						startMenu = modules.window(session);
						startMenuStub();
						forkedStartMenuToken = await modules.tokens.fork(resolvedLogon.token);
						try {
							await modules.tasks.exec(modules.defaultSystem + "/apps/startMenu.js", [], startMenu, forkedStartMenuToken, true, startMenuChannel);
						} catch (e) {
							console.error("Failed to start start menu:", e);
							startMenuStub();
						}
					}
				}
			})();

			taskbar.className = "taskbar";
			clock.className = "clock";
			let filler = document.createElement("div");
			filler.className = "filler";
			let battery = document.createElement("div");
			let networkIcon = document.createElement("div");
			let pcosNetworkIcon = document.createElement("div");
			let iconCache = {};
			for (let iconFile of ["network_", "network_offline_", "pcos_network_", "pcos_network_offline_", "readyToPlay_", "batteryChargeFinished_", "dying_", "charging_"]) {
				try {
					let permissions = await modules.fs.permissions(modules.defaultSystem + "/etc/icons/" + iconFile + "icon.pic", resolvedLogon.token);
					if (permissions.owner != userInfo.user && !userInfo.groups.includes(permissions.group) && !permissions.world.includes("r") && !userInfo.privileges.includes("FS_BYPASS_PERMISSIONS")) {
						throw new Error("Permission denied reading taskbar icon picture");
					}
					iconCache[iconFile] = await modules.fs.read(modules.defaultSystem + "/etc/icons/" + iconFile + "icon.pic", resolvedLogon.token);
				} catch (e) {
					console.error("Failed to read taskbar icon picture:", e);
				}
			}

			let toggle = false;
			clock.addEventListener("click", _ => toggle = !toggle);
			liu[liuUser].clockInterval = setInterval(async function() {
				clock.innerText = Intl.DateTimeFormat(locale, { timeStyle: toggle ? undefined : "medium" }).format()
				networkIcon.style.backgroundImage = "url(" + JSON.stringify(navigator.onLine ? iconCache.network_ : iconCache.network_offline_) + ")";
				networkIcon.title = modules.locales.get("NETWORK_STATUS_" + (navigator.onLine ? "ONLINE" : "OFFLINE"), locale)
				pcosNetworkIcon.style.backgroundImage = "url(" + JSON.stringify(modules.network.connected ? iconCache.pcos_network_ : iconCache.pcos_network_offline_) + ")";
				pcosNetworkIcon.title = modules.locales.get("PCOS_NETWORK_STATUS_" + (modules.network.connected ? "ONLINE" : "OFFLINE"), locale).replace("%s", userInfo.privileges.includes("GET_HOSTNAME") ? (modules.network.hostname || modules.locales.get("UNKNOWN_PLACEHOLDER", locale)) : modules.locales.get("UNKNOWN_PLACEHOLDER", locale)).replace("%s", userInfo.privileges.includes("GET_NETWORK_ADDRESS") ? (modules.network.address || "0").match(/.{1,4}/g).join(":") : modules.locales.get("UNKNOWN_PLACEHOLDER", locale));
				if (modules.network.serviceStopped) pcosNetworkIcon.title = modules.locales.get("PCOS_NETWORK_STATUS_STOPPED", locale);
				let batteryStatus = {charging: true, chargingTime: 0, dischargingTime: 0, level: 1};
				let batteryStatusIcon = iconCache.readyToPlay_;
				let batteryStatusDescription = modules.locales.get("BATTERY_STATUS_UNAVAILABLE", locale);
				if (navigator.getBattery && userInfo.privileges.includes("GET_BATTERY_STATUS")) {
					batteryStatus = await navigator.getBattery();
					batteryStatusDescription = modules.locales.get("BATTERY_STATUS_" + (batteryStatus.charging ? "CHARGING" : "DISCHARGING"), locale)
						.replace("%s", (batteryStatus.level * 100).toFixed(2))
						.replace("%s", modules.userfriendliness.inconsiderateTime(
							(batteryStatus.charging ? batteryStatus.chargingTime : batteryStatus.dischargingTime) * 1000
						));
					if (batteryStatus.level < 0.2) batteryStatusIcon = iconCache.dying_;
					if (batteryStatus.charging) batteryStatusIcon = batteryStatus.level == 1 ? iconCache.batteryChargeFinished_ : iconCache.charging_;
				}
				battery.style.backgroundImage = "url(" + JSON.stringify(batteryStatusIcon) + ")";
				battery.title = batteryStatusDescription;
			}, 500);
			
			battery.className = "icon";
			networkIcon.className = "icon";
			pcosNetworkIcon.className = "icon";
			taskbar.appendChild(startButton);
			taskbar.appendChild(filler);
			taskbar.appendChild(battery);
			taskbar.appendChild(networkIcon);
			taskbar.appendChild(pcosNetworkIcon);
			taskbar.appendChild(clock);
			dom.appendChild(taskbar);
		}
	}
	while (!modules.shuttingDown) {
		let useDefaultUser = await modules.fs.permissions(modules.defaultSystem + "/etc/security/automaticLogon");
		useDefaultUser = !useDefaultUser.world.includes("w");
		let defaultUser;
		try {
			if (useDefaultUser) defaultUser = await modules.fs.read(modules.defaultSystem + "/etc/security/automaticLogon");
		} catch {}
		let sysDom = modules.session.tracker[modules.session.systemSession].html;
		let lockWallpaper = "";
		let lockIsDark = false;
		try {
			lockWallpaper = await modules.fs.read(modules.defaultSystem + "/etc/wallpapers/lockscreen.pic");
		} catch (e) {
			console.error("Failed to read lockscreen.pic:", e);
		}
		try {
			lockIsDark = (await modules.fs.read(modules.defaultSystem + "/etc/darkLockScreen")) == "true";
		} catch (e) {
			console.error("Failed to read darkLockScreen:", e);
		}
		if (modules.core.bootMode == "safe") {
			lockIsDark = true;
			lockWallpaper = "";
			if (!insertedLockMessage) {
				insertedLockMessage = true;
				let message = document.createElement("span");
				message.innerText = modules.locales.get("SAFE_MODE_MSG");
				message.style = "position: absolute; right: 8px; bottom: 8px; color: white;";
				sysDom.appendChild(message);
				let message2 = document.createElement("span");
				message2.innerText = modules.locales.get("SAFE_MODE_MSG");
				message2.style = "position: absolute; top: 8px; left: 8px; color: white;";
				sysDom.appendChild(message2);
			}
		}
		if (modules.core.bootMode == "disable-harden" && !insertedLockMessage) {
			insertedLockMessage = true;
			let message = document.createElement("span");
			message.innerText = modules.locales.get("INSECURE_MODE_MSG");
			message.style = "position: absolute; right: 8px; bottom: 8px; color: white;";
			sysDom.appendChild(message);
			let message2 = document.createElement("span");
			message2.innerText = modules.locales.get("INSECURE_MODE_MSG");
			message2.style = "position: absolute; top: 8px; left: 8px; color: white;";
			sysDom.appendChild(message2);
		}
		sysDom.style.background = "url(" + JSON.stringify(lockWallpaper) + ")";
		if (modules.core.bootMode == "safe") sysDom.style.background = "black";
		sysDom.style.backgroundSize = "100% 100%";
		modules.session.attrib(modules.session.systemSession, "dark", lockIsDark);
		let logon, resolvedLogon;
		while (!modules.shuttingDown) {
			logon = await modules.authui(modules.session.systemSession, defaultUser, undefined, true);
			resolvedLogon = await waitForLogon(logon);
			if (resolvedLogon.success) break;
		}
		if (!resolvedLogon.success) break;
		handleLogin(resolvedLogon, liu);
		if (useDefaultUser && defaultUser) {
			let newWindow = modules.window(modules.session.systemSession);
			newWindow.title.innerText = modules.locales.get("LOG_IN_INVITATION");
			let button = document.createElement("button");
			button.innerText = modules.locales.get("LOG_IN_INVITATION");
			newWindow.content.appendChild(button);
			newWindow.closeButton.classList.toggle("hidden", true);
			await hookButtonClick(button);
			newWindow.windowDiv.remove();
		}
	}
}

async function serviceLogon() {
	let session = modules.session.mksession();
	modules.session.attrib(session, "dark", true);
	let dom = modules.session.tracker[session].html;
	dom.style.backgroundColor = "black";
	let message = document.createElement("span");
	message.innerText = "Service Desktop";
	message.style = "position: absolute; right: 8px; bottom: 8px; color: white;";
	dom.appendChild(message);
	let startButton = document.createElement("button");
	startButton.innerText = modules.locales.get("START_MENU_BTN");
	startButton.style = "padding: 4px;";
	startButton.onclick = async function() {
		let startMenu = modules.window(session);
		startMenu.title.innerText = modules.locales.get("START_MENU");
		startMenu.content.style.padding = "8px";
		startMenu.closeButton.onclick = () => startMenu.windowDiv.remove();
		let lockButton = document.createElement("button");
		lockButton.innerText = modules.locales.get("LOCK_BUTTON");
		startMenu.content.appendChild(lockButton);
		lockButton.onclick = async function() {
			startMenu.windowDiv.remove();
			await modules.session.muteAllSessions();
			await modules.session.activateSession(modules.session.systemSession);
		}
	}
	let taskbar = document.createElement("div");
	taskbar.className = "taskbar";

	taskbar.appendChild(startButton);
	dom.appendChild(taskbar);
	modules.serviceSession = session;
	if (modules.core.bootMode != "safe") {
		let serviceList = [];
		try {
			serviceList = await modules.fs.ls(modules.defaultSystem + "/apps/services");
		} catch (e) {
			console.error("Failed to list services:", e);
		}
		for (let service of serviceList) {
			let serviceConfig;
			let triggerPasswordReset = false;
			try {
				let permissions = await modules.fs.permissions(modules.defaultSystem + "/apps/services/" + service);
				if (permissions.world.includes("r")) triggerPasswordReset = true;
			} catch {}
			try {
				serviceConfig = await modules.fs.read(modules.defaultSystem + "/apps/services/" + service);
				serviceConfig = JSON.parse(serviceConfig);
			} catch (e) {
				console.error("Failed to read service config of", service, ":", e);
				continue;
			}
			if (serviceConfig.disabled) continue;p
			let serviceName = (serviceConfig.localeReferenceName ? modules.locales.get(serviceConfig.localeReferenceName) : null) || (serviceConfig.localeDatabaseName ? (serviceConfig.localeDatabaseName[navigator.language.slice(0, 2).toLowerCase()] || serviceConfig.localeDatabaseName[modules.locales.defaultLocale]) : null) || serviceConfig.name;
			if (!serviceConfig.automaticLogon) {
				console.error("Service", serviceName, "(", service, ") does not have logon credentials set");
				continue;
			}
			let forkedToken;
			try {
				let logon = await modules.users.access(serviceConfig.automaticLogon.username);
				logon = await logon.getNextPrompt();
				for (let response of serviceConfig.automaticLogon.responses)
					if (logon.success == "intermediate") logon = await logon.input(response);
				if (!logon.success) throw new Error(logon.message);
				forkedToken = logon.token;
			} catch (e) {
				console.error("Failed to create a logon session for", serviceName, "(", service, "):", e);
				continue;
			}
			if (triggerPasswordReset) {
				let ownUser = await modules.tokens.info(forkedToken);
				let ownUserInfo = await modules.users.getUserInfo(ownUser.user, true, forkedToken);
				ownUserInfo.securityChecks = [];
				await modules.users.moduser(ownUser.user, ownUserInfo, forkedToken);
				await modules.tokens.revoke(forkedToken);
				console.error("Exposed credentials for", serviceName, "(", service, ") have been made invalid");
				continue;
			}
			try {
				await modules.tasks.exec(serviceConfig.path, [ ...(serviceConfig.args || []) ], modules.window(session), forkedToken, true);
			} catch (e) {
				console.error("Failed to start service", serviceName, "(", service, "):", e);
			}
		}
	}
}

function waitForLogon(toHook) {
	return new Promise(function(resolve) {
		toHook.hook(resolve);
	});
}

async function hookButtonClick(button) {
	return new Promise(function(resolve) {
		button.onclick = (e) => resolve(e);
	});
}