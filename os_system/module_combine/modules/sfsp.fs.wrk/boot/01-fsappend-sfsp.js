// @pcos-app-mode native
async function SFSPMount(options) {
	let session, serverData;
	try {
		session = await fetch(options.url + "/session");
		session = await session.json();
		serverData = await fetch(options.url + "/properties", {
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify({
				...options,
				sessionToken: session
			})
		});
		serverData = await serverData.json();
	} catch (e) {
		throw new Error("Could not connect to server");
	}
	return {
		read: async function(...a) {
			let req = await fetch(options.url + "/file_operation", {
				method: "POST",
				headers: {
					"Content-Type": "application/json"
				},
				body: JSON.stringify({
					sessionToken: session,
					operation: "read",
					parameters: a
				})
			});
			if (!req.ok) throw (await req.json());
			return await req.json();
		},
		write: async function(...a) {
			let req = await fetch(options.url + "/file_operation", {
				method: "POST",
				headers: {
					"Content-Type": "application/json"
				},
				body: JSON.stringify({
					sessionToken: session,
					operation: "write",
					parameters: a
				})
			});
			if (!req.ok) throw (await req.json());
			return await req.json();
		},
		rm: async function(...a) {
			let req = await fetch(options.url + "/file_operation", {
				method: "POST",
				headers: {
					"Content-Type": "application/json"
				},
				body: JSON.stringify({
					sessionToken: session,
					operation: "rm",
					parameters: a
				})
			});
			if (!req.ok) throw (await req.json());
			return await req.json();
		},
		ls: async function(...a) {
			let req = await fetch(options.url + "/file_operation", {
				method: "POST",
				headers: {
					"Content-Type": "application/json"
				},
				body: JSON.stringify({
					sessionToken: session,
					operation: "ls",
					parameters: a
				})
			});
			if (!req.ok) throw (await req.json());
			return await req.json();
		},
		mkdir: async function(...a) {
			let req = await fetch(options.url + "/file_operation", {
				method: "POST",
				headers: {
					"Content-Type": "application/json"
				},
				body: JSON.stringify({
					sessionToken: session,
					operation: "mkdir",
					parameters: a
				})
			});
			if (!req.ok) throw (await req.json());
			return await req.json();
		},
		permissions: async function(...a) {
			let req = await fetch(options.url + "/file_operation", {
				method: "POST",
				headers: {
					"Content-Type": "application/json"
				},
				body: JSON.stringify({
					sessionToken: session,
					operation: "permissions",
					parameters: a
				})
			});
			if (!req.ok) throw (await req.json());
			return await req.json();
		},
		chown: async function(...a) {
			let req = await fetch(options.url + "/file_operation", {
				method: "POST",
				headers: {
					"Content-Type": "application/json"
				},
				body: JSON.stringify({
					sessionToken: session,
					operation: "chown",
					parameters: a
				})
			});
			if (!req.ok) throw (await req.json());
			return await req.json();
		},
		chgrp: async function(...a) {
			let req = await fetch(options.url + "/file_operation", {
				method: "POST",
				headers: {
					"Content-Type": "application/json"
				},
				body: JSON.stringify({
					sessionToken: session,
					operation: "chgrp",
					parameters: a
				})
			});
			if (!req.ok) throw (await req.json());
			return await req.json();
		},
		chmod: async function(...a) {
			let req = await fetch(options.url + "/file_operation", {
				method: "POST",
				headers: {
					"Content-Type": "application/json"
				},
				body: JSON.stringify({
					sessionToken: session,
					operation: "chmod",
					parameters: a
				})
			});
			if (!req.ok) throw (await req.json());
			return await req.json();
		},
		sync: async function(...a) {
			let req = await fetch(options.url + "/file_operation", {
				method: "POST",
				headers: {
					"Content-Type": "application/json"
				},
				body: JSON.stringify({
					sessionToken: session,
					operation: "sync",
					parameters: a
				})
			});
			if (!req.ok) throw (await req.json());
			return await req.json();
		},
		isDirectory: async function(...a) {
			let req = await fetch(options.url + "/file_operation", {
				method: "POST",
				headers: {
					"Content-Type": "application/json"
				},
				body: JSON.stringify({
					sessionToken: session,
					operation: "isDirectory",
					parameters: a
				})
			});
			if (!req.ok) throw (await req.json());
			return await req.json();
		},
		unmount: async function(...a) {
			let req = await fetch(options.url + "/file_operation", {
				method: "POST",
				headers: {
					"Content-Type": "application/json"
				},
				body: JSON.stringify({
					sessionToken: session,
					operation: "unmount",
					parameters: a
				})
			});
			if (!req.ok) throw (await req.json());
			return await req.json();
		},
		...serverData
	};
};
modules.mounts.SFSPMount = SFSPMount;