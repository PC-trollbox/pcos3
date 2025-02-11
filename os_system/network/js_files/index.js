document.body.style.background = "black";
document.body.style.color = "white";
document.body.innerText = "Hello, world!";
let btn = document.createElement("button");
btn.innerText = "Click me to play Breakout!";
btn.onclick = _ => availableAPIs.navigate("/breakout.js");
document.body.appendChild(document.createElement("br"));
document.body.appendChild(btn);
undefined;