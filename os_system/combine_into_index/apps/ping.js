// =====BEGIN MANIFEST=====
// signer: automaticSigner
// allow: GET_LOCALE, FETCH_SEND, PCOS_NETWORK_PING, RESOLVE_NAME
// =====END MANIFEST=====
(async function() {
	// @pcos-app-mode isolatable
	await availableAPIs.windowVisibility(false);
	await availableAPIs.attachCLI();
	if (!(await availableAPIs.getPrivileges()).includes("GET_LOCALE")) { await availableAPIs.toMyCLI("ping: Locale permission denied\r\n");
		return await availableAPIs.terminate();	}
	if (!exec_args.length) {
		await availableAPIs.toMyCLI(await availableAPIs.lookupLocale("PING_USAGE") + "\r\n");
		await availableAPIs.toMyCLI(await availableAPIs.lookupLocale("PING_DESCRIPTION") + "\r\n")
		await availableAPIs.toMyCLI("\t" + await availableAPIs.lookupLocale("PING_INTERNET_OPTION") + "\r\n");
		await availableAPIs.toMyCLI("ping: " + await availableAPIs.lookupLocale("NO_ARGUMENTS") + "\r\n");
		return availableAPIs.terminate();
	}
	if (exec_args.includes("--internet")) {
		exec_args = exec_args.filter(a => a != "--internet");
		if (!exec_args.length) {
			await availableAPIs.toMyCLI("ping: No URL specified\r\n");
			return availableAPIs.terminate();
		}
		await availableAPIs.toMyCLI("Pinging " + exec_args[0] + " via HTTP...\r\n");
		for (let i = 1; i <= 4; i++) {
			await new Promise((resolve) => setTimeout(() => resolve("ping"), 500));
			let time = performance.now();
			try {
				if ((await Promise.race([await availableAPIs.fetchSend({
					url: exec_args[0],
					init: {
						noArrayBuffer: true,
						mode: "no-cors"
					}
				}), new Promise((resolve) => setTimeout(() => resolve("timeout"), 30000))])) == "timeout") throw new Error("Response timed out");
				time = performance.now() - time;
				await availableAPIs.toMyCLI("http_seq=" + i + " time=" + time.toFixed(2) + " ms\r\n");
			} catch (e) {
				time = performance.now() - time;
				await availableAPIs.toMyCLI("http_seq=" + i + " time=" + time.toFixed(2) + " ms err=" + e.name + ": " + e.message + "\r\n");
			}
		}
		return availableAPIs.terminate();
	}
	let pingedAddress;
	if (exec_args[0].includes(":")) pingedAddress = exec_args[0].replaceAll(":", "");
	else {
		try {
			pingedAddress = await Promise.race([
				await availableAPIs.resolve(exec_args[0]),
				new Promise((resolve) => setTimeout(() => resolve("timeout"), 30000))
			])
			if (pingedAddress == "timeout") throw new Error("Response timed out");
			if (!pingedAddress) throw new Error("Could not resolve hostname");
		} catch (e) {
			await availableAPIs.toMyCLI("ping: " + exec_args[0] + ": " + e.name + ": " + e.message + "\r\n");
			return await availableAPIs.terminate();
		}
	}
	await availableAPIs.toMyCLI("Pinging " + exec_args[0] + " (" + pingedAddress.match(/.{1,4}/g).join(":") + ") via PCOS Network...\r\n");
	for (let i = 1; i <= 4; i++) {
		await new Promise((resolve) => setTimeout(() => resolve("ping"), 500));
		let time = performance.now();
		try {
			let race = await Promise.race([await availableAPIs.networkPing(pingedAddress), new Promise((resolve) => setTimeout(() => resolve("timeout"), 30000))]);
			if (race == "timeout") throw new Error("Response timed out");
			time = performance.now() - time;
			await availableAPIs.toMyCLI("count=" + i + " time=" + time.toFixed(2) + " ms\r\n");
		} catch (e) {
			time = performance.now() - time;
			await availableAPIs.toMyCLI("count=" + i + " time=" + time.toFixed(2) + " ms err=" + e.name + ": " + e.message + "\r\n");
		}
	}
	await availableAPIs.terminate();
})();
addEventListener("signal", async function(e) {
	if (e.detail == 15) await window.availableAPIs.terminate();
}); null;