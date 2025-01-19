// Server/client interaction: Server
let signingKey = await crypto.subtle.generateKey({name: "ECDSA", namedCurve: "P-256"}, true, ["sign","verify"]); // Server key
let exportedSK = await crypto.subtle.exportKey("jwk", signingKey.publicKey); 
exportedSK = {usages: ["connfulSecureServer:d2e1e3dd9cfee80fab81662f00000001"], key:exportedSK}; 
exportedSK = {keyInfo:exportedSK,signature:null}; 
let exportedSK2 = await crypto.subtle.exportKey("jwk", signingKey.privateKey);

let serverListening = await availableAPIs.connfulListen({
    gate: "test",
    key: exportedSK,
    private: exportedSK2
});

while (true) {
    console.log("Server: Ready to serve people");
    let connection = await availableAPIs.connfulListenConnections(serverListening);
    console.log("Server: Sending data", connection);
    await availableAPIs.connfulWrite({
        connectionID: connection,
        data: "Hello, world!"
    });
    console.log("Server: Now disconnecting", connection);
    await availableAPIs.connfulDisconnect(connection);
}