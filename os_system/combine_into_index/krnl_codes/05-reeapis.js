function reeAPIs() {
    // @pcos-app-mode native

    async function denyUnmanifested(list, token) {
        let privileges = (await modules.tokens.info(token)).privileges;
        let isAllowlist = list.some(a => a.lineType == "allow");
        if (isAllowlist) list = list.filter(a => a.lineType == "allow");
        let disallowedRegistry = [];
        for (let privilege of privileges) {
            if ((!list.some(x => x.data == privilege && x.lineType == "allow") && isAllowlist) || list.some(x => x.data == privilege && x.lineType == "deny")) {
                privileges = privileges.filter(x => x != privilege);
                disallowedRegistry.push(privilege);
            }
        }
        modules.tokens.removePrivileges(token, disallowedRegistry);
        return privileges;
    }

    modules.reeAPIInstance = async function(opts) {
        let {ree, ses, token, taskId, limitations} = opts;
        let processToken = token;
        let tokenInfo = await modules.tokens.info(token);
        let user = tokenInfo.user;
        let groups = tokenInfo.groups || [];
        let privileges = tokenInfo.privileges;
        let processPipes = [];
        let websockets = [];
        let automatedLogonSessions = {};
        privileges = await denyUnmanifested(limitations, token);

        async function fs_action(action, privilegeCheck, path, ...xtra) {
            let fsPermissions;
            try {
                fsPermissions = await modules.fs.permissions(path);
            } catch (e) {
                throw new Error("PERMISSION_CHECKING_FAILED");
            }
            if (!privilegeCheck(fsPermissions)) throw new Error("PERMISSION_DENIED");
            try {
                let response = await modules.fs[action](path, ...xtra);
                return response;
            } catch (e) {
                if (e.name == "Error") throw e;
                throw new Error("FS_ACTION_FAILED");
            }
        }
        ree.beforeCloseDown(async function() {
            for (let processPipe of processPipes) delete modules.ipc._ipc[processPipe];
            for (let websocket of websockets) modules.websocket.close(websocket);
            await modules.tokens.revoke(token);
            for (let i in modules.csps) modules.csps[i].removeSameGroupKeys(null, taskId);
        });
        let apis = {
            private: {
                setUser: async function(newUser) {
                    user = newUser;
                    groups = (await modules.users.getUserInfo(newUser)).groups || [];
                },
                addPrivilege: (newPrivilege) => !privileges.includes(newPrivilege) && privileges.push(newPrivilege),
                rmPrivilege: (newPrivilege) => privileges.includes(newPrivilege) && privileges.splice(privileges.indexOf(newPrivilege), 1),
                setPrivileges: (newPrivileges) => privileges = newPrivileges,
                reauthorize: async function() {
                    let tokenInfo = await modules.tokens.info(token);
                    user = tokenInfo.user;
                    groups = tokenInfo.groups || [];
                    privileges = tokenInfo.privileges;
                    privileges = await denyUnmanifested(limitations, token);
                }
            },
            public: {
                getUser: () => user,
                getPrivileges: () => privileges,
                terminate: async function() {
                    await ree.closeDown();
                },
                rmPrivilege: async function(privilege) {
                    if (!privileges.includes(privilege)) throw new Error("NO_SUCH_PRIVILEGE");
                    privileges.splice(privileges.indexOf(privilege), 1);
                    await modules.tokens.removePrivilege(token, privilege);
                    return true;
                },
                rmPrivileges: async function(privilegesRemoved) {
                    privileges = privileges.filter(x => !privilegesRemoved.includes(x));
                    await modules.tokens.removePrivileges(token, privilegesRemoved);
                    return true;
                },
                switchUser: async function(desiredUser) {
                    if (!privileges.includes("SWITCH_USERS_AUTOMATICALLY")) throw new Error("UNAUTHORIZED_ACTION");
                    await modules.tokens.halfInitialize(token, desiredUser);
                    user = (await modules.tokens.info(token)).user;
                    groups = (await modules.users.getUserInfo(desiredUser)).groups || [];
                    return true;
                },
                shutdown: async function(arg) {
                    let {isReboot, token} = arg;
                    if (!privileges.includes("SYSTEM_SHUTDOWN")) throw new Error("UNAUTHORIZED_ACTION");
                    await modules.restart(!isReboot, token || processToken);
                    return true;
                },
                fs_read: async function(arg) {
                    let {path, token} = arg;
                    if (!privileges.includes("FS_READ")) throw new Error("UNAUTHORIZED_ACTION");
                    return await fs_action("read", (fsPermissions) => fsPermissions.owner == user || fsPermissions.world.includes("r") || groups.includes(fsPermissions.group) || privileges.includes("FS_BYPASS_PERMISSIONS"), path, token || processToken);
                },
                fs_ls: async function(arg) {
                    let {path, token} = arg;
                    if (!privileges.includes("FS_READ")) throw new Error("UNAUTHORIZED_ACTION");
                    return await fs_action("ls",
                    (fsPermissions) =>
                        fsPermissions.owner == user ||
                        groups.includes(fsPermissions.group) ||
                        (fsPermissions.world.includes("r") &&
                        fsPermissions.world.includes("x")) || privileges.includes("FS_BYPASS_PERMISSIONS"), path, token || processToken);
                },
                fs_write: async function(arg) {
                    if (!privileges.includes("FS_WRITE")) throw new Error("UNAUTHORIZED_ACTION");
                    let {path, data, token} = arg;
                    let pathParent = path.split("/").slice(0, -1).join("/");
                    let basename = path.split("/").slice(-1)[0];
                    let isCreating = false;
                    let fsParentPermissions;
                    try {
                        if (!(await modules.fs.ls(pathParent, token || processToken)).includes(basename)) isCreating = true;
                    } catch (e) {
                        throw new Error("CREATION_CHECK_FAILED");
                    }

                    try {
                        fsParentPermissions = await modules.fs.permissions(pathParent, token || processToken);
                    } catch (e) {
                        throw new Error("PERMISSION_CHECKING_FAILED");
                    }
                    if (!fsParentPermissions.world.includes("w") && fsParentPermissions.owner != user && !groups.includes(fsParentPermissions.group) && !privileges.includes("FS_BYPASS_PERMISSIONS")) throw new Error("PERMISSION_DENIED");
                    
                    if (isCreating) {
                        try {
                            await modules.fs.chown(path, user, token || processToken);
                            await modules.fs.chgrp(path, groups[0], token || processToken);
                            await modules.fs.chmod(path, "r", token || processToken);
                        } catch (e) {
                            if (e.name == "Error") throw e;
                            throw new Error("PERMISSION_CHANGE_FAILED");
                        }
                    }
                    return await fs_action("write", (fsPermissions) => fsPermissions.owner == user || groups.includes(fsPermissions.group) || fsPermissions.world.includes("w") || privileges.includes("FS_BYPASS_PERMISSIONS"), path, data, token || processToken);
                },
                fs_rm: async function(arg) {
                    let {path, token} = arg;
                    if (!privileges.includes("FS_REMOVE")) throw new Error("UNAUTHORIZED_ACTION");
                    return await fs_action("rm", (fsPermissions) => fsPermissions.owner == user || privileges.includes("FS_BYPASS_PERMISSIONS"), path, token);
                },
                fs_mkdir: async function(arg) {
                    let {path, token} = arg;
                    if (!privileges.includes("FS_WRITE")) throw new Error("UNAUTHORIZED_ACTION");
                    let pathParent = path.split("/").slice(0, -1).join("/");
                    let fsPermissions;
                    try {
                        fsPermissions = await modules.fs.permissions(pathParent, token || processToken);
                    } catch (e) {
                        throw new Error("PERMISSION_CHECKING_FAILED");
                    }
                    if (!fsPermissions.world.includes("w") && fsPermissions.owner != user && !groups.includes(fsPermissions.group) && !privileges.includes("FS_BYPASS_PERMISSIONS")) throw new Error("PERMISSION_DENIED");
                    try {
                        await modules.fs.chown(path, user, token || processToken);
                        await modules.fs.chgrp(path, groups[0] || user, token || processToken);
                        await modules.fs.chmod(path, "rx", token || processToken);
                    } catch (e) {
                        if (e.name == "Error") throw e;
                        throw new Error("PERMISSION_CHANGE_FAILED");
                    }
                    try {
                        return await modules.fs.mkdir(path, token || processToken);
                    } catch (e) {
                        if (e.name == "Error") throw e;
                        throw new Error("FS_ACTION_FAILED");
                    }
                },
                fs_chown: async function(arg) {
                    if (!privileges.includes("FS_CHANGE_PERMISSION")) throw new Error("UNAUTHORIZED_ACTION");
                    let {path, newUser, token} = arg;
                    return await fs_action("chown", (fsPermissions) => fsPermissions.owner == user || privileges.includes("FS_BYPASS_PERMISSIONS"), path, newUser, token || processToken);
                },
                fs_chgrp: async function(arg) {
                    if (!privileges.includes("FS_CHANGE_PERMISSION")) throw new Error("UNAUTHORIZED_ACTION");
                    let {path, newGrp, token} = arg;
                    return await fs_action("chgrp", (fsPermissions) => fsPermissions.owner == user || privileges.includes("FS_BYPASS_PERMISSIONS"), path, newGrp, token || processToken);
                },
                fs_chmod: async function(arg) {
                    if (!privileges.includes("FS_CHANGE_PERMISSION")) throw new Error("UNAUTHORIZED_ACTION");
                    let {path, newPermissions, token} = arg;
                    return await fs_action("chmod", (fsPermissions) => fsPermissions.owner == user || privileges.includes("FS_BYPASS_PERMISSIONS"), path, newPermissions, token || processToken);
                },
                fs_permissions: async function(arg) {
                    let {path, token} = arg;
                    if (!privileges.includes("FS_READ")) throw new Error("UNAUTHORIZED_ACTION");
                    let pathParent = path.split("/").slice(0, -1).join("/");
                    if (pathParent != "") {
                        let fsPermissions;
                        try {
                            fsPermissions = await modules.fs.permissions(pathParent, token || processToken);
                        } catch (e) {
                            throw new Error("PERMISSION_CHECKING_FAILED");
                        }
                        if (!fsPermissions.world.includes("r") && fsPermissions.owner != user && !privileges.includes("FS_BYPASS_PERMISSIONS")) throw new Error("PERMISSION_DENIED");
                    }
                    return await fs_action("permissions", () => true, path, token || processToken);
                },
                fs_mounts: async function() {
                    if (!privileges.includes("FS_LIST_PARTITIONS")) throw new Error("UNAUTHORIZED_ACTION");
                    try {
                        return await modules.fs.lsmounts();
                    } catch (e) {
                        if (e.name == "Error") throw e;
                        throw new Error("FS_ACTION_FAILED");
                    }
                },
                fs_sync: async function(arg) {
                    let {mount, token} = arg;
                    if (!privileges.includes("FS_UNMOUNT")) throw new Error("UNAUTHORIZED_ACTION");
                    try {
                        return await modules.fs.sync(mount, token || processToken);
                    } catch (e) {
                        if (e.name == "Error") throw e;
                        throw new Error("FS_ACTION_FAILED");
                    }
                },
                fs_unmount: async function(arg) {
                    let {mount, token, force} = arg;
                    if (!privileges.includes("FS_UNMOUNT")) throw new Error("UNAUTHORIZED_ACTION");
                    try {
                        return await modules.fs.unmount(mount, token || processToken, force);
                    } catch (e) {
                        if (e.name == "Error") throw e;
                        throw new Error("FS_ACTION_FAILED");
                    }
                },
                fs_mountInfo: async function(mount) {
                    if (!privileges.includes("FS_LIST_PARTITIONS")) throw new Error("UNAUTHORIZED_ACTION");
                    try {
                        return await modules.fs.mountInfo(mount);
                    } catch (e) {
                        if (e.name == "Error") throw e;
                        throw new Error("FS_ACTION_FAILED");
                    }
                },
                getSystemMount: async function() {
                    if (!privileges.includes("FS_LIST_PARTITIONS")) throw new Error("UNAUTHORIZED_ACTION");
                    return modules.defaultSystem;
                },
                createPipe: async function() {
                    if (!privileges.includes("IPC_CREATE_PIPE")) throw new Error("UNAUTHORIZED_ACTION");
                    let pipe = await modules.ipc.create();
                    modules.ipc.declareAccess(pipe, {
                        owner: user,
                        group: groups[0],
                        world: false
                    });
                    processPipes.push(pipe);
                    return pipe;
                },
                listenToPipe: async function(pipe) {
                    if (!privileges.includes("IPC_LISTEN_PIPE")) throw new Error("UNAUTHORIZED_ACTION");
                    let permissions = await modules.ipc.getIPC(pipe);
                    if (permissions.owner != user && !groups.includes(permissions.group) && !permissions.world && !privileges.includes("IPC_BYPASS_PERMISSIONS") && !processPipes.includes(pipe)) throw new Error("PERMISSION_DENIED");
                    return await modules.ipc.listenFor(pipe);
                },
                sendToPipe: async function(dataSend) {
                    if (!privileges.includes("IPC_SEND_PIPE")) throw new Error("UNAUTHORIZED_ACTION");
                    let {pipe, data} = dataSend;
                    let permissions = await modules.ipc.getIPC(pipe);
                    if (permissions.owner != user && !groups.includes(permissions.group) && !permissions.world && !privileges.includes("IPC_BYPASS_PERMISSIONS") && !processPipes.includes(pipe)) throw new Error("PERMISSION_DENIED");
                    return await modules.ipc.send(pipe, data);
                },
                closePipe: async function(pipe) {
                    if (!processPipes.includes(pipe)) throw new Error("NOT_OWN_PIPE");
                    processPipes.splice(processPipes.indexOf(pipe), 1);
                    return delete modules.ipc._ipc[pipe];
                },
                setPipePermissions: async function(opts) {
                    if (!privileges.includes("IPC_CHANGE_PERMISSION")) throw new Error("UNAUTHORIZED_ACTION");
                    let {pipe, newPermissions} = opts;
                    let permissions = await modules.ipc.getIPC(pipe);
                    if (permissions.owner != user && !groups.includes(permissions.group) && !permissions.world && !privileges.includes("IPC_BYPASS_PERMISSIONS") && !processPipes.includes(pipe)) throw new Error("PERMISSION_DENIED");
                    return await modules.ipc.declareAccess(pipe, newPermissions);
                },
                elevate: async function(newPrivileges) {
                    newPrivileges = newPrivileges.filter(privilege => !privileges.includes(privilege));
                    newPrivileges = Array.from(new Set(newPrivileges));
                    if (!privileges.includes("SWITCH_USERS_AUTOMATICALLY")) throw new Error("UNAUTHORIZED_ACTION");
                    privileges.push(...newPrivileges);
                    await modules.tokens.addPrivileges(token, newPrivileges);
                    privileges = await denyUnmanifested(limitations, token);
                    return true;
                },
                getVersion: function() {
                    if (!privileges.includes("GET_BUILD")) throw new Error("UNAUTHORIZED_ACTION");
                    return modules.pcos_version;
                },
                locale: function() {
                    if (!privileges.includes("GET_LOCALE")) throw new Error("UNAUTHORIZED_ACTION");
                    return navigator.languages[0].split("-")[0].toLowerCase();
                },
                osLocale: function() {
                    if (!privileges.includes("GET_LOCALE")) throw new Error("UNAUTHORIZED_ACTION");
                    return modules.locales.get("OS_LOCALE");
                },
                getUserInfo: async function(arg) {
                    let {desiredUser, token, sensitive} = arg;
                    if (!privileges.includes("GET_USER_INFO")) throw new Error("UNAUTHORIZED_ACTION");
                    if (desiredUser != user && !privileges.includes("USER_INFO_OTHERS")) throw new Error("UNAUTHORIZED_ACTION");
                    if (sensitive && desiredUser != user && !privileges.includes("SENSITIVE_USER_INFO_OTHERS")) throw new Error("PERMISSION_DENIED");
                    return await modules.users.getUserInfo(desiredUser, sensitive, token || processToken);
                },
                setUserInfo: async function(arg) {
                    let {desiredUser, token, info} = arg;
                    if (!privileges.includes("SET_USER_INFO")) throw new Error("UNAUTHORIZED_ACTION");
                    return await modules.users.moduser(desiredUser, info, token || processToken);
                },
                setOwnSecurityChecks: async function(arg) {
                    let {token, checks} = arg;
                    if (!privileges.includes("SET_SECURITY_CHECKS")) throw new Error("UNAUTHORIZED_ACTION");
                    let allowedTypes = [ "pbkdf2", "informative", "informative_deny", "timeout", "timeout_deny", "serverReport", "pc-totp", "totp", "workingHours" ];
                    let sanitizedChecks = [];
                    checks.filter(a => allowedTypes.includes(a.type));
                    for (let checkIndex in checks) {
                        let check = checks[checkIndex];
                        if (check.type == "pbkdf2") {
                            if (!check.salt || !check.hash) continue;
                            check = { type: "pbkdf2", salt: check.salt, hash: check.hash };
                        } else if (check.type == "informative" || check.type == "informative_deny") {
                            if (!check.message) continue;
                            check = { type: check.type, message: check.message };
                        } else if (check.type == "timeout" || check.type == "timeout_deny") {
                            if (!check.timeout) continue;
                            check = { type: check.type, timeout: check.timeout };
                        } else if (check.type == "serverReport") {
                            if (!check.url) continue;
                            check = { type: "serverReport", url: check.url };
                        } else if (check.type == "pc-totp" || check.type == "totp") {
                            if (!check.secret) continue;
                            check = { type: check.type, secret: check.secret };
                        } else if (check.type == "workingHours") {
                            if (!check.start || !check.end) continue;
                            if (typeof check.start.hours !== "number" || typeof check.start.minutes !== "number" || typeof check.start.seconds !== "number") continue;
                            if (typeof check.end.hours !== "number" || typeof check.end.minutes !== "number" || typeof check.end.seconds !== "number") continue;
                            check = {
                                type: "workingHours",
                                start: {
                                    hours: check.start.hours,
                                    minutes: check.start.minutes,
                                    seconds: check.start.seconds
                                },
                                end: {
                                    hours: check.end.hours,
                                    minutes: check.end.minutes,
                                    seconds: check.end.seconds
                                }
                            };
                        }
                        sanitizedChecks.push(check);
                    }
                    let previousUserInfo = await modules.users.getUserInfo(user, false, token || processToken);
                    await modules.users.moduser(user, { ...previousUserInfo, securityChecks: sanitizedChecks }, token || processToken);
                    return true;
                },
                getNewToken: async function(desiredUser) {
                    if (!privileges.includes("ELEVATE_PRIVILEGES")) throw new Error("UNAUTHORIZED_ACTION");
                    if (modules.session.attrib(ses, "secureLock")) await modules.session.attrib(ses, "secureLock");
                    let releaseLock;
                    let lock = new Promise((resolve) => releaseLock = resolve);
                    modules.session.attrib(ses, "secureLock", lock);
                    let secureSession = await modules.session.mksession();

                    let dom = modules.session.tracker[secureSession].html;
                    let ogDom = modules.session.tracker[ses].html;
                    let bgfx = document.createElement("div");
                    bgfx.classList.add("session", "secure");
                    dom.appendChild(bgfx);
                    modules.session.attrib(secureSession, "dark", modules.session.attrib(ses, "dark"));
                    dom.style.background = ogDom.style.background;
                    dom.style.backgroundSize = "100% 100%";

                    modules.session.muteAllSessions();
                    modules.session.activateSession(secureSession);

                    let logonUI = await modules.authui(secureSession, desiredUser);
                    return new Promise(function(resolve) {
                        logonUI.hook(async function(result) {
                            releaseLock();
                            modules.session.attrib(ses, "secureLock", null);
                            modules.session.muteAllSessions();
                            modules.session.rmsession(secureSession);
                            modules.session.activateSession(ses);
                            if (result.success == false) return resolve(false);
                            return resolve(result.token);
                        });
                    });
                },
                getProcessToken: () => processToken,
                setProcessToken: async function(desiredToken) {
                    if (!privileges.includes("ELEVATE_PRIVILEGES")) throw new Error("UNAUTHORIZED_ACTION");
                    let validation = await modules.tokens.validate(desiredToken, {});
                    if (!validation) throw new Error("INVALID_TOKEN");
                    token = processToken = desiredToken;
                    let tokenInfo = await modules.tokens.info(token);
                    user = tokenInfo.user;
                    groups = tokenInfo.groups || [];
                    privileges = tokenInfo.privileges;
                    privileges = await denyUnmanifested(limitations, token);
                    return true;
                },
                revokeToken: function(dt) {
                    if (!privileges.includes("MANAGE_TOKENS")) throw new Error("UNAUTHORIZED_ACTION");
                    return modules.tokens.revoke(dt || processToken);
                },
                forkToken: function(dt) {
                    if (!privileges.includes("MANAGE_TOKENS")) throw new Error("UNAUTHORIZED_ACTION");
                    return modules.tokens.fork(dt || processToken);
                },
                removeTokenPrivilege: async function(arg) {
                    let {token, privilege} = arg;
                    if (!privileges.includes("MANAGE_TOKENS")) throw new Error("UNAUTHORIZED_ACTION");
                    await modules.tokens.removePrivilege(token, privilege);
                    return true;
                },
                removeTokenPrivileges: async function(arg) {
                    let {token, privileges} = arg;
                    if (!privileges.includes("MANAGE_TOKENS")) throw new Error("UNAUTHORIZED_ACTION");
                    await modules.tokens.removePrivileges(token, privileges);
                    return true;
                },
                estimateStorage: async function() {
                    if (!privileges.includes("FS_LIST_PARTITIONS")) throw new Error("UNAUTHORIZED_ACTION");
                    let estimate = await navigator.storage.estimate();
                    return {
                        internal: {
                            used: estimate.usage,
                            free: estimate.quota - estimate.usage,
                            total: estimate.quota
                        }
                    };
                },
                startTask: async function(arg) {
                    let {file, argPassed, token, runInBackground, silent} = arg;
                    if (!privileges.includes("START_TASK")) throw new Error("UNAUTHORIZED_ACTION");
                    if (runInBackground && !privileges.includes("START_BACKGROUND_TASK")) throw new Error("UNAUTHORIZED_ACTION");
                    if (!token) token = await modules.tokens.fork(processToken);
                    try {
                        return await modules.tasks.exec(file, argPassed, modules.window(runInBackground ? modules.serviceSession : ses), token, silent);
                    } catch (e) {
                        if (e.name == "Error") throw e;
                        throw new Error("UNABLE_TO_START_TASK");
                    }
                },
                listTasks: async function() {
                    if (!privileges.includes("LIST_TASKS")) throw new Error("UNAUTHORIZED_ACTION");
                    return modules.tasks.listPublicTasks();
                },
                taskInfo: async function(taskId) {
                    if (!privileges.includes("LIST_TASKS")) throw new Error("UNAUTHORIZED_ACTION");
                    return await modules.tasks.taskInfo(taskId);
                },
                signalTask: async function(arg) {
                    let {taskId, signal} = arg;
                    if (!privileges.includes("SIGNAL_TASK")) throw new Error("UNAUTHORIZED_ACTION");
                    if (!privileges.includes("TASK_BYPASS_PERMISSIONS")) {
                        let taskInfo = await modules.tasks.taskInfo(taskId);
                        if (taskInfo.runBy != user) throw new Error("PERMISSION_DENIED");
                    }
                    return await modules.tasks.sendSignal(taskId, signal);
                },
                lookupLocale: function(key) {   
                    if (!privileges.includes("GET_LOCALE")) throw new Error("UNAUTHORIZED_ACTION");
                    return modules.locales.get(key);
                },
                lookupOtherLocale: function(arg) {
                    let {key, locale} = arg;   
                    if (!privileges.includes("GET_LOCALE")) throw new Error("UNAUTHORIZED_ACTION");
                    return modules.locales.get(key, locale);
                },
                ufTimeInc: function(args) {
                    if (!privileges.includes("GET_LOCALE")) throw new Error("UNAUTHORIZED_ACTION");
                    return modules.userfriendliness.inconsiderateTime(...args);
                },
                ufInfoUnits: function(args) {
                    if (!privileges.includes("GET_LOCALE")) throw new Error("UNAUTHORIZED_ACTION");
                    return modules.userfriendliness.informationUnits(...args)
                },
                isDarkThemed: function() {
                    if (!privileges.includes("GET_THEME")) throw new Error("UNAUTHORIZED_ACTION");
                    return modules.session.attrib(ses, "dark")
                },
                fetchSend: async function(arg) {
                    if (!privileges.includes("FETCH_SEND")) throw new Error("UNAUTHORIZED_ACTION");
                    let {url, init} = arg;
                    let fetc = await fetch(url, init);
                    let responseAB;
                    if (init.mode != "no-cors" && !init.noArrayBuffer) responseAB = await fetc.arrayBuffer();
                    return {
                        status: fetc.status,
                        statusText: fetc.statusText,
                        ok: fetc.ok,
                        redirected: fetc.redirected,
                        type: fetc.type,
                        url: fetc.url,
                        headers: Object.fromEntries(Array.from(fetc.headers)),
                        arrayBuffer: responseAB,
                    };
                },
                switchUserWithSetup: async function(desiredUser) {
                    if (!privileges.includes("SWITCH_USERS_AUTOMATICALLY")) throw new Error("UNAUTHORIZED_ACTION");
                    await modules.tokens.userInitialize(token, desiredUser);
                    let tokenInfo = await modules.tokens.info(token);
                    user = tokenInfo.user;
                    groups = tokenInfo.groups || [];
                    privileges = tokenInfo.privileges;
                    privileges = await denyUnmanifested(limitations, token);
                    return true;
                },
                runKlvlCode: async function(code) {
                    if (!privileges.includes("RUN_KLVL_CODE")) throw new Error("UNAUTHORIZED_ACTION");
                    return eval(code);
                },
                cspOperation: async function(arg) {
                    if (!privileges.includes("CSP_OPERATIONS")) throw new Error("UNAUTHORIZED_ACTION");
                    return modules.csps[arg.cspProvider][arg.operation](arg.cspArgument, taskId);
                },
                availableCsps: async function() {
                    if (!privileges.includes("CSP_OPERATIONS")) throw new Error("UNAUTHORIZED_ACTION");
                    return Object.keys(modules.csps);
                },
                ufTimeCon: function(args) {
                    if (!privileges.includes("GET_LOCALE")) throw new Error("UNAUTHORIZED_ACTION");
                    return modules.userfriendliness.considerateTime(...args);
                },
                websocketOpen: async function(arg) {
                    if (!privileges.includes("WEBSOCKETS_OPEN")) throw new Error("UNAUTHORIZED_ACTION");
                    let handle = await modules.websocket.getHandle(arg);
                    websockets.push(handle);
                    modules.websocket.assertAccess({ handle, newACL: {
                        owner: user,
                        group: groups[0],
                        world: false
                    }});
                    return handle;
                },
                listenToWebsocket: async function(arg) {
                    if (!privileges.includes("WEBSOCKETS_LISTEN")) throw new Error("UNAUTHORIZED_ACTION");
                    let permissions = modules.websocket.assertAccess({ handle: arg.handle });
                    if (permissions.owner != user && !groups.includes(permissions.group) && !permissions.world && !privileges.includes("WEBSOCKET_BYPASS_PERMISSIONS") && !websockets.includes(arg.handle)) throw new Error("PERMISSION_DENIED");
                    return await modules.websocket.waitForEvent(arg);
                },
                sendToWebsocket: async function(arg) {
                    if (!privileges.includes("WEBSOCKETS_SEND")) throw new Error("UNAUTHORIZED_ACTION");
                    let permissions = modules.websocket.assertAccess({ handle: arg.handle });
                    if (permissions.owner != user && !groups.includes(permissions.group) && !permissions.world && !privileges.includes("WEBSOCKET_BYPASS_PERMISSIONS") && !websockets.includes(arg.handle)) throw new Error("PERMISSION_DENIED");
                    return await modules.websocket.send(arg);
                },
                closeWebsocket: async function(websocket) {
                    if (!websockets.includes(websocket)) throw new Error("NOT_OWN_WEBSOCKET");
                    websockets.splice(websockets.indexOf(websocket), 1);
                    return modules.websocket.close(websocket);
                },
                websocketInfo: async function(arg) {
                    if (!privileges.includes("WEBSOCKET_INFO")) throw new Error("UNAUTHORIZED_ACTION");
                    let permissions = modules.websocket.assertAccess({ handle: arg.handle });
                    if (permissions.owner != user && !groups.includes(permissions.group) && !permissions.world && !privileges.includes("WEBSOCKET_BYPASS_PERMISSIONS") && !websockets.includes(arg.handle)) throw new Error("PERMISSION_DENIED");
                    return await modules.websocket.getInfo(arg);
                },
                setWebsocketPermissions: async function(arg) {
                    if (!privileges.includes("WEBSOCKET_SET_PERMISSIONS")) throw new Error("UNAUTHORIZED_ACTION");
                    let permissions = modules.websocket.assertAccess({ handle: arg.handle });
                    if (permissions.owner != user && !groups.includes(permissions.group) && !permissions.world && !privileges.includes("WEBSOCKET_BYPASS_PERMISSIONS") && !websockets.includes(arg.handle)) throw new Error("PERMISSION_DENIED");
                    return await modules.websocket.assertAccess(arg);
                },
                getPublicSystemID: async function() {
                    if (!privileges.includes("IDENTIFY_SYSTEM")) throw new Error("UNAUTHORIZED_ACTION");
                    return (modules.core.prefs.read("system_id") || {}).public;
                },
                getPrivateSystemID: async function() {
                    if (!privileges.includes("IDENTIFY_SYSTEM_SENSITIVE")) throw new Error("UNAUTHORIZED_ACTION");
                    return (modules.core.prefs.read("system_id") || {}).private;
                },
                typeIntoOtherCLI: async function(arg) {
                    if (!privileges.includes("CLI_MODIFICATIONS")) throw new Error("UNAUTHORIZED_ACTION");
                    if (!modules.tasks.tracker.hasOwnProperty(arg.taskId)) throw new Error("TASK_NOT_FOUND");
                    let bypassWorks = modules.tasks.tracker[arg.taskId].apis.public.getProcessToken() == arg.bypass;
                    if (!bypassWorks) {
                        let taskInfo = await modules.tasks.taskInfo(arg.taskId);
                        if (taskInfo.runBy != user && !privileges.includes("TASK_BYPASS_PERMISSIONS")) throw new Error("PERMISSION_DENIED");
                    }
                    if (!modules.tasks.tracker[arg.taskId].cliio) throw new Error("NO_CLI_ATTACHED");
                    return await modules.tasks.tracker[arg.taskId].cliio.xtermInstance.input(arg.text, arg.human);
                },
                getOtherCLIData: async function(arg) {
                    if (!privileges.includes("CLI_MODIFICATIONS")) throw new Error("UNAUTHORIZED_ACTION");
                    if (!modules.tasks.tracker.hasOwnProperty(arg.taskId)) throw new Error("TASK_NOT_FOUND");
                    let bypassWorks = modules.tasks.tracker[arg.taskId].apis.public.getProcessToken() == arg.bypass;
                    if (!bypassWorks) {
                        let taskInfo = await modules.tasks.taskInfo(arg.taskId);
                        if (taskInfo.runBy != user && !privileges.includes("TASK_BYPASS_PERMISSIONS")) throw new Error("PERMISSION_DENIED");
                    }
                    if (!modules.tasks.tracker[arg.taskId].cliio) throw new Error("NO_CLI_ATTACHED");
                    return await modules.tasks.tracker[arg.taskId].cliio.signup();
                },
                waitForOtherCLI: async function(arg) {
                    if (!privileges.includes("CLI_MODIFICATIONS")) throw new Error("UNAUTHORIZED_ACTION");
                    if (!modules.tasks.tracker.hasOwnProperty(arg.taskId)) throw new Error("TASK_NOT_FOUND");
                    let bypassWorks = modules.tasks.tracker[arg.taskId].apis.public.getProcessToken() == arg.bypass;
                    if (!bypassWorks) {
                        let taskInfo = await modules.tasks.taskInfo(arg.taskId);
                        if (taskInfo.runBy != user && !privileges.includes("TASK_BYPASS_PERMISSIONS")) throw new Error("PERMISSION_DENIED");
                    }
                    if (modules.tasks.tracker[arg.taskId].cliio) return true;
                    return await modules.tasks.tracker[arg.taskId].cliio.attachedCLISignUp();
                },
                lldaRead: async function(arg) {
                    if (!privileges.includes("LLDISK_READ")) throw new Error("UNAUTHORIZED_ACTION");
                    return modules.core.disk.partition(arg.partition).getData();
                },
                lldaWrite: async function(arg) {
                    if (!privileges.includes("LLDISK_WRITE")) throw new Error("UNAUTHORIZED_ACTION");
                    return modules.core.disk.partition(arg.partition).setData(arg.data);
                },
                lldaList: async function() {
                    if (!privileges.includes("LLDISK_LIST_PARTITIONS")) throw new Error("UNAUTHORIZED_ACTION");
                    return modules.core.disk.partitions();
                },
                lldaInitPartitions: async function() {
                    if (!privileges.includes("LLDISK_INIT_PARTITIONS")) throw new Error("UNAUTHORIZED_ACTION");
                    return modules.core.disk.insertPartitionTable();
                },
                lldaRemove: async function(arg) {
                    if (!privileges.includes("LLDISK_REMOVE")) throw new Error("UNAUTHORIZED_ACTION");
                    return modules.core.disk.partition(arg.partition).remove();
                },
                lldaIDBRead: async function(arg) {
                    if (!privileges.includes("LLDISK_IDB_READ")) throw new Error("UNAUTHORIZED_ACTION");
                    return modules.core.idb.readPart(arg.key);
                },
                lldaIDBWrite: async function(arg) {
                    if (!privileges.includes("LLDISK_IDB_WRITE")) throw new Error("UNAUTHORIZED_ACTION");
                    return modules.core.idb.writePart(arg.key, arg.value);
                },
                lldaIDBRemove: async function(arg) {
                    if (!privileges.includes("LLDISK_IDB_REMOVE")) throw new Error("UNAUTHORIZED_ACTION");
                    return modules.core.idb.removePart(arg.key);
                },
                lldaIDBList: async function() {
                    if (!privileges.includes("LLDISK_IDB_LIST")) throw new Error("UNAUTHORIZED_ACTION");    
                    let idb_keys = modules.core.idb._db.transaction("disk").objectStore("disk").getAllKeys();
                    return new Promise(function(resolve) {
                        idb_keys.onsuccess = () => resolve(idb_keys.result);
                    });
                },
                lldaIDBSync: async function() {
                    if (!privileges.includes("LLDISK_IDB_SYNC")) throw new Error("UNAUTHORIZED_ACTION");
                    return modules.core.idb.sync();
                },
                fs_mount: async function(arg) {
                    if (!privileges.includes("FS_MOUNT")) throw new Error("UNAUTHORIZED_ACTION");
                    modules.fs.mounts[arg.mountpoint] = await modules.mounts[arg.filesystem](arg.filesystemOptions);
                },
                supportedFilesystems: async function() {
                    if (!privileges.includes("GET_FILESYSTEMS")) throw new Error("UNAUTHORIZED_ACTION");
                    return Object.keys(modules.mounts);
                },
                installedLocales: async function() {
                    if (!privileges.includes("GET_LOCALE")) throw new Error("UNAUTHORIZED_ACTION");
                    return Object.keys(modules.locales).filter(a => a != "get" && a != "defaultLocale");
                },
                runningServer: async function() {
                    if (!privileges.includes("GET_SERVER_URL")) throw new Error("UNAUTHORIZED_ACTION");
                    return location.origin;
                },
                fs_isDirectory: async function(arg) {
                    if (!privileges.includes("FS_READ")) throw new Error("UNAUTHORIZED_ACTION");
                    let {path, token} = arg;
                    return await fs_action("isDirectory", (fsPermissions) => fsPermissions.owner == user || fsPermissions.world.includes("r") || groups.includes(fsPermissions.group) || privileges.includes("FS_BYPASS_PERMISSIONS"), path, token || processToken);
                },
                automatedLogonCreate: async function(arg) {
                    let { desiredUser, token } = arg;
                    if (!privileges.includes("ELEVATE_PRIVILEGES")) throw new Error("UNAUTHORIZED_ACTION");
                    let automatedLogon = Array.from(crypto.getRandomValues(new Uint8Array(64))).reduce((a, b) => a + b.toString(16).padStart(2, "0"), "");
                    try {
                        let access = await modules.users.access(desiredUser, token || processToken);
                        access = await access.getNextPrompt();
                        automatedLogonSessions[automatedLogon] = access;
                    } catch {
                        throw new Error("AUTOMATED_LOGON_CREATE_FAILED")
                    }
                    return automatedLogon;
                },
                automatedLogonGet: async function(arg) {
                    if (!privileges.includes("ELEVATE_PRIVILEGES")) throw new Error("UNAUTHORIZED_ACTION");
                    try {
                        let sharedObj = { ...automatedLogonSessions[arg] };
                        delete sharedObj.input;
                        return sharedObj;
                    } catch (e) {
                        throw new Error("AUTOMATED_LOGON_GET_FAILED");
                    }
                },
                automatedLogonInput: async function(arg) {
                    let { session, input } = arg;
                    if (!privileges.includes("ELEVATE_PRIVILEGES")) throw new Error("UNAUTHORIZED_ACTION");
                    try {
                        automatedLogonSessions[session] = await automatedLogonSessions[session].input(input);
                    } catch {
                        throw new Error("AUTOMATED_LOGON_INPUT_FAILED");
                    }
                },
                automatedLogonDelete: async function(arg) {
                    if (!privileges.includes("ELEVATE_PRIVILEGES")) throw new Error("UNAUTHORIZED_ACTION");
                    delete automatedLogonSessions[arg];
                },
                setSystemMount: async function(arg) {
                    if (!privileges.includes("SET_DEFAULT_SYSTEM")) throw new Error("UNAUTHORIZED_ACTION");
                    modules.defaultSystem = arg;
                },
                usedRAM: async function() {
                    if (!privileges.includes("GET_SYSTEM_RESOURCES")) throw new Error("UNAUTHORIZED_ACTION");
                    try {
                        let mem = performance.memory;
                        return {
                            total: mem.jsHeapSizeLimit,
                            used: mem.usedJSHeapSize,
                            free: mem.jsHeapSizeLimit - mem.usedJSHeapSize
                        }
                    } catch {}
                    let mem = await performance.measureUserAgentSpecificMemory();
                    return {
                        total: Infinity,
                        used: mem.bytes,
                        free: Infinity
                    }
                },
                checkBootMode: async function() {
                    if (!privileges.includes("GET_BOOT_MODE")) throw new Error("UNAUTHORIZED_ACTION");
                    return modules.core.bootMode || "normal";
                },
                getScreenInfo: async function() {
                    if (!privileges.includes("GET_SCREEN_INFO")) throw new Error("UNAUTHORIZED_ACTION");
                    return {
                        width: document.documentElement.clientWidth,
                        height: document.documentElement.clientHeight,
                        colorDepth: screen.colorDepth,
                        orientation: {
                            type: screen.orientation.type,
                            angle: screen.orientation.angle
                        },
                        fullWidth: screen.width,
                        fullHeight: screen.height,
                        availWidth: screen.availWidth,
                        availHeight: screen.availHeight,
                    }
                },
                waitTermination: async function(arg) {
                    if (!privileges.includes("LIST_TASKS")) throw new Error("UNAUTHORIZED_ACTION");
                    return modules.tasks.waitTermination(arg);
                },
                consentGetToken: async function(params) {
                    if (modules.session.attrib(ses, "secureLock")) await modules.session.attrib(ses, "secureLock");
                    if (!privileges.includes("ELEVATE_PRIVILEGES")) throw new Error("UNAUTHORIZED_ACTION");
                    let { desiredUser, intent } = params;
                    if (!intent) throw new Error("INTENT_REQUIRED");
                    let releaseLock;
                    let lock = new Promise((resolve) => releaseLock = resolve);
                    modules.session.attrib(ses, "secureLock", lock);
                    let secureSession = await modules.session.mksession();

                    let dom = modules.session.tracker[secureSession].html;
                    let ogDom = modules.session.tracker[ses].html;
                    let bgfx = document.createElement("div");
                    bgfx.classList.add("session", "secure");
                    dom.appendChild(bgfx);
                    modules.session.attrib(secureSession, "dark", modules.session.attrib(ses, "dark"));
                    dom.style.background = ogDom.style.background;
                    dom.style.backgroundSize = "100% 100%";

                    modules.session.muteAllSessions();
                    modules.session.activateSession(secureSession);
                    let task = await modules.tasks.taskInfo(taskId);

                    let logonUI = await modules.consentui(secureSession, {
                        user: desiredUser,
                        path: task.file,
                        args: task.arg,
                        intent,
                        name: params.name
                    });
                    return new Promise(function(resolve) {
                        logonUI.hook(async function(result) {
                            releaseLock();
                            modules.session.attrib(ses, "secureLock", null);
                            modules.session.muteAllSessions();
                            modules.session.rmsession(secureSession);
                            modules.session.activateSession(ses);
                            if (result.success == false) return resolve(false);
                            return resolve(result.token);
                        });
                    });
                },
                networkPing: async function(address) {
                    if (!privileges.includes("PCOS_NETWORK_PING")) throw new Error("UNAUTHORIZED_ACTION");
                    let websocketHandle = await modules.fs.read("ram/run/network.ws", processToken);
                    if (!websocketHandle) throw new Error("NETWORK_UNREACHABLE");
                    let websocket = modules.websocket._handles[websocketHandle].ws;
                    if (websocket.readyState != 1) throw new Error("NETWORK_UNREACHABLE");
                    return new Promise(async function(resolve, reject) {
                        let packetId = Array.from(crypto.getRandomValues(new Uint8Array(32))).map(a => a.toString(16).padStart(2, "0")).join("");
                        let resend = Array.from(crypto.getRandomValues(new Uint8Array(32))).map(a => a.toString(16).padStart(2, "0")).join("");
                        websocket.addEventListener("message", function self(e) {
                            try {
                                let data = JSON.parse(e.data);
                                if (data.packetID == packetId && data.event == "AddressUnreachable") reject(new Error("ADDRESS_UNREACHABLE"));
                                if (data.from == address && data.data.type == "pong" && data.data.resend == resend) resolve("success");
                            } catch {}
                        });
                        websocket.send(JSON.stringify({
                            receiver: address,
                            data: {
                                type: "ping",
                                resend: resend
                            },
                            id: packetId
                        }))
                    });
                },
                logOut: async function(desiredUser) {
                    if (desiredUser != user && !privileges.includes("LOGOUT_OTHERS")) throw new Error("UNAUTHORIZED_ACTION");
                    if (desiredUser == user && !privileges.includes("LOGOUT")) throw new Error("UNAUTHORIZED_ACTION");
                    if (modules.session.active != ses && !privileges.includes("LOGOUT_OTHER")) throw new Error("UNAUTHORIZED_ACTION");
                    await modules.logOut(desiredUser);
                },
                lock: async function() {
                    if (modules.session.active == ses && !privileges.includes("LOGOUT")) throw new Error("UNAUTHORIZED_ACTION");
                    if (modules.session.active != ses && !privileges.includes("LOGOUT_OTHER")) throw new Error("UNAUTHORIZED_ACTION");
                    modules.session.muteAllSessions();
                    modules.session.activateSession(modules.session.systemSession);
                }
            }
        }
        let customAPIs = modules.customAPIs;
        if (customAPIs) {
            for (let api in (customAPIs.public || {})) apis.public[api] = async (...args) => customAPIs.public[api](processToken, ...args);
            for (let api in (customAPIs.private || {})) apis.private[api] = async (...args) => customAPIs.private[api](processToken, ...args);
        }
        return apis;
    }
}
reeAPIs();