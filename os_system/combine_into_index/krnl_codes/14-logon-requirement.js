async function requireLogon() {
    // @pcos-app-mode native
    try {
        let startupSoundPerm = await modules.fs.permissions(modules.defaultSystem + "/etc/sounds/startup.aud");
        if (!startupSoundPerm.world.includes("r")) throw new Error("Not allowed to read startup.aud");
        let startupSound = await modules.fs.read(modules.defaultSystem + "/etc/sounds/startup.aud");
        let startupAudio = new Audio();
        startupAudio.src = startupSound;
        startupAudio.play();
    } catch (e) {
        console.error(e);
    }
    let liu = {};
    modules.liu = liu;
    serviceLogon();
    let insertedLockMessage = false;
    while (!modules.shuttingDown) {
        let useDefaultUser = await modules.fs.permissions(modules.defaultSystem + "/etc/security/automaticLogon");
        useDefaultUser = !useDefaultUser.world.includes("w") && useDefaultUser.owner == "root" && useDefaultUser.group == "root";
        let defaultUser;
        try {
            if (useDefaultUser) defaultUser = await modules.fs.read(modules.defaultSystem + "/etc/security/automaticLogon");
        } catch {}
        let sysDom = modules.session.tracker[modules.session.systemSession].html;
        let lockWallpaper = "";
        let lockIsDark = false;
        try {
            lockWallpaper = await modules.fs.read(modules.defaultSystem + "/etc/wallpapers/lockscreen.pic");
        } catch (e) {
            console.error(e);
        }
        try {
            lockIsDark = (await modules.fs.read(modules.defaultSystem + "/etc/darkLockScreen")) == "true";
        } catch (e) {
            console.error(e);
        }
        if (modules.core.bootMode == "safe") {
            lockIsDark = true;
            lockWallpaper = "";
            if (!insertedLockMessage) {
                insertedLockMessage = true;
                let message = document.createElement("span");
                message.innerText = modules.locales.get("SAFE_MODE_MSG");
                message.style = "position: absolute; right: 8px; bottom: 8px; color: white;";
                sysDom.appendChild(message);
                let message2 = document.createElement("span");
                message2.innerText = modules.locales.get("SAFE_MODE_MSG");
                message2.style = "position: absolute; top: 8px; left: 8px; color: white;";
                sysDom.appendChild(message2);
            }
        }
        sysDom.style.background = "url(" + JSON.stringify(lockWallpaper) + ")";
        if (modules.core.bootMode == "safe") sysDom.style.background = "black";
        sysDom.style.backgroundSize = "100% 100%";
        modules.session.attrib(modules.session.systemSession, "dark", lockIsDark);
        let logon, resolvedLogon;
        while (!modules.shuttingDown) {
            logon = await modules.authui(modules.session.systemSession, defaultUser, undefined, true);
            resolvedLogon = await waitForLogon(logon);
            if (resolvedLogon.success) break;
        }
        if (!resolvedLogon.success) break;
        modules.session.muteAllSessions();
        let userInfo = await modules.tokens.info(resolvedLogon.token);
        let session;
        let liuUser = userInfo.user;
        let wasLiuLoaded = false;
        if (liu.hasOwnProperty(userInfo.user)) {
            session = liu[userInfo.user].session;
            await modules.tokens.revoke(resolvedLogon.token);
            resolvedLogon = liu[userInfo.user].logon;
            userInfo = await modules.tokens.info(resolvedLogon.token);
            wasLiuLoaded = true;
        } else {
            session = modules.session.mksession();
            liu[userInfo.user] = {
                session,
                logon: resolvedLogon,
            }
        }
        modules.session.activateSession(session);
        let dom = modules.session.tracker[session].html;
        let bgPic = "";
        let isDark = false;
        try {
            let permissions = await modules.fs.permissions((await modules.users.getUserInfo(userInfo.user)).homeDirectory + "/.wallpaper", resolvedLogon.token);
            if (permissions.owner != userInfo.user && !userInfo.groups.includes(permissions.group) && !(permissions.world.includes("r") && permissions.world.includes("x")) && !userInfo.privileges.includes("FS_BYPASS_PERMISSIONS")) {
                throw new Error("Permission denied reading wallpaper");
            }
            bgPic = await modules.fs.read((await modules.users.getUserInfo(userInfo.user)).homeDirectory + "/.wallpaper", resolvedLogon.token);
        } catch (e) {
            console.error(e);
        }
        try {
            let permissionsdm = await modules.fs.permissions((await modules.users.getUserInfo(userInfo.user)).homeDirectory + "/.darkmode", resolvedLogon.token);
            if (permissionsdm.owner != userInfo.user && !userInfo.groups.includes(permissionsdm.group) && !(permissionsdm.world.includes("r") && permissionsdm.world.includes("x")) && !userInfo.privileges.includes("FS_BYPASS_PERMISSIONS")) {
                throw new Error("Permission denied reading dark mode preference");
            }
            isDark = (await modules.fs.read((await modules.users.getUserInfo(userInfo.user)).homeDirectory + "/.darkmode", resolvedLogon.token)) == "true";
        } catch (e) {
            console.error(e);
        }
        if (modules.core.bootMode == "safe") {
            isDark = true;
            if (!wasLiuLoaded) {
                let message = document.createElement("span");
                message.innerText = modules.locales.get("SAFE_MODE_MSG");
                message.style = "position: absolute; right: 8px; bottom: 8px; color: white;";
                dom.appendChild(message);
                let message2 = document.createElement("span");
                message2.innerText = modules.locales.get("SAFE_MODE_MSG");
                message2.style = "position: absolute; top: 8px; left: 8px; color: white;";
                dom.appendChild(message2);
            }
            bgPic = "";
        }
        modules.session.attrib(session, "dark", isDark);
        dom.style.background = "url(" + JSON.stringify(bgPic) + ")";
        if (modules.core.bootMode == "safe") dom.style.background = "black";
        dom.style.backgroundSize = "100% 100%";
        async function logOut() {
            await modules.session.muteAllSessions();
            await modules.session.activateSession(modules.session.systemSession);
            let loggingOutWindow = modules.window(modules.session.systemSession, true);
            loggingOutWindow.title.innerText = modules.locales.get("LOGGING_OUT");
            loggingOutWindow.content.style.padding = "8px";
            loggingOutWindow.closeButton.disabled = true;
            loggingOutWindow.content.innerText = modules.locales.get("LOGGING_OUT");
            let taskList = modules.session.attrib(session, "openReeWindows") || [];
            let timeout = (ms) => new Promise(resolve => setTimeout(resolve, ms));
            function allProcessesClosed() {
                return new Promise(function(resolve) {
                    let int = setInterval(function() {
                        taskList = modules.session.attrib(session, "openReeWindows") || [];
                        if (Object.keys(taskList).length == 0) {
                            resolve();
                            clearInterval(int);
                        }
                    })
                });
            }
            loggingOutWindow.content.innerText = modules.locales.get("POLITE_CLOSE_SIGNAL");
            for (let taskId of taskList) modules.tasks.sendSignal(taskId, 15);
            await Promise.race([
                timeout(5000),
                allProcessesClosed()
            ]);
            loggingOutWindow.content.innerText = modules.locales.get("ABRUPT_CLOSE_SIGNAL");
            taskList = modules.session.attrib(session, "openReeWindows") || [];
            for (let taskId of taskList) modules.tasks.sendSignal(taskId, 9);
            await allProcessesClosed();
            loggingOutWindow.windowDiv.remove();
            delete liu[liuUser];
            await modules.tokens.revoke(resolvedLogon.token);
            await modules.session.rmsession(session);
        }
        let autoRunNecessities = [];
        let autorunNecessityFailure = false;
        try {
            let autoRunPermissions = await modules.fs.permissions((await modules.users.getUserInfo(userInfo.user)).homeDirectory + "/.autorunNecessity", resolvedLogon.token);
            if (autoRunPermissions.owner != userInfo.user && !userInfo.groups.includes(autoRunPermissions.group) && !(autoRunPermissions.world.includes("r") && autoRunPermissions.world.includes("x")) && !userInfo.privileges.includes("FS_BYPASS_PERMISSIONS")) {
                throw new Error("Permission denied reading autorun necessities");
            }
            if (modules.core.bootMode != "safe") autoRunNecessities = await modules.fs.ls((await modules.users.getUserInfo(userInfo.user)).homeDirectory + "/.autorunNecessity", resolvedLogon.token);
        } catch (e) {
            console.error(e);
        }
        function breakNecessityFailure() {
            let failureMessage = modules.window(session);
            autorunNecessityFailure = true;
            failureMessage.title.innerText = modules.locales.get("PERMISSION_DENIED");
            failureMessage.content.style.padding = "8px";
            failureMessage.content.innerText = modules.locales.get("AUTORUN_NECESSITIES_FAILED");
            failureMessage.closeButton.onclick = async function() {
                failureMessage.windowDiv.remove();
                logOut();
            }
        }
        for (let autoRunNecessity of autoRunNecessities) {
            let necessityPermissions = await modules.fs.permissions((await modules.users.getUserInfo(userInfo.user)).homeDirectory + "/.autorunNecessity/" + autoRunNecessity, resolvedLogon.token);
            if (necessityPermissions.owner != userInfo.user && !userInfo.groups.includes(necessityPermissions.group) && !(necessityPermissions.world.includes("r") && necessityPermissions.world.includes("x")) && !userInfo.privileges.includes("FS_BYPASS_PERMISSIONS")) {
                breakNecessityFailure();
                break;
            }
            let link = await modules.fs.read((await modules.users.getUserInfo(userInfo.user)).homeDirectory + "/.autorunNecessity/" + autoRunNecessity, resolvedLogon.token);
            try {
                link = JSON.parse(link);
            } catch (e) {
                console.error(e);
                breakNecessityFailure();
                break;
            }
            if (link.disabled) continue;
            try {
                let ipcPipe = modules.ipc.create();
                modules.ipc.declareAccess(ipcPipe, {
                    owner: userInfo.user,
                    group: userInfo.groups[0],
                    world: false
                });
                let forkedToken = await modules.tokens.fork(resolvedLogon.token);
                let appWindow = modules.window(session);
                let ipcResult = modules.ipc.listenFor(ipcPipe);
                let taskId = await modules.tasks.exec(link.path, [ ...(link.args || []), ipcPipe ], appWindow, forkedToken, true);
                let finishTaskPromise = new Promise(function(resolve) {
                    modules.tasks.tracker[taskId].ree.beforeCloseDown(() => resolve());
                })
                ipcResult = await Promise.race([ipcResult, finishTaskPromise]);
                if (!ipcResult) throw new Error("Software rejected autorun necessity.");
                if (modules.tasks.tracker.hasOwnProperty(taskId)) await modules.tasks.sendSignal(taskId, 9);
            } catch (e) {
                console.error(e);
                breakNecessityFailure();
                break;
            }
        }
        
        let autoRun = [];
        try {
            let autoRunPermissions = await modules.fs.permissions((await modules.users.getUserInfo(userInfo.user)).homeDirectory + "/.autorun", resolvedLogon.token);
            if (autoRunPermissions.owner != userInfo.user && !userInfo.groups.includes(autoRunPermissions.group) && !(autoRunPermissions.world.includes("r") && autoRunPermissions.world.includes("x")) && !userInfo.privileges.includes("FS_BYPASS_PERMISSIONS")) {
                throw new Error("Permission denied reading autorun");
            }
            if (modules.core.bootMode != "safe" && !autorunNecessityFailure) autoRun = await modules.fs.ls((await modules.users.getUserInfo(userInfo.user)).homeDirectory + "/.autorun", resolvedLogon.token);
        } catch (e) {
            console.error(e);
        }
        for (let autoRunFile of autoRun) {
            let autoRunItemPermissions = await modules.fs.permissions((await modules.users.getUserInfo(userInfo.user)).homeDirectory + "/.autorun/" + autoRunFile, resolvedLogon.token);
            if (autoRunItemPermissions.owner != userInfo.user && !userInfo.groups.includes(autoRunItemPermissions.group) && !(autoRunItemPermissions.world.includes("r") && autoRunItemPermissions.world.includes("x")) && !userInfo.privileges.includes("FS_BYPASS_PERMISSIONS")) continue;
            let link = await modules.fs.read((await modules.users.getUserInfo(userInfo.user)).homeDirectory + "/.autorun/" + autoRunFile, resolvedLogon.token);
            try {
                link = JSON.parse(link);
            } catch {}
            if (link.disabled) continue;
            try {
                let forkedToken = await modules.tokens.fork(resolvedLogon.token);
                let appWindow = modules.window(session);
                await modules.tasks.exec(link.path, [ ...(link.args || []) ], appWindow, forkedToken);
            } catch {}
        }
        let startButton = document.createElement("button");
        startButton.innerText = modules.locales.get("START_MENU_BTN");
        startButton.style = "padding: 4px;";
        startButton.onclick = async function() {
            let startMenu = modules.window(session);
            startMenu.title.innerText = modules.locales.get("START_MENU");
            startMenu.content.style.padding = "8px";
            startMenu.closeButton.onclick = () => startMenu.windowDiv.remove();
            let logoutButton = document.createElement("button");
            logoutButton.innerText = modules.locales.get("LOG_OUT_BUTTON").replace("%s", userInfo.user);
            startMenu.content.appendChild(logoutButton);
            logoutButton.onclick = function() {
                startMenu.windowDiv.remove();
                logOut();
            }
            let lockButton = document.createElement("button");
            lockButton.innerText = modules.locales.get("LOCK_BUTTON");
            startMenu.content.appendChild(lockButton);
            lockButton.onclick = async function() {
                startMenu.windowDiv.remove();
                await modules.session.muteAllSessions();
                await modules.session.activateSession(modules.session.systemSession);
            }
            if (userInfo.privileges.includes("SYSTEM_SHUTDOWN")) {
                let shutoff = document.createElement("button");
                shutoff.innerText = modules.locales.get("TURN_OFF_BUTTON");
                startMenu.content.appendChild(shutoff);
                shutoff.onclick = async function() {
                    startMenu.windowDiv.remove();
                    modules.restart(true, resolvedLogon.token);
                }
                let reboot = document.createElement("button");
                reboot.innerText = modules.locales.get("RESTART_BUTTON");
                startMenu.content.appendChild(reboot);
                reboot.onclick = async function() {
                    startMenu.windowDiv.remove();
                    modules.restart(false, resolvedLogon.token);
                }
            }
            try {
                let permissions = await modules.fs.permissions(modules.defaultSystem + "/apps/links", resolvedLogon.token);
                if (permissions.owner != userInfo.user && !userInfo.groups.includes(permissions.group) && !(permissions.world.includes("r") && permissions.world.includes("x")) && !userInfo.privileges.includes("FS_BYPASS_PERMISSIONS")) {
                    throw new Error("Permission denied reading /apps");
                }
                let enumeration = await modules.fs.ls(modules.defaultSystem + "/apps/links", resolvedLogon.token);
                for (let app of enumeration) {
                    let permissions = await modules.fs.permissions(modules.defaultSystem + "/apps/links/" + app, resolvedLogon.token);
                    if (permissions.owner != userInfo.user && !userInfo.groups.includes(permissions.group) && !(permissions.world.includes("r") && permissions.world.includes("x")) && !userInfo.privileges.includes("FS_BYPASS_PERMISSIONS")) continue;
                    let appLink = await modules.fs.read(modules.defaultSystem + "/apps/links/" + app, resolvedLogon.token);
                    appLink = JSON.parse(appLink);
                    if (appLink.disabled) continue;
                    let appBtn = document.createElement("button");
                    appBtn.innerText = (appLink.localeReferenceName ? modules.locales.get(appLink.localeReferenceName) : null) || (appLink.localeDatabaseName ? (appLink.localeDatabaseName[navigator.language.slice(0, 2).toLowerCase()] || appLink.localeDatabaseName[modules.locales.defaultLocale]) : null) || appLink.name;
                    appBtn.title = modules.locales.get("PROVISIONED_PREFERENCE");
                    appBtn.onclick = async function() {
                        startMenu.windowDiv.remove();
                        let forkedToken = await modules.tokens.fork(resolvedLogon.token);
                        let appWindow = modules.window(session);
                        await modules.tasks.exec(appLink.path, [ ...(appLink.args || []) ], appWindow, forkedToken);
                    }
                    startMenu.content.appendChild(appBtn);
                }
            } catch (e) {
                console.error(e);
            }
            try {
                let permissions = await modules.fs.permissions((await modules.users.getUserInfo(userInfo.user)).homeDirectory + "/.applinks", resolvedLogon.token);
                if (permissions.owner != userInfo.user && !userInfo.groups.includes(permissions.group) && !(permissions.world.includes("r") && permissions.world.includes("x")) && !userInfo.privileges.includes("FS_BYPASS_PERMISSIONS")) {
                    throw new Error("Permission denied reading " + (await modules.users.getUserInfo(userInfo.user)).homeDirectory + "/.applinks");
                }
                let enumeration = await modules.fs.ls((await modules.users.getUserInfo(userInfo.user)).homeDirectory + "/.applinks", resolvedLogon.token);
                for (let app of enumeration) {
                    let permissions = await modules.fs.permissions((await modules.users.getUserInfo(userInfo.user)).homeDirectory + "/.applinks/" + app, resolvedLogon.token);
                    if (permissions.owner != userInfo.user && !userInfo.groups.includes(permissions.group) && !(permissions.world.includes("r") && permissions.world.includes("x")) && !userInfo.privileges.includes("FS_BYPASS_PERMISSIONS")) continue;
                    let appLink = await modules.fs.read((await modules.users.getUserInfo(userInfo.user)).homeDirectory + "/.applinks/" + app, resolvedLogon.token);
                    appLink = JSON.parse(appLink);
                    if (appLink.disabled) continue;
                    let appBtn = document.createElement("button");
                    appBtn.innerText = (appLink.localeReferenceName ? modules.locales.get(appLink.localeReferenceName) : null) || (appLink.localeDatabaseName ? (appLink.localeDatabaseName[navigator.language.slice(0, 2).toLowerCase()] || appLink.localeDatabaseName[modules.locales.defaultLocale]) : null) || appLink.name;
                    appBtn.onclick = async function() {
                        startMenu.windowDiv.remove();
                        let forkedToken = await modules.tokens.fork(resolvedLogon.token);
                        let appWindow = modules.window(session);
                        await modules.tasks.exec(appLink.path, [ ...(appLink.args || []) ], appWindow, forkedToken);
                    }
                    startMenu.content.appendChild(appBtn);
                }
            } catch (e) {
                console.error(e);
            }
        }
        if (!wasLiuLoaded && !autorunNecessityFailure) {
            let taskbar = document.createElement("div");
            let clock = document.createElement("span");
            taskbar.className = "taskbar";
            clock.className = "clock";

            liu[liuUser].clockInterval = setInterval(function() {
                clock.innerText = new Date().toTimeString().split(" ")[0];
            }, 500);
            
            taskbar.appendChild(startButton);
            taskbar.appendChild(clock);
            dom.appendChild(taskbar);
        }
        if (useDefaultUser && defaultUser) {
            let newWindow = modules.window(modules.session.systemSession);
            newWindow.title.innerText = modules.locales.get("LOG_IN_INVITATION");
            let button = document.createElement("button");
            button.innerText = modules.locales.get("LOG_IN_INVITATION");
            newWindow.content.appendChild(button);
            newWindow.closeButton.classList.toggle("hidden", true);
            await hookButtonClick(button);
            newWindow.windowDiv.remove();
        }
    }
}

async function serviceLogon() {
    let session = modules.session.mksession();
    modules.session.attrib(session, "dark", true);
    let dom = modules.session.tracker[session].html;
    dom.style.backgroundColor = "black";
    let message = document.createElement("span");
    message.innerText = "Service Desktop";
    message.style = "position: absolute; right: 8px; bottom: 8px; color: white;";
    dom.appendChild(message);
    let startButton = document.createElement("button");
    startButton.innerText = modules.locales.get("START_MENU_BTN");
    startButton.style = "padding: 4px;";
    startButton.onclick = async function() {
        let startMenu = modules.window(session);
        startMenu.title.innerText = modules.locales.get("START_MENU");
        startMenu.content.style.padding = "8px";
        startMenu.closeButton.onclick = () => startMenu.windowDiv.remove();
        let lockButton = document.createElement("button");
        lockButton.innerText = modules.locales.get("LOCK_BUTTON");
        startMenu.content.appendChild(lockButton);
        lockButton.onclick = async function() {
            startMenu.windowDiv.remove();
            await modules.session.muteAllSessions();
            await modules.session.activateSession(modules.session.systemSession);
        }
    }
    let taskbar = document.createElement("div");
    let clock = document.createElement("span");
    taskbar.className = "taskbar";
    clock.className = "clock";

    setInterval(function() {
        clock.innerText = new Date().toTimeString().split(" ")[0];
    }, 500);

    taskbar.appendChild(startButton);
    taskbar.appendChild(clock);
    dom.appendChild(taskbar);
    modules.serviceSession = session;
    if (modules.core.bootMode != "safe") {
        let seedToken = await modules.tokens.generate();
        await modules.tokens.userInitialize(seedToken, "root");
        let serviceList = [],
            servicePrms;
        try {
            servicePrms = await modules.fs.permissions(modules.defaultSystem + "/apps/services", seedToken);
        } catch (e) {
            console.error("Failed to get permissions for service list:", e);
            return;
        }
        if (servicePrms.world.includes("w") || servicePrms.owner !== "root" || servicePrms.group !== "root") return console.error("Too free permissions for service list.");
        try {
            serviceList = await modules.fs.ls(modules.defaultSystem + "/apps/services", seedToken);
        } catch (e) {
            console.error("Failed to list services:", e);
        }
        for (let service of serviceList) {
            let serviceConfig;
            try {
                serviceConfig = await modules.fs.read(modules.defaultSystem + "/apps/services/" + service, seedToken);
                serviceConfig = JSON.parse(serviceConfig);
            } catch (e) {
                console.error("Failed to read service config of", service, ":", e);
                continue;
            }
            if (serviceConfig.disabled) continue;
            let forkedToken = await modules.tokens.fork(seedToken);
            if (serviceConfig.runAs) await modules.tokens.userInitialize(forkedToken, serviceConfig.runAs);
            let serviceName = (serviceConfig.localeReferenceName ? modules.locales.get(serviceConfig.localeReferenceName) : null) || (serviceConfig.localeDatabaseName ? (serviceConfig.localeDatabaseName[navigator.language.slice(0, 2).toLowerCase()] || serviceConfig.localeDatabaseName[modules.locales.defaultLocale]) : null) || serviceConfig.name;
            try {
                await modules.tasks.exec(serviceConfig.path, [ ...(serviceConfig.args || []) ], modules.window(session), forkedToken, true);
            } catch (e) {
                console.error("Failed to start service", serviceName, "(", service, "):", e);
            }
        }
    }
}

function waitForLogon(toHook) {
    return new Promise(function(resolve) {
        toHook.hook(resolve);
    });
}

async function hookButtonClick(button) {
    return new Promise(function(resolve) {
        button.onclick = (e) => resolve(e);
    });
}