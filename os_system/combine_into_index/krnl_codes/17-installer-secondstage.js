function secondstage() {
    // @pcos-app-mode native
    let window = modules.window;
    let windowDiv = window(modules.session.active);
    let isProvisioned = false;
    let provisionSettings = { username: "root", allowDuplicate: true };
    windowDiv.title.innerText = modules.locales.get("SET_UP_PCOS");
    windowDiv.closeButton.classList.toggle("hidden", true);
    windowDiv.content.style.padding = "8px";
    let header = document.createElement("b");
    let postHeader = document.createElement("br");
    let description = document.createElement("span");
    let content = document.createElement("div");
    let button = document.createElement("button");
    header.innerText = modules.locales.get("INSTALLER_TITLE");
    description.innerText = modules.locales.get("LET_SETUP_SYSTEM");
    button.innerText = modules.locales.get("SET_UP");
    windowDiv.content.appendChild(header);
    windowDiv.content.appendChild(postHeader);
    windowDiv.content.appendChild(description);
    windowDiv.content.appendChild(content);
    windowDiv.content.appendChild(button);
    button.onclick = function() {
        header.remove();
        postHeader.remove();
        content.innerHTML = "";
        description.innerText = modules.locales.get("LET_CREATE_ACCOUNT");
        button.innerText = modules.locales.get("CREATE");
        let useraccountname = document.createElement("input");
        let useraccountpassword = document.createElement("input");
        let darkmode = document.createElement("input");
        let darkmode_lb = document.createElement("label");
        useraccountname.placeholder = modules.locales.get("USERNAME");
        if (provisionSettings.username) {
            useraccountname.value = provisionSettings.username;
            useraccountname.title = modules.locales.get("PROVISIONED_PREFERENCE");
            useraccountname.disabled = true;
        }
        useraccountpassword.placeholder = modules.locales.get("PASSWORD");
        useraccountpassword.type = "password";
        darkmode.type = "checkbox";
        darkmode.id = "darkmode";
        darkmode_lb.innerText = modules.locales.get("DARK_MODE");
        darkmode_lb.htmlFor = "darkmode";
        content.appendChild(useraccountname);
        content.appendChild(document.createElement("br"));
        content.appendChild(useraccountpassword);
        content.appendChild(document.createElement("br"));
        content.appendChild(darkmode);
        content.appendChild(darkmode_lb);
        button.onclick = async function() {
            let username = provisionSettings.username ? provisionSettings.username : useraccountname.value;
            try {
                if (await modules.users.getUserInfo(username) && !provisionSettings.allowDuplicate) return alert(modules.locales.get("USERNAME_EXISTS"));
            } catch {}
            let password = useraccountpassword.value;
            let darkModeChecked = darkmode.checked;
            if (!password) return alert(modules.locales.get("PASSWORD_INPUT_ALERT"));
            content.innerHTML = "";
            button.hidden = true;
            description.innerHTML = modules.locales.get("INSTALLING_PCOS").replace("%s", modules.locales.get("CREATING_USER_STRUCTURE"));
            if (!isProvisioned || !provisionSettings.skipUserStructure) await modules.users.init();
            description.innerHTML = modules.locales.get("INSTALLING_PCOS").replace("%s", modules.locales.get("CREATING_USER"));
            let rng = crypto.getRandomValues(new Uint8Array(64));
            let salt = Array.from(rng).map(x => x.toString(16).padStart(2, "0")).join("");
            let hash = await modules.core.pbkdf2(password, salt);
            let homedir = isProvisioned ? (modules.defaultSystem + "/home/" + username) : (modules.defaultSystem + "/root");
            if (provisionSettings.homeDirectory) homedir = provisionSettings.homeDirectory;
            if (!provisionSettings.skipCreateUser) {
                await modules.users.moduser(username, {
                    securityChecks: [
                        {
                            type: "pbkdf2",
                            hash: hash,
                            salt: salt
                        }
                    ],
                    groups: [ isProvisioned ? username : "root", "users" ],
                    homeDirectory: homedir
                });
            }
            if (isProvisioned && !provisionSettings.skipHomeDirectory) {
                description.innerHTML = modules.locales.get("INSTALLING_PCOS").replace("%s", modules.locales.get("CREATING_USER_HOME"));
                await modules.users.mkrecursive(homedir);
                await modules.fs.chown(modules.defaultSystem + "/home", "root");
                await modules.fs.chgrp(modules.defaultSystem + "/home", "root");
                await modules.fs.chmod(modules.defaultSystem + "/home", "rx");
                await modules.fs.chown(homedir, username);
                await modules.fs.chgrp(homedir, username);
                await modules.fs.chmod(homedir, "rx");
            }
            description.innerHTML = modules.locales.get("INSTALLING_PCOS").replace("%s", modules.locales.get("HOLDING_NETCONFIG"));
            await modules.fs.write(modules.defaultSystem + "/etc/network.json", modules.locales.get("CONFIG_HELD"));
            await modules.fs.chown(modules.defaultSystem + "/etc/network.json", "root");
            await modules.fs.chgrp(modules.defaultSystem + "/etc/network.json", "root");
            await modules.fs.chmod(modules.defaultSystem + "/etc/network.json", "r");
            description.innerHTML = modules.locales.get("INSTALLING_PCOS").replace("%s", modules.locales.get("INSTALLING_WPS"));
            await installWallpapers(modules.defaultSystem);
            description.innerHTML = modules.locales.get("INSTALLING_PCOS").replace("%s", modules.locales.get("INSTALLING_SFX"));
            await installSfx(modules.defaultSystem);
            description.innerHTML = modules.locales.get("INSTALLING_PCOS").replace("%s", modules.locales.get("INSTALLING_WP2U"));
            await modules.fs.write(homedir + "/.wallpaper", await modules.fs.read(modules.defaultSystem + "/etc/wallpapers/pcos" + (darkModeChecked ? "-dark" : "") + "-beta.pic"));
            await modules.fs.chown(homedir + "/.wallpaper", username);
            await modules.fs.chgrp(homedir + "/.wallpaper", username);
            await modules.fs.chmod(homedir + "/.wallpaper", "r");
            description.innerHTML = modules.locales.get("INSTALLING_PCOS").replace("%s", modules.locales.get("INSTALLING_WP2L"));
            await modules.fs.write(modules.defaultSystem + "/etc/wallpapers/lockscreen.pic", await modules.fs.read(modules.defaultSystem + "/etc/wallpapers/pcos-lock-beta.pic"));
            await modules.fs.chown(modules.defaultSystem + "/etc/wallpapers/lockscreen.pic", "root");
            await modules.fs.chgrp(modules.defaultSystem + "/etc/wallpapers/lockscreen.pic", "root");
            await modules.fs.chmod(modules.defaultSystem + "/etc/wallpapers/lockscreen.pic", "r");
            description.innerHTML = modules.locales.get("INSTALLING_PCOS").replace("%s", modules.locales.get("INSTALLING_DARKMODE"));
            await modules.fs.write(homedir + "/.darkmode", darkModeChecked.toString());
            await modules.fs.chown(homedir + "/.darkmode", username);
            await modules.fs.chgrp(homedir + "/.darkmode", username);
            await modules.fs.chmod(homedir + "/.darkmode", "r");
            description.innerHTML = modules.locales.get("INSTALLING_PCOS").replace("%s", modules.locales.get("INSTALLING_DARKMODE2L"));
            await modules.fs.write(modules.defaultSystem + "/etc/darkLockScreen", "false");
            await modules.fs.chown(modules.defaultSystem + "/etc/darkLockScreen", "root");
            await modules.fs.chgrp(modules.defaultSystem + "/etc/darkLockScreen", "root");
            await modules.fs.chmod(modules.defaultSystem + "/etc/darkLockScreen", "r");
            description.innerHTML = modules.locales.get("INSTALLING_PCOS").replace("%s", modules.locales.get("INSTALLING_APPS"));
            let appScripts = await modules.fs.read(modules.defaultSystem + "/boot/15-apps.js");
            let apps = appScripts.match(/async function (.+)Installer\(target, token\)/g).map(a => a.split(" ")[2].split("(")[0]);
            let fireAfterInstall = null;
            let firesAfterInstall = new Promise(r => fireAfterInstall = r);
            let installerCode = "(async function() {"
            for (let app of apps) installerCode += `await ${app}(modules.defaultSystem);\n`;
            installerCode += "fireAfterInstall(); })();";
            eval(installerCode);
            await firesAfterInstall;
            description.innerHTML = modules.locales.get("INSTALLING_PCOS").replace("%s", modules.locales.get("REMOVING_2STAGE"));
            await modules.fs.rm(modules.defaultSystem + "/boot/17-installer-secondstage.js");
            description.innerHTML = modules.locales.get("INSTALLING_PCOS").replace("%s", modules.locales.get("REMOVING_SETUP_STATE"));
            await modules.fs.rm(modules.defaultSystem + "/boot/01-setup-state.js");
            delete modules.settingUp;
            description.innerHTML = modules.locales.get("INSTALLING_PCOS").replace("%s", modules.locales.get("REMOVING_INSTALLERS"));
            await modules.fs.rm(modules.defaultSystem + "/boot/15-apps.js");
            await modules.fs.rm(modules.defaultSystem + "/boot/16-wallpaper.js");
            await modules.fs.rm(modules.defaultSystem + "/boot/16-sfxpack.js");
            description.innerHTML = modules.locales.get("INSTALLING_PCOS").replace("%s", modules.locales.get("PATCHING_LOGON"));
            await modules.fs.write(modules.defaultSystem + "/boot/14-logon-requirement-enforce.js", "requireLogon();\n");
            description.innerHTML = modules.locales.get("SETUP_SUCCESSFUL");
            windowDiv.closeButton.classList.toggle("hidden", false);
            windowDiv.closeButton.onclick = async function() {
                windowDiv.windowDiv.remove();
                requireLogon();
            }
        }
    }
}