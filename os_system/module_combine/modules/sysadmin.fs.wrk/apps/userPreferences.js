// =====BEGIN MANIFEST=====
// signer: automaticSigner
// allow: GET_LOCALE, GET_THEME, START_TASK, IPC_CREATE_PIPE, FS_READ, FS_WRITE, FS_LIST_PARTITIONS, IPC_SEND_PIPE, GET_USER_INFO, IPC_LISTEN_PIPE, GRAB_ATTENTION
// =====END MANIFEST=====
(async function() {
	// @pcos-app-mode isolatable
	await availableAPIs.windowTitleSet(await availableAPIs.lookupLocale("USER_PREFERENCES"));
	let privileges = await availableAPIs.getPrivileges();
	let checklist = [ "FS_READ", "FS_WRITE", "GET_USER_INFO" ];
	document.body.style.fontFamily = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
	if (await availableAPIs.isDarkThemed()) document.body.style.color = "white";
	if (!checklist.every(p => privileges.includes(p))) {
		document.body.innerText = await availableAPIs.lookupLocale("USER_PREFS_ERROR");
		return;
	}
	
	let homedir = (await availableAPIs.getUserInfo({ desiredUser: await availableAPIs.getUser() })).homeDirectory;
	
	let wallpaperInputName = document.createElement("label");
	let wallpaperInput = document.createElement("input");
	let wallpaperChooser = document.createElement("button");
	let localeInputName = document.createElement("label");
	let localeInput = document.createElement("select");
	let darkModeInput = document.createElement("input");
	let darkModeInputName = document.createElement("label");
	let updatePreferences = document.createElement("button");
	let wallpaperPreview = document.createElement("img");
	let updateCooldown;

	darkModeInput.type = "checkbox";

	let locales = await availableAPIs.installedLocales();
	for (let locale of locales) {
		let option = document.createElement("option");
		option.value = locale;
		option.innerText = await availableAPIs.lookupOtherLocale({ key: "LOCALE_NAME", locale });
		localeInput.appendChild(option);
	}

	localeInput.value = await availableAPIs.locale();
	wallpaperInput.value = homedir + "/.wallpaper";

	darkModeInput.checked = await availableAPIs.isDarkThemed();

	wallpaperInput.id = "wallpaperInput";
	localeInput.id = "localeInput";
	darkModeInput.id = "darkModeInput";
	wallpaperInputName.htmlFor = "wallpaperInput";
	localeInputName.htmlFor = "localeInput";
	darkModeInputName.htmlFor = "darkModeInput";

	wallpaperInputName.innerText = await availableAPIs.lookupLocale("WALLPAPER_PATH");
	wallpaperChooser.innerText = await availableAPIs.lookupLocale("LOAD_BTN");
	localeInputName.innerText = await availableAPIs.lookupLocale("LANGUAGE_SELECT");
	darkModeInputName.innerText = await availableAPIs.lookupLocale("DARK_MODE");
	updatePreferences.innerText = await availableAPIs.lookupLocale("UPDATE_PREFERENCES");

	wallpaperPreview.width = "340";
	wallpaperPreview.height = "192";

	function updatePreview() {
		clearTimeout(updateCooldown);
		updateCooldown = setTimeout(async function() {
			try {
				wallpaperPreview.src = await availableAPIs.fs_read({ path: wallpaperInput.value });
			} catch {}
		}, 100);
	}

	wallpaperInput.oninput = updatePreview;

	wallpaperChooser.onclick = async function() {
		try {
			let ipcPipe = await availableAPIs.createPipe();
			await availableAPIs.windowVisibility(false);
			await availableAPIs.startTask({
				file: (await availableAPIs.getSystemMount()) + "/apps/filePicker.js",
				argPassed: [ipcPipe, "load", (await availableAPIs.getSystemMount()) + "/etc/wallpapers" ]
			});
			let result = await availableAPIs.listenToPipe(ipcPipe);
			await availableAPIs.closePipe(ipcPipe);
			await availableAPIs.windowVisibility(true);
			if (result.success) {
				wallpaperInput.value = result.selected;
				updatePreview();
			}
		} catch {
			await availableAPIs.windowVisibility(true);
		}
	};

	updatePreferences.onclick = async function() {
		try {
			let wallpaper = await availableAPIs.fs_read({ path: wallpaperInput.value });
			await availableAPIs.fs_write({ path: homedir + "/.wallpaper", data: wallpaper });
			await availableAPIs.fs_write({ path: homedir + "/.darkmode", data: JSON.stringify(darkModeInput.checked) });
			await availableAPIs.fs_write({ path: homedir + "/.locale", data: localeInput.value });
			try {
				await availableAPIs.windowDark(darkModeInput.checked);
				document.body.style.color = darkModeInput.checked ? "white" : "";
				await availableAPIs.setWinLocale(localeInput.value);
				await availableAPIs.desktopDark(darkModeInput.checked);
				await availableAPIs.setUILocale(localeInput.value);
				await availableAPIs.setWallpaper(wallpaper);
				htmlAlert(await availableAPIs.lookupLocale("USER_PREFS_UPDATED"));
			} catch {
				htmlAlert(await availableAPIs.lookupLocale("USER_PREFS_UPDATED_PARTIAL"));
			}
		} catch (e) {
			console.error(e);
			htmlAlert(await availableAPIs.lookupLocale("PREF_UPDATE_FAILED"));
		}
	};

	document.body.appendChild(wallpaperInputName);
	document.body.appendChild(wallpaperInput);
	document.body.appendChild(wallpaperChooser);
	document.body.appendChild(document.createElement("br"));
	document.body.appendChild(localeInputName);
	document.body.appendChild(localeInput);
	document.body.appendChild(document.createElement("br"));
	document.body.appendChild(darkModeInput);
	document.body.appendChild(darkModeInputName);
	document.body.appendChild(document.createElement("br"));
	document.body.appendChild(updatePreferences);
	document.body.appendChild(document.createElement("br"));
	document.body.appendChild(wallpaperPreview);
	updatePreview();
})();
function htmlAlert(msg) {
	let overlay = document.createElement("div");
	let overlayingMessage = document.createElement("div");
	let description = document.createElement("span");
	let buttonAccept = document.createElement("button");
	overlay.style = "position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: black; opacity: 85%;";
	overlayingMessage.style = "position: absolute; top: 0px; left: 0px; width: 100%; height: 100%; padding: 8px; box-sizing: border-box; color: white;";
	description.innerText = msg;
	buttonAccept.innerText = "Ok";
	overlayingMessage.appendChild(description);
	overlayingMessage.appendChild(document.createElement("hr"));
	overlayingMessage.appendChild(buttonAccept);
	document.body.appendChild(overlay);
	document.body.appendChild(overlayingMessage);
	buttonAccept.onclick = function() {
		overlay.remove();
		overlayingMessage.remove();
	};
}
addEventListener("signal", async function(e) {
	if (e.detail == 15) await window.availableAPIs.terminate();
}); null;