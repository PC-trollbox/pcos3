// =====BEGIN MANIFEST=====
// link: lrn:TASK_MANAGER
// signer: automaticSigner
// fnName: taskMgrInstaller
// allow: LIST_TASKS, SIGNAL_TASK, GET_LOCALE, GET_THEME, TASK_BYPASS_PERMISSIONS
// =====END MANIFEST=====
(async function() {
    // @pcos-app-mode isolatable
    await availableAPIs.windowTitleSet(await availableAPIs.lookupLocale("TASK_MANAGER"));
    let privileges = await availableAPIs.getPrivileges();
    let checklist = [ "LIST_TASKS", "SIGNAL_TASK" ];
    document.body.style.fontFamily = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
    if (await availableAPIs.isDarkThemed()) document.body.style.color = "white";
    if (!checklist.every(p => privileges.includes(p))) {
        document.body.innerText = (await availableAPIs.lookupLocale("TMGR_PERMISSION")).replace("%s", checklist.join(", "));
        return;
    }
    let styleElement = document.createElement("style");
    styleElement.innerText = `th, td { border: 1px solid black; }
    table { overflow: scroll; min-width: 100%; width: max-content; }`;
    document.head.appendChild(styleElement);
    let table = document.createElement("table");
    let thead = document.createElement("thead");
    let theadRow = document.createElement("tr");
    let thBasename = document.createElement("th");
    let thUser = document.createElement("th");
    let thTerminate = document.createElement("th");
    let thFP = document.createElement("th");
    let thArgs = document.createElement("th");
    let tbody = document.createElement("tbody");
    thBasename.innerText = await availableAPIs.lookupLocale("BASENAME_TASK");
    thUser.innerText = await availableAPIs.lookupLocale("USER_TASK");
    thTerminate.innerText = await availableAPIs.lookupLocale("TERMINATE_TASK");
    thFP.innerText = await availableAPIs.lookupLocale("FULL_PATH_TASK");
    thArgs.innerText = await availableAPIs.lookupLocale("ARGUMENTS_TASK");
    theadRow.appendChild(thBasename);
    theadRow.appendChild(thUser);
    theadRow.appendChild(thTerminate);
    theadRow.appendChild(thFP);
    theadRow.appendChild(thArgs);
    thead.appendChild(theadRow);
    table.appendChild(thead);
    table.appendChild(tbody);
    document.body.appendChild(table);
    setInterval(async function refresh() {
        let prevtb = tbody;
        let newtb = document.createElement("tbody");
        let tasks = await availableAPIs.listTasks();
        for (let task of tasks) {
            let tr = document.createElement("tr");
            let tdBasename = document.createElement("td");
            let tdUser = document.createElement("td");
            let tdTerminate = document.createElement("td");
            let tdFP = document.createElement("td");
            let tdArgs = document.createElement("td");
            let taskInfo = await availableAPIs.taskInfo(task);
            let terminateBtn = document.createElement("button");
            tdBasename.innerText = taskInfo.file.split("/").slice(-1)[0];
            tdUser.innerText = taskInfo.runBy;
            tdFP.innerText = taskInfo.file;
            tdArgs.innerText = "[" + (taskInfo.arg || []).map(a => JSON.stringify(a)).join(", ") + "]";
            terminateBtn.innerText = await availableAPIs.lookupLocale("TERMINATE_TASK");
            terminateBtn.addEventListener("click", async function() {
                await availableAPIs.signalTask({ taskId: task, signal: 9 });
                refresh();
            });
            tdTerminate.appendChild(terminateBtn);
            tr.appendChild(tdBasename);
            tr.appendChild(tdUser);
            tr.appendChild(tdTerminate);
            tr.appendChild(tdFP);
            tr.appendChild(tdArgs);
            newtb.appendChild(tr);
        }
        table.appendChild(newtb);
        prevtb.remove();
        tbody = newtb;
    }, 1000);
})();
addEventListener("signal", async function(e) {
    if (e.detail == 15) await window.availableAPIs.terminate();
}); null;