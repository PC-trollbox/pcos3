// =====BEGIN MANIFEST=====
// signer: automaticSigner
// allow: GET_LOCALE, FS_CHANGE_PERMISSION, FS_BYPASS_PERMISSIONS
// =====END MANIFEST=====
(async function() {
    // @pcos-app-mode isolatable
    await availableAPIs.windowVisibility(false);
    await availableAPIs.attachCLI();
    if (!exec_args.length) {
        await availableAPIs.toMyCLI(await availableAPIs.lookupLocale("CHMOD_USAGE") + "\r\n");
        await availableAPIs.toMyCLI(await availableAPIs.lookupLocale("CHMOD_DESCRIPTION") + "\r\n");
        await availableAPIs.toMyCLI("\t" + await availableAPIs.lookupLocale("CHMOD_MODE_DESCRIPTION") + "\r\n");
        await availableAPIs.toMyCLI("\t" + await availableAPIs.lookupLocale("CHMOD_MODE_CONVERT") + "\r\n");
        await availableAPIs.toMyCLI("chmod: " + await availableAPIs.lookupLocale("NO_ARGUMENTS") + "\r\n");
        return availableAPIs.terminate();
    }
    try {
        await availableAPIs.fs_chmod({ path: exec_args[1], newPermissions: exec_args[0] });
    } catch (e) {
        await availableAPIs.toMyCLI("chmod: " + exec_args[1] + ": " + await availableAPIs.lookupLocale(e.message));
    }
    await availableAPIs.toMyCLI("\r\n");
    await availableAPIs.terminate();
})();
addEventListener("signal", async function(e) {
    if (e.detail == 15) await window.availableAPIs.terminate();
}); null;