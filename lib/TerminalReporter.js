"use strict";
const cp = require("child_process");
const atomAPI = require("atom");
class TerminalReporter {
    constructor() {
        this.emitter = new atomAPI.Emitter();
        var terminalEchoPath = `${atom.packages.getActivePackage("haskell-debug").path}/lib/TerminalEcho.js`;
        this.process = cp.exec(`start node ${terminalEchoPath}`);
        this.process.on("message", (mes) => this.emitter.emit("command-issued", mes));
    }
    prompt() {
        this.process.send({
            type: "user_input"
        });
    }
    write(output) {
        this.process.send({
            type: "message",
            content: output
        });
    }
    displayCommand(command) {
        this.process.send({
            type: "display-command",
            command: command
        });
    }
    destroy() {
        this.process.kill();
    }
}
module.exports = TerminalReporter;
