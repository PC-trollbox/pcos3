// @pcos-app-mode native
modules.fs.mounts[".installer"] = modules.mounts.ramMount({});
modules.defaultSystem = ".installer";
modules.fs.mkdir(".installer/modules");
modules.fs.mkdir(".installer/root");
modules.fs.mkdir(".installer/apps");
modules.fs.mkdir(".installer/etc");
modules.fs.mkdir(".installer/etc/security");
// Live CD while working!
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
}))
// @auto-generated-installer-module-insertion