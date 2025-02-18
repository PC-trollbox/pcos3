const express = require("express");
const ws = require("ws");
const crypto = require("crypto");
const { b64dec, generateString } = require("./b64dec");
const app = express();
const http = require("http").createServer(app);
const path = require("path/posix");
const fs = require("fs");
const server = new ws.Server({ server: http });
const worker_threads = require("worker_threads");
const events = require("events");
let socketList = {};
let sfspMountModule = require("./sfsp_mount");
let globalMount = sfspMountModule({});
let sessionTokens = {};
let deltaUpdateConns = {};
let serverPublicKey = require("../keypair.json").serverKey;
let usableKey = crypto.subtle.importKey("jwk", require("../keypair.json").serverKey_private, {name: "ECDSA", namedCurve: "P-256"}, false, ["sign"]);
const fileNotFoundPage = "document.body.innerText = '404. File not found';";
let hexToU8A = (hex) => Uint8Array.from(hex.match(/.{1,2}/g).map(a => parseInt(a, 16)));
let u8aToHex = (u8a) => Array.from(u8a).map(a => a.toString(16).padStart(2, "0")).join("");
const serverAddress = "7f00000150434f53334e6574776f726b";
const symbols = "abcdefghijklmnopqrstuvwxyz0123456789_-";
let dnsTable = {
	"pcosserver.pc": serverAddress
};

app.use(function(req, res, next) {
	res.set("Cross-Origin-Embedder-Policy", "require-corp");
	res.set("Cross-Origin-Opener-Policy", "same-origin");
	res.set("Cross-Origin-Resource-Policy", "cross-origin");
	next(); 
});

app.use("/.git", function(req, res) {
	res.status(403).send("no hablo unauthorized accesses");
});
app.use("/os_system/keypair.json", function(req, res) {
	res.status(403).json({
		kty: "EC",
		x: "Look at the status code",
		y: "You arent very amdin",
		crv: "P-256",
		d: "no hablo unauthorized accesses"
	});
});
app.use("/os_system/managed/managedDB.json", function(req, res) {
	res.status(403).send("no hablo unauthorized accesses");
});

app.post("/sfsp/file_operation", express.json(), async function(req, res) {
	if (sessionTokens.hasOwnProperty(req.body.sessionToken)) {
		if (req.body.operation == "unmount") {
			delete sessionTokens[req.body.sessionToken];
			return res.json(true);
		}
		try {
			return res.json(await sessionTokens[req.body.sessionToken][req.body.operation](...req.body.parameters) || null);
		} catch (e) {
			return res.status(500).json({ name: e.name, message: e.message });
		}
	}
	res.sendStatus(401);
});

app.post("/sfsp/properties", express.json(), async function(req, res) {
	if (sessionTokens.hasOwnProperty(req.body.sessionToken)) {
		if (req.body.globalMount) sessionTokens[req.body.sessionToken] = globalMount;
		else if (req.body.collabSetup && !sessionTokens.hasOwnProperty(req.body.collabSetup))
			sessionTokens[req.body.collabSetup] = sessionTokens[req.body.sessionToken];
		else if (req.body.collabLoad && sessionTokens.hasOwnProperty(req.body.collabLoad))
			sessionTokens[req.body.sessionToken] = sessionTokens[req.body.collabLoad];

		return res.json({
			directory_supported: !!sessionTokens[req.body.sessionToken].directory_supported,
			read_only: !!sessionTokens[req.body.sessionToken].read_only,
			filesystem: sessionTokens[req.body.sessionToken].filesystem || "SFSP",
			permissions_supported: !!sessionTokens[req.body.sessionToken].permissions_supported
		});
	}
	res.sendStatus(401);
});

app.get("/sfsp/session", function(req, res) {
	let session = crypto.randomBytes(64).toString("hex");
	sessionTokens[session] = sfspMountModule({});
	res.json(session);
});

app.use("/sfsp", function(req, res) {
	res.sendStatus(400);
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
				if (!publicKey.x && !publicKey.y) throw new Error("NotEllipticCurveKey");
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
				if (!crypto.verify('sha256', Buffer.from(signBytes, "hex"), {
					key: ipk,
					dsaEncoding: "ieee-p1363"
				}, Buffer.from(message, "hex"))) throw new Error("SignatureInvalid");
			} catch {
				socket.send(JSON.stringify({ event: "SignatureInvalid" }));
				return socket.terminate();
			}
			kverif_stage = 2;
			ipk = null;

			let xHash = crypto.createHash("sha256").update(Buffer.from(b64dec(publicKey.x), "hex")).digest().toString("hex").padStart(8, "0").slice(0, 8);
			let yHash = crypto.createHash("sha256").update(Buffer.from(b64dec(publicKey.y), "hex")).digest().toString("hex").padStart(8, "0").slice(0, 8);
			let forceSetting = publicKey.forceConnect;
			hostname = (publicKey.hostname?.slice(0, 16)?.match(/[a-z0-9\-_]+/g)?.join("") || generateString(BigInt("0x" + crypto.randomBytes(8).toString("hex")), symbols)) + ".basic";
			if (dnsTable[hostname]) hostname = generateString(BigInt("0x" + crypto.randomBytes(8).toString("hex")), symbols) + ".basic";
			publicKey = xHash + yHash + (Math.floor(Math.abs(parseInt(publicKey.userCustomizable) || 0))).toString(16).padStart(8, "0").slice(0, 8);
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
			let {connectedEvent} = ConnfulServer("deltaUpdate", socket, ip + publicKey);
			connectedEvent.on("connected", function(a) {
				let {messageReceiveEvent, messageSendEvent} = a;
				messageReceiveEvent.once("message", function(d) {
					let worker = new worker_threads.Worker(__dirname + "/worker_connful.js", {
						workerData: JSON.parse(d)
					});
					worker.addListener("message", function(message) {
						messageSendEvent.emit("message", message);
					})
				})
			});
			let {connectedEvent:connectedEvent2} = ConnfulServer("blog", socket, ip + publicKey);
			connectedEvent2.on("connected", function(a) {
				let {messageReceiveEvent, messageSendEvent} = a;
				messageReceiveEvent.once("message", function(d) {
					if (path.normalize(path.join(__dirname, "js_files", d)) != path.join(__dirname, "js_files", d)) return messageSendEvent.emit("message", JSON.stringify({ ctr: 0, chunk: "document.body.innerText = 'You cannot do that!';" }));
					let pathname = path.join(__dirname, "js_files", d);
					if (!path.extname(pathname)) pathname = path.join(pathname, "index.js");
					let file = fileNotFoundPage;
					try {
						file = fs.readFileSync(pathname).toString();
					} catch {}
					messageSendEvent.emit("message", JSON.stringify({
						type: path.extname(pathname) == ".js" ? "script" : "file",
						length: Math.ceil(file.length / 131072),
						error: fileNotFoundPage.length == file.length ? ((file == fileNotFoundPage) ? "NO_SUCH_FILE" : null) : null
					}));
					for (let i = 0; i != Math.ceil(file.length / 131072); i++) {
						messageSendEvent.emit("message", JSON.stringify({
							ctr: i,
							chunk: file.slice(i * 131072, (i + 1) * 131072)
						}));
					}
				})
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
				if (packetData.data?.type == "connectionless" && packetData.data?.gate == "deltaUpdate") {
					if (typeof packetData.data.content.from === "string" && typeof packetData.data.content.reply === "string") {
						try {
							let worker = new worker_threads.Worker(__dirname + "/worker.js", {
								workerData: { packetData, serverAddress }
							});
							worker.addListener("message", function(message) {
								socket.send(message);
							})
						} catch {}
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
					let ephemeralKey = await crypto.subtle.generateKey({name: "ECDH", namedCurve: "P-256"}, true, ["deriveBits"]);
					let exported = await crypto.subtle.exportKey("jwk", ephemeralKey.publicKey);
					exported = {signedBy: "serverKey", usages: ["connfulSecureEphemeral"], key:exported};
					let signature = u8aToHex(new Uint8Array(await crypto.subtle.sign({
						name: "ECDSA",
						hash: "SHA-256"
					}, usableKey, new TextEncoder().encode(JSON.stringify(exported)))));
					let theirUsableKey = await crypto.subtle.importKey("jwk", packetData.data.content.keyInfo.key, {
						name: "ECDH",
						namedCurve: "P-256"
					}, true, []);
					let joinedKeys = await crypto.subtle.deriveBits({ name: "ECDH", public: theirUsableKey }, ephemeralKey.privateKey, 256);
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
					let usableMainKey = await crypto.subtle.importKey("jwk", theirMainKeyDecrypt.keyInfo.key, {
						name: "ECDSA",
						namedCurve: "P-256"
					}, true, ["verify"]);
					let verifyKeySignature = await crypto.subtle.verify({
						name: "ECDSA",
						hash: "SHA-256"
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
					let lock, _lock;
					connections[packetData.data.connectionID].messageSendEvent.on("message", async function(sentMessage) {
						await lock;
						lock = new Promise(r => _lock = r);
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