// @pcos-app-mode native
const pcos_version = "1027";
 
let modules = {
    core: coreExports
};
globalThis.modules = modules;
modules.pcos_version = pcos_version;

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
	throw (component ? component.underlyingJS : null) || code || "UNSPECIFIED_ERROR";
}

function startupMemo() {
	modules.core.tty_bios_api.println("PCsoft PCOS 3, build " + pcos_version);
	modules.core.tty_bios_api.println("Logical processors: " + navigator.hardwareConcurrency);
	modules.core.tty_bios_api.println("Memory available: " + ((navigator.deviceMemory * 1024) || "<unavailable>") + " MB");
}
startupMemo();