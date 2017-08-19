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
        this.on = this.emitter.on.bind(this.emitter);
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
                return undefined;
            }
            if (expression.indexOf('\n') !== -1) {
                return undefined;
            }
            const getExpression = (ghciOutput, variable) => {
                const matchResult = ghciOutput.match(/[^ ]* = (.*)/);
                if (!matchResult) {
                    return undefined;
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
                        if (this.commands.length !== 0) {
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
}
GHCIDebug.pausedOnError = Symbol('Paused on Error');
GHCIDebug.finishedDebugging = Symbol('Finished debugging');
exports.GHCIDebug = GHCIDebug;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiR0hDSURlYnVnLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2xpYi9HSENJRGVidWcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQUFBLG9DQUFvQztBQUVwQyx5QkFBeUI7QUFDekIsNkJBQTZCO0FBQzdCLGdDQUFnQztBQXFCaEM7SUE2QkUsWUFBWSxXQUFXLEdBQUcsTUFBTSxFQUFFLFdBQXFCLEVBQUUsRUFBRSxNQUFlO1FBekJsRSxZQUFPLEdBU1YsSUFBSSxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUE7UUFFVixPQUFFLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQTtRQU8vQyxpQkFBWSxHQUFHLEtBQUssQ0FBQTtRQUNwQix3QkFBbUIsR0FBRyxFQUFFLENBQUE7UUFDeEIseUJBQW9CLEdBQUcsRUFBRSxDQUFBO1FBQ3pCLGFBQVEsR0FBRyxFQUFlLENBQUE7UUFFMUIsMEJBQXFCLEdBQUcscUNBQXFDLENBQUE7UUFJbkUsSUFBSSxDQUFDLE9BQU8sR0FBRyxFQUFFLENBQUMsS0FBSyxDQUFDLFdBQVcsRUFBRSxRQUFRLEVBQUUsRUFBRSxHQUFHLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFBO1FBRTVFLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLE1BQU0sRUFBRTtZQUN0QixJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxTQUFTLENBQUMsQ0FBQTtRQUNoRCxDQUFDLENBQUMsQ0FBQTtRQUVGLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUE7UUFDakMsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQTtRQUMvQixJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxPQUFP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LENBQUMsQ0FBQTtZQUMzRCxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQTtRQUN6QixDQUFDO0lBQ0gsQ0FBQzs7QUFqWGMsdUJBQWEsR0FBRyxNQUFNLENBQUMsaUJBQWlCLENBQUMsQ0FBQTtBQUN6QywyQkFBaUIsR0FBRyxNQUFNLENBQUMsb0JBQW9CLENBQUMsQ0FBQTtBQUZqRSw4QkFtWEMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgY3AgPSByZXF1aXJlKCdjaGlsZF9wcm9jZXNzJylcbmltcG9ydCBzdHJlYW0gPSByZXF1aXJlKCdzdHJlYW0nKVxuaW1wb3J0IG9zID0gcmVxdWlyZSgnb3MnKVxuaW1wb3J0IHBhdGggPSByZXF1aXJlKCdwYXRoJylcbmltcG9ydCBhdG9tQVBJID0gcmVxdWlyZSgnYXRvbScpXG5cbmV4cG9ydCBpbnRlcmZhY2UgQnJlYWtJbmZvIHtcbiAgZmlsZW5hbWU6IHN0cmluZ1xuICByYW5nZTogW1tudW1iZXIsIG51bWJlcl0sIFtudW1iZXIsIG51bWJlcl1dXG4gIGhpc3RvcnlMZW5ndGg/OiBudW1iZXJcbiAgbG9jYWxCaW5kaW5nczogc3RyaW5nW11cbn1cblxuZXhwb3J0IGludGVyZmFjZSBFeGNlcHRpb25JbmZvIHtcbiAgaGlzdG9yeUxlbmd0aDogbnVtYmVyXG4gIGxvY2FsQmluZGluZ3M6IHN0cmluZ1tdXG59XG5cbmludGVyZmFjZSBDb21tYW5kIHtcbiAgdGV4dDogc3RyaW5nXG4gIGVtaXRDb21tYW5kT3V0cHV0OiBib29sZWFuXG4gIGZ1bGZpbFdpdGhQcm9tcHQ6IGJvb2xlYW5cbiAgb25GaW5pc2g6IChvdXRwdXQ6IHN0cmluZykgPT4gYW55XG59XG5cbmV4cG9ydCBjbGFzcyBHSENJRGVidWcge1xuICBwcml2YXRlIHN0YXRpYyBwYXVzZWRPbkVycm9yID0gU3ltYm9sKCdQYXVzZWQgb24gRXJyb3InKVxuICBwcml2YXRlIHN0YXRpYyBmaW5pc2hlZERlYnVnZ2luZyA9IFN5bWJvbCgnRmluaXNoZWQgZGVidWdnaW5nJylcblxuICBwcml2YXRlIGVtaXR0ZXI6IGF0b21BUEkuVEVtaXR0ZXI8e1xuICAgICdwYXVzZWQtb24tZXhjZXB0aW9uJzogRXhjZXB0aW9uSW5mbyAvLy8gRW1taXRlZCB3aGVuIHRoZSBkZWJ1Z2dlciBpcyBhdCBhbiBleGNlcHRpb25cbiAgICAncmVhZHknOiBFeGNlcHRpb25JbmZvIHwgdW5kZWZpbmVkIC8vLyBFbW1pdGVkIHdoZW4gZ2hjaSBoYXMganVzdCBzdG9wcGVkIGV4ZWN1dGluZyBhIGNvbW1hbmRcbiAgICAnZXJyb3InOiBzdHJpbmcgLy8vIEVtbWl0ZWQgd2hlbiBzdGRlcnIgaGFzIGlucHV0XG4gICAgJ2Vycm9yLWNvbXBsZXRlZCc6IHN0cmluZyAvLy8gRW1taXRlZCB3aGVuIGdoY2kgcmVwb3J0cyBhbiBlcnJvciBmb3IgYSBnaXZlbiBjb21tYW5kXG4gICAgJ2xpbmUtY2hhbmdlZCc6IEJyZWFrSW5mbyAvLy8gRW1taXRlZCB3aGVuIHRoZSBsaW5lIHRoYXQgdGhlIGRlYnVnZ2VyIGlzIG9uIGNoYW5nZXNcbiAgICAnZGVidWctZmluaXNoZWQnOiB1bmRlZmluZWQgLy8vIEVtbWl0ZWQgd2hlbiB0aGUgZGVidWdnZXIgaGFzIHJlYWNoZWQgdGhlIGVuZCBvZiB0aGUgcHJvZ3JhbVxuICAgICdjb25zb2xlLW91dHB1dCc6IHN0cmluZyAvLy8gRW1taXRlZCB3aGVuIHRoZSBnaGNpIGhhcyBvdXRwdXRlZCBzb21ldGhpbmcgdG8gc3Rkb3V0LCBleGNsdWRpbmcgdGhlIGV4dHJhIHByb21wdFxuICAgICdjb21tYW5kLWlzc3VlZCc6IHN0cmluZyAvLy8gRW1taXRlZCB3aGVuIGEgY29tbWFuZCBoYXMgYmVlbiBleGVjdXRlZFxuICB9PiA9IG5ldyBhdG9tQVBJLkVtaXR0ZXIoKVxuICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6IG1lbWJlci1vcmRlcmluZ1xuICBwdWJsaWMgcmVhZG9ubHkgb24gPSB0aGlzLmVtaXR0ZXIub24uYmluZCh0aGlzLmVtaXR0ZXIpXG5cbiAgcHJpdmF0ZSBnaGNpQ21kOiBjcC5DaGlsZFByb2Nlc3NcbiAgcHJpdmF0ZSBzdGRvdXQ6IHN0cmVhbS5SZWFkYWJsZVxuICBwcml2YXRlIHN0ZGluOiBzdHJlYW0uV3JpdGFibGVcbiAgcHJpdmF0ZSBzdGRlcnI6IHN0cmVhbS5SZWFkYWJsZVxuICBwcml2YXRlIHN0YXJ0VGV4dDogUHJvbWlzZTxzdHJpbmc+XG4gIHByaXZhdGUgaWdub3JlRXJyb3JzID0gZmFsc2VcbiAgcHJpdmF0ZSBjdXJyZW50U3RkZXJyT3V0cHV0ID0gJydcbiAgcHJpdmF0ZSBjdXJyZW50Q29tbWFuZEJ1ZmZlciA9ICcnXG4gIHByaXZhdGUgY29tbWFuZHMgPSBbXSBhcyBDb21tYW5kW11cbiAgcHJpdmF0ZSBjdXJyZW50Q29tbWFuZD86IENvbW1hbmRcbiAgcHJpdmF0ZSBjb21tYW5kRmluaXNoZWRTdHJpbmcgPSAnY29tbWFuZF9maW5pc2hfbzR1QjF3aGFndGVxRTh4QnE5b3EnXG5cbiAgY29uc3RydWN0b3IoZ2hjaUNvbW1hbmQgPSAnZ2hjaScsIGdoY2lBcmdzOiBzdHJpbmdbXSA9IFtdLCBmb2xkZXI/OiBzdHJpbmcpIHtcblxuICAgIHRoaXMuZ2hjaUNtZCA9IGNwLnNwYXduKGdoY2lDb21tYW5kLCBnaGNpQXJncywgeyBjd2Q6IGZvbGRlciwgc2hlbGw6IHRydWUgfSlcblxuICAgIHRoaXMuZ2hjaUNtZC5vbignZXhpdCcsICgpID0+IHtcbiAgICAgIHRoaXMuZW1pdHRlci5lbWl0KCdkZWJ1Zy1maW5pc2hlZCcsIHVuZGVmaW5lZClcbiAgICB9KVxuXG4gICAgdGhpcy5zdGRvdXQgPSB0aGlzLmdoY2lDbWQuc3Rkb3V0XG4gICAgdGhpcy5zdGRpbiA9IHRoaXMuZ2hjaUNtZC5zdGRpblxuICAgIHRoaXMuc3RkZXJyID0gdGhpcy5naGNpQ21kLnN0ZGVyclxuICAgIHRoaXMuc3Rkb3V0Lm9uKCdyZWFkYWJsZScsICgpID0+IHRoaXMub25TdGRvdXRSZWFkYWJsZSgpKVxuICAgIHRoaXMuc3RkZXJyLm9uKCdyZWFkYWJsZScsICgpID0+IHRoaXMub25TdGRlcnJSZWFkYWJsZSgpKVxuXG4gICAgdGhpcy5hZGRSZWFkeUV2ZW50KClcblxuICAgIHRoaXMuc3RhcnRUZXh0ID0gdGhpcy5ydW4oYDpzZXQgcHJvbXB0IFwiJXM+ICR7dGhpcy5jb21tYW5kRmluaXNoZWRTdHJpbmd9XCJgLCBmYWxzZSwgZmFsc2UsIGZhbHNlLCB0cnVlKVxuICB9XG5cbiAgcHVibGljIGRlc3Ryb3koKSB7XG4gICAgdGhpcy5zdG9wKClcbiAgfVxuXG4gIHB1YmxpYyBsb2FkTW9kdWxlKG5hbWU6IHN0cmluZykge1xuICAgIGNvbnN0IGN3ZCA9IHBhdGguZGlybmFtZShuYW1lKVxuXG4gICAgdGhpcy5ydW4oYDpjZCAke2N3ZH1gKVxuICAgIHRoaXMucnVuKGA6bG9hZCAke25hbWV9YClcbiAgfVxuXG4gIHB1YmxpYyBzZXRFeGNlcHRpb25CcmVha0xldmVsKGxldmVsOiBFeGNlcHRpb25CcmVha0xldmVscykge1xuICAgIHRoaXMucnVuKCc6dW5zZXQgLWZicmVhay1vbi1leGNlcHRpb24nKVxuICAgIHRoaXMucnVuKCc6dW5zZXQgLWZicmVhay1vbi1lcnJvcicpXG5cbiAgICBpZiAobGV2ZWwgPT09ICdleGNlcHRpb25zJykge1xuICAgICAgdGhpcy5ydW4oJzpzZXQgLWZicmVhay1vbi1leGNlcHRpb24nKVxuICAgIH0gZWxzZSBpZiAobGV2ZWwgPT09ICdlcnJvcnMnKSB7XG4gICAgICB0aGlzLnJ1bignOnNldCAtZmJyZWFrLW9uLWVycm9yJylcbiAgICB9XG4gIH1cblxuICBwdWJsaWMgYWRkQnJlYWtwb2ludChicmVha3BvaW50OiBCcmVha3BvaW50IHwgc3RyaW5nKSB7XG4gICAgaWYgKHR5cGVvZiBicmVha3BvaW50ID09PSAnc3RyaW5nJykge1xuICAgICAgdGhpcy5ydW4oYDpicmVhayAke2JyZWFrcG9pbnR9YClcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5ydW4oYDpicmVhayAke2JyZWFrcG9pbnQuZmlsZX0gJHticmVha3BvaW50LmxpbmV9YClcbiAgICB9XG4gIH1cblxuICAvKiogcmVzb2x2ZWQgdGhlIGdpdmVuIGV4cHJlc3Npb24gdXNpbmcgOnByaW50LCByZXR1cm5zIG51bGwgaWYgaXQgaXMgaW52YWxpZFxuICAqL1xuICBwdWJsaWMgYXN5bmMgcmVzb2x2ZUV4cHJlc3Npb24oZXhwcmVzc2lvbjogc3RyaW5nKSB7XG4gICAgaWYgKCFleHByZXNzaW9uLnRyaW0oKSkge1xuICAgICAgcmV0dXJuIHVuZGVmaW5lZFxuICAgIH1cbiAgICAvLyBleHByZXNzaW9ucyBjYW4ndCBoYXZlIG5ldyBsaW5lc1xuICAgIGlmIChleHByZXNzaW9uLmluZGV4T2YoJ1xcbicpICE9PSAtMSkge1xuICAgICAgcmV0dXJuIHVuZGVmaW5lZFxuICAgIH1cblxuICAgIGNvbnN0IGdldEV4cHJlc3Npb24gPSAoZ2hjaU91dHB1dDogc3RyaW5nLCB2YXJpYWJsZTogc3RyaW5nKSA9PiB7XG4gICAgICBjb25zdCBtYXRjaFJlc3VsdCA9IGdoY2lPdXRwdXQubWF0Y2goL1teIF0qID0gKC4qKS8pXG4gICAgICBpZiAoIW1hdGNoUmVzdWx0KSB7IHJldHVybiB1bmRlZmluZWQgfVxuICAgICAgcmV0dXJuIG1hdGNoUmVzdWx0WzFdXG4gICAgfVxuXG4gICAgLy8gZm9yIHRoZSBjb2RlIGJlbG93LCBpZ25vcmUgZXJyb3JzXG4gICAgdGhpcy5pZ25vcmVFcnJvcnMgPSB0cnVlXG5cbiAgICB0cnkge1xuICAgICAgLy8gdHJ5IHByaW50aW5nIGV4cHJlc3Npb25cbiAgICAgIGNvbnN0IHByaW50aW5nUmVzdWx0ID0gZ2V0RXhwcmVzc2lvbihcbiAgICAgICAgYXdhaXQgdGhpcy5ydW4oYDpwcmludCAke2V4cHJlc3Npb259YCwgZmFsc2UsIGZhbHNlLCBmYWxzZSksIGV4cHJlc3Npb24pXG4gICAgICBpZiAocHJpbnRpbmdSZXN1bHQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICByZXR1cm4gcHJpbnRpbmdSZXN1bHRcbiAgICAgIH1cblxuICAgICAgLy8gaWYgdGhhdCBmYWlscyBhc3NpZ24gaXQgdG8gYSB0ZW1wb3JhcnkgdmFyaWFibGUgYW5kIGV2YWx1YXRlIHRoYXRcbiAgICAgIGxldCB0ZW1wVmFyTnVtID0gMFxuICAgICAgbGV0IHBvdGVudGlhbFRlbXBWYXI6IHN0cmluZyB8IHVuZGVmaW5lZFxuICAgICAgZG8ge1xuICAgICAgICBwb3RlbnRpYWxUZW1wVmFyID0gZ2V0RXhwcmVzc2lvbihcbiAgICAgICAgICBhd2FpdCB0aGlzLnJ1bihgOnByaW50IHRlbXAke3RlbXBWYXJOdW19YCwgZmFsc2UsIGZhbHNlLCBmYWxzZSksIGB0ZW1wJHt0ZW1wVmFyTnVtfWApXG4gICAgICAgIHRlbXBWYXJOdW0gKz0gMVxuICAgICAgfSB3aGlsZSAocG90ZW50aWFsVGVtcFZhciAhPT0gdW5kZWZpbmVkKVxuXG4gICAgICBhd2FpdCB0aGlzLnJ1bihgbGV0IHRlbXAke3RlbXBWYXJOdW19ID0gJHtleHByZXNzaW9ufWAsIGZhbHNlLCBmYWxzZSwgZmFsc2UpXG4gICAgICByZXR1cm4gZ2V0RXhwcmVzc2lvbihhd2FpdCB0aGlzLnJ1bihgOnByaW50IHRlbXAke3RlbXBWYXJOdW19YCwgZmFsc2UsIGZhbHNlLCBmYWxzZSksIGB0ZW1wJHt0ZW1wVmFyTnVtfWApXG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIHRoaXMuaWdub3JlRXJyb3JzID0gZmFsc2VcbiAgICB9XG4gIH1cblxuICBwdWJsaWMgZm9yd2FyZCgpIHtcbiAgICB0aGlzLnJ1bignOmZvcndhcmQnLCB0cnVlKVxuICB9XG5cbiAgcHVibGljIGJhY2soKSB7XG4gICAgdGhpcy5ydW4oJzpiYWNrJywgdHJ1ZSlcbiAgfVxuXG4gIHB1YmxpYyBzdGVwKCkge1xuICAgIHRoaXMucnVuKCc6c3RlcCcsIHRydWUsIHRydWUpXG4gIH1cblxuICBwdWJsaWMgc3RvcCgpIHtcbiAgICB0aGlzLnJ1bignOnF1aXQnKVxuICAgIHNldFRpbWVvdXQoXG4gICAgICAoKSA9PiB7XG4gICAgICAgIHRoaXMuZ2hjaUNtZC5raWxsKClcbiAgICAgIH0sXG4gICAgICAzMDAwKVxuICB9XG5cbiAgcHVibGljIGNvbnRpbnVlKCkge1xuICAgIHRoaXMucnVuKCc6Y29udGludWUnLCB0cnVlKVxuICB9XG5cbiAgcHVibGljIGFzeW5jIGFkZGVkQWxsTGlzdGVuZXJzKCkge1xuICAgIHRoaXMuc3RhcnRUZXh0LnRoZW4oKHRleHQpID0+IHtcbiAgICAgIGNvbnN0IGZpcnN0UHJvbXB0ID0gdGV4dC5pbmRleE9mKCc+ICcpXG4gICAgICB0aGlzLmVtaXR0ZXIuZW1pdCgnY29uc29sZS1vdXRwdXQnLCB0ZXh0LnNsaWNlKDAsIGZpcnN0UHJvbXB0ICsgMikpXG4gICAgfSlcbiAgfVxuXG4gIHB1YmxpYyBhc3luYyBzdGFydERlYnVnKG1vZHVsZU5hbWU/OiBzdHJpbmcpIHtcbiAgICBtb2R1bGVOYW1lID0gbW9kdWxlTmFtZSB8fCAnbWFpbidcbiAgICBhd2FpdCB0aGlzLnJ1bignOnRyYWNlICcgKyBtb2R1bGVOYW1lLCB0cnVlLCB0cnVlKVxuICB9XG5cbiAgcHVibGljIGFzeW5jIHJ1bihcbiAgICBjb21tYW5kVGV4dDogc3RyaW5nLFxuICAgIGVtaXRTdGF0dXNDaGFuZ2VzOiBib29sZWFuID0gZmFsc2UsXG4gICAgZW1pdEhpc3RvcnlMZW5ndGg6IGJvb2xlYW4gPSBmYWxzZSxcbiAgICBlbWl0Q29tbWFuZE91dHB1dDogYm9vbGVhbiA9IHRydWUsXG4gICAgZnVsZmlsV2l0aFByb21wdDogYm9vbGVhbiA9IGZhbHNlXG4gICk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3Qgc2hpZnRBbmRSdW5Db21tYW5kID0gKCkgPT4ge1xuICAgICAgY29uc3QgY29tbWFuZCA9IHRoaXMuY29tbWFuZHMuc2hpZnQoKVxuXG4gICAgICB0aGlzLmN1cnJlbnRDb21tYW5kID0gY29tbWFuZFxuXG4gICAgICBpZiAoY29tbWFuZCkge1xuICAgICAgICBpZiAoY29tbWFuZC5lbWl0Q29tbWFuZE91dHB1dCkge1xuICAgICAgICAgIHRoaXMuZW1pdHRlci5lbWl0KCdjb21tYW5kLWlzc3VlZCcsIGNvbW1hbmQudGV4dClcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuc3RkaW4ud3JpdGUoY29tbWFuZC50ZXh0ICsgb3MuRU9MKVxuICAgICAgfVxuICAgIH1cblxuICAgIGxldCBjdXJyZW50UHJvbWlzZTogUHJvbWlzZTxzdHJpbmc+XG4gICAgcmV0dXJuIGN1cnJlbnRQcm9taXNlID0gbmV3IFByb21pc2U8c3RyaW5nPigoZnVsZmlsKSA9PiB7XG4gICAgICBjb25zdCBjb21tYW5kOiBDb21tYW5kID0ge1xuICAgICAgICB0ZXh0OiBjb21tYW5kVGV4dCxcbiAgICAgICAgZW1pdENvbW1hbmRPdXRwdXQsXG4gICAgICAgIGZ1bGZpbFdpdGhQcm9tcHQsXG4gICAgICAgIG9uRmluaXNoOiBhc3luYyAob3V0cHV0KSA9PiB7XG4gICAgICAgICAgdGhpcy5jdXJyZW50Q29tbWFuZCA9IHVuZGVmaW5lZFxuXG4gICAgICAgICAgZnVuY3Rpb24gX2Z1bGZpbChub1Byb21wdDogc3RyaW5nKSB7XG4gICAgICAgICAgICBpZiAoZnVsZmlsV2l0aFByb21wdCkge1xuICAgICAgICAgICAgICBmdWxmaWwob3V0cHV0KVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgZnVsZmlsKG5vUHJvbXB0KVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICAgIGNvbnN0IGxhc3RFbmRPZkxpbmVQb3MgPSBvdXRwdXQubGFzdEluZGV4T2Yob3MuRU9MKVxuXG4gICAgICAgICAgaWYgKGxhc3RFbmRPZkxpbmVQb3MgPT09IC0xKSB7XG4gICAgICAgICAgICAvKmkuZS4gbm8gb3V0cHV0IGhhcyBiZWVuIHByb2R1Y2VkKi9cbiAgICAgICAgICAgIGlmIChlbWl0U3RhdHVzQ2hhbmdlcykge1xuICAgICAgICAgICAgICB0aGlzLmVtaXRTdGF0dXNDaGFuZ2VzKG91dHB1dCwgJycsIGVtaXRIaXN0b3J5TGVuZ3RoKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICBfZnVsZmlsKCcnKVxuICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgX2Z1bGZpbCgnJylcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc3QgcHJvbXB0QmVnaW5Qb3NpdGlvbiA9IGxhc3RFbmRPZkxpbmVQb3MgKyBvcy5FT0wubGVuZ3RoXG5cbiAgICAgICAgICAgIGlmIChlbWl0U3RhdHVzQ2hhbmdlcykge1xuICAgICAgICAgICAgICB0aGlzLmVtaXRTdGF0dXNDaGFuZ2VzKFxuICAgICAgICAgICAgICAgIG91dHB1dC5zbGljZShwcm9tcHRCZWdpblBvc2l0aW9uLCBvdXRwdXQubGVuZ3RoKSxcbiAgICAgICAgICAgICAgICBvdXRwdXQuc2xpY2UoMCwgbGFzdEVuZE9mTGluZVBvcyksXG4gICAgICAgICAgICAgICAgZW1pdEhpc3RvcnlMZW5ndGhcbiAgICAgICAgICAgICAgKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICBfZnVsZmlsKG91dHB1dC5zbGljZSgwLCBsYXN0RW5kT2ZMaW5lUG9zKSlcbiAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIF9mdWxmaWwob3V0cHV0LnNsaWNlKDAsIGxhc3RFbmRPZkxpbmVQb3MpKVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICAgIGF3YWl0IGN1cnJlbnRQcm9taXNlXG5cbiAgICAgICAgICBpZiAodGhpcy5jb21tYW5kcy5sZW5ndGggIT09IDApIHtcbiAgICAgICAgICAgIHNoaWZ0QW5kUnVuQ29tbWFuZCgpXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHRoaXMuY29tbWFuZHMucHVzaChjb21tYW5kKVxuXG4gICAgICBpZiAodGhpcy5jdXJyZW50Q29tbWFuZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHNoaWZ0QW5kUnVuQ29tbWFuZCgpXG4gICAgICB9XG4gICAgfSlcbiAgfVxuXG4gIHByaXZhdGUgYWRkUmVhZHlFdmVudCgpIHtcbiAgICBjb25zdCBldmVudFN1YnMgPSBbXG4gICAgICAncGF1c2VkLW9uLWV4Y2VwdGlvbicsXG4gICAgICAnbGluZS1jaGFuZ2VkJyxcbiAgICAgICdkZWJ1Zy1maW5pc2hlZCcsXG4gICAgXVxuXG4gICAgZm9yIChjb25zdCBldmVudE5hbWUgb2YgZXZlbnRTdWJzKSB7XG4gICAgICAodGhpcy5lbWl0dGVyLm9uIGFzIGFueSkoZXZlbnROYW1lLCAoKSA9PiB0aGlzLmVtaXR0ZXIuZW1pdCgncmVhZHknLCB1bmRlZmluZWQpKVxuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgZ2V0QmluZGluZ3MoKSB7XG4gICAgY29uc3Qgb3V0cHV0U3RyID0gYXdhaXQgdGhpcy5ydW4oJzpzaG93IGJpbmRpbmdzJywgZmFsc2UsIGZhbHNlLCBmYWxzZSlcbiAgICByZXR1cm4gb3V0cHV0U3RyLnNwbGl0KG9zLkVPTClcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgZ2V0SGlzdG9yeUxlbmd0aCgpIHtcbiAgICBjb25zdCBoaXN0b3J5UXVlcnkgPSBhd2FpdCB0aGlzLnJ1bignOmhpc3RvcnkgMTAwJywgZmFsc2UsIGZhbHNlLCBmYWxzZSlcbiAgICBjb25zdCByZWdleCA9IC8tKFxcZCopLiooPzpcXG58XFxyfFxcclxcbik8ZW5kIG9mIGhpc3Rvcnk+JC9cblxuICAgIGNvbnN0IG1hdGNoUmVzdWx0ID0gaGlzdG9yeVF1ZXJ5Lm1hdGNoKHJlZ2V4KVxuICAgIGlmICghbWF0Y2hSZXN1bHQpIHtcbiAgICAgIGlmIChoaXN0b3J5UXVlcnkuc2xpY2UoLTMpID09PSAnLi4uJykge1xuICAgICAgICByZXR1cm4gSW5maW5pdHkgLy8gaGlzdG9yeSBpcyB2ZXJ5IGxvbmdcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiAwXG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBwYXJzZUludChtYXRjaFJlc3VsdFsxXSwgMTApXG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBwYXJzZVByb21wdChzdGRPdXRwdXQ6IHN0cmluZyk6IEJyZWFrSW5mbyB8IFN5bWJvbCB7XG4gICAgY29uc3QgcGF0dGVybnMgPSBbe1xuICAgICAgcGF0dGVybjogL1xcWyg/OlstXFxkXSo6ICk/KC4qKTpcXCgoXFxkKyksKFxcZCspXFwpLVxcKChcXGQrKSwoXFxkKylcXCkuKlxcXS4qPiAkLyxcbiAgICAgIGZ1bmM6IChtYXRjaCkgPT4gKHtcbiAgICAgICAgZmlsZW5hbWU6IG1hdGNoWzFdLFxuICAgICAgICByYW5nZTogW1twYXJzZUludChtYXRjaFsyXSwgMTApIC0gMSwgcGFyc2VJbnQobWF0Y2hbM10sIDEwKSAtIDFdLFxuICAgICAgICBbcGFyc2VJbnQobWF0Y2hbNF0sIDEwKSwgcGFyc2VJbnQobWF0Y2hbNV0sIDEwKV1dXG4gICAgICB9KVxuICAgIH0sIHtcbiAgICAgIHBhdHRlcm46IC9cXFsoPzpbLVxcZF0qOiApPyguKik6KFxcZCopOihcXGQqKS0oXFxkKilcXF0uKj4gJC8sXG4gICAgICBmdW5jOiAobWF0Y2gpID0+ICh7XG4gICAgICAgIGZpbGVuYW1lOiBtYXRjaFsxXSxcbiAgICAgICAgcmFuZ2U6IFtbcGFyc2VJbnQobWF0Y2hbMl0sIDEwKSAtIDEsIHBhcnNlSW50KG1hdGNoWzNdLCAxMCkgLSAxXSxcbiAgICAgICAgW3BhcnNlSW50KG1hdGNoWzJdLCAxMCkgLSAxLCBwYXJzZUludChtYXRjaFs0XSwgMTApXV1cbiAgICAgIH0pXG4gICAgfSwge1xuICAgICAgcGF0dGVybjogL1xcWzxleGNlcHRpb24gdGhyb3duPlxcXS4qPiAkLyxcbiAgICAgIGZ1bmM6ICgpID0+IEdIQ0lEZWJ1Zy5wYXVzZWRPbkVycm9yXG4gICAgfSwge1xuICAgICAgcGF0dGVybjogLy4qPiAkLyxcbiAgICAgIGZ1bmM6ICgpID0+IEdIQ0lEZWJ1Zy5maW5pc2hlZERlYnVnZ2luZ1xuICAgIH1dIGFzIEFycmF5PHsgcGF0dGVybjogUmVnRXhwOyBmdW5jOiAobWF0Y2g6IHN0cmluZ1tdKSA9PiBCcmVha0luZm8gfCBTeW1ib2wgfT5cbiAgICBmb3IgKGNvbnN0IHBhdHRlcm4gb2YgcGF0dGVybnMpIHtcbiAgICAgIGNvbnN0IG1hdGNoUmVzdWx0ID0gc3RkT3V0cHV0Lm1hdGNoKHBhdHRlcm4ucGF0dGVybilcbiAgICAgIGlmIChtYXRjaFJlc3VsdCkge1xuICAgICAgICByZXR1cm4gcGF0dGVybi5mdW5jKG1hdGNoUmVzdWx0KVxuICAgICAgfVxuICAgIH1cbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0Nhbm5vdCByZWFkIHByb21wdDogXFxuJyArIHN0ZE91dHB1dClcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgZW1pdFN0YXR1c0NoYW5nZXMocHJvbXB0OiBzdHJpbmcsIG1haW5Cb2R5OiBzdHJpbmcsIGVtaXRIaXN0b3J5TGVuZ3RoOiBib29sZWFuKSB7XG4gICAgY29uc3QgcmVzdWx0ID0gdGhpcy5wYXJzZVByb21wdChwcm9tcHQpXG5cbiAgICBpZiAocmVzdWx0ID09PSBHSENJRGVidWcucGF1c2VkT25FcnJvcikge1xuICAgICAgY29uc3QgaGlzdG9yeUxlbmd0aCA9IGF3YWl0IHRoaXMuZ2V0SGlzdG9yeUxlbmd0aCgpXG5cbiAgICAgIHRoaXMuZW1pdHRlci5lbWl0KCdwYXVzZWQtb24tZXhjZXB0aW9uJywge1xuICAgICAgICBoaXN0b3J5TGVuZ3RoLFxuICAgICAgICBsb2NhbEJpbmRpbmdzOiBtYWluQm9keS5zcGxpdCgnXFxuJykuc2xpY2UoMSlcbiAgICAgIH0pXG4gICAgfSBlbHNlIGlmIChyZXN1bHQgPT09IEdIQ0lEZWJ1Zy5maW5pc2hlZERlYnVnZ2luZykge1xuICAgICAgdGhpcy5lbWl0dGVyLmVtaXQoJ2RlYnVnLWZpbmlzaGVkJywgdW5kZWZpbmVkKVxuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBicmVha0luZm8gPSByZXN1bHQgYXMgQnJlYWtJbmZvXG5cbiAgICAgIGJyZWFrSW5mby5sb2NhbEJpbmRpbmdzID0gYXdhaXQgdGhpcy5nZXRCaW5kaW5ncygpXG5cbiAgICAgIGlmIChlbWl0SGlzdG9yeUxlbmd0aCkge1xuICAgICAgICBicmVha0luZm8uaGlzdG9yeUxlbmd0aCA9IGF3YWl0IHRoaXMuZ2V0SGlzdG9yeUxlbmd0aCgpXG4gICAgICB9XG5cbiAgICAgIHRoaXMuZW1pdHRlci5lbWl0KCdsaW5lLWNoYW5nZWQnLCBicmVha0luZm8pXG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBvblN0ZGVyclJlYWRhYmxlKCkge1xuICAgIGNvbnN0IHN0ZGVyck91dHB1dDogQnVmZmVyID0gdGhpcy5zdGRlcnIucmVhZCgpXG4gICAgaWYgKCFzdGRlcnJPdXRwdXQgfHwgdGhpcy5pZ25vcmVFcnJvcnMpIHtcbiAgICAgIHJldHVybiAvLyB0aGlzIGlzIHRoZSBlbmQgb2YgdGhlIGlucHV0IHN0cmVhbVxuICAgIH1cblxuICAgIHRoaXMuZW1pdHRlci5lbWl0KCdlcnJvcicsIHN0ZGVyck91dHB1dC50b1N0cmluZygpKVxuXG4gICAgaWYgKHRoaXMuY3VycmVudFN0ZGVyck91dHB1dCA9PT0gJycpIHtcbiAgICAgIGNvbnN0IGRpc3AgPSB0aGlzLmVtaXR0ZXIub24oJ3JlYWR5JywgKCkgPT4ge1xuICAgICAgICB0aGlzLmVtaXR0ZXIuZW1pdCgnZXJyb3ItY29tcGxldGVkJywgdGhpcy5jdXJyZW50U3RkZXJyT3V0cHV0KVxuICAgICAgICB0aGlzLmN1cnJlbnRTdGRlcnJPdXRwdXQgPSAnJ1xuICAgICAgICBkaXNwLmRpc3Bvc2UoKVxuICAgICAgfSlcbiAgICB9XG5cbiAgICB0aGlzLmN1cnJlbnRTdGRlcnJPdXRwdXQgKz0gc3RkZXJyT3V0cHV0LnRvU3RyaW5nKClcbiAgfVxuXG4gIHByaXZhdGUgb25TdGRvdXRSZWFkYWJsZSgpIHtcbiAgICBjb25zdCBjdXJyZW50U3RyaW5nID0gKHRoaXMuc3Rkb3V0LnJlYWQoKSB8fCAnJykudG9TdHJpbmcoKVxuXG4gICAgdGhpcy5jdXJyZW50Q29tbWFuZEJ1ZmZlciArPSBjdXJyZW50U3RyaW5nXG5cbiAgICBjb25zdCBmaW5pc2hTdHJpbmdQb3NpdGlvbiA9IHRoaXMuY3VycmVudENvbW1hbmRCdWZmZXIuc2VhcmNoKHRoaXMuY29tbWFuZEZpbmlzaGVkU3RyaW5nKVxuICAgIGlmIChmaW5pc2hTdHJpbmdQb3NpdGlvbiAhPT0gLTEpIHtcbiAgICAgIGNvbnN0IG91dHB1dFN0cmluZyA9IHRoaXMuY3VycmVudENvbW1hbmRCdWZmZXIuc2xpY2UoMCwgZmluaXNoU3RyaW5nUG9zaXRpb24pXG5cbiAgICAgIGlmICh0aGlzLmN1cnJlbnRDb21tYW5kKSB7XG4gICAgICAgIGlmICh0aGlzLmN1cnJlbnRDb21tYW5kLmVtaXRDb21tYW5kT3V0cHV0KSB7XG4gICAgICAgICAgdGhpcy5lbWl0dGVyLmVtaXQoJ2NvbnNvbGUtb3V0cHV0Jywgb3V0cHV0U3RyaW5nKVxuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5jdXJyZW50Q29tbWFuZC5vbkZpbmlzaChvdXRwdXRTdHJpbmcpXG4gICAgICB9XG5cbiAgICAgIC8vIFRha2UgdGhlIGZpbmlzaGVkIHN0cmluZyBvZmYgdGhlIGJ1ZmZlciBhbmQgcHJvY2VzcyB0aGUgbmV4dCBvdXB1dFxuICAgICAgdGhpcy5jdXJyZW50Q29tbWFuZEJ1ZmZlciA9IHRoaXMuY3VycmVudENvbW1hbmRCdWZmZXIuc2xpY2UoXG4gICAgICAgIGZpbmlzaFN0cmluZ1Bvc2l0aW9uICsgdGhpcy5jb21tYW5kRmluaXNoZWRTdHJpbmcubGVuZ3RoKVxuICAgICAgdGhpcy5vblN0ZG91dFJlYWRhYmxlKClcbiAgICB9XG4gIH1cbn1cbiJdfQ==