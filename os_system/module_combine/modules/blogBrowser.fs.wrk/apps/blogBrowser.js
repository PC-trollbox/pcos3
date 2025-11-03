// =====BEGIN MANIFEST=====
// signer: automaticSigner
// link: lrn:BLOG_BROWSER_NAME
// allow: GET_LOCALE, GET_THEME, IPC_CREATE_PIPE, IPC_LISTEN_PIPE, START_TASK, FS_READ, FS_WRITE, FS_LIST_PARTITIONS, IPC_SEND_PIPE, FS_BYPASS_PERMISSIONS, RESOLVE_NAME, CONNFUL_CONNECT, CONNFUL_DISCONNECT, CONNFUL_WRITE, CONNFUL_READ, CONNFUL_ADDRESS_GET, CONNFUL_IDENTITY_GET, GET_USER_INFO, CSP_OPERATIONS
// =====END MANIFEST=====
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
function IPv6Decompressor(ip) {
	let array = ip.split(":");
	array = array.slice(0, 8);
	let foundTwoOrMoreZeroes = array.indexOf("");
	while (array.length != 8 && foundTwoOrMoreZeroes !== null) array.splice(foundTwoOrMoreZeroes, 0, "0000");
	array = array.map(a => parseInt(a || "0", 16).toString(16).padStart(4, "0"));
	return array.join(":");
}
(async function() {
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
	// @pcos-app-mode isolatable
	await availableAPIs.windowTitleSet(await availableAPIs.lookupLocale("BLOG_BROWSER_NAME"));
	document.body.style.fontFamily = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
	if (await availableAPIs.isDarkThemed()) document.body.style.color = "white";
	document.body.innerText = "";
	document.documentElement.style.height = "100%";
	document.documentElement.style.width = "100%";
	document.body.style.height = "100%";
	document.body.style.width = "100%";
	document.body.style.margin = "0";
	let browserContainer = document.createElement("div");
	let urlBar = document.createElement("form");
	let urlInput = document.createElement("input");
	let urlButton = document.createElement("button");
	let theWebsite = document.createElement("div");
	browserContainer.style.display = "flex";
	browserContainer.style.flexDirection = "column";
	browserContainer.style.width = "100%";
	browserContainer.style.height = "100%";
	urlBar.style.display = "flex";
	urlBar.style.flexDirection = "row";
	urlBar.style.width = "100%";
	urlInput.style.flexGrow = "1";
	theWebsite.style.flexGrow = "1";
	urlBar.appendChild(urlInput);
	urlBar.appendChild(urlButton);
	urlButton.innerText = "->";
	browserContainer.appendChild(urlBar);
	browserContainer.appendChild(theWebsite);
	document.body.appendChild(browserContainer);
	let ree;
	urlButton.onclick = async function() {
		urlInput.disabled = true;
		urlButton.disabled = true;
		if (ree) ree.closeDown();
		ree = null;
		theWebsite.hidden = false;
		theWebsite.innerText = await availableAPIs.lookupLocale("BLOG_BROWSER_LOADING");
		try {
			let url = new URL(urlInput.value);
			urlInput.value = url.href;
			if (url.protocol != "bdp:") throw new Error(await availableAPIs.lookupLocale("BLOG_BROWSER_PROTO"));
			if (url.port) throw new Error(await availableAPIs.lookupLocale("BLOG_BROWSER_GATESET"));
			if (pargs["no-verification"]) 
				await new Promise(async function(ok, ab) {
					let allowNoVerify = document.createElement("button");
					let abort = document.createElement("button");
					theWebsite.innerText = await availableAPIs.lookupLocale("BLOG_BROWSER_NOVERIFY");
					allowNoVerify.innerText = await availableAPIs.lookupLocale("YES");
					abort.innerText = await availableAPIs.lookupLocale("NO");
					allowNoVerify.onclick = async function() {
						theWebsite.innerText = await availableAPIs.lookupLocale("BLOG_BROWSER_LOADING");
						ok();
					}
					abort.onclick = async _ => ab(new Error(await availableAPIs.lookupLocale("SERVER_SIGNATURE_VERIFICATION_FAILED")));
					theWebsite.appendChild(allowNoVerify);
					theWebsite.appendChild(abort);
				});
			if (pargs["no-sandbox"]) 
				await new Promise(async function(ok, ab) {
					let allowNoVerify = document.createElement("button");
					let abort = document.createElement("button");
					theWebsite.innerText = await availableAPIs.lookupLocale("BLOG_BROWSER_NOSANDBOX");
					allowNoVerify.innerText = await availableAPIs.lookupLocale("YES");
					abort.innerText = await availableAPIs.lookupLocale("NO");
					allowNoVerify.onclick = async function() {
						theWebsite.innerText = await availableAPIs.lookupLocale("BLOG_BROWSER_LOADING");
						ok();
					}
					abort.onclick = async _ => ab(new Error(await availableAPIs.lookupLocale("PERMISSION_DENIED")));
					theWebsite.appendChild(allowNoVerify);
					theWebsite.appendChild(abort);
				});
			let hostname = url.hostname, address;
			if (url.hostname.includes("[")) {
				hostname = IPv6Decompressor(url.hostname.slice(1, -1)).replaceAll(":", "");
				address = hostname;
			} else address = await availableAPIs.resolve(hostname);
			if (!address) throw new Error(await availableAPIs.lookupLocale("HOSTNAME_RESOLUTION_FAILED"));
			let connection = await availableAPIs.connfulConnect({
				gate: url.username || "blog",
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
			await availableAPIs.connfulConnectionSettled(connection);
			await availableAPIs.connfulWrite({
				connectionID: connection,
				data: new TextEncoder().encode(url.pathname + url.search),
				host: hostname
			});
			let data = new TextDecoder().decode(await availableAPIs.connfulRead(connection));
			data = JSON.parse(data);
			let chunks = [];
			theWebsite.innerText = (await availableAPIs.lookupLocale("BLOG_BROWSER_LOADING_PROGRESS")).replace("%s", "0").replace("%s", data.length);
			while (chunks.length != data.length) {
				let newData = new TextDecoder().decode(await availableAPIs.connfulRead(connection));
				newData = JSON.parse(newData);
				chunks[newData.ctr] = newData.chunk;
				theWebsite.innerText = (await availableAPIs.lookupLocale("BLOG_BROWSER_LOADING_PROGRESS")).replace("%s", chunks.length).replace("%s", data.length);
			}
			try {
				await availableAPIs.connfulClose(connection);
			} catch {}
			data.content = chunks.join("");
			if (data.type == "script") {
				theWebsite.innerText = "";
				ree = await createREE(browserContainer);
				ree.iframe.style = "flex-grow: 1; border: none; overflow: auto;";
				theWebsite.hidden = true;
				let passthroughAPIs = [
					// UI class
					"isDarkThemed", "locale", "osLocale", "lookupLocale", "installedLocales",
					// cryptographic class
					"cspOperation", "availableCsps",
					// connful connections class
					"connfulConnect", "connfulConnectionSettled", "connfulDisconnect", "connfulForceDisconnect", "connfulWrite", "connfulRead", "connfulAddressGet", "connfulIdentityGet"
				];
				if (pargs["no-sandbox"]) passthroughAPIs = Object.keys(availableAPIs);
				for (let api of passthroughAPIs) await ree.exportAPI(api, e => availableAPIs[api](e.arg));
				await ree.exportAPI("terminate", _ => ree.closeDown());
				await ree.exportAPI("navigate", function(newUrl) {
					urlInput.value = new URL(newUrl.arg, urlInput.value).href;
					urlButton.click();
					ree.closeDown();
				});
				await ree.exportAPI("currentLocation", _ => urlInput.value);
				ree.beforeCloseDown(async function() {
					theWebsite.hidden = false;
					theWebsite.innerText = await availableAPIs.lookupLocale("BLOG_BROWSER_POSTCLOSE");
				});
				await ree.eval(data.content);
			} else if (data.type == "file") {
				theWebsite.innerHTML = await availableAPIs.lookupLocale("BLOG_BROWSER_FILEPOST");
				let ipcPipe = await availableAPIs.createPipe();
				await availableAPIs.windowVisibility(false);
				await availableAPIs.startTask({ file: (await availableAPIs.getSystemMount()) + "/apps/filePicker.js", argPassed: [ipcPipe, "save", data.filename || urlBar.value.split("/").slice(-1)[0]] });
				let result = await availableAPIs.listenToPipe(ipcPipe);
				await availableAPIs.closePipe(ipcPipe);
				await availableAPIs.windowVisibility(true);
				if (result.success) {
					await availableAPIs.fs_write({ path: result.selected, data: data.content });
					theWebsite.innerHTML = await availableAPIs.lookupLocale("BLOG_BROWSER_DLFILEPOST");
				}
			}
		} catch (e) {
			if (ree) ree.closeDown();
			theWebsite.hidden = false;
			theWebsite.innerText = await availableAPIs.lookupLocale(e.message);
		}
		urlInput.disabled = false;
		urlButton.disabled = false;
	}
	if (ppos[0]) {
		urlInput.value = ppos[0];
		urlButton.click();
	}
})();
addEventListener("signal", async function(e) {
	if (e.detail == 15) await window.availableAPIs.terminate();
}); null;