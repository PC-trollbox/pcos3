const fs = require("fs");
const crypto = require("crypto");
let keypair = require("./keypair.json");
if (keypair.moduleTrust || keypair.intermediateKey) {
	console.log("Seems like you have already done it");
	return;
}

let intermediateKey = crypto.generateKeyPairSync("ec", { namedCurve: "P-256" });
let moduleTrust = crypto.generateKeyPairSync("ec", { namedCurve: "P-256" });

let intermediateKeyInfo = {
	key: intermediateKey.publicKey.export({ format: "jwk" }),
	usages: [ "keyTrust" ]
};
let moduleTrustInfo = {
	key: moduleTrust.publicKey.export({ format: "jwk" }),
	usages: [ "moduleTrust" ],
	signedBy: "pcosIntermediate"
};

let intermediateKeySignature = crypto.sign("sha256", JSON.stringify(intermediateKeyInfo), {
	key: keypair.ksk_private,
	format: "jwk",
	dsaEncoding: "ieee-p1363"
}).toString("hex");
let moduleTrustSignature = crypto.sign("sha256", JSON.stringify(moduleTrustInfo), {
	key: intermediateKey.privateKey,
	dsaEncoding: "ieee-p1363"
}).toString("hex");

keypair.intermediateKey = { keyInfo: intermediateKeyInfo, signature: intermediateKeySignature };
keypair.moduleTrust = { keyInfo: moduleTrustInfo, signature: moduleTrustSignature };
keypair.intermediateKey_signature = intermediateKey.privateKey.export({ format: "jwk" });
keypair.moduleTrust_private = moduleTrust.privateKey.export({ format: "jwk" });

keypair.automaticSigner.keyInfo.signedBy = "pcosIntermediate";
keypair.serverKey.keyInfo.signedBy = "pcosIntermediate";
keypair.serverKey.keyInfo.dates = { since: Date.now(), until: Date.now() + 90 * 86400000 };
keypair.automaticSigner.signature = crypto.sign("sha256", JSON.stringify(keypair.automaticSigner.keyInfo), {
	key: intermediateKey.privateKey,
	dsaEncoding: "ieee-p1363"
}).toString("hex");
keypair.serverKey.signature = crypto.sign("sha256", JSON.stringify(keypair.serverKey.keyInfo), {
	key: intermediateKey.privateKey,
	dsaEncoding: "ieee-p1363"
}).toString("hex");

fs.writeFileSync(__dirname + "/module_combine/modules/keys.fs.wrk/etc/keys/pcosIntermediate", JSON.stringify(keypair.intermediateKey));
fs.writeFileSync(__dirname + "/module_combine/modules/keys.fs.wrk/etc/keys/automaticSigner", JSON.stringify(keypair.automaticSigner));
fs.writeFileSync(__dirname + "/module_combine/modules/keys.fs.wrk/etc/keys/moduleSigner", JSON.stringify(keypair.moduleTrust));
fs.writeFileSync("./keypair.json", JSON.stringify(keypair));
console.log("Made build-1298 changes to various files.");