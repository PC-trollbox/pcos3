async function setupUsers() {
	const server = "http://localhost:3946/managedUsers/";
	// @pcos-app-mode native
	async function handleAuthentication(user, reqToken, finishFunction) {
		let destroyed = false;

		let userAccessSession = await (await fetch(server + "userAccess", {
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify({ user, reqToken })
		})).json();
		return {
			getNextPrompt: async function() {
				if (destroyed) return {
					success: false,
					message: modules.locales.get("AUTH_FAILED_NEW")
				};

				let that = this;
				let currentPrompt = await (await fetch(server + "userAccessContinue", {
					method: "POST",
					headers: {
						"Content-Type": "application/json"
					},
					body: JSON.stringify({ reqToken, userAccessSession })
				})).json();
				let used = false;

				if (currentPrompt.success != "intermediate") {
					if (finishFunction) await finishFunction(true);
					destroyed = true;
					return {
						success: currentPrompt.success,
						message: "Authentication finished (Code=0x0" + (+(!currentPrompt.success)) + ")",
						token: currentPrompt.token
					};
				}
				
				return {
					success: "intermediate",
					type: currentPrompt.type,
					message: currentPrompt.message,
					wantsUserInput: currentPrompt.userInput,
					challenge: currentPrompt.challenge,
					input: async function(input) {
						if (used || destroyed) return that.getNextPrompt();
						if (!used) used = true;
						let verified;
						try {
							verified = await (await fetch(server + "userAccessSubmit", {
								method: "POST",
								headers: {
									"Content-Type": "application/json"
								},
								body: JSON.stringify({ reqToken, userAccessSession, input })
							})).json();
						} catch {
							verified = false;
						}
						if (!verified) {
							destroyed = true;
							if (finishFunction) await finishFunction(false);
							return { success: false, message: modules.locales.get("AUTH_FAILED") };
						}
						return that.getNextPrompt();
					}
				};
			}
		};
	}

	try {
		if (!(await fetch(server + "ping")).ok) throw new Error("Non-OK ping response");
	} catch (e) {
		if (!modules.settingUp) await panic("USER_SYSTEM_CONTACT_FAILED", {
			name: "managedUsers",
			params: [modules.defaultSystem],
			underlyingJS: e
		})
	}

	modules.users = {
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
			return (await fetch(server + "userSet", {
				method: "POST",
				headers: {
					"Content-Type": "application/json"
				},
				body: JSON.stringify({ user, data, token })
			})).json();
		},
		getUserInfo: async function(user, sensitive = false, token) {
			return (await fetch(server + "userGet", {
				method: "POST",
				headers: {
					"Content-Type": "application/json"
				},
				body: JSON.stringify({ user, sensitive, token })
			})).json();
		},
		configured: _ => true,
		access: async function(user, token) {
			return handleAuthentication(user, token);
		},
		getUsers: async function(token) {
			return (await fetch(server + "getUsers", {
				method: "POST",
				headers: {
					"Content-Type": "application/json"
				},
				body: JSON.stringify({ token })
			})).json();
		},
	}
}
await setupUsers();