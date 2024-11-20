async function fsck() {
    // @pcos-app-mode native
    function println(str) {
        modules.core.tty_bios_api.println(str);
        return new Promise(function(resolve) {
            requestAnimationFrame(resolve);
        })
    }
    let fsckMode;
    try {
        fsckMode = await modules.fs.read(modules.defaultSystem + "/.fsck");
        await modules.fs.rm(modules.defaultSystem + "/.fsck");
    } catch {
        await println("Skipping file system checking.");
        return;
    }
    async function scanLLDA() {
        let fs = modules.fs;
        if (fs.mounts[modules.defaultSystem].read_only) {
            await println("File system is read-only.");
            return { lldaPoints: "abort", lldaId: "abort" };
        }
        if (fs.mounts[modules.defaultSystem].partition.getData) {
            let llda = fs.mounts[modules.defaultSystem].partition.getData().files;
            let lldaId = fs.mounts[modules.defaultSystem].partition.getData().id;
            llda = Object.values(llda);
            while (llda.some(a => typeof a === "object")) llda = llda.map(a => typeof a === "object" ? Object.values(a) : a).flat(); 
            return { lldaPoints: llda, lldaId: lldaId };
        } else {
            await println("Low-level disk access is impossible.");
            return { lldaPoints: "abort", lldaId: "abort" };
        }
    }
    await println("A file system check has been requested.");
    await println("Scanning for file points.");
    let { lldaPoints, lldaId } = await scanLLDA();
    if (lldaPoints === "abort") {
        await println("Skipping file system checking.");
        return;
    }
    await println("File points found: " + lldaPoints.length);
    await println("Reading indexedDB keys.");
    let idb_keys = modules.core.idb._db.transaction("disk").objectStore("disk").getAllKeys();
    idb_keys = await new Promise(function(resolve) {
        idb_keys.onsuccess = () => resolve(idb_keys.result);
    });
    idb_keys.splice(idb_keys.indexOf("disk"), 1);
    await println("IndexedDB keys found: " + idb_keys.length);
    await println("Filtering IndexedDB keys...");
    if (fsckMode != "discard-all") idb_keys = idb_keys.filter(a => a.startsWith(lldaId + "-")).map(a => a.slice(lldaId.length + 1));
    await println("Filtered keys: " + idb_keys.length);
    let missingFiles = idb_keys.filter(a => !lldaPoints.includes(a.slice(fsckMode == "discard-all" ? (lldaId + "-").length : 0)));
    await println("Missing files: " + missingFiles.length);
    let llda = modules.fs.mounts[modules.defaultSystem].partition.getData();
    if (fsckMode == "recover") {
        try {
            await modules.fs.mkdir(modules.defaultSystem + "/lost+found");
            await println("Created lost+found directory.");
        } catch {
            await println("Lost+found directory already exists.");
        }
        for (let file of missingFiles) {
            await println("Moving " + file + " to lost+found.");
            llda.files["lost+found"][file] = file;
        }
    } else if (fsckMode == "discard" || fsckMode == "discard-all") {
        for (let file of missingFiles) {
            await println("Deleting " + file + ".");
            await modules.core.idb.removePart((fsckMode == "discard" ? (lldaId + "-") : "") + file);
        }
    } else {
        await println("Unsure what to do, not doing anything.");
    }
    await println("Saving modified file table.");
    modules.fs.mounts[modules.defaultSystem].partition.setData(llda);
    await modules.core.idb.sync();
    await println("File system check complete.");
}
await fsck();