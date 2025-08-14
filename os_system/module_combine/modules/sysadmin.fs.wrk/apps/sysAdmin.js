// =====BEGIN MANIFEST=====
// link: lrn:SYSADMIN_TOOLS_TITLE
// signer: automaticSigner
// fnName: sysadminInstaller
// allow: SYSTEM_SHUTDOWN, FETCH_SEND, LLDISK_WRITE, RUN_KLVL_CODE, FS_READ, FS_WRITE, FS_LIST_PARTITIONS, GET_LOCALE, GET_THEME, IPC_CREATE_PIPE, IPC_LISTEN_PIPE, FS_BYPASS_PERMISSIONS, LLDISK_READ, LLDISK_LIST_PARTITIONS, LLDISK_INIT_PARTITIONS, LLDISK_REMOVE, LLDISK_IDB_READ, LLDISK_IDB_WRITE, LLDISK_IDB_REMOVE, LLDISK_IDB_LIST, LLDISK_IDB_SYNC, IPC_SEND_PIPE, START_TASK, FS_REMOVE, FS_MOUNT, SET_FIRMWARE, RESOLVE_NAME, CONNFUL_CONNECT, CONNFUL_READ, CONNFUL_WRITE, CONNFUL_DISCONNECT, CSP_OPERATIONS, GET_UPDATE_SERVICE, GET_USER_INFO
// =====END MANIFEST=====
(async function() {
	// @pcos-app-mode isolatable
	await availableAPIs.windowTitleSet(await availableAPIs.lookupLocale("SYSADMIN_TOOLS_TITLE"));
	let privileges = await availableAPIs.getPrivileges();
	document.body.style.fontFamily = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
	if (await availableAPIs.isDarkThemed()) document.body.style.color = "white";
	let container = document.createElement("div");
	let extraActivities = document.createElement("div");
	let osReinstallButton = document.createElement("button");
	let fsckOrderButton = document.createElement("button");
	let fsckDiscardButton = document.createElement("button");
	let wipeSystemButton = document.createElement("button");
	let updateSystemButton = document.createElement("button");
	let updateFirmwareButton = document.createElement("button");
	let imagingButton = document.createElement("button");
	let changeLocale = document.createElement("button");
	let regenerateKernel = document.createElement("button");
	osReinstallButton.innerText = await availableAPIs.lookupLocale("REINSTALL_BUTTON");
	fsckOrderButton.innerText = await availableAPIs.lookupLocale("FSCK_BUTTON");
	fsckDiscardButton.innerText = await availableAPIs.lookupLocale("DISCARD_BUTTON");
	wipeSystemButton.innerText = await availableAPIs.lookupLocale("SWIPE_BUTTON");
	updateSystemButton.innerText = await availableAPIs.lookupLocale("UPDATE_BUTTON");
	updateFirmwareButton.innerText = await availableAPIs.lookupLocale("UPDATEFW_BUTTON");
	imagingButton.innerText = await availableAPIs.lookupLocale("SYSTEM_IMAGING");
	changeLocale.innerText = await availableAPIs.lookupLocale("CHANGE_LOCALE");
	regenerateKernel.innerText = await availableAPIs.lookupLocale("REGENERATE_KERNEL");
	osReinstallButton.addEventListener("click", async function() {
		extraActivities.innerText = await availableAPIs.lookupLocale("WORK_IN_PROGRESS_AFTER_MODULAR");
	});
	fsckOrderButton.addEventListener("click", async function() {
		let checklist = [ "SYSTEM_SHUTDOWN", "FS_WRITE", "FS_BYPASS_PERMISSIONS" ];
		if (!checklist.every(p => privileges.includes(p))) {
			extraActivities.innerText = await availableAPIs.lookupLocale("SYSADMIN_TOOLS_PRIVFAIL");
			return;
		}
		await availableAPIs.closeability(false);
		container.hidden = true;
		extraActivities.innerText = await availableAPIs.lookupLocale("SETTING_FSCK_FLAG");
		try {
			await availableAPIs.fs_write({
				path: (await availableAPIs.getSystemMount()) + "/.fsck",
				data: "recover"
			});
		} catch {
			extraActivities.innerText = await availableAPIs.lookupLocale("SETTING_FSCK_FLAG_FAILED");
			container.hidden = false;
			return;
		}
		extraActivities.innerText = await availableAPIs.lookupLocale("RESTARTING");
		await availableAPIs.shutdown({
			isReboot: true
		});
	});
	fsckDiscardButton.addEventListener("click", async function() {
		let checklist = [ "SYSTEM_SHUTDOWN", "FS_WRITE", "FS_BYPASS_PERMISSIONS" ];
		if (!checklist.every(p => privileges.includes(p))) {
			extraActivities.innerText = await availableAPIs.lookupLocale("SYSADMIN_TOOLS_PRIVFAIL");
			return;
		}
		await availableAPIs.closeability(false);
		container.hidden = true;
		extraActivities.innerText = await availableAPIs.lookupLocale("SETTING_FSCK_FLAG");
		try {
			await availableAPIs.fs_write({
				path: (await availableAPIs.getSystemMount()) + "/.fsck",
				data: "discard"
			});
		} catch {
			extraActivities.innerText = await availableAPIs.lookupLocale("SETTING_FSCK_FLAG_FAILED");
			container.hidden = false;
			return;
		}
		extraActivities.innerText = await availableAPIs.lookupLocale("RESTARTING");
		await availableAPIs.shutdown({
			isReboot: true
		});
	});
	wipeSystemButton.addEventListener("click", async function() {
		container.hidden = true;
		let promptMessage = document.createElement("span");
		let inputBox = document.createElement("input");
		let randomString = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString(16);
		promptMessage.innerText = "Copy-paste " + randomString + " to confirm: ";
		extraActivities.innerText = "";
		extraActivities.appendChild(promptMessage);
		extraActivities.appendChild(inputBox);
		await new Promise(function(resolve, reject) {
			inputBox.oninput = async function() {
				if (inputBox.value.trim() == randomString) resolve();
				else {
					container.hidden = false;
					extraActivities.innerText = await availableAPIs.lookupLocale("SYSADMIN_TOOLS_PRIVFAIL");
					reject("Invalid confirmation");
				}
			}
		});
		let checklist = [ "FS_REMOVE", "FS_MOUNT", "FS_READ", "LLDISK_IDB_READ", "LLDISK_IDB_WRITE", "LLDISK_IDB_REMOVE", "LLDISK_IDB_LIST", "LLDISK_IDB_SYNC", "SYSTEM_SHUTDOWN", "FS_BYPASS_PERMISSIONS" ];
		if (!checklist.every(p => privileges.includes(p))) {
			container.hidden = false;
			extraActivities.innerText = await availableAPIs.lookupLocale("SYSADMIN_TOOLS_PRIVFAIL");
			return;
		}
		await availableAPIs.closeability(false);
		extraActivities.innerText = await availableAPIs.lookupLocale("WIPING_SYSTEM");
		try {
			await availableAPIs.fs_mount({
				mountpoint: "pref",
				filesystem: "preferenceMount",
				filesystemOptions: {}
			});
			let prefOpts = await availableAPIs.fs_ls({ path: "pref" });
			for (let prefOpt of prefOpts) await availableAPIs.fs_rm({ path: "pref/" + prefOpt });
			let idb_keys = await availableAPIs.lldaIDBList();
			for (let key of idb_keys) {
				let partLen = (await availableAPIs.lldaIDBRead({ key })).length;
				let randomness = "";
				while (randomness.length < partLen) {
					let remainingBytes = Math.round((partLen - randomness.length) / 2);
					if (remainingBytes > 65536) remainingBytes = 65536;
					randomness += crypto.getRandomValues(new Uint8Array(remainingBytes)).reduce((a, b) => a + b.toString(16).padStart(2, "0"), "");
				}
				await availableAPIs.lldaIDBWrite({ key, value: randomness });
				await availableAPIs.lldaIDBSync();
				await availableAPIs.lldaIDBRemove({ key });
				await availableAPIs.lldaIDBSync();
			}
			
			await availableAPIs.shutdown({});
		} catch (e) {
			await availableAPIs.closeability(true);
			console.error(e);
			extraActivities.innerText = await availableAPIs.lookupLocale("WIPING_SYSTEM_FAILED");
			container.hidden = false;
			return;
		}
	});
	updateSystemButton.addEventListener("click", async function() {
		let checklist = [ "FS_REMOVE", "RESOLVE_NAME", "CONNFUL_CONNECT", "CONNFUL_READ", "CONNFUL_WRITE", "CONNFUL_DISCONNECT", "GET_UPDATE_SERVICE", "FS_WRITE", "FS_BYPASS_PERMISSIONS" ];
		if (!checklist.every(p => privileges.includes(p))) {
			extraActivities.innerText = await availableAPIs.lookupLocale("SYSADMIN_TOOLS_PRIVFAIL");
			return;
		}
		await availableAPIs.closeability(false);
		container.hidden = true;
		extraActivities.innerText = await availableAPIs.lookupLocale("UPDATING_MODCFG");
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
			extraActivities.innerText = await availableAPIs.lookupLocale("UPDATING_MODULES");
			let forUpdate = [];
			for (let module in moduleConfig.local) if (moduleConfig.remote.hasOwnProperty(module))
				if (moduleConfig.remote[module].version > moduleConfig.local[module].version) 
					forUpdate.push(module);
			for (let module of forUpdate) {
				if (moduleConfig.remote[module].bootOrder != moduleConfig.local[module].bootOrder)
					await availableAPIs.fs_rm({
						path: (await availableAPIs.getSystemMount()) + "/modules/" + moduleConfig.local[module].bootOrder + "-" + module + ".fs"
					});
				await availableAPIs.fs_write({
					path: (await availableAPIs.getSystemMount()) + "/modules/" + moduleConfig.remote[module].bootOrder + "-" + module + ".fs",
					data: (await bdpGet(new URL("/module_repository/" + moduleConfig.remote[module].bootOrder + "-" + module + ".fs", updateService))).content
				});
				moduleConfig.local[module] = moduleConfig.remote[module];
			}
			await availableAPIs.fs_write({
				path: (await availableAPIs.getSystemMount()) + "/etc/moduleConfig.json",
				data: JSON.stringify(moduleConfig)
			});
			extraActivities.innerText = await availableAPIs.lookupLocale("RESTARTING");
			if (forUpdate.length) await availableAPIs.shutdown({ isReboot: true, isKexec: true });
			else extraActivities.innerText = await availableAPIs.lookupLocale("SYSTEM_UP_TO_DATE");
		} catch (e) {
			console.error(e);
			extraActivities.innerText = await availableAPIs.lookupLocale("FAILED_TO_UPDATE");
		}
		container.hidden = false;
		await availableAPIs.closeability(true);
	});
	updateFirmwareButton.addEventListener("click", async function() {
		let checklist = [ "FETCH_SEND", "SYSTEM_SHUTDOWN", "SET_FIRMWARE" ];
		if (!checklist.every(p => privileges.includes(p))) {
			extraActivities.innerText = await availableAPIs.lookupLocale("SYSADMIN_TOOLS_PRIVFAIL");
			return;
		}
		await availableAPIs.closeability(false);
		container.hidden = true;
		extraActivities.innerText = await availableAPIs.lookupLocale("UPDATEFW_DOWNLOADING");
		let fwArchive;
		try {
			fwArchive = await availableAPIs.fetchSend({
				url: "/init.js",
				init: {}
			});
			if (!fwArchive.ok) throw new Error("Download failed");
		} catch (e) {
			await availableAPIs.closeability(true);
			console.error(e);
			extraActivities.innerText = await availableAPIs.lookupLocale("UPDATEFW_DOWNLOAD_FAILED");
			container.hidden = false;
			return;
		}
		extraActivities.innerText = await availableAPIs.lookupLocale("UPDATEFW_DECODING");
		fwArchive = fwArchive.arrayBuffer;
		fwArchive = new TextDecoder().decode(fwArchive);
		extraActivities.innerText = await availableAPIs.lookupLocale("UPDATEFW_SETTING");
		await availableAPIs.setFirmware(fwArchive);
		extraActivities.innerText = await availableAPIs.lookupLocale("RESTARTING");
		await availableAPIs.shutdown({
			isReboot: true
		});
	});
	imagingButton.addEventListener("click", async function() {
		let checklist = [ "GET_THEME", "LLDISK_READ", "LLDISK_WRITE", "LLDISK_LIST_PARTITIONS", "LLDISK_INIT_PARTITIONS", "LLDISK_REMOVE", "LLDISK_IDB_READ", "LLDISK_IDB_WRITE", "LLDISK_IDB_REMOVE", "LLDISK_IDB_LIST", "LLDISK_IDB_SYNC", "FS_READ", "FS_WRITE", "FS_BYPASS_PERMISSIONS", "SYSTEM_SHUTDOWN", "FS_LIST_PARTITIONS", "IPC_SEND_PIPE", "GET_LOCALE", "IPC_CREATE_PIPE", "IPC_LISTEN_PIPE", "START_TASK" ];
		if (!checklist.every(p => privileges.includes(p))) {
			extraActivities.innerText = await availableAPIs.lookupLocale("SYSADMIN_TOOLS_PRIVFAIL");
			return;
		}
		await availableAPIs.windowTitleSet(await availableAPIs.lookupLocale("SYSTEM_IMAGING"));
		imaging();
	});
	changeLocale.addEventListener("click", async function() {
		let checklist = [ "GET_THEME", "GET_LOCALE", "FS_WRITE", "FS_BYPASS_PERMISSIONS", "RUN_KLVL_CODE", "FS_LIST_PARTITIONS" ];
		if (!checklist.every(p => privileges.includes(p))) {
			extraActivities.innerText = await availableAPIs.lookupLocale("SYSADMIN_TOOLS_PRIVFAIL");
			return;
		}
		container.hidden = true;
		extraActivities.innerText = "";
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
			await availableAPIs.fs_write({
				path: (await availableAPIs.getSystemMount()) + "/boot/06-localeset.js", 
				data: "modules.locales.defaultLocale = " + JSON.stringify(await availableAPIs.osLocale()) + ";\n"
			});
			localeSelect.remove();
			container.hidden = false;
			extraActivities.innerText = await availableAPIs.lookupLocale("SUCCESSFUL_OP");
		});
		extraActivities.appendChild(localeSelect);
	});
	regenerateKernel.addEventListener("click", async function() {
		let checklist = [ "FS_READ", "FS_WRITE", "FS_LIST_PARTITIONS", "FS_BYPASS_PERMISSIONS" ];
		if (!checklist.every(p => privileges.includes(p))) {
			extraActivities.innerText = await availableAPIs.lookupLocale("SYSADMIN_TOOLS_PRIVFAIL");
			return;
		}
		await availableAPIs.closeability(false);
		container.hidden = true;
		extraActivities.innerText = await availableAPIs.lookupLocale("GENERATING_KERNEL");
		try {
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
		} catch (e) {
			console.error(e);
			extraActivities.innerText = await availableAPIs.lookupLocale("REGENERATING_KERNEL_FAILED");
		}
		await availableAPIs.closeability(true);
		container.hidden = false;
		extraActivities.innerText = await availableAPIs.lookupLocale("SUCCESSFUL_OP");
	});
	container.appendChild(fsckOrderButton);
	container.appendChild(fsckDiscardButton);
	container.appendChild(osReinstallButton);
	container.appendChild(wipeSystemButton);
	container.appendChild(updateSystemButton);
	container.appendChild(updateFirmwareButton);
	container.appendChild(imagingButton);
	container.appendChild(changeLocale);
	container.appendChild(regenerateKernel);
	document.body.appendChild(container);
	document.body.appendChild(extraActivities);
})();
function imaging() {
	async function mainPage() {
		document.body.innerText = "";
		let create = document.createElement("button");
		let restore = document.createElement("button");
		create.innerText = await availableAPIs.lookupLocale("CREATE_IMAGE");
		restore.innerText = await availableAPIs.lookupLocale("RESTORE_IMAGE");
		create.onclick = createPage;
		restore.onclick = restorePage;
		document.body.appendChild(create);
		document.body.appendChild(restore);
	}

	async function createPage() {
		document.body.innerText = "";
		let backBtn = document.createElement("button");
		let pageTitle = document.createElement("span");
		let selectedFileLabel = document.createElement("label");
		let selectedFile = document.createElement("input");
		let selectedFileButton = document.createElement("button");
		let createBtn = document.createElement("button");
		let progressBar = document.createElement("progress");
		let outcome = document.createElement("span");
		backBtn.innerText = "<-";
		pageTitle.innerText = await availableAPIs.lookupLocale("CREATE_IMAGE");
		selectedFileLabel.innerText = await availableAPIs.lookupLocale("SELECT_FILE_PROMPT");
		selectedFileButton.innerText = await availableAPIs.lookupLocale("SAVE_BTN");
		createBtn.innerText = await availableAPIs.lookupLocale("CREATE_IMAGE");
		outcome.innerText = await availableAPIs.lookupLocale("EMPTY_STATUSBAR");
		progressBar.hidden = true;
		document.body.appendChild(backBtn);
		document.body.appendChild(pageTitle);
		document.body.appendChild(document.createElement("hr"));
		document.body.appendChild(selectedFileLabel);
		document.body.appendChild(selectedFile);
		document.body.appendChild(selectedFileButton);
		document.body.appendChild(document.createElement("hr"));
		document.body.appendChild(createBtn);
		document.body.appendChild(progressBar);
		document.body.appendChild(outcome);

		backBtn.onclick = mainPage;
		selectedFileButton.onclick = async function() {
			let ipcPipe = await availableAPIs.createPipe();
			await availableAPIs.windowVisibility(false);
			await availableAPIs.startTask({ file: (await availableAPIs.getSystemMount()) + "/apps/filePicker.js", argPassed: [ipcPipe, "save"] });
			let result = await availableAPIs.listenToPipe(ipcPipe);
			await availableAPIs.closePipe(ipcPipe);
			await availableAPIs.windowVisibility(true);
			if (result.success) selectedFile.value = result.selected;
		}

		createBtn.onclick = async function() {
			backBtn.disabled = true;
			selectedFile.disabled = true;
			selectedFileButton.disabled = true;
			createBtn.disabled = true;
			progressBar.hidden = false;
			outcome.hidden = true;
			progressBar.max = 0;
			progressBar.value = 0;
			await availableAPIs.closeability(false);

			async function stopProduction(oc) {
				backBtn.disabled = false;
				selectedFile.disabled = false;
				selectedFileButton.disabled = false;
				createBtn.disabled = false;
				progressBar.hidden = true;
				outcome.hidden = false;
				outcome.innerText = oc;
				await availableAPIs.closeability(true);
			}

			if (selectedFile.value == "") return stopProduction(await availableAPIs.lookupLocale("FILE_NOT_SPECIFIED"));
			let image = { metadata: {}, data: {} };
			let subImage = [];
			try { subImage = await availableAPIs.lldaList(); progressBar.max = subImage.length;
				} catch { return stopProduction(await availableAPIs.lookupLocale("LISTING_PARTITIONS_FAILED")); }
			for (let partition of subImage) try { image.metadata[partition] = await availableAPIs.lldaRead({ partition }); progressBar.value++;
				} catch { return stopProduction((await availableAPIs.lookupLocale("READING_PARTITION_FAILED")).replace("%s", partition)); }
			try { subImage = await availableAPIs.lldaIDBList(); progressBar.max += subImage.length;
				} catch { return stopProduction(await availableAPIs.lookupLocale("LISTING_DATA_FAILED")); } 
			for (let dataPart of subImage) try { image.data[dataPart] = await availableAPIs.lldaIDBRead({ key: dataPart }); progressBar.value++;
				} catch { return stopProduction(await availableAPIs.lookupLocale("READING_DATA_FAILED")); }
			subImage = [];
			try { await availableAPIs.fs_write({ path: selectedFile.value, data: JSON.stringify(image) });
				} catch { return stopProduction(await availableAPIs.lookupLocale("WRITING_IMAGE_FAILED")); }
			stopProduction(await availableAPIs.lookupLocale("SUCCESSFUL_OP"));
		}
	}

	async function restorePage() {
		document.body.innerText = "";
		let backBtn = document.createElement("button");
		let pageTitle = document.createElement("span");
		let selectedFileLabel = document.createElement("label");
		let selectedFile = document.createElement("input");
		let selectedFileButton = document.createElement("button");
		let rebootOnRestore = document.createElement("input");
		let rebootOnRestoreLabel = document.createElement("label");
		let mergeFlag = document.createElement("input");
		let mergeFlagLabel = document.createElement("label");
		let restoreBtn = document.createElement("button");
		let progressBar = document.createElement("progress");
		let outcome = document.createElement("span");
		backBtn.innerText = "<-";
		pageTitle.innerText = await availableAPIs.lookupLocale("RESTORE_IMAGE");
		selectedFileLabel.innerText = await availableAPIs.lookupLocale("SELECT_FILE_PROMPT");
		selectedFileButton.innerText = await availableAPIs.lookupLocale("LOAD_BTN");
		restoreBtn.innerText = await availableAPIs.lookupLocale("RESTORE_IMAGE");
		rebootOnRestoreLabel.innerText = await availableAPIs.lookupLocale("REBOOT_ON_RESTORE");
		mergeFlagLabel.innerText = await availableAPIs.lookupLocale("MERGE_STATES");
		outcome.innerText = await availableAPIs.lookupLocale("EMPTY_STATUSBAR");
		rebootOnRestore.type = "checkbox";
		mergeFlag.type = "checkbox";
		rebootOnRestore.id = "rebootOnRestore";
		mergeFlag.id = "mergeFlag";
		rebootOnRestoreLabel.htmlFor = "rebootOnRestore";
		mergeFlagLabel.htmlFor = "mergeFlag";
		progressBar.hidden = true;
		document.body.appendChild(backBtn);
		document.body.appendChild(pageTitle);
		document.body.appendChild(document.createElement("hr"));
		document.body.appendChild(selectedFileLabel);
		document.body.appendChild(selectedFile);
		document.body.appendChild(selectedFileButton);
		document.body.appendChild(document.createElement("br"));
		document.body.appendChild(rebootOnRestore);
		document.body.appendChild(rebootOnRestoreLabel);
		document.body.appendChild(document.createElement("br"));
		document.body.appendChild(mergeFlag);
		document.body.appendChild(mergeFlagLabel);
		document.body.appendChild(document.createElement("hr"));
		document.body.appendChild(restoreBtn);
		document.body.appendChild(progressBar);
		document.body.appendChild(outcome);

		backBtn.onclick = mainPage;
		selectedFileButton.onclick = async function() {
			let ipcPipe = await availableAPIs.createPipe();
			await availableAPIs.windowVisibility(false);
			await availableAPIs.startTask({ file: (await availableAPIs.getSystemMount()) + "/apps/filePicker.js", argPassed: [ipcPipe, "load"] });
			let result = await availableAPIs.listenToPipe(ipcPipe);
			await availableAPIs.closePipe(ipcPipe);
			await availableAPIs.windowVisibility(true);
			if (result.success) selectedFile.value = result.selected;
		}

		restoreBtn.onclick = async function() {
			backBtn.disabled = true;
			selectedFile.disabled = true;
			selectedFileButton.disabled = true;
			restoreBtn.disabled = true;
			rebootOnRestore.disabled = true;
			mergeFlag.disabled = true;
			outcome.hidden = true;
			progressBar.hidden = false;
			progressBar.max = 0;
			progressBar.value = 0;
			await availableAPIs.closeability(false);

			async function stopProduction(oc) {
				backBtn.disabled = false;
				selectedFile.disabled = false;
				selectedFileButton.disabled = false;
				restoreBtn.disabled = false;
				rebootOnRestore.disabled = false;
				mergeFlag.disabled = false;
				outcome.hidden = false;
				progressBar.hidden = true;
				outcome.innerText = oc;
				await availableAPIs.closeability(true);
			}

			if (selectedFile.value == "") return stopProduction(await availableAPIs.lookupLocale("FILE_NOT_SPECIFIED"));
			try { await availableAPIs.lldaList();
				} catch { await availableAPIs.lldaInitPartitions(); }

			let image;
			try { image = JSON.parse(await availableAPIs.fs_read({ path: selectedFile.value }));
				} catch { return stopProduction(await availableAPIs.lookupLocale("READING_IMAGE_FAILED")); }

			progressBar.max += Object.keys(image.metadata).length + Object.keys(image.data).length;
			for (let partition in image.metadata) try { await availableAPIs.lldaWrite({ partition, data: image.metadata[partition] }); progressBar.value++;
				} catch { return stopProduction((await availableAPIs.lookupLocale("WRITING_PARTITION_FAILED")).replace("%s", partition)); }
			for (let dataPart in image.data) try { await availableAPIs.lldaIDBWrite({ key: dataPart, value: image.data[dataPart] }); progressBar.value++;
				} catch { return stopProduction(await availableAPIs.lookupLocale("WRITING_DATA_FAILED")); }
			
			if (!mergeFlag.checked) {
				let currentSubImage = [];
				try { currentSubImage = (await availableAPIs.lldaList()).filter(a => !Object.keys(image.metadata).includes(a)); progressBar.max += currentSubImage.length;
					} catch { return stopProduction(await availableAPIs.lookupLocale("LISTING_PARTITIONS_FAILED")); }
				for (let partition of currentSubImage) try { await availableAPIs.lldaRemove({ partition }); progressBar.value++;
					} catch { return stopProduction((await availableAPIs.lookupLocale("DELETING_PARTITION_FAILED")).replace("%s", partition)); }
				
				try { currentSubImage = (await availableAPIs.lldaIDBList()).filter(a => !Object.keys(image.data).includes(a)); progressBar.max += currentSubImage.length;
					} catch { return stopProduction(await availableAPIs.lookupLocale("LISTING_DATA_FAILED")); }
				for (let dataPart of currentSubImage) try { await availableAPIs.lldaIDBRemove({ key: dataPart }); progressBar.value++;
					} catch { return stopProduction(await availableAPIs.lookupLocale("DELETING_DATA_FAILED")); }
				currentSubImage = [];
			}

			try { await availableAPIs.lldaIDBSync();
			} catch {}

			if (rebootOnRestore.checked) try { await availableAPIs.shutdown({ isReboot: true });
				} catch { return stopProduction(await availableAPIs.lookupLocale("SHUTTING_DOWN_FAILED")); }
			stopProduction(await availableAPIs.lookupLocale("SUCCESSFUL_OP"));
		}
	}
	mainPage();
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