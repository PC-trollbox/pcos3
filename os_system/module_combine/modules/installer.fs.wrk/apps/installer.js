// =====BEGIN MANIFEST=====
// signer: automaticSigner
// allow: GET_LOCALE, GET_THEME, GET_BUILD, RUN_KLVL_CODE, LLDISK_WRITE, LLDISK_READ, FS_READ, FS_WRITE, FS_BYPASS_PERMISSIONS, FS_REMOVE, FS_LIST_PARTITIONS, SYSTEM_SHUTDOWN, FS_CHANGE_PERMISSION, LLDISK_LIST_PARTITIONS, FS_MOUNT, CSP_OPERATIONS, LLDISK_INIT_PARTITIONS, IPC_SEND_PIPE, GET_SERVER_URL, SET_USER_INFO, SET_DEFAULT_SYSTEM, RESOLVE_NAME, CONNFUL_CONNECT, CONNFUL_DISCONNECT, CONNFUL_WRITE, CONNFUL_READ, CONNFUL_ADDRESS_GET, CONNFUL_IDENTITY_GET
// =====END MANIFEST=====
let onClose = () => availableAPIs.terminate();
(async function() {
	// @pcos-app-mode isolatable
	let networkDefaultURL = new URL(await availableAPIs.runningServer());
	networkDefaultURL.protocol = "ws" + (networkDefaultURL.protocol == "https:" ? "s" : "") + ":";
	networkDefaultURL.pathname = "";
	const networkSymbols = "abcdefghijklmnopqrstuvwxyz0123456789_-";
	let automatic_configuration = {
		/* startInstall: true,
		acceptEULA: true,
		partitioning: {
			data: "data",
			boot: "boot",
			format: true,
			autoInitNewInstalls: true
		},
		autoRestart: "kexec",
		defaultLocale: "en", */
		secondstage: {
			createAccount: {
				/*password: "password",
				darkMode: true,
				create: true,
				defaultLocale: "en",*/
				username: "root",
				lockUsername: true
			},
			appHarden: {
				requireSignature: true,
				requireAllowlist: true
			},
			network: {
				url: networkDefaultURL.toString(),
				ucBits: 1,
				hostname: new Array(16).fill(0).map(a => networkSymbols[Math.floor(Math.random() * networkSymbols.length)]).join(""),
				updates: "pcosserver.pc"
			}
		}
	};
	document.body.style.fontFamily = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
	if (await availableAPIs.isDarkThemed()) document.body.style.color = "white";
	await availableAPIs.windowTitleSet(await availableAPIs.lookupLocale("INSTALL_PCOS"));
	let privileges = await availableAPIs.getPrivileges();
	let checklist = [ "GET_BUILD", "RUN_KLVL_CODE", "LLDISK_WRITE", "LLDISK_READ", "FS_READ", "FS_WRITE", "FS_BYPASS_PERMISSIONS", "FS_REMOVE", "FS_LIST_PARTITIONS", "SYSTEM_SHUTDOWN", "FS_CHANGE_PERMISSION", "LLDISK_LIST_PARTITIONS", "FS_MOUNT", "CSP_OPERATIONS", "LLDISK_INIT_PARTITIONS", "GET_SERVER_URL" ];
	if (!checklist.every(p => privileges.includes(p))) return availableAPIs.terminate();
	let installed_modules = [
		"50-bootable.fs", "50-core.fs", "50-diff.fs", "00-keys.fs", "50-pcos-icons.fs", "50-pcos-sounds.fs", "50-pcos-wallpapers.fs", "50-sysadmin.fs",
		"50-terminal-disks.fs", "50-terminal-network.fs", "50-terminal-users.fs", "50-terminal.fs", "50-tweetnacl.fs", "50-xterm.fs", "50-blogBrowser.fs",
		"50-calculator.fs", "50-crypto-tools.fs", "50-multimedia.fs"
	];
	let downloadFromBdpOnMissing = "bdp://pcosserver.pc";
	await availableAPIs.closeability(false);
	await new Promise(async function(resolve) {
		let locales = await availableAPIs.installedLocales();
		let localeSelect = document.createElement("select");
		let localeZero = document.createElement("option");
		localeZero.value = "";
		localeZero.innerText = " 🌐 Language 🌐 ";
		localeZero.selected = true;
		localeZero.disabled = true;
		localeZero.hidden = true;
		localeSelect.appendChild(localeZero);
		for (let locale of locales) {
			let option = document.createElement("option");
			option.value = locale;
			option.innerText = await availableAPIs.lookupOtherLocale({ key: "LOCALE_NAME", locale });
			localeSelect.appendChild(option);
		}
		localeSelect.addEventListener("change", async function() {
			await availableAPIs.runKlvlCode("modules.locales.defaultLocale = " + JSON.stringify(localeSelect.value));
			installed_modules.push("50-locale-" + localeSelect.value + ".fs");
			await availableAPIs.windowTitleSet(await availableAPIs.lookupLocale("INSTALL_PCOS"));
			localeSelect.remove();
			await availableAPIs.closeability(true);
			resolve();
		});
		if (automatic_configuration.defaultLocale) {
			localeSelect.value = automatic_configuration.defaultLocale;
			localeSelect.dispatchEvent(new Event("change"));
		}
		document.body.appendChild(localeSelect);
	});
	if (exec_args[0]) onClose = async function() {
		mainInstallerContent.hidden = true;
		closeContent.hidden = false;
		await availableAPIs.closeability(false);
	}
	const licenseText = `Copyright (c) 2024 PCsoft
Original Source Code Repository: https://github.com/PC-trollbox/pcos3

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
---
Used libraries:
	xterm.js:
		Copyright (c) 2017-2022, The xterm.js authors (https://github.com/xtermjs/xterm.js/graphs/contributors) (MIT License)
		Copyright (c) 2014-2017, SourceLair, Private Company (www.sourcelair.com) (MIT License)
		Copyright (c) 2012-2013, Christopher Jeffrey (MIT License)
	tweetnacl.js:
		Public domain, https://github.com/dchest/tweetnacl-js
	fast-myers-diff (minified and modified):
		Copyright 2021 Logan R. Kearsley (https://github.com/gliese1337/fast-myers-diff)`;
	let mainInstallerContent = document.createElement("div");
	let closeContent = document.createElement("div");
	let header = document.createElement("b");
	let postHeader = document.createElement("br");
	let description = document.createElement("span");
	let content = document.createElement("div");
	let button = document.createElement("button");
	let liveButton = document.createElement("button");
	let confirmDescription = document.createElement("p");
	let buttonYes = document.createElement("button");
	let buttonNo = document.createElement("button");

	closeContent.hidden = true;

	mainInstallerContent.style = "position: absolute; top: 0; left: 0; width: 100%; height: 100%; padding: 8px; box-sizing: border-box;";
	closeContent.style = "position: absolute; top: 0; left: 0; width: 100%; height: 100%; padding: 8px; box-sizing: border-box;";

	confirmDescription.innerText = await availableAPIs.lookupLocale("CLOSE_INSTALLER_CONFIRMATION");
	buttonYes.innerText = await availableAPIs.lookupLocale("YES");
	buttonNo.innerText = await availableAPIs.lookupLocale("NO");
	header.innerText = await availableAPIs.lookupLocale("INSTALLER_TITLE");
	description.innerText = (await availableAPIs.lookupLocale("INSTALLER_INVITATION")).replace("%s", await availableAPIs.getVersion());
	button.innerText = await availableAPIs.lookupLocale("INSTALL_BUTTON");
	liveButton.innerText = await availableAPIs.lookupLocale("LIVE_BUTTON");

	mainInstallerContent.appendChild(header);
	mainInstallerContent.appendChild(postHeader);
	mainInstallerContent.appendChild(description);
	mainInstallerContent.appendChild(content);
	mainInstallerContent.appendChild(button);
	mainInstallerContent.appendChild(document.createElement("br"));
	if (exec_args[0]) mainInstallerContent.appendChild(liveButton);

	closeContent.appendChild(confirmDescription);
	closeContent.appendChild(buttonYes);
	closeContent.insertAdjacentText("beforeend", " ");
	closeContent.appendChild(buttonNo);

	document.body.appendChild(mainInstallerContent);
	document.body.appendChild(closeContent);

	buttonNo.onclick = async function() {
		mainInstallerContent.hidden = false;
		closeContent.hidden = true;
		await availableAPIs.closeability(true);
	}
	buttonYes.onclick = function() {
		onClose = () => availableAPIs.terminate();
		availableAPIs.shutdown({
			isReboot: true
		});
	}

	button.onclick = async function() {
		header.remove();
		postHeader.remove();
		liveButton.remove();
		content.innerHTML = "";
		description.innerText = await availableAPIs.lookupLocale("RIGHT_REVIEW");
		let textareaLicense = document.createElement("textarea");
		textareaLicense.readOnly = true;
		textareaLicense.style.width = "100%";
		textareaLicense.style.height = "100%";
		content.style.height = "100%";
		textareaLicense.value = licenseText;
		content.appendChild(textareaLicense);
		button.innerText = await availableAPIs.lookupLocale("RIGHT_REVIEW_BTN");
		button.onclick = async function() {
			content.innerHTML = "";
			content.style.height = "";
			description.innerText = await availableAPIs.lookupLocale("LET_CREATE_ACCOUNT");
			button.innerText = await availableAPIs.lookupLocale("CREATE");
			let useraccountname = document.createElement("input");
			let useraccountpassword = document.createElement("input");
			let darkmode = document.createElement("input");
			let darkmode_lb = document.createElement("label");
			useraccountname.placeholder = await availableAPIs.lookupLocale("USERNAME");
			useraccountpassword.placeholder = await availableAPIs.lookupLocale("PASSWORD");
			useraccountpassword.type = "password";
			darkmode.type = "checkbox";
			darkmode.id = "darkmode";
			darkmode_lb.innerText = await availableAPIs.lookupLocale("DARK_MODE");
			darkmode_lb.htmlFor = "darkmode";
			content.appendChild(useraccountname);
			content.appendChild(document.createElement("br"));
			content.appendChild(useraccountpassword);
			content.appendChild(document.createElement("br"));
			content.appendChild(darkmode);
			content.appendChild(darkmode_lb);
			button.onclick = async function() {
				let username = useraccountname.value;
				let password = useraccountpassword.value;
				if (!username) return;
				if (username.includes("/")) return;
				if (!password) return;
				let homedir = username == "root" ? ("target/root") : ("target/home/" + username);
				let darkModeChecked = darkmode.checked;
				content.innerHTML = "";
				description.innerText = await availableAPIs.lookupLocale("INSTALLER_PARTITIONING");
				button.innerText = await availableAPIs.lookupLocale("PARTITIONING_USE");
				let partitionDataInput = document.createElement("input");
				let partitionDataFormat = document.createElement("button");
				let partitionBootInput = document.createElement("input");
				partitionDataInput.placeholder = await availableAPIs.lookupLocale("PARTITION_DATA");
				partitionDataFormat.innerText = await availableAPIs.lookupLocale("FORMAT_DATA");
				partitionBootInput.placeholder = await availableAPIs.lookupLocale("PARTITION_BOOT");
				partitionDataInput.value = "data";
				partitionBootInput.value = "boot";
				content.appendChild(partitionDataInput);
				content.insertAdjacentText("beforeend", " ");
				content.appendChild(partitionDataFormat);
				content.appendChild(document.createElement("br"));
				content.appendChild(partitionBootInput);
				let initSyncEnd;
				let initSync = new Promise(_ => initSyncEnd = _);
				partitionDataFormat.onclick = async function() {
					if (!partitionDataInput.value) return await htmlAlert(await availableAPIs.lookupLocale("DATA_INPUT_ALERT"));
					let newInstall = false;
					try {
						await availableAPIs.lldaList();
					} catch {
						newInstall = true;
						if (!automatic_configuration?.partitioning?.autoInitNewInstalls) 
							if (!(await htmlConfirm(await availableAPIs.lookupLocale("PROMPT_PARTITION_TABLE")))) return;
						await availableAPIs.lldaInitPartitions();
					}
					let confirmErasePart = true;
					if (!automatic_configuration?.partitioning?.format && !(automatic_configuration?.partitioning?.autoInitNewInstalls && newInstall))
						confirmErasePart = await htmlConfirm(await availableAPIs.lookupLocale("CONFIRM_PARTITION_ERASE"));
					if (confirmErasePart) {
						let partData = await availableAPIs.lldaRead({ partition: partitionDataInput.value });
						let partId;
						try {
							partId = partData.id;
						} catch {}
						if (!partId) partId = (await availableAPIs.cspOperation({
							cspProvider: "basic",
							operation: "random",
							cspArgument: new Uint8Array(64)
						})).reduce((a, b) => a + b.toString(16).padStart(2, "0"), "")
						await availableAPIs.lldaWrite({
							partition: partitionDataInput.value,
							data: {
								files: {},
								permissions: {},
								id: partId
							}
						});
					}
					initSyncEnd();
					return;
				}
				button.onclick = async function() {
					let diskDataPartition = partitionDataInput.value;
					let diskBootPartition = partitionBootInput.value;
					if (!diskDataPartition) return await htmlAlert(await availableAPIs.lookupLocale("DATA_INPUT_ALERT"));
					if (!diskBootPartition) return await htmlAlert(await availableAPIs.lookupLocale("BOOT_INPUT_ALERT"));
					try {
						if (!(await availableAPIs.lldaList()).includes(diskDataPartition)) throw new Error();
					} catch {
						return await htmlAlert(await availableAPIs.lookupLocale("CANNOT_FIND_PARTITION"));
					}

					let tempCopy = Object.keys((await availableAPIs.lldaRead({ partition: diskDataPartition })) || {});
					if (!tempCopy.includes("files") || !tempCopy.includes("permissions"))
						if (!(await htmlConfirm(await availableAPIs.lookupLocale("PCFS_DETECTION_ERROR")))) return;

					tempCopy = null;
					content.innerHTML = "";
					button.hidden = true;
					description.innerHTML = (await availableAPIs.lookupLocale("INSTALLING_PCOS")).replace("%s", await availableAPIs.lookupLocale("PLEASE_WAIT"));
					await availableAPIs.closeability(false);
					description.innerHTML = (await availableAPIs.lookupLocale("INSTALLING_PCOS")).replace("%s", await availableAPIs.lookupLocale("CREATING_BOOT_PARTITION"));
					await availableAPIs.lldaWrite({
						partition: diskBootPartition,
						data: `
					try {
						const AsyncFunction = (async () => {}).constructor;
						let pre_boot_part = coreExports.disk.partition(${JSON.stringify(diskDataPartition)}).getData();
						let pre_boot_modules = pre_boot_part?.files;
						if (!pre_boot_modules) {
							coreExports.tty_bios_api.println("No files were found in the storage partition");
							throw new Error("No files were found in the storage partition");
						}
						pre_boot_modules = pre_boot_modules[coreExports.bootSection || "boot"];
						if (!pre_boot_modules) {
							coreExports.tty_bios_api.println("No boot modules were found");
							throw new Error("No boot modules were found");
						}
						let pre_boot_module_list = Object.keys(pre_boot_modules);
						pre_boot_module_list = pre_boot_module_list.sort((a, b) => a.localeCompare(b));
						let pre_boot_module_script = "";
						for (let module of pre_boot_module_list) {
							if (coreExports.bootMode == "logboot") pre_boot_module_script += "coreExports.tty_bios_api.println(" + JSON.stringify(module) + ");\\n";
							pre_boot_module_script += await coreExports.idb.readPart(pre_boot_part.id + "-" + pre_boot_modules[module]);
						}
						await new AsyncFunction(pre_boot_module_script)();
					} catch (e) {
						coreExports.tty_bios_api.println("Boot failed");
						coreExports.tty_bios_api.println("Press Enter to continue and log this error locally");
						await coreExports.tty_bios_api.inputLine();
						throw e;
					}
					`});
					try {
						description.innerHTML = (await availableAPIs.lookupLocale("INSTALLING_PCOS")).replace("%s", await availableAPIs.lookupLocale("MOUNTING_DATA_PARTITION"));
						await availableAPIs.fs_mount({
							mountpoint: "target",
							filesystem: "PCFSiDBMount",
							filesystemOptions: {
								partition: diskDataPartition
							}
						});
						description.innerHTML = (await availableAPIs.lookupLocale("INSTALLING_PCOS")).replace("%s", await availableAPIs.lookupLocale("CHANGING_ROOT_PERMISSIONS"));
						await availableAPIs.fs_chmod({ path: "target", newPermissions: "rx" });
						description.innerHTML = (await availableAPIs.lookupLocale("INSTALLING_PCOS")).replace("%s", await availableAPIs.lookupLocale("COPYING_FOLDERS"));
						try {
							recursiveRemove("target/modules");
						} catch {}
						try {
							await availableAPIs.fs_mkdir({ path: "target/modules" });
						} catch {}
						let modules = await availableAPIs.fs_ls({ path: (await availableAPIs.getSystemMount()) + "/modules" });
						for (let module of installed_modules) {
							if (!modules.includes(module)) {
								if (downloadFromBdpOnMissing) try {
									let fetchModule = await bdpGet(new URL("/module_repository/" + module, downloadFromBdpOnMissing));
									if (fetchModule.error) throw new Error(fetchModule.error);
									await availableAPIs.fs_write({ path: "target/modules/" + module, data: fetchModule.content });
									modules.push(module);
								} catch (e) {
									console.error("Failed to fetch module", module, ":", e);
									throw new Error("Module required (" + module + ")");
								}
								else throw new Error("Module required (" + module + ")");
							} else {
								await availableAPIs.fs_write({
									path: "target/modules/" + module,
									data: await availableAPIs.fs_read({
										path: (await availableAPIs.getSystemMount()) + "/modules/" + module
									})
								});
							}
						}
						description.innerHTML = (await availableAPIs.lookupLocale("INSTALLING_PCOS")).replace("%s", await availableAPIs.lookupLocale("CREATING_DIRECTORY_STRUCTURE"));
						try {
							await availableAPIs.fs_mkdir({ path: "target/apps" });
							await availableAPIs.fs_mkdir({ path: "target/apps/associations" });
							await availableAPIs.fs_mkdir({ path: "target/apps/links" });
							await availableAPIs.fs_mkdir({ path: "target/boot" });
							await availableAPIs.fs_mkdir({ path: "target/etc" });
							await availableAPIs.fs_mkdir({ path: "target/etc/wallpapers" });
							await availableAPIs.fs_mkdir({ path: "target/etc/icons" });
							await availableAPIs.fs_mkdir({ path: "target/etc/sounds" });
							await availableAPIs.fs_mkdir({ path: "target/etc/keys" });
							await availableAPIs.fs_mkdir({ path: "target/etc/security" });
							await availableAPIs.fs_chmod({
								path: "target/etc/security",
								newPermissions: ""
							});
							await availableAPIs.fs_mkdir({ path: "target/root" });
							await availableAPIs.fs_mkdir({ path: "target/home" });
						} catch {}
						description.innerHTML = (await availableAPIs.lookupLocale("INSTALLING_PCOS")).replace("%s", await availableAPIs.lookupLocale("PATCHING_FS"));
						let systemCode = "let localSystemMount = \".storage\";\nlet mountOptions = {\n\tpartition: " + JSON.stringify(diskDataPartition) + "\n};\ntry {\n\tmodules.fs.mounts[localSystemMount] = await modules.mounts.PCFSiDBMount(mountOptions);\n\tmodules.defaultSystem = localSystemMount;\n} catch (e) {\n\tawait panic(\"SYSTEM_PARTITION_MOUNTING_FAILED\", { underlyingJS: e, name: \"fs.mounts\", params: [localSystemMount, mountOptions]});\n}\n";
						await availableAPIs.fs_write({ path: "target/boot/01-fsboot.js", data: systemCode });
						description.innerHTML = (await availableAPIs.lookupLocale("INSTALLING_PCOS")).replace("%s", await availableAPIs.lookupLocale("SETTING_LOCALE_PREFERENCE"));
						await availableAPIs.fs_write({ path: "target/boot/06-localeset.js", data: "modules.locales.defaultLocale = " + JSON.stringify(await availableAPIs.osLocale()) + ";\n" });
						description.innerHTML = (await availableAPIs.lookupLocale("INSTALLING_PCOS")).replace("%s", await availableAPIs.lookupLocale("GENERATING_KERNEL"));
						let entireBoot = [];
						let entireBootFiles = [];
						let bootFiles = await availableAPIs.fs_ls({ path: "target/boot" });
						if (bootFiles.includes("00-compiled.js")) bootFiles.splice(bootFiles.indexOf("00-compiled.js"), 1);
						if (bootFiles.includes("99-zzpatchfinisher.js")) bootFiles.splice(bootFiles.indexOf("99-zzpatchfinisher.js"), 1);
						for (let bootFile of bootFiles) {
							entireBootFiles.push(bootFile);
							entireBoot.push([ bootFile, await availableAPIs.fs_read({
								path: "target/boot/" + bootFile
							}) ]);
						}
						modules = (await availableAPIs.fs_ls({ path: "target/modules" })).sort((a, b) => a.localeCompare(b));
						for (let module of modules) {
							let moduleFile = JSON.parse(await availableAPIs.fs_read({ path: "target/modules/" + module }));
							for (let bootFile in (moduleFile.backend.files.boot || [])) {
								if (entireBootFiles.includes(bootFile)) continue;
								entireBoot.push([ bootFile, moduleFile.files[moduleFile.backend.files.boot[bootFile]] ]);
								entireBootFiles.push(bootFile);
							}
						}
						entireBoot = entireBoot.sort((a, b) => a[0].localeCompare(b[0]))
							.map(a => "// modules/.../boot/" + a[0] + "\n" + a[1]).join("\n");
						await availableAPIs.fs_write({ path: "target/boot/00-compiled.js", data: entireBoot + "\nreturn;/*" });
						await availableAPIs.fs_write({ path: "target/boot/99-zzpatchfinisher.js", data: "*/" });
						description.innerHTML = (await availableAPIs.lookupLocale("INSTALLING_PCOS")).replace("%s", await availableAPIs.lookupLocale("INSTALLING_SYSTEM_APPHARDEN"));
						if (automatic_configuration.secondstage.appHarden) await availableAPIs.fs_write({
							path: "target/etc/appHarden",
							data: JSON.stringify(automatic_configuration.secondstage.appHarden)
						});
						description.innerHTML = (await availableAPIs.lookupLocale("INSTALLING_PCOS")).replace("%s", await availableAPIs.lookupLocale("INSTALLING_NET_CONF"));
						if (automatic_configuration.secondstage.network) await availableAPIs.fs_write({
							path: "target/etc/network.json",
							data: JSON.stringify(automatic_configuration.secondstage.network)
						});
						description.innerHTML = (await availableAPIs.lookupLocale("INSTALLING_PCOS")).replace("%s", await availableAPIs.lookupLocale("CREATING_USER"));
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
								algorithm: { name: "PBKDF2" },
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
						await availableAPIs.cspOperation({ cspProvider: "basic", operation: "unloadKey", cspArgument: key });
						let currentMount = await availableAPIs.getSystemMount();
						await availableAPIs.setSystemMount("target");
						await availableAPIs.fs_write({
							path: "target/etc/security/users",
							data: JSON.stringify({authui: {
								securityChecks: [],
								groups: ["authui"],
								homeDirectory: "system",
								blankPrivileges: true,
								additionalPrivilegeSet: [ "IPC_SEND_PIPE", "GET_LOCALE", "GET_THEME", "ELEVATE_PRIVILEGES", "FS_READ", "FS_LIST_PARTITIONS", "CSP_OPERATIONS" ]
							}})
						});
						await availableAPIs.fs_chmod({ path: "target/etc/security/users", newPermissions: "" });
						await availableAPIs.setUserInfo({
							desiredUser: username,
							info: {
								securityChecks: [
									{
										type: "pbkdf2",
										hash: u8aToHex(derived),
										salt: u8aToHex(salt)
									}
								],
								groups: [ username, "users" ],
								homeDirectory: "system" + homedir.slice(6),
								blankPrivileges: false
							}
						});
						await availableAPIs.setSystemMount(currentMount);
						description.innerHTML = (await availableAPIs.lookupLocale("INSTALLING_PCOS")).replace("%s", await availableAPIs.lookupLocale("CREATING_USER_HOME"));
						try {
							await availableAPIs.fs_mkdir({ path: homedir });
							await availableAPIs.fs_chown({ path: homedir, newUser: username });
							await availableAPIs.fs_chgrp({ path: homedir, newGrp: username });
							await availableAPIs.fs_chmod({ path: homedir, newPermissions: "rx" });
						} catch {}
						try {
							await availableAPIs.fs_mkdir({ path: homedir + "/desktop" });
							await availableAPIs.fs_chown({ path: homedir + "/desktop", newUser: username });
							await availableAPIs.fs_chgrp({ path: homedir + "/desktop", newGrp: username });
							await availableAPIs.fs_chmod({ path: homedir + "/desktop", newPermissions: "rx" });
						} catch {}
						description.innerHTML = (await availableAPIs.lookupLocale("INSTALLING_PCOS")).replace("%s", await availableAPIs.lookupLocale("INSTALLING_WP2U"));
						let wallpaperModule;
						try {
							wallpaperModule = JSON.parse(await availableAPIs.fs_read({ path: "target/modules/50-pcos-wallpapers.fs" }));
						} catch {}
						if (wallpaperModule) {
							try {
								await availableAPIs.fs_write({
									path: homedir + "/.wallpaper",
									data: wallpaperModule.files[wallpaperModule.backend.files.etc.wallpapers["pcos" + (darkModeChecked ? "-dark" : "") + "-beta.pic"]]
								});
								await availableAPIs.fs_chown({ path: homedir + "/.wallpaper", newUser: username });
								await availableAPIs.fs_chgrp({ path: homedir + "/.wallpaper", newGrp: username });
								await availableAPIs.fs_chmod({ path: homedir + "/.wallpaper", newPermissions: "rx" });
							} catch {}
						}
						description.innerHTML = (await availableAPIs.lookupLocale("INSTALLING_PCOS")).replace("%s", await availableAPIs.lookupLocale("INSTALLING_WP2L"));
						try {
							await availableAPIs.fs_write({
								path: "target/etc/wallpapers/lockscreen.pic",
								data: wallpaperModule.files[wallpaperModule.backend.files.etc.wallpapers["pcos-lock-beta.pic"]]
							});
						} catch {}
						description.innerHTML = (await availableAPIs.lookupLocale("INSTALLING_PCOS")).replace("%s", await availableAPIs.lookupLocale("INSTALLING_DARKMODE"));
						await availableAPIs.fs_write({
							path: homedir + "/.darkmode",
							data: darkModeChecked.toString()
						});
						await availableAPIs.fs_chown({ path: homedir + "/.darkmode", newUser: username });
						await availableAPIs.fs_chgrp({ path: homedir + "/.darkmode", newGrp: username });
						await availableAPIs.fs_chmod({ path: homedir + "/.darkmode", newPermissions: "rx" });
						description.innerHTML = await availableAPIs.lookupLocale("INSTALLATION_SUCCESSFUL");
						if (!automatic_configuration.autoRestart) await availableAPIs.closeability(true);
						onClose = function() {
							onClose = () => availableAPIs.terminate();
							availableAPIs.shutdown({
								isReboot: true,
								isKexec: automatic_configuration.autoRestart == "kexec"
							});
						}
						if (automatic_configuration.autoRestart) onClose();
					} catch (e) {
						console.error(e);
						description.innerHTML = await availableAPIs.lookupLocale("INSTALLATION_FAILED");
						await availableAPIs.closeability(true);
						onClose = function() {
							onClose = () => availableAPIs.terminate();
							availableAPIs.shutdown({
								isReboot: true
							});
						}
						throw e;
					}
				}
				if (automatic_configuration.partitioning) {
					partitionDataInput.value = automatic_configuration.partitioning.data || "data";
					partitionBootInput.value = automatic_configuration.partitioning.boot || "boot";
					let newInstall = false;
					try { await availableAPIs.lldaList(); } catch { newInstall = true; }
					if (automatic_configuration.partitioning.format || (newInstall && automatic_configuration.partitioning.autoInitNewInstalls)) {
						partitionDataFormat.click();
						await initSync;
					}
					button.click();
				}
			}
			useraccountname.value = automatic_configuration.secondstage.createAccount.username || useraccountname.value;
			useraccountpassword.value = automatic_configuration.secondstage.createAccount.password || "";
			darkmode.checked = automatic_configuration.secondstage.createAccount.darkMode || darkmode.checked;
			useraccountname.disabled = automatic_configuration.secondstage.createAccount.lockUsername;
			if (automatic_configuration.secondstage.createAccount.lockUsername) useraccountname.title = await availableAPIs.lookupLocale("PROVISIONED_PREFERENCE");
			if (automatic_configuration.secondstage.createAccount.create) button.click();
		}
		if (automatic_configuration.acceptEULA) button.click();
	}
	liveButton.onclick = async function() {
		header.remove();
		postHeader.remove();
		liveButton.remove();
		content.innerHTML = "";
		description.innerText = await availableAPIs.lookupLocale("RIGHT_REVIEW");
		let textareaLicense = document.createElement("textarea");
		textareaLicense.readOnly = true;
		textareaLicense.style.width = "100%";
		textareaLicense.style.height = "100%";
		content.style.height = "100%";
		textareaLicense.value = licenseText;
		content.appendChild(textareaLicense);
		button.innerText = await availableAPIs.lookupLocale("RIGHT_REVIEW_BTN");
		button.onclick = async function() {
			content.innerHTML = "";
			content.style.height = "";
			await availableAPIs.sendToPipe({
				pipe: exec_args[0],
				data: true
			});
			await availableAPIs.terminate();
		}
	}
	if (automatic_configuration.startInstall) button.click()
})();

async function htmlAlert(msg) {
	let overlay = document.createElement("div");
	let overlayingMessage = document.createElement("div");
	let description = document.createElement("span");
	let buttonAccept = document.createElement("button");
	overlay.style = "position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: black; opacity: 85%;";
	overlayingMessage.style = "position: absolute; top: 0px; left: 0px; width: 100%; height: 100%; padding: 8px; box-sizing: border-box; color: white;";
	description.innerText = msg;
	buttonAccept.innerText = "Ok";
	overlayingMessage.appendChild(description);
	overlayingMessage.appendChild(document.createElement("hr"));
	overlayingMessage.appendChild(buttonAccept);
	document.body.appendChild(overlay);
	document.body.appendChild(overlayingMessage);
	return new Promise(function(resolve) {
		buttonAccept.onclick = function() {
			overlay.remove();
			overlayingMessage.remove();
			resolve();
		}
	});
}

async function htmlConfirm(msg) {
	let overlay = document.createElement("div");
	let overlayingMessage = document.createElement("div");
	let description = document.createElement("span");
	let buttonAccept = document.createElement("button");
	let buttonDecline = document.createElement("button");
	overlay.style = "position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: black; opacity: 85%;";
	overlayingMessage.style = "position: absolute; top: 0px; left: 0px; width: 100%; height: 100%; padding: 8px; box-sizing: border-box; color: white;";
	description.innerText = msg;
	buttonAccept.innerText = await availableAPIs.lookupLocale("YES");
	buttonDecline.innerText = await availableAPIs.lookupLocale("NO");
	overlayingMessage.appendChild(description);
	overlayingMessage.appendChild(document.createElement("hr"));
	overlayingMessage.appendChild(buttonAccept);
	overlayingMessage.appendChild(buttonDecline);
	document.body.appendChild(overlay);
	document.body.appendChild(overlayingMessage);
	return new Promise(function(resolve) {
		buttonAccept.onclick = function() {
			overlay.remove();
			overlayingMessage.remove();
			resolve(true);
		}
		buttonDecline.onclick = function() {
			overlay.remove();
			overlayingMessage.remove();
			resolve(false);
		}
	});
}

async function recursiveCopy(source, destination, permissions) {
	for (let sourceFile of await availableAPIs.fs_ls({ path: source })) {
		let destinationFile = destination + "/" + sourceFile;
		if (await availableAPIs.fs_isDirectory({ path: source + "/" + sourceFile })) {
			try {
				await availableAPIs.fs_mkdir({ path: destinationFile });
			} catch {}
			await recursiveCopy(source + "/" + sourceFile, destinationFile, permissions);
		} else {
			await availableAPIs.fs_write({
				path: destinationFile,
				data: await availableAPIs.fs_read({ path: source + "/" + sourceFile })
			});
		}
		if (permissions) {
			let originalPermissions = await availableAPIs.fs_permissions({ path: source + "/" + sourceFile });
			await availableAPIs.fs_chmod({ path: destinationFile, newPermissions: originalPermissions.world });
			await availableAPIs.fs_chgrp({ path: destinationFile, newGrp: originalPermissions.group });
			await availableAPIs.fs_chown({ path: destinationFile, newUser: originalPermissions.owner });
		}
	}
}

async function recursiveRemove(target) {
	for (let targetFile of await availableAPIs.fs_ls({ path: target })) {
		targetFile = target + "/" + targetFile;
		if (await availableAPIs.fs_isDirectory({ path: targetFile })) await recursiveRemove(targetFile);
		await availableAPIs.fs_rm({ path: targetFile });
	}
}

async function bdpGet(path) {
	let url = new URL(path);
	if (url.protocol != "bdp:") throw new Error(await availableAPIs.lookupLocale("BLOG_BROWSER_PROTO"));
	if (url.port) throw new Error(await availableAPIs.lookupLocale("BLOG_BROWSER_GATESET"));
	let hostname = url.hostname, address;
	if (url.hostname.includes("[")) {
		hostname = IPv6Decompressor(url.hostname.slice(1, -1)).replaceAll(":", "");
		address = hostname;
	} else address = await availableAPIs.resolve(hostname);
	if (!address) throw new Error(await availableAPIs.lookupLocale("HOSTNAME_RESOLUTION_FAILED"));
	let connection = await availableAPIs.connfulConnect({
		gate: url.username || "blog",
		address,
		verifyByDomain: hostname
	});
	await availableAPIs.connfulConnectionSettled(connection);
	await availableAPIs.connfulWrite({
		connectionID: connection,
		data: url.pathname + url.search,
		host: hostname
	});
	let data = await availableAPIs.connfulRead(connection);
	data = JSON.parse(data);
	let chunks = [];
	while (chunks.length != data.length) {
		let newData = await availableAPIs.connfulRead(connection);
		newData = JSON.parse(newData);
		chunks[newData.ctr] = newData.chunk;
	}
	try {
		await availableAPIs.connfulClose(connection);
	} catch {}
	return { ...data, content: chunks.join("") };
}

addEventListener("signal", async function(e) {
	if (e.detail == 15) onClose();
}); 