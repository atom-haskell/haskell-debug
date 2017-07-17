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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiR0hDSURlYnVnLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2xpYi9HSENJRGVidWcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQUFBLG9DQUFvQztBQUVwQyx5QkFBeUI7QUFDekIsNkJBQTZCO0FBQzdCLGdDQUFnQztBQWdEaEM7SUFzQ0ksWUFBYSxXQUFXLEdBQUUsTUFBTSxFQUFFLFdBQXFCLEVBQUUsRUFBRSxNQUFlO1FBSm5FLFlBQU8sR0FBcUIsSUFBSSxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUE7UUFnT2hELGlCQUFZLEdBQUcsS0FBSyxDQUFBO1FBQ3BCLHdCQUFtQixHQUFHLEVBQUUsQ0FBQTtRQW9CeEIseUJBQW9CLEdBQUcsRUFBRSxDQUFBO1FBQ3pCLGFBQVEsR0FBRyxFQUFlLENBQUE7UUFFMUIsMEJBQXFCLEdBQUcscUNBQXFDLENBQUE7UUFsUGpFLElBQUksQ0FBQyxPQUFPLEdBQUcsRUFBRSxDQUFDLEtBQUssQ0FBQyxXQUFXLEVBQUUsUUFBUSxFQUFFLEVBQUMsR0FBRyxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFDLENBQUMsQ0FBQTtRQUUxRSxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxNQUFNLEVBQUU7WUFDcEIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsU0FBUyxDQUFDLENBQUE7UUFDbEQsQ0FBQyxDQUFDLENBQUE7UUFFRixJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFBO1FBQ2pDLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUE7UUFDL0IsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQTtRQUNqQyxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxVQUFVLEVBQUUsTUFBTSxJQUFJLENBQUMs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QUFDekMsMkJBQWlCLEdBQUcsTUFBTSxDQUFDLG9CQUFvQixDQUFDLENBQUE7QUF4TTNELDhCQWdZQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBjcCA9IHJlcXVpcmUoJ2NoaWxkX3Byb2Nlc3MnKVxuaW1wb3J0IHN0cmVhbSA9IHJlcXVpcmUoJ3N0cmVhbScpXG5pbXBvcnQgb3MgPSByZXF1aXJlKCdvcycpXG5pbXBvcnQgcGF0aCA9IHJlcXVpcmUoJ3BhdGgnKVxuaW1wb3J0IGF0b21BUEkgPSByZXF1aXJlKCdhdG9tJylcblxuZXhwb3J0IGludGVyZmFjZSBCcmVha0luZm8ge1xuICAgIGZpbGVuYW1lOiBzdHJpbmdcbiAgICByYW5nZTogW1tudW1iZXIsIG51bWJlcl0sIFtudW1iZXIsIG51bWJlcl1dXG4gICAgaGlzdG9yeUxlbmd0aD86IG51bWJlclxuICAgIGxvY2FsQmluZGluZ3M6IHN0cmluZ1tdXG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgRXhjZXB0aW9uSW5mbyB7XG4gICAgaGlzdG9yeUxlbmd0aDogbnVtYmVyXG4gICAgbG9jYWxCaW5kaW5nczogc3RyaW5nW11cbn1cblxuaW50ZXJmYWNlIEVtaXR0ZXJPbk1hcCB7XG4gICdyZWFkeSc6ICgpID0+IGFueVxuICAnZGVidWctZmluaXNoZWQnOiAoKSA9PiBhbnlcbiAgJ3BhdXNlZC1vbi1leGNlcHRpb24nOiAoaW5mbzogRXhjZXB0aW9uSW5mbykgPT4gYW55XG4gICdlcnJvcic6ICh0ZXh0OiBzdHJpbmcpID0+IGFueVxuICAnZXJyb3ItY29tcGxldGVkJzogKHRleHQ6IHN0cmluZykgPT4gYW55XG4gICdsaW5lLWNoYW5nZWQnOiAoaW5mbzogQnJlYWtJbmZvKSA9PiBhbnlcbiAgJ2NvbnNvbGUtb3V0cHV0JzogKG91dHB1dDogc3RyaW5nKSA9PiBhbnlcbiAgJ2NvbW1hbmQtaXNzdWVkJzogKGNvbW1hbmQ6IHN0cmluZykgPT4gYW55XG59XG5cbmludGVyZmFjZSBFbWl0dGVyRW1pdE1hcCB7XG4gICdwYXVzZWQtb24tZXhjZXB0aW9uJzogRXhjZXB0aW9uSW5mb1xuICAncmVhZHknOiBFeGNlcHRpb25JbmZvIHwgdW5kZWZpbmVkXG4gICdlcnJvcic6IHN0cmluZ1xuICAnZXJyb3ItY29tcGxldGVkJzogc3RyaW5nXG4gICdsaW5lLWNoYW5nZWQnOiBCcmVha0luZm9cbiAgJ2RlYnVnLWZpbmlzaGVkJzogYW55XG4gICdjb25zb2xlLW91dHB1dCc6IHN0cmluZ1xuICAnY29tbWFuZC1pc3N1ZWQnOiBzdHJpbmdcbn1cblxuZXhwb3J0IGludGVyZmFjZSBHSENJRGVidWdFbWl0dGVyIGV4dGVuZHMgYXRvbUFQSS5FbWl0dGVyIHtcbiAgICBvbjxLIGV4dGVuZHMga2V5b2YgRW1pdHRlck9uTWFwPiAoZXZlbnROYW1lOiBLLCBoYW5kbGVyOiBFbWl0dGVyT25NYXBbS10pOiBhdG9tQVBJLkRpc3Bvc2FibGVcbiAgICBlbWl0PEsgZXh0ZW5kcyBrZXlvZiBFbWl0dGVyRW1pdE1hcD4gKGV2ZW50TmFtZTogSywgdmFsdWU6IEVtaXR0ZXJFbWl0TWFwW0tdKTogdm9pZFxufVxuXG5pbnRlcmZhY2UgQ29tbWFuZCB7XG4gICAgdGV4dDogc3RyaW5nXG4gICAgZW1pdENvbW1hbmRPdXRwdXQ6IGJvb2xlYW5cbiAgICBmdWxmaWxXaXRoUHJvbXB0OiBib29sZWFuXG4gICAgb25GaW5pc2g6IChvdXRwdXQ6IHN0cmluZykgPT4gYW55XG59XG5cbmV4cG9ydCBjbGFzcyBHSENJRGVidWcge1xuICAgIHByaXZhdGUgZ2hjaUNtZDogY3AuQ2hpbGRQcm9jZXNzXG4gICAgc3Rkb3V0OiBzdHJlYW0uUmVhZGFibGVcbiAgICBzdGRpbjogc3RyZWFtLldyaXRhYmxlXG4gICAgc3RkZXJyOiBzdHJlYW0uUmVhZGFibGVcblxuICAgIC8qKiBFdmVudCBIYW5kbGVyXG4gICAgICAqXG4gICAgICAqIEV2ZW50czpcbiAgICAgICpcbiAgICAgICogcmVhZHk6ICgpXG4gICAgICAqICAgICBFbW1pdGVkIHdoZW4gZ2hjaSBoYXMganVzdCBzdG9wcGVkIGV4ZWN1dGluZyBhIGNvbW1hbmRcbiAgICAgICpcbiAgICAgICogcGF1c2VkLW9uLWV4Y2VwdGlvbjogKGluZm86IEV4Y2VwdGlvbkluZm8pXG4gICAgICAqICAgICBFbW1pdGVkIHdoZW4gdGhlIGRlYnVnZ2VyIGlzIGF0IGFuIGV4Y2VwdGlvblxuICAgICAgKlxuICAgICAgKiBlcnJvcjogKHRleHQ6IHN0cmluZylcbiAgICAgICogICAgIEVtbWl0ZWQgd2hlbiBzdGRlcnIgaGFzIGlucHV0XG4gICAgICAqXG4gICAgICAqIGVycm9yLWNvbXBsZXRlZDogKHRleHQ6IHN0cmluZylcbiAgICAgICogICAgIEVtbWl0ZWQgd2hlbiBnaGNpIHJlcG9ydHMgYW4gZXJyb3IgZm9yIGEgZ2l2ZW4gY29tbWFuZFxuICAgICAgKlxuICAgICAgKiBsaW5lLWNoYW5nZWQ6IChpbmZvOiBCcmVha0luZm8pXG4gICAgICAqICAgICBFbW1pdGVkIHdoZW4gdGhlIGxpbmUgdGhhdCB0aGUgZGVidWdnZXIgaXMgb24gY2hhbmdlc1xuICAgICAgKlxuICAgICAgKiBkZWJ1Zy1maW5pc2hlZDogKHZvaWQpXG4gICAgICAqICAgICBFbW1pdGVkIHdoZW4gdGhlIGRlYnVnZ2VyIGhhcyByZWFjaGVkIHRoZSBlbmQgb2YgdGhlIHByb2dyYW1cbiAgICAgICpcbiAgICAgICogY29uc29sZS1vdXRwdXQ6IChvdXRwdXQ6IHN0cmluZylcbiAgICAgICogICAgIEVtbWl0ZWQgd2hlbiB0aGUgZ2hjaSBoYXMgb3V0cHV0ZWQgc29tZXRoaW5nIHRvIHN0ZG91dCwgZXhjbHVkaW5nIHRoZSBleHRyYSBwcm9tcHRcbiAgICAgICpcbiAgICAgICogY29tbWFuZC1pc3N1ZWQ6IChjb21tYW5kOiBzdHJpbmcpXG4gICAgICAqICAgICBFbW1pdGVkIHdoZW4gYSBjb21tYW5kIGhhcyBiZWVuIGV4ZWN1dGVkXG4gICAgICAqL1xuICAgIHB1YmxpYyBlbWl0dGVyOiBHSENJRGVidWdFbWl0dGVyID0gbmV3IGF0b21BUEkuRW1pdHRlcigpXG5cbiAgICBwcml2YXRlIHN0YXJ0VGV4dDogUHJvbWlzZTxzdHJpbmc+XG5cbiAgICBjb25zdHJ1Y3RvciAoZ2hjaUNvbW1hbmQ9ICdnaGNpJywgZ2hjaUFyZ3M6IHN0cmluZ1tdID0gW10sIGZvbGRlcj86IHN0cmluZykge1xuXG4gICAgICAgIHRoaXMuZ2hjaUNtZCA9IGNwLnNwYXduKGdoY2lDb21tYW5kLCBnaGNpQXJncywge2N3ZDogZm9sZGVyLCBzaGVsbDogdHJ1ZX0pXG5cbiAgICAgICAgdGhpcy5naGNpQ21kLm9uKCdleGl0JywgKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5lbWl0dGVyLmVtaXQoJ2RlYnVnLWZpbmlzaGVkJywgdW5kZWZpbmVkKVxuICAgICAgICB9KVxuXG4gICAgICAgIHRoaXMuc3Rkb3V0ID0gdGhpcy5naGNpQ21kLnN0ZG91dFxuICAgICAgICB0aGlzLnN0ZGluID0gdGhpcy5naGNpQ21kLnN0ZGluXG4gICAgICAgIHRoaXMuc3RkZXJyID0gdGhpcy5naGNpQ21kLnN0ZGVyclxuICAgICAgICB0aGlzLnN0ZG91dC5vbigncmVhZGFibGUnLCAoKSA9PiB0aGlzLm9uU3Rkb3V0UmVhZGFibGUoKSlcbiAgICAgICAgdGhpcy5zdGRlcnIub24oJ3JlYWRhYmxlJywgKCkgPT4gdGhpcy5vblN0ZGVyclJlYWRhYmxlKCkpXG5cbiAgICAgICAgdGhpcy5hZGRSZWFkeUV2ZW50KClcblxuICAgICAgICB0aGlzLnN0YXJ0VGV4dCA9IHRoaXMucnVuKGA6c2V0IHByb21wdCBcIiVzPiAke3RoaXMuY29tbWFuZEZpbmlzaGVkU3RyaW5nfVwiYCwgZmFsc2UsIGZhbHNlLCBmYWxzZSwgdHJ1ZSlcbiAgICB9XG5cbiAgICBwcml2YXRlIGFkZFJlYWR5RXZlbnQgKCkge1xuICAgICAgICBjb25zdCBldmVudFN1YnMgPSBbXG4gICAgICAgICAgICAncGF1c2VkLW9uLWV4Y2VwdGlvbicsXG4gICAgICAgICAgICAnbGluZS1jaGFuZ2VkJyxcbiAgICAgICAgICAgICdkZWJ1Zy1maW5pc2hlZCcsXG4gICAgICAgIF1cblxuICAgICAgICBmb3IgKGNvbnN0IGV2ZW50TmFtZSBvZiBldmVudFN1YnMpe1xuICAgICAgICAgICAgKHRoaXMuZW1pdHRlci5vbiBhcyBhbnkpKGV2ZW50TmFtZSwgKCkgPT4gdGhpcy5lbWl0dGVyLmVtaXQoJ3JlYWR5JywgdW5kZWZpbmVkKSlcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHB1YmxpYyBkZXN0cm95ICgpIHtcbiAgICAgICAgdGhpcy5zdG9wKClcbiAgICB9XG5cbiAgICBwdWJsaWMgbG9hZE1vZHVsZSAobmFtZTogc3RyaW5nKSB7XG4gICAgICAgIGNvbnN0IGN3ZCA9IHBhdGguZGlybmFtZShuYW1lKVxuXG4gICAgICAgIHRoaXMucnVuKGA6Y2QgJHtjd2R9YClcbiAgICAgICAgdGhpcy5ydW4oYDpsb2FkICR7bmFtZX1gKVxuICAgIH1cblxuICAgIHB1YmxpYyBzZXRFeGNlcHRpb25CcmVha0xldmVsIChsZXZlbDogRXhjZXB0aW9uQnJlYWtMZXZlbHMpIHtcbiAgICAgICAgdGhpcy5ydW4oJzp1bnNldCAtZmJyZWFrLW9uLWV4Y2VwdGlvbicpXG4gICAgICAgIHRoaXMucnVuKCc6dW5zZXQgLWZicmVhay1vbi1lcnJvcicpXG5cbiAgICAgICAgaWYgKGxldmVsID09PSAnZXhjZXB0aW9ucycpIHtcbiAgICAgICAgICAgIHRoaXMucnVuKCc6c2V0IC1mYnJlYWstb24tZXhjZXB0aW9uJylcbiAgICAgICAgfSBlbHNlIGlmIChsZXZlbCA9PT0gJ2Vycm9ycycpIHtcbiAgICAgICAgICAgIHRoaXMucnVuKCc6c2V0IC1mYnJlYWstb24tZXJyb3InKVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHVibGljIGFkZEJyZWFrcG9pbnQgKGJyZWFrcG9pbnQ6IEJyZWFrcG9pbnQgfCBzdHJpbmcpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBicmVha3BvaW50ID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgdGhpcy5ydW4oYDpicmVhayAke2JyZWFrcG9pbnR9YClcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMucnVuKGA6YnJlYWsgJHticmVha3BvaW50LmZpbGV9ICR7YnJlYWtwb2ludC5saW5lfWApXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKiogcmVzb2x2ZWQgdGhlIGdpdmVuIGV4cHJlc3Npb24gdXNpbmcgOnByaW50LCByZXR1cm5zIG51bGwgaWYgaXQgaXMgaW52YWxpZFxuICAgICovXG4gICAgcHVibGljIGFzeW5jIHJlc29sdmVFeHByZXNzaW9uIChleHByZXNzaW9uOiBzdHJpbmcpIHtcbiAgICAgICAgaWYgKCEgZXhwcmVzc2lvbi50cmltKCkpIHtcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG4gICAgICAgIC8vIGV4cHJlc3Npb25zIGNhbid0IGhhdmUgbmV3IGxpbmVzXG4gICAgICAgIGlmIChleHByZXNzaW9uLmluZGV4T2YoJ1xcbicpICE9PSAtMSkge1xuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBnZXRFeHByZXNzaW9uID0gKGdoY2lPdXRwdXQ6IHN0cmluZywgdmFyaWFibGU6IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgY29uc3QgbWF0Y2hSZXN1bHQgPSBnaGNpT3V0cHV0Lm1hdGNoKC9bXiBdKiA9ICguKikvKVxuICAgICAgICAgICAgaWYgKCEgbWF0Y2hSZXN1bHQpIHsgcmV0dXJuIH1cbiAgICAgICAgICAgIHJldHVybiBtYXRjaFJlc3VsdFsxXVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gZm9yIHRoZSBjb2RlIGJlbG93LCBpZ25vcmUgZXJyb3JzXG4gICAgICAgIHRoaXMuaWdub3JlRXJyb3JzID0gdHJ1ZVxuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyB0cnkgcHJpbnRpbmcgZXhwcmVzc2lvblxuICAgICAgICAgICAgY29uc3QgcHJpbnRpbmdSZXN1bHQgPSBnZXRFeHByZXNzaW9uKFxuICAgICAgICAgICAgICBhd2FpdCB0aGlzLnJ1bihgOnByaW50ICR7ZXhwcmVzc2lvbn1gLCBmYWxzZSwgZmFsc2UsIGZhbHNlKSwgZXhwcmVzc2lvbilcbiAgICAgICAgICAgIGlmIChwcmludGluZ1Jlc3VsdCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHByaW50aW5nUmVzdWx0XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIGlmIHRoYXQgZmFpbHMgYXNzaWduIGl0IHRvIGEgdGVtcG9yYXJ5IHZhcmlhYmxlIGFuZCBldmFsdWF0ZSB0aGF0XG4gICAgICAgICAgICBsZXQgdGVtcFZhck51bSA9IDBcbiAgICAgICAgICAgIGxldCBwb3RlbnRpYWxUZW1wVmFyOiBzdHJpbmcgfCB1bmRlZmluZWRcbiAgICAgICAgICAgIGRvIHtcbiAgICAgICAgICAgICAgICBwb3RlbnRpYWxUZW1wVmFyID0gZ2V0RXhwcmVzc2lvbihcbiAgICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMucnVuKGA6cHJpbnQgdGVtcCR7dGVtcFZhck51bX1gLCBmYWxzZSwgZmFsc2UsIGZhbHNlKSwgYHRlbXAke3RlbXBWYXJOdW19YClcbiAgICAgICAgICAgICAgICB0ZW1wVmFyTnVtICs9IDFcbiAgICAgICAgICAgIH0gd2hpbGUgKHBvdGVudGlhbFRlbXBWYXIgIT09IHVuZGVmaW5lZClcblxuICAgICAgICAgICAgYXdhaXQgdGhpcy5ydW4oYGxldCB0ZW1wJHt0ZW1wVmFyTnVtfSA9ICR7ZXhwcmVzc2lvbn1gLCBmYWxzZSwgZmFsc2UsIGZhbHNlKVxuICAgICAgICAgICAgcmV0dXJuIGdldEV4cHJlc3Npb24oYXdhaXQgdGhpcy5ydW4oYDpwcmludCB0ZW1wJHt0ZW1wVmFyTnVtfWAsIGZhbHNlLCBmYWxzZSwgZmFsc2UpLCBgdGVtcCR7dGVtcFZhck51bX1gKVxuICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgdGhpcy5pZ25vcmVFcnJvcnMgPSBmYWxzZVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHVibGljIGZvcndhcmQgKCkge1xuICAgICAgICB0aGlzLnJ1bignOmZvcndhcmQnLCB0cnVlKVxuICAgIH1cblxuICAgIHB1YmxpYyBiYWNrICgpIHtcbiAgICAgICAgdGhpcy5ydW4oJzpiYWNrJywgdHJ1ZSlcbiAgICB9XG5cbiAgICBwdWJsaWMgc3RlcCAoKSB7XG4gICAgICAgIHRoaXMucnVuKCc6c3RlcCcsIHRydWUsIHRydWUpXG4gICAgfVxuXG4gICAgcHVibGljIHN0b3AgKCkge1xuICAgICAgICB0aGlzLnJ1bignOnF1aXQnKVxuICAgICAgICBzZXRUaW1lb3V0KFxuICAgICAgICAoKSA9PiB7XG4gICAgICAgICAgdGhpcy5naGNpQ21kLmtpbGwoKVxuICAgICAgICB9LFxuICAgICAgICAzMDAwKVxuICAgIH1cblxuICAgIHB1YmxpYyBjb250aW51ZSAoKSB7XG4gICAgICAgIHRoaXMucnVuKCc6Y29udGludWUnLCB0cnVlKVxuICAgIH1cblxuICAgIHB1YmxpYyBhc3luYyBhZGRlZEFsbExpc3RlbmVycyAoKSB7XG4gICAgICAgIHRoaXMuc3RhcnRUZXh0LnRoZW4oKHRleHQpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGZpcnN0UHJvbXB0ID0gdGV4dC5pbmRleE9mKCc+ICcpXG4gICAgICAgICAgICB0aGlzLmVtaXR0ZXIuZW1pdCgnY29uc29sZS1vdXRwdXQnLCB0ZXh0LnNsaWNlKDAsIGZpcnN0UHJvbXB0ICsgMikpXG4gICAgICAgIH0pXG4gICAgfVxuXG4gICAgYXN5bmMgc3RhcnREZWJ1ZyAobW9kdWxlTmFtZT86IHN0cmluZykge1xuICAgICAgICBtb2R1bGVOYW1lID0gbW9kdWxlTmFtZSB8fCAnbWFpbidcbiAgICAgICAgYXdhaXQgdGhpcy5ydW4oJzp0cmFjZSAnICsgbW9kdWxlTmFtZSwgdHJ1ZSwgdHJ1ZSlcbiAgICB9XG5cbiAgICBhc3luYyBnZXRCaW5kaW5ncyAoKSB7XG4gICAgICAgIGNvbnN0IG91dHB1dFN0ciA9IGF3YWl0IHRoaXMucnVuKCc6c2hvdyBiaW5kaW5ncycsIGZhbHNlLCBmYWxzZSwgZmFsc2UpXG4gICAgICAgIHJldHVybiBvdXRwdXRTdHIuc3BsaXQob3MuRU9MKVxuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgZ2V0SGlzdG9yeUxlbmd0aCAoKSB7XG4gICAgICAgIGNvbnN0IGhpc3RvcnlRdWVyeSA9IGF3YWl0IHRoaXMucnVuKCc6aGlzdG9yeSAxMDAnLCBmYWxzZSwgZmFsc2UsIGZhbHNlKVxuICAgICAgICBjb25zdCByZWdleCA9IC8tKFxcZCopLiooPzpcXG58XFxyfFxcclxcbik8ZW5kIG9mIGhpc3Rvcnk+JC9cblxuICAgICAgICBjb25zdCBtYXRjaFJlc3VsdCA9IGhpc3RvcnlRdWVyeS5tYXRjaChyZWdleClcbiAgICAgICAgaWYgKCEgbWF0Y2hSZXN1bHQpIHtcbiAgICAgICAgICAgIHJldHVybiAwXG4gICAgICAgIH0gZWxzZSBpZiAoaGlzdG9yeVF1ZXJ5LnNsaWNlKC0zKSA9PT0gJy4uLicpIHtcbiAgICAgICAgICAgIHJldHVybiBJbmZpbml0eSAvLyBoaXN0b3J5IGlzIHZlcnkgbG9uZ1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHBhcnNlSW50KG1hdGNoUmVzdWx0WzFdLCAxMClcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHN0YXRpYyBwYXVzZWRPbkVycm9yID0gU3ltYm9sKCdQYXVzZWQgb24gRXJyb3InKVxuICAgIHN0YXRpYyBmaW5pc2hlZERlYnVnZ2luZyA9IFN5bWJvbCgnRmluaXNoZWQgZGVidWdnaW5nJylcblxuICAgIHByaXZhdGUgcGFyc2VQcm9tcHQgKHN0ZE91dHB1dDogc3RyaW5nKTogQnJlYWtJbmZvIHwgU3ltYm9sIHtcbiAgICAgICAgY29uc3QgcGF0dGVybnMgPSBbe1xuICAgICAgICAgICAgcGF0dGVybjogL1xcWyg/OlstXFxkXSo6ICk/KC4qKTpcXCgoXFxkKyksKFxcZCspXFwpLVxcKChcXGQrKSwoXFxkKylcXCkuKlxcXS4qPiAkLyxcbiAgICAgICAgICAgIGZ1bmM6IChtYXRjaCkgPT4gKHtcbiAgICAgICAgICAgICAgICBmaWxlbmFtZTogbWF0Y2hbMV0sXG4gICAgICAgICAgICAgICAgcmFuZ2U6IFtbcGFyc2VJbnQobWF0Y2hbMl0sIDEwKSAtIDEsIHBhcnNlSW50KG1hdGNoWzNdLCAxMCkgLSAxXSxcbiAgICAgICAgICAgICAgICAgICAgW3BhcnNlSW50KG1hdGNoWzRdLCAxMCksIHBhcnNlSW50KG1hdGNoWzVdLCAxMCldXVxuICAgICAgICAgICAgfSlcbiAgICAgICAgfSwge1xuICAgICAgICAgICAgcGF0dGVybjogL1xcWyg/OlstXFxkXSo6ICk/KC4qKTooXFxkKik6KFxcZCopLShcXGQqKVxcXS4qPiAkLyxcbiAgICAgICAgICAgIGZ1bmM6IChtYXRjaCkgPT4gKHtcbiAgICAgICAgICAgICAgICAgICAgZmlsZW5hbWU6IG1hdGNoWzFdLFxuICAgICAgICAgICAgICAgICAgICByYW5nZTogW1twYXJzZUludChtYXRjaFsyXSwgMTApIC0gMSwgcGFyc2VJbnQobWF0Y2hbM10sIDEwKSAtIDFdLFxuICAgICAgICAgICAgICAgICAgICAgICAgW3BhcnNlSW50KG1hdGNoWzJdLCAxMCkgLSAxLCBwYXJzZUludChtYXRjaFs0XSwgMTApXV1cbiAgICAgICAgICAgIH0pXG4gICAgICAgIH0sIHtcbiAgICAgICAgICAgIHBhdHRlcm46IC9cXFs8ZXhjZXB0aW9uIHRocm93bj5cXF0uKj4gJC8sXG4gICAgICAgICAgICBmdW5jOiAoKSA9PiBHSENJRGVidWcucGF1c2VkT25FcnJvclxuICAgICAgICB9LCB7XG4gICAgICAgICAgICBwYXR0ZXJuOiAvLio+ICQvLFxuICAgICAgICAgICAgZnVuYzogKCkgPT4gR0hDSURlYnVnLmZpbmlzaGVkRGVidWdnaW5nXG4gICAgICAgIH1dIGFzIEFycmF5PHtwYXR0ZXJuOiBSZWdFeHA7IGZ1bmM6IChtYXRjaDogc3RyaW5nW10pID0+IEJyZWFrSW5mbyB8IFN5bWJvbH0+XG4gICAgICAgIGZvciAoY29uc3QgcGF0dGVybiBvZiBwYXR0ZXJucyl7XG4gICAgICAgICAgICBjb25zdCBtYXRjaFJlc3VsdCA9IHN0ZE91dHB1dC5tYXRjaChwYXR0ZXJuLnBhdHRlcm4pXG4gICAgICAgICAgICBpZiAobWF0Y2hSZXN1bHQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGF0dGVybi5mdW5jKG1hdGNoUmVzdWx0KVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignQ2Fubm90IHJlYWQgcHJvbXB0OiBcXG4nICsgc3RkT3V0cHV0KVxuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgZW1pdFN0YXR1c0NoYW5nZXMgKHByb21wdDogc3RyaW5nLCBtYWluQm9keTogc3RyaW5nLCBlbWl0SGlzdG9yeUxlbmd0aDogYm9vbGVhbikge1xuICAgICAgICBjb25zdCByZXN1bHQgPSB0aGlzLnBhcnNlUHJvbXB0KHByb21wdClcblxuICAgICAgICBpZiAocmVzdWx0ID09PSBHSENJRGVidWcucGF1c2VkT25FcnJvcikge1xuICAgICAgICAgICAgY29uc3QgaGlzdG9yeUxlbmd0aCA9IGF3YWl0IHRoaXMuZ2V0SGlzdG9yeUxlbmd0aCgpXG5cbiAgICAgICAgICAgIHRoaXMuZW1pdHRlci5lbWl0KCdwYXVzZWQtb24tZXhjZXB0aW9uJywge1xuICAgICAgICAgICAgICAgIGhpc3RvcnlMZW5ndGgsXG4gICAgICAgICAgICAgICAgbG9jYWxCaW5kaW5nczogbWFpbkJvZHkuc3BsaXQoJ1xcbicpLnNsaWNlKDEpXG4gICAgICAgICAgICB9KVxuICAgICAgICB9IGVsc2UgaWYgKHJlc3VsdCA9PT0gR0hDSURlYnVnLmZpbmlzaGVkRGVidWdnaW5nKSB7XG4gICAgICAgICAgICB0aGlzLmVtaXR0ZXIuZW1pdCgnZGVidWctZmluaXNoZWQnLCB1bmRlZmluZWQpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zdCBicmVha0luZm8gPSByZXN1bHQgYXMgQnJlYWtJbmZvXG5cbiAgICAgICAgICAgIGJyZWFrSW5mby5sb2NhbEJpbmRpbmdzID0gYXdhaXQgdGhpcy5nZXRCaW5kaW5ncygpXG5cbiAgICAgICAgICAgIGlmIChlbWl0SGlzdG9yeUxlbmd0aCkge1xuICAgICAgICAgICAgICAgIGJyZWFrSW5mby5oaXN0b3J5TGVuZ3RoID0gYXdhaXQgdGhpcy5nZXRIaXN0b3J5TGVuZ3RoKClcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy5lbWl0dGVyLmVtaXQoJ2xpbmUtY2hhbmdlZCcsIGJyZWFrSW5mbylcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgaWdub3JlRXJyb3JzID0gZmFsc2VcbiAgICBwcml2YXRlIGN1cnJlbnRTdGRlcnJPdXRwdXQgPSAnJ1xuICAgIHByaXZhdGUgb25TdGRlcnJSZWFkYWJsZSAoKSB7XG4gICAgICAgIGNvbnN0IHN0ZGVyck91dHB1dDogQnVmZmVyID0gdGhpcy5zdGRlcnIucmVhZCgpXG4gICAgICAgIGlmICghIHN0ZGVyck91dHB1dCB8fCB0aGlzLmlnbm9yZUVycm9ycykge1xuICAgICAgICAgICAgcmV0dXJuIC8vIHRoaXMgaXMgdGhlIGVuZCBvZiB0aGUgaW5wdXQgc3RyZWFtXG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmVtaXR0ZXIuZW1pdCgnZXJyb3InLCBzdGRlcnJPdXRwdXQudG9TdHJpbmcoKSlcblxuICAgICAgICBpZiAodGhpcy5jdXJyZW50U3RkZXJyT3V0cHV0ID09PSAnJykge1xuICAgICAgICAgICAgY29uc3QgZGlzcCA9IHRoaXMuZW1pdHRlci5vbigncmVhZHknLCAoKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5lbWl0dGVyLmVtaXQoJ2Vycm9yLWNvbXBsZXRlZCcsIHRoaXMuY3VycmVudFN0ZGVyck91dHB1dClcbiAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRTdGRlcnJPdXRwdXQgPSAnJ1xuICAgICAgICAgICAgICAgIGRpc3AuZGlzcG9zZSgpXG4gICAgICAgICAgICB9KVxuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5jdXJyZW50U3RkZXJyT3V0cHV0ICs9IHN0ZGVyck91dHB1dC50b1N0cmluZygpXG4gICAgfVxuXG4gICAgcHJpdmF0ZSBjdXJyZW50Q29tbWFuZEJ1ZmZlciA9ICcnXG4gICAgcHJpdmF0ZSBjb21tYW5kcyA9IFtdIGFzIENvbW1hbmRbXVxuICAgIHByaXZhdGUgY3VycmVudENvbW1hbmQ/OiBDb21tYW5kXG4gICAgcHJpdmF0ZSBjb21tYW5kRmluaXNoZWRTdHJpbmcgPSAnY29tbWFuZF9maW5pc2hfbzR1QjF3aGFndGVxRTh4QnE5b3EnXG5cbiAgICBwcml2YXRlIG9uU3Rkb3V0UmVhZGFibGUgKCkge1xuICAgICAgICBjb25zdCBjdXJyZW50U3RyaW5nID0gKHRoaXMuc3Rkb3V0LnJlYWQoKSB8fCAnJykudG9TdHJpbmcoKVxuXG4gICAgICAgIHRoaXMuY3VycmVudENvbW1hbmRCdWZmZXIgKz0gY3VycmVudFN0cmluZ1xuXG4gICAgICAgIGNvbnN0IGZpbmlzaFN0cmluZ1Bvc2l0aW9uID0gdGhpcy5jdXJyZW50Q29tbWFuZEJ1ZmZlci5zZWFyY2godGhpcy5jb21tYW5kRmluaXNoZWRTdHJpbmcpXG4gICAgICAgIGlmIChmaW5pc2hTdHJpbmdQb3NpdGlvbiAhPT0gLTEpIHtcbiAgICAgICAgICAgIGNvbnN0IG91dHB1dFN0cmluZyA9IHRoaXMuY3VycmVudENvbW1hbmRCdWZmZXIuc2xpY2UoMCwgZmluaXNoU3RyaW5nUG9zaXRpb24pXG5cbiAgICAgICAgICAgIGlmICh0aGlzLmN1cnJlbnRDb21tYW5kKSB7XG4gICAgICAgICAgICAgIGlmICh0aGlzLmN1cnJlbnRDb21tYW5kLmVtaXRDb21tYW5kT3V0cHV0KSB7XG4gICAgICAgICAgICAgICAgICB0aGlzLmVtaXR0ZXIuZW1pdCgnY29uc29sZS1vdXRwdXQnLCBvdXRwdXRTdHJpbmcpXG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRDb21tYW5kLm9uRmluaXNoKG91dHB1dFN0cmluZylcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gVGFrZSB0aGUgZmluaXNoZWQgc3RyaW5nIG9mZiB0aGUgYnVmZmVyIGFuZCBwcm9jZXNzIHRoZSBuZXh0IG91cHV0XG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRDb21tYW5kQnVmZmVyID0gdGhpcy5jdXJyZW50Q29tbWFuZEJ1ZmZlci5zbGljZShcbiAgICAgICAgICAgICAgICBmaW5pc2hTdHJpbmdQb3NpdGlvbiArIHRoaXMuY29tbWFuZEZpbmlzaGVkU3RyaW5nLmxlbmd0aClcbiAgICAgICAgICAgIHRoaXMub25TdGRvdXRSZWFkYWJsZSgpXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwdWJsaWMgYXN5bmMgcnVuIChjb21tYW5kVGV4dDogc3RyaW5nLFxuICAgICAgICAgICAgICAgICAgICAgIGVtaXRTdGF0dXNDaGFuZ2VzOiBib29sZWFuID0gZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgICAgZW1pdEhpc3RvcnlMZW5ndGg6IGJvb2xlYW4gPSBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgICBlbWl0Q29tbWFuZE91dHB1dDogYm9vbGVhbiA9IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICAgZnVsZmlsV2l0aFByb21wdDogYm9vbGVhbiA9IGZhbHNlKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICAgICAgY29uc3Qgc2hpZnRBbmRSdW5Db21tYW5kID0gKCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgY29tbWFuZCA9IHRoaXMuY29tbWFuZHMuc2hpZnQoKVxuXG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRDb21tYW5kID0gY29tbWFuZFxuXG4gICAgICAgICAgICBpZiAoY29tbWFuZCkge1xuICAgICAgICAgICAgICBpZiAoY29tbWFuZC5lbWl0Q29tbWFuZE91dHB1dCkge1xuICAgICAgICAgICAgICAgICAgdGhpcy5lbWl0dGVyLmVtaXQoJ2NvbW1hbmQtaXNzdWVkJywgY29tbWFuZC50ZXh0KVxuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgdGhpcy5zdGRpbi53cml0ZShjb21tYW5kLnRleHQgKyBvcy5FT0wpXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgY3VycmVudFByb21pc2U6IFByb21pc2U8c3RyaW5nPlxuICAgICAgICByZXR1cm4gY3VycmVudFByb21pc2UgPSBuZXcgUHJvbWlzZTxzdHJpbmc+KChmdWxmaWwpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGNvbW1hbmQ6IENvbW1hbmQgPSB7XG4gICAgICAgICAgICAgICAgdGV4dDogY29tbWFuZFRleHQsXG4gICAgICAgICAgICAgICAgZW1pdENvbW1hbmRPdXRwdXQsXG4gICAgICAgICAgICAgICAgZnVsZmlsV2l0aFByb21wdCxcbiAgICAgICAgICAgICAgICBvbkZpbmlzaDogYXN5bmMgKG91dHB1dCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRDb21tYW5kID0gdW5kZWZpbmVkXG5cbiAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gX2Z1bGZpbCAobm9Qcm9tcHQ6IHN0cmluZykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGZ1bGZpbFdpdGhQcm9tcHQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmdWxmaWwob3V0cHV0KVxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmdWxmaWwobm9Qcm9tcHQpXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBjb25zdCBsYXN0RW5kT2ZMaW5lUG9zID0gb3V0cHV0Lmxhc3RJbmRleE9mKG9zLkVPTClcblxuICAgICAgICAgICAgICAgICAgICBpZiAobGFzdEVuZE9mTGluZVBvcyA9PT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8qaS5lLiBubyBvdXRwdXQgaGFzIGJlZW4gcHJvZHVjZWQqL1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVtaXRTdGF0dXNDaGFuZ2VzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5lbWl0U3RhdHVzQ2hhbmdlcyhvdXRwdXQsICcnLCBlbWl0SGlzdG9yeUxlbmd0aCkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIF9mdWxmaWwoJycpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgX2Z1bGZpbCgnJylcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHByb21wdEJlZ2luUG9zaXRpb24gPSBsYXN0RW5kT2ZMaW5lUG9zICsgb3MuRU9MLmxlbmd0aFxuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZW1pdFN0YXR1c0NoYW5nZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmVtaXRTdGF0dXNDaGFuZ2VzKG91dHB1dC5zbGljZShwcm9tcHRCZWdpblBvc2l0aW9uLCBvdXRwdXQubGVuZ3RoKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG91dHB1dC5zbGljZSgwLCBsYXN0RW5kT2ZMaW5lUG9zKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVtaXRIaXN0b3J5TGVuZ3RoKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgX2Z1bGZpbChvdXRwdXQuc2xpY2UoMCwgbGFzdEVuZE9mTGluZVBvcykpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgX2Z1bGZpbChvdXRwdXQuc2xpY2UoMCwgbGFzdEVuZE9mTGluZVBvcykpXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBhd2FpdCBjdXJyZW50UHJvbWlzZVxuXG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLmNvbW1hbmRzLmxlbmd0aCAhPT0gMCAmJiB0aGlzLmN1cnJlbnRDb21tYW5kID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNoaWZ0QW5kUnVuQ29tbWFuZCgpXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMuY29tbWFuZHMucHVzaChjb21tYW5kKVxuXG4gICAgICAgICAgICBpZiAodGhpcy5jdXJyZW50Q29tbWFuZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgc2hpZnRBbmRSdW5Db21tYW5kKClcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICB9XG59XG4iXX0=