async function setupUsers() {
	// @pcos-app-mode native
	async function handleAuthentication(user, prompts, finishFunction) {
		let currentPromptIndex = 0;
		let destroyed = false;
		let cut = [];

		return {
			getNextPrompt: async function() {
				if (destroyed) return {
					success: false,
					message: modules.locales.get("AUTH_FAILED_NEW")
				};
				if (currentPromptIndex >= prompts.length) {
					if (finishFunction) await finishFunction(true);
					let token = await modules.tokens.generate();
					await modules.tokens.userInitialize(token, user);
					await modules.tokens.removePrivileges(token, cut);
					return {
						success: true,
						message: modules.locales.get("AUTH_SUCCESS"),
						token: token
					};
				}
				let that = this;
				let currentPrompt = prompts[currentPromptIndex];
				let used = false;
				
				return {
					success: "intermediate",
					type: currentPrompt.type,
					message: currentPrompt.message,
					wantsUserInput: currentPrompt.userInput,
					challenge: currentPrompt.challenge,
					input: async function(input) {
						if (used || destroyed) return that.getNextPrompt();
						if (!used) used = true;
						let verified;
						try {
							verified = await currentPrompt.verify(input);
							if (verified instanceof Array) {
								cut.push(...verified);
								cut = Array.from(new Set(cut));
								verified = true;
							}
						} catch {
							verified = false;
						}
						if (!verified) {
							destroyed = true;
							if (finishFunction) await finishFunction(false);
							return { success: false, message: modules.locales.get("AUTH_FAILED") };
						}
						currentPromptIndex++;
						return that.getNextPrompt();
					}
				};
			}
		};
	}

	let test = "{}";
	try {
		test = await modules.fs.read(modules.defaultSystem + "/etc/security/users");
	} catch {
		if (!modules.settingUp) test = "systemStatusInvalid";
	}
	try {
		JSON.parse(test);
	} catch (e) {
		if (!modules.settingUp) await panic("USER_SYSTEM_CORRUPTED", {
			name: "/etc/security/users",
			params: [modules.defaultSystem],
			underlyingJS: e
		})
	}

	modules.users = {
		init: async function(token) {
			await this.mkrecursive(modules.defaultSystem + "/etc/security", token);
			await modules.fs.chmod(modules.defaultSystem + "/etc", "rx", token);
			await this.mkrecursive(modules.defaultSystem + "/root", token);
			await modules.fs.write(modules.defaultSystem + "/etc/security/users", JSON.stringify({root: {
				securityChecks: [],
				groups: ["root"],
				homeDirectory: modules.defaultSystem + "/root"
			},
			authui: {
				securityChecks: [],
				groups: ["authui"],
				homeDirectory: modules.defaultSystem,
				blankPrivileges: true,
				additionalPrivilegeSet:  [ "IPC_SEND_PIPE", "GET_LOCALE", "GET_THEME", "ELEVATE_PRIVILEGES", "FS_READ", "FS_LIST_PARTITIONS", "CSP_OPERATIONS" ]
			}}), token);
		},
		mkrecursive: async function(dir, token) {
			let slices = dir.split("/");
			for (let slice in slices) {
				let previousParts = slices.slice(0, slice).join("/");
				if (!previousParts) continue;
				let currentPart = slices[slice];
				let check = await modules.fs.ls(previousParts, token);
				previousParts += "/";
				if (!check.includes(currentPart)) await modules.fs.mkdir(previousParts + currentPart, token);
			}
		},
		moduser: async function(user, data, token) {
			let userDB = JSON.parse(await modules.fs.read(modules.defaultSystem + "/etc/security/users"), token);
			userDB[user] = data;
			await modules.fs.write(modules.defaultSystem + "/etc/security/users", JSON.stringify(userDB), token);
		},
		getUserInfo: async function(user, sensitive = false, token) {
			let userDB = JSON.parse(await modules.fs.read(modules.defaultSystem + "/etc/security/users"), token);
			if (!userDB.hasOwnProperty(user)) return null;
			userDB = userDB[user];
			if (!sensitive) delete userDB.securityChecks;
			return userDB;
		},
		configured: async function(token) {
			try {
				JSON.parse(await modules.fs.read(modules.defaultSystem + "/etc/security/users"), token);
				return true;
			} catch {
				return false;
			}
		},
		access: async function(user, token) {
			let userDB = JSON.parse(await modules.fs.read(modules.defaultSystem + "/etc/security/users"), token);
			let credentials = userDB[user].securityChecks;
			for (let check in credentials) {
				if (credentials[check].type == "pbkdf2") {
					credentials[check].userInput = true;
					credentials[check].type = "password";
					credentials[check].message = modules.locales.get("PASSWORD_PROMPT");
					credentials[check].verify = async function(input) {
						return (await modules.core.pbkdf2(input, credentials[check].salt)) == credentials[check].hash;
					}
				}
				if (credentials[check].type == "informative" || credentials[check].type == "informative_deny") {
					credentials[check].verify = () => credentials[check].type == "informative";
					credentials[check].type = "informative";
					credentials[check].userInput = false;
				}
				if (credentials[check].type == "timeout" || credentials[check].type == "timeout_deny") {
					let isTimeout = credentials[check].type == "timeout";
					credentials[check].message = modules.locales.get("PLEASE_WAIT_TIME").replace("%s", modules.userfriendliness.inconsiderateTime(credentials[check].timeout));
					credentials[check].verify = () => new Promise(resolve => setTimeout(resolve, credentials[check].timeout, isTimeout));
					credentials[check].type = "promise";
					credentials[check].userInput = false;
				}
				if (credentials[check].type == "serverReport") {
					credentials[check].message = modules.locales.get("REPORTING_LOGON");
					credentials[check].type = "promise";
					credentials[check].verify = async function() {
						try {
							let response = await fetch(credentials[check].url);
							if (!response.ok) return false;
						} catch {
							return false;
						}
						return true;
					}
					credentials[check].userInput = false;
				}
				if (credentials[check].type == "pc-totp") {
					credentials[check].message = modules.locales.get("TOTP_PC_PROMPT");
					credentials[check].type = "text";
					credentials[check].userInput = true;
					credentials[check].verify = async function(input) {
						let sha256 = async b => Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(b)))).map(a => a.toString(16).padStart(2, "0")).join("");
						let c = Math.floor((Math.floor(Date.now() / 1000)) / 30);
						let hash = await sha256(credentials[check].secret + c);
						hash = parseInt(hash, 16);
						hash = hash % 60466176;
						hash = hash.toString();
						hash = hash.split("", 6);
						hash = hash.join("");
						return hash == input;
					}
				}
				if (credentials[check].type == "totp") {
					credentials[check].message = modules.locales.get("TOTP_PROMPT");
					credentials[check].type = "text";
					credentials[check].userInput = true;
					let hexToU8A = (hex) => Uint8Array.from(hex.match(/.{1,2}/g).map(a => parseInt(a, 16)));
					let keyImport = await crypto.subtle.importKey("raw", hexToU8A(credentials[check].secret?.padStart(20, "0")), {
						name: "HMAC",
						hash: "SHA-1"
					}, true, [ "sign" ]);
					
					credentials[check].verify = async function(input) {
						let counter = hexToU8A(Math.floor(Date.now() / 30000).toString(16).padStart(16, "0"));
						let hmacSign = await crypto.subtle.sign("HMAC", keyImport, counter);
						hmacSign = Array.from(new Uint8Array(hmacSign));
						let offset = hmacSign[19] & 0xf; // https://datatracker.ietf.org/doc/html/rfc4226#section-5.4
						let code = (hmacSign[offset] & 0x7f) << 24
							| (hmacSign[offset + 1] & 0xff) << 16
							| (hmacSign[offset + 2] & 0xff) << 8
							| (hmacSign[offset + 3] & 0xff);
						code = code % 1000000;
						return (code.toString() == input) || (code.toString().padStart(6, "0") == input);
					}
				}
				if (credentials[check].type == "workingHours") {
					let workingHourStarts = new Date();
					workingHourStarts.setHours(credentials[check].start.hours || 0, credentials[check].start.minutes || 0, credentials[check].start.seconds || 0);
					let workingHourEnds = new Date();
					workingHourEnds.setHours(credentials[check].end.hours || 0, credentials[check].end.minutes || 0, credentials[check].end.seconds || 0);
					
					if (new Date() > workingHourEnds || new Date() < workingHourStarts) {
						credentials[check].message = modules.locales.get("WORKING_HOURS_UNMET");
						credentials[check].type = "informative";
						credentials[check].userInput = false;
						credentials[check].verify = () => false;
					} else {
						credentials[check].message = modules.locales.get("AUTH_SUCCESS");
						credentials[check].type = "promise";
						credentials[check].userInput = false;
						credentials[check].verify = () => true;
					}
				}
				if (credentials[check].type == "zkpp") {
					credentials[check].message = modules.locales.get("MODULE_REQUIRED").replace("%s", "tweetnacl");
					credentials[check].type = "informative";
					credentials[check].userInput = false;
					credentials[check].verify = () => false;
					if (window.nacl) {
						let hexToU8A = (hex) => Uint8Array.from(hex.match(/.{1,2}/g).map(a => parseInt(a, 16)));
						let randomChallenge = crypto.getRandomValues(new Uint8Array(64)).reduce((a, b) => a + b.toString(16).padStart(2, "0"), "");
						credentials[check].message = modules.locales.get("PASSWORD_PROMPT");
						credentials[check].type = "zkpp_password";
						credentials[check].userInput = true;
						credentials[check].challenge = randomChallenge;
						credentials[check].verify = input => nacl.sign.detached.verify(hexToU8A(credentials[check].challenge), hexToU8A(input), hexToU8A(credentials[check].publicKey));
					}
				}
				if (credentials[check].type == "privrestrict") {
					credentials[check].message = modules.locales.get("RESTRICT_PROMPT");
					credentials[check].type = "input";
					credentials[check].userInput = true;
					credentials[check].verify = function(input) {
						let admin = [ "FS_UNMOUNT", "SWITCH_USERS_AUTOMATICALLY", "USER_INFO_OTHERS", "SET_USER_INFO", "FS_BYPASS_PERMISSIONS", "IPC_BYPASS_PERMISSIONS", "TASK_BYPASS_PERMISSIONS", "SENSITIVE_USER_INFO_OTHERS", "SYSTEM_STABILITY", "RUN_KLVL_CODE", "IDENTIFY_SYSTEM_SENSITIVE", "WEBSOCKET_BYPASS_PERMISSIONS", "LLDISK_READ", "LLDISK_WRITE", "LLDISK_LIST_PARTITIONS", "LLDISK_REMOVE", "LLDISK_IDB_READ", "LLDISK_IDB_WRITE", "LLDISK_IDB_REMOVE", "LLDISK_IDB_LIST", "LLDISK_IDB_SYNC", "FS_MOUNT", "SET_DEFAULT_SYSTEM", "GET_SYSTEM_RESOURCES", "LLDISK_INIT_PARTITIONS", "LOGOUT_OTHERS", "LULL_SYSTEM_FORCE", "CONNLESS_LISTEN_GLOBAL", "GET_USER_LIST", "CONNFUL_LISTEN_GLOBAL", "NETWORK_RAW_WRITE", "NETWORK_RAW_READ", "SET_FIRMWARE", "RELOAD_NETWORK_CONFIG" ];
						let write = [ "FS_WRITE", "FS_REMOVE", "FS_CHANGE_PERMISSION", "SET_SECURITY_CHECKS" ];
						if (input == "full") return [];
						if (input == "ro") return [ ...admin, ...write ];
						return admin;
					};
				}
			}
			if (credentials.length == 0) {
				credentials.push({
					type: "informative",
					message: modules.locales.get("ACCESS_NOT_SETUP"),
					userInput: false,
					verify: () => false
				})
			}
			return handleAuthentication(user, credentials);
		},
		getUsers: async function(token) {
			let userDB = JSON.parse(await modules.fs.read(modules.defaultSystem + "/etc/security/users"), token);
			return Object.keys(userDB);
		}
	}
}
await setupUsers();