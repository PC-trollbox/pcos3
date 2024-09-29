// =====BEGIN MANIFEST=====
// signer: automaticSigner
// allow: GET_LOCALE, GET_THEME, CSP_OPERATIONS, FS_READ, FS_WRITE, FS_BYPASS_PERMISSIONS, FS_LIST_PARTITIONS, SET_USER_INFO, RUN_KLVL_CODE, FS_CHANGE_PERMISSION, FS_REMOVE
// =====END MANIFEST=====
(async function() {
    // @pcos-app-mode isolatable
    document.body.style.fontFamily = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
    if (await availableAPIs.isDarkThemed()) document.body.style.color = "white";
    await availableAPIs.windowTitleSet(await availableAPIs.lookupLocale("SET_UP_PCOS"));
    await availableAPIs.closeability(false);
    let defaultSystem = await availableAPIs.getSystemMount();
    let header = document.createElement("b");
    let postHeader = document.createElement("br");
    let description = document.createElement("span");
    let content = document.createElement("div");
    let button = document.createElement("button");
    header.innerText = await availableAPIs.lookupLocale("INSTALLER_TITLE");
    description.innerText = await availableAPIs.lookupLocale("LET_SETUP_SYSTEM");
    button.innerText = await availableAPIs.lookupLocale("SET_UP");
    document.body.appendChild(header);
    document.body.appendChild(postHeader);
    document.body.appendChild(description);
    document.body.appendChild(content);
    document.body.appendChild(button);
    button.onclick = async function() {
        header.remove();
        postHeader.remove();
        content.innerHTML = "";
        description.innerText = await availableAPIs.lookupLocale("LET_CREATE_ACCOUNT");
        button.innerText = await availableAPIs.lookupLocale("CREATE");
        let useraccountname = document.createElement("input");
        let useraccountpassword = document.createElement("input");
        let darkmode = document.createElement("input");
        let darkmode_lb = document.createElement("label");
        useraccountname.placeholder = await availableAPIs.lookupLocale("USERNAME");
        useraccountname.value = "root";
        useraccountname.title = await availableAPIs.lookupLocale("PROVISIONED_PREFERENCE");
        useraccountname.disabled = true;
        useraccountpassword.placeholder = await availableAPIs.lookupLocale("PASSWORD");
        useraccountpassword.type = "password";
        darkmode.type = "checkbox";
        darkmode.id = "darkmode";
        darkmode_lb.innerText = await availableAPIs.lookupLocale("DARK_MODE");
        darkmode_lb.htmlFor = "darkmode";
        content.appendChild(useraccountname);
        content.appendChild(document.createElement("br"));
        content.appendChild(useraccountpassword);
        content.appendChild(document.createElement("br"));
        content.appendChild(darkmode);
        content.appendChild(darkmode_lb);
        button.onclick = async function() {
            let password = useraccountpassword.value;
            let darkModeChecked = darkmode.checked;
            if (!password) return;
            content.innerHTML = "";
            button.hidden = true;
            description.innerHTML = (await availableAPIs.lookupLocale("INSTALLING_PCOS")).replace("%s", await availableAPIs.lookupLocale("CREATING_USER"));
            let salt = await availableAPIs.cspOperation({
                cspProvider: "basic",
                operation: "random",
                cspArgument: new Uint8Array(64)
            });
            let u8aToHex = (u8a) => Array.from(u8a).map(a => a.toString(16).padStart(2, "0")).join("");
            let key = await availableAPIs.cspOperation({
                cspProvider: "basic",
                operation: "importKey",
                cspArgument: {
                    format: "raw",
                    keyData: new TextEncoder().encode(password),
                    algorithm: {
                        name: "PBKDF2"
                    },
                    extractable: false,
                    keyUsages: ["deriveBits", "deriveKey"]
                }
            });
            let derived = new Uint8Array(await availableAPIs.cspOperation({
                cspProvider: "basic",
                operation: "deriveBits",
                cspArgument: {
                    algorithm: {
                        name: "PBKDF2",
                        salt: salt,
                        iterations: 100000,
                        hash: "SHA-256"
                    },
                    baseKey: key,
                    length: 256
                }
            }));
            await availableAPIs.cspOperation({
                cspProvider: "basic",
                operation: "unloadKey",
                cspArgument: key
            });
            await availableAPIs.setUserInfo({
                desiredUser: "root",
                info: {
                    securityChecks: [
                        {
                            type: "pbkdf2",
                            hash: u8aToHex(derived),
                            salt: u8aToHex(salt)
                        }
                    ],
                    groups: [ "root", "users" ],
                    homeDirectory: defaultSystem + "/root"
                }
            });
            description.innerHTML = (await availableAPIs.lookupLocale("INSTALLING_PCOS")).replace("%s", await availableAPIs.lookupLocale("CREATING_USER_HOME"));
            try {
                await availableAPIs.fs_mkdir({ path: defaultSystem + "/root" });
            } catch {}
            try {
                await availableAPIs.fs_mkdir({ path: defaultSystem + "/home" });
            } catch {}
            description.innerHTML = (await availableAPIs.lookupLocale("INSTALLING_PCOS")).replace("%s", await availableAPIs.lookupLocale("HOLDING_NETCONFIG"));
            await availableAPIs.fs_write({
                path: defaultSystem + "/etc/network.json",
                data: await availableAPIs.lookupLocale("CONFIG_HELD")
            });
            description.innerHTML = (await availableAPIs.lookupLocale("INSTALLING_PCOS")).replace("%s", await availableAPIs.lookupLocale("INSTALLING_WP2U"));
            await availableAPIs.fs_write({
                path: defaultSystem + "/root/.wallpaper",
                data: await availableAPIs.fs_read({
                    path: defaultSystem + "/etc/wallpapers/pcos" + (darkModeChecked ? "-dark" : "") + "-beta.pic"
                })
            });
            await availableAPIs.fs_chmod({ path: defaultSystem + "/root/.wallpaper", newPermissions: "" });
            description.innerHTML = (await availableAPIs.lookupLocale("INSTALLING_PCOS")).replace("%s", await availableAPIs.lookupLocale("INSTALLING_WP2L"));
            await availableAPIs.fs_write({
                path: defaultSystem + "/etc/wallpapers/lockscreen.pic",
                data: await availableAPIs.fs_read({ path: defaultSystem + "/etc/wallpapers/pcos-lock-beta.pic" })
            });
            description.innerHTML = (await availableAPIs.lookupLocale("INSTALLING_PCOS")).replace("%s", await availableAPIs.lookupLocale("INSTALLING_DARKMODE"));
            await availableAPIs.fs_write({
                path: defaultSystem + "/root/.darkmode",
                data: darkModeChecked.toString()
            });
            await availableAPIs.fs_chmod({ path: defaultSystem + "/root/.darkmode", newPermissions: "" });
            description.innerHTML = (await availableAPIs.lookupLocale("INSTALLING_PCOS")).replace("%s", await availableAPIs.lookupLocale("INSTALLING_DARKMODE2L"));
            await availableAPIs.fs_write({
                path: defaultSystem + "/etc/darkLockScreen",
                data: "false"
            });
            description.innerHTML = (await availableAPIs.lookupLocale("INSTALLING_PCOS")).replace("%s", await availableAPIs.lookupLocale("REMOVING_2STAGE"));
            await availableAPIs.fs_rm({ path: defaultSystem + "/boot/17-installer-secondstage.js" });
            description.innerHTML = (await availableAPIs.lookupLocale("INSTALLING_PCOS")).replace("%s", await availableAPIs.lookupLocale("REMOVING_SETUP_STATE"));
            await availableAPIs.fs_rm({ path: defaultSystem + "/boot/01-setup-state.js" });
            await availableAPIs.runKlvlCode("delete modules.settingUp;");
            description.innerHTML = (await availableAPIs.lookupLocale("INSTALLING_PCOS")).replace("%s", await availableAPIs.lookupLocale("REMOVING_INSTALLERS"));
            await availableAPIs.fs_rm({ path: defaultSystem + "/boot/15-apps.js" });
            await availableAPIs.fs_rm({ path: defaultSystem + "/boot/16-wallpaper.js" });
            await availableAPIs.fs_rm({ path: defaultSystem + "/boot/16-sfxpack.js" });
            description.innerHTML = (await availableAPIs.lookupLocale("INSTALLING_PCOS")).replace("%s", await availableAPIs.lookupLocale("PATCHING_LOGON"));
            await availableAPIs.fs_write({
                path: defaultSystem + "/boot/14-logon-requirement-enforce.js",
                data: "requireLogon();\n"
            });
            description.innerHTML = await availableAPIs.lookupLocale("SETUP_SUCCESSFUL");
            await availableAPIs.closeability(true);
        }
    }
})();
addEventListener("signal", async function(e) {
    if (e.detail == 15) {
        await availableAPIs.runKlvlCode("requireLogon(); null;");
        await window.availableAPIs.terminate();
    }
});