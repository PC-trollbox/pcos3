// @pcos-app-mode native
modules.fs.mounts[".installer"] = modules.mounts.ramMount({});
modules.defaultSystem = ".installer";
// Directory structure
modules.fs.mkdir(".installer/modules");
modules.fs.mkdir(".installer/root");
modules.fs.mkdir(".installer/root/.autorunNecessity");
modules.fs.mkdir(".installer/root/desktop");
modules.fs.mkdir(".installer/apps");
modules.fs.mkdir(".installer/apps/associations");
modules.fs.mkdir(".installer/apps/links");
modules.fs.mkdir(".installer/etc");
modules.fs.mkdir(".installer/etc/wallpapers");
modules.fs.mkdir(".installer/etc/security");
modules.fs.write(".installer/etc/appHarden", JSON.stringify({
	requireSignature: true,
	requireAllowlist: true
}));
modules.fs.write(".installer/etc/security/users", JSON.stringify({
    root: {
        securityChecks: [ { type: "timeout", timeout: 0 } ],
		groups: ["root"],
		homeDirectory: "system/root"
    },
    authui: {
		securityChecks: [],
		groups: ["authui"],
		homeDirectory: "system",
		blankPrivileges: true,
		additionalPrivilegeSet:  [ "IPC_SEND_PIPE", "GET_LOCALE", "GET_THEME", "ELEVATE_PRIVILEGES", "FS_READ", "FS_LIST_PARTITIONS", "CSP_OPERATIONS" ]
	}
}));
modules.fs.write(".installer/etc/security/automaticLogon", "root");
modules.fs.write(".installer/root/.darkmode", "false");
let autorunEntry = JSON.stringify({
	localeReferenceName: "INSTALLER_TITLE",
	path: "system/apps/installer.js"
});
modules.fs.write(".installer/root/.autorunNecessity/installer.lnk", autorunEntry);
modules.fs.write(".installer/root/desktop/installer.lnk", autorunEntry);
let networkDefaultURL = new URL(location.origin);
networkDefaultURL.protocol = "ws" + (networkDefaultURL.protocol == "https:" ? "s" : "") + ":";
networkDefaultURL.pathname = "";
modules.fs.write(".installer/etc/network.json", JSON.stringify({
	url: networkDefaultURL.toString(),
	ucBits: 1,
	updates: "pcosserver.pc"
}));
// Installer modules
// @auto-generated-installer-module-insertion