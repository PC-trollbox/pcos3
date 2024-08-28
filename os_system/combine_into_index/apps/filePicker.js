// =====BEGIN MANIFEST=====
// signer: automaticSigner
// allow: FS_READ, FS_LIST_PARTITIONS, IPC_SEND_PIPE, GET_LOCALE, GET_THEME, FS_BYPASS_PERMISSIONS
// =====END MANIFEST=====
let ipcChannel = exec_args[0];
(async function() {
    // @pcos-app-mode isolatable
    if (!ipcChannel) return availableAPIs.terminate();
    await availableAPIs.windowTitleSet(await availableAPIs.lookupLocale("FILE_PICKER"));
    document.body.style.fontFamily = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
    if (await availableAPIs.isDarkThemed()) document.body.style.color = "white";
    let privileges = await availableAPIs.getPrivileges();
    let checklist = [ "FS_READ", "FS_LIST_PARTITIONS", "IPC_SEND_PIPE" ];
    if (!checklist.every(p => privileges.includes(p))) {
        if (privileges.includes("IPC_SEND_PIPE")) await availableAPIs.sendToPipe({ pipe: ipcChannel, data: { success: false, reason: "permissions" } });
        return availableAPIs.terminate();
    }
    document.body.innerText = "";
    let mainComponent = document.createElement("div");
    let pathInputForm = document.createElement("form");
    let pathElement = document.createElement("input");
    pathElement.value = exec_args[2] || "";
    let browseButton = document.createElement("button");
    let displayResult = document.createElement("div");
    let newItemInput = document.createElement("input");
    let newItemBrowse = document.createElement("button");
    let newItemContainer = document.createElement("div");
    let previousDirectory = "";
    let isDefaultChoice = true;
    mainComponent.style.display = "flex";
    mainComponent.style.flexDirection = "column";
    mainComponent.style.width = "100%";
    mainComponent.style.height = "100%";
    mainComponent.style.position = "absolute";
    mainComponent.style.top = "0";
    mainComponent.style.left = "0";
    mainComponent.style.padding = "8px";
    mainComponent.style.boxSizing = "border-box";
    displayResult.style.flex = "1";
    newItemBrowse.innerText = await availableAPIs.lookupLocale("SAVE_BTN");
    newItemContainer.appendChild(document.createElement("hr"));
    newItemContainer.appendChild(newItemInput);
    browseButton.innerText = await availableAPIs.lookupLocale("BROWSE_FEXP");
    newItemContainer.appendChild(newItemBrowse);
    pathInputForm.appendChild(pathElement);
    pathInputForm.appendChild(browseButton);
    mainComponent.appendChild(pathInputForm);
    mainComponent.appendChild(displayResult);
    mainComponent.appendChild(newItemContainer);
    document.body.appendChild(mainComponent);
    newItemContainer.hidden = exec_args[1] != "save";
    async function browse() {
        let path = pathElement.value;
        if (path.endsWith("/")) path = path.substring(0, path.length - 1);
        displayResult.innerText = "";
        if (path == "") {
            let partitions = await availableAPIs.fs_mounts();
            for (let partition of partitions) {
                let openButton = document.createElement("button");
                openButton.innerText = partition;
                openButton.onclick = function() {
                    pathElement.value = partition;
                    browse();
                }
                displayResult.appendChild(openButton);
            }
            previousDirectory = path;
            return "browsed";
        }
        try {
            let type = await isDirectory(path);
            if (type == "directory") {
                let ls = await availableAPIs.fs_ls({ path: path });
                for (let file of ls) {
                    let openButton = document.createElement("button");
                    openButton.innerText = file;
                    openButton.onclick = function() {
                        pathElement.value = path + "/" + file;
                        browse();
                    }
                    displayResult.appendChild(openButton);
                }
                previousDirectory = path;
            } else if (type == "file" || (type == "unknown" && exec_args[1] == "save")) {
                if (isDefaultChoice) {
                    pathElement.value = path.split("/").slice(0, -1).join("/");
                    return browse();
                }
                displayResult.innerText = "";
                await availableAPIs.sendToPipe({ pipe: ipcChannel, data: { success: true, selected: path } });
                await availableAPIs.terminate();
            } else {
                displayResult.innerText = (await availableAPIs.lookupLocale("FILE_STRUCT_BROWSE_FAIL")).replace("%s", (await availableAPIs.lookupLocale("UNKNOWN_FS_STRUCT")).replace("%s", type));
            }
        } catch (e) {
            displayResult.innerText = (await availableAPIs.lookupLocale("FILE_STRUCT_BROWSE_FAIL")).replace("%s", await availableAPIs.lookupLocale(e.message));
        }
        isDefaultChoice = false;
    }
    browse();
    browseButton.onclick = browse;
    newItemBrowse.onclick = async function() {
        if (previousDirectory == "") return displayResult.innerText = (await availableAPIs.lookupLocale("FILE_STRUCT_BROWSE_FAIL")).replace("%s", await availableAPIs.lookupLocale("NO_SAVE_IN_MTN"));
        pathElement.value = previousDirectory + "/" + newItemInput.value;
        browse();
    }
})();
async function isDirectory(path) {
    try {
        let isDirectoryVar = await availableAPIs.fs_isDirectory({ path });
        return isDirectoryVar ? "directory" : "file";
    } catch {
        return "unknown";
    }
}
addEventListener("signal", async function(e) {
    if (e.detail == 15) {
        await availableAPIs.sendToPipe({ pipe: ipcChannel, data: { success: false, reason: "closed" } });
        await window.availableAPIs.terminate();
    }
}); null;