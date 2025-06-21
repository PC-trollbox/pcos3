// =====BEGIN MANIFEST=====
// signer: automaticSigner
// allow: GET_LOCALE, SYSTEM_UPTIME
// =====END MANIFEST=====
(async function() {
	// @pcos-app-mode isolatable
	await availableAPIs.windowVisibility(false);
	await availableAPIs.attachCLI();
	if (!(await availableAPIs.getPrivileges()).includes("GET_LOCALE")) { await availableAPIs.toMyCLI("uptime: Locale permission denied\r\n");
		return await availableAPIs.terminate();	}
	try {
		await availableAPIs.toMyCLI(await availableAPIs.ufTimeInc([ await availableAPIs.systemUptime() ]) + "\r\n");
	} catch (e) {
		await availableAPIs.toMyCLI("uptime: " + await availableAPIs.lookupLocale(e.message) + "\r\n");
	}
	await availableAPIs.terminate();
})();
addEventListener("signal", async function(e) {
	if (e.detail == 15) await window.availableAPIs.terminate();
}); null;