function loadLull() {
	let lullSession;
	modules.lull = function() {
		if (lullSession) return;
		let style = document.createElement("style");
		style.innerHTML = `* { cursor: none !important; }
		.taskbar { display: none !important; }
		.warning { display: none !important; }`;
		document.head.appendChild(style);
		lullSession = modules.session.mksession();
		modules.session.muteAllSessions();
		modules.session.activateSession(lullSession);
		function wake() {
			removeEventListener("mousemove", wake);
			removeEventListener("click", wake);
			removeEventListener("keydown", wake);
			style.remove();
			modules.session.muteAllSessions();
			modules.session.activateSession(modules.session.systemSession);
			modules.session.rmsession(lullSession);
			lullSession = null;
		}
		addEventListener("mousemove", wake);
		addEventListener("click", wake);
		addEventListener("keydown", wake);
	}
}
loadLull();