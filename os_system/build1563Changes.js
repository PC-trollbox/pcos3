const fs = require("fs");
const crypto = require("crypto");
let keypair = require("./keypair.json");
if (keypair.automaticSigner.friendlyName) {
	console.log("Seems like you have already done it");
	return;
}

keypair.pcosIntermediate = keypair.intermediateKey;
keypair.pcosIntermediate_private = keypair.intermediateKey_signature;
keypair.moduleSigner = keypair.moduleTrust;
keypair.moduleSigner_private = keypair.moduleTrust_private;
delete keypair.intermediateKey;
delete keypair.intermediateKey_signature;
delete keypair.moduleTrust;
delete keypair.moduleTrust_private;

keypair.pcosIntermediate.keyInfo.friendlyNameDB = {
	en: "PCsoft intermediate trust authority",
	ru: "Промежуточный центр доверия PCsoft"
};
keypair.automaticSigner.keyInfo.friendlyNameDB = {
	en: "PCsoft program trust authority",
	ru: "Центр доверия программам PCsoft"
};
keypair.moduleSigner.keyInfo.friendlyNameDB = {
	en: "PCsoft module trust authority",
	ru: "Центр доверия модулям PCsoft"
};
keypair.serverKey.keyInfo.friendlyNameDB = {
	en: "PCsoft system servicing",
	ru: "Обслуживание систем PCsoft"
};

keypair.pcosIntermediate.signature = crypto.sign(undefined, JSON.stringify(keypair.pcosIntermediate.keyInfo), {
	key: keypair.ksk_private, format: "jwk" }).toString("hex");
keypair.automaticSigner.signature = crypto.sign(undefined, JSON.stringify(keypair.automaticSigner.keyInfo), {
	key: keypair.pcosIntermediate_private, format: "jwk" }).toString("hex");
keypair.moduleSigner.signature = crypto.sign(undefined, JSON.stringify(keypair.moduleSigner.keyInfo), {
	key: keypair.pcosIntermediate_private, format: "jwk" }).toString("hex");
keypair.serverKey.signature = crypto.sign(undefined, JSON.stringify(keypair.serverKey.keyInfo), {
	key: keypair.pcosIntermediate_private, format: "jwk" }).toString("hex");

fs.writeFileSync("./keypair.json", JSON.stringify(keypair));
fs.writeFileSync(__dirname + "/module_combine/modules/keys.fs.wrk/etc/keys/pcosIntermediate", JSON.stringify(keypair.pcosIntermediate));
fs.writeFileSync(__dirname + "/module_combine/modules/keys.fs.wrk/etc/keys/automaticSigner", JSON.stringify(keypair.automaticSigner));
fs.writeFileSync(__dirname + "/module_combine/modules/keys.fs.wrk/etc/keys/moduleSigner", JSON.stringify(keypair.moduleSigner));
console.log("Made build-1563 changes.");