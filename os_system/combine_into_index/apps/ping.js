// =====BEGIN MANIFEST=====
// signer: automaticSigner
// allow: GET_LOCALE, FETCH_SEND, PCOS_NETWORK_PING
// =====END MANIFEST=====
(async function() {
    // @pcos-app-mode isolatable
    await availableAPIs.windowVisibility(false);
    await availableAPIs.attachCLI();
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
            await new Promise((resolve) => setTimeout(() => resolve("ping"), 1000));
            try {
                let time = performance.now();
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
                await availableAPIs.toMyCLI("http_seq=" + i + " " + e.name + ": " + e.message + "\r\n");
            }
        }
        return availableAPIs.terminate();
    }
    let undecoredAddress = exec_args[0].replaceAll(":", "");
    await availableAPIs.toMyCLI("Pinging " + undecoredAddress + " via PCOS Network...\r\n");
    for (let i = 1; i <= 4; i++) {
        await new Promise((resolve) => setTimeout(() => resolve("ping"), 1000));
        let time = performance.now();
        try {
            let race = await Promise.race([await availableAPIs.networkPing(undecoredAddress), new Promise((resolve) => setTimeout(() => resolve("timeout"), 30000))]);
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