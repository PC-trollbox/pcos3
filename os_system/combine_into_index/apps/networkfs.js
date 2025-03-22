// =====BEGIN MANIFEST=====
// allow: GET_LOCALE, RESOLVE_NAME, CONNFUL_CONNECT, IPC_CREATE_PIPE, FS_MOUNT, IPC_LISTEN_PIPE, CONNFUL_WRITE, CONNFUL_READ, IPC_SEND_PIPE, FS_READ
// signer: automaticSigner
// =====END MANIFEST=====
function IPv6Decompressor(ip) {
    let array = ip.split(":");
    array = array.slice(0, 8);
    let foundTwoOrMoreZeroes = array.indexOf("");
    while (array.length != 8 && foundTwoOrMoreZeroes !== null) array.splice(foundTwoOrMoreZeroes, 0, "0000");
    array = array.map(a => parseInt(a || "0", 16).toString(16).padStart(4, "0"));
    return array.join(":");
}
(async function() {
	// @pcos-app-mode isolatable
	if (!(await availableAPIs.getPrivileges()).includes("GET_LOCALE")) { await availableAPIs.toMyCLI("networkfs: Locale permission denied\r\n");
		return await availableAPIs.terminate();	}
	await availableAPIs.attachCLI();
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

	if (ppos.length < 2) {
		await availableAPIs.toMyCLI(await availableAPIs.lookupLocale("NETWORKFS_USAGE") + "\r\n");
		await availableAPIs.toMyCLI(await availableAPIs.lookupLocale("NETWORKFS_DESCRIPTION") + "\r\n");
		await availableAPIs.toMyCLI("\t" + await availableAPIs.lookupLocale("NETWORKFS_NOVERIFY") + "\r\n");
        await availableAPIs.toMyCLI("\t" + await availableAPIs.lookupLocale("NETWORKFS_KEY") + "\r\n");
        await availableAPIs.toMyCLI("networkfs: " + await availableAPIs.lookupLocale("NO_ARGUMENTS") + "\r\n");
		await availableAPIs.terminate();
	}
    let inPipe, outPipe, conn;
	try {
        let url = new URL(ppos[0]);
        if (url.protocol != "netfs:") throw new Error(await availableAPIs.lookupLocale("NETWORKFS_PROTO"));
        if (url.port) throw new Error(await availableAPIs.lookupLocale("BLOG_BROWSER_GATESET"));
        let hostname = url.hostname, address;
        if (url.hostname.includes("[")) {
            hostname = IPv6Decompressor(url.hostname.slice(1, -1)).replaceAll(":", "");
            address = hostname;
        } else address = await availableAPIs.resolve(hostname);
        if (!address) throw new Error(await availableAPIs.lookupLocale("HOSTNAME_RESOLUTION_FAILED"));
        conn = await availableAPIs.connfulConnect({
            gate: url.username || "netfs",
            address,
            verifyByDomain: hostname,
            key: pargs.key ? JSON.parse(await availableAPIs.fs_read({
                path: pargs.key
            })).key : undefined,
            private: pargs.key ? JSON.parse(await availableAPIs.fs_read({
                path: pargs.key
            })).private : undefined,
            doNotVerifyServer: pargs["no-verification"]
        });
        await availableAPIs.connfulConnectionSettled(conn);
        inPipe = await availableAPIs.createPipe();
        outPipe = await availableAPIs.createPipe();
        let pipe2conn = (async function() {
            while (true) {
                let listenToPipe = await availableAPIs.listenToPipe(inPipe);
                availableAPIs.connfulWrite({
                    connectionID: conn,
                    data: JSON.stringify(listenToPipe)
                });
            }
        })();
        let conn2pipe = (async function() {
            while (true) {
                let networkListen = await availableAPIs.connfulRead(conn);
                availableAPIs.sendToPipe({
                    pipe: outPipe,
                    data: JSON.parse(networkListen)
                });
            }
        })();
        await availableAPIs.fs_mount({
            mountpoint: ppos[1],
            filesystem: "IPCMount",
            filesystemOptions: {
                inputPipeId: inPipe,
                outputPipeId: outPipe
            }
        });
        await Promise.all([pipe2conn, conn2pipe]);
	} catch (e) {
		await availableAPIs.toMyCLI("networkfs: " + await availableAPIs.lookupLocale(e.message) + "\r\n");
	}
	await availableAPIs.terminate();
})();

addEventListener("signal", async function(e) {
	if (e.detail == 15) await window.availableAPIs.terminate();
}); null;