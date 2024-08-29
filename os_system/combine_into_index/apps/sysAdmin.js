// =====BEGIN MANIFEST=====
// link: lrn:SYSADMIN_TOOLS_TITLE
// signer: automaticSigner
// fnName: sysadminInstaller
// allow: SYSTEM_SHUTDOWN, FETCH_SEND, LLDISK_WRITE, RUN_KLVL_CODE, FS_READ, FS_WRITE, FS_LIST_PARTITIONS, GET_LOCALE, GET_THEME, IPC_CREATE_PIPE, IPC_LISTEN_PIPE, FS_BYPASS_PERMISSIONS
// =====END MANIFEST=====
(async function() {
    // @pcos-app-mode isolatable
    await availableAPIs.windowTitleSet(await availableAPIs.lookupLocale("SYSADMIN_TOOLS_TITLE"));
    let privileges = await availableAPIs.getPrivileges();
    document.body.style.fontFamily = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
    if (await availableAPIs.isDarkThemed()) document.body.style.color = "white";
    let container = document.createElement("div");
    let extraActivities = document.createElement("div");
    let osReinstallButton = document.createElement("button");
    let fsckOrderButton = document.createElement("button");
    let fsckDiscardButton = document.createElement("button");
    let wipeSystemButton = document.createElement("button");
    let updateSystemButton = document.createElement("button");
    let optionalComponentMgmt = document.createElement("button");
    osReinstallButton.innerText = await availableAPIs.lookupLocale("REINSTALL_BUTTON");
    fsckOrderButton.innerText = await availableAPIs.lookupLocale("FSCK_BUTTON");
    fsckDiscardButton.innerText = await availableAPIs.lookupLocale("DISCARD_BUTTON");
    wipeSystemButton.innerText = await availableAPIs.lookupLocale("SWIPE_BUTTON");
    updateSystemButton.innerText = await availableAPIs.lookupLocale("UPDATE_BUTTON");
    optionalComponentMgmt.innerText = await availableAPIs.lookupLocale("OPTIONAL_COMPONENTS_TITLE");
    osReinstallButton.addEventListener("click", async function() {
        let checklist = [ "SYSTEM_SHUTDOWN", "FETCH_SEND", "LLDISK_WRITE" ];
        if (!checklist.every(p => privileges.includes(p))) {
            extraActivities.innerText = await availableAPIs.lookupLocale("SYSADMIN_TOOLS_PRIVFAIL");
            return;
        }
        await availableAPIs.closeability(false);
        container.hidden = true;
        extraActivities.innerText = await availableAPIs.lookupLocale("REINSTALL_DOWNLOADING");
        let osArchive;
        try {
            osArchive = await availableAPIs.fetchSend({
                url: "/os.js",
                init: {}
            });
        } catch (e) {
            await availableAPIs.closeability(true);
            console.error(e);
            extraActivities.innerText = await availableAPIs.lookupLocale("REINSTALL_DOWNLOAD_FAILED");
            container.hidden = false;
            return;
        }
        extraActivities.innerText = await availableAPIs.lookupLocale("REINSTALL_DECODING");
        osArchive = osArchive.arrayBuffer;
        osArchive = new TextDecoder().decode(osArchive);
        extraActivities.innerText = await availableAPIs.lookupLocale("REINSTALL_SETTING");
        await availableAPIs.lldaWrite({
            partition: "boot",
            data: osArchive
        });
        extraActivities.innerText = await availableAPIs.lookupLocale("RESTARTING");
        await availableAPIs.shutdown({
            isReboot: true
        });
    });
    fsckOrderButton.addEventListener("click", async function() {
        let checklist = [ "SYSTEM_SHUTDOWN", "FS_WRITE" ];
        if (!checklist.every(p => privileges.includes(p))) {
            extraActivities.innerText = await availableAPIs.lookupLocale("SYSADMIN_TOOLS_PRIVFAIL");
            return;
        }
        await availableAPIs.closeability(false);
        container.hidden = true;
        extraActivities.innerText = await availableAPIs.lookupLocale("SETTING_FSCK_FLAG");
        try {
            await availableAPIs.fs_write({
                path: (await availableAPIs.getSystemMount()) + "/.fsck",
                data: "recover"
            });
        } catch {
            extraActivities.innerText = await availableAPIs.lookupLocale("SETTING_FSCK_FLAG_FAILED");
            container.hidden = false;
            return;
        }
        extraActivities.innerText = await availableAPIs.lookupLocale("RESTARTING");
        await availableAPIs.shutdown({
            isReboot: true
        });
    });
    fsckDiscardButton.addEventListener("click", async function() {
        let checklist = [ "SYSTEM_SHUTDOWN", "FS_WRITE" ];
        if (!checklist.every(p => privileges.includes(p))) {
            extraActivities.innerText = await availableAPIs.lookupLocale("SYSADMIN_TOOLS_PRIVFAIL");
            return;
        }
        await availableAPIs.closeability(false);
        container.hidden = true;
        extraActivities.innerText = await availableAPIs.lookupLocale("SETTING_FSCK_FLAG");
        try {
            await availableAPIs.fs_write({
                path: (await availableAPIs.getSystemMount()) + "/.fsck",
                data: "discard"
            });
        } catch {
            extraActivities.innerText = await availableAPIs.lookupLocale("SETTING_FSCK_FLAG_FAILED");
            container.hidden = false;
            return;
        }
        extraActivities.innerText = await availableAPIs.lookupLocale("RESTARTING");
        await availableAPIs.shutdown({
            isReboot: true
        });
    });
    wipeSystemButton.addEventListener("click", async function() {
        let checklist = [ "RUN_KLVL_CODE" ];
        if (!checklist.every(p => privileges.includes(p))) {
            extraActivities.innerText = await availableAPIs.lookupLocale("SYSADMIN_TOOLS_PRIVFAIL");
            return;
        }
        container.hidden = true;
        await availableAPIs.closeability(false);
        extraActivities.innerText = await availableAPIs.lookupLocale("WIPING_SYSTEM");
        try {
            await availableAPIs.runKlvlCode(`(async function() {
let idb_keys = modules.core.idb._db.transaction("disk").objectStore("disk").getAllKeys();
idb_keys = await new Promise(function(resolve) {
    idb_keys.onsuccess = () => resolve(idb_keys.result);
});
for (let key of idb_keys) {
    let partLen = (await modules.core.idb.readPart(key)).length;
    let randomness = "";
    while (randomness.length < partLen) {
        let remainingBytes = Math.round((partLen - randomness.length) / 2);
        if (remainingBytes > 65536) remainingBytes = 65536;
        randomness += crypto.getRandomValues(new Uint8Array(remainingBytes)).reduce((a, b) => a + b.toString(16).padStart(2, "0"), "");
    }
    await modules.core.idb.writePart(key, randomness);
    await modules.core.idb.sync();
    await modules.core.idb.removePart(key);
    await modules.core.idb.sync();
}
modules.restart();
})();`);
        } catch (e) {
            await availableAPIs.closeability(true);
            console.error(e);
            extraActivities.innerText = await availableAPIs.lookupLocale("WIPING_SYSTEM_FAILED");
            container.hidden = false;
            return;
        }
    });
    updateSystemButton.addEventListener("click", async function() {
        let checklist = [ "FETCH_SEND", "FS_WRITE", "RUN_KLVL_CODE", "IPC_CREATE_PIPE", "IPC_LISTEN_PIPE"];
        if (!checklist.every(p => privileges.includes(p))) {
            extraActivities.innerText = await availableAPIs.lookupLocale("SYSADMIN_TOOLS_PRIVFAIL");
            return;
        }
        await availableAPIs.closeability(false);
        container.hidden = true;
        extraActivities.innerText = await availableAPIs.lookupLocale("REINSTALL_DOWNLOADING");
        let osArchive;
        try {
            osArchive = await availableAPIs.fetchSend({
                url: "/os.js",
                init: {}
            });
        } catch (e) {
            await availableAPIs.closeability(true);
            console.error(e);
            extraActivities.innerText = await availableAPIs.lookupLocale("REINSTALL_DOWNLOAD_FAILED");
            container.hidden = false;
            return;
        }
        extraActivities.innerText = await availableAPIs.lookupLocale("REINSTALL_DECODING");
        osArchive = osArchive.arrayBuffer;
        osArchive = new TextDecoder().decode(osArchive);
        let files = osArchive.split(/\/\/ [0-9]+-.+.js\n/g).slice(1);
        let names = osArchive.match(/\/\/ [0-9]+-.+.js/g);
        let wallpaperIndex = names.indexOf("// 1" + "6" + "-wall" + "paper.js");
        let sfxIndex = names.indexOf("// 1" + "6" + "-sf" + "xpack.js");
        let appIndex = names.indexOf("// " + "1" + "5-ap" + "ps.js");
        let apps = files[appIndex].match(/async function (.+)Installer\(target, token\)/g).map(a => a.split(" ")[2].split("(")[0]);
        let otherInstalls = osArchive.match(/async function install(.{3,})\(target, token\)/g).map(a => a.split(" ")[2].split("(")[0]);
        let ipcPipe = await availableAPIs.createPipe();
        let pipeResult = availableAPIs.listenToPipe(ipcPipe);
        let installerCode = "";
        for (let app of apps) installerCode += `await ${app}(modules.defaultSystem, ${JSON.stringify(await availableAPIs.getProcessToken())});\n`;
        for (let install of otherInstalls) installerCode += `await ${install}(modules.defaultSystem, ${JSON.stringify(await availableAPIs.getProcessToken())});\n`;
        await availableAPIs.runKlvlCode(`(async function() {
            try {
                ${files[appIndex]}
                ${files[wallpaperIndex]}
                ${files[sfxIndex]}
                ${installerCode}
                modules.ipc.send(${JSON.stringify(ipcPipe)}, true);
            } catch (e) {
                console.error(e);
                modules.ipc.send(${JSON.stringify(ipcPipe)}, false);
            }
        })();`);
        pipeResult = await pipeResult;
        await availableAPIs.closePipe(ipcPipe);
        if (!pipeResult) {
            extraActivities.innerText = await availableAPIs.lookupLocale("UPDATE_EXTRA_FAIL");
            container.hidden = false;
            return;
        }
        files.splice(appIndex, 1);
        names.splice(appIndex, 1);
        let installerIndex = names.indexOf("// 1" + "0" + "-ins" + "taller.js");
        files.splice(installerIndex, 1);
        names.splice(installerIndex, 1);
        let secondStageIndex = names.indexOf("// 1" + "7" + "-instal" + "ler-seconds" + "tage.js");
        files.splice(secondStageIndex, 1);
        names.splice(secondStageIndex, 1);
        wallpaperIndex = names.indexOf("// 1" + "6" + "-wall" + "paper.js");
        files.splice(wallpaperIndex, 1);
        names.splice(wallpaperIndex, 1);
        sfxIndex = names.indexOf("// 1" + "6" + "-sf" + "xpack.js");
        files.splice(sfxIndex, 1);
        names.splice(sfxIndex, 1);
        for (let file in files) {
            let name = names[file].split(" ").slice(1).join(" ");
            let content = files[file];
            try {
                await availableAPIs.fs_write({
                    path: (await availableAPIs.getSystemMount()) + "/boot/" + name,
                    data: content
                });
            } catch {
                await availableAPIs.closeability(true);
                extraActivities.innerText = await availableAPIs.lookupLocale("UPDATE_BOOT_FAIL");
                container.hidden = false;
                return;
            }
        }
        extraActivities.innerText = await availableAPIs.lookupLocale("RESTARTING");
        await availableAPIs.shutdown({
            isReboot: true
        });
    });
    optionalComponentMgmt.addEventListener("click", async function() {
        let checklist = [ "FS_READ", "FS_WRITE", "FS_LIST_PARTITIONS", "FETCH_SEND", "RUN_KLVL_CODE", "IPC_CREATE_PIPE", "IPC_LISTEN_PIPE" ];
        if (!checklist.every(p => privileges.includes(p))) {
            extraActivities.innerText = await availableAPIs.lookupLocale("SYSADMIN_TOOLS_PRIVFAIL");
            return;
        }
        await availableAPIs.windowTitleSet(await availableAPIs.lookupLocale("OPTIONAL_COMPONENTS_TITLE"));
        extraActivities.innerText = "";
        let cmponents = {};
        let rawComponentFile;
        try {
            rawComponentFile = await availableAPIs.fs_read({
                path: (await availableAPIs.getSystemMount()) + "/boot/15-optional.js"
            });
        } catch {
            try {
                container.innerText = await availableAPIs.lookupLocale("NO_COMPONENTS_FILE");
                rawComponentFile = await availableAPIs.fetchSend({
                    url: "/os.js",
                    init: {}
                });
                rawComponentFile = rawComponentFile.arrayBuffer;
                rawComponentFile = new TextDecoder().decode(rawComponentFile);
                rawComponentFile = rawComponentFile.split("\n");
                let startIndex = rawComponentFile.indexOf("// =====BEGIN ALL OPTIONAL COMPONENTS=====");
                let endIndex = rawComponentFile.indexOf("// =====END ALL OPTIONAL COMPONENTS=====");
                rawComponentFile = rawComponentFile.slice(startIndex + 1, endIndex);
                rawComponentFile = rawComponentFile.join("\n");
                await availableAPIs.fs_write({
                    path: (await availableAPIs.getSystemMount()) + "/boot/15-optional.js",
                    data: rawComponentFile
                });
            } catch {
                container.innerText = await availableAPIs.lookupLocale("FAILED_COMPONENTS_DOWNLOAD");
            }
        }
        async function reparse() {
            await availableAPIs.closeability(false);
            cmponents = {};
            container.innerText = await availableAPIs.lookupLocale("PARSING_COMPONENTS");
            rawComponentFile = rawComponentFile.split("\n");
            let componentComputerNames = rawComponentFile.filter(a => a.startsWith("// =====BEGIN ") && a.endsWith(" COMPONENT METADATA=====")).map(a => a.replace("// =====BEGIN ", "").replace(" COMPONENT METADATA=====", ""));
            for (let compName of componentComputerNames) {
                let metadataLineIndex = rawComponentFile.indexOf("// =====BEGIN " + compName + " COMPONENT METADATA=====");
                let metadataLineEndIndex = rawComponentFile.indexOf("// =====END " + compName + " COMPONENT METADATA=====");
                let installerLineIndex = rawComponentFile.indexOf("// =====BEGIN " + compName + " COMPONENT INSTALLER=====");
                let installerLineEndIndex = rawComponentFile.indexOf("// =====END " + compName + " COMPONENT INSTALLER=====");
                let removerLineIndex = rawComponentFile.indexOf("// =====BEGIN " + compName + " COMPONENT REMOVER=====");
                let removerLineEndIndex = rawComponentFile.indexOf("// =====END " + compName + " COMPONENT REMOVER=====");
                let checkersLineIndex = rawComponentFile.indexOf("// =====BEGIN " + compName + " COMPONENT CHECKER=====");
                let checkersLineEndIndex = rawComponentFile.indexOf("// =====END " + compName + " COMPONENT CHECKER=====");
                let metadata = rawComponentFile.slice(metadataLineIndex + 1, metadataLineEndIndex);
                let metadataParsed = {};
                for (let line of metadata) {
                    let lineSplit = line.replace("// ", "").split(": ");
                    metadataParsed[lineSplit[0]] = lineSplit[1];
                }
                let ipcPipe = await availableAPIs.createPipe();
                let isInstalled = availableAPIs.listenToPipe(ipcPipe);
                await availableAPIs.runKlvlCode(`(async function() {
                    ${rawComponentFile.slice(checkersLineIndex, checkersLineEndIndex).join("\n")}
                    modules.ipc.send(${JSON.stringify(ipcPipe)}, await checker(${JSON.stringify(await availableAPIs.getSystemMount())}, ${JSON.stringify(await availableAPIs.getProcessToken())}));
                })();`);
                isInstalled = await isInstalled;
                await availableAPIs.closePipe(ipcPipe);
                cmponents[compName] = {
                    metadata: metadataParsed,
                    installer: rawComponentFile.slice(installerLineIndex + 1, installerLineEndIndex).join("\n"),
                    remover: rawComponentFile.slice(removerLineIndex + 1, removerLineEndIndex).join("\n"),
                    isInstalled: isInstalled
                };
            }
            rawComponentFile = rawComponentFile.join("\n");
            await availableAPIs.closeability(true);
        }
        async function showFullList() {
            container.innerText = "";
            for (let component in cmponents) {
                let componentBtn = document.createElement("button");
                componentBtn.innerText = await availableAPIs.lookupLocale(cmponents[component].metadata.localeReferenceName) || cmponents[component].metadata["localeName_" + (await availableAPIs.locale())] || cmponents[component].metadata.humanName;
                componentBtn.addEventListener("click", async function() {
                    container.innerText = "";
                    let backButton = document.createElement("button");
                    let header = document.createElement("b");
                    let computerName = document.createElement("span");
                    let computerNameTitle = document.createElement("b");
                    let description = document.createElement("span");
                    let license = document.createElement("span");
                    let actionButton = document.createElement("button");
                    backButton.innerText = await availableAPIs.lookupLocale("EXIT");
                    header.innerText = await availableAPIs.lookupLocale(cmponents[component].metadata.localeReferenceName) || cmponents[component].metadata["localeName_" + (await availableAPIs.locale())] || cmponents[component].metadata.humanName;
                    computerNameTitle.innerText = "ID: ";
                    computerName.innerText = component;
                    description.innerText = (await availableAPIs.lookupLocale("DESCRIPTION_FIELD")).replace("%s", await availableAPIs.lookupLocale(cmponents[component].metadata.localeReferenceDescription) || cmponents[component].metadata["localeDescription_" + (await availableAPIs.locale())] || cmponents[component].metadata.description);
                    license.innerText = (await availableAPIs.lookupLocale("LICENSE_FIELD")).replace("%s", cmponents[component].metadata.license);
                    container.appendChild(backButton);
                    container.appendChild(header);
                    container.appendChild(document.createElement("hr"));
                    container.appendChild(computerNameTitle);
                    container.appendChild(computerName);
                    container.appendChild(document.createElement("br"));
                    container.appendChild(description);
                    container.appendChild(document.createElement("br"));
                    container.appendChild(license);
                    container.appendChild(document.createElement("hr"));
                    container.appendChild(actionButton);
                    backButton.addEventListener("click", async function() {
                        await showFullList();
                    });
                    actionButton.innerText = cmponents[component].isInstalled ? (await availableAPIs.lookupLocale("REMOVE_BTN")) : (await availableAPIs.lookupLocale("INSTALL_BUTTON"));
                    actionButton.addEventListener("click", async function() {
                        await availableAPIs.closeability(false);
                        let executedFnName = cmponents[component].isInstalled ? "remover" : "installer";
                        let ipcPipe = await availableAPIs.createPipe();
                        container.hidden = true;
                        extraActivities.innerText = await availableAPIs.lookupLocale("MODIFYING_STATUS");
                        let result = availableAPIs.listenToPipe(ipcPipe);
                        await availableAPIs.runKlvlCode(`(async function() {
                            ${cmponents[component][executedFnName]}
                            try {
                                await ${executedFnName}(${JSON.stringify(await availableAPIs.getSystemMount())}, ${JSON.stringify(await availableAPIs.getProcessToken())});
                                modules.ipc.send(${JSON.stringify(ipcPipe)}, true);
                            } catch (e) {
                                console.error(e);
                                modules.ipc.send(${JSON.stringify(ipcPipe)}, false);
                            }
                        })();`);
                        result = await result;
                        extraActivities.innerText = result ? (await availableAPIs.lookupLocale("MODIFYING_SUCCESS")) : (await availableAPIs.lookupLocale("MODIFYING_FAILED"));
                        await availableAPIs.closePipe(ipcPipe);
                        container.hidden = false;
                        await availableAPIs.closeability(true);
                        if (result) {
                            await reparse();
                            await showFullList();
                        }
                    });
                });
                container.appendChild(componentBtn);
            }
        }
        await reparse();
        await showFullList();
    });
    container.appendChild(fsckOrderButton);
    container.appendChild(fsckDiscardButton);
    container.appendChild(osReinstallButton);
    container.appendChild(wipeSystemButton);
    container.appendChild(updateSystemButton);
    container.appendChild(optionalComponentMgmt);
    document.body.appendChild(container);
    document.body.appendChild(extraActivities);
})();
addEventListener("signal", async function(e) {
    if (e.detail == 15) await window.availableAPIs.terminate();
}); null;