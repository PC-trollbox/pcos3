const worker_threads = require("worker_threads");
const fs = require("fs");
const diff = require("fast-myers-diff");
const crypto = require("crypto");
if (worker_threads.isMainThread) {
    console.log("This is a worker");
    process.exit(1);
}
let {packetData, serverAddress} = worker_threads.workerData;
try {
    let fromBuild = "";
    worker_threads.parentPort.postMessage(JSON.stringify({
        from: serverAddress,
        data: {
            type: "connectionless",
            gate: packetData.data.content.reply,
            content: [ ...diff.calcPatch(fromBuild, fs.readFileSync(__dirname + "/../index.js").toString()) ]
        },
        packetID: crypto.randomBytes(32).toString("hex")
    }));
} catch {}
process.exit(0);