// =====BEGIN MANIFEST=====
// signer: automaticSigner
// allow: GET_LOCALE, GET_THEME, GET_BUILD, RUN_KLVL_CODE, LLDISK_WRITE, LLDISK_READ, FS_READ, FS_WRITE, FS_BYPASS_PERMISSIONS, FS_REMOVE, FS_LIST_PARTITIONS, SYSTEM_SHUTDOWN, FS_CHANGE_PERMISSION, LLDISK_LIST_PARTITIONS, FS_MOUNT, CSP_OPERATIONS
// =====END MANIFEST=====
let onClose = () => availableAPIs.terminate();
(async function() {
    // @pcos-app-mode isolatable
    document.body.style.fontFamily = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
    if (await availableAPIs.isDarkThemed()) document.body.style.color = "white";
    await availableAPIs.windowTitleSet(await availableAPIs.lookupLocale("INSTALL_PCOS"));
    onClose = async function() {
        mainInstallerContent.hidden = true;
        closeContent.hidden = false;
        await availableAPIs.closeability(false);
    }
    let mainInstallerContent = document.createElement("div");
    let closeContent = document.createElement("div");
    let header = document.createElement("b");
    let postHeader = document.createElement("br");
    let description = document.createElement("span");
    let content = document.createElement("div");
    let button = document.createElement("button");
    let liveButton = document.createElement("button");
    let confirmDescription = document.createElement("p");
    let buttonYes = document.createElement("button");
    let buttonNo = document.createElement("button");

    closeContent.hidden = true;

    mainInstallerContent.style = "position: absolute; top: 0; left: 0; width: 100%; height: 100%; padding: 8px; box-sizing: border-box;";
    closeContent.style = "position: absolute; top: 0; left: 0; width: 100%; height: 100%; padding: 8px; box-sizing: border-box;";

    confirmDescription.innerText = await availableAPIs.lookupLocale("CLOSE_INSTALLER_CONFIRMATION");
    buttonYes.innerText = await availableAPIs.lookupLocale("YES");
    buttonNo.innerText = await availableAPIs.lookupLocale("NO");
    header.innerText = await availableAPIs.lookupLocale("INSTALLER_TITLE");
    description.innerText = (await availableAPIs.lookupLocale("INSTALLER_INVITATION")).replace("%s", await availableAPIs.getVersion());
    button.innerText = await availableAPIs.lookupLocale("INSTALL_BUTTON");
    liveButton.innerText = await availableAPIs.lookupLocale("LIVE_BUTTON");

    mainInstallerContent.appendChild(header);
    mainInstallerContent.appendChild(postHeader);
    mainInstallerContent.appendChild(description);
    mainInstallerContent.appendChild(content);
    mainInstallerContent.appendChild(button);
    mainInstallerContent.appendChild(document.createElement("br"));
    mainInstallerContent.appendChild(liveButton);

    closeContent.appendChild(confirmDescription);
    closeContent.appendChild(buttonYes);
    closeContent.insertAdjacentText("beforeend", " ");
    closeContent.appendChild(buttonNo);

    document.body.appendChild(mainInstallerContent);
    document.body.appendChild(closeContent);

    buttonNo.onclick = async function() {
        mainInstallerContent.hidden = false;
        closeContent.hidden = true;
        await availableAPIs.closeability(true);
    }
    buttonYes.onclick = function() {
        onClose = () => availableAPIs.terminate();
        availableAPIs.shutdown({
            isReboot: true
        });
    }

    button.onclick = async function() {
        header.remove();
        postHeader.remove();
        liveButton.remove();
        content.innerHTML = "";
        description.innerText = await availableAPIs.lookupLocale("RIGHT_REVIEW");
        let textareaLicense = document.createElement("textarea");
        textareaLicense.readOnly = true;
        textareaLicense.style.width = "100%";
        textareaLicense.style.height = "100%";
        content.style.height = "100%";
        textareaLicense.value = `Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
---
Used libraries:
    xterm.js:
        Copyright (c) 2017-2022, The xterm.js authors (https://github.com/xtermjs/xterm.js/graphs/contributors) (MIT License)
        Copyright (c) 2014-2017, SourceLair, Private Company (www.sourcelair.com) (MIT License)
        Copyright (c) 2012-2013, Christopher Jeffrey (MIT License)`;
        content.appendChild(textareaLicense);
        button.innerText = await availableAPIs.lookupLocale("RIGHT_REVIEW_BTN");
        button.onclick = async function() {
            content.innerHTML = "";
            content.style.height = "";
            description.innerText = await availableAPIs.lookupLocale("INSTALLER_PARTITIONING");
            button.innerText = await availableAPIs.lookupLocale("PARTITIONING_USE");
            let partitionDataInput = document.createElement("input");
            let partitionDataFormat = document.createElement("button");
            let partitionBootInput = document.createElement("input");
            partitionDataInput.placeholder = await availableAPIs.lookupLocale("PARTITION_DATA");
            partitionDataFormat.innerText = await availableAPIs.lookupLocale("FORMAT_DATA");
            partitionBootInput.placeholder = await availableAPIs.lookupLocale("PARTITION_BOOT");
            partitionDataInput.value = "data";
            partitionBootInput.value = "boot";
            content.appendChild(partitionDataInput);
            content.insertAdjacentText("beforeend", " ");
            content.appendChild(partitionDataFormat);
            content.appendChild(document.createElement("br"));
            content.appendChild(partitionBootInput);
            partitionDataFormat.onclick = async function() {
                if (!partitionDataInput.value) return await htmlAlert(await availableAPIs.lookupLocale("DATA_INPUT_ALERT"));
                try {
                    await availableAPIs.lldaList();
                } catch {
                    if (!(await htmlConfirm(await availableAPIs.lookupLocale("PROMPT_PARTITION_TABLE")))) return;
                    await availableAPIs.runKlvlCode(`modules.core.disk.insertPartitionTable();`);
                }
                let confirmErasePart = await htmlConfirm(await availableAPIs.lookupLocale("CONFIRM_PARTITION_ERASE"));
                if (confirmErasePart) {
                    let partData = await availableAPIs.lldaRead({ partition: partitionDataInput.value });
                    let partId;
                    try {
                        partId = partData.id;
                    } catch {}
                    if (!partId) partId = (await availableAPIs.cspOperation({
                        cspProvider: "basic",
                        operation: "random",
                        cspArgument: new Uint8Array(64)
                    })).reduce((a, b) => a + b.toString(16).padStart(2, "0"), "")
                    await availableAPIs.lldaWrite({
                        partition: partitionDataInput.value,
                        data: {
                            files: {},
                            permissions: {},
                            id: partId
                        }
                    });
                }
                return;
            }
            button.onclick = async function() {
                let diskDataPartition = partitionDataInput.value;
                let diskBootPartition = partitionBootInput.value;
                if (!diskDataPartition) return await htmlAlert(await availableAPIs.lookupLocale("DATA_INPUT_ALERT"));
                if (!diskBootPartition) return await htmlAlert(await availableAPIs.lookupLocale("BOOT_INPUT_ALERT"));
                try {
                    if (!(await availableAPIs.lldaList()).includes(diskDataPartition)) throw new Error();
                } catch {
                    return await htmlAlert(await availableAPIs.lookupLocale("CANNOT_FIND_PARTITION"));
                }

                let tempCopy = Object.keys((await availableAPIs.lldaRead({ partition: diskDataPartition })) || {});
                if (!tempCopy.includes("files") || !tempCopy.includes("permissions"))
                    if (!(await htmlConfirm(await availableAPIs.lookupLocale("PCFS_DETECTION_ERROR")))) return;

                tempCopy = null;
                content.innerHTML = "";
                button.hidden = true;
                description.innerHTML = (await availableAPIs.lookupLocale("INSTALLING_PCOS")).replace("%s", await availableAPIs.lookupLocale("PLEASE_WAIT"));
                await availableAPIs.closeability(false);
                description.innerHTML = (await availableAPIs.lookupLocale("INSTALLING_PCOS")).replace("%s", await availableAPIs.lookupLocale("CREATING_BOOT_PARTITION"));
                await availableAPIs.lldaWrite({
                    partition: diskBootPartition,
                    data: `
                try {
                    const AsyncFunction = (async () => {}).constructor;
                    let pre_boot_part = coreExports.disk.partition(${JSON.stringify(diskDataPartition)}).getData();
                    let pre_boot_modules = pre_boot_part?.files;
                    if (!pre_boot_modules) {
                        coreExports.tty_bios_api.println("No files were found in the storage partition");
                        throw new Error("No files were found in the storage partition");
                    }
                    pre_boot_modules = pre_boot_modules[coreExports.bootSection || "boot"];
                    if (!pre_boot_modules) {
                        coreExports.tty_bios_api.println("No boot modules were found");
                        throw new Error("No boot modules were found");
                    }
                    let pre_boot_module_list = Object.keys(pre_boot_modules);
                    pre_boot_module_list = pre_boot_module_list.sort((a, b) => a.localeCompare(b));
                    let pre_boot_module_script = "";
                    for (let module of pre_boot_module_list) pre_boot_module_script += await coreExports.idb.readPart(pre_boot_part.id + "-" + pre_boot_modules[module]);
                    await new AsyncFunction(pre_boot_module_script)();
                } catch (e) {
                    coreExports.tty_bios_api.println("Boot failed");
                    coreExports.tty_bios_api.println("Press Enter to continue and log this error locally");
                    await coreExports.tty_bios_api.inputLine();
                    throw e;
                }
                `});
                try {
                    description.innerHTML = (await availableAPIs.lookupLocale("INSTALLING_PCOS")).replace("%s", await availableAPIs.lookupLocale("MOUNTING_DATA_PARTITION"));
                    await availableAPIs.fs_mount({
                        mountpoint: "target",
                        filesystem: "PCFSiDBMount",
                        filesystemOptions: {
                            partition: diskDataPartition
                        }
                    });
                    description.innerHTML = (await availableAPIs.lookupLocale("INSTALLING_PCOS")).replace("%s", await availableAPIs.lookupLocale("CHANGING_ROOT_PERMISSIONS"));
                    await availableAPIs.fs_chown({ path: "target", newUser: "root" });
                    await availableAPIs.fs_chgrp({ path: "target", newGrp: "root" });
                    await availableAPIs.fs_chmod({ path: "target", newPermissions: "rx" });
                    description.innerHTML = (await availableAPIs.lookupLocale("INSTALLING_PCOS")).replace("%s", await availableAPIs.lookupLocale("COPYING_FOLDERS"));
                    try {
                        await recursiveRemove("target/boot");
                    } catch {}
                    try {
                        await availableAPIs.fs_mkdir({ path: "target/boot" });
                    } catch {}
                    await recursiveCopy((await availableAPIs.getSystemMount()) + "/boot", "target/boot", true);
                    description.innerHTML = (await availableAPIs.lookupLocale("INSTALLING_PCOS")).replace("%s", await availableAPIs.lookupLocale("CHANGING_BOOT_PERMISSIONS"));
                    content.innerHTML = "";
                    description.innerHTML = (await availableAPIs.lookupLocale("INSTALLING_PCOS")).replace("%s", await availableAPIs.lookupLocale("PATCHING_FS"));
                    let systemCode = "let localSystemMount = \"storage\";\nlet mountOptions = {\n\tpartition: " + JSON.stringify(diskDataPartition) + "\n};\ntry {\n\tmodules.fs.mounts[localSystemMount] = await modules.mounts.PCFSiDBMount(mountOptions);\n\tmodules.defaultSystem = localSystemMount;\n} catch (e) {\n\tawait panic(\"SYSTEM_PARTITION_MOUNTING_FAILED\", { underlyingJS: e, name: \"fs.mounts\", params: [localSystemMount, mountOptions]});\n}\n";
                    await availableAPIs.fs_write({ path: "target/boot/01-fsboot.js", data: systemCode });
                    description.innerHTML = await availableAPIs.lookupLocale("INSTALLATION_SUCCESSFUL");
                    await availableAPIs.closeability(true);
                    onClose = function() {
                        onClose = () => availableAPIs.terminate();
                        availableAPIs.shutdown({
                            isReboot: true
                        });
                    }
                } catch (e) {
                    console.error(e);
                    description.innerHTML = await availableAPIs.lookupLocale("INSTALLATION_FAILED");
                    await availableAPIs.closeability(true);
                    onClose = function() {
                        onClose = () => availableAPIs.terminate();
                        availableAPIs.shutdown({
                            isReboot: true
                        });
                    }
                    throw e;
                }
            }
        }
    }
    liveButton.onclick = async function() {
        header.remove();
        postHeader.remove();
        liveButton.remove();
        content.innerHTML = "";
        description.innerText = await availableAPIs.lookupLocale("RIGHT_REVIEW");
        let textareaLicense = document.createElement("textarea");
        textareaLicense.readOnly = true;
        textareaLicense.style.width = "100%";
        textareaLicense.style.height = "100%";
        content.style.height = "100%";
        textareaLicense.value = `Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
---
Used libraries:
    xterm.js:
        Copyright (c) 2017-2022, The xterm.js authors (https://github.com/xtermjs/xterm.js/graphs/contributors) (MIT License)
        Copyright (c) 2014-2017, SourceLair, Private Company (www.sourcelair.com) (MIT License)
        Copyright (c) 2012-2013, Christopher Jeffrey (MIT License)`;
        content.appendChild(textareaLicense);
        button.innerText = await availableAPIs.lookupLocale("RIGHT_REVIEW_BTN");
        button.onclick = async function() {
            content.innerHTML = "";
            content.style.height = "";
            await availableAPIs.runKlvlCode(`(async function() {
                let wallpapers = await modules.fs.read(modules.defaultSystem + "/boot/16-wallpaper.js");
                let sfx = await modules.fs.read(modules.defaultSystem + "/boot/16-sfxpack.js");
                let appScripts = await modules.fs.read(modules.defaultSystem + "/boot/15-apps.js");
                let apps = appScripts.match(/async function (.+)Installer\\(target, token\\)/g).map(a => a.split(" ")[2].split("(")[0]);
                let fireAfterInstall = null;
                let firesAfterInstall = new Promise(r => fireAfterInstall = r);
                let installerCode = "(async function() {\\n" + appScripts + "\\n" + sfx + "\\n" + wallpapers + "\\n";
                installerCode += "await installSfx(modules.defaultSystem);\\nawait installWallpapers(modules.defaultSystem);\\n";
                for (let app of apps) installerCode += \`await \${app}(modules.defaultSystem);\\n\`;
                installerCode += "fireAfterInstall(); })();";
                eval(installerCode);
                await firesAfterInstall;
                await modules.fs.write(modules.defaultSystem + "/etc/darkLockScreen", "false");
                await modules.fs.write(modules.defaultSystem + "/etc/wallpapers/lockscreen.pic", await modules.fs.read(modules.defaultSystem + "/etc/wallpapers/pcos-lock-beta.pic"));
                await modules.fs.write(modules.defaultSystem + "/root/.wallpaper", await modules.fs.read(modules.defaultSystem + "/etc/wallpapers/pcos-beta.pic"));
                await modules.fs.write(modules.defaultSystem + "/root/.darkmode", "false");
                await requireLogon();
            })(); null;`);
            await availableAPIs.terminate();
        }
    }
})();

async function htmlAlert(msg) {
    let overlay = document.createElement("div");
    let overlayingMessage = document.createElement("div");
    let description = document.createElement("span");
    let buttonAccept = document.createElement("button");
    overlay.style = "position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: black; opacity: 85%;";
    overlayingMessage.style = "position: absolute; top: 0px; left: 0px; width: 100%; height: 100%; padding: 8px; box-sizing: border-box; color: white;";
    description.innerText = msg;
    buttonAccept.innerText = "Ok";
    overlayingMessage.appendChild(description);
    overlayingMessage.appendChild(document.createElement("hr"));
    overlayingMessage.appendChild(buttonAccept);
    document.body.appendChild(overlay);
    document.body.appendChild(overlayingMessage);
    return new Promise(function(resolve) {
        buttonAccept.onclick = function() {
            overlay.remove();
            overlayingMessage.remove();
            resolve();
        }
    });
}

async function htmlConfirm(msg) {
    let overlay = document.createElement("div");
    let overlayingMessage = document.createElement("div");
    let description = document.createElement("span");
    let buttonAccept = document.createElement("button");
    let buttonDecline = document.createElement("button");
    overlay.style = "position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: black; opacity: 85%;";
    overlayingMessage.style = "position: absolute; top: 0px; left: 0px; width: 100%; height: 100%; padding: 8px; box-sizing: border-box; color: white;";
    description.innerText = msg;
    buttonAccept.innerText = await availableAPIs.lookupLocale("YES");
    buttonDecline.innerText = await availableAPIs.lookupLocale("NO");
    overlayingMessage.appendChild(description);
    overlayingMessage.appendChild(document.createElement("hr"));
    overlayingMessage.appendChild(buttonAccept);
    overlayingMessage.appendChild(buttonDecline);
    document.body.appendChild(overlay);
    document.body.appendChild(overlayingMessage);
    return new Promise(function(resolve) {
        buttonAccept.onclick = function() {
            overlay.remove();
            overlayingMessage.remove();
            resolve(true);
        }
        buttonDecline.onclick = function() {
            overlay.remove();
            overlayingMessage.remove();
            resolve(false);
        }
    });
}

async function recursiveCopy(source, destination, permissions) {
    for (let sourceFile of await availableAPIs.fs_ls({ path: source })) {
        let destinationFile = destination + "/" + sourceFile;
        if (await availableAPIs.fs_isDirectory({ path: source + "/" + sourceFile })) {
            try {
                await availableAPIs.fs_mkdir({ path: destinationFile });
            } catch {}
            await recursiveCopy(source + "/" + sourceFile, destinationFile, permissions);
        } else {
            await availableAPIs.fs_write({
                path: destinationFile,
                data: await availableAPIs.fs_read({ path: source + "/" + sourceFile })
            });
        }
        if (permissions) {
            let originalPermissions = await availableAPIs.fs_permissions({ path: source + "/" + sourceFile });
            await availableAPIs.fs_chmod({ path: destinationFile, newPermissions: originalPermissions.world });
            await availableAPIs.fs_chgrp({ path: destinationFile, newGrp: originalPermissions.group });
            await availableAPIs.fs_chown({ path: destinationFile, newUser: originalPermissions.owner });
        }
    }
}

async function recursiveRemove(target) {
    for (let targetFile of await availableAPIs.fs_ls({ path: target })) {
        targetFile = target + "/" + targetFile;
        if (await availableAPIs.fs_isDirectory({ path: targetFile })) await recursiveRemove(targetFile);
        await availableAPIs.fs_rm({ path: targetFile });
    }
}

addEventListener("signal", async function(e) {
    if (e.detail == 15) onClose();
}); 