function installer() {
    // @pcos-app-mode native
    let window = modules.window;
    let windowDiv = window(modules.session.active);
    windowDiv.title.innerText = modules.locales.get("INSTALL_PCOS");
    windowDiv.closeButton.onclick = function() {
        windowDiv.windowDiv.classList.toggle("hidden", true);
        let windowDivConfirm = window(modules.session.active);
        windowDivConfirm.closeButton.onclick = function() {
            windowDivConfirm.windowDiv.remove();
            windowDiv.windowDiv.classList.toggle("hidden", false);
        };
        windowDivConfirm.title.innerText = modules.locales.get("CONFIRM");
        windowDivConfirm.content.style.padding = "8px";
        let description = document.createElement("p");
        let buttonYes = document.createElement("button");
        let buttonNo = document.createElement("button");
        description.innerText = modules.locales.get("CLOSE_INSTALLER_CONFIRMATION");
        buttonYes.innerText = modules.locales.get("YES");
        buttonNo.innerText = modules.locales.get("NO");
        buttonNo.onclick = () => windowDivConfirm.closeButton.click();
        buttonYes.onclick = function() {
            windowDivConfirm.windowDiv.remove();
            windowDiv.windowDiv.remove();
            modules.restart();
        }
        windowDivConfirm.content.appendChild(description);
        windowDivConfirm.content.appendChild(buttonYes);
        windowDivConfirm.content.insertAdjacentText("beforeend", " ");
        windowDivConfirm.content.appendChild(buttonNo);
    }
    windowDiv.content.style.padding = "8px";
    let header = document.createElement("b");
    let postHeader = document.createElement("br");
    let description = document.createElement("span");
    let content = document.createElement("div");
    let recovery_btn = document.createElement("button");
    let button = document.createElement("button");
    header.innerText = modules.locales.get("INSTALLER_TITLE");
    description.innerText = modules.locales.get("INSTALLER_INVITATION").replace("%s", pcos_version);
    button.innerText = modules.locales.get("INSTALL_BUTTON");
    recovery_btn.innerText = modules.locales.get("CLI_BUTTON");
    content.appendChild(recovery_btn);
    windowDiv.content.appendChild(header);
    windowDiv.content.appendChild(postHeader);
    windowDiv.content.appendChild(description);
    windowDiv.content.appendChild(content);
    windowDiv.content.appendChild(button);
    recovery_btn.onclick = async function() {
        windowDiv.windowDiv.classList.toggle("hidden", true);
        let windowtty = await js_terminal();
        windowtty.closeButton.addEventListener("click", () => {
            windowDiv.windowDiv.classList.toggle("hidden", false);
        })
    }
    button.onclick = function() {
        header.remove();
        postHeader.remove();
        content.innerHTML = "";
        if (!isSecureContext) {
            description.innerText = modules.locales.get("SECURE_CONTEXT_REQUIRED");
            button.innerText = modules.locales.get("SWITCH_TO_SECURE_CTX");
            button.onclick = function() {
                button.remove();
                windowDiv.windowDiv.remove();
                location.protocol = "https:";
            };
            return;
        }
        description.innerText = modules.locales.get("RIGHT_REVIEW");
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
        button.innerText = modules.locales.get("RIGHT_REVIEW_BTN");
        button.onclick = function() {
            content.innerHTML = "";
            content.style.height = "";
            description.innerText = modules.locales.get("INSTALLER_PARTITIONING");
            button.innerText = modules.locales.get("PARTITIONING_USE");
            let partitionDataInput = document.createElement("input");
            let partitionDataFormat = document.createElement("button");
            let partitionBootInput = document.createElement("input");
            partitionDataInput.placeholder = modules.locales.get("PARTITION_DATA");
            partitionDataFormat.innerText = modules.locales.get("FORMAT_DATA");
            partitionBootInput.placeholder = modules.locales.get("PARTITION_BOOT");
            partitionDataInput.value = "data";
            partitionBootInput.value = "boot";
            content.appendChild(partitionDataInput);
            content.insertAdjacentText("beforeend", " ");
            content.appendChild(partitionDataFormat);
            content.appendChild(document.createElement("br"));
            content.appendChild(partitionBootInput);
            partitionDataFormat.onclick = function() {
                if (!partitionDataInput.value) return alert(modules.locales.get("DATA_INPUT_ALERT"));
                let diskPart;
                try {
                    diskPart = modules.core.disk.partition(partitionDataInput.value);
                } catch {
                    if (!confirm(modules.locales.get("PROMPT_PARTITION_TABLE"))) return;
                    modules.core.disk.insertPartitionTable();
                    diskPart = modules.core.disk.partition(partitionDataInput.value);
                }
                let confirmErasePart = confirm(modules.locales.get("CONFIRM_PARTITION_ERASE"));
                if (confirmErasePart) {
                    let partId;
                    try {
                        partId = (diskPart.getData()).id;
                    } catch {}
                    if (!partId) partId = crypto.getRandomValues(new Uint8Array(64)).reduce((a, b) => a + b.toString(16).padStart(2, "0"), "");
                    diskPart.setData({
                        files: {},
                        permissions: {},
                        id: partId
                    });
                }
                return;
            }
            button.onclick = async function() {
                let diskDataPartition = partitionDataInput.value;
                let diskBootPartition = partitionBootInput.value;
                if (!diskDataPartition) return alert(modules.locales.get("DATA_INPUT_ALERT"));
                if (!diskBootPartition) return alert(modules.locales.get("BOOT_INPUT_ALERT"));
                let diskDataPartitionReadable;
                try {
                    diskDataPartitionReadable = modules.core.disk.partition(diskDataPartition);
                } catch {
                    return alert(modules.locales.get("CANNOT_FIND_PARTITION"));
                }
                let tempCopy = Object.keys(diskDataPartitionReadable.getData() || {});
                if (!tempCopy.includes("files") || !tempCopy.includes("permissions"))
                    if (!confirm(modules.locales.get("PCFS_DETECTION_ERROR"))) return;
                tempCopy = null;
                diskDataPartitionReadable = null;
                content.innerHTML = "";
                button.hidden = true;
                description.innerHTML = modules.locales.get("INSTALLING_PCOS").replace("%s", modules.locales.get("PLEASE_WAIT"));
                windowDiv.closeButton.disabled = true;
                description.innerHTML = modules.locales.get("INSTALLING_PCOS").replace("%s", modules.locales.get("CREATING_BOOT_PARTITION"));
                modules.core.disk.partition(diskBootPartition).setData(`
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
                `);
                try {
                    description.innerHTML = modules.locales.get("INSTALLING_PCOS").replace("%s", modules.locales.get("MOUNTING_DATA_PARTITION"));
                    modules.fs.mounts["target"] = await modules.mounts.PCFSiDBMount({
                        partition: diskDataPartition
                    });
                    description.innerHTML = modules.locales.get("INSTALLING_PCOS").replace("%s", modules.locales.get("CHANGING_ROOT_PERMISSIONS"));
                    await modules.fs.chown("target", "root");
                    await modules.fs.chgrp("target", "root");
                    await modules.fs.chmod("target", "rx");
                    description.innerHTML = modules.locales.get("INSTALLING_PCOS").replace("%s", modules.locales.get("COPYING_FOLDERS"));
                    let describeProgress = document.createElement("p");
                    describeProgress.innerText = modules.locales.get("PREPARING_FOR_COPY");
                    content.appendChild(describeProgress);
                        await copyBoot("/boot", "target", function(text) {
                            return new Promise(function(resolve) {
                                describeProgress.innerText = text;
                                requestAnimationFrame(() => resolve());
                            });
                        });
                    description.innerHTML = modules.locales.get("INSTALLING_PCOS").replace("%s", modules.locales.get("CHANGING_BOOT_PERMISSIONS"));
                    content.innerHTML = "";
                    await modules.fs.chown("target/boot", "root");
                    await modules.fs.chgrp("target/boot", "root");
                    await modules.fs.chmod("target/boot", "rx");
                    description.innerHTML = modules.locales.get("INSTALLING_PCOS").replace("%s", modules.locales.get("PATCHING_FS"));
                    let systemCode = "let localSystemMount = \"storage\";\nlet mountOptions = {\n\tpartition: " + JSON.stringify(diskDataPartition) + "\n};\ntry {\n\tmodules.fs.mounts[localSystemMount] = await modules.mounts.PCFSiDBMount(mountOptions);\n\tmodules.defaultSystem = localSystemMount;\n} catch (e) {\n\tawait panic(\"SYSTEM_PARTITION_MOUNTING_FAILED\", { underlyingJS: e, name: \"fs.mounts\", params: [localSystemMount, mountOptions]});\n}\n";
                    await modules.fs.write("target/boot/01-fsboot.js", systemCode);
                    description.innerHTML = modules.locales.get("INSTALLATION_SUCCESSFUL");
                    windowDiv.closeButton.disabled = false;
                    windowDiv.closeButton.onclick = () => modules.restart();
                } catch (e) {
                    console.error(e);
                    description.innerHTML = modules.locales.get("INSTALLATION_FAILED");
                    windowDiv.closeButton.disabled = false;
                    windowDiv.closeButton.onclick = () => modules.restart();
                    throw e;
                }
            }
        }
    }
}

async function copyBoot(currentDir = "/boot", targetMount = "storage", progressSet) {
    let dirList = await modules.fs.ls(modules.defaultSystem + currentDir);
    try {
        await recursiveRemove(targetMount + currentDir, progressSet);
    } catch (e) {
        if (e.message != "NO_SUCH_DIR") throw e;
    }
    await progressSet(modules.locales.get("CREATING_DIR").replace("%s", currentDir));
    await modules.fs.mkdir(targetMount + currentDir);
    for (let fileIndex in dirList) {
        let file = dirList[fileIndex];
        await progressSet(modules.locales.get("COPYING_FILE").replace("%s", currentDir + "/" + file) + " | " + (Number(fileIndex) + 1) + "/" + dirList.length + " | " + ((Number(fileIndex) + 1) / dirList.length * 100).toFixed(2) + "%");
        let permissions = await modules.fs.permissions(modules.defaultSystem + currentDir + "/" + file);
        if (await isDirectory(modules.defaultSystem + currentDir + "/" + file)) await copyBoot(currentDir + "/" + file, targetMount, progressSet);
        else await modules.fs.write(targetMount + currentDir + "/" + file, await modules.fs.read(modules.defaultSystem + currentDir + "/" + file));
        await modules.fs.chown(targetMount + currentDir + "/" + file, permissions.owner);
        await modules.fs.chgrp(targetMount + currentDir + "/" + file, permissions.group);
        await modules.fs.chmod(targetMount + currentDir + "/" + file, permissions.world);
    }
    await progressSet(modules.locales.get("COMPLETE_COPY").replace("%s", currentDir));
}

let isDirectory = (path) => modules.fs.isDirectory(path);

async function recursiveRemove(path, progressSet) {
    await progressSet(modules.locales.get("REMOVING_OBJECT").replace("%s", path));
    let dirList = await modules.fs.ls(path);
    for (let fileIndex in dirList) {
        let file = dirList[fileIndex];
        await progressSet(modules.locales.get("REMOVING_OBJECT").replace("%s", path + "/" + file) + " | " + (Number(fileIndex) + 1) + "/" + dirList.length + " | " + ((Number(fileIndex) + 1) / dirList.length * 100).toFixed(2) + "%");
        if (await isDirectory(path + "/" + file)) await recursiveRemove(path + "/" + file);
        else await modules.fs.rm(path + "/" + file);
    }
    await modules.fs.rm(path);
    await progressSet(modules.locales.get("COMPLETE_REMOVE").replace("%s", path));
}

function setupbase() {
    let _generated = null;
    let appFns = [ _generated?._automatically?._by?._combine?.js ];
    let appFnCode = appFns.map(a => a.toString()).join("\n");
    let fsmount = {
        read: async function (key) {
            let pathParts = key.split("/");
            if (pathParts[0] == "") pathParts = pathParts.slice(1);
            let files = this.backend.files;
            for (let part of pathParts) {
                files = files[part];
                if (!files) throw new Error("NO_SUCH_FILE");
            }
            if (typeof files === "object") throw new Error("IS_A_DIR");
            return files;
        },
        ls: async function (directory) {
            let pathParts = directory.split("/");
            if (pathParts[0] == "") pathParts = pathParts.slice(1);
            let files = this.backend.files;
            for (let part of pathParts) {
                files = files[part];
                if (!files) throw new Error("NO_SUCH_DIR");
            }
            if (typeof files !== "object") throw new Error("IS_A_FILE");
            return Object.keys(files);
        },
        permissions: async function (file) {
            return this.backend.permissions[file] || {
                owner: "root",
                group: "root",
                world: "",
            };
        },
        isDirectory: function(key) {
            let pathParts = key.split("/").slice(0, -1);
            if (pathParts[0] == "") pathParts = pathParts.slice(1);
            if (pathParts[pathParts.length - 1] == "") pathParts = pathParts.slice(0, -1);
            let basename = key.split("/").slice(-1)[0];
            let files = this.backend.files;
            for (let part of pathParts) {
                files = files[part];
                if (!files) throw new Error("NO_SUCH_DIR");
            }
            if (!files.hasOwnProperty(basename)) throw new Error("NO_SUCH_FILE_DIR");
            if (typeof files[basename] === "object") return true;
            return false;
        },
        sync: () => {},
        directory_supported: true,
        read_only: true,
        permissions_supported: true,
        backend: {
            files: {
                etc: {
                    security: {
                        users: JSON.stringify({
                            root: {
                                groups: [ "root" ],
                                securityChecks: [
                                    {
                                        type: "timeout",
                                        timeout: 0
                                    }
                                ],
                                homeDirectory: "installer/root"
                            },
                            nobody: {
                                groups: [ "nobody" ],
                                securityChecks: [],
                                homeDirectory: "installer"
                            }
                        }),
                        automaticLogon: "root"
                    } 
                },
                boot: {
                    "00-pcos.js": "// @pcos-app-mode native\nconst pcos_version = " + JSON.stringify(modules.pcos_version) + ";\n\nlet modules = {\n     core: coreExports\n};\nglobalThis.modules = modules;\nmodules.pcos_version = pcos_version;\n" + panic.toString() + "\n" + startupMemo.toString() + "\nstartupMemo();\n",
                    "01-fs.js": loadFs.toString() + "\n" + sampleFormatToEncryptedPCFS.toString() + "\nloadFs();\n",
                    "01-fsboot.js": "/* no-op */",
                    "01-fsck.js": fsck.toString() + "\nawait fsck();\n",
                    "01-setup-state.js": "modules.settingUp = true;\n",
                    "02-ui.js": loadUi.toString() + "\nloadUi();\n",
                    "03-xterm.js": xterm_export.toString() + "\nxterm_export();\n",
                    "04-ipc.js": loadIpc.toString() + "\nloadIpc();\n",
                    "04-websockets.js": loadWebsocketSupport.toString() + "\nloadWebsocketSupport();\n",
                    "05-reeapis.js": reeAPIs.toString() + "\nreeAPIs();\n",
                    "06-csp.js": loadBasicCSP.toString() + "\nloadBasicCSP();\n",
                    "06-locales.js": localization.toString() + "\nlocalization();\n",
                    "06-ksk.js": ksk.toString() + "\nawait ksk();\n",
                    "07-tasks.js": loadTasks.toString() + "\nloadTasks();\n",
                    "08-tty.js": js_terminal.toString() + "\n",
                    "09-restart.js": restartLoad.toString() + "\nrestartLoad();\n",
                    "11-userfriendliness.js": loadUserFriendly.toString() + "\nloadUserFriendly();\n",
                    "12-tokens.js": setupTokens.toString() + "\nsetupTokens();\n",
                    "12-users.js": setupUsers.toString() + "\nawait setupUsers();\n",
                    "13-authui.js": authui.toString() + "\nmodules.authui = authui;\n",
                    "13-consentui.js": consentui.toString() + "\nmodules.consentui = consentui;\n",
                    "14-logon-requirement.js": requireLogon.toString() + "\n" + waitForLogon.toString() + "\n" + hookButtonClick.toString() + "\n" + serviceLogon.toString() + "\n",
                    "14-logon-requirement-enforce.js": "/* no-op */",
                    "15-apps.js": appFnCode + "\n",
                    "15-optional.js": opt.toString() + "\nopt();\n",
                    "16-wallpaper.js": installWallpapers.toString() + "\n",
                    "16-sfxpack.js": installSfx.toString() + "\n",
                    "17-installer-secondstage.js": secondstage.toString() + "\nsecondstage();\n",
                    "99-finished.js": systemKillWaiter.toString() + "\nreturn await systemKillWaiter();"
                },
                root: {}
            },
            permissions: {
                "": {
                    owner: "root",
                    group: "root",
                    world: "rx"
                },
                "boot": {
                    owner: "root",
                    group: "root",
                    world: "rx"
                },
                "etc": {
                    owner: "root",
                    group: "root",
                    world: "rx"
                },
                "etc/security": {
                    owner: "root",
                    group: "root",
                    world: ""
                },
                "etc/security/users": {
                    owner: "root",
                    group: "root",
                    world: ""
                },
                "etc/security/groups": {
                    owner: "root",
                    group: "root",
                    world: "r"
                },
                "etc/security/automaticLogon": {
                    owner: "root",
                    group: "root",
                    world: "r"
                }
            }
        }
    };
    for (let file in fsmount.backend.files.boot) {
        fsmount.backend.permissions["boot/" + file] = {
            owner: "root",
            group: "root",
            world: "rx"
        };
    }
    modules.fs.mounts["installer"] = fsmount;
    modules.defaultSystem = "installer";
}

setupbase();
installer();