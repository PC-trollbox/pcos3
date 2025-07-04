let prefs = {
	read: function(key) {
		return this.backend[key];
	},
	write: function(key, value) {
		let backend = this.backend;
		backend[key] = value;
		this.backend = backend;
	},
	rm: function(key) {
		let backend = this.backend;
		delete backend[key];
		this.backend = backend;
	},
	ls: function() {
		return Object.keys(this.backend);
	},
	be_cache: JSON.parse(localStorage.getItem("runtime_prefs") || "{}"),
	get backend() {
		return this.be_cache;
	},
	set backend(value) {
		this.be_cache = value;
		localStorage.setItem("runtime_prefs", JSON.stringify(value));
	}
}

let hexToU8A = (hex) => Uint8Array.from(hex.match(/.{1,2}/g).map(a => parseInt(a, 16)));
let u8aToHex = (u8a) => Array.from(u8a).map(a => a.toString(16).padStart(2, "0")).join("");

async function pbkdf2(pass, salt) {
	return u8aToHex(new Uint8Array(await crypto.subtle.deriveBits({
		name: "PBKDF2",
		salt: hexToU8A(salt),
		iterations: 100000,
		hash: "SHA-256"
	}, await crypto.subtle.importKey("raw",
		new TextEncoder().encode(pass), {
			name: "PBKDF2"
		},
		false,
		[ "deriveBits", "deriveKey" ]
	), 256)));
}

async function prefmgr() {
	if (prefs.read("ignore_preference_key") == true) return;
	let guardPasswords = (prefs.read("guard_passwords") || []);
	let superPassword = guardPasswords[0];
	let attempts = 0;
	while (attempts != 5 && superPassword != undefined) {
		tty_bios_api.println("Accessing the preference manager requires the superpassword.");
		tty_bios_api.print("Enter superpassword: ");
		let passwordInput = await tty_bios_api.inputLine(false, true);
		let hash = await pbkdf2(passwordInput, superPassword.salt);
		if (hash == superPassword.hash) break;
		attempts++;
	}
	if (attempts == 5) {
		tty_bios_api.println("Superpassword incorrect. Press any key to continue boot.");
		await tty_bios_api.inputKey();
		return;
	}
	while (true) {
		tty_bios_api.clear();
		tty_bios_api.println("Preference Manager");
		tty_bios_api.println(" 1. Add password (currently " + guardPasswords.length.toString() + " password(s))");
		tty_bios_api.println(" 2. Clear passwords");
		tty_bios_api.println(" 3. Insecure REE fallback: " + (prefs.read("disallow_bad_ree") ? "disallowed" : "ALLOWED"));
		tty_bios_api.println(" 4. Preference key: " + (prefs.read("ignore_preference_key") ? "ignored" : "PROCESSED"));
		tty_bios_api.println(" 5. Password on boot: " + (prefs.read("require_password_for_boot") ? "required" : "NOT REQUIRED"));
		tty_bios_api.println(" 6. Boot from network: " + (prefs.read("never_boot_from_network") ? "disallowed" : "ALLOWED"));
		tty_bios_api.println(" 7. Set boot mode: " + (coreExports.bootMode || "normal"));
		tty_bios_api.println(" 8. System ID settings");
		tty_bios_api.println(" 9. Boot from hard drive");
		tty_bios_api.println("10. Boot from default network");
		tty_bios_api.println("11. Boot from custom network");
		tty_bios_api.println("12. Set boot section: " + (coreExports.bootSection || "unset"));
		tty_bios_api.println("13. Poor man's JavaScript console");
		tty_bios_api.println("14. Install offline access");
		tty_bios_api.println("15. Remove offline access");
		tty_bios_api.println("16. Disk protection");
		tty_bios_api.println("17. Schedule flash update");
		tty_bios_api.println("18. Load defaults");
		tty_bios_api.println("19. Restart system");
		tty_bios_api.println("20. Exit");
		tty_bios_api.println();
		tty_bios_api.print(">> ");
		let choice = await tty_bios_api.inputLine(true, true);
		if (choice >= 9 && choice <= 11) {
			tty_bios_api.print("Disk handling...\t");
			try {
				disk._cache = (await idb.read()) || "null";
				tty_bios_api.println("ready");
			} catch (e) {
				console.error("disk access:", e);
				tty_bios_api.println("failed");
			}
		}
		if (choice == "1") {
			tty_bios_api.print("New " + (guardPasswords.length == 0 ? "super" : "") + "password (not shown while entering): ");
			let passwordInput = await tty_bios_api.inputLine(false, true);
			let rng = crypto.getRandomValues(new Uint8Array(64));
			let salt = u8aToHex(rng);
			let hash = await pbkdf2(passwordInput, salt);
			guardPasswords.push({ salt, hash });
			prefs.write("guard_passwords", guardPasswords);
			tty_bios_api.println("Password added.");
		} else if (choice == "2") {
			guardPasswords = [];
			prefs.write("guard_passwords", guardPasswords);
			tty_bios_api.println("Passwords cleared.");
		} else if (choice == "3") {
			prefs.write("disallow_bad_ree", !prefs.read("disallow_bad_ree"));
			tty_bios_api.println("Insecure REE fallback " + (prefs.read("disallow_bad_ree") ? "disallowed" : "ALLOWED") + ".");
		} else if (choice == "4") {
			prefs.write("ignore_preference_key", !prefs.read("ignore_preference_key"));
			tty_bios_api.println("Preference key " + (prefs.read("ignore_preference_key") ? "ignored" : "PROCESSED") + ".");
		} else if (choice == "5") {
			prefs.write("require_password_for_boot", !prefs.read("require_password_for_boot"));
			tty_bios_api.println("Password on boot " + (prefs.read("require_password_for_boot") ? "required" : "NOT REQUIRED") + ".");
		} else if (choice == "6") {
			prefs.write("never_boot_from_network", !prefs.read("never_boot_from_network"));
			tty_bios_api.println("Boot from network " + (prefs.read("never_boot_from_network") ? "disallowed" : "ALLOWED") + ".");
		} else if (choice == "7") {
			tty_bios_api.println("Recognizable modes: normal, safe, disable-harden, readonly, logboot");
			tty_bios_api.print("Boot mode [normal]: ");
			coreExports.bootMode = await tty_bios_api.inputLine(true, true) || "normal";
			tty_bios_api.println("Boot mode set to " + coreExports.bootMode + ".");
		} else if (choice == "8") {
			await sysID();
		} else if (choice == "9") {
			tty_bios_api.print("Booting...\t");
			try {
				await new AsyncFunction(disk.partition("boot").getData())();
				tty_bios_api.println("ok");
				throw new Error("boot_success");
			} catch (e) {
				if (e.message == "boot_success") throw e;
				tty_bios_api.println("failed");
				console.error(e);
			}
		} else if (choice == "10") {
			tty_bios_api.print("Booting...\t");
			try {
				let bootRequest = await fetch("os.js");
				let randomID = Math.random().toString(36).slice(2);
				let bootCode = "";
				let bootStreamed = bootRequest.body;
				let bootReader = bootStreamed.getReader();
				let total = bootRequest.headers.get("content-length");
				let speedsGathered = 0, speeds = 0, bytes = 0;
				tty_bios_api.println("<span id=\"" + randomID + "\"></span>", true);
				let element = document.getElementById(randomID);
				element.innerText = "downloaded 0 of " + total + " bytes (0.00%), will boot in " + (total / 12500000).toFixed(2) + " seconds, 12500000.00 bytes/second";
				let lastTime = performance.now(), trueTime = performance.now();
				while (true) {
					let reading = await bootReader.read();
					if (reading.value == undefined) break;
					bytes += reading.value.byteLength;
					let decoded = new TextDecoder().decode(reading.value);
					bootCode += decoded;
					speeds += reading.value.byteLength / ((performance.now() - lastTime) / 1000);
					speedsGathered++;
					element.innerText = "downloaded " + bytes + " of " + total + " bytes (" + ((bytes / total) * 100).toFixed(2) + "%), will boot in " + ((total - bytes) / (speeds / speedsGathered)).toFixed(2) + " seconds, " + (speeds / speedsGathered).toFixed(2) + " bytes/second";
					lastTime = performance.now();
					if (reading.done) break;
				}
				element.innerText = "downloaded " + bytes + " bytes (100.00%) in " + ((performance.now() - trueTime) / 1000).toFixed(2) + " seconds, " + (bytes / ((performance.now() - trueTime) / 1000)).toFixed(2) + " bytes/second";
				await new AsyncFunction(bootCode)();
				element.innerText = "ok";
				throw new Error("boot_success");
			} catch (e) {
				if (e.message == "boot_success") throw e;
				tty_bios_api.println("failed");
				console.error(e);
			}
		} else if (choice == "11") {
			tty_bios_api.print("Enter network address: ");
			let addr = await tty_bios_api.inputLine(true, true);
			tty_bios_api.print("Booting...\t");
			try {
				let bootRequest = await fetch(addr);
				let randomID = Math.random().toString(36).slice(2);
				let bootCode = "";
				let bootStreamed = bootRequest.body;
				let bootReader = bootStreamed.getReader();
				let total = bootRequest.headers.get("content-length");
				let speedsGathered = 0, speeds = 0, bytes = 0;
				tty_bios_api.println("<span id=\"" + randomID + "\"></span>", true);
				let element = document.getElementById(randomID);
				element.innerText = "downloaded 0 of " + total + " bytes (0.00%), will boot in " + (total / 12500000).toFixed(2) + " seconds, 12500000.00 bytes/second";
				let lastTime = performance.now(), trueTime = performance.now();
				while (true) {
					let reading = await bootReader.read();
					if (reading.value == undefined) break;
					bytes += reading.value.byteLength;
					let decoded = new TextDecoder().decode(reading.value);
					bootCode += decoded;
					speeds += reading.value.byteLength / ((performance.now() - lastTime) / 1000);
					speedsGathered++;
					element.innerText = "downloaded " + bytes + " of " + total + " bytes (" + ((bytes / total) * 100).toFixed(2) + "%), will boot in " + ((total - bytes) / (speeds / speedsGathered)).toFixed(2) + " seconds, " + (speeds / speedsGathered).toFixed(2) + " bytes/second";
					lastTime = performance.now();
					if (reading.done) break;
				}
				element.innerText = "downloaded " + bytes + " bytes (100.00%) in " + ((performance.now() - trueTime) / 1000).toFixed(2) + " seconds, " + (bytes / ((performance.now() - trueTime) / 1000)).toFixed(2) + " bytes/second";
				await new AsyncFunction(bootCode)();
				element.innerText = "ok";
				throw new Error("boot_success");
			} catch (e) {
				if (e.message == "boot_success") throw e;
				tty_bios_api.println("failed");
				console.error(e);
			}
		} else if (choice == "12") {
			tty_bios_api.print("Boot section [unset]: ");
			coreExports.bootSection = await tty_bios_api.inputLine(true, true) || undefined;
			tty_bios_api.println("Boot section set to " + (coreExports.bootSection || "unset") + ".");
		} else if (choice == "13") {
			let code = true;
			while (code) {
				code = prompt("console");
				try {
					prompt(JSON.stringify(eval(code)), JSON.stringify(eval(code)));
				} catch (e) {
					prompt(e + "\n" + e.stack, e + "\n" + e.stack);
				}
			}
		} else if (choice == "14") {
			try {
				if ((await navigator.serviceWorker.getRegistrations()).length) {
					tty_bios_api.println("Please remove the previous offline installations first.");
				} else {
					tty_bios_api.print("Registering...\t");
					try {
						await navigator.serviceWorker.register("offline.js", {scope: "/"});
						tty_bios_api.println("done");
					} catch (e) {
						console.error(e);
						tty_bios_api.println("failed");
					}
				}
			} catch (e) {
				console.error(e);
				tty_bios_api.println("Service workers not supported.");
			}
		} else if (choice == "15") {
			try {
				let regs = await navigator.serviceWorker.getRegistrations();
				if (!regs.length) {
					tty_bios_api.println("No other installations active.");
				} else {
					tty_bios_api.print("Unregistering...\t");
					try {
						await Promise.all(regs.map(a => a.unregister()));
						tty_bios_api.println("done");
					} catch (e) {
						console.error(e);
						tty_bios_api.println("failed");
					}
				}
			} catch (e) {
				console.error(e);
				tty_bios_api.println("Service workers not supported.");
			}
		} else if (choice == "16") {
			await diskProtection();
		} else if (choice == "17") {
			tty_bios_api.print("Are you sure? (y/n) ");
			if ((await tty_bios_api.inputLine(true, true)).toLowerCase() == "y") {
				localStorage.removeItem("runtime_flash");
				tty_bios_api.println("Runtime flash update scheduled.");
			} else {
				tty_bios_api.println("Aborted.");
			}
		} else if (choice == "18") {
			localStorage.removeItem("runtime_prefs");
			prefs.be_cache = {};
			tty_bios_api.println("Defaults loaded.");
		} else if (choice == "19") {
			tty_bios_api.println("Please wait.");
			location.reload();
			throw new Error("reboot");
		} else if (choice == "20") {
			break;
		} else {
			tty_bios_api.println("Invalid choice.");
		}
		tty_bios_api.println("Press any key to proceed.");
		await tty_bios_api.inputKey();
	}
}

async function sysID() {
	function findInputNumberString(output, chars) {
		let inputNum = 0n;
		for (let i = 0n; i < output.length; i++) {
			const charIndex = chars.indexOf(output[i]);
			if (charIndex === -1) throw new Error(`Invalid character '${output[i]}' in output string`);
			inputNum = inputNum * BigInt(chars.length) + BigInt(charIndex);
		}
		return inputNum;
	}
	function generateString(num, chars) {
		let base = BigInt(chars.length), result = '';
		while (num > 0n) result = chars[Number(num % base)] + result, num /= base;
		return result;
	}
	let base64Charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
	let printableChars = new Array(94).fill("").map((_, i) => String.fromCharCode(33 + i)).join("");
	let incompletePrintable = printableChars.replace("|", "");
	let hexCharset = "0123456789abcdef";
	while (true) {
		tty_bios_api.clear();
		tty_bios_api.println("PCsoft System ID");
		tty_bios_api.println("1. Remove System ID");
		tty_bios_api.println("2. Reset System ID");
		tty_bios_api.println("3. Show public System ID");
		tty_bios_api.println("4. Show private System ID");
		tty_bios_api.println("5. Import System ID");
		tty_bios_api.println("6. Verify System ID consistency");
		tty_bios_api.println("7. Back");
		tty_bios_api.println("");
		tty_bios_api.print(">> ");
		let choice = await tty_bios_api.inputLine(true, true);
		if (choice == "1") {
			prefs.write("system_id", undefined);
			tty_bios_api.println("The System ID was successfully removed.");
		} else if (choice == "2") {
			let generatedKey = await crypto.subtle.generateKey({ name: "Ed25519" }, true, ["sign", "verify"]);
			let exportedPrivateKey = await crypto.subtle.exportKey("jwk", generatedKey.privateKey);
			let exportedPublicKey = await crypto.subtle.exportKey("jwk", generatedKey.publicKey);
			prefs.write("system_id", {
				public: exportedPublicKey,
				private: exportedPrivateKey
			});
			tty_bios_api.println("The System ID was successfully (re)generated.");
		} else if (choice == "3") {
			if (!prefs.read("system_id")) {
				tty_bios_api.println("No System ID found.");
				tty_bios_api.println("Press any key to proceed.");
				await tty_bios_api.inputKey();
				continue;
			}
			let publicJWK = prefs.read("system_id").public;
			tty_bios_api.println("Public System ID:");
			tty_bios_api.println(JSON.stringify(publicJWK, null, "\t"));
			tty_bios_api.println("");
			tty_bios_api.println("Password-like ID:");
			tty_bios_api.println(generateString(findInputNumberString(publicJWK.x, base64Charset), printableChars));
			tty_bios_api.println("");
			tty_bios_api.println("IPv6-like ID:");
			tty_bios_api.println((generateString(findInputNumberString(publicJWK.x, base64Charset), hexCharset).padStart(32, "0").slice(0, 32)).match(/.{1,4}/g).join(":"));
		} else if (choice == "4") {
			if (!prefs.read("system_id")) {
				tty_bios_api.println("No System ID found.");
				tty_bios_api.println("Press any key to proceed.");
				await tty_bios_api.inputKey();
				continue;
			}
			let privateJWK = prefs.read("system_id").private;
			tty_bios_api.println("Private System ID:");
			tty_bios_api.println(JSON.stringify(privateJWK, null, "\t"));
			tty_bios_api.println("");
			tty_bios_api.println("System ID Formatting: (use this to import)");
			tty_bios_api.println(generateString(findInputNumberString(privateJWK.d, base64Charset), incompletePrintable) + "|" + generateString(findInputNumberString(privateJWK.x, base64Charset), incompletePrintable));
		} else if (choice == "5") {
			tty_bios_api.println("On the source system, select \"Show private System ID\" for the System ID Formatting.");
			tty_bios_api.print("Enter the Formatting now: ");
			let formatting = await tty_bios_api.inputLine(true, true);
			let formattingSplit = formatting.split("|");
			if (formattingSplit.length == 2) {
				let privateJWK = {
					crv: "Ed25519",
					d: generateString(findInputNumberString(formattingSplit[0], incompletePrintable), base64Charset),
					ext: true,
					key_ops: ["sign"],
					kty: "OKP",
					x: generateString(findInputNumberString(formattingSplit[1], incompletePrintable), base64Charset)
				};
				let publicJWK = JSON.parse(JSON.stringify(privateJWK));
				delete publicJWK.d;
				publicJWK.key_ops = ["verify"];
				prefs.write("system_id", {
					public: publicJWK,
					private: privateJWK
				});
				tty_bios_api.println("The System ID was successfully imported!");
			} else {
				tty_bios_api.println("Invalid formatting for the System ID.");
			}
		} else if (choice == "6") {
			let publicKey, privateKey;
			let state = "public key";
			try {
				let publicJWK = prefs.read("system_id").public;
				let privateJWK = prefs.read("system_id").private;
				publicKey = await crypto.subtle.importKey("jwk", publicJWK, { name: "Ed25519" }, true, ["verify"]);
				state = "private key";
				privateKey = await crypto.subtle.importKey("jwk", privateJWK, { name: "Ed25519" }, true, ["sign"]);
			} catch (e) {
				console.error(e);
				tty_bios_api.println("An error occurred when importing " + state + ", press any key to proceed.");
				await tty_bios_api.inputKey();
				continue;
			}
			tty_bios_api.println("The keypair was imported.")
			try {
				state = "creating random data";
				let randomData = crypto.getRandomValues(new Uint8Array(16));
				state = "signing data";
				let signature = await crypto.subtle.sign({ name: "Ed25519" }, privateKey, randomData);
				state = "verifying data";
				let verification = await crypto.subtle.verify({ name: "Ed25519" }, publicKey, signature, randomData);
				state = "checking verification";
				if (!verification) throw new Error("Verification failed");
			} catch (e) {
				console.error(e);
				tty_bios_api.println("An error occurred when " + state + ", press any key to proceed.");
				await tty_bios_api.inputKey();
				continue;
			}
			tty_bios_api.println("The keypair is consistent!")
		} else if (choice == "7") {
			break;
		} else {
			tty_bios_api.println("Invalid choice.");
		}
		tty_bios_api.println("Press any key to proceed.");
		await tty_bios_api.inputKey();
	}
}

async function diskProtection() {
	while (true) {
		tty_bios_api.clear();
		tty_bios_api.println("Disk Protection");
		tty_bios_api.println("1. Start encryption");
		tty_bios_api.println("2. Stop encryption");
		tty_bios_api.println("3. Drop disk database (not a secure wipe)");
		tty_bios_api.println("4. Reset encryption status");
		tty_bios_api.println("5. Browser key storage");
		tty_bios_api.println("6. Back");
		tty_bios_api.println("");
		tty_bios_api.print(">> ");
		let choice = await tty_bios_api.inputLine(true, true);
		if (choice == "1") {
			if (!prefs.read("encryption")) {
				tty_bios_api.print("Enter new disk password: ");
				let passwordInput = await tty_bios_api.inputLine(false, true);
				let salt = u8aToHex(crypto.getRandomValues(new Uint8Array(64)));
				let hash = hexToU8A(await pbkdf2(passwordInput, salt));
				let cryptoKey = await crypto.subtle.importKey("raw", hash, {
					name: "AES-GCM",
					length: 256
				}, false, ["encrypt", "decrypt"]);
				tty_bios_api.println("A new encryption key has been created.");
				tty_bios_api.println("Encrypting the disk database...");
				let randomID = Math.random().toString(36).slice(2);
				tty_bios_api.println("<span id=\"" + randomID + "\"></span>", true);
				let element = document.getElementById(randomID);
				element.innerText = "encrypted 0 of Infinity parts (0.00%), will complete in Infinity seconds, 0 parts/second";
				let timesGathered = 0, times = 0;
				let lastTime = performance.now(), trueTime = performance.now();
				let hasDisk = true;
				if (!idb._db) await idb.opendb();
				let parts = await idb.listParts();
				if (!parts.includes("disk")) hasDisk = false;
				if (!hasDisk) parts.push("disk");
				for (let partIndex in parts) {
					let part = parts[partIndex];
					let data;
					if (part == "disk" && !hasDisk) data = new TextEncoder().encode("{}");
					else data = new TextEncoder().encode(JSON.stringify(await idb.readPart(part)));
					let iv = crypto.getRandomValues(new Uint8Array(16));
					let encrypted = new Uint8Array(await crypto.subtle.encrypt({
						name: "AES-GCM", iv
					}, cryptoKey, data));
					let concat = new Uint8Array(iv.length + encrypted.length);
					concat.set(iv);
					concat.set(encrypted, iv.length);
					await idb.writePart(part, (part == "disk" ? salt : "") + u8aToHex(concat));
					times += performance.now() - lastTime;
					timesGathered++;
					element.innerText = "encrypted " + (+partIndex + 1) + " of " + parts.length + " parts (" + ((+partIndex + 1) / parts.length * 100).toFixed(2) + "%), will complete in " + ((parts.length - partIndex - 1) * ((times / timesGathered) / 1000)).toFixed(2) + " seconds, " + (1 / ((times / timesGathered) / 1000)).toFixed(2) + " parts/second";
					lastTime = performance.now();
				}
				element.innerText = "encrypted " + parts.length + " parts (100.00%) in " + ((performance.now() - trueTime) / 1000).toFixed(2) + " seconds, " + (parts.length / ((performance.now() - trueTime) / 1000)).toFixed(2) + " parts/second";
				tty_bios_api.println("Syncing the disk database...");
				await idb.sync();
				await idb.closeDB();
				idb._db = null;
				idb._encrypted = true;
				prefs.write("encryption", true);
				tty_bios_api.println("Encryption successfully enabled.");
			} else tty_bios_api.println("Encryption is already enabled.");
		} else if (choice == "2") {
			if (prefs.read("encryption")) {
				if (!idb._db) await idb.opendb();
				tty_bios_api.println("Decrypting the disk database...");
				let randomID = Math.random().toString(36).slice(2);
				tty_bios_api.println("<span id=\"" + randomID + "\"></span>", true);
				let element = document.getElementById(randomID);
				element.innerText = "decrypted 0 of Infinity parts (0.00%), will complete in Infinity seconds, 0 parts/second";
				let timesGathered = 0, times = 0;
				let lastTime = performance.now(), trueTime = performance.now();
				let parts = await idb.listParts();
				let action;
				if (!idb._db) await idb.opendb();
				for (let partIndex in parts) {
					let part = parts[partIndex];
					let data;
					try {
						data = await idb.readPart(part);
					} catch {
						if (!action) {
							tty_bios_api.println("The disk database might have encryption inconsistencies.");
							tty_bios_api.println("What would you like to do with corrupted parts?");
							while (action != "preserve" && action != "delete") {
								tty_bios_api.print("Action [preserve/delete]: ");
								action = await tty_bios_api.inputLine(true, true);
							}
							lastTime = performance.now();
						}
						if (action == "delete") await idb.removePart(part);
					}	
					if (data) await idb.writePart(part, data, true);
					times += performance.now() - lastTime;
					timesGathered++;
					element.innerText = "decrypted " + (+partIndex + 1) + " of " + parts.length + " parts (" + ((+partIndex + 1) / parts.length * 100).toFixed(2) + "%), will complete in " + ((parts.length - partIndex - 1) * ((times / timesGathered) / 1000)).toFixed(2) + " seconds, " + (1 / ((times / timesGathered) / 1000)).toFixed(2) + " parts/second";
					lastTime = performance.now();
				}
				element.innerText = "decrypted " + parts.length + " parts (100.00%) in " + ((performance.now() - trueTime) / 1000).toFixed(2) + " seconds, " + (parts.length / ((performance.now() - trueTime) / 1000)).toFixed(2) + " parts/second";
				tty_bios_api.println("Syncing the disk database...");
				await idb.sync();
				await idb.closeDB();
				idb._db = null;
				idb.cryptoKey = null;
				idb._encrypted = false;
				prefs.write("encryption", false);
				tty_bios_api.println("Encryption successfully disabled.");
			} else tty_bios_api.println("Encryption is already disabled.");
		} else if (choice == "3") {
			tty_bios_api.print("Are you sure? (y/n) ");
			if ((await tty_bios_api.inputLine(true, true)).toLowerCase() == "y") {
				idb._db = null;
				idb.cryptoKey = null;
				idb._transactionCompleteEvent = [];
				await new Promise(function(resolve) {
					let awaiting = indexedDB.deleteDatabase("disk");
					awaiting.onsuccess = resolve;
				});
				prefs.write("encryption", false);
				idb._encrypted = false;
				tty_bios_api.println("Disk wiped.");
			} else {
				tty_bios_api.println("Aborted.");
			}
		} else if (choice == "4") {
			tty_bios_api.println("This operation will set the encryption status of the disk database to the opposite value.");
			tty_bios_api.println("Doing that without reason might lead to inconsistencies.");
			tty_bios_api.println("The current status is: " + (prefs.read("encryption") ? "enabled" : "DISABLED"));
			tty_bios_api.print("Are you sure? (y/n) ");
			if ((await tty_bios_api.inputLine(true, true)).toLowerCase() == "y") {
				prefs.write("encryption", !prefs.read("encryption"));
				if (idb._db) await idb.closeDB();
				idb._db = null;
				idb._encrypted = !idb._encrypted;
				idb.cryptoKey = null;
				tty_bios_api.println("Set the encryption status.");
			} else {
				tty_bios_api.println("The encryption status will remain the same.");
			}
		} else if (choice == "5") {
			if (prefs.read("encryption")) {
				tty_bios_api.println("This operation will store the decryption key in the password manager of your browser.");
				tty_bios_api.println("This only works in Chrome, and possibly Chromium-based browsers.");
				tty_bios_api.print("Enter the disk password: ");
				let passwordInput = await tty_bios_api.inputLine(false, true);
				idb._encrypted = false;
				if (!idb._db) await idb.opendb(true);
				let salt = (await idb.readPart("disk")).slice(0, 128);
				idb._encrypted = true;
				await idb.closeDB();
				idb._db = null;
				idb.cryptoKey = null;
				let hash = await pbkdf2(passwordInput, salt);
				try {
					await navigator.credentials.store(new PasswordCredential({
						id: "__decrypt_pcos3",
						password: hash
					}));
				} catch {
					tty_bios_api.println("Failed to store the decryption key. See if your browser is supported.");
				}
			} else tty_bios_api.println("This is meaningless without encryption.");
		} else if (choice == "6") {
			break;
		} else {
			tty_bios_api.println("Invalid choice.");
		}
		tty_bios_api.println("Press any key to proceed.");
		await tty_bios_api.inputKey();
	}
}