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

	if (pargs.help) {
		await availableAPIs.toMyCLI(await availableAPIs.lookupLocale("POWER_USAGE") + "\r\n");
		await availableAPIs.toMyCLI(await availableAPIs.lookupLocale("POWER_DESCRIPTION") + "\r\n");
		await availableAPIs.toMyCLI("\t" + await availableAPIs.lookupLocale("POWER_FORCE") + "\r\n");
		await availableAPIs.toMyCLI("\t" + await availableAPIs.lookupLocale("POWER_KEXEC") + "\r\n");
		await availableAPIs.terminate();
	}
	try {
		await availableAPIs.shutdown({
			isReboot: ppos[0] == "reboot" || ppos[0] == "r" || ppos[0] == "restart" || ppos[0] == "kexec" || ppos[0] == "k" || pargs.kexec || pargs.k,
			isKexec: pargs.kexec || pargs.k || ppos[0] == "kexec" || ppos[0] == "k",
			force: pargs.force || pargs.f
		});
	} catch (e) {
		await availableAPIs.toMyCLI("power: " + await availableAPIs.lookupLocale(e.message) + "\r\n");
	}
	await availableAPIs.terminate();
})();

addEventListener("signal", async function(e) {
	if (e.detail == 15) await window.availableAPIs.terminate();
}); null;