function loadTasks() {
    // @pcos-app-mode native
    let tasks = {
        exec: async function(file, arg, windowObject, token, silent) {
            let errorAudio = new Audio();
            try {
                let errorSoundPerm = await modules.fs.permissions(modules.defaultSystem + "/etc/sounds/error.aud", token);
                if (!errorSoundPerm.world.includes("r")) throw new Error("Not allowed to read error.aud");
                let errorSound = await modules.fs.read(modules.defaultSystem + "/etc/sounds/error.aud", token);
                errorAudio.src = errorSound;
            } catch {}
            if (modules.shuttingDown) {
                windowObject.windowDiv.remove();
                throw new Error("SYSTEM_SHUTDOWN_REQUESTED");
            }
            let appRedirecting = {};
            try {
                appRedirecting = JSON.parse(await this.fs.read(modules.defaultSystem + "/etc/appRedir", token));
            } catch {}
            if (modules.core.bootMode == "safe") appRedirecting = {};
            if (appRedirecting.hasOwnProperty(file)) file = appRedirecting[file];
            windowObject.title.innerText = modules.locales.get("UNTITLED_APP");
            let taskId = crypto.getRandomValues(new Uint8Array(64)).reduce((a, b) => a + b.toString(16).padStart(2, "0"), "");
            let executablePermissions, executable;
            try {
                executablePermissions = await this.fs.permissions(file, token);
                executable = await this.fs.read(file, token);
            } catch (e) {
                windowObject.title.innerText = modules.locales.get("APP_STARTUP_CRASH_TITLE");
                windowObject.content.innerText = modules.locales.get("APP_STARTUP_CRASH");
                windowObject.closeButton.disabled = false;
                windowObject.closeButton.onclick = (e) => windowObject.windowDiv.remove() && e.stopPropagation();
                if (silent) windowObject.windowDiv.remove();
                if (!silent) errorAudio.play();
                throw e;
            }
            if (!executablePermissions.world.includes("r") || !executablePermissions.world.includes("x")) {
                windowObject.title.innerText = modules.locales.get("PERMISSION_DENIED");
                windowObject.content.innerText = modules.locales.get("MORE_PERMISSION_DENIED");
                windowObject.closeButton.disabled = false;
                windowObject.closeButton.onclick = (e) => windowObject.windowDiv.remove() && e.stopPropagation();
                if (silent) windowObject.windowDiv.remove();
                if (!silent) errorAudio.play();
                throw new Error("MORE_PERMISSION_DENIED");
            }
            if (!executable.includes("// @pcos-app-mode isolat" + "able")) {
                windowObject.title.innerText = modules.locales.get("COMPATIBILITY_ISSUE_TITLE");
                windowObject.content.innerText = modules.locales.get("COMPATIBILITY_ISSUE");
                windowObject.closeButton.disabled = false;
                windowObject.closeButton.onclick = (e) => windowObject.windowDiv.remove() && e.stopPropagation();
                if (silent) windowObject.windowDiv.remove();
                if (!silent) errorAudio.play();
                throw new Error("COMPATIBILITY_ISSUE");
            }
            let appHardening = {overridable:true};
            try {
                appHardening = JSON.parse(await this.fs.read(modules.defaultSystem + "/etc/appHarden", token));
            } catch {}
            let disableHarden = appHardening.overridable && modules.core.bootMode == "disable-harden";
            if (disableHarden) appHardening = {overridable:true};
            let limitations = [];
            let execSignature = { signature: null, signer: "" };
            if (executable.includes("// =====BEGIN MANIFEST=====")) {
                let parsingLines = executable.split("\n");
                let parsingBoundStart = parsingLines.indexOf("// =====BEGIN MANIFEST=====");
                let parsingBoundEnd = parsingLines.indexOf("// =====END MANIFEST=====");
                let upToParse = parsingLines.slice(parsingBoundStart, parsingBoundEnd + 1);
                let knownLineTypes = ["allow", "deny"];
                for (let line of upToParse) {
                    let lineType = line.split(": ")[0].replace("// ", "");
                    let lineData = line.replace("// " + lineType + ": ", "");
                    if (lineType == "signature") {
                        execSignature.signature = lineData;
                        executable = executable.replace(line + "\n", "");
                    }
                    if (lineType == "signer") execSignature.signer = lineData;
                    if (knownLineTypes.includes(lineType)) {
                        let dataParts = lineData.split(", ");
                        for (let data of dataParts) limitations.push({ lineType, data });
                    }
                }
            }
            if (disableHarden) limitations = [];
            let hexToU8A = (hex) => Uint8Array.from(hex.match(/.{1,2}/g).map(a => parseInt(a, 16)));
            if (!limitations.some(lim => lim.lineType == "allow") && appHardening.requireAllowlist && !disableHarden) {
                windowObject.title.innerText = modules.locales.get("PERMISSION_DENIED");
                windowObject.content.innerText = modules.locales.get("NO_APP_ALLOWLIST");
                windowObject.closeButton.disabled = false;
                windowObject.closeButton.onclick = (e) => windowObject.windowDiv.remove() && e.stopPropagation();
                if (silent) windowObject.windowDiv.remove();
                if (!silent) errorAudio.play();
                throw new Error("NO_APP_ALLOWLIST");
            }
            if ((execSignature.signer || appHardening.requireSignature) && !disableHarden) {
                try {
                    let ksrlFiles = await this.fs.ls(modules.defaultSystem + "/etc/keys/ksrl", token);
                    let ksrlSignatures = [];
                    for (let ksrlFile of ksrlFiles) {
                        let ksrl = JSON.parse(await this.fs.read(modules.defaultSystem + "/etc/keys/ksrl/" + ksrlFile, token));
                        let ksrlSignature = ksrl.signature;
                        delete ksrl.signature;
                        if (await crypto.subtle.verify({
                            name: "ECDSA",
                            hash: {
                                name: "SHA-256"
                            }
                        }, modules.ksk_imported, hexToU8A(ksrlSignature), new TextEncoder().encode(JSON.stringify(ksrl.list)))) {
                            ksrlSignatures.push(...ksrl.list);
                        }
                    }
                    let signingKey = JSON.parse(await this.fs.read(modules.defaultSystem + "/etc/keys/" + execSignature.signer, token));
                    if (ksrlSignatures.includes(signingKey.signature)) throw new Error("KEY_REVOKED");
                    if (!await crypto.subtle.verify({
                        name: "ECDSA",
                        hash: {
                            name: "SHA-256"
                        }
                    }, modules.ksk_imported, hexToU8A(signingKey.signature), new TextEncoder().encode(JSON.stringify(signingKey.key)))) throw new Error("KEY_SIGNATURE_VERIFICATION_FAILED");
                    let importSigningKey = await crypto.subtle.importKey("jwk", signingKey.key, {
                        name: "ECDSA",
                        namedCurve: "P-256"
                    }, false, ["verify"]);
                    if (!await crypto.subtle.verify({
                        name: "ECDSA",
                        hash: {
                            name: "SHA-256"
                        }
                    }, importSigningKey, hexToU8A(execSignature.signature), new TextEncoder().encode(executable))) throw new Error("APP_SIGNATURE_VERIFICATION_FAILED");
                } catch (e) {
                    windowObject.title.innerText = modules.locales.get("PERMISSION_DENIED");
                    windowObject.content.innerText = modules.locales.get("SIGNATURE_VERIFICATION_FAILED").replace("%s", execSignature.signer || modules.locales.get("UNKNOWN_PLACEHOLDER"));
                    windowObject.closeButton.disabled = false;
                    windowObject.closeButton.onclick = (e) => windowObject.windowDiv.remove() && e.stopPropagation();
                    if (silent) windowObject.windowDiv.remove();
                    if (!silent) errorAudio.play();
                    throw new Error("APP_OR_KEY_SIGNATURE_VERIFICATION_FAILED");
                }
            }
            let ree = await this.ree(windowObject.content, token);
            try {
                modules.session.attrib(windowObject.sessionId, "openReeWindows", [ ...(modules.session.attrib(windowObject.sessionId, "openReeWindows") || []), taskId ]);
                arg = arg || [];
                if (!(arg instanceof Array)) arg = [];
                arg = arg.map(a => String(a));
                let that = this;
                ree.iframe.style = "width: 100%; height: 100%; border: none; top: 0; left: 0; position: absolute;";
                let reeAPIInstance = await modules.reeAPIInstance({ ree, ses: windowObject.sessionId, token, taskId, limitations });
                for (let action in reeAPIInstance.public) ree.exportAPI(action, (e) => reeAPIInstance.public[action](e.arg));
                this.tracker[taskId] = {
                    ree,
                    file: file,
                    arg: arg,
                    apis: reeAPIInstance,
                    critical: false,
                    cliio: {
                        attached: false
                    }
                };
                let registrations = [];
                windowObject.closeButton.addEventListener("click", () => that.sendSignal(taskId, 15));
                windowObject.closeButton.addEventListener("contextmenu", async function(e) {
                    e.preventDefault();
                    await that.sendSignal(taskId, 9);
                });
                ree.exportAPI("attachCLI", function() {
                    if (that.tracker[taskId].cliio.attached) return true;
                    let signup = () => new Promise((resolve) => registrations.push(resolve));
                    ree.iframe.hidden = true;
                    let termDiv = document.createElement("div");
                    let termInstance = new Terminal();
                    termInstance.open(termDiv);
                    windowObject.content.appendChild(termDiv);
                    that.tracker[taskId].cliio.attached = true;
                    that.tracker[taskId].cliio.xtermInstance = termInstance;
                    let onresizeFn = () => termInstance.resize(Math.floor(windowObject.content.clientWidth / 9), Math.floor(windowObject.content.clientHeight / 16));
                    onresizeFn();
                    let robs = new ResizeObserver(onresizeFn);
                    that.tracker[taskId].cliio.robsInstance = robs;
                    robs.observe(windowObject.windowDiv);
                    that.tracker[taskId].cliio.signup = signup;
                    termInstance.clear();
                    return true;  
                });
                ree.exportAPI("toMyCLI", function(apiArg) {
                    if (that.tracker[taskId].cliio.attached) {
                        that.tracker[taskId].cliio.xtermInstance.write(apiArg.arg);
                        for (let registered in registrations) {
                            registrations[registered]({ type: "write", data: apiArg.arg });
                            registrations.splice(registered, 1);
                        }
                    }
                });
                ree.exportAPI("fromMyCLI", function() {
                    if (!that.tracker[taskId].cliio.attached) return false;
                    let ti = that.tracker[taskId].cliio.xtermInstance;
                    return new Promise(function(resolve) {
                        let d = ti.onData(function(e) {
                            resolve(e);
                            d.dispose();
                        });
                    });
                });
                ree.exportAPI("clearMyCLI", function() {
                    if (that.tracker[taskId].cliio.attached) that.tracker[taskId].cliio.xtermInstance.clear();
                    for (let registered in registrations) {
                        registrations[registered]({ type: "consoleClear" });
                        registrations.splice(registered, 1);
                    }
                });
                ree.exportAPI("cliSize", function() {
                    if (!that.tracker[taskId].cliio.attached) return [ 0, 0 ];
                    return [ that.tracker[taskId].cliio.xtermInstance.cols, that.tracker[taskId].cliio.xtermInstance.rows ];
                });
                ree.exportAPI("detachCLI", function() {
                    if (!that.tracker[taskId].cliio.attached) return true;
                    that.tracker[taskId].cliio.attached = false;
                    that.tracker[taskId].cliio.xtermInstance.clear();
                    that.tracker[taskId].cliio.robsInstance.disconnect();
                    delete that.tracker[taskId].cliio.robsInstance;
                    that.tracker[taskId].cliio.xtermInstance.dispose();
                    delete that.tracker[taskId].cliio.xtermInstance;
                    delete that.tracker[taskId].cliio.signup;
                    registrations = [];
                    ree.iframe.hidden = false;
                    return true;
                });
                ree.exportAPI("windowVisibility", (apiArg) => windowObject.windowDiv.classList.toggle("hidden", !apiArg.arg));
                ree.exportAPI("windowTitleSet", (apiArg) => windowObject.title.innerText = apiArg.arg);
                ree.exportAPI("windowResize", function(apiArg) {
                    if (reeAPIInstance.public.getPrivileges().includes("GRAB_ATTENTION")) {
                        windowObject.windowDiv.style.width = apiArg.arg[0] + "px";
                        windowObject.windowDiv.style.height = apiArg.arg[1] + "px";
                    }
                });
                ree.exportAPI("windowRelocate", function(apiArg) {
                    if (reeAPIInstance.public.getPrivileges().includes("GRAB_ATTENTION")) {
                        windowObject.windowDiv.style.top = apiArg.arg[0] + "px";
                        windowObject.windowDiv.style.left = apiArg.arg[1] + "px";
                    }
                });
                ree.exportAPI("windowFullscreen", function(apiArg) {
                    if (reeAPIInstance.public.getPrivileges().includes("GRAB_ATTENTION")) {
                        windowObject.windowDiv.classList.toggle("fullscreen", apiArg.arg);
                    }
                });
                ree.exportAPI("closeability", (apiArg) => windowObject.closeButton.classList.toggle("hidden", !apiArg.arg));
                ree.exportAPI("critical", function(apiArg) {
                    if (reeAPIInstance.public.getPrivileges().includes("SYSTEM_STABILITY")) {
                        that.tracker[taskId].critical = !!apiArg.arg;
                    }
                });
                await ree.eval("taskId = " + JSON.stringify(taskId) + ";");
                await ree.eval("exec_args = " + JSON.stringify(arg) + ";");
                ree.beforeCloseDown(function() {
                    let orw = modules.session.attrib(windowObject.sessionId, "openReeWindows");
                    orw.splice(orw.indexOf(taskId), 1);
                    modules.session.attrib(windowObject.sessionId, "openReeWindows", orw);
                    if (that.tracker[taskId].cliio.attached) {    
                        that.tracker[taskId].cliio.attached = false;
                        that.tracker[taskId].cliio.xtermInstance.clear();
                        that.tracker[taskId].cliio.robsInstance.disconnect();
                        that.tracker[taskId].cliio.robsInstance = null;
                        that.tracker[taskId].cliio.xtermInstance.dispose();
                    }
                });
                ree.beforeCloseDown(() => windowObject.windowDiv.remove());
                ree.beforeCloseDown(() => delete that.tracker[taskId]);
                await ree.eval(executable);
            } catch (e) {
                ree.closeDown();
                windowObject.title.innerText = modules.locales.get("APP_STARTUP_CRASH_TITLE");
                windowObject.content.innerText = modules.locales.get("APP_STARTUP_CRASH");
                windowObject.closeButton.disabled = false;
                windowObject.windowDiv.classList.toggle("hidden", false);
                windowObject.closeButton.onclick = (e) => windowObject.windowDiv.remove() && e.stopPropagation();
                if (silent) windowObject.windowDiv.remove();
                throw e;
            }
            return taskId;
        },
        sendSignal: async function(taskId, signal, bypassCritical) {
            if (signal == 9) {
                if (this.tracker[taskId].critical && !bypassCritical) {
                    let memory = this.tracker[taskId];
                    await memory.ree.closeDown();
                    await panic("CRITICAL_TASK_FAILED", {
                        name: memory.file,
                        params: memory.arg
                    });
                    throw new Error("CRITICAL_TASK_FAILED");
                }
                return await this.tracker[taskId].ree.closeDown();
            }
            return await this.tracker[taskId].ree.eval("dispatchEvent(new CustomEvent(\"signal\", { detail: " + JSON.stringify(signal) + ", bubbles: true }));");
        },
        runsProperly: async function(taskId) {
            try {
                return await this.tracker[taskId].ree.eval("true");
            } catch (e) {
                return false;
            }
        },
        listPublicTasks: () => Object.keys(tasks.tracker),
        taskInfo: async function(taskId) {
            if (!this.tracker.hasOwnProperty(taskId)) return null;
            let info = await modules.tokens.info(this.tracker[taskId].apis.public.getProcessToken());
            if (!info) info = { user: "nobody" };
            return {
                file: this.tracker[taskId].file,
                arg: this.tracker[taskId].arg,
                runBy: info.user,
                cliio: this.tracker[taskId].cliio.attached
            }
        },
        tracker: {},
        fs: modules.fs,
        ree: modules.core.createREE
    };
    
    modules.tasks = tasks;
}
loadTasks();