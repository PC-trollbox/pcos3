let _generated = null;
let appFns = [ _generated?._automatically?._by?._combine?.js ];
async function installer() {
	// @pcos-app-mode native
	let windowtty = await modules.window(modules.session.active);
	windowtty.title.innerText = modules.locales.get("INSTALL_PCOS");
	windowtty.closeButton.onclick = () => modules.restart();;
	windowtty.content.style.padding = "0px";
	windowtty.content.style.margin = "0px";
	let termDiv = document.createElement("div");
	windowtty.content.appendChild(termDiv);
	let term = new Terminal();
	term.open(termDiv);
	let onresizeFn = () => term.resize(Math.floor(windowtty.content.clientWidth / 9), Math.floor(windowtty.content.clientHeight / 16));
	onresizeFn();
	let to = {term,windowtty};
	let robs = new ResizeObserver(onresizeFn);
	robs.observe(windowtty.windowDiv);
	term.clear();
	term.write(modules.locales.get("TERMINAL_INVITATION").replace("%s", pcos_version) + "\r\n\r\n");
	term.write("First, initialize the partition table.\r\n");
	term.write("Run: modules.core.disk.insertPartitionTable();\r\n");
	term.write("For the next step, run step(to, 2);\r\n")
	term.write("> ");
	let command = "";
	term.onData(function(e) {
		if (e == "\r") {
			term.write("\r\n");
			try {
				term.write(JSON.stringify(eval(command)) + "\r\n");
			} catch (e) {
				term.write(e + "\r\n");
			}
			term.write("> ");
			command = "";
		} else if (e == '\u007F') {
			if (command.length > 0) {
				command = command.substr(0, command.length - 1);
				term.write('\b \b');
			}
		} else {
			if (e >= String.fromCharCode(0x20) && e <= String.fromCharCode(0x7E) || e >= '\u00a0') {
				command += e;
				term.write(e);
			}
		}
	});
	return windowtty;
}

function step(to, n) {
	let {term,windowtty} = to;
	if (n == 2) {
		term.write("Now, let's format a data partition into PCFS.\r\n");
		term.write("If you have a PCFS partition already and didn't re-initialize the partition table, use this to re-use the old ID:\r\n");
		term.write("Run: prevId = coreExports.disk.partition(\"data\").getData().id;\r\n");
		term.write("But if you don't have a PCFS partition, run this to generate a new ID:\r\n");
		term.write("Run: prevId = crypto.getRandomValues(new Uint8Array(64)).reduce((a,b)=>a+b.toString(16).padStart(2,0),\"\");\r\n");
		term.write("Regardless of the previous ID existence, run:\r\n");
		term.write("Run: coreExports.disk.partition(\"data\").setData({files:{},permissions:{},id:prevId});\r\n");
		term.write("Then come back to the manual with step(to, 3);\r\n");
	} else if (n == 3) {
		windowtty.closeButton.classList.toggle("hidden", true);
		term.write("After you've formatted the data partition, it's time to create a boot one.\r\n");
		term.write("Notice that quitting at this point is not possible. Restarting would lead to an unbootable system!\r\n");
		term.write("Run: coreExports.disk.partition(\"boot\").setData(\"_ce=coreExports;_af=(async ()=>{}).constructor;_di=_ce.disk.partition(\\\"data\\\").getData();_m=_di.files[coreExports.bootSection||\\\"boot\\\"];_s=\\\"\\\";for(module of Object.keys(_m).sort((a,b)=>a<b?-1:(a>b?1:0)))_s+=await _ce.idb.readPart(_di.id+'-'+_m[module]);await _af(_s)();\");\r\n");
		term.write("Then, finally go back with step(to, 4);\r\n");
	} else if (n == 4) {
		term.write("Let's mount the data partition now for writing data onto it.\r\n");
		term.write("Run: modules.mounts.PCFSiDBMount({partition:\"data\"}).then(a=>modules.fs.mounts.storage=a);\r\n");
		term.write("Then return to the manual with step(to, 5);\r\n");
	} else if (n == 5) {
		term.write("Let's make / readable to others.\r\n");
		term.write("Run: modules.fs.chown(\"storage\", \"root\");modules.fs.chgrp(\"storage\", \"root\");modules.fs.chmod(\"storage\", \"rx\");\r\n");
		term.write("Once you've done that, run step(to, 6); for further instructions.\r\n");
	} else if (n == 6) {
		term.write("Now, let's copy the boot partition into your storage partition.\r\n");
		term.write("Run: copyBoot(\"/boot\", \"storage\", (t)=>term.write(t+\"\\r\\n\"));\r\n");
		term.write("Then, read the manual a page further with step(to, 7);\r\n")
	} else if (n == 7) {
		term.write("Make /boot readable to others!\r\n");
		term.write("Run: modules.fs.chown(\"storage/boot\", \"root\");modules.fs.chgrp(\"storage/boot\", \"root\");modules.fs.chmod(\"storage/boot\", \"rx\");\r\n");
		term.write("There's still more. See step(to, 8);\r\n");
	} else if (n == 8) {
		term.write("Now, make the system mount / automatically on boot.\r\n");
		term.write("Run: modules.fs.write(\"storage/boot/01-fsboot.js\", \"modules.fs.mounts.storage=await modules.mounts.PCFSiDBMount({partition:\\\"data\\\"});modules.defaultSystem=\\\"storage\\\";\");\r\n");
		term.write("Then, go see the next point with step(to, 9);\r\n");
	} else if (n == 9) {
		windowtty.closeButton.classList.toggle("hidden", false);
		term.write("Break! Now, you can boot to a working system. To do so, run modules.restart(); or close the window.\r\n");
		term.write("If you're willing to continue, run step(to, 10);\r\n");
	} else if (n == 10) {
		windowtty.closeButton.classList.toggle("hidden", true);
		term.write("Alright, let's set up the whole OS with the command line. Make the system think it is booted from the data partition.\r\n");
		term.write("Notice that quitting at this point is not possible. Restarting could lead to an unbootable system.\r\n");
		term.write("Run: modules.defaultSystem = \"storage\";\r\n");
		term.write("Don't forget to see the next step with step(to, 11);\r\n");
	} else if (n == 11) {
		term.write("Let's create a password. That should be something. If you require immediate security, set it to something strong. Otherwise, leave it 'toor'.\r\n");
		term.write("Run: password = \"toor\";\r\n");
		term.write("Scroll through and run step(to, 12);\r\n");
	} else if (n == 12) {
		term.write("We forgot there is a home directory setting. That should be set to defaultSystem/root, since we're creating the root user.\r\n");
		term.write("Run: homedir = modules.defaultSystem + \"/root\";\r\n");
		term.write("For the next step, run step(to, 13);\r\n");
	} else if (n == 13) {
		term.write("Initialize the user system. This creates an user file with basic setup.\r\n");
		term.write("Run: modules.users.init();\r\n");
		term.write("Then come back to the manual with step(to, 14);\r\n");
	} else if (n == 14) {
		term.write("Create random values for a salt.\r\n");
		term.write("Run: salt = Array.from(crypto.getRandomValues(new Uint8Array(64))).map(x=>x.toString(16).padStart(2, \"0\")).join(\"\");\r\n");
		term.write("Then return to the manual with with step(to, 15);\r\n");
	} else if (n == 15) {
		term.write("Let's encode your password.\r\n");
		term.write("Run: modules.core.pbkdf2(password, salt).then(a => hash = a);\r\n");
		term.write("Once you've done that, run step(to, 16); for further instructions.\r\n");
	} else if (n == 16) {
		term.write("Let's create the user account.\r\n");
		term.write("Run: modules.users.moduser(\"root\",{securityChecks:[{type:\"pbkdf2\",hash,salt}],groups:[\"root\",\"users\"],homeDirectory:homedir});\r\n");
		term.write("Then, read the manual a page further with step(to, 17);\r\n");
	} else if (n == 17) {
		term.write("Create the home directory.\r\n");
		term.write("Run: modules.users.mkrecursive(homedir);\r\n");
		term.write("There's still more. See step(to, 18);\r\n");
	} else if (n == 18) {
		term.write("Install the lockscreen dark mode preference. It will break without it!\r\n");
		term.write("Run: modules.fs.write(modules.defaultSystem + \"/etc/darkLockScreen\", \"false\");\r\n");
		term.write("Then, finally go back with step(to, 19);\r\n");
	} else if (n == 19) {
		term.write("Add a lockscreen wallpaper. It will also break without it!\r\n");
		term.write("Run modules.fs.read(modules.defaultSystem + \"/etc/wallpapers/pcos-lock-beta.pic\").then(a => modules.fs.write(modules.defaultSystem + \"/etc/wallpapers/lockscreen.pic\", a));\r\n");
		term.write("Open up the next page of the manual, run step(to, 20);\r\n");
	} else if (n == 20) {
		term.write("Install the base apps.\r\n");
		term.write("In quick succession, we'll run the app installers.\r\n");
		term.write("Run: " + appFns.map(a => a.name + "(modules.defaultSystem)").join(";\r\n") + ";\r\n");
		term.write("Once you installed all that, do step(to, 21);\r\n");
	} else if (n == 21) {
		term.write("Remove the second-stage installer; we did its task already!\r\n");
		term.write("Run: modules.fs.rm(modules.defaultSystem + \"/boot/17-installer-secondstage.js\");\r\n");
		term.write("Proceed to step(to, 22);\r\n");
	} else if (n == 22) {
		term.write("Remove the setup state for better security.\r\n");
		term.write("Run: modules.fs.rm(modules.defaultSystem + \"/boot/01-setup-state.js\");\r\n");
		term.write("Develop your system further, use step(to, 23);\r\n");
	} else if (n == 23) {
		term.write("Make the system require logon.\r\n");
		term.write("Run: modules.fs.write(modules.defaultSystem + \"/boot/14-logon-requirement-enforce.js\", \"requireLogon();\\n\");\r\n");
		term.write("Go on, use step(to, 24);\r\n");
	} else if (n == 24) {
		windowtty.closeButton.classList.toggle("hidden", false);
		term.write("Break! Now you can boot to an actual system.\r\n");
		term.write("Want extra stuff? Do step(to, 25);\r\n");
		term.write("If you don't, reboot with modules.restart(), close the window or use requireLogon(); step(to, 29);\r\n");
	} else if (n == 25) {
		term.write("Extra activities? Alright, here we go!\r\n");
		term.write("Remove the installers to conserve disk space.\r\n");
		term.write("Run: modules.fs.rm(modules.defaultSystem + \"/boot/15-apps.js\");\r\n");
		term.write("Continue to step(to, 26);\r\n")
	} else if (n == 26) {
		term.write("Assign the dark theme to the root user.\r\n");
		term.write("Run: modules.fs.write(homedir + \"/.darkmode\", \"true\");\r\n");
		term.write("To continue (or keep in light mode) do step(to, 27);\r\n")
	} else if (n == 27) {
		term.write("Add an user wallpaper.\r\n");
		term.write("Run (light): modules.fs.read(modules.defaultSystem + \"/etc/wallpapers/pcos-beta.pic\").then(a => modules.fs.write(homedir + \"/.wallpaper\", a));\r\n");
		term.write("Run (dark): modules.fs.read(modules.defaultSystem + \"/etc/wallpapers/pcos-dark-beta.pic\").then(a => modules.fs.write(homedir + \"/.wallpaper\", a));\r\n");
		term.write("Proceed to do step(to, 28);\r\n")
	} else if (n == 28) {
		term.write("Add a root password.\r\n");
		term.write("Run: modules.authui(undefined,\"root\").then(a=>a.hook(b=>modules.tasks.exec(\"storage/apps/personalSecurity.js\",[],modules.window(modules.session.active),b.token)));\r\n");
		term.write("To finish, do requireLogon(); step(to, 29); You can also boot into a working system with modules.restart(); or by closing this window.\r\n");
	} else if (n == 29) {
		term.write("Terminal shutting down.\r\n");
		windowtty.windowDiv.remove();
	} else {
		term.write("No such tutorial entry!\r\n");
	}
}

async function copyBoot(currentDir = "/boot", targetMount = "storage", progressSet) {
	let dirList = await modules.fs.ls(modules.defaultSystem + currentDir);
	try {
		await recursiveRemove(targetMount + currentDir, progressSet);
	} catch (e) {
		if (e.message != "NO_SUCH_DIR") throw e;
	}
	await progressSet(modules.locales.get("CREATING_DIR").replace("%s", currentDir));
	await modules.fs.mkdir(targetMount + currentDir);
	for (let fileIndex in dirList) {
		let file = dirList[fileIndex];
		await progressSet(modules.locales.get("COPYING_FILE").replace("%s", currentDir + "/" + file) + " | " + (Number(fileIndex) + 1) + "/" + dirList.length + " | " + ((Number(fileIndex) + 1) / dirList.length * 100).toFixed(2) + "%");
		let permissions = await modules.fs.permissions(modules.defaultSystem + currentDir + "/" + file);
		if (await isDirectory(modules.defaultSystem + currentDir + "/" + file)) await copyBoot(currentDir + "/" + file, targetMount, progressSet);
		else await modules.fs.write(targetMount + currentDir + "/" + file, await modules.fs.read(modules.defaultSystem + currentDir + "/" + file));
		await modules.fs.chown(targetMount + currentDir + "/" + file, permissions.owner);
		await modules.fs.chgrp(targetMount + currentDir + "/" + file, permissions.group);
		await modules.fs.chmod(targetMount + currentDir + "/" + file, permissions.world);
	}
	await progressSet(modules.locales.get("COMPLETE_COPY").replace("%s", currentDir));
}

let isDirectory = (path) => modules.fs.isDirectory(path);

async function recursiveRemove(path, progressSet) {
	await progressSet(modules.locales.get("REMOVING_OBJECT").replace("%s", path));
	let dirList = await modules.fs.ls(path);
	for (let fileIndex in dirList) {
		let file = dirList[fileIndex];
		await progressSet(modules.locales.get("REMOVING_OBJECT").replace("%s", path + "/" + file) + " | " + (Number(fileIndex) + 1) + "/" + dirList.length + " | " + ((Number(fileIndex) + 1) / dirList.length * 100).toFixed(2) + "%");
		if (await isDirectory(path + "/" + file)) await recursiveRemove(path + "/" + file);
		else await modules.fs.rm(path + "/" + file);
	}
	await modules.fs.rm(path);
	await progressSet(modules.locales.get("COMPLETE_REMOVE").replace("%s", path));
}

function setupbase() {
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
							}
						}),
						automaticLogon: "root"
					} 
				},
				boot: {
					"00-pcos.js": "// @pcos-app-mode native\nconst pcos_version = " + JSON.stringify(modules.pcos_version) + ";\n\nlet modules = {\n     core: coreExports\n};\nglobalThis.modules = modules;\nmodules.pcos_version = pcos_version;\n" + panic.toString() + "\n" + startupMemo.toString() + "\nstartupMemo();\n",
					"01-fs.js": loadFs.toString() + "\n" + sampleFormatToEncryptedPCFS.toString() + "\nloadFs();\n",
					"01-fsboot.js": "/* no-op */",
					"01-fsck.js": fsck.toString() + "\nawait fsck();\n",
					"01-setup-state.js": "modules.settingUp = true;\n",
					"02-ui.js": loadUi.toString() + "\nloadUi();\n",
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
					"15-optional.js": opt.toString() + "\nopt();\n",
					"17-installer-secondstage.js": secondstage.toString() + "\nsecondstage();\n",
					"99-finished.js": systemKillWaiter.toString() + "\nreturn await systemKillWaiter();"
				},
				root: {}
			},
			permissions: {
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
	modules.fs.mounts["installer"] = fsmount;
	modules.defaultSystem = "installer";
}

setupbase();
installer();