// =====BEGIN MANIFEST=====
// allow: FS_UNMOUNT, FS_MOUNT, CSP_OPERATIONS, GET_THEME, GET_LOCALE, FS_REMOVE, FS_READ, FS_WRITE, FS_LIST_PARTITIONS, FS_BYPASS_PERMISSIONS, RESOLVE_NAME, CONNFUL_CONNECT, CONNFUL_READ, CONNFUL_WRITE, CONNFUL_DISCONNECT, GET_UPDATE_SERVICE, SYSTEM_SHUTDOWN
// signer: automaticSigner
// =====END MANIFEST=====
let hexToU8A = (hex) => Uint8Array.from(hex.match(/.{1,2}/g).map(a => parseInt(a, 16)));
(async function() {
	// @pcos-app-mode isolatable
	await availableAPIs.windowTitleSet(await availableAPIs.lookupLocale("MODMGR_TITLE"));
	let privileges = await availableAPIs.getPrivileges();
	document.body.style.fontFamily = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
	if (await availableAPIs.isDarkThemed()) document.body.style.color = "white";
	let checklist = [ "FS_UNMOUNT", "FS_MOUNT", "CSP_OPERATIONS", "FS_REMOVE", "FS_READ", "FS_WRITE", "FS_LIST_PARTITIONS", "FS_BYPASS_PERMISSIONS", "RESOLVE_NAME", "CONNFUL_CONNECT", "CONNFUL_READ", "CONNFUL_WRITE", "CONNFUL_DISCONNECT", "GET_UPDATE_SERVICE", "SYSTEM_SHUTDOWN" ];
	if (!checklist.every(p => privileges.includes(p))) {
		document.body.innerText = await availableAPIs.lookupLocale("MODMGR_PRIVFAIL");
		let currentToken = await availableAPIs.getProcessToken();
		let newToken = await availableAPIs.consentGetToken({
			intent: await availableAPIs.lookupLocale("MODMGR_INTENT"),
			name: await availableAPIs.lookupLocale("MODMGR_TITLE")
		});
		if (!newToken) return;
		await availableAPIs.setProcessToken(newToken);
		await availableAPIs.revokeToken(currentToken);
		privileges = await availableAPIs.getPrivileges();
		if (!checklist.every(p => privileges.includes(p))) return;
	}
	document.body.innerText = "";

	let styleElement = document.createElement("style");
	styleElement.innerText = `th, td { border: 1px solid black; }
	table { overflow: scroll; min-width: 100%; width: max-content; }`;
	document.head.appendChild(styleElement);
	let container = document.createElement("div");
	let activityNote = document.createElement("div");
	let updateModCfgBtn = document.createElement("button");
	let installOnlineModuleBtn = document.createElement("button");
	let removeModuleBtn = document.createElement("button");
	let updateSystemButton = document.createElement("button");
	let regenerateKernelBtn = document.createElement("button");

	updateModCfgBtn.innerText = await availableAPIs.lookupLocale("UPDATE_MODCFG");
	installOnlineModuleBtn.innerText = await availableAPIs.lookupLocale("INSTALL_ONLINE_MODULE");
	removeModuleBtn.innerText = await availableAPIs.lookupLocale("REMOVE_MODULES");
	updateSystemButton.innerText = await availableAPIs.lookupLocale("UPDATE_BUTTON");
	regenerateKernelBtn.innerText = await availableAPIs.lookupLocale("REGENERATE_KERNEL");

	updateModCfgBtn.addEventListener("click", async function() {
		await availableAPIs.closeability(false);
		container.hidden = true;
		activityNote.innerText = await availableAPIs.lookupLocale("UPDATING_MODCFG");
		try {
			let updateService = new URL("bdp://localhost");
			updateService.hostname = await availableAPIs.getUpdateService();
			let moduleConfig = JSON.parse(await availableAPIs.fs_read({
				path: (await availableAPIs.getSystemMount()) + "/etc/moduleConfig.json"
			}));
			moduleConfig.remote = JSON.parse((await bdpGet(new URL("/module_repository/moduleConfig.json", updateService))).content);
			await availableAPIs.fs_write({
				path: (await availableAPIs.getSystemMount()) + "/etc/moduleConfig.json",
				data: JSON.stringify(moduleConfig)
			});
			activityNote.innerText = await availableAPIs.lookupLocale("UPDATE_COUNTING");
			let forUpdate = [];
			for (let module in moduleConfig.local) if (moduleConfig.remote.hasOwnProperty(module))
				if (moduleConfig.remote[module].version > moduleConfig.local[module].version) 
					forUpdate.push(module);
			activityNote.innerText = (await availableAPIs.lookupLocale("UPDATE_COUNT")).replace("%s", forUpdate.length);
		} catch (e) {
			console.error(e);
			activityNote.innerText = await availableAPIs.lookupLocale("FAILED_TO_UPDATE");
		}
		container.hidden = false;
		await availableAPIs.closeability(true);
	});

	installOnlineModuleBtn.addEventListener("click", async function() {
		container.hidden = true;
		await availableAPIs.closeability(false);
		activityNote.innerText = "";
		try {
			let updateService = new URL("bdp://localhost");
			updateService.hostname = await availableAPIs.getUpdateService();
			let moduleConfig = JSON.parse(await availableAPIs.fs_read({
				path: (await availableAPIs.getSystemMount()) + "/etc/moduleConfig.json"
			}));
			let table = document.createElement("table");
			let tableHead = document.createElement("thead");
			let tableHeadRow = document.createElement("tr");
			let tableCellInstalled = document.createElement("th");
			let tableCellModName = document.createElement("th");
			let tableCellModVersion = document.createElement("th");
			let tableCellTargeting = document.createElement("th");
			let tableBody = document.createElement("tbody");
			let applyChangesBtn = document.createElement("button");
			let discardChangesBtn = document.createElement("button");
			tableCellModName.innerText = await availableAPIs.lookupLocale("MODNAME_CELL");
			tableCellModVersion.innerText = await availableAPIs.lookupLocale("MODVER_CELL");
			tableCellTargeting.innerText = await availableAPIs.lookupLocale("MODTGT_CELL");
			applyChangesBtn.innerText = await availableAPIs.lookupLocale("APPLY_CHANGES");
			discardChangesBtn.innerText = await availableAPIs.lookupLocale("DISCARD_CHANGES");
			let lostModules = Object.keys(moduleConfig.local).filter(a => !(moduleConfig.remote || {})[a]).sort((a, b) => a.localeCompare(b));
			let remoteModules = Object.keys(moduleConfig.remote || {}).sort((a, b) => a.localeCompare(b));
			let toInstall = [];
			let isRegenNeeded = false;
			for (let module of lostModules) {
				let tableRow = document.createElement("tr");
				let tableCellInstalled = document.createElement("td");
				let tableCellModName = document.createElement("td");
				let tableCellModVersion = document.createElement("td");
				let tableCellTargeting = document.createElement("td");
				let checkboxInstalled = document.createElement("input");
				checkboxInstalled.type = "checkbox";
				checkboxInstalled.checked = true;
				checkboxInstalled.disabled = true;
				tableCellModName.innerText = module;
				tableCellModVersion.innerText = moduleConfig.local[module].version;
				tableCellTargeting.innerText = moduleConfig.local[module].for;
				tableCellInstalled.appendChild(checkboxInstalled);
				tableRow.appendChild(tableCellInstalled);
				tableRow.appendChild(tableCellModName);
				tableRow.appendChild(tableCellModVersion);
				tableRow.appendChild(tableCellTargeting);
				tableBody.appendChild(tableRow);
			}
			for (let module of remoteModules) {
				let tableRow = document.createElement("tr");
				let tableCellInstalled = document.createElement("td");
				let tableCellModName = document.createElement("td");
				let tableCellModVersion = document.createElement("td");
				let tableCellTargeting = document.createElement("td");
				let checkboxInstalled = document.createElement("input");
				checkboxInstalled.type = "checkbox";
				let isInstalled = false, isUpdatable = false;
				checkboxInstalled.checked = checkboxInstalled.disabled = moduleConfig.local[module];
				if (checkboxInstalled.checked) isInstalled = true;
				if (checkboxInstalled.checked && moduleConfig.remote[module].version > moduleConfig.local[module].version) {
					checkboxInstalled.checked = checkboxInstalled.disabled = false;
					checkboxInstalled.indeterminate = true;
					isUpdatable = true;
				}

				checkboxInstalled.onchange = function() {
					if (!checkboxInstalled.checked && isUpdatable) checkboxInstalled.indeterminate = true;
					if (toInstall.includes(module)) toInstall.splice(toInstall.indexOf(module), 1);
					else toInstall.push(module);
				};

				tableCellModName.innerText = module;
				tableCellModVersion.innerText = moduleConfig.remote[module].version;
				if (isInstalled && moduleConfig.remote[module].version > moduleConfig.local[module].version)
					tableCellModVersion.innerText = moduleConfig.local[module].version + " -> " + tableCellModVersion.innerText;
				tableCellTargeting.innerText = moduleConfig.remote[module].for;
				if (isInstalled && moduleConfig.remote[module].for != moduleConfig.local[module].for)
					tableCellTargeting.innerText = moduleConfig.local[module].version + " -> " + tableCellTargeting.innerText;

				tableCellInstalled.appendChild(checkboxInstalled);
				tableRow.appendChild(tableCellInstalled);
				tableRow.appendChild(tableCellModName);
				tableRow.appendChild(tableCellModVersion);
				tableRow.appendChild(tableCellTargeting);
				tableBody.appendChild(tableRow);
			}
			tableHeadRow.appendChild(tableCellInstalled);
			tableHeadRow.appendChild(tableCellModName);
			tableHeadRow.appendChild(tableCellModVersion);
			tableHeadRow.appendChild(tableCellTargeting);
			tableHead.appendChild(tableHeadRow);
			table.appendChild(tableHead);
			table.appendChild(tableBody);
			activityNote.appendChild(table);
			activityNote.appendChild(applyChangesBtn);
			activityNote.appendChild(discardChangesBtn);
			await new Promise(async function(resolve, reject) {
				discardChangesBtn.onclick = _ => reject();
				applyChangesBtn.onclick = async function() {
					try {
						for (let module of toInstall) {
							activityNote.innerText = (await availableAPIs.lookupLocale("INSTALLING_MODULE")).replace("%s", module);
							if (moduleConfig.local[module] && moduleConfig.remote[module].bootOrder != moduleConfig.local[module].bootOrder)
								await availableAPIs.fs_rm({
									path: (await availableAPIs.getSystemMount()) + "/modules/" + moduleConfig.local[module].bootOrder + "-" + module + ".fs"
								});
							let moduleContent = (await bdpGet(new URL("/module_repository/" + moduleConfig.remote[module].bootOrder + "-" + module + ".fs", updateService))).content;
							await availableAPIs.fs_write({
								path: (await availableAPIs.getSystemMount()) + "/modules/" + moduleConfig.remote[module].bootOrder + "-" + module + ".fs",
								data: moduleContent
							});
							if (JSON.parse(moduleContent).backend?.files?.boot) isRegenNeeded = true;
							moduleConfig.local[module] = JSON.parse(moduleContent).buildInfo;
						}
						await availableAPIs.fs_write({
							path: (await availableAPIs.getSystemMount()) + "/etc/moduleConfig.json",
							data: JSON.stringify(moduleConfig)
						});
						activityNote.innerText = await availableAPIs.lookupLocale("RELOADING_MODULES");
						await reloadModules(await availableAPIs.getSystemMount());
						try {
							if (isRegenNeeded) await regenerateKernel();
						} catch (e) {
							console.error(e);
							activityNote.innerText = await availableAPIs.lookupLocale("REGENERATING_KERNEL_FAILED");
						}
						activityNote.innerText = await availableAPIs.lookupLocale("SUCCESSFUL_OP");
						resolve();
					} catch (e) { reject(e); }
				}
			});
		} catch (e) {
			console.error(e);
			activityNote.innerText = await availableAPIs.lookupLocale("FAILED_OP");
		}
		container.hidden = false;
		await availableAPIs.closeability(true);
	});

	removeModuleBtn.addEventListener("click", async function() {
		container.hidden = true;
		await availableAPIs.closeability(false);
		activityNote.innerText = "";
		try {
			let updateService = new URL("bdp://localhost");
			updateService.hostname = await availableAPIs.getUpdateService();
			let moduleConfig = JSON.parse(await availableAPIs.fs_read({
				path: (await availableAPIs.getSystemMount()) + "/etc/moduleConfig.json"
			}));
			let table = document.createElement("table");
			let tableHead = document.createElement("thead");
			let tableHeadRow = document.createElement("tr");
			let tableCellInstalled = document.createElement("th");
			let tableCellModName = document.createElement("th");
			let tableCellModVersion = document.createElement("th");
			let tableCellTargeting = document.createElement("th");
			let tableBody = document.createElement("tbody");
			let applyChangesBtn = document.createElement("button");
			let discardChangesBtn = document.createElement("button");
			tableCellModName.innerText = await availableAPIs.lookupLocale("MODNAME_CELL");
			tableCellModVersion.innerText = await availableAPIs.lookupLocale("MODVER_CELL");
			tableCellTargeting.innerText = await availableAPIs.lookupLocale("MODTGT_CELL");
			applyChangesBtn.innerText = await availableAPIs.lookupLocale("APPLY_CHANGES");
			discardChangesBtn.innerText = await availableAPIs.lookupLocale("DISCARD_CHANGES");
			let toRemove = [];
			let isRegenNeeded = false;
			let localModules = Object.keys(moduleConfig.local).sort((a, b) => a.localeCompare(b));
			for (let module of localModules) {
				let tableRow = document.createElement("tr");
				let tableCellInstalled = document.createElement("td");
				let tableCellModName = document.createElement("td");
				let tableCellModVersion = document.createElement("td");
				let tableCellTargeting = document.createElement("td");
				let checkboxInstalled = document.createElement("input");
				checkboxInstalled.type = "checkbox";
				checkboxInstalled.checked = true;

				checkboxInstalled.onchange = function() {
					if (toRemove.includes(module)) toRemove.splice(toRemove.indexOf(module), 1);
					else toRemove.push(module);
				};

				tableCellModName.innerText = module;
				tableCellModVersion.innerText = moduleConfig.local[module].version;
				tableCellTargeting.innerText = moduleConfig.local[module].for;

				tableCellInstalled.appendChild(checkboxInstalled);
				tableRow.appendChild(tableCellInstalled);
				tableRow.appendChild(tableCellModName);
				tableRow.appendChild(tableCellModVersion);
				tableRow.appendChild(tableCellTargeting);
				tableBody.appendChild(tableRow);
			}
			tableHeadRow.appendChild(tableCellInstalled);
			tableHeadRow.appendChild(tableCellModName);
			tableHeadRow.appendChild(tableCellModVersion);
			tableHeadRow.appendChild(tableCellTargeting);
			tableHead.appendChild(tableHeadRow);
			table.appendChild(tableHead);
			table.appendChild(tableBody);
			activityNote.appendChild(table);
			activityNote.appendChild(applyChangesBtn);
			activityNote.appendChild(discardChangesBtn);
			await new Promise(async function(resolve, reject) {
				discardChangesBtn.onclick = _ => reject();
				applyChangesBtn.onclick = async function() {
					try {
						for (let module of toRemove) {
							activityNote.innerText = (await availableAPIs.lookupLocale("REMOVING_MODULE")).replace("%s", module);
							isRegenNeeded = isRegenNeeded || !!(JSON.parse(await availableAPIs.fs_read({
								path: (await availableAPIs.getSystemMount()) + "/modules/" + moduleConfig.local[module].bootOrder + "-" + module + ".fs"
							})).backend?.files?.boot);
							await availableAPIs.fs_rm({
								path: (await availableAPIs.getSystemMount()) + "/modules/" + moduleConfig.local[module].bootOrder + "-" + module + ".fs"
							});
							delete moduleConfig.local[module];
						}
						await availableAPIs.fs_write({
							path: (await availableAPIs.getSystemMount()) + "/etc/moduleConfig.json",
							data: JSON.stringify(moduleConfig)
						});
						activityNote.innerText = await availableAPIs.lookupLocale("RELOADING_MODULES");
						await reloadModules(await availableAPIs.getSystemMount());
						try {
							if (isRegenNeeded) await regenerateKernel();
						} catch (e) {
							console.error(e);
							activityNote.innerText = await availableAPIs.lookupLocale("REGENERATING_KERNEL_FAILED");
						}
						activityNote.innerText = await availableAPIs.lookupLocale("SUCCESSFUL_OP");
						resolve();
					} catch (e) { reject(e); }
				}
			});
		} catch (e) {
			console.error(e);
			activityNote.innerText = await availableAPIs.lookupLocale("FAILED_OP");
		}
		container.hidden = false;
		await availableAPIs.closeability(true);
	});

	updateSystemButton.addEventListener("click", async function() {
		await availableAPIs.closeability(false);
		container.hidden = true;
		activityNote.innerText = await availableAPIs.lookupLocale("UPDATING_MODULES");
		try {
			let updateService = new URL("bdp://localhost");
			updateService.hostname = await availableAPIs.getUpdateService();
			let moduleConfig = JSON.parse(await availableAPIs.fs_read({
				path: (await availableAPIs.getSystemMount()) + "/etc/moduleConfig.json"
			}));
			let forUpdate = [];
			for (let module in moduleConfig.local) if (moduleConfig.remote.hasOwnProperty(module))
				if (moduleConfig.remote[module].version > moduleConfig.local[module].version) 
					forUpdate.push(module);
			for (let module of forUpdate) {
				activityNote.innerText = (await availableAPIs.lookupLocale("INSTALLING_MODULE")).replace("%s", module);
				if (moduleConfig.remote[module].bootOrder != moduleConfig.local[module].bootOrder)
					await availableAPIs.fs_rm({
						path: (await availableAPIs.getSystemMount()) + "/modules/" + moduleConfig.local[module].bootOrder + "-" + module + ".fs"
					});
				let moduleContent = (await bdpGet(new URL("/module_repository/" + moduleConfig.remote[module].bootOrder + "-" + module + ".fs", updateService))).content;
				await availableAPIs.fs_write({
					path: (await availableAPIs.getSystemMount()) + "/modules/" + moduleConfig.remote[module].bootOrder + "-" + module + ".fs",
					data: moduleContent
				});
				moduleConfig.local[module] = JSON.parse(moduleContent).buildInfo;
			}
			await availableAPIs.fs_write({
				path: (await availableAPIs.getSystemMount()) + "/etc/moduleConfig.json",
				data: JSON.stringify(moduleConfig)
			});
			activityNote.innerText = await availableAPIs.lookupLocale("RELOADING_MODULES");
			await reloadModules(await availableAPIs.getSystemMount());
			try {
				await regenerateKernel();
			} catch (e) {
				console.error(e);
				activityNote.innerText = await availableAPIs.lookupLocale("REGENERATING_KERNEL_FAILED");
			}
			activityNote.innerText = await availableAPIs.lookupLocale("RESTARTING");
			if (forUpdate.length) await availableAPIs.shutdown({ isReboot: true, isKexec: true });
			else activityNote.innerText = await availableAPIs.lookupLocale("SYSTEM_UP_TO_DATE");
		} catch (e) {
			console.error(e);
			activityNote.innerText = await availableAPIs.lookupLocale("FAILED_TO_UPDATE");
		}
		container.hidden = false;
		await availableAPIs.closeability(true);
	});

	async function regenerateKernel() {
		activityNote.innerText = await availableAPIs.lookupLocale("GENERATING_KERNEL");
		let entireBoot = [];
		let bootFiles = await availableAPIs.fs_ls({ path: (await availableAPIs.getSystemMount()) + "/boot" });
		if (bootFiles.includes("00-compiled.js")) bootFiles.splice(bootFiles.indexOf("00-compiled.js"), 1);
		if (bootFiles.includes("99-zzpatchfinisher.js")) bootFiles.splice(bootFiles.indexOf("99-zzpatchfinisher.js"), 1);
		for (let bootFile of bootFiles) {
			entireBoot.push([ bootFile, await availableAPIs.fs_read({
				path: (await availableAPIs.getSystemMount()) + "/boot/" + bootFile
			}) ]);
		}
		entireBoot = entireBoot.sort((a, b) => a[0].localeCompare(b[0]))
			.map(a => "// modules/.../boot/" + a[0] + "\n" + a[1]).join("\n");
		await availableAPIs.fs_write({
			path: (await availableAPIs.getSystemMount()) + "/boot/00-compiled.js",
			data: entireBoot + "\nreturn;/*"
		});
		await availableAPIs.fs_write({
			path: (await availableAPIs.getSystemMount()) + "/boot/99-zzpatchfinisher.js",
			data: "*/"
		});
	}

	regenerateKernelBtn.addEventListener("click", async function() {
		await availableAPIs.closeability(false);
		container.hidden = true;
		try {
			await regenerateKernel();
		} catch (e) {
			console.error(e);
			activityNote.innerText = await availableAPIs.lookupLocale("REGENERATING_KERNEL_FAILED");
		}
		await availableAPIs.closeability(true);
		container.hidden = false;
		activityNote.innerText = await availableAPIs.lookupLocale("SUCCESSFUL_OP");
	});

	container.appendChild(updateModCfgBtn);
	container.appendChild(installOnlineModuleBtn);
	container.appendChild(removeModuleBtn);
	container.appendChild(updateSystemButton);
	container.appendChild(regenerateKernelBtn);
	document.body.appendChild(container);
	document.body.appendChild(activityNote);
})();
async function reloadModules(mnt) {
	let modSys = JSON.parse(await availableAPIs.fs_read({ path: "ram/run/moduleSystem.json" }));
	let prevMnt = modSys[mnt][0];
	await availableAPIs.fs_unmount({ mount: mnt });
	for (let mount of modSys[mnt].slice(1))
		await availableAPIs.fs_unmount({ mount });
	let moduleFiles = await availableAPIs.fs_ls({ path: prevMnt + "/modules" });
	let mntList = [];
	for (let moduleName of moduleFiles) {
		let randomMntName = "." + (await availableAPIs.cspOperation({
			cspProvider: "basic",
			operation: "random",
			cspArgument: new Uint8Array(8)
		})).reduce((a, b) => a + b.toString(16).padStart(2, "0"), "");
		await availableAPIs.fs_mount({
			mountpoint: randomMntName,
			filesystem: "fileMount",
			filesystemOptions: {
				srcFile: prevMnt + "/modules/" + moduleName,
				read_only: true
			}
		});
		mntList.push(randomMntName);
	}
	modSys[mnt] = [ prevMnt, ...mntList ];
	await availableAPIs.fs_mount({
		mountpoint: mnt,
		filesystem: "overlayMount",
		filesystemOptions: {
			mounts: modSys[mnt]
		}
	});
	await availableAPIs.fs_write({
		path: "ram/run/moduleSystem.json",
		data: JSON.stringify(modSys)
	});
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
	if (e.detail == 15) await window.availableAPIs.terminate();
}); null;