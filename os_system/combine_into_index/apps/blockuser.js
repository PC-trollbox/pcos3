// =====BEGIN MANIFEST=====
// signer: automaticSigner
// allow: GET_LOCALE, SET_SECURITY_CHECKS, SWITCH_USERS_AUTOMATICALLY
// =====END MANIFEST=====
(async function() {
	// @pcos-app-mode isolatable
	await availableAPIs.windowVisibility(false);
	await availableAPIs.attachCLI();
	if (!(await availableAPIs.getPrivileges()).includes("GET_LOCALE")) { await availableAPIs.toMyCLI("blockuser: Locale permission denied\r\n");
		return await availableAPIs.terminate();	}
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
		await availableAPIs.toMyCLI(await availableAPIs.lookupLocale("BLOCKUSER_USAGE") + "\r\n");
		await availableAPIs.toMyCLI(await availableAPIs.lookupLocale("BLOCKUSER_DESCRIPTION") + "\r\n");
		await availableAPIs.terminate();
	}
	try {
		if (ppos[0]) await availableAPIs.switchUser(ppos[0]);
		await availableAPIs.setOwnSecurityChecks({ checks: [] });
	} catch (e) {
		await availableAPIs.toMyCLI("blockuser: " + await availableAPIs.lookupLocale(e.message) + "\r\n");
	}
	await availableAPIs.terminate();
})();

addEventListener("signal", async function(e) {
	if (e.detail == 15) await window.availableAPIs.terminate();
}); null;