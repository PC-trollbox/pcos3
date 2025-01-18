// =====BEGIN MANIFEST=====
// signer: automaticSigner
// allow: GET_LOCALE, GET_USER_LIST
// =====END MANIFEST=====
(async function() {
	// @pcos-app-mode isolatable
	await availableAPIs.windowVisibility(false);
	await availableAPIs.attachCLI();
	if (!(await availableAPIs.getPrivileges()).includes("GET_LOCALE")) { await availableAPIs.toMyCLI("lsuser: Locale permission denied\r\n");
		return await availableAPIs.terminate();	}
	try {
		for (let user of await availableAPIs.getUsers()) await availableAPIs.toMyCLI(JSON.stringify(user) + "\r\n");
	} catch (e) {
		await availableAPIs.toMyCLI("lsuser: " + await availableAPIs.lookupLocale(e.message) + "\r\n");
	}
	return await availableAPIs.terminate();
})();

async function onTermData(listener) {
	while (true) {
		listener(await availableAPIs.fromMyCLI());
	}
}
addEventListener("signal", async function(e) {
	if (e.detail == 15) await window.availableAPIs.terminate();
}); null;