// =====BEGIN MANIFEST=====
// link: lrn:TEXT_EDITOR
// association: txt
// signer: automaticSigner
// allow: FS_READ, FS_WRITE, FS_LIST_PARTITIONS, IPC_CREATE_PIPE, IPC_LISTEN_PIPE, GET_LOCALE, GET_THEME, START_TASK, IPC_SEND_PIPE, FS_BYPASS_PERMISSIONS
// =====END MANIFEST=====
(async function() {
    // @pcos-app-mode isolatable
    await availableAPIs.windowTitleSet(await availableAPIs.lookupLocale("TEXT_EDITOR"));
    document.body.style.fontFamily = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
    if (await availableAPIs.isDarkThemed()) document.body.style.color = "white";
    document.documentElement.style.height = "100%";
    document.documentElement.style.width = "100%";
    document.body.style.height = "100%";
    document.body.style.width = "100%";
    document.body.style.margin = "0";
    let flexContainer = document.createElement("div");
    let buttonContainer = document.createElement("div");
    let loadButton = document.createElement("button");
    let saveButton = document.createElement("button");
    let statusMessage = document.createElement("span");
    let data = document.createElement("textarea");
    let hr = document.createElement("hr");
    let hrContainer = document.createElement("div");
    let lastFile = "";
    loadButton.innerText = await availableAPIs.lookupLocale("LOAD_BTN");
    saveButton.innerText = await availableAPIs.lookupLocale("SAVE_BTN");
    flexContainer.style.display = "flex";
    flexContainer.style.flexDirection = "column";
    flexContainer.style.width = "100%";
    flexContainer.style.height = "100%";
    data.style.flexGrow = 1000;
    data.style.resize = "none";
    if (await availableAPIs.isDarkThemed()) {
        data.style.backgroundColor = "#2b2a33";
        data.style.color = "white";
    }
    buttonContainer.appendChild(loadButton);
    buttonContainer.appendChild(saveButton);
    buttonContainer.appendChild(statusMessage);
    hrContainer.appendChild(hr);
    flexContainer.appendChild(buttonContainer);
    flexContainer.appendChild(hrContainer);
    flexContainer.appendChild(data);
    document.body.appendChild(flexContainer);
    try {
        if (exec_args[0]) {
            data.value = await availableAPIs.fs_read({ path: exec_args[0] });
            lastFile = exec_args[0];
            statusMessage.innerText = exec_args[0].split("/").pop();
        }
    } catch (e) {
        statusMessage.innerText = e.name + ": " + e.message;
    }
    loadButton.onclick = async function() {
        let ipcPipe = await availableAPIs.createPipe();
        await availableAPIs.windowVisibility(false);
        await availableAPIs.startTask({ file: (await availableAPIs.getSystemMount()) + "/apps/filePicker.js", argPassed: [ipcPipe, "load", lastFile] });
        let result = await availableAPIs.listenToPipe(ipcPipe);
        await availableAPIs.closePipe(ipcPipe);
        await availableAPIs.windowVisibility(true);
        try {
            if (result.success) {
                data.value = await availableAPIs.fs_read({ path: result.selected });
                lastFile = result.selected;
                statusMessage.innerText = result.selected.split("/").pop();
            }
        } catch (e) {
            statusMessage.innerText = e.name + ": " + e.message;
        }
    }
    saveButton.onclick = async function() {
        let ipcPipe = await availableAPIs.createPipe();
        await availableAPIs.windowVisibility(false);
        await availableAPIs.startTask({ file: (await availableAPIs.getSystemMount()) + "/apps/filePicker.js", argPassed: [ipcPipe, "save", lastFile] });
        let result = await availableAPIs.listenToPipe(ipcPipe);
        await availableAPIs.closePipe(ipcPipe);
        await availableAPIs.windowVisibility(true);
        try {
            if (result.success) {
                await availableAPIs.fs_write({ path: result.selected, data: data.value });
                lastFile = result.selected;
                statusMessage.innerText = result.selected.split("/").pop();
            }
        } catch (e) {
            statusMessage.innerText = e.name + ": " + e.message;
        }
    }
})();
addEventListener("signal", async function(e) {
    if (e.detail == 15) await window.availableAPIs.terminate();
}); null;