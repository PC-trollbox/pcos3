async function loadModules() {
	let hexToU8A = (hex) => Uint8Array.from(hex.match(/.{1,2}/g).map(a => parseInt(a, 16)));
	let khrlSignatures = [];
	let mountpointList = [];
	let module2point = {};
	async function loadKHRL() {
		let khrlFiles = await modules.fs.ls(module2point["00-keys.fs"] + "/etc/keys/khrl");
		for (let khrlFile of khrlFiles) {
			let khrl = JSON.parse(await modules.fs.read(module2point["00-keys.fs"] + "/etc/keys/khrl/" + khrlFile));
			let khrlSignature = khrl.signature;
			delete khrl.signature;
			if (await crypto.subtle.verify({ name: "Ed25519" }, modules.ksk_imported, hexToU8A(khrlSignature), new TextEncoder().encode(JSON.stringify(khrl.list)))) {
				khrlSignatures.push(...khrl.list);
			}
		}
	}
	async function recursiveKeyVerify(key, khrl) {
		if (!key) throw new Error("NO_KEY");
		if (key.keyInfo.dates?.since > Date.now()) throw new Error("KEY_NOT_IN_TIME");
		if (Date.now() > key.keyInfo.dates?.until) throw new Error("KEY_NOT_IN_TIME");
		let u8aToHex = (u8a) => Array.from(u8a).map(a => a.toString(16).padStart(2, "0")).join("");
		let hash = u8aToHex(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode((key.keyInfo.key).x))));
		let hexToU8A = (hex) => Uint8Array.from(hex.match(/.{1,2}/g).map(a => parseInt(a, 16)));
		if (khrl.includes(hash)) throw new Error("KEY_REVOKED");
		let signedByKey = modules.ksk_imported;
		if (key.keyInfo.signedBy) {
			signedByKey = JSON.parse(await modules.fs.read(module2point["00-keys.fs"] + "/etc/keys/" + key.keyInfo.signedBy));
			if (!signedByKey.keyInfo.usages.includes("keyTrust")) throw new Error("NOT_KEY_AUTHORITY");
			await recursiveKeyVerify(signedByKey, khrl);
			signedByKey = await crypto.subtle.importKey("jwk", signedByKey.keyInfo.key, { name: "Ed25519" }, false, ["verify"]);
		}
		if (!await crypto.subtle.verify({ name: "Ed25519" }, signedByKey, hexToU8A(key.signature), new TextEncoder().encode(JSON.stringify(key.keyInfo)))) throw new Error("KEY_SIGNATURE_VERIFICATION_FAILED");
		return true;
	}
	try {
		let moduleList = (await modules.fs.ls(modules.defaultSystem + "/modules")).sort((a, b) => a.localeCompare(b));
		for (let moduleName of moduleList) {
			let fullModuleFile = JSON.parse(await modules.fs.read(modules.defaultSystem + "/modules/" + moduleName));
			let fullModuleSignature = fullModuleFile.buildInfo.signature;
			delete fullModuleFile.buildInfo.signature;
			if (moduleName == "00-keys.fs") {
				try {
					fullModuleFile = JSON.stringify(fullModuleFile);
					if (!(await crypto.subtle.verify({
						name: "Ed25519"
					}, modules.ksk_imported, hexToU8A(fullModuleSignature), new TextEncoder().encode(fullModuleFile)))) throw new Error("MODULE_SIGNATURE_VERIFICATION_FAILED");
				} catch (e) {
					if (modules.core.bootMode != "disable-harden") await panic("KEYS_MODULE_VERIFICATION_FAILED", {
						name: "/modules/00-keys.fs",
						params: [modules.defaultSystem],
						underlyingJS: e
					});
				}
			} else {
				let critical = fullModuleFile.buildInfo.critical;
				try {
					let signingKey = JSON.parse(await modules.fs.read(module2point["00-keys.fs"] + "/etc/keys/" + fullModuleFile.buildInfo.signer));
					await recursiveKeyVerify(signingKey, khrlSignatures);
					if (!signingKey.keyInfo.usages.includes("moduleTrust")) throw new Error("NOT_MODULE_SIGNING_KEY");
					let importSigningKey = await crypto.subtle.importKey("jwk", signingKey.keyInfo.key, { name: "Ed25519" }, false, ["verify"]);
					fullModuleFile = JSON.stringify(fullModuleFile);
					if (!await crypto.subtle.verify({
						name: "Ed25519"
					}, importSigningKey, hexToU8A(fullModuleSignature), new TextEncoder().encode(fullModuleFile))) throw new Error("MODULE_SIGNATURE_VERIFICATION_FAILED");
				} catch (e) {
					console.error("Failed to verify module:", e);
					if (critical && modules.core.bootMode != "disable-harden") await panic("CRITICAL_MODULE_VERIFICATION_FAILED", {
						name: "/modules/" + moduleName,
						params: [modules.defaultSystem],
						underlyingJS: e
					});
					if (modules.core.bootMode != "disable-harden") {
						moduleList.splice(moduleList.indexOf(moduleName), 1);
						continue;
					}
				}
			}
			let mountpoint = "." + crypto.getRandomValues(new Uint8Array(8)).reduce((a, b) => a + b.toString(16).padStart(2, "0"), "");
			mountpointList.push(mountpoint);
			module2point[moduleName] = mountpoint;
			modules.fs.mounts[mountpoint] = await modules.mounts.fileMount({
				srcFile: modules.defaultSystem + "/modules/" + moduleName,
				read_only: true
			});
			if (moduleName == "00-keys.fs") await loadKHRL();
			if (modules.core.bootMode == "logboot") modules.core.tty_bios_api.println("\t../modules/" + moduleName);
		}
		modules.fs.mounts.system = await modules.mounts.overlayMount({
			mounts: [ modules.defaultSystem, ...mountpointList ]
		});
		await modules.fs.write("ram/run/moduleSystem.json", JSON.stringify({
			system: [ modules.defaultSystem, ...mountpointList ]
		}));
		modules.defaultSystem = "system";
	} catch (e) {
		console.error("Module system failed:", e);
	}
}
await loadModules();