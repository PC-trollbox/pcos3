const fs = require("fs");
const crypto = require("crypto");
let keypair = crypto.generateKeyPairSync("ec", {
    namedCurve: "P-256"
});
let keypair2 = crypto.generateKeyPairSync("ec", {
    namedCurve: "P-256"
});
let keyInfo = {
    key: keypair2.publicKey.export({
        format: "jwk"
    }),
    usages: [ "appTrust" ]
};
let keypairSignature = crypto.sign("sha256", JSON.stringify(keyInfo), {
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
    })
}));


fs.writeFileSync("./combine_into_index/etc/keys/automaticSigner", JSON.stringify({
    signature: keypairSignature,
    keyInfo: keyInfo
}));