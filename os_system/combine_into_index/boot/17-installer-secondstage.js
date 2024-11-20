async function secondstage() {
    // @pcos-app-mode native
    let window = modules.window;
    let windowDiv = window(modules.session.active);
    windowDiv.closeButton.classList.toggle("hidden", true);
    let krnlDiv = document.createElement("div");
    let description = document.createElement("span");
    let progressBar = document.createElement("progress");
    progressBar.id = "secondStageProgress";
    krnlDiv.style.padding = "8px";
    krnlDiv.appendChild(description);
    krnlDiv.appendChild(document.createElement("hr"));
    krnlDiv.appendChild(progressBar);
    windowDiv.content.appendChild(krnlDiv);
    let appScripts = await modules.fs.read(modules.defaultSystem + "/boot/15-apps.js");
    let apps = appScripts.match(/async function (.+)Installer\(target, token\)/g).map(a => a.split(" ")[2].split("(")[0]);
    progressBar.max = apps.length;
    progressBar.value = 0;
    description.innerHTML = modules.locales.get("INSTALLING_PCOS").replace("%s", modules.locales.get("INSTALLING_APPS"));
    let fireAfterInstall = null;
    let firesAfterInstall = new Promise(r => fireAfterInstall = r);
    let installerCode = "(async function() {"
    for (let app of apps) installerCode += `await ${app}(modules.defaultSystem); secondStageProgress.value++;\n`;
    installerCode += "fireAfterInstall(); })();";
    eval(installerCode);
    await firesAfterInstall;
    progressBar.removeAttribute("max");
    progressBar.removeAttribute("value");
    description.innerHTML = modules.locales.get("INSTALLING_PCOS").replace("%s", modules.locales.get("ACCESS_REQUEST_TITLE"));
    let token;
    let usersConfigured = await modules.users.configured();
    if (usersConfigured) {
        token = await new Promise(async function(resolve) {
            let consentui = await modules.consentui(modules.session.systemSession, {
                path: modules.defaultSystem + "/apps/secondstage.js",
                args: [ "usersConfigured" ],
                intent: modules.locales.get("SECONDSTAGE_INSTALLER_INTENT"),
                name: modules.locales.get("SET_UP_PCOS")
            });
            consentui.hook(async function(msg) {
                if (msg.success) return resolve(msg.token);
                modules.restart(true);
            });
        });
    } else {
        await modules.users.init();
        token = await modules.tokens.generate();
        await modules.tokens.userInitialize(token, "root");
    }
    krnlDiv.remove();
    let taskId = await modules.tasks.exec(modules.defaultSystem + "/apps/secondstage.js", [ usersConfigured ? "usersConfigured" : "" ], windowDiv, token, false);
    await modules.tasks.waitTermination(taskId);
    requireLogon();
}