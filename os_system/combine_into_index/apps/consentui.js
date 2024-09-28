// =====BEGIN MANIFEST=====
// signer: automaticSigner
// allow: IPC_SEND_PIPE, GET_LOCALE, GET_THEME, ELEVATE_PRIVILEGES
// =====END MANIFEST=====

let ipc = exec_args[0];
(async function() {
    // @pcos-app-mode isolatable
    if (!ipc) return availableAPIs.terminate();
    let user = exec_args[1];
    await availableAPIs.windowTitleSet(await availableAPIs.lookupLocale("ACCESS_REQUEST_TITLE"));
    let checklist = [ "IPC_SEND_PIPE", "GET_LOCALE", "GET_THEME", "ELEVATE_PRIVILEGES" ];
    let privileges = await availableAPIs.getPrivileges();
    if (!checklist.every(p => privileges.includes(p))) {
        if (privileges.includes("IPC_SEND_PIPE")) await availableAPIs.sendToPipe({ pipe: ipc, data: { success: false, cancelled: false } });
        return availableAPIs.terminate();
    }
    document.body.style.fontFamily = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
    if (await availableAPIs.isDarkThemed()) document.body.style.color = "white";
    let describe = document.createElement("span");
    let form = document.createElement("form");
    let input = document.createElement("input");
    let decline = document.createElement("button");
    let submit = document.createElement("button");
    let metadata = JSON.parse(exec_args[2]);
    decline.type = "button";
    submit.type = "submit";
    document.body.appendChild(describe);
    document.body.appendChild(document.createElement("hr"));
    document.body.appendChild(form);
    form.appendChild(input);
    form.appendChild(document.createElement("br"));
    form.appendChild(decline);
    form.appendChild(submit);
    describe.innerText = (await availableAPIs.lookupLocale("DESCRIBE_TEMPLATE")).replace("%s", metadata.path.split("/").pop()).replace("%s", metadata.submittedName || metadata.path.split("/").pop()).replace("%s", metadata.submittedIntent);
    input.placeholder = await availableAPIs.lookupLocale("USERNAME");
    decline.innerText = await availableAPIs.lookupLocale("DECLINE");
    submit.innerText = await availableAPIs.lookupLocale("NEXT");

    async function extraData(e) {
        e.stopImmediatePropagation();
        e.preventDefault();
        e.stopPropagation();
        describe.innerText = (await availableAPIs.lookupLocale("EXTRA_DESCRIBE_TEMPLATE")).replace("%s", metadata.path.split("/").pop()).replace("%s", metadata.submittedName || metadata.path.split("/").pop()).replace("%s", JSON.stringify(metadata.args)).replace("%s", metadata.submittedIntent);
        describe.removeEventListener("contextmenu", extraData);
    }

    describe.addEventListener("contextmenu", extraData);

    async function userSubmit(e) {
        describe.removeEventListener("contextmenu", extraData);
        e.stopImmediatePropagation();
        e.preventDefault();
        e.stopPropagation();
        let userLogonSession;
        let userLogonID;
        let desired_username = input.value;
        try {
            userLogonID = await availableAPIs.automatedLogonCreate({ desiredUser: desired_username });
            userLogonSession = await availableAPIs.automatedLogonGet(userLogonID);
        } catch {
            describe.innerText = await availableAPIs.lookupLocale("AUTH_FAILED") + " " + await availableAPIs.lookupLocale("USERNAME_PROMPT");
            input.placeholder = await availableAPIs.lookupLocale("USERNAME");
            input.type = "text";
            input.disabled = !!user;
            submit.disabled = false;
            input.value = user || "";
            submit.addEventListener("click", userSubmit);
            return;
        }
        async function updateProgress() {
            submit.removeEventListener("click", userSubmit);
            input.value = "";
            if (userLogonSession.success != "intermediate") await availableAPIs.automatedLogonDelete(userLogonID);
            if (userLogonSession.success == true) {
                await availableAPIs.sendToPipe({ pipe: ipc, data: userLogonSession });
                await availableAPIs.terminate();
            }
            if (userLogonSession.success == false) {
                describe.innerText = await availableAPIs.lookupLocale("AUTH_FAILED") + " " + await availableAPIs.lookupLocale("USERNAME_PROMPT");
                input.placeholder = await availableAPIs.lookupLocale("USERNAME");
                input.type = "text";
                input.disabled = !!user;
                submit.disabled = false;
                input.value = user || "";
                submit.addEventListener("click", userSubmit);
                return;
            }
            describe.innerText = "[" + desired_username + "] " + userLogonSession.message;
            input.placeholder = await availableAPIs.lookupLocale("RESPONSE_PLACEHOLDER");
            input.type = userLogonSession.type == "password" ? "password" : "text";
            input.disabled = !userLogonSession.wantsUserInput;
            submit.disabled = !userLogonSession.wantsUserInput;
            if (userLogonSession.type == "promise") {
                try {
                    input.disabled = true;
                    submit.disabled = true;
                    await availableAPIs.automatedLogonInput({ session: userLogonID });
                    userLogonSession = await availableAPIs.automatedLogonGet(userLogonID);
                } catch {}
                return await updateProgress();
            }
            if (userLogonSession.type == "informative") {
                input.disabled = true;
                submit.disabled = false;
                input.placeholder = "";
            }
            submit.addEventListener("click", async function updater(e) {
                e.stopImmediatePropagation();
                submit.removeEventListener("click", updater);
                e.preventDefault();
                e.stopPropagation();
                try {
                    input.disabled = true;
                    submit.disabled = true;
                    await availableAPIs.automatedLogonInput({ session: userLogonID, input: input.value });
                    userLogonSession = await availableAPIs.automatedLogonGet(userLogonID);
                } catch {}
                return await updateProgress();
            });
        }
        await updateProgress();
        return false;
    }
    submit.addEventListener("click", userSubmit);
    decline.addEventListener("click", async function() {
        await availableAPIs.sendToPipe({ pipe: ipc, data: { success: false, cancelled: true } });
        await availableAPIs.terminate();
    });
    if (user) {
        input.disabled = true;
        input.value = user;
    }
})();
addEventListener("signal", async function(e) {
    if (e.detail == 15) {   
        await availableAPIs.sendToPipe({ pipe: ipc, data: { success: false, cancelled: true } });
        await window.availableAPIs.terminate();
    }
}); null;