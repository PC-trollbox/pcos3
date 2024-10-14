const fs = require("fs");
const crypto = require("crypto");
let keypair = require("./keypair.json");
if (keypair.ksk_private && keypair.automaticSigner_private) {
    console.log("Seems like you have already done the conversion");
    return;
}
let oldKsk = structuredClone(keypair.ksk);
keypair.ksk_private = oldKsk;
delete keypair.ksk.d;

let oldAs = structuredClone(keypair.automaticSigner);
keypair.automaticSigner_private = oldAs.key;
let newAsKI = { key: keypair.automaticSigner.key, usages: [ "appTrust" ] };
delete newAsKI.key.d;
let newAsSign = crypto.sign("sha256", JSON.stringify(newAsKI), {
    key: keypair.ksk_private,
    format: "jwk",
    dsaEncoding: "ieee-p1363"
});
keypair.automaticSigner = {
    signature: newAsSign.toString("hex"),
    keyInfo: newAsKI
};

fs.writeFileSync("./keypair.json", JSON.stringify(keypair));
console.log("Converted keypair.json to v2");