const AsyncFunction = (async () => {}).constructor;
let disk = coreExports.disk;
let tty_bios_api = coreExports.tty_bios_api;
let secureBoot = false;
let bootSelection = disk.partition("bootSelection").getData();
let keyList, keyListKey;
let distrustedKeys = 0;
let hexToU8A = (hex) => Uint8Array.from(hex.match(/.{1,2}/g).map(a => parseInt(a, 16)));
let u8aToHex = (u8a) => Array.from(u8a).map(a => a.toString(16).padStart(2, "0")).join("");
if (secureBoot) {
    keyList = disk.partition("signingKeyList").getData();
    keyListKey = await crypto.subtle.importKey("jwk", {
        kty: 'EC',
        x: 'replaced',
        y: 'replaced',
        crv: 'P-256'
    }, {
        name: "ECDSA",
        namedCurve: "P-256"
    }, false, ["verify"]);
    for (let key in keyList) {
        try {
            crypto.subtle.sign()
            if (!await crypto.subtle.verify({
                name: "ECDSA",
                hash: {
                    name: "SHA-256"
                }
            }, keyListKey, hexToU8A(keyList[key].signature), new TextEncoder().encode(JSON.stringify(keyList[key].key)))) throw new Error("unverified");
            keyList[key].key = await crypto.subtle.importKey("jwk", keyList[key].key, {
                name: "ECDSA",
                namedCurve: "P-256"
            }, false, ["verify"]);
        } catch {
            tty_bios_api.println("Key " + keyList[key].describe + " is unverified, distrusting.");
            keyList[key] = { distrust: true };
            distrustedKeys++;
        }
    }
}
let selectedIndex = 0;
function displayOptions() {
    tty_bios_api.clear();
    tty_bios_api.println("PCsoft Bootloader");
    tty_bios_api.println("Select a system to boot:");
    for (let sel in bootSelection) tty_bios_api.println((selectedIndex == sel ? "*" : " ") + " " + bootSelection[sel].name);
    tty_bios_api.println("");
    if (secureBoot && distrustedKeys) tty_bios_api.println(" <!!!> Distrusted keys: " + distrustedKeys);
    tty_bios_api.println("Use UP and DOWN keys to select, Enter to boot.");
}

async function optionSelection() {
    while (true) {
        displayOptions();
        let keypress = await tty_bios_api.inputKey();
        if (keypress.key == "ArrowUp") {
            selectedIndex = (selectedIndex - 1 + bootSelection.length) % bootSelection.length;
        } else if (keypress.key == "ArrowDown") {
            selectedIndex = (selectedIndex + 1) % bootSelection.length;
        } else if (keypress.key == "Enter") {
            break;
        }
    }
    let selected = bootSelection[selectedIndex];
    tty_bios_api.clear();
    tty_bios_api.println("Booting OS " + selected.name);
    let os = disk.partition(selected.bootPartition).getData();
    if (secureBoot) {
        tty_bios_api.println("Verifying OS " + selected.name);
        let verified = false;
        for (let key in keyList) {
            if (keyList[key].distrust) continue;
            try {
                if (await crypto.subtle.verify({
                    name: "ECDSA",
                    hash: {
                        name: "SHA-256"
                    },
                }, keyList[key].key, hexToU8A(selected.signature), new TextEncoder().encode(os))) {
                    verified = true;
                    break;
                }
            } catch {}
        }
        if (!verified) {
            tty_bios_api.println("OS " + selected.name + " is not verified.");
            tty_bios_api.println("Press any key to return to choices.");
            await tty_bios_api.inputKey();
            return optionSelection();
        }
    }
    return new AsyncFunction(os)();
}

return optionSelection();