// =====BEGIN MANIFEST=====
// allow: GET_LOCALE, LLDISK_WRITE, LLDISK_READ, FS_READ, FS_WRITE, FS_BYPASS_PERMISSIONS
// signer: automaticSigner
// =====END MANIFEST=====
(async function() {
    // @pcos-app-mode isolatable
    await availableAPIs.windowVisibility(false);
    await availableAPIs.attachCLI();
    if (!exec_args.length) {
        await availableAPIs.toMyCLI("Usage: llda_tool [action] [parameters]\r\n");
        await availableAPIs.toMyCLI("action export: [input partition] [output file]\r\n");
        await availableAPIs.toMyCLI("action import: [input file] [output partition]\r\n");
        await availableAPIs.toMyCLI("action copy: [input partition] [output partition]\r\n");
        await availableAPIs.toMyCLI("When using this tool you may encounter LOSS OF DATA!\r\n");
        await availableAPIs.toMyCLI("llda_tool: " + await availableAPIs.lookupLocale("NO_ARGUMENTS") + "\r\n");
        return availableAPIs.terminate();
    }
    if (exec_args.length != 3) {
        await availableAPIs.toMyCLI("llda_tool: " + await availableAPIs.lookupLocale("ARGUMENT_COUNT_MISMATCH") + "\r\n");
        return await availableAPIs.terminate();
    }

    if (exec_args[0] == "export") {
        await availableAPIs.fs_write({
            path: exec_args[2],
            data: await availableAPIs.lldaRead({ partition: exec_args[1] })
        });
    } else if (exec_args[0] == "import") {
        await availableAPIs.lldaWrite({ partition: exec_args[2], data: await availableAPIs.fs_read({ path: exec_args[1] }) });
    } else if (exec_args[0] == "copy") {
        await availableAPIs.lldaWrite({ partition: exec_args[1], data: await availableAPIs.lldaRead({ partition: exec_args[2] }) });
    } else {
        await availableAPIs.toMyCLI("llda_tool: Unknown action\r\n");
    }
    
    await availableAPIs.terminate();
})();
addEventListener("signal", async function(e) {
    if (e.detail == 15) await window.availableAPIs.terminate();
}); null;