// =====BEGIN MANIFEST=====
// signer: automaticSigner
// allow: GET_LOCALE
// =====END MANIFEST=====
(async function() {
    // @pcos-app-mode isolatable
    await availableAPIs.windowVisibility(false);
    await availableAPIs.attachCLI();
    await availableAPIs.toMyCLI(new Date().toString() + "\r\n");
    await availableAPIs.terminate();
})();
addEventListener("signal", async function(e) {
    if (e.detail == 15) await window.availableAPIs.terminate();
}); null;