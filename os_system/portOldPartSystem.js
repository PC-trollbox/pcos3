const AsyncFunction = (async () => {}).constructor;
let disk = coreExports.disk;
let tty = coreExports.tty_bios_api;
tty.println("Partition Porting Tool");
tty.println("Partitions on disk: " + disk.partitions().join(", "));
tty.print("Select PCOS data partition [data]: ");
let dataPart = await tty.inputLine(true, true) || "data";

let dataPort = disk.partition(dataPart);
let data = dataPort.getData();
if (data.id) return tty.println("The partition already undergone porting.");
tty.println("Assigning new partition ID...");
let id = crypto.getRandomValues(new Uint8Array(64)).reduce((a, b) => a + b.toString(16).padStart(2, "0"), "");
data.id = id;
dataPort.setData(data);
tty.println("New partition ID: " + id);
tty.println("Relocating files...");
function println(str) {
	tty.println(str);
	return new Promise(function(resolve) {
		requestAnimationFrame(resolve);
	})
}
let idb_keys = coreExports.idb._db.transaction("disk").objectStore("disk").getAllKeys();
idb_keys = await new Promise(function(resolve) {
	idb_keys.onsuccess = () => resolve(idb_keys.result);
});
idb_keys.splice(idb_keys.indexOf("disk"), 1);
tty.println("Found " + idb_keys.length + " files...");
for (let key of idb_keys) {
	let data = await coreExports.idb.readPart(key);
	await coreExports.idb.writePart(id + "-" + key, data);
	await coreExports.idb.removePart(key);
	await println("Relocated " + key);
}
await println("Successful porting!");