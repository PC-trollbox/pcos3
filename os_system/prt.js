const AsyncFunction = (async () => {}).constructor;
let disk = coreExports.disk;
let tty = coreExports.tty_bios_api;
tty.println("Password Resetting Tool");
tty.println("Reminder: Please respect privacy.");
tty.println("Partitions on disk: " + disk.partitions().join(", "));
tty.print("Select PCOS boot partition [boot]: ");
let bootPart = await tty.inputLine(true, true) || "boot";

let bootData = await disk.partition(bootPart).getData();
tty.println("Launching system.");
let bootPromise = new AsyncFunction(bootData)();
tty.println("Press Enter to run the next step.");
await tty.inputLine();
tty.println("Patching users system");
async function setupUsers() {
	async function handleAuthentication(user, _, finishFunction) {
		let currentPromptIndex = 0;

		return {
			getNextPrompt: async function() {
				if (currentPromptIndex > 0) {
					if (finishFunction) await finishFunction(true);
					let token = await modules.tokens.generate();
					await modules.tokens.userInitialize(token, user);
					return {
						success: true,
						message: modules.locales.get("AUTH_SUCCESS"),
						token: token
					};
				}
				let that = this;
				return {
					success: "intermediate",
					type: "promise",
					message: "Waiting for promise submission",
					wantsUserInput: false,
					input: async function() {
						currentPromptIndex++;
						return that.getNextPrompt();
					}
				};
			}
		};
	}

	let test = "{}";
	try {
		test = await modules.fs.read(modules.defaultSystem + "/etc/security/users");
	} catch {
		if (!modules.settingUp) test = "systemStatusInvalid";
	}
	try {
		JSON.parse(test);
	} catch (e) {
		document.body.innerHTML = "something definitely went wrong here.";
	}

	modules.users = {
		init: async function(token) {
			await this.mkrecursive(modules.defaultSystem + "/etc/security", token);
			await modules.fs.chmod(modules.defaultSystem + "/etc", "rx", token);
			await modules.fs.chown(modules.defaultSystem + "/etc", "root", token);
			await modules.fs.chgrp(modules.defaultSystem + "/etc", "root", token);
			await this.mkrecursive(modules.defaultSystem + "/root", token);
			await modules.fs.write(modules.defaultSystem + "/etc/security/users", JSON.stringify({root: {
				securityChecks: [],
				groups: ["root"],
				homeDirectory: modules.defaultSystem + "/root"
			},
			nobody: {
				securityChecks: [],
				groups: ["nobody"],
				homeDirectory: modules.defaultSystem
			}}), token);
		},
		mkrecursive: async function(dir, token) {
			let slices = dir.split("/");
			for (let slice in slices) {
				let previousParts = slices.slice(0, slice).join("/");
				if (!previousParts) continue;
				let currentPart = slices[slice];
				let check = await modules.fs.ls(previousParts, token);
				previousParts += "/";
				if (!check.includes(currentPart)) await modules.fs.mkdir(previousParts + currentPart, token);
			}
		},
		moduser: async function(user, data, token) {
			let userDB = JSON.parse(await modules.fs.read(modules.defaultSystem + "/etc/security/users"), token);
			userDB[user] = data;
			await modules.fs.write(modules.defaultSystem + "/etc/security/users", JSON.stringify(userDB), token);
		},
		getUserInfo: async function(user, sensitive = false, token) {
			let userDB = JSON.parse(await modules.fs.read(modules.defaultSystem + "/etc/security/users"), token);
			if (!userDB.hasOwnProperty(user)) return null;
			userDB = userDB[user];
			if (!sensitive) delete userDB.securityChecks;
			return userDB;
		},
		access: async function(user) {
			return handleAuthentication(user);
		}
	}
}
await setupUsers();
tty.println("All done.");
await bootPromise;