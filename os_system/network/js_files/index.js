(async function() {
    if (await availableAPIs.isDarkThemed()) document.body.style.color = "white";
    let links = {
        "Breakout": "/breakout.js",
        "Latest OS image": "/os_installer.jsdl",
        "Mini OS, based on build 999": "/minios.jsdl",
        "Sandbox escape": "/sandbox_escape.js"
    };

    let header = document.createElement("h2");
    let description = document.createElement("p");
    let headingDiv = document.createElement("div");
    let linksDiv = document.createElement("div");
    let linksDescription = document.createElement("p");
    header.innerText = "Hello, world!";
    description.innerText = "This is the PCOS 3 official blog server.";
    linksDescription.innerText = "Here are some links:";
    headingDiv.appendChild(header);
    headingDiv.appendChild(description);
    linksDiv.appendChild(linksDescription);

    for (let link in links) {
        let btn = document.createElement("button");
        btn.innerText = link;
        btn.onclick = _ => availableAPIs.navigate(links[link]);
        linksDiv.appendChild(btn);
        linksDiv.appendChild(document.createElement("br"));
    }

    document.body.appendChild(headingDiv);
    document.body.appendChild(document.createElement("hr"));
    document.body.appendChild(linksDiv);
})();
undefined;