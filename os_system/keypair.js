const fs = require("fs");
const crypto = require("crypto");

let keySigningKey = crypto.generateKeyPairSync("ed25519");
let pcosIntermediateKey = crypto.generateKeyPairSync("ed25519");
let automaticSigner = crypto.generateKeyPairSync("ed25519");
let moduleSigner = crypto.generateKeyPairSync("ed25519");
let serverTrust = crypto.generateKeyPairSync("ed25519");
let networkID = crypto.generateKeyPairSync("ed25519");

let intermediateKeyInfo = {
	key: pcosIntermediateKey.publicKey.export({ format: "jwk" }),
	usages: [ "keyTrust" ],
	friendlyNameDB: {
		en: "PCsoft intermediate trust authority",
		ru: "Промежуточный центр доверия PCsoft"
	}
};
let automaticSignerInfo = {
	key: automaticSigner.publicKey.export({ format: "jwk" }),
	usages: [ "appTrust" ],
	signedBy: "pcosIntermediate",
	friendlyNameDB: {
		en: "PCsoft program trust authority",
		ru: "Центр доверия программам PCsoft"
	}
};
let moduleSignerInfo = {
	key: moduleSigner.publicKey.export({ format: "jwk" }),
	usages: [ "moduleTrust" ],
	signedBy: "pcosIntermediate",
	friendlyNameDB: {
		en: "PCsoft module trust authority",
		ru: "Центр доверия модулям PCsoft"
	}
};
let serverTrustInfo = {
	key: serverTrust.publicKey.export({ format: "jwk" }),
	usages: [ "connfulSecureServer:7f00000150434f53334e6574776f726b", "connfulSecureServer:pcosserver.pc" ],
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

let intermediateKeySignature = crypto.sign(undefined, JSON.stringify(intermediateKeyInfo), keySigningKey.privateKey).toString("hex");
let automaticSignerSignature = crypto.sign(undefined, JSON.stringify(automaticSignerInfo), pcosIntermediateKey.privateKey).toString("hex");
let moduleSignerSignature = crypto.sign(undefined, JSON.stringify(moduleSignerInfo), pcosIntermediateKey.privateKey).toString("hex");
let serverTrustSignature = crypto.sign(undefined, JSON.stringify(serverTrustInfo), pcosIntermediateKey.privateKey).toString("hex");

let keypair = {
	ksk: keySigningKey.publicKey.export({ format: "jwk" }),
	pcosIntermediate: {
		signature: intermediateKeySignature,
		keyInfo: intermediateKeyInfo
	},
	automaticSigner: {
		signature: automaticSignerSignature,
		keyInfo: automaticSignerInfo
	},
	moduleSigner: {
		signature: moduleSignerSignature,
		keyInfo: moduleSignerInfo
	},
	serverKey: {
		signature: serverTrustSignature,
		keyInfo: serverTrustInfo
	},
	networkID: networkID.publicKey.export({ format: "jwk" }),
	ksk_private: keySigningKey.privateKey.export({ format: "jwk" }),
	pcosIntermediate_private: pcosIntermediateKey.privateKey.export({ format: "jwk" }),
	automaticSigner_private: automaticSigner.privateKey.export({ format: "jwk" }),
	moduleSigner_private: moduleSigner.privateKey.export({ format: "jwk" }),
	serverKey_private: serverTrust.privateKey.export({ format: "jwk" }),
	networkID_private: networkID.privateKey.export({ format: "jwk" })
}

fs.writeFileSync(__dirname + "/keypair.json", JSON.stringify(keypair));

fs.writeFileSync(__dirname + "/module_combine/modules/keys.fs.wrk/etc/keys/pcosIntermediate", JSON.stringify(keypair.pcosIntermediate));
fs.writeFileSync(__dirname + "/module_combine/modules/keys.fs.wrk/etc/keys/automaticSigner", JSON.stringify(keypair.automaticSigner));
fs.writeFileSync(__dirname + "/module_combine/modules/keys.fs.wrk/etc/keys/moduleSigner", JSON.stringify(keypair.moduleSigner));

let networkIDHash = crypto.createHash("sha256").update(Buffer.from(keypair.networkID.x, "base64url")).digest().subarray(0, 6).toString("hex");
let tlds = JSON.parse(fs.readFileSync(__dirname + "/module_combine/modules/core.fs.wrk/etc/tlds.json"));
for (let tld in tlds) tlds[tld] = networkIDHash.repeat(2) + "00000001";
fs.writeFileSync(__dirname + "/module_combine/modules/core.fs.wrk/etc/tlds.json", JSON.stringify(tlds));