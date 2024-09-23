// =====BEGIN MANIFEST=====
// signer: automaticSigner
// allow: GET_LOCALE, FETCH_SEND, WEBSOCKETS_SEND, WEBSOCKETS_LISTEN, FS_READ, FS_BYPASS_PERMISSIONS
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
            try {
                let time = performance.now();
                await availableAPIs.fetchSend({
                    url: exec_args[0],
                    init: {
                        noArrayBuffer: true,
                        mode: "no-cors"
                    }
                });
                time = performance.now() - time;
                await availableAPIs.toMyCLI("http_seq=" + i + " time=" + time.toFixed(2) + " ms\r\n");
            } catch (e) {
                await availableAPIs.toMyCLI("http_seq=" + i + " " + e.name + ": " + e.message + "\r\n");
            }
        }
        return availableAPIs.terminate();
    }
    let networkWS;
    try {
        networkWS = await availableAPIs.fs_read({ path: "ram/run/network.ws" });
    } catch (e) {
        await availableAPIs.toMyCLI("ping: Network is unreachable: " + await availableAPIs.lookupLocale(e.message) + "\r\n");
        return availableAPIs.terminate();
    }
    let undecoredAddress = exec_args[0].replaceAll(":", "");
    await availableAPIs.toMyCLI("Pinging " + undecoredAddress + " via PCOS Network...\r\n");
    for (let i = 1; i <= 4; i++) {
        try {
            let resendBytes = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString(16);
            let time = performance.now();
            await availableAPIs.sendToWebsocket({ handle: networkWS, data: JSON.stringify({
                receiver: undecoredAddress,
                data: {
                    type: "ping",
                    resend: resendBytes
                }
            })});
            let eventLoop = (async function () {
                while (true) {
                    let message = JSON.parse(await availableAPIs.listenToWebsocket({ handle: networkWS, eventName: "message" }));
                    if (message.from != undecoredAddress) continue;
                    if (!message.data) continue;
                    if (message.data.type == "pong" && message.data.resend == resendBytes) break;
                }
            })();
            let race = await Promise.race([eventLoop, new Promise((resolve) => setTimeout(() => resolve("timeout"), 30000))]);
            if (race == "timeout") throw new Error("Response timed out");
            time = performance.now() - time;
            await availableAPIs.toMyCLI("resend=" + resendBytes.length + " resend_seq=" + i + " time=" + time.toFixed(2) + " ms\r\n");
        } catch (e) {
            await availableAPIs.toMyCLI("resend=" + resendBytes.length + " resend_seq=" + i + " " + e.name + ": " + e.message + "\r\n");
        }
    }
    await availableAPIs.terminate();
})();
addEventListener("signal", async function(e) {
    if (e.detail == 15) await window.availableAPIs.terminate();
}); null;