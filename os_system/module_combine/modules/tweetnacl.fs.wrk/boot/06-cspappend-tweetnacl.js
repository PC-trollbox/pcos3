// @pcos-app-mode native
modules.csps.tweetnacl = {
	cspMetadata: function() {
		return {
			name: "TweetNaCl Cryptographic Provider",
			version: "1.0.3",
			developer: "TweetNaCl.js developers (https://github.com/dchest/tweetnacl-js)",
			features: Object.keys(modules.csps.tweetnacl)
		}
	},
	random: typedArray => nacl.randomBytes(typedArray.length),
	generateKey: type => nacl[type].keyPair(),
	deriveKey: arg => nacl[arg.type].keyPair.fromSeed(arg.seed),
	digest: message => nacl.hash(message),
	encrypt: arg => nacl[arg.type](arg.message, arg.nonce, arg.key1, arg.key2),
	sign: arg => nacl.sign.detached(arg.message, arg.secretKey),
	decrypt: arg => nacl[arg.type].open(arg.box, arg.nonce, arg.key1, arg.key2),
	verify: arg => nacl.sign.detached.verify(arg.message, arg.signature, arg.publicKey)
};