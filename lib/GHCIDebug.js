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
        constructor(ghciCommand = "ghci", ghciArgs = [], folder) {
            this.breakpoints = [];
            this.isRunning = false;
            this.emitter = new emissary.Emitter();
            this.ignoreErrors = false;
            this.currentStderrOutput = "";
            this.currentCommandBuffer = "";
            this.commands = [];
            this.currentCommand = null;
            this.commandFinishedString = "command_finish_o4uB1whagteqE8xBq9oq";
            this.ghci_cmd = cp.spawn(ghciCommand, ghciArgs, { cwd: folder, shell: true });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiR0hDSURlYnVnLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2xpYi9HSENJRGVidWcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUEsb0NBQXFDO0FBRXJDLHlCQUEwQjtBQUMxQixxQ0FBcUM7QUFFckMsNkJBQThCO0FBSTlCLElBQU8sU0FBUyxDQXFhZjtBQXJhRCxXQUFPLFdBQVM7SUF3Q1o7UUF3Q0ksWUFBWSxXQUFXLEdBQUMsTUFBTSxFQUFFLFFBQVEsR0FBQyxFQUFFLEVBQUUsTUFBZTtZQW5DcEQsZ0JBQVcsR0FBaUIsRUFBRSxDQUFDO1lBQy9CLGNBQVMsR0FBRyxLQUFLLENBQUM7WUE4Qm5CLFlBQU8sR0FBcUIsSUFBSSxRQUFRLENBQUMsT0FBTyxFQUFFLENBQUM7WUEyTmxELGlCQUFZLEdBQUcsS0FBSyxDQUFDO1lBQ3JCLHdCQUFtQixHQUFHLEVBQUUsQ0FBQztZQWtCekIseUJBQW9CLEdBQUcsRUFBRSxDQUFDO1lBQzFCLGFBQVEsR0FBYyxFQUFFLENBQUM7WUFDekIsbUJBQWMsR0FBWSxJQUFJLENBQUM7WUFDL0IsMEJBQXFCLEdBQUcscUNBQXFDLENBQUM7WUEzT2xFLElBQUksQ0FBQyxRQUFRLEdBQUcsRUFBRSxDQUFDLEtBQUssQ0FBQyxXQUFXLEVBQUUsUUFBUSxFQUFFLEVBQUMsR0FBRyxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFDLENBQUMsQ0FBQztZQUU1RSxJQUFJLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxNQUFNLEVBQUU7Z0JBQ3JCLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLGdCQUFnQixFQUFFLElBQUksQ0FBQyxDQUFBO1lBQzdDLENBQUMsQ0FBQyxDQUFDO1lBRUgsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQztZQUNuQyxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsS0FB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Iiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGNwID0gcmVxdWlyZShcImNoaWxkX3Byb2Nlc3NcIik7XG5pbXBvcnQgc3RyZWFtID0gcmVxdWlyZShcInN0cmVhbVwiKTtcbmltcG9ydCBvcyA9IHJlcXVpcmUoXCJvc1wiKTtcbmltcG9ydCBlbWlzc2FyeSA9IHJlcXVpcmUoXCJlbWlzc2FyeVwiKVxuaW1wb3J0IGF0b21BUEkgPSByZXF1aXJlKFwiYXRvbVwiKTtcbmltcG9ydCBwYXRoID0gcmVxdWlyZShcInBhdGhcIik7XG5cbmRlY2xhcmUgdmFyIEdMT0JBTDtcblxubW9kdWxlIEdIQ0lEZWJ1ZyB7XG4gICAgZXhwb3J0IGludGVyZmFjZSBCcmVha0luZm97XG4gICAgICAgIGZpbGVuYW1lOiBzdHJpbmc7XG4gICAgICAgIHJhbmdlOiBudW1iZXJbXVtdO1xuICAgICAgICBoaXN0b3J5TGVuZ3RoPzogbnVtYmVyO1xuICAgICAgICBsb2NhbEJpbmRpbmdzOiBzdHJpbmdbXVxuICAgIH1cblxuICAgIGV4cG9ydCBpbnRlcmZhY2UgRXhjZXB0aW9uSW5mbyB7XG4gICAgICAgIGhpc3RvcnlMZW5ndGg6IG51bWJlcjtcbiAgICAgICAgbG9jYWxCaW5kaW5nczogc3RyaW5nW107XG4gICAgfVxuXG4gICAgZXhwb3J0IGludGVyZmFjZSBHSENJRGVidWdFbWl0dGVyIGV4dGVuZHMgRW1pc3NhcnkuSUVtaXR0ZXJ7XG4gICAgICAgIG9uKGV2ZW50TmFtZTogXCJyZWFkeVwiLCBoYW5kbGVyOiAoKSA9PiBhbnkpOiBBdG9tQ29yZS5EaXNwb3NhYmxlO1xuICAgICAgICBvbihldmVudE5hbWU6IFwicGF1c2VkLW9uLWV4Y2VwdGlvblwiLCBoYW5kbGVyOiAoaW5mbzogRXhjZXB0aW9uSW5mbykgPT4gYW55KTogQXRvbUNvcmUuRGlzcG9zYWJsZTtcbiAgICAgICAgb24oZXZlbnROYW1lOiBcImVycm9yXCIsIGhhbmRsZXI6ICh0ZXh0OiBzdHJpbmcpID0+IGFueSk6IEF0b21Db3JlLkRpc3Bvc2FibGU7XG4gICAgICAgIG9uKGV2ZW50TmFtZTogXCJlcnJvci1jb21wbGV0ZWRcIiwgaGFuZGxlcjogKHRleHQ6IHN0cmluZykgPT4gYW55KTogQXRvbUNvcmUuRGlzcG9zYWJsZTtcbiAgICAgICAgb24oZXZlbnROYW1lOiBcImxpbmUtY2hhbmdlZFwiLCBoYW5kbGVyOiAoaW5mbzogQnJlYWtJbmZvKSA9PiBhbnkpOiBBdG9tQ29yZS5EaXNwb3NhYmxlO1xuICAgICAgICBvbihldmVudE5hbWU6IFwiZGVidWctZmluaXNoZWRcIiwgaGFuZGxlcjogKCkgPT4gYW55KTogQXRvbUNvcmUuRGlzcG9zYWJsZTtcbiAgICAgICAgb24oZXZlbnROYW1lOiBcImNvbnNvbGUtb3V0cHV0XCIsIGhhbmRsZXI6IChvdXRwdXQ6IHN0cmluZykgPT4gYW55KTogQXRvbUNvcmUuRGlzcG9zYWJsZTtcbiAgICAgICAgb24oZXZlbnROYW1lOiBcImNvbW1hbmQtaXNzdWVkXCIsIGhhbmRsZXI6IChjb21tYW5kOiBzdHJpbmcpID0+IGFueSk6IEF0b21Db3JlLkRpc3Bvc2FibGU7XG5cbiAgICAgICAgZW1pdChldmVudE5hbWU6IFwicGF1c2VkLW9uLWV4Y2VwdGlvblwiLCB2YWx1ZTogRXhjZXB0aW9uSW5mbyk6IHZvaWQ7XG4gICAgICAgIGVtaXQoZXZlbnROYW1lOiBcInJlYWR5XCIsIHZhbHVlOiBFeGNlcHRpb25JbmZvKTogdm9pZDtcbiAgICAgICAgZW1pdChldmVudE5hbWU6IFwiZXJyb3JcIiwgdGV4dDogc3RyaW5nKTogdm9pZDtcbiAgICAgICAgZW1pdChldmVudE5hbWU6IFwiZXJyb3ItY29tcGxldGVkXCIsIHRleHQ6IHN0cmluZyk6IHZvaWQ7XG4gICAgICAgIGVtaXQoZXZlbnROYW1lOiBcImxpbmUtY2hhbmdlZFwiLCB2YWx1ZTogQnJlYWtJbmZvKTogdm9pZDtcbiAgICAgICAgZW1pdChldmVudE5hbWU6IFwiZGVidWctZmluaXNoZWRcIiwgdmFsdWU6IGFueSk6IHZvaWQ7XG4gICAgICAgIGVtaXQoZXZlbnROYW1lOiBcImNvbnNvbGUtb3V0cHV0XCIsIHZhbHVlOiBzdHJpbmcpOiB2b2lkO1xuICAgICAgICBlbWl0KGV2ZW50TmFtZTogXCJjb21tYW5kLWlzc3VlZFwiLCB2YWx1ZTogc3RyaW5nKTogdm9pZDtcbiAgICB9XG5cbiAgICBpbnRlcmZhY2UgQ29tbWFuZHtcbiAgICAgICAgdGV4dDogc3RyaW5nO1xuICAgICAgICBlbWl0Q29tbWFuZE91dHB1dDogYm9vbGVhbjtcbiAgICAgICAgZnVsZmlsV2l0aFByb21wdDogYm9vbGVhbjtcbiAgICAgICAgb25GaW5pc2g6IChvdXRwdXQ6IHN0cmluZykgPT4gYW55O1xuICAgIH1cblxuICAgIGV4cG9ydCBjbGFzcyBHSENJRGVidWd7XG4gICAgICAgIHByaXZhdGUgZ2hjaV9jbWQ6IGNwLkNoaWxkUHJvY2VzcztcbiAgICAgICAgc3Rkb3V0OiBzdHJlYW0uUmVhZGFibGU7XG4gICAgICAgIHN0ZGluOiBzdHJlYW0uV3JpdGFibGU7XG4gICAgICAgIHN0ZGVycjogc3RyZWFtLlJlYWRhYmxlO1xuICAgICAgICBwcml2YXRlIGJyZWFrcG9pbnRzOiBCcmVha3BvaW50W10gPSBbXTsgLy9MaW5lcyB0byBicmVhayBvblxuICAgICAgICBwcml2YXRlIGlzUnVubmluZyA9IGZhbHNlO1xuXG4gICAgICAgIC8qKiBFdmVudCBIYW5kbGVyXG4gICAgICAgICAgKlxuICAgICAgICAgICogRXZlbnRzOlxuICAgICAgICAgICpcbiAgICAgICAgICAqIHJlYWR5OiAoKVxuICAgICAgICAgICogICAgIEVtbWl0ZWQgd2hlbiBnaGNpIGhhcyBqdXN0IHN0b3BwZWQgZXhlY3V0aW5nIGEgY29tbWFuZFxuICAgICAgICAgICpcbiAgICAgICAgICAqIHBhdXNlZC1vbi1leGNlcHRpb246IChpbmZvOiBFeGNlcHRpb25JbmZvKVxuICAgICAgICAgICogICAgIEVtbWl0ZWQgd2hlbiB0aGUgZGVidWdnZXIgaXMgYXQgYW4gZXhjZXB0aW9uXG4gICAgICAgICAgKlxuICAgICAgICAgICogZXJyb3I6ICh0ZXh0OiBzdHJpbmcpXG4gICAgICAgICAgKiAgICAgRW1taXRlZCB3aGVuIHN0ZGVyciBoYXMgaW5wdXRcbiAgICAgICAgICAqXG4gICAgICAgICAgKiBlcnJvci1jb21wbGV0ZWQ6ICh0ZXh0OiBzdHJpbmcpXG4gICAgICAgICAgKiAgICAgRW1taXRlZCB3aGVuIGdoY2kgcmVwb3J0cyBhbiBlcnJvciBmb3IgYSBnaXZlbiBjb21tYW5kXG4gICAgICAgICAgKlxuICAgICAgICAgICogbGluZS1jaGFuZ2VkOiAoaW5mbzogQnJlYWtJbmZvKVxuICAgICAgICAgICogICAgIEVtbWl0ZWQgd2hlbiB0aGUgbGluZSB0aGF0IHRoZSBkZWJ1Z2dlciBpcyBvbiBjaGFuZ2VzXG4gICAgICAgICAgKlxuICAgICAgICAgICogZGVidWctZmluaXNoZWQ6ICh2b2lkKVxuICAgICAgICAgICogICAgIEVtbWl0ZWQgd2hlbiB0aGUgZGVidWdnZXIgaGFzIHJlYWNoZWQgdGhlIGVuZCBvZiB0aGUgcHJvZ3JhbVxuICAgICAgICAgICpcbiAgICAgICAgICAqIGNvbnNvbGUtb3V0cHV0OiAob3V0cHV0OiBzdHJpbmcpXG4gICAgICAgICAgKiAgICAgRW1taXRlZCB3aGVuIHRoZSBnaGNpIGhhcyBvdXRwdXRlZCBzb21ldGhpbmcgdG8gc3Rkb3V0LCBleGNsdWRpbmcgdGhlIGV4dHJhIHByb21wdFxuICAgICAgICAgICpcbiAgICAgICAgICAqIGNvbW1hbmQtaXNzdWVkOiAoY29tbWFuZDogc3RyaW5nKVxuICAgICAgICAgICogICAgIEVtbWl0ZWQgd2hlbiBhIGNvbW1hbmQgaGFzIGJlZW4gZXhlY3V0ZWRcbiAgICAgICAgICAqL1xuICAgICAgICBwdWJsaWMgZW1pdHRlcjogR0hDSURlYnVnRW1pdHRlciA9IG5ldyBlbWlzc2FyeS5FbWl0dGVyKCk7XG5cbiAgICAgICAgcHJpdmF0ZSBzdGFydFRleHQ6IFByb21pc2U8c3RyaW5nPjtcblxuICAgICAgICBjb25zdHJ1Y3RvcihnaGNpQ29tbWFuZD1cImdoY2lcIiwgZ2hjaUFyZ3M9W10sIGZvbGRlcj86IHN0cmluZyl7XG5cbiAgICAgICAgICAgIHRoaXMuZ2hjaV9jbWQgPSBjcC5zcGF3bihnaGNpQ29tbWFuZCwgZ2hjaUFyZ3MsIHtjd2Q6IGZvbGRlciwgc2hlbGw6IHRydWV9KTtcblxuICAgICAgICAgICAgdGhpcy5naGNpX2NtZC5vbihcImV4aXRcIiwgKCkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuZW1pdHRlci5lbWl0KFwiZGVidWctZmluaXNoZWRcIiwgbnVsbClcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICB0aGlzLnN0ZG91dCA9IHRoaXMuZ2hjaV9jbWQuc3Rkb3V0O1xuICAgICAgICAgICAgdGhpcy5zdGRpbiA9IHRoaXMuZ2hjaV9jbWQuc3RkaW47XG4gICAgICAgICAgICB0aGlzLnN0ZGVyciA9IHRoaXMuZ2hjaV9jbWQuc3RkZXJyO1xuICAgICAgICAgICAgdGhpcy5zdGRvdXQub24oXCJyZWFkYWJsZVwiLCAoKSA9PiB0aGlzLm9uU3Rkb3V0UmVhZGFibGUoKSk7XG4gICAgICAgICAgICB0aGlzLnN0ZGVyci5vbihcInJlYWRhYmxlXCIsICgpID0+IHRoaXMub25TdGRlcnJSZWFkYWJsZSgpKTtcblxuICAgICAgICAgICAgdGhpcy5hZGRSZWFkeUV2ZW50KCk7XG5cbiAgICAgICAgICAgIHRoaXMuc3RhcnRUZXh0ID0gdGhpcy5ydW4oYDpzZXQgcHJvbXB0IFwiJXM+ICR7dGhpcy5jb21tYW5kRmluaXNoZWRTdHJpbmd9XCJgLCBmYWxzZSwgZmFsc2UsIGZhbHNlLCB0cnVlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHByaXZhdGUgYWRkUmVhZHlFdmVudCgpe1xuICAgICAgICAgICAgY29uc3QgZXZlbnRTdWJzID0gW1xuICAgICAgICAgICAgICAgIFwicGF1c2VkLW9uLWV4Y2VwdGlvblwiLFxuICAgICAgICAgICAgICAgIFwibGluZS1jaGFuZ2VkXCIsXG4gICAgICAgICAgICAgICAgXCJkZWJ1Zy1maW5pc2hlZFwiLFxuICAgICAgICAgICAgXTtcblxuICAgICAgICAgICAgZm9yKHZhciBldmVudE5hbWUgb2YgZXZlbnRTdWJzKXtcbiAgICAgICAgICAgICAgICAoPGFueT50aGlzLmVtaXR0ZXIub24pKGV2ZW50TmFtZSwgKCkgPT4gdGhpcy5lbWl0dGVyLmVtaXQoXCJyZWFkeVwiLCBudWxsKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBwdWJsaWMgZGVzdHJveSgpe1xuICAgICAgICAgICAgdGhpcy5zdG9wKCk7XG4gICAgICAgIH1cblxuICAgICAgICBwdWJsaWMgbG9hZE1vZHVsZShuYW1lOiBzdHJpbmcpe1xuICAgICAgICAgICAgdmFyIGN3ZCA9IHBhdGguZGlybmFtZShuYW1lKTtcblxuICAgICAgICAgICAgdGhpcy5ydW4oYDpjZCAke2N3ZH1gKTtcbiAgICAgICAgICAgIHRoaXMucnVuKGA6bG9hZCAke25hbWV9YCk7XG4gICAgICAgIH1cblxuICAgICAgICBwdWJsaWMgc2V0RXhjZXB0aW9uQnJlYWtMZXZlbChsZXZlbDogRXhjZXB0aW9uQnJlYWtMZXZlbHMpe1xuICAgICAgICAgICAgdGhpcy5ydW4oXCI6dW5zZXQgLWZicmVhay1vbi1leGNlcHRpb25cIik7XG4gICAgICAgICAgICB0aGlzLnJ1bihcIjp1bnNldCAtZmJyZWFrLW9uLWVycm9yXCIpO1xuXG4gICAgICAgICAgICBpZihsZXZlbCA9PSBcImV4Y2VwdGlvbnNcIil7XG4gICAgICAgICAgICAgICAgdGhpcy5ydW4oXCI6c2V0IC1mYnJlYWstb24tZXhjZXB0aW9uXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZihsZXZlbCA9PSBcImVycm9yc1wiKXtcbiAgICAgICAgICAgICAgICB0aGlzLnJ1bihcIjpzZXQgLWZicmVhay1vbi1lcnJvclwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHB1YmxpYyBhZGRCcmVha3BvaW50KGJyZWFrcG9pbnQ6IEJyZWFrcG9pbnQgfCBzdHJpbmcpe1xuICAgICAgICAgICAgaWYodHlwZW9mIGJyZWFrcG9pbnQgPT0gXCJzdHJpbmdcIilcbiAgICAgICAgICAgICAgICB0aGlzLnJ1bihgOmJyZWFrICR7YnJlYWtwb2ludH1gKTtcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICB0aGlzLnJ1bihgOmJyZWFrICR7YnJlYWtwb2ludC5maWxlfSAke2JyZWFrcG9pbnQubGluZX1gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKiByZXNvbHZlZCB0aGUgZ2l2ZW4gZXhwcmVzc2lvbiB1c2luZyA6cHJpbnQsIHJldHVybnMgbnVsbCBpZiBpdCBpcyBpbnZhbGlkXG4gICAgICAgICovXG4gICAgICAgIHB1YmxpYyBhc3luYyByZXNvbHZlRXhwcmVzc2lvbihleHByZXNzaW9uOiBzdHJpbmcpe1xuICAgICAgICAgICAgLy8gZXhwcmVzc2lvbnMgY2FuJ3QgaGF2ZSBuZXcgbGluZXNcbiAgICAgICAgICAgIGlmKGV4cHJlc3Npb24uaW5kZXhPZihcIlxcblwiKSAhPSAtMSl7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciBnZXRFeHByZXNzaW9uID0gKGdoY2lPdXRwdXQ6IHN0cmluZywgdmFyaWFibGU6IHN0cmluZyk6IHN0cmluZyA9PiB7XG4gICAgICAgICAgICAgICAgdmFyIG1hdGNoUmVzdWx0ID0gZ2hjaU91dHB1dC5tYXRjaCgvW14gXSogPSAoLiopLyk7XG4gICAgICAgICAgICAgICAgaWYobWF0Y2hSZXN1bHQgPT09IG51bGwpIHJldHVybiBudWxsO1xuICAgICAgICAgICAgICAgIHJldHVybiBtYXRjaFJlc3VsdFsxXTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIC8vIGZvciB0aGUgY29kZSBiZWxvdywgaWdub3JlIGVycm9yc1xuICAgICAgICAgICAgdGhpcy5pZ25vcmVFcnJvcnMgPSB0cnVlO1xuXG4gICAgICAgICAgICB0cnl7XG4gICAgICAgICAgICAgICAgLy8gdHJ5IHByaW50aW5nIGV4cHJlc3Npb25cbiAgICAgICAgICAgICAgICB2YXIgcHJpbnRpbmdSZXN1bHQgPSBnZXRFeHByZXNzaW9uKGF3YWl0IHRoaXMucnVuKGA6cHJpbnQgJHtleHByZXNzaW9ufWAsIGZhbHNlLCBmYWxzZSwgZmFsc2UpLCBleHByZXNzaW9uKTtcbiAgICAgICAgICAgICAgICBpZihwcmludGluZ1Jlc3VsdCAhPT0gbnVsbCl7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBwcmludGluZ1Jlc3VsdDtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBpZiB0aGF0IGZhaWxzIGFzc2lnbiBpdCB0byBhIHRlbXBvcmFyeSB2YXJpYWJsZSBhbmQgZXZhbHVhdGUgdGhhdFxuICAgICAgICAgICAgICAgIHZhciB0ZW1wVmFyTnVtID0gMDtcbiAgICAgICAgICAgICAgICB2YXIgcG90ZW50aWFsVGVtcFZhcjogc3RyaW5nIHwgYm9vbGVhbjtcbiAgICAgICAgICAgICAgICBkb3tcbiAgICAgICAgICAgICAgICAgICAgcG90ZW50aWFsVGVtcFZhciA9IGdldEV4cHJlc3Npb24oYXdhaXQgdGhpcy5ydW4oYDpwcmludCB0ZW1wJHt0ZW1wVmFyTnVtfWAsIGZhbHNlLCBmYWxzZSwgZmFsc2UpLCBgdGVtcCR7dGVtcFZhck51bX1gKVxuICAgICAgICAgICAgICAgIH0gd2hpbGUocG90ZW50aWFsVGVtcFZhciAhPT0gbnVsbCk7XG5cbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLnJ1bihgbGV0IHRlbXAke3RlbXBWYXJOdW19ID0gJHtleHByZXNzaW9ufWApO1xuICAgICAgICAgICAgICAgIHJldHVybiBnZXRFeHByZXNzaW9uKGF3YWl0IHRoaXMucnVuKGA6cHJpbnQgdGVtcCR7dGVtcFZhck51bX1gLCBmYWxzZSwgZmFsc2UsIGZhbHNlKSwgYHRlbXAke3RlbXBWYXJOdW19YCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmaW5hbGx5e1xuICAgICAgICAgICAgICAgIHRoaXMuaWdub3JlRXJyb3JzID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBwdWJsaWMgZm9yd2FyZCgpe1xuICAgICAgICAgICAgdGhpcy5ydW4oXCI6Zm9yd2FyZFwiLCB0cnVlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHB1YmxpYyBiYWNrKCl7XG4gICAgICAgICAgICB0aGlzLnJ1bihcIjpiYWNrXCIsIHRydWUpO1xuICAgICAgICB9XG5cbiAgICAgICAgcHVibGljIHN0ZXAoKXtcbiAgICAgICAgICAgIHRoaXMucnVuKFwiOnN0ZXBcIiwgdHJ1ZSwgdHJ1ZSk7XG4gICAgICAgIH1cblxuICAgICAgICBwdWJsaWMgc3RvcCgpIHtcbiAgICAgICAgICAgIHRoaXMucnVuKFwiOnF1aXRcIik7XG4gICAgICAgICAgICB0aGlzLmVtaXR0ZXIuZW1pdChcImRlYnVnLWZpbmlzaGVkXCIsIG51bGwpO1xuICAgICAgICB9XG5cbiAgICAgICAgcHVibGljIGNvbnRpbnVlKCkge1xuICAgICAgICAgICAgdGhpcy5ydW4oXCI6Y29udGludWVcIiwgdHJ1ZSk7XG4gICAgICAgIH1cblxuICAgICAgICBwdWJsaWMgYXN5bmMgYWRkZWRBbGxMaXN0ZW5lcnMoKXtcbiAgICAgICAgICAgIHRoaXMuc3RhcnRUZXh0LnRoZW4odGV4dCA9PiB7XG4gICAgICAgICAgICAgICAgdmFyIGZpcnN0UHJvbXB0ID0gdGV4dC5pbmRleE9mKFwiPiBcIik7XG4gICAgICAgICAgICAgICAgdGhpcy5lbWl0dGVyLmVtaXQoXCJjb25zb2xlLW91dHB1dFwiLCB0ZXh0LnNsaWNlKDAsIGZpcnN0UHJvbXB0ICsgMikpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgfVxuXG4gICAgICAgIGFzeW5jIHN0YXJ0RGVidWcobW9kdWxlTmFtZT86IHN0cmluZyl7XG4gICAgICAgICAgICBtb2R1bGVOYW1lID0gbW9kdWxlTmFtZSB8fCBcIm1haW5cIjtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMucnVuKFwiOnRyYWNlIFwiICsgbW9kdWxlTmFtZSwgdHJ1ZSwgdHJ1ZSk7XG4gICAgICAgIH1cblxuICAgICAgICBhc3luYyBnZXRCaW5kaW5ncygpe1xuICAgICAgICAgICAgdmFyIG91dHB1dFN0ciA9IGF3YWl0IHRoaXMucnVuKFwiOnNob3cgYmluZGluZ3NcIiwgZmFsc2UsIGZhbHNlLCBmYWxzZSk7XG4gICAgICAgICAgICByZXR1cm4gb3V0cHV0U3RyLnNwbGl0KG9zLkVPTClcbiAgICAgICAgfVxuXG4gICAgICAgIHByaXZhdGUgYXN5bmMgZ2V0SGlzdG9yeUxlbmd0aCgpe1xuICAgICAgICAgICAgdmFyIGhpc3RvcnlRdWVyeSA9IGF3YWl0IHRoaXMucnVuKFwiOmhpc3RvcnkgMTAwXCIsIGZhbHNlLCBmYWxzZSwgZmFsc2UpO1xuICAgICAgICAgICAgY29uc3QgcmVnZXggPSAvLShcXGQqKS4qKD86XFxufFxccnxcXHJcXG4pPGVuZCBvZiBoaXN0b3J5PiQvO1xuXG4gICAgICAgICAgICB2YXIgbWF0Y2hSZXN1bHQgPSBoaXN0b3J5UXVlcnkubWF0Y2gocmVnZXgpO1xuICAgICAgICAgICAgaWYobWF0Y2hSZXN1bHQgPT09IG51bGwpe1xuICAgICAgICAgICAgICAgIHJldHVybiAwO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZihoaXN0b3J5UXVlcnkuc2xpY2UoLTMpID09IFwiLi4uXCIpe1xuICAgICAgICAgICAgICAgIHJldHVybiBJbmZpbml0eTsvLyBoaXN0b3J5IGlzIHZlcnkgbG9uZ1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZXtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyc2VJbnQobWF0Y2hSZXN1bHRbMV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgc3RhdGljIHBhdXNlZE9uRXJyb3IgPSBTeW1ib2woXCJQYXVzZWQgb24gRXJyb3JcIik7XG4gICAgICAgIHN0YXRpYyBmaW5pc2hlZERlYnVnZ2luZyA9IFN5bWJvbChcIkZpbmlzaGVkIGRlYnVnZ2luZ1wiKTtcblxuICAgICAgICBwcml2YXRlIHBhcnNlUHJvbXB0KHN0ZE91dHB1dDogc3RyaW5nKTogQnJlYWtJbmZvIHwgU3ltYm9se1xuICAgICAgICAgICAgdmFyIGJyZWFrSW5mb09iOiBCcmVha0luZm87XG4gICAgICAgICAgICB2YXIgcGF0dGVybnMgPSA8e3BhdHRlcm46IFJlZ0V4cDsgZnVuYzogKG1hdGNoOiBzdHJpbmdbXSkgPT4gQnJlYWtJbmZvIHwgU3ltYm9sfVtdPlt7XG4gICAgICAgICAgICAgICAgcGF0dGVybjogL1xcWyg/OlstXFxkXSo6ICk/KC4qKTpcXCgoXFxkKyksKFxcZCspXFwpLVxcKChcXGQrKSwoXFxkKylcXCkuKlxcXS4qPiAkLyxcbiAgICAgICAgICAgICAgICBmdW5jOiBtYXRjaCA9PiAoe1xuICAgICAgICAgICAgICAgICAgICBmaWxlbmFtZTogbWF0Y2hbMV0sXG4gICAgICAgICAgICAgICAgICAgIHJhbmdlOiBbW3BhcnNlSW50KG1hdGNoWzJdKSAtIDEsIHBhcnNlSW50KG1hdGNoWzNdKSAtIDFdLFxuICAgICAgICAgICAgICAgICAgICAgICAgW3BhcnNlSW50KG1hdGNoWzRdKSwgcGFyc2VJbnQobWF0Y2hbNV0pXV1cbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgfSx7XG4gICAgICAgICAgICAgICAgcGF0dGVybjogL1xcWyg/OlstXFxkXSo6ICk/KC4qKTooXFxkKik6KFxcZCopLShcXGQqKVxcXS4qPiAkLyxcbiAgICAgICAgICAgICAgICBmdW5jOiBtYXRjaCA9PiAoe1xuICAgICAgICAgICAgICAgICAgICAgICAgZmlsZW5hbWU6IG1hdGNoWzFdLFxuICAgICAgICAgICAgICAgICAgICAgICAgcmFuZ2U6IFtbcGFyc2VJbnQobWF0Y2hbMl0pIC0gMSwgcGFyc2VJbnQobWF0Y2hbM10pIC0gMV0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgW3BhcnNlSW50KG1hdGNoWzJdKSAtIDEsIHBhcnNlSW50KG1hdGNoWzRdKV1dXG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIH0se1xuICAgICAgICAgICAgICAgIHBhdHRlcm46IC9cXFs8ZXhjZXB0aW9uIHRocm93bj5cXF0uKj4gJC8sXG4gICAgICAgICAgICAgICAgZnVuYzogKCkgPT4gR0hDSURlYnVnLnBhdXNlZE9uRXJyb3JcbiAgICAgICAgICAgIH0se1xuICAgICAgICAgICAgICAgIHBhdHRlcm46IC8uKj4gJC8sXG4gICAgICAgICAgICAgICAgZnVuYzogKCkgPT4gR0hDSURlYnVnLmZpbmlzaGVkRGVidWdnaW5nXG4gICAgICAgICAgICB9XTtcbiAgICAgICAgICAgIGZvciAodmFyIHBhdHRlcm4gb2YgcGF0dGVybnMpe1xuICAgICAgICAgICAgICAgIHZhciBtYXRjaFJlc3VsdCA9IHN0ZE91dHB1dC5tYXRjaChwYXR0ZXJuLnBhdHRlcm4pO1xuICAgICAgICAgICAgICAgIGlmKG1hdGNoUmVzdWx0ICE9IG51bGwpe1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcGF0dGVybi5mdW5jKG1hdGNoUmVzdWx0KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgcmVhZCBwcm9tcHQ6IFxcblwiICsgc3RkT3V0cHV0KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHByaXZhdGUgYXN5bmMgZW1pdFN0YXR1c0NoYW5nZXMocHJvbXB0OiBzdHJpbmcsIG1haW5Cb2R5OiBzdHJpbmcsIGVtaXRIaXN0b3J5TGVuZ3RoOiBib29sZWFuKXtcbiAgICAgICAgICAgIHZhciByZXN1bHQgPSB0aGlzLnBhcnNlUHJvbXB0KHByb21wdCk7XG5cbiAgICAgICAgICAgIGlmKHJlc3VsdCA9PSBHSENJRGVidWcucGF1c2VkT25FcnJvcikge1xuICAgICAgICAgICAgICAgIHZhciBoaXN0b3J5TGVuZ3RoID0gYXdhaXQgdGhpcy5nZXRIaXN0b3J5TGVuZ3RoKCk7XG5cbiAgICAgICAgICAgICAgICB0aGlzLmVtaXR0ZXIuZW1pdChcInBhdXNlZC1vbi1leGNlcHRpb25cIiwge1xuICAgICAgICAgICAgICAgICAgICBoaXN0b3J5TGVuZ3RoOiBoaXN0b3J5TGVuZ3RoLFxuICAgICAgICAgICAgICAgICAgICBsb2NhbEJpbmRpbmdzOiBtYWluQm9keS5zcGxpdChcIlxcblwiKS5zbGljZSgxKVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZihyZXN1bHQgPT0gR0hDSURlYnVnLmZpbmlzaGVkRGVidWdnaW5nKXtcbiAgICAgICAgICAgICAgICB0aGlzLmVtaXR0ZXIuZW1pdChcImRlYnVnLWZpbmlzaGVkXCIsIHVuZGVmaW5lZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNle1xuICAgICAgICAgICAgICAgIHZhciBicmVha0luZm8gPSA8QnJlYWtJbmZvPnJlc3VsdDtcblxuICAgICAgICAgICAgICAgIGJyZWFrSW5mby5sb2NhbEJpbmRpbmdzID0gYXdhaXQgdGhpcy5nZXRCaW5kaW5ncygpO1xuXG4gICAgICAgICAgICAgICAgaWYoZW1pdEhpc3RvcnlMZW5ndGgpXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrSW5mby5oaXN0b3J5TGVuZ3RoID0gYXdhaXQgdGhpcy5nZXRIaXN0b3J5TGVuZ3RoKCk7XG5cbiAgICAgICAgICAgICAgICB0aGlzLmVtaXR0ZXIuZW1pdChcImxpbmUtY2hhbmdlZFwiLCBicmVha0luZm8pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcHJpdmF0ZSBpZ25vcmVFcnJvcnMgPSBmYWxzZTtcbiAgICAgICAgcHJpdmF0ZSBjdXJyZW50U3RkZXJyT3V0cHV0ID0gXCJcIjtcbiAgICAgICAgcHJpdmF0ZSBvblN0ZGVyclJlYWRhYmxlKCl7XG4gICAgICAgICAgICB2YXIgc3RkZXJyT3V0cHV0OiBCdWZmZXIgPSB0aGlzLnN0ZGVyci5yZWFkKCk7XG4gICAgICAgICAgICBpZihzdGRlcnJPdXRwdXQgPT09IG51bGwgfHwgdGhpcy5pZ25vcmVFcnJvcnMpXG4gICAgICAgICAgICAgICAgcmV0dXJuOyAvLyB0aGlzIGlzIHRoZSBlbmQgb2YgdGhlIGlucHV0IHN0cmVhbVxuXG4gICAgICAgICAgICB0aGlzLmVtaXR0ZXIuZW1pdChcImVycm9yXCIsIHN0ZGVyck91dHB1dC50b1N0cmluZygpKTtcblxuICAgICAgICAgICAgaWYodGhpcy5jdXJyZW50U3RkZXJyT3V0cHV0ID09IFwiXCIpe1xuICAgICAgICAgICAgICAgIHRoaXMuZW1pdHRlci5vbmNlKFwicmVhZHlcIiwgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmVtaXR0ZXIuZW1pdChcImVycm9yLWNvbXBsZXRlZFwiLCB0aGlzLmN1cnJlbnRTdGRlcnJPdXRwdXQpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRTdGRlcnJPdXRwdXQgPSBcIlwiO1xuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMuY3VycmVudFN0ZGVyck91dHB1dCArPSBzdGRlcnJPdXRwdXQudG9TdHJpbmcoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHByaXZhdGUgY3VycmVudENvbW1hbmRCdWZmZXIgPSBcIlwiO1xuICAgICAgICBwcml2YXRlIGNvbW1hbmRzID0gPENvbW1hbmRbXT5bXTtcbiAgICAgICAgcHJpdmF0ZSBjdXJyZW50Q29tbWFuZDogQ29tbWFuZCA9IG51bGw7XG4gICAgICAgIHByaXZhdGUgY29tbWFuZEZpbmlzaGVkU3RyaW5nID0gXCJjb21tYW5kX2ZpbmlzaF9vNHVCMXdoYWd0ZXFFOHhCcTlvcVwiO1xuXG4gICAgICAgIHByaXZhdGUgb25TdGRvdXRSZWFkYWJsZSgpe1xuICAgICAgICAgICAgdmFyIGN1cnJlbnRTdHJpbmcgPSAodGhpcy5zdGRvdXQucmVhZCgpIHx8IFwiXCIpLnRvU3RyaW5nKCk7XG5cbiAgICAgICAgICAgIHRoaXMuY3VycmVudENvbW1hbmRCdWZmZXIgKz0gY3VycmVudFN0cmluZztcblxuICAgICAgICAgICAgdmFyIGZpbmlzaFN0cmluZ1Bvc2l0aW9uID0gdGhpcy5jdXJyZW50Q29tbWFuZEJ1ZmZlci5zZWFyY2godGhpcy5jb21tYW5kRmluaXNoZWRTdHJpbmcpO1xuICAgICAgICAgICAgaWYoZmluaXNoU3RyaW5nUG9zaXRpb24gIT09IC0xKXtcbiAgICAgICAgICAgICAgICBsZXQgb3V0cHV0U3RyaW5nID0gdGhpcy5jdXJyZW50Q29tbWFuZEJ1ZmZlci5zbGljZSgwLCBmaW5pc2hTdHJpbmdQb3NpdGlvbik7XG5cbiAgICAgICAgICAgICAgICBpZih0aGlzLmN1cnJlbnRDb21tYW5kLmVtaXRDb21tYW5kT3V0cHV0KVxuICAgICAgICAgICAgICAgICAgICB0aGlzLmVtaXR0ZXIuZW1pdChcImNvbnNvbGUtb3V0cHV0XCIsIG91dHB1dFN0cmluZyk7XG5cbiAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRDb21tYW5kLm9uRmluaXNoKG91dHB1dFN0cmluZyk7XG5cbiAgICAgICAgICAgICAgICAvLyBUYWtlIHRoZSBmaW5pc2hlZCBzdHJpbmcgb2ZmIHRoZSBidWZmZXIgYW5kIHByb2Nlc3MgdGhlIG5leHQgb3VwdXRcbiAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRDb21tYW5kQnVmZmVyID0gdGhpcy5jdXJyZW50Q29tbWFuZEJ1ZmZlci5zbGljZShcbiAgICAgICAgICAgICAgICAgICAgZmluaXNoU3RyaW5nUG9zaXRpb24gKyB0aGlzLmNvbW1hbmRGaW5pc2hlZFN0cmluZy5sZW5ndGgpO1xuICAgICAgICAgICAgICAgIHRoaXMub25TdGRvdXRSZWFkYWJsZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcHVibGljIHJ1bihjb21tYW5kVGV4dDogc3RyaW5nLFxuICAgICAgICAgICAgICAgIGVtaXRTdGF0dXNDaGFuZ2VzPzogYm9vbGVhbixcbiAgICAgICAgICAgICAgICBlbWl0SGlzdG9yeUxlbmd0aD86IGJvb2xlYW4sXG4gICAgICAgICAgICAgICAgZW1pdENvbW1hbmRPdXRwdXQ/OiBib29sZWFuLypkZWZhdWx0IHRydWUqLyxcbiAgICAgICAgICAgICAgICBmdWxmaWxXaXRoUHJvbXB0PzogYm9vbGVhbiAvKmRlZmF1bHQgZmFsc2UqLyk6IFByb21pc2U8c3RyaW5nPntcbiAgICAgICAgICAgIHZhciBzaGlmdEFuZFJ1bkNvbW1hbmQgPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgdmFyIGNvbW1hbmQgPSB0aGlzLmNvbW1hbmRzLnNoaWZ0KCk7XG5cbiAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRDb21tYW5kID0gY29tbWFuZDtcblxuICAgICAgICAgICAgICAgIGlmKGNvbW1hbmQuZW1pdENvbW1hbmRPdXRwdXQpXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZW1pdHRlci5lbWl0KFwiY29tbWFuZC1pc3N1ZWRcIiwgY29tbWFuZC50ZXh0KTtcblxuICAgICAgICAgICAgICAgIHRoaXMuc3RkaW4ud3JpdGUoY29tbWFuZC50ZXh0ICsgb3MuRU9MKTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGVtaXRTdGF0dXNDaGFuZ2VzID0gZW1pdFN0YXR1c0NoYW5nZXMgfHwgZmFsc2U7XG4gICAgICAgICAgICBlbWl0SGlzdG9yeUxlbmd0aCA9IGVtaXRIaXN0b3J5TGVuZ3RoIHx8IGZhbHNlO1xuICAgICAgICAgICAgaWYoZW1pdENvbW1hbmRPdXRwdXQgPT09IHVuZGVmaW5lZCkgZW1pdENvbW1hbmRPdXRwdXQgPSB0cnVlO1xuICAgICAgICAgICAgaWYoZnVsZmlsV2l0aFByb21wdCA9PT0gdW5kZWZpbmVkKSBmdWxmaWxXaXRoUHJvbXB0ID0gZmFsc2U7XG4gICAgICAgICAgICB2YXIgY3VycmVudFByb21pc2U6IFByb21pc2U8c3RyaW5nPjtcbiAgICAgICAgICAgIHJldHVybiBjdXJyZW50UHJvbWlzZSA9IG5ldyBQcm9taXNlPHN0cmluZz4oZnVsZmlsID0+IHtcbiAgICAgICAgICAgICAgICB2YXIgY29tbWFuZDogQ29tbWFuZCA9IHtcbiAgICAgICAgICAgICAgICAgICAgdGV4dDogY29tbWFuZFRleHQsXG4gICAgICAgICAgICAgICAgICAgIGVtaXRDb21tYW5kT3V0cHV0OiBlbWl0Q29tbWFuZE91dHB1dCxcbiAgICAgICAgICAgICAgICAgICAgZnVsZmlsV2l0aFByb21wdDogZnVsZmlsV2l0aFByb21wdCxcbiAgICAgICAgICAgICAgICAgICAgb25GaW5pc2g6IGFzeW5jIChvdXRwdXQpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudENvbW1hbmQgPSBudWxsO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbiBfZnVsZmlsKG5vUHJvbXB0OiBzdHJpbmcpe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmKGZ1bGZpbFdpdGhQcm9tcHQpe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmdWxmaWwob3V0cHV0KVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNle1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmdWxmaWwobm9Qcm9tcHQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGxhc3RFbmRPZkxpbmVQb3MgPSBvdXRwdXQubGFzdEluZGV4T2Yob3MuRU9MKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYobGFzdEVuZE9mTGluZVBvcyA9PSAtMSl7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLyppLmUuIG5vIG91dHB1dCBoYXMgYmVlbiBwcm9kdWNlZCovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYoZW1pdFN0YXR1c0NoYW5nZXMpe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmVtaXRTdGF0dXNDaGFuZ2VzKG91dHB1dCwgXCJcIiwgZW1pdEhpc3RvcnlMZW5ndGgpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgX2Z1bGZpbChcIlwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgX2Z1bGZpbChcIlwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNle1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBwcm9tcHRCZWdpblBvc2l0aW9uID0gbGFzdEVuZE9mTGluZVBvcyArIG9zLkVPTC5sZW5ndGg7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZihlbWl0U3RhdHVzQ2hhbmdlcyl7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZW1pdFN0YXR1c0NoYW5nZXMob3V0cHV0LnNsaWNlKHByb21wdEJlZ2luUG9zaXRpb24sIG91dHB1dC5sZW5ndGgpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb3V0cHV0LnNsaWNlKDAsIGxhc3RFbmRPZkxpbmVQb3MpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZW1pdEhpc3RvcnlMZW5ndGgpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgX2Z1bGZpbChvdXRwdXQuc2xpY2UoMCwgbGFzdEVuZE9mTGluZVBvcykpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNle1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBfZnVsZmlsKG91dHB1dC5zbGljZSgwLCBsYXN0RW5kT2ZMaW5lUG9zKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCBjdXJyZW50UHJvbWlzZTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYodGhpcy5jb21tYW5kcy5sZW5ndGggIT09IDAgJiYgdGhpcy5jdXJyZW50Q29tbWFuZCA9PT0gbnVsbClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaGlmdEFuZFJ1bkNvbW1hbmQoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICB0aGlzLmNvbW1hbmRzLnB1c2goY29tbWFuZCk7XG5cbiAgICAgICAgICAgICAgICBpZih0aGlzLmN1cnJlbnRDb21tYW5kID09PSBudWxsKXtcbiAgICAgICAgICAgICAgICAgICAgc2hpZnRBbmRSdW5Db21tYW5kKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSlcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZXhwb3J0ID0gR0hDSURlYnVnXG4iXX0=