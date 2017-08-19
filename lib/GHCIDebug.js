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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiR0hDSURlYnVnLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2xpYi9HSENJRGVidWcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQUFBLG9DQUFvQztBQUVwQyx5QkFBeUI7QUFDekIsNkJBQTZCO0FBQzdCLGdDQUFnQztBQXFCaEM7SUE2QkUsWUFBWSxXQUFXLEdBQUcsTUFBTSxFQUFFLFdBQXFCLEVBQUUsRUFBRSxNQUFlO1FBekJsRSxZQUFPLEdBU1YsSUFBSSxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUE7UUFFVixPQUFFLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQTtRQU8vQyxpQkFBWSxHQUFHLEtBQUssQ0FBQTtRQUNwQix3QkFBbUIsR0FBRyxFQUFFLENBQUE7UUFDeEIseUJBQW9CLEdBQUcsRUFBRSxDQUFBO1FBQ3pCLGFBQVEsR0FBRyxFQUFlLENBQUE7UUFFMUIsMEJBQXFCLEdBQUcscUNBQXFDLENBQUE7UUFJbkUsSUFBSSxDQUFDLE9BQU8sR0FBRyxFQUFFLENBQUMsS0FBSyxDQUFDLFdBQVcsRUFBRSxRQUFRLEVBQUUsRUFBRSxHQUFHLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFBO1FBRTVFLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLE1BQU0sRUFBRTtZQUN0QixJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxTQUFTLENBQUMsQ0FBQTtRQUNoRCxDQUFDLENBQUMsQ0FBQTtRQUVGLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUE7UUFDakMsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQTtRQUMvQixJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxPQUFP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QUFDLENBQUE7WUFDM0QsSUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUE7UUFDekIsQ0FBQztJQUNILENBQUM7O0FBalhjLHVCQUFhLEdBQUcsTUFBTSxDQUFDLGlCQUFpQixDQUFDLENBQUE7QUFDekMsMkJBQWlCLEdBQUcsTUFBTSxDQUFDLG9CQUFvQixDQUFDLENBQUE7QUFGakUsOEJBbVhDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGNwID0gcmVxdWlyZSgnY2hpbGRfcHJvY2VzcycpXG5pbXBvcnQgc3RyZWFtID0gcmVxdWlyZSgnc3RyZWFtJylcbmltcG9ydCBvcyA9IHJlcXVpcmUoJ29zJylcbmltcG9ydCBwYXRoID0gcmVxdWlyZSgncGF0aCcpXG5pbXBvcnQgYXRvbUFQSSA9IHJlcXVpcmUoJ2F0b20nKVxuXG5leHBvcnQgaW50ZXJmYWNlIEJyZWFrSW5mbyB7XG4gIGZpbGVuYW1lOiBzdHJpbmdcbiAgcmFuZ2U6IFtbbnVtYmVyLCBudW1iZXJdLCBbbnVtYmVyLCBudW1iZXJdXVxuICBoaXN0b3J5TGVuZ3RoPzogbnVtYmVyXG4gIGxvY2FsQmluZGluZ3M6IHN0cmluZ1tdXG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgRXhjZXB0aW9uSW5mbyB7XG4gIGhpc3RvcnlMZW5ndGg6IG51bWJlclxuICBsb2NhbEJpbmRpbmdzOiBzdHJpbmdbXVxufVxuXG5pbnRlcmZhY2UgQ29tbWFuZCB7XG4gIHRleHQ6IHN0cmluZ1xuICBlbWl0Q29tbWFuZE91dHB1dDogYm9vbGVhblxuICBmdWxmaWxXaXRoUHJvbXB0OiBib29sZWFuXG4gIG9uRmluaXNoOiAob3V0cHV0OiBzdHJpbmcpID0+IGFueVxufVxuXG5leHBvcnQgY2xhc3MgR0hDSURlYnVnIHtcbiAgcHJpdmF0ZSBzdGF0aWMgcGF1c2VkT25FcnJvciA9IFN5bWJvbCgnUGF1c2VkIG9uIEVycm9yJylcbiAgcHJpdmF0ZSBzdGF0aWMgZmluaXNoZWREZWJ1Z2dpbmcgPSBTeW1ib2woJ0ZpbmlzaGVkIGRlYnVnZ2luZycpXG5cbiAgcHJpdmF0ZSBlbWl0dGVyOiBhdG9tQVBJLlRFbWl0dGVyPHtcbiAgICAncGF1c2VkLW9uLWV4Y2VwdGlvbic6IEV4Y2VwdGlvbkluZm8gLy8vIEVtbWl0ZWQgd2hlbiB0aGUgZGVidWdnZXIgaXMgYXQgYW4gZXhjZXB0aW9uXG4gICAgJ3JlYWR5JzogRXhjZXB0aW9uSW5mbyB8IHVuZGVmaW5lZCAvLy8gRW1taXRlZCB3aGVuIGdoY2kgaGFzIGp1c3Qgc3RvcHBlZCBleGVjdXRpbmcgYSBjb21tYW5kXG4gICAgJ2Vycm9yJzogc3RyaW5nIC8vLyBFbW1pdGVkIHdoZW4gc3RkZXJyIGhhcyBpbnB1dFxuICAgICdlcnJvci1jb21wbGV0ZWQnOiBzdHJpbmcgLy8vIEVtbWl0ZWQgd2hlbiBnaGNpIHJlcG9ydHMgYW4gZXJyb3IgZm9yIGEgZ2l2ZW4gY29tbWFuZFxuICAgICdsaW5lLWNoYW5nZWQnOiBCcmVha0luZm8gLy8vIEVtbWl0ZWQgd2hlbiB0aGUgbGluZSB0aGF0IHRoZSBkZWJ1Z2dlciBpcyBvbiBjaGFuZ2VzXG4gICAgJ2RlYnVnLWZpbmlzaGVkJzogdW5kZWZpbmVkIC8vLyBFbW1pdGVkIHdoZW4gdGhlIGRlYnVnZ2VyIGhhcyByZWFjaGVkIHRoZSBlbmQgb2YgdGhlIHByb2dyYW1cbiAgICAnY29uc29sZS1vdXRwdXQnOiBzdHJpbmcgLy8vIEVtbWl0ZWQgd2hlbiB0aGUgZ2hjaSBoYXMgb3V0cHV0ZWQgc29tZXRoaW5nIHRvIHN0ZG91dCwgZXhjbHVkaW5nIHRoZSBleHRyYSBwcm9tcHRcbiAgICAnY29tbWFuZC1pc3N1ZWQnOiBzdHJpbmcgLy8vIEVtbWl0ZWQgd2hlbiBhIGNvbW1hbmQgaGFzIGJlZW4gZXhlY3V0ZWRcbiAgfT4gPSBuZXcgYXRvbUFQSS5FbWl0dGVyKClcbiAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOiBtZW1iZXItb3JkZXJpbmdcbiAgcHVibGljIHJlYWRvbmx5IG9uID0gdGhpcy5lbWl0dGVyLm9uLmJpbmQodGhpcy5lbWl0dGVyKVxuXG4gIHByaXZhdGUgZ2hjaUNtZDogY3AuQ2hpbGRQcm9jZXNzXG4gIHByaXZhdGUgc3Rkb3V0OiBzdHJlYW0uUmVhZGFibGVcbiAgcHJpdmF0ZSBzdGRpbjogc3RyZWFtLldyaXRhYmxlXG4gIHByaXZhdGUgc3RkZXJyOiBzdHJlYW0uUmVhZGFibGVcbiAgcHJpdmF0ZSBzdGFydFRleHQ6IFByb21pc2U8c3RyaW5nPlxuICBwcml2YXRlIGlnbm9yZUVycm9ycyA9IGZhbHNlXG4gIHByaXZhdGUgY3VycmVudFN0ZGVyck91dHB1dCA9ICcnXG4gIHByaXZhdGUgY3VycmVudENvbW1hbmRCdWZmZXIgPSAnJ1xuICBwcml2YXRlIGNvbW1hbmRzID0gW10gYXMgQ29tbWFuZFtdXG4gIHByaXZhdGUgY3VycmVudENvbW1hbmQ/OiBDb21tYW5kXG4gIHByaXZhdGUgY29tbWFuZEZpbmlzaGVkU3RyaW5nID0gJ2NvbW1hbmRfZmluaXNoX280dUIxd2hhZ3RlcUU4eEJxOW9xJ1xuXG4gIGNvbnN0cnVjdG9yKGdoY2lDb21tYW5kID0gJ2doY2knLCBnaGNpQXJnczogc3RyaW5nW10gPSBbXSwgZm9sZGVyPzogc3RyaW5nKSB7XG5cbiAgICB0aGlzLmdoY2lDbWQgPSBjcC5zcGF3bihnaGNpQ29tbWFuZCwgZ2hjaUFyZ3MsIHsgY3dkOiBmb2xkZXIsIHNoZWxsOiB0cnVlIH0pXG5cbiAgICB0aGlzLmdoY2lDbWQub24oJ2V4aXQnLCAoKSA9PiB7XG4gICAgICB0aGlzLmVtaXR0ZXIuZW1pdCgnZGVidWctZmluaXNoZWQnLCB1bmRlZmluZWQpXG4gICAgfSlcblxuICAgIHRoaXMuc3Rkb3V0ID0gdGhpcy5naGNpQ21kLnN0ZG91dFxuICAgIHRoaXMuc3RkaW4gPSB0aGlzLmdoY2lDbWQuc3RkaW5cbiAgICB0aGlzLnN0ZGVyciA9IHRoaXMuZ2hjaUNtZC5zdGRlcnJcbiAgICB0aGlzLnN0ZG91dC5vbigncmVhZGFibGUnLCAoKSA9PiB0aGlzLm9uU3Rkb3V0UmVhZGFibGUoKSlcbiAgICB0aGlzLnN0ZGVyci5vbigncmVhZGFibGUnLCAoKSA9PiB0aGlzLm9uU3RkZXJyUmVhZGFibGUoKSlcblxuICAgIHRoaXMuYWRkUmVhZHlFdmVudCgpXG5cbiAgICB0aGlzLnN0YXJ0VGV4dCA9IHRoaXMucnVuKGA6c2V0IHByb21wdCBcIiVzPiAke3RoaXMuY29tbWFuZEZpbmlzaGVkU3RyaW5nfVwiYCwgZmFsc2UsIGZhbHNlLCBmYWxzZSwgdHJ1ZSlcbiAgfVxuXG4gIHB1YmxpYyBkZXN0cm95KCkge1xuICAgIHRoaXMuc3RvcCgpXG4gIH1cblxuICBwdWJsaWMgbG9hZE1vZHVsZShuYW1lOiBzdHJpbmcpIHtcbiAgICBjb25zdCBjd2QgPSBwYXRoLmRpcm5hbWUobmFtZSlcblxuICAgIHRoaXMucnVuKGA6Y2QgJHtjd2R9YClcbiAgICB0aGlzLnJ1bihgOmxvYWQgJHtuYW1lfWApXG4gIH1cblxuICBwdWJsaWMgc2V0RXhjZXB0aW9uQnJlYWtMZXZlbChsZXZlbDogRXhjZXB0aW9uQnJlYWtMZXZlbHMpIHtcbiAgICB0aGlzLnJ1bignOnVuc2V0IC1mYnJlYWstb24tZXhjZXB0aW9uJylcbiAgICB0aGlzLnJ1bignOnVuc2V0IC1mYnJlYWstb24tZXJyb3InKVxuXG4gICAgaWYgKGxldmVsID09PSAnZXhjZXB0aW9ucycpIHtcbiAgICAgIHRoaXMucnVuKCc6c2V0IC1mYnJlYWstb24tZXhjZXB0aW9uJylcbiAgICB9IGVsc2UgaWYgKGxldmVsID09PSAnZXJyb3JzJykge1xuICAgICAgdGhpcy5ydW4oJzpzZXQgLWZicmVhay1vbi1lcnJvcicpXG4gICAgfVxuICB9XG5cbiAgcHVibGljIGFkZEJyZWFrcG9pbnQoYnJlYWtwb2ludDogQnJlYWtwb2ludCB8IHN0cmluZykge1xuICAgIGlmICh0eXBlb2YgYnJlYWtwb2ludCA9PT0gJ3N0cmluZycpIHtcbiAgICAgIHRoaXMucnVuKGA6YnJlYWsgJHticmVha3BvaW50fWApXG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMucnVuKGA6YnJlYWsgJHticmVha3BvaW50LmZpbGV9ICR7YnJlYWtwb2ludC5saW5lfWApXG4gICAgfVxuICB9XG5cbiAgLyoqIHJlc29sdmVkIHRoZSBnaXZlbiBleHByZXNzaW9uIHVzaW5nIDpwcmludCwgcmV0dXJucyBudWxsIGlmIGl0IGlzIGludmFsaWRcbiAgKi9cbiAgcHVibGljIGFzeW5jIHJlc29sdmVFeHByZXNzaW9uKGV4cHJlc3Npb246IHN0cmluZykge1xuICAgIGlmICghZXhwcmVzc2lvbi50cmltKCkpIHtcbiAgICAgIHJldHVyblxuICAgIH1cbiAgICAvLyBleHByZXNzaW9ucyBjYW4ndCBoYXZlIG5ldyBsaW5lc1xuICAgIGlmIChleHByZXNzaW9uLmluZGV4T2YoJ1xcbicpICE9PSAtMSkge1xuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgY29uc3QgZ2V0RXhwcmVzc2lvbiA9IChnaGNpT3V0cHV0OiBzdHJpbmcsIHZhcmlhYmxlOiBzdHJpbmcpID0+IHtcbiAgICAgIGNvbnN0IG1hdGNoUmVzdWx0ID0gZ2hjaU91dHB1dC5tYXRjaCgvW14gXSogPSAoLiopLylcbiAgICAgIGlmICghbWF0Y2hSZXN1bHQpIHsgcmV0dXJuIH1cbiAgICAgIHJldHVybiBtYXRjaFJlc3VsdFsxXVxuICAgIH1cblxuICAgIC8vIGZvciB0aGUgY29kZSBiZWxvdywgaWdub3JlIGVycm9yc1xuICAgIHRoaXMuaWdub3JlRXJyb3JzID0gdHJ1ZVxuXG4gICAgdHJ5IHtcbiAgICAgIC8vIHRyeSBwcmludGluZyBleHByZXNzaW9uXG4gICAgICBjb25zdCBwcmludGluZ1Jlc3VsdCA9IGdldEV4cHJlc3Npb24oXG4gICAgICAgIGF3YWl0IHRoaXMucnVuKGA6cHJpbnQgJHtleHByZXNzaW9ufWAsIGZhbHNlLCBmYWxzZSwgZmFsc2UpLCBleHByZXNzaW9uKVxuICAgICAgaWYgKHByaW50aW5nUmVzdWx0ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuIHByaW50aW5nUmVzdWx0XG4gICAgICB9XG5cbiAgICAgIC8vIGlmIHRoYXQgZmFpbHMgYXNzaWduIGl0IHRvIGEgdGVtcG9yYXJ5IHZhcmlhYmxlIGFuZCBldmFsdWF0ZSB0aGF0XG4gICAgICBsZXQgdGVtcFZhck51bSA9IDBcbiAgICAgIGxldCBwb3RlbnRpYWxUZW1wVmFyOiBzdHJpbmcgfCB1bmRlZmluZWRcbiAgICAgIGRvIHtcbiAgICAgICAgcG90ZW50aWFsVGVtcFZhciA9IGdldEV4cHJlc3Npb24oXG4gICAgICAgICAgYXdhaXQgdGhpcy5ydW4oYDpwcmludCB0ZW1wJHt0ZW1wVmFyTnVtfWAsIGZhbHNlLCBmYWxzZSwgZmFsc2UpLCBgdGVtcCR7dGVtcFZhck51bX1gKVxuICAgICAgICB0ZW1wVmFyTnVtICs9IDFcbiAgICAgIH0gd2hpbGUgKHBvdGVudGlhbFRlbXBWYXIgIT09IHVuZGVmaW5lZClcblxuICAgICAgYXdhaXQgdGhpcy5ydW4oYGxldCB0ZW1wJHt0ZW1wVmFyTnVtfSA9ICR7ZXhwcmVzc2lvbn1gLCBmYWxzZSwgZmFsc2UsIGZhbHNlKVxuICAgICAgcmV0dXJuIGdldEV4cHJlc3Npb24oYXdhaXQgdGhpcy5ydW4oYDpwcmludCB0ZW1wJHt0ZW1wVmFyTnVtfWAsIGZhbHNlLCBmYWxzZSwgZmFsc2UpLCBgdGVtcCR7dGVtcFZhck51bX1gKVxuICAgIH0gZmluYWxseSB7XG4gICAgICB0aGlzLmlnbm9yZUVycm9ycyA9IGZhbHNlXG4gICAgfVxuICB9XG5cbiAgcHVibGljIGZvcndhcmQoKSB7XG4gICAgdGhpcy5ydW4oJzpmb3J3YXJkJywgdHJ1ZSlcbiAgfVxuXG4gIHB1YmxpYyBiYWNrKCkge1xuICAgIHRoaXMucnVuKCc6YmFjaycsIHRydWUpXG4gIH1cblxuICBwdWJsaWMgc3RlcCgpIHtcbiAgICB0aGlzLnJ1bignOnN0ZXAnLCB0cnVlLCB0cnVlKVxuICB9XG5cbiAgcHVibGljIHN0b3AoKSB7XG4gICAgdGhpcy5ydW4oJzpxdWl0JylcbiAgICBzZXRUaW1lb3V0KFxuICAgICAgKCkgPT4ge1xuICAgICAgICB0aGlzLmdoY2lDbWQua2lsbCgpXG4gICAgICB9LFxuICAgICAgMzAwMClcbiAgfVxuXG4gIHB1YmxpYyBjb250aW51ZSgpIHtcbiAgICB0aGlzLnJ1bignOmNvbnRpbnVlJywgdHJ1ZSlcbiAgfVxuXG4gIHB1YmxpYyBhc3luYyBhZGRlZEFsbExpc3RlbmVycygpIHtcbiAgICB0aGlzLnN0YXJ0VGV4dC50aGVuKCh0ZXh0KSA9PiB7XG4gICAgICBjb25zdCBmaXJzdFByb21wdCA9IHRleHQuaW5kZXhPZignPiAnKVxuICAgICAgdGhpcy5lbWl0dGVyLmVtaXQoJ2NvbnNvbGUtb3V0cHV0JywgdGV4dC5zbGljZSgwLCBmaXJzdFByb21wdCArIDIpKVxuICAgIH0pXG4gIH1cblxuICBwdWJsaWMgYXN5bmMgc3RhcnREZWJ1Zyhtb2R1bGVOYW1lPzogc3RyaW5nKSB7XG4gICAgbW9kdWxlTmFtZSA9IG1vZHVsZU5hbWUgfHwgJ21haW4nXG4gICAgYXdhaXQgdGhpcy5ydW4oJzp0cmFjZSAnICsgbW9kdWxlTmFtZSwgdHJ1ZSwgdHJ1ZSlcbiAgfVxuXG4gIHB1YmxpYyBhc3luYyBydW4oXG4gICAgY29tbWFuZFRleHQ6IHN0cmluZyxcbiAgICBlbWl0U3RhdHVzQ2hhbmdlczogYm9vbGVhbiA9IGZhbHNlLFxuICAgIGVtaXRIaXN0b3J5TGVuZ3RoOiBib29sZWFuID0gZmFsc2UsXG4gICAgZW1pdENvbW1hbmRPdXRwdXQ6IGJvb2xlYW4gPSB0cnVlLFxuICAgIGZ1bGZpbFdpdGhQcm9tcHQ6IGJvb2xlYW4gPSBmYWxzZVxuICApOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IHNoaWZ0QW5kUnVuQ29tbWFuZCA9ICgpID0+IHtcbiAgICAgIGNvbnN0IGNvbW1hbmQgPSB0aGlzLmNvbW1hbmRzLnNoaWZ0KClcblxuICAgICAgdGhpcy5jdXJyZW50Q29tbWFuZCA9IGNvbW1hbmRcblxuICAgICAgaWYgKGNvbW1hbmQpIHtcbiAgICAgICAgaWYgKGNvbW1hbmQuZW1pdENvbW1hbmRPdXRwdXQpIHtcbiAgICAgICAgICB0aGlzLmVtaXR0ZXIuZW1pdCgnY29tbWFuZC1pc3N1ZWQnLCBjb21tYW5kLnRleHQpXG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnN0ZGluLndyaXRlKGNvbW1hbmQudGV4dCArIG9zLkVPTClcbiAgICAgIH1cbiAgICB9XG5cbiAgICBsZXQgY3VycmVudFByb21pc2U6IFByb21pc2U8c3RyaW5nPlxuICAgIHJldHVybiBjdXJyZW50UHJvbWlzZSA9IG5ldyBQcm9taXNlPHN0cmluZz4oKGZ1bGZpbCkgPT4ge1xuICAgICAgY29uc3QgY29tbWFuZDogQ29tbWFuZCA9IHtcbiAgICAgICAgdGV4dDogY29tbWFuZFRleHQsXG4gICAgICAgIGVtaXRDb21tYW5kT3V0cHV0LFxuICAgICAgICBmdWxmaWxXaXRoUHJvbXB0LFxuICAgICAgICBvbkZpbmlzaDogYXN5bmMgKG91dHB1dCkgPT4ge1xuICAgICAgICAgIHRoaXMuY3VycmVudENvbW1hbmQgPSB1bmRlZmluZWRcblxuICAgICAgICAgIGZ1bmN0aW9uIF9mdWxmaWwobm9Qcm9tcHQ6IHN0cmluZykge1xuICAgICAgICAgICAgaWYgKGZ1bGZpbFdpdGhQcm9tcHQpIHtcbiAgICAgICAgICAgICAgZnVsZmlsKG91dHB1dClcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGZ1bGZpbChub1Byb21wdClcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG5cbiAgICAgICAgICBjb25zdCBsYXN0RW5kT2ZMaW5lUG9zID0gb3V0cHV0Lmxhc3RJbmRleE9mKG9zLkVPTClcblxuICAgICAgICAgIGlmIChsYXN0RW5kT2ZMaW5lUG9zID09PSAtMSkge1xuICAgICAgICAgICAgLyppLmUuIG5vIG91dHB1dCBoYXMgYmVlbiBwcm9kdWNlZCovXG4gICAgICAgICAgICBpZiAoZW1pdFN0YXR1c0NoYW5nZXMpIHtcbiAgICAgICAgICAgICAgdGhpcy5lbWl0U3RhdHVzQ2hhbmdlcyhvdXRwdXQsICcnLCBlbWl0SGlzdG9yeUxlbmd0aCkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgX2Z1bGZpbCgnJylcbiAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIF9mdWxmaWwoJycpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0IHByb21wdEJlZ2luUG9zaXRpb24gPSBsYXN0RW5kT2ZMaW5lUG9zICsgb3MuRU9MLmxlbmd0aFxuXG4gICAgICAgICAgICBpZiAoZW1pdFN0YXR1c0NoYW5nZXMpIHtcbiAgICAgICAgICAgICAgdGhpcy5lbWl0U3RhdHVzQ2hhbmdlcyhcbiAgICAgICAgICAgICAgICBvdXRwdXQuc2xpY2UocHJvbXB0QmVnaW5Qb3NpdGlvbiwgb3V0cHV0Lmxlbmd0aCksXG4gICAgICAgICAgICAgICAgb3V0cHV0LnNsaWNlKDAsIGxhc3RFbmRPZkxpbmVQb3MpLFxuICAgICAgICAgICAgICAgIGVtaXRIaXN0b3J5TGVuZ3RoXG4gICAgICAgICAgICAgICkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgX2Z1bGZpbChvdXRwdXQuc2xpY2UoMCwgbGFzdEVuZE9mTGluZVBvcykpXG4gICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBfZnVsZmlsKG91dHB1dC5zbGljZSgwLCBsYXN0RW5kT2ZMaW5lUG9zKSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG5cbiAgICAgICAgICBhd2FpdCBjdXJyZW50UHJvbWlzZVxuXG4gICAgICAgICAgaWYgKHRoaXMuY29tbWFuZHMubGVuZ3RoICE9PSAwICYmIHRoaXMuY3VycmVudENvbW1hbmQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgc2hpZnRBbmRSdW5Db21tYW5kKClcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgdGhpcy5jb21tYW5kcy5wdXNoKGNvbW1hbmQpXG5cbiAgICAgIGlmICh0aGlzLmN1cnJlbnRDb21tYW5kID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgc2hpZnRBbmRSdW5Db21tYW5kKClcbiAgICAgIH1cbiAgICB9KVxuICB9XG5cbiAgcHJpdmF0ZSBhZGRSZWFkeUV2ZW50KCkge1xuICAgIGNvbnN0IGV2ZW50U3VicyA9IFtcbiAgICAgICdwYXVzZWQtb24tZXhjZXB0aW9uJyxcbiAgICAgICdsaW5lLWNoYW5nZWQnLFxuICAgICAgJ2RlYnVnLWZpbmlzaGVkJyxcbiAgICBdXG5cbiAgICBmb3IgKGNvbnN0IGV2ZW50TmFtZSBvZiBldmVudFN1YnMpIHtcbiAgICAgICh0aGlzLmVtaXR0ZXIub24gYXMgYW55KShldmVudE5hbWUsICgpID0+IHRoaXMuZW1pdHRlci5lbWl0KCdyZWFkeScsIHVuZGVmaW5lZCkpXG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBnZXRCaW5kaW5ncygpIHtcbiAgICBjb25zdCBvdXRwdXRTdHIgPSBhd2FpdCB0aGlzLnJ1bignOnNob3cgYmluZGluZ3MnLCBmYWxzZSwgZmFsc2UsIGZhbHNlKVxuICAgIHJldHVybiBvdXRwdXRTdHIuc3BsaXQob3MuRU9MKVxuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBnZXRIaXN0b3J5TGVuZ3RoKCkge1xuICAgIGNvbnN0IGhpc3RvcnlRdWVyeSA9IGF3YWl0IHRoaXMucnVuKCc6aGlzdG9yeSAxMDAnLCBmYWxzZSwgZmFsc2UsIGZhbHNlKVxuICAgIGNvbnN0IHJlZ2V4ID0gLy0oXFxkKikuKig/OlxcbnxcXHJ8XFxyXFxuKTxlbmQgb2YgaGlzdG9yeT4kL1xuXG4gICAgY29uc3QgbWF0Y2hSZXN1bHQgPSBoaXN0b3J5UXVlcnkubWF0Y2gocmVnZXgpXG4gICAgaWYgKCFtYXRjaFJlc3VsdCkge1xuICAgICAgaWYgKGhpc3RvcnlRdWVyeS5zbGljZSgtMykgPT09ICcuLi4nKSB7XG4gICAgICAgIHJldHVybiBJbmZpbml0eSAvLyBoaXN0b3J5IGlzIHZlcnkgbG9uZ1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIDBcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHBhcnNlSW50KG1hdGNoUmVzdWx0WzFdLCAxMClcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIHBhcnNlUHJvbXB0KHN0ZE91dHB1dDogc3RyaW5nKTogQnJlYWtJbmZvIHwgU3ltYm9sIHtcbiAgICBjb25zdCBwYXR0ZXJucyA9IFt7XG4gICAgICBwYXR0ZXJuOiAvXFxbKD86Wy1cXGRdKjogKT8oLiopOlxcKChcXGQrKSwoXFxkKylcXCktXFwoKFxcZCspLChcXGQrKVxcKS4qXFxdLio+ICQvLFxuICAgICAgZnVuYzogKG1hdGNoKSA9PiAoe1xuICAgICAgICBmaWxlbmFtZTogbWF0Y2hbMV0sXG4gICAgICAgIHJhbmdlOiBbW3BhcnNlSW50KG1hdGNoWzJdLCAxMCkgLSAxLCBwYXJzZUludChtYXRjaFszXSwgMTApIC0gMV0sXG4gICAgICAgIFtwYXJzZUludChtYXRjaFs0XSwgMTApLCBwYXJzZUludChtYXRjaFs1XSwgMTApXV1cbiAgICAgIH0pXG4gICAgfSwge1xuICAgICAgcGF0dGVybjogL1xcWyg/OlstXFxkXSo6ICk/KC4qKTooXFxkKik6KFxcZCopLShcXGQqKVxcXS4qPiAkLyxcbiAgICAgIGZ1bmM6IChtYXRjaCkgPT4gKHtcbiAgICAgICAgZmlsZW5hbWU6IG1hdGNoWzFdLFxuICAgICAgICByYW5nZTogW1twYXJzZUludChtYXRjaFsyXSwgMTApIC0gMSwgcGFyc2VJbnQobWF0Y2hbM10sIDEwKSAtIDFdLFxuICAgICAgICBbcGFyc2VJbnQobWF0Y2hbMl0sIDEwKSAtIDEsIHBhcnNlSW50KG1hdGNoWzRdLCAxMCldXVxuICAgICAgfSlcbiAgICB9LCB7XG4gICAgICBwYXR0ZXJuOiAvXFxbPGV4Y2VwdGlvbiB0aHJvd24+XFxdLio+ICQvLFxuICAgICAgZnVuYzogKCkgPT4gR0hDSURlYnVnLnBhdXNlZE9uRXJyb3JcbiAgICB9LCB7XG4gICAgICBwYXR0ZXJuOiAvLio+ICQvLFxuICAgICAgZnVuYzogKCkgPT4gR0hDSURlYnVnLmZpbmlzaGVkRGVidWdnaW5nXG4gICAgfV0gYXMgQXJyYXk8eyBwYXR0ZXJuOiBSZWdFeHA7IGZ1bmM6IChtYXRjaDogc3RyaW5nW10pID0+IEJyZWFrSW5mbyB8IFN5bWJvbCB9PlxuICAgIGZvciAoY29uc3QgcGF0dGVybiBvZiBwYXR0ZXJucykge1xuICAgICAgY29uc3QgbWF0Y2hSZXN1bHQgPSBzdGRPdXRwdXQubWF0Y2gocGF0dGVybi5wYXR0ZXJuKVxuICAgICAgaWYgKG1hdGNoUmVzdWx0KSB7XG4gICAgICAgIHJldHVybiBwYXR0ZXJuLmZ1bmMobWF0Y2hSZXN1bHQpXG4gICAgICB9XG4gICAgfVxuICAgIHRocm93IG5ldyBFcnJvcignQ2Fubm90IHJlYWQgcHJvbXB0OiBcXG4nICsgc3RkT3V0cHV0KVxuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBlbWl0U3RhdHVzQ2hhbmdlcyhwcm9tcHQ6IHN0cmluZywgbWFpbkJvZHk6IHN0cmluZywgZW1pdEhpc3RvcnlMZW5ndGg6IGJvb2xlYW4pIHtcbiAgICBjb25zdCByZXN1bHQgPSB0aGlzLnBhcnNlUHJvbXB0KHByb21wdClcblxuICAgIGlmIChyZXN1bHQgPT09IEdIQ0lEZWJ1Zy5wYXVzZWRPbkVycm9yKSB7XG4gICAgICBjb25zdCBoaXN0b3J5TGVuZ3RoID0gYXdhaXQgdGhpcy5nZXRIaXN0b3J5TGVuZ3RoKClcblxuICAgICAgdGhpcy5lbWl0dGVyLmVtaXQoJ3BhdXNlZC1vbi1leGNlcHRpb24nLCB7XG4gICAgICAgIGhpc3RvcnlMZW5ndGgsXG4gICAgICAgIGxvY2FsQmluZGluZ3M6IG1haW5Cb2R5LnNwbGl0KCdcXG4nKS5zbGljZSgxKVxuICAgICAgfSlcbiAgICB9IGVsc2UgaWYgKHJlc3VsdCA9PT0gR0hDSURlYnVnLmZpbmlzaGVkRGVidWdnaW5nKSB7XG4gICAgICB0aGlzLmVtaXR0ZXIuZW1pdCgnZGVidWctZmluaXNoZWQnLCB1bmRlZmluZWQpXG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IGJyZWFrSW5mbyA9IHJlc3VsdCBhcyBCcmVha0luZm9cblxuICAgICAgYnJlYWtJbmZvLmxvY2FsQmluZGluZ3MgPSBhd2FpdCB0aGlzLmdldEJpbmRpbmdzKClcblxuICAgICAgaWYgKGVtaXRIaXN0b3J5TGVuZ3RoKSB7XG4gICAgICAgIGJyZWFrSW5mby5oaXN0b3J5TGVuZ3RoID0gYXdhaXQgdGhpcy5nZXRIaXN0b3J5TGVuZ3RoKClcbiAgICAgIH1cblxuICAgICAgdGhpcy5lbWl0dGVyLmVtaXQoJ2xpbmUtY2hhbmdlZCcsIGJyZWFrSW5mbylcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIG9uU3RkZXJyUmVhZGFibGUoKSB7XG4gICAgY29uc3Qgc3RkZXJyT3V0cHV0OiBCdWZmZXIgPSB0aGlzLnN0ZGVyci5yZWFkKClcbiAgICBpZiAoIXN0ZGVyck91dHB1dCB8fCB0aGlzLmlnbm9yZUVycm9ycykge1xuICAgICAgcmV0dXJuIC8vIHRoaXMgaXMgdGhlIGVuZCBvZiB0aGUgaW5wdXQgc3RyZWFtXG4gICAgfVxuXG4gICAgdGhpcy5lbWl0dGVyLmVtaXQoJ2Vycm9yJywgc3RkZXJyT3V0cHV0LnRvU3RyaW5nKCkpXG5cbiAgICBpZiAodGhpcy5jdXJyZW50U3RkZXJyT3V0cHV0ID09PSAnJykge1xuICAgICAgY29uc3QgZGlzcCA9IHRoaXMuZW1pdHRlci5vbigncmVhZHknLCAoKSA9PiB7XG4gICAgICAgIHRoaXMuZW1pdHRlci5lbWl0KCdlcnJvci1jb21wbGV0ZWQnLCB0aGlzLmN1cnJlbnRTdGRlcnJPdXRwdXQpXG4gICAgICAgIHRoaXMuY3VycmVudFN0ZGVyck91dHB1dCA9ICcnXG4gICAgICAgIGRpc3AuZGlzcG9zZSgpXG4gICAgICB9KVxuICAgIH1cblxuICAgIHRoaXMuY3VycmVudFN0ZGVyck91dHB1dCArPSBzdGRlcnJPdXRwdXQudG9TdHJpbmcoKVxuICB9XG5cbiAgcHJpdmF0ZSBvblN0ZG91dFJlYWRhYmxlKCkge1xuICAgIGNvbnN0IGN1cnJlbnRTdHJpbmcgPSAodGhpcy5zdGRvdXQucmVhZCgpIHx8ICcnKS50b1N0cmluZygpXG5cbiAgICB0aGlzLmN1cnJlbnRDb21tYW5kQnVmZmVyICs9IGN1cnJlbnRTdHJpbmdcblxuICAgIGNvbnN0IGZpbmlzaFN0cmluZ1Bvc2l0aW9uID0gdGhpcy5jdXJyZW50Q29tbWFuZEJ1ZmZlci5zZWFyY2godGhpcy5jb21tYW5kRmluaXNoZWRTdHJpbmcpXG4gICAgaWYgKGZpbmlzaFN0cmluZ1Bvc2l0aW9uICE9PSAtMSkge1xuICAgICAgY29uc3Qgb3V0cHV0U3RyaW5nID0gdGhpcy5jdXJyZW50Q29tbWFuZEJ1ZmZlci5zbGljZSgwLCBmaW5pc2hTdHJpbmdQb3NpdGlvbilcblxuICAgICAgaWYgKHRoaXMuY3VycmVudENvbW1hbmQpIHtcbiAgICAgICAgaWYgKHRoaXMuY3VycmVudENvbW1hbmQuZW1pdENvbW1hbmRPdXRwdXQpIHtcbiAgICAgICAgICB0aGlzLmVtaXR0ZXIuZW1pdCgnY29uc29sZS1vdXRwdXQnLCBvdXRwdXRTdHJpbmcpXG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmN1cnJlbnRDb21tYW5kLm9uRmluaXNoKG91dHB1dFN0cmluZylcbiAgICAgIH1cblxuICAgICAgLy8gVGFrZSB0aGUgZmluaXNoZWQgc3RyaW5nIG9mZiB0aGUgYnVmZmVyIGFuZCBwcm9jZXNzIHRoZSBuZXh0IG91cHV0XG4gICAgICB0aGlzLmN1cnJlbnRDb21tYW5kQnVmZmVyID0gdGhpcy5jdXJyZW50Q29tbWFuZEJ1ZmZlci5zbGljZShcbiAgICAgICAgZmluaXNoU3RyaW5nUG9zaXRpb24gKyB0aGlzLmNvbW1hbmRGaW5pc2hlZFN0cmluZy5sZW5ndGgpXG4gICAgICB0aGlzLm9uU3Rkb3V0UmVhZGFibGUoKVxuICAgIH1cbiAgfVxufVxuIl19