// =====BEGIN MANIFEST=====
// allow: GET_LOCALE, GET_THEME, IPC_CREATE_PIPE, START_TASK, FS_LIST_PARTITIONS, IPC_LISTEN_PIPE, ELEVATE_PRIVILEGES, MANAGE_TOKENS, SIGNAL_TASK, LIST_TASKS, FS_READ, IPC_SEND_PIPE, GET_USER_INFO
// signer: automaticSigner
// =====END MANIFEST=====
let globalToken;
(async function() {
	// @pcos-app-mode isolatable
	await availableAPIs.windowTitleSet(await availableAPIs.lookupLocale("PERMISSION_EXPLORER"));
	let privileges = await availableAPIs.getPrivileges();
	let checklist = [ "IPC_CREATE_PIPE", "START_TASK", "FS_LIST_PARTITIONS", "IPC_LISTEN_PIPE", "ELEVATE_PRIVILEGES", "MANAGE_TOKENS", "SIGNAL_TASK", "LIST_TASKS", "FS_READ", "IPC_SEND_PIPE" ];
	document.body.style.fontFamily = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
	if (await availableAPIs.isDarkThemed()) document.body.style.color = "white";
	if (!checklist.every(p => privileges.includes(p))) {
		document.body.innerText = await availableAPIs.lookupLocale("PERM_EXP_DENIED");
		return;
	}
	let inputFileInput = document.createElement("input");
	let inputFileButton = document.createElement("button");
	let argumentInput = document.createElement("input");
	let getTokenButton = document.createElement("button");
	let tokenPrivilegesList = document.createElement("fieldset");
	let executeButton = document.createElement("button");
	let statusInfo = document.createElement("span");
	inputFileButton.innerText = await availableAPIs.lookupLocale("LOAD_BTN");
	argumentInput.placeholder = "[ /* arguments in JSON */ ]";
	argumentInput.value = "[]";
	getTokenButton.innerText = await availableAPIs.lookupLocale("GRANT_PERM");
	executeButton.innerText = await availableAPIs.lookupLocale("LAUNCH_PROGRAM");
	statusInfo.innerText = await availableAPIs.lookupLocale("EMPTY_STATUSBAR");
	let excludedPrivileges = [];
	let taskId;
	inputFileButton.onclick = async function() {
		let ipcPipe = await availableAPIs.createPipe();
		await availableAPIs.windowVisibility(false);
		await availableAPIs.startTask({ file: (await availableAPIs.getSystemMount()) + "/apps/filePicker.js", argPassed: [ipcPipe, "load"] });
		let result = await availableAPIs.listenToPipe(ipcPipe);
		await availableAPIs.closePipe(ipcPipe);
		await availableAPIs.windowVisibility(true);
		if (result.success) inputFileInput.value = result.selected;
	};
	getTokenButton.onclick = async function() {
		globalToken = await availableAPIs.consentGetToken({
			intent: await availableAPIs.lookupLocale("PERM_EXP_INTENT"),
			name: await availableAPIs.lookupLocale("PERMISSION_EXPLORER")
		});
		if (!globalToken) return statusInfo.innerText = await availableAPIs.lookupLocale("PERMISSION_DENIED");
		excludedPrivileges = [];
		Array.from(tokenPrivilegesList.children).map(a => a.remove());
		let tokenPrivileges = (await availableAPIs.getTokenInfo(globalToken)).privileges;
		for (let privilegeName of tokenPrivileges) {
			let privilegeCheckbox = document.createElement("input");
			let privilege = document.createElement("span");
			privilegeCheckbox.type = "checkbox";
			privilegeCheckbox.checked = true;
			privilege.innerText = privilegeName;
			privilegeCheckbox.onchange = function() {
				if (!excludedPrivileges.includes(privilegeName)) excludedPrivileges.push(privilegeName);
				else excludedPrivileges.splice(excludedPrivileges.indexOf(privilegeName), 1);
			};
			tokenPrivilegesList.append(privilegeCheckbox, privilege);
			tokenPrivilegesList.appendChild(document.createElement("br"));
		}
		statusInfo.innerText = await availableAPIs.lookupLocale("PERMISSION_GRANTED");
	};
	async function switchPrep(running = !!taskId) {
		inputFileInput.disabled = running;
		inputFileButton.disabled = running;
		getTokenButton.disabled = running;
		tokenPrivilegesList.disabled = running;
		argumentInput.disabled = running;
		executeButton.innerText = await availableAPIs.lookupLocale(running ? "TERMINATE_TASK" : "LAUNCH_PROGRAM");
	}
	executeButton.onclick = async function() {
		if (!globalToken) return statusInfo.innerText = await availableAPIs.lookupLocale("PERMISSION_DENIED");
		if (taskId) {
			if (!tokenPrivilegesList.disabled) {
				taskId = undefined;
				return;
			}
			statusInfo.innerText = await availableAPIs.lookupLocale("ABRUPT_CLOSE_SIGNAL");
			switchPrep(false);
			await availableAPIs.signalTask({ taskId, signal: 9 });
			return;
		}
		let taskToken = await availableAPIs.forkToken(globalToken);
		await availableAPIs.removeTokenPrivileges({ token: taskToken, privileges: excludedPrivileges });
		try {
			taskId = await availableAPIs.startTask({
				file: inputFileInput.value,
				argPassed: JSON.parse(argumentInput.value || "[]"),
				token: taskToken
			});
			switchPrep();
			statusInfo.innerText = await availableAPIs.lookupLocale("PROGRAM_IS_RUNNING");
			await availableAPIs.waitTermination(taskId);
			taskId = undefined;
			switchPrep();
			statusInfo.innerText = await availableAPIs.lookupLocale("SUCCESSFUL_OP");
		} catch (e) {
			taskId = undefined;
			await switchPrep();
			statusInfo.innerText = e.name + ": " + e.message + "\n" + e.stack;
		}
	};
	document.body.append(inputFileInput, inputFileButton);
	document.body.appendChild(document.createElement("br"));
	document.body.append(getTokenButton, tokenPrivilegesList);
	document.body.appendChild(document.createElement("hr"));
	document.body.append(argumentInput, executeButton);
	document.body.appendChild(document.createElement("hr"));
	document.body.appendChild(statusInfo);
})();
addEventListener("signal", async function(e) {
	if (e.detail == 15) {
		try {
			if (globalToken) await availableAPIs.revokeToken(globalToken);
		} catch {}
		await window.availableAPIs.terminate();
	}
});