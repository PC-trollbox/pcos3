// =====BEGIN MANIFEST=====
// link: lrn:API_TEST_TERM
// signer: automaticSigner
// =====END MANIFEST=====
(async function() {
	// @pcos-app-mode isolatable
	await window.availableAPIs.windowTitleSet(await window.availableAPIs.lookupLocale("API_TEST_TERM"));
	document.body.style.fontFamily = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
	if (await availableAPIs.isDarkThemed()) document.body.style.color = "white";
	await availableAPIs.attachCLI();
	
	function parse_cmdline(cmdline) {
		var re_next_arg = /^\s*((?:(?:"(?:\\.|[^"])*")|(?:'[^']*')|\\.|\S)+)\s*(.*)$/;
		var next_arg = ['', '', cmdline];
		var args = [];
		while (next_arg = re_next_arg.exec(next_arg[2])) {
			var quoted_arg = next_arg[1];
			var unquoted_arg = "";
			while (quoted_arg.length > 0) {
				if (/^"/.test(quoted_arg)) {
					var quoted_part = /^"((?:\\.|[^"])*)"(.*)$/.exec(quoted_arg);
					unquoted_arg += quoted_part[1].replace(/\\(.)/g, "$1");
					quoted_arg = quoted_part[2];
				} else if (/^'/.test(quoted_arg)) {
					var quoted_part = /^'([^']*)'(.*)$/.exec(quoted_arg);
					unquoted_arg += quoted_part[1];
					quoted_arg = quoted_part[2];
				} else if (/^\\/.test(quoted_arg)) {
					unquoted_arg += quoted_arg[1];
					quoted_arg = quoted_arg.substring(2);
				} else {
					unquoted_arg += quoted_arg[0];
					quoted_arg = quoted_arg.substring(1);
				}
			}
			args[args.length] = unquoted_arg;
		}
		return args;
	}

	let str = "";
	let default_user = await window.availableAPIs.getUser();
	await availableAPIs.toMyCLI((await window.availableAPIs.lookupLocale("TERMINAL_INVITATION")).replace("%s", (await window.availableAPIs.getVersion())) + "\r\n\r\n");
	await availableAPIs.toMyCLI(default_user + "@localhost:~" + (default_user == "root" ? "#" : "$") + " ");
	
	onTermData(async function (e) {
		if (e == "\r") {
			await availableAPIs.toMyCLI("\r\n");
			let cmdline = [];
			try {
				cmdline = parse_cmdline(str);
			} catch {
				await availableAPIs.toMyCLI("> ");
				return;
			}
			str = "";
			if (!cmdline.length) {} else if (window.availableAPIs.hasOwnProperty(cmdline[0])) {
				try {
					await availableAPIs.toMyCLI(JSON.stringify(await window.availableAPIs[cmdline[0]](cmdline.length == 1 ? undefined : (cmdline.length == 2 ? cmdline[1] : [...cmdline.slice(1)]))) + "\r\n");
				} catch (e) {
					await availableAPIs.toMyCLI(cmdline[0] + ": " + e.name + ": " + e.message + "\r\n");
				}
			} else if (cmdline[0] == "js_ree") {
				try {
					await availableAPIs.toMyCLI(JSON.stringify(eval(cmdline[1])) + "\r\n");
				} catch (e) {
					await availableAPIs.toMyCLI("js_ree: " + e.name + ": " + e.message + "\r\n");
				}
			} else if (cmdline[0] == "clear") {
				await availableAPIs.clearMyCLI();
			} else if (cmdline[0] == "help") {
				await availableAPIs.toMyCLI(await window.availableAPIs.lookupLocale("HELP_TERMINAL_APITEST"));
				for (let api in window.availableAPIs) await availableAPIs.toMyCLI(api + "\r\n");
			} else {
				await availableAPIs.toMyCLI((await window.availableAPIs.lookupLocale("TERM_COMMAND_NOT_FOUND")).replace("%s", cmdline[0]) + "\r\n");
			}
			try {
				default_user = await window.availableAPIs.getUser();
			} catch {}
			await availableAPIs.toMyCLI(default_user + "@localhost:~" + (default_user == "root" ? "#" : "$") + " ");
			return;
		} else if (e == '\u007F') {
			if (str.length > 0) {
				str = str.substr(0, str.length - 1);
				await availableAPIs.toMyCLI('\b \b');
			}
		} else {
			if (e >= String.fromCharCode(0x20) && e <= String.fromCharCode(0x7E) || e >= '\u00a0') {
				str += e;
				await availableAPIs.toMyCLI(e);
			}
		}
	});
})(); 

async function onTermData(listener) {
	while (true) {
		listener(await availableAPIs.fromMyCLI());
	}
}
addEventListener("signal", async function(e) {
	if (e.detail == 15) await window.availableAPIs.terminate();
}); null;