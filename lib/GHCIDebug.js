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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiR0hDSURlYnVnLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2xpYi9HSENJRGVidWcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQUFBLG9DQUFvQztBQUVwQyx5QkFBeUI7QUFDekIsNkJBQTZCO0FBQzdCLGdDQUFnQztBQXFCaEM7SUErQ0UsWUFBWSxXQUFXLEdBQUcsTUFBTSxFQUFFLFdBQXFCLEVBQUUsRUFBRSxNQUFlO1FBYm5FLFlBQU8sR0FTVCxJQUFJLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQTtRQWtPbEIsaUJBQVksR0FBRyxLQUFLLENBQUE7UUFDcEIsd0JBQW1CLEdBQUcsRUFBRSxDQUFBO1FBb0J4Qix5QkFBb0IsR0FBRyxFQUFFLENBQUE7UUFDekIsYUFBUSxHQUFHLEVBQWUsQ0FBQTtRQUUxQiwwQkFBcUIsR0FBRyxxQ0FBcUMsQ0FBQTtRQXBQbkUsSUFBSSxDQUFDLE9BQU8sR0FBRyxFQUFFLENBQUMsS0FBSyxDQUFDLFdBQVcsRUFBRSxRQUFRLEVBQUUsRUFBRSxHQUFHLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFBO1FBRTVFLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLE1BQU0sRUFBRTtZQUN0QixJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxTQUFTLENBQUMsQ0FBQTtRQUNoRCxDQUFDLENBQUMsQ0FBQTtRQUVGLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUE7UUFDakMsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQTtRQUMvQixJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFBO1FBQ2pDLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLFVBQVUsRUFBRSxNQUFNLElBQUksQ0FBQyxn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RyxNQUFNLENBQUMsaUJBQWlCLENBQUMsQ0FBQTtBQUN6QywyQkFBaUIsR0FBRyxNQUFNLENBQUMsb0JBQW9CLENBQUMsQ0FBQTtBQW5OekQsOEJBK1lDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGNwID0gcmVxdWlyZSgnY2hpbGRfcHJvY2VzcycpXG5pbXBvcnQgc3RyZWFtID0gcmVxdWlyZSgnc3RyZWFtJylcbmltcG9ydCBvcyA9IHJlcXVpcmUoJ29zJylcbmltcG9ydCBwYXRoID0gcmVxdWlyZSgncGF0aCcpXG5pbXBvcnQgYXRvbUFQSSA9IHJlcXVpcmUoJ2F0b20nKVxuXG5leHBvcnQgaW50ZXJmYWNlIEJyZWFrSW5mbyB7XG4gIGZpbGVuYW1lOiBzdHJpbmdcbiAgcmFuZ2U6IFtbbnVtYmVyLCBudW1iZXJdLCBbbnVtYmVyLCBudW1iZXJdXVxuICBoaXN0b3J5TGVuZ3RoPzogbnVtYmVyXG4gIGxvY2FsQmluZGluZ3M6IHN0cmluZ1tdXG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgRXhjZXB0aW9uSW5mbyB7XG4gIGhpc3RvcnlMZW5ndGg6IG51bWJlclxuICBsb2NhbEJpbmRpbmdzOiBzdHJpbmdbXVxufVxuXG5pbnRlcmZhY2UgQ29tbWFuZCB7XG4gIHRleHQ6IHN0cmluZ1xuICBlbWl0Q29tbWFuZE91dHB1dDogYm9vbGVhblxuICBmdWxmaWxXaXRoUHJvbXB0OiBib29sZWFuXG4gIG9uRmluaXNoOiAob3V0cHV0OiBzdHJpbmcpID0+IGFueVxufVxuXG5leHBvcnQgY2xhc3MgR0hDSURlYnVnIHtcbiAgcHJpdmF0ZSBnaGNpQ21kOiBjcC5DaGlsZFByb2Nlc3NcbiAgc3Rkb3V0OiBzdHJlYW0uUmVhZGFibGVcbiAgc3RkaW46IHN0cmVhbS5Xcml0YWJsZVxuICBzdGRlcnI6IHN0cmVhbS5SZWFkYWJsZVxuXG4gIC8qKiBFdmVudCBIYW5kbGVyXG4gICAgKlxuICAgICogRXZlbnRzOlxuICAgICpcbiAgICAqIHJlYWR5OiAoKVxuICAgICogICAgIEVtbWl0ZWQgd2hlbiBnaGNpIGhhcyBqdXN0IHN0b3BwZWQgZXhlY3V0aW5nIGEgY29tbWFuZFxuICAgICpcbiAgICAqIHBhdXNlZC1vbi1leGNlcHRpb246IChpbmZvOiBFeGNlcHRpb25JbmZvKVxuICAgICogICAgIEVtbWl0ZWQgd2hlbiB0aGUgZGVidWdnZXIgaXMgYXQgYW4gZXhjZXB0aW9uXG4gICAgKlxuICAgICogZXJyb3I6ICh0ZXh0OiBzdHJpbmcpXG4gICAgKiAgICAgRW1taXRlZCB3aGVuIHN0ZGVyciBoYXMgaW5wdXRcbiAgICAqXG4gICAgKiBlcnJvci1jb21wbGV0ZWQ6ICh0ZXh0OiBzdHJpbmcpXG4gICAgKiAgICAgRW1taXRlZCB3aGVuIGdoY2kgcmVwb3J0cyBhbiBlcnJvciBmb3IgYSBnaXZlbiBjb21tYW5kXG4gICAgKlxuICAgICogbGluZS1jaGFuZ2VkOiAoaW5mbzogQnJlYWtJbmZvKVxuICAgICogICAgIEVtbWl0ZWQgd2hlbiB0aGUgbGluZSB0aGF0IHRoZSBkZWJ1Z2dlciBpcyBvbiBjaGFuZ2VzXG4gICAgKlxuICAgICogZGVidWctZmluaXNoZWQ6ICh2b2lkKVxuICAgICogICAgIEVtbWl0ZWQgd2hlbiB0aGUgZGVidWdnZXIgaGFzIHJlYWNoZWQgdGhlIGVuZCBvZiB0aGUgcHJvZ3JhbVxuICAgICpcbiAgICAqIGNvbnNvbGUtb3V0cHV0OiAob3V0cHV0OiBzdHJpbmcpXG4gICAgKiAgICAgRW1taXRlZCB3aGVuIHRoZSBnaGNpIGhhcyBvdXRwdXRlZCBzb21ldGhpbmcgdG8gc3Rkb3V0LCBleGNsdWRpbmcgdGhlIGV4dHJhIHByb21wdFxuICAgICpcbiAgICAqIGNvbW1hbmQtaXNzdWVkOiAoY29tbWFuZDogc3RyaW5nKVxuICAgICogICAgIEVtbWl0ZWQgd2hlbiBhIGNvbW1hbmQgaGFzIGJlZW4gZXhlY3V0ZWRcbiAgICAqL1xuICBwdWJsaWMgZW1pdHRlcjogYXRvbUFQSS5URW1pdHRlcjx7XG4gICAgJ3BhdXNlZC1vbi1leGNlcHRpb24nOiBFeGNlcHRpb25JbmZvXG4gICAgJ3JlYWR5JzogRXhjZXB0aW9uSW5mbyB8IHVuZGVmaW5lZFxuICAgICdlcnJvcic6IHN0cmluZ1xuICAgICdlcnJvci1jb21wbGV0ZWQnOiBzdHJpbmdcbiAgICAnbGluZS1jaGFuZ2VkJzogQnJlYWtJbmZvXG4gICAgJ2RlYnVnLWZpbmlzaGVkJzogdW5kZWZpbmVkXG4gICAgJ2NvbnNvbGUtb3V0cHV0Jzogc3RyaW5nXG4gICAgJ2NvbW1hbmQtaXNzdWVkJzogc3RyaW5nXG4gIH0+ID0gbmV3IGF0b21BUEkuRW1pdHRlcigpXG5cbiAgcHJpdmF0ZSBzdGFydFRleHQ6IFByb21pc2U8c3RyaW5nPlxuXG4gIGNvbnN0cnVjdG9yKGdoY2lDb21tYW5kID0gJ2doY2knLCBnaGNpQXJnczogc3RyaW5nW10gPSBbXSwgZm9sZGVyPzogc3RyaW5nKSB7XG5cbiAgICB0aGlzLmdoY2lDbWQgPSBjcC5zcGF3bihnaGNpQ29tbWFuZCwgZ2hjaUFyZ3MsIHsgY3dkOiBmb2xkZXIsIHNoZWxsOiB0cnVlIH0pXG5cbiAgICB0aGlzLmdoY2lDbWQub24oJ2V4aXQnLCAoKSA9PiB7XG4gICAgICB0aGlzLmVtaXR0ZXIuZW1pdCgnZGVidWctZmluaXNoZWQnLCB1bmRlZmluZWQpXG4gICAgfSlcblxuICAgIHRoaXMuc3Rkb3V0ID0gdGhpcy5naGNpQ21kLnN0ZG91dFxuICAgIHRoaXMuc3RkaW4gPSB0aGlzLmdoY2lDbWQuc3RkaW5cbiAgICB0aGlzLnN0ZGVyciA9IHRoaXMuZ2hjaUNtZC5zdGRlcnJcbiAgICB0aGlzLnN0ZG91dC5vbigncmVhZGFibGUnLCAoKSA9PiB0aGlzLm9uU3Rkb3V0UmVhZGFibGUoKSlcbiAgICB0aGlzLnN0ZGVyci5vbigncmVhZGFibGUnLCAoKSA9PiB0aGlzLm9uU3RkZXJyUmVhZGFibGUoKSlcblxuICAgIHRoaXMuYWRkUmVhZHlFdmVudCgpXG5cbiAgICB0aGlzLnN0YXJ0VGV4dCA9IHRoaXMucnVuKGA6c2V0IHByb21wdCBcIiVzPiAke3RoaXMuY29tbWFuZEZpbmlzaGVkU3RyaW5nfVwiYCwgZmFsc2UsIGZhbHNlLCBmYWxzZSwgdHJ1ZSlcbiAgfVxuXG4gIHByaXZhdGUgYWRkUmVhZHlFdmVudCgpIHtcbiAgICBjb25zdCBldmVudFN1YnMgPSBbXG4gICAgICAncGF1c2VkLW9uLWV4Y2VwdGlvbicsXG4gICAgICAnbGluZS1jaGFuZ2VkJyxcbiAgICAgICdkZWJ1Zy1maW5pc2hlZCcsXG4gICAgXVxuXG4gICAgZm9yIChjb25zdCBldmVudE5hbWUgb2YgZXZlbnRTdWJzKSB7XG4gICAgICAodGhpcy5lbWl0dGVyLm9uIGFzIGFueSkoZXZlbnROYW1lLCAoKSA9PiB0aGlzLmVtaXR0ZXIuZW1pdCgncmVhZHknLCB1bmRlZmluZWQpKVxuICAgIH1cbiAgfVxuXG4gIHB1YmxpYyBkZXN0cm95KCkge1xuICAgIHRoaXMuc3RvcCgpXG4gIH1cblxuICBwdWJsaWMgbG9hZE1vZHVsZShuYW1lOiBzdHJpbmcpIHtcbiAgICBjb25zdCBjd2QgPSBwYXRoLmRpcm5hbWUobmFtZSlcblxuICAgIHRoaXMucnVuKGA6Y2QgJHtjd2R9YClcbiAgICB0aGlzLnJ1bihgOmxvYWQgJHtuYW1lfWApXG4gIH1cblxuICBwdWJsaWMgc2V0RXhjZXB0aW9uQnJlYWtMZXZlbChsZXZlbDogRXhjZXB0aW9uQnJlYWtMZXZlbHMpIHtcbiAgICB0aGlzLnJ1bignOnVuc2V0IC1mYnJlYWstb24tZXhjZXB0aW9uJylcbiAgICB0aGlzLnJ1bignOnVuc2V0IC1mYnJlYWstb24tZXJyb3InKVxuXG4gICAgaWYgKGxldmVsID09PSAnZXhjZXB0aW9ucycpIHtcbiAgICAgIHRoaXMucnVuKCc6c2V0IC1mYnJlYWstb24tZXhjZXB0aW9uJylcbiAgICB9IGVsc2UgaWYgKGxldmVsID09PSAnZXJyb3JzJykge1xuICAgICAgdGhpcy5ydW4oJzpzZXQgLWZicmVhay1vbi1lcnJvcicpXG4gICAgfVxuICB9XG5cbiAgcHVibGljIGFkZEJyZWFrcG9pbnQoYnJlYWtwb2ludDogQnJlYWtwb2ludCB8IHN0cmluZykge1xuICAgIGlmICh0eXBlb2YgYnJlYWtwb2ludCA9PT0gJ3N0cmluZycpIHtcbiAgICAgIHRoaXMucnVuKGA6YnJlYWsgJHticmVha3BvaW50fWApXG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMucnVuKGA6YnJlYWsgJHticmVha3BvaW50LmZpbGV9ICR7YnJlYWtwb2ludC5saW5lfWApXG4gICAgfVxuICB9XG5cbiAgLyoqIHJlc29sdmVkIHRoZSBnaXZlbiBleHByZXNzaW9uIHVzaW5nIDpwcmludCwgcmV0dXJucyBudWxsIGlmIGl0IGlzIGludmFsaWRcbiAgKi9cbiAgcHVibGljIGFzeW5jIHJlc29sdmVFeHByZXNzaW9uKGV4cHJlc3Npb246IHN0cmluZykge1xuICAgIGlmICghZXhwcmVzc2lvbi50cmltKCkpIHtcbiAgICAgIHJldHVyblxuICAgIH1cbiAgICAvLyBleHByZXNzaW9ucyBjYW4ndCBoYXZlIG5ldyBsaW5lc1xuICAgIGlmIChleHByZXNzaW9uLmluZGV4T2YoJ1xcbicpICE9PSAtMSkge1xuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgY29uc3QgZ2V0RXhwcmVzc2lvbiA9IChnaGNpT3V0cHV0OiBzdHJpbmcsIHZhcmlhYmxlOiBzdHJpbmcpID0+IHtcbiAgICAgIGNvbnN0IG1hdGNoUmVzdWx0ID0gZ2hjaU91dHB1dC5tYXRjaCgvW14gXSogPSAoLiopLylcbiAgICAgIGlmICghbWF0Y2hSZXN1bHQpIHsgcmV0dXJuIH1cbiAgICAgIHJldHVybiBtYXRjaFJlc3VsdFsxXVxuICAgIH1cblxuICAgIC8vIGZvciB0aGUgY29kZSBiZWxvdywgaWdub3JlIGVycm9yc1xuICAgIHRoaXMuaWdub3JlRXJyb3JzID0gdHJ1ZVxuXG4gICAgdHJ5IHtcbiAgICAgIC8vIHRyeSBwcmludGluZyBleHByZXNzaW9uXG4gICAgICBjb25zdCBwcmludGluZ1Jlc3VsdCA9IGdldEV4cHJlc3Npb24oXG4gICAgICAgIGF3YWl0IHRoaXMucnVuKGA6cHJpbnQgJHtleHByZXNzaW9ufWAsIGZhbHNlLCBmYWxzZSwgZmFsc2UpLCBleHByZXNzaW9uKVxuICAgICAgaWYgKHByaW50aW5nUmVzdWx0ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuIHByaW50aW5nUmVzdWx0XG4gICAgICB9XG5cbiAgICAgIC8vIGlmIHRoYXQgZmFpbHMgYXNzaWduIGl0IHRvIGEgdGVtcG9yYXJ5IHZhcmlhYmxlIGFuZCBldmFsdWF0ZSB0aGF0XG4gICAgICBsZXQgdGVtcFZhck51bSA9IDBcbiAgICAgIGxldCBwb3RlbnRpYWxUZW1wVmFyOiBzdHJpbmcgfCB1bmRlZmluZWRcbiAgICAgIGRvIHtcbiAgICAgICAgcG90ZW50aWFsVGVtcFZhciA9IGdldEV4cHJlc3Npb24oXG4gICAgICAgICAgYXdhaXQgdGhpcy5ydW4oYDpwcmludCB0ZW1wJHt0ZW1wVmFyTnVtfWAsIGZhbHNlLCBmYWxzZSwgZmFsc2UpLCBgdGVtcCR7dGVtcFZhck51bX1gKVxuICAgICAgICB0ZW1wVmFyTnVtICs9IDFcbiAgICAgIH0gd2hpbGUgKHBvdGVudGlhbFRlbXBWYXIgIT09IHVuZGVmaW5lZClcblxuICAgICAgYXdhaXQgdGhpcy5ydW4oYGxldCB0ZW1wJHt0ZW1wVmFyTnVtfSA9ICR7ZXhwcmVzc2lvbn1gLCBmYWxzZSwgZmFsc2UsIGZhbHNlKVxuICAgICAgcmV0dXJuIGdldEV4cHJlc3Npb24oYXdhaXQgdGhpcy5ydW4oYDpwcmludCB0ZW1wJHt0ZW1wVmFyTnVtfWAsIGZhbHNlLCBmYWxzZSwgZmFsc2UpLCBgdGVtcCR7dGVtcFZhck51bX1gKVxuICAgIH0gZmluYWxseSB7XG4gICAgICB0aGlzLmlnbm9yZUVycm9ycyA9IGZhbHNlXG4gICAgfVxuICB9XG5cbiAgcHVibGljIGZvcndhcmQoKSB7XG4gICAgdGhpcy5ydW4oJzpmb3J3YXJkJywgdHJ1ZSlcbiAgfVxuXG4gIHB1YmxpYyBiYWNrKCkge1xuICAgIHRoaXMucnVuKCc6YmFjaycsIHRydWUpXG4gIH1cblxuICBwdWJsaWMgc3RlcCgpIHtcbiAgICB0aGlzLnJ1bignOnN0ZXAnLCB0cnVlLCB0cnVlKVxuICB9XG5cbiAgcHVibGljIHN0b3AoKSB7XG4gICAgdGhpcy5ydW4oJzpxdWl0JylcbiAgICBzZXRUaW1lb3V0KFxuICAgICAgKCkgPT4ge1xuICAgICAgICB0aGlzLmdoY2lDbWQua2lsbCgpXG4gICAgICB9LFxuICAgICAgMzAwMClcbiAgfVxuXG4gIHB1YmxpYyBjb250aW51ZSgpIHtcbiAgICB0aGlzLnJ1bignOmNvbnRpbnVlJywgdHJ1ZSlcbiAgfVxuXG4gIHB1YmxpYyBhc3luYyBhZGRlZEFsbExpc3RlbmVycygpIHtcbiAgICB0aGlzLnN0YXJ0VGV4dC50aGVuKCh0ZXh0KSA9PiB7XG4gICAgICBjb25zdCBmaXJzdFByb21wdCA9IHRleHQuaW5kZXhPZignPiAnKVxuICAgICAgdGhpcy5lbWl0dGVyLmVtaXQoJ2NvbnNvbGUtb3V0cHV0JywgdGV4dC5zbGljZSgwLCBmaXJzdFByb21wdCArIDIpKVxuICAgIH0pXG4gIH1cblxuICBhc3luYyBzdGFydERlYnVnKG1vZHVsZU5hbWU/OiBzdHJpbmcpIHtcbiAgICBtb2R1bGVOYW1lID0gbW9kdWxlTmFtZSB8fCAnbWFpbidcbiAgICBhd2FpdCB0aGlzLnJ1bignOnRyYWNlICcgKyBtb2R1bGVOYW1lLCB0cnVlLCB0cnVlKVxuICB9XG5cbiAgYXN5bmMgZ2V0QmluZGluZ3MoKSB7XG4gICAgY29uc3Qgb3V0cHV0U3RyID0gYXdhaXQgdGhpcy5ydW4oJzpzaG93IGJpbmRpbmdzJywgZmFsc2UsIGZhbHNlLCBmYWxzZSlcbiAgICByZXR1cm4gb3V0cHV0U3RyLnNwbGl0KG9zLkVPTClcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgZ2V0SGlzdG9yeUxlbmd0aCgpIHtcbiAgICBjb25zdCBoaXN0b3J5UXVlcnkgPSBhd2FpdCB0aGlzLnJ1bignOmhpc3RvcnkgMTAwJywgZmFsc2UsIGZhbHNlLCBmYWxzZSlcbiAgICBjb25zdCByZWdleCA9IC8tKFxcZCopLiooPzpcXG58XFxyfFxcclxcbik8ZW5kIG9mIGhpc3Rvcnk+JC9cblxuICAgIGNvbnN0IG1hdGNoUmVzdWx0ID0gaGlzdG9yeVF1ZXJ5Lm1hdGNoKHJlZ2V4KVxuICAgIGlmICghbWF0Y2hSZXN1bHQpIHtcbiAgICAgIGlmIChoaXN0b3J5UXVlcnkuc2xpY2UoLTMpID09PSAnLi4uJykge1xuICAgICAgICByZXR1cm4gSW5maW5pdHkgLy8gaGlzdG9yeSBpcyB2ZXJ5IGxvbmdcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiAwXG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBwYXJzZUludChtYXRjaFJlc3VsdFsxXSwgMTApXG4gICAgfVxuICB9XG5cbiAgc3RhdGljIHBhdXNlZE9uRXJyb3IgPSBTeW1ib2woJ1BhdXNlZCBvbiBFcnJvcicpXG4gIHN0YXRpYyBmaW5pc2hlZERlYnVnZ2luZyA9IFN5bWJvbCgnRmluaXNoZWQgZGVidWdnaW5nJylcblxuICBwcml2YXRlIHBhcnNlUHJvbXB0KHN0ZE91dHB1dDogc3RyaW5nKTogQnJlYWtJbmZvIHwgU3ltYm9sIHtcbiAgICBjb25zdCBwYXR0ZXJucyA9IFt7XG4gICAgICBwYXR0ZXJuOiAvXFxbKD86Wy1cXGRdKjogKT8oLiopOlxcKChcXGQrKSwoXFxkKylcXCktXFwoKFxcZCspLChcXGQrKVxcKS4qXFxdLio+ICQvLFxuICAgICAgZnVuYzogKG1hdGNoKSA9PiAoe1xuICAgICAgICBmaWxlbmFtZTogbWF0Y2hbMV0sXG4gICAgICAgIHJhbmdlOiBbW3BhcnNlSW50KG1hdGNoWzJdLCAxMCkgLSAxLCBwYXJzZUludChtYXRjaFszXSwgMTApIC0gMV0sXG4gICAgICAgIFtwYXJzZUludChtYXRjaFs0XSwgMTApLCBwYXJzZUludChtYXRjaFs1XSwgMTApXV1cbiAgICAgIH0pXG4gICAgfSwge1xuICAgICAgcGF0dGVybjogL1xcWyg/OlstXFxkXSo6ICk/KC4qKTooXFxkKik6KFxcZCopLShcXGQqKVxcXS4qPiAkLyxcbiAgICAgIGZ1bmM6IChtYXRjaCkgPT4gKHtcbiAgICAgICAgZmlsZW5hbWU6IG1hdGNoWzFdLFxuICAgICAgICByYW5nZTogW1twYXJzZUludChtYXRjaFsyXSwgMTApIC0gMSwgcGFyc2VJbnQobWF0Y2hbM10sIDEwKSAtIDFdLFxuICAgICAgICBbcGFyc2VJbnQobWF0Y2hbMl0sIDEwKSAtIDEsIHBhcnNlSW50KG1hdGNoWzRdLCAxMCldXVxuICAgICAgfSlcbiAgICB9LCB7XG4gICAgICBwYXR0ZXJuOiAvXFxbPGV4Y2VwdGlvbiB0aHJvd24+XFxdLio+ICQvLFxuICAgICAgZnVuYzogKCkgPT4gR0hDSURlYnVnLnBhdXNlZE9uRXJyb3JcbiAgICB9LCB7XG4gICAgICBwYXR0ZXJuOiAvLio+ICQvLFxuICAgICAgZnVuYzogKCkgPT4gR0hDSURlYnVnLmZpbmlzaGVkRGVidWdnaW5nXG4gICAgfV0gYXMgQXJyYXk8eyBwYXR0ZXJuOiBSZWdFeHA7IGZ1bmM6IChtYXRjaDogc3RyaW5nW10pID0+IEJyZWFrSW5mbyB8IFN5bWJvbCB9PlxuICAgIGZvciAoY29uc3QgcGF0dGVybiBvZiBwYXR0ZXJucykge1xuICAgICAgY29uc3QgbWF0Y2hSZXN1bHQgPSBzdGRPdXRwdXQubWF0Y2gocGF0dGVybi5wYXR0ZXJuKVxuICAgICAgaWYgKG1hdGNoUmVzdWx0KSB7XG4gICAgICAgIHJldHVybiBwYXR0ZXJuLmZ1bmMobWF0Y2hSZXN1bHQpXG4gICAgICB9XG4gICAgfVxuICAgIHRocm93IG5ldyBFcnJvcignQ2Fubm90IHJlYWQgcHJvbXB0OiBcXG4nICsgc3RkT3V0cHV0KVxuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBlbWl0U3RhdHVzQ2hhbmdlcyhwcm9tcHQ6IHN0cmluZywgbWFpbkJvZHk6IHN0cmluZywgZW1pdEhpc3RvcnlMZW5ndGg6IGJvb2xlYW4pIHtcbiAgICBjb25zdCByZXN1bHQgPSB0aGlzLnBhcnNlUHJvbXB0KHByb21wdClcblxuICAgIGlmIChyZXN1bHQgPT09IEdIQ0lEZWJ1Zy5wYXVzZWRPbkVycm9yKSB7XG4gICAgICBjb25zdCBoaXN0b3J5TGVuZ3RoID0gYXdhaXQgdGhpcy5nZXRIaXN0b3J5TGVuZ3RoKClcblxuICAgICAgdGhpcy5lbWl0dGVyLmVtaXQoJ3BhdXNlZC1vbi1leGNlcHRpb24nLCB7XG4gICAgICAgIGhpc3RvcnlMZW5ndGgsXG4gICAgICAgIGxvY2FsQmluZGluZ3M6IG1haW5Cb2R5LnNwbGl0KCdcXG4nKS5zbGljZSgxKVxuICAgICAgfSlcbiAgICB9IGVsc2UgaWYgKHJlc3VsdCA9PT0gR0hDSURlYnVnLmZpbmlzaGVkRGVidWdnaW5nKSB7XG4gICAgICB0aGlzLmVtaXR0ZXIuZW1pdCgnZGVidWctZmluaXNoZWQnLCB1bmRlZmluZWQpXG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IGJyZWFrSW5mbyA9IHJlc3VsdCBhcyBCcmVha0luZm9cblxuICAgICAgYnJlYWtJbmZvLmxvY2FsQmluZGluZ3MgPSBhd2FpdCB0aGlzLmdldEJpbmRpbmdzKClcblxuICAgICAgaWYgKGVtaXRIaXN0b3J5TGVuZ3RoKSB7XG4gICAgICAgIGJyZWFrSW5mby5oaXN0b3J5TGVuZ3RoID0gYXdhaXQgdGhpcy5nZXRIaXN0b3J5TGVuZ3RoKClcbiAgICAgIH1cblxuICAgICAgdGhpcy5lbWl0dGVyLmVtaXQoJ2xpbmUtY2hhbmdlZCcsIGJyZWFrSW5mbylcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGlnbm9yZUVycm9ycyA9IGZhbHNlXG4gIHByaXZhdGUgY3VycmVudFN0ZGVyck91dHB1dCA9ICcnXG4gIHByaXZhdGUgb25TdGRlcnJSZWFkYWJsZSgpIHtcbiAgICBjb25zdCBzdGRlcnJPdXRwdXQ6IEJ1ZmZlciA9IHRoaXMuc3RkZXJyLnJlYWQoKVxuICAgIGlmICghc3RkZXJyT3V0cHV0IHx8IHRoaXMuaWdub3JlRXJyb3JzKSB7XG4gICAgICByZXR1cm4gLy8gdGhpcyBpcyB0aGUgZW5kIG9mIHRoZSBpbnB1dCBzdHJlYW1cbiAgICB9XG5cbiAgICB0aGlzLmVtaXR0ZXIuZW1pdCgnZXJyb3InLCBzdGRlcnJPdXRwdXQudG9TdHJpbmcoKSlcblxuICAgIGlmICh0aGlzLmN1cnJlbnRTdGRlcnJPdXRwdXQgPT09ICcnKSB7XG4gICAgICBjb25zdCBkaXNwID0gdGhpcy5lbWl0dGVyLm9uKCdyZWFkeScsICgpID0+IHtcbiAgICAgICAgdGhpcy5lbWl0dGVyLmVtaXQoJ2Vycm9yLWNvbXBsZXRlZCcsIHRoaXMuY3VycmVudFN0ZGVyck91dHB1dClcbiAgICAgICAgdGhpcy5jdXJyZW50U3RkZXJyT3V0cHV0ID0gJydcbiAgICAgICAgZGlzcC5kaXNwb3NlKClcbiAgICAgIH0pXG4gICAgfVxuXG4gICAgdGhpcy5jdXJyZW50U3RkZXJyT3V0cHV0ICs9IHN0ZGVyck91dHB1dC50b1N0cmluZygpXG4gIH1cblxuICBwcml2YXRlIGN1cnJlbnRDb21tYW5kQnVmZmVyID0gJydcbiAgcHJpdmF0ZSBjb21tYW5kcyA9IFtdIGFzIENvbW1hbmRbXVxuICBwcml2YXRlIGN1cnJlbnRDb21tYW5kPzogQ29tbWFuZFxuICBwcml2YXRlIGNvbW1hbmRGaW5pc2hlZFN0cmluZyA9ICdjb21tYW5kX2ZpbmlzaF9vNHVCMXdoYWd0ZXFFOHhCcTlvcSdcblxuICBwcml2YXRlIG9uU3Rkb3V0UmVhZGFibGUoKSB7XG4gICAgY29uc3QgY3VycmVudFN0cmluZyA9ICh0aGlzLnN0ZG91dC5yZWFkKCkgfHwgJycpLnRvU3RyaW5nKClcblxuICAgIHRoaXMuY3VycmVudENvbW1hbmRCdWZmZXIgKz0gY3VycmVudFN0cmluZ1xuXG4gICAgY29uc3QgZmluaXNoU3RyaW5nUG9zaXRpb24gPSB0aGlzLmN1cnJlbnRDb21tYW5kQnVmZmVyLnNlYXJjaCh0aGlzLmNvbW1hbmRGaW5pc2hlZFN0cmluZylcbiAgICBpZiAoZmluaXNoU3RyaW5nUG9zaXRpb24gIT09IC0xKSB7XG4gICAgICBjb25zdCBvdXRwdXRTdHJpbmcgPSB0aGlzLmN1cnJlbnRDb21tYW5kQnVmZmVyLnNsaWNlKDAsIGZpbmlzaFN0cmluZ1Bvc2l0aW9uKVxuXG4gICAgICBpZiAodGhpcy5jdXJyZW50Q29tbWFuZCkge1xuICAgICAgICBpZiAodGhpcy5jdXJyZW50Q29tbWFuZC5lbWl0Q29tbWFuZE91dHB1dCkge1xuICAgICAgICAgIHRoaXMuZW1pdHRlci5lbWl0KCdjb25zb2xlLW91dHB1dCcsIG91dHB1dFN0cmluZylcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuY3VycmVudENvbW1hbmQub25GaW5pc2gob3V0cHV0U3RyaW5nKVxuICAgICAgfVxuXG4gICAgICAvLyBUYWtlIHRoZSBmaW5pc2hlZCBzdHJpbmcgb2ZmIHRoZSBidWZmZXIgYW5kIHByb2Nlc3MgdGhlIG5leHQgb3VwdXRcbiAgICAgIHRoaXMuY3VycmVudENvbW1hbmRCdWZmZXIgPSB0aGlzLmN1cnJlbnRDb21tYW5kQnVmZmVyLnNsaWNlKFxuICAgICAgICBmaW5pc2hTdHJpbmdQb3NpdGlvbiArIHRoaXMuY29tbWFuZEZpbmlzaGVkU3RyaW5nLmxlbmd0aClcbiAgICAgIHRoaXMub25TdGRvdXRSZWFkYWJsZSgpXG4gICAgfVxuICB9XG5cbiAgcHVibGljIGFzeW5jIHJ1bihcbiAgICBjb21tYW5kVGV4dDogc3RyaW5nLFxuICAgIGVtaXRTdGF0dXNDaGFuZ2VzOiBib29sZWFuID0gZmFsc2UsXG4gICAgZW1pdEhpc3RvcnlMZW5ndGg6IGJvb2xlYW4gPSBmYWxzZSxcbiAgICBlbWl0Q29tbWFuZE91dHB1dDogYm9vbGVhbiA9IHRydWUsXG4gICAgZnVsZmlsV2l0aFByb21wdDogYm9vbGVhbiA9IGZhbHNlXG4gICk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3Qgc2hpZnRBbmRSdW5Db21tYW5kID0gKCkgPT4ge1xuICAgICAgY29uc3QgY29tbWFuZCA9IHRoaXMuY29tbWFuZHMuc2hpZnQoKVxuXG4gICAgICB0aGlzLmN1cnJlbnRDb21tYW5kID0gY29tbWFuZFxuXG4gICAgICBpZiAoY29tbWFuZCkge1xuICAgICAgICBpZiAoY29tbWFuZC5lbWl0Q29tbWFuZE91dHB1dCkge1xuICAgICAgICAgIHRoaXMuZW1pdHRlci5lbWl0KCdjb21tYW5kLWlzc3VlZCcsIGNvbW1hbmQudGV4dClcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuc3RkaW4ud3JpdGUoY29tbWFuZC50ZXh0ICsgb3MuRU9MKVxuICAgICAgfVxuICAgIH1cblxuICAgIGxldCBjdXJyZW50UHJvbWlzZTogUHJvbWlzZTxzdHJpbmc+XG4gICAgcmV0dXJuIGN1cnJlbnRQcm9taXNlID0gbmV3IFByb21pc2U8c3RyaW5nPigoZnVsZmlsKSA9PiB7XG4gICAgICBjb25zdCBjb21tYW5kOiBDb21tYW5kID0ge1xuICAgICAgICB0ZXh0OiBjb21tYW5kVGV4dCxcbiAgICAgICAgZW1pdENvbW1hbmRPdXRwdXQsXG4gICAgICAgIGZ1bGZpbFdpdGhQcm9tcHQsXG4gICAgICAgIG9uRmluaXNoOiBhc3luYyAob3V0cHV0KSA9PiB7XG4gICAgICAgICAgdGhpcy5jdXJyZW50Q29tbWFuZCA9IHVuZGVmaW5lZFxuXG4gICAgICAgICAgZnVuY3Rpb24gX2Z1bGZpbChub1Byb21wdDogc3RyaW5nKSB7XG4gICAgICAgICAgICBpZiAoZnVsZmlsV2l0aFByb21wdCkge1xuICAgICAgICAgICAgICBmdWxmaWwob3V0cHV0KVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgZnVsZmlsKG5vUHJvbXB0KVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICAgIGNvbnN0IGxhc3RFbmRPZkxpbmVQb3MgPSBvdXRwdXQubGFzdEluZGV4T2Yob3MuRU9MKVxuXG4gICAgICAgICAgaWYgKGxhc3RFbmRPZkxpbmVQb3MgPT09IC0xKSB7XG4gICAgICAgICAgICAvKmkuZS4gbm8gb3V0cHV0IGhhcyBiZWVuIHByb2R1Y2VkKi9cbiAgICAgICAgICAgIGlmIChlbWl0U3RhdHVzQ2hhbmdlcykge1xuICAgICAgICAgICAgICB0aGlzLmVtaXRTdGF0dXNDaGFuZ2VzKG91dHB1dCwgJycsIGVtaXRIaXN0b3J5TGVuZ3RoKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICBfZnVsZmlsKCcnKVxuICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgX2Z1bGZpbCgnJylcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc3QgcHJvbXB0QmVnaW5Qb3NpdGlvbiA9IGxhc3RFbmRPZkxpbmVQb3MgKyBvcy5FT0wubGVuZ3RoXG5cbiAgICAgICAgICAgIGlmIChlbWl0U3RhdHVzQ2hhbmdlcykge1xuICAgICAgICAgICAgICB0aGlzLmVtaXRTdGF0dXNDaGFuZ2VzKFxuICAgICAgICAgICAgICAgIG91dHB1dC5zbGljZShwcm9tcHRCZWdpblBvc2l0aW9uLCBvdXRwdXQubGVuZ3RoKSxcbiAgICAgICAgICAgICAgICBvdXRwdXQuc2xpY2UoMCwgbGFzdEVuZE9mTGluZVBvcyksXG4gICAgICAgICAgICAgICAgZW1pdEhpc3RvcnlMZW5ndGhcbiAgICAgICAgICAgICAgKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICBfZnVsZmlsKG91dHB1dC5zbGljZSgwLCBsYXN0RW5kT2ZMaW5lUG9zKSlcbiAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIF9mdWxmaWwob3V0cHV0LnNsaWNlKDAsIGxhc3RFbmRPZkxpbmVQb3MpKVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICAgIGF3YWl0IGN1cnJlbnRQcm9taXNlXG5cbiAgICAgICAgICBpZiAodGhpcy5jb21tYW5kcy5sZW5ndGggIT09IDAgJiYgdGhpcy5jdXJyZW50Q29tbWFuZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBzaGlmdEFuZFJ1bkNvbW1hbmQoKVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICB0aGlzLmNvbW1hbmRzLnB1c2goY29tbWFuZClcblxuICAgICAgaWYgKHRoaXMuY3VycmVudENvbW1hbmQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICBzaGlmdEFuZFJ1bkNvbW1hbmQoKVxuICAgICAgfVxuICAgIH0pXG4gIH1cbn1cbiJdfQ==