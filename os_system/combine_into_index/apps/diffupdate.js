// =====BEGIN MANIFEST=====
// signer: automaticSigner
// allow: GET_LOCALE, FS_READ, FS_WRITE, FS_BYPASS_PERMISSIONS, PATCH_DIFF, RESOLVE_NAME, CONNFUL_CONNECT, CONNFUL_READ, CONNFUL_WRITE, CONNFUL_DISCONNECT, FS_LIST_PARTITIONS, CSP_OPERATIONS, START_TASK, LIST_TASKS
// allow: FS_WRITE, RUN_KLVL_CODE, IPC_CREATE_PIPE, IPC_LISTEN_PIPE, GET_LOCALE, FS_LIST_PARTITIONS, SYSTEM_SHUTDOWN, FS_READ, FS_BYPASS_PERMISSIONS
// =====END MANIFEST=====
(async function() {
	// @pcos-app-mode isolatable
	await availableAPIs.windowVisibility(false);
	await availableAPIs.attachCLI();
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
		let serverDomainOrAddress = exec_args[0] || "pcosserver.pc";
		let serverAddress = serverDomainOrAddress;
		if (!serverAddress.includes(":")) serverAddress = await availableAPIs.resolve(serverAddress);
		serverAddress = serverAddress.replaceAll(":", "");
		await availableAPIs.toMyCLI((await availableAPIs.lookupLocale("DOWNLOADING_OS_PATCH")).replace("%s", serverDomainOrAddress).replace("%s", serverAddress.match(/.{1,4}/g).join(":")) + "\r\n");
		let connection = await availableAPIs.connfulConnect({
			gate: "deltaUpdate",
			address: serverAddress,
			verifyByDomain: serverDomainOrAddress.includes(":") ? serverAddress : serverDomainOrAddress
		});
		await availableAPIs.connfulConnectionSettled(connection);
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