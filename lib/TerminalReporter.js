"use strict";
const cp = require("child_process");
const net = require('net');
const os = require("os");
const atomAPI = require("atom");
const PIPE_PATH = "haskell-debug";
class TerminalReporter {
    constructor() {
        this.process = null;
        this.stream = null;
        this.emitter = new atomAPI.Emitter();
        this.streamData = "";
        this.totalData = "";
        var connectionPath = os.platform() == "win32" ?
            "\\\\.\\pipe\\" + PIPE_PATH : `/tmp/${PIPE_PATH}.sock`;
        var terminalEchoPath = `${atom.packages.getActivePackage("haskell-debug").path}/lib/TerminalEcho.js`;
        this.server = net.createServer(stream => {
            this.stream = stream;
            if (this.streamData !== "") {
                this.stream.write(this.streamData);
            }
            stream.on("data", data => this.onData(data));
            stream.on("end", () => console.log("NOOOOO"));
        });
        this.server.listen(connectionPath, () => {
            if (atom.config.get("haskell-debug.showDebugger"))
                this.process = cp.exec(`start node ${terminalEchoPath}`);
        });
    }
    prompt() {
        this.send({
            type: "user_input"
        });
    }
    write(output) {
        this.send({
            type: "message",
            content: output
        });
    }
    displayCommand(command) {
        this.send({
            type: "display-command",
            command: command
        });
    }
    send(data) {
        var sendingData = JSON.stringify(data) + "\n";
        if (this.stream == null)
            this.streamData += sendingData;
        else
            this.stream.write(sendingData);
    }
    onData(data) {
        var newLinePos = data.indexOf("\n");
        if (newLinePos != -1) {
            this.totalData += data.slice(0, newLinePos);
            this.emitter.emit("command", this.totalData);
            this.totalData = "";
            this.onData(data.slice(newLinePos + 1));
        }
        else {
            this.totalData += data;
        }
    }
    destroy() {
        if (this.process != null) {
            this.process.kill();
        }
        this.server.close();
    }
}
module.exports = TerminalReporter;
