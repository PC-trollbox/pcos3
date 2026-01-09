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
let fullInputFile = fs.readFileSync(args.values.input).toString().split("\n");
let input = fullInputFile[2];
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
` + fullInputFile.slice(3).join("\n"));
