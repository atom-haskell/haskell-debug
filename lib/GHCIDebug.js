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
        this.moduleNameByPath = new Map();
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
                try {
                    const moduleName = yield this.moduleNameFromFilePath(breakpoint.file);
                    this.run(`:break ${moduleName} ${breakpoint.line}`);
                }
                catch (e) {
                    atom.notifications.addError(`Failed to set breakpoint on ${breakpoint.file}`, {
                        detail: e,
                        stack: e.stack,
                        dismissable: true,
                    });
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
    moduleNameFromFilePath(filePath) {
        return __awaiter(this, void 0, void 0, function* () {
            const cachedModuleName = this.moduleNameByPath.get(filePath);
            if (cachedModuleName)
                return cachedModuleName;
            const modules = (yield this.run(':show modules')).split(os.EOL);
            const regex = /^([^ ]+) +\( +(.+), +\w+ +\)$/;
            for (const moduleStr of modules) {
                const matchResult = regex.exec(moduleStr);
                if (matchResult) {
                    this.moduleNameByPath.set(matchResult[2], matchResult[1]);
                }
                else {
                    console.error(`Unexpected reply from GHCI ':show modules': ${moduleStr}`);
                }
            }
            const newCachedModuleName = this.moduleNameByPath.get(filePath);
            if (newCachedModuleName) {
                return newCachedModuleName;
            }
            else {
                throw new Error(`Couldn't find module name for ${filePath}`);
            }
        });
    }
}
GHCIDebug.pausedOnError = Symbol('Paused on Error');
GHCIDebug.finishedDebugging = Symbol('Finished debugging');
exports.GHCIDebug = GHCIDebug;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiR0hDSURlYnVnLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2xpYi9HSENJRGVidWcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQUFBLG9DQUFvQztBQUVwQyx5QkFBeUI7QUFDekIsNkJBQTZCO0FBQzdCLGdDQUFnQztBQXFCaEM7SUE4QkUsWUFBWSxXQUFXLEdBQUcsTUFBTSxFQUFFLFdBQXFCLEVBQUUsRUFBRSxNQUFlO1FBMUJsRSxZQUFPLEdBU1YsSUFBSSxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUE7UUFFVixPQUFFLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQTtRQU8vQyxpQkFBWSxHQUFHLEtBQUssQ0FBQTtRQUNwQix3QkFBbUIsR0FBRyxFQUFFLENBQUE7UUFDeEIseUJBQW9CLEdBQUcsRUFBRSxDQUFBO1FBQ3pCLGFBQVEsR0FBRyxFQUFlLENBQUE7UUFFMUIsMEJBQXFCLEdBQUcscUNBQXFDLENBQUE7UUFDN0QscUJBQWdCLEdBQXdCLElBQUksR0FBRyxFQUFFLENBQUE7UUFJdkQsSUFBSSxDQUFDLE9BQU8sR0FBRyxFQUFFLENBQUMsS0FBSyxDQUFDLFdBQVcsRUFBRSxRQUFRLEVBQUUsRUFBRSxHQUFHLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFBO1FBRTVFLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLE1BQU0sRUFBRTtZQUN0QixJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxTQUFTLENBQUMsQ0FBQTtRQUNoRCxDQUFDLENBQUMsQ0FBQTtRQUVGLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUE7UUFDakMsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQTtR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Q0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxFQUFFLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFBO2dCQUMzRCxDQUFDO2dCQUFDLElBQUksQ0FBQyxDQUFDO29CQUNOLE9BQU8sQ0FBQyxLQUFLLENBQUMsK0NBQStDLFNBQVMsRUFBRSxDQUFDLENBQUE7Z0JBQzNFLENBQUM7WUFDSCxDQUFDO1lBQ0QsTUFBTSxtQkFBbUIsR0FBRyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFBO1lBQy9ELEVBQUUsQ0FBQyxDQUFDLG1CQUFtQixDQUFDLENBQUMsQ0FBQztnQkFDeEIsTUFBTSxDQUFDLG1CQUFtQixDQUFBO1lBQzVCLENBQUM7WUFBQyxJQUFJLENBQUMsQ0FBQztnQkFDTixNQUFNLElBQUksS0FBSyxDQUFDLGlDQUFpQyxRQUFRLEVBQUUsQ0FBQyxDQUFBO1lBQzlELENBQUM7UUFDSCxDQUFDO0tBQUE7O0FBclpjLHVCQUFhLEdBQUcsTUFBTSxDQUFDLGlCQUFpQixDQUFDLENBQUE7QUFDekMsMkJBQWlCLEdBQUcsTUFBTSxDQUFDLG9CQUFvQixDQUFDLENBQUE7QUFGakUsOEJBdVpDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGNwID0gcmVxdWlyZSgnY2hpbGRfcHJvY2VzcycpXG5pbXBvcnQgc3RyZWFtID0gcmVxdWlyZSgnc3RyZWFtJylcbmltcG9ydCBvcyA9IHJlcXVpcmUoJ29zJylcbmltcG9ydCBwYXRoID0gcmVxdWlyZSgncGF0aCcpXG5pbXBvcnQgYXRvbUFQSSA9IHJlcXVpcmUoJ2F0b20nKVxuXG5leHBvcnQgaW50ZXJmYWNlIEJyZWFrSW5mbyB7XG4gIGZpbGVuYW1lOiBzdHJpbmdcbiAgcmFuZ2U6IFtbbnVtYmVyLCBudW1iZXJdLCBbbnVtYmVyLCBudW1iZXJdXVxuICBoaXN0b3J5TGVuZ3RoPzogbnVtYmVyXG4gIGxvY2FsQmluZGluZ3M6IHN0cmluZ1tdXG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgRXhjZXB0aW9uSW5mbyB7XG4gIGhpc3RvcnlMZW5ndGg6IG51bWJlclxuICBsb2NhbEJpbmRpbmdzOiBzdHJpbmdbXVxufVxuXG5pbnRlcmZhY2UgQ29tbWFuZCB7XG4gIHRleHQ6IHN0cmluZ1xuICBlbWl0Q29tbWFuZE91dHB1dDogYm9vbGVhblxuICBmdWxmaWxXaXRoUHJvbXB0OiBib29sZWFuXG4gIG9uRmluaXNoOiAob3V0cHV0OiBzdHJpbmcpID0+IGFueVxufVxuXG5leHBvcnQgY2xhc3MgR0hDSURlYnVnIHtcbiAgcHJpdmF0ZSBzdGF0aWMgcGF1c2VkT25FcnJvciA9IFN5bWJvbCgnUGF1c2VkIG9uIEVycm9yJylcbiAgcHJpdmF0ZSBzdGF0aWMgZmluaXNoZWREZWJ1Z2dpbmcgPSBTeW1ib2woJ0ZpbmlzaGVkIGRlYnVnZ2luZycpXG5cbiAgcHJpdmF0ZSBlbWl0dGVyOiBhdG9tQVBJLlRFbWl0dGVyPHtcbiAgICAncGF1c2VkLW9uLWV4Y2VwdGlvbic6IEV4Y2VwdGlvbkluZm8gLy8vIEVtbWl0ZWQgd2hlbiB0aGUgZGVidWdnZXIgaXMgYXQgYW4gZXhjZXB0aW9uXG4gICAgJ3JlYWR5JzogRXhjZXB0aW9uSW5mbyB8IHVuZGVmaW5lZCAvLy8gRW1taXRlZCB3aGVuIGdoY2kgaGFzIGp1c3Qgc3RvcHBlZCBleGVjdXRpbmcgYSBjb21tYW5kXG4gICAgJ2Vycm9yJzogc3RyaW5nIC8vLyBFbW1pdGVkIHdoZW4gc3RkZXJyIGhhcyBpbnB1dFxuICAgICdlcnJvci1jb21wbGV0ZWQnOiBzdHJpbmcgLy8vIEVtbWl0ZWQgd2hlbiBnaGNpIHJlcG9ydHMgYW4gZXJyb3IgZm9yIGEgZ2l2ZW4gY29tbWFuZFxuICAgICdsaW5lLWNoYW5nZWQnOiBCcmVha0luZm8gLy8vIEVtbWl0ZWQgd2hlbiB0aGUgbGluZSB0aGF0IHRoZSBkZWJ1Z2dlciBpcyBvbiBjaGFuZ2VzXG4gICAgJ2RlYnVnLWZpbmlzaGVkJzogdW5kZWZpbmVkIC8vLyBFbW1pdGVkIHdoZW4gdGhlIGRlYnVnZ2VyIGhhcyByZWFjaGVkIHRoZSBlbmQgb2YgdGhlIHByb2dyYW1cbiAgICAnY29uc29sZS1vdXRwdXQnOiBzdHJpbmcgLy8vIEVtbWl0ZWQgd2hlbiB0aGUgZ2hjaSBoYXMgb3V0cHV0ZWQgc29tZXRoaW5nIHRvIHN0ZG91dCwgZXhjbHVkaW5nIHRoZSBleHRyYSBwcm9tcHRcbiAgICAnY29tbWFuZC1pc3N1ZWQnOiBzdHJpbmcgLy8vIEVtbWl0ZWQgd2hlbiBhIGNvbW1hbmQgaGFzIGJlZW4gZXhlY3V0ZWRcbiAgfT4gPSBuZXcgYXRvbUFQSS5FbWl0dGVyKClcbiAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOiBtZW1iZXItb3JkZXJpbmdcbiAgcHVibGljIHJlYWRvbmx5IG9uID0gdGhpcy5lbWl0dGVyLm9uLmJpbmQodGhpcy5lbWl0dGVyKVxuXG4gIHByaXZhdGUgZ2hjaUNtZDogY3AuQ2hpbGRQcm9jZXNzXG4gIHByaXZhdGUgc3Rkb3V0OiBzdHJlYW0uUmVhZGFibGVcbiAgcHJpdmF0ZSBzdGRpbjogc3RyZWFtLldyaXRhYmxlXG4gIHByaXZhdGUgc3RkZXJyOiBzdHJlYW0uUmVhZGFibGVcbiAgcHJpdmF0ZSBzdGFydFRleHQ6IFByb21pc2U8c3RyaW5nPlxuICBwcml2YXRlIGlnbm9yZUVycm9ycyA9IGZhbHNlXG4gIHByaXZhdGUgY3VycmVudFN0ZGVyck91dHB1dCA9ICcnXG4gIHByaXZhdGUgY3VycmVudENvbW1hbmRCdWZmZXIgPSAnJ1xuICBwcml2YXRlIGNvbW1hbmRzID0gW10gYXMgQ29tbWFuZFtdXG4gIHByaXZhdGUgY3VycmVudENvbW1hbmQ/OiBDb21tYW5kXG4gIHByaXZhdGUgY29tbWFuZEZpbmlzaGVkU3RyaW5nID0gJ2NvbW1hbmRfZmluaXNoX280dUIxd2hhZ3RlcUU4eEJxOW9xJ1xuICBwcml2YXRlIG1vZHVsZU5hbWVCeVBhdGg6IE1hcDxzdHJpbmcsIHN0cmluZz4gPSBuZXcgTWFwKClcblxuICBjb25zdHJ1Y3RvcihnaGNpQ29tbWFuZCA9ICdnaGNpJywgZ2hjaUFyZ3M6IHN0cmluZ1tdID0gW10sIGZvbGRlcj86IHN0cmluZykge1xuXG4gICAgdGhpcy5naGNpQ21kID0gY3Auc3Bhd24oZ2hjaUNvbW1hbmQsIGdoY2lBcmdzLCB7IGN3ZDogZm9sZGVyLCBzaGVsbDogdHJ1ZSB9KVxuXG4gICAgdGhpcy5naGNpQ21kLm9uKCdleGl0JywgKCkgPT4ge1xuICAgICAgdGhpcy5lbWl0dGVyLmVtaXQoJ2RlYnVnLWZpbmlzaGVkJywgdW5kZWZpbmVkKVxuICAgIH0pXG5cbiAgICB0aGlzLnN0ZG91dCA9IHRoaXMuZ2hjaUNtZC5zdGRvdXRcbiAgICB0aGlzLnN0ZGluID0gdGhpcy5naGNpQ21kLnN0ZGluXG4gICAgdGhpcy5zdGRlcnIgPSB0aGlzLmdoY2lDbWQuc3RkZXJyXG4gICAgdGhpcy5zdGRvdXQub24oJ3JlYWRhYmxlJywgKCkgPT4gdGhpcy5vblN0ZG91dFJlYWRhYmxlKCkpXG4gICAgdGhpcy5zdGRlcnIub24oJ3JlYWRhYmxlJywgKCkgPT4gdGhpcy5vblN0ZGVyclJlYWRhYmxlKCkpXG5cbiAgICB0aGlzLmFkZFJlYWR5RXZlbnQoKVxuXG4gICAgdGhpcy5zdGFydFRleHQgPSB0aGlzLnJ1bihgOnNldCBwcm9tcHQgXCIlcz4gJHt0aGlzLmNvbW1hbmRGaW5pc2hlZFN0cmluZ31cImAsIGZhbHNlLCBmYWxzZSwgZmFsc2UsIHRydWUpXG4gIH1cblxuICBwdWJsaWMgZGVzdHJveSgpIHtcbiAgICB0aGlzLnN0b3AoKVxuICB9XG5cbiAgcHVibGljIGxvYWRNb2R1bGUobmFtZTogc3RyaW5nKSB7XG4gICAgY29uc3QgY3dkID0gcGF0aC5kaXJuYW1lKG5hbWUpXG5cbiAgICB0aGlzLnJ1bihgOmNkICR7Y3dkfWApXG4gICAgdGhpcy5ydW4oYDpsb2FkICR7bmFtZX1gKVxuICB9XG5cbiAgcHVibGljIHNldEV4Y2VwdGlvbkJyZWFrTGV2ZWwobGV2ZWw6IEV4Y2VwdGlvbkJyZWFrTGV2ZWxzKSB7XG4gICAgdGhpcy5ydW4oJzp1bnNldCAtZmJyZWFrLW9uLWV4Y2VwdGlvbicpXG4gICAgdGhpcy5ydW4oJzp1bnNldCAtZmJyZWFrLW9uLWVycm9yJylcblxuICAgIHN3aXRjaCAobGV2ZWwpIHtcbiAgICAgIGNhc2UgJ2V4Y2VwdGlvbnMnOlxuICAgICAgICB0aGlzLnJ1bignOnNldCAtZmJyZWFrLW9uLWV4Y2VwdGlvbicpXG4gICAgICAgIGJyZWFrXG4gICAgICBjYXNlICdlcnJvcnMnOlxuICAgICAgICB0aGlzLnJ1bignOnNldCAtZmJyZWFrLW9uLWVycm9yJylcbiAgICAgICAgYnJlYWtcbiAgICAgIGNhc2UgJ25vbmUnOiAvLyBuby1vcFxuICAgICAgICBicmVha1xuICAgIH1cbiAgfVxuXG4gIHB1YmxpYyBhc3luYyBhZGRCcmVha3BvaW50KGJyZWFrcG9pbnQ6IEJyZWFrcG9pbnQgfCBzdHJpbmcpIHtcbiAgICBpZiAodHlwZW9mIGJyZWFrcG9pbnQgPT09ICdzdHJpbmcnKSB7XG4gICAgICB0aGlzLnJ1bihgOmJyZWFrICR7YnJlYWtwb2ludH1gKVxuICAgIH0gZWxzZSB7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCBtb2R1bGVOYW1lOiBzdHJpbmcgPSBhd2FpdCB0aGlzLm1vZHVsZU5hbWVGcm9tRmlsZVBhdGgoYnJlYWtwb2ludC5maWxlKVxuICAgICAgICB0aGlzLnJ1bihgOmJyZWFrICR7bW9kdWxlTmFtZX0gJHticmVha3BvaW50LmxpbmV9YClcbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZEVycm9yKGBGYWlsZWQgdG8gc2V0IGJyZWFrcG9pbnQgb24gJHticmVha3BvaW50LmZpbGV9YCwge1xuICAgICAgICAgIGRldGFpbDogZSxcbiAgICAgICAgICBzdGFjazogZS5zdGFjayxcbiAgICAgICAgICBkaXNtaXNzYWJsZTogdHJ1ZSxcbiAgICAgICAgfSlcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKiogcmVzb2x2ZWQgdGhlIGdpdmVuIGV4cHJlc3Npb24gdXNpbmcgOnByaW50LCByZXR1cm5zIG51bGwgaWYgaXQgaXMgaW52YWxpZFxuICAqL1xuICBwdWJsaWMgYXN5bmMgcmVzb2x2ZUV4cHJlc3Npb24oZXhwcmVzc2lvbjogc3RyaW5nKSB7XG4gICAgaWYgKCFleHByZXNzaW9uLnRyaW0oKSkge1xuICAgICAgcmV0dXJuIHVuZGVmaW5lZFxuICAgIH1cbiAgICAvLyBleHByZXNzaW9ucyBjYW4ndCBoYXZlIG5ldyBsaW5lc1xuICAgIGlmIChleHByZXNzaW9uLmluZGV4T2YoJ1xcbicpICE9PSAtMSkge1xuICAgICAgcmV0dXJuIHVuZGVmaW5lZFxuICAgIH1cblxuICAgIGNvbnN0IGdldEV4cHJlc3Npb24gPSAoZ2hjaU91dHB1dDogc3RyaW5nLCB2YXJpYWJsZTogc3RyaW5nKSA9PiB7XG4gICAgICBjb25zdCBtYXRjaFJlc3VsdCA9IGdoY2lPdXRwdXQubWF0Y2goL1teIF0qID0gKC4qKS8pXG4gICAgICBpZiAoIW1hdGNoUmVzdWx0KSB7IHJldHVybiB1bmRlZmluZWQgfVxuICAgICAgcmV0dXJuIG1hdGNoUmVzdWx0WzFdXG4gICAgfVxuXG4gICAgLy8gZm9yIHRoZSBjb2RlIGJlbG93LCBpZ25vcmUgZXJyb3JzXG4gICAgdGhpcy5pZ25vcmVFcnJvcnMgPSB0cnVlXG5cbiAgICB0cnkge1xuICAgICAgLy8gdHJ5IHByaW50aW5nIGV4cHJlc3Npb25cbiAgICAgIGNvbnN0IHByaW50aW5nUmVzdWx0ID0gZ2V0RXhwcmVzc2lvbihcbiAgICAgICAgYXdhaXQgdGhpcy5ydW4oYDpwcmludCAke2V4cHJlc3Npb259YCwgZmFsc2UsIGZhbHNlLCBmYWxzZSksIGV4cHJlc3Npb24pXG4gICAgICBpZiAocHJpbnRpbmdSZXN1bHQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICByZXR1cm4gcHJpbnRpbmdSZXN1bHRcbiAgICAgIH1cblxuICAgICAgLy8gaWYgdGhhdCBmYWlscyBhc3NpZ24gaXQgdG8gYSB0ZW1wb3JhcnkgdmFyaWFibGUgYW5kIGV2YWx1YXRlIHRoYXRcbiAgICAgIGxldCB0ZW1wVmFyTnVtID0gMFxuICAgICAgbGV0IHBvdGVudGlhbFRlbXBWYXI6IHN0cmluZyB8IHVuZGVmaW5lZFxuICAgICAgZG8ge1xuICAgICAgICBwb3RlbnRpYWxUZW1wVmFyID0gZ2V0RXhwcmVzc2lvbihcbiAgICAgICAgICBhd2FpdCB0aGlzLnJ1bihgOnByaW50IHRlbXAke3RlbXBWYXJOdW19YCwgZmFsc2UsIGZhbHNlLCBmYWxzZSksIGB0ZW1wJHt0ZW1wVmFyTnVtfWApXG4gICAgICAgIHRlbXBWYXJOdW0gKz0gMVxuICAgICAgfSB3aGlsZSAocG90ZW50aWFsVGVtcFZhciAhPT0gdW5kZWZpbmVkKVxuXG4gICAgICBhd2FpdCB0aGlzLnJ1bihgbGV0IHRlbXAke3RlbXBWYXJOdW19ID0gJHtleHByZXNzaW9ufWAsIGZhbHNlLCBmYWxzZSwgZmFsc2UpXG4gICAgICByZXR1cm4gZ2V0RXhwcmVzc2lvbihhd2FpdCB0aGlzLnJ1bihgOnByaW50IHRlbXAke3RlbXBWYXJOdW19YCwgZmFsc2UsIGZhbHNlLCBmYWxzZSksIGB0ZW1wJHt0ZW1wVmFyTnVtfWApXG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIHRoaXMuaWdub3JlRXJyb3JzID0gZmFsc2VcbiAgICB9XG4gIH1cblxuICBwdWJsaWMgZm9yd2FyZCgpIHtcbiAgICB0aGlzLnJ1bignOmZvcndhcmQnLCB0cnVlKVxuICB9XG5cbiAgcHVibGljIGJhY2soKSB7XG4gICAgdGhpcy5ydW4oJzpiYWNrJywgdHJ1ZSlcbiAgfVxuXG4gIHB1YmxpYyBzdGVwKCkge1xuICAgIHRoaXMucnVuKCc6c3RlcCcsIHRydWUsIHRydWUpXG4gIH1cblxuICBwdWJsaWMgc3RvcCgpIHtcbiAgICB0aGlzLnJ1bignOnF1aXQnKVxuICAgIHNldFRpbWVvdXQoXG4gICAgICAoKSA9PiB7XG4gICAgICAgIHRoaXMuZ2hjaUNtZC5raWxsKClcbiAgICAgIH0sXG4gICAgICAzMDAwKVxuICB9XG5cbiAgcHVibGljIGNvbnRpbnVlKCkge1xuICAgIHRoaXMucnVuKCc6Y29udGludWUnLCB0cnVlKVxuICB9XG5cbiAgcHVibGljIGFzeW5jIGFkZGVkQWxsTGlzdGVuZXJzKCkge1xuICAgIHRoaXMuc3RhcnRUZXh0LnRoZW4oKHRleHQpID0+IHtcbiAgICAgIGNvbnN0IGZpcnN0UHJvbXB0ID0gdGV4dC5pbmRleE9mKCc+ICcpXG4gICAgICB0aGlzLmVtaXR0ZXIuZW1pdCgnY29uc29sZS1vdXRwdXQnLCB0ZXh0LnNsaWNlKDAsIGZpcnN0UHJvbXB0ICsgMikpXG4gICAgfSlcbiAgfVxuXG4gIHB1YmxpYyBhc3luYyBzdGFydERlYnVnKG1vZHVsZU5hbWU/OiBzdHJpbmcpIHtcbiAgICBtb2R1bGVOYW1lID0gbW9kdWxlTmFtZSB8fCAnbWFpbidcbiAgICBhd2FpdCB0aGlzLnJ1bignOnRyYWNlICcgKyBtb2R1bGVOYW1lLCB0cnVlLCB0cnVlKVxuICB9XG5cbiAgcHVibGljIGFzeW5jIHJ1bihcbiAgICBjb21tYW5kVGV4dDogc3RyaW5nLFxuICAgIGVtaXRTdGF0dXNDaGFuZ2VzOiBib29sZWFuID0gZmFsc2UsXG4gICAgZW1pdEhpc3RvcnlMZW5ndGg6IGJvb2xlYW4gPSBmYWxzZSxcbiAgICBlbWl0Q29tbWFuZE91dHB1dDogYm9vbGVhbiA9IHRydWUsXG4gICAgZnVsZmlsV2l0aFByb21wdDogYm9vbGVhbiA9IGZhbHNlLFxuICApOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IHNoaWZ0QW5kUnVuQ29tbWFuZCA9ICgpID0+IHtcbiAgICAgIGNvbnN0IGNvbW1hbmQgPSB0aGlzLmNvbW1hbmRzLnNoaWZ0KClcblxuICAgICAgdGhpcy5jdXJyZW50Q29tbWFuZCA9IGNvbW1hbmRcblxuICAgICAgaWYgKGNvbW1hbmQpIHtcbiAgICAgICAgaWYgKGNvbW1hbmQuZW1pdENvbW1hbmRPdXRwdXQpIHtcbiAgICAgICAgICB0aGlzLmVtaXR0ZXIuZW1pdCgnY29tbWFuZC1pc3N1ZWQnLCBjb21tYW5kLnRleHQpXG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnN0ZGluLndyaXRlKGNvbW1hbmQudGV4dCArIG9zLkVPTClcbiAgICAgIH1cbiAgICB9XG5cbiAgICBsZXQgY3VycmVudFByb21pc2U6IFByb21pc2U8c3RyaW5nPlxuICAgIHJldHVybiBjdXJyZW50UHJvbWlzZSA9IG5ldyBQcm9taXNlPHN0cmluZz4oKGZ1bGZpbCkgPT4ge1xuICAgICAgY29uc3QgY29tbWFuZDogQ29tbWFuZCA9IHtcbiAgICAgICAgdGV4dDogY29tbWFuZFRleHQsXG4gICAgICAgIGVtaXRDb21tYW5kT3V0cHV0LFxuICAgICAgICBmdWxmaWxXaXRoUHJvbXB0LFxuICAgICAgICBvbkZpbmlzaDogYXN5bmMgKG91dHB1dCkgPT4ge1xuICAgICAgICAgIHRoaXMuY3VycmVudENvbW1hbmQgPSB1bmRlZmluZWRcblxuICAgICAgICAgIGZ1bmN0aW9uIF9mdWxmaWwobm9Qcm9tcHQ6IHN0cmluZykge1xuICAgICAgICAgICAgaWYgKGZ1bGZpbFdpdGhQcm9tcHQpIHtcbiAgICAgICAgICAgICAgZnVsZmlsKG91dHB1dClcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGZ1bGZpbChub1Byb21wdClcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG5cbiAgICAgICAgICBjb25zdCBsYXN0RW5kT2ZMaW5lUG9zID0gb3V0cHV0Lmxhc3RJbmRleE9mKG9zLkVPTClcblxuICAgICAgICAgIGlmIChsYXN0RW5kT2ZMaW5lUG9zID09PSAtMSkge1xuICAgICAgICAgICAgLyppLmUuIG5vIG91dHB1dCBoYXMgYmVlbiBwcm9kdWNlZCovXG4gICAgICAgICAgICBpZiAoZW1pdFN0YXR1c0NoYW5nZXMpIHtcbiAgICAgICAgICAgICAgdGhpcy5lbWl0U3RhdHVzQ2hhbmdlcyhvdXRwdXQsICcnLCBlbWl0SGlzdG9yeUxlbmd0aCkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgX2Z1bGZpbCgnJylcbiAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIF9mdWxmaWwoJycpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0IHByb21wdEJlZ2luUG9zaXRpb24gPSBsYXN0RW5kT2ZMaW5lUG9zICsgb3MuRU9MLmxlbmd0aFxuXG4gICAgICAgICAgICBpZiAoZW1pdFN0YXR1c0NoYW5nZXMpIHtcbiAgICAgICAgICAgICAgdGhpcy5lbWl0U3RhdHVzQ2hhbmdlcyhcbiAgICAgICAgICAgICAgICBvdXRwdXQuc2xpY2UocHJvbXB0QmVnaW5Qb3NpdGlvbiwgb3V0cHV0Lmxlbmd0aCksXG4gICAgICAgICAgICAgICAgb3V0cHV0LnNsaWNlKDAsIGxhc3RFbmRPZkxpbmVQb3MpLFxuICAgICAgICAgICAgICAgIGVtaXRIaXN0b3J5TGVuZ3RoLFxuICAgICAgICAgICAgICApLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgIF9mdWxmaWwob3V0cHV0LnNsaWNlKDAsIGxhc3RFbmRPZkxpbmVQb3MpKVxuICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgX2Z1bGZpbChvdXRwdXQuc2xpY2UoMCwgbGFzdEVuZE9mTGluZVBvcykpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgYXdhaXQgY3VycmVudFByb21pc2VcblxuICAgICAgICAgIGlmICh0aGlzLmNvbW1hbmRzLmxlbmd0aCAhPT0gMCkge1xuICAgICAgICAgICAgc2hpZnRBbmRSdW5Db21tYW5kKClcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICB9XG5cbiAgICAgIHRoaXMuY29tbWFuZHMucHVzaChjb21tYW5kKVxuXG4gICAgICBpZiAodGhpcy5jdXJyZW50Q29tbWFuZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHNoaWZ0QW5kUnVuQ29tbWFuZCgpXG4gICAgICB9XG4gICAgfSlcbiAgfVxuXG4gIHByaXZhdGUgYWRkUmVhZHlFdmVudCgpIHtcbiAgICBjb25zdCBldmVudFN1YnMgPSBbXG4gICAgICAncGF1c2VkLW9uLWV4Y2VwdGlvbicsXG4gICAgICAnbGluZS1jaGFuZ2VkJyxcbiAgICAgICdkZWJ1Zy1maW5pc2hlZCcsXG4gICAgXVxuXG4gICAgZm9yIChjb25zdCBldmVudE5hbWUgb2YgZXZlbnRTdWJzKSB7XG4gICAgICAodGhpcy5lbWl0dGVyLm9uIGFzIGFueSkoZXZlbnROYW1lLCAoKSA9PiB0aGlzLmVtaXR0ZXIuZW1pdCgncmVhZHknLCB1bmRlZmluZWQpKVxuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgZ2V0QmluZGluZ3MoKSB7XG4gICAgY29uc3Qgb3V0cHV0U3RyID0gYXdhaXQgdGhpcy5ydW4oJzpzaG93IGJpbmRpbmdzJywgZmFsc2UsIGZhbHNlLCBmYWxzZSlcbiAgICByZXR1cm4gb3V0cHV0U3RyLnNwbGl0KG9zLkVPTClcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgZ2V0SGlzdG9yeUxlbmd0aCgpIHtcbiAgICBjb25zdCBoaXN0b3J5UXVlcnkgPSBhd2FpdCB0aGlzLnJ1bignOmhpc3RvcnkgMTAwJywgZmFsc2UsIGZhbHNlLCBmYWxzZSlcbiAgICBjb25zdCByZWdleCA9IC8tKFxcZCopLiooPzpcXG58XFxyfFxcclxcbik8ZW5kIG9mIGhpc3Rvcnk+JC9cblxuICAgIGNvbnN0IG1hdGNoUmVzdWx0ID0gaGlzdG9yeVF1ZXJ5Lm1hdGNoKHJlZ2V4KVxuICAgIGlmICghbWF0Y2hSZXN1bHQpIHtcbiAgICAgIGlmIChoaXN0b3J5UXVlcnkuc2xpY2UoLTMpID09PSAnLi4uJykge1xuICAgICAgICByZXR1cm4gSW5maW5pdHkgLy8gaGlzdG9yeSBpcyB2ZXJ5IGxvbmdcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiAwXG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBwYXJzZUludChtYXRjaFJlc3VsdFsxXSwgMTApXG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBwYXJzZVByb21wdChzdGRPdXRwdXQ6IHN0cmluZyk6IEJyZWFrSW5mbyB8IFN5bWJvbCB7XG4gICAgY29uc3QgcGF0dGVybnMgPSBbe1xuICAgICAgcGF0dGVybjogL1xcWyg/OlstXFxkXSo6ICk/KC4qKTpcXCgoXFxkKyksKFxcZCspXFwpLVxcKChcXGQrKSwoXFxkKylcXCkuKlxcXS4qPiAkLyxcbiAgICAgIGZ1bmM6IChtYXRjaCkgPT4gKHtcbiAgICAgICAgZmlsZW5hbWU6IG1hdGNoWzFdLFxuICAgICAgICByYW5nZTogW1twYXJzZUludChtYXRjaFsyXSwgMTApIC0gMSwgcGFyc2VJbnQobWF0Y2hbM10sIDEwKSAtIDFdLFxuICAgICAgICBbcGFyc2VJbnQobWF0Y2hbNF0sIDEwKSwgcGFyc2VJbnQobWF0Y2hbNV0sIDEwKV1dLFxuICAgICAgfSksXG4gICAgfSwge1xuICAgICAgcGF0dGVybjogL1xcWyg/OlstXFxkXSo6ICk/KC4qKTooXFxkKik6KFxcZCopLShcXGQqKVxcXS4qPiAkLyxcbiAgICAgIGZ1bmM6IChtYXRjaCkgPT4gKHtcbiAgICAgICAgZmlsZW5hbWU6IG1hdGNoWzFdLFxuICAgICAgICByYW5nZTogW1twYXJzZUludChtYXRjaFsyXSwgMTApIC0gMSwgcGFyc2VJbnQobWF0Y2hbM10sIDEwKSAtIDFdLFxuICAgICAgICBbcGFyc2VJbnQobWF0Y2hbMl0sIDEwKSAtIDEsIHBhcnNlSW50KG1hdGNoWzRdLCAxMCldXSxcbiAgICAgIH0pLFxuICAgIH0sIHtcbiAgICAgIHBhdHRlcm46IC9cXFs8ZXhjZXB0aW9uIHRocm93bj5cXF0uKj4gJC8sXG4gICAgICBmdW5jOiAoKSA9PiBHSENJRGVidWcucGF1c2VkT25FcnJvcixcbiAgICB9LCB7XG4gICAgICBwYXR0ZXJuOiAvLio+ICQvLFxuICAgICAgZnVuYzogKCkgPT4gR0hDSURlYnVnLmZpbmlzaGVkRGVidWdnaW5nLFxuICAgIH1dIGFzIEFycmF5PHsgcGF0dGVybjogUmVnRXhwOyBmdW5jOiAobWF0Y2g6IHN0cmluZ1tdKSA9PiBCcmVha0luZm8gfCBTeW1ib2wgfT5cbiAgICBmb3IgKGNvbnN0IHBhdHRlcm4gb2YgcGF0dGVybnMpIHtcbiAgICAgIGNvbnN0IG1hdGNoUmVzdWx0ID0gc3RkT3V0cHV0Lm1hdGNoKHBhdHRlcm4ucGF0dGVybilcbiAgICAgIGlmIChtYXRjaFJlc3VsdCkge1xuICAgICAgICByZXR1cm4gcGF0dGVybi5mdW5jKG1hdGNoUmVzdWx0KVxuICAgICAgfVxuICAgIH1cbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0Nhbm5vdCByZWFkIHByb21wdDogXFxuJyArIHN0ZE91dHB1dClcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgZW1pdFN0YXR1c0NoYW5nZXMocHJvbXB0OiBzdHJpbmcsIG1haW5Cb2R5OiBzdHJpbmcsIGVtaXRIaXN0b3J5TGVuZ3RoOiBib29sZWFuKSB7XG4gICAgY29uc3QgcmVzdWx0ID0gdGhpcy5wYXJzZVByb21wdChwcm9tcHQpXG5cbiAgICBpZiAocmVzdWx0ID09PSBHSENJRGVidWcucGF1c2VkT25FcnJvcikge1xuICAgICAgY29uc3QgaGlzdG9yeUxlbmd0aCA9IGF3YWl0IHRoaXMuZ2V0SGlzdG9yeUxlbmd0aCgpXG5cbiAgICAgIHRoaXMuZW1pdHRlci5lbWl0KCdwYXVzZWQtb24tZXhjZXB0aW9uJywge1xuICAgICAgICBoaXN0b3J5TGVuZ3RoLFxuICAgICAgICBsb2NhbEJpbmRpbmdzOiBtYWluQm9keS5zcGxpdCgnXFxuJykuc2xpY2UoMSksXG4gICAgICB9KVxuICAgIH0gZWxzZSBpZiAocmVzdWx0ID09PSBHSENJRGVidWcuZmluaXNoZWREZWJ1Z2dpbmcpIHtcbiAgICAgIHRoaXMuZW1pdHRlci5lbWl0KCdkZWJ1Zy1maW5pc2hlZCcsIHVuZGVmaW5lZClcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgYnJlYWtJbmZvID0gcmVzdWx0IGFzIEJyZWFrSW5mb1xuXG4gICAgICBicmVha0luZm8ubG9jYWxCaW5kaW5ncyA9IGF3YWl0IHRoaXMuZ2V0QmluZGluZ3MoKVxuXG4gICAgICBpZiAoZW1pdEhpc3RvcnlMZW5ndGgpIHtcbiAgICAgICAgYnJlYWtJbmZvLmhpc3RvcnlMZW5ndGggPSBhd2FpdCB0aGlzLmdldEhpc3RvcnlMZW5ndGgoKVxuICAgICAgfVxuXG4gICAgICB0aGlzLmVtaXR0ZXIuZW1pdCgnbGluZS1jaGFuZ2VkJywgYnJlYWtJbmZvKVxuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgb25TdGRlcnJSZWFkYWJsZSgpIHtcbiAgICBjb25zdCBzdGRlcnJPdXRwdXQ6IEJ1ZmZlciA9IHRoaXMuc3RkZXJyLnJlYWQoKVxuICAgIGlmICghc3RkZXJyT3V0cHV0IHx8IHRoaXMuaWdub3JlRXJyb3JzKSB7XG4gICAgICByZXR1cm4gLy8gdGhpcyBpcyB0aGUgZW5kIG9mIHRoZSBpbnB1dCBzdHJlYW1cbiAgICB9XG5cbiAgICB0aGlzLmVtaXR0ZXIuZW1pdCgnZXJyb3InLCBzdGRlcnJPdXRwdXQudG9TdHJpbmcoKSlcblxuICAgIGlmICh0aGlzLmN1cnJlbnRTdGRlcnJPdXRwdXQgPT09ICcnKSB7XG4gICAgICBjb25zdCBkaXNwID0gdGhpcy5lbWl0dGVyLm9uKCdyZWFkeScsICgpID0+IHtcbiAgICAgICAgdGhpcy5lbWl0dGVyLmVtaXQoJ2Vycm9yLWNvbXBsZXRlZCcsIHRoaXMuY3VycmVudFN0ZGVyck91dHB1dClcbiAgICAgICAgdGhpcy5jdXJyZW50U3RkZXJyT3V0cHV0ID0gJydcbiAgICAgICAgZGlzcC5kaXNwb3NlKClcbiAgICAgIH0pXG4gICAgfVxuXG4gICAgdGhpcy5jdXJyZW50U3RkZXJyT3V0cHV0ICs9IHN0ZGVyck91dHB1dC50b1N0cmluZygpXG4gIH1cblxuICBwcml2YXRlIG9uU3Rkb3V0UmVhZGFibGUoKSB7XG4gICAgY29uc3QgY3VycmVudFN0cmluZyA9ICh0aGlzLnN0ZG91dC5yZWFkKCkgfHwgJycpLnRvU3RyaW5nKClcblxuICAgIHRoaXMuY3VycmVudENvbW1hbmRCdWZmZXIgKz0gY3VycmVudFN0cmluZ1xuXG4gICAgY29uc3QgZmluaXNoU3RyaW5nUG9zaXRpb24gPSB0aGlzLmN1cnJlbnRDb21tYW5kQnVmZmVyLnNlYXJjaCh0aGlzLmNvbW1hbmRGaW5pc2hlZFN0cmluZylcbiAgICBpZiAoZmluaXNoU3RyaW5nUG9zaXRpb24gIT09IC0xKSB7XG4gICAgICBjb25zdCBvdXRwdXRTdHJpbmcgPSB0aGlzLmN1cnJlbnRDb21tYW5kQnVmZmVyLnNsaWNlKDAsIGZpbmlzaFN0cmluZ1Bvc2l0aW9uKVxuXG4gICAgICBpZiAodGhpcy5jdXJyZW50Q29tbWFuZCkge1xuICAgICAgICBpZiAodGhpcy5jdXJyZW50Q29tbWFuZC5lbWl0Q29tbWFuZE91dHB1dCkge1xuICAgICAgICAgIHRoaXMuZW1pdHRlci5lbWl0KCdjb25zb2xlLW91dHB1dCcsIG91dHB1dFN0cmluZylcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuY3VycmVudENvbW1hbmQub25GaW5pc2gob3V0cHV0U3RyaW5nKVxuICAgICAgfVxuXG4gICAgICAvLyBUYWtlIHRoZSBmaW5pc2hlZCBzdHJpbmcgb2ZmIHRoZSBidWZmZXIgYW5kIHByb2Nlc3MgdGhlIG5leHQgb3VwdXRcbiAgICAgIHRoaXMuY3VycmVudENvbW1hbmRCdWZmZXIgPSB0aGlzLmN1cnJlbnRDb21tYW5kQnVmZmVyLnNsaWNlKFxuICAgICAgICBmaW5pc2hTdHJpbmdQb3NpdGlvbiArIHRoaXMuY29tbWFuZEZpbmlzaGVkU3RyaW5nLmxlbmd0aClcbiAgICAgIHRoaXMub25TdGRvdXRSZWFkYWJsZSgpXG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBtb2R1bGVOYW1lRnJvbUZpbGVQYXRoKGZpbGVQYXRoOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IGNhY2hlZE1vZHVsZU5hbWUgPSB0aGlzLm1vZHVsZU5hbWVCeVBhdGguZ2V0KGZpbGVQYXRoKVxuICAgIGlmIChjYWNoZWRNb2R1bGVOYW1lKSByZXR1cm4gY2FjaGVkTW9kdWxlTmFtZVxuICAgIGNvbnN0IG1vZHVsZXMgPSAoYXdhaXQgdGhpcy5ydW4oJzpzaG93IG1vZHVsZXMnKSkuc3BsaXQob3MuRU9MKVxuICAgIGNvbnN0IHJlZ2V4ID0gL14oW14gXSspICtcXCggKyguKyksICtcXHcrICtcXCkkL1xuICAgIGZvciAoY29uc3QgbW9kdWxlU3RyIG9mIG1vZHVsZXMpIHtcbiAgICAgIGNvbnN0IG1hdGNoUmVzdWx0ID0gcmVnZXguZXhlYyhtb2R1bGVTdHIpXG4gICAgICBpZiAobWF0Y2hSZXN1bHQpIHtcbiAgICAgICAgdGhpcy5tb2R1bGVOYW1lQnlQYXRoLnNldChtYXRjaFJlc3VsdFsyXSwgbWF0Y2hSZXN1bHRbMV0pXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zb2xlLmVycm9yKGBVbmV4cGVjdGVkIHJlcGx5IGZyb20gR0hDSSAnOnNob3cgbW9kdWxlcyc6ICR7bW9kdWxlU3RyfWApXG4gICAgICB9XG4gICAgfVxuICAgIGNvbnN0IG5ld0NhY2hlZE1vZHVsZU5hbWUgPSB0aGlzLm1vZHVsZU5hbWVCeVBhdGguZ2V0KGZpbGVQYXRoKVxuICAgIGlmIChuZXdDYWNoZWRNb2R1bGVOYW1lKSB7XG4gICAgICByZXR1cm4gbmV3Q2FjaGVkTW9kdWxlTmFtZVxuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYENvdWxkbid0IGZpbmQgbW9kdWxlIG5hbWUgZm9yICR7ZmlsZVBhdGh9YClcbiAgICB9XG4gIH1cbn1cbiJdfQ==