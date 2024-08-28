function restartLoad() {
    // @pcos-app-mode native
    function timeout(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    function allProcessesClosed() {
        return new Promise(function(resolve) {
            let int = setInterval(function() {
                if (Object.keys(modules.tasks.tracker).length == 0) {
                    resolve();
                    clearInterval(int);
                }
            })
        });
    }
    
    async function restart(noAutomaticReload = false, token) {
        try {
            let shutdownSoundPerm = await modules.fs.permissions(modules.defaultSystem + "/etc/sounds/shutdown.aud");
            if (!shutdownSoundPerm.world.includes("r")) throw new Error("Not allowed to read shutdown.aud");
            let shutdownSound = await modules.fs.read(modules.defaultSystem + "/etc/sounds/shutdown.aud");
            let shutdownAudio = new Audio();
            shutdownAudio.src = shutdownSound;
            shutdownAudio.play();
        } catch (e) {
            console.error(e);
        }
        modules.shuttingDown = true;
        let window = modules.window;
        let fs = modules.fs;
        let tasks = modules.tasks;
        modules.session.muteAllSessions();
        modules.session.activateSession(modules.session.systemSession);
        let windowDiv = window(modules.session.systemSession, true);
        windowDiv.closeButton.disabled = true;
        windowDiv.title.innerText = modules.locales.get("PCOS_RESTARTING").replace("%s", "");
        windowDiv.content.style.padding = "8px";
        let description = document.createElement("p");
        description.innerText = modules.locales.get("PCOS_RESTARTING").replace("%s",  modules.locales.get("PLEASE_WAIT"));
        windowDiv.content.appendChild(description);
        description.innerText = modules.locales.get("PCOS_RESTARTING").replace("%s",  modules.locales.get("POLITE_CLOSE_SIGNAL"));
        for (let taskId in tasks.tracker) tasks.sendSignal(taskId, 15);
        await Promise.race([
            timeout(5000),
            allProcessesClosed()
        ]);
        description.innerText = modules.locales.get("PCOS_RESTARTING").replace("%s",  modules.locales.get("ABRUPT_CLOSE_SIGNAL"));
        for (let taskId in tasks.tracker) tasks.sendSignal(taskId, 9, true);
        await allProcessesClosed();
        description.innerText = modules.locales.get("PCOS_RESTARTING").replace("%s",  modules.locales.get("UNMOUNTING_MOUNTS"));
        for (let mount in fs.mounts) await fs.unmount(mount, token);
        description.innerText = modules.locales.get("PCOS_RESTARTING").replace("%s",  modules.locales.get("RESTARTING"));
        modules.killSystem();
        if (!noAutomaticReload) return location.reload()
        description.innerText = modules.locales.get("SAFE_TO_CLOSE");
        let button = document.createElement("button");
        button.innerText = modules.locales.get("RESTART_BUTTON");
        button.onclick = function() {
            description.innerText = modules.locales.get("PCOS_RESTARTING").replace("%s",  modules.locales.get("RESTARTING"));
            button.remove();
            location.reload();
        }
        windowDiv.content.appendChild(button);
    }
    
    modules.restart = restart;
}

restartLoad();