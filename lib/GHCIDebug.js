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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiR0hDSURlYnVnLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2xpYi9HSENJRGVidWcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQUFBLG9DQUFvQztBQUVwQyx5QkFBeUI7QUFDekIsNkJBQTZCO0FBQzdCLGdDQUFnQztBQWdEaEM7SUFzQ0ksWUFBYSxXQUFXLEdBQUUsTUFBTSxFQUFFLFdBQXFCLEVBQUUsRUFBRSxNQUFlO1FBSm5FLFlBQU8sR0FBcUIsSUFBSSxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUE7UUE2TmhELGlCQUFZLEdBQUcsS0FBSyxDQUFBO1FBQ3BCLHdCQUFtQixHQUFHLEVBQUUsQ0FBQTtRQW9CeEIseUJBQW9CLEdBQUcsRUFBRSxDQUFBO1FBQ3pCLGFBQVEsR0FBRyxFQUFlLENBQUE7UUFFMUIsMEJBQXFCLEdBQUcscUNBQXFDLENBQUE7UUEvT2pFLElBQUksQ0FBQyxPQUFPLEdBQUcsRUFBRSxDQUFDLEtBQUssQ0FBQyxXQUFXLEVBQUUsUUFBUSxFQUFFLEVBQUMsR0FBRyxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFDLENBQUMsQ0FBQTtRQUUxRSxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxNQUFNLEVBQUU7WUFDcEIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsU0FBUyxDQUFDLENBQUE7UUFDbEQsQ0FBQyxDQUFDLENBQUE7UUFFRixJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFBO1FBQ2pDLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUE7UUFDL0IsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQTtRQUNqQyxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxVQUFVLEVBQUUsTUFBTSxJQUFJLENBQUMs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cCA9IHJlcXVpcmUoJ2NoaWxkX3Byb2Nlc3MnKVxuaW1wb3J0IHN0cmVhbSA9IHJlcXVpcmUoJ3N0cmVhbScpXG5pbXBvcnQgb3MgPSByZXF1aXJlKCdvcycpXG5pbXBvcnQgcGF0aCA9IHJlcXVpcmUoJ3BhdGgnKVxuaW1wb3J0IGF0b21BUEkgPSByZXF1aXJlKCdhdG9tJylcblxuZXhwb3J0IGludGVyZmFjZSBCcmVha0luZm8ge1xuICAgIGZpbGVuYW1lOiBzdHJpbmdcbiAgICByYW5nZTogW1tudW1iZXIsIG51bWJlcl0sIFtudW1iZXIsIG51bWJlcl1dXG4gICAgaGlzdG9yeUxlbmd0aD86IG51bWJlclxuICAgIGxvY2FsQmluZGluZ3M6IHN0cmluZ1tdXG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgRXhjZXB0aW9uSW5mbyB7XG4gICAgaGlzdG9yeUxlbmd0aDogbnVtYmVyXG4gICAgbG9jYWxCaW5kaW5nczogc3RyaW5nW11cbn1cblxuaW50ZXJmYWNlIEVtaXR0ZXJPbk1hcCB7XG4gICdyZWFkeSc6ICgpID0+IGFueVxuICAnZGVidWctZmluaXNoZWQnOiAoKSA9PiBhbnlcbiAgJ3BhdXNlZC1vbi1leGNlcHRpb24nOiAoaW5mbzogRXhjZXB0aW9uSW5mbykgPT4gYW55XG4gICdlcnJvcic6ICh0ZXh0OiBzdHJpbmcpID0+IGFueVxuICAnZXJyb3ItY29tcGxldGVkJzogKHRleHQ6IHN0cmluZykgPT4gYW55XG4gICdsaW5lLWNoYW5nZWQnOiAoaW5mbzogQnJlYWtJbmZvKSA9PiBhbnlcbiAgJ2NvbnNvbGUtb3V0cHV0JzogKG91dHB1dDogc3RyaW5nKSA9PiBhbnlcbiAgJ2NvbW1hbmQtaXNzdWVkJzogKGNvbW1hbmQ6IHN0cmluZykgPT4gYW55XG59XG5cbmludGVyZmFjZSBFbWl0dGVyRW1pdE1hcCB7XG4gICdwYXVzZWQtb24tZXhjZXB0aW9uJzogRXhjZXB0aW9uSW5mb1xuICAncmVhZHknOiBFeGNlcHRpb25JbmZvIHwgdW5kZWZpbmVkXG4gICdlcnJvcic6IHN0cmluZ1xuICAnZXJyb3ItY29tcGxldGVkJzogc3RyaW5nXG4gICdsaW5lLWNoYW5nZWQnOiBCcmVha0luZm9cbiAgJ2RlYnVnLWZpbmlzaGVkJzogYW55XG4gICdjb25zb2xlLW91dHB1dCc6IHN0cmluZ1xuICAnY29tbWFuZC1pc3N1ZWQnOiBzdHJpbmdcbn1cblxuZXhwb3J0IGludGVyZmFjZSBHSENJRGVidWdFbWl0dGVyIGV4dGVuZHMgYXRvbUFQSS5FbWl0dGVyIHtcbiAgICBvbjxLIGV4dGVuZHMga2V5b2YgRW1pdHRlck9uTWFwPiAoZXZlbnROYW1lOiBLLCBoYW5kbGVyOiBFbWl0dGVyT25NYXBbS10pOiBhdG9tQVBJLkRpc3Bvc2FibGVcbiAgICBlbWl0PEsgZXh0ZW5kcyBrZXlvZiBFbWl0dGVyRW1pdE1hcD4gKGV2ZW50TmFtZTogSywgdmFsdWU6IEVtaXR0ZXJFbWl0TWFwW0tdKTogdm9pZFxufVxuXG5pbnRlcmZhY2UgQ29tbWFuZCB7XG4gICAgdGV4dDogc3RyaW5nXG4gICAgZW1pdENvbW1hbmRPdXRwdXQ6IGJvb2xlYW5cbiAgICBmdWxmaWxXaXRoUHJvbXB0OiBib29sZWFuXG4gICAgb25GaW5pc2g6IChvdXRwdXQ6IHN0cmluZykgPT4gYW55XG59XG5cbmV4cG9ydCBjbGFzcyBHSENJRGVidWcge1xuICAgIHByaXZhdGUgZ2hjaUNtZDogY3AuQ2hpbGRQcm9jZXNzXG4gICAgc3Rkb3V0OiBzdHJlYW0uUmVhZGFibGVcbiAgICBzdGRpbjogc3RyZWFtLldyaXRhYmxlXG4gICAgc3RkZXJyOiBzdHJlYW0uUmVhZGFibGVcblxuICAgIC8qKiBFdmVudCBIYW5kbGVyXG4gICAgICAqXG4gICAgICAqIEV2ZW50czpcbiAgICAgICpcbiAgICAgICogcmVhZHk6ICgpXG4gICAgICAqICAgICBFbW1pdGVkIHdoZW4gZ2hjaSBoYXMganVzdCBzdG9wcGVkIGV4ZWN1dGluZyBhIGNvbW1hbmRcbiAgICAgICpcbiAgICAgICogcGF1c2VkLW9uLWV4Y2VwdGlvbjogKGluZm86IEV4Y2VwdGlvbkluZm8pXG4gICAgICAqICAgICBFbW1pdGVkIHdoZW4gdGhlIGRlYnVnZ2VyIGlzIGF0IGFuIGV4Y2VwdGlvblxuICAgICAgKlxuICAgICAgKiBlcnJvcjogKHRleHQ6IHN0cmluZylcbiAgICAgICogICAgIEVtbWl0ZWQgd2hlbiBzdGRlcnIgaGFzIGlucHV0XG4gICAgICAqXG4gICAgICAqIGVycm9yLWNvbXBsZXRlZDogKHRleHQ6IHN0cmluZylcbiAgICAgICogICAgIEVtbWl0ZWQgd2hlbiBnaGNpIHJlcG9ydHMgYW4gZXJyb3IgZm9yIGEgZ2l2ZW4gY29tbWFuZFxuICAgICAgKlxuICAgICAgKiBsaW5lLWNoYW5nZWQ6IChpbmZvOiBCcmVha0luZm8pXG4gICAgICAqICAgICBFbW1pdGVkIHdoZW4gdGhlIGxpbmUgdGhhdCB0aGUgZGVidWdnZXIgaXMgb24gY2hhbmdlc1xuICAgICAgKlxuICAgICAgKiBkZWJ1Zy1maW5pc2hlZDogKHZvaWQpXG4gICAgICAqICAgICBFbW1pdGVkIHdoZW4gdGhlIGRlYnVnZ2VyIGhhcyByZWFjaGVkIHRoZSBlbmQgb2YgdGhlIHByb2dyYW1cbiAgICAgICpcbiAgICAgICogY29uc29sZS1vdXRwdXQ6IChvdXRwdXQ6IHN0cmluZylcbiAgICAgICogICAgIEVtbWl0ZWQgd2hlbiB0aGUgZ2hjaSBoYXMgb3V0cHV0ZWQgc29tZXRoaW5nIHRvIHN0ZG91dCwgZXhjbHVkaW5nIHRoZSBleHRyYSBwcm9tcHRcbiAgICAgICpcbiAgICAgICogY29tbWFuZC1pc3N1ZWQ6IChjb21tYW5kOiBzdHJpbmcpXG4gICAgICAqICAgICBFbW1pdGVkIHdoZW4gYSBjb21tYW5kIGhhcyBiZWVuIGV4ZWN1dGVkXG4gICAgICAqL1xuICAgIHB1YmxpYyBlbWl0dGVyOiBHSENJRGVidWdFbWl0dGVyID0gbmV3IGF0b21BUEkuRW1pdHRlcigpXG5cbiAgICBwcml2YXRlIHN0YXJ0VGV4dDogUHJvbWlzZTxzdHJpbmc+XG5cbiAgICBjb25zdHJ1Y3RvciAoZ2hjaUNvbW1hbmQ9ICdnaGNpJywgZ2hjaUFyZ3M6IHN0cmluZ1tdID0gW10sIGZvbGRlcj86IHN0cmluZykge1xuXG4gICAgICAgIHRoaXMuZ2hjaUNtZCA9IGNwLnNwYXduKGdoY2lDb21tYW5kLCBnaGNpQXJncywge2N3ZDogZm9sZGVyLCBzaGVsbDogdHJ1ZX0pXG5cbiAgICAgICAgdGhpcy5naGNpQ21kLm9uKCdleGl0JywgKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5lbWl0dGVyLmVtaXQoJ2RlYnVnLWZpbmlzaGVkJywgdW5kZWZpbmVkKVxuICAgICAgICB9KVxuXG4gICAgICAgIHRoaXMuc3Rkb3V0ID0gdGhpcy5naGNpQ21kLnN0ZG91dFxuICAgICAgICB0aGlzLnN0ZGluID0gdGhpcy5naGNpQ21kLnN0ZGluXG4gICAgICAgIHRoaXMuc3RkZXJyID0gdGhpcy5naGNpQ21kLnN0ZGVyclxuICAgICAgICB0aGlzLnN0ZG91dC5vbigncmVhZGFibGUnLCAoKSA9PiB0aGlzLm9uU3Rkb3V0UmVhZGFibGUoKSlcbiAgICAgICAgdGhpcy5zdGRlcnIub24oJ3JlYWRhYmxlJywgKCkgPT4gdGhpcy5vblN0ZGVyclJlYWRhYmxlKCkpXG5cbiAgICAgICAgdGhpcy5hZGRSZWFkeUV2ZW50KClcblxuICAgICAgICB0aGlzLnN0YXJ0VGV4dCA9IHRoaXMucnVuKGA6c2V0IHByb21wdCBcIiVzPiAke3RoaXMuY29tbWFuZEZpbmlzaGVkU3RyaW5nfVwiYCwgZmFsc2UsIGZhbHNlLCBmYWxzZSwgdHJ1ZSlcbiAgICB9XG5cbiAgICBwcml2YXRlIGFkZFJlYWR5RXZlbnQgKCkge1xuICAgICAgICBjb25zdCBldmVudFN1YnMgPSBbXG4gICAgICAgICAgICAncGF1c2VkLW9uLWV4Y2VwdGlvbicsXG4gICAgICAgICAgICAnbGluZS1jaGFuZ2VkJyxcbiAgICAgICAgICAgICdkZWJ1Zy1maW5pc2hlZCcsXG4gICAgICAgIF1cblxuICAgICAgICBmb3IgKGNvbnN0IGV2ZW50TmFtZSBvZiBldmVudFN1YnMpe1xuICAgICAgICAgICAgKHRoaXMuZW1pdHRlci5vbiBhcyBhbnkpKGV2ZW50TmFtZSwgKCkgPT4gdGhpcy5lbWl0dGVyLmVtaXQoJ3JlYWR5JywgdW5kZWZpbmVkKSlcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHB1YmxpYyBkZXN0cm95ICgpIHtcbiAgICAgICAgdGhpcy5zdG9wKClcbiAgICB9XG5cbiAgICBwdWJsaWMgbG9hZE1vZHVsZSAobmFtZTogc3RyaW5nKSB7XG4gICAgICAgIGNvbnN0IGN3ZCA9IHBhdGguZGlybmFtZShuYW1lKVxuXG4gICAgICAgIHRoaXMucnVuKGA6Y2QgJHtjd2R9YClcbiAgICAgICAgdGhpcy5ydW4oYDpsb2FkICR7bmFtZX1gKVxuICAgIH1cblxuICAgIHB1YmxpYyBzZXRFeGNlcHRpb25CcmVha0xldmVsIChsZXZlbDogRXhjZXB0aW9uQnJlYWtMZXZlbHMpIHtcbiAgICAgICAgdGhpcy5ydW4oJzp1bnNldCAtZmJyZWFrLW9uLWV4Y2VwdGlvbicpXG4gICAgICAgIHRoaXMucnVuKCc6dW5zZXQgLWZicmVhay1vbi1lcnJvcicpXG5cbiAgICAgICAgaWYgKGxldmVsID09PSAnZXhjZXB0aW9ucycpIHtcbiAgICAgICAgICAgIHRoaXMucnVuKCc6c2V0IC1mYnJlYWstb24tZXhjZXB0aW9uJylcbiAgICAgICAgfSBlbHNlIGlmIChsZXZlbCA9PT0gJ2Vycm9ycycpIHtcbiAgICAgICAgICAgIHRoaXMucnVuKCc6c2V0IC1mYnJlYWstb24tZXJyb3InKVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHVibGljIGFkZEJyZWFrcG9pbnQgKGJyZWFrcG9pbnQ6IEJyZWFrcG9pbnQgfCBzdHJpbmcpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBicmVha3BvaW50ID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgdGhpcy5ydW4oYDpicmVhayAke2JyZWFrcG9pbnR9YClcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMucnVuKGA6YnJlYWsgJHticmVha3BvaW50LmZpbGV9ICR7YnJlYWtwb2ludC5saW5lfWApXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKiogcmVzb2x2ZWQgdGhlIGdpdmVuIGV4cHJlc3Npb24gdXNpbmcgOnByaW50LCByZXR1cm5zIG51bGwgaWYgaXQgaXMgaW52YWxpZFxuICAgICovXG4gICAgcHVibGljIGFzeW5jIHJlc29sdmVFeHByZXNzaW9uIChleHByZXNzaW9uOiBzdHJpbmcpIHtcbiAgICAgICAgLy8gZXhwcmVzc2lvbnMgY2FuJ3QgaGF2ZSBuZXcgbGluZXNcbiAgICAgICAgaWYgKGV4cHJlc3Npb24uaW5kZXhPZignXFxuJykgIT09IC0xKSB7XG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGdldEV4cHJlc3Npb24gPSAoZ2hjaU91dHB1dDogc3RyaW5nLCB2YXJpYWJsZTogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBtYXRjaFJlc3VsdCA9IGdoY2lPdXRwdXQubWF0Y2goL1teIF0qID0gKC4qKS8pXG4gICAgICAgICAgICBpZiAoISBtYXRjaFJlc3VsdCkgeyByZXR1cm4gfVxuICAgICAgICAgICAgcmV0dXJuIG1hdGNoUmVzdWx0WzFdXG4gICAgICAgIH1cblxuICAgICAgICAvLyBmb3IgdGhlIGNvZGUgYmVsb3csIGlnbm9yZSBlcnJvcnNcbiAgICAgICAgdGhpcy5pZ25vcmVFcnJvcnMgPSB0cnVlXG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIHRyeSBwcmludGluZyBleHByZXNzaW9uXG4gICAgICAgICAgICBjb25zdCBwcmludGluZ1Jlc3VsdCA9IGdldEV4cHJlc3Npb24oXG4gICAgICAgICAgICAgIGF3YWl0IHRoaXMucnVuKGA6cHJpbnQgJHtleHByZXNzaW9ufWAsIGZhbHNlLCBmYWxzZSwgZmFsc2UpLCBleHByZXNzaW9uKVxuICAgICAgICAgICAgaWYgKHByaW50aW5nUmVzdWx0ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcHJpbnRpbmdSZXN1bHRcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gaWYgdGhhdCBmYWlscyBhc3NpZ24gaXQgdG8gYSB0ZW1wb3JhcnkgdmFyaWFibGUgYW5kIGV2YWx1YXRlIHRoYXRcbiAgICAgICAgICAgIGxldCB0ZW1wVmFyTnVtID0gMFxuICAgICAgICAgICAgbGV0IHBvdGVudGlhbFRlbXBWYXI6IHN0cmluZyB8IHVuZGVmaW5lZFxuICAgICAgICAgICAgZG8ge1xuICAgICAgICAgICAgICAgIHBvdGVudGlhbFRlbXBWYXIgPSBnZXRFeHByZXNzaW9uKFxuICAgICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5ydW4oYDpwcmludCB0ZW1wJHt0ZW1wVmFyTnVtfWAsIGZhbHNlLCBmYWxzZSwgZmFsc2UpLCBgdGVtcCR7dGVtcFZhck51bX1gKVxuICAgICAgICAgICAgICAgIHRlbXBWYXJOdW0gKz0gMVxuICAgICAgICAgICAgfSB3aGlsZSAocG90ZW50aWFsVGVtcFZhciAhPT0gdW5kZWZpbmVkKVxuXG4gICAgICAgICAgICBhd2FpdCB0aGlzLnJ1bihgbGV0IHRlbXAke3RlbXBWYXJOdW19ID0gJHtleHByZXNzaW9ufWAsIGZhbHNlLCBmYWxzZSwgZmFsc2UpXG4gICAgICAgICAgICByZXR1cm4gZ2V0RXhwcmVzc2lvbihhd2FpdCB0aGlzLnJ1bihgOnByaW50IHRlbXAke3RlbXBWYXJOdW19YCwgZmFsc2UsIGZhbHNlLCBmYWxzZSksIGB0ZW1wJHt0ZW1wVmFyTnVtfWApXG4gICAgICAgIH0gZmluYWxseSB7XG4gICAgICAgICAgICB0aGlzLmlnbm9yZUVycm9ycyA9IGZhbHNlXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwdWJsaWMgZm9yd2FyZCAoKSB7XG4gICAgICAgIHRoaXMucnVuKCc6Zm9yd2FyZCcsIHRydWUpXG4gICAgfVxuXG4gICAgcHVibGljIGJhY2sgKCkge1xuICAgICAgICB0aGlzLnJ1bignOmJhY2snLCB0cnVlKVxuICAgIH1cblxuICAgIHB1YmxpYyBzdGVwICgpIHtcbiAgICAgICAgdGhpcy5ydW4oJzpzdGVwJywgdHJ1ZSwgdHJ1ZSlcbiAgICB9XG5cbiAgICBwdWJsaWMgc3RvcCAoKSB7XG4gICAgICAgIHRoaXMucnVuKCc6cXVpdCcpXG4gICAgICAgIHNldFRpbWVvdXQoXG4gICAgICAgICgpID0+IHtcbiAgICAgICAgICB0aGlzLmdoY2lDbWQua2lsbCgpXG4gICAgICAgIH0sXG4gICAgICAgIDMwMDApXG4gICAgfVxuXG4gICAgcHVibGljIGNvbnRpbnVlICgpIHtcbiAgICAgICAgdGhpcy5ydW4oJzpjb250aW51ZScsIHRydWUpXG4gICAgfVxuXG4gICAgcHVibGljIGFzeW5jIGFkZGVkQWxsTGlzdGVuZXJzICgpIHtcbiAgICAgICAgdGhpcy5zdGFydFRleHQudGhlbigodGV4dCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgZmlyc3RQcm9tcHQgPSB0ZXh0LmluZGV4T2YoJz4gJylcbiAgICAgICAgICAgIHRoaXMuZW1pdHRlci5lbWl0KCdjb25zb2xlLW91dHB1dCcsIHRleHQuc2xpY2UoMCwgZmlyc3RQcm9tcHQgKyAyKSlcbiAgICAgICAgfSlcbiAgICB9XG5cbiAgICBhc3luYyBzdGFydERlYnVnIChtb2R1bGVOYW1lPzogc3RyaW5nKSB7XG4gICAgICAgIG1vZHVsZU5hbWUgPSBtb2R1bGVOYW1lIHx8ICdtYWluJ1xuICAgICAgICBhd2FpdCB0aGlzLnJ1bignOnRyYWNlICcgKyBtb2R1bGVOYW1lLCB0cnVlLCB0cnVlKVxuICAgIH1cblxuICAgIGFzeW5jIGdldEJpbmRpbmdzICgpIHtcbiAgICAgICAgY29uc3Qgb3V0cHV0U3RyID0gYXdhaXQgdGhpcy5ydW4oJzpzaG93IGJpbmRpbmdzJywgZmFsc2UsIGZhbHNlLCBmYWxzZSlcbiAgICAgICAgcmV0dXJuIG91dHB1dFN0ci5zcGxpdChvcy5FT0wpXG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBnZXRIaXN0b3J5TGVuZ3RoICgpIHtcbiAgICAgICAgY29uc3QgaGlzdG9yeVF1ZXJ5ID0gYXdhaXQgdGhpcy5ydW4oJzpoaXN0b3J5IDEwMCcsIGZhbHNlLCBmYWxzZSwgZmFsc2UpXG4gICAgICAgIGNvbnN0IHJlZ2V4ID0gLy0oXFxkKikuKig/OlxcbnxcXHJ8XFxyXFxuKTxlbmQgb2YgaGlzdG9yeT4kL1xuXG4gICAgICAgIGNvbnN0IG1hdGNoUmVzdWx0ID0gaGlzdG9yeVF1ZXJ5Lm1hdGNoKHJlZ2V4KVxuICAgICAgICBpZiAoISBtYXRjaFJlc3VsdCkge1xuICAgICAgICAgICAgcmV0dXJuIDBcbiAgICAgICAgfSBlbHNlIGlmIChoaXN0b3J5UXVlcnkuc2xpY2UoLTMpID09PSAnLi4uJykge1xuICAgICAgICAgICAgcmV0dXJuIEluZmluaXR5IC8vIGhpc3RvcnkgaXMgdmVyeSBsb25nXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gcGFyc2VJbnQobWF0Y2hSZXN1bHRbMV0sIDEwKVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgc3RhdGljIHBhdXNlZE9uRXJyb3IgPSBTeW1ib2woJ1BhdXNlZCBvbiBFcnJvcicpXG4gICAgc3RhdGljIGZpbmlzaGVkRGVidWdnaW5nID0gU3ltYm9sKCdGaW5pc2hlZCBkZWJ1Z2dpbmcnKVxuXG4gICAgcHJpdmF0ZSBwYXJzZVByb21wdCAoc3RkT3V0cHV0OiBzdHJpbmcpOiBCcmVha0luZm8gfCBTeW1ib2wge1xuICAgICAgICBjb25zdCBwYXR0ZXJucyA9IFt7XG4gICAgICAgICAgICBwYXR0ZXJuOiAvXFxbKD86Wy1cXGRdKjogKT8oLiopOlxcKChcXGQrKSwoXFxkKylcXCktXFwoKFxcZCspLChcXGQrKVxcKS4qXFxdLio+ICQvLFxuICAgICAgICAgICAgZnVuYzogKG1hdGNoKSA9PiAoe1xuICAgICAgICAgICAgICAgIGZpbGVuYW1lOiBtYXRjaFsxXSxcbiAgICAgICAgICAgICAgICByYW5nZTogW1twYXJzZUludChtYXRjaFsyXSwgMTApIC0gMSwgcGFyc2VJbnQobWF0Y2hbM10sIDEwKSAtIDFdLFxuICAgICAgICAgICAgICAgICAgICBbcGFyc2VJbnQobWF0Y2hbNF0sIDEwKSwgcGFyc2VJbnQobWF0Y2hbNV0sIDEwKV1dXG4gICAgICAgICAgICB9KVxuICAgICAgICB9LCB7XG4gICAgICAgICAgICBwYXR0ZXJuOiAvXFxbKD86Wy1cXGRdKjogKT8oLiopOihcXGQqKTooXFxkKiktKFxcZCopXFxdLio+ICQvLFxuICAgICAgICAgICAgZnVuYzogKG1hdGNoKSA9PiAoe1xuICAgICAgICAgICAgICAgICAgICBmaWxlbmFtZTogbWF0Y2hbMV0sXG4gICAgICAgICAgICAgICAgICAgIHJhbmdlOiBbW3BhcnNlSW50KG1hdGNoWzJdLCAxMCkgLSAxLCBwYXJzZUludChtYXRjaFszXSwgMTApIC0gMV0sXG4gICAgICAgICAgICAgICAgICAgICAgICBbcGFyc2VJbnQobWF0Y2hbMl0sIDEwKSAtIDEsIHBhcnNlSW50KG1hdGNoWzRdLCAxMCldXVxuICAgICAgICAgICAgfSlcbiAgICAgICAgfSwge1xuICAgICAgICAgICAgcGF0dGVybjogL1xcWzxleGNlcHRpb24gdGhyb3duPlxcXS4qPiAkLyxcbiAgICAgICAgICAgIGZ1bmM6ICgpID0+IEdIQ0lEZWJ1Zy5wYXVzZWRPbkVycm9yXG4gICAgICAgIH0sIHtcbiAgICAgICAgICAgIHBhdHRlcm46IC8uKj4gJC8sXG4gICAgICAgICAgICBmdW5jOiAoKSA9PiBHSENJRGVidWcuZmluaXNoZWREZWJ1Z2dpbmdcbiAgICAgICAgfV0gYXMgQXJyYXk8e3BhdHRlcm46IFJlZ0V4cDsgZnVuYzogKG1hdGNoOiBzdHJpbmdbXSkgPT4gQnJlYWtJbmZvIHwgU3ltYm9sfT5cbiAgICAgICAgZm9yIChjb25zdCBwYXR0ZXJuIG9mIHBhdHRlcm5zKXtcbiAgICAgICAgICAgIGNvbnN0IG1hdGNoUmVzdWx0ID0gc3RkT3V0cHV0Lm1hdGNoKHBhdHRlcm4ucGF0dGVybilcbiAgICAgICAgICAgIGlmIChtYXRjaFJlc3VsdCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBwYXR0ZXJuLmZ1bmMobWF0Y2hSZXN1bHQpXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3QgcmVhZCBwcm9tcHQ6IFxcbicgKyBzdGRPdXRwdXQpXG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBlbWl0U3RhdHVzQ2hhbmdlcyAocHJvbXB0OiBzdHJpbmcsIG1haW5Cb2R5OiBzdHJpbmcsIGVtaXRIaXN0b3J5TGVuZ3RoOiBib29sZWFuKSB7XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IHRoaXMucGFyc2VQcm9tcHQocHJvbXB0KVxuXG4gICAgICAgIGlmIChyZXN1bHQgPT09IEdIQ0lEZWJ1Zy5wYXVzZWRPbkVycm9yKSB7XG4gICAgICAgICAgICBjb25zdCBoaXN0b3J5TGVuZ3RoID0gYXdhaXQgdGhpcy5nZXRIaXN0b3J5TGVuZ3RoKClcblxuICAgICAgICAgICAgdGhpcy5lbWl0dGVyLmVtaXQoJ3BhdXNlZC1vbi1leGNlcHRpb24nLCB7XG4gICAgICAgICAgICAgICAgaGlzdG9yeUxlbmd0aCxcbiAgICAgICAgICAgICAgICBsb2NhbEJpbmRpbmdzOiBtYWluQm9keS5zcGxpdCgnXFxuJykuc2xpY2UoMSlcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH0gZWxzZSBpZiAocmVzdWx0ID09PSBHSENJRGVidWcuZmluaXNoZWREZWJ1Z2dpbmcpIHtcbiAgICAgICAgICAgIHRoaXMuZW1pdHRlci5lbWl0KCdkZWJ1Zy1maW5pc2hlZCcsIHVuZGVmaW5lZClcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0IGJyZWFrSW5mbyA9IHJlc3VsdCBhcyBCcmVha0luZm9cblxuICAgICAgICAgICAgYnJlYWtJbmZvLmxvY2FsQmluZGluZ3MgPSBhd2FpdCB0aGlzLmdldEJpbmRpbmdzKClcblxuICAgICAgICAgICAgaWYgKGVtaXRIaXN0b3J5TGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgYnJlYWtJbmZvLmhpc3RvcnlMZW5ndGggPSBhd2FpdCB0aGlzLmdldEhpc3RvcnlMZW5ndGgoKVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLmVtaXR0ZXIuZW1pdCgnbGluZS1jaGFuZ2VkJywgYnJlYWtJbmZvKVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBpZ25vcmVFcnJvcnMgPSBmYWxzZVxuICAgIHByaXZhdGUgY3VycmVudFN0ZGVyck91dHB1dCA9ICcnXG4gICAgcHJpdmF0ZSBvblN0ZGVyclJlYWRhYmxlICgpIHtcbiAgICAgICAgY29uc3Qgc3RkZXJyT3V0cHV0OiBCdWZmZXIgPSB0aGlzLnN0ZGVyci5yZWFkKClcbiAgICAgICAgaWYgKCEgc3RkZXJyT3V0cHV0IHx8IHRoaXMuaWdub3JlRXJyb3JzKSB7XG4gICAgICAgICAgICByZXR1cm4gLy8gdGhpcyBpcyB0aGUgZW5kIG9mIHRoZSBpbnB1dCBzdHJlYW1cbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuZW1pdHRlci5lbWl0KCdlcnJvcicsIHN0ZGVyck91dHB1dC50b1N0cmluZygpKVxuXG4gICAgICAgIGlmICh0aGlzLmN1cnJlbnRTdGRlcnJPdXRwdXQgPT09ICcnKSB7XG4gICAgICAgICAgICBjb25zdCBkaXNwID0gdGhpcy5lbWl0dGVyLm9uKCdyZWFkeScsICgpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLmVtaXR0ZXIuZW1pdCgnZXJyb3ItY29tcGxldGVkJywgdGhpcy5jdXJyZW50U3RkZXJyT3V0cHV0KVxuICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudFN0ZGVyck91dHB1dCA9ICcnXG4gICAgICAgICAgICAgICAgZGlzcC5kaXNwb3NlKClcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmN1cnJlbnRTdGRlcnJPdXRwdXQgKz0gc3RkZXJyT3V0cHV0LnRvU3RyaW5nKClcbiAgICB9XG5cbiAgICBwcml2YXRlIGN1cnJlbnRDb21tYW5kQnVmZmVyID0gJydcbiAgICBwcml2YXRlIGNvbW1hbmRzID0gW10gYXMgQ29tbWFuZFtdXG4gICAgcHJpdmF0ZSBjdXJyZW50Q29tbWFuZD86IENvbW1hbmRcbiAgICBwcml2YXRlIGNvbW1hbmRGaW5pc2hlZFN0cmluZyA9ICdjb21tYW5kX2ZpbmlzaF9vNHVCMXdoYWd0ZXFFOHhCcTlvcSdcblxuICAgIHByaXZhdGUgb25TdGRvdXRSZWFkYWJsZSAoKSB7XG4gICAgICAgIGNvbnN0IGN1cnJlbnRTdHJpbmcgPSAodGhpcy5zdGRvdXQucmVhZCgpIHx8ICcnKS50b1N0cmluZygpXG5cbiAgICAgICAgdGhpcy5jdXJyZW50Q29tbWFuZEJ1ZmZlciArPSBjdXJyZW50U3RyaW5nXG5cbiAgICAgICAgY29uc3QgZmluaXNoU3RyaW5nUG9zaXRpb24gPSB0aGlzLmN1cnJlbnRDb21tYW5kQnVmZmVyLnNlYXJjaCh0aGlzLmNvbW1hbmRGaW5pc2hlZFN0cmluZylcbiAgICAgICAgaWYgKGZpbmlzaFN0cmluZ1Bvc2l0aW9uICE9PSAtMSkge1xuICAgICAgICAgICAgY29uc3Qgb3V0cHV0U3RyaW5nID0gdGhpcy5jdXJyZW50Q29tbWFuZEJ1ZmZlci5zbGljZSgwLCBmaW5pc2hTdHJpbmdQb3NpdGlvbilcblxuICAgICAgICAgICAgaWYgKHRoaXMuY3VycmVudENvbW1hbmQpIHtcbiAgICAgICAgICAgICAgaWYgKHRoaXMuY3VycmVudENvbW1hbmQuZW1pdENvbW1hbmRPdXRwdXQpIHtcbiAgICAgICAgICAgICAgICAgIHRoaXMuZW1pdHRlci5lbWl0KCdjb25zb2xlLW91dHB1dCcsIG91dHB1dFN0cmluZylcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIHRoaXMuY3VycmVudENvbW1hbmQub25GaW5pc2gob3V0cHV0U3RyaW5nKVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBUYWtlIHRoZSBmaW5pc2hlZCBzdHJpbmcgb2ZmIHRoZSBidWZmZXIgYW5kIHByb2Nlc3MgdGhlIG5leHQgb3VwdXRcbiAgICAgICAgICAgIHRoaXMuY3VycmVudENvbW1hbmRCdWZmZXIgPSB0aGlzLmN1cnJlbnRDb21tYW5kQnVmZmVyLnNsaWNlKFxuICAgICAgICAgICAgICAgIGZpbmlzaFN0cmluZ1Bvc2l0aW9uICsgdGhpcy5jb21tYW5kRmluaXNoZWRTdHJpbmcubGVuZ3RoKVxuICAgICAgICAgICAgdGhpcy5vblN0ZG91dFJlYWRhYmxlKClcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHB1YmxpYyBhc3luYyBydW4gKGNvbW1hbmRUZXh0OiBzdHJpbmcsXG4gICAgICAgICAgICAgICAgICAgICAgZW1pdFN0YXR1c0NoYW5nZXM6IGJvb2xlYW4gPSBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgICBlbWl0SGlzdG9yeUxlbmd0aDogYm9vbGVhbiA9IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICAgIGVtaXRDb21tYW5kT3V0cHV0OiBib29sZWFuID0gdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICBmdWxmaWxXaXRoUHJvbXB0OiBib29sZWFuID0gZmFsc2UpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgICAgICBjb25zdCBzaGlmdEFuZFJ1bkNvbW1hbmQgPSAoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBjb21tYW5kID0gdGhpcy5jb21tYW5kcy5zaGlmdCgpXG5cbiAgICAgICAgICAgIHRoaXMuY3VycmVudENvbW1hbmQgPSBjb21tYW5kXG5cbiAgICAgICAgICAgIGlmIChjb21tYW5kKSB7XG4gICAgICAgICAgICAgIGlmIChjb21tYW5kLmVtaXRDb21tYW5kT3V0cHV0KSB7XG4gICAgICAgICAgICAgICAgICB0aGlzLmVtaXR0ZXIuZW1pdCgnY29tbWFuZC1pc3N1ZWQnLCBjb21tYW5kLnRleHQpXG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICB0aGlzLnN0ZGluLndyaXRlKGNvbW1hbmQudGV4dCArIG9zLkVPTClcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBjdXJyZW50UHJvbWlzZTogUHJvbWlzZTxzdHJpbmc+XG4gICAgICAgIHJldHVybiBjdXJyZW50UHJvbWlzZSA9IG5ldyBQcm9taXNlPHN0cmluZz4oKGZ1bGZpbCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgY29tbWFuZDogQ29tbWFuZCA9IHtcbiAgICAgICAgICAgICAgICB0ZXh0OiBjb21tYW5kVGV4dCxcbiAgICAgICAgICAgICAgICBlbWl0Q29tbWFuZE91dHB1dCxcbiAgICAgICAgICAgICAgICBmdWxmaWxXaXRoUHJvbXB0LFxuICAgICAgICAgICAgICAgIG9uRmluaXNoOiBhc3luYyAob3V0cHV0KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudENvbW1hbmQgPSB1bmRlZmluZWRcblxuICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbiBfZnVsZmlsIChub1Byb21wdDogc3RyaW5nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZnVsZmlsV2l0aFByb21wdCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZ1bGZpbChvdXRwdXQpXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZ1bGZpbChub1Byb21wdClcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGxhc3RFbmRPZkxpbmVQb3MgPSBvdXRwdXQubGFzdEluZGV4T2Yob3MuRU9MKVxuXG4gICAgICAgICAgICAgICAgICAgIGlmIChsYXN0RW5kT2ZMaW5lUG9zID09PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLyppLmUuIG5vIG91dHB1dCBoYXMgYmVlbiBwcm9kdWNlZCovXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZW1pdFN0YXR1c0NoYW5nZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmVtaXRTdGF0dXNDaGFuZ2VzKG91dHB1dCwgJycsIGVtaXRIaXN0b3J5TGVuZ3RoKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgX2Z1bGZpbCgnJylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBfZnVsZmlsKCcnKVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcHJvbXB0QmVnaW5Qb3NpdGlvbiA9IGxhc3RFbmRPZkxpbmVQb3MgKyBvcy5FT0wubGVuZ3RoXG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlbWl0U3RhdHVzQ2hhbmdlcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZW1pdFN0YXR1c0NoYW5nZXMob3V0cHV0LnNsaWNlKHByb21wdEJlZ2luUG9zaXRpb24sIG91dHB1dC5sZW5ndGgpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb3V0cHV0LnNsaWNlKDAsIGxhc3RFbmRPZkxpbmVQb3MpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZW1pdEhpc3RvcnlMZW5ndGgpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBfZnVsZmlsKG91dHB1dC5zbGljZSgwLCBsYXN0RW5kT2ZMaW5lUG9zKSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBfZnVsZmlsKG91dHB1dC5zbGljZSgwLCBsYXN0RW5kT2ZMaW5lUG9zKSlcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IGN1cnJlbnRQcm9taXNlXG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuY29tbWFuZHMubGVuZ3RoICE9PSAwICYmIHRoaXMuY3VycmVudENvbW1hbmQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2hpZnRBbmRSdW5Db21tYW5kKClcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy5jb21tYW5kcy5wdXNoKGNvbW1hbmQpXG5cbiAgICAgICAgICAgIGlmICh0aGlzLmN1cnJlbnRDb21tYW5kID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICBzaGlmdEFuZFJ1bkNvbW1hbmQoKVxuICAgICAgICAgICAgfVxuICAgICAgICB9KVxuICAgIH1cbn1cbiJdfQ==