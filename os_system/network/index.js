const express = require("express");
const ws = require("ws");
const crypto = require("crypto");
const codes = require("./codes");
const app = express();
const http = require("http").createServer(app);
const path = require("path/posix");
const fs = require("fs");
const events = require("events");
const server = new ws.Server({ server: http });
let socketList = {};
let spoofers = {};
let { networkID } = require("../keypair.json");
let networkPrefix = crypto.createHash("sha256").update(Buffer.from(networkID.x, "base64url")).digest().subarray(0, 6);
const serverAddress = Buffer.concat([ networkPrefix, networkPrefix, Buffer.from("00000001", "hex") ]);
const fileNotFoundPage = "document.body.innerText = '404. File not found';";
let serverPublicKey = require("../keypair.json").serverKey;
let usableKey = crypto.subtle.importKey("jwk", require("../keypair.json").serverKey_private, {name: "Ed25519"}, false, ["sign"]);
let hexToU8A = (hex) => Uint8Array.from(hex.match(/.{1,2}/g).map(a => parseInt(a, 16)));
let u8aToHex = (u8a) => Array.from(u8a).map(a => a.toString(16).padStart(2, "0")).join("");
let dnsTable = {
	"pcosserver.pc": serverAddress.toString("hex")
};

app.use(function(req, res, next) {
	res.set("Cross-Origin-Embedder-Policy", "credentialless");
	res.set("Cross-Origin-Opener-Policy", "same-origin");
	next(); 
});

app.use("/.git", function(req, res) {
	res.status(403).send("no hablo unauthorized accesses");
});
app.use("/os_system/keypair.json", function(req, res) {
	res.status(403).json({
		kty: "OKP",
		x: "You arnt very amdin",
		crv: "Ed25519",
		d: "no hablo unauthorized accesses"
	});
});
app.use("/os_system/managed/managedDB.json", function(req, res) {
	res.status(403).send("no hablo unauthorized accesses");
});

app.use(function(req, res, next) {
	if (path.normalize(req.path) != req.path) return res.status(403).send("detected path traversal");
	next();
});
app.use(express.static(__dirname + "/../.."));

server.on("connection", function(socket, req) {
	let verified = false;
	let publicKey, ipk;
	let signBytes;
	let alive = true;
	let hostname;
	let isSpoofer = false;
	let userCustomizable = Buffer.from("00000000", "hex");
	let netAddress = Buffer.alloc(16, 0);
	socket.send(Buffer.concat([ serverAddress, netAddress, Buffer.alloc(16, 0), codes.CONTROL, codes.CONNECTED, codes.PUBKEY_AUTH ]));
	socket.on("message", async function(message) {
		if (!(message.subarray(0, 16).equals(netAddress) || (isSpoofer && message.subarray(0, 6).equals(netAddress.subarray(6, 12)))))
			return socket.send(Buffer.concat([ serverAddress, message.subarray(0, 16), message.subarray(32, 48), codes.CONTROL, codes.INVALID_SOURCE ]));
		if (message.subarray(16, 32).equals(serverAddress)) {
			if (message.subarray(48, 50).equals(Buffer.concat([ codes.PING, codes.IS_PING ])))
				socket.send(Buffer.concat([ serverAddress, message.subarray(0, 16), message.subarray(32, 49), codes.IS_PONG, message.subarray(50, 114) ]));
			else if (verified && message.subarray(48, 57).equals(Buffer.concat([ codes.CONNLESS, Buffer.from("07", "hex"), Buffer.from("resolve") ]))) {
				let replyGateSize = message[57];
				let replyGate = message.subarray(58, 58 + replyGateSize);
				let querySize = message[58 + replyGateSize];
				let query = message.subarray(59 + replyGateSize, 59 + replyGateSize + querySize);
				let reply = dnsTable.hasOwnProperty(query) ? Buffer.from(dnsTable[query], "hex") : Buffer.from("");
				socket.send(Buffer.concat([ serverAddress, message.subarray(0, 16), message.subarray(32, 49), Buffer.from(replyGateSize.toString(16), "hex"), replyGate, reply ]));
			} else if (message.subarray(48, 49).equals(codes.CONTROL)) {
				if (message.subarray(49, 50).equals(codes.PUBKEY_SEND) && verified == false) {
					try {
						publicKey = message.subarray(50, 82);
						userCustomizable = message.subarray(82, 86);
						ipk = crypto.createPublicKey({
							key: { crv: "Ed25519", kty: "OKP", x: publicKey.toString("base64url") },
							format: "jwk"
						});
					} catch {
						socket.send(Buffer.concat([ serverAddress, netAddress, message.subarray(32, 48), codes.CONTROL, codes.AUTH_FAILED ]));
						return socket.terminate();
					}
					hostname = (message.subarray(87, 87 + message[86]).toString().match(/\w/g) || []).join("").slice(0, 128);
					signBytes = crypto.randomBytes(32);
					socket.send(Buffer.concat([ serverAddress, netAddress, message.subarray(32, 48), codes.CONTROL, codes.SIGN_REQUEST, signBytes ]));
				} else if (message.subarray(49, 50).equals(codes.SIGNATURE_SEND) && verified == false) {
					try {
						if (!crypto.verify(undefined, signBytes, { key: ipk }, Buffer.from(message.subarray(50, 114)))) throw new Error("SignatureInvalid");
					} catch {
						socket.send(Buffer.concat([ serverAddress, netAddress, message.subarray(32, 48), codes.CONTROL, codes.AUTH_FAILED ]));
						return socket.terminate();
					}
					ipk = null;
					let xHash = crypto.createHash("sha256").update(publicKey).digest().subarray(0, 6);
					let newAddress = Buffer.concat([ networkPrefix, xHash, userCustomizable ]);
					if (socketList.hasOwnProperty(newAddress.toString("hex")) || newAddress.equals(serverAddress)) {
						socket.send(Buffer.concat([ serverAddress, newAddress, message.subarray(32, 48), codes.CONTROL, codes.ADDRESS_CONFLICT ]));
						return socket.terminate();
					}
					socketList[newAddress.toString("hex")] = socket;
					if (hostname.length == 0 || (hostname + ".basic") in dnsTable)
						hostname = "node" + crypto.randomBytes(8).toString("hex");
					hostname = hostname + ".basic";
					netAddress = newAddress;
					dnsTable[hostname] = netAddress.toString("hex");
					isSpoofer = userCustomizable.equals(Buffer.from("00000001", "hex"));
					if (isSpoofer) spoofers[netAddress.subarray(6, 12).toString("hex")] = socket;
					socket.send(Buffer.concat([
						serverAddress, netAddress, message.subarray(32, 48), codes.CONTROL, codes.CONNECTED, codes.NO_AUTH,
						isSpoofer ? codes.CAN_SPOOF : codes.CANNOT_SPOOF, Buffer.from(hostname.length.toString(16).padStart(2, "0"), "hex"),
						Buffer.from(hostname)
					]));
					verified = true;
					let {connectedEvent: connectedEventBDP} = ConnfulServer("blog", socket);
					connectedEventBDP.on("connected", function(a) {
						let {messageReceiveEvent, messageSendEvent} = a;
						messageReceiveEvent.once("message", function(d) {
							d = new TextDecoder().decode(d);
							let pathname = path.join(__dirname, "js_files", d);
							if (!path.normalize(pathname).startsWith(path.join(__dirname, "js_files"))) {
								messageSendEvent.emit("message", new TextEncoder().encode(JSON.stringify({
									type: "script",
									length: 1,
									error: "PERMISSION_DENIED"
								})));
								return messageSendEvent.emit("message", new TextEncoder().encode(JSON.stringify({ ctr: 0, chunk: "document.body.innerText = 'You cannot do that!';" })));
							}
							if (!path.extname(pathname)) pathname = path.join(pathname, "index.js");
							let file = fileNotFoundPage, fileFound = false;
							try {
								file = fs.readFileSync(pathname).toString();
								fileFound = true;
							} catch {}
							messageSendEvent.emit("message", new TextEncoder().encode(JSON.stringify({
								type: path.extname(pathname) == ".js" ? "script" : "file",
								length: Math.ceil(file.length / 65536),
								error: fileFound ? null : "NO_SUCH_FILE",
								filename: path.basename(pathname)
							})));
							for (let i = 0; i != Math.ceil(file.length / 65536); i++) {
								messageSendEvent.emit("message", new TextEncoder().encode(JSON.stringify({
									ctr: i,
									chunk: file.slice(i * 65536, (i + 1) * 65536)
								})));
							}
						})
					});
					let {connectedEvent: connectedEventNetFS} = ConnfulServer("netfs", socket);
					connectedEventNetFS.on("connected", function(a) {
						let {messageReceiveEvent, messageSendEvent} = a;
						messageReceiveEvent.on("message", function(d) {
							try {
								d = JSON.parse(new TextDecoder().decode(d));
								if (d.action == "properties") messageSendEvent.emit("message", new TextEncoder().encode(JSON.stringify({ data: {
										directory_supported: true,
										read_only: true,
										filesystem: "netfs",
										permissions_supported: false
									}})));
								else if (d.action == "read" || d.action == "ls" || d.action == "isDirectory") {
									let dpath = (d.action == "read" || d.action == "isDirectory") ? d.key : d.directory;
									if (!path.normalize(path.join(__dirname, "fs_files", dpath)).startsWith(path.join(__dirname, "fs_files")))
										return messageSendEvent.emit("message", new TextEncoder().encode(JSON.stringify({ error: "PERMISSION_DENIED" })));
									let realPathname = path.join(__dirname, "fs_files", dpath);
									try {
										if (d.action == "read") messageSendEvent.emit("message", new TextEncoder().encode(JSON.stringify({ data: fs.readFileSync(realPathname).toString() })));
										else if (d.action == "isDirectory") messageSendEvent.emit("message", new TextEncoder().encode(JSON.stringify({ data: fs.statSync(realPathname).isDirectory() })));
										else if (d.action == "ls") messageSendEvent.emit("message", new TextEncoder().encode(JSON.stringify({ data: fs.readdirSync(realPathname) })));
									} catch {
										messageSendEvent.emit("message", new TextEncoder().encode(JSON.stringify({ error: "FS_ACTION_FAILED" })));
									}
								} else if (d.action == "sync" || d.action == "unmount")
									messageSendEvent.emit("message", new TextEncoder().encode(JSON.stringify({ data: true })));
								else messageSendEvent.emit("message", new TextEncoder().encode(JSON.stringify({ error: "FS_ACTION_FAILED" })));
							} catch {}
						})
					});
					let {connectedEvent: connectedEventResolve} = ConnfulServer("resolve", socket);
					connectedEventResolve.on("connected", function(a) {
						let {messageReceiveEvent, messageSendEvent} = a;
						messageReceiveEvent.on("message", function(d) {
							messageSendEvent.emit("message", Buffer.from(dnsTable[new TextDecoder().decode(d)] || "0", "hex"));
						});
					});
				}
			}
		} else {
			if (!verified || !socketList.hasOwnProperty(message.subarray(16, 32).toString("hex")) /*|| !spoofers.hasOwnProperty(message.subarray(16, 22).toString("hex"))*/) return socket.send(Buffer.concat([ serverAddress, message.subarray(0, 16), message.subarray(32, 49), codes.CONTROL, codes.ADDRESS_UNREACHABLE ]));
			//if (message.subarray(16, 22).equals(networkPrefix))
			socketList[message.subarray(16, 32).toString("hex")].send(message);
			//else spoofers[message.subarray(16, 22).toString("hex")].send(message);
		}
	});
	let pingCycle = setInterval(function() {
		if (!alive) return socket.terminate();
		alive = false;
		socket.ping();
	}, 30000);
	socket.on("error", console.error);
	socket.on("pong", () => alive = true);
	socket.on("close", function() {
		delete socketList[netAddress.toString("hex")];
		delete dnsTable[hostname];
		if (netAddress.subarray(12, 16).toString("hex") == "0001")
			delete spoofers[netAddress.subarray(6, 12).toString("hex")];
		clearInterval(pingCycle);
	});
});

function ConnfulServer(gate, socket) {
	let string_gate = gate;
	gate = new TextEncoder().encode(gate);
	let connectedEvent = new events.EventEmitter();
	let connections = {};
	socket.on("message", async function(gotPacket) {
		try {
			gotPacket = new Uint8Array(gotPacket);
		} catch { return; }
		if (gotPacket[48] == 3 && gotPacket[49] == 0 && u8aToHex(gotPacket.slice(16, 32)) == serverAddress.toString("hex")) {
			// Must be Connectionful Protocol, a client and addressed to the server
			let packetConnectionID = u8aToHex(gotPacket.slice(50, 66));
			try {
				if (gotPacket[66] == 0 && gotPacket[67] == gate.length && u8aToHex(gotPacket.slice(68, 68 + gotPacket[67])) == u8aToHex(gate)) {
					// Start, gate match
					if (connections[packetConnectionID + ":server"]) return;
					usableKey = await usableKey;
					let ephemeralKey = await crypto.subtle.generateKey({name: "X25519"}, true, ["deriveBits"]);
					let exported = await crypto.subtle.exportKey("jwk", ephemeralKey.publicKey);
					exported = {signedBy: "serverKey", usages: ["connfulSecureEphemeral"], key:exported};
					let signature = u8aToHex(new Uint8Array(await crypto.subtle.sign({
						name: "Ed25519"
					}, usableKey, new TextEncoder().encode(JSON.stringify(exported)))));
					let packetContent = JSON.parse(new TextDecoder().decode(gotPacket.slice(68 + gate.length)));
					let theirUsableKey = await crypto.subtle.importKey("jwk", packetContent.keyInfo.key, { name: "X25519" }, true, []);
					let joinedKeys = await crypto.subtle.deriveBits({ name: "X25519", public: theirUsableKey }, ephemeralKey.privateKey, 256);
					let aesUsableKey = await crypto.subtle.importKey("raw", joinedKeys, {name: "AES-GCM"}, true, ["encrypt", "decrypt"]);
					connections[packetConnectionID + ":server"] = {
						ourKey: ephemeralKey,
						from: u8aToHex(gotPacket.slice(0, 16)),
						theirMainKeyReceived: false,
						theirKeyRaw: packetContent,
						aesUsableKey
					}

					let theKey = new TextEncoder().encode(JSON.stringify({ keyInfo: exported, signature }));
					let packet = new Uint8Array(67 + theKey.length);
					packet.set(serverAddress, 0);
					packet.set(gotPacket.slice(0, 16), 16);
					packet.set(gotPacket.slice(32, 48), 32);
					packet.set(Uint8Array.from([ 3, 255 ]), 48); // Connectionful Protocol; a server
					packet.set(hexToU8A(packetConnectionID), 50);
					packet.set(Uint8Array.from([ 0 ]), 66); // Start
					packet.set(theKey, 67); // The key
					socket.send(packet);
				} else if (gotPacket[66] == 1) { // Xchange
					if (!connections.hasOwnProperty(packetConnectionID + ":server")) return;
					if (connections[packetConnectionID + ":server"].theirMainKeyReceived) return;
					let theirMainKeyDecrypt = JSON.parse(new TextDecoder().decode(await crypto.subtle.decrypt({
						name: "AES-GCM",
						iv: gotPacket.slice(67, 79)
					}, connections[packetConnectionID + ":server"].aesUsableKey, gotPacket.slice(79))));
					let usableMainKey = await crypto.subtle.importKey("jwk", theirMainKeyDecrypt.keyInfo.key, { name: "Ed25519" }, true, ["verify"]);
					let verifyKeySignature = await crypto.subtle.verify({ name: "Ed25519" }, usableMainKey, hexToU8A(connections[packetConnectionID + ":server"].theirKeyRaw.signature), new TextEncoder().encode(JSON.stringify(connections[packetConnectionID + ":server"].theirKeyRaw.keyInfo)));
					if (!verifyKeySignature || (!theirMainKeyDecrypt.keyInfo.usages.includes("connfulSecureClient:" + connections[packetConnectionID + ":server"].from) && 
							!theirMainKeyDecrypt.keyInfo.usages.includes("connfulSecureClient:" + connections[packetConnectionID + ":server"].from + ":" + string_gate))) {
						delete connections[packetConnectionID + ":server"];
						let packet = new Uint8Array(67);
						packet.set(serverAddress, 0);
						packet.set(gotPacket.slice(0, 16), 16);
						packet.set(gotPacket.slice(32, 48), 32);
						packet.set(Uint8Array.from([ 3, 255 ]), 48); // Connectionful Protocol; a server
						packet.set(hexToU8A(packetConnectionID), 50);
						packet.set(Uint8Array.from([ 2 ]), 66); // Drop
						return socket.send(packet);
					}
					connections[packetConnectionID + ":server"].theirMainKeyReceived = theirMainKeyDecrypt;
					let iv = crypto.getRandomValues(new Uint8Array(12));
					let ct = new Uint8Array(await crypto.subtle.encrypt({
						name: "AES-GCM",
						iv
					}, connections[packetConnectionID + ":server"].aesUsableKey, new TextEncoder().encode(JSON.stringify(serverPublicKey))));
					let packet = new Uint8Array(79 + ct.byteLength);
					packet.set(serverAddress, 0);
					packet.set(gotPacket.slice(0, 16), 16);
					packet.set(gotPacket.slice(32, 48), 32);
					packet.set(Uint8Array.from([ 3, 255 ]), 48); // Connectionful Protocol; a server
					packet.set(hexToU8A(packetConnectionID), 50);
					packet.set(Uint8Array.from([ 1 ]), 66); // Xchange
					packet.set(iv, 67);
					packet.set(ct, 79);
					socket.send(packet);
					connections[packetConnectionID + ":server"].messageReceiveEvent = new events.EventEmitter();
					connections[packetConnectionID + ":server"].messageSendEvent = new events.EventEmitter();
					let lock, _lock, lockc = 0;
					connections[packetConnectionID + ":server"].messageSendEvent.on("message", async function(sentMessage) {
						let mylockc = lockc;
						while (lockc >= mylockc && lockc != 0) await lock;
						lockc++;
						lock = new Promise(r => _lock = r);
						let iv = crypto.getRandomValues(new Uint8Array(12));
						let ct = new Uint8Array(await crypto.subtle.encrypt({
							name: "AES-GCM",
							iv
						}, connections[packetConnectionID + ":server"].aesUsableKey, sentMessage));
						let packet = new Uint8Array(79 + ct.byteLength);
						packet.set(serverAddress, 0);
						packet.set(hexToU8A(connections[packetConnectionID + ":server"].from), 16);
						packet.set(Uint8Array.from([ 3, 255 ]), 48); // Connectionful Protocol; is/not a server
						packet.set(hexToU8A(packetConnectionID), 50);
						packet.set(Uint8Array.from([ 3 ]), 66); // Data
						packet.set(iv, 67);
						packet.set(ct, 79);
						socket.send(packet);
						lockc--;
						_lock();
					});
					connectedEvent.emit("connected", {
						connectionID: packetConnectionID,
						messageReceiveEvent: connections[packetConnectionID + ":server"].messageReceiveEvent,
						messageSendEvent: connections[packetConnectionID + ":server"].messageSendEvent,
						publicKey: theirMainKeyDecrypt
					});
				} else if (gotPacket[66] == 2) { // drop
					if (!connections.hasOwnProperty(packetConnectionID + ":server")) return;
					let packet = new Uint8Array(67);
					packet.set(serverAddress, 0);
					packet.set(gotPacket.slice(0, 16), 16);
					packet.set(gotPacket.slice(32, 48), 32);
					packet.set(Uint8Array.from([ 3, 255 ]), 48); // Connectionful Protocol; a server
					packet.set(hexToU8A(packetConnectionID), 50);
					packet.set(Uint8Array.from([ 2 ]), 66); // Drop
					socket.send(packet);
				} else if (gotPacket[66] == 3) {
					if (!connections.hasOwnProperty(packetConnectionID + ":server")) return;
					if (!connections[packetConnectionID + ":server"].aesUsableKey) return;
					if (!connections[packetConnectionID + ":server"].theirMainKeyReceived) return;
					connections[packetConnectionID + ":server"].messageReceiveEvent.emit("message", new Uint8Array(await crypto.subtle.decrypt({
						name: "AES-GCM",
						iv: gotPacket.slice(67, 79)
					}, connections[packetConnectionID + ":server"].aesUsableKey, gotPacket.slice(79))));
				}
			} catch (e) { console.error(e); }
		}
	});
	return { getConnections: () => connections, connectedEvent };
}

http.listen(3945, function() {
	console.log("Listening on port 3945");
});