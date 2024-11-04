// =====BEGIN MANIFEST=====
// link: lrn:PERSONAL_SECURITY_TITLE
// signer: automaticSigner
// allow: SET_SECURITY_CHECKS, GET_USER_INFO, CSP_OPERATIONS, GET_LOCALE, GET_THEME
// =====END MANIFEST=====
(async function() {
    // @pcos-app-mode isolatable
    await availableAPIs.windowTitleSet(await availableAPIs.lookupLocale("PERSONAL_SECURITY_TITLE"));
    let privileges = await availableAPIs.getPrivileges();
    let checklist = [ "SET_SECURITY_CHECKS", "GET_USER_INFO", "CSP_OPERATIONS" ];
    document.body.style.fontFamily = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
    if (await availableAPIs.isDarkThemed()) document.body.style.color = "white";
    if (!checklist.every(p => privileges.includes(p))) {
        document.body.innerText = await availableAPIs.lookupLocale("PERSONAL_SECURITY_DENY");
        let currentToken = await availableAPIs.getProcessToken();
        let newToken = await availableAPIs.consentGetToken({
            intent: await availableAPIs.lookupLocale("PERSONAL_SECURITY_INTENT"),
            name: await availableAPIs.lookupLocale("PERSONAL_SECURITY_TITLE"),
            desiredUser: await availableAPIs.getUser()
        });
        if (!newToken) return;
        await availableAPIs.setProcessToken(newToken);
        await availableAPIs.revokeToken(currentToken);
        privileges = await availableAPIs.getPrivileges();
        if (!checklist.every(p => privileges.includes(p))) return;
    }
    let toolbar = document.createElement("div");
    let saveBtn = document.createElement("button");
    let loadBtn = document.createElement("button");
    let addBtn = document.createElement("button");
    toolbar.appendChild(saveBtn);
    toolbar.appendChild(loadBtn);
    toolbar.appendChild(addBtn);
    saveBtn.innerText = await availableAPIs.lookupLocale("SAVE_BTN");
    loadBtn.innerText = await availableAPIs.lookupLocale("LOAD_BTN");
    addBtn.innerText = await availableAPIs.lookupLocale("ADD_BTN");
    saveBtn.onclick = async function() {
        await availableAPIs.setOwnSecurityChecks({ checks });
        checks = (await availableAPIs.getUserInfo({ desiredUser: await availableAPIs.getUser(), sensitive: true })).securityChecks;
        reparse();
    };
    loadBtn.onclick = async function() {
        checks = (await availableAPIs.getUserInfo({ desiredUser: await availableAPIs.getUser(), sensitive: true })).securityChecks;
        reparse();
    };
    addBtn.onclick = function() {
        add();
    }
    document.body.appendChild(toolbar);
    document.body.appendChild(document.createElement("hr"));
    let secCheck = document.createElement("div");
    let types = [
        "pbkdf2",
        "informative",
        "informative_deny",
        "timeout",
        "timeout_deny",
        "serverReport",
        "pc-totp",
        "totp",
        "workingHours",
        "zkpp"
    ];
    let checks = (await availableAPIs.getUserInfo({ desiredUser: await availableAPIs.getUser(), sensitive: true })).securityChecks;

    let checkLocales = {
        "pbkdf2": "PBKDF2_OPTION",
        "informative": "INFORMATIVE_MESSAGE_OPTION",
        "informative_deny": "INFORMATIVE_MESSAGE_DENY_OPTION",
        "timeout": "TIMEOUT_OPTION",
        "timeout_deny": "TIMEOUT_DENY_OPTION",
        "serverReport": "SERVER_REPORT_OPTION",
        "pc-totp": "PCTOTP_OPTION",
        "totp": "RFCTOTP_OPTION",
        "workingHours": "WORKING_HOURS_OPTION",
        "zkpp": "ZKPP_OPTION"
    };

    async function reparse() {
        secCheck.remove();
        secCheck = document.createElement("div");

        for (let check in checks) {
            let checkInfo = checks[check];
            let checkDiv = document.createElement("div");
            checkDiv.style.display = "flex";
            let checkTitle = document.createElement("div");
            checkTitle.style.flex = 100;
            let checkBtns = document.createElement("div");
            checkTitle.innerText = await availableAPIs.lookupLocale(checkLocales[checkInfo.type]);
            let btnConfig = document.createElement("button");
            let btnUp = document.createElement("button");
            let btnDown = document.createElement("button");
            let btnDelete = document.createElement("button");
            btnConfig.innerText = "*";
            btnUp.innerText = "/\\";
            btnUp.disabled = check == 0;
            btnDown.disabled = check == checks.length - 1;
            btnDown.innerText = "\\/";
            btnDelete.innerText = "x";
            checkBtns.appendChild(btnConfig);
            checkBtns.appendChild(btnUp);
            checkBtns.appendChild(btnDown);
            checkBtns.appendChild(btnDelete);
            checkDiv.appendChild(checkTitle);
            checkDiv.appendChild(checkBtns);
            btnDelete.addEventListener("click", function() {
                checks.splice(check, 1);
                reparse();
            });
            secCheck.appendChild(checkDiv);
            btnUp.addEventListener("click", function() {
                checks.splice(check, 1);
                checks.splice(check - 1, 0, checkInfo);
                reparse();
            });
            btnDown.addEventListener("click", function() {
                checks.splice(check, 1);
                checks.splice(check - 1 + 2, 0, checkInfo);
                reparse();
            });
            btnConfig.addEventListener("click", function() {
                checkConfig(check);
            });
        }
        document.body.appendChild(secCheck);
    }

    async function checkConfig(check) {
        secCheck.remove();
        secCheck = document.createElement("div");
        let checkInfo = checks[check];
        let checkBack = document.createElement("button");
        let checkName = document.createElement("b");
        checkBack.innerText = "<-";
        checkName.innerText = await availableAPIs.lookupLocale(checkLocales[checkInfo.type]);
        secCheck.appendChild(checkBack);
        secCheck.appendChild(checkName);
        secCheck.appendChild(document.createElement("br"));
        checkBack.addEventListener("click", function() {
            reparse();
        });
        if (checkInfo.type == "pbkdf2") {
            let inputDescribe = document.createElement("span");
            let inputBox = document.createElement("input");
            let inputAccept = document.createElement("button");
            inputDescribe.innerText = await availableAPIs.lookupLocale("PASSWORD") + ": ";
            inputBox.type = "password";
            secCheck.appendChild(inputDescribe);
            secCheck.appendChild(inputBox);
            secCheck.appendChild(inputAccept);
            inputAccept.innerText = await availableAPIs.lookupLocale("CONFIRM");
            inputAccept.addEventListener("click", async function() {
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
                        keyData: new TextEncoder().encode(inputBox.value),
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
                checks[check] = {
                    type: "pbkdf2",
                    hash: u8aToHex(derived),
                    salt: u8aToHex(salt)
                };
                reparse();
            });
        } else if (checkInfo.type == "informative" || checkInfo.type == "informative_deny") {
            let textarea = document.createElement("textarea");
            let inputAccept = document.createElement("button");
            textarea.placeholder = await availableAPIs.lookupLocale("MESSAGE_ENTER");
            textarea.value = checkInfo.message;
            secCheck.appendChild(textarea);
            secCheck.appendChild(document.createElement("br"));
            secCheck.appendChild(inputAccept);
            inputAccept.innerText = await availableAPIs.lookupLocale("CONFIRM");
            inputAccept.addEventListener("click", function() {
                checks[check].message = textarea.value;
                reparse();
            });
        } else if (checkInfo.type == "timeout" || checkInfo.type == "timeout_deny") {
            let inputDescribe = document.createElement("span");
            let inputBox = document.createElement("input");
            let inputAccept = document.createElement("button");
            inputDescribe.innerText = await availableAPIs.lookupLocale("TIMEOUT_FIELD") + ": ";
            inputBox.type = "number";
            inputBox.value = checkInfo.timeout;
            inputAccept.innerText = await availableAPIs.lookupLocale("CONFIRM");
            secCheck.appendChild(inputDescribe);
            secCheck.appendChild(inputBox);
            secCheck.appendChild(inputAccept);
            inputAccept.addEventListener("click", function() {
                checks[check].timeout = inputBox.value;
                reparse();
            });
        } else if (checkInfo.type == "serverReport") {
            let inputDescribe = document.createElement("span");
            let inputBox = document.createElement("input");
            let inputAccept = document.createElement("button");
            inputDescribe.innerText = "URL: ";
            inputBox.type = "text";
            inputBox.placeholder = "https://example.org/report";
            inputBox.value = checkInfo.url;
            inputAccept.innerText = await availableAPIs.lookupLocale("CONFIRM");
            secCheck.appendChild(inputDescribe);
            secCheck.appendChild(inputBox);
            secCheck.appendChild(inputAccept);
            inputAccept.addEventListener("click", function() {
                checks[check].url = inputBox.value;
                reparse();
            });
        } else if (checkInfo.type == "pc-totp") {
            let inputDescribe = document.createElement("span");
            let inputBox = document.createElement("input");
            let regen = document.createElement("button");
            let inputAccept = document.createElement("button");
            inputDescribe.innerText = await availableAPIs.lookupLocale("SECRET_FIELD_TXT") + ": ";
            inputBox.type = "text";
            inputBox.value = checkInfo.secret;
            regen.innerText = await availableAPIs.lookupLocale("REGENERATE");
            inputAccept.innerText = await availableAPIs.lookupLocale("CONFIRM");
            secCheck.appendChild(inputDescribe);
            secCheck.appendChild(inputBox);
            secCheck.appendChild(document.createElement("br"));
            secCheck.appendChild(regen);
            secCheck.appendChild(inputAccept);
            regen.addEventListener("click", async function() {
                let randomValues = await availableAPIs.cspOperation({
                    cspProvider: "basic",
                    operation: "random",
                    cspArgument: new Uint8Array(32)
                });
                inputBox.value = Array.from(randomValues).map(x => x.toString(16).padStart(2, "0")).join("");
            });
            inputAccept.addEventListener("click", function() {
                checks[check].secret = inputBox.value;
                reparse();
            });
        } else if (checkInfo.type == "totp") {
            let inputDescribe = document.createElement("span");
            let inputBox = document.createElement("input");
            let regen = document.createElement("button");
            let inputAccept = document.createElement("button");
            inputDescribe.innerText = await availableAPIs.lookupLocale("SECRET_FIELD_HEX") + ": ";
            inputBox.type = "text";
            inputBox.value = checkInfo.secret;
            regen.innerText = await availableAPIs.lookupLocale("REGENERATE");
            inputAccept.innerText = await availableAPIs.lookupLocale("CONFIRM");
            secCheck.appendChild(inputDescribe);
            secCheck.appendChild(inputBox);
            secCheck.appendChild(document.createElement("br"));
            secCheck.appendChild(regen);
            secCheck.appendChild(inputAccept);
            regen.addEventListener("click", async function() {
                let randomValues = await availableAPIs.cspOperation({
                    cspProvider: "basic",
                    operation: "random",
                    cspArgument: new Uint8Array(10)
                });
                inputBox.value = Array.from(randomValues).map(x => x.toString(16).padStart(2, "0")).join("");
            });
            inputAccept.addEventListener("click", function() {
                checks[check].secret = inputBox.value;
                reparse();
            });
        } else if (checkInfo.type == "workingHours") {
            let inputStartDescribe = document.createElement("span");
            let inputEndDescribe = document.createElement("span");
            let inputBoxStart = document.createElement("input");
            let inputBoxEnd = document.createElement("input");
            let inputAccept = document.createElement("button");
            inputStartDescribe.innerText = await availableAPIs.lookupLocale("START_TIME_FIELD") + ": ";
            inputBoxStart.type = "time";
            inputBoxStart.step = 1;
            if (checkInfo.start) inputBoxStart.value = String(checkInfo.start.hours).padStart(2, "0") + ":" + String(checkInfo.start.minutes).padStart(2, "0") + ":" + String(checkInfo.start.seconds).padStart(2, "0");
            inputEndDescribe.innerText = await availableAPIs.lookupLocale("END_TIME_FIELD") + ": ";
            inputBoxEnd.type = "time";
            inputBoxEnd.step = 1;
            if (checkInfo.end) inputBoxEnd.value = String(checkInfo.end.hours).padStart(2, "0") + ":" + String(checkInfo.end.minutes).padStart(2, "0") + ":" + String(checkInfo.end.seconds).padStart(2, "0");
            inputAccept.innerText = await availableAPIs.lookupLocale("CONFIRM");
            secCheck.appendChild(inputStartDescribe);
            secCheck.appendChild(inputBoxStart);
            secCheck.appendChild(document.createElement("br"));
            secCheck.appendChild(inputEndDescribe);
            secCheck.appendChild(inputBoxEnd);
            secCheck.appendChild(document.createElement("br"));
            secCheck.appendChild(inputAccept);
            inputAccept.addEventListener("click", function() {
                checks[check].start = {
                    hours: Number(inputBoxStart.value.split(":")[0]),
                    minutes: Number(inputBoxStart.value.split(":")[1]),
                    seconds: Number(inputBoxStart.value.split(":")[2])
                };
                checks[check].end = {
                    hours: Number(inputBoxEnd.value.split(":")[0]),
                    minutes: Number(inputBoxEnd.value.split(":")[1]),
                    seconds: Number(inputBoxEnd.value.split(":")[2])
                };
                reparse();
            });
        } else if (checkInfo.type == "zkpp") {
            let inputDescribe = document.createElement("span");
            let inputBox = document.createElement("input");
            let inputAccept = document.createElement("button");
            inputDescribe.innerText = await availableAPIs.lookupLocale("PASSWORD") + ": ";
            inputBox.type = "password";
            secCheck.appendChild(inputDescribe);
            secCheck.appendChild(inputBox);
            secCheck.appendChild(inputAccept);
            inputAccept.innerText = await availableAPIs.lookupLocale("CONFIRM");
            inputAccept.addEventListener("click", async function() {
                let u8aToHex = (u8a) => Array.from(u8a).map(a => a.toString(16).padStart(2, "0")).join("");
                let key = await availableAPIs.cspOperation({
                    cspProvider: "basic",
                    operation: "importKey",
                    cspArgument: {
                        format: "raw",
                        keyData: new TextEncoder().encode(inputBox.value),
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
                            salt: new Uint8Array(32),
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
                let publicKey = (await availableAPIs.cspOperation({
                    cspProvider: "tweetnacl",
                    operation: "deriveKey",
                    cspArgument: {
                        type: "sign",
                        seed: derived
                    }
                })).publicKey;
                checks[check] = {
                    type: "zkpp",
                    publicKey: u8aToHex(publicKey)
                };
                reparse();
            });
        }
        document.body.appendChild(secCheck);
    }

    async function add() {
        secCheck.remove();
        secCheck = document.createElement("div");
        let backBtn = document.createElement("button");
        backBtn.innerText = "<-";
        backBtn.addEventListener("click", function() {
            reparse();
        });
        secCheck.appendChild(backBtn);
        for (let type of types) {
            let btn = document.createElement("button");
            btn.innerText = await availableAPIs.lookupLocale(checkLocales[type]);
            btn.addEventListener("click", function() {
                checks.push({ type });
                reparse();
            });
            secCheck.appendChild(btn);
        }
        document.body.appendChild(secCheck);
    }
    reparse();
})();
addEventListener("signal", async function(e) {
    if (e.detail == 15) await window.availableAPIs.terminate();
}); null;