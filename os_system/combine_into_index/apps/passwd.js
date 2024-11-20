// =====BEGIN MANIFEST=====
// signer: automaticSigner
// allow: GET_LOCALE, SET_SECURITY_CHECKS, CSP_OPERATIONS
// =====END MANIFEST=====
(async function() {
	// @pcos-app-mode isolatable
	await availableAPIs.windowVisibility(false);
	await availableAPIs.attachCLI();
	await availableAPIs.toMyCLI(await availableAPIs.lookupLocale("PASSWD_NEW_PROMPT") + "\r\n");
	await availableAPIs.toMyCLI(await availableAPIs.lookupLocale("PASSWD_2FACTOR_LOSS_WARN") + "\r\n");
	await availableAPIs.toMyCLI(await availableAPIs.lookupLocale("PASSWD_PROMPT"));
	let str = "";
	let stage = 0;
	let password = "";
	onTermData(async function(e) {
		if (e == "\r") {
			await availableAPIs.toMyCLI("\r\n");
			if (stage == 0) {
				password = str;
				await availableAPIs.toMyCLI(await availableAPIs.lookupLocale("PASSWD_CONFIRM_PROMPT"));
				stage = 1;
				str = "";
			} else if (stage == 1) {
				stage = 2;
				if (str == password) {
					let salt = await availableAPIs.cspOperation({
						cspProvider: "basic",
						operation: "random",
						cspArgument: new Uint8Array(64)
					});
					let u8aToHex = (u8a) => Array.from(u8a).map(a => a.toString(16).padStart(2, "0")).join("");
					let key = await availableAPIs.cspOperation({
						cspProvider: "basic",
						operation: "importKey",
						cspArgument: {
							format: "raw",
							keyData: new TextEncoder().encode(password),
							algorithm: {
								name: "PBKDF2"
							},
							extractable: false,
							keyUsages: ["deriveBits", "deriveKey"]
						}
					});
					let derived = new Uint8Array(await availableAPIs.cspOperation({
						cspProvider: "basic",
						operation: "deriveBits",
						cspArgument: {
							algorithm: {
								name: "PBKDF2",
								salt: salt,
								iterations: 100000,
								hash: "SHA-256"
							},
							baseKey: key,
							length: 256
						}
					}));
					await availableAPIs.cspOperation({
						cspProvider: "basic",
						operation: "unloadKey",
						cspArgument: key
					});
					await availableAPIs.setOwnSecurityChecks({
						checks: [
							{
								type: "pbkdf2",
								hash: u8aToHex(derived),
								salt: u8aToHex(salt)
							}
						]
					});
					await availableAPIs.toMyCLI("passwd: " + await availableAPIs.lookupLocale("PASSWD_FEEDBACK") + "\r\n");
					await availableAPIs.terminate();
				} else {
					await availableAPIs.toMyCLI("passwd: " + await availableAPIs.lookupLocale("PASSWD_MISMATCH") + "\r\n");
					await availableAPIs.terminate();
				}
			}
		} else if (e == '\u007F') {
			if (str.length > 0) {
				str = str.substr(0, str.length - 1);
				await availableAPIs.toMyCLI('\b \b');
			}
		} else {
			if (e >= String.fromCharCode(0x20) && e <= String.fromCharCode(0x7E) || e >= '\u00a0') {
				str += e;
				await availableAPIs.toMyCLI("*");
			}
		}
	});
})();

async function onTermData(listener) {
	while (true) {
		listener(await availableAPIs.fromMyCLI());
	}
}
addEventListener("signal", async function(e) {
	if (e.detail == 15) await window.availableAPIs.terminate();
}); null;