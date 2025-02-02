const worker_threads = require("worker_threads");
const fs = require("fs");
const diff = require("fast-myers-diff");
const crypto = require("crypto");
if (worker_threads.isMainThread) {
    console.log("This is a worker");
    process.exit(1);
}
(async function() {
    let u8aToHex = (u8a) => Array.from(u8a).map(a => a.toString(16).padStart(2, "0")).join("");
    let {packetData, serverAddress, connData} = worker_threads.workerData;
    try {
        let fromBuild = "";
        if (packetData.data.content.from != "scratch")
            fromBuild = fs.readFileSync(__dirname + "/../history/build" + String(packetData.data.content.from.match(/\w+/g)) + ".js").toString();
        let generator = diff.calcPatch(fromBuild, fs.readFileSync(__dirname + "/../index.js").toString());
        let patch;
        if (connData) {
            for (let hunk of generator) {
                let iv = crypto.getRandomValues(new Uint8Array(16));
                let ct = u8aToHex(new Uint8Array(await crypto.subtle.encrypt({
                    name: "AES-GCM",
                    iv
                }, connData.aesUsableKey, new TextEncoder().encode(JSON.stringify(hunk)))));
                worker_threads.parentPort.postMessage(JSON.stringify({
                    from: serverAddress,
                    data: {
                        type: "connectionful",
                        action: "data",
                        content: {
                            iv: u8aToHex(iv),
                            ct
                        },
                        connectionID: packetData.data.connectionID
                    }
                }));
            }
        } else patch = [...generator];
        let finalIV = crypto.getRandomValues(new Uint8Array(16));
        worker_threads.parentPort.postMessage(JSON.stringify({
            from: serverAddress,
            data: {
                type: connData ? "connectionful" : "connectionless",
                gate: packetData.data.content.reply,
                action: connData ? "data" : undefined,
                content: connData ? ({
                    iv: u8aToHex(finalIV),
                    ct: u8aToHex(new Uint8Array(await crypto.subtle.encrypt({
                        name: "AES-GCM",
                        iv: finalIV
                    }, connData.aesUsableKey, new TextEncoder().encode(JSON.stringify({ final: true }))))) }) : patch,
                connectionID: packetData.data.connectionID
            }
        }));
    } catch {}
    process.exit(0);
})();