// =====BEGIN MANIFEST=====
// signer: automaticSigner
// allow: FS_READ, FS_LIST_PARTITIONS, IPC_SEND_PIPE, IPC_LISTEN_PIPE, GET_LOCALE, GET_THEME, FS_BYPASS_PERMISSIONS, SYSTEM_SHUTDOWN, GET_USER_INFO, LOGOUT, GET_SCREEN_INFO, GRAB_ATTENTION
// =====END MANIFEST=====
let ipcChannel = exec_args[0];
let shouldShutdown = false;
let visibilityState = true;
(async function() {
    // @pcos-app-mode isolatable
    if (!ipcChannel) return availableAPIs.terminate();
    await visibility(false);
    await window.availableAPIs.windowTitleSet(await window.availableAPIs.lookupLocale("START_MENU"));
    document.body.style.fontFamily = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
    if (await availableAPIs.isDarkThemed()) document.body.style.color = "white";
    let privileges = await availableAPIs.getPrivileges();
    let checklist = [ "FS_READ", "FS_LIST_PARTITIONS", "IPC_SEND_PIPE", "IPC_LISTEN_PIPE" ];
    if (!checklist.every(p => privileges.includes(p))) {
        return availableAPIs.terminate();
    }
    await availableAPIs.sendToPipe({ pipe: ipcChannel, data: { success: true } });    
    document.body.innerText = "";
    let logoutButton = document.createElement("button");
    logoutButton.innerText = (await availableAPIs.lookupLocale("LOG_OUT_BUTTON")).replace("%s", await availableAPIs.getUser());
    document.body.appendChild(logoutButton);
    logoutButton.onclick = async function() {
        shouldShutdown = true;
        await visibility(false);
        await availableAPIs.logOut(await availableAPIs.getUser());
    }
    let lockButton = document.createElement("button");
    lockButton.innerText = await availableAPIs.lookupLocale("LOCK_BUTTON");
    document.body.appendChild(lockButton);
    lockButton.onclick = async function() {
        await visibility(false);
        await availableAPIs.lock();
    }
    if (privileges.includes("SYSTEM_SHUTDOWN")) {
        let shutoff = document.createElement("button");
        shutoff.innerText = await availableAPIs.lookupLocale("TURN_OFF_BUTTON");
        document.body.appendChild(shutoff);
        shutoff.onclick = async function() {
            shouldShutdown = true;
            await visibility(false);
            await availableAPIs.shutdown({ isReboot: false });
        }
        let reboot = document.createElement("button");
        reboot.innerText = await availableAPIs.lookupLocale("RESTART_BUTTON");
        document.body.appendChild(reboot);
        reboot.onclick = async function() {
            shouldShutdown = true;
            await visibility(false);
            await availableAPIs.shutdown({ isReboot: true });
        }
    }
    try {
        let enumeration = await availableAPIs.fs_ls({ path: (await availableAPIs.getSystemMount()) + "/apps/links" });
        for (let app of enumeration) {
            let appLink = await availableAPIs.fs_read({ path: (await availableAPIs.getSystemMount()) + "/apps/links/" + app });
            appLink = JSON.parse(appLink);
            if (appLink.disabled) continue;
            let appBtn = document.createElement("button");
            appBtn.innerText = (appLink.localeReferenceName ? await availableAPIs.lookupLocale(appLink.localeReferenceName) : null) || (appLink.localeDatabaseName ? (appLink.localeDatabaseName[navigator.language.slice(0, 2).toLowerCase()] || appLink.localeDatabaseName[await availableAPIs.osLocale()]) : null) || appLink.name;
            appBtn.title = await availableAPIs.lookupLocale("PROVISIONED_PREFERENCE");
            appBtn.onclick = async function() {
                await visibility(false);
                await availableAPIs.sendToPipe({ pipe: ipcChannel, data: { run: appLink } });
            }
            document.body.appendChild(appBtn);
        }
    } catch (e) {
        console.error(e);
    }
    try {
        let enumeration = await availableAPIs.fs_ls({ path: (await availableAPIs.getUserInfo({ desiredUser: await availableAPIs.getUser() })).homeDirectory + "/.applinks" });
        for (let app of enumeration) {
            let appLink = await availableAPIs.fs_read({ path: (await availableAPIs.getUserInfo({ desiredUser: await availableAPIs.getUser() })).homeDirectory + "/.applinks/" + app });
            appLink = JSON.parse(appLink);
            if (appLink.disabled) continue;
            let appBtn = document.createElement("button");
            appBtn.innerText = (appLink.localeReferenceName ? await availableAPIs.lookupLocale(appLink.localeReferenceName) : null) || (appLink.localeDatabaseName ? (appLink.localeDatabaseName[navigator.language.slice(0, 2).toLowerCase()] || appLink.localeDatabaseName[await availableAPIs.osLocale()]) : null) || appLink.name;
            appBtn.onclick = async function() {
                await visibility(false);
                await availableAPIs.sendToPipe({ pipe: ipcChannel, data: { run: appLink } });
            }
            document.body.appendChild(appBtn);
        }
    } catch (e) {
        console.error(e);
    }

    onresize = shapeshift;

    while (true) {
        let listen = await availableAPIs.listenToPipe(ipcChannel);
        if (listen.open) {
            await visibility();
            shapeshift();
        }
    }
})();

async function visibility(wantedState) {
    if (!wantedState) wantedState = !visibilityState;
    if (wantedState == visibilityState) return;
    await availableAPIs.windowVisibility(wantedState);
    visibilityState = wantedState;
}

async function shapeshift() {
    let screenInfo = await availableAPIs.getScreenInfo();
    let winSize = await availableAPIs.windowSize();
    await availableAPIs.windowRelocate([ screenInfo.height - (winSize.height / 2) - 35 - 8, winSize.width / 2 + 8 ]);
}

addEventListener("signal", async function(e) {
    if (e.detail == 15) {
        await visibility(false);
        await availableAPIs.sendToPipe({ pipe: ipcChannel, data: { dying: true } });
        await availableAPIs.terminate();
    }
}); null;