// =====BEGIN MANIFEST=====
// signer: automaticSigner
// allow: GET_LOCALE, SET_DEFAULT_SYSTEM
// =====END MANIFEST=====
(async function() {
    // @pcos-app-mode isolatable
    await availableAPIs.windowVisibility(false);
    await availableAPIs.attachCLI();
    if (!exec_args.length) {
        await availableAPIs.toMyCLI(await availableAPIs.lookupLocale("PIVOT_ROOT_USAGE") + "\r\n");
        await availableAPIs.toMyCLI(await availableAPIs.lookupLocale("PIVOT_ROOT_DESCRIPTION") + "\r\n");
        await availableAPIs.toMyCLI("pivot_root: " + await availableAPIs.lookupLocale("NO_ARGUMENTS") + "\r\n");
        return availableAPIs.terminate();
    }
    await availableAPIs.setSystemMount(exec_args[0]);
    await availableAPIs.terminate();
})();

addEventListener("signal", async function(e) {
    if (e.detail == 15) await window.availableAPIs.terminate();
}); null;