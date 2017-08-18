"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const cp = require("child_process");
const os = require("os");
const path = require("path");
const atomAPI = require("atom");
class GHCIDebug {
    constructor(ghciCommand = 'ghci', ghciArgs = [], folder) {
        this.emitter = new atomAPI.Emitter();
        this.ignoreErrors = false;
        this.currentStderrOutput = '';
        this.currentCommandBuffer = '';
        this.commands = [];
        this.commandFinishedString = 'command_finish_o4uB1whagteqE8xBq9oq';
        this.ghciCmd = cp.spawn(ghciCommand, ghciArgs, { cwd: folder, shell: true });
        this.ghciCmd.on('exit', () => {
            this.emitter.emit('debug-finished', undefined);
        });
        this.stdout = this.ghciCmd.stdout;
        this.stdin = this.ghciCmd.stdin;
        this.stderr = this.ghciCmd.stderr;
        this.stdout.on('readable', () => this.onStdoutReadable());
        this.stderr.on('readable', () => this.onStderrReadable());
        this.addReadyEvent();
        this.startText = this.run(`:set prompt "%s> ${this.commandFinishedString}"`, false, false, false, true);
    }
    addReadyEvent() {
        const eventSubs = [
            'paused-on-exception',
            'line-changed',
            'debug-finished',
        ];
        for (const eventName of eventSubs) {
            this.emitter.on(eventName, () => this.emitter.emit('ready', undefined));
        }
    }
    destroy() {
        this.stop();
    }
    loadModule(name) {
        const cwd = path.dirname(name);
        this.run(`:cd ${cwd}`);
        this.run(`:load ${name}`);
    }
    setExceptionBreakLevel(level) {
        this.run(':unset -fbreak-on-exception');
        this.run(':unset -fbreak-on-error');
        if (level === 'exceptions') {
            this.run(':set -fbreak-on-exception');
        }
        else if (level === 'errors') {
            this.run(':set -fbreak-on-error');
        }
    }
    addBreakpoint(breakpoint) {
        if (typeof breakpoint === 'string') {
            this.run(`:break ${breakpoint}`);
        }
        else {
            this.run(`:break ${breakpoint.file} ${breakpoint.line}`);
        }
    }
    resolveExpression(expression) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!expression.trim()) {
                return;
            }
            if (expression.indexOf('\n') !== -1) {
                return;
            }
            const getExpression = (ghciOutput, variable) => {
                const matchResult = ghciOutput.match(/[^ ]* = (.*)/);
                if (!matchResult) {
                    return;
                }
                return matchResult[1];
            };
            this.ignoreErrors = true;
            try {
                const printingResult = getExpression(yield this.run(`:print ${expression}`, false, false, false), expression);
                if (printingResult !== undefined) {
                    return printingResult;
                }
                let tempVarNum = 0;
                let potentialTempVar;
                do {
                    potentialTempVar = getExpression(yield this.run(`:print temp${tempVarNum}`, false, false, false), `temp${tempVarNum}`);
                    tempVarNum += 1;
                } while (potentialTempVar !== undefined);
                yield this.run(`let temp${tempVarNum} = ${expression}`, false, false, false);
                return getExpression(yield this.run(`:print temp${tempVarNum}`, false, false, false), `temp${tempVarNum}`);
            }
            finally {
                this.ignoreErrors = false;
            }
        });
    }
    forward() {
        this.run(':forward', true);
    }
    back() {
        this.run(':back', true);
    }
    step() {
        this.run(':step', true, true);
    }
    stop() {
        this.run(':quit');
        setTimeout(() => {
            this.ghciCmd.kill();
        }, 3000);
    }
    continue() {
        this.run(':continue', true);
    }
    addedAllListeners() {
        return __awaiter(this, void 0, void 0, function* () {
            this.startText.then((text) => {
                const firstPrompt = text.indexOf('> ');
                this.emitter.emit('console-output', text.slice(0, firstPrompt + 2));
            });
        });
    }
    startDebug(moduleName) {
        return __awaiter(this, void 0, void 0, function* () {
            moduleName = moduleName || 'main';
            yield this.run(':trace ' + moduleName, true, true);
        });
    }
    getBindings() {
        return __awaiter(this, void 0, void 0, function* () {
            const outputStr = yield this.run(':show bindings', false, false, false);
            return outputStr.split(os.EOL);
        });
    }
    getHistoryLength() {
        return __awaiter(this, void 0, void 0, function* () {
            const historyQuery = yield this.run(':history 100', false, false, false);
            const regex = /-(\d*).*(?:\n|\r|\r\n)<end of history>$/;
            const matchResult = historyQuery.match(regex);
            if (!matchResult) {
                if (historyQuery.slice(-3) === '...') {
                    return Infinity;
                }
                else {
                    return 0;
                }
            }
            else {
                return parseInt(matchResult[1], 10);
            }
        });
    }
    parsePrompt(stdOutput) {
        const patterns = [{
                pattern: /\[(?:[-\d]*: )?(.*):\((\d+),(\d+)\)-\((\d+),(\d+)\).*\].*> $/,
                func: (match) => ({
                    filename: match[1],
                    range: [[parseInt(match[2], 10) - 1, parseInt(match[3], 10) - 1],
                        [parseInt(match[4], 10), parseInt(match[5], 10)]]
                })
            }, {
                pattern: /\[(?:[-\d]*: )?(.*):(\d*):(\d*)-(\d*)\].*> $/,
                func: (match) => ({
                    filename: match[1],
                    range: [[parseInt(match[2], 10) - 1, parseInt(match[3], 10) - 1],
                        [parseInt(match[2], 10) - 1, parseInt(match[4], 10)]]
                })
            }, {
                pattern: /\[<exception thrown>\].*> $/,
                func: () => GHCIDebug.pausedOnError
            }, {
                pattern: /.*> $/,
                func: () => GHCIDebug.finishedDebugging
            }];
        for (const pattern of patterns) {
            const matchResult = stdOutput.match(pattern.pattern);
            if (matchResult) {
                return pattern.func(matchResult);
            }
        }
        throw new Error('Cannot read prompt: \n' + stdOutput);
    }
    emitStatusChanges(prompt, mainBody, emitHistoryLength) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = this.parsePrompt(prompt);
            if (result === GHCIDebug.pausedOnError) {
                const historyLength = yield this.getHistoryLength();
                this.emitter.emit('paused-on-exception', {
                    historyLength,
                    localBindings: mainBody.split('\n').slice(1)
                });
            }
            else if (result === GHCIDebug.finishedDebugging) {
                this.emitter.emit('debug-finished', undefined);
            }
            else {
                const breakInfo = result;
                breakInfo.localBindings = yield this.getBindings();
                if (emitHistoryLength) {
                    breakInfo.historyLength = yield this.getHistoryLength();
                }
                this.emitter.emit('line-changed', breakInfo);
            }
        });
    }
    onStderrReadable() {
        const stderrOutput = this.stderr.read();
        if (!stderrOutput || this.ignoreErrors) {
            return;
        }
        this.emitter.emit('error', stderrOutput.toString());
        if (this.currentStderrOutput === '') {
            const disp = this.emitter.on('ready', () => {
                this.emitter.emit('error-completed', this.currentStderrOutput);
                this.currentStderrOutput = '';
                disp.dispose();
            });
        }
        this.currentStderrOutput += stderrOutput.toString();
    }
    onStdoutReadable() {
        const currentString = (this.stdout.read() || '').toString();
        this.currentCommandBuffer += currentString;
        const finishStringPosition = this.currentCommandBuffer.search(this.commandFinishedString);
        if (finishStringPosition !== -1) {
            const outputString = this.currentCommandBuffer.slice(0, finishStringPosition);
            if (this.currentCommand) {
                if (this.currentCommand.emitCommandOutput) {
                    this.emitter.emit('console-output', outputString);
                }
                this.currentCommand.onFinish(outputString);
            }
            this.currentCommandBuffer = this.currentCommandBuffer.slice(finishStringPosition + this.commandFinishedString.length);
            this.onStdoutReadable();
        }
    }
    run(commandText, emitStatusChanges = false, emitHistoryLength = false, emitCommandOutput = true, fulfilWithPrompt = false) {
        return __awaiter(this, void 0, void 0, function* () {
            const shiftAndRunCommand = () => {
                const command = this.commands.shift();
                this.currentCommand = command;
                if (command) {
                    if (command.emitCommandOutput) {
                        this.emitter.emit('command-issued', command.text);
                    }
                    this.stdin.write(command.text + os.EOL);
                }
            };
            let currentPromise;
            return currentPromise = new Promise((fulfil) => {
                const command = {
                    text: commandText,
                    emitCommandOutput,
                    fulfilWithPrompt,
                    onFinish: (output) => __awaiter(this, void 0, void 0, function* () {
                        this.currentCommand = undefined;
                        function _fulfil(noPrompt) {
                            if (fulfilWithPrompt) {
                                fulfil(output);
                            }
                            else {
                                fulfil(noPrompt);
                            }
                        }
                        const lastEndOfLinePos = output.lastIndexOf(os.EOL);
                        if (lastEndOfLinePos === -1) {
                            if (emitStatusChanges) {
                                this.emitStatusChanges(output, '', emitHistoryLength).then(() => {
                                    _fulfil('');
                                });
                            }
                            else {
                                _fulfil('');
                            }
                        }
                        else {
                            const promptBeginPosition = lastEndOfLinePos + os.EOL.length;
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
                        if (this.commands.length !== 0 && this.currentCommand === undefined) {
                            shiftAndRunCommand();
                        }
                    })
                };
                this.commands.push(command);
                if (this.currentCommand === undefined) {
                    shiftAndRunCommand();
                }
            });
        });
    }
}
GHCIDebug.pausedOnError = Symbol('Paused on Error');
GHCIDebug.finishedDebugging = Symbol('Finished debugging');
exports.GHCIDebug = GHCIDebug;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiR0hDSURlYnVnLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2xpYi9HSENJRGVidWcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQUFBLG9DQUFvQztBQUVwQyx5QkFBeUI7QUFDekIsNkJBQTZCO0FBQzdCLGdDQUFnQztBQXFCaEM7SUErQ0ksWUFBYSxXQUFXLEdBQUUsTUFBTSxFQUFFLFdBQXFCLEVBQUUsRUFBRSxNQUFlO1FBYm5FLFlBQU8sR0FTVCxJQUFJLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQTtRQWtPbEIsaUJBQVksR0FBRyxLQUFLLENBQUE7UUFDcEIsd0JBQW1CLEdBQUcsRUFBRSxDQUFBO1FBb0J4Qix5QkFBb0IsR0FBRyxFQUFFLENBQUE7UUFDekIsYUFBUSxHQUFHLEVBQWUsQ0FBQTtRQUUxQiwwQkFBcUIsR0FBRyxxQ0FBcUMsQ0FBQTtRQXBQakUsSUFBSSxDQUFDLE9BQU8sR0FBRyxFQUFFLENBQUMsS0FBSyxDQUFDLFdBQVcsRUFBRSxRQUFRLEVBQUUsRUFBQyxHQUFHLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUMsQ0FBQyxDQUFBO1FBRTFFLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLE1BQU0sRUFBRTtZQUNwQixJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxTQUFTLENBQUMsQ0FBQTtRQUNsRCxDQUFDLENBQUMsQ0FBQTtRQUVGLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUE7UUFDakMsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQTtRQUMvQixJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFBO1FBQ2pDLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLFVBQVUsRUFBRSxNQUFNLElBQUksQ0FBQyxn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LENBQUMsaUJBQWlCLENBQUMsQ0FBQTtBQUN6QywyQkFBaUIsR0FBRyxNQUFNLENBQUMsb0JBQW9CLENBQUMsQ0FBQTtBQW5OM0QsOEJBMllDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGNwID0gcmVxdWlyZSgnY2hpbGRfcHJvY2VzcycpXG5pbXBvcnQgc3RyZWFtID0gcmVxdWlyZSgnc3RyZWFtJylcbmltcG9ydCBvcyA9IHJlcXVpcmUoJ29zJylcbmltcG9ydCBwYXRoID0gcmVxdWlyZSgncGF0aCcpXG5pbXBvcnQgYXRvbUFQSSA9IHJlcXVpcmUoJ2F0b20nKVxuXG5leHBvcnQgaW50ZXJmYWNlIEJyZWFrSW5mbyB7XG4gICAgZmlsZW5hbWU6IHN0cmluZ1xuICAgIHJhbmdlOiBbW251bWJlciwgbnVtYmVyXSwgW251bWJlciwgbnVtYmVyXV1cbiAgICBoaXN0b3J5TGVuZ3RoPzogbnVtYmVyXG4gICAgbG9jYWxCaW5kaW5nczogc3RyaW5nW11cbn1cblxuZXhwb3J0IGludGVyZmFjZSBFeGNlcHRpb25JbmZvIHtcbiAgICBoaXN0b3J5TGVuZ3RoOiBudW1iZXJcbiAgICBsb2NhbEJpbmRpbmdzOiBzdHJpbmdbXVxufVxuXG5pbnRlcmZhY2UgQ29tbWFuZCB7XG4gICAgdGV4dDogc3RyaW5nXG4gICAgZW1pdENvbW1hbmRPdXRwdXQ6IGJvb2xlYW5cbiAgICBmdWxmaWxXaXRoUHJvbXB0OiBib29sZWFuXG4gICAgb25GaW5pc2g6IChvdXRwdXQ6IHN0cmluZykgPT4gYW55XG59XG5cbmV4cG9ydCBjbGFzcyBHSENJRGVidWcge1xuICAgIHByaXZhdGUgZ2hjaUNtZDogY3AuQ2hpbGRQcm9jZXNzXG4gICAgc3Rkb3V0OiBzdHJlYW0uUmVhZGFibGVcbiAgICBzdGRpbjogc3RyZWFtLldyaXRhYmxlXG4gICAgc3RkZXJyOiBzdHJlYW0uUmVhZGFibGVcblxuICAgIC8qKiBFdmVudCBIYW5kbGVyXG4gICAgICAqXG4gICAgICAqIEV2ZW50czpcbiAgICAgICpcbiAgICAgICogcmVhZHk6ICgpXG4gICAgICAqICAgICBFbW1pdGVkIHdoZW4gZ2hjaSBoYXMganVzdCBzdG9wcGVkIGV4ZWN1dGluZyBhIGNvbW1hbmRcbiAgICAgICpcbiAgICAgICogcGF1c2VkLW9uLWV4Y2VwdGlvbjogKGluZm86IEV4Y2VwdGlvbkluZm8pXG4gICAgICAqICAgICBFbW1pdGVkIHdoZW4gdGhlIGRlYnVnZ2VyIGlzIGF0IGFuIGV4Y2VwdGlvblxuICAgICAgKlxuICAgICAgKiBlcnJvcjogKHRleHQ6IHN0cmluZylcbiAgICAgICogICAgIEVtbWl0ZWQgd2hlbiBzdGRlcnIgaGFzIGlucHV0XG4gICAgICAqXG4gICAgICAqIGVycm9yLWNvbXBsZXRlZDogKHRleHQ6IHN0cmluZylcbiAgICAgICogICAgIEVtbWl0ZWQgd2hlbiBnaGNpIHJlcG9ydHMgYW4gZXJyb3IgZm9yIGEgZ2l2ZW4gY29tbWFuZFxuICAgICAgKlxuICAgICAgKiBsaW5lLWNoYW5nZWQ6IChpbmZvOiBCcmVha0luZm8pXG4gICAgICAqICAgICBFbW1pdGVkIHdoZW4gdGhlIGxpbmUgdGhhdCB0aGUgZGVidWdnZXIgaXMgb24gY2hhbmdlc1xuICAgICAgKlxuICAgICAgKiBkZWJ1Zy1maW5pc2hlZDogKHZvaWQpXG4gICAgICAqICAgICBFbW1pdGVkIHdoZW4gdGhlIGRlYnVnZ2VyIGhhcyByZWFjaGVkIHRoZSBlbmQgb2YgdGhlIHByb2dyYW1cbiAgICAgICpcbiAgICAgICogY29uc29sZS1vdXRwdXQ6IChvdXRwdXQ6IHN0cmluZylcbiAgICAgICogICAgIEVtbWl0ZWQgd2hlbiB0aGUgZ2hjaSBoYXMgb3V0cHV0ZWQgc29tZXRoaW5nIHRvIHN0ZG91dCwgZXhjbHVkaW5nIHRoZSBleHRyYSBwcm9tcHRcbiAgICAgICpcbiAgICAgICogY29tbWFuZC1pc3N1ZWQ6IChjb21tYW5kOiBzdHJpbmcpXG4gICAgICAqICAgICBFbW1pdGVkIHdoZW4gYSBjb21tYW5kIGhhcyBiZWVuIGV4ZWN1dGVkXG4gICAgICAqL1xuICAgIHB1YmxpYyBlbWl0dGVyOiBhdG9tQVBJLlRFbWl0dGVyPHtcbiAgICAgICdwYXVzZWQtb24tZXhjZXB0aW9uJzogRXhjZXB0aW9uSW5mb1xuICAgICAgJ3JlYWR5JzogRXhjZXB0aW9uSW5mbyB8IHVuZGVmaW5lZFxuICAgICAgJ2Vycm9yJzogc3RyaW5nXG4gICAgICAnZXJyb3ItY29tcGxldGVkJzogc3RyaW5nXG4gICAgICAnbGluZS1jaGFuZ2VkJzogQnJlYWtJbmZvXG4gICAgICAnZGVidWctZmluaXNoZWQnOiB1bmRlZmluZWRcbiAgICAgICdjb25zb2xlLW91dHB1dCc6IHN0cmluZ1xuICAgICAgJ2NvbW1hbmQtaXNzdWVkJzogc3RyaW5nXG4gICAgfT4gPSBuZXcgYXRvbUFQSS5FbWl0dGVyKClcblxuICAgIHByaXZhdGUgc3RhcnRUZXh0OiBQcm9taXNlPHN0cmluZz5cblxuICAgIGNvbnN0cnVjdG9yIChnaGNpQ29tbWFuZD0gJ2doY2knLCBnaGNpQXJnczogc3RyaW5nW10gPSBbXSwgZm9sZGVyPzogc3RyaW5nKSB7XG5cbiAgICAgICAgdGhpcy5naGNpQ21kID0gY3Auc3Bhd24oZ2hjaUNvbW1hbmQsIGdoY2lBcmdzLCB7Y3dkOiBmb2xkZXIsIHNoZWxsOiB0cnVlfSlcblxuICAgICAgICB0aGlzLmdoY2lDbWQub24oJ2V4aXQnLCAoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLmVtaXR0ZXIuZW1pdCgnZGVidWctZmluaXNoZWQnLCB1bmRlZmluZWQpXG4gICAgICAgIH0pXG5cbiAgICAgICAgdGhpcy5zdGRvdXQgPSB0aGlzLmdoY2lDbWQuc3Rkb3V0XG4gICAgICAgIHRoaXMuc3RkaW4gPSB0aGlzLmdoY2lDbWQuc3RkaW5cbiAgICAgICAgdGhpcy5zdGRlcnIgPSB0aGlzLmdoY2lDbWQuc3RkZXJyXG4gICAgICAgIHRoaXMuc3Rkb3V0Lm9uKCdyZWFkYWJsZScsICgpID0+IHRoaXMub25TdGRvdXRSZWFkYWJsZSgpKVxuICAgICAgICB0aGlzLnN0ZGVyci5vbigncmVhZGFibGUnLCAoKSA9PiB0aGlzLm9uU3RkZXJyUmVhZGFibGUoKSlcblxuICAgICAgICB0aGlzLmFkZFJlYWR5RXZlbnQoKVxuXG4gICAgICAgIHRoaXMuc3RhcnRUZXh0ID0gdGhpcy5ydW4oYDpzZXQgcHJvbXB0IFwiJXM+ICR7dGhpcy5jb21tYW5kRmluaXNoZWRTdHJpbmd9XCJgLCBmYWxzZSwgZmFsc2UsIGZhbHNlLCB0cnVlKVxuICAgIH1cblxuICAgIHByaXZhdGUgYWRkUmVhZHlFdmVudCAoKSB7XG4gICAgICAgIGNvbnN0IGV2ZW50U3VicyA9IFtcbiAgICAgICAgICAgICdwYXVzZWQtb24tZXhjZXB0aW9uJyxcbiAgICAgICAgICAgICdsaW5lLWNoYW5nZWQnLFxuICAgICAgICAgICAgJ2RlYnVnLWZpbmlzaGVkJyxcbiAgICAgICAgXVxuXG4gICAgICAgIGZvciAoY29uc3QgZXZlbnROYW1lIG9mIGV2ZW50U3Vicyl7XG4gICAgICAgICAgICAodGhpcy5lbWl0dGVyLm9uIGFzIGFueSkoZXZlbnROYW1lLCAoKSA9PiB0aGlzLmVtaXR0ZXIuZW1pdCgncmVhZHknLCB1bmRlZmluZWQpKVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHVibGljIGRlc3Ryb3kgKCkge1xuICAgICAgICB0aGlzLnN0b3AoKVxuICAgIH1cblxuICAgIHB1YmxpYyBsb2FkTW9kdWxlIChuYW1lOiBzdHJpbmcpIHtcbiAgICAgICAgY29uc3QgY3dkID0gcGF0aC5kaXJuYW1lKG5hbWUpXG5cbiAgICAgICAgdGhpcy5ydW4oYDpjZCAke2N3ZH1gKVxuICAgICAgICB0aGlzLnJ1bihgOmxvYWQgJHtuYW1lfWApXG4gICAgfVxuXG4gICAgcHVibGljIHNldEV4Y2VwdGlvbkJyZWFrTGV2ZWwgKGxldmVsOiBFeGNlcHRpb25CcmVha0xldmVscykge1xuICAgICAgICB0aGlzLnJ1bignOnVuc2V0IC1mYnJlYWstb24tZXhjZXB0aW9uJylcbiAgICAgICAgdGhpcy5ydW4oJzp1bnNldCAtZmJyZWFrLW9uLWVycm9yJylcblxuICAgICAgICBpZiAobGV2ZWwgPT09ICdleGNlcHRpb25zJykge1xuICAgICAgICAgICAgdGhpcy5ydW4oJzpzZXQgLWZicmVhay1vbi1leGNlcHRpb24nKVxuICAgICAgICB9IGVsc2UgaWYgKGxldmVsID09PSAnZXJyb3JzJykge1xuICAgICAgICAgICAgdGhpcy5ydW4oJzpzZXQgLWZicmVhay1vbi1lcnJvcicpXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwdWJsaWMgYWRkQnJlYWtwb2ludCAoYnJlYWtwb2ludDogQnJlYWtwb2ludCB8IHN0cmluZykge1xuICAgICAgICBpZiAodHlwZW9mIGJyZWFrcG9pbnQgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICB0aGlzLnJ1bihgOmJyZWFrICR7YnJlYWtwb2ludH1gKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5ydW4oYDpicmVhayAke2JyZWFrcG9pbnQuZmlsZX0gJHticmVha3BvaW50LmxpbmV9YClcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKiByZXNvbHZlZCB0aGUgZ2l2ZW4gZXhwcmVzc2lvbiB1c2luZyA6cHJpbnQsIHJldHVybnMgbnVsbCBpZiBpdCBpcyBpbnZhbGlkXG4gICAgKi9cbiAgICBwdWJsaWMgYXN5bmMgcmVzb2x2ZUV4cHJlc3Npb24gKGV4cHJlc3Npb246IHN0cmluZykge1xuICAgICAgICBpZiAoISBleHByZXNzaW9uLnRyaW0oKSkge1xuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cbiAgICAgICAgLy8gZXhwcmVzc2lvbnMgY2FuJ3QgaGF2ZSBuZXcgbGluZXNcbiAgICAgICAgaWYgKGV4cHJlc3Npb24uaW5kZXhPZignXFxuJykgIT09IC0xKSB7XG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGdldEV4cHJlc3Npb24gPSAoZ2hjaU91dHB1dDogc3RyaW5nLCB2YXJpYWJsZTogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBtYXRjaFJlc3VsdCA9IGdoY2lPdXRwdXQubWF0Y2goL1teIF0qID0gKC4qKS8pXG4gICAgICAgICAgICBpZiAoISBtYXRjaFJlc3VsdCkgeyByZXR1cm4gfVxuICAgICAgICAgICAgcmV0dXJuIG1hdGNoUmVzdWx0WzFdXG4gICAgICAgIH1cblxuICAgICAgICAvLyBmb3IgdGhlIGNvZGUgYmVsb3csIGlnbm9yZSBlcnJvcnNcbiAgICAgICAgdGhpcy5pZ25vcmVFcnJvcnMgPSB0cnVlXG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIHRyeSBwcmludGluZyBleHByZXNzaW9uXG4gICAgICAgICAgICBjb25zdCBwcmludGluZ1Jlc3VsdCA9IGdldEV4cHJlc3Npb24oXG4gICAgICAgICAgICAgIGF3YWl0IHRoaXMucnVuKGA6cHJpbnQgJHtleHByZXNzaW9ufWAsIGZhbHNlLCBmYWxzZSwgZmFsc2UpLCBleHByZXNzaW9uKVxuICAgICAgICAgICAgaWYgKHByaW50aW5nUmVzdWx0ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcHJpbnRpbmdSZXN1bHRcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gaWYgdGhhdCBmYWlscyBhc3NpZ24gaXQgdG8gYSB0ZW1wb3JhcnkgdmFyaWFibGUgYW5kIGV2YWx1YXRlIHRoYXRcbiAgICAgICAgICAgIGxldCB0ZW1wVmFyTnVtID0gMFxuICAgICAgICAgICAgbGV0IHBvdGVudGlhbFRlbXBWYXI6IHN0cmluZyB8IHVuZGVmaW5lZFxuICAgICAgICAgICAgZG8ge1xuICAgICAgICAgICAgICAgIHBvdGVudGlhbFRlbXBWYXIgPSBnZXRFeHByZXNzaW9uKFxuICAgICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5ydW4oYDpwcmludCB0ZW1wJHt0ZW1wVmFyTnVtfWAsIGZhbHNlLCBmYWxzZSwgZmFsc2UpLCBgdGVtcCR7dGVtcFZhck51bX1gKVxuICAgICAgICAgICAgICAgIHRlbXBWYXJOdW0gKz0gMVxuICAgICAgICAgICAgfSB3aGlsZSAocG90ZW50aWFsVGVtcFZhciAhPT0gdW5kZWZpbmVkKVxuXG4gICAgICAgICAgICBhd2FpdCB0aGlzLnJ1bihgbGV0IHRlbXAke3RlbXBWYXJOdW19ID0gJHtleHByZXNzaW9ufWAsIGZhbHNlLCBmYWxzZSwgZmFsc2UpXG4gICAgICAgICAgICByZXR1cm4gZ2V0RXhwcmVzc2lvbihhd2FpdCB0aGlzLnJ1bihgOnByaW50IHRlbXAke3RlbXBWYXJOdW19YCwgZmFsc2UsIGZhbHNlLCBmYWxzZSksIGB0ZW1wJHt0ZW1wVmFyTnVtfWApXG4gICAgICAgIH0gZmluYWxseSB7XG4gICAgICAgICAgICB0aGlzLmlnbm9yZUVycm9ycyA9IGZhbHNlXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwdWJsaWMgZm9yd2FyZCAoKSB7XG4gICAgICAgIHRoaXMucnVuKCc6Zm9yd2FyZCcsIHRydWUpXG4gICAgfVxuXG4gICAgcHVibGljIGJhY2sgKCkge1xuICAgICAgICB0aGlzLnJ1bignOmJhY2snLCB0cnVlKVxuICAgIH1cblxuICAgIHB1YmxpYyBzdGVwICgpIHtcbiAgICAgICAgdGhpcy5ydW4oJzpzdGVwJywgdHJ1ZSwgdHJ1ZSlcbiAgICB9XG5cbiAgICBwdWJsaWMgc3RvcCAoKSB7XG4gICAgICAgIHRoaXMucnVuKCc6cXVpdCcpXG4gICAgICAgIHNldFRpbWVvdXQoXG4gICAgICAgICgpID0+IHtcbiAgICAgICAgICB0aGlzLmdoY2lDbWQua2lsbCgpXG4gICAgICAgIH0sXG4gICAgICAgIDMwMDApXG4gICAgfVxuXG4gICAgcHVibGljIGNvbnRpbnVlICgpIHtcbiAgICAgICAgdGhpcy5ydW4oJzpjb250aW51ZScsIHRydWUpXG4gICAgfVxuXG4gICAgcHVibGljIGFzeW5jIGFkZGVkQWxsTGlzdGVuZXJzICgpIHtcbiAgICAgICAgdGhpcy5zdGFydFRleHQudGhlbigodGV4dCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgZmlyc3RQcm9tcHQgPSB0ZXh0LmluZGV4T2YoJz4gJylcbiAgICAgICAgICAgIHRoaXMuZW1pdHRlci5lbWl0KCdjb25zb2xlLW91dHB1dCcsIHRleHQuc2xpY2UoMCwgZmlyc3RQcm9tcHQgKyAyKSlcbiAgICAgICAgfSlcbiAgICB9XG5cbiAgICBhc3luYyBzdGFydERlYnVnIChtb2R1bGVOYW1lPzogc3RyaW5nKSB7XG4gICAgICAgIG1vZHVsZU5hbWUgPSBtb2R1bGVOYW1lIHx8ICdtYWluJ1xuICAgICAgICBhd2FpdCB0aGlzLnJ1bignOnRyYWNlICcgKyBtb2R1bGVOYW1lLCB0cnVlLCB0cnVlKVxuICAgIH1cblxuICAgIGFzeW5jIGdldEJpbmRpbmdzICgpIHtcbiAgICAgICAgY29uc3Qgb3V0cHV0U3RyID0gYXdhaXQgdGhpcy5ydW4oJzpzaG93IGJpbmRpbmdzJywgZmFsc2UsIGZhbHNlLCBmYWxzZSlcbiAgICAgICAgcmV0dXJuIG91dHB1dFN0ci5zcGxpdChvcy5FT0wpXG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBnZXRIaXN0b3J5TGVuZ3RoICgpIHtcbiAgICAgICAgY29uc3QgaGlzdG9yeVF1ZXJ5ID0gYXdhaXQgdGhpcy5ydW4oJzpoaXN0b3J5IDEwMCcsIGZhbHNlLCBmYWxzZSwgZmFsc2UpXG4gICAgICAgIGNvbnN0IHJlZ2V4ID0gLy0oXFxkKikuKig/OlxcbnxcXHJ8XFxyXFxuKTxlbmQgb2YgaGlzdG9yeT4kL1xuXG4gICAgICAgIGNvbnN0IG1hdGNoUmVzdWx0ID0gaGlzdG9yeVF1ZXJ5Lm1hdGNoKHJlZ2V4KVxuICAgICAgICBpZiAoISBtYXRjaFJlc3VsdCkge1xuICAgICAgICAgIGlmIChoaXN0b3J5UXVlcnkuc2xpY2UoLTMpID09PSAnLi4uJykge1xuICAgICAgICAgICAgcmV0dXJuIEluZmluaXR5IC8vIGhpc3RvcnkgaXMgdmVyeSBsb25nXG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiAwXG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHBhcnNlSW50KG1hdGNoUmVzdWx0WzFdLCAxMClcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHN0YXRpYyBwYXVzZWRPbkVycm9yID0gU3ltYm9sKCdQYXVzZWQgb24gRXJyb3InKVxuICAgIHN0YXRpYyBmaW5pc2hlZERlYnVnZ2luZyA9IFN5bWJvbCgnRmluaXNoZWQgZGVidWdnaW5nJylcblxuICAgIHByaXZhdGUgcGFyc2VQcm9tcHQgKHN0ZE91dHB1dDogc3RyaW5nKTogQnJlYWtJbmZvIHwgU3ltYm9sIHtcbiAgICAgICAgY29uc3QgcGF0dGVybnMgPSBbe1xuICAgICAgICAgICAgcGF0dGVybjogL1xcWyg/OlstXFxkXSo6ICk/KC4qKTpcXCgoXFxkKyksKFxcZCspXFwpLVxcKChcXGQrKSwoXFxkKylcXCkuKlxcXS4qPiAkLyxcbiAgICAgICAgICAgIGZ1bmM6IChtYXRjaCkgPT4gKHtcbiAgICAgICAgICAgICAgICBmaWxlbmFtZTogbWF0Y2hbMV0sXG4gICAgICAgICAgICAgICAgcmFuZ2U6IFtbcGFyc2VJbnQobWF0Y2hbMl0sIDEwKSAtIDEsIHBhcnNlSW50KG1hdGNoWzNdLCAxMCkgLSAxXSxcbiAgICAgICAgICAgICAgICAgICAgW3BhcnNlSW50KG1hdGNoWzRdLCAxMCksIHBhcnNlSW50KG1hdGNoWzVdLCAxMCldXVxuICAgICAgICAgICAgfSlcbiAgICAgICAgfSwge1xuICAgICAgICAgICAgcGF0dGVybjogL1xcWyg/OlstXFxkXSo6ICk/KC4qKTooXFxkKik6KFxcZCopLShcXGQqKVxcXS4qPiAkLyxcbiAgICAgICAgICAgIGZ1bmM6IChtYXRjaCkgPT4gKHtcbiAgICAgICAgICAgICAgICAgICAgZmlsZW5hbWU6IG1hdGNoWzFdLFxuICAgICAgICAgICAgICAgICAgICByYW5nZTogW1twYXJzZUludChtYXRjaFsyXSwgMTApIC0gMSwgcGFyc2VJbnQobWF0Y2hbM10sIDEwKSAtIDFdLFxuICAgICAgICAgICAgICAgICAgICAgICAgW3BhcnNlSW50KG1hdGNoWzJdLCAxMCkgLSAxLCBwYXJzZUludChtYXRjaFs0XSwgMTApXV1cbiAgICAgICAgICAgIH0pXG4gICAgICAgIH0sIHtcbiAgICAgICAgICAgIHBhdHRlcm46IC9cXFs8ZXhjZXB0aW9uIHRocm93bj5cXF0uKj4gJC8sXG4gICAgICAgICAgICBmdW5jOiAoKSA9PiBHSENJRGVidWcucGF1c2VkT25FcnJvclxuICAgICAgICB9LCB7XG4gICAgICAgICAgICBwYXR0ZXJuOiAvLio+ICQvLFxuICAgICAgICAgICAgZnVuYzogKCkgPT4gR0hDSURlYnVnLmZpbmlzaGVkRGVidWdnaW5nXG4gICAgICAgIH1dIGFzIEFycmF5PHtwYXR0ZXJuOiBSZWdFeHA7IGZ1bmM6IChtYXRjaDogc3RyaW5nW10pID0+IEJyZWFrSW5mbyB8IFN5bWJvbH0+XG4gICAgICAgIGZvciAoY29uc3QgcGF0dGVybiBvZiBwYXR0ZXJucyl7XG4gICAgICAgICAgICBjb25zdCBtYXRjaFJlc3VsdCA9IHN0ZE91dHB1dC5tYXRjaChwYXR0ZXJuLnBhdHRlcm4pXG4gICAgICAgICAgICBpZiAobWF0Y2hSZXN1bHQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGF0dGVybi5mdW5jKG1hdGNoUmVzdWx0KVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignQ2Fubm90IHJlYWQgcHJvbXB0OiBcXG4nICsgc3RkT3V0cHV0KVxuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgZW1pdFN0YXR1c0NoYW5nZXMgKHByb21wdDogc3RyaW5nLCBtYWluQm9keTogc3RyaW5nLCBlbWl0SGlzdG9yeUxlbmd0aDogYm9vbGVhbikge1xuICAgICAgICBjb25zdCByZXN1bHQgPSB0aGlzLnBhcnNlUHJvbXB0KHByb21wdClcblxuICAgICAgICBpZiAocmVzdWx0ID09PSBHSENJRGVidWcucGF1c2VkT25FcnJvcikge1xuICAgICAgICAgICAgY29uc3QgaGlzdG9yeUxlbmd0aCA9IGF3YWl0IHRoaXMuZ2V0SGlzdG9yeUxlbmd0aCgpXG5cbiAgICAgICAgICAgIHRoaXMuZW1pdHRlci5lbWl0KCdwYXVzZWQtb24tZXhjZXB0aW9uJywge1xuICAgICAgICAgICAgICAgIGhpc3RvcnlMZW5ndGgsXG4gICAgICAgICAgICAgICAgbG9jYWxCaW5kaW5nczogbWFpbkJvZHkuc3BsaXQoJ1xcbicpLnNsaWNlKDEpXG4gICAgICAgICAgICB9KVxuICAgICAgICB9IGVsc2UgaWYgKHJlc3VsdCA9PT0gR0hDSURlYnVnLmZpbmlzaGVkRGVidWdnaW5nKSB7XG4gICAgICAgICAgICB0aGlzLmVtaXR0ZXIuZW1pdCgnZGVidWctZmluaXNoZWQnLCB1bmRlZmluZWQpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zdCBicmVha0luZm8gPSByZXN1bHQgYXMgQnJlYWtJbmZvXG5cbiAgICAgICAgICAgIGJyZWFrSW5mby5sb2NhbEJpbmRpbmdzID0gYXdhaXQgdGhpcy5nZXRCaW5kaW5ncygpXG5cbiAgICAgICAgICAgIGlmIChlbWl0SGlzdG9yeUxlbmd0aCkge1xuICAgICAgICAgICAgICAgIGJyZWFrSW5mby5oaXN0b3J5TGVuZ3RoID0gYXdhaXQgdGhpcy5nZXRIaXN0b3J5TGVuZ3RoKClcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy5lbWl0dGVyLmVtaXQoJ2xpbmUtY2hhbmdlZCcsIGJyZWFrSW5mbylcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgaWdub3JlRXJyb3JzID0gZmFsc2VcbiAgICBwcml2YXRlIGN1cnJlbnRTdGRlcnJPdXRwdXQgPSAnJ1xuICAgIHByaXZhdGUgb25TdGRlcnJSZWFkYWJsZSAoKSB7XG4gICAgICAgIGNvbnN0IHN0ZGVyck91dHB1dDogQnVmZmVyID0gdGhpcy5zdGRlcnIucmVhZCgpXG4gICAgICAgIGlmICghIHN0ZGVyck91dHB1dCB8fCB0aGlzLmlnbm9yZUVycm9ycykge1xuICAgICAgICAgICAgcmV0dXJuIC8vIHRoaXMgaXMgdGhlIGVuZCBvZiB0aGUgaW5wdXQgc3RyZWFtXG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmVtaXR0ZXIuZW1pdCgnZXJyb3InLCBzdGRlcnJPdXRwdXQudG9TdHJpbmcoKSlcblxuICAgICAgICBpZiAodGhpcy5jdXJyZW50U3RkZXJyT3V0cHV0ID09PSAnJykge1xuICAgICAgICAgICAgY29uc3QgZGlzcCA9IHRoaXMuZW1pdHRlci5vbigncmVhZHknLCAoKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5lbWl0dGVyLmVtaXQoJ2Vycm9yLWNvbXBsZXRlZCcsIHRoaXMuY3VycmVudFN0ZGVyck91dHB1dClcbiAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRTdGRlcnJPdXRwdXQgPSAnJ1xuICAgICAgICAgICAgICAgIGRpc3AuZGlzcG9zZSgpXG4gICAgICAgICAgICB9KVxuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5jdXJyZW50U3RkZXJyT3V0cHV0ICs9IHN0ZGVyck91dHB1dC50b1N0cmluZygpXG4gICAgfVxuXG4gICAgcHJpdmF0ZSBjdXJyZW50Q29tbWFuZEJ1ZmZlciA9ICcnXG4gICAgcHJpdmF0ZSBjb21tYW5kcyA9IFtdIGFzIENvbW1hbmRbXVxuICAgIHByaXZhdGUgY3VycmVudENvbW1hbmQ/OiBDb21tYW5kXG4gICAgcHJpdmF0ZSBjb21tYW5kRmluaXNoZWRTdHJpbmcgPSAnY29tbWFuZF9maW5pc2hfbzR1QjF3aGFndGVxRTh4QnE5b3EnXG5cbiAgICBwcml2YXRlIG9uU3Rkb3V0UmVhZGFibGUgKCkge1xuICAgICAgICBjb25zdCBjdXJyZW50U3RyaW5nID0gKHRoaXMuc3Rkb3V0LnJlYWQoKSB8fCAnJykudG9TdHJpbmcoKVxuXG4gICAgICAgIHRoaXMuY3VycmVudENvbW1hbmRCdWZmZXIgKz0gY3VycmVudFN0cmluZ1xuXG4gICAgICAgIGNvbnN0IGZpbmlzaFN0cmluZ1Bvc2l0aW9uID0gdGhpcy5jdXJyZW50Q29tbWFuZEJ1ZmZlci5zZWFyY2godGhpcy5jb21tYW5kRmluaXNoZWRTdHJpbmcpXG4gICAgICAgIGlmIChmaW5pc2hTdHJpbmdQb3NpdGlvbiAhPT0gLTEpIHtcbiAgICAgICAgICAgIGNvbnN0IG91dHB1dFN0cmluZyA9IHRoaXMuY3VycmVudENvbW1hbmRCdWZmZXIuc2xpY2UoMCwgZmluaXNoU3RyaW5nUG9zaXRpb24pXG5cbiAgICAgICAgICAgIGlmICh0aGlzLmN1cnJlbnRDb21tYW5kKSB7XG4gICAgICAgICAgICAgIGlmICh0aGlzLmN1cnJlbnRDb21tYW5kLmVtaXRDb21tYW5kT3V0cHV0KSB7XG4gICAgICAgICAgICAgICAgICB0aGlzLmVtaXR0ZXIuZW1pdCgnY29uc29sZS1vdXRwdXQnLCBvdXRwdXRTdHJpbmcpXG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRDb21tYW5kLm9uRmluaXNoKG91dHB1dFN0cmluZylcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gVGFrZSB0aGUgZmluaXNoZWQgc3RyaW5nIG9mZiB0aGUgYnVmZmVyIGFuZCBwcm9jZXNzIHRoZSBuZXh0IG91cHV0XG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRDb21tYW5kQnVmZmVyID0gdGhpcy5jdXJyZW50Q29tbWFuZEJ1ZmZlci5zbGljZShcbiAgICAgICAgICAgICAgICBmaW5pc2hTdHJpbmdQb3NpdGlvbiArIHRoaXMuY29tbWFuZEZpbmlzaGVkU3RyaW5nLmxlbmd0aClcbiAgICAgICAgICAgIHRoaXMub25TdGRvdXRSZWFkYWJsZSgpXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwdWJsaWMgYXN5bmMgcnVuIChjb21tYW5kVGV4dDogc3RyaW5nLFxuICAgICAgICAgICAgICAgICAgICAgIGVtaXRTdGF0dXNDaGFuZ2VzOiBib29sZWFuID0gZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgICAgZW1pdEhpc3RvcnlMZW5ndGg6IGJvb2xlYW4gPSBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgICBlbWl0Q29tbWFuZE91dHB1dDogYm9vbGVhbiA9IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICAgZnVsZmlsV2l0aFByb21wdDogYm9vbGVhbiA9IGZhbHNlKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICAgICAgY29uc3Qgc2hpZnRBbmRSdW5Db21tYW5kID0gKCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgY29tbWFuZCA9IHRoaXMuY29tbWFuZHMuc2hpZnQoKVxuXG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRDb21tYW5kID0gY29tbWFuZFxuXG4gICAgICAgICAgICBpZiAoY29tbWFuZCkge1xuICAgICAgICAgICAgICBpZiAoY29tbWFuZC5lbWl0Q29tbWFuZE91dHB1dCkge1xuICAgICAgICAgICAgICAgICAgdGhpcy5lbWl0dGVyLmVtaXQoJ2NvbW1hbmQtaXNzdWVkJywgY29tbWFuZC50ZXh0KVxuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgdGhpcy5zdGRpbi53cml0ZShjb21tYW5kLnRleHQgKyBvcy5FT0wpXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgY3VycmVudFByb21pc2U6IFByb21pc2U8c3RyaW5nPlxuICAgICAgICByZXR1cm4gY3VycmVudFByb21pc2UgPSBuZXcgUHJvbWlzZTxzdHJpbmc+KChmdWxmaWwpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGNvbW1hbmQ6IENvbW1hbmQgPSB7XG4gICAgICAgICAgICAgICAgdGV4dDogY29tbWFuZFRleHQsXG4gICAgICAgICAgICAgICAgZW1pdENvbW1hbmRPdXRwdXQsXG4gICAgICAgICAgICAgICAgZnVsZmlsV2l0aFByb21wdCxcbiAgICAgICAgICAgICAgICBvbkZpbmlzaDogYXN5bmMgKG91dHB1dCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRDb21tYW5kID0gdW5kZWZpbmVkXG5cbiAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gX2Z1bGZpbCAobm9Qcm9tcHQ6IHN0cmluZykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGZ1bGZpbFdpdGhQcm9tcHQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmdWxmaWwob3V0cHV0KVxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmdWxmaWwobm9Qcm9tcHQpXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBjb25zdCBsYXN0RW5kT2ZMaW5lUG9zID0gb3V0cHV0Lmxhc3RJbmRleE9mKG9zLkVPTClcblxuICAgICAgICAgICAgICAgICAgICBpZiAobGFzdEVuZE9mTGluZVBvcyA9PT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8qaS5lLiBubyBvdXRwdXQgaGFzIGJlZW4gcHJvZHVjZWQqL1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVtaXRTdGF0dXNDaGFuZ2VzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5lbWl0U3RhdHVzQ2hhbmdlcyhvdXRwdXQsICcnLCBlbWl0SGlzdG9yeUxlbmd0aCkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIF9mdWxmaWwoJycpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgX2Z1bGZpbCgnJylcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHByb21wdEJlZ2luUG9zaXRpb24gPSBsYXN0RW5kT2ZMaW5lUG9zICsgb3MuRU9MLmxlbmd0aFxuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZW1pdFN0YXR1c0NoYW5nZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmVtaXRTdGF0dXNDaGFuZ2VzKG91dHB1dC5zbGljZShwcm9tcHRCZWdpblBvc2l0aW9uLCBvdXRwdXQubGVuZ3RoKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG91dHB1dC5zbGljZSgwLCBsYXN0RW5kT2ZMaW5lUG9zKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVtaXRIaXN0b3J5TGVuZ3RoKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgX2Z1bGZpbChvdXRwdXQuc2xpY2UoMCwgbGFzdEVuZE9mTGluZVBvcykpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgX2Z1bGZpbChvdXRwdXQuc2xpY2UoMCwgbGFzdEVuZE9mTGluZVBvcykpXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBhd2FpdCBjdXJyZW50UHJvbWlzZVxuXG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLmNvbW1hbmRzLmxlbmd0aCAhPT0gMCAmJiB0aGlzLmN1cnJlbnRDb21tYW5kID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNoaWZ0QW5kUnVuQ29tbWFuZCgpXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMuY29tbWFuZHMucHVzaChjb21tYW5kKVxuXG4gICAgICAgICAgICBpZiAodGhpcy5jdXJyZW50Q29tbWFuZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgc2hpZnRBbmRSdW5Db21tYW5kKClcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICB9XG59XG4iXX0=