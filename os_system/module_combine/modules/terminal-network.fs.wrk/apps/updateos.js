// =====BEGIN MANIFEST=====
// signer: automaticSigner
// allow: FETCH_SEND, FS_WRITE, RUN_KLVL_CODE, IPC_CREATE_PIPE, IPC_LISTEN_PIPE, GET_LOCALE, FS_LIST_PARTITIONS, SYSTEM_SHUTDOWN, FS_READ, FS_BYPASS_PERMISSIONS
// =====END MANIFEST=====
(async function() {
	// @pcos-app-mode isolatable
	await availableAPIs.attachCLI();
	if (!(await availableAPIs.getPrivileges()).includes("GET_LOCALE")) { await availableAPIs.toMyCLI("updateos: Locale permission denied\r\n");
		return await availableAPIs.terminate();	}
	let pargs = {};
	let ppos = [];
	for (let arg of exec_args) {
		if (arg.startsWith("--")) {
			let key = arg.split("=")[0].slice(2);
			let value = arg.split("=").slice(1).join("=");
			if (arg.split("=")[1] == null) value = true;
			if (pargs.hasOwnProperty(key)) {
				let ogValues = pargs[key];
				if (ogValues instanceof Array) pargs[key] = [ ...ogValues, value ];
				else pargs[key] = [ ogValues, value ];
			} else pargs[key] = value;
		} else ppos.push(arg);
	}
	if (!pargs["override-modules"]) {
		await availableAPIs.toMyCLI("updateos no longer works on modular systems and will be replaced with a better version.\r\n");
		await availableAPIs.toMyCLI("To run updateos anyway, re-run with --override-modules.\r\n");
		return await availableAPIs.terminate();
	}
	await availableAPIs.toMyCLI(await availableAPIs.lookupLocale("REINSTALL_DOWNLOADING") + "\r\n");
	let osArchive;
	if (!ppos[0]) {
		try {
			osArchive = await availableAPIs.fetchSend({
				url: ppos.url || "/os.js",
				init: {}
			});
			if (!osArchive.ok) throw new Error("Non-OK response (" + osArchive.status + " " + osArchive.statusText + ")");
		} catch (e) {
			console.error(e);
			await availableAPIs.toMyCLI(await availableAPIs.lookupLocale("REINSTALL_DOWNLOAD_FAILED") + "\r\n");
			return await availableAPIs.terminate();
		}
	} else {
		try {
			osArchive = { arrayBuffer: new TextEncoder().encode(await availableAPIs.fs_read({
				path: exec_args[0]
			})) };
		} catch (e) {
			console.error(e);
			await availableAPIs.toMyCLI(await availableAPIs.lookupLocale("REINSTALL_DOWNLOAD_FAILED") + "\r\n");
			return await availableAPIs.terminate();
		}
	}
	await availableAPIs.toMyCLI(await availableAPIs.lookupLocale("REINSTALL_DECODING") + "\r\n");
	osArchive = osArchive.arrayBuffer;
	osArchive = new TextDecoder().decode(osArchive);
	let files = osArchive.split(/\/\/ [0-9]+-.+.js\n/g).slice(1);
	let names = osArchive.match(/\/\/ [0-9]+-.+.js/g);
	let appIndex = names.indexOf("// " + "1" + "5-ap" + "ps.js");
	let apps = files[appIndex].match(/async function (.+)Installer\(target, token\)/g).map(a => a.split(" ")[2].split("(")[0]);
	apps.splice(apps.indexOf("autoinstallerInstaller"), 1);
	apps.splice(apps.indexOf("installerInstaller"), 1);
	apps.splice(apps.indexOf("secondstageInstaller"), 1);
	let pipeResult = false;
	try {
		let ipcPipe = await availableAPIs.createPipe();
		pipeResult = availableAPIs.listenToPipe(ipcPipe);
		let installerCode = "";
		for (let app of apps) installerCode += `await ${app}(modules.defaultSystem, ${JSON.stringify(await availableAPIs.getProcessToken())});\n`;
		await availableAPIs.runKlvlCode(`(async function() {
			try {
				${files[appIndex]}
				${installerCode}
				modules.ipc.send(${JSON.stringify(ipcPipe)}, true);
			} catch (e) {
				console.error(e);
				modules.ipc.send(${JSON.stringify(ipcPipe)}, false);
			}
		})();`);
		pipeResult = await pipeResult;
		await availableAPIs.closePipe(ipcPipe);
	} catch {}
	if (!pipeResult) {
		await availableAPIs.toMyCLI(await availableAPIs.lookupLocale("UPDATE_EXTRA_FAIL") + "\r\n");
		return await availableAPIs.terminate();
	}
	files.splice(appIndex, 1);
	names.splice(appIndex, 1);
	let installerIndex = names.indexOf("// 1" + "0" + "-ins" + "taller.js");
	files.splice(installerIndex, 1);
	names.splice(installerIndex, 1);
	let secondStageIndex = names.indexOf("// 1" + "7" + "-instal" + "ler-seconds" + "tage.js");
	files.splice(secondStageIndex, 1);
	names.splice(secondStageIndex, 1);
	for (let file in files) {
		let name = names[file].split(" ").slice(1).join(" ");
		let content = files[file];
		try {
			await availableAPIs.toMyCLI("\t/boot/" + name + "\r\n");
			await availableAPIs.fs_write({
				path: (await availableAPIs.getSystemMount()) + "/boot/" + name,
				data: content
			});
		} catch {
			await availableAPIs.toMyCLI(await availableAPIs.lookupLocale("UPDATE_BOOT_FAIL") + "\r\n");
			return await availableAPIs.terminate();
		}
	}
	if (!pargs["no-reboot"]) {
		await availableAPIs.toMyCLI(await availableAPIs.lookupLocale("RESTARTING") + "\r\n");
		try {
			await availableAPIs.shutdown({
				isReboot: true,
				isKexec: true
			});
		} catch (e) {
			await availableAPIs.toMyCLI("updateos: " + await availableAPIs.lookupLocale(e.message) + "\r\n");
		}
	}
	await availableAPIs.terminate();
})();

addEventListener("signal", async function(e) {
	if (e.detail == 15) await window.availableAPIs.terminate();
}); null;