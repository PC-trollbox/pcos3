function createREE(direction) {
    let ownIframeID = undefined;
    try {
        ownIframeID = iframeId;
    } catch {}
    return new Promise(function(resolve) {
        let iframe = document.createElement("iframe");
        let iframeId = crypto.getRandomValues(new Uint8Array(64)).reduce((a, b) => a + b.toString(16).padStart(2, "0"), "");
        let prefix = ownIframeID ? (ownIframeID + "_") : "";
        iframeId = prefix + iframeId;
        iframe.src = "data:text/html;base64," + btoa("<!DOCTYPE HTML>\n<script>const iframeId = " + JSON.stringify(iframeId) + ";\n" + reed.toString() + "\nreed();</script>");
        iframe.style.border = "none";
        iframe.setAttribute("credentialless", "true");
        iframe.sandbox = "allow-scripts";
        direction.appendChild(iframe);
        let prezhn = [];
        let prerm = [];
        iframe.addEventListener("load", function s() {
            iframe.removeEventListener("load", s);
            return resolve({
                iframe,
                exportAPI: function(id, fn) {
                    iframe.contentWindow.postMessage({type: "export_api", id: id, iframeId}, "*");
                    async function prezhn_it(e) {
                        if (e.data.iframeId != iframeId) return;
                        if (e.data.id != id) return;
                        if (e.data.type != "call_api") return;
                        try {
                            e.source.postMessage({
                                result: await fn({
                                    caller: iframeId,
                                    arg: e.data.arg
                                }),
                                type: "api_response",
                                responseToken: e.data.responseToken,
                                iframeId
                            }, "*");
                        } catch (er) {
                            e.source.postMessage({
                                result: {
                                    name: er.name,
                                    message: er.message
                                },
                                type: "api_error",
                                responseToken: e.data.responseToken,
                                iframeId
                            }, "*");
                        }
                    }
                    window.addEventListener("message", prezhn_it);
                    prezhn.push(prezhn_it);
                },
                eval: function(code) {
                    let responseToken = crypto.getRandomValues(new Uint8Array(64)).reduce((a, b) => a + b.toString(16).padStart(2, "0"), "");
                    return new Promise(function(resolve, reject) {
                        iframe.contentWindow.postMessage({type: "run", code, responseToken, iframeId}, "*");
                        function sel(e) {
                            if (e.data.iframeId != iframeId) return;
                            if (e.data.responseToken != responseToken) return;
                            prezhn = prezhn.filter(x => x != sel);
                            window.removeEventListener("message", sel);
                            if (e.data.type == "ran_response")
                                resolve(e.data.result);
                            else if (e.data.type == "ran_error")
                                reject(e.data.result);
                        };
                        window.addEventListener("message", sel);
                        prezhn.push(sel);
                    });
                },
                closeDown: async function() {
                    for (let i of prerm) await i(this);
                    prerm = [];
                    for (let i in prezhn) window.removeEventListener("message", prezhn[i]);
                    iframe.remove();
                    iframe = null;
                },
                beforeCloseDown: function(fn) {
                    prerm.push(fn);
                },
                iframeId
            });
        });
    });
}

// reed() is for in-iframe use only
function reed() {
    window.availableAPIs = {};
    window.addEventListener("message", function(e) {
        if (e.data.iframeId != iframeId && !e.data.iframeId.startsWith(iframeId + "_")) {
            e.stopImmediatePropagation();
            e.stopPropagation();
            e.preventDefault();
            return false;
        }
        if (e.data.iframeId.startsWith(iframeId + "_")) return true;
        if (e.data.type == "export_api") {
            window.availableAPIs[e.data.id] = function(arg) {
                return new Promise(function(resolve, reject) {
                    let responseToken = crypto.getRandomValues(new Uint8Array(64)).reduce((a, b) => a + b.toString(16).padStart(2, "0"), "");
                    e.source.postMessage({
                        type: "call_api",
                        id: e.data.id,
                        arg,
                        responseToken: responseToken,
                        iframeId
                    }, "*");
                    addEventListener("message", function selv(e) {
                        if (e.data.iframeId != iframeId) return;
                        if (e.data.responseToken != responseToken) return;
                        window.removeEventListener("message", selv);
                        if (e.data.type == "api_response")
                            resolve(e.data.result);
                        else if (e.data.type == "api_error")
                            reject(e.data.result);
                    });
                })
            }
        } else if (e.data.type == "unexport_api") {
            delete window.availableAPIs[e.data.id];
        } else if (e.data.type == "run") {
            try {
                e.source.postMessage({
                    type: "ran_response",
                    result: eval(e.data.code),
                    responseToken: e.data.responseToken,
                    iframeId
                }, "*");
            } catch (e2) {
                e.source.postMessage({
                    type: "ran_error",
                    result: {
                        name: e2.name,
                        message: e2.message,
                        stack: e2.stack
                    },
                    responseToken: e.data.responseToken,
                    iframeId
                }, "*");
            }
        }
    });
}