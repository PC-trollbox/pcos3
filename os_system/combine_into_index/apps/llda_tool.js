// =====BEGIN MANIFEST=====
// allow: GET_LOCALE, LLDISK_WRITE, LLDISK_READ, FS_READ, FS_WRITE, FS_BYPASS_PERMISSIONS, LLDISK_LIST_PARTITIONS, LLDISK_REMOVE
// signer: automaticSigner
// =====END MANIFEST=====
(async function() {
	// @pcos-app-mode isolatable
	await availableAPIs.windowVisibility(false);
	await availableAPIs.attachCLI();
	if (!(await availableAPIs.getPrivileges()).includes("GET_LOCALE")) { await availableAPIs.toMyCLI("llda_tool: Locale permission denied\r\n");
		return await availableAPIs.terminate();	}
	if (!exec_args.length) {
		await availableAPIs.toMyCLI(await availableAPIs.lookupLocale("LLDA_USAGE") + "\r\n");
		await availableAPIs.toMyCLI(await availableAPIs.lookupLocale("LLDA_ACTION_EXPORT") + "\r\n");
		await availableAPIs.toMyCLI(await availableAPIs.lookupLocale("LLDA_ACTION_IMPORT") + "\r\n");
		await availableAPIs.toMyCLI(await availableAPIs.lookupLocale("LLDA_ACTION_IMPORTSTRING") + "\r\n");
		await availableAPIs.toMyCLI(await availableAPIs.lookupLocale("LLDA_ACTION_COPY") + "\r\n");
		await availableAPIs.toMyCLI(await availableAPIs.lookupLocale("LLDA_ACTION_REMOVE") + "\r\n");
		await availableAPIs.toMyCLI(await availableAPIs.lookupLocale("LLDA_ACTION_LIST") + "\r\n");
		await availableAPIs.toMyCLI(await availableAPIs.lookupLocale("LLDA_DISCLAIMER") + "\r\n");
		await availableAPIs.toMyCLI("llda_tool: " + await availableAPIs.lookupLocale("NO_ARGUMENTS") + "\r\n");
		return availableAPIs.terminate();
	}

	try {
		if (exec_args[0] == "export") {
			await availableAPIs.fs_write({
				path: exec_args[2],
				data: JSON.stringify(await availableAPIs.lldaRead({ partition: exec_args[1] }))
			});
		} else if (exec_args[0] == "import") {
			await availableAPIs.lldaWrite({ partition: exec_args[2], data: JSON.parse(await availableAPIs.fs_read({ path: exec_args[1] })) });
		} else if (exec_args[0] == "importstring") {
			await availableAPIs.lldaWrite({ partition: exec_args[2], data: await availableAPIs.fs_read({ path: exec_args[1] }) });
		} else if (exec_args[0] == "copy") {
			await availableAPIs.lldaWrite({ partition: exec_args[2], data: await availableAPIs.lldaRead({ partition: exec_args[1] }) });
		} else if (exec_args[0] == "remove") {
			await availableAPIs.lldaRemove({ partition: exec_args[1] });
		} else if (exec_args[0] == "list") {
			await availableAPIs.toMyCLI(JSON.stringify(await availableAPIs.lldaList()) + "\r\n");
		} else {
			await availableAPIs.toMyCLI("llda_tool: " + await availableAPIs.lookupLocale("LLDA_UNKNOWN_ACTION") + "\r\n");
		}
	} catch (e) {
		await availableAPIs.toMyCLI("llda_tool: " + await availableAPIs.lookupLocale(e.message) + "\r\n");
	}
	
	await availableAPIs.terminate();
})();
addEventListener("signal", async function(e) {
	if (e.detail == 15) await window.availableAPIs.terminate();
}); null;