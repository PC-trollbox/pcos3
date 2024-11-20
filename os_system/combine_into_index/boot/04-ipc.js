function loadIpc() {
    // @pcos-app-mode native
    modules.ipc = {
        create: function() {
            let id = crypto.getRandomValues(new Uint8Array(64)).reduce((a, b) => a + b.toString(16).padStart(2, "0"), "");
            this._ipc[id] = { owner: "root", group: "root", world: false, _listeners: [] };
            return id;
        },
        declareAccess: function(id, access) {
            this._ipc[id] = { ...this._ipc[id], ...access };
        },
        listenFor: function(id) {
            let thatIPC = this._ipc;
            return new Promise(function(resolve) {
                let hasResolved = false;
                return thatIPC[id]._listeners.push(function e(d) {
                    if (hasResolved) return;
                    hasResolved = true;
                    return resolve(d);
                });
            });
        },
        send: function(id, data) {
            try {
                this._ipc[id]._listeners.forEach(listener => listener(data));
            } catch {}
        },
        getIPC: function(id) {
            let ipc = { ...this._ipc[id] };
            ipc._listeners = ipc._listeners.length;
            return ipc;
        },
        _ipc: {}
    }
}
loadIpc();