// =====BEGIN MANIFEST=====
// signer: automaticSigner
// allow: GET_LOCALE, GET_NETWORK_ADDRESS
// =====END MANIFEST=====
(async function() {
	// @pcos-app-mode isolatable
	await availableAPIs.attachCLI();
	if (!(await availableAPIs.getPrivileges()).includes("GET_LOCALE")) { await availableAPIs.toMyCLI("netinfo: Locale permission denied\r\n");
		return await availableAPIs.terminate();	}
    
	try {
		await availableAPIs.toMyCLI((await availableAPIs.lookupLocale("NETWORK_ADDRESS_FIELD")).replace("%s", (await availableAPIs.getNetworkAddress())?.match(/.{1,4}/g)?.join(":") || await availableAPIs.lookupLocale("UNKNOWN_PLACEHOLDER")) + "\r\n");
	} catch (e) {
		await availableAPIs.toMyCLI("netinfo: " + await availableAPIs.lookupLocale(e.message) + "\r\n");
	}
	await availableAPIs.terminate();
})();

addEventListener("signal", async function(e) {
	if (e.detail == 15) await window.availableAPIs.terminate();
}); 