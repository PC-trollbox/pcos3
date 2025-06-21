// =====BEGIN MANIFEST=====
// association: vid, aud
// signer: automaticSigner
// allow: FS_READ, GET_LOCALE, GET_THEME, FS_BYPASS_PERMISSIONS
// =====END MANIFEST=====
(async function() {
	// @pcos-app-mode isolatable
	await window.availableAPIs.windowTitleSet(await availableAPIs.lookupLocale("VIDEO_PLAYER"));
	document.body.style.fontFamily = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
	if (await availableAPIs.isDarkThemed()) document.body.style.color = "white";
	document.body.innerHTML = "<video controls id='video' style='width: 100%; height: 100%; position: absolute; top: 0; left: 0'></video>";
	let video = document.getElementById("video");
	if (exec_args instanceof Array && typeof exec_args[0] == "string") {
		let path = exec_args[0];
		let url;
		try {
			url = await window.availableAPIs.fs_read({ path });
		} catch (e) {
			console.error(e);
			document.body.innerText = (await availableAPIs.lookupLocale("INACCESSIBLE_FILE")).replace("%s", path);
		}
		video.src = url;
	} else {
		document.body.innerHTML = await availableAPIs.lookupLocale("FILE_NOT_SPECIFIED");
	}
})();
addEventListener("signal", async function(e) {
	if (e.detail == 15) await window.availableAPIs.terminate();
});