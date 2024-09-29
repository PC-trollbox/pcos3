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
    await modules.users.init();
    progressBar.max = apps.length + 2;
    progressBar.value = 0;
    description.innerHTML = modules.locales.get("INSTALLING_PCOS").replace("%s", modules.locales.get("INSTALLING_WPS"));
    await installWallpapers(modules.defaultSystem);
    progressBar.value++;
    description.innerHTML = modules.locales.get("INSTALLING_PCOS").replace("%s", modules.locales.get("INSTALLING_SFX"));
    await installSfx(modules.defaultSystem);
    progressBar.value++;
    description.innerHTML = modules.locales.get("INSTALLING_PCOS").replace("%s", modules.locales.get("INSTALLING_APPS"));
    let fireAfterInstall = null;
    let firesAfterInstall = new Promise(r => fireAfterInstall = r);
    let installerCode = "(async function() {"
    for (let app of apps) installerCode += `await ${app}(modules.defaultSystem); secondStageProgress.value++;\n`;
    installerCode += "fireAfterInstall(); })();";
    eval(installerCode);
    await firesAfterInstall;
    progressBar.value = progressBar.max;
    krnlDiv.remove();
    let token = await modules.tokens.generate();
    await modules.tokens.userInitialize(token, "root");
    await modules.tasks.exec(modules.defaultSystem + "/apps/secondstage.js", [], windowDiv, token, false);
}