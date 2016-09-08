import net = require("net");
import os = require("os");
import readline = require("readline");

type Message = {
    type: "message";
    content: string
} | {
    type: "user_input";
} | {
    type: "destroy-prompt";
} | {
    type: "display-command";
    command: string;
} | {
    type: "close";
}

const PIPE_NAME = "haskell-debug";

var connectionPath = os.platform() == "win32" ?
    "\\\\.\\pipe\\" + PIPE_NAME : `/tmp/${PIPE_NAME}.sock`;
var client = net.connect(connectionPath);

const rl = readline.createInterface({
    input: process.stdin
});

var ignoreOutput = false;

rl.on("line", (text: string) => {
    if(ignoreOutput){
        ignoreOutput = false;
        return;
    }
    client.write(text + "\n");
})

var totalData = "";
client.on("data", (data: Buffer) => {
    onData(data.toString());
})

function onData(data: string){
    var newLinePos = data.indexOf("\n");
    if(newLinePos != -1){
        totalData += data.slice(0, newLinePos);
        onMessage(JSON.parse(totalData));
        totalData = "";
        onData(data.slice(newLinePos + 1));
    }
    else{
        totalData += data;
    }
}

function onMessage(message: Message){
    if(message.type == "message"){
        process.stdout.write(message.content);
    }
    else if(message.type == "display-command"){
        process.stdout.write(message.command + "\n");
        ignoreOutput = true;
        rl.write("\n");
    }
    else if(message.type == "destroy-prompt"){
        rl.close();
    }
    else if(message.type == "close"){
        process.exit();
    }
    else{
        rl.prompt();
    }
}
