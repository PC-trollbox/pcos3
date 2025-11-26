const fs = require("fs");
const crypto = require("crypto");
let keypair = require("./keypair.json");

let serverTrust = crypto.generateKeyPairSync("ed25519");
let netprefix = crypto.createHash("sha256").update(Buffer.from(keypair.networkID.x, "base64url")).digest().subarray(0, 6).toString("hex");

let serverTrustInfo = {
	key: serverTrust.publicKey.export({ format: "jwk" }),
	usages: [ "connfulSecureServer:" + netprefix.repeat(2) + "00000001", "connfulSecureServer:pcosserver.pc" ],
	signedBy: "pcosIntermediate",
	dates: {
		since: Date.now(),
		until: Date.now() + 90 * 86400000
	},
	friendlyNameDB: {
		en: "PCsoft system servicing",
		ru: "Обслуживание систем PCsoft"
	}
};

let serverTrustSignature = crypto.sign(undefined, JSON.stringify(serverTrustInfo), { key: keypair.intermediateKey_signature, format: "jwk" }).toString("hex");

keypair.serverKey = {
	signature: serverTrustSignature,
	keyInfo: serverTrustInfo
};
keypair.serverKey_private = serverTrust.privateKey.export({ format: "jwk" });

fs.writeFileSync("./keypair.json", JSON.stringify(keypair));
console.log("Added server key to keypair.json");