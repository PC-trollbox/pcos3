// =====BEGIN MANIFEST=====
// signer: automaticSigner
// allow: GET_LOCALE, SYSTEM_SHUTDOWN
// =====END MANIFEST=====
(async function() {
	// @pcos-app-mode isolatable
	await availableAPIs.windowVisibility(false);
	if (!(await availableAPIs.getPrivileges()).includes("GET_LOCALE")) { await availableAPIs.toMyCLI("power: Locale permission denied\r\n");
		return await availableAPIs.terminate();	}
	await availableAPIs.attachCLI();
	try {
		await availableAPIs.shutdown({
			isReboot: exec_args.includes("r") || exec_args.includes("reboot") || exec_args.includes("restart"),
		});
	} catch (e) {
		await availableAPIs.toMyCLI("power: " + await availableAPIs.lookupLocale(e.message) + "\r\n");
	}
	await availableAPIs.terminate();
})();

addEventListener("signal", async function(e) {
	if (e.detail == 15) await window.availableAPIs.terminate();
}); null;