function ramMount(options) {
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
			return this.backend.permissions[properFile] || {
				owner: "root",
				group: "root",
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
			file = String(file);
			group = String(group);
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
			file = String(file);
			permissions = String(permissions);
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
		backend: { files: {}, permissions: {
			"": {
				owner: "root",
				group: "root",
				world: "rx"
			}
		} },
		ramFiles: new Map()
	};
}
module.exports = ramMount;