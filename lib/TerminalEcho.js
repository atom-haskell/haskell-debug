"use strict";
const readline = require("readline");
const rl = readline.createInterface({
    input: process.stdin
});
var sendHandle;
var ignoreOutput = false;
rl.on("line", (text) => {
    if (ignoreOutput) {
        ignoreOutput = false;
        return;
    }
    sendHandle.write(text);
});
process.on("message", (message, _sendHandle) => {
    sendHandle = _sendHandle;
    if (message.type == "message") {
        process.stdout.write(message.content);
    }
    else if (message.type == "display-command") {
        readline.clearLine(process.stdout, 0);
        process.stdout.write(message.command);
        ignoreOutput = true;
        rl.write("\n");
    }
    else if (message.type == "destroy-prompt") {
        rl.close();
    }
    else {
        rl.prompt();
    }
});
