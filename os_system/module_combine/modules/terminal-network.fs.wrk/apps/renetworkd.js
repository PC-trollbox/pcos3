// =====BEGIN MANIFEST=====
// signer: automaticSigner
// allow: GET_LOCALE, RELOAD_NETWORK_CONFIG
// =====END MANIFEST=====
(async function() {
	// @pcos-app-mode isolatable
	await availableAPIs.windowVisibility(false);
	await availableAPIs.attachCLI();
	if (!(await availableAPIs.getPrivileges()).includes("GET_LOCALE")) { await availableAPIs.toMyCLI("renetworkd: Locale permission denied\r\n");
		return await availableAPIs.terminate();	}
	try {
		await availableAPIs.reloadNetworkConfig();
	} catch (e) {
		await availableAPIs.toMyCLI("renetworkd: " + await availableAPIs.lookupLocale(e.message) + "\r\n");
	}
	await availableAPIs.terminate();
})();
addEventListener("signal", async function(e) {
	if (e.detail == 15) await window.availableAPIs.terminate();
}); null;