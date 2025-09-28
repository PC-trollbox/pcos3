let idb = {
	opendb: function(noReadPref) {
		if (!noReadPref) this._encrypted = prefs.read("encryption");
		if (this._db) return this._db;
		let that = this;
		return new Promise(function(resolve, reject) {
			let req = indexedDB.open("disk", 1);
			req.onupgradeneeded = function() {
				req.result.createObjectStore("disk");
			}
			req.onsuccess = async function() {
				that._db = req.result;
				if (that._encrypted) {
					let hash;
					try {
						hash = await navigator.credentials.get({ password: true });
						if (hash.id != "__decrypt_pcos3") hash = undefined;
						hash = hexToU8A(hash.password);
					} catch { hash = undefined; }
					if (!hash) {
						tty_bios_api.print("Enter disk password: ");
						let passwordInput = await tty_bios_api.inputLine(false, true);
						let salt = (await that.readPart("disk", true)).slice(0, 128);
						hash = hexToU8A(await pbkdf2(passwordInput, salt));
					}
					that.cryptoKey = await crypto.subtle.importKey("raw", hash, {
						name: "AES-GCM",
						length: 256
					}, false, ["encrypt", "decrypt"]);
				}
				resolve(that._db);
			}
			req.onerror = reject;
		});
	},
	writePart: async function(part, value, raw) {
		if (!this._db) await this.opendb();
		let that = this;
		if (this._encrypted && !raw) {
			let iv = crypto.getRandomValues(new Uint8Array(12));
			value = new TextEncoder().encode(JSON.stringify(value));
			let ct = new Uint8Array(await crypto.subtle.encrypt({
				name: "AES-GCM",
				iv: iv
			}, this.cryptoKey, value));
			value = new Uint8Array(iv.length + ct.length);
			value.set(iv);
			value.set(ct, iv.length);
			value = u8aToHex(value);
			if (part == "disk") { value = (await this.readPart("disk", true)).slice(0, 128) + value; }
		}
		let tx = this._db.transaction("disk", "readwrite");
		tx.objectStore("disk").put(value, part);
		let promiseID = crypto.getRandomValues(new Uint8Array(64)).reduce((a, b) => a + b.toString(16).padStart(2, "0"), "");
		let promise = new Promise(function(resolve, reject) {
			tx.oncomplete = function(...args) {    
				delete that._transactionCompleteEvent[promiseID];
				return resolve(...args);
			};
			function error(...args) {
				delete that._transactionCompleteEvent[promiseID];
				return reject(...args);
			};
			tx.onerror = error;
			tx.onabort = error;
		});
		that._transactionCompleteEvent[promiseID] = promise;
		return promise;
	},
	readPart: async function(part, raw) {
		if (!this._db) await this.opendb();
		let tx = this._db.transaction("disk", "readonly");
		let store = tx.objectStore("disk").get(part);
		return new Promise(function(resolve, reject) {
			store.onsuccess = async (e) => {
				let value = e.target.result;
				if (idb._encrypted && value && !raw) {
					let iv = hexToU8A(e.target.result.slice(part == "disk" ? 128 : 0, (part == "disk" ? 128 : 0) + 24));
					let ct = hexToU8A(e.target.result.slice((part == "disk" ? 128 : 0) + 24));
					try {
						value = JSON.parse(new TextDecoder().decode(await crypto.subtle.decrypt({
							name: "AES-GCM",
							iv: iv
						}, idb.cryptoKey, ct)));
					} catch (er) { return reject(er); }
				}
				resolve(value);
			};
			store.onerror = reject;
			store.onabort = reject;
		})
	},
	removePart: async function(part) {
		if (!this._db) await this.opendb();
		let that = this;
		let tx = this._db.transaction("disk", "readwrite");
		tx.objectStore("disk").delete(part);
		let promiseID = crypto.getRandomValues(new Uint8Array(64)).reduce((a, b) => a + b.toString(16).padStart(2, "0"), "");
		let promise = new Promise(function(resolve, reject) {
			tx.oncomplete = function(...args) {    
				delete that._transactionCompleteEvent[promiseID];
				return resolve(...args);
			};
			function error(...args) {
				delete that._transactionCompleteEvent[promiseID];
				return reject(...args);
			};
			tx.onerror = error;
			tx.onabort = error;
		});
		that._transactionCompleteEvent[promiseID] = promise;
		return promise;
	},
	listParts: async function() {
		if (!this._db) await this.opendb();
		let tx = this._db.transaction("disk", "readonly");
		let allKeys = tx.objectStore("disk").getAllKeys();
		return new Promise(function(resolve, reject) {
			allKeys.onsuccess = (e) => resolve(e.target.result);
			allKeys.onerror = reject;
			allKeys.onabort = reject;
		});
	},
	write: (value) => idb.writePart("disk", value),
	read: () => idb.readPart("disk"),
	sync: function() {
		return Promise.all(Object.values(this._transactionCompleteEvent));
	},
	closeDB: () => idb._db.close(),
	_db: null,
	_transactionCompleteEvent: {}
}

let disk = {
	partitions: function() {
		return Object.keys(JSON.parse(this._cache));
	},
	partition: function(name) {
		let that = this;
		let cachedPartition = JSON.parse(this._cache)[name];
		return {
			setData: function(val) {
				let commit = JSON.parse(that._cache);
				commit[name] = val;
				cachedPartition = val;
				that.raw = JSON.stringify(commit);
			},
			getData: function() {
				return cachedPartition;
			},
			remove: function() {
				let commit = JSON.parse(that._cache);
				delete commit[name];
				cachedPartition = undefined;
				that.raw = JSON.stringify(commit);
			}
		}
	},
	insertPartitionTable: function() {
		this.raw = "{}";
	},
	set raw(val) {
		this._cache = val;
		idb.write(val);
	},
	_cache: null,
	sync: () => idb.sync()
};