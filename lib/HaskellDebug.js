"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
const cp = require("child_process");
const os = require("os");
var Emitter = require("./Emitter");
var HaskellDebug;
(function (HaskellDebug_1) {
    function getPenultimateLine(str) {
        var lines = str.split("\n");
        return lines[lines.length - 1];
    }
    class HaskellDebug {
        constructor() {
            this.breakpoints = [];
            this.isRunning = false;
            this.emitter = new Emitter();
            this.currentCommandBuffer = "";
            this.commandListeners = [];
            this.commandFinishedString = "\"command_finish_o4uB1whagteqE8xBq9oq\"" + os.EOL;
            this.ghci_cmd = cp.spawn("ghci");
            this.stdout = this.ghci_cmd.stdout;
            this.stdin = this.ghci_cmd.stdin;
            this.stderr = this.ghci_cmd.stderr;
            this.stdout.on("readable", () => this.onReadable());
            this.stderr.on("readable", () => console.log(`stderr: %c ${this.stderr.read().toString()}`, "color: red"));
        }
        loadModule(name) {
            this.run(`:load ${name}`);
        }
        pauseOnException() {
            this.run(":set -fbreak-on-exception");
        }
        addBreakpoint(breakpoint) {
            if (typeof breakpoint == "string")
                this.run(`:break ${breakpoint}`);
            else
                this.run(`:break ${breakpoint.file} ${breakpoint.line}`);
        }
        forward() {
            this.run(":forward", true);
        }
        back() {
            this.run(":back", true);
        }
        stop() {
            this.run(":quit");
            this.emitter.emit("debug-finished", null);
        }
        continue() {
            this.run("continue", true);
        }
        startDebug() {
            return __awaiter(this, void 0, void 0, function* () {
                yield this.run(":trace main", true);
            });
        }
        getBindings() {
            return __awaiter(this, void 0, void 0, function* () {
                var outputStr = yield this.run(":show bindings");
                var lines = outputStr.split(os.EOL);
                return lines.slice(0, lines.length - 2);
            });
        }
        parsePrompt(stdOutput) {
            var breakInfoOb;
            var patterns = [{
                    pattern: /\[(?:[-\d]*: )?(.*):\((\d+),(\d+)\)-\((\d+),(\d+)\).*\].*> $/,
                    func: match => ({
                        filename: match[1],
                        range: [[parseInt(match[2]) - 1, parseInt(match[3]) - 1],
                            [parseInt(match[4]), parseInt(match[5])]]
                    })
                }, {
                    pattern: /\[(?:[-\d]*: )?(.*):(\d*):(\d*)-(\d*)\].*> $/,
                    func: match => ({
                        filename: match[1],
                        range: [[parseInt(match[2]) - 1, parseInt(match[3]) - 1],
                            [parseInt(match[2]), parseInt(match[4])]]
                    })
                }, {
                    pattern: /\[<exception thrown>\].*> $/,
                    func: () => HaskellDebug.pausedOnError
                }, {
                    pattern: /.*> $/,
                    func: () => HaskellDebug.finishedDebugging
                }];
            for (var pattern of patterns) {
                var matchResult = stdOutput.match(pattern.pattern);
                if (matchResult != null) {
                    return pattern.func(matchResult);
                }
            }
            throw new Error("Cannot read prompt: \n" + stdOutput);
        }
        emitStatusChanges(prompt) {
            return __awaiter(this, void 0, void 0, function* () {
                var result = this.parsePrompt(prompt);
                if (result == HaskellDebug.pausedOnError) {
                    var exceptionString = yield this.run("print _exception");
                }
                else if (result == HaskellDebug.finishedDebugging) {
                    this.emitter.emit("debug-finished", undefined);
                }
                else {
                    this.emitter.emit("line-changed", result);
                }
            });
        }
        onReadable() {
            var currentString = (this.stdout.read() || "").toString();
            console.log(currentString);
            this.currentCommandBuffer += currentString;
            var finishStringPosition = this.currentCommandBuffer.search(this.commandFinishedString);
            if (finishStringPosition !== -1) {
                var callback = this.commandListeners.shift();
                callback(this.currentCommandBuffer.slice(0, finishStringPosition));
                this.currentCommandBuffer = this.currentCommandBuffer.slice(finishStringPosition + this.commandFinishedString.length);
                this.onReadable();
            }
        }
        run(command, emitStatusChanges) {
            emitStatusChanges = emitStatusChanges || false;
            return new Promise(fulfil => {
                this.stdin.write(command + os.EOL);
                this.stdin.write(this.commandFinishedString);
                this.commandListeners.push(output => {
                    console.log(command);
                    var commandPosition = output.search(">");
                    var promptPosition = output.lastIndexOf(os.EOL) + os.EOL.length;
                    if (emitStatusChanges) {
                        this.emitStatusChanges(output.slice(promptPosition)).then(() => {
                            fulfil(output.slice(commandPosition + os.EOL.length, promptPosition - os.EOL.length));
                        });
                    }
                });
            });
        }
    }
    HaskellDebug.pausedOnError = Symbol("Paused on Error");
    HaskellDebug.finishedDebugging = Symbol("Finished debugging");
    HaskellDebug_1.HaskellDebug = HaskellDebug;
})(HaskellDebug || (HaskellDebug = {}));
module.exports = HaskellDebug;
