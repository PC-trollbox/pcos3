const fs = require("fs");
const crypto = require("crypto");

let keySigningKey = crypto.generateKeyPairSync("ec", { namedCurve: "P-256" });
let intermediateKey = crypto.generateKeyPairSync("ec", { namedCurve: "P-256" });
let appTrust = crypto.generateKeyPairSync("ec", { namedCurve: "P-256" });
let moduleTrust = crypto.generateKeyPairSync("ec", { namedCurve: "P-256" });
let serverTrust = crypto.generateKeyPairSync("ec", { namedCurve: "P-256" });

let intermediateKeyInfo = {
	key: intermediateKey.publicKey.export({ format: "jwk" }),
	usages: [ "keyTrust" ]
};
let appTrustInfo = {
	key: appTrust.publicKey.export({ format: "jwk" }),
	usages: [ "appTrust" ],
	signedBy: "pcosIntermediate"
};
let moduleTrustInfo = {
	key: moduleTrust.publicKey.export({ format: "jwk" }),
	usages: [ "moduleTrust" ],
	signedBy: "pcosIntermediate"
};
let serverTrustInfo = {
	key: serverTrust.publicKey.export({ format: "jwk" }),
	usages: [ "connfulSecureServer:7f00000150434f53334e6574776f726b", "connfulSecureServer:pcosserver.pc" ],
	signedBy: "pcosIntermediate",
	dates: {
		since: Date.now(),
		until: Date.now() + 90 * 86400000
	}
};

let intermediateKeySignature = crypto.sign("sha256", JSON.stringify(intermediateKeyInfo), {
	key: keySigningKey.privateKey,
	dsaEncoding: "ieee-p1363"
}).toString("hex");
let appTrustSignature = crypto.sign("sha256", JSON.stringify(appTrustInfo), {
	key: intermediateKey.privateKey,
	dsaEncoding: "ieee-p1363"
}).toString("hex");
let moduleTrustSignature = crypto.sign("sha256", JSON.stringify(moduleTrustInfo), {
	key: intermediateKey.privateKey,
	dsaEncoding: "ieee-p1363"
}).toString("hex");
let serverTrustSignature = crypto.sign("sha256", JSON.stringify(serverTrustInfo), {
	key: intermediateKey.privateKey,
	dsaEncoding: "ieee-p1363"
}).toString("hex");

let keypair = {
	ksk: keySigningKey.publicKey.export({ format: "jwk" }),
	intermediateKey: {
		signature: intermediateKeySignature,
		keyInfo: intermediateKeyInfo
	},
	automaticSigner: {
		signature: appTrustSignature,
		keyInfo: appTrustInfo
	},
	moduleTrust: {
		signature: moduleTrustSignature,
		keyInfo: moduleTrustInfo
	},
	serverKey: {
		signature: serverTrustSignature,
		keyInfo: serverTrustInfo
	},
	ksk_private: keySigningKey.privateKey.export({ format: "jwk" }),
	intermediateKey_signature: intermediateKey.privateKey.export({ format: "jwk" }),
	automaticSigner_private: appTrust.privateKey.export({ format: "jwk" }),
	moduleTrust_private: moduleTrust.privateKey.export({ format: "jwk" }),
	serverKey_private: serverTrust.privateKey.export({ format: "jwk" })
}

fs.writeFileSync(__dirname + "/keypair.json", JSON.stringify(keypair));

fs.writeFileSync(__dirname + "/module_combine/modules/keys.fs.wrk/etc/keys/pcosIntermediate", JSON.stringify(keypair.intermediateKey));
fs.writeFileSync(__dirname + "/module_combine/modules/keys.fs.wrk/etc/keys/automaticSigner", JSON.stringify(keypair.automaticSigner));
fs.writeFileSync(__dirname + "/module_combine/modules/keys.fs.wrk/etc/keys/moduleSigner", JSON.stringify(keypair.moduleTrust));