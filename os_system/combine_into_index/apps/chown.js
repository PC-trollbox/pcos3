// =====BEGIN MANIFEST=====
// signer: automaticSigner
// allow: GET_LOCALE, FS_CHANGE_PERMISSION, FS_BYPASS_PERMISSIONS
// =====END MANIFEST=====
(async function() {
	// @pcos-app-mode isolatable
	await availableAPIs.windowVisibility(false);
	await availableAPIs.attachCLI();
	if (!(await availableAPIs.getPrivileges()).includes("GET_LOCALE")) { await availableAPIs.toMyCLI("chown: Locale permission denied\r\n");
		return await availableAPIs.terminate();	}
	if (!exec_args.length) {
		await availableAPIs.toMyCLI(await availableAPIs.lookupLocale("CHOWN_USAGE") + "\r\n");
		await availableAPIs.toMyCLI(await availableAPIs.lookupLocale("CHOWN_DESCRIPTION") + "\r\n");
		await availableAPIs.toMyCLI("chown: " + await availableAPIs.lookupLocale("NO_ARGUMENTS") + "\r\n");
		return availableAPIs.terminate();
	}
	try {
		await availableAPIs.fs_chown({ path: exec_args[1], newUser: exec_args[0] });
	} catch (e) {
		await availableAPIs.toMyCLI("chown: " + exec_args[1] + ": " + await availableAPIs.lookupLocale(e.message) + "\r\n");
	}
	await availableAPIs.terminate();
})();
addEventListener("signal", async function(e) {
	if (e.detail == 15) await window.availableAPIs.terminate();
}); null;