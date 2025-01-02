async function networkd() {
	let hexToU8A = (hex) => Uint8Array.from(hex.match(/.{1,2}/g).map(a => parseInt(a, 16)));
	let u8aToHex = (u8a) => Array.from(u8a).map(a => a.toString(16).padStart(2, "0")).join("");
	modules.network = { connected: false, address: null, ws: null, runOnClose: Promise.resolve(), _runOnClose: _ => 1 };
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
		modules.network.runOnClose = new Promise(a => modules.network._runOnClose = a);
		ws.binaryType = "arraybuffer";
		async function onclose() {
			modules.network.connected = false;
			modules.network.address = null;
			modules.network.hostname = null;
			modules.network._runOnClose();
			ws = new WebSocket(config.url);
			stage = 0;
			ws.onmessage = onmessage;
			ws.onclose = onclose;
			modules.network.runOnClose = new Promise(a => modules.network._runOnClose = a);
		}
		async function onmessage(e) {
			let messageData;
			try {
				messageData = JSON.parse(e.data);
			} catch {
				return;
			}
			if (stage == 0) {
				ws.send(JSON.stringify({ ...pukey, forceConnect: true, userCustomizable: config.ucBits, hostname: config.hostname }));
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
				modules.network.connected = true;
				modules.network.address = messageData.address;
				modules.network.hostname = messageData.hostname;
				modules.network.ws = handle;
				stage++;
			} else if (stage == 3) {
				if (messageData.event == "DisconnectionComplete") {
					modules.network.connected = false;
					modules.network.address = null;
					modules.network.hostname = null;
					modules.network.ws = null;
					modules.network._runOnClose();
					ws.onclose = null;
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
		modules.network.serviceStopped = true;
		modules.core.tty_bios_api.println("network: not starting network");
	}
}
networkd();