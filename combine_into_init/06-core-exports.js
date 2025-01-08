let coreExports = {
	disk,
	tty_bios_api,
	prefs,
	createREE,
	pbkdf2,
	idb,
	bootMode: "normal",
	bootSection: undefined,
	setFW: new_flash => localStorage.setItem("runtime_flash", new_flash)
};
globalThis.coreExports = coreExports;