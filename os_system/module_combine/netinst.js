const fs = require("fs");
const util = require("util");
const args = util.parseArgs({
	strict: false,
	allowPositionals: true,
	options: {
		"input": {
			type: "string",
			short: "i",
			default: __dirname + "/../index.js"
		},
		"output": {
			type: "string",
			short: "i",
			default: __dirname + "/../netinst.js"
		}
	}
});
let input = fs.readFileSync(args.values.input).toString().split("\n")[2];
input = input.slice(28, input.length - 1);
console.log("Parsing", input.length, "characters of data");
let sizeReducionCharCounterA = input.length;
input = Object.entries(JSON.parse(input));
console.log("Loaded", input.length, "modules");
let sizeReducionModuleCounterA = input.length;
let versions = [];
input.map(a => versions.push(a[1].buildInfo.for));
versions = new Set(versions);
if (versions.size > 1) console.warn("Mixed targets!", versions);
console.log("Making netinst for PCOS 3 build", versions.size == 1 ? [ ...versions ][0] : versions);
let netinst = [
	"00-keys.fs", "50-bootable.fs", "50-core.fs", "50-installer-modules.fs", "50-installer.fs", "50-locale-en.fs", "50-locale-ru.fs",
	"50-pcos-wallpapers.fs"
];
input = input.filter(a => netinst.includes(a[0]));
let sizeReducionModuleCounterB = input.length;
console.log(sizeReducionModuleCounterA - sizeReducionModuleCounterB, "modules were removed");
input = JSON.stringify(Object.fromEntries(input));
let sizeReducionCharCounterB = input.length;
console.log(sizeReducionCharCounterA - sizeReducionCharCounterB, "characters were reduced");
fs.writeFileSync(args.values.output, `// This is a generated file after netinst transform. Please modify the corresponding files, not this file directly.
// (c) Copyright 2025 PCsoft. MIT license: https://spdx.org/licenses/MIT.html
let installerModuleBundle = ${input};
coreExports.tty_bios_api.println("Booting from module bundle");
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
return new AsyncFunction(entireBoot)();`)