// =====BEGIN MANIFEST=====
// signer: automaticSigner
// allow: GET_LOCALE, FS_MOUNT, GET_FILESYSTEMS
// =====END MANIFEST=====
(async function() {
    // @pcos-app-mode isolatable
    await availableAPIs.attachCLI();

    let pargs = {};
    let ppos = [];
    for (let arg of exec_args) {
        if (arg.startsWith("--")) {
            let key = arg.split("=")[0].slice(2);
            let value = arg.split("=").slice(1).join("=");
            if (arg.split("=")[1] == null) value = true;
            if (pargs.hasOwnProperty(key)) {
                let ogValues = pargs[key];
                if (ogValues instanceof Array) pargs[key] = [ ...ogValues, value ];
                else pargs[key] = [ ogValues, value ];
            } else pargs[key] = value;
        } else ppos.push(arg);
    }

    if (ppos.length < 2) {
        await availableAPIs.toMyCLI(await availableAPIs.lookupLocale("MOUNT_USAGE") + "\r\n");
        await availableAPIs.toMyCLI(await availableAPIs.lookupLocale("MOUNT_DESCRIPTION") + "\r\n");
        await availableAPIs.toMyCLI((await availableAPIs.lookupLocale("MOUNT_KNOWN_FS")).replace("%s", (await availableAPIs.supportedFilesystems()).join(", ")) + "\r\n");
        await availableAPIs.toMyCLI("\t" + await availableAPIs.lookupLocale("MOUNT_KNOWN_PPART") + "\r\n");
        await availableAPIs.toMyCLI("\t" + await availableAPIs.lookupLocale("MOUNT_KNOWN_PINPA") + "\r\n");
        await availableAPIs.toMyCLI("\t" + await availableAPIs.lookupLocale("MOUNT_KNOWN_PPASS") + "\r\n");
        await availableAPIs.toMyCLI("\t" + await availableAPIs.lookupLocale("MOUNT_KNOWN_PKEY") + "\r\n");
        await availableAPIs.toMyCLI("\t" + await availableAPIs.lookupLocale("MOUNT_KNOWN_PTYPE") + "\r\n");
        await availableAPIs.toMyCLI("\t" + await availableAPIs.lookupLocale("MOUNT_KNOWN_PURL") + "\r\n");
        await availableAPIs.toMyCLI("\t" + await availableAPIs.lookupLocale("MOUNT_KNOWN_PINPI") + "\r\n");
        await availableAPIs.toMyCLI("\t" + await availableAPIs.lookupLocale("MOUNT_KNOWN_POUPI") + "\r\n");
        await availableAPIs.toMyCLI("mount: " + await availableAPIs.lookupLocale("NO_ARGUMENTS") + "\r\n");
        return availableAPIs.terminate();
    }

    try {
        await availableAPIs.fs_mount({
            mountpoint: ppos[1],
            filesystem: ppos[0],
            filesystemOptions: pargs
        });
    } catch (e) {
        await availableAPIs.toMyCLI("mount: " + await availableAPIs.lookupLocale(e.message) + "\r\n");
    }
    await availableAPIs.terminate();
})();

addEventListener("signal", async function(e) {
    if (e.detail == 15) await window.availableAPIs.terminate();
}); 