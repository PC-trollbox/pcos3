const fs = require("fs");
const crypto = require("crypto");

let keySigningKey = crypto.generateKeyPairSync("ed25519");
let intermediateKey = crypto.generateKeyPairSync("ed25519");
let appTrust = crypto.generateKeyPairSync("ed25519");
let moduleTrust = crypto.generateKeyPairSync("ed25519");
let serverTrust = crypto.generateKeyPairSync("ed25519");
let networkID = crypto.generateKeyPairSync("ed25519");

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

let intermediateKeySignature = crypto.sign(undefined, JSON.stringify(intermediateKeyInfo), keySigningKey.privateKey).toString("hex");
let appTrustSignature = crypto.sign(undefined, JSON.stringify(appTrustInfo), intermediateKey.privateKey).toString("hex");
let moduleTrustSignature = crypto.sign(undefined, JSON.stringify(moduleTrustInfo), intermediateKey.privateKey).toString("hex");
let serverTrustSignature = crypto.sign(undefined, JSON.stringify(serverTrustInfo), intermediateKey.privateKey).toString("hex");

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
	networkID: networkID.publicKey.export({ format: "jwk" }),
	ksk_private: keySigningKey.privateKey.export({ format: "jwk" }),
	intermediateKey_signature: intermediateKey.privateKey.export({ format: "jwk" }),
	automaticSigner_private: appTrust.privateKey.export({ format: "jwk" }),
	moduleTrust_private: moduleTrust.privateKey.export({ format: "jwk" }),
	serverKey_private: serverTrust.privateKey.export({ format: "jwk" }),
	networkID_private: networkID.privateKey.export({ format: "jwk" })
}

fs.writeFileSync(__dirname + "/keypair.json", JSON.stringify(keypair));

fs.writeFileSync(__dirname + "/module_combine/modules/keys.fs.wrk/etc/keys/pcosIntermediate", JSON.stringify(keypair.intermediateKey));
fs.writeFileSync(__dirname + "/module_combine/modules/keys.fs.wrk/etc/keys/automaticSigner", JSON.stringify(keypair.automaticSigner));
fs.writeFileSync(__dirname + "/module_combine/modules/keys.fs.wrk/etc/keys/moduleSigner", JSON.stringify(keypair.moduleTrust));

let networkIDHash = crypto.createHash("sha256").update(Buffer.from(keypair.networkID.x, "base64url")).digest().subarray(0, 6).toString("hex");
let tlds = JSON.parse(fs.readFileSync(__dirname + "/module_combine/modules/core.fs.wrk/etc/tlds.json"));
for (let tld in tlds) tlds[tld] = networkIDHash.repeat(2) + "00000001";
fs.writeFileSync(__dirname + "/module_combine/modules/core.fs.wrk/etc/tlds.json", JSON.stringify(tlds));