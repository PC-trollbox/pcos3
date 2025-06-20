async function logOut(target) {
	let liu = modules.liu;
	if (!liu.hasOwnProperty(target)) throw new Error("USER_NOT_LOGGED_IN");
	let session = liu[target].session;
	let token = liu[target].logon.token;
	let secureSession = modules.session.attrib(session, "secureID");
	await modules.session.attrib(session, "loggingOut", true);
	clearInterval(liu[target].clockInterval);
	if (modules.session.active == session || (secureSession && modules.session.active == secureSession)) await modules.session.muteAllSessions();
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
				try {
					taskList = modules.session.attrib(session, "openReeWindows") || [];
					if (Object.keys(taskList).length == 0) {
						resolve();
						clearInterval(int);
					}
				} catch {
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
	if (secureSession) {
		taskList = modules.session.attrib(secureSession, "openReeWindows") || [];
		for (let taskId of taskList) modules.tasks.sendSignal(taskId, 9);
	}
	taskList = modules.session.attrib(session, "openReeWindows") || [];
	for (let taskId of taskList) modules.tasks.sendSignal(taskId, 9);
	await allProcessesClosed();
	loggingOutWindow.windowDiv.remove();
	delete modules.liu[target];
	await modules.tokens.revoke(token);
	if (secureSession) await modules.session.rmsession(secureSession);
	await modules.session.rmsession(session);
}

modules.logOut = logOut;