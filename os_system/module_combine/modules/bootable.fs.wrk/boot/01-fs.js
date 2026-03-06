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
			if (!this.mounts[mount].permissions_supported) {
				try {
					let userInfo = await modules.tokens.info(sessionToken);
					return { owner: userInfo.user, group: userInfo.groups[0] || userInfo.user, world: "rwx" };
				} catch {}
				return { owner: randomNames, group: randomNames, world: "rwx" };
			}
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
			if (!this.mounts[mount].permissions_supported) return;
			return await this.mounts[mount].chown(file.split("/").slice(1).join("/"), owner, sessionToken);
		},
		chgrp: async function(file, group, sessionToken) {
			let filePath = file.split("/").slice(1);
			if (filePath.includes("")) throw new Error("PATH_INCLUDES_EMPTY");
			let mount = file.split("/")[0];
			if (!this.mounts.hasOwnProperty(mount)) throw new Error("NO_SUCH_DEVICE");
			if (modules.core.bootMode == "readonly") throw new Error("READ_ONLY_BMGR");
			if (this.mounts[mount].read_only) throw new Error("READ_ONLY_DEV");
			if (!this.mounts[mount].permissions_supported) return;
			return await this.mounts[mount].chgrp(file.split("/").slice(1).join("/"), group, sessionToken);
		},
		chmod: async function(file, permissions, sessionToken) {
			let filePath = file.split("/").slice(1);
			if (filePath.includes("")) throw new Error("PATH_INCLUDES_EMPTY");
			let mount = file.split("/")[0];
			if (!this.mounts.hasOwnProperty(mount)) throw new Error("NO_SUCH_DEVICE");
			if (modules.core.bootMode == "readonly") throw new Error("READ_ONLY_BMGR");
			if (this.mounts[mount].read_only) throw new Error("READ_ONLY_DEV");
			if (!this.mounts[mount].permissions_supported) return;
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
				if (!files[basename]) this.backend = this._recursive_op(this.backend, "files/" + key, { type: "write", value: id });
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
				if (files[directory.split("/").slice(-1)[0]]) throw new Error("DIR_EXISTS");
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
				if (Object.prototype.hasOwnProperty(properFile)) throw new Error("TECHNICAL_LIMITATIONS");
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
				if (Object.prototype.hasOwnProperty(properFile)) throw new Error("TECHNICAL_LIMITATIONS");
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
				if (Object.prototype.hasOwnProperty(properFile)) throw new Error("TECHNICAL_LIMITATIONS");
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
				if (!files[basename]) this.backend = this._recursive_op(this.backend, "files/" + key, { type: "write", value: id });
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
				if (files[directory.split("/").slice(-1)[0]]) throw new Error("DIR_EXISTS");
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
				if (Object.prototype.hasOwnProperty(properFile)) throw new Error("TECHNICAL_LIMITATIONS");
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
				if (Object.prototype.hasOwnProperty(properFile)) throw new Error("TECHNICAL_LIMITATIONS");
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
				if (Object.prototype.hasOwnProperty(properFile)) throw new Error("TECHNICAL_LIMITATIONS");
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
				if (!files[basename]) this.backend = this._recursive_op(this.backend, "files/" + key, { type: "write", value: id });
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
				if (files[directory.split("/").slice(-1)[0]]) throw new Error("DIR_EXISTS");
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
				if (Object.prototype.hasOwnProperty(properFile)) throw new Error("TECHNICAL_LIMITATIONS");
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
				if (Object.prototype.hasOwnProperty(properFile)) throw new Error("TECHNICAL_LIMITATIONS");
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
				if (Object.prototype.hasOwnProperty(properFile)) throw new Error("TECHNICAL_LIMITATIONS");
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

	async function hostOSMount(options) {
		let dirHandle;
		try {
			dirHandle = await window.showDirectoryPicker();
		} catch {
			throw new Error("PERMISSION_DENIED");
		}
		async function resolvePath(path) {
			let parts = path.split("/").filter(p => p.length > 0);
			let currentHandle = dirHandle;
			for (let part of parts) {
				try {
					currentHandle = await currentHandle.getDirectoryHandle(part);
				} catch {
					try {
						return await currentHandle.getFileHandle(part);
					} catch {
						throw new Error("NO_SUCH_FILE_DIR");
					}
				}
			}
			return currentHandle;
		}

		return {
			read: async function(filePath) {
				let handle = await resolvePath(filePath);
				if (handle.kind == "directory") throw new Error("IS_A_DIR");
				let file = await handle.getFile();
				return await file.text();
			},
			write: async function(filePath, data) {
				let parts = filePath.split("/").filter(p => p.length > 0);
				let fileName = parts.pop();
				let currentHandle = dirHandle;
				for (let part of parts) currentHandle = await currentHandle.getDirectoryHandle(part);
				let fileHandle = await currentHandle.getFileHandle(fileName, { create: true });
				let writable = await fileHandle.createWritable();
				await writable.write(data);
				await writable.close();
				return true;
			},
			rm: async function(path) {
				let parts = path.split("/").filter(p => p.length > 0);
				let targetName = parts.pop();
				let currentHandle = dirHandle;
				for (let part of parts) currentHandle = await currentHandle.getDirectoryHandle(part);
				await currentHandle.removeEntry(targetName);
				return true;
			},
			ls: async function(directory) {
				let handle = await resolvePath(directory);
				if (handle.kind != "directory") throw new Error("IS_A_FILE");
				let entries = [];
				for await (let entry of handle.values()) entries.push(entry.name);
				return entries;
			},
			mkdir: async function(directory) {
				let parts = directory.split("/").filter(p => p.length > 0);
				let currentHandle = dirHandle;
				for (let part of parts) try {
					currentHandle = await currentHandle.getDirectoryHandle(part);
				} catch {
					currentHandle = await currentHandle.getDirectoryHandle(part, { create: true });
				}
				return true;
			},
			isDirectory: async function(path) {
				let handle = await resolvePath(path);
				return handle.kind == "directory";
			},
			sync: () => true,
			unmount: () => true,
			directory_supported: true,
			read_only: !!options.read_only,
			filesystem: "HostOS",
			permissions_supported: false,
			_dirHandle: dirHandle
		};
	}
	
	fs.mounts["ram"] = ramMount({
		type: "run"
	});
	modules.mounts = {
		PCFSiDBMount,
		ramMount,
		preferenceMount,
		fileMount,
		overlayMount,
		hostOSMount
	};
	modules.fs = fs;
	modules.defaultSystem = "ram";
}

loadFs();