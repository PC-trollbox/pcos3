async function sysHaltedHook() {
	tty_bios_api.println("System halted.");
	idb.closeDB();
	disk._cache = null;
	idb._db = null;
}

(async function() {
	let automatic_configuration = {
		guard_passwords: [],
		disallow_bad_ree: false,
		ignore_preference_key: false,
		require_password_for_boot: true,
		never_boot_from_network: false,
		registerOffline: true,
		system_id: "register-new"
	}
	let url = new URL(location);
	if (!isSecureContext) {
		tty_bios_api.println("This Runtime requires a secure context for full functionality. Please switch to HTTPS.");
		tty_bios_api.println("\tPress F1 to continue");
		tty_bios_api.println("\tPress F2 to switch to HTTPS");
		tty_bios_api.println("\tPress Enter to stop Runtime");
		while (true) {
			let key = await tty_bios_api.inputKey();
			if (key.key == "F1") {
				tty_bios_api.clear();
				break;
			}
			if (key.key == "F2") {
				location.protocol = "https:";
				return tty_bios_api.println("Switching to HTTPS...");
			}
			if (key.key == "Enter") return await sysHaltedHook();
		}
	}
	let openPrefMgr = false;
	function keyDownHandler(e) {
		if (e.key == "Enter") {
			e.preventDefault();
			openPrefMgr = true;
			removeEventListener("keydown", keyDownHandler);
		}
	}
	addEventListener("keydown", keyDownHandler);
	if (!matchMedia("(max-width: 600px)").matches) {
		tty_bios_api.println("PPPPPP CCCCCC        SSSSSS Y    Y SSSSSS TTTTTT EEEEEE M    M SSSSSS");
		tty_bios_api.println("P    P C             S       Y  Y  S        TT   E      MM  MM S     ");
		tty_bios_api.println("PPPPPP C             SSSSSS   YY   SSSSSS   TT   EEEEEE M MM M SSSSSS");
		tty_bios_api.println("P      C                  S   YY        S   TT   E      M    M      S");
		tty_bios_api.println("P      CCCCCC        SSSSSS   YY   SSSSSS   TT   EEEEEE M    M SSSSSS");
	}
	tty_bios_api.println("PC Systems");
	tty_bios_api.println("");
	tty_bios_api.println("At this point REE and disk management is loaded");
	tty_bios_api.println("Testing REE...");
	let ree_points = 0;
	let empty = document.createElement("div");
	empty.hidden = true;
	document.body.appendChild(empty);
	let ree = await createREE(empty);
	tty_bios_api.println("\tREE created");
	tty_bios_api.print("\tStorage access...\t");
	localStorage.a = "b";
	try {
		await ree.eval("localStorage.a");
		tty_bios_api.println("available (bad)");
	} catch {
		tty_bios_api.println("failed (good)");
		ree_points++;
	}
	delete localStorage.a;
	tty_bios_api.print("\tParent access...\t");
	window.a = "b";
	try {
		await ree.eval("parent.a");
		tty_bios_api.println("available (bad)");
	} catch {
		tty_bios_api.println("failed (good)");
		ree_points++;
	}
	delete window.a;
	tty_bios_api.print("\tExported API access...\t");
	try {
		await new Promise(async function(resolve, reject) {
			try {
				ree.exportAPI("ree-test", () => resolve() || (tty_bios_api.println("available (good)") && ree_points++));
				await ree.eval("window.availableAPIs['ree-test'](); null");
			} catch (e) { reject(e); }
		});
	} catch (e) {
		console.error(e);
		tty_bios_api.println("failed (bad)");
	}
	tty_bios_api.print("\tAPI authentication...\t");
	try {
		await new Promise(async function(resolve, reject) {
			try {
				ree.exportAPI("ree-test-security", (param) => resolve() || (param.caller == ree.iframeId ? (tty_bios_api.println("works (good)") && ree_points++) : tty_bios_api.println("auth failed (bad)")));
				await ree.eval("window.availableAPIs['ree-test-security'](); null");
			} catch (e) { reject(e); }
		});
	} catch (e) {
		console.error(e);
		tty_bios_api.println("define/call failed (bad)");
	}
	tty_bios_api.print("\tStopping test REE...\t");
	try {
		await ree.closeDown();
		ree_points++;
		tty_bios_api.println("ok");
	} catch {
		tty_bios_api.println("failed");
	}
	empty.remove();
	tty_bios_api.println("\tTotal points " + ree_points + " out of 5");
	if (Object.keys(coreExports.prefs.backend) == 0) {
		tty_bios_api.println("Performing automatic configuration...");
		tty_bios_api.print("\tWriting preferences...\t");
		coreExports.prefs.write("guard_passwords", automatic_configuration.guard_passwords);
		coreExports.prefs.write("disallow_bad_ree", automatic_configuration.disallow_bad_ree);
		coreExports.prefs.write("ignore_preference_key", automatic_configuration.ignore_preference_key);
		coreExports.prefs.write("require_password_for_boot", automatic_configuration.require_password_for_boot);
		coreExports.prefs.write("never_boot_from_network", automatic_configuration.never_boot_from_network);
		tty_bios_api.println("done");
		tty_bios_api.print("\tOffline access...\t");
		if (automatic_configuration.registerOffline) {
			try {
				if ((await navigator.serviceWorker.getRegistrations()).length) {
					tty_bios_api.println("worker already exists");
				} else {
					try {
						await navigator.serviceWorker.register("offline.js");
						tty_bios_api.println("done");
					} catch (e) {
						console.error(e);
						tty_bios_api.println("failed");
					}
				}
			} catch (e) {
				console.error(e);
				tty_bios_api.println("workers not supported");
			}
		}
		tty_bios_api.print("\tWriting System ID...\t");
		if (automatic_configuration.system_id == "register-new") {
			let generatedKey = await crypto.subtle.generateKey({
				name: "ECDSA",
				namedCurve: "P-256"
			}, true, ["sign", "verify"]);
			let exportedPrivateKey = await crypto.subtle.exportKey("jwk", generatedKey.privateKey);
			let exportedPublicKey = await crypto.subtle.exportKey("jwk", generatedKey.publicKey);
			coreExports.prefs.write("system_id", {
				public: exportedPublicKey,
				private: exportedPrivateKey
			});
			tty_bios_api.println("created new");
		} else {
			coreExports.prefs.write("system_id", automatic_configuration.system_id);
			tty_bios_api.println("done");
		}
	}
	if (ree_points != 5) tty_bios_api.println("REE TEST FAILED. RUNNING SYSTEM MAY BE INSECURE.");
	if (ree_points != 5 && (!url.searchParams?.get("insecure")?.includes("allow-ree-fail") || prefs.read("disallow_bad_ree") == true)) return await sysHaltedHook();
	await new Promise(r => setTimeout(r, 250));
	coreExports.bootMode = url.searchParams?.get("bootMode") || "normal";
	coreExports.bootSection = url.searchParams?.get("bootSection") || undefined;
	removeEventListener("keydown", keyDownHandler);
	if (openPrefMgr) await prefmgr();
	if (prefs.read("require_password_for_boot") == true) {
		let guardPasswords = (prefs.read("guard_passwords") || []);
		let attempts = 0;
		while (attempts != 5 && guardPasswords.length) {
			tty_bios_api.print("Enter a password: ");
			let passwordInput = await tty_bios_api.inputLine(false, true);
			let flag = false;
			for (let pass of guardPasswords) if (pass.hash == await pbkdf2(passwordInput, pass.salt)) {
				flag = true;
				break;
			}
			if (flag) break;
			attempts++;
		}
		if (attempts == 5) return tty_bios_api.println("Password incorrect. System halted.");
	}
	tty_bios_api.println("Testing disk access...");
	tty_bios_api.print("\tStarting disk...\t");
	try {
		disk._cache = (await idb.read()) || "null";
		tty_bios_api.println("ok");
	} catch (e) {
		console.error("disk access:", e);
		tty_bios_api.println("failed");
	}
	tty_bios_api.print("\tBoot partition...\t");
	let should_try = false;
	try {
		if (!disk.partitions().includes("boot")) throw false;
		tty_bios_api.println("present");
		should_try = true;
	} catch (e) {
		console.error("boot partition:", e);
		tty_bios_api.println("bad");
	}
	tty_bios_api.print("\tStarting the system...\t");
	let success = false;
	try {
		if (!should_try) tty_bios_api.println("boot partition missing, skipped");
		if (should_try) {
			await new AsyncFunction(disk.partition("boot").getData())();
			tty_bios_api.println("finished");
			success = true;
		}
	} catch (e) {
		console.error("hard drive booting:", e);
		tty_bios_api.println("failed");
	}
	if (!success) {
		tty_bios_api.print("Network starting...\t");
		if (prefs.read("never_boot_from_network")) tty_bios_api.println("disallowed");
		else {
			try {
				let bootRequest = await fetch(url.searchParams?.get("bootSource") || "os.js");
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
				element.innerText = "finished";
			} catch (e) {
				console.error("network booting:", e);
				tty_bios_api.println("failed");
			}
		}
	}
	await sysHaltedHook();
})();
