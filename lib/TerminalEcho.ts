import net = require("net");
import readline = require("readline");

const rl = readline.createInterface({
    input: process.stdin
});

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
}

var sendHandle: net.Socket;
var ignoreOutput = false;

rl.on("line", (text: string) => {
    if(ignoreOutput){
        ignoreOutput = false;
        return;
    }
    sendHandle.write(text);
})

process.on("message", (message: Message, _sendHandle: net.Socket) => {
    sendHandle = _sendHandle;
    if(message.type == "message"){
        process.stdout.write(message.content);
    }
    else if(message.type == "display-command"){
        readline.clearLine(process.stdout, 0);
        process.stdout.write(message.command);
        ignoreOutput = true;
        rl.write("\n");
    }
    else if(message.type == "destroy-prompt"){
        rl.close();
    }
    else{
        rl.prompt();
    }
})
