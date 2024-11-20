// =====BEGIN MANIFEST=====
// signer: automaticSigner
// allow: GET_LOCALE, FS_LIST_PARTITIONS, GET_FILESYSTEMS
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
		await availableAPIs.toMyCLI(await availableAPIs.lookupLocale("MOUNTINFO_USAGE") + "\r\n");
		await availableAPIs.toMyCLI(await availableAPIs.lookupLocale("MOUNTINFO_DESCRIPTION") + "\r\n");
		await availableAPIs.toMyCLI("mountinfo: " + await availableAPIs.lookupLocale("NO_ARGUMENTS") + "\r\n");
		return availableAPIs.terminate();
	}

	try {
		await availableAPIs.toMyCLI(JSON.stringify(await availableAPIs.fs_mountInfo(ppos[0]), null, "\t").replaceAll("\n", "\r\n") + "\r\n");
	} catch (e) {
		await availableAPIs.toMyCLI("mountinfo: " + await availableAPIs.lookupLocale(e.message) + "\r\n");
	}
	await availableAPIs.terminate();
})();

addEventListener("signal", async function(e) {
	if (e.detail == 15) await window.availableAPIs.terminate();
}); 