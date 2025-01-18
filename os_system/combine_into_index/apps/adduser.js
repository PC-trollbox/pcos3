// =====BEGIN MANIFEST=====
// signer: automaticSigner
// allow: GET_LOCALE, SET_SECURITY_CHECKS, CSP_OPERATIONS, SET_USER_INFO, SWITCH_USERS_AUTOMATICALLY, FS_LIST_PARTITIONS, FS_READ, FS_WRITE, FS_CHANGE_PERMISSION, FS_BYPASS_PERMISSIONS, GET_USER_INFO, USER_INFO_OTHERS
// =====END MANIFEST=====
(async function() {
	// @pcos-app-mode isolatable
	await availableAPIs.windowVisibility(false);
	await availableAPIs.attachCLI();
	if (!(await availableAPIs.getPrivileges()).includes("GET_LOCALE")) { await availableAPIs.toMyCLI("adduser: Locale permission denied\r\n");
		return await availableAPIs.terminate();	}

	let pargs = {};
	let ppos = [];
	for (let arg of exec_args) {
		if (arg.startsWith("--")) {
			let key = arg.split("=")[0].slice(2);
			let value = arg.split("=").slice(1).join("=");
			if (arg.split("=")[1] == null) value = true;
			if (pargs.hasOwnProperty(key)) {
				let ogValues = pargs[key];
				if (ogValues instanceof Array) pargs[key] = [ ...ogValues, value ];
				else pargs[key] = [ ogValues, value ];
			} else pargs[key] = value;
		} else ppos.push(arg);
	}

	if (ppos.length < 1) {
		await availableAPIs.toMyCLI(await availableAPIs.lookupLocale("ADDUSER_USAGE") + "\r\n");
		await availableAPIs.toMyCLI(await availableAPIs.lookupLocale("ADDUSER_DESCRIPTION") + "\r\n");
		await availableAPIs.toMyCLI("\t" + await availableAPIs.lookupLocale("ADDUSER_SKIP_PASSWD") + "\r\n");
		await availableAPIs.toMyCLI("\t" + await availableAPIs.lookupLocale("ADDUSER_SKIP_HOME") + "\r\n");
		await availableAPIs.toMyCLI("\t" + await availableAPIs.lookupLocale("ADDUSER_HOME") + "\r\n");
		await availableAPIs.toMyCLI("\t" + await availableAPIs.lookupLocale("ADDUSER_GROUPS") + "\r\n");
		await availableAPIs.toMyCLI("adduser: " + await availableAPIs.lookupLocale("NO_ARGUMENTS") + "\r\n");
		return availableAPIs.terminate();
	}
	await availableAPIs.toMyCLI((await availableAPIs.lookupLocale("NEW_USER_CREATION")).replace("%s", ppos[0]) + "\r\n");
	try {
		let userData = await availableAPIs.getUserInfo({ desiredUser: ppos[0] });
		if (userData) throw new Error("USERNAME_EXISTS");
		let homeDirectory = pargs["home"] || await availableAPIs.getSystemMount() + "/home/" + ppos[0];
		await availableAPIs.setUserInfo({
			desiredUser: ppos[0],
			info: {
				groups: [ppos[0], ...(pargs.groups ? (pargs.groups instanceof Array ? pargs.groups : [pargs.groups]) : []) ],
				homeDirectory,
				securityChecks: [],
				blankPrivileges: false
			}
		});
		if (!pargs["skip-home"]) {
			await mkrecursive(homeDirectory);
			await availableAPIs.fs_chown({ path: homeDirectory, newUser: ppos[0] });
			await availableAPIs.fs_chgrp({ path: homeDirectory, newGrp: ppos[0] });
			await availableAPIs.fs_chmod({ path: homeDirectory, newPermissions: "rx" });
		}
		if (pargs["skip-passwd"]) return await availableAPIs.terminate();
		await availableAPIs.switchUser(ppos[0]);
	} catch (e) {
		await availableAPIs.toMyCLI("adduser: " + await availableAPIs.lookupLocale(e.message) + "\r\n");
		return await availableAPIs.terminate();
	}
	await availableAPIs.toMyCLI(await availableAPIs.lookupLocale("PASSWD_NEW_PROMPT") + "\r\n");
	await availableAPIs.toMyCLI(await availableAPIs.lookupLocale("PASSWD_PROMPT"));
	let str = "";
	let stage = 0;
	let password = "";
	onTermData(async function(e) {
		if (e == "\r") {
			await availableAPIs.toMyCLI("\r\n");
			if (stage == 0) {
				password = str;
				await availableAPIs.toMyCLI(await availableAPIs.lookupLocale("PASSWD_CONFIRM_PROMPT"));
				stage = 1;
				str = "";
			} else if (stage == 1) {
				stage = 2;
				if (str == password) {
					try {
						let salt = await availableAPIs.cspOperation({
							cspProvider: "basic",
							operation: "random",
							cspArgument: new Uint8Array(64)
						});
						let u8aToHex = (u8a) => Array.from(u8a).map(a => a.toString(16).padStart(2, "0")).join("");
						let key = await availableAPIs.cspOperation({
							cspProvider: "basic",
							operation: "importKey",
							cspArgument: {
								format: "raw",
								keyData: new TextEncoder().encode(password),
								algorithm: {
									name: "PBKDF2"
								},
								extractable: false,
								keyUsages: ["deriveBits", "deriveKey"]
							}
						});
						let derived = new Uint8Array(await availableAPIs.cspOperation({
							cspProvider: "basic",
							operation: "deriveBits",
							cspArgument: {
								algorithm: {
									name: "PBKDF2",
									salt: salt,
									iterations: 100000,
									hash: "SHA-256"
								},
								baseKey: key,
								length: 256
							}
						}));
						await availableAPIs.cspOperation({
							cspProvider: "basic",
							operation: "unloadKey",
							cspArgument: key
						});
						await availableAPIs.setOwnSecurityChecks({
							checks: [
								{
									type: "pbkdf2",
									hash: u8aToHex(derived),
									salt: u8aToHex(salt)
								}
							]
						});
					} catch (e) {
						await availableAPIs.toMyCLI("adduser: " + await availableAPIs.lookupLocale(e.message) + "\r\n");
						await availableAPIs.terminate();
					}
					await availableAPIs.toMyCLI("adduser: " + await availableAPIs.lookupLocale("PASSWD_FEEDBACK") + "\r\n");
					await availableAPIs.terminate();
				} else {
					await availableAPIs.toMyCLI("adduser: " + await availableAPIs.lookupLocale("PASSWD_MISMATCH") + "\r\n");
					await availableAPIs.terminate();
				}
			}
		} else if (e == '\u007F') {
			if (str.length > 0) {
				str = str.substr(0, str.length - 1);
				await availableAPIs.toMyCLI('\b \b');
			}
		} else {
			if (e >= String.fromCharCode(0x20) && e <= String.fromCharCode(0x7E) || e >= '\u00a0') {
				str += e;
				await availableAPIs.toMyCLI("*");
			}
		}
	});
})();

async function onTermData(listener) {
	while (true) {
		listener(await availableAPIs.fromMyCLI());
	}
}
async function mkrecursive(dir) {
	let slices = dir.split("/");
	for (let i = 2; i <= slices.length; i++) {
		let browse = await availableAPIs.fs_ls({ path: slices.slice(0, i - 1).join("/") });
		if (!browse.includes(slices[i - 1])) await availableAPIs.fs_mkdir({ path: slices.slice(0, i).join("/") });
	}
}
addEventListener("signal", async function(e) {
	if (e.detail == 15) await window.availableAPIs.terminate();
}); null;