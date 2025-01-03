// =====BEGIN MANIFEST=====
// signer: automaticSigner
// allow: GET_LOCALE, FS_READ, FS_WRITE, FS_BYPASS_PERMISSIONS, PATCH_DIFF, RESOLVE_NAME, CONNLESS_LISTEN, CONNLESS_SEND, FS_LIST_PARTITIONS, RESOLVE_NAME, CSP_OPERATIONS, START_TASK, LIST_TASKS
// allow: FETCH_SEND, FS_WRITE, RUN_KLVL_CODE, IPC_CREATE_PIPE, IPC_LISTEN_PIPE, GET_LOCALE, FS_LIST_PARTITIONS, SYSTEM_SHUTDOWN, FS_READ, FS_BYPASS_PERMISSIONS
// =====END MANIFEST=====
(async function() {
	// @pcos-app-mode isolatable
	await availableAPIs.windowVisibility(false);
	await availableAPIs.attachCLI();
	try {
		let etcls = await availableAPIs.fs_ls({
			path: (await availableAPIs.getSystemMount()) + "/etc"
		});
		if (!etcls.includes("diffupdate_cache.js")) {
			await availableAPIs.toMyCLI(await availableAPIs.lookupLocale("REINSTALL_DOWNLOADING") + "\r\n");
			let osArchive = await availableAPIs.fetchSend({
				url: "/os.js",
				init: {}
			});
			await availableAPIs.toMyCLI(await availableAPIs.lookupLocale("REINSTALL_DECODING") + "\r\n");
			osArchive = osArchive.arrayBuffer;
			osArchive = new TextDecoder().decode(osArchive);
			await availableAPIs.fs_write({
				path: (await availableAPIs.getSystemMount()) + "/etc/diffupdate_cache.js",
				data: osArchive
			});
		} else {
			let originalVersion = await availableAPIs.fs_read({
				path: (await availableAPIs.getSystemMount()) + "/etc/diffupdate_cache.js"
			});
			let from = originalVersion.split("\n")[5].match(/\d\w+/)[0];
			await availableAPIs.toMyCLI((await availableAPIs.lookupLocale("CURRENT_OSFILE_VERSION")).replace("%s", from) + "\r\n");
			let serverDomainOrAddress = exec_args[0] || "pcosserver.pc";
			let serverAddress = serverDomainOrAddress;
			if (!serverAddress.includes(":")) serverAddress = await availableAPIs.resolve(serverAddress);
			serverAddress = serverAddress.replaceAll(":", "");
			await availableAPIs.toMyCLI((await availableAPIs.lookupLocale("DOWNLOADING_OS_PATCH")).replace("%s", serverDomainOrAddress).replace("%s", serverAddress.match(/.{1,4}/g).join(":")) + "\r\n");
			let randomUserPort = "user_" + Array.from(await availableAPIs.cspOperation({
				cspProvider: "basic",
				operation: "random",
				cspArgument: new Uint8Array(16)
			})).map(a => a.toString(16).padStart(2, "0")).join("");
			let listen = availableAPIs.connlessListen(randomUserPort);
			await availableAPIs.connlessSend({
				gate: "deltaUpdate",
				address: serverAddress,
				content: { from, reply: randomUserPort }
			});
			listen = await listen;
			if (listen.data.content.length == 0) {
				await availableAPIs.toMyCLI(await availableAPIs.lookupLocale("SYSTEM_UP_TO_DATE") + "\r\n");
				return await availableAPIs.terminate();
			}
			await availableAPIs.fs_write({
				path: (await availableAPIs.getSystemMount()) + "/etc/diffupdate_cache.js",
				data: (await availableAPIs.patchDiff({
					operation: "applyPatch",
					args: [ originalVersion, listen.data.content ]
				})).join("")
			})
		}
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