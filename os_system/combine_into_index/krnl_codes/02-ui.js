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
        background: rgba(128, 128, 128, 0.85);
        left: 0;
        bottom: 0;
        position: absolute;
        padding: 4px;
    }

    .clock {
        float: right;
        margin-right: 8px;
    }

    .window {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background-color: rgba(240, 240, 240, 0.5);
        border: 1px solid #ccc;
        box-shadow: 0 0 5px rgba(0, 0, 0, 0.3);
        z-index: 1;
        resize: both;
        width: 320px;
        height: 180px;
        display: flex;
        flex-direction: column;
        overflow: auto;
        backdrop-filter: blur(8px);
    }

    .window.dark {
        background-color: rgba(55, 55, 55, 0.5);
        color: white;
        border: 1px solid #1b1b1b;
    }

    .window .title-bar {
        padding: 6px;
        background-color: rgba(204, 204, 204, 0.5);
        cursor: move;
        display: flex;
        flex: 1;
        user-select: none;
    }

    .window.dark .title-bar {
        background-color: rgba(27, 27, 27, 0.5);
    }

    .window .button {
        cursor: pointer;
        padding: 4px;
        border: none;
        flex: 1;
        margin: 0 0 0 2px;
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
    }

    .session.secure {
        background: none;
        backdrop-filter: blur(8px) brightness(50%);
    }
        
    .hidden {
        display: none;
    }`;
    document.head.appendChild(uiStyle);

    function createWindow(sessionId, makeFullscreenOnAllScreens) {
        let fullscreen = makeFullscreenOnAllScreens || matchMedia("(max-width: 600px)").matches;
        let id = crypto.getRandomValues(new Uint8Array(64)).reduce((a, b) => a + b.toString(16).padStart(2, "0"), "");
        let windowDiv = document.createElement('div');
        windowDiv.className = 'window ' + (fullscreen ? "fullscreen" : "");
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
        if (!fullscreen) {
            let fullscreenButton = document.createElement('button');
            fullscreenButton.className = 'button';
            fullscreenButton.innerHTML = '&#x25a1;';
            fullscreenButton.onclick = function() {
                windowDiv.classList.toggle("fullscreen");
            }
            titleBar.appendChild(fullscreenButton);
        }
        titleBar.appendChild(closeButton);
        windowDiv.appendChild(titleBar);
        let content = document.createElement('div');
        content.className = 'content';
        windowDiv.appendChild(content);
        session.tracker[sessionId].html.appendChild(windowDiv);
        if (!fullscreen) makeDraggable(windowDiv, titleBar);
        return {
            windowDiv,
            title,
            closeButton,
            content,
            sessionId
        };
    }

    function makeDraggable(windowDiv, titleBar) {
        let pos1 = 0,
            pos2 = 0,
            pos3 = 0,
            pos4 = 0;

        titleBar.onmousedown = dragMouseDown;

        function dragMouseDown(e) {
            e = e || window.event;
            e.preventDefault();
            pos3 = e.clientX;
            pos4 = e.clientY;

            document.onmouseup = closeDragElement;
            document.onmousemove = elementDrag;
        }

        function elementDrag(e) {
            e = e || window.event;
            e.preventDefault();
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;

            if (!windowDiv.classList.contains("fullscreen")) {
                windowDiv.style.top = windowDiv.offsetTop - pos2 + 'px';
                windowDiv.style.left = windowDiv.offsetLeft - pos1 + 'px';
            }
        }

        function closeDragElement() {
            document.onmouseup = null;
            document.onmousemove = null;
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
        tracker: {},
        active: null
    }

    modules.window = createWindow;
    modules.session = session;

    modules.session.systemSession = session.mksession();
    session.muteAllSessions();
    session.activateSession(modules.session.systemSession);
    modules.startupWindow = modules.window(modules.session.systemSession);
    modules.startupWindow.title.innerText = "PCOS 3";
    modules.startupWindow.content.style.padding = "8px";
    modules.startupWindow.closeButton.classList.toggle("hidden", true);
    modules.startupWindow.content.innerText = "PCOS is starting...";
}

loadUi();