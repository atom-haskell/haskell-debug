import cp = require("child_process");
import atomAPI = require("atom");

class TerminalReporter{
    private process: cp.ChildProcess;

    /**Events: prompt-entered(message: string)*/
    emitter = new atomAPI.Emitter();

    prompt() {
        this.process.send({
            type: "user_input"
        })
    }

    write(output: string){
        this.process.send({
            type: "message",
            content: output
        })
    }

    displayCommand(command: string){
        this.process.send({
            type: "display-command",
            command: command
        })
    }

    destroy(){
        this.process.kill();
    }

    constructor(){
        var terminalEchoPath = `${atom.packages.getActivePackage("haskell-debug").path}/lib/TerminalEcho.js`;

        this.process = cp.exec(`start node ${terminalEchoPath}`);

        this.process.on("message", (mes: string) => this.emitter.emit("command-issued", mes));
    }
}

export = TerminalReporter;
