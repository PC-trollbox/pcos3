async function authui(ses = modules.session.active, user, token, isLogonScreen) {
	// @pcos-app-mode native
	if (modules.shuttingDown) return { hook: _ => _ };
	let appToken;
	if (token) appToken = modules.tokens.fork(token);
	else appToken = "authui";
	let hook = new Function();
	let ipc = await modules.ipc.create();
	modules.ipc.declareAccess(ipc, { owner: "authui", group: "authui", world: false });
	let windowObject = modules.window(ses);
	if (isLogonScreen) windowObject.closeButton.classList.toggle("hidden", true);
	let authTask = await modules.tasks.exec(modules.defaultSystem + "/apps/authui.js", [], windowObject, appToken, false, [ ipc, user || "" ]);
	async function waitForIt() {
		let msg = await Promise.race([
			modules.ipc.listenFor(ipc),
			modules.tasks.waitTermination(authTask)
		]);
		delete modules.ipc._ipc[ipc];
		try {
			await modules.tasks.sendSignal(authTask, 9);
			hook(msg);
		} catch {
			hook({
				success: false,
				cancelled: true
			});
		}
	}
	waitForIt();
	return { hook: (e) => hook = e };
}
modules.authui = authui;