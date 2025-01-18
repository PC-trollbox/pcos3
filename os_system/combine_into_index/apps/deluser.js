// =====BEGIN MANIFEST=====
// signer: automaticSigner
// allow: GET_LOCALE, SET_SECURITY_CHECKS, CSP_OPERATIONS, SET_USER_INFO, FS_LIST_PARTITIONS, FS_READ, FS_BYPASS_PERMISSIONS, FS_REMOVE, GET_USER_INFO, USER_INFO_OTHERS
// =====END MANIFEST=====
(async function() {
	// @pcos-app-mode isolatable
	await availableAPIs.windowVisibility(false);
	await availableAPIs.attachCLI();
	if (!(await availableAPIs.getPrivileges()).includes("GET_LOCALE")) { await availableAPIs.toMyCLI("deluser: Locale permission denied\r\n");
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
	if (ppos.length < 1) {
		await availableAPIs.toMyCLI(await availableAPIs.lookupLocale("DELUSER_USAGE") + "\r\n");
		await availableAPIs.toMyCLI(await availableAPIs.lookupLocale("DELUSER_DESCRIPTION") + "\r\n");
		await availableAPIs.toMyCLI("\t" + await availableAPIs.lookupLocale("DELUSER_HOMEDIR") + "\r\n");
		await availableAPIs.toMyCLI("deluser: " + await availableAPIs.lookupLocale("NO_ARGUMENTS") + "\r\n");
		return availableAPIs.terminate();
	}
	await availableAPIs.toMyCLI((await availableAPIs.lookupLocale("OLD_USER_DELETION")).replace("%s", ppos[0]) + "\r\n");
	try {
		let userInfo = await availableAPIs.getUserInfo({ desiredUser: ppos[0] });
		if (!userInfo) throw new Error("ACCESS_FN_FAIL");
		await availableAPIs.setUserInfo({
			desiredUser: ppos[0],
			info: undefined
		})
		if (pargs.homedir) await recursiveRemove(userInfo.homeDirectory);
	} catch (e) {
		await availableAPIs.toMyCLI("deluser: " + await availableAPIs.lookupLocale(e.message) + "\r\n");
	}
	return await availableAPIs.terminate();
})();

async function recursiveRemove(path) {
	let dirList = await availableAPIs.fs_ls({ path });
	for (let fileIndex in dirList) {
		let file = dirList[fileIndex];
		if (await availableAPIs.fs_isDirectory({ path: path + "/" + file })) await recursiveRemove(path + "/" + file);
		else await availableAPIs.fs_rm({ path: path + "/" + file });
	}
	await availableAPIs.fs_rm({ path });
}
addEventListener("signal", async function(e) {
	if (e.detail == 15) await window.availableAPIs.terminate();
}); null;