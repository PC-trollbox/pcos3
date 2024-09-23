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
try {
    keypair = JSON.parse(fs.readFileSync(__dirname + "/../keypair.json"));
} catch {
    console.error("no keypair.json file found, run node ../keypair.js");
    process.exit(1);
}
let pcosHeader = fs.readFileSync(__dirname + "/krnl_codes/00-pcos.js").toString().split("\n");
let version = pcosHeader[1].match(/\d+/)[0];
version = parseInt(version);
if (!args.values["no-increment"]) version++;
version = version + args.values.branch;
pcosHeader[1] = "const pcos_version = " + JSON.stringify(version) + ";";
pcosHeader = pcosHeader.join("\n");
if (!args.values["no-increment"]) fs.writeFileSync(__dirname + "/krnl_codes/00-pcos.js", pcosHeader);
let newBuild = "// This is a generated file. Please modify the corresponding files, not this file directly.\n";
newBuild += "// (c) Copyright 2024 PCsoft. MIT license: https://spdx.org/licenses/MIT.html\n";
let appFiles = fs.readdirSync(__dirname + "/apps");
let buildFiles = fs.readdirSync(__dirname + "/krnl_codes");
let appFns = [];
for (let buildFile of buildFiles) {
    if (buildFile == path.basename(__filename)) continue;
    if (buildFile.startsWith("out")) continue;
    newBuild += "\n// " + path.basename(buildFile) + "\n";
    if (buildFile == "00-pcos.js") {
        newBuild += pcosHeader;
        continue;
    }
    let bfc = fs.readFileSync(__dirname + "/krnl_codes/" + buildFile).toString();
    if (buildFile == "06-ksk.js") {
        delete keypair.ksk.d;
        if (keypair) bfc = bfc.replace("{stub:\"present\"}", JSON.stringify(keypair.ksk));
    }
    if (buildFile == "15-apps.js") {
        let sharedAS = structuredClone(keypair.automaticSigner);
        delete sharedAS.key.d;
        appFns.push("keypairInstaller");
        bfc = bfc + `
        // dynamically inserted
        async function keypairInstaller(target, token) {
            let neededEtc = await modules.fs.ls(target + "/");
            if (!neededEtc.includes("etc")) await modules.fs.mkdir(target + "/etc");
            await modules.fs.chown(target + "/etc", "root");
            await modules.fs.chgrp(target + "/etc", "root");
            await modules.fs.chmod(target + "/etc", "rx");
            let neededEtcKeys = await modules.fs.ls(target + "/etc/");
            if (!neededEtcKeys.includes("keys")) await modules.fs.mkdir(target + "/etc/keys");
            await modules.fs.chown(target + "/etc/keys", "root");
            await modules.fs.chgrp(target + "/etc/keys", "root");
            await modules.fs.chmod(target + "/etc/keys", "rx");
            await modules.fs.write(target + "/etc/keys/automaticSigner", JSON.stringify(${JSON.stringify(sharedAS)}));
            await modules.fs.chown(target + "/etc/keys/automaticSigner", "root");
            await modules.fs.chgrp(target + "/etc/keys/automaticSigner", "root");
            await modules.fs.chmod(target + "/etc/keys/automaticSigner", "rx");
            let neededEtcKeysKsrl = await modules.fs.ls(target + "/etc/keys");
            if (!neededEtcKeysKsrl.includes("ksrl")) await modules.fs.mkdir(target + "/etc/keys/ksrl");
            await modules.fs.chown(target + "/etc/keys/ksrl", "root");
            await modules.fs.chgrp(target + "/etc/keys/ksrl", "root");
            await modules.fs.chmod(target + "/etc/keys/ksrl", "rx");
        }
        `;
        for (let appFile of appFiles) {
            let app = fs.readFileSync(__dirname + "/apps/" + appFile).toString();
            let appName = appFile.split(".");
            appName.splice(appName.lastIndexOf("js"), 1);
            appName = appName.join(".");
            let manifestStats = [];
            let signature = crypto.sign("sha256", app, {
                key: keypair.automaticSigner.key,
                format: "jwk",
                dsaEncoding: "ieee-p1363"
            }).toString("hex");
            if (app.includes("// =====BEGIN MANIFEST=====")) {
                let parsingLines = app.split("\n");
                let parsingBoundStart = parsingLines.indexOf("// =====BEGIN MANIFEST=====");
                let parsingBoundEnd = parsingLines.indexOf("// =====END MANIFEST=====");
                let upToParse = parsingLines.slice(parsingBoundStart + 1, parsingBoundEnd);
                for (let line of upToParse) {
                    let lineType = line.split(": ")[0].replace("// ", "");
                    let lineData = line.replace("// " + lineType + ": ", "");
                    let dataParts = lineData.split(", ");
                    for (let data of dataParts) manifestStats.push({ lineType, data });
                }
                parsingLines.splice(parsingBoundStart + 1, 0, "// signature: " + signature);
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
                await modules.fs.chown(target + "/apps", "root", token);
                await modules.fs.chgrp(target + "/apps", "root", token);
                await modules.fs.chmod(target + "/apps", "rx", token);
                let neededAppsLinks = await modules.fs.ls(target + "/apps", token);
                if (!neededAppsLinks.includes("links")) await modules.fs.mkdir(target + "/apps/links", token);
                await modules.fs.chown(target + "/apps/links", "root", token);
                await modules.fs.chgrp(target + "/apps/links", "root", token);
                await modules.fs.chmod(target + "/apps/links", "rx", token);
                let neededAppsAssocs = await modules.fs.ls(target + "/apps", token);
                if (!neededAppsAssocs.includes("associations")) await modules.fs.mkdir(target + "/apps/associations", token);
                await modules.fs.chown(target + "/apps/associations", "root", token);
                await modules.fs.chgrp(target + "/apps/associations", "root", token);
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
                    await modules.fs.chown(linkPath, "root", token);
                    await modules.fs.chgrp(linkPath, "root", token);
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
                    await modules.fs.chown(target + "/apps/associations/" + assoc, "root", token);
                    await modules.fs.chgrp(target + "/apps/associations/" + assoc, "root", token);
                    await modules.fs.chmod(target + "/apps/associations/" + assoc, "rx", token);
                }
                await modules.fs.write(appPath, ${JSON.stringify(app)}, token);
                await modules.fs.chown(appPath, "root", token);
                await modules.fs.chgrp(appPath, "root", token);
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