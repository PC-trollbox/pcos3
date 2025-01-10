let idb = {
	opendb: _ => 0,
	writePart: (d, v) => localStorage.setItem(d, v),
	readPart: d => localStorage.getItem(d),
	removePart: d => localStorage.removeItem(d),
	listParts: _ => Object.keys(localStorage),
	write: (value) => idb.writePart("disk", value),
	read: () => idb.readPart("disk"),
	sync: _ => 0,
	closeDB: _ => 0
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