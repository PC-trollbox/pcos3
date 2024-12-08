// =====BEGIN MANIFEST=====
// signer: automaticSigner
// allow: FS_READ, FS_LIST_PARTITIONS, IPC_SEND_PIPE, IPC_LISTEN_PIPE, GET_LOCALE, GET_THEME, FS_BYPASS_PERMISSIONS, SYSTEM_SHUTDOWN, GET_USER_INFO, LOGOUT, GET_SCREEN_INFO, GRAB_ATTENTION, CSP_OPERATIONS, LULL_SYSTEM
// =====END MANIFEST=====
let ipcChannel;
let shouldShutdown = false;
let visibilityState = true;
let encryptionKey;
let hexToU8A = (hex) => Uint8Array.from(hex.match(/.{1,2}/g).map(a => parseInt(a, 16)));
let u8aToHex = (u8a) => Array.from(u8a).map(a => a.toString(16).padStart(2, "0")).join("");
(async function() {
	// @pcos-app-mode isolatable
	let privateData = { ...(await availableAPIs.getPrivateData()) };
	if (typeof privateData === "string") {
		encryptionKey = privateData;
		ipcChannel = exec_args[0];
	}
	if (typeof privateData === "object" && Object.keys(privateData).length > 0) {
		encryptionKey = privateData.encryptionKey;
		ipcChannel = privateData.ipcChannel;
	}
	if (!encryptionKey) return availableAPIs.terminate();
	if (!ipcChannel) return availableAPIs.terminate();
	await visibility(false);
	await window.availableAPIs.windowTitleSet(await window.availableAPIs.lookupLocale("START_MENU"));
	document.body.style.fontFamily = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
	if (await availableAPIs.isDarkThemed()) document.body.style.color = "white";
	let privileges = await availableAPIs.getPrivileges();
	let checklist = [ "FS_READ", "FS_LIST_PARTITIONS", "IPC_SEND_PIPE", "IPC_LISTEN_PIPE", "CSP_OPERATIONS" ];
	if (!checklist.every(p => privileges.includes(p))) return availableAPIs.terminate();
	try {
		let encryptionKey2 = await availableAPIs.cspOperation({
			cspProvider: "basic",
			operation: "importKey",
			cspArgument: {
				format: "raw",
				keyData: hexToU8A(encryptionKey),
				algorithm: {
					name: "AES-GCM",
					length: 256
				},
				extractable: false,
				keyUsages: ["encrypt", "decrypt"]
			}
		});
		encryptionKey = encryptionKey2;
	} catch {
		return availableAPIs.terminate();
	}
	await sendOverPipe({ success: true });    
	document.body.innerText = "";
	let logoutButton = document.createElement("button");
	logoutButton.innerText = (await availableAPIs.lookupLocale("LOG_OUT_BUTTON")).replace("%s", await availableAPIs.getUser());
	document.body.appendChild(logoutButton);
	logoutButton.onclick = async function() {
		shouldShutdown = true;
		await visibility(false);
		await availableAPIs.logOut(await availableAPIs.getUser());
	}
	let lockButton = document.createElement("button");
	lockButton.innerText = await availableAPIs.lookupLocale("LOCK_BUTTON");
	document.body.appendChild(lockButton);
	lockButton.onclick = async function() {
		await visibility(false);
		await availableAPIs.lock();
	}
	if (privileges.includes("SYSTEM_SHUTDOWN")) {
		let shutoff = document.createElement("button");
		shutoff.innerText = await availableAPIs.lookupLocale("TURN_OFF_BUTTON");
		document.body.appendChild(shutoff);
		shutoff.onclick = async function() {
			shouldShutdown = true;
			await visibility(false);
			await availableAPIs.shutdown({ isReboot: false });
		}
		let reboot = document.createElement("button");
		reboot.innerText = await availableAPIs.lookupLocale("RESTART_BUTTON");
		document.body.appendChild(reboot);
		reboot.onclick = async function() {
			shouldShutdown = true;
			await visibility(false);
			await availableAPIs.shutdown({ isReboot: true });
		}
	}
	if (privileges.includes("LULL_SYSTEM")) {
		let lull = document.createElement("button");
		lull.innerText = await availableAPIs.lookupLocale("LULL_SYSTEM");
		document.body.appendChild(lull);
		lull.onclick = async function() {
			await visibility(false);
			await availableAPIs.lull();
		}
	}
	try {
		let enumeration = await availableAPIs.fs_ls({ path: (await availableAPIs.getSystemMount()) + "/apps/links" });
		for (let app of enumeration) {
			let appLink = await availableAPIs.fs_read({ path: (await availableAPIs.getSystemMount()) + "/apps/links/" + app });
			appLink = JSON.parse(appLink);
			if (appLink.disabled) continue;
			let appBtn = document.createElement("button");
			appBtn.innerText = (appLink.localeReferenceName ? await availableAPIs.lookupLocale(appLink.localeReferenceName) : null) || (appLink.localeDatabaseName ? (appLink.localeDatabaseName[navigator.language.slice(0, 2).toLowerCase()] || appLink.localeDatabaseName[await availableAPIs.osLocale()]) : null) || appLink.name;
			appBtn.title = await availableAPIs.lookupLocale("PROVISIONED_PREFERENCE");
			appBtn.onclick = async function() {
				await visibility(false);
				await sendOverPipe({ run: appLink });
			}
			document.body.appendChild(appBtn);
		}
	} catch (e) {
		console.error("Failed to enumerate system app links", e);
	}
	try {
		let enumeration = await availableAPIs.fs_ls({ path: (await availableAPIs.getUserInfo({ desiredUser: await availableAPIs.getUser() })).homeDirectory + "/.applinks" });
		for (let app of enumeration) {
			let appLink = await availableAPIs.fs_read({ path: (await availableAPIs.getUserInfo({ desiredUser: await availableAPIs.getUser() })).homeDirectory + "/.applinks/" + app });
			appLink = JSON.parse(appLink);
			if (appLink.disabled) continue;
			let appBtn = document.createElement("button");
			appBtn.innerText = (appLink.localeReferenceName ? await availableAPIs.lookupLocale(appLink.localeReferenceName) : null) || (appLink.localeDatabaseName ? (appLink.localeDatabaseName[navigator.language.slice(0, 2).toLowerCase()] || appLink.localeDatabaseName[await availableAPIs.osLocale()]) : null) || appLink.name;
			appBtn.onclick = async function() {
				await visibility(false);
				await sendOverPipe({ run: appLink });
			}
			document.body.appendChild(appBtn);
		}
	} catch (e) {
		console.error("Failed to enumerate user app links", e);
	}

	onresize = shapeshift;

	while (true) {
		let listen = await availableAPIs.listenToPipe(ipcChannel);
		try {
			listen = await availableAPIs.cspOperation({
				cspProvider: "basic",
				operation: "decrypt",
				cspArgument: {
					algorithm: {
						name: "AES-GCM",
						iv: hexToU8A(listen.slice(0, 32))
					},
					key: encryptionKey,
					data: hexToU8A(listen.slice(32))
				}
			});
			listen = JSON.parse(new TextDecoder().decode(listen));
		} catch {
			continue;
		}
		if (listen.open) {
			await visibility();
			shapeshift();
		}
	}
})();

async function visibility(wantedState) {
	if (!wantedState) wantedState = !visibilityState;
	if (wantedState == visibilityState) return;
	await availableAPIs.windowVisibility(wantedState);
	visibilityState = wantedState;
}

async function shapeshift() {
	let screenInfo = await availableAPIs.getScreenInfo();
	let winSize = await availableAPIs.windowSize();
	await availableAPIs.windowRelocate([ screenInfo.height - (winSize.height / 2) - 35 - 8, winSize.width / 2 + 8 ]);
}

async function sendOverPipe(data) {
	let iv = await availableAPIs.cspOperation({
		cspProvider: "basic",
		operation: "random",
		cspArgument: new Uint8Array(16)
	});
	let encrypted = await availableAPIs.cspOperation({
		cspProvider: "basic",
		operation: "encrypt",
		cspArgument: {
			algorithm: {
				name: "AES-GCM",
				iv: iv
			},
			key: encryptionKey,
			data: new TextEncoder().encode(JSON.stringify(data))
		}
	});
	await availableAPIs.sendToPipe({ pipe: ipcChannel, data: u8aToHex(iv) + u8aToHex(new Uint8Array(encrypted)) });
}

addEventListener("signal", async function(e) {
	if (e.detail == 15) {
		await visibility(false);
		await sendOverPipe({ dying: true });
		await availableAPIs.cspOperation({
			cspProvider: "basic",
			operation: "unloadKey",
			cspArgument: encryptionKey
		});
		await availableAPIs.terminate();
	}
}); null;