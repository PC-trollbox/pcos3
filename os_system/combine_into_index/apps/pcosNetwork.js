// =====BEGIN MANIFEST=====
// link: lrn:NETCONFIG_TITLE
// signer: automaticSigner
// fnName: networkInstaller
// allow: IDENTIFY_SYSTEM, CSP_OPERATIONS, FS_READ, FS_WRITE, FS_LIST_PARTITIONS, GET_LOCALE, GET_SERVER_URL, LIST_TASKS, GET_THEME, FS_BYPASS_PERMISSIONS
// =====END MANIFEST=====
(async function() {
    // @pcos-app-mode isolatable
    await availableAPIs.windowTitleSet(await availableAPIs.lookupLocale("NETCONFIG_TITLE") || "PCOS Network configurator");
    let privileges = await availableAPIs.getPrivileges();
    let checklist = [ "IDENTIFY_SYSTEM", "CSP_OPERATIONS", "FS_READ", "FS_WRITE", "FS_LIST_PARTITIONS", "GET_LOCALE", "GET_SERVER_URL", "LIST_TASKS" ];
    document.body.style.fontFamily = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
    try {
        if (await availableAPIs.isDarkThemed()) document.body.style.color = "white";
    } catch {}
    if (!checklist.every(p => privileges.includes(p))) {
        document.body.innerText = await availableAPIs.lookupLocale("NETCONFIG_DENY") || "Insufficient privileges.";
        return;
    }
    let existingConfig = {};
    try {
        existingConfig = JSON.parse(await availableAPIs.fs_read({
            path: (await availableAPIs.getSystemMount()) + "/etc/network.json"
        }));
    } catch {}
    let descriptionNetworkURL = document.createElement("span");
    let paramNetworkURL = document.createElement("input");
    let ucBits = document.createElement("input");
    let descriptionStartOnStartup = document.createElement("label");
    let paramStartOnStartup = document.createElement("input");
    let saveBtn = document.createElement("button");
    let updatePredictBtn = document.createElement("button");
    let addressPrediction = document.createElement("span");
    let form = document.createElement("form");
    let originUrl = new URL(await availableAPIs.runningServer());
    originUrl.protocol = "ws" + (originUrl.protocol == "https:" ? "s" : "") + ":";
    descriptionNetworkURL.innerText = await availableAPIs.lookupLocale("NETCONFIG_URLF");
    paramNetworkURL.value = existingConfig.url || originUrl.origin;
    descriptionStartOnStartup.innerText = await availableAPIs.lookupLocale("NETCONFIG_AUTO");
    paramStartOnStartup.type = "checkbox";
    paramStartOnStartup.checked = existingConfig.startOnStartup;
    paramStartOnStartup.id = "startOnStartup";
    descriptionStartOnStartup.setAttribute("for", "startOnStartup");
    ucBits.placeholder = await availableAPIs.lookupLocale("NETCONFIG_UC");
    ucBits.type = "number";
    ucBits.min = 0;
    ucBits.max = 4294967295;
    ucBits.value = existingConfig.ucBits;
    saveBtn.innerText = await availableAPIs.lookupLocale("NETCONFIG_SAVE");
    updatePredictBtn.innerText = await availableAPIs.lookupLocale("NETCONFIG_PREDICT");
    form.appendChild(descriptionNetworkURL);
    form.appendChild(paramNetworkURL);
    form.appendChild(document.createElement("br"));
    form.appendChild(ucBits);
    form.appendChild(document.createElement("br"));
    form.appendChild(paramStartOnStartup);
    form.appendChild(descriptionStartOnStartup);
    form.appendChild(document.createElement("br"));
    form.appendChild(saveBtn);
    form.appendChild(updatePredictBtn);
    addressPrediction.innerText = await availableAPIs.lookupLocale("EMPTY_STATUSBAR");
    document.body.appendChild(form);
    document.body.appendChild(document.createElement("hr"));
    document.body.appendChild(addressPrediction);
    saveBtn.addEventListener("click", async function(e) {
        e.preventDefault();
        try {
            await availableAPIs.fs_write({
                path: (await availableAPIs.getSystemMount()) + "/etc/network.json",
                data: JSON.stringify({
                    url: paramNetworkURL.value,
                    startOnStartup: paramStartOnStartup.checked,
                    ucBits: Math.round(Math.abs(Number(ucBits.value)))
                }, null, "\t")
            });
            try {
                await availableAPIs.fs_mkdir({
                    path: (await availableAPIs.getSystemMount()) + "/apps/services"
                })
            } catch {}
            await availableAPIs.fs_write({
                path: (await availableAPIs.getSystemMount()) + "/apps/services/networkd.lnk",
                data: JSON.stringify({
                    path: (await availableAPIs.getSystemMount()) + "/apps/networkd.js",
                    args: [],
                    name: "PCOS Network",
                    disabled: !paramStartOnStartup.checked
                }, null, "\t")
            });
            addressPrediction.innerText = await availableAPIs.lookupLocale("NETCONFIG_SAVE_OK");
        } catch {
            addressPrediction.innerText = await availableAPIs.lookupLocale("NETCONFIG_SAVE_FAIL");
        }
    });
    updatePredictBtn.addEventListener("click", function(e) {
        e.preventDefault();
        updatePrediction({ addressPrediction, ucBits });
    });
})();
function findInputNumberString(output, chars) {
    let inputNum = 0n;
    for (let i = 0n; i < output.length; i++) {
        const charIndex = chars.indexOf(output[i]);
        if (charIndex === -1) throw new Error(`Invalid character '${output[i]}' in output string`);
        inputNum = inputNum * BigInt(chars.length) + BigInt(charIndex);
    }
    return inputNum;
}
function generateString(num, chars) {
    let base = BigInt(chars.length), result = '';
    while (num > 0n) result = chars[Number(num % base)] + result, num /= base;
    return result;
}

async function updatePrediction(elementInterface) {
    let publicSystemID = await availableAPIs.getPublicSystemID();
    if (!publicSystemID) return elementInterface.addressPrediction.innerText = await availableAPIs.lookupLocale("NETCONFIG_SYSIDM");
    let sysIDx = u8aToHex(new Uint8Array(await availableAPIs.cspOperation({
        cspProvider: "basic",
        operation: "digest",
        cspArgument: {
            algorithm: "SHA-256",
            data: hexToU8A(generateString(findInputNumberString(publicSystemID.x, base64Charset), hexCharset))
        }
    }))).padStart(8, "0").slice(0, 8);
    let sysIDy = u8aToHex(new Uint8Array(await availableAPIs.cspOperation({
        cspProvider: "basic",
        operation: "digest",
        cspArgument: {
            algorithm: "SHA-256",
            data: hexToU8A(generateString(findInputNumberString(publicSystemID.y, base64Charset), hexCharset))
        }
    }))).padStart(8, "0").slice(0, 8);
    let ucPredict = Math.round(Math.abs(Number(elementInterface.ucBits.value))).toString(16).padStart(8, "0").slice(0, 8);
    return elementInterface.addressPrediction.innerText = ("xxxxxxxx" + sysIDx + sysIDy + ucPredict).match(/.{1,4}/g).join(":");
}
let hexToU8A = (hex) => Uint8Array.from(hex.match(/.{1,2}/g).map(a => parseInt(a, 16)));
let u8aToHex = (u8a) => Array.from(u8a).map(a => a.toString(16).padStart(2, "0")).join("");
let base64Charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
let hexCharset = "0123456789abcdef";
addEventListener("signal", async function(e) {
    if (e.detail == 15) await window.availableAPIs.terminate();
}); null;