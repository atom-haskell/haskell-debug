"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const cp = require("child_process");
const os = require("os");
const emissary = require("emissary");
const path = require("path");
var GHCIDebug;
(function (GHCIDebug_1) {
    class GHCIDebug {
        constructor(ghciCommand = "ghci", ghciArgs = []) {
            this.breakpoints = [];
            this.isRunning = false;
            this.emitter = new emissary.Emitter();
            this.ignoreErrors = false;
            this.currentStderrOutput = "";
            this.currentCommandBuffer = "";
            this.commands = [];
            this.currentCommand = null;
            this.commandFinishedString = "command_finish_o4uB1whagteqE8xBq9oq";
            if (ghciArgs.length === 0) {
                this.ghci_cmd = cp.spawn(ghciCommand);
            }
            else {
                this.ghci_cmd = cp.spawn(ghciCommand, ghciArgs);
            }
            this.ghci_cmd.on("exit", () => {
                this.emitter.emit("debug-finished", null);
            });
            this.stdout = this.ghci_cmd.stdout;
            this.stdin = this.ghci_cmd.stdin;
            this.stderr = this.ghci_cmd.stderr;
            this.stdout.on("readable", () => this.onStdoutReadable());
            this.stderr.on("readable", () => this.onStderrReadable());
            this.addReadyEvent();
            this.startText = this.run(`:set prompt "%s> ${this.commandFinishedString}"`, false, false, false, true);
        }
        addReadyEvent() {
            const eventSubs = [
                "paused-on-exception",
                "line-changed",
                "debug-finished",
            ];
            for (var eventName of eventSubs) {
                this.emitter.on(eventName, () => this.emitter.emit("ready", null));
            }
        }
        destroy() {
            this.stop();
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
            else if (level == "errors") {
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
                this.ignoreErrors = true;
                try {
                    var printingResult = getExpression(yield this.run(`:print ${expression}`, false, false, false), expression);
                    if (printingResult !== null) {
                        return printingResult;
                    }
                    var tempVarNum = 0;
                    var potentialTempVar;
                    do {
                        potentialTempVar = getExpression(yield this.run(`:print temp${tempVarNum}`, false, false, false), `temp${tempVarNum}`);
                    } while (potentialTempVar !== null);
                    yield this.run(`let temp${tempVarNum} = ${expression}`);
                    return getExpression(yield this.run(`:print temp${tempVarNum}`, false, false, false), `temp${tempVarNum}`);
                }
                finally {
                    this.ignoreErrors = false;
                }
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
        addedAllListeners() {
            return __awaiter(this, void 0, void 0, function* () {
                this.startText.then(text => {
                    var firstPrompt = text.indexOf("> ");
                    this.emitter.emit("console-output", text.slice(0, firstPrompt + 2));
                });
            });
        }
        startDebug(moduleName) {
            return __awaiter(this, void 0, void 0, function* () {
                moduleName = moduleName || "main";
                yield this.run(":trace " + moduleName, true, true);
            });
        }
        getBindings() {
            return __awaiter(this, void 0, void 0, function* () {
                var outputStr = yield this.run(":show bindings", false, false, false);
                return outputStr.split(os.EOL);
            });
        }
        getHistoryLength() {
            return __awaiter(this, void 0, void 0, function* () {
                var historyQuery = yield this.run(":history 100", false, false, false);
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
                    var historyLength = yield this.getHistoryLength();
                    this.emitter.emit("paused-on-exception", {
                        historyLength: historyLength,
                        localBindings: mainBody.split("\n").slice(1)
                    });
                }
                else if (result == GHCIDebug.finishedDebugging) {
                    this.emitter.emit("debug-finished", undefined);
                }
                else {
                    var breakInfo = result;
                    breakInfo.localBindings = yield this.getBindings();
                    if (emitHistoryLength)
                        breakInfo.historyLength = yield this.getHistoryLength();
                    this.emitter.emit("line-changed", breakInfo);
                }
            });
        }
        onStderrReadable() {
            var stderrOutput = this.stderr.read();
            if (stderrOutput === null || this.ignoreErrors)
                return;
            this.emitter.emit("error", stderrOutput.toString());
            if (this.currentStderrOutput == "") {
                this.emitter.once("ready", () => {
                    this.emitter.emit("error-completed", this.currentStderrOutput);
                    this.currentStderrOutput = "";
                });
            }
            this.currentStderrOutput += stderrOutput.toString();
        }
        onStdoutReadable() {
            var currentString = (this.stdout.read() || "").toString();
            this.currentCommandBuffer += currentString;
            var finishStringPosition = this.currentCommandBuffer.search(this.commandFinishedString);
            if (finishStringPosition !== -1) {
                let outputString = this.currentCommandBuffer.slice(0, finishStringPosition);
                if (this.currentCommand.emitCommandOutput)
                    this.emitter.emit("console-output", outputString);
                this.currentCommand.onFinish(outputString);
                this.currentCommandBuffer = this.currentCommandBuffer.slice(finishStringPosition + this.commandFinishedString.length);
                this.onStdoutReadable();
            }
        }
        run(commandText, emitStatusChanges, emitHistoryLength, emitCommandOutput, fulfilWithPrompt) {
            var shiftAndRunCommand = () => {
                var command = this.commands.shift();
                this.currentCommand = command;
                if (command.emitCommandOutput)
                    this.emitter.emit("command-issued", command.text);
                this.stdin.write(command.text + os.EOL);
            };
            emitStatusChanges = emitStatusChanges || false;
            emitHistoryLength = emitHistoryLength || false;
            if (emitCommandOutput === undefined)
                emitCommandOutput = true;
            if (fulfilWithPrompt === undefined)
                fulfilWithPrompt = false;
            var currentPromise;
            return currentPromise = new Promise(fulfil => {
                var command = {
                    text: commandText,
                    emitCommandOutput: emitCommandOutput,
                    fulfilWithPrompt: fulfilWithPrompt,
                    onFinish: (output) => __awaiter(this, void 0, void 0, function* () {
                        this.currentCommand = null;
                        function _fulfil(noPrompt) {
                            if (fulfilWithPrompt) {
                                fulfil(output);
                            }
                            else {
                                fulfil(noPrompt);
                            }
                        }
                        var lastEndOfLinePos = output.lastIndexOf(os.EOL);
                        if (lastEndOfLinePos == -1) {
                            if (emitStatusChanges) {
                                this.emitStatusChanges(output, "", emitHistoryLength).then(() => {
                                    _fulfil("");
                                });
                            }
                            else {
                                _fulfil("");
                            }
                        }
                        else {
                            var promptBeginPosition = lastEndOfLinePos + os.EOL.length;
                            if (emitStatusChanges) {
                                this.emitStatusChanges(output.slice(promptBeginPosition, output.length), output.slice(0, lastEndOfLinePos), emitHistoryLength).then(() => {
                                    _fulfil(output.slice(0, lastEndOfLinePos));
                                });
                            }
                            else {
                                _fulfil(output.slice(0, lastEndOfLinePos));
                            }
                        }
                        yield currentPromise;
                        if (this.commands.length !== 0 && this.currentCommand === null)
                            shiftAndRunCommand();
                    })
                };
                this.commands.push(command);
                if (this.currentCommand === null) {
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
