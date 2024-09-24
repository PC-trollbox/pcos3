// =====BEGIN MANIFEST=====
// allow: GET_LOCALE, FS_LIST_PARTITIONS, FS_READ, MANAGE_TOKENS, ELEVATE_PRIVILEGES, FS_BYPASS_PERMISSIONS, START_TASK, START_BACKGROUND_TASK, CLI_MODIFICATIONS, GET_BUILD, LIST_TASKS, TASK_BYPASS_PERMISSIONS
// link: lrn:REAL_TERMINAL_NAME
// signer: automaticSigner
// =====END MANIFEST=====
let user_spawn_token = null;
(async function() {
    // @pcos-app-mode isolatable
    await window.availableAPIs.windowTitleSet(await availableAPIs.lookupLocale("REAL_TERMINAL_NAME"));
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
    let defaultPath = await availableAPIs.getSystemMount() + "/apps";
    let pathsForBinaries = [ defaultPath ];
    let otherProcessAttached = false;
    let graphic = false;
    let su_stage = -1;
    let suSession = null;
    let hideInputMask = "";
    let hideInput = false;
    await availableAPIs.toMyCLI((await window.availableAPIs.lookupLocale("TERMINAL_INVITATION")).replace("%s", (await window.availableAPIs.getVersion())) + "\r\n\r\n");
    await availableAPIs.toMyCLI(default_user + (default_user == "root" ? "#" : "$") + " ");
    
    onTermData(async function self(e, why) {
        if (otherProcessAttached) return await availableAPIs.typeIntoOtherCLI({
            taskId: otherProcessAttached,
            text: e,
            human: true
        });
        if (e == "\r") {
            if (why != "su") await availableAPIs.toMyCLI("\r\n");
            if (su_stage > -1) {
                if (su_stage == 0) {
                    try {
                        suSession = await availableAPIs.automatedLogonCreate({ desiredUser: str });
                        su_stage = 1;
                    } catch {
                        su_stage = -1;
                        await availableAPIs.toMyCLI(await availableAPIs.lookupLocale("AUTH_FAILED") + "\r\n");
                    }
                    str = "";
                }
                while (su_stage >= 1) {
                    otherProcessAttached = true;
                    if (su_stage == 2) await availableAPIs.automatedLogonInput({ session: suSession, input: str });
                    otherProcessAttached = false;
                    str = "";
                    hideInput = false;
                    hideInputMask = "";
                    let prompt = await availableAPIs.automatedLogonGet(suSession);
                    await availableAPIs.toMyCLI(prompt.message);
                    su_stage = 2;
                    if (prompt.success != "intermediate") {
                        await availableAPIs.toMyCLI("\r\n");
                        su_stage = -1;
                        if (prompt.success) {
                            user_spawn_token = prompt.token;
                            let processToken = await availableAPIs.getProcessToken();
                            await availableAPIs.setProcessToken(await availableAPIs.forkToken(user_spawn_token));
                            await availableAPIs.revokeToken(processToken);
                            await availableAPIs.automatedLogonDelete(suSession);
                        }
                    }
                    if (prompt.wantsUserInput || prompt.type == "informative") {
                        if (prompt.wantsUserInput) await availableAPIs.toMyCLI(": ");
                        hideInput = prompt.type == "password" || prompt.type == "informative";
                        hideInputMask = prompt.type == "password" ? "*" : "";
                        return;
                    }
                    if (su_stage != -1) await availableAPIs.toMyCLI("\r\n");
                    if (prompt.type == "promise") {
                        otherProcessAttached = true;
                        await availableAPIs.automatedLogonInput({ session: suSession });
                        return otherProcessAttached = false;
                    }
                }
            }
            let cmdline = [];
            try {
                cmdline = parse_cmdline(str);
            } catch {
                await availableAPIs.toMyCLI("> ");
                return;
            }
            str = "";
            if (cmdline[0] == "sugraph") {
                otherProcessAttached = true;
                let authui = await availableAPIs.getNewToken(cmdline[1]);
                if (authui) {
                    user_spawn_token = authui;
                    let processToken = await availableAPIs.getProcessToken();
                    await availableAPIs.setProcessToken(await availableAPIs.forkToken(user_spawn_token));
                    await availableAPIs.revokeToken(processToken);
                } else await availableAPIs.toMyCLI(await availableAPIs.lookupLocale("AUTH_FAILED") + "\r\n");
                otherProcessAttached = false;
            } else if (cmdline[0] == "su") {
                if (!cmdline[1]) {
                    await availableAPIs.toMyCLI(await availableAPIs.lookupLocale("USERNAME") + ": ");
                    return su_stage = 0;
                } else {
                    try {
                        suSession = await availableAPIs.automatedLogonCreate({ desiredUser: cmdline[1] });
                        su_stage = 1;
                        return self("\r", "su");
                    } catch {
                        await availableAPIs.toMyCLI(await availableAPIs.lookupLocale("AUTH_FAILED") + "\r\n");
                    }
                }
            } else if (cmdline[0] == "graphic") {
                if (!cmdline[1]) await availableAPIs.toMyCLI("graphic: " + graphic + "\r\n");
                else {
                    graphic = cmdline[1] == "true" || cmdline[1] == "on" || cmdline[1] == "1" || cmdline[1] == "yes" || cmdline[1] == "enable";
                }
            } else if (cmdline[0] == "clear") {
                await availableAPIs.clearMyCLI();
            } else if (cmdline[0] == "exit") {
                await availableAPIs.terminate();
            } else if (cmdline[0] == "help") {
                await availableAPIs.toMyCLI(await availableAPIs.lookupLocale("REAL_TERMINAL_BUILTIN_LIST") + "\r\n");
                await availableAPIs.toMyCLI(await availableAPIs.lookupLocale("REAL_TERMINAL_HELP_USEDESC") + "\r\n");
                await availableAPIs.toMyCLI(await availableAPIs.lookupLocale("REAL_TERMINAL_CLEAR_USEDESC") + "\r\n");
                await availableAPIs.toMyCLI(await availableAPIs.lookupLocale("REAL_TERMINAL_SUGRAPH_USEDESC") + "\r\n");
                await availableAPIs.toMyCLI(await availableAPIs.lookupLocale("REAL_TERMINAL_SU_USEDESC") + "\r\n");
                await availableAPIs.toMyCLI(await availableAPIs.lookupLocale("REAL_TERMINAL_GRAPHIC_USEDESC") + "\r\n");
                await availableAPIs.toMyCLI(await availableAPIs.lookupLocale("REAL_TERMINAL_EXIT_USEDESC") + "\r\n");
            } else if (!cmdline.length) {} else {
                let runFile;
                try {
                    if (!await availableAPIs.fs_isDirectory({ path: cmdline[0] })) runFile = cmdline[0];
                } catch {}
                for (let path of pathsForBinaries) {
                    try {
                        let ls = await availableAPIs.fs_ls({ path });
                        if (ls.includes(cmdline[0]) || ls.includes(cmdline[0] + ".js")) {
                            let extensioned = ls.includes(cmdline[0] + ".js")
                            runFile = path + "/" + cmdline[0] + (extensioned ? ".js" : "");
                            break;
                        }
                    } catch {}
                }
                if (runFile) {
                    if (user_spawn_token) {
                        let forkedToken = await availableAPIs.forkToken(user_spawn_token);
                        try {
                            let spawnedTask = await availableAPIs.startTask({
                                file: runFile,
                                argPassed: cmdline.slice(1),
                                runInBackground: !graphic,
                                silent: true,
                                token: forkedToken
                            });
                            otherProcessAttached = spawnedTask;
                            (async function() {
                                while ((await availableAPIs.listTasks()).includes(spawnedTask)) {
                                    try {
                                        let otherData = await availableAPIs.getOtherCLIData({ taskId: spawnedTask });
                                        if (otherData.type == "write") availableAPIs.toMyCLI(otherData.data);
                                        else if (otherData.type == "consoleClear") availableAPIs.clearMyCLI();
                                    } catch {}
                                } 
                            })();
                            await availableAPIs.waitTermination(spawnedTask);
                            otherProcessAttached = false;
                        } catch (e) {
                            await availableAPIs.toMyCLI(runFile + ": " + await availableAPIs.lookupLocale(e.message) + "\r\n");
                        }
                    } else await availableAPIs.toMyCLI((await availableAPIs.lookupLocale("REAL_TERMINAL_LOGON_REQUIRED")).replace("%s", default_user) + "\r\n");
                } else await availableAPIs.toMyCLI((await window.availableAPIs.lookupLocale("TERM_COMMAND_NOT_FOUND")).replace("%s", cmdline[0]) + "\r\n");
            }
            try {
                default_user = await window.availableAPIs.getUser();
            } catch {}
            await availableAPIs.toMyCLI(default_user + (default_user == "root" ? "#" : "$") + " ");
            return;
        } else if (e == '\u007F') {
            if (str.length > 0) {
                str = str.substr(0, str.length - 1);
                await availableAPIs.toMyCLI('\b \b');
            }
        } else {
            if (e >= String.fromCharCode(0x20) && e <= String.fromCharCode(0x7E) || e >= '\u00a0') {
                str += e;
                await availableAPIs.toMyCLI(hideInput ? hideInputMask : e);
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
    await availableAPIs.revokeToken(user_spawn_token);
    if (e.detail == 15) await window.availableAPIs.terminate();
}); null;