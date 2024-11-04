// =====BEGIN MANIFEST=====
// signer: automaticSigner
// fnName: networkdInstaller
// allow: FS_WRITE
// =====END MANIFEST=====
(async function() {
    // @pcos-app-mode isolatable
    await availableAPIs.windowTitleSet("PCOS Network");
    await availableAPIs.attachCLI();
    await availableAPIs.toMyCLI("This program has become obsolete. Network management has joined the kernel side.\r\n");
    setTimeout(async function() {
        await availableAPIs.fs_write({
            path: "ram/run/network.log",
            data: "CloseReason;ObsoleteApp"
        });
        await availableAPIs.terminate();
    }, 1000);
})();
addEventListener("signal", async function(e) {
    if (e.detail == 15) await availableAPIs.terminate();
});