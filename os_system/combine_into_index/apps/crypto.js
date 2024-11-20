// =====BEGIN MANIFEST=====
// link: lrn:CRYPTO_TOOLS_TITLE
// signer: automaticSigner
// allow: FS_WRITE, IPC_CREATE_PIPE, IPC_LISTEN_PIPE, FS_READ, FS_LIST_PARTITIONS, IPC_SEND_PIPE, GET_LOCALE, GET_THEME, FS_BYPASS_PERMISSIONS, START_TASK, GET_LOCALE, CSP_OPERATIONS
// =====END MANIFEST=====
let hexToU8A = (hex) => Uint8Array.from(hex.match(/.{1,2}/g).map(a => parseInt(a, 16)));
let u8aToHex = (u8a) => Array.from(u8a).map(a => a.toString(16).padStart(2, "0")).join("");
(async function() {
	// @pcos-app-mode isolatable
	await availableAPIs.windowTitleSet(await availableAPIs.lookupLocale("CRYPTO_TOOLS_TITLE"));
	let privileges = await availableAPIs.getPrivileges();
	let checklist = [ "FS_WRITE", "IPC_CREATE_PIPE", "IPC_LISTEN_PIPE", "FS_READ", "FS_LIST_PARTITIONS", "IPC_SEND_PIPE", "START_TASK", "GET_LOCALE", "CSP_OPERATIONS" ];
	document.body.style.fontFamily = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
	if (await availableAPIs.isDarkThemed()) document.body.style.color = "white";
	if (!checklist.every(p => privileges.includes(p))) {
		document.body.innerText = await availableAPIs.lookupLocale("CRYPTO_TOOLS_NOPERM");
		let currentToken = await availableAPIs.getProcessToken();
		let newToken = await availableAPIs.consentGetToken({
			intent: await availableAPIs.lookupLocale("CRYPTO_TOOLS_INTENT"),
			name: await availableAPIs.lookupLocale("CRYPTO_TOOLS_TITLE"),
			desiredUser: await availableAPIs.getUser()
		});
		if (!newToken) return;
		await availableAPIs.setProcessToken(newToken);
		await availableAPIs.revokeToken(currentToken);
		privileges = await availableAPIs.getPrivileges();
		if (!checklist.every(p => privileges.includes(p))) return;
	}
	document.body.innerText = "";
	let pageHeader = document.createElement("b");
	let dividePageHeader = document.createElement("hr");
	let page = document.createElement("div");
	document.body.appendChild(pageHeader);
	document.body.appendChild(dividePageHeader);
	document.body.appendChild(page);
	async function mainPage() {
		pageHeader.innerText = await availableAPIs.lookupLocale("CRYPTO_TOOLS_TITLE");
		page.innerText = "";
		let rng = document.createElement("button");
		let hash = document.createElement("button");
		let keyGeneration = document.createElement("button");
		let encrypt = document.createElement("button");
		let decrypt = document.createElement("button");
		let sign = document.createElement("button");
		let verify = document.createElement("button");
		let deriveBits = document.createElement("button");
		
		rng.innerText = await availableAPIs.lookupLocale("CRYPTO_RNG");
		hash.innerText = await availableAPIs.lookupLocale("CRYPTO_HASH");
		keyGeneration.innerText = await availableAPIs.lookupLocale("CRYPTO_KEYGEN");
		encrypt.innerText = await availableAPIs.lookupLocale("CRYPTO_ENCRYPT");
		decrypt.innerText = await availableAPIs.lookupLocale("CRYPTO_DECRYPT");
		sign.innerText = await availableAPIs.lookupLocale("CRYPTO_SIGN");
		verify.innerText = await availableAPIs.lookupLocale("CRYPTO_VERIFY");
		deriveBits.innerText = await availableAPIs.lookupLocale("CRYPTO_DERIVEBITS");

		rng.onclick = rngPage;
		hash.onclick = hashPage;
		keyGeneration.onclick = keyGenPage;
		encrypt.onclick = encryptPage;
		decrypt.onclick = decryptPage;
		sign.onclick = signPage;
		verify.onclick = verifyPage;
		deriveBits.onclick = deriveBitsPage;

		page.appendChild(rng);
		page.appendChild(hash);
		page.appendChild(keyGeneration);
		page.appendChild(encrypt);
		page.appendChild(decrypt);
		page.appendChild(sign);
		page.appendChild(verify);
		page.appendChild(deriveBits);
	}

	mainPage();

	async function rngPage() {
		page.innerText = "";
		pageHeader.innerText = "";
		let backButton = document.createElement("button");
		let pageHeaderText = document.createElement("span");
		pageHeader.appendChild(backButton);
		pageHeader.appendChild(pageHeaderText);
		let lengthLabel = document.createElement("label");
		let lengthInput = document.createElement("input");
		let rngButton = document.createElement("button");
		let rngLabel = document.createElement("label");
		let rngField = document.createElement("textarea");
		let rngSaveButton = document.createElement("button");

		backButton.innerText = "<-";
		pageHeaderText.innerText = await availableAPIs.lookupLocale("CRYPTO_RNG");
		lengthLabel.innerText = await availableAPIs.lookupLocale("LENGTH_FIELD");
		rngButton.innerText = await availableAPIs.lookupLocale("GENERATE");
		rngLabel.innerText = await availableAPIs.lookupLocale("CRYPTO_RNGOUT_FIELD");
		rngSaveButton.innerText = await availableAPIs.lookupLocale("SAVE_BTN");

		page.appendChild(lengthLabel);
		page.appendChild(lengthInput);
		page.appendChild(document.createElement("hr"));
		page.appendChild(rngButton);
		page.appendChild(document.createElement("hr"));
		page.appendChild(rngLabel);
		page.appendChild(rngSaveButton);
		page.appendChild(document.createElement("br"));
		page.appendChild(rngField);

		lengthInput.type = "number";
		lengthInput.value = 256;
		rngField.readOnly = true;

		backButton.onclick = mainPage;
		rngSaveButton.onclick = async function() {
			let ipcPipe = await availableAPIs.createPipe();
			await availableAPIs.windowVisibility(false);
			await availableAPIs.startTask({ file: (await availableAPIs.getSystemMount()) + "/apps/filePicker.js", argPassed: [ipcPipe, "save"] });
			let result = await availableAPIs.listenToPipe(ipcPipe);
			await availableAPIs.closePipe(ipcPipe);
			await availableAPIs.windowVisibility(true);
			if (result.success) await availableAPIs.fs_write({ path: result.selected, data: rngField.value });
		}
		rngButton.onclick = async function() {
			rngField.value = u8aToHex(await availableAPIs.cspOperation({
				cspProvider: "basic",
				operation: "random",
				cspArgument: new Uint8Array(Math.floor(parseInt(lengthInput.value)))
			}));
		}
	}
	async function hashPage() {
		page.innerText = "";
		pageHeader.innerText = "";
		let backButton = document.createElement("button");
		let pageHeaderText = document.createElement("span");
		pageHeader.appendChild(backButton);
		pageHeader.appendChild(pageHeaderText);
		let plaintextLabel = document.createElement("label");
		let plaintextLoadButton = document.createElement("button");
		let plaintextField = document.createElement("textarea");
		let plaintextFormatLabel = document.createElement("label");
		let plaintextFormatOption = document.createElement("select");
		let hashLabel = document.createElement("label");
		let hashOption = document.createElement("select");
		let hashButton = document.createElement("button");
		let digestLabel = document.createElement("label");
		let digestField = document.createElement("textarea");
		let digestSaveButton = document.createElement("button");

		let hashes = [ "SHA-256", "SHA-384", "SHA-512", "SHA-1" ];
		let textAs = {
			unicode: "UTF-8",
			raw: await availableAPIs.lookupLocale("RAW_HEX_DATA")
		}

		backButton.innerText = "<-";
		pageHeaderText.innerText = await availableAPIs.lookupLocale("CRYPTO_HASH");
		plaintextLabel.innerText = await availableAPIs.lookupLocale("CRYPTO_PLAINTEXT_FIELD");
		plaintextLoadButton.innerText = await availableAPIs.lookupLocale("LOAD_BTN");
		plaintextFormatLabel.innerText = await availableAPIs.lookupLocale("CRYPTO_PLAINTEXTAS_FIELD");
		hashLabel.innerText = await availableAPIs.lookupLocale("CRYPTO_HASH_FIELD");
		hashButton.innerText = await availableAPIs.lookupLocale("CRYPTO_HASH_ACTION");
		digestLabel.innerText = await availableAPIs.lookupLocale("CRYPTO_HASHOUT_FIELD");
		digestSaveButton.innerText = await availableAPIs.lookupLocale("SAVE_BTN");

		page.appendChild(plaintextLabel);
		page.appendChild(plaintextLoadButton);
		page.appendChild(document.createElement("br"));
		page.appendChild(plaintextField);
		page.appendChild(document.createElement("br"));
		page.appendChild(plaintextFormatLabel);
		page.appendChild(plaintextFormatOption);
		page.appendChild(document.createElement("hr"));
		page.appendChild(hashLabel);
		page.appendChild(hashOption);
		page.appendChild(document.createElement("hr"));
		page.appendChild(hashButton);
		page.appendChild(document.createElement("hr"));
		page.appendChild(digestLabel);
		page.appendChild(digestSaveButton);
		page.appendChild(document.createElement("br"));
		page.appendChild(digestField);

		digestField.readOnly = true;

		for (let plaintextFormat in textAs) {
			let option = document.createElement("option");
			option.value = plaintextFormat;
			option.innerText = textAs[plaintextFormat];
			plaintextFormatOption.appendChild(option);
		}

		for (let hash of hashes) {
			let option = document.createElement("option");
			option.value = hash;
			option.innerText = hash;
			hashOption.appendChild(option);
		}

		backButton.onclick = mainPage;
		plaintextLoadButton.onclick = async function() {
			let ipcPipe = await availableAPIs.createPipe();
			await availableAPIs.windowVisibility(false);
			await availableAPIs.startTask({ file: (await availableAPIs.getSystemMount()) + "/apps/filePicker.js", argPassed: [ipcPipe, "load"] });
			let result = await availableAPIs.listenToPipe(ipcPipe);
			await availableAPIs.closePipe(ipcPipe);
			await availableAPIs.windowVisibility(true);
			if (result.success) plaintextField.value = await availableAPIs.fs_read({ path: result.selected });
		}
		digestSaveButton.onclick = async function() {
			let ipcPipe = await availableAPIs.createPipe();
			await availableAPIs.windowVisibility(false);
			await availableAPIs.startTask({ file: (await availableAPIs.getSystemMount()) + "/apps/filePicker.js", argPassed: [ipcPipe, "save"] });
			let result = await availableAPIs.listenToPipe(ipcPipe);
			await availableAPIs.closePipe(ipcPipe);
			await availableAPIs.windowVisibility(true);
			if (result.success) await availableAPIs.fs_write({ path: result.selected, data: digestField.value });
		}
		hashButton.onclick = async function() {
			let data;
			if (plaintextFormatOption.value == "raw") data = hexToU8A(plaintextField.value);
			if (plaintextFormatOption.value == "unicode") data = new TextEncoder().encode(plaintextField.value);
			let digest = await availableAPIs.cspOperation({
				cspProvider: "basic",
				operation: "digest",
				cspArgument: {
					algorithm: hashOption.value,
					data
				}
			});
			digestField.value = u8aToHex(new Uint8Array(digest));
		}
	}
	async function keyGenPage() {
		page.innerText = "";
		pageHeader.innerText = "";
		let backButton = document.createElement("button");
		let pageHeaderText = document.createElement("span");
		pageHeader.appendChild(backButton);
		pageHeader.appendChild(pageHeaderText);
		let algorithmLabel = document.createElement("label");
		let algorithmOption = document.createElement("select");
		let modLenLabel = document.createElement("label");
		let modLen = document.createElement("input");
		let publicExponentLabel = document.createElement("label");
		let publicExponent = document.createElement("input");
		let hashLabel = document.createElement("label");
		let hashOption = document.createElement("select");
		let namedCurveLabel = document.createElement("label");
		let namedCurveOption = document.createElement("select");
		let lengthLabel = document.createElement("label");
		let lengthInput = document.createElement("input");
		let exportAsLabel = document.createElement("label");
		let exportAsOption = document.createElement("select");
		let keyUsagesLabel = document.createElement("label");
		let generateButton = document.createElement("button");
		let publicKeyLabel = document.createElement("label");
		let publicKeySave = document.createElement("button");
		let publicKeyField = document.createElement("textarea");
		let privateKeyLabel = document.createElement("label");
		let privateKeySave = document.createElement("button");
		let privateKeyField = document.createElement("textarea");
		
		backButton.innerText = "<-";
		pageHeaderText.innerText = await availableAPIs.lookupLocale("CRYPTO_KEYGEN");
		algorithmLabel.innerText = await availableAPIs.lookupLocale("ALGORITHM_FIELD");
		modLenLabel.innerText = await availableAPIs.lookupLocale("CRYPTO_MODLEN_FIELD");
		publicExponentLabel.innerText = await availableAPIs.lookupLocale("CRYPTO_PUBEXP_FIELD");
		hashLabel.innerText = await availableAPIs.lookupLocale("CRYPTO_HASH_FIELD");
		namedCurveLabel.innerText = await availableAPIs.lookupLocale("CRYPTO_NC_FIELD");
		lengthLabel.innerText = await availableAPIs.lookupLocale("LENGTH_FIELD");
		exportAsLabel.innerText = await availableAPIs.lookupLocale("EXPORT_AS_FIELD");
		keyUsagesLabel.innerText = await availableAPIs.lookupLocale("CRYPTO_KEYUSE_FIELD");
		generateButton.innerText = await availableAPIs.lookupLocale("CRYPTO_KEYGEN_ACTION");
		publicKeyLabel.innerText = await availableAPIs.lookupLocale("CRYPTO_PUBKEY_FIELD");
		publicKeySave.innerText = await availableAPIs.lookupLocale("SAVE_BTN");
		privateKeyLabel.innerText = await availableAPIs.lookupLocale("CRYPTO_PRIVKEY_FIELD");
		privateKeySave.innerText = await availableAPIs.lookupLocale("SAVE_BTN");

		let algorithms = [ "RSASSA-PKCS1-v1_5", "RSA-PSS", "RSA-OAEP", "ECDSA", "ECDH", "HMAC", "AES-CBC", "AES-CTR", "AES-GCM", "Ed25519", "X25519" ];
		let hashes = [ "SHA-256", "SHA-384", "SHA-512", "SHA-1" ];
		let namedCurves = [ "P-256", "P-384", "P-521" ];
		let keyUsages = [ "encrypt", "decrypt", "sign", "verify", "deriveKey", "deriveBits", "wrapKey", "unwrapKey" ];
		let exportAs = {
			jwk: "JSON Web Key",
			raw: await availableAPIs.lookupLocale("RAW_HEX_DATA")
		};
		let setKeyUsages = Object.fromEntries(keyUsages.map(a => [a, false]));

		page.appendChild(algorithmLabel);
		page.appendChild(algorithmOption);
		page.appendChild(document.createElement("br"));
		page.appendChild(modLenLabel);
		page.appendChild(modLen);
		page.appendChild(document.createElement("br"));
		page.appendChild(publicExponentLabel);
		page.appendChild(publicExponent);
		page.appendChild(document.createElement("br"));
		page.appendChild(hashLabel);
		page.appendChild(hashOption);
		page.appendChild(document.createElement("br"));
		page.appendChild(namedCurveLabel);
		page.appendChild(namedCurveOption);
		page.appendChild(document.createElement("br"));
		page.appendChild(lengthLabel);
		page.appendChild(lengthInput);
		page.appendChild(document.createElement("br"));
		page.appendChild(exportAsLabel);
		page.appendChild(exportAsOption);
		page.appendChild(document.createElement("br"));
		page.appendChild(keyUsagesLabel);
		page.appendChild(document.createElement("br"));

		for (let algorithm of algorithms) {
			let option = document.createElement("option");
			option.value = algorithm;
			option.innerText = algorithm;
			algorithmOption.appendChild(option);
		}

		for (let hash of hashes) {
			let option = document.createElement("option");
			option.value = hash;
			option.innerText = hash;
			hashOption.appendChild(option);
		}

		for (let curve of namedCurves) {
			let option = document.createElement("option");
			option.value = curve;
			option.innerText = curve;
			namedCurveOption.appendChild(option);
		}

		for (let usage of keyUsages) {
			let inputCheckBox = document.createElement("input");
			let label = document.createElement("label");

			inputCheckBox.type = "checkbox";
			inputCheckBox.id = usage;
			inputCheckBox.onchange = function() {
				setKeyUsages[usage] = inputCheckBox.checked;
			};

			label.innerText = usage;
			label.htmlFor = usage;

			page.appendChild(inputCheckBox);
			page.appendChild(label);
			page.appendChild(document.createElement("br"));
		}

		for (let exportType in exportAs) {
			let option = document.createElement("option");
			option.value = exportType;
			option.innerText = exportAs[exportType];
			exportAsOption.appendChild(option);
		}

		page.appendChild(document.createElement("br"));
		page.appendChild(generateButton);
		page.appendChild(document.createElement("hr"));
		page.appendChild(publicKeyLabel);
		page.appendChild(publicKeySave);
		page.appendChild(document.createElement("br"));
		page.appendChild(publicKeyField);
		page.appendChild(document.createElement("hr"));
		page.appendChild(privateKeyLabel);
		page.appendChild(privateKeySave);
		page.appendChild(document.createElement("br"));
		page.appendChild(privateKeyField);

		backButton.onclick = mainPage;
		async function saveKey(type) {
			let ipcPipe = await availableAPIs.createPipe();
			await availableAPIs.windowVisibility(false);
			await availableAPIs.startTask({ file: (await availableAPIs.getSystemMount()) + "/apps/filePicker.js", argPassed: [ipcPipe, "save"] });
			let result = await availableAPIs.listenToPipe(ipcPipe);
			await availableAPIs.closePipe(ipcPipe);
			await availableAPIs.windowVisibility(true);
			if (result.success) await availableAPIs.fs_write({ path: result.selected, data: type == "private" ? privateKeyField.value : publicKeyField.value });
		}

		publicKeySave.onclick = () => saveKey("public");
		privateKeySave.onclick = () => saveKey("private");

		modLen.type = "number";
		lengthInput.type = "number";

		modLen.value = 2048;
		lengthInput.value = 256;
		publicExponent.value = "010001";

		publicKeyField.readOnly = true;
		privateKeyField.readOnly = true;

		generateButton.addEventListener("click", async function() {
			publicKeyField.value = await availableAPIs.lookupLocale("CRYPTO_KEYGEN_MSG");
			privateKeyField.value = await availableAPIs.lookupLocale("CRYPTO_KEYGEN_MSG");
			let key = await availableAPIs.cspOperation({
				cspProvider: "basic",
				operation: "generateKey",
				cspArgument: {
					algorithm: {
						name: algorithmOption.value,
						modulusLength: parseInt(modLen.value),
						publicExponent: Uint8Array.from(publicExponent.value.match(/.{1,2}/g).map(a => parseInt(a, 16))),
						hash: hashOption.value,
						length: parseInt(lengthInput.value),
						namedCurve: namedCurveOption.value
					},
					extractable: true,
					keyUsages: Object.entries(setKeyUsages).filter(a => a[1]).map(a => a[0])
				}
			});
			let exported = {};
			try {
				exported = {
					privateKey: await availableAPIs.cspOperation({
						cspProvider: "basic",
						operation: "exportKey",
						cspArgument: {
							format: exportAsOption.value,
							key: key.type == "secret" ? key : key.privateKey
						}
					}),
					publicKey: key.type == "secret" ? undefined : await availableAPIs.cspOperation({
						cspProvider: "basic",
						operation: "exportKey",
						cspArgument: {
							format: exportAsOption.value,
							key: key.publicKey
						}
					})
				};
			} catch {}
			if (key.type == "secret") await availableAPIs.cspOperation({
				cspProvider: "basic",
				operation: "unloadKey",
				cspArgument: key
			});
			else {
				await availableAPIs.cspOperation({
					cspProvider: "basic",
					operation: "unloadKey",
					cspArgument: key.privateKey
				});
				await availableAPIs.cspOperation({
					cspProvider: "basic",
					operation: "unloadKey",
					cspArgument: key.publicKey
				});
			}

			if (exportAsOption.value == "jwk") {
				publicKeyField.value = JSON.stringify(exported.publicKey || await availableAPIs.lookupLocale("CRYPTO_KEYGEN_SYMM"));
				privateKeyField.value = JSON.stringify(exported.privateKey || await availableAPIs.lookupLocale("CRYPTO_KEYGEN_EXPFAIL"));
			} else if (exportAsOption.value == "raw") {
				publicKeyField.value = u8aToHex(new Uint8Array(exported.publicKey || new ArrayBuffer(0))) || await availableAPIs.lookupLocale("CRYPTO_KEYGEN_SYMM");
				privateKeyField.value = u8aToHex(new Uint8Array(exported.privateKey || new ArrayBuffer(0))) || await availableAPIs.lookupLocale("CRYPTO_KEYGEN_EXPFAIL");
			}
		});
	}
	async function encryptPage() {
		page.innerText = "";
		pageHeader.innerText = "";
		let backButton = document.createElement("button");
		let pageHeaderText = document.createElement("span");
		pageHeader.appendChild(backButton);
		pageHeader.appendChild(pageHeaderText);
		let plaintextLabel = document.createElement("label");
		let plaintextLoadButton = document.createElement("button");
		let plaintextField = document.createElement("textarea");
		let plaintextFormatLabel = document.createElement("label");
		let plaintextFormatOption = document.createElement("select");
		let keyLabel = document.createElement("label");
		let keyLoadButton = document.createElement("button");
		let keyField = document.createElement("textarea");
		let algorithmLabel = document.createElement("label");
		let algorithmOption = document.createElement("select");
		let hashLabel = document.createElement("label");
		let hashOption = document.createElement("select");
		let namedCurveLabel = document.createElement("label");
		let namedCurveOption = document.createElement("select");
		let lengthLabel = document.createElement("label");
		let lengthInput = document.createElement("input");
		let ivLabel = document.createElement("label");
		let ivInput = document.createElement("input");
		let ivGenerateButton = document.createElement("button");
		let counterLabel = document.createElement("label");
		let counterInput = document.createElement("input");
		let importAsLabel = document.createElement("label");
		let importAsOption = document.createElement("select");
		let encryptButton = document.createElement("button");
		let ciphertextLabel = document.createElement("label");
		let ciphertextField = document.createElement("textarea");
		let ciphertextSaveButton = document.createElement("button");

		let algorithms = [ "RSA-OAEP", "AES-CBC", "AES-CTR", "AES-GCM" ];
		let hashes = [ "SHA-256", "SHA-384", "SHA-512", "SHA-1" ];
		let namedCurves = [ "P-256", "P-384", "P-521" ];
		let importAs = {
			jwk: "JSON Web Key",
			raw: await availableAPIs.lookupLocale("RAW_HEX_DATA")
		};
		let textAs = {
			unicode: "UTF-8",
			raw: await availableAPIs.lookupLocale("RAW_HEX_DATA")
		}

		backButton.innerText = "<-";
		pageHeaderText.innerText = await availableAPIs.lookupLocale("CRYPTO_ENCRYPT");
		plaintextLabel.innerText = await availableAPIs.lookupLocale("CRYPTO_PLAINTEXT_FIELD");
		plaintextLoadButton.innerText = await availableAPIs.lookupLocale("LOAD_BTN");
		plaintextFormatLabel.innerText = await availableAPIs.lookupLocale("CRYPTO_PLAINTEXTAS_FIELD");
		keyLabel.innerText = await availableAPIs.lookupLocale("CRYPTO_KEY_FIELD");
		keyLoadButton.innerText = await availableAPIs.lookupLocale("LOAD_BTN");
		algorithmLabel.innerText = await availableAPIs.lookupLocale("ALGORITHM_FIELD");
		hashLabel.innerText = await availableAPIs.lookupLocale("CRYPTO_HASH_FIELD");
		namedCurveLabel.innerText = await availableAPIs.lookupLocale("CRYPTO_NC_FIELD");
		lengthLabel.innerText = await availableAPIs.lookupLocale("LENGTH_FIELD");
		ivLabel.innerText = await availableAPIs.lookupLocale("CRYPTO_IV_FIELD");
		ivGenerateButton.innerText = await availableAPIs.lookupLocale("REGENERATE");
		counterLabel.innerText = await availableAPIs.lookupLocale("CRYPTO_CTR_FIELD");
		importAsLabel.innerText = await availableAPIs.lookupLocale("IMPORT_AS_FIELD");
		encryptButton.innerText = await availableAPIs.lookupLocale("CRYPTO_ENCRYPT_ACTION");
		ciphertextLabel.innerText = await availableAPIs.lookupLocale("CRYPTO_CIPHERTEXT_FIELD");
		ciphertextSaveButton.innerText = await availableAPIs.lookupLocale("SAVE_BTN");

		page.appendChild(plaintextLabel);
		page.appendChild(plaintextLoadButton);
		page.appendChild(document.createElement("br"));
		page.appendChild(plaintextField);
		page.appendChild(document.createElement("br"));
		page.appendChild(plaintextFormatLabel);
		page.appendChild(plaintextFormatOption);
		page.appendChild(document.createElement("hr"));
		page.appendChild(keyLabel);
		page.appendChild(keyLoadButton);
		page.appendChild(document.createElement("br"));
		page.appendChild(keyField);
		page.appendChild(document.createElement("hr"));
		page.appendChild(algorithmLabel);
		page.appendChild(algorithmOption);
		page.appendChild(document.createElement("br"));
		page.appendChild(hashLabel);
		page.appendChild(hashOption);
		page.appendChild(document.createElement("br"));
		page.appendChild(namedCurveLabel);
		page.appendChild(namedCurveOption);
		page.appendChild(document.createElement("br"));
		page.appendChild(lengthLabel);
		page.appendChild(lengthInput);
		page.appendChild(document.createElement("br"));
		page.appendChild(ivLabel);
		page.appendChild(ivInput);
		page.appendChild(ivGenerateButton);
		page.appendChild(document.createElement("br"));
		page.appendChild(counterLabel);
		page.appendChild(counterInput);
		page.appendChild(document.createElement("br"));
		page.appendChild(importAsLabel);
		page.appendChild(importAsOption);
		page.appendChild(document.createElement("hr"));
		page.appendChild(encryptButton);
		page.appendChild(document.createElement("hr"));
		page.appendChild(ciphertextLabel);
		page.appendChild(ciphertextSaveButton);
		page.appendChild(document.createElement("br"));
		page.appendChild(ciphertextField);

		lengthInput.type = "number";
		lengthInput.value = 256;
		ciphertextField.readOnly = true;

		for (let plaintextFormat in textAs) {
			let option = document.createElement("option");
			option.value = plaintextFormat;
			option.innerText = textAs[plaintextFormat];
			plaintextFormatOption.appendChild(option);
		}

		for (let algorithm of algorithms) {
			let option = document.createElement("option");
			option.value = algorithm;
			option.innerText = algorithm;
			algorithmOption.appendChild(option);
		}

		for (let hash of hashes) {
			let option = document.createElement("option");
			option.value = hash;
			option.innerText = hash;
			hashOption.appendChild(option);
		}

		for (let curve of namedCurves) {
			let option = document.createElement("option");
			option.value = curve;
			option.innerText = curve;
			namedCurveOption.appendChild(option);
		}

		for (let importType in importAs) {
			let option = document.createElement("option");
			option.value = importType;
			option.innerText = importAs[importType];
			importAsOption.appendChild(option);
		}

		backButton.onclick = mainPage;
		plaintextLoadButton.onclick = async function() {
			let ipcPipe = await availableAPIs.createPipe();
			await availableAPIs.windowVisibility(false);
			await availableAPIs.startTask({ file: (await availableAPIs.getSystemMount()) + "/apps/filePicker.js", argPassed: [ipcPipe, "load"] });
			let result = await availableAPIs.listenToPipe(ipcPipe);
			await availableAPIs.closePipe(ipcPipe);
			await availableAPIs.windowVisibility(true);
			if (result.success) plaintextField.value = await availableAPIs.fs_read({ path: result.selected });
		}
		keyLoadButton.onclick = async function() {
			let ipcPipe = await availableAPIs.createPipe();
			await availableAPIs.windowVisibility(false);
			await availableAPIs.startTask({ file: (await availableAPIs.getSystemMount()) + "/apps/filePicker.js", argPassed: [ipcPipe, "load"] });
			let result = await availableAPIs.listenToPipe(ipcPipe);
			await availableAPIs.closePipe(ipcPipe);
			await availableAPIs.windowVisibility(true);
			if (result.success) keyField.value = await availableAPIs.fs_read({ path: result.selected });
		}
		ciphertextSaveButton.onclick = async function() {
			let ipcPipe = await availableAPIs.createPipe();
			await availableAPIs.windowVisibility(false);
			await availableAPIs.startTask({ file: (await availableAPIs.getSystemMount()) + "/apps/filePicker.js", argPassed: [ipcPipe, "save"] });
			let result = await availableAPIs.listenToPipe(ipcPipe);
			await availableAPIs.closePipe(ipcPipe);
			await availableAPIs.windowVisibility(true);
			if (result.success) await availableAPIs.fs_write({ path: result.selected, data: ciphertextField.value });
		}
		ivGenerateButton.onclick = async function() {
			ivInput.value = u8aToHex(await availableAPIs.cspOperation({
				cspProvider: "basic",
				operation: "random",
				cspArgument: new Uint8Array(16)
			}));
		};
		encryptButton.onclick = async function() {
			let keyData, data;
			if (importAsOption.value == "jwk") keyData = JSON.parse(keyField.value);
			if (importAsOption.value == "raw") keyData = hexToU8A(keyField.value);
			if (plaintextFormatOption.value == "raw") data = hexToU8A(plaintextField.value);
			if (plaintextFormatOption.value == "unicode") data = new TextEncoder().encode(plaintextField.value);
			let keyImport = await availableAPIs.cspOperation({
				cspProvider: "basic",
				operation: "importKey",
				cspArgument: {
					format: importAsOption.value,
					keyData: keyData,
					algorithm: {
						name: algorithmOption.value,
						hash: hashOption.value,
						namedCurve: namedCurveOption.value,
						length: parseInt(lengthInput.value)
					},
					extractable: false,
					keyUsages: [ "encrypt" ]
				}
			});
			let ciphertext = await availableAPIs.cspOperation({
				cspProvider: "basic",
				operation: "encrypt",
				cspArgument: {
					algorithm: {
						name: algorithmOption.value,
						iv: hexToU8A(ivInput.value || "00".repeat(16)),
						counter: hexToU8A(counterInput.value || "00".repeat(16)),
						length: parseInt(lengthInput.value)
					},
					key: keyImport,
					data
				}
			});
			ciphertextField.value = u8aToHex(new Uint8Array(ciphertext));
			await availableAPIs.cspOperation({
				cspProvider: "basic",
				operation: "unloadKey",
				cspArgument: {
					key: keyImport
				}
			});
		}
	}
	async function decryptPage() {
		page.innerText = "";
		pageHeader.innerText = "";
		let backButton = document.createElement("button");
		let pageHeaderText = document.createElement("span");
		pageHeader.appendChild(backButton);
		pageHeader.appendChild(pageHeaderText);
		let ciphertextLabel = document.createElement("label");
		let ciphertextLoadButton = document.createElement("button");
		let ciphertextField = document.createElement("textarea");
		let keyLabel = document.createElement("label");
		let keyLoadButton = document.createElement("button");
		let keyField = document.createElement("textarea");
		let algorithmLabel = document.createElement("label");
		let algorithmOption = document.createElement("select");
		let hashLabel = document.createElement("label");
		let hashOption = document.createElement("select");
		let namedCurveLabel = document.createElement("label");
		let namedCurveOption = document.createElement("select");
		let lengthLabel = document.createElement("label");
		let lengthInput = document.createElement("input");
		let ivLabel = document.createElement("label");
		let ivInput = document.createElement("input");
		let counterLabel = document.createElement("label");
		let counterInput = document.createElement("input");
		let importAsLabel = document.createElement("label");
		let importAsOption = document.createElement("select");
		let plaintextFormatLabel = document.createElement("label");
		let plaintextFormatOption = document.createElement("select");
		let decryptButton = document.createElement("button");
		let plaintextLabel = document.createElement("label");
		let plaintextField = document.createElement("textarea");
		let plaintextSaveButton = document.createElement("button");

		let algorithms = [ "RSA-OAEP", "AES-CBC", "AES-CTR", "AES-GCM" ];
		let hashes = [ "SHA-256", "SHA-384", "SHA-512", "SHA-1" ];
		let namedCurves = [ "P-256", "P-384", "P-521" ];
		let importAs = {
			jwk: "JSON Web Key",
			raw: await availableAPIs.lookupLocale("RAW_HEX_DATA")
		};
		let textAs = {
			unicode: "UTF-8",
			raw: await availableAPIs.lookupLocale("RAW_HEX_DATA")
		}

		backButton.innerText = "<-";
		pageHeaderText.innerText = await availableAPIs.lookupLocale("CRYPTO_DECRYPT");
		ciphertextLabel.innerText = await availableAPIs.lookupLocale("CRYPTO_CIPHERTEXT_FIELD");
		ciphertextLoadButton.innerText = await availableAPIs.lookupLocale("LOAD_BTN");
		keyLabel.innerText = await availableAPIs.lookupLocale("CRYPTO_KEY_FIELD");
		keyLoadButton.innerText = await availableAPIs.lookupLocale("LOAD_BTN");
		algorithmLabel.innerText = await availableAPIs.lookupLocale("ALGORITHM_FIELD");
		hashLabel.innerText = await availableAPIs.lookupLocale("CRYPTO_HASH_FIELD");
		namedCurveLabel.innerText = await availableAPIs.lookupLocale("CRYPTO_NC_FIELD");
		lengthLabel.innerText = await availableAPIs.lookupLocale("LENGTH_FIELD");
		ivLabel.innerText = await availableAPIs.lookupLocale("CRYPTO_IV_FIELD");
		counterLabel.innerText = await availableAPIs.lookupLocale("CRYPTO_CTR_FIELD");
		importAsLabel.innerText = await availableAPIs.lookupLocale("IMPORT_AS_FIELD");
		decryptButton.innerText = await availableAPIs.lookupLocale("CRYPTO_DECRYPT_ACTION");
		plaintextFormatLabel.innerText = await availableAPIs.lookupLocale("CRYPTO_PLAINTEXTAS_FIELD");
		plaintextLabel.innerText = await availableAPIs.lookupLocale("CRYPTO_PLAINTEXT_FIELD");
		plaintextSaveButton.innerText = await availableAPIs.lookupLocale("SAVE_BTN");

		page.appendChild(ciphertextLabel);
		page.appendChild(ciphertextLoadButton);
		page.appendChild(document.createElement("br"));
		page.appendChild(ciphertextField);
		page.appendChild(document.createElement("hr"));
		page.appendChild(keyLabel);
		page.appendChild(keyLoadButton);
		page.appendChild(document.createElement("br"));
		page.appendChild(keyField);
		page.appendChild(document.createElement("hr"));
		page.appendChild(algorithmLabel);
		page.appendChild(algorithmOption);
		page.appendChild(document.createElement("br"));
		page.appendChild(hashLabel);
		page.appendChild(hashOption);
		page.appendChild(document.createElement("br"));
		page.appendChild(namedCurveLabel);
		page.appendChild(namedCurveOption);
		page.appendChild(document.createElement("br"));
		page.appendChild(lengthLabel);
		page.appendChild(lengthInput);
		page.appendChild(document.createElement("br"));
		page.appendChild(ivLabel);
		page.appendChild(ivInput);
		page.appendChild(document.createElement("br"));
		page.appendChild(counterLabel);
		page.appendChild(counterInput);
		page.appendChild(document.createElement("br"));
		page.appendChild(importAsLabel);
		page.appendChild(importAsOption);
		page.appendChild(document.createElement("hr"));
		page.appendChild(decryptButton);
		page.appendChild(document.createElement("hr"));
		page.appendChild(plaintextFormatLabel);
		page.appendChild(plaintextFormatOption);
		page.appendChild(document.createElement("br"));
		page.appendChild(plaintextLabel);
		page.appendChild(plaintextSaveButton);
		page.appendChild(document.createElement("br"));
		page.appendChild(plaintextField);

		lengthInput.type = "number";
		lengthInput.value = 256;
		plaintextField.readOnly = true;

		for (let plaintextFormat in textAs) {
			let option = document.createElement("option");
			option.value = plaintextFormat;
			option.innerText = textAs[plaintextFormat];
			plaintextFormatOption.appendChild(option);
		}

		for (let algorithm of algorithms) {
			let option = document.createElement("option");
			option.value = algorithm;
			option.innerText = algorithm;
			algorithmOption.appendChild(option);
		}

		for (let hash of hashes) {
			let option = document.createElement("option");
			option.value = hash;
			option.innerText = hash;
			hashOption.appendChild(option);
		}

		for (let curve of namedCurves) {
			let option = document.createElement("option");
			option.value = curve;
			option.innerText = curve;
			namedCurveOption.appendChild(option);
		}

		for (let importType in importAs) {
			let option = document.createElement("option");
			option.value = importType;
			option.innerText = importAs[importType];
			importAsOption.appendChild(option);
		}

		backButton.onclick = mainPage;
		ciphertextLoadButton.onclick = async function() {
			let ipcPipe = await availableAPIs.createPipe();
			await availableAPIs.windowVisibility(false);
			await availableAPIs.startTask({ file: (await availableAPIs.getSystemMount()) + "/apps/filePicker.js", argPassed: [ipcPipe, "load"] });
			let result = await availableAPIs.listenToPipe(ipcPipe);
			await availableAPIs.closePipe(ipcPipe);
			await availableAPIs.windowVisibility(true);
			if (result.success) ciphertextField.value = await availableAPIs.fs_read({ path: result.selected });
		}
		keyLoadButton.onclick = async function() {
			let ipcPipe = await availableAPIs.createPipe();
			await availableAPIs.windowVisibility(false);
			await availableAPIs.startTask({ file: (await availableAPIs.getSystemMount()) + "/apps/filePicker.js", argPassed: [ipcPipe, "load"] });
			let result = await availableAPIs.listenToPipe(ipcPipe);
			await availableAPIs.closePipe(ipcPipe);
			await availableAPIs.windowVisibility(true);
			if (result.success) keyField.value = await availableAPIs.fs_read({ path: result.selected });
		}
		plaintextSaveButton.onclick = async function() {
			let ipcPipe = await availableAPIs.createPipe();
			await availableAPIs.windowVisibility(false);
			await availableAPIs.startTask({ file: (await availableAPIs.getSystemMount()) + "/apps/filePicker.js", argPassed: [ipcPipe, "save"] });
			let result = await availableAPIs.listenToPipe(ipcPipe);
			await availableAPIs.closePipe(ipcPipe);
			await availableAPIs.windowVisibility(true);
			if (result.success) await availableAPIs.fs_write({ path: result.selected, data: plaintextField.value });
		}
		decryptButton.onclick = async function() {
			let keyData;
			if (importAsOption.value == "jwk") keyData = JSON.parse(keyField.value);
			if (importAsOption.value == "raw") keyData = hexToU8A(keyField.value);
			let keyImport = await availableAPIs.cspOperation({
				cspProvider: "basic",
				operation: "importKey",
				cspArgument: {
					format: importAsOption.value,
					keyData: keyData,
					algorithm: {
						name: algorithmOption.value,
						hash: hashOption.value,
						namedCurve: namedCurveOption.value,
						length: parseInt(lengthInput.value)
					},
					extractable: false,
					keyUsages: [ "decrypt" ]
				}
			});
			let ciphertext = await availableAPIs.cspOperation({
				cspProvider: "basic",
				operation: "decrypt",
				cspArgument: {
					algorithm: {
						name: algorithmOption.value,
						iv: hexToU8A(ivInput.value || "00".repeat(16)),
						counter: hexToU8A(counterInput.value || "00".repeat(16)),
						length: parseInt(lengthInput.value)
					},
					key: keyImport,
					data: hexToU8A(ciphertextField.value)
				}
			});
			if (plaintextFormatOption.value == "raw") plaintextField.value = u8aToHex(new Uint8Array(ciphertext));
			if (plaintextFormatOption.value == "unicode") plaintextField.value = new TextDecoder().decode(ciphertext);
			await availableAPIs.cspOperation({
				cspProvider: "basic",
				operation: "unloadKey",
				cspArgument: {
					key: keyImport
				}
			});
		}
	}
	async function signPage() {
		page.innerText = "";
		pageHeader.innerText = "";
		let backButton = document.createElement("button");
		let pageHeaderText = document.createElement("span");
		pageHeader.appendChild(backButton);
		pageHeader.appendChild(pageHeaderText);
		let plaintextLabel = document.createElement("label");
		let plaintextLoadButton = document.createElement("button");
		let plaintextField = document.createElement("textarea");
		let plaintextFormatLabel = document.createElement("label");
		let plaintextFormatOption = document.createElement("select");
		let keyLabel = document.createElement("label");
		let keyLoadButton = document.createElement("button");
		let keyField = document.createElement("textarea");
		let algorithmLabel = document.createElement("label");
		let algorithmOption = document.createElement("select");
		let hashLabel = document.createElement("label");
		let hashOption = document.createElement("select");
		let namedCurveLabel = document.createElement("label");
		let namedCurveOption = document.createElement("select");
		let lengthLabel = document.createElement("label");
		let lengthInput = document.createElement("input");
		let importAsLabel = document.createElement("label");
		let importAsOption = document.createElement("select");
		let signButton = document.createElement("button");
		let signatureLabel = document.createElement("label");
		let signatureField = document.createElement("textarea");
		let signatureSaveButton = document.createElement("button");

		let algorithms = [ "RSASSA-PKCS1-v1_5", "RSA-PSS", "ECDSA", "HMAC", "Ed25519" ];
		let hashes = [ "SHA-256", "SHA-384", "SHA-512", "SHA-1" ];
		let namedCurves = [ "P-256", "P-384", "P-521" ];
		let importAs = {
			jwk: "JSON Web Key",
			raw: await availableAPIs.lookupLocale("RAW_HEX_DATA")
		};
		let textAs = {
			unicode: "UTF-8",
			raw: await availableAPIs.lookupLocale("RAW_HEX_DATA")
		}

		backButton.innerText = "<-";
		pageHeaderText.innerText = await availableAPIs.lookupLocale("CRYPTO_SIGN");
		plaintextLabel.innerText = await availableAPIs.lookupLocale("CRYPTO_PLAINTEXT_FIELD");
		plaintextLoadButton.innerText = await availableAPIs.lookupLocale("LOAD_BTN");
		plaintextFormatLabel.innerText = await availableAPIs.lookupLocale("CRYPTO_PLAINTEXTAS_FIELD");
		keyLabel.innerText = await availableAPIs.lookupLocale("CRYPTO_KEY_FIELD");
		keyLoadButton.innerText = await availableAPIs.lookupLocale("LOAD_BTN");
		algorithmLabel.innerText = await availableAPIs.lookupLocale("ALGORITHM_FIELD");
		hashLabel.innerText = await availableAPIs.lookupLocale("CRYPTO_HASH_FIELD");
		namedCurveLabel.innerText = await availableAPIs.lookupLocale("CRYPTO_NC_FIELD");
		lengthLabel.innerText = await availableAPIs.lookupLocale("LENGTH_FIELD");
		importAsLabel.innerText = await availableAPIs.lookupLocale("IMPORT_AS_FIELD");
		signButton.innerText = await availableAPIs.lookupLocale("CRYPTO_SIGN_ACTION");
		signatureLabel.innerText = await availableAPIs.lookupLocale("CRYPTO_SIGNATURE_FIELD");
		signatureSaveButton.innerText = await availableAPIs.lookupLocale("SAVE_BTN");

		page.appendChild(plaintextLabel);
		page.appendChild(plaintextLoadButton);
		page.appendChild(document.createElement("br"));
		page.appendChild(plaintextField);
		page.appendChild(document.createElement("br"));
		page.appendChild(plaintextFormatLabel);
		page.appendChild(plaintextFormatOption);
		page.appendChild(document.createElement("hr"));
		page.appendChild(keyLabel);
		page.appendChild(keyLoadButton);
		page.appendChild(document.createElement("br"));
		page.appendChild(keyField);
		page.appendChild(document.createElement("hr"));
		page.appendChild(algorithmLabel);
		page.appendChild(algorithmOption);
		page.appendChild(document.createElement("br"));
		page.appendChild(hashLabel);
		page.appendChild(hashOption);
		page.appendChild(document.createElement("br"));
		page.appendChild(namedCurveLabel);
		page.appendChild(namedCurveOption);
		page.appendChild(document.createElement("br"));
		page.appendChild(lengthLabel);
		page.appendChild(lengthInput);
		page.appendChild(document.createElement("br"));
		page.appendChild(importAsLabel);
		page.appendChild(importAsOption);
		page.appendChild(document.createElement("hr"));
		page.appendChild(signButton);
		page.appendChild(document.createElement("hr"));
		page.appendChild(signatureLabel);
		page.appendChild(signatureSaveButton);
		page.appendChild(document.createElement("br"));
		page.appendChild(signatureField);

		lengthInput.type = "number";
		lengthInput.value = 256;
		signatureField.readOnly = true;

		for (let plaintextFormat in textAs) {
			let option = document.createElement("option");
			option.value = plaintextFormat;
			option.innerText = textAs[plaintextFormat];
			plaintextFormatOption.appendChild(option);
		}

		for (let algorithm of algorithms) {
			let option = document.createElement("option");
			option.value = algorithm;
			option.innerText = algorithm;
			algorithmOption.appendChild(option);
		}

		for (let hash of hashes) {
			let option = document.createElement("option");
			option.value = hash;
			option.innerText = hash;
			hashOption.appendChild(option);
		}

		for (let curve of namedCurves) {
			let option = document.createElement("option");
			option.value = curve;
			option.innerText = curve;
			namedCurveOption.appendChild(option);
		}

		for (let importType in importAs) {
			let option = document.createElement("option");
			option.value = importType;
			option.innerText = importAs[importType];
			importAsOption.appendChild(option);
		}

		backButton.onclick = mainPage;
		plaintextLoadButton.onclick = async function() {
			let ipcPipe = await availableAPIs.createPipe();
			await availableAPIs.windowVisibility(false);
			await availableAPIs.startTask({ file: (await availableAPIs.getSystemMount()) + "/apps/filePicker.js", argPassed: [ipcPipe, "load"] });
			let result = await availableAPIs.listenToPipe(ipcPipe);
			await availableAPIs.closePipe(ipcPipe);
			await availableAPIs.windowVisibility(true);
			if (result.success) plaintextField.value = await availableAPIs.fs_read({ path: result.selected });
		}
		keyLoadButton.onclick = async function() {
			let ipcPipe = await availableAPIs.createPipe();
			await availableAPIs.windowVisibility(false);
			await availableAPIs.startTask({ file: (await availableAPIs.getSystemMount()) + "/apps/filePicker.js", argPassed: [ipcPipe, "load"] });
			let result = await availableAPIs.listenToPipe(ipcPipe);
			await availableAPIs.closePipe(ipcPipe);
			await availableAPIs.windowVisibility(true);
			if (result.success) keyField.value = await availableAPIs.fs_read({ path: result.selected });
		}
		signatureSaveButton.onclick = async function() {
			let ipcPipe = await availableAPIs.createPipe();
			await availableAPIs.windowVisibility(false);
			await availableAPIs.startTask({ file: (await availableAPIs.getSystemMount()) + "/apps/filePicker.js", argPassed: [ipcPipe, "save"] });
			let result = await availableAPIs.listenToPipe(ipcPipe);
			await availableAPIs.closePipe(ipcPipe);
			await availableAPIs.windowVisibility(true);
			if (result.success) await availableAPIs.fs_write({ path: result.selected, data: signatureField.value });
		}
		signButton.onclick = async function() {
			let keyData, data;
			if (importAsOption.value == "jwk") keyData = JSON.parse(keyField.value);
			if (importAsOption.value == "raw") keyData = hexToU8A(keyField.value);
			if (plaintextFormatOption.value == "raw") data = hexToU8A(plaintextField.value);
			if (plaintextFormatOption.value == "unicode") data = new TextEncoder().encode(plaintextField.value);
			let keyImport = await availableAPIs.cspOperation({
				cspProvider: "basic",
				operation: "importKey",
				cspArgument: {
					format: importAsOption.value,
					keyData: keyData,
					algorithm: {
						name: algorithmOption.value,
						hash: hashOption.value,
						namedCurve: namedCurveOption.value,
						length: parseInt(lengthInput.value)
					},
					extractable: false,
					keyUsages: [ "sign" ]
				}
			});
			let signature = await availableAPIs.cspOperation({
				cspProvider: "basic",
				operation: "sign",
				cspArgument: {
					algorithm: {
						name: algorithmOption.value,
						hash: hashOption.value,
						saltLength: parseInt(lengthInput.value)
					},
					key: keyImport,
					data
				}
			});
			signatureField.value = u8aToHex(new Uint8Array(signature));
			await availableAPIs.cspOperation({
				cspProvider: "basic",
				operation: "unloadKey",
				cspArgument: {
					key: keyImport
				}
			});
		}
	}
	async function verifyPage() {
		page.innerText = "";
		pageHeader.innerText = "";
		let backButton = document.createElement("button");
		let pageHeaderText = document.createElement("span");
		pageHeader.appendChild(backButton);
		pageHeader.appendChild(pageHeaderText);
		let plaintextLabel = document.createElement("label");
		let plaintextLoadButton = document.createElement("button");
		let plaintextField = document.createElement("textarea");
		let plaintextFormatLabel = document.createElement("label");
		let plaintextFormatOption = document.createElement("select");
		let signatureLabel = document.createElement("label");
		let signatureField = document.createElement("textarea");
		let signatureLoadButton = document.createElement("button");
		let keyLabel = document.createElement("label");
		let keyLoadButton = document.createElement("button");
		let keyField = document.createElement("textarea");
		let algorithmLabel = document.createElement("label");
		let algorithmOption = document.createElement("select");
		let hashLabel = document.createElement("label");
		let hashOption = document.createElement("select");
		let namedCurveLabel = document.createElement("label");
		let namedCurveOption = document.createElement("select");
		let lengthLabel = document.createElement("label");
		let lengthInput = document.createElement("input");
		let importAsLabel = document.createElement("label");
		let importAsOption = document.createElement("select");
		let verifyButton = document.createElement("button");
		let verifiedCheckbox = document.createElement("input");
		let verifiedLabel = document.createElement("label");

		let algorithms = [ "RSASSA-PKCS1-v1_5", "RSA-PSS", "ECDSA", "HMAC", "Ed25519" ];
		let hashes = [ "SHA-256", "SHA-384", "SHA-512", "SHA-1" ];
		let namedCurves = [ "P-256", "P-384", "P-521" ];
		let importAs = {
			jwk: "JSON Web Key",
			raw: await availableAPIs.lookupLocale("RAW_HEX_DATA")
		};
		let textAs = {
			unicode: "UTF-8",
			raw: await availableAPIs.lookupLocale("RAW_HEX_DATA")
		}

		backButton.innerText = "<-";
		pageHeaderText.innerText = await availableAPIs.lookupLocale("CRYPTO_VERIFY");
		plaintextLabel.innerText = await availableAPIs.lookupLocale("CRYPTO_PLAINTEXT_FIELD");
		plaintextLoadButton.innerText = await availableAPIs.lookupLocale("LOAD_BTN");
		signatureLabel.innerText = await availableAPIs.lookupLocale("CRYPTO_SIGNATURE_FIELD");
		signatureLoadButton.innerText = await availableAPIs.lookupLocale("LOAD_BTN");
		plaintextFormatLabel.innerText = await availableAPIs.lookupLocale("CRYPTO_PLAINTEXTAS_FIELD");
		keyLabel.innerText = await availableAPIs.lookupLocale("CRYPTO_KEY_FIELD");
		keyLoadButton.innerText = await availableAPIs.lookupLocale("LOAD_BTN");
		algorithmLabel.innerText = await availableAPIs.lookupLocale("ALGORITHM_FIELD");
		hashLabel.innerText = await availableAPIs.lookupLocale("CRYPTO_HASH_FIELD");
		namedCurveLabel.innerText = await availableAPIs.lookupLocale("CRYPTO_NC_FIELD");
		lengthLabel.innerText = await availableAPIs.lookupLocale("LENGTH_FIELD");
		importAsLabel.innerText = await availableAPIs.lookupLocale("IMPORT_AS_FIELD");
		verifyButton.innerText = await availableAPIs.lookupLocale("CRYPTO_VERIFY_ACTION");
		verifiedLabel.innerText = await availableAPIs.lookupLocale("CRYPTO_VERIFIED_CHECKBOX");

		page.appendChild(plaintextLabel);
		page.appendChild(plaintextLoadButton);
		page.appendChild(document.createElement("br"));
		page.appendChild(plaintextField);
		page.appendChild(document.createElement("br"));
		page.appendChild(plaintextFormatLabel);
		page.appendChild(plaintextFormatOption);
		page.appendChild(document.createElement("hr"));
		page.appendChild(signatureLabel);
		page.appendChild(signatureLoadButton);
		page.appendChild(document.createElement("br"));
		page.appendChild(signatureField);
		page.appendChild(document.createElement("hr"));
		page.appendChild(keyLabel);
		page.appendChild(keyLoadButton);
		page.appendChild(document.createElement("br"));
		page.appendChild(keyField);
		page.appendChild(document.createElement("hr"));
		page.appendChild(algorithmLabel);
		page.appendChild(algorithmOption);
		page.appendChild(document.createElement("br"));
		page.appendChild(hashLabel);
		page.appendChild(hashOption);
		page.appendChild(document.createElement("br"));
		page.appendChild(namedCurveLabel);
		page.appendChild(namedCurveOption);
		page.appendChild(document.createElement("br"));
		page.appendChild(lengthLabel);
		page.appendChild(lengthInput);
		page.appendChild(document.createElement("br"));
		page.appendChild(importAsLabel);
		page.appendChild(importAsOption);
		page.appendChild(document.createElement("hr"));
		page.appendChild(verifyButton);
		page.appendChild(document.createElement("hr"));
		page.appendChild(verifiedCheckbox);
		page.appendChild(verifiedLabel);

		lengthInput.type = "number";
		verifiedCheckbox.type = "checkbox";
		lengthInput.value = 256;
		verifiedCheckbox.disabled = true;

		for (let plaintextFormat in textAs) {
			let option = document.createElement("option");
			option.value = plaintextFormat;
			option.innerText = textAs[plaintextFormat];
			plaintextFormatOption.appendChild(option);
		}

		for (let algorithm of algorithms) {
			let option = document.createElement("option");
			option.value = algorithm;
			option.innerText = algorithm;
			algorithmOption.appendChild(option);
		}

		for (let hash of hashes) {
			let option = document.createElement("option");
			option.value = hash;
			option.innerText = hash;
			hashOption.appendChild(option);
		}

		for (let curve of namedCurves) {
			let option = document.createElement("option");
			option.value = curve;
			option.innerText = curve;
			namedCurveOption.appendChild(option);
		}

		for (let importType in importAs) {
			let option = document.createElement("option");
			option.value = importType;
			option.innerText = importAs[importType];
			importAsOption.appendChild(option);
		}

		backButton.onclick = mainPage;
		plaintextLoadButton.onclick = async function() {
			let ipcPipe = await availableAPIs.createPipe();
			await availableAPIs.windowVisibility(false);
			await availableAPIs.startTask({ file: (await availableAPIs.getSystemMount()) + "/apps/filePicker.js", argPassed: [ipcPipe, "load"] });
			let result = await availableAPIs.listenToPipe(ipcPipe);
			await availableAPIs.closePipe(ipcPipe);
			await availableAPIs.windowVisibility(true);
			if (result.success) plaintextField.value = await availableAPIs.fs_read({ path: result.selected });
		}
		keyLoadButton.onclick = async function() {
			let ipcPipe = await availableAPIs.createPipe();
			await availableAPIs.windowVisibility(false);
			await availableAPIs.startTask({ file: (await availableAPIs.getSystemMount()) + "/apps/filePicker.js", argPassed: [ipcPipe, "load"] });
			let result = await availableAPIs.listenToPipe(ipcPipe);
			await availableAPIs.closePipe(ipcPipe);
			await availableAPIs.windowVisibility(true);
			if (result.success) keyField.value = await availableAPIs.fs_read({ path: result.selected });
		}
		signatureLoadButton.onclick = async function() {
			let ipcPipe = await availableAPIs.createPipe();
			await availableAPIs.windowVisibility(false);
			await availableAPIs.startTask({ file: (await availableAPIs.getSystemMount()) + "/apps/filePicker.js", argPassed: [ipcPipe, "load"] });
			let result = await availableAPIs.listenToPipe(ipcPipe);
			await availableAPIs.closePipe(ipcPipe);
			await availableAPIs.windowVisibility(true);
			if (result.success) signatureField.value = await availableAPIs.fs_read({ path: result.selected });
		}
		verifyButton.onclick = async function() {
			let keyData, data;
			if (importAsOption.value == "jwk") keyData = JSON.parse(keyField.value);
			if (importAsOption.value == "raw") keyData = hexToU8A(keyField.value);
			if (plaintextFormatOption.value == "raw") data = hexToU8A(plaintextField.value);
			if (plaintextFormatOption.value == "unicode") data = new TextEncoder().encode(plaintextField.value);
			let keyImport = await availableAPIs.cspOperation({
				cspProvider: "basic",
				operation: "importKey",
				cspArgument: {
					format: importAsOption.value,
					keyData: keyData,
					algorithm: {
						name: algorithmOption.value,
						hash: hashOption.value,
						namedCurve: namedCurveOption.value,
						length: parseInt(lengthInput.value)
					},
					extractable: false,
					keyUsages: [ "verify" ]
				}
			});
			let solution = false;
			try {
				solution = await availableAPIs.cspOperation({
					cspProvider: "basic",
					operation: "verify",
					cspArgument: {
						algorithm: {
							name: algorithmOption.value,
							hash: hashOption.value,
							saltLength: parseInt(lengthInput.value)
						},
						key: keyImport,
						signature: hexToU8A(signatureField.value),
						data
					}
				});
			} catch {}
			verifiedCheckbox.checked = solution;
			await availableAPIs.cspOperation({
				cspProvider: "basic",
				operation: "unloadKey",
				cspArgument: {
					key: keyImport
				}
			});
		}
	}
	async function deriveBitsPage() {
		page.innerText = "";
		pageHeader.innerText = "";
		let backButton = document.createElement("button");
		let pageHeaderText = document.createElement("span");
		pageHeader.appendChild(backButton);
		pageHeader.appendChild(pageHeaderText);
		let algorithmLabel = document.createElement("label");
		let algorithmOption = document.createElement("select");
		let publicKeyLabel = document.createElement("label");
		let publicKeyLoadButton = document.createElement("button");
		let publicKeyField = document.createElement("textarea");
		let hashLabel = document.createElement("label");
		let hashOption = document.createElement("select");
		let saltLabel = document.createElement("label");
		let saltGenerateButton = document.createElement("button");
		let saltField = document.createElement("textarea");
		let iterationsLabel = document.createElement("label");
		let iterationsField = document.createElement("input");
		let baseKeyLabel = document.createElement("label");
		let baseKeyLoadButton = document.createElement("button");
		let baseKeyField = document.createElement("textarea");
		let importAsLabel = document.createElement("label");
		let importAsOption = document.createElement("select");
		let namedCurveLabel = document.createElement("label");
		let namedCurveOption = document.createElement("select");
		let lengthLabel = document.createElement("label");
		let lengthField = document.createElement("input");
		let deriveButton = document.createElement("button");
		let derivedBitsLabel = document.createElement("label");
		let derivedBitsSaveButton = document.createElement("button");
		let derivedBitsField = document.createElement("textarea");

		let algorithms = [ "ECDH", "HKDF", "PBKDF2", "X25519" ];
		let hashes = [ "SHA-256", "SHA-384", "SHA-512", "SHA-1" ];
		let namedCurves = [ "P-256", "P-384", "P-521" ];
		let importAs = {
			jwk: "JSON Web Key",
			raw: await availableAPIs.lookupLocale("RAW_HEX_DATA")
		};

		backButton.innerText = "<-";
		pageHeaderText.innerText = await availableAPIs.lookupLocale("CRYPTO_DERIVEBITS");
		algorithmLabel.innerText = await availableAPIs.lookupLocale("ALGORITHM_FIELD");
		publicKeyLabel.innerText = await availableAPIs.lookupLocale("CRYPTO_PUBKEY_FIELD");
		publicKeyLoadButton.innerText = await availableAPIs.lookupLocale("LOAD_BTN");
		hashLabel.innerText = await availableAPIs.lookupLocale("CRYPTO_HASH_FIELD");
		saltLabel.innerText = await availableAPIs.lookupLocale("CRYPTO_SALT_FIELD");
		saltGenerateButton.innerText = await availableAPIs.lookupLocale("REGENERATE");
		iterationsLabel.innerText = await availableAPIs.lookupLocale("CRYPTO_ITERATIONS_FIELD");
		baseKeyLabel.innerText = await availableAPIs.lookupLocale("CRYPTO_BASEKEY_FIELD");
		baseKeyLoadButton.innerText = await availableAPIs.lookupLocale("LOAD_BTN");
		importAsLabel.innerText = await availableAPIs.lookupLocale("IMPORT_AS_FIELD");
		namedCurveLabel.innerText = await availableAPIs.lookupLocale("CRYPTO_NC_FIELD");
		lengthLabel.innerText = await availableAPIs.lookupLocale("LENGTH_FIELD");
		deriveButton.innerText = await availableAPIs.lookupLocale("CRYPTO_DERIVEBITS_ACTION");
		derivedBitsLabel.innerText = await availableAPIs.lookupLocale("CRYPTO_DERIVEOUT_FIELD");
		derivedBitsSaveButton.innerText = await availableAPIs.lookupLocale("SAVE_BTN");

		page.appendChild(algorithmLabel);
		page.appendChild(algorithmOption);
		page.appendChild(document.createElement("br"));
		page.appendChild(publicKeyLabel);
		page.appendChild(publicKeyLoadButton);
		page.appendChild(document.createElement("br"));
		page.appendChild(publicKeyField);
		page.appendChild(document.createElement("br"));
		page.appendChild(hashLabel);
		page.appendChild(hashOption);
		page.appendChild(document.createElement("br"));
		page.appendChild(saltLabel);
		page.appendChild(saltGenerateButton);
		page.appendChild(document.createElement("br"));
		page.appendChild(saltField);
		page.appendChild(document.createElement("br"));
		page.appendChild(iterationsLabel);
		page.appendChild(iterationsField);
		page.appendChild(document.createElement("br"));
		page.appendChild(baseKeyLabel);
		page.appendChild(baseKeyLoadButton);
		page.appendChild(document.createElement("br"));
		page.appendChild(baseKeyField);
		page.appendChild(document.createElement("br"));
		page.appendChild(importAsLabel);
		page.appendChild(importAsOption);
		page.appendChild(document.createElement("br"));
		page.appendChild(namedCurveLabel);
		page.appendChild(namedCurveOption);
		page.appendChild(document.createElement("br"));
		page.appendChild(lengthLabel);
		page.appendChild(lengthField);
		page.appendChild(document.createElement("hr"));
		page.appendChild(deriveButton);
		page.appendChild(document.createElement("hr"));
		page.appendChild(derivedBitsLabel);
		page.appendChild(derivedBitsSaveButton);
		page.appendChild(document.createElement("br"));
		page.appendChild(derivedBitsField);

		iterationsField.type = "number";
		lengthField.type = "number";
		lengthField.value = 256;
		derivedBitsField.readOnly = true;

		for (let algorithm of algorithms) {
			let option = document.createElement("option");
			option.value = algorithm;
			option.innerText = algorithm;
			algorithmOption.appendChild(option);
		}

		for (let hash of hashes) {
			let option = document.createElement("option");
			option.value = hash;
			option.innerText = hash;
			hashOption.appendChild(option);
		}

		for (let curve of namedCurves) {
			let option = document.createElement("option");
			option.value = curve;
			option.innerText = curve;
			namedCurveOption.appendChild(option);
		}

		for (let importType in importAs) {
			let option = document.createElement("option");
			option.value = importType;
			option.innerText = importAs[importType];
			importAsOption.appendChild(option);
		}

		backButton.onclick = mainPage;
		publicKeyLoadButton.onclick = async function() {
			let ipcPipe = await availableAPIs.createPipe();
			await availableAPIs.windowVisibility(false);
			await availableAPIs.startTask({ file: (await availableAPIs.getSystemMount()) + "/apps/filePicker.js", argPassed: [ipcPipe, "load"] });
			let result = await availableAPIs.listenToPipe(ipcPipe);
			await availableAPIs.closePipe(ipcPipe);
			await availableAPIs.windowVisibility(true);
			if (result.success) publicKeyField.value = await availableAPIs.fs_read({ path: result.selected });
		}
		baseKeyLoadButton.onclick = async function() {
			let ipcPipe = await availableAPIs.createPipe();
			await availableAPIs.windowVisibility(false);
			await availableAPIs.startTask({ file: (await availableAPIs.getSystemMount()) + "/apps/filePicker.js", argPassed: [ipcPipe, "load"] });
			let result = await availableAPIs.listenToPipe(ipcPipe);
			await availableAPIs.closePipe(ipcPipe);
			await availableAPIs.windowVisibility(true);
			if (result.success) baseKeyField.value = await availableAPIs.fs_read({ path: result.selected });
		}
		saltGenerateButton.onclick = async function() {
			saltField.value = u8aToHex(await availableAPIs.cspOperation({
				cspProvider: "basic",
				operation: "random",
				cspArgument: new Uint8Array(32)
			}));
		}
		derivedBitsSaveButton.onclick = async function() {
			let ipcPipe = await availableAPIs.createPipe();
			await availableAPIs.windowVisibility(false);
			await availableAPIs.startTask({ file: (await availableAPIs.getSystemMount()) + "/apps/filePicker.js", argPassed: [ipcPipe, "save"] });
			let result = await availableAPIs.listenToPipe(ipcPipe);
			await availableAPIs.closePipe(ipcPipe);
			await availableAPIs.windowVisibility(true);
			if (result.success) await availableAPIs.fs_write({ path: result.selected, data: derivedBitsField.value });
		}
		deriveButton.onclick = async function() {
			let baseKeyData, publicKeyData;
			if (importAsOption.value == "jwk") {
				baseKeyData = JSON.parse(baseKeyField.value);
				publicKeyData = JSON.parse(publicKeyField.value || "00");
			}
			if (importAsOption.value == "raw") {
				baseKeyData = hexToU8A(baseKeyField.value);
				publicKeyData = hexToU8A(publicKeyField.value || "00");
			}
			let baseKeyImport = await availableAPIs.cspOperation({
				cspProvider: "basic",
				operation: "importKey",
				cspArgument: {
					format: importAsOption.value,
					keyData: baseKeyData,
					algorithm: {
						name: algorithmOption.value,
						hash: hashOption.value,
						namedCurve: namedCurveOption.value,
						length: parseInt(lengthField.value)
					},
					extractable: false,
					keyUsages: [ "deriveBits" ]
				}
			});
			let publicKeyImport = await availableAPIs.cspOperation({
				cspProvider: "basic",
				operation: "importKey",
				cspArgument: {
					format: importAsOption.value,
					keyData: publicKeyData,
					algorithm: {
						name: algorithmOption.value,
						hash: hashOption.value,
						namedCurve: namedCurveOption.value,
						length: parseInt(lengthField.value)
					},
					extractable: false,
					keyUsages: [ "deriveBits" ]
				}
			});
			derivedBitsField.value = u8aToHex(new Uint8Array(await availableAPIs.cspOperation({
				cspProvider: "basic",
				operation: "deriveBits",
				cspArgument: {
					algorithm: {
						name: algorithmOption.value,
						public: publicKeyImport,
						hash: hashOption.value,
						salt: hexToU8A(saltField.value),
						info: new Uint8Array(),
						iterations: parseInt(iterationsField.value),
					},
					baseKey: baseKeyImport,
					length: parseInt(lengthField.value)
				}
			})));
			await availableAPIs.cspOperation({
				cspProvider: "basic",
				operation: "unloadKey",
				cspArgument: {
					key: baseKeyImport
				}
			});
			await availableAPIs.cspOperation({
				cspProvider: "basic",
				operation: "unloadKey",
				cspArgument: {
					key: publicKeyImport
				}
			});
		}
	}
})();
addEventListener("signal", async function(e) {
	if (e.detail == 15) await window.availableAPIs.terminate();
}); null;