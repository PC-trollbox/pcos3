const fs = require("fs");
const path = require("path");
const util = require("util");
const crypto = require("crypto");
const args = util.parseArgs({
	strict: false,
	allowPositionals: true,
	options: {
		"branch": {
			type: "string",
			short: "b",
			default: ""
		},
		"no-history-preserve": {
			type: "boolean",
			short: "h"
		},
		"output": {
			type: "string",
			short: "o",
			default: __dirname + "/../index.js"
		},
		"no-increment": {
			type: "boolean",
			short: "i"
		}
	}
});
let keypair = false;
let ext2mime = {
	"png": "image/png",
	"jpg": "image/jpeg",
	"jpeg": "image/jpeg",
	"gif": "image/gif",
	"mp4": "video/mp4",
	"webm": "video/webm",
	"mkv": "video/x-matroska",
	"flv": "video/x-flv",
	"mp3": "audio/mpeg",
	"ogg": "audio/ogg",
	"wav": "audio/wav",
	"flac": "audio/flac"
};
let mimeBase2pcos = {
	"image": "pic",
	"video": "vid",
	"audio": "aud"
};
try {
	keypair = JSON.parse(fs.readFileSync(__dirname + "/../keypair.json"));
} catch {
	console.error("no keypair.json file found, run node ../keypair.js");
	process.exit(1);
}
if (!keypair.ksk_private && !keypair.automaticSigner_private) {
	console.log("keypair.json is in v1, run node ../port-keypair-to-v2.js");
	process.exit(1);
}
let pcosHeader = fs.readFileSync(__dirname + "/boot/00-pcos.js").toString().split("\n");
let version = pcosHeader[1].match(/\d+/)[0];
version = parseInt(version);
if (!args.values["no-increment"]) version++;
version = version + args.values.branch;
pcosHeader[1] = "const pcos_version = " + JSON.stringify(version) + ";";
pcosHeader[2] = "const build_time = " + Date.now() + ";";
pcosHeader = pcosHeader.join("\n");
if (!args.values["no-increment"]) fs.writeFileSync(__dirname + "/boot/00-pcos.js", pcosHeader);
let newBuild = "// This is a generated file. Please modify the corresponding files, not this file directly.\n";
newBuild += "// (c) Copyright 2024 PCsoft. MIT license: https://spdx.org/licenses/MIT.html\n";
function createMediaStructure(currentlyScanning = __dirname, notFirstStep = false) {
	let readdir = fs.readdirSync(currentlyScanning);
	if (!notFirstStep) readdir = readdir.filter(a => a != "apps" && a != "boot" && a != "combine.js");
	let structure = {};
	for (let file of readdir) {
		let stats = fs.statSync(currentlyScanning + "/" + file);
		if (stats.isDirectory()) structure[file] = createMediaStructure(currentlyScanning + "/" + file, true);
		if (stats.isFile()) {
			let extension = path.extname(file).slice(1);
			let filenameWithoutExt = path.basename(file, extension);
			if (ext2mime.hasOwnProperty(extension)) {
				let mime = ext2mime[extension];
				let newExt = mimeBase2pcos[mime.split("/")[0]];
				structure[filenameWithoutExt + newExt] = "data:" + mime + ";base64," + fs.readFileSync(currentlyScanning + "/" + file).toString("base64");
			} else structure[file] = fs.readFileSync(currentlyScanning + "/" + file).toString();
		}
	}
	return structure;
}
let appFiles = fs.readdirSync(__dirname + "/apps");
let buildFiles = fs.readdirSync(__dirname + "/boot");
let appFns = [];
for (let buildFile of buildFiles) {
	if (buildFile == path.basename(__filename)) continue;
	if (buildFile.startsWith("out")) continue;
	newBuild += "\n// " + path.basename(buildFile) + "\n";
	if (buildFile == "00-pcos.js") {
		newBuild += pcosHeader;
		continue;
	}
	let bfc = fs.readFileSync(__dirname + "/boot/" + buildFile).toString();
	if (buildFile == "06-ksk.js") {
		bfc = bfc.replace("{stub:\"present\"}", JSON.stringify(keypair.ksk));
	}
	if (buildFile == "15-apps.js") {
		let mediaStructure = createMediaStructure();
		appFns.push("mediaInstaller");
		bfc = bfc + `
		// dynamically inserted
		async function mediaInstaller(target, token) {
			let mediaStructure = ${JSON.stringify(mediaStructure)};
			async function extractMedia(target, mediaStructure, token) {
				for (let key in mediaStructure) {
					let value = mediaStructure[key];
					if (typeof value == "object") {
						try {
							await modules.fs.mkdir(target + "/" + key, token);
						} catch {}
						await extractMedia(target + "/" + key, value, token);
					} else await modules.fs.write(target + "/" + key, value, token);
					await modules.fs.chmod(target + "/" + key, "rx", token);
				}
			}
			return await extractMedia(target, mediaStructure, token);
		}
		`;
		for (let appFile of appFiles) {
			let app = fs.readFileSync(__dirname + "/apps/" + appFile).toString();
			let appName = appFile.split(".");
			appName.splice(appName.lastIndexOf("js"), 1);
			appName = appName.join(".");
			let manifestStats = [];
			if (app.includes("// =====BEGIN MANIFEST=====")) {
				let parsingLines = app.split("\n");
				let parsingBoundStart = parsingLines.indexOf("// =====BEGIN MANIFEST=====");
				let parsingBoundEnd = parsingLines.indexOf("// =====END MANIFEST=====");
				let upToParse = parsingLines.slice(parsingBoundStart + 1, parsingBoundEnd);
				for (let line of upToParse) {
					let lineType = line.split(": ")[0].replace("// ", "");
					let lineData = line.replace("// " + lineType + ": ", "");
					let dataParts = lineData.split(", ");
					for (let data of dataParts) {
						if (lineType == "signature") parsingLines.splice(parsingLines.indexOf(line), 1);
						manifestStats.push({ lineType, data });
					}
				}
				app = parsingLines.join("\n");
				let signature = crypto.sign("sha256", app, {
					key: keypair[manifestStats.find(x => x.lineType == "signer")?.data + "_private"],
					format: "jwk",
					dsaEncoding: "ieee-p1363"
				}).toString("hex");
				parsingLines.splice(parsingBoundEnd, 0, "// signature: " + signature);
				app = parsingLines.join("\n");
			}
			
			let fnName = (manifestStats.filter(x => x.lineType == "fnName") || [])[0]?.data || (appName + "Installer");
			let link = (manifestStats.filter(x => x.lineType == "link") || [])[0]?.data;
			let lrn = (link || "").includes("lrn:") ? link.replace("lrn:", "") : "";
			let name = (link || "").includes("name:") ? link.replace("name:", "") : "";
			appFns.push(fnName);
			bfc = bfc + `// ../apps/${appFile}
async function ${fnName}(target, token) {
	let neededApps = await modules.fs.ls(target + "/", token);
	if (!neededApps.includes("apps")) await modules.fs.mkdir(target + "/apps", token);
	await modules.fs.chmod(target + "/apps", "rx", token);
	let neededAppsLinks = await modules.fs.ls(target + "/apps", token);
	if (!neededAppsLinks.includes("links")) await modules.fs.mkdir(target + "/apps/links", token);
	await modules.fs.chmod(target + "/apps/links", "rx", token);
	let neededAppsAssocs = await modules.fs.ls(target + "/apps", token);
	if (!neededAppsAssocs.includes("associations")) await modules.fs.mkdir(target + "/apps/associations", token);
	await modules.fs.chmod(target + "/apps/associations", "rx", token);
	let appPath = target + "/apps/" + ${JSON.stringify(appName)} + ".js";
	let linkPath = target + "/apps/links/" + ${JSON.stringify(appName)} + ".lnk";
	let assocs = ${(JSON.stringify((manifestStats.filter(x => x.lineType == "association") || []).map(x => x.data)))};
	if (${link != undefined}) {
		let lrn = ${JSON.stringify(lrn)} || undefined;
		let name = ${JSON.stringify(name)} || undefined;
		await modules.fs.write(linkPath, JSON.stringify({
			path: appPath,
			localeReferenceName: lrn,
			name
		}), token);
		await modules.fs.chmod(linkPath, "rx", token);
	}
	for (let assoc of assocs) {
		let lrn, name;
		if (${link != undefined}) {
			lrn = ${JSON.stringify(lrn)} || undefined;
			name = ${JSON.stringify(name)} || undefined;
		}
		await modules.fs.write(target + "/apps/associations/" + assoc, JSON.stringify({
			path: appPath,
			localeReferenceName: lrn,
			name
		}), token);
		await modules.fs.chmod(target + "/apps/associations/" + assoc, "rx", token);
	}
	await modules.fs.write(appPath, ${JSON.stringify(app)}, token);
	await modules.fs.chmod(appPath, "rx", token);
}
`;
		}
	}
	newBuild += bfc;
}
newBuild = newBuild.replace("let appFns = [ _generated?._automatically?._by?._combine?.js ];", "let appFns = [ " + appFns.join(", ") + " ];");
fs.writeFileSync(args.values.output, newBuild);
if (!args.values["no-history-preserve"]) fs.writeFileSync(__dirname + "/../history/build" + version + ".js", newBuild);