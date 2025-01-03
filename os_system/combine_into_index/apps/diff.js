// =====BEGIN MANIFEST=====
// signer: automaticSigner
// allow: GET_LOCALE, FS_READ, FS_WRITE, FS_BYPASS_PERMISSIONS, PATCH_DIFF
// =====END MANIFEST=====
(async function() {
	// @pcos-app-mode isolatable
	await availableAPIs.windowVisibility(false);
	await availableAPIs.attachCLI();
	if (!(await availableAPIs.getPrivileges()).includes("GET_LOCALE")) { await availableAPIs.toMyCLI("diff: Locale permission denied\r\n");
		return await availableAPIs.terminate();	}
	if (!exec_args.length) {
		await availableAPIs.toMyCLI(await availableAPIs.lookupLocale("DIFF_USAGE") + "\r\n");
		await availableAPIs.toMyCLI(await availableAPIs.lookupLocale("DIFF_DESCRIPTION") + "\r\n");
		await availableAPIs.toMyCLI("diff: " + await availableAPIs.lookupLocale("NO_ARGUMENTS") + "\r\n");
		return availableAPIs.terminate();
	}
	if (exec_args.length != 3) {
		await availableAPIs.toMyCLI("diff: " + await availableAPIs.lookupLocale("ARGUMENT_COUNT_MISMATCH") + "\r\n");
		return await availableAPIs.terminate();
	}
	try {
		await availableAPIs.fs_write({
			path: exec_args[2],
			data: JSON.stringify(await availableAPIs.patchDiff({
				operation: "calcPatch",
				args: [ await availableAPIs.fs_read({ path: exec_args[0] }), await availableAPIs.fs_read({ path: exec_args[1] }) ]
			}))
		})
	} catch (e) {
		await availableAPIs.toMyCLI("diff: " + await availableAPIs.lookupLocale(e.message) + "\r\n");
	}
	await availableAPIs.terminate();
})();

addEventListener("signal", async function(e) {
	if (e.detail == 15) await window.availableAPIs.terminate();
}); null;