const express = require("express");
const fs = require("fs");
const app = express();
const http = require("http").createServer(app);
const pathAPI = require("path");
const cors = require("cors");
const util = require("util");
let args = util.parseArgs({
    allowPositionals: true,
    strict: false
});
let base = args.positionals[0] || ".";

app.use(cors({
    origin: [
        "https://pcos3.pcprojects.tk",
        "https://pcos3.pcprojects.duckdns.org",
    ]
}));

app.use(function(err, req, res, next) {
    res.send(500).json({ name: err.name, message: err.message });
});

app.post("/sfsp/file_operation", express.json(), async function(req, res) {
    let path = pathAPI.join(base, req.body.parameters[0]);
    if (req.body.operation == "read") {
        res.json(fs.readFileSync(path).toString());
    } else if (req.body.operation == "write") {
        fs.writeFileSync(path, req.body.parameters[1]);
        res.json(null);
    } else if (req.body.operation == "rm") {
        fs.rmSync(path, {
            recursive: true,
            force: true
        });
        res.json(null);
    } else if (req.body.operation == "ls") {
        res.json(fs.readdirSync(path));
    } else if (req.body.operation == "mkdir") {
        fs.mkdirSync(path);
        res.json(null);
    } else if (req.body.operation == "permissions") {
        let stat = fs.statSync(path);
        res.json({
            owner: stat.uid.toString(),
            group: stat.gid.toString(),
            world: convPerms((+(stat.mode.toString(8).slice(-1))).toString(2))
        });
    } else if (req.body.operation == "chown") {
        let stat = fs.statSync(path);
        fs.chownSync(path, +(req.body.parameters[1]), stat.gid);
        res.json(null);
    } else if (req.body.operation == "chgrp") {
        let stat = fs.statSync(path);
        fs.chownSync(path, stat.uid, +(req.body.parameters[1]));
        res.json(null);
    } else if (req.body.operation == "chmod") {
        fs.chmodSync(path, convBackPerms(req.body.parameters[1]));
        res.json(null);
    } else if (req.body.operation == "isDirectory") {
        res.json(fs.statSync(path).isDirectory());
    } else if (req.body.operation == "unmount" || req.body.operation == "sync") {
        res.json(null);
    } else {
        res.sendStatus(400);
    }
});

function convPerms(s) {
    let ret = "";
    if (s[0] == "1") ret += "r";
    if (s[1] == "1") ret += "w";
    if (s[2] == "1") ret += "x";
    return ret;
}

function convBackPerms(s) {
    let ret = 0;
    if (s.includes("r")) ret += 4;
    if (s.includes("w")) ret += 2;
    if (s.includes("x")) ret += 1;
    return "77" + ret.toString();
}

app.post("/sfsp/properties", express.json(), async function(req, res) {
    res.json({
        directory_supported: true,
        read_only: false,
        filesystem: "convertnode",
        permissions_supported: true
    });
});

app.get("/sfsp/session", function(req, res) {
    res.json(null);
});

app.use("/sfsp", function(req, res) {
    res.sendStatus(400);
});

http.listen(+args.values.p || 3945, function() {
    console.log("Listening on port " + (+args.values.p || 3945));
});