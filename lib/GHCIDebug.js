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
var atom = atom || { devMode: false };
var GHCIDebug;
(function (GHCIDebug_1) {
    function getPenultimateLine(str) {
        var lines = str.split("\n");
        return lines[lines.length - 1];
    }
    class GHCIDebug {
        constructor() {
            this.breakpoints = [];
            this.isRunning = false;
            this.emitter = new Emitter();
            this.currentCommandBuffer = "";
            this.commands = [];
            this.currentCommandCallback = null;
            this.commandFinishedString = "command_finish_o4uB1whagteqE8xBq9oq";
            this.ghci_cmd = cp.spawn("ghci");
            this.stdout = this.ghci_cmd.stdout;
            this.stdin = this.ghci_cmd.stdin;
            this.stderr = this.ghci_cmd.stderr;
            this.stdout.on("readable", () => this.onReadable());
            this.stderr.on("readable", () => {
                if (atom.devMode) {
                    var stderrOutput = this.stderr.read();
                    if (stderrOutput === null)
                        return;
                    console.log(`stderr: %c ${stderrOutput.toString()}`, "color: red");
                }
            });
            this.run(`:set prompt "%s> ${this.commandFinishedString}"`);
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
        resolveExpression(expression) {
            return __awaiter(this, void 0, void 0, function* () {
                var getExpression = (ghciOutput, variable) => {
                    var matchResult = ghciOutput.match(/[^ ]* = (.*)/);
                    if (matchResult === null)
                        return false;
                    return matchResult[1];
                };
                var printingResult = getExpression(yield this.run(`:print ${expression}`), expression);
                if (printingResult !== false) {
                    return printingResult;
                }
                var tempVarNum = 0;
                var potentialTempVar;
                do {
                    potentialTempVar = getExpression(yield this.run(`:print temp${tempVarNum}`), `temp${tempVarNum}`);
                } while (potentialTempVar !== false);
                yield this.run(`let temp${tempVarNum} = ${expression}`);
                return getExpression(yield this.run(`:print temp${tempVarNum}`), `temp${tempVarNum}`);
            });
        }
        forward() {
            this.run(":forward", true);
        }
        back() {
            this.run(":back", true);
        }
        step() {
            this.run(":step", true, true);
        }
        stop() {
            this.run(":quit");
            this.emitter.emit("debug-finished", null);
        }
        continue() {
            this.run("continue", true);
        }
        startDebug(moduleName) {
            return __awaiter(this, void 0, void 0, function* () {
                moduleName = moduleName || "main";
                yield this.run(":trace " + moduleName, true, true);
            });
        }
        getBindings() {
            return __awaiter(this, void 0, void 0, function* () {
                var outputStr = yield this.run(":show bindings");
                var lines = outputStr.split(os.EOL);
                return lines.slice(0, lines.length - 2);
            });
        }
        getHistoryLength() {
            return __awaiter(this, void 0, void 0, function* () {
                var historyQuery = yield this.run(":history");
                const regex = /-(\d*).*(?:\n|\r|\r\n)<end of history>$/;
                var matchResult = historyQuery.match(regex);
                if (matchResult === null) {
                    return 0;
                }
                else {
                    return parseInt(matchResult[1]);
                }
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
                    func: () => GHCIDebug.pausedOnError
                }, {
                    pattern: /.*> $/,
                    func: () => GHCIDebug.finishedDebugging
                }];
            for (var pattern of patterns) {
                var matchResult = stdOutput.match(pattern.pattern);
                if (matchResult != null) {
                    return pattern.func(matchResult);
                }
            }
            throw new Error("Cannot read prompt: \n" + stdOutput);
        }
        emitStatusChanges(prompt, emitHistoryLength) {
            return __awaiter(this, void 0, void 0, function* () {
                var result = this.parsePrompt(prompt);
                if (result == GHCIDebug.pausedOnError) {
                    var exceptionString = yield this.run("print _exception");
                }
                else if (result == GHCIDebug.finishedDebugging) {
                    this.emitter.emit("debug-finished", undefined);
                }
                else {
                    var breakInfo = result;
                    if (emitHistoryLength)
                        breakInfo.historyLength = yield this.getHistoryLength();
                    this.emitter.emit("line-changed", breakInfo);
                }
            });
        }
        onReadable() {
            var currentString = (this.stdout.read() || "").toString();
            this.currentCommandBuffer += currentString;
            var finishStringPosition = this.currentCommandBuffer.search(this.commandFinishedString);
            if (finishStringPosition !== -1) {
                if (atom.devMode)
                    console.log(this.currentCommandBuffer);
                this.currentCommandCallback(this.currentCommandBuffer.slice(0, finishStringPosition));
                this.currentCommandBuffer = this.currentCommandBuffer.slice(finishStringPosition + this.commandFinishedString.length);
                this.onReadable();
            }
        }
        run(commandText, emitStatusChanges, emitHistoryLength) {
            var shiftAndRunCommand = () => {
                var command = this.commands.shift();
                this.currentCommandCallback = command.onFinish;
                if (atom.devMode)
                    console.log(command.text);
                this.stdin.write(command.text + os.EOL);
            };
            emitStatusChanges = emitStatusChanges || false;
            emitHistoryLength = emitHistoryLength || false;
            return new Promise(fulfil => {
                var command = {
                    text: commandText,
                    onFinish: (output) => {
                        this.currentCommandCallback = null;
                        var lastEndOfLine = output.lastIndexOf(os.EOL);
                        if (lastEndOfLine == -1) {
                            if (emitStatusChanges) {
                                this.emitStatusChanges(output.slice(0, output.length), emitHistoryLength).then(() => {
                                    fulfil("");
                                });
                            }
                            fulfil("");
                        }
                        else {
                            var promptBeginPosition = lastEndOfLine + os.EOL.length;
                            if (emitStatusChanges) {
                                this.emitStatusChanges(output.slice(promptBeginPosition, output.length), emitHistoryLength).then(() => {
                                    fulfil(output.slice(0, lastEndOfLine));
                                });
                            }
                            else {
                                fulfil(output.slice(0, lastEndOfLine));
                            }
                        }
                        if (this.commands.length !== 0)
                            shiftAndRunCommand();
                    }
                };
                this.commands.push(command);
                if (this.currentCommandCallback === null) {
                    shiftAndRunCommand();
                }
            });
        }
    }
    GHCIDebug.pausedOnError = Symbol("Paused on Error");
    GHCIDebug.finishedDebugging = Symbol("Finished debugging");
    GHCIDebug_1.GHCIDebug = GHCIDebug;
})(GHCIDebug || (GHCIDebug = {}));
module.exports = GHCIDebug;
