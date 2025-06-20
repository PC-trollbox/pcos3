async function loadModules() {
    try {
        let moduleList = await modules.fs.ls(modules.defaultSystem + "/modules");
        for (let moduleName of moduleList) {
            modules.fs.mounts["." + moduleName] = await modules.mounts.fileMount({
                srcFile: modules.defaultSystem + "/modules/" + moduleName,
                read_only: true
            });
            if (modules.core.bootMode == "logboot") modules.core.tty_bios_api.println("\t../modules/" + moduleName);
        }
        let newSystemMount = "system";
        if (modules.defaultSystem == "system") newSystemMount = "system-" + crypto.getRandomValues(new Uint8Array(4)).reduce((a, b) => a + b.toString(16).padStart(2, "0"), "");
        modules.fs.mounts[newSystemMount] = await modules.mounts.overlayMount({
            mounts: [ modules.defaultSystem, ...moduleList.map(a => "." + a) ]
        });
        modules.defaultSystem = newSystemMount;
    } catch (e) {
        console.error("Module system failed:", e);
    }
}
await loadModules();