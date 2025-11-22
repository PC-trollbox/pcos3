function loadUi() {
	// @pcos-app-mode native
	let uiStyle = document.createElement("style");
	uiStyle.innerHTML = `body {
		overflow: hidden;
		background: black;
		cursor: none;
		font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
	}

	.taskbar {
		background: ${modules.core.bootMode == "safe" ? "rgb(128, 128, 128)" : "rgba(128, 128, 128, 0.85)"};
		padding: 4px;
		border-radius: 4px;
		display: flex;
		margin: 2px;
	}

	.taskbar .clock {
		margin-right: 4px;
	}

	.taskbar .icon {
		width: 23px;
		height: 23px;
		background-size: contain;
		background-repeat: no-repeat;
		margin: 0 2px;
		display: inline-block;
	}
	
	.taskbar .tbicons {
		display: flex;
	}

	.filler {
		flex: 1;
	}
	
	.desktop {
		position: relative;
		flex: 1;
	}

	.window {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		background-color: ${modules.core.bootMode == "safe" ? "rgb(240, 240, 240)" : "rgba(240, 240, 240, 0.5)"};
		border: 1px solid #ccc;
		box-shadow: ${modules.core.bootMode == "safe" ? "none" : "0 0 5px rgba(0, 0, 0, 0.3)"};
		z-index: 1;
		resize: both;
		width: 320px;
		height: 180px;
		display: flex;
		flex-direction: column;
		overflow: auto;
		backdrop-filter: ${modules.core.bootMode == "safe" ? "none" : "blur(8px)"};
		animation: ${modules.core.bootMode == "safe" ? "none" : "fade-in 0.1s ease-in forwards"};
		border-radius: 4px;
	}


	.window.icon {
		top: 72px;
		left: 72px;
		resize: none;
		width: 128px;
		height: 128px;
	}

	.window.dark {
		background-color: ${modules.core.bootMode == "safe" ? "rgb(55, 55, 55)" : "rgba(55, 55, 55, 0.5)"};
		color: white;
		border: 1px solid #1b1b1b;
	}

	.window .title-bar {
		padding: 6px;
		background-color: ${modules.core.bootMode == "safe" ? "rgb(204, 204, 204)" : "rgba(204, 204, 204, 0.5)"};
		cursor: move;
		display: flex;
		flex: 1;
		user-select: none;
	}

	.window.dark .title-bar {
		background-color: ${modules.core.bootMode == "safe" ? "rgb(27, 27, 27)" : "rgba(27, 27, 27, 0.5)"};
	}

	.window .button {
		cursor: pointer;
		padding: 4px;
		border: none;
		flex: 1;
		margin: 0 0 0 2px;
		border-radius: 4px;
	}

	.window .button:hover {
		opacity: 75%;
	}

	.window .close-button {
		background: red;
		color: white;
	}

	.window .title-displayer {
		flex: 100;
	}

	.window .close-button:disabled {
		opacity: 25%;
	}

	.window.fullscreen .resize-handle {
		display: none;
	}

	.window.fullscreen {
		width: 100% !important;
		height: 100% !important;
		top: 0 !important;
		left: 0 !important;
		transform: none;
		resize: none;
		border: none;
		box-shadow: none;
	}

	.window.fullscreen .title-bar {
		cursor: default;
	}

	.window .content {
		flex: 100;
		overflow: auto;
		position: relative;
		background-color: #f0f0f0;
	}

	.window.dark .content {
		background-color: #373737;
	}

	.session {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: black;
		cursor: default;
		animation: ${modules.core.bootMode == "safe" ? "none" : "fade-in 0.1s ease-in forwards"};
		display: flex;
		flex-direction: column;
	}

	.session.secure {
		background: none${modules.core.bootMode == "safe" ? " !important" : ""};
		backdrop-filter: ${modules.core.bootMode == "safe" ? "none" : "blur(8px) brightness(50%)"};
		animation: ${modules.core.bootMode == "safe" ? "none" : "fade 0.1s ease-out forwards"};
		z-index: -1;
	}

	.hidden {
		display: none;
	}
	
	@keyframes fade-in {
		0% {
			opacity: 0;
		}

		100% {
			opacity: 1;
		}
	}

	@keyframes fade {
		0% {
			backdrop-filter: blur(0px) brightness(100%);
		}

		100% {
			backdrop-filter: blur(8px) brightness(50%);
		}
	}
	
	.warning {
		position: absolute;
		top: 8px;
		right: 8px;
		background: #2a2a2a;
		color: white;
		border-radius: 4px;
		opacity: 60%;
		pointer-events: none;
		user-select: none;
		padding: 8px;
		z-index: 256;
	}`;
	document.head.appendChild(uiStyle);

	function createWindow(sessionId, makeFullscreenOnAllScreens, asIconWindow, reportMovement) {
		let fullscreen = makeFullscreenOnAllScreens || matchMedia("(max-width: 600px)").matches;
		if (asIconWindow) fullscreen = false;
		let id = crypto.getRandomValues(new Uint8Array(64)).reduce((a, b) => a + b.toString(16).padStart(2, "0"), "");
		let windowDiv = document.createElement('div');
		windowDiv.className = 'window ' + (fullscreen ? "fullscreen " : "") + " " + (asIconWindow ? "icon" : "");
		if (session.attrib(sessionId, "dark")) windowDiv.classList.add("dark");
		windowDiv.id = 'window-' + id;
		let titleBar = document.createElement('div');
		titleBar.className = 'title-bar';
		let title = document.createElement('span');
		title.className = 'title-displayer';
		let closeButton = document.createElement('button');
		closeButton.className = 'button close-button';
		closeButton.innerHTML = '&#10005;';
		titleBar.appendChild(title);
		if (!fullscreen && !asIconWindow) {
			let fullscreenButton = document.createElement('button');
			fullscreenButton.className = 'button';
			fullscreenButton.innerHTML = '&#x25a1;';
			fullscreenButton.onclick = function() {
				windowDiv.classList.toggle("fullscreen");
			}
			titleBar.appendChild(fullscreenButton);
		}
		if (!asIconWindow) titleBar.appendChild(closeButton);
		windowDiv.appendChild(titleBar);
		let content = document.createElement('div');
		content.className = 'content';
		windowDiv.appendChild(content);
		session.tracker[sessionId].extendedHTML.desktop.appendChild(windowDiv);
		if (!asIconWindow) {
			let openWins = session.attrib(sessionId, "openWins") || [];
			openWins = openWins.filter(a => a.parentElement).sort((a, b) => a.style.zIndex - b.style.zIndex);
			openWins.map((a, i) => a.style.zIndex = i);
			windowDiv.style.zIndex = openWins.length;
			openWins.push(windowDiv);
			session.attrib(sessionId, "openWins", openWins);
		} else windowDiv.style.zIndex = "0";
		if (!fullscreen) makeDraggable(windowDiv, titleBar, reportMovement, asIconWindow ? false : sessionId);
		return {
			windowDiv,
			title,
			closeButton,
			content,
			sessionId
		};
	}

	function makeDraggable(windowDiv, titleBar, reportMovement, sessionId) {
		let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

		titleBar.onmousedown = dragMouseDown;
		titleBar.ontouchstart = dragMouseDown;

		function dragMouseDown(e) {
			if (e.type != "touchstart") e.preventDefault();
			if (e.type == "touchstart") e = e.touches[0];
			pos3 = e.clientX;
			pos4 = e.clientY;

			if (sessionId) {
				let openWins = session.attrib(sessionId, "openWins") || [];
				windowDiv.style.zIndex = openWins.length;
				openWins = openWins.filter(a => a.parentElement).sort((a, b) => a.style.zIndex - b.style.zIndex);
				openWins.map((a, i) => a.style.zIndex = i);
				session.attrib(sessionId, "openWins", openWins);
			}

			document.onmouseup = closeDragElement;
			document.ontouchend = closeDragElement;
			document.ontouchcancel = closeDragElement;
			document.onmousemove = elementDrag;
			document.ontouchmove = elementDrag;
		}

		function elementDrag(e) {
			e.preventDefault();
			if (e.type == "touchmove") e = e.touches[0];
			pos1 = pos3 - e.clientX;
			pos2 = pos4 - e.clientY;
			pos3 = e.clientX;
			pos4 = e.clientY;

			if (!windowDiv.classList.contains("fullscreen")) {
				if (reportMovement) reportMovement(windowDiv.offsetLeft - pos1, windowDiv.offsetTop - pos2);
				windowDiv.style.top = windowDiv.offsetTop - pos2 + 'px';
				windowDiv.style.left = windowDiv.offsetLeft - pos1 + 'px';
			}
		}

		function closeDragElement() {
			document.onmouseup = null;
			document.ontouchend = null;
			document.ontouchcancel = null;
			document.onmousemove = null;
			document.ontouchmove = null;
		}
	}

	let session = {
		mksession: function() {
			if (modules.shuttingDown) throw new Error("SYSTEM_SHUTDOWN_REQUESTED");
			let identifier = crypto.getRandomValues(new Uint8Array(64)).reduce((a, b) => a + b.toString(16).padStart(2, "0"), "");
			let session = document.createElement("div");
			let desktop = document.createElement("div");
			let taskbar = document.createElement("div");
			let startButton = document.createElement("button");
			let taskList = document.createElement("div");
			let filler = document.createElement("div");
			let icons = document.createElement("div");
			let clock = document.createElement("div");

			session.className = "session hidden";
			desktop.className = "desktop";
			taskbar.className = "taskbar";
			icons.className = "tbicons";
			filler.className = "filler";
			startButton.disabled = true;

			taskbar.append(startButton, taskList, filler, icons, clock);
			session.append(desktop, taskbar);
			document.body.appendChild(session);

			let clockToggled = false;
			clock.addEventListener("click", _ => clockToggled = !clockToggled);
			let updateTaskbar = () => {
				if (!session.parentElement) return;
				let locale = this.tracker[identifier].attrib.locale || modules.locales?.defaultLocale || "en";
				let clockLocale = modules.locales?.get("OS_LOCALE", locale)?.replace("OS_LOCALE", "") || undefined;
				startButton.innerText = modules.locales?.get("START_MENU_BTN", locale);
				clock.innerText = Intl.DateTimeFormat(clockLocale, { timeStyle: clockToggled ? undefined : "medium" }).format();
				setTimeout(updateTaskbar, 500);
			};

			if ([ "safe", "disable-harden" ].includes(modules.core.bootMode)) {
				let warning = document.createElement("span");
				warning.className = "warning";
				if (modules.core.bootMode == "disable-harden") {
					warning.innerText = modules.locales?.get("INSECURE_MODE_MSG") || "Reduced security!";
					warning.style.background = "#7f0000";
				} else if (modules.core.bootMode == "safe") warning.innerText = modules.locales?.get("SAFE_MODE_MSG") || "Safe mode";
				session.appendChild(warning);
			}

			this.tracker[identifier] = {
				html: session,
				extendedHTML: { desktop, taskbar, startButton, taskList, filler, icons, clock },
				attrib: {}
			};
			updateTaskbar();

			return identifier;
		},
		rmsession: function(session) {
			this.tracker[session].html.remove();
			delete this.tracker[session];
		},
		muteAllSessions: function() {
			for (let session in this.tracker) this.tracker[session].html.classList.add("hidden");
			this.active = null;
		},
		activateSession: function(session) {
			this.tracker[this.active]?.html?.classList?.add("hidden");
			this.tracker[session].html.classList.remove("hidden");
			this.active = session;
		},
		attrib: function(session, key, val) {
			if (val !== undefined) this.tracker[session].attrib[key] = val;
			if (key !== undefined) return this.tracker[session].attrib[key];
			return this.tracker[session].attrib;
		},
		destroy: function() {
			for (let session in this.tracker) this.rmsession(session);
			this.tracker = {};
			delete this.systemSession;
			delete modules.liu;
			delete modules.serviceSession;
			uiStyle.remove();
			delete modules.uiStyle;
		},
		tracker: {},
		active: null
	}

	modules.window = createWindow;
	modules.session = session;
	modules.uiStyle = uiStyle;

	modules.session.systemSession = session.mksession();
	session.muteAllSessions();
	session.activateSession(modules.session.systemSession);
	modules.startupWindow = modules.window(modules.session.systemSession);
	modules.startupWindowProgress = document.createElement("progress");
	modules.startupWindow.title.innerText = "PCOS 3";
	modules.startupWindow.content.style.padding = "8px";
	modules.startupWindow.closeButton.classList.toggle("hidden", true);
	modules.startupWindow.content.innerText = "PCOS is starting...";
	modules.startupWindow.content.appendChild(document.createElement("br"));
	modules.startupWindow.content.appendChild(modules.startupWindowProgress);
}

loadUi();