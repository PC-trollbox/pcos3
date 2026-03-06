// @pcos-app-mode native
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
			if (!files[basename]) await this.setBackend(this._recursive_op(await this.getBackend(), "files/" + key, { type: "write", value: id }));
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
			if (files[directory.split("/").slice(-1)[0]]) throw new Error("DIR_EXISTS");
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
			if (Object.prototype.hasOwnProperty(properFile)) throw new Error("TECHNICAL_LIMITATIONS");
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
			if (Object.prototype.hasOwnProperty(properFile)) throw new Error("TECHNICAL_LIMITATIONS");
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
			if (Object.prototype.hasOwnProperty(properFile)) throw new Error("TECHNICAL_LIMITATIONS");
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
modules.mounts.PCFSiDBAESCryptMount = PCFSiDBAESCryptMount;