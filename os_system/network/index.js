const express = require("express");
const ws = require("ws");
const crypto = require("crypto");
const b64dec = require("./b64dec");
const app = express();
const http = require("http").createServer(app);
const path = require("path/posix");
const server = new ws.Server({ server: http });
let socketList = {};
let sfspMountModule = require("./sfsp_mount");
let globalMount = sfspMountModule({});
let sessionTokens = {};

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
app.use("/os_system/managed", function(req, res) {
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
	socket.send(JSON.stringify({ event: "Connected" }));
	socket.on("message", function(message) {
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
			publicKey = xHash + yHash + (Math.floor(Math.abs(parseInt(publicKey.userCustomizable) || 0))).toString(16).padStart(8, "0").slice(0, 8);
			if (socketList.hasOwnProperty(ip + publicKey) && !forceSetting) {
				socket.send(JSON.stringify({ event: "AddressConflict", address: ip + publicKey }));
				return socket.terminate();
			}
			socket.send(JSON.stringify({
				event: "ConnectionEstablished",
				address: ip + publicKey
			}));
			socketList[ip + publicKey] = socket;
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
				socket.send(JSON.stringify({
					event: "DisconnectionComplete",
					packetID: (typeof packetData.id === "string") ? packetData.id.slice(0, 64) : "none"
				}));
				return socket.terminate();
			}
			if (!socketList.hasOwnProperty(packetData.receiver)) return socket.send(JSON.stringify({
				event: "AddressUnreachable",
				packetID: (typeof packetData.id === "string") ? packetData.id.slice(0, 64) : "none"
			}));
			socketList[packetData.receiver].send(JSON.stringify({
				from: ip + publicKey,
				data: packetData.data,
				packetID: (typeof packetData.id === "string") ? packetData.id.slice(0, 64) : "none"
			}));
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
		clearInterval(pingCycle);
	});
});

http.listen(3945, function() {
	console.log("Listening on port 3945");
});