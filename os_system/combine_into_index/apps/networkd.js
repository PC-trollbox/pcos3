// =====BEGIN MANIFEST=====
// signer: automaticSigner
// fnName: networkdInstaller
// allow: IDENTIFY_SYSTEM, CSP_OPERATIONS, FS_READ, FS_WRITE, FS_REMOVE, FS_LIST_PARTITIONS, IDENTIFY_SYSTEM_SENSITIVE, SYSTEM_STABILITY, WEBSOCKETS_OPEN, WEBSOCKETS_SEND, WEBSOCKETS_LISTEN, FS_BYPASS_PERMISSIONS
// =====END MANIFEST=====
let hexToU8A = (hex) => Uint8Array.from(hex.match(/.{1,2}/g).map(a => parseInt(a, 16)));
let u8aToHex = (u8a) => Array.from(u8a).map(a => a.toString(16).padStart(2, "0")).join("");
(async function() {
    // @pcos-app-mode isolatable
    let reachedStableCon = false;
    let softConnection = exec_args.includes("--soft-connection");
    await availableAPIs.windowTitleSet("PCOS Network");
    await availableAPIs.attachCLI();
    await availableAPIs.toMyCLI("Scanning privileges...\r\n");
    let privileges = await availableAPIs.getPrivileges();
    let checklist = [ "IDENTIFY_SYSTEM", "CSP_OPERATIONS", "FS_READ", "FS_WRITE", "FS_REMOVE", "FS_LIST_PARTITIONS", "IDENTIFY_SYSTEM_SENSITIVE", "SYSTEM_STABILITY", "WEBSOCKETS_OPEN", "WEBSOCKETS_SEND", "WEBSOCKETS_LISTEN", "FS_BYPASS_PERMISSIONS" ];
    if (!checklist.every(p => privileges.includes(p))) return availableAPIs.terminate();
    await availableAPIs.toMyCLI("Marking as critical...\r\n");
    await availableAPIs.critical(true);
    let existingConfig = {};
    await availableAPIs.toMyCLI("Reading config...\r\n");
    try {
        existingConfig = JSON.parse(await availableAPIs.fs_read({
            path: (await availableAPIs.getSystemMount()) + "/etc/network.json"
        }));
    } catch {
        return availableAPIs.terminate();
    }
    await availableAPIs.toMyCLI("Opening websocket...\r\n");
    let ws = await availableAPIs.websocketOpen(existingConfig.url);
    let messageWait = availableAPIs.listenToWebsocket({ handle: ws, eventName: "message" });
    async function terminateOnClose() {
        await availableAPIs.listenToWebsocket({ handle: ws, eventName: "close" });
        reachedStableCon = false;
        initTermination("ConnectionClose");
    }
    terminateOnClose();
    await availableAPIs.toMyCLI("Importing system ID...\r\n");
    let sentPsi = await availableAPIs.getPublicSystemID();
    sentPsi.userCustomizable = existingConfig.ucBits;
    sentPsi.forceConnect = !softConnection;
    let privateKeyImport = await availableAPIs.cspOperation({
        cspProvider: "basic",
        operation: "importKey",
        cspArgument: {
            format: "jwk",
            keyData: await availableAPIs.getPrivateSystemID(),
            algorithm: {
                name: "ECDSA",
                namedCurve: "P-256"
            },
            extractable: true,
            keyUsages: [ "sign" ]
        }
    });
    async function initTermination(terminateReason) {
        await availableAPIs.toMyCLI("Wrapping up: " + terminateReason + "...\r\n");
        try {
            await availableAPIs.fs_rm({ path: "ram/run/network.ws" });
        } catch {}
        try {
            await availableAPIs.fs_rm({ path: "ram/run/networkAddress" });
        } catch {}
        await availableAPIs.fs_write({
            path: "ram/run/network.log",
            data: "CloseReason;" + terminateReason
        });
        await availableAPIs.cspOperation({
            cspProvider: "basic",
            operation: "unloadKey",
            cspArgument: privateKeyImport
        });
        try {
            if (reachedStableCon) {
                await availableAPIs.fs_rm({ path: "ram/run/networkAddress" });
                await availableAPIs.sendToWebsocket({ handle: ws, data: JSON.stringify({ finalProxyPacket: true }) });
                await availableAPIs.listenToWebsocket({ handle: ws, eventName: "close" });
            }
        } catch {}
        await availableAPIs.closeWebsocket(ws);
        await availableAPIs.terminate();
    }
    addEventListener("signal", async function(e) {
        if (e.detail == 15) await initTermination("ProcessSignal");
    });
    await availableAPIs.toMyCLI("At this point termination is possible.\r\n");
    await messageWait;
    await availableAPIs.sendToWebsocket({ handle: ws, data: JSON.stringify(sentPsi) });
    let dataToSign;
    while (true) {
        dataToSign = JSON.parse(await availableAPIs.listenToWebsocket({ handle: ws, eventName: "message" }));
        if (dataToSign.event == "PublicKeyInvalid") initTermination(dataToSign);
        break;
    }
    await availableAPIs.toMyCLI("Signing authentication...\r\n");
    dataToSign = hexToU8A(dataToSign.signBytes);
    let signature = await availableAPIs.cspOperation({
        cspProvider: "basic",
        operation: "sign",
        cspArgument: {
            algorithm: {
                name: "ECDSA",
                hash: {
                    name: "SHA-256"
                }
            },
            key: privateKeyImport,
            data: dataToSign
        }
    });
    signature = u8aToHex(new Uint8Array(signature));
    await availableAPIs.sendToWebsocket({ handle: ws, data: signature });
    let connectionData;
    while (true) {
        connectionData = JSON.parse(await availableAPIs.listenToWebsocket({ handle: ws, eventName: "message" }));
        if (connectionData.event == "SignatureInvalid") initTermination(connectionData.event);
        if (connectionData.event == "AddressConflict") initTermination(connectionData.event);
        break;
    }
    await availableAPIs.toMyCLI("We are on the network! " + connectionData.address + "\r\n");
    await availableAPIs.fs_write({
        path: "ram/run/networkAddress",
        data: connectionData.address
    });
    await availableAPIs.fs_write({
        path: "ram/run/network.ws",
        data: ws
    });
    async function eventLoop() {
        while (true) {
            let message = JSON.parse(await availableAPIs.listenToWebsocket({ handle: ws, eventName: "message" }));
            if (!message.from) continue;
            if (message.data.type == "ping") {
                if (typeof message.data.resend !== "string") continue;
                if (message.data.resend.length > 64) continue;
                await availableAPIs.sendToWebsocket({ handle: ws, data: JSON.stringify({
                    receiver: message.from,
                    data: {
                        type: "pong",
                        resend: message.data.resend
                    }
                })});
            }
        }
    }
    reachedStableCon = true;
    eventLoop();
})(); null;