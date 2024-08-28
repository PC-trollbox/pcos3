// automatically generated file, do not edit; edit the corresponding files instead
function createREE(direction) {
    return new Promise(function(resolve) {
        let iframe = document.createElement("iframe");
        let iframeId = crypto.getRandomValues(new Uint8Array(64)).reduce((a, b) => a + b.toString(16).padStart(2, "0"), "");
        iframe.src = "data:text/html;base64," + btoa("<!DOCTYPE HTML>\n<script>const iframeId = " + JSON.stringify(iframeId) + ";\n" + reed.toString() + "\nreed();</script>");
        iframe.style.border = "none";
        iframe.setAttribute("credentialless", "true");
        iframe.sandbox = "allow-scripts";
        direction.appendChild(iframe);
        let prezhn = [];
        let prerm = [];
        iframe.addEventListener("load", function s() {
            iframe.removeEventListener("load", s);
            return resolve({
                iframe,
                exportAPI: function(id, fn) {
                    iframe.contentWindow.postMessage({type: "export_api", id: id, iframeId}, "*");
                    async function prezhn_it(e) {
                        if (e.data.iframeId != iframeId) return;
                        if (e.data.id != id) return;
                        if (e.data.type != "call_api") return;
                        try {
                            e.source.postMessage({
                                result: await fn({
                                    caller: iframeId,
                                    arg: e.data.arg
                                }),
                                type: "api_response",
                                responseToken: e.data.responseToken,
                                iframeId
                            }, "*");
                        } catch (er) {
                            e.source.postMessage({
                                result: {
                                    name: er.name,
                                    message: er.message
                                },
                                type: "api_error",
                                responseToken: e.data.responseToken,
                                iframeId
                            }, "*");
                        }
                    }
                    window.addEventListener("message", prezhn_it);
                    prezhn.push(prezhn_it);
                },
                eval: function(code) {
                    let responseToken = crypto.getRandomValues(new Uint8Array(64)).reduce((a, b) => a + b.toString(16).padStart(2, "0"), "");
                    return new Promise(function(resolve, reject) {
                        iframe.contentWindow.postMessage({type: "run", code, responseToken, iframeId}, "*");
                        function sel(e) {
                            if (e.data.iframeId != iframeId) return;
                            if (e.data.responseToken != responseToken) return;
                            prezhn = prezhn.filter(x => x != sel);
                            window.removeEventListener("message", sel);
                            if (e.data.type == "ran_response")
                                resolve(e.data.result);
                            else if (e.data.type == "ran_error")
                                reject(e.data.result);
                        };
                        window.addEventListener("message", sel);
                        prezhn.push(sel);
                    });
                },
                closeDown: async function() {
                    for (let i of prerm) await i(this);
                    prerm = [];
                    for (let i in prezhn) window.removeEventListener("message", prezhn[i]);
                    iframe.remove();
                    iframe = null;
                },
                beforeCloseDown: function(fn) {
                    prerm.push(fn);
                },
                iframeId
            });
        });
    });
}

// reed() is for in-iframe use only
function reed() {
    window.availableAPIs = {};
    window.addEventListener("message", function(e) {
        if (e.data.iframeId != iframeId) {
            e.stopImmediatePropagation();
            e.stopPropagation();
            e.preventDefault();
            return false;
        }
        if (e.data.type == "export_api") {
            window.availableAPIs[e.data.id] = function(arg) {
                return new Promise(function(resolve, reject) {
                    let responseToken = crypto.getRandomValues(new Uint8Array(64)).reduce((a, b) => a + b.toString(16).padStart(2, "0"), "");
                    e.source.postMessage({
                        type: "call_api",
                        id: e.data.id,
                        arg,
                        responseToken: responseToken,
                        iframeId
                    }, "*");
                    addEventListener("message", function selv(e) {
                        if (e.data.iframeId != iframeId) return;
                        if (e.data.responseToken != responseToken) return;
                        window.removeEventListener("message", selv);
                        if (e.data.type == "api_response")
                            resolve(e.data.result);
                        else if (e.data.type == "api_error")
                            reject(e.data.result);
                    });
                })
            }
        } else if (e.data.type == "unexport_api") {
            delete window.availableAPIs[e.data.id];
        } else if (e.data.type == "run") {
            try {
                e.source.postMessage({
                    type: "ran_response",
                    result: eval(e.data.code),
                    responseToken: e.data.responseToken,
                    iframeId
                }, "*");
            } catch (e2) {
                e.source.postMessage({
                    type: "ran_error",
                    result: {
                        name: e2.name,
                        message: e2.message,
                        stack: e2.stack
                    },
                    responseToken: e.data.responseToken,
                    iframeId
                }, "*");
            }
        }
    });
}
let disk = {
    partitions: function() {
        return Object.keys(JSON.parse(this.raw));
    },
    partition: function(name) {
        let that = this;
        let cachedPartition = JSON.parse(this.raw)[name];
        return {
            setData: function(val) {
                let commit = JSON.parse(that.raw);
                commit[name] = val;
                cachedPartition = val;
                that.raw = JSON.stringify(commit);
            },
            getData: function() {
                return cachedPartition;
            },
            remove: function() {
                let commit = JSON.parse(that.raw);
                delete commit[name];
                cachedPartition = undefined;
                that.raw = JSON.stringify(commit);
            }
        }
    },
    insertPartitionTable: function() {
        this.raw = "{}";
    },
    raw: null,
    get raw() {
        return localStorage.getItem("pcos3-disk");
    },
    set raw(val) {
        localStorage.setItem("pcos3-disk", val);
    }
};
let tty_bios_api = {
    print: function(print, html) {
        let outputEl = document.createElement("span");
        outputEl["inner" + (html ? "HTML" : "Text")] = print || "";
        document.getElementById("tty_bios").appendChild(outputEl);
        outputEl.scrollIntoView();
        return true;
    },
    println: function(print, html) { return this.print((print || "") + "\n", html); },
    clear: () => document.getElementById("tty_bios").innerText = "",
    inputKey: function() {
        return new Promise(function(resolve) {
            addEventListener("keydown", function sel(e) {
                e.preventDefault();
                removeEventListener("keydown", sel);
                resolve(e);
            })
        });
    },
    inputLine: async function(reprint = false, string = false) {
        let collection = [];
        while (collection[collection.length - 1] !== 13 && collection[collection.length - 1] !== "Enter") {
            let key = await this.inputKey();
            if (reprint && key.key.length == 1) this.print(key.key);
            if (key.key.length == 1 || key.key == "Enter" || !string) collection.push(key[string ? "key" : "keyCode"]);
        }
        this.print("\n");
        collection.pop();
        if (string) collection = collection.join("");
        return collection;
    }
};
const AsyncFunction = (async () => {}).constructor;
(async function() {
    let url = new URL(location);
    let openPrefMgr = false;
    function keyDownHandler(e) {
        if (e.key == "Enter") {
            e.preventDefault();
            openPrefMgr = true;
            removeEventListener("keydown", keyDownHandler);
        }
    }
    addEventListener("keydown", keyDownHandler);
    tty_bios_api.println("PPPPPP CCCCCC        SSSSSS Y    Y SSSSSS TTTTTT EEEEEE M    M SSSSSS");
    tty_bios_api.println("P    P C             S       Y  Y  S        TT   E      MM  MM S     ");
    tty_bios_api.println("PPPPPP C             SSSSSS   YY   SSSSSS   TT   EEEEEE M MM M SSSSSS");
    tty_bios_api.println("P      C                  S   YY        S   TT   E      M    M      S");
    tty_bios_api.println("P      CCCCCC        SSSSSS   YY   SSSSSS   TT   EEEEEE M    M SSSSSS");
    tty_bios_api.println("PC Systems");
    tty_bios_api.println("");
    tty_bios_api.println("At this point REE and disk management is loaded");
    tty_bios_api.println("Testing REE...");
    let ree_points = 0;
    let empty = document.createElement("div");
    empty.hidden = true;
    document.body.appendChild(empty);
    let ree = await createREE(empty);
    tty_bios_api.println("\tREE created");
    tty_bios_api.print("\tStorage access...");
    localStorage.a = "b";
    try {
        await ree.eval("localStorage.a");
        tty_bios_api.println("\tavailable (bad)");
    } catch {
        tty_bios_api.println("\tfailed (good)");
        ree_points++;
    }
    delete localStorage.a;
    tty_bios_api.print("\tParent access...");
    window.a = "b";
    try {
        await ree.eval("parent.a");
        tty_bios_api.println("\tavailable (bad)");
    } catch {
        tty_bios_api.println("\tfailed (good)");
        ree_points++;
    }
    delete window.a;
    tty_bios_api.print("\tExported API access...");
    ree.exportAPI("ree-test", () => tty_bios_api.println("\tavailable (good)") && ree_points++);
    try {
        await ree.eval("window.availableAPIs['ree-test'](); null");
    } catch {
        tty_bios_api.println("\tfailed (bad)");
    }
    tty_bios_api.print("\tAPI authentication...");
    ree.exportAPI("ree-test-security", (param) => param.caller == ree.iframeId ? (tty_bios_api.println("\tworks (good)") && ree_points++) : tty_bios_api.println("\tfailed (bad)"));
    try {
        await ree.eval("window.availableAPIs['ree-test-security'](); null");
    } catch {
        tty_bios_api.println("\tcall failed (bad)");
    }
    tty_bios_api.print("\tStopping test REE...");
    try {
        await ree.closeDown();
        ree_points++;
        tty_bios_api.println("\tok");
    } catch {
        tty_bios_api.println("\tfailed");
    }
    empty.remove();
    tty_bios_api.println("\tTotal points " + ree_points + " out of 5");
    if (ree_points != 5) tty_bios_api.println("REE TEST FAILED. RUNNING SYSTEM MAY BE INSECURE.");
    if (ree_points != 5 && (!url.searchParams?.get("insecure")?.includes("allow-ree-fail") || prefs.read("disallow_bad_ree") == true)) return tty_bios_api.println("System halted.");
    await new Promise(r => setTimeout(r, 250));
    removeEventListener("keydown", keyDownHandler);
    if (openPrefMgr) await prefmgr();
    if (prefs.read("require_password_for_boot") == true) {
        let guardPasswords = (prefs.read("guard_passwords") || []);
        let attempts = 0;
        while (attempts != 5 && guardPasswords.length) {
            tty_bios_api.print("Enter a password: ");
            let passwordInput = await tty_bios_api.inputLine(false, true);
            let flag = false;
            for (let pass of guardPasswords) if (pass.hash == await pbkdf2(passwordInput, pass.salt)) {
                flag = true;
                break;
            }
            if (flag) break;
            attempts++;
        }
        if (attempts == 5) return tty_bios_api.println("Password incorrect. System halted.");
    }
    tty_bios_api.println("Testing disk access...");
    tty_bios_api.print("\tBoot partition...");
    let should_try = false;
    try {
        if (!disk.partitions().includes("boot")) throw false;
        tty_bios_api.println("\tpresent");
        should_try = true;
    } catch {
        tty_bios_api.println("\tbad");
    }
    tty_bios_api.print("\tStarting the system...");
    let success = false;
    try {
        if (!should_try) tty_bios_api.println("\tboot partition missing, skipped");
        if (should_try) {
            await new AsyncFunction(disk.partition("boot").getData())();
            tty_bios_api.println("\tfinished");
            success = true;
        }
    } catch (e) {
        console.error("hard drive booting:", e);
        tty_bios_api.println("\tfailed");
    }
    if (!success) {
        tty_bios_api.print("Network starting...");
        if (prefs.read("never_boot_from_network")) tty_bios_api.println("\tdisallowed");
        else {
            try {
                await new AsyncFunction(await ((await fetch("os.js")).text()))();
                tty_bios_api.println("\tfinished");
            } catch (e) {
                console.error("network booting:", e);
                tty_bios_api.println("\tfailed");
            }
        }
    }
    tty_bios_api.println("System halted.");
})();
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
        tty_bios_api.println(" 7. Boot from hard drive");
        tty_bios_api.println(" 8. Boot from default network");
        tty_bios_api.println(" 9. Boot from custom network");
        tty_bios_api.println("10. Poor man's JavaScript console");
        tty_bios_api.println("11. Install system offline");
        tty_bios_api.println("12. Schedule flash update");
        tty_bios_api.println("13. Load defaults");
        tty_bios_api.println("14. Restart system");
        tty_bios_api.println("15. Exit");
        tty_bios_api.println();
        tty_bios_api.print(">> ");
        let choice = await tty_bios_api.inputLine(true, true);
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
            try {
                await new AsyncFunction(disk.partition("boot").getData())();
                throw new Error("boot_success");
            } catch (e) {
                if (e.message == "boot_success") throw e;
                tty_bios_api.println("Failed to boot from hard drive.");
                console.error(e);
            }
        } else if (choice == "8") {
            try {
                await new AsyncFunction(await ((await fetch("os.js")).text()))();
                throw new Error("boot_success");
            } catch (e) {
                if (e.message == "boot_success") throw e;
                tty_bios_api.println("Failed to boot from default network.");
                console.error(e);
            }
        } else if (choice == "9") {
            tty_bios_api.print("Enter network address: ");
            let addr = await tty_bios_api.inputLine(true, true);
            try {
                await new AsyncFunction(await ((await fetch(addr)).text()))();
                throw new Error("boot_success");
            } catch (e) {
                if (e.message == "boot_success") throw e;
                tty_bios_api.println("Failed to boot from custom network.");
                console.error(e);
            }
        } else if (choice == "10") {
            let code = true;
            while (code) {
                code = prompt("console");
                try {
                    prompt(JSON.stringify(eval(code)), JSON.stringify(eval(code)));
                } catch (e) {
                    prompt(e + "\n" + e.stack, e + "\n" + e.stack);
                }
            }
        } else if (choice == "11") {
            tty_bios_api.println("Unregistering previous cacher...");
            (await navigator.serviceWorker.getRegistrations()).map(reg => reg.unregister());
            try {
                await navigator.serviceWorker.register("offline.js");
                tty_bios_api.println("System may now load offline!");
            } catch (e) {
                console.error(e);
                tty_bios_api.println("Offline install failed.");
            }
        } else if (choice == "12") {
            localStorage.removeItem("runtime_flash");
            tty_bios_api.println("Runtime flash update scheduled.");
        } else if (choice == "13") {
            localStorage.removeItem("runtime_prefs");
            tty_bios_api.println("Defaults loaded.");
        } else if (choice == "14") {
            tty_bios_api.println("Please wait.");
            location.reload();
            throw new Error("reboot");
        } else if (choice == "15") {
            break;
        } else {
            tty_bios_api.println("Invalid choice.");
        }
        tty_bios_api.println("Press any key to proceed.");
        await tty_bios_api.inputKey();
    }
}let coreExports = {
    disk,
    tty_bios_api,
    prefs,
    createREE,
    pbkdf2
};
globalThis.coreExports = coreExports;