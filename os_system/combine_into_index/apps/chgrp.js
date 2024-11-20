// =====BEGIN MANIFEST=====
// signer: automaticSigner
// allow: GET_LOCALE, FS_CHANGE_PERMISSION, FS_BYPASS_PERMISSIONS
// =====END MANIFEST=====
(async function() {
	// @pcos-app-mode isolatable
	await availableAPIs.windowVisibility(false);
	await availableAPIs.attachCLI();
	if (!exec_args.length) {
		await availableAPIs.toMyCLI(await availableAPIs.lookupLocale("CHGRP_USAGE") + "\r\n");
		await availableAPIs.toMyCLI(await availableAPIs.lookupLocale("CHGRP_DESCRIPTION") + "\r\n");
		await availableAPIs.toMyCLI("chgrp: " + await availableAPIs.lookupLocale("NO_ARGUMENTS") + "\r\n");
		return availableAPIs.terminate();
	}
	try {
		await availableAPIs.fs_chgrp({ path: exec_args[1], newGrp: exec_args[0] });
	} catch (e) {
		await availableAPIs.toMyCLI("chgrp: " + exec_args[1] + ": " + await availableAPIs.lookupLocale(e.message)) + "\r\n";
	}
	await availableAPIs.terminate();
})();
addEventListener("signal", async function(e) {
	if (e.detail == 15) await window.availableAPIs.terminate();
}); null;