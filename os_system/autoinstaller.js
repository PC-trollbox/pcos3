// =====BEGIN MANIFEST=====
// signer: automaticSigner
// allow: GET_LOCALE, RUN_KLVL_CODE, LLDISK_WRITE, LLDISK_READ, FS_READ, FS_WRITE, FS_BYPASS_PERMISSIONS, FS_REMOVE, FS_LIST_PARTITIONS, SYSTEM_SHUTDOWN, FS_CHANGE_PERMISSION, LLDISK_LIST_PARTITIONS, FS_MOUNT, CSP_OPERATIONS, LLDISK_INIT_PARTITIONS
// =====END MANIFEST=====
// Pending modularization
let onClose = () => availableAPIs.terminate();
(async function() {
	// @pcos-app-mode isolatable
	await availableAPIs.attachCLI();
	if (!(await availableAPIs.getPrivileges()).includes("GET_LOCALE")) { await availableAPIs.toMyCLI("autoinstaller: Locale permission denied\r\n");
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

	if (ppos[0] != "install") {
		await availableAPIs.toMyCLI("Usage: autoinstaller install [options]\r\n");
		await availableAPIs.toMyCLI("Automatically installs the OS on the disk.\r\n");
		await availableAPIs.toMyCLI("\t--locale=[locale] - Set the locale to the following\r\n");
		await availableAPIs.toMyCLI("\t--initdisk - Always initialize disk partitions\r\n");
		await availableAPIs.toMyCLI("\t--format - Always format the data partition\r\n");
		await availableAPIs.toMyCLI("\t--real-reboot - Do a real reboot, not \"kexec\".\r\n");
		await availableAPIs.toMyCLI("\t--no-restart - Do not restart the system at the end of installation\r\n");
		await availableAPIs.toMyCLI("\t--data=[dataPartition] - Specify the data partition (default data)\r\n");
		await availableAPIs.toMyCLI("\t--boot=[bootPartition] - Specify the boot partition (default boot)\r\n");
		await availableAPIs.toMyCLI("autoinstaller: " + await availableAPIs.lookupLocale("NO_ARGUMENTS") + "\r\n");
		return availableAPIs.terminate();
	}

	try {
		let partList = [];
		try {
			partList = await availableAPIs.lldaList();
			if (pargs.initdisk) throw new Error("initdisk forced");
		} catch {
			await availableAPIs.lldaInitPartitions();
		}
		if (pargs.format || !partList.includes(pargs.data || "data")) {
			let partData = await availableAPIs.lldaRead({ partition: pargs.data || "data" });
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
				partition: pargs.data || "data",
				data: {
					files: {},
					permissions: {},
					id: partId
				}
			});
		}
		await availableAPIs.toMyCLI(await availableAPIs.lookupLocale("CREATING_BOOT_PARTITION") + "\r\n");
		await availableAPIs.lldaWrite({
			partition: pargs.boot || "boot",
			data: `
				try {
					const AsyncFunction = (async () => {}).constructor;
					let pre_boot_part = coreExports.disk.partition(${JSON.stringify(pargs.data || "data")}).getData();
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
				`
		});
		await availableAPIs.toMyCLI(await availableAPIs.lookupLocale("MOUNTING_DATA_PARTITION") + "\r\n");
		await availableAPIs.fs_mount({
			mountpoint: "target",
			filesystem: "PCFSiDBMount",
			filesystemOptions: {
				partition: pargs.data || "data"
			}
		});
		await availableAPIs.toMyCLI(await availableAPIs.lookupLocale("CHANGING_ROOT_PERMISSIONS") + "\r\n");
		await availableAPIs.fs_chmod({ path: "target", newPermissions: "rx" });
		await availableAPIs.toMyCLI(await availableAPIs.lookupLocale("COPYING_FOLDERS") + "\r\n");
		try {
			await recursiveRemove("target/boot");
		} catch {}
		try {
			await availableAPIs.fs_mkdir({ path: "target/boot" });
		} catch {}
		await recursiveCopy((await availableAPIs.getSystemMount()) + "/boot", "target/boot", true);
		await availableAPIs.toMyCLI(await availableAPIs.lookupLocale("CHANGING_BOOT_PERMISSIONS") + "\r\n");
		await availableAPIs.toMyCLI(await availableAPIs.lookupLocale("PATCHING_FS") + "\r\n");
		let systemCode = "let localSystemMount = \".storage\";\nlet mountOptions = {\n\tpartition: " + JSON.stringify(pargs.data || "data") + "\n};\ntry {\n\tmodules.fs.mounts[localSystemMount] = await modules.mounts.PCFSiDBMount(mountOptions);\n\tmodules.defaultSystem = localSystemMount;\n} catch (e) {\n\tawait panic(\"SYSTEM_PARTITION_MOUNTING_FAILED\", { underlyingJS: e, name: \"fs.mounts\", params: [localSystemMount, mountOptions]});\n}\n";
		await availableAPIs.fs_write({ path: "target/boot/01-fsboot.js", data: systemCode });
		try {
			await availableAPIs.fs_mkdir({ path: "target/modules" });
		} catch {}
		await availableAPIs.toMyCLI(await availableAPIs.lookupLocale("SETTING_LOCALE_PREFERENCE") + "\r\n");
		await availableAPIs.fs_write({ path: "target/boot/06-localeset.js", data: "modules.locales.defaultLocale = " + JSON.stringify(pargs.locale || await availableAPIs.osLocale()) + ";\n" });
		await availableAPIs.toMyCLI("Installation complete.\r\n");
		if (!pargs["no-restart"]) await availableAPIs.shutdown({ isReboot: true, isKexec: !pargs["real-reboot"] });
		await availableAPIs.terminate();
	} catch (e) {
		await availableAPIs.toMyCLI("autoinstaller: " + e.name + ": " + await availableAPIs.lookupLocale(e.message) + " (" + e.message + ")\r\n");
		await availableAPIs.terminate();
	}
})();

async function recursiveCopy(source, destination, permissions) {
	let filesToCopy = await availableAPIs.fs_ls({ path: source });
	for (let sourceFileIndex in filesToCopy) {
		let cliSizeCols = 33;
		let progressBar = "=".repeat(Math.round(sourceFileIndex / filesToCopy.length * (cliSizeCols - 4)));
		progressBar += " ".repeat(cliSizeCols - progressBar.length - 4);
		progressBar += (Math.round(sourceFileIndex / filesToCopy.length * 100) + "%").padStart(4, " ");
		await availableAPIs.toMyCLI("\r" + progressBar);
		let sourceFile = filesToCopy[sourceFileIndex];
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
	await availableAPIs.toMyCLI("\r" + " ".repeat((await availableAPIs.cliSize())[0]) + "\r");
}

async function recursiveRemove(target) {
	let filesToRemove = await availableAPIs.fs_ls({ path: target });
	for (let targetFileIndex in filesToRemove) {
		let cliSizeCols = 33;
		let progressBar = "=".repeat(Math.round(targetFileIndex / filesToRemove.length * (cliSizeCols - 4)));
		progressBar += " ".repeat(cliSizeCols - progressBar.length - 4);
		progressBar += (Math.round(targetFileIndex / filesToRemove.length * 100) + "%").padStart(4, " ");
		await availableAPIs.toMyCLI("\r" + progressBar);
		let targetFile = filesToRemove[targetFileIndex];
		targetFile = target + "/" + targetFile;
		if (await availableAPIs.fs_isDirectory({ path: targetFile })) await recursiveRemove(targetFile);
		await availableAPIs.fs_rm({ path: targetFile });
	}
	await availableAPIs.toMyCLI("\r" + " ".repeat((await availableAPIs.cliSize())[0]) + "\r");
}

addEventListener("signal", async function(e) {
	if (e.detail == 15) onClose();
}); 