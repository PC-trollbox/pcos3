// =====BEGIN MANIFEST=====
// signer: automaticSigner
// allow: FETCH_SEND, SET_FIRMWARE, SYSTEM_SHUTDOWN, GET_LOCALE, FS_READ, FS_BYPASS_PERMISSIONS
// =====END MANIFEST=====
(async function() {
	// @pcos-app-mode isolatable
	await availableAPIs.windowVisibility(false);
	await availableAPIs.attachCLI();
	if (!(await availableAPIs.getPrivileges()).includes("GET_LOCALE")) { await availableAPIs.toMyCLI("updatefw: Locale permission denied\r\n");
		return await availableAPIs.terminate();	}
	await availableAPIs.toMyCLI(await availableAPIs.lookupLocale("UPDATEFW_DOWNLOADING") + "\r\n");
	let fwArchive;
	if (!exec_args.length) {
		try {
			fwArchive = await availableAPIs.fetchSend({
				url: "/init.js",
				init: {}
			});
		} catch (e) {
			console.error(e);
			await availableAPIs.toMyCLI(await availableAPIs.lookupLocale("UPDATEFW_DOWNLOAD_FAILED") + "\r\n");
			return await availableAPIs.terminate();
		}
	} else {
		try {
			fwArchive = { arrayBuffer: new TextEncoder().encode(await availableAPIs.fs_read({
				path: exec_args[0]
			})) };
		} catch (e) {
			console.error(e);
			await availableAPIs.toMyCLI(await availableAPIs.lookupLocale("UPDATEFW_DOWNLOAD_FAILED") + "\r\n");
			return await availableAPIs.terminate();
		}
	}
	await availableAPIs.toMyCLI(await availableAPIs.lookupLocale("UPDATEFW_DECODING") + "\r\n");
	fwArchive = fwArchive.arrayBuffer;
	fwArchive = new TextDecoder().decode(fwArchive);
	try {
		await availableAPIs.toMyCLI(await availableAPIs.lookupLocale("UPDATEFW_SETTING") + "\r\n");
		await availableAPIs.setFirmware(fwArchive);
		await availableAPIs.toMyCLI(await availableAPIs.lookupLocale("RESTARTING") + "\r\n");
		await availableAPIs.shutdown({
			isReboot: true
		});
	} catch (e) {
		await availableAPIs.toMyCLI("updatefw: " + await availableAPIs.lookupLocale(e.message) + "\r\n");
	}
	await availableAPIs.terminate();
})();

addEventListener("signal", async function(e) {
	if (e.detail == 15) await window.availableAPIs.terminate();
}); null;