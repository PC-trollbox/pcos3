// =====BEGIN MANIFEST=====
// signer: automaticSigner
// allow: GET_LOCALE, SYSTEM_SHUTDOWN
// =====END MANIFEST=====
(async function() {
    // @pcos-app-mode isolatable
    await availableAPIs.windowVisibility(false);
    await availableAPIs.attachCLI();
    await availableAPIs.shutdown({
        isReboot: exec_args.includes("r") || exec_args.includes("reboot") || exec_args.includes("restart"),
    });
    await availableAPIs.terminate();
})();

async function onTermData(listener) {
    while (true) {
        listener(await availableAPIs.fromMyCLI());
    }
}
addEventListener("signal", async function(e) {
    if (e.detail == 15) await window.availableAPIs.terminate();
}); null;