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
let installerModules = [ // List of modules included in the installer
	"keys", "bootable", "core", "locale-en", "locale-ru", "pcos-icons", "pcos-sounds", "pcos-wallpapers", "diff", "tweetnacl", "xterm", "installer",
	"sysadmin", "terminal-disks", "terminal-network", "terminal-users", "terminal", "blogBrowser", "calculator", "crypto-tools", "multimedia",
	"installer-modules" /* Must be present! */
];
let specialOrdering = { // keys must always be the first module loaded.
	"keys": 0
};
let criticalModules = [ "bootable", "core", "keys", "tweetnacl", "sysadmin", "terminal" ];
let archivedModules = [
	"keys", "bootable", "core", "locale-en", "locale-ru", "pcos-icons", "pcos-sounds", "pcos-wallpapers", "diff", "tweetnacl", "xterm", "installer",
	"sysadmin", "terminal-disks", "terminal-network", "terminal-users", "terminal", "blogBrowser", "calculator", "crypto-tools", "legacy-terminal",
	"multimedia"
];
let getModuleOrder = module => specialOrdering[module]?.toString().padStart(2, "0") || "50";
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
			let fileBuffer = fs.readFileSync(directory + "/" + file);
			let fileContents = fileBuffer.toString();
			let fileID = crypto.randomBytes(64).toString("hex");
			let extension = path.extname(file).slice(1);
			if (ext2mime.hasOwnProperty(extension)) {
				let mime = ext2mime[extension];
				let newExt = mimeBase2pcos[mime.split("/")[0]];
				fileContents = "data:" + mime + ";base64," + fileBuffer.toString("base64");
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
			} else if (file == "01-fsmodule-pre.js" && fileContents.includes("// @auto-generated-installer-module-insertion")) { // Inserting installer modules
				fileContents += "\n";
				let modulesToDo = [ ...installerModules ];
				if (modulesToDo.includes("installer-modules"))
					modulesToDo.splice(modulesToDo.indexOf("installer-modules"), 1);
				for (let module of modulesToDo) {
					fileContents += "// modules/" + getModuleOrder(module) + "-" + module + ".fs\n";
					fileContents += "modules.fs.write(" + JSON.stringify(".installer/modules/" + getModuleOrder(module) + "-" + module + ".fs") + ", " + JSON.stringify(fs.readFileSync(__dirname + "/modules/" + getModuleOrder(module) + "-" + module + ".fs").toString()) + ");\n";
				}
			} else if (file == "00-pcosksk.js" && fileContents.includes("// Key signing key")) { // Inserting KSK
				fileContents = fileContents.replace('{stub:"present"}', JSON.stringify(keypair.ksk));
			} else if (file.endsWith(".khrl")) {
				fileContents = fileContents.replaceAll("\r", "").split("\n").filter(a => a && !a.startsWith("#")).map(function(a) {
					a = a.trim();
					if (a.startsWith("sha256:")) return a.slice(7);
					if (a.startsWith("jwk:")) {
						a = JSON.parse(a.slice(4));
						a = a.x + "|" + a.y;
					}
					return crypto.createHash("sha256").update(a).digest("hex");
				});
				fileContents = JSON.stringify({
					list: fileContents,
					signature: crypto.sign("sha256", JSON.stringify(fileContents), {
						key: keypair.ksk_private,
						format: "jwk",
						dsaEncoding: "ieee-p1363"
					}).toString("hex")
				});
			}
			module.files[fileID] = fileContents;
			module.backend.permissions[permissionsPrefixed + file] = { world: "rx" };
			module.backend.files[file] = fileID;
		}
	}
	module.backend.permissions[permissionsPrefixed] = { world: "rx" };
	if (permissionsPrefixed == "") {
		module.buildInfo = {
			for: version,
			when: Date.now(),
			signer: "moduleSigner",
			critical: criticalModules.includes(path.basename(directory.slice(0, -7)))
		};
		let signingKey = keypair.moduleTrust_private;
		if (path.basename(directory) == "keys.fs.wrk") {
			signingKey = keypair.ksk_private;
			delete module.buildInfo.signer;
		}
		module.buildInfo.signature = crypto.sign("sha256", JSON.stringify(module), {
			key: signingKey,
			format: "jwk",
			dsaEncoding: "ieee-p1363",
		}).toString("hex");
	}
	return module;
}
function getBootInModule(module) {
	let moduleFiles = JSON.parse(fs.readFileSync(__dirname + "/modules/" + module).toString());
	let boot = [];
	if (!moduleFiles.backend.files.boot) return [];
	for (let bootFile in moduleFiles.backend.files.boot)
		boot.push([ bootFile, moduleFiles.files[moduleFiles.backend.files.boot[bootFile]] ]);
	return boot;
}

let moduleFolders = fs.readdirSync(__dirname + "/modules").filter(a => a.endsWith(".wrk"));
let installerModulesPresent = moduleFolders.includes("installer-modules.fs.wrk");
if (installerModulesPresent) moduleFolders.splice(moduleFolders.indexOf("installer-modules.fs.wrk"), 1);
for (let moduleFolder of moduleFolders)
	fs.writeFileSync(__dirname + "/modules/" + getModuleOrder(moduleFolder.slice(0, -7)) + "-" + moduleFolder.slice(0, -4), JSON.stringify(createModule(__dirname + "/modules/" + moduleFolder)));
fs.mkdirSync(__dirname + "/../history/build" + version, {
	recursive: true
});
for (let archivedModule of archivedModules) {
	fs.copyFileSync(__dirname + "/modules/" + getModuleOrder(archivedModule) + "-" + archivedModule + ".fs",
		__dirname + "/../history/build" + version + "/" + getModuleOrder(archivedModule) + "-" + archivedModule + ".fs");
}
if (args.values["only-modules"]) return process.exit();
if (installerModulesPresent)
	fs.writeFileSync(__dirname + "/modules/" + getModuleOrder("installer-modules") + "-installer-modules.fs", JSON.stringify(createModule(__dirname + "/modules/installer-modules.fs.wrk")));
let entireBoot = [];
for (let installerModule of installerModules) entireBoot.push(...getBootInModule(getModuleOrder(installerModule) + "-" + installerModule + ".fs"));
let installerCode = "// This is a generated file. Please modify the corresponding files, not this file directly.\n" +
	"// (c) Copyright 2025 PCsoft. MIT license: https://spdx.org/licenses/MIT.html\n";
entireBoot = entireBoot.sort((a, b) => a[0].localeCompare(b[0]));
entireBoot = entireBoot.map(a => "// modules/.../boot/" + a[0] + "\n" + a[1]).join("\n");
installerCode += entireBoot;
fs.writeFileSync(args.values.output, installerCode);
fs.rmSync(__dirname + "/modules/50-installer-modules.fs");
fs.copyFileSync(args.values.output, __dirname + "/../history/build" + version + "/installerImage.js");