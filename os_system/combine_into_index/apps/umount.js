// =====BEGIN MANIFEST=====
// signer: automaticSigner
// allow: GET_LOCALE, FS_UNMOUNT, GET_FILESYSTEMS
// =====END MANIFEST=====
(async function() {
	// @pcos-app-mode isolatable
	await availableAPIs.attachCLI();

	let pargs = {};
	let ppos = [];
	for (let arg of exec_args) {
		if (arg.startsWith("--")) {
			let key = arg.split("=")[0].slice(2);
			let value = arg.split("=").slice(1).join("=");
			if (arg.split("=")[1] == null) value = true;
			if (pargs.hasOwnProperty(key)) {
				let ogValues = pargs[key];
				if (ogValues instanceof Array) pargs[key] = [ ...ogValues, value ];
				else pargs[key] = [ ogValues, value ];
			} else pargs[key] = value;
		} else ppos.push(arg);
	}

	if (ppos.length < 1) {
		await availableAPIs.toMyCLI(await availableAPIs.lookupLocale("UMOUNT_USAGE") + "\r\n");
		await availableAPIs.toMyCLI(await availableAPIs.lookupLocale("UMOUNT_DESCRIPTION") + "\r\n");
		await availableAPIs.toMyCLI("\t" + await availableAPIs.lookupLocale("UMOUNT_OPT_SYNCONLY") + "\r\n");
		await availableAPIs.toMyCLI("\t" + await availableAPIs.lookupLocale("UMOUNT_OPT_FORCE") + "\r\n");
		await availableAPIs.toMyCLI("umount: " + await availableAPIs.lookupLocale("NO_ARGUMENTS") + "\r\n");
		return availableAPIs.terminate();
	}

	try {
		await availableAPIs["fs_" + (pargs["sync-only"] == true ? "sync" : "unmount")]({
			mount: ppos[0],
			force: pargs.force
		});
	} catch (e) {
		await availableAPIs.toMyCLI("umount: " + await availableAPIs.lookupLocale(e.message) + "\r\n");
	}
	await availableAPIs.terminate();
})();

addEventListener("signal", async function(e) {
	if (e.detail == 15) await window.availableAPIs.terminate();
}); 