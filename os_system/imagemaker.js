// =====BEGIN MANIFEST=====
// allow: GET_THEME, LLDISK_READ, LLDISK_WRITE, LLDISK_LIST_PARTITIONS, LLDISK_INIT_PARTITIONS, LLDISK_REMOVE, LLDISK_IDB_READ, LLDISK_IDB_WRITE, LLDISK_IDB_REMOVE, LLDISK_IDB_LIST, LLDISK_IDB_SYNC, FS_READ, FS_WRITE, FS_BYPASS_PERMISSIONS, SYSTEM_SHUTDOWN, FS_LIST_PARTITIONS, IPC_SEND_PIPE, GET_LOCALE, IPC_CREATE_PIPE, IPC_LISTEN_PIPE, START_TASK
// =====END MANIFEST=====
(async function() {
    // @pcos-app-mode isolatable
    document.body.style.fontFamily = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
    if (await availableAPIs.isDarkThemed()) document.body.style.color = "white";
    await availableAPIs.windowTitleSet("Image maker");

    let privileges = await availableAPIs.getPrivileges();
    let checklist = [ "GET_THEME", "LLDISK_READ", "LLDISK_WRITE", "LLDISK_LIST_PARTITIONS", "LLDISK_INIT_PARTITIONS", "LLDISK_REMOVE", "LLDISK_IDB_READ", "LLDISK_IDB_WRITE", "LLDISK_IDB_REMOVE", "LLDISK_IDB_LIST", "LLDISK_IDB_SYNC", "FS_READ", "FS_WRITE", "FS_BYPASS_PERMISSIONS", "SYSTEM_SHUTDOWN", "FS_LIST_PARTITIONS", "IPC_SEND_PIPE", "GET_LOCALE", "IPC_CREATE_PIPE", "IPC_LISTEN_PIPE", "START_TASK" ];
    if (!checklist.every(p => privileges.includes(p))) return document.body.innerText = "Insufficient privileges.";

    mainPage();
})();

function mainPage() {
    document.body.innerText = "";
    let create = document.createElement("button");
    let restore = document.createElement("button");
    create.innerText = "Image this system";
    restore.innerText = "Restore image";
    create.onclick = createPage;
    restore.onclick = restorePage;
    document.body.appendChild(create);
    document.body.appendChild(restore);
}

function createPage() {
    document.body.innerText = "";
    let backBtn = document.createElement("button");
    let pageTitle = document.createElement("span");
    let selectedFileLabel = document.createElement("label");
    let selectedFile = document.createElement("input");
    let selectedFileButton = document.createElement("button");
    let createBtn = document.createElement("button");
    let progressBar = document.createElement("progress");
    let outcome = document.createElement("span");
    backBtn.innerText = "Back";
    pageTitle.innerText = "Image this system";
    selectedFileLabel.innerText = "To: ";
    selectedFileButton.innerText = "Select";
    createBtn.innerText = "Create image";
    outcome.innerText = "Status";
    progressBar.hidden = true;
    document.body.appendChild(backBtn);
    document.body.appendChild(pageTitle);
    document.body.appendChild(document.createElement("hr"));
    document.body.appendChild(selectedFileLabel);
    document.body.appendChild(selectedFile);
    document.body.appendChild(selectedFileButton);
    document.body.appendChild(document.createElement("hr"));
    document.body.appendChild(createBtn);
    document.body.appendChild(progressBar);
    document.body.appendChild(outcome);

    backBtn.onclick = mainPage;
    selectedFileButton.onclick = async function() {
        let ipcPipe = await availableAPIs.createPipe();
        await availableAPIs.windowVisibility(false);
        await availableAPIs.startTask({ file: (await availableAPIs.getSystemMount()) + "/apps/filePicker.js", argPassed: [ipcPipe, "save"] });
        let result = await availableAPIs.listenToPipe(ipcPipe);
        await availableAPIs.closePipe(ipcPipe);
        await availableAPIs.windowVisibility(true);
        if (result.success) selectedFile.value = result.selected;
    }

    createBtn.onclick = async function() {
        backBtn.disabled = true;
        selectedFileButton.disabled = true;
        createBtn.disabled = true;
        progressBar.hidden = false;
        outcome.hidden = true;
        progressBar.max = 0;
        progressBar.value = 0;
        await availableAPIs.closeability(false);

        async function stopProduction(oc) {
            backBtn.disabled = false;
            selectedFileButton.disabled = false;
            createBtn.disabled = false;
            progressBar.hidden = true;
            outcome.hidden = false;
            outcome.innerText = oc;
            await availableAPIs.closeability(true);
        }

        if (selectedFile.value == "") return stopProduction("No output file selected.");
        let image = { metadata: {}, data: {} };
        let subImage = [];
        try { subImage = await availableAPIs.lldaList(); progressBar.max = subImage.length;
            } catch { return stopProduction("Failed to list partitions."); }
        for (let partition of subImage) try { image.metadata[partition] = await availableAPIs.lldaRead({ partition }); progressBar.value++;
            } catch { return stopProduction("Failed to read partition " + partition); }
        try { subImage = await availableAPIs.lldaIDBList(); progressBar.max += subImage.length;
            } catch { return stopProduction("Failed to list data on partitions."); } 
        for (let dataPart of subImage) try { image.data[dataPart] = await availableAPIs.lldaIDBRead({ key: dataPart }); progressBar.value++;
            } catch { return stopProduction("Failed to read some data on partition."); }
        subImage = [];
        try { await availableAPIs.fs_write({ path: selectedFile.value, data: JSON.stringify(image) });
            } catch { return stopProduction("Failed to write image."); }
        stopProduction("Image created.");
    }
}

function restorePage() {
    document.body.innerText = "";
    let backBtn = document.createElement("button");
    let pageTitle = document.createElement("span");
    let selectedFileLabel = document.createElement("label");
    let selectedFile = document.createElement("input");
    let selectedFileButton = document.createElement("button");
    let rebootOnRestore = document.createElement("input");
    let rebootOnRestoreLabel = document.createElement("label");
    let mergeFlag = document.createElement("input");
    let mergeFlagLabel = document.createElement("label");
    let restoreBtn = document.createElement("button");
    let progressBar = document.createElement("progress");
    let outcome = document.createElement("span");
    backBtn.innerText = "Back";
    pageTitle.innerText = "Restore image";
    selectedFileLabel.innerText = "From: ";
    selectedFileButton.innerText = "Select";
    restoreBtn.innerText = "Restore image";
    rebootOnRestoreLabel.innerText = "Reboot on restore";
    mergeFlagLabel.innerText = "Merge (inconsistent!)";
    outcome.innerText = "Status";
    rebootOnRestore.type = "checkbox";
    mergeFlag.type = "checkbox";
    rebootOnRestore.id = "rebootOnRestore";
    mergeFlag.id = "mergeFlag";
    rebootOnRestoreLabel.htmlFor = "rebootOnRestore";
    mergeFlagLabel.htmlFor = "mergeFlag";
    progressBar.hidden = true;
    document.body.appendChild(backBtn);
    document.body.appendChild(pageTitle);
    document.body.appendChild(document.createElement("hr"));
    document.body.appendChild(selectedFileLabel);
    document.body.appendChild(selectedFile);
    document.body.appendChild(selectedFileButton);
    document.body.appendChild(document.createElement("br"));
    document.body.appendChild(rebootOnRestore);
    document.body.appendChild(rebootOnRestoreLabel);
    document.body.appendChild(document.createElement("br"));
    document.body.appendChild(mergeFlag);
    document.body.appendChild(mergeFlagLabel);
    document.body.appendChild(document.createElement("hr"));
    document.body.appendChild(restoreBtn);
    document.body.appendChild(progressBar);
    document.body.appendChild(outcome);

    backBtn.onclick = mainPage;
    selectedFileButton.onclick = async function() {
        let ipcPipe = await availableAPIs.createPipe();
        await availableAPIs.windowVisibility(false);
        await availableAPIs.startTask({ file: (await availableAPIs.getSystemMount()) + "/apps/filePicker.js", argPassed: [ipcPipe, "load"] });
        let result = await availableAPIs.listenToPipe(ipcPipe);
        await availableAPIs.closePipe(ipcPipe);
        await availableAPIs.windowVisibility(true);
        if (result.success) selectedFile.value = result.selected;
    }

    restoreBtn.onclick = async function() {
        backBtn.disabled = true;
        selectedFileButton.disabled = true;
        restoreBtn.disabled = true;
        progressBar.hidden = false;
        outcome.hidden = true;
        progressBar.max = 0;
        progressBar.value = 0;
        await availableAPIs.closeability(false);

        async function stopProduction(oc) {
            backBtn.disabled = false;
            selectedFileButton.disabled = false;
            restoreBtn.disabled = false;
            progressBar.hidden = true;
            outcome.hidden = false;
            outcome.innerText = oc;
            await availableAPIs.closeability(true);
        }

        if (selectedFile.value == "") return stopProduction("No output file selected.");
        try { await availableAPIs.lldaList();
            } catch { await availableAPIs.lldaInitPartitions(); }

        let image;
        try { image = JSON.parse(await availableAPIs.fs_read({ path: selectedFile.value }));
            } catch { return stopProduction("Failed to read image."); }

        progressBar.max += Object.keys(image.metadata).length + Object.keys(image.data).length;
        for (let partition in image.metadata) try { await availableAPIs.lldaWrite({ partition, data: image.metadata[partition] }); progressBar.value++;
            } catch { return stopProduction("Failed to write partition " + partition + ". The image is partially restored."); }
        for (let dataPart in image.data) try { await availableAPIs.lldaIDBWrite({ key: dataPart, value: image.data[dataPart] }); progressBar.value++;
            } catch { return stopProduction("Failed to write some data on partition. The image is partially restored."); }
        
        if (!mergeFlag.checked) {
            let currentSubImage = [];
            try { currentSubImage = (await availableAPIs.lldaList()).filter(a => !Object.keys(image.metadata).includes(a)); progressBar.max += currentSubImage.length;
                } catch { return stopProduction("Failed to list partitions. The image was restored."); }
            for (let partition of currentSubImage) try { await availableAPIs.lldaRemove({ partition }); progressBar.value++;
                } catch { return stopProduction("Failed to delete partition " + partition + ". The image was restored."); }
            
            try { currentSubImage = (await availableAPIs.lldaIDBList()).filter(a => !Object.keys(image.data).includes(a)); progressBar.max += currentSubImage.length;
                } catch { return stopProduction("Failed to list data on partitions. The image was restored."); }
            for (let dataPart of currentSubImage) try { await availableAPIs.lldaIDBRemove({ key: dataPart }); progressBar.value++;
                } catch { return stopProduction("Failed to delete some data on partition. The image was restored."); }
            currentSubImage = [];
        }

        try { await availableAPIs.lldaIDBSync();
        } catch {}

        if (rebootOnRestore.checked) try { await availableAPIs.shutdown({ isReboot: true });
            } catch { return stopProduction("Failed to shutdown. The image was restored."); }
        stopProduction("Image restored.");
    }
}
addEventListener("signal", async function(e) {
    if (e.detail == 15) await window.availableAPIs.terminate();
}); null;