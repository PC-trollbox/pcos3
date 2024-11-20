async function js_terminal() {
    // @pcos-app-mode native
    let windowtty = await modules.window(modules.session.active);
    windowtty.title.innerText = modules.locales.get("JS_TERMINAL");
    windowtty.closeButton.onclick = function() {
        windowtty.windowDiv.remove();
    }
    windowtty.content.style.padding = "0px";
    windowtty.content.style.margin = "0px";
    let term = new Terminal();
    let fitAddon = new FitAddon.FitAddon();
    term.loadAddon(fitAddon);
    term.open(windowtty.content);
    let onresizeFn = () => fitAddon.fit();
    onresizeFn();
    let robs = new ResizeObserver(onresizeFn);
    robs.observe(windowtty.windowDiv);
    term.clear();
    term.write(modules.locales.get("TERMINAL_INVITATION").replace("%s", pcos_version) + "\r\n\r\n");
    term.write("> ");
    let command = "";
    term.onData(function(e) {
        if (e == "\r") {
            term.write("\r\n");
            try {
                term.write(JSON.stringify(eval(command)) + "\r\n");
            } catch (e) {
                term.write(e + "\r\n");
            }
            term.write("> ");
            command = "";
        } else if (e == '\u007F') {
            if (command.length > 0) {
                command = command.substr(0, command.length - 1);
                term.write('\b \b');
            }
        } else {
            if (e >= String.fromCharCode(0x20) && e <= String.fromCharCode(0x7E) || e >= '\u00a0') {
                command += e;
                term.write(e);
            }
        }
    });
    return windowtty;
}