function systemKillWaiter() {
    // @pcos-app-mode native
    modules.startupWindow.windowDiv.remove();
    return new Promise(function(resolve) {
        modules.killSystem = resolve;
    });
}
return await systemKillWaiter();