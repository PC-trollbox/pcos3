const fs = require("fs");
const crypto = require("crypto");
let keypair = crypto.generateKeyPairSync("ec", {
    namedCurve: "P-256"
});
let keypair2 = crypto.generateKeyPairSync("ec", {
    namedCurve: "P-256"
});
let keypairSignature = crypto.sign("sha256", JSON.stringify(keypair2.publicKey.export({
    format: "jwk"
})), {
    key: keypair.privateKey,
    dsaEncoding: "ieee-p1363"
}).toString("hex");

fs.writeFileSync("./keypair.json", JSON.stringify({
    ksk: keypair.privateKey.export({
        format: "jwk"
    }),
    automaticSigner: {
        signature: keypairSignature,
        key: keypair2.privateKey.export({
            format: "jwk"
        })
    }
}));