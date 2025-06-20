// =====BEGIN MANIFEST=====
// signer: automaticSigner
// allow: GET_LOCALE, FS_READ, FS_BYPASS_PERMISSIONS, FS_CHANGE_PERMISSION, FS_REMOVE
// =====END MANIFEST=====
(async function() {
	// @pcos-app-mode isolatable
	await availableAPIs.windowVisibility(false);
	await availableAPIs.attachCLI();
	if (!(await availableAPIs.getPrivileges()).includes("GET_LOCALE")) { await availableAPIs.toMyCLI("rm: Locale permission denied\r\n");
		return await availableAPIs.terminate();	}
	if (!exec_args.length) {
		await availableAPIs.toMyCLI(await availableAPIs.lookupLocale("RM_USAGE") + "\r\n");
		await availableAPIs.toMyCLI(await availableAPIs.lookupLocale("RM_DESCRIPTION") + "\r\n");
		await availableAPIs.toMyCLI("\t" + await availableAPIs.lookupLocale("OPT_RECURSIVE_DESCRIPTION") + "\r\n");
		await availableAPIs.toMyCLI("\t" + await availableAPIs.lookupLocale("OPT_FORCE_DESCRIPTION") + "\r\n");
		await availableAPIs.toMyCLI("rm: " + await availableAPIs.lookupLocale("NO_ARGUMENTS") + "\r\n");
		return availableAPIs.terminate();
	}
	let recursive = exec_args.includes("--recursive");
	let force = exec_args.includes("--force");
	if (recursive) exec_args.splice(exec_args.indexOf("--recursive"), 1);
	if (force) exec_args.splice(exec_args.indexOf("--force"), 1);
	if (exec_args.length != 1) {
		await availableAPIs.toMyCLI("rm: " + await availableAPIs.lookupLocale("ARGUMENT_COUNT_MISMATCH") + "\r\n");
		return await availableAPIs.terminate();
	}
	if (recursive) await recursiveRemove(exec_args[0], force);
	else {
		try {
			await availableAPIs.fs_rm({ path: exec_args[0] });
		} catch (e) {
			await availableAPIs.toMyCLI("rm: " + exec_args[0] + ": " + await availableAPIs.lookupLocale(e.message) + "\r\n");
		}
	}
	await availableAPIs.terminate();
})();

async function recursiveRemove(target, force) {
	try {
		for (let targetFile of await availableAPIs.fs_ls({ path: target })) {
			targetFile = target + "/" + targetFile;
			try {
				if (await availableAPIs.fs_isDirectory({ path: targetFile })) await recursiveRemove(targetFile, force);
				else await availableAPIs.fs_rm({ path: targetFile });
			} catch (e) {
				await availableAPIs.toMyCLI("rm: " + targetFile + ": " + await availableAPIs.lookupLocale(e.message) + "\r\n");
				if (!force) return await availableAPIs.terminate();
			}
		}
		await availableAPIs.fs_rm({ path: target });
	} catch (e) {
		await availableAPIs.toMyCLI("rm: " + target + ": " + await availableAPIs.lookupLocale(e.message) + "\r\n");
		if (!force) return await availableAPIs.terminate();
	}
}

addEventListener("signal", async function(e) {
	if (e.detail == 15) await window.availableAPIs.terminate();
}); null;