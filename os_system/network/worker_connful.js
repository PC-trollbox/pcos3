
const worker_threads = require("worker_threads");
const fs = require("fs");
const diff = require("fast-myers-diff");
if (worker_threads.isMainThread) {
	console.log("This is a worker");
	process.exit(1);
}
let data = worker_threads.workerData;
try {
	let fromBuild = "";
	let generator = diff.calcPatch(fromBuild, fs.readFileSync(__dirname + "/../index.js").toString());
	let ctr = 0;
	for (let hunk of generator) {
		worker_threads.parentPort.postMessage(JSON.stringify(data.handlesCtr ? {hunk,ctr} : hunk));
		ctr++;
	}
	worker_threads.parentPort.postMessage(JSON.stringify({ final: true }));
} catch {}
process.exit(0);