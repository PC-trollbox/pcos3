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
        let _generated = null;
        let appFns = [ _generated?._automatically?._by?._combine?.js ];
        for (let app of appFns) await app("ram");
        await modules.fs.write("ram/root/.darkmode", "true");
        await installSfx("ram");
        await installWallpapers("ram");
        await modules.fs.write("ram/etc/darkLockScreen", "true");
        await modules.fs.write("ram/etc/wallpapers/lockscreen.pic", await modules.fs.read("ram/etc/wallpapers/pcos-lock-beta.pic"));
        await modules.fs.write("ram/root/.wallpaper", await modules.fs.read("ram/etc/wallpapers/pcos-dark-beta.pic"));
        requireLogon();
    }
});