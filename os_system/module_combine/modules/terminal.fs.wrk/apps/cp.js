// =====BEGIN MANIFEST=====
// signer: automaticSigner
// allow: GET_LOCALE, FS_READ, FS_WRITE, FS_BYPASS_PERMISSIONS, FS_CHANGE_PERMISSION
// =====END MANIFEST=====
(async function() {
	// @pcos-app-mode isolatable
	await availableAPIs.windowVisibility(false);
	await availableAPIs.attachCLI();
	if (!(await availableAPIs.getPrivileges()).includes("GET_LOCALE")) { await availableAPIs.toMyCLI("cp: Locale permission denied\r\n");
		return await availableAPIs.terminate();	}
	if (!exec_args.length) {
		await availableAPIs.toMyCLI(await availableAPIs.lookupLocale("CP_USAGE") + "\r\n");
		await availableAPIs.toMyCLI(await availableAPIs.lookupLocale("CP_DESCRIPTION") + "\r\n");
		await availableAPIs.toMyCLI("\t" + await availableAPIs.lookupLocale("OPT_RECURSIVE_DESCRIPTION") + "\r\n");
		await availableAPIs.toMyCLI("\t" + await availableAPIs.lookupLocale("OPT_FORCE_DESCRIPTION") + "\r\n");
		await availableAPIs.toMyCLI("\t" + await availableAPIs.lookupLocale("CP_PERMISSIONS_OPTION") + "\r\n");
		await availableAPIs.toMyCLI("cp: " + await availableAPIs.lookupLocale("NO_ARGUMENTS") + "\r\n");
		return availableAPIs.terminate();
	}
	let recursive = exec_args.includes("--recursive");
	let force = exec_args.includes("--force");
	let permissions = exec_args.includes("--permissions");
	if (recursive) exec_args.splice(exec_args.indexOf("--recursive"), 1);
	if (force) exec_args.splice(exec_args.indexOf("--force"), 1);
	if (permissions) exec_args.splice(exec_args.indexOf("--permissions"), 1);
	if (exec_args.length != 2) {
		await availableAPIs.toMyCLI("cp: " + await availableAPIs.lookupLocale("ARGUMENT_COUNT_MISMATCH") + "\r\n");
		return await availableAPIs.terminate();
	}
	if (recursive) await recursiveCopy(exec_args[0], exec_args[1], force, permissions);
	else {
		try {
			await availableAPIs.fs_write({
				path: exec_args[1],
				data: await availableAPIs.fs_read({ path: exec_args[0] })
			});
			if (permissions) {
				let originalPermissions = await availableAPIs.fs_permissions({ path: exec_args[0] });
				await availableAPIs.fs_chmod({ path: exec_args[1], newPermissions: originalPermissions.world });
				await availableAPIs.fs_chgrp({ path: exec_args[1], newGrp: originalPermissions.group });
				await availableAPIs.fs_chown({ path: exec_args[1], newUser: originalPermissions.user });
			}
		} catch (e) {
			await availableAPIs.toMyCLI("cp: " + exec_args[0] + " -> " + exec_args[1] + ": " + await availableAPIs.lookupLocale(e.message) + "\r\n");
		}
	}
	await availableAPIs.terminate();
})();

async function recursiveCopy(source, destination, force, permissions) {
	try {
		try {
			await availableAPIs.fs_mkdir({ path: destination });
		} catch {}
		for (let sourceFile of await availableAPIs.fs_ls({ path: source })) {
			let destinationFile = destination + "/" + sourceFile;
			try {
				if (await availableAPIs.fs_isDirectory({ path: source + "/" + sourceFile }))
					await recursiveCopy(source + "/" + sourceFile, destinationFile, force, permissions);
				else {
					await availableAPIs.fs_write({
						path: destinationFile,
						data: await availableAPIs.fs_read({ path: source + "/" + sourceFile })
					});
				}
				if (permissions) {
					let originalPermissions = await availableAPIs.fs_permissions({ path: source + "/" + sourceFile });
					await availableAPIs.fs_chmod({ path: destinationFile, newPermissions: originalPermissions.world });
					await availableAPIs.fs_chgrp({ path: destinationFile, newGrp: originalPermissions.group });
					await availableAPIs.fs_chown({ path: destinationFile, newUser: originalPermissions.owner });
				}
			} catch (e) {
				await availableAPIs.toMyCLI("cp: " + source + "/" + sourceFile + " -> " + destinationFile + ": " + await availableAPIs.lookupLocale(e.message) + "\r\n");
				if (!force) return await availableAPIs.terminate();
			}
		}
	} catch (e) {
		await availableAPIs.toMyCLI("cp: " + source + " -> " + destination + ": " + await availableAPIs.lookupLocale(e.message) + "\r\n");
		if (!force) return await availableAPIs.terminate();
	}
}

addEventListener("signal", async function(e) {
	if (e.detail == 15) await window.availableAPIs.terminate();
}); null;