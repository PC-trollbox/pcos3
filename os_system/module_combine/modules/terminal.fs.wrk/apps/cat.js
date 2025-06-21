// =====BEGIN MANIFEST=====
// signer: automaticSigner
// allow: GET_LOCALE, FS_READ, FS_BYPASS_PERMISSIONS
// =====END MANIFEST=====
(async function() {
	// @pcos-app-mode isolatable
	await availableAPIs.windowVisibility(false);
	await availableAPIs.attachCLI();
	if (!(await availableAPIs.getPrivileges()).includes("GET_LOCALE")) { await availableAPIs.toMyCLI("cat: Locale permission denied\r\n");
		return await availableAPIs.terminate();	}
	if (!exec_args.length) {
		await availableAPIs.toMyCLI(await availableAPIs.lookupLocale("CAT_USAGE") + "\r\n");
		await availableAPIs.toMyCLI(await availableAPIs.lookupLocale("CAT_DESCRIPTION") + "\r\n");
		await availableAPIs.toMyCLI("cat: " + await availableAPIs.lookupLocale("NO_ARGUMENTS") + "\r\n");
		return availableAPIs.terminate();
	}
	for (let file of exec_args) {
		try {
			let data = await availableAPIs.fs_read({ path: file });
			await availableAPIs.toMyCLI(data);
		} catch (e) {
			await availableAPIs.toMyCLI("cat: " + file + ": " + await availableAPIs.lookupLocale(e.message));
		}
	}
	await availableAPIs.toMyCLI("\r\n");
	await availableAPIs.terminate();
})();
addEventListener("signal", async function(e) {
	if (e.detail == 15) await window.availableAPIs.terminate();
}); null;