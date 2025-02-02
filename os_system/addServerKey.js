const fs = require("fs");
const crypto = require("crypto");
let keypair = require("./keypair.json");
if (keypair.serverKey) {
	console.log("Seems like you have already done it");
	return;
}
let serverKey = crypto.generateKeyPairSync("ec", {
	namedCurve: "P-256"
});
let keyInfo = {
	key: serverKey.publicKey.export({
		format: "jwk"
	}),
	usages: [ "connfulSecureServer:7f00000150434f53334e6574776f726b", "connfulSecureServer:pcosserver.pc" ]
};
keypair.serverKey_private = serverKey.privateKey.export({
	format: "jwk"
});
let keySignature = crypto.sign("sha256", JSON.stringify(keyInfo), {
	key: keypair.ksk_private,
	dsaEncoding: "ieee-p1363",
	format: "jwk"
}).toString("hex");
keypair.serverKey = {
	keyInfo,
	signature: keySignature
};
fs.writeFileSync("./keypair.json", JSON.stringify(keypair));
console.log("Added server key to keypair.json");