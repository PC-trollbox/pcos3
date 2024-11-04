let prefs = {
    read: function(key) {
        return this.backend[key];
    },
    write: function(key, value) {
        let backend = this.backend;
        backend[key] = value;
        this.backend = backend;
    },
    rm: function(key) {
        let backend = this.backend;
        delete backend[key];
        this.backend = backend;
    },
    ls: function() {
        return Object.keys(this.backend);
    },
    be_cache: JSON.parse(localStorage.getItem("runtime_prefs") || "{}"),
    get backend() {
        return this.be_cache;
    },
    set backend(value) {
        this.be_cache = value;
        localStorage.setItem("runtime_prefs", JSON.stringify(value));
    }
}

let hexToU8A = (hex) => Uint8Array.from(hex.match(/.{1,2}/g).map(a => parseInt(a, 16)));
let u8aToHex = (u8a) => Array.from(u8a).map(a => a.toString(16).padStart(2, "0")).join("");

async function pbkdf2(pass, salt) {
    return u8aToHex(new Uint8Array(await crypto.subtle.deriveBits({
        name: "PBKDF2",
        salt: hexToU8A(salt),
        iterations: 100000,
        hash: "SHA-256"
    }, await crypto.subtle.importKey("raw",
        new TextEncoder().encode(pass), {
            name: "PBKDF2"
        },
        false,
        [ "deriveBits", "deriveKey" ]
    ), 256)));
}

async function prefmgr() {
    if (prefs.read("ignore_preference_key") == true) return;
    let guardPasswords = (prefs.read("guard_passwords") || []);
    let superPassword = guardPasswords[0];
    let attempts = 0;
    while (attempts != 5 && superPassword != undefined) {
        tty_bios_api.println("Accessing the preference manager requires the superpassword.");
        tty_bios_api.print("Enter superpassword: ");
        let passwordInput = await tty_bios_api.inputLine(false, true);
        let hash = await pbkdf2(passwordInput, superPassword.salt);
        if (hash == superPassword.hash) break;
        attempts++;
    }
    if (attempts == 5) {
        tty_bios_api.println("Superpassword incorrect. Press any key to continue boot.");
        await tty_bios_api.inputKey();
        return;
    }
    while (true) {
        tty_bios_api.clear();
        tty_bios_api.println("Preference Manager");
        tty_bios_api.println(" 1. Add password (currently " + guardPasswords.length.toString() + " password(s))");
        tty_bios_api.println(" 2. Clear passwords");
        tty_bios_api.println(" 3. Insecure REE fallback: " + (prefs.read("disallow_bad_ree") ? "disallowed" : "ALLOWED"));
        tty_bios_api.println(" 4. Preference key: " + (prefs.read("ignore_preference_key") ? "ignored" : "PROCESSED"));
        tty_bios_api.println(" 5. Password on boot: " + (prefs.read("require_password_for_boot") ? "required" : "NOT REQUIRED"));
        tty_bios_api.println(" 6. Boot from network: " + (prefs.read("never_boot_from_network") ? "disallowed" : "ALLOWED"));
        tty_bios_api.println(" 7. Set boot mode: " + (coreExports.bootMode || "normal"));
        tty_bios_api.println(" 8. System ID settings");
        tty_bios_api.println(" 9. Boot from hard drive");
        tty_bios_api.println("10. Boot from default network");
        tty_bios_api.println("11. Boot from custom network");
        tty_bios_api.println("12. Set boot section: " + (coreExports.bootSection || "unset"));
        tty_bios_api.println("13. Poor man's JavaScript console");
        tty_bios_api.println("14. Install offline access");
        tty_bios_api.println("15. Remove offline access");
        tty_bios_api.println("16. Drop disk database");
        tty_bios_api.println("17. Schedule flash update");
        tty_bios_api.println("18. Load defaults");
        tty_bios_api.println("19. Restart system");
        tty_bios_api.println("20. Exit");
        tty_bios_api.println();
        tty_bios_api.print(">> ");
        let choice = await tty_bios_api.inputLine(true, true);
        if (choice >= 9 && choice <= 11) {
            tty_bios_api.print("Disk handling...\t");
            try {
                disk._cache = (await idb.read()) || "null";
                tty_bios_api.println("ready");
            } catch (e) {
                console.error("disk access:", e);
                tty_bios_api.println("failed");
            }
        }
        if (choice == "1") {
            tty_bios_api.print("New " + (guardPasswords.length == 0 ? "super" : "") + "password (not shown while entering): ");
            let passwordInput = await tty_bios_api.inputLine(false, true);
            let rng = crypto.getRandomValues(new Uint8Array(64));
            let salt = u8aToHex(rng);
            let hash = await pbkdf2(passwordInput, salt);
            guardPasswords.push({ salt, hash });
            prefs.write("guard_passwords", guardPasswords);
            tty_bios_api.println("Password added.");
        } else if (choice == "2") {
            guardPasswords = [];
            prefs.write("guard_passwords", guardPasswords);
            tty_bios_api.println("Passwords cleared.");
        } else if (choice == "3") {
            prefs.write("disallow_bad_ree", !prefs.read("disallow_bad_ree"));
            tty_bios_api.println("Insecure REE fallback " + (prefs.read("disallow_bad_ree") ? "disallowed" : "ALLOWED") + ".");
        } else if (choice == "4") {
            prefs.write("ignore_preference_key", !prefs.read("ignore_preference_key"));
            tty_bios_api.println("Preference key " + (prefs.read("ignore_preference_key") ? "ignored" : "PROCESSED") + ".");
        } else if (choice == "5") {
            prefs.write("require_password_for_boot", !prefs.read("require_password_for_boot"));
            tty_bios_api.println("Password on boot " + (prefs.read("require_password_for_boot") ? "required" : "NOT REQUIRED") + ".");
        } else if (choice == "6") {
            prefs.write("never_boot_from_network", !prefs.read("never_boot_from_network"));
            tty_bios_api.println("Boot from network " + (prefs.read("never_boot_from_network") ? "disallowed" : "ALLOWED") + ".");
        } else if (choice == "7") {
            tty_bios_api.println("Recognizable modes: normal, safe, disable-harden, readonly, logboot");
            tty_bios_api.print("Boot mode [normal]: ");
            coreExports.bootMode = await tty_bios_api.inputLine(true, true) || "normal";
            tty_bios_api.println("Boot mode set to " + coreExports.bootMode + ".");
        } else if (choice == "8") {
            await sysID();
        } else if (choice == "9") {
            tty_bios_api.print("Booting...\t");
            try {
                await new AsyncFunction(disk.partition("boot").getData())();
                tty_bios_api.println("ok");
                throw new Error("boot_success");
            } catch (e) {
                if (e.message == "boot_success") throw e;
                tty_bios_api.println("failed");
                console.error(e);
            }
        } else if (choice == "10") {
            tty_bios_api.print("Booting...\t");
            try {
                await new AsyncFunction(await ((await fetch("os.js")).text()))();
                tty_bios_api.println("ok");
                throw new Error("boot_success");
            } catch (e) {
                if (e.message == "boot_success") throw e;
                tty_bios_api.println("failed");
                console.error(e);
            }
        } else if (choice == "11") {
            tty_bios_api.print("Enter network address: ");
            let addr = await tty_bios_api.inputLine(true, true);
            tty_bios_api.print("Booting...\t");
            try {
                await new AsyncFunction(await ((await fetch(addr)).text()))();
                tty_bios_api.println("ok");
                throw new Error("boot_success");
            } catch (e) {
                if (e.message == "boot_success") throw e;
                tty_bios_api.println("failed");
                console.error(e);
            }
        } else if (choice == "12") {
            tty_bios_api.print("Boot section [unset]: ");
            coreExports.bootSection = await tty_bios_api.inputLine(true, true) || undefined;
            tty_bios_api.println("Boot section set to " + (coreExports.bootSection || "unset") + ".");
        } else if (choice == "13") {
            let code = true;
            while (code) {
                code = prompt("console");
                try {
                    prompt(JSON.stringify(eval(code)), JSON.stringify(eval(code)));
                } catch (e) {
                    prompt(e + "\n" + e.stack, e + "\n" + e.stack);
                }
            }
        } else if (choice == "14") {
            if ((await navigator.serviceWorker.getRegistrations()).length) {
                tty_bios_api.println("Please remove the previous offline installations first.");
            } else {
                tty_bios_api.print("Registering...\t");
                try {
                    await navigator.serviceWorker.register("offline.js");
                    tty_bios_api.println("done");
                } catch (e) {
                    console.error(e);
                    tty_bios_api.println("failed");
                }
            }
        } else if (choice == "15") {
            let regs = await navigator.serviceWorker.getRegistrations();
            if (!regs.length) {
                tty_bios_api.println("No other installations active.");
            } else {
                tty_bios_api.print("Unregistering...\t");
                try {
                    await Promise.all(regs.map(a => a.unregister()));
                    tty_bios_api.println("done");
                } catch (e) {
                    console.error(e);
                    tty_bios_api.println("failed");
                }
            }
        } else if (choice == "16") {
            tty_bios_api.print("Are you sure? (y/n) ");
            if ((await tty_bios_api.inputLine(true, true)).toLowerCase() == "y") {
                idb._db = null;
                idb._transactionCompleteEvent = [];
                await new Promise(function(resolve) {
                    let awaiting = indexedDB.deleteDatabase("disk");
                    awaiting.onsuccess = resolve;
                });
                tty_bios_api.println("Disk wiped.");
            } else {
                tty_bios_api.println("Aborted.");
            }
        } else if (choice == "17") {
            tty_bios_api.print("Are you sure? (y/n) ");
            if ((await tty_bios_api.inputLine(true, true)).toLowerCase() == "y") {
                localStorage.removeItem("runtime_flash");
                tty_bios_api.println("Runtime flash update scheduled.");
            } else {
                tty_bios_api.println("Aborted.");
            }
        } else if (choice == "18") {
            localStorage.removeItem("runtime_prefs");
            tty_bios_api.println("Defaults loaded.");
        } else if (choice == "19") {
            tty_bios_api.println("Please wait.");
            location.reload();
            throw new Error("reboot");
        } else if (choice == "20") {
            break;
        } else {
            tty_bios_api.println("Invalid choice.");
        }
        tty_bios_api.println("Press any key to proceed.");
        await tty_bios_api.inputKey();
    }
}

async function sysID() {
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
    let base64Charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
    let printableChars = new Array(94).fill("").map((_, i) => String.fromCharCode(33 + i)).join("");
    let incompletePrintable = printableChars.replace("|", "");
    let hexCharset = "0123456789abcdef";
    while (true) {
        tty_bios_api.clear();
        tty_bios_api.println("PCsoft System ID");
        tty_bios_api.println("1. Remove System ID");
        tty_bios_api.println("2. Reset System ID");
        tty_bios_api.println("3. Show public System ID");
        tty_bios_api.println("4. Show private System ID");
        tty_bios_api.println("5. Import System ID");
        tty_bios_api.println("6. Verify System ID consistency");
        tty_bios_api.println("7. Back");
        tty_bios_api.println("");
        tty_bios_api.print(">> ");
        let choice = await tty_bios_api.inputLine(true, true);
        if (choice == "1") {
            prefs.write("system_id", undefined);
            tty_bios_api.println("The System ID was successfully removed.");
        } else if (choice == "2") {
            let generatedKey = await crypto.subtle.generateKey({
                name: "ECDSA",
                namedCurve: "P-256"
            }, true, ["sign", "verify"]);
            let exportedPrivateKey = await crypto.subtle.exportKey("jwk", generatedKey.privateKey);
            let exportedPublicKey = await crypto.subtle.exportKey("jwk", generatedKey.publicKey);
            prefs.write("system_id", {
                public: exportedPublicKey,
                private: exportedPrivateKey
            });
            tty_bios_api.println("The System ID was successfully (re)generated.");
        } else if (choice == "3") {
            if (!prefs.read("system_id")) {
                tty_bios_api.println("No System ID found.");
                tty_bios_api.println("Press any key to proceed.");
                await tty_bios_api.inputKey();
                continue;
            }
            let publicJWK = prefs.read("system_id").public;
            tty_bios_api.println("Public System ID:");
            tty_bios_api.println(JSON.stringify(publicJWK, null, "\t"));
            tty_bios_api.println("");
            tty_bios_api.println("Password-like ID:");
            tty_bios_api.println(generateString(findInputNumberString(publicJWK.x, base64Charset), printableChars) + generateString(findInputNumberString(publicJWK.y, base64Charset), printableChars));
            tty_bios_api.println("");
            tty_bios_api.println("IPv6-like ID:");
            tty_bios_api.println((generateString(findInputNumberString(publicJWK.x, base64Charset), hexCharset).slice(0, 16) + generateString(findInputNumberString(publicJWK.y, base64Charset), hexCharset).slice(0, 16)).match(/.{1,4}/g).join(":"));
        } else if (choice == "4") {
            if (!prefs.read("system_id")) {
                tty_bios_api.println("No System ID found.");
                tty_bios_api.println("Press any key to proceed.");
                await tty_bios_api.inputKey();
                continue;
            }
            let privateJWK = prefs.read("system_id").private;
            tty_bios_api.println("Private System ID:");
            tty_bios_api.println(JSON.stringify(privateJWK, null, "\t"));
            tty_bios_api.println("");
            tty_bios_api.println("System ID Formatting: (use this to import)");
            tty_bios_api.println(generateString(findInputNumberString(privateJWK.d, base64Charset), incompletePrintable) + "|" + generateString(findInputNumberString(privateJWK.x, base64Charset), incompletePrintable) + "|" + generateString(findInputNumberString(privateJWK.y, base64Charset), incompletePrintable));
        } else if (choice == "5") {
            tty_bios_api.println("On the source system, select \"Show private System ID\" for the System ID Formatting.");
            tty_bios_api.print("Enter the Formatting now: ");
            let formatting = await tty_bios_api.inputLine(true, true);
            let formattingSplit = formatting.split("|");
            if (formattingSplit.length == 3) {
                let privateJWK = {
                    d: generateString(findInputNumberString(formattingSplit[0], incompletePrintable), base64Charset),
                    x: generateString(findInputNumberString(formattingSplit[1], incompletePrintable), base64Charset),
                    y: generateString(findInputNumberString(formattingSplit[2], incompletePrintable), base64Charset),
                    alg: "ES256",
                    crv: "P-256",
                    kty: "EC",
                    ext: true,
                    key_ops: ["sign"]
                };
                let publicJWK = JSON.parse(JSON.stringify(privateJWK));
                delete publicJWK.d;
                publicJWK.key_ops = ["verify"];
                prefs.write("system_id", {
                    public: publicJWK,
                    private: privateJWK
                });
                tty_bios_api.println("The System ID was successfully imported!");
            } else {
                tty_bios_api.println("Invalid formatting for the System ID.");
            }
        } else if (choice == "6") {
            let publicKey, privateKey;
            let state = "public key";
            try {
                let publicJWK = prefs.read("system_id").public;
                let privateJWK = prefs.read("system_id").private;
                publicKey = await crypto.subtle.importKey("jwk", publicJWK, {
                    name: "ECDSA",
                    namedCurve: "P-256"
                }, true, ["verify"]);
                state = "private key";
                privateKey = await crypto.subtle.importKey("jwk", privateJWK, {
                    name: "ECDSA",
                    namedCurve: "P-256"
                }, true, ["sign"]);
            } catch (e) {
                console.error(e);
                tty_bios_api.println("An error occurred when importing " + state + ", press any key to proceed.");
                await tty_bios_api.inputKey();
                continue;
            }
            tty_bios_api.println("The keypair was imported.")
            try {
                state = "creating random data";
                let randomData = crypto.getRandomValues(new Uint8Array(16));
                state = "signing data";
                let signature = await crypto.subtle.sign({
                    name: "ECDSA",
                    hash: {
                        name: "SHA-256"
                    }
                }, privateKey, randomData);
                state = "verifying data";
                let verification = await crypto.subtle.verify({
                    name: "ECDSA",
                    hash: {
                        name: "SHA-256"
                    }
                }, publicKey, signature, randomData);
                state = "checking verification";
                if (!verification) throw new Error("Verification failed");
            } catch (e) {
                console.error(e);
                tty_bios_api.println("An error occurred when " + state + ", press any key to proceed.");
                await tty_bios_api.inputKey();
                continue;
            }
            tty_bios_api.println("The keypair is consistent!")
        } else if (choice == "7") {
            break;
        } else {
            tty_bios_api.println("Invalid choice.");
        }
        tty_bios_api.println("Press any key to proceed.");
        await tty_bios_api.inputKey();
    }
}