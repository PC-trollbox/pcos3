// Server/client interaction: Client
let connection = await availableAPIs.connfulConnect({
    address: "d2e1e3dd9cfee80fab81662f00000001",
    gate: "test",
    doNotVerifyServer: true
});
console.log("Client: Waiting for settlement", connection);
await availableAPIs.connfulConnectionSettled(connection);
console.log("Client: Listening for any data", connection);
console.log(await availableAPIs.connfulRead(connection));