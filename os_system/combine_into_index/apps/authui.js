// =====BEGIN MANIFEST=====
// signer: automaticSigner
// allow: IPC_SEND_PIPE, GET_LOCALE, GET_THEME, ELEVATE_PRIVILEGES, CSP_OPERATIONS
// =====END MANIFEST=====

let ipc;
(async function() {
	// @pcos-app-mode isolatable
	exec_args = await availableAPIs.getPrivateData() || [];
	if (!(exec_args instanceof Array)) return availableAPIs.terminate();
	ipc = exec_args[0];
	if (!ipc) return availableAPIs.terminate();
	let user = exec_args[1];
	await availableAPIs.windowTitleSet(await availableAPIs.lookupLocale("LOG_IN_INVITATION"));
	let checklist = [ "IPC_SEND_PIPE", "GET_LOCALE", "GET_THEME", "ELEVATE_PRIVILEGES", "CSP_OPERATIONS" ];
	let privileges = await availableAPIs.getPrivileges();
	if (!checklist.every(p => privileges.includes(p))) {
		if (privileges.includes("IPC_SEND_PIPE")) await availableAPIs.sendToPipe({ pipe: ipc, data: { success: false, cancelled: false } });
		return availableAPIs.terminate();
	}
	document.body.style.fontFamily = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
	if (await availableAPIs.isDarkThemed()) document.body.style.color = "white";
	let describe = document.createElement("b");
	let form = document.createElement("form");
	let input = document.createElement("input");
	let submit = document.createElement("button");
	document.body.appendChild(describe);
	document.body.appendChild(document.createElement("br"));
	document.body.appendChild(form);
	form.appendChild(input);
	form.appendChild(submit);
	submit.innerText = await availableAPIs.lookupLocale("ENTER_BUTTON");
	describe.innerText = await availableAPIs.lookupLocale("USERNAME_PROMPT");
	input.placeholder = await availableAPIs.lookupLocale("USERNAME");
	async function userSubmit(e) {
		e.stopImmediatePropagation();
		e.preventDefault();
		e.stopPropagation();
		let userLogonSession;
		let userLogonID;
		let desired_username = input.value;
		try {
			userLogonID = await availableAPIs.automatedLogonCreate({ desiredUser: desired_username });
			userLogonSession = await availableAPIs.automatedLogonGet(userLogonID);
		} catch {
			describe.innerText = await availableAPIs.lookupLocale("AUTH_FAILED") + " " + await availableAPIs.lookupLocale("USERNAME_PROMPT");
			input.placeholder = await availableAPIs.lookupLocale("USERNAME");
			input.type = "text";
			input.disabled = !!user;
			submit.disabled = false;
			input.value = user || "";
			submit.addEventListener("click", userSubmit);
			return;
		}
		async function updateProgress() {
			submit.removeEventListener("click", userSubmit);
			input.value = "";
			submit.innerText = await availableAPIs.lookupLocale("ENTER_BUTTON");
			if (userLogonSession.success != "intermediate") await availableAPIs.automatedLogonDelete(userLogonID);
			if (userLogonSession.success == true) {
				await availableAPIs.sendToPipe({ pipe: ipc, data: userLogonSession });
				await availableAPIs.terminate();
			}
			if (userLogonSession.success == false) {
				describe.innerText = await availableAPIs.lookupLocale("AUTH_FAILED") + " " + await availableAPIs.lookupLocale("USERNAME_PROMPT");
				input.placeholder = await availableAPIs.lookupLocale("USERNAME");
				input.type = "text";
				input.disabled = !!user;
				submit.disabled = false;
				input.value = user || "";
				submit.addEventListener("click", userSubmit);
				return;
			}
			describe.innerText = "[" + desired_username + "] " + userLogonSession.message;
			input.placeholder = await availableAPIs.lookupLocale("RESPONSE_PLACEHOLDER");
			input.type = userLogonSession.type == "password" ? "password" : "text";
			input.disabled = !userLogonSession.wantsUserInput;
			submit.disabled = !userLogonSession.wantsUserInput;
			if (userLogonSession.type == "zkpp_password") input.type = "password";
			if (userLogonSession.type == "promise") {
				try {
					input.disabled = true;
					submit.disabled = true;
					await availableAPIs.automatedLogonInput({ session: userLogonID });
					userLogonSession = await availableAPIs.automatedLogonGet(userLogonID);
				} catch {}
				return await updateProgress();
			}
			if (userLogonSession.type == "informative") {
				input.disabled = true;
				submit.disabled = false;
				submit.innerText = "OK";
				input.placeholder = "--->";
			}
			submit.addEventListener("click", async function updater(e) {
				e.stopImmediatePropagation();
				submit.removeEventListener("click", updater);
				e.preventDefault();
				e.stopPropagation();
				try {
					input.disabled = true;
					submit.disabled = true;
					if (userLogonSession.type == "zkpp_password") {
						let passwordAsKey = await availableAPIs.cspOperation({
							cspProvider: "basic",
							operation: "importKey",
							cspArgument: {
								format: "raw",
								keyData: new TextEncoder().encode(input.value),
								algorithm: "PBKDF2",
								extractable: false,
								keyUsages: ["deriveBits"]
							}
						})
						let rngSeed = await availableAPIs.cspOperation({
							cspProvider: "basic",
							operation: "deriveBits",
							cspArgument: {
								algorithm: {
									name: "PBKDF2",
									salt: new Uint8Array(32),
									iterations: 100000,
									hash: "SHA-256"
								},
								baseKey: passwordAsKey,
								length: 256
							}
						});
						await availableAPIs.cspOperation({
							cspProvider: "basic",
							operation: "unloadKey",
							cspArgument: passwordAsKey
						});
						let u8aToHex = (u8a) => Array.from(u8a).map(a => a.toString(16).padStart(2, "0")).join("");
						let hexToU8A = (hex) => Uint8Array.from(hex.match(/.{1,2}/g).map(a => parseInt(a, 16)));
						await availableAPIs.automatedLogonInput({ session: userLogonID, input: u8aToHex(await availableAPIs.cspOperation({
							cspProvider: "tweetnacl",
							operation: "sign",
							cspArgument: {
								secretKey: (await availableAPIs.cspOperation({
									cspProvider: "tweetnacl",
									operation: "deriveKey",
									cspArgument: {
										type: "sign",
										seed: new Uint8Array(rngSeed)
									}
								})).secretKey,
								message: hexToU8A(userLogonSession.challenge)
							}
						}))});
					} else await availableAPIs.automatedLogonInput({ session: userLogonID, input: input.value });
					userLogonSession = await availableAPIs.automatedLogonGet(userLogonID);
				} catch {}
				return await updateProgress();
			});
		}
		await updateProgress();
		return false;
	}
	submit.addEventListener("click", userSubmit);
	if (user) {
		input.disabled = true;
		input.value = user;
		userSubmit({ preventDefault: () => {}, stopImmediatePropagation: () => {}, stopPropagation: () => {} });
	}
})();
addEventListener("signal", async function(e) {
	if (e.detail == 15) {
		try {
			await availableAPIs.sendToPipe({ pipe: ipc, data: { success: false, cancelled: true } });
		} catch {}
		await window.availableAPIs.terminate();
	}
}); null;