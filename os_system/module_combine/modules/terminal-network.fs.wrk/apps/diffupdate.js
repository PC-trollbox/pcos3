// =====BEGIN MANIFEST=====
// signer: automaticSigner
// allow: GET_LOCALE, FS_READ, FS_WRITE, FS_BYPASS_PERMISSIONS, PATCH_DIFF, RESOLVE_NAME, CONNFUL_CONNECT, CONNFUL_READ, CONNFUL_WRITE, CONNFUL_DISCONNECT, FS_LIST_PARTITIONS, CSP_OPERATIONS, START_TASK, LIST_TASKS, GET_UPDATE_SERVICE, CONNFUL_IDENTITY_GET
// allow: FS_WRITE, RUN_KLVL_CODE, IPC_CREATE_PIPE, IPC_LISTEN_PIPE, GET_LOCALE, FS_LIST_PARTITIONS, SYSTEM_SHUTDOWN, FS_READ, FS_BYPASS_PERMISSIONS
// =====END MANIFEST=====
(async function() {
	// @pcos-app-mode isolatable
	await availableAPIs.attachCLI();
	let pargs = {};
	let ppos = [];
	for (let arg of exec_args) {
		if (arg.startsWith("--")) {
			let key = arg.split("=")[0].slice(2);
			let value = arg.split("=").slice(1).join("=");
			if (arg.split("=")[1] == null) value = true;
			if (pargs.hasOwnProperty(key)) {
				let ogValues = pargs[key];
				if (ogValues instanceof Array) pargs[key] = [ ...ogValues, value ];
				else pargs[key] = [ ogValues, value ];
			} else pargs[key] = value;
		} else ppos.push(arg);
	}
	if (!pargs["override-modules"]) {
		await availableAPIs.toMyCLI("diffupdate no longer works on modular systems and will be replaced with a better version.\r\n");
		await availableAPIs.toMyCLI("To run diffupdate anyway, re-run with --override-modules.\r\n");
		return await availableAPIs.terminate();
	}
	try {
		let etcls = await availableAPIs.fs_ls({
			path: (await availableAPIs.getSystemMount()) + "/etc"
		});
		let from = "scratch";
		let originalVersion = "";
		if (etcls.includes("diffupdate_cache.js")) {
			originalVersion = await availableAPIs.fs_read({
				path: (await availableAPIs.getSystemMount()) + "/etc/diffupdate_cache.js"
			});
			from = originalVersion.split("\n")[5].match(/\d\w+/)[0];
		}
		await availableAPIs.toMyCLI((await availableAPIs.lookupLocale("CURRENT_OSFILE_VERSION")).replace("%s", from) + "\r\n");
		let serverDomainOrAddress = ppos[0] || ((await availableAPIs.getUpdateService()) || "pcosserver.pc");
		let serverAddress = serverDomainOrAddress;
		if (!serverAddress.includes(":")) serverAddress = await availableAPIs.resolve(serverAddress);
		if (!serverAddress) throw new Error(await availableAPIs.lookupLocale("HOSTNAME_RESOLUTION_FAILED"));
		serverAddress = serverAddress.replaceAll(":", "");
		await availableAPIs.toMyCLI((await availableAPIs.lookupLocale("DOWNLOADING_OS_PATCH")).replace("%s", serverDomainOrAddress).replace("%s", serverAddress.match(/.{1,4}/g).join(":")) + "\r\n");
		let connection = await availableAPIs.connfulConnect({
			gate: "deltaUpdate",
			address: serverAddress,
			verifyByDomain: serverDomainOrAddress.includes(":") ? serverAddress : serverDomainOrAddress,
			doNotVerifyServer: pargs["fingerprint"] || pargs["no-verification"] || pargs["view-fingerprint"]
		});
		await availableAPIs.connfulConnectionSettled(connection);
		if (pargs["fingerprint"] || pargs["view-fingerprint"]) {
			let identity = await availableAPIs.connfulIdentityGet(connection);
			let hash = await availableAPIs.cspOperation({
				cspProvider: "basic",
				operation: "digest",
				cspArgument: {
					algorithm: "SHA-256",
					data: new TextEncoder().encode(identity)
				}
			});
			hash = Array.from(new Uint8Array(hash)).map(a => a.toString(16).padStart(2, "0")).join("");
			if (pargs["view-fingerprint"]) await availableAPIs.toMyCLI("--fingerprint=" + hash + "\r\n");
			if (pargs["fingerprint"] != hash) {
				await availableAPIs.connfulDisconnect(connection);
				if (!pargs["view-fingerprint"]) await availableAPIs.toMyCLI(await availableAPIs.lookupLocale("SERVER_SIGNATURE_VERIFICATION_FAILED") + "\r\n");
				return await availableAPIs.terminate();
			}
		}
		await availableAPIs.connfulWrite({
			connectionID: connection,
			data: JSON.stringify({ from, handlesCtr: true })
		})
		let patch = [];
		while (true) {
			let a = JSON.parse(await availableAPIs.connfulRead(connection));
			if (a.final) break;
			patch[a.ctr] = a.hunk;
			await availableAPIs.toMyCLI("\r" + (await availableAPIs.lookupLocale("PATCH_HUNK_COUNT")).replace("%s", patch.length));
		}
		await availableAPIs.connfulDisconnect(connection);
		await availableAPIs.toMyCLI("\r" + (await availableAPIs.lookupLocale("PATCH_HUNK_COUNT")).replace("%s", patch.length) + "\r\n");
		if (patch.length == 0) {
			await availableAPIs.toMyCLI(await availableAPIs.lookupLocale("SYSTEM_UP_TO_DATE") + "\r\n");
			return await availableAPIs.terminate();
		}
		await availableAPIs.fs_write({
			path: (await availableAPIs.getSystemMount()) + "/etc/diffupdate_cache.js",
			data: (await availableAPIs.patchDiff({
				operation: "applyPatch",
				args: [ originalVersion, patch ]
			})).join("")
		});
		await availableAPIs.toMyCLI(await availableAPIs.lookupLocale("HANDOFF_UPDATE") + "\r\n");
		let task = await availableAPIs.startTask({
			file: (await availableAPIs.getSystemMount()) + "/apps/updateos.js",
			argPassed: [ (await availableAPIs.getSystemMount()) + "/etc/diffupdate_cache.js" ],
			silent: true
		});
		await availableAPIs.waitTermination(task);
		await availableAPIs.terminate();
	} catch (e) {
		await availableAPIs.toMyCLI("diffupdate: " + await availableAPIs.lookupLocale(e.message) + "\r\n");
		await availableAPIs.terminate();
	}
})();
addEventListener("signal", async function(e) {
	if (e.detail == 15) await window.availableAPIs.terminate();
}); null;