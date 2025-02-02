const fs = require("fs");
const crypto = require("crypto");
let keypair = crypto.generateKeyPairSync("ec", {
	namedCurve: "P-256"
});
let keypair2 = crypto.generateKeyPairSync("ec", {
	namedCurve: "P-256"
});
let keypair3 = crypto.generateKeyPairSync("ec", {
	namedCurve: "P-256"
})
let keyInfo = {
	key: keypair2.publicKey.export({
		format: "jwk"
	}),
	usages: [ "appTrust" ]
};
let keyInfo2 = {
	key: keypair3.publicKey.export({
		format: "jwk"
	}),
	usages: [ "connfulSecureServer:7f00000150434f53334e6574776f726b", "connfulSecureServer:pcosserver.pc" ]
}
let keypairSignature = crypto.sign("sha256", JSON.stringify(keyInfo), {
	key: keypair.privateKey,
	dsaEncoding: "ieee-p1363"
}).toString("hex");
let keypairSignature2 = crypto.sign("sha256", JSON.stringify(keyInfo2), {
	key: keypair.privateKey,
	dsaEncoding: "ieee-p1363"
}).toString("hex");

fs.writeFileSync("./keypair.json", JSON.stringify({
	ksk: keypair.publicKey.export({
		format: "jwk"
	}),
	ksk_private: keypair.privateKey.export({
		format: "jwk"
	}),
	automaticSigner: {
		signature: keypairSignature,
		keyInfo: keyInfo
	},
	automaticSigner_private: keypair2.privateKey.export({
		format: "jwk"
	}),
	serverKey: {
		signature: keypairSignature2,
		keyInfo: keyInfo2
	},
	serverKey_private: keypair3.privateKey.export({
		format: "jwk"
	})
}));


fs.writeFileSync("./combine_into_index/etc/keys/automaticSigner", JSON.stringify({
	signature: keypairSignature,
	keyInfo: keyInfo
}));