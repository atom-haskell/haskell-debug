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
const path = require("path");
var Emitter = require("./Emitter");
var atom = atom || { devMode: true };
var GHCIDebug;
(function (GHCIDebug_1) {
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
                    this.emitter.emit("console-output", stderrOutput.toString());
                }
            });
            this.run(`:set prompt "%s> ${this.commandFinishedString}"`);
        }
        loadModule(name) {
            var cwd = path.dirname(name);
            this.run(`:cd ${cwd}`);
            this.run(`:load ${name}`);
        }
        setExceptionBreakLevel(level) {
            this.run(":unset -fbreak-on-exception");
            this.run(":unset -fbreak-on-error");
            if (level == "exceptions") {
                this.run(":set -fbreak-on-exception");
            }
            else if (level == "error") {
                this.run(":set -fbreak-on-error");
            }
        }
        addBreakpoint(breakpoint) {
            if (typeof breakpoint == "string")
                this.run(`:break ${breakpoint}`);
            else
                this.run(`:break ${breakpoint.file} ${breakpoint.line}`);
        }
        resolveExpression(expression) {
            return __awaiter(this, void 0, void 0, function* () {
                if (expression.indexOf("\n") != -1) {
                    return null;
                }
                var getExpression = (ghciOutput, variable) => {
                    var matchResult = ghciOutput.match(/[^ ]* = (.*)/);
                    if (matchResult === null)
                        return null;
                    return matchResult[1];
                };
                var printingResult = getExpression(yield this.run(`:print ${expression}`), expression);
                if (printingResult !== null) {
                    return printingResult;
                }
                var tempVarNum = 0;
                var potentialTempVar;
                do {
                    potentialTempVar = getExpression(yield this.run(`:print temp${tempVarNum}`), `temp${tempVarNum}`);
                } while (potentialTempVar !== null);
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
            this.run(":continue", true);
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
                var historyQuery = yield this.run(":history 100");
                const regex = /-(\d*).*(?:\n|\r|\r\n)<end of history>$/;
                var matchResult = historyQuery.match(regex);
                if (matchResult === null) {
                    return 0;
                }
                else if (historyQuery.slice(-3) == "...") {
                    return Infinity;
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
                            [parseInt(match[2]) - 1, parseInt(match[4])]]
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
        emitStatusChanges(prompt, mainBody, emitHistoryLength) {
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
                    breakInfo.localBindings = mainBody.split("\n").slice(1);
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
                let outputString = this.currentCommandBuffer.slice(0, finishStringPosition);
                this.emitter.emit("console-output", outputString);
                this.currentCommandCallback(outputString);
                this.currentCommandBuffer = this.currentCommandBuffer.slice(finishStringPosition + this.commandFinishedString.length);
                this.onReadable();
            }
        }
        run(commandText, emitStatusChanges, emitHistoryLength) {
            var shiftAndRunCommand = () => {
                var command = this.commands.shift();
                this.currentCommandCallback = command.onFinish;
                console.log(command.text);
                if (command.shouldEmit)
                    this.emitter.emit("command-issued", command.text);
                this.stdin.write(command.text + os.EOL);
            };
            emitStatusChanges = emitStatusChanges || false;
            emitHistoryLength = emitHistoryLength || false;
            return new Promise(fulfil => {
                var command = {
                    text: commandText,
                    shouldEmit: emitStatusChanges,
                    onFinish: (output) => {
                        this.currentCommandCallback = null;
                        var lastEndOfLinePos = output.lastIndexOf(os.EOL);
                        if (lastEndOfLinePos == -1) {
                            if (emitStatusChanges) {
                                this.emitStatusChanges(output, "", emitHistoryLength).then(() => {
                                    fulfil("");
                                });
                            }
                            fulfil("");
                        }
                        else {
                            var promptBeginPosition = lastEndOfLinePos + os.EOL.length;
                            if (emitStatusChanges) {
                                this.emitStatusChanges(output.slice(promptBeginPosition, output.length), output.slice(0, lastEndOfLinePos), emitHistoryLength).then(() => {
                                    fulfil(output.slice(0, lastEndOfLinePos));
                                });
                            }
                            else {
                                fulfil(output.slice(0, lastEndOfLinePos));
                            }
                        }
                        if (this.commands.length !== 0 && this.currentCommandCallback === null)
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
