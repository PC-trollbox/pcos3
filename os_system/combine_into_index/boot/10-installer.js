async function installer() {
	// @pcos-app-mode native
	let window = modules.window;
	let windowDiv = window(modules.session.active);
	let token = await modules.tokens.generate();
	await modules.tokens.userInitialize(token, "root");
	await modules.tasks.exec(modules.defaultSystem + "/apps/installer.js", [], windowDiv, token, false);
}

async function prepare4Running(currentDir = "", targetMount = "installer") {
	let dirList = await modules.fs.ls(modules.defaultSystem + currentDir);
	if (currentDir != "") await modules.fs.mkdir(targetMount + currentDir);
	for (let fileIndex in dirList) {
		let file = dirList[fileIndex];
		let permissions = await modules.fs.permissions(modules.defaultSystem + currentDir + "/" + file);
		if (await isDirectory(modules.defaultSystem + currentDir + "/" + file)) await prepare4Running(currentDir + "/" + file, targetMount);
		else await modules.fs.write(targetMount + currentDir + "/" + file, await modules.fs.read(modules.defaultSystem + currentDir + "/" + file));
		await modules.fs.chown(targetMount + currentDir + "/" + file, permissions.owner);
		await modules.fs.chgrp(targetMount + currentDir + "/" + file, permissions.group);
		await modules.fs.chmod(targetMount + currentDir + "/" + file, permissions.world);
	}
}
let isDirectory = (path) => modules.fs.isDirectory(path);

async function setupbase() {
	let _generated = null;
	let appFns = [ _generated?._automatically?._by?._combine?.js ];
	let appFnCode = appFns.map(a => a.toString()).join("\n");
	let fsmount = {
		read: async function (key) {
			let pathParts = key.split("/");
			if (pathParts[0] == "") pathParts = pathParts.slice(1);
			let files = this.backend.files;
			for (let part of pathParts) {
				files = files[part];
				if (!files) throw new Error("NO_SUCH_FILE");
			}
			if (typeof files === "object") throw new Error("IS_A_DIR");
			return files;
		},
		ls: async function (directory) {
			let pathParts = directory.split("/");
			if (pathParts[0] == "") pathParts = pathParts.slice(1);
			let files = this.backend.files;
			for (let part of pathParts) {
				files = files[part];
				if (!files) throw new Error("NO_SUCH_DIR");
			}
			if (typeof files !== "object") throw new Error("IS_A_FILE");
			return Object.keys(files);
		},
		permissions: async function (file) {
			return this.backend.permissions[file] || {
				owner: "root",
				group: "root",
				world: "",
			};
		},
		isDirectory: function(key) {
			let pathParts = key.split("/").slice(0, -1);
			if (pathParts[0] == "") pathParts = pathParts.slice(1);
			if (pathParts[pathParts.length - 1] == "") pathParts = pathParts.slice(0, -1);
			let basename = key.split("/").slice(-1)[0];
			let files = this.backend.files;
			for (let part of pathParts) {
				files = files[part];
				if (!files) throw new Error("NO_SUCH_DIR");
			}
			if (!files.hasOwnProperty(basename)) throw new Error("NO_SUCH_FILE_DIR");
			if (typeof files[basename] === "object") return true;
			return false;
		},
		sync: () => {},
		directory_supported: true,
		read_only: true,
		permissions_supported: true,
		backend: {
			files: {
				etc: {
					appHarden: JSON.stringify({
						requireSignature: true,
						requireAllowlist: true
					}),
					security: {
						users: JSON.stringify({
							root: {
								groups: [ "root" ],
								securityChecks: [
									{
										type: "timeout",
										timeout: 0
									}
								],
								homeDirectory: "installer/root"
							},
							nobody: {
								groups: [ "nobody" ],
								securityChecks: [],
								homeDirectory: "installer"
							},
							authui: {
								groups: [ "authui" ],
								securityChecks: [],
								homeDirectory: "installer"
							}
						}),
						automaticLogon: "root"
					} 
				},
				boot: {
					"00-pcos.js": "// @pcos-app-mode native\nconst pcos_version = " + JSON.stringify(modules.pcos_version) + ";\nconst build_time = " + JSON.stringify(modules.build_time) + ";\n\nlet modules = {\n	core: coreExports,\n	pcos_version,\n	build_time\n};\nglobalThis.modules = modules;\n" + panic.toString() + "\n" + startupMemo.toString() + "\nstartupMemo();\n",
					"01-fs.js": loadFs.toString() + "\n" + sampleFormatToEncryptedPCFS.toString() + "\nloadFs();\n",
					"01-fsboot.js": "/* no-op */",
					"01-fsck.js": fsck.toString() + "\nawait fsck();\n",
					"01-setup-state.js": "modules.settingUp = true;\n",
					"02-ui.js": loadUi.toString() + "\nloadUi();\n",
					"03-diff.js": loadDiff.toString() + "\nloadDiff();\n",
					"03-xterm.js": xterm_export.toString() + "\nxterm_export();\n",
					"04-ipc.js": loadIpc.toString() + "\nloadIpc();\n",
					"04-websockets.js": loadWebsocketSupport.toString() + "\nloadWebsocketSupport();\n",
					"05-lull.js": loadLull.toString() + "\nloadLull();\n",
					"05-network.js": networkd.toString() + "\nnetworkd();\n",
					"05-reeapis.js": reeAPIs.toString() + "\nreeAPIs();\n",
					"05-tweetnacl.js": tweetnacl.toString() + "\ntweetnacl();\n",
					"06-csp.js": loadBasicCSP.toString() + "\nloadBasicCSP();\n",
					"06-locales.js": localization.toString() + "\nlocalization();\n",
					"06-ksk.js": ksk.toString() + "\nawait ksk();\n",
					"07-tasks.js": loadTasks.toString() + "\nloadTasks();\n",
					"08-tty.js": js_terminal.toString() + "\n",
					"09-logout.js": logOut.toString() + "\nmodules.logOut = logOut;\n",
					"09-restart.js": restartLoad.toString() + "\nrestartLoad();\n",
					"11-userfriendliness.js": loadUserFriendly.toString() + "\nloadUserFriendly();\n",
					"12-tokens.js": setupTokens.toString() + "\nsetupTokens();\n",
					"12-users.js": setupUsers.toString() + "\nawait setupUsers();\n",
					"13-authui.js": authui.toString() + "\nmodules.authui = authui;\n",
					"13-consentui.js": consentui.toString() + "\nmodules.consentui = consentui;\n",
					"14-logon-requirement.js": requireLogon.toString() + "\n" + waitForLogon.toString() + "\n" + hookButtonClick.toString() + "\n" + serviceLogon.toString() + "\n",
					"14-logon-requirement-enforce.js": "/* no-op */",
					"15-apps.js": appFnCode + "\n",
					"17-installer-secondstage.js": secondstage.toString() + "\nsecondstage();\n",
					"99-finished.js": systemKillWaiter.toString() + "\nreturn await systemKillWaiter();"
				},
				root: {}
			},
			permissions: {
				"": {
					owner: "root",
					group: "root",
					world: "rx"
				},
				"boot": {
					owner: "root",
					group: "root",
					world: "rx"
				},
				"etc": {
					owner: "root",
					group: "root",
					world: "rx"
				},
				"etc/appHarden": {
					owner: "root",
					group: "root",
					world: "rx"
				},
				"etc/security": {
					owner: "root",
					group: "root",
					world: ""
				},
				"etc/security/users": {
					owner: "root",
					group: "root",
					world: ""
				},
				"etc/security/groups": {
					owner: "root",
					group: "root",
					world: "r"
				},
				"etc/security/automaticLogon": {
					owner: "root",
					group: "root",
					world: "r"
				}
			}
		}
	};
	for (let file in fsmount.backend.files.boot) {
		fsmount.backend.permissions["boot/" + file] = {
			owner: "root",
			group: "root",
			world: "rx"
		};
	}
	modules.fs.mounts["roinstaller"] = fsmount;
	modules.defaultSystem = "roinstaller";
	modules.fs.mounts.installer = modules.mounts.ramMount({});
	await prepare4Running();
	await mediaInstaller("installer");
	await installerInstaller("installer");
	fsmount = null;
	delete modules.fs.mounts["roinstaller"];
	modules.defaultSystem = "installer";
	installer();
}

setupbase();