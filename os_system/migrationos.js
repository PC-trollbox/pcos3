// This is a generated file. Please modify the corresponding files, not this file directly.
// (c) Copyright 2025 PCsoft. MIT license: https://spdx.org/licenses/MIT.html
// 00-pcos.js
// @pcos-app-mode native
const pcos_version = "migration";
const build_time = 0;
 
let modules = {
	core: coreExports,
	pcos_version,
	build_time
};
globalThis.modules = modules;

async function panic(code, component) {
	modules.shuttingDown = true;
	if (modules.session) modules.session.muteAllSessions();
	let baseLocales = {
		"PANIC_LINE1": "A critical problem has been detected while using the operating system. Its stability is at risk now.",
		"PANIC_LINE2": "Problem code: %s",
		"PANIC_UNSPECIFIED_ERROR": "UNSPECIFIED_ERROR",
		"PROBLEMATIC_COMPONENT": "Problematic component: %s",
		"PROBLEMATIC_PARAMS": "Problematic parameters: %s",
		"PROBLEMATIC_JS": "Problematic JavaScript: %s: %s",
		"PANIC_LINE3": "If you have seen this error message the first time, attempt rebooting.",
		"PANIC_LINE4": "If you see this error message once more, there is something wrong with the system.",
		"PANIC_LINE5": "You can try repairing the filesystem by placing a .fsck file on the system root mountpoint, with the value \"recover\" in it.",
		"PANIC_LINE6": "Proper shutdown procedure follows now:",
		"PANIC_TASK_KILLED": "task:%s: killed",
		"PANIC_MOUNT_UNMOUNTED": "mount:%s: unmounted",
		"PANIC_MOUNT_FAILED": "mount:%s: %s: %s"
	}
	let currentLocales = modules.locales;
	if (currentLocales) currentLocales = currentLocales[navigator.language.slice(0, 2).toLowerCase()];
	if (!currentLocales) currentLocales = baseLocales;
	if (!Object.keys(baseLocales).every(key => currentLocales.hasOwnProperty(key))) currentLocales = baseLocales;

	modules.core.tty_bios_api.println(currentLocales.PANIC_LINE1);
	modules.core.tty_bios_api.println(currentLocales.PANIC_LINE2.replace("%s", (code || currentLocales.PANIC_UNSPECIFIED_ERROR)));
	if (component) {
		if (component.name) modules.core.tty_bios_api.println(currentLocales.PROBLEMATIC_COMPONENT.replace("%s", component.name));
		if (component.params) modules.core.tty_bios_api.println(currentLocales.PROBLEMATIC_PARAMS.replace("%s", JSON.stringify(component.params, null, "\t")));
		if (component.underlyingJS) {
			modules.core.tty_bios_api.println(currentLocales.PROBLEMATIC_JS.replace("%s", component.underlyingJS.name).replace("%s", component.underlyingJS.message));
			if (component.underlyingJS.stack) modules.core.tty_bios_api.println(component.underlyingJS.stack);
		}
	}
	modules.core.tty_bios_api.println(currentLocales.PANIC_LINE3);
	modules.core.tty_bios_api.println(currentLocales.PANIC_LINE4);
	modules.core.tty_bios_api.println(currentLocales.PANIC_LINE5);
	modules.core.tty_bios_api.println(currentLocales.PANIC_LINE6);
	try {
		modules.websocket._handles[modules.network.ws].ws.onclose = null;
		modules.websocket._handles[modules.network.ws].ws.close();
		delete modules.websocket._handles[modules.network.ws];
	} catch {}
	if (modules.tasks) for (let task in modules.tasks.tracker) {
		modules.core.tty_bios_api.println(currentLocales.PANIC_TASK_KILLED.replace("%s", modules.tasks.tracker[task].file));
		modules.tasks.tracker[task].ree.closeDown();
	}
	if (modules.fs) for (let mount in modules.fs.mounts) {
		try {
			await modules.fs.unmount(mount);
			modules.core.tty_bios_api.println(currentLocales.PANIC_MOUNT_UNMOUNTED.replace("%s", mount));
		} catch (e) {
			modules.core.tty_bios_api.println(currentLocales.PANIC_MOUNT_FAILED.replace("%s", mount).replace("%s", e.name).replace("%s", e.message));
		}
	}
	if (modules.session) modules.session.destroy();
	throw (component ? component.underlyingJS : null) || code || "UNSPECIFIED_ERROR";
}

function startupMemo() {
	modules.core.tty_bios_api.println("PCsoft MigrationOS");
	modules.core.tty_bios_api.println("Logical processors: " + navigator.hardwareConcurrency);
	modules.core.tty_bios_api.println("Memory available: " + ((navigator.deviceMemory * 1024) || "<unavailable>") + " MB");
}
startupMemo();
// 02-migrate.js
async function recursiveRemove(path) {
	let dirList = await modules.fs.ls(path);
	for (let fileIndex in dirList) {
		let file = dirList[fileIndex];
		if (await modules.fs.isDirectory(path + "/" + file)) await recursiveRemove(path + "/" + file);
		else await modules.fs.rm(path + "/" + file);
	}
	await modules.fs.rm(path);
}
modules.core.tty_bios_api.println("System mountpoint is " + modules.defaultSystem);
modules.core.tty_bios_api.println("Removing MigrationOS update file");
try {
	await modules.fs.rm(modules.defaultSystem + "/etc/diffupdate_cache.js");
} catch {
	modules.core.tty_bios_api.println("\tMigration not started through diffupdate");
}
modules.core.tty_bios_api.println("Removing paths with old data");
let tryRemove = [ "apps", "boot", "etc/wallpapers", "etc/icons", "etc/sounds", "etc/keys" ];
for (let folder of tryRemove) {
	try {
		await recursiveRemove(modules.defaultSystem + "/" + folder);
		modules.core.tty_bios_api.println("\tRemoved folder: " + folder);
	} catch {}
}
let tryCreate = [ "apps", "apps/associations", "apps/links", "boot", "etc", "etc/wallpapers", "etc/icons", "etc/sounds", "etc/keys", "etc/security", "root", "home" ];
modules.core.tty_bios_api.println("Creating new paths");
for (let folder of tryCreate) {
	try {
		await modules.fs.mkdir(modules.defaultSystem + "/" + folder);
		modules.core.tty_bios_api.println("\tNew folder: " + folder);
	} catch {}
}
modules.core.tty_bios_api.println("Migrating user info paths");
let userDB = JSON.parse(await modules.fs.read(modules.defaultSystem + "/etc/security/users"));
for (let user in userDB) {
	let userInfo = userDB[user];
	if (userInfo?.homeDirectory?.startsWith(modules.defaultSystem + "/") || userInfo?.homeDirectory == modules.defaultSystem) {
		userInfo.homeDirectory = userInfo.homeDirectory.replace(modules.defaultSystem, "system");
		modules.core.tty_bios_api.println("\tMigrated user " + user);
	}
}
modules.core.tty_bios_api.println("Saving migrated users post update");
await modules.fs.write(modules.defaultSystem + "/etc/security/users.new", JSON.stringify(userDB));
await modules.fs.write(modules.defaultSystem + "/boot/02-upgrade.js", `try {
	await modules.fs.rm(modules.defaultSystem + "/boot/02-upgrade.js");
	await modules.fs.write(modules.defaultSystem + "/etc/security/users", await modules.fs.read(modules.defaultSystem + "/etc/security/users.new"));
	await modules.fs.rm(modules.defaultSystem + "/etc/security/users.new");
	modules.core.tty_bios_api.println("\tSuccessful user database migration.");
} catch {}`);

modules.core.tty_bios_api.println("Migration is complete.");
modules.core.tty_bios_api.println("Now please install the latest modular build.");
modules.core.tty_bios_api.println("Press any key to shut down system.");
await coreExports.tty_bios_api.inputLine();
return panic("MIGRATION_HALF_PERFORMED");
// 10-installer.js
// Stub
// 15-apps.js
// Stub
async function aInstaller(target, token) {}
// 17-installer-secondstage.js
// Stub