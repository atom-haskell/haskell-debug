"use strict";
const cp = require("child_process");
const net = require('net');
const os = require("os");
const atomAPI = require("atom");
const PIPE_PATH = "haskell-debug";
class TerminalReporter {
    constructor() {
        this.process = null;
        this.socket = null;
        this.emitter = new atomAPI.Emitter();
        this.streamData = "";
        this.totalData = "";
        var connectionPath = os.platform() == "win32" ?
            "\\\\.\\pipe\\" + PIPE_PATH : `/tmp/${PIPE_PATH}.sock`;
        var terminalEchoPath = `${atom.packages.getActivePackage("haskell-debug").path}/lib/TerminalEcho.js`;
        this.server = net.createServer(socket => {
            this.socket = socket;
            if (this.streamData !== "") {
                this.socket.write(this.streamData);
            }
            socket.on("data", data => this.onData(data));
            socket.on("end", () => {
                this.emitter.emit("close", null);
            });
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
        try {
            var sendingData = JSON.stringify(data) + "\n";
            if (this.socket == null)
                this.streamData += sendingData;
            else
                this.socket.write(sendingData);
        }
        catch (e) {
        }
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
            this.send({
                type: "close"
            });
            this.process.kill();
        }
        this.server.close();
    }
}
module.exports = TerminalReporter;
