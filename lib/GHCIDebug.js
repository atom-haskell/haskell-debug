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
        switch (level) {
            case 'exceptions':
                this.run(':set -fbreak-on-exception');
                break;
            case 'errors':
                this.run(':set -fbreak-on-error');
                break;
            case 'none':
                break;
        }
    }
    addBreakpoint(breakpoint) {
        return __awaiter(this, void 0, void 0, function* () {
            if (typeof breakpoint === 'string') {
                this.run(`:break ${breakpoint}`);
            }
            else {
                const modules = yield this.run(':show modules');
                const matchResult = modules.match(new RegExp('^([^ ]+) +\\( +' + breakpoint.file, 'm'));
                if (matchResult) {
                    this.run(`:break ${matchResult[1]} ${breakpoint.line}`);
                }
                else {
                    atom.notifications.addError(`Failed to set breakpoint on ${breakpoint.file}`);
                }
            }
        });
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
                    }),
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
                        [parseInt(match[4], 10), parseInt(match[5], 10)]],
                }),
            }, {
                pattern: /\[(?:[-\d]*: )?(.*):(\d*):(\d*)-(\d*)\].*> $/,
                func: (match) => ({
                    filename: match[1],
                    range: [[parseInt(match[2], 10) - 1, parseInt(match[3], 10) - 1],
                        [parseInt(match[2], 10) - 1, parseInt(match[4], 10)]],
                }),
            }, {
                pattern: /\[<exception thrown>\].*> $/,
                func: () => GHCIDebug.pausedOnError,
            }, {
                pattern: /.*> $/,
                func: () => GHCIDebug.finishedDebugging,
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
                    localBindings: mainBody.split('\n').slice(1),
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiR0hDSURlYnVnLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2xpYi9HSENJRGVidWcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQUFBLG9DQUFvQztBQUVwQyx5QkFBeUI7QUFDekIsNkJBQTZCO0FBQzdCLGdDQUFnQztBQXFCaEM7SUE2QkUsWUFBWSxXQUFXLEdBQUcsTUFBTSxFQUFFLFdBQXFCLEVBQUUsRUFBRSxNQUFlO1FBekJsRSxZQUFPLEdBU1YsSUFBSSxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUE7UUFFVixPQUFFLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQTtRQU8vQyxpQkFBWSxHQUFHLEtBQUssQ0FBQTtRQUNwQix3QkFBbUIsR0FBRyxFQUFFLENBQUE7UUFDeEIseUJBQW9CLEdBQUcsRUFBRSxDQUFBO1FBQ3pCLGFBQVEsR0FBRyxFQUFlLENBQUE7UUFFMUIsMEJBQXFCLEdBQUcscUNBQXFDLENBQUE7UUFJbkUsSUFBSSxDQUFDLE9BQU8sR0FBRyxFQUFFLENBQUMsS0FBSyxDQUFDLFdBQVcsRUFBRSxRQUFRLEVBQUUsRUFBRSxHQUFHLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFBO1FBRTVFLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLE1BQU0sRUFBRTtZQUN0QixJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxTQUFTLENBQUMsQ0FBQTtRQUNoRCxDQUFDLENBQUMsQ0FBQTtRQUVGLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUE7UUFDakMsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQTtRQUMvQixJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxPQUFP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Q0FBQTtZQUU3RSxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQztnQkFDeEIsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUM7b0JBQzFDLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLGdCQUFnQixFQUFFLFlBQVksQ0FBQyxDQUFBO2dCQUNuRCxDQUFDO2dCQUVELElBQUksQ0FBQyxjQUFjLENBQUMsUUFBUSxDQUFDLFlBQVksQ0FBQyxDQUFBO1lBQzVDLENBQUM7WUFHRCxJQUFJLENBQUMsb0JBQW9CLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixDQUFDLEtBQUssQ0FDekQsb0JBQW9CLEdBQUcsSUFBSSxDQUFDLHFCQUFxQixDQUFDLE1BQU0sQ0FBQyxDQUFBO1lBQzNELElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFBO1FBQ3pCLENBQUM7SUFDSCxDQUFDOztBQTVYYyx1QkFBYSxHQUFHLE1BQU0sQ0FBQyxpQkFBaUIsQ0FBQyxDQUFBO0FBQ3pDLDJCQUFpQixHQUFHLE1BQU0sQ0FBQyxvQkFBb0IsQ0FBQyxDQUFBO0FBRmpFLDhCQThYQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBjcCA9IHJlcXVpcmUoJ2NoaWxkX3Byb2Nlc3MnKVxuaW1wb3J0IHN0cmVhbSA9IHJlcXVpcmUoJ3N0cmVhbScpXG5pbXBvcnQgb3MgPSByZXF1aXJlKCdvcycpXG5pbXBvcnQgcGF0aCA9IHJlcXVpcmUoJ3BhdGgnKVxuaW1wb3J0IGF0b21BUEkgPSByZXF1aXJlKCdhdG9tJylcblxuZXhwb3J0IGludGVyZmFjZSBCcmVha0luZm8ge1xuICBmaWxlbmFtZTogc3RyaW5nXG4gIHJhbmdlOiBbW251bWJlciwgbnVtYmVyXSwgW251bWJlciwgbnVtYmVyXV1cbiAgaGlzdG9yeUxlbmd0aD86IG51bWJlclxuICBsb2NhbEJpbmRpbmdzOiBzdHJpbmdbXVxufVxuXG5leHBvcnQgaW50ZXJmYWNlIEV4Y2VwdGlvbkluZm8ge1xuICBoaXN0b3J5TGVuZ3RoOiBudW1iZXJcbiAgbG9jYWxCaW5kaW5nczogc3RyaW5nW11cbn1cblxuaW50ZXJmYWNlIENvbW1hbmQge1xuICB0ZXh0OiBzdHJpbmdcbiAgZW1pdENvbW1hbmRPdXRwdXQ6IGJvb2xlYW5cbiAgZnVsZmlsV2l0aFByb21wdDogYm9vbGVhblxuICBvbkZpbmlzaDogKG91dHB1dDogc3RyaW5nKSA9PiBhbnlcbn1cblxuZXhwb3J0IGNsYXNzIEdIQ0lEZWJ1ZyB7XG4gIHByaXZhdGUgc3RhdGljIHBhdXNlZE9uRXJyb3IgPSBTeW1ib2woJ1BhdXNlZCBvbiBFcnJvcicpXG4gIHByaXZhdGUgc3RhdGljIGZpbmlzaGVkRGVidWdnaW5nID0gU3ltYm9sKCdGaW5pc2hlZCBkZWJ1Z2dpbmcnKVxuXG4gIHByaXZhdGUgZW1pdHRlcjogYXRvbUFQSS5URW1pdHRlcjx7XG4gICAgJ3BhdXNlZC1vbi1leGNlcHRpb24nOiBFeGNlcHRpb25JbmZvIC8vLyBFbW1pdGVkIHdoZW4gdGhlIGRlYnVnZ2VyIGlzIGF0IGFuIGV4Y2VwdGlvblxuICAgICdyZWFkeSc6IEV4Y2VwdGlvbkluZm8gfCB1bmRlZmluZWQgLy8vIEVtbWl0ZWQgd2hlbiBnaGNpIGhhcyBqdXN0IHN0b3BwZWQgZXhlY3V0aW5nIGEgY29tbWFuZFxuICAgICdlcnJvcic6IHN0cmluZyAvLy8gRW1taXRlZCB3aGVuIHN0ZGVyciBoYXMgaW5wdXRcbiAgICAnZXJyb3ItY29tcGxldGVkJzogc3RyaW5nIC8vLyBFbW1pdGVkIHdoZW4gZ2hjaSByZXBvcnRzIGFuIGVycm9yIGZvciBhIGdpdmVuIGNvbW1hbmRcbiAgICAnbGluZS1jaGFuZ2VkJzogQnJlYWtJbmZvIC8vLyBFbW1pdGVkIHdoZW4gdGhlIGxpbmUgdGhhdCB0aGUgZGVidWdnZXIgaXMgb24gY2hhbmdlc1xuICAgICdkZWJ1Zy1maW5pc2hlZCc6IHVuZGVmaW5lZCAvLy8gRW1taXRlZCB3aGVuIHRoZSBkZWJ1Z2dlciBoYXMgcmVhY2hlZCB0aGUgZW5kIG9mIHRoZSBwcm9ncmFtXG4gICAgJ2NvbnNvbGUtb3V0cHV0Jzogc3RyaW5nIC8vLyBFbW1pdGVkIHdoZW4gdGhlIGdoY2kgaGFzIG91dHB1dGVkIHNvbWV0aGluZyB0byBzdGRvdXQsIGV4Y2x1ZGluZyB0aGUgZXh0cmEgcHJvbXB0XG4gICAgJ2NvbW1hbmQtaXNzdWVkJzogc3RyaW5nIC8vLyBFbW1pdGVkIHdoZW4gYSBjb21tYW5kIGhhcyBiZWVuIGV4ZWN1dGVkXG4gIH0+ID0gbmV3IGF0b21BUEkuRW1pdHRlcigpXG4gIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTogbWVtYmVyLW9yZGVyaW5nXG4gIHB1YmxpYyByZWFkb25seSBvbiA9IHRoaXMuZW1pdHRlci5vbi5iaW5kKHRoaXMuZW1pdHRlcilcblxuICBwcml2YXRlIGdoY2lDbWQ6IGNwLkNoaWxkUHJvY2Vzc1xuICBwcml2YXRlIHN0ZG91dDogc3RyZWFtLlJlYWRhYmxlXG4gIHByaXZhdGUgc3RkaW46IHN0cmVhbS5Xcml0YWJsZVxuICBwcml2YXRlIHN0ZGVycjogc3RyZWFtLlJlYWRhYmxlXG4gIHByaXZhdGUgc3RhcnRUZXh0OiBQcm9taXNlPHN0cmluZz5cbiAgcHJpdmF0ZSBpZ25vcmVFcnJvcnMgPSBmYWxzZVxuICBwcml2YXRlIGN1cnJlbnRTdGRlcnJPdXRwdXQgPSAnJ1xuICBwcml2YXRlIGN1cnJlbnRDb21tYW5kQnVmZmVyID0gJydcbiAgcHJpdmF0ZSBjb21tYW5kcyA9IFtdIGFzIENvbW1hbmRbXVxuICBwcml2YXRlIGN1cnJlbnRDb21tYW5kPzogQ29tbWFuZFxuICBwcml2YXRlIGNvbW1hbmRGaW5pc2hlZFN0cmluZyA9ICdjb21tYW5kX2ZpbmlzaF9vNHVCMXdoYWd0ZXFFOHhCcTlvcSdcblxuICBjb25zdHJ1Y3RvcihnaGNpQ29tbWFuZCA9ICdnaGNpJywgZ2hjaUFyZ3M6IHN0cmluZ1tdID0gW10sIGZvbGRlcj86IHN0cmluZykge1xuXG4gICAgdGhpcy5naGNpQ21kID0gY3Auc3Bhd24oZ2hjaUNvbW1hbmQsIGdoY2lBcmdzLCB7IGN3ZDogZm9sZGVyLCBzaGVsbDogdHJ1ZSB9KVxuXG4gICAgdGhpcy5naGNpQ21kLm9uKCdleGl0JywgKCkgPT4ge1xuICAgICAgdGhpcy5lbWl0dGVyLmVtaXQoJ2RlYnVnLWZpbmlzaGVkJywgdW5kZWZpbmVkKVxuICAgIH0pXG5cbiAgICB0aGlzLnN0ZG91dCA9IHRoaXMuZ2hjaUNtZC5zdGRvdXRcbiAgICB0aGlzLnN0ZGluID0gdGhpcy5naGNpQ21kLnN0ZGluXG4gICAgdGhpcy5zdGRlcnIgPSB0aGlzLmdoY2lDbWQuc3RkZXJyXG4gICAgdGhpcy5zdGRvdXQub24oJ3JlYWRhYmxlJywgKCkgPT4gdGhpcy5vblN0ZG91dFJlYWRhYmxlKCkpXG4gICAgdGhpcy5zdGRlcnIub24oJ3JlYWRhYmxlJywgKCkgPT4gdGhpcy5vblN0ZGVyclJlYWRhYmxlKCkpXG5cbiAgICB0aGlzLmFkZFJlYWR5RXZlbnQoKVxuXG4gICAgdGhpcy5zdGFydFRleHQgPSB0aGlzLnJ1bihgOnNldCBwcm9tcHQgXCIlcz4gJHt0aGlzLmNvbW1hbmRGaW5pc2hlZFN0cmluZ31cImAsIGZhbHNlLCBmYWxzZSwgZmFsc2UsIHRydWUpXG4gIH1cblxuICBwdWJsaWMgZGVzdHJveSgpIHtcbiAgICB0aGlzLnN0b3AoKVxuICB9XG5cbiAgcHVibGljIGxvYWRNb2R1bGUobmFtZTogc3RyaW5nKSB7XG4gICAgY29uc3QgY3dkID0gcGF0aC5kaXJuYW1lKG5hbWUpXG5cbiAgICB0aGlzLnJ1bihgOmNkICR7Y3dkfWApXG4gICAgdGhpcy5ydW4oYDpsb2FkICR7bmFtZX1gKVxuICB9XG5cbiAgcHVibGljIHNldEV4Y2VwdGlvbkJyZWFrTGV2ZWwobGV2ZWw6IEV4Y2VwdGlvbkJyZWFrTGV2ZWxzKSB7XG4gICAgdGhpcy5ydW4oJzp1bnNldCAtZmJyZWFrLW9uLWV4Y2VwdGlvbicpXG4gICAgdGhpcy5ydW4oJzp1bnNldCAtZmJyZWFrLW9uLWVycm9yJylcblxuICAgIHN3aXRjaCAobGV2ZWwpIHtcbiAgICAgIGNhc2UgJ2V4Y2VwdGlvbnMnOlxuICAgICAgICB0aGlzLnJ1bignOnNldCAtZmJyZWFrLW9uLWV4Y2VwdGlvbicpXG4gICAgICAgIGJyZWFrXG4gICAgICBjYXNlICdlcnJvcnMnOlxuICAgICAgICB0aGlzLnJ1bignOnNldCAtZmJyZWFrLW9uLWVycm9yJylcbiAgICAgICAgYnJlYWtcbiAgICAgIGNhc2UgJ25vbmUnOiAvLyBuby1vcFxuICAgICAgICBicmVha1xuICAgIH1cbiAgfVxuXG4gIHB1YmxpYyBhc3luYyBhZGRCcmVha3BvaW50KGJyZWFrcG9pbnQ6IEJyZWFrcG9pbnQgfCBzdHJpbmcpIHtcbiAgICBpZiAodHlwZW9mIGJyZWFrcG9pbnQgPT09ICdzdHJpbmcnKSB7XG4gICAgICB0aGlzLnJ1bihgOmJyZWFrICR7YnJlYWtwb2ludH1gKVxuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBtb2R1bGVzID0gYXdhaXQgdGhpcy5ydW4oJzpzaG93IG1vZHVsZXMnKVxuICAgICAgY29uc3QgbWF0Y2hSZXN1bHQgPSBtb2R1bGVzLm1hdGNoKG5ldyBSZWdFeHAoJ14oW14gXSspICtcXFxcKCArJyArIGJyZWFrcG9pbnQuZmlsZSwgJ20nKSlcbiAgICAgIGlmIChtYXRjaFJlc3VsdCkge1xuICAgICAgICB0aGlzLnJ1bihgOmJyZWFrICR7bWF0Y2hSZXN1bHRbMV19ICR7YnJlYWtwb2ludC5saW5lfWApXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkRXJyb3IoYEZhaWxlZCB0byBzZXQgYnJlYWtwb2ludCBvbiAke2JyZWFrcG9pbnQuZmlsZX1gKVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKiByZXNvbHZlZCB0aGUgZ2l2ZW4gZXhwcmVzc2lvbiB1c2luZyA6cHJpbnQsIHJldHVybnMgbnVsbCBpZiBpdCBpcyBpbnZhbGlkXG4gICovXG4gIHB1YmxpYyBhc3luYyByZXNvbHZlRXhwcmVzc2lvbihleHByZXNzaW9uOiBzdHJpbmcpIHtcbiAgICBpZiAoIWV4cHJlc3Npb24udHJpbSgpKSB7XG4gICAgICByZXR1cm4gdW5kZWZpbmVkXG4gICAgfVxuICAgIC8vIGV4cHJlc3Npb25zIGNhbid0IGhhdmUgbmV3IGxpbmVzXG4gICAgaWYgKGV4cHJlc3Npb24uaW5kZXhPZignXFxuJykgIT09IC0xKSB7XG4gICAgICByZXR1cm4gdW5kZWZpbmVkXG4gICAgfVxuXG4gICAgY29uc3QgZ2V0RXhwcmVzc2lvbiA9IChnaGNpT3V0cHV0OiBzdHJpbmcsIHZhcmlhYmxlOiBzdHJpbmcpID0+IHtcbiAgICAgIGNvbnN0IG1hdGNoUmVzdWx0ID0gZ2hjaU91dHB1dC5tYXRjaCgvW14gXSogPSAoLiopLylcbiAgICAgIGlmICghbWF0Y2hSZXN1bHQpIHsgcmV0dXJuIHVuZGVmaW5lZCB9XG4gICAgICByZXR1cm4gbWF0Y2hSZXN1bHRbMV1cbiAgICB9XG5cbiAgICAvLyBmb3IgdGhlIGNvZGUgYmVsb3csIGlnbm9yZSBlcnJvcnNcbiAgICB0aGlzLmlnbm9yZUVycm9ycyA9IHRydWVcblxuICAgIHRyeSB7XG4gICAgICAvLyB0cnkgcHJpbnRpbmcgZXhwcmVzc2lvblxuICAgICAgY29uc3QgcHJpbnRpbmdSZXN1bHQgPSBnZXRFeHByZXNzaW9uKFxuICAgICAgICBhd2FpdCB0aGlzLnJ1bihgOnByaW50ICR7ZXhwcmVzc2lvbn1gLCBmYWxzZSwgZmFsc2UsIGZhbHNlKSwgZXhwcmVzc2lvbilcbiAgICAgIGlmIChwcmludGluZ1Jlc3VsdCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybiBwcmludGluZ1Jlc3VsdFxuICAgICAgfVxuXG4gICAgICAvLyBpZiB0aGF0IGZhaWxzIGFzc2lnbiBpdCB0byBhIHRlbXBvcmFyeSB2YXJpYWJsZSBhbmQgZXZhbHVhdGUgdGhhdFxuICAgICAgbGV0IHRlbXBWYXJOdW0gPSAwXG4gICAgICBsZXQgcG90ZW50aWFsVGVtcFZhcjogc3RyaW5nIHwgdW5kZWZpbmVkXG4gICAgICBkbyB7XG4gICAgICAgIHBvdGVudGlhbFRlbXBWYXIgPSBnZXRFeHByZXNzaW9uKFxuICAgICAgICAgIGF3YWl0IHRoaXMucnVuKGA6cHJpbnQgdGVtcCR7dGVtcFZhck51bX1gLCBmYWxzZSwgZmFsc2UsIGZhbHNlKSwgYHRlbXAke3RlbXBWYXJOdW19YClcbiAgICAgICAgdGVtcFZhck51bSArPSAxXG4gICAgICB9IHdoaWxlIChwb3RlbnRpYWxUZW1wVmFyICE9PSB1bmRlZmluZWQpXG5cbiAgICAgIGF3YWl0IHRoaXMucnVuKGBsZXQgdGVtcCR7dGVtcFZhck51bX0gPSAke2V4cHJlc3Npb259YCwgZmFsc2UsIGZhbHNlLCBmYWxzZSlcbiAgICAgIHJldHVybiBnZXRFeHByZXNzaW9uKGF3YWl0IHRoaXMucnVuKGA6cHJpbnQgdGVtcCR7dGVtcFZhck51bX1gLCBmYWxzZSwgZmFsc2UsIGZhbHNlKSwgYHRlbXAke3RlbXBWYXJOdW19YClcbiAgICB9IGZpbmFsbHkge1xuICAgICAgdGhpcy5pZ25vcmVFcnJvcnMgPSBmYWxzZVxuICAgIH1cbiAgfVxuXG4gIHB1YmxpYyBmb3J3YXJkKCkge1xuICAgIHRoaXMucnVuKCc6Zm9yd2FyZCcsIHRydWUpXG4gIH1cblxuICBwdWJsaWMgYmFjaygpIHtcbiAgICB0aGlzLnJ1bignOmJhY2snLCB0cnVlKVxuICB9XG5cbiAgcHVibGljIHN0ZXAoKSB7XG4gICAgdGhpcy5ydW4oJzpzdGVwJywgdHJ1ZSwgdHJ1ZSlcbiAgfVxuXG4gIHB1YmxpYyBzdG9wKCkge1xuICAgIHRoaXMucnVuKCc6cXVpdCcpXG4gICAgc2V0VGltZW91dChcbiAgICAgICgpID0+IHtcbiAgICAgICAgdGhpcy5naGNpQ21kLmtpbGwoKVxuICAgICAgfSxcbiAgICAgIDMwMDApXG4gIH1cblxuICBwdWJsaWMgY29udGludWUoKSB7XG4gICAgdGhpcy5ydW4oJzpjb250aW51ZScsIHRydWUpXG4gIH1cblxuICBwdWJsaWMgYXN5bmMgYWRkZWRBbGxMaXN0ZW5lcnMoKSB7XG4gICAgdGhpcy5zdGFydFRleHQudGhlbigodGV4dCkgPT4ge1xuICAgICAgY29uc3QgZmlyc3RQcm9tcHQgPSB0ZXh0LmluZGV4T2YoJz4gJylcbiAgICAgIHRoaXMuZW1pdHRlci5lbWl0KCdjb25zb2xlLW91dHB1dCcsIHRleHQuc2xpY2UoMCwgZmlyc3RQcm9tcHQgKyAyKSlcbiAgICB9KVxuICB9XG5cbiAgcHVibGljIGFzeW5jIHN0YXJ0RGVidWcobW9kdWxlTmFtZT86IHN0cmluZykge1xuICAgIG1vZHVsZU5hbWUgPSBtb2R1bGVOYW1lIHx8ICdtYWluJ1xuICAgIGF3YWl0IHRoaXMucnVuKCc6dHJhY2UgJyArIG1vZHVsZU5hbWUsIHRydWUsIHRydWUpXG4gIH1cblxuICBwdWJsaWMgYXN5bmMgcnVuKFxuICAgIGNvbW1hbmRUZXh0OiBzdHJpbmcsXG4gICAgZW1pdFN0YXR1c0NoYW5nZXM6IGJvb2xlYW4gPSBmYWxzZSxcbiAgICBlbWl0SGlzdG9yeUxlbmd0aDogYm9vbGVhbiA9IGZhbHNlLFxuICAgIGVtaXRDb21tYW5kT3V0cHV0OiBib29sZWFuID0gdHJ1ZSxcbiAgICBmdWxmaWxXaXRoUHJvbXB0OiBib29sZWFuID0gZmFsc2UsXG4gICk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3Qgc2hpZnRBbmRSdW5Db21tYW5kID0gKCkgPT4ge1xuICAgICAgY29uc3QgY29tbWFuZCA9IHRoaXMuY29tbWFuZHMuc2hpZnQoKVxuXG4gICAgICB0aGlzLmN1cnJlbnRDb21tYW5kID0gY29tbWFuZFxuXG4gICAgICBpZiAoY29tbWFuZCkge1xuICAgICAgICBpZiAoY29tbWFuZC5lbWl0Q29tbWFuZE91dHB1dCkge1xuICAgICAgICAgIHRoaXMuZW1pdHRlci5lbWl0KCdjb21tYW5kLWlzc3VlZCcsIGNvbW1hbmQudGV4dClcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuc3RkaW4ud3JpdGUoY29tbWFuZC50ZXh0ICsgb3MuRU9MKVxuICAgICAgfVxuICAgIH1cblxuICAgIGxldCBjdXJyZW50UHJvbWlzZTogUHJvbWlzZTxzdHJpbmc+XG4gICAgcmV0dXJuIGN1cnJlbnRQcm9taXNlID0gbmV3IFByb21pc2U8c3RyaW5nPigoZnVsZmlsKSA9PiB7XG4gICAgICBjb25zdCBjb21tYW5kOiBDb21tYW5kID0ge1xuICAgICAgICB0ZXh0OiBjb21tYW5kVGV4dCxcbiAgICAgICAgZW1pdENvbW1hbmRPdXRwdXQsXG4gICAgICAgIGZ1bGZpbFdpdGhQcm9tcHQsXG4gICAgICAgIG9uRmluaXNoOiBhc3luYyAob3V0cHV0KSA9PiB7XG4gICAgICAgICAgdGhpcy5jdXJyZW50Q29tbWFuZCA9IHVuZGVmaW5lZFxuXG4gICAgICAgICAgZnVuY3Rpb24gX2Z1bGZpbChub1Byb21wdDogc3RyaW5nKSB7XG4gICAgICAgICAgICBpZiAoZnVsZmlsV2l0aFByb21wdCkge1xuICAgICAgICAgICAgICBmdWxmaWwob3V0cHV0KVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgZnVsZmlsKG5vUHJvbXB0KVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICAgIGNvbnN0IGxhc3RFbmRPZkxpbmVQb3MgPSBvdXRwdXQubGFzdEluZGV4T2Yob3MuRU9MKVxuXG4gICAgICAgICAgaWYgKGxhc3RFbmRPZkxpbmVQb3MgPT09IC0xKSB7XG4gICAgICAgICAgICAvKmkuZS4gbm8gb3V0cHV0IGhhcyBiZWVuIHByb2R1Y2VkKi9cbiAgICAgICAgICAgIGlmIChlbWl0U3RhdHVzQ2hhbmdlcykge1xuICAgICAgICAgICAgICB0aGlzLmVtaXRTdGF0dXNDaGFuZ2VzKG91dHB1dCwgJycsIGVtaXRIaXN0b3J5TGVuZ3RoKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICBfZnVsZmlsKCcnKVxuICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgX2Z1bGZpbCgnJylcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc3QgcHJvbXB0QmVnaW5Qb3NpdGlvbiA9IGxhc3RFbmRPZkxpbmVQb3MgKyBvcy5FT0wubGVuZ3RoXG5cbiAgICAgICAgICAgIGlmIChlbWl0U3RhdHVzQ2hhbmdlcykge1xuICAgICAgICAgICAgICB0aGlzLmVtaXRTdGF0dXNDaGFuZ2VzKFxuICAgICAgICAgICAgICAgIG91dHB1dC5zbGljZShwcm9tcHRCZWdpblBvc2l0aW9uLCBvdXRwdXQubGVuZ3RoKSxcbiAgICAgICAgICAgICAgICBvdXRwdXQuc2xpY2UoMCwgbGFzdEVuZE9mTGluZVBvcyksXG4gICAgICAgICAgICAgICAgZW1pdEhpc3RvcnlMZW5ndGgsXG4gICAgICAgICAgICAgICkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgX2Z1bGZpbChvdXRwdXQuc2xpY2UoMCwgbGFzdEVuZE9mTGluZVBvcykpXG4gICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBfZnVsZmlsKG91dHB1dC5zbGljZSgwLCBsYXN0RW5kT2ZMaW5lUG9zKSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG5cbiAgICAgICAgICBhd2FpdCBjdXJyZW50UHJvbWlzZVxuXG4gICAgICAgICAgaWYgKHRoaXMuY29tbWFuZHMubGVuZ3RoICE9PSAwKSB7XG4gICAgICAgICAgICBzaGlmdEFuZFJ1bkNvbW1hbmQoKVxuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgIH1cblxuICAgICAgdGhpcy5jb21tYW5kcy5wdXNoKGNvbW1hbmQpXG5cbiAgICAgIGlmICh0aGlzLmN1cnJlbnRDb21tYW5kID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgc2hpZnRBbmRSdW5Db21tYW5kKClcbiAgICAgIH1cbiAgICB9KVxuICB9XG5cbiAgcHJpdmF0ZSBhZGRSZWFkeUV2ZW50KCkge1xuICAgIGNvbnN0IGV2ZW50U3VicyA9IFtcbiAgICAgICdwYXVzZWQtb24tZXhjZXB0aW9uJyxcbiAgICAgICdsaW5lLWNoYW5nZWQnLFxuICAgICAgJ2RlYnVnLWZpbmlzaGVkJyxcbiAgICBdXG5cbiAgICBmb3IgKGNvbnN0IGV2ZW50TmFtZSBvZiBldmVudFN1YnMpIHtcbiAgICAgICh0aGlzLmVtaXR0ZXIub24gYXMgYW55KShldmVudE5hbWUsICgpID0+IHRoaXMuZW1pdHRlci5lbWl0KCdyZWFkeScsIHVuZGVmaW5lZCkpXG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBnZXRCaW5kaW5ncygpIHtcbiAgICBjb25zdCBvdXRwdXRTdHIgPSBhd2FpdCB0aGlzLnJ1bignOnNob3cgYmluZGluZ3MnLCBmYWxzZSwgZmFsc2UsIGZhbHNlKVxuICAgIHJldHVybiBvdXRwdXRTdHIuc3BsaXQob3MuRU9MKVxuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBnZXRIaXN0b3J5TGVuZ3RoKCkge1xuICAgIGNvbnN0IGhpc3RvcnlRdWVyeSA9IGF3YWl0IHRoaXMucnVuKCc6aGlzdG9yeSAxMDAnLCBmYWxzZSwgZmFsc2UsIGZhbHNlKVxuICAgIGNvbnN0IHJlZ2V4ID0gLy0oXFxkKikuKig/OlxcbnxcXHJ8XFxyXFxuKTxlbmQgb2YgaGlzdG9yeT4kL1xuXG4gICAgY29uc3QgbWF0Y2hSZXN1bHQgPSBoaXN0b3J5UXVlcnkubWF0Y2gocmVnZXgpXG4gICAgaWYgKCFtYXRjaFJlc3VsdCkge1xuICAgICAgaWYgKGhpc3RvcnlRdWVyeS5zbGljZSgtMykgPT09ICcuLi4nKSB7XG4gICAgICAgIHJldHVybiBJbmZpbml0eSAvLyBoaXN0b3J5IGlzIHZlcnkgbG9uZ1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIDBcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHBhcnNlSW50KG1hdGNoUmVzdWx0WzFdLCAxMClcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIHBhcnNlUHJvbXB0KHN0ZE91dHB1dDogc3RyaW5nKTogQnJlYWtJbmZvIHwgU3ltYm9sIHtcbiAgICBjb25zdCBwYXR0ZXJucyA9IFt7XG4gICAgICBwYXR0ZXJuOiAvXFxbKD86Wy1cXGRdKjogKT8oLiopOlxcKChcXGQrKSwoXFxkKylcXCktXFwoKFxcZCspLChcXGQrKVxcKS4qXFxdLio+ICQvLFxuICAgICAgZnVuYzogKG1hdGNoKSA9PiAoe1xuICAgICAgICBmaWxlbmFtZTogbWF0Y2hbMV0sXG4gICAgICAgIHJhbmdlOiBbW3BhcnNlSW50KG1hdGNoWzJdLCAxMCkgLSAxLCBwYXJzZUludChtYXRjaFszXSwgMTApIC0gMV0sXG4gICAgICAgIFtwYXJzZUludChtYXRjaFs0XSwgMTApLCBwYXJzZUludChtYXRjaFs1XSwgMTApXV0sXG4gICAgICB9KSxcbiAgICB9LCB7XG4gICAgICBwYXR0ZXJuOiAvXFxbKD86Wy1cXGRdKjogKT8oLiopOihcXGQqKTooXFxkKiktKFxcZCopXFxdLio+ICQvLFxuICAgICAgZnVuYzogKG1hdGNoKSA9PiAoe1xuICAgICAgICBmaWxlbmFtZTogbWF0Y2hbMV0sXG4gICAgICAgIHJhbmdlOiBbW3BhcnNlSW50KG1hdGNoWzJdLCAxMCkgLSAxLCBwYXJzZUludChtYXRjaFszXSwgMTApIC0gMV0sXG4gICAgICAgIFtwYXJzZUludChtYXRjaFsyXSwgMTApIC0gMSwgcGFyc2VJbnQobWF0Y2hbNF0sIDEwKV1dLFxuICAgICAgfSksXG4gICAgfSwge1xuICAgICAgcGF0dGVybjogL1xcWzxleGNlcHRpb24gdGhyb3duPlxcXS4qPiAkLyxcbiAgICAgIGZ1bmM6ICgpID0+IEdIQ0lEZWJ1Zy5wYXVzZWRPbkVycm9yLFxuICAgIH0sIHtcbiAgICAgIHBhdHRlcm46IC8uKj4gJC8sXG4gICAgICBmdW5jOiAoKSA9PiBHSENJRGVidWcuZmluaXNoZWREZWJ1Z2dpbmcsXG4gICAgfV0gYXMgQXJyYXk8eyBwYXR0ZXJuOiBSZWdFeHA7IGZ1bmM6IChtYXRjaDogc3RyaW5nW10pID0+IEJyZWFrSW5mbyB8IFN5bWJvbCB9PlxuICAgIGZvciAoY29uc3QgcGF0dGVybiBvZiBwYXR0ZXJucykge1xuICAgICAgY29uc3QgbWF0Y2hSZXN1bHQgPSBzdGRPdXRwdXQubWF0Y2gocGF0dGVybi5wYXR0ZXJuKVxuICAgICAgaWYgKG1hdGNoUmVzdWx0KSB7XG4gICAgICAgIHJldHVybiBwYXR0ZXJuLmZ1bmMobWF0Y2hSZXN1bHQpXG4gICAgICB9XG4gICAgfVxuICAgIHRocm93IG5ldyBFcnJvcignQ2Fubm90IHJlYWQgcHJvbXB0OiBcXG4nICsgc3RkT3V0cHV0KVxuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBlbWl0U3RhdHVzQ2hhbmdlcyhwcm9tcHQ6IHN0cmluZywgbWFpbkJvZHk6IHN0cmluZywgZW1pdEhpc3RvcnlMZW5ndGg6IGJvb2xlYW4pIHtcbiAgICBjb25zdCByZXN1bHQgPSB0aGlzLnBhcnNlUHJvbXB0KHByb21wdClcblxuICAgIGlmIChyZXN1bHQgPT09IEdIQ0lEZWJ1Zy5wYXVzZWRPbkVycm9yKSB7XG4gICAgICBjb25zdCBoaXN0b3J5TGVuZ3RoID0gYXdhaXQgdGhpcy5nZXRIaXN0b3J5TGVuZ3RoKClcblxuICAgICAgdGhpcy5lbWl0dGVyLmVtaXQoJ3BhdXNlZC1vbi1leGNlcHRpb24nLCB7XG4gICAgICAgIGhpc3RvcnlMZW5ndGgsXG4gICAgICAgIGxvY2FsQmluZGluZ3M6IG1haW5Cb2R5LnNwbGl0KCdcXG4nKS5zbGljZSgxKSxcbiAgICAgIH0pXG4gICAgfSBlbHNlIGlmIChyZXN1bHQgPT09IEdIQ0lEZWJ1Zy5maW5pc2hlZERlYnVnZ2luZykge1xuICAgICAgdGhpcy5lbWl0dGVyLmVtaXQoJ2RlYnVnLWZpbmlzaGVkJywgdW5kZWZpbmVkKVxuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBicmVha0luZm8gPSByZXN1bHQgYXMgQnJlYWtJbmZvXG5cbiAgICAgIGJyZWFrSW5mby5sb2NhbEJpbmRpbmdzID0gYXdhaXQgdGhpcy5nZXRCaW5kaW5ncygpXG5cbiAgICAgIGlmIChlbWl0SGlzdG9yeUxlbmd0aCkge1xuICAgICAgICBicmVha0luZm8uaGlzdG9yeUxlbmd0aCA9IGF3YWl0IHRoaXMuZ2V0SGlzdG9yeUxlbmd0aCgpXG4gICAgICB9XG5cbiAgICAgIHRoaXMuZW1pdHRlci5lbWl0KCdsaW5lLWNoYW5nZWQnLCBicmVha0luZm8pXG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBvblN0ZGVyclJlYWRhYmxlKCkge1xuICAgIGNvbnN0IHN0ZGVyck91dHB1dDogQnVmZmVyID0gdGhpcy5zdGRlcnIucmVhZCgpXG4gICAgaWYgKCFzdGRlcnJPdXRwdXQgfHwgdGhpcy5pZ25vcmVFcnJvcnMpIHtcbiAgICAgIHJldHVybiAvLyB0aGlzIGlzIHRoZSBlbmQgb2YgdGhlIGlucHV0IHN0cmVhbVxuICAgIH1cblxuICAgIHRoaXMuZW1pdHRlci5lbWl0KCdlcnJvcicsIHN0ZGVyck91dHB1dC50b1N0cmluZygpKVxuXG4gICAgaWYgKHRoaXMuY3VycmVudFN0ZGVyck91dHB1dCA9PT0gJycpIHtcbiAgICAgIGNvbnN0IGRpc3AgPSB0aGlzLmVtaXR0ZXIub24oJ3JlYWR5JywgKCkgPT4ge1xuICAgICAgICB0aGlzLmVtaXR0ZXIuZW1pdCgnZXJyb3ItY29tcGxldGVkJywgdGhpcy5jdXJyZW50U3RkZXJyT3V0cHV0KVxuICAgICAgICB0aGlzLmN1cnJlbnRTdGRlcnJPdXRwdXQgPSAnJ1xuICAgICAgICBkaXNwLmRpc3Bvc2UoKVxuICAgICAgfSlcbiAgICB9XG5cbiAgICB0aGlzLmN1cnJlbnRTdGRlcnJPdXRwdXQgKz0gc3RkZXJyT3V0cHV0LnRvU3RyaW5nKClcbiAgfVxuXG4gIHByaXZhdGUgb25TdGRvdXRSZWFkYWJsZSgpIHtcbiAgICBjb25zdCBjdXJyZW50U3RyaW5nID0gKHRoaXMuc3Rkb3V0LnJlYWQoKSB8fCAnJykudG9TdHJpbmcoKVxuXG4gICAgdGhpcy5jdXJyZW50Q29tbWFuZEJ1ZmZlciArPSBjdXJyZW50U3RyaW5nXG5cbiAgICBjb25zdCBmaW5pc2hTdHJpbmdQb3NpdGlvbiA9IHRoaXMuY3VycmVudENvbW1hbmRCdWZmZXIuc2VhcmNoKHRoaXMuY29tbWFuZEZpbmlzaGVkU3RyaW5nKVxuICAgIGlmIChmaW5pc2hTdHJpbmdQb3NpdGlvbiAhPT0gLTEpIHtcbiAgICAgIGNvbnN0IG91dHB1dFN0cmluZyA9IHRoaXMuY3VycmVudENvbW1hbmRCdWZmZXIuc2xpY2UoMCwgZmluaXNoU3RyaW5nUG9zaXRpb24pXG5cbiAgICAgIGlmICh0aGlzLmN1cnJlbnRDb21tYW5kKSB7XG4gICAgICAgIGlmICh0aGlzLmN1cnJlbnRDb21tYW5kLmVtaXRDb21tYW5kT3V0cHV0KSB7XG4gICAgICAgICAgdGhpcy5lbWl0dGVyLmVtaXQoJ2NvbnNvbGUtb3V0cHV0Jywgb3V0cHV0U3RyaW5nKVxuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5jdXJyZW50Q29tbWFuZC5vbkZpbmlzaChvdXRwdXRTdHJpbmcpXG4gICAgICB9XG5cbiAgICAgIC8vIFRha2UgdGhlIGZpbmlzaGVkIHN0cmluZyBvZmYgdGhlIGJ1ZmZlciBhbmQgcHJvY2VzcyB0aGUgbmV4dCBvdXB1dFxuICAgICAgdGhpcy5jdXJyZW50Q29tbWFuZEJ1ZmZlciA9IHRoaXMuY3VycmVudENvbW1hbmRCdWZmZXIuc2xpY2UoXG4gICAgICAgIGZpbmlzaFN0cmluZ1Bvc2l0aW9uICsgdGhpcy5jb21tYW5kRmluaXNoZWRTdHJpbmcubGVuZ3RoKVxuICAgICAgdGhpcy5vblN0ZG91dFJlYWRhYmxlKClcbiAgICB9XG4gIH1cbn1cbiJdfQ==