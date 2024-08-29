// =====BEGIN MANIFEST=====
// signer: automaticSigner
// allow: IPC_SEND_PIPE, GET_LOCALE, GET_THEME, ELEVATE_PRIVILEGES
// =====END MANIFEST=====

let ipc = exec_args[0];
(async function() {
    // @pcos-app-mode isolatable
    await availableAPIs.closeability(false);
    if (!ipc) return availableAPIs.terminate();
    let user = exec_args[1];
    await availableAPIs.windowTitleSet("AuthUI");
    let checklist = [ "IPC_SEND_PIPE", "GET_LOCALE", "GET_THEME", "ELEVATE_PRIVILEGES" ];
    let privileges = await availableAPIs.getPrivileges();
    if (!checklist.every(p => privileges.includes(p))) {
        if (privileges.includes("IPC_SEND_PIPE")) await availableAPIs.sendToPipe({ pipe: ipc, data: { success: false, cancelled: false } });
        return availableAPIs.terminate();
    }
    document.body.style.fontFamily = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
    if (await availableAPIs.isDarkThemed()) document.body.style.color = "white";
    let describe = document.createElement("b");
    let form = document.createElement("form");
    let input = document.createElement("input");
    let submit = document.createElement("button");
    document.body.appendChild(describe);
    document.body.appendChild(document.createElement("br"));
    document.body.appendChild(form);
    form.appendChild(input);
    form.appendChild(submit);
    submit.innerText = await availableAPIs.lookupLocale("ENTER_BUTTON");
    describe.innerText = await availableAPIs.lookupLocale("USERNAME_PROMPT");
    input.placeholder = await availableAPIs.lookupLocale("USERNAME");
    async function userSubmit(e) {
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
            submit.innerText = await availableAPIs.lookupLocale("ENTER_BUTTON");
            if (userLogonSession.success == true) {
                await availableAPIs.automatedLogonDelete(userLogonID);
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
                submit.innerText = "OK";
                input.placeholder = "--->";
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
    if (user) {
        input.disabled = true;
        input.value = user;
        userSubmit({ preventDefault: () => {}, stopImmediatePropagation: () => {}, stopPropagation: () => {} });
    }
})();
addEventListener("signal", async function(e) {
    if (e.detail == 15) {   
        await availableAPIs.sendToPipe({ pipe: ipc, data: { success: false, cancelled: true } });
        await window.availableAPIs.terminate();
    }
}); null;