// =====BEGIN MANIFEST=====
// signer: automaticSigner
// allow: GET_LOCALE, FS_READ, FS_WRITE, FS_BYPASS_PERMISSIONS, FS_CHANGE_PERMISSION
// =====END MANIFEST=====
(async function() {
    // @pcos-app-mode isolatable
    await availableAPIs.windowVisibility(false);
    await availableAPIs.attachCLI();
    if (!exec_args.length) {
        await availableAPIs.toMyCLI(await availableAPIs.lookupLocale("CP_USAGE") + "\r\n");
        await availableAPIs.toMyCLI(await availableAPIs.lookupLocale("CP_DESCRIPTION") + "\r\n");
        await availableAPIs.toMyCLI("\t" + await availableAPIs.lookupLocale("OPT_RECURSIVE_DESCRIPTION") + "\r\n");
        await availableAPIs.toMyCLI("\t" + await availableAPIs.lookupLocale("OPT_FORCE_DESCRIPTION") + "\r\n");
        await availableAPIs.toMyCLI("cp: " + await availableAPIs.lookupLocale("NO_ARGUMENTS") + "\r\n");
        return availableAPIs.terminate();
    }
    let recursive = exec_args.includes("--recursive");
    let force = exec_args.includes("--force");
    if (recursive) exec_args.splice(exec_args.indexOf("--recursive"), 1);
    if (force) exec_args.splice(exec_args.indexOf("--force"), 1);
    if (exec_args.length != 2) {
        await availableAPIs.toMyCLI("cp: " + await availableAPIs.lookupLocale("ARGUMENT_COUNT_MISMATCH") + "\r\n");
        return await availableAPIs.terminate();
    }
    if (recursive) await recursiveRemove(exec_args[0], exec_args[1], force);
    else {
        try {
            await availableAPIs.fs_write({
                path: exec_args[1],
                data: await availableAPIs.fs_read({ path: exec_args[0] })
            });
        } catch (e) {
            await availableAPIs.toMyCLI("cp: " + exec_args[0] + " -> " + exec_args[1] + ": " + await availableAPIs.lookupLocale(e.message) + "\r\n");
        }
    }
    await availableAPIs.toMyCLI("\r\n");
    await availableAPIs.terminate();
})();

async function recursiveRemove(source, destination, force) {
    try {
        for (let sourceFile of await availableAPIs.fs_ls({ path: source })) {
            let destinationFile = destination + "/" + sourceFile;
            if (await availableAPIs.fs_isDirectory({ path: source + "/" + sourceFile })) {
                let originalPermissions = await availableAPIs.fs_permissions({ path: source + "/" + sourceFile });
                await availableAPIs.fs_mkdir({ path: destinationFile });
                await availableAPIs.fs_chmod({ path: destinationFile, newPermissions: originalPermissions.world });
                await availableAPIs.fs_chgrp({ path: destinationFile, newGrp: originalPermissions.group });
                await availableAPIs.fs_chown({ path: destinationFile, newUser: originalPermissions.user });
                await recursiveRemove(source + "/" + sourceFile, destinationFile, force);
            } else {
                await availableAPIs.fs_write({
                    path: destinationFile,
                    data: await availableAPIs.fs_read({ path: source + "/" + sourceFile })
                });
            }
        }
    } catch (e) {
        await availableAPIs.toMyCLI("cp: " + source + " -> " + destination + ": " + await availableAPIs.lookupLocale(e.message) + "\r\n");
        if (!force) return await availableAPIs.terminate();
    }
}

addEventListener("signal", async function(e) {
    if (e.detail == 15) await window.availableAPIs.terminate();
}); null;