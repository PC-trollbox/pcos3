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
	"keys", "bootable", "core", "locale-en", "locale-ru", "pcos-icons", "pcos-sounds", "pcos-wallpapers", "tweetnacl", "xterm", "installer",
	"sysadmin", "terminal-disks", "terminal-network", "terminal-users", "terminal", "blogBrowser", "calculator", "crypto-tools", "multimedia",
	"installer-modules" /* Must be present! */
];
let specialOrdering = { // keys must always be the first module loaded.
	"keys": 0
};
let criticalModules = [ "bootable", "core", "keys", "tweetnacl", "sysadmin", "terminal" ];
let archivedModules = [
	"keys", "bootable", "core", "locale-en", "locale-ru", "pcos-icons", "pcos-sounds", "pcos-wallpapers", "tweetnacl", "xterm", "installer",
	"sysadmin", "terminal-disks", "terminal-network", "terminal-users", "terminal", "blogBrowser", "calculator", "crypto-tools", "legacy-terminal",
	"arcadeBreakout", "multimedia"
];
let moduleFriendlyNames = {
	"arcadeBreakout": "lrn:BREAKOUT_MODULE_NAME",
	"blogBrowser": "lrn:BLOG_BROWSER_NAME",
	"bootable": "lrn:BOOTABLE_MODULE_NAME",
	"calculator": "lrn:CALC_TITLE",
	"core": "lrn:CORE_MODULE_NAME",
	"crypto-tools": "lrn:CRYPTO_TOOLS_TITLE",
	"diff": "lrn:DIFF_MODULE_NAME",
	"installer-modules": "lrn:INSTFILES_MODULE_NAME",
	"installer": "lrn:INSTALLER_TITLE",
	"keys": "lrn:KEYS_MODULE_NAME",
	"legacy-terminal": "lrn:API_TEST_TERM",
	"locale-en": "English language support",
	"locale-ru": "Поддержка Русского языка (Russian language support)",
	"multimedia": "lrn:MULTIMEDIA_MODULE_NAME",
	"pcos-icons": "lrn:ICONS_MODULE_NAME",
	"pcos-sounds": "lrn:SOUNDS_MODULE_NAME",
	"pcos-wallpapers": "lrn:WP_MODULE_NAME",
	"sysadmin": "lrn:SYSADMIN_TOOLS_TITLE",
	"terminal-disks": "lrn:TERMDISK_MODULE_NAME",
	"terminal-network": "lrn:TERMNET_MODULE_NAME",
	"terminal-users": "lrn:TERMUSER_MODULE_NAME",
	"terminal": "lrn:REAL_TERMINAL_NAME",
	"tweetnacl": "lrn:TWNACL_MODULE_NAME",
	"xterm": "lrn:XTERM_MODULE_NAME"
}
let getModuleOrder = module => specialOrdering[module]?.toString().padStart(2, "0") || "50";
let keypair;
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
fs.writeFileSync(__dirname + "/modules/bootable.fs.wrk/boot/00-pcos.js", pcosHeader);
let moduleConfig = {};
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
						let signature = crypto.sign(undefined, fileContents, {
							key: keypair[signer + "_private"],
							format: "jwk"
						}).toString("hex");
						parsingLines.splice(parsingBoundEnd, 0, "// signature: " + signature);
						fileContents = parsingLines.join("\n");
					}
				}
			} else if (file == "00-pcosksk.js" && fileContents.includes("// Key signing key")) { // Inserting KSK
				fileContents = fileContents.replace('{stub:"present"}', JSON.stringify(keypair.ksk));
			} else if (file.endsWith(".khrl")) {
				fileContents = fileContents.replaceAll("\r", "").split("\n").filter(a => a && !a.startsWith("#")).map(function(a) {
					a = a.trim();
					if (a.startsWith("sha256:")) return a.slice(7);
					if (a.startsWith("jwk:")) {
						a = JSON.parse(a.slice(4));
						a = a.x;
					}
					return crypto.createHash("sha256").update(a).digest("hex");
				});
				fileContents = JSON.stringify({
					list: fileContents,
					signature: crypto.sign(undefined, JSON.stringify(fileContents), {
						key: keypair.ksk_private,
						format: "jwk"
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
		let moduleBasename = path.basename(directory.slice(0, -7));
		module.buildInfo = {
			for: version,
			version: parseInt(version),
			when: Date.now(),
			signer: "moduleSigner",
			critical: criticalModules.includes(moduleBasename),
			bootOrder: getModuleOrder(moduleBasename),
			commonName: moduleBasename,
			friendlyNameRef: moduleFriendlyNames[moduleBasename]?.startsWith("lrn:") ? moduleFriendlyNames[moduleBasename].slice(4) : undefined,
			friendlyName: moduleFriendlyNames[moduleBasename]?.startsWith("lrn:") ? undefined : moduleFriendlyNames[moduleBasename]
		};
		let signingKey = keypair.moduleSigner_private;
		if (path.basename(directory) == "keys.fs.wrk") {
			signingKey = keypair.ksk_private;
			delete module.buildInfo.signer;
		}
		module.buildInfo.signature = crypto.sign(undefined, JSON.stringify(module), {
			key: signingKey,
			format: "jwk",
		}).toString("hex");
		moduleConfig[moduleBasename] = module.buildInfo;
	}
	return module;
}

let moduleFolders = fs.readdirSync(__dirname + "/modules").filter(a => a.endsWith(".wrk"));
for (let moduleFolder of moduleFolders)
	fs.writeFileSync(__dirname + "/modules/" + getModuleOrder(moduleFolder.slice(0, -7)) + "-" + moduleFolder.slice(0, -4), JSON.stringify(createModule(__dirname + "/modules/" + moduleFolder)));
fs.mkdirSync(__dirname + "/../history/build" + version, {
	recursive: true
});
for (let archivedModule of archivedModules) {
	if (installerModules.includes(archivedModule) && !args.values["only-modules"]) continue;
	fs.copyFileSync(__dirname + "/modules/" + getModuleOrder(archivedModule) + "-" + archivedModule + ".fs",
		__dirname + "/../history/build" + version + "/" + getModuleOrder(archivedModule) + "-" + archivedModule + ".fs");
}
if (args.values["only-modules"]) return process.exit();

let installerCode = "// This is a generated file. Please modify the corresponding files, not this file directly.\n" +
	"// (c) Copyright 2025 PCsoft. MIT license: https://spdx.org/licenses/MIT.html\n";
let installerModuleBundle = JSON.stringify(Object.fromEntries(installerModules.map(a => getModuleOrder(a) + "-" + a + ".fs").map(a => [
	a, JSON.parse(fs.readFileSync(__dirname + "/modules/" + a).toString())
])));
installerCode += "let installerModuleBundle = " + installerModuleBundle + ";\n";
installerCode += `coreExports.tty_bios_api.println("Booting from module bundle");
let entireBoot = [];
const AsyncFunction = (async () => {}).constructor;
for (let installerModule in installerModuleBundle) {
	let reviewingModule = installerModuleBundle[installerModule];
	if (reviewingModule.backend.files.boot) {
		for (let bootFile in reviewingModule.backend.files.boot) {
			entireBoot.push([ bootFile, reviewingModule.files[reviewingModule.backend.files.boot[bootFile]] ]);
		}
	}
}
entireBoot.push(["01-fsmodule-pre.js", 'modules.fs.mounts[".installer"]=modules.mounts.ramMount({});modules.defaultSystem=".installer";modules.fs.mkdir(".installer/modules");modules.fs.mkdir(".installer/etc");let networkDefaultURL=new URL(location.origin);networkDefaultURL.protocol="ws"+(networkDefaultURL.protocol=="https:"?"s":"")+":";networkDefaultURL.pathname="";modules.fs.write(".installer/etc/network.json",JSON.stringify({url:networkDefaultURL.toString(),ucBits:1,updates:"pcosserver.pc"}));']);
entireBoot.push(["01-fsmodule-start.js", 'let installerModuleBundle = ' + JSON.stringify(installerModuleBundle) + '; for (let installerModule in installerModuleBundle) { await modules.fs.write(".installer/modules/" + installerModule, JSON.stringify(installerModuleBundle[installerModule])); }; modules.fs.write(".installer/etc/moduleConfig.json", JSON.stringify({ local: Object.fromEntries(Object.entries(installerModuleBundle).map(a => [a[0].split("-").slice(1).join("-").split(".").slice(0, -1).join("."), a[1].buildInfo])) }));']);
entireBoot = entireBoot.sort((a, b) => a[0].localeCompare(b[0])).map(a => a[1]).join("\\n");
return new AsyncFunction(entireBoot)();`
fs.writeFileSync(args.values.output, installerCode);
fs.writeFileSync(__dirname + "/modules/moduleConfig.json", JSON.stringify(moduleConfig));
fs.copyFileSync(args.values.output, __dirname + "/../history/build" + version + "/installerImage.js");