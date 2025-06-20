// This is a generated file. Please modify the corresponding files, not this file directly.
// (c) Copyright 2025 PCsoft. MIT license: https://spdx.org/licenses/MIT.html
// modules/.../boot/00-pcos.js
// @pcos-app-mode native
const pcos_version = "1298";
const build_time = 1750439783835;
 
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
	modules.core.tty_bios_api.println("PCsoft PCOS 3, build " + pcos_version);
	modules.core.tty_bios_api.println("Logical processors: " + navigator.hardwareConcurrency);
	modules.core.tty_bios_api.println("Memory available: " + ((navigator.deviceMemory * 1024) || "<unavailable>") + " MB");
}
startupMemo();
// modules/.../boot/00-pcosksk.js
async function ksk() {
	// @pcos-app-mode native
	// Key signing key
	let ksk = {"kty":"EC","x":"2iqPpmoqWFYGIjoCYAZvyDeGN2MeB2kkEdKeSswMPEc","y":"6ZSKXt7HqvB8cWya7j9dC6x36DDgHLndX6qeMMnh7s4","crv":"P-256"};
	if (ksk.stub == "present") {
		let e = new Error("The key signing key was not built into this build.");
		panic("KEY_SIGNING_KEY_NOT_BUILT", {
			name: "ksk",
			params: [ "stub" ],
			underlyingJS: e
		});
		throw e;
	}
	if (ksk.stub != "present") modules.ksk = ksk;
	if (modules.ksk) {
		try {
			modules.ksk_imported = await crypto.subtle.importKey("jwk", modules.ksk, {
				name: "ECDSA",
				namedCurve: "P-256"
			}, false, ["verify"]);
		} catch (e) {
			panic("KEY_SIGNING_KEY_IMPORT_FAILED", {
				name: "ksk",
				underlyingJS: e
			});
			throw e;
		}
	}
}
await ksk();
// modules/.../boot/01-fs.js
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
			if (!this.mounts[mount].read_only && modules.core.bootMode != "readonly" && !force) await this.sync(mount, sessionToken);
			if (!force) await this.mounts[mount].unmount(sessionToken);
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
			if (!path.split("/").slice(1).join("/")) return true;
			if (!this.mounts[mount].directory_supported) return false;
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
			if (!this.mounts[mount].read_only && modules.core.bootMode != "readonly") return await this.mounts[mount].sync(sessionToken);
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
				if (!files.hasOwnProperty(basename)) this.backend = this._recursive_op(this.backend, "files/" + key, { type: "write", value: id });
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
				this.backend = this._recursive_op(this.backend, "files/" + key, { type: "delete" });
				let backend = this.backend;
				delete backend.permissions[key];
				this.backend = backend;
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
				this.backend = this._recursive_op(this.backend, "files/" + directory, { type: "write", value: {} });
			},
			permissions: async function(file) {
				file = String(file);
				let properFile = file.split("/")
				if (properFile[0] == "") properFile = properFile.slice(1);
				if (properFile[properFile.length - 1] == "") properFile = properFile.slice(0, -1);
				properFile = properFile.join("/");
				let randomNames = crypto.getRandomValues(new Uint8Array(8)).reduce((a, b) => a + b.toString(16).padStart(2, "0"), "");
				let permissions = this.backend.permissions[properFile] || {};
				return {
					owner: permissions.owner || randomNames,
					group: permissions.group || randomNames,
					world: permissions.world || "",
					random: !(permissions.owner || permissions.group || permissions.world) ? true : undefined
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
			_recursive_op: function(obj, path, action, stage = 0) {
				if (path.split("/").length == (stage + 1)) {
					if (action.type == "delete") delete obj[path.split("/").slice(-1)[0]];
					if (action.type == "write") obj[path.split("/").slice(-1)[0]] = action.value;
				} else obj[path.split("/")[stage]] = this._recursive_op(obj[path.split("/")[stage]], path, action, stage + 1);
				return obj;
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
				if (!files.hasOwnProperty(basename)) await this.setBackend(this._recursive_op(await this.getBackend(), "files/" + key, { type: "write", value: id }));
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
				await this.setBackend(this._recursive_op(await this.getBackend(), "files/" + key, { type: "delete" }));
				let backend = await this.getBackend();
				delete backend.permissions[key];
				await this.setBackend(backend);
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
				await this.setBackend(this._recursive_op(await this.getBackend(), "files/" + directory, { type: "write", value: {} }));
			},
			permissions: async function(file) {
				file = String(file);
				let properFile = file.split("/")
				if (properFile[0] == "") properFile = properFile.slice(1);
				if (properFile[properFile.length - 1] == "") properFile = properFile.slice(0, -1);
				properFile = properFile.join("/");
				let randomNames = crypto.getRandomValues(new Uint8Array(8)).reduce((a, b) => a + b.toString(16).padStart(2, "0"), "");
				let permissions = (await this.getBackend()).permissions[properFile] || {};
				return {
					owner: permissions.owner || randomNames,
					group: permissions.group || randomNames,
					world: permissions.world || "",
					random: !(permissions.owner || permissions.group || permissions.world) ? true : undefined
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
			_recursive_op: function(obj, path, action, stage = 0) {
				if (path.split("/").length == (stage + 1)) {
					if (action.type == "delete") delete obj[path.split("/").slice(-1)[0]];
					if (action.type == "write") obj[path.split("/").slice(-1)[0]] = action.value;
				} else obj[path.split("/")[stage]] = this._recursive_op(obj[path.split("/")[stage]], path, action, stage + 1);
				return obj;
			},
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
				if (!files.hasOwnProperty(basename)) this.backend = this._recursive_op(this.backend, "files/" + key, { type: "write", value: id });
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
				this.backend = this._recursive_op(this.backend, "files/" + key, { type: "delete" });
				let backend = this.backend;
				delete backend.permissions[key];
				this.backend = backend;
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
				this.backend = this._recursive_op(this.backend, "files/" + directory, { type: "write", value: {} });
			},
			permissions: async function(file) {
				file = String(file);
				let properFile = file.split("/")
				if (properFile[0] == "") properFile = properFile.slice(1);
				if (properFile[properFile.length - 1] == "") properFile = properFile.slice(0, -1);
				properFile = properFile.join("/");
				let randomNames = crypto.getRandomValues(new Uint8Array(8)).reduce((a, b) => a + b.toString(16).padStart(2, "0"), "");
				let permissions = this.backend.permissions[properFile] || {};
				return {
					owner: permissions.owner || randomNames,
					group: permissions.group || randomNames,
					world: permissions.world || "",
					random: !(permissions.owner || permissions.group || permissions.world) ? true : undefined
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
			_recursive_op: function(obj, path, action, stage = 0) {
				if (path.split("/").length == (stage + 1)) {
					if (action.type == "delete") delete obj[path.split("/").slice(-1)[0]];
					if (action.type == "write") obj[path.split("/").slice(-1)[0]] = action.value;
				} else obj[path.split("/")[stage]] = this._recursive_op(obj[path.split("/")[stage]], path, action, stage + 1);
				return obj;
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
	
	function preferenceMount(options) {
		return {
			read: a => JSON.stringify(modules.core.prefs.read(a), null, "\t"),
			write: (a, b) => modules.core.prefs.write(a, JSON.parse(b)),
			rm: a => modules.core.prefs.rm(a),
			ls: a => modules.core.prefs.ls(a),
			permissions: function() {
				let randomNames = crypto.getRandomValues(new Uint8Array(8)).reduce((a, b) => a + b.toString(16).padStart(2, "0"), "");
				return {
					owner: randomNames,
					group: randomNames,
					world: "",
				};
			},
			chown: _ => !1,
			chgrp: _ => !1,
			chmod: _ => !1,
			sync: () => true,
			unmount: () => true,
			directory_supported: false,
			read_only: !!options.read_only,
			filesystem: "preffs",
			permissions_supported: true
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

	async function fileMount(options) {
		let file = JSON.parse(await modules.fs.read(options.srcFile));
		let backend = file.backend;
		delete file.backend;
		let files = file.files;
		delete file.files;
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
				return String(this.files[files]);
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
				this.files[id] = value;
				if (!files.hasOwnProperty(basename)) this.backend = this._recursive_op(this.backend, "files/" + key, { type: "write", value: id });
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
				if (typeof files === "string") delete this.files[files];
				this.backend = this._recursive_op(this.backend, "files/" + key, { type: "delete" });
				let backend = this.backend;
				delete backend.permissions[key];
				this.backend = backend;
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
				this.backend = this._recursive_op(this.backend, "files/" + directory, { type: "write", value: {} });
			},
			permissions: async function(file) {
				file = String(file);
				let properFile = file.split("/")
				if (properFile[0] == "") properFile = properFile.slice(1);
				if (properFile[properFile.length - 1] == "") properFile = properFile.slice(0, -1);
				properFile = properFile.join("/");
				let randomNames = crypto.getRandomValues(new Uint8Array(8)).reduce((a, b) => a + b.toString(16).padStart(2, "0"), "");
				let permissions = this.backend.permissions[properFile] || {};
				return {
					owner: permissions.owner || randomNames,
					group: permissions.group || randomNames,
					world: permissions.world || "",
					random: !(permissions.owner || permissions.group || permissions.world) ? true : undefined
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
			_recursive_op: function(obj, path, action, stage = 0) {
				if (path.split("/").length == (stage + 1)) {
					if (action.type == "delete") delete obj[path.split("/").slice(-1)[0]];
					if (action.type == "write") obj[path.split("/").slice(-1)[0]] = action.value;
				} else obj[path.split("/")[stage]] = this._recursive_op(obj[path.split("/")[stage]], path, action, stage + 1);
				return obj;
			},
			sync: async function() {
				return await modules.fs.write(options.srcFile, JSON.stringify({ ...file, backend: this.backend, files: this.files }));
			},
			unmount: () => true,
			directory_supported: true,
			read_only: !!options.read_only,
			filesystem: "filefs",
			permissions_supported: true,
			backend: backend,
			files: files
		};
	}

	async function overlayMount(options) {
		return {
			read: function(key, token) {
				return this._basic_first_op("read", key, token);
			},
			write: function(key, value, token) {
				return this._basic_first_op("write", key, value, token);
			},
			rm: function(key, token) {
				return this._basic_first_op("rm", key, token);
			},
			ls: async function(directory, token) {
				let listing = [], commonErrorMessages = {}, errors = 0;
				for (let mount of options.mounts) {
					try {
						listing.push(...(await modules.fs.ls(mount + "/" + directory, token)));
					} catch (e) {
						errors++;
						commonErrorMessages[e.message] = (commonErrorMessages[e.message] || 0) + 1;
					}
				}
				if (errors == options.mounts.length) throw new Error(Object.entries(commonErrorMessages).sort((a, b) => b[1] - a[1])[0][0]);
				return Array.from(new Set(listing));
			},
			mkdir: function(directory, token) {
				return this._basic_first_op("mkdir", directory, token);
			},
			permissions: async function(file, token) {
				let commonErrorMessages = {}, checkedHowMany = 0;
				for (let mount of options.mounts) {
					try {
						checkedHowMany++;
						let permissions = await modules.fs.permissions(mount + "/" + file, token);
						if (permissions.random && checkedHowMany != options.mounts.length)
							throw new Error("PERMISSION_DENIED");
						return permissions;
					} catch (e) {
						commonErrorMessages[e.message] = (commonErrorMessages[e.message] || 0) + 1;
					}
				}
				throw new Error(Object.entries(commonErrorMessages).sort((a, b) => b[1] - a[1])[0][0]);
			},
			chown: function(file, owner, token) {
				return this._basic_first_op("chown", file, owner, token);
			},
			chgrp: function(file, group, token) {
				return this._basic_first_op("chgrp", file, group, token);
			},
			chmod: function(file, permissions, token) {
				return this._basic_first_op("chmod", file, permissions, token);
			},
			isDirectory: function(key, token) {
				return this._basic_first_op("isDirectory", key, token);
			},
			sync: function(token) {
				return this._every_op("sync", token);
			},
			unmount: function(token) {
				if (options.autoManage) return this._every_op("unmount", token);
			},
			_basic_first_op: async function(op, key, ...args) {
				let pathParts = key.split("/");
				if (pathParts[0] == "") pathParts = pathParts.slice(1);
				if (pathParts[pathParts.length - 1] == "") pathParts = pathParts.slice(0, -1);
				key = pathParts.join("/");
				let previousKey = key.split("/").slice(0, -1).join("/");
				let basename = key.split("/").slice(-1).join("/");
				let lookedForMount;
				for (let mount of options.mounts) {
					try {
						let listing = await modules.fs.ls(mount + "/" + previousKey, args[args.length - 1]);
						if (listing.includes(basename)) {
							lookedForMount = mount;
							break;
						}
					} catch {}
				}
				if (lookedForMount) return modules.fs[op](lookedForMount + "/" + key, ...args);
				let commonErrorMessages = {};
				for (let mount of options.mounts) {
					try {
						return await modules.fs[op](mount + "/" + key, ...args);
					} catch (e) {
						commonErrorMessages[e.message] = (commonErrorMessages[e.message] || 0) + 1;
					}
				}
				throw new Error(Object.entries(commonErrorMessages).sort((a, b) => b[1] - a[1])[0][0]);
			},
			_every_op: async function(op) {
				let commonErrorMessages = {}, gotError;
				for (let mount of options.mounts) {
					try {
						await modules.fs[op](mount);
					} catch (e) {
						gotError = true;
						commonErrorMessages[e.message] = (commonErrorMessages[e.message] || 0) + 1;
					}
				}
				if (gotError) throw new Error(Object.entries(commonErrorMessages).sort((a, b) => b[1] - a[1])[0][0]);
			},
			directory_supported: true,
			read_only: !!options.read_only,
			filesystem: "overlayfs",
			permissions_supported: true
		};
	}
	
	fs.mounts["ram"] = ramMount({
		type: "run"
	});
	modules.mounts = {
		PCFSiDBMount,
		PCFSiDBAESCryptMount,
		ramMount,
		preferenceMount,
		SFSPMount,
		IPCMount,
		fileMount,
		overlayMount
	};
	modules.fs = fs;
	modules.defaultSystem = "ram";
}

loadFs();
// modules/.../boot/01-fsck.js
async function fsck() {
	// @pcos-app-mode native
	function println(str) {
		modules.core.tty_bios_api.println(str);
		return new Promise(function(resolve) {
			requestAnimationFrame(resolve);
		})
	}
	let fsckMode;
	try {
		fsckMode = await modules.fs.read(modules.defaultSystem + "/.fsck");
		await modules.fs.rm(modules.defaultSystem + "/.fsck");
	} catch {
		await println("Skipping file system checking.");
		return;
	}
	async function scanLLDA() {
		let fs = modules.fs;
		if (fs.mounts[modules.defaultSystem].read_only) {
			await println("File system is read-only.");
			return { lldaPoints: "abort", lldaId: "abort" };
		}
		if (fs.mounts[modules.defaultSystem].partition.getData) {
			let llda = fs.mounts[modules.defaultSystem].partition.getData().files;
			let lldaId = fs.mounts[modules.defaultSystem].partition.getData().id;
			llda = Object.values(llda);
			while (llda.some(a => typeof a === "object")) llda = llda.map(a => typeof a === "object" ? Object.values(a) : a).flat(); 
			return { lldaPoints: llda, lldaId: lldaId };
		} else {
			await println("Low-level disk access is impossible.");
			return { lldaPoints: "abort", lldaId: "abort" };
		}
	}
	await println("A file system check has been requested.");
	await println("Scanning for file points.");
	let { lldaPoints, lldaId } = await scanLLDA();
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
	await println("Filtering IndexedDB keys...");
	if (fsckMode != "discard-all") idb_keys = idb_keys.filter(a => a.startsWith(lldaId + "-")).map(a => a.slice(lldaId.length + 1));
	await println("Filtered keys: " + idb_keys.length);
	let missingFiles = idb_keys.filter(a => !lldaPoints.includes(a.slice(fsckMode == "discard-all" ? (lldaId + "-").length : 0)));
	await println("Missing files: " + missingFiles.length);
	let llda = modules.fs.mounts[modules.defaultSystem].partition.getData();
	if (fsckMode == "recover") {
		try {
			await modules.fs.mkdir(modules.defaultSystem + "/lost+found");
			await println("Created lost+found directory.");
		} catch {
			await println("Lost+found directory already exists.");
		}
		for (let file of missingFiles) {
			await println("Moving " + file + " to lost+found.");
			llda.files["lost+found"][file] = file;
		}
	} else if (fsckMode == "discard" || fsckMode == "discard-all") {
		for (let file of missingFiles) {
			await println("Deleting " + file + ".");
			await modules.core.idb.removePart((fsckMode == "discard" ? (lldaId + "-") : "") + file);
		}
	} else {
		await println("Unsure what to do, not doing anything.");
	}
	await println("Saving modified file table.");
	modules.fs.mounts[modules.defaultSystem].partition.setData(llda);
	await modules.core.idb.sync();
	await println("File system check complete.");
}
await fsck();
// modules/.../boot/01-fsmodule-pre.js
// @pcos-app-mode native
modules.fs.mounts[".installer"] = modules.mounts.ramMount({});
modules.defaultSystem = ".installer";
modules.fs.mkdir(".installer/modules");
modules.fs.mkdir(".installer/root");
modules.fs.mkdir(".installer/apps");
modules.fs.mkdir(".installer/etc");
modules.fs.mkdir(".installer/etc/wallpapers");
modules.fs.mkdir(".installer/etc/security");
// Live CD
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
// @auto-generated-installer-module-insertion
// modules/00-keys.fs
modules.fs.write(".installer/modules/00-keys.fs", "{\"backend\":{\"files\":{\"etc\":{\"keys\":{\"automaticSigner\":\"5b590de8d1100988eb7b2351035d7445765a42f00a0c20c0a2d29f9c7eedd99cc9a5e5704010eedd81b26479f183dc67bbd82701e7539aebbf17f48dc30c0253\",\"khrl\":{\"list.khrl\":\"88d323b8744bbc440d9ee5058d762e5b8b7d23253db15c2783c01f378cf3eb5fa27db662a0caf977221e0819b751665941b130fae8f43752e8d581bd9b29ba67\"},\"moduleSigner\":\"382c93acd68b23ca0e2861459a8e42fb91c62e5d1f4f1aaeccd2dccd2cd43ca5e101649786e61abe8c957a755e1d672f863c2ff9aa72c629575e81ac1d5f569b\",\"pcosIntermediate\":\"d45882263d172976ca6a4897c5f1b60ca6126c8865256c394da84068ca1ec4b8064e14a81e03f8d22157865d7c3f1ff87fa23ac78504aab1902dfd8269e14536\"}}},\"permissions\":{\"etc/keys/automaticSigner\":{\"world\":\"rx\"},\"etc/keys/khrl/list.khrl\":{\"world\":\"rx\"},\"etc/keys/khrl/\":{\"world\":\"rx\"},\"etc/keys/moduleSigner\":{\"world\":\"rx\"},\"etc/keys/pcosIntermediate\":{\"world\":\"rx\"},\"etc/keys/\":{\"world\":\"rx\"},\"etc/\":{\"world\":\"rx\"},\"\":{\"world\":\"rx\"}}},\"files\":{\"5b590de8d1100988eb7b2351035d7445765a42f00a0c20c0a2d29f9c7eedd99cc9a5e5704010eedd81b26479f183dc67bbd82701e7539aebbf17f48dc30c0253\":\"{\\\"signature\\\":\\\"e76c7e39af89062ced9a680bcf92ae2185c95b55f590449f3c065d801dc2fb9a18be2d5deb6e4d4c30556b3fceef122955e1098b6c2bc790f6efe92414b196ed\\\",\\\"keyInfo\\\":{\\\"key\\\":{\\\"kty\\\":\\\"EC\\\",\\\"x\\\":\\\"UuzRB_2hdrUsqieuaizjh-bG8Os6mfD4ZPbfZKeve4M\\\",\\\"y\\\":\\\"dMG6126Me_tYyXugVxLBZjhUr6YL2YwPa0h5qS68boc\\\",\\\"crv\\\":\\\"P-256\\\"},\\\"usages\\\":[\\\"appTrust\\\"],\\\"signedBy\\\":\\\"pcosIntermediate\\\"}}\",\"88d323b8744bbc440d9ee5058d762e5b8b7d23253db15c2783c01f378cf3eb5fa27db662a0caf977221e0819b751665941b130fae8f43752e8d581bd9b29ba67\":\"{\\\"list\\\":[],\\\"signature\\\":\\\"a41eea0ba0716bcf20dcabafc7e564e4516bcf8b4ded20ecf25394994920bc4868107b4edb1cea5f6b3a0ab7f61bbd02d7ec304d5f892673c047dcac107e6169\\\"}\",\"382c93acd68b23ca0e2861459a8e42fb91c62e5d1f4f1aaeccd2dccd2cd43ca5e101649786e61abe8c957a755e1d672f863c2ff9aa72c629575e81ac1d5f569b\":\"{\\\"keyInfo\\\":{\\\"key\\\":{\\\"kty\\\":\\\"EC\\\",\\\"x\\\":\\\"3g8o8p-ILv8zNVTvYXL3UenFfgE1rHp0_aMmywPAGTY\\\",\\\"y\\\":\\\"xKnzBraxz6SsHpslZobyuI7YtWRjFnhlcfbZbXpY2Uw\\\",\\\"crv\\\":\\\"P-256\\\"},\\\"usages\\\":[\\\"moduleTrust\\\"],\\\"signedBy\\\":\\\"pcosIntermediate\\\"},\\\"signature\\\":\\\"ae87884c3266142cfa1e146c948bf53839beaefa0ef16f269f03e42d33aaa280ea2546931ec27d790b1ba376edb8edf3476f5e3a38510e9236fca40e3700730a\\\"}\",\"d45882263d172976ca6a4897c5f1b60ca6126c8865256c394da84068ca1ec4b8064e14a81e03f8d22157865d7c3f1ff87fa23ac78504aab1902dfd8269e14536\":\"{\\\"keyInfo\\\":{\\\"key\\\":{\\\"kty\\\":\\\"EC\\\",\\\"x\\\":\\\"rVuGYxQJytmQWpaV6rlU-8uNyYVvyCATXaCI1xA_Gac\\\",\\\"y\\\":\\\"dI2kSCzonpKL-k84kD_2sv6Fe7HQ3FXaTzYslZACRY0\\\",\\\"crv\\\":\\\"P-256\\\"},\\\"usages\\\":[\\\"keyTrust\\\"]},\\\"signature\\\":\\\"5ed7004f897438702125b14ea89e15da34c65316ed4c6d036233f3fed0af09c1d23220bc44c59bc21510e573c800d30fdea498bc2b93d663a9c6bf8f4839210f\\\"}\"},\"buildInfo\":{\"for\":\"1298\",\"when\":1750440209979,\"critical\":true,\"signature\":\"e21162c94ce01a22f8f917dfeba08a098ce12b01bfb18cc4e7c9b9ba224745ba08d8a523ad6dcad94dc46712704d407be65a475c1d7e772be37a41857540d553\"}}");
// modules/50-bootable.fs
modules.fs.write(".installer/modules/50-bootable.fs", "{\"backend\":{\"files\":{\"boot\":{\"00-pcos.js\":\"17a3dc4196902d0eefcea11d46b41d2a5000dd9da9ec66ba862016cdcf0252996337a11b07410e97dfab14f9e5fbc882ac97e5187ec8e1d6040013314dc0006e\",\"00-pcosksk.js\":\"f992b64bf6bc819bf34aef180cfbbfd11a780c64ad6587e03df83bbe96e03793bd5d7060300ffc9ed3f0738108f372ee04efb84fa0505c0a5eb3a4f8b112ab62\",\"01-fs.js\":\"5866a059f9c5e0980d1f7da8b4a6f6c3ce9d1eb1597e3c345137f141faf6b7e59f6c87f0ebb06c865e950e6d12c560e79a2358d737a13686e261a3b9e19a44c4\",\"01-fsck.js\":\"efa7ef28754863347fd4d8cc5ac23807acba7f7f7a69ae0aeb248d4d84de5db215e5b89c7335048ea6d3db71ae4d8a6323c7c79411518dbab07735dbf8564789\",\"01-fsmodules.js\":\"f201b22dce3517e915c606a6c7064682efec31673ab4a22f46717582f58d33fb69a4294340fbca50b8616cfd24c9bbfb0f3a28b5f2a1a0634ec572c22be1c6e0\",\"02-ui.js\":\"d29b09b391626922b8eb74bd16c67f9b2214d06ec0f9aa4b7751f85b8c40c8af1310987437e9ee5b4c246bd3cd31fcda1d6920ccd0b756939826531867e1ae59\",\"04-ipc.js\":\"65bf1b1aedb2cbfd6252f9136a1c8f5d2a29132e25a0d0080c94af497c302454287e81bec29014e41c3f5a3368b2812c518f7908ca15c6b4c6e876d38e558783\",\"04-websockets.js\":\"4542b5c51d064b7129295fc10fee580abe9c0a9197c961409650013cae32e18468577ad4b9617332f297a97bc89ac74a8f3a5c3485eb4561b2e8036b33941d86\",\"05-lull.js\":\"a7b8e8a310fc9247c5495ce090bf50a3c088274da403ddb2096af9a60bb3bbeecac7f5333145fed017e842d218baa9880c16b79d677e9657cc57bbe45087cdce\",\"05-network.js\":\"3eeec9e78ca3b1831fcf37be4e7a6d94dcb3f23f56d35f203602df60d553c9058a011f81654e0c75f862b21bd32bca026ef589ff97e5562b1f0c233d4e784b6f\",\"05-reeapis.js\":\"8040ef94476ec5568f3752f3ac4e994385fb4f00b4abea382a1de70f004d0b8e782b57c59c3e2f297dc6522799b168148c999ab326034bb2aaaca1cb0c0fa482\",\"06-csp.js\":\"4b5a88ba528b1c16f9a959c58a657adfb5784c005a224700c60a0834467e3114be4fe5deac305fa5243cfcf52bdabca6a59f4ae615a1998da4dcd4281ffd9781\",\"06-locales.js\":\"76c4bdee8948e4db3fcc1a93d15bfa1d29a1392f7244ab249f407e395d8825dcf075b64bd50b63c97aaaf30b281fe3d9dd86ad477dd1253f5f9b56329ec929cc\",\"07-tasks.js\":\"b46eb66300751861a7cc384c4e900e7ef937cbadc7c019b7f006eff51dcda0ed3d9e083fee1958a25c10fa9ee2006bb5085fc1c3c0c973e345a4f752c831bf33\",\"09-logout.js\":\"7873d7e5e17b85774cc1dce254963aaf270e8cc001ca5b6e9d6eb7fa098d6ce909b162fb8c41f48d6babb10498253c71eaac8365255d7bd1ed29b777c5ff4690\",\"09-restart.js\":\"a803565054fc767ad9eb1270042585d7a2dba9966ddcb0fd30e9e071067bfbe21b250abe63d24e7f44eba4a026da6c7a7fa22b26f1cf99fef0ca682ba0c5ee46\",\"11-userfriendliness.js\":\"aef7c0967dd83ed31d4e14912b6c164ad2d3cda412c1b5e0652fcc4903bbcb587261949f79bbf32d22555bae4ec8434bf7cd85094a1f7876e604b12bb11aaa48\",\"12-tokens.js\":\"92dbba4bd477679214c2faff1e60a4c171e0181815ecf53a426bd087f017d2c6f4c72bf658e158c7a64e84f6dc6ed47310d1c7e0c156f6e1cc67404b384e57c8\",\"12-users.js\":\"366cb67c5f74af78c7c1fc8d6102395117f74db70d59894dff97d1df965e1cb81803fc4e4edb17aa33f2905c76551a5d8fd90f45a89a5b64f7899aa13547dda4\",\"13-authui.js\":\"f3b506922d5a75c51cd41c592decdad4cabec3b2f70f96d4cb0f66f4c3c955d157cbe33fb1658d3f9cf9930775ac402851509bc2016f9c82992bdff9d574fa4c\",\"13-consentui.js\":\"0c0a9ff578d08673b85d63a68869100037c5008230482d21764e264e3716d3fc034ec174b88ae0356adb1c272dd2ae084e221e674dc1c07d8827da2f967b1b90\",\"14-logon-requirement.js\":\"887a9544e45f5e18df53074eb1011a2d14807999b7c9f0656142b095d5d86aae9aa378ee42d4f69f3f4188c49983c41be974509718af60eee360335c0dbe929e\",\"18-logon-requirement-enforce.js\":\"840d094c3da2a3291eeb7a3beede154be129870b011f11a48ac389eac3088315d942b35b902b46b732cb9d60642186397bfd4c787ed9ecf33348da276f23b4b4\",\"99-finished.js\":\"79b081d179fa02d6bc1df1631aec83bd2b5d2cadf22d344d0947b896cf5be4ed3c94701633fe8aab3d5654c5a8f0c8054d758a4873d311ad1deef532d26ca6d5\"}},\"permissions\":{\"boot/00-pcos.js\":{\"world\":\"rx\"},\"boot/00-pcosksk.js\":{\"world\":\"rx\"},\"boot/01-fs.js\":{\"world\":\"rx\"},\"boot/01-fsck.js\":{\"world\":\"rx\"},\"boot/01-fsmodules.js\":{\"world\":\"rx\"},\"boot/02-ui.js\":{\"world\":\"rx\"},\"boot/04-ipc.js\":{\"world\":\"rx\"},\"boot/04-websockets.js\":{\"world\":\"rx\"},\"boot/05-lull.js\":{\"world\":\"rx\"},\"boot/05-network.js\":{\"world\":\"rx\"},\"boot/05-reeapis.js\":{\"world\":\"rx\"},\"boot/06-csp.js\":{\"world\":\"rx\"},\"boot/06-locales.js\":{\"world\":\"rx\"},\"boot/07-tasks.js\":{\"world\":\"rx\"},\"boot/09-logout.js\":{\"world\":\"rx\"},\"boot/09-restart.js\":{\"world\":\"rx\"},\"boot/11-userfriendliness.js\":{\"world\":\"rx\"},\"boot/12-tokens.js\":{\"world\":\"rx\"},\"boot/12-users.js\":{\"world\":\"rx\"},\"boot/13-authui.js\":{\"world\":\"rx\"},\"boot/13-consentui.js\":{\"world\":\"rx\"},\"boot/14-logon-requirement.js\":{\"world\":\"rx\"},\"boot/18-logon-requirement-enforce.js\":{\"world\":\"rx\"},\"boot/99-finished.js\":{\"world\":\"rx\"},\"boot/\":{\"world\":\"rx\"},\"\":{\"world\":\"rx\"}}},\"files\":{\"17a3dc4196902d0eefcea11d46b41d2a5000dd9da9ec66ba862016cdcf0252996337a11b07410e97dfab14f9e5fbc882ac97e5187ec8e1d6040013314dc0006e\":\"// @pcos-app-mode native\\nconst pcos_version = \\\"1298\\\";\\nconst build_time = 1750439783835;\\n \\nlet modules = {\\n\\tcore: coreExports,\\n\\tpcos_version,\\n\\tbuild_time\\n};\\nglobalThis.modules = modules;\\n\\nasync function panic(code, component) {\\n\\tmodules.shuttingDown = true;\\n\\tif (modules.session) modules.session.muteAllSessions();\\n\\tlet baseLocales = {\\n\\t\\t\\\"PANIC_LINE1\\\": \\\"A critical problem has been detected while using the operating system. Its stability is at risk now.\\\",\\n\\t\\t\\\"PANIC_LINE2\\\": \\\"Problem code: %s\\\",\\n\\t\\t\\\"PANIC_UNSPECIFIED_ERROR\\\": \\\"UNSPECIFIED_ERROR\\\",\\n\\t\\t\\\"PROBLEMATIC_COMPONENT\\\": \\\"Problematic component: %s\\\",\\n\\t\\t\\\"PROBLEMATIC_PARAMS\\\": \\\"Problematic parameters: %s\\\",\\n\\t\\t\\\"PROBLEMATIC_JS\\\": \\\"Problematic JavaScript: %s: %s\\\",\\n\\t\\t\\\"PANIC_LINE3\\\": \\\"If you have seen this error message the first time, attempt rebooting.\\\",\\n\\t\\t\\\"PANIC_LINE4\\\": \\\"If you see this error message once more, there is something wrong with the system.\\\",\\n\\t\\t\\\"PANIC_LINE5\\\": \\\"You can try repairing the filesystem by placing a .fsck file on the system root mountpoint, with the value \\\\\\\"recover\\\\\\\" in it.\\\",\\n\\t\\t\\\"PANIC_LINE6\\\": \\\"Proper shutdown procedure follows now:\\\",\\n\\t\\t\\\"PANIC_TASK_KILLED\\\": \\\"task:%s: killed\\\",\\n\\t\\t\\\"PANIC_MOUNT_UNMOUNTED\\\": \\\"mount:%s: unmounted\\\",\\n\\t\\t\\\"PANIC_MOUNT_FAILED\\\": \\\"mount:%s: %s: %s\\\"\\n\\t}\\n\\tlet currentLocales = modules.locales;\\n\\tif (currentLocales) currentLocales = currentLocales[navigator.language.slice(0, 2).toLowerCase()];\\n\\tif (!currentLocales) currentLocales = baseLocales;\\n\\tif (!Object.keys(baseLocales).every(key => currentLocales.hasOwnProperty(key))) currentLocales = baseLocales;\\n\\n\\tmodules.core.tty_bios_api.println(currentLocales.PANIC_LINE1);\\n\\tmodules.core.tty_bios_api.println(currentLocales.PANIC_LINE2.replace(\\\"%s\\\", (code || currentLocales.PANIC_UNSPECIFIED_ERROR)));\\n\\tif (component) {\\n\\t\\tif (component.name) modules.core.tty_bios_api.println(currentLocales.PROBLEMATIC_COMPONENT.replace(\\\"%s\\\", component.name));\\n\\t\\tif (component.params) modules.core.tty_bios_api.println(currentLocales.PROBLEMATIC_PARAMS.replace(\\\"%s\\\", JSON.stringify(component.params, null, \\\"\\\\t\\\")));\\n\\t\\tif (component.underlyingJS) {\\n\\t\\t\\tmodules.core.tty_bios_api.println(currentLocales.PROBLEMATIC_JS.replace(\\\"%s\\\", component.underlyingJS.name).replace(\\\"%s\\\", component.underlyingJS.message));\\n\\t\\t\\tif (component.underlyingJS.stack) modules.core.tty_bios_api.println(component.underlyingJS.stack);\\n\\t\\t}\\n\\t}\\n\\tmodules.core.tty_bios_api.println(currentLocales.PANIC_LINE3);\\n\\tmodules.core.tty_bios_api.println(currentLocales.PANIC_LINE4);\\n\\tmodules.core.tty_bios_api.println(currentLocales.PANIC_LINE5);\\n\\tmodules.core.tty_bios_api.println(currentLocales.PANIC_LINE6);\\n\\ttry {\\n\\t\\tmodules.websocket._handles[modules.network.ws].ws.onclose = null;\\n\\t\\tmodules.websocket._handles[modules.network.ws].ws.close();\\n\\t\\tdelete modules.websocket._handles[modules.network.ws];\\n\\t} catch {}\\n\\tif (modules.tasks) for (let task in modules.tasks.tracker) {\\n\\t\\tmodules.core.tty_bios_api.println(currentLocales.PANIC_TASK_KILLED.replace(\\\"%s\\\", modules.tasks.tracker[task].file));\\n\\t\\tmodules.tasks.tracker[task].ree.closeDown();\\n\\t}\\n\\tif (modules.fs) for (let mount in modules.fs.mounts) {\\n\\t\\ttry {\\n\\t\\t\\tawait modules.fs.unmount(mount);\\n\\t\\t\\tmodules.core.tty_bios_api.println(currentLocales.PANIC_MOUNT_UNMOUNTED.replace(\\\"%s\\\", mount));\\n\\t\\t} catch (e) {\\n\\t\\t\\tmodules.core.tty_bios_api.println(currentLocales.PANIC_MOUNT_FAILED.replace(\\\"%s\\\", mount).replace(\\\"%s\\\", e.name).replace(\\\"%s\\\", e.message));\\n\\t\\t}\\n\\t}\\n\\tif (modules.session) modules.session.destroy();\\n\\tthrow (component ? component.underlyingJS : null) || code || \\\"UNSPECIFIED_ERROR\\\";\\n}\\n\\nfunction startupMemo() {\\n\\tmodules.core.tty_bios_api.println(\\\"PCsoft PCOS 3, build \\\" + pcos_version);\\n\\tmodules.core.tty_bios_api.println(\\\"Logical processors: \\\" + navigator.hardwareConcurrency);\\n\\tmodules.core.tty_bios_api.println(\\\"Memory available: \\\" + ((navigator.deviceMemory * 1024) || \\\"<unavailable>\\\") + \\\" MB\\\");\\n}\\nstartupMemo();\",\"f992b64bf6bc819bf34aef180cfbbfd11a780c64ad6587e03df83bbe96e03793bd5d7060300ffc9ed3f0738108f372ee04efb84fa0505c0a5eb3a4f8b112ab62\":\"async function ksk() {\\n\\t// @pcos-app-mode native\\n\\t// Key signing key\\n\\tlet ksk = {\\\"kty\\\":\\\"EC\\\",\\\"x\\\":\\\"2iqPpmoqWFYGIjoCYAZvyDeGN2MeB2kkEdKeSswMPEc\\\",\\\"y\\\":\\\"6ZSKXt7HqvB8cWya7j9dC6x36DDgHLndX6qeMMnh7s4\\\",\\\"crv\\\":\\\"P-256\\\"};\\n\\tif (ksk.stub == \\\"present\\\") {\\n\\t\\tlet e = new Error(\\\"The key signing key was not built into this build.\\\");\\n\\t\\tpanic(\\\"KEY_SIGNING_KEY_NOT_BUILT\\\", {\\n\\t\\t\\tname: \\\"ksk\\\",\\n\\t\\t\\tparams: [ \\\"stub\\\" ],\\n\\t\\t\\tunderlyingJS: e\\n\\t\\t});\\n\\t\\tthrow e;\\n\\t}\\n\\tif (ksk.stub != \\\"present\\\") modules.ksk = ksk;\\n\\tif (modules.ksk) {\\n\\t\\ttry {\\n\\t\\t\\tmodules.ksk_imported = await crypto.subtle.importKey(\\\"jwk\\\", modules.ksk, {\\n\\t\\t\\t\\tname: \\\"ECDSA\\\",\\n\\t\\t\\t\\tnamedCurve: \\\"P-256\\\"\\n\\t\\t\\t}, false, [\\\"verify\\\"]);\\n\\t\\t} catch (e) {\\n\\t\\t\\tpanic(\\\"KEY_SIGNING_KEY_IMPORT_FAILED\\\", {\\n\\t\\t\\t\\tname: \\\"ksk\\\",\\n\\t\\t\\t\\tunderlyingJS: e\\n\\t\\t\\t});\\n\\t\\t\\tthrow e;\\n\\t\\t}\\n\\t}\\n}\\nawait ksk();\",\"5866a059f9c5e0980d1f7da8b4a6f6c3ce9d1eb1597e3c345137f141faf6b7e59f6c87f0ebb06c865e950e6d12c560e79a2358d737a13686e261a3b9e19a44c4\":\"function loadFs() {\\n\\t// @pcos-app-mode native\\n\\tlet fs = {\\n\\t\\tread: async function(file, sessionToken) {\\n\\t\\t\\tlet mount = file.split(\\\"/\\\")[0];\\n\\t\\t\\tif (!this.mounts.hasOwnProperty(mount)) throw new Error(\\\"NO_SUCH_DEVICE\\\");\\n\\t\\t\\treturn await this.mounts[mount].read(file.split(\\\"/\\\").slice(1).join(\\\"/\\\"), sessionToken);\\n\\t\\t},\\n\\t\\twrite: async function(file, data, sessionToken) {\\n\\t\\t\\tlet filePath = file.split(\\\"/\\\").slice(1);\\n\\t\\t\\tif (filePath.includes(\\\"\\\")) throw new Error(\\\"PATH_INCLUDES_EMPTY\\\");\\n\\t\\t\\tlet mount = file.split(\\\"/\\\")[0];\\n\\t\\t\\tif (!this.mounts.hasOwnProperty(mount)) throw new Error(\\\"NO_SUCH_DEVICE\\\");\\n\\t\\t\\tif (modules.core.bootMode == \\\"readonly\\\") throw new Error(\\\"READ_ONLY_BMGR\\\");\\n\\t\\t\\tif (this.mounts[mount].read_only) throw new Error(\\\"READ_ONLY_DEV\\\");\\n\\t\\t\\treturn await this.mounts[mount].write(file.split(\\\"/\\\").slice(1).join(\\\"/\\\"), data, sessionToken);\\n\\t\\t},\\n\\t\\trm: async function(file, sessionToken) {\\n\\t\\t\\tlet mount = file.split(\\\"/\\\")[0];\\n\\t\\t\\tif (!this.mounts.hasOwnProperty(mount)) throw new Error(\\\"NO_SUCH_DEVICE\\\");\\n\\t\\t\\tif (modules.core.bootMode == \\\"readonly\\\") throw new Error(\\\"READ_ONLY_BMGR\\\");\\n\\t\\t\\tif (this.mounts[mount].read_only) throw new Error(\\\"READ_ONLY_DEV\\\");\\n\\t\\t\\treturn await this.mounts[mount].rm(file.split(\\\"/\\\").slice(1).join(\\\"/\\\"), sessionToken);\\n\\t\\t},\\n\\t\\tmkdir: async function(folder, sessionToken) {\\n\\t\\t\\tlet filePath = folder.split(\\\"/\\\").slice(1);\\n\\t\\t\\tif (filePath.includes(\\\"\\\")) throw new Error(\\\"PATH_INCLUDES_EMPTY\\\");\\n\\t\\t\\tlet mount = folder.split(\\\"/\\\")[0];\\n\\t\\t\\tif (!this.mounts.hasOwnProperty(mount)) throw new Error(\\\"NO_SUCH_DEVICE\\\");\\n\\t\\t\\tif (modules.core.bootMode == \\\"readonly\\\") throw new Error(\\\"READ_ONLY_BMGR\\\");\\n\\t\\t\\tif (this.mounts[mount].read_only) throw new Error(\\\"READ_ONLY_DEV\\\");\\n\\t\\t\\tif (!this.mounts[mount].directory_supported) throw new Error(\\\"NO_DIRECTORY_SUPPORT\\\");\\n\\t\\t\\treturn await this.mounts[mount].mkdir(folder.split(\\\"/\\\").slice(1).join(\\\"/\\\"), sessionToken);\\n\\t\\t},\\n\\t\\tpermissions: async function(folder, sessionToken) {\\n\\t\\t\\tlet mount = folder.split(\\\"/\\\")[0];\\n\\t\\t\\tif (!this.mounts.hasOwnProperty(mount)) throw new Error(\\\"NO_SUCH_DEVICE\\\");\\n\\t\\t\\tlet randomNames = crypto.getRandomValues(new Uint8Array(8)).reduce((a, b) => a + b.toString(16).padStart(2, \\\"0\\\"), \\\"\\\");\\n\\t\\t\\tif (!this.mounts[mount].permissions_supported) return { owner: randomNames, group: randomNames, world: \\\"rwx\\\" };\\n\\t\\t\\treturn await this.mounts[mount].permissions(folder.split(\\\"/\\\").slice(1).join(\\\"/\\\"), sessionToken);\\n\\t\\t},\\n\\t\\tlsmounts: function() {\\n\\t\\t\\treturn Object.keys(this.mounts);\\n\\t\\t},\\n\\t\\tunmount: async function(mount, sessionToken, force) {\\n\\t\\t\\tif (!this.mounts.hasOwnProperty(mount)) throw new Error(\\\"NO_SUCH_DEVICE\\\");\\n\\t\\t\\tif (!this.mounts[mount].read_only && modules.core.bootMode != \\\"readonly\\\" && !force) await this.sync(mount, sessionToken);\\n\\t\\t\\tif (!force) await this.mounts[mount].unmount(sessionToken);\\n\\t\\t\\tdelete this.mounts[mount];\\n\\t\\t},\\n\\t\\tchown: async function(file, owner, sessionToken) {\\n\\t\\t\\tlet filePath = file.split(\\\"/\\\").slice(1);\\n\\t\\t\\tif (filePath.includes(\\\"\\\")) throw new Error(\\\"PATH_INCLUDES_EMPTY\\\");\\n\\t\\t\\tlet mount = file.split(\\\"/\\\")[0];\\n\\t\\t\\tif (!this.mounts.hasOwnProperty(mount)) throw new Error(\\\"NO_SUCH_DEVICE\\\");\\n\\t\\t\\tif (modules.core.bootMode == \\\"readonly\\\") throw new Error(\\\"READ_ONLY_BMGR\\\");\\n\\t\\t\\tif (this.mounts[mount].read_only) throw new Error(\\\"READ_ONLY_DEV\\\");\\n\\t\\t\\tif (!this.mounts[mount].permissions_supported) throw new Error(\\\"NO_PERMIS_SUPPORT\\\");\\n\\t\\t\\treturn await this.mounts[mount].chown(file.split(\\\"/\\\").slice(1).join(\\\"/\\\"), owner, sessionToken);\\n\\t\\t},\\n\\t\\tchgrp: async function(file, group, sessionToken) {\\n\\t\\t\\tlet filePath = file.split(\\\"/\\\").slice(1);\\n\\t\\t\\tif (filePath.includes(\\\"\\\")) throw new Error(\\\"PATH_INCLUDES_EMPTY\\\");\\n\\t\\t\\tlet mount = file.split(\\\"/\\\")[0];\\n\\t\\t\\tif (!this.mounts.hasOwnProperty(mount)) throw new Error(\\\"NO_SUCH_DEVICE\\\");\\n\\t\\t\\tif (modules.core.bootMode == \\\"readonly\\\") throw new Error(\\\"READ_ONLY_BMGR\\\");\\n\\t\\t\\tif (this.mounts[mount].read_only) throw new Error(\\\"READ_ONLY_DEV\\\");\\n\\t\\t\\tif (!this.mounts[mount].permissions_supported) throw new Error(\\\"NO_PERMIS_SUPPORT\\\");\\n\\t\\t\\treturn await this.mounts[mount].chgrp(file.split(\\\"/\\\").slice(1).join(\\\"/\\\"), group, sessionToken);\\n\\t\\t},\\n\\t\\tchmod: async function(file, permissions, sessionToken) {\\n\\t\\t\\tlet filePath = file.split(\\\"/\\\").slice(1);\\n\\t\\t\\tif (filePath.includes(\\\"\\\")) throw new Error(\\\"PATH_INCLUDES_EMPTY\\\");\\n\\t\\t\\tlet mount = file.split(\\\"/\\\")[0];\\n\\t\\t\\tif (!this.mounts.hasOwnProperty(mount)) throw new Error(\\\"NO_SUCH_DEVICE\\\");\\n\\t\\t\\tif (modules.core.bootMode == \\\"readonly\\\") throw new Error(\\\"READ_ONLY_BMGR\\\");\\n\\t\\t\\tif (this.mounts[mount].read_only) throw new Error(\\\"READ_ONLY_DEV\\\");\\n\\t\\t\\tif (!this.mounts[mount].permissions_supported) throw new Error(\\\"NO_PERMIS_SUPPORT\\\");\\n\\t\\t\\treturn await this.mounts[mount].chmod(file.split(\\\"/\\\").slice(1).join(\\\"/\\\"), permissions, sessionToken);\\n\\t\\t},\\n\\t\\tls: async function(folder, sessionToken) {\\n\\t\\t\\tlet mount = folder.split(\\\"/\\\")[0];\\n\\t\\t\\tif (!this.mounts.hasOwnProperty(mount)) throw new Error(\\\"NO_SUCH_DEVICE\\\");\\n\\t\\t\\treturn await this.mounts[mount].ls(folder.split(\\\"/\\\").slice(1).join(\\\"/\\\"), sessionToken);\\n\\t\\t},\\n\\t\\tisDirectory: async function(path, sessionToken) {\\n\\t\\t\\tlet mount = path.split(\\\"/\\\")[0];\\n\\t\\t\\tif (!this.mounts.hasOwnProperty(mount)) throw new Error(\\\"NO_SUCH_DEVICE\\\");\\n\\t\\t\\tif (!path.split(\\\"/\\\").slice(1).join(\\\"/\\\")) return true;\\n\\t\\t\\tif (!this.mounts[mount].directory_supported) return false;\\n\\t\\t\\treturn await this.mounts[mount].isDirectory(path.split(\\\"/\\\").slice(1).join(\\\"/\\\"), sessionToken);\\n\\t\\t},\\n\\t\\tmountInfo: async function(mount) {\\n\\t\\t\\treturn {\\n\\t\\t\\t\\tread_only: this.mounts[mount].read_only || false,\\n\\t\\t\\t\\tpermissions_supported: this.mounts[mount].permissions_supported || false,\\n\\t\\t\\t\\tdirectory_supported: this.mounts[mount].directory_supported || false,\\n\\t\\t\\t\\tfilesystem: this.mounts[mount].filesystem || \\\"unknown\\\"\\n\\t\\t\\t}\\n\\t\\t},\\n\\t\\tsync: async function(mount, sessionToken) {\\n\\t\\t\\tif (!this.mounts.hasOwnProperty(mount)) throw new Error(\\\"NO_SUCH_DEVICE\\\");\\n\\t\\t\\tif (!this.mounts[mount].read_only && modules.core.bootMode != \\\"readonly\\\") return await this.mounts[mount].sync(sessionToken);\\n\\t\\t},\\n\\t\\tmounts: {}\\n\\t}\\n\\t\\n\\tasync function PCFSiDBMount(options) {\\n\\t\\tlet partition;\\n\\t\\ttry {\\n\\t\\t\\tpartition = modules.core.disk.partition(options.partition);\\n\\t\\t\\tpartition = partition.getData();\\n\\t\\t} catch (e) {\\n\\t\\t\\tthrow new Error(\\\"PARTITION_FAILED: \\\" + e.toString() + \\\"\\\\n---begin stack---\\\\n\\\" + e.stack + \\\"\\\\n---end stack---\\\");\\n\\t\\t}\\n\\t\\tif (!Object.keys(partition).includes(\\\"files\\\") || !Object.keys(partition).includes(\\\"permissions\\\") || !Object.keys(partition).includes(\\\"id\\\")) throw new Error(\\\"PARTITION_NOT_PCFS\\\");\\n\\t\\tlet partitionId = partition.id;\\n\\t\\tpartition = null;\\n\\t\\treturn {\\n\\t\\t\\tread: async function(key) {\\n\\t\\t\\t\\tlet pathParts = key.split(\\\"/\\\");\\n\\t\\t\\t\\tif (pathParts[0] == \\\"\\\") pathParts = pathParts.slice(1);\\n\\t\\t\\t\\tlet files = this.backend.files;\\n\\t\\t\\t\\tfor (let part of pathParts) {\\n\\t\\t\\t\\t\\tfiles = files[part];\\n\\t\\t\\t\\t\\tif (!files) throw new Error(\\\"NO_SUCH_FILE\\\");\\n\\t\\t\\t\\t}\\n\\t\\t\\t\\tif (typeof files === \\\"object\\\") throw new Error(\\\"IS_A_DIR\\\");\\n\\t\\t\\t\\treturn String(await modules.core.idb.readPart(partitionId + \\\"-\\\" + files));\\n\\t\\t\\t},\\n\\t\\t\\twrite: async function(key, value) {\\n\\t\\t\\t\\tkey = String(key);\\n\\t\\t\\t\\tvalue = String(value);\\n\\t\\t\\t\\tlet existenceChecks = key.split(\\\"/\\\").slice(0, -1);\\n\\t\\t\\t\\tif (existenceChecks[0] == \\\"\\\") existenceChecks = existenceChecks.slice(1);\\n\\t\\t\\t\\tif (existenceChecks[existenceChecks.length - 1] == \\\"\\\") existenceChecks = existenceChecks.slice(0, -1);\\n\\t\\t\\t\\tlet basename = key.split(\\\"/\\\").slice(-1)[0];\\n\\t\\t\\t\\tlet files = this.backend.files;\\n\\t\\t\\t\\tfor (let part of existenceChecks) {\\n\\t\\t\\t\\t\\tfiles = files[part];\\n\\t\\t\\t\\t\\tif (!files) throw new Error(\\\"NO_SUCH_DIR\\\");\\n\\t\\t\\t\\t}\\n\\t\\t\\t\\tif (typeof files[basename] === \\\"object\\\") throw new Error(\\\"IS_A_DIR\\\");\\n\\t\\t\\t\\tlet id = files[basename] || crypto.getRandomValues(new Uint8Array(64)).reduce((a, b) => a + b.toString(16).padStart(2, \\\"0\\\"), \\\"\\\");\\n\\t\\t\\t\\tawait modules.core.idb.writePart(partitionId + \\\"-\\\" + id, value);\\n\\t\\t\\t\\tif (!files.hasOwnProperty(basename)) this.backend = this._recursive_op(this.backend, \\\"files/\\\" + key, { type: \\\"write\\\", value: id });\\n\\t\\t\\t},\\n\\t\\t\\trm: async function(key) {\\n\\t\\t\\t\\tkey = String(key);\\n\\t\\t\\t\\tlet pathParts = key.split(\\\"/\\\");\\n\\t\\t\\t\\tif (pathParts[0] == \\\"\\\") pathParts = pathParts.slice(1);\\n\\t\\t\\t\\tif (pathParts[pathParts.length - 1] == \\\"\\\") pathParts = pathParts.slice(0, -1);\\n\\t\\t\\t\\tlet files = this.backend.files;\\n\\t\\t\\t\\tfor (let part of pathParts) {\\n\\t\\t\\t\\t\\tfiles = files[part];\\n\\t\\t\\t\\t\\tif (!files) throw new Error(\\\"NO_SUCH_FILE_DIR\\\");\\n\\t\\t\\t\\t}\\n\\t\\t\\t\\tif (typeof files === \\\"object\\\" && Object.keys(files).length > 0) throw new Error(\\\"NON_EMPTY_DIR\\\");\\n\\t\\t\\t\\tif (typeof files === \\\"string\\\") await modules.core.idb.removePart(partitionId + \\\"-\\\" + files);\\n\\t\\t\\t\\tthis.backend = this._recursive_op(this.backend, \\\"files/\\\" + key, { type: \\\"delete\\\" });\\n\\t\\t\\t\\tlet backend = this.backend;\\n\\t\\t\\t\\tdelete backend.permissions[key];\\n\\t\\t\\t\\tthis.backend = backend;\\n\\t\\t\\t},\\n\\t\\t\\tls: async function(directory) {\\n\\t\\t\\t\\tdirectory = String(directory);\\n\\t\\t\\t\\tlet pathParts = directory.split(\\\"/\\\");\\n\\t\\t\\t\\tif (pathParts[0] == \\\"\\\") pathParts = pathParts.slice(1);\\n\\t\\t\\t\\tif (pathParts[pathParts.length - 1] == \\\"\\\") pathParts = pathParts.slice(0, -1);\\n\\t\\t\\t\\tlet files = this.backend.files;\\n\\t\\t\\t\\tfor (let part of pathParts) {\\n\\t\\t\\t\\t\\tfiles = files[part];\\n\\t\\t\\t\\t\\tif (!files) throw new Error(\\\"NO_SUCH_DIR\\\");\\n\\t\\t\\t\\t}\\n\\t\\t\\t\\tif (typeof files !== \\\"object\\\") throw new Error(\\\"IS_A_FILE\\\");\\n\\t\\t\\t\\treturn Object.keys(files);\\n\\t\\t\\t},\\n\\t\\t\\tmkdir: async function(directory) {\\n\\t\\t\\t\\tdirectory = String(directory);\\n\\t\\t\\t\\tlet existenceChecks = directory.split(\\\"/\\\").slice(0, -1);\\n\\t\\t\\t\\tif (existenceChecks[0] == \\\"\\\") existenceChecks = existenceChecks.slice(1);\\n\\t\\t\\t\\tif (existenceChecks[existenceChecks.length - 1] == \\\"\\\") existenceChecks = existenceChecks.slice(0, -1);\\n\\t\\t\\t\\tlet files = this.backend.files;\\n\\t\\t\\t\\tfor (let part of existenceChecks) {\\n\\t\\t\\t\\t\\tfiles = files[part];\\n\\t\\t\\t\\t\\tif (!files) throw new Error(\\\"NO_SUCH_DIR\\\");\\n\\t\\t\\t\\t}\\n\\t\\t\\t\\tif (Object.keys(files).includes(directory.split(\\\"/\\\").slice(-1)[0])) throw new Error(\\\"DIR_EXISTS\\\");\\n\\t\\t\\t\\tthis.backend = this._recursive_op(this.backend, \\\"files/\\\" + directory, { type: \\\"write\\\", value: {} });\\n\\t\\t\\t},\\n\\t\\t\\tpermissions: async function(file) {\\n\\t\\t\\t\\tfile = String(file);\\n\\t\\t\\t\\tlet properFile = file.split(\\\"/\\\")\\n\\t\\t\\t\\tif (properFile[0] == \\\"\\\") properFile = properFile.slice(1);\\n\\t\\t\\t\\tif (properFile[properFile.length - 1] == \\\"\\\") properFile = properFile.slice(0, -1);\\n\\t\\t\\t\\tproperFile = properFile.join(\\\"/\\\");\\n\\t\\t\\t\\tlet randomNames = crypto.getRandomValues(new Uint8Array(8)).reduce((a, b) => a + b.toString(16).padStart(2, \\\"0\\\"), \\\"\\\");\\n\\t\\t\\t\\tlet permissions = this.backend.permissions[properFile] || {};\\n\\t\\t\\t\\treturn {\\n\\t\\t\\t\\t\\towner: permissions.owner || randomNames,\\n\\t\\t\\t\\t\\tgroup: permissions.group || randomNames,\\n\\t\\t\\t\\t\\tworld: permissions.world || \\\"\\\",\\n\\t\\t\\t\\t\\trandom: !(permissions.owner || permissions.group || permissions.world) ? true : undefined\\n\\t\\t\\t\\t};\\n\\t\\t\\t},\\n\\t\\t\\tchown: async function(file, owner) {\\n\\t\\t\\t\\tfile = String(file);\\n\\t\\t\\t\\towner = String(owner);\\n\\t\\t\\t\\tlet properFile = file.split(\\\"/\\\")\\n\\t\\t\\t\\tif (properFile[0] == \\\"\\\") properFile = properFile.slice(1);\\n\\t\\t\\t\\tif (properFile[properFile.length - 1] == \\\"\\\") properFile = properFile.slice(0, -1);\\n\\t\\t\\t\\tproperFile = properFile.join(\\\"/\\\");\\n\\t\\t\\t\\tlet backend = this.backend;\\n\\t\\t\\t\\tlet randomNames = crypto.getRandomValues(new Uint8Array(8)).reduce((a, b) => a + b.toString(16).padStart(2, \\\"0\\\"), \\\"\\\");\\n\\t\\t\\t\\tlet filePermissions = backend.permissions[properFile] || {\\n\\t\\t\\t\\t\\towner: randomNames,\\n\\t\\t\\t\\t\\tgroup: randomNames,\\n\\t\\t\\t\\t\\tworld: \\\"\\\",\\n\\t\\t\\t\\t};\\n\\t\\t\\t\\tfilePermissions.owner = owner;\\n\\t\\t\\t\\tbackend.permissions[properFile] = filePermissions;\\n\\t\\t\\t\\tthis.backend = backend;\\n\\t\\t\\t},\\n\\t\\t\\tchgrp: async function(file, group) {\\n\\t\\t\\t\\tfile = String(file);\\n\\t\\t\\t\\tgroup = String(group);\\n\\t\\t\\t\\tlet properFile = file.split(\\\"/\\\")\\n\\t\\t\\t\\tif (properFile[0] == \\\"\\\") properFile = properFile.slice(1);\\n\\t\\t\\t\\tif (properFile[properFile.length - 1] == \\\"\\\") properFile = properFile.slice(0, -1);\\n\\t\\t\\t\\tproperFile = properFile.join(\\\"/\\\");\\n\\t\\t\\t\\tlet backend = this.backend;\\n\\t\\t\\t\\tlet randomNames = crypto.getRandomValues(new Uint8Array(8)).reduce((a, b) => a + b.toString(16).padStart(2, \\\"0\\\"), \\\"\\\");\\n\\t\\t\\t\\tlet filePermissions = backend.permissions[properFile] || {\\n\\t\\t\\t\\t\\towner: randomNames,\\n\\t\\t\\t\\t\\tgroup: randomNames,\\n\\t\\t\\t\\t\\tworld: \\\"\\\",\\n\\t\\t\\t\\t};\\n\\t\\t\\t\\tfilePermissions.group = group;\\n\\t\\t\\t\\tbackend.permissions[properFile] = filePermissions;\\n\\t\\t\\t\\tthis.backend = backend;\\n\\t\\t\\t},\\n\\t\\t\\tchmod: async function(file, permissions) {\\n\\t\\t\\t\\tfile = String(file);\\n\\t\\t\\t\\tpermissions = String(permissions);\\n\\t\\t\\t\\tlet properFile = file.split(\\\"/\\\")\\n\\t\\t\\t\\tif (properFile[0] == \\\"\\\") properFile = properFile.slice(1);\\n\\t\\t\\t\\tif (properFile[properFile.length - 1] == \\\"\\\") properFile = properFile.slice(0, -1);\\n\\t\\t\\t\\tproperFile = properFile.join(\\\"/\\\");\\n\\t\\t\\t\\tlet backend = this.backend;\\n\\t\\t\\t\\tlet randomNames = crypto.getRandomValues(new Uint8Array(8)).reduce((a, b) => a + b.toString(16).padStart(2, \\\"0\\\"), \\\"\\\");\\n\\t\\t\\t\\tlet filePermissions = backend.permissions[properFile] || {\\n\\t\\t\\t\\t\\towner: randomNames,\\n\\t\\t\\t\\t\\tgroup: randomNames,\\n\\t\\t\\t\\t\\tworld: \\\"\\\",\\n\\t\\t\\t\\t};\\n\\t\\t\\t\\tfilePermissions.world = permissions;\\n\\t\\t\\t\\tbackend.permissions[properFile] = filePermissions;\\n\\t\\t\\t\\tthis.backend = backend;\\n\\t\\t\\t},\\n\\t\\t\\tsync: async function() {\\n\\t\\t\\t\\tawait modules.core.disk.sync();\\n\\t\\t\\t},\\n\\t\\t\\tisDirectory: function(key) {\\n\\t\\t\\t\\tkey = String(key);\\n\\t\\t\\t\\tlet pathParts = key.split(\\\"/\\\").slice(0, -1);\\n\\t\\t\\t\\tif (pathParts[0] == \\\"\\\") pathParts = pathParts.slice(1);\\n\\t\\t\\t\\tif (pathParts[pathParts.length - 1] == \\\"\\\") pathParts = pathParts.slice(0, -1);\\n\\t\\t\\t\\tlet basename = key.split(\\\"/\\\").slice(-1)[0];\\n\\t\\t\\t\\tlet files = this.backend.files;\\n\\t\\t\\t\\tfor (let part of pathParts) {\\n\\t\\t\\t\\t\\tfiles = files[part];\\n\\t\\t\\t\\t\\tif (!files) throw new Error(\\\"NO_SUCH_DIR\\\");\\n\\t\\t\\t\\t}\\n\\t\\t\\t\\tif (!files.hasOwnProperty(basename)) throw new Error(\\\"NO_SUCH_FILE_DIR\\\");\\n\\t\\t\\t\\tif (typeof files[basename] === \\\"object\\\") return true;\\n\\t\\t\\t\\treturn false;\\n\\t\\t\\t},\\n\\t\\t\\tunmount: () => true,\\n\\t\\t\\t_recursive_op: function(obj, path, action, stage = 0) {\\n\\t\\t\\t\\tif (path.split(\\\"/\\\").length == (stage + 1)) {\\n\\t\\t\\t\\t\\tif (action.type == \\\"delete\\\") delete obj[path.split(\\\"/\\\").slice(-1)[0]];\\n\\t\\t\\t\\t\\tif (action.type == \\\"write\\\") obj[path.split(\\\"/\\\").slice(-1)[0]] = action.value;\\n\\t\\t\\t\\t} else obj[path.split(\\\"/\\\")[stage]] = this._recursive_op(obj[path.split(\\\"/\\\")[stage]], path, action, stage + 1);\\n\\t\\t\\t\\treturn obj;\\n\\t\\t\\t},\\n\\t\\t\\tdirectory_supported: true,\\n\\t\\t\\tread_only: !!options.read_only,\\n\\t\\t\\tfilesystem: \\\"PCFS\\\",\\n\\t\\t\\tpermissions_supported: true,\\n\\t\\t\\tpartition: null,\\n\\t\\t\\tget backend() {\\n\\t\\t\\t\\tif (!this.partition) this.partition = modules.core.disk.partition(options.partition);\\n\\t\\t\\t\\treturn this.partition.getData();\\n\\t\\t\\t},\\n\\t\\t\\tset backend(data) {\\n\\t\\t\\t\\tif (!this.partition) this.partition = modules.core.disk.partition(options.partition);\\n\\t\\t\\t\\tthis.partition.setData(data);\\n\\t\\t\\t}\\n\\t\\t};\\n\\t};\\n\\n\\tasync function PCFSiDBAESCryptMount(options) {\\n\\t\\tlet partition;\\n\\t\\ttry {\\n\\t\\t\\tpartition = modules.core.disk.partition(options.partition);\\n\\t\\t\\tpartition = partition.getData();\\n\\t\\t} catch (e) {\\n\\t\\t\\tthrow new Error(\\\"PARTITION_FAILED: \\\" + e.toString() + \\\"\\\\n---begin stack---\\\\n\\\" + e.stack + \\\"\\\\n---end stack---\\\");\\n\\t\\t}\\n\\t\\tif (!Object.keys(partition).includes(\\\"files\\\") || !Object.keys(partition).includes(\\\"permissions\\\") || !Object.keys(partition).includes(\\\"cryptodata\\\") || !Object.keys(partition).includes(\\\"id\\\")) throw new Error(\\\"PARTITION_NOT_PCFS_ENCRYPTED\\\");\\n\\t\\tif (options.interactivePassword) {\\n\\t\\t\\tlet passwordInput = \\\"\\\";\\n\\t\\t\\tlet tbi = modules.core.tty_bios_api;\\n\\t\\t\\tfunction outputPasswordAsking() {\\n\\t\\t\\t\\ttbi.clear();\\n\\t\\t\\t\\ttbi.println(\\\"|--------------------------------------------|\\\")\\n\\t\\t\\t\\ttbi.println(\\\"| Mounting encrypted partition               |\\\");\\n\\t\\t\\t\\ttbi.println(\\\"|--------------------------------------------|\\\");\\n\\t\\t\\t\\ttbi.println(\\\"| Enter your password. Typed \\\" + passwordInput.length + \\\" characters. \\\" + \\\" \\\".repeat(Math.max((3 - (passwordInput.length).toString().length), 0)) + \\\"|\\\");\\n\\t\\t\\t\\ttbi.println(\\\"| Press Enter to mount.                      |\\\");\\n\\t\\t\\t\\ttbi.println(\\\"|--------------------------------------------|\\\");\\n\\t\\t\\t}\\n\\t\\t\\twhile (true) {\\n\\t\\t\\t\\toutputPasswordAsking();\\n\\t\\t\\t\\tlet key = await tbi.inputKey();\\n\\t\\t\\t\\tif (key.key == \\\"Enter\\\") break;\\n\\t\\t\\t\\tif (key.key.length == 1) passwordInput += key.key;\\n\\t\\t\\t\\tif (key.key == \\\"Backspace\\\") passwordInput = passwordInput.slice(0, -1);\\n\\t\\t\\t}\\n\\t\\t\\toptions.password = passwordInput;\\n\\t\\t}\\n\\t\\tif (options.password) options.key = await modules.core.pbkdf2(options.password, partition.cryptodata.salt);\\n\\t\\tif (!options.key) throw new Error(\\\"GETTING_KEY_FAILED\\\");\\n\\t\\tlet importedKey = await crypto.subtle.importKey(\\\"raw\\\", Uint8Array.from(options.key.match(/.{1,2}/g).map(a => parseInt(a, 16))), { name: \\\"AES-GCM\\\" }, false, [ \\\"encrypt\\\", \\\"decrypt\\\" ]);\\n\\t\\toptions.key = options.key.length + \\\"L\\\";\\n\\t\\toptions.password = options.password.length + \\\"L\\\";\\n\\t\\tif (partition.cryptodata.passwordLockingInitial) {\\n\\t\\t\\tlet baseData = crypto.getRandomValues(new Uint8Array(32));\\n\\t\\t\\tlet iv = crypto.getRandomValues(new Uint8Array(16));\\n\\t\\t\\tlet ct = new Uint8Array(await crypto.subtle.encrypt({ name: \\\"AES-GCM\\\", iv }, importedKey, baseData));\\n\\t\\t\\tlet passwordLocking = new Uint8Array(iv.length + ct.length);\\n\\t\\t\\tpasswordLocking.set(iv);\\n\\t\\t\\tpasswordLocking.set(ct, iv.length);\\n\\t\\t\\tpartition.cryptodata.passwordLocking = passwordLocking.reduce((a, b) => a + b.toString(16).padStart(2, \\\"0\\\"), \\\"\\\");\\n\\t\\t\\tif (partition.encryptedFileTable) {\\n\\t\\t\\t\\tlet fileIV = crypto.getRandomValues(new Uint8Array(16));\\n\\t\\t\\t\\tlet fileCT = new Uint8Array(await crypto.subtle.encrypt({ name: \\\"AES-GCM\\\", iv: fileIV }, importedKey, new TextEncoder().encode(JSON.stringify({\\n\\t\\t\\t\\t\\tfiles: partition.files,\\n\\t\\t\\t\\t\\tpermissions: partition.permissions\\n\\t\\t\\t\\t}))));\\n\\t\\t\\t\\tpartition.files = {};\\n\\t\\t\\t\\tpartition.permissions = {};\\n\\t\\t\\t\\tlet ept = new Uint8Array(fileIV.length + fileCT.length);\\n\\t\\t\\t\\tept.set(fileIV);\\n\\t\\t\\t\\tept.set(fileCT, fileIV.length);\\n\\t\\t\\t\\tpartition.encryptedFileTable = ept.reduce((a, b) => a + b.toString(16).padStart(2, \\\"0\\\"), \\\"\\\");\\n\\t\\t\\t}\\n\\t\\t\\tdelete partition.cryptodata.passwordLockingInitial;\\n\\t\\t\\tmodules.core.disk.partition(options.partition).setData(partition);\\n\\t\\t}\\n\\t\\tif (partition.cryptodata.passwordLocking) {\\n\\t\\t\\tlet iv = new Uint8Array(partition.cryptodata.passwordLocking.slice(0, 32).match(/.{1,2}/g).map(a => parseInt(a, 16)));\\n\\t\\t\\tlet ct = new Uint8Array(partition.cryptodata.passwordLocking.slice(32).match(/.{1,2}/g).map(a => parseInt(a, 16)));\\n\\t\\t\\tawait crypto.subtle.decrypt({ name: \\\"AES-GCM\\\", iv }, importedKey, ct);\\n\\t\\t}\\n\\t\\tlet partitionId = partition.id;\\n\\t\\tpartition = null;\\n\\t\\treturn {\\n\\t\\t\\tread: async function(key) {\\n\\t\\t\\t\\tkey = String(key);          \\n\\t\\t\\t\\tlet pathParts = key.split(\\\"/\\\");\\n\\t\\t\\t\\tif (pathParts[0] == \\\"\\\") pathParts = pathParts.slice(1);\\n\\t\\t\\t\\tlet files = (await this.getBackend()).files;\\n\\t\\t\\t\\tfor (let part of pathParts) {\\n\\t\\t\\t\\t\\tfiles = files[part];\\n\\t\\t\\t\\t\\tif (!files) throw new Error(\\\"NO_SUCH_FILE\\\");\\n\\t\\t\\t\\t}\\n\\t\\t\\t\\tif (typeof files === \\\"object\\\") throw new Error(\\\"IS_A_DIR\\\");\\n\\t\\t\\t\\tlet part = await modules.core.idb.readPart(partitionId + \\\"-\\\" + files);\\n\\t\\t\\t\\tlet iv = new Uint8Array(part.slice(0, 32).match(/.{1,2}/g).map(a => parseInt(a, 16)));\\n\\t\\t\\t\\tlet ct = new Uint8Array(part.slice(32).match(/.{1,2}/g).map(a => parseInt(a, 16)));\\n\\t\\t\\t\\treturn new TextDecoder().decode(new Uint8Array(await crypto.subtle.decrypt({ name: \\\"AES-GCM\\\", iv }, this.key, ct)));\\n\\t\\t\\t},\\n\\t\\t\\twrite: async function(key, value) {\\n\\t\\t\\t\\tkey = String(key);\\n\\t\\t\\t\\tvalue = String(value);\\n\\t\\t\\t\\tlet existenceChecks = key.split(\\\"/\\\").slice(0, -1);\\n\\t\\t\\t\\tif (existenceChecks[0] == \\\"\\\") existenceChecks = existenceChecks.slice(1);\\n\\t\\t\\t\\tif (existenceChecks[existenceChecks.length - 1] == \\\"\\\") existenceChecks = existenceChecks.slice(0, -1);\\n\\t\\t\\t\\tlet basename = key.split(\\\"/\\\").slice(-1)[0];\\n\\t\\t\\t\\tlet files = (await this.getBackend()).files;\\n\\t\\t\\t\\tfor (let part of existenceChecks) {\\n\\t\\t\\t\\t\\tfiles = files[part];\\n\\t\\t\\t\\t\\tif (!files) throw new Error(\\\"NO_SUCH_DIR\\\");\\n\\t\\t\\t\\t}\\n\\t\\t\\t\\tif (typeof files[basename] === \\\"object\\\") throw new Error(\\\"IS_A_DIR\\\");\\n\\t\\t\\t\\tlet id = files[basename] || crypto.getRandomValues(new Uint8Array(64)).reduce((a, b) => a + b.toString(16).padStart(2, \\\"0\\\"), \\\"\\\");\\n\\t\\t\\t\\tlet newIV = crypto.getRandomValues(new Uint8Array(16));\\n\\t\\t\\t\\tlet newCT = new Uint8Array(await crypto.subtle.encrypt({ name: \\\"AES-GCM\\\", iv: newIV }, this.key, new TextEncoder().encode(value)));\\n\\t\\t\\t\\tlet newPart = new Uint8Array(newIV.length + newCT.length);\\n\\t\\t\\t\\tnewPart.set(newIV);\\n\\t\\t\\t\\tnewPart.set(newCT, newIV.length);\\n\\t\\t\\t\\tnewPart = newPart.reduce((a, b) => a + b.toString(16).padStart(2, \\\"0\\\"), \\\"\\\");\\n\\t\\t\\t\\tawait modules.core.idb.writePart(partitionId + \\\"-\\\" + id, newPart);\\n\\t\\t\\t\\tif (!files.hasOwnProperty(basename)) await this.setBackend(this._recursive_op(await this.getBackend(), \\\"files/\\\" + key, { type: \\\"write\\\", value: id }));\\n\\t\\t\\t},\\n\\t\\t\\trm: async function(key) {\\n\\t\\t\\t\\tkey = String(key);\\n\\t\\t\\t\\tlet pathParts = key.split(\\\"/\\\");\\n\\t\\t\\t\\tif (pathParts[0] == \\\"\\\") pathParts = pathParts.slice(1);\\n\\t\\t\\t\\tif (pathParts[pathParts.length - 1] == \\\"\\\") pathParts = pathParts.slice(0, -1);\\n\\t\\t\\t\\tlet files = (await this.getBackend()).files;\\n\\t\\t\\t\\tfor (let part of pathParts) {\\n\\t\\t\\t\\t\\tfiles = files[part];\\n\\t\\t\\t\\t\\tif (!files) throw new Error(\\\"NO_SUCH_FILE_DIR\\\");\\n\\t\\t\\t\\t}\\n\\t\\t\\t\\tif (typeof files === \\\"object\\\" && Object.keys(files).length > 0) throw new Error(\\\"NON_EMPTY_DIR\\\");\\n\\t\\t\\t\\tif (typeof files === \\\"string\\\") await modules.core.idb.removePart(partitionId + \\\"-\\\" + files);\\n\\t\\t\\t\\tawait this.setBackend(this._recursive_op(await this.getBackend(), \\\"files/\\\" + key, { type: \\\"delete\\\" }));\\n\\t\\t\\t\\tlet backend = await this.getBackend();\\n\\t\\t\\t\\tdelete backend.permissions[key];\\n\\t\\t\\t\\tawait this.setBackend(backend);\\n\\t\\t\\t},\\n\\t\\t\\tls: async function(directory) {\\n\\t\\t\\t\\tdirectory = String(directory);\\n\\t\\t\\t\\tlet pathParts = directory.split(\\\"/\\\");\\n\\t\\t\\t\\tif (pathParts[0] == \\\"\\\") pathParts = pathParts.slice(1);\\n\\t\\t\\t\\tif (pathParts[pathParts.length - 1] == \\\"\\\") pathParts = pathParts.slice(0, -1);\\n\\t\\t\\t\\tlet files = (await this.getBackend()).files;\\n\\t\\t\\t\\tfor (let part of pathParts) {\\n\\t\\t\\t\\t\\tfiles = files[part];\\n\\t\\t\\t\\t\\tif (!files) throw new Error(\\\"NO_SUCH_DIR\\\");\\n\\t\\t\\t\\t}\\n\\t\\t\\t\\tif (typeof files !== \\\"object\\\") throw new Error(\\\"IS_A_FILE\\\");\\n\\t\\t\\t\\treturn Object.keys(files);\\n\\t\\t\\t},\\n\\t\\t\\tmkdir: async function(directory) {\\n\\t\\t\\t\\tdirectory = String(directory);\\n\\t\\t\\t\\tlet existenceChecks = directory.split(\\\"/\\\").slice(0, -1);\\n\\t\\t\\t\\tif (existenceChecks[0] == \\\"\\\") existenceChecks = existenceChecks.slice(1);\\n\\t\\t\\t\\tif (existenceChecks[existenceChecks.length - 1] == \\\"\\\") existenceChecks = existenceChecks.slice(0, -1);\\n\\t\\t\\t\\tlet files = (await this.getBackend()).files;\\n\\t\\t\\t\\tfor (let part of existenceChecks) {\\n\\t\\t\\t\\t\\tfiles = files[part];\\n\\t\\t\\t\\t\\tif (!files) throw new Error(\\\"NO_SUCH_DIR\\\");\\n\\t\\t\\t\\t}\\n\\t\\t\\t\\tif (Object.keys(files).includes(directory.split(\\\"/\\\").slice(-1)[0])) throw new Error(\\\"DIR_EXISTS\\\");\\n\\t\\t\\t\\tawait this.setBackend(this._recursive_op(await this.getBackend(), \\\"files/\\\" + directory, { type: \\\"write\\\", value: {} }));\\n\\t\\t\\t},\\n\\t\\t\\tpermissions: async function(file) {\\n\\t\\t\\t\\tfile = String(file);\\n\\t\\t\\t\\tlet properFile = file.split(\\\"/\\\")\\n\\t\\t\\t\\tif (properFile[0] == \\\"\\\") properFile = properFile.slice(1);\\n\\t\\t\\t\\tif (properFile[properFile.length - 1] == \\\"\\\") properFile = properFile.slice(0, -1);\\n\\t\\t\\t\\tproperFile = properFile.join(\\\"/\\\");\\n\\t\\t\\t\\tlet randomNames = crypto.getRandomValues(new Uint8Array(8)).reduce((a, b) => a + b.toString(16).padStart(2, \\\"0\\\"), \\\"\\\");\\n\\t\\t\\t\\tlet permissions = (await this.getBackend()).permissions[properFile] || {};\\n\\t\\t\\t\\treturn {\\n\\t\\t\\t\\t\\towner: permissions.owner || randomNames,\\n\\t\\t\\t\\t\\tgroup: permissions.group || randomNames,\\n\\t\\t\\t\\t\\tworld: permissions.world || \\\"\\\",\\n\\t\\t\\t\\t\\trandom: !(permissions.owner || permissions.group || permissions.world) ? true : undefined\\n\\t\\t\\t\\t};\\n\\t\\t\\t},\\n\\t\\t\\tchown: async function(file, owner) {\\n\\t\\t\\t\\tfile = String(file);\\n\\t\\t\\t\\towner = String(owner);\\n\\t\\t\\t\\tlet properFile = file.split(\\\"/\\\")\\n\\t\\t\\t\\tif (properFile[0] == \\\"\\\") properFile = properFile.slice(1);\\n\\t\\t\\t\\tif (properFile[properFile.length - 1] == \\\"\\\") properFile = properFile.slice(0, -1);\\n\\t\\t\\t\\tproperFile = properFile.join(\\\"/\\\");\\n\\t\\t\\t\\tlet backend = await this.getBackend();\\n\\t\\t\\t\\tlet randomNames = crypto.getRandomValues(new Uint8Array(8)).reduce((a, b) => a + b.toString(16).padStart(2, \\\"0\\\"), \\\"\\\");\\n\\t\\t\\t\\tlet filePermissions = backend.permissions[properFile] || {\\n\\t\\t\\t\\t\\towner: randomNames,\\n\\t\\t\\t\\t\\tgroup: randomNames,\\n\\t\\t\\t\\t\\tworld: \\\"\\\",\\n\\t\\t\\t\\t};\\n\\t\\t\\t\\tfilePermissions.owner = owner;\\n\\t\\t\\t\\tbackend.permissions[properFile] = filePermissions;\\n\\t\\t\\t\\tawait this.setBackend(backend);\\n\\t\\t\\t},\\n\\t\\t\\tchgrp: async function(file, group) {\\n\\t\\t\\t\\tfile = String(file);\\n\\t\\t\\t\\tgroup = String(group);\\n\\t\\t\\t\\tlet properFile = file.split(\\\"/\\\")\\n\\t\\t\\t\\tif (properFile[0] == \\\"\\\") properFile = properFile.slice(1);\\n\\t\\t\\t\\tif (properFile[properFile.length - 1] == \\\"\\\") properFile = properFile.slice(0, -1);\\n\\t\\t\\t\\tproperFile = properFile.join(\\\"/\\\");\\n\\t\\t\\t\\tlet backend = await this.getBackend();\\n\\t\\t\\t\\tlet randomNames = crypto.getRandomValues(new Uint8Array(8)).reduce((a, b) => a + b.toString(16).padStart(2, \\\"0\\\"), \\\"\\\");\\n\\t\\t\\t\\tlet filePermissions = backend.permissions[properFile] || {\\n\\t\\t\\t\\t\\towner: randomNames,\\n\\t\\t\\t\\t\\tgroup: randomNames,\\n\\t\\t\\t\\t\\tworld: \\\"\\\",\\n\\t\\t\\t\\t};\\n\\t\\t\\t\\tfilePermissions.group = group;\\n\\t\\t\\t\\tbackend.permissions[properFile] = filePermissions;\\n\\t\\t\\t\\tawait this.setBackend(backend);\\n\\t\\t\\t},\\n\\t\\t\\tchmod: async function(file, permissions) {\\n\\t\\t\\t\\tfile = String(file);\\n\\t\\t\\t\\tpermissions = String(permissions);\\n\\t\\t\\t\\tlet properFile = file.split(\\\"/\\\")\\n\\t\\t\\t\\tif (properFile[0] == \\\"\\\") properFile = properFile.slice(1);\\n\\t\\t\\t\\tif (properFile[properFile.length - 1] == \\\"\\\") properFile = properFile.slice(0, -1);\\n\\t\\t\\t\\tproperFile = properFile.join(\\\"/\\\");\\n\\t\\t\\t\\tlet backend = await this.getBackend();\\n\\t\\t\\t\\tlet randomNames = crypto.getRandomValues(new Uint8Array(8)).reduce((a, b) => a + b.toString(16).padStart(2, \\\"0\\\"), \\\"\\\");\\n\\t\\t\\t\\tlet filePermissions = backend.permissions[properFile] || {\\n\\t\\t\\t\\t\\towner: randomNames,\\n\\t\\t\\t\\t\\tgroup: randomNames,\\n\\t\\t\\t\\t\\tworld: \\\"\\\",\\n\\t\\t\\t\\t};\\n\\t\\t\\t\\tfilePermissions.world = permissions;\\n\\t\\t\\t\\tbackend.permissions[properFile] = filePermissions;\\n\\t\\t\\t\\tawait this.setBackend(backend);\\n\\t\\t\\t},\\n\\t\\t\\tisDirectory: async function(key) {\\n\\t\\t\\t\\tkey = String(key);\\n\\t\\t\\t\\tlet pathParts = key.split(\\\"/\\\").slice(0, -1);\\n\\t\\t\\t\\tif (pathParts[0] == \\\"\\\") pathParts = pathParts.slice(1);\\n\\t\\t\\t\\tif (pathParts[pathParts.length - 1] == \\\"\\\") pathParts = pathParts.slice(0, -1);\\n\\t\\t\\t\\tlet basename = key.split(\\\"/\\\").slice(-1)[0];\\n\\t\\t\\t\\tlet files = (await this.getBackend()).files;\\n\\t\\t\\t\\tfor (let part of pathParts) {\\n\\t\\t\\t\\t\\tfiles = files[part];\\n\\t\\t\\t\\t\\tif (!files) throw new Error(\\\"NO_SUCH_DIR\\\");\\n\\t\\t\\t\\t}\\n\\t\\t\\t\\tif (!files.hasOwnProperty(basename)) throw new Error(\\\"NO_SUCH_FILE_DIR\\\");\\n\\t\\t\\t\\tif (typeof files[basename] === \\\"object\\\") return true;\\n\\t\\t\\t\\treturn false;\\n\\t\\t\\t},\\n\\t\\t\\tsync: async function() {\\n\\t\\t\\t\\tawait modules.core.disk.sync();\\n\\t\\t\\t},\\n\\t\\t\\tunmount: () => true,\\n\\t\\t\\t_recursive_op: function(obj, path, action, stage = 0) {\\n\\t\\t\\t\\tif (path.split(\\\"/\\\").length == (stage + 1)) {\\n\\t\\t\\t\\t\\tif (action.type == \\\"delete\\\") delete obj[path.split(\\\"/\\\").slice(-1)[0]];\\n\\t\\t\\t\\t\\tif (action.type == \\\"write\\\") obj[path.split(\\\"/\\\").slice(-1)[0]] = action.value;\\n\\t\\t\\t\\t} else obj[path.split(\\\"/\\\")[stage]] = this._recursive_op(obj[path.split(\\\"/\\\")[stage]], path, action, stage + 1);\\n\\t\\t\\t\\treturn obj;\\n\\t\\t\\t},\\n\\t\\t\\tdirectory_supported: true,\\n\\t\\t\\tfilesystem: \\\"PCFS-AES\\\",\\n\\t\\t\\tread_only: !!options.read_only,\\n\\t\\t\\tpermissions_supported: true,\\n\\t\\t\\tpartition: null,\\n\\t\\t\\tgetBackend: async function() {\\n\\t\\t\\t\\tif (!this.partition) this.partition = modules.core.disk.partition(options.partition);\\n\\t\\t\\t\\tlet returnedData = this.partition.getData();\\n\\t\\t\\t\\tif (returnedData.encryptedFileTable) {\\n\\t\\t\\t\\t\\tlet iv = new Uint8Array(returnedData.encryptedFileTable.slice(0, 32).match(/.{1,2}/g).map(a => parseInt(a, 16)));\\n\\t\\t\\t\\t\\tlet ct = new Uint8Array(returnedData.encryptedFileTable.slice(32).match(/.{1,2}/g).map(a => parseInt(a, 16)));\\n\\t\\t\\t\\t\\treturn JSON.parse(new TextDecoder().decode(new Uint8Array(await crypto.subtle.decrypt({ name: \\\"AES-GCM\\\", iv }, this.key, ct))));   \\n\\t\\t\\t\\t}\\n\\t\\t\\t\\treturn returnedData;\\n\\t\\t\\t},\\n\\t\\t\\tsetBackend: async function(data) {\\n\\t\\t\\t\\tif (!this.partition) this.partition = modules.core.disk.partition(options.partition);\\n\\t\\t\\t\\tlet returnedData = this.partition.getData();\\n\\t\\t\\t\\tif (returnedData.encryptedFileTable) {\\n\\t\\t\\t\\t\\tlet newIV = crypto.getRandomValues(new Uint8Array(16));\\n\\t\\t\\t\\t\\tlet newCT = new Uint8Array(await crypto.subtle.encrypt({ name: \\\"AES-GCM\\\", iv: newIV }, this.key, new TextEncoder().encode(JSON.stringify(data))));\\n\\t\\t\\t\\t\\tlet newPart = new Uint8Array(newIV.length + newCT.length);\\n\\t\\t\\t\\t\\tnewPart.set(newIV);\\n\\t\\t\\t\\t\\tnewPart.set(newCT, newIV.length);\\n\\t\\t\\t\\t\\tnewPart = newPart.reduce((a, b) => a + b.toString(16).padStart(2, \\\"0\\\"), \\\"\\\");\\n\\t\\t\\t\\t\\treturn this.partition.setData({ ...returnedData, encryptedFileTable: newPart });\\n\\t\\t\\t\\t}\\n\\t\\t\\t\\tthis.partition.setData(data);\\n\\t\\t\\t},\\n\\t\\t\\tkey: importedKey\\n\\t\\t};\\n\\t};\\n\\t\\n\\tfunction ramMount(options) {\\n\\t\\tlet randomNames = crypto.getRandomValues(new Uint8Array(8)).reduce((a, b) => a + b.toString(16).padStart(2, \\\"0\\\"), \\\"\\\");\\n\\t\\treturn {\\n\\t\\t\\tread: async function(key) {\\n\\t\\t\\t\\tkey = String(key);\\n\\t\\t\\t\\tlet pathParts = key.split(\\\"/\\\");\\n\\t\\t\\t\\tif (pathParts[0] == \\\"\\\") pathParts = pathParts.slice(1);\\n\\t\\t\\t\\tlet files = this.backend.files;\\n\\t\\t\\t\\tfor (let part of pathParts) {\\n\\t\\t\\t\\t\\tfiles = files[part];\\n\\t\\t\\t\\t\\tif (!files) throw new Error(\\\"NO_SUCH_FILE\\\");\\n\\t\\t\\t\\t}\\n\\t\\t\\t\\tif (typeof files === \\\"object\\\") throw new Error(\\\"IS_A_DIR\\\");\\n\\t\\t\\t\\treturn String(this.ramFiles.get(files));\\n\\t\\t\\t},\\n\\t\\t\\twrite: async function(key, value) {\\n\\t\\t\\t\\tkey = String(key);\\n\\t\\t\\t\\tvalue = String(value);\\n\\t\\t\\t\\tlet existenceChecks = key.split(\\\"/\\\").slice(0, -1);\\n\\t\\t\\t\\tif (existenceChecks[0] == \\\"\\\") existenceChecks = existenceChecks.slice(1);\\n\\t\\t\\t\\tif (existenceChecks[existenceChecks.length - 1] == \\\"\\\") existenceChecks = existenceChecks.slice(0, -1);\\n\\t\\t\\t\\tlet basename = key.split(\\\"/\\\").slice(-1)[0];\\n\\t\\t\\t\\tlet files = this.backend.files;\\n\\t\\t\\t\\tfor (let part of existenceChecks) {\\n\\t\\t\\t\\t\\tfiles = files[part];\\n\\t\\t\\t\\t\\tif (!files) throw new Error(\\\"NO_SUCH_DIR\\\");\\n\\t\\t\\t\\t}\\n\\t\\t\\t\\tif (typeof files[basename] === \\\"object\\\") throw new Error(\\\"IS_A_DIR\\\");\\n\\t\\t\\t\\tlet id = files[basename] || crypto.getRandomValues(new Uint8Array(64)).reduce((a, b) => a + b.toString(16).padStart(2, \\\"0\\\"), \\\"\\\");\\n\\t\\t\\t\\tthis.ramFiles.set(id, value);\\n\\t\\t\\t\\tif (!files.hasOwnProperty(basename)) this.backend = this._recursive_op(this.backend, \\\"files/\\\" + key, { type: \\\"write\\\", value: id });\\n\\t\\t\\t},\\n\\t\\t\\trm: async function(key) {\\n\\t\\t\\t\\tkey = String(key);\\n\\t\\t\\t\\tlet pathParts = key.split(\\\"/\\\");\\n\\t\\t\\t\\tif (pathParts[0] == \\\"\\\") pathParts = pathParts.slice(1);\\n\\t\\t\\t\\tif (pathParts[pathParts.length - 1] == \\\"\\\") pathParts = pathParts.slice(0, -1);\\n\\t\\t\\t\\tlet files = this.backend.files;\\n\\t\\t\\t\\tfor (let part of pathParts) {\\n\\t\\t\\t\\t\\tfiles = files[part];\\n\\t\\t\\t\\t\\tif (!files) throw new Error(\\\"NO_SUCH_FILE_DIR\\\");\\n\\t\\t\\t\\t}\\n\\t\\t\\t\\tif (typeof files === \\\"object\\\" && Object.keys(files).length > 0) throw new Error(\\\"NON_EMPTY_DIR\\\");\\n\\t\\t\\t\\tif (typeof files === \\\"string\\\") this.ramFiles.delete(files);\\n\\t\\t\\t\\tthis.backend = this._recursive_op(this.backend, \\\"files/\\\" + key, { type: \\\"delete\\\" });\\n\\t\\t\\t\\tlet backend = this.backend;\\n\\t\\t\\t\\tdelete backend.permissions[key];\\n\\t\\t\\t\\tthis.backend = backend;\\n\\t\\t\\t},\\n\\t\\t\\tls: async function(directory) {\\n\\t\\t\\t\\tdirectory = String(directory);\\n\\t\\t\\t\\tlet pathParts = directory.split(\\\"/\\\");\\n\\t\\t\\t\\tif (pathParts[0] == \\\"\\\") pathParts = pathParts.slice(1);\\n\\t\\t\\t\\tif (pathParts[pathParts.length - 1] == \\\"\\\") pathParts = pathParts.slice(0, -1);\\n\\t\\t\\t\\tlet files = this.backend.files;\\n\\t\\t\\t\\tfor (let part of pathParts) {\\n\\t\\t\\t\\t\\tfiles = files[part];\\n\\t\\t\\t\\t\\tif (!files) throw new Error(\\\"NO_SUCH_DIR\\\");\\n\\t\\t\\t\\t}\\n\\t\\t\\t\\tif (typeof files !== \\\"object\\\") throw new Error(\\\"IS_A_FILE\\\");\\n\\t\\t\\t\\treturn Object.keys(files);\\n\\t\\t\\t},\\n\\t\\t\\tmkdir: async function(directory) {\\n\\t\\t\\t\\tdirectory = String(directory);\\n\\t\\t\\t\\tlet existenceChecks = directory.split(\\\"/\\\").slice(0, -1);\\n\\t\\t\\t\\tif (existenceChecks[0] == \\\"\\\") existenceChecks = existenceChecks.slice(1);\\n\\t\\t\\t\\tif (existenceChecks[existenceChecks.length - 1] == \\\"\\\") existenceChecks = existenceChecks.slice(0, -1);\\n\\t\\t\\t\\tlet files = this.backend.files;\\n\\t\\t\\t\\tfor (let part of existenceChecks) {\\n\\t\\t\\t\\t\\tfiles = files[part];\\n\\t\\t\\t\\t\\tif (!files) throw new Error(\\\"NO_SUCH_DIR\\\");\\n\\t\\t\\t\\t}\\n\\t\\t\\t\\tif (Object.keys(files).includes(directory.split(\\\"/\\\").slice(-1)[0])) throw new Error(\\\"DIR_EXISTS\\\");\\n\\t\\t\\t\\tthis.backend = this._recursive_op(this.backend, \\\"files/\\\" + directory, { type: \\\"write\\\", value: {} });\\n\\t\\t\\t},\\n\\t\\t\\tpermissions: async function(file) {\\n\\t\\t\\t\\tfile = String(file);\\n\\t\\t\\t\\tlet properFile = file.split(\\\"/\\\")\\n\\t\\t\\t\\tif (properFile[0] == \\\"\\\") properFile = properFile.slice(1);\\n\\t\\t\\t\\tif (properFile[properFile.length - 1] == \\\"\\\") properFile = properFile.slice(0, -1);\\n\\t\\t\\t\\tproperFile = properFile.join(\\\"/\\\");\\n\\t\\t\\t\\tlet randomNames = crypto.getRandomValues(new Uint8Array(8)).reduce((a, b) => a + b.toString(16).padStart(2, \\\"0\\\"), \\\"\\\");\\n\\t\\t\\t\\tlet permissions = this.backend.permissions[properFile] || {};\\n\\t\\t\\t\\treturn {\\n\\t\\t\\t\\t\\towner: permissions.owner || randomNames,\\n\\t\\t\\t\\t\\tgroup: permissions.group || randomNames,\\n\\t\\t\\t\\t\\tworld: permissions.world || \\\"\\\",\\n\\t\\t\\t\\t\\trandom: !(permissions.owner || permissions.group || permissions.world) ? true : undefined\\n\\t\\t\\t\\t};\\n\\t\\t\\t},\\n\\t\\t\\tchown: async function(file, owner) {\\n\\t\\t\\t\\tfile = String(file);\\n\\t\\t\\t\\towner = String(owner);\\n\\t\\t\\t\\tlet properFile = file.split(\\\"/\\\")\\n\\t\\t\\t\\tif (properFile[0] == \\\"\\\") properFile = properFile.slice(1);\\n\\t\\t\\t\\tif (properFile[properFile.length - 1] == \\\"\\\") properFile = properFile.slice(0, -1);\\n\\t\\t\\t\\tproperFile = properFile.join(\\\"/\\\");\\n\\t\\t\\t\\tlet backend = this.backend;\\n\\t\\t\\t\\tlet randomNames = crypto.getRandomValues(new Uint8Array(8)).reduce((a, b) => a + b.toString(16).padStart(2, \\\"0\\\"), \\\"\\\");\\n\\t\\t\\t\\tlet filePermissions = backend.permissions[properFile] || {\\n\\t\\t\\t\\t\\towner: randomNames,\\n\\t\\t\\t\\t\\tgroup: randomNames,\\n\\t\\t\\t\\t\\tworld: \\\"\\\",\\n\\t\\t\\t\\t};\\n\\t\\t\\t\\tfilePermissions.owner = owner;\\n\\t\\t\\t\\tbackend.permissions[properFile] = filePermissions;\\n\\t\\t\\t\\tthis.backend = backend;\\n\\t\\t\\t},\\n\\t\\t\\tchgrp: async function(file, group) {\\n\\t\\t\\t\\tfile = String(file);\\n\\t\\t\\t\\tgroup = String(group);\\n\\t\\t\\t\\tlet properFile = file.split(\\\"/\\\")\\n\\t\\t\\t\\tif (properFile[0] == \\\"\\\") properFile = properFile.slice(1);\\n\\t\\t\\t\\tif (properFile[properFile.length - 1] == \\\"\\\") properFile = properFile.slice(0, -1);\\n\\t\\t\\t\\tproperFile = properFile.join(\\\"/\\\");\\n\\t\\t\\t\\tlet backend = this.backend;\\n\\t\\t\\t\\tlet randomNames = crypto.getRandomValues(new Uint8Array(8)).reduce((a, b) => a + b.toString(16).padStart(2, \\\"0\\\"), \\\"\\\");\\n\\t\\t\\t\\tlet filePermissions = backend.permissions[properFile] || {\\n\\t\\t\\t\\t\\towner: randomNames,\\n\\t\\t\\t\\t\\tgroup: randomNames,\\n\\t\\t\\t\\t\\tworld: \\\"\\\",\\n\\t\\t\\t\\t};\\n\\t\\t\\t\\tfilePermissions.group = group;\\n\\t\\t\\t\\tbackend.permissions[properFile] = filePermissions;\\n\\t\\t\\t\\tthis.backend = backend;\\n\\t\\t\\t},\\n\\t\\t\\tchmod: async function(file, permissions) {\\n\\t\\t\\t\\tfile = String(file);\\n\\t\\t\\t\\tpermissions = String(permissions);\\n\\t\\t\\t\\tlet properFile = file.split(\\\"/\\\")\\n\\t\\t\\t\\tif (properFile[0] == \\\"\\\") properFile = properFile.slice(1);\\n\\t\\t\\t\\tif (properFile[properFile.length - 1] == \\\"\\\") properFile = properFile.slice(0, -1);\\n\\t\\t\\t\\tproperFile = properFile.join(\\\"/\\\");\\n\\t\\t\\t\\tlet backend = this.backend;\\n\\t\\t\\t\\tlet randomNames = crypto.getRandomValues(new Uint8Array(8)).reduce((a, b) => a + b.toString(16).padStart(2, \\\"0\\\"), \\\"\\\");\\n\\t\\t\\t\\tlet filePermissions = backend.permissions[properFile] || {\\n\\t\\t\\t\\t\\towner: randomNames,\\n\\t\\t\\t\\t\\tgroup: randomNames,\\n\\t\\t\\t\\t\\tworld: \\\"\\\",\\n\\t\\t\\t\\t};\\n\\t\\t\\t\\tfilePermissions.world = permissions;\\n\\t\\t\\t\\tbackend.permissions[properFile] = filePermissions;\\n\\t\\t\\t\\tthis.backend = backend;\\n\\t\\t\\t},\\n\\t\\t\\tisDirectory: function(key) {\\n\\t\\t\\t\\tkey = String(key);\\n\\t\\t\\t\\tlet pathParts = key.split(\\\"/\\\").slice(0, -1);\\n\\t\\t\\t\\tif (pathParts[0] == \\\"\\\") pathParts = pathParts.slice(1);\\n\\t\\t\\t\\tif (pathParts[pathParts.length - 1] == \\\"\\\") pathParts = pathParts.slice(0, -1);\\n\\t\\t\\t\\tlet basename = key.split(\\\"/\\\").slice(-1)[0];\\n\\t\\t\\t\\tlet files = this.backend.files;\\n\\t\\t\\t\\tfor (let part of pathParts) {\\n\\t\\t\\t\\t\\tfiles = files[part];\\n\\t\\t\\t\\t\\tif (!files) throw new Error(\\\"NO_SUCH_DIR\\\");\\n\\t\\t\\t\\t}\\n\\t\\t\\t\\tif (!files.hasOwnProperty(basename)) throw new Error(\\\"NO_SUCH_FILE_DIR\\\");\\n\\t\\t\\t\\tif (typeof files[basename] === \\\"object\\\") return true;\\n\\t\\t\\t\\treturn false;\\n\\t\\t\\t},\\n\\t\\t\\t_recursive_op: function(obj, path, action, stage = 0) {\\n\\t\\t\\t\\tif (path.split(\\\"/\\\").length == (stage + 1)) {\\n\\t\\t\\t\\t\\tif (action.type == \\\"delete\\\") delete obj[path.split(\\\"/\\\").slice(-1)[0]];\\n\\t\\t\\t\\t\\tif (action.type == \\\"write\\\") obj[path.split(\\\"/\\\").slice(-1)[0]] = action.value;\\n\\t\\t\\t\\t} else obj[path.split(\\\"/\\\")[stage]] = this._recursive_op(obj[path.split(\\\"/\\\")[stage]], path, action, stage + 1);\\n\\t\\t\\t\\treturn obj;\\n\\t\\t\\t},\\n\\t\\t\\tsync: () => true,\\n\\t\\t\\tunmount: () => true,\\n\\t\\t\\tdirectory_supported: true,\\n\\t\\t\\tread_only: !!options.read_only,\\n\\t\\t\\tfilesystem: \\\"extramfs\\\",\\n\\t\\t\\tpermissions_supported: true,\\n\\t\\t\\tbackend: options.type == \\\"run\\\" ? { files: { run: {} }, permissions: {\\n\\t\\t\\t\\t\\\"\\\": {\\n\\t\\t\\t\\t\\towner: randomNames,\\n\\t\\t\\t\\t\\tgroup: randomNames,\\n\\t\\t\\t\\t\\tworld: \\\"rx\\\"\\n\\t\\t\\t\\t},\\n\\t\\t\\t\\trun: {\\n\\t\\t\\t\\t\\towner: randomNames,\\n\\t\\t\\t\\t\\tgroup: randomNames,\\n\\t\\t\\t\\t\\tworld: \\\"rwx\\\"\\n\\t\\t\\t\\t}\\n\\t\\t\\t}} : { files: {}, permissions: {\\n\\t\\t\\t\\t\\\"\\\": {\\n\\t\\t\\t\\t\\towner: randomNames,\\n\\t\\t\\t\\t\\tgroup: randomNames,\\n\\t\\t\\t\\t\\tworld: \\\"rx\\\"\\n\\t\\t\\t\\t}\\n\\t\\t\\t} },\\n\\t\\t\\tramFiles: new Map()\\n\\t\\t};\\n\\t}\\n\\t\\n\\tfunction preferenceMount(options) {\\n\\t\\treturn {\\n\\t\\t\\tread: a => JSON.stringify(modules.core.prefs.read(a), null, \\\"\\\\t\\\"),\\n\\t\\t\\twrite: (a, b) => modules.core.prefs.write(a, JSON.parse(b)),\\n\\t\\t\\trm: a => modules.core.prefs.rm(a),\\n\\t\\t\\tls: a => modules.core.prefs.ls(a),\\n\\t\\t\\tpermissions: function() {\\n\\t\\t\\t\\tlet randomNames = crypto.getRandomValues(new Uint8Array(8)).reduce((a, b) => a + b.toString(16).padStart(2, \\\"0\\\"), \\\"\\\");\\n\\t\\t\\t\\treturn {\\n\\t\\t\\t\\t\\towner: randomNames,\\n\\t\\t\\t\\t\\tgroup: randomNames,\\n\\t\\t\\t\\t\\tworld: \\\"\\\",\\n\\t\\t\\t\\t};\\n\\t\\t\\t},\\n\\t\\t\\tchown: _ => !1,\\n\\t\\t\\tchgrp: _ => !1,\\n\\t\\t\\tchmod: _ => !1,\\n\\t\\t\\tsync: () => true,\\n\\t\\t\\tunmount: () => true,\\n\\t\\t\\tdirectory_supported: false,\\n\\t\\t\\tread_only: !!options.read_only,\\n\\t\\t\\tfilesystem: \\\"preffs\\\",\\n\\t\\t\\tpermissions_supported: true\\n\\t\\t};\\n\\t}\\n\\n\\tasync function SFSPMount(options) {\\n\\t\\tlet session, serverData;\\n\\t\\ttry {\\n\\t\\t\\tsession = await fetch(options.url + \\\"/session\\\");\\n\\t\\t\\tsession = await session.json();\\n\\t\\t\\tserverData = await fetch(options.url + \\\"/properties\\\", {\\n\\t\\t\\t\\tmethod: \\\"POST\\\",\\n\\t\\t\\t\\theaders: {\\n\\t\\t\\t\\t\\t\\\"Content-Type\\\": \\\"application/json\\\"\\n\\t\\t\\t\\t},\\n\\t\\t\\t\\tbody: JSON.stringify({\\n\\t\\t\\t\\t\\t...options,\\n\\t\\t\\t\\t\\tsessionToken: session\\n\\t\\t\\t\\t})\\n\\t\\t\\t});\\n\\t\\t\\tserverData = await serverData.json();\\n\\t\\t} catch (e) {\\n\\t\\t\\tthrow new Error(\\\"Could not connect to server\\\");\\n\\t\\t}\\n\\t\\treturn {\\n\\t\\t\\tread: async function(...a) {\\n\\t\\t\\t\\tlet req = await fetch(options.url + \\\"/file_operation\\\", {\\n\\t\\t\\t\\t\\tmethod: \\\"POST\\\",\\n\\t\\t\\t\\t\\theaders: {\\n\\t\\t\\t\\t\\t\\t\\\"Content-Type\\\": \\\"application/json\\\"\\n\\t\\t\\t\\t\\t},\\n\\t\\t\\t\\t\\tbody: JSON.stringify({\\n\\t\\t\\t\\t\\t\\tsessionToken: session,\\n\\t\\t\\t\\t\\t\\toperation: \\\"read\\\",\\n\\t\\t\\t\\t\\t\\tparameters: a\\n\\t\\t\\t\\t\\t})\\n\\t\\t\\t\\t});\\n\\t\\t\\t\\tif (!req.ok) throw (await req.json());\\n\\t\\t\\t\\treturn await req.json();\\n\\t\\t\\t},\\n\\t\\t\\twrite: async function(...a) {\\n\\t\\t\\t\\tlet req = await fetch(options.url + \\\"/file_operation\\\", {\\n\\t\\t\\t\\t\\tmethod: \\\"POST\\\",\\n\\t\\t\\t\\t\\theaders: {\\n\\t\\t\\t\\t\\t\\t\\\"Content-Type\\\": \\\"application/json\\\"\\n\\t\\t\\t\\t\\t},\\n\\t\\t\\t\\t\\tbody: JSON.stringify({\\n\\t\\t\\t\\t\\t\\tsessionToken: session,\\n\\t\\t\\t\\t\\t\\toperation: \\\"write\\\",\\n\\t\\t\\t\\t\\t\\tparameters: a\\n\\t\\t\\t\\t\\t})\\n\\t\\t\\t\\t});\\n\\t\\t\\t\\tif (!req.ok) throw (await req.json());\\n\\t\\t\\t\\treturn await req.json();\\n\\t\\t\\t},\\n\\t\\t\\trm: async function(...a) {\\n\\t\\t\\t\\tlet req = await fetch(options.url + \\\"/file_operation\\\", {\\n\\t\\t\\t\\t\\tmethod: \\\"POST\\\",\\n\\t\\t\\t\\t\\theaders: {\\n\\t\\t\\t\\t\\t\\t\\\"Content-Type\\\": \\\"application/json\\\"\\n\\t\\t\\t\\t\\t},\\n\\t\\t\\t\\t\\tbody: JSON.stringify({\\n\\t\\t\\t\\t\\t\\tsessionToken: session,\\n\\t\\t\\t\\t\\t\\toperation: \\\"rm\\\",\\n\\t\\t\\t\\t\\t\\tparameters: a\\n\\t\\t\\t\\t\\t})\\n\\t\\t\\t\\t});\\n\\t\\t\\t\\tif (!req.ok) throw (await req.json());\\n\\t\\t\\t\\treturn await req.json();\\n\\t\\t\\t},\\n\\t\\t\\tls: async function(...a) {\\n\\t\\t\\t\\tlet req = await fetch(options.url + \\\"/file_operation\\\", {\\n\\t\\t\\t\\t\\tmethod: \\\"POST\\\",\\n\\t\\t\\t\\t\\theaders: {\\n\\t\\t\\t\\t\\t\\t\\\"Content-Type\\\": \\\"application/json\\\"\\n\\t\\t\\t\\t\\t},\\n\\t\\t\\t\\t\\tbody: JSON.stringify({\\n\\t\\t\\t\\t\\t\\tsessionToken: session,\\n\\t\\t\\t\\t\\t\\toperation: \\\"ls\\\",\\n\\t\\t\\t\\t\\t\\tparameters: a\\n\\t\\t\\t\\t\\t})\\n\\t\\t\\t\\t});\\n\\t\\t\\t\\tif (!req.ok) throw (await req.json());\\n\\t\\t\\t\\treturn await req.json();\\n\\t\\t\\t},\\n\\t\\t\\tmkdir: async function(...a) {\\n\\t\\t\\t\\tlet req = await fetch(options.url + \\\"/file_operation\\\", {\\n\\t\\t\\t\\t\\tmethod: \\\"POST\\\",\\n\\t\\t\\t\\t\\theaders: {\\n\\t\\t\\t\\t\\t\\t\\\"Content-Type\\\": \\\"application/json\\\"\\n\\t\\t\\t\\t\\t},\\n\\t\\t\\t\\t\\tbody: JSON.stringify({\\n\\t\\t\\t\\t\\t\\tsessionToken: session,\\n\\t\\t\\t\\t\\t\\toperation: \\\"mkdir\\\",\\n\\t\\t\\t\\t\\t\\tparameters: a\\n\\t\\t\\t\\t\\t})\\n\\t\\t\\t\\t});\\n\\t\\t\\t\\tif (!req.ok) throw (await req.json());\\n\\t\\t\\t\\treturn await req.json();\\n\\t\\t\\t},\\n\\t\\t\\tpermissions: async function(...a) {\\n\\t\\t\\t\\tlet req = await fetch(options.url + \\\"/file_operation\\\", {\\n\\t\\t\\t\\t\\tmethod: \\\"POST\\\",\\n\\t\\t\\t\\t\\theaders: {\\n\\t\\t\\t\\t\\t\\t\\\"Content-Type\\\": \\\"application/json\\\"\\n\\t\\t\\t\\t\\t},\\n\\t\\t\\t\\t\\tbody: JSON.stringify({\\n\\t\\t\\t\\t\\t\\tsessionToken: session,\\n\\t\\t\\t\\t\\t\\toperation: \\\"permissions\\\",\\n\\t\\t\\t\\t\\t\\tparameters: a\\n\\t\\t\\t\\t\\t})\\n\\t\\t\\t\\t});\\n\\t\\t\\t\\tif (!req.ok) throw (await req.json());\\n\\t\\t\\t\\treturn await req.json();\\n\\t\\t\\t},\\n\\t\\t\\tchown: async function(...a) {\\n\\t\\t\\t\\tlet req = await fetch(options.url + \\\"/file_operation\\\", {\\n\\t\\t\\t\\t\\tmethod: \\\"POST\\\",\\n\\t\\t\\t\\t\\theaders: {\\n\\t\\t\\t\\t\\t\\t\\\"Content-Type\\\": \\\"application/json\\\"\\n\\t\\t\\t\\t\\t},\\n\\t\\t\\t\\t\\tbody: JSON.stringify({\\n\\t\\t\\t\\t\\t\\tsessionToken: session,\\n\\t\\t\\t\\t\\t\\toperation: \\\"chown\\\",\\n\\t\\t\\t\\t\\t\\tparameters: a\\n\\t\\t\\t\\t\\t})\\n\\t\\t\\t\\t});\\n\\t\\t\\t\\tif (!req.ok) throw (await req.json());\\n\\t\\t\\t\\treturn await req.json();\\n\\t\\t\\t},\\n\\t\\t\\tchgrp: async function(...a) {\\n\\t\\t\\t\\tlet req = await fetch(options.url + \\\"/file_operation\\\", {\\n\\t\\t\\t\\t\\tmethod: \\\"POST\\\",\\n\\t\\t\\t\\t\\theaders: {\\n\\t\\t\\t\\t\\t\\t\\\"Content-Type\\\": \\\"application/json\\\"\\n\\t\\t\\t\\t\\t},\\n\\t\\t\\t\\t\\tbody: JSON.stringify({\\n\\t\\t\\t\\t\\t\\tsessionToken: session,\\n\\t\\t\\t\\t\\t\\toperation: \\\"chgrp\\\",\\n\\t\\t\\t\\t\\t\\tparameters: a\\n\\t\\t\\t\\t\\t})\\n\\t\\t\\t\\t});\\n\\t\\t\\t\\tif (!req.ok) throw (await req.json());\\n\\t\\t\\t\\treturn await req.json();\\n\\t\\t\\t},\\n\\t\\t\\tchmod: async function(...a) {\\n\\t\\t\\t\\tlet req = await fetch(options.url + \\\"/file_operation\\\", {\\n\\t\\t\\t\\t\\tmethod: \\\"POST\\\",\\n\\t\\t\\t\\t\\theaders: {\\n\\t\\t\\t\\t\\t\\t\\\"Content-Type\\\": \\\"application/json\\\"\\n\\t\\t\\t\\t\\t},\\n\\t\\t\\t\\t\\tbody: JSON.stringify({\\n\\t\\t\\t\\t\\t\\tsessionToken: session,\\n\\t\\t\\t\\t\\t\\toperation: \\\"chmod\\\",\\n\\t\\t\\t\\t\\t\\tparameters: a\\n\\t\\t\\t\\t\\t})\\n\\t\\t\\t\\t});\\n\\t\\t\\t\\tif (!req.ok) throw (await req.json());\\n\\t\\t\\t\\treturn await req.json();\\n\\t\\t\\t},\\n\\t\\t\\tsync: async function(...a) {\\n\\t\\t\\t\\tlet req = await fetch(options.url + \\\"/file_operation\\\", {\\n\\t\\t\\t\\t\\tmethod: \\\"POST\\\",\\n\\t\\t\\t\\t\\theaders: {\\n\\t\\t\\t\\t\\t\\t\\\"Content-Type\\\": \\\"application/json\\\"\\n\\t\\t\\t\\t\\t},\\n\\t\\t\\t\\t\\tbody: JSON.stringify({\\n\\t\\t\\t\\t\\t\\tsessionToken: session,\\n\\t\\t\\t\\t\\t\\toperation: \\\"sync\\\",\\n\\t\\t\\t\\t\\t\\tparameters: a\\n\\t\\t\\t\\t\\t})\\n\\t\\t\\t\\t});\\n\\t\\t\\t\\tif (!req.ok) throw (await req.json());\\n\\t\\t\\t\\treturn await req.json();\\n\\t\\t\\t},\\n\\t\\t\\tisDirectory: async function(...a) {\\n\\t\\t\\t\\tlet req = await fetch(options.url + \\\"/file_operation\\\", {\\n\\t\\t\\t\\t\\tmethod: \\\"POST\\\",\\n\\t\\t\\t\\t\\theaders: {\\n\\t\\t\\t\\t\\t\\t\\\"Content-Type\\\": \\\"application/json\\\"\\n\\t\\t\\t\\t\\t},\\n\\t\\t\\t\\t\\tbody: JSON.stringify({\\n\\t\\t\\t\\t\\t\\tsessionToken: session,\\n\\t\\t\\t\\t\\t\\toperation: \\\"isDirectory\\\",\\n\\t\\t\\t\\t\\t\\tparameters: a\\n\\t\\t\\t\\t\\t})\\n\\t\\t\\t\\t});\\n\\t\\t\\t\\tif (!req.ok) throw (await req.json());\\n\\t\\t\\t\\treturn await req.json();\\n\\t\\t\\t},\\n\\t\\t\\tunmount: async function(...a) {\\n\\t\\t\\t\\tlet req = await fetch(options.url + \\\"/file_operation\\\", {\\n\\t\\t\\t\\t\\tmethod: \\\"POST\\\",\\n\\t\\t\\t\\t\\theaders: {\\n\\t\\t\\t\\t\\t\\t\\\"Content-Type\\\": \\\"application/json\\\"\\n\\t\\t\\t\\t\\t},\\n\\t\\t\\t\\t\\tbody: JSON.stringify({\\n\\t\\t\\t\\t\\t\\tsessionToken: session,\\n\\t\\t\\t\\t\\t\\toperation: \\\"unmount\\\",\\n\\t\\t\\t\\t\\t\\tparameters: a\\n\\t\\t\\t\\t\\t})\\n\\t\\t\\t\\t});\\n\\t\\t\\t\\tif (!req.ok) throw (await req.json());\\n\\t\\t\\t\\treturn await req.json();\\n\\t\\t\\t},\\n\\t\\t\\t...serverData\\n\\t\\t};\\n\\t};\\n\\n\\tasync function IPCMount(options) { // ChatGPT code below\\n\\t\\tif (!options.inputPipeId || !options.outputPipeId) throw new Error(\\\"PIPE_IDS_REQUIRED\\\");\\n\\t\\n\\t\\tconst inputPipeId = options.inputPipeId;\\n\\t\\tconst outputPipeId = options.outputPipeId;\\n\\t\\tlet lock = false;\\n\\t\\n\\t\\tasync function acquireLock() {\\n\\t\\t\\treturn new Promise((resolve) => {\\n\\t\\t\\t\\tconst tryLock = () => {\\n\\t\\t\\t\\t\\tif (!lock) {\\n\\t\\t\\t\\t\\t\\tlock = true;\\n\\t\\t\\t\\t\\t\\tresolve();\\n\\t\\t\\t\\t\\t} else {\\n\\t\\t\\t\\t\\t\\tsetTimeout(tryLock, 10); // retry after 10ms\\n\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t};\\n\\t\\t\\t\\tsetTimeout(tryLock, 10);\\n\\t\\t\\t});\\n\\t\\t}\\n\\t\\n\\t\\tasync function releaseLock() {\\n\\t\\t\\tlock = false;\\n\\t\\t}\\n\\t\\n\\t\\t// Function to send request and receive response\\n\\t\\tasync function ipcRequest(action, payload = {}) {\\n\\t\\t\\tawait acquireLock();\\n\\t\\t\\treturn new Promise((resolve, reject) => {\\n\\t\\t\\t\\tmodules.ipc.listenFor(outputPipeId).then((response) => {\\n\\t\\t\\t\\t\\treleaseLock();\\n\\t\\t\\t\\t\\tif (response.error) return reject(new Error(response.error));\\n\\t\\t\\t\\t\\treturn resolve(response.data);\\n\\t\\t\\t\\t});\\n\\t\\t\\t\\tmodules.ipc.send(inputPipeId, { action, ...payload });\\n\\t\\t\\t});\\n\\t\\t}\\n\\t\\n\\t\\t// Initial request to get filesystem properties\\n\\t\\tconst filesystemData = await ipcRequest(\\\"properties\\\", { data: options });\\n\\t\\n\\t\\treturn {\\n\\t\\t\\tread: async function(key) {\\n\\t\\t\\t\\treturn ipcRequest(\\\"read\\\", { key: String(key) });\\n\\t\\t\\t},\\n\\t\\t\\twrite: async function(key, value) {\\n\\t\\t\\t\\treturn ipcRequest(\\\"write\\\", { key: String(key), value: String(value) });\\n\\t\\t\\t},\\n\\t\\t\\trm: async function(key) {\\n\\t\\t\\t\\treturn ipcRequest(\\\"rm\\\", { key: String(key) });\\n\\t\\t\\t},\\n\\t\\t\\tls: async function(directory) {\\n\\t\\t\\t\\treturn ipcRequest(\\\"ls\\\", { directory: String(directory) });\\n\\t\\t\\t},\\n\\t\\t\\tmkdir: async function(directory) {\\n\\t\\t\\t\\treturn ipcRequest(\\\"mkdir\\\", { directory: String(directory) });\\n\\t\\t\\t},\\n\\t\\t\\tpermissions: async function(file) {\\n\\t\\t\\t\\treturn ipcRequest(\\\"permissions\\\", { file: String(file) });\\n\\t\\t\\t},\\n\\t\\t\\tchown: async function(file, owner) {\\n\\t\\t\\t\\treturn ipcRequest(\\\"chown\\\", { file: String(file), owner: String(owner) });\\n\\t\\t\\t},\\n\\t\\t\\tchgrp: async function(file, group) {\\n\\t\\t\\t\\treturn ipcRequest(\\\"chgrp\\\", { file: String(file), group: String(group) });\\n\\t\\t\\t},\\n\\t\\t\\tchmod: async function(file, permissions) {\\n\\t\\t\\t\\treturn ipcRequest(\\\"chmod\\\", { file: String(file), permissions: String(permissions) });\\n\\t\\t\\t},\\n\\t\\t\\tisDirectory: async function(key) {\\n\\t\\t\\t\\treturn ipcRequest(\\\"isDirectory\\\", { key: String(key) });\\n\\t\\t\\t},\\n\\t\\t\\tsync: async function() {\\n\\t\\t\\t\\treturn ipcRequest(\\\"sync\\\");\\n\\t\\t\\t},\\n\\t\\t\\tunmount: async function() {\\n\\t\\t\\t\\treturn ipcRequest(\\\"unmount\\\");\\n\\t\\t\\t},\\n\\t\\t\\t...filesystemData\\n\\t\\t};\\n\\t} // ChatGPT code ends here\\n\\n\\tasync function fileMount(options) {\\n\\t\\tlet file = JSON.parse(await modules.fs.read(options.srcFile));\\n\\t\\tlet backend = file.backend;\\n\\t\\tdelete file.backend;\\n\\t\\tlet files = file.files;\\n\\t\\tdelete file.files;\\n\\t\\treturn {\\n\\t\\t\\tread: async function(key) {\\n\\t\\t\\t\\tkey = String(key);\\n\\t\\t\\t\\tlet pathParts = key.split(\\\"/\\\");\\n\\t\\t\\t\\tif (pathParts[0] == \\\"\\\") pathParts = pathParts.slice(1);\\n\\t\\t\\t\\tlet files = this.backend.files;\\n\\t\\t\\t\\tfor (let part of pathParts) {\\n\\t\\t\\t\\t\\tfiles = files[part];\\n\\t\\t\\t\\t\\tif (!files) throw new Error(\\\"NO_SUCH_FILE\\\");\\n\\t\\t\\t\\t}\\t\\n\\t\\t\\t\\tif (typeof files === \\\"object\\\") throw new Error(\\\"IS_A_DIR\\\");\\n\\t\\t\\t\\treturn String(this.files[files]);\\n\\t\\t\\t},\\n\\t\\t\\twrite: async function(key, value) {\\n\\t\\t\\t\\tkey = String(key);\\n\\t\\t\\t\\tvalue = String(value);\\n\\t\\t\\t\\tlet existenceChecks = key.split(\\\"/\\\").slice(0, -1);\\n\\t\\t\\t\\tif (existenceChecks[0] == \\\"\\\") existenceChecks = existenceChecks.slice(1);\\n\\t\\t\\t\\tif (existenceChecks[existenceChecks.length - 1] == \\\"\\\") existenceChecks = existenceChecks.slice(0, -1);\\n\\t\\t\\t\\tlet basename = key.split(\\\"/\\\").slice(-1)[0];\\n\\t\\t\\t\\tlet files = this.backend.files;\\n\\t\\t\\t\\tfor (let part of existenceChecks) {\\n\\t\\t\\t\\t\\tfiles = files[part];\\n\\t\\t\\t\\t\\tif (!files) throw new Error(\\\"NO_SUCH_DIR\\\");\\n\\t\\t\\t\\t}\\n\\t\\t\\t\\tif (typeof files[basename] === \\\"object\\\") throw new Error(\\\"IS_A_DIR\\\");\\n\\t\\t\\t\\tlet id = files[basename] || crypto.getRandomValues(new Uint8Array(64)).reduce((a, b) => a + b.toString(16).padStart(2, \\\"0\\\"), \\\"\\\");\\n\\t\\t\\t\\tthis.files[id] = value;\\n\\t\\t\\t\\tif (!files.hasOwnProperty(basename)) this.backend = this._recursive_op(this.backend, \\\"files/\\\" + key, { type: \\\"write\\\", value: id });\\n\\t\\t\\t},\\n\\t\\t\\trm: async function(key) {\\n\\t\\t\\t\\tkey = String(key);\\n\\t\\t\\t\\tlet pathParts = key.split(\\\"/\\\");\\n\\t\\t\\t\\tif (pathParts[0] == \\\"\\\") pathParts = pathParts.slice(1);\\n\\t\\t\\t\\tif (pathParts[pathParts.length - 1] == \\\"\\\") pathParts = pathParts.slice(0, -1);\\n\\t\\t\\t\\tlet files = this.backend.files;\\n\\t\\t\\t\\tfor (let part of pathParts) {\\n\\t\\t\\t\\t\\tfiles = files[part];\\n\\t\\t\\t\\t\\tif (!files) throw new Error(\\\"NO_SUCH_FILE_DIR\\\");\\n\\t\\t\\t\\t}\\n\\t\\t\\t\\tif (typeof files === \\\"object\\\" && Object.keys(files).length > 0) throw new Error(\\\"NON_EMPTY_DIR\\\");\\n\\t\\t\\t\\tif (typeof files === \\\"string\\\") delete this.files[files];\\n\\t\\t\\t\\tthis.backend = this._recursive_op(this.backend, \\\"files/\\\" + key, { type: \\\"delete\\\" });\\n\\t\\t\\t\\tlet backend = this.backend;\\n\\t\\t\\t\\tdelete backend.permissions[key];\\n\\t\\t\\t\\tthis.backend = backend;\\n\\t\\t\\t},\\n\\t\\t\\tls: async function(directory) {\\n\\t\\t\\t\\tdirectory = String(directory);\\n\\t\\t\\t\\tlet pathParts = directory.split(\\\"/\\\");\\n\\t\\t\\t\\tif (pathParts[0] == \\\"\\\") pathParts = pathParts.slice(1);\\n\\t\\t\\t\\tif (pathParts[pathParts.length - 1] == \\\"\\\") pathParts = pathParts.slice(0, -1);\\n\\t\\t\\t\\tlet files = this.backend.files;\\n\\t\\t\\t\\tfor (let part of pathParts) {\\n\\t\\t\\t\\t\\tfiles = files[part];\\n\\t\\t\\t\\t\\tif (!files) throw new Error(\\\"NO_SUCH_DIR\\\");\\n\\t\\t\\t\\t}\\n\\t\\t\\t\\tif (typeof files !== \\\"object\\\") throw new Error(\\\"IS_A_FILE\\\");\\n\\t\\t\\t\\treturn Object.keys(files);\\n\\t\\t\\t},\\n\\t\\t\\tmkdir: async function(directory) {\\n\\t\\t\\t\\tdirectory = String(directory);\\n\\t\\t\\t\\tlet existenceChecks = directory.split(\\\"/\\\").slice(0, -1);\\n\\t\\t\\t\\tif (existenceChecks[0] == \\\"\\\") existenceChecks = existenceChecks.slice(1);\\n\\t\\t\\t\\tif (existenceChecks[existenceChecks.length - 1] == \\\"\\\") existenceChecks = existenceChecks.slice(0, -1);\\n\\t\\t\\t\\tlet files = this.backend.files;\\n\\t\\t\\t\\tfor (let part of existenceChecks) {\\n\\t\\t\\t\\t\\tfiles = files[part];\\n\\t\\t\\t\\t\\tif (!files) throw new Error(\\\"NO_SUCH_DIR\\\");\\n\\t\\t\\t\\t}\\n\\t\\t\\t\\tif (Object.keys(files).includes(directory.split(\\\"/\\\").slice(-1)[0])) throw new Error(\\\"DIR_EXISTS\\\");\\n\\t\\t\\t\\tthis.backend = this._recursive_op(this.backend, \\\"files/\\\" + directory, { type: \\\"write\\\", value: {} });\\n\\t\\t\\t},\\n\\t\\t\\tpermissions: async function(file) {\\n\\t\\t\\t\\tfile = String(file);\\n\\t\\t\\t\\tlet properFile = file.split(\\\"/\\\")\\n\\t\\t\\t\\tif (properFile[0] == \\\"\\\") properFile = properFile.slice(1);\\n\\t\\t\\t\\tif (properFile[properFile.length - 1] == \\\"\\\") properFile = properFile.slice(0, -1);\\n\\t\\t\\t\\tproperFile = properFile.join(\\\"/\\\");\\n\\t\\t\\t\\tlet randomNames = crypto.getRandomValues(new Uint8Array(8)).reduce((a, b) => a + b.toString(16).padStart(2, \\\"0\\\"), \\\"\\\");\\n\\t\\t\\t\\tlet permissions = this.backend.permissions[properFile] || {};\\n\\t\\t\\t\\treturn {\\n\\t\\t\\t\\t\\towner: permissions.owner || randomNames,\\n\\t\\t\\t\\t\\tgroup: permissions.group || randomNames,\\n\\t\\t\\t\\t\\tworld: permissions.world || \\\"\\\",\\n\\t\\t\\t\\t\\trandom: !(permissions.owner || permissions.group || permissions.world) ? true : undefined\\n\\t\\t\\t\\t};\\n\\t\\t\\t},\\n\\t\\t\\tchown: async function(file, owner) {\\n\\t\\t\\t\\tfile = String(file);\\n\\t\\t\\t\\towner = String(owner);\\n\\t\\t\\t\\tlet properFile = file.split(\\\"/\\\")\\n\\t\\t\\t\\tif (properFile[0] == \\\"\\\") properFile = properFile.slice(1);\\n\\t\\t\\t\\tif (properFile[properFile.length - 1] == \\\"\\\") properFile = properFile.slice(0, -1);\\n\\t\\t\\t\\tproperFile = properFile.join(\\\"/\\\");\\n\\t\\t\\t\\tlet backend = this.backend;\\n\\t\\t\\t\\tlet randomNames = crypto.getRandomValues(new Uint8Array(8)).reduce((a, b) => a + b.toString(16).padStart(2, \\\"0\\\"), \\\"\\\");\\n\\t\\t\\t\\tlet filePermissions = backend.permissions[properFile] || {\\n\\t\\t\\t\\t\\towner: randomNames,\\n\\t\\t\\t\\t\\tgroup: randomNames,\\n\\t\\t\\t\\t\\tworld: \\\"\\\",\\n\\t\\t\\t\\t};\\n\\t\\t\\t\\tfilePermissions.owner = owner;\\n\\t\\t\\t\\tbackend.permissions[properFile] = filePermissions;\\n\\t\\t\\t\\tthis.backend = backend;\\n\\t\\t\\t},\\n\\t\\t\\tchgrp: async function(file, group) {\\n\\t\\t\\t\\tfile = String(file);\\n\\t\\t\\t\\tgroup = String(group);\\n\\t\\t\\t\\tlet properFile = file.split(\\\"/\\\")\\n\\t\\t\\t\\tif (properFile[0] == \\\"\\\") properFile = properFile.slice(1);\\n\\t\\t\\t\\tif (properFile[properFile.length - 1] == \\\"\\\") properFile = properFile.slice(0, -1);\\n\\t\\t\\t\\tproperFile = properFile.join(\\\"/\\\");\\n\\t\\t\\t\\tlet backend = this.backend;\\n\\t\\t\\t\\tlet randomNames = crypto.getRandomValues(new Uint8Array(8)).reduce((a, b) => a + b.toString(16).padStart(2, \\\"0\\\"), \\\"\\\");\\n\\t\\t\\t\\tlet filePermissions = backend.permissions[properFile] || {\\n\\t\\t\\t\\t\\towner: randomNames,\\n\\t\\t\\t\\t\\tgroup: randomNames,\\n\\t\\t\\t\\t\\tworld: \\\"\\\",\\n\\t\\t\\t\\t};\\n\\t\\t\\t\\tfilePermissions.group = group;\\n\\t\\t\\t\\tbackend.permissions[properFile] = filePermissions;\\n\\t\\t\\t\\tthis.backend = backend;\\n\\t\\t\\t},\\n\\t\\t\\tchmod: async function(file, permissions) {\\n\\t\\t\\t\\tfile = String(file);\\n\\t\\t\\t\\tpermissions = String(permissions);\\n\\t\\t\\t\\tlet properFile = file.split(\\\"/\\\")\\n\\t\\t\\t\\tif (properFile[0] == \\\"\\\") properFile = properFile.slice(1);\\n\\t\\t\\t\\tif (properFile[properFile.length - 1] == \\\"\\\") properFile = properFile.slice(0, -1);\\n\\t\\t\\t\\tproperFile = properFile.join(\\\"/\\\");\\n\\t\\t\\t\\tlet backend = this.backend;\\n\\t\\t\\t\\tlet randomNames = crypto.getRandomValues(new Uint8Array(8)).reduce((a, b) => a + b.toString(16).padStart(2, \\\"0\\\"), \\\"\\\");\\n\\t\\t\\t\\tlet filePermissions = backend.permissions[properFile] || {\\n\\t\\t\\t\\t\\towner: randomNames,\\n\\t\\t\\t\\t\\tgroup: randomNames,\\n\\t\\t\\t\\t\\tworld: \\\"\\\",\\n\\t\\t\\t\\t};\\n\\t\\t\\t\\tfilePermissions.world = permissions;\\n\\t\\t\\t\\tbackend.permissions[properFile] = filePermissions;\\n\\t\\t\\t\\tthis.backend = backend;\\n\\t\\t\\t},\\n\\t\\t\\tisDirectory: function(key) {\\n\\t\\t\\t\\tkey = String(key);\\n\\t\\t\\t\\tlet pathParts = key.split(\\\"/\\\").slice(0, -1);\\n\\t\\t\\t\\tif (pathParts[0] == \\\"\\\") pathParts = pathParts.slice(1);\\n\\t\\t\\t\\tif (pathParts[pathParts.length - 1] == \\\"\\\") pathParts = pathParts.slice(0, -1);\\n\\t\\t\\t\\tlet basename = key.split(\\\"/\\\").slice(-1)[0];\\n\\t\\t\\t\\tlet files = this.backend.files;\\n\\t\\t\\t\\tfor (let part of pathParts) {\\n\\t\\t\\t\\t\\tfiles = files[part];\\n\\t\\t\\t\\t\\tif (!files) throw new Error(\\\"NO_SUCH_DIR\\\");\\n\\t\\t\\t\\t}\\n\\t\\t\\t\\tif (!files.hasOwnProperty(basename)) throw new Error(\\\"NO_SUCH_FILE_DIR\\\");\\n\\t\\t\\t\\tif (typeof files[basename] === \\\"object\\\") return true;\\n\\t\\t\\t\\treturn false;\\n\\t\\t\\t},\\n\\t\\t\\t_recursive_op: function(obj, path, action, stage = 0) {\\n\\t\\t\\t\\tif (path.split(\\\"/\\\").length == (stage + 1)) {\\n\\t\\t\\t\\t\\tif (action.type == \\\"delete\\\") delete obj[path.split(\\\"/\\\").slice(-1)[0]];\\n\\t\\t\\t\\t\\tif (action.type == \\\"write\\\") obj[path.split(\\\"/\\\").slice(-1)[0]] = action.value;\\n\\t\\t\\t\\t} else obj[path.split(\\\"/\\\")[stage]] = this._recursive_op(obj[path.split(\\\"/\\\")[stage]], path, action, stage + 1);\\n\\t\\t\\t\\treturn obj;\\n\\t\\t\\t},\\n\\t\\t\\tsync: async function() {\\n\\t\\t\\t\\treturn await modules.fs.write(options.srcFile, JSON.stringify({ ...file, backend: this.backend, files: this.files }));\\n\\t\\t\\t},\\n\\t\\t\\tunmount: () => true,\\n\\t\\t\\tdirectory_supported: true,\\n\\t\\t\\tread_only: !!options.read_only,\\n\\t\\t\\tfilesystem: \\\"filefs\\\",\\n\\t\\t\\tpermissions_supported: true,\\n\\t\\t\\tbackend: backend,\\n\\t\\t\\tfiles: files\\n\\t\\t};\\n\\t}\\n\\n\\tasync function overlayMount(options) {\\n\\t\\treturn {\\n\\t\\t\\tread: function(key, token) {\\n\\t\\t\\t\\treturn this._basic_first_op(\\\"read\\\", key, token);\\n\\t\\t\\t},\\n\\t\\t\\twrite: function(key, value, token) {\\n\\t\\t\\t\\treturn this._basic_first_op(\\\"write\\\", key, value, token);\\n\\t\\t\\t},\\n\\t\\t\\trm: function(key, token) {\\n\\t\\t\\t\\treturn this._basic_first_op(\\\"rm\\\", key, token);\\n\\t\\t\\t},\\n\\t\\t\\tls: async function(directory, token) {\\n\\t\\t\\t\\tlet listing = [], commonErrorMessages = {}, errors = 0;\\n\\t\\t\\t\\tfor (let mount of options.mounts) {\\n\\t\\t\\t\\t\\ttry {\\n\\t\\t\\t\\t\\t\\tlisting.push(...(await modules.fs.ls(mount + \\\"/\\\" + directory, token)));\\n\\t\\t\\t\\t\\t} catch (e) {\\n\\t\\t\\t\\t\\t\\terrors++;\\n\\t\\t\\t\\t\\t\\tcommonErrorMessages[e.message] = (commonErrorMessages[e.message] || 0) + 1;\\n\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t}\\n\\t\\t\\t\\tif (errors == options.mounts.length) throw new Error(Object.entries(commonErrorMessages).sort((a, b) => b[1] - a[1])[0][0]);\\n\\t\\t\\t\\treturn Array.from(new Set(listing));\\n\\t\\t\\t},\\n\\t\\t\\tmkdir: function(directory, token) {\\n\\t\\t\\t\\treturn this._basic_first_op(\\\"mkdir\\\", directory, token);\\n\\t\\t\\t},\\n\\t\\t\\tpermissions: async function(file, token) {\\n\\t\\t\\t\\tlet commonErrorMessages = {}, checkedHowMany = 0;\\n\\t\\t\\t\\tfor (let mount of options.mounts) {\\n\\t\\t\\t\\t\\ttry {\\n\\t\\t\\t\\t\\t\\tcheckedHowMany++;\\n\\t\\t\\t\\t\\t\\tlet permissions = await modules.fs.permissions(mount + \\\"/\\\" + file, token);\\n\\t\\t\\t\\t\\t\\tif (permissions.random && checkedHowMany != options.mounts.length)\\n\\t\\t\\t\\t\\t\\t\\tthrow new Error(\\\"PERMISSION_DENIED\\\");\\n\\t\\t\\t\\t\\t\\treturn permissions;\\n\\t\\t\\t\\t\\t} catch (e) {\\n\\t\\t\\t\\t\\t\\tcommonErrorMessages[e.message] = (commonErrorMessages[e.message] || 0) + 1;\\n\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t}\\n\\t\\t\\t\\tthrow new Error(Object.entries(commonErrorMessages).sort((a, b) => b[1] - a[1])[0][0]);\\n\\t\\t\\t},\\n\\t\\t\\tchown: function(file, owner, token) {\\n\\t\\t\\t\\treturn this._basic_first_op(\\\"chown\\\", file, owner, token);\\n\\t\\t\\t},\\n\\t\\t\\tchgrp: function(file, group, token) {\\n\\t\\t\\t\\treturn this._basic_first_op(\\\"chgrp\\\", file, group, token);\\n\\t\\t\\t},\\n\\t\\t\\tchmod: function(file, permissions, token) {\\n\\t\\t\\t\\treturn this._basic_first_op(\\\"chmod\\\", file, permissions, token);\\n\\t\\t\\t},\\n\\t\\t\\tisDirectory: function(key, token) {\\n\\t\\t\\t\\treturn this._basic_first_op(\\\"isDirectory\\\", key, token);\\n\\t\\t\\t},\\n\\t\\t\\tsync: function(token) {\\n\\t\\t\\t\\treturn this._every_op(\\\"sync\\\", token);\\n\\t\\t\\t},\\n\\t\\t\\tunmount: function(token) {\\n\\t\\t\\t\\tif (options.autoManage) return this._every_op(\\\"unmount\\\", token);\\n\\t\\t\\t},\\n\\t\\t\\t_basic_first_op: async function(op, key, ...args) {\\n\\t\\t\\t\\tlet pathParts = key.split(\\\"/\\\");\\n\\t\\t\\t\\tif (pathParts[0] == \\\"\\\") pathParts = pathParts.slice(1);\\n\\t\\t\\t\\tif (pathParts[pathParts.length - 1] == \\\"\\\") pathParts = pathParts.slice(0, -1);\\n\\t\\t\\t\\tkey = pathParts.join(\\\"/\\\");\\n\\t\\t\\t\\tlet previousKey = key.split(\\\"/\\\").slice(0, -1).join(\\\"/\\\");\\n\\t\\t\\t\\tlet basename = key.split(\\\"/\\\").slice(-1).join(\\\"/\\\");\\n\\t\\t\\t\\tlet lookedForMount;\\n\\t\\t\\t\\tfor (let mount of options.mounts) {\\n\\t\\t\\t\\t\\ttry {\\n\\t\\t\\t\\t\\t\\tlet listing = await modules.fs.ls(mount + \\\"/\\\" + previousKey, args[args.length - 1]);\\n\\t\\t\\t\\t\\t\\tif (listing.includes(basename)) {\\n\\t\\t\\t\\t\\t\\t\\tlookedForMount = mount;\\n\\t\\t\\t\\t\\t\\t\\tbreak;\\n\\t\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t\\t} catch {}\\n\\t\\t\\t\\t}\\n\\t\\t\\t\\tif (lookedForMount) return modules.fs[op](lookedForMount + \\\"/\\\" + key, ...args);\\n\\t\\t\\t\\tlet commonErrorMessages = {};\\n\\t\\t\\t\\tfor (let mount of options.mounts) {\\n\\t\\t\\t\\t\\ttry {\\n\\t\\t\\t\\t\\t\\treturn await modules.fs[op](mount + \\\"/\\\" + key, ...args);\\n\\t\\t\\t\\t\\t} catch (e) {\\n\\t\\t\\t\\t\\t\\tcommonErrorMessages[e.message] = (commonErrorMessages[e.message] || 0) + 1;\\n\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t}\\n\\t\\t\\t\\tthrow new Error(Object.entries(commonErrorMessages).sort((a, b) => b[1] - a[1])[0][0]);\\n\\t\\t\\t},\\n\\t\\t\\t_every_op: async function(op) {\\n\\t\\t\\t\\tlet commonErrorMessages = {}, gotError;\\n\\t\\t\\t\\tfor (let mount of options.mounts) {\\n\\t\\t\\t\\t\\ttry {\\n\\t\\t\\t\\t\\t\\tawait modules.fs[op](mount);\\n\\t\\t\\t\\t\\t} catch (e) {\\n\\t\\t\\t\\t\\t\\tgotError = true;\\n\\t\\t\\t\\t\\t\\tcommonErrorMessages[e.message] = (commonErrorMessages[e.message] || 0) + 1;\\n\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t}\\n\\t\\t\\t\\tif (gotError) throw new Error(Object.entries(commonErrorMessages).sort((a, b) => b[1] - a[1])[0][0]);\\n\\t\\t\\t},\\n\\t\\t\\tdirectory_supported: true,\\n\\t\\t\\tread_only: !!options.read_only,\\n\\t\\t\\tfilesystem: \\\"overlayfs\\\",\\n\\t\\t\\tpermissions_supported: true\\n\\t\\t};\\n\\t}\\n\\t\\n\\tfs.mounts[\\\"ram\\\"] = ramMount({\\n\\t\\ttype: \\\"run\\\"\\n\\t});\\n\\tmodules.mounts = {\\n\\t\\tPCFSiDBMount,\\n\\t\\tPCFSiDBAESCryptMount,\\n\\t\\tramMount,\\n\\t\\tpreferenceMount,\\n\\t\\tSFSPMount,\\n\\t\\tIPCMount,\\n\\t\\tfileMount,\\n\\t\\toverlayMount\\n\\t};\\n\\tmodules.fs = fs;\\n\\tmodules.defaultSystem = \\\"ram\\\";\\n}\\n\\nloadFs();\",\"efa7ef28754863347fd4d8cc5ac23807acba7f7f7a69ae0aeb248d4d84de5db215e5b89c7335048ea6d3db71ae4d8a6323c7c79411518dbab07735dbf8564789\":\"async function fsck() {\\n\\t// @pcos-app-mode native\\n\\tfunction println(str) {\\n\\t\\tmodules.core.tty_bios_api.println(str);\\n\\t\\treturn new Promise(function(resolve) {\\n\\t\\t\\trequestAnimationFrame(resolve);\\n\\t\\t})\\n\\t}\\n\\tlet fsckMode;\\n\\ttry {\\n\\t\\tfsckMode = await modules.fs.read(modules.defaultSystem + \\\"/.fsck\\\");\\n\\t\\tawait modules.fs.rm(modules.defaultSystem + \\\"/.fsck\\\");\\n\\t} catch {\\n\\t\\tawait println(\\\"Skipping file system checking.\\\");\\n\\t\\treturn;\\n\\t}\\n\\tasync function scanLLDA() {\\n\\t\\tlet fs = modules.fs;\\n\\t\\tif (fs.mounts[modules.defaultSystem].read_only) {\\n\\t\\t\\tawait println(\\\"File system is read-only.\\\");\\n\\t\\t\\treturn { lldaPoints: \\\"abort\\\", lldaId: \\\"abort\\\" };\\n\\t\\t}\\n\\t\\tif (fs.mounts[modules.defaultSystem].partition.getData) {\\n\\t\\t\\tlet llda = fs.mounts[modules.defaultSystem].partition.getData().files;\\n\\t\\t\\tlet lldaId = fs.mounts[modules.defaultSystem].partition.getData().id;\\n\\t\\t\\tllda = Object.values(llda);\\n\\t\\t\\twhile (llda.some(a => typeof a === \\\"object\\\")) llda = llda.map(a => typeof a === \\\"object\\\" ? Object.values(a) : a).flat(); \\n\\t\\t\\treturn { lldaPoints: llda, lldaId: lldaId };\\n\\t\\t} else {\\n\\t\\t\\tawait println(\\\"Low-level disk access is impossible.\\\");\\n\\t\\t\\treturn { lldaPoints: \\\"abort\\\", lldaId: \\\"abort\\\" };\\n\\t\\t}\\n\\t}\\n\\tawait println(\\\"A file system check has been requested.\\\");\\n\\tawait println(\\\"Scanning for file points.\\\");\\n\\tlet { lldaPoints, lldaId } = await scanLLDA();\\n\\tif (lldaPoints === \\\"abort\\\") {\\n\\t\\tawait println(\\\"Skipping file system checking.\\\");\\n\\t\\treturn;\\n\\t}\\n\\tawait println(\\\"File points found: \\\" + lldaPoints.length);\\n\\tawait println(\\\"Reading indexedDB keys.\\\");\\n\\tlet idb_keys = modules.core.idb._db.transaction(\\\"disk\\\").objectStore(\\\"disk\\\").getAllKeys();\\n\\tidb_keys = await new Promise(function(resolve) {\\n\\t\\tidb_keys.onsuccess = () => resolve(idb_keys.result);\\n\\t});\\n\\tidb_keys.splice(idb_keys.indexOf(\\\"disk\\\"), 1);\\n\\tawait println(\\\"IndexedDB keys found: \\\" + idb_keys.length);\\n\\tawait println(\\\"Filtering IndexedDB keys...\\\");\\n\\tif (fsckMode != \\\"discard-all\\\") idb_keys = idb_keys.filter(a => a.startsWith(lldaId + \\\"-\\\")).map(a => a.slice(lldaId.length + 1));\\n\\tawait println(\\\"Filtered keys: \\\" + idb_keys.length);\\n\\tlet missingFiles = idb_keys.filter(a => !lldaPoints.includes(a.slice(fsckMode == \\\"discard-all\\\" ? (lldaId + \\\"-\\\").length : 0)));\\n\\tawait println(\\\"Missing files: \\\" + missingFiles.length);\\n\\tlet llda = modules.fs.mounts[modules.defaultSystem].partition.getData();\\n\\tif (fsckMode == \\\"recover\\\") {\\n\\t\\ttry {\\n\\t\\t\\tawait modules.fs.mkdir(modules.defaultSystem + \\\"/lost+found\\\");\\n\\t\\t\\tawait println(\\\"Created lost+found directory.\\\");\\n\\t\\t} catch {\\n\\t\\t\\tawait println(\\\"Lost+found directory already exists.\\\");\\n\\t\\t}\\n\\t\\tfor (let file of missingFiles) {\\n\\t\\t\\tawait println(\\\"Moving \\\" + file + \\\" to lost+found.\\\");\\n\\t\\t\\tllda.files[\\\"lost+found\\\"][file] = file;\\n\\t\\t}\\n\\t} else if (fsckMode == \\\"discard\\\" || fsckMode == \\\"discard-all\\\") {\\n\\t\\tfor (let file of missingFiles) {\\n\\t\\t\\tawait println(\\\"Deleting \\\" + file + \\\".\\\");\\n\\t\\t\\tawait modules.core.idb.removePart((fsckMode == \\\"discard\\\" ? (lldaId + \\\"-\\\") : \\\"\\\") + file);\\n\\t\\t}\\n\\t} else {\\n\\t\\tawait println(\\\"Unsure what to do, not doing anything.\\\");\\n\\t}\\n\\tawait println(\\\"Saving modified file table.\\\");\\n\\tmodules.fs.mounts[modules.defaultSystem].partition.setData(llda);\\n\\tawait modules.core.idb.sync();\\n\\tawait println(\\\"File system check complete.\\\");\\n}\\nawait fsck();\",\"f201b22dce3517e915c606a6c7064682efec31673ab4a22f46717582f58d33fb69a4294340fbca50b8616cfd24c9bbfb0f3a28b5f2a1a0634ec572c22be1c6e0\":\"async function loadModules() {\\n\\tlet hexToU8A = (hex) => Uint8Array.from(hex.match(/.{1,2}/g).map(a => parseInt(a, 16)));\\n\\tlet u8aToHex = (u8a) => Array.from(u8a).map(a => a.toString(16).padStart(2, \\\"0\\\")).join(\\\"\\\");\\n\\tlet khrlSignatures = [];\\n\\tasync function loadKHRL() {\\n\\t\\tlet khrlFiles = await modules.fs.ls(\\\".00-keys.fs/etc/keys/khrl\\\");\\n\\t\\tfor (let khrlFile of khrlFiles) {\\n\\t\\t\\tlet khrl = JSON.parse(await modules.fs.read(\\\".00-keys.fs/etc/keys/khrl/\\\" + khrlFile));\\n\\t\\t\\tlet khrlSignature = khrl.signature;\\n\\t\\t\\tdelete khrl.signature;\\n\\t\\t\\tif (await crypto.subtle.verify({\\n\\t\\t\\t\\tname: \\\"ECDSA\\\",\\n\\t\\t\\t\\thash: {\\n\\t\\t\\t\\t\\tname: \\\"SHA-256\\\"\\n\\t\\t\\t\\t}\\n\\t\\t\\t}, modules.ksk_imported, hexToU8A(khrlSignature), new TextEncoder().encode(JSON.stringify(khrl.list)))) {\\n\\t\\t\\t\\tkhrlSignatures.push(...khrl.list);\\n\\t\\t\\t}\\n\\t\\t}\\n\\t}\\n\\tasync function recursiveKeyVerify(key, khrl) {\\n\\t\\tif (!key) throw new Error(\\\"NO_KEY\\\");\\n\\t\\tlet hash = u8aToHex(new Uint8Array(await crypto.subtle.digest(\\\"SHA-256\\\", new TextEncoder().encode((key.keyInfo?.key || key.key).x + \\\"|\\\" + (key.keyInfo?.key || key.key).y))));\\n\\t\\tif (khrl.includes(hash)) throw new Error(\\\"KEY_REVOKED\\\");\\n\\t\\tlet signedByKey = modules.ksk_imported;\\n\\t\\tif (key.keyInfo && key.keyInfo?.signedBy) {\\n\\t\\t\\tsignedByKey = JSON.parse(await modules.fs.read(\\\".00-keys.fs/etc/keys/\\\" + key.keyInfo.signedBy));\\n\\t\\t\\tif (!signedByKey.keyInfo) throw new Error(\\\"NOT_KEYS_V2\\\");\\n\\t\\t\\tif (!signedByKey.keyInfo.usages.includes(\\\"keyTrust\\\")) throw new Error(\\\"NOT_KEY_AUTHORITY\\\");\\n\\t\\t\\tawait recursiveKeyVerify(signedByKey, khrl);\\n\\t\\t\\tsignedByKey = await crypto.subtle.importKey(\\\"jwk\\\", signedByKey.keyInfo.key, {\\n\\t\\t\\t\\tname: \\\"ECDSA\\\",\\n\\t\\t\\t\\tnamedCurve: \\\"P-256\\\"\\n\\t\\t\\t}, false, [\\\"verify\\\"]);\\n\\t\\t}\\n\\t\\tif (!await crypto.subtle.verify({\\n\\t\\t\\tname: \\\"ECDSA\\\",\\n\\t\\t\\thash: {\\n\\t\\t\\t\\tname: \\\"SHA-256\\\"\\n\\t\\t\\t}\\n\\t\\t}, signedByKey, hexToU8A(key.signature), new TextEncoder().encode(JSON.stringify(key.key || key.keyInfo)))) throw new Error(\\\"KEY_SIGNATURE_VERIFICATION_FAILED\\\");\\n\\t\\treturn true;\\n\\t}\\n\\ttry {\\n\\t\\tlet moduleList = (await modules.fs.ls(modules.defaultSystem + \\\"/modules\\\")).sort((a, b) => a.localeCompare(b));\\n\\t\\tfor (let moduleName of moduleList) {\\n\\t\\t\\tlet fullModuleFile = JSON.parse(await modules.fs.read(modules.defaultSystem + \\\"/modules/\\\" + moduleName));\\n\\t\\t\\tlet fullModuleSignature = fullModuleFile.buildInfo.signature;\\n\\t\\t\\tdelete fullModuleFile.buildInfo.signature;\\n\\t\\t\\tif (moduleName == \\\"00-keys.fs\\\") {\\n\\t\\t\\t\\ttry {\\n\\t\\t\\t\\t\\tfullModuleFile = JSON.stringify(fullModuleFile);\\n\\t\\t\\t\\t\\tif (!(await crypto.subtle.verify({\\n\\t\\t\\t\\t\\t\\tname: \\\"ECDSA\\\",\\n\\t\\t\\t\\t\\t\\thash: {\\n\\t\\t\\t\\t\\t\\t\\tname: \\\"SHA-256\\\"\\n\\t\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t\\t}, modules.ksk_imported, hexToU8A(fullModuleSignature), new TextEncoder().encode(fullModuleFile)))) throw new Error(\\\"MODULE_SIGNATURE_VERIFICATION_FAILED\\\");\\n\\t\\t\\t\\t} catch (e) {\\n\\t\\t\\t\\t\\tawait panic(\\\"KEYS_MODULE_VERIFICATION_FAILED\\\", {\\n\\t\\t\\t\\t\\t\\tname: \\\"/modules/00-keys.fs\\\",\\n\\t\\t\\t\\t\\t\\tparams: [modules.defaultSystem],\\n\\t\\t\\t\\t\\t\\tunderlyingJS: e\\n\\t\\t\\t\\t\\t});\\n\\t\\t\\t\\t}\\n\\t\\t\\t} else {\\n\\t\\t\\t\\tlet critical = fullModuleFile.buildInfo.critical;\\n\\t\\t\\t\\ttry {\\n\\t\\t\\t\\t\\tlet signingKey = JSON.parse(await modules.fs.read(\\\".00-keys.fs/etc/keys/\\\" + fullModuleFile.buildInfo.signer));\\n\\t\\t\\t\\t\\tawait recursiveKeyVerify(signingKey, khrlSignatures);\\n\\t\\t\\t\\t\\tif (!signingKey.keyInfo.usages.includes(\\\"moduleTrust\\\")) throw new Error(\\\"NOT_MODULE_SIGNING_KEY\\\");\\n\\t\\t\\t\\t\\tlet importSigningKey = await crypto.subtle.importKey(\\\"jwk\\\", signingKey.keyInfo.key, {\\n\\t\\t\\t\\t\\t\\tname: \\\"ECDSA\\\",\\n\\t\\t\\t\\t\\t\\tnamedCurve: \\\"P-256\\\"\\n\\t\\t\\t\\t\\t}, false, [\\\"verify\\\"]);\\n\\t\\t\\t\\t\\tfullModuleFile = JSON.stringify(fullModuleFile);\\n\\t\\t\\t\\t\\tif (!await crypto.subtle.verify({\\n\\t\\t\\t\\t\\t\\tname: \\\"ECDSA\\\",\\n\\t\\t\\t\\t\\t\\thash: {\\n\\t\\t\\t\\t\\t\\t\\tname: \\\"SHA-256\\\"\\n\\t\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t\\t}, importSigningKey, hexToU8A(fullModuleSignature), new TextEncoder().encode(fullModuleFile))) throw new Error(\\\"MODULE_SIGNATURE_VERIFICATION_FAILED\\\");\\n\\t\\t\\t\\t} catch (e) {\\n\\t\\t\\t\\t\\tconsole.error(\\\"Failed to verify module:\\\", e);\\n\\t\\t\\t\\t\\tif (critical) await panic(\\\"CRITICAL_MODULE_VERIFICATION_FAILED\\\", {\\n\\t\\t\\t\\t\\t\\tname: \\\"/modules/\\\" + moduleName,\\n\\t\\t\\t\\t\\t\\tparams: [modules.defaultSystem],\\n\\t\\t\\t\\t\\t\\tunderlyingJS: e\\n\\t\\t\\t\\t\\t});\\n\\t\\t\\t\\t\\tcontinue;\\n\\t\\t\\t\\t}\\n\\t\\t\\t}\\n\\t\\t\\tmodules.fs.mounts[\\\".\\\" + moduleName] = await modules.mounts.fileMount({\\n\\t\\t\\t\\tsrcFile: modules.defaultSystem + \\\"/modules/\\\" + moduleName,\\n\\t\\t\\t\\tread_only: true\\n\\t\\t\\t});\\n\\t\\t\\tif (moduleName == \\\"00-keys.fs\\\") await loadKHRL();\\n\\t\\t\\tif (modules.core.bootMode == \\\"logboot\\\") modules.core.tty_bios_api.println(\\\"\\\\t../modules/\\\" + moduleName);\\n\\t\\t}\\n\\t\\tlet newSystemMount = \\\"system\\\";\\n\\t\\tif (modules.defaultSystem == \\\"system\\\") newSystemMount = \\\"system-\\\" + crypto.getRandomValues(new Uint8Array(4)).reduce((a, b) => a + b.toString(16).padStart(2, \\\"0\\\"), \\\"\\\");\\n\\t\\tmodules.fs.mounts[newSystemMount] = await modules.mounts.overlayMount({\\n\\t\\t\\tmounts: [ modules.defaultSystem, ...moduleList.map(a => \\\".\\\" + a) ]\\n\\t\\t});\\n\\t\\tmodules.defaultSystem = newSystemMount;\\n\\t} catch (e) {\\n\\t\\tconsole.error(\\\"Module system failed:\\\", e);\\n\\t}\\n}\\nawait loadModules();\",\"d29b09b391626922b8eb74bd16c67f9b2214d06ec0f9aa4b7751f85b8c40c8af1310987437e9ee5b4c246bd3cd31fcda1d6920ccd0b756939826531867e1ae59\":\"function loadUi() {\\n\\t// @pcos-app-mode native\\n\\tlet uiStyle = document.createElement(\\\"style\\\");\\n\\tuiStyle.innerHTML = `body {\\n\\t\\toverflow: hidden;\\n\\t\\tbackground: black;\\n\\t\\tcursor: none;\\n\\t\\tfont-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;\\n\\t}\\n\\n\\t.taskbar {\\n\\t\\twidth: 100%;\\n\\t\\tbackground: ${modules.core.bootMode == \\\"safe\\\" ? \\\"rgb(128, 128, 128)\\\" : \\\"rgba(128, 128, 128, 0.85)\\\"};\\n\\t\\tleft: 0;\\n\\t\\tbottom: 0;\\n\\t\\tposition: absolute;\\n\\t\\tpadding: 4px;\\n\\t\\tbox-sizing: border-box;\\n\\t\\tborder-radius: 4px;\\n\\t\\tdisplay: flex;\\n\\t}\\n\\n\\t.taskbar .clock {\\n\\t\\tmargin-right: 4px;\\n\\t}\\n\\n\\t.taskbar .icon {\\n\\t\\twidth: 27px;\\n\\t\\theight: 27px;\\n\\t\\tbackground-size: contain;\\n\\t\\tmargin: 0 4px;\\n\\t}\\n\\n\\t.filler {\\n\\t\\tflex: 1;\\n\\t}\\n\\n\\t.window {\\n\\t\\tposition: absolute;\\n\\t\\ttop: 50%;\\n\\t\\tleft: 50%;\\n\\t\\ttransform: translate(-50%, -50%);\\n\\t\\tbackground-color: ${modules.core.bootMode == \\\"safe\\\" ? \\\"rgb(240, 240, 240)\\\" : \\\"rgba(240, 240, 240, 0.5)\\\"};\\n\\t\\tborder: 1px solid #ccc;\\n\\t\\tbox-shadow: ${modules.core.bootMode == \\\"safe\\\" ? \\\"none\\\" : \\\"0 0 5px rgba(0, 0, 0, 0.3)\\\"};\\n\\t\\tz-index: 1;\\n\\t\\tresize: both;\\n\\t\\twidth: 320px;\\n\\t\\theight: 180px;\\n\\t\\tdisplay: flex;\\n\\t\\tflex-direction: column;\\n\\t\\toverflow: auto;\\n\\t\\tbackdrop-filter: ${modules.core.bootMode == \\\"safe\\\" ? \\\"none\\\" : \\\"blur(8px)\\\"};\\n\\t\\tanimation: ${modules.core.bootMode == \\\"safe\\\" ? \\\"none\\\" : \\\"fade-in 0.1s ease-in forwards\\\"};\\n\\t\\tborder-radius: 4px;\\n\\t}\\n\\n\\n\\t.window.icon {\\n\\t\\ttop: 72px;\\n\\t\\tleft: 72px;\\n\\t\\tresize: none;\\n\\t\\twidth: 128px;\\n\\t\\theight: 128px;\\n\\t}\\n\\n\\t.window.dark {\\n\\t\\tbackground-color: ${modules.core.bootMode == \\\"safe\\\" ? \\\"rgb(55, 55, 55)\\\" : \\\"rgba(55, 55, 55, 0.5)\\\"};\\n\\t\\tcolor: white;\\n\\t\\tborder: 1px solid #1b1b1b;\\n\\t}\\n\\n\\t.window .title-bar {\\n\\t\\tpadding: 6px;\\n\\t\\tbackground-color: ${modules.core.bootMode == \\\"safe\\\" ? \\\"rgb(204, 204, 204)\\\" : \\\"rgba(204, 204, 204, 0.5)\\\"};\\n\\t\\tcursor: move;\\n\\t\\tdisplay: flex;\\n\\t\\tflex: 1;\\n\\t\\tuser-select: none;\\n\\t}\\n\\n\\t.window.dark .title-bar {\\n\\t\\tbackground-color: ${modules.core.bootMode == \\\"safe\\\" ? \\\"rgb(27, 27, 27)\\\" : \\\"rgba(27, 27, 27, 0.5)\\\"};\\n\\t}\\n\\n\\t.window .button {\\n\\t\\tcursor: pointer;\\n\\t\\tpadding: 4px;\\n\\t\\tborder: none;\\n\\t\\tflex: 1;\\n\\t\\tmargin: 0 0 0 2px;\\n\\t\\tborder-radius: 4px;\\n\\t}\\n\\n\\t.window .button:hover {\\n\\t\\topacity: 75%;\\n\\t}\\n\\n\\t.window .close-button {\\n\\t\\tbackground: red;\\n\\t\\tcolor: white;\\n\\t}\\n\\n\\t.window .title-displayer {\\n\\t\\tflex: 100;\\n\\t}\\n\\n\\t.window .close-button:disabled {\\n\\t\\topacity: 25%;\\n\\t}\\n\\n\\t.window.fullscreen .resize-handle {\\n\\t\\tdisplay: none;\\n\\t}\\n\\n\\t.window.fullscreen {\\n\\t\\twidth: 100% !important;\\n\\t\\theight: 100% !important;\\n\\t\\tposition: fixed;\\n\\t\\ttop: 0 !important;\\n\\t\\tleft: 0 !important;\\n\\t\\ttransform: none;\\n\\t\\tresize: none;\\n\\t\\tborder: none;\\n\\t\\tbox-shadow: none;\\n\\t}\\n\\n\\t.window.fullscreen .title-bar {\\n\\t\\tcursor: default;\\n\\t}\\n\\n\\t.window .content {\\n\\t\\tflex: 100;\\n\\t\\toverflow: auto;\\n\\t\\tposition: relative;\\n\\t\\tbackground-color: #f0f0f0;\\n\\t}\\n\\n\\t.window.dark .content {\\n\\t\\tbackground-color: #373737;\\n\\t}\\n\\n\\t.session {\\n\\t\\tposition: fixed;\\n\\t\\ttop: 0;\\n\\t\\tleft: 0;\\n\\t\\twidth: 100%;\\n\\t\\theight: 100%;\\n\\t\\tbackground: black;\\n\\t\\tcursor: default;\\n\\t\\tanimation: ${modules.core.bootMode == \\\"safe\\\" ? \\\"none\\\" : \\\"fade-in 0.1s ease-in forwards\\\"};\\n\\t}\\n\\n\\t.session.secure {\\n\\t\\tbackground: none${modules.core.bootMode == \\\"safe\\\" ? \\\" !important\\\" : \\\"\\\"};\\n\\t\\tbackdrop-filter: ${modules.core.bootMode == \\\"safe\\\" ? \\\"none\\\" : \\\"blur(8px) brightness(50%)\\\"};\\n\\t\\tanimation: ${modules.core.bootMode == \\\"safe\\\" ? \\\"none\\\" : \\\"fade 0.1s ease-out forwards\\\"};\\n\\t}\\n\\n\\t.hidden {\\n\\t\\tdisplay: none;\\n\\t}\\n\\t\\n\\t@keyframes fade-in {\\n\\t\\t0% {\\n\\t\\t\\topacity: 0;\\n\\t\\t}\\n\\n\\t\\t100% {\\n\\t\\t\\topacity: 1;\\n\\t\\t}\\n\\t}\\n\\n\\t@keyframes fade {\\n\\t\\t0% {\\n\\t\\t\\tbackdrop-filter: blur(0px) brightness(100%);\\n\\t\\t}\\n\\n\\t\\t100% {\\n\\t\\t\\tbackdrop-filter: blur(8px) brightness(50%);\\n\\t\\t}\\n\\t}`;\\n\\tdocument.head.appendChild(uiStyle);\\n\\n\\tfunction createWindow(sessionId, makeFullscreenOnAllScreens, asIconWindow, reportMovement) {\\n\\t\\tlet fullscreen = makeFullscreenOnAllScreens || matchMedia(\\\"(max-width: 600px)\\\").matches;\\n\\t\\tif (asIconWindow) fullscreen = false;\\n\\t\\tlet id = crypto.getRandomValues(new Uint8Array(64)).reduce((a, b) => a + b.toString(16).padStart(2, \\\"0\\\"), \\\"\\\");\\n\\t\\tlet windowDiv = document.createElement('div');\\n\\t\\twindowDiv.className = 'window ' + (fullscreen ? \\\"fullscreen \\\" : \\\"\\\") + \\\" \\\" + (asIconWindow ? \\\"icon\\\" : \\\"\\\");\\n\\t\\tif (session.attrib(sessionId, \\\"dark\\\")) windowDiv.classList.add(\\\"dark\\\");\\n\\t\\twindowDiv.id = 'window-' + id;\\n\\t\\tlet titleBar = document.createElement('div');\\n\\t\\ttitleBar.className = 'title-bar';\\n\\t\\tlet title = document.createElement('span');\\n\\t\\ttitle.className = 'title-displayer';\\n\\t\\tlet closeButton = document.createElement('button');\\n\\t\\tcloseButton.className = 'button close-button';\\n\\t\\tcloseButton.innerHTML = '&#10005;';\\n\\t\\ttitleBar.appendChild(title);\\n\\t\\tif (!fullscreen && !asIconWindow) {\\n\\t\\t\\tlet fullscreenButton = document.createElement('button');\\n\\t\\t\\tfullscreenButton.className = 'button';\\n\\t\\t\\tfullscreenButton.innerHTML = '&#x25a1;';\\n\\t\\t\\tfullscreenButton.onclick = function() {\\n\\t\\t\\t\\twindowDiv.classList.toggle(\\\"fullscreen\\\");\\n\\t\\t\\t}\\n\\t\\t\\ttitleBar.appendChild(fullscreenButton);\\n\\t\\t}\\n\\t\\tif (!asIconWindow) titleBar.appendChild(closeButton);\\n\\t\\twindowDiv.appendChild(titleBar);\\n\\t\\tlet content = document.createElement('div');\\n\\t\\tcontent.className = 'content';\\n\\t\\twindowDiv.appendChild(content);\\n\\t\\tsession.tracker[sessionId].html.appendChild(windowDiv);\\n\\t\\tif (!fullscreen) makeDraggable(windowDiv, titleBar, reportMovement);\\n\\t\\treturn {\\n\\t\\t\\twindowDiv,\\n\\t\\t\\ttitle,\\n\\t\\t\\tcloseButton,\\n\\t\\t\\tcontent,\\n\\t\\t\\tsessionId\\n\\t\\t};\\n\\t}\\n\\n\\tfunction makeDraggable(windowDiv, titleBar, reportMovement) {\\n\\t\\tlet pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;\\n\\n\\t\\ttitleBar.onmousedown = dragMouseDown;\\n\\t\\ttitleBar.ontouchstart = dragMouseDown;\\n\\n\\t\\tfunction dragMouseDown(e) {\\n\\t\\t\\tif (e.type != \\\"touchstart\\\") e.preventDefault();\\n\\t\\t\\tif (e.type == \\\"touchstart\\\") e = e.touches[0];\\n\\t\\t\\tpos3 = e.clientX;\\n\\t\\t\\tpos4 = e.clientY;\\n\\n\\t\\t\\tdocument.onmouseup = closeDragElement;\\n\\t\\t\\tdocument.ontouchend = closeDragElement;\\n\\t\\t\\tdocument.ontouchcancel = closeDragElement;\\n\\t\\t\\tdocument.onmousemove = elementDrag;\\n\\t\\t\\tdocument.ontouchmove = elementDrag;\\n\\t\\t}\\n\\n\\t\\tfunction elementDrag(e) {\\n\\t\\t\\te.preventDefault();\\n\\t\\t\\tif (e.type == \\\"touchmove\\\") e = e.touches[0];\\n\\t\\t\\tpos1 = pos3 - e.clientX;\\n\\t\\t\\tpos2 = pos4 - e.clientY;\\n\\t\\t\\tpos3 = e.clientX;\\n\\t\\t\\tpos4 = e.clientY;\\n\\n\\t\\t\\tif (!windowDiv.classList.contains(\\\"fullscreen\\\")) {\\n\\t\\t\\t\\tif (reportMovement) reportMovement(windowDiv.offsetLeft - pos1, windowDiv.offsetTop - pos2);\\n\\t\\t\\t\\twindowDiv.style.top = windowDiv.offsetTop - pos2 + 'px';\\n\\t\\t\\t\\twindowDiv.style.left = windowDiv.offsetLeft - pos1 + 'px';\\n\\t\\t\\t}\\n\\t\\t}\\n\\n\\t\\tfunction closeDragElement() {\\n\\t\\t\\tdocument.onmouseup = null;\\n\\t\\t\\tdocument.ontouchend = null;\\n\\t\\t\\tdocument.ontouchcancel = null;\\n\\t\\t\\tdocument.onmousemove = null;\\n\\t\\t\\tdocument.ontouchmove = null;\\n\\t\\t}\\n\\t}\\n\\n\\tlet session = {\\n\\t\\tmksession: function() {\\n\\t\\t\\tif (modules.shuttingDown) throw new Error(\\\"SYSTEM_SHUTDOWN_REQUESTED\\\");\\n\\t\\t\\tlet identifier = crypto.getRandomValues(new Uint8Array(64)).reduce((a, b) => a + b.toString(16).padStart(2, \\\"0\\\"), \\\"\\\");\\n\\t\\t\\tlet session = document.createElement('div');\\n\\t\\t\\tsession.className = \\\"session hidden\\\";\\n\\t\\t\\tdocument.body.appendChild(session);\\n\\t\\t\\tthis.tracker[identifier] = {\\n\\t\\t\\t\\thtml: session,\\n\\t\\t\\t\\tattrib: {}\\n\\t\\t\\t};\\n\\t\\t\\treturn identifier;\\n\\t\\t},\\n\\t\\trmsession: function(session) {\\n\\t\\t\\tthis.tracker[session].html.remove();\\n\\t\\t\\tdelete this.tracker[session];\\n\\t\\t},\\n\\t\\tmuteAllSessions: function() {\\n\\t\\t\\tfor (let session in this.tracker) this.tracker[session].html.classList.add(\\\"hidden\\\");\\n\\t\\t\\tthis.active = null;\\n\\t\\t},\\n\\t\\tactivateSession: function(session) {\\n\\t\\t\\tthis.tracker[this.active]?.html?.classList?.add(\\\"hidden\\\");\\n\\t\\t\\tthis.tracker[session].html.classList.remove(\\\"hidden\\\");\\n\\t\\t\\tthis.active = session;\\n\\t\\t},\\n\\t\\tattrib: function(session, key, val) {\\n\\t\\t\\tif (val !== undefined) this.tracker[session].attrib[key] = val;\\n\\t\\t\\tif (key !== undefined) return this.tracker[session].attrib[key];\\n\\t\\t\\treturn this.tracker[session].attrib;\\n\\t\\t},\\n\\t\\tdestroy: function() {\\n\\t\\t\\tfor (let session in this.tracker) this.rmsession(session);\\n\\t\\t\\tthis.tracker = {};\\n\\t\\t\\tdelete this.systemSession;\\n\\t\\t\\tdelete modules.liu;\\n\\t\\t\\tdelete modules.serviceSession;\\n\\t\\t\\tuiStyle.remove();\\n\\t\\t\\tdelete modules.uiStyle;\\n\\t\\t},\\n\\t\\ttracker: {},\\n\\t\\tactive: null\\n\\t}\\n\\n\\tmodules.window = createWindow;\\n\\tmodules.session = session;\\n\\tmodules.uiStyle = uiStyle;\\n\\n\\tmodules.session.systemSession = session.mksession();\\n\\tsession.muteAllSessions();\\n\\tsession.activateSession(modules.session.systemSession);\\n\\tmodules.startupWindow = modules.window(modules.session.systemSession);\\n\\tmodules.startupWindowProgress = document.createElement(\\\"progress\\\");\\n\\tmodules.startupWindow.title.innerText = \\\"PCOS 3\\\";\\n\\tmodules.startupWindow.content.style.padding = \\\"8px\\\";\\n\\tmodules.startupWindow.closeButton.classList.toggle(\\\"hidden\\\", true);\\n\\tmodules.startupWindow.content.innerText = \\\"PCOS is starting...\\\";\\n\\tmodules.startupWindow.content.appendChild(document.createElement(\\\"br\\\"));\\n\\tmodules.startupWindow.content.appendChild(modules.startupWindowProgress);\\n}\\n\\nloadUi();\",\"65bf1b1aedb2cbfd6252f9136a1c8f5d2a29132e25a0d0080c94af497c302454287e81bec29014e41c3f5a3368b2812c518f7908ca15c6b4c6e876d38e558783\":\"function loadIpc() {\\n\\t// @pcos-app-mode native\\n\\tmodules.ipc = {\\n\\t\\tcreate: function() {\\n\\t\\t\\tlet id = crypto.getRandomValues(new Uint8Array(64)).reduce((a, b) => a + b.toString(16).padStart(2, \\\"0\\\"), \\\"\\\");\\n\\t\\t\\tthis._ipc[id] = { owner: \\\"root\\\", group: \\\"root\\\", world: false, _listeners: [] };\\n\\t\\t\\treturn id;\\n\\t\\t},\\n\\t\\tdeclareAccess: function(id, access) {\\n\\t\\t\\tthis._ipc[id] = { ...this._ipc[id], ...access };\\n\\t\\t},\\n\\t\\tlistenFor: function(id) {\\n\\t\\t\\tlet thatIPC = this._ipc;\\n\\t\\t\\treturn new Promise(function(resolve) {\\n\\t\\t\\t\\tlet hasResolved = false;\\n\\t\\t\\t\\treturn thatIPC[id]._listeners.push(function e(d) {\\n\\t\\t\\t\\t\\tif (hasResolved) return;\\n\\t\\t\\t\\t\\thasResolved = true;\\n\\t\\t\\t\\t\\treturn resolve(d);\\n\\t\\t\\t\\t});\\n\\t\\t\\t});\\n\\t\\t},\\n\\t\\tsend: function(id, data) {\\n\\t\\t\\ttry {\\n\\t\\t\\t\\tthis._ipc[id]._listeners.forEach(listener => listener(data));\\n\\t\\t\\t} catch {}\\n\\t\\t},\\n\\t\\tgetIPC: function(id) {\\n\\t\\t\\tlet ipc = { ...this._ipc[id] };\\n\\t\\t\\tipc._listeners = ipc._listeners.length;\\n\\t\\t\\treturn ipc;\\n\\t\\t},\\n\\t\\t_ipc: {}\\n\\t}\\n}\\nloadIpc();\",\"4542b5c51d064b7129295fc10fee580abe9c0a9197c961409650013cae32e18468577ad4b9617332f297a97bc89ac74a8f3a5c3485eb4561b2e8036b33941d86\":\"function loadWebsocketSupport() {\\n\\tlet websocketAPI = {\\n\\t\\tgetHandle: function(url) {\\n\\t\\t\\tlet handle = Array.from(crypto.getRandomValues(new Uint8Array(64))).reduce((a, b) => a + b.toString(16).padStart(2, \\\"0\\\"), \\\"\\\");\\n\\t\\t\\tlet websocket = new WebSocket(url);\\n\\t\\t\\twebsocket.binaryType = \\\"arraybuffer\\\";\\n\\t\\t\\twebsocketAPI._handles[handle] = {\\n\\t\\t\\t\\tws: websocket,\\n\\t\\t\\t\\tacl: {\\n\\t\\t\\t\\t\\towner: handle.slice(0, 16),\\n\\t\\t\\t\\t\\tgroup: handle.slice(0, 16),\\n\\t\\t\\t\\t\\tworld: true\\n\\t\\t\\t\\t}\\n\\t\\t\\t};\\n\\t\\t\\treturn handle;\\n\\t\\t},\\n\\t\\tsend: (arg) => websocketAPI._handles[arg.handle].ws.send(arg.data),\\n\\t\\tclose: function(handle) {\\n\\t\\t\\tif (websocketAPI._handles.hasOwnProperty(handle)) websocketAPI._handles[handle].ws.close();\\n\\t\\t\\tdelete websocketAPI._handles[handle];\\n\\t\\t},\\n\\t\\tgetInfo: function(handle) {\\n\\t\\t\\treturn {\\n\\t\\t\\t\\tbufferedAmount: websocketAPI._handles[handle].ws.bufferedAmount,\\n\\t\\t\\t\\textensions: websocketAPI._handles[handle].ws.extensions,\\n\\t\\t\\t\\tprotocol: websocketAPI._handles[handle].ws.protocol,\\n\\t\\t\\t\\treadyState: websocketAPI._handles[handle].ws.readyState,\\n\\t\\t\\t\\turl: websocketAPI._handles[handle].ws.url\\n\\t\\t\\t}\\n\\t\\t},\\n\\t\\twaitForEvent: function(arg) {\\n\\t\\t\\treturn new Promise(function(resolve) {\\n\\t\\t\\t\\twebsocketAPI._handles[arg.handle].ws.addEventListener(arg.eventName, function meName(arg2) {\\n\\t\\t\\t\\t\\tif (arg.eventName == \\\"message\\\") resolve(arg2.data);\\n\\t\\t\\t\\t\\telse if (arg.eventName == \\\"error\\\") resolve({\\n\\t\\t\\t\\t\\t\\tcode: arg2.code,\\n\\t\\t\\t\\t\\t\\treason: arg2.reason,\\n\\t\\t\\t\\t\\t\\twasClean: arg2.wasClean\\n\\t\\t\\t\\t\\t});\\n\\t\\t\\t\\t\\telse resolve(arg.eventName);\\n\\t\\t\\t\\t\\ttry {\\n\\t\\t\\t\\t\\t\\twebsocketAPI._handles[arg.handle].ws.removeEventListener(arg.eventName, meName);\\n\\t\\t\\t\\t\\t} catch {}\\n\\t\\t\\t\\t});\\n\\t\\t\\t});\\n\\t\\t},\\n\\t\\tassertAccess: function(arg) {\\n\\t\\t\\tif (arg.newACL) websocketAPI._handles[arg.handle].acl = arg.newACL;\\n\\t\\t\\treturn websocketAPI._handles[arg.handle].acl;\\n\\t\\t},\\n\\t\\twebsocketState: (handle) => websocketAPI._handles[handle].ws.readyState,\\n\\t\\t_handles: {}\\n\\t}\\n\\tmodules.websocket = websocketAPI;\\n}\\n\\nloadWebsocketSupport();\",\"a7b8e8a310fc9247c5495ce090bf50a3c088274da403ddb2096af9a60bb3bbeecac7f5333145fed017e842d218baa9880c16b79d677e9657cc57bbe45087cdce\":\"function loadLull() {\\n\\tlet lullSession;\\n\\tmodules.lull = function() {\\n\\t\\tif (lullSession) return;\\n\\t\\tlet style = document.createElement(\\\"style\\\");\\n\\t\\tstyle.innerHTML = `* { cursor: none !important; };`;\\n\\t\\tdocument.head.appendChild(style);\\n\\t\\tlullSession = modules.session.mksession();\\n\\t\\tmodules.session.muteAllSessions();\\n\\t\\tmodules.session.activateSession(lullSession);\\n\\t\\tfunction wake() {\\n\\t\\t\\tremoveEventListener(\\\"mousemove\\\", wake);\\n\\t\\t\\tremoveEventListener(\\\"click\\\", wake);\\n\\t\\t\\tremoveEventListener(\\\"keydown\\\", wake);\\n\\t\\t\\tstyle.remove();\\n\\t\\t\\tmodules.session.muteAllSessions();\\n\\t\\t\\tmodules.session.activateSession(modules.session.systemSession);\\n\\t\\t\\tmodules.session.rmsession(lullSession);\\n\\t\\t\\tlullSession = null;\\n\\t\\t}\\n\\t\\taddEventListener(\\\"mousemove\\\", wake);\\n\\t\\taddEventListener(\\\"click\\\", wake);\\n\\t\\taddEventListener(\\\"keydown\\\", wake);\\n\\t}\\n}\\nloadLull();\",\"3eeec9e78ca3b1831fcf37be4e7a6d94dcb3f23f56d35f203602df60d553c9058a011f81654e0c75f862b21bd32bca026ef589ff97e5562b1f0c233d4e784b6f\":\"async function networkd() {\\n\\tlet hexToU8A = (hex) => Uint8Array.from(hex.match(/.{1,2}/g).map(a => parseInt(a, 16)));\\n\\tlet u8aToHex = (u8a) => Array.from(u8a).map(a => a.toString(16).padStart(2, \\\"0\\\")).join(\\\"\\\");\\n\\tmodules.network = { connected: false, address: null, ws: null, runOnClose: Promise.resolve(), _runOnClose: _ => 1 };\\n\\ttry {\\n\\t\\tlet config = await modules.fs.read(modules.defaultSystem + \\\"/etc/network.json\\\");\\n\\t\\tconfig = JSON.parse(config);\\n\\t\\tfunction isPacketFiltered(packet) {\\n\\t\\t\\tif (!config.filters) return false;\\n\\t\\t\\tfor (let filter of config.filters) {\\n\\t\\t\\t\\tif (filter.type == 0) return filter.result;\\n\\t\\t\\t\\tif (filter.type == 1 && isPacketFrom(packet, filter)) return filter.result;\\n\\t\\t\\t\\tif (filter.type == 2 && filter.protocol == packet.data.type) return filter.result;\\n\\t\\t\\t\\tif (filter.type == 3 && isPacketFrom(packet, filter) && filter.protocol == packet.data.type) return filter.result;\\n\\t\\t\\t\\tif (filter.type == 4 && isPacketFrom(packet, filter) &&\\n\\t\\t\\t\\t\\t(packet.data.type == \\\"connectionful\\\" || packet.data.type == \\\"connectionless\\\")) {\\n\\t\\t\\t\\t\\t\\tif (packet.data.gate == filter.gate) return filter.result;\\n\\t\\t\\t\\t\\t}\\n\\t\\t\\t}\\n\\t\\t\\treturn true;\\n\\t\\t}\\n\\t\\tfunction isPacketFrom(packet, filter) {\\n\\t\\t\\tif (filter.from == packet.from) return true;\\n\\t\\t\\tif (filter.ipHash == packet.from.slice(0, 8)) return true;\\n\\t\\t\\tif (filter.systemID == packet.from.slice(8, 24)) return true;\\n\\t\\t\\treturn false;\\n\\t\\t}\\n\\t\\tmodules.network.reloadConfig = async function() {\\n\\t\\t\\tconfig = JSON.parse(await modules.fs.read(modules.defaultSystem + \\\"/etc/network.json\\\"));\\n\\t\\t\\tmodules.network.updates = config.updates;\\n\\t\\t\\ttry {\\n\\t\\t\\t\\tws.send(JSON.stringify({\\n\\t\\t\\t\\t\\tfinalProxyPacket: true\\n\\t\\t\\t\\t}));\\n\\t\\t\\t\\tws.close();\\n\\t\\t\\t} catch {\\n\\t\\t\\t\\tonclose();\\n\\t\\t\\t}\\n\\t\\t}\\n\\t\\tmodules.network.updates = config.updates;\\n\\t\\tlet stage = 0;\\n\\t\\tlet pukey = (modules.core.prefs.read(\\\"system_id\\\") || {}).public;\\n\\t\\tlet importedKey = await crypto.subtle.importKey(\\\"jwk\\\", (modules.core.prefs.read(\\\"system_id\\\") || {}).private, {\\n\\t\\t\\tname: \\\"ECDSA\\\",\\n\\t\\t\\tnamedCurve: \\\"P-256\\\"\\n\\t\\t}, true, [\\\"sign\\\"]);\\n\\t\\tlet ws = new WebSocket(config.url);\\n\\t\\tlet handle = Array.from(crypto.getRandomValues(new Uint8Array(64))).reduce((a, b) => a + b.toString(16).padStart(2, \\\"0\\\"), \\\"\\\");\\n\\t\\tmodules.network.runOnClose = new Promise(a => modules.network._runOnClose = a);\\n\\t\\tws.binaryType = \\\"arraybuffer\\\";\\n\\t\\tasync function onclose() {\\n\\t\\t\\tmodules.network.connected = false;\\n\\t\\t\\tmodules.network.address = null;\\n\\t\\t\\tmodules.network.hostname = null;\\n\\t\\t\\tmodules.network._runOnClose();\\n\\t\\t\\tws = new WebSocket(config.url);\\n\\t\\t\\tstage = 0;\\n\\t\\t\\tws.onmessage = onmessage;\\n\\t\\t\\tws.onclose = onclose;\\n\\t\\t\\tmodules.network.runOnClose = new Promise(a => modules.network._runOnClose = a);\\n\\t\\t}\\n\\t\\tasync function onmessage(e) {\\n\\t\\t\\tlet messageData;\\n\\t\\t\\ttry {\\n\\t\\t\\t\\tmessageData = JSON.parse(e.data);\\n\\t\\t\\t} catch {\\n\\t\\t\\t\\treturn;\\n\\t\\t\\t}\\n\\t\\t\\tif (stage == 0) {\\n\\t\\t\\t\\tws.send(JSON.stringify({ ...pukey, forceConnect: true, userCustomizable: config.ucBits, hostname: config.hostname }));\\n\\t\\t\\t\\tstage++;\\n\\t\\t\\t} else if (stage == 1) {\\n\\t\\t\\t\\tif (messageData.event != \\\"SignatureRequest\\\") {\\n\\t\\t\\t\\t\\tws.onclose = null;\\n\\t\\t\\t\\t\\tdelete modules.websocket._handles[handle];\\n\\t\\t\\t\\t\\treturn ws.close();\\n\\t\\t\\t\\t}\\n\\t\\t\\t\\tws.send(u8aToHex(new Uint8Array(await crypto.subtle.sign({\\n\\t\\t\\t\\t\\tname: \\\"ECDSA\\\",\\n\\t\\t\\t\\t\\thash: {\\n\\t\\t\\t\\t\\t\\tname: \\\"SHA-256\\\"\\n\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t}, importedKey, hexToU8A(messageData.signBytes)))));\\n\\t\\t\\t\\tstage++;\\n\\t\\t\\t} else if (stage == 2) {\\n\\t\\t\\t\\tif (messageData.event != \\\"ConnectionEstablished\\\") {\\n\\t\\t\\t\\t\\tws.onclose = null;\\n\\t\\t\\t\\t\\tdelete modules.websocket._handles[handle];\\n\\t\\t\\t\\t\\treturn ws.close();\\n\\t\\t\\t\\t}\\n\\t\\t\\t\\tmodules.websocket._handles[handle] = {\\n\\t\\t\\t\\t\\tws: ws,\\n\\t\\t\\t\\t\\tacl: {\\n\\t\\t\\t\\t\\t\\towner: handle.slice(0, 16),\\n\\t\\t\\t\\t\\t\\tgroup: handle.slice(0, 16),\\n\\t\\t\\t\\t\\t\\tworld: true\\n\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t}\\n\\t\\t\\t\\tmodules.network.connected = true;\\n\\t\\t\\t\\tmodules.network.address = messageData.address;\\n\\t\\t\\t\\tmodules.network.hostname = messageData.hostname;\\n\\t\\t\\t\\tmodules.network.ws = handle;\\n\\t\\t\\t\\tstage++;\\n\\t\\t\\t} else if (stage == 3) {\\n\\t\\t\\t\\tif (messageData.event == \\\"DisconnectionComplete\\\") {\\n\\t\\t\\t\\t\\tmodules.network.connected = false;\\n\\t\\t\\t\\t\\tmodules.network.address = null;\\n\\t\\t\\t\\t\\tmodules.network.hostname = null;\\n\\t\\t\\t\\t\\tmodules.network.ws = null;\\n\\t\\t\\t\\t\\tmodules.network._runOnClose();\\n\\t\\t\\t\\t\\tws.onclose = null;\\n\\t\\t\\t\\t\\tdelete modules.websocket._handles[handle];\\n\\t\\t\\t\\t\\treturn ws.close();\\n\\t\\t\\t\\t}\\n\\t\\t\\t\\tif (messageData.from) {\\n\\t\\t\\t\\t\\tif (isPacketFiltered(messageData)) {\\n\\t\\t\\t\\t\\t\\te.stopImmediatePropagation();\\n\\t\\t\\t\\t\\t\\te.preventDefault();\\n\\t\\t\\t\\t\\t\\treturn false;\\n\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t\\tif (messageData.data.type == \\\"ping\\\") {\\n\\t\\t\\t\\t\\t\\tif (typeof messageData.data.resend !== \\\"string\\\") return;\\n\\t\\t\\t\\t\\t\\tif (messageData.data.resend.length > 64) return;\\n\\t\\t\\t\\t\\t\\tws.send(JSON.stringify({ receiver: messageData.from, data: { type: \\\"pong\\\", resend: messageData.data.resend } }));\\n\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t}\\n\\t\\t\\t}\\n\\t\\t}\\n\\t\\tws.onmessage = onmessage;\\n\\t\\tws.onclose = onclose;\\n\\t} catch {\\n\\t\\tmodules.network.serviceStopped = true;\\n\\t\\tmodules.core.tty_bios_api.println(\\\"network: not starting network\\\");\\n\\t}\\n}\\nnetworkd();\",\"8040ef94476ec5568f3752f3ac4e994385fb4f00b4abea382a1de70f004d0b8e782b57c59c3e2f297dc6522799b168148c999ab326034bb2aaaca1cb0c0fa482\":\"function reeAPIs() {\\n\\t// @pcos-app-mode native\\n\\n\\tasync function denyUnmanifested(list, token) {\\n\\t\\tlet privileges = (await modules.tokens.info(token)).privileges;\\n\\t\\tlet isAllowlist = list.some(a => a.lineType == \\\"allow\\\");\\n\\t\\tif (isAllowlist) list = list.filter(a => a.lineType == \\\"allow\\\");\\n\\t\\tlet disallowedRegistry = [];\\n\\t\\tfor (let privilege of privileges) {\\n\\t\\t\\tif ((!list.some(x => x.data == privilege && x.lineType == \\\"allow\\\") && isAllowlist) || list.some(x => x.data == privilege && x.lineType == \\\"deny\\\")) {\\n\\t\\t\\t\\tprivileges = privileges.filter(x => x != privilege);\\n\\t\\t\\t\\tdisallowedRegistry.push(privilege);\\n\\t\\t\\t}\\n\\t\\t}\\n\\t\\tmodules.tokens.removePrivileges(token, disallowedRegistry);\\n\\t\\treturn privileges;\\n\\t}\\n\\n\\tmodules.reeAPIInstance = async function(opts) {\\n\\t\\tlet {ree, ses, token, taskId, limitations, privateData} = opts;\\n\\t\\tlet processToken = token;\\n\\t\\tlet tokenInfo = await modules.tokens.info(token);\\n\\t\\tlet user = tokenInfo.user;\\n\\t\\tlet groups = tokenInfo.groups || [];\\n\\t\\tlet privileges = tokenInfo.privileges;\\n\\t\\tlet processPipes = [];\\n\\t\\tlet websockets = [];\\n\\t\\tlet automatedLogonSessions = {};\\n\\t\\tlet networkListens = {};\\n\\t\\tlet connections = {};\\n\\t\\tlet language = modules.session.attrib(ses, \\\"language\\\") || undefined;\\n\\t\\tprivileges = await denyUnmanifested(limitations, token);\\n\\n\\t\\tasync function fs_action(action, privilegeCheck, path, ...xtra) {\\n\\t\\t\\tlet fsPermissions;\\n\\t\\t\\ttry {\\n\\t\\t\\t\\tfsPermissions = await modules.fs.permissions(path);\\n\\t\\t\\t} catch (e) {\\n\\t\\t\\t\\tthrow new Error(\\\"PERMISSION_CHECKING_FAILED\\\");\\n\\t\\t\\t}\\n\\t\\t\\tif (!privilegeCheck(fsPermissions)) throw new Error(\\\"PERMISSION_DENIED\\\");\\n\\t\\t\\ttry {\\n\\t\\t\\t\\tlet response = await modules.fs[action](path, ...xtra);\\n\\t\\t\\t\\treturn response;\\n\\t\\t\\t} catch (e) {\\n\\t\\t\\t\\tif (e.name == \\\"Error\\\") throw e;\\n\\t\\t\\t\\tthrow new Error(\\\"FS_ACTION_FAILED\\\");\\n\\t\\t\\t}\\n\\t\\t}\\n\\t\\tasync function recursiveKeyVerify(key, khrl) {\\n\\t\\t\\tif (!key) throw new Error(\\\"NO_KEY\\\");\\n\\t\\t\\tlet u8aToHex = (u8a) => Array.from(u8a).map(a => a.toString(16).padStart(2, \\\"0\\\")).join(\\\"\\\");\\n\\t\\t\\tlet hash = u8aToHex(new Uint8Array(await crypto.subtle.digest(\\\"SHA-256\\\", new TextEncoder().encode((key.keyInfo?.key || key.key).x + \\\"|\\\" + (key.keyInfo?.key || key.key).y))));\\n\\t\\t\\tlet hexToU8A = (hex) => Uint8Array.from(hex.match(/.{1,2}/g).map(a => parseInt(a, 16)));\\n\\t\\t\\tif (khrl.includes(hash)) throw new Error(\\\"KEY_REVOKED\\\");\\n\\t\\t\\tlet signedByKey = modules.ksk_imported;\\n\\t\\t\\tif (key.keyInfo && key.keyInfo?.signedBy) {\\n\\t\\t\\t\\tsignedByKey = JSON.parse(await modules.fs.read(modules.defaultSystem + \\\"/etc/keys/\\\" + key.keyInfo.signedBy, token));\\n\\t\\t\\t\\tif (!signedByKey.keyInfo) throw new Error(\\\"NOT_KEYS_V2\\\");\\n\\t\\t\\t\\tif (!signedByKey.keyInfo.usages.includes(\\\"keyTrust\\\")) throw new Error(\\\"NOT_KEY_AUTHORITY\\\");\\n\\t\\t\\t\\tawait recursiveKeyVerify(signedByKey, khrl);\\n\\t\\t\\t\\tsignedByKey = await crypto.subtle.importKey(\\\"jwk\\\", signedByKey.keyInfo.key, {\\n\\t\\t\\t\\t\\tname: \\\"ECDSA\\\",\\n\\t\\t\\t\\t\\tnamedCurve: \\\"P-256\\\"\\n\\t\\t\\t\\t}, false, [\\\"verify\\\"]);\\n\\t\\t\\t}\\n\\t\\t\\tif (!await crypto.subtle.verify({\\n\\t\\t\\t\\tname: \\\"ECDSA\\\",\\n\\t\\t\\t\\thash: {\\n\\t\\t\\t\\t\\tname: \\\"SHA-256\\\"\\n\\t\\t\\t\\t}\\n\\t\\t\\t}, signedByKey, hexToU8A(key.signature), new TextEncoder().encode(JSON.stringify(key.key || key.keyInfo)))) throw new Error(\\\"KEY_SIGNATURE_VERIFICATION_FAILED\\\");\\n\\t\\t\\treturn true;\\n\\t\\t}\\n\\n\\t\\tree.beforeCloseDown(async function() {\\n\\t\\t\\tfor (let processPipe of processPipes) delete modules.ipc._ipc[processPipe];\\n\\t\\t\\tfor (let connection in connections) try { networkListens[connections[connection].networkListenID].ws.send(JSON.stringify({\\n\\t\\t\\t\\treceiver: connections[connection].from,\\n\\t\\t\\t\\tdata: {\\n\\t\\t\\t\\t\\ttype: \\\"connectionful\\\",\\n\\t\\t\\t\\t\\taction: \\\"drop\\\",\\n\\t\\t\\t\\t\\tconnectionID: connection.slice(0, -7),\\n\\t\\t\\t\\t\\tgate: connections[connection].gateIfNeeded\\n\\t\\t\\t\\t}\\n\\t\\t\\t})); } catch {}\\n\\t\\t\\tfor (let networkListen in networkListens) networkListens[networkListen].ws.removeEventListener(\\\"message\\\", networkListens[networkListen].fn);\\n\\t\\t\\tfor (let websocket of websockets) modules.websocket.close(websocket);\\n\\t\\t\\tawait modules.tokens.revoke(token);\\n\\t\\t\\tfor (let i in modules.csps) if (modules.csps[i].hasOwnProperty(\\\"removeSameGroupKeys\\\")) modules.csps[i].removeSameGroupKeys(null, taskId);\\n\\t\\t});\\n\\t\\tlet apis = {\\n\\t\\t\\tprivate: {\\n\\t\\t\\t\\tsetUser: async function(newUser) {\\n\\t\\t\\t\\t\\tuser = newUser;\\n\\t\\t\\t\\t\\tgroups = (await modules.users.getUserInfo(newUser, false, token || processToken)).groups || [];\\n\\t\\t\\t\\t},\\n\\t\\t\\t\\taddPrivilege: (newPrivilege) => !privileges.includes(newPrivilege) && privileges.push(newPrivilege),\\n\\t\\t\\t\\trmPrivilege: (newPrivilege) => privileges.includes(newPrivilege) && privileges.splice(privileges.indexOf(newPrivilege), 1),\\n\\t\\t\\t\\tsetPrivileges: (newPrivileges) => privileges = newPrivileges,\\n\\t\\t\\t\\treauthorize: async function() {\\n\\t\\t\\t\\t\\tlet tokenInfo = await modules.tokens.info(token);\\n\\t\\t\\t\\t\\tuser = tokenInfo.user;\\n\\t\\t\\t\\t\\tgroups = tokenInfo.groups || [];\\n\\t\\t\\t\\t\\tprivileges = tokenInfo.privileges;\\n\\t\\t\\t\\t\\tprivileges = await denyUnmanifested(limitations, token);\\n\\t\\t\\t\\t}\\n\\t\\t\\t},\\n\\t\\t\\tpublic: {\\n\\t\\t\\t\\tgetUser: () => user,\\n\\t\\t\\t\\tgetPrivileges: () => privileges,\\n\\t\\t\\t\\tterminate: async function() {\\n\\t\\t\\t\\t\\tawait ree.closeDown();\\n\\t\\t\\t\\t},\\n\\t\\t\\t\\trmPrivilege: async function(privilege) {\\n\\t\\t\\t\\t\\tif (!privileges.includes(privilege)) throw new Error(\\\"NO_SUCH_PRIVILEGE\\\");\\n\\t\\t\\t\\t\\tprivileges.splice(privileges.indexOf(privilege), 1);\\n\\t\\t\\t\\t\\tawait modules.tokens.removePrivilege(token, privilege);\\n\\t\\t\\t\\t\\treturn true;\\n\\t\\t\\t\\t},\\n\\t\\t\\t\\trmPrivileges: async function(privilegesRemoved) {\\n\\t\\t\\t\\t\\tprivileges = privileges.filter(x => !privilegesRemoved.includes(x));\\n\\t\\t\\t\\t\\tawait modules.tokens.removePrivileges(token, privilegesRemoved);\\n\\t\\t\\t\\t\\treturn true;\\n\\t\\t\\t\\t},\\n\\t\\t\\t\\tswitchUser: async function(desiredUser) {\\n\\t\\t\\t\\t\\tif (!privileges.includes(\\\"SWITCH_USERS_AUTOMATICALLY\\\")) throw new Error(\\\"UNAUTHORIZED_ACTION\\\");\\n\\t\\t\\t\\t\\tawait modules.tokens.halfInitialize(token, desiredUser);\\n\\t\\t\\t\\t\\tlet tokenInfo = await modules.tokens.info(token);\\n\\t\\t\\t\\t\\tuser = tokenInfo.user;\\n\\t\\t\\t\\t\\tgroups = tokenInfo.groups || [];\\n\\t\\t\\t\\t\\treturn true;\\n\\t\\t\\t\\t},\\n\\t\\t\\t\\tshutdown: async function(arg) {\\n\\t\\t\\t\\t\\tlet {isKexec, isReboot, force, token} = arg;\\n\\t\\t\\t\\t\\tif (!privileges.includes(\\\"SYSTEM_SHUTDOWN\\\")) throw new Error(\\\"UNAUTHORIZED_ACTION\\\");\\n\\t\\t\\t\\t\\tif (force) {\\n\\t\\t\\t\\t\\t\\ttry { modules.websocket._handles[modules.network.ws].ws.close(); } catch {}\\n\\t\\t\\t\\t\\t\\tmodules.session.destroy();\\n\\t\\t\\t\\t\\t\\tif (isReboot) return location.reload();\\n\\t\\t\\t\\t\\t\\treturn modules.killSystem();\\n\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t\\tawait modules.restart(!isReboot, token || processToken, isKexec);\\n\\t\\t\\t\\t\\treturn true;\\n\\t\\t\\t\\t},\\n\\t\\t\\t\\tfs_read: async function(arg) {\\n\\t\\t\\t\\t\\tlet {path, token} = arg;\\n\\t\\t\\t\\t\\tif (!privileges.includes(\\\"FS_READ\\\")) throw new Error(\\\"UNAUTHORIZED_ACTION\\\");\\n\\t\\t\\t\\t\\treturn await fs_action(\\\"read\\\", (fsPermissions) => fsPermissions.owner == user || fsPermissions.world.includes(\\\"r\\\") || groups.includes(fsPermissions.group) || privileges.includes(\\\"FS_BYPASS_PERMISSIONS\\\"), path, token || processToken);\\n\\t\\t\\t\\t},\\n\\t\\t\\t\\tfs_ls: async function(arg) {\\n\\t\\t\\t\\t\\tlet {path, token} = arg;\\n\\t\\t\\t\\t\\tif (!privileges.includes(\\\"FS_READ\\\")) throw new Error(\\\"UNAUTHORIZED_ACTION\\\");\\n\\t\\t\\t\\t\\treturn await fs_action(\\\"ls\\\",\\n\\t\\t\\t\\t\\t(fsPermissions) =>\\n\\t\\t\\t\\t\\t\\tfsPermissions.owner == user ||\\n\\t\\t\\t\\t\\t\\tgroups.includes(fsPermissions.group) ||\\n\\t\\t\\t\\t\\t\\t(fsPermissions.world.includes(\\\"r\\\") &&\\n\\t\\t\\t\\t\\t\\tfsPermissions.world.includes(\\\"x\\\")) || privileges.includes(\\\"FS_BYPASS_PERMISSIONS\\\"), path, token || processToken);\\n\\t\\t\\t\\t},\\n\\t\\t\\t\\tfs_write: async function(arg) {\\n\\t\\t\\t\\t\\tif (!privileges.includes(\\\"FS_WRITE\\\")) throw new Error(\\\"UNAUTHORIZED_ACTION\\\");\\n\\t\\t\\t\\t\\tlet {path, data, token} = arg;\\n\\t\\t\\t\\t\\tlet pathParent = path.split(\\\"/\\\").slice(0, -1).join(\\\"/\\\");\\n\\t\\t\\t\\t\\tlet basename = path.split(\\\"/\\\").slice(-1)[0];\\n\\t\\t\\t\\t\\tlet isCreating = false;\\n\\t\\t\\t\\t\\tlet fsParentPermissions;\\n\\t\\t\\t\\t\\ttry {\\n\\t\\t\\t\\t\\t\\tif (!(await modules.fs.ls(pathParent, token || processToken)).includes(basename)) isCreating = true;\\n\\t\\t\\t\\t\\t} catch (e) {\\n\\t\\t\\t\\t\\t\\tthrow new Error(\\\"CREATION_CHECK_FAILED\\\");\\n\\t\\t\\t\\t\\t}\\n\\n\\t\\t\\t\\t\\ttry {\\n\\t\\t\\t\\t\\t\\tfsParentPermissions = await modules.fs.permissions(pathParent, token || processToken);\\n\\t\\t\\t\\t\\t} catch (e) {\\n\\t\\t\\t\\t\\t\\tthrow new Error(\\\"PERMISSION_CHECKING_FAILED\\\");\\n\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t\\tif (!fsParentPermissions.world.includes(\\\"w\\\") && fsParentPermissions.owner != user && !groups.includes(fsParentPermissions.group) && !privileges.includes(\\\"FS_BYPASS_PERMISSIONS\\\")) throw new Error(\\\"PERMISSION_DENIED\\\");\\n\\t\\t\\t\\t\\t\\n\\t\\t\\t\\t\\tif (isCreating) {\\n\\t\\t\\t\\t\\t\\ttry {\\n\\t\\t\\t\\t\\t\\t\\tawait modules.fs.chown(path, user, token || processToken);\\n\\t\\t\\t\\t\\t\\t\\tawait modules.fs.chgrp(path, groups[0], token || processToken);\\n\\t\\t\\t\\t\\t\\t\\tawait modules.fs.chmod(path, \\\"r\\\", token || processToken);\\n\\t\\t\\t\\t\\t\\t} catch (e) {\\n\\t\\t\\t\\t\\t\\t\\tif (e.name == \\\"Error\\\") throw e;\\n\\t\\t\\t\\t\\t\\t\\tthrow new Error(\\\"PERMISSION_CHANGE_FAILED\\\");\\n\\t\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t\\treturn await fs_action(\\\"write\\\", (fsPermissions) => fsPermissions.owner == user || groups.includes(fsPermissions.group) || fsPermissions.world.includes(\\\"w\\\") || privileges.includes(\\\"FS_BYPASS_PERMISSIONS\\\"), path, data, token || processToken);\\n\\t\\t\\t\\t},\\n\\t\\t\\t\\tfs_rm: async function(arg) {\\n\\t\\t\\t\\t\\tlet {path, token} = arg;\\n\\t\\t\\t\\t\\tif (!privileges.includes(\\\"FS_REMOVE\\\")) throw new Error(\\\"UNAUTHORIZED_ACTION\\\");\\n\\t\\t\\t\\t\\treturn await fs_action(\\\"rm\\\", (fsPermissions) => fsPermissions.owner == user || privileges.includes(\\\"FS_BYPASS_PERMISSIONS\\\"), path, token);\\n\\t\\t\\t\\t},\\n\\t\\t\\t\\tfs_mkdir: async function(arg) {\\n\\t\\t\\t\\t\\tlet {path, token} = arg;\\n\\t\\t\\t\\t\\tif (!privileges.includes(\\\"FS_WRITE\\\")) throw new Error(\\\"UNAUTHORIZED_ACTION\\\");\\n\\t\\t\\t\\t\\tlet pathParent = path.split(\\\"/\\\").slice(0, -1).join(\\\"/\\\");\\n\\t\\t\\t\\t\\tlet fsPermissions;\\n\\t\\t\\t\\t\\ttry {\\n\\t\\t\\t\\t\\t\\tfsPermissions = await modules.fs.permissions(pathParent, token || processToken);\\n\\t\\t\\t\\t\\t} catch (e) {\\n\\t\\t\\t\\t\\t\\tthrow new Error(\\\"PERMISSION_CHECKING_FAILED\\\");\\n\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t\\tif (!fsPermissions.world.includes(\\\"w\\\") && fsPermissions.owner != user && !groups.includes(fsPermissions.group) && !privileges.includes(\\\"FS_BYPASS_PERMISSIONS\\\")) throw new Error(\\\"PERMISSION_DENIED\\\");\\n\\t\\t\\t\\t\\ttry {\\n\\t\\t\\t\\t\\t\\tawait modules.fs.chown(path, user, token || processToken);\\n\\t\\t\\t\\t\\t\\tawait modules.fs.chgrp(path, groups[0] || user, token || processToken);\\n\\t\\t\\t\\t\\t\\tawait modules.fs.chmod(path, \\\"rx\\\", token || processToken);\\n\\t\\t\\t\\t\\t} catch (e) {\\n\\t\\t\\t\\t\\t\\tif (e.name == \\\"Error\\\") throw e;\\n\\t\\t\\t\\t\\t\\tthrow new Error(\\\"PERMISSION_CHANGE_FAILED\\\");\\n\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t\\ttry {\\n\\t\\t\\t\\t\\t\\treturn await modules.fs.mkdir(path, token || processToken);\\n\\t\\t\\t\\t\\t} catch (e) {\\n\\t\\t\\t\\t\\t\\tif (e.name == \\\"Error\\\") throw e;\\n\\t\\t\\t\\t\\t\\tthrow new Error(\\\"FS_ACTION_FAILED\\\");\\n\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t},\\n\\t\\t\\t\\tfs_chown: async function(arg) {\\n\\t\\t\\t\\t\\tif (!privileges.includes(\\\"FS_CHANGE_PERMISSION\\\")) throw new Error(\\\"UNAUTHORIZED_ACTION\\\");\\n\\t\\t\\t\\t\\tlet {path, newUser, token} = arg;\\n\\t\\t\\t\\t\\treturn await fs_action(\\\"chown\\\", (fsPermissions) => fsPermissions.owner == user || privileges.includes(\\\"FS_BYPASS_PERMISSIONS\\\"), path, newUser, token || processToken);\\n\\t\\t\\t\\t},\\n\\t\\t\\t\\tfs_chgrp: async function(arg) {\\n\\t\\t\\t\\t\\tif (!privileges.includes(\\\"FS_CHANGE_PERMISSION\\\")) throw new Error(\\\"UNAUTHORIZED_ACTION\\\");\\n\\t\\t\\t\\t\\tlet {path, newGrp, token} = arg;\\n\\t\\t\\t\\t\\treturn await fs_action(\\\"chgrp\\\", (fsPermissions) => fsPermissions.owner == user || privileges.includes(\\\"FS_BYPASS_PERMISSIONS\\\"), path, newGrp, token || processToken);\\n\\t\\t\\t\\t},\\n\\t\\t\\t\\tfs_chmod: async function(arg) {\\n\\t\\t\\t\\t\\tif (!privileges.includes(\\\"FS_CHANGE_PERMISSION\\\")) throw new Error(\\\"UNAUTHORIZED_ACTION\\\");\\n\\t\\t\\t\\t\\tlet {path, newPermissions, token} = arg;\\n\\t\\t\\t\\t\\treturn await fs_action(\\\"chmod\\\", (fsPermissions) => fsPermissions.owner == user || privileges.includes(\\\"FS_BYPASS_PERMISSIONS\\\"), path, newPermissions, token || processToken);\\n\\t\\t\\t\\t},\\n\\t\\t\\t\\tfs_permissions: async function(arg) {\\n\\t\\t\\t\\t\\tlet {path, token} = arg;\\n\\t\\t\\t\\t\\tif (!privileges.includes(\\\"FS_READ\\\")) throw new Error(\\\"UNAUTHORIZED_ACTION\\\");\\n\\t\\t\\t\\t\\tlet pathParent = path.split(\\\"/\\\").slice(0, -1).join(\\\"/\\\");\\n\\t\\t\\t\\t\\tif (pathParent != \\\"\\\") {\\n\\t\\t\\t\\t\\t\\tlet fsPermissions;\\n\\t\\t\\t\\t\\t\\ttry {\\n\\t\\t\\t\\t\\t\\t\\tfsPermissions = await modules.fs.permissions(pathParent, token || processToken);\\n\\t\\t\\t\\t\\t\\t} catch (e) {\\n\\t\\t\\t\\t\\t\\t\\tthrow new Error(\\\"PERMISSION_CHECKING_FAILED\\\");\\n\\t\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t\\t\\tif (!fsPermissions.world.includes(\\\"r\\\") && fsPermissions.owner != user && !privileges.includes(\\\"FS_BYPASS_PERMISSIONS\\\")) throw new Error(\\\"PERMISSION_DENIED\\\");\\n\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t\\treturn await fs_action(\\\"permissions\\\", () => true, path, token || processToken);\\n\\t\\t\\t\\t},\\n\\t\\t\\t\\tfs_mounts: async function() {\\n\\t\\t\\t\\t\\tif (!privileges.includes(\\\"FS_LIST_PARTITIONS\\\")) throw new Error(\\\"UNAUTHORIZED_ACTION\\\");\\n\\t\\t\\t\\t\\ttry {\\n\\t\\t\\t\\t\\t\\treturn await modules.fs.lsmounts();\\n\\t\\t\\t\\t\\t} catch (e) {\\n\\t\\t\\t\\t\\t\\tif (e.name == \\\"Error\\\") throw e;\\n\\t\\t\\t\\t\\t\\tthrow new Error(\\\"FS_ACTION_FAILED\\\");\\n\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t},\\n\\t\\t\\t\\tfs_sync: async function(arg) {\\n\\t\\t\\t\\t\\tlet {mount, token} = arg;\\n\\t\\t\\t\\t\\tif (!privileges.includes(\\\"FS_UNMOUNT\\\")) throw new Error(\\\"UNAUTHORIZED_ACTION\\\");\\n\\t\\t\\t\\t\\ttry {\\n\\t\\t\\t\\t\\t\\treturn await modules.fs.sync(mount, token || processToken);\\n\\t\\t\\t\\t\\t} catch (e) {\\n\\t\\t\\t\\t\\t\\tif (e.name == \\\"Error\\\") throw e;\\n\\t\\t\\t\\t\\t\\tthrow new Error(\\\"FS_ACTION_FAILED\\\");\\n\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t},\\n\\t\\t\\t\\tfs_unmount: async function(arg) {\\n\\t\\t\\t\\t\\tlet {mount, token, force} = arg;\\n\\t\\t\\t\\t\\tif (!privileges.includes(\\\"FS_UNMOUNT\\\")) throw new Error(\\\"UNAUTHORIZED_ACTION\\\");\\n\\t\\t\\t\\t\\ttry {\\n\\t\\t\\t\\t\\t\\treturn await modules.fs.unmount(mount, token || processToken, force);\\n\\t\\t\\t\\t\\t} catch (e) {\\n\\t\\t\\t\\t\\t\\tif (e.name == \\\"Error\\\") throw e;\\n\\t\\t\\t\\t\\t\\tthrow new Error(\\\"FS_ACTION_FAILED\\\");\\n\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t},\\n\\t\\t\\t\\tfs_mountInfo: async function(mount) {\\n\\t\\t\\t\\t\\tif (!privileges.includes(\\\"FS_LIST_PARTITIONS\\\")) throw new Error(\\\"UNAUTHORIZED_ACTION\\\");\\n\\t\\t\\t\\t\\ttry {\\n\\t\\t\\t\\t\\t\\treturn await modules.fs.mountInfo(mount);\\n\\t\\t\\t\\t\\t} catch (e) {\\n\\t\\t\\t\\t\\t\\tif (e.name == \\\"Error\\\") throw e;\\n\\t\\t\\t\\t\\t\\tthrow new Error(\\\"FS_ACTION_FAILED\\\");\\n\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t},\\n\\t\\t\\t\\tgetSystemMount: async function() {\\n\\t\\t\\t\\t\\tif (!privileges.includes(\\\"FS_LIST_PARTITIONS\\\")) throw new Error(\\\"UNAUTHORIZED_ACTION\\\");\\n\\t\\t\\t\\t\\treturn modules.defaultSystem;\\n\\t\\t\\t\\t},\\n\\t\\t\\t\\tcreatePipe: async function() {\\n\\t\\t\\t\\t\\tif (!privileges.includes(\\\"IPC_CREATE_PIPE\\\")) throw new Error(\\\"UNAUTHORIZED_ACTION\\\");\\n\\t\\t\\t\\t\\tlet pipe = await modules.ipc.create();\\n\\t\\t\\t\\t\\tmodules.ipc.declareAccess(pipe, {\\n\\t\\t\\t\\t\\t\\towner: user,\\n\\t\\t\\t\\t\\t\\tgroup: groups[0],\\n\\t\\t\\t\\t\\t\\tworld: false\\n\\t\\t\\t\\t\\t});\\n\\t\\t\\t\\t\\tprocessPipes.push(pipe);\\n\\t\\t\\t\\t\\treturn pipe;\\n\\t\\t\\t\\t},\\n\\t\\t\\t\\tlistenToPipe: async function(pipe) {\\n\\t\\t\\t\\t\\tif (!privileges.includes(\\\"IPC_LISTEN_PIPE\\\")) throw new Error(\\\"UNAUTHORIZED_ACTION\\\");\\n\\t\\t\\t\\t\\tlet permissions = await modules.ipc.getIPC(pipe);\\n\\t\\t\\t\\t\\tif (permissions.owner != user && !groups.includes(permissions.group) && !permissions.world && !privileges.includes(\\\"IPC_BYPASS_PERMISSIONS\\\") && !processPipes.includes(pipe)) throw new Error(\\\"PERMISSION_DENIED\\\");\\n\\t\\t\\t\\t\\treturn await modules.ipc.listenFor(pipe);\\n\\t\\t\\t\\t},\\n\\t\\t\\t\\tsendToPipe: async function(dataSend) {\\n\\t\\t\\t\\t\\tif (!privileges.includes(\\\"IPC_SEND_PIPE\\\")) throw new Error(\\\"UNAUTHORIZED_ACTION\\\");\\n\\t\\t\\t\\t\\tlet {pipe, data} = dataSend;\\n\\t\\t\\t\\t\\tlet permissions = await modules.ipc.getIPC(pipe);\\n\\t\\t\\t\\t\\tif (permissions.owner != user && !groups.includes(permissions.group) && !permissions.world && !privileges.includes(\\\"IPC_BYPASS_PERMISSIONS\\\") && !processPipes.includes(pipe)) throw new Error(\\\"PERMISSION_DENIED\\\");\\n\\t\\t\\t\\t\\treturn await modules.ipc.send(pipe, data);\\n\\t\\t\\t\\t},\\n\\t\\t\\t\\tclosePipe: async function(pipe) {\\n\\t\\t\\t\\t\\tif (!processPipes.includes(pipe)) throw new Error(\\\"NOT_OWN_PIPE\\\");\\n\\t\\t\\t\\t\\tprocessPipes.splice(processPipes.indexOf(pipe), 1);\\n\\t\\t\\t\\t\\treturn delete modules.ipc._ipc[pipe];\\n\\t\\t\\t\\t},\\n\\t\\t\\t\\tsetPipePermissions: async function(opts) {\\n\\t\\t\\t\\t\\tif (!privileges.includes(\\\"IPC_CHANGE_PERMISSION\\\")) throw new Error(\\\"UNAUTHORIZED_ACTION\\\");\\n\\t\\t\\t\\t\\tlet {pipe, newPermissions} = opts;\\n\\t\\t\\t\\t\\tlet permissions = await modules.ipc.getIPC(pipe);\\n\\t\\t\\t\\t\\tif (permissions.owner != user && !groups.includes(permissions.group) && !permissions.world && !privileges.includes(\\\"IPC_BYPASS_PERMISSIONS\\\") && !processPipes.includes(pipe)) throw new Error(\\\"PERMISSION_DENIED\\\");\\n\\t\\t\\t\\t\\treturn await modules.ipc.declareAccess(pipe, newPermissions);\\n\\t\\t\\t\\t},\\n\\t\\t\\t\\televate: async function(newPrivileges) {\\n\\t\\t\\t\\t\\tnewPrivileges = newPrivileges.filter(privilege => !privileges.includes(privilege));\\n\\t\\t\\t\\t\\tnewPrivileges = Array.from(new Set(newPrivileges));\\n\\t\\t\\t\\t\\tif (!privileges.includes(\\\"SWITCH_USERS_AUTOMATICALLY\\\")) throw new Error(\\\"UNAUTHORIZED_ACTION\\\");\\n\\t\\t\\t\\t\\tprivileges.push(...newPrivileges);\\n\\t\\t\\t\\t\\tawait modules.tokens.addPrivileges(token, newPrivileges);\\n\\t\\t\\t\\t\\tprivileges = await denyUnmanifested(limitations, token);\\n\\t\\t\\t\\t\\treturn true;\\n\\t\\t\\t\\t},\\n\\t\\t\\t\\tgetVersion: function() {\\n\\t\\t\\t\\t\\tif (!privileges.includes(\\\"GET_BUILD\\\")) throw new Error(\\\"UNAUTHORIZED_ACTION\\\");\\n\\t\\t\\t\\t\\treturn modules.pcos_version;\\n\\t\\t\\t\\t},\\n\\t\\t\\t\\tlocale: function() {\\n\\t\\t\\t\\t\\tif (!privileges.includes(\\\"GET_LOCALE\\\")) throw new Error(\\\"UNAUTHORIZED_ACTION\\\");\\n\\t\\t\\t\\t\\treturn language || navigator.languages[0].split(\\\"-\\\")[0].toLowerCase();\\n\\t\\t\\t\\t},\\n\\t\\t\\t\\tosLocale: function() {\\n\\t\\t\\t\\t\\tif (!privileges.includes(\\\"GET_LOCALE\\\")) throw new Error(\\\"UNAUTHORIZED_ACTION\\\");\\n\\t\\t\\t\\t\\treturn modules.locales.get(\\\"OS_LOCALE\\\", language);\\n\\t\\t\\t\\t},\\n\\t\\t\\t\\tgetUserInfo: async function(arg) {\\n\\t\\t\\t\\t\\tlet {desiredUser, token, sensitive} = arg;\\n\\t\\t\\t\\t\\tif (!privileges.includes(\\\"GET_USER_INFO\\\")) throw new Error(\\\"UNAUTHORIZED_ACTION\\\");\\n\\t\\t\\t\\t\\tif (desiredUser != user && !privileges.includes(\\\"USER_INFO_OTHERS\\\")) throw new Error(\\\"UNAUTHORIZED_ACTION\\\");\\n\\t\\t\\t\\t\\tif (sensitive && desiredUser != user && !privileges.includes(\\\"SENSITIVE_USER_INFO_OTHERS\\\")) throw new Error(\\\"PERMISSION_DENIED\\\");\\n\\t\\t\\t\\t\\treturn await modules.users.getUserInfo(desiredUser, sensitive, token || processToken);\\n\\t\\t\\t\\t},\\n\\t\\t\\t\\tsetUserInfo: async function(arg) {\\n\\t\\t\\t\\t\\tlet {desiredUser, token, info} = arg;\\n\\t\\t\\t\\t\\tif (!privileges.includes(\\\"SET_USER_INFO\\\")) throw new Error(\\\"UNAUTHORIZED_ACTION\\\");\\n\\t\\t\\t\\t\\treturn await modules.users.moduser(desiredUser, info, token || processToken);\\n\\t\\t\\t\\t},\\n\\t\\t\\t\\tsetOwnSecurityChecks: async function(arg) {\\n\\t\\t\\t\\t\\tlet {token, checks} = arg;\\n\\t\\t\\t\\t\\tif (!privileges.includes(\\\"SET_SECURITY_CHECKS\\\")) throw new Error(\\\"UNAUTHORIZED_ACTION\\\");\\n\\t\\t\\t\\t\\tlet allowedTypes = [ \\\"pbkdf2\\\", \\\"informative\\\", \\\"informative_deny\\\", \\\"timeout\\\", \\\"timeout_deny\\\", \\\"serverReport\\\", \\\"pc-totp\\\", \\\"totp\\\", \\\"workingHours\\\", \\\"zkpp\\\" ];\\n\\t\\t\\t\\t\\tlet sanitizedChecks = [];\\n\\t\\t\\t\\t\\tchecks.filter(a => allowedTypes.includes(a.type));\\n\\t\\t\\t\\t\\tfor (let checkIndex in checks) {\\n\\t\\t\\t\\t\\t\\tlet check = checks[checkIndex];\\n\\t\\t\\t\\t\\t\\tif (check.type == \\\"pbkdf2\\\") {\\n\\t\\t\\t\\t\\t\\t\\tif (!check.salt || !check.hash) continue;\\n\\t\\t\\t\\t\\t\\t\\tcheck = { type: \\\"pbkdf2\\\", salt: check.salt, hash: check.hash };\\n\\t\\t\\t\\t\\t\\t} else if (check.type == \\\"informative\\\" || check.type == \\\"informative_deny\\\") {\\n\\t\\t\\t\\t\\t\\t\\tif (!check.message) continue;\\n\\t\\t\\t\\t\\t\\t\\tcheck = { type: check.type, message: check.message };\\n\\t\\t\\t\\t\\t\\t} else if (check.type == \\\"timeout\\\" || check.type == \\\"timeout_deny\\\") {\\n\\t\\t\\t\\t\\t\\t\\tif (!check.timeout) continue;\\n\\t\\t\\t\\t\\t\\t\\tcheck = { type: check.type, timeout: check.timeout };\\n\\t\\t\\t\\t\\t\\t} else if (check.type == \\\"serverReport\\\") {\\n\\t\\t\\t\\t\\t\\t\\tif (!check.url) continue;\\n\\t\\t\\t\\t\\t\\t\\tcheck = { type: \\\"serverReport\\\", url: check.url };\\n\\t\\t\\t\\t\\t\\t} else if (check.type == \\\"pc-totp\\\" || check.type == \\\"totp\\\") {\\n\\t\\t\\t\\t\\t\\t\\tif (!check.secret) continue;\\n\\t\\t\\t\\t\\t\\t\\tcheck = { type: check.type, secret: check.secret };\\n\\t\\t\\t\\t\\t\\t} else if (check.type == \\\"workingHours\\\") {\\n\\t\\t\\t\\t\\t\\t\\tif (!check.start || !check.end) continue;\\n\\t\\t\\t\\t\\t\\t\\tif (typeof check.start.hours !== \\\"number\\\" || typeof check.start.minutes !== \\\"number\\\" || typeof check.start.seconds !== \\\"number\\\") continue;\\n\\t\\t\\t\\t\\t\\t\\tif (typeof check.end.hours !== \\\"number\\\" || typeof check.end.minutes !== \\\"number\\\" || typeof check.end.seconds !== \\\"number\\\") continue;\\n\\t\\t\\t\\t\\t\\t\\tcheck = {\\n\\t\\t\\t\\t\\t\\t\\t\\ttype: \\\"workingHours\\\",\\n\\t\\t\\t\\t\\t\\t\\t\\tstart: {\\n\\t\\t\\t\\t\\t\\t\\t\\t\\thours: check.start.hours,\\n\\t\\t\\t\\t\\t\\t\\t\\t\\tminutes: check.start.minutes,\\n\\t\\t\\t\\t\\t\\t\\t\\t\\tseconds: check.start.seconds\\n\\t\\t\\t\\t\\t\\t\\t\\t},\\n\\t\\t\\t\\t\\t\\t\\t\\tend: {\\n\\t\\t\\t\\t\\t\\t\\t\\t\\thours: check.end.hours,\\n\\t\\t\\t\\t\\t\\t\\t\\t\\tminutes: check.end.minutes,\\n\\t\\t\\t\\t\\t\\t\\t\\t\\tseconds: check.end.seconds\\n\\t\\t\\t\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t\\t\\t\\t};\\n\\t\\t\\t\\t\\t\\t} else if (check.type == \\\"zkpp\\\") {\\n\\t\\t\\t\\t\\t\\t\\tif (!check.publicKey) continue;\\n\\t\\t\\t\\t\\t\\t\\tcheck = { type: \\\"zkpp\\\", publicKey: check.publicKey };\\n\\t\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t\\t\\tsanitizedChecks.push(check);\\n\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t\\tlet previousUserInfo = await modules.users.getUserInfo(user, false, token || processToken);\\n\\t\\t\\t\\t\\tawait modules.users.moduser(user, { ...previousUserInfo, securityChecks: sanitizedChecks }, token || processToken);\\n\\t\\t\\t\\t\\treturn true;\\n\\t\\t\\t\\t},\\n\\t\\t\\t\\tgetNewToken: async function(desiredUser) {\\n\\t\\t\\t\\t\\tif (!privileges.includes(\\\"ELEVATE_PRIVILEGES\\\")) throw new Error(\\\"UNAUTHORIZED_ACTION\\\");\\n\\t\\t\\t\\t\\tif (modules.session.attrib(ses, \\\"secureLock\\\")) await modules.session.attrib(ses, \\\"secureLock\\\");\\n\\t\\t\\t\\t\\tif (modules.session.active != ses) throw new Error(\\\"TRY_AGAIN_LATER\\\");\\n\\t\\t\\t\\t\\tlet releaseLock;\\n\\t\\t\\t\\t\\tlet lock = new Promise((resolve) => releaseLock = resolve);\\n\\t\\t\\t\\t\\tmodules.session.attrib(ses, \\\"secureLock\\\", lock);\\n\\t\\t\\t\\t\\tlet secureSession = await modules.session.mksession();\\n\\t\\t\\t\\t\\tmodules.session.attrib(ses, \\\"secureID\\\", secureSession);\\n\\t\\t\\t\\t\\tmodules.session.attrib(secureSession, \\\"language\\\", language);\\n\\n\\t\\t\\t\\t\\tlet dom = modules.session.tracker[secureSession].html;\\n\\t\\t\\t\\t\\tlet ogDom = modules.session.tracker[ses].html;\\n\\t\\t\\t\\t\\tlet bgfx = document.createElement(\\\"div\\\");\\n\\t\\t\\t\\t\\tbgfx.classList.add(\\\"session\\\", \\\"secure\\\");\\n\\t\\t\\t\\t\\tdom.appendChild(bgfx);\\n\\t\\t\\t\\t\\tmodules.session.attrib(secureSession, \\\"dark\\\", modules.session.attrib(ses, \\\"dark\\\"));\\n\\t\\t\\t\\t\\tdom.style.background = ogDom.style.background;\\n\\t\\t\\t\\t\\tdom.style.backgroundSize = \\\"100% 100%\\\";\\n\\n\\t\\t\\t\\t\\tmodules.session.muteAllSessions();\\n\\t\\t\\t\\t\\tmodules.session.activateSession(secureSession);\\n\\n\\t\\t\\t\\t\\ttry {\\n\\t\\t\\t\\t\\t\\tlet logonUI = await modules.authui(secureSession, desiredUser);\\n\\t\\t\\t\\t\\t\\treturn new Promise(function(resolve) {\\n\\t\\t\\t\\t\\t\\t\\tlogonUI.hook(async function(result) {\\n\\t\\t\\t\\t\\t\\t\\t\\treleaseLock();\\n\\t\\t\\t\\t\\t\\t\\t\\tmodules.session.attrib(ses, \\\"secureLock\\\", null);\\n\\t\\t\\t\\t\\t\\t\\t\\tmodules.session.attrib(ses, \\\"secureID\\\", null);\\n\\t\\t\\t\\t\\t\\t\\t\\tmodules.session.muteAllSessions();\\n\\t\\t\\t\\t\\t\\t\\t\\tmodules.session.rmsession(secureSession);\\n\\t\\t\\t\\t\\t\\t\\t\\tmodules.session.activateSession(ses);\\n\\t\\t\\t\\t\\t\\t\\t\\tif (result.success == false) return resolve(false);\\n\\t\\t\\t\\t\\t\\t\\t\\treturn resolve(result.token);\\n\\t\\t\\t\\t\\t\\t\\t});\\n\\t\\t\\t\\t\\t\\t});\\n\\t\\t\\t\\t\\t} catch (e) {\\n\\t\\t\\t\\t\\t\\tconsole.error(\\\"authui:\\\", e);\\n\\t\\t\\t\\t\\t\\treleaseLock();\\n\\t\\t\\t\\t\\t\\tmodules.session.attrib(ses, \\\"secureLock\\\", null);\\n\\t\\t\\t\\t\\t\\tmodules.session.attrib(ses, \\\"secureID\\\", null);\\n\\t\\t\\t\\t\\t\\tmodules.session.muteAllSessions();\\n\\t\\t\\t\\t\\t\\tmodules.session.rmsession(secureSession);\\n\\t\\t\\t\\t\\t\\tmodules.session.activateSession(ses);\\n\\t\\t\\t\\t\\t\\treturn false;\\n\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t},\\n\\t\\t\\t\\tgetProcessToken: () => processToken,\\n\\t\\t\\t\\tsetProcessToken: async function(desiredToken) {\\n\\t\\t\\t\\t\\tif (!privileges.includes(\\\"ELEVATE_PRIVILEGES\\\")) throw new Error(\\\"UNAUTHORIZED_ACTION\\\");\\n\\t\\t\\t\\t\\tlet validation = await modules.tokens.validate(desiredToken, {});\\n\\t\\t\\t\\t\\tif (!validation) throw new Error(\\\"INVALID_TOKEN\\\");\\n\\t\\t\\t\\t\\ttoken = processToken = desiredToken;\\n\\t\\t\\t\\t\\tlet tokenInfo = await modules.tokens.info(token);\\n\\t\\t\\t\\t\\tuser = tokenInfo.user;\\n\\t\\t\\t\\t\\tgroups = tokenInfo.groups || [];\\n\\t\\t\\t\\t\\tprivileges = tokenInfo.privileges;\\n\\t\\t\\t\\t\\tprivileges = await denyUnmanifested(limitations, token);\\n\\t\\t\\t\\t\\treturn true;\\n\\t\\t\\t\\t},\\n\\t\\t\\t\\trevokeToken: function(dt) {\\n\\t\\t\\t\\t\\tif (!privileges.includes(\\\"MANAGE_TOKENS\\\")) throw new Error(\\\"UNAUTHORIZED_ACTION\\\");\\n\\t\\t\\t\\t\\treturn modules.tokens.revoke(dt || processToken);\\n\\t\\t\\t\\t},\\n\\t\\t\\t\\tforkToken: function(dt) {\\n\\t\\t\\t\\t\\tif (!privileges.includes(\\\"MANAGE_TOKENS\\\")) throw new Error(\\\"UNAUTHORIZED_ACTION\\\");\\n\\t\\t\\t\\t\\treturn modules.tokens.fork(dt || processToken);\\n\\t\\t\\t\\t},\\n\\t\\t\\t\\tremoveTokenPrivilege: async function(arg) {\\n\\t\\t\\t\\t\\tlet {token, privilege} = arg;\\n\\t\\t\\t\\t\\tif (!privileges.includes(\\\"MANAGE_TOKENS\\\")) throw new Error(\\\"UNAUTHORIZED_ACTION\\\");\\n\\t\\t\\t\\t\\tawait modules.tokens.removePrivilege(token, privilege);\\n\\t\\t\\t\\t\\treturn true;\\n\\t\\t\\t\\t},\\n\\t\\t\\t\\tremoveTokenPrivileges: async function(arg) {\\n\\t\\t\\t\\t\\tlet {token} = arg;\\n\\t\\t\\t\\t\\tif (!privileges.includes(\\\"MANAGE_TOKENS\\\")) throw new Error(\\\"UNAUTHORIZED_ACTION\\\");\\n\\t\\t\\t\\t\\tawait modules.tokens.removePrivileges(token, arg.privileges);\\n\\t\\t\\t\\t\\treturn true;\\n\\t\\t\\t\\t},\\n\\t\\t\\t\\testimateStorage: async function() {\\n\\t\\t\\t\\t\\tif (!privileges.includes(\\\"FS_LIST_PARTITIONS\\\")) throw new Error(\\\"UNAUTHORIZED_ACTION\\\");\\n\\t\\t\\t\\t\\tlet estimate = await navigator.storage.estimate();\\n\\t\\t\\t\\t\\treturn {\\n\\t\\t\\t\\t\\t\\tinternal: {\\n\\t\\t\\t\\t\\t\\t\\tused: estimate.usage,\\n\\t\\t\\t\\t\\t\\t\\tfree: estimate.quota - estimate.usage,\\n\\t\\t\\t\\t\\t\\t\\ttotal: estimate.quota\\n\\t\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t\\t};\\n\\t\\t\\t\\t},\\n\\t\\t\\t\\tstartTask: async function(arg) {\\n\\t\\t\\t\\t\\tlet {file, argPassed, token, runInBackground, silent, privateData} = arg;\\n\\t\\t\\t\\t\\tif (!privileges.includes(\\\"START_TASK\\\")) throw new Error(\\\"UNAUTHORIZED_ACTION\\\");\\n\\t\\t\\t\\t\\tif (runInBackground && !privileges.includes(\\\"START_BACKGROUND_TASK\\\")) throw new Error(\\\"UNAUTHORIZED_ACTION\\\");\\n\\t\\t\\t\\t\\tif (!token) token = await modules.tokens.fork(processToken);\\n\\t\\t\\t\\t\\ttry {\\n\\t\\t\\t\\t\\t\\treturn await modules.tasks.exec(file, argPassed, modules.window(runInBackground ? modules.serviceSession : ses), token, silent, privateData);\\n\\t\\t\\t\\t\\t} catch (e) {\\n\\t\\t\\t\\t\\t\\tif (e.name == \\\"Error\\\") throw e;\\n\\t\\t\\t\\t\\t\\tthrow new Error(\\\"UNABLE_TO_START_TASK\\\");\\n\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t},\\n\\t\\t\\t\\tlistTasks: async function() {\\n\\t\\t\\t\\t\\tif (!privileges.includes(\\\"LIST_TASKS\\\")) throw new Error(\\\"UNAUTHORIZED_ACTION\\\");\\n\\t\\t\\t\\t\\treturn modules.tasks.listPublicTasks();\\n\\t\\t\\t\\t},\\n\\t\\t\\t\\ttaskInfo: async function(taskId) {\\n\\t\\t\\t\\t\\tif (!privileges.includes(\\\"LIST_TASKS\\\")) throw new Error(\\\"UNAUTHORIZED_ACTION\\\");\\n\\t\\t\\t\\t\\treturn await modules.tasks.taskInfo(taskId);\\n\\t\\t\\t\\t},\\n\\t\\t\\t\\tsignalTask: async function(arg) {\\n\\t\\t\\t\\t\\tlet {taskId, signal} = arg;\\n\\t\\t\\t\\t\\tif (!privileges.includes(\\\"SIGNAL_TASK\\\")) throw new Error(\\\"UNAUTHORIZED_ACTION\\\");\\n\\t\\t\\t\\t\\tif (!privileges.includes(\\\"TASK_BYPASS_PERMISSIONS\\\")) {\\n\\t\\t\\t\\t\\t\\tlet taskInfo = await modules.tasks.taskInfo(taskId);\\n\\t\\t\\t\\t\\t\\tif (taskInfo.runBy != user) throw new Error(\\\"PERMISSION_DENIED\\\");\\n\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t\\treturn await modules.tasks.sendSignal(taskId, signal);\\n\\t\\t\\t\\t},\\n\\t\\t\\t\\tlookupLocale: function(key) {   \\n\\t\\t\\t\\t\\tif (!privileges.includes(\\\"GET_LOCALE\\\")) throw new Error(\\\"UNAUTHORIZED_ACTION\\\");\\n\\t\\t\\t\\t\\treturn modules.locales.get(key, language);\\n\\t\\t\\t\\t},\\n\\t\\t\\t\\tlookupOtherLocale: function(arg) {\\n\\t\\t\\t\\t\\tlet {key, locale} = arg;   \\n\\t\\t\\t\\t\\tif (!privileges.includes(\\\"GET_LOCALE\\\")) throw new Error(\\\"UNAUTHORIZED_ACTION\\\");\\n\\t\\t\\t\\t\\treturn modules.locales.get(key, locale);\\n\\t\\t\\t\\t},\\n\\t\\t\\t\\tufTimeInc: function(args) {\\n\\t\\t\\t\\t\\tif (!privileges.includes(\\\"GET_LOCALE\\\")) throw new Error(\\\"UNAUTHORIZED_ACTION\\\");\\n\\t\\t\\t\\t\\treturn modules.userfriendliness.inconsiderateTime(language, ...args);\\n\\t\\t\\t\\t},\\n\\t\\t\\t\\tufInfoUnits: function(args) {\\n\\t\\t\\t\\t\\tif (!privileges.includes(\\\"GET_LOCALE\\\")) throw new Error(\\\"UNAUTHORIZED_ACTION\\\");\\n\\t\\t\\t\\t\\treturn modules.userfriendliness.informationUnits(language, ...args)\\n\\t\\t\\t\\t},\\n\\t\\t\\t\\tisDarkThemed: function() {\\n\\t\\t\\t\\t\\tif (!privileges.includes(\\\"GET_THEME\\\")) throw new Error(\\\"UNAUTHORIZED_ACTION\\\");\\n\\t\\t\\t\\t\\treturn modules.session.attrib(ses, \\\"dark\\\")\\n\\t\\t\\t\\t},\\n\\t\\t\\t\\tfetchSend: async function(arg) {\\n\\t\\t\\t\\t\\tif (!privileges.includes(\\\"FETCH_SEND\\\")) throw new Error(\\\"UNAUTHORIZED_ACTION\\\");\\n\\t\\t\\t\\t\\tlet {url, init} = arg;\\n\\t\\t\\t\\t\\tlet fetc = await fetch(url, init);\\n\\t\\t\\t\\t\\tlet responseAB;\\n\\t\\t\\t\\t\\tif (init.mode != \\\"no-cors\\\" && !init.noArrayBuffer) responseAB = await fetc.arrayBuffer();\\n\\t\\t\\t\\t\\treturn {\\n\\t\\t\\t\\t\\t\\tstatus: fetc.status,\\n\\t\\t\\t\\t\\t\\tstatusText: fetc.statusText,\\n\\t\\t\\t\\t\\t\\tok: fetc.ok,\\n\\t\\t\\t\\t\\t\\tredirected: fetc.redirected,\\n\\t\\t\\t\\t\\t\\ttype: fetc.type,\\n\\t\\t\\t\\t\\t\\turl: fetc.url,\\n\\t\\t\\t\\t\\t\\theaders: Object.fromEntries(Array.from(fetc.headers)),\\n\\t\\t\\t\\t\\t\\tarrayBuffer: responseAB,\\n\\t\\t\\t\\t\\t};\\n\\t\\t\\t\\t},\\n\\t\\t\\t\\tswitchUserWithSetup: async function(desiredUser) {\\n\\t\\t\\t\\t\\tif (!privileges.includes(\\\"SWITCH_USERS_AUTOMATICALLY\\\")) throw new Error(\\\"UNAUTHORIZED_ACTION\\\");\\n\\t\\t\\t\\t\\tawait modules.tokens.userInitialize(token, desiredUser);\\n\\t\\t\\t\\t\\tlet tokenInfo = await modules.tokens.info(token);\\n\\t\\t\\t\\t\\tuser = tokenInfo.user;\\n\\t\\t\\t\\t\\tgroups = tokenInfo.groups || [];\\n\\t\\t\\t\\t\\tprivileges = tokenInfo.privileges;\\n\\t\\t\\t\\t\\tprivileges = await denyUnmanifested(limitations, token);\\n\\t\\t\\t\\t\\treturn true;\\n\\t\\t\\t\\t},\\n\\t\\t\\t\\trunKlvlCode: async function(code) {\\n\\t\\t\\t\\t\\tif (!privileges.includes(\\\"RUN_KLVL_CODE\\\")) throw new Error(\\\"UNAUTHORIZED_ACTION\\\");\\n\\t\\t\\t\\t\\treturn eval(code);\\n\\t\\t\\t\\t},\\n\\t\\t\\t\\tcspOperation: async function(arg) {\\n\\t\\t\\t\\t\\tif (!privileges.includes(\\\"CSP_OPERATIONS\\\")) throw new Error(\\\"UNAUTHORIZED_ACTION\\\");\\n\\t\\t\\t\\t\\treturn modules.csps[arg.cspProvider][arg.operation](arg.cspArgument, taskId);\\n\\t\\t\\t\\t},\\n\\t\\t\\t\\tavailableCsps: async function() {\\n\\t\\t\\t\\t\\tif (!privileges.includes(\\\"CSP_OPERATIONS\\\")) throw new Error(\\\"UNAUTHORIZED_ACTION\\\");\\n\\t\\t\\t\\t\\treturn Object.keys(modules.csps);\\n\\t\\t\\t\\t},\\n\\t\\t\\t\\tufTimeCon: function(args) {\\n\\t\\t\\t\\t\\tif (!privileges.includes(\\\"GET_LOCALE\\\")) throw new Error(\\\"UNAUTHORIZED_ACTION\\\");\\n\\t\\t\\t\\t\\treturn modules.userfriendliness.considerateTime(language, ...args);\\n\\t\\t\\t\\t},\\n\\t\\t\\t\\twebsocketOpen: async function(arg) {\\n\\t\\t\\t\\t\\tif (!privileges.includes(\\\"WEBSOCKETS_OPEN\\\")) throw new Error(\\\"UNAUTHORIZED_ACTION\\\");\\n\\t\\t\\t\\t\\tlet handle = await modules.websocket.getHandle(arg);\\n\\t\\t\\t\\t\\twebsockets.push(handle);\\n\\t\\t\\t\\t\\tmodules.websocket.assertAccess({ handle, newACL: {\\n\\t\\t\\t\\t\\t\\towner: user,\\n\\t\\t\\t\\t\\t\\tgroup: groups[0],\\n\\t\\t\\t\\t\\t\\tworld: false\\n\\t\\t\\t\\t\\t}});\\n\\t\\t\\t\\t\\treturn handle;\\n\\t\\t\\t\\t},\\n\\t\\t\\t\\tlistenToWebsocket: async function(arg) {\\n\\t\\t\\t\\t\\tif (!privileges.includes(\\\"WEBSOCKETS_LISTEN\\\")) throw new Error(\\\"UNAUTHORIZED_ACTION\\\");\\n\\t\\t\\t\\t\\tlet permissions = modules.websocket.assertAccess({ handle: arg.handle });\\n\\t\\t\\t\\t\\tif (permissions.owner != user && !groups.includes(permissions.group) && !permissions.world && !privileges.includes(\\\"WEBSOCKET_BYPASS_PERMISSIONS\\\") && !websockets.includes(arg.handle)) throw new Error(\\\"PERMISSION_DENIED\\\");\\n\\t\\t\\t\\t\\treturn await modules.websocket.waitForEvent(arg);\\n\\t\\t\\t\\t},\\n\\t\\t\\t\\tsendToWebsocket: async function(arg) {\\n\\t\\t\\t\\t\\tif (!privileges.includes(\\\"WEBSOCKETS_SEND\\\")) throw new Error(\\\"UNAUTHORIZED_ACTION\\\");\\n\\t\\t\\t\\t\\tlet permissions = modules.websocket.assertAccess({ handle: arg.handle });\\n\\t\\t\\t\\t\\tif (permissions.owner != user && !groups.includes(permissions.group) && !permissions.world && !privileges.includes(\\\"WEBSOCKET_BYPASS_PERMISSIONS\\\") && !websockets.includes(arg.handle)) throw new Error(\\\"PERMISSION_DENIED\\\");\\n\\t\\t\\t\\t\\treturn await modules.websocket.send(arg);\\n\\t\\t\\t\\t},\\n\\t\\t\\t\\tcloseWebsocket: async function(websocket) {\\n\\t\\t\\t\\t\\tif (!websockets.includes(websocket)) throw new Error(\\\"NOT_OWN_WEBSOCKET\\\");\\n\\t\\t\\t\\t\\twebsockets.splice(websockets.indexOf(websocket), 1);\\n\\t\\t\\t\\t\\treturn modules.websocket.close(websocket);\\n\\t\\t\\t\\t},\\n\\t\\t\\t\\twebsocketInfo: async function(arg) {\\n\\t\\t\\t\\t\\tif (!privileges.includes(\\\"WEBSOCKET_INFO\\\")) throw new Error(\\\"UNAUTHORIZED_ACTION\\\");\\n\\t\\t\\t\\t\\tlet permissions = modules.websocket.assertAccess({ handle: arg.handle });\\n\\t\\t\\t\\t\\tif (permissions.owner != user && !groups.includes(permissions.group) && !permissions.world && !privileges.includes(\\\"WEBSOCKET_BYPASS_PERMISSIONS\\\") && !websockets.includes(arg.handle)) throw new Error(\\\"PERMISSION_DENIED\\\");\\n\\t\\t\\t\\t\\treturn await modules.websocket.getInfo(arg);\\n\\t\\t\\t\\t},\\n\\t\\t\\t\\tsetWebsocketPermissions: async function(arg) {\\n\\t\\t\\t\\t\\tif (!privileges.includes(\\\"WEBSOCKET_SET_PERMISSIONS\\\")) throw new Error(\\\"UNAUTHORIZED_ACTION\\\");\\n\\t\\t\\t\\t\\tlet permissions = modules.websocket.assertAccess({ handle: arg.handle });\\n\\t\\t\\t\\t\\tif (permissions.owner != user && !groups.includes(permissions.group) && !permissions.world && !privileges.includes(\\\"WEBSOCKET_BYPASS_PERMISSIONS\\\") && !websockets.includes(arg.handle)) throw new Error(\\\"PERMISSION_DENIED\\\");\\n\\t\\t\\t\\t\\treturn await modules.websocket.assertAccess(arg);\\n\\t\\t\\t\\t},\\n\\t\\t\\t\\tgetPublicSystemID: async function() {\\n\\t\\t\\t\\t\\tif (!privileges.includes(\\\"IDENTIFY_SYSTEM\\\")) throw new Error(\\\"UNAUTHORIZED_ACTION\\\");\\n\\t\\t\\t\\t\\treturn (modules.core.prefs.read(\\\"system_id\\\") || {}).public;\\n\\t\\t\\t\\t},\\n\\t\\t\\t\\tgetPrivateSystemID: async function() {\\n\\t\\t\\t\\t\\tif (!privileges.includes(\\\"IDENTIFY_SYSTEM_SENSITIVE\\\")) throw new Error(\\\"UNAUTHORIZED_ACTION\\\");\\n\\t\\t\\t\\t\\treturn (modules.core.prefs.read(\\\"system_id\\\") || {}).private;\\n\\t\\t\\t\\t},\\n\\t\\t\\t\\ttypeIntoOtherCLI: async function(arg) {\\n\\t\\t\\t\\t\\tif (!privileges.includes(\\\"CLI_MODIFICATIONS\\\")) throw new Error(\\\"UNAUTHORIZED_ACTION\\\");\\n\\t\\t\\t\\t\\tif (!modules.tasks.tracker.hasOwnProperty(arg.taskId)) throw new Error(\\\"TASK_NOT_FOUND\\\");\\n\\t\\t\\t\\t\\tlet bypassWorks = modules.tasks.tracker[arg.taskId].apis.public.getProcessToken() == arg.bypass;\\n\\t\\t\\t\\t\\tif (!bypassWorks) {\\n\\t\\t\\t\\t\\t\\tlet taskInfo = await modules.tasks.taskInfo(arg.taskId);\\n\\t\\t\\t\\t\\t\\tif (taskInfo.runBy != user && !privileges.includes(\\\"TASK_BYPASS_PERMISSIONS\\\")) throw new Error(\\\"PERMISSION_DENIED\\\");\\n\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t\\tif (!modules.tasks.tracker[arg.taskId].cliio) throw new Error(\\\"NO_CLI_ATTACHED\\\");\\n\\t\\t\\t\\t\\treturn await modules.tasks.tracker[arg.taskId].cliio.xtermInstance.input(arg.text, arg.human);\\n\\t\\t\\t\\t},\\n\\t\\t\\t\\tgetOtherCLIData: async function(arg) {\\n\\t\\t\\t\\t\\tif (!privileges.includes(\\\"CLI_MODIFICATIONS\\\")) throw new Error(\\\"UNAUTHORIZED_ACTION\\\");\\n\\t\\t\\t\\t\\tif (!modules.tasks.tracker.hasOwnProperty(arg.taskId)) throw new Error(\\\"TASK_NOT_FOUND\\\");\\n\\t\\t\\t\\t\\tlet bypassWorks = modules.tasks.tracker[arg.taskId].apis.public.getProcessToken() == arg.bypass;\\n\\t\\t\\t\\t\\tif (!bypassWorks) {\\n\\t\\t\\t\\t\\t\\tlet taskInfo = await modules.tasks.taskInfo(arg.taskId);\\n\\t\\t\\t\\t\\t\\tif (taskInfo.runBy != user && !privileges.includes(\\\"TASK_BYPASS_PERMISSIONS\\\")) throw new Error(\\\"PERMISSION_DENIED\\\");\\n\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t\\tif (!modules.tasks.tracker[arg.taskId].cliio) throw new Error(\\\"NO_CLI_ATTACHED\\\");\\n\\t\\t\\t\\t\\treturn await modules.tasks.tracker[arg.taskId].cliio.signup();\\n\\t\\t\\t\\t},\\n\\t\\t\\t\\twaitForOtherCLI: async function(arg) {\\n\\t\\t\\t\\t\\tif (!privileges.includes(\\\"CLI_MODIFICATIONS\\\")) throw new Error(\\\"UNAUTHORIZED_ACTION\\\");\\n\\t\\t\\t\\t\\tif (!modules.tasks.tracker.hasOwnProperty(arg.taskId)) throw new Error(\\\"TASK_NOT_FOUND\\\");\\n\\t\\t\\t\\t\\tlet bypassWorks = modules.tasks.tracker[arg.taskId].apis.public.getProcessToken() == arg.bypass;\\n\\t\\t\\t\\t\\tif (!bypassWorks) {\\n\\t\\t\\t\\t\\t\\tlet taskInfo = await modules.tasks.taskInfo(arg.taskId);\\n\\t\\t\\t\\t\\t\\tif (taskInfo.runBy != user && !privileges.includes(\\\"TASK_BYPASS_PERMISSIONS\\\")) throw new Error(\\\"PERMISSION_DENIED\\\");\\n\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t\\tif (modules.tasks.tracker[arg.taskId].cliio) return true;\\n\\t\\t\\t\\t\\treturn await modules.tasks.tracker[arg.taskId].cliio.attachedCLISignUp();\\n\\t\\t\\t\\t},\\n\\t\\t\\t\\tlldaRead: async function(arg) {\\n\\t\\t\\t\\t\\tif (!privileges.includes(\\\"LLDISK_READ\\\")) throw new Error(\\\"UNAUTHORIZED_ACTION\\\");\\n\\t\\t\\t\\t\\treturn modules.core.disk.partition(arg.partition).getData();\\n\\t\\t\\t\\t},\\n\\t\\t\\t\\tlldaWrite: async function(arg) {\\n\\t\\t\\t\\t\\tif (!privileges.includes(\\\"LLDISK_WRITE\\\")) throw new Error(\\\"UNAUTHORIZED_ACTION\\\");\\n\\t\\t\\t\\t\\treturn modules.core.disk.partition(arg.partition).setData(arg.data);\\n\\t\\t\\t\\t},\\n\\t\\t\\t\\tlldaList: async function() {\\n\\t\\t\\t\\t\\tif (!privileges.includes(\\\"LLDISK_LIST_PARTITIONS\\\")) throw new Error(\\\"UNAUTHORIZED_ACTION\\\");\\n\\t\\t\\t\\t\\treturn modules.core.disk.partitions();\\n\\t\\t\\t\\t},\\n\\t\\t\\t\\tlldaInitPartitions: async function() {\\n\\t\\t\\t\\t\\tif (!privileges.includes(\\\"LLDISK_INIT_PARTITIONS\\\")) throw new Error(\\\"UNAUTHORIZED_ACTION\\\");\\n\\t\\t\\t\\t\\treturn modules.core.disk.insertPartitionTable();\\n\\t\\t\\t\\t},\\n\\t\\t\\t\\tlldaRemove: async function(arg) {\\n\\t\\t\\t\\t\\tif (!privileges.includes(\\\"LLDISK_REMOVE\\\")) throw new Error(\\\"UNAUTHORIZED_ACTION\\\");\\n\\t\\t\\t\\t\\treturn modules.core.disk.partition(arg.partition).remove();\\n\\t\\t\\t\\t},\\n\\t\\t\\t\\tlldaIDBRead: async function(arg) {\\n\\t\\t\\t\\t\\tif (!privileges.includes(\\\"LLDISK_IDB_READ\\\")) throw new Error(\\\"UNAUTHORIZED_ACTION\\\");\\n\\t\\t\\t\\t\\treturn modules.core.idb.readPart(arg.key);\\n\\t\\t\\t\\t},\\n\\t\\t\\t\\tlldaIDBWrite: async function(arg) {\\n\\t\\t\\t\\t\\tif (!privileges.includes(\\\"LLDISK_IDB_WRITE\\\")) throw new Error(\\\"UNAUTHORIZED_ACTION\\\");\\n\\t\\t\\t\\t\\tawait modules.core.idb.writePart(arg.key, arg.value);\\n\\t\\t\\t\\t},\\n\\t\\t\\t\\tlldaIDBRemove: async function(arg) {\\n\\t\\t\\t\\t\\tif (!privileges.includes(\\\"LLDISK_IDB_REMOVE\\\")) throw new Error(\\\"UNAUTHORIZED_ACTION\\\");\\n\\t\\t\\t\\t\\tawait modules.core.idb.removePart(arg.key);\\n\\t\\t\\t\\t},\\n\\t\\t\\t\\tlldaIDBList: async function() {\\n\\t\\t\\t\\t\\tif (!privileges.includes(\\\"LLDISK_IDB_LIST\\\")) throw new Error(\\\"UNAUTHORIZED_ACTION\\\"); \\n\\t\\t\\t\\t\\treturn modules.core.idb.listParts(); \\n\\t\\t\\t\\t},\\n\\t\\t\\t\\tlldaIDBSync: async function() {\\n\\t\\t\\t\\t\\tif (!privileges.includes(\\\"LLDISK_IDB_SYNC\\\")) throw new Error(\\\"UNAUTHORIZED_ACTION\\\");\\n\\t\\t\\t\\t\\tawait modules.core.idb.sync();\\n\\t\\t\\t\\t},\\n\\t\\t\\t\\tfs_mount: async function(arg) {\\n\\t\\t\\t\\t\\tif (!privileges.includes(\\\"FS_MOUNT\\\")) throw new Error(\\\"UNAUTHORIZED_ACTION\\\");\\n\\t\\t\\t\\t\\tif (modules.fs.mounts[arg.mountpoint]) throw new Error(\\\"MOUNT_EXISTS\\\");\\n\\t\\t\\t\\t\\tmodules.fs.mounts[arg.mountpoint] = await modules.mounts[arg.filesystem](arg.filesystemOptions);\\n\\t\\t\\t\\t},\\n\\t\\t\\t\\tsupportedFilesystems: async function() {\\n\\t\\t\\t\\t\\tif (!privileges.includes(\\\"GET_FILESYSTEMS\\\")) throw new Error(\\\"UNAUTHORIZED_ACTION\\\");\\n\\t\\t\\t\\t\\treturn Object.keys(modules.mounts);\\n\\t\\t\\t\\t},\\n\\t\\t\\t\\tinstalledLocales: async function() {\\n\\t\\t\\t\\t\\tif (!privileges.includes(\\\"GET_LOCALE\\\")) throw new Error(\\\"UNAUTHORIZED_ACTION\\\");\\n\\t\\t\\t\\t\\treturn Object.keys(modules.locales).filter(a => a != \\\"get\\\" && a != \\\"defaultLocale\\\");\\n\\t\\t\\t\\t},\\n\\t\\t\\t\\trunningServer: async function() {\\n\\t\\t\\t\\t\\tif (!privileges.includes(\\\"GET_SERVER_URL\\\")) throw new Error(\\\"UNAUTHORIZED_ACTION\\\");\\n\\t\\t\\t\\t\\treturn location.origin;\\n\\t\\t\\t\\t},\\n\\t\\t\\t\\tfs_isDirectory: async function(arg) {\\n\\t\\t\\t\\t\\tif (!privileges.includes(\\\"FS_READ\\\")) throw new Error(\\\"UNAUTHORIZED_ACTION\\\");\\n\\t\\t\\t\\t\\tlet {path, token} = arg;\\n\\t\\t\\t\\t\\treturn await fs_action(\\\"isDirectory\\\", (fsPermissions) => fsPermissions.owner == user || fsPermissions.world.includes(\\\"r\\\") || groups.includes(fsPermissions.group) || privileges.includes(\\\"FS_BYPASS_PERMISSIONS\\\"), path, token || processToken);\\n\\t\\t\\t\\t},\\n\\t\\t\\t\\tautomatedLogonCreate: async function(arg) {\\n\\t\\t\\t\\t\\tlet { desiredUser, token } = arg;\\n\\t\\t\\t\\t\\tif (!privileges.includes(\\\"ELEVATE_PRIVILEGES\\\")) throw new Error(\\\"UNAUTHORIZED_ACTION\\\");\\n\\t\\t\\t\\t\\tlet automatedLogon = Array.from(crypto.getRandomValues(new Uint8Array(64))).reduce((a, b) => a + b.toString(16).padStart(2, \\\"0\\\"), \\\"\\\");\\n\\t\\t\\t\\t\\ttry {\\n\\t\\t\\t\\t\\t\\tlet access = await modules.users.access(desiredUser, token || processToken);\\n\\t\\t\\t\\t\\t\\taccess = await access.getNextPrompt();\\n\\t\\t\\t\\t\\t\\tautomatedLogonSessions[automatedLogon] = access;\\n\\t\\t\\t\\t\\t} catch {\\n\\t\\t\\t\\t\\t\\tthrow new Error(\\\"AUTOMATED_LOGON_CREATE_FAILED\\\")\\n\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t\\treturn automatedLogon;\\n\\t\\t\\t\\t},\\n\\t\\t\\t\\tautomatedLogonGet: async function(arg) {\\n\\t\\t\\t\\t\\tif (!privileges.includes(\\\"ELEVATE_PRIVILEGES\\\")) throw new Error(\\\"UNAUTHORIZED_ACTION\\\");\\n\\t\\t\\t\\t\\ttry {\\n\\t\\t\\t\\t\\t\\tlet sharedObj = { ...automatedLogonSessions[arg] };\\n\\t\\t\\t\\t\\t\\tdelete sharedObj.input;\\n\\t\\t\\t\\t\\t\\treturn sharedObj;\\n\\t\\t\\t\\t\\t} catch (e) {\\n\\t\\t\\t\\t\\t\\tthrow new Error(\\\"AUTOMATED_LOGON_GET_FAILED\\\");\\n\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t},\\n\\t\\t\\t\\tautomatedLogonInput: async function(arg) {\\n\\t\\t\\t\\t\\tlet { session, input } = arg;\\n\\t\\t\\t\\t\\tif (!privileges.includes(\\\"ELEVATE_PRIVILEGES\\\")) throw new Error(\\\"UNAUTHORIZED_ACTION\\\");\\n\\t\\t\\t\\t\\ttry {\\n\\t\\t\\t\\t\\t\\tautomatedLogonSessions[session] = await automatedLogonSessions[session].input(input);\\n\\t\\t\\t\\t\\t} catch {\\n\\t\\t\\t\\t\\t\\tthrow new Error(\\\"AUTOMATED_LOGON_INPUT_FAILED\\\");\\n\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t},\\n\\t\\t\\t\\tautomatedLogonDelete: async function(arg) {\\n\\t\\t\\t\\t\\tif (!privileges.includes(\\\"ELEVATE_PRIVILEGES\\\")) throw new Error(\\\"UNAUTHORIZED_ACTION\\\");\\n\\t\\t\\t\\t\\tdelete automatedLogonSessions[arg];\\n\\t\\t\\t\\t},\\n\\t\\t\\t\\tsetSystemMount: async function(arg) {\\n\\t\\t\\t\\t\\tif (!privileges.includes(\\\"SET_DEFAULT_SYSTEM\\\")) throw new Error(\\\"UNAUTHORIZED_ACTION\\\");\\n\\t\\t\\t\\t\\tmodules.defaultSystem = arg;\\n\\t\\t\\t\\t},\\n\\t\\t\\t\\tusedRAM: async function() {\\n\\t\\t\\t\\t\\tif (!privileges.includes(\\\"GET_SYSTEM_RESOURCES\\\")) throw new Error(\\\"UNAUTHORIZED_ACTION\\\");\\n\\t\\t\\t\\t\\ttry {\\n\\t\\t\\t\\t\\t\\tlet mem = performance.memory;\\n\\t\\t\\t\\t\\t\\treturn {\\n\\t\\t\\t\\t\\t\\t\\ttotal: mem.jsHeapSizeLimit,\\n\\t\\t\\t\\t\\t\\t\\tused: mem.usedJSHeapSize,\\n\\t\\t\\t\\t\\t\\t\\tfree: mem.jsHeapSizeLimit - mem.usedJSHeapSize\\n\\t\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t\\t} catch {}\\n\\t\\t\\t\\t\\tlet mem = await performance.measureUserAgentSpecificMemory();\\n\\t\\t\\t\\t\\treturn {\\n\\t\\t\\t\\t\\t\\ttotal: Infinity,\\n\\t\\t\\t\\t\\t\\tused: mem.bytes,\\n\\t\\t\\t\\t\\t\\tfree: Infinity\\n\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t},\\n\\t\\t\\t\\tcheckBootMode: async function() {\\n\\t\\t\\t\\t\\tif (!privileges.includes(\\\"GET_BOOT_MODE\\\")) throw new Error(\\\"UNAUTHORIZED_ACTION\\\");\\n\\t\\t\\t\\t\\treturn modules.core.bootMode || \\\"normal\\\";\\n\\t\\t\\t\\t},\\n\\t\\t\\t\\tgetScreenInfo: async function() {\\n\\t\\t\\t\\t\\tif (!privileges.includes(\\\"GET_SCREEN_INFO\\\")) throw new Error(\\\"UNAUTHORIZED_ACTION\\\");\\n\\t\\t\\t\\t\\treturn {\\n\\t\\t\\t\\t\\t\\twidth: document.documentElement.clientWidth,\\n\\t\\t\\t\\t\\t\\theight: document.documentElement.clientHeight,\\n\\t\\t\\t\\t\\t\\tcolorDepth: screen.colorDepth,\\n\\t\\t\\t\\t\\t\\torientation: {\\n\\t\\t\\t\\t\\t\\t\\ttype: screen.orientation.type,\\n\\t\\t\\t\\t\\t\\t\\tangle: screen.orientation.angle\\n\\t\\t\\t\\t\\t\\t},\\n\\t\\t\\t\\t\\t\\tfullWidth: screen.width,\\n\\t\\t\\t\\t\\t\\tfullHeight: screen.height,\\n\\t\\t\\t\\t\\t\\tavailWidth: screen.availWidth,\\n\\t\\t\\t\\t\\t\\tavailHeight: screen.availHeight,\\n\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t},\\n\\t\\t\\t\\twaitTermination: async function(arg) {\\n\\t\\t\\t\\t\\tif (!privileges.includes(\\\"LIST_TASKS\\\")) throw new Error(\\\"UNAUTHORIZED_ACTION\\\");\\n\\t\\t\\t\\t\\treturn modules.tasks.waitTermination(arg);\\n\\t\\t\\t\\t},\\n\\t\\t\\t\\tconsentGetToken: async function(params) {\\n\\t\\t\\t\\t\\tif (!privileges.includes(\\\"ELEVATE_PRIVILEGES\\\")) throw new Error(\\\"UNAUTHORIZED_ACTION\\\");\\n\\t\\t\\t\\t\\tif (modules.session.attrib(ses, \\\"secureLock\\\")) await modules.session.attrib(ses, \\\"secureLock\\\");\\n\\t\\t\\t\\t\\tif (modules.session.active != ses) throw new Error(\\\"TRY_AGAIN_LATER\\\");\\n\\t\\t\\t\\t\\tlet { desiredUser, intent } = params;\\n\\t\\t\\t\\t\\tif (!intent) throw new Error(\\\"INTENT_REQUIRED\\\");\\n\\t\\t\\t\\t\\tlet releaseLock;\\n\\t\\t\\t\\t\\tlet lock = new Promise((resolve) => releaseLock = resolve);\\n\\t\\t\\t\\t\\tmodules.session.attrib(ses, \\\"secureLock\\\", lock);\\n\\t\\t\\t\\t\\tlet secureSession = await modules.session.mksession();\\n\\t\\t\\t\\t\\tmodules.session.attrib(ses, \\\"secureID\\\", secureSession);\\n\\t\\t\\t\\t\\tmodules.session.attrib(secureSession, \\\"language\\\", language);\\n\\n\\t\\t\\t\\t\\tlet dom = modules.session.tracker[secureSession].html;\\n\\t\\t\\t\\t\\tlet ogDom = modules.session.tracker[ses].html;\\n\\t\\t\\t\\t\\tlet bgfx = document.createElement(\\\"div\\\");\\n\\t\\t\\t\\t\\tbgfx.classList.add(\\\"session\\\", \\\"secure\\\");\\n\\t\\t\\t\\t\\tdom.appendChild(bgfx);\\n\\t\\t\\t\\t\\tmodules.session.attrib(secureSession, \\\"dark\\\", modules.session.attrib(ses, \\\"dark\\\"));\\n\\t\\t\\t\\t\\tdom.style.background = ogDom.style.background;\\n\\t\\t\\t\\t\\tdom.style.backgroundSize = \\\"100% 100%\\\";\\n\\n\\t\\t\\t\\t\\tmodules.session.muteAllSessions();\\n\\t\\t\\t\\t\\tmodules.session.activateSession(secureSession);\\n\\t\\t\\t\\t\\tlet task = await modules.tasks.taskInfo(taskId);\\n\\n\\t\\t\\t\\t\\ttry {\\n\\t\\t\\t\\t\\t\\tlet logonUI = await modules.consentui(secureSession, {\\n\\t\\t\\t\\t\\t\\t\\tuser: desiredUser,\\n\\t\\t\\t\\t\\t\\t\\tpath: task.file,\\n\\t\\t\\t\\t\\t\\t\\targs: task.arg,\\n\\t\\t\\t\\t\\t\\t\\tintent,\\n\\t\\t\\t\\t\\t\\t\\tname: params.name\\n\\t\\t\\t\\t\\t\\t});\\n\\t\\t\\t\\t\\t\\treturn new Promise(function(resolve) {\\n\\t\\t\\t\\t\\t\\t\\tlogonUI.hook(async function(result) {\\n\\t\\t\\t\\t\\t\\t\\t\\treleaseLock();\\n\\t\\t\\t\\t\\t\\t\\t\\tmodules.session.attrib(ses, \\\"secureLock\\\", null);\\n\\t\\t\\t\\t\\t\\t\\t\\tmodules.session.attrib(ses, \\\"secureID\\\", null);\\n\\t\\t\\t\\t\\t\\t\\t\\tmodules.session.muteAllSessions();\\n\\t\\t\\t\\t\\t\\t\\t\\tmodules.session.rmsession(secureSession);\\n\\t\\t\\t\\t\\t\\t\\t\\tmodules.session.activateSession(ses);\\n\\t\\t\\t\\t\\t\\t\\t\\tif (result.success == false) return resolve(false);\\n\\t\\t\\t\\t\\t\\t\\t\\treturn resolve(result.token);\\n\\t\\t\\t\\t\\t\\t\\t});\\n\\t\\t\\t\\t\\t\\t});\\n\\t\\t\\t\\t\\t} catch (e) {\\n\\t\\t\\t\\t\\t\\tconsole.error(\\\"consentui:\\\", e);\\n\\t\\t\\t\\t\\t\\treleaseLock();\\n\\t\\t\\t\\t\\t\\tmodules.session.attrib(ses, \\\"secureLock\\\", null);\\n\\t\\t\\t\\t\\t\\tmodules.session.attrib(ses, \\\"secureID\\\", null);\\n\\t\\t\\t\\t\\t\\tmodules.session.muteAllSessions();\\n\\t\\t\\t\\t\\t\\tmodules.session.rmsession(secureSession);\\n\\t\\t\\t\\t\\t\\tmodules.session.activateSession(ses);\\n\\t\\t\\t\\t\\t\\treturn false;\\n\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t},\\n\\t\\t\\t\\tnetworkPing: async function(address) {\\n\\t\\t\\t\\t\\tif (!privileges.includes(\\\"PCOS_NETWORK_PING\\\")) throw new Error(\\\"UNAUTHORIZED_ACTION\\\");\\n\\t\\t\\t\\t\\tlet websocketHandle = modules.network.ws;\\n\\t\\t\\t\\t\\tif (!websocketHandle) throw new Error(\\\"NETWORK_UNREACHABLE\\\");\\n\\t\\t\\t\\t\\tlet websocket = modules.websocket._handles[websocketHandle].ws;\\n\\t\\t\\t\\t\\tif (websocket.readyState != 1) throw new Error(\\\"NETWORK_UNREACHABLE\\\");\\n\\t\\t\\t\\t\\treturn Promise.race([ new Promise(async function(resolve, reject) {\\n\\t\\t\\t\\t\\t\\tlet networkListenID = Array.from(crypto.getRandomValues(new Uint8Array(64))).map(a => a.toString(16).padStart(2, \\\"0\\\")).join(\\\"\\\");\\n\\t\\t\\t\\t\\t\\tlet packetId = Array.from(crypto.getRandomValues(new Uint8Array(32))).map(a => a.toString(16).padStart(2, \\\"0\\\")).join(\\\"\\\");\\n\\t\\t\\t\\t\\t\\tlet resend = Array.from(crypto.getRandomValues(new Uint8Array(32))).map(a => a.toString(16).padStart(2, \\\"0\\\")).join(\\\"\\\");\\n\\t\\t\\t\\t\\t\\tfunction eventListener(e) {\\n\\t\\t\\t\\t\\t\\t\\ttry {\\n\\t\\t\\t\\t\\t\\t\\t\\tlet packet = JSON.parse(e.data);\\n\\t\\t\\t\\t\\t\\t\\t\\tif (packet.packetID == packetId && packet.event == \\\"AddressUnreachable\\\") {\\n\\t\\t\\t\\t\\t\\t\\t\\t\\treject(new Error(\\\"ADDRESS_UNREACHABLE\\\"));\\n\\t\\t\\t\\t\\t\\t\\t\\t\\tdelete networkListens[networkListenID];\\n\\t\\t\\t\\t\\t\\t\\t\\t\\twebsocket.removeEventListener(\\\"message\\\", eventListener);\\n\\t\\t\\t\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t\\t\\t\\t\\tif (packet.from == address && packet.data.type == \\\"pong\\\" && packet.data.resend == resend) {\\n\\t\\t\\t\\t\\t\\t\\t\\t\\tresolve(\\\"success\\\");\\n\\t\\t\\t\\t\\t\\t\\t\\t\\tdelete networkListens[networkListenID];\\n\\t\\t\\t\\t\\t\\t\\t\\t\\twebsocket.removeEventListener(\\\"message\\\", eventListener);\\n\\t\\t\\t\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t\\t\\t\\t} catch {}\\n\\t\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t\\t\\tnetworkListens[networkListenID] = { ws: websocket, fn: eventListener };\\n\\t\\t\\t\\t\\t\\twebsocket.addEventListener(\\\"message\\\", eventListener);\\n\\t\\t\\t\\t\\t\\twebsocket.send(JSON.stringify({\\n\\t\\t\\t\\t\\t\\t\\treceiver: address,\\n\\t\\t\\t\\t\\t\\t\\tdata: {\\n\\t\\t\\t\\t\\t\\t\\t\\ttype: \\\"ping\\\",\\n\\t\\t\\t\\t\\t\\t\\t\\tresend: resend\\n\\t\\t\\t\\t\\t\\t\\t},\\n\\t\\t\\t\\t\\t\\t\\tid: packetId\\n\\t\\t\\t\\t\\t\\t}))\\n\\t\\t\\t\\t\\t}), new Promise((_, reject) => modules.network.runOnClose.then(_ => reject(new Error(\\\"NETWORK_CLOSED\\\")))) ]);\\n\\t\\t\\t\\t},\\n\\t\\t\\t\\tlogOut: async function(desiredUser) {\\n\\t\\t\\t\\t\\tif (desiredUser != user && !privileges.includes(\\\"LOGOUT_OTHERS\\\")) throw new Error(\\\"UNAUTHORIZED_ACTION\\\");\\n\\t\\t\\t\\t\\tif (desiredUser == user && !privileges.includes(\\\"LOGOUT\\\")) throw new Error(\\\"UNAUTHORIZED_ACTION\\\");\\n\\t\\t\\t\\t\\tif (modules.session.active != ses && !privileges.includes(\\\"LOGOUT_OTHERS\\\")) throw new Error(\\\"UNAUTHORIZED_ACTION\\\");\\n\\t\\t\\t\\t\\tawait modules.logOut(desiredUser);\\n\\t\\t\\t\\t},\\n\\t\\t\\t\\tlock: async function() {\\n\\t\\t\\t\\t\\tif (modules.session.active == ses && !privileges.includes(\\\"LOGOUT\\\")) throw new Error(\\\"UNAUTHORIZED_ACTION\\\");\\n\\t\\t\\t\\t\\tif (modules.session.active != ses && !privileges.includes(\\\"LOGOUT_OTHERS\\\")) throw new Error(\\\"UNAUTHORIZED_ACTION\\\");\\n\\t\\t\\t\\t\\tmodules.session.muteAllSessions();\\n\\t\\t\\t\\t\\tmodules.session.activateSession(modules.session.systemSession);\\n\\t\\t\\t\\t},\\n\\t\\t\\t\\tgetPrivateData: () => privateData,\\n\\t\\t\\t\\tlull: async function() {\\n\\t\\t\\t\\t\\tif (!privileges.includes(\\\"LULL_SYSTEM\\\")) throw new Error(\\\"UNAUTHORIZED_ACTION\\\");\\n\\t\\t\\t\\t\\tif (modules.session.active != ses && !privileges.includes(\\\"LULL_SYSTEM_FORCE\\\")) throw new Error(\\\"UNAUTHORIZED_ACTION\\\");\\n\\t\\t\\t\\t\\tawait modules.lull();\\n\\t\\t\\t\\t},\\n\\t\\t\\t\\tconnlessListen: async function(gate) {\\n\\t\\t\\t\\t\\tif (!privileges.includes(\\\"CONNLESS_LISTEN\\\")) throw new Error(\\\"UNAUTHORIZED_ACTION\\\");\\n\\t\\t\\t\\t\\tif (!gate.startsWith(\\\"user_\\\") && !privileges.includes(\\\"CONNLESS_LISTEN_GLOBAL\\\")) throw new Error(\\\"UNAUTHORIZED_ACTION\\\");\\n\\t\\t\\t\\t\\tlet websocketHandle = modules.network.ws;\\n\\t\\t\\t\\t\\tif (!websocketHandle) throw new Error(\\\"NETWORK_UNREACHABLE\\\");\\n\\t\\t\\t\\t\\tlet websocket = modules.websocket._handles[websocketHandle].ws;\\n\\t\\t\\t\\t\\tif (websocket.readyState != 1) throw new Error(\\\"NETWORK_UNREACHABLE\\\");\\n\\t\\t\\t\\t\\treturn Promise.race([ new Promise(async function(resolve) {\\n\\t\\t\\t\\t\\t\\tlet networkListenID = Array.from(crypto.getRandomValues(new Uint8Array(64))).map(a => a.toString(16).padStart(2, \\\"0\\\")).join(\\\"\\\");\\n\\t\\t\\t\\t\\t\\tfunction eventListener(e) {\\n\\t\\t\\t\\t\\t\\t\\ttry {\\n\\t\\t\\t\\t\\t\\t\\t\\tlet packet = JSON.parse(e.data);\\n\\t\\t\\t\\t\\t\\t\\t\\tif (packet.data.type == \\\"connectionless\\\" && packet.data.gate == gate) {\\n\\t\\t\\t\\t\\t\\t\\t\\t\\twebsocket.removeEventListener(\\\"message\\\", eventListener);\\n\\t\\t\\t\\t\\t\\t\\t\\t\\tdelete networkListens[networkListenID];\\n\\t\\t\\t\\t\\t\\t\\t\\t\\tresolve(packet);\\n\\t\\t\\t\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t\\t\\t\\t} catch {}\\n\\t\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t\\t\\tnetworkListens[networkListenID] = { ws: websocket, fn: eventListener };\\n\\t\\t\\t\\t\\t\\twebsocket.addEventListener(\\\"message\\\", eventListener);\\n\\t\\t\\t\\t\\t}), new Promise((_, reject) => modules.network.runOnClose.then(_ => reject(new Error(\\\"NETWORK_CLOSED\\\")))) ]);\\n\\t\\t\\t\\t},\\n\\t\\t\\t\\tconnlessSend: async function(sendOpts) {\\n\\t\\t\\t\\t\\tif (!privileges.includes(\\\"CONNLESS_SEND\\\")) throw new Error(\\\"UNAUTHORIZED_ACTION\\\");\\n\\t\\t\\t\\t\\tlet websocketHandle = modules.network.ws;\\n\\t\\t\\t\\t\\tif (!websocketHandle) throw new Error(\\\"NETWORK_UNREACHABLE\\\");\\n\\t\\t\\t\\t\\tlet websocket = modules.websocket._handles[websocketHandle].ws;\\n\\t\\t\\t\\t\\tif (websocket.readyState != 1) throw new Error(\\\"NETWORK_UNREACHABLE\\\");\\n\\t\\t\\t\\t\\tlet { gate, address, content } = sendOpts;\\n\\t\\t\\t\\t\\tlet packetId = Array.from(crypto.getRandomValues(new Uint8Array(32))).map(a => a.toString(16).padStart(2, \\\"0\\\")).join(\\\"\\\");\\n\\t\\t\\t\\t\\twebsocket.send(JSON.stringify({\\n\\t\\t\\t\\t\\t\\treceiver: address,\\n\\t\\t\\t\\t\\t\\tdata: {\\n\\t\\t\\t\\t\\t\\t\\ttype: \\\"connectionless\\\",\\n\\t\\t\\t\\t\\t\\t\\tgate: gate,\\n\\t\\t\\t\\t\\t\\t\\tcontent: content\\n\\t\\t\\t\\t\\t\\t},\\n\\t\\t\\t\\t\\t\\tid: packetId\\n\\t\\t\\t\\t\\t}));\\n\\t\\t\\t\\t\\treturn Promise.race([ new Promise(async function(resolve, reject) {\\n\\t\\t\\t\\t\\t\\tlet networkListenID = Array.from(crypto.getRandomValues(new Uint8Array(64))).map(a => a.toString(16).padStart(2, \\\"0\\\")).join(\\\"\\\");\\n\\t\\t\\t\\t\\t\\tfunction eventListener(e) {\\n\\t\\t\\t\\t\\t\\t\\ttry {\\n\\t\\t\\t\\t\\t\\t\\t\\tlet packet = JSON.parse(e.data);\\n\\t\\t\\t\\t\\t\\t\\t\\tif (packet.from) return;\\n\\t\\t\\t\\t\\t\\t\\t\\tif (packet.packetID == packetId) {\\n\\t\\t\\t\\t\\t\\t\\t\\t\\twebsocket.removeEventListener(\\\"message\\\", eventListener);\\n\\t\\t\\t\\t\\t\\t\\t\\t\\tdelete networkListens[networkListenID];\\n\\t\\t\\t\\t\\t\\t\\t\\t\\tif (packet.event == \\\"PacketPong\\\") return resolve(\\\"success\\\");\\n\\t\\t\\t\\t\\t\\t\\t\\t\\treject(new Error(\\\"ADDRESS_UNREACHABLE\\\"));\\n\\t\\t\\t\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t\\t\\t\\t} catch {}\\n\\t\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t\\t\\tnetworkListens[networkListenID] = { ws: websocket, fn: eventListener };\\n\\t\\t\\t\\t\\t\\twebsocket.addEventListener(\\\"message\\\", eventListener);\\n\\t\\t\\t\\t\\t}), new Promise((_, reject) => modules.network.runOnClose.then(_ => reject(new Error(\\\"NETWORK_CLOSED\\\")))) ]);\\n\\t\\t\\t\\t},\\n\\t\\t\\t\\tgetUsers: async function(token) {\\n\\t\\t\\t\\t\\tif (!privileges.includes(\\\"GET_USER_LIST\\\")) throw new Error(\\\"UNAUTHORIZED_ACTION\\\");\\n\\t\\t\\t\\t\\treturn await modules.users.getUsers(token || processToken);\\n\\t\\t\\t\\t},\\n\\t\\t\\t\\tgetNetworkAddress: async function() {\\n\\t\\t\\t\\t\\tif (!privileges.includes(\\\"GET_NETWORK_ADDRESS\\\")) throw new Error(\\\"UNAUTHORIZED_ACTION\\\");\\n\\t\\t\\t\\t\\treturn modules.network.address;\\n\\t\\t\\t\\t},\\n\\t\\t\\t\\tconnfulListen: async function(listenOpts) {\\n\\t\\t\\t\\t\\tif (!privileges.includes(\\\"CONNFUL_LISTEN\\\")) throw new Error(\\\"UNAUTHORIZED_ACTION\\\");\\n\\t\\t\\t\\t\\tlet {gate, key, private, verifyClientKeyChain} = listenOpts;\\n\\t\\t\\t\\t\\tif (!gate.startsWith(\\\"user_\\\") && !privileges.includes(\\\"CONNFUL_LISTEN_GLOBAL\\\")) throw new Error(\\\"UNAUTHORIZED_ACTION\\\");\\n\\t\\t\\t\\t\\tlet websocketHandle = modules.network.ws;\\n\\t\\t\\t\\t\\tif (!websocketHandle) throw new Error(\\\"NETWORK_UNREACHABLE\\\");\\n\\t\\t\\t\\t\\tlet websocket = modules.websocket._handles[websocketHandle].ws;\\n\\t\\t\\t\\t\\tif (websocket.readyState != 1) throw new Error(\\\"NETWORK_UNREACHABLE\\\");\\n\\t\\t\\t\\t\\tlet networkListenID = Array.from(crypto.getRandomValues(new Uint8Array(64))).map(a => a.toString(16).padStart(2, \\\"0\\\")).join(\\\"\\\");\\n\\t\\t\\t\\t\\tlet usableKey = await crypto.subtle.importKey(\\\"jwk\\\", private, {name: \\\"ECDSA\\\", namedCurve: \\\"P-256\\\"}, true, [\\\"sign\\\"]);\\n\\t\\t\\t\\t\\tlet hexToU8A = (hex) => Uint8Array.from(hex.match(/.{1,2}/g).map(a => parseInt(a, 16)));\\n\\t\\t\\t\\t\\tlet u8aToHex = (u8a) => Array.from(u8a).map(a => a.toString(16).padStart(2, \\\"0\\\")).join(\\\"\\\");\\n\\t\\t\\t\\t\\tlet _connectionBufferPromise = null;\\n\\t\\t\\t\\t\\tlet _connectionBufferReject = null;\\n\\t\\t\\t\\t\\tlet connectionBufferPromise = new Promise((r, j) => [_connectionBufferPromise, _connectionBufferReject] = [r, j]);\\n\\t\\t\\t\\t\\tasync function eventListener(e) {\\n\\t\\t\\t\\t\\t\\ttry {\\n\\t\\t\\t\\t\\t\\t\\tlet packet = JSON.parse(e.data);\\n\\t\\t\\t\\t\\t\\t\\tif (!packet.from) return;\\n\\t\\t\\t\\t\\t\\t\\tif (packet.data.type == \\\"connectionful\\\" && packet.data.gate == gate && packet.data.action == \\\"start\\\") {\\n\\t\\t\\t\\t\\t\\t\\t\\tif (!packet.data.connectionID) return;\\n\\t\\t\\t\\t\\t\\t\\t\\tif (connections[packet.data.connectionID + \\\":server\\\"]) return;\\n\\t\\t\\t\\t\\t\\t\\t\\tlet ephemeralKey = await crypto.subtle.generateKey({name: \\\"ECDH\\\", namedCurve: \\\"P-256\\\"}, true, [\\\"deriveBits\\\"]);\\n\\t\\t\\t\\t\\t\\t\\t\\tlet exported = await crypto.subtle.exportKey(\\\"jwk\\\", ephemeralKey.publicKey);\\n\\t\\t\\t\\t\\t\\t\\t\\texported = {signedBy: \\\"serverKey\\\", usages: [\\\"connfulSecureEphemeral\\\"], key:exported};\\n\\t\\t\\t\\t\\t\\t\\t\\tlet signature = u8aToHex(new Uint8Array(await crypto.subtle.sign({\\n\\t\\t\\t\\t\\t\\t\\t\\t\\tname: \\\"ECDSA\\\",\\n\\t\\t\\t\\t\\t\\t\\t\\t\\thash: \\\"SHA-256\\\"\\n\\t\\t\\t\\t\\t\\t\\t\\t}, usableKey, new TextEncoder().encode(JSON.stringify(exported)))));\\n\\t\\t\\t\\t\\t\\t\\t\\tlet theirUsableKey = await crypto.subtle.importKey(\\\"jwk\\\", packet.data.content.keyInfo.key, {\\n\\t\\t\\t\\t\\t\\t\\t\\t\\tname: \\\"ECDH\\\",\\n\\t\\t\\t\\t\\t\\t\\t\\t\\tnamedCurve: \\\"P-256\\\"\\n\\t\\t\\t\\t\\t\\t\\t\\t}, true, []);\\n\\t\\t\\t\\t\\t\\t\\t\\tlet joinedKeys = await crypto.subtle.deriveBits({ name: \\\"ECDH\\\", public: theirUsableKey }, ephemeralKey.privateKey, 256);\\n\\t\\t\\t\\t\\t\\t\\t\\tlet aesUsableKey = await crypto.subtle.importKey(\\\"raw\\\", joinedKeys, {name: \\\"AES-GCM\\\"}, true, [\\\"encrypt\\\", \\\"decrypt\\\"]);\\n\\t\\t\\t\\t\\t\\t\\t\\tlet _dataBufferPromise = null, _rejectDataPromise = null;\\n\\t\\t\\t\\t\\t\\t\\t\\tlet dataBufferPromise = new Promise((r, j) => [_dataBufferPromise, _rejectDataPromise] = [r, j]);\\n\\t\\t\\t\\t\\t\\t\\t\\tconnections[packet.data.connectionID + \\\":server\\\"] = {\\n\\t\\t\\t\\t\\t\\t\\t\\t\\tourKey: ephemeralKey,\\n\\t\\t\\t\\t\\t\\t\\t\\t\\tfrom: packet.from,\\n\\t\\t\\t\\t\\t\\t\\t\\t\\ttheirMainKeyReceived: false,\\n\\t\\t\\t\\t\\t\\t\\t\\t\\ttheirKeyRaw: packet.data.content,\\n\\t\\t\\t\\t\\t\\t\\t\\t\\taesUsableKey,\\n\\t\\t\\t\\t\\t\\t\\t\\t\\tdataBuffer: [],\\n\\t\\t\\t\\t\\t\\t\\t\\t\\tdataBufferPromise,\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t_dataBufferPromise,\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t_rejectDataPromise,\\n\\t\\t\\t\\t\\t\\t\\t\\t\\tnetworkListenID\\n\\t\\t\\t\\t\\t\\t\\t\\t}\\n\\n\\t\\t\\t\\t\\t\\t\\t\\twebsocket.send(JSON.stringify({\\n\\t\\t\\t\\t\\t\\t\\t\\t\\treceiver: packet.from,\\n\\t\\t\\t\\t\\t\\t\\t\\t\\tdata: {\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\ttype: \\\"connectionful\\\",\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\taction: \\\"start\\\",\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tcontent: {\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tkeyInfo: exported,\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tsignature\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t},\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tconnectionID: packet.data.connectionID\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t\\t\\t\\t\\t}));\\n\\t\\t\\t\\t\\t\\t\\t} else if (packet.data.type == \\\"connectionful\\\" && packet.data.gate == gate && packet.data.action == \\\"xchange\\\") {\\n\\t\\t\\t\\t\\t\\t\\t\\tif (!packet.data.connectionID) return;\\n\\t\\t\\t\\t\\t\\t\\t\\tif (!connections.hasOwnProperty(packet.data.connectionID + \\\":server\\\")) return;\\n\\t\\t\\t\\t\\t\\t\\t\\tif (connections[packet.data.connectionID + \\\":server\\\"].theirMainKeyReceived) return;\\n\\t\\t\\t\\t\\t\\t\\t\\tif (connections[packet.data.connectionID + \\\":server\\\"].dying) return;\\n\\t\\t\\t\\t\\t\\t\\t\\tlet theirMainKeyDecrypt = JSON.parse(new TextDecoder().decode(await crypto.subtle.decrypt({\\n\\t\\t\\t\\t\\t\\t\\t\\t\\tname: \\\"AES-GCM\\\",\\n\\t\\t\\t\\t\\t\\t\\t\\t\\tiv: hexToU8A(packet.data.content.iv),\\n\\t\\t\\t\\t\\t\\t\\t\\t}, connections[packet.data.connectionID + \\\":server\\\"].aesUsableKey, hexToU8A(packet.data.content.ct))));\\n\\t\\t\\t\\t\\t\\t\\t\\tlet usableMainKey = await crypto.subtle.importKey(\\\"jwk\\\", theirMainKeyDecrypt.keyInfo.key, {\\n\\t\\t\\t\\t\\t\\t\\t\\t\\tname: \\\"ECDSA\\\",\\n\\t\\t\\t\\t\\t\\t\\t\\t\\tnamedCurve: \\\"P-256\\\"\\n\\t\\t\\t\\t\\t\\t\\t\\t}, true, [\\\"verify\\\"]);\\n\\t\\t\\t\\t\\t\\t\\t\\tlet verifyKeySignature = await crypto.subtle.verify({\\n\\t\\t\\t\\t\\t\\t\\t\\t\\tname: \\\"ECDSA\\\",\\n\\t\\t\\t\\t\\t\\t\\t\\t\\thash: \\\"SHA-256\\\"\\n\\t\\t\\t\\t\\t\\t\\t\\t}, usableMainKey, hexToU8A(connections[packet.data.connectionID + \\\":server\\\"].theirKeyRaw.signature), new TextEncoder().encode(JSON.stringify(connections[packet.data.connectionID + \\\":server\\\"].theirKeyRaw.keyInfo)));\\n\\t\\t\\t\\t\\t\\t\\t\\tif (verifyClientKeyChain && verifyKeySignature) {\\n\\t\\t\\t\\t\\t\\t\\t\\t\\tverifyKeySignature = false;\\n\\t\\t\\t\\t\\t\\t\\t\\t\\ttry {\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tlet khrlFiles = await modules.fs.ls(modules.defaultSystem + \\\"/etc/keys/khrl\\\", processToken);\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tlet khrlSignatures = [];\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tfor (let khrlFile of khrlFiles) {\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tlet khrl = JSON.parse(await modules.fs.read(modules.defaultSystem + \\\"/etc/keys/khrl/\\\" + khrlFile, processToken));\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tlet khrlSignature = khrl.signature;\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tdelete khrl.signature;\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tif (await crypto.subtle.verify({\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tname: \\\"ECDSA\\\",\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\thash: {\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tname: \\\"SHA-256\\\"\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t}, modules.ksk_imported, hexToU8A(khrlSignature), new TextEncoder().encode(JSON.stringify(khrl.list)))) {\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tkhrlSignatures.push(...khrl.list);\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tverifyKeySignature = await recursiveKeyVerify(theirMainKeyDecrypt, khrlSignatures);\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t} catch {}\\n\\t\\t\\t\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t\\t\\t\\t\\tif (!verifyKeySignature || !theirMainKeyDecrypt.keyInfo.usages.includes(\\\"connfulSecureClient:\\\" + packet.from)) {\\n\\t\\t\\t\\t\\t\\t\\t\\t\\tdelete connections[packet.data.connectionID + \\\":server\\\"];\\n\\t\\t\\t\\t\\t\\t\\t\\t\\twebsocket.send(JSON.stringify({\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\treceiver: packet.from,\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tdata: {\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\ttype: \\\"connectionful\\\",\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\taction: \\\"drop\\\",\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tconnectionID: packet.data.connectionID\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t}));\\n\\t\\t\\t\\t\\t\\t\\t\\t\\treturn;\\n\\t\\t\\t\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t\\t\\t\\t\\tconnections[packet.data.connectionID + \\\":server\\\"].theirMainKeyReceived = theirMainKeyDecrypt;\\n\\t\\t\\t\\t\\t\\t\\t\\tlet iv = crypto.getRandomValues(new Uint8Array(16));\\n\\t\\t\\t\\t\\t\\t\\t\\twebsocket.send(JSON.stringify({\\n\\t\\t\\t\\t\\t\\t\\t\\t\\treceiver: packet.from,\\n\\t\\t\\t\\t\\t\\t\\t\\t\\tdata: {\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\ttype: \\\"connectionful\\\",\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\taction: \\\"xchange\\\",\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tcontent: {\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tiv: u8aToHex(iv),\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tct: u8aToHex(new Uint8Array(await crypto.subtle.encrypt({\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tname: \\\"AES-GCM\\\",\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tiv\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t}, connections[packet.data.connectionID + \\\":server\\\"].aesUsableKey, new TextEncoder().encode(JSON.stringify(key)))))\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t},\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tconnectionID: packet.data.connectionID\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t\\t\\t\\t\\t}));\\n\\t\\t\\t\\t\\t\\t\\t} else if (packet.data.type == \\\"connectionful\\\" && packet.data.gate == gate && packet.data.action == \\\"drop\\\") {\\n\\t\\t\\t\\t\\t\\t\\t\\tif (!packet.data.connectionID) return;\\n\\t\\t\\t\\t\\t\\t\\t\\tif (!connections.hasOwnProperty(packet.data.connectionID + \\\":server\\\")) return;\\n\\t\\t\\t\\t\\t\\t\\t\\tif (connections[packet.data.connectionID + \\\":server\\\"].dying) return;\\n\\t\\t\\t\\t\\t\\t\\t\\twebsocket.send(JSON.stringify({\\n\\t\\t\\t\\t\\t\\t\\t\\t\\treceiver: packet.from,\\n\\t\\t\\t\\t\\t\\t\\t\\t\\tdata: {\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\ttype: \\\"connectionful\\\",\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\taction: \\\"drop\\\",\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tconnectionID: packet.data.connectionID\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t\\t\\t\\t\\t}));\\n\\t\\t\\t\\t\\t\\t\\t\\tif (connections[packet.data.connectionID + \\\":server\\\"]._rejectDataPromise)\\n\\t\\t\\t\\t\\t\\t\\t\\t\\tconnections[packet.data.connectionID + \\\":server\\\"]._rejectDataPromise(new Error(\\\"CONNECTION_DROPPED\\\"));\\n\\t\\t\\t\\t\\t\\t\\t\\tconnections[packet.data.connectionID + \\\":server\\\"].dying = true;\\n\\t\\t\\t\\t\\t\\t\\t\\tif (!connections[packet.data.connectionID + \\\":server\\\"].dataBuffer.length)\\n\\t\\t\\t\\t\\t\\t\\t\\t\\tdelete connections[packet.data.connectionID + \\\":server\\\"];\\n\\t\\t\\t\\t\\t\\t\\t} else if (packet.data.type == \\\"connectionful\\\" && packet.data.gate == gate && packet.data.action == \\\"nice2meetu\\\") {\\n\\t\\t\\t\\t\\t\\t\\t\\tif (!packet.data.connectionID) return;\\n\\t\\t\\t\\t\\t\\t\\t\\tif (!connections.hasOwnProperty(packet.data.connectionID + \\\":server\\\")) return;\\n\\t\\t\\t\\t\\t\\t\\t\\tif (!connections[packet.data.connectionID + \\\":server\\\"].theirMainKeyReceived) return;\\n\\t\\t\\t\\t\\t\\t\\t\\tif (!connections[packet.data.connectionID + \\\":server\\\"].aesUsableKey) return;\\n\\t\\t\\t\\t\\t\\t\\t\\tif (connections[packet.data.connectionID + \\\":server\\\"].dying) return;\\n\\t\\t\\t\\t\\t\\t\\t\\tnetworkListens[networkListenID].connectionBuffer.push(packet.data.connectionID + \\\":server\\\");\\n\\t\\t\\t\\t\\t\\t\\t\\tlet _curcbp = _connectionBufferPromise;\\n\\t\\t\\t\\t\\t\\t\\t\\tconnectionBufferPromise = new Promise((r, j) => [_connectionBufferPromise, _connectionBufferReject] = [r, j]);\\n\\t\\t\\t\\t\\t\\t\\t\\tnetworkListens[networkListenID].connectionBufferPromise = connectionBufferPromise;\\n\\t\\t\\t\\t\\t\\t\\t\\t_curcbp();\\n\\t\\t\\t\\t\\t\\t\\t} else if (packet.data.type == \\\"connectionful\\\" && packet.data.gate == gate && packet.data.action == \\\"data\\\") {\\n\\t\\t\\t\\t\\t\\t\\t\\tif (!packet.data.connectionID) return;\\n\\t\\t\\t\\t\\t\\t\\t\\tif (!connections.hasOwnProperty(packet.data.connectionID + \\\":server\\\")) return;\\n\\t\\t\\t\\t\\t\\t\\t\\tif (!connections[packet.data.connectionID + \\\":server\\\"].aesUsableKey) return;\\n\\t\\t\\t\\t\\t\\t\\t\\tif (!connections[packet.data.connectionID + \\\":server\\\"].theirMainKeyReceived) return;\\n\\t\\t\\t\\t\\t\\t\\t\\tif (connections[packet.data.connectionID + \\\":server\\\"].dying) return;\\n\\t\\t\\t\\t\\t\\t\\t\\tif (connections[packet.data.connectionID + \\\":server\\\"].writingLock) await connections[packet.data.connectionID + \\\":server\\\"].writingLock;\\n\\t\\t\\t\\t\\t\\t\\t\\tlet writingLockRelease;\\n\\t\\t\\t\\t\\t\\t\\t\\tlet writingLock = new Promise(r => writingLockRelease = r);\\n\\t\\t\\t\\t\\t\\t\\t\\tconnections[packet.data.connectionID + \\\":server\\\"].writingLock = writingLock;\\n\\t\\t\\t\\t\\t\\t\\t\\tconnections[packet.data.connectionID + \\\":server\\\"].dataBuffer.push(new TextDecoder().decode(await crypto.subtle.decrypt({\\n\\t\\t\\t\\t\\t\\t\\t\\t\\tname: \\\"AES-GCM\\\",\\n\\t\\t\\t\\t\\t\\t\\t\\t\\tiv: hexToU8A(packet.data.content.iv)\\n\\t\\t\\t\\t\\t\\t\\t\\t}, connections[packet.data.connectionID + \\\":server\\\"].aesUsableKey, hexToU8A(packet.data.content.ct))));\\n\\t\\t\\t\\t\\t\\t\\t\\tif (!(connections[connID + \\\":server\\\"].dataBuffer.length - 1)) {\\n\\t\\t\\t\\t\\t\\t\\t\\t\\tlet _curdbp = connections[packet.data.connectionID + \\\":server\\\"].dataBufferPromise;\\n\\t\\t\\t\\t\\t\\t\\t\\t\\tlet _dataBufferPromise = null, _rejectDataPromise = null;\\n\\t\\t\\t\\t\\t\\t\\t\\t\\tlet dataBufferPromise = new Promise((r, e) => [_dataBufferPromise, _rejectDataPromise] = [r, e]);\\n\\t\\t\\t\\t\\t\\t\\t\\t\\tconnections[packet.data.connectionID + \\\":server\\\"].dataBufferPromise = dataBufferPromise;\\n\\t\\t\\t\\t\\t\\t\\t\\t\\tconnections[packet.data.connectionID + \\\":server\\\"]._dataBufferPromise = _dataBufferPromise;\\n\\t\\t\\t\\t\\t\\t\\t\\t\\tconnections[packet.data.connectionID + \\\":server\\\"]._rejectDataPromise = _rejectDataPromise;\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t_curdbp();\\n\\t\\t\\t\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t\\t\\t\\t\\twritingLockRelease();\\n\\t\\t\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t\\t\\t} catch {}\\n\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t\\tnetworkListens[networkListenID] = { ws: websocket, gate: gate, fn: eventListener, connectionBuffer: [], connectionBufferPromise }\\n\\t\\t\\t\\t\\tmodules.network.runOnClose.then(function() {\\n\\t\\t\\t\\t\\t\\tfor (let connectionID in connections) if (connections[connectionID].networkListenID == networkListenID) {\\n\\t\\t\\t\\t\\t\\t\\tconnections[connectionID].dying = true;\\n\\t\\t\\t\\t\\t\\t\\tconnections[connectionID]._rejectDataPromise(new Error(\\\"NETWORK_CLOSED\\\"));\\n\\t\\t\\t\\t\\t\\t\\tif (!connections[connectionID].dataBuffer.length) delete connections[connectionID];\\n\\t\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t\\t\\tdelete networkListens[networkListenID];\\n\\t\\t\\t\\t\\t\\t_connectionBufferReject(new Error(\\\"NETWORK_CLOSED\\\"));\\n\\t\\t\\t\\t\\t});\\n\\t\\t\\t\\t\\twebsocket.addEventListener(\\\"message\\\", eventListener);\\n\\t\\t\\t\\t\\treturn networkListenID;\\n\\t\\t\\t\\t},\\n\\t\\t\\t\\tconnfulListenConnections: async function(networkListenID) {\\n\\t\\t\\t\\t\\tif (!privileges.includes(\\\"CONNFUL_LISTEN\\\")) throw new Error(\\\"UNAUTHORIZED_ACTION\\\");\\n\\t\\t\\t\\t\\tif (!networkListens.hasOwnProperty(networkListenID)) throw new Error(\\\"INVALID_LISTEN_ID\\\");\\n\\t\\t\\t\\t\\tif (!networkListens[networkListenID].connectionBuffer.length) await networkListens[networkListenID].connectionBufferPromise;\\n\\t\\t\\t\\t\\tlet connectionID = networkListens[networkListenID].connectionBuffer[0];\\n\\t\\t\\t\\t\\tnetworkListens[networkListenID].connectionBuffer = networkListens[networkListenID].connectionBuffer.slice(1);\\n\\t\\t\\t\\t\\treturn connectionID;\\n\\t\\t\\t\\t},\\n\\t\\t\\t\\tgetBuildTime: function() {\\n\\t\\t\\t\\t\\tif (!privileges.includes(\\\"GET_BUILD\\\")) throw new Error(\\\"UNAUTHORIZED_ACTION\\\");\\n\\t\\t\\t\\t\\treturn modules.build_time;\\n\\t\\t\\t\\t},\\n\\t\\t\\t\\tconnfulConnect: async function(connOpts) {\\n\\t\\t\\t\\t\\tif (!privileges.includes(\\\"CONNFUL_CONNECT\\\")) throw new Error(\\\"UNAUTHORIZED_ACTION\\\");\\n\\t\\t\\t\\t\\tlet {address, gate, key, private, doNotVerifyServer, verifyByDomain} = connOpts;\\n\\t\\t\\t\\t\\tlet websocketHandle = modules.network.ws;\\n\\t\\t\\t\\t\\tif (!websocketHandle) throw new Error(\\\"NETWORK_UNREACHABLE\\\");\\n\\t\\t\\t\\t\\tlet websocket = modules.websocket._handles[websocketHandle].ws;\\n\\t\\t\\t\\t\\tif (websocket.readyState != 1) throw new Error(\\\"NETWORK_UNREACHABLE\\\");\\n\\t\\t\\t\\t\\tlet networkListenID = Array.from(crypto.getRandomValues(new Uint8Array(64))).map(a => a.toString(16).padStart(2, \\\"0\\\")).join(\\\"\\\");\\n\\t\\t\\t\\t\\tlet connID = crypto.getRandomValues(new Uint8Array(64)).reduce((a, b) => a + b.toString(16).padStart(2, \\\"0\\\"), \\\"\\\");\\n\\t\\t\\t\\t\\tlet hexToU8A = (hex) => Uint8Array.from(hex.match(/.{1,2}/g).map(a => parseInt(a, 16)));\\n\\t\\t\\t\\t\\tlet u8aToHex = (u8a) => Array.from(u8a).map(a => a.toString(16).padStart(2, \\\"0\\\")).join(\\\"\\\");\\n\\t\\t\\t\\t\\tlet newKeyKA, exportedKA;\\n\\t\\t\\t\\t\\tif (!key && !private) {\\n\\t\\t\\t\\t\\t\\tnewKeyKA = await crypto.subtle.generateKey({name: \\\"ECDSA\\\", namedCurve: \\\"P-256\\\"}, true, [\\\"sign\\\", \\\"verify\\\"]);\\n\\t\\t\\t\\t\\t\\texportedKA = await crypto.subtle.exportKey(\\\"jwk\\\", newKeyKA.publicKey);\\n\\t\\t\\t\\t\\t\\texportedKA = { keyInfo: { usages: [\\\"connfulSecureClient:\\\" + modules.network.address], key: exportedKA }, signature: null };\\n\\t\\t\\t\\t\\t\\tnewKeyKA = newKeyKA.privateKey;\\n\\t\\t\\t\\t\\t} else {\\n\\t\\t\\t\\t\\t\\tnewKeyKA = await crypto.subtle.importKey(\\\"jwk\\\", private, {name: \\\"ECDSA\\\", namedCurve: \\\"P-256\\\"}, true, [\\\"sign\\\"]);\\n\\t\\t\\t\\t\\t\\texportedKA = key;\\n\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t\\tlet ephemeralKey = await crypto.subtle.generateKey({name: \\\"ECDH\\\", namedCurve: \\\"P-256\\\"}, true, [\\\"deriveBits\\\"]);\\n\\t\\t\\t\\t\\tlet exported = await crypto.subtle.exportKey(\\\"jwk\\\", ephemeralKey.publicKey);\\n\\t\\t\\t\\t\\texported = { signedBy: \\\"clientKey\\\", usages: [\\\"connfulSecureEphemeral\\\"], key: exported };\\n\\t\\t\\t\\t\\tlet signature = u8aToHex(new Uint8Array(await crypto.subtle.sign({\\n\\t\\t\\t\\t\\t\\tname: \\\"ECDSA\\\",\\n\\t\\t\\t\\t\\t\\thash: \\\"SHA-256\\\"\\n\\t\\t\\t\\t\\t}, newKeyKA, new TextEncoder().encode(JSON.stringify(exported)))));\\n\\t\\t\\t\\t\\tlet _dataBufferPromise = null;\\n\\t\\t\\t\\t\\tlet _rejectDataPromise = null;\\n\\t\\t\\t\\t\\tlet dataBufferPromise = new Promise((r, e) => [_dataBufferPromise, _rejectDataPromise] = [r, e]);\\n\\t\\t\\t\\t\\tlet _settlePromise = null;\\n\\t\\t\\t\\t\\tlet _rejectPromise = null;\\n\\t\\t\\t\\t\\tlet settlePromise = new Promise((r, e) => [_settlePromise, _rejectPromise] = [r, e]);\\n\\t\\t\\t\\t\\tlet packetID = crypto.getRandomValues(new Uint8Array(32)).reduce((a, b) => a + b.toString(16).padStart(2, \\\"0\\\"), \\\"\\\");\\n\\t\\t\\t\\t\\tconnections[connID + \\\":client\\\"] = {\\n\\t\\t\\t\\t\\t\\tourKey: ephemeralKey,\\n\\t\\t\\t\\t\\t\\tfrom: address,\\n\\t\\t\\t\\t\\t\\ttheirMainKeyReceived: false,\\n\\t\\t\\t\\t\\t\\ttheirKeyRaw: null,\\n\\t\\t\\t\\t\\t\\taesUsableKey: null,\\n\\t\\t\\t\\t\\t\\tnetworkListenID,\\n\\t\\t\\t\\t\\t\\tdataBuffer: [],\\n\\t\\t\\t\\t\\t\\tdataBufferPromise,\\n\\t\\t\\t\\t\\t\\tsettlePromise,\\n\\t\\t\\t\\t\\t\\tgateIfNeeded: gate\\n\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t\\tasync function eventListener(e) {\\n\\t\\t\\t\\t\\t\\ttry {\\n\\t\\t\\t\\t\\t\\t\\tlet packet = JSON.parse(e.data);\\n\\t\\t\\t\\t\\t\\t\\tif (!packet.from) {\\n\\t\\t\\t\\t\\t\\t\\t\\tif (packet.event == \\\"AddressUnreachable\\\" && packet.packetID == packetID)\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t_rejectPromise(new Error(\\\"ADDRESS_UNREACHABLE\\\"));\\n\\t\\t\\t\\t\\t\\t\\t\\treturn;\\n\\t\\t\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t\\t\\t\\tif (packet.data.gate) return;\\n\\t\\t\\t\\t\\t\\t\\tif (packet.data.type == \\\"connectionful\\\" && packet.data.connectionID == connID && packet.data.action == \\\"start\\\") {\\n\\t\\t\\t\\t\\t\\t\\t\\tif (connections[connID + \\\":client\\\"].aesUsableKey) return;\\n\\t\\t\\t\\t\\t\\t\\t\\tlet theirUsableKey = await crypto.subtle.importKey(\\\"jwk\\\", packet.data.content.keyInfo.key, {\\n\\t\\t\\t\\t\\t\\t\\t\\t\\tname: \\\"ECDH\\\",\\n\\t\\t\\t\\t\\t\\t\\t\\t\\tnamedCurve: \\\"P-256\\\"\\n\\t\\t\\t\\t\\t\\t\\t\\t}, true, []);\\n\\t\\t\\t\\t\\t\\t\\t\\tlet joinedKeys = await crypto.subtle.deriveBits({\\n\\t\\t\\t\\t\\t\\t\\t\\t\\tname: \\\"ECDH\\\",\\n\\t\\t\\t\\t\\t\\t\\t\\t\\tpublic: theirUsableKey\\n\\t\\t\\t\\t\\t\\t\\t\\t}, ephemeralKey.privateKey, 256);\\n\\t\\t\\t\\t\\t\\t\\t\\tlet aesUsableKey = await crypto.subtle.importKey(\\\"raw\\\", joinedKeys, {\\n\\t\\t\\t\\t\\t\\t\\t\\t\\tname: \\\"AES-GCM\\\"\\n\\t\\t\\t\\t\\t\\t\\t\\t}, true, [\\\"encrypt\\\", \\\"decrypt\\\"]);\\n\\t\\t\\t\\t\\t\\t\\t\\tconnections[connID + \\\":client\\\"].aesUsableKey = aesUsableKey;\\n\\t\\t\\t\\t\\t\\t\\t\\tconnections[connID + \\\":client\\\"].theirKeyRaw = packet.data.content;\\n\\t\\t\\t\\t\\t\\t\\t\\tlet iv = crypto.getRandomValues(new Uint8Array(16));\\n\\t\\t\\t\\t\\t\\t\\t\\twebsocket.send(JSON.stringify({\\n\\t\\t\\t\\t\\t\\t\\t\\t\\treceiver: address,\\n\\t\\t\\t\\t\\t\\t\\t\\t\\tdata: {\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\ttype: \\\"connectionful\\\",\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\taction: \\\"xchange\\\",\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tconnectionID: connID,\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tcontent: {\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tiv: u8aToHex(iv),\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tct: u8aToHex(new Uint8Array(await crypto.subtle.encrypt({\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tname: \\\"AES-GCM\\\",\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tiv\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t}, aesUsableKey, new TextEncoder().encode(JSON.stringify(exportedKA)))))\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t},\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tgate\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t\\t\\t\\t\\t}));\\n\\t\\t\\t\\t\\t\\t\\t} else if (packet.data.type == \\\"connectionful\\\" && packet.data.connectionID == connID && packet.data.action == \\\"xchange\\\") {\\n\\t\\t\\t\\t\\t\\t\\t\\tif (connections[connID + \\\":client\\\"].theirMainKeyReceived) return;\\n\\t\\t\\t\\t\\t\\t\\t\\tlet theirMainKeyDecrypt = JSON.parse(new TextDecoder().decode(await crypto.subtle.decrypt({\\n\\t\\t\\t\\t\\t\\t\\t\\t\\tname: \\\"AES-GCM\\\",\\n\\t\\t\\t\\t\\t\\t\\t\\t\\tiv: hexToU8A(packet.data.content.iv)\\n\\t\\t\\t\\t\\t\\t\\t\\t}, connections[connID + \\\":client\\\"].aesUsableKey, hexToU8A(packet.data.content.ct))));\\n\\t\\t\\t\\t\\t\\t\\t\\tlet usableMainKey = await crypto.subtle.importKey(\\\"jwk\\\", theirMainKeyDecrypt.keyInfo.key, {name: \\\"ECDSA\\\", namedCurve: \\\"P-256\\\"}, true, [\\\"verify\\\"]);\\n\\t\\t\\t\\t\\t\\t\\t\\tlet verifyKeySignature = await crypto.subtle.verify({\\n\\t\\t\\t\\t\\t\\t\\t\\t\\tname: \\\"ECDSA\\\",\\n\\t\\t\\t\\t\\t\\t\\t\\t\\thash: \\\"SHA-256\\\"\\n\\t\\t\\t\\t\\t\\t\\t\\t}, usableMainKey, hexToU8A(connections[connID + \\\":client\\\"].theirKeyRaw.signature), new TextEncoder().encode(JSON.stringify(connections[connID + \\\":client\\\"].theirKeyRaw.keyInfo)));\\n\\t\\t\\t\\t\\t\\t\\t\\tif (!doNotVerifyServer && verifyKeySignature) {\\n\\t\\t\\t\\t\\t\\t\\t\\t\\ttry {\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tlet khrlFiles = await modules.fs.ls(modules.defaultSystem + \\\"/etc/keys/khrl\\\", processToken);\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tlet khrlSignatures = [];\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tfor (let khrlFile of khrlFiles) {\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tlet khrl = JSON.parse(await modules.fs.read(modules.defaultSystem + \\\"/etc/keys/khrl/\\\" + khrlFile, processToken));\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tlet khrlSignature = khrl.signature;\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tdelete khrl.signature;\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tif (await crypto.subtle.verify({\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tname: \\\"ECDSA\\\",\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\thash: {\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tname: \\\"SHA-256\\\"\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t}, modules.ksk_imported, hexToU8A(khrlSignature), new TextEncoder().encode(JSON.stringify(khrl.list)))) {\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tkhrlSignatures.push(...khrl.list);\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tverifyKeySignature = await recursiveKeyVerify(theirMainKeyDecrypt, khrlSignatures);\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t} catch {\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tverifyKeySignature = false;\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t\\t\\t\\t\\tif (!verifyKeySignature || (!theirMainKeyDecrypt.keyInfo.usages.includes(\\\"connfulSecureServer:\\\" + address) &&\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t!theirMainKeyDecrypt.keyInfo.usages.includes(\\\"connfulSecureServer:\\\" + verifyByDomain))) {\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t_rejectPromise(new Error(\\\"SERVER_SIGNATURE_VERIFICATION_FAILED\\\"));\\n\\t\\t\\t\\t\\t\\t\\t\\t\\twebsocket.removeEventListener(\\\"message\\\", eventListener);\\n\\t\\t\\t\\t\\t\\t\\t\\t\\tdelete connections[connID + \\\":client\\\"];\\n\\t\\t\\t\\t\\t\\t\\t\\t\\tdelete networkListens[networkListenID];\\n\\t\\t\\t\\t\\t\\t\\t\\t\\treturn websocket.send(JSON.stringify({\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\treceiver: address,\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tdata: {\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\ttype: \\\"connectionful\\\",\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\taction: \\\"drop\\\",\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tconnectionID: connID,\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tgate\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t}));\\n\\t\\t\\t\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t\\t\\t\\t\\tconnections[connID + \\\":client\\\"].theirMainKeyReceived = theirMainKeyDecrypt;\\n\\t\\t\\t\\t\\t\\t\\t\\twebsocket.send(JSON.stringify({\\n\\t\\t\\t\\t\\t\\t\\t\\t\\treceiver: address,\\n\\t\\t\\t\\t\\t\\t\\t\\t\\tdata: {\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\ttype: \\\"connectionful\\\",\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\taction: \\\"nice2meetu\\\",\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tconnectionID: connID,\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tgate\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t\\t\\t\\t\\t}));\\n\\t\\t\\t\\t\\t\\t\\t\\t_settlePromise();\\n\\t\\t\\t\\t\\t\\t\\t} else if (packet.data.type == \\\"connectionful\\\" && packet.data.connectionID == connID && packet.data.action == \\\"drop\\\") {\\n\\t\\t\\t\\t\\t\\t\\t\\tif (connections[connID + \\\":client\\\"].dying) return;\\n\\t\\t\\t\\t\\t\\t\\t\\t_rejectPromise(new Error(\\\"CONNECTION_DROPPED\\\"));\\n\\t\\t\\t\\t\\t\\t\\t\\tif (_rejectDataPromise) _rejectDataPromise(new Error(\\\"CONNECTION_DROPPED\\\"));\\n\\t\\t\\t\\t\\t\\t\\t\\twebsocket.send(JSON.stringify({\\n\\t\\t\\t\\t\\t\\t\\t\\t\\treceiver: address,\\n\\t\\t\\t\\t\\t\\t\\t\\t\\tdata: {\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\ttype: \\\"connectionful\\\",\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\taction: \\\"drop\\\",\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tconnectionID: connID,\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tgate\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t\\t\\t\\t\\t}));\\n\\t\\t\\t\\t\\t\\t\\t\\tconnections[connID + \\\":client\\\"].dying = true;\\n\\t\\t\\t\\t\\t\\t\\t\\twebsocket.removeEventListener(\\\"message\\\", eventListener);\\n\\t\\t\\t\\t\\t\\t\\t\\tdelete networkListens[networkListenID];\\n\\t\\t\\t\\t\\t\\t\\t\\tif (!connections[connID + \\\":client\\\"].dataBuffer.length) delete connections[connID + \\\":client\\\"];\\n\\t\\t\\t\\t\\t\\t\\t} else if (packet.data.type == \\\"connectionful\\\" && packet.data.connectionID == connID && packet.data.action == \\\"data\\\") {\\n\\t\\t\\t\\t\\t\\t\\t\\tif (!connections[connID + \\\":client\\\"].aesUsableKey) return;\\n\\t\\t\\t\\t\\t\\t\\t\\tif (!connections[connID + \\\":client\\\"].theirMainKeyReceived) return;\\n\\t\\t\\t\\t\\t\\t\\t\\tif (connections[connID + \\\":client\\\"].writingLock) await connections[connID + \\\":client\\\"].writingLock;\\n\\t\\t\\t\\t\\t\\t\\t\\tlet writingLockRelease;\\n\\t\\t\\t\\t\\t\\t\\t\\tlet writingLock = new Promise(r => writingLockRelease = r);\\n\\t\\t\\t\\t\\t\\t\\t\\tconnections[connID + \\\":client\\\"].writingLock = writingLock;\\n\\t\\t\\t\\t\\t\\t\\t\\tconnections[connID + \\\":client\\\"].dataBuffer.push(new TextDecoder().decode(await crypto.subtle.decrypt({\\n\\t\\t\\t\\t\\t\\t\\t\\t\\tname: \\\"AES-GCM\\\",\\n\\t\\t\\t\\t\\t\\t\\t\\t\\tiv: hexToU8A(packet.data.content.iv)\\n\\t\\t\\t\\t\\t\\t\\t\\t}, connections[connID + \\\":client\\\"].aesUsableKey, hexToU8A(packet.data.content.ct))));\\n\\t\\t\\t\\t\\t\\t\\t\\tif (!(connections[connID + \\\":client\\\"].dataBuffer.length - 1)) {\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t_dataBufferPromise();\\n\\t\\t\\t\\t\\t\\t\\t\\t\\tdataBufferPromise = new Promise((r, e) => [_dataBufferPromise, _rejectDataPromise] = [r, e]);\\n\\t\\t\\t\\t\\t\\t\\t\\t\\tconnections[packet.data.connectionID + \\\":client\\\"].dataBufferPromise = dataBufferPromise;\\n\\t\\t\\t\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t\\t\\t\\t\\twritingLockRelease();\\n\\t\\t\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t\\t\\t} catch {}\\n\\t\\t\\t\\t\\t};\\n\\t\\t\\t\\t\\tnetworkListens[networkListenID] = { ws: websocket, gate: gate, fn: eventListener };\\n\\t\\t\\t\\t\\twebsocket.addEventListener(\\\"message\\\", eventListener);\\n\\t\\t\\t\\t\\twebsocket.send(JSON.stringify({\\n\\t\\t\\t\\t\\t\\treceiver: address,\\n\\t\\t\\t\\t\\t\\tdata: {\\n\\t\\t\\t\\t\\t\\t\\ttype: \\\"connectionful\\\",\\n\\t\\t\\t\\t\\t\\t\\taction: \\\"start\\\",\\n\\t\\t\\t\\t\\t\\t\\tgate,\\n\\t\\t\\t\\t\\t\\t\\tconnectionID: connID,\\n\\t\\t\\t\\t\\t\\t\\tcontent: { keyInfo: exported, signature }\\n\\t\\t\\t\\t\\t\\t},\\n\\t\\t\\t\\t\\t\\tid: packetID\\n\\t\\t\\t\\t\\t}));\\n\\t\\t\\t\\t\\tmodules.network.runOnClose.then(function() {\\n\\t\\t\\t\\t\\t\\tif (connections.hasOwnProperty(connID + \\\":client\\\")) {\\n\\t\\t\\t\\t\\t\\t\\tconnections[connID + \\\":client\\\"].dying = true;\\n\\t\\t\\t\\t\\t\\t\\tif (!connections[connID + \\\":client\\\"].dataBuffer.length) delete connections[connID + \\\":client\\\"];\\n\\t\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t\\t\\tdelete networkListens[networkListenID];\\n\\t\\t\\t\\t\\t\\t_rejectPromise(new Error(\\\"NETWORK_CLOSED\\\"));\\n\\t\\t\\t\\t\\t\\t_rejectDataPromise(new Error(\\\"NETWORK_CLOSED\\\"));\\n\\t\\t\\t\\t\\t});\\n\\t\\t\\t\\t\\treturn connID + \\\":client\\\";\\n\\t\\t\\t\\t},\\n\\t\\t\\t\\tconnfulConnectionSettled: async function(connectionID) {\\n\\t\\t\\t\\t\\tif (!privileges.includes(\\\"CONNFUL_CONNECT\\\")) throw new Error(\\\"UNAUTHORIZED_ACTION\\\");\\n\\t\\t\\t\\t\\tif (!connections.hasOwnProperty(connectionID)) throw new Error(\\\"NO_SUCH_CONNECTION\\\");\\n\\t\\t\\t\\t\\tawait connections[connectionID].settlePromise;\\n\\t\\t\\t\\t},\\n\\t\\t\\t\\tconnfulDisconnect: async function(connectionID) {\\n\\t\\t\\t\\t\\tif (!privileges.includes(\\\"CONNFUL_DISCONNECT\\\")) throw new Error(\\\"UNAUTHORIZED_ACTION\\\");\\n\\t\\t\\t\\t\\tif (!connections.hasOwnProperty(connectionID)) throw new Error(\\\"NO_SUCH_CONNECTION\\\");\\n\\t\\t\\t\\t\\tif (connections[connectionID].dying) return;\\n\\t\\t\\t\\t\\tnetworkListens[connections[connectionID].networkListenID].ws.send(JSON.stringify({\\n\\t\\t\\t\\t\\t\\treceiver: connections[connectionID].from,\\n\\t\\t\\t\\t\\t\\tdata: {\\n\\t\\t\\t\\t\\t\\t\\ttype: \\\"connectionful\\\",\\n\\t\\t\\t\\t\\t\\t\\taction: \\\"drop\\\",\\n\\t\\t\\t\\t\\t\\t\\tconnectionID: connectionID.slice(0, -7),\\n\\t\\t\\t\\t\\t\\t\\tgate: connections[connectionID].gateIfNeeded\\n\\t\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t\\t}));\\n\\t\\t\\t\\t},\\n\\t\\t\\t\\tconnfulForceDisconnect: async function(connectionID) {\\n\\t\\t\\t\\t\\tif (!privileges.includes(\\\"CONNFUL_DISCONNECT\\\")) throw new Error(\\\"UNAUTHORIZED_ACTION\\\");\\n\\t\\t\\t\\t\\tdelete connections[connectionID];\\n\\t\\t\\t\\t},\\n\\t\\t\\t\\tconnfulWrite: async function(sendOpts) {\\n\\t\\t\\t\\t\\tif (!privileges.includes(\\\"CONNFUL_WRITE\\\")) throw new Error(\\\"UNAUTHORIZED_ACTION\\\");\\n\\t\\t\\t\\t\\tif (!connections.hasOwnProperty(sendOpts.connectionID)) throw new Error(\\\"NO_SUCH_CONNECTION\\\");\\n\\t\\t\\t\\t\\tif (connections[sendOpts.connectionID].dying) throw new Error(\\\"CONNECTION_DROPPED\\\");\\n\\t\\t\\t\\t\\tlet iv = crypto.getRandomValues(new Uint8Array(16));\\n\\t\\t\\t\\t\\tlet u8aToHex = (u8a) => Array.from(u8a).map(a => a.toString(16).padStart(2, \\\"0\\\")).join(\\\"\\\");\\n\\t\\t\\t\\t\\tnetworkListens[connections[sendOpts.connectionID].networkListenID].ws.send(JSON.stringify({\\n\\t\\t\\t\\t\\t\\treceiver: connections[sendOpts.connectionID].from,\\n\\t\\t\\t\\t\\t\\tdata: {\\n\\t\\t\\t\\t\\t\\t\\ttype: \\\"connectionful\\\",\\n\\t\\t\\t\\t\\t\\t\\taction: \\\"data\\\",\\n\\t\\t\\t\\t\\t\\t\\tcontent: {\\n\\t\\t\\t\\t\\t\\t\\t\\tiv: u8aToHex(iv),\\n\\t\\t\\t\\t\\t\\t\\t\\tct: u8aToHex(new Uint8Array(await crypto.subtle.encrypt({\\n\\t\\t\\t\\t\\t\\t\\t\\t\\tname: \\\"AES-GCM\\\",\\n\\t\\t\\t\\t\\t\\t\\t\\t\\tiv\\n\\t\\t\\t\\t\\t\\t\\t\\t}, connections[sendOpts.connectionID].aesUsableKey, new TextEncoder().encode(sendOpts.data))))\\n\\t\\t\\t\\t\\t\\t\\t},\\n\\t\\t\\t\\t\\t\\t\\tconnectionID: sendOpts.connectionID.slice(0, -7),\\n\\t\\t\\t\\t\\t\\t\\tgate: connections[sendOpts.connectionID].gateIfNeeded\\n\\t\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t\\t}));\\n\\t\\t\\t\\t},\\n\\t\\t\\t\\tconnfulRead: async function(connectionID) {\\n\\t\\t\\t\\t\\tif (!privileges.includes(\\\"CONNFUL_READ\\\")) throw new Error(\\\"UNAUTHORIZED_ACTION\\\");\\n\\t\\t\\t\\t\\tif (!connections.hasOwnProperty(connectionID)) throw new Error(\\\"NO_SUCH_CONNECTION\\\");\\n\\t\\t\\t\\t\\tif (!connections[connectionID].dataBuffer.length) await connections[connectionID].dataBufferPromise;\\n\\t\\t\\t\\t\\tlet data = connections[connectionID].dataBuffer.shift();\\n\\t\\t\\t\\t\\tif (connections[connectionID].dying && connections[connectionID].dataBuffer.length == 0) delete connections[connectionID]; \\n\\t\\t\\t\\t\\treturn data;\\n\\t\\t\\t\\t},\\n\\t\\t\\t\\tconnfulAddressGet: async function(connectionID) {\\n\\t\\t\\t\\t\\tif (!privileges.includes(\\\"CONNFUL_ADDRESS_GET\\\")) throw new Error(\\\"UNAUTHORIZED_ACTION\\\");\\n\\t\\t\\t\\t\\tif (!connections.hasOwnProperty(connectionID)) throw new Error(\\\"NO_SUCH_CONNECTION\\\");\\n\\t\\t\\t\\t\\treturn connections[connectionID].from;\\n\\t\\t\\t\\t},\\n\\t\\t\\t\\tconnfulIdentityGet: async function(connectionID) {\\n\\t\\t\\t\\t\\tif (!privileges.includes(\\\"CONNFUL_IDENTITY_GET\\\")) throw new Error(\\\"UNAUTHORIZED_ACTION\\\");\\n\\t\\t\\t\\t\\tif (!connections.hasOwnProperty(connectionID)) throw new Error(\\\"NO_SUCH_CONNECTION\\\");\\n\\t\\t\\t\\t\\treturn connections[connectionID].theirMainKeyReceived;\\n\\t\\t\\t\\t},\\n\\t\\t\\t\\tsystemUptime: async function() {\\n\\t\\t\\t\\t\\tif (!privileges.includes(\\\"SYSTEM_UPTIME\\\")) throw new Error(\\\"UNAUTHORIZED_ACTION\\\");\\n\\t\\t\\t\\t\\treturn Math.floor(performance.now());\\n\\t\\t\\t\\t},\\n\\t\\t\\t\\tnetworkRawWrite: function(data) {\\n\\t\\t\\t\\t\\tif (!privileges.includes(\\\"NETWORK_RAW_WRITE\\\")) throw new Error(\\\"UNAUTHORIZED_ACTION\\\");\\n\\t\\t\\t\\t\\tlet websocketHandle = modules.network.ws;\\n\\t\\t\\t\\t\\tif (!websocketHandle) throw new Error(\\\"NETWORK_UNREACHABLE\\\");\\n\\t\\t\\t\\t\\tlet websocket = modules.websocket._handles[websocketHandle].ws;\\n\\t\\t\\t\\t\\tif (websocket.readyState != 1) throw new Error(\\\"NETWORK_UNREACHABLE\\\");\\n\\t\\t\\t\\t\\twebsocket.send(data);\\n\\t\\t\\t\\t},\\n\\t\\t\\t\\tnetworkRawRead: function() {\\n\\t\\t\\t\\t\\tif (!privileges.includes(\\\"NETWORK_RAW_READ\\\")) throw new Error(\\\"UNAUTHORIZED_ACTION\\\");\\n\\t\\t\\t\\t\\tlet websocketHandle = modules.network.ws;\\n\\t\\t\\t\\t\\tif (!websocketHandle) throw new Error(\\\"NETWORK_UNREACHABLE\\\");\\n\\t\\t\\t\\t\\tlet websocket = modules.websocket._handles[websocketHandle].ws;\\n\\t\\t\\t\\t\\tif (websocket.readyState != 1) throw new Error(\\\"NETWORK_UNREACHABLE\\\");\\n\\t\\t\\t\\t\\treturn Promise.race([ new Promise(async function(resolve) {\\n\\t\\t\\t\\t\\t\\tnetworkListens[networkListenID] = { ws: websocket, fn: _ => resolve(_.data) };\\n\\t\\t\\t\\t\\t\\twebsocket.addEventListener(\\\"message\\\", eventListener);\\n\\t\\t\\t\\t\\t}), new Promise((_, reject) => modules.network.runOnClose.then(_ => reject(new Error(\\\"NETWORK_CLOSED\\\")))) ]);\\n\\t\\t\\t\\t},\\n\\t\\t\\t\\tgetHostname: async function() {\\n\\t\\t\\t\\t\\tif (!privileges.includes(\\\"GET_HOSTNAME\\\")) throw new Error(\\\"UNAUTHORIZED_ACTION\\\");\\n\\t\\t\\t\\t\\treturn modules.network.hostname;\\n\\t\\t\\t\\t},\\n\\t\\t\\t\\tresolve: async function(name) {\\n\\t\\t\\t\\t\\tif (!privileges.includes(\\\"RESOLVE_NAME\\\")) throw new Error(\\\"UNAUTHORIZED_ACTION\\\");\\n\\t\\t\\t\\t\\tlet websocketHandle = modules.network.ws;\\n\\t\\t\\t\\t\\tif (!websocketHandle) throw new Error(\\\"NETWORK_UNREACHABLE\\\");\\n\\t\\t\\t\\t\\tlet websocket = modules.websocket._handles[websocketHandle].ws;\\n\\t\\t\\t\\t\\tif (websocket.readyState != 1) throw new Error(\\\"NETWORK_UNREACHABLE\\\");\\n\\t\\t\\t\\t\\tlet tlds = JSON.parse(await modules.fs.read(modules.defaultSystem + \\\"/etc/tlds.json\\\"));\\n\\t\\t\\t\\t\\tfunction resolveRecursive(name, address) {\\n\\t\\t\\t\\t\\t\\tif (tlds.hasOwnProperty(name)) return tlds[name];\\n\\t\\t\\t\\t\\t\\tif (address == null) return null;\\n\\t\\t\\t\\t\\t\\treturn new Promise(function(resolve) {\\n\\t\\t\\t\\t\\t\\t\\tlet gate = \\\"user_\\\" + Array.from(crypto.getRandomValues(new Uint8Array(16))).map(a => a.toString(16).padStart(2, \\\"0\\\")).join(\\\"\\\");\\n\\t\\t\\t\\t\\t\\t\\tlet networkListenID = Array.from(crypto.getRandomValues(new Uint8Array(64))).map(a => a.toString(16).padStart(2, \\\"0\\\")).join(\\\"\\\");\\n\\t\\t\\t\\t\\t\\t\\tfunction eventListener(e) {\\n\\t\\t\\t\\t\\t\\t\\t\\ttry {\\n\\t\\t\\t\\t\\t\\t\\t\\t\\tlet packet = JSON.parse(e.data);\\n\\t\\t\\t\\t\\t\\t\\t\\t\\tif (packet.data.type == \\\"connectionless\\\" && packet.data.gate == gate && packet.from == address) {\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\twebsocket.removeEventListener(\\\"message\\\", eventListener);\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tdelete networkListens[networkListenID];\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tresolve(packet.data.content);\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t\\t\\t\\t\\t} catch {}\\n\\t\\t\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t\\t\\t\\tnetworkListens[networkListenID] = { ws: websocket, fn: eventListener };\\n\\t\\t\\t\\t\\t\\t\\twebsocket.addEventListener(\\\"message\\\", eventListener);\\n\\t\\t\\t\\t\\t\\t\\twebsocket.send(JSON.stringify({\\n\\t\\t\\t\\t\\t\\t\\t\\treceiver: address,\\n\\t\\t\\t\\t\\t\\t\\t\\tdata: {\\n\\t\\t\\t\\t\\t\\t\\t\\t\\ttype: \\\"connectionless\\\",\\n\\t\\t\\t\\t\\t\\t\\t\\t\\tgate: \\\"resolve\\\",\\n\\t\\t\\t\\t\\t\\t\\t\\t\\tcontent: {\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\treply: gate,\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tquery: name\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t\\t\\t\\t}));\\n\\t\\t\\t\\t\\t\\t});\\n\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t\\tlet nameParts = name.split(\\\".\\\").reverse();\\n\\t\\t\\t\\t\\tlet currentResolve;\\n\\t\\t\\t\\t\\tfor (let part = 0; part < nameParts.length; part++) currentResolve = await resolveRecursive(nameParts.slice(0, part + 1).reverse().join(\\\".\\\"), currentResolve);\\n\\t\\t\\t\\t\\treturn currentResolve;\\n\\t\\t\\t\\t},\\n\\t\\t\\t\\tpatchDiff: function(libraryOptions) {\\n\\t\\t\\t\\t\\tif (!privileges.includes(\\\"PATCH_DIFF\\\")) throw new Error(\\\"UNAUTHORIZED_ACTION\\\");\\n\\t\\t\\t\\t\\tif (!window.diff) throw new Error(\\\"MODULE_REQUIRED\\\");\\n\\t\\t\\t\\t\\tlet operations = { diff_core, diff, lcs, calcPatch, applyPatch, calcSlices };\\n\\t\\t\\t\\t\\treturn [ ...operations[libraryOptions.operation](...libraryOptions.args) ];\\n\\t\\t\\t\\t},\\n\\t\\t\\t\\tsetFirmware: async function(new_flash) {\\n\\t\\t\\t\\t\\tif (!privileges.includes(\\\"SET_FIRMWARE\\\")) throw new Error(\\\"UNAUTHORIZED_ACTION\\\");\\n\\t\\t\\t\\t\\tif (modules.core.setFW) {\\n\\t\\t\\t\\t\\t\\tawait modules.core.setFW(new_flash);\\n\\t\\t\\t\\t\\t\\treturn;\\n\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t\\tlocalStorage.setItem(\\\"runtime_flash\\\", new_flash);\\n\\t\\t\\t\\t},\\n\\t\\t\\t\\treloadNetworkConfig: async function() {\\n\\t\\t\\t\\t\\tif (!privileges.includes(\\\"RELOAD_NETWORK_CONFIG\\\")) throw new Error(\\\"UNAUTHORIZED_ACTION\\\");\\n\\t\\t\\t\\t\\tawait modules.network.reloadConfig();\\n\\t\\t\\t\\t},\\n\\t\\t\\t\\tbatteryStatus: async function() {\\n\\t\\t\\t\\t\\tif (!privileges.includes(\\\"GET_BATTERY_STATUS\\\")) throw new Error(\\\"UNAUTHORIZED_ACTION\\\");\\n\\t\\t\\t\\t\\tlet battery = await navigator.getBattery();\\n\\t\\t\\t\\t\\treturn {\\n\\t\\t\\t\\t\\t\\tcharging: battery.charging,\\n\\t\\t\\t\\t\\t\\tlevel: battery.level,\\n\\t\\t\\t\\t\\t\\tchargingTime: battery.chargingTime,\\n\\t\\t\\t\\t\\t\\tdischargingTime: battery.dischargingTime\\n\\t\\t\\t\\t\\t};\\n\\t\\t\\t\\t},\\n\\t\\t\\t\\tgetUpdateService: async function() {\\n\\t\\t\\t\\t\\tif (!privileges.includes(\\\"GET_UPDATE_SERVICE\\\")) throw new Error(\\\"UNAUTHORIZED_ACTION\\\");\\n\\t\\t\\t\\t\\treturn modules.network.updates;\\n\\t\\t\\t\\t}\\n\\t\\t\\t}\\n\\t\\t}\\n\\t\\tlet customAPIs = modules.customAPIs;\\n\\t\\tif (customAPIs) {\\n\\t\\t\\tfor (let api in (customAPIs.public || {})) apis.public[api] = async (...args) => customAPIs.public[api](processToken, ...args);\\n\\t\\t\\tfor (let api in (customAPIs.private || {})) apis.private[api] = async (...args) => customAPIs.private[api](processToken, ...args);\\n\\t\\t}\\n\\t\\treturn apis;\\n\\t}\\n}\\nreeAPIs();\",\"4b5a88ba528b1c16f9a959c58a657adfb5784c005a224700c60a0834467e3114be4fe5deac305fa5243cfcf52bdabca6a59f4ae615a1998da4dcd4281ffd9781\":\"function loadBasicCSP() {\\n\\tmodules.csps = {};\\n\\tlet cryptoKeys = {};\\n\\tfunction cryptoKeyIntoKeyObject(ck, groupBy) {\\n\\t\\tif (ck.privateKey && ck.publicKey) return {\\n\\t\\t\\tprivateKey: cryptoKeyIntoKeyObject(ck.privateKey, groupBy),\\n\\t\\t\\tpublicKey: cryptoKeyIntoKeyObject(ck.publicKey, groupBy),\\n\\t\\t};\\n\\t\\tlet keyID = crypto.getRandomValues(new Uint8Array(64)).reduce((a, b) => a + b.toString(16).padStart(2, \\\"0\\\"), \\\"\\\");\\n\\t\\tif (!cryptoKeys.hasOwnProperty(groupBy)) cryptoKeys[groupBy] = {};\\n\\t\\tcryptoKeys[groupBy][keyID] = ck;\\n\\t\\treturn {\\n\\t\\t\\ttype: ck.type,\\n\\t\\t\\textractable: ck.extractable,\\n\\t\\t\\talgorithm: ck.algorithm,\\n\\t\\t\\tusages: ck.usages,\\n\\t\\t\\tkeyID: keyID\\n\\t\\t}\\n\\t}\\n\\tmodules.csps.basic = {\\n\\t\\tcspMetadata: function() {\\n\\t\\t\\treturn {\\n\\t\\t\\t\\tname: \\\"Basic Cryptographic Provider\\\",\\n\\t\\t\\t\\tversion: modules.pcos_version,\\n\\t\\t\\t\\tdeveloper: \\\"PCsoft\\\",\\n\\t\\t\\t\\tfeatures: Object.keys(modules.csps.basic)\\n\\t\\t\\t}\\n\\t\\t},\\n\\t\\trandom: async function(typedArray) {\\n\\t\\t\\treturn crypto.getRandomValues(typedArray);\\n\\t\\t},\\n\\t\\timportKey: async function(arg, groupBy) {\\n\\t\\t\\treturn cryptoKeyIntoKeyObject(await crypto.subtle.importKey(arg.format, arg.keyData, arg.algorithm, arg.extractable, arg.keyUsages), groupBy);\\n\\t\\t},\\n\\t\\tgenerateKey: async function(arg, groupBy) {\\n\\t\\t\\treturn cryptoKeyIntoKeyObject(await crypto.subtle.generateKey(arg.algorithm, arg.extractable, arg.keyUsages), groupBy);\\n\\t\\t},\\n\\t\\tderiveBits: async function(arg, groupBy) {\\n\\t\\t\\targ.baseKey = cryptoKeys[groupBy][arg.baseKey.keyID];\\n\\t\\t\\tif (arg.algorithm.public) arg.algorithm.public = cryptoKeys[groupBy][arg.algorithm.public.keyID];\\n\\t\\t\\treturn crypto.subtle.deriveBits(arg.algorithm, arg.baseKey, arg.length);\\n\\t\\t},\\n\\t\\tderiveKey: async function(arg, groupBy) {\\n\\t\\t\\targ.baseKey = cryptoKeys[groupBy][arg.baseKey.keyID];\\n\\t\\t\\tif (arg.algorithm.public) arg.algorithm.public = cryptoKeys[groupBy][arg.algorithm.public.keyID];\\n\\t\\t\\treturn cryptoKeyIntoKeyObject(await crypto.subtle.deriveKey(arg.algorithm, arg.baseKey, arg.derivedKeyType, arg.extractable, arg.keyUsages), groupBy);\\n\\t\\t},\\n\\t\\twrapKey: async function(arg, groupBy) {\\n\\t\\t\\targ.key = cryptoKeys[groupBy][arg.key.keyID];\\n\\t\\t\\targ.wrappingKey = cryptoKeys[groupBy][arg.wrappingKey.keyID];\\n\\t\\t\\treturn crypto.subtle.wrapKey(arg.format, arg.key, arg.wrappingKey, arg.wrapAlgo);\\n\\t\\t},\\n\\t\\tdigest: async function(arg) {\\n\\t\\t\\treturn crypto.subtle.digest(arg.algorithm, arg.data);\\n\\t\\t},\\n\\t\\tencrypt: async function(arg, groupBy) {\\n\\t\\t\\targ.key = cryptoKeys[groupBy][arg.key.keyID];\\n\\t\\t\\treturn crypto.subtle.encrypt(arg.algorithm, arg.key, arg.data);\\n\\t\\t},\\n\\t\\tsign: async function(arg, groupBy) {\\n\\t\\t\\targ.key = cryptoKeys[groupBy][arg.key.keyID];\\n\\t\\t\\treturn crypto.subtle.sign(arg.algorithm, arg.key, arg.data);\\n\\t\\t},\\n\\t\\texportKey: async function(arg, groupBy) {\\n\\t\\t\\targ.key = cryptoKeys[groupBy][arg.key.keyID];\\n\\t\\t\\treturn crypto.subtle.exportKey(arg.format, arg.key);\\n\\t\\t},\\n\\t\\tunwrapKey: async function(arg, groupBy) {\\n\\t\\t\\targ.unwrappingKey = cryptoKeys[groupBy][arg.unwrappingKey.keyID];\\n\\t\\t\\treturn cryptoKeyIntoKeyObject(await crypto.subtle.unwrapKey(arg.format, arg.keyData, arg.unwrappingKey, arg.unwrapAlgo, arg.unwrappedKeyAlgo, arg.extractable, arg.keyUsages), groupBy);\\n\\t\\t},\\n\\t\\tdecrypt: async function(arg, groupBy) {\\n\\t\\t\\targ.key = cryptoKeys[groupBy][arg.key.keyID];\\n\\t\\t\\treturn crypto.subtle.decrypt(arg.algorithm, arg.key, arg.data);\\n\\t\\t},\\n\\t\\tverify: async function(arg, groupBy) {\\n\\t\\t\\targ.key = cryptoKeys[groupBy][arg.key.keyID];\\n\\t\\t\\treturn crypto.subtle.verify(arg.algorithm, arg.key, arg.signature, arg.data);\\n\\t\\t},\\n\\t\\tunloadKey: (key, groupBy) => delete cryptoKeys[groupBy][key.keyID],\\n\\t\\tremoveSameGroupKeys: (_, groupBy) => delete cryptoKeys[groupBy]\\n\\t}\\n\\tif (window.nacl) {\\n\\t\\tmodules.csps.tweetnacl = {\\n\\t\\t\\tcspMetadata: function() {\\n\\t\\t\\t\\treturn {\\n\\t\\t\\t\\t\\tname: \\\"TweetNaCl Cryptographic Provider\\\",\\n\\t\\t\\t\\t\\tversion: \\\"1.0.3\\\",\\n\\t\\t\\t\\t\\tdeveloper: \\\"TweetNaCl.js developers (https://github.com/dchest/tweetnacl-js)\\\",\\n\\t\\t\\t\\t\\tfeatures: Object.keys(modules.csps.tweetnacl)\\n\\t\\t\\t\\t}\\n\\t\\t\\t},\\n\\t\\t\\trandom: typedArray => nacl.randomBytes(typedArray.length),\\n\\t\\t\\tgenerateKey: type => nacl[type].keyPair(),\\n\\t\\t\\tderiveKey: arg => nacl[arg.type].keyPair.fromSeed(arg.seed),\\n\\t\\t\\tdigest: message => nacl.hash(message),\\n\\t\\t\\tencrypt: arg => nacl[arg.type](arg.message, arg.nonce, arg.key1, arg.key2),\\n\\t\\t\\tsign: arg => nacl.sign.detached(arg.message, arg.secretKey),\\n\\t\\t\\tdecrypt: arg => nacl[arg.type].open(arg.box, arg.nonce, arg.key1, arg.key2),\\n\\t\\t\\tverify: arg => nacl.sign.detached.verify(arg.message, arg.signature, arg.publicKey)\\n\\t\\t};\\n\\t}\\n}\\nloadBasicCSP();\",\"76c4bdee8948e4db3fcc1a93d15bfa1d29a1392f7244ab249f407e395d8825dcf075b64bd50b63c97aaaf30b281fe3d9dd86ad477dd1253f5f9b56329ec929cc\":\"function localization() {\\n\\t// @pcos-app-mode native\\n\\tlet locales = {\\n        get: function(key, lang) {\\n\\t\\t\\tlang = lang || locales.defaultLocale || navigator.languages[0].split(\\\"-\\\")[0].toLowerCase();\\n\\t\\t\\tlet locale = locales[lang];\\n\\t\\t\\tif (!locale) locale = locales[locales.defaultLocale];\\n\\t\\t\\tif (!locale) locale = {};\\n\\t\\t\\tif (!locale.hasOwnProperty(key)) locale = locales.en;\\n\\t\\t\\treturn locale.hasOwnProperty(key) ? locale[key] : key;\\n\\t\\t}\\n\\t}\\n\\tmodules.locales = locales;\\n}\\nlocalization();\",\"b46eb66300751861a7cc384c4e900e7ef937cbadc7c019b7f006eff51dcda0ed3d9e083fee1958a25c10fa9ee2006bb5085fc1c3c0c973e345a4f752c831bf33\":\"function loadTasks() {\\n\\t// @pcos-app-mode native\\n\\tmodules.startupWindow.content.innerText = modules.locales.get(\\\"PCOS_STARTING\\\");\\n\\tlet tasks = {\\n\\t\\texec: async function(file, arg, windowObject, token, silent, privateData) {\\n\\t\\t\\tlet errorAudio = new Audio();\\n\\t\\t\\ttry {\\n\\t\\t\\t\\tlet errorSoundPerm = await modules.fs.permissions(modules.defaultSystem + \\\"/etc/sounds/error.aud\\\", token);\\n\\t\\t\\t\\tif (!errorSoundPerm.world.includes(\\\"r\\\")) throw new Error(\\\"Not allowed to read error.aud\\\");\\n\\t\\t\\t\\tlet errorSound = await modules.fs.read(modules.defaultSystem + \\\"/etc/sounds/error.aud\\\", token);\\n\\t\\t\\t\\terrorAudio.src = errorSound;\\n\\t\\t\\t} catch {}\\n\\t\\t\\tif (modules.session.attrib(windowObject.sessionId, \\\"loggingOut\\\")) throw new Error(\\\"LOGGING_OUT\\\");\\n\\t\\t\\tlet language = modules.session.attrib(windowObject.sessionId, \\\"language\\\") || undefined;\\n\\t\\t\\tif (modules.shuttingDown) {\\n\\t\\t\\t\\twindowObject.windowDiv.remove();\\n\\t\\t\\t\\tthrow new Error(\\\"SYSTEM_SHUTDOWN_REQUESTED\\\");\\n\\t\\t\\t}\\n\\t\\t\\tlet appRedirecting = {};\\n\\t\\t\\ttry {\\n\\t\\t\\t\\tappRedirecting = JSON.parse(await this.fs.read(modules.defaultSystem + \\\"/etc/appRedir\\\", token));\\n\\t\\t\\t} catch {}\\n\\t\\t\\tif (modules.core.bootMode == \\\"safe\\\") appRedirecting = {};\\n\\t\\t\\tif (appRedirecting.hasOwnProperty(file)) file = appRedirecting[file];\\n\\t\\t\\twindowObject.title.innerText = modules.locales.get(\\\"UNTITLED_APP\\\", language);\\n\\t\\t\\twindowObject.content.innerText = \\\"\\\";\\n\\t\\t\\twindowObject.content.style = \\\"\\\";\\n\\t\\t\\tlet taskId = crypto.getRandomValues(new Uint8Array(64)).reduce((a, b) => a + b.toString(16).padStart(2, \\\"0\\\"), \\\"\\\");\\n\\t\\t\\tlet executablePermissions, executable;\\n\\t\\t\\ttry {\\n\\t\\t\\t\\texecutablePermissions = await this.fs.permissions(file, token);\\n\\t\\t\\t\\texecutable = await this.fs.read(file, token);\\n\\t\\t\\t} catch (e) {\\n\\t\\t\\t\\twindowObject.title.innerText = modules.locales.get(\\\"APP_STARTUP_CRASH_TITLE\\\", language);\\n\\t\\t\\t\\twindowObject.content.innerText = modules.locales.get(\\\"APP_STARTUP_CRASH\\\", language);\\n\\t\\t\\t\\twindowObject.content.style.padding = \\\"8px\\\";\\n\\t\\t\\t\\twindowObject.closeButton.disabled = false;\\n\\t\\t\\t\\twindowObject.closeButton.onclick = (e) => windowObject.windowDiv.remove() && e.stopPropagation();\\n\\t\\t\\t\\tif (silent) windowObject.windowDiv.remove();\\n\\t\\t\\t\\tif (!silent) errorAudio.play();\\n\\t\\t\\t\\tthrow e;\\n\\t\\t\\t}\\n\\t\\t\\tif (!executablePermissions.world.includes(\\\"r\\\") || !executablePermissions.world.includes(\\\"x\\\")) {\\n\\t\\t\\t\\twindowObject.title.innerText = modules.locales.get(\\\"PERMISSION_DENIED\\\", language);\\n\\t\\t\\t\\twindowObject.content.innerText = modules.locales.get(\\\"MORE_PERMISSION_DENIED\\\", language);\\n\\t\\t\\t\\twindowObject.content.style.padding = \\\"8px\\\";\\n\\t\\t\\t\\twindowObject.closeButton.disabled = false;\\n\\t\\t\\t\\twindowObject.closeButton.onclick = (e) => windowObject.windowDiv.remove() && e.stopPropagation();\\n\\t\\t\\t\\tif (silent) windowObject.windowDiv.remove();\\n\\t\\t\\t\\tif (!silent) errorAudio.play();\\n\\t\\t\\t\\tthrow new Error(\\\"MORE_PERMISSION_DENIED\\\", language);\\n\\t\\t\\t}\\n\\t\\t\\tif (!executable.includes(\\\"// @pcos-app-mode isolat\\\" + \\\"able\\\")) {\\n\\t\\t\\t\\twindowObject.title.innerText = modules.locales.get(\\\"COMPATIBILITY_ISSUE_TITLE\\\", language);\\n\\t\\t\\t\\twindowObject.content.innerText = modules.locales.get(\\\"COMPATIBILITY_ISSUE\\\", language);\\n\\t\\t\\t\\twindowObject.content.style.padding = \\\"8px\\\";\\n\\t\\t\\t\\twindowObject.closeButton.disabled = false;\\n\\t\\t\\t\\twindowObject.closeButton.onclick = (e) => windowObject.windowDiv.remove() && e.stopPropagation();\\n\\t\\t\\t\\tif (silent) windowObject.windowDiv.remove();\\n\\t\\t\\t\\tif (!silent) errorAudio.play();\\n\\t\\t\\t\\tthrow new Error(\\\"COMPATIBILITY_ISSUE\\\");\\n\\t\\t\\t}\\n\\t\\t\\tlet appHardening = {overridable:true};\\n\\t\\t\\ttry {\\n\\t\\t\\t\\tappHardening = JSON.parse(await this.fs.read(modules.defaultSystem + \\\"/etc/appHarden\\\", token));\\n\\t\\t\\t} catch {}\\n\\t\\t\\tlet disableHarden = appHardening.overridable && modules.core.bootMode == \\\"disable-harden\\\";\\n\\t\\t\\tif (disableHarden) appHardening = {overridable:true};\\n\\t\\t\\tlet limitations = [];\\n\\t\\t\\tlet execSignature = {};\\n\\t\\t\\tif (executable.includes(\\\"// =====BEGIN MANIFEST=====\\\")) {\\n\\t\\t\\t\\tlet parsingLines = executable.split(\\\"\\\\n\\\");\\n\\t\\t\\t\\tlet parsingBoundStart = parsingLines.indexOf(\\\"// =====BEGIN MANIFEST=====\\\");\\n\\t\\t\\t\\tlet parsingBoundEnd = parsingLines.indexOf(\\\"// =====END MANIFEST=====\\\");\\n\\t\\t\\t\\tlet upToParse = parsingLines.slice(parsingBoundStart, parsingBoundEnd + 1);\\n\\t\\t\\t\\tlet knownLineTypes = [\\\"allow\\\", \\\"deny\\\"];\\n\\t\\t\\t\\tfor (let line of upToParse) {\\n\\t\\t\\t\\t\\tlet lineType = line.split(\\\": \\\")[0].replace(\\\"// \\\", \\\"\\\");\\n\\t\\t\\t\\t\\tlet lineData = line.replace(\\\"// \\\" + lineType + \\\": \\\", \\\"\\\");\\n\\t\\t\\t\\t\\tif (lineType == \\\"signature\\\") {\\n\\t\\t\\t\\t\\t\\texecSignature.signature = lineData;\\n\\t\\t\\t\\t\\t\\texecutable = executable.replace(line + \\\"\\\\n\\\", \\\"\\\");\\n\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t\\tif (lineType == \\\"signer\\\") execSignature.signer = lineData;\\n\\t\\t\\t\\t\\tif (lineType == \\\"asck\\\") execSignature.selfContainedSigner = lineData;\\n\\t\\t\\t\\t\\tif (knownLineTypes.includes(lineType)) {\\n\\t\\t\\t\\t\\t\\tlet dataParts = lineData.split(\\\", \\\");\\n\\t\\t\\t\\t\\t\\tfor (let data of dataParts) limitations.push({ lineType, data });\\n\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t}\\n\\t\\t\\t}\\n\\t\\t\\tif (disableHarden) limitations = [];\\n\\t\\t\\tlet hexToU8A = (hex) => Uint8Array.from(hex.match(/.{1,2}/g).map(a => parseInt(a, 16)));\\n\\t\\t\\tlet u8aToHex = (u8a) => Array.from(u8a).map(a => a.toString(16).padStart(2, \\\"0\\\")).join(\\\"\\\");\\n\\t\\t\\tif (!limitations.some(lim => lim.lineType == \\\"allow\\\") && appHardening.requireAllowlist && !disableHarden) {\\n\\t\\t\\t\\twindowObject.title.innerText = modules.locales.get(\\\"PERMISSION_DENIED\\\", language);\\n\\t\\t\\t\\twindowObject.content.innerText = modules.locales.get(\\\"NO_APP_ALLOWLIST\\\", language);\\n\\t\\t\\t\\twindowObject.content.style.padding = \\\"8px\\\";\\n\\t\\t\\t\\twindowObject.closeButton.disabled = false;\\n\\t\\t\\t\\twindowObject.closeButton.onclick = (e) => windowObject.windowDiv.remove() && e.stopPropagation();\\n\\t\\t\\t\\tif (silent) windowObject.windowDiv.remove();\\n\\t\\t\\t\\tif (!silent) errorAudio.play();\\n\\t\\t\\t\\tthrow new Error(\\\"NO_APP_ALLOWLIST\\\");\\n\\t\\t\\t}\\n\\n\\t\\t\\tasync function recursiveKeyVerify(key, khrl) {\\n\\t\\t\\t\\tif (!key) throw new Error(\\\"NO_KEY\\\");\\n\\t\\t\\t\\tlet hash = u8aToHex(new Uint8Array(await crypto.subtle.digest(\\\"SHA-256\\\", new TextEncoder().encode((key.keyInfo?.key || key.key).x + \\\"|\\\" + (key.keyInfo?.key || key.key).y))));\\n\\t\\t\\t\\tif (khrl.includes(hash)) throw new Error(\\\"KEY_REVOKED\\\");\\n\\t\\t\\t\\tlet signedByKey = modules.ksk_imported;\\n\\t\\t\\t\\tif (key.keyInfo && key.keyInfo?.signedBy) {\\n\\t\\t\\t\\t\\tsignedByKey = JSON.parse(await modules.fs.read(modules.defaultSystem + \\\"/etc/keys/\\\" + key.keyInfo.signedBy, token));\\n\\t\\t\\t\\t\\tif (!signedByKey.keyInfo) throw new Error(\\\"NOT_KEYS_V2\\\");\\n\\t\\t\\t\\t\\tif (!signedByKey.keyInfo.usages.includes(\\\"keyTrust\\\")) throw new Error(\\\"NOT_KEY_AUTHORITY\\\");\\n\\t\\t\\t\\t\\tawait recursiveKeyVerify(signedByKey, khrl);\\n\\t\\t\\t\\t\\tsignedByKey = await crypto.subtle.importKey(\\\"jwk\\\", signedByKey.keyInfo.key, {\\n\\t\\t\\t\\t\\t\\tname: \\\"ECDSA\\\",\\n\\t\\t\\t\\t\\t\\tnamedCurve: \\\"P-256\\\"\\n\\t\\t\\t\\t\\t}, false, [\\\"verify\\\"]);\\n\\t\\t\\t\\t}\\n\\t\\t\\t\\tif (!await crypto.subtle.verify({\\n\\t\\t\\t\\t\\tname: \\\"ECDSA\\\",\\n\\t\\t\\t\\t\\thash: {\\n\\t\\t\\t\\t\\t\\tname: \\\"SHA-256\\\"\\n\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t}, signedByKey, hexToU8A(key.signature), new TextEncoder().encode(JSON.stringify(key.key || key.keyInfo)))) throw new Error(\\\"KEY_SIGNATURE_VERIFICATION_FAILED\\\");\\n\\t\\t\\t\\treturn true;\\n\\t\\t\\t}\\n\\n\\t\\t\\tif ((execSignature.signer || appHardening.requireSignature || execSignature.selfContainedSigner) && !disableHarden) {\\n\\t\\t\\t\\ttry {\\n\\t\\t\\t\\t\\tlet khrlFiles = await this.fs.ls(modules.defaultSystem + \\\"/etc/keys/khrl\\\", token);\\n\\t\\t\\t\\t\\tlet khrlSignatures = [];\\n\\t\\t\\t\\t\\tfor (let khrlFile of khrlFiles) {\\n\\t\\t\\t\\t\\t\\tlet khrl = JSON.parse(await this.fs.read(modules.defaultSystem + \\\"/etc/keys/khrl/\\\" + khrlFile, token));\\n\\t\\t\\t\\t\\t\\tlet khrlSignature = khrl.signature;\\n\\t\\t\\t\\t\\t\\tdelete khrl.signature;\\n\\t\\t\\t\\t\\t\\tif (await crypto.subtle.verify({\\n\\t\\t\\t\\t\\t\\t\\tname: \\\"ECDSA\\\",\\n\\t\\t\\t\\t\\t\\t\\thash: {\\n\\t\\t\\t\\t\\t\\t\\t\\tname: \\\"SHA-256\\\"\\n\\t\\t\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t\\t\\t}, modules.ksk_imported, hexToU8A(khrlSignature), new TextEncoder().encode(JSON.stringify(khrl.list)))) {\\n\\t\\t\\t\\t\\t\\t\\tkhrlSignatures.push(...khrl.list);\\n\\t\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t\\tlet signingKey = JSON.parse(execSignature.selfContainedSigner || \\\"null\\\");\\n\\t\\t\\t\\t\\tif (!signingKey || appHardening.disableASCK) signingKey = JSON.parse(await this.fs.read(modules.defaultSystem + \\\"/etc/keys/\\\" + execSignature.signer, token));\\n\\t\\t\\t\\t\\tawait recursiveKeyVerify(signingKey, khrlSignatures);\\n\\t\\t\\t\\t\\tif (signingKey.keyInfo) if (!signingKey.keyInfo.usages.includes(\\\"appTrust\\\")) throw new Error(\\\"NOT_APP_SIGNING_KEY\\\");\\n\\t\\t\\t\\t\\tlet importSigningKey = await crypto.subtle.importKey(\\\"jwk\\\", signingKey.keyInfo?.key || signingKey.key, {\\n\\t\\t\\t\\t\\t\\tname: \\\"ECDSA\\\",\\n\\t\\t\\t\\t\\t\\tnamedCurve: \\\"P-256\\\"\\n\\t\\t\\t\\t\\t}, false, [\\\"verify\\\"]);\\n\\t\\t\\t\\t\\tif (!await crypto.subtle.verify({\\n\\t\\t\\t\\t\\t\\tname: \\\"ECDSA\\\",\\n\\t\\t\\t\\t\\t\\thash: {\\n\\t\\t\\t\\t\\t\\t\\tname: \\\"SHA-256\\\"\\n\\t\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t\\t}, importSigningKey, hexToU8A(execSignature.signature), new TextEncoder().encode(executable))) throw new Error(\\\"APP_SIGNATURE_VERIFICATION_FAILED\\\");\\n\\t\\t\\t\\t} catch (e) {\\n\\t\\t\\t\\t\\tconsole.error(\\\"Failed to verify app signature:\\\", e);\\n\\t\\t\\t\\t\\twindowObject.title.innerText = modules.locales.get(\\\"PERMISSION_DENIED\\\", language);\\n\\t\\t\\t\\t\\twindowObject.content.innerText = modules.locales.get(\\\"SIGNATURE_VERIFICATION_FAILED\\\", language).replace(\\\"%s\\\", execSignature.signer || modules.locales.get(\\\"UNKNOWN_PLACEHOLDER\\\", language));\\n\\t\\t\\t\\t\\twindowObject.content.style.padding = \\\"8px\\\";\\n\\t\\t\\t\\t\\twindowObject.closeButton.disabled = false;\\n\\t\\t\\t\\t\\twindowObject.closeButton.onclick = (e) => windowObject.windowDiv.remove() && e.stopPropagation();\\n\\t\\t\\t\\t\\tif (silent) windowObject.windowDiv.remove();\\n\\t\\t\\t\\t\\tif (!silent) errorAudio.play();\\n\\t\\t\\t\\t\\tthrow new Error(\\\"APP_OR_KEY_SIGNATURE_VERIFICATION_FAILED\\\");\\n\\t\\t\\t\\t}\\n\\t\\t\\t}\\n\\t\\t\\tlet ree = await this.ree(windowObject.content, token);\\n\\t\\t\\ttry {\\n\\t\\t\\t\\tmodules.session.attrib(windowObject.sessionId, \\\"openReeWindows\\\", [ ...(modules.session.attrib(windowObject.sessionId, \\\"openReeWindows\\\") || []), taskId ]);\\n\\t\\t\\t\\targ = arg || [];\\n\\t\\t\\t\\tif (!(arg instanceof Array)) arg = [];\\n\\t\\t\\t\\targ = arg.map(a => String(a));\\n\\t\\t\\t\\tlet that = this;\\n\\t\\t\\t\\tree.iframe.style = \\\"width: 100%; height: 100%; border: none; top: 0; left: 0; position: absolute;\\\";\\n\\t\\t\\t\\tlet reeAPIInstance = await modules.reeAPIInstance({ ree, ses: windowObject.sessionId, token, taskId, limitations, privateData });\\n\\t\\t\\t\\tfor (let action in reeAPIInstance.public) ree.exportAPI(action, (e) => reeAPIInstance.public[action](e.arg));\\n\\t\\t\\t\\tthis.tracker[taskId] = {\\n\\t\\t\\t\\t\\tree,\\n\\t\\t\\t\\t\\tfile: file,\\n\\t\\t\\t\\t\\targ: arg,\\n\\t\\t\\t\\t\\tapis: reeAPIInstance,\\n\\t\\t\\t\\t\\tcritical: false,\\n\\t\\t\\t\\t\\tcliio: {\\n\\t\\t\\t\\t\\t\\tattached: false,\\n\\t\\t\\t\\t\\t\\tattachedCLISignUp: function() {\\n\\t\\t\\t\\t\\t\\t\\treturn new Promise(a => attachedCLIRegistrations.push(a));\\n\\t\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t};\\n\\t\\t\\t\\tlet registrations = [];\\n\\t\\t\\t\\tlet attachedCLIRegistrations = [];\\n\\t\\t\\t\\tlet cliCache = [];\\n\\t\\t\\t\\twindowObject.closeButton.addEventListener(\\\"click\\\", () => that.sendSignal(taskId, 15));\\n\\t\\t\\t\\tree.exportAPI(\\\"attachCLI\\\", async function() {\\n\\t\\t\\t\\t\\tif (that.tracker[taskId].cliio.attached) return true;\\n\\t\\t\\t\\t\\tif (!window.Terminal) return false;\\n\\t\\t\\t\\t\\tfor (let registration of attachedCLIRegistrations) registration();\\n\\t\\t\\t\\t\\tattachedCLIRegistrations = [];\\n\\t\\t\\t\\t\\tlet signup = () => new Promise((resolve) => registrations.push(resolve));\\n\\t\\t\\t\\t\\tree.iframe.hidden = true;\\n\\t\\t\\t\\t\\tlet termDiv = document.createElement(\\\"div\\\");\\n\\t\\t\\t\\t\\ttermDiv.style = \\\"position: absolute; top: 0; left: 0; width: 100%; height: 100%;\\\";\\n\\t\\t\\t\\t\\tlet fitAddon = new FitAddon.FitAddon();\\n\\t\\t\\t\\t\\tlet termInstance = new Terminal();\\n\\t\\t\\t\\t\\ttermInstance.loadAddon(fitAddon);\\n\\t\\t\\t\\t\\ttermInstance.open(termDiv);\\n\\t\\t\\t\\t\\twindowObject.content.appendChild(termDiv);\\n\\t\\t\\t\\t\\tthat.tracker[taskId].cliio.attached = true;\\n\\t\\t\\t\\t\\tthat.tracker[taskId].cliio.xtermInstance = termInstance;\\n\\t\\t\\t\\t\\tlet onresizeFn = () => fitAddon.fit();\\n\\t\\t\\t\\t\\tonresizeFn();\\n\\t\\t\\t\\t\\tlet robs = new ResizeObserver(onresizeFn);\\n\\t\\t\\t\\t\\tthat.tracker[taskId].cliio.robsInstance = robs;\\n\\t\\t\\t\\t\\trobs.observe(windowObject.windowDiv);\\n\\t\\t\\t\\t\\tthat.tracker[taskId].cliio.signup = signup;\\n\\t\\t\\t\\t\\tthat.tracker[taskId].cliio.xtermInstance.onData(e => cliCache.push(e));\\n\\t\\t\\t\\t\\ttermInstance.clear();\\n\\t\\t\\t\\t\\tawait new Promise((resolve) => setTimeout(resolve, 8));\\n\\t\\t\\t\\t\\treturn true;  \\n\\t\\t\\t\\t});\\n\\t\\t\\t\\tree.exportAPI(\\\"toMyCLI\\\", async function(apiArg) {\\n\\t\\t\\t\\t\\tif (that.tracker[taskId].cliio.attached) {\\n\\t\\t\\t\\t\\t\\tthat.tracker[taskId].cliio.xtermInstance.write(apiArg.arg);\\n\\t\\t\\t\\t\\t\\tfor (let registered in registrations) {\\n\\t\\t\\t\\t\\t\\t\\tawait registrations[registered]({ type: \\\"write\\\", data: apiArg.arg });\\n\\t\\t\\t\\t\\t\\t\\tregistrations.splice(0, 1);\\n\\t\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t});\\n\\t\\t\\t\\tree.exportAPI(\\\"fromMyCLI\\\", async function() {\\n\\t\\t\\t\\t\\tif (!that.tracker[taskId].cliio.attached) return false;\\n\\t\\t\\t\\t\\tlet ti = that.tracker[taskId].cliio.xtermInstance;\\n\\t\\t\\t\\t\\treturn new Promise(async function(resolve) {\\n\\t\\t\\t\\t\\t\\tif (cliCache.length) {\\n\\t\\t\\t\\t\\t\\t\\tlet element = cliCache[0];\\n\\t\\t\\t\\t\\t\\t\\tcliCache = cliCache.slice(1);\\n\\t\\t\\t\\t\\t\\t\\tresolve(element);\\n\\t\\t\\t\\t\\t\\t\\treturn;\\n\\t\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t\\t\\tlet d = ti.onData(async function(e) {\\n\\t\\t\\t\\t\\t\\t\\tcliCache = cliCache.slice(1);\\n\\t\\t\\t\\t\\t\\t\\tresolve(e);\\n\\t\\t\\t\\t\\t\\t\\td.dispose();\\n\\t\\t\\t\\t\\t\\t});\\n\\t\\t\\t\\t\\t});\\n\\t\\t\\t\\t});\\n\\t\\t\\t\\tree.exportAPI(\\\"clearMyCLI\\\", async function() {\\n\\t\\t\\t\\t\\tif (that.tracker[taskId].cliio.attached) that.tracker[taskId].cliio.xtermInstance.clear();\\n\\t\\t\\t\\t\\tfor (let registered in registrations) {\\n\\t\\t\\t\\t\\t\\tawait registrations[registered]({ type: \\\"consoleClear\\\" });\\n\\t\\t\\t\\t\\t\\tregistrations.splice(registered, 1);\\n\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t});\\n\\t\\t\\t\\tree.exportAPI(\\\"cliSize\\\", function() {\\n\\t\\t\\t\\t\\tif (!that.tracker[taskId].cliio.attached) return [ 0, 0 ];\\n\\t\\t\\t\\t\\treturn [ that.tracker[taskId].cliio.xtermInstance.cols, that.tracker[taskId].cliio.xtermInstance.rows ];\\n\\t\\t\\t\\t});\\n\\t\\t\\t\\tree.exportAPI(\\\"detachCLI\\\", function() {\\n\\t\\t\\t\\t\\tif (!that.tracker[taskId].cliio.attached) return true;\\n\\t\\t\\t\\t\\tthat.tracker[taskId].cliio.attached = false;\\n\\t\\t\\t\\t\\tthat.tracker[taskId].cliio.xtermInstance.clear();\\n\\t\\t\\t\\t\\tthat.tracker[taskId].cliio.robsInstance.disconnect();\\n\\t\\t\\t\\t\\tdelete that.tracker[taskId].cliio.robsInstance;\\n\\t\\t\\t\\t\\tthat.tracker[taskId].cliio.xtermInstance.dispose();\\n\\t\\t\\t\\t\\tdelete that.tracker[taskId].cliio.xtermInstance;\\n\\t\\t\\t\\t\\tdelete that.tracker[taskId].cliio.signup;\\n\\t\\t\\t\\t\\tregistrations = [];\\n\\t\\t\\t\\t\\tree.iframe.hidden = false;\\n\\t\\t\\t\\t\\treturn true;\\n\\t\\t\\t\\t});\\n\\t\\t\\t\\tree.exportAPI(\\\"windowVisibility\\\", (apiArg) => windowObject.windowDiv.classList.toggle(\\\"hidden\\\", !apiArg.arg));\\n\\t\\t\\t\\tree.exportAPI(\\\"windowTitleSet\\\", (apiArg) => windowObject.title.innerText = apiArg.arg);\\n\\t\\t\\t\\tree.exportAPI(\\\"windowResize\\\", function(apiArg) {\\n\\t\\t\\t\\t\\tif (reeAPIInstance.public.getPrivileges().includes(\\\"GRAB_ATTENTION\\\")) {\\n\\t\\t\\t\\t\\t\\twindowObject.windowDiv.style.width = apiArg.arg[0] + \\\"px\\\";\\n\\t\\t\\t\\t\\t\\twindowObject.windowDiv.style.height = apiArg.arg[1] + \\\"px\\\";\\n\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t});\\n\\t\\t\\t\\tree.exportAPI(\\\"windowSize\\\", function() {\\n\\t\\t\\t\\t\\treturn {\\n\\t\\t\\t\\t\\t\\twidth: windowObject.windowDiv.clientWidth,\\n\\t\\t\\t\\t\\t\\theight: windowObject.windowDiv.clientHeight\\n\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t});\\n\\t\\t\\t\\tree.exportAPI(\\\"windowRelocate\\\", function(apiArg) {\\n\\t\\t\\t\\t\\tif (reeAPIInstance.public.getPrivileges().includes(\\\"GRAB_ATTENTION\\\")) {\\n\\t\\t\\t\\t\\t\\twindowObject.windowDiv.style.top = apiArg.arg[0] + \\\"px\\\";\\n\\t\\t\\t\\t\\t\\twindowObject.windowDiv.style.left = apiArg.arg[1] + \\\"px\\\";\\n\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t});\\n\\t\\t\\t\\tree.exportAPI(\\\"windowFullscreen\\\", function(apiArg) {\\n\\t\\t\\t\\t\\tif (reeAPIInstance.public.getPrivileges().includes(\\\"GRAB_ATTENTION\\\")) {\\n\\t\\t\\t\\t\\t\\twindowObject.windowDiv.classList.toggle(\\\"fullscreen\\\", apiArg.arg);\\n\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t});\\n\\t\\t\\t\\tree.exportAPI(\\\"closeability\\\", (apiArg) => windowObject.closeButton.classList.toggle(\\\"hidden\\\", !apiArg.arg));\\n\\t\\t\\t\\tree.exportAPI(\\\"critical\\\", function(apiArg) {\\n\\t\\t\\t\\t\\tif (reeAPIInstance.public.getPrivileges().includes(\\\"SYSTEM_STABILITY\\\")) {\\n\\t\\t\\t\\t\\t\\tthat.tracker[taskId].critical = !!apiArg.arg;\\n\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t});\\n\\t\\t\\t\\tawait ree.eval(\\\"taskId = \\\" + JSON.stringify(taskId) + \\\";\\\");\\n\\t\\t\\t\\tawait ree.eval(\\\"exec_args = \\\" + JSON.stringify(arg) + \\\";\\\");\\n\\t\\t\\t\\tree.beforeCloseDown(function() {\\n\\t\\t\\t\\t\\tlet orw = modules.session.attrib(windowObject.sessionId, \\\"openReeWindows\\\");\\n\\t\\t\\t\\t\\torw.splice(orw.indexOf(taskId), 1);\\n\\t\\t\\t\\t\\tmodules.session.attrib(windowObject.sessionId, \\\"openReeWindows\\\", orw);\\n\\t\\t\\t\\t\\tif (that.tracker[taskId].cliio.attached) {    \\n\\t\\t\\t\\t\\t\\tthat.tracker[taskId].cliio.attached = false;\\n\\t\\t\\t\\t\\t\\tthat.tracker[taskId].cliio.xtermInstance.clear();\\n\\t\\t\\t\\t\\t\\tthat.tracker[taskId].cliio.robsInstance.disconnect();\\n\\t\\t\\t\\t\\t\\tthat.tracker[taskId].cliio.robsInstance = null;\\n\\t\\t\\t\\t\\t\\tthat.tracker[taskId].cliio.xtermInstance.dispose();\\n\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t});\\n\\t\\t\\t\\tree.beforeCloseDown(() => windowObject.windowDiv.remove());\\n\\t\\t\\t\\tree.beforeCloseDown(() => delete that.tracker[taskId]);\\n\\t\\t\\t\\tawait ree.eval(executable);\\n\\t\\t\\t} catch (e) {\\n\\t\\t\\t\\tree.closeDown();\\n\\t\\t\\t\\twindowObject.title.innerText = modules.locales.get(\\\"APP_STARTUP_CRASH_TITLE\\\", language);\\n\\t\\t\\t\\twindowObject.content.innerText = modules.locales.get(\\\"APP_STARTUP_CRASH\\\", language);\\n\\t\\t\\t\\twindowObject.content.style.padding = \\\"8px\\\";\\n\\t\\t\\t\\twindowObject.closeButton.disabled = false;\\n\\t\\t\\t\\twindowObject.windowDiv.classList.toggle(\\\"hidden\\\", false);\\n\\t\\t\\t\\twindowObject.closeButton.onclick = (e) => windowObject.windowDiv.remove() && e.stopPropagation();\\n\\t\\t\\t\\tif (silent) windowObject.windowDiv.remove();\\n\\t\\t\\t\\tthrow e;\\n\\t\\t\\t}\\n\\t\\t\\treturn taskId;\\n\\t\\t},\\n\\t\\tsendSignal: async function(taskId, signal, bypassCritical) {\\n\\t\\t\\tif (signal == 9) {\\n\\t\\t\\t\\tif (this.tracker[taskId].critical && !bypassCritical) {\\n\\t\\t\\t\\t\\tlet memory = this.tracker[taskId];\\n\\t\\t\\t\\t\\tawait memory.ree.closeDown();\\n\\t\\t\\t\\t\\tawait panic(\\\"CRITICAL_TASK_FAILED\\\", {\\n\\t\\t\\t\\t\\t\\tname: memory.file,\\n\\t\\t\\t\\t\\t\\tparams: memory.arg\\n\\t\\t\\t\\t\\t});\\n\\t\\t\\t\\t\\tthrow new Error(\\\"CRITICAL_TASK_FAILED\\\");\\n\\t\\t\\t\\t}\\n\\t\\t\\t\\treturn await this.tracker[taskId].ree.closeDown();\\n\\t\\t\\t}\\n\\t\\t\\treturn await this.tracker[taskId].ree.eval(\\\"dispatchEvent(new CustomEvent(\\\\\\\"signal\\\\\\\", { detail: \\\" + JSON.stringify(signal) + \\\", bubbles: true }));\\\");\\n\\t\\t},\\n\\t\\trunsProperly: async function(taskId) {\\n\\t\\t\\ttry {\\n\\t\\t\\t\\treturn await this.tracker[taskId].ree.eval(\\\"true\\\");\\n\\t\\t\\t} catch (e) {\\n\\t\\t\\t\\treturn false;\\n\\t\\t\\t}\\n\\t\\t},\\n\\t\\tlistPublicTasks: () => Object.keys(tasks.tracker),\\n\\t\\twaitTermination: async function(taskId) {\\n\\t\\t\\tif (!this.tracker.hasOwnProperty(taskId)) return;\\n\\t\\t\\treturn new Promise((resolve) => this.tracker[taskId].ree.beforeCloseDown(() => resolve()));\\n\\t\\t},\\n\\t\\ttaskInfo: async function(taskId) {\\n\\t\\t\\tif (!this.tracker.hasOwnProperty(taskId)) return null;\\n\\t\\t\\tlet info = await modules.tokens.info(this.tracker[taskId].apis.public.getProcessToken());\\n\\t\\t\\tif (!info) info = { user: taskId.slice(0, 16) };\\n\\t\\t\\treturn {\\n\\t\\t\\t\\tfile: this.tracker[taskId].file,\\n\\t\\t\\t\\targ: this.tracker[taskId].arg,\\n\\t\\t\\t\\trunBy: info.user,\\n\\t\\t\\t\\tcliio: this.tracker[taskId].cliio.attached\\n\\t\\t\\t}\\n\\t\\t},\\n\\t\\ttracker: {},\\n\\t\\tfs: modules.fs,\\n\\t\\tree: modules.core.createREE\\n\\t};\\n\\t\\n\\tmodules.tasks = tasks;\\n}\\nloadTasks();\",\"7873d7e5e17b85774cc1dce254963aaf270e8cc001ca5b6e9d6eb7fa098d6ce909b162fb8c41f48d6babb10498253c71eaac8365255d7bd1ed29b777c5ff4690\":\"async function logOut(target) {\\n\\tlet liu = modules.liu;\\n\\tif (!liu.hasOwnProperty(target)) throw new Error(\\\"USER_NOT_LOGGED_IN\\\");\\n\\tlet session = liu[target].session;\\n\\tlet token = liu[target].logon.token;\\n\\tlet secureSession = modules.session.attrib(session, \\\"secureID\\\");\\n\\tawait modules.session.attrib(session, \\\"loggingOut\\\", true);\\n\\tclearInterval(liu[target].clockInterval);\\n\\tif (modules.session.active == session || (secureSession && modules.session.active == secureSession)) await modules.session.muteAllSessions();\\n\\tawait modules.session.activateSession(modules.session.systemSession);\\n\\tlet loggingOutWindow = modules.window(modules.session.systemSession, true);\\n\\tloggingOutWindow.title.innerText = modules.locales.get(\\\"LOGGING_OUT\\\");\\n\\tloggingOutWindow.content.style.padding = \\\"8px\\\";\\n\\tloggingOutWindow.closeButton.disabled = true;\\n\\tloggingOutWindow.content.innerText = modules.locales.get(\\\"LOGGING_OUT\\\");\\n\\tlet taskList = modules.session.attrib(session, \\\"openReeWindows\\\") || [];\\n\\tlet timeout = (ms) => new Promise(resolve => setTimeout(resolve, ms));\\n\\tfunction allProcessesClosed() {\\n\\t\\treturn new Promise(function(resolve) {\\n\\t\\t\\tlet int = setInterval(function() {\\n\\t\\t\\t\\ttry {\\n\\t\\t\\t\\t\\ttaskList = modules.session.attrib(session, \\\"openReeWindows\\\") || [];\\n\\t\\t\\t\\t\\tif (Object.keys(taskList).length == 0) {\\n\\t\\t\\t\\t\\t\\tresolve();\\n\\t\\t\\t\\t\\t\\tclearInterval(int);\\n\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t} catch {\\n\\t\\t\\t\\t\\tresolve();\\n\\t\\t\\t\\t\\tclearInterval(int);\\n\\t\\t\\t\\t}\\n\\t\\t\\t})\\n\\t\\t});\\n\\t}\\n\\tloggingOutWindow.content.innerText = modules.locales.get(\\\"POLITE_CLOSE_SIGNAL\\\");\\n\\tfor (let taskId of taskList) modules.tasks.sendSignal(taskId, 15);\\n\\tawait Promise.race([\\n\\t\\ttimeout(5000),\\n\\t\\tallProcessesClosed()\\n\\t]);\\n\\tloggingOutWindow.content.innerText = modules.locales.get(\\\"ABRUPT_CLOSE_SIGNAL\\\");\\n\\tif (secureSession) {\\n\\t\\ttaskList = modules.session.attrib(secureSession, \\\"openReeWindows\\\") || [];\\n\\t\\tfor (let taskId of taskList) modules.tasks.sendSignal(taskId, 9);\\n\\t}\\n\\ttaskList = modules.session.attrib(session, \\\"openReeWindows\\\") || [];\\n\\tfor (let taskId of taskList) modules.tasks.sendSignal(taskId, 9);\\n\\tawait allProcessesClosed();\\n\\tloggingOutWindow.windowDiv.remove();\\n\\tdelete modules.liu[target];\\n\\tawait modules.tokens.revoke(token);\\n\\tif (secureSession) await modules.session.rmsession(secureSession);\\n\\tawait modules.session.rmsession(session);\\n}\\n\\nmodules.logOut = logOut;\",\"a803565054fc767ad9eb1270042585d7a2dba9966ddcb0fd30e9e071067bfbe21b250abe63d24e7f44eba4a026da6c7a7fa22b26f1cf99fef0ca682ba0c5ee46\":\"function restartLoad() {\\n\\t// @pcos-app-mode native\\n\\tfunction timeout(ms) {\\n\\t\\treturn new Promise(resolve => setTimeout(resolve, ms));\\n\\t}\\n\\tfunction allProcessesClosed() {\\n\\t\\treturn new Promise(function(resolve) {\\n\\t\\t\\tlet int = setInterval(function() {\\n\\t\\t\\t\\tif (Object.keys(modules.tasks.tracker).length == 0) {\\n\\t\\t\\t\\t\\tresolve();\\n\\t\\t\\t\\t\\tclearInterval(int);\\n\\t\\t\\t\\t}\\n\\t\\t\\t})\\n\\t\\t});\\n\\t}\\n\\t\\n\\tasync function restart(noAutomaticReload = false, token, kexec) {\\n\\t\\ttry {\\n\\t\\t\\tlet shutdownSoundPerm = await modules.fs.permissions(modules.defaultSystem + \\\"/etc/sounds/shutdown.aud\\\");\\n\\t\\t\\tif (!shutdownSoundPerm.world.includes(\\\"r\\\")) throw new Error(\\\"Not allowed to read shutdown.aud\\\");\\n\\t\\t\\tlet shutdownSound = await modules.fs.read(modules.defaultSystem + \\\"/etc/sounds/shutdown.aud\\\");\\n\\t\\t\\tlet shutdownAudio = new Audio();\\n\\t\\t\\tshutdownAudio.src = shutdownSound;\\n\\t\\t\\tshutdownAudio.play();\\n\\t\\t} catch (e) {\\n\\t\\t\\tconsole.error(\\\"Failed to play shutdown.aud:\\\", e);\\n\\t\\t}\\n\\t\\tmodules.shuttingDown = true;\\n\\t\\tlet window = modules.window;\\n\\t\\tlet fs = modules.fs;\\n\\t\\tlet tasks = modules.tasks;\\n\\t\\tmodules.session.muteAllSessions();\\n\\t\\tmodules.session.activateSession(modules.session.systemSession);\\n\\t\\tlet windowDiv = window(modules.session.systemSession, true);\\n\\t\\twindowDiv.closeButton.classList.toggle(\\\"hidden\\\", true);\\n\\t\\twindowDiv.title.innerText = modules.locales.get(\\\"PCOS_RESTARTING\\\").replace(\\\"%s\\\", \\\"\\\");\\n\\t\\twindowDiv.content.style.padding = \\\"8px\\\";\\n\\t\\tlet description = document.createElement(\\\"p\\\");\\n\\t\\tdescription.innerText = modules.locales.get(\\\"PCOS_RESTARTING\\\").replace(\\\"%s\\\", modules.locales.get(\\\"PLEASE_WAIT\\\"));\\n\\t\\twindowDiv.content.appendChild(description);\\n\\t\\tdescription.innerText = modules.locales.get(\\\"PCOS_RESTARTING\\\").replace(\\\"%s\\\", modules.locales.get(\\\"POLITE_CLOSE_SIGNAL\\\"));\\n\\t\\tfor (let taskId in tasks.tracker) tasks.sendSignal(taskId, 15);\\n\\t\\tawait Promise.race([\\n\\t\\t\\ttimeout(5000),\\n\\t\\t\\tallProcessesClosed()\\n\\t\\t]);\\n\\t\\ttry {\\n\\t\\t\\tmodules.websocket._handles[modules.network.ws].send(JSON.stringify({\\n\\t\\t\\t\\tfinalProxyPacket: true\\n\\t\\t\\t}));\\n\\t\\t} catch {}\\n\\t\\tdescription.innerText = modules.locales.get(\\\"PCOS_RESTARTING\\\").replace(\\\"%s\\\", modules.locales.get(\\\"ABRUPT_CLOSE_SIGNAL\\\"));\\n\\t\\tfor (let taskId in tasks.tracker) tasks.sendSignal(taskId, 9, true);\\n\\t\\tawait allProcessesClosed();\\n\\t\\ttry {\\n\\t\\t\\tmodules.websocket._handles[modules.network.ws].ws.onclose = null;\\n\\t\\t\\tmodules.websocket._handles[modules.network.ws].ws.close();\\n\\t\\t\\tdelete modules.websocket._handles[modules.network.ws];\\n\\t\\t} catch {}\\n\\t\\tdescription.innerText = modules.locales.get(\\\"PCOS_RESTARTING\\\").replace(\\\"%s\\\", modules.locales.get(\\\"UNMOUNTING_MOUNTS\\\"));\\n\\t\\tfor (let mount in fs.mounts) try { await fs.sync(mount, token); } catch {}\\n\\t\\tfor (let mount in fs.mounts) try { await fs.umount(mount, token); } catch {}\\n\\t\\tfor (let mount in fs.mounts) try { await fs.umount(mount, token, true); } catch {}\\n\\t\\tdescription.innerText = modules.locales.get(\\\"PCOS_RESTARTING\\\").replace(\\\"%s\\\", modules.locales.get(\\\"RESTARTING\\\"));\\n\\t\\tif (!noAutomaticReload) {\\n\\t\\t\\tif (kexec) {\\n\\t\\t\\t\\ttry {\\n\\t\\t\\t\\t\\tmodules.session.destroy();\\n\\t\\t\\t\\t\\tawait new ((async _=>0).constructor)(\\n\\t\\t\\t\\t\\t\\tmodules.core.disk.partition(\\\"boot\\\").getData()\\n\\t\\t\\t\\t\\t)();\\n\\t\\t\\t\\t\\treturn modules.killSystem();\\n\\t\\t\\t\\t} catch (e) {\\n\\t\\t\\t\\t\\tawait panic(\\\"KEXEC_FAILED\\\", {\\n\\t\\t\\t\\t\\t\\tname: \\\"kexec\\\",\\n\\t\\t\\t\\t\\t\\tunderlyingJS: e\\n\\t\\t\\t\\t\\t});\\n\\t\\t\\t\\t}\\n\\t\\t\\t}\\n\\t\\t\\treturn location.reload();\\n\\t\\t}\\n\\t\\tmodules.killSystem();\\n\\t\\tdescription.innerText = modules.locales.get(\\\"SAFE_TO_CLOSE\\\");\\n\\t\\tlet button = document.createElement(\\\"button\\\");\\n\\t\\tbutton.innerText = modules.locales.get(\\\"RESTART_BUTTON\\\");\\n\\t\\tbutton.onclick = function() {\\n\\t\\t\\tdescription.innerText = modules.locales.get(\\\"PCOS_RESTARTING\\\").replace(\\\"%s\\\", modules.locales.get(\\\"RESTARTING\\\"));\\n\\t\\t\\tbutton.remove();\\n\\t\\t\\tlocation.reload();\\n\\t\\t}\\n\\t\\twindowDiv.content.appendChild(button);\\n\\t}\\n\\t\\n\\tmodules.restart = restart;\\n}\\n\\nrestartLoad();\",\"aef7c0967dd83ed31d4e14912b6c164ad2d3cda412c1b5e0652fcc4903bbcb587261949f79bbf32d22555bae4ec8434bf7cd85094a1f7876e604b12bb11aaa48\":\"function loadUserFriendly() {\\n\\t// @pcos-app-mode native\\n\\tmodules.userfriendliness = {\\n\\t\\tinconsiderateTime: function(language, ms, majorUnitsOnly, displayMs) {\\n\\t\\t\\tlet string = \\\"\\\";\\n\\t\\t\\tlet days = Math.floor(ms / 86400000);\\n\\t\\t\\tlet hours = Math.floor(ms / 3600000) % 24;\\n\\t\\t\\tlet minutes = Math.floor(ms / 60000) % 60;\\n\\t\\t\\tlet seconds = Math.floor(ms / 1000) % 60;\\n\\t\\t\\tif (days) string = string + modules.locales.get(\\\"SHORT_DAYS\\\", language).replace(\\\"%s\\\", days) + \\\" \\\";\\n\\t\\t\\tif (days && majorUnitsOnly) return string;\\n\\t\\t\\tif (hours) string = string + modules.locales.get(\\\"SHORT_HOURS\\\", language).replace(\\\"%s\\\", hours) + \\\" \\\";\\n\\t\\t\\tif (hours && majorUnitsOnly) return string;\\n\\t\\t\\tif (minutes) string = string + modules.locales.get(\\\"SHORT_MINUTES\\\", language).replace(\\\"%s\\\", minutes) + \\\" \\\";\\n\\t\\t\\tif (minutes && majorUnitsOnly) return string;\\n\\t\\t\\tif (seconds) string = string + modules.locales.get(\\\"SHORT_SECONDS\\\", language).replace(\\\"%s\\\", seconds) + \\\" \\\";\\n\\t\\t\\tif (displayMs && (ms % 1000)) {\\n\\t\\t\\t\\tif (seconds && majorUnitsOnly) return string;\\n\\t\\t\\t\\tstring = string + modules.locales.get(\\\"SHORT_MILLISECONDS\\\", language).replace(\\\"%s\\\", (ms % 1000)) + \\\" \\\";\\n\\t\\t\\t}\\n\\t\\t\\treturn string;\\n\\t\\t},\\n\\t\\tinformationUnits: function(language, bytes, majorUnitsOnly) {\\n\\t\\t\\tlet string = \\\"\\\";\\n\\t\\t\\tlet tb = Math.floor(bytes / (1024 * 1024 * 1024 * 1024));\\n\\t\\t\\tlet gb = Math.floor(bytes / (1024 * 1024 * 1024)) % 1024;\\n\\t\\t\\tlet mb = Math.floor(bytes / (1024 * 1024)) % 1024;\\n\\t\\t\\tlet kb = Math.floor(bytes / 1024) % 1024;\\n\\t\\t\\tlet b = bytes % 1024;\\n\\t\\t\\tif (tb) string = string + modules.locales.get(\\\"SHORT_TERABYTES\\\", language).replace(\\\"%s\\\", tb) + \\\" \\\";\\n\\t\\t\\tif (tb && majorUnitsOnly) return string;\\n\\t\\t\\tif (gb) string = string + modules.locales.get(\\\"SHORT_GIGABYTES\\\", language).replace(\\\"%s\\\", gb) + \\\" \\\";\\n\\t\\t\\tif (gb && majorUnitsOnly) return string;\\n\\t\\t\\tif (mb) string = string + modules.locales.get(\\\"SHORT_MEGABYTES\\\", language).replace(\\\"%s\\\", mb) + \\\" \\\";\\n\\t\\t\\tif (mb && majorUnitsOnly) return string;\\n\\t\\t\\tif (kb) string = string + modules.locales.get(\\\"SHORT_KILOBYTES\\\", language).replace(\\\"%s\\\", kb) + \\\" \\\";\\n\\t\\t\\tif (kb && majorUnitsOnly) return string;\\n\\t\\t\\tif (b) string = string + modules.locales.get(\\\"SHORT_BYTES\\\", language).replace(\\\"%s\\\", b);\\n\\t\\t\\tif (b && majorUnitsOnly) return string;\\n\\t\\t\\treturn string;\\n\\t\\t},\\n\\t\\tconsiderateTime: function(language, ms, majorUnitsOnly, displayMs) {\\n\\t\\t\\tlet dateObject = new Date(ms + (new Date(ms).getTimezoneOffset() * 60000));\\n\\t\\t\\tlet string = \\\"\\\";\\n\\t\\t\\tlet years = dateObject.getFullYear() - 1970;\\n\\t\\t\\tlet months = dateObject.getMonth();\\n\\t\\t\\tlet days = dateObject.getDate() - 1;\\n\\t\\t\\tlet hours = dateObject.getHours();\\n\\t\\t\\tlet minutes = dateObject.getMinutes();\\n\\t\\t\\tlet seconds = dateObject.getSeconds();\\n\\t\\t\\tlet millisec = dateObject.getMilliseconds();\\n\\t\\t\\tif (years) string = string + modules.locales.get(\\\"SHORT_YEARS\\\", language).replace(\\\"%s\\\", years) + \\\" \\\";\\n\\t\\t\\tif (years && majorUnitsOnly) return string;\\n\\t\\t\\tif (months) string = string + modules.locales.get(\\\"SHORT_MONTHS\\\", language).replace(\\\"%s\\\", months) + \\\" \\\";\\n\\t\\t\\tif (months && majorUnitsOnly) return string;\\n\\t\\t\\tif (days) string = string + modules.locales.get(\\\"SHORT_DAYS\\\", language).replace(\\\"%s\\\", days) + \\\" \\\";\\n\\t\\t\\tif (days && majorUnitsOnly) return string;\\n\\t\\t\\tif (hours) string = string + modules.locales.get(\\\"SHORT_HOURS\\\", language).replace(\\\"%s\\\", hours) + \\\" \\\";\\n\\t\\t\\tif (hours && majorUnitsOnly) return string;\\n\\t\\t\\tif (minutes) string = string + modules.locales.get(\\\"SHORT_MINUTES\\\", language).replace(\\\"%s\\\", minutes) + \\\" \\\";\\n\\t\\t\\tif (minutes && majorUnitsOnly) return string;\\n\\t\\t\\tif (seconds) string = string + modules.locales.get(\\\"SHORT_SECONDS\\\", language).replace(\\\"%s\\\", seconds) + \\\" \\\";\\n\\t\\t\\tif (displayMs && millisec) {\\n\\t\\t\\t\\tif (seconds && majorUnitsOnly) return string;\\n\\t\\t\\t\\tstring = string + modules.locales.get(\\\"SHORT_MILLISECONDS\\\", language).replace(\\\"%s\\\", (millisec % 1000)) + \\\" \\\";\\n\\t\\t\\t}\\n\\t\\t\\treturn string;\\n\\t\\t}\\n\\t}\\n}\\nloadUserFriendly();\",\"92dbba4bd477679214c2faff1e60a4c171e0181815ecf53a426bd087f017d2c6f4c72bf658e158c7a64e84f6dc6ed47310d1c7e0c156f6e1cc67404b384e57c8\":\"function setupTokens() {\\n\\t// @pcos-app-mode native\\n\\tmodules.tokens = {\\n\\t\\tgenerate: async function() {\\n\\t\\t\\tlet rng = crypto.getRandomValues(new Uint8Array(64));\\n\\t\\t\\tlet token = Array.from(rng).map(x => x.toString(16).padStart(2, \\\"0\\\")).join(\\\"\\\");\\n\\t\\t\\tthis._tokens[token] = { privileges: [], user: \\\"nobody\\\", groups: [] };\\n\\t\\t\\treturn token;\\n\\t\\t},\\n\\t\\trevoke: async function(token) {\\n\\t\\t\\tdelete this._tokens[token];\\n\\t\\t},\\n\\t\\tsetPrivileges: async function(token, privileges) {\\n\\t\\t\\tthis._tokens[token].privileges = privileges;\\n\\t\\t},\\n\\t\\taddPrivilege: async function(token, privilege) {\\n\\t\\t\\tthis._tokens[token].privileges.push(privilege);\\n\\t\\t},\\n\\t\\taddPrivileges: async function(token, privileges) {\\n\\t\\t\\tthis._tokens[token].privileges.push(...privileges);\\n\\t\\t},\\n\\t\\tremovePrivilege: async function(token, privilege) {\\n\\t\\t\\tthis._tokens[token].privileges = this._tokens[token].privileges.filter(x => x != privilege);\\n\\t\\t},\\n\\t\\tremovePrivileges: async function(token, privileges) {\\n\\t\\t\\tthis._tokens[token].privileges = this._tokens[token].privileges.filter(x => !privileges.includes(x));\\n\\t\\t},\\n\\t\\tuserInitialize: async function(token, user) {\\n\\t\\t\\tthis._tokens[token].user = user;\\n\\t\\t\\tthis._tokens[token].groups = (await modules.users.getUserInfo(user, token)).groups || [];\\n\\t\\t\\tthis._tokens[token].privileges = [\\\"FS_READ\\\", \\\"FS_WRITE\\\", \\\"FS_REMOVE\\\", \\\"FS_CHANGE_PERMISSION\\\", \\\"FS_LIST_PARTITIONS\\\", \\\"IPC_CREATE_PIPE\\\", \\\"IPC_LISTEN_PIPE\\\", \\\"IPC_SEND_PIPE\\\", \\\"IPC_CHANGE_PERMISSION\\\", \\\"ELEVATE_PRIVILEGES\\\", \\\"GET_USER_INFO\\\", \\\"SET_SECURITY_CHECKS\\\", \\\"START_TASK\\\", \\\"LIST_TASKS\\\", \\\"SIGNAL_TASK\\\", \\\"FETCH_SEND\\\", \\\"CSP_OPERATIONS\\\", \\\"IDENTIFY_SYSTEM\\\", \\\"WEBSOCKETS_OPEN\\\", \\\"WEBSOCKETS_LISTEN\\\", \\\"WEBSOCKETS_SEND\\\", \\\"WEBSOCKET_SET_PERMISSIONS\\\", \\\"MANAGE_TOKENS\\\", \\\"WEBSOCKET_INFO\\\", \\\"GRAB_ATTENTION\\\", \\\"CLI_MODIFICATIONS\\\", \\\"GET_THEME\\\", \\\"GET_LOCALE\\\", \\\"GET_FILESYSTEMS\\\", \\\"GET_BUILD\\\", \\\"GET_SERVER_URL\\\", \\\"START_BACKGROUND_TASK\\\", \\\"GET_BOOT_MODE\\\", \\\"GET_SCREEN_INFO\\\", \\\"PCOS_NETWORK_PING\\\", \\\"LOGOUT\\\", \\\"LULL_SYSTEM\\\", \\\"CONNLESS_LISTEN\\\", \\\"CONNLESS_SEND\\\", \\\"GET_NETWORK_ADDRESS\\\", \\\"CONNFUL_LISTEN\\\", \\\"CONNFUL_CONNECT\\\", \\\"CONNFUL_DISCONNECT\\\", \\\"CONNFUL_WRITE\\\", \\\"CONNFUL_READ\\\", \\\"CONNFUL_ADDRESS_GET\\\", \\\"SYSTEM_UPTIME\\\", \\\"GET_HOSTNAME\\\", \\\"RESOLVE_NAME\\\", \\\"PATCH_DIFF\\\", \\\"GET_BATTERY_STATUS\\\", \\\"CONNFUL_IDENTITY_GET\\\", \\\"GET_UPDATE_SERVICE\\\"];\\n\\t\\t\\tif (user == \\\"root\\\") this._tokens[token].privileges.push(\\\"FS_UNMOUNT\\\", \\\"SYSTEM_SHUTDOWN\\\", \\\"SWITCH_USERS_AUTOMATICALLY\\\", \\\"USER_INFO_OTHERS\\\", \\\"SET_USER_INFO\\\", \\\"FS_BYPASS_PERMISSIONS\\\", \\\"IPC_BYPASS_PERMISSIONS\\\", \\\"TASK_BYPASS_PERMISSIONS\\\", \\\"SENSITIVE_USER_INFO_OTHERS\\\", \\\"SYSTEM_STABILITY\\\", \\\"RUN_KLVL_CODE\\\", \\\"IDENTIFY_SYSTEM_SENSITIVE\\\", \\\"WEBSOCKET_BYPASS_PERMISSIONS\\\", \\\"LLDISK_READ\\\", \\\"LLDISK_WRITE\\\", \\\"LLDISK_LIST_PARTITIONS\\\", \\\"LLDISK_REMOVE\\\", \\\"LLDISK_IDB_READ\\\", \\\"LLDISK_IDB_WRITE\\\", \\\"LLDISK_IDB_REMOVE\\\", \\\"LLDISK_IDB_LIST\\\", \\\"LLDISK_IDB_SYNC\\\", \\\"FS_MOUNT\\\", \\\"SET_DEFAULT_SYSTEM\\\", \\\"GET_SYSTEM_RESOURCES\\\", \\\"LLDISK_INIT_PARTITIONS\\\", \\\"LOGOUT_OTHERS\\\", \\\"LULL_SYSTEM_FORCE\\\", \\\"CONNLESS_LISTEN_GLOBAL\\\", \\\"GET_USER_LIST\\\", \\\"CONNFUL_LISTEN_GLOBAL\\\", \\\"NETWORK_RAW_WRITE\\\", \\\"NETWORK_RAW_READ\\\", \\\"SET_FIRMWARE\\\", \\\"RELOAD_NETWORK_CONFIG\\\");\\n\\t\\t\\tif ((await modules.users.getUserInfo(user, token)).blankPrivileges) this._tokens[token].privileges = [];\\n\\t\\t\\tthis._tokens[token].privileges.push(...((await modules.users.getUserInfo(user, token)).additionalPrivilegeSet || []));\\n\\t\\t\\tthis._tokens[token].privileges = Array.from(new Set(this._tokens[token].privileges));\\n\\t\\t},\\n\\t\\thalfInitialize: async function(token, user) {\\n\\t\\t\\tthis._tokens[token].user = user;\\n\\t\\t\\tthis._tokens[token].groups = (await modules.users.getUserInfo(user, token)).groups || [];\\n\\t\\t},\\n\\t\\tinfo: async function(token) {\\n\\t\\t\\treturn this._tokens[token];\\n\\t\\t},\\n\\t\\tvalidate: async function(token, criteria) {\\n\\t\\t\\tif (!this._tokens.hasOwnProperty(token)) return false;\\n\\t\\t\\tif (criteria.user && this._tokens[token].user != criteria.user) return false;\\n\\t\\t\\tif (criteria.group && !this._tokens[token].groups.includes(criteria.group)) return false;\\n\\t\\t\\tif (criteria.privilege && !this._tokens[token].privileges.includes(criteria.privilege)) return false;\\n\\t\\t\\treturn true;\\n\\t\\t},\\n\\t\\tfork: async function(token) {\\n\\t\\t\\tlet rng = crypto.getRandomValues(new Uint8Array(64));\\n\\t\\t\\tlet newToken = Array.from(rng).map(x => x.toString(16).padStart(2, \\\"0\\\")).join(\\\"\\\");\\n\\t\\t\\tthis._tokens[newToken] = JSON.parse(JSON.stringify(this._tokens[token]));\\n\\t\\t\\treturn newToken;  \\n\\t\\t},\\n\\t\\t_tokens: {}\\n\\t}\\n}\\nsetupTokens();\",\"366cb67c5f74af78c7c1fc8d6102395117f74db70d59894dff97d1df965e1cb81803fc4e4edb17aa33f2905c76551a5d8fd90f45a89a5b64f7899aa13547dda4\":\"async function setupUsers() {\\n\\t// @pcos-app-mode native\\n\\tasync function handleAuthentication(user, prompts, finishFunction) {\\n\\t\\tlet currentPromptIndex = 0;\\n\\t\\tlet destroyed = false;\\n\\n\\t\\treturn {\\n\\t\\t\\tgetNextPrompt: async function() {\\n\\t\\t\\t\\tif (destroyed) return {\\n\\t\\t\\t\\t\\tsuccess: false,\\n\\t\\t\\t\\t\\tmessage: modules.locales.get(\\\"AUTH_FAILED_NEW\\\")\\n\\t\\t\\t\\t};\\n\\t\\t\\t\\tif (currentPromptIndex >= prompts.length) {\\n\\t\\t\\t\\t\\tif (finishFunction) await finishFunction(true);\\n\\t\\t\\t\\t\\tlet token = await modules.tokens.generate();\\n\\t\\t\\t\\t\\tawait modules.tokens.userInitialize(token, user);\\n\\t\\t\\t\\t\\treturn {\\n\\t\\t\\t\\t\\t\\tsuccess: true,\\n\\t\\t\\t\\t\\t\\tmessage: modules.locales.get(\\\"AUTH_SUCCESS\\\"),\\n\\t\\t\\t\\t\\t\\ttoken: token\\n\\t\\t\\t\\t\\t};\\n\\t\\t\\t\\t}\\n\\t\\t\\t\\tlet that = this;\\n\\t\\t\\t\\tlet currentPrompt = prompts[currentPromptIndex];\\n\\t\\t\\t\\tlet used = false;\\n\\t\\t\\t\\t\\n\\t\\t\\t\\treturn {\\n\\t\\t\\t\\t\\tsuccess: \\\"intermediate\\\",\\n\\t\\t\\t\\t\\ttype: currentPrompt.type,\\n\\t\\t\\t\\t\\tmessage: currentPrompt.message,\\n\\t\\t\\t\\t\\twantsUserInput: currentPrompt.userInput,\\n\\t\\t\\t\\t\\tchallenge: currentPrompt.challenge,\\n\\t\\t\\t\\t\\tinput: async function(input) {\\n\\t\\t\\t\\t\\t\\tif (used || destroyed) return that.getNextPrompt();\\n\\t\\t\\t\\t\\t\\tif (!used) used = true;\\n\\t\\t\\t\\t\\t\\tlet verified;\\n\\t\\t\\t\\t\\t\\ttry {\\n\\t\\t\\t\\t\\t\\t\\tverified = await currentPrompt.verify(input);\\n\\t\\t\\t\\t\\t\\t} catch {\\n\\t\\t\\t\\t\\t\\t\\tverified = false;\\n\\t\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t\\t\\tif (!verified) {\\n\\t\\t\\t\\t\\t\\t\\tdestroyed = true;\\n\\t\\t\\t\\t\\t\\t\\tif (finishFunction) await finishFunction(false);\\n\\t\\t\\t\\t\\t\\t\\treturn { success: false, message: modules.locales.get(\\\"AUTH_FAILED\\\") };\\n\\t\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t\\t\\tcurrentPromptIndex++;\\n\\t\\t\\t\\t\\t\\treturn that.getNextPrompt();\\n\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t};\\n\\t\\t\\t}\\n\\t\\t};\\n\\t}\\n\\n\\tlet test = \\\"{}\\\";\\n\\ttry {\\n\\t\\ttest = await modules.fs.read(modules.defaultSystem + \\\"/etc/security/users\\\");\\n\\t} catch {\\n\\t\\tif (!modules.settingUp) test = \\\"systemStatusInvalid\\\";\\n\\t}\\n\\ttry {\\n\\t\\tJSON.parse(test);\\n\\t} catch (e) {\\n\\t\\tif (!modules.settingUp) await panic(\\\"USER_SYSTEM_CORRUPTED\\\", {\\n\\t\\t\\tname: \\\"/etc/security/users\\\",\\n\\t\\t\\tparams: [modules.defaultSystem],\\n\\t\\t\\tunderlyingJS: e\\n\\t\\t})\\n\\t}\\n\\n\\tmodules.users = {\\n\\t\\tinit: async function(token) {\\n\\t\\t\\tawait this.mkrecursive(modules.defaultSystem + \\\"/etc/security\\\", token);\\n\\t\\t\\tawait modules.fs.chmod(modules.defaultSystem + \\\"/etc\\\", \\\"rx\\\", token);\\n\\t\\t\\tawait this.mkrecursive(modules.defaultSystem + \\\"/root\\\", token);\\n\\t\\t\\tawait modules.fs.write(modules.defaultSystem + \\\"/etc/security/users\\\", JSON.stringify({root: {\\n\\t\\t\\t\\tsecurityChecks: [],\\n\\t\\t\\t\\tgroups: [\\\"root\\\"],\\n\\t\\t\\t\\thomeDirectory: modules.defaultSystem + \\\"/root\\\"\\n\\t\\t\\t},\\n\\t\\t\\tnobody: {\\n\\t\\t\\t\\tsecurityChecks: [],\\n\\t\\t\\t\\tgroups: [\\\"nobody\\\"],\\n\\t\\t\\t\\thomeDirectory: modules.defaultSystem\\n\\t\\t\\t},\\n\\t\\t\\tauthui: {\\n\\t\\t\\t\\tsecurityChecks: [],\\n\\t\\t\\t\\tgroups: [\\\"authui\\\"],\\n\\t\\t\\t\\thomeDirectory: modules.defaultSystem,\\n\\t\\t\\t\\tblankPrivileges: true,\\n\\t\\t\\t\\tadditionalPrivilegeSet:  [ \\\"IPC_SEND_PIPE\\\", \\\"GET_LOCALE\\\", \\\"GET_THEME\\\", \\\"ELEVATE_PRIVILEGES\\\", \\\"FS_READ\\\", \\\"FS_LIST_PARTITIONS\\\", \\\"CSP_OPERATIONS\\\" ]\\n\\t\\t\\t}}), token);\\n\\t\\t},\\n\\t\\tmkrecursive: async function(dir, token) {\\n\\t\\t\\tlet slices = dir.split(\\\"/\\\");\\n\\t\\t\\tfor (let slice in slices) {\\n\\t\\t\\t\\tlet previousParts = slices.slice(0, slice).join(\\\"/\\\");\\n\\t\\t\\t\\tif (!previousParts) continue;\\n\\t\\t\\t\\tlet currentPart = slices[slice];\\n\\t\\t\\t\\tlet check = await modules.fs.ls(previousParts, token);\\n\\t\\t\\t\\tpreviousParts += \\\"/\\\";\\n\\t\\t\\t\\tif (!check.includes(currentPart)) await modules.fs.mkdir(previousParts + currentPart, token);\\n\\t\\t\\t}\\n\\t\\t},\\n\\t\\tmoduser: async function(user, data, token) {\\n\\t\\t\\tlet userDB = JSON.parse(await modules.fs.read(modules.defaultSystem + \\\"/etc/security/users\\\"), token);\\n\\t\\t\\tuserDB[user] = data;\\n\\t\\t\\tawait modules.fs.write(modules.defaultSystem + \\\"/etc/security/users\\\", JSON.stringify(userDB), token);\\n\\t\\t},\\n\\t\\tgetUserInfo: async function(user, sensitive = false, token) {\\n\\t\\t\\tlet userDB = JSON.parse(await modules.fs.read(modules.defaultSystem + \\\"/etc/security/users\\\"), token);\\n\\t\\t\\tif (!userDB.hasOwnProperty(user)) return null;\\n\\t\\t\\tuserDB = userDB[user];\\n\\t\\t\\tif (!sensitive) delete userDB.securityChecks;\\n\\t\\t\\treturn userDB;\\n\\t\\t},\\n\\t\\tconfigured: async function(token) {\\n\\t\\t\\ttry {\\n\\t\\t\\t\\tJSON.parse(await modules.fs.read(modules.defaultSystem + \\\"/etc/security/users\\\"), token);\\n\\t\\t\\t\\treturn true;\\n\\t\\t\\t} catch {\\n\\t\\t\\t\\treturn false;\\n\\t\\t\\t}\\n\\t\\t},\\n\\t\\taccess: async function(user, token) {\\n\\t\\t\\tlet userDB = JSON.parse(await modules.fs.read(modules.defaultSystem + \\\"/etc/security/users\\\"), token);\\n\\t\\t\\tlet credentials = userDB[user].securityChecks;\\n\\t\\t\\tfor (let check in credentials) {\\n\\t\\t\\t\\tif (credentials[check].type == \\\"pbkdf2\\\") {\\n\\t\\t\\t\\t\\tcredentials[check].userInput = true;\\n\\t\\t\\t\\t\\tcredentials[check].type = \\\"password\\\";\\n\\t\\t\\t\\t\\tcredentials[check].message = modules.locales.get(\\\"PASSWORD_PROMPT\\\");\\n\\t\\t\\t\\t\\tcredentials[check].verify = async function(input) {\\n\\t\\t\\t\\t\\t\\treturn (await modules.core.pbkdf2(input, credentials[check].salt)) == credentials[check].hash;\\n\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t}\\n\\t\\t\\t\\tif (credentials[check].type == \\\"informative\\\" || credentials[check].type == \\\"informative_deny\\\") {\\n\\t\\t\\t\\t\\tcredentials[check].verify = () => credentials[check].type == \\\"informative\\\";\\n\\t\\t\\t\\t\\tcredentials[check].type = \\\"informative\\\";\\n\\t\\t\\t\\t\\tcredentials[check].userInput = false;\\n\\t\\t\\t\\t}\\n\\t\\t\\t\\tif (credentials[check].type == \\\"timeout\\\" || credentials[check].type == \\\"timeout_deny\\\") {\\n\\t\\t\\t\\t\\tlet isTimeout = credentials[check].type == \\\"timeout\\\";\\n\\t\\t\\t\\t\\tcredentials[check].message = modules.locales.get(\\\"PLEASE_WAIT_TIME\\\").replace(\\\"%s\\\", modules.userfriendliness.inconsiderateTime(credentials[check].timeout));\\n\\t\\t\\t\\t\\tcredentials[check].verify = () => new Promise(resolve => setTimeout(resolve, credentials[check].timeout, isTimeout));\\n\\t\\t\\t\\t\\tcredentials[check].type = \\\"promise\\\";\\n\\t\\t\\t\\t\\tcredentials[check].userInput = false;\\n\\t\\t\\t\\t}\\n\\t\\t\\t\\tif (credentials[check].type == \\\"serverReport\\\") {\\n\\t\\t\\t\\t\\tcredentials[check].message = modules.locales.get(\\\"REPORTING_LOGON\\\");\\n\\t\\t\\t\\t\\tcredentials[check].type = \\\"promise\\\";\\n\\t\\t\\t\\t\\tcredentials[check].verify = async function() {\\n\\t\\t\\t\\t\\t\\ttry {\\n\\t\\t\\t\\t\\t\\t\\tlet response = await fetch(credentials[check].url);\\n\\t\\t\\t\\t\\t\\t\\tif (!response.ok) return false;\\n\\t\\t\\t\\t\\t\\t} catch {\\n\\t\\t\\t\\t\\t\\t\\treturn false;\\n\\t\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t\\t\\treturn true;\\n\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t\\tcredentials[check].userInput = false;\\n\\t\\t\\t\\t}\\n\\t\\t\\t\\tif (credentials[check].type == \\\"pc-totp\\\") {\\n\\t\\t\\t\\t\\tcredentials[check].message = modules.locales.get(\\\"TOTP_PC_PROMPT\\\");\\n\\t\\t\\t\\t\\tcredentials[check].type = \\\"text\\\";\\n\\t\\t\\t\\t\\tcredentials[check].userInput = true;\\n\\t\\t\\t\\t\\tcredentials[check].verify = async function(input) {\\n\\t\\t\\t\\t\\t\\tlet sha256 = async b => Array.from(new Uint8Array(await crypto.subtle.digest(\\\"SHA-256\\\", new TextEncoder().encode(b)))).map(a => a.toString(16).padStart(2, \\\"0\\\")).join(\\\"\\\");\\n\\t\\t\\t\\t\\t\\tlet c = Math.floor((Math.floor(Date.now() / 1000)) / 30);\\n\\t\\t\\t\\t\\t\\tlet hash = await sha256(credentials[check].secret + c);\\n\\t\\t\\t\\t\\t\\thash = parseInt(hash, 16);\\n\\t\\t\\t\\t\\t\\thash = hash % 60466176;\\n\\t\\t\\t\\t\\t\\thash = hash.toString();\\n\\t\\t\\t\\t\\t\\thash = hash.split(\\\"\\\", 6);\\n\\t\\t\\t\\t\\t\\thash = hash.join(\\\"\\\");\\n\\t\\t\\t\\t\\t\\treturn hash == input;\\n\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t}\\n\\t\\t\\t\\tif (credentials[check].type == \\\"totp\\\") {\\n\\t\\t\\t\\t\\tcredentials[check].message = modules.locales.get(\\\"TOTP_PROMPT\\\");\\n\\t\\t\\t\\t\\tcredentials[check].type = \\\"text\\\";\\n\\t\\t\\t\\t\\tcredentials[check].userInput = true;\\n\\t\\t\\t\\t\\tlet hexToU8A = (hex) => Uint8Array.from(hex.match(/.{1,2}/g).map(a => parseInt(a, 16)));\\n\\t\\t\\t\\t\\tlet keyImport = await crypto.subtle.importKey(\\\"raw\\\", hexToU8A(credentials[check].secret?.padStart(20, \\\"0\\\")), {\\n\\t\\t\\t\\t\\t\\tname: \\\"HMAC\\\",\\n\\t\\t\\t\\t\\t\\thash: \\\"SHA-1\\\"\\n\\t\\t\\t\\t\\t}, true, [ \\\"sign\\\" ]);\\n\\t\\t\\t\\t\\t\\n\\t\\t\\t\\t\\tcredentials[check].verify = async function(input) {\\n\\t\\t\\t\\t\\t\\tlet counter = hexToU8A(Math.floor(Date.now() / 30000).toString(16).padStart(16, \\\"0\\\"));\\n\\t\\t\\t\\t\\t\\tlet hmacSign = await crypto.subtle.sign(\\\"HMAC\\\", keyImport, counter);\\n\\t\\t\\t\\t\\t\\thmacSign = Array.from(new Uint8Array(hmacSign));\\n\\t\\t\\t\\t\\t\\tlet offset = hmacSign[19] & 0xf; // https://datatracker.ietf.org/doc/html/rfc4226#section-5.4\\n\\t\\t\\t\\t\\t\\tlet code = (hmacSign[offset] & 0x7f) << 24\\n\\t\\t\\t\\t\\t\\t\\t| (hmacSign[offset + 1] & 0xff) << 16\\n\\t\\t\\t\\t\\t\\t\\t| (hmacSign[offset + 2] & 0xff) << 8\\n\\t\\t\\t\\t\\t\\t\\t| (hmacSign[offset + 3] & 0xff);\\n\\t\\t\\t\\t\\t\\tcode = code % 1000000;\\n\\t\\t\\t\\t\\t\\treturn (code.toString() == input) || (code.toString().padStart(6, \\\"0\\\") == input);\\n\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t}\\n\\t\\t\\t\\tif (credentials[check].type == \\\"workingHours\\\") {\\n\\t\\t\\t\\t\\tlet workingHourStarts = new Date();\\n\\t\\t\\t\\t\\tworkingHourStarts.setHours(credentials[check].start.hours || 0, credentials[check].start.minutes || 0, credentials[check].start.seconds || 0);\\n\\t\\t\\t\\t\\tlet workingHourEnds = new Date();\\n\\t\\t\\t\\t\\tworkingHourEnds.setHours(credentials[check].end.hours || 0, credentials[check].end.minutes || 0, credentials[check].end.seconds || 0);\\n\\t\\t\\t\\t\\t\\n\\t\\t\\t\\t\\tif (new Date() > workingHourEnds || new Date() < workingHourStarts) {\\n\\t\\t\\t\\t\\t\\tcredentials[check].message = modules.locales.get(\\\"WORKING_HOURS_UNMET\\\");\\n\\t\\t\\t\\t\\t\\tcredentials[check].type = \\\"informative\\\";\\n\\t\\t\\t\\t\\t\\tcredentials[check].userInput = false;\\n\\t\\t\\t\\t\\t\\tcredentials[check].verify = () => false;\\n\\t\\t\\t\\t\\t} else {\\n\\t\\t\\t\\t\\t\\tcredentials[check].message = modules.locales.get(\\\"AUTH_SUCCESS\\\");\\n\\t\\t\\t\\t\\t\\tcredentials[check].type = \\\"promise\\\";\\n\\t\\t\\t\\t\\t\\tcredentials[check].userInput = false;\\n\\t\\t\\t\\t\\t\\tcredentials[check].verify = () => true;\\n\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t}\\n\\t\\t\\t\\tif (credentials[check].type == \\\"zkpp\\\") {\\n\\t\\t\\t\\t\\tcredentials[check].message = modules.locales.get(\\\"MODULE_REQUIRED\\\").replace(\\\"%s\\\", \\\"tweetnacl\\\");\\n\\t\\t\\t\\t\\tcredentials[check].type = \\\"informative\\\";\\n\\t\\t\\t\\t\\tcredentials[check].userInput = false;\\n\\t\\t\\t\\t\\tcredentials[check].verify = () => false;\\n\\t\\t\\t\\t\\tif (window.nacl) {\\n\\t\\t\\t\\t\\t\\tlet hexToU8A = (hex) => Uint8Array.from(hex.match(/.{1,2}/g).map(a => parseInt(a, 16)));\\n\\t\\t\\t\\t\\t\\tlet randomChallenge = crypto.getRandomValues(new Uint8Array(64)).reduce((a, b) => a + b.toString(16).padStart(2, \\\"0\\\"), \\\"\\\");\\n\\t\\t\\t\\t\\t\\tcredentials[check].message = modules.locales.get(\\\"PASSWORD_PROMPT\\\");\\n\\t\\t\\t\\t\\t\\tcredentials[check].type = \\\"zkpp_password\\\";\\n\\t\\t\\t\\t\\t\\tcredentials[check].userInput = true;\\n\\t\\t\\t\\t\\t\\tcredentials[check].challenge = randomChallenge;\\n\\t\\t\\t\\t\\t\\tcredentials[check].verify = input => nacl.sign.detached.verify(hexToU8A(credentials[check].challenge), hexToU8A(input), hexToU8A(credentials[check].publicKey));\\n\\t\\t\\t\\t\\t}\\n\\n\\t\\t\\t\\t}\\n\\t\\t\\t}\\n\\t\\t\\tif (credentials.length == 0) {\\n\\t\\t\\t\\tcredentials.push({\\n\\t\\t\\t\\t\\ttype: \\\"informative\\\",\\n\\t\\t\\t\\t\\tmessage: modules.locales.get(\\\"ACCESS_NOT_SETUP\\\"),\\n\\t\\t\\t\\t\\tuserInput: false,\\n\\t\\t\\t\\t\\tverify: () => false\\n\\t\\t\\t\\t})\\n\\t\\t\\t}\\n\\t\\t\\treturn handleAuthentication(user, credentials);\\n\\t\\t},\\n\\t\\tgetUsers: async function(token) {\\n\\t\\t\\tlet userDB = JSON.parse(await modules.fs.read(modules.defaultSystem + \\\"/etc/security/users\\\"), token);\\n\\t\\t\\treturn Object.keys(userDB);\\n\\t\\t}\\n\\t}\\n}\\nawait setupUsers();\",\"f3b506922d5a75c51cd41c592decdad4cabec3b2f70f96d4cb0f66f4c3c955d157cbe33fb1658d3f9cf9930775ac402851509bc2016f9c82992bdff9d574fa4c\":\"async function authui(ses = modules.session.active, user, token, isLogonScreen) {\\n\\t// @pcos-app-mode native\\n\\tif (modules.shuttingDown) return { hook: _ => _ };\\n\\tlet appToken;\\n\\tif (token) appToken = modules.tokens.fork(token);\\n\\telse {\\n\\t\\tappToken = await modules.tokens.generate();\\n\\t\\tawait modules.tokens.userInitialize(appToken, \\\"authui\\\");\\n\\t}\\n\\tlet hook = new Function();\\n\\tlet ipc = await modules.ipc.create();\\n\\tmodules.ipc.declareAccess(ipc, { owner: \\\"authui\\\", group: \\\"authui\\\", world: false });\\n\\tlet windowObject = modules.window(ses);\\n\\tif (isLogonScreen) windowObject.closeButton.classList.toggle(\\\"hidden\\\", true);\\n\\tlet authTask = await modules.tasks.exec(modules.defaultSystem + \\\"/apps/authui.js\\\", [], windowObject, appToken, false, [ ipc, user || \\\"\\\" ]);\\n\\tasync function waitForIt() {\\n\\t\\tlet msg = await Promise.race([\\n\\t\\t\\tmodules.ipc.listenFor(ipc),\\n\\t\\t\\tmodules.tasks.waitTermination(authTask)\\n\\t\\t]);\\n\\t\\tdelete modules.ipc._ipc[ipc];\\n\\t\\ttry {\\n\\t\\t\\tawait modules.tasks.sendSignal(authTask, 9);\\n\\t\\t\\thook(msg);\\n\\t\\t} catch {\\n\\t\\t\\thook({\\n\\t\\t\\t\\tsuccess: false,\\n\\t\\t\\t\\tcancelled: true\\n\\t\\t\\t});\\n\\t\\t}\\n\\t}\\n\\twaitForIt();\\n\\treturn { hook: (e) => hook = e };\\n}\\nmodules.authui = authui;\",\"0c0a9ff578d08673b85d63a68869100037c5008230482d21764e264e3716d3fc034ec174b88ae0356adb1c272dd2ae084e221e674dc1c07d8827da2f967b1b90\":\"async function consentui(ses = modules.session.active, config, token) {\\n\\t// @pcos-app-mode native\\n\\tif (modules.shuttingDown) return { hook: _ => _ };\\n\\tlet appToken;\\n\\tif (token) appToken = modules.tokens.fork(token);\\n\\telse {\\n\\t\\tappToken = await modules.tokens.generate();\\n\\t\\tawait modules.tokens.userInitialize(appToken, \\\"authui\\\");\\n\\t}\\n\\tlet hook = new Function();\\n\\tlet ipc = await modules.ipc.create();\\n\\tmodules.ipc.declareAccess(ipc, { owner: \\\"authui\\\", group: \\\"authui\\\", world: false });\\n\\tlet windowObject = modules.window(ses);\\n\\tlet authTask = await modules.tasks.exec(modules.defaultSystem + \\\"/apps/consentui.js\\\", [], windowObject, appToken, false, [\\n\\t\\tipc,\\n\\t\\tconfig.user || \\\"\\\",\\n\\t\\tJSON.stringify({\\n\\t\\t\\tpath: config.path,\\n\\t\\t\\targs: config.args,\\n\\t\\t\\tsubmittedIntent: config.intent,\\n\\t\\t\\tsubmittedName: config.name\\n\\t\\t})\\n\\t]);\\n\\tasync function waitForIt() {\\n\\t\\tlet msg = await Promise.race([\\n\\t\\t\\tmodules.ipc.listenFor(ipc),\\n\\t\\t\\tmodules.tasks.waitTermination(authTask)\\n\\t\\t]);\\n\\t\\tdelete modules.ipc._ipc[ipc];\\n\\t\\ttry {\\n\\t\\t\\tawait modules.tasks.sendSignal(authTask, 9);\\n\\t\\t\\thook(msg);\\n\\t\\t} catch {\\n\\t\\t\\thook({\\n\\t\\t\\t\\tsuccess: false,\\n\\t\\t\\t\\tcancelled: true\\n\\t\\t\\t});\\n\\t\\t}\\n\\t}\\n\\twaitForIt();\\n\\treturn { hook: (e) => hook = e };\\n}\\nmodules.consentui = consentui;\",\"887a9544e45f5e18df53074eb1011a2d14807999b7c9f0656142b095d5d86aae9aa378ee42d4f69f3f4188c49983c41be974509718af60eee360335c0dbe929e\":\"async function requireLogon() {\\n\\t// @pcos-app-mode native\\n\\ttry {\\n\\t\\tlet startupSoundPerm = await modules.fs.permissions(modules.defaultSystem + \\\"/etc/sounds/startup.aud\\\");\\n\\t\\tif (!startupSoundPerm.world.includes(\\\"r\\\")) throw new Error(\\\"Not allowed to read startup.aud\\\");\\n\\t\\tlet startupSound = await modules.fs.read(modules.defaultSystem + \\\"/etc/sounds/startup.aud\\\");\\n\\t\\tlet startupAudio = new Audio();\\n\\t\\tstartupAudio.src = startupSound;\\n\\t\\tstartupAudio.play();\\n\\t} catch (e) {\\n\\t\\tconsole.error(\\\"Failed to play startup sound:\\\", e);\\n\\t}\\n\\tlet liu = {};\\n\\tmodules.liu = liu;\\n\\tserviceLogon();\\n\\tlet insertedLockMessage = false;\\n\\tasync function handleLogin(resolvedLogon, liu) {\\n\\t\\tmodules.session.muteAllSessions();\\n\\t\\tlet userInfo = await modules.tokens.info(resolvedLogon.token);\\n\\t\\tlet session;\\n\\t\\tlet liuUser = userInfo.user;\\n\\t\\tlet wasLiuLoaded = false;\\n\\t\\tif (liu.hasOwnProperty(userInfo.user)) {\\n\\t\\t\\tsession = liu[userInfo.user].session;\\n\\t\\t\\tawait modules.tokens.revoke(resolvedLogon.token);\\n\\t\\t\\tresolvedLogon = liu[userInfo.user].logon;\\n\\t\\t\\tuserInfo = await modules.tokens.info(resolvedLogon.token);\\n\\t\\t\\twasLiuLoaded = true;\\n\\t\\t} else {\\n\\t\\t\\tsession = modules.session.mksession();\\n\\t\\t\\tliu[userInfo.user] = {\\n\\t\\t\\t\\tsession,\\n\\t\\t\\t\\tlogon: resolvedLogon,\\n\\t\\t\\t}\\n\\t\\t}\\n\\t\\tif (modules.session.attrib(session, \\\"secureID\\\")) return modules.session.activateSession(modules.session.attrib(session, \\\"secureID\\\"));\\n\\t\\tmodules.session.activateSession(session);\\n\\t\\tlet dom = modules.session.tracker[session].html;\\n\\t\\tlet bgPic = \\\"\\\";\\n\\t\\tlet isDark = false;\\n\\t\\tlet locale;\\n\\t\\tlet basicPrivilegeChecklist = [ \\\"FS_READ\\\", \\\"FS_LIST_PARTITIONS\\\", \\\"IPC_SEND_PIPE\\\", \\\"IPC_LISTEN_PIPE\\\", \\\"START_TASK\\\", \\\"GET_LOCALE\\\", \\\"GET_THEME\\\", \\\"LOGOUT\\\" ];\\n\\t\\tif (!basicPrivilegeChecklist.every(privilege => userInfo.privileges.includes(privilege))) {\\n\\t\\t\\tlet failureMessage = modules.window(session);\\n\\t\\t\\tfailureMessage.title.innerText = \\\"Permission denied\\\";\\n\\t\\t\\tfailureMessage.content.style.padding = \\\"8px\\\";\\n\\t\\t\\tfailureMessage.content.innerText = \\\"There were not enough privileges to log you in. Please contact your system administrator.\\\";\\n\\t\\t\\tfailureMessage.closeButton.onclick = async function() {\\n\\t\\t\\t\\tfailureMessage.windowDiv.remove();\\n\\t\\t\\t\\tawait modules.logOut(userInfo.user);\\n\\t\\t\\t}\\n\\t\\t\\treturn;\\n\\t\\t}\\n\\n\\t\\ttry {\\n\\t\\t\\tlet permissions = await modules.fs.permissions((await modules.users.getUserInfo(userInfo.user, false, resolvedLogon.token)).homeDirectory + \\\"/.wallpaper\\\", resolvedLogon.token);\\n\\t\\t\\tif (permissions.owner != userInfo.user && !userInfo.groups.includes(permissions.group) && !(permissions.world.includes(\\\"r\\\") && permissions.world.includes(\\\"x\\\")) && !userInfo.privileges.includes(\\\"FS_BYPASS_PERMISSIONS\\\")) {\\n\\t\\t\\t\\tthrow new Error(\\\"Permission denied reading wallpaper\\\");\\n\\t\\t\\t}\\n\\t\\t\\tbgPic = await modules.fs.read((await modules.users.getUserInfo(userInfo.user, false, resolvedLogon.token)).homeDirectory + \\\"/.wallpaper\\\", resolvedLogon.token);\\n\\t\\t} catch (e) {\\n\\t\\t\\tconsole.error(\\\"Failed to read wallpaper:\\\", e);\\n\\t\\t}\\n\\t\\ttry {\\n\\t\\t\\tlet permissionsdm = await modules.fs.permissions((await modules.users.getUserInfo(userInfo.user, false, resolvedLogon.token)).homeDirectory + \\\"/.darkmode\\\", resolvedLogon.token);\\n\\t\\t\\tif (permissionsdm.owner != userInfo.user && !userInfo.groups.includes(permissionsdm.group) && !(permissionsdm.world.includes(\\\"r\\\") && permissionsdm.world.includes(\\\"x\\\")) && !userInfo.privileges.includes(\\\"FS_BYPASS_PERMISSIONS\\\")) {\\n\\t\\t\\t\\tthrow new Error(\\\"Permission denied reading dark mode preference\\\");\\n\\t\\t\\t}\\n\\t\\t\\tisDark = (await modules.fs.read((await modules.users.getUserInfo(userInfo.user, false, resolvedLogon.token)).homeDirectory + \\\"/.darkmode\\\", resolvedLogon.token)) == \\\"true\\\";\\n\\t\\t} catch (e) {\\n\\t\\t\\tconsole.error(\\\"Failed to read dark mode preference:\\\", e);\\n\\t\\t}\\n\\t\\ttry {\\n\\t\\t\\tlet permissionsloc = await modules.fs.permissions((await modules.users.getUserInfo(userInfo.user, false, resolvedLogon.token)).homeDirectory + \\\"/.locale\\\", resolvedLogon.token);\\n\\t\\t\\tif (permissionsloc.owner != userInfo.user && !userInfo.groups.includes(permissionsloc.group) && !(permissionsloc.world.includes(\\\"r\\\") && permissionsloc.world.includes(\\\"x\\\")) && !userInfo.privileges.includes(\\\"FS_BYPASS_PERMISSIONS\\\")) {\\n\\t\\t\\t\\tthrow new Error(\\\"Permission denied reading locale preference\\\");\\n\\t\\t\\t}\\n\\t\\t\\tlocale = await modules.fs.read((await modules.users.getUserInfo(userInfo.user, false, resolvedLogon.token)).homeDirectory + \\\"/.locale\\\", resolvedLogon.token);\\n\\t\\t\\tmodules.session.attrib(session, \\\"language\\\", locale);\\n\\t\\t} catch (e) {\\n\\t\\t\\tconsole.error(\\\"Failed to read dark mode preference:\\\", e);\\n\\t\\t}\\n\\t\\tif (modules.core.bootMode == \\\"safe\\\") {\\n\\t\\t\\tisDark = true;\\n\\t\\t\\tif (!wasLiuLoaded) {\\n\\t\\t\\t\\tlet message = document.createElement(\\\"span\\\");\\n\\t\\t\\t\\tmessage.innerText = modules.locales.get(\\\"SAFE_MODE_MSG\\\", locale);\\n\\t\\t\\t\\tmessage.style = \\\"position: absolute; right: 8px; bottom: 8px; color: white;\\\";\\n\\t\\t\\t\\tdom.appendChild(message);\\n\\t\\t\\t\\tlet message2 = document.createElement(\\\"span\\\");\\n\\t\\t\\t\\tmessage2.innerText = modules.locales.get(\\\"SAFE_MODE_MSG\\\", locale);\\n\\t\\t\\t\\tmessage2.style = \\\"position: absolute; top: 8px; left: 8px; color: white;\\\";\\n\\t\\t\\t\\tdom.appendChild(message2);\\n\\t\\t\\t}\\n\\t\\t\\tbgPic = \\\"\\\";\\n\\t\\t}\\n\\t\\tif (modules.core.bootMode == \\\"disable-harden\\\" && !wasLiuLoaded) {\\n\\t\\t\\tlet message = document.createElement(\\\"span\\\");\\n\\t\\t\\tmessage.innerText = modules.locales.get(\\\"INSECURE_MODE_MSG\\\", locale);\\n\\t\\t\\tmessage.style = \\\"position: absolute; right: 8px; bottom: 8px; color: white;\\\";\\n\\t\\t\\tdom.appendChild(message);\\n\\t\\t\\tlet message2 = document.createElement(\\\"span\\\");\\n\\t\\t\\tmessage2.innerText = modules.locales.get(\\\"INSECURE_MODE_MSG\\\", locale);\\n\\t\\t\\tmessage2.style = \\\"position: absolute; top: 8px; left: 8px; color: white;\\\";\\n\\t\\t\\tdom.appendChild(message2);\\n\\t\\t}\\n\\t\\tmodules.session.attrib(session, \\\"dark\\\", isDark);\\n\\t\\tdom.style.background = \\\"url(\\\" + JSON.stringify(bgPic) + \\\")\\\";\\n\\t\\tif (modules.core.bootMode == \\\"safe\\\") dom.style.background = \\\"black\\\";\\n\\t\\tdom.style.backgroundSize = \\\"100% 100%\\\";\\n\\t\\tif (!wasLiuLoaded) {\\n\\t\\t\\tlet autoRunNecessities = [];\\n\\t\\t\\ttry {\\n\\t\\t\\t\\tlet autoRunPermissions = await modules.fs.permissions((await modules.users.getUserInfo(userInfo.user, false, resolvedLogon.token)).homeDirectory + \\\"/.autorunNecessity\\\", resolvedLogon.token);\\n\\t\\t\\t\\tif (autoRunPermissions.owner != userInfo.user && !userInfo.groups.includes(autoRunPermissions.group) && !(autoRunPermissions.world.includes(\\\"r\\\") && autoRunPermissions.world.includes(\\\"x\\\")) && !userInfo.privileges.includes(\\\"FS_BYPASS_PERMISSIONS\\\")) {\\n\\t\\t\\t\\t\\tthrow new Error(\\\"Permission denied reading autorun necessities\\\");\\n\\t\\t\\t\\t}\\n\\t\\t\\t\\tif (modules.core.bootMode != \\\"safe\\\") autoRunNecessities = await modules.fs.ls((await modules.users.getUserInfo(userInfo.user, false, resolvedLogon.token)).homeDirectory + \\\"/.autorunNecessity\\\", resolvedLogon.token);\\n\\t\\t\\t} catch (e) {\\n\\t\\t\\t\\tconsole.error(\\\"Failed to read autorun necessities:\\\", e);\\n\\t\\t\\t}\\n\\t\\t\\tfunction breakNecessityFailure() {\\n\\t\\t\\t\\tlet failureMessage = modules.window(session);\\n\\t\\t\\t\\tfailureMessage.title.innerText = modules.locales.get(\\\"PERMISSION_DENIED\\\", locale);\\n\\t\\t\\t\\tfailureMessage.content.style.padding = \\\"8px\\\";\\n\\t\\t\\t\\tfailureMessage.content.innerText = modules.locales.get(\\\"AUTORUN_NECESSITIES_FAILED\\\", locale);\\n\\t\\t\\t\\tfailureMessage.closeButton.onclick = async function() {\\n\\t\\t\\t\\t\\tfailureMessage.windowDiv.remove();\\n\\t\\t\\t\\t\\tawait modules.logOut(userInfo.user);\\n\\t\\t\\t\\t}\\n\\t\\t\\t}\\n\\t\\t\\tfor (let autoRunNecessity of autoRunNecessities) {\\n\\t\\t\\t\\tlet necessityPermissions = await modules.fs.permissions((await modules.users.getUserInfo(userInfo.user, false, resolvedLogon.token)).homeDirectory + \\\"/.autorunNecessity/\\\" + autoRunNecessity, resolvedLogon.token);\\n\\t\\t\\t\\tif (necessityPermissions.owner != userInfo.user && !userInfo.groups.includes(necessityPermissions.group) && !(necessityPermissions.world.includes(\\\"r\\\") && necessityPermissions.world.includes(\\\"x\\\")) && !userInfo.privileges.includes(\\\"FS_BYPASS_PERMISSIONS\\\")) {\\n\\t\\t\\t\\t\\treturn breakNecessityFailure();\\n\\t\\t\\t\\t}\\n\\t\\t\\t\\tlet link = await modules.fs.read((await modules.users.getUserInfo(userInfo.user, false, resolvedLogon.token)).homeDirectory + \\\"/.autorunNecessity/\\\" + autoRunNecessity, resolvedLogon.token);\\n\\t\\t\\t\\ttry {\\n\\t\\t\\t\\t\\tlink = JSON.parse(link);\\n\\t\\t\\t\\t} catch (e) {\\n\\t\\t\\t\\t\\tconsole.error(\\\"Failed to parse autorun necessity:\\\", e);\\n\\t\\t\\t\\t\\treturn breakNecessityFailure();\\n\\t\\t\\t\\t}\\n\\t\\t\\t\\tif (link.disabled) continue;\\n\\t\\t\\t\\ttry {\\n\\t\\t\\t\\t\\tlet ipcPipe = modules.ipc.create();\\n\\t\\t\\t\\t\\tmodules.ipc.declareAccess(ipcPipe, {\\n\\t\\t\\t\\t\\t\\towner: userInfo.user,\\n\\t\\t\\t\\t\\t\\tgroup: userInfo.groups[0],\\n\\t\\t\\t\\t\\t\\tworld: false\\n\\t\\t\\t\\t\\t});\\n\\t\\t\\t\\t\\tlet forkedToken;\\n\\t\\t\\t\\t\\tif (link.automaticLogon) {\\n\\t\\t\\t\\t\\t\\ttry {\\n\\t\\t\\t\\t\\t\\t\\tlet logon = await modules.users.access(link.automaticLogon.username, resolvedLogon.token);\\n\\t\\t\\t\\t\\t\\t\\tlogon = await logon.getNextPrompt();\\n\\t\\t\\t\\t\\t\\t\\tfor (let response of link.automaticLogon.responses)\\n\\t\\t\\t\\t\\t\\t\\t\\tif (logon.success == \\\"intermediate\\\") logon = await logon.input(response);\\n\\t\\t\\t\\t\\t\\t\\tif (!logon.success) throw new Error(logon.message);\\n\\t\\t\\t\\t\\t\\t\\tforkedToken = logon.token;\\n\\t\\t\\t\\t\\t\\t} catch {}\\n\\t\\t\\t\\t\\t\\tif (necessityPermissions.world.includes(\\\"r\\\") && forkedToken) {\\n\\t\\t\\t\\t\\t\\t\\tlet ownUser = await modules.tokens.info(forkedToken);\\n\\t\\t\\t\\t\\t\\t\\tlet ownUserInfo = await modules.users.getUserInfo(ownUser.user, true, forkedToken);\\n\\t\\t\\t\\t\\t\\t\\townUserInfo.securityChecks = [];\\n\\t\\t\\t\\t\\t\\t\\tawait modules.users.moduser(ownUser.user, ownUserInfo, forkedToken);\\n\\t\\t\\t\\t\\t\\t\\tawait modules.tokens.revoke(forkedToken);\\n\\t\\t\\t\\t\\t\\t\\tforkedToken = null;\\n\\t\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t\\tif (!forkedToken) forkedToken = await modules.tokens.fork(resolvedLogon.token);\\n\\t\\t\\t\\t\\tlet appWindow = modules.window(session);\\n\\t\\t\\t\\t\\tlet ipcResult = modules.ipc.listenFor(ipcPipe);\\n\\t\\t\\t\\t\\tlet taskId = await modules.tasks.exec(link.path, [ ...(link.args || []), ipcPipe ], appWindow, forkedToken, true);\\n\\t\\t\\t\\t\\tlet finishTaskPromise = new Promise(function(resolve) {\\n\\t\\t\\t\\t\\t\\tmodules.tasks.tracker[taskId].ree.beforeCloseDown(() => resolve());\\n\\t\\t\\t\\t\\t})\\n\\t\\t\\t\\t\\tipcResult = await Promise.race([ipcResult, finishTaskPromise]);\\n\\t\\t\\t\\t\\tif (!ipcResult) throw new Error(\\\"Software rejected autorun necessity.\\\");\\n\\t\\t\\t\\t\\tif (modules.tasks.tracker.hasOwnProperty(taskId)) await modules.tasks.sendSignal(taskId, 9);\\n\\t\\t\\t\\t} catch (e) {\\n\\t\\t\\t\\t\\tconsole.error(\\\"Failed to execute autorun necessity:\\\", e);\\n\\t\\t\\t\\t\\treturn breakNecessityFailure();\\n\\t\\t\\t\\t}\\n\\t\\t\\t}\\n\\t\\t\\t\\n\\t\\t\\tlet autoRun = [];\\n\\t\\t\\ttry {\\n\\t\\t\\t\\tlet autoRunPermissions = await modules.fs.permissions((await modules.users.getUserInfo(userInfo.user, false, resolvedLogon.token)).homeDirectory + \\\"/.autorun\\\", resolvedLogon.token);\\n\\t\\t\\t\\tif (autoRunPermissions.owner != userInfo.user && !userInfo.groups.includes(autoRunPermissions.group) && !(autoRunPermissions.world.includes(\\\"r\\\") && autoRunPermissions.world.includes(\\\"x\\\")) && !userInfo.privileges.includes(\\\"FS_BYPASS_PERMISSIONS\\\")) {\\n\\t\\t\\t\\t\\tthrow new Error(\\\"Permission denied reading autorun\\\");\\n\\t\\t\\t\\t}\\n\\t\\t\\t\\tif (modules.core.bootMode != \\\"safe\\\") autoRun = await modules.fs.ls((await modules.users.getUserInfo(userInfo.user, false, resolvedLogon.token)).homeDirectory + \\\"/.autorun\\\", resolvedLogon.token);\\n\\t\\t\\t} catch (e) {\\n\\t\\t\\t\\tconsole.error(\\\"Failed to read autorun:\\\", e);\\n\\t\\t\\t}\\n\\t\\t\\tfor (let autoRunFile of autoRun) {\\n\\t\\t\\t\\tlet autoRunItemPermissions = await modules.fs.permissions((await modules.users.getUserInfo(userInfo.user, false, resolvedLogon.token)).homeDirectory + \\\"/.autorun/\\\" + autoRunFile, resolvedLogon.token);\\n\\t\\t\\t\\tif (autoRunItemPermissions.owner != userInfo.user && !userInfo.groups.includes(autoRunItemPermissions.group) && !(autoRunItemPermissions.world.includes(\\\"r\\\") && autoRunItemPermissions.world.includes(\\\"x\\\")) && !userInfo.privileges.includes(\\\"FS_BYPASS_PERMISSIONS\\\")) continue;\\n\\t\\t\\t\\tlet link = await modules.fs.read((await modules.users.getUserInfo(userInfo.user, false, resolvedLogon.token)).homeDirectory + \\\"/.autorun/\\\" + autoRunFile, resolvedLogon.token);\\n\\t\\t\\t\\ttry {\\n\\t\\t\\t\\t\\tlink = JSON.parse(link);\\n\\t\\t\\t\\t} catch {}\\n\\t\\t\\t\\tif (link.disabled) continue;\\n\\t\\t\\t\\ttry {\\n\\t\\t\\t\\t\\tlet forkedToken;\\n\\t\\t\\t\\t\\tif (link.automaticLogon) {\\n\\t\\t\\t\\t\\t\\ttry {\\n\\t\\t\\t\\t\\t\\t\\tlet logon = await modules.users.access(link.automaticLogon.username, resolvedLogon.token);\\n\\t\\t\\t\\t\\t\\t\\tlogon = await logon.getNextPrompt();\\n\\t\\t\\t\\t\\t\\t\\tfor (let response of link.automaticLogon.responses)\\n\\t\\t\\t\\t\\t\\t\\t\\tif (logon.success == \\\"intermediate\\\") logon = await logon.input(response);\\n\\t\\t\\t\\t\\t\\t\\tif (!logon.success) throw new Error(logon.message);\\n\\t\\t\\t\\t\\t\\t\\tforkedToken = logon.token;\\n\\t\\t\\t\\t\\t\\t} catch {}\\n\\t\\t\\t\\t\\t\\tif (autoRunItemPermissions.world.includes(\\\"r\\\") && forkedToken) {\\n\\t\\t\\t\\t\\t\\t\\tlet ownUser = await modules.tokens.info(forkedToken);\\n\\t\\t\\t\\t\\t\\t\\tlet ownUserInfo = await modules.users.getUserInfo(ownUser.user, true, forkedToken);\\n\\t\\t\\t\\t\\t\\t\\townUserInfo.securityChecks = [];\\n\\t\\t\\t\\t\\t\\t\\tawait modules.users.moduser(ownUser.user, ownUserInfo, forkedToken);\\n\\t\\t\\t\\t\\t\\t\\tawait modules.tokens.revoke(forkedToken);\\n\\t\\t\\t\\t\\t\\t\\tforkedToken = null;\\n\\t\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t\\tif (!forkedToken) forkedToken = await modules.tokens.fork(resolvedLogon.token);\\n\\t\\t\\t\\t\\tlet appWindow = modules.window(session);\\n\\t\\t\\t\\t\\tawait modules.tasks.exec(link.path, [ ...(link.args || []) ], appWindow, forkedToken);\\n\\t\\t\\t\\t} catch {}\\n\\t\\t\\t}\\n\\n\\t\\t\\tlet icons = [];\\n\\t\\t\\tlet lastIconPlacement = [ 72, 72 ];\\n\\t\\t\\ttry {\\n\\t\\t\\t\\tlet permissions = await modules.fs.permissions((await modules.users.getUserInfo(userInfo.user, false, resolvedLogon.token)).homeDirectory + \\\"/desktop\\\", resolvedLogon.token);\\n\\t\\t\\t\\tif (permissions.owner != userInfo.user && !userInfo.groups.includes(permissions.group) && !(permissions.world.includes(\\\"r\\\") && permissions.world.includes(\\\"x\\\")) && !userInfo.privileges.includes(\\\"FS_BYPASS_PERMISSIONS\\\")) {\\n\\t\\t\\t\\t\\tthrow new Error(\\\"Permission denied reading desktop icons\\\");\\n\\t\\t\\t\\t}\\n\\t\\t\\t\\ticons = await modules.fs.ls((await modules.users.getUserInfo(userInfo.user, false, resolvedLogon.token)).homeDirectory + \\\"/desktop\\\", resolvedLogon.token);\\n\\t\\t\\t} catch (e) {\\n\\t\\t\\t\\tconsole.error(\\\"Failed to read desktop icons:\\\", e);\\n\\t\\t\\t}\\n\\t\\t\\tfor (let icon of icons) {\\n\\t\\t\\t\\tif (icon.split(\\\"/\\\").slice(-1)[0].startsWith(\\\".\\\")) continue;\\n\\t\\t\\t\\ttry {\\n\\t\\t\\t\\t\\tlet iconPath = (await modules.users.getUserInfo(userInfo.user, false, resolvedLogon.token)).homeDirectory + \\\"/desktop/\\\" + icon;\\n\\t\\t\\t\\t\\tlet permissions = await modules.fs.permissions(iconPath, resolvedLogon.token);\\n\\t\\t\\t\\t\\tif (permissions.owner != userInfo.user && !userInfo.groups.includes(permissions.group) && !permissions.world.includes(\\\"r\\\") && !userInfo.privileges.includes(\\\"FS_BYPASS_PERMISSIONS\\\")) {\\n\\t\\t\\t\\t\\t\\tthrow new Error(\\\"Permission denied reading desktop icon\\\");\\n\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t\\tlet isDir = await modules.fs.isDirectory(iconPath, resolvedLogon.token);\\n\\t\\t\\t\\t\\tlet linkName = iconPath.split(\\\"/\\\").slice(-1)[0];\\n\\t\\t\\t\\t\\tlet appLink = { path: modules.defaultSystem + \\\"/apps/explorer.js\\\", args: [ iconPath ], name: linkName, placed: lastIconPlacement, icon: modules.defaultSystem + \\\"/etc/icons/fileicon.pic\\\" };\\n\\t\\t\\t\\t\\tif (!isDir) {\\n\\t\\t\\t\\t\\t\\tif (linkName.endsWith(\\\".lnk\\\")) {\\n\\t\\t\\t\\t\\t\\t\\ttry {\\n\\t\\t\\t\\t\\t\\t\\t\\tappLink = { placed: lastIconPlacement, icon: modules.defaultSystem + \\\"/etc/icons/lnk.pic\\\", ...(JSON.parse(await modules.fs.read(iconPath, resolvedLogon.token))) };\\n\\t\\t\\t\\t\\t\\t\\t\\tappLink._isRealLink = true;\\n\\t\\t\\t\\t\\t\\t\\t} catch {}\\n\\t\\t\\t\\t\\t\\t} else {\\n\\t\\t\\t\\t\\t\\t\\tlet ext = linkName.split(\\\".\\\").slice(-1)[0];\\n\\t\\t\\t\\t\\t\\t\\tappLink.icon = modules.defaultSystem + \\\"/etc/icons/\\\" + ext + \\\".pic\\\";\\n\\t\\t\\t\\t\\t\\t\\tlet assocsPermissions = await modules.fs.permissions(modules.defaultSystem + \\\"/apps/associations\\\", resolvedLogon.token);\\n\\t\\t\\t\\t\\t\\t\\tif (assocsPermissions.owner != userInfo.user && !userInfo.groups.includes(assocsPermissions.group) && !(assocsPermissions.world.includes(\\\"r\\\") && assocsPermissions.world.includes(\\\"x\\\")) && !userInfo.privileges.includes(\\\"FS_BYPASS_PERMISSIONS\\\")) {\\n\\t\\t\\t\\t\\t\\t\\t\\tthrow new Error(\\\"Permission denied reading associations\\\");\\n\\t\\t\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t\\t\\t\\tlet associations = await modules.fs.ls(modules.defaultSystem + \\\"/apps/associations\\\", resolvedLogon.token);\\n\\t\\t\\t\\t\\t\\t\\tif (!associations.includes(ext)) appLink.disabled = true;\\n\\t\\t\\t\\t\\t\\t\\telse {\\n\\t\\t\\t\\t\\t\\t\\t\\tlet associationPermissions = await modules.fs.permissions(modules.defaultSystem + \\\"/apps/associations/\\\" + ext, resolvedLogon.token);\\n\\t\\t\\t\\t\\t\\t\\t\\tif (!associationPermissions.world.includes(\\\"r\\\") && !userInfo.groups.includes(associationPermissions.group) && associationPermissions.owner != userInfo.user && !userInfo.privileges.includes(\\\"FS_BYPASS_PERMISSIONS\\\")) {\\n\\t\\t\\t\\t\\t\\t\\t\\t\\tthrow new Error(\\\"Permission denied reading association\\\");\\n\\t\\t\\t\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t\\t\\t\\t\\tappLink = { placed: lastIconPlacement, icon: appLink.icon, ...(JSON.parse(await modules.fs.read(modules.defaultSystem + \\\"/apps/associations/\\\" + ext, resolvedLogon.token))) };\\n\\t\\t\\t\\t\\t\\t\\t\\tappLink.args = [ ...(appLink.args || []), iconPath ];\\n\\t\\t\\t\\t\\t\\t\\t\\tappLink.name = linkName;\\n\\t\\t\\t\\t\\t\\t\\t\\tdelete appLink.localeDatabaseName;\\n\\t\\t\\t\\t\\t\\t\\t\\tdelete appLink.localeReferenceName;\\n\\t\\t\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t\\tif (appLink.disabled) continue;\\n\\t\\t\\t\\t\\tif (isDir) appLink.icon = modules.defaultSystem + \\\"/etc/icons/foldericon.pic\\\";\\n\\t\\t\\t\\t\\tlet iconWindow = modules.window(session, false, true, async function(newx, newy) {\\n\\t\\t\\t\\t\\t\\tif (appLink._isRealLink) {\\n\\t\\t\\t\\t\\t\\t\\tappLink.placed = [ newx, newy ];\\n\\t\\t\\t\\t\\t\\t\\tdelete appLink._isRealLink;\\n\\t\\t\\t\\t\\t\\t\\tif (permissions.owner != userInfo.user && !userInfo.groups.includes(permissions.group) && !permissions.world.includes(\\\"w\\\") && !userInfo.privileges.includes(\\\"FS_BYPASS_PERMISSIONS\\\")) {\\n\\t\\t\\t\\t\\t\\t\\t\\tthrow new Error(\\\"Permission denied writing desktop icon\\\");\\n\\t\\t\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t\\t\\t\\tawait modules.fs.write(iconPath, JSON.stringify(appLink), resolvedLogon.token);\\n\\t\\t\\t\\t\\t\\t\\tappLink._isRealLink = true;\\n\\t\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t\\t});\\n\\t\\t\\t\\t\\ticonWindow.title.innerText = (appLink.localeReferenceName ? modules.locales.get(appLink.localeReferenceName, locale) : null) || (appLink.localeDatabaseName ? (appLink.localeDatabaseName[locale] || appLink.localeDatabaseName[modules.locales.defaultLocale] || appLink.localeDatabaseName[navigator.language.slice(0, 2).toLowerCase()]) : null) || appLink.name;\\n\\t\\t\\t\\t\\tlet iconEl = document.createElement(\\\"img\\\");\\n\\t\\t\\t\\t\\ttry {\\n\\t\\t\\t\\t\\t\\tlet permissions = await modules.fs.permissions(appLink.icon, resolvedLogon.token);\\n\\t\\t\\t\\t\\t\\tif (permissions.owner != userInfo.user && !userInfo.groups.includes(permissions.group) && !permissions.world.includes(\\\"r\\\") && !userInfo.privileges.includes(\\\"FS_BYPASS_PERMISSIONS\\\")) {\\n\\t\\t\\t\\t\\t\\t\\tthrow new Error(\\\"Permission denied reading desktop icon picture\\\");\\n\\t\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t\\t\\ticonEl.src = await modules.fs.read(appLink.icon, resolvedLogon.token);\\n\\t\\t\\t\\t\\t} catch (e) {\\n\\t\\t\\t\\t\\t\\tconsole.error(\\\"Failed to read desktop icon picture:\\\", e);\\n\\t\\t\\t\\t\\t\\tcontinue;\\n\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t\\ticonEl.style = \\\"width: 100%; height: 100%; position: absolute;\\\";\\n\\t\\t\\t\\t\\ticonWindow.content.appendChild(iconEl);\\n\\t\\t\\t\\t\\ticonWindow.windowDiv.style.top = appLink.placed[1] + \\\"px\\\";\\n\\t\\t\\t\\t\\ticonWindow.windowDiv.style.left = appLink.placed[0] + \\\"px\\\";\\n\\t\\t\\t\\t\\ticonEl.addEventListener(\\\"click\\\", async function() {\\n\\t\\t\\t\\t\\t\\tlet forkedToken;\\n\\t\\t\\t\\t\\t\\tif (appLink.automaticLogon) {\\n\\t\\t\\t\\t\\t\\t\\ttry {\\n\\t\\t\\t\\t\\t\\t\\t\\tlet logon = await modules.users.access(appLink.automaticLogon.username, resolvedLogon.token);\\n\\t\\t\\t\\t\\t\\t\\t\\tlogon = await logon.getNextPrompt();\\n\\t\\t\\t\\t\\t\\t\\t\\tfor (let response of appLink.automaticLogon.responses)\\n\\t\\t\\t\\t\\t\\t\\t\\t\\tif (logon.success == \\\"intermediate\\\") logon = await logon.input(response);\\n\\t\\t\\t\\t\\t\\t\\t\\tif (!logon.success) throw new Error(logon.message);\\n\\t\\t\\t\\t\\t\\t\\t\\tforkedToken = logon.token;\\n\\t\\t\\t\\t\\t\\t\\t} catch {}\\n\\t\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t\\t\\tif (!forkedToken) forkedToken = await modules.tokens.fork(resolvedLogon.token);\\n\\t\\t\\t\\t\\t\\tlet appWindow = modules.window(session);\\n\\t\\t\\t\\t\\t\\tawait modules.tasks.exec(appLink.path, [ ...(appLink.args || []) ], appWindow, forkedToken);\\n\\t\\t\\t\\t\\t});\\n\\t\\t\\t\\t\\tlastIconPlacement = appLink.placed;\\n\\t\\t\\t\\t\\tlastIconPlacement[1] += 136;\\n\\t\\t\\t\\t\\tif (lastIconPlacement[1] > (dom.clientHeight - 136)) {\\n\\t\\t\\t\\t\\t\\tlastIconPlacement[0] += 136;\\n\\t\\t\\t\\t\\t\\tlastIconPlacement[1] = 72;\\n\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t} catch (e) {\\n\\t\\t\\t\\t\\tconsole.error(\\\"Failed to read desktop icon:\\\", e);\\n\\t\\t\\t\\t\\tcontinue;\\n\\t\\t\\t\\t}\\n\\t\\t\\t}\\n\\t\\t\\tlet startMenuChannel = modules.ipc.create();\\n\\t\\t\\tmodules.ipc.declareAccess(startMenuChannel, {\\n\\t\\t\\t\\towner: userInfo.user,\\n\\t\\t\\t\\tgroup: userInfo.groups[0],\\n\\t\\t\\t\\tworld: false\\n\\t\\t\\t});\\n\\t\\t\\tlet taskbar = document.createElement(\\\"div\\\");\\n\\t\\t\\tlet clock = document.createElement(\\\"span\\\");\\n\\t\\t\\tlet startButton = document.createElement(\\\"button\\\");\\n\\t\\t\\tlet startMenu = modules.window(session);\\n\\t\\t\\tlet forkedStartMenuToken = await modules.tokens.fork(resolvedLogon.token);\\n\\n\\t\\t\\tfunction startMenuStub() {\\n\\t\\t\\t\\tif (startMenu.windowDiv.parentElement == null) startMenu = modules.window(session);\\n\\t\\t\\t\\tstartMenu.windowDiv.classList.toggle(\\\"hidden\\\", true);\\n\\t\\t\\t\\tstartMenu.title.innerText = modules.locales.get(\\\"START_MENU\\\", locale);\\n\\t\\t\\t\\tstartMenu.content.style.padding = \\\"8px\\\";\\n\\t\\t\\t\\tstartMenu.content.innerText = \\\"\\\";\\n\\t\\t\\t\\tlet description = document.createElement(\\\"span\\\");\\n\\t\\t\\t\\tlet logout = document.createElement(\\\"button\\\");\\n\\t\\t\\t\\tdescription.innerText = modules.locales.get(\\\"START_MENU_FAILED\\\", locale);\\n\\t\\t\\t\\tlogout.innerText = modules.locales.get(\\\"LOG_OUT_BUTTON\\\", locale).replace(\\\"%s\\\", userInfo.user);\\n\\t\\t\\t\\tlogout.onclick = _ => modules.logOut(userInfo.user);\\n\\t\\t\\t\\tstartMenu.content.appendChild(description);\\n\\t\\t\\t\\tstartMenu.content.appendChild(document.createElement(\\\"br\\\"));\\n\\t\\t\\t\\tstartMenu.content.appendChild(logout);\\n\\t\\t\\t\\tstartMenu.closeButton.onclick = () => startMenu.windowDiv.classList.toggle(\\\"hidden\\\", true);\\n\\t\\t\\t\\tstartButton.onclick = _ => startMenu.windowDiv.classList.toggle(\\\"hidden\\\");\\n\\t\\t\\t}\\n\\n\\t\\t\\tstartMenuStub();\\n\\t\\t\\tstartButton.innerText = modules.locales.get(\\\"START_MENU_BTN\\\", locale);\\n\\t\\t\\tstartButton.style = \\\"padding: 4px;\\\";\\n\\t\\t\\ttry {\\n\\t\\t\\t\\tawait modules.tasks.exec(modules.defaultSystem + \\\"/apps/startMenu.js\\\", [], startMenu, forkedStartMenuToken, true, startMenuChannel);\\n\\t\\t\\t} catch (e) {\\n\\t\\t\\t\\tconsole.error(\\\"Failed to start start menu:\\\", e);\\n\\t\\t\\t\\tstartMenuStub();\\n\\t\\t\\t}\\n\\n\\t\\t\\t(async function() {\\n\\t\\t\\t\\twhile (true) {\\n\\t\\t\\t\\t\\tlet listen = await modules.ipc.listenFor(startMenuChannel);\\n\\t\\t\\t\\t\\tif (listen.run) {\\n\\t\\t\\t\\t\\t\\ttry {\\n\\t\\t\\t\\t\\t\\t\\tlet forkedToken;\\n\\t\\t\\t\\t\\t\\t\\tif (listen.run.automaticLogon) {\\n\\t\\t\\t\\t\\t\\t\\t\\ttry {\\n\\t\\t\\t\\t\\t\\t\\t\\t\\tlet logon = await modules.users.access(listen.run.automaticLogon.username, resolvedLogon.token);\\n\\t\\t\\t\\t\\t\\t\\t\\t\\tlogon = await logon.getNextPrompt();\\n\\t\\t\\t\\t\\t\\t\\t\\t\\tfor (let response of listen.run.automaticLogon.responses)\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tif (logon.success == \\\"intermediate\\\") logon = await logon.input(response);\\n\\t\\t\\t\\t\\t\\t\\t\\t\\tif (!logon.success) throw new Error(logon.message);\\n\\t\\t\\t\\t\\t\\t\\t\\t\\tforkedToken = logon.token;\\n\\t\\t\\t\\t\\t\\t\\t\\t} catch {}\\n\\t\\t\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t\\t\\t\\tif (!forkedToken) forkedToken = await modules.tokens.fork(resolvedLogon.token);\\n\\t\\t\\t\\t\\t\\t\\tlet appWindow = modules.window(session);\\n\\t\\t\\t\\t\\t\\t\\tawait modules.tasks.exec(listen.run.path, [ ...(listen.run.args || []) ], appWindow, forkedToken);\\n\\t\\t\\t\\t\\t\\t} catch {}\\n\\t\\t\\t\\t\\t} else if (listen.success) {\\n\\t\\t\\t\\t\\t\\tstartButton.onclick = () => modules.ipc.send(startMenuChannel, { open: true });\\n\\t\\t\\t\\t\\t} else if (listen.dying) {\\n\\t\\t\\t\\t\\t\\tstartMenu = modules.window(session);\\n\\t\\t\\t\\t\\t\\tstartMenuStub();\\n\\t\\t\\t\\t\\t\\tforkedStartMenuToken = await modules.tokens.fork(resolvedLogon.token);\\n\\t\\t\\t\\t\\t\\ttry {\\n\\t\\t\\t\\t\\t\\t\\tawait modules.tasks.exec(modules.defaultSystem + \\\"/apps/startMenu.js\\\", [], startMenu, forkedStartMenuToken, true, startMenuChannel);\\n\\t\\t\\t\\t\\t\\t} catch (e) {\\n\\t\\t\\t\\t\\t\\t\\tconsole.error(\\\"Failed to start start menu:\\\", e);\\n\\t\\t\\t\\t\\t\\t\\tstartMenuStub();\\n\\t\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t}\\n\\t\\t\\t})();\\n\\n\\t\\t\\ttaskbar.className = \\\"taskbar\\\";\\n\\t\\t\\tclock.className = \\\"clock\\\";\\n\\t\\t\\tlet filler = document.createElement(\\\"div\\\");\\n\\t\\t\\tfiller.className = \\\"filler\\\";\\n\\t\\t\\tlet battery = document.createElement(\\\"div\\\");\\n\\t\\t\\tlet networkIcon = document.createElement(\\\"div\\\");\\n\\t\\t\\tlet pcosNetworkIcon = document.createElement(\\\"div\\\");\\n\\t\\t\\tlet iconCache = {};\\n\\t\\t\\tfor (let iconFile of [\\\"network_\\\", \\\"network_offline_\\\", \\\"pcos_network_\\\", \\\"pcos_network_offline_\\\", \\\"readyToPlay_\\\", \\\"batteryChargeFinished_\\\", \\\"dying_\\\", \\\"charging_\\\"]) {\\n\\t\\t\\t\\ttry {\\n\\t\\t\\t\\t\\tlet permissions = await modules.fs.permissions(modules.defaultSystem + \\\"/etc/icons/\\\" + iconFile + \\\"icon.pic\\\", resolvedLogon.token);\\n\\t\\t\\t\\t\\tif (permissions.owner != userInfo.user && !userInfo.groups.includes(permissions.group) && !permissions.world.includes(\\\"r\\\") && !userInfo.privileges.includes(\\\"FS_BYPASS_PERMISSIONS\\\")) {\\n\\t\\t\\t\\t\\t\\tthrow new Error(\\\"Permission denied reading taskbar icon picture\\\");\\n\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t\\ticonCache[iconFile] = await modules.fs.read(modules.defaultSystem + \\\"/etc/icons/\\\" + iconFile + \\\"icon.pic\\\", resolvedLogon.token);\\n\\t\\t\\t\\t} catch (e) {\\n\\t\\t\\t\\t\\tconsole.error(\\\"Failed to read taskbar icon picture:\\\", e);\\n\\t\\t\\t\\t}\\n\\t\\t\\t}\\n\\n\\t\\t\\tlet toggle = false;\\n\\t\\t\\tclock.addEventListener(\\\"click\\\", _ => toggle = !toggle);\\n\\t\\t\\tliu[liuUser].clockInterval = setInterval(async function() {\\n\\t\\t\\t\\tclock.innerText = Intl.DateTimeFormat(locale, { timeStyle: toggle ? undefined : \\\"medium\\\" }).format()\\n\\t\\t\\t\\tnetworkIcon.style.backgroundImage = \\\"url(\\\" + JSON.stringify(navigator.onLine ? iconCache.network_ : iconCache.network_offline_) + \\\")\\\";\\n\\t\\t\\t\\tnetworkIcon.title = modules.locales.get(\\\"NETWORK_STATUS_\\\" + (navigator.onLine ? \\\"ONLINE\\\" : \\\"OFFLINE\\\"), locale)\\n\\t\\t\\t\\tpcosNetworkIcon.style.backgroundImage = \\\"url(\\\" + JSON.stringify(modules.network.connected ? iconCache.pcos_network_ : iconCache.pcos_network_offline_) + \\\")\\\";\\n\\t\\t\\t\\tpcosNetworkIcon.title = modules.locales.get(\\\"PCOS_NETWORK_STATUS_\\\" + (modules.network.connected ? \\\"ONLINE\\\" : \\\"OFFLINE\\\"), locale).replace(\\\"%s\\\", userInfo.privileges.includes(\\\"GET_HOSTNAME\\\") ? (modules.network.hostname || modules.locales.get(\\\"UNKNOWN_PLACEHOLDER\\\", locale)) : modules.locales.get(\\\"UNKNOWN_PLACEHOLDER\\\", locale)).replace(\\\"%s\\\", userInfo.privileges.includes(\\\"GET_NETWORK_ADDRESS\\\") ? (modules.network.address || \\\"0\\\").match(/.{1,4}/g).join(\\\":\\\") : modules.locales.get(\\\"UNKNOWN_PLACEHOLDER\\\", locale));\\n\\t\\t\\t\\tif (modules.network.serviceStopped) pcosNetworkIcon.title = modules.locales.get(\\\"PCOS_NETWORK_STATUS_STOPPED\\\", locale);\\n\\t\\t\\t\\tlet batteryStatus = {charging: true, chargingTime: 0, dischargingTime: 0, level: 1};\\n\\t\\t\\t\\tlet batteryStatusIcon = iconCache.readyToPlay_;\\n\\t\\t\\t\\tlet batteryStatusDescription = modules.locales.get(\\\"BATTERY_STATUS_UNAVAILABLE\\\", locale);\\n\\t\\t\\t\\tif (navigator.getBattery && userInfo.privileges.includes(\\\"GET_BATTERY_STATUS\\\")) {\\n\\t\\t\\t\\t\\tbatteryStatus = await navigator.getBattery();\\n\\t\\t\\t\\t\\tbatteryStatusDescription = modules.locales.get(\\\"BATTERY_STATUS_\\\" + (batteryStatus.charging ? \\\"CHARGING\\\" : \\\"DISCHARGING\\\"), locale)\\n\\t\\t\\t\\t\\t\\t.replace(\\\"%s\\\", (batteryStatus.level * 100).toFixed(2))\\n\\t\\t\\t\\t\\t\\t.replace(\\\"%s\\\", modules.userfriendliness.inconsiderateTime(\\n\\t\\t\\t\\t\\t\\t\\t(batteryStatus.charging ? batteryStatus.chargingTime : batteryStatus.dischargingTime) * 1000\\n\\t\\t\\t\\t\\t\\t));\\n\\t\\t\\t\\t\\tif (batteryStatus.level < 0.2) batteryStatusIcon = iconCache.dying_;\\n\\t\\t\\t\\t\\tif (batteryStatus.charging) batteryStatusIcon = batteryStatus.level == 1 ? iconCache.batteryChargeFinished_ : iconCache.charging_;\\n\\t\\t\\t\\t}\\n\\t\\t\\t\\tbattery.style.backgroundImage = \\\"url(\\\" + JSON.stringify(batteryStatusIcon) + \\\")\\\";\\n\\t\\t\\t\\tbattery.title = batteryStatusDescription;\\n\\t\\t\\t}, 500);\\n\\t\\t\\t\\n\\t\\t\\tbattery.className = \\\"icon\\\";\\n\\t\\t\\tnetworkIcon.className = \\\"icon\\\";\\n\\t\\t\\tpcosNetworkIcon.className = \\\"icon\\\";\\n\\t\\t\\ttaskbar.appendChild(startButton);\\n\\t\\t\\ttaskbar.appendChild(filler);\\n\\t\\t\\ttaskbar.appendChild(battery);\\n\\t\\t\\ttaskbar.appendChild(networkIcon);\\n\\t\\t\\ttaskbar.appendChild(pcosNetworkIcon);\\n\\t\\t\\ttaskbar.appendChild(clock);\\n\\t\\t\\tdom.appendChild(taskbar);\\n\\t\\t}\\n\\t}\\n\\twhile (!modules.shuttingDown) {\\n\\t\\tlet useDefaultUser = await modules.fs.permissions(modules.defaultSystem + \\\"/etc/security/automaticLogon\\\");\\n\\t\\tuseDefaultUser = !useDefaultUser.world.includes(\\\"w\\\");\\n\\t\\tlet defaultUser;\\n\\t\\ttry {\\n\\t\\t\\tif (useDefaultUser) defaultUser = await modules.fs.read(modules.defaultSystem + \\\"/etc/security/automaticLogon\\\");\\n\\t\\t} catch {}\\n\\t\\tlet sysDom = modules.session.tracker[modules.session.systemSession].html;\\n\\t\\tlet lockWallpaper = \\\"\\\";\\n\\t\\tlet lockIsDark = false;\\n\\t\\ttry {\\n\\t\\t\\tlockWallpaper = await modules.fs.read(modules.defaultSystem + \\\"/etc/wallpapers/lockscreen.pic\\\");\\n\\t\\t} catch (e) {\\n\\t\\t\\tconsole.error(\\\"Failed to read lockscreen.pic:\\\", e);\\n\\t\\t}\\n\\t\\ttry {\\n\\t\\t\\tlockIsDark = (await modules.fs.read(modules.defaultSystem + \\\"/etc/darkLockScreen\\\")) == \\\"true\\\";\\n\\t\\t} catch (e) {\\n\\t\\t\\tconsole.error(\\\"Failed to read darkLockScreen:\\\", e);\\n\\t\\t}\\n\\t\\tif (modules.core.bootMode == \\\"safe\\\") {\\n\\t\\t\\tlockIsDark = true;\\n\\t\\t\\tlockWallpaper = \\\"\\\";\\n\\t\\t\\tif (!insertedLockMessage) {\\n\\t\\t\\t\\tinsertedLockMessage = true;\\n\\t\\t\\t\\tlet message = document.createElement(\\\"span\\\");\\n\\t\\t\\t\\tmessage.innerText = modules.locales.get(\\\"SAFE_MODE_MSG\\\");\\n\\t\\t\\t\\tmessage.style = \\\"position: absolute; right: 8px; bottom: 8px; color: white;\\\";\\n\\t\\t\\t\\tsysDom.appendChild(message);\\n\\t\\t\\t\\tlet message2 = document.createElement(\\\"span\\\");\\n\\t\\t\\t\\tmessage2.innerText = modules.locales.get(\\\"SAFE_MODE_MSG\\\");\\n\\t\\t\\t\\tmessage2.style = \\\"position: absolute; top: 8px; left: 8px; color: white;\\\";\\n\\t\\t\\t\\tsysDom.appendChild(message2);\\n\\t\\t\\t}\\n\\t\\t}\\n\\t\\tif (modules.core.bootMode == \\\"disable-harden\\\" && !insertedLockMessage) {\\n\\t\\t\\tinsertedLockMessage = true;\\n\\t\\t\\tlet message = document.createElement(\\\"span\\\");\\n\\t\\t\\tmessage.innerText = modules.locales.get(\\\"INSECURE_MODE_MSG\\\");\\n\\t\\t\\tmessage.style = \\\"position: absolute; right: 8px; bottom: 8px; color: white;\\\";\\n\\t\\t\\tsysDom.appendChild(message);\\n\\t\\t\\tlet message2 = document.createElement(\\\"span\\\");\\n\\t\\t\\tmessage2.innerText = modules.locales.get(\\\"INSECURE_MODE_MSG\\\");\\n\\t\\t\\tmessage2.style = \\\"position: absolute; top: 8px; left: 8px; color: white;\\\";\\n\\t\\t\\tsysDom.appendChild(message2);\\n\\t\\t}\\n\\t\\tsysDom.style.background = \\\"url(\\\" + JSON.stringify(lockWallpaper) + \\\")\\\";\\n\\t\\tif (modules.core.bootMode == \\\"safe\\\") sysDom.style.background = \\\"black\\\";\\n\\t\\tsysDom.style.backgroundSize = \\\"100% 100%\\\";\\n\\t\\tmodules.session.attrib(modules.session.systemSession, \\\"dark\\\", lockIsDark);\\n\\t\\tlet logon, resolvedLogon;\\n\\t\\twhile (!modules.shuttingDown) {\\n\\t\\t\\tlogon = await modules.authui(modules.session.systemSession, defaultUser, undefined, true);\\n\\t\\t\\tresolvedLogon = await waitForLogon(logon);\\n\\t\\t\\tif (resolvedLogon.success) break;\\n\\t\\t}\\n\\t\\tif (!resolvedLogon.success) break;\\n\\t\\thandleLogin(resolvedLogon, liu);\\n\\t\\tif (useDefaultUser && defaultUser) {\\n\\t\\t\\tlet newWindow = modules.window(modules.session.systemSession);\\n\\t\\t\\tnewWindow.title.innerText = modules.locales.get(\\\"LOG_IN_INVITATION\\\");\\n\\t\\t\\tlet button = document.createElement(\\\"button\\\");\\n\\t\\t\\tbutton.innerText = modules.locales.get(\\\"LOG_IN_INVITATION\\\");\\n\\t\\t\\tnewWindow.content.appendChild(button);\\n\\t\\t\\tnewWindow.closeButton.classList.toggle(\\\"hidden\\\", true);\\n\\t\\t\\tawait hookButtonClick(button);\\n\\t\\t\\tnewWindow.windowDiv.remove();\\n\\t\\t}\\n\\t}\\n}\\n\\nasync function serviceLogon() {\\n\\tlet session = modules.session.mksession();\\n\\tmodules.session.attrib(session, \\\"dark\\\", true);\\n\\tlet dom = modules.session.tracker[session].html;\\n\\tdom.style.backgroundColor = \\\"black\\\";\\n\\tlet message = document.createElement(\\\"span\\\");\\n\\tmessage.innerText = \\\"Service Desktop\\\";\\n\\tmessage.style = \\\"position: absolute; right: 8px; bottom: 8px; color: white;\\\";\\n\\tdom.appendChild(message);\\n\\tlet startButton = document.createElement(\\\"button\\\");\\n\\tstartButton.innerText = modules.locales.get(\\\"START_MENU_BTN\\\");\\n\\tstartButton.style = \\\"padding: 4px;\\\";\\n\\tstartButton.onclick = async function() {\\n\\t\\tlet startMenu = modules.window(session);\\n\\t\\tstartMenu.title.innerText = modules.locales.get(\\\"START_MENU\\\");\\n\\t\\tstartMenu.content.style.padding = \\\"8px\\\";\\n\\t\\tstartMenu.closeButton.onclick = () => startMenu.windowDiv.remove();\\n\\t\\tlet lockButton = document.createElement(\\\"button\\\");\\n\\t\\tlockButton.innerText = modules.locales.get(\\\"LOCK_BUTTON\\\");\\n\\t\\tstartMenu.content.appendChild(lockButton);\\n\\t\\tlockButton.onclick = async function() {\\n\\t\\t\\tstartMenu.windowDiv.remove();\\n\\t\\t\\tawait modules.session.muteAllSessions();\\n\\t\\t\\tawait modules.session.activateSession(modules.session.systemSession);\\n\\t\\t}\\n\\t}\\n\\tlet taskbar = document.createElement(\\\"div\\\");\\n\\ttaskbar.className = \\\"taskbar\\\";\\n\\n\\ttaskbar.appendChild(startButton);\\n\\tdom.appendChild(taskbar);\\n\\tmodules.serviceSession = session;\\n\\tif (modules.core.bootMode != \\\"safe\\\") {\\n\\t\\tlet serviceList = [];\\n\\t\\ttry {\\n\\t\\t\\tserviceList = await modules.fs.ls(modules.defaultSystem + \\\"/apps/services\\\");\\n\\t\\t} catch (e) {\\n\\t\\t\\tconsole.error(\\\"Failed to list services:\\\", e);\\n\\t\\t}\\n\\t\\tfor (let service of serviceList) {\\n\\t\\t\\tlet serviceConfig;\\n\\t\\t\\tlet triggerPasswordReset = false;\\n\\t\\t\\ttry {\\n\\t\\t\\t\\tlet permissions = await modules.fs.permissions(modules.defaultSystem + \\\"/apps/services/\\\" + service);\\n\\t\\t\\t\\tif (permissions.world.includes(\\\"r\\\")) triggerPasswordReset = true;\\n\\t\\t\\t} catch {}\\n\\t\\t\\ttry {\\n\\t\\t\\t\\tserviceConfig = await modules.fs.read(modules.defaultSystem + \\\"/apps/services/\\\" + service);\\n\\t\\t\\t\\tserviceConfig = JSON.parse(serviceConfig);\\n\\t\\t\\t} catch (e) {\\n\\t\\t\\t\\tconsole.error(\\\"Failed to read service config of\\\", service, \\\":\\\", e);\\n\\t\\t\\t\\tcontinue;\\n\\t\\t\\t}\\n\\t\\t\\tif (serviceConfig.disabled) continue;p\\n\\t\\t\\tlet serviceName = (serviceConfig.localeReferenceName ? modules.locales.get(serviceConfig.localeReferenceName) : null) || (serviceConfig.localeDatabaseName ? (serviceConfig.localeDatabaseName[navigator.language.slice(0, 2).toLowerCase()] || serviceConfig.localeDatabaseName[modules.locales.defaultLocale]) : null) || serviceConfig.name;\\n\\t\\t\\tif (!serviceConfig.automaticLogon) {\\n\\t\\t\\t\\tconsole.error(\\\"Service\\\", serviceName, \\\"(\\\", service, \\\") does not have logon credentials set\\\");\\n\\t\\t\\t\\tcontinue;\\n\\t\\t\\t}\\n\\t\\t\\tlet forkedToken;\\n\\t\\t\\ttry {\\n\\t\\t\\t\\tlet logon = await modules.users.access(serviceConfig.automaticLogon.username);\\n\\t\\t\\t\\tlogon = await logon.getNextPrompt();\\n\\t\\t\\t\\tfor (let response of serviceConfig.automaticLogon.responses)\\n\\t\\t\\t\\t\\tif (logon.success == \\\"intermediate\\\") logon = await logon.input(response);\\n\\t\\t\\t\\tif (!logon.success) throw new Error(logon.message);\\n\\t\\t\\t\\tforkedToken = logon.token;\\n\\t\\t\\t} catch (e) {\\n\\t\\t\\t\\tconsole.error(\\\"Failed to create a logon session for\\\", serviceName, \\\"(\\\", service, \\\"):\\\", e);\\n\\t\\t\\t\\tcontinue;\\n\\t\\t\\t}\\n\\t\\t\\tif (triggerPasswordReset) {\\n\\t\\t\\t\\tlet ownUser = await modules.tokens.info(forkedToken);\\n\\t\\t\\t\\tlet ownUserInfo = await modules.users.getUserInfo(ownUser.user, true, forkedToken);\\n\\t\\t\\t\\townUserInfo.securityChecks = [];\\n\\t\\t\\t\\tawait modules.users.moduser(ownUser.user, ownUserInfo, forkedToken);\\n\\t\\t\\t\\tawait modules.tokens.revoke(forkedToken);\\n\\t\\t\\t\\tconsole.error(\\\"Exposed credentials for\\\", serviceName, \\\"(\\\", service, \\\") have been made invalid\\\");\\n\\t\\t\\t\\tcontinue;\\n\\t\\t\\t}\\n\\t\\t\\ttry {\\n\\t\\t\\t\\tawait modules.tasks.exec(serviceConfig.path, [ ...(serviceConfig.args || []) ], modules.window(session), forkedToken, true);\\n\\t\\t\\t} catch (e) {\\n\\t\\t\\t\\tconsole.error(\\\"Failed to start service\\\", serviceName, \\\"(\\\", service, \\\"):\\\", e);\\n\\t\\t\\t}\\n\\t\\t}\\n\\t}\\n}\\n\\nfunction waitForLogon(toHook) {\\n\\treturn new Promise(function(resolve) {\\n\\t\\ttoHook.hook(resolve);\\n\\t});\\n}\\n\\nasync function hookButtonClick(button) {\\n\\treturn new Promise(function(resolve) {\\n\\t\\tbutton.onclick = (e) => resolve(e);\\n\\t});\\n}\",\"840d094c3da2a3291eeb7a3beede154be129870b011f11a48ac389eac3088315d942b35b902b46b732cb9d60642186397bfd4c787ed9ecf33348da276f23b4b4\":\"requireLogon();\",\"79b081d179fa02d6bc1df1631aec83bd2b5d2cadf22d344d0947b896cf5be4ed3c94701633fe8aab3d5654c5a8f0c8054d758a4873d311ad1deef532d26ca6d5\":\"function systemKillWaiter() {\\n\\t// @pcos-app-mode native\\n\\tmodules.startupWindow.windowDiv.remove();\\n\\treturn new Promise(function(resolve) {\\n\\t\\tmodules.killSystem = resolve;\\n\\t});\\n}\\nreturn await systemKillWaiter();\"},\"buildInfo\":{\"for\":\"1298\",\"when\":1750440209963,\"signer\":\"moduleSigner\",\"critical\":true,\"signature\":\"e8de649ab529dbc9518b30655e5319d66c08bc023991857391a910474cad5f77c149784058e175d66e76f35fa59eb0ddd93147b86fbea3e265a39cf3d5e53f72\"}}");
// modules/50-core.fs
modules.fs.write(".installer/modules/50-core.fs", "{\"backend\":{\"files\":{\"apps\":{\"associations\":{\"txt\":\"d1b483722fd7db81aa2252ee818c2caf37caacc1ab0202e088bf28de43b1b3bb8e795ed0a007a7ef130116491544502457b06569c4db9e8705e9f09ce21215ef\"},\"authui.js\":\"a23e206cb3522482bbb9bce7f2c436e2ed10554fd474f90df84b8243fe4aedea2f536b4f32d780d3224f4291f23a1aa898207bfc0571ef217dd9ace87d90405d\",\"consentui.js\":\"cd486b5218a67c8dd6791e6f012e6bde24bd990cfca18fd3f1ddb89664652a2dabc362224996068241792488344d6a8880084f86c4597a8ddaf20a248ee9765a\",\"explorer.js\":\"f487ee1000d9455505a50c5647df0fdb1108aca5ed98064d610a8a7c8da6842a062365e8f6f1a07a96a223d6375e730d2ce94277fda96e436c30db5dc7796771\",\"filePicker.js\":\"52e6ce82fde2238fed97121f1d90b48342216246dc7443952b63adc4ca91150e47caf618b643eecaeae819a0d5d803ac64f9b1e6a91127d3eef5fe0652725604\",\"links\":{\"explorer.lnk\":\"c2195c06898aa3ee8f4055778d4e189afd8bae234fc25cfc56d2805059ba6102a0dc29e0a45759693d035e74bb33fbcd6ccaba422800045fffedc22742b934f9\",\"textEditor.lnk\":\"5132780bcc24a9d663f876551a891df544c4e22ecc37426432ae43861a9e88f63ddaad2c47f9e0d76dca6d13a4bf003b03782f7fc2a7cbece15bcf4dbde0135d\"},\"startMenu.js\":\"53f5e30b81fbbc35e929208fb6711ec351ccb1ff3b6987bb72d9bf90f729d86fa8f482651e9b6b2a82a05cd2f0b3e58e8822ae3f14c5a630c5afeae9f2e6efb7\",\"textEditor.js\":\"b54a69ffe6d84e0f8ffe5f80ebf0293ca3cf847acf932756bea12fe083c356cc334a2faa131e5faffc239803666570d3ba07fb9a189b982fa799a9612439834a\"},\"etc\":{\"tlds.json\":\"b2afc16aaeebd8d235d683a3a77dd6316b1b96c40b5f4ce7e0a9ae4223c29e1cf5992d0b691823f72cdd855edc42b16d1ede127e61e37fbf3a57829fed13676c\"}},\"permissions\":{\"apps/associations/txt\":{\"world\":\"rx\"},\"apps/associations/\":{\"world\":\"rx\"},\"apps/authui.js\":{\"world\":\"rx\"},\"apps/consentui.js\":{\"world\":\"rx\"},\"apps/explorer.js\":{\"world\":\"rx\"},\"apps/filePicker.js\":{\"world\":\"rx\"},\"apps/links/explorer.lnk\":{\"world\":\"rx\"},\"apps/links/textEditor.lnk\":{\"world\":\"rx\"},\"apps/links/\":{\"world\":\"rx\"},\"apps/startMenu.js\":{\"world\":\"rx\"},\"apps/textEditor.js\":{\"world\":\"rx\"},\"apps/\":{\"world\":\"rx\"},\"etc/tlds.json\":{\"world\":\"rx\"},\"etc/\":{\"world\":\"rx\"},\"\":{\"world\":\"rx\"}}},\"files\":{\"d1b483722fd7db81aa2252ee818c2caf37caacc1ab0202e088bf28de43b1b3bb8e795ed0a007a7ef130116491544502457b06569c4db9e8705e9f09ce21215ef\":\"{\\\"path\\\":\\\"system/apps/textEditor.js\\\",\\\"localeReferenceName\\\":\\\"TEXT_EDITOR\\\"}\",\"a23e206cb3522482bbb9bce7f2c436e2ed10554fd474f90df84b8243fe4aedea2f536b4f32d780d3224f4291f23a1aa898207bfc0571ef217dd9ace87d90405d\":\"// =====BEGIN MANIFEST=====\\n// signer: automaticSigner\\n// allow: IPC_SEND_PIPE, GET_LOCALE, GET_THEME, ELEVATE_PRIVILEGES, CSP_OPERATIONS\\n// signature: 66c17ceb212d5e0287ae62c338ffd38a8d18f950f7bae63b27a9aad879e50fbfc1b28c9c15f5f4eceddc956fe58cbdce96f4aae11f6594bad77877ccfe095323\\n// =====END MANIFEST=====\\n\\nlet ipc;\\n(async function() {\\n\\t// @pcos-app-mode isolatable\\n\\texec_args = await availableAPIs.getPrivateData() || [];\\n\\tif (!(exec_args instanceof Array)) return availableAPIs.terminate();\\n\\tipc = exec_args[0];\\n\\tif (!ipc) return availableAPIs.terminate();\\n\\tlet user = exec_args[1];\\n\\tawait availableAPIs.windowTitleSet(await availableAPIs.lookupLocale(\\\"LOG_IN_INVITATION\\\"));\\n\\tlet checklist = [ \\\"IPC_SEND_PIPE\\\", \\\"GET_LOCALE\\\", \\\"GET_THEME\\\", \\\"ELEVATE_PRIVILEGES\\\", \\\"CSP_OPERATIONS\\\" ];\\n\\tlet privileges = await availableAPIs.getPrivileges();\\n\\tif (!checklist.every(p => privileges.includes(p))) {\\n\\t\\tif (privileges.includes(\\\"IPC_SEND_PIPE\\\")) await availableAPIs.sendToPipe({ pipe: ipc, data: { success: false, cancelled: false } });\\n\\t\\treturn availableAPIs.terminate();\\n\\t}\\n\\tdocument.body.style.fontFamily = \\\"'Segoe UI', Tahoma, Geneva, Verdana, sans-serif\\\";\\n\\tif (await availableAPIs.isDarkThemed()) document.body.style.color = \\\"white\\\";\\n\\tlet describe = document.createElement(\\\"b\\\");\\n\\tlet form = document.createElement(\\\"form\\\");\\n\\tlet input = document.createElement(\\\"input\\\");\\n\\tlet submit = document.createElement(\\\"button\\\");\\n\\tdocument.body.appendChild(describe);\\n\\tdocument.body.appendChild(document.createElement(\\\"br\\\"));\\n\\tdocument.body.appendChild(form);\\n\\tform.appendChild(input);\\n\\tform.appendChild(submit);\\n\\tsubmit.innerText = await availableAPIs.lookupLocale(\\\"ENTER_BUTTON\\\");\\n\\tdescribe.innerText = await availableAPIs.lookupLocale(\\\"USERNAME_PROMPT\\\");\\n\\tinput.placeholder = await availableAPIs.lookupLocale(\\\"USERNAME\\\");\\n\\tasync function userSubmit(e) {\\n\\t\\te.stopImmediatePropagation();\\n\\t\\te.preventDefault();\\n\\t\\te.stopPropagation();\\n\\t\\tlet userLogonSession;\\n\\t\\tlet userLogonID;\\n\\t\\tlet desired_username = input.value;\\n\\t\\ttry {\\n\\t\\t\\tuserLogonID = await availableAPIs.automatedLogonCreate({ desiredUser: desired_username });\\n\\t\\t\\tuserLogonSession = await availableAPIs.automatedLogonGet(userLogonID);\\n\\t\\t} catch {\\n\\t\\t\\tdescribe.innerText = await availableAPIs.lookupLocale(\\\"AUTH_FAILED\\\") + \\\" \\\" + await availableAPIs.lookupLocale(\\\"USERNAME_PROMPT\\\");\\n\\t\\t\\tinput.placeholder = await availableAPIs.lookupLocale(\\\"USERNAME\\\");\\n\\t\\t\\tinput.type = \\\"text\\\";\\n\\t\\t\\tinput.disabled = !!user;\\n\\t\\t\\tsubmit.disabled = false;\\n\\t\\t\\tinput.value = user || \\\"\\\";\\n\\t\\t\\tsubmit.addEventListener(\\\"click\\\", userSubmit);\\n\\t\\t\\treturn;\\n\\t\\t}\\n\\t\\tasync function updateProgress() {\\n\\t\\t\\tsubmit.removeEventListener(\\\"click\\\", userSubmit);\\n\\t\\t\\tinput.value = \\\"\\\";\\n\\t\\t\\tsubmit.innerText = await availableAPIs.lookupLocale(\\\"ENTER_BUTTON\\\");\\n\\t\\t\\tif (userLogonSession.success != \\\"intermediate\\\") await availableAPIs.automatedLogonDelete(userLogonID);\\n\\t\\t\\tif (userLogonSession.success == true) {\\n\\t\\t\\t\\tawait availableAPIs.sendToPipe({ pipe: ipc, data: userLogonSession });\\n\\t\\t\\t\\tawait availableAPIs.terminate();\\n\\t\\t\\t}\\n\\t\\t\\tif (userLogonSession.success == false) {\\n\\t\\t\\t\\tdescribe.innerText = await availableAPIs.lookupLocale(\\\"AUTH_FAILED\\\") + \\\" \\\" + await availableAPIs.lookupLocale(\\\"USERNAME_PROMPT\\\");\\n\\t\\t\\t\\tinput.placeholder = await availableAPIs.lookupLocale(\\\"USERNAME\\\");\\n\\t\\t\\t\\tinput.type = \\\"text\\\";\\n\\t\\t\\t\\tinput.disabled = !!user;\\n\\t\\t\\t\\tsubmit.disabled = false;\\n\\t\\t\\t\\tinput.value = user || \\\"\\\";\\n\\t\\t\\t\\tsubmit.addEventListener(\\\"click\\\", userSubmit);\\n\\t\\t\\t\\treturn;\\n\\t\\t\\t}\\n\\t\\t\\tdescribe.innerText = \\\"[\\\" + desired_username + \\\"] \\\" + userLogonSession.message;\\n\\t\\t\\tinput.placeholder = await availableAPIs.lookupLocale(\\\"RESPONSE_PLACEHOLDER\\\");\\n\\t\\t\\tinput.type = userLogonSession.type == \\\"password\\\" ? \\\"password\\\" : \\\"text\\\";\\n\\t\\t\\tinput.disabled = !userLogonSession.wantsUserInput;\\n\\t\\t\\tsubmit.disabled = !userLogonSession.wantsUserInput;\\n\\t\\t\\tif (userLogonSession.type == \\\"zkpp_password\\\") input.type = \\\"password\\\";\\n\\t\\t\\tif (userLogonSession.type == \\\"promise\\\") {\\n\\t\\t\\t\\ttry {\\n\\t\\t\\t\\t\\tinput.disabled = true;\\n\\t\\t\\t\\t\\tsubmit.disabled = true;\\n\\t\\t\\t\\t\\tawait availableAPIs.automatedLogonInput({ session: userLogonID });\\n\\t\\t\\t\\t\\tuserLogonSession = await availableAPIs.automatedLogonGet(userLogonID);\\n\\t\\t\\t\\t} catch {}\\n\\t\\t\\t\\treturn await updateProgress();\\n\\t\\t\\t}\\n\\t\\t\\tif (userLogonSession.type == \\\"informative\\\") {\\n\\t\\t\\t\\tinput.disabled = true;\\n\\t\\t\\t\\tsubmit.disabled = false;\\n\\t\\t\\t\\tsubmit.innerText = \\\"OK\\\";\\n\\t\\t\\t\\tinput.placeholder = \\\"--->\\\";\\n\\t\\t\\t}\\n\\t\\t\\tsubmit.addEventListener(\\\"click\\\", async function updater(e) {\\n\\t\\t\\t\\te.stopImmediatePropagation();\\n\\t\\t\\t\\tsubmit.removeEventListener(\\\"click\\\", updater);\\n\\t\\t\\t\\te.preventDefault();\\n\\t\\t\\t\\te.stopPropagation();\\n\\t\\t\\t\\ttry {\\n\\t\\t\\t\\t\\tinput.disabled = true;\\n\\t\\t\\t\\t\\tsubmit.disabled = true;\\n\\t\\t\\t\\t\\tif (userLogonSession.type == \\\"zkpp_password\\\") {\\n\\t\\t\\t\\t\\t\\tlet passwordAsKey = await availableAPIs.cspOperation({\\n\\t\\t\\t\\t\\t\\t\\tcspProvider: \\\"basic\\\",\\n\\t\\t\\t\\t\\t\\t\\toperation: \\\"importKey\\\",\\n\\t\\t\\t\\t\\t\\t\\tcspArgument: {\\n\\t\\t\\t\\t\\t\\t\\t\\tformat: \\\"raw\\\",\\n\\t\\t\\t\\t\\t\\t\\t\\tkeyData: new TextEncoder().encode(input.value),\\n\\t\\t\\t\\t\\t\\t\\t\\talgorithm: \\\"PBKDF2\\\",\\n\\t\\t\\t\\t\\t\\t\\t\\textractable: false,\\n\\t\\t\\t\\t\\t\\t\\t\\tkeyUsages: [\\\"deriveBits\\\"]\\n\\t\\t\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t\\t\\t})\\n\\t\\t\\t\\t\\t\\tlet rngSeed = await availableAPIs.cspOperation({\\n\\t\\t\\t\\t\\t\\t\\tcspProvider: \\\"basic\\\",\\n\\t\\t\\t\\t\\t\\t\\toperation: \\\"deriveBits\\\",\\n\\t\\t\\t\\t\\t\\t\\tcspArgument: {\\n\\t\\t\\t\\t\\t\\t\\t\\talgorithm: {\\n\\t\\t\\t\\t\\t\\t\\t\\t\\tname: \\\"PBKDF2\\\",\\n\\t\\t\\t\\t\\t\\t\\t\\t\\tsalt: new Uint8Array(32),\\n\\t\\t\\t\\t\\t\\t\\t\\t\\titerations: 100000,\\n\\t\\t\\t\\t\\t\\t\\t\\t\\thash: \\\"SHA-256\\\"\\n\\t\\t\\t\\t\\t\\t\\t\\t},\\n\\t\\t\\t\\t\\t\\t\\t\\tbaseKey: passwordAsKey,\\n\\t\\t\\t\\t\\t\\t\\t\\tlength: 256\\n\\t\\t\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t\\t\\t});\\n\\t\\t\\t\\t\\t\\tawait availableAPIs.cspOperation({\\n\\t\\t\\t\\t\\t\\t\\tcspProvider: \\\"basic\\\",\\n\\t\\t\\t\\t\\t\\t\\toperation: \\\"unloadKey\\\",\\n\\t\\t\\t\\t\\t\\t\\tcspArgument: passwordAsKey\\n\\t\\t\\t\\t\\t\\t});\\n\\t\\t\\t\\t\\t\\tlet u8aToHex = (u8a) => Array.from(u8a).map(a => a.toString(16).padStart(2, \\\"0\\\")).join(\\\"\\\");\\n\\t\\t\\t\\t\\t\\tlet hexToU8A = (hex) => Uint8Array.from(hex.match(/.{1,2}/g).map(a => parseInt(a, 16)));\\n\\t\\t\\t\\t\\t\\tawait availableAPIs.automatedLogonInput({ session: userLogonID, input: u8aToHex(await availableAPIs.cspOperation({\\n\\t\\t\\t\\t\\t\\t\\tcspProvider: \\\"tweetnacl\\\",\\n\\t\\t\\t\\t\\t\\t\\toperation: \\\"sign\\\",\\n\\t\\t\\t\\t\\t\\t\\tcspArgument: {\\n\\t\\t\\t\\t\\t\\t\\t\\tsecretKey: (await availableAPIs.cspOperation({\\n\\t\\t\\t\\t\\t\\t\\t\\t\\tcspProvider: \\\"tweetnacl\\\",\\n\\t\\t\\t\\t\\t\\t\\t\\t\\toperation: \\\"deriveKey\\\",\\n\\t\\t\\t\\t\\t\\t\\t\\t\\tcspArgument: {\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\ttype: \\\"sign\\\",\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tseed: new Uint8Array(rngSeed)\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t\\t\\t\\t\\t})).secretKey,\\n\\t\\t\\t\\t\\t\\t\\t\\tmessage: hexToU8A(userLogonSession.challenge)\\n\\t\\t\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t\\t\\t}))});\\n\\t\\t\\t\\t\\t} else await availableAPIs.automatedLogonInput({ session: userLogonID, input: input.value });\\n\\t\\t\\t\\t\\tuserLogonSession = await availableAPIs.automatedLogonGet(userLogonID);\\n\\t\\t\\t\\t} catch {}\\n\\t\\t\\t\\treturn await updateProgress();\\n\\t\\t\\t});\\n\\t\\t}\\n\\t\\tawait updateProgress();\\n\\t\\treturn false;\\n\\t}\\n\\tsubmit.addEventListener(\\\"click\\\", userSubmit);\\n\\tif (user) {\\n\\t\\tinput.disabled = true;\\n\\t\\tinput.value = user;\\n\\t\\tuserSubmit({ preventDefault: () => {}, stopImmediatePropagation: () => {}, stopPropagation: () => {} });\\n\\t}\\n})();\\naddEventListener(\\\"signal\\\", async function(e) {\\n\\tif (e.detail == 15) {\\n\\t\\ttry {\\n\\t\\t\\tawait availableAPIs.sendToPipe({ pipe: ipc, data: { success: false, cancelled: true } });\\n\\t\\t} catch {}\\n\\t\\tawait window.availableAPIs.terminate();\\n\\t}\\n}); null;\",\"cd486b5218a67c8dd6791e6f012e6bde24bd990cfca18fd3f1ddb89664652a2dabc362224996068241792488344d6a8880084f86c4597a8ddaf20a248ee9765a\":\"// =====BEGIN MANIFEST=====\\n// signer: automaticSigner\\n// allow: IPC_SEND_PIPE, GET_LOCALE, GET_THEME, ELEVATE_PRIVILEGES, FS_READ, FS_LIST_PARTITIONS, CSP_OPERATIONS\\n// signature: e80b20cad0f743cf9564a93526861b58601d61f2b2d9adbffe9030fe555b6e40d0cde8ae9570fb640fee604af8e53ee3034514b3b28497eb6c8786a06e5abf1a\\n// =====END MANIFEST=====\\n\\nlet ipc;\\n(async function() {\\n\\t// @pcos-app-mode isolatable\\n\\texec_args = await availableAPIs.getPrivateData() || [];\\n\\tif (!(exec_args instanceof Array)) return availableAPIs.terminate();\\n\\tipc = exec_args[0];\\n\\tif (!ipc) return availableAPIs.terminate();\\n\\tlet user = exec_args[1];\\n\\ttry {\\n\\t\\tnew Audio(await availableAPIs.fs_read({ path: (await availableAPIs.getSystemMount()) + \\\"/etc/sounds/ask.aud\\\" })).play();\\n\\t} catch (e) {\\n\\t\\tconsole.error(e);\\n\\t}\\n\\tawait availableAPIs.windowTitleSet(await availableAPIs.lookupLocale(\\\"ACCESS_REQUEST_TITLE\\\"));\\n\\tlet checklist = [ \\\"IPC_SEND_PIPE\\\", \\\"GET_LOCALE\\\", \\\"GET_THEME\\\", \\\"ELEVATE_PRIVILEGES\\\", \\\"CSP_OPERATIONS\\\" ];\\n\\tlet privileges = await availableAPIs.getPrivileges();\\n\\tif (!checklist.every(p => privileges.includes(p))) {\\n\\t\\tif (privileges.includes(\\\"IPC_SEND_PIPE\\\")) await availableAPIs.sendToPipe({ pipe: ipc, data: { success: false, cancelled: false } });\\n\\t\\treturn availableAPIs.terminate();\\n\\t}\\n\\tdocument.body.style.fontFamily = \\\"'Segoe UI', Tahoma, Geneva, Verdana, sans-serif\\\";\\n\\tif (await availableAPIs.isDarkThemed()) document.body.style.color = \\\"white\\\";\\n\\tlet describe = document.createElement(\\\"span\\\");\\n\\tlet form = document.createElement(\\\"form\\\");\\n\\tlet input = document.createElement(\\\"input\\\");\\n\\tlet decline = document.createElement(\\\"button\\\");\\n\\tlet submit = document.createElement(\\\"button\\\");\\n\\tlet metadata = JSON.parse(exec_args[2]);\\n\\tdecline.type = \\\"button\\\";\\n\\tsubmit.type = \\\"submit\\\";\\n\\tdocument.body.appendChild(describe);\\n\\tdocument.body.appendChild(document.createElement(\\\"hr\\\"));\\n\\tdocument.body.appendChild(form);\\n\\tform.appendChild(input);\\n\\tform.appendChild(document.createElement(\\\"br\\\"));\\n\\tform.appendChild(decline);\\n\\tform.appendChild(submit);\\n\\tdescribe.innerText = (await availableAPIs.lookupLocale(\\\"DESCRIBE_TEMPLATE\\\")).replace(\\\"%s\\\", metadata.path.split(\\\"/\\\").pop()).replace(\\\"%s\\\", metadata.submittedName || metadata.path.split(\\\"/\\\").pop()).replace(\\\"%s\\\", metadata.submittedIntent);\\n\\tinput.placeholder = await availableAPIs.lookupLocale(\\\"USERNAME\\\");\\n\\tdecline.innerText = await availableAPIs.lookupLocale(\\\"DECLINE\\\");\\n\\tsubmit.innerText = await availableAPIs.lookupLocale(\\\"NEXT\\\");\\n\\n\\tasync function extraData(e) {\\n\\t\\te.stopImmediatePropagation();\\n\\t\\te.preventDefault();\\n\\t\\te.stopPropagation();\\n\\t\\tdescribe.innerText = (await availableAPIs.lookupLocale(\\\"EXTRA_DESCRIBE_TEMPLATE\\\")).replace(\\\"%s\\\", metadata.path).replace(\\\"%s\\\", metadata.submittedName || metadata.path.split(\\\"/\\\").pop()).replace(\\\"%s\\\", JSON.stringify(metadata.args)).replace(\\\"%s\\\", metadata.submittedIntent);\\n\\t\\tdescribe.removeEventListener(\\\"contextmenu\\\", extraData);\\n\\t}\\n\\n\\tdescribe.addEventListener(\\\"contextmenu\\\", extraData);\\n\\n\\tasync function userSubmit(e) {\\n\\t\\tdescribe.removeEventListener(\\\"contextmenu\\\", extraData);\\n\\t\\te.stopImmediatePropagation();\\n\\t\\te.preventDefault();\\n\\t\\te.stopPropagation();\\n\\t\\tlet userLogonSession;\\n\\t\\tlet userLogonID;\\n\\t\\tlet desired_username = input.value;\\n\\t\\ttry {\\n\\t\\t\\tuserLogonID = await availableAPIs.automatedLogonCreate({ desiredUser: desired_username });\\n\\t\\t\\tuserLogonSession = await availableAPIs.automatedLogonGet(userLogonID);\\n\\t\\t} catch {\\n\\t\\t\\tdescribe.innerText = await availableAPIs.lookupLocale(\\\"AUTH_FAILED\\\") + \\\" \\\" + await availableAPIs.lookupLocale(\\\"USERNAME_PROMPT\\\");\\n\\t\\t\\tinput.placeholder = await availableAPIs.lookupLocale(\\\"USERNAME\\\");\\n\\t\\t\\tinput.type = \\\"text\\\";\\n\\t\\t\\tinput.disabled = !!user;\\n\\t\\t\\tsubmit.disabled = false;\\n\\t\\t\\tinput.value = user || \\\"\\\";\\n\\t\\t\\tsubmit.addEventListener(\\\"click\\\", userSubmit);\\n\\t\\t\\treturn;\\n\\t\\t}\\n\\t\\tasync function updateProgress() {\\n\\t\\t\\tsubmit.removeEventListener(\\\"click\\\", userSubmit);\\n\\t\\t\\tinput.value = \\\"\\\";\\n\\t\\t\\tif (userLogonSession.success != \\\"intermediate\\\") await availableAPIs.automatedLogonDelete(userLogonID);\\n\\t\\t\\tif (userLogonSession.success == true) {\\n\\t\\t\\t\\tawait availableAPIs.sendToPipe({ pipe: ipc, data: userLogonSession });\\n\\t\\t\\t\\tawait availableAPIs.terminate();\\n\\t\\t\\t}\\n\\t\\t\\tif (userLogonSession.success == false) {\\n\\t\\t\\t\\tdescribe.innerText = await availableAPIs.lookupLocale(\\\"AUTH_FAILED\\\") + \\\" \\\" + await availableAPIs.lookupLocale(\\\"USERNAME_PROMPT\\\");\\n\\t\\t\\t\\tinput.placeholder = await availableAPIs.lookupLocale(\\\"USERNAME\\\");\\n\\t\\t\\t\\tinput.type = \\\"text\\\";\\n\\t\\t\\t\\tinput.disabled = !!user;\\n\\t\\t\\t\\tsubmit.disabled = false;\\n\\t\\t\\t\\tinput.value = user || \\\"\\\";\\n\\t\\t\\t\\tsubmit.addEventListener(\\\"click\\\", userSubmit);\\n\\t\\t\\t\\treturn;\\n\\t\\t\\t}\\n\\t\\t\\tdescribe.innerText = \\\"[\\\" + desired_username + \\\"] \\\" + userLogonSession.message;\\n\\t\\t\\tinput.placeholder = await availableAPIs.lookupLocale(\\\"RESPONSE_PLACEHOLDER\\\");\\n\\t\\t\\tinput.type = userLogonSession.type == \\\"password\\\" ? \\\"password\\\" : \\\"text\\\";\\n\\t\\t\\tinput.disabled = !userLogonSession.wantsUserInput;\\n\\t\\t\\tsubmit.disabled = !userLogonSession.wantsUserInput;\\n\\t\\t\\tif (userLogonSession.type == \\\"zkpp_password\\\") input.type = \\\"password\\\";\\n\\t\\t\\tif (userLogonSession.type == \\\"promise\\\") {\\n\\t\\t\\t\\ttry {\\n\\t\\t\\t\\t\\tinput.disabled = true;\\n\\t\\t\\t\\t\\tsubmit.disabled = true;\\n\\t\\t\\t\\t\\tawait availableAPIs.automatedLogonInput({ session: userLogonID });\\n\\t\\t\\t\\t\\tuserLogonSession = await availableAPIs.automatedLogonGet(userLogonID);\\n\\t\\t\\t\\t} catch {}\\n\\t\\t\\t\\treturn await updateProgress();\\n\\t\\t\\t}\\n\\t\\t\\tif (userLogonSession.type == \\\"informative\\\") {\\n\\t\\t\\t\\tinput.disabled = true;\\n\\t\\t\\t\\tsubmit.disabled = false;\\n\\t\\t\\t\\tinput.placeholder = \\\"\\\";\\n\\t\\t\\t}\\n\\t\\t\\tsubmit.addEventListener(\\\"click\\\", async function updater(e) {\\n\\t\\t\\t\\te.stopImmediatePropagation();\\n\\t\\t\\t\\tsubmit.removeEventListener(\\\"click\\\", updater);\\n\\t\\t\\t\\te.preventDefault();\\n\\t\\t\\t\\te.stopPropagation();\\n\\t\\t\\t\\ttry {\\n\\t\\t\\t\\t\\tinput.disabled = true;\\n\\t\\t\\t\\t\\tsubmit.disabled = true;\\n\\t\\t\\t\\t\\tif (userLogonSession.type == \\\"zkpp_password\\\") {\\n\\t\\t\\t\\t\\t\\tlet passwordAsKey = await availableAPIs.cspOperation({\\n\\t\\t\\t\\t\\t\\t\\tcspProvider: \\\"basic\\\",\\n\\t\\t\\t\\t\\t\\t\\toperation: \\\"importKey\\\",\\n\\t\\t\\t\\t\\t\\t\\tcspArgument: {\\n\\t\\t\\t\\t\\t\\t\\t\\tformat: \\\"raw\\\",\\n\\t\\t\\t\\t\\t\\t\\t\\tkeyData: new TextEncoder().encode(input.value),\\n\\t\\t\\t\\t\\t\\t\\t\\talgorithm: \\\"PBKDF2\\\",\\n\\t\\t\\t\\t\\t\\t\\t\\textractable: false,\\n\\t\\t\\t\\t\\t\\t\\t\\tkeyUsages: [\\\"deriveBits\\\"]\\n\\t\\t\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t\\t\\t})\\n\\t\\t\\t\\t\\t\\tlet rngSeed = await availableAPIs.cspOperation({\\n\\t\\t\\t\\t\\t\\t\\tcspProvider: \\\"basic\\\",\\n\\t\\t\\t\\t\\t\\t\\toperation: \\\"deriveBits\\\",\\n\\t\\t\\t\\t\\t\\t\\tcspArgument: {\\n\\t\\t\\t\\t\\t\\t\\t\\talgorithm: {\\n\\t\\t\\t\\t\\t\\t\\t\\t\\tname: \\\"PBKDF2\\\",\\n\\t\\t\\t\\t\\t\\t\\t\\t\\tsalt: new Uint8Array(32),\\n\\t\\t\\t\\t\\t\\t\\t\\t\\titerations: 100000,\\n\\t\\t\\t\\t\\t\\t\\t\\t\\thash: \\\"SHA-256\\\"\\n\\t\\t\\t\\t\\t\\t\\t\\t},\\n\\t\\t\\t\\t\\t\\t\\t\\tbaseKey: passwordAsKey,\\n\\t\\t\\t\\t\\t\\t\\t\\tlength: 256\\n\\t\\t\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t\\t\\t});\\n\\t\\t\\t\\t\\t\\tawait availableAPIs.cspOperation({\\n\\t\\t\\t\\t\\t\\t\\tcspProvider: \\\"basic\\\",\\n\\t\\t\\t\\t\\t\\t\\toperation: \\\"unloadKey\\\",\\n\\t\\t\\t\\t\\t\\t\\tcspArgument: passwordAsKey\\n\\t\\t\\t\\t\\t\\t});\\n\\t\\t\\t\\t\\t\\tlet u8aToHex = (u8a) => Array.from(u8a).map(a => a.toString(16).padStart(2, \\\"0\\\")).join(\\\"\\\");\\n\\t\\t\\t\\t\\t\\tlet hexToU8A = (hex) => Uint8Array.from(hex.match(/.{1,2}/g).map(a => parseInt(a, 16)));\\n\\t\\t\\t\\t\\t\\tawait availableAPIs.automatedLogonInput({ session: userLogonID, input: u8aToHex(await availableAPIs.cspOperation({\\n\\t\\t\\t\\t\\t\\t\\tcspProvider: \\\"tweetnacl\\\",\\n\\t\\t\\t\\t\\t\\t\\toperation: \\\"sign\\\",\\n\\t\\t\\t\\t\\t\\t\\tcspArgument: {\\n\\t\\t\\t\\t\\t\\t\\t\\tsecretKey: (await availableAPIs.cspOperation({\\n\\t\\t\\t\\t\\t\\t\\t\\t\\tcspProvider: \\\"tweetnacl\\\",\\n\\t\\t\\t\\t\\t\\t\\t\\t\\toperation: \\\"deriveKey\\\",\\n\\t\\t\\t\\t\\t\\t\\t\\t\\tcspArgument: {\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\ttype: \\\"sign\\\",\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\tseed: new Uint8Array(rngSeed)\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t\\t\\t\\t\\t})).secretKey,\\n\\t\\t\\t\\t\\t\\t\\t\\tmessage: hexToU8A(userLogonSession.challenge)\\n\\t\\t\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t\\t\\t}))});\\n\\t\\t\\t\\t\\t} else await availableAPIs.automatedLogonInput({ session: userLogonID, input: input.value });\\n\\t\\t\\t\\t\\tuserLogonSession = await availableAPIs.automatedLogonGet(userLogonID);\\n\\t\\t\\t\\t} catch {}\\n\\t\\t\\t\\treturn await updateProgress();\\n\\t\\t\\t});\\n\\t\\t}\\n\\t\\tawait updateProgress();\\n\\t\\treturn false;\\n\\t}\\n\\tsubmit.addEventListener(\\\"click\\\", userSubmit);\\n\\tdecline.addEventListener(\\\"click\\\", async function() {\\n\\t\\tawait availableAPIs.sendToPipe({ pipe: ipc, data: { success: false, cancelled: true } });\\n\\t\\tawait availableAPIs.terminate();\\n\\t});\\n\\tif (user) {\\n\\t\\tinput.disabled = true;\\n\\t\\tinput.value = user;\\n\\t}\\n})();\\naddEventListener(\\\"signal\\\", async function(e) {\\n\\tif (e.detail == 15) {\\n\\t\\ttry {\\n\\t\\t\\tawait availableAPIs.sendToPipe({ pipe: ipc, data: { success: false, cancelled: true } });\\n\\t\\t} catch {}\\n\\t\\tawait window.availableAPIs.terminate();\\n\\t}\\n}); null;\",\"f487ee1000d9455505a50c5647df0fdb1108aca5ed98064d610a8a7c8da6842a062365e8f6f1a07a96a223d6375e730d2ce94277fda96e436c30db5dc7796771\":\"// =====BEGIN MANIFEST=====\\n// link: lrn:FILE_EXPLORER\\n// signer: automaticSigner\\n// allow: FS_READ, FS_LIST_PARTITIONS, ELEVATE_PRIVILEGES, START_TASK, GET_LOCALE, GET_THEME, MANAGE_TOKENS, FS_REMOVE, FS_BYPASS_PERMISSIONS, FS_UNMOUNT, FS_CHANGE_PERMISSION, FS_MOUNT, GET_FILESYSTEMS, FS_WRITE, LLDISK_LIST_PARTITIONS, GET_USER_INFO\\n// signature: aa446a4b70002e40bd8e66bd095898ee70769cafa249e0c120cb9d0a31863d4a45580aa4c52caac7e38e03879bbcb39677c804e6e4ec147eb009060429885d7f\\n// =====END MANIFEST=====\\nlet globalToken;\\nlet cachedIcons = {};\\n(async function() {\\n\\t// @pcos-app-mode isolatable\\n\\tawait availableAPIs.windowTitleSet(await availableAPIs.lookupLocale(\\\"FILE_EXPLORER\\\"));\\n\\tdocument.body.style.fontFamily = \\\"'Segoe UI', Tahoma, Geneva, Verdana, sans-serif\\\";\\n\\tif (await availableAPIs.isDarkThemed()) document.body.style.color = \\\"white\\\";\\n\\tlet privileges = await availableAPIs.getPrivileges();\\n\\tlet checklist = [ \\\"FS_READ\\\", \\\"FS_LIST_PARTITIONS\\\" ];\\n\\tif (!checklist.every(p => privileges.includes(p))) {\\n\\t\\tdocument.body.innerText = await availableAPIs.lookupLocale(\\\"GRANT_FEXP_PERM\\\");\\n\\t\\tlet button = document.createElement(\\\"button\\\");\\n\\t\\tbutton.innerText = await availableAPIs.lookupLocale(\\\"GRANT_PERM\\\");\\n\\t\\tdocument.body.appendChild(button);\\n\\t\\tif (!privileges.includes(\\\"ELEVATE_PRIVILEGES\\\")) {\\n\\t\\t\\tbutton.disabled = true;\\n\\t\\t\\tdocument.body.innerText = await availableAPIs.lookupLocale(\\\"GRANT_FEXP_PERM_ADM\\\");\\n\\t\\t\\treturn;\\n\\t\\t}\\n\\t\\tawait new Promise(function(resolve) {\\n\\t\\t\\tbutton.onclick = async function() {\\n\\t\\t\\t\\tbutton.disabled = true;\\n\\t\\t\\t\\tlet currentToken = await availableAPIs.getProcessToken();\\n\\t\\t\\t\\tlet newToken = await availableAPIs.consentGetToken({\\n\\t\\t\\t\\t\\tintent: await availableAPIs.lookupLocale(\\\"FILE_EXPLORER_FULL_INTENT\\\"),\\n\\t\\t\\t\\t\\tname: await availableAPIs.lookupLocale(\\\"FILE_EXPLORER\\\")\\n\\t\\t\\t\\t});\\n\\t\\t\\t\\tbutton.disabled = false;\\n\\t\\t\\t\\tif (!newToken) return;\\n\\t\\t\\t\\tif (privileges.includes(\\\"MANAGE_TOKENS\\\")) globalToken = await availableAPIs.forkToken(newToken);\\n\\t\\t\\t\\tawait availableAPIs.setProcessToken(newToken);\\n\\t\\t\\t\\tawait availableAPIs.revokeToken(currentToken);\\n\\t\\t\\t\\tprivileges = await availableAPIs.getPrivileges();\\n\\t\\t\\t\\tif (checklist.every(p => privileges.includes(p))) resolve();\\n\\t\\t\\t\\telse document.body.innerText = await availableAPIs.lookupLocale(\\\"GRANT_FEXP_PERM_USR\\\");\\n\\t\\t\\t}\\n\\t\\t});\\n\\t}\\n\\tlet hideHiddenFiles = true;\\n\\ttry {\\n\\t\\tlet homedir = (await availableAPIs.getUserInfo({ desiredUser: await availableAPIs.getUser() })).homeDirectory;\\n\\t\\thideHiddenFiles = (await availableAPIs.fs_read({\\n\\t\\t\\tpath: homedir + \\\"/.hiddenFiles\\\",\\n\\t\\t})) != \\\"show\\\";\\n\\t} catch {}\\n\\tdocument.body.innerText = \\\"\\\";\\n\\tlet mainComponent = document.createElement(\\\"div\\\");\\n\\tlet pathInputForm = document.createElement(\\\"form\\\");\\n\\tlet pathElement = document.createElement(\\\"input\\\");\\n\\tlet browseButton = document.createElement(\\\"button\\\");\\n\\tlet displayResult = document.createElement(\\\"div\\\");\\n\\tlet previousDirectory = \\\"\\\";\\n\\tlet clipboard = {\\n\\t\\tpath: \\\"\\\",\\n\\t\\tcut: false,\\n\\t\\tselected: false\\n\\t};\\n\\tmainComponent.style.display = \\\"flex\\\";\\n\\tmainComponent.style.flexDirection = \\\"column\\\";\\n\\tmainComponent.style.width = \\\"100%\\\";\\n\\tmainComponent.style.height = \\\"100%\\\";\\n\\tmainComponent.style.position = \\\"absolute\\\";\\n\\tmainComponent.style.top = \\\"0\\\";\\n\\tmainComponent.style.left = \\\"0\\\";\\n\\tmainComponent.style.padding = \\\"8px\\\";\\n\\tmainComponent.style.boxSizing = \\\"border-box\\\";\\n\\tdisplayResult.style.flex = \\\"1\\\";\\n\\tbrowseButton.innerText = await availableAPIs.lookupLocale(\\\"BROWSE_FEXP\\\");\\n\\tpathInputForm.appendChild(pathElement);\\n\\tpathInputForm.appendChild(browseButton);\\n\\tmainComponent.appendChild(pathInputForm);\\n\\tmainComponent.appendChild(displayResult);\\n\\tdocument.body.appendChild(mainComponent);\\n\\tlet availableIcons = [];\\n\\ttry {\\n\\t\\tavailableIcons = await availableAPIs.fs_ls({ path: await availableAPIs.getSystemMount() + \\\"/etc/icons\\\" });\\n\\t} catch {}\\n\\tdisplayResult.oncontextmenu = async function(e) {\\n\\t\\te.stopImmediatePropagation();\\n\\t\\te.preventDefault();\\n\\t\\te.stopPropagation();\\n\\t\\tdisplayResult.innerText = \\\"\\\";\\n\\t\\tlet showHiddenFilesToggle = document.createElement(\\\"button\\\");\\n\\t\\tshowHiddenFilesToggle.innerText = await availableAPIs.lookupLocale(\\\"TOGGLE_HIDDEN_FILES\\\");\\n\\t\\tshowHiddenFilesToggle.addEventListener(\\\"click\\\", async function() {\\n\\t\\t\\thideHiddenFiles = !hideHiddenFiles;\\n\\t\\t\\ttry {\\n\\t\\t\\t\\tlet homedir = (await availableAPIs.getUserInfo({ desiredUser: await availableAPIs.getUser() })).homeDirectory;\\n\\t\\t\\t\\tavailableAPIs.fs_write({\\n\\t\\t\\t\\t\\tpath: homedir + \\\"/.hiddenFiles\\\",\\n\\t\\t\\t\\t\\tdata: (hideHiddenFiles ? \\\"hide\\\" : \\\"show\\\")\\n\\t\\t\\t\\t});\\n\\t\\t\\t} catch {}\\n\\t\\t\\tbrowse();\\n\\t\\t});\\n\\t\\tdisplayResult.appendChild(showHiddenFilesToggle);\\n\\t\\tdisplayResult.appendChild(document.createElement(\\\"hr\\\"));\\n\\t\\tif (previousDirectory == \\\"\\\") {\\n\\t\\t\\tlet mountForm = document.createElement(\\\"form\\\");\\n\\t\\t\\tlet mountpoint = document.createElement(\\\"input\\\");\\n\\t\\t\\tlet filesystemOptions = document.createElement(\\\"select\\\");\\n\\t\\t\\tlet autoGenMountOptions = document.createElement(\\\"select\\\");\\n\\t\\t\\tlet mountOptions = document.createElement(\\\"textarea\\\");\\n\\t\\t\\tlet mountButton = document.createElement(\\\"button\\\");\\n\\t\\t\\tmountpoint.placeholder = await availableAPIs.lookupLocale(\\\"MOUNTPOINT\\\");\\n\\t\\t\\tlet availableFilesystems = await availableAPIs.supportedFilesystems();\\n\\t\\t\\tfor (let filesystem of availableFilesystems) {\\n\\t\\t\\t\\tlet option = document.createElement(\\\"option\\\");\\n\\t\\t\\t\\toption.value = filesystem;\\n\\t\\t\\t\\toption.innerText = filesystem;\\n\\t\\t\\t\\tfilesystemOptions.appendChild(option);\\n\\t\\t\\t}\\n\\t\\t\\tlet availablePartitions = [];\\n\\t\\t\\ttry {\\n\\t\\t\\t\\tavailablePartitions = await availableAPIs.lldaList();\\n\\t\\t\\t} catch (e) {\\n\\t\\t\\t\\tconsole.error(e);\\n\\t\\t\\t}\\n\\t\\t\\tlet defaultPartitionOption = document.createElement(\\\"option\\\");\\n\\t\\t\\tdefaultPartitionOption.value = \\\"\\\";\\n\\t\\t\\tdefaultPartitionOption.innerText = await availableAPIs.lookupLocale(\\\"GENERATE_PROMPT\\\");\\n\\t\\t\\tdefaultPartitionOption.selected = true;\\n\\t\\t\\tdefaultPartitionOption.disabled = true;\\n\\t\\t\\tdefaultPartitionOption.hidden = true;\\n\\t\\t\\tautoGenMountOptions.appendChild(defaultPartitionOption);\\n\\t\\t\\tfor (let partition of availablePartitions) {\\n\\t\\t\\t\\tlet option = document.createElement(\\\"option\\\");\\n\\t\\t\\t\\toption.value = partition;\\n\\t\\t\\t\\toption.innerText = partition;\\n\\t\\t\\t\\tautoGenMountOptions.appendChild(option);\\n\\t\\t\\t}\\n\\t\\t\\tautoGenMountOptions.onchange = function() {\\n\\t\\t\\t\\tmountOptions.value = JSON.stringify({ partition: autoGenMountOptions.value });\\n\\t\\t\\t}\\n\\t\\t\\tmountOptions.value = \\\"{}\\\";\\n\\t\\t\\tmountButton.innerText = await availableAPIs.lookupLocale(\\\"MOUNT_BUTTON\\\");\\n\\t\\t\\tmountButton.onclick = async function() {\\n\\t\\t\\t\\ttry {\\n\\t\\t\\t\\t\\tlet options = JSON.parse(mountOptions.value);\\n\\t\\t\\t\\t\\tawait availableAPIs.fs_mount({ mountpoint: mountpoint.value, filesystem: filesystemOptions.value, filesystemOptions: options });\\n\\t\\t\\t\\t\\tbrowse();\\n\\t\\t\\t\\t} catch (e) {\\n\\t\\t\\t\\t\\tconsole.error(e);\\n\\t\\t\\t\\t\\tdisplayResult.innerText = (await availableAPIs.lookupLocale(\\\"FILE_STRUCT_BROWSE_FAIL\\\")).replace(\\\"%s\\\", e.name + \\\": \\\" + e.message);\\n\\t\\t\\t\\t}\\n\\t\\t\\t}\\n\\t\\t\\tmountForm.appendChild(mountpoint);\\n\\t\\t\\tmountForm.appendChild(document.createElement(\\\"br\\\"));\\n\\t\\t\\tmountForm.appendChild(filesystemOptions);\\n\\t\\t\\tmountForm.appendChild(document.createElement(\\\"hr\\\"));\\n\\t\\t\\tmountForm.appendChild(autoGenMountOptions);\\n\\t\\t\\tmountForm.appendChild(document.createElement(\\\"br\\\"));\\n\\t\\t\\tmountForm.appendChild(mountOptions);\\n\\t\\t\\tmountForm.appendChild(document.createElement(\\\"hr\\\"));\\n\\t\\t\\tmountForm.appendChild(mountButton);\\n\\t\\t\\tdisplayResult.appendChild(mountForm);\\n\\t\\t} else {\\n\\t\\t\\tlet makeDirectoryForm = document.createElement(\\\"form\\\");\\n\\t\\t\\tlet makeDirectoryInput = document.createElement(\\\"input\\\");\\n\\t\\t\\tlet makeDirectoryButton = document.createElement(\\\"button\\\");\\n\\t\\t\\tmakeDirectoryInput.pattern = \\\"[!-.0-~]+\\\";\\n\\t\\t\\tmakeDirectoryInput.placeholder = await availableAPIs.lookupLocale(\\\"NEW_DIR_NAME\\\");\\n\\t\\t\\tmakeDirectoryForm.appendChild(makeDirectoryInput);\\n\\t\\t\\tmakeDirectoryForm.appendChild(makeDirectoryButton);\\n\\t\\t\\tdisplayResult.appendChild(makeDirectoryForm);\\n\\t\\t\\tmakeDirectoryButton.innerText = await availableAPIs.lookupLocale(\\\"MKDIR_BUTTON\\\");\\n\\t\\t\\tmakeDirectoryButton.onclick = async function() {\\n\\t\\t\\t\\tlet dirName = makeDirectoryInput.value;\\n\\t\\t\\t\\tif (dirName == \\\"\\\") return;\\n\\t\\t\\t\\ttry {\\n\\t\\t\\t\\t\\tawait availableAPIs.fs_mkdir({ path: previousDirectory + \\\"/\\\" + dirName });\\n\\t\\t\\t\\t\\tbrowse();\\n\\t\\t\\t\\t} catch (e) {\\n\\t\\t\\t\\t\\tdisplayResult.innerText = (await availableAPIs.lookupLocale(\\\"FILE_STRUCT_BROWSE_FAIL\\\")).replace(\\\"%s\\\", await availableAPIs.lookupLocale(e.message));\\n\\t\\t\\t\\t}\\n\\t\\t\\t}\\n\\t\\t\\tif (clipboard.selected) {\\n\\t\\t\\t\\tdisplayResult.appendChild(document.createElement(\\\"hr\\\"));\\n\\t\\t\\t\\tlet pasteButton = document.createElement(\\\"button\\\");\\n\\t\\t\\t\\tpasteButton.innerText = await availableAPIs.lookupLocale(\\\"CLIPBOARD_PASTE\\\");\\n\\t\\t\\t\\tpasteButton.onclick = async function() {\\n\\t\\t\\t\\t\\ttry {\\n\\t\\t\\t\\t\\t\\tlet copyAllowed = await isDirectory(clipboard.path) == \\\"file\\\";\\n\\t\\t\\t\\t\\t\\tif (!copyAllowed) throw new Error(await availableAPIs.lookupLocale(\\\"CLIPBOARD_SOURCE_GONE\\\"));\\n\\t\\t\\t\\t\\t\\tlet readFile = await availableAPIs.fs_read({ path: clipboard.path });\\n\\t\\t\\t\\t\\t\\tlet basename = clipboard.path.split(\\\"/\\\").slice(-1)[0];\\n\\t\\t\\t\\t\\t\\tcopyAllowed = await isDirectory(previousDirectory + \\\"/\\\" + basename) == \\\"unknown\\\";\\n\\t\\t\\t\\t\\t\\tif (!copyAllowed) throw new Error(await availableAPIs.lookupLocale(\\\"CLIPBOARD_CONFLICT\\\"));\\n\\t\\t\\t\\t\\t\\tawait availableAPIs.fs_write({ path: previousDirectory + \\\"/\\\" + basename, data: readFile });\\n\\t\\t\\t\\t\\t\\tif (clipboard.cut) await availableAPIs.fs_rm({ path: clipboard.path });\\n\\t\\t\\t\\t\\t\\tbrowse();\\n\\t\\t\\t\\t\\t} catch (e) {\\n\\t\\t\\t\\t\\t\\tdisplayResult.innerText = (await availableAPIs.lookupLocale(\\\"FILE_STRUCT_BROWSE_FAIL\\\")).replace(\\\"%s\\\", await availableAPIs.lookupLocale(e.message));\\n\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t}\\n\\t\\t\\t\\tdisplayResult.appendChild(pasteButton);\\n\\t\\t\\t}\\n\\t\\t}\\n\\t}\\n\\tasync function browse() {\\n\\t\\tlet path = pathElement.value;\\n\\t\\tif (path.endsWith(\\\"/\\\")) path = path.substring(0, path.length - 1);\\n\\t\\tdisplayResult.innerText = \\\"\\\";\\n\\t\\tif (path == \\\"\\\") {\\n\\t\\t\\tlet partitions = await availableAPIs.fs_mounts();\\n\\t\\t\\tfor (let partition of partitions) {\\n\\t\\t\\t\\tif (partition.startsWith(\\\".\\\") && hideHiddenFiles) continue;\\n\\t\\t\\t\\tlet openButton = document.createElement(\\\"button\\\");\\n\\t\\t\\t\\topenButton.innerText = partition;\\n\\t\\t\\t\\topenButton.onclick = function() {\\n\\t\\t\\t\\t\\tpathElement.value = partition;\\n\\t\\t\\t\\t\\tbrowse();\\n\\t\\t\\t\\t}\\n\\t\\t\\t\\topenButton.oncontextmenu = async function(e) {\\n\\t\\t\\t\\t\\te.stopImmediatePropagation();\\n\\t\\t\\t\\t\\te.preventDefault();\\n\\t\\t\\t\\t\\te.stopPropagation();\\n\\t\\t\\t\\t\\tdisplayResult.innerText = \\\"\\\";\\n\\t\\t\\t\\t\\tlet unmountButton = document.createElement(\\\"button\\\");\\n\\t\\t\\t\\t\\tunmountButton.innerText = await availableAPIs.lookupLocale(\\\"UNMOUNT_BTN\\\");\\n\\t\\t\\t\\t\\tunmountButton.onclick = async function() {\\n\\t\\t\\t\\t\\t\\ttry {\\n\\t\\t\\t\\t\\t\\t\\tawait availableAPIs.fs_unmount({ mount: partition });\\n\\t\\t\\t\\t\\t\\t\\tbrowse();\\n\\t\\t\\t\\t\\t\\t} catch (e) {\\n\\t\\t\\t\\t\\t\\t\\tdisplayResult.innerText = (await availableAPIs.lookupLocale(\\\"FILE_STRUCT_BROWSE_FAIL\\\")).replace(\\\"%s\\\", await availableAPIs.lookupLocale(e.message));\\n\\t\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t\\tunmountButton.oncontextmenu = async function(e) {\\n\\t\\t\\t\\t\\t\\te.stopImmediatePropagation();\\n\\t\\t\\t\\t\\t\\te.preventDefault();\\n\\t\\t\\t\\t\\t\\te.stopPropagation();\\n\\t\\t\\t\\t\\t\\ttry {\\n\\t\\t\\t\\t\\t\\t\\tawait availableAPIs.fs_unmount({ mount: partition, force: true });\\n\\t\\t\\t\\t\\t\\t\\tbrowse();\\n\\t\\t\\t\\t\\t\\t} catch (e) {\\n\\t\\t\\t\\t\\t\\t\\tdisplayResult.innerText = (await availableAPIs.lookupLocale(\\\"FILE_STRUCT_BROWSE_FAIL\\\")).replace(\\\"%s\\\", await availableAPIs.lookupLocale(e.message));\\n\\t\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t\\tdisplayResult.appendChild(unmountButton);\\n\\t\\t\\t\\t\\tdisplayResult.appendChild(document.createElement(\\\"hr\\\"));\\n\\n\\t\\t\\t\\t\\tlet deleteButton = document.createElement(\\\"button\\\");\\n\\t\\t\\t\\t\\tlet deleteConfirm = false;\\n\\t\\t\\t\\t\\tdeleteButton.innerText = await availableAPIs.lookupLocale(\\\"REMOVE_BTN\\\");\\n\\t\\t\\t\\t\\tdeleteButton.onclick = async function() {\\n\\t\\t\\t\\t\\t\\tif (!deleteConfirm) {\\n\\t\\t\\t\\t\\t\\t\\tdeleteButton.style.fontWeight = \\\"bold\\\";\\n\\t\\t\\t\\t\\t\\t\\tdeleteConfirm = true;\\n\\t\\t\\t\\t\\t\\t\\treturn;\\n\\t\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t\\t\\ttry {\\n\\t\\t\\t\\t\\t\\t\\tawait recursiveRemove(partition);\\n\\t\\t\\t\\t\\t\\t\\tbrowse();\\n\\t\\t\\t\\t\\t\\t} catch (e) {\\n\\t\\t\\t\\t\\t\\t\\tdisplayResult.innerText = (await availableAPIs.lookupLocale(\\\"FILE_STRUCT_BROWSE_FAIL\\\")).replace(\\\"%s\\\", await availableAPIs.lookupLocale(e.message));\\n\\t\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t\\tdisplayResult.appendChild(deleteButton);\\n\\n\\t\\t\\t\\t\\tdisplayResult.appendChild(document.createElement(\\\"br\\\"));\\n\\t\\t\\t\\t\\tlet permissions = { owner: \\\"nobody\\\", group: \\\"nobody\\\", world: \\\"rx\\\" };\\n\\t\\t\\t\\t\\ttry {\\n\\t\\t\\t\\t\\t\\tpermissions = await availableAPIs.fs_permissions({ path: partition });\\n\\t\\t\\t\\t\\t} catch (e) {\\n\\t\\t\\t\\t\\t\\tconsole.error(e);\\n\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t\\tlet chownForm = document.createElement(\\\"form\\\");\\n\\t\\t\\t\\t\\tlet chownInput = document.createElement(\\\"input\\\");\\n\\t\\t\\t\\t\\tlet chownButton = document.createElement(\\\"button\\\");\\n\\t\\t\\t\\t\\tchownInput.value = permissions.owner;\\n\\t\\t\\t\\t\\tchownButton.innerText = await availableAPIs.lookupLocale(\\\"CHOWN_BUTTON\\\");\\n\\t\\t\\t\\t\\tchownForm.appendChild(chownInput);\\n\\t\\t\\t\\t\\tchownForm.appendChild(chownButton);\\n\\t\\t\\t\\t\\tdisplayResult.appendChild(chownForm);\\n\\t\\t\\t\\t\\tchownButton.onclick = async function() {\\n\\t\\t\\t\\t\\t\\ttry {\\n\\t\\t\\t\\t\\t\\t\\tawait availableAPIs.fs_chown({ path: partition, newUser: chownInput.value });\\n\\t\\t\\t\\t\\t\\t\\tbrowse();\\n\\t\\t\\t\\t\\t\\t} catch (e) {\\n\\t\\t\\t\\t\\t\\t\\tdisplayResult.innerText = (await availableAPIs.lookupLocale(\\\"FILE_STRUCT_BROWSE_FAIL\\\")).replace(\\\"%s\\\", await availableAPIs.lookupLocale(e.message));\\n\\t\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t\\t}\\n\\n\\t\\t\\t\\t\\tlet chgrpForm = document.createElement(\\\"form\\\");\\n\\t\\t\\t\\t\\tlet chgrpInput = document.createElement(\\\"input\\\");\\n\\t\\t\\t\\t\\tlet chgrpButton = document.createElement(\\\"button\\\");\\n\\t\\t\\t\\t\\tchgrpInput.value = permissions.group;\\n\\t\\t\\t\\t\\tchgrpButton.innerText = await availableAPIs.lookupLocale(\\\"CHGRP_BUTTON\\\");\\n\\t\\t\\t\\t\\tchgrpForm.appendChild(chgrpInput);\\n\\t\\t\\t\\t\\tchgrpForm.appendChild(chgrpButton);\\n\\t\\t\\t\\t\\tdisplayResult.appendChild(chgrpForm);\\n\\t\\t\\t\\t\\tchgrpButton.onclick = async function() {\\n\\t\\t\\t\\t\\t\\ttry {\\n\\t\\t\\t\\t\\t\\t\\tawait availableAPIs.fs_chgrp({ path: partition, newGrp: chgrpInput.value });\\n\\t\\t\\t\\t\\t\\t\\tbrowse();\\n\\t\\t\\t\\t\\t\\t} catch (e) {\\n\\t\\t\\t\\t\\t\\t\\tdisplayResult.innerText = (await availableAPIs.lookupLocale(\\\"FILE_STRUCT_BROWSE_FAIL\\\")).replace(\\\"%s\\\", await availableAPIs.lookupLocale(e.message));\\n\\t\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t\\t}\\n\\n\\t\\t\\t\\t\\tlet chmodForm = document.createElement(\\\"form\\\");\\n\\t\\t\\t\\t\\tlet chmodInput = document.createElement(\\\"input\\\");\\n\\t\\t\\t\\t\\tlet chmodButton = document.createElement(\\\"button\\\");\\n\\t\\t\\t\\t\\tchmodInput.value = permissions.world;\\n\\t\\t\\t\\t\\tchownInput.pattern = \\\"[rwx]+\\\";\\n\\t\\t\\t\\t\\tchmodButton.innerText = await availableAPIs.lookupLocale(\\\"CHMOD_BUTTON\\\");\\n\\t\\t\\t\\t\\tchmodForm.appendChild(chmodInput);\\n\\t\\t\\t\\t\\tchmodForm.appendChild(chmodButton);\\n\\t\\t\\t\\t\\tdisplayResult.appendChild(chmodForm);\\n\\t\\t\\t\\t\\tchmodButton.onclick = async function() {\\n\\t\\t\\t\\t\\t\\ttry {\\n\\t\\t\\t\\t\\t\\t\\tawait availableAPIs.fs_chmod({ path: partition, newPermissions: chmodInput.value });\\n\\t\\t\\t\\t\\t\\t\\tbrowse();\\n\\t\\t\\t\\t\\t\\t} catch (e) {\\n\\t\\t\\t\\t\\t\\t\\tdisplayResult.innerText = (await availableAPIs.lookupLocale(\\\"FILE_STRUCT_BROWSE_FAIL\\\")).replace(\\\"%s\\\", await availableAPIs.lookupLocale(e.message));\\n\\t\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t}\\n\\t\\t\\t\\tdisplayResult.appendChild(openButton);\\n\\t\\t\\t}\\n\\t\\t\\tdisplayResult.appendChild(document.createElement(\\\"hr\\\"));\\n\\t\\t\\tlet spaceDisplayer = document.createElement(\\\"div\\\");\\n\\t\\t\\tlet spaces = await availableAPIs.estimateStorage();\\n\\t\\t\\tfor (let space in spaces) {\\n\\t\\t\\t\\tlet newSpace = document.createElement(\\\"div\\\");\\n\\t\\t\\t\\tnewSpace.innerText = (await availableAPIs.lookupLocale(\\\"SPACE_SHOWER\\\")).replace(\\\"%s\\\", space).replace(\\\"%s\\\", await availableAPIs.ufInfoUnits([spaces[space].used])).replace(\\\"%s\\\", await availableAPIs.ufInfoUnits([spaces[space].total])).replace(\\\"%s\\\", (spaces[space].used / spaces[space].total * 100).toFixed(2));\\n\\t\\t\\t\\tspaceDisplayer.appendChild(newSpace);\\n\\t\\t\\t}\\n\\t\\t\\tdisplayResult.appendChild(spaceDisplayer);\\n\\t\\t\\tpreviousDirectory = path;\\n\\t\\t\\treturn \\\"browsed\\\";\\n\\t\\t}\\n\\t\\ttry {\\n\\t\\t\\tlet type = await isDirectory(path);\\n\\t\\t\\tif (type == \\\"directory\\\") {\\n\\t\\t\\t\\tlet ls = (await availableAPIs.fs_ls({ path: path })).sort((a, b) => a.localeCompare(b));\\n\\t\\t\\t\\tfor (let file of ls) {\\n\\t\\t\\t\\t\\tif (file.startsWith(\\\".\\\") && hideHiddenFiles) continue;\\n\\t\\t\\t\\t\\tlet openButton = document.createElement(\\\"button\\\");\\n\\t\\t\\t\\t\\tlet fileIcon = document.createElement(\\\"img\\\");\\n\\t\\t\\t\\t\\tfileIcon.style.width = \\\"12px\\\";\\n\\t\\t\\t\\t\\tfileIcon.style.height = \\\"12px\\\";\\n\\t\\t\\t\\t\\tlet fileType = file.split(\\\".\\\").slice(-1)[0];\\n\\t\\t\\t\\t\\tlet isDir = await isDirectory(path + \\\"/\\\" + file);\\n\\t\\t\\t\\t\\ttry {\\n\\t\\t\\t\\t\\t\\tlet wantedIcon;\\n\\t\\t\\t\\t\\t\\tif (isDir == \\\"directory\\\") wantedIcon = \\\"foldericon.pic\\\";\\n\\t\\t\\t\\t\\t\\telse if (availableIcons.includes(fileType + \\\".pic\\\")) wantedIcon = fileType + \\\".pic\\\";\\n\\t\\t\\t\\t\\t\\telse wantedIcon = \\\"fileicon.pic\\\";\\n\\t\\t\\t\\t\\t\\tif (!cachedIcons.hasOwnProperty(wantedIcon)) cachedIcons[wantedIcon] = await availableAPIs.fs_read({ path: await availableAPIs.getSystemMount() + \\\"/etc/icons/\\\" + wantedIcon });\\n\\t\\t\\t\\t\\t\\tfileIcon.src = cachedIcons[wantedIcon];\\n\\t\\t\\t\\t\\t} catch {}\\n\\t\\t\\t\\t\\topenButton.innerText = file;\\n\\t\\t\\t\\t\\topenButton.insertAdjacentElement(\\\"afterbegin\\\", fileIcon);\\n\\t\\t\\t\\t\\topenButton.onclick = function() {\\n\\t\\t\\t\\t\\t\\tpathElement.value = path + \\\"/\\\" + file;\\n\\t\\t\\t\\t\\t\\tbrowse();\\n\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t\\topenButton.oncontextmenu = async function(e) {\\n\\t\\t\\t\\t\\t\\te.stopImmediatePropagation();\\n\\t\\t\\t\\t\\t\\te.preventDefault();\\n\\t\\t\\t\\t\\t\\te.stopPropagation();\\n\\t\\t\\t\\t\\t\\tdisplayResult.innerText = \\\"\\\";\\n\\t\\t\\t\\t\\t\\tlet copyAllow = false;\\n\\t\\t\\t\\t\\t\\ttry {\\n\\t\\t\\t\\t\\t\\t\\tcopyAllow = isDir == \\\"file\\\";\\n\\t\\t\\t\\t\\t\\t} catch {}\\n\\t\\t\\t\\t\\t\\tif (copyAllow) {\\n\\t\\t\\t\\t\\t\\t\\tlet copyButton = document.createElement(\\\"button\\\");\\n\\t\\t\\t\\t\\t\\t\\tcopyButton.innerText = await availableAPIs.lookupLocale(\\\"CLIPBOARD_COPY\\\");\\n\\t\\t\\t\\t\\t\\t\\tcopyButton.onclick = async function() {\\n\\t\\t\\t\\t\\t\\t\\t\\tclipboard = {\\n\\t\\t\\t\\t\\t\\t\\t\\t\\tpath: path + \\\"/\\\" + file,\\n\\t\\t\\t\\t\\t\\t\\t\\t\\tselected: true,\\n\\t\\t\\t\\t\\t\\t\\t\\t\\tcut: false\\n\\t\\t\\t\\t\\t\\t\\t\\t};\\n\\t\\t\\t\\t\\t\\t\\t\\tbrowse();\\n\\t\\t\\t\\t\\t\\t\\t};\\n\\t\\t\\t\\t\\t\\t\\tdisplayResult.appendChild(copyButton);\\n\\n\\t\\t\\t\\t\\t\\t\\tlet cutButton = document.createElement(\\\"button\\\");\\n\\t\\t\\t\\t\\t\\t\\tcutButton.innerText = await availableAPIs.lookupLocale(\\\"CLIPBOARD_CUT\\\");\\n\\t\\t\\t\\t\\t\\t\\tcutButton.onclick = async function() {\\n\\t\\t\\t\\t\\t\\t\\t\\tclipboard = {\\n\\t\\t\\t\\t\\t\\t\\t\\t\\tpath: path + \\\"/\\\" + file,\\n\\t\\t\\t\\t\\t\\t\\t\\t\\tselected: true,\\n\\t\\t\\t\\t\\t\\t\\t\\t\\tcut: true\\n\\t\\t\\t\\t\\t\\t\\t\\t};\\n\\t\\t\\t\\t\\t\\t\\t\\tbrowse();\\n\\t\\t\\t\\t\\t\\t\\t};\\n\\t\\t\\t\\t\\t\\t\\tdisplayResult.appendChild(cutButton);\\n\\t\\t\\t\\t\\t\\t\\tdisplayResult.appendChild(document.createElement(\\\"hr\\\"));\\n\\t\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t\\t\\tlet deleteButton = document.createElement(\\\"button\\\");\\n\\t\\t\\t\\t\\t\\tlet deleteConfirm = false;\\n\\t\\t\\t\\t\\t\\tdeleteButton.innerText = await availableAPIs.lookupLocale(\\\"REMOVE_BTN\\\");\\n\\t\\t\\t\\t\\t\\tdeleteButton.onclick = async function() {\\n\\t\\t\\t\\t\\t\\t\\tif (!deleteConfirm) {\\n\\t\\t\\t\\t\\t\\t\\t\\tdeleteButton.style.fontWeight = \\\"bold\\\";\\n\\t\\t\\t\\t\\t\\t\\t\\tdeleteConfirm = true;\\n\\t\\t\\t\\t\\t\\t\\t\\treturn;\\n\\t\\t\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t\\t\\t\\ttry {\\n\\t\\t\\t\\t\\t\\t\\t\\tlet isDir = await isDirectory(path + \\\"/\\\" + file);\\n\\t\\t\\t\\t\\t\\t\\t\\tif (isDir == \\\"directory\\\") await recursiveRemove(path + \\\"/\\\" + file);\\n\\t\\t\\t\\t\\t\\t\\t\\telse if (isDir == \\\"file\\\") await availableAPIs.fs_rm({ path: path + \\\"/\\\" + file });\\n\\t\\t\\t\\t\\t\\t\\t\\tbrowse();\\n\\t\\t\\t\\t\\t\\t\\t} catch (e) {\\n\\t\\t\\t\\t\\t\\t\\t\\tdisplayResult.innerText = (await availableAPIs.lookupLocale(\\\"FILE_STRUCT_BROWSE_FAIL\\\")).replace(\\\"%s\\\", await availableAPIs.lookupLocale(e.message));\\n\\t\\t\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t\\t\\tdisplayResult.appendChild(deleteButton);\\n\\t\\t\\t\\t\\t\\tdisplayResult.appendChild(document.createElement(\\\"br\\\"));\\n\\t\\t\\t\\t\\t\\tlet permissions = { owner: \\\"nobody\\\", group: \\\"nobody\\\", world: \\\"rx\\\" };\\n\\t\\t\\t\\t\\t\\ttry {\\n\\t\\t\\t\\t\\t\\t\\tpermissions = await availableAPIs.fs_permissions({ path: path + \\\"/\\\" + file });\\n\\t\\t\\t\\t\\t\\t} catch (e) {\\n\\t\\t\\t\\t\\t\\t\\tconsole.error(e);\\n\\t\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t\\t\\tlet chownForm = document.createElement(\\\"form\\\");\\n\\t\\t\\t\\t\\t\\tlet chownInput = document.createElement(\\\"input\\\");\\n\\t\\t\\t\\t\\t\\tlet chownButton = document.createElement(\\\"button\\\");\\n\\t\\t\\t\\t\\t\\tchownInput.value = permissions.owner;\\n\\t\\t\\t\\t\\t\\tchownButton.innerText = await availableAPIs.lookupLocale(\\\"CHOWN_BUTTON\\\");\\n\\t\\t\\t\\t\\t\\tchownForm.appendChild(chownInput);\\n\\t\\t\\t\\t\\t\\tchownForm.appendChild(chownButton);\\n\\t\\t\\t\\t\\t\\tdisplayResult.appendChild(chownForm);\\n\\t\\t\\t\\t\\t\\tchownButton.onclick = async function() {\\n\\t\\t\\t\\t\\t\\t\\ttry {\\n\\t\\t\\t\\t\\t\\t\\t\\tawait availableAPIs.fs_chown({ path: path + \\\"/\\\" + file, newUser: chownInput.value });\\n\\t\\t\\t\\t\\t\\t\\t\\tbrowse();\\n\\t\\t\\t\\t\\t\\t\\t} catch (e) {\\n\\t\\t\\t\\t\\t\\t\\t\\tdisplayResult.innerText = (await availableAPIs.lookupLocale(\\\"FILE_STRUCT_BROWSE_FAIL\\\")).replace(\\\"%s\\\", await availableAPIs.lookupLocale(e.message));\\n\\t\\t\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t\\t\\t}\\n\\n\\t\\t\\t\\t\\t\\tlet chgrpForm = document.createElement(\\\"form\\\");\\n\\t\\t\\t\\t\\t\\tlet chgrpInput = document.createElement(\\\"input\\\");\\n\\t\\t\\t\\t\\t\\tlet chgrpButton = document.createElement(\\\"button\\\");\\n\\t\\t\\t\\t\\t\\tchgrpInput.value = permissions.group;\\n\\t\\t\\t\\t\\t\\tchgrpButton.innerText = await availableAPIs.lookupLocale(\\\"CHGRP_BUTTON\\\");\\n\\t\\t\\t\\t\\t\\tchgrpForm.appendChild(chgrpInput);\\n\\t\\t\\t\\t\\t\\tchgrpForm.appendChild(chgrpButton);\\n\\t\\t\\t\\t\\t\\tdisplayResult.appendChild(chgrpForm);\\n\\t\\t\\t\\t\\t\\tchgrpButton.onclick = async function() {\\n\\t\\t\\t\\t\\t\\t\\ttry {\\n\\t\\t\\t\\t\\t\\t\\t\\tawait availableAPIs.fs_chgrp({ path: path + \\\"/\\\" + file, newGrp: chgrpInput.value });\\n\\t\\t\\t\\t\\t\\t\\t\\tbrowse();\\n\\t\\t\\t\\t\\t\\t\\t} catch (e) {\\n\\t\\t\\t\\t\\t\\t\\t\\tdisplayResult.innerText = (await availableAPIs.lookupLocale(\\\"FILE_STRUCT_BROWSE_FAIL\\\")).replace(\\\"%s\\\", await availableAPIs.lookupLocale(e.message));\\n\\t\\t\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t\\t\\t}\\n\\n\\t\\t\\t\\t\\t\\tlet chmodForm = document.createElement(\\\"form\\\");\\n\\t\\t\\t\\t\\t\\tlet chmodInput = document.createElement(\\\"input\\\");\\n\\t\\t\\t\\t\\t\\tlet chmodButton = document.createElement(\\\"button\\\");\\n\\t\\t\\t\\t\\t\\tchmodInput.value = permissions.world;\\n\\t\\t\\t\\t\\t\\tchownInput.pattern = \\\"[rwx]+\\\";\\n\\t\\t\\t\\t\\t\\tchmodButton.innerText = await availableAPIs.lookupLocale(\\\"CHMOD_BUTTON\\\");\\n\\t\\t\\t\\t\\t\\tchmodForm.appendChild(chmodInput);\\n\\t\\t\\t\\t\\t\\tchmodForm.appendChild(chmodButton);\\n\\t\\t\\t\\t\\t\\tdisplayResult.appendChild(chmodForm);\\n\\t\\t\\t\\t\\t\\tchmodButton.onclick = async function() {\\n\\t\\t\\t\\t\\t\\t\\ttry {\\n\\t\\t\\t\\t\\t\\t\\t\\tawait availableAPIs.fs_chmod({ path: path + \\\"/\\\" + file, newPermissions: chmodInput.value });\\n\\t\\t\\t\\t\\t\\t\\t\\tbrowse();\\n\\t\\t\\t\\t\\t\\t\\t} catch (e) {\\n\\t\\t\\t\\t\\t\\t\\t\\tdisplayResult.innerText = (await availableAPIs.lookupLocale(\\\"FILE_STRUCT_BROWSE_FAIL\\\")).replace(\\\"%s\\\", await availableAPIs.lookupLocale(e.message));\\n\\t\\t\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t\\tdisplayResult.appendChild(openButton);\\n\\t\\t\\t\\t}\\n\\t\\t\\t\\tpreviousDirectory = path;\\n\\t\\t\\t} else if (type == \\\"file\\\") {\\n\\t\\t\\t\\tlet hasError = false;\\n\\t\\t\\t\\tpathElement.value = previousDirectory;\\n\\t\\t\\t\\tif (path.endsWith(\\\".js\\\")) {\\n\\t\\t\\t\\t\\tif (privileges.includes(\\\"START_TASK\\\") && privileges.includes(\\\"ELEVATE_PRIVILEGES\\\") && privileges.includes(\\\"MANAGE_TOKENS\\\")) {\\n\\t\\t\\t\\t\\t\\tif (!globalToken) globalToken = await availableAPIs.consentGetToken({\\n\\t\\t\\t\\t\\t\\t\\tintent: await availableAPIs.lookupLocale(\\\"FILE_EXPLORER_INTENT\\\"),\\n\\t\\t\\t\\t\\t\\t\\tname: await availableAPIs.lookupLocale(\\\"FILE_EXPLORER\\\"),\\n\\t\\t\\t\\t\\t\\t\\tdesiredUser: await availableAPIs.getUser()\\n\\t\\t\\t\\t\\t\\t});\\n\\t\\t\\t\\t\\t\\tif (globalToken) {\\n\\t\\t\\t\\t\\t\\t\\tlet newToken = await availableAPIs.forkToken(globalToken);\\n\\t\\t\\t\\t\\t\\t\\tawait availableAPIs.startTask({ file: path, token: newToken });\\n\\t\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t\\t} else {\\n\\t\\t\\t\\t\\t\\tdisplayResult.innerText = await availableAPIs.lookupLocale(\\\"MORE_PERMISSION_DENIED\\\");\\n\\t\\t\\t\\t\\t\\thasError = true;\\n\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t} else if (path.endsWith(\\\".lnk\\\") && privileges.includes(\\\"ELEVATE_PRIVILEGES\\\") && privileges.includes(\\\"MANAGE_TOKENS\\\")) {\\n\\t\\t\\t\\t\\tlet file = await availableAPIs.fs_read({ path: path });\\n\\t\\t\\t\\t\\tfile = JSON.parse(file);\\n\\t\\t\\t\\t\\tif (privileges.includes(\\\"START_TASK\\\")) {\\n\\t\\t\\t\\t\\t\\tif (!globalToken) globalToken = await availableAPIs.consentGetToken({\\n\\t\\t\\t\\t\\t\\t\\tintent: await availableAPIs.lookupLocale(\\\"FILE_EXPLORER_INTENT\\\"),\\n\\t\\t\\t\\t\\t\\t\\tname: await availableAPIs.lookupLocale(\\\"FILE_EXPLORER\\\"),\\n\\t\\t\\t\\t\\t\\t\\tdesiredUser: await availableAPIs.getUser()\\n\\t\\t\\t\\t\\t\\t});\\n\\t\\t\\t\\t\\t\\tif (globalToken) {\\n\\t\\t\\t\\t\\t\\t\\tlet newToken = await availableAPIs.forkToken(globalToken);\\n\\t\\t\\t\\t\\t\\t\\tawait availableAPIs.startTask({ file: file.path, argPassed: [ ...(file.args || []) ], token: newToken });\\n\\t\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t\\t} else {\\n\\t\\t\\t\\t\\t\\tdisplayResult.innerText = await availableAPIs.lookupLocale(\\\"MORE_PERMISSION_DENIED\\\");\\n\\t\\t\\t\\t\\t\\thasError = true;\\n\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t} else {\\n\\t\\t\\t\\t\\tlet lookUpAssociation = await availableAPIs.fs_ls({ path: await availableAPIs.getSystemMount() + \\\"/apps/associations\\\" });\\n\\t\\t\\t\\t\\tlet fileType = path.split(\\\".\\\").slice(-1)[0];\\n\\t\\t\\t\\t\\tif (!lookUpAssociation.includes(fileType)) return displayResult.innerText = await availableAPIs.lookupLocale(\\\"UNKNOWN_FILE_TYPE\\\");\\n\\t\\t\\t\\t\\tlet file = await availableAPIs.fs_read({ path: await availableAPIs.getSystemMount() + \\\"/apps/associations/\\\" + fileType });\\n\\t\\t\\t\\t\\tlet fileLink = JSON.parse(file);\\n\\t\\t\\t\\t\\tif (privileges.includes(\\\"START_TASK\\\") && privileges.includes(\\\"ELEVATE_PRIVILEGES\\\") && privileges.includes(\\\"MANAGE_TOKENS\\\")) {\\n\\t\\t\\t\\t\\t\\tif (!globalToken) globalToken = await availableAPIs.consentGetToken({\\n\\t\\t\\t\\t\\t\\t\\tintent: await availableAPIs.lookupLocale(\\\"FILE_EXPLORER_INTENT\\\"),\\n\\t\\t\\t\\t\\t\\t\\tname: await availableAPIs.lookupLocale(\\\"FILE_EXPLORER\\\"),\\n\\t\\t\\t\\t\\t\\t\\tdesiredUser: await availableAPIs.getUser()\\n\\t\\t\\t\\t\\t\\t});\\n\\t\\t\\t\\t\\t\\tif (globalToken) {\\n\\t\\t\\t\\t\\t\\t\\tlet newToken = await availableAPIs.forkToken(globalToken);\\n\\t\\t\\t\\t\\t\\t\\tawait availableAPIs.startTask({ file: fileLink.path, argPassed: [ ...(fileLink.args || []), path ], token: newToken });\\n\\t\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t\\t} else {\\n\\t\\t\\t\\t\\t\\tdisplayResult.innerText = await availableAPIs.lookupLocale(\\\"MORE_PERMISSION_DENIED\\\");\\n\\t\\t\\t\\t\\t\\thasError = true;\\n\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t}\\n\\t\\t\\t\\tif (!hasError) await browse();\\n\\t\\t\\t} else {\\n\\t\\t\\t\\tdisplayResult.innerText = (await availableAPIs.lookupLocale(\\\"FILE_STRUCT_BROWSE_FAIL\\\")).replace(\\\"%s\\\", (await availableAPIs.lookupLocale(\\\"UNKNOWN_FS_STRUCT\\\")).replace(\\\"%s\\\", type));\\n\\t\\t\\t}\\n\\t\\t} catch (e) {\\n\\t\\t\\tdisplayResult.innerText = (await availableAPIs.lookupLocale(\\\"FILE_STRUCT_BROWSE_FAIL\\\")).replace(\\\"%s\\\", await availableAPIs.lookupLocale(e.message));\\n\\t\\t}\\n\\t}\\n\\tif (exec_args[0]) pathElement.value = exec_args[0];\\n\\tbrowse();\\n\\tbrowseButton.onclick = browse;\\n})();\\nasync function recursiveRemove(path) {\\n\\tlet dirList = await availableAPIs.fs_ls({ path });\\n\\tfor (let fileIndex in dirList) {\\n\\t\\tlet file = dirList[fileIndex];\\n\\t\\tif (await availableAPIs.fs_isDirectory({ path: path + \\\"/\\\" + file })) await recursiveRemove(path + \\\"/\\\" + file);\\n\\t\\telse await availableAPIs.fs_rm({ path: path + \\\"/\\\" + file });\\n\\t}\\n\\tawait availableAPIs.fs_rm({ path });\\n}\\nasync function isDirectory(path) {\\n\\ttry {\\n\\t\\tlet isDirectoryVar = await availableAPIs.fs_isDirectory({ path });\\n\\t\\treturn isDirectoryVar ? \\\"directory\\\" : \\\"file\\\";\\n\\t} catch {\\n\\t\\treturn \\\"unknown\\\";\\n\\t}\\n}\\naddEventListener(\\\"signal\\\", async function(e) {\\n\\tif (e.detail == 15) {\\n\\t\\ttry {\\n\\t\\t\\tif (globalToken) await availableAPIs.revokeToken(globalToken);\\n\\t\\t} catch {}\\n\\t\\tawait window.availableAPIs.terminate();\\n\\t}\\n}); null;\",\"52e6ce82fde2238fed97121f1d90b48342216246dc7443952b63adc4ca91150e47caf618b643eecaeae819a0d5d803ac64f9b1e6a91127d3eef5fe0652725604\":\"// =====BEGIN MANIFEST=====\\n// signer: automaticSigner\\n// allow: FS_READ, FS_LIST_PARTITIONS, IPC_SEND_PIPE, GET_LOCALE, GET_THEME, FS_BYPASS_PERMISSIONS, GET_USER_INFO\\n// signature: 85410b49152a16a94677f1c8f12f34fa536e92fa2ba6b61fd985cf3ad7d2858ac4711191d3dc621bee50978541bf0da919662d1b94826b9eb788dfa608d78f64\\n// =====END MANIFEST=====\\nlet ipcChannel = exec_args[0];\\n(async function() {\\n\\t// @pcos-app-mode isolatable\\n\\tif (!ipcChannel) return availableAPIs.terminate();\\n\\tawait availableAPIs.windowTitleSet(await availableAPIs.lookupLocale(\\\"FILE_PICKER\\\"));\\n\\tdocument.body.style.fontFamily = \\\"'Segoe UI', Tahoma, Geneva, Verdana, sans-serif\\\";\\n\\tif (await availableAPIs.isDarkThemed()) document.body.style.color = \\\"white\\\";\\n\\tlet privileges = await availableAPIs.getPrivileges();\\n\\tlet checklist = [ \\\"FS_READ\\\", \\\"FS_LIST_PARTITIONS\\\", \\\"IPC_SEND_PIPE\\\" ];\\n\\tif (!checklist.every(p => privileges.includes(p))) {\\n\\t\\tif (privileges.includes(\\\"IPC_SEND_PIPE\\\")) await availableAPIs.sendToPipe({ pipe: ipcChannel, data: { success: false, reason: \\\"permissions\\\" } });\\n\\t\\treturn availableAPIs.terminate();\\n\\t}\\n\\tlet hideHiddenFiles = false;\\n\\ttry {\\n\\t\\tlet homedir = (await availableAPIs.getUserInfo({ desiredUser: await availableAPIs.getUser() })).homeDirectory;\\n\\t\\thideHiddenFiles = true;\\n\\t\\thideHiddenFiles = (await availableAPIs.fs_read({\\n\\t\\t\\tpath: homedir + \\\"/.hiddenFiles\\\",\\n\\t\\t})) != \\\"show\\\";\\n\\t} catch {}\\n\\tdocument.body.innerText = \\\"\\\";\\n\\tlet mainComponent = document.createElement(\\\"div\\\");\\n\\tlet pathInputForm = document.createElement(\\\"form\\\");\\n\\tlet pathElement = document.createElement(\\\"input\\\");\\n\\tpathElement.value = exec_args[2] || \\\"\\\";\\n\\tlet browseButton = document.createElement(\\\"button\\\");\\n\\tlet displayResult = document.createElement(\\\"div\\\");\\n\\tlet newItemInput = document.createElement(\\\"input\\\");\\n\\tlet newItemBrowse = document.createElement(\\\"button\\\");\\n\\tlet newItemContainer = document.createElement(\\\"div\\\");\\n\\tlet previousDirectory = \\\"\\\";\\n\\tlet isDefaultChoice = true;\\n\\tmainComponent.style.display = \\\"flex\\\";\\n\\tmainComponent.style.flexDirection = \\\"column\\\";\\n\\tmainComponent.style.width = \\\"100%\\\";\\n\\tmainComponent.style.height = \\\"100%\\\";\\n\\tmainComponent.style.position = \\\"absolute\\\";\\n\\tmainComponent.style.top = \\\"0\\\";\\n\\tmainComponent.style.left = \\\"0\\\";\\n\\tmainComponent.style.padding = \\\"8px\\\";\\n\\tmainComponent.style.boxSizing = \\\"border-box\\\";\\n\\tdisplayResult.style.flex = \\\"1\\\";\\n\\tnewItemBrowse.innerText = await availableAPIs.lookupLocale(\\\"SAVE_BTN\\\");\\n\\tnewItemContainer.appendChild(document.createElement(\\\"hr\\\"));\\n\\tnewItemContainer.appendChild(newItemInput);\\n\\tbrowseButton.innerText = await availableAPIs.lookupLocale(\\\"BROWSE_FEXP\\\");\\n\\tnewItemContainer.appendChild(newItemBrowse);\\n\\tpathInputForm.appendChild(pathElement);\\n\\tpathInputForm.appendChild(browseButton);\\n\\tmainComponent.appendChild(pathInputForm);\\n\\tmainComponent.appendChild(displayResult);\\n\\tmainComponent.appendChild(newItemContainer);\\n\\tdocument.body.appendChild(mainComponent);\\n\\tnewItemContainer.hidden = exec_args[1] != \\\"save\\\";\\n\\tasync function browse() {\\n\\t\\tlet path = pathElement.value;\\n\\t\\tif (path.endsWith(\\\"/\\\")) path = path.substring(0, path.length - 1);\\n\\t\\tdisplayResult.innerText = \\\"\\\";\\n\\t\\tif (path == \\\"\\\") {\\n\\t\\t\\tlet partitions = await availableAPIs.fs_mounts();\\n\\t\\t\\tfor (let partition of partitions) {\\n\\t\\t\\t\\tif (partition.startsWith(\\\".\\\") && hideHiddenFiles) continue;\\n\\t\\t\\t\\tlet openButton = document.createElement(\\\"button\\\");\\n\\t\\t\\t\\topenButton.innerText = partition;\\n\\t\\t\\t\\topenButton.onclick = function() {\\n\\t\\t\\t\\t\\tpathElement.value = partition;\\n\\t\\t\\t\\t\\tbrowse();\\n\\t\\t\\t\\t}\\n\\t\\t\\t\\tdisplayResult.appendChild(openButton);\\n\\t\\t\\t}\\n\\t\\t\\tpreviousDirectory = path;\\n\\t\\t\\treturn \\\"browsed\\\";\\n\\t\\t}\\n\\t\\ttry {\\n\\t\\t\\tlet type = await isDirectory(path);\\n\\t\\t\\tif (type == \\\"directory\\\") {\\n\\t\\t\\t\\tlet ls = await availableAPIs.fs_ls({ path: path });\\n\\t\\t\\t\\tfor (let file of ls) {\\n\\t\\t\\t\\t\\tif (file.startsWith(\\\".\\\") && hideHiddenFiles) continue;\\n\\t\\t\\t\\t\\tlet openButton = document.createElement(\\\"button\\\");\\n\\t\\t\\t\\t\\topenButton.innerText = file;\\n\\t\\t\\t\\t\\topenButton.onclick = function() {\\n\\t\\t\\t\\t\\t\\tpathElement.value = path + \\\"/\\\" + file;\\n\\t\\t\\t\\t\\t\\tbrowse();\\n\\t\\t\\t\\t\\t}\\n\\t\\t\\t\\t\\tdisplayResult.appendChild(openButton);\\n\\t\\t\\t\\t}\\n\\t\\t\\t\\tpreviousDirectory = path;\\n\\t\\t\\t} else if (type == \\\"file\\\" || (type == \\\"unknown\\\" && exec_args[1] == \\\"save\\\")) {\\n\\t\\t\\t\\tif (isDefaultChoice) {\\n\\t\\t\\t\\t\\tpathElement.value = path.split(\\\"/\\\").slice(0, -1).join(\\\"/\\\");\\n\\t\\t\\t\\t\\tnewItemInput.value = path.split(\\\"/\\\").slice(-1)[0];\\n\\t\\t\\t\\t\\treturn browse();\\n\\t\\t\\t\\t}\\n\\t\\t\\t\\tdisplayResult.innerText = \\\"\\\";\\n\\t\\t\\t\\tawait availableAPIs.sendToPipe({ pipe: ipcChannel, data: { success: true, selected: path } });\\n\\t\\t\\t\\tawait availableAPIs.terminate();\\n\\t\\t\\t} else {\\n\\t\\t\\t\\tdisplayResult.innerText = (await availableAPIs.lookupLocale(\\\"FILE_STRUCT_BROWSE_FAIL\\\")).replace(\\\"%s\\\", (await availableAPIs.lookupLocale(\\\"UNKNOWN_FS_STRUCT\\\")).replace(\\\"%s\\\", type));\\n\\t\\t\\t}\\n\\t\\t} catch (e) {\\n\\t\\t\\tdisplayResult.innerText = (await availableAPIs.lookupLocale(\\\"FILE_STRUCT_BROWSE_FAIL\\\")).replace(\\\"%s\\\", await availableAPIs.lookupLocale(e.message));\\n\\t\\t}\\n\\t\\tisDefaultChoice = false;\\n\\t}\\n\\tbrowse();\\n\\tbrowseButton.onclick = browse;\\n\\tnewItemBrowse.onclick = async function() {\\n\\t\\tif (previousDirectory == \\\"\\\") return displayResult.innerText = (await availableAPIs.lookupLocale(\\\"FILE_STRUCT_BROWSE_FAIL\\\")).replace(\\\"%s\\\", await availableAPIs.lookupLocale(\\\"NO_SAVE_IN_MTN\\\"));\\n\\t\\tpathElement.value = previousDirectory + \\\"/\\\" + newItemInput.value;\\n\\t\\tbrowse();\\n\\t}\\n})();\\nasync function isDirectory(path) {\\n\\ttry {\\n\\t\\tlet isDirectoryVar = await availableAPIs.fs_isDirectory({ path });\\n\\t\\treturn isDirectoryVar ? \\\"directory\\\" : \\\"file\\\";\\n\\t} catch {\\n\\t\\treturn \\\"unknown\\\";\\n\\t}\\n}\\naddEventListener(\\\"signal\\\", async function(e) {\\n\\tif (e.detail == 15) {\\n\\t\\ttry {\\n\\t\\t\\tawait availableAPIs.sendToPipe({ pipe: ipcChannel, data: { success: false, reason: \\\"closed\\\" } });\\n\\t\\t} catch {}\\n\\t\\tawait window.availableAPIs.terminate();\\n\\t}\\n}); null;\",\"c2195c06898aa3ee8f4055778d4e189afd8bae234fc25cfc56d2805059ba6102a0dc29e0a45759693d035e74bb33fbcd6ccaba422800045fffedc22742b934f9\":\"{\\\"path\\\":\\\"system/apps/explorer.js\\\",\\\"localeReferenceName\\\":\\\"FILE_EXPLORER\\\"}\",\"5132780bcc24a9d663f876551a891df544c4e22ecc37426432ae43861a9e88f63ddaad2c47f9e0d76dca6d13a4bf003b03782f7fc2a7cbece15bcf4dbde0135d\":\"{\\\"path\\\":\\\"system/apps/textEditor.js\\\",\\\"localeReferenceName\\\":\\\"TEXT_EDITOR\\\"}\",\"53f5e30b81fbbc35e929208fb6711ec351ccb1ff3b6987bb72d9bf90f729d86fa8f482651e9b6b2a82a05cd2f0b3e58e8822ae3f14c5a630c5afeae9f2e6efb7\":\"// =====BEGIN MANIFEST=====\\n// signer: automaticSigner\\n// allow: FS_READ, FS_LIST_PARTITIONS, IPC_SEND_PIPE, IPC_LISTEN_PIPE, GET_LOCALE, GET_THEME, FS_BYPASS_PERMISSIONS, SYSTEM_SHUTDOWN, GET_USER_INFO, LOGOUT, GET_SCREEN_INFO, GRAB_ATTENTION, LULL_SYSTEM\\n// signature: 07e9adb5d05d209981cd98ee9542d184ba668ffc3097166c5355a71fb0937b7f9d0d542576db441c29dba753d3a37a9426c2b7d41457e9fc3f0976b29c62fdea\\n// =====END MANIFEST=====\\nlet ipcChannel;\\nlet shouldShutdown = false;\\nlet visibilityState = true;\\nlet hexToU8A = (hex) => Uint8Array.from(hex.match(/.{1,2}/g).map(a => parseInt(a, 16)));\\nlet u8aToHex = (u8a) => Array.from(u8a).map(a => a.toString(16).padStart(2, \\\"0\\\")).join(\\\"\\\");\\n(async function() {\\n\\t// @pcos-app-mode isolatable\\n\\tipcChannel = await availableAPIs.getPrivateData();\\n\\tif (!ipcChannel) return availableAPIs.terminate();\\n\\tawait visibility(false);\\n\\tawait window.availableAPIs.windowTitleSet(await window.availableAPIs.lookupLocale(\\\"START_MENU\\\"));\\n\\tdocument.body.style.fontFamily = \\\"'Segoe UI', Tahoma, Geneva, Verdana, sans-serif\\\";\\n\\tif (await availableAPIs.isDarkThemed()) document.body.style.color = \\\"white\\\";\\n\\tlet privileges = await availableAPIs.getPrivileges();\\n\\tlet checklist = [ \\\"FS_READ\\\", \\\"FS_LIST_PARTITIONS\\\", \\\"IPC_SEND_PIPE\\\", \\\"IPC_LISTEN_PIPE\\\" ];\\n\\tif (!checklist.every(p => privileges.includes(p))) return availableAPIs.terminate();\\n\\tawait availableAPIs.sendToPipe({ pipe: ipcChannel, data: { success: true } });\\n\\tdocument.body.innerText = \\\"\\\";\\n\\tlet logoutButton = document.createElement(\\\"button\\\");\\n\\tlogoutButton.innerText = (await availableAPIs.lookupLocale(\\\"LOG_OUT_BUTTON\\\")).replace(\\\"%s\\\", await availableAPIs.getUser());\\n\\tdocument.body.appendChild(logoutButton);\\n\\tlogoutButton.onclick = async function() {\\n\\t\\tshouldShutdown = true;\\n\\t\\tawait visibility(false);\\n\\t\\tawait availableAPIs.logOut(await availableAPIs.getUser());\\n\\t}\\n\\tlet lockButton = document.createElement(\\\"button\\\");\\n\\tlockButton.innerText = await availableAPIs.lookupLocale(\\\"LOCK_BUTTON\\\");\\n\\tdocument.body.appendChild(lockButton);\\n\\tlockButton.onclick = async function() {\\n\\t\\tawait visibility(false);\\n\\t\\tawait availableAPIs.lock();\\n\\t}\\n\\tif (privileges.includes(\\\"SYSTEM_SHUTDOWN\\\")) {\\n\\t\\tlet shutoff = document.createElement(\\\"button\\\");\\n\\t\\tshutoff.innerText = await availableAPIs.lookupLocale(\\\"TURN_OFF_BUTTON\\\");\\n\\t\\tdocument.body.appendChild(shutoff);\\n\\t\\tshutoff.onclick = async function() {\\n\\t\\t\\tshouldShutdown = true;\\n\\t\\t\\tawait visibility(false);\\n\\t\\t\\tawait availableAPIs.shutdown({ isReboot: false });\\n\\t\\t}\\n\\t\\tlet reboot = document.createElement(\\\"button\\\");\\n\\t\\treboot.innerText = await availableAPIs.lookupLocale(\\\"RESTART_BUTTON\\\");\\n\\t\\tdocument.body.appendChild(reboot);\\n\\t\\treboot.onclick = async function() {\\n\\t\\t\\tshouldShutdown = true;\\n\\t\\t\\tawait visibility(false);\\n\\t\\t\\tawait availableAPIs.shutdown({ isReboot: true, isKexec: true });\\n\\t\\t}\\n\\t\\treboot.oncontextmenu = async function(e) {\\n\\t\\t\\te.stopImmediatePropagation();\\n\\t\\t\\te.stopPropagation();\\n\\t\\t\\te.preventDefault();\\n\\t\\t\\tshouldShutdown = true;\\n\\t\\t\\tawait visibility(false);\\n\\t\\t\\tawait availableAPIs.shutdown({ isReboot: true, isKexec: false });\\n\\t\\t}\\n\\t}\\n\\tif (privileges.includes(\\\"LULL_SYSTEM\\\")) {\\n\\t\\tlet lull = document.createElement(\\\"button\\\");\\n\\t\\tlull.innerText = await availableAPIs.lookupLocale(\\\"LULL_SYSTEM\\\");\\n\\t\\tdocument.body.appendChild(lull);\\n\\t\\tlull.onclick = async function() {\\n\\t\\t\\tawait visibility(false);\\n\\t\\t\\tawait availableAPIs.lull();\\n\\t\\t}\\n\\t}\\n\\ttry {\\n\\t\\tlet enumeration = await availableAPIs.fs_ls({ path: (await availableAPIs.getSystemMount()) + \\\"/apps/links\\\" });\\n\\t\\tfor (let app of enumeration) {\\n\\t\\t\\tlet appLink = await availableAPIs.fs_read({ path: (await availableAPIs.getSystemMount()) + \\\"/apps/links/\\\" + app });\\n\\t\\t\\tappLink = JSON.parse(appLink);\\n\\t\\t\\tif (appLink.disabled) continue;\\n\\t\\t\\tlet appBtn = document.createElement(\\\"button\\\");\\n\\t\\t\\tappBtn.innerText = (appLink.localeReferenceName ? await availableAPIs.lookupLocale(appLink.localeReferenceName) : null) || (appLink.localeDatabaseName ? (appLink.localeDatabaseName[navigator.language.slice(0, 2).toLowerCase()] || appLink.localeDatabaseName[await availableAPIs.osLocale()]) : null) || appLink.name;\\n\\t\\t\\tappBtn.title = await availableAPIs.lookupLocale(\\\"PROVISIONED_PREFERENCE\\\");\\n\\t\\t\\tappBtn.onclick = async function() {\\n\\t\\t\\t\\tawait visibility(false);\\n\\t\\t\\t\\tawait availableAPIs.sendToPipe({ pipe: ipcChannel, data: { run: appLink } });\\n\\t\\t\\t}\\n\\t\\t\\tdocument.body.appendChild(appBtn);\\n\\t\\t}\\n\\t} catch (e) {\\n\\t\\tconsole.error(\\\"Failed to enumerate system app links\\\", e);\\n\\t}\\n\\ttry {\\n\\t\\tlet enumeration = await availableAPIs.fs_ls({ path: (await availableAPIs.getUserInfo({ desiredUser: await availableAPIs.getUser() })).homeDirectory + \\\"/.applinks\\\" });\\n\\t\\tfor (let app of enumeration) {\\n\\t\\t\\tlet appLink = await availableAPIs.fs_read({ path: (await availableAPIs.getUserInfo({ desiredUser: await availableAPIs.getUser() })).homeDirectory + \\\"/.applinks/\\\" + app });\\n\\t\\t\\tappLink = JSON.parse(appLink);\\n\\t\\t\\tif (appLink.disabled) continue;\\n\\t\\t\\tlet appBtn = document.createElement(\\\"button\\\");\\n\\t\\t\\tappBtn.innerText = (appLink.localeReferenceName ? await availableAPIs.lookupLocale(appLink.localeReferenceName) : null) || (appLink.localeDatabaseName ? (appLink.localeDatabaseName[navigator.language.slice(0, 2).toLowerCase()] || appLink.localeDatabaseName[await availableAPIs.osLocale()]) : null) || appLink.name;\\n\\t\\t\\tappBtn.onclick = async function() {\\n\\t\\t\\t\\tawait visibility(false);\\n\\t\\t\\t\\tawait availableAPIs.sendToPipe({ pipe: ipcChannel, data: { run: appLink } });\\n\\t\\t\\t}\\n\\t\\t\\tdocument.body.appendChild(appBtn);\\n\\t\\t}\\n\\t} catch (e) {\\n\\t\\tconsole.error(\\\"Failed to enumerate user app links\\\", e);\\n\\t}\\n\\n\\tonresize = shapeshift;\\n\\n\\twhile (true) {\\n\\t\\tlet listen = await availableAPIs.listenToPipe(ipcChannel);\\n\\t\\tif (listen.open) {\\n\\t\\t\\tawait visibility();\\n\\t\\t\\tshapeshift();\\n\\t\\t}\\n\\t}\\n})();\\n\\nasync function visibility(wantedState) {\\n\\tif (!wantedState) wantedState = !visibilityState;\\n\\tif (wantedState == visibilityState) return;\\n\\tawait availableAPIs.windowVisibility(wantedState);\\n\\tvisibilityState = wantedState;\\n}\\n\\nasync function shapeshift() {\\n\\tlet screenInfo = await availableAPIs.getScreenInfo();\\n\\tlet winSize = await availableAPIs.windowSize();\\n\\tawait availableAPIs.windowRelocate([ screenInfo.height - (winSize.height / 2) - 35 - 8, winSize.width / 2 + 8 ]);\\n}\\n\\naddEventListener(\\\"signal\\\", async function(e) {\\n\\tif (e.detail == 15) {\\n\\t\\tawait visibility(false);\\n\\t\\tawait availableAPIs.sendToPipe({ pipe: ipcChannel, data: { dying: true } });\\n\\t\\tawait availableAPIs.terminate();\\n\\t}\\n}); null;\",\"b54a69ffe6d84e0f8ffe5f80ebf0293ca3cf847acf932756bea12fe083c356cc334a2faa131e5faffc239803666570d3ba07fb9a189b982fa799a9612439834a\":\"// =====BEGIN MANIFEST=====\\n// link: lrn:TEXT_EDITOR\\n// association: txt\\n// signer: automaticSigner\\n// allow: FS_READ, FS_WRITE, FS_LIST_PARTITIONS, IPC_CREATE_PIPE, IPC_LISTEN_PIPE, GET_LOCALE, GET_THEME, START_TASK, IPC_SEND_PIPE, FS_BYPASS_PERMISSIONS, GET_USER_INFO\\n// signature: 12efce925a3dba50b633987dafa3ff021e0c79e5044c9816916b6d69656261a8a19313de568a879e242859588597c3ae095ea0b56963bbb25a14b2e9562c66cd\\n// =====END MANIFEST=====\\n(async function() {\\n\\t// @pcos-app-mode isolatable\\n\\tawait availableAPIs.windowTitleSet(await availableAPIs.lookupLocale(\\\"TEXT_EDITOR\\\"));\\n\\tdocument.body.style.fontFamily = \\\"'Segoe UI', Tahoma, Geneva, Verdana, sans-serif\\\";\\n\\tif (await availableAPIs.isDarkThemed()) document.body.style.color = \\\"white\\\";\\n\\tdocument.documentElement.style.height = \\\"100%\\\";\\n\\tdocument.documentElement.style.width = \\\"100%\\\";\\n\\tdocument.body.style.height = \\\"100%\\\";\\n\\tdocument.body.style.width = \\\"100%\\\";\\n\\tdocument.body.style.margin = \\\"0\\\";\\n\\tlet flexContainer = document.createElement(\\\"div\\\");\\n\\tlet buttonContainer = document.createElement(\\\"div\\\");\\n\\tlet loadButton = document.createElement(\\\"button\\\");\\n\\tlet saveButton = document.createElement(\\\"button\\\");\\n\\tlet statusMessage = document.createElement(\\\"span\\\");\\n\\tlet data = document.createElement(\\\"textarea\\\");\\n\\tlet hr = document.createElement(\\\"hr\\\");\\n\\tlet hrContainer = document.createElement(\\\"div\\\");\\n\\tlet lastFile = \\\"\\\";\\n\\tloadButton.innerText = await availableAPIs.lookupLocale(\\\"LOAD_BTN\\\");\\n\\tsaveButton.innerText = await availableAPIs.lookupLocale(\\\"SAVE_BTN\\\");\\n\\tflexContainer.style.display = \\\"flex\\\";\\n\\tflexContainer.style.flexDirection = \\\"column\\\";\\n\\tflexContainer.style.width = \\\"100%\\\";\\n\\tflexContainer.style.height = \\\"100%\\\";\\n\\tdata.style.flexGrow = 1000;\\n\\tdata.style.resize = \\\"none\\\";\\n\\tif (await availableAPIs.isDarkThemed()) {\\n\\t\\tdata.style.backgroundColor = \\\"#2b2a33\\\";\\n\\t\\tdata.style.color = \\\"white\\\";\\n\\t}\\n\\tbuttonContainer.appendChild(loadButton);\\n\\tbuttonContainer.appendChild(saveButton);\\n\\tbuttonContainer.appendChild(statusMessage);\\n\\thrContainer.appendChild(hr);\\n\\tflexContainer.appendChild(buttonContainer);\\n\\tflexContainer.appendChild(hrContainer);\\n\\tflexContainer.appendChild(data);\\n\\tdocument.body.appendChild(flexContainer);\\n\\ttry {\\n\\t\\tif (exec_args[0]) {\\n\\t\\t\\tdata.value = await availableAPIs.fs_read({ path: exec_args[0] });\\n\\t\\t\\tlastFile = exec_args[0];\\n\\t\\t\\tstatusMessage.innerText = exec_args[0].split(\\\"/\\\").pop();\\n\\t\\t}\\n\\t} catch (e) {\\n\\t\\tstatusMessage.innerText = e.name + \\\": \\\" + e.message;\\n\\t}\\n\\tloadButton.onclick = async function() {\\n\\t\\tlet ipcPipe = await availableAPIs.createPipe();\\n\\t\\tawait availableAPIs.windowVisibility(false);\\n\\t\\tawait availableAPIs.startTask({ file: (await availableAPIs.getSystemMount()) + \\\"/apps/filePicker.js\\\", argPassed: [ipcPipe, \\\"load\\\", lastFile] });\\n\\t\\tlet result = await availableAPIs.listenToPipe(ipcPipe);\\n\\t\\tawait availableAPIs.closePipe(ipcPipe);\\n\\t\\tawait availableAPIs.windowVisibility(true);\\n\\t\\ttry {\\n\\t\\t\\tif (result.success) {\\n\\t\\t\\t\\tdata.value = await availableAPIs.fs_read({ path: result.selected });\\n\\t\\t\\t\\tlastFile = result.selected;\\n\\t\\t\\t\\tstatusMessage.innerText = result.selected.split(\\\"/\\\").pop();\\n\\t\\t\\t}\\n\\t\\t} catch (e) {\\n\\t\\t\\tstatusMessage.innerText = e.name + \\\": \\\" + e.message;\\n\\t\\t}\\n\\t}\\n\\tsaveButton.onclick = async function() {\\n\\t\\tlet ipcPipe = await availableAPIs.createPipe();\\n\\t\\tawait availableAPIs.windowVisibility(false);\\n\\t\\tawait availableAPIs.startTask({ file: (await availableAPIs.getSystemMount()) + \\\"/apps/filePicker.js\\\", argPassed: [ipcPipe, \\\"save\\\", lastFile] });\\n\\t\\tlet result = await availableAPIs.listenToPipe(ipcPipe);\\n\\t\\tawait availableAPIs.closePipe(ipcPipe);\\n\\t\\tawait availableAPIs.windowVisibility(true);\\n\\t\\ttry {\\n\\t\\t\\tif (result.success) {\\n\\t\\t\\t\\tawait availableAPIs.fs_write({ path: result.selected, data: data.value });\\n\\t\\t\\t\\tlastFile = result.selected;\\n\\t\\t\\t\\tstatusMessage.innerText = result.selected.split(\\\"/\\\").pop();\\n\\t\\t\\t}\\n\\t\\t} catch (e) {\\n\\t\\t\\tstatusMessage.innerText = e.name + \\\": \\\" + e.message;\\n\\t\\t}\\n\\t}\\n})();\\naddEventListener(\\\"signal\\\", async function(e) {\\n\\tif (e.detail == 15) await window.availableAPIs.terminate();\\n}); null;\",\"b2afc16aaeebd8d235d683a3a77dd6316b1b96c40b5f4ce7e0a9ae4223c29e1cf5992d0b691823f72cdd855edc42b16d1ede127e61e37fbf3a57829fed13676c\":\"{\\n\\t\\\"basic\\\": \\\"7f00000150434f53334e6574776f726b\\\",\\n\\t\\\"pc\\\": \\\"7f00000150434f53334e6574776f726b\\\"\\n}\"},\"buildInfo\":{\"for\":\"1298\",\"when\":1750440209976,\"signer\":\"moduleSigner\",\"critical\":true,\"signature\":\"8cb64834c1966fe4831f277e70feaceef1721a214011c9a3c009fc205ec14ad6953450d602aec5c0ad7596afca9e461ca04c5418dfe7269f9f828ae09ab0370c\"}}");
// modules/50-locale-en.fs
modules.fs.write(".installer/modules/50-locale-en.fs", "{\"backend\":{\"files\":{\"boot\":{\"06-localesappend-en.js\":\"641125012c81c8e5f121fcdab9a5887f8404fbbca374a22ad977c4c62714de855cbc02d8d8b4f13c73e8182a3519e012328bb2e490ba5234eeef7b7b129f6bad\"}},\"permissions\":{\"boot/06-localesappend-en.js\":{\"world\":\"rx\"},\"boot/\":{\"world\":\"rx\"},\"\":{\"world\":\"rx\"}}},\"files\":{\"641125012c81c8e5f121fcdab9a5887f8404fbbca374a22ad977c4c62714de855cbc02d8d8b4f13c73e8182a3519e012328bb2e490ba5234eeef7b7b129f6bad\":\"modules.locales.en = {\\n    \\\"UNTITLED_APP\\\": \\\"Untitled program\\\",\\n\\t\\\"PERMISSION_DENIED\\\": \\\"Permission denied\\\",\\n\\t\\\"MORE_PERMISSION_DENIED\\\": \\\"There are not enough permissions to run this program.\\\",\\n\\t\\\"COMPATIBILITY_ISSUE_TITLE\\\": \\\"Compatibility issue\\\",\\n\\t\\\"COMPATIBILITY_ISSUE\\\": \\\"This program cannot run on this computer as a task. Check the application modes to include \\\\\\\"isolatable\\\\\\\".\\\",\\n\\t\\\"APP_STARTUP_CRASH_TITLE\\\": \\\"Something went wrong\\\",\\n\\t\\\"APP_STARTUP_CRASH\\\": \\\"The system failed to execute this program.\\\",\\n\\t\\\"JS_TERMINAL\\\": \\\"JavaScript Terminal\\\",\\n\\t\\\"TERMINAL_INVITATION\\\": \\\"PCOS 3, build %s\\\",\\n\\t\\\"PCOS_RESTARTING\\\": \\\"PCOS is restarting. %s\\\",\\n\\t\\\"PLEASE_WAIT\\\": \\\"Please wait.\\\",\\n\\t\\\"POLITE_CLOSE_SIGNAL\\\": \\\"Sending polite close.\\\",\\n\\t\\\"ABRUPT_CLOSE_SIGNAL\\\": \\\"Sending abrupt close.\\\",\\n\\t\\\"UNMOUNTING_MOUNTS\\\": \\\"Unmounting mounts.\\\",\\n\\t\\\"SAFE_TO_CLOSE\\\": \\\"It is now safe to close this tab.\\\",\\n\\t\\\"RESTART_BUTTON\\\": \\\"Reboot\\\",\\n\\t\\\"RESTARTING\\\": \\\"Restarting.\\\",\\n\\t\\\"INSTALL_PCOS\\\": \\\"Install PCOS\\\",\\n\\t\\\"INSTALLER_TITLE\\\": \\\"PCOS 3 Installer\\\",\\n\\t\\\"CLOSE_INSTALLER_CONFIRMATION\\\": \\\"Are you sure you want to stop the installation process? This computer will restart.\\\",\\n\\t\\\"YES\\\": \\\"Yes\\\",\\n\\t\\\"NO\\\": \\\"No\\\",\\n\\t\\\"INSTALLER_INVITATION\\\": \\\"You are installing PCOS 3 build %s on this computer.\\\",\\n\\t\\\"INSTALL_BUTTON\\\": \\\"Install\\\",\\n\\t\\\"LIVE_BUTTON\\\": \\\"Try out\\\",\\n\\t\\\"INSTALLER_PARTITIONING\\\": \\\"Select the boot and data partitions you would like to use.\\\",\\n\\t\\\"PARTITIONING_USE\\\": \\\"Use partitions\\\",\\n\\t\\\"PARTITION_DATA\\\": \\\"Data partition\\\",\\n\\t\\\"PARTITION_BOOT\\\": \\\"Boot partition\\\",\\n\\t\\\"FORMAT_DATA\\\": \\\"Format to PCFS\\\",\\n\\t\\\"DATA_INPUT_ALERT\\\": \\\"Please enter a data partition name.\\\",\\n\\t\\\"PROMPT_PARTITION_TABLE\\\": \\\"This disk does not seem to contain a valid partition table. Do you want to insert a partition table?\\\",\\n\\t\\\"CONFIRM_PARTITION_ERASE\\\": \\\"All data on that partition will be erased. Continue?\\\",\\n\\t\\\"BOOT_INPUT_ALERT\\\": \\\"Please enter a boot partition name.\\\",\\n\\t\\\"CANNOT_FIND_PARTITION\\\": \\\"Can't find a disk partition. Please try formatting the data partition to PCFS.\\\",\\n\\t\\\"PCFS_DETECTION_ERROR\\\": \\\"The data partition doesn't seem to contain PCFS. Do you still want to use it?\\\",\\n\\t\\\"INSTALLING_PCOS\\\": \\\"Installing PCOS: %s\\\",\\n\\t\\\"CREATING_BOOT_PARTITION\\\": \\\"Creating boot partition\\\",\\n\\t\\\"MOUNTING_DATA_PARTITION\\\": \\\"Mounting data partition as 'target'\\\",\\n\\t\\\"CHANGING_ROOT_PERMISSIONS\\\": \\\"Changing / permissions\\\",\\n\\t\\\"COPYING_FOLDERS\\\": \\\"Copying directories\\\",\\n\\t\\\"PREPARING_FOR_COPY\\\": \\\"Preparing for copying\\\",\\n\\t\\\"CHANGING_BOOT_PERMISSIONS\\\": \\\"Changing /boot permissions\\\",\\n\\t\\\"PATCHING_FS\\\": \\\"Patching for data mount\\\",\\n\\t\\\"INSTALLATION_SUCCESSFUL\\\": \\\"Successful installation. Close window to reboot.\\\",\\n\\t\\\"INSTALLATION_FAILED\\\": \\\"Installation of PCOS failed. Please try again. Close window to reboot.\\\",\\n\\t\\\"CREATING_DIR\\\": \\\"Creating %s\\\",\\n\\t\\\"COPYING_FILE\\\": \\\"Copying %s\\\",\\n\\t\\\"COMPLETE_COPY\\\": \\\"Complete copying %s\\\",\\n\\t\\\"REMOVING_OBJECT\\\": \\\"Removing %s\\\",\\n\\t\\\"COMPLETE_REMOVE\\\": \\\"Complete removing %s\\\",\\n\\t\\\"SHORT_DAYS\\\": \\\"%sd\\\",\\n\\t\\\"SHORT_HOURS\\\": \\\"%sh\\\",\\n\\t\\\"SHORT_MINUTES\\\": \\\"%smin\\\",\\n\\t\\\"SHORT_SECONDS\\\": \\\"%ss\\\",\\n\\t\\\"SHORT_MILLISECONDS\\\": \\\"%sms\\\",\\n\\t\\\"SHORT_TERABYTES\\\": \\\"%sTB\\\",\\n\\t\\\"SHORT_GIGABYTES\\\": \\\"%sGB\\\",\\n\\t\\\"SHORT_MEGABYTES\\\": \\\"%sMB\\\",\\n\\t\\\"SHORT_KILOBYTES\\\": \\\"%sKB\\\",\\n\\t\\\"SHORT_BYTES\\\": \\\"%sB\\\",\\n\\t\\\"AUTH_FAILED_NEW\\\": \\\"Authentication failed, please use a new instance!\\\",\\n\\t\\\"AUTH_SUCCESS\\\": \\\"Authentication successful.\\\",\\n\\t\\\"AUTH_FAILED\\\": \\\"Authentication failed.\\\",\\n\\t\\\"PLEASE_WAIT_TIME\\\": \\\"Please wait %s\\\",\\n\\t\\\"REPORTING_LOGON\\\": \\\"Reporting logon to server...\\\",\\n\\t\\\"TOTP_PC_PROMPT\\\": \\\"Enter TOTP-PC code\\\",\\n\\t\\\"TOTP_PROMPT\\\": \\\"Enter TOTP code\\\",\\n\\t\\\"ACCESS_NOT_SETUP\\\": \\\"Access to this user is not set up\\\",\\n\\t\\\"PASSWORD_PROMPT\\\": \\\"Enter password\\\",\\n\\t\\\"ENTER_BUTTON\\\": \\\"Enter\\\",\\n\\t\\\"USERNAME_PROMPT\\\": \\\"Enter an username.\\\",\\n\\t\\\"USERNAME\\\": \\\"Username\\\",\\n\\t\\\"ACCESS_FN_FAIL\\\": \\\"No such user.\\\",\\n\\t\\\"PROMPT_GET_FAIL\\\": \\\"Something went wrong while getting the authentication prompt.\\\",\\n\\t\\\"LET_TRY_AGAIN\\\": \\\"Let's try again.\\\",\\n\\t\\\"RESPONSE_PLACEHOLDER\\\": \\\"Response...\\\",\\n\\t\\\"START_MENU_BTN\\\": \\\"Start\\\",\\n\\t\\\"START_MENU\\\": \\\"Start menu\\\",\\n\\t\\\"LOG_IN_INVITATION\\\": \\\"Log in\\\",\\n\\t\\\"LOG_OUT_BUTTON\\\": \\\"Log out (%s)\\\",\\n\\t\\\"LOCK_BUTTON\\\": \\\"Lock\\\",\\n\\t\\\"TERMINAL_BUTTON\\\": \\\"Terminal\\\",\\n\\t\\\"TURN_OFF_BUTTON\\\": \\\"Turn off\\\",\\n\\t\\\"PASSWORD\\\": \\\"Password\\\",\\n\\t\\\"SET_UP_PCOS\\\": \\\"Set up PCOS\\\",\\n\\t\\\"LET_SETUP_SYSTEM\\\": \\\"Let's set up the system now.\\\",\\n\\t\\\"SET_UP\\\": \\\"Set up\\\",\\n\\t\\\"LET_CREATE_ACCOUNT\\\": \\\"Let's create your own user account.\\\",\\n\\t\\\"CREATE\\\": \\\"Create\\\",\\n\\t\\\"PASSWORD_INPUT_ALERT\\\": \\\"Please enter a password!\\\",\\n\\t\\\"SETUP_SUCCESSFUL\\\": \\\"Successful setup. Close window to log in.\\\",\\n\\t\\\"CREATING_USER_STRUCTURE\\\": \\\"Creating user structure\\\",\\n\\t\\\"CREATING_USER\\\": \\\"Creating user\\\",\\n\\t\\\"INSTALLING_WPS\\\": \\\"Installing wallpapers\\\",\\n\\t\\\"INSTALLING_APPS\\\": \\\"Installing programs\\\",\\n\\t\\\"INSTALLING_WP2U\\\": \\\"Installing wallpaper to user\\\",\\n\\t\\\"REMOVING_2STAGE\\\": \\\"Removing second-stage installer\\\",\\n\\t\\\"PATCHING_LOGON\\\": \\\"Patching for logon requirement\\\",\\n\\t\\\"CONFIRM\\\": \\\"Confirm\\\",\\n\\t\\\"RIGHT_REVIEW\\\": \\\"Let's review your rights.\\\",\\n\\t\\\"RIGHT_REVIEW_BTN\\\": \\\"Accept license\\\",\\n\\t\\\"DARK_MODE\\\": \\\"Dark mode\\\",\\n\\t\\\"INSTALLING_DARKMODE\\\": \\\"Installing dark mode preference\\\",\\n\\t\\\"CREATING_USER_HOME\\\": \\\"Creating user home directory\\\",\\n\\t\\\"PROVISIONED_PREFERENCE\\\": \\\"This setting is managed by the system administrator.\\\",\\n\\t\\\"USERNAME_EXISTS\\\": \\\"This user already exists in the system.\\\",\\n\\t\\\"VIDEO_PLAYER\\\": \\\"Video player\\\",\\n\\t\\\"INACCESSIBLE_FILE\\\": \\\"%s is inaccessible. Ensure you have permissions to access it, and that the object exists.\\\",\\n\\t\\\"FILE_NOT_SPECIFIED\\\": \\\"No file specified.\\\",\\n\\t\\\"PICTURE_VIEWER\\\": \\\"Picture viewer\\\",\\n\\t\\\"API_TEST_TERM\\\": \\\"API Developer's Terminal\\\",\\n\\t\\\"HELP_TERMINAL_APITEST\\\": \\\"help - Display help menu\\\\r\\\\nclear - Clear terminal\\\\r\\\\njs_ree - Execute JavaScript code\\\\r\\\\n--- REE API EXPORTS ---\\\\r\\\\n\\\",\\n\\t\\\"TERM_COMMAND_NOT_FOUND\\\": \\\"%s: command not found\\\",\\n\\t\\\"FILE_EXPLORER\\\": \\\"File explorer\\\",\\n\\t\\\"GRANT_FEXP_PERM\\\": \\\"Please grant permissions to read file structures and list partitions.\\\",\\n\\t\\\"GRANT_PERM\\\": \\\"Grant permissions\\\",\\n\\t\\\"GRANT_FEXP_PERM_ADM\\\": \\\"Please consult the administrator to grant privileges to this program to read file structures and list partitions. (FS_READ, FS_LIST_PARTITIONS)\\\",\\n\\t\\\"GRANT_FEXP_PERM_USR\\\": \\\"Please grant permissions to read file structures and list partitions using a different user.\\\",\\n\\t\\\"BROWSE_FEXP\\\": \\\"Browse\\\",\\n\\t\\\"SPACE_SHOWER\\\": \\\"Space in \\\\\\\"%s\\\\\\\": %s used of %s (%s%)\\\",\\n\\t\\\"FILE_STRUCT_BROWSE_FAIL\\\": \\\"Could not browse to this structure:\\\\n%s\\\",\\n\\t\\\"UNKNOWN_FS_STRUCT\\\": \\\"Unknown filesystem structure \\\\\\\"%s\\\\\\\"\\\",\\n\\t\\\"UNKNOWN_FILE_TYPE\\\": \\\"This is an unknown file type.\\\",\\n\\t\\\"TMGR_PERMISSION\\\": \\\"Task manager was not permitted to run under this condition. Please contact the system administrator.\\\\nRequired privileges: %s\\\",\\n\\t\\\"TASK_MANAGER\\\": \\\"Task manager\\\",\\n\\t\\\"BASENAME_TASK\\\": \\\"Basename\\\",\\n\\t\\\"USER_TASK\\\": \\\"User\\\",\\n\\t\\\"TERMINATE_TASK\\\": \\\"Terminate\\\",\\n\\t\\\"FULL_PATH_TASK\\\": \\\"Full path\\\",\\n\\t\\\"ARGUMENTS_TASK\\\": \\\"Arguments\\\",\\n\\t\\\"REMOVING_SETUP_STATE\\\": \\\"Removing setup status\\\",\\n\\t\\\"LOGGING_OUT\\\": \\\"Logging out...\\\",\\n\\t\\\"PANIC_LINE1\\\": \\\"A critical problem has been detected while using the operating system. Its stability is at risk now.\\\",\\n\\t\\\"PANIC_LINE2\\\": \\\"Problem code: %s\\\",\\n\\t\\\"PANIC_UNSPECIFIED_ERROR\\\": \\\"UNSPECIFIED_ERROR\\\",\\n\\t\\\"PROBLEMATIC_COMPONENT\\\": \\\"Problematic component: %s\\\",\\n\\t\\\"PROBLEMATIC_PARAMS\\\": \\\"Problematic parameters: %s\\\",\\n\\t\\\"PROBLEMATIC_JS\\\": \\\"Problematic JavaScript: %s: %s\\\",\\n\\t\\\"PANIC_LINE3\\\": \\\"If you have seen this error message the first time, attempt rebooting.\\\",\\n\\t\\\"PANIC_LINE4\\\": \\\"If you see this error message once more, there is something wrong with the system.\\\",\\n\\t\\\"PANIC_LINE5\\\": \\\"You can try repairing the filesystem by placing a .fsck file on the system root mountpoint, with the value \\\\\\\"recover\\\\\\\" in it.\\\",\\n\\t\\\"PANIC_LINE6\\\": \\\"Proper shutdown procedure follows now:\\\",\\n\\t\\\"PANIC_TASK_KILLED\\\": \\\"task:%s: killed\\\",\\n\\t\\\"PANIC_MOUNT_UNMOUNTED\\\": \\\"mount:%s: unmounted\\\",\\n\\t\\\"PANIC_MOUNT_FAILED\\\": \\\"mount:%s: %s: %s\\\",\\n\\t\\\"SHORT_YEARS\\\": \\\"%sy\\\",\\n\\t\\\"SHORT_MONTHS\\\": \\\"%smo\\\",\\n\\t\\\"SYSADMIN_TOOLS_TITLE\\\": \\\"Sysadmin Tools\\\",\\n\\t\\\"SYSADMIN_TOOLS_PRIVFAIL\\\": \\\"You are not a system administrator.\\\",\\n\\t\\\"REINSTALL_BUTTON\\\": \\\"Reinstall OS\\\",\\n\\t\\\"FSCK_BUTTON\\\": \\\"Recover lost files\\\",\\n\\t\\\"SWIPE_BUTTON\\\": \\\"Wipe system securely\\\",\\n\\t\\\"REINSTALL_DOWNLOADING\\\": \\\"Downloading local os.js...\\\",\\n\\t\\\"REINSTALL_DOWNLOAD_FAILED\\\": \\\"Failed to download local os.js.\\\",\\n\\t\\\"REINSTALL_DECODING\\\": \\\"Parsing os.js as text\\\",\\n\\t\\\"REINSTALL_SETTING\\\": \\\"Setting os.js as bootloader\\\",\\n\\t\\\"REMOVING_INSTALLERS\\\": \\\"Removing installers...\\\",\\n\\t\\\"SETTING_FSCK_FLAG\\\": \\\"Creating .fsck file\\\",\\n\\t\\\"SETTING_FSCK_FLAG_FAILED\\\": \\\"Failed to create .fsck file.\\\",\\n\\t\\\"WIPING_SYSTEM\\\": \\\"Securely wiping system...\\\",\\n\\t\\\"WIPING_SYSTEM_FAILED\\\": \\\"Failed to securely wipe system.\\\",\\n\\t\\\"WORKING_HOURS_UNMET\\\": \\\"You attempted to log in outside of your working hours. Try again later.\\\",\\n\\t\\\"NETCONFIG_TITLE\\\": \\\"PCOS Network configurator\\\",\\n\\t\\\"NETCONFIG_DENY\\\": \\\"There are not enough permissions to configure PCOS Network.\\\",\\n\\t\\\"NETCONFIG_URLF\\\": \\\"Proxy URL: \\\",\\n\\t\\\"NETCONFIG_AUTO\\\": \\\"Start on OS startup\\\",\\n\\t\\\"NETCONFIG_UC\\\": \\\"Customizable: \\\",\\n\\t\\\"NETCONFIG_SAVE\\\": \\\"Save config\\\",\\n\\t\\\"NETCONFIG_PREDICT\\\": \\\"Predict address\\\",\\n\\t\\\"EMPTY_STATUSBAR\\\": \\\"Status\\\",\\n\\t\\\"NETCONFIG_SAVE_OK\\\": \\\"Configuration saved successfully\\\",\\n\\t\\\"NETCONFIG_SAVE_FAIL\\\": \\\"Failed to save config\\\",\\n\\t\\\"PCOS_STARTING\\\": \\\"PCOS is starting...\\\",\\n\\t\\\"FILE_PICKER\\\": \\\"File picker\\\",\\n\\t\\\"TEXT_EDITOR\\\": \\\"Text editor\\\",\\n\\t\\\"LOAD_BTN\\\": \\\"Load\\\",\\n\\t\\\"SAVE_BTN\\\": \\\"Save\\\",\\n\\t\\\"NETCONFIG_SYSIDM\\\": \\\"No System ID available\\\",\\n\\t\\\"NO_SAVE_IN_MTN\\\": \\\"You can't save in the mountpoint directory.\\\",\\n\\t\\\"INSTALLING_WP2L\\\": \\\"Installing wallpaper to lock screen\\\",\\n\\t\\\"EXIT\\\": \\\"Exit\\\",\\n\\t\\\"DESCRIPTION_FIELD\\\": \\\"Description: %s\\\",\\n\\t\\\"REMOVE_BTN\\\": \\\"Remove\\\",\\n\\t\\\"UNMOUNT_BTN\\\": \\\"Unmount\\\",\\n\\t\\\"INSTALLING_DARKMODE2L\\\": \\\"Installing dark mode preference to lock screen\\\",\\n\\t\\\"MESSAGE_ENTER\\\": \\\"Enter a message to display\\\",\\n\\t\\\"TIMEOUT_FIELD\\\": \\\"Timeout (ms)\\\",\\n\\t\\\"SECRET_FIELD_TXT\\\": \\\"Secret (text)\\\",\\n\\t\\\"SECRET_FIELD_HEX\\\": \\\"Secret (hex)\\\",\\n\\t\\\"REGENERATE\\\": \\\"Regenerate\\\",\\n\\t\\\"START_TIME_FIELD\\\": \\\"Start time\\\",\\n\\t\\\"END_TIME_FIELD\\\": \\\"End time\\\",\\n\\t\\\"PBKDF2_OPTION\\\": \\\"PBKDF2 (Password)\\\",\\n\\t\\\"INFORMATIVE_MESSAGE_OPTION\\\": \\\"Informative message\\\",\\n\\t\\\"INFORMATIVE_MESSAGE_DENY_OPTION\\\": \\\"Informative message (deny)\\\",\\n\\t\\\"TIMEOUT_OPTION\\\": \\\"Timeout\\\",\\n\\t\\\"TIMEOUT_DENY_OPTION\\\": \\\"Timeout (deny)\\\",\\n\\t\\\"SERVER_REPORT_OPTION\\\": \\\"Server reporting\\\",\\n\\t\\\"PCTOTP_OPTION\\\": \\\"PC's TOTP interpretation\\\",\\n\\t\\\"RFCTOTP_OPTION\\\": \\\"RFC TOTP\\\",\\n\\t\\\"WORKING_HOURS_OPTION\\\": \\\"Working hours\\\",\\n\\t\\\"PERSONAL_SECURITY_TITLE\\\": \\\"Personal Security\\\",\\n\\t\\\"PERSONAL_SECURITY_DENY\\\": \\\"Not enough privileges were granted for Personal Security.\\\",\\n\\t\\\"ADD_BTN\\\": \\\"Add\\\",\\n\\t\\\"OS_LOCALE\\\": \\\"en\\\",\\n\\t\\\"SYSTEM_SECURITY_TITLE\\\": \\\"System Security\\\",\\n\\t\\\"SYSTEM_SECURITY_DENY\\\": \\\"Not enough privileges were granted for System Security.\\\",\\n\\t\\\"EDIT\\\": \\\"Edit\\\",\\n\\t\\\"USER_GROUPS\\\": \\\"Groups\\\",\\n\\t\\\"USER_HOMEDIR\\\": \\\"Home directory\\\",\\n\\t\\\"REMOVE_USER_WITH_HD\\\": \\\"Remove user with home directory\\\",\\n\\t\\\"CREATE_HD\\\": \\\"Create home directory\\\",\\n\\t\\\"CREATING_HD_OK\\\": \\\"The home directory was created successfully.\\\",\\n\\t\\\"CREATING_HD_FAIL\\\": \\\"Failed to create the home directory.\\\",\\n\\t\\\"SIGNATURE_VERIFICATION_FAILED\\\": \\\"This program claims it is trusted by %s, but the system failed to verify that claim.\\\",\\n\\t\\\"UNKNOWN_PLACEHOLDER\\\": \\\"<Unknown>\\\",\\n\\t\\\"NO_APP_ALLOWLIST\\\": \\\"The system administrator requires programs to have an allowlist of permissions, but this program didn't have that list.\\\",\\n\\t\\\"DISCARD_BUTTON\\\": \\\"Discard lost files\\\",\\n\\t\\\"MOUNTPOINT\\\": \\\"Mountpoint\\\",\\n\\t\\\"GENERATE_PROMPT\\\": \\\"Generate?\\\",\\n\\t\\\"MOUNT_BUTTON\\\": \\\"Mount\\\",\\n\\t\\\"NEW_DIR_NAME\\\": \\\"New directory name\\\",\\n\\t\\\"MKDIR_BUTTON\\\": \\\"Create directory\\\",\\n\\t\\\"CHOWN_BUTTON\\\": \\\"Change owner\\\",\\n\\t\\\"CHGRP_BUTTON\\\": \\\"Change group\\\",\\n\\t\\\"CHMOD_BUTTON\\\": \\\"Change permissions\\\",\\n\\t\\\"CLIPBOARD_COPY\\\": \\\"Copy\\\",\\n\\t\\\"CLIPBOARD_CUT\\\": \\\"Cut\\\",\\n\\t\\\"CLIPBOARD_PASTE\\\": \\\"Paste\\\",\\n\\t\\\"CLIPBOARD_SOURCE_GONE\\\": \\\"The source no longer exists or is no longer a file.\\\",\\n\\t\\\"CLIPBOARD_CONFLICT\\\": \\\"The destination directory already has a file or directory with the same name.\\\",\\n\\t\\\"SAFE_MODE_MSG\\\": \\\"Safe mode\\\",\\n\\t\\\"INSTALLING_SFX\\\": \\\"Installing sound effects\\\",\\n\\t\\\"APP_OR_KEY_SIGNATURE_VERIFICATION_FAILED\\\": \\\"Signature verification for the program or the key signing the program failed.\\\",\\n\\t\\\"NO_SUCH_DEVICE\\\": \\\"No such device\\\",\\n\\t\\\"READ_ONLY_BMGR\\\": \\\"Writes restricted by boot manager.\\\",\\n\\t\\\"READ_ONLY_DEV\\\": \\\"Device is read-only\\\",\\n\\t\\\"NO_DIRECTORY_SUPPORT\\\": \\\"Device does not support directories\\\",\\n\\t\\\"NO_PERMIS_SUPPORT\\\": \\\"Device does not support permissions\\\",\\n\\t\\\"IS_A_DIR\\\": \\\"Is a directory\\\",\\n\\t\\\"NO_SUCH_FILE\\\": \\\"No such file\\\",\\n\\t\\\"NO_SUCH_DIR\\\": \\\"No such directory\\\",\\n\\t\\\"NO_SUCH_FILE_DIR\\\": \\\"No such file or directory\\\",\\n\\t\\\"NON_EMPTY_DIR\\\": \\\"Non-empty directory\\\",\\n\\t\\\"IS_A_FILE\\\": \\\"Is a file\\\",\\n\\t\\\"DIR_EXISTS\\\": \\\"Directory already exists\\\",\\n\\t\\\"FS_ACTION_FAILED\\\": \\\"Failed to perform this file system action.\\\",\\n\\t\\\"UNAUTHORIZED_ACTION\\\": \\\"The program does not have permissions to perform this action.\\\",\\n\\t\\\"CREATION_CHECK_FAILED\\\": \\\"Failed to check if this object is being created.\\\",\\n\\t\\\"PERMISSION_CHANGE_FAILED\\\": \\\"Failed to change permissions for this object.\\\",\\n\\t\\\"UPDATE_EXTRA_FAIL\\\": \\\"Failed to update apps, wallpapers, sounds.\\\",\\n\\t\\\"UPDATE_BOOT_FAIL\\\": \\\"Failed to update boot files.\\\",\\n\\t\\\"UPDATE_BUTTON\\\": \\\"Update OS\\\",\\n\\t\\\"TOGGLE_HIDDEN_FILES\\\": \\\"Hide/unhide files\\\",\\n\\t\\\"AUTORUN_NECESSITIES_FAILED\\\": \\\"Failed to run one of your autorun files. The system will not log you in.\\\",\\n\\t\\\"CRYPTO_TOOLS_TITLE\\\": \\\"Cryptographic Tools\\\",\\n\\t\\\"CRYPTO_TOOLS_NOPERM\\\": \\\"Not enough privileges were given to use Cryptographic Tools.\\\",\\n\\t\\\"CRYPTO_RNG\\\": \\\"Random generation\\\",\\n\\t\\\"CRYPTO_HASH\\\": \\\"Hashing\\\",\\n\\t\\\"CRYPTO_KEYGEN\\\": \\\"Key generation\\\",\\n\\t\\\"CRYPTO_ENCRYPT\\\": \\\"Encryption\\\",\\n\\t\\\"CRYPTO_DECRYPT\\\": \\\"Decryption\\\",\\n\\t\\\"CRYPTO_SIGN\\\": \\\"Signing\\\",\\n\\t\\\"CRYPTO_VERIFY\\\": \\\"Verification\\\",\\n\\t\\\"CRYPTO_DERIVEBITS\\\": \\\"Bit derivation\\\",\\n\\t\\\"GENERATE\\\": \\\"Generate\\\",\\n\\t\\\"RAW_HEX_DATA\\\": \\\"Raw data (hex)\\\",\\n\\t\\\"CRYPTO_HASH_FIELD\\\": \\\"Hash algorithm: \\\",\\n\\t\\\"CRYPTO_PLAINTEXT_FIELD\\\": \\\"Plaintext: \\\",\\n\\t\\\"ALGORITHM_FIELD\\\": \\\"Algorithm: \\\",\\n\\t\\\"LENGTH_FIELD\\\": \\\"Length: \\\",\\n\\t\\\"CRYPTO_NC_FIELD\\\": \\\"Named curve: \\\",\\n\\t\\\"IMPORT_AS_FIELD\\\": \\\"Import as: \\\",\\n\\t\\\"CRYPTO_KEY_FIELD\\\": \\\"Key: \\\",\\n\\t\\\"CRYPTO_CIPHERTEXT_FIELD\\\": \\\"Ciphertext (hex): \\\",\\n\\t\\\"CRYPTO_SIGNATURE_FIELD\\\": \\\"Signature (hex): \\\",\\n\\t\\\"CRYPTO_KEYGEN_MSG\\\": \\\"Generating key(s)...\\\",\\n\\t\\\"CRYPTO_KEYGEN_SYMM\\\": \\\"Is a symmetric key type\\\",\\n\\t\\\"CRYPTO_KEYGEN_EXPFAIL\\\": \\\"Export failed, check export settings\\\",\\n\\t\\\"CRYPTO_RNGOUT_FIELD\\\": \\\"Random numbers (hex): \\\",\\n\\t\\\"CRYPTO_KEYGEN_ACTION\\\": \\\"Generate key(s)\\\",\\n\\t\\\"CRYPTO_HASH_ACTION\\\": \\\"Hash\\\",\\n\\t\\\"CRYPTO_ENCRYPT_ACTION\\\": \\\"Encrypt\\\",\\n\\t\\\"CRYPTO_DECRYPT_ACTION\\\": \\\"Decrypt\\\",\\n\\t\\\"CRYPTO_SIGN_ACTION\\\": \\\"Sign\\\",\\n\\t\\\"CRYPTO_VERIFY_ACTION\\\": \\\"Verify\\\",\\n\\t\\\"CRYPTO_DERIVEBITS_ACTION\\\": \\\"Derive bits\\\",\\n\\t\\\"CRYPTO_PUBKEY_FIELD\\\": \\\"Public key: \\\",\\n\\t\\\"CRYPTO_PRIVKEY_FIELD\\\": \\\"Private key: \\\",\\n\\t\\\"CRYPTO_BASEKEY_FIELD\\\": \\\"Base key: \\\",\\n\\t\\\"CRYPTO_HASHOUT_FIELD\\\": \\\"Hash value (hex): \\\",\\n\\t\\\"CRYPTO_MODLEN_FIELD\\\": \\\"Modulus length: \\\",\\n\\t\\\"CRYPTO_PUBEXP_FIELD\\\": \\\"Public exponent (hex): \\\",\\n\\t\\\"EXPORT_AS_FIELD\\\": \\\"Export as: \\\",\\n\\t\\\"CRYPTO_KEYUSE_FIELD\\\": \\\"Key usages:\\\",\\n\\t\\\"CRYPTO_PLAINTEXTAS_FIELD\\\": \\\"Process plaintext as: \\\",\\n\\t\\\"CRYPTO_IV_FIELD\\\": \\\"IV (hex): \\\",\\n\\t\\\"CRYPTO_CTR_FIELD\\\": \\\"Counter (hex): \\\",\\n\\t\\\"CRYPTO_VERIFIED_CHECKBOX\\\": \\\"Verified successfully\\\",\\n\\t\\\"CRYPTO_SALT_FIELD\\\": \\\"Salt (hex): \\\",\\n\\t\\\"CRYPTO_DERIVEOUT_FIELD\\\": \\\"Derived bits (hex): \\\",\\n\\t\\\"CRYPTO_ITERATIONS_FIELD\\\": \\\"Iterations: \\\",\\n\\t\\\"PATH_INCLUDES_EMPTY\\\": \\\"The specified path includes an object with an empty name.\\\",\\n\\t\\\"BASIC_CURL_USAGE\\\": \\\"Usage: basiccurl [source] [output]\\\",\\n\\t\\\"BASIC_CURL_DESCRIPTION\\\": \\\"Downloads the specified source and saves it to the specified output.\\\",\\n\\t\\\"NO_ARGUMENTS\\\": \\\"No arguments specified\\\",\\n\\t\\\"CAT_USAGE\\\": \\\"Usage: cat [file1] <file2> <file3> ... <fileN>\\\",\\n\\t\\\"CAT_DESCRIPTION\\\": \\\"Concatenates the specified files and outputs to CLI output\\\",\\n\\t\\\"CHGRP_USAGE\\\": \\\"Usage: chgrp [group] [file]\\\",\\n\\t\\\"CHGRP_DESCRIPTION\\\": \\\"Changes the owning group of the specified file\\\",\\n\\t\\\"CHMOD_USAGE\\\": \\\"Usage: chmod [mode] [file]\\\",\\n\\t\\\"CHMOD_DESCRIPTION\\\": \\\"Changes what everyone may do with the specified file\\\",\\n\\t\\\"CHMOD_MODE_DESCRIPTION\\\": \\\"[mode] may consist of characters r (Read), w (Write) and x (eXecute).\\\",\\n\\t\\\"CHMOD_MODE_CONVERT\\\": \\\"[mode] number to string table: 0 - \\\\\\\"\\\\\\\", 1 - \\\\\\\"x\\\\\\\", 2 - \\\\\\\"w\\\\\\\", 3 - \\\\\\\"wx\\\\\\\", 4 - \\\\\\\"r\\\\\\\", 5 - \\\\\\\"rx\\\\\\\", 6 - \\\\\\\"rw\\\\\\\", 7 - \\\\\\\"rwx\\\\\\\"\\\",\\n\\t\\\"CHOWN_USAGE\\\": \\\"Usage: chown [user] [file]\\\",\\n\\t\\\"CHOWN_DESCRIPTION\\\": \\\"Changes the owning user of the specified file\\\",\\n\\t\\\"CP_USAGE\\\": \\\"Usage: cp <options> [source] [destination]\\\",\\n\\t\\\"CP_DESCRIPTION\\\": \\\"Copies files or directories from the source to the destination.\\\",\\n\\t\\\"OPT_RECURSIVE_DESCRIPTION\\\": \\\"--recursive: run on directories\\\",\\n\\t\\\"OPT_FORCE_DESCRIPTION\\\": \\\"--force: do not fail immediately in case of an error\\\",\\n\\t\\\"ARGUMENT_COUNT_MISMATCH\\\": \\\"Too much or not enough arguments\\\",\\n\\t\\\"DF_HEADER\\\": \\\"Medium\\\\tSize\\\\tUsed\\\\tAvail\\\\tUse%\\\",\\n\\t\\\"LS_USAGE\\\": \\\"Usage: ls [directory]\\\",\\n\\t\\\"LS_DESCRIPTION\\\": \\\"Lists the contents of the specified directory.\\\",\\n\\t\\\"LS_MOUNTPOINT_LIST\\\": \\\"You have the following mountpoints: \\\",\\n\\t\\\"MOUNTPOINT_SYSTEM\\\": \\\"system\\\",\\n\\t\\\"PASSWD_NEW_PROMPT\\\": \\\"Setting a new password for your user account.\\\",\\n\\t\\\"PASSWD_2FACTOR_LOSS_WARN\\\": \\\"Any previously set up additional factors will be removed.\\\",\\n\\t\\\"PASSWD_PROMPT\\\": \\\"New password: \\\",\\n\\t\\\"PASSWD_CONFIRM_PROMPT\\\": \\\"Re-enter password: \\\",\\n\\t\\\"PASSWD_FEEDBACK\\\": \\\"New password set\\\",\\n\\t\\\"PASSWD_MISMATCH\\\": \\\"Sorry, passwords do not match.\\\",\\n\\t\\\"PING_USAGE\\\": \\\"Usage: ping <--internet> [networkAddress]\\\",\\n\\t\\\"PING_DESCRIPTION\\\": \\\"Sends a request to the specified address to verify its availability.\\\",\\n\\t\\\"PING_INTERNET_OPTION\\\": \\\"--internet: send a ping to the Internet instead of PCOS Network\\\",\\n\\t\\\"PIVOT_ROOT_USAGE\\\": \\\"Usage: pivot_root [mountpoint]\\\",\\n\\t\\\"PIVOT_ROOT_DESCRIPTION\\\": \\\"Makes the specified mountpoint the new default system mountpoint for every program.\\\",\\n\\t\\\"REAL_TERMINAL_NAME\\\": \\\"Terminal\\\",\\n\\t\\\"REAL_TERMINAL_BUILTIN_LIST\\\": \\\"Built-in commands:\\\",\\n\\t\\\"REAL_TERMINAL_HELP_USEDESC\\\": \\\"help - Display the list, description and usage of all available built-in commands.\\\",\\n\\t\\\"REAL_TERMINAL_CLEAR_USEDESC\\\": \\\"clear - Clear everything displayed on the terminal right now.\\\",\\n\\t\\\"REAL_TERMINAL_SUGRAPH_USEDESC\\\": \\\"sugraph <desiredUsername> - Switch the terminal user using a graphical utility.\\\",\\n\\t\\\"REAL_TERMINAL_SU_USEDESC\\\": \\\"su <desiredUsername> - Switch the terminal user.\\\",\\n\\t\\\"REAL_TERMINAL_GRAPHIC_USEDESC\\\": \\\"graphic <boolean> - Enable or disable running new applications outside of background.\\\",\\n\\t\\\"REAL_TERMINAL_EXIT_USEDESC\\\": \\\"exit - Exit the terminal.\\\",\\n\\t\\\"REAL_TERMINAL_LOGON_REQUIRED\\\": \\\"(internal): You must run sugraph %s before running this program.\\\",\\n\\t\\\"RM_USAGE\\\": \\\"Usage: rm <options> [file]\\\",\\n\\t\\\"RM_DESCRIPTION\\\": \\\"Removes the specified file or directory.\\\",\\n\\t\\\"RKL_USAGE\\\": \\\"Usage: runKlvlCode [codeFile]\\\",\\n\\t\\\"RKL_DESCRIPTION\\\": \\\"Runs the specified code file in the kernel level.\\\",\\n\\t\\\"WRITE_USAGE\\\": \\\"Usage: write [file] [data]\\\",\\n\\t\\\"WRITE_DESCRIPTION\\\": \\\"Writes data to the specified file.\\\",\\n\\t\\\"CP_PERMISSIONS_OPTION\\\": \\\"--permissions: сopy the permissions of the original files\\\",\\n\\t\\\"REAL_TERMINAL_DEFAULT_PATH_FIELD\\\": \\\"Default path: %s\\\",\\n\\t\\\"REAL_TERMINAL_PUSHPATH_USEDESC\\\": \\\"pushpath [path] - Add a new path to explore to find commands.\\\",\\n\\t\\\"REAL_TERMINAL_RESETPATH_USEDESC\\\": \\\"resetpath - Reset the list of paths to explore to the default path.\\\",\\n\\t\\\"REAL_TERMINAL_LSPATH_USEDESC\\\": \\\"lspath - See the current list of paths to explore and the default path.\\\",\\n\\t\\\"MKDIR_USAGE\\\": \\\"Usage: mkdir [directory]\\\",\\n\\t\\\"MKDIR_DESCRIPTION\\\": \\\"Creates a new directory in the specified path.\\\",\\n\\t\\\"NEXT\\\": \\\"Next\\\",\\n\\t\\\"DESCRIBE_TEMPLATE\\\": \\\"Program: %s (%s)\\\\nIntent: %s\\\",\\n\\t\\\"EXTRA_DESCRIBE_TEMPLATE\\\": \\\"Program: %s (%s)\\\\nArguments: %s\\\\nIntent: %s\\\",\\n\\t\\\"DECLINE\\\": \\\"Decline\\\",\\n\\t\\\"ACCESS_REQUEST_TITLE\\\": \\\"Access request\\\",\\n\\t\\\"REAL_TERMINAL_INTENT\\\": \\\"Launch commands with your permissions\\\",\\n\\t\\\"PERSONAL_SECURITY_INTENT\\\": \\\"Manage your security settings\\\",\\n\\t\\\"FILE_EXPLORER_INTENT\\\": \\\"Launch programs and open files\\\",\\n\\t\\\"FILE_EXPLORER_FULL_INTENT\\\": \\\"Browse files, launch programs, and open files\\\",\\n\\t\\\"CRYPTO_TOOLS_INTENT\\\": \\\"Perform cryptographic operations\\\",\\n\\t\\\"SYSTEM_SECURITY_INTENT\\\": \\\"Management of the system-wide user account setup\\\",\\n\\t\\\"FORMAT_USAGE\\\": \\\"Usage: format [filesystem_type] [partition] <overwrite>\\\",\\n\\t\\\"FORMAT_DESCRIPTION\\\": \\\"Prepares the selected partition for use.\\\",\\n\\t\\\"FORMAT_FSTYPE\\\": \\\"Filesystem types: pcfs (corresponds to mountpoint PCFSiDBMount), pcfs_crypt (PCFSiDBAESCryptMount), pcfs_crypt_monokey (PCFSiDBAESCryptMount), pcfs_crypt_filetable_monokey (PCFSiDBAESCryptMount), pcbm:<data_partition> (like code in boot partition), null (DELETE the partition)\\\",\\n\\t\\\"FORMAT_OVERWRITE_WARN\\\": \\\"The partition already contains data. Set the overwrite parameter to 'overwrite' to remove data anyway. In that case, ALL DATA ON THE PARTITION MAY BE REMOVED.\\\",\\n\\t\\\"FORMAT_UNKNOWN_FSTYPE\\\": \\\"Unknown target formatting\\\",\\n\\t\\\"LLDA_USAGE\\\": \\\"Usage: llda_tool [action] [parameters]\\\",\\n\\t\\\"LLDA_ACTION_EXPORT\\\": \\\"action export: [input partition] [output file]\\\",\\n\\t\\\"LLDA_ACTION_IMPORT\\\": \\\"action import: [input file] [output partition]\\\",\\n\\t\\\"LLDA_ACTION_IMPORTSTRING\\\": \\\"action importstring: [input file] [output partition]\\\",\\n\\t\\\"LLDA_ACTION_COPY\\\": \\\"action copy: [input partition] [output partition]\\\",\\n\\t\\\"LLDA_ACTION_REMOVE\\\": \\\"action remove: [partition]\\\",\\n\\t\\\"LLDA_ACTION_LIST\\\": \\\"action list\\\",\\n\\t\\\"LLDA_DISCLAIMER\\\": \\\"When using this tool you may encounter LOSS OF DATA!\\\",\\n\\t\\\"LLDA_UNKNOWN_ACTION\\\": \\\"Unknown action\\\",\\n\\t\\\"INITDISK_OVERWRITE_WARN\\\": \\\"The system disk already contains partitioning data. Set the overwrite parameter to 'overwrite' to remove data anyway. In that case, ALL DATA ON THE DISK MAY BE REMOVED.\\\",\\n\\t\\\"INITDISK_USAGE\\\": \\\"Usage: initdisk [whatever] <overwrite>\\\",\\n\\t\\\"INITDISK_DESCRIPTION\\\": \\\"Prepares the system disk for use.\\\",\\n\\t\\\"MOUNT_USAGE\\\": \\\"Usage: mount [options] [fs_type] [mountpoint]\\\",\\n\\t\\\"MOUNT_DESCRIPTION\\\": \\\"Mounts a filesystem.\\\",\\n\\t\\\"MOUNT_KNOWN_FS\\\": \\\"Known filesystems: %s\\\",\\n\\t\\\"MOUNT_KNOWN_PPART\\\": \\\"--partition=[dataPartition] - Specify the data partition\\\",\\n\\t\\\"MOUNT_KNOWN_PINPA\\\": \\\"--interactivePassword - Ask for the password interactively\\\",\\n\\t\\\"MOUNT_KNOWN_PPASS\\\": \\\"--password=[password] - Specify the password\\\",\\n\\t\\\"MOUNT_KNOWN_PKEY\\\": \\\"--key=[hexKey] - Specify the encryption key\\\",\\n\\t\\\"MOUNT_KNOWN_PTYPE\\\": \\\"--type=[type] - For ramMount, specify type=run to create /run\\\",\\n\\t\\\"MOUNT_KNOWN_PURL\\\": \\\"--url=[URL] - Specify the URL\\\",\\n\\t\\\"MOUNT_KNOWN_PINPI\\\": \\\"--inputPipeId=[pipeId] - Specify the input pipe\\\",\\n\\t\\\"MOUNT_KNOWN_POUPI\\\": \\\"--outputPipeId=[pipeId] - Specify the output pipe\\\",\\n\\t\\\"MOUNTINFO_USAGE\\\": \\\"Usage: mountinfo [mountpoint]\\\",\\n\\t\\\"MOUNTINFO_DESCRIPTION\\\": \\\"Get information about a mountpoint.\\\",\\n\\t\\\"UMOUNT_USAGE\\\": \\\"Usage: umount <options> [mountpoint]\\\",\\n\\t\\\"UMOUNT_DESCRIPTION\\\": \\\"Unmounts a filesystem.\\\",\\n\\t\\\"UMOUNT_OPT_SYNCONLY\\\": \\\"--sync-only - Only sync the filesystem, not unmount (overrides --force)\\\",\\n\\t\\\"UMOUNT_OPT_FORCE\\\": \\\"--force - Force unmount the filesystem, do not sync\\\",\\n\\t\\\"CALC_TITLE\\\": \\\"Calculator\\\",\\n\\t\\\"CALC_BASIC_MODE\\\": \\\"Calculator: Basic mode\\\",\\n\\t\\\"CALC_ADVANCED_MODE\\\": \\\"Calculator: Advanced mode\\\",\\n\\t\\\"CALC_ADD\\\": \\\"Add\\\",\\n\\t\\\"CALC_SUBTRACT\\\": \\\"Subtract\\\",\\n\\t\\\"CALC_MULTIPLY\\\": \\\"Multiply\\\",\\n\\t\\\"CALC_DIVIDE\\\": \\\"Divide\\\",\\n\\t\\\"CALC_ADVMODE_BTN\\\": \\\"Advanced mode\\\",\\n\\t\\\"CALC_BASICMODE_BTN\\\": \\\"Basic mode\\\",\\n\\t\\\"CALC_OPERAND\\\": \\\"Operand %s\\\",\\n\\t\\\"CALC_TOMIXED_BTN\\\": \\\"Convert to mixed fraction\\\",\\n\\t\\\"CALC_TOIMPR_BTN\\\": \\\"Convert to improper fraction\\\",\\n\\t\\\"CALC_GCD\\\": \\\"GCD\\\",\\n\\t\\\"CALC_FACTORIAL\\\": \\\"Factorial\\\",\\n\\t\\\"CALC_GCD_PAGE\\\": \\\"Greatest common divisor\\\",\\n\\t\\\"ZKPP_OPTION\\\": \\\"ZKPP (Password)\\\",\\n\\t\\\"SECONDSTAGE_INSTALLER_INTENT\\\": \\\"Complete the OS configuration\\\",\\n\\t\\\"SETUP_FAILED\\\": \\\"Setting up PCOS failed. Please try again by rebooting.\\\",\\n\\t\\\"WARNING_PRIVILEGES\\\": \\\"Be careful with this feature! You may compromise system security.\\\",\\n\\t\\\"USER_EXT_PRIVILEGES\\\": \\\"Extended privilege set\\\",\\n\\t\\\"LULL_SYSTEM\\\": \\\"Sleep mode\\\",\\n\\t\\\"SYSTEM_IMAGING\\\": \\\"System imaging\\\",\\n\\t\\\"CREATE_IMAGE\\\": \\\"Create system image\\\",\\n\\t\\\"RESTORE_IMAGE\\\": \\\"Restore system image\\\",\\n\\t\\\"SELECT_FILE_PROMPT\\\": \\\"Select file: \\\",\\n\\t\\\"REBOOT_ON_RESTORE\\\": \\\"Reboot after restoring\\\",\\n\\t\\\"MERGE_STATES\\\": \\\"Merge image states\\\",\\n\\t\\\"LISTING_PARTITIONS_FAILED\\\": \\\"Failed to list partitions.\\\",\\n\\t\\\"READING_PARTITION_FAILED\\\": \\\"Failed to read partition %s\\\",\\n\\t\\\"LISTING_DATA_FAILED\\\": \\\"Failed to list data.\\\",\\n\\t\\\"READING_DATA_FAILED\\\": \\\"Failed to read data.\\\",\\n\\t\\\"WRITING_IMAGE_FAILED\\\": \\\"Failed to write image.\\\",\\n\\t\\\"SUCCESSFUL_OP\\\": \\\"The process was successfully completed.\\\",\\n\\t\\\"FAILED_OP\\\": \\\"The process has failed.\\\",\\n\\t\\\"READING_IMAGE_FAILED\\\": \\\"Failed to read image.\\\",\\n\\t\\\"WRITING_PARTITION_FAILED\\\": \\\"Failed to write partition %s\\\",\\n\\t\\\"WRITING_DATA_FAILED\\\": \\\"Failed to write data.\\\",\\n\\t\\\"DELETING_PARTITION_FAILED\\\": \\\"Failed to delete partition %s\\\",\\n\\t\\\"DELETING_DATA_FAILED\\\": \\\"Failed to delete data.\\\",\\n\\t\\\"SHUTTING_DOWN_FAILED\\\": \\\"Failed to shut the system down.\\\",\\n\\t\\\"NETWORK_STATUS_ONLINE\\\": \\\"You are connected to a local area network.\\\",\\n\\t\\\"NETWORK_STATUS_OFFLINE\\\": \\\"You aren't connected to any sort of network.\\\",\\n\\t\\\"PCOS_NETWORK_STATUS_ONLINE\\\": \\\"You are connected to PCOS Network. (hostname: %s, address: %s)\\\",\\n\\t\\\"PCOS_NETWORK_STATUS_OFFLINE\\\": \\\"You are disconnected from PCOS Network.\\\",\\n\\t\\\"PCOS_NETWORK_STATUS_STOPPED\\\": \\\"The PCOS Network service was stopped.\\\",\\n\\t\\\"START_MENU_FAILED\\\": \\\"The start menu has failed to launch. You can log out instead.\\\",\\n\\t\\\"SYSTEM_BUILT_AT\\\": \\\"System built at %s\\\",\\n\\t\\\"REAL_TERMINAL_VER_USEDESC\\\": \\\"ver - Show the build version and time\\\",\\n\\t\\\"BLANK_PRIVILEGE_FLAG\\\": \\\"Blank user privileges\\\",\\n\\t\\\"INSTALLING_SYSTEM_APPHARDEN\\\": \\\"Installing program security rules\\\",\\n\\t\\\"INSTALLING_NET_CONF\\\": \\\"Installing PCOS Network configuration\\\",\\n\\t\\\"NETWORK_ADDRESS_FIELD\\\": \\\"Network address: %s\\\",\\n\\t\\\"NETWORK_AUTOHOST_FIELD\\\": \\\"Automatic hostname: %s\\\",\\n\\t\\\"NETCONFIG_HOSTNAME\\\": \\\"Hostname: \\\",\\n\\t\\\"DIFF_USAGE\\\": \\\"Usage: diff [original] [new] [difference]\\\",\\n\\t\\\"DIFF_DESCRIPTION\\\": \\\"Calculates the difference between two files.\\\",\\n\\t\\\"PATCH_USAGE\\\": \\\"Usage: patch [original] [difference] [new]\\\",\\n\\t\\\"PATCH_DESCRIPTION\\\": \\\"Calculates the 'sum' of the original and the difference.\\\",\\n\\t\\\"CURRENT_OSFILE_VERSION\\\": \\\"Current OS file version: build %s\\\",\\n\\t\\\"DOWNLOADING_OS_PATCH\\\": \\\"Downloading OS file patch from %s (address %s)\\\",\\n\\t\\\"HANDOFF_UPDATE\\\": \\\"Handing off the update process to updateos.js\\\",\\n\\t\\\"SYSTEM_UP_TO_DATE\\\": \\\"The system is up to date\\\",\\n\\t\\\"POWER_USAGE\\\": \\\"Usage: power <options> <r|reboot|restart|k|kexec>\\\",\\n\\t\\\"POWER_DESCRIPTION\\\": \\\"Powers down or restarts the system. Supplying nothing to power makes a shutdown.\\\",\\n\\t\\\"POWER_FORCE\\\": \\\"--force: don't wait for processes, reboot or power down immediately\\\",\\n\\t\\\"POWER_KEXEC\\\": \\\"--kexec: reboot without reloading the page or firmware (automatically toggles reboot)\\\",\\n\\t\\\"UPDATEFW_BUTTON\\\": \\\"Update firmware\\\",\\n\\t\\\"UPDATEFW_DOWNLOADING\\\": \\\"Downloading local init.js...\\\",\\n\\t\\\"UPDATEFW_DOWNLOAD_FAILED\\\": \\\"Failed to download local init.js.\\\",\\n\\t\\\"UPDATEFW_DECODING\\\": \\\"Parsing init.js as text\\\",\\n\\t\\\"UPDATEFW_SETTING\\\": \\\"Setting init.js as firmware\\\",\\n\\t\\\"ADDUSER_USAGE\\\": \\\"Usage: adduser <options> [username]\\\",\\n\\t\\\"ADDUSER_DESCRIPTION\\\": \\\"Creates a new user account.\\\",\\n\\t\\\"ADDUSER_SKIP_PASSWD\\\": \\\"--skip-passwd: don't prompt for a password\\\",\\n\\t\\\"ADDUSER_SKIP_HOME\\\": \\\"--skip-home: don't create a home directory\\\",\\n\\t\\\"ADDUSER_GROUPS\\\": \\\"--groups: group to add (specify multiple times for multiple groups)\\\",\\n\\t\\\"ADDUSER_HOME\\\": \\\"--home: custom home directory\\\",\\n\\t\\\"NEW_USER_CREATION\\\": \\\"Creating new user \\\\\\\"%s\\\\\\\"\\\",\\n\\t\\\"BLOCKUSER_USAGE\\\": \\\"Usage: blockuser <username>\\\",\\n\\t\\\"BLOCKUSER_DESCRIPTION\\\": \\\"Blocks a user account.\\\",\\n\\t\\\"DELUSER_USAGE\\\": \\\"Usage: deluser <options> [username]\\\",\\n\\t\\\"DELUSER_DESCRIPTION\\\": \\\"Deletes a user account.\\\",\\n\\t\\\"DELUSER_HOMEDIR\\\": \\\"--homedir: delete the home directory\\\",\\n\\t\\\"OLD_USER_DELETION\\\": \\\"Deleting old user \\\\\\\"%s\\\\\\\"\\\",\\n\\t\\\"BATTERY_STATUS_UNAVAILABLE\\\": \\\"The battery status is unavailable.\\\",\\n\\t\\\"BATTERY_STATUS_CHARGING\\\": \\\"The battery is charging (%s%, %suntil full)\\\",\\n\\t\\\"BATTERY_STATUS_DISCHARGING\\\": \\\"The battery is discharging (%s%, %sof play)\\\",\\n\\t\\\"PATCH_HUNK_COUNT\\\": \\\"Patch hunks: %s\\\",\\n\\t\\\"SERVER_SIGNATURE_VERIFICATION_FAILED\\\": \\\"Signature verification for the server failed.\\\",\\n\\t\\\"NETWORK_UNREACHABLE\\\": \\\"Network is unreachable.\\\",\\n\\t\\\"ADDRESS_UNREACHABLE\\\": \\\"Address is unreachable.\\\",\\n\\t\\\"NETWORK_CLOSED\\\": \\\"The network has closed.\\\",\\n\\t\\\"CONNECTION_DROPPED\\\": \\\"The connection has been dropped.\\\",\\n\\t\\\"BLOG_BROWSER_NAME\\\": \\\"Blog Browser\\\",\\n\\t\\\"BLOG_BROWSER_LOADING\\\": \\\"Hold on, loading this page...\\\",\\n\\t\\\"BLOG_BROWSER_PROTO\\\": \\\"There's no such protocol. This version only supports the bdp:// protocol.\\\",\\n\\t\\\"BLOG_BROWSER_GATESET\\\": \\\"To set a connful gate, use the username part of the URL: bdp://gate@myblog.pc\\\",\\n\\t\\\"HOSTNAME_RESOLUTION_FAILED\\\": \\\"Failed to resolve hostname.\\\",\\n\\t\\\"BLOG_BROWSER_POSTCLOSE\\\": \\\"This interactive post has been closed.\\\",\\n\\t\\\"BLOG_BROWSER_FILEPOST\\\": \\\"This is a file post. You can save it to this system.\\\",\\n\\t\\\"BLOG_BROWSER_DLFILEPOST\\\": \\\"You have downloaded this file post.\\\",\\n\\t\\\"BLOG_BROWSER_LOADING_PROGRESS\\\": \\\"Loading this post (%s of %s chunks received)\\\",\\n\\t\\\"BLOG_BROWSER_NOVERIFY\\\": \\\"You have enabled an option to disable the verification of the server. This is not recommended as the network proxy can execute a man-in-the-middle attack and see your information. Would you let that happen?\\\",\\n\\t\\\"BLOG_BROWSER_NOSANDBOX\\\": \\\"You have enabled an option to pass through all APIs of your operating system. This is not recommended as the blog post can do anything as if it were the blog browser application. Would you let that happen?\\\",\\n\\t\\\"NETWORKFS_USAGE\\\": \\\"Usage: networkfs <options> [url] [mountpoint]\\\",\\n\\t\\\"NETWORKFS_DESCRIPTION\\\": \\\"Mounts a filesystem available over PCOS Network.\\\",\\n\\t\\\"NETWORKFS_NOVERIFY\\\": \\\"--no-verification: Don't verify the server's key\\\",\\n\\t\\\"NETWORKFS_KEY\\\": \\\"--key=[path]: Path to key for mutual verification\\\",\\n\\t\\\"NETWORKFS_PROTO\\\": \\\"This version only supports the netfs:// protocol.\\\",\\n\\t\\\"NETCONFIG_UPDATES\\\": \\\"Updates from: \\\",\\n\\t\\\"NETWORK_UPDATES_FIELD\\\": \\\"Updates from: %s\\\",\\n\\t\\\"LOCALE_NAME\\\": \\\"English\\\",\\n\\t\\\"SETTING_LOCALE_PREFERENCE\\\": \\\"Setting locale preference\\\",\\n\\t\\\"LANGUAGE_SELECT\\\": \\\"Your language: \\\",\\n\\t\\\"CHANGE_LOCALE\\\": \\\"Change language\\\",\\n\\t\\\"INSTALLER_INTENT\\\": \\\"Start the OS installation\\\",\\n\\t\\\"MOUNT_EXISTS\\\": \\\"Mount already exists\\\",\\n\\t\\\"INSECURE_MODE_MSG\\\": \\\"Insecure configuration!\\\",\\n\\t\\\"MODULE_REQUIRED\\\": \\\"The module \\\\\\\"%s\\\\\\\" is required for this function. Contact the system administrator.\\\"\\n};\\n\"},\"buildInfo\":{\"for\":\"1298\",\"when\":1750440209980,\"signer\":\"moduleSigner\",\"critical\":false,\"signature\":\"d8f626b833d4685c853486d069153ab8b8c17f46939bd633bb736e1de25de12cac712716f3d184f4531c2a1089d9cd8063c434c945a6b969f9db3e978828d400\"}}");
// modules/50-pcos-icons.fs
modules.fs.write(".installer/modules/50-pcos-icons.fs", "{\"backend\":{\"files\":{\"etc\":{\"icons\":{\"aud.pic\":\"bf695e7682d72b2f1c2fca3c3b82c3086583ed3835003c750222e0403d93d5242c02518d2433bd9d8cfbc3cb5d16352dd385c8ea0d73dce09c1d0d7ac385d246\",\"batteryChargeFinished_icon.pic\":\"7427034885fbfb93316a541378b892f5c88967826957e3e8e65338265661b7ba0ecbd3dbba31c66bc3a384748090f5ff6b93ec0585000ccd8040f3710c573d45\",\"charging_icon.pic\":\"2ca2eddf439272e5962109c04bb25ce5fccd98bc10f7db4aa84afb2e7930dd8aa52b0496f076a36b24eb46a80f9bb59ff2f0894a830dad3317bf87e4a8a6f6f9\",\"dying_icon.pic\":\"359334b46db034e7c7002c3ee36b2652a0574b7ee9fad8f3a1664e4ac945bf821516b8c9f43d9940e4782322bc6bac0c3ff21502df60687721aea51409a3fce6\",\"fileicon.pic\":\"78fb1aa6e087c4cf99acd96b34f4be60559f9a2361daf29402d7d9231309ab224ae2869d7e75d8e7cdcd743dce0f9f55d1127c7caeaafc77b2cbd246494af118\",\"foldericon.pic\":\"ff2316e7f58eb165d528b7279868d4bdd612c4c8f1eaa223a74fc080ca4bf0724b9773ad417159647b7748dd8b4c247427947b704cb49ad8e5282411771a7b66\",\"js.pic\":\"755819b7cc65afb3b1bb791c077e154bd4794f7441e1e01be397dd75b9156794325db592a7acafd537335d358883c945e83cffc645199021059568789900f36a\",\"lnk.pic\":\"d56fd42fb2d82426f49b65ca25fb3281163362cfd7b43d5003cc83ab91ea9fd13dae7629ff160ac275d79ca4fccc29fb9a90bc4c67ba505c7d58d84839408693\",\"network_icon.pic\":\"92952ea57d7923fdf7cb3290fe838c6ae55f6dc12d413f582d6d5f36ea28ad79fa9d4e80511813c14a32acfcd9f1838a158f47d93c2827a081ad571ba677a054\",\"network_offline_icon.pic\":\"375993d7cdabc2591c6e76eda200b202eebe4e04d3742db21276115c8835fa255067ce3553bfabf6a0eb83f7305113ee2a15e6b7263f3fd092b34f8f18a35289\",\"pcos_network_icon.pic\":\"1924ffd4890f5127cfa87727ffcf204457534f33be193ff14d3f6dd7d5e209302776f50c1730b5d12fc77c6b212a84a0284e1bc5b7520cb5e6a91c8f1ef32955\",\"pcos_network_offline_icon.pic\":\"a7bdbb244727774596cac8981d1b2c67397e3d6c05e5530ea25acaf7b6971f24e4592cfab47f6d33034eb48e5aa776e04e70bcfb858a63557da60fbb20685bf7\",\"pic.pic\":\"0a2f926413a2114f15bed1818345975dec91947ce4ef144a291c4cf54c5404eeef0b75bb0a0dbd02a11d8ca781143d2e20e0236cdbab68b59c374fb63e3bbfde\",\"readyToPlay_icon.pic\":\"503494927bdb1ae61e148630a08d7c9c76bbf88da49ce19f45272d02bb24fdd115c681cc78833da0682e303cdbd0bf7591b41604a6661aa9ce593bb908894589\",\"txt.pic\":\"84b2490f5daab9523269ddb9f0ef3cf51803ca56655b3068e5002d1bb37c63804c3bb0ea4c50aa1afc051200fa5f20147ee2cf1b66b47d5de34930a35ad17322\",\"vid.pic\":\"257ba99d5c0750f81152ebde33ebde2f2f4e72b7730013180cecf10d87591c65f166d1314deba3b169567fdbecc6d9d653c58567b23daa83fd838e88a8864e0b\"}}},\"permissions\":{\"etc/icons/aud.pic\":{\"world\":\"rx\"},\"etc/icons/batteryChargeFinished_icon.pic\":{\"world\":\"rx\"},\"etc/icons/charging_icon.pic\":{\"world\":\"rx\"},\"etc/icons/dying_icon.pic\":{\"world\":\"rx\"},\"etc/icons/fileicon.pic\":{\"world\":\"rx\"},\"etc/icons/foldericon.pic\":{\"world\":\"rx\"},\"etc/icons/js.pic\":{\"world\":\"rx\"},\"etc/icons/lnk.pic\":{\"world\":\"rx\"},\"etc/icons/network_icon.pic\":{\"world\":\"rx\"},\"etc/icons/network_offline_icon.pic\":{\"world\":\"rx\"},\"etc/icons/pcos_network_icon.pic\":{\"world\":\"rx\"},\"etc/icons/pcos_network_offline_icon.pic\":{\"world\":\"rx\"},\"etc/icons/pic.pic\":{\"world\":\"rx\"},\"etc/icons/readyToPlay_icon.pic\":{\"world\":\"rx\"},\"etc/icons/txt.pic\":{\"world\":\"rx\"},\"etc/icons/vid.pic\":{\"world\":\"rx\"},\"etc/icons/\":{\"world\":\"rx\"},\"etc/\":{\"world\":\"rx\"},\"\":{\"world\":\"rx\"}}},\"files\":{\"bf695e7682d72b2f1c2fca3c3b82c3086583ed3835003c750222e0403d93d5242c02518d2433bd9d8cfbc3cb5d16352dd385c8ea0d73dce09c1d0d7ac385d246\":\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAAAwXpUWHRSYXcgcHJvZmlsZSB0eXBlIGV4aWYAAHjabVDbEcMgDPv3FB0BLPMahzTpXTfo+DVgcqGp7pCFDcKYjs/7RY8G9kISUo4lRqeQIoWriuwGamfvpHPHLOl+ydNZYE1BI+xCtPMz70+DEaqqcDV6WmFbC0XMP/8Y8QhoHTW9m1ExI/AoeDOo41sulpyuX9gOtyKPRY0kr23f9kmntwd9B8wHPJwyEEcDaCsQqgqv7JG5KXSdlIFppgP5N6cJ+gLqhVkYh0XxjQAAAYRpQ0NQSUNDIHByb2ZpbGUAAHicfZE9SMNQFIVPU6VSKortIOKQoTrZRUUcaxWKUCHUCq06mLz0D5o0JCkujoJrwcGfxaqDi7OuDq6CIPgD4i44KbpIifelhRYxXni8j/PuObx3HyA0KkyzeuKApttmOpkQs7lVMfAKH4YQxCDCMrOMOUlKwbO+7qmb6i7Gs7z7/qx+NW8xwCcSx5lh2sQbxDObtsF5nzjCSrJKfE48YdIFiR+5rrT4jXPRZYFnRsxMep44QiwWu1jpYlYyNeJp4qiq6ZQvZFusct7irFVqrH1P/sJQXl9Z5jqtUSSxiCVIEKGghjIqsBGjXSfFQprOEx7+EdcvkUshVxmMHAuoQoPs+sH/4PdsrcLUZCsplAB6XxznYwwI7ALNuuN8HztO8wTwPwNXesdfbQCzn6TXO1r0CBjYBi6uO5qyB1zuAMNPhmzKruSnJRQKwPsZfVMOCN8CwbXW3NrnOH0AMjSr1A1wcAiMFyl73ePdfd1z+7enPb8fQC5ykgotUKYAAA14aVRYdFhNTDpjb20uYWRvYmUueG1wAAAAAAA8P3hwYWNrZXQgYmVnaW49Iu+7vyIgaWQ9Ilc1TTBNcENlaGlIenJlU3pOVGN6a2M5ZCI/Pgo8eDp4bXBtZXRhIHhtbG5zOng9ImFkb2JlOm5zOm1ldGEvIiB4OnhtcHRrPSJYTVAgQ29yZSA0LjQuMC1FeGl2MiI+CiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPgogIDxyZGY6RGVzY3JpcHRpb24gcmRmOmFib3V0PSIiCiAgICB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIKICAgIHhtbG5zOnN0RXZ0PSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VFdmVudCMiCiAgICB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iCiAgICB4bWxuczpHSU1QPSJodHRwOi8vd3d3LmdpbXAub3JnL3htcC8iCiAgICB4bWxuczp0aWZmPSJodHRwOi8vbnMuYWRvYmUuY29tL3RpZmYvMS4wLyIKICAgIHhtbG5zOnhtcD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLyIKICAgeG1wTU06RG9jdW1lbnRJRD0iZ2ltcDpkb2NpZDpnaW1wOjRlZDI3MGJiLTk1NTctNDkxMy1hMzJlLWRmODlhZDI2YTBmZiIKICAgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDo0MjI3NTNhNC02OTI4LTQ5ZmMtOTY1Mi1jOGI0OWI3NTIxZTciCiAgIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDoxMmVlMjdlNS04YTUyLTRiYzUtOGZhNS01ZWEzNjE3ZTAyMGQiCiAgIGRjOkZvcm1hdD0iaW1hZ2UvcG5nIgogICBHSU1QOkFQST0iMi4wIgogICBHSU1QOlBsYXRmb3JtPSJMaW51eCIKICAgR0lNUDpUaW1lU3RhbXA9IjE3MzcxOTU0NTA1NTkwNDciCiAgIEdJTVA6VmVyc2lvbj0iMi4xMC4zNiIKICAgdGlmZjpPcmllbnRhdGlvbj0iMSIKICAgeG1wOkNyZWF0b3JUb29sPSJHSU1QIDIuMTAiCiAgIHhtcDpNZXRhZGF0YURhdGU9IjIwMjU6MDE6MThUMTM6MTc6MzArMDM6MDAiCiAgIHhtcDpNb2RpZnlEYXRlPSIyMDI1OjAxOjE4VDEzOjE3OjMwKzAzOjAwIj4KICAgPHhtcE1NOkhpc3Rvcnk+CiAgICA8cmRmOlNlcT4KICAgICA8cmRmOmxpCiAgICAgIHN0RXZ0OmFjdGlvbj0ic2F2ZWQiCiAgICAgIHN0RXZ0OmNoYW5nZWQ9Ii8iCiAgICAgIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6MTljYjcwYTMtMmNkZi00NjE5LWEzMTUtOTUyNjRkZjNhMDliIgogICAgICBzdEV2dDpzb2Z0d2FyZUFnZW50PSJHaW1wIDIuMTAgKExpbnV4KSIKICAgICAgc3RFdnQ6d2hlbj0iMjAyNS0wMS0xOFQxMzoxNzozMCswMzowMCIvPgogICAgPC9yZGY6U2VxPgogICA8L3htcE1NOkhpc3Rvcnk+CiAgPC9yZGY6RGVzY3JpcHRpb24+CiA8L3JkZjpSREY+CjwveDp4bXBtZXRhPgogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgCjw/eHBhY2tldCBlbmQ9InciPz5S1XxbAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH6QESChEenq7N6wAADn5JREFUeNrtnGtsVNW7xn9r7z33XrgVCpRSWwpyx3ByPDlRvxDN+WBiIPFShINwYsDMiZrwQROrMYKJXzX/JiBEbU00qGhMIOYfJSFKTg7NSQBREEpLodza0mLbaee2917nw56Z3ktpZ0qns55kMu2+zKznXc963nevvWaDgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgkLWora2Vu7cuVM+zDbcvn37wunTp+WRI0ceSjtErnb8/v37aWhoAOC3337jySefnLJYtLS0yOvXr/PVV18N2l5TUyOUADKIuro6uW/fvlTHV1ZWUl1dzY4dOzIeh+bmZnnt2jW++eabYft27dpFaWnpjqKiojolgCkY8cmOf/nll3G73di2nZFYXLlyRV67do3vv/9+2L5XX32VDRs2PPT4i1zs+K1bt/Lmm28C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\",\"7427034885fbfb93316a541378b892f5c88967826957e3e8e65338265661b7ba0ecbd3dbba31c66bc3a384748090f5ff6b93ec0585000ccd8040f3710c573d45\":\"data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTI4IiBoZWlnaHQ9IjEyOCIgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgoJPGc+CgkJPHJlY3QgeD0iMCIgeT0iMzQiIHdpZHRoPSIxMTIiIGhlaWdodD0iNjAiIHN0cm9rZT0iIzgwODA4MCIgc3Ryb2tlLXdpZHRoPSIyIiBmaWxsPSJ0cmFuc3BhcmVudCIgLz4KCQk8cmVjdCB4PSIxMTIiIHk9IjQ4IiB3aWR0aD0iMTYiIGhlaWdodD0iMzIiIGZpbGw9IiM4MDgwODAiIC8+CgkJPHJlY3QgeD0iMSIgeT0iMzUiIHdpZHRoPSIxMTAiIGhlaWdodD0iNTgiIGZpbGw9IiMwMGZmMDAiIC8+CgkJPHJlY3QgeD0iNzkiIHk9IjM1IiB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIGZpbGw9IiNmZmZmZmYiIC8+CgkJPHJlY3QgeD0iOTUiIHk9IjM1IiB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIGZpbGw9IiMwMDAwMDAiIC8+CgkJPHJlY3QgeD0iNzkiIHk9IjUxIiB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIGZpbGw9IiMwMDAwMDAiIC8+CgkJPHJlY3QgeD0iOTUiIHk9IjUxIiB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIGZpbGw9IiNmZmZmZmYiIC8+CgkJPHJlY3QgeD0iNzkiIHk9IjY3IiB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIGZpbGw9IiNmZmZmZmYiIC8+CgkJPHJlY3QgeD0iOTUiIHk9IjY3IiB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIGZpbGw9IiMwMDAwMDAiIC8+CgkJPHJlY3QgeD0iNzkiIHk9IjgzIiB3aWR0aD0iMTYiIGhlaWdodD0iMTAiIGZpbGw9IiMwMDAwMDAiIC8+CgkJPHJlY3QgeD0iOTUiIHk9IjgzIiB3aWR0aD0iMTYiIGhlaWdodD0iMTAiIGZpbGw9IiNmZmZmZmYiIC8+Cgk8L2c+Cjwvc3ZnPgo=\",\"2ca2eddf439272e5962109c04bb25ce5fccd98bc10f7db4aa84afb2e7930dd8aa52b0496f076a36b24eb46a80f9bb59ff2f0894a830dad3317bf87e4a8a6f6f9\":\"data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTI4IiBoZWlnaHQ9IjEyOCIgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgoJPGc+CgkJPHJlY3QgeD0iMCIgeT0iMzQiIHdpZHRoPSIxMTIiIGhlaWdodD0iNjAiIHN0cm9rZT0iIzgwODA4MCIgc3Ryb2tlLXdpZHRoPSIyIiBmaWxsPSJ0cmFuc3BhcmVudCIgLz4KCQk8cmVjdCB4PSIxMTIiIHk9IjQ4IiB3aWR0aD0iMTYiIGhlaWdodD0iMzIiIGZpbGw9IiM4MDgwODAiIC8+CgkJPHJlY3QgeD0iMSIgeT0iMzUiIHdpZHRoPSIxOCIgaGVpZ2h0PSI1OCIgZmlsbD0iI2ZmMDAwMCIgLz4KCQk8bGluZSB4MT0iMjQiIHkxPSI2NCIgeDI9IjEwOCIgeTI9IjY0IiBzdHJva2U9IiMwMGZmMDAiIHN0cm9rZS13aWR0aD0iOCIgLz4KCQk8bGluZSB4MT0iMTA4IiB5MT0iNjQiIHgyPSI4NCIgeTI9IjQwIiBzdHJva2U9IiMwMGZmMDAiIHN0cm9rZS13aWR0aD0iOCIgLz4KCQk8bGluZSB4MT0iMTA4IiB5MT0iNjQiIHgyPSI4NCIgeTI9Ijg4IiBzdHJva2U9IiMwMGZmMDAiIHN0cm9rZS13aWR0aD0iOCIgLz4KCTwvZz4KPC9zdmc+Cg==\",\"359334b46db034e7c7002c3ee36b2652a0574b7ee9fad8f3a1664e4ac945bf821516b8c9f43d9940e4782322bc6bac0c3ff21502df60687721aea51409a3fce6\":\"data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTI4IiBoZWlnaHQ9IjEyOCIgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgoJPGc+CgkJPHJlY3QgeD0iMCIgeT0iMzQiIHdpZHRoPSIxMTIiIGhlaWdodD0iNjAiIHN0cm9rZT0iIzgwODA4MCIgc3Ryb2tlLXdpZHRoPSIyIiBmaWxsPSJ0cmFuc3BhcmVudCIgLz4KCQk8cmVjdCB4PSIxMTIiIHk9IjQ4IiB3aWR0aD0iMTYiIGhlaWdodD0iMzIiIGZpbGw9IiM4MDgwODAiIC8+CgkJPHJlY3QgeD0iMSIgeT0iMzUiIHdpZHRoPSIxOCIgaGVpZ2h0PSI1OCIgZmlsbD0iI2ZmMDAwMCIgLz4KCTwvZz4KPC9zdmc+Cg==\",\"78fb1aa6e087c4cf99acd96b34f4be60559f9a2361daf29402d7d9231309ab224ae2869d7e75d8e7cdcd743dce0f9f55d1127c7caeaafc77b2cbd246494af118\":\"data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTI4IiBoZWlnaHQ9IjEyOCIgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgoJPGc+CgkJPHJlY3QgeD0iMCIgeT0iMCIgd2lkdGg9IjEyOCIgaGVpZ2h0PSIxMjgiIGZpbGw9IiNmZmZmZmYiIC8+CgkJPHJlY3QgeD0iMCIgeT0iLTQiIHdpZHRoPSI0OCIgaGVpZ2h0PSI0OCIgZmlsbD0iIzgwODA4MCIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMTI4LCAtMzIpIHJvdGF0ZSg0NSkiIC8+Cgk8L2c+Cjwvc3ZnPgo=\",\"ff2316e7f58eb165d528b7279868d4bdd612c4c8f1eaa223a74fc080ca4bf0724b9773ad417159647b7748dd8b4c247427947b704cb49ad8e5282411771a7b66\":\"data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTI4IiBoZWlnaHQ9IjEyOCIgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgoJPGc+CgkJPHJlY3QgeD0iMCIgeT0iMCIgd2lkdGg9IjEyOCIgaGVpZ2h0PSIxMjgiIGZpbGw9IiNmZjdiMDAiIC8+CgkJPHJlY3QgeD0iMCIgeT0iNjAiIHdpZHRoPSI0OCIgaGVpZ2h0PSI0OCIgZmlsbD0iI2ZmZDgwMCIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMTcwLCAtMTYpIHJvdGF0ZSg0NSkiIC8+CgkJPHJlY3QgeD0iOTQiIHk9IjAiIHdpZHRoPSI0OCIgaGVpZ2h0PSI2MCIgZmlsbD0iI2ZmZDgwMCIgLz4KCTwvZz4KPC9zdmc+Cg==\",\"755819b7cc65afb3b1bb791c077e154bd4794f7441e1e01be397dd75b9156794325db592a7acafd537335d358883c945e83cffc645199021059568789900f36a\":\"data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTI4IiBoZWlnaHQ9IjEyOCIgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgoJPGc+CgkJPHJlY3QgeD0iMCIgeT0iMCIgd2lkdGg9IjEyOCIgaGVpZ2h0PSIzMiIgZmlsbD0iI2NjY2NjYyIgLz4KCQk8cmVjdCB4PSIwIiB5PSIzMiIgd2lkdGg9IjEyOCIgaGVpZ2h0PSI5NiIgZmlsbD0iI2ZmZmZmZiIgLz4KCQk8cmVjdCB4PSIxMDIiIHk9IjgiIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgZmlsbD0iI2ZmMDAwMCIgLz4KCQk8cmVjdCB4PSI4MCIgeT0iOCIgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiBmaWxsPSIjZTllOWU5IiAvPgoJCTx0ZXh0IHg9IjEwNiIgeT0iMjAiIGZpbGw9IndoaXRlIiBmb250LXNpemU9IjEycHgiPuKclTwvdGV4dD4KCQk8dGV4dCB4PSI4NCIgeT0iMjAiIGZpbGw9ImJsYWNrIiBmb250LXNpemU9IjEycHgiPuKWoTwvdGV4dD4KCQk8dGV4dCB4PSI2IiB5PSIyMCIgZmlsbD0iYmxhY2siIGZvbnQtc2l6ZT0iMTJweCI+SW5zdGFsbCBQQ09TPC90ZXh0PgoJCTx0ZXh0IHg9IjYiIHk9IjQ4IiBmaWxsPSJibGFjayIgZm9udC1zaXplPSIxMnB4IiBmb250LXdlaWdodD0iYm9sZCI+UENPUyAzIEluc3RhbGxlcjwvdGV4dD4KCQk8dGV4dCB4PSI2IiB5PSI2NCIgZmlsbD0iYmxhY2siIGZvbnQtc2l6ZT0iMTJweCI+WW91IGFyZSBpbnN0YWxsaW5nIFBDT1M8L3RleHQ+CgkJPHRleHQgeD0iNiIgeT0iODAiIGZpbGw9ImJsYWNrIiBmb250LXNpemU9IjEycHgiPjMgb24gdGhpcyBjb21wdXRlci48L3RleHQ+CgkJPHJlY3QgeD0iNiIgeT0iODQiIHdpZHRoPSIzMiIgaGVpZ2h0PSIxNiIgZmlsbD0iI2U5ZTllOSIgLz4KCQk8dGV4dCB4PSI3IiB5PSI5NiIgZmlsbD0iYmxhY2siIGZvbnQtc2l6ZT0iMTJweCI+SW5zdGFsbDwvdGV4dD4KCQk8cmVjdCB4PSI2IiB5PSIxMDQiIHdpZHRoPSIzMiIgaGVpZ2h0PSIxNiIgZmlsbD0iI2U5ZTllOSIgLz4KCQk8dGV4dCB4PSI4IiB5PSIxMTYiIGZpbGw9ImJsYWNrIiBmb250LXNpemU9IjEycHgiPlRyeSBpdDwvdGV4dD4KCTwvZz4KPC9zdmc+Cg==\",\"d56fd42fb2d82426f49b65ca25fb3281163362cfd7b43d5003cc83ab91ea9fd13dae7629ff160ac275d79ca4fccc29fb9a90bc4c67ba505c7d58d84839408693\":\"data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTI4IiBoZWlnaHQ9IjEyOCIgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgoJPGc+CgkJPHJlY3QgeD0iMCIgeT0iMCIgd2lkdGg9IjY0IiBoZWlnaHQ9IjEyOCIgZmlsbD0iI2ZmZmZmZiIgLz4KCQk8cmVjdCB4PSI2NCIgeT0iMCIgd2lkdGg9IjY0IiBoZWlnaHQ9IjEyOCIgZmlsbD0iIzAwMDAwMCIgLz4KCQk8ZWxsaXBzZSBjeD0iMzIiIGN5PSI2NCIgcng9IjE2IiByeT0iNDgiIHN0cm9rZT0iIzAwOTRmZiIgc3Ryb2tlLXdpZHRoPSI0IiBmaWxsPSJibGFjayIgLz4KCQk8ZWxsaXBzZSBjeD0iOTYiIGN5PSI2NCIgcng9IjE2IiByeT0iNDgiIHN0cm9rZT0iI2ZmNmIwMCIgc3Ryb2tlLXdpZHRoPSI0IiBmaWxsPSJ3aGl0ZSIgLz4KCTwvZz4KPC9zdmc+Cg==\",\"92952ea57d7923fdf7cb3290fe838c6ae55f6dc12d413f582d6d5f36ea28ad79fa9d4e80511813c14a32acfcd9f1838a158f47d93c2827a081ad571ba677a054\":\"data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTI4IiBoZWlnaHQ9IjEyOCIgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgoJPGc+CgkJPHJlY3QgeD0iMTUiIHk9IjE1IiB3aWR0aD0iNDAiIGhlaWdodD0iMzUiIGZpbGw9IiMwMDAwMDAiIC8+CgkJPHJlY3QgeD0iMTciIHk9IjE3IiB3aWR0aD0iMzYiIGhlaWdodD0iMzEiIGZpbGw9IiNhNzAwZmYiIC8+CgkJPGxpbmUgeDE9IjU1IiB5MT0iMzIiIHgyPSI3OCIgeTI9IjMyIiBzdHJva2U9IiMwMDAwMDAiIHN0cm9rZS13aWR0aD0iOCIgLz4KCQk8cmVjdCB4PSI3MyIgeT0iMTUiIHdpZHRoPSI0MCIgaGVpZ2h0PSIzNSIgZmlsbD0iIzAwMDAwMCIgLz4KCQk8bGluZSB4MT0iMzUiIHkxPSI1MCIgeDI9IjU0IiB5Mj0iNzgiIHN0cm9rZT0iIzAwMDAwMCIgc3Ryb2tlLXdpZHRoPSI4IiAvPgoJCTxsaW5lIHgxPSI5MyIgeTE9IjUwIiB4Mj0iNzQiIHkyPSI3OCIgc3Ryb2tlPSIjMDAwMDAwIiBzdHJva2Utd2lkdGg9IjgiIC8+CgkJPHJlY3QgeD0iNDQiIHk9Ijc4IiB3aWR0aD0iNDAiIGhlaWdodD0iMzUiIGZpbGw9IiMwMDAwMDAiIC8+CgkJPHJlY3QgeD0iNDYiIHk9IjgwIiB3aWR0aD0iMzYiIGhlaWdodD0iMzEiIGZpbGw9IiMwMGJmZmYiIC8+Cgk8L2c+Cjwvc3ZnPgo=\",\"375993d7cdabc2591c6e76eda200b202eebe4e04d3742db21276115c8835fa255067ce3553bfabf6a0eb83f7305113ee2a15e6b7263f3fd092b34f8f18a35289\":\"data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTI4IiBoZWlnaHQ9IjEyOCIgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgoJPGc+CgkJPHJlY3QgeD0iMTUiIHk9IjE1IiB3aWR0aD0iNDAiIGhlaWdodD0iMzUiIGZpbGw9IiMwMDAwMDAiIC8+CgkJPHJlY3QgeD0iMTciIHk9IjE3IiB3aWR0aD0iMzYiIGhlaWdodD0iMzEiIGZpbGw9IiNhNzAwZmYiIC8+CgkJPGxpbmUgeDE9IjU1IiB5MT0iMzIiIHgyPSI3OCIgeTI9IjMyIiBzdHJva2U9IiMwMDAwMDAiIHN0cm9rZS13aWR0aD0iOCIgLz4KCQk8cmVjdCB4PSI3MyIgeT0iMTUiIHdpZHRoPSI0MCIgaGVpZ2h0PSIzNSIgZmlsbD0iIzAwMDAwMCIgLz4KCQk8bGluZSB4MT0iMzUiIHkxPSI1MCIgeDI9IjU0IiB5Mj0iNzgiIHN0cm9rZT0iIzAwMDAwMCIgc3Ryb2tlLXdpZHRoPSI4IiAvPgoJCTxsaW5lIHgxPSI5MyIgeTE9IjUwIiB4Mj0iNzQiIHkyPSI3OCIgc3Ryb2tlPSIjMDAwMDAwIiBzdHJva2Utd2lkdGg9IjgiIC8+CgkJPHJlY3QgeD0iNDQiIHk9Ijc4IiB3aWR0aD0iNDAiIGhlaWdodD0iMzUiIGZpbGw9IiMwMDAwMDAiIC8+CgkJPHJlY3QgeD0iNDYiIHk9IjgwIiB3aWR0aD0iMzYiIGhlaWdodD0iMzEiIGZpbGw9IiMwMGJmZmYiIC8+CgkJPGxpbmUgeDE9IjAiIHkxPSIwIiB4Mj0iMTI4IiB5Mj0iMTI4IiBzdHJva2U9IiNmZjAwMDAiIHN0cm9rZS13aWR0aD0iOCIgLz4KCQk8bGluZSB4MT0iMTI4IiB5MT0iMCIgeDI9IjAiIHkyPSIxMjgiIHN0cm9rZT0iI2ZmMDAwMCIgc3Ryb2tlLXdpZHRoPSI4IiAvPgoJPC9nPgo8L3N2Zz4K\",\"1924ffd4890f5127cfa87727ffcf204457534f33be193ff14d3f6dd7d5e209302776f50c1730b5d12fc77c6b212a84a0284e1bc5b7520cb5e6a91c8f1ef32955\":\"data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTI4IiBoZWlnaHQ9IjEyOCIgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgoJPGc+CgkJPHJlY3QgeD0iMTUiIHk9IjE1IiB3aWR0aD0iNDAiIGhlaWdodD0iMzUiIGZpbGw9IiMwMDAwMDAiIC8+CgkJPHJlY3QgeD0iMTciIHk9IjE3IiB3aWR0aD0iMzYiIGhlaWdodD0iMzEiIGZpbGw9IiNhNzAwZmYiIC8+CgkJPGxpbmUgeDE9IjU1IiB5MT0iMzIiIHgyPSI3OCIgeTI9IjMyIiBzdHJva2U9IiMwMDAwMDAiIHN0cm9rZS13aWR0aD0iOCIgLz4KCQk8cmVjdCB4PSI3MyIgeT0iMTUiIHdpZHRoPSI0MCIgaGVpZ2h0PSIzNSIgZmlsbD0iIzAwMDAwMCIgLz4KCQk8cmVjdCB4PSI3NSIgeT0iMTciIHdpZHRoPSIzNiIgaGVpZ2h0PSIzMSIgZmlsbD0iI2E3MDBmZiIgLz4KCQk8bGluZSB4MT0iMzUiIHkxPSI1MCIgeDI9IjU0IiB5Mj0iNzgiIHN0cm9rZT0iIzAwMDAwMCIgc3Ryb2tlLXdpZHRoPSI4IiAvPgoJCTxsaW5lIHgxPSI5MyIgeTE9IjUwIiB4Mj0iNzQiIHkyPSI3OCIgc3Ryb2tlPSIjMDAwMDAwIiBzdHJva2Utd2lkdGg9IjgiIC8+CgkJPHJlY3QgeD0iNDQiIHk9Ijc4IiB3aWR0aD0iNDAiIGhlaWdodD0iMzUiIGZpbGw9IiMwMDAwMDAiIC8+CgkJPHJlY3QgeD0iNDYiIHk9IjgwIiB3aWR0aD0iMzYiIGhlaWdodD0iMzEiIGZpbGw9IiNhNzAwZmYiIC8+Cgk8L2c+Cjwvc3ZnPgo=\",\"a7bdbb244727774596cac8981d1b2c67397e3d6c05e5530ea25acaf7b6971f24e4592cfab47f6d33034eb48e5aa776e04e70bcfb858a63557da60fbb20685bf7\":\"data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTI4IiBoZWlnaHQ9IjEyOCIgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgoJPGc+CgkJPHJlY3QgeD0iMTUiIHk9IjE1IiB3aWR0aD0iNDAiIGhlaWdodD0iMzUiIGZpbGw9IiMwMDAwMDAiIC8+CgkJPHJlY3QgeD0iMTciIHk9IjE3IiB3aWR0aD0iMzYiIGhlaWdodD0iMzEiIGZpbGw9IiNhNzAwZmYiIC8+CgkJPGxpbmUgeDE9IjU1IiB5MT0iMzIiIHgyPSI3OCIgeTI9IjMyIiBzdHJva2U9IiMwMDAwMDAiIHN0cm9rZS13aWR0aD0iOCIgLz4KCQk8cmVjdCB4PSI3MyIgeT0iMTUiIHdpZHRoPSI0MCIgaGVpZ2h0PSIzNSIgZmlsbD0iIzAwMDAwMCIgLz4KCQk8cmVjdCB4PSI3NSIgeT0iMTciIHdpZHRoPSIzNiIgaGVpZ2h0PSIzMSIgZmlsbD0iI2E3MDBmZiIgLz4KCQk8bGluZSB4MT0iMzUiIHkxPSI1MCIgeDI9IjU0IiB5Mj0iNzgiIHN0cm9rZT0iIzAwMDAwMCIgc3Ryb2tlLXdpZHRoPSI4IiAvPgoJCTxsaW5lIHgxPSI5MyIgeTE9IjUwIiB4Mj0iNzQiIHkyPSI3OCIgc3Ryb2tlPSIjMDAwMDAwIiBzdHJva2Utd2lkdGg9IjgiIC8+CgkJPHJlY3QgeD0iNDQiIHk9Ijc4IiB3aWR0aD0iNDAiIGhlaWdodD0iMzUiIGZpbGw9IiMwMDAwMDAiIC8+CgkJPHJlY3QgeD0iNDYiIHk9IjgwIiB3aWR0aD0iMzYiIGhlaWdodD0iMzEiIGZpbGw9IiNhNzAwZmYiIC8+CgkJPGxpbmUgeDE9IjAiIHkxPSIwIiB4Mj0iMTI4IiB5Mj0iMTI4IiBzdHJva2U9IiNmZjAwMDAiIHN0cm9rZS13aWR0aD0iOCIgLz4KCQk8bGluZSB4MT0iMTI4IiB5MT0iMCIgeDI9IjAiIHkyPSIxMjgiIHN0cm9rZT0iI2ZmMDAwMCIgc3Ryb2tlLXdpZHRoPSI4IiAvPgoJPC9nPgo8L3N2Zz4K\",\"0a2f926413a2114f15bed1818345975dec91947ce4ef144a291c4cf54c5404eeef0b75bb0a0dbd02a11d8ca781143d2e20e0236cdbab68b59c374fb63e3bbfde\":\"data:image/png;base64,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\",\"503494927bdb1ae61e148630a08d7c9c76bbf88da49ce19f45272d02bb24fdd115c681cc78833da0682e303cdbd0bf7591b41604a6661aa9ce593bb908894589\":\"data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTI4IiBoZWlnaHQ9IjEyOCIgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgoJPGc+CgkJPHJlY3QgeD0iMCIgeT0iMzQiIHdpZHRoPSIxMTIiIGhlaWdodD0iNjAiIHN0cm9rZT0iIzgwODA4MCIgc3Ryb2tlLXdpZHRoPSIyIiBmaWxsPSJ0cmFuc3BhcmVudCIgLz4KCQk8cmVjdCB4PSIxMTIiIHk9IjQ4IiB3aWR0aD0iMTYiIGhlaWdodD0iMzIiIGZpbGw9IiM4MDgwODAiIC8+CgkJPHJlY3QgeD0iMSIgeT0iMzUiIHdpZHRoPSIxMTAiIGhlaWdodD0iNTgiIGZpbGw9IiMwMGZmMDAiIC8+Cgk8L2c+Cjwvc3ZnPgo=\",\"84b2490f5daab9523269ddb9f0ef3cf51803ca56655b3068e5002d1bb37c63804c3bb0ea4c50aa1afc051200fa5f20147ee2cf1b66b47d5de34930a35ad17322\":\"data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTI4IiBoZWlnaHQ9IjEyOCIgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgoJPGc+CgkJPHJlY3QgeD0iMCIgeT0iMCIgd2lkdGg9IjEyOCIgaGVpZ2h0PSIxMjgiIGZpbGw9IiNmZmZmZmYiIC8+CgkJPHJlY3QgeD0iMCIgeT0iLTQiIHdpZHRoPSI0OCIgaGVpZ2h0PSI0OCIgZmlsbD0iIzgwODA4MCIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMTI4LCAtMzIpIHJvdGF0ZSg0NSkiIC8+CgkJPHRleHQgeD0iNiIgeT0iMTYiIGZvbnQtc2l6ZT0iMTJweCI+TG9yZW0gaXBzdW0gZG9sb3I8L3RleHQ+CgkJPHRleHQgeD0iNiIgeT0iMzIiIGZvbnQtc2l6ZT0iMTJweCI+c2l0IGFtZXQsIGNvbnNlY3RldHVyPC90ZXh0PgoJCTx0ZXh0IHg9IjYiIHk9IjQ4IiBmb250LXNpemU9IjEycHgiPmFkaXBpc2NpbmcgZWxpdC4gTnVsbGFtPC90ZXh0PgoJCTx0ZXh0IHg9IjYiIHk9IjY0IiBmb250LXNpemU9IjEycHgiPnVsbGFtY29ycGVyIG1vbGxpczwvdGV4dD4KCQk8dGV4dCB4PSI2IiB5PSI4MCIgZm9udC1zaXplPSIxMnB4Ij5sYWNpbmlhLiBVdCBkaWduaXNzaW0sPC90ZXh0PgoJCTx0ZXh0IHg9IjYiIHk9Ijk2IiBmb250LXNpemU9IjEycHgiPmxvcmVtIHNlZCB1bHRyaWNlczwvdGV4dD4KCQk8dGV4dCB4PSI2IiB5PSIxMTIiIGZvbnQtc2l6ZT0iMTJweCI+cG9ydHRpdG9yLCB0ZWxsdXMuLi48L3RleHQ+Cgk8L2c+Cjwvc3ZnPgo=\",\"257ba99d5c0750f81152ebde33ebde2f2f4e72b7730013180cecf10d87591c65f166d1314deba3b169567fdbecc6d9d653c58567b23daa83fd838e88a8864e0b\":\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAAAwXpUWHRSYXcgcHJvZmlsZSB0eXBlIGV4aWYAAHjabVDbEcMgDPv3FB0BLPMahzTpXTfo+DVgcqGp7pCFDcKYjs/7RY8G9kISUo4lRqeQIoWriuwGamfvpHPHLOl+ydNZYE1BI+xCtPMz70+DEaqqcDV6WmFbC0XMP/8Y8QhoHTW9m1ExI/AoeDOo41sulpyuX9gOtyKPRY0kr23f9kmntwd9B8wHPJwyEEcDaCsQqgqv7JG5KXSdlIFppgP5N6cJ+gLqhVkYh0XxjQAAAYRpQ0NQSUNDIHByb2ZpbGUAAHicfZE9SMNQFIVPU6VSKortIOKQoTrZRUUcaxWKUCHUCq06mLz0D5o0JCkujoJrwcGfxaqDi7OuDq6CIPgD4i44KbpIifelhRYxXni8j/PuObx3HyA0KkyzeuKApttmOpkQs7lVMfAKH4YQxCDCMrOMOUlKwbO+7qmb6i7Gs7z7/qx+NW8xwCcSx5lh2sQbxDObtsF5nzjCSrJKfE48YdIFiR+5rrT4jXPRZYFnRsxMep44QiwWu1jpYlYyNeJp4qiq6ZQvZFusct7irFVqrH1P/sJQXl9Z5jqtUSSxiCVIEKGghjIqsBGjXSfFQprOEx7+EdcvkUshVxmMHAuoQoPs+sH/4PdsrcLUZCsplAB6XxznYwwI7ALNuuN8HztO8wTwPwNXesdfbQCzn6TXO1r0CBjYBi6uO5qyB1zuAMNPhmzKruSnJRQKwPsZfVMOCN8CwbXW3NrnOH0AMjSr1A1wcAiMFyl73ePdfd1z+7enPb8fQC5ykgotUKYAAA14aVRYdFhNTDpjb20uYWRvYmUueG1wAAAAAAA8P3hwYWNrZXQgYmVnaW49Iu+7vyIgaWQ9Ilc1TTBNcENlaGlIenJlU3pOVGN6a2M5ZCI/Pgo8eDp4bXBtZXRhIHhtbG5zOng9ImFkb2JlOm5zOm1ldGEvIiB4OnhtcHRrPSJYTVAgQ29yZSA0LjQuMC1FeGl2MiI+CiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPgogIDxyZGY6RGVzY3JpcHRpb24gcmRmOmFib3V0PSIiCiAgICB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIKICAgIHhtbG5zOnN0RXZ0PSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VFdmVudCMiCiAgICB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iCiAgICB4bWxuczpHSU1QPSJodHRwOi8vd3d3LmdpbXAub3JnL3htcC8iCiAgICB4bWxuczp0aWZmPSJodHRwOi8vbnMuYWRvYmUuY29tL3RpZmYvMS4wLyIKICAgIHhtbG5zOnhtcD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLyIKICAgeG1wTU06RG9jdW1lbnRJRD0iZ2ltcDpkb2NpZDpnaW1wOjRlZDI3MGJiLTk1NTctNDkxMy1hMzJlLWRmODlhZDI2YTBmZiIKICAgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDo0MjI3NTNhNC02OTI4LTQ5ZmMtOTY1Mi1jOGI0OWI3NTIxZTciCiAgIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDoxMmVlMjdlNS04YTUyLTRiYzUtOGZhNS01ZWEzNjE3ZTAyMGQiCiAgIGRjOkZvcm1hdD0iaW1hZ2UvcG5nIgogICBHSU1QOkFQST0iMi4wIgogICBHSU1QOlBsYXRmb3JtPSJMaW51eCIKICAgR0lNUDpUaW1lU3RhbXA9IjE3MzcxOTU0NTA1NTkwNDciCiAgIEdJTVA6VmVyc2lvbj0iMi4xMC4zNiIKICAgdGlmZjpPcmllbnRhdGlvbj0iMSIKICAgeG1wOkNyZWF0b3JUb29sPSJHSU1QIDIuMTAiCiAgIHhtcDpNZXRhZGF0YURhdGU9IjIwMjU6MDE6MThUMTM6MTc6MzArMDM6MDAiCiAgIHhtcDpNb2RpZnlEYXRlPSIyMDI1OjAxOjE4VDEzOjE3OjMwKzAzOjAwIj4KICAgPHhtcE1NOkhpc3Rvcnk+CiAgICA8cmRmOlNlcT4KICAgICA8cmRmOmxpCiAgICAgIHN0RXZ0OmFjdGlvbj0ic2F2ZWQiCiAgICAgIHN0RXZ0OmNoYW5nZWQ9Ii8iCiAgICAgIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6MTljYjcwYTMtMmNkZi00NjE5LWEzMTUtOTUyNjRkZjNhMDliIgogICAgICBzdEV2dDpzb2Z0d2FyZUFnZW50PSJHaW1wIDIuMTAgKExpbnV4KSIKICAgICAgc3RFdnQ6d2hlbj0iMjAyNS0wMS0xOFQxMzoxNzozMCswMzowMCIvPgogICAgPC9yZGY6U2VxPgogICA8L3htcE1NOkhpc3Rvcnk+CiAgPC9yZGY6RGVzY3JpcHRpb24+CiA8L3JkZjpSREY+CjwveDp4bXBtZXRhPgogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgCjw/eHBhY2tldCBlbmQ9InciPz5S1XxbAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH6QESChEenq7N6wAADn5JREFUeNrtnGtsVNW7xn9r7z33XrgVCpRSWwpyx3ByPDlRvxDN+WBiIPFShINwYsDMiZrwQROrMYKJXzX/JiBEbU00qGhMIOYfJSFKTg7NSQBREEpLodza0mLbaee2917nw56Z3ktpZ0qns55kMu2+zKznXc963nevvWaDgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgkLWora2Vu7cuVM+zDbcvn37wunTp+WRI0ceSjtErnb8/v37aWhoAOC3337jySefnLJYtLS0yOvXr/PVV18N2l5TUyOUADKIuro6uW/fvlTHV1ZWUl1dzY4dOzIeh+bmZnnt2jW++eabYft27dpFaWnpjqKiojolgCkY8cmOf/nll3G73di2nZFYXLlyRV67do3vv/9+2L5XX32VDRs2PPT4i1zs+K1bt/Lmm28C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\"},\"buildInfo\":{\"for\":\"1298\",\"when\":1750440209987,\"signer\":\"moduleSigner\",\"critical\":false,\"signature\":\"1aa2e566d00985d616db3a9f54527cceac3f4fadf5db82097238f3c6f7c84f3ec1af5803a448a1c0e387ad7437c21327eea382859add5925895a29e5fd6d9acf\"}}");
// modules/50-pcos-sounds.fs
modules.fs.write(".installer/modules/50-pcos-sounds.fs", "{\"backend\":{\"files\":{\"etc\":{\"sounds\":{\"ask.aud\":\"4d796cd50185390d57df8bd4abacc5c7af0fd74aea45e1da23910729b1ce88e456ffbc98b4c066109f3b05b9c8776e77d32d028814876215c8e9f7b83eb8269a\",\"ding.aud\":\"1e9d27e3ef66e672e08d1900ac87493ff835554d57fbbfd66086edbd60e4c7a07aa3f856772c8700b9568851374eac97beff4d66e357d7a7015482338f6399ae\",\"error.aud\":\"d11dd999d30648c9299b5ca35daa000826199221c5148ac5e22dda16079de7fddc86562cc58833ef340d86a9ae0dd6313a3015b11a72c6e4f4d700d953bd7de0\",\"shutdown.aud\":\"9ae14c1864ba395e491080e5a93ad77a54140898f0aad54646ebe4e13945fd9c78b3e9a45155a9951b960065247e7dcc453ee9aa4e0287d94d4d8727210721ab\",\"startup.aud\":\"8ad2e8177e4e5b90e796eab44f63cb5cde4d43b13af0bd0e591eb130980b2a8607edb174806cefc535a9cea0a4f74b5eb65ae798c65d7016e7ab5ee291078d7c\"}}},\"permissions\":{\"etc/sounds/ask.aud\":{\"world\":\"rx\"},\"etc/sounds/ding.aud\":{\"world\":\"rx\"},\"etc/sounds/error.aud\":{\"world\":\"rx\"},\"etc/sounds/shutdown.aud\":{\"world\":\"rx\"},\"etc/sounds/startup.aud\":{\"world\":\"rx\"},\"etc/sounds/\":{\"world\":\"rx\"},\"etc/\":{\"world\":\"rx\"},\"\":{\"world\":\"rx\"}}},\"files\":{\"4d796cd50185390d57df8bd4abacc5c7af0fd74aea45e1da23910729b1ce88e456ffbc98b4c066109f3b05b9c8776e77d32d028814876215c8e9f7b83eb8269a\":\"data:audio/mpeg;base64,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HBACSjLCdkCoB7AQef0SNjeA1gLPKVQUv5qT7L5IQX7QSBtZvt6ZkxOf4xqEdtadXsMiMCsnqx3Dy8ylqhkvY1TAXICjGGXJD5USCVrBZJF5P/p/0Xf///tSxOkDC4CvGi29sQmBEWMFt6YYcN+kIcpCBjFwfMewEqXSJuZYSZd+aj8HK4EaTIWnyoDGERzAojcRgcJapHz0FmZtjILpdijPImIkMJUZ0C2MbiUkeVfd9DpmqJd+Ja+cz6te/94XiRy3nThUNcJtZxN3/+4CAApeHYA6KonhTlMsLgACLxMcUwvDGHBDY0kIo8j7F+pQQCZvwW0GAOCcDPlgqCGtnlf2xgSwJx13X8o4vUVo2/PyFmWtln5/Nkeqcq+uJEJWGVEEkQUDZH//+1LE6IOLnK8YDb1wwX8RowW9PHL/R+nT9v/+z2gQAA9sDBCaACGRRpy6WyFLkxZmBMEPtjQC7a4VGq6ctgLiZrpmkFZumMkLvz/Ebd6zNS8WAOMWENvp6NqksmeLCINSW3RUGPPBUJCYFAEkRjjJNhCFP20ggkSQjKlUiNgDRUDdsousU0ZcRHin7Gkhr1yvfgdBw4pyD5mOlBBr5gFk5iOu3OEwBKbjujZNcypnhaxlgnWFzJARFFMRmhMxWn/sa9lW7+r//vu27B24cDIjcP/7UsToAAtYeSFM6Q6BfBJiwc08cQjBlRKcD0HIj5RCEKs3jcxlY/U8woAzgcaHBwQsuIiQFIiG0dBPOMltspdWlpmjK5rwBDZhCZHpaPwpq0c2ifUOF1Jq7n3G2yUcmTr6xOkTHK5SvODM4Q2V0T7i9iG0bi9YnYZXOuPqG2Eq5336XgZtX6UvlbO/S+wbbvcDIIxIGRRiQMjDEhapRIWjKpC0ZUALRlQOqMqjojKoyItUDpClUdKyTEFNRTMuMTAwqqqqqgABZOsDOyNKEk6G//tSxOkDDFSfGs2wcUFcEGNJt6IQCMosgnHArmBmEEwIULQXP2Tirjc2aLEho0Kihp7N7P/F9ISFdQv1M//9fWKcVbxRD6//4vVMQU1FMy4xMDBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/+1LE6gMK+HcebTEQgp+fIsW9MLlVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/7UsTBg8fsSQ5HsMhAAAA0gAAABFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV\",\"1e9d27e3ef66e672e08d1900ac87493ff835554d57fbbfd66086edbd60e4c7a07aa3f856772c8700b9568851374eac97beff4d66e357d7a7015482338f6399ae\":\"data:audio/mpeg;base64,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tluDvAwCOUOAMPM0SaMIgyJqkiacCP7p3GfhxadKjIbMoX6UB40bzuAl52FU0vnZUgexzLVcRKx6YhhWqx5CqAiOm9mthi+sUN5qu3lZaxnzKShTCMYt//tSxOACCkSlI00kdMlLkKNFvC4Yq3XUAxEKKDcF/a0bJQD7BBQqfDZgL+AwG9euLxfuU0QwHoUTA34dKljxkoBYsQdb1jMQJtXH0x1a1tdqTFKln7SWFIcxNZjJh89GjzpCFiBEa9H/s///+rSn/94jBHbVQBp+a7bhcQC4IXREO+bAaiQG9L/QVZuK2GJk51A+mbK4HAQBF8fHAxJuV1YokLXhhsAggZcfG7zXmgDmVF5ZaRJYQMOmvBSEnF8xK1apYRGYFpB0H1qXQkHoN3//+1LE64IMCLsc7bB0wYcT4wm8IhhYOgkgxIRKbKPxiMEmAQMjUKoM4uLR4JtFuPTBc/Exg1mYa7qRs4kaMT9VHpBJeu0svs3qqBSOCakWxt7v46wCRLN8mUeFEcG1Tey7/v53+2moICcyIS6l4ua3XwAYAAQSMsFru4nAgkmHhCmDNwgKcE8c6GMa4XbAxgKIPDCSjiGvtyLgFbFrMqqgyACg1GWRFU82Xz0YuM5h/+RigGCAcSNTMPYce+Zu+73f/3bMQfq+kIDPJwCADCoKTv/7UsTogAuEvRgtvRDBYw7j3ZeaGHc3hGUu7UAMI4yVmwQNVqV4rtTRG8EAjIA0bnrZ8zpXUOy4sHiNgERUSmjxOCQGhCRITRhGgOHUmTR42YLh8Y6SJZlim6Sg5hMQWRJKWgeUaklCcW01ij0Lh/lrgtnqFwB0jEhekYkLUjEhatZJVGWDC0ZRIWjKpKoyoBVOqB1RlQOidVHSLVA6ZVQOlUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//tSxOwDzBiNFA29NIlsk6LBzBngVQVGsLFVJrKkQhB4DgcgTi0sBCSoWEZkYLC5lzVEQELNF0//FfFOtvZ//8X4szi/sd//1tVMQU1FMy4xMDBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/+1LE7AAK0IkhTT1JQlgbIsWkmllVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/7UsS7g8ZwJxBEmGhAAAA0gAAABFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV\",\"d11dd999d30648c9299b5ca35daa000826199221c5148ac5e22dda16079de7fddc86562cc58833ef340d86a9ae0dd6313a3015b11a72c6e4f4d700d953bd7de0\":\"data:audio/mpeg;base64,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\",\"9ae14c1864ba395e491080e5a93ad77a54140898f0aad54646ebe4e13945fd9c78b3e9a45155a9951b960065247e7dcc453ee9aa4e0287d94d4d8727210721ab\":\"data:audio/mpeg;base64,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\",\"8ad2e8177e4e5b90e796eab44f63cb5cde4d43b13af0bd0e591eb130980b2a8607edb174806cefc535a9cea0a4f74b5eb65ae798c65d7016e7ab5ee291078d7c\":\"data:audio/mpeg;base64,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\"},\"buildInfo\":{\"for\":\"1298\",\"when\":1750440209990,\"signer\":\"moduleSigner\",\"critical\":false,\"signature\":\"24838de2f77cbed4a5f40173cec8412f07f84ed98a05a85b5eda97c1c4d37c3d1a21b5b570ae438ba54deea576b329cb7b3369a54da11d089b5bbd7a1b9fd27d\"}}");
// modules/50-pcos-wallpapers.fs
modules.fs.write(".installer/modules/50-pcos-wallpapers.fs", "{\"backend\":{\"files\":{\"etc\":{\"wallpapers\":{\"pcos-beta.pic\":\"f8ee463eea9061fd6a7bb7cfc05a27d2daa7946ea0f509c7cb5ba1554026ccfb888e221707b17050bea16fb15d2d6892c32c2d98e5cac5244ff9b4e25ae92b52\",\"pcos-dark-beta.pic\":\"3e4a583748ddd8aed6698dc1a74967a636b9c169191396c0e13ef8cd016ce74fcc052cc2fb4f4f2e8931da29c373d13d3dcad82f457b3ac89152d99a6dec36ef\",\"pcos-lock-beta.pic\":\"25f6573776d59732f789ba8b2c895d1e8ec09ae6c9b930c7b1c236e765897d003ce2558f1183e2050730efd341cf44eec18afabf221044af5990812992623c08\"}}},\"permissions\":{\"etc/wallpapers/pcos-beta.pic\":{\"world\":\"rx\"},\"etc/wallpapers/pcos-dark-beta.pic\":{\"world\":\"rx\"},\"etc/wallpapers/pcos-lock-beta.pic\":{\"world\":\"rx\"},\"etc/wallpapers/\":{\"world\":\"rx\"},\"etc/\":{\"world\":\"rx\"},\"\":{\"world\":\"rx\"}}},\"files\":{\"f8ee463eea9061fd6a7bb7cfc05a27d2daa7946ea0f509c7cb5ba1554026ccfb888e221707b17050bea16fb15d2d6892c32c2d98e5cac5244ff9b4e25ae92b52\":\"data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTkyMCIgaGVpZ2h0PSIxMDgwIiB2ZXJzaW9uPSIxLjEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+Cgk8ZGVmcz4KCQk8bGluZWFyR3JhZGllbnQgaWQ9IkJnR3JhZGllbnQiIHgxPSIwIiB4Mj0iMCIgeTE9IjAiIHkyPSIxIj4KCQkJPHN0b3Agb2Zmc2V0PSIwJSIgc3RvcC1jb2xvcj0iIzAwYmZmZiIgLz4KCQkJPHN0b3Agb2Zmc2V0PSIxMDAlIiBzdG9wLWNvbG9yPSIjYTcwMGZmIiAvPgoJCTwvbGluZWFyR3JhZGllbnQ+Cgk8L2RlZnM+Cgk8Zz4KCQk8cmVjdCB4PSIwIiB5PSIwIiB3aWR0aD0iMTkyMCIgaGVpZ2h0PSIxMDgwIiBmaWxsPSJ1cmwoI0JnR3JhZGllbnQpIiAvPgoJCTx0ZXh0IHg9IjM1IiB5PSIxNTAiIGNsYXNzPSJzZWdvZWZvbnQiIGZpbGw9IiNmZmZmZmYiPlBDT1MgMzwvdGV4dD4KCQk8dGV4dCB4PSIxNTU1IiB5PSIxMDMwIiBjbGFzcz0ic2Vnb2Vmb250IiBmaWxsPSIjMzAzMDMwIj50ZXN0IGJ1aWxkPC90ZXh0PgoJPC9nPgoJPHN0eWxlPgoJCS5zZWdvZWZvbnQgewoJCQlmb250LWZhbWlseTogJ1NlZ29lIFVJJywgVGFob21hLCBHZW5ldmEsIFZlcmRhbmEsIHNhbnMtc2VyaWY7CgkJCWZvbnQtc2l6ZTogNjRweDsKCQkJZm9udC13ZWlnaHQ6IGJvbGQ7CgkJfQoJPC9zdHlsZT4KPC9zdmc+Cg==\",\"3e4a583748ddd8aed6698dc1a74967a636b9c169191396c0e13ef8cd016ce74fcc052cc2fb4f4f2e8931da29c373d13d3dcad82f457b3ac89152d99a6dec36ef\":\"data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTkyMCIgaGVpZ2h0PSIxMDgwIiB2ZXJzaW9uPSIxLjEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+Cgk8ZGVmcz4KCQk8bGluZWFyR3JhZGllbnQgaWQ9IkJnR3JhZGllbnQiIHgxPSIwIiB4Mj0iMCIgeTE9IjAiIHkyPSIxIj4KCQkJPHN0b3Agb2Zmc2V0PSIwJSIgc3RvcC1jb2xvcj0iIzAwMDAwMCIgLz4KCQkJPHN0b3Agb2Zmc2V0PSIxMDAlIiBzdG9wLWNvbG9yPSIjYTcwMGZmIiAvPgoJCTwvbGluZWFyR3JhZGllbnQ+Cgk8L2RlZnM+Cgk8Zz4KCQk8cmVjdCB4PSIwIiB5PSIwIiB3aWR0aD0iMTkyMCIgaGVpZ2h0PSIxMDgwIiBmaWxsPSJ1cmwoI0JnR3JhZGllbnQpIiAvPgoJCTx0ZXh0IHg9IjM1IiB5PSIxNTAiIGNsYXNzPSJzZWdvZWZvbnQiIGZpbGw9IiNhNzAwZmYiPlBDT1MgMzwvdGV4dD4KCQk8dGV4dCB4PSIxNTU1IiB5PSIxMDMwIiBjbGFzcz0ic2Vnb2Vmb250IiBmaWxsPSIjMzAzMDMwIj50ZXN0IGJ1aWxkPC90ZXh0PgoJPC9nPgoJPHN0eWxlPgoJCS5zZWdvZWZvbnQgewoJCQlmb250LWZhbWlseTogJ1NlZ29lIFVJJywgVGFob21hLCBHZW5ldmEsIFZlcmRhbmEsIHNhbnMtc2VyaWY7CgkJCWZvbnQtc2l6ZTogNjRweDsKCQkJZm9udC13ZWlnaHQ6IGJvbGQ7CgkJfQoJPC9zdHlsZT4KPC9zdmc+Cg==\",\"25f6573776d59732f789ba8b2c895d1e8ec09ae6c9b930c7b1c236e765897d003ce2558f1183e2050730efd341cf44eec18afabf221044af5990812992623c08\":\"data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTkyMCIgaGVpZ2h0PSIxMDgwIiB2ZXJzaW9uPSIxLjEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+Cgk8ZGVmcz4KCQk8bGluZWFyR3JhZGllbnQgaWQ9IkJnR3JhZGllbnQiIHgxPSIwIiB4Mj0iMCIgeTE9IjAiIHkyPSIxIj4KCQkJPHN0b3Agb2Zmc2V0PSIwJSIgc3RvcC1jb2xvcj0iIzAwYmZmZiIgLz4KCQkJPHN0b3Agb2Zmc2V0PSI1MCUiIHN0b3AtY29sb3I9IiNhNzAwZmYiIC8+CgkJCTxzdG9wIG9mZnNldD0iMTAwJSIgc3RvcC1jb2xvcj0iIzAwMDAwMCIgLz4KCQk8L2xpbmVhckdyYWRpZW50PgoJPC9kZWZzPgoJPGc+CgkJPHJlY3QgeD0iMCIgeT0iMCIgd2lkdGg9IjE5MjAiIGhlaWdodD0iMTA4MCIgZmlsbD0idXJsKCNCZ0dyYWRpZW50KSIgLz4KCQk8dGV4dCB4PSI4MDAiIHk9IjIwMCIgY2xhc3M9InNlZ29lZm9udCIgZmlsbD0iIzAwMDAwMCIgZm9udC1zaXplPSI3MnB4IiBmb250LXdlaWdodD0iYm9sZCI+UENPUyAzPC90ZXh0PgoJCTx0ZXh0IHg9Ijg2MCIgeT0iMjQwIiBjbGFzcz0ic2Vnb2Vmb250IiBmaWxsPSIjNDA0MDQwIiBmb250LXNpemU9IjM2cHgiPmxvY2tlZDwvdGV4dD4KCQk8dGV4dCB4PSIxNTU1IiB5PSIxMDUwIiBjbGFzcz0ic2Vnb2Vmb250IiBmaWxsPSIjNDA0MDQwIiBmb250LXNpemU9IjcycHgiIGZvbnQtd2VpZ2h0PSJib2xkIj50ZXN0IGJ1aWxkPC90ZXh0PgoJPC9nPgoJPHN0eWxlPgoJCS5zZWdvZWZvbnQgewoJCQlmb250LWZhbWlseTogJ1NlZ29lIFVJJywgVGFob21hLCBHZW5ldmEsIFZlcmRhbmEsIHNhbnMtc2VyaWY7CgkJfQoJPC9zdHlsZT4KPC9zdmc+Cg==\"},\"buildInfo\":{\"for\":\"1298\",\"when\":1750440209993,\"signer\":\"moduleSigner\",\"critical\":false,\"signature\":\"f35f8b39239e36f3ad327ad3dd0f9bc8f62aae43baa1870adea713fe63bfe20f55ff79036604b2b25d2d6a23838b5b8bf0dceed7467a16633bebd7a2c99ddbeb\"}}");

// modules/.../boot/01-fsmodules.js
async function loadModules() {
	let hexToU8A = (hex) => Uint8Array.from(hex.match(/.{1,2}/g).map(a => parseInt(a, 16)));
	let u8aToHex = (u8a) => Array.from(u8a).map(a => a.toString(16).padStart(2, "0")).join("");
	let khrlSignatures = [];
	async function loadKHRL() {
		let khrlFiles = await modules.fs.ls(".00-keys.fs/etc/keys/khrl");
		for (let khrlFile of khrlFiles) {
			let khrl = JSON.parse(await modules.fs.read(".00-keys.fs/etc/keys/khrl/" + khrlFile));
			let khrlSignature = khrl.signature;
			delete khrl.signature;
			if (await crypto.subtle.verify({
				name: "ECDSA",
				hash: {
					name: "SHA-256"
				}
			}, modules.ksk_imported, hexToU8A(khrlSignature), new TextEncoder().encode(JSON.stringify(khrl.list)))) {
				khrlSignatures.push(...khrl.list);
			}
		}
	}
	async function recursiveKeyVerify(key, khrl) {
		if (!key) throw new Error("NO_KEY");
		let hash = u8aToHex(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode((key.keyInfo?.key || key.key).x + "|" + (key.keyInfo?.key || key.key).y))));
		if (khrl.includes(hash)) throw new Error("KEY_REVOKED");
		let signedByKey = modules.ksk_imported;
		if (key.keyInfo && key.keyInfo?.signedBy) {
			signedByKey = JSON.parse(await modules.fs.read(".00-keys.fs/etc/keys/" + key.keyInfo.signedBy));
			if (!signedByKey.keyInfo) throw new Error("NOT_KEYS_V2");
			if (!signedByKey.keyInfo.usages.includes("keyTrust")) throw new Error("NOT_KEY_AUTHORITY");
			await recursiveKeyVerify(signedByKey, khrl);
			signedByKey = await crypto.subtle.importKey("jwk", signedByKey.keyInfo.key, {
				name: "ECDSA",
				namedCurve: "P-256"
			}, false, ["verify"]);
		}
		if (!await crypto.subtle.verify({
			name: "ECDSA",
			hash: {
				name: "SHA-256"
			}
		}, signedByKey, hexToU8A(key.signature), new TextEncoder().encode(JSON.stringify(key.key || key.keyInfo)))) throw new Error("KEY_SIGNATURE_VERIFICATION_FAILED");
		return true;
	}
	try {
		let moduleList = (await modules.fs.ls(modules.defaultSystem + "/modules")).sort((a, b) => a.localeCompare(b));
		for (let moduleName of moduleList) {
			let fullModuleFile = JSON.parse(await modules.fs.read(modules.defaultSystem + "/modules/" + moduleName));
			let fullModuleSignature = fullModuleFile.buildInfo.signature;
			delete fullModuleFile.buildInfo.signature;
			if (moduleName == "00-keys.fs") {
				try {
					fullModuleFile = JSON.stringify(fullModuleFile);
					if (!(await crypto.subtle.verify({
						name: "ECDSA",
						hash: {
							name: "SHA-256"
						}
					}, modules.ksk_imported, hexToU8A(fullModuleSignature), new TextEncoder().encode(fullModuleFile)))) throw new Error("MODULE_SIGNATURE_VERIFICATION_FAILED");
				} catch (e) {
					await panic("KEYS_MODULE_VERIFICATION_FAILED", {
						name: "/modules/00-keys.fs",
						params: [modules.defaultSystem],
						underlyingJS: e
					});
				}
			} else {
				let critical = fullModuleFile.buildInfo.critical;
				try {
					let signingKey = JSON.parse(await modules.fs.read(".00-keys.fs/etc/keys/" + fullModuleFile.buildInfo.signer));
					await recursiveKeyVerify(signingKey, khrlSignatures);
					if (!signingKey.keyInfo.usages.includes("moduleTrust")) throw new Error("NOT_MODULE_SIGNING_KEY");
					let importSigningKey = await crypto.subtle.importKey("jwk", signingKey.keyInfo.key, {
						name: "ECDSA",
						namedCurve: "P-256"
					}, false, ["verify"]);
					fullModuleFile = JSON.stringify(fullModuleFile);
					if (!await crypto.subtle.verify({
						name: "ECDSA",
						hash: {
							name: "SHA-256"
						}
					}, importSigningKey, hexToU8A(fullModuleSignature), new TextEncoder().encode(fullModuleFile))) throw new Error("MODULE_SIGNATURE_VERIFICATION_FAILED");
				} catch (e) {
					console.error("Failed to verify module:", e);
					if (critical) await panic("CRITICAL_MODULE_VERIFICATION_FAILED", {
						name: "/modules/" + moduleName,
						params: [modules.defaultSystem],
						underlyingJS: e
					});
					continue;
				}
			}
			modules.fs.mounts["." + moduleName] = await modules.mounts.fileMount({
				srcFile: modules.defaultSystem + "/modules/" + moduleName,
				read_only: true
			});
			if (moduleName == "00-keys.fs") await loadKHRL();
			if (modules.core.bootMode == "logboot") modules.core.tty_bios_api.println("\t../modules/" + moduleName);
		}
		let newSystemMount = "system";
		if (modules.defaultSystem == "system") newSystemMount = "system-" + crypto.getRandomValues(new Uint8Array(4)).reduce((a, b) => a + b.toString(16).padStart(2, "0"), "");
		modules.fs.mounts[newSystemMount] = await modules.mounts.overlayMount({
			mounts: [ modules.defaultSystem, ...moduleList.map(a => "." + a) ]
		});
		modules.defaultSystem = newSystemMount;
	} catch (e) {
		console.error("Module system failed:", e);
	}
}
await loadModules();
// modules/.../boot/02-postmodule.js
// Insert wallpapers
try { modules.fs.write("system/etc/wallpapers/lockscreen.pic", await modules.fs.read("system/etc/wallpapers/pcos-lock-beta.pic")); } catch {}
try { modules.fs.write("system/root/.wallpaper", await modules.fs.read("system/etc/wallpapers/pcos-beta.pic")); } catch {}
// modules/.../boot/02-ui.js
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
		background: ${modules.core.bootMode == "safe" ? "rgb(128, 128, 128)" : "rgba(128, 128, 128, 0.85)"};
		left: 0;
		bottom: 0;
		position: absolute;
		padding: 4px;
		box-sizing: border-box;
		border-radius: 4px;
		display: flex;
	}

	.taskbar .clock {
		margin-right: 4px;
	}

	.taskbar .icon {
		width: 27px;
		height: 27px;
		background-size: contain;
		margin: 0 4px;
	}

	.filler {
		flex: 1;
	}

	.window {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		background-color: ${modules.core.bootMode == "safe" ? "rgb(240, 240, 240)" : "rgba(240, 240, 240, 0.5)"};
		border: 1px solid #ccc;
		box-shadow: ${modules.core.bootMode == "safe" ? "none" : "0 0 5px rgba(0, 0, 0, 0.3)"};
		z-index: 1;
		resize: both;
		width: 320px;
		height: 180px;
		display: flex;
		flex-direction: column;
		overflow: auto;
		backdrop-filter: ${modules.core.bootMode == "safe" ? "none" : "blur(8px)"};
		animation: ${modules.core.bootMode == "safe" ? "none" : "fade-in 0.1s ease-in forwards"};
		border-radius: 4px;
	}


	.window.icon {
		top: 72px;
		left: 72px;
		resize: none;
		width: 128px;
		height: 128px;
	}

	.window.dark {
		background-color: ${modules.core.bootMode == "safe" ? "rgb(55, 55, 55)" : "rgba(55, 55, 55, 0.5)"};
		color: white;
		border: 1px solid #1b1b1b;
	}

	.window .title-bar {
		padding: 6px;
		background-color: ${modules.core.bootMode == "safe" ? "rgb(204, 204, 204)" : "rgba(204, 204, 204, 0.5)"};
		cursor: move;
		display: flex;
		flex: 1;
		user-select: none;
	}

	.window.dark .title-bar {
		background-color: ${modules.core.bootMode == "safe" ? "rgb(27, 27, 27)" : "rgba(27, 27, 27, 0.5)"};
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
		box-shadow: none;
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
		animation: ${modules.core.bootMode == "safe" ? "none" : "fade-in 0.1s ease-in forwards"};
	}

	.session.secure {
		background: none${modules.core.bootMode == "safe" ? " !important" : ""};
		backdrop-filter: ${modules.core.bootMode == "safe" ? "none" : "blur(8px) brightness(50%)"};
		animation: ${modules.core.bootMode == "safe" ? "none" : "fade 0.1s ease-out forwards"};
	}

	.hidden {
		display: none;
	}
	
	@keyframes fade-in {
		0% {
			opacity: 0;
		}

		100% {
			opacity: 1;
		}
	}

	@keyframes fade {
		0% {
			backdrop-filter: blur(0px) brightness(100%);
		}

		100% {
			backdrop-filter: blur(8px) brightness(50%);
		}
	}`;
	document.head.appendChild(uiStyle);

	function createWindow(sessionId, makeFullscreenOnAllScreens, asIconWindow, reportMovement) {
		let fullscreen = makeFullscreenOnAllScreens || matchMedia("(max-width: 600px)").matches;
		if (asIconWindow) fullscreen = false;
		let id = crypto.getRandomValues(new Uint8Array(64)).reduce((a, b) => a + b.toString(16).padStart(2, "0"), "");
		let windowDiv = document.createElement('div');
		windowDiv.className = 'window ' + (fullscreen ? "fullscreen " : "") + " " + (asIconWindow ? "icon" : "");
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
		if (!fullscreen && !asIconWindow) {
			let fullscreenButton = document.createElement('button');
			fullscreenButton.className = 'button';
			fullscreenButton.innerHTML = '&#x25a1;';
			fullscreenButton.onclick = function() {
				windowDiv.classList.toggle("fullscreen");
			}
			titleBar.appendChild(fullscreenButton);
		}
		if (!asIconWindow) titleBar.appendChild(closeButton);
		windowDiv.appendChild(titleBar);
		let content = document.createElement('div');
		content.className = 'content';
		windowDiv.appendChild(content);
		session.tracker[sessionId].html.appendChild(windowDiv);
		if (!fullscreen) makeDraggable(windowDiv, titleBar, reportMovement);
		return {
			windowDiv,
			title,
			closeButton,
			content,
			sessionId
		};
	}

	function makeDraggable(windowDiv, titleBar, reportMovement) {
		let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

		titleBar.onmousedown = dragMouseDown;
		titleBar.ontouchstart = dragMouseDown;

		function dragMouseDown(e) {
			if (e.type != "touchstart") e.preventDefault();
			if (e.type == "touchstart") e = e.touches[0];
			pos3 = e.clientX;
			pos4 = e.clientY;

			document.onmouseup = closeDragElement;
			document.ontouchend = closeDragElement;
			document.ontouchcancel = closeDragElement;
			document.onmousemove = elementDrag;
			document.ontouchmove = elementDrag;
		}

		function elementDrag(e) {
			e.preventDefault();
			if (e.type == "touchmove") e = e.touches[0];
			pos1 = pos3 - e.clientX;
			pos2 = pos4 - e.clientY;
			pos3 = e.clientX;
			pos4 = e.clientY;

			if (!windowDiv.classList.contains("fullscreen")) {
				if (reportMovement) reportMovement(windowDiv.offsetLeft - pos1, windowDiv.offsetTop - pos2);
				windowDiv.style.top = windowDiv.offsetTop - pos2 + 'px';
				windowDiv.style.left = windowDiv.offsetLeft - pos1 + 'px';
			}
		}

		function closeDragElement() {
			document.onmouseup = null;
			document.ontouchend = null;
			document.ontouchcancel = null;
			document.onmousemove = null;
			document.ontouchmove = null;
		}
	}

	let session = {
		mksession: function() {
			if (modules.shuttingDown) throw new Error("SYSTEM_SHUTDOWN_REQUESTED");
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
		destroy: function() {
			for (let session in this.tracker) this.rmsession(session);
			this.tracker = {};
			delete this.systemSession;
			delete modules.liu;
			delete modules.serviceSession;
			uiStyle.remove();
			delete modules.uiStyle;
		},
		tracker: {},
		active: null
	}

	modules.window = createWindow;
	modules.session = session;
	modules.uiStyle = uiStyle;

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
// modules/.../boot/04-ipc.js
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
// modules/.../boot/04-websockets.js
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
// modules/.../boot/05-lull.js
function loadLull() {
	let lullSession;
	modules.lull = function() {
		if (lullSession) return;
		let style = document.createElement("style");
		style.innerHTML = `* { cursor: none !important; };`;
		document.head.appendChild(style);
		lullSession = modules.session.mksession();
		modules.session.muteAllSessions();
		modules.session.activateSession(lullSession);
		function wake() {
			removeEventListener("mousemove", wake);
			removeEventListener("click", wake);
			removeEventListener("keydown", wake);
			style.remove();
			modules.session.muteAllSessions();
			modules.session.activateSession(modules.session.systemSession);
			modules.session.rmsession(lullSession);
			lullSession = null;
		}
		addEventListener("mousemove", wake);
		addEventListener("click", wake);
		addEventListener("keydown", wake);
	}
}
loadLull();
// modules/.../boot/05-network.js
async function networkd() {
	let hexToU8A = (hex) => Uint8Array.from(hex.match(/.{1,2}/g).map(a => parseInt(a, 16)));
	let u8aToHex = (u8a) => Array.from(u8a).map(a => a.toString(16).padStart(2, "0")).join("");
	modules.network = { connected: false, address: null, ws: null, runOnClose: Promise.resolve(), _runOnClose: _ => 1 };
	try {
		let config = await modules.fs.read(modules.defaultSystem + "/etc/network.json");
		config = JSON.parse(config);
		function isPacketFiltered(packet) {
			if (!config.filters) return false;
			for (let filter of config.filters) {
				if (filter.type == 0) return filter.result;
				if (filter.type == 1 && isPacketFrom(packet, filter)) return filter.result;
				if (filter.type == 2 && filter.protocol == packet.data.type) return filter.result;
				if (filter.type == 3 && isPacketFrom(packet, filter) && filter.protocol == packet.data.type) return filter.result;
				if (filter.type == 4 && isPacketFrom(packet, filter) &&
					(packet.data.type == "connectionful" || packet.data.type == "connectionless")) {
						if (packet.data.gate == filter.gate) return filter.result;
					}
			}
			return true;
		}
		function isPacketFrom(packet, filter) {
			if (filter.from == packet.from) return true;
			if (filter.ipHash == packet.from.slice(0, 8)) return true;
			if (filter.systemID == packet.from.slice(8, 24)) return true;
			return false;
		}
		modules.network.reloadConfig = async function() {
			config = JSON.parse(await modules.fs.read(modules.defaultSystem + "/etc/network.json"));
			modules.network.updates = config.updates;
			try {
				ws.send(JSON.stringify({
					finalProxyPacket: true
				}));
				ws.close();
			} catch {
				onclose();
			}
		}
		modules.network.updates = config.updates;
		let stage = 0;
		let pukey = (modules.core.prefs.read("system_id") || {}).public;
		let importedKey = await crypto.subtle.importKey("jwk", (modules.core.prefs.read("system_id") || {}).private, {
			name: "ECDSA",
			namedCurve: "P-256"
		}, true, ["sign"]);
		let ws = new WebSocket(config.url);
		let handle = Array.from(crypto.getRandomValues(new Uint8Array(64))).reduce((a, b) => a + b.toString(16).padStart(2, "0"), "");
		modules.network.runOnClose = new Promise(a => modules.network._runOnClose = a);
		ws.binaryType = "arraybuffer";
		async function onclose() {
			modules.network.connected = false;
			modules.network.address = null;
			modules.network.hostname = null;
			modules.network._runOnClose();
			ws = new WebSocket(config.url);
			stage = 0;
			ws.onmessage = onmessage;
			ws.onclose = onclose;
			modules.network.runOnClose = new Promise(a => modules.network._runOnClose = a);
		}
		async function onmessage(e) {
			let messageData;
			try {
				messageData = JSON.parse(e.data);
			} catch {
				return;
			}
			if (stage == 0) {
				ws.send(JSON.stringify({ ...pukey, forceConnect: true, userCustomizable: config.ucBits, hostname: config.hostname }));
				stage++;
			} else if (stage == 1) {
				if (messageData.event != "SignatureRequest") {
					ws.onclose = null;
					delete modules.websocket._handles[handle];
					return ws.close();
				}
				ws.send(u8aToHex(new Uint8Array(await crypto.subtle.sign({
					name: "ECDSA",
					hash: {
						name: "SHA-256"
					}
				}, importedKey, hexToU8A(messageData.signBytes)))));
				stage++;
			} else if (stage == 2) {
				if (messageData.event != "ConnectionEstablished") {
					ws.onclose = null;
					delete modules.websocket._handles[handle];
					return ws.close();
				}
				modules.websocket._handles[handle] = {
					ws: ws,
					acl: {
						owner: handle.slice(0, 16),
						group: handle.slice(0, 16),
						world: true
					}
				}
				modules.network.connected = true;
				modules.network.address = messageData.address;
				modules.network.hostname = messageData.hostname;
				modules.network.ws = handle;
				stage++;
			} else if (stage == 3) {
				if (messageData.event == "DisconnectionComplete") {
					modules.network.connected = false;
					modules.network.address = null;
					modules.network.hostname = null;
					modules.network.ws = null;
					modules.network._runOnClose();
					ws.onclose = null;
					delete modules.websocket._handles[handle];
					return ws.close();
				}
				if (messageData.from) {
					if (isPacketFiltered(messageData)) {
						e.stopImmediatePropagation();
						e.preventDefault();
						return false;
					}
					if (messageData.data.type == "ping") {
						if (typeof messageData.data.resend !== "string") return;
						if (messageData.data.resend.length > 64) return;
						ws.send(JSON.stringify({ receiver: messageData.from, data: { type: "pong", resend: messageData.data.resend } }));
					}
				}
			}
		}
		ws.onmessage = onmessage;
		ws.onclose = onclose;
	} catch {
		modules.network.serviceStopped = true;
		modules.core.tty_bios_api.println("network: not starting network");
	}
}
networkd();
// modules/.../boot/05-reeapis.js
function reeAPIs() {
	// @pcos-app-mode native

	async function denyUnmanifested(list, token) {
		let privileges = (await modules.tokens.info(token)).privileges;
		let isAllowlist = list.some(a => a.lineType == "allow");
		if (isAllowlist) list = list.filter(a => a.lineType == "allow");
		let disallowedRegistry = [];
		for (let privilege of privileges) {
			if ((!list.some(x => x.data == privilege && x.lineType == "allow") && isAllowlist) || list.some(x => x.data == privilege && x.lineType == "deny")) {
				privileges = privileges.filter(x => x != privilege);
				disallowedRegistry.push(privilege);
			}
		}
		modules.tokens.removePrivileges(token, disallowedRegistry);
		return privileges;
	}

	modules.reeAPIInstance = async function(opts) {
		let {ree, ses, token, taskId, limitations, privateData} = opts;
		let processToken = token;
		let tokenInfo = await modules.tokens.info(token);
		let user = tokenInfo.user;
		let groups = tokenInfo.groups || [];
		let privileges = tokenInfo.privileges;
		let processPipes = [];
		let websockets = [];
		let automatedLogonSessions = {};
		let networkListens = {};
		let connections = {};
		let language = modules.session.attrib(ses, "language") || undefined;
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
				if (e.name == "Error") throw e;
				throw new Error("FS_ACTION_FAILED");
			}
		}
		async function recursiveKeyVerify(key, khrl) {
			if (!key) throw new Error("NO_KEY");
			let u8aToHex = (u8a) => Array.from(u8a).map(a => a.toString(16).padStart(2, "0")).join("");
			let hash = u8aToHex(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode((key.keyInfo?.key || key.key).x + "|" + (key.keyInfo?.key || key.key).y))));
			let hexToU8A = (hex) => Uint8Array.from(hex.match(/.{1,2}/g).map(a => parseInt(a, 16)));
			if (khrl.includes(hash)) throw new Error("KEY_REVOKED");
			let signedByKey = modules.ksk_imported;
			if (key.keyInfo && key.keyInfo?.signedBy) {
				signedByKey = JSON.parse(await modules.fs.read(modules.defaultSystem + "/etc/keys/" + key.keyInfo.signedBy, token));
				if (!signedByKey.keyInfo) throw new Error("NOT_KEYS_V2");
				if (!signedByKey.keyInfo.usages.includes("keyTrust")) throw new Error("NOT_KEY_AUTHORITY");
				await recursiveKeyVerify(signedByKey, khrl);
				signedByKey = await crypto.subtle.importKey("jwk", signedByKey.keyInfo.key, {
					name: "ECDSA",
					namedCurve: "P-256"
				}, false, ["verify"]);
			}
			if (!await crypto.subtle.verify({
				name: "ECDSA",
				hash: {
					name: "SHA-256"
				}
			}, signedByKey, hexToU8A(key.signature), new TextEncoder().encode(JSON.stringify(key.key || key.keyInfo)))) throw new Error("KEY_SIGNATURE_VERIFICATION_FAILED");
			return true;
		}

		ree.beforeCloseDown(async function() {
			for (let processPipe of processPipes) delete modules.ipc._ipc[processPipe];
			for (let connection in connections) try { networkListens[connections[connection].networkListenID].ws.send(JSON.stringify({
				receiver: connections[connection].from,
				data: {
					type: "connectionful",
					action: "drop",
					connectionID: connection.slice(0, -7),
					gate: connections[connection].gateIfNeeded
				}
			})); } catch {}
			for (let networkListen in networkListens) networkListens[networkListen].ws.removeEventListener("message", networkListens[networkListen].fn);
			for (let websocket of websockets) modules.websocket.close(websocket);
			await modules.tokens.revoke(token);
			for (let i in modules.csps) if (modules.csps[i].hasOwnProperty("removeSameGroupKeys")) modules.csps[i].removeSameGroupKeys(null, taskId);
		});
		let apis = {
			private: {
				setUser: async function(newUser) {
					user = newUser;
					groups = (await modules.users.getUserInfo(newUser, false, token || processToken)).groups || [];
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
				rmPrivileges: async function(privilegesRemoved) {
					privileges = privileges.filter(x => !privilegesRemoved.includes(x));
					await modules.tokens.removePrivileges(token, privilegesRemoved);
					return true;
				},
				switchUser: async function(desiredUser) {
					if (!privileges.includes("SWITCH_USERS_AUTOMATICALLY")) throw new Error("UNAUTHORIZED_ACTION");
					await modules.tokens.halfInitialize(token, desiredUser);
					let tokenInfo = await modules.tokens.info(token);
					user = tokenInfo.user;
					groups = tokenInfo.groups || [];
					return true;
				},
				shutdown: async function(arg) {
					let {isKexec, isReboot, force, token} = arg;
					if (!privileges.includes("SYSTEM_SHUTDOWN")) throw new Error("UNAUTHORIZED_ACTION");
					if (force) {
						try { modules.websocket._handles[modules.network.ws].ws.close(); } catch {}
						modules.session.destroy();
						if (isReboot) return location.reload();
						return modules.killSystem();
					}
					await modules.restart(!isReboot, token || processToken, isKexec);
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
					privileges = await denyUnmanifested(limitations, token);
					return true;
				},
				getVersion: function() {
					if (!privileges.includes("GET_BUILD")) throw new Error("UNAUTHORIZED_ACTION");
					return modules.pcos_version;
				},
				locale: function() {
					if (!privileges.includes("GET_LOCALE")) throw new Error("UNAUTHORIZED_ACTION");
					return language || navigator.languages[0].split("-")[0].toLowerCase();
				},
				osLocale: function() {
					if (!privileges.includes("GET_LOCALE")) throw new Error("UNAUTHORIZED_ACTION");
					return modules.locales.get("OS_LOCALE", language);
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
					modules.session.attrib(ses, "secureID", secureSession);
					modules.session.attrib(secureSession, "language", language);

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

					try {
						let logonUI = await modules.authui(secureSession, desiredUser);
						return new Promise(function(resolve) {
							logonUI.hook(async function(result) {
								releaseLock();
								modules.session.attrib(ses, "secureLock", null);
								modules.session.attrib(ses, "secureID", null);
								modules.session.muteAllSessions();
								modules.session.rmsession(secureSession);
								modules.session.activateSession(ses);
								if (result.success == false) return resolve(false);
								return resolve(result.token);
							});
						});
					} catch (e) {
						console.error("authui:", e);
						releaseLock();
						modules.session.attrib(ses, "secureLock", null);
						modules.session.attrib(ses, "secureID", null);
						modules.session.muteAllSessions();
						modules.session.rmsession(secureSession);
						modules.session.activateSession(ses);
						return false;
					}
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
					let {token} = arg;
					if (!privileges.includes("MANAGE_TOKENS")) throw new Error("UNAUTHORIZED_ACTION");
					await modules.tokens.removePrivileges(token, arg.privileges);
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
					return modules.locales.get(key, language);
				},
				lookupOtherLocale: function(arg) {
					let {key, locale} = arg;   
					if (!privileges.includes("GET_LOCALE")) throw new Error("UNAUTHORIZED_ACTION");
					return modules.locales.get(key, locale);
				},
				ufTimeInc: function(args) {
					if (!privileges.includes("GET_LOCALE")) throw new Error("UNAUTHORIZED_ACTION");
					return modules.userfriendliness.inconsiderateTime(language, ...args);
				},
				ufInfoUnits: function(args) {
					if (!privileges.includes("GET_LOCALE")) throw new Error("UNAUTHORIZED_ACTION");
					return modules.userfriendliness.informationUnits(language, ...args)
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
				ufTimeCon: function(args) {
					if (!privileges.includes("GET_LOCALE")) throw new Error("UNAUTHORIZED_ACTION");
					return modules.userfriendliness.considerateTime(language, ...args);
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
					await modules.core.idb.writePart(arg.key, arg.value);
				},
				lldaIDBRemove: async function(arg) {
					if (!privileges.includes("LLDISK_IDB_REMOVE")) throw new Error("UNAUTHORIZED_ACTION");
					await modules.core.idb.removePart(arg.key);
				},
				lldaIDBList: async function() {
					if (!privileges.includes("LLDISK_IDB_LIST")) throw new Error("UNAUTHORIZED_ACTION"); 
					return modules.core.idb.listParts(); 
				},
				lldaIDBSync: async function() {
					if (!privileges.includes("LLDISK_IDB_SYNC")) throw new Error("UNAUTHORIZED_ACTION");
					await modules.core.idb.sync();
				},
				fs_mount: async function(arg) {
					if (!privileges.includes("FS_MOUNT")) throw new Error("UNAUTHORIZED_ACTION");
					if (modules.fs.mounts[arg.mountpoint]) throw new Error("MOUNT_EXISTS");
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
					modules.session.attrib(ses, "secureID", secureSession);
					modules.session.attrib(secureSession, "language", language);

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

					try {
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
								modules.session.attrib(ses, "secureID", null);
								modules.session.muteAllSessions();
								modules.session.rmsession(secureSession);
								modules.session.activateSession(ses);
								if (result.success == false) return resolve(false);
								return resolve(result.token);
							});
						});
					} catch (e) {
						console.error("consentui:", e);
						releaseLock();
						modules.session.attrib(ses, "secureLock", null);
						modules.session.attrib(ses, "secureID", null);
						modules.session.muteAllSessions();
						modules.session.rmsession(secureSession);
						modules.session.activateSession(ses);
						return false;
					}
				},
				networkPing: async function(address) {
					if (!privileges.includes("PCOS_NETWORK_PING")) throw new Error("UNAUTHORIZED_ACTION");
					let websocketHandle = modules.network.ws;
					if (!websocketHandle) throw new Error("NETWORK_UNREACHABLE");
					let websocket = modules.websocket._handles[websocketHandle].ws;
					if (websocket.readyState != 1) throw new Error("NETWORK_UNREACHABLE");
					return Promise.race([ new Promise(async function(resolve, reject) {
						let networkListenID = Array.from(crypto.getRandomValues(new Uint8Array(64))).map(a => a.toString(16).padStart(2, "0")).join("");
						let packetId = Array.from(crypto.getRandomValues(new Uint8Array(32))).map(a => a.toString(16).padStart(2, "0")).join("");
						let resend = Array.from(crypto.getRandomValues(new Uint8Array(32))).map(a => a.toString(16).padStart(2, "0")).join("");
						function eventListener(e) {
							try {
								let packet = JSON.parse(e.data);
								if (packet.packetID == packetId && packet.event == "AddressUnreachable") {
									reject(new Error("ADDRESS_UNREACHABLE"));
									delete networkListens[networkListenID];
									websocket.removeEventListener("message", eventListener);
								}
								if (packet.from == address && packet.data.type == "pong" && packet.data.resend == resend) {
									resolve("success");
									delete networkListens[networkListenID];
									websocket.removeEventListener("message", eventListener);
								}
							} catch {}
						}
						networkListens[networkListenID] = { ws: websocket, fn: eventListener };
						websocket.addEventListener("message", eventListener);
						websocket.send(JSON.stringify({
							receiver: address,
							data: {
								type: "ping",
								resend: resend
							},
							id: packetId
						}))
					}), new Promise((_, reject) => modules.network.runOnClose.then(_ => reject(new Error("NETWORK_CLOSED")))) ]);
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
				getPrivateData: () => privateData,
				lull: async function() {
					if (!privileges.includes("LULL_SYSTEM")) throw new Error("UNAUTHORIZED_ACTION");
					if (modules.session.active != ses && !privileges.includes("LULL_SYSTEM_FORCE")) throw new Error("UNAUTHORIZED_ACTION");
					await modules.lull();
				},
				connlessListen: async function(gate) {
					if (!privileges.includes("CONNLESS_LISTEN")) throw new Error("UNAUTHORIZED_ACTION");
					if (!gate.startsWith("user_") && !privileges.includes("CONNLESS_LISTEN_GLOBAL")) throw new Error("UNAUTHORIZED_ACTION");
					let websocketHandle = modules.network.ws;
					if (!websocketHandle) throw new Error("NETWORK_UNREACHABLE");
					let websocket = modules.websocket._handles[websocketHandle].ws;
					if (websocket.readyState != 1) throw new Error("NETWORK_UNREACHABLE");
					return Promise.race([ new Promise(async function(resolve) {
						let networkListenID = Array.from(crypto.getRandomValues(new Uint8Array(64))).map(a => a.toString(16).padStart(2, "0")).join("");
						function eventListener(e) {
							try {
								let packet = JSON.parse(e.data);
								if (packet.data.type == "connectionless" && packet.data.gate == gate) {
									websocket.removeEventListener("message", eventListener);
									delete networkListens[networkListenID];
									resolve(packet);
								}
							} catch {}
						}
						networkListens[networkListenID] = { ws: websocket, fn: eventListener };
						websocket.addEventListener("message", eventListener);
					}), new Promise((_, reject) => modules.network.runOnClose.then(_ => reject(new Error("NETWORK_CLOSED")))) ]);
				},
				connlessSend: async function(sendOpts) {
					if (!privileges.includes("CONNLESS_SEND")) throw new Error("UNAUTHORIZED_ACTION");
					let websocketHandle = modules.network.ws;
					if (!websocketHandle) throw new Error("NETWORK_UNREACHABLE");
					let websocket = modules.websocket._handles[websocketHandle].ws;
					if (websocket.readyState != 1) throw new Error("NETWORK_UNREACHABLE");
					let { gate, address, content } = sendOpts;
					let packetId = Array.from(crypto.getRandomValues(new Uint8Array(32))).map(a => a.toString(16).padStart(2, "0")).join("");
					websocket.send(JSON.stringify({
						receiver: address,
						data: {
							type: "connectionless",
							gate: gate,
							content: content
						},
						id: packetId
					}));
					return Promise.race([ new Promise(async function(resolve, reject) {
						let networkListenID = Array.from(crypto.getRandomValues(new Uint8Array(64))).map(a => a.toString(16).padStart(2, "0")).join("");
						function eventListener(e) {
							try {
								let packet = JSON.parse(e.data);
								if (packet.from) return;
								if (packet.packetID == packetId) {
									websocket.removeEventListener("message", eventListener);
									delete networkListens[networkListenID];
									if (packet.event == "PacketPong") return resolve("success");
									reject(new Error("ADDRESS_UNREACHABLE"));
								}
							} catch {}
						}
						networkListens[networkListenID] = { ws: websocket, fn: eventListener };
						websocket.addEventListener("message", eventListener);
					}), new Promise((_, reject) => modules.network.runOnClose.then(_ => reject(new Error("NETWORK_CLOSED")))) ]);
				},
				getUsers: async function(token) {
					if (!privileges.includes("GET_USER_LIST")) throw new Error("UNAUTHORIZED_ACTION");
					return await modules.users.getUsers(token || processToken);
				},
				getNetworkAddress: async function() {
					if (!privileges.includes("GET_NETWORK_ADDRESS")) throw new Error("UNAUTHORIZED_ACTION");
					return modules.network.address;
				},
				connfulListen: async function(listenOpts) {
					if (!privileges.includes("CONNFUL_LISTEN")) throw new Error("UNAUTHORIZED_ACTION");
					let {gate, key, private, verifyClientKeyChain} = listenOpts;
					if (!gate.startsWith("user_") && !privileges.includes("CONNFUL_LISTEN_GLOBAL")) throw new Error("UNAUTHORIZED_ACTION");
					let websocketHandle = modules.network.ws;
					if (!websocketHandle) throw new Error("NETWORK_UNREACHABLE");
					let websocket = modules.websocket._handles[websocketHandle].ws;
					if (websocket.readyState != 1) throw new Error("NETWORK_UNREACHABLE");
					let networkListenID = Array.from(crypto.getRandomValues(new Uint8Array(64))).map(a => a.toString(16).padStart(2, "0")).join("");
					let usableKey = await crypto.subtle.importKey("jwk", private, {name: "ECDSA", namedCurve: "P-256"}, true, ["sign"]);
					let hexToU8A = (hex) => Uint8Array.from(hex.match(/.{1,2}/g).map(a => parseInt(a, 16)));
					let u8aToHex = (u8a) => Array.from(u8a).map(a => a.toString(16).padStart(2, "0")).join("");
					let _connectionBufferPromise = null;
					let _connectionBufferReject = null;
					let connectionBufferPromise = new Promise((r, j) => [_connectionBufferPromise, _connectionBufferReject] = [r, j]);
					async function eventListener(e) {
						try {
							let packet = JSON.parse(e.data);
							if (!packet.from) return;
							if (packet.data.type == "connectionful" && packet.data.gate == gate && packet.data.action == "start") {
								if (!packet.data.connectionID) return;
								if (connections[packet.data.connectionID + ":server"]) return;
								let ephemeralKey = await crypto.subtle.generateKey({name: "ECDH", namedCurve: "P-256"}, true, ["deriveBits"]);
								let exported = await crypto.subtle.exportKey("jwk", ephemeralKey.publicKey);
								exported = {signedBy: "serverKey", usages: ["connfulSecureEphemeral"], key:exported};
								let signature = u8aToHex(new Uint8Array(await crypto.subtle.sign({
									name: "ECDSA",
									hash: "SHA-256"
								}, usableKey, new TextEncoder().encode(JSON.stringify(exported)))));
								let theirUsableKey = await crypto.subtle.importKey("jwk", packet.data.content.keyInfo.key, {
									name: "ECDH",
									namedCurve: "P-256"
								}, true, []);
								let joinedKeys = await crypto.subtle.deriveBits({ name: "ECDH", public: theirUsableKey }, ephemeralKey.privateKey, 256);
								let aesUsableKey = await crypto.subtle.importKey("raw", joinedKeys, {name: "AES-GCM"}, true, ["encrypt", "decrypt"]);
								let _dataBufferPromise = null, _rejectDataPromise = null;
								let dataBufferPromise = new Promise((r, j) => [_dataBufferPromise, _rejectDataPromise] = [r, j]);
								connections[packet.data.connectionID + ":server"] = {
									ourKey: ephemeralKey,
									from: packet.from,
									theirMainKeyReceived: false,
									theirKeyRaw: packet.data.content,
									aesUsableKey,
									dataBuffer: [],
									dataBufferPromise,
									_dataBufferPromise,
									_rejectDataPromise,
									networkListenID
								}

								websocket.send(JSON.stringify({
									receiver: packet.from,
									data: {
										type: "connectionful",
										action: "start",
										content: {
											keyInfo: exported,
											signature
										},
										connectionID: packet.data.connectionID
									}
								}));
							} else if (packet.data.type == "connectionful" && packet.data.gate == gate && packet.data.action == "xchange") {
								if (!packet.data.connectionID) return;
								if (!connections.hasOwnProperty(packet.data.connectionID + ":server")) return;
								if (connections[packet.data.connectionID + ":server"].theirMainKeyReceived) return;
								if (connections[packet.data.connectionID + ":server"].dying) return;
								let theirMainKeyDecrypt = JSON.parse(new TextDecoder().decode(await crypto.subtle.decrypt({
									name: "AES-GCM",
									iv: hexToU8A(packet.data.content.iv),
								}, connections[packet.data.connectionID + ":server"].aesUsableKey, hexToU8A(packet.data.content.ct))));
								let usableMainKey = await crypto.subtle.importKey("jwk", theirMainKeyDecrypt.keyInfo.key, {
									name: "ECDSA",
									namedCurve: "P-256"
								}, true, ["verify"]);
								let verifyKeySignature = await crypto.subtle.verify({
									name: "ECDSA",
									hash: "SHA-256"
								}, usableMainKey, hexToU8A(connections[packet.data.connectionID + ":server"].theirKeyRaw.signature), new TextEncoder().encode(JSON.stringify(connections[packet.data.connectionID + ":server"].theirKeyRaw.keyInfo)));
								if (verifyClientKeyChain && verifyKeySignature) {
									verifyKeySignature = false;
									try {
										let khrlFiles = await modules.fs.ls(modules.defaultSystem + "/etc/keys/khrl", processToken);
										let khrlSignatures = [];
										for (let khrlFile of khrlFiles) {
											let khrl = JSON.parse(await modules.fs.read(modules.defaultSystem + "/etc/keys/khrl/" + khrlFile, processToken));
											let khrlSignature = khrl.signature;
											delete khrl.signature;
											if (await crypto.subtle.verify({
												name: "ECDSA",
												hash: {
													name: "SHA-256"
												}
											}, modules.ksk_imported, hexToU8A(khrlSignature), new TextEncoder().encode(JSON.stringify(khrl.list)))) {
												khrlSignatures.push(...khrl.list);
											}
										}
										verifyKeySignature = await recursiveKeyVerify(theirMainKeyDecrypt, khrlSignatures);
									} catch {}
								}
								if (!verifyKeySignature || !theirMainKeyDecrypt.keyInfo.usages.includes("connfulSecureClient:" + packet.from)) {
									delete connections[packet.data.connectionID + ":server"];
									websocket.send(JSON.stringify({
										receiver: packet.from,
										data: {
											type: "connectionful",
											action: "drop",
											connectionID: packet.data.connectionID
										}
									}));
									return;
								}
								connections[packet.data.connectionID + ":server"].theirMainKeyReceived = theirMainKeyDecrypt;
								let iv = crypto.getRandomValues(new Uint8Array(16));
								websocket.send(JSON.stringify({
									receiver: packet.from,
									data: {
										type: "connectionful",
										action: "xchange",
										content: {
											iv: u8aToHex(iv),
											ct: u8aToHex(new Uint8Array(await crypto.subtle.encrypt({
												name: "AES-GCM",
												iv
											}, connections[packet.data.connectionID + ":server"].aesUsableKey, new TextEncoder().encode(JSON.stringify(key)))))
										},
										connectionID: packet.data.connectionID
									}
								}));
							} else if (packet.data.type == "connectionful" && packet.data.gate == gate && packet.data.action == "drop") {
								if (!packet.data.connectionID) return;
								if (!connections.hasOwnProperty(packet.data.connectionID + ":server")) return;
								if (connections[packet.data.connectionID + ":server"].dying) return;
								websocket.send(JSON.stringify({
									receiver: packet.from,
									data: {
										type: "connectionful",
										action: "drop",
										connectionID: packet.data.connectionID
									}
								}));
								if (connections[packet.data.connectionID + ":server"]._rejectDataPromise)
									connections[packet.data.connectionID + ":server"]._rejectDataPromise(new Error("CONNECTION_DROPPED"));
								connections[packet.data.connectionID + ":server"].dying = true;
								if (!connections[packet.data.connectionID + ":server"].dataBuffer.length)
									delete connections[packet.data.connectionID + ":server"];
							} else if (packet.data.type == "connectionful" && packet.data.gate == gate && packet.data.action == "nice2meetu") {
								if (!packet.data.connectionID) return;
								if (!connections.hasOwnProperty(packet.data.connectionID + ":server")) return;
								if (!connections[packet.data.connectionID + ":server"].theirMainKeyReceived) return;
								if (!connections[packet.data.connectionID + ":server"].aesUsableKey) return;
								if (connections[packet.data.connectionID + ":server"].dying) return;
								networkListens[networkListenID].connectionBuffer.push(packet.data.connectionID + ":server");
								let _curcbp = _connectionBufferPromise;
								connectionBufferPromise = new Promise((r, j) => [_connectionBufferPromise, _connectionBufferReject] = [r, j]);
								networkListens[networkListenID].connectionBufferPromise = connectionBufferPromise;
								_curcbp();
							} else if (packet.data.type == "connectionful" && packet.data.gate == gate && packet.data.action == "data") {
								if (!packet.data.connectionID) return;
								if (!connections.hasOwnProperty(packet.data.connectionID + ":server")) return;
								if (!connections[packet.data.connectionID + ":server"].aesUsableKey) return;
								if (!connections[packet.data.connectionID + ":server"].theirMainKeyReceived) return;
								if (connections[packet.data.connectionID + ":server"].dying) return;
								if (connections[packet.data.connectionID + ":server"].writingLock) await connections[packet.data.connectionID + ":server"].writingLock;
								let writingLockRelease;
								let writingLock = new Promise(r => writingLockRelease = r);
								connections[packet.data.connectionID + ":server"].writingLock = writingLock;
								connections[packet.data.connectionID + ":server"].dataBuffer.push(new TextDecoder().decode(await crypto.subtle.decrypt({
									name: "AES-GCM",
									iv: hexToU8A(packet.data.content.iv)
								}, connections[packet.data.connectionID + ":server"].aesUsableKey, hexToU8A(packet.data.content.ct))));
								if (!(connections[connID + ":server"].dataBuffer.length - 1)) {
									let _curdbp = connections[packet.data.connectionID + ":server"].dataBufferPromise;
									let _dataBufferPromise = null, _rejectDataPromise = null;
									let dataBufferPromise = new Promise((r, e) => [_dataBufferPromise, _rejectDataPromise] = [r, e]);
									connections[packet.data.connectionID + ":server"].dataBufferPromise = dataBufferPromise;
									connections[packet.data.connectionID + ":server"]._dataBufferPromise = _dataBufferPromise;
									connections[packet.data.connectionID + ":server"]._rejectDataPromise = _rejectDataPromise;
									_curdbp();
								}
								writingLockRelease();
							}
						} catch {}
					}
					networkListens[networkListenID] = { ws: websocket, gate: gate, fn: eventListener, connectionBuffer: [], connectionBufferPromise }
					modules.network.runOnClose.then(function() {
						for (let connectionID in connections) if (connections[connectionID].networkListenID == networkListenID) {
							connections[connectionID].dying = true;
							connections[connectionID]._rejectDataPromise(new Error("NETWORK_CLOSED"));
							if (!connections[connectionID].dataBuffer.length) delete connections[connectionID];
						}
						delete networkListens[networkListenID];
						_connectionBufferReject(new Error("NETWORK_CLOSED"));
					});
					websocket.addEventListener("message", eventListener);
					return networkListenID;
				},
				connfulListenConnections: async function(networkListenID) {
					if (!privileges.includes("CONNFUL_LISTEN")) throw new Error("UNAUTHORIZED_ACTION");
					if (!networkListens.hasOwnProperty(networkListenID)) throw new Error("INVALID_LISTEN_ID");
					if (!networkListens[networkListenID].connectionBuffer.length) await networkListens[networkListenID].connectionBufferPromise;
					let connectionID = networkListens[networkListenID].connectionBuffer[0];
					networkListens[networkListenID].connectionBuffer = networkListens[networkListenID].connectionBuffer.slice(1);
					return connectionID;
				},
				getBuildTime: function() {
					if (!privileges.includes("GET_BUILD")) throw new Error("UNAUTHORIZED_ACTION");
					return modules.build_time;
				},
				connfulConnect: async function(connOpts) {
					if (!privileges.includes("CONNFUL_CONNECT")) throw new Error("UNAUTHORIZED_ACTION");
					let {address, gate, key, private, doNotVerifyServer, verifyByDomain} = connOpts;
					let websocketHandle = modules.network.ws;
					if (!websocketHandle) throw new Error("NETWORK_UNREACHABLE");
					let websocket = modules.websocket._handles[websocketHandle].ws;
					if (websocket.readyState != 1) throw new Error("NETWORK_UNREACHABLE");
					let networkListenID = Array.from(crypto.getRandomValues(new Uint8Array(64))).map(a => a.toString(16).padStart(2, "0")).join("");
					let connID = crypto.getRandomValues(new Uint8Array(64)).reduce((a, b) => a + b.toString(16).padStart(2, "0"), "");
					let hexToU8A = (hex) => Uint8Array.from(hex.match(/.{1,2}/g).map(a => parseInt(a, 16)));
					let u8aToHex = (u8a) => Array.from(u8a).map(a => a.toString(16).padStart(2, "0")).join("");
					let newKeyKA, exportedKA;
					if (!key && !private) {
						newKeyKA = await crypto.subtle.generateKey({name: "ECDSA", namedCurve: "P-256"}, true, ["sign", "verify"]);
						exportedKA = await crypto.subtle.exportKey("jwk", newKeyKA.publicKey);
						exportedKA = { keyInfo: { usages: ["connfulSecureClient:" + modules.network.address], key: exportedKA }, signature: null };
						newKeyKA = newKeyKA.privateKey;
					} else {
						newKeyKA = await crypto.subtle.importKey("jwk", private, {name: "ECDSA", namedCurve: "P-256"}, true, ["sign"]);
						exportedKA = key;
					}
					let ephemeralKey = await crypto.subtle.generateKey({name: "ECDH", namedCurve: "P-256"}, true, ["deriveBits"]);
					let exported = await crypto.subtle.exportKey("jwk", ephemeralKey.publicKey);
					exported = { signedBy: "clientKey", usages: ["connfulSecureEphemeral"], key: exported };
					let signature = u8aToHex(new Uint8Array(await crypto.subtle.sign({
						name: "ECDSA",
						hash: "SHA-256"
					}, newKeyKA, new TextEncoder().encode(JSON.stringify(exported)))));
					let _dataBufferPromise = null;
					let _rejectDataPromise = null;
					let dataBufferPromise = new Promise((r, e) => [_dataBufferPromise, _rejectDataPromise] = [r, e]);
					let _settlePromise = null;
					let _rejectPromise = null;
					let settlePromise = new Promise((r, e) => [_settlePromise, _rejectPromise] = [r, e]);
					let packetID = crypto.getRandomValues(new Uint8Array(32)).reduce((a, b) => a + b.toString(16).padStart(2, "0"), "");
					connections[connID + ":client"] = {
						ourKey: ephemeralKey,
						from: address,
						theirMainKeyReceived: false,
						theirKeyRaw: null,
						aesUsableKey: null,
						networkListenID,
						dataBuffer: [],
						dataBufferPromise,
						settlePromise,
						gateIfNeeded: gate
					}
					async function eventListener(e) {
						try {
							let packet = JSON.parse(e.data);
							if (!packet.from) {
								if (packet.event == "AddressUnreachable" && packet.packetID == packetID)
									_rejectPromise(new Error("ADDRESS_UNREACHABLE"));
								return;
							}
							if (packet.data.gate) return;
							if (packet.data.type == "connectionful" && packet.data.connectionID == connID && packet.data.action == "start") {
								if (connections[connID + ":client"].aesUsableKey) return;
								let theirUsableKey = await crypto.subtle.importKey("jwk", packet.data.content.keyInfo.key, {
									name: "ECDH",
									namedCurve: "P-256"
								}, true, []);
								let joinedKeys = await crypto.subtle.deriveBits({
									name: "ECDH",
									public: theirUsableKey
								}, ephemeralKey.privateKey, 256);
								let aesUsableKey = await crypto.subtle.importKey("raw", joinedKeys, {
									name: "AES-GCM"
								}, true, ["encrypt", "decrypt"]);
								connections[connID + ":client"].aesUsableKey = aesUsableKey;
								connections[connID + ":client"].theirKeyRaw = packet.data.content;
								let iv = crypto.getRandomValues(new Uint8Array(16));
								websocket.send(JSON.stringify({
									receiver: address,
									data: {
										type: "connectionful",
										action: "xchange",
										connectionID: connID,
										content: {
											iv: u8aToHex(iv),
											ct: u8aToHex(new Uint8Array(await crypto.subtle.encrypt({
												name: "AES-GCM",
												iv
											}, aesUsableKey, new TextEncoder().encode(JSON.stringify(exportedKA)))))
										},
										gate
									}
								}));
							} else if (packet.data.type == "connectionful" && packet.data.connectionID == connID && packet.data.action == "xchange") {
								if (connections[connID + ":client"].theirMainKeyReceived) return;
								let theirMainKeyDecrypt = JSON.parse(new TextDecoder().decode(await crypto.subtle.decrypt({
									name: "AES-GCM",
									iv: hexToU8A(packet.data.content.iv)
								}, connections[connID + ":client"].aesUsableKey, hexToU8A(packet.data.content.ct))));
								let usableMainKey = await crypto.subtle.importKey("jwk", theirMainKeyDecrypt.keyInfo.key, {name: "ECDSA", namedCurve: "P-256"}, true, ["verify"]);
								let verifyKeySignature = await crypto.subtle.verify({
									name: "ECDSA",
									hash: "SHA-256"
								}, usableMainKey, hexToU8A(connections[connID + ":client"].theirKeyRaw.signature), new TextEncoder().encode(JSON.stringify(connections[connID + ":client"].theirKeyRaw.keyInfo)));
								if (!doNotVerifyServer && verifyKeySignature) {
									try {
										let khrlFiles = await modules.fs.ls(modules.defaultSystem + "/etc/keys/khrl", processToken);
										let khrlSignatures = [];
										for (let khrlFile of khrlFiles) {
											let khrl = JSON.parse(await modules.fs.read(modules.defaultSystem + "/etc/keys/khrl/" + khrlFile, processToken));
											let khrlSignature = khrl.signature;
											delete khrl.signature;
											if (await crypto.subtle.verify({
												name: "ECDSA",
												hash: {
													name: "SHA-256"
												}
											}, modules.ksk_imported, hexToU8A(khrlSignature), new TextEncoder().encode(JSON.stringify(khrl.list)))) {
												khrlSignatures.push(...khrl.list);
											}
										}
										verifyKeySignature = await recursiveKeyVerify(theirMainKeyDecrypt, khrlSignatures);
									} catch {
										verifyKeySignature = false;
									}
								}
								if (!verifyKeySignature || (!theirMainKeyDecrypt.keyInfo.usages.includes("connfulSecureServer:" + address) &&
										!theirMainKeyDecrypt.keyInfo.usages.includes("connfulSecureServer:" + verifyByDomain))) {
									_rejectPromise(new Error("SERVER_SIGNATURE_VERIFICATION_FAILED"));
									websocket.removeEventListener("message", eventListener);
									delete connections[connID + ":client"];
									delete networkListens[networkListenID];
									return websocket.send(JSON.stringify({
										receiver: address,
										data: {
											type: "connectionful",
											action: "drop",
											connectionID: connID,
											gate
										}
									}));
								}
								connections[connID + ":client"].theirMainKeyReceived = theirMainKeyDecrypt;
								websocket.send(JSON.stringify({
									receiver: address,
									data: {
										type: "connectionful",
										action: "nice2meetu",
										connectionID: connID,
										gate
									}
								}));
								_settlePromise();
							} else if (packet.data.type == "connectionful" && packet.data.connectionID == connID && packet.data.action == "drop") {
								if (connections[connID + ":client"].dying) return;
								_rejectPromise(new Error("CONNECTION_DROPPED"));
								if (_rejectDataPromise) _rejectDataPromise(new Error("CONNECTION_DROPPED"));
								websocket.send(JSON.stringify({
									receiver: address,
									data: {
										type: "connectionful",
										action: "drop",
										connectionID: connID,
										gate
									}
								}));
								connections[connID + ":client"].dying = true;
								websocket.removeEventListener("message", eventListener);
								delete networkListens[networkListenID];
								if (!connections[connID + ":client"].dataBuffer.length) delete connections[connID + ":client"];
							} else if (packet.data.type == "connectionful" && packet.data.connectionID == connID && packet.data.action == "data") {
								if (!connections[connID + ":client"].aesUsableKey) return;
								if (!connections[connID + ":client"].theirMainKeyReceived) return;
								if (connections[connID + ":client"].writingLock) await connections[connID + ":client"].writingLock;
								let writingLockRelease;
								let writingLock = new Promise(r => writingLockRelease = r);
								connections[connID + ":client"].writingLock = writingLock;
								connections[connID + ":client"].dataBuffer.push(new TextDecoder().decode(await crypto.subtle.decrypt({
									name: "AES-GCM",
									iv: hexToU8A(packet.data.content.iv)
								}, connections[connID + ":client"].aesUsableKey, hexToU8A(packet.data.content.ct))));
								if (!(connections[connID + ":client"].dataBuffer.length - 1)) {
									_dataBufferPromise();
									dataBufferPromise = new Promise((r, e) => [_dataBufferPromise, _rejectDataPromise] = [r, e]);
									connections[packet.data.connectionID + ":client"].dataBufferPromise = dataBufferPromise;
								}
								writingLockRelease();
							}
						} catch {}
					};
					networkListens[networkListenID] = { ws: websocket, gate: gate, fn: eventListener };
					websocket.addEventListener("message", eventListener);
					websocket.send(JSON.stringify({
						receiver: address,
						data: {
							type: "connectionful",
							action: "start",
							gate,
							connectionID: connID,
							content: { keyInfo: exported, signature }
						},
						id: packetID
					}));
					modules.network.runOnClose.then(function() {
						if (connections.hasOwnProperty(connID + ":client")) {
							connections[connID + ":client"].dying = true;
							if (!connections[connID + ":client"].dataBuffer.length) delete connections[connID + ":client"];
						}
						delete networkListens[networkListenID];
						_rejectPromise(new Error("NETWORK_CLOSED"));
						_rejectDataPromise(new Error("NETWORK_CLOSED"));
					});
					return connID + ":client";
				},
				connfulConnectionSettled: async function(connectionID) {
					if (!privileges.includes("CONNFUL_CONNECT")) throw new Error("UNAUTHORIZED_ACTION");
					if (!connections.hasOwnProperty(connectionID)) throw new Error("NO_SUCH_CONNECTION");
					await connections[connectionID].settlePromise;
				},
				connfulDisconnect: async function(connectionID) {
					if (!privileges.includes("CONNFUL_DISCONNECT")) throw new Error("UNAUTHORIZED_ACTION");
					if (!connections.hasOwnProperty(connectionID)) throw new Error("NO_SUCH_CONNECTION");
					if (connections[connectionID].dying) return;
					networkListens[connections[connectionID].networkListenID].ws.send(JSON.stringify({
						receiver: connections[connectionID].from,
						data: {
							type: "connectionful",
							action: "drop",
							connectionID: connectionID.slice(0, -7),
							gate: connections[connectionID].gateIfNeeded
						}
					}));
				},
				connfulForceDisconnect: async function(connectionID) {
					if (!privileges.includes("CONNFUL_DISCONNECT")) throw new Error("UNAUTHORIZED_ACTION");
					delete connections[connectionID];
				},
				connfulWrite: async function(sendOpts) {
					if (!privileges.includes("CONNFUL_WRITE")) throw new Error("UNAUTHORIZED_ACTION");
					if (!connections.hasOwnProperty(sendOpts.connectionID)) throw new Error("NO_SUCH_CONNECTION");
					if (connections[sendOpts.connectionID].dying) throw new Error("CONNECTION_DROPPED");
					let iv = crypto.getRandomValues(new Uint8Array(16));
					let u8aToHex = (u8a) => Array.from(u8a).map(a => a.toString(16).padStart(2, "0")).join("");
					networkListens[connections[sendOpts.connectionID].networkListenID].ws.send(JSON.stringify({
						receiver: connections[sendOpts.connectionID].from,
						data: {
							type: "connectionful",
							action: "data",
							content: {
								iv: u8aToHex(iv),
								ct: u8aToHex(new Uint8Array(await crypto.subtle.encrypt({
									name: "AES-GCM",
									iv
								}, connections[sendOpts.connectionID].aesUsableKey, new TextEncoder().encode(sendOpts.data))))
							},
							connectionID: sendOpts.connectionID.slice(0, -7),
							gate: connections[sendOpts.connectionID].gateIfNeeded
						}
					}));
				},
				connfulRead: async function(connectionID) {
					if (!privileges.includes("CONNFUL_READ")) throw new Error("UNAUTHORIZED_ACTION");
					if (!connections.hasOwnProperty(connectionID)) throw new Error("NO_SUCH_CONNECTION");
					if (!connections[connectionID].dataBuffer.length) await connections[connectionID].dataBufferPromise;
					let data = connections[connectionID].dataBuffer.shift();
					if (connections[connectionID].dying && connections[connectionID].dataBuffer.length == 0) delete connections[connectionID]; 
					return data;
				},
				connfulAddressGet: async function(connectionID) {
					if (!privileges.includes("CONNFUL_ADDRESS_GET")) throw new Error("UNAUTHORIZED_ACTION");
					if (!connections.hasOwnProperty(connectionID)) throw new Error("NO_SUCH_CONNECTION");
					return connections[connectionID].from;
				},
				connfulIdentityGet: async function(connectionID) {
					if (!privileges.includes("CONNFUL_IDENTITY_GET")) throw new Error("UNAUTHORIZED_ACTION");
					if (!connections.hasOwnProperty(connectionID)) throw new Error("NO_SUCH_CONNECTION");
					return connections[connectionID].theirMainKeyReceived;
				},
				systemUptime: async function() {
					if (!privileges.includes("SYSTEM_UPTIME")) throw new Error("UNAUTHORIZED_ACTION");
					return Math.floor(performance.now());
				},
				networkRawWrite: function(data) {
					if (!privileges.includes("NETWORK_RAW_WRITE")) throw new Error("UNAUTHORIZED_ACTION");
					let websocketHandle = modules.network.ws;
					if (!websocketHandle) throw new Error("NETWORK_UNREACHABLE");
					let websocket = modules.websocket._handles[websocketHandle].ws;
					if (websocket.readyState != 1) throw new Error("NETWORK_UNREACHABLE");
					websocket.send(data);
				},
				networkRawRead: function() {
					if (!privileges.includes("NETWORK_RAW_READ")) throw new Error("UNAUTHORIZED_ACTION");
					let websocketHandle = modules.network.ws;
					if (!websocketHandle) throw new Error("NETWORK_UNREACHABLE");
					let websocket = modules.websocket._handles[websocketHandle].ws;
					if (websocket.readyState != 1) throw new Error("NETWORK_UNREACHABLE");
					return Promise.race([ new Promise(async function(resolve) {
						networkListens[networkListenID] = { ws: websocket, fn: _ => resolve(_.data) };
						websocket.addEventListener("message", eventListener);
					}), new Promise((_, reject) => modules.network.runOnClose.then(_ => reject(new Error("NETWORK_CLOSED")))) ]);
				},
				getHostname: async function() {
					if (!privileges.includes("GET_HOSTNAME")) throw new Error("UNAUTHORIZED_ACTION");
					return modules.network.hostname;
				},
				resolve: async function(name) {
					if (!privileges.includes("RESOLVE_NAME")) throw new Error("UNAUTHORIZED_ACTION");
					let websocketHandle = modules.network.ws;
					if (!websocketHandle) throw new Error("NETWORK_UNREACHABLE");
					let websocket = modules.websocket._handles[websocketHandle].ws;
					if (websocket.readyState != 1) throw new Error("NETWORK_UNREACHABLE");
					let tlds = JSON.parse(await modules.fs.read(modules.defaultSystem + "/etc/tlds.json"));
					function resolveRecursive(name, address) {
						if (tlds.hasOwnProperty(name)) return tlds[name];
						if (address == null) return null;
						return new Promise(function(resolve) {
							let gate = "user_" + Array.from(crypto.getRandomValues(new Uint8Array(16))).map(a => a.toString(16).padStart(2, "0")).join("");
							let networkListenID = Array.from(crypto.getRandomValues(new Uint8Array(64))).map(a => a.toString(16).padStart(2, "0")).join("");
							function eventListener(e) {
								try {
									let packet = JSON.parse(e.data);
									if (packet.data.type == "connectionless" && packet.data.gate == gate && packet.from == address) {
										websocket.removeEventListener("message", eventListener);
										delete networkListens[networkListenID];
										resolve(packet.data.content);
									}
								} catch {}
							}
							networkListens[networkListenID] = { ws: websocket, fn: eventListener };
							websocket.addEventListener("message", eventListener);
							websocket.send(JSON.stringify({
								receiver: address,
								data: {
									type: "connectionless",
									gate: "resolve",
									content: {
										reply: gate,
										query: name
									}
								}
							}));
						});
					}
					let nameParts = name.split(".").reverse();
					let currentResolve;
					for (let part = 0; part < nameParts.length; part++) currentResolve = await resolveRecursive(nameParts.slice(0, part + 1).reverse().join("."), currentResolve);
					return currentResolve;
				},
				patchDiff: function(libraryOptions) {
					if (!privileges.includes("PATCH_DIFF")) throw new Error("UNAUTHORIZED_ACTION");
					if (!window.diff) throw new Error("MODULE_REQUIRED");
					let operations = { diff_core, diff, lcs, calcPatch, applyPatch, calcSlices };
					return [ ...operations[libraryOptions.operation](...libraryOptions.args) ];
				},
				setFirmware: async function(new_flash) {
					if (!privileges.includes("SET_FIRMWARE")) throw new Error("UNAUTHORIZED_ACTION");
					if (modules.core.setFW) {
						await modules.core.setFW(new_flash);
						return;
					}
					localStorage.setItem("runtime_flash", new_flash);
				},
				reloadNetworkConfig: async function() {
					if (!privileges.includes("RELOAD_NETWORK_CONFIG")) throw new Error("UNAUTHORIZED_ACTION");
					await modules.network.reloadConfig();
				},
				batteryStatus: async function() {
					if (!privileges.includes("GET_BATTERY_STATUS")) throw new Error("UNAUTHORIZED_ACTION");
					let battery = await navigator.getBattery();
					return {
						charging: battery.charging,
						level: battery.level,
						chargingTime: battery.chargingTime,
						dischargingTime: battery.dischargingTime
					};
				},
				getUpdateService: async function() {
					if (!privileges.includes("GET_UPDATE_SERVICE")) throw new Error("UNAUTHORIZED_ACTION");
					return modules.network.updates;
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
// modules/.../boot/06-csp.js
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
	if (window.nacl) {
		modules.csps.tweetnacl = {
			cspMetadata: function() {
				return {
					name: "TweetNaCl Cryptographic Provider",
					version: "1.0.3",
					developer: "TweetNaCl.js developers (https://github.com/dchest/tweetnacl-js)",
					features: Object.keys(modules.csps.tweetnacl)
				}
			},
			random: typedArray => nacl.randomBytes(typedArray.length),
			generateKey: type => nacl[type].keyPair(),
			deriveKey: arg => nacl[arg.type].keyPair.fromSeed(arg.seed),
			digest: message => nacl.hash(message),
			encrypt: arg => nacl[arg.type](arg.message, arg.nonce, arg.key1, arg.key2),
			sign: arg => nacl.sign.detached(arg.message, arg.secretKey),
			decrypt: arg => nacl[arg.type].open(arg.box, arg.nonce, arg.key1, arg.key2),
			verify: arg => nacl.sign.detached.verify(arg.message, arg.signature, arg.publicKey)
		};
	}
}
loadBasicCSP();
// modules/.../boot/06-locales.js
function localization() {
	// @pcos-app-mode native
	let locales = {
        get: function(key, lang) {
			lang = lang || locales.defaultLocale || navigator.languages[0].split("-")[0].toLowerCase();
			let locale = locales[lang];
			if (!locale) locale = locales[locales.defaultLocale];
			if (!locale) locale = {};
			if (!locale.hasOwnProperty(key)) locale = locales.en;
			return locale.hasOwnProperty(key) ? locale[key] : key;
		}
	}
	modules.locales = locales;
}
localization();
// modules/.../boot/06-localesappend-en.js
modules.locales.en = {
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
	"NETCONFIG_UC": "Customizable: ",
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
	"EXIT": "Exit",
	"DESCRIPTION_FIELD": "Description: %s",
	"REMOVE_BTN": "Remove",
	"UNMOUNT_BTN": "Unmount",
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
	"LLDA_ACTION_IMPORTSTRING": "action importstring: [input file] [output partition]",
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
	"USER_EXT_PRIVILEGES": "Extended privilege set",
	"LULL_SYSTEM": "Sleep mode",
	"SYSTEM_IMAGING": "System imaging",
	"CREATE_IMAGE": "Create system image",
	"RESTORE_IMAGE": "Restore system image",
	"SELECT_FILE_PROMPT": "Select file: ",
	"REBOOT_ON_RESTORE": "Reboot after restoring",
	"MERGE_STATES": "Merge image states",
	"LISTING_PARTITIONS_FAILED": "Failed to list partitions.",
	"READING_PARTITION_FAILED": "Failed to read partition %s",
	"LISTING_DATA_FAILED": "Failed to list data.",
	"READING_DATA_FAILED": "Failed to read data.",
	"WRITING_IMAGE_FAILED": "Failed to write image.",
	"SUCCESSFUL_OP": "The process was successfully completed.",
	"FAILED_OP": "The process has failed.",
	"READING_IMAGE_FAILED": "Failed to read image.",
	"WRITING_PARTITION_FAILED": "Failed to write partition %s",
	"WRITING_DATA_FAILED": "Failed to write data.",
	"DELETING_PARTITION_FAILED": "Failed to delete partition %s",
	"DELETING_DATA_FAILED": "Failed to delete data.",
	"SHUTTING_DOWN_FAILED": "Failed to shut the system down.",
	"NETWORK_STATUS_ONLINE": "You are connected to a local area network.",
	"NETWORK_STATUS_OFFLINE": "You aren't connected to any sort of network.",
	"PCOS_NETWORK_STATUS_ONLINE": "You are connected to PCOS Network. (hostname: %s, address: %s)",
	"PCOS_NETWORK_STATUS_OFFLINE": "You are disconnected from PCOS Network.",
	"PCOS_NETWORK_STATUS_STOPPED": "The PCOS Network service was stopped.",
	"START_MENU_FAILED": "The start menu has failed to launch. You can log out instead.",
	"SYSTEM_BUILT_AT": "System built at %s",
	"REAL_TERMINAL_VER_USEDESC": "ver - Show the build version and time",
	"BLANK_PRIVILEGE_FLAG": "Blank user privileges",
	"INSTALLING_SYSTEM_APPHARDEN": "Installing program security rules",
	"INSTALLING_NET_CONF": "Installing PCOS Network configuration",
	"NETWORK_ADDRESS_FIELD": "Network address: %s",
	"NETWORK_AUTOHOST_FIELD": "Automatic hostname: %s",
	"NETCONFIG_HOSTNAME": "Hostname: ",
	"DIFF_USAGE": "Usage: diff [original] [new] [difference]",
	"DIFF_DESCRIPTION": "Calculates the difference between two files.",
	"PATCH_USAGE": "Usage: patch [original] [difference] [new]",
	"PATCH_DESCRIPTION": "Calculates the 'sum' of the original and the difference.",
	"CURRENT_OSFILE_VERSION": "Current OS file version: build %s",
	"DOWNLOADING_OS_PATCH": "Downloading OS file patch from %s (address %s)",
	"HANDOFF_UPDATE": "Handing off the update process to updateos.js",
	"SYSTEM_UP_TO_DATE": "The system is up to date",
	"POWER_USAGE": "Usage: power <options> <r|reboot|restart|k|kexec>",
	"POWER_DESCRIPTION": "Powers down or restarts the system. Supplying nothing to power makes a shutdown.",
	"POWER_FORCE": "--force: don't wait for processes, reboot or power down immediately",
	"POWER_KEXEC": "--kexec: reboot without reloading the page or firmware (automatically toggles reboot)",
	"UPDATEFW_BUTTON": "Update firmware",
	"UPDATEFW_DOWNLOADING": "Downloading local init.js...",
	"UPDATEFW_DOWNLOAD_FAILED": "Failed to download local init.js.",
	"UPDATEFW_DECODING": "Parsing init.js as text",
	"UPDATEFW_SETTING": "Setting init.js as firmware",
	"ADDUSER_USAGE": "Usage: adduser <options> [username]",
	"ADDUSER_DESCRIPTION": "Creates a new user account.",
	"ADDUSER_SKIP_PASSWD": "--skip-passwd: don't prompt for a password",
	"ADDUSER_SKIP_HOME": "--skip-home: don't create a home directory",
	"ADDUSER_GROUPS": "--groups: group to add (specify multiple times for multiple groups)",
	"ADDUSER_HOME": "--home: custom home directory",
	"NEW_USER_CREATION": "Creating new user \"%s\"",
	"BLOCKUSER_USAGE": "Usage: blockuser <username>",
	"BLOCKUSER_DESCRIPTION": "Blocks a user account.",
	"DELUSER_USAGE": "Usage: deluser <options> [username]",
	"DELUSER_DESCRIPTION": "Deletes a user account.",
	"DELUSER_HOMEDIR": "--homedir: delete the home directory",
	"OLD_USER_DELETION": "Deleting old user \"%s\"",
	"BATTERY_STATUS_UNAVAILABLE": "The battery status is unavailable.",
	"BATTERY_STATUS_CHARGING": "The battery is charging (%s%, %suntil full)",
	"BATTERY_STATUS_DISCHARGING": "The battery is discharging (%s%, %sof play)",
	"PATCH_HUNK_COUNT": "Patch hunks: %s",
	"SERVER_SIGNATURE_VERIFICATION_FAILED": "Signature verification for the server failed.",
	"NETWORK_UNREACHABLE": "Network is unreachable.",
	"ADDRESS_UNREACHABLE": "Address is unreachable.",
	"NETWORK_CLOSED": "The network has closed.",
	"CONNECTION_DROPPED": "The connection has been dropped.",
	"BLOG_BROWSER_NAME": "Blog Browser",
	"BLOG_BROWSER_LOADING": "Hold on, loading this page...",
	"BLOG_BROWSER_PROTO": "There's no such protocol. This version only supports the bdp:// protocol.",
	"BLOG_BROWSER_GATESET": "To set a connful gate, use the username part of the URL: bdp://gate@myblog.pc",
	"HOSTNAME_RESOLUTION_FAILED": "Failed to resolve hostname.",
	"BLOG_BROWSER_POSTCLOSE": "This interactive post has been closed.",
	"BLOG_BROWSER_FILEPOST": "This is a file post. You can save it to this system.",
	"BLOG_BROWSER_DLFILEPOST": "You have downloaded this file post.",
	"BLOG_BROWSER_LOADING_PROGRESS": "Loading this post (%s of %s chunks received)",
	"BLOG_BROWSER_NOVERIFY": "You have enabled an option to disable the verification of the server. This is not recommended as the network proxy can execute a man-in-the-middle attack and see your information. Would you let that happen?",
	"BLOG_BROWSER_NOSANDBOX": "You have enabled an option to pass through all APIs of your operating system. This is not recommended as the blog post can do anything as if it were the blog browser application. Would you let that happen?",
	"NETWORKFS_USAGE": "Usage: networkfs <options> [url] [mountpoint]",
	"NETWORKFS_DESCRIPTION": "Mounts a filesystem available over PCOS Network.",
	"NETWORKFS_NOVERIFY": "--no-verification: Don't verify the server's key",
	"NETWORKFS_KEY": "--key=[path]: Path to key for mutual verification",
	"NETWORKFS_PROTO": "This version only supports the netfs:// protocol.",
	"NETCONFIG_UPDATES": "Updates from: ",
	"NETWORK_UPDATES_FIELD": "Updates from: %s",
	"LOCALE_NAME": "English",
	"SETTING_LOCALE_PREFERENCE": "Setting locale preference",
	"LANGUAGE_SELECT": "Your language: ",
	"CHANGE_LOCALE": "Change language",
	"INSTALLER_INTENT": "Start the OS installation",
	"MOUNT_EXISTS": "Mount already exists",
	"INSECURE_MODE_MSG": "Insecure configuration!",
	"MODULE_REQUIRED": "The module \"%s\" is required for this function. Contact the system administrator."
};

// modules/.../boot/07-tasks.js
function loadTasks() {
	// @pcos-app-mode native
	modules.startupWindow.content.innerText = modules.locales.get("PCOS_STARTING");
	let tasks = {
		exec: async function(file, arg, windowObject, token, silent, privateData) {
			let errorAudio = new Audio();
			try {
				let errorSoundPerm = await modules.fs.permissions(modules.defaultSystem + "/etc/sounds/error.aud", token);
				if (!errorSoundPerm.world.includes("r")) throw new Error("Not allowed to read error.aud");
				let errorSound = await modules.fs.read(modules.defaultSystem + "/etc/sounds/error.aud", token);
				errorAudio.src = errorSound;
			} catch {}
			if (modules.session.attrib(windowObject.sessionId, "loggingOut")) throw new Error("LOGGING_OUT");
			let language = modules.session.attrib(windowObject.sessionId, "language") || undefined;
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
			windowObject.title.innerText = modules.locales.get("UNTITLED_APP", language);
			windowObject.content.innerText = "";
			windowObject.content.style = "";
			let taskId = crypto.getRandomValues(new Uint8Array(64)).reduce((a, b) => a + b.toString(16).padStart(2, "0"), "");
			let executablePermissions, executable;
			try {
				executablePermissions = await this.fs.permissions(file, token);
				executable = await this.fs.read(file, token);
			} catch (e) {
				windowObject.title.innerText = modules.locales.get("APP_STARTUP_CRASH_TITLE", language);
				windowObject.content.innerText = modules.locales.get("APP_STARTUP_CRASH", language);
				windowObject.content.style.padding = "8px";
				windowObject.closeButton.disabled = false;
				windowObject.closeButton.onclick = (e) => windowObject.windowDiv.remove() && e.stopPropagation();
				if (silent) windowObject.windowDiv.remove();
				if (!silent) errorAudio.play();
				throw e;
			}
			if (!executablePermissions.world.includes("r") || !executablePermissions.world.includes("x")) {
				windowObject.title.innerText = modules.locales.get("PERMISSION_DENIED", language);
				windowObject.content.innerText = modules.locales.get("MORE_PERMISSION_DENIED", language);
				windowObject.content.style.padding = "8px";
				windowObject.closeButton.disabled = false;
				windowObject.closeButton.onclick = (e) => windowObject.windowDiv.remove() && e.stopPropagation();
				if (silent) windowObject.windowDiv.remove();
				if (!silent) errorAudio.play();
				throw new Error("MORE_PERMISSION_DENIED", language);
			}
			if (!executable.includes("// @pcos-app-mode isolat" + "able")) {
				windowObject.title.innerText = modules.locales.get("COMPATIBILITY_ISSUE_TITLE", language);
				windowObject.content.innerText = modules.locales.get("COMPATIBILITY_ISSUE", language);
				windowObject.content.style.padding = "8px";
				windowObject.closeButton.disabled = false;
				windowObject.closeButton.onclick = (e) => windowObject.windowDiv.remove() && e.stopPropagation();
				if (silent) windowObject.windowDiv.remove();
				if (!silent) errorAudio.play();
				throw new Error("COMPATIBILITY_ISSUE");
			}
			let appHardening = {overridable:true};
			try {
				appHardening = JSON.parse(await this.fs.read(modules.defaultSystem + "/etc/appHarden", token));
			} catch {}
			let disableHarden = appHardening.overridable && modules.core.bootMode == "disable-harden";
			if (disableHarden) appHardening = {overridable:true};
			let limitations = [];
			let execSignature = {};
			if (executable.includes("// =====BEGIN MANIFEST=====")) {
				let parsingLines = executable.split("\n");
				let parsingBoundStart = parsingLines.indexOf("// =====BEGIN MANIFEST=====");
				let parsingBoundEnd = parsingLines.indexOf("// =====END MANIFEST=====");
				let upToParse = parsingLines.slice(parsingBoundStart, parsingBoundEnd + 1);
				let knownLineTypes = ["allow", "deny"];
				for (let line of upToParse) {
					let lineType = line.split(": ")[0].replace("// ", "");
					let lineData = line.replace("// " + lineType + ": ", "");
					if (lineType == "signature") {
						execSignature.signature = lineData;
						executable = executable.replace(line + "\n", "");
					}
					if (lineType == "signer") execSignature.signer = lineData;
					if (lineType == "asck") execSignature.selfContainedSigner = lineData;
					if (knownLineTypes.includes(lineType)) {
						let dataParts = lineData.split(", ");
						for (let data of dataParts) limitations.push({ lineType, data });
					}
				}
			}
			if (disableHarden) limitations = [];
			let hexToU8A = (hex) => Uint8Array.from(hex.match(/.{1,2}/g).map(a => parseInt(a, 16)));
			let u8aToHex = (u8a) => Array.from(u8a).map(a => a.toString(16).padStart(2, "0")).join("");
			if (!limitations.some(lim => lim.lineType == "allow") && appHardening.requireAllowlist && !disableHarden) {
				windowObject.title.innerText = modules.locales.get("PERMISSION_DENIED", language);
				windowObject.content.innerText = modules.locales.get("NO_APP_ALLOWLIST", language);
				windowObject.content.style.padding = "8px";
				windowObject.closeButton.disabled = false;
				windowObject.closeButton.onclick = (e) => windowObject.windowDiv.remove() && e.stopPropagation();
				if (silent) windowObject.windowDiv.remove();
				if (!silent) errorAudio.play();
				throw new Error("NO_APP_ALLOWLIST");
			}

			async function recursiveKeyVerify(key, khrl) {
				if (!key) throw new Error("NO_KEY");
				let hash = u8aToHex(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode((key.keyInfo?.key || key.key).x + "|" + (key.keyInfo?.key || key.key).y))));
				if (khrl.includes(hash)) throw new Error("KEY_REVOKED");
				let signedByKey = modules.ksk_imported;
				if (key.keyInfo && key.keyInfo?.signedBy) {
					signedByKey = JSON.parse(await modules.fs.read(modules.defaultSystem + "/etc/keys/" + key.keyInfo.signedBy, token));
					if (!signedByKey.keyInfo) throw new Error("NOT_KEYS_V2");
					if (!signedByKey.keyInfo.usages.includes("keyTrust")) throw new Error("NOT_KEY_AUTHORITY");
					await recursiveKeyVerify(signedByKey, khrl);
					signedByKey = await crypto.subtle.importKey("jwk", signedByKey.keyInfo.key, {
						name: "ECDSA",
						namedCurve: "P-256"
					}, false, ["verify"]);
				}
				if (!await crypto.subtle.verify({
					name: "ECDSA",
					hash: {
						name: "SHA-256"
					}
				}, signedByKey, hexToU8A(key.signature), new TextEncoder().encode(JSON.stringify(key.key || key.keyInfo)))) throw new Error("KEY_SIGNATURE_VERIFICATION_FAILED");
				return true;
			}

			if ((execSignature.signer || appHardening.requireSignature || execSignature.selfContainedSigner) && !disableHarden) {
				try {
					let khrlFiles = await this.fs.ls(modules.defaultSystem + "/etc/keys/khrl", token);
					let khrlSignatures = [];
					for (let khrlFile of khrlFiles) {
						let khrl = JSON.parse(await this.fs.read(modules.defaultSystem + "/etc/keys/khrl/" + khrlFile, token));
						let khrlSignature = khrl.signature;
						delete khrl.signature;
						if (await crypto.subtle.verify({
							name: "ECDSA",
							hash: {
								name: "SHA-256"
							}
						}, modules.ksk_imported, hexToU8A(khrlSignature), new TextEncoder().encode(JSON.stringify(khrl.list)))) {
							khrlSignatures.push(...khrl.list);
						}
					}
					let signingKey = JSON.parse(execSignature.selfContainedSigner || "null");
					if (!signingKey || appHardening.disableASCK) signingKey = JSON.parse(await this.fs.read(modules.defaultSystem + "/etc/keys/" + execSignature.signer, token));
					await recursiveKeyVerify(signingKey, khrlSignatures);
					if (signingKey.keyInfo) if (!signingKey.keyInfo.usages.includes("appTrust")) throw new Error("NOT_APP_SIGNING_KEY");
					let importSigningKey = await crypto.subtle.importKey("jwk", signingKey.keyInfo?.key || signingKey.key, {
						name: "ECDSA",
						namedCurve: "P-256"
					}, false, ["verify"]);
					if (!await crypto.subtle.verify({
						name: "ECDSA",
						hash: {
							name: "SHA-256"
						}
					}, importSigningKey, hexToU8A(execSignature.signature), new TextEncoder().encode(executable))) throw new Error("APP_SIGNATURE_VERIFICATION_FAILED");
				} catch (e) {
					console.error("Failed to verify app signature:", e);
					windowObject.title.innerText = modules.locales.get("PERMISSION_DENIED", language);
					windowObject.content.innerText = modules.locales.get("SIGNATURE_VERIFICATION_FAILED", language).replace("%s", execSignature.signer || modules.locales.get("UNKNOWN_PLACEHOLDER", language));
					windowObject.content.style.padding = "8px";
					windowObject.closeButton.disabled = false;
					windowObject.closeButton.onclick = (e) => windowObject.windowDiv.remove() && e.stopPropagation();
					if (silent) windowObject.windowDiv.remove();
					if (!silent) errorAudio.play();
					throw new Error("APP_OR_KEY_SIGNATURE_VERIFICATION_FAILED");
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
				let reeAPIInstance = await modules.reeAPIInstance({ ree, ses: windowObject.sessionId, token, taskId, limitations, privateData });
				for (let action in reeAPIInstance.public) ree.exportAPI(action, (e) => reeAPIInstance.public[action](e.arg));
				this.tracker[taskId] = {
					ree,
					file: file,
					arg: arg,
					apis: reeAPIInstance,
					critical: false,
					cliio: {
						attached: false,
						attachedCLISignUp: function() {
							return new Promise(a => attachedCLIRegistrations.push(a));
						}
					}
				};
				let registrations = [];
				let attachedCLIRegistrations = [];
				let cliCache = [];
				windowObject.closeButton.addEventListener("click", () => that.sendSignal(taskId, 15));
				ree.exportAPI("attachCLI", async function() {
					if (that.tracker[taskId].cliio.attached) return true;
					if (!window.Terminal) return false;
					for (let registration of attachedCLIRegistrations) registration();
					attachedCLIRegistrations = [];
					let signup = () => new Promise((resolve) => registrations.push(resolve));
					ree.iframe.hidden = true;
					let termDiv = document.createElement("div");
					termDiv.style = "position: absolute; top: 0; left: 0; width: 100%; height: 100%;";
					let fitAddon = new FitAddon.FitAddon();
					let termInstance = new Terminal();
					termInstance.loadAddon(fitAddon);
					termInstance.open(termDiv);
					windowObject.content.appendChild(termDiv);
					that.tracker[taskId].cliio.attached = true;
					that.tracker[taskId].cliio.xtermInstance = termInstance;
					let onresizeFn = () => fitAddon.fit();
					onresizeFn();
					let robs = new ResizeObserver(onresizeFn);
					that.tracker[taskId].cliio.robsInstance = robs;
					robs.observe(windowObject.windowDiv);
					that.tracker[taskId].cliio.signup = signup;
					that.tracker[taskId].cliio.xtermInstance.onData(e => cliCache.push(e));
					termInstance.clear();
					await new Promise((resolve) => setTimeout(resolve, 8));
					return true;  
				});
				ree.exportAPI("toMyCLI", async function(apiArg) {
					if (that.tracker[taskId].cliio.attached) {
						that.tracker[taskId].cliio.xtermInstance.write(apiArg.arg);
						for (let registered in registrations) {
							await registrations[registered]({ type: "write", data: apiArg.arg });
							registrations.splice(0, 1);
						}
					}
				});
				ree.exportAPI("fromMyCLI", async function() {
					if (!that.tracker[taskId].cliio.attached) return false;
					let ti = that.tracker[taskId].cliio.xtermInstance;
					return new Promise(async function(resolve) {
						if (cliCache.length) {
							let element = cliCache[0];
							cliCache = cliCache.slice(1);
							resolve(element);
							return;
						}
						let d = ti.onData(async function(e) {
							cliCache = cliCache.slice(1);
							resolve(e);
							d.dispose();
						});
					});
				});
				ree.exportAPI("clearMyCLI", async function() {
					if (that.tracker[taskId].cliio.attached) that.tracker[taskId].cliio.xtermInstance.clear();
					for (let registered in registrations) {
						await registrations[registered]({ type: "consoleClear" });
						registrations.splice(registered, 1);
					}
				});
				ree.exportAPI("cliSize", function() {
					if (!that.tracker[taskId].cliio.attached) return [ 0, 0 ];
					return [ that.tracker[taskId].cliio.xtermInstance.cols, that.tracker[taskId].cliio.xtermInstance.rows ];
				});
				ree.exportAPI("detachCLI", function() {
					if (!that.tracker[taskId].cliio.attached) return true;
					that.tracker[taskId].cliio.attached = false;
					that.tracker[taskId].cliio.xtermInstance.clear();
					that.tracker[taskId].cliio.robsInstance.disconnect();
					delete that.tracker[taskId].cliio.robsInstance;
					that.tracker[taskId].cliio.xtermInstance.dispose();
					delete that.tracker[taskId].cliio.xtermInstance;
					delete that.tracker[taskId].cliio.signup;
					registrations = [];
					ree.iframe.hidden = false;
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
					if (reeAPIInstance.public.getPrivileges().includes("GRAB_ATTENTION")) {
						windowObject.windowDiv.classList.toggle("fullscreen", apiArg.arg);
					}
				});
				ree.exportAPI("closeability", (apiArg) => windowObject.closeButton.classList.toggle("hidden", !apiArg.arg));
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
						that.tracker[taskId].cliio.robsInstance.disconnect();
						that.tracker[taskId].cliio.robsInstance = null;
						that.tracker[taskId].cliio.xtermInstance.dispose();
					}
				});
				ree.beforeCloseDown(() => windowObject.windowDiv.remove());
				ree.beforeCloseDown(() => delete that.tracker[taskId]);
				await ree.eval(executable);
			} catch (e) {
				ree.closeDown();
				windowObject.title.innerText = modules.locales.get("APP_STARTUP_CRASH_TITLE", language);
				windowObject.content.innerText = modules.locales.get("APP_STARTUP_CRASH", language);
				windowObject.content.style.padding = "8px";
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
				cliio: this.tracker[taskId].cliio.attached
			}
		},
		tracker: {},
		fs: modules.fs,
		ree: modules.core.createREE
	};
	
	modules.tasks = tasks;
}
loadTasks();
// modules/.../boot/09-logout.js
async function logOut(target) {
	let liu = modules.liu;
	if (!liu.hasOwnProperty(target)) throw new Error("USER_NOT_LOGGED_IN");
	let session = liu[target].session;
	let token = liu[target].logon.token;
	let secureSession = modules.session.attrib(session, "secureID");
	await modules.session.attrib(session, "loggingOut", true);
	clearInterval(liu[target].clockInterval);
	if (modules.session.active == session || (secureSession && modules.session.active == secureSession)) await modules.session.muteAllSessions();
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
				try {
					taskList = modules.session.attrib(session, "openReeWindows") || [];
					if (Object.keys(taskList).length == 0) {
						resolve();
						clearInterval(int);
					}
				} catch {
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
	if (secureSession) {
		taskList = modules.session.attrib(secureSession, "openReeWindows") || [];
		for (let taskId of taskList) modules.tasks.sendSignal(taskId, 9);
	}
	taskList = modules.session.attrib(session, "openReeWindows") || [];
	for (let taskId of taskList) modules.tasks.sendSignal(taskId, 9);
	await allProcessesClosed();
	loggingOutWindow.windowDiv.remove();
	delete modules.liu[target];
	await modules.tokens.revoke(token);
	if (secureSession) await modules.session.rmsession(secureSession);
	await modules.session.rmsession(session);
}

modules.logOut = logOut;
// modules/.../boot/09-restart.js
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
	
	async function restart(noAutomaticReload = false, token, kexec) {
		try {
			let shutdownSoundPerm = await modules.fs.permissions(modules.defaultSystem + "/etc/sounds/shutdown.aud");
			if (!shutdownSoundPerm.world.includes("r")) throw new Error("Not allowed to read shutdown.aud");
			let shutdownSound = await modules.fs.read(modules.defaultSystem + "/etc/sounds/shutdown.aud");
			let shutdownAudio = new Audio();
			shutdownAudio.src = shutdownSound;
			shutdownAudio.play();
		} catch (e) {
			console.error("Failed to play shutdown.aud:", e);
		}
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
			modules.websocket._handles[modules.network.ws].send(JSON.stringify({
				finalProxyPacket: true
			}));
		} catch {}
		description.innerText = modules.locales.get("PCOS_RESTARTING").replace("%s", modules.locales.get("ABRUPT_CLOSE_SIGNAL"));
		for (let taskId in tasks.tracker) tasks.sendSignal(taskId, 9, true);
		await allProcessesClosed();
		try {
			modules.websocket._handles[modules.network.ws].ws.onclose = null;
			modules.websocket._handles[modules.network.ws].ws.close();
			delete modules.websocket._handles[modules.network.ws];
		} catch {}
		description.innerText = modules.locales.get("PCOS_RESTARTING").replace("%s", modules.locales.get("UNMOUNTING_MOUNTS"));
		for (let mount in fs.mounts) try { await fs.sync(mount, token); } catch {}
		for (let mount in fs.mounts) try { await fs.umount(mount, token); } catch {}
		for (let mount in fs.mounts) try { await fs.umount(mount, token, true); } catch {}
		description.innerText = modules.locales.get("PCOS_RESTARTING").replace("%s", modules.locales.get("RESTARTING"));
		if (!noAutomaticReload) {
			if (kexec) {
				try {
					modules.session.destroy();
					await new ((async _=>0).constructor)(
						modules.core.disk.partition("boot").getData()
					)();
					return modules.killSystem();
				} catch (e) {
					await panic("KEXEC_FAILED", {
						name: "kexec",
						underlyingJS: e
					});
				}
			}
			return location.reload();
		}
		modules.killSystem();
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
// modules/.../boot/11-userfriendliness.js
function loadUserFriendly() {
	// @pcos-app-mode native
	modules.userfriendliness = {
		inconsiderateTime: function(language, ms, majorUnitsOnly, displayMs) {
			let string = "";
			let days = Math.floor(ms / 86400000);
			let hours = Math.floor(ms / 3600000) % 24;
			let minutes = Math.floor(ms / 60000) % 60;
			let seconds = Math.floor(ms / 1000) % 60;
			if (days) string = string + modules.locales.get("SHORT_DAYS", language).replace("%s", days) + " ";
			if (days && majorUnitsOnly) return string;
			if (hours) string = string + modules.locales.get("SHORT_HOURS", language).replace("%s", hours) + " ";
			if (hours && majorUnitsOnly) return string;
			if (minutes) string = string + modules.locales.get("SHORT_MINUTES", language).replace("%s", minutes) + " ";
			if (minutes && majorUnitsOnly) return string;
			if (seconds) string = string + modules.locales.get("SHORT_SECONDS", language).replace("%s", seconds) + " ";
			if (displayMs && (ms % 1000)) {
				if (seconds && majorUnitsOnly) return string;
				string = string + modules.locales.get("SHORT_MILLISECONDS", language).replace("%s", (ms % 1000)) + " ";
			}
			return string;
		},
		informationUnits: function(language, bytes, majorUnitsOnly) {
			let string = "";
			let tb = Math.floor(bytes / (1024 * 1024 * 1024 * 1024));
			let gb = Math.floor(bytes / (1024 * 1024 * 1024)) % 1024;
			let mb = Math.floor(bytes / (1024 * 1024)) % 1024;
			let kb = Math.floor(bytes / 1024) % 1024;
			let b = bytes % 1024;
			if (tb) string = string + modules.locales.get("SHORT_TERABYTES", language).replace("%s", tb) + " ";
			if (tb && majorUnitsOnly) return string;
			if (gb) string = string + modules.locales.get("SHORT_GIGABYTES", language).replace("%s", gb) + " ";
			if (gb && majorUnitsOnly) return string;
			if (mb) string = string + modules.locales.get("SHORT_MEGABYTES", language).replace("%s", mb) + " ";
			if (mb && majorUnitsOnly) return string;
			if (kb) string = string + modules.locales.get("SHORT_KILOBYTES", language).replace("%s", kb) + " ";
			if (kb && majorUnitsOnly) return string;
			if (b) string = string + modules.locales.get("SHORT_BYTES", language).replace("%s", b);
			if (b && majorUnitsOnly) return string;
			return string;
		},
		considerateTime: function(language, ms, majorUnitsOnly, displayMs) {
			let dateObject = new Date(ms + (new Date(ms).getTimezoneOffset() * 60000));
			let string = "";
			let years = dateObject.getFullYear() - 1970;
			let months = dateObject.getMonth();
			let days = dateObject.getDate() - 1;
			let hours = dateObject.getHours();
			let minutes = dateObject.getMinutes();
			let seconds = dateObject.getSeconds();
			let millisec = dateObject.getMilliseconds();
			if (years) string = string + modules.locales.get("SHORT_YEARS", language).replace("%s", years) + " ";
			if (years && majorUnitsOnly) return string;
			if (months) string = string + modules.locales.get("SHORT_MONTHS", language).replace("%s", months) + " ";
			if (months && majorUnitsOnly) return string;
			if (days) string = string + modules.locales.get("SHORT_DAYS", language).replace("%s", days) + " ";
			if (days && majorUnitsOnly) return string;
			if (hours) string = string + modules.locales.get("SHORT_HOURS", language).replace("%s", hours) + " ";
			if (hours && majorUnitsOnly) return string;
			if (minutes) string = string + modules.locales.get("SHORT_MINUTES", language).replace("%s", minutes) + " ";
			if (minutes && majorUnitsOnly) return string;
			if (seconds) string = string + modules.locales.get("SHORT_SECONDS", language).replace("%s", seconds) + " ";
			if (displayMs && millisec) {
				if (seconds && majorUnitsOnly) return string;
				string = string + modules.locales.get("SHORT_MILLISECONDS", language).replace("%s", (millisec % 1000)) + " ";
			}
			return string;
		}
	}
}
loadUserFriendly();
// modules/.../boot/12-tokens.js
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
			this._tokens[token].privileges = ["FS_READ", "FS_WRITE", "FS_REMOVE", "FS_CHANGE_PERMISSION", "FS_LIST_PARTITIONS", "IPC_CREATE_PIPE", "IPC_LISTEN_PIPE", "IPC_SEND_PIPE", "IPC_CHANGE_PERMISSION", "ELEVATE_PRIVILEGES", "GET_USER_INFO", "SET_SECURITY_CHECKS", "START_TASK", "LIST_TASKS", "SIGNAL_TASK", "FETCH_SEND", "CSP_OPERATIONS", "IDENTIFY_SYSTEM", "WEBSOCKETS_OPEN", "WEBSOCKETS_LISTEN", "WEBSOCKETS_SEND", "WEBSOCKET_SET_PERMISSIONS", "MANAGE_TOKENS", "WEBSOCKET_INFO", "GRAB_ATTENTION", "CLI_MODIFICATIONS", "GET_THEME", "GET_LOCALE", "GET_FILESYSTEMS", "GET_BUILD", "GET_SERVER_URL", "START_BACKGROUND_TASK", "GET_BOOT_MODE", "GET_SCREEN_INFO", "PCOS_NETWORK_PING", "LOGOUT", "LULL_SYSTEM", "CONNLESS_LISTEN", "CONNLESS_SEND", "GET_NETWORK_ADDRESS", "CONNFUL_LISTEN", "CONNFUL_CONNECT", "CONNFUL_DISCONNECT", "CONNFUL_WRITE", "CONNFUL_READ", "CONNFUL_ADDRESS_GET", "SYSTEM_UPTIME", "GET_HOSTNAME", "RESOLVE_NAME", "PATCH_DIFF", "GET_BATTERY_STATUS", "CONNFUL_IDENTITY_GET", "GET_UPDATE_SERVICE"];
			if (user == "root") this._tokens[token].privileges.push("FS_UNMOUNT", "SYSTEM_SHUTDOWN", "SWITCH_USERS_AUTOMATICALLY", "USER_INFO_OTHERS", "SET_USER_INFO", "FS_BYPASS_PERMISSIONS", "IPC_BYPASS_PERMISSIONS", "TASK_BYPASS_PERMISSIONS", "SENSITIVE_USER_INFO_OTHERS", "SYSTEM_STABILITY", "RUN_KLVL_CODE", "IDENTIFY_SYSTEM_SENSITIVE", "WEBSOCKET_BYPASS_PERMISSIONS", "LLDISK_READ", "LLDISK_WRITE", "LLDISK_LIST_PARTITIONS", "LLDISK_REMOVE", "LLDISK_IDB_READ", "LLDISK_IDB_WRITE", "LLDISK_IDB_REMOVE", "LLDISK_IDB_LIST", "LLDISK_IDB_SYNC", "FS_MOUNT", "SET_DEFAULT_SYSTEM", "GET_SYSTEM_RESOURCES", "LLDISK_INIT_PARTITIONS", "LOGOUT_OTHERS", "LULL_SYSTEM_FORCE", "CONNLESS_LISTEN_GLOBAL", "GET_USER_LIST", "CONNFUL_LISTEN_GLOBAL", "NETWORK_RAW_WRITE", "NETWORK_RAW_READ", "SET_FIRMWARE", "RELOAD_NETWORK_CONFIG");
			if ((await modules.users.getUserInfo(user, token)).blankPrivileges) this._tokens[token].privileges = [];
			this._tokens[token].privileges.push(...((await modules.users.getUserInfo(user, token)).additionalPrivilegeSet || []));
			this._tokens[token].privileges = Array.from(new Set(this._tokens[token].privileges));
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
// modules/.../boot/12-users.js
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
				homeDirectory: modules.defaultSystem,
				blankPrivileges: true,
				additionalPrivilegeSet:  [ "IPC_SEND_PIPE", "GET_LOCALE", "GET_THEME", "ELEVATE_PRIVILEGES", "FS_READ", "FS_LIST_PARTITIONS", "CSP_OPERATIONS" ]
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
				if (credentials[check].type == "zkpp") {
					credentials[check].message = modules.locales.get("MODULE_REQUIRED").replace("%s", "tweetnacl");
					credentials[check].type = "informative";
					credentials[check].userInput = false;
					credentials[check].verify = () => false;
					if (window.nacl) {
						let hexToU8A = (hex) => Uint8Array.from(hex.match(/.{1,2}/g).map(a => parseInt(a, 16)));
						let randomChallenge = crypto.getRandomValues(new Uint8Array(64)).reduce((a, b) => a + b.toString(16).padStart(2, "0"), "");
						credentials[check].message = modules.locales.get("PASSWORD_PROMPT");
						credentials[check].type = "zkpp_password";
						credentials[check].userInput = true;
						credentials[check].challenge = randomChallenge;
						credentials[check].verify = input => nacl.sign.detached.verify(hexToU8A(credentials[check].challenge), hexToU8A(input), hexToU8A(credentials[check].publicKey));
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
		},
		getUsers: async function(token) {
			let userDB = JSON.parse(await modules.fs.read(modules.defaultSystem + "/etc/security/users"), token);
			return Object.keys(userDB);
		}
	}
}
await setupUsers();
// modules/.../boot/13-authui.js
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
	if (isLogonScreen) windowObject.closeButton.classList.toggle("hidden", true);
	let authTask = await modules.tasks.exec(modules.defaultSystem + "/apps/authui.js", [], windowObject, appToken, false, [ ipc, user || "" ]);
	async function waitForIt() {
		let msg = await Promise.race([
			modules.ipc.listenFor(ipc),
			modules.tasks.waitTermination(authTask)
		]);
		delete modules.ipc._ipc[ipc];
		try {
			await modules.tasks.sendSignal(authTask, 9);
			hook(msg);
		} catch {
			hook({
				success: false,
				cancelled: true
			});
		}
	}
	waitForIt();
	return { hook: (e) => hook = e };
}
modules.authui = authui;
// modules/.../boot/13-consentui.js
async function consentui(ses = modules.session.active, config, token) {
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
	let authTask = await modules.tasks.exec(modules.defaultSystem + "/apps/consentui.js", [], windowObject, appToken, false, [
		ipc,
		config.user || "",
		JSON.stringify({
			path: config.path,
			args: config.args,
			submittedIntent: config.intent,
			submittedName: config.name
		})
	]);
	async function waitForIt() {
		let msg = await Promise.race([
			modules.ipc.listenFor(ipc),
			modules.tasks.waitTermination(authTask)
		]);
		delete modules.ipc._ipc[ipc];
		try {
			await modules.tasks.sendSignal(authTask, 9);
			hook(msg);
		} catch {
			hook({
				success: false,
				cancelled: true
			});
		}
	}
	waitForIt();
	return { hook: (e) => hook = e };
}
modules.consentui = consentui;
// modules/.../boot/14-logon-requirement.js
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
		console.error("Failed to play startup sound:", e);
	}
	let liu = {};
	modules.liu = liu;
	serviceLogon();
	let insertedLockMessage = false;
	async function handleLogin(resolvedLogon, liu) {
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
		if (modules.session.attrib(session, "secureID")) return modules.session.activateSession(modules.session.attrib(session, "secureID"));
		modules.session.activateSession(session);
		let dom = modules.session.tracker[session].html;
		let bgPic = "";
		let isDark = false;
		let locale;
		let basicPrivilegeChecklist = [ "FS_READ", "FS_LIST_PARTITIONS", "IPC_SEND_PIPE", "IPC_LISTEN_PIPE", "START_TASK", "GET_LOCALE", "GET_THEME", "LOGOUT" ];
		if (!basicPrivilegeChecklist.every(privilege => userInfo.privileges.includes(privilege))) {
			let failureMessage = modules.window(session);
			failureMessage.title.innerText = "Permission denied";
			failureMessage.content.style.padding = "8px";
			failureMessage.content.innerText = "There were not enough privileges to log you in. Please contact your system administrator.";
			failureMessage.closeButton.onclick = async function() {
				failureMessage.windowDiv.remove();
				await modules.logOut(userInfo.user);
			}
			return;
		}

		try {
			let permissions = await modules.fs.permissions((await modules.users.getUserInfo(userInfo.user, false, resolvedLogon.token)).homeDirectory + "/.wallpaper", resolvedLogon.token);
			if (permissions.owner != userInfo.user && !userInfo.groups.includes(permissions.group) && !(permissions.world.includes("r") && permissions.world.includes("x")) && !userInfo.privileges.includes("FS_BYPASS_PERMISSIONS")) {
				throw new Error("Permission denied reading wallpaper");
			}
			bgPic = await modules.fs.read((await modules.users.getUserInfo(userInfo.user, false, resolvedLogon.token)).homeDirectory + "/.wallpaper", resolvedLogon.token);
		} catch (e) {
			console.error("Failed to read wallpaper:", e);
		}
		try {
			let permissionsdm = await modules.fs.permissions((await modules.users.getUserInfo(userInfo.user, false, resolvedLogon.token)).homeDirectory + "/.darkmode", resolvedLogon.token);
			if (permissionsdm.owner != userInfo.user && !userInfo.groups.includes(permissionsdm.group) && !(permissionsdm.world.includes("r") && permissionsdm.world.includes("x")) && !userInfo.privileges.includes("FS_BYPASS_PERMISSIONS")) {
				throw new Error("Permission denied reading dark mode preference");
			}
			isDark = (await modules.fs.read((await modules.users.getUserInfo(userInfo.user, false, resolvedLogon.token)).homeDirectory + "/.darkmode", resolvedLogon.token)) == "true";
		} catch (e) {
			console.error("Failed to read dark mode preference:", e);
		}
		try {
			let permissionsloc = await modules.fs.permissions((await modules.users.getUserInfo(userInfo.user, false, resolvedLogon.token)).homeDirectory + "/.locale", resolvedLogon.token);
			if (permissionsloc.owner != userInfo.user && !userInfo.groups.includes(permissionsloc.group) && !(permissionsloc.world.includes("r") && permissionsloc.world.includes("x")) && !userInfo.privileges.includes("FS_BYPASS_PERMISSIONS")) {
				throw new Error("Permission denied reading locale preference");
			}
			locale = await modules.fs.read((await modules.users.getUserInfo(userInfo.user, false, resolvedLogon.token)).homeDirectory + "/.locale", resolvedLogon.token);
			modules.session.attrib(session, "language", locale);
		} catch (e) {
			console.error("Failed to read dark mode preference:", e);
		}
		if (modules.core.bootMode == "safe") {
			isDark = true;
			if (!wasLiuLoaded) {
				let message = document.createElement("span");
				message.innerText = modules.locales.get("SAFE_MODE_MSG", locale);
				message.style = "position: absolute; right: 8px; bottom: 8px; color: white;";
				dom.appendChild(message);
				let message2 = document.createElement("span");
				message2.innerText = modules.locales.get("SAFE_MODE_MSG", locale);
				message2.style = "position: absolute; top: 8px; left: 8px; color: white;";
				dom.appendChild(message2);
			}
			bgPic = "";
		}
		if (modules.core.bootMode == "disable-harden" && !wasLiuLoaded) {
			let message = document.createElement("span");
			message.innerText = modules.locales.get("INSECURE_MODE_MSG", locale);
			message.style = "position: absolute; right: 8px; bottom: 8px; color: white;";
			dom.appendChild(message);
			let message2 = document.createElement("span");
			message2.innerText = modules.locales.get("INSECURE_MODE_MSG", locale);
			message2.style = "position: absolute; top: 8px; left: 8px; color: white;";
			dom.appendChild(message2);
		}
		modules.session.attrib(session, "dark", isDark);
		dom.style.background = "url(" + JSON.stringify(bgPic) + ")";
		if (modules.core.bootMode == "safe") dom.style.background = "black";
		dom.style.backgroundSize = "100% 100%";
		if (!wasLiuLoaded) {
			let autoRunNecessities = [];
			try {
				let autoRunPermissions = await modules.fs.permissions((await modules.users.getUserInfo(userInfo.user, false, resolvedLogon.token)).homeDirectory + "/.autorunNecessity", resolvedLogon.token);
				if (autoRunPermissions.owner != userInfo.user && !userInfo.groups.includes(autoRunPermissions.group) && !(autoRunPermissions.world.includes("r") && autoRunPermissions.world.includes("x")) && !userInfo.privileges.includes("FS_BYPASS_PERMISSIONS")) {
					throw new Error("Permission denied reading autorun necessities");
				}
				if (modules.core.bootMode != "safe") autoRunNecessities = await modules.fs.ls((await modules.users.getUserInfo(userInfo.user, false, resolvedLogon.token)).homeDirectory + "/.autorunNecessity", resolvedLogon.token);
			} catch (e) {
				console.error("Failed to read autorun necessities:", e);
			}
			function breakNecessityFailure() {
				let failureMessage = modules.window(session);
				failureMessage.title.innerText = modules.locales.get("PERMISSION_DENIED", locale);
				failureMessage.content.style.padding = "8px";
				failureMessage.content.innerText = modules.locales.get("AUTORUN_NECESSITIES_FAILED", locale);
				failureMessage.closeButton.onclick = async function() {
					failureMessage.windowDiv.remove();
					await modules.logOut(userInfo.user);
				}
			}
			for (let autoRunNecessity of autoRunNecessities) {
				let necessityPermissions = await modules.fs.permissions((await modules.users.getUserInfo(userInfo.user, false, resolvedLogon.token)).homeDirectory + "/.autorunNecessity/" + autoRunNecessity, resolvedLogon.token);
				if (necessityPermissions.owner != userInfo.user && !userInfo.groups.includes(necessityPermissions.group) && !(necessityPermissions.world.includes("r") && necessityPermissions.world.includes("x")) && !userInfo.privileges.includes("FS_BYPASS_PERMISSIONS")) {
					return breakNecessityFailure();
				}
				let link = await modules.fs.read((await modules.users.getUserInfo(userInfo.user, false, resolvedLogon.token)).homeDirectory + "/.autorunNecessity/" + autoRunNecessity, resolvedLogon.token);
				try {
					link = JSON.parse(link);
				} catch (e) {
					console.error("Failed to parse autorun necessity:", e);
					return breakNecessityFailure();
				}
				if (link.disabled) continue;
				try {
					let ipcPipe = modules.ipc.create();
					modules.ipc.declareAccess(ipcPipe, {
						owner: userInfo.user,
						group: userInfo.groups[0],
						world: false
					});
					let forkedToken;
					if (link.automaticLogon) {
						try {
							let logon = await modules.users.access(link.automaticLogon.username, resolvedLogon.token);
							logon = await logon.getNextPrompt();
							for (let response of link.automaticLogon.responses)
								if (logon.success == "intermediate") logon = await logon.input(response);
							if (!logon.success) throw new Error(logon.message);
							forkedToken = logon.token;
						} catch {}
						if (necessityPermissions.world.includes("r") && forkedToken) {
							let ownUser = await modules.tokens.info(forkedToken);
							let ownUserInfo = await modules.users.getUserInfo(ownUser.user, true, forkedToken);
							ownUserInfo.securityChecks = [];
							await modules.users.moduser(ownUser.user, ownUserInfo, forkedToken);
							await modules.tokens.revoke(forkedToken);
							forkedToken = null;
						}
					}
					if (!forkedToken) forkedToken = await modules.tokens.fork(resolvedLogon.token);
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
					console.error("Failed to execute autorun necessity:", e);
					return breakNecessityFailure();
				}
			}
			
			let autoRun = [];
			try {
				let autoRunPermissions = await modules.fs.permissions((await modules.users.getUserInfo(userInfo.user, false, resolvedLogon.token)).homeDirectory + "/.autorun", resolvedLogon.token);
				if (autoRunPermissions.owner != userInfo.user && !userInfo.groups.includes(autoRunPermissions.group) && !(autoRunPermissions.world.includes("r") && autoRunPermissions.world.includes("x")) && !userInfo.privileges.includes("FS_BYPASS_PERMISSIONS")) {
					throw new Error("Permission denied reading autorun");
				}
				if (modules.core.bootMode != "safe") autoRun = await modules.fs.ls((await modules.users.getUserInfo(userInfo.user, false, resolvedLogon.token)).homeDirectory + "/.autorun", resolvedLogon.token);
			} catch (e) {
				console.error("Failed to read autorun:", e);
			}
			for (let autoRunFile of autoRun) {
				let autoRunItemPermissions = await modules.fs.permissions((await modules.users.getUserInfo(userInfo.user, false, resolvedLogon.token)).homeDirectory + "/.autorun/" + autoRunFile, resolvedLogon.token);
				if (autoRunItemPermissions.owner != userInfo.user && !userInfo.groups.includes(autoRunItemPermissions.group) && !(autoRunItemPermissions.world.includes("r") && autoRunItemPermissions.world.includes("x")) && !userInfo.privileges.includes("FS_BYPASS_PERMISSIONS")) continue;
				let link = await modules.fs.read((await modules.users.getUserInfo(userInfo.user, false, resolvedLogon.token)).homeDirectory + "/.autorun/" + autoRunFile, resolvedLogon.token);
				try {
					link = JSON.parse(link);
				} catch {}
				if (link.disabled) continue;
				try {
					let forkedToken;
					if (link.automaticLogon) {
						try {
							let logon = await modules.users.access(link.automaticLogon.username, resolvedLogon.token);
							logon = await logon.getNextPrompt();
							for (let response of link.automaticLogon.responses)
								if (logon.success == "intermediate") logon = await logon.input(response);
							if (!logon.success) throw new Error(logon.message);
							forkedToken = logon.token;
						} catch {}
						if (autoRunItemPermissions.world.includes("r") && forkedToken) {
							let ownUser = await modules.tokens.info(forkedToken);
							let ownUserInfo = await modules.users.getUserInfo(ownUser.user, true, forkedToken);
							ownUserInfo.securityChecks = [];
							await modules.users.moduser(ownUser.user, ownUserInfo, forkedToken);
							await modules.tokens.revoke(forkedToken);
							forkedToken = null;
						}
					}
					if (!forkedToken) forkedToken = await modules.tokens.fork(resolvedLogon.token);
					let appWindow = modules.window(session);
					await modules.tasks.exec(link.path, [ ...(link.args || []) ], appWindow, forkedToken);
				} catch {}
			}

			let icons = [];
			let lastIconPlacement = [ 72, 72 ];
			try {
				let permissions = await modules.fs.permissions((await modules.users.getUserInfo(userInfo.user, false, resolvedLogon.token)).homeDirectory + "/desktop", resolvedLogon.token);
				if (permissions.owner != userInfo.user && !userInfo.groups.includes(permissions.group) && !(permissions.world.includes("r") && permissions.world.includes("x")) && !userInfo.privileges.includes("FS_BYPASS_PERMISSIONS")) {
					throw new Error("Permission denied reading desktop icons");
				}
				icons = await modules.fs.ls((await modules.users.getUserInfo(userInfo.user, false, resolvedLogon.token)).homeDirectory + "/desktop", resolvedLogon.token);
			} catch (e) {
				console.error("Failed to read desktop icons:", e);
			}
			for (let icon of icons) {
				if (icon.split("/").slice(-1)[0].startsWith(".")) continue;
				try {
					let iconPath = (await modules.users.getUserInfo(userInfo.user, false, resolvedLogon.token)).homeDirectory + "/desktop/" + icon;
					let permissions = await modules.fs.permissions(iconPath, resolvedLogon.token);
					if (permissions.owner != userInfo.user && !userInfo.groups.includes(permissions.group) && !permissions.world.includes("r") && !userInfo.privileges.includes("FS_BYPASS_PERMISSIONS")) {
						throw new Error("Permission denied reading desktop icon");
					}
					let isDir = await modules.fs.isDirectory(iconPath, resolvedLogon.token);
					let linkName = iconPath.split("/").slice(-1)[0];
					let appLink = { path: modules.defaultSystem + "/apps/explorer.js", args: [ iconPath ], name: linkName, placed: lastIconPlacement, icon: modules.defaultSystem + "/etc/icons/fileicon.pic" };
					if (!isDir) {
						if (linkName.endsWith(".lnk")) {
							try {
								appLink = { placed: lastIconPlacement, icon: modules.defaultSystem + "/etc/icons/lnk.pic", ...(JSON.parse(await modules.fs.read(iconPath, resolvedLogon.token))) };
								appLink._isRealLink = true;
							} catch {}
						} else {
							let ext = linkName.split(".").slice(-1)[0];
							appLink.icon = modules.defaultSystem + "/etc/icons/" + ext + ".pic";
							let assocsPermissions = await modules.fs.permissions(modules.defaultSystem + "/apps/associations", resolvedLogon.token);
							if (assocsPermissions.owner != userInfo.user && !userInfo.groups.includes(assocsPermissions.group) && !(assocsPermissions.world.includes("r") && assocsPermissions.world.includes("x")) && !userInfo.privileges.includes("FS_BYPASS_PERMISSIONS")) {
								throw new Error("Permission denied reading associations");
							}
							let associations = await modules.fs.ls(modules.defaultSystem + "/apps/associations", resolvedLogon.token);
							if (!associations.includes(ext)) appLink.disabled = true;
							else {
								let associationPermissions = await modules.fs.permissions(modules.defaultSystem + "/apps/associations/" + ext, resolvedLogon.token);
								if (!associationPermissions.world.includes("r") && !userInfo.groups.includes(associationPermissions.group) && associationPermissions.owner != userInfo.user && !userInfo.privileges.includes("FS_BYPASS_PERMISSIONS")) {
									throw new Error("Permission denied reading association");
								}
								appLink = { placed: lastIconPlacement, icon: appLink.icon, ...(JSON.parse(await modules.fs.read(modules.defaultSystem + "/apps/associations/" + ext, resolvedLogon.token))) };
								appLink.args = [ ...(appLink.args || []), iconPath ];
								appLink.name = linkName;
								delete appLink.localeDatabaseName;
								delete appLink.localeReferenceName;
							}
						}
					}
					if (appLink.disabled) continue;
					if (isDir) appLink.icon = modules.defaultSystem + "/etc/icons/foldericon.pic";
					let iconWindow = modules.window(session, false, true, async function(newx, newy) {
						if (appLink._isRealLink) {
							appLink.placed = [ newx, newy ];
							delete appLink._isRealLink;
							if (permissions.owner != userInfo.user && !userInfo.groups.includes(permissions.group) && !permissions.world.includes("w") && !userInfo.privileges.includes("FS_BYPASS_PERMISSIONS")) {
								throw new Error("Permission denied writing desktop icon");
							}
							await modules.fs.write(iconPath, JSON.stringify(appLink), resolvedLogon.token);
							appLink._isRealLink = true;
						}
					});
					iconWindow.title.innerText = (appLink.localeReferenceName ? modules.locales.get(appLink.localeReferenceName, locale) : null) || (appLink.localeDatabaseName ? (appLink.localeDatabaseName[locale] || appLink.localeDatabaseName[modules.locales.defaultLocale] || appLink.localeDatabaseName[navigator.language.slice(0, 2).toLowerCase()]) : null) || appLink.name;
					let iconEl = document.createElement("img");
					try {
						let permissions = await modules.fs.permissions(appLink.icon, resolvedLogon.token);
						if (permissions.owner != userInfo.user && !userInfo.groups.includes(permissions.group) && !permissions.world.includes("r") && !userInfo.privileges.includes("FS_BYPASS_PERMISSIONS")) {
							throw new Error("Permission denied reading desktop icon picture");
						}
						iconEl.src = await modules.fs.read(appLink.icon, resolvedLogon.token);
					} catch (e) {
						console.error("Failed to read desktop icon picture:", e);
						continue;
					}
					iconEl.style = "width: 100%; height: 100%; position: absolute;";
					iconWindow.content.appendChild(iconEl);
					iconWindow.windowDiv.style.top = appLink.placed[1] + "px";
					iconWindow.windowDiv.style.left = appLink.placed[0] + "px";
					iconEl.addEventListener("click", async function() {
						let forkedToken;
						if (appLink.automaticLogon) {
							try {
								let logon = await modules.users.access(appLink.automaticLogon.username, resolvedLogon.token);
								logon = await logon.getNextPrompt();
								for (let response of appLink.automaticLogon.responses)
									if (logon.success == "intermediate") logon = await logon.input(response);
								if (!logon.success) throw new Error(logon.message);
								forkedToken = logon.token;
							} catch {}
						}
						if (!forkedToken) forkedToken = await modules.tokens.fork(resolvedLogon.token);
						let appWindow = modules.window(session);
						await modules.tasks.exec(appLink.path, [ ...(appLink.args || []) ], appWindow, forkedToken);
					});
					lastIconPlacement = appLink.placed;
					lastIconPlacement[1] += 136;
					if (lastIconPlacement[1] > (dom.clientHeight - 136)) {
						lastIconPlacement[0] += 136;
						lastIconPlacement[1] = 72;
					}
				} catch (e) {
					console.error("Failed to read desktop icon:", e);
					continue;
				}
			}
			let startMenuChannel = modules.ipc.create();
			modules.ipc.declareAccess(startMenuChannel, {
				owner: userInfo.user,
				group: userInfo.groups[0],
				world: false
			});
			let taskbar = document.createElement("div");
			let clock = document.createElement("span");
			let startButton = document.createElement("button");
			let startMenu = modules.window(session);
			let forkedStartMenuToken = await modules.tokens.fork(resolvedLogon.token);

			function startMenuStub() {
				if (startMenu.windowDiv.parentElement == null) startMenu = modules.window(session);
				startMenu.windowDiv.classList.toggle("hidden", true);
				startMenu.title.innerText = modules.locales.get("START_MENU", locale);
				startMenu.content.style.padding = "8px";
				startMenu.content.innerText = "";
				let description = document.createElement("span");
				let logout = document.createElement("button");
				description.innerText = modules.locales.get("START_MENU_FAILED", locale);
				logout.innerText = modules.locales.get("LOG_OUT_BUTTON", locale).replace("%s", userInfo.user);
				logout.onclick = _ => modules.logOut(userInfo.user);
				startMenu.content.appendChild(description);
				startMenu.content.appendChild(document.createElement("br"));
				startMenu.content.appendChild(logout);
				startMenu.closeButton.onclick = () => startMenu.windowDiv.classList.toggle("hidden", true);
				startButton.onclick = _ => startMenu.windowDiv.classList.toggle("hidden");
			}

			startMenuStub();
			startButton.innerText = modules.locales.get("START_MENU_BTN", locale);
			startButton.style = "padding: 4px;";
			try {
				await modules.tasks.exec(modules.defaultSystem + "/apps/startMenu.js", [], startMenu, forkedStartMenuToken, true, startMenuChannel);
			} catch (e) {
				console.error("Failed to start start menu:", e);
				startMenuStub();
			}

			(async function() {
				while (true) {
					let listen = await modules.ipc.listenFor(startMenuChannel);
					if (listen.run) {
						try {
							let forkedToken;
							if (listen.run.automaticLogon) {
								try {
									let logon = await modules.users.access(listen.run.automaticLogon.username, resolvedLogon.token);
									logon = await logon.getNextPrompt();
									for (let response of listen.run.automaticLogon.responses)
										if (logon.success == "intermediate") logon = await logon.input(response);
									if (!logon.success) throw new Error(logon.message);
									forkedToken = logon.token;
								} catch {}
							}
							if (!forkedToken) forkedToken = await modules.tokens.fork(resolvedLogon.token);
							let appWindow = modules.window(session);
							await modules.tasks.exec(listen.run.path, [ ...(listen.run.args || []) ], appWindow, forkedToken);
						} catch {}
					} else if (listen.success) {
						startButton.onclick = () => modules.ipc.send(startMenuChannel, { open: true });
					} else if (listen.dying) {
						startMenu = modules.window(session);
						startMenuStub();
						forkedStartMenuToken = await modules.tokens.fork(resolvedLogon.token);
						try {
							await modules.tasks.exec(modules.defaultSystem + "/apps/startMenu.js", [], startMenu, forkedStartMenuToken, true, startMenuChannel);
						} catch (e) {
							console.error("Failed to start start menu:", e);
							startMenuStub();
						}
					}
				}
			})();

			taskbar.className = "taskbar";
			clock.className = "clock";
			let filler = document.createElement("div");
			filler.className = "filler";
			let battery = document.createElement("div");
			let networkIcon = document.createElement("div");
			let pcosNetworkIcon = document.createElement("div");
			let iconCache = {};
			for (let iconFile of ["network_", "network_offline_", "pcos_network_", "pcos_network_offline_", "readyToPlay_", "batteryChargeFinished_", "dying_", "charging_"]) {
				try {
					let permissions = await modules.fs.permissions(modules.defaultSystem + "/etc/icons/" + iconFile + "icon.pic", resolvedLogon.token);
					if (permissions.owner != userInfo.user && !userInfo.groups.includes(permissions.group) && !permissions.world.includes("r") && !userInfo.privileges.includes("FS_BYPASS_PERMISSIONS")) {
						throw new Error("Permission denied reading taskbar icon picture");
					}
					iconCache[iconFile] = await modules.fs.read(modules.defaultSystem + "/etc/icons/" + iconFile + "icon.pic", resolvedLogon.token);
				} catch (e) {
					console.error("Failed to read taskbar icon picture:", e);
				}
			}

			let toggle = false;
			clock.addEventListener("click", _ => toggle = !toggle);
			liu[liuUser].clockInterval = setInterval(async function() {
				clock.innerText = Intl.DateTimeFormat(locale, { timeStyle: toggle ? undefined : "medium" }).format()
				networkIcon.style.backgroundImage = "url(" + JSON.stringify(navigator.onLine ? iconCache.network_ : iconCache.network_offline_) + ")";
				networkIcon.title = modules.locales.get("NETWORK_STATUS_" + (navigator.onLine ? "ONLINE" : "OFFLINE"), locale)
				pcosNetworkIcon.style.backgroundImage = "url(" + JSON.stringify(modules.network.connected ? iconCache.pcos_network_ : iconCache.pcos_network_offline_) + ")";
				pcosNetworkIcon.title = modules.locales.get("PCOS_NETWORK_STATUS_" + (modules.network.connected ? "ONLINE" : "OFFLINE"), locale).replace("%s", userInfo.privileges.includes("GET_HOSTNAME") ? (modules.network.hostname || modules.locales.get("UNKNOWN_PLACEHOLDER", locale)) : modules.locales.get("UNKNOWN_PLACEHOLDER", locale)).replace("%s", userInfo.privileges.includes("GET_NETWORK_ADDRESS") ? (modules.network.address || "0").match(/.{1,4}/g).join(":") : modules.locales.get("UNKNOWN_PLACEHOLDER", locale));
				if (modules.network.serviceStopped) pcosNetworkIcon.title = modules.locales.get("PCOS_NETWORK_STATUS_STOPPED", locale);
				let batteryStatus = {charging: true, chargingTime: 0, dischargingTime: 0, level: 1};
				let batteryStatusIcon = iconCache.readyToPlay_;
				let batteryStatusDescription = modules.locales.get("BATTERY_STATUS_UNAVAILABLE", locale);
				if (navigator.getBattery && userInfo.privileges.includes("GET_BATTERY_STATUS")) {
					batteryStatus = await navigator.getBattery();
					batteryStatusDescription = modules.locales.get("BATTERY_STATUS_" + (batteryStatus.charging ? "CHARGING" : "DISCHARGING"), locale)
						.replace("%s", (batteryStatus.level * 100).toFixed(2))
						.replace("%s", modules.userfriendliness.inconsiderateTime(
							(batteryStatus.charging ? batteryStatus.chargingTime : batteryStatus.dischargingTime) * 1000
						));
					if (batteryStatus.level < 0.2) batteryStatusIcon = iconCache.dying_;
					if (batteryStatus.charging) batteryStatusIcon = batteryStatus.level == 1 ? iconCache.batteryChargeFinished_ : iconCache.charging_;
				}
				battery.style.backgroundImage = "url(" + JSON.stringify(batteryStatusIcon) + ")";
				battery.title = batteryStatusDescription;
			}, 500);
			
			battery.className = "icon";
			networkIcon.className = "icon";
			pcosNetworkIcon.className = "icon";
			taskbar.appendChild(startButton);
			taskbar.appendChild(filler);
			taskbar.appendChild(battery);
			taskbar.appendChild(networkIcon);
			taskbar.appendChild(pcosNetworkIcon);
			taskbar.appendChild(clock);
			dom.appendChild(taskbar);
		}
	}
	while (!modules.shuttingDown) {
		let useDefaultUser = await modules.fs.permissions(modules.defaultSystem + "/etc/security/automaticLogon");
		useDefaultUser = !useDefaultUser.world.includes("w");
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
			console.error("Failed to read lockscreen.pic:", e);
		}
		try {
			lockIsDark = (await modules.fs.read(modules.defaultSystem + "/etc/darkLockScreen")) == "true";
		} catch (e) {
			console.error("Failed to read darkLockScreen:", e);
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
		if (modules.core.bootMode == "disable-harden" && !insertedLockMessage) {
			insertedLockMessage = true;
			let message = document.createElement("span");
			message.innerText = modules.locales.get("INSECURE_MODE_MSG");
			message.style = "position: absolute; right: 8px; bottom: 8px; color: white;";
			sysDom.appendChild(message);
			let message2 = document.createElement("span");
			message2.innerText = modules.locales.get("INSECURE_MODE_MSG");
			message2.style = "position: absolute; top: 8px; left: 8px; color: white;";
			sysDom.appendChild(message2);
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
		handleLogin(resolvedLogon, liu);
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
	taskbar.className = "taskbar";

	taskbar.appendChild(startButton);
	dom.appendChild(taskbar);
	modules.serviceSession = session;
	if (modules.core.bootMode != "safe") {
		let serviceList = [];
		try {
			serviceList = await modules.fs.ls(modules.defaultSystem + "/apps/services");
		} catch (e) {
			console.error("Failed to list services:", e);
		}
		for (let service of serviceList) {
			let serviceConfig;
			let triggerPasswordReset = false;
			try {
				let permissions = await modules.fs.permissions(modules.defaultSystem + "/apps/services/" + service);
				if (permissions.world.includes("r")) triggerPasswordReset = true;
			} catch {}
			try {
				serviceConfig = await modules.fs.read(modules.defaultSystem + "/apps/services/" + service);
				serviceConfig = JSON.parse(serviceConfig);
			} catch (e) {
				console.error("Failed to read service config of", service, ":", e);
				continue;
			}
			if (serviceConfig.disabled) continue;p
			let serviceName = (serviceConfig.localeReferenceName ? modules.locales.get(serviceConfig.localeReferenceName) : null) || (serviceConfig.localeDatabaseName ? (serviceConfig.localeDatabaseName[navigator.language.slice(0, 2).toLowerCase()] || serviceConfig.localeDatabaseName[modules.locales.defaultLocale]) : null) || serviceConfig.name;
			if (!serviceConfig.automaticLogon) {
				console.error("Service", serviceName, "(", service, ") does not have logon credentials set");
				continue;
			}
			let forkedToken;
			try {
				let logon = await modules.users.access(serviceConfig.automaticLogon.username);
				logon = await logon.getNextPrompt();
				for (let response of serviceConfig.automaticLogon.responses)
					if (logon.success == "intermediate") logon = await logon.input(response);
				if (!logon.success) throw new Error(logon.message);
				forkedToken = logon.token;
			} catch (e) {
				console.error("Failed to create a logon session for", serviceName, "(", service, "):", e);
				continue;
			}
			if (triggerPasswordReset) {
				let ownUser = await modules.tokens.info(forkedToken);
				let ownUserInfo = await modules.users.getUserInfo(ownUser.user, true, forkedToken);
				ownUserInfo.securityChecks = [];
				await modules.users.moduser(ownUser.user, ownUserInfo, forkedToken);
				await modules.tokens.revoke(forkedToken);
				console.error("Exposed credentials for", serviceName, "(", service, ") have been made invalid");
				continue;
			}
			try {
				await modules.tasks.exec(serviceConfig.path, [ ...(serviceConfig.args || []) ], modules.window(session), forkedToken, true);
			} catch (e) {
				console.error("Failed to start service", serviceName, "(", service, "):", e);
			}
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
// modules/.../boot/18-logon-requirement-enforce.js
requireLogon();
// modules/.../boot/99-finished.js
function systemKillWaiter() {
	// @pcos-app-mode native
	modules.startupWindow.windowDiv.remove();
	return new Promise(function(resolve) {
		modules.killSystem = resolve;
	});
}
return await systemKillWaiter();