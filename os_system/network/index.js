const express = require("express");
const ws = require("ws");
const crypto = require("crypto");
const { b64dec, generateString } = require("./b64dec");
const app = express();
const http = require("http").createServer(app);
const path = require("path/posix");
const fs = require("fs");
const server = new ws.Server({ server: http });
const events = require("events");
let socketList = {};
let serverPublicKey = require("../keypair.json").serverKey;
let usableKey = crypto.subtle.importKey("jwk", require("../keypair.json").serverKey_private, {name: "Ed25519"}, false, ["sign"]);
const fileNotFoundPage = "document.body.innerText = '404. File not found';";
let hexToU8A = (hex) => Uint8Array.from(hex.match(/.{1,2}/g).map(a => parseInt(a, 16)));
let u8aToHex = (u8a) => Array.from(u8a).map(a => a.toString(16).padStart(2, "0")).join("");
const serverAddress = "7f00000150434f53334e6574776f726b";
const symbols = "abcdefghijklmnopqrstuvwxyz0123456789_-";
let dnsTable = {
	"pcosserver.pc": serverAddress
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
	let ip = crypto.createHash("sha256").update(req.headers["cf-connecting-ip"] || 
		String(req.headers["x-forwarded-for"] || "").split(",")[0] ||
		req.socket.remoteAddress).digest().toString("hex").slice(0, 8);
	let kverif_stage = 0;
	let publicKey, ipk;
	let signBytes;
	let alive = true;
	let hostname;
	socket.send(JSON.stringify({ event: "Connected" }));
	socket.on("message", async function(message) {
		message = message.toString();
		if (kverif_stage == 0) {
			try {
				publicKey = JSON.parse(message);
				if (!publicKey.x) throw new Error("NotEllipticCurveKey");
				ipk = crypto.createPublicKey({
					key: publicKey,
					format: "jwk"
				});
			} catch {
				socket.send(JSON.stringify({ event: "PublicKeyInvalid" }));
				return socket.terminate();
			}
			kverif_stage = 1;
			signBytes = crypto.randomBytes(64).toString("hex");
			socket.send(JSON.stringify({ event: "SignatureRequest", signBytes: signBytes }));
		} else if (kverif_stage == 1) {
			try {
				if (!crypto.verify(undefined, Buffer.from(signBytes, "hex"), { key: ipk }, Buffer.from(message, "hex"))) throw new Error("SignatureInvalid");
			} catch {
				socket.send(JSON.stringify({ event: "SignatureInvalid" }));
				return socket.terminate();
			}
			kverif_stage = 2;
			ipk = null;

			let xHash = crypto.createHash("sha256").update(Buffer.from(b64dec(publicKey.x), "hex")).digest().toString("hex").padStart(16, "0").slice(0, 16);
			let forceSetting = publicKey.forceConnect;
			hostname = (publicKey.hostname?.slice(0, 16)?.match(/[a-z0-9\-_]+/g)?.join("") || generateString(BigInt("0x" + crypto.randomBytes(8).toString("hex")), symbols)) + ".basic";
			if (dnsTable[hostname]) hostname = generateString(BigInt("0x" + crypto.randomBytes(8).toString("hex")), symbols) + ".basic";
			publicKey = xHash + (Math.floor(Math.abs(parseInt(publicKey.userCustomizable) || 0))).toString(16).padStart(8, "0").slice(0, 8);
			if (socketList.hasOwnProperty(ip + publicKey) && !forceSetting) {
				socket.send(JSON.stringify({ event: "AddressConflict", address: ip + publicKey }));
				return socket.terminate();
			}
			if ((ip + publicKey) == serverAddress) {
				socket.send(JSON.stringify({ event: "ServerAddressConflict", address: ip + publicKey }));
				return socket.terminate();
			}
			dnsTable[hostname] = ip + publicKey;
			socket.send(JSON.stringify({
				event: "ConnectionEstablished",
				address: ip + publicKey,
				hostname
			}));
			socketList[ip + publicKey] = socket;
			let {connectedEvent: connectedEventBDP} = ConnfulServer("blog", socket, ip + publicKey);
			connectedEventBDP.on("connected", function(a) {
				let {messageReceiveEvent, messageSendEvent} = a;
				messageReceiveEvent.once("message", function(d) {
					let pathname = path.join(__dirname, "js_files", d);
					if (!path.normalize(pathname).startsWith(path.join(__dirname, "js_files"))) {
						messageSendEvent.emit("message", JSON.stringify({
							type: "script",
							length: 1,
							error: "PERMISSION_DENIED"
						}));
						return messageSendEvent.emit("message", JSON.stringify({ ctr: 0, chunk: "document.body.innerText = 'You cannot do that!';" }));
					}
					if (!path.extname(pathname)) pathname = path.join(pathname, "index.js");
					let file = fileNotFoundPage, fileFound = false;
					try {
						file = fs.readFileSync(pathname).toString();
						fileFound = true;
					} catch {}
					messageSendEvent.emit("message", JSON.stringify({
						type: path.extname(pathname) == ".js" ? "script" : "file",
						length: Math.ceil(file.length / 65536),
						error: fileFound ? null : "NO_SUCH_FILE",
						filename: path.basename(pathname)
					}));
					for (let i = 0; i != Math.ceil(file.length / 65536); i++) {
						messageSendEvent.emit("message", JSON.stringify({
							ctr: i,
							chunk: file.slice(i * 65536, (i + 1) * 65536)
						}));
					}
				})
			});
			let {connectedEvent: connectedEventNetFS} = ConnfulServer("netfs", socket, ip + publicKey);
			connectedEventNetFS.on("connected", function(a) {
				let {messageReceiveEvent, messageSendEvent} = a;
				messageReceiveEvent.on("message", function(d) {
					try {
						d = JSON.parse(d);
						if (d.action == "properties") messageSendEvent.emit("message", JSON.stringify({ data: {
								directory_supported: true,
								read_only: true,
								filesystem: "netfs",
								permissions_supported: false
							}}));
						else if (d.action == "read" || d.action == "ls" || d.action == "isDirectory") {
							let dpath = (d.action == "read" || d.action == "isDirectory") ? d.key : d.directory;
							if (!path.normalize(path.join(__dirname, "fs_files", dpath)).startsWith(path.join(__dirname, "fs_files")))
								return messageSendEvent.emit("message", JSON.stringify({ error: "PERMISSION_DENIED" }));
							let realPathname = path.join(__dirname, "fs_files", dpath);
							try {
								if (d.action == "read") messageSendEvent.emit("message", JSON.stringify({ data: fs.readFileSync(realPathname).toString() }));
								else if (d.action == "isDirectory") messageSendEvent.emit("message", JSON.stringify({ data: fs.statSync(realPathname).isDirectory() }));
								else if (d.action == "ls") messageSendEvent.emit("message", JSON.stringify({ data: fs.readdirSync(realPathname) }));
							} catch {
								messageSendEvent.emit("message", JSON.stringify({ error: "FS_ACTION_FAILED" }));
							}
						} else if (d.action == "sync" || d.action == "unmount")
							messageSendEvent.emit("message", JSON.stringify({ data: true }));
						else messageSendEvent.emit("message", JSON.stringify({ error: "FS_ACTION_FAILED" }));
					} catch {}
				})
			});
			let {connectedEvent: connectedEventResolve} = ConnfulServer("resolve", socket, ip + publicKey);
			connectedEventResolve.on("connected", function(a) {
				let {messageReceiveEvent, messageSendEvent} = a;
				messageReceiveEvent.on("message", function(d) {
					messageSendEvent.emit("message", JSON.stringify(dnsTable[d] || null));
				});
			});
		} else {
			let packetData;
			try {
				packetData = JSON.parse(message);
			} catch {
				return socket.send(JSON.stringify({
					event: "PacketMalformed"
				}));
			}
			if (packetData.finalProxyPacket) {
				delete socketList[ip + publicKey];
				delete dnsTable[hostname];
				socket.send(JSON.stringify({
					event: "DisconnectionComplete",
					packetID: (typeof packetData.id === "string") ? packetData.id.slice(0, 64) : "none"
				}));
				return socket.terminate();
			}
			if (!socketList.hasOwnProperty(packetData.receiver) && packetData.receiver != serverAddress) return socket.send(JSON.stringify({
				event: "AddressUnreachable",
				packetID: (typeof packetData.id === "string") ? packetData.id.slice(0, 64) : "none"
			}));
			if (packetData.receiver == serverAddress) {
				if (packetData.data?.type == "connectionless" && packetData.data?.gate == "resolve") {
					if (typeof packetData.data.content.query === "string" && typeof packetData.data.content.reply === "string") {
						socket.send(JSON.stringify({
							from: serverAddress,
							data: {
								type: "connectionless",
								gate: packetData.data.content.reply,
								content: dnsTable[packetData.data.content.query] || null
							},
							packetID: crypto.randomBytes(32).toString("hex")
						}));
					}
				}
				if (packetData.data?.type == "ping") {
					if (typeof packetData.data.resend === "string" && packetData.data.resend?.length <= 64) socket.send(JSON.stringify({
						from: serverAddress,
						data: {
							type: "pong",
							resend: packetData.data.resend
						}
					}));
				}
			} else {
				socketList[packetData.receiver].send(JSON.stringify({
					from: ip + publicKey,
					data: packetData.data,
					packetID: (typeof packetData.id === "string") ? packetData.id.slice(0, 64) : "none"
				}));
			}
			socket.send(JSON.stringify({
				event: "PacketPong",
				packetID: (typeof packetData.id === "string") ? packetData.id.slice(0, 64) : "none"
			}));
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
		delete socketList[ip + publicKey];
		delete dnsTable[hostname];
		clearInterval(pingCycle);
	});
});

function ConnfulServer(gate, socket, address) {
	let connectedEvent = new events.EventEmitter();
	let connections = {};
	socket.on("message", async function(packetData) {
		try {
			packetData = JSON.parse(packetData.toString());
		} catch { return; }
		if (packetData.data?.type == "connectionful" && packetData.data?.gate == gate && packetData.receiver == serverAddress) {
			try {
				if (packetData.data.action == "start") {
					if (!packetData.data.connectionID) return;
					if (connections[packetData.data.connectionID]) return;
					usableKey = await usableKey;
					let ephemeralKey = await crypto.subtle.generateKey({name: "X25519"}, true, ["deriveBits"]);
					let exported = await crypto.subtle.exportKey("jwk", ephemeralKey.publicKey);
					exported = {signedBy: "serverKey", usages: ["connfulSecureEphemeral"], key:exported};
					let signature = u8aToHex(new Uint8Array(await crypto.subtle.sign({
						name: "Ed25519"
					}, usableKey, new TextEncoder().encode(JSON.stringify(exported)))));
					let theirUsableKey = await crypto.subtle.importKey("jwk", packetData.data.content.keyInfo.key, {
						name: "X25519"
					}, true, []);
					let joinedKeys = await crypto.subtle.deriveBits({ name: "X25519", public: theirUsableKey }, ephemeralKey.privateKey, 256);
					let aesUsableKey = await crypto.subtle.importKey("raw", joinedKeys, {name: "AES-GCM"}, true, ["encrypt", "decrypt"]);
					connections[packetData.data.connectionID] = {
						ourKey: ephemeralKey,
						from: address,
						theirMainKeyReceived: false,
						theirKeyRaw: packetData.data.content,
						aesUsableKey
					}
					socket.send(JSON.stringify({
						from: serverAddress,
						data: {
							type: "connectionful",
							action: "start",
							content: {
								keyInfo: exported,
								signature
							},
							connectionID: packetData.data.connectionID
						}
					}));
				} else if (packetData.data.action == "xchange") {
					if (!packetData.data.connectionID) return;
					if (!connections.hasOwnProperty(packetData.data.connectionID)) return;
					if (connections[packetData.data.connectionID].theirMainKeyReceived) return;
					let theirMainKeyDecrypt = JSON.parse(new TextDecoder().decode(await crypto.subtle.decrypt({
						name: "AES-GCM",
						iv: hexToU8A(packetData.data.content.iv),
					}, connections[packetData.data.connectionID].aesUsableKey, hexToU8A(packetData.data.content.ct))));
					let usableMainKey = await crypto.subtle.importKey("jwk", theirMainKeyDecrypt.keyInfo.key, { name: "Ed25519" }, true, ["verify"]);
					let verifyKeySignature = await crypto.subtle.verify({
						name: "Ed25519"
					}, usableMainKey, hexToU8A(connections[packetData.data.connectionID].theirKeyRaw.signature), new TextEncoder().encode(JSON.stringify(connections[packetData.data.connectionID].theirKeyRaw.keyInfo)));
					if (!verifyKeySignature || !theirMainKeyDecrypt.keyInfo.usages.includes("connfulSecureClient:" + address)) {
						delete connections[packetData.data.connectionID];
						socket.send(JSON.stringify({
							from: serverAddress,
							data: {
								type: "connectionful",
								action: "drop",
								connectionID: packetData.data.connectionID
							}
						}));
						return;
					}
					connections[packetData.data.connectionID].theirMainKeyReceived = theirMainKeyDecrypt;
					let iv = crypto.getRandomValues(new Uint8Array(16));
					socket.send(JSON.stringify({
						from: serverAddress,
						data: {
							type: "connectionful",
							action: "xchange",
							connectionID: packetData.data.connectionID,
							content: {
								iv: u8aToHex(iv),
								ct: u8aToHex(new Uint8Array(await crypto.subtle.encrypt({
									name: "AES-GCM",
									iv
								}, connections[packetData.data.connectionID].aesUsableKey, new TextEncoder().encode(JSON.stringify(serverPublicKey)))))
							}
						}
					}));
					connections[packetData.data.connectionID].messageReceiveEvent = new events.EventEmitter();
					connections[packetData.data.connectionID].messageSendEvent = new events.EventEmitter();
					connectedEvent.emit("connected", {
						connectionID: packetData.data.connectionID,
						messageReceiveEvent: connections[packetData.data.connectionID].messageReceiveEvent,
						messageSendEvent: connections[packetData.data.connectionID].messageSendEvent,
						publicKey: theirMainKeyDecrypt
					});
					let lock, _lock, lockc = 0;
					connections[packetData.data.connectionID].messageSendEvent.on("message", async function(sentMessage) {
						let mylockc = lockc;
						while (lockc >= mylockc && lockc != 0) await lock;
						lock = new Promise(r => _lock = r);
						lockc++;
						let iv = crypto.getRandomValues(new Uint8Array(16));
						socket.send(JSON.stringify({
							from: serverAddress,
							data: {
								type: "connectionful",
								action: "data",
								connectionID: packetData.data.connectionID,
								content: {
									iv: u8aToHex(iv),
									ct: u8aToHex(new Uint8Array(await crypto.subtle.encrypt({
										name: "AES-GCM",
										iv
									}, connections[packetData.data.connectionID].aesUsableKey, new TextEncoder().encode(sentMessage))))
								}
							}
						}));
						lockc--;
						_lock();
					})
				} else if (packetData.data.action == "drop") {
					if (!packetData.data.connectionID) return;
					if (!connections.hasOwnProperty(packetData.data.connectionID)) return;
					delete connections[packetData.data.connectionID];
					socket.send(JSON.stringify({
						from: serverAddress,
						data: {
							type: "connectionful",
							action: "drop",
							connectionID: packetData.data.connectionID
						}
					}));
				} else if (packetData.data.action == "data") {
					if (!packetData.data.connectionID) return;
					if (!connections.hasOwnProperty(packetData.data.connectionID)) return;
					if (!connections[packetData.data.connectionID].theirMainKeyReceived) return;
					let data = new TextDecoder().decode(await crypto.subtle.decrypt({
						name: "AES-GCM",
						iv: hexToU8A(packetData.data.content.iv)
					}, connections[packetData.data.connectionID].aesUsableKey, hexToU8A(packetData.data.content.ct)));
					connections[packetData.data.connectionID].messageReceiveEvent.emit("message", data);
				}
			} catch (e) { console.error(e); }
		}
	});
	return { getConnections: () => connections, connectedEvent };
}

http.listen(3945, function() {
	console.log("Listening on port 3945");
});