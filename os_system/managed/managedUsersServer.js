const express = require("express");
const app = express();
const fs = require("fs");
const http = require("http").createServer(app);
const cors = require("cors");
const util = require("util");
const crypto = require("crypto").webcrypto;
const nacl = require("tweetnacl");
const bodyParser = express.json();
let args = util.parseArgs({
	allowPositionals: true,
	strict: false
});
let fullAbledUser = "root";
let accessSessions = {};
let tokens = {
	generate: function() {
		let rng = crypto.getRandomValues(new Uint8Array(64));
		let token = Array.from(rng).map(x => x.toString(16).padStart(2, "0")).join("");
		this._tokens[token] = { privileges: [], user: "nobody", groups: [] };
		return token;
	},
	revoke: function(token) {
		if (token == "authui") return;
		delete this._tokens[token];
	},
	setPrivileges: function(token, privileges) {
		if (!this._tokens.hasOwnProperty(token)) throw new Error();
		this._tokens[token].privileges = privileges;
	},
	addPrivilege: function(token, privilege) {
		if (!this._tokens.hasOwnProperty(token)) throw new Error();
		this._tokens[token].privileges.push(privilege);
	},
	addPrivileges: function(token, privileges) {
		if (!this._tokens.hasOwnProperty(token)) throw new Error();
		this._tokens[token].privileges.push(...privileges);
	},
	removePrivilege: function(token, privilege) {
		if (!this._tokens.hasOwnProperty(token)) throw new Error();
		this._tokens[token].privileges = this._tokens[token].privileges.filter(x => x != privilege);
	},
	removePrivileges: function(token, privileges) {
		if (!this._tokens.hasOwnProperty(token)) throw new Error();
		this._tokens[token].privileges = this._tokens[token].privileges.filter(x => !privileges.includes(x));
	},
	userInitialize: function(token, user) {
		if (!this._tokens.hasOwnProperty(token)) throw new Error();
		this._tokens[token].user = user;
		this._tokens[token].groups = managedUsers[user].groups || [];
		this._tokens[token].privileges = ["FS_READ", "FS_WRITE", "FS_REMOVE", "FS_CHANGE_PERMISSION", "FS_LIST_PARTITIONS", "IPC_CREATE_PIPE", "IPC_LISTEN_PIPE", "IPC_SEND_PIPE", "IPC_CHANGE_PERMISSION", "ELEVATE_PRIVILEGES", "GET_USER_INFO", "SET_SECURITY_CHECKS", "START_TASK", "LIST_TASKS", "SIGNAL_TASK", "FETCH_SEND", "CSP_OPERATIONS", "IDENTIFY_SYSTEM", "WEBSOCKETS_OPEN", "WEBSOCKETS_LISTEN", "WEBSOCKETS_SEND", "WEBSOCKET_SET_PERMISSIONS", "MANAGE_TOKENS", "WEBSOCKET_INFO", "GRAB_ATTENTION", "CLI_MODIFICATIONS", "GET_THEME", "GET_LOCALE", "GET_FILESYSTEMS", "GET_BUILD", "GET_SERVER_URL", "START_BACKGROUND_TASK", "GET_BOOT_MODE", "GET_SCREEN_INFO", "LOGOUT", "LULL_SYSTEM"];
		if (managedUsers[user].blankPrivileges) this._tokens[token].privileges = [];
		this._tokens[token].privileges.push(...(managedUsers[user].additionalPrivilegeSet || []));
		if (user == fullAbledUser) this._tokens[token].privileges.push("FS_UNMOUNT", "SYSTEM_SHUTDOWN", "SWITCH_USERS_AUTOMATICALLY", "USER_INFO_OTHERS", "SET_USER_INFO", "FS_BYPASS_PERMISSIONS", "IPC_BYPASS_PERMISSIONS", "TASK_BYPASS_PERMISSIONS", "SENSITIVE_USER_INFO_OTHERS", "SYSTEM_STABILITY", "RUN_KLVL_CODE", "IDENTIFY_SYSTEM_SENSITIVE", "WEBSOCKET_BYPASS_PERMISSIONS", "LLDISK_READ", "LLDISK_WRITE", "LLDISK_LIST_PARTITIONS", "LLDISK_REMOVE", "LLDISK_IDB_READ", "LLDISK_IDB_WRITE", "LLDISK_IDB_REMOVE", "LLDISK_IDB_LIST", "LLDISK_IDB_SYNC", "FS_MOUNT", "SET_DEFAULT_SYSTEM", "GET_SYSTEM_RESOURCES", "LLDISK_INIT_PARTITIONS", "LOGOUT_OTHERS", "LULL_SYSTEM_FORCE", "GET_USER_LIST");
	},
	halfInitialize: function(token, user) {
		if (!this._tokens.hasOwnProperty(token)) throw new Error();
		this._tokens[token].user = user;
		this._tokens[token].groups = managedUsers[user].groups || [];
	},
	info: function(token) {
		if (!this._tokens.hasOwnProperty(token)) throw new Error();
		return this._tokens[token];
	},
	validate: function(token, criteria) {
		if (!this._tokens.hasOwnProperty(token)) return false;
		if (criteria.user && this._tokens[token].user != criteria.user) return false;
		if (criteria.group && !this._tokens[token].groups.includes(criteria.group)) return false;
		if (criteria.privilege && !this._tokens[token].privileges.includes(criteria.privilege)) return false;
		return true;
	},
	fork: function(token) {
		if (!this._tokens.hasOwnProperty(token)) throw new Error();
		let rng = crypto.getRandomValues(new Uint8Array(64));
		let newToken = Array.from(rng).map(x => x.toString(16).padStart(2, "0")).join("");
		this._tokens[newToken] = JSON.parse(JSON.stringify(this._tokens[token]));
		return newToken;  
	},
	_tokens: {
		authui: {
			user: "authui",
			groups: [ "authui" ],
			privileges: "IPC_SEND_PIPE, GET_LOCALE, GET_THEME, ELEVATE_PRIVILEGES, FS_READ, FS_LIST_PARTITIONS, CSP_OPERATIONS".split(", ")
		}
	}
};
let managedUsers = JSON.parse(fs.readFileSync(__dirname + "/managedDB.json").toString());
async function handleAuthentication(user, prompts) {
	let currentPromptIndex = 0;
	let destroyed = false;

	return {
		getNextPrompt: async function() {
			if (destroyed) return { success: false };
			if (currentPromptIndex >= prompts.length) {
				let token = tokens.generate();
				tokens.userInitialize(token, user);
				return {
					success: true,
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
				userInput: currentPrompt.userInput,
				challenge: currentPrompt.challenge,
				input: async function(input) {
					if (used || destroyed) return that.getNextPrompt();
					if (!used) used = true;
					let verified;
					try {
						verified = await currentPrompt.verify(input);
					} catch {
						verified = false;
					}
					if (!verified) {
						destroyed = true;
						return { success: false };
					}
					currentPromptIndex++;
					return that.getNextPrompt();
				}
			};
		}
	};
}
let hexToU8A = (hex) => Uint8Array.from(hex.match(/.{1,2}/g).map(a => parseInt(a, 16)));
let u8aToHex = (u8a) => Array.from(u8a).map(a => a.toString(16).padStart(2, "0")).join("");
async function pbkdf2(pass, salt) {
	return u8aToHex(new Uint8Array(await crypto.subtle.deriveBits({
		name: "PBKDF2",
		salt: hexToU8A(salt),
		iterations: 100000,
		hash: "SHA-256"
	}, await crypto.subtle.importKey("raw",
		new TextEncoder().encode(pass), {
			name: "PBKDF2"
		},
		false,
		[ "deriveBits", "deriveKey" ]
	), 256)));
}

app.use(function(err, req, res, next) {
	res.send(500).json({ name: err.name, message: err.message });
});

app.use(cors({
	origin: [
		"https://pcos3.pcprojects.tk",
		"https://pcos3.pcprojects.duckdns.org",
		"http://localhost:8000"
	]
}));

app.get("/managedUsers/ping", function(req, res) {
	res.send("pong");
});

app.post("/managedUsers/userGet", bodyParser, function(req, res) {
	if (!req.body.user || !req.body.token) return res.status(400).send("Fail Get");
	try {
		if (!tokens.info(req.body.token).privileges.includes("GET_USER_INFO") && !tokens.info(req.body.token).privileges.includes("SET_SECURITY_CHECKS")) return res.status(403).send("Fail Get");
		if (tokens.info(req.body.token).user != req.body.user &&
			!tokens.info(req.body.token).privileges.includes("USER_INFO_OTHERS")) return res.status(403).send("Fail Get");
		if (tokens.info(req.body.token).user != req.body.user && req.body.sensitive &&
			!tokens.info(req.body.token).privileges.includes("SENSITIVE_USER_INFO_OTHERS")) return res.status(403).send("Fail Get");
		let data = structuredClone(managedUsers[req.body.user] || null);
		if (!req.body.sensitive) delete data.securityChecks;
		res.json(data);
	} catch (e) { res.status(500).send("Fail Get"); }
});

app.post("/managedUsers/userSet", bodyParser, function(req, res) {
	if (!req.body.user || !req.body.token) return res.status(400).send("Fail Set");
	try {
		if (!tokens.info(req.body.token).privileges.includes("SET_USER_INFO") &&
			!tokens.info(req.body.token).privileges.includes("SET_SECURITY_CHECKS")) return res.status(403).send("Fail Set");
		managedUsers[req.body.user] = req.body.data;
		fs.writeFileSync(__dirname + "/managedDB.json", JSON.stringify(managedUsers));
		res.json(true);
	} catch { res.status(500).send("Fail Set"); }
});

app.post("/managedUsers/userAccess", bodyParser, async function(req, res) {
	if (!req.body.user || !managedUsers.hasOwnProperty(req.body.user) || !req.body.reqToken) return res.status(400).send("Fail Auth");
	try {
		if (!tokens.info(req.body.reqToken).privileges.includes("ELEVATE_PRIVILEGES")) return res.status(403).send("Fail Auth");
		let newAuthSessToken = Array.from(crypto.getRandomValues(new Uint8Array(64))).map(x => x.toString(16).padStart(2, "0")).join("");
		let credentials = structuredClone(managedUsers[req.body.user].securityChecks);
		for (let check in credentials) {
			if (credentials[check].type == "pbkdf2") {
				credentials[check].userInput = true;
				credentials[check].type = "password";
				credentials[check].message = "Password";
				credentials[check].verify = async function(input) {
					return (await pbkdf2(input, credentials[check].salt)) == credentials[check].hash;
				}
			}
			if (credentials[check].type == "informative" || credentials[check].type == "informative_deny") {
				credentials[check].verify = () => credentials[check].type == "informative";
				credentials[check].type = "informative";
				credentials[check].userInput = false;
			}
			if (credentials[check].type == "timeout" || credentials[check].type == "timeout_deny") {
				let isTimeout = credentials[check].type == "timeout";
				credentials[check].message = "Please wait " + credentials[check].timeout + "ms...";
				credentials[check].verify = () => new Promise(resolve => setTimeout(resolve, credentials[check].timeout, isTimeout));
				credentials[check].type = "promise";
				credentials[check].userInput = false;
			}
			if (credentials[check].type == "serverReport") {
				credentials[check].message = "Please wait while the logon is being recorded";
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
				credentials[check].message = "TOTP-PC code";
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
				credentials[check].message = "TOTP code";
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
					credentials[check].message = "You have tried to log in outside of your working hours.";
					credentials[check].type = "informative";
					credentials[check].userInput = false;
					credentials[check].verify = () => false;
				} else {
					credentials[check].message = "Please wait...";
					credentials[check].type = "promise";
					credentials[check].userInput = false;
					credentials[check].verify = () => true;
				}
			}
			if (credentials[check].type == "zkpp") {
				let hexToU8A = (hex) => Uint8Array.from(hex.match(/.{1,2}/g).map(a => parseInt(a, 16)));
				let randomChallenge = crypto.getRandomValues(new Uint8Array(64)).reduce((a, b) => a + b.toString(16).padStart(2, "0"), "");
				credentials[check].message = "Password";
				credentials[check].type = "zkpp_password";
				credentials[check].userInput = true;
				credentials[check].challenge = randomChallenge;
				credentials[check].verify = input => nacl.sign.detached.verify(hexToU8A(credentials[check].challenge), hexToU8A(input), hexToU8A(credentials[check].publicKey));
			}
		}
		if (credentials.length == 0) {
			credentials.push({
				type: "informative",
				message: "This user has no authentication methods.",
				userInput: false,
				verify: () => false
			})
		}
		accessSessions[newAuthSessToken] = await handleAuthentication(req.body.user, credentials);
		accessSessions[newAuthSessToken] = await accessSessions[newAuthSessToken].getNextPrompt();
		res.json(newAuthSessToken);
	} catch { res.status(500).send("Fail Auth"); }
});

app.post("/managedUsers/userAccessContinue", bodyParser, async function(req, res) {
	if (!req.body.userAccessSession || !accessSessions.hasOwnProperty(req.body.userAccessSession)) return res.status(400).send("Fail Auth");
	try {
		let accessSes = accessSessions[req.body.userAccessSession];
		if (accessSes.success != "intermediate") delete accessSessions[req.body.userAccessSession];
		res.json(accessSes);
	} catch { res.status(500).send("Fail Auth"); }
});

app.post("/managedUsers/userAccessSubmit", bodyParser, async function(req, res) {
	if (!req.body.userAccessSession || !accessSessions.hasOwnProperty(req.body.userAccessSession)) return res.status(400).send("Fail Auth");
	try {
		accessSessions[req.body.userAccessSession] = await accessSessions[req.body.userAccessSession].input(req.body.input);
		res.json(accessSessions[req.body.userAccessSession].success == "intermediate" || accessSessions[req.body.userAccessSession].success);
	} catch { res.status(500).send("Fail Auth"); }
});

app.post("/managedUsers/getUsers", bodyParser, async function(req, res) {
	if (!req.body.token) return res.status(400).send("Fail Get");
	try {
		if (!tokens.info(req.body.token).privileges.includes("GET_USER_LIST")) return res.status(403).send("Fail Get");
		res.json(Object.keys(managedUsers));
	} catch (e) { res.status(500).send("Fail Get"); }
});

app.post("/managedUsers/tokenRevoke", bodyParser, async function(req, res) {
	if (!req.body.token) return res.status(400).send("Fail Revoke");
	try {
		tokens.revoke(req.body.token);
		res.send("ok");
	} catch { res.status(500).send("Fail Revoke"); }
});

app.post("/managedUsers/tokenRevokePrivilege", bodyParser, async function(req, res) {
	if (!req.body.token || !req.body.privilege) return res.status(400).send("Fail Revoke");
	if (req.body.token == "authui") return res.status(400).send("Fail Revoke");
	try {
		tokens.removePrivilege(req.body.token, req.body.privilege);
		res.send("ok");
	} catch { res.status(500).send("Fail Revoke"); }
});

app.post("/managedUsers/tokenRevokePrivileges", bodyParser, async function(req, res) {
	if (!req.body.token || !req.body.privileges) return res.status(400).send("Fail Revoke");
	if (req.body.token == "authui") return res.status(400).send("Fail Revoke");
	try {
		tokens.removePrivileges(req.body.token, req.body.privileges);
		res.send("ok");
	} catch { res.status(500).send("Fail Revoke"); }
});

app.post("/managedUsers/tokenUserInitialize", bodyParser, async function(req, res) {
	if (!req.body.token || !req.body.user) return res.status(400).send("Fail Initialize");
	try {
		if (!tokens.info(req.body.token).privileges.includes("SWITCH_USERS_AUTOMATICALLY")) return res.status(400).send("Fail Initialize");
		tokens.userInitialize(req.body.token, req.body.user);
		res.send("ok");
	} catch { res.status(500).send("Fail Initialize"); }
});

app.post("/managedUsers/tokenHalfInitialize", bodyParser, async function(req, res) {
	if (!req.body.token || !req.body.user) return res.status(400).send("Fail Initialize");
	try {
		if (!tokens.info(req.body.token).privileges.includes("SWITCH_USERS_AUTOMATICALLY")) return res.status(400).send("Fail Initialize");
		tokens.halfInitialize(req.body.token, req.body.user);
		res.send("ok");
	} catch { res.status(500).send("Fail Initialize"); }
});

app.post("/managedUsers/tokenInfo", bodyParser, async function(req, res) {
	if (!req.body.token) return res.status(400).send("Fail Info");
	try { res.json(tokens.info(req.body.token));
	} catch { res.status(500).send("Fail Info"); }
});

app.post("/managedUsers/tokenValidate", bodyParser, async function(req, res) {
	if (!req.body.token || !req.body.criteria) return res.status(400).send("Fail Validate");
	try { res.json(tokens.validate(req.body.token, req.body.criteria));
	} catch { res.status(500).send("Fail Validate"); }
});

app.post("/managedUsers/tokenFork", bodyParser, async function(req, res) {
	if (!req.body.token) return res.status(400).send("Fail Fork");
	try { res.json(tokens.fork(req.body.token));
	} catch { res.status(500).send("Fail Fork"); }
});

app.use(function(err, req, res, next) {
	res.send(500).json({ name: err.name, message: err.message });
});

http.listen(+args.values.p || 3946, function() {
	console.log("Listening on port " + (+args.values.p || 3946));
});