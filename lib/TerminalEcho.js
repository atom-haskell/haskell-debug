"use strict";
const net = require("net");
const os = require("os");
const readline = require("readline");
const PIPE_NAME = "haskell-debug";
var connectionPath = os.platform() == "win32" ?
    "\\\\.\\pipe\\" + PIPE_NAME : `/tmp/${PIPE_NAME}.sock`;
var client = net.connect(connectionPath);
const rl = readline.createInterface({
    input: process.stdin
});
var ignoreOutput = false;
rl.on("line", (text) => {
    if (ignoreOutput) {
        ignoreOutput = false;
        return;
    }
    client.write(text + "\n");
});
var totalData = "";
client.on("data", (data) => {
    onData(data.toString());
});
function onData(data) {
    var newLinePos = data.indexOf("\n");
    if (newLinePos != -1) {
        totalData += data.slice(0, newLinePos);
        onMessage(JSON.parse(totalData));
        totalData = "";
        onData(data.slice(newLinePos + 1));
    }
    else {
        totalData += data;
    }
}
function onMessage(message) {
    if (message.type == "message") {
        process.stdout.write(message.content);
    }
    else if (message.type == "display-command") {
        process.stdout.write(message.command + "\n");
        ignoreOutput = true;
        rl.write("\n");
    }
    else if (message.type == "destroy-prompt") {
        rl.close();
    }
    else if (message.type == "close") {
        process.exit();
    }
    else {
        rl.prompt();
    }
}
