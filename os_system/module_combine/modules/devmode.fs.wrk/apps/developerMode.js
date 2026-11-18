// =====BEGIN MANIFEST=====
// allow: ELEVATE_PRIVILEGES, MANAGE_TOKENS, GET_LOCALE, IPC_CREATE_PIPE, START_TASK, FS_LIST_PARTITIONS, IPC_LISTEN_PIPE, FS_WRITE, FS_BYPASS_PERMISSIONS, FS_CHANGE_PERMISSION, CSP_OPERATIONS, FS_READ, RESOLVE_NAME, CONNFUL_CONNECT, CONNFUL_IDENTITY_GET, CONNFUL_DISCONNECT
// allow: IPC_SEND_PIPE, GET_THEME, GET_USER_INFO
// signer: automaticSigner
// =====END MANIFEST=====
let hexToU8A = (hex) => Uint8Array.from(hex.match(/.{1,2}/g).map(a => parseInt(a, 16)));
let u8aToHex = (u8a) => Array.from(u8a).map(a => a.toString(16).padStart(2, "0")).join("");
(async function() {
	// @pcos-app-mode isolatable
	await availableAPIs.windowTitleSet("Developer Mode");
	let privileges = await availableAPIs.getPrivileges();
	let checklist = [ "MANAGE_TOKENS", "GET_LOCALE", "IPC_CREATE_PIPE", "START_TASK", "FS_LIST_PARTITIONS", "IPC_LISTEN_PIPE", "FS_WRITE", "FS_CHANGE_PERMISSION", "CSP_OPERATIONS", "FS_READ", "RESOLVE_NAME", "IPC_SEND_PIPE", "GET_THEME", "GET_USER_INFO" ];
	document.body.style.fontFamily = "'Courier New', Courier, monospace";
	document.body.style.background = "black";
	document.body.style.color = "white";
	if (!checklist.every(p => privileges.includes(p))) {
		document.body.innerText = "error: insufficient privileges; requesting escalation";
		let currentToken = await availableAPIs.getProcessToken();
		let newToken = await availableAPIs.consentGetToken({
			intent: "Fully use the features of Developer Mode",
			name: "Developer Mode",
			desiredUser: await availableAPIs.getUser()
		});
		if (!newToken) return;
		await availableAPIs.setProcessToken(newToken);
		await availableAPIs.revokeToken(currentToken);
		privileges = await availableAPIs.getPrivileges();
		if (!checklist.every(p => privileges.includes(p))) return;
	}
	await availableAPIs.windowTitleSet(await availableAPIs.lookupLocale("DEVMODE_TITLE"));
	let months = [ "(01) Jan", "(02) Feb", "(03) Mar", "(04) Apr", "(05) May", "(06) Jun", "(07) Jul", "(08) Aug", "(09) Sep", "(10) Oct", "(11) Nov", "(12) Dec" ];
	let correctTime = _ => _.split(":").map(a => a.padStart(2, "0")).join(":");
	let correctDate = _ => _.split("-").map((a, i) => a.padStart(i ? 2 : 4, "0")).join("-");
	let dateFromInputs = (year, month, day, time) => new Date(correctDate(year + "-" + (+month + 1) + "-" + day) + "T" + correctTime(time) + "Z");
	let styling = document.createElement("style");
	styling.innerText = `input, textarea, button { background: #2a2a2a; color: white; font-family: 'Courier New', Courier, monospace; }
button { background: #404040; }
input:disabled, textarea:disabled, button:disabled { opacity: 0.5; }`;
	document.head.appendChild(styling);
	document.body.innerText = "";
	let pageHeader = document.createElement("b");
	let dividePageHeader = document.createElement("hr");
	let page = document.createElement("div");
	document.body.appendChild(pageHeader);
	document.body.appendChild(dividePageHeader);
	document.body.appendChild(page);
	async function mainPage() {
		pageHeader.innerText = await availableAPIs.lookupLocale("DEVMODE_TITLE");
		page.innerText = "";
		let keyInfoGen = document.createElement("button");
		let trustKey = document.createElement("button");
		let trustApp = document.createElement("button");
		let editKeyInfo = document.createElement("button");
		let getServerKey = document.createElement("button");
		
		keyInfoGen.innerText = await availableAPIs.lookupLocale("KEYINFO_GENERATOR");
		trustKey.innerText = await availableAPIs.lookupLocale("KEY_TRUST_GENERATOR");
		trustApp.innerText = await availableAPIs.lookupLocale("APP_TRUST_GENERATOR");
		editKeyInfo.innerText = await availableAPIs.lookupLocale("KEYINFO_EDITOR");
		getServerKey.innerText = await availableAPIs.lookupLocale("SERVER_KEY_VIEWER");

		keyInfoGen.onclick = keyInfoGenPage;
		trustKey.onclick = trustKeyPage;
		trustApp.onclick = trustAppPage;
		editKeyInfo.onclick = editKeyInfoPage;
		getServerKey.onclick = getServerKeyPage;
		
		page.appendChild(keyInfoGen);
		page.appendChild(trustKey);
		page.appendChild(trustApp);
		page.appendChild(editKeyInfo);
		page.appendChild(getServerKey);
	}

	mainPage();

	async function keyInfoGenPage() {
		page.innerText = "";
		pageHeader.innerText = "";
		let backButton = document.createElement("button");
		let pageHeaderText = document.createElement("span");
		pageHeader.appendChild(backButton);
		pageHeader.appendChild(pageHeaderText);
		let fnLabel = document.createElement("label");
		let fnInput = document.createElement("input");
		let neverExpireLabel = document.createElement("label");
		let neverExpireInput = document.createElement("input");
		let sinceLabel = document.createElement("label");
		let sinceInputDay = document.createElement("input");
		let sinceInputMonth = document.createElement("select");
		let sinceInputYear = document.createElement("input");
		let sinceInputTime = document.createElement("input");
		let sinceReset = document.createElement("button");
		let untilLabel = document.createElement("label");
		let untilInputDay = document.createElement("input");
		let untilInputMonth = document.createElement("select");
		let untilInputYear = document.createElement("input");
		let untilInputTime = document.createElement("input");
		let untilPlus90d = document.createElement("button");
		let keyUsagesLabel = document.createElement("label");
		let protectsConnfulDetail = document.createElement("details");
		let protectsConnfulSummary = document.createElement("summary");
		let protectsConnfulNotice = document.createElement("label");
		let protectsServersLabel = document.createElement("label");
		let protectsServersField = document.createElement("input");
		let protectsClientsLabel = document.createElement("label");
		let protectsClientsField = document.createElement("input");
		let generateButton = document.createElement("button");
		let publicKeyLabel = document.createElement("label");
		let publicKeySave = document.createElement("button");
		let publicKeyField = document.createElement("textarea");
		let privateKeyLabel = document.createElement("label");
		let privateKeySave = document.createElement("button");
		let privateKeyField = document.createElement("textarea");
		
		backButton.innerText = "<-";
		pageHeaderText.innerText = await availableAPIs.lookupLocale("KEYINFO_GENERATOR");
		fnLabel.innerText = await availableAPIs.lookupLocale("FRIENDLY_NAME_FIELD");
		neverExpireLabel.innerText = await availableAPIs.lookupLocale("NEVER_EXPIRES_BOX");
		sinceLabel.innerText = await availableAPIs.lookupLocale("SINCE_KEYINFO_FIELD");
		sinceReset.innerText = await availableAPIs.lookupLocale("REGENERATE");
		untilLabel.innerText = await availableAPIs.lookupLocale("UNTIL_KEYINFO_FIELD");
		untilPlus90d.innerText = "+90";
		keyUsagesLabel.innerText = await availableAPIs.lookupLocale("CRYPTO_KEYUSE_FIELD");
		protectsConnfulSummary.innerText = await availableAPIs.lookupLocale("CONNFUL_USAGES_BLOCK");
		protectsConnfulNotice.innerText = await availableAPIs.lookupLocale("CONNFUL_USAGES_HINT");
		protectsServersLabel.innerText = "connfulSecureServer: ";
		protectsClientsLabel.innerText = "connfulSecureClient: ";
		generateButton.innerText = await availableAPIs.lookupLocale("CRYPTO_KEYGEN_ACTION");
		publicKeyLabel.innerText = "keyInfo: ";
		publicKeySave.innerText = await availableAPIs.lookupLocale("SAVE_BTN");
		privateKeyLabel.innerText = await availableAPIs.lookupLocale("CRYPTO_PRIVKEY_FIELD");
		privateKeySave.innerText = await availableAPIs.lookupLocale("SAVE_BTN");

		sinceInputDay.type = sinceInputYear.type = untilInputDay.type = untilInputYear.type = "number";
		neverExpireLabel.htmlFor = neverExpireInput.id = "neverExpires";
		sinceInputTime.type = untilInputTime.type = "time";
		sinceInputTime.step = untilInputTime.step = "1";
		neverExpireInput.type = "checkbox";

		for (let monthID in months) {
			let monthInput = document.createElement("option");
			let monthInput2 = document.createElement("option");
			monthInput.value = monthInput2.value = monthID;
			monthInput.innerText = monthInput2.innerText = months[monthID];
			sinceInputMonth.appendChild(monthInput);
			untilInputMonth.appendChild(monthInput2);
		}

		neverExpireInput.onchange = function() {
			sinceInputDay.disabled = sinceInputMonth.disabled = sinceInputYear.disabled = sinceInputTime.disabled = sinceReset.disabled =
				untilInputDay.disabled = untilInputMonth.disabled = untilInputYear.disabled = untilInputTime.disabled = untilPlus90d.disabled =
				neverExpireInput.checked;
		};

		untilPlus90d.onclick = function() {
			let myDate = dateFromInputs(sinceInputYear.value, sinceInputMonth.value, sinceInputDay.value, sinceInputTime.value);
			myDate.setTime(myDate.getTime() + 90 * 86400000);
			untilInputDay.value = myDate.getUTCDate();
			untilInputMonth.value = myDate.getUTCMonth();
			untilInputYear.value = myDate.getUTCFullYear();
			untilInputTime.value = correctTime(myDate.getUTCHours() + ":" + myDate.getUTCMinutes() + ":" + myDate.getUTCSeconds());
		};

		sinceReset.onclick = function() {
			let myDate = new Date();
			sinceInputDay.value = myDate.getUTCDate();
			sinceInputMonth.value = myDate.getUTCMonth();
			sinceInputYear.value = myDate.getUTCFullYear();
			sinceInputTime.value = correctTime(myDate.getUTCHours() + ":" + myDate.getUTCMinutes() + ":" + myDate.getUTCSeconds());
			untilPlus90d.click();
		};
		sinceReset.click();

		let keyUsages = [ "keyTrust", "appTrust", "moduleTrust" ];
		let setKeyUsages = Object.fromEntries(keyUsages.map(a => [a, false]));

		page.appendChild(fnLabel);
		page.appendChild(fnInput);
		page.appendChild(document.createElement("hr"));
		page.appendChild(neverExpireInput);
		page.appendChild(neverExpireLabel);
		page.appendChild(document.createElement("br"));
		page.appendChild(sinceLabel);
		page.appendChild(sinceInputDay);
		page.appendChild(sinceInputMonth);
		page.appendChild(sinceInputYear);
		page.appendChild(sinceInputTime);
		page.appendChild(sinceReset);
		page.appendChild(document.createElement("br"));
		page.appendChild(untilLabel);
		page.appendChild(untilInputDay);
		page.appendChild(untilInputMonth);
		page.appendChild(untilInputYear);
		page.appendChild(untilInputTime);
		page.appendChild(untilPlus90d);
		page.appendChild(document.createElement("hr"));
		page.appendChild(keyUsagesLabel);
		page.appendChild(document.createElement("br"));

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

		protectsConnfulDetail.appendChild(protectsConnfulSummary);
		protectsConnfulDetail.appendChild(protectsConnfulNotice);
		protectsConnfulDetail.appendChild(document.createElement("br"));
		protectsConnfulDetail.appendChild(protectsServersLabel);
		protectsConnfulDetail.appendChild(protectsServersField);
		protectsConnfulDetail.appendChild(document.createElement("br"));
		protectsConnfulDetail.appendChild(protectsClientsLabel);
		protectsConnfulDetail.appendChild(protectsClientsField);
		page.appendChild(protectsConnfulDetail);
		page.appendChild(document.createElement("hr"));
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
			if (result.success) {
				await availableAPIs.fs_write({ path: result.selected, data: type == "private" ? privateKeyField.value : publicKeyField.value });
				if (type == "private") await availableAPIs.fs_chmod({ path: result.selected, newPermissions: "" });
			}
		}

		publicKeySave.onclick = () => saveKey("public");
		privateKeySave.onclick = () => saveKey("private");

		publicKeyField.readOnly = true;
		privateKeyField.readOnly = true;

		generateButton.addEventListener("click", async function() {
			publicKeyField.value = await availableAPIs.lookupLocale("CRYPTO_KEYGEN_MSG");
			privateKeyField.value = await availableAPIs.lookupLocale("CRYPTO_KEYGEN_MSG");
			let mySinceDate = dateFromInputs(sinceInputYear.value, sinceInputMonth.value, sinceInputDay.value, sinceInputTime.value);
			let myUntilDate = dateFromInputs(untilInputYear.value, untilInputMonth.value, untilInputDay.value, untilInputTime.value);
			let key = await availableAPIs.cspOperation({
				cspProvider: "basic",
				operation: "generateKey",
				cspArgument: { algorithm: "Ed25519", extractable: true, keyUsages: [ "sign", "verify" ] }
			});
			let exported = {
				privateKey: await availableAPIs.cspOperation({
					cspProvider: "basic",
					operation: "exportKey",
					cspArgument: { format: "jwk", key: key.privateKey }
				}),
				publicKey: {
					keyInfo: {
						key: await availableAPIs.cspOperation({
							cspProvider: "basic",
							operation: "exportKey",
							cspArgument: { format: "jwk", key: key.publicKey }
						}),
						usages: [
							...Object.entries(setKeyUsages).filter(a => a[1]).map(a => a[0]),
							...(protectsServersField.value ? protectsServersField.value.split(" ").map(a => "connfulSecureServer:" + a) : []),
							...(protectsClientsField.value ? protectsClientsField.value.split(" ").map(a => "connfulSecureClient:" + a) : [])
						],
						dates: neverExpireInput.checked ? undefined : {
							since: mySinceDate.getTime(),
							until: myUntilDate.getTime(),
						},
						friendlyName: fnInput.value.trim() || undefined
					}
				}
			};
			await availableAPIs.cspOperation({ cspProvider: "basic", operation: "unloadKey", cspArgument: key.privateKey });
			await availableAPIs.cspOperation({ cspProvider: "basic", operation: "unloadKey", cspArgument: key.publicKey });
			
			publicKeyField.value = JSON.stringify(exported.publicKey || await availableAPIs.lookupLocale("CRYPTO_KEYGEN_EXPFAIL"));
			privateKeyField.value = JSON.stringify(exported.privateKey || await availableAPIs.lookupLocale("CRYPTO_KEYGEN_EXPFAIL"));
		});
	}

	async function trustKeyPage() {
		page.innerText = "";
		pageHeader.innerText = "";
		let backButton = document.createElement("button");
		let pageHeaderText = document.createElement("span");
		pageHeader.appendChild(backButton);
		pageHeader.appendChild(pageHeaderText);
		let subjectLabel = document.createElement("label");
		let subjectLoadButton = document.createElement("button");
		let subjectField = document.createElement("textarea");
		let rootIssuerField = document.createElement("input");
		let rootIssuerLabel = document.createElement("label");
		let issuerNameLabel = document.createElement("label");
		let issuerNameField = document.createElement("input");
		let issuerLabel = document.createElement("label");
		let issuerLoadButton = document.createElement("button");
		let issuerField = document.createElement("textarea");
		let trustButton = document.createElement("button");
		let signedLabel = document.createElement("label");
		let signedField = document.createElement("textarea");
		let signedSaveButton = document.createElement("button");

		backButton.innerText = "<-";
		pageHeaderText.innerText = await availableAPIs.lookupLocale("KEY_TRUST_GENERATOR");
		subjectLabel.innerText = await availableAPIs.lookupLocale("SUBJECT_KEY_FIELD");
		subjectLoadButton.innerText = await availableAPIs.lookupLocale("LOAD_BTN");
		rootIssuerLabel.innerText = await availableAPIs.lookupLocale("ROOT_ISSUER_BOX");
		issuerNameLabel.innerText = await availableAPIs.lookupLocale("ISSUER_KEYID_FIELD");
		issuerLabel.innerText = await availableAPIs.lookupLocale("ISSUER_PRIVATE_FIELD");
		issuerLoadButton.innerText = await availableAPIs.lookupLocale("LOAD_BTN");
		trustButton.innerText = await availableAPIs.lookupLocale("GENERATE_TRUST");
		signedLabel.innerText = await availableAPIs.lookupLocale("SUBJECT_KEY_FIELD");
		signedSaveButton.innerText = await availableAPIs.lookupLocale("SAVE_BTN");

		page.appendChild(subjectLabel);
		page.appendChild(subjectLoadButton);
		page.appendChild(document.createElement("br"));
		page.appendChild(subjectField);
		page.appendChild(document.createElement("hr"));
		page.appendChild(rootIssuerField);
		page.appendChild(rootIssuerLabel);
		page.appendChild(document.createElement("br"));
		page.appendChild(issuerNameLabel);
		page.appendChild(issuerNameField);
		page.appendChild(document.createElement("br"));
		page.appendChild(issuerLabel);
		page.appendChild(issuerLoadButton);
		page.appendChild(document.createElement("br"));
		page.appendChild(issuerField);
		page.appendChild(document.createElement("hr"));
		page.appendChild(trustButton);
		page.appendChild(document.createElement("hr"));
		page.appendChild(signedLabel);
		page.appendChild(signedSaveButton);
		page.appendChild(document.createElement("br"));
		page.appendChild(signedField);

		rootIssuerField.id = "rootIssuer";
		rootIssuerLabel.htmlFor = "rootIssuer";
		rootIssuerField.type = "checkbox";
		signedField.readOnly = true;

		backButton.onclick = mainPage;
		rootIssuerField.onchange = async function() {
			issuerNameField.disabled = rootIssuerField.checked;
			issuerNameField.value = rootIssuerField.checked ? (await availableAPIs.lookupLocale("ROOT_KEY_CELL")) : "";
			issuerField.value = !rootIssuerField.checked ? "" : JSON.stringify(JSON.parse(await availableAPIs.fs_read({ path: (await availableAPIs.getSystemMount()) + "/etc/security/ksk" })).privateKey);
			issuerField.disabled = rootIssuerField.checked;
			issuerLoadButton.disabled = rootIssuerField.checked;
			issuerField.hidden = rootIssuerField.checked;
		}

		subjectLoadButton.onclick = async function() {
			let ipcPipe = await availableAPIs.createPipe();
			await availableAPIs.windowVisibility(false);
			await availableAPIs.startTask({ file: (await availableAPIs.getSystemMount()) + "/apps/filePicker.js", argPassed: [ipcPipe, "load"] });
			let result = await availableAPIs.listenToPipe(ipcPipe);
			await availableAPIs.closePipe(ipcPipe);
			await availableAPIs.windowVisibility(true);
			if (result.success) subjectField.value = await availableAPIs.fs_read({ path: result.selected });
		}
		issuerLoadButton.onclick = async function() {
			let ipcPipe = await availableAPIs.createPipe();
			await availableAPIs.windowVisibility(false);
			await availableAPIs.startTask({ file: (await availableAPIs.getSystemMount()) + "/apps/filePicker.js", argPassed: [ipcPipe, "load"] });
			let result = await availableAPIs.listenToPipe(ipcPipe);
			await availableAPIs.closePipe(ipcPipe);
			await availableAPIs.windowVisibility(true);
			if (result.success) issuerField.value = await availableAPIs.fs_read({ path: result.selected });
		}
		signedSaveButton.onclick = async function() {
			let ipcPipe = await availableAPIs.createPipe();
			await availableAPIs.windowVisibility(false);
			await availableAPIs.startTask({ file: (await availableAPIs.getSystemMount()) + "/apps/filePicker.js", argPassed: [ipcPipe, "save"] });
			let result = await availableAPIs.listenToPipe(ipcPipe);
			await availableAPIs.closePipe(ipcPipe);
			await availableAPIs.windowVisibility(true);
			if (result.success) await availableAPIs.fs_write({ path: result.selected, data: signedField.value });
		}

		trustButton.onclick = async function() {
			let subjectKey = JSON.parse(subjectField.value);
			subjectKey.keyInfo.signedBy = rootIssuerField.checked ? undefined : issuerNameField.value;
			let keyImport = await availableAPIs.cspOperation({
				cspProvider: "basic",
				operation: "importKey",
				cspArgument: { format: "jwk", keyData: JSON.parse(issuerField.value), algorithm: "Ed25519", extractable: false, keyUsages: [ "sign" ] }
			});

			let signature = await availableAPIs.cspOperation({
				cspProvider: "basic",
				operation: "sign",
				cspArgument: {
					algorithm: "Ed25519",
					key: keyImport,
					data: new TextEncoder().encode(JSON.stringify(subjectKey.keyInfo))
				}
			});
			subjectKey.signature = u8aToHex(new Uint8Array(signature));
			await availableAPIs.cspOperation({ cspProvider: "basic", operation: "unloadKey", cspArgument: { key: keyImport } });
			signedField.value = JSON.stringify(subjectKey);
		}
	}

	async function trustAppPage() {
		page.innerText = "";
		pageHeader.innerText = "";
		let backButton = document.createElement("button");
		let pageHeaderText = document.createElement("span");
		pageHeader.appendChild(backButton);
		pageHeader.appendChild(pageHeaderText);
		let programLabel = document.createElement("label");
		let programLoadButton = document.createElement("button");
		let programField = document.createElement("textarea");
		let authorityNameLabel = document.createElement("label");
		let authorityNameField = document.createElement("input");
		let authorityLabel = document.createElement("label");
		let authorityLoadButton = document.createElement("button");
		let authorityField = document.createElement("textarea");
		let embedAuthorityCheck = document.createElement("input");
		let embedAuthorityLabel = document.createElement("label");
		let embedAuthorityButton = document.createElement("button");
		let embedAuthorityField = document.createElement("textarea");
		let trustButton = document.createElement("button");
		let signedLabel = document.createElement("label");
		let signedField = document.createElement("textarea");
		let signedSaveButton = document.createElement("button");

		backButton.innerText = "<-";
		pageHeaderText.innerText = await availableAPIs.lookupLocale("APP_TRUST_GENERATOR");
		programLabel.innerText = await availableAPIs.lookupLocale("ENTIRE_PROGRAM_FIELD");
		programLoadButton.innerText = await availableAPIs.lookupLocale("LOAD_BTN");
		authorityNameLabel.innerText = await availableAPIs.lookupLocale("ISSUER_KEYID_FIELD");
		embedAuthorityLabel.innerText = await availableAPIs.lookupLocale("EMBED_AUTHORITY_BOX");
		embedAuthorityButton.innerText = await availableAPIs.lookupLocale("LOAD_BTN");
		authorityLabel.innerText = await availableAPIs.lookupLocale("ISSUER_PRIVATE_FIELD");
		authorityLoadButton.innerText = await availableAPIs.lookupLocale("LOAD_BTN");
		trustButton.innerText = await availableAPIs.lookupLocale("GENERATE_TRUST");
		signedLabel.innerText = await availableAPIs.lookupLocale("ENTIRE_PROGRAM_FIELD");
		signedSaveButton.innerText = await availableAPIs.lookupLocale("SAVE_BTN");

		embedAuthorityCheck.type = "checkbox";
		embedAuthorityCheck.id = "embedAuthority";
		embedAuthorityLabel.htmlFor = "embedAuthority";

		page.appendChild(programLabel);
		page.appendChild(programLoadButton);
		page.appendChild(document.createElement("br"));
		page.appendChild(programField);
		page.appendChild(document.createElement("hr"));
		page.appendChild(authorityNameLabel);
		page.appendChild(authorityNameField);
		page.appendChild(document.createElement("br"));
		page.appendChild(authorityLabel);
		page.appendChild(authorityLoadButton);
		page.appendChild(document.createElement("br"));
		page.appendChild(authorityField);
		page.appendChild(document.createElement("br"));
		page.appendChild(embedAuthorityCheck);
		page.appendChild(embedAuthorityLabel);
		page.appendChild(embedAuthorityButton);
		page.appendChild(document.createElement("br"));
		page.appendChild(embedAuthorityField);
		page.appendChild(document.createElement("hr"));
		page.appendChild(trustButton);
		page.appendChild(document.createElement("hr"));
		page.appendChild(signedLabel);
		page.appendChild(signedSaveButton);
		page.appendChild(document.createElement("br"));
		page.appendChild(signedField);
		
		embedAuthorityButton.hidden = true;
		embedAuthorityField.hidden = true;
		embedAuthorityCheck.onchange = function() {
			embedAuthorityButton.hidden = !embedAuthorityCheck.checked;
			embedAuthorityField.hidden = !embedAuthorityCheck.checked;
		}
		signedField.readOnly = true;

		backButton.onclick = mainPage;

		programLoadButton.onclick = async function() {
			let ipcPipe = await availableAPIs.createPipe();
			await availableAPIs.windowVisibility(false);
			await availableAPIs.startTask({ file: (await availableAPIs.getSystemMount()) + "/apps/filePicker.js", argPassed: [ipcPipe, "load"] });
			let result = await availableAPIs.listenToPipe(ipcPipe);
			await availableAPIs.closePipe(ipcPipe);
			await availableAPIs.windowVisibility(true);
			if (result.success) programField.value = await availableAPIs.fs_read({ path: result.selected });
		}
		authorityLoadButton.onclick = async function() {
			let ipcPipe = await availableAPIs.createPipe();
			await availableAPIs.windowVisibility(false);
			await availableAPIs.startTask({ file: (await availableAPIs.getSystemMount()) + "/apps/filePicker.js", argPassed: [ipcPipe, "load"] });
			let result = await availableAPIs.listenToPipe(ipcPipe);
			await availableAPIs.closePipe(ipcPipe);
			await availableAPIs.windowVisibility(true);
			if (result.success) authorityField.value = await availableAPIs.fs_read({ path: result.selected });
		}
		embedAuthorityButton.onclick = async function() {
			let ipcPipe = await availableAPIs.createPipe();
			await availableAPIs.windowVisibility(false);
			await availableAPIs.startTask({ file: (await availableAPIs.getSystemMount()) + "/apps/filePicker.js", argPassed: [ipcPipe, "load"] });
			let result = await availableAPIs.listenToPipe(ipcPipe);
			await availableAPIs.closePipe(ipcPipe);
			await availableAPIs.windowVisibility(true);
			if (result.success) embedAuthorityField.value = await availableAPIs.fs_read({ path: result.selected });
		}
		signedSaveButton.onclick = async function() {
			let ipcPipe = await availableAPIs.createPipe();
			await availableAPIs.windowVisibility(false);
			await availableAPIs.startTask({ file: (await availableAPIs.getSystemMount()) + "/apps/filePicker.js", argPassed: [ipcPipe, "save"] });
			let result = await availableAPIs.listenToPipe(ipcPipe);
			await availableAPIs.closePipe(ipcPipe);
			await availableAPIs.windowVisibility(true);
			if (result.success) {
				await availableAPIs.fs_write({ path: result.selected, data: signedField.value });
				await availableAPIs.fs_chmod({ path: result.selected, newPermissions: "rx" });
			}
		}

		trustButton.onclick = async function() {
			let programCode = programField.value;
			let manifestStats = [];
			if (!programCode.startsWith("// =====BEGIN MANIFEST=====\n"))
				programCode = "// =====BEGIN MANIFEST=====\n// =====END MANIFEST=====\n" + programCode;
			
			let parsingLines = programCode.split("\n");
			let parsingBoundStart = parsingLines.indexOf("// =====BEGIN MANIFEST=====");
			let parsingBoundEnd = parsingLines.indexOf("// =====END MANIFEST=====");
			let upToParse = parsingLines.slice(parsingBoundStart + 1, parsingBoundEnd);
			for (let line of upToParse) {
				let lineType = line.split(": ")[0].replace("// ", "");
				let lineData = line.replace("// " + lineType + ": ", "");
				let dataParts = lineData.split(", ");
				for (let data of dataParts) {
					if (lineType == "signature" || lineType == "signer") parsingLines.splice(parsingLines.indexOf(line), 1);
					manifestStats.push({ lineType, data });
				}
			}
			if (embedAuthorityCheck.checked) parsingLines.splice(parsingBoundStart + 1, 0, "// asck: " + JSON.stringify(JSON.parse(embedAuthorityField.value)));
			parsingLines.splice(parsingBoundStart + 1, 0, "// signer: " + authorityNameField.value);
			programCode = parsingLines.join("\n");
			let keyImport = await availableAPIs.cspOperation({
				cspProvider: "basic",
				operation: "importKey",
				cspArgument: { format: "jwk", keyData: JSON.parse(authorityField.value), algorithm: "Ed25519", extractable: false, keyUsages: [ "sign" ] }
			});

			let signature = await availableAPIs.cspOperation({
				cspProvider: "basic",
				operation: "sign",
				cspArgument: { algorithm: "Ed25519", key: keyImport, data: new TextEncoder().encode(programCode) }
			});

			parsingLines.splice(parsingBoundStart + 1, 0, "// signature: " + u8aToHex(new Uint8Array(signature)));
			programCode = parsingLines.join("\n");

			signedField.value = programCode;
			await availableAPIs.cspOperation({ cspProvider: "basic", operation: "unloadKey", cspArgument: { key: keyImport } });
		}
	}

	async function editKeyInfoPage() {
		page.innerText = "";
		pageHeader.innerText = "";
		let backButton = document.createElement("button");
		let pageHeaderText = document.createElement("span");
		pageHeader.appendChild(backButton);
		pageHeader.appendChild(pageHeaderText);

		let oldKeyLabel = document.createElement("label");
		let oldLoadButton = document.createElement("button");
		let oldUseButton = document.createElement("button");
		let oldKeyField = document.createElement("textarea");
		let editWarn = document.createElement("span");
		let fnLabel = document.createElement("label");
		let fnInput = document.createElement("input");
		let neverExpireLabel = document.createElement("label");
		let neverExpireInput = document.createElement("input");
		let sinceLabel = document.createElement("label");
		let sinceInputDay = document.createElement("input");
		let sinceInputMonth = document.createElement("select");
		let sinceInputYear = document.createElement("input");
		let sinceInputTime = document.createElement("input");
		let sinceReset = document.createElement("button");
		let untilLabel = document.createElement("label");
		let untilInputDay = document.createElement("input");
		let untilInputMonth = document.createElement("select");
		let untilInputYear = document.createElement("input");
		let untilInputTime = document.createElement("input");
		let untilPlus90d = document.createElement("button");
		let keyUsagesLabel = document.createElement("label");
		let protectsConnfulDetail = document.createElement("details");
		let protectsConnfulSummary = document.createElement("summary");
		let protectsConnfulNotice = document.createElement("label");
		let protectsServersLabel = document.createElement("label");
		let protectsServersField = document.createElement("input");
		let protectsClientsLabel = document.createElement("label");
		let protectsClientsField = document.createElement("input");
		let editButton = document.createElement("button");
		let newKeyLabel = document.createElement("label");
		let newKeySave = document.createElement("button");
		let newKeyField = document.createElement("textarea");
		
		backButton.innerText = "<-";
		pageHeaderText.innerText = await availableAPIs.lookupLocale("KEYINFO_EDITOR");
		oldKeyLabel.innerText = "keyInfo: ";
		oldLoadButton.innerText = await availableAPIs.lookupLocale("LOAD_BTN");
		oldUseButton.innerText = await availableAPIs.lookupLocale("APPLY_BASE_BTN");
		editWarn.innerText = await availableAPIs.lookupLocale("KEYINFO_EDITOR_WARNING");
		fnLabel.innerText = await availableAPIs.lookupLocale("FRIENDLY_NAME_FIELD");
		neverExpireLabel.innerText = await availableAPIs.lookupLocale("NEVER_EXPIRES_BOX");
		sinceLabel.innerText = await availableAPIs.lookupLocale("SINCE_KEYINFO_FIELD");
		sinceReset.innerText = await availableAPIs.lookupLocale("REGENERATE");
		untilLabel.innerText = await availableAPIs.lookupLocale("UNTIL_KEYINFO_FIELD");
		untilPlus90d.innerText = "+90";
		keyUsagesLabel.innerText = await availableAPIs.lookupLocale("CRYPTO_KEYUSE_FIELD");
		protectsConnfulSummary.innerText = await availableAPIs.lookupLocale("CONNFUL_USAGES_BLOCK");
		protectsConnfulNotice.innerText = await availableAPIs.lookupLocale("CONNFUL_USAGES_HINT");
		protectsServersLabel.innerText = "connfulSecureServer: ";
		protectsClientsLabel.innerText = "connfulSecureClient: ";
		editButton.innerText = await availableAPIs.lookupLocale("APPLY_CHANGES");
		newKeyLabel.innerText = "keyInfo: ";
		newKeySave.innerText = await availableAPIs.lookupLocale("SAVE_BTN");

		sinceInputDay.type = sinceInputYear.type = untilInputDay.type = untilInputYear.type = "number";
		neverExpireLabel.htmlFor = neverExpireInput.id = "neverExpires";
		sinceInputTime.type = untilInputTime.type = "time";
		sinceInputTime.step = untilInputTime.step = "1";
		neverExpireInput.type = "checkbox";

		for (let monthID in months) {
			let monthInput = document.createElement("option");
			let monthInput2 = document.createElement("option");
			monthInput.value = monthInput2.value = monthID;
			monthInput.innerText = monthInput2.innerText = months[monthID];
			sinceInputMonth.appendChild(monthInput);
			untilInputMonth.appendChild(monthInput2);
		}

		neverExpireInput.onchange = function() {
			sinceInputDay.disabled = sinceInputMonth.disabled = sinceInputYear.disabled = sinceInputTime.disabled = sinceReset.disabled =
				untilInputDay.disabled = untilInputMonth.disabled = untilInputYear.disabled = untilInputTime.disabled = untilPlus90d.disabled =
				neverExpireInput.checked;
		};

		untilPlus90d.onclick = function() {
			let myDate = dateFromInputs(sinceInputYear.value, sinceInputMonth.value, sinceInputDay.value, sinceInputTime.value);
			myDate.setTime(myDate.getTime() + 90 * 86400000);
			untilInputDay.value = myDate.getUTCDate();
			untilInputMonth.value = myDate.getUTCMonth();
			untilInputYear.value = myDate.getUTCFullYear();
			untilInputTime.value = correctTime(myDate.getUTCHours() + ":" + myDate.getUTCMinutes() + ":" + myDate.getUTCSeconds());
		};

		sinceReset.onclick = function() {
			let myDate = new Date();
			sinceInputDay.value = myDate.getUTCDate();
			sinceInputMonth.value = myDate.getUTCMonth();
			sinceInputYear.value = myDate.getUTCFullYear();
			sinceInputTime.value = correctTime(myDate.getUTCHours() + ":" + myDate.getUTCMinutes() + ":" + myDate.getUTCSeconds());
			untilPlus90d.click();
		};
		sinceReset.click();
		let oldKey = { usages: [] };

		let keyUsages = [ "keyTrust", "appTrust", "moduleTrust" ];
		let setKeyUsages = Object.fromEntries(keyUsages.map(a => [a, false]));
		let keyUsageInputs = {};

		page.appendChild(oldKeyLabel);
		page.appendChild(oldLoadButton);
		page.appendChild(oldUseButton);
		page.appendChild(document.createElement("br"));
		page.appendChild(oldKeyField);
		page.appendChild(document.createElement("br"));
		page.appendChild(editWarn);
		page.appendChild(document.createElement("hr"));
		page.appendChild(fnLabel);
		page.appendChild(fnInput);
		page.appendChild(document.createElement("hr"));
		page.appendChild(neverExpireInput);
		page.appendChild(neverExpireLabel);
		page.appendChild(document.createElement("br"));
		page.appendChild(sinceLabel);
		page.appendChild(sinceInputDay);
		page.appendChild(sinceInputMonth);
		page.appendChild(sinceInputYear);
		page.appendChild(sinceInputTime);
		page.appendChild(sinceReset);
		page.appendChild(document.createElement("br"));
		page.appendChild(untilLabel);
		page.appendChild(untilInputDay);
		page.appendChild(untilInputMonth);
		page.appendChild(untilInputYear);
		page.appendChild(untilInputTime);
		page.appendChild(untilPlus90d);
		page.appendChild(document.createElement("hr"));
		page.appendChild(keyUsagesLabel);
		page.appendChild(document.createElement("br"));

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

			keyUsageInputs[usage] = inputCheckBox;
			page.appendChild(inputCheckBox);
			page.appendChild(label);
			page.appendChild(document.createElement("br"));
		}

		protectsConnfulDetail.appendChild(protectsConnfulSummary);
		protectsConnfulDetail.appendChild(protectsConnfulNotice);
		protectsConnfulDetail.appendChild(document.createElement("br"));
		protectsConnfulDetail.appendChild(protectsServersLabel);
		protectsConnfulDetail.appendChild(protectsServersField);
		protectsConnfulDetail.appendChild(document.createElement("br"));
		protectsConnfulDetail.appendChild(protectsClientsLabel);
		protectsConnfulDetail.appendChild(protectsClientsField);
		page.appendChild(protectsConnfulDetail);
		page.appendChild(document.createElement("hr"));
		page.appendChild(editButton);
		page.appendChild(document.createElement("hr"));
		page.appendChild(newKeyLabel);
		page.appendChild(newKeySave);
		page.appendChild(document.createElement("br"));
		page.appendChild(newKeyField);

		backButton.onclick = mainPage;
		
		oldLoadButton.onclick = async function() {
			let ipcPipe = await availableAPIs.createPipe();
			await availableAPIs.windowVisibility(false);
			await availableAPIs.startTask({ file: (await availableAPIs.getSystemMount()) + "/apps/filePicker.js", argPassed: [ipcPipe, "load"] });
			let result = await availableAPIs.listenToPipe(ipcPipe);
			await availableAPIs.closePipe(ipcPipe);
			await availableAPIs.windowVisibility(true);
			if (result.success) oldKeyField.value = await availableAPIs.fs_read({ path: result.selected });
		}

		oldUseButton.onclick = async function() {
			let key = JSON.parse(oldKeyField.value);
			fnInput.value = (key.keyInfo.friendlyNameDB || {})[await availableAPIs.lookupLocale("OS_LOCALE")] || key.keyInfo.friendlyName || "";
			sinceInputDay.disabled = sinceInputMonth.disabled = sinceInputYear.disabled = sinceInputTime.disabled = sinceReset.disabled =
				untilInputDay.disabled = untilInputMonth.disabled = untilInputYear.disabled = untilInputTime.disabled = untilPlus90d.disabled =
				neverExpireInput.checked = !key.keyInfo.dates;
			if (key.keyInfo.dates) {
				let sinceDate = new Date(key.keyInfo.dates.since);
				sinceInputDay.value = sinceDate.getUTCDate();
				sinceInputMonth.value = sinceDate.getUTCMonth();
				sinceInputYear.value = sinceDate.getUTCFullYear();
				sinceInputTime.value = correctTime(sinceDate.getUTCHours() + ":" + sinceDate.getUTCMinutes() + ":" + sinceDate.getUTCSeconds());
				let untilDate = new Date(key.keyInfo.dates.until);
				untilInputDay.value = untilDate.getUTCDate();
				untilInputMonth.value = untilDate.getUTCMonth();
				untilInputYear.value = untilDate.getUTCFullYear();
				untilInputTime.value = correctTime(untilDate.getUTCHours() + ":" + untilDate.getUTCMinutes() + ":" + untilDate.getUTCSeconds());
			}

			keyUsages.map(a => keyUsageInputs[a].checked = key.keyInfo.usages.includes(a));
			keyUsages.map(a => setKeyUsages[a] = key.keyInfo.usages.includes(a));
			protectsClientsField.value = key.keyInfo.usages.filter(a => a.startsWith("connfulSecureClient:")).map(a => a.slice(20)).join(" ");
			protectsServersField.value = key.keyInfo.usages.filter(a => a.startsWith("connfulSecureServer:")).map(a => a.slice(20)).join(" ");

			oldKey = key;
		}

		newKeySave.onclick = async function saveKey() {
			let ipcPipe = await availableAPIs.createPipe();
			await availableAPIs.windowVisibility(false);
			await availableAPIs.startTask({ file: (await availableAPIs.getSystemMount()) + "/apps/filePicker.js", argPassed: [ipcPipe, "save"] });
			let result = await availableAPIs.listenToPipe(ipcPipe);
			await availableAPIs.closePipe(ipcPipe);
			await availableAPIs.windowVisibility(true);
			if (result.success) await availableAPIs.fs_write({ path: result.selected, data: newKeyField.value });
		}

		editButton.addEventListener("click", async function() {
			oldKey.keyInfo.dates = {
				since: dateFromInputs(sinceInputYear.value, sinceInputMonth.value, sinceInputDay.value, sinceInputTime.value).getTime(),
				until: dateFromInputs(untilInputYear.value, untilInputMonth.value, untilInputDay.value, untilInputTime.value).getTime()
			};
			if (neverExpireInput.checked) delete oldKey.keyInfo.dates;
			delete oldKey.keyInfo.friendlyNameDB;
			delete oldKey.signature;
			oldKey.keyInfo.friendlyName = fnInput.value.trim();
			oldKey.keyInfo.usages = [
				...Object.entries(setKeyUsages).filter(a => a[1]).map(a => a[0]),
				...(protectsServersField.value ? protectsServersField.value.split(" ").map(a => "connfulSecureServer:" + a) : []),
				...(protectsClientsField.value ? protectsClientsField.value.split(" ").map(a => "connfulSecureClient:" + a) : [])
			];

			newKeyField.value = JSON.stringify(oldKey);
		});
	}

	async function getServerKeyPage() {
		page.innerText = "";
		pageHeader.innerText = "";
		let backButton = document.createElement("button");
		let pageHeaderText = document.createElement("span");
		pageHeader.appendChild(backButton);
		pageHeader.appendChild(pageHeaderText);
		let serverLabel = document.createElement("label");
		let serverInput = document.createElement("input");
		let gateLabel = document.createElement("label");
		let gateInput = document.createElement("input");
		let getButton = document.createElement("button");
		let publicKeyLabel = document.createElement("label");
		let publicKeySave = document.createElement("button");
		let publicKeyField = document.createElement("textarea");
		
		backButton.innerText = "<-";
		pageHeaderText.innerText = await availableAPIs.lookupLocale("SERVER_KEY_VIEWER");
		serverLabel.innerText = await availableAPIs.lookupLocale("MULTI_ADDRESS_FIELD");
		gateLabel.innerText = await availableAPIs.lookupLocale("CONNFUL_GATE_FIELD");
		getButton.innerText = await availableAPIs.lookupLocale("SERVKEY_VIEW_BTN");
		publicKeyLabel.innerText = "keyInfo: ";
		publicKeySave.innerText = await availableAPIs.lookupLocale("SAVE_BTN");

		page.appendChild(serverLabel);
		page.appendChild(serverInput);
		page.appendChild(document.createElement("br"));
		page.appendChild(gateLabel);
		page.appendChild(gateInput);
		page.appendChild(document.createElement("hr"));
		page.appendChild(getButton);
		page.appendChild(document.createElement("hr"));
		page.appendChild(publicKeyLabel);
		page.appendChild(publicKeySave);
		page.appendChild(document.createElement("br"));
		page.appendChild(publicKeyField);
		
		backButton.onclick = mainPage;
		publicKeyField.readOnly = true;
		publicKeySave.onclick = async function() {
			let ipcPipe = await availableAPIs.createPipe();
			await availableAPIs.windowVisibility(false);
			await availableAPIs.startTask({ file: (await availableAPIs.getSystemMount()) + "/apps/filePicker.js", argPassed: [ipcPipe, "save"] });
			let result = await availableAPIs.listenToPipe(ipcPipe);
			await availableAPIs.closePipe(ipcPipe);
			await availableAPIs.windowVisibility(true);
			if (result.success) await availableAPIs.fs_write({ path: result.selected, data: publicKeyField.value });
		}

		getButton.addEventListener("click", async function() {
			publicKeyField.value = await availableAPIs.lookupLocale("PLEASE_WAIT");
			try {
				let address = serverInput.value;
				if (address.includes(":")) address = IPv6Decompressor(address).replaceAll(":", "");
				else address = await availableAPIs.resolve(address);
				if (!address) throw new Error("");
				let connection = await availableAPIs.connfulConnect({
					gate: gateInput.value,
					address,
					doNotVerifyServer: true
				});
				await availableAPIs.connfulConnectionSettled(connection);
				publicKeyField.value = JSON.stringify(await availableAPIs.connfulIdentityGet(connection));
				await availableAPIs.connfulConnectionSettled(connection);
				try {
					await availableAPIs.connfulDisconnect(connection);
				} catch {}
			} catch (e) {
				publicKeyField.value = await availableAPIs.lookupLocale("CRYPTO_KEYGEN_EXPFAIL") + "\n\n" + e.name + ": " + e.message + "\n" + e.stack;
			}
		});
	}
})();
function IPv6Decompressor(ip) {
	let array = ip.split(":");
	array = array.slice(0, 8);
	let foundTwoOrMoreZeroes = array.indexOf("");
	while (array.length != 8 && foundTwoOrMoreZeroes !== null) array.splice(foundTwoOrMoreZeroes, 0, "0000");
	array = array.map(a => parseInt(a || "0", 16).toString(16).padStart(4, "0"));
	return array.join(":");
}
addEventListener("signal", async function(e) {
	if (e.detail == 15) await window.availableAPIs.terminate();
}); null;
