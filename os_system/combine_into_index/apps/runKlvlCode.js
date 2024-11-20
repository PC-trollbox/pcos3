// =====BEGIN MANIFEST=====
// signer: automaticSigner
// allow: GET_LOCALE, FS_READ, FS_BYPASS_PERMISSIONS, RUN_KLVL_CODE
// =====END MANIFEST=====
(async function() {
	// @pcos-app-mode isolatable
	await availableAPIs.windowVisibility(false);
	await availableAPIs.attachCLI();
	if (!exec_args.length) {
		await availableAPIs.toMyCLI(await availableAPIs.lookupLocale("RKL_USAGE") + "\r\n");
		await availableAPIs.toMyCLI(await availableAPIs.lookupLocale("RKL_DESCRIPTION") + "\r\n");
		await availableAPIs.toMyCLI("runKlvlCode: " + await availableAPIs.lookupLocale("NO_ARGUMENTS") + "\r\n");
		return availableAPIs.terminate();
	}
	try {
		await availableAPIs.toMyCLI(JSON.stringify(await availableAPIs.runKlvlCode(await availableAPIs.fs_read({ path: exec_args[0] }))) + "\r\n");
	} catch (e) {
		await availableAPIs.toMyCLI("runKlvlCode: " + file + ": " + await availableAPIs.lookupLocale(e.message));
	}
	await availableAPIs.toMyCLI("\r\n");
	await availableAPIs.terminate();
})();
addEventListener("signal", async function(e) {
	if (e.detail == 15) await window.availableAPIs.terminate();
}); null;