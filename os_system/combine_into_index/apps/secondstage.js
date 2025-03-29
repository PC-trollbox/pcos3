// =====BEGIN MANIFEST=====
// signer: automaticSigner
// allow: GET_LOCALE, GET_THEME, CSP_OPERATIONS, FS_READ, FS_WRITE, FS_BYPASS_PERMISSIONS, FS_LIST_PARTITIONS, SET_USER_INFO, RUN_KLVL_CODE, FS_CHANGE_PERMISSION, FS_REMOVE, SYSTEM_SHUTDOWN, GET_SERVER_URL
// =====END MANIFEST=====
(async function() {
	// @pcos-app-mode isolatable
	document.body.style.fontFamily = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
	if (await availableAPIs.isDarkThemed()) document.body.style.color = "white";
	await availableAPIs.windowTitleSet(await availableAPIs.lookupLocale("SET_UP_PCOS"));
	let privileges = await availableAPIs.getPrivileges();
	let checklist = [ "CSP_OPERATIONS", "FS_READ", "FS_WRITE", "FS_BYPASS_PERMISSIONS", "FS_LIST_PARTITIONS", "SET_USER_INFO", "RUN_KLVL_CODE", "FS_CHANGE_PERMISSION", "FS_REMOVE", "SYSTEM_SHUTDOWN", "GET_SERVER_URL" ];
	if (!checklist.every(p => privileges.includes(p))) {
		document.body.innerText = await availableAPIs.lookupLocale("SETUP_FAILED");
		return;
	}
	await availableAPIs.closeability(false);
	let networkDefaultURL = new URL(await availableAPIs.runningServer());
	networkDefaultURL.protocol = "ws" + (networkDefaultURL.protocol == "https:" ? "s" : "") + ":";
	networkDefaultURL.pathname = "";
	const networkSymbols = "abcdefghijklmnopqrstuvwxyz0123456789_-";
	let automatic_configuration = {
		/*startSetup: true,*/
		createAccount: {
			/*password: "password",
			darkMode: true,
			create: true,
			defaultLocale: "en",*/
			username: "root",
			lockUsername: true,
			onlyOnNewInstall: true
		},
		updateOSLink: true,
		appHarden: {
			requireSignature: true,
			requireAllowlist: true
		},
		network: {
			url: networkDefaultURL.toString(),
			ucBits: 1,
			hostname: new Array(16).fill(0).map(a => networkSymbols[Math.floor(Math.random() * networkSymbols.length)]).join(""),
			updates: "pcosserver.pc"
		},
		autoClose: true,
		restartOnClose: "kexec"
	};
	let defaultSystem = await availableAPIs.getSystemMount();
	let header = document.createElement("b");
	let postHeader = document.createElement("br");
	let description = document.createElement("span");
	let content = document.createElement("div");
	let button = document.createElement("button");
	header.innerText = await availableAPIs.lookupLocale("INSTALLER_TITLE");
	description.innerText = await availableAPIs.lookupLocale("LET_SETUP_SYSTEM");
	button.innerText = await availableAPIs.lookupLocale("SET_UP");
	document.body.appendChild(header);
	document.body.appendChild(postHeader);
	document.body.appendChild(description);
	document.body.appendChild(content);
	document.body.appendChild(button);
	button.onclick = async function() {
		header.remove();
		postHeader.remove();
		content.innerHTML = "";
		description.innerText = await availableAPIs.lookupLocale("LET_CREATE_ACCOUNT");
		button.innerText = await availableAPIs.lookupLocale("CREATE");
		let useraccountname = document.createElement("input");
		let useraccountpassword = document.createElement("input");
		let darkmode = document.createElement("input");
		let darkmode_lb = document.createElement("label");
		let language = document.createElement("select");
		let language_lb = document.createElement("label");
		useraccountname.placeholder = await availableAPIs.lookupLocale("USERNAME");
		useraccountpassword.placeholder = await availableAPIs.lookupLocale("PASSWORD");
		useraccountpassword.type = "password";
		darkmode.type = "checkbox";
		darkmode.id = "darkmode";
		language.id = "language";
		darkmode_lb.innerText = await availableAPIs.lookupLocale("DARK_MODE");
		darkmode_lb.htmlFor = "darkmode";
		language_lb.innerText = await availableAPIs.lookupLocale("LANGUAGE_SELECT");
		language_lb.htmlFor = "language";
		content.appendChild(useraccountname);
		content.appendChild(document.createElement("br"));
		content.appendChild(useraccountpassword);
		content.appendChild(document.createElement("br"));
		content.appendChild(darkmode);
		content.appendChild(darkmode_lb);
		content.appendChild(document.createElement("br"));
		content.appendChild(language_lb);
		content.appendChild(language);
		let locales = await availableAPIs.installedLocales();
		for (let locale of locales) {
			let option = document.createElement("option");
			option.value = locale;
			option.innerText = await availableAPIs.lookupOtherLocale({ key: "LOCALE_NAME", locale });
			language.appendChild(option);
		}
		language.value = await availableAPIs.osLocale();
		button.onclick = async function() {
			let username = useraccountname.value;
			let password = useraccountpassword.value;
			if (!username) return;
			if (username.includes("/")) return;
			if (!password) return;
			let homedir = username == "root" ? (defaultSystem + "/root") : (defaultSystem + "/home/" + username);
			let darkModeChecked = darkmode.checked;
			content.innerHTML = "";
			button.hidden = true;
			description.innerHTML = (await availableAPIs.lookupLocale("INSTALLING_PCOS")).replace("%s", await availableAPIs.lookupLocale("INSTALLING_SYSTEM_APPHARDEN"));
			if (automatic_configuration.appHarden) await availableAPIs.fs_write({
				path: defaultSystem + "/etc/appHarden",
				data: JSON.stringify(automatic_configuration.appHarden)
			});
			description.innerHTML = (await availableAPIs.lookupLocale("INSTALLING_PCOS")).replace("%s", await availableAPIs.lookupLocale("INSTALLING_NET_CONF"));
			if (automatic_configuration.network) await availableAPIs.fs_write({
				path: defaultSystem + "/etc/network.json",
				data: JSON.stringify(automatic_configuration.network)
			})
			if (!(automatic_configuration?.createAccount?.onlyOnNewInstall && exec_args.includes("usersConfigured"))) {
				description.innerHTML = (await availableAPIs.lookupLocale("INSTALLING_PCOS")).replace("%s", await availableAPIs.lookupLocale("CREATING_USER"));
				let salt = await availableAPIs.cspOperation({
					cspProvider: "basic",
					operation: "random",
					cspArgument: new Uint8Array(64)
				});
				let u8aToHex = (u8a) => Array.from(u8a).map(a => a.toString(16).padStart(2, "0")).join("");
				let key = await availableAPIs.cspOperation({
					cspProvider: "basic",
					operation: "importKey",
					cspArgument: {
						format: "raw",
						keyData: new TextEncoder().encode(password),
						algorithm: {
							name: "PBKDF2"
						},
						extractable: false,
						keyUsages: ["deriveBits", "deriveKey"]
					}
				});
				let derived = new Uint8Array(await availableAPIs.cspOperation({
					cspProvider: "basic",
					operation: "deriveBits",
					cspArgument: {
						algorithm: {
							name: "PBKDF2",
							salt: salt,
							iterations: 100000,
							hash: "SHA-256"
						},
						baseKey: key,
						length: 256
					}
				}));
				await availableAPIs.cspOperation({
					cspProvider: "basic",
					operation: "unloadKey",
					cspArgument: key
				});
				await availableAPIs.setUserInfo({
					desiredUser: username,
					info: {
						securityChecks: [
							{
								type: "pbkdf2",
								hash: u8aToHex(derived),
								salt: u8aToHex(salt)
							}
						],
						groups: [ username, "users" ],
						homeDirectory: homedir,
						blankPrivileges: false
					}
				});
			}
			description.innerHTML = (await availableAPIs.lookupLocale("INSTALLING_PCOS")).replace("%s", await availableAPIs.lookupLocale("CREATING_USER_HOME"));
			try {
				await availableAPIs.fs_mkdir({ path: defaultSystem + "/home" });
			} catch {}
			try {
				await availableAPIs.fs_mkdir({ path: homedir });
			} catch {}
			try {
				await availableAPIs.fs_mkdir({ path: homedir + "/desktop" });
			} catch {}
			await availableAPIs.fs_chown({ path: homedir, newUser: username });
			await availableAPIs.fs_chgrp({ path: homedir, newGrp: username });
			await availableAPIs.fs_chmod({ path: homedir, newPermissions: "rx" });
			await availableAPIs.fs_chown({ path: homedir + "/desktop", newUser: username });
			await availableAPIs.fs_chgrp({ path: homedir + "/desktop", newGrp: username });
			await availableAPIs.fs_chmod({ path: homedir + "/desktop", newPermissions: "rx" });
			if (automatic_configuration.updateOSLink) {
				await availableAPIs.fs_write({
					path: homedir + "/desktop/updateos.lnk",
					data: JSON.stringify({
						localeReferenceName: "UPDATE_BUTTON",
						path: defaultSystem + "/apps/diffupdate.js"
					})
				});
				await availableAPIs.fs_chown({ path: homedir + "/desktop/updateos.lnk", newUser: username });
				await availableAPIs.fs_chgrp({ path: homedir + "/desktop/updateos.lnk", newGrp: username });
				await availableAPIs.fs_chmod({ path: homedir + "/desktop/updateos.lnk", newPermissions: "rx" });
			}
			description.innerHTML = (await availableAPIs.lookupLocale("INSTALLING_PCOS")).replace("%s", await availableAPIs.lookupLocale("INSTALLING_WP2U"));
			if (!(automatic_configuration?.createAccount?.onlyOnNewInstall && exec_args.includes("usersConfigured"))) {
				try {
					await availableAPIs.fs_write({
						path: homedir + "/.wallpaper",
						data: await availableAPIs.fs_read({
							path: defaultSystem + "/etc/wallpapers/pcos" + (darkModeChecked ? "-dark" : "") + "-beta.pic"
						})
					});
					await availableAPIs.fs_chown({ path: homedir + "/.wallpaper", newUser: username });
					await availableAPIs.fs_chgrp({ path: homedir + "/.wallpaper", newGrp: username });
					await availableAPIs.fs_chmod({ path: homedir + "/.wallpaper", newPermissions: "rx" });
				} catch {}
			}
			description.innerHTML = (await availableAPIs.lookupLocale("INSTALLING_PCOS")).replace("%s", await availableAPIs.lookupLocale("INSTALLING_WP2L"));
			try {
				await availableAPIs.fs_write({
					path: defaultSystem + "/etc/wallpapers/lockscreen.pic",
					data: await availableAPIs.fs_read({ path: defaultSystem + "/etc/wallpapers/pcos-lock-beta.pic" })
				});
			} catch {}
			description.innerHTML = (await availableAPIs.lookupLocale("INSTALLING_PCOS")).replace("%s", await availableAPIs.lookupLocale("INSTALLING_DARKMODE"));
			if (!(automatic_configuration?.createAccount?.onlyOnNewInstall && exec_args.includes("usersConfigured"))) {
				await availableAPIs.fs_write({
					path: homedir + "/.darkmode",
					data: darkModeChecked.toString()
				});
				await availableAPIs.fs_chown({ path: homedir + "/.darkmode", newUser: username });
				await availableAPIs.fs_chgrp({ path: homedir + "/.darkmode", newGrp: username });
				await availableAPIs.fs_chmod({ path: homedir + "/.darkmode", newPermissions: "rx" });
			}
			description.innerHTML = (await availableAPIs.lookupLocale("INSTALLING_PCOS")).replace("%s", await availableAPIs.lookupLocale("SETTING_LOCALE_PREFERENCE"));
			if (!(automatic_configuration?.createAccount?.onlyOnNewInstall && exec_args.includes("usersConfigured"))) {
				await availableAPIs.fs_write({
					path: homedir + "/.locale",
					data: language.value
				});
				await availableAPIs.fs_chown({ path: homedir + "/.locale", newUser: username });
				await availableAPIs.fs_chgrp({ path: homedir + "/.locale", newGrp: username });
				await availableAPIs.fs_chmod({ path: homedir + "/.locale", newPermissions: "rx" });
			}
			description.innerHTML = (await availableAPIs.lookupLocale("INSTALLING_PCOS")).replace("%s", await availableAPIs.lookupLocale("INSTALLING_DARKMODE2L"));
			await availableAPIs.fs_write({
				path: defaultSystem + "/etc/darkLockScreen",
				data: "false"
			});
			description.innerHTML = (await availableAPIs.lookupLocale("INSTALLING_PCOS")).replace("%s", await availableAPIs.lookupLocale("REMOVING_2STAGE"));
			try {
				await availableAPIs.fs_rm({ path: defaultSystem + "/boot/17-installer-secondstage.js" });
				await availableAPIs.fs_rm({ path: defaultSystem + "/apps/secondstage.js" });
			} catch (e) {
				console.error("Failed to remove secondstage", e);
			}
			description.innerHTML = (await availableAPIs.lookupLocale("INSTALLING_PCOS")).replace("%s", await availableAPIs.lookupLocale("REMOVING_SETUP_STATE"));
			try {
				await availableAPIs.fs_rm({ path: defaultSystem + "/boot/01-setup-state.js" });
			} catch (e) {
				console.error("Failed to remove setup state", e);
			}
			await availableAPIs.runKlvlCode("delete modules.settingUp;");
			description.innerHTML = (await availableAPIs.lookupLocale("INSTALLING_PCOS")).replace("%s", await availableAPIs.lookupLocale("REMOVING_INSTALLERS"));
			try {
				await availableAPIs.fs_rm({ path: defaultSystem + "/boot/15-apps.js" });
				await availableAPIs.fs_rm({ path: defaultSystem + "/apps/autoinstaller.js" });
				await availableAPIs.fs_rm({ path: defaultSystem + "/apps/installer.js" });
			} catch (e) {
				console.error("Failed to remove installers", e);
			}
			description.innerHTML = (await availableAPIs.lookupLocale("INSTALLING_PCOS")).replace("%s", await availableAPIs.lookupLocale("PATCHING_LOGON"));
			await availableAPIs.fs_write({
				path: defaultSystem + "/boot/14-logon-requirement-enforce.js",
				data: "requireLogon();\n"
			});
			description.innerHTML = await availableAPIs.lookupLocale("SETUP_SUCCESSFUL");
			if (!automatic_configuration.autoClose) await availableAPIs.closeability(true);
			if (automatic_configuration.autoClose) {
				if (automatic_configuration.restartOnClose) return availableAPIs.shutdown({ isReboot: true, isKexec: automatic_configuration.restartOnClose == "kexec" });
				await availableAPIs.terminate();
			}
		}
		if (automatic_configuration.createAccount) {
			useraccountname.value = automatic_configuration.createAccount.username || useraccountname.value;
			useraccountpassword.value = automatic_configuration.createAccount.password || "";
			darkmode.checked = automatic_configuration.createAccount.darkMode || darkmode.checked;
			language.value = automatic_configuration.createAccount.defaultLocale || language.value;
			useraccountname.disabled = automatic_configuration.createAccount.lockUsername;
			if (automatic_configuration.createAccount.lockUsername) useraccountname.title = await availableAPIs.lookupLocale("PROVISIONED_PREFERENCE");
			if (automatic_configuration.createAccount.create) button.click();
			else if (automatic_configuration.createAccount.onlyOnNewInstall && exec_args.includes("usersConfigured")) {
				useraccountpassword.value = useraccountpassword.value || crypto.getRandomValues(new Uint8Array(64)).reduce((a, b) => a + b.toString(16).padStart(2, "0"), "");
				button.click();
			}
		}
	}
	if (automatic_configuration.startSetup) button.click();
})();
addEventListener("signal", async function(e) {
	if (e.detail == 15) {
		await window.availableAPIs.terminate();
	}
});