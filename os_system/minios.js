// 00-pcos.js
// @pcos-app-mode native
const pcos_version = "999mini";
 
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
// 01-fs.js
function loadFs() {
	// @pcos-app-mode native
	let fs = {
		read: async function(file, sessionToken) {
			let mount = file.split("/")[0];
			if (!this.mounts.hasOwnProperty(mount)) throw new Error("NO_SUCH_DEVICE");
			return await this.mounts[mount].read(file.split("/").slice(1).join("/"), sessionToken);
		},
		write: async function(file, data, sessionToken) {
			let filePath = file.split("/").slice(1);
			if (filePath.includes("")) throw new Error("PATH_INCLUDES_EMPTY");
			let mount = file.split("/")[0];
			if (!this.mounts.hasOwnProperty(mount)) throw new Error("NO_SUCH_DEVICE");
			if (modules.core.bootMode == "readonly") throw new Error("READ_ONLY_BMGR");
			if (this.mounts[mount].read_only) throw new Error("READ_ONLY_DEV");
			return await this.mounts[mount].write(file.split("/").slice(1).join("/"), data, sessionToken);
		},
		rm: async function(file, sessionToken) {
			let mount = file.split("/")[0];
			if (!this.mounts.hasOwnProperty(mount)) throw new Error("NO_SUCH_DEVICE");
			if (modules.core.bootMode == "readonly") throw new Error("READ_ONLY_BMGR");
			if (this.mounts[mount].read_only) throw new Error("READ_ONLY_DEV");
			return await this.mounts[mount].rm(file.split("/").slice(1).join("/"), sessionToken);
		},
		mkdir: async function(folder, sessionToken) {
			let filePath = folder.split("/").slice(1);
			if (filePath.includes("")) throw new Error("PATH_INCLUDES_EMPTY");
			let mount = folder.split("/")[0];
			if (!this.mounts.hasOwnProperty(mount)) throw new Error("NO_SUCH_DEVICE");
			if (modules.core.bootMode == "readonly") throw new Error("READ_ONLY_BMGR");
			if (this.mounts[mount].read_only) throw new Error("READ_ONLY_DEV");
			if (!this.mounts[mount].directory_supported) throw new Error("NO_DIRECTORY_SUPPORT");
			return await this.mounts[mount].mkdir(folder.split("/").slice(1).join("/"), sessionToken);
		},
		permissions: async function(folder, sessionToken) {
			let mount = folder.split("/")[0];
			if (!this.mounts.hasOwnProperty(mount)) throw new Error("NO_SUCH_DEVICE");
			let randomNames = crypto.getRandomValues(new Uint8Array(8)).reduce((a, b) => a + b.toString(16).padStart(2, "0"), "");
			if (!this.mounts[mount].permissions_supported) return { owner: randomNames, group: randomNames, world: "rwx" };
			return await this.mounts[mount].permissions(folder.split("/").slice(1).join("/"), sessionToken);
		},
		lsmounts: function() {
			return Object.keys(this.mounts);
		},
		unmount: async function(mount, sessionToken, force) {
			if (!this.mounts.hasOwnProperty(mount)) throw new Error("NO_SUCH_DEVICE");
			try {
				if (!this.mounts[mount].read_only && !force) await this.sync(mount, sessionToken);
			} catch {}
			try {
				if (!force) await this.mounts[mount].unmount(sessionToken);
			} catch {}
			delete this.mounts[mount];
		},
		chown: async function(file, owner, sessionToken) {
			let filePath = file.split("/").slice(1);
			if (filePath.includes("")) throw new Error("PATH_INCLUDES_EMPTY");
			let mount = file.split("/")[0];
			if (!this.mounts.hasOwnProperty(mount)) throw new Error("NO_SUCH_DEVICE");
			if (modules.core.bootMode == "readonly") throw new Error("READ_ONLY_BMGR");
			if (this.mounts[mount].read_only) throw new Error("READ_ONLY_DEV");
			if (!this.mounts[mount].permissions_supported) throw new Error("NO_PERMIS_SUPPORT");
			return await this.mounts[mount].chown(file.split("/").slice(1).join("/"), owner, sessionToken);
		},
		chgrp: async function(file, group, sessionToken) {
			let filePath = file.split("/").slice(1);
			if (filePath.includes("")) throw new Error("PATH_INCLUDES_EMPTY");
			let mount = file.split("/")[0];
			if (!this.mounts.hasOwnProperty(mount)) throw new Error("NO_SUCH_DEVICE");
			if (modules.core.bootMode == "readonly") throw new Error("READ_ONLY_BMGR");
			if (this.mounts[mount].read_only) throw new Error("READ_ONLY_DEV");
			if (!this.mounts[mount].permissions_supported) throw new Error("NO_PERMIS_SUPPORT");
			return await this.mounts[mount].chgrp(file.split("/").slice(1).join("/"), group, sessionToken);
		},
		chmod: async function(file, permissions, sessionToken) {
			let filePath = file.split("/").slice(1);
			if (filePath.includes("")) throw new Error("PATH_INCLUDES_EMPTY");
			let mount = file.split("/")[0];
			if (!this.mounts.hasOwnProperty(mount)) throw new Error("NO_SUCH_DEVICE");
			if (modules.core.bootMode == "readonly") throw new Error("READ_ONLY_BMGR");
			if (this.mounts[mount].read_only) throw new Error("READ_ONLY_DEV");
			if (!this.mounts[mount].permissions_supported) throw new Error("NO_PERMIS_SUPPORT");
			return await this.mounts[mount].chmod(file.split("/").slice(1).join("/"), permissions, sessionToken);
		},
		ls: async function(folder, sessionToken) {
			let mount = folder.split("/")[0];
			if (!this.mounts.hasOwnProperty(mount)) throw new Error("NO_SUCH_DEVICE");
			return await this.mounts[mount].ls(folder.split("/").slice(1).join("/"), sessionToken);
		},
		isDirectory: async function(path, sessionToken) {
			let mount = path.split("/")[0];
			if (!this.mounts.hasOwnProperty(mount)) throw new Error("NO_SUCH_DEVICE");
			if (!this.mounts[mount].directory_supported) throw new Error("NO_DIRECTORY_SUPPORT");
			if (!path.split("/").slice(1).join("/")) return true;
			return await this.mounts[mount].isDirectory(path.split("/").slice(1).join("/"), sessionToken);
		},
		mountInfo: async function(mount) {
			return {
				read_only: this.mounts[mount].read_only || false,
				permissions_supported: this.mounts[mount].permissions_supported || false,
				directory_supported: this.mounts[mount].directory_supported || false,
				filesystem: this.mounts[mount].filesystem || "unknown"
			}
		},
		sync: async function(mount, sessionToken) {
			if (!this.mounts.hasOwnProperty(mount)) throw new Error("NO_SUCH_DEVICE");
			try {
				if (!this.mounts[mount].read_only || modules.core.bootMode == "readonly") return await this.mounts[mount].sync(sessionToken);
			} catch {}
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
		if (!Object.keys(partition).includes("files") || !Object.keys(partition).includes("permissions") || !Object.keys(partition).includes("id")) throw new Error("PARTITION_NOT_PCFS");
		let partitionId = partition.id;
		partition = null;
		return {
			read: async function(key) {
				let pathParts = key.split("/");
				if (pathParts[0] == "") pathParts = pathParts.slice(1);
				let files = this.backend.files;
				for (let part of pathParts) {
					files = files[part];
					if (!files) throw new Error("NO_SUCH_FILE");
				}
				if (typeof files === "object") throw new Error("IS_A_DIR");
				return String(await modules.core.idb.readPart(partitionId + "-" + files));
			},
			write: async function(key, value) {
				key = String(key);
				value = String(value);
				let existenceChecks = key.split("/").slice(0, -1);
				if (existenceChecks[0] == "") existenceChecks = existenceChecks.slice(1);
				if (existenceChecks[existenceChecks.length - 1] == "") existenceChecks = existenceChecks.slice(0, -1);
				let basename = key.split("/").slice(-1)[0];
				let files = this.backend.files;
				for (let part of existenceChecks) {
					files = files[part];
					if (!files) throw new Error("NO_SUCH_DIR");
				}
				if (typeof files[basename] === "object") throw new Error("IS_A_DIR");
				let id = files[basename] || crypto.getRandomValues(new Uint8Array(64)).reduce((a, b) => a + b.toString(16).padStart(2, "0"), "");
				await modules.core.idb.writePart(partitionId + "-" + id, value);
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
				key = String(key);
				let pathParts = key.split("/");
				if (pathParts[0] == "") pathParts = pathParts.slice(1);
				if (pathParts[pathParts.length - 1] == "") pathParts = pathParts.slice(0, -1);
				let files = this.backend.files;
				for (let part of pathParts) {
					files = files[part];
					if (!files) throw new Error("NO_SUCH_FILE_DIR");
				}
				if (typeof files === "object" && Object.keys(files).length > 0) throw new Error("NON_EMPTY_DIR");
				if (typeof files === "string") await modules.core.idb.removePart(partitionId + "-" + files);
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
				directory = String(directory);
				let pathParts = directory.split("/");
				if (pathParts[0] == "") pathParts = pathParts.slice(1);
				if (pathParts[pathParts.length - 1] == "") pathParts = pathParts.slice(0, -1);
				let files = this.backend.files;
				for (let part of pathParts) {
					files = files[part];
					if (!files) throw new Error("NO_SUCH_DIR");
				}
				if (typeof files !== "object") throw new Error("IS_A_FILE");
				return Object.keys(files);
			},
			mkdir: async function(directory) {
				directory = String(directory);
				let existenceChecks = directory.split("/").slice(0, -1);
				if (existenceChecks[0] == "") existenceChecks = existenceChecks.slice(1);
				if (existenceChecks[existenceChecks.length - 1] == "") existenceChecks = existenceChecks.slice(0, -1);
				let files = this.backend.files;
				for (let part of existenceChecks) {
					files = files[part];
					if (!files) throw new Error("NO_SUCH_DIR");
				}
				if (Object.keys(files).includes(directory.split("/").slice(-1)[0])) throw new Error("DIR_EXISTS");
				let HACKID = Math.floor(Math.random() * 1000000);
				globalThis["HACK" + HACKID] = this.backend;
				let HACK = "";
				for (let a of directory.split("/")) HACK = HACK + "[" + JSON.stringify(a) + "]";
				eval("globalThis[" + JSON.stringify("HACK" + HACKID) + "].files" + HACK + " = {};");
				this.backend = globalThis["HACK" + HACKID];
				delete globalThis["HACK" + HACKID];
			},
			permissions: async function(file) {
				file = String(file);
				let properFile = file.split("/")
				if (properFile[0] == "") properFile = properFile.slice(1);
				if (properFile[properFile.length - 1] == "") properFile = properFile.slice(0, -1);
				properFile = properFile.join("/");
				let randomNames = crypto.getRandomValues(new Uint8Array(8)).reduce((a, b) => a + b.toString(16).padStart(2, "0"), "");
				return this.backend.permissions[properFile] || {
					owner: randomNames,
					group: randomNames,
					world: "",
				};
			},
			chown: async function(file, owner) {
				file = String(file);
				owner = String(owner);
				let properFile = file.split("/")
				if (properFile[0] == "") properFile = properFile.slice(1);
				if (properFile[properFile.length - 1] == "") properFile = properFile.slice(0, -1);
				properFile = properFile.join("/");
				let backend = this.backend;
				let randomNames = crypto.getRandomValues(new Uint8Array(8)).reduce((a, b) => a + b.toString(16).padStart(2, "0"), "");
				let filePermissions = backend.permissions[properFile] || {
					owner: randomNames,
					group: randomNames,
					world: "",
				};
				filePermissions.owner = owner;
				backend.permissions[properFile] = filePermissions;
				this.backend = backend;
			},
			chgrp: async function(file, group) {
				file = String(file);
				group = String(group);
				let properFile = file.split("/")
				if (properFile[0] == "") properFile = properFile.slice(1);
				if (properFile[properFile.length - 1] == "") properFile = properFile.slice(0, -1);
				properFile = properFile.join("/");
				let backend = this.backend;
				let randomNames = crypto.getRandomValues(new Uint8Array(8)).reduce((a, b) => a + b.toString(16).padStart(2, "0"), "");
				let filePermissions = backend.permissions[properFile] || {
					owner: randomNames,
					group: randomNames,
					world: "",
				};
				filePermissions.group = group;
				backend.permissions[properFile] = filePermissions;
				this.backend = backend;
			},
			chmod: async function(file, permissions) {
				file = String(file);
				permissions = String(permissions);
				let properFile = file.split("/")
				if (properFile[0] == "") properFile = properFile.slice(1);
				if (properFile[properFile.length - 1] == "") properFile = properFile.slice(0, -1);
				properFile = properFile.join("/");
				let backend = this.backend;
				let randomNames = crypto.getRandomValues(new Uint8Array(8)).reduce((a, b) => a + b.toString(16).padStart(2, "0"), "");
				let filePermissions = backend.permissions[properFile] || {
					owner: randomNames,
					group: randomNames,
					world: "",
				};
				filePermissions.world = permissions;
				backend.permissions[properFile] = filePermissions;
				this.backend = backend;
			},
			sync: async function() {
				await modules.core.disk.sync();
			},
			isDirectory: function(key) {
				key = String(key);
				let pathParts = key.split("/").slice(0, -1);
				if (pathParts[0] == "") pathParts = pathParts.slice(1);
				if (pathParts[pathParts.length - 1] == "") pathParts = pathParts.slice(0, -1);
				let basename = key.split("/").slice(-1)[0];
				let files = this.backend.files;
				for (let part of pathParts) {
					files = files[part];
					if (!files) throw new Error("NO_SUCH_DIR");
				}
				if (!files.hasOwnProperty(basename)) throw new Error("NO_SUCH_FILE_DIR");
				if (typeof files[basename] === "object") return true;
				return false;
			},
			unmount: () => true,
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
				if (!this.partition) this.partition = modules.core.disk.partition(options.partition);
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
		if (!Object.keys(partition).includes("files") || !Object.keys(partition).includes("permissions") || !Object.keys(partition).includes("cryptodata") || !Object.keys(partition).includes("id")) throw new Error("PARTITION_NOT_PCFS_ENCRYPTED");
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
			if (partition.encryptedFileTable) {
				let fileIV = crypto.getRandomValues(new Uint8Array(16));
				let fileCT = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: fileIV }, importedKey, new TextEncoder().encode(JSON.stringify({
					files: partition.files,
					permissions: partition.permissions
				}))));
				partition.files = {};
				partition.permissions = {};
				let ept = new Uint8Array(fileIV.length + fileCT.length);
				ept.set(fileIV);
				ept.set(fileCT, fileIV.length);
				partition.encryptedFileTable = ept.reduce((a, b) => a + b.toString(16).padStart(2, "0"), "");
			}
			delete partition.cryptodata.passwordLockingInitial;
			modules.core.disk.partition(options.partition).setData(partition);
		}
		if (partition.cryptodata.passwordLocking) {
			let iv = new Uint8Array(partition.cryptodata.passwordLocking.slice(0, 32).match(/.{1,2}/g).map(a => parseInt(a, 16)));
			let ct = new Uint8Array(partition.cryptodata.passwordLocking.slice(32).match(/.{1,2}/g).map(a => parseInt(a, 16)));
			await crypto.subtle.decrypt({ name: "AES-GCM", iv }, importedKey, ct);
		}
		let partitionId = partition.id;
		partition = null;
		return {
			read: async function(key) {
				key = String(key);          
				let pathParts = key.split("/");
				if (pathParts[0] == "") pathParts = pathParts.slice(1);
				let files = (await this.getBackend()).files;
				for (let part of pathParts) {
					files = files[part];
					if (!files) throw new Error("NO_SUCH_FILE");
				}
				if (typeof files === "object") throw new Error("IS_A_DIR");
				let part = await modules.core.idb.readPart(partitionId + "-" + files);
				let iv = new Uint8Array(part.slice(0, 32).match(/.{1,2}/g).map(a => parseInt(a, 16)));
				let ct = new Uint8Array(part.slice(32).match(/.{1,2}/g).map(a => parseInt(a, 16)));
				return new TextDecoder().decode(new Uint8Array(await crypto.subtle.decrypt({ name: "AES-GCM", iv }, this.key, ct)));
			},
			write: async function(key, value) {
				key = String(key);
				value = String(value);
				let existenceChecks = key.split("/").slice(0, -1);
				if (existenceChecks[0] == "") existenceChecks = existenceChecks.slice(1);
				if (existenceChecks[existenceChecks.length - 1] == "") existenceChecks = existenceChecks.slice(0, -1);
				let basename = key.split("/").slice(-1)[0];
				let files = (await this.getBackend()).files;
				for (let part of existenceChecks) {
					files = files[part];
					if (!files) throw new Error("NO_SUCH_DIR");
				}
				if (typeof files[basename] === "object") throw new Error("IS_A_DIR");
				let id = files[basename] || crypto.getRandomValues(new Uint8Array(64)).reduce((a, b) => a + b.toString(16).padStart(2, "0"), "");
				let newIV = crypto.getRandomValues(new Uint8Array(16));
				let newCT = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: newIV }, this.key, new TextEncoder().encode(value)));
				let newPart = new Uint8Array(newIV.length + newCT.length);
				newPart.set(newIV);
				newPart.set(newCT, newIV.length);
				newPart = newPart.reduce((a, b) => a + b.toString(16).padStart(2, "0"), "");
				await modules.core.idb.writePart(partitionId + "-" + id, newPart);
				if (!files.hasOwnProperty(basename)) {
					let HACKID = Math.floor(Math.random() * 1000000);
					globalThis["HACK" + HACKID] = await this.getBackend();
					let HACK = "";
					for (let a of key.split("/")) HACK = HACK + "[" + JSON.stringify(a) + "]";
					eval("globalThis[" + JSON.stringify("HACK" + HACKID) + "].files" + HACK + " = " + JSON.stringify(id) + ";");
					await this.setBackend(globalThis["HACK" + HACKID]);
					delete globalThis["HACK" + HACKID];
				}
			},
			rm: async function(key) {
				key = String(key);
				let pathParts = key.split("/");
				if (pathParts[0] == "") pathParts = pathParts.slice(1);
				if (pathParts[pathParts.length - 1] == "") pathParts = pathParts.slice(0, -1);
				let files = (await this.getBackend()).files;
				for (let part of pathParts) {
					files = files[part];
					if (!files) throw new Error("NO_SUCH_FILE_DIR");
				}
				if (typeof files === "object" && Object.keys(files).length > 0) throw new Error("NON_EMPTY_DIR");
				if (typeof files === "string") await modules.core.idb.removePart(partitionId + "-" + files);
				let HACKID = Math.floor(Math.random() * 1000000);
				globalThis["HACK" + HACKID] = await this.getBackend();
				let HACK = "";
				for (let a of key.split("/")) HACK = HACK + "[" + JSON.stringify(a) + "]";
				eval("delete globalThis[" + JSON.stringify("HACK" + HACKID) + "].files" + HACK + ";");
				eval("delete globalThis[" + JSON.stringify("HACK" + HACKID) + "].permissions[" + JSON.stringify(key) + "];");
				await this.setBackend(globalThis["HACK" + HACKID]);
				delete globalThis["HACK" + HACKID];
			},
			ls: async function(directory) {
				directory = String(directory);
				let pathParts = directory.split("/");
				if (pathParts[0] == "") pathParts = pathParts.slice(1);
				if (pathParts[pathParts.length - 1] == "") pathParts = pathParts.slice(0, -1);
				let files = (await this.getBackend()).files;
				for (let part of pathParts) {
					files = files[part];
					if (!files) throw new Error("NO_SUCH_DIR");
				}
				if (typeof files !== "object") throw new Error("IS_A_FILE");
				return Object.keys(files);
			},
			mkdir: async function(directory) {
				directory = String(directory);
				let existenceChecks = directory.split("/").slice(0, -1);
				if (existenceChecks[0] == "") existenceChecks = existenceChecks.slice(1);
				if (existenceChecks[existenceChecks.length - 1] == "") existenceChecks = existenceChecks.slice(0, -1);
				let files = (await this.getBackend()).files;
				for (let part of existenceChecks) {
					files = files[part];
					if (!files) throw new Error("NO_SUCH_DIR");
				}
				if (Object.keys(files).includes(directory.split("/").slice(-1)[0])) throw new Error("DIR_EXISTS");
				let HACKID = Math.floor(Math.random() * 1000000);
				globalThis["HACK" + HACKID] = (await this.getBackend());
				let HACK = "";
				for (let a of directory.split("/")) HACK = HACK + "[" + JSON.stringify(a) + "]";
				eval("globalThis[" + JSON.stringify("HACK" + HACKID) + "].files" + HACK + " = {};");
				await this.setBackend(globalThis["HACK" + HACKID]);
				delete globalThis["HACK" + HACKID];
			},
			permissions: async function(file) {
				file = String(file);
				let properFile = file.split("/")
				if (properFile[0] == "") properFile = properFile.slice(1);
				if (properFile[properFile.length - 1] == "") properFile = properFile.slice(0, -1);
				properFile = properFile.join("/");
				let randomNames = crypto.getRandomValues(new Uint8Array(8)).reduce((a, b) => a + b.toString(16).padStart(2, "0"), "");
				return (await this.getBackend()).permissions[properFile] || {
					owner: randomNames,
					group: randomNames,
					world: "",
				};
			},
			chown: async function(file, owner) {
				file = String(file);
				owner = String(owner);
				let properFile = file.split("/")
				if (properFile[0] == "") properFile = properFile.slice(1);
				if (properFile[properFile.length - 1] == "") properFile = properFile.slice(0, -1);
				properFile = properFile.join("/");
				let backend = await this.getBackend();
				let randomNames = crypto.getRandomValues(new Uint8Array(8)).reduce((a, b) => a + b.toString(16).padStart(2, "0"), "");
				let filePermissions = backend.permissions[properFile] || {
					owner: randomNames,
					group: randomNames,
					world: "",
				};
				filePermissions.owner = owner;
				backend.permissions[properFile] = filePermissions;
				await this.setBackend(backend);
			},
			chgrp: async function(file, group) {
				file = String(file);
				group = String(group);
				let properFile = file.split("/")
				if (properFile[0] == "") properFile = properFile.slice(1);
				if (properFile[properFile.length - 1] == "") properFile = properFile.slice(0, -1);
				properFile = properFile.join("/");
				let backend = await this.getBackend();
				let randomNames = crypto.getRandomValues(new Uint8Array(8)).reduce((a, b) => a + b.toString(16).padStart(2, "0"), "");
				let filePermissions = backend.permissions[properFile] || {
					owner: randomNames,
					group: randomNames,
					world: "",
				};
				filePermissions.group = group;
				backend.permissions[properFile] = filePermissions;
				await this.setBackend(backend);
			},
			chmod: async function(file, permissions) {
				file = String(file);
				permissions = String(permissions);
				let properFile = file.split("/")
				if (properFile[0] == "") properFile = properFile.slice(1);
				if (properFile[properFile.length - 1] == "") properFile = properFile.slice(0, -1);
				properFile = properFile.join("/");
				let backend = await this.getBackend();
				let randomNames = crypto.getRandomValues(new Uint8Array(8)).reduce((a, b) => a + b.toString(16).padStart(2, "0"), "");
				let filePermissions = backend.permissions[properFile] || {
					owner: randomNames,
					group: randomNames,
					world: "",
				};
				filePermissions.world = permissions;
				backend.permissions[properFile] = filePermissions;
				await this.setBackend(backend);
			},
			isDirectory: async function(key) {
				key = String(key);
				let pathParts = key.split("/").slice(0, -1);
				if (pathParts[0] == "") pathParts = pathParts.slice(1);
				if (pathParts[pathParts.length - 1] == "") pathParts = pathParts.slice(0, -1);
				let basename = key.split("/").slice(-1)[0];
				let files = (await this.getBackend()).files;
				for (let part of pathParts) {
					files = files[part];
					if (!files) throw new Error("NO_SUCH_DIR");
				}
				if (!files.hasOwnProperty(basename)) throw new Error("NO_SUCH_FILE_DIR");
				if (typeof files[basename] === "object") return true;
				return false;
			},
			sync: async function() {
				await modules.core.disk.sync();
			},
			unmount: () => true,
			directory_supported: true,
			filesystem: "PCFS-AES",
			read_only: !!options.read_only,
			permissions_supported: true,
			partition: null,
			getBackend: async function() {
				if (!this.partition) this.partition = modules.core.disk.partition(options.partition);
				let returnedData = this.partition.getData();
				if (returnedData.encryptedFileTable) {
					let iv = new Uint8Array(returnedData.encryptedFileTable.slice(0, 32).match(/.{1,2}/g).map(a => parseInt(a, 16)));
					let ct = new Uint8Array(returnedData.encryptedFileTable.slice(32).match(/.{1,2}/g).map(a => parseInt(a, 16)));
					return JSON.parse(new TextDecoder().decode(new Uint8Array(await crypto.subtle.decrypt({ name: "AES-GCM", iv }, this.key, ct))));   
				}
				return returnedData;
			},
			setBackend: async function(data) {
				if (!this.partition) this.partition = modules.core.disk.partition(options.partition);
				let returnedData = this.partition.getData();
				if (returnedData.encryptedFileTable) {
					let newIV = crypto.getRandomValues(new Uint8Array(16));
					let newCT = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: newIV }, this.key, new TextEncoder().encode(JSON.stringify(data))));
					let newPart = new Uint8Array(newIV.length + newCT.length);
					newPart.set(newIV);
					newPart.set(newCT, newIV.length);
					newPart = newPart.reduce((a, b) => a + b.toString(16).padStart(2, "0"), "");
					return this.partition.setData({ ...returnedData, encryptedFileTable: newPart });
				}
				this.partition.setData(data);
			},
			key: importedKey
		};
	};
	
	function ramMount(options) {
		let randomNames = crypto.getRandomValues(new Uint8Array(8)).reduce((a, b) => a + b.toString(16).padStart(2, "0"), "");
		return {
			read: async function(key) {
				key = String(key);
				let pathParts = key.split("/");
				if (pathParts[0] == "") pathParts = pathParts.slice(1);
				let files = this.backend.files;
				for (let part of pathParts) {
					files = files[part];
					if (!files) throw new Error("NO_SUCH_FILE");
				}
				if (typeof files === "object") throw new Error("IS_A_DIR");
				return String(this.ramFiles.get(files));
			},
			write: async function(key, value) {
				key = String(key);
				value = String(value);
				let existenceChecks = key.split("/").slice(0, -1);
				if (existenceChecks[0] == "") existenceChecks = existenceChecks.slice(1);
				if (existenceChecks[existenceChecks.length - 1] == "") existenceChecks = existenceChecks.slice(0, -1);
				let basename = key.split("/").slice(-1)[0];
				let files = this.backend.files;
				for (let part of existenceChecks) {
					files = files[part];
					if (!files) throw new Error("NO_SUCH_DIR");
				}
				if (typeof files[basename] === "object") throw new Error("IS_A_DIR");
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
				key = String(key);
				let pathParts = key.split("/");
				if (pathParts[0] == "") pathParts = pathParts.slice(1);
				if (pathParts[pathParts.length - 1] == "") pathParts = pathParts.slice(0, -1);
				let files = this.backend.files;
				for (let part of pathParts) {
					files = files[part];
					if (!files) throw new Error("NO_SUCH_FILE_DIR");
				}
				if (typeof files === "object" && Object.keys(files).length > 0) throw new Error("NON_EMPTY_DIR");
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
				directory = String(directory);
				let pathParts = directory.split("/");
				if (pathParts[0] == "") pathParts = pathParts.slice(1);
				if (pathParts[pathParts.length - 1] == "") pathParts = pathParts.slice(0, -1);
				let files = this.backend.files;
				for (let part of pathParts) {
					files = files[part];
					if (!files) throw new Error("NO_SUCH_DIR");
				}
				if (typeof files !== "object") throw new Error("IS_A_FILE");
				return Object.keys(files);
			},
			mkdir: async function(directory) {
				directory = String(directory);
				let existenceChecks = directory.split("/").slice(0, -1);
				if (existenceChecks[0] == "") existenceChecks = existenceChecks.slice(1);
				if (existenceChecks[existenceChecks.length - 1] == "") existenceChecks = existenceChecks.slice(0, -1);
				let files = this.backend.files;
				for (let part of existenceChecks) {
					files = files[part];
					if (!files) throw new Error("NO_SUCH_DIR");
				}
				if (Object.keys(files).includes(directory.split("/").slice(-1)[0])) throw new Error("DIR_EXISTS");
				let HACKID = Math.floor(Math.random() * 1000000);
				globalThis["HACK" + HACKID] = this.backend;
				let HACK = "";
				for (let a of directory.split("/")) HACK = HACK + "[" + JSON.stringify(a) + "]";
				eval("globalThis[" + JSON.stringify("HACK" + HACKID) + "].files" + HACK + " = {};");
				this.backend = globalThis["HACK" + HACKID];
				delete globalThis["HACK" + HACKID];
			},
			permissions: async function(file) {
				file = String(file);
				let properFile = file.split("/")
				if (properFile[0] == "") properFile = properFile.slice(1);
				if (properFile[properFile.length - 1] == "") properFile = properFile.slice(0, -1);
				properFile = properFile.join("/");
				let randomNames = crypto.getRandomValues(new Uint8Array(8)).reduce((a, b) => a + b.toString(16).padStart(2, "0"), "");
				return this.backend.permissions[properFile] || {
					owner: randomNames,
					group: randomNames,
					world: "",
				};
			},
			chown: async function(file, owner) {
				file = String(file);
				owner = String(owner);
				let properFile = file.split("/")
				if (properFile[0] == "") properFile = properFile.slice(1);
				if (properFile[properFile.length - 1] == "") properFile = properFile.slice(0, -1);
				properFile = properFile.join("/");
				let backend = this.backend;
				let randomNames = crypto.getRandomValues(new Uint8Array(8)).reduce((a, b) => a + b.toString(16).padStart(2, "0"), "");
				let filePermissions = backend.permissions[properFile] || {
					owner: randomNames,
					group: randomNames,
					world: "",
				};
				filePermissions.owner = owner;
				backend.permissions[properFile] = filePermissions;
				this.backend = backend;
			},
			chgrp: async function(file, group) {
				file = String(file);
				group = String(group);
				let properFile = file.split("/")
				if (properFile[0] == "") properFile = properFile.slice(1);
				if (properFile[properFile.length - 1] == "") properFile = properFile.slice(0, -1);
				properFile = properFile.join("/");
				let backend = this.backend;
				let randomNames = crypto.getRandomValues(new Uint8Array(8)).reduce((a, b) => a + b.toString(16).padStart(2, "0"), "");
				let filePermissions = backend.permissions[properFile] || {
					owner: randomNames,
					group: randomNames,
					world: "",
				};
				filePermissions.group = group;
				backend.permissions[properFile] = filePermissions;
				this.backend = backend;
			},
			chmod: async function(file, permissions) {
				file = String(file);
				permissions = String(permissions);
				let properFile = file.split("/")
				if (properFile[0] == "") properFile = properFile.slice(1);
				if (properFile[properFile.length - 1] == "") properFile = properFile.slice(0, -1);
				properFile = properFile.join("/");
				let backend = this.backend;
				let randomNames = crypto.getRandomValues(new Uint8Array(8)).reduce((a, b) => a + b.toString(16).padStart(2, "0"), "");
				let filePermissions = backend.permissions[properFile] || {
					owner: randomNames,
					group: randomNames,
					world: "",
				};
				filePermissions.world = permissions;
				backend.permissions[properFile] = filePermissions;
				this.backend = backend;
			},
			isDirectory: function(key) {
				key = String(key);
				let pathParts = key.split("/").slice(0, -1);
				if (pathParts[0] == "") pathParts = pathParts.slice(1);
				if (pathParts[pathParts.length - 1] == "") pathParts = pathParts.slice(0, -1);
				let basename = key.split("/").slice(-1)[0];
				let files = this.backend.files;
				for (let part of pathParts) {
					files = files[part];
					if (!files) throw new Error("NO_SUCH_DIR");
				}
				if (!files.hasOwnProperty(basename)) throw new Error("NO_SUCH_FILE_DIR");
				if (typeof files[basename] === "object") return true;
				return false;
			},
			sync: () => true,
			unmount: () => true,
			directory_supported: true,
			read_only: !!options.read_only,
			filesystem: "extramfs",
			permissions_supported: true,
			backend: options.type == "run" ? { files: { run: {} }, permissions: {
				"": {
					owner: randomNames,
					group: randomNames,
					world: "rx"
				},
				run: {
					owner: randomNames,
					group: randomNames,
					world: "rwx"
				}
			}} : { files: {}, permissions: {
				"": {
					owner: randomNames,
					group: randomNames,
					world: "rx"
				}
			} },
			ramFiles: new Map()
		};
	}

	async function SFSPMount(options) {
		let session, serverData;
		try {
			session = await fetch(options.url + "/session");
			session = await session.json();
			serverData = await fetch(options.url + "/properties", {
				method: "POST",
				headers: {
					"Content-Type": "application/json"
				},
				body: JSON.stringify({
					...options,
					sessionToken: session
				})
			});
			serverData = await serverData.json();
		} catch (e) {
			throw new Error("Could not connect to server");
		}
		return {
			read: async function(...a) {
				let req = await fetch(options.url + "/file_operation", {
					method: "POST",
					headers: {
						"Content-Type": "application/json"
					},
					body: JSON.stringify({
						sessionToken: session,
						operation: "read",
						parameters: a
					})
				});
				if (!req.ok) throw (await req.json());
				return await req.json();
			},
			write: async function(...a) {
				let req = await fetch(options.url + "/file_operation", {
					method: "POST",
					headers: {
						"Content-Type": "application/json"
					},
					body: JSON.stringify({
						sessionToken: session,
						operation: "write",
						parameters: a
					})
				});
				if (!req.ok) throw (await req.json());
				return await req.json();
			},
			rm: async function(...a) {
				let req = await fetch(options.url + "/file_operation", {
					method: "POST",
					headers: {
						"Content-Type": "application/json"
					},
					body: JSON.stringify({
						sessionToken: session,
						operation: "rm",
						parameters: a
					})
				});
				if (!req.ok) throw (await req.json());
				return await req.json();
			},
			ls: async function(...a) {
				let req = await fetch(options.url + "/file_operation", {
					method: "POST",
					headers: {
						"Content-Type": "application/json"
					},
					body: JSON.stringify({
						sessionToken: session,
						operation: "ls",
						parameters: a
					})
				});
				if (!req.ok) throw (await req.json());
				return await req.json();
			},
			mkdir: async function(...a) {
				let req = await fetch(options.url + "/file_operation", {
					method: "POST",
					headers: {
						"Content-Type": "application/json"
					},
					body: JSON.stringify({
						sessionToken: session,
						operation: "mkdir",
						parameters: a
					})
				});
				if (!req.ok) throw (await req.json());
				return await req.json();
			},
			permissions: async function(...a) {
				let req = await fetch(options.url + "/file_operation", {
					method: "POST",
					headers: {
						"Content-Type": "application/json"
					},
					body: JSON.stringify({
						sessionToken: session,
						operation: "permissions",
						parameters: a
					})
				});
				if (!req.ok) throw (await req.json());
				return await req.json();
			},
			chown: async function(...a) {
				let req = await fetch(options.url + "/file_operation", {
					method: "POST",
					headers: {
						"Content-Type": "application/json"
					},
					body: JSON.stringify({
						sessionToken: session,
						operation: "chown",
						parameters: a
					})
				});
				if (!req.ok) throw (await req.json());
				return await req.json();
			},
			chgrp: async function(...a) {
				let req = await fetch(options.url + "/file_operation", {
					method: "POST",
					headers: {
						"Content-Type": "application/json"
					},
					body: JSON.stringify({
						sessionToken: session,
						operation: "chgrp",
						parameters: a
					})
				});
				if (!req.ok) throw (await req.json());
				return await req.json();
			},
			chmod: async function(...a) {
				let req = await fetch(options.url + "/file_operation", {
					method: "POST",
					headers: {
						"Content-Type": "application/json"
					},
					body: JSON.stringify({
						sessionToken: session,
						operation: "chmod",
						parameters: a
					})
				});
				if (!req.ok) throw (await req.json());
				return await req.json();
			},
			sync: async function(...a) {
				let req = await fetch(options.url + "/file_operation", {
					method: "POST",
					headers: {
						"Content-Type": "application/json"
					},
					body: JSON.stringify({
						sessionToken: session,
						operation: "sync",
						parameters: a
					})
				});
				if (!req.ok) throw (await req.json());
				return await req.json();
			},
			isDirectory: async function(...a) {
				let req = await fetch(options.url + "/file_operation", {
					method: "POST",
					headers: {
						"Content-Type": "application/json"
					},
					body: JSON.stringify({
						sessionToken: session,
						operation: "isDirectory",
						parameters: a
					})
				});
				if (!req.ok) throw (await req.json());
				return await req.json();
			},
			unmount: async function(...a) {
				let req = await fetch(options.url + "/file_operation", {
					method: "POST",
					headers: {
						"Content-Type": "application/json"
					},
					body: JSON.stringify({
						sessionToken: session,
						operation: "unmount",
						parameters: a
					})
				});
				if (!req.ok) throw (await req.json());
				return await req.json();
			},
			...serverData
		};
	};

	async function IPCMount(options) { // ChatGPT code below
		if (!options.inputPipeId || !options.outputPipeId) throw new Error("PIPE_IDS_REQUIRED");
	
		const inputPipeId = options.inputPipeId;
		const outputPipeId = options.outputPipeId;
		let lock = false;
	
		async function acquireLock() {
			return new Promise((resolve) => {
				const tryLock = () => {
					if (!lock) {
						lock = true;
						resolve();
					} else {
						setTimeout(tryLock, 10); // retry after 10ms
					}
				};
				setTimeout(tryLock, 10);
			});
		}
	
		async function releaseLock() {
			lock = false;
		}
	
		// Function to send request and receive response
		async function ipcRequest(action, payload = {}) {
			await acquireLock();
			return new Promise((resolve, reject) => {
				modules.ipc.listenFor(outputPipeId).then((response) => {
					releaseLock();
					if (response.error) return reject(new Error(response.error));
					return resolve(response.data);
				});
				modules.ipc.send(inputPipeId, { action, ...payload });
			});
		}
	
		// Initial request to get filesystem properties
		const filesystemData = await ipcRequest("properties", { data: options });
	
		return {
			read: async function(key) {
				return ipcRequest("read", { key: String(key) });
			},
			write: async function(key, value) {
				return ipcRequest("write", { key: String(key), value: String(value) });
			},
			rm: async function(key) {
				return ipcRequest("rm", { key: String(key) });
			},
			ls: async function(directory) {
				return ipcRequest("ls", { directory: String(directory) });
			},
			mkdir: async function(directory) {
				return ipcRequest("mkdir", { directory: String(directory) });
			},
			permissions: async function(file) {
				return ipcRequest("permissions", { file: String(file) });
			},
			chown: async function(file, owner) {
				return ipcRequest("chown", { file: String(file), owner: String(owner) });
			},
			chgrp: async function(file, group) {
				return ipcRequest("chgrp", { file: String(file), group: String(group) });
			},
			chmod: async function(file, permissions) {
				return ipcRequest("chmod", { file: String(file), permissions: String(permissions) });
			},
			isDirectory: async function(key) {
				return ipcRequest("isDirectory", { key: String(key) });
			},
			sync: async function() {
				return ipcRequest("sync");
			},
			unmount: async function() {
				return ipcRequest("unmount");
			},
			...filesystemData
		};
	} // ChatGPT code ends here
	
	fs.mounts["ram"] = ramMount({
		type: "run"
	});
	modules.mounts = {
		PCFSiDBMount,
		PCFSiDBAESCryptMount,
		ramMount,
		SFSPMount,
		IPCMount
	};
	modules.fs = fs;
	modules.defaultSystem = "ram";
}

function sampleFormatToEncryptedPCFS(partition, monokey = true) {
	let salt = crypto.getRandomValues(new Uint8Array(32));
	let diskPart = modules.core.disk.partition(partition);
	let partId;
	try {
		partId = (diskPart.getData()).id;
	} catch {}
	if (!partId) partId = crypto.getRandomValues(new Uint8Array(64)).reduce((a, b) => a + b.toString(16).padStart(2, "0"), "");
	diskPart.setData({
		files: {},
		permissions: {},
		cryptodata: {
			salt: Array.from(salt).map(a => a.toString(16).padStart(2, "0")).join(""),
			passwordLockingInitial: monokey
		},
		id: partId
	});
}

loadFs();
// 02-ui.js
function loadUi() {
	// @pcos-app-mode native
	let uiStyle = document.createElement("style");
	uiStyle.innerHTML = `body {
		overflow: hidden;
		background: black;
		cursor: none;
		font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
	}

	.taskbar {
		width: 100%;
		background: rgb(128, 128, 128);
		left: 0;
		bottom: 0;
		position: absolute;
		padding: 4px;
		box-sizing: border-box;
		border-radius: 4px;
	}

	.clock {
		float: right;
		margin-right: 4px;
	}

	.window {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		background-color: rgb(240, 240, 240);
		border: 1px solid #ccc;
		z-index: 1;
		resize: both;
		width: 320px;
		height: 180px;
		display: flex;
		flex-direction: column;
		overflow: auto;
		border-radius: 4px;
	}

	.window.dark {
		background-color: rgb(55, 55, 55);
		color: white;
		border: 1px solid #1b1b1b;
	}

	.window .title-bar {
		padding: 6px;
		background-color: rgb(204, 204, 204);
		cursor: move;
		display: flex;
		flex: 1;
		user-select: none;
	}

	.window.dark .title-bar {
		background-color: rgb(27, 27, 27);
	}

	.window .button {
		cursor: pointer;
		padding: 4px;
		border: none;
		flex: 1;
		margin: 0 0 0 2px;
		border-radius: 4px;
	}

	.window .button:hover {
		opacity: 75%;
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
	}

	.window.fullscreen .title-bar {
		cursor: default;
	}

	.window .content {
		flex: 100;
		overflow: auto;
		position: relative;
		background-color: #f0f0f0;
	}

	.window.dark .content {
		background-color: #373737;
	}

	.session {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: black;
		cursor: default;
	}

	.session.secure {
		background: none;
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
	modules.startupWindowProgress = document.createElement("progress");
	modules.startupWindow.title.innerText = "PCOS 3";
	modules.startupWindow.content.style.padding = "8px";
	modules.startupWindow.closeButton.classList.toggle("hidden", true);
	modules.startupWindow.content.innerText = "PCOS is starting...";
	modules.startupWindow.content.appendChild(document.createElement("br"));
	modules.startupWindow.content.appendChild(modules.startupWindowProgress);
}

loadUi();
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
			try {
				this._ipc[id]._listeners.forEach(listener => listener(data));
			} catch {}
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
					owner: handle.slice(0, 16),
					group: handle.slice(0, 16),
					world: true
				}
			};
			return handle;
		},
		send: (arg) => websocketAPI._handles[arg.handle].ws.send(arg.data),
		close: function(handle) {
			if (websocketAPI._handles.hasOwnProperty(handle)) websocketAPI._handles[handle].ws.close();
			delete websocketAPI._handles[handle];
		},
		getInfo: function(handle) {
			return {
				bufferedAmount: websocketAPI._handles[handle].ws.bufferedAmount,
				extensions: websocketAPI._handles[handle].ws.extensions,
				protocol: websocketAPI._handles[handle].ws.protocol,
				readyState: websocketAPI._handles[handle].ws.readyState,
				url: websocketAPI._handles[handle].ws.url
			}
		},
		waitForEvent: function(arg) {
			return new Promise(function(resolve) {
				websocketAPI._handles[arg.handle].ws.addEventListener(arg.eventName, function meName(arg2) {
					if (arg.eventName == "message") resolve(arg2.data);
					else if (arg.eventName == "error") resolve({
						code: arg2.code,
						reason: arg2.reason,
						wasClean: arg2.wasClean
					});
					else resolve(arg.eventName);
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
		_handles: {}
	}
	modules.websocket = websocketAPI;
}

loadWebsocketSupport();
// 05-reeapis.js
function reeAPIs() {
	// @pcos-app-mode native

	modules.reeAPIInstance = async function(opts) {
		let {ree, ses, token, taskId, privateData} = opts;
		let processToken = token;
		let tokenInfo = await modules.tokens.info(token);
		let user = tokenInfo.user;
		let groups = tokenInfo.groups || [];
		let privileges = tokenInfo.privileges;
		let processPipes = [];
		let websockets = [];
		let automatedLogonSessions = {};

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
				if (e.name == "Error") throw e;
				throw new Error("FS_ACTION_FAILED");
			}
		}
		ree.beforeCloseDown(async function() {
			for (let processPipe of processPipes) delete modules.ipc._ipc[processPipe];
			for (let websocket of websockets) modules.websocket.close(websocket);
			await modules.tokens.revoke(token);
			for (let i in modules.csps) if (modules.csps[i].hasOwnProperty("removeSameGroupKeys")) modules.csps[i].removeSameGroupKeys(null, taskId);
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
				rmPrivileges: async function(privilegesRemoved) {
					privileges = privileges.filter(x => !privilegesRemoved.includes(x));
					await modules.tokens.removePrivileges(token, privilegesRemoved);
					return true;
				},
				switchUser: async function(desiredUser) {
					if (!privileges.includes("SWITCH_USERS_AUTOMATICALLY")) throw new Error("UNAUTHORIZED_ACTION");
					await modules.tokens.halfInitialize(token, desiredUser);
					user = (await modules.tokens.info(token)).user;
					groups = (await modules.users.getUserInfo(desiredUser)).groups || [];
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
					let fsParentPermissions;
					try {
						if (!(await modules.fs.ls(pathParent, token || processToken)).includes(basename)) isCreating = true;
					} catch (e) {
						throw new Error("CREATION_CHECK_FAILED");
					}

					try {
						fsParentPermissions = await modules.fs.permissions(pathParent, token || processToken);
					} catch (e) {
						throw new Error("PERMISSION_CHECKING_FAILED");
					}
					if (!fsParentPermissions.world.includes("w") && fsParentPermissions.owner != user && !groups.includes(fsParentPermissions.group) && !privileges.includes("FS_BYPASS_PERMISSIONS")) throw new Error("PERMISSION_DENIED");
					
					if (isCreating) {
						try {
							await modules.fs.chown(path, user, token || processToken);
							await modules.fs.chgrp(path, groups[0], token || processToken);
							await modules.fs.chmod(path, "r", token || processToken);
						} catch (e) {
							if (e.name == "Error") throw e;
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
						await modules.fs.chgrp(path, groups[0] || user, token || processToken);
						await modules.fs.chmod(path, "rx", token || processToken);
					} catch (e) {
						if (e.name == "Error") throw e;
						throw new Error("PERMISSION_CHANGE_FAILED");
					}
					try {
						return await modules.fs.mkdir(path, token || processToken);
					} catch (e) {
						if (e.name == "Error") throw e;
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
					if (pathParent != "") {
						let fsPermissions;
						try {
							fsPermissions = await modules.fs.permissions(pathParent, token || processToken);
						} catch (e) {
							throw new Error("PERMISSION_CHECKING_FAILED");
						}
						if (!fsPermissions.world.includes("r") && fsPermissions.owner != user && !privileges.includes("FS_BYPASS_PERMISSIONS")) throw new Error("PERMISSION_DENIED");
					}
					return await fs_action("permissions", () => true, path, token || processToken);
				},
				fs_mounts: async function() {
					if (!privileges.includes("FS_LIST_PARTITIONS")) throw new Error("UNAUTHORIZED_ACTION");
					try {
						return await modules.fs.lsmounts();
					} catch (e) {
						if (e.name == "Error") throw e;
						throw new Error("FS_ACTION_FAILED");
					}
				},
				fs_sync: async function(arg) {
					let {mount, token} = arg;
					if (!privileges.includes("FS_UNMOUNT")) throw new Error("UNAUTHORIZED_ACTION");
					try {
						return await modules.fs.sync(mount, token || processToken);
					} catch (e) {
						if (e.name == "Error") throw e;
						throw new Error("FS_ACTION_FAILED");
					}
				},
				fs_unmount: async function(arg) {
					let {mount, token, force} = arg;
					if (!privileges.includes("FS_UNMOUNT")) throw new Error("UNAUTHORIZED_ACTION");
					try {
						return await modules.fs.unmount(mount, token || processToken, force);
					} catch (e) {
						if (e.name == "Error") throw e;
						throw new Error("FS_ACTION_FAILED");
					}
				},
				fs_mountInfo: async function(mount) {
					if (!privileges.includes("FS_LIST_PARTITIONS")) throw new Error("UNAUTHORIZED_ACTION");
					try {
						return await modules.fs.mountInfo(mount);
					} catch (e) {
						if (e.name == "Error") throw e;
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
					return true;
				},
				getVersion: function() {
					if (!privileges.includes("GET_BUILD")) throw new Error("UNAUTHORIZED_ACTION");
					return modules.pcos_version;
				},
				locale: function() {
					if (!privileges.includes("GET_LOCALE")) throw new Error("UNAUTHORIZED_ACTION");
					return navigator.languages[0].split("-")[0].toLowerCase();
				},
				osLocale: function() {
					if (!privileges.includes("GET_LOCALE")) throw new Error("UNAUTHORIZED_ACTION");
					return modules.locales.get("OS_LOCALE");
				},
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
					let allowedTypes = [ "pbkdf2", "informative", "informative_deny", "timeout", "timeout_deny", "serverReport", "pc-totp", "totp", "workingHours", "zkpp" ];
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
						} else if (check.type == "zkpp") {
							if (!check.publicKey) continue;
							check = { type: "zkpp", publicKey: check.publicKey };
						}
						sanitizedChecks.push(check);
					}
					let previousUserInfo = await modules.users.getUserInfo(user, false, token || processToken);
					await modules.users.moduser(user, { ...previousUserInfo, securityChecks: sanitizedChecks }, token || processToken);
					return true;
				},
				getNewToken: async function(desiredUser) {
					if (!privileges.includes("ELEVATE_PRIVILEGES")) throw new Error("UNAUTHORIZED_ACTION");
					if (modules.session.attrib(ses, "secureLock")) await modules.session.attrib(ses, "secureLock");
					if (modules.session.active != ses) throw new Error("TRY_AGAIN_LATER");
					let releaseLock;
					let lock = new Promise((resolve) => releaseLock = resolve);
					modules.session.attrib(ses, "secureLock", lock);
					let secureSession = await modules.session.mksession();

					let dom = modules.session.tracker[secureSession].html;
					let ogDom = modules.session.tracker[ses].html;
					let bgfx = document.createElement("div");
					bgfx.classList.add("session", "secure");
					dom.appendChild(bgfx);
					modules.session.attrib(secureSession, "dark", modules.session.attrib(ses, "dark"));
					dom.style.background = ogDom.style.background;
					dom.style.backgroundSize = "100% 100%";

					modules.session.muteAllSessions();
					modules.session.activateSession(secureSession);

					let logonUI = await modules.authui(secureSession, desiredUser);
					return new Promise(function(resolve) {
						logonUI.hook(async function(result) {
							releaseLock();
							modules.session.attrib(ses, "secureLock", null);
							modules.session.muteAllSessions();
							modules.session.rmsession(secureSession);
							modules.session.activateSession(ses);
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
					return true;
				},
				revokeToken: function(dt) {
					if (!privileges.includes("MANAGE_TOKENS")) throw new Error("UNAUTHORIZED_ACTION");
					return modules.tokens.revoke(dt || processToken);
				},
				forkToken: function(dt) {
					if (!privileges.includes("MANAGE_TOKENS")) throw new Error("UNAUTHORIZED_ACTION");
					return modules.tokens.fork(dt || processToken);
				},
				removeTokenPrivilege: async function(arg) {
					let {token, privilege} = arg;
					if (!privileges.includes("MANAGE_TOKENS")) throw new Error("UNAUTHORIZED_ACTION");
					await modules.tokens.removePrivilege(token, privilege);
					return true;
				},
				removeTokenPrivileges: async function(arg) {
					let {token, privileges} = arg;
					if (!privileges.includes("MANAGE_TOKENS")) throw new Error("UNAUTHORIZED_ACTION");
					await modules.tokens.removePrivileges(token, privileges);
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
					let {file, argPassed, token, runInBackground, silent, privateData} = arg;
					if (!privileges.includes("START_TASK")) throw new Error("UNAUTHORIZED_ACTION");
					if (runInBackground && !privileges.includes("START_BACKGROUND_TASK")) throw new Error("UNAUTHORIZED_ACTION");
					if (!token) token = await modules.tokens.fork(processToken);
					try {
						return await modules.tasks.exec(file, argPassed, modules.window(runInBackground ? modules.serviceSession : ses), token, silent, privateData);
					} catch (e) {
						if (e.name == "Error") throw e;
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
				lookupLocale: function(key) {   
					if (!privileges.includes("GET_LOCALE")) throw new Error("UNAUTHORIZED_ACTION");
					return modules.locales.get(key);
				},
				lookupOtherLocale: function(arg) {
					let {key, locale} = arg;   
					if (!privileges.includes("GET_LOCALE")) throw new Error("UNAUTHORIZED_ACTION");
					return modules.locales.get(key, locale);
				},
				ufTimeInc: function(args) {
					if (!privileges.includes("GET_LOCALE")) throw new Error("UNAUTHORIZED_ACTION");
					return modules.userfriendliness.inconsiderateTime(...args);
				},
				ufInfoUnits: function(args) {
					if (!privileges.includes("GET_LOCALE")) throw new Error("UNAUTHORIZED_ACTION");
					return modules.userfriendliness.informationUnits(...args)
				},
				isDarkThemed: function() {
					if (!privileges.includes("GET_THEME")) throw new Error("UNAUTHORIZED_ACTION");
					return modules.session.attrib(ses, "dark")
				},
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
				ufTimeCon: function(args) {
					if (!privileges.includes("GET_LOCALE")) throw new Error("UNAUTHORIZED_ACTION");
					return modules.userfriendliness.considerateTime(...args);
				},
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
					if (!websockets.includes(websocket)) throw new Error("NOT_OWN_WEBSOCKET");
					websockets.splice(websockets.indexOf(websocket), 1);
					return modules.websocket.close(websocket);
				},
				websocketInfo: async function(arg) {
					if (!privileges.includes("WEBSOCKET_INFO")) throw new Error("UNAUTHORIZED_ACTION");
					let permissions = modules.websocket.assertAccess({ handle: arg.handle });
					if (permissions.owner != user && !groups.includes(permissions.group) && !permissions.world && !privileges.includes("WEBSOCKET_BYPASS_PERMISSIONS") && !websockets.includes(arg.handle)) throw new Error("PERMISSION_DENIED");
					return await modules.websocket.getInfo(arg);
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
				},
				typeIntoOtherCLI: async function(arg) {
					if (!privileges.includes("CLI_MODIFICATIONS")) throw new Error("UNAUTHORIZED_ACTION");
					if (!modules.tasks.tracker.hasOwnProperty(arg.taskId)) throw new Error("TASK_NOT_FOUND");
					let bypassWorks = modules.tasks.tracker[arg.taskId].apis.public.getProcessToken() == arg.bypass;
					if (!bypassWorks) {
						let taskInfo = await modules.tasks.taskInfo(arg.taskId);
						if (taskInfo.runBy != user && !privileges.includes("TASK_BYPASS_PERMISSIONS")) throw new Error("PERMISSION_DENIED");
					}
					if (!modules.tasks.tracker[arg.taskId].cliio) throw new Error("NO_CLI_ATTACHED");
					return await modules.tasks.tracker[arg.taskId].cliio.xtermInstance.input(arg.text, arg.human);
				},
				getOtherCLIData: async function(arg) {
					if (!privileges.includes("CLI_MODIFICATIONS")) throw new Error("UNAUTHORIZED_ACTION");
					if (!modules.tasks.tracker.hasOwnProperty(arg.taskId)) throw new Error("TASK_NOT_FOUND");
					let bypassWorks = modules.tasks.tracker[arg.taskId].apis.public.getProcessToken() == arg.bypass;
					if (!bypassWorks) {
						let taskInfo = await modules.tasks.taskInfo(arg.taskId);
						if (taskInfo.runBy != user && !privileges.includes("TASK_BYPASS_PERMISSIONS")) throw new Error("PERMISSION_DENIED");
					}
					if (!modules.tasks.tracker[arg.taskId].cliio) throw new Error("NO_CLI_ATTACHED");
					return await modules.tasks.tracker[arg.taskId].cliio.signup();
				},
				waitForOtherCLI: async function(arg) {
					if (!privileges.includes("CLI_MODIFICATIONS")) throw new Error("UNAUTHORIZED_ACTION");
					if (!modules.tasks.tracker.hasOwnProperty(arg.taskId)) throw new Error("TASK_NOT_FOUND");
					let bypassWorks = modules.tasks.tracker[arg.taskId].apis.public.getProcessToken() == arg.bypass;
					if (!bypassWorks) {
						let taskInfo = await modules.tasks.taskInfo(arg.taskId);
						if (taskInfo.runBy != user && !privileges.includes("TASK_BYPASS_PERMISSIONS")) throw new Error("PERMISSION_DENIED");
					}
					if (modules.tasks.tracker[arg.taskId].cliio) return true;
					return await modules.tasks.tracker[arg.taskId].cliio.attachedCLISignUp();
				},
				lldaRead: async function(arg) {
					if (!privileges.includes("LLDISK_READ")) throw new Error("UNAUTHORIZED_ACTION");
					return modules.core.disk.partition(arg.partition).getData();
				},
				lldaWrite: async function(arg) {
					if (!privileges.includes("LLDISK_WRITE")) throw new Error("UNAUTHORIZED_ACTION");
					return modules.core.disk.partition(arg.partition).setData(arg.data);
				},
				lldaList: async function() {
					if (!privileges.includes("LLDISK_LIST_PARTITIONS")) throw new Error("UNAUTHORIZED_ACTION");
					return modules.core.disk.partitions();
				},
				lldaInitPartitions: async function() {
					if (!privileges.includes("LLDISK_INIT_PARTITIONS")) throw new Error("UNAUTHORIZED_ACTION");
					return modules.core.disk.insertPartitionTable();
				},
				lldaRemove: async function(arg) {
					if (!privileges.includes("LLDISK_REMOVE")) throw new Error("UNAUTHORIZED_ACTION");
					return modules.core.disk.partition(arg.partition).remove();
				},
				lldaIDBRead: async function(arg) {
					if (!privileges.includes("LLDISK_IDB_READ")) throw new Error("UNAUTHORIZED_ACTION");
					return modules.core.idb.readPart(arg.key);
				},
				lldaIDBWrite: async function(arg) {
					if (!privileges.includes("LLDISK_IDB_WRITE")) throw new Error("UNAUTHORIZED_ACTION");
					return modules.core.idb.writePart(arg.key, arg.value);
				},
				lldaIDBRemove: async function(arg) {
					if (!privileges.includes("LLDISK_IDB_REMOVE")) throw new Error("UNAUTHORIZED_ACTION");
					return modules.core.idb.removePart(arg.key);
				},
				lldaIDBList: async function() {
					if (!privileges.includes("LLDISK_IDB_LIST")) throw new Error("UNAUTHORIZED_ACTION"); 
					if (modules.core.idb.listParts) return modules.core.idb.listParts(); 
					let idb_keys = modules.core.idb._db.transaction("disk").objectStore("disk").getAllKeys();
					return new Promise(function(resolve) {
						idb_keys.onsuccess = () => resolve(idb_keys.result);
					});
				},
				lldaIDBSync: async function() {
					if (!privileges.includes("LLDISK_IDB_SYNC")) throw new Error("UNAUTHORIZED_ACTION");
					return modules.core.idb.sync();
				},
				fs_mount: async function(arg) {
					if (!privileges.includes("FS_MOUNT")) throw new Error("UNAUTHORIZED_ACTION");
					modules.fs.mounts[arg.mountpoint] = await modules.mounts[arg.filesystem](arg.filesystemOptions);
				},
				supportedFilesystems: async function() {
					if (!privileges.includes("GET_FILESYSTEMS")) throw new Error("UNAUTHORIZED_ACTION");
					return Object.keys(modules.mounts);
				},
				installedLocales: async function() {
					if (!privileges.includes("GET_LOCALE")) throw new Error("UNAUTHORIZED_ACTION");
					return Object.keys(modules.locales).filter(a => a != "get" && a != "defaultLocale");
				},
				runningServer: async function() {
					if (!privileges.includes("GET_SERVER_URL")) throw new Error("UNAUTHORIZED_ACTION");
					return location.origin;
				},
				fs_isDirectory: async function(arg) {
					if (!privileges.includes("FS_READ")) throw new Error("UNAUTHORIZED_ACTION");
					let {path, token} = arg;
					return await fs_action("isDirectory", (fsPermissions) => fsPermissions.owner == user || fsPermissions.world.includes("r") || groups.includes(fsPermissions.group) || privileges.includes("FS_BYPASS_PERMISSIONS"), path, token || processToken);
				},
				automatedLogonCreate: async function(arg) {
					let { desiredUser, token } = arg;
					if (!privileges.includes("ELEVATE_PRIVILEGES")) throw new Error("UNAUTHORIZED_ACTION");
					let automatedLogon = Array.from(crypto.getRandomValues(new Uint8Array(64))).reduce((a, b) => a + b.toString(16).padStart(2, "0"), "");
					try {
						let access = await modules.users.access(desiredUser, token || processToken);
						access = await access.getNextPrompt();
						automatedLogonSessions[automatedLogon] = access;
					} catch {
						throw new Error("AUTOMATED_LOGON_CREATE_FAILED")
					}
					return automatedLogon;
				},
				automatedLogonGet: async function(arg) {
					if (!privileges.includes("ELEVATE_PRIVILEGES")) throw new Error("UNAUTHORIZED_ACTION");
					try {
						let sharedObj = { ...automatedLogonSessions[arg] };
						delete sharedObj.input;
						return sharedObj;
					} catch (e) {
						throw new Error("AUTOMATED_LOGON_GET_FAILED");
					}
				},
				automatedLogonInput: async function(arg) {
					let { session, input } = arg;
					if (!privileges.includes("ELEVATE_PRIVILEGES")) throw new Error("UNAUTHORIZED_ACTION");
					try {
						automatedLogonSessions[session] = await automatedLogonSessions[session].input(input);
					} catch {
						throw new Error("AUTOMATED_LOGON_INPUT_FAILED");
					}
				},
				automatedLogonDelete: async function(arg) {
					if (!privileges.includes("ELEVATE_PRIVILEGES")) throw new Error("UNAUTHORIZED_ACTION");
					delete automatedLogonSessions[arg];
				},
				setSystemMount: async function(arg) {
					if (!privileges.includes("SET_DEFAULT_SYSTEM")) throw new Error("UNAUTHORIZED_ACTION");
					modules.defaultSystem = arg;
				},
				usedRAM: async function() {
					if (!privileges.includes("GET_SYSTEM_RESOURCES")) throw new Error("UNAUTHORIZED_ACTION");
					try {
						let mem = performance.memory;
						return {
							total: mem.jsHeapSizeLimit,
							used: mem.usedJSHeapSize,
							free: mem.jsHeapSizeLimit - mem.usedJSHeapSize
						}
					} catch {}
					let mem = await performance.measureUserAgentSpecificMemory();
					return {
						total: Infinity,
						used: mem.bytes,
						free: Infinity
					}
				},
				checkBootMode: async function() {
					if (!privileges.includes("GET_BOOT_MODE")) throw new Error("UNAUTHORIZED_ACTION");
					return modules.core.bootMode || "normal";
				},
				getScreenInfo: async function() {
					if (!privileges.includes("GET_SCREEN_INFO")) throw new Error("UNAUTHORIZED_ACTION");
					return {
						width: document.documentElement.clientWidth,
						height: document.documentElement.clientHeight,
						colorDepth: screen.colorDepth,
						orientation: {
							type: screen.orientation.type,
							angle: screen.orientation.angle
						},
						fullWidth: screen.width,
						fullHeight: screen.height,
						availWidth: screen.availWidth,
						availHeight: screen.availHeight,
					}
				},
				waitTermination: async function(arg) {
					if (!privileges.includes("LIST_TASKS")) throw new Error("UNAUTHORIZED_ACTION");
					return modules.tasks.waitTermination(arg);
				},
				consentGetToken: async function(params) {
					if (!privileges.includes("ELEVATE_PRIVILEGES")) throw new Error("UNAUTHORIZED_ACTION");
					if (modules.session.attrib(ses, "secureLock")) await modules.session.attrib(ses, "secureLock");
					if (modules.session.active != ses) throw new Error("TRY_AGAIN_LATER");
					let { desiredUser, intent } = params;
					if (!intent) throw new Error("INTENT_REQUIRED");
					let releaseLock;
					let lock = new Promise((resolve) => releaseLock = resolve);
					modules.session.attrib(ses, "secureLock", lock);
					let secureSession = await modules.session.mksession();

					let dom = modules.session.tracker[secureSession].html;
					let ogDom = modules.session.tracker[ses].html;
					let bgfx = document.createElement("div");
					bgfx.classList.add("session", "secure");
					dom.appendChild(bgfx);
					modules.session.attrib(secureSession, "dark", modules.session.attrib(ses, "dark"));
					dom.style.background = ogDom.style.background;
					dom.style.backgroundSize = "100% 100%";

					modules.session.muteAllSessions();
					modules.session.activateSession(secureSession);
					let task = await modules.tasks.taskInfo(taskId);

					let logonUI = await modules.consentui(secureSession, {
						user: desiredUser,
						path: task.file,
						args: task.arg,
						intent,
						name: params.name
					});
					return new Promise(function(resolve) {
						logonUI.hook(async function(result) {
							releaseLock();
							modules.session.attrib(ses, "secureLock", null);
							modules.session.muteAllSessions();
							modules.session.rmsession(secureSession);
							modules.session.activateSession(ses);
							if (result.success == false) return resolve(false);
							return resolve(result.token);
						});
					});
				},
				networkPing: async function(address) {
					if (!privileges.includes("PCOS_NETWORK_PING")) throw new Error("UNAUTHORIZED_ACTION");
					let websocketHandle = await modules.fs.read("ram/run/network.ws", processToken);
					if (!websocketHandle) throw new Error("NETWORK_UNREACHABLE");
					let websocket = modules.websocket._handles[websocketHandle].ws;
					if (websocket.readyState != 1) throw new Error("NETWORK_UNREACHABLE");
					return new Promise(async function(resolve, reject) {
						let packetId = Array.from(crypto.getRandomValues(new Uint8Array(32))).map(a => a.toString(16).padStart(2, "0")).join("");
						let resend = Array.from(crypto.getRandomValues(new Uint8Array(32))).map(a => a.toString(16).padStart(2, "0")).join("");
						websocket.addEventListener("message", function self(e) {
							try {
								let data = JSON.parse(e.data);
								if (data.packetID == packetId && data.event == "AddressUnreachable") reject(new Error("ADDRESS_UNREACHABLE"));
								if (data.from == address && data.data.type == "pong" && data.data.resend == resend) resolve("success");
							} catch {}
						});
						websocket.send(JSON.stringify({
							receiver: address,
							data: {
								type: "ping",
								resend: resend
							},
							id: packetId
						}))
					});
				},
				logOut: async function(desiredUser) {
					if (desiredUser != user && !privileges.includes("LOGOUT_OTHERS")) throw new Error("UNAUTHORIZED_ACTION");
					if (desiredUser == user && !privileges.includes("LOGOUT")) throw new Error("UNAUTHORIZED_ACTION");
					if (modules.session.active != ses && !privileges.includes("LOGOUT_OTHERS")) throw new Error("UNAUTHORIZED_ACTION");
					await modules.logOut(desiredUser);
				},
				lock: async function() {
					if (modules.session.active == ses && !privileges.includes("LOGOUT")) throw new Error("UNAUTHORIZED_ACTION");
					if (modules.session.active != ses && !privileges.includes("LOGOUT_OTHERS")) throw new Error("UNAUTHORIZED_ACTION");
					modules.session.muteAllSessions();
					modules.session.activateSession(modules.session.systemSession);
				},
				getPrivateData: () => privateData
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
				developer: "PCsoft",
				features: Object.keys(modules.csps.basic)
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
			"UNTITLED_APP": "Untitled program",
			"PERMISSION_DENIED": "Permission denied",
			"MORE_PERMISSION_DENIED": "There are not enough permissions to run this program.",
			"COMPATIBILITY_ISSUE_TITLE": "Compatibility issue",
			"COMPATIBILITY_ISSUE": "This program cannot run on this computer as a task. Check the application modes to include \"isolatable\".",
			"APP_STARTUP_CRASH_TITLE": "Something went wrong",
			"APP_STARTUP_CRASH": "The system failed to execute this program.",
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
			"LIVE_BUTTON": "Try out",
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
			"COPYING_FOLDERS": "Copying directories",
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
			"INSTALLING_APPS": "Installing programs",
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
			"API_TEST_TERM": "API Developer's Terminal",
			"HELP_TERMINAL_APITEST": "help - Display help menu\r\nclear - Clear terminal\r\njs_ree - Execute JavaScript code\r\n--- REE API EXPORTS ---\r\n",
			"TERM_COMMAND_NOT_FOUND": "%s: command not found",
			"FILE_EXPLORER": "File explorer",
			"GRANT_FEXP_PERM": "Please grant permissions to read file structures and list partitions.",
			"GRANT_PERM": "Grant permissions",
			"GRANT_FEXP_PERM_ADM": "Please consult the administrator to grant privileges to this program to read file structures and list partitions. (FS_READ, FS_LIST_PARTITIONS)",
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
			"PANIC_LINE5": "You can try repairing the filesystem by placing a .fsck file on the system root mountpoint, with the value \"recover\" in it.",
			"PANIC_LINE6": "Proper shutdown procedure follows now:",
			"PANIC_TASK_KILLED": "task:%s: killed",
			"PANIC_MOUNT_UNMOUNTED": "mount:%s: unmounted",
			"PANIC_MOUNT_FAILED": "mount:%s: %s: %s",
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
			"DESCRIPTION_FIELD": "Description: %s",
			"LICENSE_FIELD": "License: %s",
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
			"ADD_BTN": "Add",
			"OS_LOCALE": "en",
			"SYSTEM_SECURITY_TITLE": "System Security",
			"SYSTEM_SECURITY_DENY": "Not enough privileges were granted for System Security.",
			"EDIT": "Edit",
			"USER_GROUPS": "Groups",
			"USER_HOMEDIR": "Home directory",
			"REMOVE_USER_WITH_HD": "Remove user with home directory",
			"CREATE_HD": "Create home directory",
			"CREATING_HD_OK": "The home directory was created successfully.",
			"CREATING_HD_FAIL": "Failed to create the home directory.",
			"SIGNATURE_VERIFICATION_FAILED": "This program claims it is trusted by %s, but the system failed to verify that claim.",
			"UNKNOWN_PLACEHOLDER": "<Unknown>",
			"NO_APP_ALLOWLIST": "The system administrator requires programs to have an allowlist of permissions, but this program didn't have that list.",
			"DISCARD_BUTTON": "Discard lost files",
			"MOUNTPOINT": "Mountpoint",
			"GENERATE_PROMPT": "Generate?",
			"MOUNT_BUTTON": "Mount",
			"NEW_DIR_NAME": "New directory name",
			"MKDIR_BUTTON": "Create directory",
			"CHOWN_BUTTON": "Change owner",
			"CHGRP_BUTTON": "Change group",
			"CHMOD_BUTTON": "Change permissions",
			"CLIPBOARD_COPY": "Copy",
			"CLIPBOARD_CUT": "Cut",
			"CLIPBOARD_PASTE": "Paste",
			"CLIPBOARD_SOURCE_GONE": "The source no longer exists or is no longer a file.",
			"CLIPBOARD_CONFLICT": "The destination directory already has a file or directory with the same name.",
			"SAFE_MODE_MSG": "Safe mode",
			"INSTALLING_SFX": "Installing sound effects",
			"APP_OR_KEY_SIGNATURE_VERIFICATION_FAILED": "Signature verification for the program or the key signing the program failed.",
			"NO_SUCH_DEVICE": "No such device",
			"READ_ONLY_BMGR": "Writes restricted by boot manager.",
			"READ_ONLY_DEV": "Device is read-only",
			"NO_DIRECTORY_SUPPORT": "Device does not support directories",
			"NO_PERMIS_SUPPORT": "Device does not support permissions",
			"IS_A_DIR": "Is a directory",
			"NO_SUCH_FILE": "No such file",
			"NO_SUCH_DIR": "No such directory",
			"NO_SUCH_FILE_DIR": "No such file or directory",
			"NON_EMPTY_DIR": "Non-empty directory",
			"IS_A_FILE": "Is a file",
			"DIR_EXISTS": "Directory already exists",
			"FS_ACTION_FAILED": "Failed to perform this file system action.",
			"UNAUTHORIZED_ACTION": "The program does not have permissions to perform this action.",
			"CREATION_CHECK_FAILED": "Failed to check if this object is being created.",
			"PERMISSION_CHANGE_FAILED": "Failed to change permissions for this object.",
			"UPDATE_EXTRA_FAIL": "Failed to update apps, wallpapers, sounds.",
			"UPDATE_BOOT_FAIL": "Failed to update boot files.",
			"UPDATE_BUTTON": "Update OS",
			"TOGGLE_HIDDEN_FILES": "Hide/unhide files",
			"AUTORUN_NECESSITIES_FAILED": "Failed to run one of your autorun files. The system will not log you in.",
			"CRYPTO_TOOLS_TITLE": "Cryptographic Tools",
			"CRYPTO_TOOLS_NOPERM": "Not enough privileges were given to use Cryptographic Tools.",
			"CRYPTO_RNG": "Random generation",
			"CRYPTO_HASH": "Hashing",
			"CRYPTO_KEYGEN": "Key generation",
			"CRYPTO_ENCRYPT": "Encryption",
			"CRYPTO_DECRYPT": "Decryption",
			"CRYPTO_SIGN": "Signing",
			"CRYPTO_VERIFY": "Verification",
			"CRYPTO_DERIVEBITS": "Bit derivation",
			"GENERATE": "Generate",
			"RAW_HEX_DATA": "Raw data (hex)",
			"CRYPTO_HASH_FIELD": "Hash algorithm: ",
			"CRYPTO_PLAINTEXT_FIELD": "Plaintext: ",
			"ALGORITHM_FIELD": "Algorithm: ",
			"LENGTH_FIELD": "Length: ",
			"CRYPTO_NC_FIELD": "Named curve: ",
			"IMPORT_AS_FIELD": "Import as: ",
			"CRYPTO_KEY_FIELD": "Key: ",
			"CRYPTO_CIPHERTEXT_FIELD": "Ciphertext (hex): ",
			"CRYPTO_SIGNATURE_FIELD": "Signature (hex): ",
			"CRYPTO_KEYGEN_MSG": "Generating key(s)...",
			"CRYPTO_KEYGEN_SYMM": "Is a symmetric key type",
			"CRYPTO_KEYGEN_EXPFAIL": "Export failed, check export settings",
			"CRYPTO_RNGOUT_FIELD": "Random numbers (hex): ",
			"CRYPTO_KEYGEN_ACTION": "Generate key(s)",
			"CRYPTO_HASH_ACTION": "Hash",
			"CRYPTO_ENCRYPT_ACTION": "Encrypt",
			"CRYPTO_DECRYPT_ACTION": "Decrypt",
			"CRYPTO_SIGN_ACTION": "Sign",
			"CRYPTO_VERIFY_ACTION": "Verify",
			"CRYPTO_DERIVEBITS_ACTION": "Derive bits",
			"CRYPTO_PUBKEY_FIELD": "Public key: ",
			"CRYPTO_PRIVKEY_FIELD": "Private key: ",
			"CRYPTO_BASEKEY_FIELD": "Base key: ",
			"CRYPTO_HASHOUT_FIELD": "Hash value (hex): ",
			"CRYPTO_MODLEN_FIELD": "Modulus length: ",
			"CRYPTO_PUBEXP_FIELD": "Public exponent (hex): ",
			"EXPORT_AS_FIELD": "Export as: ",
			"CRYPTO_KEYUSE_FIELD": "Key usages:",
			"CRYPTO_PLAINTEXTAS_FIELD": "Process plaintext as: ",
			"CRYPTO_IV_FIELD": "IV (hex): ",
			"CRYPTO_CTR_FIELD": "Counter (hex): ",
			"CRYPTO_VERIFIED_CHECKBOX": "Verified successfully",
			"CRYPTO_SALT_FIELD": "Salt (hex): ",
			"CRYPTO_DERIVEOUT_FIELD": "Derived bits (hex): ",
			"CRYPTO_ITERATIONS_FIELD": "Iterations: ",
			"PATH_INCLUDES_EMPTY": "The specified path includes an object with an empty name.",
			"BASIC_CURL_USAGE": "Usage: basiccurl [source] [output]",
			"BASIC_CURL_DESCRIPTION": "Downloads the specified source and saves it to the specified output.",
			"NO_ARGUMENTS": "No arguments specified",
			"CAT_USAGE": "Usage: cat [file1] <file2> <file3> ... <fileN>",
			"CAT_DESCRIPTION": "Concatenates the specified files and outputs to CLI output",
			"CHGRP_USAGE": "Usage: chgrp [group] [file]",
			"CHGRP_DESCRIPTION": "Changes the owning group of the specified file",
			"CHMOD_USAGE": "Usage: chmod [mode] [file]",
			"CHMOD_DESCRIPTION": "Changes what everyone may do with the specified file",
			"CHMOD_MODE_DESCRIPTION": "[mode] may consist of characters r (Read), w (Write) and x (eXecute).",
			"CHMOD_MODE_CONVERT": "[mode] number to string table: 0 - \"\", 1 - \"x\", 2 - \"w\", 3 - \"wx\", 4 - \"r\", 5 - \"rx\", 6 - \"rw\", 7 - \"rwx\"",
			"CHOWN_USAGE": "Usage: chown [user] [file]",
			"CHOWN_DESCRIPTION": "Changes the owning user of the specified file",
			"CP_USAGE": "Usage: cp <options> [source] [destination]",
			"CP_DESCRIPTION": "Copies files or directories from the source to the destination.",
			"OPT_RECURSIVE_DESCRIPTION": "--recursive: run on directories",
			"OPT_FORCE_DESCRIPTION": "--force: do not fail immediately in case of an error",
			"ARGUMENT_COUNT_MISMATCH": "Too much or not enough arguments",
			"DF_HEADER": "Medium\tSize\tUsed\tAvail\tUse%",
			"LS_USAGE": "Usage: ls [directory]",
			"LS_DESCRIPTION": "Lists the contents of the specified directory.",
			"LS_MOUNTPOINT_LIST": "You have the following mountpoints: ",
			"MOUNTPOINT_SYSTEM": "system",
			"PASSWD_NEW_PROMPT": "Setting a new password for your user account.",
			"PASSWD_2FACTOR_LOSS_WARN": "Any previously set up additional factors will be removed.",
			"PASSWD_PROMPT": "New password: ",
			"PASSWD_CONFIRM_PROMPT": "Re-enter password: ",
			"PASSWD_FEEDBACK": "New password set",
			"PASSWD_MISMATCH": "Sorry, passwords do not match.",
			"PING_USAGE": "Usage: ping <--internet> [networkAddress]",
			"PING_DESCRIPTION": "Sends a request to the specified address to verify its availability.",
			"PING_INTERNET_OPTION": "--internet: send a ping to the Internet instead of PCOS Network",
			"PIVOT_ROOT_USAGE": "Usage: pivot_root [mountpoint]",
			"PIVOT_ROOT_DESCRIPTION": "Makes the specified mountpoint the new default system mountpoint for every program.",
			"REAL_TERMINAL_NAME": "Terminal",
			"REAL_TERMINAL_BUILTIN_LIST": "Built-in commands:",
			"REAL_TERMINAL_HELP_USEDESC": "help - Display the list, description and usage of all available built-in commands.",
			"REAL_TERMINAL_CLEAR_USEDESC": "clear - Clear everything displayed on the terminal right now.",
			"REAL_TERMINAL_SUGRAPH_USEDESC": "sugraph <desiredUsername> - Switch the terminal user using a graphical utility.",
			"REAL_TERMINAL_SU_USEDESC": "su <desiredUsername> - Switch the terminal user.",
			"REAL_TERMINAL_GRAPHIC_USEDESC": "graphic <boolean> - Enable or disable running new applications outside of background.",
			"REAL_TERMINAL_EXIT_USEDESC": "exit - Exit the terminal.",
			"REAL_TERMINAL_LOGON_REQUIRED": "(internal): You must run sugraph %s before running this program.",
			"RM_USAGE": "Usage: rm <options> [file]",
			"RM_DESCRIPTION": "Removes the specified file or directory.",
			"RKL_USAGE": "Usage: runKlvlCode [codeFile]",
			"RKL_DESCRIPTION": "Runs the specified code file in the kernel level.",
			"WRITE_USAGE": "Usage: write [file] [data]",
			"WRITE_DESCRIPTION": "Writes data to the specified file.",
			"CP_PERMISSIONS_OPTION": "--permissions: сopy the permissions of the original files",
			"REAL_TERMINAL_DEFAULT_PATH_FIELD": "Default path: %s",
			"REAL_TERMINAL_PUSHPATH_USEDESC": "pushpath [path] - Add a new path to explore to find commands.",
			"REAL_TERMINAL_RESETPATH_USEDESC": "resetpath - Reset the list of paths to explore to the default path.",
			"REAL_TERMINAL_LSPATH_USEDESC": "lspath - See the current list of paths to explore and the default path.",
			"MKDIR_USAGE": "Usage: mkdir [directory]",
			"MKDIR_DESCRIPTION": "Creates a new directory in the specified path.",
			"NEXT": "Next",
			"DESCRIBE_TEMPLATE": "Program: %s (%s)\nIntent: %s",
			"EXTRA_DESCRIBE_TEMPLATE": "Program: %s (%s)\nArguments: %s\nIntent: %s",
			"DECLINE": "Decline",
			"ACCESS_REQUEST_TITLE": "Access request",
			"REAL_TERMINAL_INTENT": "Launch commands with your permissions",
			"PERSONAL_SECURITY_INTENT": "Manage your security settings",
			"FILE_EXPLORER_INTENT": "Launch programs and open files",
			"FILE_EXPLORER_FULL_INTENT": "Browse files, launch programs, and open files",
			"CRYPTO_TOOLS_INTENT": "Perform cryptographic operations",
			"SYSTEM_SECURITY_INTENT": "Management of the system-wide user account setup",
			"FORMAT_USAGE": "Usage: format [filesystem_type] [partition] <overwrite>",
			"FORMAT_DESCRIPTION": "Prepares the selected partition for use.",
			"FORMAT_FSTYPE": "Filesystem types: pcfs (corresponds to mountpoint PCFSiDBMount), pcfs_crypt (PCFSiDBAESCryptMount), pcfs_crypt_monokey (PCFSiDBAESCryptMount), pcfs_crypt_filetable_monokey (PCFSiDBAESCryptMount), pcbm:<data_partition> (like code in boot partition), null (DELETE the partition)",
			"FORMAT_OVERWRITE_WARN": "The partition already contains data. Set the overwrite parameter to 'overwrite' to remove data anyway. In that case, ALL DATA ON THE PARTITION MAY BE REMOVED.",
			"FORMAT_UNKNOWN_FSTYPE": "Unknown target formatting",
			"LLDA_USAGE": "Usage: llda_tool [action] [parameters]",
			"LLDA_ACTION_EXPORT": "action export: [input partition] [output file]",
			"LLDA_ACTION_IMPORT": "action import: [input file] [output partition]",
			"LLDA_ACTION_COPY": "action copy: [input partition] [output partition]",
			"LLDA_ACTION_REMOVE": "action remove: [partition]",
			"LLDA_ACTION_LIST": "action list",
			"LLDA_DISCLAIMER": "When using this tool you may encounter LOSS OF DATA!",
			"LLDA_UNKNOWN_ACTION": "Unknown action",
			"INITDISK_OVERWRITE_WARN": "The system disk already contains partitioning data. Set the overwrite parameter to 'overwrite' to remove data anyway. In that case, ALL DATA ON THE DISK MAY BE REMOVED.",
			"INITDISK_USAGE": "Usage: initdisk [whatever] <overwrite>",
			"INITDISK_DESCRIPTION": "Prepares the system disk for use.",
			"MOUNT_USAGE": "Usage: mount [options] [fs_type] [mountpoint]",
			"MOUNT_DESCRIPTION": "Mounts a filesystem.",
			"MOUNT_KNOWN_FS": "Known filesystems: %s",
			"MOUNT_KNOWN_PPART": "--partition=[dataPartition] - Specify the data partition",
			"MOUNT_KNOWN_PINPA": "--interactivePassword - Ask for the password interactively",
			"MOUNT_KNOWN_PPASS": "--password=[password] - Specify the password",
			"MOUNT_KNOWN_PKEY": "--key=[hexKey] - Specify the encryption key",
			"MOUNT_KNOWN_PTYPE": "--type=[type] - For ramMount, specify type=run to create /run",
			"MOUNT_KNOWN_PURL": "--url=[URL] - Specify the URL",
			"MOUNT_KNOWN_PINPI": "--inputPipeId=[pipeId] - Specify the input pipe",
			"MOUNT_KNOWN_POUPI": "--outputPipeId=[pipeId] - Specify the output pipe",
			"MOUNTINFO_USAGE": "Usage: mountinfo [mountpoint]",
			"MOUNTINFO_DESCRIPTION": "Get information about a mountpoint.",
			"UMOUNT_USAGE": "Usage: umount <options> [mountpoint]",
			"UMOUNT_DESCRIPTION": "Unmounts a filesystem.",
			"UMOUNT_OPT_SYNCONLY": "--sync-only - Only sync the filesystem, not unmount (overrides --force)",
			"UMOUNT_OPT_FORCE": "--force - Force unmount the filesystem, do not sync",
			"CALC_TITLE": "Calculator",
			"CALC_BASIC_MODE": "Calculator: Basic mode",
			"CALC_ADVANCED_MODE": "Calculator: Advanced mode",
			"CALC_ADD": "Add",
			"CALC_SUBTRACT": "Subtract",
			"CALC_MULTIPLY": "Multiply",
			"CALC_DIVIDE": "Divide",
			"CALC_ADVMODE_BTN": "Advanced mode",
			"CALC_BASICMODE_BTN": "Basic mode",
			"CALC_OPERAND": "Operand %s",
			"CALC_TOMIXED_BTN": "Convert to mixed fraction",
			"CALC_TOIMPR_BTN": "Convert to improper fraction",
			"CALC_GCD": "GCD",
			"CALC_FACTORIAL": "Factorial",
			"CALC_GCD_PAGE": "Greatest common divisor",
			"ZKPP_OPTION": "ZKPP (Password)",
			"SECONDSTAGE_INSTALLER_INTENT": "Complete the OS configuration",
			"SETUP_FAILED": "Setting up PCOS failed. Please try again by rebooting.",
			"WARNING_PRIVILEGES": "Be careful with this feature! You may compromise system security.",
			"USER_EXT_PRIVILEGES": "Extended privilege set"
		},
		defaultLocale: "en",
		get: key => locales.en.hasOwnProperty(key) ? locales.en[key] : key
	}
	modules.locales = locales;
	modules.startupWindow.content.innerText = locales.get("PCOS_STARTING");
}
localization();
// 07-tasks.js
function loadTasks() {
	// @pcos-app-mode native
	let tasks = {
		exec: async function(file, arg, windowObject, token, silent, privateData) {
			if (modules.shuttingDown) {
				windowObject.windowDiv.remove();
				throw new Error("SYSTEM_SHUTDOWN_REQUESTED");
			}
			let appRedirecting = {};
			try {
				appRedirecting = JSON.parse(await this.fs.read(modules.defaultSystem + "/etc/appRedir", token));
			} catch {}
			if (modules.core.bootMode == "safe") appRedirecting = {};
			if (appRedirecting.hasOwnProperty(file)) file = appRedirecting[file];
			windowObject.title.innerText = modules.locales.get("UNTITLED_APP");
			let taskId = crypto.getRandomValues(new Uint8Array(64)).reduce((a, b) => a + b.toString(16).padStart(2, "0"), "");
			let executablePermissions, executable;
			try {
				executablePermissions = await this.fs.permissions(file, token);
				executable = await this.fs.read(file, token);
			} catch (e) {
				windowObject.title.innerText = modules.locales.get("APP_STARTUP_CRASH_TITLE");
				windowObject.content.innerText = modules.locales.get("APP_STARTUP_CRASH");
				windowObject.closeButton.disabled = false;
				windowObject.closeButton.onclick = (e) => windowObject.windowDiv.remove() && e.stopPropagation();
				if (silent) windowObject.windowDiv.remove();
				throw e;
			}
			if (!executablePermissions.world.includes("r") || !executablePermissions.world.includes("x")) {
				windowObject.title.innerText = modules.locales.get("PERMISSION_DENIED");
				windowObject.content.innerText = modules.locales.get("MORE_PERMISSION_DENIED");
				windowObject.closeButton.disabled = false;
				windowObject.closeButton.onclick = (e) => windowObject.windowDiv.remove() && e.stopPropagation();
				if (silent) windowObject.windowDiv.remove();
				throw new Error("MORE_PERMISSION_DENIED");
			}
			if (!executable.includes("// @pcos-app-mode isolat" + "able")) {
				windowObject.title.innerText = modules.locales.get("COMPATIBILITY_ISSUE_TITLE");
				windowObject.content.innerText = modules.locales.get("COMPATIBILITY_ISSUE");
				windowObject.closeButton.disabled = false;
				windowObject.closeButton.onclick = (e) => windowObject.windowDiv.remove() && e.stopPropagation();
				if (silent) windowObject.windowDiv.remove();
				throw new Error("COMPATIBILITY_ISSUE");
			}

			let ree = await this.ree(windowObject.content, token);
			try {
				modules.session.attrib(windowObject.sessionId, "openReeWindows", [ ...(modules.session.attrib(windowObject.sessionId, "openReeWindows") || []), taskId ]);
				arg = arg || [];
				if (!(arg instanceof Array)) arg = [];
				arg = arg.map(a => String(a));
				let that = this;
				ree.iframe.style = "width: 100%; height: 100%; border: none; top: 0; left: 0; position: absolute;";
				let reeAPIInstance = await modules.reeAPIInstance({ ree, ses: windowObject.sessionId, token, taskId, privateData });
				for (let action in reeAPIInstance.public) ree.exportAPI(action, (e) => reeAPIInstance.public[action](e.arg));
				this.tracker[taskId] = {
					ree,
					file: file,
					arg: arg,
					apis: reeAPIInstance,
					critical: false,
					cliio: {
						attached: false,
						attachedCLISignUp: _ => 0
					}
				};
				windowObject.closeButton.addEventListener("click", () => that.sendSignal(taskId, 15));
				ree.exportAPI("attachCLI", _ => true);
				ree.exportAPI("toMyCLI", _ => undefined);
				ree.exportAPI("fromMyCLI", _ => new Promise(_ => 1));
				ree.exportAPI("clearMyCLI", _ => undefined);
				ree.exportAPI("cliSize", _ => [ 0, 0 ]);
				ree.exportAPI("detachCLI", _ => true);
				ree.exportAPI("windowVisibility", (apiArg) => windowObject.windowDiv.classList.toggle("hidden", !apiArg.arg));
				ree.exportAPI("windowTitleSet", (apiArg) => windowObject.title.innerText = apiArg.arg);
				ree.exportAPI("windowResize", function(apiArg) {
					if (reeAPIInstance.public.getPrivileges().includes("GRAB_ATTENTION")) {
						windowObject.windowDiv.style.width = apiArg.arg[0] + "px";
						windowObject.windowDiv.style.height = apiArg.arg[1] + "px";
					}
				});
				ree.exportAPI("windowSize", function() {
					return {
						width: windowObject.windowDiv.clientWidth,
						height: windowObject.windowDiv.clientHeight
					}
				});
				ree.exportAPI("windowRelocate", function(apiArg) {
					if (reeAPIInstance.public.getPrivileges().includes("GRAB_ATTENTION")) {
						windowObject.windowDiv.style.top = apiArg.arg[0] + "px";
						windowObject.windowDiv.style.left = apiArg.arg[1] + "px";
					}
				});
				ree.exportAPI("windowFullscreen", function(apiArg) {
					if (reeAPIInstance.public.getPrivileges().includes("GRAB_ATTENTION")) windowObject.windowDiv.classList.toggle("fullscreen", apiArg.arg);
				});
				ree.exportAPI("closeability", (apiArg) => windowObject.closeButton.classList.toggle("hidden", !apiArg.arg));
				ree.exportAPI("critical", function(apiArg) {
					if (reeAPIInstance.public.getPrivileges().includes("SYSTEM_STABILITY")) that.tracker[taskId].critical = !!apiArg.arg;
				});
				await ree.eval("taskId = " + JSON.stringify(taskId) + ";");
				await ree.eval("exec_args = " + JSON.stringify(arg) + ";");
				ree.beforeCloseDown(function() {
					let orw = modules.session.attrib(windowObject.sessionId, "openReeWindows");
					orw.splice(orw.indexOf(taskId), 1);
					modules.session.attrib(windowObject.sessionId, "openReeWindows", orw);
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
				if (silent) windowObject.windowDiv.remove();
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
		waitTermination: async function(taskId) {
			if (!this.tracker.hasOwnProperty(taskId)) return;
			return new Promise((resolve) => this.tracker[taskId].ree.beforeCloseDown(() => resolve()));
		},
		taskInfo: async function(taskId) {
			if (!this.tracker.hasOwnProperty(taskId)) return null;
			let info = await modules.tokens.info(this.tracker[taskId].apis.public.getProcessToken());
			if (!info) info = { user: taskId.slice(0, 16) };
			return {
				file: this.tracker[taskId].file,
				arg: this.tracker[taskId].arg,
				runBy: info.user,
				cliio: false
			}
		},
		tracker: {},
		fs: modules.fs,
		ree: modules.core.createREE
	};
	
	modules.tasks = tasks;
}
loadTasks();
// 09-logout.js
async function logOut(target) {
	let liu = modules.liu;
	let session = liu[target].session;
	let token = liu[target].logon.token;
	clearInterval(liu[target].clockInterval);
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
	delete modules.liu[target];
	await modules.tokens.revoke(token);
	await modules.session.rmsession(session);
}

modules.logOut = logOut;
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
		modules.shuttingDown = true;
		let window = modules.window;
		let fs = modules.fs;
		let tasks = modules.tasks;
		modules.session.muteAllSessions();
		modules.session.activateSession(modules.session.systemSession);
		let windowDiv = window(modules.session.systemSession, true);
		windowDiv.closeButton.classList.toggle("hidden", true);
		windowDiv.title.innerText = modules.locales.get("PCOS_RESTARTING").replace("%s", "");
		windowDiv.content.style.padding = "8px";
		let description = document.createElement("p");
		description.innerText = modules.locales.get("PCOS_RESTARTING").replace("%s", modules.locales.get("PLEASE_WAIT"));
		windowDiv.content.appendChild(description);
		description.innerText = modules.locales.get("PCOS_RESTARTING").replace("%s", modules.locales.get("POLITE_CLOSE_SIGNAL"));
		for (let taskId in tasks.tracker) tasks.sendSignal(taskId, 15);
		await Promise.race([
			timeout(5000),
			allProcessesClosed()
		]);
		try {
			modules.websocket._handles[(await modules.fs.read("ram/run/network.ws"))].ws.send(JSON.stringify({
				finalProxyPacket: true
			}));
		} catch {}
		description.innerText = modules.locales.get("PCOS_RESTARTING").replace("%s", modules.locales.get("ABRUPT_CLOSE_SIGNAL"));
		for (let taskId in tasks.tracker) tasks.sendSignal(taskId, 9, true);
		await allProcessesClosed();
		try {
			let networkWS = await modules.fs.read("ram/run/network.ws");
			modules.websocket._handles[networkWS].ws.onclose = null;
			modules.websocket._handles[networkWS].ws.close();
			delete modules.websocket._handles[networkWS];
			await modules.fs.rm("ram/run/network.ws");
		} catch {}
		description.innerText = modules.locales.get("PCOS_RESTARTING").replace("%s", modules.locales.get("UNMOUNTING_MOUNTS"));
		for (let mount in fs.mounts) await fs.unmount(mount, token);
		description.innerText = modules.locales.get("PCOS_RESTARTING").replace("%s", modules.locales.get("RESTARTING"));
		modules.killSystem();
		if (!noAutomaticReload) return location.reload()
		description.innerText = modules.locales.get("SAFE_TO_CLOSE");
		let button = document.createElement("button");
		button.innerText = modules.locales.get("RESTART_BUTTON");
		button.onclick = function() {
			description.innerText = modules.locales.get("PCOS_RESTARTING").replace("%s", modules.locales.get("RESTARTING"));
			button.remove();
			location.reload();
		}
		windowDiv.content.appendChild(button);
	}
	
	modules.restart = restart;
}

restartLoad();
// 10-installer.js
async function installer() {
	// @pcos-app-mode native
	let window = modules.window;
	let windowDiv = window(modules.session.active);
	let token = await modules.tokens.generate();
	await modules.tokens.userInitialize(token, "root");
	await modules.tasks.exec(modules.defaultSystem + "/apps/installer.js", [], windowDiv, token, false);
}

async function prepare4Running(currentDir = "", targetMount = "installer") {
	let dirList = await modules.fs.ls(modules.defaultSystem + currentDir);
	if (currentDir != "") await modules.fs.mkdir(targetMount + currentDir);
	for (let fileIndex in dirList) {
		let file = dirList[fileIndex];
		let permissions = await modules.fs.permissions(modules.defaultSystem + currentDir + "/" + file);
		if (await isDirectory(modules.defaultSystem + currentDir + "/" + file)) await prepare4Running(currentDir + "/" + file, targetMount);
		else await modules.fs.write(targetMount + currentDir + "/" + file, await modules.fs.read(modules.defaultSystem + currentDir + "/" + file));
		await modules.fs.chown(targetMount + currentDir + "/" + file, permissions.owner);
		await modules.fs.chgrp(targetMount + currentDir + "/" + file, permissions.group);
		await modules.fs.chmod(targetMount + currentDir + "/" + file, permissions.world);
	}
}
let isDirectory = (path) => modules.fs.isDirectory(path);

async function setupbase() {
	let _generated = null;
	let appFns = [ authuiInstaller, consentuiInstaller, explorerInstaller, filePickerInstaller, installerInstaller, secondstageInstaller, textEditorInstaller ];
	let appFnCode = appFns.map(a => a.toString()).join("\n");
	let fsmount = {
		read: async function (key) {
			let pathParts = key.split("/");
			if (pathParts[0] == "") pathParts = pathParts.slice(1);
			let files = this.backend.files;
			for (let part of pathParts) {
				files = files[part];
				if (!files) throw new Error("NO_SUCH_FILE");
			}
			if (typeof files === "object") throw new Error("IS_A_DIR");
			return files;
		},
		ls: async function (directory) {
			let pathParts = directory.split("/");
			if (pathParts[0] == "") pathParts = pathParts.slice(1);
			let files = this.backend.files;
			for (let part of pathParts) {
				files = files[part];
				if (!files) throw new Error("NO_SUCH_DIR");
			}
			if (typeof files !== "object") throw new Error("IS_A_FILE");
			return Object.keys(files);
		},
		permissions: async function (file) {
			return this.backend.permissions[file] || {
				owner: "root",
				group: "root",
				world: "",
			};
		},
		isDirectory: function(key) {
			let pathParts = key.split("/").slice(0, -1);
			if (pathParts[0] == "") pathParts = pathParts.slice(1);
			if (pathParts[pathParts.length - 1] == "") pathParts = pathParts.slice(0, -1);
			let basename = key.split("/").slice(-1)[0];
			let files = this.backend.files;
			for (let part of pathParts) {
				files = files[part];
				if (!files) throw new Error("NO_SUCH_DIR");
			}
			if (!files.hasOwnProperty(basename)) throw new Error("NO_SUCH_FILE_DIR");
			if (typeof files[basename] === "object") return true;
			return false;
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
							},
							authui: {
								groups: [ "authui" ],
								securityChecks: [],
								homeDirectory: "installer"
							}
						}),
						automaticLogon: "root"
					} 
				},
				boot: {
					"00-pcos.js": "// @pcos-app-mode native\nconst pcos_version = " + JSON.stringify(modules.pcos_version) + ";\n\nlet modules = {\n     core: coreExports\n};\nglobalThis.modules = modules;\nmodules.pcos_version = pcos_version;\n" + panic.toString() + "\n" + startupMemo.toString() + "\nstartupMemo();\n",
					"01-fs.js": loadFs.toString() + "\n" + sampleFormatToEncryptedPCFS.toString() + "\nloadFs();\n",
					"01-fsboot.js": "/* no-op */",
					"01-setup-state.js": "modules.settingUp = true;\n",
					"02-ui.js": loadUi.toString() + "\nloadUi();\n",
					"04-ipc.js": loadIpc.toString() + "\nloadIpc();\n",
					"04-websockets.js": loadWebsocketSupport.toString() + "\nloadWebsocketSupport();\n",
					"05-reeapis.js": reeAPIs.toString() + "\nreeAPIs();\n",
					"06-csp.js": loadBasicCSP.toString() + "\nloadBasicCSP();\n",
					"06-locales.js": localization.toString() + "\nlocalization();\n",
					"07-tasks.js": loadTasks.toString() + "\nloadTasks();\n",
					"09-logout.js": logOut.toString() + "\nmodules.logOut = logOut;\n",
					"09-restart.js": restartLoad.toString() + "\nrestartLoad();\n",
					"11-userfriendliness.js": loadUserFriendly.toString() + "\nloadUserFriendly();\n",
					"12-tokens.js": setupTokens.toString() + "\nsetupTokens();\n",
					"12-users.js": setupUsers.toString() + "\nawait setupUsers();\n",
					"13-authui.js": authui.toString() + "\nmodules.authui = authui;\n",
					"13-consentui.js": consentui.toString() + "\nmodules.consentui = consentui;\n",
					"14-logon-requirement.js": requireLogon.toString() + "\n" + waitForLogon.toString() + "\n" + hookButtonClick.toString() + "\n" + serviceLogon.toString() + "\n",
					"14-logon-requirement-enforce.js": "/* no-op */",
					"15-apps.js": appFnCode + "\n",
					"17-installer-secondstage.js": secondstage.toString() + "\nsecondstage();\n",
					"99-finished.js": systemKillWaiter.toString() + "\nreturn await systemKillWaiter();"
				},
				root: {}
			},
			permissions: {
				"": {
					owner: "root",
					group: "root",
					world: "rx"
				},
				"boot": {
					owner: "root",
					group: "root",
					world: "rx"
				},
				"etc": {
					owner: "root",
					group: "root",
					world: "rx"
				},
				"etc/security": {
					owner: "root",
					group: "root",
					world: ""
				},
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
	modules.fs.mounts["roinstaller"] = fsmount;
	modules.defaultSystem = "roinstaller";
	modules.fs.mounts.installer = modules.mounts.ramMount({});
	await prepare4Running();
	await installerInstaller("installer");
	fsmount = null;
	delete modules.fs.mounts["roinstaller"];
	modules.defaultSystem = "installer";
	installer();
}

setupbase();
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
		removePrivileges: async function(token, privileges) {
			this._tokens[token].privileges = this._tokens[token].privileges.filter(x => !privileges.includes(x));
		},
		userInitialize: async function(token, user) {
			this._tokens[token].user = user;
			this._tokens[token].groups = (await modules.users.getUserInfo(user, token)).groups || [];
			this._tokens[token].privileges = ["FS_READ", "FS_WRITE", "FS_REMOVE", "FS_CHANGE_PERMISSION", "FS_LIST_PARTITIONS", "IPC_CREATE_PIPE", "IPC_LISTEN_PIPE", "IPC_SEND_PIPE", "IPC_CHANGE_PERMISSION", "ELEVATE_PRIVILEGES", "GET_USER_INFO", "SET_SECURITY_CHECKS", "START_TASK", "LIST_TASKS", "SIGNAL_TASK", "FETCH_SEND", "CSP_OPERATIONS", "IDENTIFY_SYSTEM", "WEBSOCKETS_OPEN", "WEBSOCKETS_LISTEN", "WEBSOCKETS_SEND", "WEBSOCKET_SET_PERMISSIONS", "MANAGE_TOKENS", "WEBSOCKET_INFO", "GRAB_ATTENTION", "CLI_MODIFICATIONS", "GET_THEME", "GET_LOCALE", "GET_FILESYSTEMS", "GET_BUILD", "GET_SERVER_URL", "START_BACKGROUND_TASK", "GET_BOOT_MODE", "GET_SCREEN_INFO", "PCOS_NETWORK_PING", "LOGOUT"];
			this._tokens[token].privileges.push(...((await modules.users.getUserInfo(user, token)).additionalPrivilegeSet || []));
			if (user == "root") this._tokens[token].privileges.push("FS_UNMOUNT", "SYSTEM_SHUTDOWN", "SWITCH_USERS_AUTOMATICALLY", "USER_INFO_OTHERS", "SET_USER_INFO", "FS_BYPASS_PERMISSIONS", "IPC_BYPASS_PERMISSIONS", "TASK_BYPASS_PERMISSIONS", "SENSITIVE_USER_INFO_OTHERS", "SYSTEM_STABILITY", "RUN_KLVL_CODE", "IDENTIFY_SYSTEM_SENSITIVE", "WEBSOCKET_BYPASS_PERMISSIONS", "LLDISK_READ", "LLDISK_WRITE", "LLDISK_LIST_PARTITIONS", "LLDISK_REMOVE", "LLDISK_IDB_READ", "LLDISK_IDB_WRITE", "LLDISK_IDB_REMOVE", "LLDISK_IDB_LIST", "LLDISK_IDB_SYNC", "FS_MOUNT", "SET_DEFAULT_SYSTEM", "GET_SYSTEM_RESOURCES", "LLDISK_INIT_PARTITIONS", "LOGOUT_OTHERS");
		},
		halfInitialize: async function(token, user) {
			this._tokens[token].user = user;
			this._tokens[token].groups = (await modules.users.getUserInfo(user, token)).groups || [];
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
					challenge: currentPrompt.challenge,
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
		if (!modules.settingUp) await panic("USER_SYSTEM_CORRUPTED", {
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
			},
			authui: {
				securityChecks: [],
				groups: ["authui"],
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
		configured: async function(token) {
			try {
				JSON.parse(await modules.fs.read(modules.defaultSystem + "/etc/security/users"), token);
				return true;
			} catch {
				return false;
			}
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
async function authui(ses = modules.session.active, user, token, isLogonScreen) {
	// @pcos-app-mode native
	if (modules.shuttingDown) return { hook: _ => _ };
	let appToken;
	if (token) appToken = modules.tokens.fork(token);
	else {
		appToken = await modules.tokens.generate();
		await modules.tokens.userInitialize(appToken, "authui");
	}
	let hook = new Function();
	let ipc = await modules.ipc.create();
	modules.ipc.declareAccess(ipc, { owner: "authui", group: "authui", world: false });
	let windowObject = modules.window(ses);
	let authTask = await modules.tasks.exec(modules.defaultSystem + "/apps/authui.js", [ ipc, user || "" ], windowObject, appToken);
	if (isLogonScreen) windowObject.closeButton.classList.toggle("hidden", true);
	async function waitForIt() {
		let msg = await modules.ipc.listenFor(ipc);
		delete modules.ipc._ipc[ipc];
		await modules.tasks.sendSignal(authTask, 9);
		hook(msg);
	}
	waitForIt();
	return { hook: (e) => hook = e };
}
modules.authui = authui;
// 13-consentui.js
async function consentui(ses = modules.session.active, config, token, isLogonScreen) {
	// @pcos-app-mode native
	if (modules.shuttingDown) return { hook: _ => _ };
	let appToken;
	if (token) appToken = modules.tokens.fork(token);
	else {
		appToken = await modules.tokens.generate();
		await modules.tokens.userInitialize(appToken, "authui");
	}
	let hook = new Function();
	let ipc = await modules.ipc.create();
	modules.ipc.declareAccess(ipc, { owner: "authui", group: "authui", world: false });
	let windowObject = modules.window(ses);
	let authTask = await modules.tasks.exec(modules.defaultSystem + "/apps/consentui.js", [ ipc, config.user || "", JSON.stringify({ path: config.path, args: config.args, submittedIntent: config.intent, submittedName: config.name }) ], windowObject, appToken);
	if (isLogonScreen) windowObject.closeButton.classList.toggle("hidden", true);
	async function waitForIt() {
		let msg = await modules.ipc.listenFor(ipc);
		delete modules.ipc._ipc[ipc];
		await modules.tasks.sendSignal(authTask, 9);
		hook(msg);
	}
	waitForIt();
	return { hook: (e) => hook = e };
}
modules.consentui = consentui;
// 14-logon-requirement.js
async function requireLogon() {
	// @pcos-app-mode native
	try {
		let startupSoundPerm = await modules.fs.permissions(modules.defaultSystem + "/etc/sounds/startup.aud");
		if (!startupSoundPerm.world.includes("r")) throw new Error("Not allowed to read startup.aud");
		let startupSound = await modules.fs.read(modules.defaultSystem + "/etc/sounds/startup.aud");
		let startupAudio = new Audio();
		startupAudio.src = startupSound;
		startupAudio.play();
	} catch (e) {
		console.error(e);
	}
	let liu = {};
	modules.liu = liu;
	serviceLogon();
	let insertedLockMessage = false;
	while (!modules.shuttingDown) {
		let useDefaultUser = await modules.fs.permissions(modules.defaultSystem + "/etc/security/automaticLogon");
		useDefaultUser = !useDefaultUser.world.includes("w") && useDefaultUser.owner == "root" && useDefaultUser.group == "root";
		let defaultUser;
		try {
			if (useDefaultUser) defaultUser = await modules.fs.read(modules.defaultSystem + "/etc/security/automaticLogon");
		} catch {}
		let sysDom = modules.session.tracker[modules.session.systemSession].html;
		let lockWallpaper = "";
		let lockIsDark = false;
		try {
			lockWallpaper = await modules.fs.read(modules.defaultSystem + "/etc/wallpapers/lockscreen.pic");
		} catch (e) {
			console.error(e);
		}
		try {
			lockIsDark = (await modules.fs.read(modules.defaultSystem + "/etc/darkLockScreen")) == "true";
		} catch (e) {
			console.error(e);
		}
		if (modules.core.bootMode == "safe") {
			lockIsDark = true;
			lockWallpaper = "";
			if (!insertedLockMessage) {
				insertedLockMessage = true;
				let message = document.createElement("span");
				message.innerText = modules.locales.get("SAFE_MODE_MSG");
				message.style = "position: absolute; right: 8px; bottom: 8px; color: white;";
				sysDom.appendChild(message);
				let message2 = document.createElement("span");
				message2.innerText = modules.locales.get("SAFE_MODE_MSG");
				message2.style = "position: absolute; top: 8px; left: 8px; color: white;";
				sysDom.appendChild(message2);
			}
		}
		sysDom.style.background = "url(" + JSON.stringify(lockWallpaper) + ")";
		if (modules.core.bootMode == "safe") sysDom.style.background = "black";
		sysDom.style.backgroundSize = "100% 100%";
		modules.session.attrib(modules.session.systemSession, "dark", lockIsDark);
		let logon, resolvedLogon;
		while (!modules.shuttingDown) {
			logon = await modules.authui(modules.session.systemSession, defaultUser, undefined, true);
			resolvedLogon = await waitForLogon(logon);
			if (resolvedLogon.success) break;
		}
		if (!resolvedLogon.success) break;
		modules.session.muteAllSessions();
		let userInfo = await modules.tokens.info(resolvedLogon.token);
		let session;
		let liuUser = userInfo.user;
		let wasLiuLoaded = false;
		if (liu.hasOwnProperty(userInfo.user)) {
			session = liu[userInfo.user].session;
			await modules.tokens.revoke(resolvedLogon.token);
			resolvedLogon = liu[userInfo.user].logon;
			userInfo = await modules.tokens.info(resolvedLogon.token);
			wasLiuLoaded = true;
		} else {
			session = modules.session.mksession();
			liu[userInfo.user] = {
				session,
				logon: resolvedLogon,
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
		if (modules.core.bootMode == "safe") {
			isDark = true;
			if (!wasLiuLoaded) {
				let message = document.createElement("span");
				message.innerText = modules.locales.get("SAFE_MODE_MSG");
				message.style = "position: absolute; right: 8px; bottom: 8px; color: white;";
				dom.appendChild(message);
				let message2 = document.createElement("span");
				message2.innerText = modules.locales.get("SAFE_MODE_MSG");
				message2.style = "position: absolute; top: 8px; left: 8px; color: white;";
				dom.appendChild(message2);
			}
			bgPic = "";
		}
		modules.session.attrib(session, "dark", isDark);
		dom.style.background = "url(" + JSON.stringify(bgPic) + ")";
		if (modules.core.bootMode == "safe") dom.style.background = "black";
		dom.style.backgroundSize = "100% 100%";
		async function logOut() {
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
		let autoRunNecessities = [];
		let autorunNecessityFailure = false;
		try {
			let autoRunPermissions = await modules.fs.permissions((await modules.users.getUserInfo(userInfo.user)).homeDirectory + "/.autorunNecessity", resolvedLogon.token);
			if (autoRunPermissions.owner != userInfo.user && !userInfo.groups.includes(autoRunPermissions.group) && !(autoRunPermissions.world.includes("r") && autoRunPermissions.world.includes("x")) && !userInfo.privileges.includes("FS_BYPASS_PERMISSIONS")) {
				throw new Error("Permission denied reading autorun necessities");
			}
			if (modules.core.bootMode != "safe") autoRunNecessities = await modules.fs.ls((await modules.users.getUserInfo(userInfo.user)).homeDirectory + "/.autorunNecessity", resolvedLogon.token);
		} catch (e) {
			console.error(e);
		}
		function breakNecessityFailure() {
			let failureMessage = modules.window(session);
			autorunNecessityFailure = true;
			failureMessage.title.innerText = modules.locales.get("PERMISSION_DENIED");
			failureMessage.content.style.padding = "8px";
			failureMessage.content.innerText = modules.locales.get("AUTORUN_NECESSITIES_FAILED");
			failureMessage.closeButton.onclick = async function() {
				failureMessage.windowDiv.remove();
				logOut();
			}
		}
		for (let autoRunNecessity of autoRunNecessities) {
			let necessityPermissions = await modules.fs.permissions((await modules.users.getUserInfo(userInfo.user)).homeDirectory + "/.autorunNecessity/" + autoRunNecessity, resolvedLogon.token);
			if (necessityPermissions.owner != userInfo.user && !userInfo.groups.includes(necessityPermissions.group) && !(necessityPermissions.world.includes("r") && necessityPermissions.world.includes("x")) && !userInfo.privileges.includes("FS_BYPASS_PERMISSIONS")) {
				breakNecessityFailure();
				break;
			}
			let link = await modules.fs.read((await modules.users.getUserInfo(userInfo.user)).homeDirectory + "/.autorunNecessity/" + autoRunNecessity, resolvedLogon.token);
			try {
				link = JSON.parse(link);
			} catch (e) {
				console.error(e);
				breakNecessityFailure();
				break;
			}
			if (link.disabled) continue;
			try {
				let ipcPipe = modules.ipc.create();
				modules.ipc.declareAccess(ipcPipe, {
					owner: userInfo.user,
					group: userInfo.groups[0],
					world: false
				});
				let forkedToken = await modules.tokens.fork(resolvedLogon.token);
				let appWindow = modules.window(session);
				let ipcResult = modules.ipc.listenFor(ipcPipe);
				let taskId = await modules.tasks.exec(link.path, [ ...(link.args || []), ipcPipe ], appWindow, forkedToken, true);
				let finishTaskPromise = new Promise(function(resolve) {
					modules.tasks.tracker[taskId].ree.beforeCloseDown(() => resolve());
				})
				ipcResult = await Promise.race([ipcResult, finishTaskPromise]);
				if (!ipcResult) throw new Error("Software rejected autorun necessity.");
				if (modules.tasks.tracker.hasOwnProperty(taskId)) await modules.tasks.sendSignal(taskId, 9);
			} catch (e) {
				console.error(e);
				breakNecessityFailure();
				break;
			}
		}
		
		let autoRun = [];
		try {
			let autoRunPermissions = await modules.fs.permissions((await modules.users.getUserInfo(userInfo.user)).homeDirectory + "/.autorun", resolvedLogon.token);
			if (autoRunPermissions.owner != userInfo.user && !userInfo.groups.includes(autoRunPermissions.group) && !(autoRunPermissions.world.includes("r") && autoRunPermissions.world.includes("x")) && !userInfo.privileges.includes("FS_BYPASS_PERMISSIONS")) {
				throw new Error("Permission denied reading autorun");
			}
			if (modules.core.bootMode != "safe" && !autorunNecessityFailure) autoRun = await modules.fs.ls((await modules.users.getUserInfo(userInfo.user)).homeDirectory + "/.autorun", resolvedLogon.token);
		} catch (e) {
			console.error(e);
		}
		for (let autoRunFile of autoRun) {
			let autoRunItemPermissions = await modules.fs.permissions((await modules.users.getUserInfo(userInfo.user)).homeDirectory + "/.autorun/" + autoRunFile, resolvedLogon.token);
			if (autoRunItemPermissions.owner != userInfo.user && !userInfo.groups.includes(autoRunItemPermissions.group) && !(autoRunItemPermissions.world.includes("r") && autoRunItemPermissions.world.includes("x")) && !userInfo.privileges.includes("FS_BYPASS_PERMISSIONS")) continue;
			let link = await modules.fs.read((await modules.users.getUserInfo(userInfo.user)).homeDirectory + "/.autorun/" + autoRunFile, resolvedLogon.token);
			try {
				link = JSON.parse(link);
			} catch {}
			if (link.disabled) continue;
			try {
				let forkedToken = await modules.tokens.fork(resolvedLogon.token);
				let appWindow = modules.window(session);
				await modules.tasks.exec(link.path, [ ...(link.args || []) ], appWindow, forkedToken);
			} catch {}
		}
		let startButton = document.createElement("button");
		startButton.innerText = modules.locales.get("START_MENU_BTN");
		startButton.style = "padding: 4px;";
		startButton.onclick = async function() {
			let startMenu = modules.window(session);
			startMenu.title.innerText = modules.locales.get("START_MENU");
			startMenu.content.style.padding = "8px";
			startMenu.closeButton.onclick = () => startMenu.windowDiv.remove();
			let logoutButton = document.createElement("button");
			logoutButton.innerText = modules.locales.get("LOG_OUT_BUTTON").replace("%s", userInfo.user);
			startMenu.content.appendChild(logoutButton);
			logoutButton.onclick = function() {
				startMenu.windowDiv.remove();
				logOut();
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
					if (appLink.disabled) continue;
					let appBtn = document.createElement("button");
					appBtn.innerText = (appLink.localeReferenceName ? modules.locales.get(appLink.localeReferenceName) : null) || (appLink.localeDatabaseName ? (appLink.localeDatabaseName[navigator.language.slice(0, 2).toLowerCase()] || appLink.localeDatabaseName[modules.locales.defaultLocale]) : null) || appLink.name;
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
					if (appLink.disabled) continue;
					let appBtn = document.createElement("button");
					appBtn.innerText = (appLink.localeReferenceName ? modules.locales.get(appLink.localeReferenceName) : null) || (appLink.localeDatabaseName ? (appLink.localeDatabaseName[navigator.language.slice(0, 2).toLowerCase()] || appLink.localeDatabaseName[modules.locales.defaultLocale]) : null) || appLink.name;
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
		if (!wasLiuLoaded && !autorunNecessityFailure) {
			let taskbar = document.createElement("div");
			let clock = document.createElement("span");
			taskbar.className = "taskbar";
			clock.className = "clock";

			liu[liuUser].clockInterval = setInterval(function() {
				clock.innerText = new Date().toTimeString().split(" ")[0];
			}, 500);
			
			taskbar.appendChild(startButton);
			taskbar.appendChild(clock);
			dom.appendChild(taskbar);
		}
		if (useDefaultUser && defaultUser) {
			let newWindow = modules.window(modules.session.systemSession);
			newWindow.title.innerText = modules.locales.get("LOG_IN_INVITATION");
			let button = document.createElement("button");
			button.innerText = modules.locales.get("LOG_IN_INVITATION");
			newWindow.content.appendChild(button);
			newWindow.closeButton.classList.toggle("hidden", true);
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
async function serviceLogon() {
	let session = modules.session.mksession();
	modules.session.attrib(session, "dark", true);
	let dom = modules.session.tracker[session].html;
	dom.style.backgroundColor = "black";
	let message = document.createElement("span");
	message.innerText = "Service Desktop";
	message.style = "position: absolute; right: 8px; bottom: 8px; color: white;";
	dom.appendChild(message);
	let startButton = document.createElement("button");
	startButton.innerText = modules.locales.get("START_MENU_BTN");
	startButton.style = "padding: 4px;";
	startButton.onclick = async function() {
		let startMenu = modules.window(session);
		startMenu.title.innerText = modules.locales.get("START_MENU");
		startMenu.content.style.padding = "8px";
		startMenu.closeButton.onclick = () => startMenu.windowDiv.remove();
		let lockButton = document.createElement("button");
		lockButton.innerText = modules.locales.get("LOCK_BUTTON");
		startMenu.content.appendChild(lockButton);
		lockButton.onclick = async function() {
			startMenu.windowDiv.remove();
			await modules.session.muteAllSessions();
			await modules.session.activateSession(modules.session.systemSession);
		}
	}
	let taskbar = document.createElement("div");
	let clock = document.createElement("span");
	taskbar.className = "taskbar";
	clock.className = "clock";

	setInterval(function() {
		clock.innerText = new Date().toTimeString().split(" ")[0];
	}, 500);

	taskbar.appendChild(startButton);
	taskbar.appendChild(clock);
	dom.appendChild(taskbar);
	modules.serviceSession = session;
	if (modules.core.bootMode != "safe") {
		let seedToken = await modules.tokens.generate();
		await modules.tokens.userInitialize(seedToken, "root");
		let serviceList = [],
			servicePrms;
		try {
			servicePrms = await modules.fs.permissions(modules.defaultSystem + "/apps/services", seedToken);
		} catch (e) {
			console.error("Failed to get permissions for service list:", e);
			return;
		}
		if (servicePrms.world.includes("w") || servicePrms.owner !== "root" || servicePrms.group !== "root") return console.error("Too free permissions for service list.");
		try {
			serviceList = await modules.fs.ls(modules.defaultSystem + "/apps/services", seedToken);
		} catch (e) {
			console.error("Failed to list services:", e);
		}
		for (let service of serviceList) {
			let serviceConfig;
			try {
				serviceConfig = await modules.fs.read(modules.defaultSystem + "/apps/services/" + service, seedToken);
				serviceConfig = JSON.parse(serviceConfig);
			} catch (e) {
				console.error("Failed to read service config of", service, ":", e);
				continue;
			}
			if (serviceConfig.disabled) continue;
			let forkedToken = await modules.tokens.fork(seedToken);
			if (serviceConfig.runAs) await modules.tokens.userInitialize(forkedToken, serviceConfig.runAs);
			let serviceName = (serviceConfig.localeReferenceName ? modules.locales.get(serviceConfig.localeReferenceName) : null) || (serviceConfig.localeDatabaseName ? (serviceConfig.localeDatabaseName[navigator.language.slice(0, 2).toLowerCase()] || serviceConfig.localeDatabaseName[modules.locales.defaultLocale]) : null) || serviceConfig.name;
			try {
				await modules.tasks.exec(serviceConfig.path, [ ...(serviceConfig.args || []) ], modules.window(session), forkedToken, true);
			} catch (e) {
				console.error("Failed to start service", serviceName, "(", service, "):", e);
			}
		}
	}
}
// 15-apps.js
// App installers are dynamically created, see os_system/combine_into_index/apps/ for apps!// ../apps/authui.js
			async function authuiInstaller(target, token) {
				let neededApps = await modules.fs.ls(target + "/", token);
				if (!neededApps.includes("apps")) await modules.fs.mkdir(target + "/apps", token);
				await modules.fs.chown(target + "/apps", "root", token);
				await modules.fs.chgrp(target + "/apps", "root", token);
				await modules.fs.chmod(target + "/apps", "rx", token);
				let appPath = target + "/apps/authui.js";
				await modules.fs.write(appPath, "let ipc = exec_args[0];\n(async function() {\n\t// @pcos-app-mode isolatable\n\tif (!ipc) return availableAPIs.terminate();\n\tlet user = exec_args[1];\n\tawait availableAPIs.windowTitleSet(await availableAPIs.lookupLocale(\"LOG_IN_INVITATION\"));\n\tlet checklist = [ \"IPC_SEND_PIPE\", \"GET_LOCALE\", \"GET_THEME\", \"ELEVATE_PRIVILEGES\", \"CSP_OPERATIONS\" ];\n\tlet privileges = await availableAPIs.getPrivileges();\n\tif (!checklist.every(p => privileges.includes(p))) {\n\t\tif (privileges.includes(\"IPC_SEND_PIPE\")) await availableAPIs.sendToPipe({ pipe: ipc, data: { success: false, cancelled: false } });\n\t\treturn availableAPIs.terminate();\n\t}\n\tdocument.body.style.fontFamily = \"'Segoe UI', Tahoma, Geneva, Verdana, sans-serif\";\n\tif (await availableAPIs.isDarkThemed()) document.body.style.color = \"white\";\n\tlet describe = document.createElement(\"b\");\n\tlet form = document.createElement(\"form\");\n\tlet input = document.createElement(\"input\");\n\tlet submit = document.createElement(\"button\");\n\tdocument.body.appendChild(describe);\n\tdocument.body.appendChild(document.createElement(\"br\"));\n\tdocument.body.appendChild(form);\n\tform.appendChild(input);\n\tform.appendChild(submit);\n\tsubmit.innerText = await availableAPIs.lookupLocale(\"ENTER_BUTTON\");\n\tdescribe.innerText = await availableAPIs.lookupLocale(\"USERNAME_PROMPT\");\n\tinput.placeholder = await availableAPIs.lookupLocale(\"USERNAME\");\n\tasync function userSubmit(e) {\n\t\te.stopImmediatePropagation();\n\t\te.preventDefault();\n\t\te.stopPropagation();\n\t\tlet userLogonSession;\n\t\tlet userLogonID;\n\t\tlet desired_username = input.value;\n\t\ttry {\n\t\t\tuserLogonID = await availableAPIs.automatedLogonCreate({ desiredUser: desired_username });\n\t\t\tuserLogonSession = await availableAPIs.automatedLogonGet(userLogonID);\n\t\t} catch {\n\t\t\tdescribe.innerText = await availableAPIs.lookupLocale(\"AUTH_FAILED\") + \" \" + await availableAPIs.lookupLocale(\"USERNAME_PROMPT\");\n\t\t\tinput.placeholder = await availableAPIs.lookupLocale(\"USERNAME\");\n\t\t\tinput.type = \"text\";\n\t\t\tinput.disabled = !!user;\n\t\t\tsubmit.disabled = false;\n\t\t\tinput.value = user || \"\";\n\t\t\tsubmit.addEventListener(\"click\", userSubmit);\n\t\t\treturn;\n\t\t}\n\t\tasync function updateProgress() {\n\t\t\tsubmit.removeEventListener(\"click\", userSubmit);\n\t\t\tinput.value = \"\";\n\t\t\tsubmit.innerText = await availableAPIs.lookupLocale(\"ENTER_BUTTON\");\n\t\t\tif (userLogonSession.success != \"intermediate\") await availableAPIs.automatedLogonDelete(userLogonID);\n\t\t\tif (userLogonSession.success == true) {\n\t\t\t\tawait availableAPIs.sendToPipe({ pipe: ipc, data: userLogonSession });\n\t\t\t\tawait availableAPIs.terminate();\n\t\t\t}\n\t\t\tif (userLogonSession.success == false) {\n\t\t\t\tdescribe.innerText = await availableAPIs.lookupLocale(\"AUTH_FAILED\") + \" \" + await availableAPIs.lookupLocale(\"USERNAME_PROMPT\");\n\t\t\t\tinput.placeholder = await availableAPIs.lookupLocale(\"USERNAME\");\n\t\t\t\tinput.type = \"text\";\n\t\t\t\tinput.disabled = !!user;\n\t\t\t\tsubmit.disabled = false;\n\t\t\t\tinput.value = user || \"\";\n\t\t\t\tsubmit.addEventListener(\"click\", userSubmit);\n\t\t\t\treturn;\n\t\t\t}\n\t\t\tdescribe.innerText = \"[\" + desired_username + \"] \" + userLogonSession.message;\n\t\t\tinput.placeholder = await availableAPIs.lookupLocale(\"RESPONSE_PLACEHOLDER\");\n\t\t\tinput.type = userLogonSession.type == \"password\" ? \"password\" : \"text\";\n\t\t\tinput.disabled = !userLogonSession.wantsUserInput;\n\t\t\tsubmit.disabled = !userLogonSession.wantsUserInput;\n\t\t\tif (userLogonSession.type == \"promise\") {\n\t\t\t\ttry {\n\t\t\t\t\tinput.disabled = true;\n\t\t\t\t\tsubmit.disabled = true;\n\t\t\t\t\tawait availableAPIs.automatedLogonInput({ session: userLogonID });\n\t\t\t\t\tuserLogonSession = await availableAPIs.automatedLogonGet(userLogonID);\n\t\t\t\t} catch {}\n\t\t\t\treturn await updateProgress();\n\t\t\t}\n\t\t\tif (userLogonSession.type == \"informative\") {\n\t\t\t\tinput.disabled = true;\n\t\t\t\tsubmit.disabled = false;\n\t\t\t\tsubmit.innerText = \"OK\";\n\t\t\t\tinput.placeholder = \"--->\";\n\t\t\t}\n\t\t\tsubmit.addEventListener(\"click\", async function updater(e) {\n\t\t\t\te.stopImmediatePropagation();\n\t\t\t\tsubmit.removeEventListener(\"click\", updater);\n\t\t\t\te.preventDefault();\n\t\t\t\te.stopPropagation();\n\t\t\t\ttry {\n\t\t\t\t\tinput.disabled = true;\n\t\t\t\t\tsubmit.disabled = true;\n\t\t\t\t\tawait availableAPIs.automatedLogonInput({ session: userLogonID, input: input.value });\n\t\t\t\t\tuserLogonSession = await availableAPIs.automatedLogonGet(userLogonID);\n\t\t\t\t} catch {}\n\t\t\t\treturn await updateProgress();\n\t\t\t});\n\t\t}\n\t\tawait updateProgress();\n\t\treturn false;\n\t}\n\tsubmit.addEventListener(\"click\", userSubmit);\n\tif (user) {\n\t\tinput.disabled = true;\n\t\tinput.value = user;\n\t\tuserSubmit({ preventDefault: () => {}, stopImmediatePropagation: () => {}, stopPropagation: () => {} });\n\t}\n})();\naddEventListener(\"signal\", async function(e) {\n\tif (e.detail == 15) {\n\t\ttry {\n\t\t\tawait availableAPIs.sendToPipe({ pipe: ipc, data: { success: false, cancelled: true } });\n\t\t} catch {}\n\t\tawait window.availableAPIs.terminate();\n\t}\n}); null;", token);
				await modules.fs.chown(appPath, "root", token);
				await modules.fs.chgrp(appPath, "root", token);
				await modules.fs.chmod(appPath, "rx", token);
			}
			// ../apps/consentui.js
			async function consentuiInstaller(target, token) {
				let neededApps = await modules.fs.ls(target + "/", token);
				if (!neededApps.includes("apps")) await modules.fs.mkdir(target + "/apps", token);
				await modules.fs.chown(target + "/apps", "root", token);
				await modules.fs.chgrp(target + "/apps", "root", token);
				await modules.fs.chmod(target + "/apps", "rx", token);
				let appPath = target + "/apps/consentui.js";
				await modules.fs.write(appPath, "let ipc = exec_args[0];\n(async function() {\n\t// @pcos-app-mode isolatable\n\tif (!ipc) return availableAPIs.terminate();\n\tlet user = exec_args[1];\n\tawait availableAPIs.windowTitleSet(await availableAPIs.lookupLocale(\"ACCESS_REQUEST_TITLE\"));\n\tlet checklist = [ \"IPC_SEND_PIPE\", \"GET_LOCALE\", \"GET_THEME\", \"ELEVATE_PRIVILEGES\", \"CSP_OPERATIONS\" ];\n\tlet privileges = await availableAPIs.getPrivileges();\n\tif (!checklist.every(p => privileges.includes(p))) {\n\t\tif (privileges.includes(\"IPC_SEND_PIPE\")) await availableAPIs.sendToPipe({ pipe: ipc, data: { success: false, cancelled: false } });\n\t\treturn availableAPIs.terminate();\n\t}\n\tdocument.body.style.fontFamily = \"'Segoe UI', Tahoma, Geneva, Verdana, sans-serif\";\n\tif (await availableAPIs.isDarkThemed()) document.body.style.color = \"white\";\n\tlet describe = document.createElement(\"span\");\n\tlet form = document.createElement(\"form\");\n\tlet input = document.createElement(\"input\");\n\tlet decline = document.createElement(\"button\");\n\tlet submit = document.createElement(\"button\");\n\tlet metadata = JSON.parse(exec_args[2]);\n\tdecline.type = \"button\";\n\tsubmit.type = \"submit\";\n\tdocument.body.appendChild(describe);\n\tdocument.body.appendChild(document.createElement(\"hr\"));\n\tdocument.body.appendChild(form);\n\tform.appendChild(input);\n\tform.appendChild(document.createElement(\"br\"));\n\tform.appendChild(decline);\n\tform.appendChild(submit);\n\tdescribe.innerText = (await availableAPIs.lookupLocale(\"DESCRIBE_TEMPLATE\")).replace(\"%s\", metadata.path.split(\"/\").pop()).replace(\"%s\", metadata.submittedName || metadata.path.split(\"/\").pop()).replace(\"%s\", metadata.submittedIntent);\n\tinput.placeholder = await availableAPIs.lookupLocale(\"USERNAME\");\n\tdecline.innerText = await availableAPIs.lookupLocale(\"DECLINE\");\n\tsubmit.innerText = await availableAPIs.lookupLocale(\"NEXT\");\n\n\tasync function extraData(e) {\n\t\te.stopImmediatePropagation();\n\t\te.preventDefault();\n\t\te.stopPropagation();\n\t\tdescribe.innerText = (await availableAPIs.lookupLocale(\"EXTRA_DESCRIBE_TEMPLATE\")).replace(\"%s\", metadata.path).replace(\"%s\", metadata.submittedName || metadata.path.split(\"/\").pop()).replace(\"%s\", JSON.stringify(metadata.args)).replace(\"%s\", metadata.submittedIntent);\n\t\tdescribe.removeEventListener(\"contextmenu\", extraData);\n\t}\n\n\tdescribe.addEventListener(\"contextmenu\", extraData);\n\n\tasync function userSubmit(e) {\n\t\tdescribe.removeEventListener(\"contextmenu\", extraData);\n\t\te.stopImmediatePropagation();\n\t\te.preventDefault();\n\t\te.stopPropagation();\n\t\tlet userLogonSession;\n\t\tlet userLogonID;\n\t\tlet desired_username = input.value;\n\t\ttry {\n\t\t\tuserLogonID = await availableAPIs.automatedLogonCreate({ desiredUser: desired_username });\n\t\t\tuserLogonSession = await availableAPIs.automatedLogonGet(userLogonID);\n\t\t} catch {\n\t\t\tdescribe.innerText = await availableAPIs.lookupLocale(\"AUTH_FAILED\") + \" \" + await availableAPIs.lookupLocale(\"USERNAME_PROMPT\");\n\t\t\tinput.placeholder = await availableAPIs.lookupLocale(\"USERNAME\");\n\t\t\tinput.type = \"text\";\n\t\t\tinput.disabled = !!user;\n\t\t\tsubmit.disabled = false;\n\t\t\tinput.value = user || \"\";\n\t\t\tsubmit.addEventListener(\"click\", userSubmit);\n\t\t\treturn;\n\t\t}\n\t\tasync function updateProgress() {\n\t\t\tsubmit.removeEventListener(\"click\", userSubmit);\n\t\t\tinput.value = \"\";\n\t\t\tif (userLogonSession.success != \"intermediate\") await availableAPIs.automatedLogonDelete(userLogonID);\n\t\t\tif (userLogonSession.success == true) {\n\t\t\t\tawait availableAPIs.sendToPipe({ pipe: ipc, data: userLogonSession });\n\t\t\t\tawait availableAPIs.terminate();\n\t\t\t}\n\t\t\tif (userLogonSession.success == false) {\n\t\t\t\tdescribe.innerText = await availableAPIs.lookupLocale(\"AUTH_FAILED\") + \" \" + await availableAPIs.lookupLocale(\"USERNAME_PROMPT\");\n\t\t\t\tinput.placeholder = await availableAPIs.lookupLocale(\"USERNAME\");\n\t\t\t\tinput.type = \"text\";\n\t\t\t\tinput.disabled = !!user;\n\t\t\t\tsubmit.disabled = false;\n\t\t\t\tinput.value = user || \"\";\n\t\t\t\tsubmit.addEventListener(\"click\", userSubmit);\n\t\t\t\treturn;\n\t\t\t}\n\t\t\tdescribe.innerText = \"[\" + desired_username + \"] \" + userLogonSession.message;\n\t\t\tinput.placeholder = await availableAPIs.lookupLocale(\"RESPONSE_PLACEHOLDER\");\n\t\t\tinput.type = userLogonSession.type == \"password\" ? \"password\" : \"text\";\n\t\t\tinput.disabled = !userLogonSession.wantsUserInput;\n\t\t\tsubmit.disabled = !userLogonSession.wantsUserInput;\n\t\t\tif (userLogonSession.type == \"promise\") {\n\t\t\t\ttry {\n\t\t\t\t\tinput.disabled = true;\n\t\t\t\t\tsubmit.disabled = true;\n\t\t\t\t\tawait availableAPIs.automatedLogonInput({ session: userLogonID });\n\t\t\t\t\tuserLogonSession = await availableAPIs.automatedLogonGet(userLogonID);\n\t\t\t\t} catch {}\n\t\t\t\treturn await updateProgress();\n\t\t\t}\n\t\t\tif (userLogonSession.type == \"informative\") {\n\t\t\t\tinput.disabled = true;\n\t\t\t\tsubmit.disabled = false;\n\t\t\t\tinput.placeholder = \"\";\n\t\t\t}\n\t\t\tsubmit.addEventListener(\"click\", async function updater(e) {\n\t\t\t\te.stopImmediatePropagation();\n\t\t\t\tsubmit.removeEventListener(\"click\", updater);\n\t\t\t\te.preventDefault();\n\t\t\t\te.stopPropagation();\n\t\t\t\ttry {\n\t\t\t\t\tinput.disabled = true;\n\t\t\t\t\tsubmit.disabled = true;\n\t\t\t\t\tawait availableAPIs.automatedLogonInput({ session: userLogonID, input: input.value });\n\t\t\t\t\tuserLogonSession = await availableAPIs.automatedLogonGet(userLogonID);\n\t\t\t\t} catch {}\n\t\t\t\treturn await updateProgress();\n\t\t\t});\n\t\t}\n\t\tawait updateProgress();\n\t\treturn false;\n\t}\n\tsubmit.addEventListener(\"click\", userSubmit);\n\tdecline.addEventListener(\"click\", async function() {\n\t\tawait availableAPIs.sendToPipe({ pipe: ipc, data: { success: false, cancelled: true } });\n\t\tawait availableAPIs.terminate();\n\t});\n\tif (user) {\n\t\tinput.disabled = true;\n\t\tinput.value = user;\n\t}\n})();\naddEventListener(\"signal\", async function(e) {\n\tif (e.detail == 15) {\n\t\ttry {\n\t\t\tawait availableAPIs.sendToPipe({ pipe: ipc, data: { success: false, cancelled: true } });\n\t\t} catch {}\n\t\tawait window.availableAPIs.terminate();\n\t}\n}); null;", token);
				await modules.fs.chown(appPath, "root", token);
				await modules.fs.chgrp(appPath, "root", token);
				await modules.fs.chmod(appPath, "rx", token);
			}
			// ../apps/explorer.js
			async function explorerInstaller(target, token) {
				let neededApps = await modules.fs.ls(target + "/", token);
				if (!neededApps.includes("apps")) await modules.fs.mkdir(target + "/apps", token);
				await modules.fs.chown(target + "/apps", "root", token);
				await modules.fs.chgrp(target + "/apps", "root", token);
				await modules.fs.chmod(target + "/apps", "rx", token);
				let neededAppsLinks = await modules.fs.ls(target + "/apps", token);
				if (!neededAppsLinks.includes("links")) await modules.fs.mkdir(target + "/apps/links", token);
				await modules.fs.chown(target + "/apps/links", "root", token);
				await modules.fs.chgrp(target + "/apps/links", "root", token);
				await modules.fs.chmod(target + "/apps/links", "rx", token);
				let appPath = target + "/apps/explorer.js";
				let linkPath = target + "/apps/links/explorer.lnk";
				let lrn = "FILE_EXPLORER", name;
				await modules.fs.write(linkPath, JSON.stringify({
					path: appPath,
					localeReferenceName: lrn,
					name
				}), token);
				await modules.fs.chown(linkPath, "root", token);
				await modules.fs.chgrp(linkPath, "root", token);
				await modules.fs.chmod(linkPath, "rx", token);
				await modules.fs.write(appPath, "// =====BEGIN MANIFEST=====\n// link: lrn:FILE_EXPLORER\n// =====END MANIFEST=====\nlet globalToken;\n(async function() {\n\t// @pcos-app-mode isolatable\n\tawait availableAPIs.windowTitleSet(await availableAPIs.lookupLocale(\"FILE_EXPLORER\"));\n\tdocument.body.style.fontFamily = \"'Segoe UI', Tahoma, Geneva, Verdana, sans-serif\";\n\tif (await availableAPIs.isDarkThemed()) document.body.style.color = \"white\";\n\tlet privileges = await availableAPIs.getPrivileges();\n\tlet checklist = [ \"FS_READ\", \"FS_LIST_PARTITIONS\" ];\n\tif (!checklist.every(p => privileges.includes(p))) {\n\t\tdocument.body.innerText = await availableAPIs.lookupLocale(\"GRANT_FEXP_PERM\");\n\t\tlet button = document.createElement(\"button\");\n\t\tbutton.innerText = await availableAPIs.lookupLocale(\"GRANT_PERM\");\n\t\tdocument.body.appendChild(button);\n\t\tif (!privileges.includes(\"ELEVATE_PRIVILEGES\")) {\n\t\t\tbutton.disabled = true;\n\t\t\tdocument.body.innerText = await availableAPIs.lookupLocale(\"GRANT_FEXP_PERM_ADM\");\n\t\t\treturn;\n\t\t}\n\t\tawait new Promise(function(resolve) {\n\t\t\tbutton.onclick = async function() {\n\t\t\t\tbutton.disabled = true;\n\t\t\t\tlet currentToken = await availableAPIs.getProcessToken();\n\t\t\t\tlet newToken = await availableAPIs.consentGetToken({\n\t\t\t\t\tintent: await availableAPIs.lookupLocale(\"FILE_EXPLORER_FULL_INTENT\"),\n\t\t\t\t\tname: await availableAPIs.lookupLocale(\"FILE_EXPLORER\")\n\t\t\t\t});\n\t\t\t\tbutton.disabled = false;\n\t\t\t\tif (!newToken) return;\n\t\t\t\tif (privileges.includes(\"MANAGE_TOKENS\")) globalToken = await availableAPIs.forkToken(newToken);\n\t\t\t\tawait availableAPIs.setProcessToken(newToken);\n\t\t\t\tawait availableAPIs.revokeToken(currentToken);\n\t\t\t\tprivileges = await availableAPIs.getPrivileges();\n\t\t\t\tif (checklist.every(p => privileges.includes(p))) resolve();\n\t\t\t\telse document.body.innerText = await availableAPIs.lookupLocale(\"GRANT_FEXP_PERM_USR\");\n\t\t\t}\n\t\t});\n\t}\n\tlet hideHiddenFiles = true;\n\ttry {\n\t\tlet homedir = (await availableAPIs.getUserInfo({ desiredUser: await availableAPIs.getUser() })).homeDirectory;\n\t\thideHiddenFiles = (await availableAPIs.fs_read({\n\t\t\tpath: homedir + \"/.hiddenFiles\",\n\t\t})) != \"show\";\n\t} catch {}\n\tdocument.body.innerText = \"\";\n\tlet mainComponent = document.createElement(\"div\");\n\tlet pathInputForm = document.createElement(\"form\");\n\tlet pathElement = document.createElement(\"input\");\n\tlet browseButton = document.createElement(\"button\");\n\tlet displayResult = document.createElement(\"div\");\n\tlet previousDirectory = \"\";\n\tlet clipboard = {\n\t\tpath: \"\",\n\t\tcut: false,\n\t\tselected: false\n\t};\n\tmainComponent.style.display = \"flex\";\n\tmainComponent.style.flexDirection = \"column\";\n\tmainComponent.style.width = \"100%\";\n\tmainComponent.style.height = \"100%\";\n\tmainComponent.style.position = \"absolute\";\n\tmainComponent.style.top = \"0\";\n\tmainComponent.style.left = \"0\";\n\tmainComponent.style.padding = \"8px\";\n\tmainComponent.style.boxSizing = \"border-box\";\n\tdisplayResult.style.flex = \"1\";\n\tbrowseButton.innerText = await availableAPIs.lookupLocale(\"BROWSE_FEXP\");\n\tpathInputForm.appendChild(pathElement);\n\tpathInputForm.appendChild(browseButton);\n\tmainComponent.appendChild(pathInputForm);\n\tmainComponent.appendChild(displayResult);\n\tdocument.body.appendChild(mainComponent);\n\tdisplayResult.oncontextmenu = async function(e) {\n\t\te.stopImmediatePropagation();\n\t\te.preventDefault();\n\t\te.stopPropagation();\n\t\tdisplayResult.innerText = \"\";\n\t\tlet showHiddenFilesToggle = document.createElement(\"button\");\n\t\tshowHiddenFilesToggle.innerText = await availableAPIs.lookupLocale(\"TOGGLE_HIDDEN_FILES\");\n\t\tshowHiddenFilesToggle.addEventListener(\"click\", async function() {\n\t\t\thideHiddenFiles = !hideHiddenFiles;\n\t\t\ttry {\n\t\t\t\tlet homedir = (await availableAPIs.getUserInfo({ desiredUser: await availableAPIs.getUser() })).homeDirectory;\n\t\t\t\tavailableAPIs.fs_write({\n\t\t\t\t\tpath: homedir + \"/.hiddenFiles\",\n\t\t\t\t\tdata: (hideHiddenFiles ? \"hide\" : \"show\")\n\t\t\t\t});\n\t\t\t} catch {}\n\t\t\tbrowse();\n\t\t});\n\t\tdisplayResult.appendChild(showHiddenFilesToggle);\n\t\tdisplayResult.appendChild(document.createElement(\"hr\"));\n\t\tif (previousDirectory == \"\") {\n\t\t\tlet mountForm = document.createElement(\"form\");\n\t\t\tlet mountpoint = document.createElement(\"input\");\n\t\t\tlet filesystemOptions = document.createElement(\"select\");\n\t\t\tlet autoGenMountOptions = document.createElement(\"select\");\n\t\t\tlet mountOptions = document.createElement(\"textarea\");\n\t\t\tlet mountButton = document.createElement(\"button\");\n\t\t\tmountpoint.placeholder = await availableAPIs.lookupLocale(\"MOUNTPOINT\");\n\t\t\tlet availableFilesystems = await availableAPIs.supportedFilesystems();\n\t\t\tfor (let filesystem of availableFilesystems) {\n\t\t\t\tlet option = document.createElement(\"option\");\n\t\t\t\toption.value = filesystem;\n\t\t\t\toption.innerText = filesystem;\n\t\t\t\tfilesystemOptions.appendChild(option);\n\t\t\t}\n\t\t\tlet availablePartitions = [];\n\t\t\ttry {\n\t\t\t\tavailablePartitions = await availableAPIs.lldaList();\n\t\t\t} catch (e) {\n\t\t\t\tconsole.error(e);\n\t\t\t}\n\t\t\tlet defaultPartitionOption = document.createElement(\"option\");\n\t\t\tdefaultPartitionOption.value = \"\";\n\t\t\tdefaultPartitionOption.innerText = await availableAPIs.lookupLocale(\"GENERATE_PROMPT\");\n\t\t\tdefaultPartitionOption.selected = true;\n\t\t\tdefaultPartitionOption.disabled = true;\n\t\t\tdefaultPartitionOption.hidden = true;\n\t\t\tautoGenMountOptions.appendChild(defaultPartitionOption);\n\t\t\tfor (let partition of availablePartitions) {\n\t\t\t\tlet option = document.createElement(\"option\");\n\t\t\t\toption.value = partition;\n\t\t\t\toption.innerText = partition;\n\t\t\t\tautoGenMountOptions.appendChild(option);\n\t\t\t}\n\t\t\tautoGenMountOptions.onchange = function() {\n\t\t\t\tmountOptions.value = JSON.stringify({ partition: autoGenMountOptions.value });\n\t\t\t}\n\t\t\tmountOptions.value = \"{}\";\n\t\t\tmountButton.innerText = await availableAPIs.lookupLocale(\"MOUNT_BUTTON\");\n\t\t\tmountButton.onclick = async function() {\n\t\t\t\ttry {\n\t\t\t\t\tlet options = JSON.parse(mountOptions.value);\n\t\t\t\t\tawait availableAPIs.fs_mount({ mountpoint: mountpoint.value, filesystem: filesystemOptions.value, filesystemOptions: options });\n\t\t\t\t\tbrowse();\n\t\t\t\t} catch (e) {\n\t\t\t\t\tconsole.error(e);\n\t\t\t\t\tdisplayResult.innerText = (await availableAPIs.lookupLocale(\"FILE_STRUCT_BROWSE_FAIL\")).replace(\"%s\", e.name + \": \" + e.message);\n\t\t\t\t}\n\t\t\t}\n\t\t\tmountForm.appendChild(mountpoint);\n\t\t\tmountForm.appendChild(document.createElement(\"br\"));\n\t\t\tmountForm.appendChild(filesystemOptions);\n\t\t\tmountForm.appendChild(document.createElement(\"hr\"));\n\t\t\tmountForm.appendChild(autoGenMountOptions);\n\t\t\tmountForm.appendChild(document.createElement(\"br\"));\n\t\t\tmountForm.appendChild(mountOptions);\n\t\t\tmountForm.appendChild(document.createElement(\"hr\"));\n\t\t\tmountForm.appendChild(mountButton);\n\t\t\tdisplayResult.appendChild(mountForm);\n\t\t} else {\n\t\t\tlet makeDirectoryForm = document.createElement(\"form\");\n\t\t\tlet makeDirectoryInput = document.createElement(\"input\");\n\t\t\tlet makeDirectoryButton = document.createElement(\"button\");\n\t\t\tmakeDirectoryInput.pattern = \"[!-.0-~]+\";\n\t\t\tmakeDirectoryInput.placeholder = await availableAPIs.lookupLocale(\"NEW_DIR_NAME\");\n\t\t\tmakeDirectoryForm.appendChild(makeDirectoryInput);\n\t\t\tmakeDirectoryForm.appendChild(makeDirectoryButton);\n\t\t\tdisplayResult.appendChild(makeDirectoryForm);\n\t\t\tmakeDirectoryButton.innerText = await availableAPIs.lookupLocale(\"MKDIR_BUTTON\");\n\t\t\tmakeDirectoryButton.onclick = async function() {\n\t\t\t\tlet dirName = makeDirectoryInput.value;\n\t\t\t\tif (dirName == \"\") return;\n\t\t\t\ttry {\n\t\t\t\t\tawait availableAPIs.fs_mkdir({ path: previousDirectory + \"/\" + dirName });\n\t\t\t\t\tbrowse();\n\t\t\t\t} catch (e) {\n\t\t\t\t\tdisplayResult.innerText = (await availableAPIs.lookupLocale(\"FILE_STRUCT_BROWSE_FAIL\")).replace(\"%s\", await availableAPIs.lookupLocale(e.message));\n\t\t\t\t}\n\t\t\t}\n\t\t\tif (clipboard.selected) {\n\t\t\t\tdisplayResult.appendChild(document.createElement(\"hr\"));\n\t\t\t\tlet pasteButton = document.createElement(\"button\");\n\t\t\t\tpasteButton.innerText = await availableAPIs.lookupLocale(\"CLIPBOARD_PASTE\");\n\t\t\t\tpasteButton.onclick = async function() {\n\t\t\t\t\ttry {\n\t\t\t\t\t\tlet copyAllowed = await isDirectory(clipboard.path) == \"file\";\n\t\t\t\t\t\tif (!copyAllowed) throw new Error(await availableAPIs.lookupLocale(\"CLIPBOARD_SOURCE_GONE\"));\n\t\t\t\t\t\tlet readFile = await availableAPIs.fs_read({ path: clipboard.path });\n\t\t\t\t\t\tlet basename = clipboard.path.split(\"/\").slice(-1)[0];\n\t\t\t\t\t\tcopyAllowed = await isDirectory(previousDirectory + \"/\" + basename) == \"unknown\";\n\t\t\t\t\t\tif (!copyAllowed) throw new Error(await availableAPIs.lookupLocale(\"CLIPBOARD_CONFLICT\"));\n\t\t\t\t\t\tawait availableAPIs.fs_write({ path: previousDirectory + \"/\" + basename, data: readFile });\n\t\t\t\t\t\tif (clipboard.cut) await availableAPIs.fs_rm({ path: clipboard.path });\n\t\t\t\t\t\tbrowse();\n\t\t\t\t\t} catch (e) {\n\t\t\t\t\t\tdisplayResult.innerText = (await availableAPIs.lookupLocale(\"FILE_STRUCT_BROWSE_FAIL\")).replace(\"%s\", await availableAPIs.lookupLocale(e.message));\n\t\t\t\t\t}\n\t\t\t\t}\n\t\t\t\tdisplayResult.appendChild(pasteButton);\n\t\t\t}\n\t\t}\n\t}\n\tasync function browse() {\n\t\tlet path = pathElement.value;\n\t\tif (path.endsWith(\"/\")) path = path.substring(0, path.length - 1);\n\t\tdisplayResult.innerText = \"\";\n\t\tif (path == \"\") {\n\t\t\tlet partitions = await availableAPIs.fs_mounts();\n\t\t\tfor (let partition of partitions) {\n\t\t\t\tlet openButton = document.createElement(\"button\");\n\t\t\t\topenButton.innerText = partition;\n\t\t\t\topenButton.onclick = function() {\n\t\t\t\t\tpathElement.value = partition;\n\t\t\t\t\tbrowse();\n\t\t\t\t}\n\t\t\t\topenButton.oncontextmenu = async function(e) {\n\t\t\t\t\te.stopImmediatePropagation();\n\t\t\t\t\te.preventDefault();\n\t\t\t\t\te.stopPropagation();\n\t\t\t\t\tdisplayResult.innerText = \"\";\n\t\t\t\t\tlet unmountButton = document.createElement(\"button\");\n\t\t\t\t\tunmountButton.innerText = await availableAPIs.lookupLocale(\"UNMOUNT_BTN\");\n\t\t\t\t\tunmountButton.onclick = async function() {\n\t\t\t\t\t\ttry {\n\t\t\t\t\t\t\tawait availableAPIs.fs_unmount({ mount: partition });\n\t\t\t\t\t\t\tbrowse();\n\t\t\t\t\t\t} catch (e) {\n\t\t\t\t\t\t\tdisplayResult.innerText = (await availableAPIs.lookupLocale(\"FILE_STRUCT_BROWSE_FAIL\")).replace(\"%s\", await availableAPIs.lookupLocale(e.message));\n\t\t\t\t\t\t}\n\t\t\t\t\t}\n\t\t\t\t\tdisplayResult.appendChild(unmountButton);\n\t\t\t\t\tdisplayResult.appendChild(document.createElement(\"hr\"));\n\n\t\t\t\t\tlet deleteButton = document.createElement(\"button\");\n\t\t\t\t\tdeleteButton.innerText = await availableAPIs.lookupLocale(\"REMOVE_BTN\");\n\t\t\t\t\tdeleteButton.onclick = async function() {\n\t\t\t\t\t\ttry {\n\t\t\t\t\t\t\tawait recursiveRemove(partition);\n\t\t\t\t\t\t\tbrowse();\n\t\t\t\t\t\t} catch (e) {\n\t\t\t\t\t\t\tdisplayResult.innerText = (await availableAPIs.lookupLocale(\"FILE_STRUCT_BROWSE_FAIL\")).replace(\"%s\", await availableAPIs.lookupLocale(e.message));\n\t\t\t\t\t\t}\n\t\t\t\t\t}\n\t\t\t\t\tdisplayResult.appendChild(deleteButton);\n\n\t\t\t\t\tdisplayResult.appendChild(document.createElement(\"br\"));\n\t\t\t\t\tlet permissions = { owner: \"nobody\", group: \"nobody\", world: \"rx\" };\n\t\t\t\t\ttry {\n\t\t\t\t\t\tpermissions = await availableAPIs.fs_permissions({ path: partition });\n\t\t\t\t\t} catch (e) {\n\t\t\t\t\t\tconsole.error(e);\n\t\t\t\t\t}\n\t\t\t\t\tlet chownForm = document.createElement(\"form\");\n\t\t\t\t\tlet chownInput = document.createElement(\"input\");\n\t\t\t\t\tlet chownButton = document.createElement(\"button\");\n\t\t\t\t\tchownInput.value = permissions.owner;\n\t\t\t\t\tchownButton.innerText = await availableAPIs.lookupLocale(\"CHOWN_BUTTON\");\n\t\t\t\t\tchownForm.appendChild(chownInput);\n\t\t\t\t\tchownForm.appendChild(chownButton);\n\t\t\t\t\tdisplayResult.appendChild(chownForm);\n\t\t\t\t\tchownButton.onclick = async function() {\n\t\t\t\t\t\ttry {\n\t\t\t\t\t\t\tawait availableAPIs.fs_chown({ path: partition, newUser: chownInput.value });\n\t\t\t\t\t\t\tbrowse();\n\t\t\t\t\t\t} catch (e) {\n\t\t\t\t\t\t\tdisplayResult.innerText = (await availableAPIs.lookupLocale(\"FILE_STRUCT_BROWSE_FAIL\")).replace(\"%s\", await availableAPIs.lookupLocale(e.message));\n\t\t\t\t\t\t}\n\t\t\t\t\t}\n\n\t\t\t\t\tlet chgrpForm = document.createElement(\"form\");\n\t\t\t\t\tlet chgrpInput = document.createElement(\"input\");\n\t\t\t\t\tlet chgrpButton = document.createElement(\"button\");\n\t\t\t\t\tchgrpInput.value = permissions.group;\n\t\t\t\t\tchgrpButton.innerText = await availableAPIs.lookupLocale(\"CHGRP_BUTTON\");\n\t\t\t\t\tchgrpForm.appendChild(chgrpInput);\n\t\t\t\t\tchgrpForm.appendChild(chgrpButton);\n\t\t\t\t\tdisplayResult.appendChild(chgrpForm);\n\t\t\t\t\tchgrpButton.onclick = async function() {\n\t\t\t\t\t\ttry {\n\t\t\t\t\t\t\tawait availableAPIs.fs_chgrp({ path: partition, newGrp: chgrpInput.value });\n\t\t\t\t\t\t\tbrowse();\n\t\t\t\t\t\t} catch (e) {\n\t\t\t\t\t\t\tdisplayResult.innerText = (await availableAPIs.lookupLocale(\"FILE_STRUCT_BROWSE_FAIL\")).replace(\"%s\", await availableAPIs.lookupLocale(e.message));\n\t\t\t\t\t\t}\n\t\t\t\t\t}\n\n\t\t\t\t\tlet chmodForm = document.createElement(\"form\");\n\t\t\t\t\tlet chmodInput = document.createElement(\"input\");\n\t\t\t\t\tlet chmodButton = document.createElement(\"button\");\n\t\t\t\t\tchmodInput.value = permissions.world;\n\t\t\t\t\tchownInput.pattern = \"[rwx]+\";\n\t\t\t\t\tchmodButton.innerText = await availableAPIs.lookupLocale(\"CHMOD_BUTTON\");\n\t\t\t\t\tchmodForm.appendChild(chmodInput);\n\t\t\t\t\tchmodForm.appendChild(chmodButton);\n\t\t\t\t\tdisplayResult.appendChild(chmodForm);\n\t\t\t\t\tchmodButton.onclick = async function() {\n\t\t\t\t\t\ttry {\n\t\t\t\t\t\t\tawait availableAPIs.fs_chmod({ path: partition, newPermissions: chmodInput.value });\n\t\t\t\t\t\t\tbrowse();\n\t\t\t\t\t\t} catch (e) {\n\t\t\t\t\t\t\tdisplayResult.innerText = (await availableAPIs.lookupLocale(\"FILE_STRUCT_BROWSE_FAIL\")).replace(\"%s\", await availableAPIs.lookupLocale(e.message));\n\t\t\t\t\t\t}\n\t\t\t\t\t}\n\t\t\t\t}\n\t\t\t\tdisplayResult.appendChild(openButton);\n\t\t\t}\n\t\t\tdisplayResult.appendChild(document.createElement(\"hr\"));\n\t\t\tlet spaceDisplayer = document.createElement(\"span\");\n\t\t\tlet spaces = await availableAPIs.estimateStorage();\n\t\t\tfor (let space in spaces) {\n\t\t\t\tspaceDisplayer.innerText += (await availableAPIs.lookupLocale(\"SPACE_SHOWER\")).replace(\"%s\", space).replace(\"%s\", await availableAPIs.ufInfoUnits([spaces[space].used])).replace(\"%s\", await availableAPIs.ufInfoUnits([spaces[space].total])).replace(\"%s\", (spaces[space].used / spaces[space].total * 100).toFixed(2));\n\t\t\t}\n\t\t\tdisplayResult.appendChild(spaceDisplayer);\n\t\t\tpreviousDirectory = path;\n\t\t\treturn \"browsed\";\n\t\t}\n\t\ttry {\n\t\t\tlet type = await isDirectory(path);\n\t\t\tif (type == \"directory\") {\n\t\t\t\tlet ls = await availableAPIs.fs_ls({ path: path });\n\t\t\t\tfor (let file of ls) {\n\t\t\t\t\tif (file.startsWith(\".\") && hideHiddenFiles) continue;\n\t\t\t\t\tlet openButton = document.createElement(\"button\");\n\t\t\t\t\topenButton.innerText = file;\n\t\t\t\t\topenButton.onclick = function() {\n\t\t\t\t\t\tpathElement.value = path + \"/\" + file;\n\t\t\t\t\t\tbrowse();\n\t\t\t\t\t}\n\t\t\t\t\topenButton.oncontextmenu = async function(e) {\n\t\t\t\t\t\te.stopImmediatePropagation();\n\t\t\t\t\t\te.preventDefault();\n\t\t\t\t\t\te.stopPropagation();\n\t\t\t\t\t\tdisplayResult.innerText = \"\";\n\t\t\t\t\t\tlet copyAllow = false;\n\t\t\t\t\t\ttry {\n\t\t\t\t\t\t\tcopyAllow = await isDirectory(path + \"/\" + file) == \"file\";\n\t\t\t\t\t\t} catch {}\n\t\t\t\t\t\tif (copyAllow) {\n\t\t\t\t\t\t\tlet copyButton = document.createElement(\"button\");\n\t\t\t\t\t\t\tcopyButton.innerText = await availableAPIs.lookupLocale(\"CLIPBOARD_COPY\");\n\t\t\t\t\t\t\tcopyButton.onclick = async function() {\n\t\t\t\t\t\t\t\tclipboard = {\n\t\t\t\t\t\t\t\t\tpath: path + \"/\" + file,\n\t\t\t\t\t\t\t\t\tselected: true,\n\t\t\t\t\t\t\t\t\tcut: false\n\t\t\t\t\t\t\t\t};\n\t\t\t\t\t\t\t\tbrowse();\n\t\t\t\t\t\t\t};\n\t\t\t\t\t\t\tdisplayResult.appendChild(copyButton);\n\n\t\t\t\t\t\t\tlet cutButton = document.createElement(\"button\");\n\t\t\t\t\t\t\tcutButton.innerText = await availableAPIs.lookupLocale(\"CLIPBOARD_CUT\");\n\t\t\t\t\t\t\tcutButton.onclick = async function() {\n\t\t\t\t\t\t\t\tclipboard = {\n\t\t\t\t\t\t\t\t\tpath: path + \"/\" + file,\n\t\t\t\t\t\t\t\t\tselected: true,\n\t\t\t\t\t\t\t\t\tcut: true\n\t\t\t\t\t\t\t\t};\n\t\t\t\t\t\t\t\tbrowse();\n\t\t\t\t\t\t\t};\n\t\t\t\t\t\t\tdisplayResult.appendChild(cutButton);\n\t\t\t\t\t\t\tdisplayResult.appendChild(document.createElement(\"hr\"));\n\t\t\t\t\t\t}\n\t\t\t\t\t\tlet deleteButton = document.createElement(\"button\");\n\t\t\t\t\t\tdeleteButton.innerText = await availableAPIs.lookupLocale(\"REMOVE_BTN\");\n\t\t\t\t\t\tdeleteButton.onclick = async function() {\n\t\t\t\t\t\t\ttry {\n\t\t\t\t\t\t\t\tlet isDir = await isDirectory(path + \"/\" + file);\n\t\t\t\t\t\t\t\tif (isDir == \"directory\") await recursiveRemove(path + \"/\" + file);\n\t\t\t\t\t\t\t\telse if (isDir == \"file\") await availableAPIs.fs_rm({ path: path + \"/\" + file });\n\t\t\t\t\t\t\t\tbrowse();\n\t\t\t\t\t\t\t} catch (e) {\n\t\t\t\t\t\t\t\tdisplayResult.innerText = (await availableAPIs.lookupLocale(\"FILE_STRUCT_BROWSE_FAIL\")).replace(\"%s\", await availableAPIs.lookupLocale(e.message));\n\t\t\t\t\t\t\t}\n\t\t\t\t\t\t}\n\t\t\t\t\t\tdisplayResult.appendChild(deleteButton);\n\t\t\t\t\t\tdisplayResult.appendChild(document.createElement(\"br\"));\n\t\t\t\t\t\tlet permissions = { owner: \"nobody\", group: \"nobody\", world: \"rx\" };\n\t\t\t\t\t\ttry {\n\t\t\t\t\t\t\tpermissions = await availableAPIs.fs_permissions({ path: path + \"/\" + file });\n\t\t\t\t\t\t} catch (e) {\n\t\t\t\t\t\t\tconsole.error(e);\n\t\t\t\t\t\t}\n\t\t\t\t\t\tlet chownForm = document.createElement(\"form\");\n\t\t\t\t\t\tlet chownInput = document.createElement(\"input\");\n\t\t\t\t\t\tlet chownButton = document.createElement(\"button\");\n\t\t\t\t\t\tchownInput.value = permissions.owner;\n\t\t\t\t\t\tchownButton.innerText = await availableAPIs.lookupLocale(\"CHOWN_BUTTON\");\n\t\t\t\t\t\tchownForm.appendChild(chownInput);\n\t\t\t\t\t\tchownForm.appendChild(chownButton);\n\t\t\t\t\t\tdisplayResult.appendChild(chownForm);\n\t\t\t\t\t\tchownButton.onclick = async function() {\n\t\t\t\t\t\t\ttry {\n\t\t\t\t\t\t\t\tawait availableAPIs.fs_chown({ path: path + \"/\" + file, newUser: chownInput.value });\n\t\t\t\t\t\t\t\tbrowse();\n\t\t\t\t\t\t\t} catch (e) {\n\t\t\t\t\t\t\t\tdisplayResult.innerText = (await availableAPIs.lookupLocale(\"FILE_STRUCT_BROWSE_FAIL\")).replace(\"%s\", await availableAPIs.lookupLocale(e.message));\n\t\t\t\t\t\t\t}\n\t\t\t\t\t\t}\n\n\t\t\t\t\t\tlet chgrpForm = document.createElement(\"form\");\n\t\t\t\t\t\tlet chgrpInput = document.createElement(\"input\");\n\t\t\t\t\t\tlet chgrpButton = document.createElement(\"button\");\n\t\t\t\t\t\tchgrpInput.value = permissions.group;\n\t\t\t\t\t\tchgrpButton.innerText = await availableAPIs.lookupLocale(\"CHGRP_BUTTON\");\n\t\t\t\t\t\tchgrpForm.appendChild(chgrpInput);\n\t\t\t\t\t\tchgrpForm.appendChild(chgrpButton);\n\t\t\t\t\t\tdisplayResult.appendChild(chgrpForm);\n\t\t\t\t\t\tchgrpButton.onclick = async function() {\n\t\t\t\t\t\t\ttry {\n\t\t\t\t\t\t\t\tawait availableAPIs.fs_chgrp({ path: path + \"/\" + file, newGrp: chgrpInput.value });\n\t\t\t\t\t\t\t\tbrowse();\n\t\t\t\t\t\t\t} catch (e) {\n\t\t\t\t\t\t\t\tdisplayResult.innerText = (await availableAPIs.lookupLocale(\"FILE_STRUCT_BROWSE_FAIL\")).replace(\"%s\", await availableAPIs.lookupLocale(e.message));\n\t\t\t\t\t\t\t}\n\t\t\t\t\t\t}\n\n\t\t\t\t\t\tlet chmodForm = document.createElement(\"form\");\n\t\t\t\t\t\tlet chmodInput = document.createElement(\"input\");\n\t\t\t\t\t\tlet chmodButton = document.createElement(\"button\");\n\t\t\t\t\t\tchmodInput.value = permissions.world;\n\t\t\t\t\t\tchownInput.pattern = \"[rwx]+\";\n\t\t\t\t\t\tchmodButton.innerText = await availableAPIs.lookupLocale(\"CHMOD_BUTTON\");\n\t\t\t\t\t\tchmodForm.appendChild(chmodInput);\n\t\t\t\t\t\tchmodForm.appendChild(chmodButton);\n\t\t\t\t\t\tdisplayResult.appendChild(chmodForm);\n\t\t\t\t\t\tchmodButton.onclick = async function() {\n\t\t\t\t\t\t\ttry {\n\t\t\t\t\t\t\t\tawait availableAPIs.fs_chmod({ path: path + \"/\" + file, newPermissions: chmodInput.value });\n\t\t\t\t\t\t\t\tbrowse();\n\t\t\t\t\t\t\t} catch (e) {\n\t\t\t\t\t\t\t\tdisplayResult.innerText = (await availableAPIs.lookupLocale(\"FILE_STRUCT_BROWSE_FAIL\")).replace(\"%s\", await availableAPIs.lookupLocale(e.message));\n\t\t\t\t\t\t\t}\n\t\t\t\t\t\t}\n\t\t\t\t\t}\n\t\t\t\t\tdisplayResult.appendChild(openButton);\n\t\t\t\t}\n\t\t\t\tpreviousDirectory = path;\n\t\t\t} else if (type == \"file\") {\n\t\t\t\tpathElement.value = previousDirectory;\n\t\t\t\tawait browse();\n\t\t\t\tif (path.endsWith(\".js\")) {\n\t\t\t\t\tif (privileges.includes(\"START_TASK\") && privileges.includes(\"ELEVATE_PRIVILEGES\") && privileges.includes(\"MANAGE_TOKENS\")) {\n\t\t\t\t\t\tif (!globalToken) globalToken = await availableAPIs.consentGetToken({\n\t\t\t\t\t\t\tintent: await availableAPIs.lookupLocale(\"FILE_EXPLORER_INTENT\"),\n\t\t\t\t\t\t\tname: await availableAPIs.lookupLocale(\"FILE_EXPLORER\"),\n\t\t\t\t\t\t\tdesiredUser: await availableAPIs.getUser()\n\t\t\t\t\t\t});\n\t\t\t\t\t\tif (globalToken) {\n\t\t\t\t\t\t\tlet newToken = await availableAPIs.forkToken(globalToken);\n\t\t\t\t\t\t\tawait availableAPIs.startTask({ file: path, token: newToken });\n\t\t\t\t\t\t}\n\t\t\t\t\t} else {\n\t\t\t\t\t\tdisplayResult.innerText = await availableAPIs.lookupLocale(\"MORE_PERMISSION_DENIED\");\n\t\t\t\t\t}\n\t\t\t\t} else if (path.endsWith(\".lnk\") && privileges.includes(\"ELEVATE_PRIVILEGES\") && privileges.includes(\"MANAGE_TOKENS\")) {\n\t\t\t\t\tlet file = await availableAPIs.fs_read({ path: path });\n\t\t\t\t\tfile = JSON.parse(file);\n\t\t\t\t\tif (privileges.includes(\"START_TASK\")) {\n\t\t\t\t\t\tif (!globalToken) globalToken = await availableAPIs.consentGetToken({\n\t\t\t\t\t\t\tintent: await availableAPIs.lookupLocale(\"FILE_EXPLORER_INTENT\"),\n\t\t\t\t\t\t\tname: await availableAPIs.lookupLocale(\"FILE_EXPLORER\"),\n\t\t\t\t\t\t\tdesiredUser: await availableAPIs.getUser()\n\t\t\t\t\t\t});\n\t\t\t\t\t\tif (globalToken) {\n\t\t\t\t\t\t\tlet newToken = await availableAPIs.forkToken(globalToken);\n\t\t\t\t\t\t\tawait availableAPIs.startTask({ file: file.path, argPassed: [ ...(file.args || []) ], token: newToken });\n\t\t\t\t\t\t}\n\t\t\t\t\t} else {\n\t\t\t\t\t\tdisplayResult.innerText = await availableAPIs.lookupLocale(\"MORE_PERMISSION_DENIED\");\n\t\t\t\t\t}\n\t\t\t\t} else {\n\t\t\t\t\tlet lookUpAssociation = await availableAPIs.fs_ls({ path: await availableAPIs.getSystemMount() + \"/apps/associations\" });\n\t\t\t\t\tlet fileType = path.split(\".\").slice(-1)[0];\n\t\t\t\t\tif (!lookUpAssociation.includes(fileType)) return displayResult.innerText = await availableAPIs.lookupLocale(\"UNKNOWN_FILE_TYPE\");\n\t\t\t\t\tlet file = await availableAPIs.fs_read({ path: await availableAPIs.getSystemMount() + \"/apps/associations/\" + fileType });\n\t\t\t\t\tlet fileLink = JSON.parse(file);\n\t\t\t\t\tif (privileges.includes(\"START_TASK\") && privileges.includes(\"ELEVATE_PRIVILEGES\") && privileges.includes(\"MANAGE_TOKENS\")) {\n\t\t\t\t\t\tif (!globalToken) globalToken = await availableAPIs.consentGetToken({\n\t\t\t\t\t\t\tintent: await availableAPIs.lookupLocale(\"FILE_EXPLORER_INTENT\"),\n\t\t\t\t\t\t\tname: await availableAPIs.lookupLocale(\"FILE_EXPLORER\"),\n\t\t\t\t\t\t\tdesiredUser: await availableAPIs.getUser()\n\t\t\t\t\t\t});\n\t\t\t\t\t\tif (globalToken) {\n\t\t\t\t\t\t\tlet newToken = await availableAPIs.forkToken(globalToken);\n\t\t\t\t\t\t\tawait availableAPIs.startTask({ file: fileLink.path, argPassed: [ ...(fileLink.args || []), path ], token: newToken });\n\t\t\t\t\t\t}\n\t\t\t\t\t} else {\n\t\t\t\t\t\tdisplayResult.innerText = await availableAPIs.lookupLocale(\"MORE_PERMISSION_DENIED\");\n\t\t\t\t\t}\n\t\t\t\t}\n\t\t\t} else {\n\t\t\t\tdisplayResult.innerText = (await availableAPIs.lookupLocale(\"FILE_STRUCT_BROWSE_FAIL\")).replace(\"%s\", (await availableAPIs.lookupLocale(\"UNKNOWN_FS_STRUCT\")).replace(\"%s\", type));\n\t\t\t}\n\t\t} catch (e) {\n\t\t\tdisplayResult.innerText = (await availableAPIs.lookupLocale(\"FILE_STRUCT_BROWSE_FAIL\")).replace(\"%s\", await availableAPIs.lookupLocale(e.message));\n\t\t}\n\t}\n\tbrowse();\n\tbrowseButton.onclick = browse;\n})();\nasync function recursiveRemove(path) {\n\tlet dirList = await availableAPIs.fs_ls({ path });\n\tfor (let fileIndex in dirList) {\n\t\tlet file = dirList[fileIndex];\n\t\tif (await availableAPIs.fs_isDirectory({ path: path + \"/\" + file })) await recursiveRemove(path + \"/\" + file);\n\t\telse await availableAPIs.fs_rm({ path: path + \"/\" + file });\n\t}\n\tawait availableAPIs.fs_rm({ path });\n}\nasync function isDirectory(path) {\n\ttry {\n\t\tlet isDirectoryVar = await availableAPIs.fs_isDirectory({ path });\n\t\treturn isDirectoryVar ? \"directory\" : \"file\";\n\t} catch {\n\t\treturn \"unknown\";\n\t}\n}\naddEventListener(\"signal\", async function(e) {\n\tif (e.detail == 15) {\n\t\ttry {\n\t\t\tif (globalToken) await availableAPIs.revokeToken(globalToken);\n\t\t} catch {}\n\t\tawait window.availableAPIs.terminate();\n\t}\n}); null;", token);
				await modules.fs.chown(appPath, "root", token);
				await modules.fs.chgrp(appPath, "root", token);
				await modules.fs.chmod(appPath, "rx", token);
			}
			// ../apps/filePicker.js
			async function filePickerInstaller(target, token) {
				let neededApps = await modules.fs.ls(target + "/", token);
				if (!neededApps.includes("apps")) await modules.fs.mkdir(target + "/apps", token);
				await modules.fs.chown(target + "/apps", "root", token);
				await modules.fs.chgrp(target + "/apps", "root", token);
				await modules.fs.chmod(target + "/apps", "rx", token);
				let appPath = target + "/apps/filePicker.js";
				await modules.fs.write(appPath, "let ipcChannel = exec_args[0];\n(async function() {\n\t// @pcos-app-mode isolatable\n\tif (!ipcChannel) return availableAPIs.terminate();\n\tawait availableAPIs.windowTitleSet(await availableAPIs.lookupLocale(\"FILE_PICKER\"));\n\tdocument.body.style.fontFamily = \"'Segoe UI', Tahoma, Geneva, Verdana, sans-serif\";\n\tif (await availableAPIs.isDarkThemed()) document.body.style.color = \"white\";\n\tlet privileges = await availableAPIs.getPrivileges();\n\tlet checklist = [ \"FS_READ\", \"FS_LIST_PARTITIONS\", \"IPC_SEND_PIPE\" ];\n\tif (!checklist.every(p => privileges.includes(p))) {\n\t\tif (privileges.includes(\"IPC_SEND_PIPE\")) await availableAPIs.sendToPipe({ pipe: ipcChannel, data: { success: false, reason: \"permissions\" } });\n\t\treturn availableAPIs.terminate();\n\t}\n\tdocument.body.innerText = \"\";\n\tlet mainComponent = document.createElement(\"div\");\n\tlet pathInputForm = document.createElement(\"form\");\n\tlet pathElement = document.createElement(\"input\");\n\tpathElement.value = exec_args[2] || \"\";\n\tlet browseButton = document.createElement(\"button\");\n\tlet displayResult = document.createElement(\"div\");\n\tlet newItemInput = document.createElement(\"input\");\n\tlet newItemBrowse = document.createElement(\"button\");\n\tlet newItemContainer = document.createElement(\"div\");\n\tlet previousDirectory = \"\";\n\tlet isDefaultChoice = true;\n\tmainComponent.style.display = \"flex\";\n\tmainComponent.style.flexDirection = \"column\";\n\tmainComponent.style.width = \"100%\";\n\tmainComponent.style.height = \"100%\";\n\tmainComponent.style.position = \"absolute\";\n\tmainComponent.style.top = \"0\";\n\tmainComponent.style.left = \"0\";\n\tmainComponent.style.padding = \"8px\";\n\tmainComponent.style.boxSizing = \"border-box\";\n\tdisplayResult.style.flex = \"1\";\n\tnewItemBrowse.innerText = await availableAPIs.lookupLocale(\"SAVE_BTN\");\n\tnewItemContainer.appendChild(document.createElement(\"hr\"));\n\tnewItemContainer.appendChild(newItemInput);\n\tbrowseButton.innerText = await availableAPIs.lookupLocale(\"BROWSE_FEXP\");\n\tnewItemContainer.appendChild(newItemBrowse);\n\tpathInputForm.appendChild(pathElement);\n\tpathInputForm.appendChild(browseButton);\n\tmainComponent.appendChild(pathInputForm);\n\tmainComponent.appendChild(displayResult);\n\tmainComponent.appendChild(newItemContainer);\n\tdocument.body.appendChild(mainComponent);\n\tnewItemContainer.hidden = exec_args[1] != \"save\";\n\tasync function browse() {\n\t\tlet path = pathElement.value;\n\t\tif (path.endsWith(\"/\")) path = path.substring(0, path.length - 1);\n\t\tdisplayResult.innerText = \"\";\n\t\tif (path == \"\") {\n\t\t\tlet partitions = await availableAPIs.fs_mounts();\n\t\t\tfor (let partition of partitions) {\n\t\t\t\tlet openButton = document.createElement(\"button\");\n\t\t\t\topenButton.innerText = partition;\n\t\t\t\topenButton.onclick = function() {\n\t\t\t\t\tpathElement.value = partition;\n\t\t\t\t\tbrowse();\n\t\t\t\t}\n\t\t\t\tdisplayResult.appendChild(openButton);\n\t\t\t}\n\t\t\tpreviousDirectory = path;\n\t\t\treturn \"browsed\";\n\t\t}\n\t\ttry {\n\t\t\tlet type = await isDirectory(path);\n\t\t\tif (type == \"directory\") {\n\t\t\t\tlet ls = await availableAPIs.fs_ls({ path: path });\n\t\t\t\tfor (let file of ls) {\n\t\t\t\t\tlet openButton = document.createElement(\"button\");\n\t\t\t\t\topenButton.innerText = file;\n\t\t\t\t\topenButton.onclick = function() {\n\t\t\t\t\t\tpathElement.value = path + \"/\" + file;\n\t\t\t\t\t\tbrowse();\n\t\t\t\t\t}\n\t\t\t\t\tdisplayResult.appendChild(openButton);\n\t\t\t\t}\n\t\t\t\tpreviousDirectory = path;\n\t\t\t} else if (type == \"file\" || (type == \"unknown\" && exec_args[1] == \"save\")) {\n\t\t\t\tif (isDefaultChoice) {\n\t\t\t\t\tpathElement.value = path.split(\"/\").slice(0, -1).join(\"/\");\n\t\t\t\t\treturn browse();\n\t\t\t\t}\n\t\t\t\tdisplayResult.innerText = \"\";\n\t\t\t\tawait availableAPIs.sendToPipe({ pipe: ipcChannel, data: { success: true, selected: path } });\n\t\t\t\tawait availableAPIs.terminate();\n\t\t\t} else {\n\t\t\t\tdisplayResult.innerText = (await availableAPIs.lookupLocale(\"FILE_STRUCT_BROWSE_FAIL\")).replace(\"%s\", (await availableAPIs.lookupLocale(\"UNKNOWN_FS_STRUCT\")).replace(\"%s\", type));\n\t\t\t}\n\t\t} catch (e) {\n\t\t\tdisplayResult.innerText = (await availableAPIs.lookupLocale(\"FILE_STRUCT_BROWSE_FAIL\")).replace(\"%s\", await availableAPIs.lookupLocale(e.message));\n\t\t}\n\t\tisDefaultChoice = false;\n\t}\n\tbrowse();\n\tbrowseButton.onclick = browse;\n\tnewItemBrowse.onclick = async function() {\n\t\tif (previousDirectory == \"\") return displayResult.innerText = (await availableAPIs.lookupLocale(\"FILE_STRUCT_BROWSE_FAIL\")).replace(\"%s\", await availableAPIs.lookupLocale(\"NO_SAVE_IN_MTN\"));\n\t\tpathElement.value = previousDirectory + \"/\" + newItemInput.value;\n\t\tbrowse();\n\t}\n})();\nasync function isDirectory(path) {\n\ttry {\n\t\tlet isDirectoryVar = await availableAPIs.fs_isDirectory({ path });\n\t\treturn isDirectoryVar ? \"directory\" : \"file\";\n\t} catch {\n\t\treturn \"unknown\";\n\t}\n}\naddEventListener(\"signal\", async function(e) {\n\tif (e.detail == 15) {\n\t\ttry {\n\t\t\tawait availableAPIs.sendToPipe({ pipe: ipcChannel, data: { success: false, reason: \"closed\" } });\n\t\t} catch {}\n\t\tawait window.availableAPIs.terminate();\n\t}\n}); null;", token);
				await modules.fs.chown(appPath, "root", token);
				await modules.fs.chgrp(appPath, "root", token);
				await modules.fs.chmod(appPath, "rx", token);
			}
			// ../apps/installer.js
			async function installerInstaller(target, token) {
				let neededApps = await modules.fs.ls(target + "/", token);
				if (!neededApps.includes("apps")) await modules.fs.mkdir(target + "/apps", token);
				await modules.fs.chown(target + "/apps", "root", token);
				await modules.fs.chgrp(target + "/apps", "root", token);
				await modules.fs.chmod(target + "/apps", "rx", token);
				let appPath = target + "/apps/installer.js";
				await modules.fs.write(appPath, "let onClose = () => availableAPIs.terminate();\n(async function() {\n    // @pcos-app-mode isolatable\n    await availableAPIs.windowVisibility(false);\n\n    let partList = [];\n    try {\n        partList = await availableAPIs.lldaList();\n    } catch {\n        await availableAPIs.lldaInitPartitions();\n    }\n\n    if (!partList.includes(\"data\")) {\n        let partData = await availableAPIs.lldaRead({ partition: \"data\" });\n        let partId;\n        try {\n            partId = partData.id;\n        } catch {}\n        if (!partId) partId = (await availableAPIs.cspOperation({\n            cspProvider: \"basic\",\n            operation: \"random\",\n            cspArgument: new Uint8Array(64)\n        })).reduce((a, b) => a + b.toString(16).padStart(2, \"0\"), \"\")\n        await availableAPIs.lldaWrite({\n            partition: \"data\",\n            data: {\n                files: {},\n                permissions: {},\n                id: partId\n            }\n        });\n    }\n    await availableAPIs.lldaWrite({\n        partition: \"boot\",\n        data: `\n            try {\n                const AsyncFunction = (async () => {}).constructor;\n                let pre_boot_part = coreExports.disk.partition(\"data\").getData();\n                let pre_boot_modules = pre_boot_part?.files;\n                if (!pre_boot_modules) {\n                    coreExports.tty_bios_api.println(\"No files were found in the storage partition\");\n                    throw new Error(\"No files were found in the storage partition\");\n                }\n                pre_boot_modules = pre_boot_modules[coreExports.bootSection || \"boot\"];\n                if (!pre_boot_modules) {\n                    coreExports.tty_bios_api.println(\"No boot modules were found\");\n                    throw new Error(\"No boot modules were found\");\n                }\n                let pre_boot_module_list = Object.keys(pre_boot_modules);\n                pre_boot_module_list = pre_boot_module_list.sort((a, b) => a.localeCompare(b));\n                let pre_boot_module_script = \"\";\n                for (let module of pre_boot_module_list) {\n                    if (coreExports.bootMode == \"logboot\") pre_boot_module_script += \"coreExports.tty_bios_api.println(\" + JSON.stringify(module) + \");\\\\n\";\n                    pre_boot_module_script += await coreExports.idb.readPart(pre_boot_part.id + \"-\" + pre_boot_modules[module]);\n                }\n                await new AsyncFunction(pre_boot_module_script)();\n            } catch (e) {\n                coreExports.tty_bios_api.println(\"Boot failed\");\n                coreExports.tty_bios_api.println(\"Press Enter to continue and log this error locally\");\n                await coreExports.tty_bios_api.inputLine();\n                throw e;\n            }\n            `\n    });\n    try {\n        await availableAPIs.fs_mount({\n            mountpoint: \"target\",\n            filesystem: \"PCFSiDBMount\",\n            filesystemOptions: {\n                partition: \"data\"\n            }\n        });\n        await availableAPIs.fs_chown({ path: \"target\", newUser: \"root\" });\n        await availableAPIs.fs_chgrp({ path: \"target\", newGrp: \"root\" });\n        await availableAPIs.fs_chmod({ path: \"target\", newPermissions: \"rx\" });\n        try {\n            await recursiveRemove(\"target/boot\");\n        } catch {}\n        try {\n            await availableAPIs.fs_mkdir({ path: \"target/boot\" });\n        } catch {}\n        await recursiveCopy((await availableAPIs.getSystemMount()) + \"/boot\", \"target/boot\", true);\n        let systemCode = \"let localSystemMount = \\\"storage\\\";\\nlet mountOptions = {\\n\\tpartition: \\\"data\\\"\\n};\\ntry {\\n\\tmodules.fs.mounts[localSystemMount] = await modules.mounts.PCFSiDBMount(mountOptions);\\n\\tmodules.defaultSystem = localSystemMount;\\n} catch (e) {\\n\\tawait panic(\\\"SYSTEM_PARTITION_MOUNTING_FAILED\\\", { underlyingJS: e, name: \\\"fs.mounts\\\", params: [localSystemMount, mountOptions]});\\n}\\n\";\n        await availableAPIs.fs_write({ path: \"target/boot/01-fsboot.js\", data: systemCode });\n        await availableAPIs.shutdown({ isReboot: true });\n        await availableAPIs.terminate();\n    } catch (e) {\n        await availableAPIs.terminate();\n    }\n})();\n\nasync function recursiveCopy(source, destination, permissions) {\n    let filesToCopy = await availableAPIs.fs_ls({ path: source });\n    for (let sourceFileIndex in filesToCopy) {\n        let sourceFile = filesToCopy[sourceFileIndex];\n        let destinationFile = destination + \"/\" + sourceFile;\n        if (await availableAPIs.fs_isDirectory({ path: source + \"/\" + sourceFile })) {\n            try {\n                await availableAPIs.fs_mkdir({ path: destinationFile });\n            } catch {}\n            await recursiveCopy(source + \"/\" + sourceFile, destinationFile, permissions);\n        } else {\n            await availableAPIs.fs_write({\n                path: destinationFile,\n                data: await availableAPIs.fs_read({ path: source + \"/\" + sourceFile })\n            });\n        }\n        if (permissions) {\n            let originalPermissions = await availableAPIs.fs_permissions({ path: source + \"/\" + sourceFile });\n            await availableAPIs.fs_chmod({ path: destinationFile, newPermissions: originalPermissions.world });\n            await availableAPIs.fs_chgrp({ path: destinationFile, newGrp: originalPermissions.group });\n            await availableAPIs.fs_chown({ path: destinationFile, newUser: originalPermissions.owner });\n        }\n    }\n}\n\nasync function recursiveRemove(target) {\n    let filesToRemove = await availableAPIs.fs_ls({ path: target });\n    for (let targetFileIndex in filesToRemove) {\n        let targetFile = filesToRemove[targetFileIndex];\n        targetFile = target + \"/\" + targetFile;\n        if (await availableAPIs.fs_isDirectory({ path: targetFile })) await recursiveRemove(targetFile);\n        await availableAPIs.fs_rm({ path: targetFile });\n    }\n}\n\naddEventListener(\"signal\", async function(e) {\n    if (e.detail == 15) onClose();\n}); ", token);
				await modules.fs.chown(appPath, "root", token);
				await modules.fs.chgrp(appPath, "root", token);
				await modules.fs.chmod(appPath, "rx", token);
			}
			// ../apps/secondstage.js
			async function secondstageInstaller(target, token) {
				let neededApps = await modules.fs.ls(target + "/", token);
				if (!neededApps.includes("apps")) await modules.fs.mkdir(target + "/apps", token);
				await modules.fs.chown(target + "/apps", "root", token);
				await modules.fs.chgrp(target + "/apps", "root", token);
				await modules.fs.chmod(target + "/apps", "rx", token);
				let appPath = target + "/apps/secondstage.js";
				await modules.fs.write(appPath, "(async function() {\n\t// @pcos-app-mode isolatable\n    await availableAPIs.windowVisibility(false);\n    let defaultSystem = await availableAPIs.getSystemMount();\n\tawait availableAPIs.setUserInfo({\n\t\tdesiredUser: \"root\",\n\t\tinfo: {\n\t\t\tsecurityChecks: [\n\t\t\t\t{\n\t\t\t\t\ttype: \"timeout\",\n\t\t\t\t\ttimeout: 1\n\t\t\t\t}\n\t\t\t],\n\t\t\tgroups: [ \"root\", \"users\" ],\n\t\t\thomeDirectory: defaultSystem + \"/root\"\n\t\t}\n\t});\n\ttry {\n\t\tawait availableAPIs.fs_mkdir({ path: defaultSystem + \"/root\" });\n\t} catch {}\n\tawait availableAPIs.fs_chown({ path: defaultSystem + \"/root\", newUser: \"root\" });\n\tawait availableAPIs.fs_chgrp({ path: defaultSystem + \"/root\", newGrp: \"root\" });\n\tawait availableAPIs.fs_chmod({ path: defaultSystem + \"/root\", newPermissions: \"rx\" });\n\tawait availableAPIs.fs_write({\n\t\tpath: defaultSystem + \"/root/.darkmode\",\n\t\tdata: \"false\"\n\t});\n\tawait availableAPIs.fs_chown({ path: defaultSystem + \"/root/.darkmode\", newUser: \"root\" });\n\tawait availableAPIs.fs_chgrp({ path: defaultSystem + \"/root/.darkmode\", newGrp: \"root\" });\n\tawait availableAPIs.fs_chmod({ path: defaultSystem + \"/root/.darkmode\", newPermissions: \"rx\" });\n\tawait availableAPIs.fs_write({\n\t\tpath: defaultSystem + \"/etc/darkLockScreen\",\n\t\tdata: \"false\"\n\t});\n\tawait availableAPIs.fs_rm({ path: defaultSystem + \"/boot/17-installer-secondstage.js\" });\n\tawait availableAPIs.fs_rm({ path: defaultSystem + \"/boot/01-setup-state.js\" });\n\tawait availableAPIs.runKlvlCode(\"delete modules.settingUp;\");\n\tawait availableAPIs.fs_rm({ path: defaultSystem + \"/boot/15-apps.js\" });\n\tawait availableAPIs.fs_write({\n\t\tpath: defaultSystem + \"/boot/14-logon-requirement-enforce.js\",\n\t\tdata: \"requireLogon();\\n\"\n\t});\n\tawait availableAPIs.terminate();\n})();\naddEventListener(\"signal\", async function(e) {\n\tif (e.detail == 15) {\n\t\tawait window.availableAPIs.terminate();\n\t}\n});", token);
				await modules.fs.chown(appPath, "root", token);
				await modules.fs.chgrp(appPath, "root", token);
				await modules.fs.chmod(appPath, "rx", token);
			}
			// ../apps/textEditor.js
			async function textEditorInstaller(target, token) {
				let neededApps = await modules.fs.ls(target + "/", token);
				if (!neededApps.includes("apps")) await modules.fs.mkdir(target + "/apps", token);
				await modules.fs.chown(target + "/apps", "root", token);
				await modules.fs.chgrp(target + "/apps", "root", token);
				await modules.fs.chmod(target + "/apps", "rx", token);
				let neededAppsLinks = await modules.fs.ls(target + "/apps", token);
				if (!neededAppsLinks.includes("links")) await modules.fs.mkdir(target + "/apps/links", token);
				await modules.fs.chown(target + "/apps/links", "root", token);
				await modules.fs.chgrp(target + "/apps/links", "root", token);
				await modules.fs.chmod(target + "/apps/links", "rx", token);
				let neededAppsAssocs = await modules.fs.ls(target + "/apps", token);
				if (!neededAppsAssocs.includes("associations")) await modules.fs.mkdir(target + "/apps/associations", token);
				await modules.fs.chown(target + "/apps/associations", "root", token);
				await modules.fs.chgrp(target + "/apps/associations", "root", token);
				await modules.fs.chmod(target + "/apps/associations", "rx", token);
				let appPath = target + "/apps/textEditor.js";
				let linkPath = target + "/apps/links/textEditor.lnk";
				let lrn = "TEXT_EDITOR", name;
				await modules.fs.write(linkPath, JSON.stringify({
					path: appPath,
					localeReferenceName: lrn,
					name
				}), token);
				await modules.fs.chown(linkPath, "root", token);
				await modules.fs.chgrp(linkPath, "root", token);
				await modules.fs.chmod(linkPath, "rx", token);
				await modules.fs.write(target + "/apps/associations/txt", JSON.stringify({
					path: appPath,
					localeReferenceName: lrn,
					name
				}), token);
				await modules.fs.chown(target + "/apps/associations/txt", "root", token);
				await modules.fs.chgrp(target + "/apps/associations/txt", "root", token);
				await modules.fs.chmod(target + "/apps/associations/txt", "rx", token);
				await modules.fs.write(appPath, "// =====BEGIN MANIFEST=====\n// link: lrn:TEXT_EDITOR\n// association: txt\n// =====END MANIFEST=====\n(async function() {\n\t// @pcos-app-mode isolatable\n\tawait availableAPIs.windowTitleSet(await availableAPIs.lookupLocale(\"TEXT_EDITOR\"));\n\tdocument.body.style.fontFamily = \"'Segoe UI', Tahoma, Geneva, Verdana, sans-serif\";\n\tif (await availableAPIs.isDarkThemed()) document.body.style.color = \"white\";\n\tdocument.documentElement.style.height = \"100%\";\n\tdocument.documentElement.style.width = \"100%\";\n\tdocument.body.style.height = \"100%\";\n\tdocument.body.style.width = \"100%\";\n\tdocument.body.style.margin = \"0\";\n\tlet flexContainer = document.createElement(\"div\");\n\tlet buttonContainer = document.createElement(\"div\");\n\tlet loadButton = document.createElement(\"button\");\n\tlet saveButton = document.createElement(\"button\");\n\tlet statusMessage = document.createElement(\"span\");\n\tlet data = document.createElement(\"textarea\");\n\tlet hr = document.createElement(\"hr\");\n\tlet hrContainer = document.createElement(\"div\");\n\tlet lastFile = \"\";\n\tloadButton.innerText = await availableAPIs.lookupLocale(\"LOAD_BTN\");\n\tsaveButton.innerText = await availableAPIs.lookupLocale(\"SAVE_BTN\");\n\tflexContainer.style.display = \"flex\";\n\tflexContainer.style.flexDirection = \"column\";\n\tflexContainer.style.width = \"100%\";\n\tflexContainer.style.height = \"100%\";\n\tdata.style.flexGrow = 1000;\n\tdata.style.resize = \"none\";\n\tif (await availableAPIs.isDarkThemed()) {\n\t\tdata.style.backgroundColor = \"#2b2a33\";\n\t\tdata.style.color = \"white\";\n\t}\n\tbuttonContainer.appendChild(loadButton);\n\tbuttonContainer.appendChild(saveButton);\n\tbuttonContainer.appendChild(statusMessage);\n\thrContainer.appendChild(hr);\n\tflexContainer.appendChild(buttonContainer);\n\tflexContainer.appendChild(hrContainer);\n\tflexContainer.appendChild(data);\n\tdocument.body.appendChild(flexContainer);\n\ttry {\n\t\tif (exec_args[0]) {\n\t\t\tdata.value = await availableAPIs.fs_read({ path: exec_args[0] });\n\t\t\tlastFile = exec_args[0];\n\t\t\tstatusMessage.innerText = exec_args[0].split(\"/\").pop();\n\t\t}\n\t} catch (e) {\n\t\tstatusMessage.innerText = e.name + \": \" + e.message;\n\t}\n\tloadButton.onclick = async function() {\n\t\tlet ipcPipe = await availableAPIs.createPipe();\n\t\tawait availableAPIs.windowVisibility(false);\n\t\tawait availableAPIs.startTask({ file: (await availableAPIs.getSystemMount()) + \"/apps/filePicker.js\", argPassed: [ipcPipe, \"load\", lastFile] });\n\t\tlet result = await availableAPIs.listenToPipe(ipcPipe);\n\t\tawait availableAPIs.closePipe(ipcPipe);\n\t\tawait availableAPIs.windowVisibility(true);\n\t\ttry {\n\t\t\tif (result.success) {\n\t\t\t\tdata.value = await availableAPIs.fs_read({ path: result.selected });\n\t\t\t\tlastFile = result.selected;\n\t\t\t\tstatusMessage.innerText = result.selected.split(\"/\").pop();\n\t\t\t}\n\t\t} catch (e) {\n\t\t\tstatusMessage.innerText = e.name + \": \" + e.message;\n\t\t}\n\t}\n\tsaveButton.onclick = async function() {\n\t\tlet ipcPipe = await availableAPIs.createPipe();\n\t\tawait availableAPIs.windowVisibility(false);\n\t\tawait availableAPIs.startTask({ file: (await availableAPIs.getSystemMount()) + \"/apps/filePicker.js\", argPassed: [ipcPipe, \"save\", lastFile] });\n\t\tlet result = await availableAPIs.listenToPipe(ipcPipe);\n\t\tawait availableAPIs.closePipe(ipcPipe);\n\t\tawait availableAPIs.windowVisibility(true);\n\t\ttry {\n\t\t\tif (result.success) {\n\t\t\t\tawait availableAPIs.fs_write({ path: result.selected, data: data.value });\n\t\t\t\tlastFile = result.selected;\n\t\t\t\tstatusMessage.innerText = result.selected.split(\"/\").pop();\n\t\t\t}\n\t\t} catch (e) {\n\t\t\tstatusMessage.innerText = e.name + \": \" + e.message;\n\t\t}\n\t}\n})();\naddEventListener(\"signal\", async function(e) {\n\tif (e.detail == 15) await window.availableAPIs.terminate();\n}); null;", token);
				await modules.fs.chown(appPath, "root", token);
				await modules.fs.chgrp(appPath, "root", token);
				await modules.fs.chmod(appPath, "rx", token);
			}
			
// 17-installer-secondstage.js
async function secondstage() {
	// @pcos-app-mode native
	let window = modules.window;
	let windowDiv = window(modules.session.active);
	windowDiv.closeButton.classList.toggle("hidden", true);
	let krnlDiv = document.createElement("div");
	let description = document.createElement("span");
	let progressBar = document.createElement("progress");
	progressBar.id = "secondStageProgress";
	krnlDiv.style.padding = "8px";
	krnlDiv.appendChild(description);
	krnlDiv.appendChild(document.createElement("hr"));
	krnlDiv.appendChild(progressBar);
	windowDiv.content.appendChild(krnlDiv);
	let appScripts = await modules.fs.read(modules.defaultSystem + "/boot/15-apps.js");
	let apps = appScripts.match(/async function (.+)Installer\(target, token\)/g).map(a => a.split(" ")[2].split("(")[0]);
	progressBar.max = apps.length;
	progressBar.value = 0;
	description.innerHTML = modules.locales.get("INSTALLING_PCOS").replace("%s", modules.locales.get("INSTALLING_APPS"));
	let fireAfterInstall = null;
	let firesAfterInstall = new Promise(r => fireAfterInstall = r);
	let installerCode = "(async function() {"
	for (let app of apps) installerCode += `await ${app}(modules.defaultSystem); secondStageProgress.value++;\n`;
	installerCode += "fireAfterInstall(); })();";
	eval(installerCode);
	await firesAfterInstall;
	progressBar.removeAttribute("max");
	progressBar.removeAttribute("value");
	description.innerHTML = modules.locales.get("INSTALLING_PCOS").replace("%s", modules.locales.get("ACCESS_REQUEST_TITLE"));
	let token;
	let usersConfigured = await modules.users.configured();
	if (usersConfigured) {
		token = await new Promise(async function(resolve) {
			let consentui = await modules.consentui(modules.session.systemSession, {
				path: modules.defaultSystem + "/apps/secondstage.js",
				args: [ "usersConfigured" ],
				intent: modules.locales.get("SECONDSTAGE_INSTALLER_INTENT"),
				name: modules.locales.get("SET_UP_PCOS")
			});
			consentui.hook(async function(msg) {
				if (msg.success) return resolve(msg.token);
				modules.restart(true);
			});
		});
	} else {
		await modules.users.init();
		token = await modules.tokens.generate();
		await modules.tokens.userInitialize(token, "root");
	}
	krnlDiv.remove();
	let taskId = await modules.tasks.exec(modules.defaultSystem + "/apps/secondstage.js", [ usersConfigured ? "usersConfigured" : "" ], windowDiv, token, false);
	await modules.tasks.waitTermination(taskId);
	requireLogon();
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