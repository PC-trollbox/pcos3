function loadWebsocketSupport() {
    let websocketAPI = {
        getHandle: function(url) {
            let handle = Array.from(crypto.getRandomValues(new Uint8Array(64))).reduce((a, b) => a + b.toString(16).padStart(2, "0"), "");
            let websocket = new WebSocket(url);
            websocket.binaryType = "arraybuffer";
            websocketAPI._handles[handle] = {
                ws: websocket,
                acl: {
                    owner: handle.slice(0, 16),
                    group: handle.slice(0, 16),
                    world: true
                }
            };
            return handle;
        },
        send: (arg) => websocketAPI._handles[arg.handle].ws.send(arg.data),
        close: function(handle) {
            if (websocketAPI._handles.hasOwnProperty(handle)) websocketAPI._handles[handle].ws.close();
            delete websocketAPI._handles[handle];
        },
        getInfo: function(handle) {
            return {
                bufferedAmount: websocketAPI._handles[handle].ws.bufferedAmount,
                extensions: websocketAPI._handles[handle].ws.extensions,
                protocol: websocketAPI._handles[handle].ws.protocol,
                readyState: websocketAPI._handles[handle].ws.readyState,
                url: websocketAPI._handles[handle].ws.url
            }
        },
        waitForEvent: function(arg) {
            return new Promise(function(resolve) {
                websocketAPI._handles[arg.handle].ws.addEventListener(arg.eventName, function meName(arg2) {
                    if (arg.eventName == "message") resolve(arg2.data);
                    else if (arg.eventName == "error") resolve({
                        code: arg2.code,
                        reason: arg2.reason,
                        wasClean: arg2.wasClean
                    });
                    else resolve(arg.eventName);
                    try {
                        websocketAPI._handles[arg.handle].ws.removeEventListener(arg.eventName, meName);
                    } catch {}
                });
            });
        },
        assertAccess: function(arg) {
            if (arg.newACL) websocketAPI._handles[arg.handle].acl = arg.newACL;
            return websocketAPI._handles[arg.handle].acl;
        },
        websocketState: (handle) => websocketAPI._handles[handle].ws.readyState,
        _handles: {}
    }
    modules.websocket = websocketAPI;
}

loadWebsocketSupport();