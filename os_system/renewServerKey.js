const fs = require("fs");
const crypto = require("crypto");
let keypair = require("./keypair.json");

let serverTrust = crypto.generateKeyPairSync("ed25519");

let serverTrustInfo = {
	key: serverTrust.publicKey.export({ format: "jwk" }),
	usages: [ "connfulSecureServer:7f00000150434f53334e6574776f726b", "connfulSecureServer:pcosserver.pc" ],
	signedBy: "pcosIntermediate",
	dates: {
		since: Date.now(),
		until: Date.now() + 90 * 86400000
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