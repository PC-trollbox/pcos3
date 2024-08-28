let tty_bios_api = {
    print: function(print, html) {
        let outputEl = document.createElement("span");
        outputEl["inner" + (html ? "HTML" : "Text")] = print || "";
        document.getElementById("tty_bios").appendChild(outputEl);
        outputEl.scrollIntoView();
        return true;
    },
    println: function(print, html) { return this.print((print || "") + "\n", html); },
    clear: () => document.getElementById("tty_bios").innerText = "",
    inputKey: function() {
        return new Promise(function(resolve) {
            addEventListener("keydown", function sel(e) {
                e.preventDefault();
                removeEventListener("keydown", sel);
                resolve(e);
            })
        });
    },
    inputLine: async function(reprint = false, string = false) {
        let collection = [];
        let inputView = document.createElement("span");
        if (reprint) document.getElementById("tty_bios").appendChild(inputView);
        while (collection[collection.length - 1] !== 13 && collection[collection.length - 1] !== "Enter") {
            let key = await this.inputKey();
            if (key.key == "Backspace") {
                inputView.innerText = inputView.innerText.slice(0, -1);
                collection.pop();
            }
            if (key.key.length == 1 || key.key == "Enter" || !string) {
                if (key.key.length == 1) {
                    inputView.innerText += key.key;
                    inputView.scrollIntoView();
                }
                collection.push(key[string ? "key" : "keyCode"]);
            }
        }
        this.print("\n");
        collection.pop();
        if (string) collection = collection.join("");
        return collection;
    }
};
