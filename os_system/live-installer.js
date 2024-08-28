await modules.fs.mkdir("ram/etc");
await modules.fs.mkdir("ram/etc/security");
await modules.fs.mkdir("ram/root");
await modules.fs.write("ram/etc/security/users", JSON.stringify({
    root: {
        groups: [ "root" ],
        securityChecks: [
            {
                type: "timeout",
                timeout: 0
            }
        ],
        homeDirectory: "ram/root"
    },
    nobody: {
        groups: [ "nobody" ],
        securityChecks: [],
        homeDirectory: "ram"
    },
    authui: {
        groups: [ "authui" ],
        securityChecks: [],
        homeDirectory: "ram"
    }
}));
await modules.fs.write("ram/etc/security/automaticLogon", "root");
let int = setInterval(async function() {
    if (modules.killSystem) {
        clearInterval(int);
        await keypairInstaller("ram");
        await videoPlayerInstaller("ram");
        await pictureInstaller("ram");
        await terminalInstaller("ram");
        await explorerInstaller("ram");
        await filePickerInstaller("ram");
        await taskMgrInstaller("ram");
        await sysadminInstaller("ram");
        await networkInstaller("ram");
        await networkdInstaller("ram");
        await textEditorInstaller("ram");
        await personalSecurityInstaller("ram");
        await systemSecurityInstaller("ram");
        await authuiInstaller("ram");
        await cryptoInstaller("ram");
        await modules.fs.write("ram/root/.darkmode", "true");
        await installSfx("ram");
        await installWallpapers("ram");
        await modules.fs.write("ram/etc/darkLockScreen", "true");
        await modules.fs.write("ram/etc/wallpapers/lockscreen.pic", await modules.fs.read("ram/etc/wallpapers/pcos-lock-beta.pic"));
        await modules.fs.write("ram/root/.wallpaper", await modules.fs.read("ram/etc/wallpapers/pcos-dark-beta.pic"));
        requireLogon();
    }
});