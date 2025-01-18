// =====BEGIN MANIFEST=====
// signer: automaticSigner
// allow: GET_LOCALE, GET_BATTERY_STATUS
// =====END MANIFEST=====
(async function() {
	// @pcos-app-mode isolatable
	await availableAPIs.attachCLI();
	if (!(await availableAPIs.getPrivileges()).includes("GET_LOCALE")) { await availableAPIs.toMyCLI("batteryinfo: Locale permission denied\r\n");
		return await availableAPIs.terminate();	}
    
	try {
		let batteryStatus = await availableAPIs.batteryStatus();
		if (exec_args[0] == "--robot") await availableAPIs.toMyCLI(JSON.stringify(batteryStatus, null, "\t").replaceAll("\n", "\r\n") + "\r\n");
		else await availableAPIs.toMyCLI((await availableAPIs.lookupLocale("BATTERY_STATUS_" + (batteryStatus.charging ? "CHARGING" : "DISCHARGING")))
			.replace("%s", (batteryStatus.level * 100).toFixed(2))
			.replace("%s", await availableAPIs.ufTimeInc([
				(batteryStatus.charging ? batteryStatus.chargingTime : batteryStatus.dischargingTime) * 1000
			])));
	} catch (e) {
		await availableAPIs.toMyCLI("batteryinfo: " + await availableAPIs.lookupLocale(e.message) + "\r\n");
	}
	await availableAPIs.terminate();
})();


addEventListener("signal", async function(e) {
	if (e.detail == 15) await window.availableAPIs.terminate();
}); 