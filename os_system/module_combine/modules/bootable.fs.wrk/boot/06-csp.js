function loadBasicCSP() {
	modules.csps = {};
	let cryptoKeys = {};
	function cryptoKeyIntoKeyObject(ck, groupBy) {
		if (ck.privateKey && ck.publicKey) return {
			privateKey: cryptoKeyIntoKeyObject(ck.privateKey, groupBy),
			publicKey: cryptoKeyIntoKeyObject(ck.publicKey, groupBy),
		};
		let keyID = crypto.getRandomValues(new Uint8Array(64)).reduce((a, b) => a + b.toString(16).padStart(2, "0"), "");
		if (!cryptoKeys.hasOwnProperty(groupBy)) cryptoKeys[groupBy] = {};
		cryptoKeys[groupBy][keyID] = ck;
		return {
			type: ck.type,
			extractable: ck.extractable,
			algorithm: ck.algorithm,
			usages: ck.usages,
			keyID: keyID
		}
	}
	modules.csps.basic = {
		cspMetadata: function() {
			return {
				name: "Basic Cryptographic Provider",
				version: modules.pcos_version,
				developer: "PCsoft",
				features: Object.keys(modules.csps.basic)
			}
		},
		random: async function(typedArray) {
			return crypto.getRandomValues(typedArray);
		},
		importKey: async function(arg, groupBy) {
			return cryptoKeyIntoKeyObject(await crypto.subtle.importKey(arg.format, arg.keyData, arg.algorithm, arg.extractable, arg.keyUsages), groupBy);
		},
		generateKey: async function(arg, groupBy) {
			return cryptoKeyIntoKeyObject(await crypto.subtle.generateKey(arg.algorithm, arg.extractable, arg.keyUsages), groupBy);
		},
		deriveBits: async function(arg, groupBy) {
			arg.baseKey = cryptoKeys[groupBy][arg.baseKey.keyID];
			if (arg.algorithm.public) arg.algorithm.public = cryptoKeys[groupBy][arg.algorithm.public.keyID];
			return crypto.subtle.deriveBits(arg.algorithm, arg.baseKey, arg.length);
		},
		deriveKey: async function(arg, groupBy) {
			arg.baseKey = cryptoKeys[groupBy][arg.baseKey.keyID];
			if (arg.algorithm.public) arg.algorithm.public = cryptoKeys[groupBy][arg.algorithm.public.keyID];
			return cryptoKeyIntoKeyObject(await crypto.subtle.deriveKey(arg.algorithm, arg.baseKey, arg.derivedKeyType, arg.extractable, arg.keyUsages), groupBy);
		},
		wrapKey: async function(arg, groupBy) {
			arg.key = cryptoKeys[groupBy][arg.key.keyID];
			arg.wrappingKey = cryptoKeys[groupBy][arg.wrappingKey.keyID];
			return crypto.subtle.wrapKey(arg.format, arg.key, arg.wrappingKey, arg.wrapAlgorithm);
		},
		digest: async function(arg) {
			return crypto.subtle.digest(arg.algorithm, arg.data);
		},
		encrypt: async function(arg, groupBy) {
			arg.key = cryptoKeys[groupBy][arg.key.keyID];
			return crypto.subtle.encrypt(arg.algorithm, arg.key, arg.data);
		},
		sign: async function(arg, groupBy) {
			arg.key = cryptoKeys[groupBy][arg.key.keyID];
			return crypto.subtle.sign(arg.algorithm, arg.key, arg.data);
		},
		exportKey: async function(arg, groupBy) {
			arg.key = cryptoKeys[groupBy][arg.key.keyID];
			return crypto.subtle.exportKey(arg.format, arg.key);
		},
		unwrapKey: async function(arg, groupBy) {
			arg.unwrappingKey = cryptoKeys[groupBy][arg.unwrappingKey.keyID];
			return cryptoKeyIntoKeyObject(await crypto.subtle.unwrapKey(arg.format, arg.keyData, arg.unwrappingKey, arg.unwrapAlgorithm, arg.unwrappedKeyAlgorithm, arg.extractable, arg.keyUsages), groupBy);
		},
		decrypt: async function(arg, groupBy) {
			arg.key = cryptoKeys[groupBy][arg.key.keyID];
			return crypto.subtle.decrypt(arg.algorithm, arg.key, arg.data);
		},
		verify: async function(arg, groupBy) {
			arg.key = cryptoKeys[groupBy][arg.key.keyID];
			return crypto.subtle.verify(arg.algorithm, arg.key, arg.signature, arg.data);
		},
		unloadKey: (key, groupBy) => delete cryptoKeys[groupBy][key.keyID],
		removeSameGroupKeys: (_, groupBy) => delete cryptoKeys[groupBy]
	}
	if (window.nacl) {
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
	}
}
loadBasicCSP();