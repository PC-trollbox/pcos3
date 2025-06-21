// =====BEGIN MANIFEST=====
// signer: automaticSigner
// allow: GET_LOCALE, FS_READ, FS_BYPASS_PERMISSIONS, FS_LIST_PARTITIONS
// =====END MANIFEST=====
(async function() {
	// @pcos-app-mode isolatable
	await availableAPIs.windowVisibility(false);
	await availableAPIs.attachCLI();
	if (!(await availableAPIs.getPrivileges()).includes("GET_LOCALE")) { await availableAPIs.toMyCLI("ls: Locale permission denied\r\n");
		return await availableAPIs.terminate();	}
	if (!exec_args.length) {
		await availableAPIs.toMyCLI(await availableAPIs.lookupLocale("LS_USAGE") + "\r\n");
		await availableAPIs.toMyCLI(await availableAPIs.lookupLocale("LS_DESCRIPTION") + "\r\n");
		let sysmount = await availableAPIs.getSystemMount();
		let systemLocale = await availableAPIs.lookupLocale("MOUNTPOINT_SYSTEM");
		await availableAPIs.toMyCLI(await availableAPIs.lookupLocale("LS_MOUNTPOINT_LIST") + (await availableAPIs.fs_mounts()).map(a => sysmount == a ? (a + " [" + systemLocale + "]") : a).join(", ") + "\r\n");
		await availableAPIs.toMyCLI("ls: " + await availableAPIs.lookupLocale("NO_ARGUMENTS") + "\r\n");
		return availableAPIs.terminate();
	}
	for (let file of exec_args) {
		try {
			let data = await availableAPIs.fs_ls({ path: file });
			await availableAPIs.toMyCLI(data.map(a => JSON.stringify(a)).join("\r\n") + "\r\n");
		} catch (e) {
			await availableAPIs.toMyCLI("ls: " + file + ": " + await availableAPIs.lookupLocale(e.message) + "\r\n");
		}
	}
	await availableAPIs.terminate();
})();
addEventListener("signal", async function(e) {
	if (e.detail == 15) await window.availableAPIs.terminate();
}); null;