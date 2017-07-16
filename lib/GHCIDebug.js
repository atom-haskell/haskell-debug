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
const emissary = require("emissary");
const path = require("path");
class GHCIDebug {
    constructor(ghciCommand = 'ghci', ghciArgs = [], folder) {
        this.emitter = new emissary.Emitter();
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
                const tempVarNum = 0;
                let potentialTempVar;
                do {
                    potentialTempVar = getExpression(yield this.run(`:print temp${tempVarNum}`, false, false, false), `temp${tempVarNum}`);
                } while (potentialTempVar !== undefined);
                yield this.run(`let temp${tempVarNum} = ${expression}`);
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
            this.emitter.once('ready', () => {
                this.emitter.emit('error-completed', this.currentStderrOutput);
                this.currentStderrOutput = '';
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiR0hDSURlYnVnLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2xpYi9HSENJRGVidWcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQUFBLG9DQUFvQztBQUVwQyx5QkFBeUI7QUFDekIscUNBQXFDO0FBQ3JDLDZCQUE2QjtBQWdEN0I7SUFzQ0ksWUFBYSxXQUFXLEdBQUUsTUFBTSxFQUFFLFdBQXFCLEVBQUUsRUFBRSxNQUFlO1FBSm5FLFlBQU8sR0FBcUIsSUFBSSxRQUFRLENBQUMsT0FBTyxFQUFFLENBQUE7UUE0TmpELGlCQUFZLEdBQUcsS0FBSyxDQUFBO1FBQ3BCLHdCQUFtQixHQUFHLEVBQUUsQ0FBQTtRQW1CeEIseUJBQW9CLEdBQUcsRUFBRSxDQUFBO1FBQ3pCLGFBQVEsR0FBRyxFQUFlLENBQUE7UUFFMUIsMEJBQXFCLEdBQUcscUNBQXFDLENBQUE7UUE3T2pFLElBQUksQ0FBQyxPQUFPLEdBQUcsRUFBRSxDQUFDLEtBQUssQ0FBQyxXQUFXLEVBQUUsUUFBUSxFQUFFLEVBQUMsR0FBRyxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFDLENBQUMsQ0FBQTtRQUUxRSxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxNQUFNLEVBQUU7WUFDcEIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsU0FBUyxDQUFDLENBQUE7UUFDbEQsQ0FBQyxDQUFDLENBQUE7UUFFRixJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFBO1FBQ2pDLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUE7UUFDL0IsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQTtRQUNqQyxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxVQUFVLEVBQUUsTUFBTSxJQUFJLENBQUMs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QUNoRCxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxnQkFBZ0IsQ0FBQyxFQUNqQyxpQkFBaUIsQ0FBQyxDQUFDLElBQUksQ0FBQztvQ0FDM0MsT0FBTyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLGdCQUFnQixDQUFDLENBQUMsQ0FBQTtnQ0FDOUMsQ0FBQyxDQUFDLENBQUE7NEJBQ04sQ0FBQzs0QkFBQyxJQUFJLENBQUMsQ0FBQztnQ0FDSixPQUFPLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQyxDQUFBOzRCQUM5QyxDQUFDO3dCQUNMLENBQUM7d0JBRUQsTUFBTSxjQUFjLENBQUE7d0JBRXBCLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxLQUFLLENBQUMsSUFBSSxJQUFJLENBQUMsY0FBYyxLQUFLLFNBQVMsQ0FBQyxDQUFDLENBQUM7NEJBQ2xFLGtCQUFrQixFQUFFLENBQUE7d0JBQ3hCLENBQUM7b0JBQ0wsQ0FBQyxDQUFBO2lCQUNKLENBQUE7Z0JBRUQsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUE7Z0JBRTNCLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxjQUFjLEtBQUssU0FBUyxDQUFDLENBQUMsQ0FBQztvQkFDcEMsa0JBQWtCLEVBQUUsQ0FBQTtnQkFDeEIsQ0FBQztZQUNMLENBQUMsQ0FBQyxDQUFBO1FBQ04sQ0FBQztLQUFBOztBQXZMTSx1QkFBYSxHQUFHLE1BQU0sQ0FBQyxpQkFBaUIsQ0FBQyxDQUFBO0FBQ3pDLDJCQUFpQixHQUFHLE1BQU0sQ0FBQyxvQkFBb0IsQ0FBQyxDQUFBO0FBcE0zRCw4QkEyWEMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgY3AgPSByZXF1aXJlKCdjaGlsZF9wcm9jZXNzJylcbmltcG9ydCBzdHJlYW0gPSByZXF1aXJlKCdzdHJlYW0nKVxuaW1wb3J0IG9zID0gcmVxdWlyZSgnb3MnKVxuaW1wb3J0IGVtaXNzYXJ5ID0gcmVxdWlyZSgnZW1pc3NhcnknKVxuaW1wb3J0IHBhdGggPSByZXF1aXJlKCdwYXRoJylcblxuZXhwb3J0IGludGVyZmFjZSBCcmVha0luZm8ge1xuICAgIGZpbGVuYW1lOiBzdHJpbmdcbiAgICByYW5nZTogbnVtYmVyW11bXVxuICAgIGhpc3RvcnlMZW5ndGg/OiBudW1iZXJcbiAgICBsb2NhbEJpbmRpbmdzOiBzdHJpbmdbXVxufVxuXG5leHBvcnQgaW50ZXJmYWNlIEV4Y2VwdGlvbkluZm8ge1xuICAgIGhpc3RvcnlMZW5ndGg6IG51bWJlclxuICAgIGxvY2FsQmluZGluZ3M6IHN0cmluZ1tdXG59XG5cbmludGVyZmFjZSBFbWl0dGVyT25NYXAge1xuICAncmVhZHknOiAoKSA9PiBhbnlcbiAgJ2RlYnVnLWZpbmlzaGVkJzogKCkgPT4gYW55XG4gICdwYXVzZWQtb24tZXhjZXB0aW9uJzogKGluZm86IEV4Y2VwdGlvbkluZm8pID0+IGFueVxuICAnZXJyb3InOiAodGV4dDogc3RyaW5nKSA9PiBhbnlcbiAgJ2Vycm9yLWNvbXBsZXRlZCc6ICh0ZXh0OiBzdHJpbmcpID0+IGFueVxuICAnbGluZS1jaGFuZ2VkJzogKGluZm86IEJyZWFrSW5mbykgPT4gYW55XG4gICdjb25zb2xlLW91dHB1dCc6IChvdXRwdXQ6IHN0cmluZykgPT4gYW55XG4gICdjb21tYW5kLWlzc3VlZCc6IChjb21tYW5kOiBzdHJpbmcpID0+IGFueVxufVxuXG5pbnRlcmZhY2UgRW1pdHRlckVtaXRNYXAge1xuICAncGF1c2VkLW9uLWV4Y2VwdGlvbic6IEV4Y2VwdGlvbkluZm9cbiAgJ3JlYWR5JzogRXhjZXB0aW9uSW5mbyB8IHVuZGVmaW5lZFxuICAnZXJyb3InOiBzdHJpbmdcbiAgJ2Vycm9yLWNvbXBsZXRlZCc6IHN0cmluZ1xuICAnbGluZS1jaGFuZ2VkJzogQnJlYWtJbmZvXG4gICdkZWJ1Zy1maW5pc2hlZCc6IGFueVxuICAnY29uc29sZS1vdXRwdXQnOiBzdHJpbmdcbiAgJ2NvbW1hbmQtaXNzdWVkJzogc3RyaW5nXG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgR0hDSURlYnVnRW1pdHRlciBleHRlbmRzIEVtaXNzYXJ5LklFbWl0dGVyIHtcbiAgICBvbjxLIGV4dGVuZHMga2V5b2YgRW1pdHRlck9uTWFwPiAoZXZlbnROYW1lOiBLLCBoYW5kbGVyOiBFbWl0dGVyT25NYXBbS10pOiBBdG9tQ29yZS5EaXNwb3NhYmxlXG4gICAgZW1pdDxLIGV4dGVuZHMga2V5b2YgRW1pdHRlckVtaXRNYXA+IChldmVudE5hbWU6IEssIHZhbHVlOiBFbWl0dGVyRW1pdE1hcFtLXSk6IHZvaWRcbn1cblxuaW50ZXJmYWNlIENvbW1hbmQge1xuICAgIHRleHQ6IHN0cmluZ1xuICAgIGVtaXRDb21tYW5kT3V0cHV0OiBib29sZWFuXG4gICAgZnVsZmlsV2l0aFByb21wdDogYm9vbGVhblxuICAgIG9uRmluaXNoOiAob3V0cHV0OiBzdHJpbmcpID0+IGFueVxufVxuXG5leHBvcnQgY2xhc3MgR0hDSURlYnVnIHtcbiAgICBwcml2YXRlIGdoY2lDbWQ6IGNwLkNoaWxkUHJvY2Vzc1xuICAgIHN0ZG91dDogc3RyZWFtLlJlYWRhYmxlXG4gICAgc3RkaW46IHN0cmVhbS5Xcml0YWJsZVxuICAgIHN0ZGVycjogc3RyZWFtLlJlYWRhYmxlXG5cbiAgICAvKiogRXZlbnQgSGFuZGxlclxuICAgICAgKlxuICAgICAgKiBFdmVudHM6XG4gICAgICAqXG4gICAgICAqIHJlYWR5OiAoKVxuICAgICAgKiAgICAgRW1taXRlZCB3aGVuIGdoY2kgaGFzIGp1c3Qgc3RvcHBlZCBleGVjdXRpbmcgYSBjb21tYW5kXG4gICAgICAqXG4gICAgICAqIHBhdXNlZC1vbi1leGNlcHRpb246IChpbmZvOiBFeGNlcHRpb25JbmZvKVxuICAgICAgKiAgICAgRW1taXRlZCB3aGVuIHRoZSBkZWJ1Z2dlciBpcyBhdCBhbiBleGNlcHRpb25cbiAgICAgICpcbiAgICAgICogZXJyb3I6ICh0ZXh0OiBzdHJpbmcpXG4gICAgICAqICAgICBFbW1pdGVkIHdoZW4gc3RkZXJyIGhhcyBpbnB1dFxuICAgICAgKlxuICAgICAgKiBlcnJvci1jb21wbGV0ZWQ6ICh0ZXh0OiBzdHJpbmcpXG4gICAgICAqICAgICBFbW1pdGVkIHdoZW4gZ2hjaSByZXBvcnRzIGFuIGVycm9yIGZvciBhIGdpdmVuIGNvbW1hbmRcbiAgICAgICpcbiAgICAgICogbGluZS1jaGFuZ2VkOiAoaW5mbzogQnJlYWtJbmZvKVxuICAgICAgKiAgICAgRW1taXRlZCB3aGVuIHRoZSBsaW5lIHRoYXQgdGhlIGRlYnVnZ2VyIGlzIG9uIGNoYW5nZXNcbiAgICAgICpcbiAgICAgICogZGVidWctZmluaXNoZWQ6ICh2b2lkKVxuICAgICAgKiAgICAgRW1taXRlZCB3aGVuIHRoZSBkZWJ1Z2dlciBoYXMgcmVhY2hlZCB0aGUgZW5kIG9mIHRoZSBwcm9ncmFtXG4gICAgICAqXG4gICAgICAqIGNvbnNvbGUtb3V0cHV0OiAob3V0cHV0OiBzdHJpbmcpXG4gICAgICAqICAgICBFbW1pdGVkIHdoZW4gdGhlIGdoY2kgaGFzIG91dHB1dGVkIHNvbWV0aGluZyB0byBzdGRvdXQsIGV4Y2x1ZGluZyB0aGUgZXh0cmEgcHJvbXB0XG4gICAgICAqXG4gICAgICAqIGNvbW1hbmQtaXNzdWVkOiAoY29tbWFuZDogc3RyaW5nKVxuICAgICAgKiAgICAgRW1taXRlZCB3aGVuIGEgY29tbWFuZCBoYXMgYmVlbiBleGVjdXRlZFxuICAgICAgKi9cbiAgICBwdWJsaWMgZW1pdHRlcjogR0hDSURlYnVnRW1pdHRlciA9IG5ldyBlbWlzc2FyeS5FbWl0dGVyKClcblxuICAgIHByaXZhdGUgc3RhcnRUZXh0OiBQcm9taXNlPHN0cmluZz5cblxuICAgIGNvbnN0cnVjdG9yIChnaGNpQ29tbWFuZD0gJ2doY2knLCBnaGNpQXJnczogc3RyaW5nW10gPSBbXSwgZm9sZGVyPzogc3RyaW5nKSB7XG5cbiAgICAgICAgdGhpcy5naGNpQ21kID0gY3Auc3Bhd24oZ2hjaUNvbW1hbmQsIGdoY2lBcmdzLCB7Y3dkOiBmb2xkZXIsIHNoZWxsOiB0cnVlfSlcblxuICAgICAgICB0aGlzLmdoY2lDbWQub24oJ2V4aXQnLCAoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLmVtaXR0ZXIuZW1pdCgnZGVidWctZmluaXNoZWQnLCB1bmRlZmluZWQpXG4gICAgICAgIH0pXG5cbiAgICAgICAgdGhpcy5zdGRvdXQgPSB0aGlzLmdoY2lDbWQuc3Rkb3V0XG4gICAgICAgIHRoaXMuc3RkaW4gPSB0aGlzLmdoY2lDbWQuc3RkaW5cbiAgICAgICAgdGhpcy5zdGRlcnIgPSB0aGlzLmdoY2lDbWQuc3RkZXJyXG4gICAgICAgIHRoaXMuc3Rkb3V0Lm9uKCdyZWFkYWJsZScsICgpID0+IHRoaXMub25TdGRvdXRSZWFkYWJsZSgpKVxuICAgICAgICB0aGlzLnN0ZGVyci5vbigncmVhZGFibGUnLCAoKSA9PiB0aGlzLm9uU3RkZXJyUmVhZGFibGUoKSlcblxuICAgICAgICB0aGlzLmFkZFJlYWR5RXZlbnQoKVxuXG4gICAgICAgIHRoaXMuc3RhcnRUZXh0ID0gdGhpcy5ydW4oYDpzZXQgcHJvbXB0IFwiJXM+ICR7dGhpcy5jb21tYW5kRmluaXNoZWRTdHJpbmd9XCJgLCBmYWxzZSwgZmFsc2UsIGZhbHNlLCB0cnVlKVxuICAgIH1cblxuICAgIHByaXZhdGUgYWRkUmVhZHlFdmVudCAoKSB7XG4gICAgICAgIGNvbnN0IGV2ZW50U3VicyA9IFtcbiAgICAgICAgICAgICdwYXVzZWQtb24tZXhjZXB0aW9uJyxcbiAgICAgICAgICAgICdsaW5lLWNoYW5nZWQnLFxuICAgICAgICAgICAgJ2RlYnVnLWZpbmlzaGVkJyxcbiAgICAgICAgXVxuXG4gICAgICAgIGZvciAoY29uc3QgZXZlbnROYW1lIG9mIGV2ZW50U3Vicyl7XG4gICAgICAgICAgICAodGhpcy5lbWl0dGVyLm9uIGFzIGFueSkoZXZlbnROYW1lLCAoKSA9PiB0aGlzLmVtaXR0ZXIuZW1pdCgncmVhZHknLCB1bmRlZmluZWQpKVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHVibGljIGRlc3Ryb3kgKCkge1xuICAgICAgICB0aGlzLnN0b3AoKVxuICAgIH1cblxuICAgIHB1YmxpYyBsb2FkTW9kdWxlIChuYW1lOiBzdHJpbmcpIHtcbiAgICAgICAgY29uc3QgY3dkID0gcGF0aC5kaXJuYW1lKG5hbWUpXG5cbiAgICAgICAgdGhpcy5ydW4oYDpjZCAke2N3ZH1gKVxuICAgICAgICB0aGlzLnJ1bihgOmxvYWQgJHtuYW1lfWApXG4gICAgfVxuXG4gICAgcHVibGljIHNldEV4Y2VwdGlvbkJyZWFrTGV2ZWwgKGxldmVsOiBFeGNlcHRpb25CcmVha0xldmVscykge1xuICAgICAgICB0aGlzLnJ1bignOnVuc2V0IC1mYnJlYWstb24tZXhjZXB0aW9uJylcbiAgICAgICAgdGhpcy5ydW4oJzp1bnNldCAtZmJyZWFrLW9uLWVycm9yJylcblxuICAgICAgICBpZiAobGV2ZWwgPT09ICdleGNlcHRpb25zJykge1xuICAgICAgICAgICAgdGhpcy5ydW4oJzpzZXQgLWZicmVhay1vbi1leGNlcHRpb24nKVxuICAgICAgICB9IGVsc2UgaWYgKGxldmVsID09PSAnZXJyb3JzJykge1xuICAgICAgICAgICAgdGhpcy5ydW4oJzpzZXQgLWZicmVhay1vbi1lcnJvcicpXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwdWJsaWMgYWRkQnJlYWtwb2ludCAoYnJlYWtwb2ludDogQnJlYWtwb2ludCB8IHN0cmluZykge1xuICAgICAgICBpZiAodHlwZW9mIGJyZWFrcG9pbnQgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICB0aGlzLnJ1bihgOmJyZWFrICR7YnJlYWtwb2ludH1gKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5ydW4oYDpicmVhayAke2JyZWFrcG9pbnQuZmlsZX0gJHticmVha3BvaW50LmxpbmV9YClcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKiByZXNvbHZlZCB0aGUgZ2l2ZW4gZXhwcmVzc2lvbiB1c2luZyA6cHJpbnQsIHJldHVybnMgbnVsbCBpZiBpdCBpcyBpbnZhbGlkXG4gICAgKi9cbiAgICBwdWJsaWMgYXN5bmMgcmVzb2x2ZUV4cHJlc3Npb24gKGV4cHJlc3Npb246IHN0cmluZykge1xuICAgICAgICAvLyBleHByZXNzaW9ucyBjYW4ndCBoYXZlIG5ldyBsaW5lc1xuICAgICAgICBpZiAoZXhwcmVzc2lvbi5pbmRleE9mKCdcXG4nKSAhPT0gLTEpIHtcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgZ2V0RXhwcmVzc2lvbiA9IChnaGNpT3V0cHV0OiBzdHJpbmcsIHZhcmlhYmxlOiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IG1hdGNoUmVzdWx0ID0gZ2hjaU91dHB1dC5tYXRjaCgvW14gXSogPSAoLiopLylcbiAgICAgICAgICAgIGlmICghIG1hdGNoUmVzdWx0KSB7IHJldHVybiB9XG4gICAgICAgICAgICByZXR1cm4gbWF0Y2hSZXN1bHRbMV1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGZvciB0aGUgY29kZSBiZWxvdywgaWdub3JlIGVycm9yc1xuICAgICAgICB0aGlzLmlnbm9yZUVycm9ycyA9IHRydWVcblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8gdHJ5IHByaW50aW5nIGV4cHJlc3Npb25cbiAgICAgICAgICAgIGNvbnN0IHByaW50aW5nUmVzdWx0ID0gZ2V0RXhwcmVzc2lvbihcbiAgICAgICAgICAgICAgYXdhaXQgdGhpcy5ydW4oYDpwcmludCAke2V4cHJlc3Npb259YCwgZmFsc2UsIGZhbHNlLCBmYWxzZSksIGV4cHJlc3Npb24pXG4gICAgICAgICAgICBpZiAocHJpbnRpbmdSZXN1bHQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBwcmludGluZ1Jlc3VsdFxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBpZiB0aGF0IGZhaWxzIGFzc2lnbiBpdCB0byBhIHRlbXBvcmFyeSB2YXJpYWJsZSBhbmQgZXZhbHVhdGUgdGhhdFxuICAgICAgICAgICAgY29uc3QgdGVtcFZhck51bSA9IDBcbiAgICAgICAgICAgIGxldCBwb3RlbnRpYWxUZW1wVmFyOiBzdHJpbmcgfCBib29sZWFuIHwgdW5kZWZpbmVkXG4gICAgICAgICAgICBkbyB7XG4gICAgICAgICAgICAgICAgcG90ZW50aWFsVGVtcFZhciA9IGdldEV4cHJlc3Npb24oXG4gICAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLnJ1bihgOnByaW50IHRlbXAke3RlbXBWYXJOdW19YCwgZmFsc2UsIGZhbHNlLCBmYWxzZSksIGB0ZW1wJHt0ZW1wVmFyTnVtfWApXG4gICAgICAgICAgICB9IHdoaWxlIChwb3RlbnRpYWxUZW1wVmFyICE9PSB1bmRlZmluZWQpXG5cbiAgICAgICAgICAgIGF3YWl0IHRoaXMucnVuKGBsZXQgdGVtcCR7dGVtcFZhck51bX0gPSAke2V4cHJlc3Npb259YClcbiAgICAgICAgICAgIHJldHVybiBnZXRFeHByZXNzaW9uKGF3YWl0IHRoaXMucnVuKGA6cHJpbnQgdGVtcCR7dGVtcFZhck51bX1gLCBmYWxzZSwgZmFsc2UsIGZhbHNlKSwgYHRlbXAke3RlbXBWYXJOdW19YClcbiAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICAgIHRoaXMuaWdub3JlRXJyb3JzID0gZmFsc2VcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHB1YmxpYyBmb3J3YXJkICgpIHtcbiAgICAgICAgdGhpcy5ydW4oJzpmb3J3YXJkJywgdHJ1ZSlcbiAgICB9XG5cbiAgICBwdWJsaWMgYmFjayAoKSB7XG4gICAgICAgIHRoaXMucnVuKCc6YmFjaycsIHRydWUpXG4gICAgfVxuXG4gICAgcHVibGljIHN0ZXAgKCkge1xuICAgICAgICB0aGlzLnJ1bignOnN0ZXAnLCB0cnVlLCB0cnVlKVxuICAgIH1cblxuICAgIHB1YmxpYyBzdG9wICgpIHtcbiAgICAgICAgdGhpcy5ydW4oJzpxdWl0JylcbiAgICAgICAgc2V0VGltZW91dChcbiAgICAgICAgKCkgPT4ge1xuICAgICAgICAgIHRoaXMuZ2hjaUNtZC5raWxsKClcbiAgICAgICAgfSxcbiAgICAgICAgMzAwMClcbiAgICB9XG5cbiAgICBwdWJsaWMgY29udGludWUgKCkge1xuICAgICAgICB0aGlzLnJ1bignOmNvbnRpbnVlJywgdHJ1ZSlcbiAgICB9XG5cbiAgICBwdWJsaWMgYXN5bmMgYWRkZWRBbGxMaXN0ZW5lcnMgKCkge1xuICAgICAgICB0aGlzLnN0YXJ0VGV4dC50aGVuKCh0ZXh0KSA9PiB7XG4gICAgICAgICAgICBjb25zdCBmaXJzdFByb21wdCA9IHRleHQuaW5kZXhPZignPiAnKVxuICAgICAgICAgICAgdGhpcy5lbWl0dGVyLmVtaXQoJ2NvbnNvbGUtb3V0cHV0JywgdGV4dC5zbGljZSgwLCBmaXJzdFByb21wdCArIDIpKVxuICAgICAgICB9KVxuICAgIH1cblxuICAgIGFzeW5jIHN0YXJ0RGVidWcgKG1vZHVsZU5hbWU/OiBzdHJpbmcpIHtcbiAgICAgICAgbW9kdWxlTmFtZSA9IG1vZHVsZU5hbWUgfHwgJ21haW4nXG4gICAgICAgIGF3YWl0IHRoaXMucnVuKCc6dHJhY2UgJyArIG1vZHVsZU5hbWUsIHRydWUsIHRydWUpXG4gICAgfVxuXG4gICAgYXN5bmMgZ2V0QmluZGluZ3MgKCkge1xuICAgICAgICBjb25zdCBvdXRwdXRTdHIgPSBhd2FpdCB0aGlzLnJ1bignOnNob3cgYmluZGluZ3MnLCBmYWxzZSwgZmFsc2UsIGZhbHNlKVxuICAgICAgICByZXR1cm4gb3V0cHV0U3RyLnNwbGl0KG9zLkVPTClcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIGdldEhpc3RvcnlMZW5ndGggKCkge1xuICAgICAgICBjb25zdCBoaXN0b3J5UXVlcnkgPSBhd2FpdCB0aGlzLnJ1bignOmhpc3RvcnkgMTAwJywgZmFsc2UsIGZhbHNlLCBmYWxzZSlcbiAgICAgICAgY29uc3QgcmVnZXggPSAvLShcXGQqKS4qKD86XFxufFxccnxcXHJcXG4pPGVuZCBvZiBoaXN0b3J5PiQvXG5cbiAgICAgICAgY29uc3QgbWF0Y2hSZXN1bHQgPSBoaXN0b3J5UXVlcnkubWF0Y2gocmVnZXgpXG4gICAgICAgIGlmICghIG1hdGNoUmVzdWx0KSB7XG4gICAgICAgICAgICByZXR1cm4gMFxuICAgICAgICB9IGVsc2UgaWYgKGhpc3RvcnlRdWVyeS5zbGljZSgtMykgPT09ICcuLi4nKSB7XG4gICAgICAgICAgICByZXR1cm4gSW5maW5pdHkgLy8gaGlzdG9yeSBpcyB2ZXJ5IGxvbmdcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBwYXJzZUludChtYXRjaFJlc3VsdFsxXSwgMTApXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBzdGF0aWMgcGF1c2VkT25FcnJvciA9IFN5bWJvbCgnUGF1c2VkIG9uIEVycm9yJylcbiAgICBzdGF0aWMgZmluaXNoZWREZWJ1Z2dpbmcgPSBTeW1ib2woJ0ZpbmlzaGVkIGRlYnVnZ2luZycpXG5cbiAgICBwcml2YXRlIHBhcnNlUHJvbXB0IChzdGRPdXRwdXQ6IHN0cmluZyk6IEJyZWFrSW5mbyB8IFN5bWJvbCB7XG4gICAgICAgIGNvbnN0IHBhdHRlcm5zID0gW3tcbiAgICAgICAgICAgIHBhdHRlcm46IC9cXFsoPzpbLVxcZF0qOiApPyguKik6XFwoKFxcZCspLChcXGQrKVxcKS1cXCgoXFxkKyksKFxcZCspXFwpLipcXF0uKj4gJC8sXG4gICAgICAgICAgICBmdW5jOiAobWF0Y2gpID0+ICh7XG4gICAgICAgICAgICAgICAgZmlsZW5hbWU6IG1hdGNoWzFdLFxuICAgICAgICAgICAgICAgIHJhbmdlOiBbW3BhcnNlSW50KG1hdGNoWzJdLCAxMCkgLSAxLCBwYXJzZUludChtYXRjaFszXSwgMTApIC0gMV0sXG4gICAgICAgICAgICAgICAgICAgIFtwYXJzZUludChtYXRjaFs0XSwgMTApLCBwYXJzZUludChtYXRjaFs1XSwgMTApXV1cbiAgICAgICAgICAgIH0pXG4gICAgICAgIH0sIHtcbiAgICAgICAgICAgIHBhdHRlcm46IC9cXFsoPzpbLVxcZF0qOiApPyguKik6KFxcZCopOihcXGQqKS0oXFxkKilcXF0uKj4gJC8sXG4gICAgICAgICAgICBmdW5jOiAobWF0Y2gpID0+ICh7XG4gICAgICAgICAgICAgICAgICAgIGZpbGVuYW1lOiBtYXRjaFsxXSxcbiAgICAgICAgICAgICAgICAgICAgcmFuZ2U6IFtbcGFyc2VJbnQobWF0Y2hbMl0sIDEwKSAtIDEsIHBhcnNlSW50KG1hdGNoWzNdLCAxMCkgLSAxXSxcbiAgICAgICAgICAgICAgICAgICAgICAgIFtwYXJzZUludChtYXRjaFsyXSwgMTApIC0gMSwgcGFyc2VJbnQobWF0Y2hbNF0sIDEwKV1dXG4gICAgICAgICAgICB9KVxuICAgICAgICB9LCB7XG4gICAgICAgICAgICBwYXR0ZXJuOiAvXFxbPGV4Y2VwdGlvbiB0aHJvd24+XFxdLio+ICQvLFxuICAgICAgICAgICAgZnVuYzogKCkgPT4gR0hDSURlYnVnLnBhdXNlZE9uRXJyb3JcbiAgICAgICAgfSwge1xuICAgICAgICAgICAgcGF0dGVybjogLy4qPiAkLyxcbiAgICAgICAgICAgIGZ1bmM6ICgpID0+IEdIQ0lEZWJ1Zy5maW5pc2hlZERlYnVnZ2luZ1xuICAgICAgICB9XSBhcyBBcnJheTx7cGF0dGVybjogUmVnRXhwOyBmdW5jOiAobWF0Y2g6IHN0cmluZ1tdKSA9PiBCcmVha0luZm8gfCBTeW1ib2x9PlxuICAgICAgICBmb3IgKGNvbnN0IHBhdHRlcm4gb2YgcGF0dGVybnMpe1xuICAgICAgICAgICAgY29uc3QgbWF0Y2hSZXN1bHQgPSBzdGRPdXRwdXQubWF0Y2gocGF0dGVybi5wYXR0ZXJuKVxuICAgICAgICAgICAgaWYgKG1hdGNoUmVzdWx0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhdHRlcm4uZnVuYyhtYXRjaFJlc3VsdClcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Nhbm5vdCByZWFkIHByb21wdDogXFxuJyArIHN0ZE91dHB1dClcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIGVtaXRTdGF0dXNDaGFuZ2VzIChwcm9tcHQ6IHN0cmluZywgbWFpbkJvZHk6IHN0cmluZywgZW1pdEhpc3RvcnlMZW5ndGg6IGJvb2xlYW4pIHtcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gdGhpcy5wYXJzZVByb21wdChwcm9tcHQpXG5cbiAgICAgICAgaWYgKHJlc3VsdCA9PT0gR0hDSURlYnVnLnBhdXNlZE9uRXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnN0IGhpc3RvcnlMZW5ndGggPSBhd2FpdCB0aGlzLmdldEhpc3RvcnlMZW5ndGgoKVxuXG4gICAgICAgICAgICB0aGlzLmVtaXR0ZXIuZW1pdCgncGF1c2VkLW9uLWV4Y2VwdGlvbicsIHtcbiAgICAgICAgICAgICAgICBoaXN0b3J5TGVuZ3RoLFxuICAgICAgICAgICAgICAgIGxvY2FsQmluZGluZ3M6IG1haW5Cb2R5LnNwbGl0KCdcXG4nKS5zbGljZSgxKVxuICAgICAgICAgICAgfSlcbiAgICAgICAgfSBlbHNlIGlmIChyZXN1bHQgPT09IEdIQ0lEZWJ1Zy5maW5pc2hlZERlYnVnZ2luZykge1xuICAgICAgICAgICAgdGhpcy5lbWl0dGVyLmVtaXQoJ2RlYnVnLWZpbmlzaGVkJywgdW5kZWZpbmVkKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc3QgYnJlYWtJbmZvID0gcmVzdWx0IGFzIEJyZWFrSW5mb1xuXG4gICAgICAgICAgICBicmVha0luZm8ubG9jYWxCaW5kaW5ncyA9IGF3YWl0IHRoaXMuZ2V0QmluZGluZ3MoKVxuXG4gICAgICAgICAgICBpZiAoZW1pdEhpc3RvcnlMZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBicmVha0luZm8uaGlzdG9yeUxlbmd0aCA9IGF3YWl0IHRoaXMuZ2V0SGlzdG9yeUxlbmd0aCgpXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMuZW1pdHRlci5lbWl0KCdsaW5lLWNoYW5nZWQnLCBicmVha0luZm8pXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIGlnbm9yZUVycm9ycyA9IGZhbHNlXG4gICAgcHJpdmF0ZSBjdXJyZW50U3RkZXJyT3V0cHV0ID0gJydcbiAgICBwcml2YXRlIG9uU3RkZXJyUmVhZGFibGUgKCkge1xuICAgICAgICBjb25zdCBzdGRlcnJPdXRwdXQ6IEJ1ZmZlciA9IHRoaXMuc3RkZXJyLnJlYWQoKVxuICAgICAgICBpZiAoISBzdGRlcnJPdXRwdXQgfHwgdGhpcy5pZ25vcmVFcnJvcnMpIHtcbiAgICAgICAgICAgIHJldHVybiAvLyB0aGlzIGlzIHRoZSBlbmQgb2YgdGhlIGlucHV0IHN0cmVhbVxuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5lbWl0dGVyLmVtaXQoJ2Vycm9yJywgc3RkZXJyT3V0cHV0LnRvU3RyaW5nKCkpXG5cbiAgICAgICAgaWYgKHRoaXMuY3VycmVudFN0ZGVyck91dHB1dCA9PT0gJycpIHtcbiAgICAgICAgICAgIHRoaXMuZW1pdHRlci5vbmNlKCdyZWFkeScsICgpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLmVtaXR0ZXIuZW1pdCgnZXJyb3ItY29tcGxldGVkJywgdGhpcy5jdXJyZW50U3RkZXJyT3V0cHV0KVxuICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudFN0ZGVyck91dHB1dCA9ICcnXG4gICAgICAgICAgICB9KVxuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5jdXJyZW50U3RkZXJyT3V0cHV0ICs9IHN0ZGVyck91dHB1dC50b1N0cmluZygpXG4gICAgfVxuXG4gICAgcHJpdmF0ZSBjdXJyZW50Q29tbWFuZEJ1ZmZlciA9ICcnXG4gICAgcHJpdmF0ZSBjb21tYW5kcyA9IFtdIGFzIENvbW1hbmRbXVxuICAgIHByaXZhdGUgY3VycmVudENvbW1hbmQ/OiBDb21tYW5kXG4gICAgcHJpdmF0ZSBjb21tYW5kRmluaXNoZWRTdHJpbmcgPSAnY29tbWFuZF9maW5pc2hfbzR1QjF3aGFndGVxRTh4QnE5b3EnXG5cbiAgICBwcml2YXRlIG9uU3Rkb3V0UmVhZGFibGUgKCkge1xuICAgICAgICBjb25zdCBjdXJyZW50U3RyaW5nID0gKHRoaXMuc3Rkb3V0LnJlYWQoKSB8fCAnJykudG9TdHJpbmcoKVxuXG4gICAgICAgIHRoaXMuY3VycmVudENvbW1hbmRCdWZmZXIgKz0gY3VycmVudFN0cmluZ1xuXG4gICAgICAgIGNvbnN0IGZpbmlzaFN0cmluZ1Bvc2l0aW9uID0gdGhpcy5jdXJyZW50Q29tbWFuZEJ1ZmZlci5zZWFyY2godGhpcy5jb21tYW5kRmluaXNoZWRTdHJpbmcpXG4gICAgICAgIGlmIChmaW5pc2hTdHJpbmdQb3NpdGlvbiAhPT0gLTEpIHtcbiAgICAgICAgICAgIGNvbnN0IG91dHB1dFN0cmluZyA9IHRoaXMuY3VycmVudENvbW1hbmRCdWZmZXIuc2xpY2UoMCwgZmluaXNoU3RyaW5nUG9zaXRpb24pXG5cbiAgICAgICAgICAgIGlmICh0aGlzLmN1cnJlbnRDb21tYW5kKSB7XG4gICAgICAgICAgICAgIGlmICh0aGlzLmN1cnJlbnRDb21tYW5kLmVtaXRDb21tYW5kT3V0cHV0KSB7XG4gICAgICAgICAgICAgICAgICB0aGlzLmVtaXR0ZXIuZW1pdCgnY29uc29sZS1vdXRwdXQnLCBvdXRwdXRTdHJpbmcpXG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRDb21tYW5kLm9uRmluaXNoKG91dHB1dFN0cmluZylcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gVGFrZSB0aGUgZmluaXNoZWQgc3RyaW5nIG9mZiB0aGUgYnVmZmVyIGFuZCBwcm9jZXNzIHRoZSBuZXh0IG91cHV0XG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRDb21tYW5kQnVmZmVyID0gdGhpcy5jdXJyZW50Q29tbWFuZEJ1ZmZlci5zbGljZShcbiAgICAgICAgICAgICAgICBmaW5pc2hTdHJpbmdQb3NpdGlvbiArIHRoaXMuY29tbWFuZEZpbmlzaGVkU3RyaW5nLmxlbmd0aClcbiAgICAgICAgICAgIHRoaXMub25TdGRvdXRSZWFkYWJsZSgpXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwdWJsaWMgYXN5bmMgcnVuIChjb21tYW5kVGV4dDogc3RyaW5nLFxuICAgICAgICAgICAgICAgICAgICAgIGVtaXRTdGF0dXNDaGFuZ2VzOiBib29sZWFuID0gZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgICAgZW1pdEhpc3RvcnlMZW5ndGg6IGJvb2xlYW4gPSBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgICBlbWl0Q29tbWFuZE91dHB1dDogYm9vbGVhbiA9IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICAgZnVsZmlsV2l0aFByb21wdDogYm9vbGVhbiA9IGZhbHNlKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICAgICAgY29uc3Qgc2hpZnRBbmRSdW5Db21tYW5kID0gKCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgY29tbWFuZCA9IHRoaXMuY29tbWFuZHMuc2hpZnQoKVxuXG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRDb21tYW5kID0gY29tbWFuZFxuXG4gICAgICAgICAgICBpZiAoY29tbWFuZCkge1xuICAgICAgICAgICAgICBpZiAoY29tbWFuZC5lbWl0Q29tbWFuZE91dHB1dCkge1xuICAgICAgICAgICAgICAgICAgdGhpcy5lbWl0dGVyLmVtaXQoJ2NvbW1hbmQtaXNzdWVkJywgY29tbWFuZC50ZXh0KVxuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgdGhpcy5zdGRpbi53cml0ZShjb21tYW5kLnRleHQgKyBvcy5FT0wpXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgY3VycmVudFByb21pc2U6IFByb21pc2U8c3RyaW5nPlxuICAgICAgICByZXR1cm4gY3VycmVudFByb21pc2UgPSBuZXcgUHJvbWlzZTxzdHJpbmc+KChmdWxmaWwpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGNvbW1hbmQ6IENvbW1hbmQgPSB7XG4gICAgICAgICAgICAgICAgdGV4dDogY29tbWFuZFRleHQsXG4gICAgICAgICAgICAgICAgZW1pdENvbW1hbmRPdXRwdXQsXG4gICAgICAgICAgICAgICAgZnVsZmlsV2l0aFByb21wdCxcbiAgICAgICAgICAgICAgICBvbkZpbmlzaDogYXN5bmMgKG91dHB1dCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRDb21tYW5kID0gdW5kZWZpbmVkXG5cbiAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gX2Z1bGZpbCAobm9Qcm9tcHQ6IHN0cmluZykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGZ1bGZpbFdpdGhQcm9tcHQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmdWxmaWwob3V0cHV0KVxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmdWxmaWwobm9Qcm9tcHQpXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBjb25zdCBsYXN0RW5kT2ZMaW5lUG9zID0gb3V0cHV0Lmxhc3RJbmRleE9mKG9zLkVPTClcblxuICAgICAgICAgICAgICAgICAgICBpZiAobGFzdEVuZE9mTGluZVBvcyA9PT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8qaS5lLiBubyBvdXRwdXQgaGFzIGJlZW4gcHJvZHVjZWQqL1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVtaXRTdGF0dXNDaGFuZ2VzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5lbWl0U3RhdHVzQ2hhbmdlcyhvdXRwdXQsICcnLCBlbWl0SGlzdG9yeUxlbmd0aCkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIF9mdWxmaWwoJycpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgX2Z1bGZpbCgnJylcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHByb21wdEJlZ2luUG9zaXRpb24gPSBsYXN0RW5kT2ZMaW5lUG9zICsgb3MuRU9MLmxlbmd0aFxuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZW1pdFN0YXR1c0NoYW5nZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmVtaXRTdGF0dXNDaGFuZ2VzKG91dHB1dC5zbGljZShwcm9tcHRCZWdpblBvc2l0aW9uLCBvdXRwdXQubGVuZ3RoKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG91dHB1dC5zbGljZSgwLCBsYXN0RW5kT2ZMaW5lUG9zKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVtaXRIaXN0b3J5TGVuZ3RoKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgX2Z1bGZpbChvdXRwdXQuc2xpY2UoMCwgbGFzdEVuZE9mTGluZVBvcykpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgX2Z1bGZpbChvdXRwdXQuc2xpY2UoMCwgbGFzdEVuZE9mTGluZVBvcykpXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBhd2FpdCBjdXJyZW50UHJvbWlzZVxuXG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLmNvbW1hbmRzLmxlbmd0aCAhPT0gMCAmJiB0aGlzLmN1cnJlbnRDb21tYW5kID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNoaWZ0QW5kUnVuQ29tbWFuZCgpXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMuY29tbWFuZHMucHVzaChjb21tYW5kKVxuXG4gICAgICAgICAgICBpZiAodGhpcy5jdXJyZW50Q29tbWFuZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgc2hpZnRBbmRSdW5Db21tYW5kKClcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICB9XG59XG4iXX0=