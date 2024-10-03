// =====BEGIN MANIFEST=====
// allow: GET_LOCALE, LLDISK_LIST_PARTITIONS, LLDISK_INIT_PARTITIONS
// signer: automaticSigner
// =====END MANIFEST=====
(async function() {
    // @pcos-app-mode isolatable
    await availableAPIs.windowVisibility(false);
    await availableAPIs.attachCLI();
    if (!exec_args.length) {
        await availableAPIs.toMyCLI(await availableAPIs.lookupLocale("INITDISK_USAGE") + "\r\n");
        await availableAPIs.toMyCLI(await availableAPIs.lookupLocale("INITDISK_DESCRIPTION") + "\r\n");
        await availableAPIs.toMyCLI("initdisk: " + await availableAPIs.lookupLocale("NO_ARGUMENTS") + "\r\n");
        return availableAPIs.terminate();
    }
    if (exec_args.length > 2) {
        await availableAPIs.toMyCLI("initdisk: " + await availableAPIs.lookupLocale("ARGUMENT_COUNT_MISMATCH") + "\r\n");
        return await availableAPIs.terminate();
    }
    
    try {
        await availableAPIs.lldaList();
        if (exec_args[1] != "overwrite") {
            await availableAPIs.toMyCLI("initdisk: " + await availableAPIs.lookupLocale("INITDISK_OVERWRITE_WARN") + "\r\n");
            return await availableAPIs.terminate();
        }
    } catch {}
    
    await availableAPIs.lldaInitPartitions();
    await availableAPIs.terminate();
})();
addEventListener("signal", async function(e) {
    if (e.detail == 15) await window.availableAPIs.terminate();
}); null;