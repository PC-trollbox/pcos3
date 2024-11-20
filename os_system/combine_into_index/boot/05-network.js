async function networkd() {
    let hexToU8A = (hex) => Uint8Array.from(hex.match(/.{1,2}/g).map(a => parseInt(a, 16)));
    let u8aToHex = (u8a) => Array.from(u8a).map(a => a.toString(16).padStart(2, "0")).join("");
    try {
        let config = await modules.fs.read(modules.defaultSystem + "/etc/network.json");
        config = JSON.parse(config);
        let stage = 0;
        let pukey = (modules.core.prefs.read("system_id") || {}).public;
        let importedKey = await crypto.subtle.importKey("jwk", (modules.core.prefs.read("system_id") || {}).private, {
            name: "ECDSA",
            namedCurve: "P-256"
        }, true, ["sign"]);
        let ws = new WebSocket(config.url);
        let handle = Array.from(crypto.getRandomValues(new Uint8Array(64))).reduce((a, b) => a + b.toString(16).padStart(2, "0"), "");
        ws.binaryType = "arraybuffer";
        async function onclose() {
            ws = new WebSocket(config.url);
            stage = 0;
            try { await modules.fs.rm("ram/run/network.ws"); } catch {}
            try { await modules.fs.rm("ram/run/networkAddress"); } catch {}
            ws.onmessage = onmessage;
            ws.onclose = onclose;
        }
        async function onmessage(e) {
            let messageData;
            try {
                messageData = JSON.parse(e.data);
            } catch {
                return;
            }
            if (stage == 0) {
                ws.send(JSON.stringify({ ...pukey, forceConnect: true, userCustomizable: config.ucBits }));
                stage++;
            } else if (stage == 1) {
                if (messageData.event != "SignatureRequest") {
                    ws.onclose = null;
                    delete modules.websocket._handles[handle];
                    return ws.close();
                }
                ws.send(u8aToHex(new Uint8Array(await crypto.subtle.sign({
                    name: "ECDSA",
                    hash: {
                        name: "SHA-256"
                    }
                }, importedKey, hexToU8A(messageData.signBytes)))));
                stage++;
            } else if (stage == 2) {
                if (messageData.event != "ConnectionEstablished") {
                    ws.onclose = null;
                    delete modules.websocket._handles[handle];
                    return ws.close();
                }
                modules.websocket._handles[handle] = {
                    ws: ws,
                    acl: {
                        owner: handle.slice(0, 16),
                        group: handle.slice(0, 16),
                        world: true
                    }
                }
                await modules.fs.write("ram/run/network.ws", handle);
                await modules.fs.write("ram/run/networkAddress", messageData.address);
                stage++;
            } else if (stage == 3) {
                if (messageData.event == "DisconnectionComplete") {
                    ws.onclose = null;
                    try { await modules.fs.rm("ram/run/network.ws"); } catch {}
                    try { await modules.fs.rm("ram/run/networkAddress"); } catch {}
                    delete modules.websocket._handles[handle];
                    return ws.close();
                }
                if (messageData.from) {
                    if (messageData.data.type == "ping") {
                        if (typeof messageData.data.resend !== "string") return;
                        if (messageData.data.resend.length > 64) return;
                        ws.send(JSON.stringify({ receiver: messageData.from, data: { type: "pong", resend: messageData.data.resend } }));
                    }
                }
            }
        }
        ws.onmessage = onmessage;
        ws.onclose = onclose;
    } catch {
        modules.core.tty_bios_api.println("network: not starting network");
    }
}
networkd();