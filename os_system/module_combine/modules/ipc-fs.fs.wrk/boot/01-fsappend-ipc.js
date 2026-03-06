// @pcos-app-mode native
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
modules.mounts.IPCMount = IPCMount;