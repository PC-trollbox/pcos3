async function networkd() {
	let u8aToHex = (u8a) => Array.from(u8a).map(a => a.toString(16).padStart(2, "0")).join("");
	modules.network = { connected: false, address: null, ws: null, runOnClose: Promise.resolve(), _runOnClose: _ => 1 };
	try {
		let config = await modules.fs.read(modules.defaultSystem + "/etc/network.json");
		config = JSON.parse(config);
		modules.network.reloadConfig = async function() {
			config = JSON.parse(await modules.fs.read(modules.defaultSystem + "/etc/network.json"));
			modules.network.updates = config.updates;
			try {
				ws.close();
			} catch {
				onclose();
			}
		}
		modules.network.updates = config.updates;
		let pukey = (modules.core.prefs.read("system_id") || {}).public;
		let importedKey = await crypto.subtle.importKey("jwk", (modules.core.prefs.read("system_id") || {}).private, { name: "Ed25519" }, true, ["sign"]);
		let ws = new WebSocket(config.url);
		ws.binaryType = "arraybuffer";
		let handle = Array.from(crypto.getRandomValues(new Uint8Array(64))).reduce((a, b) => a + b.toString(16).padStart(2, "0"), "");
		let gateway;
		let systemIDEncode = sysIDc => Uint8Array.from(atob(sysIDc.replaceAll("-", "+").replaceAll("_", "/")).split("").map(a => a.charCodeAt()));
		modules.network.runOnClose = new Promise(a => modules.network._runOnClose = a);
		async function onclose() {
			try {
				ws.close();
			} catch {}
			modules.network.connected = false;
			modules.network.address = null;
			modules.network.hostname = null;
			modules.network.ws = null;
			modules.network._runOnClose();
			ws = new WebSocket(config.url);
			ws.binaryType = "arraybuffer";
			ws.onmessage = onmessage;
			ws.onclose = onclose;
			modules.network.runOnClose = new Promise(a => modules.network._runOnClose = a);
		}
		function completeConnection(messageData) {
			modules.websocket._handles[handle] = {
				ws: ws,
				acl: {
					owner: handle.slice(0, 16),
					group: handle.slice(0, 16),
					world: true
				}
			}
			modules.network.connected = true;
			modules.network.address = u8aToHex(messageData.slice(16, 32));
			modules.network.hostname = new TextDecoder().decode(messageData.slice(53, 53 + messageData[52]));
			modules.network.ws = handle;
		}
		async function onmessage(e) {
			let messageData = new Uint8Array(e.data);
			if (messageData[48] == 0 && !modules.network.connected) { // Control protocol
				if (messageData[49] == 0) { // Connected
					gateway = messageData.slice(0, 16);
					if (messageData[50] == 1) { // Public key authentication
						let hostname = new TextEncoder().encode(config.hostname || "");
						if (hostname.length > 255) hostname = hostname.slice(0, 255);
						let replyPacket = new Uint8Array(87 + hostname.length);
						replyPacket.set(messageData.slice(16, 32), 0);
						replyPacket.set(gateway, 16);
						replyPacket.set(messageData.slice(32, 48), 32);
						replyPacket.set(Uint8Array.from([ 0, 3 ]), 48); // Control Protocol; send public key
						replyPacket.set(systemIDEncode(pukey.x), 50);
						replyPacket.set(Uint8Array.from([ config.ucBits >>> 24 & 255, config.ucBits >>> 16 & 255, config.ucBits >>> 8 & 255, config.ucBits & 255 ]), 82);
						replyPacket.set(Uint8Array.from([ hostname.length ]), 86);
						replyPacket.set(hostname, 87);
						ws.send(replyPacket);
					} else {
						completeConnection(messageData);
					}
				} else if (messageData[49] == 1) { // Auth failed
					onclose = null;
					ws.close();
					modules.network._runOnClose();
					modules.core.tty_bios_api.println("network: invalid System ID data");
				} else if (messageData[49] == 2) { // Signature request
					let replyPacket = new Uint8Array(114);
					replyPacket.set(messageData.slice(16, 32), 0);
					replyPacket.set(gateway, 16);
					replyPacket.set(messageData.slice(32, 48), 32);
					replyPacket.set(Uint8Array.from([ 0, 4 ]), 48); // Control Protocol; send signature
					replyPacket.set(new Uint8Array(await crypto.subtle.sign({ name: "Ed25519" }, importedKey, messageData.slice(50, 82))), 50);
					ws.send(replyPacket);
				} else if (messageData[49] == 6) { // Address conflict
					config.ucBits = Math.floor(Math.random() * (2 ** 32));
					ws.close();
				}
			}
			if (messageData[48] == 1 && messageData[49] == 0) { // Ping Protocol; not a pong
				let replyPacket = new Uint8Array(114);
				replyPacket.set(messageData.slice(16, 32), 0);
				replyPacket.set(messageData.slice(0, 16), 16);
				replyPacket.set(messageData.slice(32, 48), 32);
				replyPacket.set(Uint8Array.from([ 1, 255 ]), 48); // Ping Protocol; is a pong
				replyPacket.set(messageData.slice(50, 114), 50);
				ws.send(replyPacket);
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