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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiR0hDSURlYnVnLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL0dIQ0lEZWJ1Zy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQSxvQ0FBcUM7QUFFckMseUJBQTBCO0FBQzFCLHFDQUFxQztBQUVyQyw2QkFBOEI7QUFJOUIsSUFBTyxTQUFTLENBcWFmO0FBcmFELFdBQU8sV0FBUztJQXdDWjtRQXdDSSxZQUFZLFdBQVcsR0FBQyxNQUFNLEVBQUUsUUFBUSxHQUFDLEVBQUUsRUFBRSxNQUFNO1lBbkMzQyxnQkFBVyxHQUFpQixFQUFFLENBQUM7WUFDL0IsY0FBUyxHQUFHLEtBQUssQ0FBQztZQThCbkIsWUFBTyxHQUFxQixJQUFJLFFBQVEsQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQTJObEQsaUJBQVksR0FBRyxLQUFLLENBQUM7WUFDckIsd0JBQW1CLEdBQUcsRUFBRSxDQUFDO1lBa0J6Qix5QkFBb0IsR0FBRyxFQUFFLENBQUM7WUFDMUIsYUFBUSxHQUFjLEVBQUUsQ0FBQztZQUN6QixtQkFBYyxHQUFZLElBQUksQ0FBQztZQUMvQiwwQkFBcUIsR0FBRyxxQ0FBcUMsQ0FBQztZQTNPbEUsSUFBSSxDQUFDLFFBQVEsR0FBRyxFQUFFLENBQUMsS0FBSyxDQUFDLFdBQVcsRUFBRSxRQUFRLEVBQUUsRUFBQyxHQUFHLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUMsQ0FBQyxDQUFDO1lBRTVFLElBQUksQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLE1BQU0sRUFBRTtnQkFDckIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsSUFBSSxDQUFDLENBQUE7WUFDN0MsQ0FBQyxDQUFDLENBQUM7WUFFSCxJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDO1lBQ25DLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENB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b3VyY2VzQ29udGVudCI6WyJpbXBvcnQgY3AgPSByZXF1aXJlKFwiY2hpbGRfcHJvY2Vzc1wiKTtcbmltcG9ydCBzdHJlYW0gPSByZXF1aXJlKFwic3RyZWFtXCIpO1xuaW1wb3J0IG9zID0gcmVxdWlyZShcIm9zXCIpO1xuaW1wb3J0IGVtaXNzYXJ5ID0gcmVxdWlyZShcImVtaXNzYXJ5XCIpXG5pbXBvcnQgYXRvbUFQSSA9IHJlcXVpcmUoXCJhdG9tXCIpO1xuaW1wb3J0IHBhdGggPSByZXF1aXJlKFwicGF0aFwiKTtcblxuZGVjbGFyZSB2YXIgR0xPQkFMO1xuXG5tb2R1bGUgR0hDSURlYnVnIHtcbiAgICBleHBvcnQgaW50ZXJmYWNlIEJyZWFrSW5mb3tcbiAgICAgICAgZmlsZW5hbWU6IHN0cmluZztcbiAgICAgICAgcmFuZ2U6IG51bWJlcltdW107XG4gICAgICAgIGhpc3RvcnlMZW5ndGg/OiBudW1iZXI7XG4gICAgICAgIGxvY2FsQmluZGluZ3M6IHN0cmluZ1tdXG4gICAgfVxuXG4gICAgZXhwb3J0IGludGVyZmFjZSBFeGNlcHRpb25JbmZvIHtcbiAgICAgICAgaGlzdG9yeUxlbmd0aDogbnVtYmVyO1xuICAgICAgICBsb2NhbEJpbmRpbmdzOiBzdHJpbmdbXTtcbiAgICB9XG5cbiAgICBleHBvcnQgaW50ZXJmYWNlIEdIQ0lEZWJ1Z0VtaXR0ZXIgZXh0ZW5kcyBFbWlzc2FyeS5JRW1pdHRlcntcbiAgICAgICAgb24oZXZlbnROYW1lOiBcInJlYWR5XCIsIGhhbmRsZXI6ICgpID0+IGFueSk6IEF0b21Db3JlLkRpc3Bvc2FibGU7XG4gICAgICAgIG9uKGV2ZW50TmFtZTogXCJwYXVzZWQtb24tZXhjZXB0aW9uXCIsIGhhbmRsZXI6IChpbmZvOiBFeGNlcHRpb25JbmZvKSA9PiBhbnkpOiBBdG9tQ29yZS5EaXNwb3NhYmxlO1xuICAgICAgICBvbihldmVudE5hbWU6IFwiZXJyb3JcIiwgaGFuZGxlcjogKHRleHQ6IHN0cmluZykgPT4gYW55KTogQXRvbUNvcmUuRGlzcG9zYWJsZTtcbiAgICAgICAgb24oZXZlbnROYW1lOiBcImVycm9yLWNvbXBsZXRlZFwiLCBoYW5kbGVyOiAodGV4dDogc3RyaW5nKSA9PiBhbnkpOiBBdG9tQ29yZS5EaXNwb3NhYmxlO1xuICAgICAgICBvbihldmVudE5hbWU6IFwibGluZS1jaGFuZ2VkXCIsIGhhbmRsZXI6IChpbmZvOiBCcmVha0luZm8pID0+IGFueSk6IEF0b21Db3JlLkRpc3Bvc2FibGU7XG4gICAgICAgIG9uKGV2ZW50TmFtZTogXCJkZWJ1Zy1maW5pc2hlZFwiLCBoYW5kbGVyOiAoKSA9PiBhbnkpOiBBdG9tQ29yZS5EaXNwb3NhYmxlO1xuICAgICAgICBvbihldmVudE5hbWU6IFwiY29uc29sZS1vdXRwdXRcIiwgaGFuZGxlcjogKG91dHB1dDogc3RyaW5nKSA9PiBhbnkpOiBBdG9tQ29yZS5EaXNwb3NhYmxlO1xuICAgICAgICBvbihldmVudE5hbWU6IFwiY29tbWFuZC1pc3N1ZWRcIiwgaGFuZGxlcjogKGNvbW1hbmQ6IHN0cmluZykgPT4gYW55KTogQXRvbUNvcmUuRGlzcG9zYWJsZTtcblxuICAgICAgICBlbWl0KGV2ZW50TmFtZTogXCJwYXVzZWQtb24tZXhjZXB0aW9uXCIsIHZhbHVlOiBFeGNlcHRpb25JbmZvKTogdm9pZDtcbiAgICAgICAgZW1pdChldmVudE5hbWU6IFwicmVhZHlcIiwgdmFsdWU6IEV4Y2VwdGlvbkluZm8pOiB2b2lkO1xuICAgICAgICBlbWl0KGV2ZW50TmFtZTogXCJlcnJvclwiLCB0ZXh0OiBzdHJpbmcpOiB2b2lkO1xuICAgICAgICBlbWl0KGV2ZW50TmFtZTogXCJlcnJvci1jb21wbGV0ZWRcIiwgdGV4dDogc3RyaW5nKTogdm9pZDtcbiAgICAgICAgZW1pdChldmVudE5hbWU6IFwibGluZS1jaGFuZ2VkXCIsIHZhbHVlOiBCcmVha0luZm8pOiB2b2lkO1xuICAgICAgICBlbWl0KGV2ZW50TmFtZTogXCJkZWJ1Zy1maW5pc2hlZFwiLCB2YWx1ZTogYW55KTogdm9pZDtcbiAgICAgICAgZW1pdChldmVudE5hbWU6IFwiY29uc29sZS1vdXRwdXRcIiwgdmFsdWU6IHN0cmluZyk6IHZvaWQ7XG4gICAgICAgIGVtaXQoZXZlbnROYW1lOiBcImNvbW1hbmQtaXNzdWVkXCIsIHZhbHVlOiBzdHJpbmcpOiB2b2lkO1xuICAgIH1cblxuICAgIGludGVyZmFjZSBDb21tYW5ke1xuICAgICAgICB0ZXh0OiBzdHJpbmc7XG4gICAgICAgIGVtaXRDb21tYW5kT3V0cHV0OiBib29sZWFuO1xuICAgICAgICBmdWxmaWxXaXRoUHJvbXB0OiBib29sZWFuO1xuICAgICAgICBvbkZpbmlzaDogKG91dHB1dDogc3RyaW5nKSA9PiBhbnk7XG4gICAgfVxuXG4gICAgZXhwb3J0IGNsYXNzIEdIQ0lEZWJ1Z3tcbiAgICAgICAgcHJpdmF0ZSBnaGNpX2NtZDogY3AuQ2hpbGRQcm9jZXNzO1xuICAgICAgICBzdGRvdXQ6IHN0cmVhbS5SZWFkYWJsZTtcbiAgICAgICAgc3RkaW46IHN0cmVhbS5Xcml0YWJsZTtcbiAgICAgICAgc3RkZXJyOiBzdHJlYW0uUmVhZGFibGU7XG4gICAgICAgIHByaXZhdGUgYnJlYWtwb2ludHM6IEJyZWFrcG9pbnRbXSA9IFtdOyAvL0xpbmVzIHRvIGJyZWFrIG9uXG4gICAgICAgIHByaXZhdGUgaXNSdW5uaW5nID0gZmFsc2U7XG5cbiAgICAgICAgLyoqIEV2ZW50IEhhbmRsZXJcbiAgICAgICAgICAqXG4gICAgICAgICAgKiBFdmVudHM6XG4gICAgICAgICAgKlxuICAgICAgICAgICogcmVhZHk6ICgpXG4gICAgICAgICAgKiAgICAgRW1taXRlZCB3aGVuIGdoY2kgaGFzIGp1c3Qgc3RvcHBlZCBleGVjdXRpbmcgYSBjb21tYW5kXG4gICAgICAgICAgKlxuICAgICAgICAgICogcGF1c2VkLW9uLWV4Y2VwdGlvbjogKGluZm86IEV4Y2VwdGlvbkluZm8pXG4gICAgICAgICAgKiAgICAgRW1taXRlZCB3aGVuIHRoZSBkZWJ1Z2dlciBpcyBhdCBhbiBleGNlcHRpb25cbiAgICAgICAgICAqXG4gICAgICAgICAgKiBlcnJvcjogKHRleHQ6IHN0cmluZylcbiAgICAgICAgICAqICAgICBFbW1pdGVkIHdoZW4gc3RkZXJyIGhhcyBpbnB1dFxuICAgICAgICAgICpcbiAgICAgICAgICAqIGVycm9yLWNvbXBsZXRlZDogKHRleHQ6IHN0cmluZylcbiAgICAgICAgICAqICAgICBFbW1pdGVkIHdoZW4gZ2hjaSByZXBvcnRzIGFuIGVycm9yIGZvciBhIGdpdmVuIGNvbW1hbmRcbiAgICAgICAgICAqXG4gICAgICAgICAgKiBsaW5lLWNoYW5nZWQ6IChpbmZvOiBCcmVha0luZm8pXG4gICAgICAgICAgKiAgICAgRW1taXRlZCB3aGVuIHRoZSBsaW5lIHRoYXQgdGhlIGRlYnVnZ2VyIGlzIG9uIGNoYW5nZXNcbiAgICAgICAgICAqXG4gICAgICAgICAgKiBkZWJ1Zy1maW5pc2hlZDogKHZvaWQpXG4gICAgICAgICAgKiAgICAgRW1taXRlZCB3aGVuIHRoZSBkZWJ1Z2dlciBoYXMgcmVhY2hlZCB0aGUgZW5kIG9mIHRoZSBwcm9ncmFtXG4gICAgICAgICAgKlxuICAgICAgICAgICogY29uc29sZS1vdXRwdXQ6IChvdXRwdXQ6IHN0cmluZylcbiAgICAgICAgICAqICAgICBFbW1pdGVkIHdoZW4gdGhlIGdoY2kgaGFzIG91dHB1dGVkIHNvbWV0aGluZyB0byBzdGRvdXQsIGV4Y2x1ZGluZyB0aGUgZXh0cmEgcHJvbXB0XG4gICAgICAgICAgKlxuICAgICAgICAgICogY29tbWFuZC1pc3N1ZWQ6IChjb21tYW5kOiBzdHJpbmcpXG4gICAgICAgICAgKiAgICAgRW1taXRlZCB3aGVuIGEgY29tbWFuZCBoYXMgYmVlbiBleGVjdXRlZFxuICAgICAgICAgICovXG4gICAgICAgIHB1YmxpYyBlbWl0dGVyOiBHSENJRGVidWdFbWl0dGVyID0gbmV3IGVtaXNzYXJ5LkVtaXR0ZXIoKTtcblxuICAgICAgICBwcml2YXRlIHN0YXJ0VGV4dDogUHJvbWlzZTxzdHJpbmc+O1xuXG4gICAgICAgIGNvbnN0cnVjdG9yKGdoY2lDb21tYW5kPVwiZ2hjaVwiLCBnaGNpQXJncz1bXSwgZm9sZGVyKXtcblxuICAgICAgICAgICAgdGhpcy5naGNpX2NtZCA9IGNwLnNwYXduKGdoY2lDb21tYW5kLCBnaGNpQXJncywge2N3ZDogZm9sZGVyLCBzaGVsbDogdHJ1ZX0pO1xuXG4gICAgICAgICAgICB0aGlzLmdoY2lfY21kLm9uKFwiZXhpdFwiLCAoKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5lbWl0dGVyLmVtaXQoXCJkZWJ1Zy1maW5pc2hlZFwiLCBudWxsKVxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIHRoaXMuc3Rkb3V0ID0gdGhpcy5naGNpX2NtZC5zdGRvdXQ7XG4gICAgICAgICAgICB0aGlzLnN0ZGluID0gdGhpcy5naGNpX2NtZC5zdGRpbjtcbiAgICAgICAgICAgIHRoaXMuc3RkZXJyID0gdGhpcy5naGNpX2NtZC5zdGRlcnI7XG4gICAgICAgICAgICB0aGlzLnN0ZG91dC5vbihcInJlYWRhYmxlXCIsICgpID0+IHRoaXMub25TdGRvdXRSZWFkYWJsZSgpKTtcbiAgICAgICAgICAgIHRoaXMuc3RkZXJyLm9uKFwicmVhZGFibGVcIiwgKCkgPT4gdGhpcy5vblN0ZGVyclJlYWRhYmxlKCkpO1xuXG4gICAgICAgICAgICB0aGlzLmFkZFJlYWR5RXZlbnQoKTtcblxuICAgICAgICAgICAgdGhpcy5zdGFydFRleHQgPSB0aGlzLnJ1bihgOnNldCBwcm9tcHQgXCIlcz4gJHt0aGlzLmNvbW1hbmRGaW5pc2hlZFN0cmluZ31cImAsIGZhbHNlLCBmYWxzZSwgZmFsc2UsIHRydWUpO1xuICAgICAgICB9XG5cbiAgICAgICAgcHJpdmF0ZSBhZGRSZWFkeUV2ZW50KCl7XG4gICAgICAgICAgICBjb25zdCBldmVudFN1YnMgPSBbXG4gICAgICAgICAgICAgICAgXCJwYXVzZWQtb24tZXhjZXB0aW9uXCIsXG4gICAgICAgICAgICAgICAgXCJsaW5lLWNoYW5nZWRcIixcbiAgICAgICAgICAgICAgICBcImRlYnVnLWZpbmlzaGVkXCIsXG4gICAgICAgICAgICBdO1xuXG4gICAgICAgICAgICBmb3IodmFyIGV2ZW50TmFtZSBvZiBldmVudFN1YnMpe1xuICAgICAgICAgICAgICAgICg8YW55PnRoaXMuZW1pdHRlci5vbikoZXZlbnROYW1lLCAoKSA9PiB0aGlzLmVtaXR0ZXIuZW1pdChcInJlYWR5XCIsIG51bGwpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHB1YmxpYyBkZXN0cm95KCl7XG4gICAgICAgICAgICB0aGlzLnN0b3AoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHB1YmxpYyBsb2FkTW9kdWxlKG5hbWU6IHN0cmluZyl7XG4gICAgICAgICAgICB2YXIgY3dkID0gcGF0aC5kaXJuYW1lKG5hbWUpO1xuXG4gICAgICAgICAgICB0aGlzLnJ1bihgOmNkICR7Y3dkfWApO1xuICAgICAgICAgICAgdGhpcy5ydW4oYDpsb2FkICR7bmFtZX1gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHB1YmxpYyBzZXRFeGNlcHRpb25CcmVha0xldmVsKGxldmVsOiBFeGNlcHRpb25CcmVha0xldmVscyl7XG4gICAgICAgICAgICB0aGlzLnJ1bihcIjp1bnNldCAtZmJyZWFrLW9uLWV4Y2VwdGlvblwiKTtcbiAgICAgICAgICAgIHRoaXMucnVuKFwiOnVuc2V0IC1mYnJlYWstb24tZXJyb3JcIik7XG5cbiAgICAgICAgICAgIGlmKGxldmVsID09IFwiZXhjZXB0aW9uc1wiKXtcbiAgICAgICAgICAgICAgICB0aGlzLnJ1bihcIjpzZXQgLWZicmVhay1vbi1leGNlcHRpb25cIik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmKGxldmVsID09IFwiZXJyb3JzXCIpe1xuICAgICAgICAgICAgICAgIHRoaXMucnVuKFwiOnNldCAtZmJyZWFrLW9uLWVycm9yXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcHVibGljIGFkZEJyZWFrcG9pbnQoYnJlYWtwb2ludDogQnJlYWtwb2ludCB8IHN0cmluZyl7XG4gICAgICAgICAgICBpZih0eXBlb2YgYnJlYWtwb2ludCA9PSBcInN0cmluZ1wiKVxuICAgICAgICAgICAgICAgIHRoaXMucnVuKGA6YnJlYWsgJHticmVha3BvaW50fWApO1xuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIHRoaXMucnVuKGA6YnJlYWsgJHticmVha3BvaW50LmZpbGV9ICR7YnJlYWtwb2ludC5saW5lfWApO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqIHJlc29sdmVkIHRoZSBnaXZlbiBleHByZXNzaW9uIHVzaW5nIDpwcmludCwgcmV0dXJucyBudWxsIGlmIGl0IGlzIGludmFsaWRcbiAgICAgICAgKi9cbiAgICAgICAgcHVibGljIGFzeW5jIHJlc29sdmVFeHByZXNzaW9uKGV4cHJlc3Npb246IHN0cmluZyl7XG4gICAgICAgICAgICAvLyBleHByZXNzaW9ucyBjYW4ndCBoYXZlIG5ldyBsaW5lc1xuICAgICAgICAgICAgaWYoZXhwcmVzc2lvbi5pbmRleE9mKFwiXFxuXCIpICE9IC0xKXtcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIGdldEV4cHJlc3Npb24gPSAoZ2hjaU91dHB1dDogc3RyaW5nLCB2YXJpYWJsZTogc3RyaW5nKTogc3RyaW5nID0+IHtcbiAgICAgICAgICAgICAgICB2YXIgbWF0Y2hSZXN1bHQgPSBnaGNpT3V0cHV0Lm1hdGNoKC9bXiBdKiA9ICguKikvKTtcbiAgICAgICAgICAgICAgICBpZihtYXRjaFJlc3VsdCA9PT0gbnVsbCkgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG1hdGNoUmVzdWx0WzFdO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgLy8gZm9yIHRoZSBjb2RlIGJlbG93LCBpZ25vcmUgZXJyb3JzXG4gICAgICAgICAgICB0aGlzLmlnbm9yZUVycm9ycyA9IHRydWU7XG5cbiAgICAgICAgICAgIHRyeXtcbiAgICAgICAgICAgICAgICAvLyB0cnkgcHJpbnRpbmcgZXhwcmVzc2lvblxuICAgICAgICAgICAgICAgIHZhciBwcmludGluZ1Jlc3VsdCA9IGdldEV4cHJlc3Npb24oYXdhaXQgdGhpcy5ydW4oYDpwcmludCAke2V4cHJlc3Npb259YCwgZmFsc2UsIGZhbHNlLCBmYWxzZSksIGV4cHJlc3Npb24pO1xuICAgICAgICAgICAgICAgIGlmKHByaW50aW5nUmVzdWx0ICE9PSBudWxsKXtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHByaW50aW5nUmVzdWx0O1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIGlmIHRoYXQgZmFpbHMgYXNzaWduIGl0IHRvIGEgdGVtcG9yYXJ5IHZhcmlhYmxlIGFuZCBldmFsdWF0ZSB0aGF0XG4gICAgICAgICAgICAgICAgdmFyIHRlbXBWYXJOdW0gPSAwO1xuICAgICAgICAgICAgICAgIHZhciBwb3RlbnRpYWxUZW1wVmFyOiBzdHJpbmcgfCBib29sZWFuO1xuICAgICAgICAgICAgICAgIGRve1xuICAgICAgICAgICAgICAgICAgICBwb3RlbnRpYWxUZW1wVmFyID0gZ2V0RXhwcmVzc2lvbihhd2FpdCB0aGlzLnJ1bihgOnByaW50IHRlbXAke3RlbXBWYXJOdW19YCwgZmFsc2UsIGZhbHNlLCBmYWxzZSksIGB0ZW1wJHt0ZW1wVmFyTnVtfWApXG4gICAgICAgICAgICAgICAgfSB3aGlsZShwb3RlbnRpYWxUZW1wVmFyICE9PSBudWxsKTtcblxuICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMucnVuKGBsZXQgdGVtcCR7dGVtcFZhck51bX0gPSAke2V4cHJlc3Npb259YCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGdldEV4cHJlc3Npb24oYXdhaXQgdGhpcy5ydW4oYDpwcmludCB0ZW1wJHt0ZW1wVmFyTnVtfWAsIGZhbHNlLCBmYWxzZSwgZmFsc2UpLCBgdGVtcCR7dGVtcFZhck51bX1gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZpbmFsbHl7XG4gICAgICAgICAgICAgICAgdGhpcy5pZ25vcmVFcnJvcnMgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHB1YmxpYyBmb3J3YXJkKCl7XG4gICAgICAgICAgICB0aGlzLnJ1bihcIjpmb3J3YXJkXCIsIHRydWUpO1xuICAgICAgICB9XG5cbiAgICAgICAgcHVibGljIGJhY2soKXtcbiAgICAgICAgICAgIHRoaXMucnVuKFwiOmJhY2tcIiwgdHJ1ZSk7XG4gICAgICAgIH1cblxuICAgICAgICBwdWJsaWMgc3RlcCgpe1xuICAgICAgICAgICAgdGhpcy5ydW4oXCI6c3RlcFwiLCB0cnVlLCB0cnVlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHB1YmxpYyBzdG9wKCkge1xuICAgICAgICAgICAgdGhpcy5ydW4oXCI6cXVpdFwiKTtcbiAgICAgICAgICAgIHRoaXMuZW1pdHRlci5lbWl0KFwiZGVidWctZmluaXNoZWRcIiwgbnVsbCk7XG4gICAgICAgIH1cblxuICAgICAgICBwdWJsaWMgY29udGludWUoKSB7XG4gICAgICAgICAgICB0aGlzLnJ1bihcIjpjb250aW51ZVwiLCB0cnVlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHB1YmxpYyBhc3luYyBhZGRlZEFsbExpc3RlbmVycygpe1xuICAgICAgICAgICAgdGhpcy5zdGFydFRleHQudGhlbih0ZXh0ID0+IHtcbiAgICAgICAgICAgICAgICB2YXIgZmlyc3RQcm9tcHQgPSB0ZXh0LmluZGV4T2YoXCI+IFwiKTtcbiAgICAgICAgICAgICAgICB0aGlzLmVtaXR0ZXIuZW1pdChcImNvbnNvbGUtb3V0cHV0XCIsIHRleHQuc2xpY2UoMCwgZmlyc3RQcm9tcHQgKyAyKSk7XG4gICAgICAgICAgICB9KVxuICAgICAgICB9XG5cbiAgICAgICAgYXN5bmMgc3RhcnREZWJ1Zyhtb2R1bGVOYW1lPzogc3RyaW5nKXtcbiAgICAgICAgICAgIG1vZHVsZU5hbWUgPSBtb2R1bGVOYW1lIHx8IFwibWFpblwiO1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5ydW4oXCI6dHJhY2UgXCIgKyBtb2R1bGVOYW1lLCB0cnVlLCB0cnVlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGFzeW5jIGdldEJpbmRpbmdzKCl7XG4gICAgICAgICAgICB2YXIgb3V0cHV0U3RyID0gYXdhaXQgdGhpcy5ydW4oXCI6c2hvdyBiaW5kaW5nc1wiLCBmYWxzZSwgZmFsc2UsIGZhbHNlKTtcbiAgICAgICAgICAgIHJldHVybiBvdXRwdXRTdHIuc3BsaXQob3MuRU9MKVxuICAgICAgICB9XG5cbiAgICAgICAgcHJpdmF0ZSBhc3luYyBnZXRIaXN0b3J5TGVuZ3RoKCl7XG4gICAgICAgICAgICB2YXIgaGlzdG9yeVF1ZXJ5ID0gYXdhaXQgdGhpcy5ydW4oXCI6aGlzdG9yeSAxMDBcIiwgZmFsc2UsIGZhbHNlLCBmYWxzZSk7XG4gICAgICAgICAgICBjb25zdCByZWdleCA9IC8tKFxcZCopLiooPzpcXG58XFxyfFxcclxcbik8ZW5kIG9mIGhpc3Rvcnk+JC87XG5cbiAgICAgICAgICAgIHZhciBtYXRjaFJlc3VsdCA9IGhpc3RvcnlRdWVyeS5tYXRjaChyZWdleCk7XG4gICAgICAgICAgICBpZihtYXRjaFJlc3VsdCA9PT0gbnVsbCl7XG4gICAgICAgICAgICAgICAgcmV0dXJuIDA7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmKGhpc3RvcnlRdWVyeS5zbGljZSgtMykgPT0gXCIuLi5cIil7XG4gICAgICAgICAgICAgICAgcmV0dXJuIEluZmluaXR5Oy8vIGhpc3RvcnkgaXMgdmVyeSBsb25nXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNle1xuICAgICAgICAgICAgICAgIHJldHVybiBwYXJzZUludChtYXRjaFJlc3VsdFsxXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBzdGF0aWMgcGF1c2VkT25FcnJvciA9IFN5bWJvbChcIlBhdXNlZCBvbiBFcnJvclwiKTtcbiAgICAgICAgc3RhdGljIGZpbmlzaGVkRGVidWdnaW5nID0gU3ltYm9sKFwiRmluaXNoZWQgZGVidWdnaW5nXCIpO1xuXG4gICAgICAgIHByaXZhdGUgcGFyc2VQcm9tcHQoc3RkT3V0cHV0OiBzdHJpbmcpOiBCcmVha0luZm8gfCBTeW1ib2x7XG4gICAgICAgICAgICB2YXIgYnJlYWtJbmZvT2I6IEJyZWFrSW5mbztcbiAgICAgICAgICAgIHZhciBwYXR0ZXJucyA9IDx7cGF0dGVybjogUmVnRXhwOyBmdW5jOiAobWF0Y2g6IHN0cmluZ1tdKSA9PiBCcmVha0luZm8gfCBTeW1ib2x9W10+W3tcbiAgICAgICAgICAgICAgICBwYXR0ZXJuOiAvXFxbKD86Wy1cXGRdKjogKT8oLiopOlxcKChcXGQrKSwoXFxkKylcXCktXFwoKFxcZCspLChcXGQrKVxcKS4qXFxdLio+ICQvLFxuICAgICAgICAgICAgICAgIGZ1bmM6IG1hdGNoID0+ICh7XG4gICAgICAgICAgICAgICAgICAgIGZpbGVuYW1lOiBtYXRjaFsxXSxcbiAgICAgICAgICAgICAgICAgICAgcmFuZ2U6IFtbcGFyc2VJbnQobWF0Y2hbMl0pIC0gMSwgcGFyc2VJbnQobWF0Y2hbM10pIC0gMV0sXG4gICAgICAgICAgICAgICAgICAgICAgICBbcGFyc2VJbnQobWF0Y2hbNF0pLCBwYXJzZUludChtYXRjaFs1XSldXVxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICB9LHtcbiAgICAgICAgICAgICAgICBwYXR0ZXJuOiAvXFxbKD86Wy1cXGRdKjogKT8oLiopOihcXGQqKTooXFxkKiktKFxcZCopXFxdLio+ICQvLFxuICAgICAgICAgICAgICAgIGZ1bmM6IG1hdGNoID0+ICh7XG4gICAgICAgICAgICAgICAgICAgICAgICBmaWxlbmFtZTogbWF0Y2hbMV0sXG4gICAgICAgICAgICAgICAgICAgICAgICByYW5nZTogW1twYXJzZUludChtYXRjaFsyXSkgLSAxLCBwYXJzZUludChtYXRjaFszXSkgLSAxXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBbcGFyc2VJbnQobWF0Y2hbMl0pIC0gMSwgcGFyc2VJbnQobWF0Y2hbNF0pXV1cbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgfSx7XG4gICAgICAgICAgICAgICAgcGF0dGVybjogL1xcWzxleGNlcHRpb24gdGhyb3duPlxcXS4qPiAkLyxcbiAgICAgICAgICAgICAgICBmdW5jOiAoKSA9PiBHSENJRGVidWcucGF1c2VkT25FcnJvclxuICAgICAgICAgICAgfSx7XG4gICAgICAgICAgICAgICAgcGF0dGVybjogLy4qPiAkLyxcbiAgICAgICAgICAgICAgICBmdW5jOiAoKSA9PiBHSENJRGVidWcuZmluaXNoZWREZWJ1Z2dpbmdcbiAgICAgICAgICAgIH1dO1xuICAgICAgICAgICAgZm9yICh2YXIgcGF0dGVybiBvZiBwYXR0ZXJucyl7XG4gICAgICAgICAgICAgICAgdmFyIG1hdGNoUmVzdWx0ID0gc3RkT3V0cHV0Lm1hdGNoKHBhdHRlcm4ucGF0dGVybik7XG4gICAgICAgICAgICAgICAgaWYobWF0Y2hSZXN1bHQgIT0gbnVsbCl7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBwYXR0ZXJuLmZ1bmMobWF0Y2hSZXN1bHQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkNhbm5vdCByZWFkIHByb21wdDogXFxuXCIgKyBzdGRPdXRwdXQpO1xuICAgICAgICB9XG5cbiAgICAgICAgcHJpdmF0ZSBhc3luYyBlbWl0U3RhdHVzQ2hhbmdlcyhwcm9tcHQ6IHN0cmluZywgbWFpbkJvZHk6IHN0cmluZywgZW1pdEhpc3RvcnlMZW5ndGg6IGJvb2xlYW4pe1xuICAgICAgICAgICAgdmFyIHJlc3VsdCA9IHRoaXMucGFyc2VQcm9tcHQocHJvbXB0KTtcblxuICAgICAgICAgICAgaWYocmVzdWx0ID09IEdIQ0lEZWJ1Zy5wYXVzZWRPbkVycm9yKSB7XG4gICAgICAgICAgICAgICAgdmFyIGhpc3RvcnlMZW5ndGggPSBhd2FpdCB0aGlzLmdldEhpc3RvcnlMZW5ndGgoKTtcblxuICAgICAgICAgICAgICAgIHRoaXMuZW1pdHRlci5lbWl0KFwicGF1c2VkLW9uLWV4Y2VwdGlvblwiLCB7XG4gICAgICAgICAgICAgICAgICAgIGhpc3RvcnlMZW5ndGg6IGhpc3RvcnlMZW5ndGgsXG4gICAgICAgICAgICAgICAgICAgIGxvY2FsQmluZGluZ3M6IG1haW5Cb2R5LnNwbGl0KFwiXFxuXCIpLnNsaWNlKDEpXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmKHJlc3VsdCA9PSBHSENJRGVidWcuZmluaXNoZWREZWJ1Z2dpbmcpe1xuICAgICAgICAgICAgICAgIHRoaXMuZW1pdHRlci5lbWl0KFwiZGVidWctZmluaXNoZWRcIiwgdW5kZWZpbmVkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2V7XG4gICAgICAgICAgICAgICAgdmFyIGJyZWFrSW5mbyA9IDxCcmVha0luZm8+cmVzdWx0O1xuXG4gICAgICAgICAgICAgICAgYnJlYWtJbmZvLmxvY2FsQmluZGluZ3MgPSBhd2FpdCB0aGlzLmdldEJpbmRpbmdzKCk7XG5cbiAgICAgICAgICAgICAgICBpZihlbWl0SGlzdG9yeUxlbmd0aClcbiAgICAgICAgICAgICAgICAgICAgYnJlYWtJbmZvLmhpc3RvcnlMZW5ndGggPSBhd2FpdCB0aGlzLmdldEhpc3RvcnlMZW5ndGgoKTtcblxuICAgICAgICAgICAgICAgIHRoaXMuZW1pdHRlci5lbWl0KFwibGluZS1jaGFuZ2VkXCIsIGJyZWFrSW5mbyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBwcml2YXRlIGlnbm9yZUVycm9ycyA9IGZhbHNlO1xuICAgICAgICBwcml2YXRlIGN1cnJlbnRTdGRlcnJPdXRwdXQgPSBcIlwiO1xuICAgICAgICBwcml2YXRlIG9uU3RkZXJyUmVhZGFibGUoKXtcbiAgICAgICAgICAgIHZhciBzdGRlcnJPdXRwdXQ6IEJ1ZmZlciA9IHRoaXMuc3RkZXJyLnJlYWQoKTtcbiAgICAgICAgICAgIGlmKHN0ZGVyck91dHB1dCA9PT0gbnVsbCB8fCB0aGlzLmlnbm9yZUVycm9ycylcbiAgICAgICAgICAgICAgICByZXR1cm47IC8vIHRoaXMgaXMgdGhlIGVuZCBvZiB0aGUgaW5wdXQgc3RyZWFtXG5cbiAgICAgICAgICAgIHRoaXMuZW1pdHRlci5lbWl0KFwiZXJyb3JcIiwgc3RkZXJyT3V0cHV0LnRvU3RyaW5nKCkpO1xuXG4gICAgICAgICAgICBpZih0aGlzLmN1cnJlbnRTdGRlcnJPdXRwdXQgPT0gXCJcIil7XG4gICAgICAgICAgICAgICAgdGhpcy5lbWl0dGVyLm9uY2UoXCJyZWFkeVwiLCAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZW1pdHRlci5lbWl0KFwiZXJyb3ItY29tcGxldGVkXCIsIHRoaXMuY3VycmVudFN0ZGVyck91dHB1dCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudFN0ZGVyck91dHB1dCA9IFwiXCI7XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy5jdXJyZW50U3RkZXJyT3V0cHV0ICs9IHN0ZGVyck91dHB1dC50b1N0cmluZygpO1xuICAgICAgICB9XG5cbiAgICAgICAgcHJpdmF0ZSBjdXJyZW50Q29tbWFuZEJ1ZmZlciA9IFwiXCI7XG4gICAgICAgIHByaXZhdGUgY29tbWFuZHMgPSA8Q29tbWFuZFtdPltdO1xuICAgICAgICBwcml2YXRlIGN1cnJlbnRDb21tYW5kOiBDb21tYW5kID0gbnVsbDtcbiAgICAgICAgcHJpdmF0ZSBjb21tYW5kRmluaXNoZWRTdHJpbmcgPSBcImNvbW1hbmRfZmluaXNoX280dUIxd2hhZ3RlcUU4eEJxOW9xXCI7XG5cbiAgICAgICAgcHJpdmF0ZSBvblN0ZG91dFJlYWRhYmxlKCl7XG4gICAgICAgICAgICB2YXIgY3VycmVudFN0cmluZyA9ICh0aGlzLnN0ZG91dC5yZWFkKCkgfHwgXCJcIikudG9TdHJpbmcoKTtcblxuICAgICAgICAgICAgdGhpcy5jdXJyZW50Q29tbWFuZEJ1ZmZlciArPSBjdXJyZW50U3RyaW5nO1xuXG4gICAgICAgICAgICB2YXIgZmluaXNoU3RyaW5nUG9zaXRpb24gPSB0aGlzLmN1cnJlbnRDb21tYW5kQnVmZmVyLnNlYXJjaCh0aGlzLmNvbW1hbmRGaW5pc2hlZFN0cmluZyk7XG4gICAgICAgICAgICBpZihmaW5pc2hTdHJpbmdQb3NpdGlvbiAhPT0gLTEpe1xuICAgICAgICAgICAgICAgIGxldCBvdXRwdXRTdHJpbmcgPSB0aGlzLmN1cnJlbnRDb21tYW5kQnVmZmVyLnNsaWNlKDAsIGZpbmlzaFN0cmluZ1Bvc2l0aW9uKTtcblxuICAgICAgICAgICAgICAgIGlmKHRoaXMuY3VycmVudENvbW1hbmQuZW1pdENvbW1hbmRPdXRwdXQpXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZW1pdHRlci5lbWl0KFwiY29uc29sZS1vdXRwdXRcIiwgb3V0cHV0U3RyaW5nKTtcblxuICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudENvbW1hbmQub25GaW5pc2gob3V0cHV0U3RyaW5nKTtcblxuICAgICAgICAgICAgICAgIC8vIFRha2UgdGhlIGZpbmlzaGVkIHN0cmluZyBvZmYgdGhlIGJ1ZmZlciBhbmQgcHJvY2VzcyB0aGUgbmV4dCBvdXB1dFxuICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudENvbW1hbmRCdWZmZXIgPSB0aGlzLmN1cnJlbnRDb21tYW5kQnVmZmVyLnNsaWNlKFxuICAgICAgICAgICAgICAgICAgICBmaW5pc2hTdHJpbmdQb3NpdGlvbiArIHRoaXMuY29tbWFuZEZpbmlzaGVkU3RyaW5nLmxlbmd0aCk7XG4gICAgICAgICAgICAgICAgdGhpcy5vblN0ZG91dFJlYWRhYmxlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBwdWJsaWMgcnVuKGNvbW1hbmRUZXh0OiBzdHJpbmcsXG4gICAgICAgICAgICAgICAgZW1pdFN0YXR1c0NoYW5nZXM/OiBib29sZWFuLFxuICAgICAgICAgICAgICAgIGVtaXRIaXN0b3J5TGVuZ3RoPzogYm9vbGVhbixcbiAgICAgICAgICAgICAgICBlbWl0Q29tbWFuZE91dHB1dD86IGJvb2xlYW4vKmRlZmF1bHQgdHJ1ZSovLFxuICAgICAgICAgICAgICAgIGZ1bGZpbFdpdGhQcm9tcHQ/OiBib29sZWFuIC8qZGVmYXVsdCBmYWxzZSovKTogUHJvbWlzZTxzdHJpbmc+e1xuICAgICAgICAgICAgdmFyIHNoaWZ0QW5kUnVuQ29tbWFuZCA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICB2YXIgY29tbWFuZCA9IHRoaXMuY29tbWFuZHMuc2hpZnQoKTtcblxuICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudENvbW1hbmQgPSBjb21tYW5kO1xuXG4gICAgICAgICAgICAgICAgaWYoY29tbWFuZC5lbWl0Q29tbWFuZE91dHB1dClcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5lbWl0dGVyLmVtaXQoXCJjb21tYW5kLWlzc3VlZFwiLCBjb21tYW5kLnRleHQpO1xuXG4gICAgICAgICAgICAgICAgdGhpcy5zdGRpbi53cml0ZShjb21tYW5kLnRleHQgKyBvcy5FT0wpO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgZW1pdFN0YXR1c0NoYW5nZXMgPSBlbWl0U3RhdHVzQ2hhbmdlcyB8fCBmYWxzZTtcbiAgICAgICAgICAgIGVtaXRIaXN0b3J5TGVuZ3RoID0gZW1pdEhpc3RvcnlMZW5ndGggfHwgZmFsc2U7XG4gICAgICAgICAgICBpZihlbWl0Q29tbWFuZE91dHB1dCA9PT0gdW5kZWZpbmVkKSBlbWl0Q29tbWFuZE91dHB1dCA9IHRydWU7XG4gICAgICAgICAgICBpZihmdWxmaWxXaXRoUHJvbXB0ID09PSB1bmRlZmluZWQpIGZ1bGZpbFdpdGhQcm9tcHQgPSBmYWxzZTtcbiAgICAgICAgICAgIHZhciBjdXJyZW50UHJvbWlzZTogUHJvbWlzZTxzdHJpbmc+O1xuICAgICAgICAgICAgcmV0dXJuIGN1cnJlbnRQcm9taXNlID0gbmV3IFByb21pc2U8c3RyaW5nPihmdWxmaWwgPT4ge1xuICAgICAgICAgICAgICAgIHZhciBjb21tYW5kOiBDb21tYW5kID0ge1xuICAgICAgICAgICAgICAgICAgICB0ZXh0OiBjb21tYW5kVGV4dCxcbiAgICAgICAgICAgICAgICAgICAgZW1pdENvbW1hbmRPdXRwdXQ6IGVtaXRDb21tYW5kT3V0cHV0LFxuICAgICAgICAgICAgICAgICAgICBmdWxmaWxXaXRoUHJvbXB0OiBmdWxmaWxXaXRoUHJvbXB0LFxuICAgICAgICAgICAgICAgICAgICBvbkZpbmlzaDogYXN5bmMgKG91dHB1dCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50Q29tbWFuZCA9IG51bGw7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uIF9mdWxmaWwobm9Qcm9tcHQ6IHN0cmluZyl7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYoZnVsZmlsV2l0aFByb21wdCl7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZ1bGZpbChvdXRwdXQpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2V7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZ1bGZpbChub1Byb21wdCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgbGFzdEVuZE9mTGluZVBvcyA9IG91dHB1dC5sYXN0SW5kZXhPZihvcy5FT0wpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZihsYXN0RW5kT2ZMaW5lUG9zID09IC0xKXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKmkuZS4gbm8gb3V0cHV0IGhhcyBiZWVuIHByb2R1Y2VkKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZihlbWl0U3RhdHVzQ2hhbmdlcyl7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZW1pdFN0YXR1c0NoYW5nZXMob3V0cHV0LCBcIlwiLCBlbWl0SGlzdG9yeUxlbmd0aCkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBfZnVsZmlsKFwiXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNle1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBfZnVsZmlsKFwiXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2V7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHByb21wdEJlZ2luUG9zaXRpb24gPSBsYXN0RW5kT2ZMaW5lUG9zICsgb3MuRU9MLmxlbmd0aDtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmKGVtaXRTdGF0dXNDaGFuZ2VzKXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5lbWl0U3RhdHVzQ2hhbmdlcyhvdXRwdXQuc2xpY2UocHJvbXB0QmVnaW5Qb3NpdGlvbiwgb3V0cHV0Lmxlbmd0aCksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvdXRwdXQuc2xpY2UoMCwgbGFzdEVuZE9mTGluZVBvcyksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbWl0SGlzdG9yeUxlbmd0aCkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBfZnVsZmlsKG91dHB1dC5zbGljZSgwLCBsYXN0RW5kT2ZMaW5lUG9zKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2V7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIF9mdWxmaWwob3V0cHV0LnNsaWNlKDAsIGxhc3RFbmRPZkxpbmVQb3MpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IGN1cnJlbnRQcm9taXNlO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZih0aGlzLmNvbW1hbmRzLmxlbmd0aCAhPT0gMCAmJiB0aGlzLmN1cnJlbnRDb21tYW5kID09PSBudWxsKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNoaWZ0QW5kUnVuQ29tbWFuZCgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIHRoaXMuY29tbWFuZHMucHVzaChjb21tYW5kKTtcblxuICAgICAgICAgICAgICAgIGlmKHRoaXMuY3VycmVudENvbW1hbmQgPT09IG51bGwpe1xuICAgICAgICAgICAgICAgICAgICBzaGlmdEFuZFJ1bkNvbW1hbmQoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KVxuICAgICAgICB9XG4gICAgfVxufVxuXG5leHBvcnQgPSBHSENJRGVidWdcbiJdfQ==