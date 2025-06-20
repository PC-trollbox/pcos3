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
		},
		"only-modules": {
			type: "boolean",
			short: "m"
		}
	}
});
let keypair = false;
let ext2mime = {
	"png": "image/png",
	"jpg": "image/jpeg",
	"jpeg": "image/jpeg",
	"gif": "image/gif",
	"svg": "image/svg+xml",
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
let pcosHeader = fs.readFileSync(__dirname + "/modules/bootable.fs.wrk/boot/00-pcos.js").toString().split("\n");
let version = pcosHeader[1].match(/\d+/)[0];
version = parseInt(version);
if (!args.values["no-increment"]) version++;
version = version + args.values.branch;
pcosHeader[1] = "const pcos_version = " + JSON.stringify(version) + ";";
pcosHeader[2] = "const build_time = " + Date.now() + ";";
pcosHeader = pcosHeader.join("\n");
if (!args.values["no-increment"] && !args.values["only-modules"]) fs.writeFileSync(__dirname + "/modules/bootable.fs.wrk/boot/00-pcos.js", pcosHeader);
function createModule(directory, permissionsPrefixed = "") {
	let listing = fs.readdirSync(directory);
	let module = { backend: { files: {}, permissions: {} }, files: {} };
	for (let file of listing) {
		let stats = fs.statSync(directory + "/" + file);
		if (stats.isDirectory()) {
			let moduleInclusion = createModule(directory + "/" + file, permissionsPrefixed + file + "/");
			module.files = { ...module.files, ...moduleInclusion.files };
			module.backend.files[file] = moduleInclusion.backend.files;
			module.backend.permissions = { ...module.backend.permissions, ...moduleInclusion.backend.permissions };
		}
		if (stats.isFile()) {
			let fileContents = fs.readFileSync(directory + "/" + file).toString();
			let fileID = crypto.randomBytes(64).toString("hex");
			let extension = path.extname(file).slice(1);
			if (ext2mime.hasOwnProperty(extension)) {
				let mime = ext2mime[extension];
				let newExt = mimeBase2pcos[mime.split("/")[0]];
				fileContents = "data:" + mime + ";base64," + fileContents.toString("base64");
				file = path.basename(file, extension) + newExt;
			} else if (extension == "js" && fileContents.includes("// @pcos-app-mode isolatable")) { // Handling apps!
				let manifestStats = [];
				if (fileContents.includes("// =====BEGIN MANIFEST=====")) {
					let parsingLines = fileContents.split("\n");
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
					fileContents = parsingLines.join("\n");
					let signer = manifestStats.find(x => x.lineType == "signer")?.data;
					if (signer) {
						let signature = crypto.sign("sha256", fileContents, {
							key: keypair[signer + "_private"],
							format: "jwk",
							dsaEncoding: "ieee-p1363"
						}).toString("hex");
						parsingLines.splice(parsingBoundEnd, 0, "// signature: " + signature);
						fileContents = parsingLines.join("\n");
					}
				}
			}
			module.files[fileID] = fileContents;
			module.backend.permissions[permissionsPrefixed + file] = { world: "rx" };
			module.backend.files[file] = fileID;
		}
	}
	if (permissionsPrefixed == "") {
		module.buildInfo = {
			for: version + args.values.branch,
			when: Date.now()
		};
	}
	return module;
}

let moduleFolders = fs.readdirSync(__dirname + "/modules").filter(a => a.endsWith(".wrk"));
for (let moduleFolder of moduleFolders) {
	fs.writeFileSync(__dirname + "/modules/" + moduleFolder.slice(0, -4), JSON.stringify(createModule(__dirname + "/modules/" + moduleFolder)));
}