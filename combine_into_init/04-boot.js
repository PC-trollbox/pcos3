async function sysHaltedHook() {
    tty_bios_api.println("System halted.");
    idb.closeDB();
    disk._cache = null;
    idb._db = null;
}

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
    if (!matchMedia("(max-width: 600px)").matches) {
        tty_bios_api.println("PPPPPP CCCCCC        SSSSSS Y    Y SSSSSS TTTTTT EEEEEE M    M SSSSSS");
        tty_bios_api.println("P    P C             S       Y  Y  S        TT   E      MM  MM S     ");
        tty_bios_api.println("PPPPPP C             SSSSSS   YY   SSSSSS   TT   EEEEEE M MM M SSSSSS");
        tty_bios_api.println("P      C                  S   YY        S   TT   E      M    M      S");
        tty_bios_api.println("P      CCCCCC        SSSSSS   YY   SSSSSS   TT   EEEEEE M    M SSSSSS");
    }
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
    try {
        ree.exportAPI("ree-test", () => tty_bios_api.println("\tavailable (good)") && ree_points++);
        await ree.eval("window.availableAPIs['ree-test'](); null");
    } catch (e) {
        console.error(e);
        tty_bios_api.println("\tfailed (bad)");
    }
    tty_bios_api.print("\tAPI authentication...");
    try {
        ree.exportAPI("ree-test-security", (param) => param.caller == ree.iframeId ? (tty_bios_api.println("\tworks (good)") && ree_points++) : tty_bios_api.println("\tauth failed (bad)"));
        await ree.eval("window.availableAPIs['ree-test-security'](); null");
    } catch (e) {
        console.error(e);
        tty_bios_api.println("\tdefine/call failed (bad)");
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
    if (ree_points != 5 && (!url.searchParams?.get("insecure")?.includes("allow-ree-fail") || prefs.read("disallow_bad_ree") == true)) return await sysHaltedHook();
    await new Promise(r => setTimeout(r, 250));
    coreExports.bootMode = url.searchParams?.get("bootMode") || "normal";
    coreExports.bootSection = url.searchParams?.get("bootSection") || undefined;
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
    tty_bios_api.print("\tStarting disk...");
    try {
        disk._cache = (await idb.read()) || "null";
        tty_bios_api.println("\tok");
    } catch (e) {
        console.error("disk access:", e);
        tty_bios_api.println("\tfailed");
    }
    tty_bios_api.print("\tBoot partition...");
    let should_try = false;
    try {
        if (!disk.partitions().includes("boot")) throw false;
        tty_bios_api.println("\tpresent");
        should_try = true;
    } catch (e) {
        console.error("boot partition:", e);
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
    await sysHaltedHook();
})();
