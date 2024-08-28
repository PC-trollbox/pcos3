async function ksk() {
    // @pcos-app-mode native
    // Key signing key
    let ksk = {stub:"present"};
    if (ksk.stub == "present") {
        let e = new Error("The key signing key was not built into this build.");
        panic("KEY_SIGNING_KEY_NOT_BUILT", {
            name: "ksk",
            params: [ "stub" ],
            underlyingJS: e
        });
        throw e;
    }
    if (ksk.stub != "present") modules.ksk = ksk;
    if (modules.ksk) {
        try {
            modules.ksk_imported = await crypto.subtle.importKey("jwk", modules.ksk, {
                name: "ECDSA",
                namedCurve: "P-256"
            }, false, ["verify"]);
        } catch (e) {
            panic("KEY_SIGNING_KEY_IMPORT_FAILED", {
                name: "ksk",
                underlyingJS: e
            });
            throw e;
        }
    }
}
await ksk();