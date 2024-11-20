// =====BEGIN MANIFEST=====
// allow: GET_LOCALE, LLDISK_LIST_PARTITIONS, LLDISK_WRITE, LLDISK_REMOVE, LLDISK_READ, CSP_OPERATIONS
// signer: automaticSigner
// =====END MANIFEST=====
(async function() {
	// @pcos-app-mode isolatable
	await availableAPIs.windowVisibility(false);
	await availableAPIs.attachCLI();
	if (!exec_args.length) {
		await availableAPIs.toMyCLI(await availableAPIs.lookupLocale("FORMAT_USAGE") + "\r\n");
		await availableAPIs.toMyCLI(await availableAPIs.lookupLocale("FORMAT_DESCRIPTION") + "\r\n");
		await availableAPIs.toMyCLI(await availableAPIs.lookupLocale("FORMAT_FSTYPE") + "\r\n")
		await availableAPIs.toMyCLI("format: " + await availableAPIs.lookupLocale("NO_ARGUMENTS") + "\r\n");
		return availableAPIs.terminate();
	}
	if (exec_args.length < 2 || exec_args.length > 3) {
		await availableAPIs.toMyCLI("format: " + await availableAPIs.lookupLocale("ARGUMENT_COUNT_MISMATCH") + "\r\n");
		return await availableAPIs.terminate();
	}
	
	let knownNames = await availableAPIs.lldaList();
	if (knownNames.includes(exec_args[1]) && exec_args[2] != "overwrite") {
		await availableAPIs.toMyCLI("format: " + await availableAPIs.lookupLocale("FORMAT_OVERWRITE_WARN") + "\r\n");
		return await availableAPIs.terminate();
	}

	let u8aToHex = (u8a) => Array.from(u8a).map(a => a.toString(16).padStart(2, "0")).join("");
	if (exec_args[0] == "pcfs") {
		let prevId = (await availableAPIs.lldaRead({ partition: exec_args[1] }))?.id || u8aToHex(await availableAPIs.cspOperation({
			cspProvider: "basic",
			operation: "random",
			cspArgument: new Uint8Array(64)
		}));
		await availableAPIs.lldaWrite({
			partition: exec_args[1],
			data: {
				files: {},
				permissions: {},
				id: prevId
			}
		});
	} else if (exec_args[0].startsWith("pcfs_crypt")) {
		let monokey = exec_args[0].endsWith("_monokey");
		let prevId = (await availableAPIs.lldaRead({ partition: exec_args[1] }))?.id || u8aToHex(await availableAPIs.cspOperation({
			cspProvider: "basic",
			operation: "random",
			cspArgument: new Uint8Array(64)
		}));
		let salt = u8aToHex(await availableAPIs.cspOperation({
			cspProvider: "basic",
			operation: "random",
			cspArgument: new Uint8Array(32)
		}));
		await availableAPIs.lldaWrite({
			partition: exec_args[1],
			data: {
				files: {},
				permissions: {},
				id: prevId,
				cryptodata: {
					passwordLockingInitial: monokey,
					salt: salt
				},
				encryptedFileTable: exec_args[0].endsWith("_filetable_monokey")
			}
		})
	} else if (exec_args[0].startsWith("pcbm:")) {
		let diskDataPartition = exec_args[0].split(":").slice(1).join(":");
		await availableAPIs.lldaWrite({
			partition: exec_args[1],
			data: `try {
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
			}`
		});
	} else if (exec_args[0] == "null") {
		await availableAPIs.lldaRemove({
			partition: exec_args[1]
		});
	} else {
		await availableAPIs.toMyCLI("format: " + await availableAPIs.lookupLocale("FORMAT_UNKNOWN_FSTYPE") + "\r\n");
	}
	
	await availableAPIs.terminate();
})();
addEventListener("signal", async function(e) {
	if (e.detail == 15) await window.availableAPIs.terminate();
}); null;