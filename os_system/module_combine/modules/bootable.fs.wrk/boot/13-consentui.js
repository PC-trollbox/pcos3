async function consentui(ses = modules.session.active, config, token) {
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
	let windowObject = modules.window(ses);
	let authTask = await modules.tasks.exec(modules.defaultSystem + "/apps/consentui.js", [], windowObject, appToken, false, [
		ipc,
		config.user || "",
		JSON.stringify({
			path: config.path,
			args: config.args,
			submittedIntent: config.intent,
			submittedName: config.name
		}),
		config.sessionToken || ""
	]);
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
modules.consentui = consentui;