// =====BEGIN MANIFEST=====
// signer: automaticSigner
// allow: GET_LOCALE, FS_LIST_PARTITIONS
// =====END MANIFEST=====
(async function() {
    // @pcos-app-mode isolatable
    await availableAPIs.windowVisibility(false);
    await availableAPIs.attachCLI();
    let human = exec_args.includes("-h") || exec_args.includes("--human-readable");
    await availableAPIs.toMyCLI(await availableAPIs.lookupLocale("DF_HEADER") + "\r\n");
    let estimateStorage = await availableAPIs.estimateStorage();
    for (let medium in estimateStorage) {
        let displayedSize = estimateStorage[medium].total;
        if (human) displayedSize = await availableAPIs.ufInfoUnits([estimateStorage[medium].total, true]);
        let displayedUsed = estimateStorage[medium].used;
        if (human) displayedUsed = await availableAPIs.ufInfoUnits([estimateStorage[medium].used, true]);
        let displayedFree = estimateStorage[medium].free;
        if (human) displayedFree = await availableAPIs.ufInfoUnits([estimateStorage[medium].free, true]);
        await availableAPIs.toMyCLI(medium + "\t" + displayedSize + "\t" + displayedUsed + "\t" + displayedFree + "\t" + Math.floor(estimateStorage[medium].used / estimateStorage[medium].total * 100) + "%\r\n");
    }
    await availableAPIs.terminate();
})();
addEventListener("signal", async function(e) {
    if (e.detail == 15) await window.availableAPIs.terminate();
}); null;