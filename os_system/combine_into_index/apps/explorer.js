// =====BEGIN MANIFEST=====
// link: lrn:FILE_EXPLORER
// signer: automaticSigner
// allow: FS_READ, FS_LIST_PARTITIONS, ELEVATE_PRIVILEGES, START_TASK, GET_LOCALE, GET_THEME, MANAGE_TOKENS, FS_REMOVE, FS_BYPASS_PERMISSIONS, FS_UNMOUNT, FS_CHANGE_PERMISSION, FS_MOUNT, GET_FILESYSTEMS, FS_WRITE, LLDISK_LIST_PARTITIONS, GET_USER_INFO
// =====END MANIFEST=====
let globalToken;
(async function() {
    // @pcos-app-mode isolatable
    await availableAPIs.windowTitleSet(await availableAPIs.lookupLocale("FILE_EXPLORER"));
    document.body.style.fontFamily = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
    if (await availableAPIs.isDarkThemed()) document.body.style.color = "white";
    let privileges = await availableAPIs.getPrivileges();
    let checklist = [ "FS_READ", "FS_LIST_PARTITIONS" ];
    if (!checklist.every(p => privileges.includes(p))) {
        document.body.innerText = await availableAPIs.lookupLocale("GRANT_FEXP_PERM");
        let button = document.createElement("button");
        button.innerText = await availableAPIs.lookupLocale("GRANT_PERM");
        document.body.appendChild(button);
        if (!privileges.includes("ELEVATE_PRIVILEGES")) {
            button.disabled = true;
            document.body.innerText = await availableAPIs.lookupLocale("GRANT_FEXP_PERM_ADM");
            return;
        }
        await new Promise(function(resolve) {
            button.onclick = async function() {
                button.disabled = true;
                let currentToken = await availableAPIs.getProcessToken();
                let newToken = await availableAPIs.getNewToken();
                button.disabled = false;
                if (!newToken) return;
                await availableAPIs.setProcessToken(newToken);
                await availableAPIs.revokeToken(currentToken);
                privileges = await availableAPIs.getPrivileges();
                if (checklist.every(p => privileges.includes(p))) resolve();
                else document.body.innerText = await availableAPIs.lookupLocale("GRANT_FEXP_PERM_USR");
            }
        });
    }
    let hideHiddenFiles = true;
    try {
        let homedir = (await availableAPIs.getUserInfo({ desiredUser: await availableAPIs.getUser() })).homeDirectory;
        hideHiddenFiles = (await availableAPIs.fs_read({
            path: homedir + "/.hiddenFiles",
        })) != "show";
    } catch {}
    document.body.innerText = "";
    let mainComponent = document.createElement("div");
    let pathInputForm = document.createElement("form");
    let pathElement = document.createElement("input");
    let browseButton = document.createElement("button");
    let displayResult = document.createElement("div");
    let previousDirectory = "";
    let clipboard = {
        path: "",
        cut: false,
        selected: false
    };
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
    browseButton.innerText = await availableAPIs.lookupLocale("BROWSE_FEXP");
    pathInputForm.appendChild(pathElement);
    pathInputForm.appendChild(browseButton);
    mainComponent.appendChild(pathInputForm);
    mainComponent.appendChild(displayResult);
    document.body.appendChild(mainComponent);
    displayResult.oncontextmenu = async function(e) {
        e.stopImmediatePropagation();
        e.preventDefault();
        e.stopPropagation();
        displayResult.innerText = "";
        let showHiddenFilesToggle = document.createElement("button");
        showHiddenFilesToggle.innerText = await availableAPIs.lookupLocale("TOGGLE_HIDDEN_FILES");
        showHiddenFilesToggle.addEventListener("click", async function() {
            hideHiddenFiles = !hideHiddenFiles;
            try {
                let homedir = (await availableAPIs.getUserInfo({ desiredUser: await availableAPIs.getUser() })).homeDirectory;
                availableAPIs.fs_write({
                    path: homedir + "/.hiddenFiles",
                    data: (hideHiddenFiles ? "hide" : "show")
                });
            } catch {}
            browse();
        });
        displayResult.appendChild(showHiddenFilesToggle);
        displayResult.appendChild(document.createElement("hr"));
        if (previousDirectory == "") {
            let mountForm = document.createElement("form");
            let mountpoint = document.createElement("input");
            let filesystemOptions = document.createElement("select");
            let autoGenMountOptions = document.createElement("select");
            let mountOptions = document.createElement("textarea");
            let mountButton = document.createElement("button");
            mountpoint.placeholder = await availableAPIs.lookupLocale("MOUNTPOINT");
            let availableFilesystems = await availableAPIs.supportedFilesystems();
            for (let filesystem of availableFilesystems) {
                let option = document.createElement("option");
                option.value = filesystem;
                option.innerText = filesystem;
                filesystemOptions.appendChild(option);
            }
            let availablePartitions = [];
            try {
                availablePartitions = await availableAPIs.lldaList();
            } catch (e) {
                console.error(e);
            }
            let defaultPartitionOption = document.createElement("option");
            defaultPartitionOption.value = "";
            defaultPartitionOption.innerText = await availableAPIs.lookupLocale("GENERATE_PROMPT");
            defaultPartitionOption.selected = true;
            defaultPartitionOption.disabled = true;
            defaultPartitionOption.hidden = true;
            autoGenMountOptions.appendChild(defaultPartitionOption);
            for (let partition of availablePartitions) {
                let option = document.createElement("option");
                option.value = partition;
                option.innerText = partition;
                autoGenMountOptions.appendChild(option);
            }
            autoGenMountOptions.onchange = function() {
                mountOptions.value = JSON.stringify({ partition: autoGenMountOptions.value });
            }
            mountOptions.value = "{}";
            mountButton.innerText = await availableAPIs.lookupLocale("MOUNT_BUTTON");
            mountButton.onclick = async function() {
                try {
                    let options = JSON.parse(mountOptions.value);
                    await availableAPIs.fs_mount({ mountpoint: mountpoint.value, filesystem: filesystemOptions.value, filesystemOptions: options });
                    browse();
                } catch (e) {
                    console.error(e);
                    displayResult.innerText = (await availableAPIs.lookupLocale("FILE_STRUCT_BROWSE_FAIL")).replace("%s", e.name + ": " + e.message);
                }
            }
            mountForm.appendChild(mountpoint);
            mountForm.appendChild(document.createElement("br"));
            mountForm.appendChild(filesystemOptions);
            mountForm.appendChild(document.createElement("hr"));
            mountForm.appendChild(autoGenMountOptions);
            mountForm.appendChild(document.createElement("br"));
            mountForm.appendChild(mountOptions);
            mountForm.appendChild(document.createElement("hr"));
            mountForm.appendChild(mountButton);
            displayResult.appendChild(mountForm);
        } else {
            let makeDirectoryForm = document.createElement("form");
            let makeDirectoryInput = document.createElement("input");
            let makeDirectoryButton = document.createElement("button");
            makeDirectoryInput.pattern = "[!-.0-~]+";
            makeDirectoryInput.placeholder = await availableAPIs.lookupLocale("NEW_DIR_NAME");
            makeDirectoryForm.appendChild(makeDirectoryInput);
            makeDirectoryForm.appendChild(makeDirectoryButton);
            displayResult.appendChild(makeDirectoryForm);
            makeDirectoryButton.innerText = await availableAPIs.lookupLocale("MKDIR_BUTTON");
            makeDirectoryButton.onclick = async function() {
                let dirName = makeDirectoryInput.value;
                if (dirName == "") return;
                try {
                    await availableAPIs.fs_mkdir({ path: previousDirectory + "/" + dirName });
                    browse();
                } catch (e) {
                    displayResult.innerText = (await availableAPIs.lookupLocale("FILE_STRUCT_BROWSE_FAIL")).replace("%s", await availableAPIs.lookupLocale(e.message));
                }
            }
            if (clipboard.selected) {
                displayResult.appendChild(document.createElement("hr"));
                let pasteButton = document.createElement("button");
                pasteButton.innerText = await availableAPIs.lookupLocale("CLIPBOARD_PASTE");
                pasteButton.onclick = async function() {
                    try {
                        let copyAllowed = await isDirectory(clipboard.path) == "file";
                        if (!copyAllowed) throw new Error(await availableAPIs.lookupLocale("CLIPBOARD_SOURCE_GONE"));
                        let readFile = await availableAPIs.fs_read({ path: clipboard.path });
                        let basename = clipboard.path.split("/").slice(-1)[0];
                        copyAllowed = await isDirectory(previousDirectory + "/" + basename) == "unknown";
                        if (!copyAllowed) throw new Error(await availableAPIs.lookupLocale("CLIPBOARD_CONFLICT"));
                        await availableAPIs.fs_write({ path: previousDirectory + "/" + basename, data: readFile });
                        if (clipboard.cut) await availableAPIs.fs_rm({ path: clipboard.path });
                        browse();
                    } catch (e) {
                        displayResult.innerText = (await availableAPIs.lookupLocale("FILE_STRUCT_BROWSE_FAIL")).replace("%s", await availableAPIs.lookupLocale(e.message));
                    }
                }
                displayResult.appendChild(pasteButton);
            }
        }
    }
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
                openButton.oncontextmenu = async function(e) {
                    e.stopImmediatePropagation();
                    e.preventDefault();
                    e.stopPropagation();
                    displayResult.innerText = "";
                    let unmountButton = document.createElement("button");
                    unmountButton.innerText = await availableAPIs.lookupLocale("UNMOUNT_BTN");
                    unmountButton.onclick = async function() {
                        try {
                            await availableAPIs.fs_unmount({ mount: partition });
                            browse();
                        } catch (e) {
                            displayResult.innerText = (await availableAPIs.lookupLocale("FILE_STRUCT_BROWSE_FAIL")).replace("%s", await availableAPIs.lookupLocale(e.message));
                        }
                    }
                    displayResult.appendChild(unmountButton);
                    displayResult.appendChild(document.createElement("hr"));

                    let deleteButton = document.createElement("button");
                    deleteButton.innerText = await availableAPIs.lookupLocale("REMOVE_BTN");
                    deleteButton.onclick = async function() {
                        try {
                            await recursiveRemove(partition);
                            browse();
                        } catch (e) {
                            displayResult.innerText = (await availableAPIs.lookupLocale("FILE_STRUCT_BROWSE_FAIL")).replace("%s", await availableAPIs.lookupLocale(e.message));
                        }
                    }
                    displayResult.appendChild(deleteButton);

                    displayResult.appendChild(document.createElement("br"));
                    let permissions = { owner: "nobody", group: "nobody", world: "rx" };
                    try {
                        permissions = await availableAPIs.fs_permissions({ path: partition });
                    } catch (e) {
                        console.error(e);
                    }
                    let chownForm = document.createElement("form");
                    let chownInput = document.createElement("input");
                    let chownButton = document.createElement("button");
                    chownInput.value = permissions.owner;
                    chownButton.innerText = await availableAPIs.lookupLocale("CHOWN_BUTTON");
                    chownForm.appendChild(chownInput);
                    chownForm.appendChild(chownButton);
                    displayResult.appendChild(chownForm);
                    chownButton.onclick = async function() {
                        try {
                            await availableAPIs.fs_chown({ path: partition, newUser: chownInput.value });
                            browse();
                        } catch (e) {
                            displayResult.innerText = (await availableAPIs.lookupLocale("FILE_STRUCT_BROWSE_FAIL")).replace("%s", await availableAPIs.lookupLocale(e.message));
                        }
                    }

                    let chgrpForm = document.createElement("form");
                    let chgrpInput = document.createElement("input");
                    let chgrpButton = document.createElement("button");
                    chgrpInput.value = permissions.group;
                    chgrpButton.innerText = await availableAPIs.lookupLocale("CHGRP_BUTTON");
                    chgrpForm.appendChild(chgrpInput);
                    chgrpForm.appendChild(chgrpButton);
                    displayResult.appendChild(chgrpForm);
                    chgrpButton.onclick = async function() {
                        try {
                            await availableAPIs.fs_chgrp({ path: partition, newGrp: chgrpInput.value });
                            browse();
                        } catch (e) {
                            displayResult.innerText = (await availableAPIs.lookupLocale("FILE_STRUCT_BROWSE_FAIL")).replace("%s", await availableAPIs.lookupLocale(e.message));
                        }
                    }

                    let chmodForm = document.createElement("form");
                    let chmodInput = document.createElement("input");
                    let chmodButton = document.createElement("button");
                    chmodInput.value = permissions.world;
                    chownInput.pattern = "[rwx]+";
                    chmodButton.innerText = await availableAPIs.lookupLocale("CHMOD_BUTTON");
                    chmodForm.appendChild(chmodInput);
                    chmodForm.appendChild(chmodButton);
                    displayResult.appendChild(chmodForm);
                    chmodButton.onclick = async function() {
                        try {
                            await availableAPIs.fs_chmod({ path: partition, newPermissions: chmodInput.value });
                            browse();
                        } catch (e) {
                            displayResult.innerText = (await availableAPIs.lookupLocale("FILE_STRUCT_BROWSE_FAIL")).replace("%s", await availableAPIs.lookupLocale(e.message));
                        }
                    }
                }
                displayResult.appendChild(openButton);
            }
            displayResult.appendChild(document.createElement("hr"));
            let spaceDisplayer = document.createElement("span");
            let spaces = await availableAPIs.estimateStorage();
            for (let space in spaces) {
                spaceDisplayer.innerText += (await availableAPIs.lookupLocale("SPACE_SHOWER")).replace("%s", space).replace("%s", await availableAPIs.ufInfoUnits([spaces[space].used])).replace("%s", await availableAPIs.ufInfoUnits([spaces[space].total])).replace("%s", (spaces[space].used / spaces[space].total * 100).toFixed(2));
            }
            displayResult.appendChild(spaceDisplayer);
            previousDirectory = path;
            return "browsed";
        }
        try {
            let type = await isDirectory(path);
            if (type == "directory") {
                let ls = await availableAPIs.fs_ls({ path: path });
                for (let file of ls) {
                    if (file.startsWith(".") && hideHiddenFiles) continue;
                    let openButton = document.createElement("button");
                    openButton.innerText = file;
                    openButton.onclick = function() {
                        pathElement.value = path + "/" + file;
                        browse();
                    }
                    openButton.oncontextmenu = async function(e) {
                        e.stopImmediatePropagation();
                        e.preventDefault();
                        e.stopPropagation();
                        displayResult.innerText = "";
                        let copyAllow = false;
                        try {
                            copyAllow = await isDirectory(path + "/" + file) == "file";
                        } catch {}
                        if (copyAllow) {
                            let copyButton = document.createElement("button");
                            copyButton.innerText = await availableAPIs.lookupLocale("CLIPBOARD_COPY");
                            copyButton.onclick = async function() {
                                clipboard = {
                                    path: path + "/" + file,
                                    selected: true,
                                    cut: false
                                };
                                browse();
                            };
                            displayResult.appendChild(copyButton);

                            let cutButton = document.createElement("button");
                            cutButton.innerText = await availableAPIs.lookupLocale("CLIPBOARD_CUT");
                            cutButton.onclick = async function() {
                                clipboard = {
                                    path: path + "/" + file,
                                    selected: true,
                                    cut: true
                                };
                                browse();
                            };
                            displayResult.appendChild(cutButton);
                            displayResult.appendChild(document.createElement("hr"));
                        }
                        let deleteButton = document.createElement("button");
                        deleteButton.innerText = await availableAPIs.lookupLocale("REMOVE_BTN");
                        deleteButton.onclick = async function() {
                            try {
                                let isDir = await isDirectory(path + "/" + file);
                                if (isDir == "directory") await recursiveRemove(path + "/" + file);
                                else if (isDir == "file") await availableAPIs.fs_rm({ path: path + "/" + file });
                                browse();
                            } catch (e) {
                                displayResult.innerText = (await availableAPIs.lookupLocale("FILE_STRUCT_BROWSE_FAIL")).replace("%s", await availableAPIs.lookupLocale(e.message));
                            }
                        }
                        displayResult.appendChild(deleteButton);
                        displayResult.appendChild(document.createElement("br"));
                        let permissions = { owner: "nobody", group: "nobody", world: "rx" };
                        try {
                            permissions = await availableAPIs.fs_permissions({ path: path + "/" + file });
                        } catch (e) {
                            console.error(e);
                        }
                        let chownForm = document.createElement("form");
                        let chownInput = document.createElement("input");
                        let chownButton = document.createElement("button");
                        chownInput.value = permissions.owner;
                        chownButton.innerText = await availableAPIs.lookupLocale("CHOWN_BUTTON");
                        chownForm.appendChild(chownInput);
                        chownForm.appendChild(chownButton);
                        displayResult.appendChild(chownForm);
                        chownButton.onclick = async function() {
                            try {
                                await availableAPIs.fs_chown({ path: path + "/" + file, newUser: chownInput.value });
                                browse();
                            } catch (e) {
                                displayResult.innerText = (await availableAPIs.lookupLocale("FILE_STRUCT_BROWSE_FAIL")).replace("%s", await availableAPIs.lookupLocale(e.message));
                            }
                        }

                        let chgrpForm = document.createElement("form");
                        let chgrpInput = document.createElement("input");
                        let chgrpButton = document.createElement("button");
                        chgrpInput.value = permissions.group;
                        chgrpButton.innerText = await availableAPIs.lookupLocale("CHGRP_BUTTON");
                        chgrpForm.appendChild(chgrpInput);
                        chgrpForm.appendChild(chgrpButton);
                        displayResult.appendChild(chgrpForm);
                        chgrpButton.onclick = async function() {
                            try {
                                await availableAPIs.fs_chgrp({ path: path + "/" + file, newGrp: chgrpInput.value });
                                browse();
                            } catch (e) {
                                displayResult.innerText = (await availableAPIs.lookupLocale("FILE_STRUCT_BROWSE_FAIL")).replace("%s", await availableAPIs.lookupLocale(e.message));
                            }
                        }

                        let chmodForm = document.createElement("form");
                        let chmodInput = document.createElement("input");
                        let chmodButton = document.createElement("button");
                        chmodInput.value = permissions.world;
                        chownInput.pattern = "[rwx]+";
                        chmodButton.innerText = await availableAPIs.lookupLocale("CHMOD_BUTTON");
                        chmodForm.appendChild(chmodInput);
                        chmodForm.appendChild(chmodButton);
                        displayResult.appendChild(chmodForm);
                        chmodButton.onclick = async function() {
                            try {
                                await availableAPIs.fs_chmod({ path: path + "/" + file, newPermissions: chmodInput.value });
                                browse();
                            } catch (e) {
                                displayResult.innerText = (await availableAPIs.lookupLocale("FILE_STRUCT_BROWSE_FAIL")).replace("%s", await availableAPIs.lookupLocale(e.message));
                            }
                        }
                    }
                    displayResult.appendChild(openButton);
                }
                previousDirectory = path;
            } else if (type == "file") {
                pathElement.value = previousDirectory;
                await browse();
                if (path.endsWith(".js")) {
                    if (privileges.includes("START_TASK") && privileges.includes("ELEVATE_PRIVILEGES") && privileges.includes("MANAGE_TOKENS")) {
                        if (!globalToken) globalToken = await availableAPIs.getNewToken(await availableAPIs.getUser());
                        if (globalToken) {
                            let newToken = await availableAPIs.forkToken(globalToken);
                            await availableAPIs.startTask({ file: path, token: newToken });
                        }
                    } else {
                        displayResult.innerText = await availableAPIs.lookupLocale("MORE_PERMISSION_DENIED");
                    }
                } else if (path.endsWith(".lnk") && privileges.includes("ELEVATE_PRIVILEGES") && privileges.includes("MANAGE_TOKENS")) {
                    let file = await availableAPIs.fs_read({ path: path });
                    file = JSON.parse(file);
                    if (privileges.includes("START_TASK")) {
                        if (!globalToken) globalToken = await availableAPIs.getNewToken(await availableAPIs.getUser());
                        if (globalToken) {
                            let newToken = await availableAPIs.forkToken(globalToken);
                            await availableAPIs.startTask({ file: file.path, argPassed: [ ...(file.args || []) ], token: newToken });
                        }
                    } else {
                        displayResult.innerText = await availableAPIs.lookupLocale("MORE_PERMISSION_DENIED");
                    }
                } else {
                    let lookUpAssociation = await availableAPIs.fs_ls({ path: await availableAPIs.getSystemMount() + "/apps/associations" });
                    let fileType = path.split(".").slice(-1)[0];
                    if (!lookUpAssociation.includes(fileType)) return displayResult.innerText = await availableAPIs.lookupLocale("UNKNOWN_FILE_TYPE");
                    let file = await availableAPIs.fs_read({ path: await availableAPIs.getSystemMount() + "/apps/associations/" + fileType });
                    let fileLink = JSON.parse(file);
                    if (privileges.includes("START_TASK") && privileges.includes("ELEVATE_PRIVILEGES") && privileges.includes("MANAGE_TOKENS")) {
                        if (!globalToken) globalToken = await availableAPIs.getNewToken(await availableAPIs.getUser());
                        if (globalToken) {
                            let newToken = await availableAPIs.forkToken(globalToken);
                            await availableAPIs.startTask({ file: fileLink.path, argPassed: [ ...(fileLink.args || []), path ], token: newToken });
                        }
                    } else {
                        displayResult.innerText = await availableAPIs.lookupLocale("MORE_PERMISSION_DENIED");
                    }
                }
            } else {
                displayResult.innerText = (await availableAPIs.lookupLocale("FILE_STRUCT_BROWSE_FAIL")).replace("%s", (await availableAPIs.lookupLocale("UNKNOWN_FS_STRUCT")).replace("%s", type));
            }
        } catch (e) {
            displayResult.innerText = (await availableAPIs.lookupLocale("FILE_STRUCT_BROWSE_FAIL")).replace("%s", await availableAPIs.lookupLocale(e.message));
        }
    }
    browse();
    browseButton.onclick = browse;
})();
async function recursiveRemove(path) {
    let dirList = await availableAPIs.fs_ls({ path });
    for (let fileIndex in dirList) {
        let file = dirList[fileIndex];
        if (await availableAPIs.fs_isDirectory({ path: path + "/" + file })) await recursiveRemove(path + "/" + file);
        else await availableAPIs.fs_rm({ path: path + "/" + file });
    }
    await availableAPIs.fs_rm({ path });
}
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
        try {
            if (globalToken) await availableAPIs.revokeToken(globalToken);
        } catch {}
        await window.availableAPIs.terminate();
    }
}); null;