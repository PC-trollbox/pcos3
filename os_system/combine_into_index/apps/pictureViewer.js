// =====BEGIN MANIFEST=====
// association: pic
// signer: automaticSigner
// fnName: pictureInstaller
// allow: FS_READ, GET_LOCALE, GET_THEME, FS_BYPASS_PERMISSIONS
// =====END MANIFEST=====
(async function() {
	// @pcos-app-mode isolatable
	await window.availableAPIs.windowTitleSet(await availableAPIs.lookupLocale("PICTURE_VIEWER"));
	document.body.style.fontFamily = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
	if (await availableAPIs.isDarkThemed()) document.body.style.color = "white";
	if (exec_args instanceof Array && typeof exec_args[0] == "string") {
		let path = exec_args[0];
		try {
			let div = document.createElement("div");
			div.style = "background: url(" + JSON.stringify(await window.availableAPIs.fs_read({ path })) + ")";
			div.style.backgroundSize = "contain";
			div.style.backgroundRepeat = "no-repeat";
			div.style.backgroundPosition = "center";
			div.style.position = "absolute";
			div.style.top = "0";
			div.style.left = "0";
			div.style.width = "100%";
			div.style.height = "100%";
			div.style.margin = "0";
			document.body.appendChild(div);
		} catch (e) {
			console.error(e);
			document.body.innerText = (await availableAPIs.lookupLocale("INACCESSIBLE_FILE")).replace("%s", path);
		}
	} else {
		document.body.innerHTML = await availableAPIs.lookupLocale("FILE_NOT_SPECIFIED");
	}
})();
addEventListener("signal", async function(e) {
	if (e.detail == 15) await window.availableAPIs.terminate();
});