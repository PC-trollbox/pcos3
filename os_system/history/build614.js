// This is a generated file. Please modify the corresponding files, not this file directly.

// 00-pcos.js
// @pcos-app-mode native
const pcos_version = 614;
 
let modules = {
    core: coreExports
};
globalThis.modules = modules;
modules.pcos_version = pcos_version;

async function panic(code, component) {
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
		"PANIC_LINE5": "You can try repairing the filesystem by placing a .fsck file on the system root mountpoint, with any value in it.",
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
// 01-fs.js
function loadFs() {
    // @pcos-app-mode native
    let fs = {
        read: async function(file, sessionToken) {
            let mount = file.split("/")[0];
            if (!this.mounts.hasOwnProperty(mount)) throw new Error("No such device");
            return await this.mounts[mount].read(file.split("/").slice(1).join("/"), sessionToken);
        },
        write: async function(file, data, sessionToken) {
            let mount = file.split("/")[0];
            if (!this.mounts.hasOwnProperty(mount)) throw new Error("No such device");
            if (this.mounts[mount].read_only) throw new Error("Device is read-only");
            return await this.mounts[mount].write(file.split("/").slice(1).join("/"), data, sessionToken);
        },
        rm: async function(file, sessionToken) {
            let mount = file.split("/")[0];
            if (!this.mounts.hasOwnProperty(mount)) throw new Error("No such device");
            if (this.mounts[mount].read_only) throw new Error("Device is read-only");
            return await this.mounts[mount].rm(file.split("/").slice(1).join("/"), sessionToken);
        },
        mkdir: async function(folder, sessionToken) {
            let mount = folder.split("/")[0];
            if (!this.mounts.hasOwnProperty(mount)) throw new Error("No such device");
            if (this.mounts[mount].read_only) throw new Error("Device is read-only");
            if (!this.mounts[mount].directory_supported) throw new Error("Device does not support directories");
            return await this.mounts[mount].mkdir(folder.split("/").slice(1).join("/"), sessionToken);
        },
        permissions: async function(folder, sessionToken) {
            let mount = folder.split("/")[0];
            if (!this.mounts.hasOwnProperty(mount)) throw new Error("No such device");
            if (!this.mounts[mount].permissions_supported) return { owner: "nobody", group: "nogroup", world: "rwx" };
            return await this.mounts[mount].permissions(folder.split("/").slice(1).join("/"), sessionToken);
        },
        lsmounts: function() {
            return Object.keys(this.mounts);
        },
        unmount: async function(mount, sessionToken) {
            if (!this.mounts.hasOwnProperty(mount)) throw new Error("No such device");
            if (!this.mounts[mount].read_only) await this.sync(mount, sessionToken);
            delete this.mounts[mount];
        },
        chown: async function(file, owner, sessionToken) {
            let mount = file.split("/")[0];
            if (!this.mounts.hasOwnProperty(mount)) throw new Error("No such device");
            if (this.mounts[mount].read_only) throw new Error("Device is read-only");
            if (!this.mounts[mount].permissions_supported) throw new Error("Device does not support permissions");
            return await this.mounts[mount].chown(file.split("/").slice(1).join("/"), owner, sessionToken);
        },
        chgrp: async function(file, group, sessionToken) {
            let mount = file.split("/")[0];
            if (!this.mounts.hasOwnProperty(mount)) throw new Error("No such device");
            if (this.mounts[mount].read_only) throw new Error("Device is read-only");
            if (!this.mounts[mount].permissions_supported) throw new Error("Device does not support permissions");
            return await this.mounts[mount].chgrp(file.split("/").slice(1).join("/"), group, sessionToken);
        },
        chmod: async function(file, permissions, sessionToken) {
            let mount = file.split("/")[0];
            if (!this.mounts.hasOwnProperty(mount)) throw new Error("No such device");
            if (this.mounts[mount].read_only) throw new Error("Device is read-only");
            if (!this.mounts[mount].permissions_supported) throw new Error("Device does not support permissions");
            return await this.mounts[mount].chmod(file.split("/").slice(1).join("/"), permissions, sessionToken);
        },
        ls: async function(folder, sessionToken) {
            let mount = folder.split("/")[0];
            if (!this.mounts.hasOwnProperty(mount)) throw new Error("No such device");
            return await this.mounts[mount].ls(folder.split("/").slice(1).join("/"), sessionToken);
        },
        mountInfo: async function(mount) {
            return {
                read_only: this.mounts[mount].read_only || false,
                permissions_supported: this.mounts[mount].permissions_supported || false,
                directory_supported: this.mounts[mount].directory_supported || false,
                filesystem: this.mounts[mount].filesystem || "unknown",
            }
        },
        sync: async function(mount, sessionToken) {
            if (!this.mounts.hasOwnProperty(mount)) throw new Error("No such device");
            if (!this.mounts[mount].read_only) return await this.mounts[mount].sync(sessionToken);
        },
        mounts: {}
    }
    
    async function PCFSiDBMount(options) {
        let partition;
        try {
            partition = modules.core.disk.partition(options.partition);
            partition = partition.getData();
        } catch (e) {
            throw new Error("PARTITION_FAILED: " + e.toString() + "\n---begin stack---\n" + e.stack + "\n---end stack---");
        }
        if (!Object.keys(partition).includes("files") || !Object.keys(partition).includes("permissions")) throw new Error("PARTITION_NOT_PCFS");
        partition = null;
        return {
            read: async function(key) {
                let pathParts = key.split("/");
                if (pathParts[0] == "") pathParts = pathParts.slice(1);
                let files = this.backend.files;
                for (let part of pathParts) {
                    files = files[part];
                    if (!files) throw new Error("No such file");
                }
                if (typeof files === "object") throw new Error("Is a directory");
                return await modules.core.idb.readPart(files);
            },
            write: async function(key, value) {    
                let existenceChecks = key.split("/").slice(0, -1);
                if (existenceChecks[0] == "") existenceChecks = existenceChecks.slice(1);
                if (existenceChecks[existenceChecks.length - 1] == "") existenceChecks = existenceChecks.slice(0, -1);
                let basename = key.split("/").slice(-1)[0];
                let files = this.backend.files;
                for (let part of existenceChecks) {
                    files = files[part];
                    if (!files) throw new Error("No such directory");
                }
                if (typeof files[basename] === "object") throw new Error("Is a directory");
                let id = files[basename] || crypto.getRandomValues(new Uint8Array(64)).reduce((a, b) => a + b.toString(16).padStart(2, "0"), "");
                await modules.core.idb.writePart(id, value);
                if (!files.hasOwnProperty(basename)) {
                    let HACKID = Math.floor(Math.random() * 1000000);
                    globalThis["HACK" + HACKID] = this.backend;
                    let HACK = "";
                    for (let a of key.split("/")) HACK = HACK + "[" + JSON.stringify(a) + "]";
                    eval("globalThis[" + JSON.stringify("HACK" + HACKID) + "].files" + HACK + " = " + JSON.stringify(id) + ";");
                    this.backend = globalThis["HACK" + HACKID];
                    delete globalThis["HACK" + HACKID];
                }
            },
            rm: async function(key) {
                let pathParts = key.split("/");
                if (pathParts[0] == "") pathParts = pathParts.slice(1);
                if (pathParts[pathParts.length - 1] == "") pathParts = pathParts.slice(0, -1);
                let files = this.backend.files;
                for (let part of pathParts) {
                    files = files[part];
                    if (!files) throw new Error("No such file or directory");
                }
                if (typeof files === "object" && Object.keys(files).length > 0) throw new Error("Non-empty directory");
                if (typeof files === "string") await modules.core.idb.removePart(files);
                let HACKID = Math.floor(Math.random() * 1000000);
                globalThis["HACK" + HACKID] = this.backend;
                let HACK = "";
                for (let a of key.split("/")) HACK = HACK + "[" + JSON.stringify(a) + "]";
                eval("delete globalThis[" + JSON.stringify("HACK" + HACKID) + "].files" + HACK + ";");
                eval("delete globalThis[" + JSON.stringify("HACK" + HACKID) + "].permissions[" + JSON.stringify(key) + "];");
                this.backend = globalThis["HACK" + HACKID];
                delete globalThis["HACK" + HACKID];
            },
            ls: async function(directory) {
                let pathParts = directory.split("/");
                if (pathParts[0] == "") pathParts = pathParts.slice(1);
                if (pathParts[pathParts.length - 1] == "") pathParts = pathParts.slice(0, -1);
                let files = this.backend.files;
                for (let part of pathParts) {
                    files = files[part];
                    if (!files) throw new Error("No such directory");
                }
                if (typeof files !== "object") throw new Error("Is a file");
                return Object.keys(files);
            },
            mkdir: async function(directory) {
                let existenceChecks = directory.split("/").slice(0, -1);
                if (existenceChecks[0] == "") existenceChecks = existenceChecks.slice(1);
                if (existenceChecks[existenceChecks.length - 1] == "") existenceChecks = existenceChecks.slice(0, -1);
                let files = this.backend.files;
                for (let part of existenceChecks) {
                    files = files[part];
                    if (!files) throw new Error("No such directory");
                }
                if (Object.keys(files).includes(directory.split("/").slice(-1)[0])) throw new Error("Directory already exists");
                let HACKID = Math.floor(Math.random() * 1000000);
                globalThis["HACK" + HACKID] = this.backend;
                let HACK = "";
                for (let a of directory.split("/")) HACK = HACK + "[" + JSON.stringify(a) + "]";
                eval("globalThis[" + JSON.stringify("HACK" + HACKID) + "].files" + HACK + " = {};");
                this.backend = globalThis["HACK" + HACKID];
                delete globalThis["HACK" + HACKID];
            },
            permissions: async function(file) {
                let properFile = file.split("/")
                if (properFile[0] == "") properFile = properFile.slice(1);
                if (properFile[properFile.length - 1] == "") properFile = properFile.slice(0, -1);
                properFile = properFile.join("/");
                return this.backend.permissions[properFile] || {
                    owner: "root",
                    group: "root",
                    world: "",
                };
            },
            chown: async function(file, owner) {
                let properFile = file.split("/")
                if (properFile[0] == "") properFile = properFile.slice(1);
                if (properFile[properFile.length - 1] == "") properFile = properFile.slice(0, -1);
                properFile = properFile.join("/");
                let backend = this.backend;
                let filePermissions = backend.permissions[properFile] || {
                    owner: "root",
                    group: "root",
                    world: "",
                };
                filePermissions.owner = owner;
                backend.permissions[properFile] = filePermissions;
                this.backend = backend;
            },
            chgrp: async function(file, group) {
                let properFile = file.split("/")
                if (properFile[0] == "") properFile = properFile.slice(1);
                if (properFile[properFile.length - 1] == "") properFile = properFile.slice(0, -1);
                properFile = properFile.join("/");
                let backend = this.backend;
                let filePermissions = backend.permissions[properFile] || {
                    owner: "root",
                    group: "root",
                    world: "",
                };
                filePermissions.group = group;
                backend.permissions[properFile] = filePermissions;
                this.backend = backend;
            },
            chmod: async function(file, permissions) {
                let properFile = file.split("/")
                if (properFile[0] == "") properFile = properFile.slice(1);
                if (properFile[properFile.length - 1] == "") properFile = properFile.slice(0, -1);
                properFile = properFile.join("/");
                let backend = this.backend;
                let filePermissions = backend.permissions[properFile] || {
                    owner: "root",
                    group: "root",
                    world: "",
                };
                filePermissions.world = permissions;
                backend.permissions[properFile] = filePermissions;
                this.backend = backend;
            },
            sync: async function() {
                await modules.core.disk.sync();
            },
            directory_supported: true,
            read_only: !!options.read_only,
            filesystem: "PCFS",
            permissions_supported: true,
            partition: null,
            get backend() {
                if (!this.partition) this.partition = modules.core.disk.partition(options.partition);
                return this.partition.getData();
            },
            set backend(data) {
                this.partition.setData(data);
            }
        };
    };

    async function PCFSiDBAESCryptMount(options) {
        let partition;
        try {
            partition = modules.core.disk.partition(options.partition);
            partition = partition.getData();
        } catch (e) {
            throw new Error("PARTITION_FAILED: " + e.toString() + "\n---begin stack---\n" + e.stack + "\n---end stack---");
        }
        if (!Object.keys(partition).includes("files") || !Object.keys(partition).includes("permissions") || !Object.keys(partition).includes("cryptodata")) throw new Error("PARTITION_NOT_PCFS_ENCRYPTED");
        if (options.interactivePassword) {
            let passwordInput = "";
            let tbi = modules.core.tty_bios_api;
            function outputPasswordAsking() {
                tbi.clear();
                tbi.println("|--------------------------------------------|")
                tbi.println("| Mounting encrypted partition               |");
                tbi.println("|--------------------------------------------|");
                tbi.println("| Enter your password. Typed " + passwordInput.length + " characters. " + " ".repeat(Math.max((3 - (passwordInput.length).toString().length), 0)) + "|");
                tbi.println("| Press Enter to mount.                      |");
                tbi.println("|--------------------------------------------|");
            }
            while (true) {
                outputPasswordAsking();
                let key = await tbi.inputKey();
                if (key.key == "Enter") break;
                if (key.key.length == 1) passwordInput += key.key;
                if (key.key == "Backspace") passwordInput = passwordInput.slice(0, -1);
            }
            options.password = passwordInput;
        }
        if (options.password) options.key = await modules.core.pbkdf2(options.password, partition.cryptodata.salt);
        if (!options.key) throw new Error("GETTING_KEY_FAILED");
        let importedKey = await crypto.subtle.importKey("raw", Uint8Array.from(options.key.match(/.{1,2}/g).map(a => parseInt(a, 16))), { name: "AES-GCM" }, false, [ "encrypt", "decrypt" ]);
        options.key = options.key.length + "L";
        options.password = options.password.length + "L";
        if (partition.cryptodata.passwordLockingInitial) {
            let baseData = crypto.getRandomValues(new Uint8Array(32));
            let iv = crypto.getRandomValues(new Uint8Array(16));
            let ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, importedKey, baseData));
            let passwordLocking = new Uint8Array(iv.length + ct.length);
            passwordLocking.set(iv);
            passwordLocking.set(ct, iv.length);
            partition.cryptodata.passwordLocking = passwordLocking.reduce((a, b) => a + b.toString(16).padStart(2, "0"), "");
            delete partition.cryptodata.passwordLockingInitial;
            modules.core.disk.partition(options.partition).setData(partition);
        }
        if (partition.cryptodata.passwordLocking) {
            let iv = new Uint8Array(partition.cryptodata.passwordLocking.slice(0, 32).match(/.{1,2}/g).map(a => parseInt(a, 16)));
            let ct = new Uint8Array(partition.cryptodata.passwordLocking.slice(32).match(/.{1,2}/g).map(a => parseInt(a, 16)));
            await crypto.subtle.decrypt({ name: "AES-GCM", iv }, importedKey, ct);
        }
        partition = null;
        return {
            read: async function(key) {
                let pathParts = key.split("/");
                if (pathParts[0] == "") pathParts = pathParts.slice(1);
                let files = this.backend.files;
                for (let part of pathParts) {
                    files = files[part];
                    if (!files) throw new Error("No such file");
                }
                if (typeof files === "object") throw new Error("Is a directory");
                let part = await modules.core.idb.readPart(files);
                let iv = new Uint8Array(part.slice(0, 32).match(/.{1,2}/g).map(a => parseInt(a, 16)));
                let ct = new Uint8Array(part.slice(32).match(/.{1,2}/g).map(a => parseInt(a, 16)));
                return new TextDecoder().decode(new Uint8Array(await crypto.subtle.decrypt({ name: "AES-GCM", iv }, this.key, ct)));
            },
            write: async function(key, value) {    
                let existenceChecks = key.split("/").slice(0, -1);
                if (existenceChecks[0] == "") existenceChecks = existenceChecks.slice(1);
                if (existenceChecks[existenceChecks.length - 1] == "") existenceChecks = existenceChecks.slice(0, -1);
                let basename = key.split("/").slice(-1)[0];
                let files = this.backend.files;
                for (let part of existenceChecks) {
                    files = files[part];
                    if (!files) throw new Error("No such directory");
                }
                if (typeof files[basename] === "object") throw new Error("Is a directory");
                let id = files[basename] || crypto.getRandomValues(new Uint8Array(64)).reduce((a, b) => a + b.toString(16).padStart(2, "0"), "");
                let newIV = crypto.getRandomValues(new Uint8Array(16));
                let newCT = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: newIV }, this.key, new TextEncoder().encode(value)));
                let newPart = new Uint8Array(newIV.length + newCT.length);
                newPart.set(newIV);
                newPart.set(newCT, newIV.length);
                newPart = newPart.reduce((a, b) => a + b.toString(16).padStart(2, "0"), "");
                await modules.core.idb.writePart(id, newPart);
                if (!files.hasOwnProperty(basename)) {
                    let HACKID = Math.floor(Math.random() * 1000000);
                    globalThis["HACK" + HACKID] = this.backend;
                    let HACK = "";
                    for (let a of key.split("/")) HACK = HACK + "[" + JSON.stringify(a) + "]";
                    eval("globalThis[" + JSON.stringify("HACK" + HACKID) + "].files" + HACK + " = " + JSON.stringify(id) + ";");
                    this.backend = globalThis["HACK" + HACKID];
                    delete globalThis["HACK" + HACKID];
                }
            },
            rm: async function(key) {
                let pathParts = key.split("/");
                if (pathParts[0] == "") pathParts = pathParts.slice(1);
                if (pathParts[pathParts.length - 1] == "") pathParts = pathParts.slice(0, -1);
                let files = this.backend.files;
                for (let part of pathParts) {
                    files = files[part];
                    if (!files) throw new Error("No such file or directory");
                }
                if (typeof files === "object" && Object.keys(files).length > 0) throw new Error("Non-empty directory");
                if (typeof files === "string") await modules.core.idb.removePart(files);
                let HACKID = Math.floor(Math.random() * 1000000);
                globalThis["HACK" + HACKID] = this.backend;
                let HACK = "";
                for (let a of key.split("/")) HACK = HACK + "[" + JSON.stringify(a) + "]";
                eval("delete globalThis[" + JSON.stringify("HACK" + HACKID) + "].files" + HACK + ";");
                eval("delete globalThis[" + JSON.stringify("HACK" + HACKID) + "].permissions[" + JSON.stringify(key) + "];");
                this.backend = globalThis["HACK" + HACKID];
                delete globalThis["HACK" + HACKID];
            },
            ls: async function(directory) {
                let pathParts = directory.split("/");
                if (pathParts[0] == "") pathParts = pathParts.slice(1);
                if (pathParts[pathParts.length - 1] == "") pathParts = pathParts.slice(0, -1);
                let files = this.backend.files;
                for (let part of pathParts) {
                    files = files[part];
                    if (!files) throw new Error("No such directory");
                }
                if (typeof files !== "object") throw new Error("Is a file");
                return Object.keys(files);
            },
            mkdir: async function(directory) {
                let existenceChecks = directory.split("/").slice(0, -1);
                if (existenceChecks[0] == "") existenceChecks = existenceChecks.slice(1);
                if (existenceChecks[existenceChecks.length - 1] == "") existenceChecks = existenceChecks.slice(0, -1);
                let files = this.backend.files;
                for (let part of existenceChecks) {
                    files = files[part];
                    if (!files) throw new Error("No such directory");
                }
                if (Object.keys(files).includes(directory.split("/").slice(-1)[0])) throw new Error("Directory already exists");
                let HACKID = Math.floor(Math.random() * 1000000);
                globalThis["HACK" + HACKID] = this.backend;
                let HACK = "";
                for (let a of directory.split("/")) HACK = HACK + "[" + JSON.stringify(a) + "]";
                eval("globalThis[" + JSON.stringify("HACK" + HACKID) + "].files" + HACK + " = {};");
                this.backend = globalThis["HACK" + HACKID];
                delete globalThis["HACK" + HACKID];
            },
            permissions: async function(file) {
                let properFile = file.split("/")
                if (properFile[0] == "") properFile = properFile.slice(1);
                if (properFile[properFile.length - 1] == "") properFile = properFile.slice(0, -1);
                properFile = properFile.join("/");
                return this.backend.permissions[properFile] || {
                    owner: "root",
                    group: "root",
                    world: "",
                };
            },
            chown: async function(file, owner) {
                let properFile = file.split("/")
                if (properFile[0] == "") properFile = properFile.slice(1);
                if (properFile[properFile.length - 1] == "") properFile = properFile.slice(0, -1);
                properFile = properFile.join("/");
                let backend = this.backend;
                let filePermissions = backend.permissions[properFile] || {
                    owner: "root",
                    group: "root",
                    world: "",
                };
                filePermissions.owner = owner;
                backend.permissions[properFile] = filePermissions;
                this.backend = backend;
            },
            chgrp: async function(file, group) {
                let properFile = file.split("/")
                if (properFile[0] == "") properFile = properFile.slice(1);
                if (properFile[properFile.length - 1] == "") properFile = properFile.slice(0, -1);
                properFile = properFile.join("/");
                let backend = this.backend;
                let filePermissions = backend.permissions[properFile] || {
                    owner: "root",
                    group: "root",
                    world: "",
                };
                filePermissions.group = group;
                backend.permissions[properFile] = filePermissions;
                this.backend = backend;
            },
            chmod: async function(file, permissions) {
                let properFile = file.split("/")
                if (properFile[0] == "") properFile = properFile.slice(1);
                if (properFile[properFile.length - 1] == "") properFile = properFile.slice(0, -1);
                properFile = properFile.join("/");
                let backend = this.backend;
                let filePermissions = backend.permissions[properFile] || {
                    owner: "root",
                    group: "root",
                    world: "",
                };
                filePermissions.world = permissions;
                backend.permissions[properFile] = filePermissions;
                this.backend = backend;
            },
            sync: async function() {
                await modules.core.disk.sync();
            },
            directory_supported: true,
            filesystem: "PCFS-AES",
            read_only: !!options.read_only,
            permissions_supported: true,
            partition: null,
            get backend() {
                if (!this.partition) this.partition = modules.core.disk.partition(options.partition);
                return this.partition.getData();
            },
            set backend(data) {
                this.partition.setData(data);
            },
            key: importedKey
        };
    };
    
    function ramMount(options) {
        return {
            read: async function(key) {
                let pathParts = key.split("/");
                if (pathParts[0] == "") pathParts = pathParts.slice(1);
                let files = this.backend.files;
                for (let part of pathParts) {
                    files = files[part];
                    if (!files) throw new Error("No such file");
                }
                if (typeof files === "object") throw new Error("Is a directory");
                return this.ramFiles.get(files);
            },
            write: async function(key, value) {    
                let existenceChecks = key.split("/").slice(0, -1);
                if (existenceChecks[0] == "") existenceChecks = existenceChecks.slice(1);
                if (existenceChecks[existenceChecks.length - 1] == "") existenceChecks = existenceChecks.slice(0, -1);
                let basename = key.split("/").slice(-1)[0];
                let files = this.backend.files;
                for (let part of existenceChecks) {
                    files = files[part];
                    if (!files) throw new Error("No such directory");
                }
                if (typeof files[basename] === "object") throw new Error("Is a directory");
                let id = files[basename] || crypto.getRandomValues(new Uint8Array(64)).reduce((a, b) => a + b.toString(16).padStart(2, "0"), "");
                this.ramFiles.set(id, value);
                if (!files.hasOwnProperty(basename)) {
                    let HACKID = Math.floor(Math.random() * 1000000);
                    globalThis["HACK" + HACKID] = this.backend;
                    let HACK = "";
                    for (let a of key.split("/")) HACK = HACK + "[" + JSON.stringify(a) + "]";
                    eval("globalThis[" + JSON.stringify("HACK" + HACKID) + "].files" + HACK + " = " + JSON.stringify(id) + ";");
                    this.backend = globalThis["HACK" + HACKID];
                    delete globalThis["HACK" + HACKID];
                }
            },
            rm: async function(key) {
                let pathParts = key.split("/");
                if (pathParts[0] == "") pathParts = pathParts.slice(1);
                if (pathParts[pathParts.length - 1] == "") pathParts = pathParts.slice(0, -1);
                let files = this.backend.files;
                for (let part of pathParts) {
                    files = files[part];
                    if (!files) throw new Error("No such file or directory");
                }
                if (typeof files === "object" && Object.keys(files).length > 0) throw new Error("Non-empty directory");
                if (typeof files === "string") this.ramFiles.delete(files);
                let HACKID = Math.floor(Math.random() * 1000000);
                globalThis["HACK" + HACKID] = this.backend;
                let HACK = "";
                for (let a of key.split("/")) HACK = HACK + "[" + JSON.stringify(a) + "]";
                eval("delete globalThis[" + JSON.stringify("HACK" + HACKID) + "].files" + HACK + ";");
                eval("delete globalThis[" + JSON.stringify("HACK" + HACKID) + "].permissions[" + JSON.stringify(key) + "];");
                this.backend = globalThis["HACK" + HACKID];
                delete globalThis["HACK" + HACKID];
            },
            ls: async function(directory) {
                let pathParts = directory.split("/");
                if (pathParts[0] == "") pathParts = pathParts.slice(1);
                if (pathParts[pathParts.length - 1] == "") pathParts = pathParts.slice(0, -1);
                let files = this.backend.files;
                for (let part of pathParts) {
                    files = files[part];
                    if (!files) throw new Error("No such directory");
                }
                if (typeof files !== "object") throw new Error("Is a file");
                return Object.keys(files);
            },
            mkdir: async function(directory) {
                let existenceChecks = directory.split("/").slice(0, -1);
                if (existenceChecks[0] == "") existenceChecks = existenceChecks.slice(1);
                if (existenceChecks[existenceChecks.length - 1] == "") existenceChecks = existenceChecks.slice(0, -1);
                let files = this.backend.files;
                for (let part of existenceChecks) {
                    files = files[part];
                    if (!files) throw new Error("No such directory");
                }
                if (Object.keys(files).includes(directory.split("/").slice(-1)[0])) throw new Error("Directory already exists");
                let HACKID = Math.floor(Math.random() * 1000000);
                globalThis["HACK" + HACKID] = this.backend;
                let HACK = "";
                for (let a of directory.split("/")) HACK = HACK + "[" + JSON.stringify(a) + "]";
                eval("globalThis[" + JSON.stringify("HACK" + HACKID) + "].files" + HACK + " = {};");
                this.backend = globalThis["HACK" + HACKID];
                delete globalThis["HACK" + HACKID];
            },
            permissions: async function(file) {
                let properFile = file.split("/")
                if (properFile[0] == "") properFile = properFile.slice(1);
                if (properFile[properFile.length - 1] == "") properFile = properFile.slice(0, -1);
                properFile = properFile.join("/");
                return this.backend.permissions[properFile] || {
                    owner: "root",
                    group: "root",
                    world: "",
                };
            },
            chown: async function(file, owner) {
                let properFile = file.split("/")
                if (properFile[0] == "") properFile = properFile.slice(1);
                if (properFile[properFile.length - 1] == "") properFile = properFile.slice(0, -1);
                properFile = properFile.join("/");
                let backend = this.backend;
                let filePermissions = backend.permissions[properFile] || {
                    owner: "root",
                    group: "root",
                    world: "",
                };
                filePermissions.owner = owner;
                backend.permissions[properFile] = filePermissions;
                this.backend = backend;
            },
            chgrp: async function(file, group) {
                let properFile = file.split("/")
                if (properFile[0] == "") properFile = properFile.slice(1);
                if (properFile[properFile.length - 1] == "") properFile = properFile.slice(0, -1);
                properFile = properFile.join("/");
                let backend = this.backend;
                let filePermissions = backend.permissions[properFile] || {
                    owner: "root",
                    group: "root",
                    world: "",
                };
                filePermissions.group = group;
                backend.permissions[properFile] = filePermissions;
                this.backend = backend;
            },
            chmod: async function(file, permissions) {
                let properFile = file.split("/")
                if (properFile[0] == "") properFile = properFile.slice(1);
                if (properFile[properFile.length - 1] == "") properFile = properFile.slice(0, -1);
                properFile = properFile.join("/");
                let backend = this.backend;
                let filePermissions = backend.permissions[properFile] || {
                    owner: "root",
                    group: "root",
                    world: "",
                };
                filePermissions.world = permissions;
                backend.permissions[properFile] = filePermissions;
                this.backend = backend;
            },
            sync: () => true,
            directory_supported: true,
            read_only: !!options.read_only,
            filesystem: "extramfs",
            permissions_supported: true,
            backend: options.type == "run" ? { files: { run: {} }, permissions: {
                run: {
                    owner: "root",
                    group: "root",
                    world: "rwx"
                }
            }} : { files: {}, permissions: {} },
            ramFiles: new Map()
        };
    }
    
    fs.mounts["ram"] = ramMount({
        type: "run"
    });
    modules.mounts = {
        PCFSiDBMount,
        PCFSiDBAESCryptMount,
        ramMount
    };
    modules.fs = fs;
    modules.defaultSystem = "ram";
}

function sampleFormatToEncryptedPCFS(partition, monokey = true) {
    let salt = crypto.getRandomValues(new Uint8Array(32));
    modules.core.disk.partition(partition).setData({
        files: {},
        permissions: {},
        cryptodata: {
            salt: Array.from(salt).map(a => a.toString(16).padStart(2, "0")).join(""),
            passwordLockingInitial: monokey
        }
    });
}

loadFs();
// 01-fsck.js
async function fsck() {
    // @pcos-app-mode native
    function println(str) {
        modules.core.tty_bios_api.println(str);
        return new Promise(function(resolve) {
            requestAnimationFrame(resolve);
        })
    }
    try {
        await modules.fs.read(modules.defaultSystem + "/.fsck");
        await modules.fs.rm(modules.defaultSystem + "/.fsck");
    } catch {
        await println("Skipping file system checking.");
        return;
    }
    async function scanLLDA() {
        let fs = modules.fs;
        if (fs.mounts[modules.defaultSystem].partition.getData) {
            let llda = fs.mounts[modules.defaultSystem].partition.getData().files;
            llda = Object.values(llda);
            while (llda.some(a => typeof a === "object")) llda = llda.map(a => typeof a === "object" ? Object.values(a) : a).flat(); 
            return llda;
        } else {
            await println("Low-level disk access is impossible.");
            return "abort";
        }
    }
    await println("A file system check has been requested.");
    await println("Scanning for file points.");
    let lldaPoints = await scanLLDA();
    if (lldaPoints === "abort") {
        await println("Skipping file system checking.");
        return;
    }
    await println("File points found: " + lldaPoints.length);
    await println("Reading indexedDB keys.");
    let idb_keys = modules.core.idb._db.transaction("disk").objectStore("disk").getAllKeys();
    idb_keys = await new Promise(function(resolve) {
        idb_keys.onsuccess = () => resolve(idb_keys.result);
    });
    idb_keys.splice(idb_keys.indexOf("disk"), 1);
    await println("IndexedDB keys found: " + idb_keys.length);
    let missingFiles = idb_keys.filter(a => !lldaPoints.includes(a));
    await println("Missing files: " + missingFiles.length);
    try {
        await modules.fs.mkdir(modules.defaultSystem + "/lost+found");
        await println("Created lost+found directory.");
    } catch {
        await println("Lost+found directory already exists.");
    }
    let llda = modules.fs.mounts[modules.defaultSystem].partition.getData();
    for (let file of missingFiles) {
        await println("Moving " + file + " to lost+found.");
        llda.files["lost+found"][file] = file;
    }
    await println("Saving modified file table.");
    modules.fs.mounts[modules.defaultSystem].partition.setData(llda);
    await modules.core.idb.sync();
    await println("File system check complete.");
    if (missingFiles.length > 0) {
        await println("Inconsistencies were resolved. Press Enter to boot system.");
        await modules.core.tty_bios_api.inputLine();
    }
}
await fsck();
// 02-ui.js
function loadUi() {
    // @pcos-app-mode native
    let uiStyle = document.createElement("style");
    uiStyle.innerHTML = `.icon {
        border: 1px solid #030303;
        margin: 4px;
        box-sizing: border-box;
        width: 80px;
        height: 85px;
        padding: 6px 13px 0px;
    }
    
    body {
        overflow: hidden;
        background: black;
        cursor: none;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }

    .window {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background-color: #f0f0f0;
        border: 1px solid #ccc;
        box-shadow: 0 0 5px rgba(0, 0, 0, 0.3);
        z-index: 1;
        resize: both;
        width: 320px;
        height: 180px;
        display: flex;
        flex-direction: column;
        overflow: auto;
    }

    .window.dark {
        background-color: #373737;
        color: white;
        border: 1px solid #1b1b1b;
    }

    .window .title-bar {
        padding: 6px;
        background-color: #ccc;
        cursor: move;
        display: flex;
        flex: 1;
    }

    .window.dark .title-bar {
        background-color: #1b1b1b;
    }

    .window .button {
        cursor: pointer;
        padding: 4px;
        border: none;
        flex: 1;
        margin: 0 0 0 2px;
    }

    .window .close-button {
        background: red;
        color: white;
    }

    .window .title-displayer {
        flex: 100;
    }

    .window .close-button:disabled {
        opacity: 25%;
    }

    .window.fullscreen .resize-handle {
        display: none;
    }

    .window.fullscreen {
        width: 100% !important;
        height: 100% !important;
        position: fixed;
        top: 0 !important;
        left: 0 !important;
        transform: none;
        resize: none;
        border: none;
        box-shadow: none;
    }

    .window.fullscreen .title-bar {
        cursor: default;
    }

    .window .content {
        flex: 100;
        overflow: auto;
        position: relative;
    }

    .session {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: black;
        cursor: default;
    }
    .hidden {
        display: none;
    }`;
    document.head.appendChild(uiStyle);

    function createWindow(sessionId, makeFullscreenOnAllScreens) {
        let fullscreen = makeFullscreenOnAllScreens || matchMedia("(max-width: 600px)").matches;
        let id = crypto.getRandomValues(new Uint8Array(64)).reduce((a, b) => a + b.toString(16).padStart(2, "0"), "");
        let windowDiv = document.createElement('div');
        windowDiv.className = 'window ' + (fullscreen ? "fullscreen" : "");
        if (session.attrib(sessionId, "dark")) windowDiv.classList.add("dark");
        windowDiv.id = 'window-' + id;
        let titleBar = document.createElement('div');
        titleBar.className = 'title-bar';
        let title = document.createElement('span');
        title.className = 'title-displayer';
        let closeButton = document.createElement('button');
        closeButton.className = 'button close-button';
        closeButton.innerHTML = '&#10005;';
        titleBar.appendChild(title);
        if (!fullscreen) {
            let fullscreenButton = document.createElement('button');
            fullscreenButton.className = 'button';
            fullscreenButton.innerHTML = '&#x25a1;';
            fullscreenButton.onclick = function() {
                windowDiv.classList.toggle("fullscreen");
            }
            titleBar.appendChild(fullscreenButton);
        }
        titleBar.appendChild(closeButton);
        windowDiv.appendChild(titleBar);
        let content = document.createElement('div');
        content.className = 'content';
        windowDiv.appendChild(content);
        session.tracker[sessionId].html.appendChild(windowDiv);
        if (!fullscreen) makeDraggable(windowDiv, titleBar);
        return {
            windowDiv,
            title,
            closeButton,
            content,
            sessionId
        };
    }

    function makeDraggable(windowDiv, titleBar) {
        let pos1 = 0,
            pos2 = 0,
            pos3 = 0,
            pos4 = 0;

        titleBar.onmousedown = dragMouseDown;

        function dragMouseDown(e) {
            e = e || window.event;
            e.preventDefault();
            pos3 = e.clientX;
            pos4 = e.clientY;

            document.onmouseup = closeDragElement;
            document.onmousemove = elementDrag;
        }

        function elementDrag(e) {
            e = e || window.event;
            e.preventDefault();
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;

            if (!windowDiv.classList.contains("fullscreen")) {
                windowDiv.style.top = windowDiv.offsetTop - pos2 + 'px';
                windowDiv.style.left = windowDiv.offsetLeft - pos1 + 'px';
            }
        }

        function closeDragElement() {
            document.onmouseup = null;
            document.onmousemove = null;
        }
    }

    let session = {
        mksession: function() {
            let identifier = crypto.getRandomValues(new Uint8Array(64)).reduce((a, b) => a + b.toString(16).padStart(2, "0"), "");
            let session = document.createElement('div');
            session.className = "session hidden";
            document.body.appendChild(session);
            this.tracker[identifier] = {
                html: session,
                attrib: {}
            };
            return identifier;
        },
        rmsession: function(session) {
            this.tracker[session].html.remove();
            delete this.tracker[session];
        },
        muteAllSessions: function() {
            for (let session in this.tracker) this.tracker[session].html.classList.add("hidden");
            this.active = null;
        },
        activateSession: function(session) {
            this.tracker[this.active]?.html?.classList?.add("hidden");
            this.tracker[session].html.classList.remove("hidden");
            this.active = session;
        },
        attrib: function(session, key, val) {
            if (val !== undefined) this.tracker[session].attrib[key] = val;
            if (key !== undefined) return this.tracker[session].attrib[key];
            return this.tracker[session].attrib;
        },
        tracker: {},
        active: null
    }

    modules.window = createWindow;
    modules.session = session;

    modules.session.systemSession = session.mksession();
    session.muteAllSessions();
    session.activateSession(modules.session.systemSession);
    modules.startupWindow = modules.window(modules.session.systemSession);
    modules.startupWindow.title.innerText = "PCOS 3";
    modules.startupWindow.content.style.padding = "8px";
    modules.startupWindow.closeButton.disabled = true;
    modules.startupWindow.content.innerText = "PCOS is starting...";
}

loadUi();
// 03-xterm.js
function xterm_export() {
   // xterm, version 5.3.0
   // @pcos-app-mode native
   let xterm_style = document.createElement("style");
   xterm_style.innerHTML = `/**
   * Copyright (c) 2014 The xterm.js authors. All rights reserved.
   * Copyright (c) 2012-2013, Christopher Jeffrey (MIT License)
   * https://github.com/chjj/term.js
   * @license MIT
   *
   * Permission is hereby granted, free of charge, to any person obtaining a copy
   * of this software and associated documentation files (the "Software"), to deal
   * in the Software without restriction, including without limitation the rights
   * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
   * copies of the Software, and to permit persons to whom the Software is
   * furnished to do so, subject to the following conditions:
   *
   * The above copyright notice and this permission notice shall be included in
   * all copies or substantial portions of the Software.
   *
   * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
   * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
   * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
   * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
   * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
   * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
   * THE SOFTWARE.
   *
   * Originally forked from (with the author's permission):
   *   Fabrice Bellard's javascript vt100 for jslinux:
   *   http://bellard.org/jslinux/
   *   Copyright (c) 2011 Fabrice Bellard
   *   The original design remains. The terminal itself
   *   has been extended to include xterm CSI codes, among
   *   other features.
   */
  
  /**
   *  Default styles for xterm.js
   */
  
  .xterm {
      cursor: text;
      position: relative;
      user-select: none;
      -ms-user-select: none;
      -webkit-user-select: none;
  }
  
  .xterm.focus,
  .xterm:focus {
      outline: none;
  }
  
  .xterm .xterm-helpers {
      position: absolute;
      top: 0;
      /**
       * The z-index of the helpers must be higher than the canvases in order for
       * IMEs to appear on top.
       */
      z-index: 5;
  }
  
  .xterm .xterm-helper-textarea {
      padding: 0;
      border: 0;
      margin: 0;
      /* Move textarea out of the screen to the far left, so that the cursor is not visible */
      position: absolute;
      opacity: 0;
      left: -9999em;
      top: 0;
      width: 0;
      height: 0;
      z-index: -5;
      /** Prevent wrapping so the IME appears against the textarea at the correct position */
      white-space: nowrap;
      overflow: hidden;
      resize: none;
  }
  
  .xterm .composition-view {
      /* TODO: Composition position got messed up somewhere */
      background: #000;
      color: #FFF;
      display: none;
      position: absolute;
      white-space: nowrap;
      z-index: 1;
  }
  
  .xterm .composition-view.active {
      display: block;
  }
  
  .xterm .xterm-viewport {
      /* On OS X this is required in order for the scroll bar to appear fully opaque */
      background-color: #000;
      overflow-y: scroll;
      cursor: default;
      position: absolute;
      right: 0;
      left: 0;
      top: 0;
      bottom: 0;
  }
  
  .xterm .xterm-screen {
      position: relative;
  }
  
  .xterm .xterm-screen canvas {
      position: absolute;
      left: 0;
      top: 0;
  }
  
  .xterm .xterm-scroll-area {
      visibility: hidden;
  }
  
  .xterm-char-measure-element {
      display: inline-block;
      visibility: hidden;
      position: absolute;
      top: 0;
      left: -9999em;
      line-height: normal;
  }
  
  .xterm.enable-mouse-events {
      /* When mouse events are enabled (eg. tmux), revert to the standard pointer cursor */
      cursor: default;
  }
  
  .xterm.xterm-cursor-pointer,
  .xterm .xterm-cursor-pointer {
      cursor: pointer;
  }
  
  .xterm.column-select.focus {
      /* Column selection mode */
      cursor: crosshair;
  }
  
  .xterm .xterm-accessibility,
  .xterm .xterm-message {
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      right: 0;
      z-index: 10;
      color: transparent;
      pointer-events: none;
  }
  
  .xterm .live-region {
      position: absolute;
      left: -9999px;
      width: 1px;
      height: 1px;
      overflow: hidden;
  }
  
  .xterm-dim {
      /* Dim should not apply to background, so the opacity of the foreground color is applied
       * explicitly in the generated class and reset to 1 here */
      opacity: 1 !important;
  }
  
  .xterm-underline-1 { text-decoration: underline; }
  .xterm-underline-2 { text-decoration: double underline; }
  .xterm-underline-3 { text-decoration: wavy underline; }
  .xterm-underline-4 { text-decoration: dotted underline; }
  .xterm-underline-5 { text-decoration: dashed underline; }
  
  .xterm-overline {
      text-decoration: overline;
  }
  
  .xterm-overline.xterm-underline-1 { text-decoration: overline underline; }
  .xterm-overline.xterm-underline-2 { text-decoration: overline double underline; }
  .xterm-overline.xterm-underline-3 { text-decoration: overline wavy underline; }
  .xterm-overline.xterm-underline-4 { text-decoration: overline dotted underline; }
  .xterm-overline.xterm-underline-5 { text-decoration: overline dashed underline; }
  
  .xterm-strikethrough {
      text-decoration: line-through;
  }
  
  .xterm-screen .xterm-decoration-container .xterm-decoration {
     z-index: 6;
     position: absolute;
  }
  
  .xterm-screen .xterm-decoration-container .xterm-decoration.xterm-decoration-top-layer {
     z-index: 7;
  }
  
  .xterm-decoration-overview-ruler {
      z-index: 8;
      position: absolute;
      top: 0;
      right: 0;
      pointer-events: none;
  }
  
  .xterm-decoration-top {
      z-index: 2;
      position: relative;
  }
  `;
   document.head.appendChild(xterm_style);
   !function(e,t){if("object"==typeof exports&&"object"==typeof module)module.exports=t();else if("function"==typeof define&&define.amd)define([],t);else{var i=t();for(var s in i)("object"==typeof exports?exports:e)[s]=i[s]}}(self,(()=>(()=>{"use strict";var e={4567:function(e,t,i){var s=this&&this.__decorate||function(e,t,i,s){var r,n=arguments.length,o=n<3?t:null===s?s=Object.getOwnPropertyDescriptor(t,i):s;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)o=Reflect.decorate(e,t,i,s);else for(var a=e.length-1;a>=0;a--)(r=e[a])&&(o=(n<3?r(o):n>3?r(t,i,o):r(t,i))||o);return n>3&&o&&Object.defineProperty(t,i,o),o},r=this&&this.__param||function(e,t){return function(i,s){t(i,s,e)}};Object.defineProperty(t,"__esModule",{value:!0}),t.AccessibilityManager=void 0;const n=i(9042),o=i(6114),a=i(9924),h=i(844),c=i(5596),l=i(4725),d=i(3656);let _=t.AccessibilityManager=class extends h.Disposable{constructor(e,t){super(),this._terminal=e,this._renderService=t,this._liveRegionLineCount=0,this._charsToConsume=[],this._charsToAnnounce="",this._accessibilityContainer=document.createElement("div"),this._accessibilityContainer.classList.add("xterm-accessibility"),this._rowContainer=document.createElement("div"),this._rowContainer.setAttribute("role","list"),this._rowContainer.classList.add("xterm-accessibility-tree"),this._rowElements=[];for(let e=0;e<this._terminal.rows;e++)this._rowElements[e]=this._createAccessibilityTreeNode(),this._rowContainer.appendChild(this._rowElements[e]);if(this._topBoundaryFocusListener=e=>this._handleBoundaryFocus(e,0),this._bottomBoundaryFocusListener=e=>this._handleBoundaryFocus(e,1),this._rowElements[0].addEventListener("focus",this._topBoundaryFocusListener),this._rowElements[this._rowElements.length-1].addEventListener("focus",this._bottomBoundaryFocusListener),this._refreshRowsDimensions(),this._accessibilityContainer.appendChild(this._rowContainer),this._liveRegion=document.createElement("div"),this._liveRegion.classList.add("live-region"),this._liveRegion.setAttribute("aria-live","assertive"),this._accessibilityContainer.appendChild(this._liveRegion),this._liveRegionDebouncer=this.register(new a.TimeBasedDebouncer(this._renderRows.bind(this))),!this._terminal.element)throw new Error("Cannot enable accessibility before Terminal.open");this._terminal.element.insertAdjacentElement("afterbegin",this._accessibilityContainer),this.register(this._terminal.onResize((e=>this._handleResize(e.rows)))),this.register(this._terminal.onRender((e=>this._refreshRows(e.start,e.end)))),this.register(this._terminal.onScroll((()=>this._refreshRows()))),this.register(this._terminal.onA11yChar((e=>this._handleChar(e)))),this.register(this._terminal.onLineFeed((()=>this._handleChar("\n")))),this.register(this._terminal.onA11yTab((e=>this._handleTab(e)))),this.register(this._terminal.onKey((e=>this._handleKey(e.key)))),this.register(this._terminal.onBlur((()=>this._clearLiveRegion()))),this.register(this._renderService.onDimensionsChange((()=>this._refreshRowsDimensions()))),this._screenDprMonitor=new c.ScreenDprMonitor(window),this.register(this._screenDprMonitor),this._screenDprMonitor.setListener((()=>this._refreshRowsDimensions())),this.register((0,d.addDisposableDomListener)(window,"resize",(()=>this._refreshRowsDimensions()))),this._refreshRows(),this.register((0,h.toDisposable)((()=>{this._accessibilityContainer.remove(),this._rowElements.length=0})))}_handleTab(e){for(let t=0;t<e;t++)this._handleChar(" ")}_handleChar(e){this._liveRegionLineCount<21&&(this._charsToConsume.length>0?this._charsToConsume.shift()!==e&&(this._charsToAnnounce+=e):this._charsToAnnounce+=e,"\n"===e&&(this._liveRegionLineCount++,21===this._liveRegionLineCount&&(this._liveRegion.textContent+=n.tooMuchOutput)),o.isMac&&this._liveRegion.textContent&&this._liveRegion.textContent.length>0&&!this._liveRegion.parentNode&&setTimeout((()=>{this._accessibilityContainer.appendChild(this._liveRegion)}),0))}_clearLiveRegion(){this._liveRegion.textContent="",this._liveRegionLineCount=0,o.isMac&&this._liveRegion.remove()}_handleKey(e){this._clearLiveRegion(),/\p{Control}/u.test(e)||this._charsToConsume.push(e)}_refreshRows(e,t){this._liveRegionDebouncer.refresh(e,t,this._terminal.rows)}_renderRows(e,t){const i=this._terminal.buffer,s=i.lines.length.toString();for(let r=e;r<=t;r++){const e=i.translateBufferLineToString(i.ydisp+r,!0),t=(i.ydisp+r+1).toString(),n=this._rowElements[r];n&&(0===e.length?n.innerText=" ":n.textContent=e,n.setAttribute("aria-posinset",t),n.setAttribute("aria-setsize",s))}this._announceCharacters()}_announceCharacters(){0!==this._charsToAnnounce.length&&(this._liveRegion.textContent+=this._charsToAnnounce,this._charsToAnnounce="")}_handleBoundaryFocus(e,t){const i=e.target,s=this._rowElements[0===t?1:this._rowElements.length-2];if(i.getAttribute("aria-posinset")===(0===t?"1":`${this._terminal.buffer.lines.length}`))return;if(e.relatedTarget!==s)return;let r,n;if(0===t?(r=i,n=this._rowElements.pop(),this._rowContainer.removeChild(n)):(r=this._rowElements.shift(),n=i,this._rowContainer.removeChild(r)),r.removeEventListener("focus",this._topBoundaryFocusListener),n.removeEventListener("focus",this._bottomBoundaryFocusListener),0===t){const e=this._createAccessibilityTreeNode();this._rowElements.unshift(e),this._rowContainer.insertAdjacentElement("afterbegin",e)}else{const e=this._createAccessibilityTreeNode();this._rowElements.push(e),this._rowContainer.appendChild(e)}this._rowElements[0].addEventListener("focus",this._topBoundaryFocusListener),this._rowElements[this._rowElements.length-1].addEventListener("focus",this._bottomBoundaryFocusListener),this._terminal.scrollLines(0===t?-1:1),this._rowElements[0===t?1:this._rowElements.length-2].focus(),e.preventDefault(),e.stopImmediatePropagation()}_handleResize(e){this._rowElements[this._rowElements.length-1].removeEventListener("focus",this._bottomBoundaryFocusListener);for(let e=this._rowContainer.children.length;e<this._terminal.rows;e++)this._rowElements[e]=this._createAccessibilityTreeNode(),this._rowContainer.appendChild(this._rowElements[e]);for(;this._rowElements.length>e;)this._rowContainer.removeChild(this._rowElements.pop());this._rowElements[this._rowElements.length-1].addEventListener("focus",this._bottomBoundaryFocusListener),this._refreshRowsDimensions()}_createAccessibilityTreeNode(){const e=document.createElement("div");return e.setAttribute("role","listitem"),e.tabIndex=-1,this._refreshRowDimensions(e),e}_refreshRowsDimensions(){if(this._renderService.dimensions.css.cell.height){this._accessibilityContainer.style.width=`${this._renderService.dimensions.css.canvas.width}px`,this._rowElements.length!==this._terminal.rows&&this._handleResize(this._terminal.rows);for(let e=0;e<this._terminal.rows;e++)this._refreshRowDimensions(this._rowElements[e])}}_refreshRowDimensions(e){e.style.height=`${this._renderService.dimensions.css.cell.height}px`}};t.AccessibilityManager=_=s([r(1,l.IRenderService)],_)},3614:(e,t)=>{function i(e){return e.replace(/\r?\n/g,"\r")}function s(e,t){return t?"[200~"+e+"[201~":e}function r(e,t,r,n){e=s(e=i(e),r.decPrivateModes.bracketedPasteMode&&!0!==n.rawOptions.ignoreBracketedPasteMode),r.triggerDataEvent(e,!0),t.value=""}function n(e,t,i){const s=i.getBoundingClientRect(),r=e.clientX-s.left-10,n=e.clientY-s.top-10;t.style.width="20px",t.style.height="20px",t.style.left=`${r}px`,t.style.top=`${n}px`,t.style.zIndex="1000",t.focus()}Object.defineProperty(t,"__esModule",{value:!0}),t.rightClickHandler=t.moveTextAreaUnderMouseCursor=t.paste=t.handlePasteEvent=t.copyHandler=t.bracketTextForPaste=t.prepareTextForTerminal=void 0,t.prepareTextForTerminal=i,t.bracketTextForPaste=s,t.copyHandler=function(e,t){e.clipboardData&&e.clipboardData.setData("text/plain",t.selectionText),e.preventDefault()},t.handlePasteEvent=function(e,t,i,s){e.stopPropagation(),e.clipboardData&&r(e.clipboardData.getData("text/plain"),t,i,s)},t.paste=r,t.moveTextAreaUnderMouseCursor=n,t.rightClickHandler=function(e,t,i,s,r){n(e,t,i),r&&s.rightClickSelect(e),t.value=s.selectionText,t.select()}},7239:(e,t,i)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.ColorContrastCache=void 0;const s=i(1505);t.ColorContrastCache=class{constructor(){this._color=new s.TwoKeyMap,this._css=new s.TwoKeyMap}setCss(e,t,i){this._css.set(e,t,i)}getCss(e,t){return this._css.get(e,t)}setColor(e,t,i){this._color.set(e,t,i)}getColor(e,t){return this._color.get(e,t)}clear(){this._color.clear(),this._css.clear()}}},3656:(e,t)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.addDisposableDomListener=void 0,t.addDisposableDomListener=function(e,t,i,s){e.addEventListener(t,i,s);let r=!1;return{dispose:()=>{r||(r=!0,e.removeEventListener(t,i,s))}}}},6465:function(e,t,i){var s=this&&this.__decorate||function(e,t,i,s){var r,n=arguments.length,o=n<3?t:null===s?s=Object.getOwnPropertyDescriptor(t,i):s;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)o=Reflect.decorate(e,t,i,s);else for(var a=e.length-1;a>=0;a--)(r=e[a])&&(o=(n<3?r(o):n>3?r(t,i,o):r(t,i))||o);return n>3&&o&&Object.defineProperty(t,i,o),o},r=this&&this.__param||function(e,t){return function(i,s){t(i,s,e)}};Object.defineProperty(t,"__esModule",{value:!0}),t.Linkifier2=void 0;const n=i(3656),o=i(8460),a=i(844),h=i(2585);let c=t.Linkifier2=class extends a.Disposable{get currentLink(){return this._currentLink}constructor(e){super(),this._bufferService=e,this._linkProviders=[],this._linkCacheDisposables=[],this._isMouseOut=!0,this._wasResized=!1,this._activeLine=-1,this._onShowLinkUnderline=this.register(new o.EventEmitter),this.onShowLinkUnderline=this._onShowLinkUnderline.event,this._onHideLinkUnderline=this.register(new o.EventEmitter),this.onHideLinkUnderline=this._onHideLinkUnderline.event,this.register((0,a.getDisposeArrayDisposable)(this._linkCacheDisposables)),this.register((0,a.toDisposable)((()=>{this._lastMouseEvent=void 0}))),this.register(this._bufferService.onResize((()=>{this._clearCurrentLink(),this._wasResized=!0})))}registerLinkProvider(e){return this._linkProviders.push(e),{dispose:()=>{const t=this._linkProviders.indexOf(e);-1!==t&&this._linkProviders.splice(t,1)}}}attachToDom(e,t,i){this._element=e,this._mouseService=t,this._renderService=i,this.register((0,n.addDisposableDomListener)(this._element,"mouseleave",(()=>{this._isMouseOut=!0,this._clearCurrentLink()}))),this.register((0,n.addDisposableDomListener)(this._element,"mousemove",this._handleMouseMove.bind(this))),this.register((0,n.addDisposableDomListener)(this._element,"mousedown",this._handleMouseDown.bind(this))),this.register((0,n.addDisposableDomListener)(this._element,"mouseup",this._handleMouseUp.bind(this)))}_handleMouseMove(e){if(this._lastMouseEvent=e,!this._element||!this._mouseService)return;const t=this._positionFromMouseEvent(e,this._element,this._mouseService);if(!t)return;this._isMouseOut=!1;const i=e.composedPath();for(let e=0;e<i.length;e++){const t=i[e];if(t.classList.contains("xterm"))break;if(t.classList.contains("xterm-hover"))return}this._lastBufferCell&&t.x===this._lastBufferCell.x&&t.y===this._lastBufferCell.y||(this._handleHover(t),this._lastBufferCell=t)}_handleHover(e){if(this._activeLine!==e.y||this._wasResized)return this._clearCurrentLink(),this._askForLink(e,!1),void(this._wasResized=!1);this._currentLink&&this._linkAtPosition(this._currentLink.link,e)||(this._clearCurrentLink(),this._askForLink(e,!0))}_askForLink(e,t){var i,s;this._activeProviderReplies&&t||(null===(i=this._activeProviderReplies)||void 0===i||i.forEach((e=>{null==e||e.forEach((e=>{e.link.dispose&&e.link.dispose()}))})),this._activeProviderReplies=new Map,this._activeLine=e.y);let r=!1;for(const[i,n]of this._linkProviders.entries())t?(null===(s=this._activeProviderReplies)||void 0===s?void 0:s.get(i))&&(r=this._checkLinkProviderResult(i,e,r)):n.provideLinks(e.y,(t=>{var s,n;if(this._isMouseOut)return;const o=null==t?void 0:t.map((e=>({link:e})));null===(s=this._activeProviderReplies)||void 0===s||s.set(i,o),r=this._checkLinkProviderResult(i,e,r),(null===(n=this._activeProviderReplies)||void 0===n?void 0:n.size)===this._linkProviders.length&&this._removeIntersectingLinks(e.y,this._activeProviderReplies)}))}_removeIntersectingLinks(e,t){const i=new Set;for(let s=0;s<t.size;s++){const r=t.get(s);if(r)for(let t=0;t<r.length;t++){const s=r[t],n=s.link.range.start.y<e?0:s.link.range.start.x,o=s.link.range.end.y>e?this._bufferService.cols:s.link.range.end.x;for(let e=n;e<=o;e++){if(i.has(e)){r.splice(t--,1);break}i.add(e)}}}}_checkLinkProviderResult(e,t,i){var s;if(!this._activeProviderReplies)return i;const r=this._activeProviderReplies.get(e);let n=!1;for(let t=0;t<e;t++)this._activeProviderReplies.has(t)&&!this._activeProviderReplies.get(t)||(n=!0);if(!n&&r){const e=r.find((e=>this._linkAtPosition(e.link,t)));e&&(i=!0,this._handleNewLink(e))}if(this._activeProviderReplies.size===this._linkProviders.length&&!i)for(let e=0;e<this._activeProviderReplies.size;e++){const r=null===(s=this._activeProviderReplies.get(e))||void 0===s?void 0:s.find((e=>this._linkAtPosition(e.link,t)));if(r){i=!0,this._handleNewLink(r);break}}return i}_handleMouseDown(){this._mouseDownLink=this._currentLink}_handleMouseUp(e){if(!this._element||!this._mouseService||!this._currentLink)return;const t=this._positionFromMouseEvent(e,this._element,this._mouseService);t&&this._mouseDownLink===this._currentLink&&this._linkAtPosition(this._currentLink.link,t)&&this._currentLink.link.activate(e,this._currentLink.link.text)}_clearCurrentLink(e,t){this._element&&this._currentLink&&this._lastMouseEvent&&(!e||!t||this._currentLink.link.range.start.y>=e&&this._currentLink.link.range.end.y<=t)&&(this._linkLeave(this._element,this._currentLink.link,this._lastMouseEvent),this._currentLink=void 0,(0,a.disposeArray)(this._linkCacheDisposables))}_handleNewLink(e){if(!this._element||!this._lastMouseEvent||!this._mouseService)return;const t=this._positionFromMouseEvent(this._lastMouseEvent,this._element,this._mouseService);t&&this._linkAtPosition(e.link,t)&&(this._currentLink=e,this._currentLink.state={decorations:{underline:void 0===e.link.decorations||e.link.decorations.underline,pointerCursor:void 0===e.link.decorations||e.link.decorations.pointerCursor},isHovered:!0},this._linkHover(this._element,e.link,this._lastMouseEvent),e.link.decorations={},Object.defineProperties(e.link.decorations,{pointerCursor:{get:()=>{var e,t;return null===(t=null===(e=this._currentLink)||void 0===e?void 0:e.state)||void 0===t?void 0:t.decorations.pointerCursor},set:e=>{var t,i;(null===(t=this._currentLink)||void 0===t?void 0:t.state)&&this._currentLink.state.decorations.pointerCursor!==e&&(this._currentLink.state.decorations.pointerCursor=e,this._currentLink.state.isHovered&&(null===(i=this._element)||void 0===i||i.classList.toggle("xterm-cursor-pointer",e)))}},underline:{get:()=>{var e,t;return null===(t=null===(e=this._currentLink)||void 0===e?void 0:e.state)||void 0===t?void 0:t.decorations.underline},set:t=>{var i,s,r;(null===(i=this._currentLink)||void 0===i?void 0:i.state)&&(null===(r=null===(s=this._currentLink)||void 0===s?void 0:s.state)||void 0===r?void 0:r.decorations.underline)!==t&&(this._currentLink.state.decorations.underline=t,this._currentLink.state.isHovered&&this._fireUnderlineEvent(e.link,t))}}}),this._renderService&&this._linkCacheDisposables.push(this._renderService.onRenderedViewportChange((e=>{if(!this._currentLink)return;const t=0===e.start?0:e.start+1+this._bufferService.buffer.ydisp,i=this._bufferService.buffer.ydisp+1+e.end;if(this._currentLink.link.range.start.y>=t&&this._currentLink.link.range.end.y<=i&&(this._clearCurrentLink(t,i),this._lastMouseEvent&&this._element)){const e=this._positionFromMouseEvent(this._lastMouseEvent,this._element,this._mouseService);e&&this._askForLink(e,!1)}}))))}_linkHover(e,t,i){var s;(null===(s=this._currentLink)||void 0===s?void 0:s.state)&&(this._currentLink.state.isHovered=!0,this._currentLink.state.decorations.underline&&this._fireUnderlineEvent(t,!0),this._currentLink.state.decorations.pointerCursor&&e.classList.add("xterm-cursor-pointer")),t.hover&&t.hover(i,t.text)}_fireUnderlineEvent(e,t){const i=e.range,s=this._bufferService.buffer.ydisp,r=this._createLinkUnderlineEvent(i.start.x-1,i.start.y-s-1,i.end.x,i.end.y-s-1,void 0);(t?this._onShowLinkUnderline:this._onHideLinkUnderline).fire(r)}_linkLeave(e,t,i){var s;(null===(s=this._currentLink)||void 0===s?void 0:s.state)&&(this._currentLink.state.isHovered=!1,this._currentLink.state.decorations.underline&&this._fireUnderlineEvent(t,!1),this._currentLink.state.decorations.pointerCursor&&e.classList.remove("xterm-cursor-pointer")),t.leave&&t.leave(i,t.text)}_linkAtPosition(e,t){const i=e.range.start.y*this._bufferService.cols+e.range.start.x,s=e.range.end.y*this._bufferService.cols+e.range.end.x,r=t.y*this._bufferService.cols+t.x;return i<=r&&r<=s}_positionFromMouseEvent(e,t,i){const s=i.getCoords(e,t,this._bufferService.cols,this._bufferService.rows);if(s)return{x:s[0],y:s[1]+this._bufferService.buffer.ydisp}}_createLinkUnderlineEvent(e,t,i,s,r){return{x1:e,y1:t,x2:i,y2:s,cols:this._bufferService.cols,fg:r}}};t.Linkifier2=c=s([r(0,h.IBufferService)],c)},9042:(e,t)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.tooMuchOutput=t.promptLabel=void 0,t.promptLabel="Terminal input",t.tooMuchOutput="Too much output to announce, navigate to rows manually to read"},3730:function(e,t,i){var s=this&&this.__decorate||function(e,t,i,s){var r,n=arguments.length,o=n<3?t:null===s?s=Object.getOwnPropertyDescriptor(t,i):s;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)o=Reflect.decorate(e,t,i,s);else for(var a=e.length-1;a>=0;a--)(r=e[a])&&(o=(n<3?r(o):n>3?r(t,i,o):r(t,i))||o);return n>3&&o&&Object.defineProperty(t,i,o),o},r=this&&this.__param||function(e,t){return function(i,s){t(i,s,e)}};Object.defineProperty(t,"__esModule",{value:!0}),t.OscLinkProvider=void 0;const n=i(511),o=i(2585);let a=t.OscLinkProvider=class{constructor(e,t,i){this._bufferService=e,this._optionsService=t,this._oscLinkService=i}provideLinks(e,t){var i;const s=this._bufferService.buffer.lines.get(e-1);if(!s)return void t(void 0);const r=[],o=this._optionsService.rawOptions.linkHandler,a=new n.CellData,c=s.getTrimmedLength();let l=-1,d=-1,_=!1;for(let t=0;t<c;t++)if(-1!==d||s.hasContent(t)){if(s.loadCell(t,a),a.hasExtendedAttrs()&&a.extended.urlId){if(-1===d){d=t,l=a.extended.urlId;continue}_=a.extended.urlId!==l}else-1!==d&&(_=!0);if(_||-1!==d&&t===c-1){const s=null===(i=this._oscLinkService.getLinkData(l))||void 0===i?void 0:i.uri;if(s){const i={start:{x:d+1,y:e},end:{x:t+(_||t!==c-1?0:1),y:e}};let n=!1;if(!(null==o?void 0:o.allowNonHttpProtocols))try{const e=new URL(s);["http:","https:"].includes(e.protocol)||(n=!0)}catch(e){n=!0}n||r.push({text:s,range:i,activate:(e,t)=>o?o.activate(e,t,i):h(0,t),hover:(e,t)=>{var s;return null===(s=null==o?void 0:o.hover)||void 0===s?void 0:s.call(o,e,t,i)},leave:(e,t)=>{var s;return null===(s=null==o?void 0:o.leave)||void 0===s?void 0:s.call(o,e,t,i)}})}_=!1,a.hasExtendedAttrs()&&a.extended.urlId?(d=t,l=a.extended.urlId):(d=-1,l=-1)}}t(r)}};function h(e,t){if(confirm(`Do you want to navigate to ${t}?\n\nWARNING: This link could potentially be dangerous`)){const e=window.open();if(e){try{e.opener=null}catch(e){}e.location.href=t}else console.warn("Opening link blocked as opener could not be cleared")}}t.OscLinkProvider=a=s([r(0,o.IBufferService),r(1,o.IOptionsService),r(2,o.IOscLinkService)],a)},6193:(e,t)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.RenderDebouncer=void 0,t.RenderDebouncer=class{constructor(e,t){this._parentWindow=e,this._renderCallback=t,this._refreshCallbacks=[]}dispose(){this._animationFrame&&(this._parentWindow.cancelAnimationFrame(this._animationFrame),this._animationFrame=void 0)}addRefreshCallback(e){return this._refreshCallbacks.push(e),this._animationFrame||(this._animationFrame=this._parentWindow.requestAnimationFrame((()=>this._innerRefresh()))),this._animationFrame}refresh(e,t,i){this._rowCount=i,e=void 0!==e?e:0,t=void 0!==t?t:this._rowCount-1,this._rowStart=void 0!==this._rowStart?Math.min(this._rowStart,e):e,this._rowEnd=void 0!==this._rowEnd?Math.max(this._rowEnd,t):t,this._animationFrame||(this._animationFrame=this._parentWindow.requestAnimationFrame((()=>this._innerRefresh())))}_innerRefresh(){if(this._animationFrame=void 0,void 0===this._rowStart||void 0===this._rowEnd||void 0===this._rowCount)return void this._runRefreshCallbacks();const e=Math.max(this._rowStart,0),t=Math.min(this._rowEnd,this._rowCount-1);this._rowStart=void 0,this._rowEnd=void 0,this._renderCallback(e,t),this._runRefreshCallbacks()}_runRefreshCallbacks(){for(const e of this._refreshCallbacks)e(0);this._refreshCallbacks=[]}}},5596:(e,t,i)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.ScreenDprMonitor=void 0;const s=i(844);class r extends s.Disposable{constructor(e){super(),this._parentWindow=e,this._currentDevicePixelRatio=this._parentWindow.devicePixelRatio,this.register((0,s.toDisposable)((()=>{this.clearListener()})))}setListener(e){this._listener&&this.clearListener(),this._listener=e,this._outerListener=()=>{this._listener&&(this._listener(this._parentWindow.devicePixelRatio,this._currentDevicePixelRatio),this._updateDpr())},this._updateDpr()}_updateDpr(){var e;this._outerListener&&(null===(e=this._resolutionMediaMatchList)||void 0===e||e.removeListener(this._outerListener),this._currentDevicePixelRatio=this._parentWindow.devicePixelRatio,this._resolutionMediaMatchList=this._parentWindow.matchMedia(`screen and (resolution: ${this._parentWindow.devicePixelRatio}dppx)`),this._resolutionMediaMatchList.addListener(this._outerListener))}clearListener(){this._resolutionMediaMatchList&&this._listener&&this._outerListener&&(this._resolutionMediaMatchList.removeListener(this._outerListener),this._resolutionMediaMatchList=void 0,this._listener=void 0,this._outerListener=void 0)}}t.ScreenDprMonitor=r},3236:(e,t,i)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.Terminal=void 0;const s=i(3614),r=i(3656),n=i(6465),o=i(9042),a=i(3730),h=i(1680),c=i(3107),l=i(5744),d=i(2950),_=i(1296),u=i(428),f=i(4269),v=i(5114),p=i(8934),g=i(3230),m=i(9312),S=i(4725),C=i(6731),b=i(8055),y=i(8969),w=i(8460),E=i(844),k=i(6114),L=i(8437),D=i(2584),R=i(7399),x=i(5941),A=i(9074),B=i(2585),T=i(5435),M=i(4567),O="undefined"!=typeof window?window.document:null;class P extends y.CoreTerminal{get onFocus(){return this._onFocus.event}get onBlur(){return this._onBlur.event}get onA11yChar(){return this._onA11yCharEmitter.event}get onA11yTab(){return this._onA11yTabEmitter.event}get onWillOpen(){return this._onWillOpen.event}constructor(e={}){super(e),this.browser=k,this._keyDownHandled=!1,this._keyDownSeen=!1,this._keyPressHandled=!1,this._unprocessedDeadKey=!1,this._accessibilityManager=this.register(new E.MutableDisposable),this._onCursorMove=this.register(new w.EventEmitter),this.onCursorMove=this._onCursorMove.event,this._onKey=this.register(new w.EventEmitter),this.onKey=this._onKey.event,this._onRender=this.register(new w.EventEmitter),this.onRender=this._onRender.event,this._onSelectionChange=this.register(new w.EventEmitter),this.onSelectionChange=this._onSelectionChange.event,this._onTitleChange=this.register(new w.EventEmitter),this.onTitleChange=this._onTitleChange.event,this._onBell=this.register(new w.EventEmitter),this.onBell=this._onBell.event,this._onFocus=this.register(new w.EventEmitter),this._onBlur=this.register(new w.EventEmitter),this._onA11yCharEmitter=this.register(new w.EventEmitter),this._onA11yTabEmitter=this.register(new w.EventEmitter),this._onWillOpen=this.register(new w.EventEmitter),this._setup(),this.linkifier2=this.register(this._instantiationService.createInstance(n.Linkifier2)),this.linkifier2.registerLinkProvider(this._instantiationService.createInstance(a.OscLinkProvider)),this._decorationService=this._instantiationService.createInstance(A.DecorationService),this._instantiationService.setService(B.IDecorationService,this._decorationService),this.register(this._inputHandler.onRequestBell((()=>this._onBell.fire()))),this.register(this._inputHandler.onRequestRefreshRows(((e,t)=>this.refresh(e,t)))),this.register(this._inputHandler.onRequestSendFocus((()=>this._reportFocus()))),this.register(this._inputHandler.onRequestReset((()=>this.reset()))),this.register(this._inputHandler.onRequestWindowsOptionsReport((e=>this._reportWindowsOptions(e)))),this.register(this._inputHandler.onColor((e=>this._handleColorEvent(e)))),this.register((0,w.forwardEvent)(this._inputHandler.onCursorMove,this._onCursorMove)),this.register((0,w.forwardEvent)(this._inputHandler.onTitleChange,this._onTitleChange)),this.register((0,w.forwardEvent)(this._inputHandler.onA11yChar,this._onA11yCharEmitter)),this.register((0,w.forwardEvent)(this._inputHandler.onA11yTab,this._onA11yTabEmitter)),this.register(this._bufferService.onResize((e=>this._afterResize(e.cols,e.rows)))),this.register((0,E.toDisposable)((()=>{var e,t;this._customKeyEventHandler=void 0,null===(t=null===(e=this.element)||void 0===e?void 0:e.parentNode)||void 0===t||t.removeChild(this.element)})))}_handleColorEvent(e){if(this._themeService)for(const t of e){let e,i="";switch(t.index){case 256:e="foreground",i="10";break;case 257:e="background",i="11";break;case 258:e="cursor",i="12";break;default:e="ansi",i="4;"+t.index}switch(t.type){case 0:const s=b.color.toColorRGB("ansi"===e?this._themeService.colors.ansi[t.index]:this._themeService.colors[e]);this.coreService.triggerDataEvent(`${D.C0.ESC}]${i};${(0,x.toRgbString)(s)}${D.C1_ESCAPED.ST}`);break;case 1:if("ansi"===e)this._themeService.modifyColors((e=>e.ansi[t.index]=b.rgba.toColor(...t.color)));else{const i=e;this._themeService.modifyColors((e=>e[i]=b.rgba.toColor(...t.color)))}break;case 2:this._themeService.restoreColor(t.index)}}}_setup(){super._setup(),this._customKeyEventHandler=void 0}get buffer(){return this.buffers.active}focus(){this.textarea&&this.textarea.focus({preventScroll:!0})}_handleScreenReaderModeOptionChange(e){e?!this._accessibilityManager.value&&this._renderService&&(this._accessibilityManager.value=this._instantiationService.createInstance(M.AccessibilityManager,this)):this._accessibilityManager.clear()}_handleTextAreaFocus(e){this.coreService.decPrivateModes.sendFocus&&this.coreService.triggerDataEvent(D.C0.ESC+"[I"),this.updateCursorStyle(e),this.element.classList.add("focus"),this._showCursor(),this._onFocus.fire()}blur(){var e;return null===(e=this.textarea)||void 0===e?void 0:e.blur()}_handleTextAreaBlur(){this.textarea.value="",this.refresh(this.buffer.y,this.buffer.y),this.coreService.decPrivateModes.sendFocus&&this.coreService.triggerDataEvent(D.C0.ESC+"[O"),this.element.classList.remove("focus"),this._onBlur.fire()}_syncTextArea(){if(!this.textarea||!this.buffer.isCursorInViewport||this._compositionHelper.isComposing||!this._renderService)return;const e=this.buffer.ybase+this.buffer.y,t=this.buffer.lines.get(e);if(!t)return;const i=Math.min(this.buffer.x,this.cols-1),s=this._renderService.dimensions.css.cell.height,r=t.getWidth(i),n=this._renderService.dimensions.css.cell.width*r,o=this.buffer.y*this._renderService.dimensions.css.cell.height,a=i*this._renderService.dimensions.css.cell.width;this.textarea.style.left=a+"px",this.textarea.style.top=o+"px",this.textarea.style.width=n+"px",this.textarea.style.height=s+"px",this.textarea.style.lineHeight=s+"px",this.textarea.style.zIndex="-5"}_initGlobal(){this._bindKeys(),this.register((0,r.addDisposableDomListener)(this.element,"copy",(e=>{this.hasSelection()&&(0,s.copyHandler)(e,this._selectionService)})));const e=e=>(0,s.handlePasteEvent)(e,this.textarea,this.coreService,this.optionsService);this.register((0,r.addDisposableDomListener)(this.textarea,"paste",e)),this.register((0,r.addDisposableDomListener)(this.element,"paste",e)),k.isFirefox?this.register((0,r.addDisposableDomListener)(this.element,"mousedown",(e=>{2===e.button&&(0,s.rightClickHandler)(e,this.textarea,this.screenElement,this._selectionService,this.options.rightClickSelectsWord)}))):this.register((0,r.addDisposableDomListener)(this.element,"contextmenu",(e=>{(0,s.rightClickHandler)(e,this.textarea,this.screenElement,this._selectionService,this.options.rightClickSelectsWord)}))),k.isLinux&&this.register((0,r.addDisposableDomListener)(this.element,"auxclick",(e=>{1===e.button&&(0,s.moveTextAreaUnderMouseCursor)(e,this.textarea,this.screenElement)})))}_bindKeys(){this.register((0,r.addDisposableDomListener)(this.textarea,"keyup",(e=>this._keyUp(e)),!0)),this.register((0,r.addDisposableDomListener)(this.textarea,"keydown",(e=>this._keyDown(e)),!0)),this.register((0,r.addDisposableDomListener)(this.textarea,"keypress",(e=>this._keyPress(e)),!0)),this.register((0,r.addDisposableDomListener)(this.textarea,"compositionstart",(()=>this._compositionHelper.compositionstart()))),this.register((0,r.addDisposableDomListener)(this.textarea,"compositionupdate",(e=>this._compositionHelper.compositionupdate(e)))),this.register((0,r.addDisposableDomListener)(this.textarea,"compositionend",(()=>this._compositionHelper.compositionend()))),this.register((0,r.addDisposableDomListener)(this.textarea,"input",(e=>this._inputEvent(e)),!0)),this.register(this.onRender((()=>this._compositionHelper.updateCompositionElements())))}open(e){var t;if(!e)throw new Error("Terminal requires a parent element.");e.isConnected||this._logService.debug("Terminal.open was called on an element that was not attached to the DOM"),this._document=e.ownerDocument,this.element=this._document.createElement("div"),this.element.dir="ltr",this.element.classList.add("terminal"),this.element.classList.add("xterm"),e.appendChild(this.element);const i=O.createDocumentFragment();this._viewportElement=O.createElement("div"),this._viewportElement.classList.add("xterm-viewport"),i.appendChild(this._viewportElement),this._viewportScrollArea=O.createElement("div"),this._viewportScrollArea.classList.add("xterm-scroll-area"),this._viewportElement.appendChild(this._viewportScrollArea),this.screenElement=O.createElement("div"),this.screenElement.classList.add("xterm-screen"),this._helperContainer=O.createElement("div"),this._helperContainer.classList.add("xterm-helpers"),this.screenElement.appendChild(this._helperContainer),i.appendChild(this.screenElement),this.textarea=O.createElement("textarea"),this.textarea.classList.add("xterm-helper-textarea"),this.textarea.setAttribute("aria-label",o.promptLabel),k.isChromeOS||this.textarea.setAttribute("aria-multiline","false"),this.textarea.setAttribute("autocorrect","off"),this.textarea.setAttribute("autocapitalize","off"),this.textarea.setAttribute("spellcheck","false"),this.textarea.tabIndex=0,this._coreBrowserService=this._instantiationService.createInstance(v.CoreBrowserService,this.textarea,null!==(t=this._document.defaultView)&&void 0!==t?t:window),this._instantiationService.setService(S.ICoreBrowserService,this._coreBrowserService),this.register((0,r.addDisposableDomListener)(this.textarea,"focus",(e=>this._handleTextAreaFocus(e)))),this.register((0,r.addDisposableDomListener)(this.textarea,"blur",(()=>this._handleTextAreaBlur()))),this._helperContainer.appendChild(this.textarea),this._charSizeService=this._instantiationService.createInstance(u.CharSizeService,this._document,this._helperContainer),this._instantiationService.setService(S.ICharSizeService,this._charSizeService),this._themeService=this._instantiationService.createInstance(C.ThemeService),this._instantiationService.setService(S.IThemeService,this._themeService),this._characterJoinerService=this._instantiationService.createInstance(f.CharacterJoinerService),this._instantiationService.setService(S.ICharacterJoinerService,this._characterJoinerService),this._renderService=this.register(this._instantiationService.createInstance(g.RenderService,this.rows,this.screenElement)),this._instantiationService.setService(S.IRenderService,this._renderService),this.register(this._renderService.onRenderedViewportChange((e=>this._onRender.fire(e)))),this.onResize((e=>this._renderService.resize(e.cols,e.rows))),this._compositionView=O.createElement("div"),this._compositionView.classList.add("composition-view"),this._compositionHelper=this._instantiationService.createInstance(d.CompositionHelper,this.textarea,this._compositionView),this._helperContainer.appendChild(this._compositionView),this.element.appendChild(i);try{this._onWillOpen.fire(this.element)}catch(e){}this._renderService.hasRenderer()||this._renderService.setRenderer(this._createRenderer()),this._mouseService=this._instantiationService.createInstance(p.MouseService),this._instantiationService.setService(S.IMouseService,this._mouseService),this.viewport=this._instantiationService.createInstance(h.Viewport,this._viewportElement,this._viewportScrollArea),this.viewport.onRequestScrollLines((e=>this.scrollLines(e.amount,e.suppressScrollEvent,1))),this.register(this._inputHandler.onRequestSyncScrollBar((()=>this.viewport.syncScrollArea()))),this.register(this.viewport),this.register(this.onCursorMove((()=>{this._renderService.handleCursorMove(),this._syncTextArea()}))),this.register(this.onResize((()=>this._renderService.handleResize(this.cols,this.rows)))),this.register(this.onBlur((()=>this._renderService.handleBlur()))),this.register(this.onFocus((()=>this._renderService.handleFocus()))),this.register(this._renderService.onDimensionsChange((()=>this.viewport.syncScrollArea()))),this._selectionService=this.register(this._instantiationService.createInstance(m.SelectionService,this.element,this.screenElement,this.linkifier2)),this._instantiationService.setService(S.ISelectionService,this._selectionService),this.register(this._selectionService.onRequestScrollLines((e=>this.scrollLines(e.amount,e.suppressScrollEvent)))),this.register(this._selectionService.onSelectionChange((()=>this._onSelectionChange.fire()))),this.register(this._selectionService.onRequestRedraw((e=>this._renderService.handleSelectionChanged(e.start,e.end,e.columnSelectMode)))),this.register(this._selectionService.onLinuxMouseSelection((e=>{this.textarea.value=e,this.textarea.focus(),this.textarea.select()}))),this.register(this._onScroll.event((e=>{this.viewport.syncScrollArea(),this._selectionService.refresh()}))),this.register((0,r.addDisposableDomListener)(this._viewportElement,"scroll",(()=>this._selectionService.refresh()))),this.linkifier2.attachToDom(this.screenElement,this._mouseService,this._renderService),this.register(this._instantiationService.createInstance(c.BufferDecorationRenderer,this.screenElement)),this.register((0,r.addDisposableDomListener)(this.element,"mousedown",(e=>this._selectionService.handleMouseDown(e)))),this.coreMouseService.areMouseEventsActive?(this._selectionService.disable(),this.element.classList.add("enable-mouse-events")):this._selectionService.enable(),this.options.screenReaderMode&&(this._accessibilityManager.value=this._instantiationService.createInstance(M.AccessibilityManager,this)),this.register(this.optionsService.onSpecificOptionChange("screenReaderMode",(e=>this._handleScreenReaderModeOptionChange(e)))),this.options.overviewRulerWidth&&(this._overviewRulerRenderer=this.register(this._instantiationService.createInstance(l.OverviewRulerRenderer,this._viewportElement,this.screenElement))),this.optionsService.onSpecificOptionChange("overviewRulerWidth",(e=>{!this._overviewRulerRenderer&&e&&this._viewportElement&&this.screenElement&&(this._overviewRulerRenderer=this.register(this._instantiationService.createInstance(l.OverviewRulerRenderer,this._viewportElement,this.screenElement)))})),this._charSizeService.measure(),this.refresh(0,this.rows-1),this._initGlobal(),this.bindMouse()}_createRenderer(){return this._instantiationService.createInstance(_.DomRenderer,this.element,this.screenElement,this._viewportElement,this.linkifier2)}bindMouse(){const e=this,t=this.element;function i(t){const i=e._mouseService.getMouseReportCoords(t,e.screenElement);if(!i)return!1;let s,r;switch(t.overrideType||t.type){case"mousemove":r=32,void 0===t.buttons?(s=3,void 0!==t.button&&(s=t.button<3?t.button:3)):s=1&t.buttons?0:4&t.buttons?1:2&t.buttons?2:3;break;case"mouseup":r=0,s=t.button<3?t.button:3;break;case"mousedown":r=1,s=t.button<3?t.button:3;break;case"wheel":if(0===e.viewport.getLinesScrolled(t))return!1;r=t.deltaY<0?0:1,s=4;break;default:return!1}return!(void 0===r||void 0===s||s>4)&&e.coreMouseService.triggerMouseEvent({col:i.col,row:i.row,x:i.x,y:i.y,button:s,action:r,ctrl:t.ctrlKey,alt:t.altKey,shift:t.shiftKey})}const s={mouseup:null,wheel:null,mousedrag:null,mousemove:null},n={mouseup:e=>(i(e),e.buttons||(this._document.removeEventListener("mouseup",s.mouseup),s.mousedrag&&this._document.removeEventListener("mousemove",s.mousedrag)),this.cancel(e)),wheel:e=>(i(e),this.cancel(e,!0)),mousedrag:e=>{e.buttons&&i(e)},mousemove:e=>{e.buttons||i(e)}};this.register(this.coreMouseService.onProtocolChange((e=>{e?("debug"===this.optionsService.rawOptions.logLevel&&this._logService.debug("Binding to mouse events:",this.coreMouseService.explainEvents(e)),this.element.classList.add("enable-mouse-events"),this._selectionService.disable()):(this._logService.debug("Unbinding from mouse events."),this.element.classList.remove("enable-mouse-events"),this._selectionService.enable()),8&e?s.mousemove||(t.addEventListener("mousemove",n.mousemove),s.mousemove=n.mousemove):(t.removeEventListener("mousemove",s.mousemove),s.mousemove=null),16&e?s.wheel||(t.addEventListener("wheel",n.wheel,{passive:!1}),s.wheel=n.wheel):(t.removeEventListener("wheel",s.wheel),s.wheel=null),2&e?s.mouseup||(t.addEventListener("mouseup",n.mouseup),s.mouseup=n.mouseup):(this._document.removeEventListener("mouseup",s.mouseup),t.removeEventListener("mouseup",s.mouseup),s.mouseup=null),4&e?s.mousedrag||(s.mousedrag=n.mousedrag):(this._document.removeEventListener("mousemove",s.mousedrag),s.mousedrag=null)}))),this.coreMouseService.activeProtocol=this.coreMouseService.activeProtocol,this.register((0,r.addDisposableDomListener)(t,"mousedown",(e=>{if(e.preventDefault(),this.focus(),this.coreMouseService.areMouseEventsActive&&!this._selectionService.shouldForceSelection(e))return i(e),s.mouseup&&this._document.addEventListener("mouseup",s.mouseup),s.mousedrag&&this._document.addEventListener("mousemove",s.mousedrag),this.cancel(e)}))),this.register((0,r.addDisposableDomListener)(t,"wheel",(e=>{if(!s.wheel){if(!this.buffer.hasScrollback){const t=this.viewport.getLinesScrolled(e);if(0===t)return;const i=D.C0.ESC+(this.coreService.decPrivateModes.applicationCursorKeys?"O":"[")+(e.deltaY<0?"A":"B");let s="";for(let e=0;e<Math.abs(t);e++)s+=i;return this.coreService.triggerDataEvent(s,!0),this.cancel(e,!0)}return this.viewport.handleWheel(e)?this.cancel(e):void 0}}),{passive:!1})),this.register((0,r.addDisposableDomListener)(t,"touchstart",(e=>{if(!this.coreMouseService.areMouseEventsActive)return this.viewport.handleTouchStart(e),this.cancel(e)}),{passive:!0})),this.register((0,r.addDisposableDomListener)(t,"touchmove",(e=>{if(!this.coreMouseService.areMouseEventsActive)return this.viewport.handleTouchMove(e)?void 0:this.cancel(e)}),{passive:!1}))}refresh(e,t){var i;null===(i=this._renderService)||void 0===i||i.refreshRows(e,t)}updateCursorStyle(e){var t;(null===(t=this._selectionService)||void 0===t?void 0:t.shouldColumnSelect(e))?this.element.classList.add("column-select"):this.element.classList.remove("column-select")}_showCursor(){this.coreService.isCursorInitialized||(this.coreService.isCursorInitialized=!0,this.refresh(this.buffer.y,this.buffer.y))}scrollLines(e,t,i=0){var s;1===i?(super.scrollLines(e,t,i),this.refresh(0,this.rows-1)):null===(s=this.viewport)||void 0===s||s.scrollLines(e)}paste(e){(0,s.paste)(e,this.textarea,this.coreService,this.optionsService)}attachCustomKeyEventHandler(e){this._customKeyEventHandler=e}registerLinkProvider(e){return this.linkifier2.registerLinkProvider(e)}registerCharacterJoiner(e){if(!this._characterJoinerService)throw new Error("Terminal must be opened first");const t=this._characterJoinerService.register(e);return this.refresh(0,this.rows-1),t}deregisterCharacterJoiner(e){if(!this._characterJoinerService)throw new Error("Terminal must be opened first");this._characterJoinerService.deregister(e)&&this.refresh(0,this.rows-1)}get markers(){return this.buffer.markers}registerMarker(e){return this.buffer.addMarker(this.buffer.ybase+this.buffer.y+e)}registerDecoration(e){return this._decorationService.registerDecoration(e)}hasSelection(){return!!this._selectionService&&this._selectionService.hasSelection}select(e,t,i){this._selectionService.setSelection(e,t,i)}getSelection(){return this._selectionService?this._selectionService.selectionText:""}getSelectionPosition(){if(this._selectionService&&this._selectionService.hasSelection)return{start:{x:this._selectionService.selectionStart[0],y:this._selectionService.selectionStart[1]},end:{x:this._selectionService.selectionEnd[0],y:this._selectionService.selectionEnd[1]}}}clearSelection(){var e;null===(e=this._selectionService)||void 0===e||e.clearSelection()}selectAll(){var e;null===(e=this._selectionService)||void 0===e||e.selectAll()}selectLines(e,t){var i;null===(i=this._selectionService)||void 0===i||i.selectLines(e,t)}_keyDown(e){if(this._keyDownHandled=!1,this._keyDownSeen=!0,this._customKeyEventHandler&&!1===this._customKeyEventHandler(e))return!1;const t=this.browser.isMac&&this.options.macOptionIsMeta&&e.altKey;if(!t&&!this._compositionHelper.keydown(e))return this.options.scrollOnUserInput&&this.buffer.ybase!==this.buffer.ydisp&&this.scrollToBottom(),!1;t||"Dead"!==e.key&&"AltGraph"!==e.key||(this._unprocessedDeadKey=!0);const i=(0,R.evaluateKeyboardEvent)(e,this.coreService.decPrivateModes.applicationCursorKeys,this.browser.isMac,this.options.macOptionIsMeta);if(this.updateCursorStyle(e),3===i.type||2===i.type){const t=this.rows-1;return this.scrollLines(2===i.type?-t:t),this.cancel(e,!0)}return 1===i.type&&this.selectAll(),!!this._isThirdLevelShift(this.browser,e)||(i.cancel&&this.cancel(e,!0),!i.key||!!(e.key&&!e.ctrlKey&&!e.altKey&&!e.metaKey&&1===e.key.length&&e.key.charCodeAt(0)>=65&&e.key.charCodeAt(0)<=90)||(this._unprocessedDeadKey?(this._unprocessedDeadKey=!1,!0):(i.key!==D.C0.ETX&&i.key!==D.C0.CR||(this.textarea.value=""),this._onKey.fire({key:i.key,domEvent:e}),this._showCursor(),this.coreService.triggerDataEvent(i.key,!0),!this.optionsService.rawOptions.screenReaderMode||e.altKey||e.ctrlKey?this.cancel(e,!0):void(this._keyDownHandled=!0))))}_isThirdLevelShift(e,t){const i=e.isMac&&!this.options.macOptionIsMeta&&t.altKey&&!t.ctrlKey&&!t.metaKey||e.isWindows&&t.altKey&&t.ctrlKey&&!t.metaKey||e.isWindows&&t.getModifierState("AltGraph");return"keypress"===t.type?i:i&&(!t.keyCode||t.keyCode>47)}_keyUp(e){this._keyDownSeen=!1,this._customKeyEventHandler&&!1===this._customKeyEventHandler(e)||(function(e){return 16===e.keyCode||17===e.keyCode||18===e.keyCode}(e)||this.focus(),this.updateCursorStyle(e),this._keyPressHandled=!1)}_keyPress(e){let t;if(this._keyPressHandled=!1,this._keyDownHandled)return!1;if(this._customKeyEventHandler&&!1===this._customKeyEventHandler(e))return!1;if(this.cancel(e),e.charCode)t=e.charCode;else if(null===e.which||void 0===e.which)t=e.keyCode;else{if(0===e.which||0===e.charCode)return!1;t=e.which}return!(!t||(e.altKey||e.ctrlKey||e.metaKey)&&!this._isThirdLevelShift(this.browser,e)||(t=String.fromCharCode(t),this._onKey.fire({key:t,domEvent:e}),this._showCursor(),this.coreService.triggerDataEvent(t,!0),this._keyPressHandled=!0,this._unprocessedDeadKey=!1,0))}_inputEvent(e){if(e.data&&"insertText"===e.inputType&&(!e.composed||!this._keyDownSeen)&&!this.optionsService.rawOptions.screenReaderMode){if(this._keyPressHandled)return!1;this._unprocessedDeadKey=!1;const t=e.data;return this.coreService.triggerDataEvent(t,!0),this.cancel(e),!0}return!1}resize(e,t){e!==this.cols||t!==this.rows?super.resize(e,t):this._charSizeService&&!this._charSizeService.hasValidSize&&this._charSizeService.measure()}_afterResize(e,t){var i,s;null===(i=this._charSizeService)||void 0===i||i.measure(),null===(s=this.viewport)||void 0===s||s.syncScrollArea(!0)}clear(){var e;if(0!==this.buffer.ybase||0!==this.buffer.y){this.buffer.clearAllMarkers(),this.buffer.lines.set(0,this.buffer.lines.get(this.buffer.ybase+this.buffer.y)),this.buffer.lines.length=1,this.buffer.ydisp=0,this.buffer.ybase=0,this.buffer.y=0;for(let e=1;e<this.rows;e++)this.buffer.lines.push(this.buffer.getBlankLine(L.DEFAULT_ATTR_DATA));this._onScroll.fire({position:this.buffer.ydisp,source:0}),null===(e=this.viewport)||void 0===e||e.reset(),this.refresh(0,this.rows-1)}}reset(){var e,t;this.options.rows=this.rows,this.options.cols=this.cols;const i=this._customKeyEventHandler;this._setup(),super.reset(),null===(e=this._selectionService)||void 0===e||e.reset(),this._decorationService.reset(),null===(t=this.viewport)||void 0===t||t.reset(),this._customKeyEventHandler=i,this.refresh(0,this.rows-1)}clearTextureAtlas(){var e;null===(e=this._renderService)||void 0===e||e.clearTextureAtlas()}_reportFocus(){var e;(null===(e=this.element)||void 0===e?void 0:e.classList.contains("focus"))?this.coreService.triggerDataEvent(D.C0.ESC+"[I"):this.coreService.triggerDataEvent(D.C0.ESC+"[O")}_reportWindowsOptions(e){if(this._renderService)switch(e){case T.WindowsOptionsReportType.GET_WIN_SIZE_PIXELS:const e=this._renderService.dimensions.css.canvas.width.toFixed(0),t=this._renderService.dimensions.css.canvas.height.toFixed(0);this.coreService.triggerDataEvent(`${D.C0.ESC}[4;${t};${e}t`);break;case T.WindowsOptionsReportType.GET_CELL_SIZE_PIXELS:const i=this._renderService.dimensions.css.cell.width.toFixed(0),s=this._renderService.dimensions.css.cell.height.toFixed(0);this.coreService.triggerDataEvent(`${D.C0.ESC}[6;${s};${i}t`)}}cancel(e,t){if(this.options.cancelEvents||t)return e.preventDefault(),e.stopPropagation(),!1}}t.Terminal=P},9924:(e,t)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.TimeBasedDebouncer=void 0,t.TimeBasedDebouncer=class{constructor(e,t=1e3){this._renderCallback=e,this._debounceThresholdMS=t,this._lastRefreshMs=0,this._additionalRefreshRequested=!1}dispose(){this._refreshTimeoutID&&clearTimeout(this._refreshTimeoutID)}refresh(e,t,i){this._rowCount=i,e=void 0!==e?e:0,t=void 0!==t?t:this._rowCount-1,this._rowStart=void 0!==this._rowStart?Math.min(this._rowStart,e):e,this._rowEnd=void 0!==this._rowEnd?Math.max(this._rowEnd,t):t;const s=Date.now();if(s-this._lastRefreshMs>=this._debounceThresholdMS)this._lastRefreshMs=s,this._innerRefresh();else if(!this._additionalRefreshRequested){const e=s-this._lastRefreshMs,t=this._debounceThresholdMS-e;this._additionalRefreshRequested=!0,this._refreshTimeoutID=window.setTimeout((()=>{this._lastRefreshMs=Date.now(),this._innerRefresh(),this._additionalRefreshRequested=!1,this._refreshTimeoutID=void 0}),t)}}_innerRefresh(){if(void 0===this._rowStart||void 0===this._rowEnd||void 0===this._rowCount)return;const e=Math.max(this._rowStart,0),t=Math.min(this._rowEnd,this._rowCount-1);this._rowStart=void 0,this._rowEnd=void 0,this._renderCallback(e,t)}}},1680:function(e,t,i){var s=this&&this.__decorate||function(e,t,i,s){var r,n=arguments.length,o=n<3?t:null===s?s=Object.getOwnPropertyDescriptor(t,i):s;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)o=Reflect.decorate(e,t,i,s);else for(var a=e.length-1;a>=0;a--)(r=e[a])&&(o=(n<3?r(o):n>3?r(t,i,o):r(t,i))||o);return n>3&&o&&Object.defineProperty(t,i,o),o},r=this&&this.__param||function(e,t){return function(i,s){t(i,s,e)}};Object.defineProperty(t,"__esModule",{value:!0}),t.Viewport=void 0;const n=i(3656),o=i(4725),a=i(8460),h=i(844),c=i(2585);let l=t.Viewport=class extends h.Disposable{constructor(e,t,i,s,r,o,h,c){super(),this._viewportElement=e,this._scrollArea=t,this._bufferService=i,this._optionsService=s,this._charSizeService=r,this._renderService=o,this._coreBrowserService=h,this.scrollBarWidth=0,this._currentRowHeight=0,this._currentDeviceCellHeight=0,this._lastRecordedBufferLength=0,this._lastRecordedViewportHeight=0,this._lastRecordedBufferHeight=0,this._lastTouchY=0,this._lastScrollTop=0,this._wheelPartialScroll=0,this._refreshAnimationFrame=null,this._ignoreNextScrollEvent=!1,this._smoothScrollState={startTime:0,origin:-1,target:-1},this._onRequestScrollLines=this.register(new a.EventEmitter),this.onRequestScrollLines=this._onRequestScrollLines.event,this.scrollBarWidth=this._viewportElement.offsetWidth-this._scrollArea.offsetWidth||15,this.register((0,n.addDisposableDomListener)(this._viewportElement,"scroll",this._handleScroll.bind(this))),this._activeBuffer=this._bufferService.buffer,this.register(this._bufferService.buffers.onBufferActivate((e=>this._activeBuffer=e.activeBuffer))),this._renderDimensions=this._renderService.dimensions,this.register(this._renderService.onDimensionsChange((e=>this._renderDimensions=e))),this._handleThemeChange(c.colors),this.register(c.onChangeColors((e=>this._handleThemeChange(e)))),this.register(this._optionsService.onSpecificOptionChange("scrollback",(()=>this.syncScrollArea()))),setTimeout((()=>this.syncScrollArea()))}_handleThemeChange(e){this._viewportElement.style.backgroundColor=e.background.css}reset(){this._currentRowHeight=0,this._currentDeviceCellHeight=0,this._lastRecordedBufferLength=0,this._lastRecordedViewportHeight=0,this._lastRecordedBufferHeight=0,this._lastTouchY=0,this._lastScrollTop=0,this._coreBrowserService.window.requestAnimationFrame((()=>this.syncScrollArea()))}_refresh(e){if(e)return this._innerRefresh(),void(null!==this._refreshAnimationFrame&&this._coreBrowserService.window.cancelAnimationFrame(this._refreshAnimationFrame));null===this._refreshAnimationFrame&&(this._refreshAnimationFrame=this._coreBrowserService.window.requestAnimationFrame((()=>this._innerRefresh())))}_innerRefresh(){if(this._charSizeService.height>0){this._currentRowHeight=this._renderService.dimensions.device.cell.height/this._coreBrowserService.dpr,this._currentDeviceCellHeight=this._renderService.dimensions.device.cell.height,this._lastRecordedViewportHeight=this._viewportElement.offsetHeight;const e=Math.round(this._currentRowHeight*this._lastRecordedBufferLength)+(this._lastRecordedViewportHeight-this._renderService.dimensions.css.canvas.height);this._lastRecordedBufferHeight!==e&&(this._lastRecordedBufferHeight=e,this._scrollArea.style.height=this._lastRecordedBufferHeight+"px")}const e=this._bufferService.buffer.ydisp*this._currentRowHeight;this._viewportElement.scrollTop!==e&&(this._ignoreNextScrollEvent=!0,this._viewportElement.scrollTop=e),this._refreshAnimationFrame=null}syncScrollArea(e=!1){if(this._lastRecordedBufferLength!==this._bufferService.buffer.lines.length)return this._lastRecordedBufferLength=this._bufferService.buffer.lines.length,void this._refresh(e);this._lastRecordedViewportHeight===this._renderService.dimensions.css.canvas.height&&this._lastScrollTop===this._activeBuffer.ydisp*this._currentRowHeight&&this._renderDimensions.device.cell.height===this._currentDeviceCellHeight||this._refresh(e)}_handleScroll(e){if(this._lastScrollTop=this._viewportElement.scrollTop,!this._viewportElement.offsetParent)return;if(this._ignoreNextScrollEvent)return this._ignoreNextScrollEvent=!1,void this._onRequestScrollLines.fire({amount:0,suppressScrollEvent:!0});const t=Math.round(this._lastScrollTop/this._currentRowHeight)-this._bufferService.buffer.ydisp;this._onRequestScrollLines.fire({amount:t,suppressScrollEvent:!0})}_smoothScroll(){if(this._isDisposed||-1===this._smoothScrollState.origin||-1===this._smoothScrollState.target)return;const e=this._smoothScrollPercent();this._viewportElement.scrollTop=this._smoothScrollState.origin+Math.round(e*(this._smoothScrollState.target-this._smoothScrollState.origin)),e<1?this._coreBrowserService.window.requestAnimationFrame((()=>this._smoothScroll())):this._clearSmoothScrollState()}_smoothScrollPercent(){return this._optionsService.rawOptions.smoothScrollDuration&&this._smoothScrollState.startTime?Math.max(Math.min((Date.now()-this._smoothScrollState.startTime)/this._optionsService.rawOptions.smoothScrollDuration,1),0):1}_clearSmoothScrollState(){this._smoothScrollState.startTime=0,this._smoothScrollState.origin=-1,this._smoothScrollState.target=-1}_bubbleScroll(e,t){const i=this._viewportElement.scrollTop+this._lastRecordedViewportHeight;return!(t<0&&0!==this._viewportElement.scrollTop||t>0&&i<this._lastRecordedBufferHeight)||(e.cancelable&&e.preventDefault(),!1)}handleWheel(e){const t=this._getPixelsScrolled(e);return 0!==t&&(this._optionsService.rawOptions.smoothScrollDuration?(this._smoothScrollState.startTime=Date.now(),this._smoothScrollPercent()<1?(this._smoothScrollState.origin=this._viewportElement.scrollTop,-1===this._smoothScrollState.target?this._smoothScrollState.target=this._viewportElement.scrollTop+t:this._smoothScrollState.target+=t,this._smoothScrollState.target=Math.max(Math.min(this._smoothScrollState.target,this._viewportElement.scrollHeight),0),this._smoothScroll()):this._clearSmoothScrollState()):this._viewportElement.scrollTop+=t,this._bubbleScroll(e,t))}scrollLines(e){if(0!==e)if(this._optionsService.rawOptions.smoothScrollDuration){const t=e*this._currentRowHeight;this._smoothScrollState.startTime=Date.now(),this._smoothScrollPercent()<1?(this._smoothScrollState.origin=this._viewportElement.scrollTop,this._smoothScrollState.target=this._smoothScrollState.origin+t,this._smoothScrollState.target=Math.max(Math.min(this._smoothScrollState.target,this._viewportElement.scrollHeight),0),this._smoothScroll()):this._clearSmoothScrollState()}else this._onRequestScrollLines.fire({amount:e,suppressScrollEvent:!1})}_getPixelsScrolled(e){if(0===e.deltaY||e.shiftKey)return 0;let t=this._applyScrollModifier(e.deltaY,e);return e.deltaMode===WheelEvent.DOM_DELTA_LINE?t*=this._currentRowHeight:e.deltaMode===WheelEvent.DOM_DELTA_PAGE&&(t*=this._currentRowHeight*this._bufferService.rows),t}getBufferElements(e,t){var i;let s,r="";const n=[],o=null!=t?t:this._bufferService.buffer.lines.length,a=this._bufferService.buffer.lines;for(let t=e;t<o;t++){const e=a.get(t);if(!e)continue;const o=null===(i=a.get(t+1))||void 0===i?void 0:i.isWrapped;if(r+=e.translateToString(!o),!o||t===a.length-1){const e=document.createElement("div");e.textContent=r,n.push(e),r.length>0&&(s=e),r=""}}return{bufferElements:n,cursorElement:s}}getLinesScrolled(e){if(0===e.deltaY||e.shiftKey)return 0;let t=this._applyScrollModifier(e.deltaY,e);return e.deltaMode===WheelEvent.DOM_DELTA_PIXEL?(t/=this._currentRowHeight+0,this._wheelPartialScroll+=t,t=Math.floor(Math.abs(this._wheelPartialScroll))*(this._wheelPartialScroll>0?1:-1),this._wheelPartialScroll%=1):e.deltaMode===WheelEvent.DOM_DELTA_PAGE&&(t*=this._bufferService.rows),t}_applyScrollModifier(e,t){const i=this._optionsService.rawOptions.fastScrollModifier;return"alt"===i&&t.altKey||"ctrl"===i&&t.ctrlKey||"shift"===i&&t.shiftKey?e*this._optionsService.rawOptions.fastScrollSensitivity*this._optionsService.rawOptions.scrollSensitivity:e*this._optionsService.rawOptions.scrollSensitivity}handleTouchStart(e){this._lastTouchY=e.touches[0].pageY}handleTouchMove(e){const t=this._lastTouchY-e.touches[0].pageY;return this._lastTouchY=e.touches[0].pageY,0!==t&&(this._viewportElement.scrollTop+=t,this._bubbleScroll(e,t))}};t.Viewport=l=s([r(2,c.IBufferService),r(3,c.IOptionsService),r(4,o.ICharSizeService),r(5,o.IRenderService),r(6,o.ICoreBrowserService),r(7,o.IThemeService)],l)},3107:function(e,t,i){var s=this&&this.__decorate||function(e,t,i,s){var r,n=arguments.length,o=n<3?t:null===s?s=Object.getOwnPropertyDescriptor(t,i):s;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)o=Reflect.decorate(e,t,i,s);else for(var a=e.length-1;a>=0;a--)(r=e[a])&&(o=(n<3?r(o):n>3?r(t,i,o):r(t,i))||o);return n>3&&o&&Object.defineProperty(t,i,o),o},r=this&&this.__param||function(e,t){return function(i,s){t(i,s,e)}};Object.defineProperty(t,"__esModule",{value:!0}),t.BufferDecorationRenderer=void 0;const n=i(3656),o=i(4725),a=i(844),h=i(2585);let c=t.BufferDecorationRenderer=class extends a.Disposable{constructor(e,t,i,s){super(),this._screenElement=e,this._bufferService=t,this._decorationService=i,this._renderService=s,this._decorationElements=new Map,this._altBufferIsActive=!1,this._dimensionsChanged=!1,this._container=document.createElement("div"),this._container.classList.add("xterm-decoration-container"),this._screenElement.appendChild(this._container),this.register(this._renderService.onRenderedViewportChange((()=>this._doRefreshDecorations()))),this.register(this._renderService.onDimensionsChange((()=>{this._dimensionsChanged=!0,this._queueRefresh()}))),this.register((0,n.addDisposableDomListener)(window,"resize",(()=>this._queueRefresh()))),this.register(this._bufferService.buffers.onBufferActivate((()=>{this._altBufferIsActive=this._bufferService.buffer===this._bufferService.buffers.alt}))),this.register(this._decorationService.onDecorationRegistered((()=>this._queueRefresh()))),this.register(this._decorationService.onDecorationRemoved((e=>this._removeDecoration(e)))),this.register((0,a.toDisposable)((()=>{this._container.remove(),this._decorationElements.clear()})))}_queueRefresh(){void 0===this._animationFrame&&(this._animationFrame=this._renderService.addRefreshCallback((()=>{this._doRefreshDecorations(),this._animationFrame=void 0})))}_doRefreshDecorations(){for(const e of this._decorationService.decorations)this._renderDecoration(e);this._dimensionsChanged=!1}_renderDecoration(e){this._refreshStyle(e),this._dimensionsChanged&&this._refreshXPosition(e)}_createElement(e){var t,i;const s=document.createElement("div");s.classList.add("xterm-decoration"),s.classList.toggle("xterm-decoration-top-layer","top"===(null===(t=null==e?void 0:e.options)||void 0===t?void 0:t.layer)),s.style.width=`${Math.round((e.options.width||1)*this._renderService.dimensions.css.cell.width)}px`,s.style.height=(e.options.height||1)*this._renderService.dimensions.css.cell.height+"px",s.style.top=(e.marker.line-this._bufferService.buffers.active.ydisp)*this._renderService.dimensions.css.cell.height+"px",s.style.lineHeight=`${this._renderService.dimensions.css.cell.height}px`;const r=null!==(i=e.options.x)&&void 0!==i?i:0;return r&&r>this._bufferService.cols&&(s.style.display="none"),this._refreshXPosition(e,s),s}_refreshStyle(e){const t=e.marker.line-this._bufferService.buffers.active.ydisp;if(t<0||t>=this._bufferService.rows)e.element&&(e.element.style.display="none",e.onRenderEmitter.fire(e.element));else{let i=this._decorationElements.get(e);i||(i=this._createElement(e),e.element=i,this._decorationElements.set(e,i),this._container.appendChild(i),e.onDispose((()=>{this._decorationElements.delete(e),i.remove()}))),i.style.top=t*this._renderService.dimensions.css.cell.height+"px",i.style.display=this._altBufferIsActive?"none":"block",e.onRenderEmitter.fire(i)}}_refreshXPosition(e,t=e.element){var i;if(!t)return;const s=null!==(i=e.options.x)&&void 0!==i?i:0;"right"===(e.options.anchor||"left")?t.style.right=s?s*this._renderService.dimensions.css.cell.width+"px":"":t.style.left=s?s*this._renderService.dimensions.css.cell.width+"px":""}_removeDecoration(e){var t;null===(t=this._decorationElements.get(e))||void 0===t||t.remove(),this._decorationElements.delete(e),e.dispose()}};t.BufferDecorationRenderer=c=s([r(1,h.IBufferService),r(2,h.IDecorationService),r(3,o.IRenderService)],c)},5871:(e,t)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.ColorZoneStore=void 0,t.ColorZoneStore=class{constructor(){this._zones=[],this._zonePool=[],this._zonePoolIndex=0,this._linePadding={full:0,left:0,center:0,right:0}}get zones(){return this._zonePool.length=Math.min(this._zonePool.length,this._zones.length),this._zones}clear(){this._zones.length=0,this._zonePoolIndex=0}addDecoration(e){if(e.options.overviewRulerOptions){for(const t of this._zones)if(t.color===e.options.overviewRulerOptions.color&&t.position===e.options.overviewRulerOptions.position){if(this._lineIntersectsZone(t,e.marker.line))return;if(this._lineAdjacentToZone(t,e.marker.line,e.options.overviewRulerOptions.position))return void this._addLineToZone(t,e.marker.line)}if(this._zonePoolIndex<this._zonePool.length)return this._zonePool[this._zonePoolIndex].color=e.options.overviewRulerOptions.color,this._zonePool[this._zonePoolIndex].position=e.options.overviewRulerOptions.position,this._zonePool[this._zonePoolIndex].startBufferLine=e.marker.line,this._zonePool[this._zonePoolIndex].endBufferLine=e.marker.line,void this._zones.push(this._zonePool[this._zonePoolIndex++]);this._zones.push({color:e.options.overviewRulerOptions.color,position:e.options.overviewRulerOptions.position,startBufferLine:e.marker.line,endBufferLine:e.marker.line}),this._zonePool.push(this._zones[this._zones.length-1]),this._zonePoolIndex++}}setPadding(e){this._linePadding=e}_lineIntersectsZone(e,t){return t>=e.startBufferLine&&t<=e.endBufferLine}_lineAdjacentToZone(e,t,i){return t>=e.startBufferLine-this._linePadding[i||"full"]&&t<=e.endBufferLine+this._linePadding[i||"full"]}_addLineToZone(e,t){e.startBufferLine=Math.min(e.startBufferLine,t),e.endBufferLine=Math.max(e.endBufferLine,t)}}},5744:function(e,t,i){var s=this&&this.__decorate||function(e,t,i,s){var r,n=arguments.length,o=n<3?t:null===s?s=Object.getOwnPropertyDescriptor(t,i):s;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)o=Reflect.decorate(e,t,i,s);else for(var a=e.length-1;a>=0;a--)(r=e[a])&&(o=(n<3?r(o):n>3?r(t,i,o):r(t,i))||o);return n>3&&o&&Object.defineProperty(t,i,o),o},r=this&&this.__param||function(e,t){return function(i,s){t(i,s,e)}};Object.defineProperty(t,"__esModule",{value:!0}),t.OverviewRulerRenderer=void 0;const n=i(5871),o=i(3656),a=i(4725),h=i(844),c=i(2585),l={full:0,left:0,center:0,right:0},d={full:0,left:0,center:0,right:0},_={full:0,left:0,center:0,right:0};let u=t.OverviewRulerRenderer=class extends h.Disposable{get _width(){return this._optionsService.options.overviewRulerWidth||0}constructor(e,t,i,s,r,o,a){var c;super(),this._viewportElement=e,this._screenElement=t,this._bufferService=i,this._decorationService=s,this._renderService=r,this._optionsService=o,this._coreBrowseService=a,this._colorZoneStore=new n.ColorZoneStore,this._shouldUpdateDimensions=!0,this._shouldUpdateAnchor=!0,this._lastKnownBufferLength=0,this._canvas=document.createElement("canvas"),this._canvas.classList.add("xterm-decoration-overview-ruler"),this._refreshCanvasDimensions(),null===(c=this._viewportElement.parentElement)||void 0===c||c.insertBefore(this._canvas,this._viewportElement);const l=this._canvas.getContext("2d");if(!l)throw new Error("Ctx cannot be null");this._ctx=l,this._registerDecorationListeners(),this._registerBufferChangeListeners(),this._registerDimensionChangeListeners(),this.register((0,h.toDisposable)((()=>{var e;null===(e=this._canvas)||void 0===e||e.remove()})))}_registerDecorationListeners(){this.register(this._decorationService.onDecorationRegistered((()=>this._queueRefresh(void 0,!0)))),this.register(this._decorationService.onDecorationRemoved((()=>this._queueRefresh(void 0,!0))))}_registerBufferChangeListeners(){this.register(this._renderService.onRenderedViewportChange((()=>this._queueRefresh()))),this.register(this._bufferService.buffers.onBufferActivate((()=>{this._canvas.style.display=this._bufferService.buffer===this._bufferService.buffers.alt?"none":"block"}))),this.register(this._bufferService.onScroll((()=>{this._lastKnownBufferLength!==this._bufferService.buffers.normal.lines.length&&(this._refreshDrawHeightConstants(),this._refreshColorZonePadding())})))}_registerDimensionChangeListeners(){this.register(this._renderService.onRender((()=>{this._containerHeight&&this._containerHeight===this._screenElement.clientHeight||(this._queueRefresh(!0),this._containerHeight=this._screenElement.clientHeight)}))),this.register(this._optionsService.onSpecificOptionChange("overviewRulerWidth",(()=>this._queueRefresh(!0)))),this.register((0,o.addDisposableDomListener)(this._coreBrowseService.window,"resize",(()=>this._queueRefresh(!0)))),this._queueRefresh(!0)}_refreshDrawConstants(){const e=Math.floor(this._canvas.width/3),t=Math.ceil(this._canvas.width/3);d.full=this._canvas.width,d.left=e,d.center=t,d.right=e,this._refreshDrawHeightConstants(),_.full=0,_.left=0,_.center=d.left,_.right=d.left+d.center}_refreshDrawHeightConstants(){l.full=Math.round(2*this._coreBrowseService.dpr);const e=this._canvas.height/this._bufferService.buffer.lines.length,t=Math.round(Math.max(Math.min(e,12),6)*this._coreBrowseService.dpr);l.left=t,l.center=t,l.right=t}_refreshColorZonePadding(){this._colorZoneStore.setPadding({full:Math.floor(this._bufferService.buffers.active.lines.length/(this._canvas.height-1)*l.full),left:Math.floor(this._bufferService.buffers.active.lines.length/(this._canvas.height-1)*l.left),center:Math.floor(this._bufferService.buffers.active.lines.length/(this._canvas.height-1)*l.center),right:Math.floor(this._bufferService.buffers.active.lines.length/(this._canvas.height-1)*l.right)}),this._lastKnownBufferLength=this._bufferService.buffers.normal.lines.length}_refreshCanvasDimensions(){this._canvas.style.width=`${this._width}px`,this._canvas.width=Math.round(this._width*this._coreBrowseService.dpr),this._canvas.style.height=`${this._screenElement.clientHeight}px`,this._canvas.height=Math.round(this._screenElement.clientHeight*this._coreBrowseService.dpr),this._refreshDrawConstants(),this._refreshColorZonePadding()}_refreshDecorations(){this._shouldUpdateDimensions&&this._refreshCanvasDimensions(),this._ctx.clearRect(0,0,this._canvas.width,this._canvas.height),this._colorZoneStore.clear();for(const e of this._decorationService.decorations)this._colorZoneStore.addDecoration(e);this._ctx.lineWidth=1;const e=this._colorZoneStore.zones;for(const t of e)"full"!==t.position&&this._renderColorZone(t);for(const t of e)"full"===t.position&&this._renderColorZone(t);this._shouldUpdateDimensions=!1,this._shouldUpdateAnchor=!1}_renderColorZone(e){this._ctx.fillStyle=e.color,this._ctx.fillRect(_[e.position||"full"],Math.round((this._canvas.height-1)*(e.startBufferLine/this._bufferService.buffers.active.lines.length)-l[e.position||"full"]/2),d[e.position||"full"],Math.round((this._canvas.height-1)*((e.endBufferLine-e.startBufferLine)/this._bufferService.buffers.active.lines.length)+l[e.position||"full"]))}_queueRefresh(e,t){this._shouldUpdateDimensions=e||this._shouldUpdateDimensions,this._shouldUpdateAnchor=t||this._shouldUpdateAnchor,void 0===this._animationFrame&&(this._animationFrame=this._coreBrowseService.window.requestAnimationFrame((()=>{this._refreshDecorations(),this._animationFrame=void 0})))}};t.OverviewRulerRenderer=u=s([r(2,c.IBufferService),r(3,c.IDecorationService),r(4,a.IRenderService),r(5,c.IOptionsService),r(6,a.ICoreBrowserService)],u)},2950:function(e,t,i){var s=this&&this.__decorate||function(e,t,i,s){var r,n=arguments.length,o=n<3?t:null===s?s=Object.getOwnPropertyDescriptor(t,i):s;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)o=Reflect.decorate(e,t,i,s);else for(var a=e.length-1;a>=0;a--)(r=e[a])&&(o=(n<3?r(o):n>3?r(t,i,o):r(t,i))||o);return n>3&&o&&Object.defineProperty(t,i,o),o},r=this&&this.__param||function(e,t){return function(i,s){t(i,s,e)}};Object.defineProperty(t,"__esModule",{value:!0}),t.CompositionHelper=void 0;const n=i(4725),o=i(2585),a=i(2584);let h=t.CompositionHelper=class{get isComposing(){return this._isComposing}constructor(e,t,i,s,r,n){this._textarea=e,this._compositionView=t,this._bufferService=i,this._optionsService=s,this._coreService=r,this._renderService=n,this._isComposing=!1,this._isSendingComposition=!1,this._compositionPosition={start:0,end:0},this._dataAlreadySent=""}compositionstart(){this._isComposing=!0,this._compositionPosition.start=this._textarea.value.length,this._compositionView.textContent="",this._dataAlreadySent="",this._compositionView.classList.add("active")}compositionupdate(e){this._compositionView.textContent=e.data,this.updateCompositionElements(),setTimeout((()=>{this._compositionPosition.end=this._textarea.value.length}),0)}compositionend(){this._finalizeComposition(!0)}keydown(e){if(this._isComposing||this._isSendingComposition){if(229===e.keyCode)return!1;if(16===e.keyCode||17===e.keyCode||18===e.keyCode)return!1;this._finalizeComposition(!1)}return 229!==e.keyCode||(this._handleAnyTextareaChanges(),!1)}_finalizeComposition(e){if(this._compositionView.classList.remove("active"),this._isComposing=!1,e){const e={start:this._compositionPosition.start,end:this._compositionPosition.end};this._isSendingComposition=!0,setTimeout((()=>{if(this._isSendingComposition){let t;this._isSendingComposition=!1,e.start+=this._dataAlreadySent.length,t=this._isComposing?this._textarea.value.substring(e.start,e.end):this._textarea.value.substring(e.start),t.length>0&&this._coreService.triggerDataEvent(t,!0)}}),0)}else{this._isSendingComposition=!1;const e=this._textarea.value.substring(this._compositionPosition.start,this._compositionPosition.end);this._coreService.triggerDataEvent(e,!0)}}_handleAnyTextareaChanges(){const e=this._textarea.value;setTimeout((()=>{if(!this._isComposing){const t=this._textarea.value,i=t.replace(e,"");this._dataAlreadySent=i,t.length>e.length?this._coreService.triggerDataEvent(i,!0):t.length<e.length?this._coreService.triggerDataEvent(`${a.C0.DEL}`,!0):t.length===e.length&&t!==e&&this._coreService.triggerDataEvent(t,!0)}}),0)}updateCompositionElements(e){if(this._isComposing){if(this._bufferService.buffer.isCursorInViewport){const e=Math.min(this._bufferService.buffer.x,this._bufferService.cols-1),t=this._renderService.dimensions.css.cell.height,i=this._bufferService.buffer.y*this._renderService.dimensions.css.cell.height,s=e*this._renderService.dimensions.css.cell.width;this._compositionView.style.left=s+"px",this._compositionView.style.top=i+"px",this._compositionView.style.height=t+"px",this._compositionView.style.lineHeight=t+"px",this._compositionView.style.fontFamily=this._optionsService.rawOptions.fontFamily,this._compositionView.style.fontSize=this._optionsService.rawOptions.fontSize+"px";const r=this._compositionView.getBoundingClientRect();this._textarea.style.left=s+"px",this._textarea.style.top=i+"px",this._textarea.style.width=Math.max(r.width,1)+"px",this._textarea.style.height=Math.max(r.height,1)+"px",this._textarea.style.lineHeight=r.height+"px"}e||setTimeout((()=>this.updateCompositionElements(!0)),0)}}};t.CompositionHelper=h=s([r(2,o.IBufferService),r(3,o.IOptionsService),r(4,o.ICoreService),r(5,n.IRenderService)],h)},9806:(e,t)=>{function i(e,t,i){const s=i.getBoundingClientRect(),r=e.getComputedStyle(i),n=parseInt(r.getPropertyValue("padding-left")),o=parseInt(r.getPropertyValue("padding-top"));return[t.clientX-s.left-n,t.clientY-s.top-o]}Object.defineProperty(t,"__esModule",{value:!0}),t.getCoords=t.getCoordsRelativeToElement=void 0,t.getCoordsRelativeToElement=i,t.getCoords=function(e,t,s,r,n,o,a,h,c){if(!o)return;const l=i(e,t,s);return l?(l[0]=Math.ceil((l[0]+(c?a/2:0))/a),l[1]=Math.ceil(l[1]/h),l[0]=Math.min(Math.max(l[0],1),r+(c?1:0)),l[1]=Math.min(Math.max(l[1],1),n),l):void 0}},9504:(e,t,i)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.moveToCellSequence=void 0;const s=i(2584);function r(e,t,i,s){const r=e-n(e,i),a=t-n(t,i),l=Math.abs(r-a)-function(e,t,i){let s=0;const r=e-n(e,i),a=t-n(t,i);for(let n=0;n<Math.abs(r-a);n++){const a="A"===o(e,t)?-1:1,h=i.buffer.lines.get(r+a*n);(null==h?void 0:h.isWrapped)&&s++}return s}(e,t,i);return c(l,h(o(e,t),s))}function n(e,t){let i=0,s=t.buffer.lines.get(e),r=null==s?void 0:s.isWrapped;for(;r&&e>=0&&e<t.rows;)i++,s=t.buffer.lines.get(--e),r=null==s?void 0:s.isWrapped;return i}function o(e,t){return e>t?"A":"B"}function a(e,t,i,s,r,n){let o=e,a=t,h="";for(;o!==i||a!==s;)o+=r?1:-1,r&&o>n.cols-1?(h+=n.buffer.translateBufferLineToString(a,!1,e,o),o=0,e=0,a++):!r&&o<0&&(h+=n.buffer.translateBufferLineToString(a,!1,0,e+1),o=n.cols-1,e=o,a--);return h+n.buffer.translateBufferLineToString(a,!1,e,o)}function h(e,t){const i=t?"O":"[";return s.C0.ESC+i+e}function c(e,t){e=Math.floor(e);let i="";for(let s=0;s<e;s++)i+=t;return i}t.moveToCellSequence=function(e,t,i,s){const o=i.buffer.x,l=i.buffer.y;if(!i.buffer.hasScrollback)return function(e,t,i,s,o,l){return 0===r(t,s,o,l).length?"":c(a(e,t,e,t-n(t,o),!1,o).length,h("D",l))}(o,l,0,t,i,s)+r(l,t,i,s)+function(e,t,i,s,o,l){let d;d=r(t,s,o,l).length>0?s-n(s,o):t;const _=s,u=function(e,t,i,s,o,a){let h;return h=r(i,s,o,a).length>0?s-n(s,o):t,e<i&&h<=s||e>=i&&h<s?"C":"D"}(e,t,i,s,o,l);return c(a(e,d,i,_,"C"===u,o).length,h(u,l))}(o,l,e,t,i,s);let d;if(l===t)return d=o>e?"D":"C",c(Math.abs(o-e),h(d,s));d=l>t?"D":"C";const _=Math.abs(l-t);return c(function(e,t){return t.cols-e}(l>t?e:o,i)+(_-1)*i.cols+1+((l>t?o:e)-1),h(d,s))}},1296:function(e,t,i){var s=this&&this.__decorate||function(e,t,i,s){var r,n=arguments.length,o=n<3?t:null===s?s=Object.getOwnPropertyDescriptor(t,i):s;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)o=Reflect.decorate(e,t,i,s);else for(var a=e.length-1;a>=0;a--)(r=e[a])&&(o=(n<3?r(o):n>3?r(t,i,o):r(t,i))||o);return n>3&&o&&Object.defineProperty(t,i,o),o},r=this&&this.__param||function(e,t){return function(i,s){t(i,s,e)}};Object.defineProperty(t,"__esModule",{value:!0}),t.DomRenderer=void 0;const n=i(3787),o=i(2550),a=i(2223),h=i(6171),c=i(4725),l=i(8055),d=i(8460),_=i(844),u=i(2585),f="xterm-dom-renderer-owner-",v="xterm-rows",p="xterm-fg-",g="xterm-bg-",m="xterm-focus",S="xterm-selection";let C=1,b=t.DomRenderer=class extends _.Disposable{constructor(e,t,i,s,r,a,c,l,u,p){super(),this._element=e,this._screenElement=t,this._viewportElement=i,this._linkifier2=s,this._charSizeService=a,this._optionsService=c,this._bufferService=l,this._coreBrowserService=u,this._themeService=p,this._terminalClass=C++,this._rowElements=[],this.onRequestRedraw=this.register(new d.EventEmitter).event,this._rowContainer=document.createElement("div"),this._rowContainer.classList.add(v),this._rowContainer.style.lineHeight="normal",this._rowContainer.setAttribute("aria-hidden","true"),this._refreshRowElements(this._bufferService.cols,this._bufferService.rows),this._selectionContainer=document.createElement("div"),this._selectionContainer.classList.add(S),this._selectionContainer.setAttribute("aria-hidden","true"),this.dimensions=(0,h.createRenderDimensions)(),this._updateDimensions(),this.register(this._optionsService.onOptionChange((()=>this._handleOptionsChanged()))),this.register(this._themeService.onChangeColors((e=>this._injectCss(e)))),this._injectCss(this._themeService.colors),this._rowFactory=r.createInstance(n.DomRendererRowFactory,document),this._element.classList.add(f+this._terminalClass),this._screenElement.appendChild(this._rowContainer),this._screenElement.appendChild(this._selectionContainer),this.register(this._linkifier2.onShowLinkUnderline((e=>this._handleLinkHover(e)))),this.register(this._linkifier2.onHideLinkUnderline((e=>this._handleLinkLeave(e)))),this.register((0,_.toDisposable)((()=>{this._element.classList.remove(f+this._terminalClass),this._rowContainer.remove(),this._selectionContainer.remove(),this._widthCache.dispose(),this._themeStyleElement.remove(),this._dimensionsStyleElement.remove()}))),this._widthCache=new o.WidthCache(document),this._widthCache.setFont(this._optionsService.rawOptions.fontFamily,this._optionsService.rawOptions.fontSize,this._optionsService.rawOptions.fontWeight,this._optionsService.rawOptions.fontWeightBold),this._setDefaultSpacing()}_updateDimensions(){const e=this._coreBrowserService.dpr;this.dimensions.device.char.width=this._charSizeService.width*e,this.dimensions.device.char.height=Math.ceil(this._charSizeService.height*e),this.dimensions.device.cell.width=this.dimensions.device.char.width+Math.round(this._optionsService.rawOptions.letterSpacing),this.dimensions.device.cell.height=Math.floor(this.dimensions.device.char.height*this._optionsService.rawOptions.lineHeight),this.dimensions.device.char.left=0,this.dimensions.device.char.top=0,this.dimensions.device.canvas.width=this.dimensions.device.cell.width*this._bufferService.cols,this.dimensions.device.canvas.height=this.dimensions.device.cell.height*this._bufferService.rows,this.dimensions.css.canvas.width=Math.round(this.dimensions.device.canvas.width/e),this.dimensions.css.canvas.height=Math.round(this.dimensions.device.canvas.height/e),this.dimensions.css.cell.width=this.dimensions.css.canvas.width/this._bufferService.cols,this.dimensions.css.cell.height=this.dimensions.css.canvas.height/this._bufferService.rows;for(const e of this._rowElements)e.style.width=`${this.dimensions.css.canvas.width}px`,e.style.height=`${this.dimensions.css.cell.height}px`,e.style.lineHeight=`${this.dimensions.css.cell.height}px`,e.style.overflow="hidden";this._dimensionsStyleElement||(this._dimensionsStyleElement=document.createElement("style"),this._screenElement.appendChild(this._dimensionsStyleElement));const t=`${this._terminalSelector} .${v} span { display: inline-block; height: 100%; vertical-align: top;}`;this._dimensionsStyleElement.textContent=t,this._selectionContainer.style.height=this._viewportElement.style.height,this._screenElement.style.width=`${this.dimensions.css.canvas.width}px`,this._screenElement.style.height=`${this.dimensions.css.canvas.height}px`}_injectCss(e){this._themeStyleElement||(this._themeStyleElement=document.createElement("style"),this._screenElement.appendChild(this._themeStyleElement));let t=`${this._terminalSelector} .${v} { color: ${e.foreground.css}; font-family: ${this._optionsService.rawOptions.fontFamily}; font-size: ${this._optionsService.rawOptions.fontSize}px; font-kerning: none; white-space: pre}`;t+=`${this._terminalSelector} .${v} .xterm-dim { color: ${l.color.multiplyOpacity(e.foreground,.5).css};}`,t+=`${this._terminalSelector} span:not(.xterm-bold) { font-weight: ${this._optionsService.rawOptions.fontWeight};}${this._terminalSelector} span.xterm-bold { font-weight: ${this._optionsService.rawOptions.fontWeightBold};}${this._terminalSelector} span.xterm-italic { font-style: italic;}`,t+="@keyframes blink_box_shadow_"+this._terminalClass+" { 50% {  border-bottom-style: hidden; }}",t+="@keyframes blink_block_"+this._terminalClass+" { 0% {"+`  background-color: ${e.cursor.css};`+`  color: ${e.cursorAccent.css}; } 50% {  background-color: inherit;`+`  color: ${e.cursor.css}; }}`,t+=`${this._terminalSelector} .${v}.${m} .xterm-cursor.xterm-cursor-blink:not(.xterm-cursor-block) { animation: blink_box_shadow_`+this._terminalClass+" 1s step-end infinite;}"+`${this._terminalSelector} .${v}.${m} .xterm-cursor.xterm-cursor-blink.xterm-cursor-block { animation: blink_block_`+this._terminalClass+" 1s step-end infinite;}"+`${this._terminalSelector} .${v} .xterm-cursor.xterm-cursor-block {`+` background-color: ${e.cursor.css};`+` color: ${e.cursorAccent.css};}`+`${this._terminalSelector} .${v} .xterm-cursor.xterm-cursor-outline {`+` outline: 1px solid ${e.cursor.css}; outline-offset: -1px;}`+`${this._terminalSelector} .${v} .xterm-cursor.xterm-cursor-bar {`+` box-shadow: ${this._optionsService.rawOptions.cursorWidth}px 0 0 ${e.cursor.css} inset;}`+`${this._terminalSelector} .${v} .xterm-cursor.xterm-cursor-underline {`+` border-bottom: 1px ${e.cursor.css}; border-bottom-style: solid; height: calc(100% - 1px);}`,t+=`${this._terminalSelector} .${S} { position: absolute; top: 0; left: 0; z-index: 1; pointer-events: none;}${this._terminalSelector}.focus .${S} div { position: absolute; background-color: ${e.selectionBackgroundOpaque.css};}${this._terminalSelector} .${S} div { position: absolute; background-color: ${e.selectionInactiveBackgroundOpaque.css};}`;for(const[i,s]of e.ansi.entries())t+=`${this._terminalSelector} .${p}${i} { color: ${s.css}; }${this._terminalSelector} .${p}${i}.xterm-dim { color: ${l.color.multiplyOpacity(s,.5).css}; }${this._terminalSelector} .${g}${i} { background-color: ${s.css}; }`;t+=`${this._terminalSelector} .${p}${a.INVERTED_DEFAULT_COLOR} { color: ${l.color.opaque(e.background).css}; }${this._terminalSelector} .${p}${a.INVERTED_DEFAULT_COLOR}.xterm-dim { color: ${l.color.multiplyOpacity(l.color.opaque(e.background),.5).css}; }${this._terminalSelector} .${g}${a.INVERTED_DEFAULT_COLOR} { background-color: ${e.foreground.css}; }`,this._themeStyleElement.textContent=t}_setDefaultSpacing(){const e=this.dimensions.css.cell.width-this._widthCache.get("W",!1,!1);this._rowContainer.style.letterSpacing=`${e}px`,this._rowFactory.defaultSpacing=e}handleDevicePixelRatioChange(){this._updateDimensions(),this._widthCache.clear(),this._setDefaultSpacing()}_refreshRowElements(e,t){for(let e=this._rowElements.length;e<=t;e++){const e=document.createElement("div");this._rowContainer.appendChild(e),this._rowElements.push(e)}for(;this._rowElements.length>t;)this._rowContainer.removeChild(this._rowElements.pop())}handleResize(e,t){this._refreshRowElements(e,t),this._updateDimensions()}handleCharSizeChanged(){this._updateDimensions(),this._widthCache.clear(),this._setDefaultSpacing()}handleBlur(){this._rowContainer.classList.remove(m)}handleFocus(){this._rowContainer.classList.add(m),this.renderRows(this._bufferService.buffer.y,this._bufferService.buffer.y)}handleSelectionChanged(e,t,i){if(this._selectionContainer.replaceChildren(),this._rowFactory.handleSelectionChanged(e,t,i),this.renderRows(0,this._bufferService.rows-1),!e||!t)return;const s=e[1]-this._bufferService.buffer.ydisp,r=t[1]-this._bufferService.buffer.ydisp,n=Math.max(s,0),o=Math.min(r,this._bufferService.rows-1);if(n>=this._bufferService.rows||o<0)return;const a=document.createDocumentFragment();if(i){const i=e[0]>t[0];a.appendChild(this._createSelectionElement(n,i?t[0]:e[0],i?e[0]:t[0],o-n+1))}else{const i=s===n?e[0]:0,h=n===r?t[0]:this._bufferService.cols;a.appendChild(this._createSelectionElement(n,i,h));const c=o-n-1;if(a.appendChild(this._createSelectionElement(n+1,0,this._bufferService.cols,c)),n!==o){const e=r===o?t[0]:this._bufferService.cols;a.appendChild(this._createSelectionElement(o,0,e))}}this._selectionContainer.appendChild(a)}_createSelectionElement(e,t,i,s=1){const r=document.createElement("div");return r.style.height=s*this.dimensions.css.cell.height+"px",r.style.top=e*this.dimensions.css.cell.height+"px",r.style.left=t*this.dimensions.css.cell.width+"px",r.style.width=this.dimensions.css.cell.width*(i-t)+"px",r}handleCursorMove(){}_handleOptionsChanged(){this._updateDimensions(),this._injectCss(this._themeService.colors),this._widthCache.setFont(this._optionsService.rawOptions.fontFamily,this._optionsService.rawOptions.fontSize,this._optionsService.rawOptions.fontWeight,this._optionsService.rawOptions.fontWeightBold),this._setDefaultSpacing()}clear(){for(const e of this._rowElements)e.replaceChildren()}renderRows(e,t){const i=this._bufferService.buffer,s=i.ybase+i.y,r=Math.min(i.x,this._bufferService.cols-1),n=this._optionsService.rawOptions.cursorBlink,o=this._optionsService.rawOptions.cursorStyle,a=this._optionsService.rawOptions.cursorInactiveStyle;for(let h=e;h<=t;h++){const e=h+i.ydisp,t=this._rowElements[h],c=i.lines.get(e);if(!t||!c)break;t.replaceChildren(...this._rowFactory.createRow(c,e,e===s,o,a,r,n,this.dimensions.css.cell.width,this._widthCache,-1,-1))}}get _terminalSelector(){return`.${f}${this._terminalClass}`}_handleLinkHover(e){this._setCellUnderline(e.x1,e.x2,e.y1,e.y2,e.cols,!0)}_handleLinkLeave(e){this._setCellUnderline(e.x1,e.x2,e.y1,e.y2,e.cols,!1)}_setCellUnderline(e,t,i,s,r,n){i<0&&(e=0),s<0&&(t=0);const o=this._bufferService.rows-1;i=Math.max(Math.min(i,o),0),s=Math.max(Math.min(s,o),0),r=Math.min(r,this._bufferService.cols);const a=this._bufferService.buffer,h=a.ybase+a.y,c=Math.min(a.x,r-1),l=this._optionsService.rawOptions.cursorBlink,d=this._optionsService.rawOptions.cursorStyle,_=this._optionsService.rawOptions.cursorInactiveStyle;for(let o=i;o<=s;++o){const u=o+a.ydisp,f=this._rowElements[o],v=a.lines.get(u);if(!f||!v)break;f.replaceChildren(...this._rowFactory.createRow(v,u,u===h,d,_,c,l,this.dimensions.css.cell.width,this._widthCache,n?o===i?e:0:-1,n?(o===s?t:r)-1:-1))}}};t.DomRenderer=b=s([r(4,u.IInstantiationService),r(5,c.ICharSizeService),r(6,u.IOptionsService),r(7,u.IBufferService),r(8,c.ICoreBrowserService),r(9,c.IThemeService)],b)},3787:function(e,t,i){var s=this&&this.__decorate||function(e,t,i,s){var r,n=arguments.length,o=n<3?t:null===s?s=Object.getOwnPropertyDescriptor(t,i):s;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)o=Reflect.decorate(e,t,i,s);else for(var a=e.length-1;a>=0;a--)(r=e[a])&&(o=(n<3?r(o):n>3?r(t,i,o):r(t,i))||o);return n>3&&o&&Object.defineProperty(t,i,o),o},r=this&&this.__param||function(e,t){return function(i,s){t(i,s,e)}};Object.defineProperty(t,"__esModule",{value:!0}),t.DomRendererRowFactory=void 0;const n=i(2223),o=i(643),a=i(511),h=i(2585),c=i(8055),l=i(4725),d=i(4269),_=i(6171),u=i(3734);let f=t.DomRendererRowFactory=class{constructor(e,t,i,s,r,n,o){this._document=e,this._characterJoinerService=t,this._optionsService=i,this._coreBrowserService=s,this._coreService=r,this._decorationService=n,this._themeService=o,this._workCell=new a.CellData,this._columnSelectMode=!1,this.defaultSpacing=0}handleSelectionChanged(e,t,i){this._selectionStart=e,this._selectionEnd=t,this._columnSelectMode=i}createRow(e,t,i,s,r,a,h,l,_,f,p){const g=[],m=this._characterJoinerService.getJoinedCharacters(t),S=this._themeService.colors;let C,b=e.getNoBgTrimmedLength();i&&b<a+1&&(b=a+1);let y=0,w="",E=0,k=0,L=0,D=!1,R=0,x=!1,A=0;const B=[],T=-1!==f&&-1!==p;for(let M=0;M<b;M++){e.loadCell(M,this._workCell);let b=this._workCell.getWidth();if(0===b)continue;let O=!1,P=M,I=this._workCell;if(m.length>0&&M===m[0][0]){O=!0;const t=m.shift();I=new d.JoinedCellData(this._workCell,e.translateToString(!0,t[0],t[1]),t[1]-t[0]),P=t[1]-1,b=I.getWidth()}const H=this._isCellInSelection(M,t),F=i&&M===a,W=T&&M>=f&&M<=p;let U=!1;this._decorationService.forEachDecorationAtCell(M,t,void 0,(e=>{U=!0}));let N=I.getChars()||o.WHITESPACE_CELL_CHAR;if(" "===N&&(I.isUnderline()||I.isOverline())&&(N=" "),A=b*l-_.get(N,I.isBold(),I.isItalic()),C){if(y&&(H&&x||!H&&!x&&I.bg===E)&&(H&&x&&S.selectionForeground||I.fg===k)&&I.extended.ext===L&&W===D&&A===R&&!F&&!O&&!U){w+=N,y++;continue}y&&(C.textContent=w),C=this._document.createElement("span"),y=0,w=""}else C=this._document.createElement("span");if(E=I.bg,k=I.fg,L=I.extended.ext,D=W,R=A,x=H,O&&a>=M&&a<=P&&(a=M),!this._coreService.isCursorHidden&&F)if(B.push("xterm-cursor"),this._coreBrowserService.isFocused)h&&B.push("xterm-cursor-blink"),B.push("bar"===s?"xterm-cursor-bar":"underline"===s?"xterm-cursor-underline":"xterm-cursor-block");else if(r)switch(r){case"outline":B.push("xterm-cursor-outline");break;case"block":B.push("xterm-cursor-block");break;case"bar":B.push("xterm-cursor-bar");break;case"underline":B.push("xterm-cursor-underline")}if(I.isBold()&&B.push("xterm-bold"),I.isItalic()&&B.push("xterm-italic"),I.isDim()&&B.push("xterm-dim"),w=I.isInvisible()?o.WHITESPACE_CELL_CHAR:I.getChars()||o.WHITESPACE_CELL_CHAR,I.isUnderline()&&(B.push(`xterm-underline-${I.extended.underlineStyle}`)," "===w&&(w=" "),!I.isUnderlineColorDefault()))if(I.isUnderlineColorRGB())C.style.textDecorationColor=`rgb(${u.AttributeData.toColorRGB(I.getUnderlineColor()).join(",")})`;else{let e=I.getUnderlineColor();this._optionsService.rawOptions.drawBoldTextInBrightColors&&I.isBold()&&e<8&&(e+=8),C.style.textDecorationColor=S.ansi[e].css}I.isOverline()&&(B.push("xterm-overline")," "===w&&(w=" ")),I.isStrikethrough()&&B.push("xterm-strikethrough"),W&&(C.style.textDecoration="underline");let $=I.getFgColor(),j=I.getFgColorMode(),z=I.getBgColor(),K=I.getBgColorMode();const q=!!I.isInverse();if(q){const e=$;$=z,z=e;const t=j;j=K,K=t}let V,G,X,J=!1;switch(this._decorationService.forEachDecorationAtCell(M,t,void 0,(e=>{"top"!==e.options.layer&&J||(e.backgroundColorRGB&&(K=50331648,z=e.backgroundColorRGB.rgba>>8&16777215,V=e.backgroundColorRGB),e.foregroundColorRGB&&(j=50331648,$=e.foregroundColorRGB.rgba>>8&16777215,G=e.foregroundColorRGB),J="top"===e.options.layer)})),!J&&H&&(V=this._coreBrowserService.isFocused?S.selectionBackgroundOpaque:S.selectionInactiveBackgroundOpaque,z=V.rgba>>8&16777215,K=50331648,J=!0,S.selectionForeground&&(j=50331648,$=S.selectionForeground.rgba>>8&16777215,G=S.selectionForeground)),J&&B.push("xterm-decoration-top"),K){case 16777216:case 33554432:X=S.ansi[z],B.push(`xterm-bg-${z}`);break;case 50331648:X=c.rgba.toColor(z>>16,z>>8&255,255&z),this._addStyle(C,`background-color:#${v((z>>>0).toString(16),"0",6)}`);break;default:q?(X=S.foreground,B.push(`xterm-bg-${n.INVERTED_DEFAULT_COLOR}`)):X=S.background}switch(V||I.isDim()&&(V=c.color.multiplyOpacity(X,.5)),j){case 16777216:case 33554432:I.isBold()&&$<8&&this._optionsService.rawOptions.drawBoldTextInBrightColors&&($+=8),this._applyMinimumContrast(C,X,S.ansi[$],I,V,void 0)||B.push(`xterm-fg-${$}`);break;case 50331648:const e=c.rgba.toColor($>>16&255,$>>8&255,255&$);this._applyMinimumContrast(C,X,e,I,V,G)||this._addStyle(C,`color:#${v($.toString(16),"0",6)}`);break;default:this._applyMinimumContrast(C,X,S.foreground,I,V,void 0)||q&&B.push(`xterm-fg-${n.INVERTED_DEFAULT_COLOR}`)}B.length&&(C.className=B.join(" "),B.length=0),F||O||U?C.textContent=w:y++,A!==this.defaultSpacing&&(C.style.letterSpacing=`${A}px`),g.push(C),M=P}return C&&y&&(C.textContent=w),g}_applyMinimumContrast(e,t,i,s,r,n){if(1===this._optionsService.rawOptions.minimumContrastRatio||(0,_.excludeFromContrastRatioDemands)(s.getCode()))return!1;const o=this._getContrastCache(s);let a;if(r||n||(a=o.getColor(t.rgba,i.rgba)),void 0===a){const e=this._optionsService.rawOptions.minimumContrastRatio/(s.isDim()?2:1);a=c.color.ensureContrastRatio(r||t,n||i,e),o.setColor((r||t).rgba,(n||i).rgba,null!=a?a:null)}return!!a&&(this._addStyle(e,`color:${a.css}`),!0)}_getContrastCache(e){return e.isDim()?this._themeService.colors.halfContrastCache:this._themeService.colors.contrastCache}_addStyle(e,t){e.setAttribute("style",`${e.getAttribute("style")||""}${t};`)}_isCellInSelection(e,t){const i=this._selectionStart,s=this._selectionEnd;return!(!i||!s)&&(this._columnSelectMode?i[0]<=s[0]?e>=i[0]&&t>=i[1]&&e<s[0]&&t<=s[1]:e<i[0]&&t>=i[1]&&e>=s[0]&&t<=s[1]:t>i[1]&&t<s[1]||i[1]===s[1]&&t===i[1]&&e>=i[0]&&e<s[0]||i[1]<s[1]&&t===s[1]&&e<s[0]||i[1]<s[1]&&t===i[1]&&e>=i[0])}};function v(e,t,i){for(;e.length<i;)e=t+e;return e}t.DomRendererRowFactory=f=s([r(1,l.ICharacterJoinerService),r(2,h.IOptionsService),r(3,l.ICoreBrowserService),r(4,h.ICoreService),r(5,h.IDecorationService),r(6,l.IThemeService)],f)},2550:(e,t)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.WidthCache=void 0,t.WidthCache=class{constructor(e){this._flat=new Float32Array(256),this._font="",this._fontSize=0,this._weight="normal",this._weightBold="bold",this._measureElements=[],this._container=e.createElement("div"),this._container.style.position="absolute",this._container.style.top="-50000px",this._container.style.width="50000px",this._container.style.whiteSpace="pre",this._container.style.fontKerning="none";const t=e.createElement("span"),i=e.createElement("span");i.style.fontWeight="bold";const s=e.createElement("span");s.style.fontStyle="italic";const r=e.createElement("span");r.style.fontWeight="bold",r.style.fontStyle="italic",this._measureElements=[t,i,s,r],this._container.appendChild(t),this._container.appendChild(i),this._container.appendChild(s),this._container.appendChild(r),e.body.appendChild(this._container),this.clear()}dispose(){this._container.remove(),this._measureElements.length=0,this._holey=void 0}clear(){this._flat.fill(-9999),this._holey=new Map}setFont(e,t,i,s){e===this._font&&t===this._fontSize&&i===this._weight&&s===this._weightBold||(this._font=e,this._fontSize=t,this._weight=i,this._weightBold=s,this._container.style.fontFamily=this._font,this._container.style.fontSize=`${this._fontSize}px`,this._measureElements[0].style.fontWeight=`${i}`,this._measureElements[1].style.fontWeight=`${s}`,this._measureElements[2].style.fontWeight=`${i}`,this._measureElements[3].style.fontWeight=`${s}`,this.clear())}get(e,t,i){let s=0;if(!t&&!i&&1===e.length&&(s=e.charCodeAt(0))<256)return-9999!==this._flat[s]?this._flat[s]:this._flat[s]=this._measure(e,0);let r=e;t&&(r+="B"),i&&(r+="I");let n=this._holey.get(r);if(void 0===n){let s=0;t&&(s|=1),i&&(s|=2),n=this._measure(e,s),this._holey.set(r,n)}return n}_measure(e,t){const i=this._measureElements[t];return i.textContent=e.repeat(32),i.offsetWidth/32}}},2223:(e,t,i)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.TEXT_BASELINE=t.DIM_OPACITY=t.INVERTED_DEFAULT_COLOR=void 0;const s=i(6114);t.INVERTED_DEFAULT_COLOR=257,t.DIM_OPACITY=.5,t.TEXT_BASELINE=s.isFirefox||s.isLegacyEdge?"bottom":"ideographic"},6171:(e,t)=>{function i(e){return 57508<=e&&e<=57558}Object.defineProperty(t,"__esModule",{value:!0}),t.createRenderDimensions=t.excludeFromContrastRatioDemands=t.isRestrictedPowerlineGlyph=t.isPowerlineGlyph=t.throwIfFalsy=void 0,t.throwIfFalsy=function(e){if(!e)throw new Error("value must not be falsy");return e},t.isPowerlineGlyph=i,t.isRestrictedPowerlineGlyph=function(e){return 57520<=e&&e<=57527},t.excludeFromContrastRatioDemands=function(e){return i(e)||function(e){return 9472<=e&&e<=9631}(e)},t.createRenderDimensions=function(){return{css:{canvas:{width:0,height:0},cell:{width:0,height:0}},device:{canvas:{width:0,height:0},cell:{width:0,height:0},char:{width:0,height:0,left:0,top:0}}}}},456:(e,t)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.SelectionModel=void 0,t.SelectionModel=class{constructor(e){this._bufferService=e,this.isSelectAllActive=!1,this.selectionStartLength=0}clearSelection(){this.selectionStart=void 0,this.selectionEnd=void 0,this.isSelectAllActive=!1,this.selectionStartLength=0}get finalSelectionStart(){return this.isSelectAllActive?[0,0]:this.selectionEnd&&this.selectionStart&&this.areSelectionValuesReversed()?this.selectionEnd:this.selectionStart}get finalSelectionEnd(){if(this.isSelectAllActive)return[this._bufferService.cols,this._bufferService.buffer.ybase+this._bufferService.rows-1];if(this.selectionStart){if(!this.selectionEnd||this.areSelectionValuesReversed()){const e=this.selectionStart[0]+this.selectionStartLength;return e>this._bufferService.cols?e%this._bufferService.cols==0?[this._bufferService.cols,this.selectionStart[1]+Math.floor(e/this._bufferService.cols)-1]:[e%this._bufferService.cols,this.selectionStart[1]+Math.floor(e/this._bufferService.cols)]:[e,this.selectionStart[1]]}if(this.selectionStartLength&&this.selectionEnd[1]===this.selectionStart[1]){const e=this.selectionStart[0]+this.selectionStartLength;return e>this._bufferService.cols?[e%this._bufferService.cols,this.selectionStart[1]+Math.floor(e/this._bufferService.cols)]:[Math.max(e,this.selectionEnd[0]),this.selectionEnd[1]]}return this.selectionEnd}}areSelectionValuesReversed(){const e=this.selectionStart,t=this.selectionEnd;return!(!e||!t)&&(e[1]>t[1]||e[1]===t[1]&&e[0]>t[0])}handleTrim(e){return this.selectionStart&&(this.selectionStart[1]-=e),this.selectionEnd&&(this.selectionEnd[1]-=e),this.selectionEnd&&this.selectionEnd[1]<0?(this.clearSelection(),!0):(this.selectionStart&&this.selectionStart[1]<0&&(this.selectionStart[1]=0),!1)}}},428:function(e,t,i){var s=this&&this.__decorate||function(e,t,i,s){var r,n=arguments.length,o=n<3?t:null===s?s=Object.getOwnPropertyDescriptor(t,i):s;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)o=Reflect.decorate(e,t,i,s);else for(var a=e.length-1;a>=0;a--)(r=e[a])&&(o=(n<3?r(o):n>3?r(t,i,o):r(t,i))||o);return n>3&&o&&Object.defineProperty(t,i,o),o},r=this&&this.__param||function(e,t){return function(i,s){t(i,s,e)}};Object.defineProperty(t,"__esModule",{value:!0}),t.CharSizeService=void 0;const n=i(2585),o=i(8460),a=i(844);let h=t.CharSizeService=class extends a.Disposable{get hasValidSize(){return this.width>0&&this.height>0}constructor(e,t,i){super(),this._optionsService=i,this.width=0,this.height=0,this._onCharSizeChange=this.register(new o.EventEmitter),this.onCharSizeChange=this._onCharSizeChange.event,this._measureStrategy=new c(e,t,this._optionsService),this.register(this._optionsService.onMultipleOptionChange(["fontFamily","fontSize"],(()=>this.measure())))}measure(){const e=this._measureStrategy.measure();e.width===this.width&&e.height===this.height||(this.width=e.width,this.height=e.height,this._onCharSizeChange.fire())}};t.CharSizeService=h=s([r(2,n.IOptionsService)],h);class c{constructor(e,t,i){this._document=e,this._parentElement=t,this._optionsService=i,this._result={width:0,height:0},this._measureElement=this._document.createElement("span"),this._measureElement.classList.add("xterm-char-measure-element"),this._measureElement.textContent="W".repeat(32),this._measureElement.setAttribute("aria-hidden","true"),this._measureElement.style.whiteSpace="pre",this._measureElement.style.fontKerning="none",this._parentElement.appendChild(this._measureElement)}measure(){this._measureElement.style.fontFamily=this._optionsService.rawOptions.fontFamily,this._measureElement.style.fontSize=`${this._optionsService.rawOptions.fontSize}px`;const e={height:Number(this._measureElement.offsetHeight),width:Number(this._measureElement.offsetWidth)};return 0!==e.width&&0!==e.height&&(this._result.width=e.width/32,this._result.height=Math.ceil(e.height)),this._result}}},4269:function(e,t,i){var s=this&&this.__decorate||function(e,t,i,s){var r,n=arguments.length,o=n<3?t:null===s?s=Object.getOwnPropertyDescriptor(t,i):s;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)o=Reflect.decorate(e,t,i,s);else for(var a=e.length-1;a>=0;a--)(r=e[a])&&(o=(n<3?r(o):n>3?r(t,i,o):r(t,i))||o);return n>3&&o&&Object.defineProperty(t,i,o),o},r=this&&this.__param||function(e,t){return function(i,s){t(i,s,e)}};Object.defineProperty(t,"__esModule",{value:!0}),t.CharacterJoinerService=t.JoinedCellData=void 0;const n=i(3734),o=i(643),a=i(511),h=i(2585);class c extends n.AttributeData{constructor(e,t,i){super(),this.content=0,this.combinedData="",this.fg=e.fg,this.bg=e.bg,this.combinedData=t,this._width=i}isCombined(){return 2097152}getWidth(){return this._width}getChars(){return this.combinedData}getCode(){return 2097151}setFromCharData(e){throw new Error("not implemented")}getAsCharData(){return[this.fg,this.getChars(),this.getWidth(),this.getCode()]}}t.JoinedCellData=c;let l=t.CharacterJoinerService=class e{constructor(e){this._bufferService=e,this._characterJoiners=[],this._nextCharacterJoinerId=0,this._workCell=new a.CellData}register(e){const t={id:this._nextCharacterJoinerId++,handler:e};return this._characterJoiners.push(t),t.id}deregister(e){for(let t=0;t<this._characterJoiners.length;t++)if(this._characterJoiners[t].id===e)return this._characterJoiners.splice(t,1),!0;return!1}getJoinedCharacters(e){if(0===this._characterJoiners.length)return[];const t=this._bufferService.buffer.lines.get(e);if(!t||0===t.length)return[];const i=[],s=t.translateToString(!0);let r=0,n=0,a=0,h=t.getFg(0),c=t.getBg(0);for(let e=0;e<t.getTrimmedLength();e++)if(t.loadCell(e,this._workCell),0!==this._workCell.getWidth()){if(this._workCell.fg!==h||this._workCell.bg!==c){if(e-r>1){const e=this._getJoinedRanges(s,a,n,t,r);for(let t=0;t<e.length;t++)i.push(e[t])}r=e,a=n,h=this._workCell.fg,c=this._workCell.bg}n+=this._workCell.getChars().length||o.WHITESPACE_CELL_CHAR.length}if(this._bufferService.cols-r>1){const e=this._getJoinedRanges(s,a,n,t,r);for(let t=0;t<e.length;t++)i.push(e[t])}return i}_getJoinedRanges(t,i,s,r,n){const o=t.substring(i,s);let a=[];try{a=this._characterJoiners[0].handler(o)}catch(e){console.error(e)}for(let t=1;t<this._characterJoiners.length;t++)try{const i=this._characterJoiners[t].handler(o);for(let t=0;t<i.length;t++)e._mergeRanges(a,i[t])}catch(e){console.error(e)}return this._stringRangesToCellRanges(a,r,n),a}_stringRangesToCellRanges(e,t,i){let s=0,r=!1,n=0,a=e[s];if(a){for(let h=i;h<this._bufferService.cols;h++){const i=t.getWidth(h),c=t.getString(h).length||o.WHITESPACE_CELL_CHAR.length;if(0!==i){if(!r&&a[0]<=n&&(a[0]=h,r=!0),a[1]<=n){if(a[1]=h,a=e[++s],!a)break;a[0]<=n?(a[0]=h,r=!0):r=!1}n+=c}}a&&(a[1]=this._bufferService.cols)}}static _mergeRanges(e,t){let i=!1;for(let s=0;s<e.length;s++){const r=e[s];if(i){if(t[1]<=r[0])return e[s-1][1]=t[1],e;if(t[1]<=r[1])return e[s-1][1]=Math.max(t[1],r[1]),e.splice(s,1),e;e.splice(s,1),s--}else{if(t[1]<=r[0])return e.splice(s,0,t),e;if(t[1]<=r[1])return r[0]=Math.min(t[0],r[0]),e;t[0]<r[1]&&(r[0]=Math.min(t[0],r[0]),i=!0)}}return i?e[e.length-1][1]=t[1]:e.push(t),e}};t.CharacterJoinerService=l=s([r(0,h.IBufferService)],l)},5114:(e,t)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.CoreBrowserService=void 0,t.CoreBrowserService=class{constructor(e,t){this._textarea=e,this.window=t,this._isFocused=!1,this._cachedIsFocused=void 0,this._textarea.addEventListener("focus",(()=>this._isFocused=!0)),this._textarea.addEventListener("blur",(()=>this._isFocused=!1))}get dpr(){return this.window.devicePixelRatio}get isFocused(){return void 0===this._cachedIsFocused&&(this._cachedIsFocused=this._isFocused&&this._textarea.ownerDocument.hasFocus(),queueMicrotask((()=>this._cachedIsFocused=void 0))),this._cachedIsFocused}}},8934:function(e,t,i){var s=this&&this.__decorate||function(e,t,i,s){var r,n=arguments.length,o=n<3?t:null===s?s=Object.getOwnPropertyDescriptor(t,i):s;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)o=Reflect.decorate(e,t,i,s);else for(var a=e.length-1;a>=0;a--)(r=e[a])&&(o=(n<3?r(o):n>3?r(t,i,o):r(t,i))||o);return n>3&&o&&Object.defineProperty(t,i,o),o},r=this&&this.__param||function(e,t){return function(i,s){t(i,s,e)}};Object.defineProperty(t,"__esModule",{value:!0}),t.MouseService=void 0;const n=i(4725),o=i(9806);let a=t.MouseService=class{constructor(e,t){this._renderService=e,this._charSizeService=t}getCoords(e,t,i,s,r){return(0,o.getCoords)(window,e,t,i,s,this._charSizeService.hasValidSize,this._renderService.dimensions.css.cell.width,this._renderService.dimensions.css.cell.height,r)}getMouseReportCoords(e,t){const i=(0,o.getCoordsRelativeToElement)(window,e,t);if(this._charSizeService.hasValidSize)return i[0]=Math.min(Math.max(i[0],0),this._renderService.dimensions.css.canvas.width-1),i[1]=Math.min(Math.max(i[1],0),this._renderService.dimensions.css.canvas.height-1),{col:Math.floor(i[0]/this._renderService.dimensions.css.cell.width),row:Math.floor(i[1]/this._renderService.dimensions.css.cell.height),x:Math.floor(i[0]),y:Math.floor(i[1])}}};t.MouseService=a=s([r(0,n.IRenderService),r(1,n.ICharSizeService)],a)},3230:function(e,t,i){var s=this&&this.__decorate||function(e,t,i,s){var r,n=arguments.length,o=n<3?t:null===s?s=Object.getOwnPropertyDescriptor(t,i):s;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)o=Reflect.decorate(e,t,i,s);else for(var a=e.length-1;a>=0;a--)(r=e[a])&&(o=(n<3?r(o):n>3?r(t,i,o):r(t,i))||o);return n>3&&o&&Object.defineProperty(t,i,o),o},r=this&&this.__param||function(e,t){return function(i,s){t(i,s,e)}};Object.defineProperty(t,"__esModule",{value:!0}),t.RenderService=void 0;const n=i(3656),o=i(6193),a=i(5596),h=i(4725),c=i(8460),l=i(844),d=i(7226),_=i(2585);let u=t.RenderService=class extends l.Disposable{get dimensions(){return this._renderer.value.dimensions}constructor(e,t,i,s,r,h,_,u){if(super(),this._rowCount=e,this._charSizeService=s,this._renderer=this.register(new l.MutableDisposable),this._pausedResizeTask=new d.DebouncedIdleTask,this._isPaused=!1,this._needsFullRefresh=!1,this._isNextRenderRedrawOnly=!0,this._needsSelectionRefresh=!1,this._canvasWidth=0,this._canvasHeight=0,this._selectionState={start:void 0,end:void 0,columnSelectMode:!1},this._onDimensionsChange=this.register(new c.EventEmitter),this.onDimensionsChange=this._onDimensionsChange.event,this._onRenderedViewportChange=this.register(new c.EventEmitter),this.onRenderedViewportChange=this._onRenderedViewportChange.event,this._onRender=this.register(new c.EventEmitter),this.onRender=this._onRender.event,this._onRefreshRequest=this.register(new c.EventEmitter),this.onRefreshRequest=this._onRefreshRequest.event,this._renderDebouncer=new o.RenderDebouncer(_.window,((e,t)=>this._renderRows(e,t))),this.register(this._renderDebouncer),this._screenDprMonitor=new a.ScreenDprMonitor(_.window),this._screenDprMonitor.setListener((()=>this.handleDevicePixelRatioChange())),this.register(this._screenDprMonitor),this.register(h.onResize((()=>this._fullRefresh()))),this.register(h.buffers.onBufferActivate((()=>{var e;return null===(e=this._renderer.value)||void 0===e?void 0:e.clear()}))),this.register(i.onOptionChange((()=>this._handleOptionsChanged()))),this.register(this._charSizeService.onCharSizeChange((()=>this.handleCharSizeChanged()))),this.register(r.onDecorationRegistered((()=>this._fullRefresh()))),this.register(r.onDecorationRemoved((()=>this._fullRefresh()))),this.register(i.onMultipleOptionChange(["customGlyphs","drawBoldTextInBrightColors","letterSpacing","lineHeight","fontFamily","fontSize","fontWeight","fontWeightBold","minimumContrastRatio"],(()=>{this.clear(),this.handleResize(h.cols,h.rows),this._fullRefresh()}))),this.register(i.onMultipleOptionChange(["cursorBlink","cursorStyle"],(()=>this.refreshRows(h.buffer.y,h.buffer.y,!0)))),this.register((0,n.addDisposableDomListener)(_.window,"resize",(()=>this.handleDevicePixelRatioChange()))),this.register(u.onChangeColors((()=>this._fullRefresh()))),"IntersectionObserver"in _.window){const e=new _.window.IntersectionObserver((e=>this._handleIntersectionChange(e[e.length-1])),{threshold:0});e.observe(t),this.register({dispose:()=>e.disconnect()})}}_handleIntersectionChange(e){this._isPaused=void 0===e.isIntersecting?0===e.intersectionRatio:!e.isIntersecting,this._isPaused||this._charSizeService.hasValidSize||this._charSizeService.measure(),!this._isPaused&&this._needsFullRefresh&&(this._pausedResizeTask.flush(),this.refreshRows(0,this._rowCount-1),this._needsFullRefresh=!1)}refreshRows(e,t,i=!1){this._isPaused?this._needsFullRefresh=!0:(i||(this._isNextRenderRedrawOnly=!1),this._renderDebouncer.refresh(e,t,this._rowCount))}_renderRows(e,t){this._renderer.value&&(e=Math.min(e,this._rowCount-1),t=Math.min(t,this._rowCount-1),this._renderer.value.renderRows(e,t),this._needsSelectionRefresh&&(this._renderer.value.handleSelectionChanged(this._selectionState.start,this._selectionState.end,this._selectionState.columnSelectMode),this._needsSelectionRefresh=!1),this._isNextRenderRedrawOnly||this._onRenderedViewportChange.fire({start:e,end:t}),this._onRender.fire({start:e,end:t}),this._isNextRenderRedrawOnly=!0)}resize(e,t){this._rowCount=t,this._fireOnCanvasResize()}_handleOptionsChanged(){this._renderer.value&&(this.refreshRows(0,this._rowCount-1),this._fireOnCanvasResize())}_fireOnCanvasResize(){this._renderer.value&&(this._renderer.value.dimensions.css.canvas.width===this._canvasWidth&&this._renderer.value.dimensions.css.canvas.height===this._canvasHeight||this._onDimensionsChange.fire(this._renderer.value.dimensions))}hasRenderer(){return!!this._renderer.value}setRenderer(e){this._renderer.value=e,this._renderer.value.onRequestRedraw((e=>this.refreshRows(e.start,e.end,!0))),this._needsSelectionRefresh=!0,this._fullRefresh()}addRefreshCallback(e){return this._renderDebouncer.addRefreshCallback(e)}_fullRefresh(){this._isPaused?this._needsFullRefresh=!0:this.refreshRows(0,this._rowCount-1)}clearTextureAtlas(){var e,t;this._renderer.value&&(null===(t=(e=this._renderer.value).clearTextureAtlas)||void 0===t||t.call(e),this._fullRefresh())}handleDevicePixelRatioChange(){this._charSizeService.measure(),this._renderer.value&&(this._renderer.value.handleDevicePixelRatioChange(),this.refreshRows(0,this._rowCount-1))}handleResize(e,t){this._renderer.value&&(this._isPaused?this._pausedResizeTask.set((()=>this._renderer.value.handleResize(e,t))):this._renderer.value.handleResize(e,t),this._fullRefresh())}handleCharSizeChanged(){var e;null===(e=this._renderer.value)||void 0===e||e.handleCharSizeChanged()}handleBlur(){var e;null===(e=this._renderer.value)||void 0===e||e.handleBlur()}handleFocus(){var e;null===(e=this._renderer.value)||void 0===e||e.handleFocus()}handleSelectionChanged(e,t,i){var s;this._selectionState.start=e,this._selectionState.end=t,this._selectionState.columnSelectMode=i,null===(s=this._renderer.value)||void 0===s||s.handleSelectionChanged(e,t,i)}handleCursorMove(){var e;null===(e=this._renderer.value)||void 0===e||e.handleCursorMove()}clear(){var e;null===(e=this._renderer.value)||void 0===e||e.clear()}};t.RenderService=u=s([r(2,_.IOptionsService),r(3,h.ICharSizeService),r(4,_.IDecorationService),r(5,_.IBufferService),r(6,h.ICoreBrowserService),r(7,h.IThemeService)],u)},9312:function(e,t,i){var s=this&&this.__decorate||function(e,t,i,s){var r,n=arguments.length,o=n<3?t:null===s?s=Object.getOwnPropertyDescriptor(t,i):s;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)o=Reflect.decorate(e,t,i,s);else for(var a=e.length-1;a>=0;a--)(r=e[a])&&(o=(n<3?r(o):n>3?r(t,i,o):r(t,i))||o);return n>3&&o&&Object.defineProperty(t,i,o),o},r=this&&this.__param||function(e,t){return function(i,s){t(i,s,e)}};Object.defineProperty(t,"__esModule",{value:!0}),t.SelectionService=void 0;const n=i(9806),o=i(9504),a=i(456),h=i(4725),c=i(8460),l=i(844),d=i(6114),_=i(4841),u=i(511),f=i(2585),v=String.fromCharCode(160),p=new RegExp(v,"g");let g=t.SelectionService=class extends l.Disposable{constructor(e,t,i,s,r,n,o,h,d){super(),this._element=e,this._screenElement=t,this._linkifier=i,this._bufferService=s,this._coreService=r,this._mouseService=n,this._optionsService=o,this._renderService=h,this._coreBrowserService=d,this._dragScrollAmount=0,this._enabled=!0,this._workCell=new u.CellData,this._mouseDownTimeStamp=0,this._oldHasSelection=!1,this._oldSelectionStart=void 0,this._oldSelectionEnd=void 0,this._onLinuxMouseSelection=this.register(new c.EventEmitter),this.onLinuxMouseSelection=this._onLinuxMouseSelection.event,this._onRedrawRequest=this.register(new c.EventEmitter),this.onRequestRedraw=this._onRedrawRequest.event,this._onSelectionChange=this.register(new c.EventEmitter),this.onSelectionChange=this._onSelectionChange.event,this._onRequestScrollLines=this.register(new c.EventEmitter),this.onRequestScrollLines=this._onRequestScrollLines.event,this._mouseMoveListener=e=>this._handleMouseMove(e),this._mouseUpListener=e=>this._handleMouseUp(e),this._coreService.onUserInput((()=>{this.hasSelection&&this.clearSelection()})),this._trimListener=this._bufferService.buffer.lines.onTrim((e=>this._handleTrim(e))),this.register(this._bufferService.buffers.onBufferActivate((e=>this._handleBufferActivate(e)))),this.enable(),this._model=new a.SelectionModel(this._bufferService),this._activeSelectionMode=0,this.register((0,l.toDisposable)((()=>{this._removeMouseDownListeners()})))}reset(){this.clearSelection()}disable(){this.clearSelection(),this._enabled=!1}enable(){this._enabled=!0}get selectionStart(){return this._model.finalSelectionStart}get selectionEnd(){return this._model.finalSelectionEnd}get hasSelection(){const e=this._model.finalSelectionStart,t=this._model.finalSelectionEnd;return!(!e||!t||e[0]===t[0]&&e[1]===t[1])}get selectionText(){const e=this._model.finalSelectionStart,t=this._model.finalSelectionEnd;if(!e||!t)return"";const i=this._bufferService.buffer,s=[];if(3===this._activeSelectionMode){if(e[0]===t[0])return"";const r=e[0]<t[0]?e[0]:t[0],n=e[0]<t[0]?t[0]:e[0];for(let o=e[1];o<=t[1];o++){const e=i.translateBufferLineToString(o,!0,r,n);s.push(e)}}else{const r=e[1]===t[1]?t[0]:void 0;s.push(i.translateBufferLineToString(e[1],!0,e[0],r));for(let r=e[1]+1;r<=t[1]-1;r++){const e=i.lines.get(r),t=i.translateBufferLineToString(r,!0);(null==e?void 0:e.isWrapped)?s[s.length-1]+=t:s.push(t)}if(e[1]!==t[1]){const e=i.lines.get(t[1]),r=i.translateBufferLineToString(t[1],!0,0,t[0]);e&&e.isWrapped?s[s.length-1]+=r:s.push(r)}}return s.map((e=>e.replace(p," "))).join(d.isWindows?"\r\n":"\n")}clearSelection(){this._model.clearSelection(),this._removeMouseDownListeners(),this.refresh(),this._onSelectionChange.fire()}refresh(e){this._refreshAnimationFrame||(this._refreshAnimationFrame=this._coreBrowserService.window.requestAnimationFrame((()=>this._refresh()))),d.isLinux&&e&&this.selectionText.length&&this._onLinuxMouseSelection.fire(this.selectionText)}_refresh(){this._refreshAnimationFrame=void 0,this._onRedrawRequest.fire({start:this._model.finalSelectionStart,end:this._model.finalSelectionEnd,columnSelectMode:3===this._activeSelectionMode})}_isClickInSelection(e){const t=this._getMouseBufferCoords(e),i=this._model.finalSelectionStart,s=this._model.finalSelectionEnd;return!!(i&&s&&t)&&this._areCoordsInSelection(t,i,s)}isCellInSelection(e,t){const i=this._model.finalSelectionStart,s=this._model.finalSelectionEnd;return!(!i||!s)&&this._areCoordsInSelection([e,t],i,s)}_areCoordsInSelection(e,t,i){return e[1]>t[1]&&e[1]<i[1]||t[1]===i[1]&&e[1]===t[1]&&e[0]>=t[0]&&e[0]<i[0]||t[1]<i[1]&&e[1]===i[1]&&e[0]<i[0]||t[1]<i[1]&&e[1]===t[1]&&e[0]>=t[0]}_selectWordAtCursor(e,t){var i,s;const r=null===(s=null===(i=this._linkifier.currentLink)||void 0===i?void 0:i.link)||void 0===s?void 0:s.range;if(r)return this._model.selectionStart=[r.start.x-1,r.start.y-1],this._model.selectionStartLength=(0,_.getRangeLength)(r,this._bufferService.cols),this._model.selectionEnd=void 0,!0;const n=this._getMouseBufferCoords(e);return!!n&&(this._selectWordAt(n,t),this._model.selectionEnd=void 0,!0)}selectAll(){this._model.isSelectAllActive=!0,this.refresh(),this._onSelectionChange.fire()}selectLines(e,t){this._model.clearSelection(),e=Math.max(e,0),t=Math.min(t,this._bufferService.buffer.lines.length-1),this._model.selectionStart=[0,e],this._model.selectionEnd=[this._bufferService.cols,t],this.refresh(),this._onSelectionChange.fire()}_handleTrim(e){this._model.handleTrim(e)&&this.refresh()}_getMouseBufferCoords(e){const t=this._mouseService.getCoords(e,this._screenElement,this._bufferService.cols,this._bufferService.rows,!0);if(t)return t[0]--,t[1]--,t[1]+=this._bufferService.buffer.ydisp,t}_getMouseEventScrollAmount(e){let t=(0,n.getCoordsRelativeToElement)(this._coreBrowserService.window,e,this._screenElement)[1];const i=this._renderService.dimensions.css.canvas.height;return t>=0&&t<=i?0:(t>i&&(t-=i),t=Math.min(Math.max(t,-50),50),t/=50,t/Math.abs(t)+Math.round(14*t))}shouldForceSelection(e){return d.isMac?e.altKey&&this._optionsService.rawOptions.macOptionClickForcesSelection:e.shiftKey}handleMouseDown(e){if(this._mouseDownTimeStamp=e.timeStamp,(2!==e.button||!this.hasSelection)&&0===e.button){if(!this._enabled){if(!this.shouldForceSelection(e))return;e.stopPropagation()}e.preventDefault(),this._dragScrollAmount=0,this._enabled&&e.shiftKey?this._handleIncrementalClick(e):1===e.detail?this._handleSingleClick(e):2===e.detail?this._handleDoubleClick(e):3===e.detail&&this._handleTripleClick(e),this._addMouseDownListeners(),this.refresh(!0)}}_addMouseDownListeners(){this._screenElement.ownerDocument&&(this._screenElement.ownerDocument.addEventListener("mousemove",this._mouseMoveListener),this._screenElement.ownerDocument.addEventListener("mouseup",this._mouseUpListener)),this._dragScrollIntervalTimer=this._coreBrowserService.window.setInterval((()=>this._dragScroll()),50)}_removeMouseDownListeners(){this._screenElement.ownerDocument&&(this._screenElement.ownerDocument.removeEventListener("mousemove",this._mouseMoveListener),this._screenElement.ownerDocument.removeEventListener("mouseup",this._mouseUpListener)),this._coreBrowserService.window.clearInterval(this._dragScrollIntervalTimer),this._dragScrollIntervalTimer=void 0}_handleIncrementalClick(e){this._model.selectionStart&&(this._model.selectionEnd=this._getMouseBufferCoords(e))}_handleSingleClick(e){if(this._model.selectionStartLength=0,this._model.isSelectAllActive=!1,this._activeSelectionMode=this.shouldColumnSelect(e)?3:0,this._model.selectionStart=this._getMouseBufferCoords(e),!this._model.selectionStart)return;this._model.selectionEnd=void 0;const t=this._bufferService.buffer.lines.get(this._model.selectionStart[1]);t&&t.length!==this._model.selectionStart[0]&&0===t.hasWidth(this._model.selectionStart[0])&&this._model.selectionStart[0]++}_handleDoubleClick(e){this._selectWordAtCursor(e,!0)&&(this._activeSelectionMode=1)}_handleTripleClick(e){const t=this._getMouseBufferCoords(e);t&&(this._activeSelectionMode=2,this._selectLineAt(t[1]))}shouldColumnSelect(e){return e.altKey&&!(d.isMac&&this._optionsService.rawOptions.macOptionClickForcesSelection)}_handleMouseMove(e){if(e.stopImmediatePropagation(),!this._model.selectionStart)return;const t=this._model.selectionEnd?[this._model.selectionEnd[0],this._model.selectionEnd[1]]:null;if(this._model.selectionEnd=this._getMouseBufferCoords(e),!this._model.selectionEnd)return void this.refresh(!0);2===this._activeSelectionMode?this._model.selectionEnd[1]<this._model.selectionStart[1]?this._model.selectionEnd[0]=0:this._model.selectionEnd[0]=this._bufferService.cols:1===this._activeSelectionMode&&this._selectToWordAt(this._model.selectionEnd),this._dragScrollAmount=this._getMouseEventScrollAmount(e),3!==this._activeSelectionMode&&(this._dragScrollAmount>0?this._model.selectionEnd[0]=this._bufferService.cols:this._dragScrollAmount<0&&(this._model.selectionEnd[0]=0));const i=this._bufferService.buffer;if(this._model.selectionEnd[1]<i.lines.length){const e=i.lines.get(this._model.selectionEnd[1]);e&&0===e.hasWidth(this._model.selectionEnd[0])&&this._model.selectionEnd[0]++}t&&t[0]===this._model.selectionEnd[0]&&t[1]===this._model.selectionEnd[1]||this.refresh(!0)}_dragScroll(){if(this._model.selectionEnd&&this._model.selectionStart&&this._dragScrollAmount){this._onRequestScrollLines.fire({amount:this._dragScrollAmount,suppressScrollEvent:!1});const e=this._bufferService.buffer;this._dragScrollAmount>0?(3!==this._activeSelectionMode&&(this._model.selectionEnd[0]=this._bufferService.cols),this._model.selectionEnd[1]=Math.min(e.ydisp+this._bufferService.rows,e.lines.length-1)):(3!==this._activeSelectionMode&&(this._model.selectionEnd[0]=0),this._model.selectionEnd[1]=e.ydisp),this.refresh()}}_handleMouseUp(e){const t=e.timeStamp-this._mouseDownTimeStamp;if(this._removeMouseDownListeners(),this.selectionText.length<=1&&t<500&&e.altKey&&this._optionsService.rawOptions.altClickMovesCursor){if(this._bufferService.buffer.ybase===this._bufferService.buffer.ydisp){const t=this._mouseService.getCoords(e,this._element,this._bufferService.cols,this._bufferService.rows,!1);if(t&&void 0!==t[0]&&void 0!==t[1]){const e=(0,o.moveToCellSequence)(t[0]-1,t[1]-1,this._bufferService,this._coreService.decPrivateModes.applicationCursorKeys);this._coreService.triggerDataEvent(e,!0)}}}else this._fireEventIfSelectionChanged()}_fireEventIfSelectionChanged(){const e=this._model.finalSelectionStart,t=this._model.finalSelectionEnd,i=!(!e||!t||e[0]===t[0]&&e[1]===t[1]);i?e&&t&&(this._oldSelectionStart&&this._oldSelectionEnd&&e[0]===this._oldSelectionStart[0]&&e[1]===this._oldSelectionStart[1]&&t[0]===this._oldSelectionEnd[0]&&t[1]===this._oldSelectionEnd[1]||this._fireOnSelectionChange(e,t,i)):this._oldHasSelection&&this._fireOnSelectionChange(e,t,i)}_fireOnSelectionChange(e,t,i){this._oldSelectionStart=e,this._oldSelectionEnd=t,this._oldHasSelection=i,this._onSelectionChange.fire()}_handleBufferActivate(e){this.clearSelection(),this._trimListener.dispose(),this._trimListener=e.activeBuffer.lines.onTrim((e=>this._handleTrim(e)))}_convertViewportColToCharacterIndex(e,t){let i=t;for(let s=0;t>=s;s++){const r=e.loadCell(s,this._workCell).getChars().length;0===this._workCell.getWidth()?i--:r>1&&t!==s&&(i+=r-1)}return i}setSelection(e,t,i){this._model.clearSelection(),this._removeMouseDownListeners(),this._model.selectionStart=[e,t],this._model.selectionStartLength=i,this.refresh(),this._fireEventIfSelectionChanged()}rightClickSelect(e){this._isClickInSelection(e)||(this._selectWordAtCursor(e,!1)&&this.refresh(!0),this._fireEventIfSelectionChanged())}_getWordAt(e,t,i=!0,s=!0){if(e[0]>=this._bufferService.cols)return;const r=this._bufferService.buffer,n=r.lines.get(e[1]);if(!n)return;const o=r.translateBufferLineToString(e[1],!1);let a=this._convertViewportColToCharacterIndex(n,e[0]),h=a;const c=e[0]-a;let l=0,d=0,_=0,u=0;if(" "===o.charAt(a)){for(;a>0&&" "===o.charAt(a-1);)a--;for(;h<o.length&&" "===o.charAt(h+1);)h++}else{let t=e[0],i=e[0];0===n.getWidth(t)&&(l++,t--),2===n.getWidth(i)&&(d++,i++);const s=n.getString(i).length;for(s>1&&(u+=s-1,h+=s-1);t>0&&a>0&&!this._isCharWordSeparator(n.loadCell(t-1,this._workCell));){n.loadCell(t-1,this._workCell);const e=this._workCell.getChars().length;0===this._workCell.getWidth()?(l++,t--):e>1&&(_+=e-1,a-=e-1),a--,t--}for(;i<n.length&&h+1<o.length&&!this._isCharWordSeparator(n.loadCell(i+1,this._workCell));){n.loadCell(i+1,this._workCell);const e=this._workCell.getChars().length;2===this._workCell.getWidth()?(d++,i++):e>1&&(u+=e-1,h+=e-1),h++,i++}}h++;let f=a+c-l+_,v=Math.min(this._bufferService.cols,h-a+l+d-_-u);if(t||""!==o.slice(a,h).trim()){if(i&&0===f&&32!==n.getCodePoint(0)){const t=r.lines.get(e[1]-1);if(t&&n.isWrapped&&32!==t.getCodePoint(this._bufferService.cols-1)){const t=this._getWordAt([this._bufferService.cols-1,e[1]-1],!1,!0,!1);if(t){const e=this._bufferService.cols-t.start;f-=e,v+=e}}}if(s&&f+v===this._bufferService.cols&&32!==n.getCodePoint(this._bufferService.cols-1)){const t=r.lines.get(e[1]+1);if((null==t?void 0:t.isWrapped)&&32!==t.getCodePoint(0)){const t=this._getWordAt([0,e[1]+1],!1,!1,!0);t&&(v+=t.length)}}return{start:f,length:v}}}_selectWordAt(e,t){const i=this._getWordAt(e,t);if(i){for(;i.start<0;)i.start+=this._bufferService.cols,e[1]--;this._model.selectionStart=[i.start,e[1]],this._model.selectionStartLength=i.length}}_selectToWordAt(e){const t=this._getWordAt(e,!0);if(t){let i=e[1];for(;t.start<0;)t.start+=this._bufferService.cols,i--;if(!this._model.areSelectionValuesReversed())for(;t.start+t.length>this._bufferService.cols;)t.length-=this._bufferService.cols,i++;this._model.selectionEnd=[this._model.areSelectionValuesReversed()?t.start:t.start+t.length,i]}}_isCharWordSeparator(e){return 0!==e.getWidth()&&this._optionsService.rawOptions.wordSeparator.indexOf(e.getChars())>=0}_selectLineAt(e){const t=this._bufferService.buffer.getWrappedRangeForLine(e),i={start:{x:0,y:t.first},end:{x:this._bufferService.cols-1,y:t.last}};this._model.selectionStart=[0,t.first],this._model.selectionEnd=void 0,this._model.selectionStartLength=(0,_.getRangeLength)(i,this._bufferService.cols)}};t.SelectionService=g=s([r(3,f.IBufferService),r(4,f.ICoreService),r(5,h.IMouseService),r(6,f.IOptionsService),r(7,h.IRenderService),r(8,h.ICoreBrowserService)],g)},4725:(e,t,i)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.IThemeService=t.ICharacterJoinerService=t.ISelectionService=t.IRenderService=t.IMouseService=t.ICoreBrowserService=t.ICharSizeService=void 0;const s=i(8343);t.ICharSizeService=(0,s.createDecorator)("CharSizeService"),t.ICoreBrowserService=(0,s.createDecorator)("CoreBrowserService"),t.IMouseService=(0,s.createDecorator)("MouseService"),t.IRenderService=(0,s.createDecorator)("RenderService"),t.ISelectionService=(0,s.createDecorator)("SelectionService"),t.ICharacterJoinerService=(0,s.createDecorator)("CharacterJoinerService"),t.IThemeService=(0,s.createDecorator)("ThemeService")},6731:function(e,t,i){var s=this&&this.__decorate||function(e,t,i,s){var r,n=arguments.length,o=n<3?t:null===s?s=Object.getOwnPropertyDescriptor(t,i):s;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)o=Reflect.decorate(e,t,i,s);else for(var a=e.length-1;a>=0;a--)(r=e[a])&&(o=(n<3?r(o):n>3?r(t,i,o):r(t,i))||o);return n>3&&o&&Object.defineProperty(t,i,o),o},r=this&&this.__param||function(e,t){return function(i,s){t(i,s,e)}};Object.defineProperty(t,"__esModule",{value:!0}),t.ThemeService=t.DEFAULT_ANSI_COLORS=void 0;const n=i(7239),o=i(8055),a=i(8460),h=i(844),c=i(2585),l=o.css.toColor("#ffffff"),d=o.css.toColor("#000000"),_=o.css.toColor("#ffffff"),u=o.css.toColor("#000000"),f={css:"rgba(255, 255, 255, 0.3)",rgba:4294967117};t.DEFAULT_ANSI_COLORS=Object.freeze((()=>{const e=[o.css.toColor("#2e3436"),o.css.toColor("#cc0000"),o.css.toColor("#4e9a06"),o.css.toColor("#c4a000"),o.css.toColor("#3465a4"),o.css.toColor("#75507b"),o.css.toColor("#06989a"),o.css.toColor("#d3d7cf"),o.css.toColor("#555753"),o.css.toColor("#ef2929"),o.css.toColor("#8ae234"),o.css.toColor("#fce94f"),o.css.toColor("#729fcf"),o.css.toColor("#ad7fa8"),o.css.toColor("#34e2e2"),o.css.toColor("#eeeeec")],t=[0,95,135,175,215,255];for(let i=0;i<216;i++){const s=t[i/36%6|0],r=t[i/6%6|0],n=t[i%6];e.push({css:o.channels.toCss(s,r,n),rgba:o.channels.toRgba(s,r,n)})}for(let t=0;t<24;t++){const i=8+10*t;e.push({css:o.channels.toCss(i,i,i),rgba:o.channels.toRgba(i,i,i)})}return e})());let v=t.ThemeService=class extends h.Disposable{get colors(){return this._colors}constructor(e){super(),this._optionsService=e,this._contrastCache=new n.ColorContrastCache,this._halfContrastCache=new n.ColorContrastCache,this._onChangeColors=this.register(new a.EventEmitter),this.onChangeColors=this._onChangeColors.event,this._colors={foreground:l,background:d,cursor:_,cursorAccent:u,selectionForeground:void 0,selectionBackgroundTransparent:f,selectionBackgroundOpaque:o.color.blend(d,f),selectionInactiveBackgroundTransparent:f,selectionInactiveBackgroundOpaque:o.color.blend(d,f),ansi:t.DEFAULT_ANSI_COLORS.slice(),contrastCache:this._contrastCache,halfContrastCache:this._halfContrastCache},this._updateRestoreColors(),this._setTheme(this._optionsService.rawOptions.theme),this.register(this._optionsService.onSpecificOptionChange("minimumContrastRatio",(()=>this._contrastCache.clear()))),this.register(this._optionsService.onSpecificOptionChange("theme",(()=>this._setTheme(this._optionsService.rawOptions.theme))))}_setTheme(e={}){const i=this._colors;if(i.foreground=p(e.foreground,l),i.background=p(e.background,d),i.cursor=p(e.cursor,_),i.cursorAccent=p(e.cursorAccent,u),i.selectionBackgroundTransparent=p(e.selectionBackground,f),i.selectionBackgroundOpaque=o.color.blend(i.background,i.selectionBackgroundTransparent),i.selectionInactiveBackgroundTransparent=p(e.selectionInactiveBackground,i.selectionBackgroundTransparent),i.selectionInactiveBackgroundOpaque=o.color.blend(i.background,i.selectionInactiveBackgroundTransparent),i.selectionForeground=e.selectionForeground?p(e.selectionForeground,o.NULL_COLOR):void 0,i.selectionForeground===o.NULL_COLOR&&(i.selectionForeground=void 0),o.color.isOpaque(i.selectionBackgroundTransparent)){const e=.3;i.selectionBackgroundTransparent=o.color.opacity(i.selectionBackgroundTransparent,e)}if(o.color.isOpaque(i.selectionInactiveBackgroundTransparent)){const e=.3;i.selectionInactiveBackgroundTransparent=o.color.opacity(i.selectionInactiveBackgroundTransparent,e)}if(i.ansi=t.DEFAULT_ANSI_COLORS.slice(),i.ansi[0]=p(e.black,t.DEFAULT_ANSI_COLORS[0]),i.ansi[1]=p(e.red,t.DEFAULT_ANSI_COLORS[1]),i.ansi[2]=p(e.green,t.DEFAULT_ANSI_COLORS[2]),i.ansi[3]=p(e.yellow,t.DEFAULT_ANSI_COLORS[3]),i.ansi[4]=p(e.blue,t.DEFAULT_ANSI_COLORS[4]),i.ansi[5]=p(e.magenta,t.DEFAULT_ANSI_COLORS[5]),i.ansi[6]=p(e.cyan,t.DEFAULT_ANSI_COLORS[6]),i.ansi[7]=p(e.white,t.DEFAULT_ANSI_COLORS[7]),i.ansi[8]=p(e.brightBlack,t.DEFAULT_ANSI_COLORS[8]),i.ansi[9]=p(e.brightRed,t.DEFAULT_ANSI_COLORS[9]),i.ansi[10]=p(e.brightGreen,t.DEFAULT_ANSI_COLORS[10]),i.ansi[11]=p(e.brightYellow,t.DEFAULT_ANSI_COLORS[11]),i.ansi[12]=p(e.brightBlue,t.DEFAULT_ANSI_COLORS[12]),i.ansi[13]=p(e.brightMagenta,t.DEFAULT_ANSI_COLORS[13]),i.ansi[14]=p(e.brightCyan,t.DEFAULT_ANSI_COLORS[14]),i.ansi[15]=p(e.brightWhite,t.DEFAULT_ANSI_COLORS[15]),e.extendedAnsi){const s=Math.min(i.ansi.length-16,e.extendedAnsi.length);for(let r=0;r<s;r++)i.ansi[r+16]=p(e.extendedAnsi[r],t.DEFAULT_ANSI_COLORS[r+16])}this._contrastCache.clear(),this._halfContrastCache.clear(),this._updateRestoreColors(),this._onChangeColors.fire(this.colors)}restoreColor(e){this._restoreColor(e),this._onChangeColors.fire(this.colors)}_restoreColor(e){if(void 0!==e)switch(e){case 256:this._colors.foreground=this._restoreColors.foreground;break;case 257:this._colors.background=this._restoreColors.background;break;case 258:this._colors.cursor=this._restoreColors.cursor;break;default:this._colors.ansi[e]=this._restoreColors.ansi[e]}else for(let e=0;e<this._restoreColors.ansi.length;++e)this._colors.ansi[e]=this._restoreColors.ansi[e]}modifyColors(e){e(this._colors),this._onChangeColors.fire(this.colors)}_updateRestoreColors(){this._restoreColors={foreground:this._colors.foreground,background:this._colors.background,cursor:this._colors.cursor,ansi:this._colors.ansi.slice()}}};function p(e,t){if(void 0!==e)try{return o.css.toColor(e)}catch(e){}return t}t.ThemeService=v=s([r(0,c.IOptionsService)],v)},6349:(e,t,i)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.CircularList=void 0;const s=i(8460),r=i(844);class n extends r.Disposable{constructor(e){super(),this._maxLength=e,this.onDeleteEmitter=this.register(new s.EventEmitter),this.onDelete=this.onDeleteEmitter.event,this.onInsertEmitter=this.register(new s.EventEmitter),this.onInsert=this.onInsertEmitter.event,this.onTrimEmitter=this.register(new s.EventEmitter),this.onTrim=this.onTrimEmitter.event,this._array=new Array(this._maxLength),this._startIndex=0,this._length=0}get maxLength(){return this._maxLength}set maxLength(e){if(this._maxLength===e)return;const t=new Array(e);for(let i=0;i<Math.min(e,this.length);i++)t[i]=this._array[this._getCyclicIndex(i)];this._array=t,this._maxLength=e,this._startIndex=0}get length(){return this._length}set length(e){if(e>this._length)for(let t=this._length;t<e;t++)this._array[t]=void 0;this._length=e}get(e){return this._array[this._getCyclicIndex(e)]}set(e,t){this._array[this._getCyclicIndex(e)]=t}push(e){this._array[this._getCyclicIndex(this._length)]=e,this._length===this._maxLength?(this._startIndex=++this._startIndex%this._maxLength,this.onTrimEmitter.fire(1)):this._length++}recycle(){if(this._length!==this._maxLength)throw new Error("Can only recycle when the buffer is full");return this._startIndex=++this._startIndex%this._maxLength,this.onTrimEmitter.fire(1),this._array[this._getCyclicIndex(this._length-1)]}get isFull(){return this._length===this._maxLength}pop(){return this._array[this._getCyclicIndex(this._length---1)]}splice(e,t,...i){if(t){for(let i=e;i<this._length-t;i++)this._array[this._getCyclicIndex(i)]=this._array[this._getCyclicIndex(i+t)];this._length-=t,this.onDeleteEmitter.fire({index:e,amount:t})}for(let t=this._length-1;t>=e;t--)this._array[this._getCyclicIndex(t+i.length)]=this._array[this._getCyclicIndex(t)];for(let t=0;t<i.length;t++)this._array[this._getCyclicIndex(e+t)]=i[t];if(i.length&&this.onInsertEmitter.fire({index:e,amount:i.length}),this._length+i.length>this._maxLength){const e=this._length+i.length-this._maxLength;this._startIndex+=e,this._length=this._maxLength,this.onTrimEmitter.fire(e)}else this._length+=i.length}trimStart(e){e>this._length&&(e=this._length),this._startIndex+=e,this._length-=e,this.onTrimEmitter.fire(e)}shiftElements(e,t,i){if(!(t<=0)){if(e<0||e>=this._length)throw new Error("start argument out of range");if(e+i<0)throw new Error("Cannot shift elements in list beyond index 0");if(i>0){for(let s=t-1;s>=0;s--)this.set(e+s+i,this.get(e+s));const s=e+t+i-this._length;if(s>0)for(this._length+=s;this._length>this._maxLength;)this._length--,this._startIndex++,this.onTrimEmitter.fire(1)}else for(let s=0;s<t;s++)this.set(e+s+i,this.get(e+s))}}_getCyclicIndex(e){return(this._startIndex+e)%this._maxLength}}t.CircularList=n},1439:(e,t)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.clone=void 0,t.clone=function e(t,i=5){if("object"!=typeof t)return t;const s=Array.isArray(t)?[]:{};for(const r in t)s[r]=i<=1?t[r]:t[r]&&e(t[r],i-1);return s}},8055:(e,t,i)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.contrastRatio=t.toPaddedHex=t.rgba=t.rgb=t.css=t.color=t.channels=t.NULL_COLOR=void 0;const s=i(6114);let r=0,n=0,o=0,a=0;var h,c,l,d,_;function u(e){const t=e.toString(16);return t.length<2?"0"+t:t}function f(e,t){return e<t?(t+.05)/(e+.05):(e+.05)/(t+.05)}t.NULL_COLOR={css:"#00000000",rgba:0},function(e){e.toCss=function(e,t,i,s){return void 0!==s?`#${u(e)}${u(t)}${u(i)}${u(s)}`:`#${u(e)}${u(t)}${u(i)}`},e.toRgba=function(e,t,i,s=255){return(e<<24|t<<16|i<<8|s)>>>0}}(h||(t.channels=h={})),function(e){function t(e,t){return a=Math.round(255*t),[r,n,o]=_.toChannels(e.rgba),{css:h.toCss(r,n,o,a),rgba:h.toRgba(r,n,o,a)}}e.blend=function(e,t){if(a=(255&t.rgba)/255,1===a)return{css:t.css,rgba:t.rgba};const i=t.rgba>>24&255,s=t.rgba>>16&255,c=t.rgba>>8&255,l=e.rgba>>24&255,d=e.rgba>>16&255,_=e.rgba>>8&255;return r=l+Math.round((i-l)*a),n=d+Math.round((s-d)*a),o=_+Math.round((c-_)*a),{css:h.toCss(r,n,o),rgba:h.toRgba(r,n,o)}},e.isOpaque=function(e){return 255==(255&e.rgba)},e.ensureContrastRatio=function(e,t,i){const s=_.ensureContrastRatio(e.rgba,t.rgba,i);if(s)return _.toColor(s>>24&255,s>>16&255,s>>8&255)},e.opaque=function(e){const t=(255|e.rgba)>>>0;return[r,n,o]=_.toChannels(t),{css:h.toCss(r,n,o),rgba:t}},e.opacity=t,e.multiplyOpacity=function(e,i){return a=255&e.rgba,t(e,a*i/255)},e.toColorRGB=function(e){return[e.rgba>>24&255,e.rgba>>16&255,e.rgba>>8&255]}}(c||(t.color=c={})),function(e){let t,i;if(!s.isNode){const e=document.createElement("canvas");e.width=1,e.height=1;const s=e.getContext("2d",{willReadFrequently:!0});s&&(t=s,t.globalCompositeOperation="copy",i=t.createLinearGradient(0,0,1,1))}e.toColor=function(e){if(e.match(/#[\da-f]{3,8}/i))switch(e.length){case 4:return r=parseInt(e.slice(1,2).repeat(2),16),n=parseInt(e.slice(2,3).repeat(2),16),o=parseInt(e.slice(3,4).repeat(2),16),_.toColor(r,n,o);case 5:return r=parseInt(e.slice(1,2).repeat(2),16),n=parseInt(e.slice(2,3).repeat(2),16),o=parseInt(e.slice(3,4).repeat(2),16),a=parseInt(e.slice(4,5).repeat(2),16),_.toColor(r,n,o,a);case 7:return{css:e,rgba:(parseInt(e.slice(1),16)<<8|255)>>>0};case 9:return{css:e,rgba:parseInt(e.slice(1),16)>>>0}}const s=e.match(/rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(,\s*(0|1|\d?\.(\d+))\s*)?\)/);if(s)return r=parseInt(s[1]),n=parseInt(s[2]),o=parseInt(s[3]),a=Math.round(255*(void 0===s[5]?1:parseFloat(s[5]))),_.toColor(r,n,o,a);if(!t||!i)throw new Error("css.toColor: Unsupported css format");if(t.fillStyle=i,t.fillStyle=e,"string"!=typeof t.fillStyle)throw new Error("css.toColor: Unsupported css format");if(t.fillRect(0,0,1,1),[r,n,o,a]=t.getImageData(0,0,1,1).data,255!==a)throw new Error("css.toColor: Unsupported css format");return{rgba:h.toRgba(r,n,o,a),css:e}}}(l||(t.css=l={})),function(e){function t(e,t,i){const s=e/255,r=t/255,n=i/255;return.2126*(s<=.03928?s/12.92:Math.pow((s+.055)/1.055,2.4))+.7152*(r<=.03928?r/12.92:Math.pow((r+.055)/1.055,2.4))+.0722*(n<=.03928?n/12.92:Math.pow((n+.055)/1.055,2.4))}e.relativeLuminance=function(e){return t(e>>16&255,e>>8&255,255&e)},e.relativeLuminance2=t}(d||(t.rgb=d={})),function(e){function t(e,t,i){const s=e>>24&255,r=e>>16&255,n=e>>8&255;let o=t>>24&255,a=t>>16&255,h=t>>8&255,c=f(d.relativeLuminance2(o,a,h),d.relativeLuminance2(s,r,n));for(;c<i&&(o>0||a>0||h>0);)o-=Math.max(0,Math.ceil(.1*o)),a-=Math.max(0,Math.ceil(.1*a)),h-=Math.max(0,Math.ceil(.1*h)),c=f(d.relativeLuminance2(o,a,h),d.relativeLuminance2(s,r,n));return(o<<24|a<<16|h<<8|255)>>>0}function i(e,t,i){const s=e>>24&255,r=e>>16&255,n=e>>8&255;let o=t>>24&255,a=t>>16&255,h=t>>8&255,c=f(d.relativeLuminance2(o,a,h),d.relativeLuminance2(s,r,n));for(;c<i&&(o<255||a<255||h<255);)o=Math.min(255,o+Math.ceil(.1*(255-o))),a=Math.min(255,a+Math.ceil(.1*(255-a))),h=Math.min(255,h+Math.ceil(.1*(255-h))),c=f(d.relativeLuminance2(o,a,h),d.relativeLuminance2(s,r,n));return(o<<24|a<<16|h<<8|255)>>>0}e.ensureContrastRatio=function(e,s,r){const n=d.relativeLuminance(e>>8),o=d.relativeLuminance(s>>8);if(f(n,o)<r){if(o<n){const o=t(e,s,r),a=f(n,d.relativeLuminance(o>>8));if(a<r){const t=i(e,s,r);return a>f(n,d.relativeLuminance(t>>8))?o:t}return o}const a=i(e,s,r),h=f(n,d.relativeLuminance(a>>8));if(h<r){const i=t(e,s,r);return h>f(n,d.relativeLuminance(i>>8))?a:i}return a}},e.reduceLuminance=t,e.increaseLuminance=i,e.toChannels=function(e){return[e>>24&255,e>>16&255,e>>8&255,255&e]},e.toColor=function(e,t,i,s){return{css:h.toCss(e,t,i,s),rgba:h.toRgba(e,t,i,s)}}}(_||(t.rgba=_={})),t.toPaddedHex=u,t.contrastRatio=f},8969:(e,t,i)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.CoreTerminal=void 0;const s=i(844),r=i(2585),n=i(4348),o=i(7866),a=i(744),h=i(7302),c=i(6975),l=i(8460),d=i(1753),_=i(1480),u=i(7994),f=i(9282),v=i(5435),p=i(5981),g=i(2660);let m=!1;class S extends s.Disposable{get onScroll(){return this._onScrollApi||(this._onScrollApi=this.register(new l.EventEmitter),this._onScroll.event((e=>{var t;null===(t=this._onScrollApi)||void 0===t||t.fire(e.position)}))),this._onScrollApi.event}get cols(){return this._bufferService.cols}get rows(){return this._bufferService.rows}get buffers(){return this._bufferService.buffers}get options(){return this.optionsService.options}set options(e){for(const t in e)this.optionsService.options[t]=e[t]}constructor(e){super(),this._windowsWrappingHeuristics=this.register(new s.MutableDisposable),this._onBinary=this.register(new l.EventEmitter),this.onBinary=this._onBinary.event,this._onData=this.register(new l.EventEmitter),this.onData=this._onData.event,this._onLineFeed=this.register(new l.EventEmitter),this.onLineFeed=this._onLineFeed.event,this._onResize=this.register(new l.EventEmitter),this.onResize=this._onResize.event,this._onWriteParsed=this.register(new l.EventEmitter),this.onWriteParsed=this._onWriteParsed.event,this._onScroll=this.register(new l.EventEmitter),this._instantiationService=new n.InstantiationService,this.optionsService=this.register(new h.OptionsService(e)),this._instantiationService.setService(r.IOptionsService,this.optionsService),this._bufferService=this.register(this._instantiationService.createInstance(a.BufferService)),this._instantiationService.setService(r.IBufferService,this._bufferService),this._logService=this.register(this._instantiationService.createInstance(o.LogService)),this._instantiationService.setService(r.ILogService,this._logService),this.coreService=this.register(this._instantiationService.createInstance(c.CoreService)),this._instantiationService.setService(r.ICoreService,this.coreService),this.coreMouseService=this.register(this._instantiationService.createInstance(d.CoreMouseService)),this._instantiationService.setService(r.ICoreMouseService,this.coreMouseService),this.unicodeService=this.register(this._instantiationService.createInstance(_.UnicodeService)),this._instantiationService.setService(r.IUnicodeService,this.unicodeService),this._charsetService=this._instantiationService.createInstance(u.CharsetService),this._instantiationService.setService(r.ICharsetService,this._charsetService),this._oscLinkService=this._instantiationService.createInstance(g.OscLinkService),this._instantiationService.setService(r.IOscLinkService,this._oscLinkService),this._inputHandler=this.register(new v.InputHandler(this._bufferService,this._charsetService,this.coreService,this._logService,this.optionsService,this._oscLinkService,this.coreMouseService,this.unicodeService)),this.register((0,l.forwardEvent)(this._inputHandler.onLineFeed,this._onLineFeed)),this.register(this._inputHandler),this.register((0,l.forwardEvent)(this._bufferService.onResize,this._onResize)),this.register((0,l.forwardEvent)(this.coreService.onData,this._onData)),this.register((0,l.forwardEvent)(this.coreService.onBinary,this._onBinary)),this.register(this.coreService.onRequestScrollToBottom((()=>this.scrollToBottom()))),this.register(this.coreService.onUserInput((()=>this._writeBuffer.handleUserInput()))),this.register(this.optionsService.onMultipleOptionChange(["windowsMode","windowsPty"],(()=>this._handleWindowsPtyOptionChange()))),this.register(this._bufferService.onScroll((e=>{this._onScroll.fire({position:this._bufferService.buffer.ydisp,source:0}),this._inputHandler.markRangeDirty(this._bufferService.buffer.scrollTop,this._bufferService.buffer.scrollBottom)}))),this.register(this._inputHandler.onScroll((e=>{this._onScroll.fire({position:this._bufferService.buffer.ydisp,source:0}),this._inputHandler.markRangeDirty(this._bufferService.buffer.scrollTop,this._bufferService.buffer.scrollBottom)}))),this._writeBuffer=this.register(new p.WriteBuffer(((e,t)=>this._inputHandler.parse(e,t)))),this.register((0,l.forwardEvent)(this._writeBuffer.onWriteParsed,this._onWriteParsed))}write(e,t){this._writeBuffer.write(e,t)}writeSync(e,t){this._logService.logLevel<=r.LogLevelEnum.WARN&&!m&&(this._logService.warn("writeSync is unreliable and will be removed soon."),m=!0),this._writeBuffer.writeSync(e,t)}resize(e,t){isNaN(e)||isNaN(t)||(e=Math.max(e,a.MINIMUM_COLS),t=Math.max(t,a.MINIMUM_ROWS),this._bufferService.resize(e,t))}scroll(e,t=!1){this._bufferService.scroll(e,t)}scrollLines(e,t,i){this._bufferService.scrollLines(e,t,i)}scrollPages(e){this.scrollLines(e*(this.rows-1))}scrollToTop(){this.scrollLines(-this._bufferService.buffer.ydisp)}scrollToBottom(){this.scrollLines(this._bufferService.buffer.ybase-this._bufferService.buffer.ydisp)}scrollToLine(e){const t=e-this._bufferService.buffer.ydisp;0!==t&&this.scrollLines(t)}registerEscHandler(e,t){return this._inputHandler.registerEscHandler(e,t)}registerDcsHandler(e,t){return this._inputHandler.registerDcsHandler(e,t)}registerCsiHandler(e,t){return this._inputHandler.registerCsiHandler(e,t)}registerOscHandler(e,t){return this._inputHandler.registerOscHandler(e,t)}_setup(){this._handleWindowsPtyOptionChange()}reset(){this._inputHandler.reset(),this._bufferService.reset(),this._charsetService.reset(),this.coreService.reset(),this.coreMouseService.reset()}_handleWindowsPtyOptionChange(){let e=!1;const t=this.optionsService.rawOptions.windowsPty;t&&void 0!==t.buildNumber&&void 0!==t.buildNumber?e=!!("conpty"===t.backend&&t.buildNumber<21376):this.optionsService.rawOptions.windowsMode&&(e=!0),e?this._enableWindowsWrappingHeuristics():this._windowsWrappingHeuristics.clear()}_enableWindowsWrappingHeuristics(){if(!this._windowsWrappingHeuristics.value){const e=[];e.push(this.onLineFeed(f.updateWindowsModeWrappedState.bind(null,this._bufferService))),e.push(this.registerCsiHandler({final:"H"},(()=>((0,f.updateWindowsModeWrappedState)(this._bufferService),!1)))),this._windowsWrappingHeuristics.value=(0,s.toDisposable)((()=>{for(const t of e)t.dispose()}))}}}t.CoreTerminal=S},8460:(e,t)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.forwardEvent=t.EventEmitter=void 0,t.EventEmitter=class{constructor(){this._listeners=[],this._disposed=!1}get event(){return this._event||(this._event=e=>(this._listeners.push(e),{dispose:()=>{if(!this._disposed)for(let t=0;t<this._listeners.length;t++)if(this._listeners[t]===e)return void this._listeners.splice(t,1)}})),this._event}fire(e,t){const i=[];for(let e=0;e<this._listeners.length;e++)i.push(this._listeners[e]);for(let s=0;s<i.length;s++)i[s].call(void 0,e,t)}dispose(){this.clearListeners(),this._disposed=!0}clearListeners(){this._listeners&&(this._listeners.length=0)}},t.forwardEvent=function(e,t){return e((e=>t.fire(e)))}},5435:function(e,t,i){var s=this&&this.__decorate||function(e,t,i,s){var r,n=arguments.length,o=n<3?t:null===s?s=Object.getOwnPropertyDescriptor(t,i):s;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)o=Reflect.decorate(e,t,i,s);else for(var a=e.length-1;a>=0;a--)(r=e[a])&&(o=(n<3?r(o):n>3?r(t,i,o):r(t,i))||o);return n>3&&o&&Object.defineProperty(t,i,o),o},r=this&&this.__param||function(e,t){return function(i,s){t(i,s,e)}};Object.defineProperty(t,"__esModule",{value:!0}),t.InputHandler=t.WindowsOptionsReportType=void 0;const n=i(2584),o=i(7116),a=i(2015),h=i(844),c=i(482),l=i(8437),d=i(8460),_=i(643),u=i(511),f=i(3734),v=i(2585),p=i(6242),g=i(6351),m=i(5941),S={"(":0,")":1,"*":2,"+":3,"-":1,".":2},C=131072;function b(e,t){if(e>24)return t.setWinLines||!1;switch(e){case 1:return!!t.restoreWin;case 2:return!!t.minimizeWin;case 3:return!!t.setWinPosition;case 4:return!!t.setWinSizePixels;case 5:return!!t.raiseWin;case 6:return!!t.lowerWin;case 7:return!!t.refreshWin;case 8:return!!t.setWinSizeChars;case 9:return!!t.maximizeWin;case 10:return!!t.fullscreenWin;case 11:return!!t.getWinState;case 13:return!!t.getWinPosition;case 14:return!!t.getWinSizePixels;case 15:return!!t.getScreenSizePixels;case 16:return!!t.getCellSizePixels;case 18:return!!t.getWinSizeChars;case 19:return!!t.getScreenSizeChars;case 20:return!!t.getIconTitle;case 21:return!!t.getWinTitle;case 22:return!!t.pushTitle;case 23:return!!t.popTitle;case 24:return!!t.setWinLines}return!1}var y;!function(e){e[e.GET_WIN_SIZE_PIXELS=0]="GET_WIN_SIZE_PIXELS",e[e.GET_CELL_SIZE_PIXELS=1]="GET_CELL_SIZE_PIXELS"}(y||(t.WindowsOptionsReportType=y={}));let w=0;class E extends h.Disposable{getAttrData(){return this._curAttrData}constructor(e,t,i,s,r,h,_,f,v=new a.EscapeSequenceParser){super(),this._bufferService=e,this._charsetService=t,this._coreService=i,this._logService=s,this._optionsService=r,this._oscLinkService=h,this._coreMouseService=_,this._unicodeService=f,this._parser=v,this._parseBuffer=new Uint32Array(4096),this._stringDecoder=new c.StringToUtf32,this._utf8Decoder=new c.Utf8ToUtf32,this._workCell=new u.CellData,this._windowTitle="",this._iconName="",this._windowTitleStack=[],this._iconNameStack=[],this._curAttrData=l.DEFAULT_ATTR_DATA.clone(),this._eraseAttrDataInternal=l.DEFAULT_ATTR_DATA.clone(),this._onRequestBell=this.register(new d.EventEmitter),this.onRequestBell=this._onRequestBell.event,this._onRequestRefreshRows=this.register(new d.EventEmitter),this.onRequestRefreshRows=this._onRequestRefreshRows.event,this._onRequestReset=this.register(new d.EventEmitter),this.onRequestReset=this._onRequestReset.event,this._onRequestSendFocus=this.register(new d.EventEmitter),this.onRequestSendFocus=this._onRequestSendFocus.event,this._onRequestSyncScrollBar=this.register(new d.EventEmitter),this.onRequestSyncScrollBar=this._onRequestSyncScrollBar.event,this._onRequestWindowsOptionsReport=this.register(new d.EventEmitter),this.onRequestWindowsOptionsReport=this._onRequestWindowsOptionsReport.event,this._onA11yChar=this.register(new d.EventEmitter),this.onA11yChar=this._onA11yChar.event,this._onA11yTab=this.register(new d.EventEmitter),this.onA11yTab=this._onA11yTab.event,this._onCursorMove=this.register(new d.EventEmitter),this.onCursorMove=this._onCursorMove.event,this._onLineFeed=this.register(new d.EventEmitter),this.onLineFeed=this._onLineFeed.event,this._onScroll=this.register(new d.EventEmitter),this.onScroll=this._onScroll.event,this._onTitleChange=this.register(new d.EventEmitter),this.onTitleChange=this._onTitleChange.event,this._onColor=this.register(new d.EventEmitter),this.onColor=this._onColor.event,this._parseStack={paused:!1,cursorStartX:0,cursorStartY:0,decodedLength:0,position:0},this._specialColors=[256,257,258],this.register(this._parser),this._dirtyRowTracker=new k(this._bufferService),this._activeBuffer=this._bufferService.buffer,this.register(this._bufferService.buffers.onBufferActivate((e=>this._activeBuffer=e.activeBuffer))),this._parser.setCsiHandlerFallback(((e,t)=>{this._logService.debug("Unknown CSI code: ",{identifier:this._parser.identToString(e),params:t.toArray()})})),this._parser.setEscHandlerFallback((e=>{this._logService.debug("Unknown ESC code: ",{identifier:this._parser.identToString(e)})})),this._parser.setExecuteHandlerFallback((e=>{this._logService.debug("Unknown EXECUTE code: ",{code:e})})),this._parser.setOscHandlerFallback(((e,t,i)=>{this._logService.debug("Unknown OSC code: ",{identifier:e,action:t,data:i})})),this._parser.setDcsHandlerFallback(((e,t,i)=>{"HOOK"===t&&(i=i.toArray()),this._logService.debug("Unknown DCS code: ",{identifier:this._parser.identToString(e),action:t,payload:i})})),this._parser.setPrintHandler(((e,t,i)=>this.print(e,t,i))),this._parser.registerCsiHandler({final:"@"},(e=>this.insertChars(e))),this._parser.registerCsiHandler({intermediates:" ",final:"@"},(e=>this.scrollLeft(e))),this._parser.registerCsiHandler({final:"A"},(e=>this.cursorUp(e))),this._parser.registerCsiHandler({intermediates:" ",final:"A"},(e=>this.scrollRight(e))),this._parser.registerCsiHandler({final:"B"},(e=>this.cursorDown(e))),this._parser.registerCsiHandler({final:"C"},(e=>this.cursorForward(e))),this._parser.registerCsiHandler({final:"D"},(e=>this.cursorBackward(e))),this._parser.registerCsiHandler({final:"E"},(e=>this.cursorNextLine(e))),this._parser.registerCsiHandler({final:"F"},(e=>this.cursorPrecedingLine(e))),this._parser.registerCsiHandler({final:"G"},(e=>this.cursorCharAbsolute(e))),this._parser.registerCsiHandler({final:"H"},(e=>this.cursorPosition(e))),this._parser.registerCsiHandler({final:"I"},(e=>this.cursorForwardTab(e))),this._parser.registerCsiHandler({final:"J"},(e=>this.eraseInDisplay(e,!1))),this._parser.registerCsiHandler({prefix:"?",final:"J"},(e=>this.eraseInDisplay(e,!0))),this._parser.registerCsiHandler({final:"K"},(e=>this.eraseInLine(e,!1))),this._parser.registerCsiHandler({prefix:"?",final:"K"},(e=>this.eraseInLine(e,!0))),this._parser.registerCsiHandler({final:"L"},(e=>this.insertLines(e))),this._parser.registerCsiHandler({final:"M"},(e=>this.deleteLines(e))),this._parser.registerCsiHandler({final:"P"},(e=>this.deleteChars(e))),this._parser.registerCsiHandler({final:"S"},(e=>this.scrollUp(e))),this._parser.registerCsiHandler({final:"T"},(e=>this.scrollDown(e))),this._parser.registerCsiHandler({final:"X"},(e=>this.eraseChars(e))),this._parser.registerCsiHandler({final:"Z"},(e=>this.cursorBackwardTab(e))),this._parser.registerCsiHandler({final:"`"},(e=>this.charPosAbsolute(e))),this._parser.registerCsiHandler({final:"a"},(e=>this.hPositionRelative(e))),this._parser.registerCsiHandler({final:"b"},(e=>this.repeatPrecedingCharacter(e))),this._parser.registerCsiHandler({final:"c"},(e=>this.sendDeviceAttributesPrimary(e))),this._parser.registerCsiHandler({prefix:">",final:"c"},(e=>this.sendDeviceAttributesSecondary(e))),this._parser.registerCsiHandler({final:"d"},(e=>this.linePosAbsolute(e))),this._parser.registerCsiHandler({final:"e"},(e=>this.vPositionRelative(e))),this._parser.registerCsiHandler({final:"f"},(e=>this.hVPosition(e))),this._parser.registerCsiHandler({final:"g"},(e=>this.tabClear(e))),this._parser.registerCsiHandler({final:"h"},(e=>this.setMode(e))),this._parser.registerCsiHandler({prefix:"?",final:"h"},(e=>this.setModePrivate(e))),this._parser.registerCsiHandler({final:"l"},(e=>this.resetMode(e))),this._parser.registerCsiHandler({prefix:"?",final:"l"},(e=>this.resetModePrivate(e))),this._parser.registerCsiHandler({final:"m"},(e=>this.charAttributes(e))),this._parser.registerCsiHandler({final:"n"},(e=>this.deviceStatus(e))),this._parser.registerCsiHandler({prefix:"?",final:"n"},(e=>this.deviceStatusPrivate(e))),this._parser.registerCsiHandler({intermediates:"!",final:"p"},(e=>this.softReset(e))),this._parser.registerCsiHandler({intermediates:" ",final:"q"},(e=>this.setCursorStyle(e))),this._parser.registerCsiHandler({final:"r"},(e=>this.setScrollRegion(e))),this._parser.registerCsiHandler({final:"s"},(e=>this.saveCursor(e))),this._parser.registerCsiHandler({final:"t"},(e=>this.windowOptions(e))),this._parser.registerCsiHandler({final:"u"},(e=>this.restoreCursor(e))),this._parser.registerCsiHandler({intermediates:"'",final:"}"},(e=>this.insertColumns(e))),this._parser.registerCsiHandler({intermediates:"'",final:"~"},(e=>this.deleteColumns(e))),this._parser.registerCsiHandler({intermediates:'"',final:"q"},(e=>this.selectProtected(e))),this._parser.registerCsiHandler({intermediates:"$",final:"p"},(e=>this.requestMode(e,!0))),this._parser.registerCsiHandler({prefix:"?",intermediates:"$",final:"p"},(e=>this.requestMode(e,!1))),this._parser.setExecuteHandler(n.C0.BEL,(()=>this.bell())),this._parser.setExecuteHandler(n.C0.LF,(()=>this.lineFeed())),this._parser.setExecuteHandler(n.C0.VT,(()=>this.lineFeed())),this._parser.setExecuteHandler(n.C0.FF,(()=>this.lineFeed())),this._parser.setExecuteHandler(n.C0.CR,(()=>this.carriageReturn())),this._parser.setExecuteHandler(n.C0.BS,(()=>this.backspace())),this._parser.setExecuteHandler(n.C0.HT,(()=>this.tab())),this._parser.setExecuteHandler(n.C0.SO,(()=>this.shiftOut())),this._parser.setExecuteHandler(n.C0.SI,(()=>this.shiftIn())),this._parser.setExecuteHandler(n.C1.IND,(()=>this.index())),this._parser.setExecuteHandler(n.C1.NEL,(()=>this.nextLine())),this._parser.setExecuteHandler(n.C1.HTS,(()=>this.tabSet())),this._parser.registerOscHandler(0,new p.OscHandler((e=>(this.setTitle(e),this.setIconName(e),!0)))),this._parser.registerOscHandler(1,new p.OscHandler((e=>this.setIconName(e)))),this._parser.registerOscHandler(2,new p.OscHandler((e=>this.setTitle(e)))),this._parser.registerOscHandler(4,new p.OscHandler((e=>this.setOrReportIndexedColor(e)))),this._parser.registerOscHandler(8,new p.OscHandler((e=>this.setHyperlink(e)))),this._parser.registerOscHandler(10,new p.OscHandler((e=>this.setOrReportFgColor(e)))),this._parser.registerOscHandler(11,new p.OscHandler((e=>this.setOrReportBgColor(e)))),this._parser.registerOscHandler(12,new p.OscHandler((e=>this.setOrReportCursorColor(e)))),this._parser.registerOscHandler(104,new p.OscHandler((e=>this.restoreIndexedColor(e)))),this._parser.registerOscHandler(110,new p.OscHandler((e=>this.restoreFgColor(e)))),this._parser.registerOscHandler(111,new p.OscHandler((e=>this.restoreBgColor(e)))),this._parser.registerOscHandler(112,new p.OscHandler((e=>this.restoreCursorColor(e)))),this._parser.registerEscHandler({final:"7"},(()=>this.saveCursor())),this._parser.registerEscHandler({final:"8"},(()=>this.restoreCursor())),this._parser.registerEscHandler({final:"D"},(()=>this.index())),this._parser.registerEscHandler({final:"E"},(()=>this.nextLine())),this._parser.registerEscHandler({final:"H"},(()=>this.tabSet())),this._parser.registerEscHandler({final:"M"},(()=>this.reverseIndex())),this._parser.registerEscHandler({final:"="},(()=>this.keypadApplicationMode())),this._parser.registerEscHandler({final:">"},(()=>this.keypadNumericMode())),this._parser.registerEscHandler({final:"c"},(()=>this.fullReset())),this._parser.registerEscHandler({final:"n"},(()=>this.setgLevel(2))),this._parser.registerEscHandler({final:"o"},(()=>this.setgLevel(3))),this._parser.registerEscHandler({final:"|"},(()=>this.setgLevel(3))),this._parser.registerEscHandler({final:"}"},(()=>this.setgLevel(2))),this._parser.registerEscHandler({final:"~"},(()=>this.setgLevel(1))),this._parser.registerEscHandler({intermediates:"%",final:"@"},(()=>this.selectDefaultCharset())),this._parser.registerEscHandler({intermediates:"%",final:"G"},(()=>this.selectDefaultCharset()));for(const e in o.CHARSETS)this._parser.registerEscHandler({intermediates:"(",final:e},(()=>this.selectCharset("("+e))),this._parser.registerEscHandler({intermediates:")",final:e},(()=>this.selectCharset(")"+e))),this._parser.registerEscHandler({intermediates:"*",final:e},(()=>this.selectCharset("*"+e))),this._parser.registerEscHandler({intermediates:"+",final:e},(()=>this.selectCharset("+"+e))),this._parser.registerEscHandler({intermediates:"-",final:e},(()=>this.selectCharset("-"+e))),this._parser.registerEscHandler({intermediates:".",final:e},(()=>this.selectCharset("."+e))),this._parser.registerEscHandler({intermediates:"/",final:e},(()=>this.selectCharset("/"+e)));this._parser.registerEscHandler({intermediates:"#",final:"8"},(()=>this.screenAlignmentPattern())),this._parser.setErrorHandler((e=>(this._logService.error("Parsing error: ",e),e))),this._parser.registerDcsHandler({intermediates:"$",final:"q"},new g.DcsHandler(((e,t)=>this.requestStatusString(e,t))))}_preserveStack(e,t,i,s){this._parseStack.paused=!0,this._parseStack.cursorStartX=e,this._parseStack.cursorStartY=t,this._parseStack.decodedLength=i,this._parseStack.position=s}_logSlowResolvingAsync(e){this._logService.logLevel<=v.LogLevelEnum.WARN&&Promise.race([e,new Promise(((e,t)=>setTimeout((()=>t("#SLOW_TIMEOUT")),5e3)))]).catch((e=>{if("#SLOW_TIMEOUT"!==e)throw e;console.warn("async parser handler taking longer than 5000 ms")}))}_getCurrentLinkId(){return this._curAttrData.extended.urlId}parse(e,t){let i,s=this._activeBuffer.x,r=this._activeBuffer.y,n=0;const o=this._parseStack.paused;if(o){if(i=this._parser.parse(this._parseBuffer,this._parseStack.decodedLength,t))return this._logSlowResolvingAsync(i),i;s=this._parseStack.cursorStartX,r=this._parseStack.cursorStartY,this._parseStack.paused=!1,e.length>C&&(n=this._parseStack.position+C)}if(this._logService.logLevel<=v.LogLevelEnum.DEBUG&&this._logService.debug("parsing data"+("string"==typeof e?` "${e}"`:` "${Array.prototype.map.call(e,(e=>String.fromCharCode(e))).join("")}"`),"string"==typeof e?e.split("").map((e=>e.charCodeAt(0))):e),this._parseBuffer.length<e.length&&this._parseBuffer.length<C&&(this._parseBuffer=new Uint32Array(Math.min(e.length,C))),o||this._dirtyRowTracker.clearRange(),e.length>C)for(let t=n;t<e.length;t+=C){const n=t+C<e.length?t+C:e.length,o="string"==typeof e?this._stringDecoder.decode(e.substring(t,n),this._parseBuffer):this._utf8Decoder.decode(e.subarray(t,n),this._parseBuffer);if(i=this._parser.parse(this._parseBuffer,o))return this._preserveStack(s,r,o,t),this._logSlowResolvingAsync(i),i}else if(!o){const t="string"==typeof e?this._stringDecoder.decode(e,this._parseBuffer):this._utf8Decoder.decode(e,this._parseBuffer);if(i=this._parser.parse(this._parseBuffer,t))return this._preserveStack(s,r,t,0),this._logSlowResolvingAsync(i),i}this._activeBuffer.x===s&&this._activeBuffer.y===r||this._onCursorMove.fire(),this._onRequestRefreshRows.fire(this._dirtyRowTracker.start,this._dirtyRowTracker.end)}print(e,t,i){let s,r;const n=this._charsetService.charset,o=this._optionsService.rawOptions.screenReaderMode,a=this._bufferService.cols,h=this._coreService.decPrivateModes.wraparound,l=this._coreService.modes.insertMode,d=this._curAttrData;let u=this._activeBuffer.lines.get(this._activeBuffer.ybase+this._activeBuffer.y);this._dirtyRowTracker.markDirty(this._activeBuffer.y),this._activeBuffer.x&&i-t>0&&2===u.getWidth(this._activeBuffer.x-1)&&u.setCellFromCodePoint(this._activeBuffer.x-1,0,1,d.fg,d.bg,d.extended);for(let f=t;f<i;++f){if(s=e[f],r=this._unicodeService.wcwidth(s),s<127&&n){const e=n[String.fromCharCode(s)];e&&(s=e.charCodeAt(0))}if(o&&this._onA11yChar.fire((0,c.stringFromCodePoint)(s)),this._getCurrentLinkId()&&this._oscLinkService.addLineToLink(this._getCurrentLinkId(),this._activeBuffer.ybase+this._activeBuffer.y),r||!this._activeBuffer.x){if(this._activeBuffer.x+r-1>=a)if(h){for(;this._activeBuffer.x<a;)u.setCellFromCodePoint(this._activeBuffer.x++,0,1,d.fg,d.bg,d.extended);this._activeBuffer.x=0,this._activeBuffer.y++,this._activeBuffer.y===this._activeBuffer.scrollBottom+1?(this._activeBuffer.y--,this._bufferService.scroll(this._eraseAttrData(),!0)):(this._activeBuffer.y>=this._bufferService.rows&&(this._activeBuffer.y=this._bufferService.rows-1),this._activeBuffer.lines.get(this._activeBuffer.ybase+this._activeBuffer.y).isWrapped=!0),u=this._activeBuffer.lines.get(this._activeBuffer.ybase+this._activeBuffer.y)}else if(this._activeBuffer.x=a-1,2===r)continue;if(l&&(u.insertCells(this._activeBuffer.x,r,this._activeBuffer.getNullCell(d),d),2===u.getWidth(a-1)&&u.setCellFromCodePoint(a-1,_.NULL_CELL_CODE,_.NULL_CELL_WIDTH,d.fg,d.bg,d.extended)),u.setCellFromCodePoint(this._activeBuffer.x++,s,r,d.fg,d.bg,d.extended),r>0)for(;--r;)u.setCellFromCodePoint(this._activeBuffer.x++,0,0,d.fg,d.bg,d.extended)}else u.getWidth(this._activeBuffer.x-1)?u.addCodepointToCell(this._activeBuffer.x-1,s):u.addCodepointToCell(this._activeBuffer.x-2,s)}i-t>0&&(u.loadCell(this._activeBuffer.x-1,this._workCell),2===this._workCell.getWidth()||this._workCell.getCode()>65535?this._parser.precedingCodepoint=0:this._workCell.isCombined()?this._parser.precedingCodepoint=this._workCell.getChars().charCodeAt(0):this._parser.precedingCodepoint=this._workCell.content),this._activeBuffer.x<a&&i-t>0&&0===u.getWidth(this._activeBuffer.x)&&!u.hasContent(this._activeBuffer.x)&&u.setCellFromCodePoint(this._activeBuffer.x,0,1,d.fg,d.bg,d.extended),this._dirtyRowTracker.markDirty(this._activeBuffer.y)}registerCsiHandler(e,t){return"t"!==e.final||e.prefix||e.intermediates?this._parser.registerCsiHandler(e,t):this._parser.registerCsiHandler(e,(e=>!b(e.params[0],this._optionsService.rawOptions.windowOptions)||t(e)))}registerDcsHandler(e,t){return this._parser.registerDcsHandler(e,new g.DcsHandler(t))}registerEscHandler(e,t){return this._parser.registerEscHandler(e,t)}registerOscHandler(e,t){return this._parser.registerOscHandler(e,new p.OscHandler(t))}bell(){return this._onRequestBell.fire(),!0}lineFeed(){return this._dirtyRowTracker.markDirty(this._activeBuffer.y),this._optionsService.rawOptions.convertEol&&(this._activeBuffer.x=0),this._activeBuffer.y++,this._activeBuffer.y===this._activeBuffer.scrollBottom+1?(this._activeBuffer.y--,this._bufferService.scroll(this._eraseAttrData())):this._activeBuffer.y>=this._bufferService.rows?this._activeBuffer.y=this._bufferService.rows-1:this._activeBuffer.lines.get(this._activeBuffer.ybase+this._activeBuffer.y).isWrapped=!1,this._activeBuffer.x>=this._bufferService.cols&&this._activeBuffer.x--,this._dirtyRowTracker.markDirty(this._activeBuffer.y),this._onLineFeed.fire(),!0}carriageReturn(){return this._activeBuffer.x=0,!0}backspace(){var e;if(!this._coreService.decPrivateModes.reverseWraparound)return this._restrictCursor(),this._activeBuffer.x>0&&this._activeBuffer.x--,!0;if(this._restrictCursor(this._bufferService.cols),this._activeBuffer.x>0)this._activeBuffer.x--;else if(0===this._activeBuffer.x&&this._activeBuffer.y>this._activeBuffer.scrollTop&&this._activeBuffer.y<=this._activeBuffer.scrollBottom&&(null===(e=this._activeBuffer.lines.get(this._activeBuffer.ybase+this._activeBuffer.y))||void 0===e?void 0:e.isWrapped)){this._activeBuffer.lines.get(this._activeBuffer.ybase+this._activeBuffer.y).isWrapped=!1,this._activeBuffer.y--,this._activeBuffer.x=this._bufferService.cols-1;const e=this._activeBuffer.lines.get(this._activeBuffer.ybase+this._activeBuffer.y);e.hasWidth(this._activeBuffer.x)&&!e.hasContent(this._activeBuffer.x)&&this._activeBuffer.x--}return this._restrictCursor(),!0}tab(){if(this._activeBuffer.x>=this._bufferService.cols)return!0;const e=this._activeBuffer.x;return this._activeBuffer.x=this._activeBuffer.nextStop(),this._optionsService.rawOptions.screenReaderMode&&this._onA11yTab.fire(this._activeBuffer.x-e),!0}shiftOut(){return this._charsetService.setgLevel(1),!0}shiftIn(){return this._charsetService.setgLevel(0),!0}_restrictCursor(e=this._bufferService.cols-1){this._activeBuffer.x=Math.min(e,Math.max(0,this._activeBuffer.x)),this._activeBuffer.y=this._coreService.decPrivateModes.origin?Math.min(this._activeBuffer.scrollBottom,Math.max(this._activeBuffer.scrollTop,this._activeBuffer.y)):Math.min(this._bufferService.rows-1,Math.max(0,this._activeBuffer.y)),this._dirtyRowTracker.markDirty(this._activeBuffer.y)}_setCursor(e,t){this._dirtyRowTracker.markDirty(this._activeBuffer.y),this._coreService.decPrivateModes.origin?(this._activeBuffer.x=e,this._activeBuffer.y=this._activeBuffer.scrollTop+t):(this._activeBuffer.x=e,this._activeBuffer.y=t),this._restrictCursor(),this._dirtyRowTracker.markDirty(this._activeBuffer.y)}_moveCursor(e,t){this._restrictCursor(),this._setCursor(this._activeBuffer.x+e,this._activeBuffer.y+t)}cursorUp(e){const t=this._activeBuffer.y-this._activeBuffer.scrollTop;return t>=0?this._moveCursor(0,-Math.min(t,e.params[0]||1)):this._moveCursor(0,-(e.params[0]||1)),!0}cursorDown(e){const t=this._activeBuffer.scrollBottom-this._activeBuffer.y;return t>=0?this._moveCursor(0,Math.min(t,e.params[0]||1)):this._moveCursor(0,e.params[0]||1),!0}cursorForward(e){return this._moveCursor(e.params[0]||1,0),!0}cursorBackward(e){return this._moveCursor(-(e.params[0]||1),0),!0}cursorNextLine(e){return this.cursorDown(e),this._activeBuffer.x=0,!0}cursorPrecedingLine(e){return this.cursorUp(e),this._activeBuffer.x=0,!0}cursorCharAbsolute(e){return this._setCursor((e.params[0]||1)-1,this._activeBuffer.y),!0}cursorPosition(e){return this._setCursor(e.length>=2?(e.params[1]||1)-1:0,(e.params[0]||1)-1),!0}charPosAbsolute(e){return this._setCursor((e.params[0]||1)-1,this._activeBuffer.y),!0}hPositionRelative(e){return this._moveCursor(e.params[0]||1,0),!0}linePosAbsolute(e){return this._setCursor(this._activeBuffer.x,(e.params[0]||1)-1),!0}vPositionRelative(e){return this._moveCursor(0,e.params[0]||1),!0}hVPosition(e){return this.cursorPosition(e),!0}tabClear(e){const t=e.params[0];return 0===t?delete this._activeBuffer.tabs[this._activeBuffer.x]:3===t&&(this._activeBuffer.tabs={}),!0}cursorForwardTab(e){if(this._activeBuffer.x>=this._bufferService.cols)return!0;let t=e.params[0]||1;for(;t--;)this._activeBuffer.x=this._activeBuffer.nextStop();return!0}cursorBackwardTab(e){if(this._activeBuffer.x>=this._bufferService.cols)return!0;let t=e.params[0]||1;for(;t--;)this._activeBuffer.x=this._activeBuffer.prevStop();return!0}selectProtected(e){const t=e.params[0];return 1===t&&(this._curAttrData.bg|=536870912),2!==t&&0!==t||(this._curAttrData.bg&=-536870913),!0}_eraseInBufferLine(e,t,i,s=!1,r=!1){const n=this._activeBuffer.lines.get(this._activeBuffer.ybase+e);n.replaceCells(t,i,this._activeBuffer.getNullCell(this._eraseAttrData()),this._eraseAttrData(),r),s&&(n.isWrapped=!1)}_resetBufferLine(e,t=!1){const i=this._activeBuffer.lines.get(this._activeBuffer.ybase+e);i&&(i.fill(this._activeBuffer.getNullCell(this._eraseAttrData()),t),this._bufferService.buffer.clearMarkers(this._activeBuffer.ybase+e),i.isWrapped=!1)}eraseInDisplay(e,t=!1){let i;switch(this._restrictCursor(this._bufferService.cols),e.params[0]){case 0:for(i=this._activeBuffer.y,this._dirtyRowTracker.markDirty(i),this._eraseInBufferLine(i++,this._activeBuffer.x,this._bufferService.cols,0===this._activeBuffer.x,t);i<this._bufferService.rows;i++)this._resetBufferLine(i,t);this._dirtyRowTracker.markDirty(i);break;case 1:for(i=this._activeBuffer.y,this._dirtyRowTracker.markDirty(i),this._eraseInBufferLine(i,0,this._activeBuffer.x+1,!0,t),this._activeBuffer.x+1>=this._bufferService.cols&&(this._activeBuffer.lines.get(i+1).isWrapped=!1);i--;)this._resetBufferLine(i,t);this._dirtyRowTracker.markDirty(0);break;case 2:for(i=this._bufferService.rows,this._dirtyRowTracker.markDirty(i-1);i--;)this._resetBufferLine(i,t);this._dirtyRowTracker.markDirty(0);break;case 3:const e=this._activeBuffer.lines.length-this._bufferService.rows;e>0&&(this._activeBuffer.lines.trimStart(e),this._activeBuffer.ybase=Math.max(this._activeBuffer.ybase-e,0),this._activeBuffer.ydisp=Math.max(this._activeBuffer.ydisp-e,0),this._onScroll.fire(0))}return!0}eraseInLine(e,t=!1){switch(this._restrictCursor(this._bufferService.cols),e.params[0]){case 0:this._eraseInBufferLine(this._activeBuffer.y,this._activeBuffer.x,this._bufferService.cols,0===this._activeBuffer.x,t);break;case 1:this._eraseInBufferLine(this._activeBuffer.y,0,this._activeBuffer.x+1,!1,t);break;case 2:this._eraseInBufferLine(this._activeBuffer.y,0,this._bufferService.cols,!0,t)}return this._dirtyRowTracker.markDirty(this._activeBuffer.y),!0}insertLines(e){this._restrictCursor();let t=e.params[0]||1;if(this._activeBuffer.y>this._activeBuffer.scrollBottom||this._activeBuffer.y<this._activeBuffer.scrollTop)return!0;const i=this._activeBuffer.ybase+this._activeBuffer.y,s=this._bufferService.rows-1-this._activeBuffer.scrollBottom,r=this._bufferService.rows-1+this._activeBuffer.ybase-s+1;for(;t--;)this._activeBuffer.lines.splice(r-1,1),this._activeBuffer.lines.splice(i,0,this._activeBuffer.getBlankLine(this._eraseAttrData()));return this._dirtyRowTracker.markRangeDirty(this._activeBuffer.y,this._activeBuffer.scrollBottom),this._activeBuffer.x=0,!0}deleteLines(e){this._restrictCursor();let t=e.params[0]||1;if(this._activeBuffer.y>this._activeBuffer.scrollBottom||this._activeBuffer.y<this._activeBuffer.scrollTop)return!0;const i=this._activeBuffer.ybase+this._activeBuffer.y;let s;for(s=this._bufferService.rows-1-this._activeBuffer.scrollBottom,s=this._bufferService.rows-1+this._activeBuffer.ybase-s;t--;)this._activeBuffer.lines.splice(i,1),this._activeBuffer.lines.splice(s,0,this._activeBuffer.getBlankLine(this._eraseAttrData()));return this._dirtyRowTracker.markRangeDirty(this._activeBuffer.y,this._activeBuffer.scrollBottom),this._activeBuffer.x=0,!0}insertChars(e){this._restrictCursor();const t=this._activeBuffer.lines.get(this._activeBuffer.ybase+this._activeBuffer.y);return t&&(t.insertCells(this._activeBuffer.x,e.params[0]||1,this._activeBuffer.getNullCell(this._eraseAttrData()),this._eraseAttrData()),this._dirtyRowTracker.markDirty(this._activeBuffer.y)),!0}deleteChars(e){this._restrictCursor();const t=this._activeBuffer.lines.get(this._activeBuffer.ybase+this._activeBuffer.y);return t&&(t.deleteCells(this._activeBuffer.x,e.params[0]||1,this._activeBuffer.getNullCell(this._eraseAttrData()),this._eraseAttrData()),this._dirtyRowTracker.markDirty(this._activeBuffer.y)),!0}scrollUp(e){let t=e.params[0]||1;for(;t--;)this._activeBuffer.lines.splice(this._activeBuffer.ybase+this._activeBuffer.scrollTop,1),this._activeBuffer.lines.splice(this._activeBuffer.ybase+this._activeBuffer.scrollBottom,0,this._activeBuffer.getBlankLine(this._eraseAttrData()));return this._dirtyRowTracker.markRangeDirty(this._activeBuffer.scrollTop,this._activeBuffer.scrollBottom),!0}scrollDown(e){let t=e.params[0]||1;for(;t--;)this._activeBuffer.lines.splice(this._activeBuffer.ybase+this._activeBuffer.scrollBottom,1),this._activeBuffer.lines.splice(this._activeBuffer.ybase+this._activeBuffer.scrollTop,0,this._activeBuffer.getBlankLine(l.DEFAULT_ATTR_DATA));return this._dirtyRowTracker.markRangeDirty(this._activeBuffer.scrollTop,this._activeBuffer.scrollBottom),!0}scrollLeft(e){if(this._activeBuffer.y>this._activeBuffer.scrollBottom||this._activeBuffer.y<this._activeBuffer.scrollTop)return!0;const t=e.params[0]||1;for(let e=this._activeBuffer.scrollTop;e<=this._activeBuffer.scrollBottom;++e){const i=this._activeBuffer.lines.get(this._activeBuffer.ybase+e);i.deleteCells(0,t,this._activeBuffer.getNullCell(this._eraseAttrData()),this._eraseAttrData()),i.isWrapped=!1}return this._dirtyRowTracker.markRangeDirty(this._activeBuffer.scrollTop,this._activeBuffer.scrollBottom),!0}scrollRight(e){if(this._activeBuffer.y>this._activeBuffer.scrollBottom||this._activeBuffer.y<this._activeBuffer.scrollTop)return!0;const t=e.params[0]||1;for(let e=this._activeBuffer.scrollTop;e<=this._activeBuffer.scrollBottom;++e){const i=this._activeBuffer.lines.get(this._activeBuffer.ybase+e);i.insertCells(0,t,this._activeBuffer.getNullCell(this._eraseAttrData()),this._eraseAttrData()),i.isWrapped=!1}return this._dirtyRowTracker.markRangeDirty(this._activeBuffer.scrollTop,this._activeBuffer.scrollBottom),!0}insertColumns(e){if(this._activeBuffer.y>this._activeBuffer.scrollBottom||this._activeBuffer.y<this._activeBuffer.scrollTop)return!0;const t=e.params[0]||1;for(let e=this._activeBuffer.scrollTop;e<=this._activeBuffer.scrollBottom;++e){const i=this._activeBuffer.lines.get(this._activeBuffer.ybase+e);i.insertCells(this._activeBuffer.x,t,this._activeBuffer.getNullCell(this._eraseAttrData()),this._eraseAttrData()),i.isWrapped=!1}return this._dirtyRowTracker.markRangeDirty(this._activeBuffer.scrollTop,this._activeBuffer.scrollBottom),!0}deleteColumns(e){if(this._activeBuffer.y>this._activeBuffer.scrollBottom||this._activeBuffer.y<this._activeBuffer.scrollTop)return!0;const t=e.params[0]||1;for(let e=this._activeBuffer.scrollTop;e<=this._activeBuffer.scrollBottom;++e){const i=this._activeBuffer.lines.get(this._activeBuffer.ybase+e);i.deleteCells(this._activeBuffer.x,t,this._activeBuffer.getNullCell(this._eraseAttrData()),this._eraseAttrData()),i.isWrapped=!1}return this._dirtyRowTracker.markRangeDirty(this._activeBuffer.scrollTop,this._activeBuffer.scrollBottom),!0}eraseChars(e){this._restrictCursor();const t=this._activeBuffer.lines.get(this._activeBuffer.ybase+this._activeBuffer.y);return t&&(t.replaceCells(this._activeBuffer.x,this._activeBuffer.x+(e.params[0]||1),this._activeBuffer.getNullCell(this._eraseAttrData()),this._eraseAttrData()),this._dirtyRowTracker.markDirty(this._activeBuffer.y)),!0}repeatPrecedingCharacter(e){if(!this._parser.precedingCodepoint)return!0;const t=e.params[0]||1,i=new Uint32Array(t);for(let e=0;e<t;++e)i[e]=this._parser.precedingCodepoint;return this.print(i,0,i.length),!0}sendDeviceAttributesPrimary(e){return e.params[0]>0||(this._is("xterm")||this._is("rxvt-unicode")||this._is("screen")?this._coreService.triggerDataEvent(n.C0.ESC+"[?1;2c"):this._is("linux")&&this._coreService.triggerDataEvent(n.C0.ESC+"[?6c")),!0}sendDeviceAttributesSecondary(e){return e.params[0]>0||(this._is("xterm")?this._coreService.triggerDataEvent(n.C0.ESC+"[>0;276;0c"):this._is("rxvt-unicode")?this._coreService.triggerDataEvent(n.C0.ESC+"[>85;95;0c"):this._is("linux")?this._coreService.triggerDataEvent(e.params[0]+"c"):this._is("screen")&&this._coreService.triggerDataEvent(n.C0.ESC+"[>83;40003;0c")),!0}_is(e){return 0===(this._optionsService.rawOptions.termName+"").indexOf(e)}setMode(e){for(let t=0;t<e.length;t++)switch(e.params[t]){case 4:this._coreService.modes.insertMode=!0;break;case 20:this._optionsService.options.convertEol=!0}return!0}setModePrivate(e){for(let t=0;t<e.length;t++)switch(e.params[t]){case 1:this._coreService.decPrivateModes.applicationCursorKeys=!0;break;case 2:this._charsetService.setgCharset(0,o.DEFAULT_CHARSET),this._charsetService.setgCharset(1,o.DEFAULT_CHARSET),this._charsetService.setgCharset(2,o.DEFAULT_CHARSET),this._charsetService.setgCharset(3,o.DEFAULT_CHARSET);break;case 3:this._optionsService.rawOptions.windowOptions.setWinLines&&(this._bufferService.resize(132,this._bufferService.rows),this._onRequestReset.fire());break;case 6:this._coreService.decPrivateModes.origin=!0,this._setCursor(0,0);break;case 7:this._coreService.decPrivateModes.wraparound=!0;break;case 12:this._optionsService.options.cursorBlink=!0;break;case 45:this._coreService.decPrivateModes.reverseWraparound=!0;break;case 66:this._logService.debug("Serial port requested application keypad."),this._coreService.decPrivateModes.applicationKeypad=!0,this._onRequestSyncScrollBar.fire();break;case 9:this._coreMouseService.activeProtocol="X10";break;case 1e3:this._coreMouseService.activeProtocol="VT200";break;case 1002:this._coreMouseService.activeProtocol="DRAG";break;case 1003:this._coreMouseService.activeProtocol="ANY";break;case 1004:this._coreService.decPrivateModes.sendFocus=!0,this._onRequestSendFocus.fire();break;case 1005:this._logService.debug("DECSET 1005 not supported (see #2507)");break;case 1006:this._coreMouseService.activeEncoding="SGR";break;case 1015:this._logService.debug("DECSET 1015 not supported (see #2507)");break;case 1016:this._coreMouseService.activeEncoding="SGR_PIXELS";break;case 25:this._coreService.isCursorHidden=!1;break;case 1048:this.saveCursor();break;case 1049:this.saveCursor();case 47:case 1047:this._bufferService.buffers.activateAltBuffer(this._eraseAttrData()),this._coreService.isCursorInitialized=!0,this._onRequestRefreshRows.fire(0,this._bufferService.rows-1),this._onRequestSyncScrollBar.fire();break;case 2004:this._coreService.decPrivateModes.bracketedPasteMode=!0}return!0}resetMode(e){for(let t=0;t<e.length;t++)switch(e.params[t]){case 4:this._coreService.modes.insertMode=!1;break;case 20:this._optionsService.options.convertEol=!1}return!0}resetModePrivate(e){for(let t=0;t<e.length;t++)switch(e.params[t]){case 1:this._coreService.decPrivateModes.applicationCursorKeys=!1;break;case 3:this._optionsService.rawOptions.windowOptions.setWinLines&&(this._bufferService.resize(80,this._bufferService.rows),this._onRequestReset.fire());break;case 6:this._coreService.decPrivateModes.origin=!1,this._setCursor(0,0);break;case 7:this._coreService.decPrivateModes.wraparound=!1;break;case 12:this._optionsService.options.cursorBlink=!1;break;case 45:this._coreService.decPrivateModes.reverseWraparound=!1;break;case 66:this._logService.debug("Switching back to normal keypad."),this._coreService.decPrivateModes.applicationKeypad=!1,this._onRequestSyncScrollBar.fire();break;case 9:case 1e3:case 1002:case 1003:this._coreMouseService.activeProtocol="NONE";break;case 1004:this._coreService.decPrivateModes.sendFocus=!1;break;case 1005:this._logService.debug("DECRST 1005 not supported (see #2507)");break;case 1006:case 1016:this._coreMouseService.activeEncoding="DEFAULT";break;case 1015:this._logService.debug("DECRST 1015 not supported (see #2507)");break;case 25:this._coreService.isCursorHidden=!0;break;case 1048:this.restoreCursor();break;case 1049:case 47:case 1047:this._bufferService.buffers.activateNormalBuffer(),1049===e.params[t]&&this.restoreCursor(),this._coreService.isCursorInitialized=!0,this._onRequestRefreshRows.fire(0,this._bufferService.rows-1),this._onRequestSyncScrollBar.fire();break;case 2004:this._coreService.decPrivateModes.bracketedPasteMode=!1}return!0}requestMode(e,t){const i=this._coreService.decPrivateModes,{activeProtocol:s,activeEncoding:r}=this._coreMouseService,o=this._coreService,{buffers:a,cols:h}=this._bufferService,{active:c,alt:l}=a,d=this._optionsService.rawOptions,_=e=>e?1:2,u=e.params[0];return f=u,v=t?2===u?4:4===u?_(o.modes.insertMode):12===u?3:20===u?_(d.convertEol):0:1===u?_(i.applicationCursorKeys):3===u?d.windowOptions.setWinLines?80===h?2:132===h?1:0:0:6===u?_(i.origin):7===u?_(i.wraparound):8===u?3:9===u?_("X10"===s):12===u?_(d.cursorBlink):25===u?_(!o.isCursorHidden):45===u?_(i.reverseWraparound):66===u?_(i.applicationKeypad):67===u?4:1e3===u?_("VT200"===s):1002===u?_("DRAG"===s):1003===u?_("ANY"===s):1004===u?_(i.sendFocus):1005===u?4:1006===u?_("SGR"===r):1015===u?4:1016===u?_("SGR_PIXELS"===r):1048===u?1:47===u||1047===u||1049===u?_(c===l):2004===u?_(i.bracketedPasteMode):0,o.triggerDataEvent(`${n.C0.ESC}[${t?"":"?"}${f};${v}$y`),!0;var f,v}_updateAttrColor(e,t,i,s,r){return 2===t?(e|=50331648,e&=-16777216,e|=f.AttributeData.fromColorRGB([i,s,r])):5===t&&(e&=-50331904,e|=33554432|255&i),e}_extractColor(e,t,i){const s=[0,0,-1,0,0,0];let r=0,n=0;do{if(s[n+r]=e.params[t+n],e.hasSubParams(t+n)){const i=e.getSubParams(t+n);let o=0;do{5===s[1]&&(r=1),s[n+o+1+r]=i[o]}while(++o<i.length&&o+n+1+r<s.length);break}if(5===s[1]&&n+r>=2||2===s[1]&&n+r>=5)break;s[1]&&(r=1)}while(++n+t<e.length&&n+r<s.length);for(let e=2;e<s.length;++e)-1===s[e]&&(s[e]=0);switch(s[0]){case 38:i.fg=this._updateAttrColor(i.fg,s[1],s[3],s[4],s[5]);break;case 48:i.bg=this._updateAttrColor(i.bg,s[1],s[3],s[4],s[5]);break;case 58:i.extended=i.extended.clone(),i.extended.underlineColor=this._updateAttrColor(i.extended.underlineColor,s[1],s[3],s[4],s[5])}return n}_processUnderline(e,t){t.extended=t.extended.clone(),(!~e||e>5)&&(e=1),t.extended.underlineStyle=e,t.fg|=268435456,0===e&&(t.fg&=-268435457),t.updateExtended()}_processSGR0(e){e.fg=l.DEFAULT_ATTR_DATA.fg,e.bg=l.DEFAULT_ATTR_DATA.bg,e.extended=e.extended.clone(),e.extended.underlineStyle=0,e.extended.underlineColor&=-67108864,e.updateExtended()}charAttributes(e){if(1===e.length&&0===e.params[0])return this._processSGR0(this._curAttrData),!0;const t=e.length;let i;const s=this._curAttrData;for(let r=0;r<t;r++)i=e.params[r],i>=30&&i<=37?(s.fg&=-50331904,s.fg|=16777216|i-30):i>=40&&i<=47?(s.bg&=-50331904,s.bg|=16777216|i-40):i>=90&&i<=97?(s.fg&=-50331904,s.fg|=16777224|i-90):i>=100&&i<=107?(s.bg&=-50331904,s.bg|=16777224|i-100):0===i?this._processSGR0(s):1===i?s.fg|=134217728:3===i?s.bg|=67108864:4===i?(s.fg|=268435456,this._processUnderline(e.hasSubParams(r)?e.getSubParams(r)[0]:1,s)):5===i?s.fg|=536870912:7===i?s.fg|=67108864:8===i?s.fg|=1073741824:9===i?s.fg|=2147483648:2===i?s.bg|=134217728:21===i?this._processUnderline(2,s):22===i?(s.fg&=-134217729,s.bg&=-134217729):23===i?s.bg&=-67108865:24===i?(s.fg&=-268435457,this._processUnderline(0,s)):25===i?s.fg&=-536870913:27===i?s.fg&=-67108865:28===i?s.fg&=-1073741825:29===i?s.fg&=2147483647:39===i?(s.fg&=-67108864,s.fg|=16777215&l.DEFAULT_ATTR_DATA.fg):49===i?(s.bg&=-67108864,s.bg|=16777215&l.DEFAULT_ATTR_DATA.bg):38===i||48===i||58===i?r+=this._extractColor(e,r,s):53===i?s.bg|=1073741824:55===i?s.bg&=-1073741825:59===i?(s.extended=s.extended.clone(),s.extended.underlineColor=-1,s.updateExtended()):100===i?(s.fg&=-67108864,s.fg|=16777215&l.DEFAULT_ATTR_DATA.fg,s.bg&=-67108864,s.bg|=16777215&l.DEFAULT_ATTR_DATA.bg):this._logService.debug("Unknown SGR attribute: %d.",i);return!0}deviceStatus(e){switch(e.params[0]){case 5:this._coreService.triggerDataEvent(`${n.C0.ESC}[0n`);break;case 6:const e=this._activeBuffer.y+1,t=this._activeBuffer.x+1;this._coreService.triggerDataEvent(`${n.C0.ESC}[${e};${t}R`)}return!0}deviceStatusPrivate(e){if(6===e.params[0]){const e=this._activeBuffer.y+1,t=this._activeBuffer.x+1;this._coreService.triggerDataEvent(`${n.C0.ESC}[?${e};${t}R`)}return!0}softReset(e){return this._coreService.isCursorHidden=!1,this._onRequestSyncScrollBar.fire(),this._activeBuffer.scrollTop=0,this._activeBuffer.scrollBottom=this._bufferService.rows-1,this._curAttrData=l.DEFAULT_ATTR_DATA.clone(),this._coreService.reset(),this._charsetService.reset(),this._activeBuffer.savedX=0,this._activeBuffer.savedY=this._activeBuffer.ybase,this._activeBuffer.savedCurAttrData.fg=this._curAttrData.fg,this._activeBuffer.savedCurAttrData.bg=this._curAttrData.bg,this._activeBuffer.savedCharset=this._charsetService.charset,this._coreService.decPrivateModes.origin=!1,!0}setCursorStyle(e){const t=e.params[0]||1;switch(t){case 1:case 2:this._optionsService.options.cursorStyle="block";break;case 3:case 4:this._optionsService.options.cursorStyle="underline";break;case 5:case 6:this._optionsService.options.cursorStyle="bar"}const i=t%2==1;return this._optionsService.options.cursorBlink=i,!0}setScrollRegion(e){const t=e.params[0]||1;let i;return(e.length<2||(i=e.params[1])>this._bufferService.rows||0===i)&&(i=this._bufferService.rows),i>t&&(this._activeBuffer.scrollTop=t-1,this._activeBuffer.scrollBottom=i-1,this._setCursor(0,0)),!0}windowOptions(e){if(!b(e.params[0],this._optionsService.rawOptions.windowOptions))return!0;const t=e.length>1?e.params[1]:0;switch(e.params[0]){case 14:2!==t&&this._onRequestWindowsOptionsReport.fire(y.GET_WIN_SIZE_PIXELS);break;case 16:this._onRequestWindowsOptionsReport.fire(y.GET_CELL_SIZE_PIXELS);break;case 18:this._bufferService&&this._coreService.triggerDataEvent(`${n.C0.ESC}[8;${this._bufferService.rows};${this._bufferService.cols}t`);break;case 22:0!==t&&2!==t||(this._windowTitleStack.push(this._windowTitle),this._windowTitleStack.length>10&&this._windowTitleStack.shift()),0!==t&&1!==t||(this._iconNameStack.push(this._iconName),this._iconNameStack.length>10&&this._iconNameStack.shift());break;case 23:0!==t&&2!==t||this._windowTitleStack.length&&this.setTitle(this._windowTitleStack.pop()),0!==t&&1!==t||this._iconNameStack.length&&this.setIconName(this._iconNameStack.pop())}return!0}saveCursor(e){return this._activeBuffer.savedX=this._activeBuffer.x,this._activeBuffer.savedY=this._activeBuffer.ybase+this._activeBuffer.y,this._activeBuffer.savedCurAttrData.fg=this._curAttrData.fg,this._activeBuffer.savedCurAttrData.bg=this._curAttrData.bg,this._activeBuffer.savedCharset=this._charsetService.charset,!0}restoreCursor(e){return this._activeBuffer.x=this._activeBuffer.savedX||0,this._activeBuffer.y=Math.max(this._activeBuffer.savedY-this._activeBuffer.ybase,0),this._curAttrData.fg=this._activeBuffer.savedCurAttrData.fg,this._curAttrData.bg=this._activeBuffer.savedCurAttrData.bg,this._charsetService.charset=this._savedCharset,this._activeBuffer.savedCharset&&(this._charsetService.charset=this._activeBuffer.savedCharset),this._restrictCursor(),!0}setTitle(e){return this._windowTitle=e,this._onTitleChange.fire(e),!0}setIconName(e){return this._iconName=e,!0}setOrReportIndexedColor(e){const t=[],i=e.split(";");for(;i.length>1;){const e=i.shift(),s=i.shift();if(/^\d+$/.exec(e)){const i=parseInt(e);if(L(i))if("?"===s)t.push({type:0,index:i});else{const e=(0,m.parseColor)(s);e&&t.push({type:1,index:i,color:e})}}}return t.length&&this._onColor.fire(t),!0}setHyperlink(e){const t=e.split(";");return!(t.length<2)&&(t[1]?this._createHyperlink(t[0],t[1]):!t[0]&&this._finishHyperlink())}_createHyperlink(e,t){this._getCurrentLinkId()&&this._finishHyperlink();const i=e.split(":");let s;const r=i.findIndex((e=>e.startsWith("id=")));return-1!==r&&(s=i[r].slice(3)||void 0),this._curAttrData.extended=this._curAttrData.extended.clone(),this._curAttrData.extended.urlId=this._oscLinkService.registerLink({id:s,uri:t}),this._curAttrData.updateExtended(),!0}_finishHyperlink(){return this._curAttrData.extended=this._curAttrData.extended.clone(),this._curAttrData.extended.urlId=0,this._curAttrData.updateExtended(),!0}_setOrReportSpecialColor(e,t){const i=e.split(";");for(let e=0;e<i.length&&!(t>=this._specialColors.length);++e,++t)if("?"===i[e])this._onColor.fire([{type:0,index:this._specialColors[t]}]);else{const s=(0,m.parseColor)(i[e]);s&&this._onColor.fire([{type:1,index:this._specialColors[t],color:s}])}return!0}setOrReportFgColor(e){return this._setOrReportSpecialColor(e,0)}setOrReportBgColor(e){return this._setOrReportSpecialColor(e,1)}setOrReportCursorColor(e){return this._setOrReportSpecialColor(e,2)}restoreIndexedColor(e){if(!e)return this._onColor.fire([{type:2}]),!0;const t=[],i=e.split(";");for(let e=0;e<i.length;++e)if(/^\d+$/.exec(i[e])){const s=parseInt(i[e]);L(s)&&t.push({type:2,index:s})}return t.length&&this._onColor.fire(t),!0}restoreFgColor(e){return this._onColor.fire([{type:2,index:256}]),!0}restoreBgColor(e){return this._onColor.fire([{type:2,index:257}]),!0}restoreCursorColor(e){return this._onColor.fire([{type:2,index:258}]),!0}nextLine(){return this._activeBuffer.x=0,this.index(),!0}keypadApplicationMode(){return this._logService.debug("Serial port requested application keypad."),this._coreService.decPrivateModes.applicationKeypad=!0,this._onRequestSyncScrollBar.fire(),!0}keypadNumericMode(){return this._logService.debug("Switching back to normal keypad."),this._coreService.decPrivateModes.applicationKeypad=!1,this._onRequestSyncScrollBar.fire(),!0}selectDefaultCharset(){return this._charsetService.setgLevel(0),this._charsetService.setgCharset(0,o.DEFAULT_CHARSET),!0}selectCharset(e){return 2!==e.length?(this.selectDefaultCharset(),!0):("/"===e[0]||this._charsetService.setgCharset(S[e[0]],o.CHARSETS[e[1]]||o.DEFAULT_CHARSET),!0)}index(){return this._restrictCursor(),this._activeBuffer.y++,this._activeBuffer.y===this._activeBuffer.scrollBottom+1?(this._activeBuffer.y--,this._bufferService.scroll(this._eraseAttrData())):this._activeBuffer.y>=this._bufferService.rows&&(this._activeBuffer.y=this._bufferService.rows-1),this._restrictCursor(),!0}tabSet(){return this._activeBuffer.tabs[this._activeBuffer.x]=!0,!0}reverseIndex(){if(this._restrictCursor(),this._activeBuffer.y===this._activeBuffer.scrollTop){const e=this._activeBuffer.scrollBottom-this._activeBuffer.scrollTop;this._activeBuffer.lines.shiftElements(this._activeBuffer.ybase+this._activeBuffer.y,e,1),this._activeBuffer.lines.set(this._activeBuffer.ybase+this._activeBuffer.y,this._activeBuffer.getBlankLine(this._eraseAttrData())),this._dirtyRowTracker.markRangeDirty(this._activeBuffer.scrollTop,this._activeBuffer.scrollBottom)}else this._activeBuffer.y--,this._restrictCursor();return!0}fullReset(){return this._parser.reset(),this._onRequestReset.fire(),!0}reset(){this._curAttrData=l.DEFAULT_ATTR_DATA.clone(),this._eraseAttrDataInternal=l.DEFAULT_ATTR_DATA.clone()}_eraseAttrData(){return this._eraseAttrDataInternal.bg&=-67108864,this._eraseAttrDataInternal.bg|=67108863&this._curAttrData.bg,this._eraseAttrDataInternal}setgLevel(e){return this._charsetService.setgLevel(e),!0}screenAlignmentPattern(){const e=new u.CellData;e.content=1<<22|"E".charCodeAt(0),e.fg=this._curAttrData.fg,e.bg=this._curAttrData.bg,this._setCursor(0,0);for(let t=0;t<this._bufferService.rows;++t){const i=this._activeBuffer.ybase+this._activeBuffer.y+t,s=this._activeBuffer.lines.get(i);s&&(s.fill(e),s.isWrapped=!1)}return this._dirtyRowTracker.markAllDirty(),this._setCursor(0,0),!0}requestStatusString(e,t){const i=this._bufferService.buffer,s=this._optionsService.rawOptions;return(e=>(this._coreService.triggerDataEvent(`${n.C0.ESC}${e}${n.C0.ESC}\\`),!0))('"q'===e?`P1$r${this._curAttrData.isProtected()?1:0}"q`:'"p'===e?'P1$r61;1"p':"r"===e?`P1$r${i.scrollTop+1};${i.scrollBottom+1}r`:"m"===e?"P1$r0m":" q"===e?`P1$r${{block:2,underline:4,bar:6}[s.cursorStyle]-(s.cursorBlink?1:0)} q`:"P0$r")}markRangeDirty(e,t){this._dirtyRowTracker.markRangeDirty(e,t)}}t.InputHandler=E;let k=class{constructor(e){this._bufferService=e,this.clearRange()}clearRange(){this.start=this._bufferService.buffer.y,this.end=this._bufferService.buffer.y}markDirty(e){e<this.start?this.start=e:e>this.end&&(this.end=e)}markRangeDirty(e,t){e>t&&(w=e,e=t,t=w),e<this.start&&(this.start=e),t>this.end&&(this.end=t)}markAllDirty(){this.markRangeDirty(0,this._bufferService.rows-1)}};function L(e){return 0<=e&&e<256}k=s([r(0,v.IBufferService)],k)},844:(e,t)=>{function i(e){for(const t of e)t.dispose();e.length=0}Object.defineProperty(t,"__esModule",{value:!0}),t.getDisposeArrayDisposable=t.disposeArray=t.toDisposable=t.MutableDisposable=t.Disposable=void 0,t.Disposable=class{constructor(){this._disposables=[],this._isDisposed=!1}dispose(){this._isDisposed=!0;for(const e of this._disposables)e.dispose();this._disposables.length=0}register(e){return this._disposables.push(e),e}unregister(e){const t=this._disposables.indexOf(e);-1!==t&&this._disposables.splice(t,1)}},t.MutableDisposable=class{constructor(){this._isDisposed=!1}get value(){return this._isDisposed?void 0:this._value}set value(e){var t;this._isDisposed||e===this._value||(null===(t=this._value)||void 0===t||t.dispose(),this._value=e)}clear(){this.value=void 0}dispose(){var e;this._isDisposed=!0,null===(e=this._value)||void 0===e||e.dispose(),this._value=void 0}},t.toDisposable=function(e){return{dispose:e}},t.disposeArray=i,t.getDisposeArrayDisposable=function(e){return{dispose:()=>i(e)}}},1505:(e,t)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.FourKeyMap=t.TwoKeyMap=void 0;class i{constructor(){this._data={}}set(e,t,i){this._data[e]||(this._data[e]={}),this._data[e][t]=i}get(e,t){return this._data[e]?this._data[e][t]:void 0}clear(){this._data={}}}t.TwoKeyMap=i,t.FourKeyMap=class{constructor(){this._data=new i}set(e,t,s,r,n){this._data.get(e,t)||this._data.set(e,t,new i),this._data.get(e,t).set(s,r,n)}get(e,t,i,s){var r;return null===(r=this._data.get(e,t))||void 0===r?void 0:r.get(i,s)}clear(){this._data.clear()}}},6114:(e,t)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.isChromeOS=t.isLinux=t.isWindows=t.isIphone=t.isIpad=t.isMac=t.getSafariVersion=t.isSafari=t.isLegacyEdge=t.isFirefox=t.isNode=void 0,t.isNode="undefined"==typeof navigator;const i=t.isNode?"node":navigator.userAgent,s=t.isNode?"node":navigator.platform;t.isFirefox=i.includes("Firefox"),t.isLegacyEdge=i.includes("Edge"),t.isSafari=/^((?!chrome|android).)*safari/i.test(i),t.getSafariVersion=function(){if(!t.isSafari)return 0;const e=i.match(/Version\/(\d+)/);return null===e||e.length<2?0:parseInt(e[1])},t.isMac=["Macintosh","MacIntel","MacPPC","Mac68K"].includes(s),t.isIpad="iPad"===s,t.isIphone="iPhone"===s,t.isWindows=["Windows","Win16","Win32","WinCE"].includes(s),t.isLinux=s.indexOf("Linux")>=0,t.isChromeOS=/\bCrOS\b/.test(i)},6106:(e,t)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.SortedList=void 0;let i=0;t.SortedList=class{constructor(e){this._getKey=e,this._array=[]}clear(){this._array.length=0}insert(e){0!==this._array.length?(i=this._search(this._getKey(e)),this._array.splice(i,0,e)):this._array.push(e)}delete(e){if(0===this._array.length)return!1;const t=this._getKey(e);if(void 0===t)return!1;if(i=this._search(t),-1===i)return!1;if(this._getKey(this._array[i])!==t)return!1;do{if(this._array[i]===e)return this._array.splice(i,1),!0}while(++i<this._array.length&&this._getKey(this._array[i])===t);return!1}*getKeyIterator(e){if(0!==this._array.length&&(i=this._search(e),!(i<0||i>=this._array.length)&&this._getKey(this._array[i])===e))do{yield this._array[i]}while(++i<this._array.length&&this._getKey(this._array[i])===e)}forEachByKey(e,t){if(0!==this._array.length&&(i=this._search(e),!(i<0||i>=this._array.length)&&this._getKey(this._array[i])===e))do{t(this._array[i])}while(++i<this._array.length&&this._getKey(this._array[i])===e)}values(){return[...this._array].values()}_search(e){let t=0,i=this._array.length-1;for(;i>=t;){let s=t+i>>1;const r=this._getKey(this._array[s]);if(r>e)i=s-1;else{if(!(r<e)){for(;s>0&&this._getKey(this._array[s-1])===e;)s--;return s}t=s+1}}return t}}},7226:(e,t,i)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.DebouncedIdleTask=t.IdleTaskQueue=t.PriorityTaskQueue=void 0;const s=i(6114);class r{constructor(){this._tasks=[],this._i=0}enqueue(e){this._tasks.push(e),this._start()}flush(){for(;this._i<this._tasks.length;)this._tasks[this._i]()||this._i++;this.clear()}clear(){this._idleCallback&&(this._cancelCallback(this._idleCallback),this._idleCallback=void 0),this._i=0,this._tasks.length=0}_start(){this._idleCallback||(this._idleCallback=this._requestCallback(this._process.bind(this)))}_process(e){this._idleCallback=void 0;let t=0,i=0,s=e.timeRemaining(),r=0;for(;this._i<this._tasks.length;){if(t=Date.now(),this._tasks[this._i]()||this._i++,t=Math.max(1,Date.now()-t),i=Math.max(t,i),r=e.timeRemaining(),1.5*i>r)return s-t<-20&&console.warn(`task queue exceeded allotted deadline by ${Math.abs(Math.round(s-t))}ms`),void this._start();s=r}this.clear()}}class n extends r{_requestCallback(e){return setTimeout((()=>e(this._createDeadline(16))))}_cancelCallback(e){clearTimeout(e)}_createDeadline(e){const t=Date.now()+e;return{timeRemaining:()=>Math.max(0,t-Date.now())}}}t.PriorityTaskQueue=n,t.IdleTaskQueue=!s.isNode&&"requestIdleCallback"in window?class extends r{_requestCallback(e){return requestIdleCallback(e)}_cancelCallback(e){cancelIdleCallback(e)}}:n,t.DebouncedIdleTask=class{constructor(){this._queue=new t.IdleTaskQueue}set(e){this._queue.clear(),this._queue.enqueue(e)}flush(){this._queue.flush()}}},9282:(e,t,i)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.updateWindowsModeWrappedState=void 0;const s=i(643);t.updateWindowsModeWrappedState=function(e){const t=e.buffer.lines.get(e.buffer.ybase+e.buffer.y-1),i=null==t?void 0:t.get(e.cols-1),r=e.buffer.lines.get(e.buffer.ybase+e.buffer.y);r&&i&&(r.isWrapped=i[s.CHAR_DATA_CODE_INDEX]!==s.NULL_CELL_CODE&&i[s.CHAR_DATA_CODE_INDEX]!==s.WHITESPACE_CELL_CODE)}},3734:(e,t)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.ExtendedAttrs=t.AttributeData=void 0;class i{constructor(){this.fg=0,this.bg=0,this.extended=new s}static toColorRGB(e){return[e>>>16&255,e>>>8&255,255&e]}static fromColorRGB(e){return(255&e[0])<<16|(255&e[1])<<8|255&e[2]}clone(){const e=new i;return e.fg=this.fg,e.bg=this.bg,e.extended=this.extended.clone(),e}isInverse(){return 67108864&this.fg}isBold(){return 134217728&this.fg}isUnderline(){return this.hasExtendedAttrs()&&0!==this.extended.underlineStyle?1:268435456&this.fg}isBlink(){return 536870912&this.fg}isInvisible(){return 1073741824&this.fg}isItalic(){return 67108864&this.bg}isDim(){return 134217728&this.bg}isStrikethrough(){return 2147483648&this.fg}isProtected(){return 536870912&this.bg}isOverline(){return 1073741824&this.bg}getFgColorMode(){return 50331648&this.fg}getBgColorMode(){return 50331648&this.bg}isFgRGB(){return 50331648==(50331648&this.fg)}isBgRGB(){return 50331648==(50331648&this.bg)}isFgPalette(){return 16777216==(50331648&this.fg)||33554432==(50331648&this.fg)}isBgPalette(){return 16777216==(50331648&this.bg)||33554432==(50331648&this.bg)}isFgDefault(){return 0==(50331648&this.fg)}isBgDefault(){return 0==(50331648&this.bg)}isAttributeDefault(){return 0===this.fg&&0===this.bg}getFgColor(){switch(50331648&this.fg){case 16777216:case 33554432:return 255&this.fg;case 50331648:return 16777215&this.fg;default:return-1}}getBgColor(){switch(50331648&this.bg){case 16777216:case 33554432:return 255&this.bg;case 50331648:return 16777215&this.bg;default:return-1}}hasExtendedAttrs(){return 268435456&this.bg}updateExtended(){this.extended.isEmpty()?this.bg&=-268435457:this.bg|=268435456}getUnderlineColor(){if(268435456&this.bg&&~this.extended.underlineColor)switch(50331648&this.extended.underlineColor){case 16777216:case 33554432:return 255&this.extended.underlineColor;case 50331648:return 16777215&this.extended.underlineColor;default:return this.getFgColor()}return this.getFgColor()}getUnderlineColorMode(){return 268435456&this.bg&&~this.extended.underlineColor?50331648&this.extended.underlineColor:this.getFgColorMode()}isUnderlineColorRGB(){return 268435456&this.bg&&~this.extended.underlineColor?50331648==(50331648&this.extended.underlineColor):this.isFgRGB()}isUnderlineColorPalette(){return 268435456&this.bg&&~this.extended.underlineColor?16777216==(50331648&this.extended.underlineColor)||33554432==(50331648&this.extended.underlineColor):this.isFgPalette()}isUnderlineColorDefault(){return 268435456&this.bg&&~this.extended.underlineColor?0==(50331648&this.extended.underlineColor):this.isFgDefault()}getUnderlineStyle(){return 268435456&this.fg?268435456&this.bg?this.extended.underlineStyle:1:0}}t.AttributeData=i;class s{get ext(){return this._urlId?-469762049&this._ext|this.underlineStyle<<26:this._ext}set ext(e){this._ext=e}get underlineStyle(){return this._urlId?5:(469762048&this._ext)>>26}set underlineStyle(e){this._ext&=-469762049,this._ext|=e<<26&469762048}get underlineColor(){return 67108863&this._ext}set underlineColor(e){this._ext&=-67108864,this._ext|=67108863&e}get urlId(){return this._urlId}set urlId(e){this._urlId=e}constructor(e=0,t=0){this._ext=0,this._urlId=0,this._ext=e,this._urlId=t}clone(){return new s(this._ext,this._urlId)}isEmpty(){return 0===this.underlineStyle&&0===this._urlId}}t.ExtendedAttrs=s},9092:(e,t,i)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.Buffer=t.MAX_BUFFER_SIZE=void 0;const s=i(6349),r=i(7226),n=i(3734),o=i(8437),a=i(4634),h=i(511),c=i(643),l=i(4863),d=i(7116);t.MAX_BUFFER_SIZE=4294967295,t.Buffer=class{constructor(e,t,i){this._hasScrollback=e,this._optionsService=t,this._bufferService=i,this.ydisp=0,this.ybase=0,this.y=0,this.x=0,this.tabs={},this.savedY=0,this.savedX=0,this.savedCurAttrData=o.DEFAULT_ATTR_DATA.clone(),this.savedCharset=d.DEFAULT_CHARSET,this.markers=[],this._nullCell=h.CellData.fromCharData([0,c.NULL_CELL_CHAR,c.NULL_CELL_WIDTH,c.NULL_CELL_CODE]),this._whitespaceCell=h.CellData.fromCharData([0,c.WHITESPACE_CELL_CHAR,c.WHITESPACE_CELL_WIDTH,c.WHITESPACE_CELL_CODE]),this._isClearing=!1,this._memoryCleanupQueue=new r.IdleTaskQueue,this._memoryCleanupPosition=0,this._cols=this._bufferService.cols,this._rows=this._bufferService.rows,this.lines=new s.CircularList(this._getCorrectBufferLength(this._rows)),this.scrollTop=0,this.scrollBottom=this._rows-1,this.setupTabStops()}getNullCell(e){return e?(this._nullCell.fg=e.fg,this._nullCell.bg=e.bg,this._nullCell.extended=e.extended):(this._nullCell.fg=0,this._nullCell.bg=0,this._nullCell.extended=new n.ExtendedAttrs),this._nullCell}getWhitespaceCell(e){return e?(this._whitespaceCell.fg=e.fg,this._whitespaceCell.bg=e.bg,this._whitespaceCell.extended=e.extended):(this._whitespaceCell.fg=0,this._whitespaceCell.bg=0,this._whitespaceCell.extended=new n.ExtendedAttrs),this._whitespaceCell}getBlankLine(e,t){return new o.BufferLine(this._bufferService.cols,this.getNullCell(e),t)}get hasScrollback(){return this._hasScrollback&&this.lines.maxLength>this._rows}get isCursorInViewport(){const e=this.ybase+this.y-this.ydisp;return e>=0&&e<this._rows}_getCorrectBufferLength(e){if(!this._hasScrollback)return e;const i=e+this._optionsService.rawOptions.scrollback;return i>t.MAX_BUFFER_SIZE?t.MAX_BUFFER_SIZE:i}fillViewportRows(e){if(0===this.lines.length){void 0===e&&(e=o.DEFAULT_ATTR_DATA);let t=this._rows;for(;t--;)this.lines.push(this.getBlankLine(e))}}clear(){this.ydisp=0,this.ybase=0,this.y=0,this.x=0,this.lines=new s.CircularList(this._getCorrectBufferLength(this._rows)),this.scrollTop=0,this.scrollBottom=this._rows-1,this.setupTabStops()}resize(e,t){const i=this.getNullCell(o.DEFAULT_ATTR_DATA);let s=0;const r=this._getCorrectBufferLength(t);if(r>this.lines.maxLength&&(this.lines.maxLength=r),this.lines.length>0){if(this._cols<e)for(let t=0;t<this.lines.length;t++)s+=+this.lines.get(t).resize(e,i);let n=0;if(this._rows<t)for(let s=this._rows;s<t;s++)this.lines.length<t+this.ybase&&(this._optionsService.rawOptions.windowsMode||void 0!==this._optionsService.rawOptions.windowsPty.backend||void 0!==this._optionsService.rawOptions.windowsPty.buildNumber?this.lines.push(new o.BufferLine(e,i)):this.ybase>0&&this.lines.length<=this.ybase+this.y+n+1?(this.ybase--,n++,this.ydisp>0&&this.ydisp--):this.lines.push(new o.BufferLine(e,i)));else for(let e=this._rows;e>t;e--)this.lines.length>t+this.ybase&&(this.lines.length>this.ybase+this.y+1?this.lines.pop():(this.ybase++,this.ydisp++));if(r<this.lines.maxLength){const e=this.lines.length-r;e>0&&(this.lines.trimStart(e),this.ybase=Math.max(this.ybase-e,0),this.ydisp=Math.max(this.ydisp-e,0),this.savedY=Math.max(this.savedY-e,0)),this.lines.maxLength=r}this.x=Math.min(this.x,e-1),this.y=Math.min(this.y,t-1),n&&(this.y+=n),this.savedX=Math.min(this.savedX,e-1),this.scrollTop=0}if(this.scrollBottom=t-1,this._isReflowEnabled&&(this._reflow(e,t),this._cols>e))for(let t=0;t<this.lines.length;t++)s+=+this.lines.get(t).resize(e,i);this._cols=e,this._rows=t,this._memoryCleanupQueue.clear(),s>.1*this.lines.length&&(this._memoryCleanupPosition=0,this._memoryCleanupQueue.enqueue((()=>this._batchedMemoryCleanup())))}_batchedMemoryCleanup(){let e=!0;this._memoryCleanupPosition>=this.lines.length&&(this._memoryCleanupPosition=0,e=!1);let t=0;for(;this._memoryCleanupPosition<this.lines.length;)if(t+=this.lines.get(this._memoryCleanupPosition++).cleanupMemory(),t>100)return!0;return e}get _isReflowEnabled(){const e=this._optionsService.rawOptions.windowsPty;return e&&e.buildNumber?this._hasScrollback&&"conpty"===e.backend&&e.buildNumber>=21376:this._hasScrollback&&!this._optionsService.rawOptions.windowsMode}_reflow(e,t){this._cols!==e&&(e>this._cols?this._reflowLarger(e,t):this._reflowSmaller(e,t))}_reflowLarger(e,t){const i=(0,a.reflowLargerGetLinesToRemove)(this.lines,this._cols,e,this.ybase+this.y,this.getNullCell(o.DEFAULT_ATTR_DATA));if(i.length>0){const s=(0,a.reflowLargerCreateNewLayout)(this.lines,i);(0,a.reflowLargerApplyNewLayout)(this.lines,s.layout),this._reflowLargerAdjustViewport(e,t,s.countRemoved)}}_reflowLargerAdjustViewport(e,t,i){const s=this.getNullCell(o.DEFAULT_ATTR_DATA);let r=i;for(;r-- >0;)0===this.ybase?(this.y>0&&this.y--,this.lines.length<t&&this.lines.push(new o.BufferLine(e,s))):(this.ydisp===this.ybase&&this.ydisp--,this.ybase--);this.savedY=Math.max(this.savedY-i,0)}_reflowSmaller(e,t){const i=this.getNullCell(o.DEFAULT_ATTR_DATA),s=[];let r=0;for(let n=this.lines.length-1;n>=0;n--){let h=this.lines.get(n);if(!h||!h.isWrapped&&h.getTrimmedLength()<=e)continue;const c=[h];for(;h.isWrapped&&n>0;)h=this.lines.get(--n),c.unshift(h);const l=this.ybase+this.y;if(l>=n&&l<n+c.length)continue;const d=c[c.length-1].getTrimmedLength(),_=(0,a.reflowSmallerGetNewLineLengths)(c,this._cols,e),u=_.length-c.length;let f;f=0===this.ybase&&this.y!==this.lines.length-1?Math.max(0,this.y-this.lines.maxLength+u):Math.max(0,this.lines.length-this.lines.maxLength+u);const v=[];for(let e=0;e<u;e++){const e=this.getBlankLine(o.DEFAULT_ATTR_DATA,!0);v.push(e)}v.length>0&&(s.push({start:n+c.length+r,newLines:v}),r+=v.length),c.push(...v);let p=_.length-1,g=_[p];0===g&&(p--,g=_[p]);let m=c.length-u-1,S=d;for(;m>=0;){const e=Math.min(S,g);if(void 0===c[p])break;if(c[p].copyCellsFrom(c[m],S-e,g-e,e,!0),g-=e,0===g&&(p--,g=_[p]),S-=e,0===S){m--;const e=Math.max(m,0);S=(0,a.getWrappedLineTrimmedLength)(c,e,this._cols)}}for(let t=0;t<c.length;t++)_[t]<e&&c[t].setCell(_[t],i);let C=u-f;for(;C-- >0;)0===this.ybase?this.y<t-1?(this.y++,this.lines.pop()):(this.ybase++,this.ydisp++):this.ybase<Math.min(this.lines.maxLength,this.lines.length+r)-t&&(this.ybase===this.ydisp&&this.ydisp++,this.ybase++);this.savedY=Math.min(this.savedY+u,this.ybase+t-1)}if(s.length>0){const e=[],t=[];for(let e=0;e<this.lines.length;e++)t.push(this.lines.get(e));const i=this.lines.length;let n=i-1,o=0,a=s[o];this.lines.length=Math.min(this.lines.maxLength,this.lines.length+r);let h=0;for(let c=Math.min(this.lines.maxLength-1,i+r-1);c>=0;c--)if(a&&a.start>n+h){for(let e=a.newLines.length-1;e>=0;e--)this.lines.set(c--,a.newLines[e]);c++,e.push({index:n+1,amount:a.newLines.length}),h+=a.newLines.length,a=s[++o]}else this.lines.set(c,t[n--]);let c=0;for(let t=e.length-1;t>=0;t--)e[t].index+=c,this.lines.onInsertEmitter.fire(e[t]),c+=e[t].amount;const l=Math.max(0,i+r-this.lines.maxLength);l>0&&this.lines.onTrimEmitter.fire(l)}}translateBufferLineToString(e,t,i=0,s){const r=this.lines.get(e);return r?r.translateToString(t,i,s):""}getWrappedRangeForLine(e){let t=e,i=e;for(;t>0&&this.lines.get(t).isWrapped;)t--;for(;i+1<this.lines.length&&this.lines.get(i+1).isWrapped;)i++;return{first:t,last:i}}setupTabStops(e){for(null!=e?this.tabs[e]||(e=this.prevStop(e)):(this.tabs={},e=0);e<this._cols;e+=this._optionsService.rawOptions.tabStopWidth)this.tabs[e]=!0}prevStop(e){for(null==e&&(e=this.x);!this.tabs[--e]&&e>0;);return e>=this._cols?this._cols-1:e<0?0:e}nextStop(e){for(null==e&&(e=this.x);!this.tabs[++e]&&e<this._cols;);return e>=this._cols?this._cols-1:e<0?0:e}clearMarkers(e){this._isClearing=!0;for(let t=0;t<this.markers.length;t++)this.markers[t].line===e&&(this.markers[t].dispose(),this.markers.splice(t--,1));this._isClearing=!1}clearAllMarkers(){this._isClearing=!0;for(let e=0;e<this.markers.length;e++)this.markers[e].dispose(),this.markers.splice(e--,1);this._isClearing=!1}addMarker(e){const t=new l.Marker(e);return this.markers.push(t),t.register(this.lines.onTrim((e=>{t.line-=e,t.line<0&&t.dispose()}))),t.register(this.lines.onInsert((e=>{t.line>=e.index&&(t.line+=e.amount)}))),t.register(this.lines.onDelete((e=>{t.line>=e.index&&t.line<e.index+e.amount&&t.dispose(),t.line>e.index&&(t.line-=e.amount)}))),t.register(t.onDispose((()=>this._removeMarker(t)))),t}_removeMarker(e){this._isClearing||this.markers.splice(this.markers.indexOf(e),1)}}},8437:(e,t,i)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.BufferLine=t.DEFAULT_ATTR_DATA=void 0;const s=i(3734),r=i(511),n=i(643),o=i(482);t.DEFAULT_ATTR_DATA=Object.freeze(new s.AttributeData);let a=0;class h{constructor(e,t,i=!1){this.isWrapped=i,this._combined={},this._extendedAttrs={},this._data=new Uint32Array(3*e);const s=t||r.CellData.fromCharData([0,n.NULL_CELL_CHAR,n.NULL_CELL_WIDTH,n.NULL_CELL_CODE]);for(let t=0;t<e;++t)this.setCell(t,s);this.length=e}get(e){const t=this._data[3*e+0],i=2097151&t;return[this._data[3*e+1],2097152&t?this._combined[e]:i?(0,o.stringFromCodePoint)(i):"",t>>22,2097152&t?this._combined[e].charCodeAt(this._combined[e].length-1):i]}set(e,t){this._data[3*e+1]=t[n.CHAR_DATA_ATTR_INDEX],t[n.CHAR_DATA_CHAR_INDEX].length>1?(this._combined[e]=t[1],this._data[3*e+0]=2097152|e|t[n.CHAR_DATA_WIDTH_INDEX]<<22):this._data[3*e+0]=t[n.CHAR_DATA_CHAR_INDEX].charCodeAt(0)|t[n.CHAR_DATA_WIDTH_INDEX]<<22}getWidth(e){return this._data[3*e+0]>>22}hasWidth(e){return 12582912&this._data[3*e+0]}getFg(e){return this._data[3*e+1]}getBg(e){return this._data[3*e+2]}hasContent(e){return 4194303&this._data[3*e+0]}getCodePoint(e){const t=this._data[3*e+0];return 2097152&t?this._combined[e].charCodeAt(this._combined[e].length-1):2097151&t}isCombined(e){return 2097152&this._data[3*e+0]}getString(e){const t=this._data[3*e+0];return 2097152&t?this._combined[e]:2097151&t?(0,o.stringFromCodePoint)(2097151&t):""}isProtected(e){return 536870912&this._data[3*e+2]}loadCell(e,t){return a=3*e,t.content=this._data[a+0],t.fg=this._data[a+1],t.bg=this._data[a+2],2097152&t.content&&(t.combinedData=this._combined[e]),268435456&t.bg&&(t.extended=this._extendedAttrs[e]),t}setCell(e,t){2097152&t.content&&(this._combined[e]=t.combinedData),268435456&t.bg&&(this._extendedAttrs[e]=t.extended),this._data[3*e+0]=t.content,this._data[3*e+1]=t.fg,this._data[3*e+2]=t.bg}setCellFromCodePoint(e,t,i,s,r,n){268435456&r&&(this._extendedAttrs[e]=n),this._data[3*e+0]=t|i<<22,this._data[3*e+1]=s,this._data[3*e+2]=r}addCodepointToCell(e,t){let i=this._data[3*e+0];2097152&i?this._combined[e]+=(0,o.stringFromCodePoint)(t):(2097151&i?(this._combined[e]=(0,o.stringFromCodePoint)(2097151&i)+(0,o.stringFromCodePoint)(t),i&=-2097152,i|=2097152):i=t|1<<22,this._data[3*e+0]=i)}insertCells(e,t,i,n){if((e%=this.length)&&2===this.getWidth(e-1)&&this.setCellFromCodePoint(e-1,0,1,(null==n?void 0:n.fg)||0,(null==n?void 0:n.bg)||0,(null==n?void 0:n.extended)||new s.ExtendedAttrs),t<this.length-e){const s=new r.CellData;for(let i=this.length-e-t-1;i>=0;--i)this.setCell(e+t+i,this.loadCell(e+i,s));for(let s=0;s<t;++s)this.setCell(e+s,i)}else for(let t=e;t<this.length;++t)this.setCell(t,i);2===this.getWidth(this.length-1)&&this.setCellFromCodePoint(this.length-1,0,1,(null==n?void 0:n.fg)||0,(null==n?void 0:n.bg)||0,(null==n?void 0:n.extended)||new s.ExtendedAttrs)}deleteCells(e,t,i,n){if(e%=this.length,t<this.length-e){const s=new r.CellData;for(let i=0;i<this.length-e-t;++i)this.setCell(e+i,this.loadCell(e+t+i,s));for(let e=this.length-t;e<this.length;++e)this.setCell(e,i)}else for(let t=e;t<this.length;++t)this.setCell(t,i);e&&2===this.getWidth(e-1)&&this.setCellFromCodePoint(e-1,0,1,(null==n?void 0:n.fg)||0,(null==n?void 0:n.bg)||0,(null==n?void 0:n.extended)||new s.ExtendedAttrs),0!==this.getWidth(e)||this.hasContent(e)||this.setCellFromCodePoint(e,0,1,(null==n?void 0:n.fg)||0,(null==n?void 0:n.bg)||0,(null==n?void 0:n.extended)||new s.ExtendedAttrs)}replaceCells(e,t,i,r,n=!1){if(n)for(e&&2===this.getWidth(e-1)&&!this.isProtected(e-1)&&this.setCellFromCodePoint(e-1,0,1,(null==r?void 0:r.fg)||0,(null==r?void 0:r.bg)||0,(null==r?void 0:r.extended)||new s.ExtendedAttrs),t<this.length&&2===this.getWidth(t-1)&&!this.isProtected(t)&&this.setCellFromCodePoint(t,0,1,(null==r?void 0:r.fg)||0,(null==r?void 0:r.bg)||0,(null==r?void 0:r.extended)||new s.ExtendedAttrs);e<t&&e<this.length;)this.isProtected(e)||this.setCell(e,i),e++;else for(e&&2===this.getWidth(e-1)&&this.setCellFromCodePoint(e-1,0,1,(null==r?void 0:r.fg)||0,(null==r?void 0:r.bg)||0,(null==r?void 0:r.extended)||new s.ExtendedAttrs),t<this.length&&2===this.getWidth(t-1)&&this.setCellFromCodePoint(t,0,1,(null==r?void 0:r.fg)||0,(null==r?void 0:r.bg)||0,(null==r?void 0:r.extended)||new s.ExtendedAttrs);e<t&&e<this.length;)this.setCell(e++,i)}resize(e,t){if(e===this.length)return 4*this._data.length*2<this._data.buffer.byteLength;const i=3*e;if(e>this.length){if(this._data.buffer.byteLength>=4*i)this._data=new Uint32Array(this._data.buffer,0,i);else{const e=new Uint32Array(i);e.set(this._data),this._data=e}for(let i=this.length;i<e;++i)this.setCell(i,t)}else{this._data=this._data.subarray(0,i);const t=Object.keys(this._combined);for(let i=0;i<t.length;i++){const s=parseInt(t[i],10);s>=e&&delete this._combined[s]}const s=Object.keys(this._extendedAttrs);for(let t=0;t<s.length;t++){const i=parseInt(s[t],10);i>=e&&delete this._extendedAttrs[i]}}return this.length=e,4*i*2<this._data.buffer.byteLength}cleanupMemory(){if(4*this._data.length*2<this._data.buffer.byteLength){const e=new Uint32Array(this._data.length);return e.set(this._data),this._data=e,1}return 0}fill(e,t=!1){if(t)for(let t=0;t<this.length;++t)this.isProtected(t)||this.setCell(t,e);else{this._combined={},this._extendedAttrs={};for(let t=0;t<this.length;++t)this.setCell(t,e)}}copyFrom(e){this.length!==e.length?this._data=new Uint32Array(e._data):this._data.set(e._data),this.length=e.length,this._combined={};for(const t in e._combined)this._combined[t]=e._combined[t];this._extendedAttrs={};for(const t in e._extendedAttrs)this._extendedAttrs[t]=e._extendedAttrs[t];this.isWrapped=e.isWrapped}clone(){const e=new h(0);e._data=new Uint32Array(this._data),e.length=this.length;for(const t in this._combined)e._combined[t]=this._combined[t];for(const t in this._extendedAttrs)e._extendedAttrs[t]=this._extendedAttrs[t];return e.isWrapped=this.isWrapped,e}getTrimmedLength(){for(let e=this.length-1;e>=0;--e)if(4194303&this._data[3*e+0])return e+(this._data[3*e+0]>>22);return 0}getNoBgTrimmedLength(){for(let e=this.length-1;e>=0;--e)if(4194303&this._data[3*e+0]||50331648&this._data[3*e+2])return e+(this._data[3*e+0]>>22);return 0}copyCellsFrom(e,t,i,s,r){const n=e._data;if(r)for(let r=s-1;r>=0;r--){for(let e=0;e<3;e++)this._data[3*(i+r)+e]=n[3*(t+r)+e];268435456&n[3*(t+r)+2]&&(this._extendedAttrs[i+r]=e._extendedAttrs[t+r])}else for(let r=0;r<s;r++){for(let e=0;e<3;e++)this._data[3*(i+r)+e]=n[3*(t+r)+e];268435456&n[3*(t+r)+2]&&(this._extendedAttrs[i+r]=e._extendedAttrs[t+r])}const o=Object.keys(e._combined);for(let s=0;s<o.length;s++){const r=parseInt(o[s],10);r>=t&&(this._combined[r-t+i]=e._combined[r])}}translateToString(e=!1,t=0,i=this.length){e&&(i=Math.min(i,this.getTrimmedLength()));let s="";for(;t<i;){const e=this._data[3*t+0],i=2097151&e;s+=2097152&e?this._combined[t]:i?(0,o.stringFromCodePoint)(i):n.WHITESPACE_CELL_CHAR,t+=e>>22||1}return s}}t.BufferLine=h},4841:(e,t)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.getRangeLength=void 0,t.getRangeLength=function(e,t){if(e.start.y>e.end.y)throw new Error(`Buffer range end (${e.end.x}, ${e.end.y}) cannot be before start (${e.start.x}, ${e.start.y})`);return t*(e.end.y-e.start.y)+(e.end.x-e.start.x+1)}},4634:(e,t)=>{function i(e,t,i){if(t===e.length-1)return e[t].getTrimmedLength();const s=!e[t].hasContent(i-1)&&1===e[t].getWidth(i-1),r=2===e[t+1].getWidth(0);return s&&r?i-1:i}Object.defineProperty(t,"__esModule",{value:!0}),t.getWrappedLineTrimmedLength=t.reflowSmallerGetNewLineLengths=t.reflowLargerApplyNewLayout=t.reflowLargerCreateNewLayout=t.reflowLargerGetLinesToRemove=void 0,t.reflowLargerGetLinesToRemove=function(e,t,s,r,n){const o=[];for(let a=0;a<e.length-1;a++){let h=a,c=e.get(++h);if(!c.isWrapped)continue;const l=[e.get(a)];for(;h<e.length&&c.isWrapped;)l.push(c),c=e.get(++h);if(r>=a&&r<h){a+=l.length-1;continue}let d=0,_=i(l,d,t),u=1,f=0;for(;u<l.length;){const e=i(l,u,t),r=e-f,o=s-_,a=Math.min(r,o);l[d].copyCellsFrom(l[u],f,_,a,!1),_+=a,_===s&&(d++,_=0),f+=a,f===e&&(u++,f=0),0===_&&0!==d&&2===l[d-1].getWidth(s-1)&&(l[d].copyCellsFrom(l[d-1],s-1,_++,1,!1),l[d-1].setCell(s-1,n))}l[d].replaceCells(_,s,n);let v=0;for(let e=l.length-1;e>0&&(e>d||0===l[e].getTrimmedLength());e--)v++;v>0&&(o.push(a+l.length-v),o.push(v)),a+=l.length-1}return o},t.reflowLargerCreateNewLayout=function(e,t){const i=[];let s=0,r=t[s],n=0;for(let o=0;o<e.length;o++)if(r===o){const i=t[++s];e.onDeleteEmitter.fire({index:o-n,amount:i}),o+=i-1,n+=i,r=t[++s]}else i.push(o);return{layout:i,countRemoved:n}},t.reflowLargerApplyNewLayout=function(e,t){const i=[];for(let s=0;s<t.length;s++)i.push(e.get(t[s]));for(let t=0;t<i.length;t++)e.set(t,i[t]);e.length=t.length},t.reflowSmallerGetNewLineLengths=function(e,t,s){const r=[],n=e.map(((s,r)=>i(e,r,t))).reduce(((e,t)=>e+t));let o=0,a=0,h=0;for(;h<n;){if(n-h<s){r.push(n-h);break}o+=s;const c=i(e,a,t);o>c&&(o-=c,a++);const l=2===e[a].getWidth(o-1);l&&o--;const d=l?s-1:s;r.push(d),h+=d}return r},t.getWrappedLineTrimmedLength=i},5295:(e,t,i)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.BufferSet=void 0;const s=i(8460),r=i(844),n=i(9092);class o extends r.Disposable{constructor(e,t){super(),this._optionsService=e,this._bufferService=t,this._onBufferActivate=this.register(new s.EventEmitter),this.onBufferActivate=this._onBufferActivate.event,this.reset(),this.register(this._optionsService.onSpecificOptionChange("scrollback",(()=>this.resize(this._bufferService.cols,this._bufferService.rows)))),this.register(this._optionsService.onSpecificOptionChange("tabStopWidth",(()=>this.setupTabStops())))}reset(){this._normal=new n.Buffer(!0,this._optionsService,this._bufferService),this._normal.fillViewportRows(),this._alt=new n.Buffer(!1,this._optionsService,this._bufferService),this._activeBuffer=this._normal,this._onBufferActivate.fire({activeBuffer:this._normal,inactiveBuffer:this._alt}),this.setupTabStops()}get alt(){return this._alt}get active(){return this._activeBuffer}get normal(){return this._normal}activateNormalBuffer(){this._activeBuffer!==this._normal&&(this._normal.x=this._alt.x,this._normal.y=this._alt.y,this._alt.clearAllMarkers(),this._alt.clear(),this._activeBuffer=this._normal,this._onBufferActivate.fire({activeBuffer:this._normal,inactiveBuffer:this._alt}))}activateAltBuffer(e){this._activeBuffer!==this._alt&&(this._alt.fillViewportRows(e),this._alt.x=this._normal.x,this._alt.y=this._normal.y,this._activeBuffer=this._alt,this._onBufferActivate.fire({activeBuffer:this._alt,inactiveBuffer:this._normal}))}resize(e,t){this._normal.resize(e,t),this._alt.resize(e,t),this.setupTabStops(e)}setupTabStops(e){this._normal.setupTabStops(e),this._alt.setupTabStops(e)}}t.BufferSet=o},511:(e,t,i)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.CellData=void 0;const s=i(482),r=i(643),n=i(3734);class o extends n.AttributeData{constructor(){super(...arguments),this.content=0,this.fg=0,this.bg=0,this.extended=new n.ExtendedAttrs,this.combinedData=""}static fromCharData(e){const t=new o;return t.setFromCharData(e),t}isCombined(){return 2097152&this.content}getWidth(){return this.content>>22}getChars(){return 2097152&this.content?this.combinedData:2097151&this.content?(0,s.stringFromCodePoint)(2097151&this.content):""}getCode(){return this.isCombined()?this.combinedData.charCodeAt(this.combinedData.length-1):2097151&this.content}setFromCharData(e){this.fg=e[r.CHAR_DATA_ATTR_INDEX],this.bg=0;let t=!1;if(e[r.CHAR_DATA_CHAR_INDEX].length>2)t=!0;else if(2===e[r.CHAR_DATA_CHAR_INDEX].length){const i=e[r.CHAR_DATA_CHAR_INDEX].charCodeAt(0);if(55296<=i&&i<=56319){const s=e[r.CHAR_DATA_CHAR_INDEX].charCodeAt(1);56320<=s&&s<=57343?this.content=1024*(i-55296)+s-56320+65536|e[r.CHAR_DATA_WIDTH_INDEX]<<22:t=!0}else t=!0}else this.content=e[r.CHAR_DATA_CHAR_INDEX].charCodeAt(0)|e[r.CHAR_DATA_WIDTH_INDEX]<<22;t&&(this.combinedData=e[r.CHAR_DATA_CHAR_INDEX],this.content=2097152|e[r.CHAR_DATA_WIDTH_INDEX]<<22)}getAsCharData(){return[this.fg,this.getChars(),this.getWidth(),this.getCode()]}}t.CellData=o},643:(e,t)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.WHITESPACE_CELL_CODE=t.WHITESPACE_CELL_WIDTH=t.WHITESPACE_CELL_CHAR=t.NULL_CELL_CODE=t.NULL_CELL_WIDTH=t.NULL_CELL_CHAR=t.CHAR_DATA_CODE_INDEX=t.CHAR_DATA_WIDTH_INDEX=t.CHAR_DATA_CHAR_INDEX=t.CHAR_DATA_ATTR_INDEX=t.DEFAULT_EXT=t.DEFAULT_ATTR=t.DEFAULT_COLOR=void 0,t.DEFAULT_COLOR=0,t.DEFAULT_ATTR=256|t.DEFAULT_COLOR<<9,t.DEFAULT_EXT=0,t.CHAR_DATA_ATTR_INDEX=0,t.CHAR_DATA_CHAR_INDEX=1,t.CHAR_DATA_WIDTH_INDEX=2,t.CHAR_DATA_CODE_INDEX=3,t.NULL_CELL_CHAR="",t.NULL_CELL_WIDTH=1,t.NULL_CELL_CODE=0,t.WHITESPACE_CELL_CHAR=" ",t.WHITESPACE_CELL_WIDTH=1,t.WHITESPACE_CELL_CODE=32},4863:(e,t,i)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.Marker=void 0;const s=i(8460),r=i(844);class n{get id(){return this._id}constructor(e){this.line=e,this.isDisposed=!1,this._disposables=[],this._id=n._nextId++,this._onDispose=this.register(new s.EventEmitter),this.onDispose=this._onDispose.event}dispose(){this.isDisposed||(this.isDisposed=!0,this.line=-1,this._onDispose.fire(),(0,r.disposeArray)(this._disposables),this._disposables.length=0)}register(e){return this._disposables.push(e),e}}t.Marker=n,n._nextId=1},7116:(e,t)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.DEFAULT_CHARSET=t.CHARSETS=void 0,t.CHARSETS={},t.DEFAULT_CHARSET=t.CHARSETS.B,t.CHARSETS[0]={"`":"◆",a:"▒",b:"␉",c:"␌",d:"␍",e:"␊",f:"°",g:"±",h:"␤",i:"␋",j:"┘",k:"┐",l:"┌",m:"└",n:"┼",o:"⎺",p:"⎻",q:"─",r:"⎼",s:"⎽",t:"├",u:"┤",v:"┴",w:"┬",x:"│",y:"≤",z:"≥","{":"π","|":"≠","}":"£","~":"·"},t.CHARSETS.A={"#":"£"},t.CHARSETS.B=void 0,t.CHARSETS[4]={"#":"£","@":"¾","[":"ij","\\":"½","]":"|","{":"¨","|":"f","}":"¼","~":"´"},t.CHARSETS.C=t.CHARSETS[5]={"[":"Ä","\\":"Ö","]":"Å","^":"Ü","`":"é","{":"ä","|":"ö","}":"å","~":"ü"},t.CHARSETS.R={"#":"£","@":"à","[":"°","\\":"ç","]":"§","{":"é","|":"ù","}":"è","~":"¨"},t.CHARSETS.Q={"@":"à","[":"â","\\":"ç","]":"ê","^":"î","`":"ô","{":"é","|":"ù","}":"è","~":"û"},t.CHARSETS.K={"@":"§","[":"Ä","\\":"Ö","]":"Ü","{":"ä","|":"ö","}":"ü","~":"ß"},t.CHARSETS.Y={"#":"£","@":"§","[":"°","\\":"ç","]":"é","`":"ù","{":"à","|":"ò","}":"è","~":"ì"},t.CHARSETS.E=t.CHARSETS[6]={"@":"Ä","[":"Æ","\\":"Ø","]":"Å","^":"Ü","`":"ä","{":"æ","|":"ø","}":"å","~":"ü"},t.CHARSETS.Z={"#":"£","@":"§","[":"¡","\\":"Ñ","]":"¿","{":"°","|":"ñ","}":"ç"},t.CHARSETS.H=t.CHARSETS[7]={"@":"É","[":"Ä","\\":"Ö","]":"Å","^":"Ü","`":"é","{":"ä","|":"ö","}":"å","~":"ü"},t.CHARSETS["="]={"#":"ù","@":"à","[":"é","\\":"ç","]":"ê","^":"î",_:"è","`":"ô","{":"ä","|":"ö","}":"ü","~":"û"}},2584:(e,t)=>{var i,s,r;Object.defineProperty(t,"__esModule",{value:!0}),t.C1_ESCAPED=t.C1=t.C0=void 0,function(e){e.NUL="\0",e.SOH="",e.STX="",e.ETX="",e.EOT="",e.ENQ="",e.ACK="",e.BEL="",e.BS="\b",e.HT="\t",e.LF="\n",e.VT="\v",e.FF="\f",e.CR="\r",e.SO="",e.SI="",e.DLE="",e.DC1="",e.DC2="",e.DC3="",e.DC4="",e.NAK="",e.SYN="",e.ETB="",e.CAN="",e.EM="",e.SUB="",e.ESC="",e.FS="",e.GS="",e.RS="",e.US="",e.SP=" ",e.DEL=""}(i||(t.C0=i={})),function(e){e.PAD="",e.HOP="",e.BPH="",e.NBH="",e.IND="",e.NEL="",e.SSA="",e.ESA="",e.HTS="",e.HTJ="",e.VTS="",e.PLD="",e.PLU="",e.RI="",e.SS2="",e.SS3="",e.DCS="",e.PU1="",e.PU2="",e.STS="",e.CCH="",e.MW="",e.SPA="",e.EPA="",e.SOS="",e.SGCI="",e.SCI="",e.CSI="",e.ST="",e.OSC="",e.PM="",e.APC=""}(s||(t.C1=s={})),function(e){e.ST=`${i.ESC}\\`}(r||(t.C1_ESCAPED=r={}))},7399:(e,t,i)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.evaluateKeyboardEvent=void 0;const s=i(2584),r={48:["0",")"],49:["1","!"],50:["2","@"],51:["3","#"],52:["4","$"],53:["5","%"],54:["6","^"],55:["7","&"],56:["8","*"],57:["9","("],186:[";",":"],187:["=","+"],188:[",","<"],189:["-","_"],190:[".",">"],191:["/","?"],192:["`","~"],219:["[","{"],220:["\\","|"],221:["]","}"],222:["'",'"']};t.evaluateKeyboardEvent=function(e,t,i,n){const o={type:0,cancel:!1,key:void 0},a=(e.shiftKey?1:0)|(e.altKey?2:0)|(e.ctrlKey?4:0)|(e.metaKey?8:0);switch(e.keyCode){case 0:"UIKeyInputUpArrow"===e.key?o.key=t?s.C0.ESC+"OA":s.C0.ESC+"[A":"UIKeyInputLeftArrow"===e.key?o.key=t?s.C0.ESC+"OD":s.C0.ESC+"[D":"UIKeyInputRightArrow"===e.key?o.key=t?s.C0.ESC+"OC":s.C0.ESC+"[C":"UIKeyInputDownArrow"===e.key&&(o.key=t?s.C0.ESC+"OB":s.C0.ESC+"[B");break;case 8:if(e.altKey){o.key=s.C0.ESC+s.C0.DEL;break}o.key=s.C0.DEL;break;case 9:if(e.shiftKey){o.key=s.C0.ESC+"[Z";break}o.key=s.C0.HT,o.cancel=!0;break;case 13:o.key=e.altKey?s.C0.ESC+s.C0.CR:s.C0.CR,o.cancel=!0;break;case 27:o.key=s.C0.ESC,e.altKey&&(o.key=s.C0.ESC+s.C0.ESC),o.cancel=!0;break;case 37:if(e.metaKey)break;a?(o.key=s.C0.ESC+"[1;"+(a+1)+"D",o.key===s.C0.ESC+"[1;3D"&&(o.key=s.C0.ESC+(i?"b":"[1;5D"))):o.key=t?s.C0.ESC+"OD":s.C0.ESC+"[D";break;case 39:if(e.metaKey)break;a?(o.key=s.C0.ESC+"[1;"+(a+1)+"C",o.key===s.C0.ESC+"[1;3C"&&(o.key=s.C0.ESC+(i?"f":"[1;5C"))):o.key=t?s.C0.ESC+"OC":s.C0.ESC+"[C";break;case 38:if(e.metaKey)break;a?(o.key=s.C0.ESC+"[1;"+(a+1)+"A",i||o.key!==s.C0.ESC+"[1;3A"||(o.key=s.C0.ESC+"[1;5A")):o.key=t?s.C0.ESC+"OA":s.C0.ESC+"[A";break;case 40:if(e.metaKey)break;a?(o.key=s.C0.ESC+"[1;"+(a+1)+"B",i||o.key!==s.C0.ESC+"[1;3B"||(o.key=s.C0.ESC+"[1;5B")):o.key=t?s.C0.ESC+"OB":s.C0.ESC+"[B";break;case 45:e.shiftKey||e.ctrlKey||(o.key=s.C0.ESC+"[2~");break;case 46:o.key=a?s.C0.ESC+"[3;"+(a+1)+"~":s.C0.ESC+"[3~";break;case 36:o.key=a?s.C0.ESC+"[1;"+(a+1)+"H":t?s.C0.ESC+"OH":s.C0.ESC+"[H";break;case 35:o.key=a?s.C0.ESC+"[1;"+(a+1)+"F":t?s.C0.ESC+"OF":s.C0.ESC+"[F";break;case 33:e.shiftKey?o.type=2:e.ctrlKey?o.key=s.C0.ESC+"[5;"+(a+1)+"~":o.key=s.C0.ESC+"[5~";break;case 34:e.shiftKey?o.type=3:e.ctrlKey?o.key=s.C0.ESC+"[6;"+(a+1)+"~":o.key=s.C0.ESC+"[6~";break;case 112:o.key=a?s.C0.ESC+"[1;"+(a+1)+"P":s.C0.ESC+"OP";break;case 113:o.key=a?s.C0.ESC+"[1;"+(a+1)+"Q":s.C0.ESC+"OQ";break;case 114:o.key=a?s.C0.ESC+"[1;"+(a+1)+"R":s.C0.ESC+"OR";break;case 115:o.key=a?s.C0.ESC+"[1;"+(a+1)+"S":s.C0.ESC+"OS";break;case 116:o.key=a?s.C0.ESC+"[15;"+(a+1)+"~":s.C0.ESC+"[15~";break;case 117:o.key=a?s.C0.ESC+"[17;"+(a+1)+"~":s.C0.ESC+"[17~";break;case 118:o.key=a?s.C0.ESC+"[18;"+(a+1)+"~":s.C0.ESC+"[18~";break;case 119:o.key=a?s.C0.ESC+"[19;"+(a+1)+"~":s.C0.ESC+"[19~";break;case 120:o.key=a?s.C0.ESC+"[20;"+(a+1)+"~":s.C0.ESC+"[20~";break;case 121:o.key=a?s.C0.ESC+"[21;"+(a+1)+"~":s.C0.ESC+"[21~";break;case 122:o.key=a?s.C0.ESC+"[23;"+(a+1)+"~":s.C0.ESC+"[23~";break;case 123:o.key=a?s.C0.ESC+"[24;"+(a+1)+"~":s.C0.ESC+"[24~";break;default:if(!e.ctrlKey||e.shiftKey||e.altKey||e.metaKey)if(i&&!n||!e.altKey||e.metaKey)!i||e.altKey||e.ctrlKey||e.shiftKey||!e.metaKey?e.key&&!e.ctrlKey&&!e.altKey&&!e.metaKey&&e.keyCode>=48&&1===e.key.length?o.key=e.key:e.key&&e.ctrlKey&&("_"===e.key&&(o.key=s.C0.US),"@"===e.key&&(o.key=s.C0.NUL)):65===e.keyCode&&(o.type=1);else{const t=r[e.keyCode],i=null==t?void 0:t[e.shiftKey?1:0];if(i)o.key=s.C0.ESC+i;else if(e.keyCode>=65&&e.keyCode<=90){const t=e.ctrlKey?e.keyCode-64:e.keyCode+32;let i=String.fromCharCode(t);e.shiftKey&&(i=i.toUpperCase()),o.key=s.C0.ESC+i}else if(32===e.keyCode)o.key=s.C0.ESC+(e.ctrlKey?s.C0.NUL:" ");else if("Dead"===e.key&&e.code.startsWith("Key")){let t=e.code.slice(3,4);e.shiftKey||(t=t.toLowerCase()),o.key=s.C0.ESC+t,o.cancel=!0}}else e.keyCode>=65&&e.keyCode<=90?o.key=String.fromCharCode(e.keyCode-64):32===e.keyCode?o.key=s.C0.NUL:e.keyCode>=51&&e.keyCode<=55?o.key=String.fromCharCode(e.keyCode-51+27):56===e.keyCode?o.key=s.C0.DEL:219===e.keyCode?o.key=s.C0.ESC:220===e.keyCode?o.key=s.C0.FS:221===e.keyCode&&(o.key=s.C0.GS)}return o}},482:(e,t)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.Utf8ToUtf32=t.StringToUtf32=t.utf32ToString=t.stringFromCodePoint=void 0,t.stringFromCodePoint=function(e){return e>65535?(e-=65536,String.fromCharCode(55296+(e>>10))+String.fromCharCode(e%1024+56320)):String.fromCharCode(e)},t.utf32ToString=function(e,t=0,i=e.length){let s="";for(let r=t;r<i;++r){let t=e[r];t>65535?(t-=65536,s+=String.fromCharCode(55296+(t>>10))+String.fromCharCode(t%1024+56320)):s+=String.fromCharCode(t)}return s},t.StringToUtf32=class{constructor(){this._interim=0}clear(){this._interim=0}decode(e,t){const i=e.length;if(!i)return 0;let s=0,r=0;if(this._interim){const i=e.charCodeAt(r++);56320<=i&&i<=57343?t[s++]=1024*(this._interim-55296)+i-56320+65536:(t[s++]=this._interim,t[s++]=i),this._interim=0}for(let n=r;n<i;++n){const r=e.charCodeAt(n);if(55296<=r&&r<=56319){if(++n>=i)return this._interim=r,s;const o=e.charCodeAt(n);56320<=o&&o<=57343?t[s++]=1024*(r-55296)+o-56320+65536:(t[s++]=r,t[s++]=o)}else 65279!==r&&(t[s++]=r)}return s}},t.Utf8ToUtf32=class{constructor(){this.interim=new Uint8Array(3)}clear(){this.interim.fill(0)}decode(e,t){const i=e.length;if(!i)return 0;let s,r,n,o,a=0,h=0,c=0;if(this.interim[0]){let s=!1,r=this.interim[0];r&=192==(224&r)?31:224==(240&r)?15:7;let n,o=0;for(;(n=63&this.interim[++o])&&o<4;)r<<=6,r|=n;const h=192==(224&this.interim[0])?2:224==(240&this.interim[0])?3:4,l=h-o;for(;c<l;){if(c>=i)return 0;if(n=e[c++],128!=(192&n)){c--,s=!0;break}this.interim[o++]=n,r<<=6,r|=63&n}s||(2===h?r<128?c--:t[a++]=r:3===h?r<2048||r>=55296&&r<=57343||65279===r||(t[a++]=r):r<65536||r>1114111||(t[a++]=r)),this.interim.fill(0)}const l=i-4;let d=c;for(;d<i;){for(;!(!(d<l)||128&(s=e[d])||128&(r=e[d+1])||128&(n=e[d+2])||128&(o=e[d+3]));)t[a++]=s,t[a++]=r,t[a++]=n,t[a++]=o,d+=4;if(s=e[d++],s<128)t[a++]=s;else if(192==(224&s)){if(d>=i)return this.interim[0]=s,a;if(r=e[d++],128!=(192&r)){d--;continue}if(h=(31&s)<<6|63&r,h<128){d--;continue}t[a++]=h}else if(224==(240&s)){if(d>=i)return this.interim[0]=s,a;if(r=e[d++],128!=(192&r)){d--;continue}if(d>=i)return this.interim[0]=s,this.interim[1]=r,a;if(n=e[d++],128!=(192&n)){d--;continue}if(h=(15&s)<<12|(63&r)<<6|63&n,h<2048||h>=55296&&h<=57343||65279===h)continue;t[a++]=h}else if(240==(248&s)){if(d>=i)return this.interim[0]=s,a;if(r=e[d++],128!=(192&r)){d--;continue}if(d>=i)return this.interim[0]=s,this.interim[1]=r,a;if(n=e[d++],128!=(192&n)){d--;continue}if(d>=i)return this.interim[0]=s,this.interim[1]=r,this.interim[2]=n,a;if(o=e[d++],128!=(192&o)){d--;continue}if(h=(7&s)<<18|(63&r)<<12|(63&n)<<6|63&o,h<65536||h>1114111)continue;t[a++]=h}}return a}}},225:(e,t)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.UnicodeV6=void 0;const i=[[768,879],[1155,1158],[1160,1161],[1425,1469],[1471,1471],[1473,1474],[1476,1477],[1479,1479],[1536,1539],[1552,1557],[1611,1630],[1648,1648],[1750,1764],[1767,1768],[1770,1773],[1807,1807],[1809,1809],[1840,1866],[1958,1968],[2027,2035],[2305,2306],[2364,2364],[2369,2376],[2381,2381],[2385,2388],[2402,2403],[2433,2433],[2492,2492],[2497,2500],[2509,2509],[2530,2531],[2561,2562],[2620,2620],[2625,2626],[2631,2632],[2635,2637],[2672,2673],[2689,2690],[2748,2748],[2753,2757],[2759,2760],[2765,2765],[2786,2787],[2817,2817],[2876,2876],[2879,2879],[2881,2883],[2893,2893],[2902,2902],[2946,2946],[3008,3008],[3021,3021],[3134,3136],[3142,3144],[3146,3149],[3157,3158],[3260,3260],[3263,3263],[3270,3270],[3276,3277],[3298,3299],[3393,3395],[3405,3405],[3530,3530],[3538,3540],[3542,3542],[3633,3633],[3636,3642],[3655,3662],[3761,3761],[3764,3769],[3771,3772],[3784,3789],[3864,3865],[3893,3893],[3895,3895],[3897,3897],[3953,3966],[3968,3972],[3974,3975],[3984,3991],[3993,4028],[4038,4038],[4141,4144],[4146,4146],[4150,4151],[4153,4153],[4184,4185],[4448,4607],[4959,4959],[5906,5908],[5938,5940],[5970,5971],[6002,6003],[6068,6069],[6071,6077],[6086,6086],[6089,6099],[6109,6109],[6155,6157],[6313,6313],[6432,6434],[6439,6440],[6450,6450],[6457,6459],[6679,6680],[6912,6915],[6964,6964],[6966,6970],[6972,6972],[6978,6978],[7019,7027],[7616,7626],[7678,7679],[8203,8207],[8234,8238],[8288,8291],[8298,8303],[8400,8431],[12330,12335],[12441,12442],[43014,43014],[43019,43019],[43045,43046],[64286,64286],[65024,65039],[65056,65059],[65279,65279],[65529,65531]],s=[[68097,68099],[68101,68102],[68108,68111],[68152,68154],[68159,68159],[119143,119145],[119155,119170],[119173,119179],[119210,119213],[119362,119364],[917505,917505],[917536,917631],[917760,917999]];let r;t.UnicodeV6=class{constructor(){if(this.version="6",!r){r=new Uint8Array(65536),r.fill(1),r[0]=0,r.fill(0,1,32),r.fill(0,127,160),r.fill(2,4352,4448),r[9001]=2,r[9002]=2,r.fill(2,11904,42192),r[12351]=1,r.fill(2,44032,55204),r.fill(2,63744,64256),r.fill(2,65040,65050),r.fill(2,65072,65136),r.fill(2,65280,65377),r.fill(2,65504,65511);for(let e=0;e<i.length;++e)r.fill(0,i[e][0],i[e][1]+1)}}wcwidth(e){return e<32?0:e<127?1:e<65536?r[e]:function(e,t){let i,s=0,r=t.length-1;if(e<t[0][0]||e>t[r][1])return!1;for(;r>=s;)if(i=s+r>>1,e>t[i][1])s=i+1;else{if(!(e<t[i][0]))return!0;r=i-1}return!1}(e,s)?0:e>=131072&&e<=196605||e>=196608&&e<=262141?2:1}}},5981:(e,t,i)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.WriteBuffer=void 0;const s=i(8460),r=i(844);class n extends r.Disposable{constructor(e){super(),this._action=e,this._writeBuffer=[],this._callbacks=[],this._pendingData=0,this._bufferOffset=0,this._isSyncWriting=!1,this._syncCalls=0,this._didUserInput=!1,this._onWriteParsed=this.register(new s.EventEmitter),this.onWriteParsed=this._onWriteParsed.event}handleUserInput(){this._didUserInput=!0}writeSync(e,t){if(void 0!==t&&this._syncCalls>t)return void(this._syncCalls=0);if(this._pendingData+=e.length,this._writeBuffer.push(e),this._callbacks.push(void 0),this._syncCalls++,this._isSyncWriting)return;let i;for(this._isSyncWriting=!0;i=this._writeBuffer.shift();){this._action(i);const e=this._callbacks.shift();e&&e()}this._pendingData=0,this._bufferOffset=2147483647,this._isSyncWriting=!1,this._syncCalls=0}write(e,t){if(this._pendingData>5e7)throw new Error("write data discarded, use flow control to avoid losing data");if(!this._writeBuffer.length){if(this._bufferOffset=0,this._didUserInput)return this._didUserInput=!1,this._pendingData+=e.length,this._writeBuffer.push(e),this._callbacks.push(t),void this._innerWrite();setTimeout((()=>this._innerWrite()))}this._pendingData+=e.length,this._writeBuffer.push(e),this._callbacks.push(t)}_innerWrite(e=0,t=!0){const i=e||Date.now();for(;this._writeBuffer.length>this._bufferOffset;){const e=this._writeBuffer[this._bufferOffset],s=this._action(e,t);if(s){const e=e=>Date.now()-i>=12?setTimeout((()=>this._innerWrite(0,e))):this._innerWrite(i,e);return void s.catch((e=>(queueMicrotask((()=>{throw e})),Promise.resolve(!1)))).then(e)}const r=this._callbacks[this._bufferOffset];if(r&&r(),this._bufferOffset++,this._pendingData-=e.length,Date.now()-i>=12)break}this._writeBuffer.length>this._bufferOffset?(this._bufferOffset>50&&(this._writeBuffer=this._writeBuffer.slice(this._bufferOffset),this._callbacks=this._callbacks.slice(this._bufferOffset),this._bufferOffset=0),setTimeout((()=>this._innerWrite()))):(this._writeBuffer.length=0,this._callbacks.length=0,this._pendingData=0,this._bufferOffset=0),this._onWriteParsed.fire()}}t.WriteBuffer=n},5941:(e,t)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.toRgbString=t.parseColor=void 0;const i=/^([\da-f])\/([\da-f])\/([\da-f])$|^([\da-f]{2})\/([\da-f]{2})\/([\da-f]{2})$|^([\da-f]{3})\/([\da-f]{3})\/([\da-f]{3})$|^([\da-f]{4})\/([\da-f]{4})\/([\da-f]{4})$/,s=/^[\da-f]+$/;function r(e,t){const i=e.toString(16),s=i.length<2?"0"+i:i;switch(t){case 4:return i[0];case 8:return s;case 12:return(s+s).slice(0,3);default:return s+s}}t.parseColor=function(e){if(!e)return;let t=e.toLowerCase();if(0===t.indexOf("rgb:")){t=t.slice(4);const e=i.exec(t);if(e){const t=e[1]?15:e[4]?255:e[7]?4095:65535;return[Math.round(parseInt(e[1]||e[4]||e[7]||e[10],16)/t*255),Math.round(parseInt(e[2]||e[5]||e[8]||e[11],16)/t*255),Math.round(parseInt(e[3]||e[6]||e[9]||e[12],16)/t*255)]}}else if(0===t.indexOf("#")&&(t=t.slice(1),s.exec(t)&&[3,6,9,12].includes(t.length))){const e=t.length/3,i=[0,0,0];for(let s=0;s<3;++s){const r=parseInt(t.slice(e*s,e*s+e),16);i[s]=1===e?r<<4:2===e?r:3===e?r>>4:r>>8}return i}},t.toRgbString=function(e,t=16){const[i,s,n]=e;return`rgb:${r(i,t)}/${r(s,t)}/${r(n,t)}`}},5770:(e,t)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.PAYLOAD_LIMIT=void 0,t.PAYLOAD_LIMIT=1e7},6351:(e,t,i)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.DcsHandler=t.DcsParser=void 0;const s=i(482),r=i(8742),n=i(5770),o=[];t.DcsParser=class{constructor(){this._handlers=Object.create(null),this._active=o,this._ident=0,this._handlerFb=()=>{},this._stack={paused:!1,loopPosition:0,fallThrough:!1}}dispose(){this._handlers=Object.create(null),this._handlerFb=()=>{},this._active=o}registerHandler(e,t){void 0===this._handlers[e]&&(this._handlers[e]=[]);const i=this._handlers[e];return i.push(t),{dispose:()=>{const e=i.indexOf(t);-1!==e&&i.splice(e,1)}}}clearHandler(e){this._handlers[e]&&delete this._handlers[e]}setHandlerFallback(e){this._handlerFb=e}reset(){if(this._active.length)for(let e=this._stack.paused?this._stack.loopPosition-1:this._active.length-1;e>=0;--e)this._active[e].unhook(!1);this._stack.paused=!1,this._active=o,this._ident=0}hook(e,t){if(this.reset(),this._ident=e,this._active=this._handlers[e]||o,this._active.length)for(let e=this._active.length-1;e>=0;e--)this._active[e].hook(t);else this._handlerFb(this._ident,"HOOK",t)}put(e,t,i){if(this._active.length)for(let s=this._active.length-1;s>=0;s--)this._active[s].put(e,t,i);else this._handlerFb(this._ident,"PUT",(0,s.utf32ToString)(e,t,i))}unhook(e,t=!0){if(this._active.length){let i=!1,s=this._active.length-1,r=!1;if(this._stack.paused&&(s=this._stack.loopPosition-1,i=t,r=this._stack.fallThrough,this._stack.paused=!1),!r&&!1===i){for(;s>=0&&(i=this._active[s].unhook(e),!0!==i);s--)if(i instanceof Promise)return this._stack.paused=!0,this._stack.loopPosition=s,this._stack.fallThrough=!1,i;s--}for(;s>=0;s--)if(i=this._active[s].unhook(!1),i instanceof Promise)return this._stack.paused=!0,this._stack.loopPosition=s,this._stack.fallThrough=!0,i}else this._handlerFb(this._ident,"UNHOOK",e);this._active=o,this._ident=0}};const a=new r.Params;a.addParam(0),t.DcsHandler=class{constructor(e){this._handler=e,this._data="",this._params=a,this._hitLimit=!1}hook(e){this._params=e.length>1||e.params[0]?e.clone():a,this._data="",this._hitLimit=!1}put(e,t,i){this._hitLimit||(this._data+=(0,s.utf32ToString)(e,t,i),this._data.length>n.PAYLOAD_LIMIT&&(this._data="",this._hitLimit=!0))}unhook(e){let t=!1;if(this._hitLimit)t=!1;else if(e&&(t=this._handler(this._data,this._params),t instanceof Promise))return t.then((e=>(this._params=a,this._data="",this._hitLimit=!1,e)));return this._params=a,this._data="",this._hitLimit=!1,t}}},2015:(e,t,i)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.EscapeSequenceParser=t.VT500_TRANSITION_TABLE=t.TransitionTable=void 0;const s=i(844),r=i(8742),n=i(6242),o=i(6351);class a{constructor(e){this.table=new Uint8Array(e)}setDefault(e,t){this.table.fill(e<<4|t)}add(e,t,i,s){this.table[t<<8|e]=i<<4|s}addMany(e,t,i,s){for(let r=0;r<e.length;r++)this.table[t<<8|e[r]]=i<<4|s}}t.TransitionTable=a;const h=160;t.VT500_TRANSITION_TABLE=function(){const e=new a(4095),t=Array.apply(null,Array(256)).map(((e,t)=>t)),i=(e,i)=>t.slice(e,i),s=i(32,127),r=i(0,24);r.push(25),r.push.apply(r,i(28,32));const n=i(0,14);let o;for(o in e.setDefault(1,0),e.addMany(s,0,2,0),n)e.addMany([24,26,153,154],o,3,0),e.addMany(i(128,144),o,3,0),e.addMany(i(144,152),o,3,0),e.add(156,o,0,0),e.add(27,o,11,1),e.add(157,o,4,8),e.addMany([152,158,159],o,0,7),e.add(155,o,11,3),e.add(144,o,11,9);return e.addMany(r,0,3,0),e.addMany(r,1,3,1),e.add(127,1,0,1),e.addMany(r,8,0,8),e.addMany(r,3,3,3),e.add(127,3,0,3),e.addMany(r,4,3,4),e.add(127,4,0,4),e.addMany(r,6,3,6),e.addMany(r,5,3,5),e.add(127,5,0,5),e.addMany(r,2,3,2),e.add(127,2,0,2),e.add(93,1,4,8),e.addMany(s,8,5,8),e.add(127,8,5,8),e.addMany([156,27,24,26,7],8,6,0),e.addMany(i(28,32),8,0,8),e.addMany([88,94,95],1,0,7),e.addMany(s,7,0,7),e.addMany(r,7,0,7),e.add(156,7,0,0),e.add(127,7,0,7),e.add(91,1,11,3),e.addMany(i(64,127),3,7,0),e.addMany(i(48,60),3,8,4),e.addMany([60,61,62,63],3,9,4),e.addMany(i(48,60),4,8,4),e.addMany(i(64,127),4,7,0),e.addMany([60,61,62,63],4,0,6),e.addMany(i(32,64),6,0,6),e.add(127,6,0,6),e.addMany(i(64,127),6,0,0),e.addMany(i(32,48),3,9,5),e.addMany(i(32,48),5,9,5),e.addMany(i(48,64),5,0,6),e.addMany(i(64,127),5,7,0),e.addMany(i(32,48),4,9,5),e.addMany(i(32,48),1,9,2),e.addMany(i(32,48),2,9,2),e.addMany(i(48,127),2,10,0),e.addMany(i(48,80),1,10,0),e.addMany(i(81,88),1,10,0),e.addMany([89,90,92],1,10,0),e.addMany(i(96,127),1,10,0),e.add(80,1,11,9),e.addMany(r,9,0,9),e.add(127,9,0,9),e.addMany(i(28,32),9,0,9),e.addMany(i(32,48),9,9,12),e.addMany(i(48,60),9,8,10),e.addMany([60,61,62,63],9,9,10),e.addMany(r,11,0,11),e.addMany(i(32,128),11,0,11),e.addMany(i(28,32),11,0,11),e.addMany(r,10,0,10),e.add(127,10,0,10),e.addMany(i(28,32),10,0,10),e.addMany(i(48,60),10,8,10),e.addMany([60,61,62,63],10,0,11),e.addMany(i(32,48),10,9,12),e.addMany(r,12,0,12),e.add(127,12,0,12),e.addMany(i(28,32),12,0,12),e.addMany(i(32,48),12,9,12),e.addMany(i(48,64),12,0,11),e.addMany(i(64,127),12,12,13),e.addMany(i(64,127),10,12,13),e.addMany(i(64,127),9,12,13),e.addMany(r,13,13,13),e.addMany(s,13,13,13),e.add(127,13,0,13),e.addMany([27,156,24,26],13,14,0),e.add(h,0,2,0),e.add(h,8,5,8),e.add(h,6,0,6),e.add(h,11,0,11),e.add(h,13,13,13),e}();class c extends s.Disposable{constructor(e=t.VT500_TRANSITION_TABLE){super(),this._transitions=e,this._parseStack={state:0,handlers:[],handlerPos:0,transition:0,chunkPos:0},this.initialState=0,this.currentState=this.initialState,this._params=new r.Params,this._params.addParam(0),this._collect=0,this.precedingCodepoint=0,this._printHandlerFb=(e,t,i)=>{},this._executeHandlerFb=e=>{},this._csiHandlerFb=(e,t)=>{},this._escHandlerFb=e=>{},this._errorHandlerFb=e=>e,this._printHandler=this._printHandlerFb,this._executeHandlers=Object.create(null),this._csiHandlers=Object.create(null),this._escHandlers=Object.create(null),this.register((0,s.toDisposable)((()=>{this._csiHandlers=Object.create(null),this._executeHandlers=Object.create(null),this._escHandlers=Object.create(null)}))),this._oscParser=this.register(new n.OscParser),this._dcsParser=this.register(new o.DcsParser),this._errorHandler=this._errorHandlerFb,this.registerEscHandler({final:"\\"},(()=>!0))}_identifier(e,t=[64,126]){let i=0;if(e.prefix){if(e.prefix.length>1)throw new Error("only one byte as prefix supported");if(i=e.prefix.charCodeAt(0),i&&60>i||i>63)throw new Error("prefix must be in range 0x3c .. 0x3f")}if(e.intermediates){if(e.intermediates.length>2)throw new Error("only two bytes as intermediates are supported");for(let t=0;t<e.intermediates.length;++t){const s=e.intermediates.charCodeAt(t);if(32>s||s>47)throw new Error("intermediate must be in range 0x20 .. 0x2f");i<<=8,i|=s}}if(1!==e.final.length)throw new Error("final must be a single byte");const s=e.final.charCodeAt(0);if(t[0]>s||s>t[1])throw new Error(`final must be in range ${t[0]} .. ${t[1]}`);return i<<=8,i|=s,i}identToString(e){const t=[];for(;e;)t.push(String.fromCharCode(255&e)),e>>=8;return t.reverse().join("")}setPrintHandler(e){this._printHandler=e}clearPrintHandler(){this._printHandler=this._printHandlerFb}registerEscHandler(e,t){const i=this._identifier(e,[48,126]);void 0===this._escHandlers[i]&&(this._escHandlers[i]=[]);const s=this._escHandlers[i];return s.push(t),{dispose:()=>{const e=s.indexOf(t);-1!==e&&s.splice(e,1)}}}clearEscHandler(e){this._escHandlers[this._identifier(e,[48,126])]&&delete this._escHandlers[this._identifier(e,[48,126])]}setEscHandlerFallback(e){this._escHandlerFb=e}setExecuteHandler(e,t){this._executeHandlers[e.charCodeAt(0)]=t}clearExecuteHandler(e){this._executeHandlers[e.charCodeAt(0)]&&delete this._executeHandlers[e.charCodeAt(0)]}setExecuteHandlerFallback(e){this._executeHandlerFb=e}registerCsiHandler(e,t){const i=this._identifier(e);void 0===this._csiHandlers[i]&&(this._csiHandlers[i]=[]);const s=this._csiHandlers[i];return s.push(t),{dispose:()=>{const e=s.indexOf(t);-1!==e&&s.splice(e,1)}}}clearCsiHandler(e){this._csiHandlers[this._identifier(e)]&&delete this._csiHandlers[this._identifier(e)]}setCsiHandlerFallback(e){this._csiHandlerFb=e}registerDcsHandler(e,t){return this._dcsParser.registerHandler(this._identifier(e),t)}clearDcsHandler(e){this._dcsParser.clearHandler(this._identifier(e))}setDcsHandlerFallback(e){this._dcsParser.setHandlerFallback(e)}registerOscHandler(e,t){return this._oscParser.registerHandler(e,t)}clearOscHandler(e){this._oscParser.clearHandler(e)}setOscHandlerFallback(e){this._oscParser.setHandlerFallback(e)}setErrorHandler(e){this._errorHandler=e}clearErrorHandler(){this._errorHandler=this._errorHandlerFb}reset(){this.currentState=this.initialState,this._oscParser.reset(),this._dcsParser.reset(),this._params.reset(),this._params.addParam(0),this._collect=0,this.precedingCodepoint=0,0!==this._parseStack.state&&(this._parseStack.state=2,this._parseStack.handlers=[])}_preserveStack(e,t,i,s,r){this._parseStack.state=e,this._parseStack.handlers=t,this._parseStack.handlerPos=i,this._parseStack.transition=s,this._parseStack.chunkPos=r}parse(e,t,i){let s,r=0,n=0,o=0;if(this._parseStack.state)if(2===this._parseStack.state)this._parseStack.state=0,o=this._parseStack.chunkPos+1;else{if(void 0===i||1===this._parseStack.state)throw this._parseStack.state=1,new Error("improper continuation due to previous async handler, giving up parsing");const t=this._parseStack.handlers;let n=this._parseStack.handlerPos-1;switch(this._parseStack.state){case 3:if(!1===i&&n>-1)for(;n>=0&&(s=t[n](this._params),!0!==s);n--)if(s instanceof Promise)return this._parseStack.handlerPos=n,s;this._parseStack.handlers=[];break;case 4:if(!1===i&&n>-1)for(;n>=0&&(s=t[n](),!0!==s);n--)if(s instanceof Promise)return this._parseStack.handlerPos=n,s;this._parseStack.handlers=[];break;case 6:if(r=e[this._parseStack.chunkPos],s=this._dcsParser.unhook(24!==r&&26!==r,i),s)return s;27===r&&(this._parseStack.transition|=1),this._params.reset(),this._params.addParam(0),this._collect=0;break;case 5:if(r=e[this._parseStack.chunkPos],s=this._oscParser.end(24!==r&&26!==r,i),s)return s;27===r&&(this._parseStack.transition|=1),this._params.reset(),this._params.addParam(0),this._collect=0}this._parseStack.state=0,o=this._parseStack.chunkPos+1,this.precedingCodepoint=0,this.currentState=15&this._parseStack.transition}for(let i=o;i<t;++i){switch(r=e[i],n=this._transitions.table[this.currentState<<8|(r<160?r:h)],n>>4){case 2:for(let s=i+1;;++s){if(s>=t||(r=e[s])<32||r>126&&r<h){this._printHandler(e,i,s),i=s-1;break}if(++s>=t||(r=e[s])<32||r>126&&r<h){this._printHandler(e,i,s),i=s-1;break}if(++s>=t||(r=e[s])<32||r>126&&r<h){this._printHandler(e,i,s),i=s-1;break}if(++s>=t||(r=e[s])<32||r>126&&r<h){this._printHandler(e,i,s),i=s-1;break}}break;case 3:this._executeHandlers[r]?this._executeHandlers[r]():this._executeHandlerFb(r),this.precedingCodepoint=0;break;case 0:break;case 1:if(this._errorHandler({position:i,code:r,currentState:this.currentState,collect:this._collect,params:this._params,abort:!1}).abort)return;break;case 7:const o=this._csiHandlers[this._collect<<8|r];let a=o?o.length-1:-1;for(;a>=0&&(s=o[a](this._params),!0!==s);a--)if(s instanceof Promise)return this._preserveStack(3,o,a,n,i),s;a<0&&this._csiHandlerFb(this._collect<<8|r,this._params),this.precedingCodepoint=0;break;case 8:do{switch(r){case 59:this._params.addParam(0);break;case 58:this._params.addSubParam(-1);break;default:this._params.addDigit(r-48)}}while(++i<t&&(r=e[i])>47&&r<60);i--;break;case 9:this._collect<<=8,this._collect|=r;break;case 10:const c=this._escHandlers[this._collect<<8|r];let l=c?c.length-1:-1;for(;l>=0&&(s=c[l](),!0!==s);l--)if(s instanceof Promise)return this._preserveStack(4,c,l,n,i),s;l<0&&this._escHandlerFb(this._collect<<8|r),this.precedingCodepoint=0;break;case 11:this._params.reset(),this._params.addParam(0),this._collect=0;break;case 12:this._dcsParser.hook(this._collect<<8|r,this._params);break;case 13:for(let s=i+1;;++s)if(s>=t||24===(r=e[s])||26===r||27===r||r>127&&r<h){this._dcsParser.put(e,i,s),i=s-1;break}break;case 14:if(s=this._dcsParser.unhook(24!==r&&26!==r),s)return this._preserveStack(6,[],0,n,i),s;27===r&&(n|=1),this._params.reset(),this._params.addParam(0),this._collect=0,this.precedingCodepoint=0;break;case 4:this._oscParser.start();break;case 5:for(let s=i+1;;s++)if(s>=t||(r=e[s])<32||r>127&&r<h){this._oscParser.put(e,i,s),i=s-1;break}break;case 6:if(s=this._oscParser.end(24!==r&&26!==r),s)return this._preserveStack(5,[],0,n,i),s;27===r&&(n|=1),this._params.reset(),this._params.addParam(0),this._collect=0,this.precedingCodepoint=0}this.currentState=15&n}}}t.EscapeSequenceParser=c},6242:(e,t,i)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.OscHandler=t.OscParser=void 0;const s=i(5770),r=i(482),n=[];t.OscParser=class{constructor(){this._state=0,this._active=n,this._id=-1,this._handlers=Object.create(null),this._handlerFb=()=>{},this._stack={paused:!1,loopPosition:0,fallThrough:!1}}registerHandler(e,t){void 0===this._handlers[e]&&(this._handlers[e]=[]);const i=this._handlers[e];return i.push(t),{dispose:()=>{const e=i.indexOf(t);-1!==e&&i.splice(e,1)}}}clearHandler(e){this._handlers[e]&&delete this._handlers[e]}setHandlerFallback(e){this._handlerFb=e}dispose(){this._handlers=Object.create(null),this._handlerFb=()=>{},this._active=n}reset(){if(2===this._state)for(let e=this._stack.paused?this._stack.loopPosition-1:this._active.length-1;e>=0;--e)this._active[e].end(!1);this._stack.paused=!1,this._active=n,this._id=-1,this._state=0}_start(){if(this._active=this._handlers[this._id]||n,this._active.length)for(let e=this._active.length-1;e>=0;e--)this._active[e].start();else this._handlerFb(this._id,"START")}_put(e,t,i){if(this._active.length)for(let s=this._active.length-1;s>=0;s--)this._active[s].put(e,t,i);else this._handlerFb(this._id,"PUT",(0,r.utf32ToString)(e,t,i))}start(){this.reset(),this._state=1}put(e,t,i){if(3!==this._state){if(1===this._state)for(;t<i;){const i=e[t++];if(59===i){this._state=2,this._start();break}if(i<48||57<i)return void(this._state=3);-1===this._id&&(this._id=0),this._id=10*this._id+i-48}2===this._state&&i-t>0&&this._put(e,t,i)}}end(e,t=!0){if(0!==this._state){if(3!==this._state)if(1===this._state&&this._start(),this._active.length){let i=!1,s=this._active.length-1,r=!1;if(this._stack.paused&&(s=this._stack.loopPosition-1,i=t,r=this._stack.fallThrough,this._stack.paused=!1),!r&&!1===i){for(;s>=0&&(i=this._active[s].end(e),!0!==i);s--)if(i instanceof Promise)return this._stack.paused=!0,this._stack.loopPosition=s,this._stack.fallThrough=!1,i;s--}for(;s>=0;s--)if(i=this._active[s].end(!1),i instanceof Promise)return this._stack.paused=!0,this._stack.loopPosition=s,this._stack.fallThrough=!0,i}else this._handlerFb(this._id,"END",e);this._active=n,this._id=-1,this._state=0}}},t.OscHandler=class{constructor(e){this._handler=e,this._data="",this._hitLimit=!1}start(){this._data="",this._hitLimit=!1}put(e,t,i){this._hitLimit||(this._data+=(0,r.utf32ToString)(e,t,i),this._data.length>s.PAYLOAD_LIMIT&&(this._data="",this._hitLimit=!0))}end(e){let t=!1;if(this._hitLimit)t=!1;else if(e&&(t=this._handler(this._data),t instanceof Promise))return t.then((e=>(this._data="",this._hitLimit=!1,e)));return this._data="",this._hitLimit=!1,t}}},8742:(e,t)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.Params=void 0;const i=2147483647;class s{static fromArray(e){const t=new s;if(!e.length)return t;for(let i=Array.isArray(e[0])?1:0;i<e.length;++i){const s=e[i];if(Array.isArray(s))for(let e=0;e<s.length;++e)t.addSubParam(s[e]);else t.addParam(s)}return t}constructor(e=32,t=32){if(this.maxLength=e,this.maxSubParamsLength=t,t>256)throw new Error("maxSubParamsLength must not be greater than 256");this.params=new Int32Array(e),this.length=0,this._subParams=new Int32Array(t),this._subParamsLength=0,this._subParamsIdx=new Uint16Array(e),this._rejectDigits=!1,this._rejectSubDigits=!1,this._digitIsSub=!1}clone(){const e=new s(this.maxLength,this.maxSubParamsLength);return e.params.set(this.params),e.length=this.length,e._subParams.set(this._subParams),e._subParamsLength=this._subParamsLength,e._subParamsIdx.set(this._subParamsIdx),e._rejectDigits=this._rejectDigits,e._rejectSubDigits=this._rejectSubDigits,e._digitIsSub=this._digitIsSub,e}toArray(){const e=[];for(let t=0;t<this.length;++t){e.push(this.params[t]);const i=this._subParamsIdx[t]>>8,s=255&this._subParamsIdx[t];s-i>0&&e.push(Array.prototype.slice.call(this._subParams,i,s))}return e}reset(){this.length=0,this._subParamsLength=0,this._rejectDigits=!1,this._rejectSubDigits=!1,this._digitIsSub=!1}addParam(e){if(this._digitIsSub=!1,this.length>=this.maxLength)this._rejectDigits=!0;else{if(e<-1)throw new Error("values lesser than -1 are not allowed");this._subParamsIdx[this.length]=this._subParamsLength<<8|this._subParamsLength,this.params[this.length++]=e>i?i:e}}addSubParam(e){if(this._digitIsSub=!0,this.length)if(this._rejectDigits||this._subParamsLength>=this.maxSubParamsLength)this._rejectSubDigits=!0;else{if(e<-1)throw new Error("values lesser than -1 are not allowed");this._subParams[this._subParamsLength++]=e>i?i:e,this._subParamsIdx[this.length-1]++}}hasSubParams(e){return(255&this._subParamsIdx[e])-(this._subParamsIdx[e]>>8)>0}getSubParams(e){const t=this._subParamsIdx[e]>>8,i=255&this._subParamsIdx[e];return i-t>0?this._subParams.subarray(t,i):null}getSubParamsAll(){const e={};for(let t=0;t<this.length;++t){const i=this._subParamsIdx[t]>>8,s=255&this._subParamsIdx[t];s-i>0&&(e[t]=this._subParams.slice(i,s))}return e}addDigit(e){let t;if(this._rejectDigits||!(t=this._digitIsSub?this._subParamsLength:this.length)||this._digitIsSub&&this._rejectSubDigits)return;const s=this._digitIsSub?this._subParams:this.params,r=s[t-1];s[t-1]=~r?Math.min(10*r+e,i):e}}t.Params=s},5741:(e,t)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.AddonManager=void 0,t.AddonManager=class{constructor(){this._addons=[]}dispose(){for(let e=this._addons.length-1;e>=0;e--)this._addons[e].instance.dispose()}loadAddon(e,t){const i={instance:t,dispose:t.dispose,isDisposed:!1};this._addons.push(i),t.dispose=()=>this._wrappedAddonDispose(i),t.activate(e)}_wrappedAddonDispose(e){if(e.isDisposed)return;let t=-1;for(let i=0;i<this._addons.length;i++)if(this._addons[i]===e){t=i;break}if(-1===t)throw new Error("Could not dispose an addon that has not been loaded");e.isDisposed=!0,e.dispose.apply(e.instance),this._addons.splice(t,1)}}},8771:(e,t,i)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.BufferApiView=void 0;const s=i(3785),r=i(511);t.BufferApiView=class{constructor(e,t){this._buffer=e,this.type=t}init(e){return this._buffer=e,this}get cursorY(){return this._buffer.y}get cursorX(){return this._buffer.x}get viewportY(){return this._buffer.ydisp}get baseY(){return this._buffer.ybase}get length(){return this._buffer.lines.length}getLine(e){const t=this._buffer.lines.get(e);if(t)return new s.BufferLineApiView(t)}getNullCell(){return new r.CellData}}},3785:(e,t,i)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.BufferLineApiView=void 0;const s=i(511);t.BufferLineApiView=class{constructor(e){this._line=e}get isWrapped(){return this._line.isWrapped}get length(){return this._line.length}getCell(e,t){if(!(e<0||e>=this._line.length))return t?(this._line.loadCell(e,t),t):this._line.loadCell(e,new s.CellData)}translateToString(e,t,i){return this._line.translateToString(e,t,i)}}},8285:(e,t,i)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.BufferNamespaceApi=void 0;const s=i(8771),r=i(8460),n=i(844);class o extends n.Disposable{constructor(e){super(),this._core=e,this._onBufferChange=this.register(new r.EventEmitter),this.onBufferChange=this._onBufferChange.event,this._normal=new s.BufferApiView(this._core.buffers.normal,"normal"),this._alternate=new s.BufferApiView(this._core.buffers.alt,"alternate"),this._core.buffers.onBufferActivate((()=>this._onBufferChange.fire(this.active)))}get active(){if(this._core.buffers.active===this._core.buffers.normal)return this.normal;if(this._core.buffers.active===this._core.buffers.alt)return this.alternate;throw new Error("Active buffer is neither normal nor alternate")}get normal(){return this._normal.init(this._core.buffers.normal)}get alternate(){return this._alternate.init(this._core.buffers.alt)}}t.BufferNamespaceApi=o},7975:(e,t)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.ParserApi=void 0,t.ParserApi=class{constructor(e){this._core=e}registerCsiHandler(e,t){return this._core.registerCsiHandler(e,(e=>t(e.toArray())))}addCsiHandler(e,t){return this.registerCsiHandler(e,t)}registerDcsHandler(e,t){return this._core.registerDcsHandler(e,((e,i)=>t(e,i.toArray())))}addDcsHandler(e,t){return this.registerDcsHandler(e,t)}registerEscHandler(e,t){return this._core.registerEscHandler(e,t)}addEscHandler(e,t){return this.registerEscHandler(e,t)}registerOscHandler(e,t){return this._core.registerOscHandler(e,t)}addOscHandler(e,t){return this.registerOscHandler(e,t)}}},7090:(e,t)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.UnicodeApi=void 0,t.UnicodeApi=class{constructor(e){this._core=e}register(e){this._core.unicodeService.register(e)}get versions(){return this._core.unicodeService.versions}get activeVersion(){return this._core.unicodeService.activeVersion}set activeVersion(e){this._core.unicodeService.activeVersion=e}}},744:function(e,t,i){var s=this&&this.__decorate||function(e,t,i,s){var r,n=arguments.length,o=n<3?t:null===s?s=Object.getOwnPropertyDescriptor(t,i):s;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)o=Reflect.decorate(e,t,i,s);else for(var a=e.length-1;a>=0;a--)(r=e[a])&&(o=(n<3?r(o):n>3?r(t,i,o):r(t,i))||o);return n>3&&o&&Object.defineProperty(t,i,o),o},r=this&&this.__param||function(e,t){return function(i,s){t(i,s,e)}};Object.defineProperty(t,"__esModule",{value:!0}),t.BufferService=t.MINIMUM_ROWS=t.MINIMUM_COLS=void 0;const n=i(8460),o=i(844),a=i(5295),h=i(2585);t.MINIMUM_COLS=2,t.MINIMUM_ROWS=1;let c=t.BufferService=class extends o.Disposable{get buffer(){return this.buffers.active}constructor(e){super(),this.isUserScrolling=!1,this._onResize=this.register(new n.EventEmitter),this.onResize=this._onResize.event,this._onScroll=this.register(new n.EventEmitter),this.onScroll=this._onScroll.event,this.cols=Math.max(e.rawOptions.cols||0,t.MINIMUM_COLS),this.rows=Math.max(e.rawOptions.rows||0,t.MINIMUM_ROWS),this.buffers=this.register(new a.BufferSet(e,this))}resize(e,t){this.cols=e,this.rows=t,this.buffers.resize(e,t),this._onResize.fire({cols:e,rows:t})}reset(){this.buffers.reset(),this.isUserScrolling=!1}scroll(e,t=!1){const i=this.buffer;let s;s=this._cachedBlankLine,s&&s.length===this.cols&&s.getFg(0)===e.fg&&s.getBg(0)===e.bg||(s=i.getBlankLine(e,t),this._cachedBlankLine=s),s.isWrapped=t;const r=i.ybase+i.scrollTop,n=i.ybase+i.scrollBottom;if(0===i.scrollTop){const e=i.lines.isFull;n===i.lines.length-1?e?i.lines.recycle().copyFrom(s):i.lines.push(s.clone()):i.lines.splice(n+1,0,s.clone()),e?this.isUserScrolling&&(i.ydisp=Math.max(i.ydisp-1,0)):(i.ybase++,this.isUserScrolling||i.ydisp++)}else{const e=n-r+1;i.lines.shiftElements(r+1,e-1,-1),i.lines.set(n,s.clone())}this.isUserScrolling||(i.ydisp=i.ybase),this._onScroll.fire(i.ydisp)}scrollLines(e,t,i){const s=this.buffer;if(e<0){if(0===s.ydisp)return;this.isUserScrolling=!0}else e+s.ydisp>=s.ybase&&(this.isUserScrolling=!1);const r=s.ydisp;s.ydisp=Math.max(Math.min(s.ydisp+e,s.ybase),0),r!==s.ydisp&&(t||this._onScroll.fire(s.ydisp))}};t.BufferService=c=s([r(0,h.IOptionsService)],c)},7994:(e,t)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.CharsetService=void 0,t.CharsetService=class{constructor(){this.glevel=0,this._charsets=[]}reset(){this.charset=void 0,this._charsets=[],this.glevel=0}setgLevel(e){this.glevel=e,this.charset=this._charsets[e]}setgCharset(e,t){this._charsets[e]=t,this.glevel===e&&(this.charset=t)}}},1753:function(e,t,i){var s=this&&this.__decorate||function(e,t,i,s){var r,n=arguments.length,o=n<3?t:null===s?s=Object.getOwnPropertyDescriptor(t,i):s;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)o=Reflect.decorate(e,t,i,s);else for(var a=e.length-1;a>=0;a--)(r=e[a])&&(o=(n<3?r(o):n>3?r(t,i,o):r(t,i))||o);return n>3&&o&&Object.defineProperty(t,i,o),o},r=this&&this.__param||function(e,t){return function(i,s){t(i,s,e)}};Object.defineProperty(t,"__esModule",{value:!0}),t.CoreMouseService=void 0;const n=i(2585),o=i(8460),a=i(844),h={NONE:{events:0,restrict:()=>!1},X10:{events:1,restrict:e=>4!==e.button&&1===e.action&&(e.ctrl=!1,e.alt=!1,e.shift=!1,!0)},VT200:{events:19,restrict:e=>32!==e.action},DRAG:{events:23,restrict:e=>32!==e.action||3!==e.button},ANY:{events:31,restrict:e=>!0}};function c(e,t){let i=(e.ctrl?16:0)|(e.shift?4:0)|(e.alt?8:0);return 4===e.button?(i|=64,i|=e.action):(i|=3&e.button,4&e.button&&(i|=64),8&e.button&&(i|=128),32===e.action?i|=32:0!==e.action||t||(i|=3)),i}const l=String.fromCharCode,d={DEFAULT:e=>{const t=[c(e,!1)+32,e.col+32,e.row+32];return t[0]>255||t[1]>255||t[2]>255?"":`[M${l(t[0])}${l(t[1])}${l(t[2])}`},SGR:e=>{const t=0===e.action&&4!==e.button?"m":"M";return`[<${c(e,!0)};${e.col};${e.row}${t}`},SGR_PIXELS:e=>{const t=0===e.action&&4!==e.button?"m":"M";return`[<${c(e,!0)};${e.x};${e.y}${t}`}};let _=t.CoreMouseService=class extends a.Disposable{constructor(e,t){super(),this._bufferService=e,this._coreService=t,this._protocols={},this._encodings={},this._activeProtocol="",this._activeEncoding="",this._lastEvent=null,this._onProtocolChange=this.register(new o.EventEmitter),this.onProtocolChange=this._onProtocolChange.event;for(const e of Object.keys(h))this.addProtocol(e,h[e]);for(const e of Object.keys(d))this.addEncoding(e,d[e]);this.reset()}addProtocol(e,t){this._protocols[e]=t}addEncoding(e,t){this._encodings[e]=t}get activeProtocol(){return this._activeProtocol}get areMouseEventsActive(){return 0!==this._protocols[this._activeProtocol].events}set activeProtocol(e){if(!this._protocols[e])throw new Error(`unknown protocol "${e}"`);this._activeProtocol=e,this._onProtocolChange.fire(this._protocols[e].events)}get activeEncoding(){return this._activeEncoding}set activeEncoding(e){if(!this._encodings[e])throw new Error(`unknown encoding "${e}"`);this._activeEncoding=e}reset(){this.activeProtocol="NONE",this.activeEncoding="DEFAULT",this._lastEvent=null}triggerMouseEvent(e){if(e.col<0||e.col>=this._bufferService.cols||e.row<0||e.row>=this._bufferService.rows)return!1;if(4===e.button&&32===e.action)return!1;if(3===e.button&&32!==e.action)return!1;if(4!==e.button&&(2===e.action||3===e.action))return!1;if(e.col++,e.row++,32===e.action&&this._lastEvent&&this._equalEvents(this._lastEvent,e,"SGR_PIXELS"===this._activeEncoding))return!1;if(!this._protocols[this._activeProtocol].restrict(e))return!1;const t=this._encodings[this._activeEncoding](e);return t&&("DEFAULT"===this._activeEncoding?this._coreService.triggerBinaryEvent(t):this._coreService.triggerDataEvent(t,!0)),this._lastEvent=e,!0}explainEvents(e){return{down:!!(1&e),up:!!(2&e),drag:!!(4&e),move:!!(8&e),wheel:!!(16&e)}}_equalEvents(e,t,i){if(i){if(e.x!==t.x)return!1;if(e.y!==t.y)return!1}else{if(e.col!==t.col)return!1;if(e.row!==t.row)return!1}return e.button===t.button&&e.action===t.action&&e.ctrl===t.ctrl&&e.alt===t.alt&&e.shift===t.shift}};t.CoreMouseService=_=s([r(0,n.IBufferService),r(1,n.ICoreService)],_)},6975:function(e,t,i){var s=this&&this.__decorate||function(e,t,i,s){var r,n=arguments.length,o=n<3?t:null===s?s=Object.getOwnPropertyDescriptor(t,i):s;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)o=Reflect.decorate(e,t,i,s);else for(var a=e.length-1;a>=0;a--)(r=e[a])&&(o=(n<3?r(o):n>3?r(t,i,o):r(t,i))||o);return n>3&&o&&Object.defineProperty(t,i,o),o},r=this&&this.__param||function(e,t){return function(i,s){t(i,s,e)}};Object.defineProperty(t,"__esModule",{value:!0}),t.CoreService=void 0;const n=i(1439),o=i(8460),a=i(844),h=i(2585),c=Object.freeze({insertMode:!1}),l=Object.freeze({applicationCursorKeys:!1,applicationKeypad:!1,bracketedPasteMode:!1,origin:!1,reverseWraparound:!1,sendFocus:!1,wraparound:!0});let d=t.CoreService=class extends a.Disposable{constructor(e,t,i){super(),this._bufferService=e,this._logService=t,this._optionsService=i,this.isCursorInitialized=!1,this.isCursorHidden=!1,this._onData=this.register(new o.EventEmitter),this.onData=this._onData.event,this._onUserInput=this.register(new o.EventEmitter),this.onUserInput=this._onUserInput.event,this._onBinary=this.register(new o.EventEmitter),this.onBinary=this._onBinary.event,this._onRequestScrollToBottom=this.register(new o.EventEmitter),this.onRequestScrollToBottom=this._onRequestScrollToBottom.event,this.modes=(0,n.clone)(c),this.decPrivateModes=(0,n.clone)(l)}reset(){this.modes=(0,n.clone)(c),this.decPrivateModes=(0,n.clone)(l)}triggerDataEvent(e,t=!1){if(this._optionsService.rawOptions.disableStdin)return;const i=this._bufferService.buffer;t&&this._optionsService.rawOptions.scrollOnUserInput&&i.ybase!==i.ydisp&&this._onRequestScrollToBottom.fire(),t&&this._onUserInput.fire(),this._logService.debug(`sending data "${e}"`,(()=>e.split("").map((e=>e.charCodeAt(0))))),this._onData.fire(e)}triggerBinaryEvent(e){this._optionsService.rawOptions.disableStdin||(this._logService.debug(`sending binary "${e}"`,(()=>e.split("").map((e=>e.charCodeAt(0))))),this._onBinary.fire(e))}};t.CoreService=d=s([r(0,h.IBufferService),r(1,h.ILogService),r(2,h.IOptionsService)],d)},9074:(e,t,i)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.DecorationService=void 0;const s=i(8055),r=i(8460),n=i(844),o=i(6106);let a=0,h=0;class c extends n.Disposable{get decorations(){return this._decorations.values()}constructor(){super(),this._decorations=new o.SortedList((e=>null==e?void 0:e.marker.line)),this._onDecorationRegistered=this.register(new r.EventEmitter),this.onDecorationRegistered=this._onDecorationRegistered.event,this._onDecorationRemoved=this.register(new r.EventEmitter),this.onDecorationRemoved=this._onDecorationRemoved.event,this.register((0,n.toDisposable)((()=>this.reset())))}registerDecoration(e){if(e.marker.isDisposed)return;const t=new l(e);if(t){const e=t.marker.onDispose((()=>t.dispose()));t.onDispose((()=>{t&&(this._decorations.delete(t)&&this._onDecorationRemoved.fire(t),e.dispose())})),this._decorations.insert(t),this._onDecorationRegistered.fire(t)}return t}reset(){for(const e of this._decorations.values())e.dispose();this._decorations.clear()}*getDecorationsAtCell(e,t,i){var s,r,n;let o=0,a=0;for(const h of this._decorations.getKeyIterator(t))o=null!==(s=h.options.x)&&void 0!==s?s:0,a=o+(null!==(r=h.options.width)&&void 0!==r?r:1),e>=o&&e<a&&(!i||(null!==(n=h.options.layer)&&void 0!==n?n:"bottom")===i)&&(yield h)}forEachDecorationAtCell(e,t,i,s){this._decorations.forEachByKey(t,(t=>{var r,n,o;a=null!==(r=t.options.x)&&void 0!==r?r:0,h=a+(null!==(n=t.options.width)&&void 0!==n?n:1),e>=a&&e<h&&(!i||(null!==(o=t.options.layer)&&void 0!==o?o:"bottom")===i)&&s(t)}))}}t.DecorationService=c;class l extends n.Disposable{get isDisposed(){return this._isDisposed}get backgroundColorRGB(){return null===this._cachedBg&&(this.options.backgroundColor?this._cachedBg=s.css.toColor(this.options.backgroundColor):this._cachedBg=void 0),this._cachedBg}get foregroundColorRGB(){return null===this._cachedFg&&(this.options.foregroundColor?this._cachedFg=s.css.toColor(this.options.foregroundColor):this._cachedFg=void 0),this._cachedFg}constructor(e){super(),this.options=e,this.onRenderEmitter=this.register(new r.EventEmitter),this.onRender=this.onRenderEmitter.event,this._onDispose=this.register(new r.EventEmitter),this.onDispose=this._onDispose.event,this._cachedBg=null,this._cachedFg=null,this.marker=e.marker,this.options.overviewRulerOptions&&!this.options.overviewRulerOptions.position&&(this.options.overviewRulerOptions.position="full")}dispose(){this._onDispose.fire(),super.dispose()}}},4348:(e,t,i)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.InstantiationService=t.ServiceCollection=void 0;const s=i(2585),r=i(8343);class n{constructor(...e){this._entries=new Map;for(const[t,i]of e)this.set(t,i)}set(e,t){const i=this._entries.get(e);return this._entries.set(e,t),i}forEach(e){for(const[t,i]of this._entries.entries())e(t,i)}has(e){return this._entries.has(e)}get(e){return this._entries.get(e)}}t.ServiceCollection=n,t.InstantiationService=class{constructor(){this._services=new n,this._services.set(s.IInstantiationService,this)}setService(e,t){this._services.set(e,t)}getService(e){return this._services.get(e)}createInstance(e,...t){const i=(0,r.getServiceDependencies)(e).sort(((e,t)=>e.index-t.index)),s=[];for(const t of i){const i=this._services.get(t.id);if(!i)throw new Error(`[createInstance] ${e.name} depends on UNKNOWN service ${t.id}.`);s.push(i)}const n=i.length>0?i[0].index:t.length;if(t.length!==n)throw new Error(`[createInstance] First service dependency of ${e.name} at position ${n+1} conflicts with ${t.length} static arguments`);return new e(...[...t,...s])}}},7866:function(e,t,i){var s=this&&this.__decorate||function(e,t,i,s){var r,n=arguments.length,o=n<3?t:null===s?s=Object.getOwnPropertyDescriptor(t,i):s;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)o=Reflect.decorate(e,t,i,s);else for(var a=e.length-1;a>=0;a--)(r=e[a])&&(o=(n<3?r(o):n>3?r(t,i,o):r(t,i))||o);return n>3&&o&&Object.defineProperty(t,i,o),o},r=this&&this.__param||function(e,t){return function(i,s){t(i,s,e)}};Object.defineProperty(t,"__esModule",{value:!0}),t.traceCall=t.setTraceLogger=t.LogService=void 0;const n=i(844),o=i(2585),a={trace:o.LogLevelEnum.TRACE,debug:o.LogLevelEnum.DEBUG,info:o.LogLevelEnum.INFO,warn:o.LogLevelEnum.WARN,error:o.LogLevelEnum.ERROR,off:o.LogLevelEnum.OFF};let h,c=t.LogService=class extends n.Disposable{get logLevel(){return this._logLevel}constructor(e){super(),this._optionsService=e,this._logLevel=o.LogLevelEnum.OFF,this._updateLogLevel(),this.register(this._optionsService.onSpecificOptionChange("logLevel",(()=>this._updateLogLevel()))),h=this}_updateLogLevel(){this._logLevel=a[this._optionsService.rawOptions.logLevel]}_evalLazyOptionalParams(e){for(let t=0;t<e.length;t++)"function"==typeof e[t]&&(e[t]=e[t]())}_log(e,t,i){this._evalLazyOptionalParams(i),e.call(console,(this._optionsService.options.logger?"":"xterm.js: ")+t,...i)}trace(e,...t){var i,s;this._logLevel<=o.LogLevelEnum.TRACE&&this._log(null!==(s=null===(i=this._optionsService.options.logger)||void 0===i?void 0:i.trace.bind(this._optionsService.options.logger))&&void 0!==s?s:console.log,e,t)}debug(e,...t){var i,s;this._logLevel<=o.LogLevelEnum.DEBUG&&this._log(null!==(s=null===(i=this._optionsService.options.logger)||void 0===i?void 0:i.debug.bind(this._optionsService.options.logger))&&void 0!==s?s:console.log,e,t)}info(e,...t){var i,s;this._logLevel<=o.LogLevelEnum.INFO&&this._log(null!==(s=null===(i=this._optionsService.options.logger)||void 0===i?void 0:i.info.bind(this._optionsService.options.logger))&&void 0!==s?s:console.info,e,t)}warn(e,...t){var i,s;this._logLevel<=o.LogLevelEnum.WARN&&this._log(null!==(s=null===(i=this._optionsService.options.logger)||void 0===i?void 0:i.warn.bind(this._optionsService.options.logger))&&void 0!==s?s:console.warn,e,t)}error(e,...t){var i,s;this._logLevel<=o.LogLevelEnum.ERROR&&this._log(null!==(s=null===(i=this._optionsService.options.logger)||void 0===i?void 0:i.error.bind(this._optionsService.options.logger))&&void 0!==s?s:console.error,e,t)}};t.LogService=c=s([r(0,o.IOptionsService)],c),t.setTraceLogger=function(e){h=e},t.traceCall=function(e,t,i){if("function"!=typeof i.value)throw new Error("not supported");const s=i.value;i.value=function(...e){if(h.logLevel!==o.LogLevelEnum.TRACE)return s.apply(this,e);h.trace(`GlyphRenderer#${s.name}(${e.map((e=>JSON.stringify(e))).join(", ")})`);const t=s.apply(this,e);return h.trace(`GlyphRenderer#${s.name} return`,t),t}}},7302:(e,t,i)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.OptionsService=t.DEFAULT_OPTIONS=void 0;const s=i(8460),r=i(844),n=i(6114);t.DEFAULT_OPTIONS={cols:80,rows:24,cursorBlink:!1,cursorStyle:"block",cursorWidth:1,cursorInactiveStyle:"outline",customGlyphs:!0,drawBoldTextInBrightColors:!0,fastScrollModifier:"alt",fastScrollSensitivity:5,fontFamily:"courier-new, courier, monospace",fontSize:15,fontWeight:"normal",fontWeightBold:"bold",ignoreBracketedPasteMode:!1,lineHeight:1,letterSpacing:0,linkHandler:null,logLevel:"info",logger:null,scrollback:1e3,scrollOnUserInput:!0,scrollSensitivity:1,screenReaderMode:!1,smoothScrollDuration:0,macOptionIsMeta:!1,macOptionClickForcesSelection:!1,minimumContrastRatio:1,disableStdin:!1,allowProposedApi:!1,allowTransparency:!1,tabStopWidth:8,theme:{},rightClickSelectsWord:n.isMac,windowOptions:{},windowsMode:!1,windowsPty:{},wordSeparator:" ()[]{}',\"`",altClickMovesCursor:!0,convertEol:!1,termName:"xterm",cancelEvents:!1,overviewRulerWidth:0};const o=["normal","bold","100","200","300","400","500","600","700","800","900"];class a extends r.Disposable{constructor(e){super(),this._onOptionChange=this.register(new s.EventEmitter),this.onOptionChange=this._onOptionChange.event;const i=Object.assign({},t.DEFAULT_OPTIONS);for(const t in e)if(t in i)try{const s=e[t];i[t]=this._sanitizeAndValidateOption(t,s)}catch(e){console.error(e)}this.rawOptions=i,this.options=Object.assign({},i),this._setupOptions()}onSpecificOptionChange(e,t){return this.onOptionChange((i=>{i===e&&t(this.rawOptions[e])}))}onMultipleOptionChange(e,t){return this.onOptionChange((i=>{-1!==e.indexOf(i)&&t()}))}_setupOptions(){const e=e=>{if(!(e in t.DEFAULT_OPTIONS))throw new Error(`No option with key "${e}"`);return this.rawOptions[e]},i=(e,i)=>{if(!(e in t.DEFAULT_OPTIONS))throw new Error(`No option with key "${e}"`);i=this._sanitizeAndValidateOption(e,i),this.rawOptions[e]!==i&&(this.rawOptions[e]=i,this._onOptionChange.fire(e))};for(const t in this.rawOptions){const s={get:e.bind(this,t),set:i.bind(this,t)};Object.defineProperty(this.options,t,s)}}_sanitizeAndValidateOption(e,i){switch(e){case"cursorStyle":if(i||(i=t.DEFAULT_OPTIONS[e]),!function(e){return"block"===e||"underline"===e||"bar"===e}(i))throw new Error(`"${i}" is not a valid value for ${e}`);break;case"wordSeparator":i||(i=t.DEFAULT_OPTIONS[e]);break;case"fontWeight":case"fontWeightBold":if("number"==typeof i&&1<=i&&i<=1e3)break;i=o.includes(i)?i:t.DEFAULT_OPTIONS[e];break;case"cursorWidth":i=Math.floor(i);case"lineHeight":case"tabStopWidth":if(i<1)throw new Error(`${e} cannot be less than 1, value: ${i}`);break;case"minimumContrastRatio":i=Math.max(1,Math.min(21,Math.round(10*i)/10));break;case"scrollback":if((i=Math.min(i,4294967295))<0)throw new Error(`${e} cannot be less than 0, value: ${i}`);break;case"fastScrollSensitivity":case"scrollSensitivity":if(i<=0)throw new Error(`${e} cannot be less than or equal to 0, value: ${i}`);break;case"rows":case"cols":if(!i&&0!==i)throw new Error(`${e} must be numeric, value: ${i}`);break;case"windowsPty":i=null!=i?i:{}}return i}}t.OptionsService=a},2660:function(e,t,i){var s=this&&this.__decorate||function(e,t,i,s){var r,n=arguments.length,o=n<3?t:null===s?s=Object.getOwnPropertyDescriptor(t,i):s;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)o=Reflect.decorate(e,t,i,s);else for(var a=e.length-1;a>=0;a--)(r=e[a])&&(o=(n<3?r(o):n>3?r(t,i,o):r(t,i))||o);return n>3&&o&&Object.defineProperty(t,i,o),o},r=this&&this.__param||function(e,t){return function(i,s){t(i,s,e)}};Object.defineProperty(t,"__esModule",{value:!0}),t.OscLinkService=void 0;const n=i(2585);let o=t.OscLinkService=class{constructor(e){this._bufferService=e,this._nextId=1,this._entriesWithId=new Map,this._dataByLinkId=new Map}registerLink(e){const t=this._bufferService.buffer;if(void 0===e.id){const i=t.addMarker(t.ybase+t.y),s={data:e,id:this._nextId++,lines:[i]};return i.onDispose((()=>this._removeMarkerFromLink(s,i))),this._dataByLinkId.set(s.id,s),s.id}const i=e,s=this._getEntryIdKey(i),r=this._entriesWithId.get(s);if(r)return this.addLineToLink(r.id,t.ybase+t.y),r.id;const n=t.addMarker(t.ybase+t.y),o={id:this._nextId++,key:this._getEntryIdKey(i),data:i,lines:[n]};return n.onDispose((()=>this._removeMarkerFromLink(o,n))),this._entriesWithId.set(o.key,o),this._dataByLinkId.set(o.id,o),o.id}addLineToLink(e,t){const i=this._dataByLinkId.get(e);if(i&&i.lines.every((e=>e.line!==t))){const e=this._bufferService.buffer.addMarker(t);i.lines.push(e),e.onDispose((()=>this._removeMarkerFromLink(i,e)))}}getLinkData(e){var t;return null===(t=this._dataByLinkId.get(e))||void 0===t?void 0:t.data}_getEntryIdKey(e){return`${e.id};;${e.uri}`}_removeMarkerFromLink(e,t){const i=e.lines.indexOf(t);-1!==i&&(e.lines.splice(i,1),0===e.lines.length&&(void 0!==e.data.id&&this._entriesWithId.delete(e.key),this._dataByLinkId.delete(e.id)))}};t.OscLinkService=o=s([r(0,n.IBufferService)],o)},8343:(e,t)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.createDecorator=t.getServiceDependencies=t.serviceRegistry=void 0;const i="di$target",s="di$dependencies";t.serviceRegistry=new Map,t.getServiceDependencies=function(e){return e[s]||[]},t.createDecorator=function(e){if(t.serviceRegistry.has(e))return t.serviceRegistry.get(e);const r=function(e,t,n){if(3!==arguments.length)throw new Error("@IServiceName-decorator can only be used to decorate a parameter");!function(e,t,r){t[i]===t?t[s].push({id:e,index:r}):(t[s]=[{id:e,index:r}],t[i]=t)}(r,e,n)};return r.toString=()=>e,t.serviceRegistry.set(e,r),r}},2585:(e,t,i)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.IDecorationService=t.IUnicodeService=t.IOscLinkService=t.IOptionsService=t.ILogService=t.LogLevelEnum=t.IInstantiationService=t.ICharsetService=t.ICoreService=t.ICoreMouseService=t.IBufferService=void 0;const s=i(8343);var r;t.IBufferService=(0,s.createDecorator)("BufferService"),t.ICoreMouseService=(0,s.createDecorator)("CoreMouseService"),t.ICoreService=(0,s.createDecorator)("CoreService"),t.ICharsetService=(0,s.createDecorator)("CharsetService"),t.IInstantiationService=(0,s.createDecorator)("InstantiationService"),function(e){e[e.TRACE=0]="TRACE",e[e.DEBUG=1]="DEBUG",e[e.INFO=2]="INFO",e[e.WARN=3]="WARN",e[e.ERROR=4]="ERROR",e[e.OFF=5]="OFF"}(r||(t.LogLevelEnum=r={})),t.ILogService=(0,s.createDecorator)("LogService"),t.IOptionsService=(0,s.createDecorator)("OptionsService"),t.IOscLinkService=(0,s.createDecorator)("OscLinkService"),t.IUnicodeService=(0,s.createDecorator)("UnicodeService"),t.IDecorationService=(0,s.createDecorator)("DecorationService")},1480:(e,t,i)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.UnicodeService=void 0;const s=i(8460),r=i(225);t.UnicodeService=class{constructor(){this._providers=Object.create(null),this._active="",this._onChange=new s.EventEmitter,this.onChange=this._onChange.event;const e=new r.UnicodeV6;this.register(e),this._active=e.version,this._activeProvider=e}dispose(){this._onChange.dispose()}get versions(){return Object.keys(this._providers)}get activeVersion(){return this._active}set activeVersion(e){if(!this._providers[e])throw new Error(`unknown Unicode version "${e}"`);this._active=e,this._activeProvider=this._providers[e],this._onChange.fire(e)}register(e){this._providers[e.version]=e}wcwidth(e){return this._activeProvider.wcwidth(e)}getStringCellWidth(e){let t=0;const i=e.length;for(let s=0;s<i;++s){let r=e.charCodeAt(s);if(55296<=r&&r<=56319){if(++s>=i)return t+this.wcwidth(r);const n=e.charCodeAt(s);56320<=n&&n<=57343?r=1024*(r-55296)+n-56320+65536:t+=this.wcwidth(n)}t+=this.wcwidth(r)}return t}}}},t={};function i(s){var r=t[s];if(void 0!==r)return r.exports;var n=t[s]={exports:{}};return e[s].call(n.exports,n,n.exports,i),n.exports}var s={};return(()=>{var e=s;Object.defineProperty(e,"__esModule",{value:!0}),e.Terminal=void 0;const t=i(9042),r=i(3236),n=i(844),o=i(5741),a=i(8285),h=i(7975),c=i(7090),l=["cols","rows"];class d extends n.Disposable{constructor(e){super(),this._core=this.register(new r.Terminal(e)),this._addonManager=this.register(new o.AddonManager),this._publicOptions=Object.assign({},this._core.options);const t=e=>this._core.options[e],i=(e,t)=>{this._checkReadonlyOptions(e),this._core.options[e]=t};for(const e in this._core.options){const s={get:t.bind(this,e),set:i.bind(this,e)};Object.defineProperty(this._publicOptions,e,s)}}_checkReadonlyOptions(e){if(l.includes(e))throw new Error(`Option "${e}" can only be set in the constructor`)}_checkProposedApi(){if(!this._core.optionsService.rawOptions.allowProposedApi)throw new Error("You must set the allowProposedApi option to true to use proposed API")}get onBell(){return this._core.onBell}get onBinary(){return this._core.onBinary}get onCursorMove(){return this._core.onCursorMove}get onData(){return this._core.onData}get onKey(){return this._core.onKey}get onLineFeed(){return this._core.onLineFeed}get onRender(){return this._core.onRender}get onResize(){return this._core.onResize}get onScroll(){return this._core.onScroll}get onSelectionChange(){return this._core.onSelectionChange}get onTitleChange(){return this._core.onTitleChange}get onWriteParsed(){return this._core.onWriteParsed}get element(){return this._core.element}get parser(){return this._parser||(this._parser=new h.ParserApi(this._core)),this._parser}get unicode(){return this._checkProposedApi(),new c.UnicodeApi(this._core)}get textarea(){return this._core.textarea}get rows(){return this._core.rows}get cols(){return this._core.cols}get buffer(){return this._buffer||(this._buffer=this.register(new a.BufferNamespaceApi(this._core))),this._buffer}get markers(){return this._checkProposedApi(),this._core.markers}get modes(){const e=this._core.coreService.decPrivateModes;let t="none";switch(this._core.coreMouseService.activeProtocol){case"X10":t="x10";break;case"VT200":t="vt200";break;case"DRAG":t="drag";break;case"ANY":t="any"}return{applicationCursorKeysMode:e.applicationCursorKeys,applicationKeypadMode:e.applicationKeypad,bracketedPasteMode:e.bracketedPasteMode,insertMode:this._core.coreService.modes.insertMode,mouseTrackingMode:t,originMode:e.origin,reverseWraparoundMode:e.reverseWraparound,sendFocusMode:e.sendFocus,wraparoundMode:e.wraparound}}get options(){return this._publicOptions}set options(e){for(const t in e)this._publicOptions[t]=e[t]}blur(){this._core.blur()}focus(){this._core.focus()}resize(e,t){this._verifyIntegers(e,t),this._core.resize(e,t)}open(e){this._core.open(e)}attachCustomKeyEventHandler(e){this._core.attachCustomKeyEventHandler(e)}registerLinkProvider(e){return this._core.registerLinkProvider(e)}registerCharacterJoiner(e){return this._checkProposedApi(),this._core.registerCharacterJoiner(e)}deregisterCharacterJoiner(e){this._checkProposedApi(),this._core.deregisterCharacterJoiner(e)}registerMarker(e=0){return this._verifyIntegers(e),this._core.registerMarker(e)}registerDecoration(e){var t,i,s;return this._checkProposedApi(),this._verifyPositiveIntegers(null!==(t=e.x)&&void 0!==t?t:0,null!==(i=e.width)&&void 0!==i?i:0,null!==(s=e.height)&&void 0!==s?s:0),this._core.registerDecoration(e)}hasSelection(){return this._core.hasSelection()}select(e,t,i){this._verifyIntegers(e,t,i),this._core.select(e,t,i)}getSelection(){return this._core.getSelection()}getSelectionPosition(){return this._core.getSelectionPosition()}clearSelection(){this._core.clearSelection()}selectAll(){this._core.selectAll()}selectLines(e,t){this._verifyIntegers(e,t),this._core.selectLines(e,t)}dispose(){super.dispose()}scrollLines(e){this._verifyIntegers(e),this._core.scrollLines(e)}scrollPages(e){this._verifyIntegers(e),this._core.scrollPages(e)}scrollToTop(){this._core.scrollToTop()}scrollToBottom(){this._core.scrollToBottom()}scrollToLine(e){this._verifyIntegers(e),this._core.scrollToLine(e)}clear(){this._core.clear()}write(e,t){this._core.write(e,t)}writeln(e,t){this._core.write(e),this._core.write("\r\n",t)}paste(e){this._core.paste(e)}refresh(e,t){this._verifyIntegers(e,t),this._core.refresh(e,t)}reset(){this._core.reset()}clearTextureAtlas(){this._core.clearTextureAtlas()}loadAddon(e){this._addonManager.loadAddon(this,e)}static get strings(){return t}_verifyIntegers(...e){for(const t of e)if(t===1/0||isNaN(t)||t%1!=0)throw new Error("This API only accepts integers")}_verifyPositiveIntegers(...e){for(const t of e)if(t&&(t===1/0||isNaN(t)||t%1!=0||t<0))throw new Error("This API only accepts positive integers")}}e.Terminal=d})(),s})()));
}

xterm_export();
// 04-ipc.js
function loadIpc() {
    // @pcos-app-mode native
    modules.ipc = {
        create: function() {
            let id = crypto.getRandomValues(new Uint8Array(64)).reduce((a, b) => a + b.toString(16).padStart(2, "0"), "");
            this._ipc[id] = { owner: "root", group: "root", world: false, _listeners: [] };
            return id;
        },
        declareAccess: function(id, access) {
            this._ipc[id] = { ...this._ipc[id], ...access };
        },
        listenFor: function(id) {
            let thatIPC = this._ipc;
            return new Promise(function(resolve) {
                let hasResolved = false;
                return thatIPC[id]._listeners.push(function e(d) {
                    if (hasResolved) return;
                    hasResolved = true;
                    return resolve(d);
                });
            });
        },
        send: function(id, data) {
            this._ipc[id]._listeners.forEach(listener => listener(data));
        },
        getIPC: function(id) {
            let ipc = { ...this._ipc[id] };
            ipc._listeners = ipc._listeners.length;
            return ipc;
        },
        _ipc: {}
    }
}
loadIpc();
// 04-websockets.js
function loadWebsocketSupport() {
    let websocketAPI = {
        getHandle: function(url) {
            let handle = Array.from(crypto.getRandomValues(new Uint8Array(64))).reduce((a, b) => a + b.toString(16).padStart(2, "0"), "");
            let websocket = new WebSocket(url);
            websocket.binaryType = "arraybuffer";
            websocketAPI._handles[handle] = {
                ws: websocket,
                acl: {
                    owner: "root",
                    group: "root",
                    world: true
                }
            };
            return handle;
        },
        send: (arg) => websocketAPI._handles[arg.handle].ws.send(arg.data),
        close: (handle) => websocketAPI._handles[handle].ws.close(),
        waitForEvent: function(arg) {
            return new Promise(function(resolve) {
                websocketAPI._handles[arg.handle].ws.addEventListener(arg.eventName, function meName(arg2) {
                    resolve(arg2.data);
                    try {
                        websocketAPI._handles[arg.handle].ws.removeEventListener(arg.eventName, meName);
                    } catch {}
                });
            });
        },
        assertAccess: function(arg) {
            if (arg.newACL) websocketAPI._handles[arg.handle].acl = arg.newACL;
            return websocketAPI._handles[arg.handle].acl;
        },
        websocketState: (handle) => websocketAPI._handles[handle].ws.readyState,
        delete: (handle) => delete websocketAPI._handles[handle],
        _handles: {}
    }
    modules.websocket = websocketAPI;
}

loadWebsocketSupport();
// 05-reeapis.js
function reeAPIs() {
    // @pcos-app-mode native

    async function denyUnmanifested(list, token) {
        let privileges = (await modules.tokens.info(token)).privileges;
        let isAllowlist = list.some(a => a.lineType == "allow");
        if (isAllowlist) list = list.filter(a => a.lineType == "allow");
        for (let privilege of privileges) {
            if ((!list.some(x => x.data == privilege && x.lineType == "allow") && isAllowlist) || list.some(x => x.data == privilege && x.lineType == "deny")) {
                privileges = privileges.filter(x => x != privilege);
                await modules.tokens.removePrivilege(token, privilege);
            }
        }
        return privileges;
    }

    modules.reeAPIInstance = async function(opts) {
        let {ree, ses, token, taskId, limitations} = opts;
        let processToken = token;
        let tokenInfo = await modules.tokens.info(token);
        let user = tokenInfo.user;
        let groups = tokenInfo.groups || [];
        let privileges = tokenInfo.privileges;
        let processPipes = [];
        let websockets = [];
        privileges = await denyUnmanifested(limitations, token);

        async function fs_action(action, privilegeCheck, path, ...xtra) {
            let fsPermissions;
            try {
                fsPermissions = await modules.fs.permissions(path);
            } catch (e) {
                throw new Error("PERMISSION_CHECKING_FAILED");
            }
            if (!privilegeCheck(fsPermissions)) throw new Error("PERMISSION_DENIED");
            try {
                let response = await modules.fs[action](path, ...xtra);
                return response;
            } catch (e) {
                if (e.name == "Error") throw new Error("FS_ACTION_FAILED: " + e.message);
                throw new Error("FS_ACTION_FAILED");
            }
        }
        ree.beforeCloseDown(async function() {
            for (let processPipe of processPipes) delete modules.ipc._ipc[processPipe];
            for (let websocket of websockets) {
                modules.websocket.close(websocket);
                modules.websocket.delete(websocket);
            }
            await modules.tokens.revoke(token);
            for (let i in modules.csps) modules.csps[i].removeSameGroupKeys(null, taskId);
        });
        let apis = {
            private: {
                setUser: async function(newUser) {
                    user = newUser;
                    groups = (await modules.users.getUserInfo(newUser)).groups || [];
                },
                addPrivilege: (newPrivilege) => !privileges.includes(newPrivilege) && privileges.push(newPrivilege),
                rmPrivilege: (newPrivilege) => privileges.includes(newPrivilege) && privileges.splice(privileges.indexOf(newPrivilege), 1),
                setPrivileges: (newPrivileges) => privileges = newPrivileges,
                reauthorize: async function() {
                    let tokenInfo = await modules.tokens.info(token);
                    user = tokenInfo.user;
                    groups = tokenInfo.groups || [];
                    privileges = tokenInfo.privileges;
                    privileges = await denyUnmanifested(limitations, token);
                }
            },
            public: {
                getUser: () => user,
                getPrivileges: () => privileges,
                terminate: async function() {
                    await ree.closeDown();
                },
                rmPrivilege: async function(privilege) {
                    if (!privileges.includes(privilege)) throw new Error("NO_SUCH_PRIVILEGE");
                    privileges.splice(privileges.indexOf(privilege), 1);
                    await modules.tokens.removePrivilege(token, privilege);
                    return true;
                },
                switchUser: async function(desiredUser) {
                    if (!privileges.includes("SWITCH_USERS_AUTOMATICALLY")) throw new Error("UNAUTHORIZED_ACTION");
                    await modules.tokens.setUsername(token, desiredUser);
                    user = (await modules.tokens.info(token)).user;
                    return true;
                },
                shutdown: async function(arg) {
                    let {isReboot, token} = arg;
                    if (!privileges.includes("SYSTEM_SHUTDOWN")) throw new Error("UNAUTHORIZED_ACTION");
                    await modules.restart(!isReboot, token || processToken);
                    return true;
                },
                fs_read: async function(arg) {
                    let {path, token} = arg;
                    if (!privileges.includes("FS_READ")) throw new Error("UNAUTHORIZED_ACTION");
                    return await fs_action("read", (fsPermissions) => fsPermissions.owner == user || fsPermissions.world.includes("r") || groups.includes(fsPermissions.group) || privileges.includes("FS_BYPASS_PERMISSIONS"), path, token || processToken);
                },
                fs_ls: async function(arg) {
                    let {path, token} = arg;
                    if (!privileges.includes("FS_READ")) throw new Error("UNAUTHORIZED_ACTION");
                    return await fs_action("ls",
                    (fsPermissions) =>
                        fsPermissions.owner == user ||
                        groups.includes(fsPermissions.group) ||
                        (fsPermissions.world.includes("r") &&
                        fsPermissions.world.includes("x")) || privileges.includes("FS_BYPASS_PERMISSIONS"), path, token || processToken);
                },
                fs_write: async function(arg) {
                    if (!privileges.includes("FS_WRITE")) throw new Error("UNAUTHORIZED_ACTION");
                    let {path, data, token} = arg;
                    let pathParent = path.split("/").slice(0, -1).join("/");
                    let basename = path.split("/").slice(-1)[0];
                    let isCreating = false;
                    try {
                        if (!(await modules.fs.ls(pathParent, token || processToken)).includes(basename)) isCreating = true;
                    } catch (e) {
                        throw new Error("CREATION_CHECK_FAILED");
                    }
                    if (isCreating) {
                        try {
                            await modules.fs.chown(path, user, token || processToken);
                            await modules.fs.chgrp(path, groups[0], token || processToken);
                            await modules.fs.chmod(path, "r", token || processToken);
                        } catch (e) {
                            throw new Error("PERMISSION_CHANGE_FAILED");
                        }
                    }
                    return await fs_action("write", (fsPermissions) => fsPermissions.owner == user || groups.includes(fsPermissions.group) || fsPermissions.world.includes("w") || privileges.includes("FS_BYPASS_PERMISSIONS"), path, data, token || processToken);
                },
                fs_rm: async function(arg) {
                    let {path, token} = arg;
                    if (!privileges.includes("FS_REMOVE")) throw new Error("UNAUTHORIZED_ACTION");
                    return await fs_action("rm", (fsPermissions) => fsPermissions.owner == user || privileges.includes("FS_BYPASS_PERMISSIONS"), path, token);
                },
                fs_mkdir: async function(arg) {
                    let {path, token} = arg;
                    if (!privileges.includes("FS_WRITE")) throw new Error("UNAUTHORIZED_ACTION");
                    let pathParent = path.split("/").slice(0, -1).join("/");
                    let fsPermissions;
                    try {
                        fsPermissions = await modules.fs.permissions(pathParent, token || processToken);
                    } catch (e) {
                        throw new Error("PERMISSION_CHECKING_FAILED");
                    }
                    if (!fsPermissions.world.includes("w") && fsPermissions.owner != user && !groups.includes(fsPermissions.group) && !privileges.includes("FS_BYPASS_PERMISSIONS")) throw new Error("PERMISSION_DENIED");
                    try {
                        await modules.fs.chown(path, user, token || processToken);
                        await modules.fs.chgrp(path, groups[0], token || processToken);
                        await modules.fs.chmod(path, "rx", token || processToken);
                    } catch (e) {
                        throw new Error("PERMISSION_CHANGE_FAILED");
                    }
                    try {
                        return await modules.fs.mkdir(path, token || processToken);
                    } catch (e) {
                        if (e.name == "Error") throw new Error("FS_ACTION_FAILED: " + e.message);
                        throw new Error("FS_ACTION_FAILED");
                    }
                },
                fs_chown: async function(arg) {
                    if (!privileges.includes("FS_CHANGE_PERMISSION")) throw new Error("UNAUTHORIZED_ACTION");
                    let {path, newUser, token} = arg;
                    return await fs_action("chown", (fsPermissions) => fsPermissions.owner == user || privileges.includes("FS_BYPASS_PERMISSIONS"), path, newUser, token || processToken);
                },
                fs_chgrp: async function(arg) {
                    if (!privileges.includes("FS_CHANGE_PERMISSION")) throw new Error("UNAUTHORIZED_ACTION");
                    let {path, newGrp, token} = arg;
                    return await fs_action("chgrp", (fsPermissions) => fsPermissions.owner == user || privileges.includes("FS_BYPASS_PERMISSIONS"), path, newGrp, token || processToken);
                },
                fs_chmod: async function(arg) {
                    if (!privileges.includes("FS_CHANGE_PERMISSION")) throw new Error("UNAUTHORIZED_ACTION");
                    let {path, newPermissions, token} = arg;
                    return await fs_action("chmod", (fsPermissions) => fsPermissions.owner == user || privileges.includes("FS_BYPASS_PERMISSIONS"), path, newPermissions, token || processToken);
                },
                fs_permissions: async function(arg) {
                    let {path, token} = arg;
                    if (!privileges.includes("FS_READ")) throw new Error("UNAUTHORIZED_ACTION");
                    let pathParent = path.split("/").slice(0, -1).join("/");
                    let fsPermissions;
                    try {
                        fsPermissions = await modules.fs.permissions(pathParent, token || processToken);
                    } catch (e) {
                        throw new Error("PERMISSION_CHECKING_FAILED");
                    }
                    if (!fsPermissions.world.includes("r") && fsPermissions.owner != user && !privileges.includes("FS_BYPASS_PERMISSIONS")) throw new Error("PERMISSION_DENIED");
                    return await fs_action("permissions", () => true, path, token || processToken);
                },
                fs_mounts: async function() {
                    if (!privileges.includes("FS_LIST_PARTITIONS")) throw new Error("UNAUTHORIZED_ACTION");
                    try {
                        return await modules.fs.lsmounts();
                    } catch (e) {
                        if (e.name == "Error") throw new Error("FS_ACTION_FAILED: " + e.message);
                        throw new Error("FS_ACTION_FAILED");
                    }
                },
                fs_sync: async function(arg) {
                    let {mount, token} = arg;
                    if (!privileges.includes("FS_UNMOUNT")) throw new Error("UNAUTHORIZED_ACTION");
                    try {
                        return await modules.fs.sync(mount, token || processToken);
                    } catch (e) {
                        if (e.name == "Error") throw new Error("FS_ACTION_FAILED: " + e.message);
                        throw new Error("FS_ACTION_FAILED");
                    }
                },
                fs_unmount: async function(arg) {
                    let {mount, token} = arg;
                    if (!privileges.includes("FS_UNMOUNT")) throw new Error("UNAUTHORIZED_ACTION");
                    try {
                        return await modules.fs.unmount(mount, token || processToken);
                    } catch (e) {
                        if (e.name == "Error") throw new Error("FS_ACTION_FAILED: " + e.message);
                        throw new Error("FS_ACTION_FAILED");
                    }
                },
                fs_mountInfo: async function(mount) {
                    if (!privileges.includes("FS_LIST_PARTITIONS")) throw new Error("UNAUTHORIZED_ACTION");
                    try {
                        return await modules.fs.mountInfo(mount);
                    } catch (e) {
                        if (e.name == "Error") throw new Error("FS_ACTION_FAILED: " + e.message);
                        throw new Error("FS_ACTION_FAILED");
                    }
                },
                getSystemMount: async function() {
                    if (!privileges.includes("FS_LIST_PARTITIONS")) throw new Error("UNAUTHORIZED_ACTION");
                    return modules.defaultSystem;
                },
                createPipe: async function() {
                    if (!privileges.includes("IPC_CREATE_PIPE")) throw new Error("UNAUTHORIZED_ACTION");
                    let pipe = await modules.ipc.create();
                    modules.ipc.declareAccess(pipe, {
                        owner: user,
                        group: groups[0],
                        world: false
                    });
                    processPipes.push(pipe);
                    return pipe;
                },
                listenToPipe: async function(pipe) {
                    if (!privileges.includes("IPC_LISTEN_PIPE")) throw new Error("UNAUTHORIZED_ACTION");
                    let permissions = await modules.ipc.getIPC(pipe);
                    if (permissions.owner != user && !groups.includes(permissions.group) && !permissions.world && !privileges.includes("IPC_BYPASS_PERMISSIONS") && !processPipes.includes(pipe)) throw new Error("PERMISSION_DENIED");
                    return await modules.ipc.listenFor(pipe);
                },
                sendToPipe: async function(dataSend) {
                    if (!privileges.includes("IPC_SEND_PIPE")) throw new Error("UNAUTHORIZED_ACTION");
                    let {pipe, data} = dataSend;
                    let permissions = await modules.ipc.getIPC(pipe);
                    if (permissions.owner != user && !groups.includes(permissions.group) && !permissions.world && !privileges.includes("IPC_BYPASS_PERMISSIONS") && !processPipes.includes(pipe)) throw new Error("PERMISSION_DENIED");
                    return await modules.ipc.send(pipe, data);
                },
                closePipe: async function(pipe) {
                    if (!processPipes.includes(pipe)) throw new Error("NOT_OWN_PIPE");
                    processPipes.splice(processPipes.indexOf(pipe), 1);
                    return delete modules.ipc._ipc[pipe];
                },
                setPipePermissions: async function(opts) {
                    if (!privileges.includes("IPC_CHANGE_PERMISSION")) throw new Error("UNAUTHORIZED_ACTION");
                    let {pipe, newPermissions} = opts;
                    let permissions = await modules.ipc.getIPC(pipe);
                    if (permissions.owner != user && !groups.includes(permissions.group) && !permissions.world && !privileges.includes("IPC_BYPASS_PERMISSIONS") && !processPipes.includes(pipe)) throw new Error("PERMISSION_DENIED");
                    return await modules.ipc.declareAccess(pipe, newPermissions);
                },
                elevate: async function(newPrivileges) {
                    newPrivileges = newPrivileges.filter(privilege => !privileges.includes(privilege));
                    newPrivileges = Array.from(new Set(newPrivileges));
                    if (!privileges.includes("SWITCH_USERS_AUTOMATICALLY")) throw new Error("UNAUTHORIZED_ACTION");
                    privileges.push(...newPrivileges);
                    await modules.tokens.addPrivileges(token, newPrivileges);
                    privileges = await denyUnmanifested(limitations, token);
                    return true;
                },
                getVersion: () => modules.pcos_version,
                locale: () => navigator.language.slice(0, 2).toLowerCase(),
                getUserInfo: async function(arg) {
                    let {desiredUser, token, sensitive} = arg;
                    if (!privileges.includes("GET_USER_INFO")) throw new Error("UNAUTHORIZED_ACTION");
                    if (desiredUser != user && !privileges.includes("USER_INFO_OTHERS")) throw new Error("UNAUTHORIZED_ACTION");
                    if (sensitive && desiredUser != user && !privileges.includes("SENSITIVE_USER_INFO_OTHERS")) throw new Error("PERMISSION_DENIED");
                    return await modules.users.getUserInfo(desiredUser, sensitive, token || processToken);
                },
                setUserInfo: async function(arg) {
                    let {desiredUser, token, info} = arg;
                    if (!privileges.includes("SET_USER_INFO")) throw new Error("UNAUTHORIZED_ACTION");
                    return await modules.users.moduser(desiredUser, info, token || processToken);
                },
                setOwnSecurityChecks: async function(arg) {
                    let {token, checks} = arg;
                    if (!privileges.includes("SET_SECURITY_CHECKS")) throw new Error("UNAUTHORIZED_ACTION");
                    let allowedTypes = [ "pbkdf2", "informative", "informative_deny", "timeout", "timeout_deny", "serverReport", "pc-totp", "totp", "workingHours" ];
                    let sanitizedChecks = [];
                    checks.filter(a => allowedTypes.includes(a.type));
                    for (let checkIndex in checks) {
                        let check = checks[checkIndex];
                        if (check.type == "pbkdf2") {
                            if (!check.salt || !check.hash) continue;
                            check = { type: "pbkdf2", salt: check.salt, hash: check.hash };
                        } else if (check.type == "informative" || check.type == "informative_deny") {
                            if (!check.message) continue;
                            check = { type: check.type, message: check.message };
                        } else if (check.type == "timeout" || check.type == "timeout_deny") {
                            if (!check.timeout) continue;
                            check = { type: check.type, timeout: check.timeout };
                        } else if (check.type == "serverReport") {
                            if (!check.url) continue;
                            check = { type: "serverReport", url: check.url };
                        } else if (check.type == "pc-totp" || check.type == "totp") {
                            if (!check.secret) continue;
                            check = { type: check.type, secret: check.secret };
                        } else if (check.type == "workingHours") {
                            if (!check.start || !check.end) continue;
                            if (typeof check.start.hours !== "number" || typeof check.start.minutes !== "number" || typeof check.start.seconds !== "number") continue;
                            if (typeof check.end.hours !== "number" || typeof check.end.minutes !== "number" || typeof check.end.seconds !== "number") continue;
                            check = {
                                type: "workingHours",
                                start: {
                                    hours: check.start.hours,
                                    minutes: check.start.minutes,
                                    seconds: check.start.seconds
                                },
                                end: {
                                    hours: check.end.hours,
                                    minutes: check.end.minutes,
                                    seconds: check.end.seconds
                                }
                            };
                        }
                        sanitizedChecks.push(check);
                    }
                    let previousUserInfo = await modules.users.getUserInfo(user, false, token || processToken);
                    await modules.users.moduser(user, { ...previousUserInfo, securityChecks: sanitizedChecks }, token || processToken);
                    return true;
                },
                getNewToken: async function(desiredUser) {
                    if (!privileges.includes("ELEVATE_PRIVILEGES")) throw new Error("UNAUTHORIZED_ACTION");
                    let logonUI = await modules.authui(ses, desiredUser);
                    return new Promise(function(resolve) {
                        logonUI.hook(async function(result) {
                            if (result.success == false) return resolve(false);
                            return resolve(result.token);
                        });
                    });
                },
                getProcessToken: () => processToken,
                setProcessToken: async function(desiredToken) {
                    if (!privileges.includes("ELEVATE_PRIVILEGES")) throw new Error("UNAUTHORIZED_ACTION");
                    let validation = await modules.tokens.validate(desiredToken, {});
                    if (!validation) throw new Error("INVALID_TOKEN");
                    token = processToken = desiredToken;
                    let tokenInfo = await modules.tokens.info(token);
                    user = tokenInfo.user;
                    groups = tokenInfo.groups || [];
                    privileges = tokenInfo.privileges;
                    privileges = await denyUnmanifested(limitations, token);
                    return true;
                },
                revokeToken: (dt) => modules.tokens.revoke(dt || processToken),
                forkToken: (dt) => modules.tokens.fork(dt || processToken),
                removeTokenPrivilege: async function(arg) {
                    let {token, privilege} = arg;
                    if (!privileges.includes("MANAGE_TOKENS")) throw new Error("UNAUTHORIZED_ACTION");
                    await modules.tokens.removePrivilege(token, privilege);
                    return true;
                },
                estimateStorage: async function() {
                    if (!privileges.includes("FS_LIST_PARTITIONS")) throw new Error("UNAUTHORIZED_ACTION");
                    let estimate = await navigator.storage.estimate();
                    return {
                        internal: {
                            used: estimate.usage,
                            free: estimate.quota - estimate.usage,
                            total: estimate.quota
                        }
                    };
                },
                startTask: async function(arg) {
                    let {file, argPassed, token} = arg;
                    if (!privileges.includes("START_TASK")) throw new Error("UNAUTHORIZED_ACTION");
                    if (!token) token = await modules.tokens.fork(processToken);
                    try {
                        return await modules.tasks.exec(file, argPassed, modules.window(ses), token);
                    } catch {
                        throw new Error("UNABLE_TO_START_TASK");
                    }
                },
                listTasks: async function() {
                    if (!privileges.includes("LIST_TASKS")) throw new Error("UNAUTHORIZED_ACTION");
                    return modules.tasks.listPublicTasks();
                },
                taskInfo: async function(taskId) {
                    if (!privileges.includes("LIST_TASKS")) throw new Error("UNAUTHORIZED_ACTION");
                    return await modules.tasks.taskInfo(taskId);
                },
                signalTask: async function(arg) {
                    let {taskId, signal} = arg;
                    if (!privileges.includes("SIGNAL_TASK")) throw new Error("UNAUTHORIZED_ACTION");
                    if (!privileges.includes("TASK_BYPASS_PERMISSIONS")) {
                        let taskInfo = await modules.tasks.taskInfo(taskId);
                        if (taskInfo.runBy != user) throw new Error("PERMISSION_DENIED");
                    }
                    return await modules.tasks.sendSignal(taskId, signal);
                },
                lookupLocale: (key) => modules.locales.get(key),
                ufTimeInc: (args) => modules.userfriendliness.inconsiderateTime(...args),
                ufInfoUnits: (args) => modules.userfriendliness.informationUnits(...args),
                isDarkThemed: () => modules.session.attrib(ses, "dark"),
                fetchSend: async function(arg) {
                    if (!privileges.includes("FETCH_SEND")) throw new Error("UNAUTHORIZED_ACTION");
                    let {url, init} = arg;
                    let fetc = await fetch(url, init);
                    let responseAB;
                    if (init.mode != "no-cors" && !init.noArrayBuffer) responseAB = await fetc.arrayBuffer();
                    return {
                        status: fetc.status,
                        statusText: fetc.statusText,
                        ok: fetc.ok,
                        redirected: fetc.redirected,
                        type: fetc.type,
                        url: fetc.url,
                        headers: Object.fromEntries(Array.from(fetc.headers)),
                        arrayBuffer: responseAB,
                    };
                },
                switchUserWithSetup: async function(desiredUser) {
                    if (!privileges.includes("SWITCH_USERS_AUTOMATICALLY")) throw new Error("UNAUTHORIZED_ACTION");
                    await modules.tokens.userInitialize(token, desiredUser);
                    let tokenInfo = await modules.tokens.info(token);
                    user = tokenInfo.user;
                    groups = tokenInfo.groups || [];
                    privileges = tokenInfo.privileges;
                    privileges = await denyUnmanifested(limitations, token);
                    return true;
                },
                runKlvlCode: async function(code) {
                    if (!privileges.includes("RUN_KLVL_CODE")) throw new Error("UNAUTHORIZED_ACTION");
                    return eval(code);
                },
                cspOperation: async function(arg) {
                    if (!privileges.includes("CSP_OPERATIONS")) throw new Error("UNAUTHORIZED_ACTION");
                    return modules.csps[arg.cspProvider][arg.operation](arg.cspArgument, taskId);
                },
                availableCsps: async function() {
                    if (!privileges.includes("CSP_OPERATIONS")) throw new Error("UNAUTHORIZED_ACTION");
                    return Object.keys(modules.csps);
                },
                ufTimeCon: (args) => modules.userfriendliness.considerateTime(...args),
                websocketOpen: async function(arg) {
                    if (!privileges.includes("WEBSOCKETS_OPEN")) throw new Error("UNAUTHORIZED_ACTION");
                    let handle = await modules.websocket.getHandle(arg);
                    websockets.push(handle);
                    modules.websocket.assertAccess({ handle, newACL: {
                        owner: user,
                        group: groups[0],
                        world: false
                    }});
                    return handle;
                },
                listenToWebsocket: async function(arg) {
                    if (!privileges.includes("WEBSOCKETS_LISTEN")) throw new Error("UNAUTHORIZED_ACTION");
                    let permissions = modules.websocket.assertAccess({ handle: arg.handle });
                    if (permissions.owner != user && !groups.includes(permissions.group) && !permissions.world && !privileges.includes("WEBSOCKET_BYPASS_PERMISSIONS") && !websockets.includes(arg.handle)) throw new Error("PERMISSION_DENIED");
                    return await modules.websocket.waitForEvent(arg);
                },
                sendToWebsocket: async function(arg) {
                    if (!privileges.includes("WEBSOCKETS_SEND")) throw new Error("UNAUTHORIZED_ACTION");
                    let permissions = modules.websocket.assertAccess({ handle: arg.handle });
                    if (permissions.owner != user && !groups.includes(permissions.group) && !permissions.world && !privileges.includes("WEBSOCKET_BYPASS_PERMISSIONS") && !websockets.includes(arg.handle)) throw new Error("PERMISSION_DENIED");
                    return await modules.websocket.send(arg);
                },
                closeWebsocket: async function(websocket) {
                    if (!privileges.includes("WEBSOCKETS_CLOSE")) throw new Error("UNAUTHORIZED_ACTION");
                    return modules.websocket.close(websocket);
                },
                deleteWebsocket: async function(websocket) {
                    if (!websockets.includes(websocket)) throw new Error("NOT_OWN_WEBSOCKET");
                    websockets.splice(websockets.indexOf(websocket), 1);
                    return modules.websocket.delete(websocket);
                },
                setWebsocketPermissions: async function(arg) {
                    if (!privileges.includes("WEBSOCKET_SET_PERMISSIONS")) throw new Error("UNAUTHORIZED_ACTION");
                    let permissions = modules.websocket.assertAccess({ handle: arg.handle });
                    if (permissions.owner != user && !groups.includes(permissions.group) && !permissions.world && !privileges.includes("WEBSOCKET_BYPASS_PERMISSIONS") && !websockets.includes(arg.handle)) throw new Error("PERMISSION_DENIED");
                    return await modules.websocket.assertAccess(arg);
                },
                getPublicSystemID: async function() {
                    if (!privileges.includes("IDENTIFY_SYSTEM")) throw new Error("UNAUTHORIZED_ACTION");
                    return (modules.core.prefs.read("system_id") || {}).public;
                },
                getPrivateSystemID: async function() {
                    if (!privileges.includes("IDENTIFY_SYSTEM_SENSITIVE")) throw new Error("UNAUTHORIZED_ACTION");
                    return (modules.core.prefs.read("system_id") || {}).private;
                }
            }
        }
        let customAPIs = modules.customAPIs;
        if (customAPIs) {
            for (let api in (customAPIs.public || {})) apis.public[api] = async (...args) => customAPIs.public[api](processToken, ...args);
            for (let api in (customAPIs.private || {})) apis.private[api] = async (...args) => customAPIs.private[api](processToken, ...args);
        }
        return apis;
    }
}
reeAPIs();
// 06-csp.js
function loadBasicCSP() {
    modules.csps = {};
    let cryptoKeys = {};
    function cryptoKeyIntoKeyObject(ck, groupBy) {
        if (ck.privateKey && ck.publicKey) return {
            privateKey: cryptoKeyIntoKeyObject(ck.privateKey, groupBy),
            publicKey: cryptoKeyIntoKeyObject(ck.publicKey, groupBy),
        };
        let keyID = crypto.getRandomValues(new Uint8Array(64)).reduce((a, b) => a + b.toString(16).padStart(2, "0"), "");
        if (!cryptoKeys.hasOwnProperty(groupBy)) cryptoKeys[groupBy] = {};
        cryptoKeys[groupBy][keyID] = ck;
        return {
            type: ck.type,
            extractable: ck.extractable,
            algorithm: ck.algorithm,
            usages: ck.usages,
            keyID: keyID
        }
    }
    modules.csps.basic = {
        cspMetadata: function() {
            return {
                name: "Basic Cryptographic Provider",
                version: modules.pcos_version,
                developer: "PCsoft"
            }
        },
        random: async function(typedArray) {
            return crypto.getRandomValues(typedArray);
        },
        importKey: async function(arg, groupBy) {
            return cryptoKeyIntoKeyObject(await crypto.subtle.importKey(arg.format, arg.keyData, arg.algorithm, arg.extractable, arg.keyUsages), groupBy);
        },
        generateKey: async function(arg, groupBy) {
            return cryptoKeyIntoKeyObject(await crypto.subtle.generateKey(arg.algorithm, arg.extractable, arg.keyUsages), groupBy);
        },
        deriveBits: async function(arg, groupBy) {
            arg.baseKey = cryptoKeys[groupBy][arg.baseKey.keyID];
            if (arg.algorithm.public) arg.algorithm.public = cryptoKeys[groupBy][arg.algorithm.public.keyID];
            return crypto.subtle.deriveBits(arg.algorithm, arg.baseKey, arg.length);
        },
        deriveKey: async function(arg, groupBy) {
            arg.baseKey = cryptoKeys[groupBy][arg.baseKey.keyID];
            if (arg.algorithm.public) arg.algorithm.public = cryptoKeys[groupBy][arg.algorithm.public.keyID];
            return cryptoKeyIntoKeyObject(await crypto.subtle.deriveKey(arg.algorithm, arg.baseKey, arg.derivedKeyType, arg.extractable, arg.keyUsages), groupBy);
        },
        wrapKey: async function(arg, groupBy) {
            arg.key = cryptoKeys[groupBy][arg.key.keyID];
            arg.wrappingKey = cryptoKeys[groupBy][arg.wrappingKey.keyID];
            return crypto.subtle.wrapKey(arg.format, arg.key, arg.wrappingKey, arg.wrapAlgo);
        },
        digest: async function(arg) {
            return crypto.subtle.digest(arg.algorithm, arg.data);
        },
        encrypt: async function(arg, groupBy) {
            arg.key = cryptoKeys[groupBy][arg.key.keyID];
            return crypto.subtle.encrypt(arg.algorithm, arg.key, arg.data);
        },
        sign: async function(arg, groupBy) {
            arg.key = cryptoKeys[groupBy][arg.key.keyID];
            return crypto.subtle.sign(arg.algorithm, arg.key, arg.data);
        },
        exportKey: async function(arg, groupBy) {
            arg.key = cryptoKeys[groupBy][arg.key.keyID];
            return crypto.subtle.exportKey(arg.format, arg.key);
        },
        unwrapKey: async function(arg, groupBy) {
            arg.unwrappingKey = cryptoKeys[groupBy][arg.unwrappingKey.keyID];
            return cryptoKeyIntoKeyObject(await crypto.subtle.unwrapKey(arg.format, arg.keyData, arg.unwrappingKey, arg.unwrapAlgo, arg.unwrappedKeyAlgo, arg.extractable, arg.keyUsages), groupBy);
        },
        decrypt: async function(arg, groupBy) {
            arg.key = cryptoKeys[groupBy][arg.key.keyID];
            return crypto.subtle.decrypt(arg.algorithm, arg.key, arg.data);
        },
        verify: async function(arg, groupBy) {
            arg.key = cryptoKeys[groupBy][arg.key.keyID];
            return crypto.subtle.verify(arg.algorithm, arg.key, arg.signature, arg.data);
        },
        unloadKey: (key, groupBy) => delete cryptoKeys[groupBy][key.keyID],
        removeSameGroupKeys: (_, groupBy) => delete cryptoKeys[groupBy]
    }
}
loadBasicCSP();
// 06-locales.js
function localization() {
    // @pcos-app-mode native
    let locales = {
        en: {
            "UNTITLED_APP": "Untitled application",
            "PERMISSION_DENIED": "Permission denied",
            "MORE_PERMISSION_DENIED": "There are not enough permissions to run this application.",
            "COMPATIBILITY_ISSUE_TITLE": "Compatibility issue",
            "COMPATIBILITY_ISSUE": "This app cannot run on this computer as a task. Check the application modes to include \"isolatable\".",
            "APP_STARTUP_CRASH_TITLE": "Something went wrong",
            "APP_STARTUP_CRASH": "The host OS handling failed to execute this app or this app crashed at startup.",
            "JS_TERMINAL": "JavaScript Terminal",
            "TERMINAL_INVITATION": "PCOS 3, build %s",
            "PCOS_RESTARTING": "PCOS is restarting. %s",
            "PLEASE_WAIT": "Please wait.",
            "POLITE_CLOSE_SIGNAL": "Sending polite close.",
            "ABRUPT_CLOSE_SIGNAL": "Sending abrupt close.",
            "UNMOUNTING_MOUNTS": "Unmounting mounts.",
            "SAFE_TO_CLOSE": "It is now safe to close this tab.",
            "RESTART_BUTTON": "Reboot",
            "RESTARTING": "Restarting.",
            "INSTALL_PCOS": "Install PCOS",
            "INSTALLER_TITLE": "PCOS 3 Installer",
            "CLOSE_INSTALLER_CONFIRMATION": "Are you sure you want to stop the installation process? This computer will restart.",
            "YES": "Yes",
            "NO": "No",
            "INSTALLER_INVITATION": "You are installing PCOS 3 build %s on this computer.",
            "INSTALL_BUTTON": "Install",
            "CLI_BUTTON": "Open terminal",
            "INSTALLER_PARTITIONING": "Select the boot and data partitions you would like to use.",
            "PARTITIONING_USE": "Use partitions",
            "PARTITION_DATA": "Data partition",
            "PARTITION_BOOT": "Boot partition",
            "FORMAT_DATA": "Format to PCFS",
            "DATA_INPUT_ALERT": "Please enter a data partition name.",
            "PROMPT_PARTITION_TABLE": "This disk does not seem to contain a valid partition table. Do you want to insert a partition table?",
            "CONFIRM_PARTITION_ERASE": "All data on that partition will be erased. Continue?",
            "BOOT_INPUT_ALERT": "Please enter a boot partition name.",
            "CANNOT_FIND_PARTITION": "Can't find a disk partition. Please try formatting the data partition to PCFS.",
            "PCFS_DETECTION_ERROR": "The data partition doesn't seem to contain PCFS. Do you still want to use it?",
            "INSTALLING_PCOS": "Installing PCOS: %s",
            "CREATING_BOOT_PARTITION": "Creating boot partition",
            "MOUNTING_DATA_PARTITION": "Mounting data partition as 'target'",
            "CHANGING_ROOT_PERMISSIONS": "Changing / permissions",
            "COPYING_FOLDERS": "Copying folders",
            "PREPARING_FOR_COPY": "Preparing for copying",
            "CHANGING_BOOT_PERMISSIONS": "Changing /boot permissions",
            "PATCHING_FS": "Patching for data mount",
            "INSTALLATION_SUCCESSFUL": "Successful installation. Close window to reboot.",
            "INSTALLATION_FAILED": "Installation of PCOS failed. Please try again. Close window to reboot.",
            "CREATING_DIR": "Creating %s",
            "COPYING_FILE": "Copying %s",
            "COMPLETE_COPY": "Complete copying %s",
            "REMOVING_OBJECT": "Removing %s",
            "COMPLETE_REMOVE": "Complete removing %s",
            "SHORT_DAYS": "%sd",
            "SHORT_HOURS": "%sh",
            "SHORT_MINUTES": "%smin",
            "SHORT_SECONDS": "%ss",
            "SHORT_MILLISECONDS": "%sms",
            "SHORT_TERABYTES": "%sTB",
            "SHORT_GIGABYTES": "%sGB",
            "SHORT_MEGABYTES": "%sMB",
            "SHORT_KILOBYTES": "%sKB",
            "SHORT_BYTES": "%sB",
            "AUTH_FAILED_NEW": "Authentication failed, please use a new instance!",
            "AUTH_SUCCESS": "Authentication successful.",
            "AUTH_FAILED": "Authentication failed.",
            "PLEASE_WAIT_TIME": "Please wait %s",
            "REPORTING_LOGON": "Reporting logon to server...",
            "TOTP_PC_PROMPT": "Enter TOTP-PC code",
            "TOTP_PROMPT": "Enter TOTP code",
            "ACCESS_NOT_SETUP": "Access to this user is not set up",
            "PASSWORD_PROMPT": "Enter password",
            "ENTER_BUTTON": "Enter",
            "USERNAME_PROMPT": "Enter an username.",
            "USERNAME": "Username",
            "ACCESS_FN_FAIL": "No such user.",
            "PROMPT_GET_FAIL": "Something went wrong while getting the authentication prompt.",
            "LET_TRY_AGAIN": "Let's try again.",
            "RESPONSE_PLACEHOLDER": "Response...",
            "START_MENU_BTN": "Start",
            "START_MENU": "Start menu",
            "LOG_IN_INVITATION": "Log in",
            "LOG_OUT_BUTTON": "Log out (%s)",
            "LOCK_BUTTON": "Lock",
            "TERMINAL_BUTTON": "Terminal",
            "TURN_OFF_BUTTON": "Turn off",
            "TERMINAL_PRIVILEGE_ERROR": "You are not permitted to run the unisolated terminal.",
            "CANNOT_SHUTDOWN": "You are not permitted to shut down the system.",
            "PASSWORD": "Password",
            "SET_UP_PCOS": "Set up PCOS",
            "LET_SETUP_SYSTEM": "Let's set up the system now.",
            "SET_UP": "Set up",
            "LET_CREATE_ACCOUNT": "Let's create your own user account.",
            "CREATE": "Create",
            "PASSWORD_INPUT_ALERT": "Please enter a password!",
            "SETUP_SUCCESSFUL": "Successful setup. Close window to log in.",
            "CREATING_USER_STRUCTURE": "Creating user structure",
            "CREATING_USER": "Creating user",
            "INSTALLING_WPS": "Installing wallpapers",
            "INSTALLING_APPS": "Installing apps",
            "INSTALLING_WP2U": "Installing wallpaper to user",
            "REMOVING_2STAGE": "Removing second-stage installer",
            "PATCHING_LOGON": "Patching for logon requirement",
            "CONFIRM": "Confirm",
            "RIGHT_REVIEW": "Let's review your rights.",
            "RIGHT_REVIEW_BTN": "Accept license",
            "DARK_MODE": "Dark mode",
            "INSTALLING_DARKMODE": "Installing dark mode preference",
            "CREATING_USER_HOME": "Creating user home directory",
            "PROVISIONED_PREFERENCE": "This setting is managed by the system administrator.",
            "USERNAME_EXISTS": "This user already exists in the system.",
            "VIDEO_PLAYER": "Video player",
            "INACCESSIBLE_FILE": "%s is inaccessible. Ensure you have permissions to access it, and that the object exists.",
            "FILE_NOT_SPECIFIED": "No file specified.",
            "PICTURE_VIEWER": "Picture viewer",
            "ISOLATED_TERM": "Isolated JS terminal",
            "HELP_TERMINAL_ISOLATED": "help - Display help menu\r\nclear - Clear terminal\r\njs_ree - Execute JavaScript code\r\n--- REE API EXPORTS ---\r\n",
            "TERM_COMMAND_NOT_FOUND": "%s: command not found",
            "FILE_EXPLORER": "File explorer",
            "GRANT_FEXP_PERM": "Please grant permissions to read file structures and list partitions.",
            "GRANT_PERM": "Grant permissions",
            "GRANT_FEXP_PERM_ADM": "Please consult the administrator to grant privileges to this application to read file structures and list partitions. (FS_READ, FS_LIST_PARTITIONS)",
            "GRANT_FEXP_PERM_USR": "Please grant permissions to read file structures and list partitions using a different user.",
            "BROWSE_FEXP": "Browse",
            "SPACE_SHOWER": "Space in \"%s\": %s used of %s (%s%)",
            "FILE_STRUCT_BROWSE_FAIL": "Could not browse to this structure:\n%s",
            "UNKNOWN_FS_STRUCT": "Unknown filesystem structure \"%s\"",
            "UNKNOWN_FILE_TYPE": "This is an unknown file type.",
            "TMGR_PERMISSION": "Task manager was not permitted to run under this condition. Please contact the system administrator.\nRequired privileges: %s",
            "TASK_MANAGER": "Task manager",
            "BASENAME_TASK": "Basename",
            "USER_TASK": "User",
            "TERMINATE_TASK": "Terminate",
            "FULL_PATH_TASK": "Full path",
            "ARGUMENTS_TASK": "Arguments",
            "REMOVING_SETUP_STATE": "Removing setup status",
            "LOGGING_OUT": "Logging out...",
            "PANIC_LINE1": "A critical problem has been detected while using the operating system. Its stability is at risk now.",
            "PANIC_LINE2": "Problem code: %s",
            "PANIC_UNSPECIFIED_ERROR": "UNSPECIFIED_ERROR",
            "PROBLEMATIC_COMPONENT": "Problematic component: %s",
            "PROBLEMATIC_PARAMS": "Problematic parameters: %s",
            "PROBLEMATIC_JS": "Problematic JavaScript: %s: %s",
            "PANIC_LINE3": "If you have seen this error message the first time, attempt rebooting.",
            "PANIC_LINE4": "If you see this error message once more, there is something wrong with the system.",
            "PANIC_LINE5": "You can try repairing the filesystem by placing a .fsck file on the system root mountpoint, with any value in it.",
            "PANIC_LINE6": "Proper shutdown procedure follows now:",
            "PANIC_TASK_KILLED": "task:%s: killed",
            "PANIC_MOUNT_UNMOUNTED": "mount:%s: unmounted",
            "PANIC_MOUNT_FAILED": "mount:%s: %s: %s",
            "SECURE_CONTEXT_REQUIRED": "A secure connection is required for PCOS 3. Make sure the URL contains https://.",
            "SWITCH_TO_SECURE_CTX": "Use HTTPS",
            "SHORT_YEARS": "%sy",
            "SHORT_MONTHS": "%smo",
            "SYSADMIN_TOOLS_TITLE": "Sysadmin Tools",
            "SYSADMIN_TOOLS_PRIVFAIL": "You are not a system administrator.",
            "REINSTALL_BUTTON": "Reinstall OS",
            "FSCK_BUTTON": "Recover lost files",
            "SWIPE_BUTTON": "Wipe system securely",
            "REINSTALL_DOWNLOADING": "Downloading local os.js...",
            "REINSTALL_DOWNLOAD_FAILED": "Failed to download local os.js.",
            "REINSTALL_DECODING": "Parsing os.js as text",
            "REINSTALL_SETTING": "Setting os.js as bootloader",
            "REMOVING_INSTALLERS": "Removing installers...",
            "SETTING_FSCK_FLAG": "Creating .fsck file",
            "SETTING_FSCK_FLAG_FAILED": "Failed to create .fsck file.",
            "WIPING_SYSTEM": "Securely wiping system...",
            "WIPING_SYSTEM_FAILED": "Failed to securely wipe system.",
            "WORKING_HOURS_UNMET": "You attempted to log in outside of your working hours. Try again later.",
            "NETCONFIG_TITLE": "PCOS Network configurator",
            "NETCONFIG_DENY": "There are not enough permissions to configure PCOS Network.",
            "NETCONFIG_URLF": "Proxy URL: ",
            "NETCONFIG_AUTO": "Start on OS startup",
            "NETCONFIG_UC": "User-customizable part",
            "NETCONFIG_SAVE": "Save config",
            "NETCONFIG_PREDICT": "Predict address",
            "EMPTY_STATUSBAR": "Status",
            "NETCONFIG_SAVE_OK": "Configuration saved successfully",
            "NETCONFIG_SAVE_FAIL": "Failed to save config",
            "PCOS_STARTING": "PCOS is starting...",
            "FILE_PICKER": "File picker",
            "TEXT_EDITOR": "Text editor",
            "LOAD_BTN": "Load",
            "SAVE_BTN": "Save",
            "NETCONFIG_SYSIDM": "No System ID available",
            "NO_SAVE_IN_MTN": "You can't save in the mountpoint directory.",
            "INSTALLING_WP2L": "Installing wallpaper to lock screen",
            "OPTIONAL_COMPONENTS_TITLE": "Optional components",
            "NO_COMPONENTS_FILE": "The components file is missing, downloading from OS image.",
            "FAILED_COMPONENTS_DOWNLOAD": "Failed to download a components file.",
            "PARSING_COMPONENTS": "Parsing available components",
            "EXIT": "Exit",
            "DESCRIPTION_FIELD": "Description",
            "LICENSE_FIELD": "License",
            "REMOVE_BTN": "Remove",
            "MODIFYING_STATUS": "Modifying component...",
            "MODIFYING_SUCCESS": "Modification successful!",
            "MODIFYING_FAILED": "Modification failed.",
            "UNMOUNT_BTN": "Unmount",
            "BREAKOUT_DESCRIPTION": "The Breakout game example as coded by MDN",
            "INSTALLING_DARKMODE2L": "Installing dark mode preference to lock screen",
            "MESSAGE_ENTER": "Enter a message to display",
            "TIMEOUT_FIELD": "Timeout (ms)",
            "SECRET_FIELD_TXT": "Secret (text)",
            "SECRET_FIELD_HEX": "Secret (hex)",
            "REGENERATE": "Regenerate",
            "START_TIME_FIELD": "Start time",
            "END_TIME_FIELD": "End time",
            "PBKDF2_OPTION": "PBKDF2 (Password)",
            "INFORMATIVE_MESSAGE_OPTION": "Informative message",
            "INFORMATIVE_MESSAGE_DENY_OPTION": "Informative message (deny)",
            "TIMEOUT_OPTION": "Timeout",
            "TIMEOUT_DENY_OPTION": "Timeout (deny)",
            "SERVER_REPORT_OPTION": "Server reporting",
            "PCTOTP_OPTION": "PC's TOTP interpretation",
            "RFCTOTP_OPTION": "RFC TOTP",
            "WORKING_HOURS_OPTION": "Working hours",
            "PERSONAL_SECURITY_TITLE": "Personal Security",
            "PERSONAL_SECURITY_DENY": "Not enough privileges were granted for Personal Security.",
            "ADD_BTN": "Add"
        },
        ru: {
            "UNTITLED_APP": "Безымянное приложение",
            "PERMISSION_DENIED": "Отказано в доступе",
            "MORE_PERMISSION_DENIED": "Недостаточно прав для запуска этой программы.",
            "COMPATIBILITY_ISSUE_TITLE": "Проблема с совместимостью",
            "COMPATIBILITY_ISSUE": "Это приложение не может запускаться на этом компьютере как задача. Проверьте, есть ли у приложения режим \"isolatable\".",
            "APP_STARTUP_CRASH_TITLE": "Что-то пошло не так",
            "APP_STARTUP_CRASH": "Хостовая обработка этого приложения не удалась или это приложение вышло из строя при запуске.",
            "JS_TERMINAL": "Терминал JavaScript",
            "TERMINAL_INVITATION": "PCOS 3, сборка %s",
            "PCOS_RESTARTING": "PCOS перезагружается. %s",
            "PLEASE_WAIT": "Пожалуйста, подождите.",
            "POLITE_CLOSE_SIGNAL": "Отправка сигнала закрытия.",
            "ABRUPT_CLOSE_SIGNAL": "Отправка аварийного закрытия.",
            "UNMOUNTING_MOUNTS": "Размонтирование точек монтирования.",
            "SAFE_TO_CLOSE": "Теперь эту вкладку можно закрыть.",
            "RESTART_BUTTON": "Перезапустить",
            "RESTARTING": "Выполняется перезагрузка.",
            "INSTALL_PCOS": "Установить PCOS",
            "INSTALLER_TITLE": "Установщик PCOS 3",
            "CLOSE_INSTALLER_CONFIRMATION": "Вы уверены, что хотите остановить установку? Этот компьютер перезапустится.",
            "YES": "Да",
            "NO": "Нет",
            "INSTALLER_INVITATION": "Вы устанавливаете PCOS 3 сборки %s на этом компьютере.",
            "INSTALL_BUTTON": "Установить",
            "CLI_BUTTON": "Открыть терминал",
            "INSTALLER_PARTITIONING": "Выберите разделы загрузки и данных, которые вы хотите использовать.",
            "PARTITIONING_USE": "Использовать разделы",
            "PARTITION_DATA": "Раздел данных",
            "PARTITION_BOOT": "Раздел загрузки",
            "FORMAT_DATA": "Форматировать в PCFS",
            "DATA_INPUT_ALERT": "Введите имя раздела данных.",
            "PROMPT_PARTITION_TABLE": "Этот диск, кажется, не содержит таблицу разделов. Вы хотите вставить таблицу разделов?",
            "CONFIRM_PARTITION_ERASE": "Все данные на этом разделе будут удалены. Продолжить?",
            "BOOT_INPUT_ALERT": "Введите имя раздела загрузки.",
            "CANNOT_FIND_PARTITION": "Не удаётся найти раздел диска. Попробуйте форматировать раздел данных в PCFS.",
            "PCFS_DETECTION_ERROR": "Раздел данных, кажется, не содержит PCFS. Вы хотите использовать его?",
            "INSTALLING_PCOS": "Установка PCOS: %s",
            "CREATING_BOOT_PARTITION": "Создание раздела загрузки",
            "MOUNTING_DATA_PARTITION": "Монтирование раздела данных как 'target'",
            "CHANGING_ROOT_PERMISSIONS": "Изменение разрешений /",
            "COPYING_FOLDERS": "Копирование папок",
            "PREPARING_FOR_COPY": "Подготовка к копированию",
            "CHANGING_BOOT_PERMISSIONS": "Изменение разрешений /boot",
            "PATCHING_FS": "Изменение для монтирования раздела данных",
            "INSTALLATION_SUCCESSFUL": "Установка успешна. Закройте окно для перезагрузки.",
            "INSTALLATION_FAILED": "Установка не удалась. Попробуйте ещё раз. Закройте окно для перезагрузки.",
            "CREATING_DIR": "Создание %s",
            "COPYING_FILE": "Копирование %s",
            "COMPLETE_COPY": "Копирование %s завершено",
            "REMOVING_OBJECT": "Удаление %s",
            "COMPLETE_REMOVE": "Удаление %s завершено",
            "SHORT_DAYS": "%sдн",
            "SHORT_HOURS": "%sч",
            "SHORT_MINUTES": "%sмин",
            "SHORT_SECONDS": "%sс",
            "SHORT_MILLISECONDS": "%sмс",
            "SHORT_TERABYTES": "%sТБ",
            "SHORT_GIGABYTES": "%sГБ",
            "SHORT_MEGABYTES": "%sМБ",
            "SHORT_KILOBYTES": "%sКБ",
            "SHORT_BYTES": "%sБ",
            "AUTH_FAILED_NEW": "Аутентификация не удалась, пожалуйста, используйте новую сессию!",
            "AUTH_SUCCESS": "Аутентификация успешна!",
            "AUTH_FAILED": "Аутентификация не удалась.",
            "PLEASE_WAIT_TIME": "Пожалуйста, подождите %s",
            "REPORTING_LOGON": "Сообщаю о входе в систему серверу...",
            "TOTP_PC_PROMPT": "Введите код TOTP-PC",
            "TOTP_PROMPT": "Введите код TOTP",
            "ACCESS_NOT_SETUP": "Доступ к данному пользователю не настроен",
            "PASSWORD_PROMPT": "Введите пароль",
            "ENTER_BUTTON": "Ввод",
            "USERNAME_PROMPT": "Введите имя пользователя",
            "USERNAME": "Имя пользователя",
            "ACCESS_FN_FAIL": "Нет такого пользователя.",
            "PROMPT_GET_FAIL": "Что-то пошло не так при получении вопроса аутентификации.",
            "LET_TRY_AGAIN": "Давайте попробуем ещё раз.",
            "RESPONSE_PLACEHOLDER": "Ответ...",
            "START_MENU_BTN": "Пуск",
            "START_MENU": "Меню \"Пуск\"",
            "LOG_IN_INVITATION": "Войти в систему",
            "LOG_OUT_BUTTON": "Выйти (%s)",
            "LOCK_BUTTON": "Заблокировать",
            "TERMINAL_BUTTON": "Терминал",
            "TURN_OFF_BUTTON": "Выключить",
            "TERMINAL_PRIVILEGE_ERROR": "Вам не разрешено запускать неизолированный терминал.",
            "CANNOT_SHUTDOWN": "Вам не разрешено завершать работу системы.",
            "PASSWORD": "Пароль",
            "SET_UP_PCOS": "Настройка PCOS",
            "LET_SETUP_SYSTEM": "Давайте теперь настроим систему.",
            "SET_UP": "Настроить",
            "LET_CREATE_ACCOUNT": "Давайте создадим вашу учётную запись.",
            "CREATE": "Создать",
            "PASSWORD_INPUT_ALERT": "Введите пароль.",
            "SETUP_SUCCESSFUL": "Настройка успешна. Закройте окно для входа в систему.",
            "CREATING_USER_STRUCTURE": "Создание структуры пользователей",
            "CREATING_USER": "Создание пользователя",
            "INSTALLING_WPS": "Установка фонов",
            "INSTALLING_APPS": "Установка программ",
            "INSTALLING_WP2U": "Установка фона на пользователя",
            "REMOVING_2STAGE": "Удаление установщика 2-го этапа",
            "PATCHING_LOGON": "Изменение для требования входа в систему",
            "CONFIRM": "Подтвердить",
            "RIGHT_REVIEW": "Давайте рассмотрим ваши права.",
            "RIGHT_REVIEW_BTN": "Принять лицензию",
            "DARK_MODE": "Тёмная тема",
            "INSTALLING_DARKMODE": "Установка предпочтения тёмной темы",
            "CREATING_USER_HOME": "Создание домашнего каталога пользователя",
            "PROVISIONED_PREFERENCE": "Эта настройка управляется системным администратором.",
            "USERNAME_EXISTS": "Этот пользователь уже существует в системе.",
            "VIDEO_PLAYER": "Видеопроигрыватель",
            "INACCESSIBLE_FILE": "%s недоступен. Убедитесь, что у вас есть разрешения на доступ к нему, и что объект существует.",
            "FILE_NOT_SPECIFIED": "Файл не указан.",
            "PICTURE_VIEWER": "Просмотр изображений",
            "ISOLATED_TERM": "Изолированный JS терминал",
            "HELP_TERMINAL_ISOLATED": "help - Показать справочное меню\r\nclear - Очистить терминал\r\njs_ree - Запустить код JavaScript\r\n--- ЭКСПОРТИРОВАННЫЕ ИПП СОВ ---\r\n",
            "TERM_COMMAND_NOT_FOUND": "%s: команда не найдена",
            "FILE_EXPLORER": "Проводник",
            "GRANT_FEXP_PERM": "Пожалуйста, предоставьте разрешения на чтение файловых структур и просмотр списка разделов.",
            "GRANT_PERM": "Предоставить разрешения",
            "GRANT_FEXP_PERM_ADM": "Свяжитесь с администратором, чтобы предоставить разрешения на чтение файловых структур и просмотр списка разделов. (FS_READ, FS_LIST_PARTITIONS)",
            "GRANT_FEXP_PERM_USR": "Пожалуйста, предоставьте разрешения на чтение файловых структур и просмотр списка разделов используя иную учётную запись.",
            "BROWSE_FEXP": "Просмотр",
            "SPACE_SHOWER": "Хранение в \"%s\": использовано %s из %s (%s%)",
            "FILE_STRUCT_BROWSE_FAIL": "Невозможно просмотреть структуру:\n%s",
            "UNKNOWN_FS_STRUCT": "Неизвестная файловая структура \"%s\"",
            "UNKNOWN_FILE_TYPE": "Это неизвестный тип файла.",
            "TMGR_PERMISSION": "Диспетчеру задач не разрешено запускаться при этих условиях. Свяжитесь с системным администратором\nТребуемые разрешения: %s",
            "TASK_MANAGER": "Диспетчер задач",
            "BASENAME_TASK": "Имя",
            "USER_TASK": "Пользователь",
            "TERMINATE_TASK": "Завершить",
            "FULL_PATH_TASK": "Полный путь",
            "ARGUMENTS_TASK": "Параметры",
            "REMOVING_SETUP_STATE": "Удаление статуса установки",
            "LOGGING_OUT": "Выход из системы...",
            "PANIC_LINE1": "При использовании операционной системы была обнаружена критическая ошибка. Стабильность системы под угрозой.",
            "PANIC_LINE2": "Код ошибки: %s",
            "PANIC_UNSPECIFIED_ERROR": "НЕУКАЗАННАЯ_ОШИБКА",
            "PROBLEMATIC_COMPONENT": "Проблемный компонент: %s",
            "PROBLEMATIC_PARAMS": "Проблемные параметры: %s",
            "PROBLEMATIC_JS": "Проблемный JavaScript: %s: %s",
            "PANIC_LINE3": "Если вы видите эту ошибку в первый раз, попробуйте перезагрузить систему.",
            "PANIC_LINE4": "Если вы видите эту ошибку ещё раз, это значит, что что-то не так с системой.",
            "PANIC_LINE5": "Вы можете попытаться восстановить файловую систему, расположив файл .fsck в корневой точке монтирования системы, с любым значением в нём.",
            "PANIC_LINE6": "Далее выполняется процедура завершения работы:",
            "PANIC_TASK_KILLED": "задача:%s: убита",
            "PANIC_MOUNT_UNMOUNTED": "точка:%s: размонтирована",
            "PANIC_MOUNT_FAILED": "точка:%s: %s: %s",
            "SECURE_CONTEXT_REQUIRED": "Для PCOS 3 требуется безопасное соединение. Пожалуйста, убедитесь, что URL содержит https://.",
            "SWITCH_TO_SECURE_CTX": "Использовать HTTPS",
            "SHORT_YEARS": "%sг",
            "SHORT_MONTHS": "%sмес",
            "SYSADMIN_TOOLS_TITLE": "Утилиты для сисадминов",
            "SYSADMIN_TOOLS_PRIVFAIL": "Вы не являетесь системным администратором.",
            "REINSTALL_BUTTON": "Переустановить ОС",
            "FSCK_BUTTON": "Восстановить потерянные файлы",
            "SWIPE_BUTTON": "Безопасно удалить систему",
            "REINSTALL_DOWNLOADING": "Скачивание местного os.js...",
            "REINSTALL_DOWNLOAD_FAILED": "Не удалось скачать местный os.js.",
            "REINSTALL_DECODING": "Обработка os.js как текст",
            "REINSTALL_SETTING": "Задание os.js как загрузчика",
            "REMOVING_INSTALLERS": "Удаление установщиков...",
            "SETTING_FSCK_FLAG": "Создание файла .fsck...",
            "SETTING_FSCK_FLAG_FAILED": "Не удалось создать файл .fsck.",
            "WIPING_SYSTEM": "Безопасное удаление системы...",
            "WIPING_SYSTEM_FAILED": "Не удалось безопасно удалить систему.",
            "WORKING_HOURS_UNMET": "Вы попытались войти в систему вне рабочего времени. Повторите попытку позже.",
            "NETCONFIG_TITLE": "Конфигурация PCOS Network",
            "NETCONFIG_DENY": "Недостаточно разрешений для конфигурации PCOS Network.",
            "NETCONFIG_URLF": "URL прокси: ",
            "NETCONFIG_AUTO": "Запускать при загрузке ОС",
            "NETCONFIG_UC": "Изменяемое пользователем",
            "NETCONFIG_SAVE": "Сохранить конфиг.",
            "NETCONFIG_PREDICT": "Предсказать адрес",
            "EMPTY_STATUSBAR": "Статус",
            "NETCONFIG_SAVE_OK": "Конфигурация успешно сохранено",
            "NETCONFIG_SAVE_FAIL": "Не удалось сохранить конфиг.",
            "PCOS_STARTING": "PCOS приступает к работе...",
            "FILE_PICKER": "Выбор файла",
            "TEXT_EDITOR": "Текстовый редактор",
            "LOAD_BTN": "Загрузить",
            "SAVE_BTN": "Сохранить",
            "NETCONFIG_SYSIDM": "System ID недоступен",
            "NO_SAVE_IN_MTN": "Нельзя выполнять сохранение в папке монтирований.",
            "INSTALLING_WP2L": "Установка фона на экран блокировки",
            "OPTIONAL_COMPONENTS_TITLE": "Дополнительные компоненты",
            "NO_COMPONENTS_FILE": "Файл компонентов отсутствует, скачиваю с образа ОС",
            "FAILED_COMPONENTS_DOWNLOAD": "Не удалось скачать файл компонентов.",
            "PARSING_COMPONENTS": "Анализ доступных компонентов...",
            "EXIT": "Выйти",
            "DESCRIPTION_FIELD": "Описание",
            "LICENSE_FIELD": "Лицензия",
            "REMOVE_BTN": "Удалить",
            "MODIFYING_STATUS": "Модификация компонента...",
            "MODIFYING_SUCCESS": "Модификация успешна!",
            "MODIFYING_FAILED": "Модификация не удалась.",
            "UNMOUNT_BTN": "Размонтировать",
            "BREAKOUT_DESCRIPTION": "Игра-пример Breakout, как программировано в MDN",
            "INSTALLING_DARKMODE2L": "Установка предпочтения тёмной темы на экран блокировки",
            "MESSAGE_ENTER": "Введите сообщение для отображения",
            "TIMEOUT_FIELD": "Ожидание (мс)",
            "SECRET_FIELD_TXT": "Секретное значение (текст)",
            "SECRET_FIELD_HEX": "Секретное значение (шестнадцатиричное)",
            "REGENERATE": "Регенерировать",
            "START_TIME_FIELD": "Время начала",
            "END_TIME_FIELD": "Время конца",
            "PBKDF2_OPTION": "PBKDF2 (Пароль)",
            "INFORMATIVE_MESSAGE_OPTION": "Информативное сообщение",
            "INFORMATIVE_MESSAGE_DENY_OPTION": "Информативное сообщение (отказ)",
            "TIMEOUT_OPTION": "Ожидание",
            "TIMEOUT_DENY_OPTION": "Ожидание (отказ)",
            "SERVER_REPORT_OPTION": "Сообщение серверу",
            "PCTOTP_OPTION": "Интерпретация TOTP от PC",
            "RFCTOTP_OPTION": "TOTP по RFC",
            "WORKING_HOURS_OPTION": "График работы",
            "PERSONAL_SECURITY_TITLE": "Персональная безопасность",
            "PERSONAL_SECURITY_DENY": "Было предоставлено недостаточно привилегий для запуска Персональной безопасности.",
            "ADD_BTN": "Добавить"
        },
        defaultLocale: "en",
        get: function(key) {
            let lang = navigator.language.slice(0, 2).toLowerCase();
            let locale = locales[lang];
            if (!locale) locale = locales[locales.defaultLocale];
            if (!locale) locale = {};
            return locale[key] || key;
        }
    }
    modules.locales = locales;
    modules.startupWindow.content.innerText = locales.get("PCOS_STARTING");
}
localization();
// 07-tasks.js
function loadTasks() {
    // @pcos-app-mode native
    let tasks = {
        exec: async function(file, arg, windowObject, token) {
            windowObject.title.innerText = modules.locales.get("UNTITLED_APP");
            let taskId = crypto.getRandomValues(new Uint8Array(64)).reduce((a, b) => a + b.toString(16).padStart(2, "0"), "");
            let executablePermissions, executable;
            try {
                executablePermissions = await this.fs.permissions(file, token);
                executable = await this.fs.read(file);
            } catch (e) {
                windowObject.title.innerText = modules.locales.get("APP_STARTUP_CRASH_TITLE");
                windowObject.content.innerText = modules.locales.get("APP_STARTUP_CRASH");
                windowObject.closeButton.disabled = false;
                windowObject.closeButton.onclick = (e) => windowObject.windowDiv.remove() && e.stopPropagation();
                throw e;
            }
            if (!executablePermissions.world.includes("r") || !executablePermissions.world.includes("x")) {
                windowObject.title.innerText = modules.locales.get("PERMISSION_DENIED");
                windowObject.content.innerText = modules.locales.get("MORE_PERMISSION_DENIED");
                windowObject.closeButton.disabled = false;
                windowObject.closeButton.onclick = (e) => windowObject.windowDiv.remove() && e.stopPropagation();
                throw new Error("App isn't readable or isn't executable");
            }
            if (!executable.includes("// @pcos-app-mode isolat" + "able")) {
                windowObject.title.innerText = modules.locales.get("COMPATIBILITY_ISSUE_TITLE");
                windowObject.content.innerText = modules.locales.get("COMPATIBILITY_ISSUE");
                windowObject.closeButton.disabled = false;
                windowObject.closeButton.onclick = (e) => windowObject.windowDiv.remove() && e.stopPropagation();
                throw new Error("App is not isolatable");
            }
            let limitations = [];
            if (executable.includes("// =====BEGIN MANIFEST=====")) {
                let parsingLines = executable.split("\n");
                let parsingBoundStart = parsingLines.indexOf("// =====BEGIN MANIFEST=====");
                let parsingBoundEnd = parsingLines.indexOf("// =====END MANIFEST=====");
                let upToParse = parsingLines.slice(parsingBoundStart, parsingBoundEnd + 1);
                let knownLineTypes = ["allow", "deny"];
                for (let line of upToParse) {
                    let lineType = line.split(": ")[0].replace("// ", "");
                    if (knownLineTypes.includes(lineType)) {
                        let dataParts = line.replace("// " + lineType + ": ", "").split(", ");
                        for (let data of dataParts) limitations.push({ lineType, data });
                    }
                }
            }
            let ree = await this.ree(windowObject.content, token);
            try {
                modules.session.attrib(windowObject.sessionId, "openReeWindows", [ ...(modules.session.attrib(windowObject.sessionId, "openReeWindows") || []), taskId ]);
                arg = arg || [];
                if (!(arg instanceof Array)) arg = [];
                arg = arg.map(a => String(a));
                let that = this;
                ree.iframe.style = "width: 100%; height: 100%; border: none; top: 0; left: 0; position: absolute;";
                let reeAPIInstance = await modules.reeAPIInstance({ ree, ses: windowObject.sessionId, token, taskId, limitations });
                for (let action in reeAPIInstance.public) ree.exportAPI(action, (e) => reeAPIInstance.public[action](e.arg));
                this.tracker[taskId] = {
                    ree,
                    file: file,
                    arg: arg,
                    apis: reeAPIInstance,
                    critical: false,
                    cliio: {
                        attached: false,
                        piped: false
                    }
                };
                windowObject.closeButton.addEventListener("click", async function me() {
                    windowObject.closeButton.removeEventListener("click", me);
                    await that.sendSignal(taskId, 15);
                    windowObject.closeButton.disabled = true;
                    setTimeout(function() {
                        windowObject.closeButton.disabled = false;
                        windowObject.closeButton.addEventListener("click", async function() {
                            await that.sendSignal(taskId, 9);
                        });
                    }, 5000);
                });
                ree.exportAPI("attachCLI", function() {
                    if (that.tracker[taskId].cliio.attached) return true;
                    ree.iframe.hidden = true;
                    let termDiv = document.createElement("div");
                    let termInstance = new Terminal();
                    termInstance.open(termDiv);
                    windowObject.content.appendChild(termDiv);
                    that.tracker[taskId].cliio.attached = true;
                    that.tracker[taskId].cliio.xtermInstance = termInstance;
                    let onresizeFn = () => termInstance.resize(Math.floor(windowObject.content.clientWidth / 9), Math.floor(windowObject.content.clientHeight / 18));
                    onresizeFn();
                    let robs = new ResizeObserver(onresizeFn);
                    that.tracker[taskId].cliio.robsInstance = robs;
                    robs.observe(windowObject.windowDiv);
                    termInstance.clear();
                    return true;  
                });
                ree.exportAPI("toMyCLI", function(apiArg) {
                    if (that.tracker[taskId].cliio.attached) that.tracker[taskId].cliio.xtermInstance.write(apiArg.arg);
                });
                ree.exportAPI("fromMyCLI", function() {
                    if (!that.tracker[taskId].cliio.attached) return false;
                    let ti = that.tracker[taskId].cliio.xtermInstance;
                    return new Promise(function(resolve) {
                        let d = ti.onData(function(e) {
                            resolve(e);
                            d.dispose();
                        });
                    });
                });
                ree.exportAPI("clearMyCLI", function() {
                    if (that.tracker[taskId].cliio.attached) that.tracker[taskId].cliio.xtermInstance.clear();
                });
                ree.exportAPI("detachCLI", function() {
                    if (!that.tracker[taskId].cliio.attached) return true;
                    that.tracker[taskId].cliio.attached = false;
                    that.tracker[taskId].cliio.xtermInstance.clear();
                    that.tracker[taskId].cliio.xtermInstance.dispose();
                    that.tracker[taskId].cliio.robsInstance.disconnect();
                    that.tracker[taskId].cliio.robsInstance = null;
                    return true;
                });
                ree.exportAPI("windowVisibility", (apiArg) => windowObject.windowDiv.classList.toggle("hidden", !apiArg.arg));
                ree.exportAPI("windowTitleSet", (apiArg) => windowObject.title.innerText = apiArg.arg);
                ree.exportAPI("windowResize", function(apiArg) {
                    if (reeAPIInstance.public.getPrivileges().includes("GRAB_ATTENTION")) {
                        windowObject.windowDiv.style.width = apiArg.arg[0] + "px";
                        windowObject.windowDiv.style.height = apiArg.arg[1] + "px";
                    }
                });
                ree.exportAPI("windowRelocate", function(apiArg) {
                    if (reeAPIInstance.public.getPrivileges().includes("GRAB_ATTENTION")) {
                        windowObject.windowDiv.style.top = apiArg.arg[0] + "px";
                        windowObject.windowDiv.style.left = apiArg.arg[1] + "px";
                    }
                });
                ree.exportAPI("windowFullscreen", function(apiArg) {
                    if (reeAPIInstance.public.getPrivileges().includes("GRAB_ATTENTION")) {
                        windowObject.windowDiv.classList.toggle("fullscreen", apiArg.arg);
                    }
                });
                ree.exportAPI("closeability", (apiArg) => windowObject.closeButton.disabled = !apiArg.arg);
                ree.exportAPI("critical", function(apiArg) {
                    if (reeAPIInstance.public.getPrivileges().includes("SYSTEM_STABILITY")) {
                        that.tracker[taskId].critical = !!apiArg.arg;
                    }
                });
                await ree.eval("taskId = " + JSON.stringify(taskId) + ";");
                await ree.eval("exec_args = " + JSON.stringify(arg) + ";");
                ree.beforeCloseDown(function() {
                    let orw = modules.session.attrib(windowObject.sessionId, "openReeWindows");
                    orw.splice(orw.indexOf(taskId), 1);
                    modules.session.attrib(windowObject.sessionId, "openReeWindows", orw);
                    if (that.tracker[taskId].cliio.attached) {    
                        that.tracker[taskId].cliio.attached = false;
                        that.tracker[taskId].cliio.xtermInstance.clear();
                        that.tracker[taskId].cliio.xtermInstance.dispose();
                        that.tracker[taskId].cliio.robsInstance.disconnect();
                        that.tracker[taskId].cliio.robsInstance = null;
                    }
                });
                ree.beforeCloseDown(() => windowObject.windowDiv.remove());
                ree.beforeCloseDown(() => delete that.tracker[taskId]);
                await ree.eval(executable);
            } catch (e) {
                ree.closeDown();
                windowObject.title.innerText = modules.locales.get("APP_STARTUP_CRASH_TITLE");
                windowObject.content.innerText = modules.locales.get("APP_STARTUP_CRASH");
                windowObject.closeButton.disabled = false;
                windowObject.windowDiv.classList.toggle("hidden", false);
                windowObject.closeButton.onclick = (e) => windowObject.windowDiv.remove() && e.stopPropagation();
                throw e;
            }
            return taskId;
        },
        sendSignal: async function(taskId, signal, bypassCritical) {
            if (signal == 9) {
                if (this.tracker[taskId].critical && !bypassCritical) {
                    let memory = this.tracker[taskId];
                    await memory.ree.closeDown();
                    await panic("CRITICAL_TASK_FAILED", {
                        name: memory.file,
                        params: memory.arg
                    });
                    throw new Error("CRITICAL_TASK_FAILED");
                }
                return await this.tracker[taskId].ree.closeDown();
            }
            return await this.tracker[taskId].ree.eval("dispatchEvent(new CustomEvent(\"signal\", { detail: " + JSON.stringify(signal) + ", bubbles: true }));");
        },
        runsProperly: async function(taskId) {
            try {
                return await this.tracker[taskId].ree.eval("true");
            } catch (e) {
                return false;
            }
        },
        listPublicTasks: () => Object.keys(tasks.tracker),
        taskInfo: async function(taskId) {
            if (!this.tracker.hasOwnProperty(taskId)) return null;
            let info = await modules.tokens.info(this.tracker[taskId].apis.public.getProcessToken());
            if (!info) info = { user: "nobody" };
            return {
                file: this.tracker[taskId].file,
                arg: this.tracker[taskId].arg,
                runBy: info.user
            }
        },
        tracker: {},
        fs: modules.fs,
        ree: modules.core.createREE
    };
    
    modules.tasks = tasks;
}
loadTasks();
// 08-tty.js
async function js_terminal() {
    // @pcos-app-mode native
    let windowtty = await modules.window(modules.session.active);
    windowtty.title.innerText = modules.locales.get("JS_TERMINAL");
    windowtty.closeButton.onclick = function() {
        windowtty.windowDiv.remove();
    }
    windowtty.content.style.padding = "0px";
    windowtty.content.style.margin = "0px";
    let termDiv = document.createElement("div");
    windowtty.content.appendChild(termDiv);
    let term = new Terminal();
    term.open(termDiv);
    let onresizeFn = () => term.resize(Math.floor(windowtty.content.clientWidth / 9), Math.floor(windowtty.content.clientHeight / 18));
    onresizeFn();
    let robs = new ResizeObserver(onresizeFn);
    robs.observe(windowtty.windowDiv);
    term.clear();
    term.write(modules.locales.get("TERMINAL_INVITATION").replace("%s", pcos_version) + "\r\n\r\n");
    term.write("> ");
    let command = "";
    term.onData(function(e) {
        if (e == "\r") {
            term.write("\r\n");
            try {
                term.write(JSON.stringify(eval(command)) + "\r\n");
            } catch (e) {
                term.write(e + "\r\n");
            }
            term.write("> ");
            command = "";
        } else if (e == '\u007F') {
            if (command.length > 0) {
                command = command.substr(0, command.length - 1);
                term.write('\b \b');
            }
        } else {
            if (e >= String.fromCharCode(0x20) && e <= String.fromCharCode(0x7E) || e >= '\u00a0') {
                command += e;
                term.write(e);
            }
        }
    });
    return windowtty;
}
// 09-restart.js
function restartLoad() {
    // @pcos-app-mode native
    function timeout(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    function allProcessesClosed() {
        return new Promise(function(resolve) {
            let int = setInterval(function() {
                if (Object.keys(modules.tasks.tracker).length == 0) {
                    resolve();
                    clearInterval(int);
                }
            })
        });
    }
    
    async function restart(noAutomaticReload = false, token) {
        let window = modules.window;
        let fs = modules.fs;
        let tasks = modules.tasks;
        modules.session.muteAllSessions();
        modules.session.activateSession(modules.session.systemSession);
        let windowDiv = window(modules.session.systemSession, true);
        windowDiv.closeButton.disabled = true;
        windowDiv.title.innerText = modules.locales.get("PCOS_RESTARTING").replace("%s", "");
        windowDiv.content.style.padding = "8px";
        let description = document.createElement("p");
        description.innerText = modules.locales.get("PCOS_RESTARTING").replace("%s",  modules.locales.get("PLEASE_WAIT"));
        windowDiv.content.appendChild(description);
        description.innerText = modules.locales.get("PCOS_RESTARTING").replace("%s",  modules.locales.get("POLITE_CLOSE_SIGNAL"));
        for (let taskId in tasks.tracker) tasks.sendSignal(taskId, 15);
        await Promise.race([
            timeout(5000),
            allProcessesClosed()
        ]);
        description.innerText = modules.locales.get("PCOS_RESTARTING").replace("%s",  modules.locales.get("ABRUPT_CLOSE_SIGNAL"));
        for (let taskId in tasks.tracker) tasks.sendSignal(taskId, 9, true);
        await allProcessesClosed();
        description.innerText = modules.locales.get("PCOS_RESTARTING").replace("%s",  modules.locales.get("UNMOUNTING_MOUNTS"));
        for (let mount in fs.mounts) await fs.unmount(mount, token);
        description.innerText = modules.locales.get("PCOS_RESTARTING").replace("%s",  modules.locales.get("RESTARTING"));
        modules.killSystem();
        if (!noAutomaticReload) return location.reload()
        description.innerText = modules.locales.get("SAFE_TO_CLOSE");
        let button = document.createElement("button");
        button.innerText = modules.locales.get("RESTART_BUTTON");
        button.onclick = function() {
            description.innerText = modules.locales.get("PCOS_RESTARTING").replace("%s",  modules.locales.get("RESTARTING"));
            button.remove();
            location.reload();
        }
        windowDiv.content.appendChild(button);
    }
    
    modules.restart = restart;
}

restartLoad();
// 10-installer.js
function installer() {
    // @pcos-app-mode native
    let window = modules.window;
    let windowDiv = window(modules.session.active);
    windowDiv.title.innerText = modules.locales.get("INSTALL_PCOS");
    windowDiv.closeButton.onclick = function() {
        windowDiv.windowDiv.hidden = true;
        let windowDivConfirm = window(modules.session.active);
        windowDivConfirm.closeButton.onclick = function() {
            windowDivConfirm.windowDiv.remove();
            windowDiv.windowDiv.hidden = false;
        };
        windowDivConfirm.title.innerText = modules.locales.get("CONFIRM");
        windowDivConfirm.content.style.padding = "8px";
        let description = document.createElement("p");
        let buttonYes = document.createElement("button");
        let buttonNo = document.createElement("button");
        description.innerText = modules.locales.get("CLOSE_INSTALLER_CONFIRMATION");
        buttonYes.innerText = modules.locales.get("YES");
        buttonNo.innerText = modules.locales.get("NO");
        buttonNo.onclick = () => windowDivConfirm.closeButton.click();
        buttonYes.onclick = function() {
            windowDivConfirm.windowDiv.remove();
            windowDiv.windowDiv.remove();
            modules.restart();
        }
        windowDivConfirm.content.appendChild(description);
        windowDivConfirm.content.appendChild(buttonYes);
        windowDivConfirm.content.insertAdjacentText("beforeend", " ");
        windowDivConfirm.content.appendChild(buttonNo);
    }
    windowDiv.content.style.padding = "8px";
    let header = document.createElement("b");
    let postHeader = document.createElement("br");
    let description = document.createElement("span");
    let content = document.createElement("div");
    let recovery_btn = document.createElement("button");
    let button = document.createElement("button");
    header.innerText = modules.locales.get("INSTALLER_TITLE");
    description.innerText = modules.locales.get("INSTALLER_INVITATION").replace("%s", pcos_version);
    button.innerText = modules.locales.get("INSTALL_BUTTON");
    recovery_btn.innerText = modules.locales.get("CLI_BUTTON");
    content.appendChild(recovery_btn);
    windowDiv.content.appendChild(header);
    windowDiv.content.appendChild(postHeader);
    windowDiv.content.appendChild(description);
    windowDiv.content.appendChild(content);
    windowDiv.content.appendChild(button);
    recovery_btn.onclick = async function() {
        windowDiv.windowDiv.hidden = true;
        let windowtty = await js_terminal();
        windowtty.closeButton.addEventListener("click", () => {
            windowDiv.windowDiv.hidden = false;
        })
    }
    button.onclick = function() {
        header.remove();
        postHeader.remove();
        content.innerHTML = "";
        if (!isSecureContext) {
            description.innerText = modules.locales.get("SECURE_CONTEXT_REQUIRED");
            button.innerText = modules.locales.get("SWITCH_TO_SECURE_CTX");
            button.onclick = function() {
                button.remove();
                windowDiv.windowDiv.remove();
                location.protocol = "https:";
            };
            return;
        }
        description.innerText = modules.locales.get("RIGHT_REVIEW");
        let textareaLicense = document.createElement("textarea");
        textareaLicense.readOnly = true;
        textareaLicense.style.width = "100%";
        textareaLicense.style.height = "100%";
        content.style.height = "100%";
        textareaLicense.value = `Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`;
        content.appendChild(textareaLicense);
        button.innerText = modules.locales.get("RIGHT_REVIEW_BTN");
        button.onclick = function() {
            content.innerHTML = "";
            content.style.height = "";
            description.innerText = modules.locales.get("INSTALLER_PARTITIONING");
            button.innerText = modules.locales.get("PARTITIONING_USE");
            let partitionDataInput = document.createElement("input");
            let partitionDataFormat = document.createElement("button");
            let partitionBootInput = document.createElement("input");
            partitionDataInput.placeholder = modules.locales.get("PARTITION_DATA");
            partitionDataFormat.innerText = modules.locales.get("FORMAT_DATA");
            partitionBootInput.placeholder = modules.locales.get("PARTITION_BOOT");
            partitionDataInput.value = "data";
            partitionBootInput.value = "boot";
            content.appendChild(partitionDataInput);
            content.insertAdjacentText("beforeend", " ");
            content.appendChild(partitionDataFormat);
            content.appendChild(document.createElement("br"));
            content.appendChild(partitionBootInput);
            partitionDataFormat.onclick = function() {
                if (!partitionDataInput.value) return alert(modules.locales.get("DATA_INPUT_ALERT"));
                let diskPart;
                try {
                    diskPart = modules.core.disk.partition(partitionDataInput.value);
                } catch {
                    if (!confirm(modules.locales.get("PROMPT_PARTITION_TABLE"))) return;
                    modules.core.disk.insertPartitionTable();
                    diskPart = modules.core.disk.partition(partitionDataInput.value);
                }
                let confirmErasePart = confirm(modules.locales.get("CONFIRM_PARTITION_ERASE"));
                if (confirmErasePart) {
                    diskPart.setData({
                        files: {},
                        permissions: {}
                    });
                }
                return;
            }
            button.onclick = async function() {
                let diskDataPartition = partitionDataInput.value;
                let diskBootPartition = partitionBootInput.value;
                if (!diskDataPartition) return alert(modules.locales.get("DATA_INPUT_ALERT"));
                if (!diskBootPartition) return alert(modules.locales.get("BOOT_INPUT_ALERT"));
                let diskDataPartitionReadable;
                try {
                    diskDataPartitionReadable = modules.core.disk.partition(diskDataPartition);
                } catch {
                    return alert(modules.locales.get("CANNOT_FIND_PARTITION"));
                }
                let tempCopy = Object.keys(diskDataPartitionReadable.getData() || {});
                if (!tempCopy.includes("files") || !tempCopy.includes("permissions"))
                    if (!confirm(modules.locales.get("PCFS_DETECTION_ERROR"))) return;
                tempCopy = null;
                diskDataPartitionReadable = null;
                content.innerHTML = "";
                button.hidden = true;
                description.innerHTML = modules.locales.get("INSTALLING_PCOS").replace("%s", modules.locales.get("PLEASE_WAIT"));
                windowDiv.closeButton.disabled = true;
                description.innerHTML = modules.locales.get("INSTALLING_PCOS").replace("%s", modules.locales.get("CREATING_BOOT_PARTITION"));
                modules.core.disk.partition(diskBootPartition).setData(`
                try {
                    const AsyncFunction = (async () => {}).constructor;
                    let pre_boot_modules = coreExports.disk.partition(${JSON.stringify(diskDataPartition)}).getData()?.files;
                    if (!pre_boot_modules) {
                        coreExports.tty_bios_api.println("No files were found in the storage partition");
                        throw new Error("No files were found in the storage partition");
                    }
                    pre_boot_modules = pre_boot_modules.boot;
                    if (!pre_boot_modules) {
                        coreExports.tty_bios_api.println("No boot modules were found");
                        throw new Error("No boot modules were found");
                    }
                    let pre_boot_module_list = Object.keys(pre_boot_modules);
                    pre_boot_module_list = pre_boot_module_list.sort((a, b) => a.localeCompare(b));
                    let pre_boot_module_script = "";
                    for (let module of pre_boot_module_list) pre_boot_module_script += await coreExports.idb.readPart(pre_boot_modules[module]);
                    await new AsyncFunction(pre_boot_module_script)();
                } catch (e) {
                    coreExports.tty_bios_api.println("Boot failed");
                    coreExports.tty_bios_api.println("Press Enter to continue and log this error locally");
                    await coreExports.tty_bios_api.inputLine();
                    throw e;
                }
                `);
                try {
                    description.innerHTML = modules.locales.get("INSTALLING_PCOS").replace("%s", modules.locales.get("MOUNTING_DATA_PARTITION"));
                    modules.fs.mounts["target"] = await modules.mounts.PCFSiDBMount({
                        partition: diskDataPartition
                    });
                    description.innerHTML = modules.locales.get("INSTALLING_PCOS").replace("%s", modules.locales.get("CHANGING_ROOT_PERMISSIONS"));
                    await modules.fs.chown("target", "root");
                    await modules.fs.chgrp("target", "root");
                    await modules.fs.chmod("target", "rx");
                    description.innerHTML = modules.locales.get("INSTALLING_PCOS").replace("%s", modules.locales.get("COPYING_FOLDERS"));
                    let describeProgress = document.createElement("p");
                    describeProgress.innerText = modules.locales.get("PREPARING_FOR_COPY");
                    content.appendChild(describeProgress);
                        await copyBoot("/boot", "target", function(text) {
                            return new Promise(function(resolve) {
                                describeProgress.innerText = text;
                                requestAnimationFrame(() => resolve());
                            });
                        });
                    description.innerHTML = modules.locales.get("INSTALLING_PCOS").replace("%s", modules.locales.get("CHANGING_BOOT_PERMISSIONS"));
                    content.innerHTML = "";
                    await modules.fs.chown("target/boot", "root");
                    await modules.fs.chgrp("target/boot", "root");
                    await modules.fs.chmod("target/boot", "rx");
                    description.innerHTML = modules.locales.get("INSTALLING_PCOS").replace("%s", modules.locales.get("PATCHING_FS"));
                    let systemCode = "let localSystemMount = \"storage\";\nlet mountOptions = {\n\tpartition: " + JSON.stringify(diskDataPartition) + "\n};\ntry {\n\tmodules.fs.mounts[localSystemMount] = await modules.mounts.PCFSiDBMount(mountOptions);\n\tmodules.defaultSystem = localSystemMount;\n} catch (e) {\n\tawait panic(\"SYSTEM_PARTITION_MOUNTING_FAILED\", { underlyingJS: e, name: \"fs.mounts\", params: [localSystemMount, mountOptions]});\n}\n";
                    await modules.fs.write("target/boot/01-fsboot.js", systemCode);
                    description.innerHTML = modules.locales.get("INSTALLATION_SUCCESSFUL");
                    windowDiv.closeButton.disabled = false;
                    windowDiv.closeButton.onclick = () => modules.restart();
                } catch (e) {
                    console.error(e);
                    description.innerHTML = modules.locales.get("INSTALLATION_FAILED");
                    windowDiv.closeButton.disabled = false;
                    windowDiv.closeButton.onclick = () => modules.restart();
                    throw e;
                }
            }
        }
    }
}

async function copyBoot(currentDir = "/boot", targetMount = "storage", progressSet) {
    let dirList = await modules.fs.ls(modules.defaultSystem + currentDir);
    try {
        await recursiveRemove(targetMount + currentDir, progressSet);
    } catch (e) {
        if (e.message != "No such directory") throw e;
    }
    await progressSet(modules.locales.get("CREATING_DIR").replace("%s", currentDir));
    await modules.fs.mkdir(targetMount + currentDir);
    for (let fileIndex in dirList) {
        let file = dirList[fileIndex];
        await progressSet(modules.locales.get("COPYING_FILE").replace("%s", currentDir + "/" + file) + " | " + (Number(fileIndex) + 1) + "/" + dirList.length + " | " + ((Number(fileIndex) + 1) / dirList.length * 100).toFixed(2) + "%");
        let permissions = await modules.fs.permissions(modules.defaultSystem + currentDir + "/" + file);
        if (await isDirectory(modules.defaultSystem + currentDir + "/" + file)) await copyBoot(currentDir + "/" + file, targetMount, progressSet);
        else await modules.fs.write(targetMount + currentDir + "/" + file, await modules.fs.read(modules.defaultSystem + currentDir + "/" + file));
        await modules.fs.chown(targetMount + currentDir + "/" + file, permissions.owner);
        await modules.fs.chgrp(targetMount + currentDir + "/" + file, permissions.group);
        await modules.fs.chmod(targetMount + currentDir + "/" + file, permissions.world);
    }
    await progressSet(modules.locales.get("COMPLETE_COPY").replace("%s", currentDir));
}

async function isDirectory(path) {
    try {
        await modules.fs.read(path);
        return false;
    } catch {
        return true;
    }
}

async function recursiveRemove(path, progressSet) {
    await progressSet(modules.locales.get("REMOVING_OBJECT").replace("%s", path));
    let dirList = await modules.fs.ls(path);
    for (let fileIndex in dirList) {
        let file = dirList[fileIndex];
        await progressSet(modules.locales.get("REMOVING_OBJECT").replace("%s", path + "/" + file) + " | " + (Number(fileIndex) + 1) + "/" + dirList.length + " | " + ((Number(fileIndex) + 1) / dirList.length * 100).toFixed(2) + "%");
        if (await isDirectory(path + "/" + file)) await recursiveRemove(path + "/" + file);
        else await modules.fs.rm(path + "/" + file);
    }
    await modules.fs.rm(path);
    await progressSet(modules.locales.get("COMPLETE_REMOVE").replace("%s", path));
}

function setupbase() {
    let fsmount = {
        read: async function (key) {
            let pathParts = key.split("/");
            if (pathParts[0] == "") pathParts = pathParts.slice(1);
            let files = this.backend.files;
            for (let part of pathParts) {
                files = files[part];
                if (!files) throw new Error("No such file");
            }
            if (typeof files === "object") throw new Error("Is a directory");
            return files;
        },
        ls: async function (directory) {
            let pathParts = directory.split("/");
            if (pathParts[0] == "") pathParts = pathParts.slice(1);
            let files = this.backend.files;
            for (let part of pathParts) {
                files = files[part];
                if (!files) throw new Error("No such directory");
            }
            if (typeof files !== "object") throw new Error("Is a file");
            return Object.keys(files);
        },
        permissions: async function (file) {
            return this.backend.permissions[file] || {
                owner: "root",
                group: "root",
                world: "",
            };
        },
        sync: () => {},
        directory_supported: true,
        read_only: true,
        permissions_supported: true,
        backend: {
            files: {
                etc: {
                    security: {
                        users: JSON.stringify({
                            root: {
                                groups: [ "root" ],
                                securityChecks: [
                                    {
                                        type: "timeout",
                                        timeout: 0
                                    }
                                ],
                                homeDirectory: "installer/root"
                            },
                            nobody: {
                                groups: [ "nobody" ],
                                securityChecks: [],
                                homeDirectory: "installer"
                            }
                        }),
                        automaticLogon: "root"
                    } 
                },
                boot: {
                    "00-pcos.js": "// @pcos-app-mode native\nconst pcos_version = " + JSON.stringify(modules.pcos_version) + ";\n\nlet modules = {\n     core: coreExports\n};\nglobalThis.modules = modules;\nmodules.pcos_version = pcos_version;\n" + panic.toString() + "\n" + startupMemo.toString() + "\nstartupMemo();\n",
                    "01-fs.js": loadFs.toString() + "\nloadFs();\n",
                    "01-fsboot.js": "/* no-op */",
                    "01-fsck.js": fsck.toString() + "\nawait fsck();\n",
                    "01-setup-state.js": "modules.settingUp = true;\n",
                    "02-ui.js": loadUi.toString() + "\nloadUi();\n",
                    "03-xterm.js": xterm_export.toString() + "\nxterm_export();\n",
                    "04-ipc.js": loadIpc.toString() + "\nloadIpc();\n",
                    "04-websockets.js": loadWebsocketSupport.toString() + "\nloadWebsocketSupport();\n",
                    "05-reeapis.js": reeAPIs.toString() + "\nreeAPIs();\n",
                    "06-csp.js": loadBasicCSP.toString() + "\nloadBasicCSP();\n",
                    "06-locales.js": localization.toString() + "\nlocalization();\n",
                    "07-tasks.js": loadTasks.toString() + "\nloadTasks();\n",
                    "08-tty.js": js_terminal.toString() + "\n",
                    "09-restart.js": restartLoad.toString() + "\nrestartLoad();\n",
                    "11-userfriendliness.js": loadUserFriendly.toString() + "\nloadUserFriendly();\n",
                    "12-tokens.js": setupTokens.toString() + "\nsetupTokens();\n",
                    "12-users.js": setupUsers.toString() + "\nawait setupUsers();\n",
                    "13-authui.js": authui.toString() + "\nmodules.authui = authui;\n",
                    "14-logon-requirement.js": requireLogon.toString() + "\n" + waitForLogon.toString() + "\n" + hookButtonClick.toString() + "\n",
                    "14-logon-requirement-enforce.js": "/* no-op */",
                    "15-apps.js": videoPlayerInstaller.toString() + "\n" + pictureInstaller.toString() + "\n" + terminalInstaller.toString() + "\n" + explorerInstaller.toString() + "\n" + filePickerInstaller.toString() + "\n" + taskMgrInstaller.toString() + "\n" + sysadminInstaller.toString() + "\n" + networkInstaller.toString() + "\n" + textEditorInstaller.toString() + "\n" + personalSecurityInstaller.toString() + "\n",
                    "15-optional.js": opt.toString() + "\nopt();\n",
                    "16-wallpaper.js": installWallpapers.toString() + "\n",
                    "17-installer-secondstage.js": secondstage.toString() + "\nsecondstage();\n",
                    "99-finished.js": systemKillWaiter.toString() + "\nreturn await systemKillWaiter();"
                },
                root: {}
            },
            permissions: {
                "etc/security/users": {
                    owner: "root",
                    group: "root",
                    world: ""
                },
                "etc/security/groups": {
                    owner: "root",
                    group: "root",
                    world: "r"
                },
                "etc/security/automaticLogon": {
                    owner: "root",
                    group: "root",
                    world: "r"
                }
            }
        }
    };
    for (let file in fsmount.backend.files.boot) {
        fsmount.backend.permissions["boot/" + file] = {
            owner: "root",
            group: "root",
            world: "rx"
        };
    }
    modules.fs.mounts["installer"] = fsmount;
    modules.defaultSystem = "installer";
}

setupbase();
installer();
// 11-userfriendliness.js
function loadUserFriendly() {
    // @pcos-app-mode native
    modules.userfriendliness = {
        inconsiderateTime: function(ms, majorUnitsOnly, displayMs) {
            let string = "";
            let days = Math.floor(ms / 86400000);
            let hours = Math.floor(ms / 3600000) % 24;
            let minutes = Math.floor(ms / 60000) % 60;
            let seconds = Math.floor(ms / 1000) % 60;
            if (days) string = string + modules.locales.get("SHORT_DAYS").replace("%s", days) + " ";
            if (days && majorUnitsOnly) return string;
            if (hours) string = string + modules.locales.get("SHORT_HOURS").replace("%s", hours) + " ";
            if (hours && majorUnitsOnly) return string;
            if (minutes) string = string + modules.locales.get("SHORT_MINUTES").replace("%s", minutes) + " ";
            if (minutes && majorUnitsOnly) return string;
            if (seconds) string = string + modules.locales.get("SHORT_SECONDS").replace("%s", seconds) + " ";
            if (displayMs && (ms % 1000)) {
                if (seconds && majorUnitsOnly) return string;
                string = string + modules.locales.get("SHORT_MILLISECONDS").replace("%s", (ms % 1000)) + " ";
            }
            return string;
        },
        informationUnits: function(bytes, majorUnitsOnly) {
            let string = "";
            let tb = Math.floor(bytes / (1024 * 1024 * 1024 * 1024));
            let gb = Math.floor(bytes / (1024 * 1024 * 1024)) % 1024;
            let mb = Math.floor(bytes / (1024 * 1024)) % 1024;
            let kb = Math.floor(bytes / 1024) % 1024;
            let b = bytes % 1024;
            if (tb) string = string + modules.locales.get("SHORT_TERABYTES").replace("%s", tb) + " ";
            if (tb && majorUnitsOnly) return string;
            if (gb) string = string + modules.locales.get("SHORT_GIGABYTES").replace("%s", gb) + " ";
            if (gb && majorUnitsOnly) return string;
            if (mb) string = string + modules.locales.get("SHORT_MEGABYTES").replace("%s", mb) + " ";
            if (mb && majorUnitsOnly) return string;
            if (kb) string = string + modules.locales.get("SHORT_KILOBYTES").replace("%s", kb) + " ";
            if (kb && majorUnitsOnly) return string;
            if (b) string = string + modules.locales.get("SHORT_BYTES").replace("%s", b);
            if (b && majorUnitsOnly) return string;
            return string;
        },
        considerateTime: function(ms, majorUnitsOnly, displayMs) {
            let dateObject = new Date(ms + (new Date(0).getTimezoneOffset() * 60000));
            let string = "";
            let years = dateObject.getFullYear() - 1970;
            let months = dateObject.getMonth();
            let days = dateObject.getDate() - 1;
            let hours = dateObject.getHours();
            let minutes = dateObject.getMinutes();
            let seconds = dateObject.getSeconds();
            let millisec = dateObject.getMilliseconds();
            if (years) string = string + modules.locales.get("SHORT_YEARS").replace("%s", years) + " ";
            if (years && majorUnitsOnly) return string;
            if (months) string = string + modules.locales.get("SHORT_MONTHS").replace("%s", months) + " ";
            if (months && majorUnitsOnly) return string;
            if (days) string = string + modules.locales.get("SHORT_DAYS").replace("%s", days) + " ";
            if (days && majorUnitsOnly) return string;
            if (hours) string = string + modules.locales.get("SHORT_HOURS").replace("%s", hours) + " ";
            if (hours && majorUnitsOnly) return string;
            if (minutes) string = string + modules.locales.get("SHORT_MINUTES").replace("%s", minutes) + " ";
            if (minutes && majorUnitsOnly) return string;
            if (seconds) string = string + modules.locales.get("SHORT_SECONDS").replace("%s", seconds) + " ";
            if (displayMs && millisec) {
                if (seconds && majorUnitsOnly) return string;
                string = string + modules.locales.get("SHORT_MILLISECONDS").replace("%s", (millisec % 1000)) + " ";
            }
            return string;
        }
    }
}
loadUserFriendly();
// 12-tokens.js
function setupTokens() {
    // @pcos-app-mode native
    modules.tokens = {
        generate: async function() {
            let rng = crypto.getRandomValues(new Uint8Array(64));
            let token = Array.from(rng).map(x => x.toString(16).padStart(2, "0")).join("");
            this._tokens[token] = { privileges: [], user: "nobody", groups: [] };
            return token;
        },
        revoke: async function(token) {
            delete this._tokens[token];
        },
        setPrivileges: async function(token, privileges) {
            this._tokens[token].privileges = privileges;
        },
        addPrivilege: async function(token, privilege) {
            this._tokens[token].privileges.push(privilege);
        },
        addPrivileges: async function(token, privileges) {
            this._tokens[token].privileges.push(...privileges);
        },
        removePrivilege: async function(token, privilege) {
            this._tokens[token].privileges = this._tokens[token].privileges.filter(x => x != privilege);
        },
        userInitialize: async function(token, user) {
            this._tokens[token].user = user;
            this._tokens[token].groups = (await modules.users.getUserInfo(user, token)).groups || [];
            this._tokens[token].privileges = ["FS_READ", "FS_WRITE", "FS_REMOVE", "FS_CHANGE_PERMISSION", "FS_LIST_PARTITIONS", "IPC_CREATE_PIPE", "IPC_LISTEN_PIPE", "IPC_SEND_PIPE", "IPC_CHANGE_PERMISSION", "ELEVATE_PRIVILEGES", "GET_USER_INFO", "SET_SECURITY_CHECKS", "START_TASK", "LIST_TASKS", "SIGNAL_TASK", "FETCH_SEND", "CSP_OPERATIONS", "IDENTIFY_SYSTEM", "WEBSOCKETS_OPEN", "WEBSOCKETS_LISTEN", "WEBSOCKETS_SEND", "WEBSOCKET_SET_PERMISSIONS", "MANAGE_TOKENS", "WEBSOCKETS_CLOSE", "GRAB_ATTENTION"];
            if (user == "root") this._tokens[token].privileges.push("FS_UNMOUNT", "SYSTEM_SHUTDOWN", "SWITCH_USERS_AUTOMATICALLY", "USER_INFO_OTHERS", "USER_INFO_SET", "FS_BYPASS_PERMISSIONS", "IPC_BYPASS_PERMISSIONS", "TASK_BYPASS_PERMISSIONS", "SENSITIVE_USER_INFO_OTHERS", "SYSTEM_STABILITY", "RUN_KLVL_CODE", "IDENTIFY_SYSTEM_SENSITIVE", "WEBSOCKET_BYPASS_PERMISSIONS");
        },
        setUsername: async function(token, user) {
            this._tokens[token].user = user;
        },
        info: async function(token) {
            return this._tokens[token];
        },
        validate: async function(token, criteria) {
            if (!this._tokens.hasOwnProperty(token)) return false;
            if (criteria.user && this._tokens[token].user != criteria.user) return false;
            if (criteria.group && !this._tokens[token].groups.includes(criteria.group)) return false;
            if (criteria.privilege && !this._tokens[token].privileges.includes(criteria.privilege)) return false;
            return true;
        },
        fork: async function(token) {
            let rng = crypto.getRandomValues(new Uint8Array(64));
            let newToken = Array.from(rng).map(x => x.toString(16).padStart(2, "0")).join("");
            this._tokens[newToken] = JSON.parse(JSON.stringify(this._tokens[token]));
            return newToken;  
        },
        _tokens: {}
    }
}
setupTokens();
// 12-users.js
async function setupUsers() {
    // @pcos-app-mode native
    async function handleAuthentication(user, prompts, finishFunction) {
        let currentPromptIndex = 0;
        let destroyed = false;

        return {
            getNextPrompt: async function() {
                if (destroyed) return {
                    success: false,
                    message: modules.locales.get("AUTH_FAILED_NEW")
                };
                if (currentPromptIndex >= prompts.length) {
                    if (finishFunction) await finishFunction(true);
                    let token = await modules.tokens.generate();
                    await modules.tokens.userInitialize(token, user);
                    return {
                        success: true,
                        message: modules.locales.get("AUTH_SUCCESS"),
                        token: token
                    };
                }
                let that = this;
                let currentPrompt = prompts[currentPromptIndex];
                let used = false;
                
                return {
                    success: "intermediate",
                    type: currentPrompt.type,
                    message: currentPrompt.message,
                    wantsUserInput: currentPrompt.userInput,
                    input: async function(input) {
                        if (used || destroyed) return that.getNextPrompt();
                        if (!used) used = true;
                        let verified;
                        try {
                            verified = await currentPrompt.verify(input);
                        } catch {
                            verified = false;
                        }
                        if (!verified) {
                            destroyed = true;
                            if (finishFunction) await finishFunction(false);
                            return { success: false, message: modules.locales.get("AUTH_FAILED") };
                        }
                        currentPromptIndex++;
                        return that.getNextPrompt();
                    }
                };
            }
        };
    }

    let test = "{}";
    try {
        test = await modules.fs.read(modules.defaultSystem + "/etc/security/users");
    } catch {
        if (!modules.settingUp) test = "systemStatusInvalid";
    }
    try {
        JSON.parse(test);
    } catch (e) {
        await panic("USER_SYSTEM_CORRUPTED", {
            name: "/etc/security/users",
            params: [modules.defaultSystem],
            underlyingJS: e
        })
    }

    modules.users = {
        init: async function(token) {
            await this.mkrecursive(modules.defaultSystem + "/etc/security", token);
            await modules.fs.chmod(modules.defaultSystem + "/etc", "rx", token);
            await modules.fs.chown(modules.defaultSystem + "/etc", "root", token);
            await modules.fs.chgrp(modules.defaultSystem + "/etc", "root", token);
            await this.mkrecursive(modules.defaultSystem + "/root", token);
            await modules.fs.write(modules.defaultSystem + "/etc/security/users", JSON.stringify({root: {
                securityChecks: [],
                groups: ["root"],
                homeDirectory: modules.defaultSystem + "/root"
            },
            nobody: {
                securityChecks: [],
                groups: ["nobody"],
                homeDirectory: modules.defaultSystem
            }}), token);
        },
        mkrecursive: async function(dir, token) {
            let slices = dir.split("/");
            for (let slice in slices) {
                let previousParts = slices.slice(0, slice).join("/");
                if (!previousParts) continue;
                let currentPart = slices[slice];
                let check = await modules.fs.ls(previousParts, token);
                previousParts += "/";
                if (!check.includes(currentPart)) await modules.fs.mkdir(previousParts + currentPart, token);
            }
        },
        moduser: async function(user, data, token) {
            let userDB = JSON.parse(await modules.fs.read(modules.defaultSystem + "/etc/security/users"), token);
            userDB[user] = data;
            await modules.fs.write(modules.defaultSystem + "/etc/security/users", JSON.stringify(userDB), token);
        },
        getUserInfo: async function(user, sensitive = false, token) {
            let userDB = JSON.parse(await modules.fs.read(modules.defaultSystem + "/etc/security/users"), token);
            if (!userDB.hasOwnProperty(user)) return null;
            userDB = userDB[user];
            if (!sensitive) delete userDB.securityChecks;
            return userDB;
        },
        access: async function(user, token) {
            let userDB = JSON.parse(await modules.fs.read(modules.defaultSystem + "/etc/security/users"), token);
            let credentials = userDB[user].securityChecks;
            for (let check in credentials) {
                if (credentials[check].type == "pbkdf2") {
                    credentials[check].userInput = true;
                    credentials[check].type = "password";
                    credentials[check].message = modules.locales.get("PASSWORD_PROMPT");
                    credentials[check].verify = async function(input) {
                        return (await modules.core.pbkdf2(input, credentials[check].salt)) == credentials[check].hash;
                    }
                }
                if (credentials[check].type == "informative" || credentials[check].type == "informative_deny") {
                    credentials[check].verify = () => credentials[check].type == "informative";
                    credentials[check].type = "informative";
                    credentials[check].userInput = false;
                }
                if (credentials[check].type == "timeout" || credentials[check].type == "timeout_deny") {
                    let isTimeout = credentials[check].type == "timeout";
                    credentials[check].message = modules.locales.get("PLEASE_WAIT_TIME").replace("%s", modules.userfriendliness.inconsiderateTime(credentials[check].timeout));
                    credentials[check].verify = () => new Promise(resolve => setTimeout(resolve, credentials[check].timeout, isTimeout));
                    credentials[check].type = "promise";
                    credentials[check].userInput = false;
                }
                if (credentials[check].type == "serverReport") {
                    credentials[check].message = modules.locales.get("REPORTING_LOGON");
                    credentials[check].type = "promise";
                    credentials[check].verify = async function() {
                        try {
                            let response = await fetch(credentials[check].url);
                            if (!response.ok) return false;
                        } catch {
                            return false;
                        }
                        return true;
                    }
                    credentials[check].userInput = false;
                }
                if (credentials[check].type == "pc-totp") {
                    credentials[check].message = modules.locales.get("TOTP_PC_PROMPT");
                    credentials[check].type = "text";
                    credentials[check].userInput = true;
                    credentials[check].verify = async function(input) {
                        let sha256 = async b => Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(b)))).map(a => a.toString(16).padStart(2, "0")).join("");
                        let c = Math.floor((Math.floor(Date.now() / 1000)) / 30);
                        let hash = await sha256(credentials[check].secret + c);
                        hash = parseInt(hash, 16);
                        hash = hash % 60466176;
                        hash = hash.toString();
                        hash = hash.split("", 6);
                        hash = hash.join("");
                        return hash == input;
                    }
                }
                if (credentials[check].type == "totp") {
                    credentials[check].message = modules.locales.get("TOTP_PROMPT");
                    credentials[check].type = "text";
                    credentials[check].userInput = true;
                    let hexToU8A = (hex) => Uint8Array.from(hex.match(/.{1,2}/g).map(a => parseInt(a, 16)));
                    let keyImport = await crypto.subtle.importKey("raw", hexToU8A(credentials[check].secret?.padStart(20, "0")), {
                        name: "HMAC",
                        hash: "SHA-1"
                    }, true, [ "sign" ]);
                    
                    credentials[check].verify = async function(input) {
                        let counter = hexToU8A(Math.floor(Date.now() / 30000).toString(16).padStart(16, "0"));
                        let hmacSign = await crypto.subtle.sign("HMAC", keyImport, counter);
                        hmacSign = Array.from(new Uint8Array(hmacSign));
                        let offset = hmacSign[19] & 0xf; // https://datatracker.ietf.org/doc/html/rfc4226#section-5.4
                        let code = (hmacSign[offset] & 0x7f) << 24
                            | (hmacSign[offset + 1] & 0xff) << 16
                            | (hmacSign[offset + 2] & 0xff) << 8
                            | (hmacSign[offset + 3] & 0xff);
                        code = code % 1000000;
                        return (code.toString() == input) || (code.toString().padStart(6, "0") == input);
                    }
                }
                if (credentials[check].type == "workingHours") {
                    let workingHourStarts = new Date();
                    workingHourStarts.setHours(credentials[check].start.hours || 0, credentials[check].start.minutes || 0, credentials[check].start.seconds || 0);
                    let workingHourEnds = new Date();
                    workingHourEnds.setHours(credentials[check].end.hours || 0, credentials[check].end.minutes || 0, credentials[check].end.seconds || 0);
                    
                    if (new Date() > workingHourEnds || new Date() < workingHourStarts) {
                        credentials[check].message = modules.locales.get("WORKING_HOURS_UNMET");
                        credentials[check].type = "informative";
                        credentials[check].userInput = false;
                        credentials[check].verify = () => false;
                    } else {
                        credentials[check].message = modules.locales.get("AUTH_SUCCESS");
                        credentials[check].type = "promise";
                        credentials[check].userInput = false;
                        credentials[check].verify = () => true;
                    }
                }
            }
            if (credentials.length == 0) {
                credentials.push({
                    type: "informative",
                    message: modules.locales.get("ACCESS_NOT_SETUP"),
                    userInput: false,
                    verify: () => false
                })
            }
            return handleAuthentication(user, credentials);
        }
    }
}
await setupUsers();
// 13-authui.js
async function authui(ses = modules.session.active, user, token) {
    // @pcos-app-mode native
    let hook = new Function();
    let authui_win = await modules.window(ses);
    authui_win.title.innerText = "AuthUI";
    authui_win.content.style.padding = "8px";
    authui_win.closeButton.onclick = function() {
        hook({ success: false, cancelled: true });
        authui_win.windowDiv.remove();
        authui_win = null;
        hook = null;
    }
    let describe = document.createElement("b");
    let form = document.createElement("form");
    let input = document.createElement("input");
    let submit = document.createElement("button");
    authui_win.content.appendChild(describe);
    authui_win.content.appendChild(document.createElement("br"));
    authui_win.content.appendChild(form);
    form.appendChild(input);
    form.appendChild(submit);
    submit.innerText = modules.locales.get("ENTER_BUTTON");
    describe.innerText = modules.locales.get("USERNAME_PROMPT");
    input.placeholder = modules.locales.get("USERNAME");
    async function userSubmit(e) {
        e.stopImmediatePropagation();
        e.preventDefault();
        e.stopPropagation();
        let userLogonSession;
        let desired_username = input.value;
        try {
            userLogonSession = await modules.users.access(desired_username, token);
        } catch {
            return alert(modules.locales.get("ACCESS_FN_FAIL"));
        }
        try {
            userLogonSession = await userLogonSession.getNextPrompt();
        } catch (e) {
            return alert(modules.locales.get("PROMPT_GET_FAIL"));
        }
        async function updateProgress() {
            form.removeEventListener("submit", userSubmit);
            input.value = "";
            if (userLogonSession.success == true) {
                authui_win.windowDiv.remove();
                return await hook(userLogonSession);
            }
            if (userLogonSession.success == false) {
                describe.innerText = modules.locales.get("AUTH_FAILED") + " " + modules.locales.get("USERNAME_PROMPT");
                input.placeholder = modules.locales.get("USERNAME");
                input.type = "text";
                input.disabled = !!user;
                submit.disabled = false;
                input.value = user || "";
                form.addEventListener("submit", userSubmit);
                if (user) describe.innerText = modules.locales.get("AUTH_FAILED") + " " + modules.locales.get("LET_TRY_AGAIN");
                return;
            }
            describe.innerText = "[" + desired_username + "] " + userLogonSession.message;
            input.placeholder = modules.locales.get("RESPONSE_PLACEHOLDER");
            input.type = userLogonSession.type == "password" ? "password" : "text";
            input.disabled = !userLogonSession.wantsUserInput;
            submit.disabled = !userLogonSession.wantsUserInput;
            if (userLogonSession.type == "promise") {
                try {
                    userLogonSession = await userLogonSession.input();
                } catch {}
                return await updateProgress();
            }
            if (userLogonSession.type == "informative") {
                submit.disabled = false;
                submit.innerText = "OK";
                input.placeholder = "--->";
            }
            form.addEventListener("submit", async function updater(e) {
                e.stopImmediatePropagation();
                e.preventDefault();
                e.stopPropagation();
                form.removeEventListener("submit", updater);
                try {
                    userLogonSession = await userLogonSession.input(input.value);
                } catch {}
                return await updateProgress();
            });
        }
        await updateProgress();
        return false;
    }
    form.addEventListener("submit", userSubmit);
    if (user) {
        input.disabled = true;
        input.value = user;
        userSubmit({ preventDefault: () => {}, stopImmediatePropagation: () => {}, stopPropagation: () => {} });
    }
    return { authui_win, hook: (e) => hook = e };
}
modules.authui = authui;
// 14-logon-requirement.js
async function requireLogon() {
    // @pcos-app-mode native
    let liu = {};
    while (true) {
        let useDefaultUser = await modules.fs.permissions(modules.defaultSystem + "/etc/security/automaticLogon");
        useDefaultUser = !useDefaultUser.world.includes("w") && useDefaultUser.owner == "root" && useDefaultUser.group == "root";
        let defaultUser;
        try {
            if (useDefaultUser) defaultUser = await modules.fs.read(modules.defaultSystem + "/etc/security/automaticLogon");
        } catch {}
        let sysDom = modules.session.tracker[modules.session.systemSession].html;
        let lockWallpaper = await modules.fs.read(modules.defaultSystem + "/etc/wallpapers/lockscreen.pic");
        sysDom.style.background = "url(" + JSON.stringify(lockWallpaper) + ")";
        sysDom.style.backgroundSize = "100% 100%";
        let lockIsDark = (await modules.fs.read(modules.defaultSystem + "/etc/darkLockScreen")) == "true";
        modules.session.attrib(modules.session.systemSession, "dark", lockIsDark);
        let logon, resolvedLogon;
        while (true) {
            logon = await modules.authui(modules.session.systemSession, defaultUser);
            resolvedLogon = await waitForLogon(logon);
            if (!resolvedLogon.cancelled) break;
        }
        modules.session.muteAllSessions();
        let userInfo = await modules.tokens.info(resolvedLogon.token);
        let session;
        let liuUser = userInfo.user;
        if (liu.hasOwnProperty(userInfo.user)) {
            session = liu[userInfo.user].session;
            await modules.tokens.revoke(resolvedLogon.token);
            resolvedLogon = liu[userInfo.user].logon;
            userInfo = await modules.tokens.info(resolvedLogon.token);
        } else {
            session = modules.session.mksession();
            liu[userInfo.user] = {
                session,
                logon: resolvedLogon
            }
        }
        modules.session.activateSession(session);
        let dom = modules.session.tracker[session].html;
        let bgPic = "";
        let isDark = false;
        try {
            let permissions = await modules.fs.permissions((await modules.users.getUserInfo(userInfo.user)).homeDirectory + "/.wallpaper", resolvedLogon.token);
            if (permissions.owner != userInfo.user && !userInfo.groups.includes(permissions.group) && !(permissions.world.includes("r") && permissions.world.includes("x")) && !userInfo.privileges.includes("FS_BYPASS_PERMISSIONS")) {
                throw new Error("Permission denied reading wallpaper");
            }
            bgPic = await modules.fs.read((await modules.users.getUserInfo(userInfo.user)).homeDirectory + "/.wallpaper", resolvedLogon.token);
        } catch (e) {
            console.error(e);
        }
        try {
            let permissionsdm = await modules.fs.permissions((await modules.users.getUserInfo(userInfo.user)).homeDirectory + "/.darkmode", resolvedLogon.token);
            if (permissionsdm.owner != userInfo.user && !userInfo.groups.includes(permissionsdm.group) && !(permissionsdm.world.includes("r") && permissionsdm.world.includes("x")) && !userInfo.privileges.includes("FS_BYPASS_PERMISSIONS")) {
                throw new Error("Permission denied reading dark mode preference");
            }
            isDark = (await modules.fs.read((await modules.users.getUserInfo(userInfo.user)).homeDirectory + "/.darkmode", resolvedLogon.token)) == "true";
        } catch (e) {
            console.error(e);
        }
        modules.session.attrib(session, "dark", isDark);
        dom.style.background = "url(" + JSON.stringify(bgPic) + ")";
        dom.style.backgroundSize = "100% 100%";
        let startButton = document.createElement("button");
        startButton.innerText = modules.locales.get("START_MENU_BTN");
        startButton.style = "position: absolute; left: 8px; bottom: 8px; padding: 8px;";
        startButton.onclick = async function() {
            let startMenu = modules.window(session);
            startMenu.title.innerText = modules.locales.get("START_MENU");
            startMenu.content.style.padding = "8px";
            startMenu.closeButton.onclick = () => startMenu.windowDiv.remove();
            let logoutButton = document.createElement("button");
            logoutButton.innerText = modules.locales.get("LOG_OUT_BUTTON").replace("%s", userInfo.user);
            startMenu.content.appendChild(logoutButton);
            logoutButton.onclick = async function() {
                startMenu.windowDiv.remove();
                await modules.session.muteAllSessions();
                await modules.session.activateSession(modules.session.systemSession);
                let loggingOutWindow = modules.window(modules.session.systemSession, true);
                loggingOutWindow.title.innerText = modules.locales.get("LOGGING_OUT");
                loggingOutWindow.content.style.padding = "8px";
                loggingOutWindow.closeButton.disabled = true;
                loggingOutWindow.content.innerText = modules.locales.get("LOGGING_OUT");
                let taskList = modules.session.attrib(session, "openReeWindows") || [];
                let timeout = (ms) => new Promise(resolve => setTimeout(resolve, ms));
                function allProcessesClosed() {
                    return new Promise(function(resolve) {
                        let int = setInterval(function() {
                            taskList = modules.session.attrib(session, "openReeWindows") || [];
                            if (Object.keys(taskList).length == 0) {
                                resolve();
                                clearInterval(int);
                            }
                        })
                    });
                }
                loggingOutWindow.content.innerText = modules.locales.get("POLITE_CLOSE_SIGNAL");
                for (let taskId of taskList) modules.tasks.sendSignal(taskId, 15);
                await Promise.race([
                    timeout(5000),
                    allProcessesClosed()
                ]);
                loggingOutWindow.content.innerText = modules.locales.get("ABRUPT_CLOSE_SIGNAL");
                taskList = modules.session.attrib(session, "openReeWindows") || [];
                for (let taskId of taskList) modules.tasks.sendSignal(taskId, 9);
                await allProcessesClosed();
                loggingOutWindow.windowDiv.remove();
                delete liu[liuUser];
                await modules.tokens.revoke(resolvedLogon.token);
                await modules.session.rmsession(session);
            }
            let lockButton = document.createElement("button");
            lockButton.innerText = modules.locales.get("LOCK_BUTTON");
            startMenu.content.appendChild(lockButton);
            lockButton.onclick = async function() {
                startMenu.windowDiv.remove();
                await modules.session.muteAllSessions();
                await modules.session.activateSession(modules.session.systemSession);
            }
            if (userInfo.privileges.includes("SYSTEM_SHUTDOWN")) {
                let shutoff = document.createElement("button");
                shutoff.innerText = modules.locales.get("TURN_OFF_BUTTON");
                startMenu.content.appendChild(shutoff);
                shutoff.onclick = async function() {
                    startMenu.windowDiv.remove();
                    modules.restart(true, resolvedLogon.token);
                }
                let reboot = document.createElement("button");
                reboot.innerText = modules.locales.get("RESTART_BUTTON");
                startMenu.content.appendChild(reboot);
                reboot.onclick = async function() {
                    startMenu.windowDiv.remove();
                    modules.restart(false, resolvedLogon.token);
                }
            }
            try {
                let permissions = await modules.fs.permissions(modules.defaultSystem + "/apps/links", resolvedLogon.token);
                if (permissions.owner != userInfo.user && !userInfo.groups.includes(permissions.group) && !(permissions.world.includes("r") && permissions.world.includes("x")) && !userInfo.privileges.includes("FS_BYPASS_PERMISSIONS")) {
                    throw new Error("Permission denied reading /apps");
                }
                let enumeration = await modules.fs.ls(modules.defaultSystem + "/apps/links", resolvedLogon.token);
                for (let app of enumeration) {
                    let permissions = await modules.fs.permissions(modules.defaultSystem + "/apps/links/" + app, resolvedLogon.token);
                    if (permissions.owner != userInfo.user && !userInfo.groups.includes(permissions.group) && !(permissions.world.includes("r") && permissions.world.includes("x")) && !userInfo.privileges.includes("FS_BYPASS_PERMISSIONS")) continue;
                    let appLink = await modules.fs.read(modules.defaultSystem + "/apps/links/" + app, resolvedLogon.token);
                    appLink = JSON.parse(appLink);
                    let appBtn = document.createElement("button");
                    appBtn.innerText = (appLink.localeReferenceName ? modules.locales.get(appLink.localeReferenceName) : null) || (appLink.localeDatabaseName || {})[navigator.language.slice(0, 2).toLowerCase()] || (appLink.localeDatabaseName || {})[modules.locales.defaultLocale] || appLink.name;
                    appBtn.title = modules.locales.get("PROVISIONED_PREFERENCE");
                    appBtn.onclick = async function() {
                        startMenu.windowDiv.remove();
                        let forkedToken = await modules.tokens.fork(resolvedLogon.token);
                        let appWindow = modules.window(session);
                        await modules.tasks.exec(appLink.path, [ ...(appLink.args || []) ], appWindow, forkedToken);
                    }
                    startMenu.content.appendChild(appBtn);
                }
            } catch (e) {
                console.error(e);
            }
            try {
                let permissions = await modules.fs.permissions((await modules.users.getUserInfo(userInfo.user)).homeDirectory + "/.applinks", resolvedLogon.token);
                if (permissions.owner != userInfo.user && !userInfo.groups.includes(permissions.group) && !(permissions.world.includes("r") && permissions.world.includes("x")) && !userInfo.privileges.includes("FS_BYPASS_PERMISSIONS")) {
                    throw new Error("Permission denied reading " + (await modules.users.getUserInfo(userInfo.user)).homeDirectory + "/.applinks");
                }
                let enumeration = await modules.fs.ls((await modules.users.getUserInfo(userInfo.user)).homeDirectory + "/.applinks", resolvedLogon.token);
                for (let app of enumeration) {
                    let permissions = await modules.fs.permissions((await modules.users.getUserInfo(userInfo.user)).homeDirectory + "/.applinks/" + app, resolvedLogon.token);
                    if (permissions.owner != userInfo.user && !userInfo.groups.includes(permissions.group) && !(permissions.world.includes("r") && permissions.world.includes("x")) && !userInfo.privileges.includes("FS_BYPASS_PERMISSIONS")) continue;
                    let appLink = await modules.fs.read((await modules.users.getUserInfo(userInfo.user)).homeDirectory + "/.applinks/" + app, resolvedLogon.token);
                    appLink = JSON.parse(appLink);
                    let appBtn = document.createElement("button");
                    appBtn.innerText = (appLink.localeReferenceName ? modules.locales.get(appLink.localeReferenceName) : null) || appLink.localeDatabaseName[navigator.language.slice(0, 2).toLowerCase()] || appLink.localeDatabaseName[modules.locales.defaultLocale] || appLink.name;
                    appBtn.onclick = async function() {
                        startMenu.windowDiv.remove();
                        let forkedToken = await modules.tokens.fork(resolvedLogon.token);
                        let appWindow = modules.window(session);
                        await modules.tasks.exec(appLink.path, [ ...(appLink.args || []) ], appWindow, forkedToken);
                    }
                    startMenu.content.appendChild(appBtn);
                }
            } catch (e) {
                console.error(e);
            }
        }
        dom.appendChild(startButton);

        if (useDefaultUser && defaultUser) {
            let newWindow = modules.window(modules.session.systemSession);
            newWindow.title.innerText = modules.locales.get("LOG_IN_INVITATION");
            let button = document.createElement("button");
            button.innerText = modules.locales.get("LOG_IN_INVITATION");
            newWindow.content.appendChild(button);
            newWindow.closeButton.disabled = true;
            await hookButtonClick(button);
            newWindow.windowDiv.remove();
        }
    }
}

function waitForLogon(toHook) {
    return new Promise(function(resolve) {
        toHook.hook(resolve);
    });
}

async function hookButtonClick(button) {
    return new Promise(function(resolve) {
        button.onclick = (e) => resolve(e);
    });
}
// 15-apps.js
async function videoPlayerInstaller(target, token) {
    // @pcos-app-mode native
    let fs = modules.fs;
    let existing = (await fs.ls(target, token)).includes("apps");
    if (!existing) await fs.mkdir(target + "/apps", token);
    await fs.chown(target + "/apps", "root", token);
    await fs.chgrp(target + "/apps", "root", token);
    await fs.chmod(target + "/apps", "rx", token);
    let existing2 = (await fs.ls(target + "/apps", token)).includes("links");
    if (!existing2) await fs.mkdir(target + "/apps/links", token);
    await fs.chown(target + "/apps/links", "root", token);
    await fs.chgrp(target + "/apps/links", "root", token);
    await fs.chmod(target + "/apps/links", "rx", token);
    await fs.write(target + "/apps/links/videoPlayer.lnk", JSON.stringify({
        localeReferenceName: "VIDEO_PLAYER",
        path: target + "/apps/videoPlayer.js"
    }), token);
    await fs.chown(target + "/apps/links/videoPlayer.lnk", "root", token);
    await fs.chgrp(target + "/apps/links/videoPlayer.lnk", "root", token);
    await fs.chmod(target + "/apps/links/videoPlayer.lnk", "rx", token);
    await fs.write(target + "/apps/videoPlayer.js", `(async function() {
        // @pcos-app-mode iso`+`latable
        await window.availableAPIs.windowTitleSet(await availableAPIs.lookupLocale("VIDEO_PLAYER"));
        document.body.style.fontFamily = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
        if (await availableAPIs.isDarkThemed()) document.body.style.color = "white";
        document.body.innerHTML = "<video controls id='video' style='width: 100%; height: 100%; position: absolute; top: 0; left: 0'></video>";
        let video = document.getElementById("video");
        if (exec_args instanceof Array && typeof exec_args[0] == "string") {
            let path = exec_args[0];
            let url;
            try {
                url = await window.availableAPIs.fs_read({ path });
            } catch (e) {
                console.error(e);
                document.body.innerText = (await availableAPIs.lookupLocale("INACCESSIBLE_FILE")).replace("%s", path);
            }
            video.src = url;
        } else {
            document.body.innerHTML = await availableAPIs.lookupLocale("FILE_NOT_SPECIFIED");
        }
    })();
    addEventListener("signal", async function(e) {
        if (e.detail == 15) await window.availableAPIs.terminate();
    });
    `, token);
    await fs.chown(target + "/apps/videoPlayer.js", "root", token);
    await fs.chgrp(target + "/apps/videoPlayer.js", "root", token);
    await fs.chmod(target + "/apps/videoPlayer.js", "rx", token);
}

async function pictureInstaller(target, token) {
    let fs = modules.fs;
    let existing = (await fs.ls(target, token)).includes("apps");
    if (!existing) await fs.mkdir(target + "/apps", token);
    await fs.chown(target + "/apps", "root", token);
    await fs.chgrp(target + "/apps", "root", token);
    await fs.chmod(target + "/apps", "rx", token);
    let existing2 = (await fs.ls(target + "/apps", token)).includes("links");
    if (!existing2) await fs.mkdir(target + "/apps/links", token);
    await fs.chown(target + "/apps/links", "root", token);
    await fs.chgrp(target + "/apps/links", "root", token);
    await fs.chmod(target + "/apps/links", "rx", token);
    await fs.write(target + "/apps/links/pictureViewer.lnk", JSON.stringify({
        localeReferenceName: "PICTURE_VIEWER",
        path: target + "/apps/pictureViewer.js"
    }), token);
    await fs.chown(target + "/apps/links/pictureViewer.lnk", "root", token);
    await fs.chgrp(target + "/apps/links/pictureViewer.lnk", "root", token);
    await fs.chmod(target + "/apps/links/pictureViewer.lnk", "rx", token);
    await fs.write(target + "/apps/pictureViewer.js", `(async function() {
        // @pcos-app-mode iso`+`latable
        await window.availableAPIs.windowTitleSet(await availableAPIs.lookupLocale("PICTURE_VIEWER"));
        document.body.style.fontFamily = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
        if (await availableAPIs.isDarkThemed()) document.body.style.color = "white";
        if (exec_args instanceof Array && typeof exec_args[0] == "string") {
            let path = exec_args[0];
            try {
                let div = document.createElement("div");
                div.style = "background: url(" + JSON.stringify(await window.availableAPIs.fs_read({ path })) + ")";
                div.style.backgroundSize = "contain";
                div.style.backgroundRepeat = "no-repeat";
                div.style.backgroundPosition = "center";
                div.style.position = "absolute";
                div.style.top = "0";
                div.style.left = "0";
                div.style.width = "100%";
                div.style.height = "100%";
                div.style.margin = "0";
                document.body.appendChild(div);
            } catch (e) {
                console.error(e);
                document.body.innerText = (await availableAPIs.lookupLocale("INACCESSIBLE_FILE")).replace("%s", path);
            }
        } else {
            document.body.innerHTML = await availableAPIs.lookupLocale("FILE_NOT_SPECIFIED");
        }
    })();
    addEventListener("signal", async function(e) {
        if (e.detail == 15) await window.availableAPIs.terminate();
    });
    `, token);
    await fs.chown(target + "/apps/pictureViewer.js", "root", token);
    await fs.chgrp(target + "/apps/pictureViewer.js", "root", token);
    await fs.chmod(target + "/apps/pictureViewer.js", "rx", token);
}

async function terminalInstaller(target, token) {
    let fs = modules.fs;
    let existing = (await fs.ls(target, token)).includes("apps");
    if (!existing) await fs.mkdir(target + "/apps", token);
    await fs.chown(target + "/apps", "root", token);
    await fs.chgrp(target + "/apps", "root", token);
    await fs.chmod(target + "/apps", "rx", token);
    let existing2 = (await fs.ls(target + "/apps", token)).includes("links");
    if (!existing2) await fs.mkdir(target + "/apps/links", token);
    await fs.chown(target + "/apps/links", "root", token);
    await fs.chgrp(target + "/apps/links", "root", token);
    await fs.chmod(target + "/apps/links", "rx", token);
    await fs.write(target + "/apps/links/terminal.lnk", JSON.stringify({
        localeReferenceName: "ISOLATED_TERM",
        path: target + "/apps/terminal.js"
    }), token);
    await fs.chown(target + "/apps/links/terminal.lnk", "root", token);
    await fs.chgrp(target + "/apps/links/terminal.lnk", "root", token);
    await fs.chmod(target + "/apps/links/terminal.lnk", "rx", token);
    function parse_cmdline(cmdline) {
        var re_next_arg = /^\s*((?:(?:"(?:\\.|[^"])*")|(?:'[^']*')|\\.|\S)+)\s*(.*)$/;
        var next_arg = ['', '', cmdline];
        var args = [];
        while (next_arg = re_next_arg.exec(next_arg[2])) {
            var quoted_arg = next_arg[1];
            var unquoted_arg = "";
            while (quoted_arg.length > 0) {
                if (/^"/.test(quoted_arg)) {
                    var quoted_part = /^"((?:\\.|[^"])*)"(.*)$/.exec(quoted_arg);
                    unquoted_arg += quoted_part[1].replace(/\\(.)/g, "$1");
                    quoted_arg = quoted_part[2];
                } else if (/^'/.test(quoted_arg)) {
                    var quoted_part = /^'([^']*)'(.*)$/.exec(quoted_arg);
                    unquoted_arg += quoted_part[1];
                    quoted_arg = quoted_part[2];
                } else if (/^\\/.test(quoted_arg)) {
                    unquoted_arg += quoted_arg[1];
                    quoted_arg = quoted_arg.substring(2);
                } else {
                    unquoted_arg += quoted_arg[0];
                    quoted_arg = quoted_arg.substring(1);
                }
            }
            args[args.length] = unquoted_arg;
        }
        return args;
    }
    await fs.write(target + "/apps/terminal.js", `(async function() {
        // @pcos-app-mode iso`+`latable
        await window.availableAPIs.windowTitleSet(await window.availableAPIs.lookupLocale("ISOLATED_TERM"));
        document.body.style.fontFamily = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
        if (await availableAPIs.isDarkThemed()) document.body.style.color = "white";
        await availableAPIs.attachCLI();
        
        ${parse_cmdline.toString()}

        let str = "";
        let default_user = await window.availableAPIs.getUser();
        await availableAPIs.toMyCLI((await window.availableAPIs.lookupLocale("TERMINAL_INVITATION")).replace("%s", (await window.availableAPIs.getVersion())) + "\\r\\n\\r\\n");
        await availableAPIs.toMyCLI(default_user + "@localhost:~" + (default_user == "root" ? "#" : "$") + " ");
        
        onTermData(async function (e) {
            if (e == "\\r") {
                await availableAPIs.toMyCLI("\\r\\n");
                let cmdline = [];
                try {
                    cmdline = parse_cmdline(str);
                } catch {
                    await availableAPIs.toMyCLI("> ");
                    return;
                }
                str = "";
                if (!cmdline.length) {} else if (window.availableAPIs.hasOwnProperty(cmdline[0])) {
                    try {
                        await availableAPIs.toMyCLI(JSON.stringify(await window.availableAPIs[cmdline[0]](cmdline.length == 1 ? undefined : (cmdline.length == 2 ? cmdline[1] : [...cmdline.slice(1)]))) + "\\r\\n");
                    } catch (e) {
                        await availableAPIs.toMyCLI(cmdline[0] + ": " + e.name + ": " + e.message + "\\r\\n");
                    }
                } else if (cmdline[0] == "js_ree") {
                    try {
                        await availableAPIs.toMyCLI(JSON.stringify(eval(cmdline[1])) + "\\r\\n");
                    } catch (e) {
                        await availableAPIs.toMyCLI("js_ree: " + e.name + ": " + e.message + "\\r\\n");
                    }
                } else if (cmdline[0] == "clear") {
                    await availableAPIs.clearMyCLI();
                } else if (cmdline[0] == "help") {
                    await availableAPIs.toMyCLI(await window.availableAPIs.lookupLocale("HELP_TERMINAL_ISOLATED"));
                    for (let api in window.availableAPIs) await availableAPIs.toMyCLI(api + "\\r\\n");
                } else {
                    await availableAPIs.toMyCLI((await window.availableAPIs.lookupLocale("TERM_COMMAND_NOT_FOUND")).replace("%s", cmdline[0]) + "\\r\\n");
                }
                try {
                    default_user = await window.availableAPIs.getUser();
                } catch {}
                await availableAPIs.toMyCLI(default_user + "@localhost:~" + (default_user == "root" ? "#" : "$") + " ");
                return;
            } else if (e == '\u007F') {
                if (str.length > 0) {
                    str = str.substr(0, str.length - 1);
                    await availableAPIs.toMyCLI('\b \b');
                }
            } else {
                if (e >= String.fromCharCode(0x20) && e <= String.fromCharCode(0x7E) || e >= '\u00a0') {
                    str += e;
                    await availableAPIs.toMyCLI(e);
                }
            }
        });
    })(); 

    async function onTermData(listener) {
        while (true) {
            listener(await availableAPIs.fromMyCLI());
        }
    }
    addEventListener("signal", async function(e) {
        if (e.detail == 15) await window.availableAPIs.terminate();
    }); null;`, token);
    await fs.chown(target + "/apps/terminal.js", "root", token);
    await fs.chgrp(target + "/apps/terminal.js", "root", token);
    await fs.chmod(target + "/apps/terminal.js", "rx", token);
}

async function explorerInstaller(target, token) {
    let fs = modules.fs;
    let existing = (await fs.ls(target, token)).includes("apps");
    if (!existing) await fs.mkdir(target + "/apps", token);
    await fs.chown(target + "/apps", "root", token);
    await fs.chgrp(target + "/apps", "root", token);
    await fs.chmod(target + "/apps", "rx", token);
    let existing2 = (await fs.ls(target + "/apps", token)).includes("links");
    if (!existing2) await fs.mkdir(target + "/apps/links", token);
    await fs.chown(target + "/apps/links", "root", token);
    await fs.chgrp(target + "/apps/links", "root", token);
    await fs.chmod(target + "/apps/links", "rx", token);
    await fs.write(target + "/apps/links/explorer.lnk", JSON.stringify({
        localeReferenceName: "FILE_EXPLORER",
        path: target + "/apps/explorer.js"
    }), token);
    await fs.chown(target + "/apps/links/explorer.lnk", "root", token);
    await fs.chgrp(target + "/apps/links/explorer.lnk", "root", token);
    await fs.chmod(target + "/apps/links/explorer.lnk", "rx", token);
    await fs.write(target + "/apps/explorer.js", `(async function() {
        // @pcos-app-mode iso`+`latable
        await availableAPIs.windowTitleSet(await availableAPIs.lookupLocale("FILE_EXPLORER"));
        document.body.style.fontFamily = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
        if (await availableAPIs.isDarkThemed()) document.body.style.color = "white";
        let privileges = await availableAPIs.getPrivileges();
        let checklist = [ "FS_READ", "FS_LIST_PARTITIONS" ];
        if (!checklist.every(p => privileges.includes(p))) {
            document.body.innerText = await availableAPIs.lookupLocale("GRANT_FEXP_PERM");
            let button = document.createElement("button");
            button.innerText = await availableAPIs.lookupLocale("GRANT_PERM");
            document.body.appendChild(button);
            if (!privileges.includes("ELEVATE_PRIVILEGES")) {
                button.disabled = true;
                document.body.innerText = await availableAPIs.lookupLocale("GRANT_FEXP_PERM_ADM");
                return;
            }
            await new Promise(function(resolve) {
                button.onclick = async function() {
                    button.disabled = true;
                    let currentToken = await availableAPIs.getProcessToken();
                    let newToken = await availableAPIs.getNewToken();
                    button.disabled = false;
                    if (!newToken) return;
                    await availableAPIs.setProcessToken(newToken);
                    await availableAPIs.revokeToken(currentToken);
                    privileges = await availableAPIs.getPrivileges();
                    if (checklist.every(p => privileges.includes(p))) resolve();
                    else document.body.innerText = await availableAPIs.lookupLocale("GRANT_FEXP_PERM_USR");
                }
            });
        }
        document.body.innerText = "";
        let pathElement = document.createElement("input");
        let browseButton = document.createElement("button");
        let displayResult = document.createElement("div");
        let previousDirectory = "";
        browseButton.innerText = await availableAPIs.lookupLocale("BROWSE_FEXP");
        document.body.appendChild(pathElement);
        document.body.appendChild(browseButton);
        document.body.appendChild(displayResult);
        async function browse() {
            let path = pathElement.value;
            if (path.endsWith("/")) path = path.substr(0, path.length - 1);
            displayResult.innerText = "";
            if (path == "") {
                let partitions = await availableAPIs.fs_mounts();
                for (let partition of partitions) {
                    let openButton = document.createElement("button");
                    openButton.innerText = partition;
                    openButton.onclick = function() {
                        pathElement.value = partition;
                        browse();
                    }
                    openButton.oncontextmenu = async function(e) {
                        e.stopImmediatePropagation();
                        e.preventDefault();
                        e.stopPropagation();
                        displayResult.innerText = "";
                        let deleteButton = document.createElement("button");
                        deleteButton.innerText = await availableAPIs.lookupLocale("UNMOUNT_BTN");
                        deleteButton.onclick = async function() {
                            try {
                                await availableAPIs.fs_unmount({ mount: partition });
                                browse();
                            } catch (e) {
                                displayResult.innerText = (await availableAPIs.lookupLocale("FILE_STRUCT_BROWSE_FAIL")).replace("%s", e.name + ": " + e.message);
                            }
                        }
                        displayResult.appendChild(deleteButton);
                    }
                    displayResult.appendChild(openButton);
                }
                displayResult.appendChild(document.createElement("hr"));
                let spaceDisplayer = document.createElement("span");
                let spaces = await availableAPIs.estimateStorage();
                for (let space in spaces) {
                    spaceDisplayer.innerText += (await availableAPIs.lookupLocale("SPACE_SHOWER")).replace("%s", space).replace("%s", await availableAPIs.ufInfoUnits([spaces[space].used])).replace("%s", await availableAPIs.ufInfoUnits([spaces[space].total])).replace("%s", (spaces[space].used / spaces[space].total * 100).toFixed(2));
                }
                displayResult.appendChild(spaceDisplayer);
                previousDirectory = path;
                return "browsed";
            }
            try {
                let type = await isDirectory(path);
                if (type == "directory") {
                    let ls = await availableAPIs.fs_ls({ path: path });
                    for (let file of ls) {
                        let openButton = document.createElement("button");
                        openButton.innerText = file;
                        openButton.onclick = function() {
                            pathElement.value = path + "/" + file;
                            browse();
                        }
                        openButton.oncontextmenu = async function(e) {
                            e.stopImmediatePropagation();
                            e.preventDefault();
                            e.stopPropagation();
                            displayResult.innerText = "";
                            let deleteButton = document.createElement("button");
                            deleteButton.innerText = await availableAPIs.lookupLocale("REMOVE_BTN");
                            deleteButton.onclick = async function() {
                                try {
                                    await availableAPIs.fs_rm({ path: path + "/" + file });
                                    browse();
                                } catch (e) {
                                    displayResult.innerText = (await availableAPIs.lookupLocale("FILE_STRUCT_BROWSE_FAIL")).replace("%s", e.name + ": " + e.message);
                                }
                            }
                            displayResult.appendChild(deleteButton);
                        }
                        displayResult.appendChild(openButton);
                    }
                    previousDirectory = path;
                } else if (type == "file") {
                    pathElement.value = previousDirectory;
                    await browse();
                    if (path.endsWith(".js")) {
                        if (privileges.includes("START_TASK")) {
                            await availableAPIs.startTask({ file: path });
                        } else {
                            displayResult.innerText = await availableAPIs.lookupLocale("MORE_PERMISSION_DENIED");
                        }
                    } else if (path.endsWith(".vid") || path.endsWith(".aud")) {
                        if (privileges.includes("START_TASK")) {
                            await availableAPIs.startTask({ file: (await availableAPIs.getSystemMount()) + "/apps/videoPlayer.js", argPassed: [ path ] });
                        } else {
                            displayResult.innerText = await availableAPIs.lookupLocale("MORE_PERMISSION_DENIED");
                        }
                    } else if (path.endsWith(".pic")) {
                        if (privileges.includes("START_TASK")) {
                            await availableAPIs.startTask({ file: (await availableAPIs.getSystemMount()) + "/apps/pictureViewer.js", argPassed: [ path ] });
                        } else {
                            displayResult.innerText = await availableAPIs.lookupLocale("MORE_PERMISSION_DENIED");
                        }
                    } else if (path.endsWith(".lnk")) {
                        let file = await availableAPIs.fs_read({ path: path });
                        file = JSON.parse(file);
                        if (privileges.includes("START_TASK")) {
                            await availableAPIs.startTask({ file: file.path, argPassed: [ ...(file.args || []) ] });
                        } else {
                            displayResult.innerText = await availableAPIs.lookupLocale("MORE_PERMISSION_DENIED");
                        }
                    } else {
                        displayResult.innerText = await availableAPIs.lookupLocale("UNKNOWN_FILE_TYPE");
                    }
                } else {
                    displayResult.innerText = (await availableAPIs.lookupLocale("FILE_STRUCT_BROWSE_FAIL")).replace("%s", (await availableAPIs.lookupLocale("UNKNOWN_FS_STRUCT")).replace("%s", type));
                }
            } catch (e) {
                displayResult.innerText = (await availableAPIs.lookupLocale("FILE_STRUCT_BROWSE_FAIL")).replace("%s", e.name + ": " + e.message);
            }
        }
        browse();
        browseButton.onclick = browse;
    })();
    async function isDirectory(path) {
        try {
            await availableAPIs.fs_ls({ path });
            return "directory";
        } catch (e) {
            if (e.message == "FS_ACTION_FAILED: Is a file") return "file";
            return "unknown";
        }
    }
    addEventListener("signal", async function(e) {
        if (e.detail == 15) await window.availableAPIs.terminate();
    }); null;`, token);
    await fs.chown(target + "/apps/explorer.js", "root", token);
    await fs.chgrp(target + "/apps/explorer.js", "root", token);
    await fs.chmod(target + "/apps/explorer.js", "rx", token);
}

async function filePickerInstaller(target, token) {
    let fs = modules.fs;
    let existing = (await fs.ls(target, token)).includes("apps");
    if (!existing) await fs.mkdir(target + "/apps", token);
    await fs.chown(target + "/apps", "root", token);
    await fs.chgrp(target + "/apps", "root", token);
    await fs.chmod(target + "/apps", "rx", token);
    await fs.write(target + "/apps/filePicker.js", `let ipcChannel = exec_args[0];
    (async function() {
        // @pcos-app-mode iso`+`latable
        if (!ipcChannel) return availableAPIs.terminate();
        await availableAPIs.windowTitleSet(await availableAPIs.lookupLocale("FILE_PICKER"));
        document.body.style.fontFamily = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
        if (await availableAPIs.isDarkThemed()) document.body.style.color = "white";
        let privileges = await availableAPIs.getPrivileges();
        let checklist = [ "FS_READ", "FS_LIST_PARTITIONS", "IPC_SEND_PIPE" ];
        if (!checklist.every(p => privileges.includes(p))) {
            if (privileges.includes("IPC_SEND_PIPE")) await availableAPIs.sendToPipe({ pipe: ipcChannel, data: { success: false, reason: "permissions" } });
            return availableAPIs.terminate();
        }
        document.body.innerText = "";
        let pathElement = document.createElement("input");
        pathElement.value = exec_args[2] || "";
        let browseButton = document.createElement("button");
        let displayResult = document.createElement("div");
        let newItemInput = document.createElement("input");
        let newItemBrowse = document.createElement("button");
        let newItemContainer = document.createElement("div");
        let previousDirectory = "";
        let isDefaultChoice = true;
        browseButton.innerText = await availableAPIs.lookupLocale("BROWSE_FEXP");
        newItemBrowse.innerText = await availableAPIs.lookupLocale("SAVE_BTN");
        newItemContainer.appendChild(document.createElement("hr"));
        newItemContainer.appendChild(newItemInput);
        newItemContainer.appendChild(newItemBrowse);
        document.body.appendChild(pathElement);
        document.body.appendChild(browseButton);
        document.body.appendChild(displayResult);
        document.body.appendChild(newItemContainer);
        newItemContainer.hidden = exec_args[1] != "save";
        async function browse() {
            let path = pathElement.value;
            if (path.endsWith("/")) path = path.substr(0, path.length - 1);
            displayResult.innerText = "";
            if (path == "") {
                let partitions = await availableAPIs.fs_mounts();
                for (let partition of partitions) {
                    let openButton = document.createElement("button");
                    openButton.innerText = partition;
                    openButton.onclick = function() {
                        pathElement.value = partition;
                        browse();
                    }
                    displayResult.appendChild(openButton);
                }
                previousDirectory = path;
                return "browsed";
            }
            try {
                let type = await isDirectory(path);
                if (type == "directory") {
                    let ls = await availableAPIs.fs_ls({ path: path });
                    for (let file of ls) {
                        let openButton = document.createElement("button");
                        openButton.innerText = file;
                        openButton.onclick = function() {
                            pathElement.value = path + "/" + file;
                            browse();
                        }
                        displayResult.appendChild(openButton);
                    }
                    previousDirectory = path;
                } else if (type == "file" || (type == "unknown" && exec_args[1] == "save")) {
                    if (isDefaultChoice) {
                        pathElement.value = path.split("/").slice(0, -1).join("/");
                        return browse();
                    }
                    displayResult.innerText = "";
                    await availableAPIs.sendToPipe({ pipe: ipcChannel, data: { success: true, selected: path } });
                    await availableAPIs.terminate();
                } else {
                    displayResult.innerText = (await availableAPIs.lookupLocale("FILE_STRUCT_BROWSE_FAIL")).replace("%s", (await availableAPIs.lookupLocale("UNKNOWN_FS_STRUCT")).replace("%s", type));
                }
            } catch (e) {
                displayResult.innerText = (await availableAPIs.lookupLocale("FILE_STRUCT_BROWSE_FAIL")).replace("%s", e.name + ": " + e.message);
            }
            isDefaultChoice = false;
        }
        browse();
        browseButton.onclick = browse;
        newItemBrowse.onclick = async function() {
            if (previousDirectory == "") return displayResult.innerText = (await availableAPIs.lookupLocale("FILE_STRUCT_BROWSE_FAIL")).replace("%s", await availableAPIs.lookupLocale("NO_SAVE_IN_MTN"));
            pathElement.value = previousDirectory + "/" + newItemInput.value;
            browse();
        }
    })();
    async function isDirectory(path) {
        try {
            await availableAPIs.fs_ls({ path });
            return "directory";
        } catch (e) {
            if (e.message == "FS_ACTION_FAILED: Is a file") return "file";
            return "unknown";
        }
    }
    addEventListener("signal", async function(e) {
        if (e.detail == 15) {
            await availableAPIs.sendToPipe({ pipe: ipcChannel, data: { success: false, reason: "closed" } });
            await window.availableAPIs.terminate();
        }
    }); null;`, token);
    await fs.chown(target + "/apps/filePicker.js", "root", token);
    await fs.chgrp(target + "/apps/filePicker.js", "root", token);
    await fs.chmod(target + "/apps/filePicker.js", "rx", token);
}

async function taskMgrInstaller(target, token) {
    let fs = modules.fs;
    let existing = (await fs.ls(target, token)).includes("apps");
    if (!existing) await fs.mkdir(target + "/apps", token);
    await fs.chown(target + "/apps", "root", token);
    await fs.chgrp(target + "/apps", "root", token);
    await fs.chmod(target + "/apps", "rx", token);
    let existing2 = (await fs.ls(target + "/apps", token)).includes("links");
    if (!existing2) await fs.mkdir(target + "/apps/links", token);
    await fs.chown(target + "/apps/links", "root", token);
    await fs.chgrp(target + "/apps/links", "root", token);
    await fs.chmod(target + "/apps/links", "rx", token);
    await fs.write(target + "/apps/links/taskManager.lnk", JSON.stringify({
        localeReferenceName: "TASK_MANAGER",
        path: target + "/apps/taskManager.js"
    }), token);
    await fs.chown(target + "/apps/links/taskManager.lnk", "root", token);
    await fs.chgrp(target + "/apps/links/taskManager.lnk", "root", token);
    await fs.chmod(target + "/apps/links/taskManager.lnk", "rx", token);
    await fs.write(target + "/apps/taskManager.js", `(async function() {
        // @pcos-app-mode iso`+`latable
        await availableAPIs.windowTitleSet(await availableAPIs.lookupLocale("TASK_MANAGER"));
        let privileges = await availableAPIs.getPrivileges();
        let checklist = [ "LIST_TASKS", "SIGNAL_TASK" ];
        document.body.style.fontFamily = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
        if (await availableAPIs.isDarkThemed()) document.body.style.color = "white";
        if (!checklist.every(p => privileges.includes(p))) {
            document.body.innerText = (await availableAPIs.lookupLocale("TMGR_PERMISSION")).replace("%s", checklist.join(", "));
            return;
        }
        let styleElement = document.createElement("style");
        styleElement.innerText = \`th, td { border: 1px solid black; }
        table { overflow: scroll; min-width: 100%; width: max-content; }\`;
        document.head.appendChild(styleElement);
        let table = document.createElement("table");
        let thead = document.createElement("thead");
        let theadRow = document.createElement("tr");
        let thBasename = document.createElement("th");
        let thUser = document.createElement("th");
        let thTerminate = document.createElement("th");
        let thFP = document.createElement("th");
        let thArgs = document.createElement("th");
        let tbody = document.createElement("tbody");
        thBasename.innerText = await availableAPIs.lookupLocale("BASENAME_TASK");
        thUser.innerText = await availableAPIs.lookupLocale("USER_TASK");
        thTerminate.innerText = await availableAPIs.lookupLocale("TERMINATE_TASK");
        thFP.innerText = await availableAPIs.lookupLocale("FULL_PATH_TASK");
        thArgs.innerText = await availableAPIs.lookupLocale("ARGUMENTS_TASK");
        theadRow.appendChild(thBasename);
        theadRow.appendChild(thUser);
        theadRow.appendChild(thTerminate);
        theadRow.appendChild(thFP);
        theadRow.appendChild(thArgs);
        thead.appendChild(theadRow);
        table.appendChild(thead);
        table.appendChild(tbody);
        document.body.appendChild(table);
        setInterval(async function refresh() {
            let prevtb = tbody;
            let newtb = document.createElement("tbody");
            let tasks = await availableAPIs.listTasks();
            for (let task of tasks) {
                let tr = document.createElement("tr");
                let tdBasename = document.createElement("td");
                let tdUser = document.createElement("td");
                let tdTerminate = document.createElement("td");
                let tdFP = document.createElement("td");
                let tdArgs = document.createElement("td");
                let taskInfo = await availableAPIs.taskInfo(task);
                let terminateBtn = document.createElement("button");
                tdBasename.innerText = taskInfo.file.split("/").slice(-1)[0];
                tdUser.innerText = taskInfo.runBy;
                tdFP.innerText = taskInfo.file;
                tdArgs.innerText = "[" + (taskInfo.arg || []).map(a => JSON.stringify(a)).join(", ") + "]";
                terminateBtn.innerText = await availableAPIs.lookupLocale("TERMINATE_TASK");
                terminateBtn.addEventListener("click", async function() {
                    await availableAPIs.signalTask({ taskId: task, signal: 9 });
                    refresh();
                });
                tdTerminate.appendChild(terminateBtn);
                tr.appendChild(tdBasename);
                tr.appendChild(tdUser);
                tr.appendChild(tdTerminate);
                tr.appendChild(tdFP);
                tr.appendChild(tdArgs);
                newtb.appendChild(tr);
            }
            table.appendChild(newtb);
            prevtb.remove();
            tbody = newtb;
        }, 1000);
    })();
    addEventListener("signal", async function(e) {
        if (e.detail == 15) await window.availableAPIs.terminate();
    }); null;`, token);
    await fs.chown(target + "/apps/taskManager.js", "root", token);
    await fs.chgrp(target + "/apps/taskManager.js", "root", token);
    await fs.chmod(target + "/apps/taskManager.js", "rx", token);
}

async function sysadminInstaller(target, token) {
    let fs = modules.fs;
    let existing = (await fs.ls(target, token)).includes("apps");
    if (!existing) await fs.mkdir(target + "/apps", token);
    await fs.chown(target + "/apps", "root", token);
    await fs.chgrp(target + "/apps", "root", token);
    await fs.chmod(target + "/apps", "rx", token);
    let existing2 = (await fs.ls(target + "/apps", token)).includes("links");
    if (!existing2) await fs.mkdir(target + "/apps/links", token);
    await fs.chown(target + "/apps/links", "root", token);
    await fs.chgrp(target + "/apps/links", "root", token);
    await fs.chmod(target + "/apps/links", "rx", token);
    await fs.write(target + "/apps/links/sysAdmin.lnk", JSON.stringify({
        localeReferenceName: "SYSADMIN_TOOLS_TITLE",
        path: target + "/apps/sysAdmin.js"
    }), token);
    await fs.chown(target + "/apps/links/sysAdmin.lnk", "root", token);
    await fs.chgrp(target + "/apps/links/sysAdmin.lnk", "root", token);
    await fs.chmod(target + "/apps/links/sysAdmin.lnk", "rx", token);
    await fs.write(target + "/apps/sysAdmin.js", `(async function() {
        // @pcos-app-mode iso`+`latable
        await availableAPIs.windowTitleSet(await availableAPIs.lookupLocale("SYSADMIN_TOOLS_TITLE"));
        let privileges = await availableAPIs.getPrivileges();
        let checklist = [ "RUN_KLVL_CODE", "FS_WRITE", "SYSTEM_SHUTDOWN", "FETCH_SEND", "FS_REMOVE" ];
        document.body.style.fontFamily = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
        if (await availableAPIs.isDarkThemed()) document.body.style.color = "white";
        if (!checklist.every(p => privileges.includes(p))) {
            document.body.innerText = await availableAPIs.lookupLocale("SYSADMIN_TOOLS_PRIVFAIL");
            return;
        }
        let container = document.createElement("div");
        let extraActivities = document.createElement("div");
        let osReinstallButton = document.createElement("button");
        let fsckOrderButton = document.createElement("button");
        let wipeSystemButton = document.createElement("button");
        let optionalComponentMgmt = document.createElement("button");
        osReinstallButton.innerText = await availableAPIs.lookupLocale("REINSTALL_BUTTON");
        fsckOrderButton.innerText = await availableAPIs.lookupLocale("FSCK_BUTTON");
        wipeSystemButton.innerText = await availableAPIs.lookupLocale("SWIPE_BUTTON");
        optionalComponentMgmt.innerText = await availableAPIs.lookupLocale("OPTIONAL_COMPONENTS_TITLE");
        osReinstallButton.addEventListener("click", async function() {
            container.hidden = true;
            extraActivities.innerText = await availableAPIs.lookupLocale("REINSTALL_DOWNLOADING");
            let osArchive;
            try {
                osArchive = await availableAPIs.fetchSend({
                    url: "/os.js",
                    init: {}
                });
            } catch (e) {
                console.error(e);
                extraActivities.innerText = await availableAPIs.lookupLocale("REINSTALL_DOWNLOAD_FAILED");
                container.hidden = false;
                return;
            }
            extraActivities.innerText = await availableAPIs.lookupLocale("REINSTALL_DECODING");
            osArchive = osArchive.arrayBuffer;
            osArchive = new TextDecoder().decode(osArchive);
            extraActivities.innerText = await availableAPIs.lookupLocale("REINSTALL_SETTING");
            await availableAPIs.runKlvlCode("modules.core.disk.partition('boot').setData(" + JSON.stringify(osArchive) + ");");
            extraActivities.innerText = await availableAPIs.lookupLocale("RESTARTING");
            await availableAPIs.shutdown({
                isReboot: true
            });
        });
        fsckOrderButton.addEventListener("click", async function() {
            container.hidden = true;
            extraActivities.innerText = await availableAPIs.lookupLocale("SETTING_FSCK_FLAG");
            try {
                await availableAPIs.fs_write({
                    path: (await availableAPIs.getSystemMount()) + "/.fsck",
                    data: "1"
                });
            } catch {
                extraActivities.innerText = await availableAPIs.lookupLocale("SETTING_FSCK_FLAG_FAILED");
                container.hidden = false;
                return;
            }
            extraActivities.innerText = await availableAPIs.lookupLocale("RESTARTING");
            await availableAPIs.shutdown({
                isReboot: true
            });
        });
        wipeSystemButton.addEventListener("click", async function() {
            container.hidden = true;
            extraActivities.innerText = await availableAPIs.lookupLocale("WIPING_SYSTEM");
            try {
                await availableAPIs.runKlvlCode(\`(async function() {
    let idb_keys = modules.core.idb._db.transaction("disk").objectStore("disk").getAllKeys();
    idb_keys = await new Promise(function(resolve) {
        idb_keys.onsuccess = () => resolve(idb_keys.result);
    });
    for (let key of idb_keys) {
        let partLen = (await modules.core.idb.readPart(key)).length;
        let randomness = "";
        while (randomness.length < partLen) {
            let remainingBytes = Math.round((partLen - randomness.length) / 2);
            if (remainingBytes > 65536) remainingBytes = 65536;
            randomness += crypto.getRandomValues(new Uint8Array(remainingBytes)).reduce((a, b) => a + b.toString(16).padStart(2, "0"), "");
        }
        await modules.core.idb.writePart(key, randomness);
        await modules.core.idb.sync();
        await modules.core.idb.removePart(key);
        await modules.core.idb.sync();
    }
    modules.restart();
})();\`);
            } catch (e) {
                console.error(e);
                extraActivities.innerText = await availableAPIs.lookupLocale("WIPING_SYSTEM_FAILED");
                container.hidden = false;
                return;
            }
        });
        optionalComponentMgmt.addEventListener("click", async function() {
            await availableAPIs.windowTitleSet(await availableAPIs.lookupLocale("OPTIONAL_COMPONENTS_TITLE"));
            extraActivities.innerText = "";
            let cmponents = {};
            let rawComponentFile;
            try {
                rawComponentFile = await availableAPIs.fs_read({
                    path: (await availableAPIs.getSystemMount()) + "/boot/15-optional.js"
                });
            } catch {
                try {
                    container.innerText = await availableAPIs.lookupLocale("NO_COMPONENTS_FILE");
                    rawComponentFile = await availableAPIs.fetchSend({
                        url: "/os.js",
                        init: {}
                    });
                    rawComponentFile = rawComponentFile.arrayBuffer;
                    rawComponentFile = new TextDecoder().decode(rawComponentFile);
                    rawComponentFile = rawComponentFile.split("\\n");
                    let startIndex = rawComponentFile.indexOf("// =====BEGIN ALL OPTIONAL COMPONENTS=====");
                    let endIndex = rawComponentFile.indexOf("// =====END ALL OPTIONAL COMPONENTS=====");
                    rawComponentFile = rawComponentFile.slice(startIndex + 1, endIndex);
                    rawComponentFile = rawComponentFile.join("\\n");
                    await availableAPIs.fs_write({
                        path: (await availableAPIs.getSystemMount()) + "/boot/15-optional.js",
                        data: rawComponentFile
                    });
                } catch {
                    container.innerText = await availableAPIs.lookupLocale("FAILED_COMPONENTS_DOWNLOAD");
                }
            }
            async function reparse() {
                cmponents = {};
                container.innerText = await availableAPIs.lookupLocale("PARSING_COMPONENTS");
                rawComponentFile = rawComponentFile.split("\\n");
                let componentComputerNames = rawComponentFile.filter(a => a.startsWith("// =====BEGIN ") && a.endsWith(" COMPONENT METADATA=====")).map(a => a.replace("// =====BEGIN ", "").replace(" COMPONENT METADATA=====", ""));
                for (let compName of componentComputerNames) {
                    let metadataLineIndex = rawComponentFile.indexOf("// =====BEGIN " + compName + " COMPONENT METADATA=====");
                    let metadataLineEndIndex = rawComponentFile.indexOf("// =====END " + compName + " COMPONENT METADATA=====");
                    let installerLineIndex = rawComponentFile.indexOf("// =====BEGIN " + compName + " COMPONENT INSTALLER=====");
                    let installerLineEndIndex = rawComponentFile.indexOf("// =====END " + compName + " COMPONENT INSTALLER=====");
                    let removerLineIndex = rawComponentFile.indexOf("// =====BEGIN " + compName + " COMPONENT REMOVER=====");
                    let removerLineEndIndex = rawComponentFile.indexOf("// =====END " + compName + " COMPONENT REMOVER=====");
                    let checkersLineIndex = rawComponentFile.indexOf("// =====BEGIN " + compName + " COMPONENT CHECKER=====");
                    let checkersLineEndIndex = rawComponentFile.indexOf("// =====END " + compName + " COMPONENT CHECKER=====");
                    let metadata = rawComponentFile.slice(metadataLineIndex + 1, metadataLineEndIndex);
                    let metadataParsed = {};
                    for (let line of metadata) {
                        let lineSplit = line.replace("// ", "").split(": ");
                        metadataParsed[lineSplit[0]] = lineSplit[1];
                    }
                    let ipcPipe = await availableAPIs.createPipe();
                    let isInstalled = availableAPIs.listenToPipe(ipcPipe);
                    await availableAPIs.runKlvlCode(\`(async function() {
                        \${rawComponentFile.slice(checkersLineIndex, checkersLineEndIndex).join("\\n")}
                        modules.ipc.send(\${JSON.stringify(ipcPipe)}, await checker(\${JSON.stringify(await availableAPIs.getSystemMount())}, \${JSON.stringify(await availableAPIs.getProcessToken())}));
                    })();\`);
                    isInstalled = await isInstalled;
                    await availableAPIs.closePipe(ipcPipe);
                    cmponents[compName] = {
                        metadata: metadataParsed,
                        installer: rawComponentFile.slice(installerLineIndex + 1, installerLineEndIndex).join("\\n"),
                        remover: rawComponentFile.slice(removerLineIndex + 1, removerLineEndIndex).join("\\n"),
                        isInstalled: isInstalled
                    };
                }
                rawComponentFile = rawComponentFile.join("\\n");
            }
            async function showFullList() {
                container.innerText = "";
                for (let component in cmponents) {
                    let componentBtn = document.createElement("button");
                    componentBtn.innerText = await availableAPIs.lookupLocale(cmponents[component].metadata.localeReferenceName) || cmponents[component].metadata["localeName_" + (await availableAPIs.locale())] || cmponents[component].metadata.humanName;
                    componentBtn.addEventListener("click", async function() {
                        container.innerText = "";
                        let backButton = document.createElement("button");
                        let header = document.createElement("b");
                        let computerName = document.createElement("span");
                        let computerNameTitle = document.createElement("b");
                        let description = document.createElement("span");
                        let descriptionTitle = document.createElement("b");
                        let license = document.createElement("span");
                        let licenseTitle = document.createElement("b");
                        let actionButton = document.createElement("button");
                        backButton.innerText = await availableAPIs.lookupLocale("EXIT");
                        header.innerText = await availableAPIs.lookupLocale(cmponents[component].metadata.localeReferenceName) || cmponents[component].metadata["localeName_" + (await availableAPIs.locale())] || cmponents[component].metadata.humanName;
                        computerNameTitle.innerText = "ID: ";
                        computerName.innerText = component;
                        descriptionTitle.innerText = await availableAPIs.lookupLocale("DESCRIPTION_FIELD") + ": ";
                        description.innerText = await availableAPIs.lookupLocale(cmponents[component].metadata.localeReferenceDescription) || cmponents[component].metadata["localeDescription_" + (await availableAPIs.locale())] || cmponents[component].metadata.description;
                        licenseTitle.innerText = await availableAPIs.lookupLocale("LICENSE_FIELD") + ": ";
                        license.innerText = cmponents[component].metadata.license;
                        container.appendChild(backButton);
                        container.appendChild(header);
                        container.appendChild(document.createElement("hr"));
                        container.appendChild(computerNameTitle);
                        container.appendChild(computerName);
                        container.appendChild(document.createElement("br"));
                        container.appendChild(descriptionTitle);
                        container.appendChild(description);
                        container.appendChild(document.createElement("br"));
                        container.appendChild(licenseTitle);
                        container.appendChild(license);
                        container.appendChild(document.createElement("hr"));
                        container.appendChild(actionButton);
                        backButton.addEventListener("click", async function() {
                            await showFullList();
                        });
                        actionButton.innerText = cmponents[component].isInstalled ? (await availableAPIs.lookupLocale("REMOVE_BTN")) : (await availableAPIs.lookupLocale("INSTALL_BUTTON"));
                        actionButton.addEventListener("click", async function() {
                            let executedFnName = cmponents[component].isInstalled ? "remover" : "installer";
                            let ipcPipe = await availableAPIs.createPipe();
                            container.hidden = true;
                            extraActivities.innerText = await availableAPIs.lookupLocale("MODIFYING_STATUS");
                            let result = availableAPIs.listenToPipe(ipcPipe);
                            await availableAPIs.runKlvlCode(\`(async function() {
                                \${cmponents[component][executedFnName]}
                                try {
                                    await \${executedFnName}(\${JSON.stringify(await availableAPIs.getSystemMount())}, \${JSON.stringify(await availableAPIs.getProcessToken())});
                                    modules.ipc.send(\${JSON.stringify(ipcPipe)}, true);
                                } catch (e) {
                                    console.error(e);
                                    modules.ipc.send(\${JSON.stringify(ipcPipe)}, false);
                                }
                            })();\`);
                            result = await result;
                            extraActivities.innerText = result ? (await availableAPIs.lookupLocale("MODIFYING_SUCCESS")) : (await availableAPIs.lookupLocale("MODIFYING_FAILED"));
                            await availableAPIs.closePipe(ipcPipe);
                            container.hidden = false;
                            if (result) {
                                await reparse();
                                await showFullList();
                            }
                        });
                    });
                    container.appendChild(componentBtn);
                }
            }
            await reparse();
            await showFullList();
        });
        container.appendChild(fsckOrderButton);
        container.appendChild(osReinstallButton);
        container.appendChild(wipeSystemButton);
        container.appendChild(optionalComponentMgmt);
        document.body.appendChild(container);
        document.body.appendChild(extraActivities);
    })();
    addEventListener("signal", async function(e) {
        if (e.detail == 15) await window.availableAPIs.terminate();
    }); null;`, token);
    await fs.chown(target + "/apps/sysAdmin.js", "root", token);
    await fs.chgrp(target + "/apps/sysAdmin.js", "root", token);
    await fs.chmod(target + "/apps/sysAdmin.js", "rx", token);
}

async function networkInstaller(target, token) {
    let fs = modules.fs;
    let existing = (await fs.ls(target, token)).includes("apps");
    if (!existing) await fs.mkdir(target + "/apps", token);
    await fs.chown(target + "/apps", "root", token);
    await fs.chgrp(target + "/apps", "root", token);
    await fs.chmod(target + "/apps", "rx", token);
    let existing2 = (await fs.ls(target + "/apps", token)).includes("links");
    if (!existing2) await fs.mkdir(target + "/apps/links", token);
    await fs.chown(target + "/apps/links", "root", token);
    await fs.chgrp(target + "/apps/links", "root", token);
    await fs.chmod(target + "/apps/links", "rx", token);
    await fs.write(target + "/apps/links/pcosNetwork.lnk", JSON.stringify({
        localeReferenceName: "NETCONFIG_TITLE",
        path: target + "/apps/pcosNetwork.js"
    }), token);
    await fs.chown(target + "/apps/links/pcosNetwork.lnk", "root", token);
    await fs.chgrp(target + "/apps/links/pcosNetwork.lnk", "root", token);
    await fs.chmod(target + "/apps/links/pcosNetwork.lnk", "rx", token);
    await fs.write(target + "/apps/pcosNetwork.js", `(async function() {
        // @pcos-app-mode iso`+`latable
        await availableAPIs.windowTitleSet(await availableAPIs.lookupLocale("NETCONFIG_TITLE"));
        let privileges = await availableAPIs.getPrivileges();
        let checklist = [ "IDENTIFY_SYSTEM", "CSP_OPERATIONS", "FS_READ", "FS_WRITE", "FS_LIST_PARTITIONS" ];
        document.body.style.fontFamily = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
        if (await availableAPIs.isDarkThemed()) document.body.style.color = "white";
        if (!checklist.every(p => privileges.includes(p))) {
            document.body.innerText = await availableAPIs.lookupLocale("NETCONFIG_DENY");
            return;
        }
        let existingConfig = {};
        try {
            existingConfig = JSON.parse(await availableAPIs.fs_read({
                path: (await availableAPIs.getSystemMount()) + "/etc/network.json"
            }));
        } catch {}
        let descriptionNetworkURL = document.createElement("span");
        let paramNetworkURL = document.createElement("input");
        let ucBits = document.createElement("input");
        let descriptionStartOnStartup = document.createElement("label");
        let paramStartOnStartup = document.createElement("input");
        let saveBtn = document.createElement("button");
        let updatePredictBtn = document.createElement("button");
        let addressPrediction = document.createElement("span");
        let form = document.createElement("form");
        descriptionNetworkURL.innerText = await availableAPIs.lookupLocale("NETCONFIG_URLF");
        paramNetworkURL.value = existingConfig.url || "";
        descriptionStartOnStartup.innerText = await availableAPIs.lookupLocale("NETCONFIG_AUTO");
        paramStartOnStartup.type = "checkbox";
        paramStartOnStartup.disabled = true;
        paramStartOnStartup.checked = existingConfig.startOnStartup;
        paramStartOnStartup.id = "startOnStartup";
        descriptionStartOnStartup.setAttribute("for", "startOnStartup");
        ucBits.placeholder = await availableAPIs.lookupLocale("NETCONFIG_UC");
        ucBits.type = "number";
        ucBits.min = 0;
        ucBits.max = 4294967295;
        ucBits.value = existingConfig.ucBits;
        saveBtn.innerText = await availableAPIs.lookupLocale("NETCONFIG_SAVE");
        updatePredictBtn.innerText = await availableAPIs.lookupLocale("NETCONFIG_PREDICT");
        form.appendChild(descriptionNetworkURL);
        form.appendChild(paramNetworkURL);
        form.appendChild(document.createElement("br"));
        form.appendChild(ucBits);
        form.appendChild(document.createElement("br"));
        form.appendChild(paramStartOnStartup);
        form.appendChild(descriptionStartOnStartup);
        form.appendChild(document.createElement("br"));
        form.appendChild(saveBtn);
        form.appendChild(updatePredictBtn);
        addressPrediction.innerText = await availableAPIs.lookupLocale("EMPTY_STATUSBAR");
        document.body.appendChild(form);
        document.body.appendChild(document.createElement("hr"));
        document.body.appendChild(addressPrediction);
        saveBtn.addEventListener("click", async function(e) {
            e.preventDefault();
            try {
                await availableAPIs.fs_write({
                    path: (await availableAPIs.getSystemMount()) + "/etc/network.json",
                    data: JSON.stringify({
                        url: paramNetworkURL.value,
                        startOnStartup: paramStartOnStartup.checked,
                        ucBits: Math.round(Math.abs(Number(ucBits.value)))
                    }, null, "\\t")
                });
                addressPrediction.innerText = await availableAPIs.lookupLocale("NETCONFIG_SAVE_OK");
            } catch {
                addressPrediction.innerText = await availableAPIs.lookupLocale("NETCONFIG_SAVE_FAIL");
            }
        });
        updatePredictBtn.addEventListener("click", function(e) {
            e.preventDefault();
            updatePrediction({ addressPrediction, ucBits });
        });
    })();
    function findInputNumberString(output, chars) {
        let inputNum = 0n;
        for (let i = 0n; i < output.length; i++) {
            const charIndex = chars.indexOf(output[i]);
            if (charIndex === -1) throw new Error(\`Invalid character '\${output[i]}' in output string\`);
            inputNum = inputNum * BigInt(chars.length) + BigInt(charIndex);
        }
        return inputNum;
    }
    function generateString(num, chars) {
        let base = BigInt(chars.length), result = '';
        while (num > 0n) result = chars[Number(num % base)] + result, num /= base;
        return result;
    }

    async function updatePrediction(elementInterface) {
        let publicSystemID = await availableAPIs.getPublicSystemID();
        if (!publicSystemID) return elementInterface.addressPrediction.innerText = await availableAPIs.lookupLocale("NETCONFIG_SYSIDM");
        let sysIDx = u8aToHex(new Uint8Array(await availableAPIs.cspOperation({
            cspProvider: "basic",
            operation: "digest",
            cspArgument: {
                algorithm: "SHA-256",
                data: hexToU8A(generateString(findInputNumberString(publicSystemID.x, base64Charset), hexCharset))
            }
        }))).padStart(8, "0").slice(0, 8);
        let sysIDy = u8aToHex(new Uint8Array(await availableAPIs.cspOperation({
            cspProvider: "basic",
            operation: "digest",
            cspArgument: {
                algorithm: "SHA-256",
                data: hexToU8A(generateString(findInputNumberString(publicSystemID.y, base64Charset), hexCharset))
            }
        }))).padStart(8, "0").slice(0, 8);
        let ucPredict = Math.round(Math.abs(Number(elementInterface.ucBits.value))).toString(16).padStart(8, "0").slice(0, 8);
        return elementInterface.addressPrediction.innerText = ("xxxxxxxx" + sysIDx + sysIDy + ucPredict).match(/.{1,4}/g).join(":");
    }
    let hexToU8A = (hex) => Uint8Array.from(hex.match(/.{1,2}/g).map(a => parseInt(a, 16)));
    let u8aToHex = (u8a) => Array.from(u8a).map(a => a.toString(16).padStart(2, "0")).join("");
    let base64Charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
    let hexCharset = "0123456789abcdef";
    addEventListener("signal", async function(e) {
        if (e.detail == 15) await window.availableAPIs.terminate();
    }); null;`, token);
    await fs.write(target + "/apps/networkd.js", `let hexToU8A = (hex) => Uint8Array.from(hex.match(/.{1,2}/g).map(a => parseInt(a, 16)));
    let u8aToHex = (u8a) => Array.from(u8a).map(a => a.toString(16).padStart(2, "0")).join("");
    (async function() {
        // @pcos-app-mode iso`+`latable
        let reachedStableCon = false;
        let softConnection = exec_args.includes("--soft-connection");
        await availableAPIs.windowTitleSet("PCOS Network");
        await availableAPIs.windowVisibility(false);
        let privileges = await availableAPIs.getPrivileges();
        let checklist = [ "IDENTIFY_SYSTEM", "CSP_OPERATIONS", "FS_READ", "FS_WRITE", "FS_LIST_PARTITIONS", "IDENTIFY_SYSTEM_SENSITIVE", "SYSTEM_STABILITY", "WEBSOCKETS_OPEN", "WEBSOCKETS_SEND" ];
        document.body.style.fontFamily = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
        if (await availableAPIs.isDarkThemed()) document.body.style.color = "white";
        if (!checklist.every(p => privileges.includes(p))) return availableAPIs.terminate();
        await availableAPIs.critical(true);
        let existingConfig = {};
        try {
            existingConfig = JSON.parse(await availableAPIs.fs_read({
                path: (await availableAPIs.getSystemMount()) + "/etc/network.json"
            }));
        } catch {
            return availableAPIs.terminate();
        }
        let ws = await availableAPIs.websocketOpen(existingConfig.url);
        await availableAPIs.listenToWebsocket({ handle: ws, eventName: "message" });
        let sentPsi = await availableAPIs.getPublicSystemID();
        sentPsi.userCustomizable = existingConfig.ucBits;
        sentPsi.forceConnect = !softConnection;
        let privateKeyImport = await availableAPIs.cspOperation({
            cspProvider: "basic",
            operation: "importKey",
            cspArgument: {
                format: "jwk",
                keyData: await availableAPIs.getPrivateSystemID(),
                algorithm: {
                    name: "ECDSA",
                    namedCurve: "P-256"
                },
                extractable: true,
                keyUsages: [ "sign" ]
            }
        });
        async function initTermination(terminateReason) {
            await availableAPIs.fs_write({
                path: "ram/run/network.log",
                data: "CloseReason;" + terminateReason
            });
            await availableAPIs.cspOperation({
                cspProvider: "basic",
                operation: "unloadKey",
                cspArgument: privateKeyImport
            });
            try {
                if (reachedStableCon) await availableAPIs.sendToWebsocket({ handle: ws, data: JSON.stringify({ finalProxyPacket: true }) });
                await availableAPIs.closeWebsocket(ws);
            } catch {}
            await availableAPIs.deleteWebsocket(ws);
            await availableAPIs.terminate();
        }
        addEventListener("signal", async function(e) {
            if (e.detail == 15) await initTermination("ProcessSignal");
        });
        await availableAPIs.sendToWebsocket({ handle: ws, data: JSON.stringify(sentPsi) });
        let dataToSign;
        while (true) {
            dataToSign = await availableAPIs.listenToWebsocket({ handle: ws, eventName: "message" });
            if (dataToSign == "PublicKeyInvalid") initTermination(dataToSign);
            break;
        }
        dataToSign = hexToU8A(dataToSign);
        let signature = await availableAPIs.cspOperation({
            cspProvider: "basic",
            operation: "sign",
            cspArgument: {
                algorithm: {
                    name: "ECDSA",
                    hash: {
                        name: "SHA-256"
                    }
                },
                key: privateKeyImport,
                data: dataToSign
            }
        });
        signature = u8aToHex(new Uint8Array(signature));
        await availableAPIs.sendToWebsocket({ handle: ws, data: signature });
        let connectionData;
        while (true) {
            connectionData = await availableAPIs.listenToWebsocket({ handle: ws, eventName: "message" });
            if (connectionData == "SignatureInvalid") initTermination(connectionData);
            if (connectionData == "AddressConflict") initTermination(connectionData);
            break;
        }
        await availableAPIs.fs_write({
            path: "ram/run/networkAddress",
            data: connectionData.split(";")[1]
        });
        await availableAPIs.fs_write({
            path: "ram/run/network.ws",
            data: ws
        });
        reachedStableCon = true;
        await availableAPIs.listenToWebsocket({ handle: ws, eventName: "close" });
        reachedStableCon = false;
        await availableAPIs.deleteWebsocket(ws);
        await availableAPIs.fs_rm({ path: "ram/run/networkAddress" });
        await availableAPIs.fs_rm({ path: "ram/run/network.ws" });
        await initTermination("CleanClose");
    })(); null;`, token);
    await fs.chgrp(target + "/apps/pcosNetwork.js", "root", token);
    await fs.chmod(target + "/apps/pcosNetwork.js", "rx", token);
    await fs.chown(target + "/apps/pcosNetwork.js", "root", token);
    await fs.chgrp(target + "/apps/networkd.js", "root", token);
    await fs.chmod(target + "/apps/networkd.js", "rx", token);
    await fs.chown(target + "/apps/networkd.js", "root", token);
}

async function textEditorInstaller(target, token) {
    let fs = modules.fs;
    let existing = (await fs.ls(target, token)).includes("apps");
    if (!existing) await fs.mkdir(target + "/apps", token);
    await fs.chown(target + "/apps", "root", token);
    await fs.chgrp(target + "/apps", "root", token);
    await fs.chmod(target + "/apps", "rx", token);
    let existing2 = (await fs.ls(target + "/apps", token)).includes("links");
    if (!existing2) await fs.mkdir(target + "/apps/links", token);
    await fs.chown(target + "/apps/links", "root", token);
    await fs.chgrp(target + "/apps/links", "root", token);
    await fs.chmod(target + "/apps/links", "rx", token);
    await fs.write(target + "/apps/links/textEditor.lnk", JSON.stringify({
        localeReferenceName: "TEXT_EDITOR",
        path: target + "/apps/textEditor.js"
    }), token);
    await fs.chown(target + "/apps/links/textEditor.lnk", "root", token);
    await fs.chgrp(target + "/apps/links/textEditor.lnk", "root", token);
    await fs.chmod(target + "/apps/links/textEditor.lnk", "rx", token);
    await fs.write(target + "/apps/textEditor.js", `(async function() {
        // @pcos-app-mode iso`+`latable
        await availableAPIs.windowTitleSet(await availableAPIs.lookupLocale("TEXT_EDITOR"));
        document.body.style.fontFamily = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
        if (await availableAPIs.isDarkThemed()) document.body.style.color = "white";
        document.documentElement.style.height = "100%";
        document.documentElement.style.width = "100%";
        document.body.style.height = "100%";
        document.body.style.width = "100%";
        document.body.style.margin = "0";
        let flexContainer = document.createElement("div");
        let buttonContainer = document.createElement("div");
        let loadButton = document.createElement("button");
        let saveButton = document.createElement("button");
        let statusMessage = document.createElement("span");
        let data = document.createElement("textarea");
        let hr = document.createElement("hr");
        let hrContainer = document.createElement("div");
        loadButton.innerText = await availableAPIs.lookupLocale("LOAD_BTN");
        saveButton.innerText = await availableAPIs.lookupLocale("SAVE_BTN");
        flexContainer.style.display = "flex";
        flexContainer.style.flexDirection = "column";
        flexContainer.style.width = "100%";
        flexContainer.style.height = "100%";
        data.style.flexGrow = 1000;
        data.style.resize = "none";
        buttonContainer.appendChild(loadButton);
        buttonContainer.appendChild(saveButton);
        buttonContainer.appendChild(statusMessage);
        hrContainer.appendChild(hr);
        flexContainer.appendChild(buttonContainer);
        flexContainer.appendChild(hrContainer);
        flexContainer.appendChild(data);
        document.body.appendChild(flexContainer);
        loadButton.onclick = async function() {
            let ipcPipe = await availableAPIs.createPipe();
            await availableAPIs.windowVisibility(false);
            await availableAPIs.startTask({ file: (await availableAPIs.getSystemMount()) + "/apps/filePicker.js", argPassed: [ipcPipe] });
            let result = await availableAPIs.listenToPipe(ipcPipe);
            await availableAPIs.closePipe(ipcPipe);
            await availableAPIs.windowVisibility(true);
            try {
                if (result.success) {
                    data.value = await availableAPIs.fs_read({ path: result.selected });
                    statusMessage.innerText = result.selected.split("/").pop();
                }
            } catch (e) {
                statusMessage.innerText = e.name + ": " + e.message;
            }
        }
        saveButton.onclick = async function() {
            let ipcPipe = await availableAPIs.createPipe();
            await availableAPIs.windowVisibility(false);
            await availableAPIs.startTask({ file: (await availableAPIs.getSystemMount()) + "/apps/filePicker.js", argPassed: [ipcPipe, "save"] });
            let result = await availableAPIs.listenToPipe(ipcPipe);
            await availableAPIs.closePipe(ipcPipe);
            await availableAPIs.windowVisibility(true);
            try {
                if (result.success) await availableAPIs.fs_write({ path: result.selected, data: data.value });
            } catch (e) {
                statusMessage.innerText = e.name + ": " + e.message;
            }
        }
    })();
    addEventListener("signal", async function(e) {
        if (e.detail == 15) await window.availableAPIs.terminate();
    }); null;`, token);
    await fs.chown(target + "/apps/textEditor.js", "root", token);
    await fs.chgrp(target + "/apps/textEditor.js", "root", token);
    await fs.chmod(target + "/apps/textEditor.js", "rx", token);
}

async function personalSecurityInstaller(target, token) {
    let fs = modules.fs;
    let existing = (await fs.ls(target, token)).includes("apps");
    if (!existing) await fs.mkdir(target + "/apps", token);
    await fs.chown(target + "/apps", "root", token);
    await fs.chgrp(target + "/apps", "root", token);
    await fs.chmod(target + "/apps", "rx", token);
    let existing2 = (await fs.ls(target + "/apps", token)).includes("links");
    if (!existing2) await fs.mkdir(target + "/apps/links", token);
    await fs.chown(target + "/apps/links", "root", token);
    await fs.chgrp(target + "/apps/links", "root", token);
    await fs.chmod(target + "/apps/links", "rx", token);
    await fs.write(target + "/apps/links/personalSecurity.lnk", JSON.stringify({
        localeReferenceName: "PERSONAL_SECURITY_TITLE",
        path: target + "/apps/personalSecurity.js"
    }), token);
    await fs.chown(target + "/apps/links/personalSecurity.lnk", "root", token);
    await fs.chgrp(target + "/apps/links/personalSecurity.lnk", "root", token);
    await fs.chmod(target + "/apps/links/personalSecurity.lnk", "rx", token);
    await fs.write(target + "/apps/personalSecurity.js", `(async function() {
        // @pcos-app-mode iso`+`latable
        await availableAPIs.windowTitleSet(await availableAPIs.lookupLocale("PERSONAL_SECURITY_TITLE"));
        let privileges = await availableAPIs.getPrivileges();
        let checklist = [ "SET_SECURITY_CHECKS", "GET_USER_INFO", "CSP_OPERATIONS" ];
        document.body.style.fontFamily = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
        if (await availableAPIs.isDarkThemed()) document.body.style.color = "white";
        if (!checklist.every(p => privileges.includes(p))) {
            document.body.innerText = await availableAPIs.lookupLocale("PERSONAL_SECURITY_DENY");
            let currentToken = await availableAPIs.getProcessToken();
            let newToken = await availableAPIs.getNewToken(await availableAPIs.getUser());
            if (!newToken) return;
            await availableAPIs.setProcessToken(newToken);
            await availableAPIs.revokeToken(currentToken);
            privileges = await availableAPIs.getPrivileges();
            if (!checklist.every(p => privileges.includes(p))) return;
        }
        let toolbar = document.createElement("div");
        let saveBtn = document.createElement("button");
        let loadBtn = document.createElement("button");
        let addBtn = document.createElement("button");
        toolbar.appendChild(saveBtn);
        toolbar.appendChild(loadBtn);
        toolbar.appendChild(addBtn);
        saveBtn.innerText = await availableAPIs.lookupLocale("SAVE_BTN");
        loadBtn.innerText = await availableAPIs.lookupLocale("LOAD_BTN");
        addBtn.innerText = await availableAPIs.lookupLocale("ADD_BTN");
        saveBtn.onclick = async function() {
            await availableAPIs.setOwnSecurityChecks({ checks });
            checks = (await availableAPIs.getUserInfo({ desiredUser: await availableAPIs.getUser(), sensitive: true })).securityChecks;
            reparse();
        };
        loadBtn.onclick = async function() {
            checks = (await availableAPIs.getUserInfo({ desiredUser: await availableAPIs.getUser(), sensitive: true })).securityChecks;
            reparse();
        };
        addBtn.onclick = function() {
            add();
        }
        document.body.appendChild(toolbar);
        document.body.appendChild(document.createElement("hr"));
        let secCheck = document.createElement("div");
        let types = [
            "pbkdf2",
            "informative",
            "informative_deny",
            "timeout",
            "timeout_deny",
            "serverReport",
            "pc-totp",
            "totp",
            "workingHours"
        ];
        let checks = (await availableAPIs.getUserInfo({ desiredUser: await availableAPIs.getUser(), sensitive: true })).securityChecks;

        let checkLocales = {
            "pbkdf2": "PBKDF2_OPTION",
            "informative": "INFORMATIVE_MESSAGE_OPTION",
            "informative_deny": "INFORMATIVE_MESSAGE_DENY_OPTION",
            "timeout": "TIMEOUT_OPTION",
            "timeout_deny": "TIMEOUT_DENY_OPTION",
            "serverReport": "SERVER_REPORT_OPTION",
            "pc-totp": "PCTOTP_OPTION",
            "totp": "RFCTOTP_OPTION",
            "workingHours": "WORKING_HOURS_OPTION"
        };

        async function reparse() {
            secCheck.remove();
            secCheck = document.createElement("div");

            for (let check in checks) {
                let checkInfo = checks[check];
                let checkDiv = document.createElement("div");
                checkDiv.style.display = "flex";
                let checkTitle = document.createElement("div");
                checkTitle.style.flex = 100;
                let checkBtns = document.createElement("div");
                checkTitle.innerText = await availableAPIs.lookupLocale(checkLocales[checkInfo.type]);
                let btnConfig = document.createElement("button");
                let btnUp = document.createElement("button");
                let btnDown = document.createElement("button");
                let btnDelete = document.createElement("button");
                btnConfig.innerText = "*";
                btnUp.innerText = "/\\\\";
                btnUp.disabled = check == 0;
                btnDown.disabled = check == checks.length - 1;
                btnDown.innerText = "\\\\/";
                btnDelete.innerText = "x";
                checkBtns.appendChild(btnConfig);
                checkBtns.appendChild(btnUp);
                checkBtns.appendChild(btnDown);
                checkBtns.appendChild(btnDelete);
                checkDiv.appendChild(checkTitle);
                checkDiv.appendChild(checkBtns);
                btnDelete.addEventListener("click", function() {
                    checks.splice(check, 1);
                    reparse();
                });
                secCheck.appendChild(checkDiv);
                btnUp.addEventListener("click", function() {
                    checks.splice(check, 1);
                    checks.splice(check - 1, 0, checkInfo);
                    reparse();
                });
                btnDown.addEventListener("click", function() {
                    checks.splice(check, 1);
                    checks.splice(check - 1 + 2, 0, checkInfo);
                    reparse();
                });
                btnConfig.addEventListener("click", function() {
                    checkConfig(check);
                });
            }
            document.body.appendChild(secCheck);
        }

        async function checkConfig(check) {
            secCheck.remove();
            secCheck = document.createElement("div");
            let checkInfo = checks[check];
            let checkBack = document.createElement("button");
            let checkName = document.createElement("b");
            checkBack.innerText = "<-";
            checkName.innerText = await availableAPIs.lookupLocale(checkLocales[checkInfo.type]);
            secCheck.appendChild(checkBack);
            secCheck.appendChild(checkName);
            secCheck.appendChild(document.createElement("br"));
            checkBack.addEventListener("click", function() {
                reparse();
            });
            if (checkInfo.type == "pbkdf2") {
                let inputDescribe = document.createElement("span");
                let inputBox = document.createElement("input");
                let inputAccept = document.createElement("button");
                inputDescribe.innerText = await availableAPIs.lookupLocale("PASSWORD") + ": ";
                inputBox.type = "password";
                secCheck.appendChild(inputDescribe);
                secCheck.appendChild(inputBox);
                secCheck.appendChild(inputAccept);
                inputAccept.innerText = await availableAPIs.lookupLocale("CONFIRM");
                inputAccept.addEventListener("click", async function() {
                    let salt = await availableAPIs.cspOperation({
                        cspProvider: "basic",
                        operation: "random",
                        cspArgument: new Uint8Array(64)
                    });
                    let u8aToHex = (u8a) => Array.from(u8a).map(a => a.toString(16).padStart(2, "0")).join("");
                    let key = await availableAPIs.cspOperation({
                        cspProvider: "basic",
                        operation: "importKey",
                        cspArgument: {
                            format: "raw",
                            keyData: new TextEncoder().encode(inputBox.value),
                            algorithm: {
                                name: "PBKDF2"
                            },
                            extractable: false,
                            keyUsages: ["deriveBits", "deriveKey"]
                        }
                    });
                    let derived = new Uint8Array(await availableAPIs.cspOperation({
                        cspProvider: "basic",
                        operation: "deriveBits",
                        cspArgument: {
                            algorithm: {
                                name: "PBKDF2",
                                salt: salt,
                                iterations: 100000,
                                hash: "SHA-256"
                            },
                            baseKey: key,
                            length: 256
                        }
                    }));
                    await availableAPIs.cspOperation({
                        cspProvider: "basic",
                        operation: "unloadKey",
                        cspArgument: key
                    });
                    checks[check] = {
                        type: "pbkdf2",
                        hash: u8aToHex(derived),
                        salt: u8aToHex(salt)
                    };
                    reparse();
                });
            } else if (checkInfo.type == "informative" || checkInfo.type == "informative_deny") {
                let textarea = document.createElement("textarea");
                let inputAccept = document.createElement("button");
                textarea.placeholder = await availableAPIs.lookupLocale("MESSAGE_ENTER");
                textarea.value = checkInfo.message;
                secCheck.appendChild(textarea);
                secCheck.appendChild(document.createElement("br"));
                secCheck.appendChild(inputAccept);
                inputAccept.innerText = await availableAPIs.lookupLocale("CONFIRM");
                inputAccept.addEventListener("click", function() {
                    checks[check].message = textarea.value;
                    reparse();
                });
            } else if (checkInfo.type == "timeout" || checkInfo.type == "timeout_deny") {
                let inputDescribe = document.createElement("span");
                let inputBox = document.createElement("input");
                let inputAccept = document.createElement("button");
                inputDescribe.innerText = await availableAPIs.lookupLocale("TIMEOUT_FIELD") + ": ";
                inputBox.type = "number";
                inputBox.value = checkInfo.timeout;
                inputAccept.innerText = await availableAPIs.lookupLocale("CONFIRM");
                secCheck.appendChild(inputDescribe);
                secCheck.appendChild(inputBox);
                secCheck.appendChild(inputAccept);
                inputAccept.addEventListener("click", function() {
                    checks[check].timeout = inputBox.value;
                    reparse();
                });
            } else if (checkInfo.type == "serverReport") {
                let inputDescribe = document.createElement("span");
                let inputBox = document.createElement("input");
                let inputAccept = document.createElement("button");
                inputDescribe.innerText = "URL: ";
                inputBox.type = "text";
                inputBox.placeholder = "https://example.org/report";
                inputBox.value = checkInfo.message;
                inputAccept.innerText = await availableAPIs.lookupLocale("CONFIRM");
                secCheck.appendChild(inputDescribe);
                secCheck.appendChild(inputBox);
                secCheck.appendChild(inputAccept);
                inputAccept.addEventListener("click", function() {
                    checks[check].url = inputBox.value;
                    reparse();
                });
            } else if (checkInfo.type == "pc-totp") {
                let inputDescribe = document.createElement("span");
                let inputBox = document.createElement("input");
                let regen = document.createElement("button");
                let inputAccept = document.createElement("button");
                inputDescribe.innerText = await availableAPIs.lookupLocale("SECRET_FIELD_TXT") + ": ";
                inputBox.type = "text";
                inputBox.value = checkInfo.secret;
                regen.innerText = await availableAPIs.lookupLocale("REGENERATE");
                inputAccept.innerText = await availableAPIs.lookupLocale("CONFIRM");
                secCheck.appendChild(inputDescribe);
                secCheck.appendChild(inputBox);
                secCheck.appendChild(document.createElement("br"));
                secCheck.appendChild(regen);
                secCheck.appendChild(inputAccept);
                regen.addEventListener("click", async function() {
                    let randomValues = await availableAPIs.cspOperation({
                        cspProvider: "basic",
                        operation: "random",
                        cspArgument: new Uint8Array(32)
                    });
                    inputBox.value = Array.from(randomValues).map(x => x.toString(16).padStart(2, "0")).join("");
                });
                inputAccept.addEventListener("click", function() {
                    checks[check].secret = inputBox.value;
                    reparse();
                });
            } else if (checkInfo.type == "totp") {
                let inputDescribe = document.createElement("span");
                let inputBox = document.createElement("input");
                let regen = document.createElement("button");
                let inputAccept = document.createElement("button");
                inputDescribe.innerText = await availableAPIs.lookupLocale("SECRET_FIELD_HEX") + ": ";
                inputBox.type = "text";
                inputBox.value = checkInfo.secret;
                regen.innerText = await availableAPIs.lookupLocale("REGENERATE");
                inputAccept.innerText = await availableAPIs.lookupLocale("CONFIRM");
                secCheck.appendChild(inputDescribe);
                secCheck.appendChild(inputBox);
                secCheck.appendChild(document.createElement("br"));
                secCheck.appendChild(regen);
                secCheck.appendChild(inputAccept);
                regen.addEventListener("click", async function() {
                    let randomValues = await availableAPIs.cspOperation({
                        cspProvider: "basic",
                        operation: "random",
                        cspArgument: new Uint8Array(10)
                    });
                    inputBox.value = Array.from(randomValues).map(x => x.toString(16).padStart(2, "0")).join("");
                });
                inputAccept.addEventListener("click", function() {
                    checks[check].secret = inputBox.value;
                    reparse();
                });
            } else if (checkInfo.type == "workingHours") {
                let inputStartDescribe = document.createElement("span");
                let inputEndDescribe = document.createElement("span");
                let inputBoxStart = document.createElement("input");
                let inputBoxEnd = document.createElement("input");
                let inputAccept = document.createElement("button");
                inputStartDescribe.innerText = await availableAPIs.lookupLocale("START_TIME_FIELD") + ": ";
                inputBoxStart.type = "time";
                inputBoxStart.step = 1;
                if (checkInfo.start) inputBoxStart.value = String(checkInfo.start.hours).padStart(2, "0") + ":" + String(checkInfo.start.minutes).padStart(2, "0") + ":" + String(checkInfo.start.seconds).padStart(2, "0");
                inputEndDescribe.innerText = await availableAPIs.lookupLocale("END_TIME_FIELD") + ": ";
                inputBoxEnd.type = "time";
                inputBoxEnd.step = 1;
                if (checkInfo.end) inputBoxEnd.value = String(checkInfo.end.hours).padStart(2, "0") + ":" + String(checkInfo.end.minutes).padStart(2, "0") + ":" + String(checkInfo.end.seconds).padStart(2, "0");
                inputAccept.innerText = await availableAPIs.lookupLocale("CONFIRM");
                secCheck.appendChild(inputStartDescribe);
                secCheck.appendChild(inputBoxStart);
                secCheck.appendChild(document.createElement("br"));
                secCheck.appendChild(inputEndDescribe);
                secCheck.appendChild(inputBoxEnd);
                secCheck.appendChild(document.createElement("br"));
                secCheck.appendChild(inputAccept);
                inputAccept.addEventListener("click", function() {
                    checks[check].start = {
                        hours: Number(inputBoxStart.value.split(":")[0]),
                        minutes: Number(inputBoxStart.value.split(":")[1]),
                        seconds: Number(inputBoxStart.value.split(":")[2])
                    };
                    checks[check].end = {
                        hours: Number(inputBoxEnd.value.split(":")[0]),
                        minutes: Number(inputBoxEnd.value.split(":")[1]),
                        seconds: Number(inputBoxEnd.value.split(":")[2])
                    };
                    reparse();
                });
            }
            document.body.appendChild(secCheck);
        }

        async function add() {
            secCheck.remove();
            secCheck = document.createElement("div");
            let backBtn = document.createElement("button");
            backBtn.innerText = "<-";
            backBtn.addEventListener("click", function() {
                reparse();
            });
            secCheck.appendChild(backBtn);
            for (let type of types) {
                let btn = document.createElement("button");
                btn.innerText = await availableAPIs.lookupLocale(checkLocales[type]);
                btn.addEventListener("click", function() {
                    checks.push({ type });
                    reparse();
                });
                secCheck.appendChild(btn);
            }
            document.body.appendChild(secCheck);
        }
        reparse();
    })();
    addEventListener("signal", async function(e) {
        if (e.detail == 15) await window.availableAPIs.terminate();
    }); null;`, token);
    await fs.chown(target + "/apps/personalSecurity.js", "root", token);
    await fs.chgrp(target + "/apps/personalSecurity.js", "root", token);
    await fs.chmod(target + "/apps/personalSecurity.js", "rx", token);
}
// 15-optional.js
// =====BEGIN ALL OPTIONAL COMPONENTS=====
function opt(){
// @pcos-app-mode native
// This file describes optional components. You may remove it from your system at your choice.
// In that case offline installation of components won't be possible.
// =====BEGIN breakout COMPONENT METADATA=====
// humanName: Breakout
// license: CC0
// localeReferenceDescription: BREAKOUT_DESCRIPTION
// =====END breakout COMPONENT METADATA=====
// =====BEGIN breakout COMPONENT INSTALLER=====
async function installer(target, token) {
    let fs = modules.fs;
    let existing = (await fs.ls(target, token)).includes("apps");
    if (!existing) await fs.mkdir(target + "/apps", token);
    await fs.chown(target + "/apps", "root", token);
    await fs.chgrp(target + "/apps", "root", token);
    await fs.chmod(target + "/apps", "rx", token);
    let existing2 = (await fs.ls(target + "/apps", token)).includes("links");
    if (!existing2) await fs.mkdir(target + "/apps/links", token);
    await fs.chown(target + "/apps/links", "root", token);
    await fs.chgrp(target + "/apps/links", "root", token);
    await fs.chmod(target + "/apps/links", "rx", token);
    await fs.write(target + "/apps/links/arcadeBreakout.lnk", JSON.stringify({
        name: "Breakout",
        path: target + "/apps/arcadeBreakout.js"
    }), token);
    await fs.chown(target + "/apps/links/arcadeBreakout.lnk", "root", token);
    await fs.chgrp(target + "/apps/links/arcadeBreakout.lnk", "root", token);
    await fs.chmod(target + "/apps/links/arcadeBreakout.lnk", "rx", token);
    await fs.write(target + "/apps/arcadeBreakout.js", `(async function() {
        // @pcos-app-mode iso`+`latable
        // Gamedev-Canvas-workshop by Andrzej Mazur and Mozilla Contributors (https://developer.mozilla.org/en-US/docs/MDN/About#Copyrights_and_licenses) is licensed under CC-BY-SA 2.5 (http://creativecommons.org/licenses/by-sa/2.5/).
        // Any copyright to code samples and snippets is dedicated to the Public Domain (http://creativecommons.org/publicdomain/zero/1.0/).
        // Adapted to PCOS v3 by PC
        await availableAPIs.windowTitleSet("Breakout");
		await availableAPIs.windowResize([ 480, 357 ]);
        document.body.style.fontFamily = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
        document.body.style.background = "white";
        let startButton = document.createElement("button");
        startButton.innerText = "Start";
let canvas = document.createElement("canvas");
canvas.width = 480;
canvas.height = 320;
canvas.style = "width: 100%; height: 100%; position: absolute; top: 0; left: 0; z-index: -1;";
document.body.appendChild(canvas);
document.body.appendChild(startButton);
let ctx = canvas.getContext("2d");
let ballRadius = 10;
let x = canvas.width / 2;
let y = canvas.height - 30;
let dx = 2;
let dy = -2;
let paddleHeight = 10;
let paddleWidth = 75;
let paddleX = (canvas.width - paddleWidth) / 2;
let rightPressed = false;
let leftPressed = false;
let brickRowCount = 5;
let brickColumnCount = 3;
let brickWidth = 75;
let brickHeight = 20;
let brickPadding = 10;
let brickOffsetTop = 30;
let brickOffsetLeft = 30;
let score = 0;
let lives = 3;

let bricks = [];
for (let c = 0; c < brickColumnCount; c++) {
	bricks[c] = [];
	for (let r = 0; r < brickRowCount; r++) {
		bricks[c][r] = {
			x: 0,
			y: 0,
			status: 1
		};
	}
}

document.addEventListener("keydown", keyDownHandler, false);
document.addEventListener("keyup", keyUpHandler, false);
document.addEventListener("mousemove", mouseMoveHandler, false);

function keyDownHandler(e) {
	if (e.code == "ArrowRight") {
		rightPressed = true;
	} else if (e.code == 'ArrowLeft') {
		leftPressed = true;
	}
}

function keyUpHandler(e) {
	if (e.code == 'ArrowRight') {
		rightPressed = false;
	} else if (e.code == 'ArrowLeft') {
		leftPressed = false;
	}
}

function mouseMoveHandler(e) {
	let relativeX = e.clientX - canvas.offsetLeft;
	if (relativeX > 0 && relativeX < canvas.width) {
		paddleX = relativeX - paddleWidth / 2;
	}
}

function collisionDetection() {
	for (let c = 0; c < brickColumnCount; c++) {
		for (let r = 0; r < brickRowCount; r++) {
			let b = bricks[c][r];
			if (b.status == 1) {
				if (x > b.x && x < b.x + brickWidth && y > b.y && y < b.y + brickHeight) {
					dy = -dy;
					b.status = 0;
					score++;
					if (score == brickRowCount * brickColumnCount) {
                        throw new Error("stop game");
					}
				}
			}
		}
	}
}

function drawBall() {
	ctx.beginPath();
	ctx.arc(x, y, ballRadius, 0, Math.PI * 2);
	ctx.fillStyle = "#0095DD";
	ctx.fill();
	ctx.closePath();
}

function drawPaddle() {
	ctx.beginPath();
	ctx.rect(paddleX, canvas.height - paddleHeight, paddleWidth, paddleHeight);
	ctx.fillStyle = "#0095DD";
	ctx.fill();
	ctx.closePath();
}

function drawBricks() {
	for (let c = 0; c < brickColumnCount; c++) {
		for (let r = 0; r < brickRowCount; r++) {
			if (bricks[c][r].status == 1) {
				let brickX = (r * (brickWidth + brickPadding)) + brickOffsetLeft;
				let brickY = (c * (brickHeight + brickPadding)) + brickOffsetTop;
				bricks[c][r].x = brickX;
				bricks[c][r].y = brickY;
				ctx.beginPath();
				ctx.rect(brickX, brickY, brickWidth, brickHeight);
				ctx.fillStyle = "#0095DD";
				ctx.fill();
				ctx.closePath();
			}
		}
	}
}

function drawScore() {
	ctx.font = "16px Arial";
	ctx.fillStyle = "#0095DD";
	ctx.fillText("Score: " + score, 8, 20);
}

function drawLives() {
	ctx.font = "16px Arial";
	ctx.fillStyle = "#0095DD";
	ctx.fillText("Lives: " + lives, canvas.width - 65, 20);
}

function draw() {
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	drawBricks();
	drawBall();
	drawPaddle();
	drawScore();
	drawLives();
	collisionDetection();

	if (x + dx > canvas.width - ballRadius || x + dx < ballRadius) {
		dx = -dx;
	}
	if (y + dy < ballRadius) {
		dy = -dy;
	} else if (y + dy > canvas.height - ballRadius) {
		if (x > paddleX && x < paddleX + paddleWidth) {
			dy = -dy;
		} else {
			lives--;
			if (!lives) {
                throw new Error("stop game");
			} else {
				x = canvas.width / 2;
				y = canvas.height - 30;
				dx = 2;
				dy = -2;
				paddleX = (canvas.width - paddleWidth) / 2;
			}
		}
	}

	if (rightPressed && paddleX < canvas.width - paddleWidth) {
		paddleX += 7;
	} else if (leftPressed && paddleX > 0) {
		paddleX -= 7;
	}

	x += dx;
	y += dy;
	requestAnimationFrame(draw);
}
startButton.onclick = function() {
    startButton.remove();
    draw();
}
    })();
    addEventListener("signal", async function(e) {
        if (e.detail == 15) await window.availableAPIs.terminate();
    }); null;`, token);
    await fs.chown(target + "/apps/arcadeBreakout.js", "root", token);
    await fs.chgrp(target + "/apps/arcadeBreakout.js", "root", token);
    await fs.chmod(target + "/apps/arcadeBreakout.js", "rx", token);
}
// =====END breakout COMPONENT INSTALLER=====
// =====BEGIN breakout COMPONENT REMOVER=====
async function remover(target, token) {
    let fs = modules.fs;
    await fs.rm(target + "/apps/links/arcadeBreakout.lnk", token);
    await fs.rm(target + "/apps/arcadeBreakout.js", token);
}
// =====END breakout COMPONENT REMOVER=====
// =====BEGIN breakout COMPONENT CHECKER=====
async function checker(target, token) {
    let fs = modules.fs;
    let existing1 = await fs.ls(target + "/apps/links", token);
    let existing2 = await fs.ls(target + "/apps", token);
    if (!existing1.includes("arcadeBreakout.lnk") || !existing2.includes("arcadeBreakout.js")) return false;
    return true;
}
// =====END breakout COMPONENT CHECKER=====
}
opt();
// =====END ALL OPTIONAL COMPONENTS=====
// 16-wallpaper.js
async function installWallpapers(target, token) {
    // @pcos-app-mode native
    await modules.users.mkrecursive(target + "/etc/wallpapers", token);
    await modules.fs.chmod(target + "/etc/wallpapers", "rx", token);
    await modules.fs.chown(target + "/etc/wallpapers", "root", token);
    await modules.fs.chgrp(target + "/etc/wallpapers", "root", token);
    await modules.fs.write(target + "/etc/wallpapers/pcos-dark-beta.pic", "data:image/png;base64,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", token);
    await modules.fs.write(target + "/etc/wallpapers/pcos-lock-beta.pic", "data:image/png;base64,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", token);
    await modules.fs.write(target + "/etc/wallpapers/pcos-beta.pic", "data:image/png;base64,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", token);
    await modules.fs.chmod(target + "/etc/wallpapers/pcos-dark-beta.pic", "rx", token);
    await modules.fs.chown(target + "/etc/wallpapers/pcos-dark-beta.pic", "root", token);
    await modules.fs.chgrp(target + "/etc/wallpapers/pcos-dark-beta.pic", "root", token);
    await modules.fs.chmod(target + "/etc/wallpapers/pcos-lock-beta.pic", "rx", token);
    await modules.fs.chown(target + "/etc/wallpapers/pcos-lock-beta.pic", "root", token);
    await modules.fs.chgrp(target + "/etc/wallpapers/pcos-lock-beta.pic", "root", token);
    await modules.fs.chmod(target + "/etc/wallpapers/pcos-beta.pic", "rx", token);
    await modules.fs.chown(target + "/etc/wallpapers/pcos-beta.pic", "root", token);
    await modules.fs.chgrp(target + "/etc/wallpapers/pcos-beta.pic", "root", token);
}
// 17-installer-secondstage.js
function secondstage() {
    // @pcos-app-mode native
    let window = modules.window;
    let windowDiv = window(modules.session.active);
    let isProvisioned = false;
    let provisionSettings = { username: "root", allowDuplicate: true };
    windowDiv.title.innerText = modules.locales.get("SET_UP_PCOS");
    windowDiv.closeButton.disabled = true;
    windowDiv.content.style.padding = "8px";
    let header = document.createElement("b");
    let postHeader = document.createElement("br");
    let description = document.createElement("span");
    let content = document.createElement("div");
    let button = document.createElement("button");
    header.innerText = modules.locales.get("INSTALLER_TITLE");
    description.innerText = modules.locales.get("LET_SETUP_SYSTEM");
    button.innerText = modules.locales.get("SET_UP");
    windowDiv.content.appendChild(header);
    windowDiv.content.appendChild(postHeader);
    windowDiv.content.appendChild(description);
    windowDiv.content.appendChild(content);
    windowDiv.content.appendChild(button);
    button.onclick = function() {
        header.remove();
        postHeader.remove();
        content.innerHTML = "";
        description.innerText = modules.locales.get("LET_CREATE_ACCOUNT");
        button.innerText = modules.locales.get("CREATE");
        let useraccountname = document.createElement("input");
        let useraccountpassword = document.createElement("input");
        let darkmode = document.createElement("input");
        let darkmode_lb = document.createElement("label");
        useraccountname.placeholder = modules.locales.get("USERNAME");
        if (provisionSettings.username) {
            useraccountname.value = provisionSettings.username;
            useraccountname.title = modules.locales.get("PROVISIONED_PREFERENCE");
            useraccountname.disabled = true;
        }
        useraccountpassword.placeholder = modules.locales.get("PASSWORD");
        useraccountpassword.type = "password";
        darkmode.type = "checkbox";
        darkmode.id = "darkmode";
        darkmode_lb.innerText = modules.locales.get("DARK_MODE");
        darkmode_lb.htmlFor = "darkmode";
        content.appendChild(useraccountname);
        content.appendChild(document.createElement("br"));
        content.appendChild(useraccountpassword);
        content.appendChild(document.createElement("br"));
        content.appendChild(darkmode);
        content.appendChild(darkmode_lb);
        button.onclick = async function() {
            let username = provisionSettings.username ? provisionSettings.username : useraccountname.value;
            try {
                if (await modules.users.getUserInfo(username) && !provisionSettings.allowDuplicate) return alert(modules.locales.get("USERNAME_EXISTS"));
            } catch {}
            let password = useraccountpassword.value;
            let darkModeChecked = darkmode.checked;
            if (!password) return alert(modules.locales.get("PASSWORD_INPUT_ALERT"));
            content.innerHTML = "";
            button.hidden = true;
            description.innerHTML = modules.locales.get("INSTALLING_PCOS").replace("%s", modules.locales.get("CREATING_USER_STRUCTURE"));
            if (!isProvisioned || !provisionSettings.skipUserStructure) await modules.users.init();
            description.innerHTML = modules.locales.get("INSTALLING_PCOS").replace("%s", modules.locales.get("CREATING_USER"));
            let rng = crypto.getRandomValues(new Uint8Array(64));
            let salt = Array.from(rng).map(x => x.toString(16).padStart(2, "0")).join("");
            let hash = await modules.core.pbkdf2(password, salt);
            let homedir = isProvisioned ? (modules.defaultSystem + "/home/" + username) : (modules.defaultSystem + "/root");
            if (provisionSettings.homeDirectory) homedir = provisionSettings.homeDirectory;
            if (!provisionSettings.skipCreateUser) {
                await modules.users.moduser(username, {
                    securityChecks: [
                        {
                            type: "pbkdf2",
                            hash: hash,
                            salt: salt
                        }
                    ],
                    groups: [ isProvisioned ? username : "root", "users" ],
                    homeDirectory: homedir
                });
            }
            if (isProvisioned && !provisionSettings.skipHomeDirectory) {
                description.innerHTML = modules.locales.get("INSTALLING_PCOS").replace("%s", modules.locales.get("CREATING_USER_HOME"));
                await modules.users.mkrecursive(homedir);
                await modules.fs.chown(modules.defaultSystem + "/home", "root");
                await modules.fs.chgrp(modules.defaultSystem + "/home", "root");
                await modules.fs.chmod(modules.defaultSystem + "/home", "rx");
                await modules.fs.chown(homedir, username);
                await modules.fs.chgrp(homedir, username);
                await modules.fs.chmod(homedir, "rx");
            }
            description.innerHTML = modules.locales.get("INSTALLING_PCOS").replace("%s", modules.locales.get("INSTALLING_WPS"));
            await installWallpapers(modules.defaultSystem);
            description.innerHTML = modules.locales.get("INSTALLING_PCOS").replace("%s", modules.locales.get("INSTALLING_WP2U"));
            await modules.fs.write(homedir + "/.wallpaper", await modules.fs.read(modules.defaultSystem + "/etc/wallpapers/pcos" + (darkModeChecked ? "-dark" : "") + "-beta.pic"));
            await modules.fs.chown(homedir + "/.wallpaper", username);
            await modules.fs.chgrp(homedir + "/.wallpaper", username);
            await modules.fs.chmod(homedir + "/.wallpaper", "rx");
            description.innerHTML = modules.locales.get("INSTALLING_PCOS").replace("%s", modules.locales.get("INSTALLING_WP2L"));
            await modules.fs.write(modules.defaultSystem + "/etc/wallpapers/lockscreen.pic", await modules.fs.read(modules.defaultSystem + "/etc/wallpapers/pcos-lock-beta.pic"));
            await modules.fs.chown(modules.defaultSystem + "/etc/wallpapers/lockscreen.pic", "root");
            await modules.fs.chgrp(modules.defaultSystem + "/etc/wallpapers/lockscreen.pic", "root");
            await modules.fs.chmod(modules.defaultSystem + "/etc/wallpapers/lockscreen.pic", "rx");
            description.innerHTML = modules.locales.get("INSTALLING_PCOS").replace("%s", modules.locales.get("INSTALLING_DARKMODE"));
            await modules.fs.write(homedir + "/.darkmode", darkModeChecked.toString());
            await modules.fs.chown(homedir + "/.darkmode", username);
            await modules.fs.chgrp(homedir + "/.darkmode", username);
            await modules.fs.chmod(homedir + "/.darkmode", "rx");
            description.innerHTML = modules.locales.get("INSTALLING_PCOS").replace("%s", modules.locales.get("INSTALLING_DARKMODE2L"));
            await modules.fs.write(modules.defaultSystem + "/etc/darkLockScreen", "false");
            await modules.fs.chown(modules.defaultSystem + "/etc/darkLockScreen", "root");
            await modules.fs.chgrp(modules.defaultSystem + "/etc/darkLockScreen", "root");
            await modules.fs.chmod(modules.defaultSystem + "/etc/darkLockScreen", "rx");
            description.innerHTML = modules.locales.get("INSTALLING_PCOS").replace("%s", modules.locales.get("INSTALLING_APPS"));
            await videoPlayerInstaller(modules.defaultSystem);
            await pictureInstaller(modules.defaultSystem);
            await terminalInstaller(modules.defaultSystem);
            await explorerInstaller(modules.defaultSystem);
            await filePickerInstaller(modules.defaultSystem);
            await taskMgrInstaller(modules.defaultSystem);
            await sysadminInstaller(modules.defaultSystem);
            await networkInstaller(modules.defaultSystem);
            await textEditorInstaller(modules.defaultSystem);
            await personalSecurityInstaller(modules.defaultSystem);
            description.innerHTML = modules.locales.get("INSTALLING_PCOS").replace("%s", modules.locales.get("REMOVING_2STAGE"));
            await modules.fs.rm(modules.defaultSystem + "/boot/17-installer-secondstage.js");
            description.innerHTML = modules.locales.get("INSTALLING_PCOS").replace("%s", modules.locales.get("REMOVING_SETUP_STATE"));
            await modules.fs.rm(modules.defaultSystem + "/boot/01-setup-state.js");
            delete modules.settingUp;
            description.innerHTML = modules.locales.get("INSTALLING_PCOS").replace("%s", modules.locales.get("REMOVING_INSTALLERS"));
            await modules.fs.rm(modules.defaultSystem + "/boot/15-apps.js");
            await modules.fs.rm(modules.defaultSystem + "/boot/16-wallpaper.js");
            description.innerHTML = modules.locales.get("INSTALLING_PCOS").replace("%s", modules.locales.get("PATCHING_LOGON"));
            await modules.fs.write(modules.defaultSystem + "/boot/14-logon-requirement-enforce.js", "requireLogon();\n");
            description.innerHTML = modules.locales.get("SETUP_SUCCESSFUL");
            windowDiv.closeButton.disabled = false;
            windowDiv.closeButton.onclick = async function() {
                windowDiv.windowDiv.remove();
                requireLogon();
            }
        }
    }
}
// 99-finished.js
function systemKillWaiter() {
    // @pcos-app-mode native
    modules.startupWindow.windowDiv.remove();
    return new Promise(function(resolve) {
        modules.killSystem = resolve;
    });
}
return await systemKillWaiter();