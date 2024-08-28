async function authui(ses = modules.session.active, user, token) {
    // @pcos-app-mode native
    if (modules.shuttingDown) return { hook: _ => _ };
    let appToken;
    if (token) appToken = modules.tokens.fork(token);
    else {
        appToken = await modules.tokens.generate();
        await modules.tokens.userInitialize(appToken, "authui");
    }
    let hook = new Function();
    let ipc = await modules.ipc.create();
    modules.ipc.declareAccess(ipc, { owner: "authui", group: "authui", world: false });
    await modules.tasks.exec(modules.defaultSystem + "/apps/authui.js", [ ipc, user || "" ], modules.window(ses), appToken);
    async function waitForIt() {
        let msg = await modules.ipc.listenFor(ipc);
        delete modules.ipc._ipc[ipc];
        hook(msg);
    }
    waitForIt();
    return { hook: (e) => hook = e };
}
modules.authui = authui;