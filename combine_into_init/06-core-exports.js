let coreExports = {
    disk,
    tty_bios_api,
    prefs,
    createREE,
    pbkdf2,
    idb,
    bootMode: "normal",
    bootSection: undefined
};
globalThis.coreExports = coreExports;