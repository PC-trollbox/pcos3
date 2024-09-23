// =====BEGIN MANIFEST=====
// signer: automaticSigner
// allow: GET_LOCALE, FS_READ, FS_WRITE, FETCH_SEND, FS_BYPASS_PERMISSIONS, FS_CHANGE_PERMISSION
// =====END MANIFEST=====
(async function() {
    // @pcos-app-mode isolatable
    await availableAPIs.windowVisibility(false);
    await availableAPIs.attachCLI();
    if (!exec_args.length) {
        await availableAPIs.toMyCLI(await availableAPIs.lookupLocale("BASIC_CURL_USAGE") + "\r\n");
        await availableAPIs.toMyCLI(await availableAPIs.lookupLocale("BASIC_CURL_DESCRIPTION") + "\r\n");
        await availableAPIs.toMyCLI("basiccurl: " + await availableAPIs.lookupLocale("NO_ARGUMENTS") + "\r\n");
        return availableAPIs.terminate();
    }
    try {
        let downloadedFile = await availableAPIs.fetchSend({
            url: exec_args[0],
            init: {}
        });
        downloadedFile = downloadedFile.arrayBuffer;
        downloadedFile = new TextDecoder().decode(downloadedFile);
        await availableAPIs.fs_write({ path: exec_args[1], data: downloadedFile });
    } catch (e) {
        await availableAPIs.toMyCLI("basiccurl: " + await availableAPIs.lookupLocale(e.message) + "\r\n");
        return await availableAPIs.terminate();
    }
})();

addEventListener("signal", async function(e) {
    if (e.detail == 15) await window.availableAPIs.terminate();
}); null;