const fs = require("fs");
const crypto = require("crypto");
let keypair = require("./keypair.json");
if (keypair.networkID) {
	console.log("Seems like you have already done it");
	return;
}
let networkID = crypto.generateKeyPairSync("ed25519");
keypair.networkID_private = networkID.privateKey.export({ format: "jwk" });
keypair.networkID = networkID.publicKey.export({ format: "jwk" });
fs.writeFileSync("./keypair.json", JSON.stringify(keypair));
console.log("Added Network ID to keypair.json");

let networkIDHash = crypto.createHash("sha256").update(Buffer.from(keypair.networkID.x, "base64url")).digest().subarray(0, 6).toString("hex");
let tlds = JSON.parse(fs.readFileSync(__dirname + "/module_combine/modules/core.fs.wrk/etc/tlds.json"));
for (let tld in tlds) tlds[tld] = networkIDHash.repeat(2) + "00000001";
fs.writeFileSync(__dirname + "/module_combine/modules/core.fs.wrk/etc/tlds.json", JSON.stringify(tlds));
console.log("Updated TLDs");