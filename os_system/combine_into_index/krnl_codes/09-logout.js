async function logOut(target) {
    let liu = modules.liu;
    let session = liu[target].session;
    let token = liu[target].logon.token;
    clearInterval(liu[target].clockInterval);
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
    delete modules.liu[target];
    await modules.tokens.revoke(token);
    await modules.session.rmsession(session);
}

modules.logOut = logOut;