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
		width: 100%;
		background: ${modules.core.bootMode == "safe" ? "rgb(128, 128, 128)" : "rgba(128, 128, 128, 0.85)"};
		left: 0;
		bottom: 0;
		position: absolute;
		padding: 4px;
		box-sizing: border-box;
		border-radius: 4px;
		display: flex;
	}

	.taskbar .clock {
		margin-right: 4px;
	}

	.taskbar .icon {
		width: 27px;
		height: 27px;
		background-size: contain;
		margin: 0 4px;
	}

	.filler {
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
		position: fixed;
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
	}

	.session.secure {
		background: none${modules.core.bootMode == "safe" ? " !important" : ""};
		backdrop-filter: ${modules.core.bootMode == "safe" ? "none" : "blur(8px) brightness(50%)"};
		animation: ${modules.core.bootMode == "safe" ? "none" : "fade 0.1s ease-out forwards"};
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
		session.tracker[sessionId].html.appendChild(windowDiv);
		if (!fullscreen) makeDraggable(windowDiv, titleBar, reportMovement);
		return {
			windowDiv,
			title,
			closeButton,
			content,
			sessionId
		};
	}

	function makeDraggable(windowDiv, titleBar, reportMovement) {
		let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

		titleBar.onmousedown = dragMouseDown;
		titleBar.ontouchstart = dragMouseDown;

		function dragMouseDown(e) {
			if (e.type != "touchstart") e.preventDefault();
			if (e.type == "touchstart") e = e.touches[0];
			pos3 = e.clientX;
			pos4 = e.clientY;

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
			let identifier = crypto.getRandomValues(new Uint8Array(64)).reduce((a, b) => a + b.toString(16).padStart(2, "0"), "");
			let session = document.createElement('div');
			session.className = "session hidden";
			document.body.appendChild(session);
			this.tracker[identifier] = {
				html: session,
				attrib: {}
			};
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