// Insert wallpapers
try { modules.fs.write("system/etc/wallpapers/lockscreen.pic", await modules.fs.read("system/etc/wallpapers/pcos-lock-beta.pic")); } catch {}
try { modules.fs.write("system/root/.wallpaper", await modules.fs.read("system/etc/wallpapers/pcos-beta.pic")); } catch {}