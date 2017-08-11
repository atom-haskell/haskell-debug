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
                return 0;
            }
            else if (historyQuery.slice(-3) === '...') {
                return Infinity;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiR0hDSURlYnVnLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2xpYi9HSENJRGVidWcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQUFBLG9DQUFvQztBQUVwQyx5QkFBeUI7QUFDekIsNkJBQTZCO0FBQzdCLGdDQUFnQztBQXFCaEM7SUErQ0ksWUFBYSxXQUFXLEdBQUUsTUFBTSxFQUFFLFdBQXFCLEVBQUUsRUFBRSxNQUFlO1FBYm5FLFlBQU8sR0FTVCxJQUFJLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQTtRQWdPbEIsaUJBQVksR0FBRyxLQUFLLENBQUE7UUFDcEIsd0JBQW1CLEdBQUcsRUFBRSxDQUFBO1FBb0J4Qix5QkFBb0IsR0FBRyxFQUFFLENBQUE7UUFDekIsYUFBUSxHQUFHLEVBQWUsQ0FBQTtRQUUxQiwwQkFBcUIsR0FBRyxxQ0FBcUMsQ0FBQTtRQWxQakUsSUFBSSxDQUFDLE9BQU8sR0FBRyxFQUFFLENBQUMsS0FBSyxDQUFDLFdBQVcsRUFBRSxRQUFRLEVBQUUsRUFBQyxHQUFHLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUMsQ0FBQyxDQUFBO1FBRTFFLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLE1BQU0sRUFBRTtZQUNwQixJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxTQUFTLENBQUMsQ0FBQTtRQUNsRCxDQUFDLENBQUMsQ0FBQTtRQUVGLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUE7UUFDakMsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQTtRQUMvQixJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFBO1FBQ2pDLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLFVBQVUsRUFBRSxNQUFNLElBQUksQ0FBQyxn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QUN6QywyQkFBaUIsR0FBRyxNQUFNLENBQUMsb0JBQW9CLENBQUMsQ0FBQTtBQWpOM0QsOEJBeVlDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGNwID0gcmVxdWlyZSgnY2hpbGRfcHJvY2VzcycpXG5pbXBvcnQgc3RyZWFtID0gcmVxdWlyZSgnc3RyZWFtJylcbmltcG9ydCBvcyA9IHJlcXVpcmUoJ29zJylcbmltcG9ydCBwYXRoID0gcmVxdWlyZSgncGF0aCcpXG5pbXBvcnQgYXRvbUFQSSA9IHJlcXVpcmUoJ2F0b20nKVxuXG5leHBvcnQgaW50ZXJmYWNlIEJyZWFrSW5mbyB7XG4gICAgZmlsZW5hbWU6IHN0cmluZ1xuICAgIHJhbmdlOiBbW251bWJlciwgbnVtYmVyXSwgW251bWJlciwgbnVtYmVyXV1cbiAgICBoaXN0b3J5TGVuZ3RoPzogbnVtYmVyXG4gICAgbG9jYWxCaW5kaW5nczogc3RyaW5nW11cbn1cblxuZXhwb3J0IGludGVyZmFjZSBFeGNlcHRpb25JbmZvIHtcbiAgICBoaXN0b3J5TGVuZ3RoOiBudW1iZXJcbiAgICBsb2NhbEJpbmRpbmdzOiBzdHJpbmdbXVxufVxuXG5pbnRlcmZhY2UgQ29tbWFuZCB7XG4gICAgdGV4dDogc3RyaW5nXG4gICAgZW1pdENvbW1hbmRPdXRwdXQ6IGJvb2xlYW5cbiAgICBmdWxmaWxXaXRoUHJvbXB0OiBib29sZWFuXG4gICAgb25GaW5pc2g6IChvdXRwdXQ6IHN0cmluZykgPT4gYW55XG59XG5cbmV4cG9ydCBjbGFzcyBHSENJRGVidWcge1xuICAgIHByaXZhdGUgZ2hjaUNtZDogY3AuQ2hpbGRQcm9jZXNzXG4gICAgc3Rkb3V0OiBzdHJlYW0uUmVhZGFibGVcbiAgICBzdGRpbjogc3RyZWFtLldyaXRhYmxlXG4gICAgc3RkZXJyOiBzdHJlYW0uUmVhZGFibGVcblxuICAgIC8qKiBFdmVudCBIYW5kbGVyXG4gICAgICAqXG4gICAgICAqIEV2ZW50czpcbiAgICAgICpcbiAgICAgICogcmVhZHk6ICgpXG4gICAgICAqICAgICBFbW1pdGVkIHdoZW4gZ2hjaSBoYXMganVzdCBzdG9wcGVkIGV4ZWN1dGluZyBhIGNvbW1hbmRcbiAgICAgICpcbiAgICAgICogcGF1c2VkLW9uLWV4Y2VwdGlvbjogKGluZm86IEV4Y2VwdGlvbkluZm8pXG4gICAgICAqICAgICBFbW1pdGVkIHdoZW4gdGhlIGRlYnVnZ2VyIGlzIGF0IGFuIGV4Y2VwdGlvblxuICAgICAgKlxuICAgICAgKiBlcnJvcjogKHRleHQ6IHN0cmluZylcbiAgICAgICogICAgIEVtbWl0ZWQgd2hlbiBzdGRlcnIgaGFzIGlucHV0XG4gICAgICAqXG4gICAgICAqIGVycm9yLWNvbXBsZXRlZDogKHRleHQ6IHN0cmluZylcbiAgICAgICogICAgIEVtbWl0ZWQgd2hlbiBnaGNpIHJlcG9ydHMgYW4gZXJyb3IgZm9yIGEgZ2l2ZW4gY29tbWFuZFxuICAgICAgKlxuICAgICAgKiBsaW5lLWNoYW5nZWQ6IChpbmZvOiBCcmVha0luZm8pXG4gICAgICAqICAgICBFbW1pdGVkIHdoZW4gdGhlIGxpbmUgdGhhdCB0aGUgZGVidWdnZXIgaXMgb24gY2hhbmdlc1xuICAgICAgKlxuICAgICAgKiBkZWJ1Zy1maW5pc2hlZDogKHZvaWQpXG4gICAgICAqICAgICBFbW1pdGVkIHdoZW4gdGhlIGRlYnVnZ2VyIGhhcyByZWFjaGVkIHRoZSBlbmQgb2YgdGhlIHByb2dyYW1cbiAgICAgICpcbiAgICAgICogY29uc29sZS1vdXRwdXQ6IChvdXRwdXQ6IHN0cmluZylcbiAgICAgICogICAgIEVtbWl0ZWQgd2hlbiB0aGUgZ2hjaSBoYXMgb3V0cHV0ZWQgc29tZXRoaW5nIHRvIHN0ZG91dCwgZXhjbHVkaW5nIHRoZSBleHRyYSBwcm9tcHRcbiAgICAgICpcbiAgICAgICogY29tbWFuZC1pc3N1ZWQ6IChjb21tYW5kOiBzdHJpbmcpXG4gICAgICAqICAgICBFbW1pdGVkIHdoZW4gYSBjb21tYW5kIGhhcyBiZWVuIGV4ZWN1dGVkXG4gICAgICAqL1xuICAgIHB1YmxpYyBlbWl0dGVyOiBhdG9tQVBJLlRFbWl0dGVyPHtcbiAgICAgICdwYXVzZWQtb24tZXhjZXB0aW9uJzogRXhjZXB0aW9uSW5mb1xuICAgICAgJ3JlYWR5JzogRXhjZXB0aW9uSW5mbyB8IHVuZGVmaW5lZFxuICAgICAgJ2Vycm9yJzogc3RyaW5nXG4gICAgICAnZXJyb3ItY29tcGxldGVkJzogc3RyaW5nXG4gICAgICAnbGluZS1jaGFuZ2VkJzogQnJlYWtJbmZvXG4gICAgICAnZGVidWctZmluaXNoZWQnOiB1bmRlZmluZWRcbiAgICAgICdjb25zb2xlLW91dHB1dCc6IHN0cmluZ1xuICAgICAgJ2NvbW1hbmQtaXNzdWVkJzogc3RyaW5nXG4gICAgfT4gPSBuZXcgYXRvbUFQSS5FbWl0dGVyKClcblxuICAgIHByaXZhdGUgc3RhcnRUZXh0OiBQcm9taXNlPHN0cmluZz5cblxuICAgIGNvbnN0cnVjdG9yIChnaGNpQ29tbWFuZD0gJ2doY2knLCBnaGNpQXJnczogc3RyaW5nW10gPSBbXSwgZm9sZGVyPzogc3RyaW5nKSB7XG5cbiAgICAgICAgdGhpcy5naGNpQ21kID0gY3Auc3Bhd24oZ2hjaUNvbW1hbmQsIGdoY2lBcmdzLCB7Y3dkOiBmb2xkZXIsIHNoZWxsOiB0cnVlfSlcblxuICAgICAgICB0aGlzLmdoY2lDbWQub24oJ2V4aXQnLCAoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLmVtaXR0ZXIuZW1pdCgnZGVidWctZmluaXNoZWQnLCB1bmRlZmluZWQpXG4gICAgICAgIH0pXG5cbiAgICAgICAgdGhpcy5zdGRvdXQgPSB0aGlzLmdoY2lDbWQuc3Rkb3V0XG4gICAgICAgIHRoaXMuc3RkaW4gPSB0aGlzLmdoY2lDbWQuc3RkaW5cbiAgICAgICAgdGhpcy5zdGRlcnIgPSB0aGlzLmdoY2lDbWQuc3RkZXJyXG4gICAgICAgIHRoaXMuc3Rkb3V0Lm9uKCdyZWFkYWJsZScsICgpID0+IHRoaXMub25TdGRvdXRSZWFkYWJsZSgpKVxuICAgICAgICB0aGlzLnN0ZGVyci5vbigncmVhZGFibGUnLCAoKSA9PiB0aGlzLm9uU3RkZXJyUmVhZGFibGUoKSlcblxuICAgICAgICB0aGlzLmFkZFJlYWR5RXZlbnQoKVxuXG4gICAgICAgIHRoaXMuc3RhcnRUZXh0ID0gdGhpcy5ydW4oYDpzZXQgcHJvbXB0IFwiJXM+ICR7dGhpcy5jb21tYW5kRmluaXNoZWRTdHJpbmd9XCJgLCBmYWxzZSwgZmFsc2UsIGZhbHNlLCB0cnVlKVxuICAgIH1cblxuICAgIHByaXZhdGUgYWRkUmVhZHlFdmVudCAoKSB7XG4gICAgICAgIGNvbnN0IGV2ZW50U3VicyA9IFtcbiAgICAgICAgICAgICdwYXVzZWQtb24tZXhjZXB0aW9uJyxcbiAgICAgICAgICAgICdsaW5lLWNoYW5nZWQnLFxuICAgICAgICAgICAgJ2RlYnVnLWZpbmlzaGVkJyxcbiAgICAgICAgXVxuXG4gICAgICAgIGZvciAoY29uc3QgZXZlbnROYW1lIG9mIGV2ZW50U3Vicyl7XG4gICAgICAgICAgICAodGhpcy5lbWl0dGVyLm9uIGFzIGFueSkoZXZlbnROYW1lLCAoKSA9PiB0aGlzLmVtaXR0ZXIuZW1pdCgncmVhZHknLCB1bmRlZmluZWQpKVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHVibGljIGRlc3Ryb3kgKCkge1xuICAgICAgICB0aGlzLnN0b3AoKVxuICAgIH1cblxuICAgIHB1YmxpYyBsb2FkTW9kdWxlIChuYW1lOiBzdHJpbmcpIHtcbiAgICAgICAgY29uc3QgY3dkID0gcGF0aC5kaXJuYW1lKG5hbWUpXG5cbiAgICAgICAgdGhpcy5ydW4oYDpjZCAke2N3ZH1gKVxuICAgICAgICB0aGlzLnJ1bihgOmxvYWQgJHtuYW1lfWApXG4gICAgfVxuXG4gICAgcHVibGljIHNldEV4Y2VwdGlvbkJyZWFrTGV2ZWwgKGxldmVsOiBFeGNlcHRpb25CcmVha0xldmVscykge1xuICAgICAgICB0aGlzLnJ1bignOnVuc2V0IC1mYnJlYWstb24tZXhjZXB0aW9uJylcbiAgICAgICAgdGhpcy5ydW4oJzp1bnNldCAtZmJyZWFrLW9uLWVycm9yJylcblxuICAgICAgICBpZiAobGV2ZWwgPT09ICdleGNlcHRpb25zJykge1xuICAgICAgICAgICAgdGhpcy5ydW4oJzpzZXQgLWZicmVhay1vbi1leGNlcHRpb24nKVxuICAgICAgICB9IGVsc2UgaWYgKGxldmVsID09PSAnZXJyb3JzJykge1xuICAgICAgICAgICAgdGhpcy5ydW4oJzpzZXQgLWZicmVhay1vbi1lcnJvcicpXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwdWJsaWMgYWRkQnJlYWtwb2ludCAoYnJlYWtwb2ludDogQnJlYWtwb2ludCB8IHN0cmluZykge1xuICAgICAgICBpZiAodHlwZW9mIGJyZWFrcG9pbnQgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICB0aGlzLnJ1bihgOmJyZWFrICR7YnJlYWtwb2ludH1gKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5ydW4oYDpicmVhayAke2JyZWFrcG9pbnQuZmlsZX0gJHticmVha3BvaW50LmxpbmV9YClcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKiByZXNvbHZlZCB0aGUgZ2l2ZW4gZXhwcmVzc2lvbiB1c2luZyA6cHJpbnQsIHJldHVybnMgbnVsbCBpZiBpdCBpcyBpbnZhbGlkXG4gICAgKi9cbiAgICBwdWJsaWMgYXN5bmMgcmVzb2x2ZUV4cHJlc3Npb24gKGV4cHJlc3Npb246IHN0cmluZykge1xuICAgICAgICBpZiAoISBleHByZXNzaW9uLnRyaW0oKSkge1xuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cbiAgICAgICAgLy8gZXhwcmVzc2lvbnMgY2FuJ3QgaGF2ZSBuZXcgbGluZXNcbiAgICAgICAgaWYgKGV4cHJlc3Npb24uaW5kZXhPZignXFxuJykgIT09IC0xKSB7XG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGdldEV4cHJlc3Npb24gPSAoZ2hjaU91dHB1dDogc3RyaW5nLCB2YXJpYWJsZTogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBtYXRjaFJlc3VsdCA9IGdoY2lPdXRwdXQubWF0Y2goL1teIF0qID0gKC4qKS8pXG4gICAgICAgICAgICBpZiAoISBtYXRjaFJlc3VsdCkgeyByZXR1cm4gfVxuICAgICAgICAgICAgcmV0dXJuIG1hdGNoUmVzdWx0WzFdXG4gICAgICAgIH1cblxuICAgICAgICAvLyBmb3IgdGhlIGNvZGUgYmVsb3csIGlnbm9yZSBlcnJvcnNcbiAgICAgICAgdGhpcy5pZ25vcmVFcnJvcnMgPSB0cnVlXG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIHRyeSBwcmludGluZyBleHByZXNzaW9uXG4gICAgICAgICAgICBjb25zdCBwcmludGluZ1Jlc3VsdCA9IGdldEV4cHJlc3Npb24oXG4gICAgICAgICAgICAgIGF3YWl0IHRoaXMucnVuKGA6cHJpbnQgJHtleHByZXNzaW9ufWAsIGZhbHNlLCBmYWxzZSwgZmFsc2UpLCBleHByZXNzaW9uKVxuICAgICAgICAgICAgaWYgKHByaW50aW5nUmVzdWx0ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcHJpbnRpbmdSZXN1bHRcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gaWYgdGhhdCBmYWlscyBhc3NpZ24gaXQgdG8gYSB0ZW1wb3JhcnkgdmFyaWFibGUgYW5kIGV2YWx1YXRlIHRoYXRcbiAgICAgICAgICAgIGxldCB0ZW1wVmFyTnVtID0gMFxuICAgICAgICAgICAgbGV0IHBvdGVudGlhbFRlbXBWYXI6IHN0cmluZyB8IHVuZGVmaW5lZFxuICAgICAgICAgICAgZG8ge1xuICAgICAgICAgICAgICAgIHBvdGVudGlhbFRlbXBWYXIgPSBnZXRFeHByZXNzaW9uKFxuICAgICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5ydW4oYDpwcmludCB0ZW1wJHt0ZW1wVmFyTnVtfWAsIGZhbHNlLCBmYWxzZSwgZmFsc2UpLCBgdGVtcCR7dGVtcFZhck51bX1gKVxuICAgICAgICAgICAgICAgIHRlbXBWYXJOdW0gKz0gMVxuICAgICAgICAgICAgfSB3aGlsZSAocG90ZW50aWFsVGVtcFZhciAhPT0gdW5kZWZpbmVkKVxuXG4gICAgICAgICAgICBhd2FpdCB0aGlzLnJ1bihgbGV0IHRlbXAke3RlbXBWYXJOdW19ID0gJHtleHByZXNzaW9ufWAsIGZhbHNlLCBmYWxzZSwgZmFsc2UpXG4gICAgICAgICAgICByZXR1cm4gZ2V0RXhwcmVzc2lvbihhd2FpdCB0aGlzLnJ1bihgOnByaW50IHRlbXAke3RlbXBWYXJOdW19YCwgZmFsc2UsIGZhbHNlLCBmYWxzZSksIGB0ZW1wJHt0ZW1wVmFyTnVtfWApXG4gICAgICAgIH0gZmluYWxseSB7XG4gICAgICAgICAgICB0aGlzLmlnbm9yZUVycm9ycyA9IGZhbHNlXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwdWJsaWMgZm9yd2FyZCAoKSB7XG4gICAgICAgIHRoaXMucnVuKCc6Zm9yd2FyZCcsIHRydWUpXG4gICAgfVxuXG4gICAgcHVibGljIGJhY2sgKCkge1xuICAgICAgICB0aGlzLnJ1bignOmJhY2snLCB0cnVlKVxuICAgIH1cblxuICAgIHB1YmxpYyBzdGVwICgpIHtcbiAgICAgICAgdGhpcy5ydW4oJzpzdGVwJywgdHJ1ZSwgdHJ1ZSlcbiAgICB9XG5cbiAgICBwdWJsaWMgc3RvcCAoKSB7XG4gICAgICAgIHRoaXMucnVuKCc6cXVpdCcpXG4gICAgICAgIHNldFRpbWVvdXQoXG4gICAgICAgICgpID0+IHtcbiAgICAgICAgICB0aGlzLmdoY2lDbWQua2lsbCgpXG4gICAgICAgIH0sXG4gICAgICAgIDMwMDApXG4gICAgfVxuXG4gICAgcHVibGljIGNvbnRpbnVlICgpIHtcbiAgICAgICAgdGhpcy5ydW4oJzpjb250aW51ZScsIHRydWUpXG4gICAgfVxuXG4gICAgcHVibGljIGFzeW5jIGFkZGVkQWxsTGlzdGVuZXJzICgpIHtcbiAgICAgICAgdGhpcy5zdGFydFRleHQudGhlbigodGV4dCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgZmlyc3RQcm9tcHQgPSB0ZXh0LmluZGV4T2YoJz4gJylcbiAgICAgICAgICAgIHRoaXMuZW1pdHRlci5lbWl0KCdjb25zb2xlLW91dHB1dCcsIHRleHQuc2xpY2UoMCwgZmlyc3RQcm9tcHQgKyAyKSlcbiAgICAgICAgfSlcbiAgICB9XG5cbiAgICBhc3luYyBzdGFydERlYnVnIChtb2R1bGVOYW1lPzogc3RyaW5nKSB7XG4gICAgICAgIG1vZHVsZU5hbWUgPSBtb2R1bGVOYW1lIHx8ICdtYWluJ1xuICAgICAgICBhd2FpdCB0aGlzLnJ1bignOnRyYWNlICcgKyBtb2R1bGVOYW1lLCB0cnVlLCB0cnVlKVxuICAgIH1cblxuICAgIGFzeW5jIGdldEJpbmRpbmdzICgpIHtcbiAgICAgICAgY29uc3Qgb3V0cHV0U3RyID0gYXdhaXQgdGhpcy5ydW4oJzpzaG93IGJpbmRpbmdzJywgZmFsc2UsIGZhbHNlLCBmYWxzZSlcbiAgICAgICAgcmV0dXJuIG91dHB1dFN0ci5zcGxpdChvcy5FT0wpXG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBnZXRIaXN0b3J5TGVuZ3RoICgpIHtcbiAgICAgICAgY29uc3QgaGlzdG9yeVF1ZXJ5ID0gYXdhaXQgdGhpcy5ydW4oJzpoaXN0b3J5IDEwMCcsIGZhbHNlLCBmYWxzZSwgZmFsc2UpXG4gICAgICAgIGNvbnN0IHJlZ2V4ID0gLy0oXFxkKikuKig/OlxcbnxcXHJ8XFxyXFxuKTxlbmQgb2YgaGlzdG9yeT4kL1xuXG4gICAgICAgIGNvbnN0IG1hdGNoUmVzdWx0ID0gaGlzdG9yeVF1ZXJ5Lm1hdGNoKHJlZ2V4KVxuICAgICAgICBpZiAoISBtYXRjaFJlc3VsdCkge1xuICAgICAgICAgICAgcmV0dXJuIDBcbiAgICAgICAgfSBlbHNlIGlmIChoaXN0b3J5UXVlcnkuc2xpY2UoLTMpID09PSAnLi4uJykge1xuICAgICAgICAgICAgcmV0dXJuIEluZmluaXR5IC8vIGhpc3RvcnkgaXMgdmVyeSBsb25nXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gcGFyc2VJbnQobWF0Y2hSZXN1bHRbMV0sIDEwKVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgc3RhdGljIHBhdXNlZE9uRXJyb3IgPSBTeW1ib2woJ1BhdXNlZCBvbiBFcnJvcicpXG4gICAgc3RhdGljIGZpbmlzaGVkRGVidWdnaW5nID0gU3ltYm9sKCdGaW5pc2hlZCBkZWJ1Z2dpbmcnKVxuXG4gICAgcHJpdmF0ZSBwYXJzZVByb21wdCAoc3RkT3V0cHV0OiBzdHJpbmcpOiBCcmVha0luZm8gfCBTeW1ib2wge1xuICAgICAgICBjb25zdCBwYXR0ZXJucyA9IFt7XG4gICAgICAgICAgICBwYXR0ZXJuOiAvXFxbKD86Wy1cXGRdKjogKT8oLiopOlxcKChcXGQrKSwoXFxkKylcXCktXFwoKFxcZCspLChcXGQrKVxcKS4qXFxdLio+ICQvLFxuICAgICAgICAgICAgZnVuYzogKG1hdGNoKSA9PiAoe1xuICAgICAgICAgICAgICAgIGZpbGVuYW1lOiBtYXRjaFsxXSxcbiAgICAgICAgICAgICAgICByYW5nZTogW1twYXJzZUludChtYXRjaFsyXSwgMTApIC0gMSwgcGFyc2VJbnQobWF0Y2hbM10sIDEwKSAtIDFdLFxuICAgICAgICAgICAgICAgICAgICBbcGFyc2VJbnQobWF0Y2hbNF0sIDEwKSwgcGFyc2VJbnQobWF0Y2hbNV0sIDEwKV1dXG4gICAgICAgICAgICB9KVxuICAgICAgICB9LCB7XG4gICAgICAgICAgICBwYXR0ZXJuOiAvXFxbKD86Wy1cXGRdKjogKT8oLiopOihcXGQqKTooXFxkKiktKFxcZCopXFxdLio+ICQvLFxuICAgICAgICAgICAgZnVuYzogKG1hdGNoKSA9PiAoe1xuICAgICAgICAgICAgICAgICAgICBmaWxlbmFtZTogbWF0Y2hbMV0sXG4gICAgICAgICAgICAgICAgICAgIHJhbmdlOiBbW3BhcnNlSW50KG1hdGNoWzJdLCAxMCkgLSAxLCBwYXJzZUludChtYXRjaFszXSwgMTApIC0gMV0sXG4gICAgICAgICAgICAgICAgICAgICAgICBbcGFyc2VJbnQobWF0Y2hbMl0sIDEwKSAtIDEsIHBhcnNlSW50KG1hdGNoWzRdLCAxMCldXVxuICAgICAgICAgICAgfSlcbiAgICAgICAgfSwge1xuICAgICAgICAgICAgcGF0dGVybjogL1xcWzxleGNlcHRpb24gdGhyb3duPlxcXS4qPiAkLyxcbiAgICAgICAgICAgIGZ1bmM6ICgpID0+IEdIQ0lEZWJ1Zy5wYXVzZWRPbkVycm9yXG4gICAgICAgIH0sIHtcbiAgICAgICAgICAgIHBhdHRlcm46IC8uKj4gJC8sXG4gICAgICAgICAgICBmdW5jOiAoKSA9PiBHSENJRGVidWcuZmluaXNoZWREZWJ1Z2dpbmdcbiAgICAgICAgfV0gYXMgQXJyYXk8e3BhdHRlcm46IFJlZ0V4cDsgZnVuYzogKG1hdGNoOiBzdHJpbmdbXSkgPT4gQnJlYWtJbmZvIHwgU3ltYm9sfT5cbiAgICAgICAgZm9yIChjb25zdCBwYXR0ZXJuIG9mIHBhdHRlcm5zKXtcbiAgICAgICAgICAgIGNvbnN0IG1hdGNoUmVzdWx0ID0gc3RkT3V0cHV0Lm1hdGNoKHBhdHRlcm4ucGF0dGVybilcbiAgICAgICAgICAgIGlmIChtYXRjaFJlc3VsdCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBwYXR0ZXJuLmZ1bmMobWF0Y2hSZXN1bHQpXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3QgcmVhZCBwcm9tcHQ6IFxcbicgKyBzdGRPdXRwdXQpXG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBlbWl0U3RhdHVzQ2hhbmdlcyAocHJvbXB0OiBzdHJpbmcsIG1haW5Cb2R5OiBzdHJpbmcsIGVtaXRIaXN0b3J5TGVuZ3RoOiBib29sZWFuKSB7XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IHRoaXMucGFyc2VQcm9tcHQocHJvbXB0KVxuXG4gICAgICAgIGlmIChyZXN1bHQgPT09IEdIQ0lEZWJ1Zy5wYXVzZWRPbkVycm9yKSB7XG4gICAgICAgICAgICBjb25zdCBoaXN0b3J5TGVuZ3RoID0gYXdhaXQgdGhpcy5nZXRIaXN0b3J5TGVuZ3RoKClcblxuICAgICAgICAgICAgdGhpcy5lbWl0dGVyLmVtaXQoJ3BhdXNlZC1vbi1leGNlcHRpb24nLCB7XG4gICAgICAgICAgICAgICAgaGlzdG9yeUxlbmd0aCxcbiAgICAgICAgICAgICAgICBsb2NhbEJpbmRpbmdzOiBtYWluQm9keS5zcGxpdCgnXFxuJykuc2xpY2UoMSlcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH0gZWxzZSBpZiAocmVzdWx0ID09PSBHSENJRGVidWcuZmluaXNoZWREZWJ1Z2dpbmcpIHtcbiAgICAgICAgICAgIHRoaXMuZW1pdHRlci5lbWl0KCdkZWJ1Zy1maW5pc2hlZCcsIHVuZGVmaW5lZClcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0IGJyZWFrSW5mbyA9IHJlc3VsdCBhcyBCcmVha0luZm9cblxuICAgICAgICAgICAgYnJlYWtJbmZvLmxvY2FsQmluZGluZ3MgPSBhd2FpdCB0aGlzLmdldEJpbmRpbmdzKClcblxuICAgICAgICAgICAgaWYgKGVtaXRIaXN0b3J5TGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgYnJlYWtJbmZvLmhpc3RvcnlMZW5ndGggPSBhd2FpdCB0aGlzLmdldEhpc3RvcnlMZW5ndGgoKVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLmVtaXR0ZXIuZW1pdCgnbGluZS1jaGFuZ2VkJywgYnJlYWtJbmZvKVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBpZ25vcmVFcnJvcnMgPSBmYWxzZVxuICAgIHByaXZhdGUgY3VycmVudFN0ZGVyck91dHB1dCA9ICcnXG4gICAgcHJpdmF0ZSBvblN0ZGVyclJlYWRhYmxlICgpIHtcbiAgICAgICAgY29uc3Qgc3RkZXJyT3V0cHV0OiBCdWZmZXIgPSB0aGlzLnN0ZGVyci5yZWFkKClcbiAgICAgICAgaWYgKCEgc3RkZXJyT3V0cHV0IHx8IHRoaXMuaWdub3JlRXJyb3JzKSB7XG4gICAgICAgICAgICByZXR1cm4gLy8gdGhpcyBpcyB0aGUgZW5kIG9mIHRoZSBpbnB1dCBzdHJlYW1cbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuZW1pdHRlci5lbWl0KCdlcnJvcicsIHN0ZGVyck91dHB1dC50b1N0cmluZygpKVxuXG4gICAgICAgIGlmICh0aGlzLmN1cnJlbnRTdGRlcnJPdXRwdXQgPT09ICcnKSB7XG4gICAgICAgICAgICBjb25zdCBkaXNwID0gdGhpcy5lbWl0dGVyLm9uKCdyZWFkeScsICgpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLmVtaXR0ZXIuZW1pdCgnZXJyb3ItY29tcGxldGVkJywgdGhpcy5jdXJyZW50U3RkZXJyT3V0cHV0KVxuICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudFN0ZGVyck91dHB1dCA9ICcnXG4gICAgICAgICAgICAgICAgZGlzcC5kaXNwb3NlKClcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmN1cnJlbnRTdGRlcnJPdXRwdXQgKz0gc3RkZXJyT3V0cHV0LnRvU3RyaW5nKClcbiAgICB9XG5cbiAgICBwcml2YXRlIGN1cnJlbnRDb21tYW5kQnVmZmVyID0gJydcbiAgICBwcml2YXRlIGNvbW1hbmRzID0gW10gYXMgQ29tbWFuZFtdXG4gICAgcHJpdmF0ZSBjdXJyZW50Q29tbWFuZD86IENvbW1hbmRcbiAgICBwcml2YXRlIGNvbW1hbmRGaW5pc2hlZFN0cmluZyA9ICdjb21tYW5kX2ZpbmlzaF9vNHVCMXdoYWd0ZXFFOHhCcTlvcSdcblxuICAgIHByaXZhdGUgb25TdGRvdXRSZWFkYWJsZSAoKSB7XG4gICAgICAgIGNvbnN0IGN1cnJlbnRTdHJpbmcgPSAodGhpcy5zdGRvdXQucmVhZCgpIHx8ICcnKS50b1N0cmluZygpXG5cbiAgICAgICAgdGhpcy5jdXJyZW50Q29tbWFuZEJ1ZmZlciArPSBjdXJyZW50U3RyaW5nXG5cbiAgICAgICAgY29uc3QgZmluaXNoU3RyaW5nUG9zaXRpb24gPSB0aGlzLmN1cnJlbnRDb21tYW5kQnVmZmVyLnNlYXJjaCh0aGlzLmNvbW1hbmRGaW5pc2hlZFN0cmluZylcbiAgICAgICAgaWYgKGZpbmlzaFN0cmluZ1Bvc2l0aW9uICE9PSAtMSkge1xuICAgICAgICAgICAgY29uc3Qgb3V0cHV0U3RyaW5nID0gdGhpcy5jdXJyZW50Q29tbWFuZEJ1ZmZlci5zbGljZSgwLCBmaW5pc2hTdHJpbmdQb3NpdGlvbilcblxuICAgICAgICAgICAgaWYgKHRoaXMuY3VycmVudENvbW1hbmQpIHtcbiAgICAgICAgICAgICAgaWYgKHRoaXMuY3VycmVudENvbW1hbmQuZW1pdENvbW1hbmRPdXRwdXQpIHtcbiAgICAgICAgICAgICAgICAgIHRoaXMuZW1pdHRlci5lbWl0KCdjb25zb2xlLW91dHB1dCcsIG91dHB1dFN0cmluZylcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIHRoaXMuY3VycmVudENvbW1hbmQub25GaW5pc2gob3V0cHV0U3RyaW5nKVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBUYWtlIHRoZSBmaW5pc2hlZCBzdHJpbmcgb2ZmIHRoZSBidWZmZXIgYW5kIHByb2Nlc3MgdGhlIG5leHQgb3VwdXRcbiAgICAgICAgICAgIHRoaXMuY3VycmVudENvbW1hbmRCdWZmZXIgPSB0aGlzLmN1cnJlbnRDb21tYW5kQnVmZmVyLnNsaWNlKFxuICAgICAgICAgICAgICAgIGZpbmlzaFN0cmluZ1Bvc2l0aW9uICsgdGhpcy5jb21tYW5kRmluaXNoZWRTdHJpbmcubGVuZ3RoKVxuICAgICAgICAgICAgdGhpcy5vblN0ZG91dFJlYWRhYmxlKClcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHB1YmxpYyBhc3luYyBydW4gKGNvbW1hbmRUZXh0OiBzdHJpbmcsXG4gICAgICAgICAgICAgICAgICAgICAgZW1pdFN0YXR1c0NoYW5nZXM6IGJvb2xlYW4gPSBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgICBlbWl0SGlzdG9yeUxlbmd0aDogYm9vbGVhbiA9IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICAgIGVtaXRDb21tYW5kT3V0cHV0OiBib29sZWFuID0gdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICBmdWxmaWxXaXRoUHJvbXB0OiBib29sZWFuID0gZmFsc2UpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgICAgICBjb25zdCBzaGlmdEFuZFJ1bkNvbW1hbmQgPSAoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBjb21tYW5kID0gdGhpcy5jb21tYW5kcy5zaGlmdCgpXG5cbiAgICAgICAgICAgIHRoaXMuY3VycmVudENvbW1hbmQgPSBjb21tYW5kXG5cbiAgICAgICAgICAgIGlmIChjb21tYW5kKSB7XG4gICAgICAgICAgICAgIGlmIChjb21tYW5kLmVtaXRDb21tYW5kT3V0cHV0KSB7XG4gICAgICAgICAgICAgICAgICB0aGlzLmVtaXR0ZXIuZW1pdCgnY29tbWFuZC1pc3N1ZWQnLCBjb21tYW5kLnRleHQpXG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICB0aGlzLnN0ZGluLndyaXRlKGNvbW1hbmQudGV4dCArIG9zLkVPTClcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBjdXJyZW50UHJvbWlzZTogUHJvbWlzZTxzdHJpbmc+XG4gICAgICAgIHJldHVybiBjdXJyZW50UHJvbWlzZSA9IG5ldyBQcm9taXNlPHN0cmluZz4oKGZ1bGZpbCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgY29tbWFuZDogQ29tbWFuZCA9IHtcbiAgICAgICAgICAgICAgICB0ZXh0OiBjb21tYW5kVGV4dCxcbiAgICAgICAgICAgICAgICBlbWl0Q29tbWFuZE91dHB1dCxcbiAgICAgICAgICAgICAgICBmdWxmaWxXaXRoUHJvbXB0LFxuICAgICAgICAgICAgICAgIG9uRmluaXNoOiBhc3luYyAob3V0cHV0KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudENvbW1hbmQgPSB1bmRlZmluZWRcblxuICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbiBfZnVsZmlsIChub1Byb21wdDogc3RyaW5nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZnVsZmlsV2l0aFByb21wdCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZ1bGZpbChvdXRwdXQpXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZ1bGZpbChub1Byb21wdClcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGxhc3RFbmRPZkxpbmVQb3MgPSBvdXRwdXQubGFzdEluZGV4T2Yob3MuRU9MKVxuXG4gICAgICAgICAgICAgICAgICAgIGlmIChsYXN0RW5kT2ZMaW5lUG9zID09PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLyppLmUuIG5vIG91dHB1dCBoYXMgYmVlbiBwcm9kdWNlZCovXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZW1pdFN0YXR1c0NoYW5nZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmVtaXRTdGF0dXNDaGFuZ2VzKG91dHB1dCwgJycsIGVtaXRIaXN0b3J5TGVuZ3RoKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgX2Z1bGZpbCgnJylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBfZnVsZmlsKCcnKVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcHJvbXB0QmVnaW5Qb3NpdGlvbiA9IGxhc3RFbmRPZkxpbmVQb3MgKyBvcy5FT0wubGVuZ3RoXG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlbWl0U3RhdHVzQ2hhbmdlcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZW1pdFN0YXR1c0NoYW5nZXMob3V0cHV0LnNsaWNlKHByb21wdEJlZ2luUG9zaXRpb24sIG91dHB1dC5sZW5ndGgpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb3V0cHV0LnNsaWNlKDAsIGxhc3RFbmRPZkxpbmVQb3MpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZW1pdEhpc3RvcnlMZW5ndGgpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBfZnVsZmlsKG91dHB1dC5zbGljZSgwLCBsYXN0RW5kT2ZMaW5lUG9zKSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBfZnVsZmlsKG91dHB1dC5zbGljZSgwLCBsYXN0RW5kT2ZMaW5lUG9zKSlcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IGN1cnJlbnRQcm9taXNlXG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuY29tbWFuZHMubGVuZ3RoICE9PSAwICYmIHRoaXMuY3VycmVudENvbW1hbmQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2hpZnRBbmRSdW5Db21tYW5kKClcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy5jb21tYW5kcy5wdXNoKGNvbW1hbmQpXG5cbiAgICAgICAgICAgIGlmICh0aGlzLmN1cnJlbnRDb21tYW5kID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICBzaGlmdEFuZFJ1bkNvbW1hbmQoKVxuICAgICAgICAgICAgfVxuICAgICAgICB9KVxuICAgIH1cbn1cbiJdfQ==