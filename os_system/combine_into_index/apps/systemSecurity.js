// =====BEGIN MANIFEST=====
// link: lrn:SYSTEM_SECURITY_TITLE
// signer: automaticSigner
// allow: GET_USER_INFO, USER_INFO_OTHERS, SENSITIVE_USER_INFO_OTHERS, SET_USER_INFO, GET_LOCALE, GET_THEME, CSP_OPERATIONS, SET_SECURITY_CHECKS, FS_LIST_PARTITIONS, FS_READ, FS_REMOVE, FS_WRITE, FS_CHANGE_PERMISSION, START_TASK, FS_BYPASS_PERMISSIONS, MANAGE_TOKENS, SWITCH_USERS_AUTOMATICALLY, ELEVATE_PRIVILEGES
// =====END MANIFEST=====
(async function() {
    // @pcos-app-mode isolatable
    await availableAPIs.windowTitleSet(await availableAPIs.lookupLocale("SYSTEM_SECURITY_TITLE"));
    let privileges = await availableAPIs.getPrivileges();
    let checklist = [ "GET_USER_INFO", "USER_INFO_OTHERS", "SENSITIVE_USER_INFO_OTHERS", "SET_USER_INFO", "FS_LIST_PARTITIONS", "FS_READ", "FS_REMOVE", "FS_WRITE", "FS_CHANGE_PERMISSION", "START_TASK", "FS_BYPASS_PERMISSIONS", "MANAGE_TOKENS", "SWITCH_USERS_AUTOMATICALLY", "ELEVATE_PRIVILEGES" ];
    document.body.style.fontFamily = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
    if (await availableAPIs.isDarkThemed()) document.body.style.color = "white";
    if (!checklist.every(p => privileges.includes(p))) {
        document.body.innerText = await availableAPIs.lookupLocale("SYSTEM_SECURITY_DENY");
        let currentToken = await availableAPIs.getProcessToken();
        let newToken = await availableAPIs.getNewToken(await availableAPIs.getUser());
        if (!newToken) return;
        await availableAPIs.setProcessToken(newToken);
        await availableAPIs.revokeToken(currentToken);
        privileges = await availableAPIs.getPrivileges();
        if (!checklist.every(p => privileges.includes(p))) return;
    }
    let pageHeader = document.createElement("b");
    let actionSpecificField = document.createElement("div");
    document.body.appendChild(pageHeader);
    document.body.appendChild(document.createElement("hr"));
    document.body.appendChild(actionSpecificField);
    let username, userData;
    async function main() {
        username = null;
        userData = null;
        actionSpecificField.innerText = "";
        let usernameField = document.createElement("input");
        let editButton = document.createElement("button");
        pageHeader.innerText = await availableAPIs.lookupLocale("USERNAME_PROMPT");
        editButton.innerText = await availableAPIs.lookupLocale("EDIT");
        usernameField.placeholder = await availableAPIs.lookupLocale("USERNAME");
        actionSpecificField.appendChild(usernameField);
        actionSpecificField.appendChild(editButton);
        editButton.addEventListener("click", async function() {
            if (!usernameField.value) return;
            username = usernameField.value;
            userData = await availableAPIs.getUserInfo({ desiredUser: username, sensitive: true });
            if (!userData) {
                userData = {
                    groups: [username],
                    homeDirectory: await availableAPIs.getSystemMount() + "/home/" + username,
                    securityChecks: []
                };
                await availableAPIs.setUserInfo({ desiredUser: username, info: userData });
            }
            userEditPage();
        });
    }

    async function userEditPage() {
        actionSpecificField.innerText = "";
        pageHeader.innerText = username;
        let homeDirectoryChanger = document.createElement("button");
        let securityChecksButton = document.createElement("button");
        let groupChanger = document.createElement("button");
        let removeButton = document.createElement("button");
        let leaveButton = document.createElement("button");
        homeDirectoryChanger.innerText = await availableAPIs.lookupLocale("USER_HOMEDIR");
        securityChecksButton.innerText = await availableAPIs.lookupLocale("PERSONAL_SECURITY_TITLE");
        groupChanger.innerText = await availableAPIs.lookupLocale("USER_GROUPS");
        removeButton.innerText = await availableAPIs.lookupLocale("REMOVE_BTN");
        leaveButton.innerText = await availableAPIs.lookupLocale("EXIT");
        homeDirectoryChanger.addEventListener("click", changeHomeDir);
        securityChecksButton.addEventListener("click", async function() {
            await availableAPIs.switchUserWithSetup(username);
            await availableAPIs.startTask({
                file: await availableAPIs.getSystemMount() + "/apps/personalSecurity.js",
                argPassed: []
            });
            await availableAPIs.terminate();
        });
        groupChanger.addEventListener("click", changeGroups);
        removeButton.addEventListener("click", removeUser);
        leaveButton.addEventListener("click", main);
        actionSpecificField.appendChild(homeDirectoryChanger);
        actionSpecificField.appendChild(securityChecksButton);
        actionSpecificField.appendChild(groupChanger);
        actionSpecificField.appendChild(removeButton);
        actionSpecificField.appendChild(leaveButton);
    }

    async function changeHomeDir() {
        actionSpecificField.innerText = "";
        pageHeader.innerText = "[" + username + "] " + await availableAPIs.lookupLocale("USER_HOMEDIR");
        let backButton = document.createElement("button");
        let homeDirectoryField = document.createElement("input");
        let changeButton = document.createElement("button");
        let createButton = document.createElement("button");
        let status = document.createElement("div");
        backButton.innerText = "<-";
        changeButton.innerText = await availableAPIs.lookupLocale("EDIT");
        createButton.innerText = await availableAPIs.lookupLocale("CREATE_HD");
        homeDirectoryField.value = userData.homeDirectory;
        backButton.addEventListener("click", userEditPage);
        changeButton.addEventListener("click", async function() {
            if (!homeDirectoryField.value) return;
            userData.homeDirectory = homeDirectoryField.value;
            await availableAPIs.setUserInfo({desiredUser: username, info: userData});
            userEditPage();
        });
        createButton.addEventListener("click", async function() {
            try {
                await mkrecursive(homeDirectoryField.value);
                await availableAPIs.fs_chown({ path: homeDirectoryField.value, newUser: username });
                await availableAPIs.fs_chgrp({ path: homeDirectoryField.value, newGrp: userData.groups[0] || username });
                await availableAPIs.fs_chmod({ path: homeDirectoryField.value, newPermissions: "rx" });
                status.innerText = await availableAPIs.lookupLocale("CREATING_HD_OK");
            } catch {
                status.innerText = await availableAPIs.lookupLocale("CREATING_HD_FAIL");
            }
        });
        actionSpecificField.appendChild(backButton);
        actionSpecificField.appendChild(homeDirectoryField);
        actionSpecificField.appendChild(changeButton);
        actionSpecificField.appendChild(createButton);
        actionSpecificField.appendChild(status);
    }

    async function changeGroups() {
        actionSpecificField.innerText = "";
        pageHeader.innerText = "[" + username + "] " + await availableAPIs.lookupLocale("USER_GROUPS");

        let backButton = document.createElement("button");
        let addGroup = document.createElement("button");
        backButton.innerText = "<-";
        addGroup.innerText = await availableAPIs.lookupLocale("ADD_BTN");

        backButton.addEventListener("click", userEditPage);
        addGroup.addEventListener("click", addGroupAction);
        actionSpecificField.appendChild(backButton);
        actionSpecificField.appendChild(addGroup);

        for (let group in userData.groups) {
            let groupInfo = userData.groups[group];
            let groupDiv = document.createElement("div");
            groupDiv.style.display = "flex";
            let groupNameDiv = document.createElement("div");
            groupNameDiv.style.flex = 100;
            let groupBtns = document.createElement("div");
            groupNameDiv.innerText = groupInfo;
            let btnUp = document.createElement("button");
            let btnDown = document.createElement("button");
            let btnDelete = document.createElement("button");
            btnUp.innerText = "/\\";
            btnUp.disabled = group == 0;
            btnDown.disabled = group == userData.groups.length - 1;
            btnDown.innerText = "\\/";
            btnDelete.innerText = "x";
            groupBtns.appendChild(btnUp);
            groupBtns.appendChild(btnDown);
            groupBtns.appendChild(btnDelete);
            groupDiv.appendChild(groupNameDiv);
            groupDiv.appendChild(groupBtns);
            btnDelete.addEventListener("click", async function() {
                userData.groups.splice(group, 1);
                await availableAPIs.setUserInfo({desiredUser: username, info: userData});
                changeGroups();
            });
            actionSpecificField.appendChild(groupDiv);
            btnUp.addEventListener("click", async function() {
                userData.groups.splice(group, 1);
                userData.groups.splice(group - 1, 0, groupInfo);
                await availableAPIs.setUserInfo({desiredUser: username, info: userData});
                changeGroups();
            });
            btnDown.addEventListener("click", async function() {
                userData.groups.splice(group, 1);
                userData.groups.splice(group - 1 + 2, 0, groupInfo);
                await availableAPIs.setUserInfo({desiredUser: username, info: userData});
                changeGroups();
            });
        }
    }

    async function addGroupAction() {
        actionSpecificField.innerText = "";
        let backButton = document.createElement("button");
        let groupNameField = document.createElement("input");
        let createButton = document.createElement("button");
        backButton.innerText = "<-";
        createButton.innerText = await availableAPIs.lookupLocale("ADD_BTN");
        backButton.addEventListener("click", changeGroups);
        createButton.addEventListener("click", async function() {
            userData.groups.push(groupNameField.value);
            await availableAPIs.setUserInfo({desiredUser: username, info: userData});
            changeGroups();
        });
        actionSpecificField.appendChild(backButton);
        actionSpecificField.appendChild(groupNameField);
        actionSpecificField.appendChild(createButton);
    }

    async function removeUser() {
        actionSpecificField.innerText = "";
        pageHeader.innerText = "[" + username + "] " + await availableAPIs.lookupLocale("REMOVE_BTN");
        let backButton = document.createElement("button");
        let removeWithHomedir = document.createElement("button");
        let removeAlone = document.createElement("button");
        backButton.innerText = "<-";
        removeWithHomedir.innerText = await availableAPIs.lookupLocale("REMOVE_USER_WITH_HD");
        removeAlone.innerText = await availableAPIs.lookupLocale("REMOVE_BTN");
        backButton.addEventListener("click", userEditPage);
        removeWithHomedir.addEventListener("click", async function() {
            recursiveRemove(userData.homeDirectory);
            await availableAPIs.setUserInfo({
                desiredUser: username,
                info: undefined
            });
            main();
        });
        removeAlone.addEventListener("click", async function() {
            await availableAPIs.setUserInfo({
                desiredUser: username,
                info: undefined
            });
            main();
        });
        actionSpecificField.appendChild(backButton);
        actionSpecificField.appendChild(removeWithHomedir);
        actionSpecificField.appendChild(removeAlone);
    }

    async function mkrecursive(dir) {
        let slices = dir.split("/");
        for (let i = 2; i <= slices.length; i++) {
            let browse = await availableAPIs.fs_ls({ path: slices.slice(0, i - 1).join("/") });
            if (!browse.includes(slices[i - 1])) {
                let createdPath = slices.slice(0, i).join("/")
                await availableAPIs.fs_mkdir({ path: createdPath });
                await availableAPIs.fs_chown({ path: createdPath, newUser: "root" });
                await availableAPIs.fs_chgrp({ path: createdPath, newGrp: "root" });
                await availableAPIs.fs_chmod({ path: createdPath, newPermissions: "rx" });
            }
        }
    }

    async function recursiveRemove(path) {
        let dirList = await availableAPIs.fs_ls({ path });
        for (let fileIndex in dirList) {
            let file = dirList[fileIndex];
            if (await availableAPIs.fs_isDirectory({ path: path + "/" + file })) await recursiveRemove(path + "/" + file);
            else await availableAPIs.fs_rm({ path: path + "/" + file });
        }
        await availableAPIs.fs_rm({ path });
    }
    main();
})();
addEventListener("signal", async function(e) {
    if (e.detail == 15) await window.availableAPIs.terminate();
}); null;