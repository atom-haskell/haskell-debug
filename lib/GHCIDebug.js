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
                const matchResult = modules.match(new RegExp('([^ ]+) +\\( +' + breakpoint.file));
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiR0hDSURlYnVnLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2xpYi9HSENJRGVidWcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQUFBLG9DQUFvQztBQUVwQyx5QkFBeUI7QUFDekIsNkJBQTZCO0FBQzdCLGdDQUFnQztBQXFCaEM7SUE2QkUsWUFBWSxXQUFXLEdBQUcsTUFBTSxFQUFFLFdBQXFCLEVBQUUsRUFBRSxNQUFlO1FBekJsRSxZQUFPLEdBU1YsSUFBSSxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUE7UUFFVixPQUFFLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQTtRQU8vQyxpQkFBWSxHQUFHLEtBQUssQ0FBQTtRQUNwQix3QkFBbUIsR0FBRyxFQUFFLENBQUE7UUFDeEIseUJBQW9CLEdBQUcsRUFBRSxDQUFBO1FBQ3pCLGFBQVEsR0FBRyxFQUFlLENBQUE7UUFFMUIsMEJBQXFCLEdBQUcscUNBQXFDLENBQUE7UUFJbkUsSUFBSSxDQUFDLE9BQU8sR0FBRyxFQUFFLENBQUMsS0FBSyxDQUFDLFdBQVcsRUFBRSxRQUFRLEVBQUUsRUFBRSxHQUFHLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFBO1FBRTVFLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLE1BQU0sRUFBRTtZQUN0QixJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxTQUFTLENBQUMsQ0FBQTtRQUNoRCxDQUFDLENBQUMsQ0FBQTtRQUVGLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUE7UUFDakMsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQTtRQUMvQixJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxPQUFP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LEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDO2dCQUN4QixFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLGlCQUFpQixDQUFDLENBQUMsQ0FBQztvQkFDMUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsWUFBWSxDQUFDLENBQUE7Z0JBQ25ELENBQUM7Z0JBRUQsSUFBSSxDQUFDLGNBQWMsQ0FBQyxRQUFRLENBQUMsWUFBWSxDQUFDLENBQUE7WUFDNUMsQ0FBQztZQUdELElBQUksQ0FBQyxvQkFBb0IsR0FBRyxJQUFJLENBQUMsb0JBQW9CLENBQUMsS0FBSyxDQUN6RCxvQkFBb0IsR0FBRyxJQUFJLENBQUMscUJBQXFCLENBQUMsTUFBTSxDQUFDLENBQUE7WUFDM0QsSUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUE7UUFDekIsQ0FBQztJQUNILENBQUM7O0FBNVhjLHVCQUFhLEdBQUcsTUFBTSxDQUFDLGlCQUFpQixDQUFDLENBQUE7QUFDekMsMkJBQWlCLEdBQUcsTUFBTSxDQUFDLG9CQUFvQixDQUFDLENBQUE7QUFGakUsOEJBOFhDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGNwID0gcmVxdWlyZSgnY2hpbGRfcHJvY2VzcycpXG5pbXBvcnQgc3RyZWFtID0gcmVxdWlyZSgnc3RyZWFtJylcbmltcG9ydCBvcyA9IHJlcXVpcmUoJ29zJylcbmltcG9ydCBwYXRoID0gcmVxdWlyZSgncGF0aCcpXG5pbXBvcnQgYXRvbUFQSSA9IHJlcXVpcmUoJ2F0b20nKVxuXG5leHBvcnQgaW50ZXJmYWNlIEJyZWFrSW5mbyB7XG4gIGZpbGVuYW1lOiBzdHJpbmdcbiAgcmFuZ2U6IFtbbnVtYmVyLCBudW1iZXJdLCBbbnVtYmVyLCBudW1iZXJdXVxuICBoaXN0b3J5TGVuZ3RoPzogbnVtYmVyXG4gIGxvY2FsQmluZGluZ3M6IHN0cmluZ1tdXG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgRXhjZXB0aW9uSW5mbyB7XG4gIGhpc3RvcnlMZW5ndGg6IG51bWJlclxuICBsb2NhbEJpbmRpbmdzOiBzdHJpbmdbXVxufVxuXG5pbnRlcmZhY2UgQ29tbWFuZCB7XG4gIHRleHQ6IHN0cmluZ1xuICBlbWl0Q29tbWFuZE91dHB1dDogYm9vbGVhblxuICBmdWxmaWxXaXRoUHJvbXB0OiBib29sZWFuXG4gIG9uRmluaXNoOiAob3V0cHV0OiBzdHJpbmcpID0+IGFueVxufVxuXG5leHBvcnQgY2xhc3MgR0hDSURlYnVnIHtcbiAgcHJpdmF0ZSBzdGF0aWMgcGF1c2VkT25FcnJvciA9IFN5bWJvbCgnUGF1c2VkIG9uIEVycm9yJylcbiAgcHJpdmF0ZSBzdGF0aWMgZmluaXNoZWREZWJ1Z2dpbmcgPSBTeW1ib2woJ0ZpbmlzaGVkIGRlYnVnZ2luZycpXG5cbiAgcHJpdmF0ZSBlbWl0dGVyOiBhdG9tQVBJLlRFbWl0dGVyPHtcbiAgICAncGF1c2VkLW9uLWV4Y2VwdGlvbic6IEV4Y2VwdGlvbkluZm8gLy8vIEVtbWl0ZWQgd2hlbiB0aGUgZGVidWdnZXIgaXMgYXQgYW4gZXhjZXB0aW9uXG4gICAgJ3JlYWR5JzogRXhjZXB0aW9uSW5mbyB8IHVuZGVmaW5lZCAvLy8gRW1taXRlZCB3aGVuIGdoY2kgaGFzIGp1c3Qgc3RvcHBlZCBleGVjdXRpbmcgYSBjb21tYW5kXG4gICAgJ2Vycm9yJzogc3RyaW5nIC8vLyBFbW1pdGVkIHdoZW4gc3RkZXJyIGhhcyBpbnB1dFxuICAgICdlcnJvci1jb21wbGV0ZWQnOiBzdHJpbmcgLy8vIEVtbWl0ZWQgd2hlbiBnaGNpIHJlcG9ydHMgYW4gZXJyb3IgZm9yIGEgZ2l2ZW4gY29tbWFuZFxuICAgICdsaW5lLWNoYW5nZWQnOiBCcmVha0luZm8gLy8vIEVtbWl0ZWQgd2hlbiB0aGUgbGluZSB0aGF0IHRoZSBkZWJ1Z2dlciBpcyBvbiBjaGFuZ2VzXG4gICAgJ2RlYnVnLWZpbmlzaGVkJzogdW5kZWZpbmVkIC8vLyBFbW1pdGVkIHdoZW4gdGhlIGRlYnVnZ2VyIGhhcyByZWFjaGVkIHRoZSBlbmQgb2YgdGhlIHByb2dyYW1cbiAgICAnY29uc29sZS1vdXRwdXQnOiBzdHJpbmcgLy8vIEVtbWl0ZWQgd2hlbiB0aGUgZ2hjaSBoYXMgb3V0cHV0ZWQgc29tZXRoaW5nIHRvIHN0ZG91dCwgZXhjbHVkaW5nIHRoZSBleHRyYSBwcm9tcHRcbiAgICAnY29tbWFuZC1pc3N1ZWQnOiBzdHJpbmcgLy8vIEVtbWl0ZWQgd2hlbiBhIGNvbW1hbmQgaGFzIGJlZW4gZXhlY3V0ZWRcbiAgfT4gPSBuZXcgYXRvbUFQSS5FbWl0dGVyKClcbiAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOiBtZW1iZXItb3JkZXJpbmdcbiAgcHVibGljIHJlYWRvbmx5IG9uID0gdGhpcy5lbWl0dGVyLm9uLmJpbmQodGhpcy5lbWl0dGVyKVxuXG4gIHByaXZhdGUgZ2hjaUNtZDogY3AuQ2hpbGRQcm9jZXNzXG4gIHByaXZhdGUgc3Rkb3V0OiBzdHJlYW0uUmVhZGFibGVcbiAgcHJpdmF0ZSBzdGRpbjogc3RyZWFtLldyaXRhYmxlXG4gIHByaXZhdGUgc3RkZXJyOiBzdHJlYW0uUmVhZGFibGVcbiAgcHJpdmF0ZSBzdGFydFRleHQ6IFByb21pc2U8c3RyaW5nPlxuICBwcml2YXRlIGlnbm9yZUVycm9ycyA9IGZhbHNlXG4gIHByaXZhdGUgY3VycmVudFN0ZGVyck91dHB1dCA9ICcnXG4gIHByaXZhdGUgY3VycmVudENvbW1hbmRCdWZmZXIgPSAnJ1xuICBwcml2YXRlIGNvbW1hbmRzID0gW10gYXMgQ29tbWFuZFtdXG4gIHByaXZhdGUgY3VycmVudENvbW1hbmQ/OiBDb21tYW5kXG4gIHByaXZhdGUgY29tbWFuZEZpbmlzaGVkU3RyaW5nID0gJ2NvbW1hbmRfZmluaXNoX280dUIxd2hhZ3RlcUU4eEJxOW9xJ1xuXG4gIGNvbnN0cnVjdG9yKGdoY2lDb21tYW5kID0gJ2doY2knLCBnaGNpQXJnczogc3RyaW5nW10gPSBbXSwgZm9sZGVyPzogc3RyaW5nKSB7XG5cbiAgICB0aGlzLmdoY2lDbWQgPSBjcC5zcGF3bihnaGNpQ29tbWFuZCwgZ2hjaUFyZ3MsIHsgY3dkOiBmb2xkZXIsIHNoZWxsOiB0cnVlIH0pXG5cbiAgICB0aGlzLmdoY2lDbWQub24oJ2V4aXQnLCAoKSA9PiB7XG4gICAgICB0aGlzLmVtaXR0ZXIuZW1pdCgnZGVidWctZmluaXNoZWQnLCB1bmRlZmluZWQpXG4gICAgfSlcblxuICAgIHRoaXMuc3Rkb3V0ID0gdGhpcy5naGNpQ21kLnN0ZG91dFxuICAgIHRoaXMuc3RkaW4gPSB0aGlzLmdoY2lDbWQuc3RkaW5cbiAgICB0aGlzLnN0ZGVyciA9IHRoaXMuZ2hjaUNtZC5zdGRlcnJcbiAgICB0aGlzLnN0ZG91dC5vbigncmVhZGFibGUnLCAoKSA9PiB0aGlzLm9uU3Rkb3V0UmVhZGFibGUoKSlcbiAgICB0aGlzLnN0ZGVyci5vbigncmVhZGFibGUnLCAoKSA9PiB0aGlzLm9uU3RkZXJyUmVhZGFibGUoKSlcblxuICAgIHRoaXMuYWRkUmVhZHlFdmVudCgpXG5cbiAgICB0aGlzLnN0YXJ0VGV4dCA9IHRoaXMucnVuKGA6c2V0IHByb21wdCBcIiVzPiAke3RoaXMuY29tbWFuZEZpbmlzaGVkU3RyaW5nfVwiYCwgZmFsc2UsIGZhbHNlLCBmYWxzZSwgdHJ1ZSlcbiAgfVxuXG4gIHB1YmxpYyBkZXN0cm95KCkge1xuICAgIHRoaXMuc3RvcCgpXG4gIH1cblxuICBwdWJsaWMgbG9hZE1vZHVsZShuYW1lOiBzdHJpbmcpIHtcbiAgICBjb25zdCBjd2QgPSBwYXRoLmRpcm5hbWUobmFtZSlcblxuICAgIHRoaXMucnVuKGA6Y2QgJHtjd2R9YClcbiAgICB0aGlzLnJ1bihgOmxvYWQgJHtuYW1lfWApXG4gIH1cblxuICBwdWJsaWMgc2V0RXhjZXB0aW9uQnJlYWtMZXZlbChsZXZlbDogRXhjZXB0aW9uQnJlYWtMZXZlbHMpIHtcbiAgICB0aGlzLnJ1bignOnVuc2V0IC1mYnJlYWstb24tZXhjZXB0aW9uJylcbiAgICB0aGlzLnJ1bignOnVuc2V0IC1mYnJlYWstb24tZXJyb3InKVxuXG4gICAgc3dpdGNoIChsZXZlbCkge1xuICAgICAgY2FzZSAnZXhjZXB0aW9ucyc6XG4gICAgICAgIHRoaXMucnVuKCc6c2V0IC1mYnJlYWstb24tZXhjZXB0aW9uJylcbiAgICAgICAgYnJlYWtcbiAgICAgIGNhc2UgJ2Vycm9ycyc6XG4gICAgICAgIHRoaXMucnVuKCc6c2V0IC1mYnJlYWstb24tZXJyb3InKVxuICAgICAgICBicmVha1xuICAgICAgY2FzZSAnbm9uZSc6IC8vIG5vLW9wXG4gICAgICAgIGJyZWFrXG4gICAgfVxuICB9XG5cbiAgcHVibGljIGFzeW5jIGFkZEJyZWFrcG9pbnQoYnJlYWtwb2ludDogQnJlYWtwb2ludCB8IHN0cmluZykge1xuICAgIGlmICh0eXBlb2YgYnJlYWtwb2ludCA9PT0gJ3N0cmluZycpIHtcbiAgICAgIHRoaXMucnVuKGA6YnJlYWsgJHticmVha3BvaW50fWApXG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IG1vZHVsZXMgPSBhd2FpdCB0aGlzLnJ1bignOnNob3cgbW9kdWxlcycpXG4gICAgICBjb25zdCBtYXRjaFJlc3VsdCA9IG1vZHVsZXMubWF0Y2gobmV3IFJlZ0V4cCgnKFteIF0rKSArXFxcXCggKycgKyBicmVha3BvaW50LmZpbGUpKVxuICAgICAgaWYgKG1hdGNoUmVzdWx0KSB7XG4gICAgICAgIHRoaXMucnVuKGA6YnJlYWsgJHttYXRjaFJlc3VsdFsxXX0gJHticmVha3BvaW50LmxpbmV9YClcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRFcnJvcihgRmFpbGVkIHRvIHNldCBicmVha3BvaW50IG9uICR7YnJlYWtwb2ludC5maWxlfWApXG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqIHJlc29sdmVkIHRoZSBnaXZlbiBleHByZXNzaW9uIHVzaW5nIDpwcmludCwgcmV0dXJucyBudWxsIGlmIGl0IGlzIGludmFsaWRcbiAgKi9cbiAgcHVibGljIGFzeW5jIHJlc29sdmVFeHByZXNzaW9uKGV4cHJlc3Npb246IHN0cmluZykge1xuICAgIGlmICghZXhwcmVzc2lvbi50cmltKCkpIHtcbiAgICAgIHJldHVybiB1bmRlZmluZWRcbiAgICB9XG4gICAgLy8gZXhwcmVzc2lvbnMgY2FuJ3QgaGF2ZSBuZXcgbGluZXNcbiAgICBpZiAoZXhwcmVzc2lvbi5pbmRleE9mKCdcXG4nKSAhPT0gLTEpIHtcbiAgICAgIHJldHVybiB1bmRlZmluZWRcbiAgICB9XG5cbiAgICBjb25zdCBnZXRFeHByZXNzaW9uID0gKGdoY2lPdXRwdXQ6IHN0cmluZywgdmFyaWFibGU6IHN0cmluZykgPT4ge1xuICAgICAgY29uc3QgbWF0Y2hSZXN1bHQgPSBnaGNpT3V0cHV0Lm1hdGNoKC9bXiBdKiA9ICguKikvKVxuICAgICAgaWYgKCFtYXRjaFJlc3VsdCkgeyByZXR1cm4gdW5kZWZpbmVkIH1cbiAgICAgIHJldHVybiBtYXRjaFJlc3VsdFsxXVxuICAgIH1cblxuICAgIC8vIGZvciB0aGUgY29kZSBiZWxvdywgaWdub3JlIGVycm9yc1xuICAgIHRoaXMuaWdub3JlRXJyb3JzID0gdHJ1ZVxuXG4gICAgdHJ5IHtcbiAgICAgIC8vIHRyeSBwcmludGluZyBleHByZXNzaW9uXG4gICAgICBjb25zdCBwcmludGluZ1Jlc3VsdCA9IGdldEV4cHJlc3Npb24oXG4gICAgICAgIGF3YWl0IHRoaXMucnVuKGA6cHJpbnQgJHtleHByZXNzaW9ufWAsIGZhbHNlLCBmYWxzZSwgZmFsc2UpLCBleHByZXNzaW9uKVxuICAgICAgaWYgKHByaW50aW5nUmVzdWx0ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuIHByaW50aW5nUmVzdWx0XG4gICAgICB9XG5cbiAgICAgIC8vIGlmIHRoYXQgZmFpbHMgYXNzaWduIGl0IHRvIGEgdGVtcG9yYXJ5IHZhcmlhYmxlIGFuZCBldmFsdWF0ZSB0aGF0XG4gICAgICBsZXQgdGVtcFZhck51bSA9IDBcbiAgICAgIGxldCBwb3RlbnRpYWxUZW1wVmFyOiBzdHJpbmcgfCB1bmRlZmluZWRcbiAgICAgIGRvIHtcbiAgICAgICAgcG90ZW50aWFsVGVtcFZhciA9IGdldEV4cHJlc3Npb24oXG4gICAgICAgICAgYXdhaXQgdGhpcy5ydW4oYDpwcmludCB0ZW1wJHt0ZW1wVmFyTnVtfWAsIGZhbHNlLCBmYWxzZSwgZmFsc2UpLCBgdGVtcCR7dGVtcFZhck51bX1gKVxuICAgICAgICB0ZW1wVmFyTnVtICs9IDFcbiAgICAgIH0gd2hpbGUgKHBvdGVudGlhbFRlbXBWYXIgIT09IHVuZGVmaW5lZClcblxuICAgICAgYXdhaXQgdGhpcy5ydW4oYGxldCB0ZW1wJHt0ZW1wVmFyTnVtfSA9ICR7ZXhwcmVzc2lvbn1gLCBmYWxzZSwgZmFsc2UsIGZhbHNlKVxuICAgICAgcmV0dXJuIGdldEV4cHJlc3Npb24oYXdhaXQgdGhpcy5ydW4oYDpwcmludCB0ZW1wJHt0ZW1wVmFyTnVtfWAsIGZhbHNlLCBmYWxzZSwgZmFsc2UpLCBgdGVtcCR7dGVtcFZhck51bX1gKVxuICAgIH0gZmluYWxseSB7XG4gICAgICB0aGlzLmlnbm9yZUVycm9ycyA9IGZhbHNlXG4gICAgfVxuICB9XG5cbiAgcHVibGljIGZvcndhcmQoKSB7XG4gICAgdGhpcy5ydW4oJzpmb3J3YXJkJywgdHJ1ZSlcbiAgfVxuXG4gIHB1YmxpYyBiYWNrKCkge1xuICAgIHRoaXMucnVuKCc6YmFjaycsIHRydWUpXG4gIH1cblxuICBwdWJsaWMgc3RlcCgpIHtcbiAgICB0aGlzLnJ1bignOnN0ZXAnLCB0cnVlLCB0cnVlKVxuICB9XG5cbiAgcHVibGljIHN0b3AoKSB7XG4gICAgdGhpcy5ydW4oJzpxdWl0JylcbiAgICBzZXRUaW1lb3V0KFxuICAgICAgKCkgPT4ge1xuICAgICAgICB0aGlzLmdoY2lDbWQua2lsbCgpXG4gICAgICB9LFxuICAgICAgMzAwMClcbiAgfVxuXG4gIHB1YmxpYyBjb250aW51ZSgpIHtcbiAgICB0aGlzLnJ1bignOmNvbnRpbnVlJywgdHJ1ZSlcbiAgfVxuXG4gIHB1YmxpYyBhc3luYyBhZGRlZEFsbExpc3RlbmVycygpIHtcbiAgICB0aGlzLnN0YXJ0VGV4dC50aGVuKCh0ZXh0KSA9PiB7XG4gICAgICBjb25zdCBmaXJzdFByb21wdCA9IHRleHQuaW5kZXhPZignPiAnKVxuICAgICAgdGhpcy5lbWl0dGVyLmVtaXQoJ2NvbnNvbGUtb3V0cHV0JywgdGV4dC5zbGljZSgwLCBmaXJzdFByb21wdCArIDIpKVxuICAgIH0pXG4gIH1cblxuICBwdWJsaWMgYXN5bmMgc3RhcnREZWJ1Zyhtb2R1bGVOYW1lPzogc3RyaW5nKSB7XG4gICAgbW9kdWxlTmFtZSA9IG1vZHVsZU5hbWUgfHwgJ21haW4nXG4gICAgYXdhaXQgdGhpcy5ydW4oJzp0cmFjZSAnICsgbW9kdWxlTmFtZSwgdHJ1ZSwgdHJ1ZSlcbiAgfVxuXG4gIHB1YmxpYyBhc3luYyBydW4oXG4gICAgY29tbWFuZFRleHQ6IHN0cmluZyxcbiAgICBlbWl0U3RhdHVzQ2hhbmdlczogYm9vbGVhbiA9IGZhbHNlLFxuICAgIGVtaXRIaXN0b3J5TGVuZ3RoOiBib29sZWFuID0gZmFsc2UsXG4gICAgZW1pdENvbW1hbmRPdXRwdXQ6IGJvb2xlYW4gPSB0cnVlLFxuICAgIGZ1bGZpbFdpdGhQcm9tcHQ6IGJvb2xlYW4gPSBmYWxzZSxcbiAgKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCBzaGlmdEFuZFJ1bkNvbW1hbmQgPSAoKSA9PiB7XG4gICAgICBjb25zdCBjb21tYW5kID0gdGhpcy5jb21tYW5kcy5zaGlmdCgpXG5cbiAgICAgIHRoaXMuY3VycmVudENvbW1hbmQgPSBjb21tYW5kXG5cbiAgICAgIGlmIChjb21tYW5kKSB7XG4gICAgICAgIGlmIChjb21tYW5kLmVtaXRDb21tYW5kT3V0cHV0KSB7XG4gICAgICAgICAgdGhpcy5lbWl0dGVyLmVtaXQoJ2NvbW1hbmQtaXNzdWVkJywgY29tbWFuZC50ZXh0KVxuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5zdGRpbi53cml0ZShjb21tYW5kLnRleHQgKyBvcy5FT0wpXG4gICAgICB9XG4gICAgfVxuXG4gICAgbGV0IGN1cnJlbnRQcm9taXNlOiBQcm9taXNlPHN0cmluZz5cbiAgICByZXR1cm4gY3VycmVudFByb21pc2UgPSBuZXcgUHJvbWlzZTxzdHJpbmc+KChmdWxmaWwpID0+IHtcbiAgICAgIGNvbnN0IGNvbW1hbmQ6IENvbW1hbmQgPSB7XG4gICAgICAgIHRleHQ6IGNvbW1hbmRUZXh0LFxuICAgICAgICBlbWl0Q29tbWFuZE91dHB1dCxcbiAgICAgICAgZnVsZmlsV2l0aFByb21wdCxcbiAgICAgICAgb25GaW5pc2g6IGFzeW5jIChvdXRwdXQpID0+IHtcbiAgICAgICAgICB0aGlzLmN1cnJlbnRDb21tYW5kID0gdW5kZWZpbmVkXG5cbiAgICAgICAgICBmdW5jdGlvbiBfZnVsZmlsKG5vUHJvbXB0OiBzdHJpbmcpIHtcbiAgICAgICAgICAgIGlmIChmdWxmaWxXaXRoUHJvbXB0KSB7XG4gICAgICAgICAgICAgIGZ1bGZpbChvdXRwdXQpXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBmdWxmaWwobm9Qcm9tcHQpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgY29uc3QgbGFzdEVuZE9mTGluZVBvcyA9IG91dHB1dC5sYXN0SW5kZXhPZihvcy5FT0wpXG5cbiAgICAgICAgICBpZiAobGFzdEVuZE9mTGluZVBvcyA9PT0gLTEpIHtcbiAgICAgICAgICAgIC8qaS5lLiBubyBvdXRwdXQgaGFzIGJlZW4gcHJvZHVjZWQqL1xuICAgICAgICAgICAgaWYgKGVtaXRTdGF0dXNDaGFuZ2VzKSB7XG4gICAgICAgICAgICAgIHRoaXMuZW1pdFN0YXR1c0NoYW5nZXMob3V0cHV0LCAnJywgZW1pdEhpc3RvcnlMZW5ndGgpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgIF9mdWxmaWwoJycpXG4gICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBfZnVsZmlsKCcnKVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zdCBwcm9tcHRCZWdpblBvc2l0aW9uID0gbGFzdEVuZE9mTGluZVBvcyArIG9zLkVPTC5sZW5ndGhcblxuICAgICAgICAgICAgaWYgKGVtaXRTdGF0dXNDaGFuZ2VzKSB7XG4gICAgICAgICAgICAgIHRoaXMuZW1pdFN0YXR1c0NoYW5nZXMoXG4gICAgICAgICAgICAgICAgb3V0cHV0LnNsaWNlKHByb21wdEJlZ2luUG9zaXRpb24sIG91dHB1dC5sZW5ndGgpLFxuICAgICAgICAgICAgICAgIG91dHB1dC5zbGljZSgwLCBsYXN0RW5kT2ZMaW5lUG9zKSxcbiAgICAgICAgICAgICAgICBlbWl0SGlzdG9yeUxlbmd0aCxcbiAgICAgICAgICAgICAgKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICBfZnVsZmlsKG91dHB1dC5zbGljZSgwLCBsYXN0RW5kT2ZMaW5lUG9zKSlcbiAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIF9mdWxmaWwob3V0cHV0LnNsaWNlKDAsIGxhc3RFbmRPZkxpbmVQb3MpKVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICAgIGF3YWl0IGN1cnJlbnRQcm9taXNlXG5cbiAgICAgICAgICBpZiAodGhpcy5jb21tYW5kcy5sZW5ndGggIT09IDApIHtcbiAgICAgICAgICAgIHNoaWZ0QW5kUnVuQ29tbWFuZCgpXG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgfVxuXG4gICAgICB0aGlzLmNvbW1hbmRzLnB1c2goY29tbWFuZClcblxuICAgICAgaWYgKHRoaXMuY3VycmVudENvbW1hbmQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICBzaGlmdEFuZFJ1bkNvbW1hbmQoKVxuICAgICAgfVxuICAgIH0pXG4gIH1cblxuICBwcml2YXRlIGFkZFJlYWR5RXZlbnQoKSB7XG4gICAgY29uc3QgZXZlbnRTdWJzID0gW1xuICAgICAgJ3BhdXNlZC1vbi1leGNlcHRpb24nLFxuICAgICAgJ2xpbmUtY2hhbmdlZCcsXG4gICAgICAnZGVidWctZmluaXNoZWQnLFxuICAgIF1cblxuICAgIGZvciAoY29uc3QgZXZlbnROYW1lIG9mIGV2ZW50U3Vicykge1xuICAgICAgKHRoaXMuZW1pdHRlci5vbiBhcyBhbnkpKGV2ZW50TmFtZSwgKCkgPT4gdGhpcy5lbWl0dGVyLmVtaXQoJ3JlYWR5JywgdW5kZWZpbmVkKSlcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGdldEJpbmRpbmdzKCkge1xuICAgIGNvbnN0IG91dHB1dFN0ciA9IGF3YWl0IHRoaXMucnVuKCc6c2hvdyBiaW5kaW5ncycsIGZhbHNlLCBmYWxzZSwgZmFsc2UpXG4gICAgcmV0dXJuIG91dHB1dFN0ci5zcGxpdChvcy5FT0wpXG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGdldEhpc3RvcnlMZW5ndGgoKSB7XG4gICAgY29uc3QgaGlzdG9yeVF1ZXJ5ID0gYXdhaXQgdGhpcy5ydW4oJzpoaXN0b3J5IDEwMCcsIGZhbHNlLCBmYWxzZSwgZmFsc2UpXG4gICAgY29uc3QgcmVnZXggPSAvLShcXGQqKS4qKD86XFxufFxccnxcXHJcXG4pPGVuZCBvZiBoaXN0b3J5PiQvXG5cbiAgICBjb25zdCBtYXRjaFJlc3VsdCA9IGhpc3RvcnlRdWVyeS5tYXRjaChyZWdleClcbiAgICBpZiAoIW1hdGNoUmVzdWx0KSB7XG4gICAgICBpZiAoaGlzdG9yeVF1ZXJ5LnNsaWNlKC0zKSA9PT0gJy4uLicpIHtcbiAgICAgICAgcmV0dXJuIEluZmluaXR5IC8vIGhpc3RvcnkgaXMgdmVyeSBsb25nXG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gMFxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gcGFyc2VJbnQobWF0Y2hSZXN1bHRbMV0sIDEwKVxuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgcGFyc2VQcm9tcHQoc3RkT3V0cHV0OiBzdHJpbmcpOiBCcmVha0luZm8gfCBTeW1ib2wge1xuICAgIGNvbnN0IHBhdHRlcm5zID0gW3tcbiAgICAgIHBhdHRlcm46IC9cXFsoPzpbLVxcZF0qOiApPyguKik6XFwoKFxcZCspLChcXGQrKVxcKS1cXCgoXFxkKyksKFxcZCspXFwpLipcXF0uKj4gJC8sXG4gICAgICBmdW5jOiAobWF0Y2gpID0+ICh7XG4gICAgICAgIGZpbGVuYW1lOiBtYXRjaFsxXSxcbiAgICAgICAgcmFuZ2U6IFtbcGFyc2VJbnQobWF0Y2hbMl0sIDEwKSAtIDEsIHBhcnNlSW50KG1hdGNoWzNdLCAxMCkgLSAxXSxcbiAgICAgICAgW3BhcnNlSW50KG1hdGNoWzRdLCAxMCksIHBhcnNlSW50KG1hdGNoWzVdLCAxMCldXSxcbiAgICAgIH0pLFxuICAgIH0sIHtcbiAgICAgIHBhdHRlcm46IC9cXFsoPzpbLVxcZF0qOiApPyguKik6KFxcZCopOihcXGQqKS0oXFxkKilcXF0uKj4gJC8sXG4gICAgICBmdW5jOiAobWF0Y2gpID0+ICh7XG4gICAgICAgIGZpbGVuYW1lOiBtYXRjaFsxXSxcbiAgICAgICAgcmFuZ2U6IFtbcGFyc2VJbnQobWF0Y2hbMl0sIDEwKSAtIDEsIHBhcnNlSW50KG1hdGNoWzNdLCAxMCkgLSAxXSxcbiAgICAgICAgW3BhcnNlSW50KG1hdGNoWzJdLCAxMCkgLSAxLCBwYXJzZUludChtYXRjaFs0XSwgMTApXV0sXG4gICAgICB9KSxcbiAgICB9LCB7XG4gICAgICBwYXR0ZXJuOiAvXFxbPGV4Y2VwdGlvbiB0aHJvd24+XFxdLio+ICQvLFxuICAgICAgZnVuYzogKCkgPT4gR0hDSURlYnVnLnBhdXNlZE9uRXJyb3IsXG4gICAgfSwge1xuICAgICAgcGF0dGVybjogLy4qPiAkLyxcbiAgICAgIGZ1bmM6ICgpID0+IEdIQ0lEZWJ1Zy5maW5pc2hlZERlYnVnZ2luZyxcbiAgICB9XSBhcyBBcnJheTx7IHBhdHRlcm46IFJlZ0V4cDsgZnVuYzogKG1hdGNoOiBzdHJpbmdbXSkgPT4gQnJlYWtJbmZvIHwgU3ltYm9sIH0+XG4gICAgZm9yIChjb25zdCBwYXR0ZXJuIG9mIHBhdHRlcm5zKSB7XG4gICAgICBjb25zdCBtYXRjaFJlc3VsdCA9IHN0ZE91dHB1dC5tYXRjaChwYXR0ZXJuLnBhdHRlcm4pXG4gICAgICBpZiAobWF0Y2hSZXN1bHQpIHtcbiAgICAgICAgcmV0dXJuIHBhdHRlcm4uZnVuYyhtYXRjaFJlc3VsdClcbiAgICAgIH1cbiAgICB9XG4gICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3QgcmVhZCBwcm9tcHQ6IFxcbicgKyBzdGRPdXRwdXQpXG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGVtaXRTdGF0dXNDaGFuZ2VzKHByb21wdDogc3RyaW5nLCBtYWluQm9keTogc3RyaW5nLCBlbWl0SGlzdG9yeUxlbmd0aDogYm9vbGVhbikge1xuICAgIGNvbnN0IHJlc3VsdCA9IHRoaXMucGFyc2VQcm9tcHQocHJvbXB0KVxuXG4gICAgaWYgKHJlc3VsdCA9PT0gR0hDSURlYnVnLnBhdXNlZE9uRXJyb3IpIHtcbiAgICAgIGNvbnN0IGhpc3RvcnlMZW5ndGggPSBhd2FpdCB0aGlzLmdldEhpc3RvcnlMZW5ndGgoKVxuXG4gICAgICB0aGlzLmVtaXR0ZXIuZW1pdCgncGF1c2VkLW9uLWV4Y2VwdGlvbicsIHtcbiAgICAgICAgaGlzdG9yeUxlbmd0aCxcbiAgICAgICAgbG9jYWxCaW5kaW5nczogbWFpbkJvZHkuc3BsaXQoJ1xcbicpLnNsaWNlKDEpLFxuICAgICAgfSlcbiAgICB9IGVsc2UgaWYgKHJlc3VsdCA9PT0gR0hDSURlYnVnLmZpbmlzaGVkRGVidWdnaW5nKSB7XG4gICAgICB0aGlzLmVtaXR0ZXIuZW1pdCgnZGVidWctZmluaXNoZWQnLCB1bmRlZmluZWQpXG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IGJyZWFrSW5mbyA9IHJlc3VsdCBhcyBCcmVha0luZm9cblxuICAgICAgYnJlYWtJbmZvLmxvY2FsQmluZGluZ3MgPSBhd2FpdCB0aGlzLmdldEJpbmRpbmdzKClcblxuICAgICAgaWYgKGVtaXRIaXN0b3J5TGVuZ3RoKSB7XG4gICAgICAgIGJyZWFrSW5mby5oaXN0b3J5TGVuZ3RoID0gYXdhaXQgdGhpcy5nZXRIaXN0b3J5TGVuZ3RoKClcbiAgICAgIH1cblxuICAgICAgdGhpcy5lbWl0dGVyLmVtaXQoJ2xpbmUtY2hhbmdlZCcsIGJyZWFrSW5mbylcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIG9uU3RkZXJyUmVhZGFibGUoKSB7XG4gICAgY29uc3Qgc3RkZXJyT3V0cHV0OiBCdWZmZXIgPSB0aGlzLnN0ZGVyci5yZWFkKClcbiAgICBpZiAoIXN0ZGVyck91dHB1dCB8fCB0aGlzLmlnbm9yZUVycm9ycykge1xuICAgICAgcmV0dXJuIC8vIHRoaXMgaXMgdGhlIGVuZCBvZiB0aGUgaW5wdXQgc3RyZWFtXG4gICAgfVxuXG4gICAgdGhpcy5lbWl0dGVyLmVtaXQoJ2Vycm9yJywgc3RkZXJyT3V0cHV0LnRvU3RyaW5nKCkpXG5cbiAgICBpZiAodGhpcy5jdXJyZW50U3RkZXJyT3V0cHV0ID09PSAnJykge1xuICAgICAgY29uc3QgZGlzcCA9IHRoaXMuZW1pdHRlci5vbigncmVhZHknLCAoKSA9PiB7XG4gICAgICAgIHRoaXMuZW1pdHRlci5lbWl0KCdlcnJvci1jb21wbGV0ZWQnLCB0aGlzLmN1cnJlbnRTdGRlcnJPdXRwdXQpXG4gICAgICAgIHRoaXMuY3VycmVudFN0ZGVyck91dHB1dCA9ICcnXG4gICAgICAgIGRpc3AuZGlzcG9zZSgpXG4gICAgICB9KVxuICAgIH1cblxuICAgIHRoaXMuY3VycmVudFN0ZGVyck91dHB1dCArPSBzdGRlcnJPdXRwdXQudG9TdHJpbmcoKVxuICB9XG5cbiAgcHJpdmF0ZSBvblN0ZG91dFJlYWRhYmxlKCkge1xuICAgIGNvbnN0IGN1cnJlbnRTdHJpbmcgPSAodGhpcy5zdGRvdXQucmVhZCgpIHx8ICcnKS50b1N0cmluZygpXG5cbiAgICB0aGlzLmN1cnJlbnRDb21tYW5kQnVmZmVyICs9IGN1cnJlbnRTdHJpbmdcblxuICAgIGNvbnN0IGZpbmlzaFN0cmluZ1Bvc2l0aW9uID0gdGhpcy5jdXJyZW50Q29tbWFuZEJ1ZmZlci5zZWFyY2godGhpcy5jb21tYW5kRmluaXNoZWRTdHJpbmcpXG4gICAgaWYgKGZpbmlzaFN0cmluZ1Bvc2l0aW9uICE9PSAtMSkge1xuICAgICAgY29uc3Qgb3V0cHV0U3RyaW5nID0gdGhpcy5jdXJyZW50Q29tbWFuZEJ1ZmZlci5zbGljZSgwLCBmaW5pc2hTdHJpbmdQb3NpdGlvbilcblxuICAgICAgaWYgKHRoaXMuY3VycmVudENvbW1hbmQpIHtcbiAgICAgICAgaWYgKHRoaXMuY3VycmVudENvbW1hbmQuZW1pdENvbW1hbmRPdXRwdXQpIHtcbiAgICAgICAgICB0aGlzLmVtaXR0ZXIuZW1pdCgnY29uc29sZS1vdXRwdXQnLCBvdXRwdXRTdHJpbmcpXG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmN1cnJlbnRDb21tYW5kLm9uRmluaXNoKG91dHB1dFN0cmluZylcbiAgICAgIH1cblxuICAgICAgLy8gVGFrZSB0aGUgZmluaXNoZWQgc3RyaW5nIG9mZiB0aGUgYnVmZmVyIGFuZCBwcm9jZXNzIHRoZSBuZXh0IG91cHV0XG4gICAgICB0aGlzLmN1cnJlbnRDb21tYW5kQnVmZmVyID0gdGhpcy5jdXJyZW50Q29tbWFuZEJ1ZmZlci5zbGljZShcbiAgICAgICAgZmluaXNoU3RyaW5nUG9zaXRpb24gKyB0aGlzLmNvbW1hbmRGaW5pc2hlZFN0cmluZy5sZW5ndGgpXG4gICAgICB0aGlzLm9uU3Rkb3V0UmVhZGFibGUoKVxuICAgIH1cbiAgfVxufVxuIl19