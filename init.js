// automatically generated file, do not edit; edit the corresponding files instead
function createREE(direction) {
	let ownIframeID = undefined;
	try {
		ownIframeID = iframeId;
	} catch {}
	return new Promise(function(resolve) {
		let iframe = document.createElement("iframe");
		let iframeId = crypto.getRandomValues(new Uint8Array(64)).reduce((a, b) => a + b.toString(16).padStart(2, "0"), "");
		let prefix = ownIframeID ? (ownIframeID + "_") : "";
		iframeId = prefix + iframeId;
		iframe.src = "data:text/html;base64," + btoa("<!DOCTYPE HTML>\n<script>const iframeId = " + JSON.stringify(iframeId) + ";\n" + reed.toString() + "\nreed();</script>");
		iframe.style.border = "none";
		iframe.setAttribute("credentialless", "true");
		iframe.sandbox = "allow-scripts";
		direction.appendChild(iframe);
		let prezhn = [];
		let prerm = [];
		iframe.addEventListener("load", function s() {
			iframe.removeEventListener("load", s);
			return resolve({
				iframe,
				exportAPI: function(id, fn) {
					iframe.contentWindow.postMessage({type: "export_api", id: id, iframeId}, "*");
					async function prezhn_it(e) {
						if (e.data.iframeId != iframeId) return;
						if (e.data.id != id) return;
						if (e.data.type != "call_api") return;
						try {
							e.source.postMessage({
								result: await fn({
									caller: iframeId,
									arg: e.data.arg
								}),
								type: "api_response",
								responseToken: e.data.responseToken,
								iframeId
							}, "*");
						} catch (er) {
							e.source.postMessage({
								result: {
									name: er.name,
									message: er.message
								},
								type: "api_error",
								responseToken: e.data.responseToken,
								iframeId
							}, "*");
						}
					}
					window.addEventListener("message", prezhn_it);
					prezhn.push(prezhn_it);
				},
				eval: function(code) {
					let responseToken = crypto.getRandomValues(new Uint8Array(64)).reduce((a, b) => a + b.toString(16).padStart(2, "0"), "");
					return new Promise(function(resolve, reject) {
						iframe.contentWindow.postMessage({type: "run", code, responseToken, iframeId}, "*");
						function sel(e) {
							if (e.data.iframeId != iframeId) return;
							if (e.data.responseToken != responseToken) return;
							prezhn = prezhn.filter(x => x != sel);
							window.removeEventListener("message", sel);
							if (e.data.type == "ran_response")
								resolve(e.data.result);
							else if (e.data.type == "ran_error")
								reject(e.data.result);
						};
						window.addEventListener("message", sel);
						prezhn.push(sel);
					});
				},
				closeDown: async function() {
					for (let i of prerm) await i(this);
					prerm = [];
					for (let i in prezhn) window.removeEventListener("message", prezhn[i]);
					iframe.remove();
					iframe = null;
				},
				beforeCloseDown: function(fn) {
					prerm.push(fn);
				},
				iframeId
			});
		});
	});
}

// reed() is for in-iframe use only
function reed() {
	window.availableAPIs = {};
	window.addEventListener("message", function(e) {
		if (e.data.iframeId != iframeId && !e.data.iframeId.startsWith(iframeId + "_")) {
			e.stopImmediatePropagation();
			e.stopPropagation();
			e.preventDefault();
			return false;
		}
		if (e.data.iframeId.startsWith(iframeId + "_")) return true;
		if (e.data.type == "export_api") {
			window.availableAPIs[e.data.id] = function(arg) {
				return new Promise(function(resolve, reject) {
					let responseToken = crypto.getRandomValues(new Uint8Array(64)).reduce((a, b) => a + b.toString(16).padStart(2, "0"), "");
					e.source.postMessage({
						type: "call_api",
						id: e.data.id,
						arg,
						responseToken: responseToken,
						iframeId
					}, "*");
					addEventListener("message", function selv(e) {
						if (e.data.iframeId != iframeId) return;
						if (e.data.responseToken != responseToken) return;
						window.removeEventListener("message", selv);
						if (e.data.type == "api_response")
							resolve(e.data.result);
						else if (e.data.type == "api_error")
							reject(e.data.result);
					});
				})
			}
		} else if (e.data.type == "unexport_api") {
			delete window.availableAPIs[e.data.id];
		} else if (e.data.type == "run") {
			try {
				e.source.postMessage({
					type: "ran_response",
					result: eval(e.data.code),
					responseToken: e.data.responseToken,
					iframeId
				}, "*");
			} catch (e2) {
				e.source.postMessage({
					type: "ran_error",
					result: {
						name: e2.name,
						message: e2.message,
						stack: e2.stack
					},
					responseToken: e.data.responseToken,
					iframeId
				}, "*");
			}
		}
	});
}let idb = {
	opendb: function() {
		if (this._db) return this._db;
		let that = this;
		return new Promise(function(resolve, reject) {
			let req = indexedDB.open("disk", 1);
			req.onupgradeneeded = function() {
				req.result.createObjectStore("disk");
			}
			req.onsuccess = function() {
				that._db = req.result;
				resolve(that._db);
			}
			req.onerror = reject;
		});
	},
	writePart: async function(part, value) {
		if (!this._db) await this.opendb();
		let that = this;
		let tx = this._db.transaction("disk", "readwrite");
		tx.objectStore("disk").put(value, part);
		let promiseID = crypto.getRandomValues(new Uint8Array(64)).reduce((a, b) => a + b.toString(16).padStart(2, "0"), "");
		let promise = new Promise(function(resolve, reject) {
			tx.oncomplete = function(...args) {    
				delete that._transactionCompleteEvent[promiseID];
				return resolve(...args);
			};
			function error(...args) {
				delete that._transactionCompleteEvent[promiseID];
				return reject(...args);
			};
			tx.onerror = error;
			tx.onabort = error;
		});
		that._transactionCompleteEvent[promiseID] = promise;
		return promise;
	},
	readPart: async function(part) {
		if (!this._db) await this.opendb();
		let tx = this._db.transaction("disk", "readonly");
		let store = tx.objectStore("disk").get(part);
		return new Promise(function(resolve, reject) {
			store.onsuccess = (e) => resolve(e.target.result);
			store.onerror = reject;
			store.onabort = reject;
		})
	},
	removePart: async function(part) {
		if (!this._db) await this.opendb();
		let that = this;
		let tx = this._db.transaction("disk", "readwrite");
		tx.objectStore("disk").delete(part);
		let promiseID = crypto.getRandomValues(new Uint8Array(64)).reduce((a, b) => a + b.toString(16).padStart(2, "0"), "");
		let promise = new Promise(function(resolve, reject) {
			tx.oncomplete = function(...args) {    
				delete that._transactionCompleteEvent[promiseID];
				return resolve(...args);
			};
			function error(...args) {
				delete that._transactionCompleteEvent[promiseID];
				return reject(...args);
			};
			tx.onerror = error;
			tx.onabort = error;
		});
		that._transactionCompleteEvent[promiseID] = promise;
		return promise;
	},
	listParts: async function() {
		if (!this._db) await this.opendb();
		let tx = this._db.transaction("disk", "readonly");
		let allKeys = tx.objectStore("disk").getAllKeys();
		return new Promise(function(resolve, reject) {
			allKeys.onsuccess = (e) => resolve(e.target.result);
			allKeys.onerror = reject;
			allKeys.onabort = reject;
		});
	},
	write: (value) => idb.writePart("disk", value),
	read: () => idb.readPart("disk"),
	sync: function() {
		return Promise.all(Object.values(this._transactionCompleteEvent));
	},
	closeDB: () => idb._db.close(),
	_db: null,
	_transactionCompleteEvent: {}
}

let disk = {
	partitions: function() {
		return Object.keys(JSON.parse(this._cache));
	},
	partition: function(name) {
		let that = this;
		let cachedPartition = JSON.parse(this._cache)[name];
		return {
			setData: function(val) {
				let commit = JSON.parse(that._cache);
				commit[name] = val;
				cachedPartition = val;
				that.raw = JSON.stringify(commit);
			},
			getData: function() {
				return cachedPartition;
			},
			remove: function() {
				let commit = JSON.parse(that._cache);
				delete commit[name];
				cachedPartition = undefined;
				that.raw = JSON.stringify(commit);
			}
		}
	},
	insertPartitionTable: function() {
		this.raw = "{}";
	},
	set raw(val) {
		this._cache = val;
		idb.write(val);
	},
	_cache: null,
	sync: () => idb.sync()
};let tty_bios_api = {
	print: function(print, html) {
		let outputEl = document.createElement("span");
		outputEl["inner" + (html ? "HTML" : "Text")] = print || "";
		document.getElementById("tty_bios").appendChild(outputEl);
		outputEl.scrollIntoView();
		return true;
	},
	println: function(print, html) { return this.print((print || "") + "\n", html); },
	clear: () => document.getElementById("tty_bios").innerText = "",
	inputKey: function() {
		return new Promise(function(resolve) {
			addEventListener("keydown", function sel(e) {
				e.preventDefault();
				removeEventListener("keydown", sel);
				resolve(e);
			})
		});
	},
	inputLine: async function(reprint = false, string = false) {
		let collection = [];
		let inputView = document.createElement("span");
		if (reprint) document.getElementById("tty_bios").appendChild(inputView);
		while (collection[collection.length - 1] !== 13 && collection[collection.length - 1] !== "Enter") {
			let key = await this.inputKey();
			if (key.key == "Backspace") {
				inputView.innerText = inputView.innerText.slice(0, -1);
				collection.pop();
			}
			if (key.key.length == 1 || key.key == "Enter" || !string) {
				if (key.key.length == 1) {
					inputView.innerText += key.key;
					inputView.scrollIntoView();
				}
				collection.push(key[string ? "key" : "keyCode"]);
			}
		}
		this.print("\n");
		collection.pop();
		if (string) collection = collection.join("");
		return collection;
	}
};
const AsyncFunction = (async () => {}).constructor;
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
						await navigator.serviceWorker.register("offline.js", {scope: "/"});
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
		tty_bios_api.println("16. Drop disk database");
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
			tty_bios_api.print("Are you sure? (y/n) ");
			if ((await tty_bios_api.inputLine(true, true)).toLowerCase() == "y") {
				idb._db = null;
				idb._transactionCompleteEvent = [];
				await new Promise(function(resolve) {
					let awaiting = indexedDB.deleteDatabase("disk");
					awaiting.onsuccess = resolve;
				});
				tty_bios_api.println("Disk wiped.");
			} else {
				tty_bios_api.println("Aborted.");
			}
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
			let generatedKey = await crypto.subtle.generateKey({
				name: "ECDSA",
				namedCurve: "P-256"
			}, true, ["sign", "verify"]);
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
			tty_bios_api.println(generateString(findInputNumberString(publicJWK.x, base64Charset), printableChars) + generateString(findInputNumberString(publicJWK.y, base64Charset), printableChars));
			tty_bios_api.println("");
			tty_bios_api.println("IPv6-like ID:");
			tty_bios_api.println((generateString(findInputNumberString(publicJWK.x, base64Charset), hexCharset).slice(0, 16) + generateString(findInputNumberString(publicJWK.y, base64Charset), hexCharset).slice(0, 16)).match(/.{1,4}/g).join(":"));
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
			tty_bios_api.println(generateString(findInputNumberString(privateJWK.d, base64Charset), incompletePrintable) + "|" + generateString(findInputNumberString(privateJWK.x, base64Charset), incompletePrintable) + "|" + generateString(findInputNumberString(privateJWK.y, base64Charset), incompletePrintable));
		} else if (choice == "5") {
			tty_bios_api.println("On the source system, select \"Show private System ID\" for the System ID Formatting.");
			tty_bios_api.print("Enter the Formatting now: ");
			let formatting = await tty_bios_api.inputLine(true, true);
			let formattingSplit = formatting.split("|");
			if (formattingSplit.length == 3) {
				let privateJWK = {
					d: generateString(findInputNumberString(formattingSplit[0], incompletePrintable), base64Charset),
					x: generateString(findInputNumberString(formattingSplit[1], incompletePrintable), base64Charset),
					y: generateString(findInputNumberString(formattingSplit[2], incompletePrintable), base64Charset),
					alg: "ES256",
					crv: "P-256",
					kty: "EC",
					ext: true,
					key_ops: ["sign"]
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
				publicKey = await crypto.subtle.importKey("jwk", publicJWK, {
					name: "ECDSA",
					namedCurve: "P-256"
				}, true, ["verify"]);
				state = "private key";
				privateKey = await crypto.subtle.importKey("jwk", privateJWK, {
					name: "ECDSA",
					namedCurve: "P-256"
				}, true, ["sign"]);
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
				let signature = await crypto.subtle.sign({
					name: "ECDSA",
					hash: {
						name: "SHA-256"
					}
				}, privateKey, randomData);
				state = "verifying data";
				let verification = await crypto.subtle.verify({
					name: "ECDSA",
					hash: {
						name: "SHA-256"
					}
				}, publicKey, signature, randomData);
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
}let coreExports = {
	disk,
	tty_bios_api,
	prefs,
	createREE,
	pbkdf2,
	idb,
	bootMode: "normal",
	bootSection: undefined,
	setFW: new_flash => localStorage.setItem("runtime_flash", new_flash)
};
globalThis.coreExports = coreExports;