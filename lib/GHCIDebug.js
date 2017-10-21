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
        return __awaiter(this, void 0, void 0, function* () {
            const cwd = path.dirname(name);
            yield this.run(`:cd ${cwd}`);
            yield this.run(`:load ${name}`);
        });
    }
    setExceptionBreakLevel(level) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.run(':unset -fbreak-on-exception');
            yield this.run(':unset -fbreak-on-error');
            switch (level) {
                case 'exceptions':
                    yield this.run(':set -fbreak-on-exception');
                    break;
                case 'errors':
                    yield this.run(':set -fbreak-on-error');
                    break;
                case 'none':
                    break;
            }
        });
    }
    addBreakpoint(breakpoint) {
        return __awaiter(this, void 0, void 0, function* () {
            if (typeof breakpoint === 'string') {
                yield this.run(`:break ${breakpoint}`);
            }
            else {
                try {
                    const moduleName = yield this.moduleNameFromFilePath(breakpoint.file);
                    yield this.run(`:break ${moduleName} ${breakpoint.line}`);
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
        return __awaiter(this, void 0, void 0, function* () {
            return this.run(':forward', true);
        });
    }
    back() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.run(':back', true);
        });
    }
    step() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.run(':step', true, true);
        });
    }
    stop() {
        setTimeout(() => this.ghciCmd.kill(), 3000);
        this.run(':quit')
            .catch((e) => {
            atom.notifications.addError('Error while stopping GHCI', {
                detail: e,
                stack: e.stack,
                dismissable: true,
            });
        });
    }
    continue() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.run(':continue', true);
        });
    }
    addedAllListeners() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.startText.then((text) => {
                const firstPrompt = text.indexOf('> ');
                this.emitter.emit('console-output', text.slice(0, firstPrompt + 2));
            });
        });
    }
    startDebug(moduleName) {
        return __awaiter(this, void 0, void 0, function* () {
            moduleName = moduleName || 'main';
            return this.run(':trace ' + moduleName, true, true);
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
            const p = new Promise((fulfil) => {
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
                                yield this.emitStatusChanges(output, '', emitHistoryLength);
                            }
                            _fulfil('');
                        }
                        else {
                            const promptBeginPosition = lastEndOfLinePos + os.EOL.length;
                            if (emitStatusChanges) {
                                yield this.emitStatusChanges(output.slice(promptBeginPosition, output.length), output.slice(0, lastEndOfLinePos), emitHistoryLength);
                            }
                            _fulfil(output.slice(0, lastEndOfLinePos));
                        }
                    }),
                };
                this.commands.push(command);
                if (this.currentCommand === undefined) {
                    shiftAndRunCommand();
                }
            });
            p.then(() => {
                if (this.commands.length !== 0) {
                    shiftAndRunCommand();
                }
            }).catch((e) => {
                atom.notifications.addError('An error happened', {
                    detail: e,
                    stack: e.stack,
                    dismissable: true,
                });
            });
            return p;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiR0hDSURlYnVnLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2xpYi9HSENJRGVidWcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQUFBLG9DQUFvQztBQUVwQyx5QkFBeUI7QUFDekIsNkJBQTZCO0FBQzdCLGdDQUFnQztBQXFCaEM7SUE4QkUsWUFBWSxXQUFXLEdBQUcsTUFBTSxFQUFFLFdBQXFCLEVBQUUsRUFBRSxNQUFlO1FBMUJsRSxZQUFPLEdBU1YsSUFBSSxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUE7UUFFVixPQUFFLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQTtRQU8vQyxpQkFBWSxHQUFHLEtBQUssQ0FBQTtRQUNwQix3QkFBbUIsR0FBRyxFQUFFLENBQUE7UUFDeEIseUJBQW9CLEdBQUcsRUFBRSxDQUFBO1FBQ3pCLGFBQVEsR0FBRyxFQUFlLENBQUE7UUFFMUIsMEJBQXFCLEdBQUcscUNBQXFDLENBQUE7UUFDN0QscUJBQWdCLEdBQXdCLElBQUksR0FBRyxFQUFFLENBQUE7UUFJdkQsSUFBSSxDQUFDLE9BQU8sR0FBRyxFQUFFLENBQUMsS0FBSyxDQUFDLFdBQVcsRUFBRSxRQUFRLEVBQUUsRUFBRSxHQUFHLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFBO1FBRTVFLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLE1BQU0sRUFBRTtZQUN0QixJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxTQUFTLENBQUMsQ0FBQTtRQUNoRCxDQUFDLENBQUMsQ0FBQTtRQUVGLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUE7UUFDakMsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQTtRQUMvQixJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFBO1FBQ2pDLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLFVBQVUsRUFBRSxNQUFNLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDLENBQUE7UUFDekQsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsVUFBVSxFQUFFLE1BQU0sSUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUMsQ0FBQTtRQUV6RCxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUE7UUFFcEIsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLG9CQUFvQixJQUFJLENBQUMscUJBQXFCLEdBQUcsRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxJQUFJLENBQUMsQ0FBQTtJQUN6RyxDQUFDO0lBRU0sT0FBTztRQUNaLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQTtJQUNiLENBQUM7SUFFWSxVQUFVLENBQUMsSUFBWTs7WUFDbEMsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQTtZQUU5QixNQUFNLElBQUksQ0FBQyxHQUFHLENBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQyxDQUFBO1lBQzVCLE1BQU0sSUFBSSxDQUFDLEdBQUcsQ0FBQyxTQUFTLElBQUksRUFBRSxDQUFDLENBQUE7UUFDakMsQ0FBQztLQUFBO0lBRVksc0JBQXNCLENBQUMsS0FBMkI7O1lBQzdELE1BQU0sSUFBSSxDQUFDLEdBQUcsQ0FBQyw2QkFBNkIsQ0FBQyxDQUFBO1lBQzdDLE1BQU0sSUFBSSxDQUFDLEdBQUcsQ0FBQyx5QkFBeUIsQ0FBQyxDQUFBO1lBRXpDLE1BQU0sQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7Z0JBQ2QsS0FBSyxZQUFZO29CQUNmLE1BQU0sSUFBSSxDQUFDLEdBQUcsQ0FBQywyQkFBMkIsQ0FBQyxDQUFBO29CQUMzQyxLQUFLLENBQUE7Z0JBQ1AsS0FBSyxRQUFRO29CQUNYLE1BQU0sSUFBSSxDQUFDLEdBQUcsQ0FBQyx1QkFBdUIsQ0FBQyxDQUFBO29CQUN2QyxLQUFLLENBQUE7Z0JBQ1AsS0FBSyxNQUFNO29CQUNULEtBQUssQ0FBQTtZQUNULENBQUM7UUFDSCxDQUFDO0tBQUE7SUFFWSxhQUFhLENBQUMsVUFBK0I7O1lBQ3hELEVBQUUsQ0FBQyxDQUFDLE9BQU8sVUFBVSxLQUFLLFFBQVEsQ0FBQyxDQUFDLENBQUM7Z0JBQ25DLE1BQU0sSUFBSSxDQUFDLEdBQUcsQ0FBQyxVQUFVLFVBQVUsRUFBRSxDQUFDLENBQUE7WUFDeEMsQ0FBQztZQUFDLElBQUksQ0FBQyxDQUFDO2dCQUNOLElBQUksQ0FBQztvQkFDSCxNQUFNLFVBQVUsR0FBVyxNQUFNLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUE7b0JBQzdFLE1BQU0sSUFBSSxDQUFDLEdBQUcsQ0FBQyxVQUFVLFVBQVUsSUFBSSxVQUFVLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQTtnQkFDM0QsQ0FBQztnQkFBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUVYLElBQUksQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDLCtCQUErQixVQUFVLENBQUMsSUFBSSxFQUFFLEVBQUU7d0JBQzVFLE1BQU0sRUFBRSxDQUFDO3dCQUNULEtBQUssRUFBRSxDQUFDLENBQUMsS0FBSzt3QkFDZCxXQUFXLEVBQUUsSUFBSTtxQkFDbEIsQ0FBQyxDQUFBO2dCQUVKLENBQUM7WUFDSCxDQUFDO1FBQ0gsQ0FBQztLQUFBO0lBSVksaUJBQWlCLENBQUMsVUFBa0I7O1lBQy9DLEVBQUUsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDdkIsTUFBTSxDQUFDLFNBQVMsQ0FBQTtZQUNsQixDQUFDO1lBRUQsRUFBRSxDQUFDLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ3BDLE1BQU0sQ0FBQyxTQUFTLENBQUE7WUFDbEIsQ0FBQztZQUVELE1BQU0sYUFBYSxHQUFHLENBQUMsVUFBa0IsRUFBRSxRQUFnQjtnQkFDekQsTUFBTSxXQUFXLEdBQUcsVUFBVSxDQUFDLEtBQUssQ0FBQyxjQUFjLENBQUMsQ0FBQTtnQkFDcEQsRUFBRSxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDO29CQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUE7Z0JBQUMsQ0FBQztnQkFDdEMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQTtZQUN2QixDQUFDLENBQUE7WUFHRCxJQUFJLENBQUMsWUFBWSxHQUFHLElBQUksQ0FBQTtZQUV4QixJQUFJLENBQUM7Z0JBRUgsTUFBTSxjQUFjLEdBQUcsYUFBYSxDQUNsQyxNQUFNLElBQUksQ0FBQyxHQUFHLENBQUMsVUFBVSxVQUFVLEVBQUUsRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBQyxFQUFFLFVBQVUsQ0FBQyxDQUFBO2dCQUMxRSxFQUFFLENBQUMsQ0FBQyxjQUFjLEtBQUssU0FBUyxDQUFDLENBQUMsQ0FBQztvQkFDakMsTUFBTSxDQUFDLGNBQWMsQ0FBQTtnQkFDdkIsQ0FBQztnQkFHRCxJQUFJLFVBQVUsR0FBRyxDQUFDLENBQUE7Z0JBQ2xCLElBQUksZ0JBQW9DLENBQUE7Z0JBQ3hDLEdBQUcsQ0FBQztvQkFDRixnQkFBZ0IsR0FBRyxhQUFhLENBQzlCLE1BQU0sSUFBSSxDQUFDLEdBQUcsQ0FBQyxjQUFjLFVBQVUsRUFBRSxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUFDLEVBQUUsT0FBTyxVQUFVLEVBQUUsQ0FBQyxDQUFBO29CQUN2RixVQUFVLElBQUksQ0FBQyxDQUFBO2dCQUNqQixDQUFDLFFBQVEsZ0JBQWdCLEtBQUssU0FBUyxFQUFDO2dCQUV4QyxNQUFNLElBQUksQ0FBQyxHQUFHLENBQUMsV0FBVyxVQUFVLE1BQU0sVUFBVSxFQUFFLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQTtnQkFDNUUsTUFBTSxDQUFDLGFBQWEsQ0FBQyxNQUFNLElBQUksQ0FBQyxHQUFHLENBQUMsY0FBYyxVQUFVLEVBQUUsRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBQyxFQUFFLE9BQU8sVUFBVSxFQUFFLENBQUMsQ0FBQTtZQUM1RyxDQUFDO29CQUFTLENBQUM7Z0JBQ1QsSUFBSSxDQUFDLFlBQVksR0FBRyxLQUFLLENBQUE7WUFDM0IsQ0FBQztRQUNILENBQUM7S0FBQTtJQUVZLE9BQU87O1lBQ2xCLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLFVBQVUsRUFBRSxJQUFJLENBQUMsQ0FBQTtRQUNuQyxDQUFDO0tBQUE7SUFFWSxJQUFJOztZQUNmLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsQ0FBQTtRQUNoQyxDQUFDO0tBQUE7SUFFWSxJQUFJOztZQUNmLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUE7UUFDdEMsQ0FBQztLQUFBO0lBRU0sSUFBSTtRQUNULFVBQVUsQ0FDUixNQUFNLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLEVBQ3pCLElBQUksQ0FBQyxDQUFBO1FBQ1AsSUFBSSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUM7YUFDaEIsS0FBSyxDQUFDLENBQUMsQ0FBUTtZQUNkLElBQUksQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDLDJCQUEyQixFQUFFO2dCQUN2RCxNQUFNLEVBQUUsQ0FBQztnQkFDVCxLQUFLLEVBQUUsQ0FBQyxDQUFDLEtBQUs7Z0JBQ2QsV0FBVyxFQUFFLElBQUk7YUFDbEIsQ0FBQyxDQUFBO1FBQ0osQ0FBQyxDQUFDLENBQUE7SUFDSixDQUFDO0lBRVksUUFBUTs7WUFDbkIsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsV0FBVyxFQUFFLElBQUksQ0FBQyxDQUFBO1FBQ3BDLENBQUM7S0FBQTtJQUVZLGlCQUFpQjs7WUFDNUIsTUFBTSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSTtnQkFDOUIsTUFBTSxXQUFXLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQTtnQkFDdEMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsV0FBVyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUE7WUFDckUsQ0FBQyxDQUFDLENBQUE7UUFDSixDQUFDO0tBQUE7SUFFWSxVQUFVLENBQUMsVUFBbUI7O1lBQ3pDLFVBQVUsR0FBRyxVQUFVLElBQUksTUFBTSxDQUFBO1lBQ2pDLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLFNBQVMsR0FBRyxVQUFVLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFBO1FBQ3JELENBQUM7S0FBQTtJQUVZLEdBQUcsQ0FDZCxXQUFtQixFQUNuQixvQkFBNkIsS0FBSyxFQUNsQyxvQkFBNkIsS0FBSyxFQUNsQyxvQkFBNkIsSUFBSSxFQUNqQyxtQkFBNEIsS0FBSzs7WUFFakMsTUFBTSxrQkFBa0IsR0FBRztnQkFDekIsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLEVBQUUsQ0FBQTtnQkFFckMsSUFBSSxDQUFDLGNBQWMsR0FBRyxPQUFPLENBQUE7Z0JBRTdCLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7b0JBQ1osRUFBRSxDQUFDLENBQUMsT0FBTyxDQUFDLGlCQUFpQixDQUFDLENBQUMsQ0FBQzt3QkFDOUIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFBO29CQUNuRCxDQUFDO29CQUVELElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxJQUFJLEdBQUcsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFBO2dCQUN6QyxDQUFDO1lBQ0gsQ0FBQyxDQUFBO1lBRUQsTUFBTSxDQUFDLEdBQUcsSUFBSSxPQUFPLENBQVMsQ0FBQyxNQUFNO2dCQUNuQyxNQUFNLE9BQU8sR0FBWTtvQkFDdkIsSUFBSSxFQUFFLFdBQVc7b0JBQ2pCLGlCQUFpQjtvQkFDakIsZ0JBQWdCO29CQUNoQixRQUFRLEVBQUUsQ0FBTyxNQUFNO3dCQUNyQixJQUFJLENBQUMsY0FBYyxHQUFHLFNBQVMsQ0FBQTt3QkFFL0IsaUJBQWlCLFFBQWdCOzRCQUMvQixFQUFFLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUM7Z0NBQ3JCLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQTs0QkFDaEIsQ0FBQzs0QkFBQyxJQUFJLENBQUMsQ0FBQztnQ0FDTixNQUFNLENBQUMsUUFBUSxDQUFDLENBQUE7NEJBQ2xCLENBQUM7d0JBQ0gsQ0FBQzt3QkFFRCxNQUFNLGdCQUFnQixHQUFHLE1BQU0sQ0FBQyxXQUFXLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFBO3dCQUVuRCxFQUFFLENBQUMsQ0FBQyxnQkFBZ0IsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7NEJBRTVCLEVBQUUsQ0FBQyxDQUFDLGlCQUFpQixDQUFDLENBQUMsQ0FBQztnQ0FDdEIsTUFBTSxJQUFJLENBQUMsaUJBQWlCLENBQUMsTUFBTSxFQUFFLEVBQUUsRUFBRSxpQkFBaUIsQ0FBQyxDQUFBOzRCQUM3RCxDQUFDOzRCQUNELE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQTt3QkFDYixDQUFDO3dCQUFDLElBQUksQ0FBQyxDQUFDOzRCQUNOLE1BQU0sbUJBQW1CLEdBQUcsZ0JBQWdCLEdBQUcsRUFBRSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUE7NEJBRTVELEVBQUUsQ0FBQyxDQUFDLGlCQUFpQixDQUFDLENBQUMsQ0FBQztnQ0FDdEIsTUFBTSxJQUFJLENBQUMsaUJBQWlCLENBQzFCLE1BQU0sQ0FBQyxLQUFLLENBQUMsbUJBQW1CLEVBQUUsTUFBTSxDQUFDLE1BQU0sQ0FBQyxFQUNoRCxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxnQkFBZ0IsQ0FBQyxFQUNqQyxpQkFBaUIsQ0FDbEIsQ0FBQTs0QkFDSCxDQUFDOzRCQUNELE9BQU8sQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDLENBQUE7d0JBQzVDLENBQUM7b0JBQ0gsQ0FBQyxDQUFBO2lCQUNGLENBQUE7Z0JBRUQsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUE7Z0JBRTNCLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxjQUFjLEtBQUssU0FBUyxDQUFDLENBQUMsQ0FBQztvQkFDdEMsa0JBQWtCLEVBQUUsQ0FBQTtnQkFDdEIsQ0FBQztZQUNILENBQUMsQ0FBQyxDQUFBO1lBQ0YsQ0FBQyxDQUFDLElBQUksQ0FBRTtnQkFDTixFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUMvQixrQkFBa0IsRUFBRSxDQUFBO2dCQUN0QixDQUFDO1lBQ0gsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBUTtnQkFDaEIsSUFBSSxDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQUMsbUJBQW1CLEVBQUU7b0JBQy9DLE1BQU0sRUFBRSxDQUFDO29CQUNULEtBQUssRUFBRSxDQUFDLENBQUMsS0FBSztvQkFDZCxXQUFXLEVBQUUsSUFBSTtpQkFDbEIsQ0FBQyxDQUFBO1lBQ0osQ0FBQyxDQUFDLENBQUE7WUFDRixNQUFNLENBQUMsQ0FBQyxDQUFBO1FBQ1YsQ0FBQztLQUFBO0lBRU8sYUFBYTtRQUNuQixNQUFNLFNBQVMsR0FBRztZQUNoQixxQkFBcUI7WUFDckIsY0FBYztZQUNkLGdCQUFnQjtTQUNqQixDQUFBO1FBRUQsR0FBRyxDQUFDLENBQUMsTUFBTSxTQUFTLElBQUksU0FBUyxDQUFDLENBQUMsQ0FBQztZQUNqQyxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQVUsQ0FBQyxTQUFTLEVBQUUsTUFBTSxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsU0FBUyxDQUFDLENBQUMsQ0FBQTtRQUNsRixDQUFDO0lBQ0gsQ0FBQztJQUVhLFdBQVc7O1lBQ3ZCLE1BQU0sU0FBUyxHQUFHLE1BQU0sSUFBSSxDQUFDLEdBQUcsQ0FBQyxnQkFBZ0IsRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFBO1lBQ3ZFLE1BQU0sQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQTtRQUNoQyxDQUFDO0tBQUE7SUFFYSxnQkFBZ0I7O1lBQzVCLE1BQU0sWUFBWSxHQUFHLE1BQU0sSUFBSSxDQUFDLEdBQUcsQ0FBQyxjQUFjLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQTtZQUN4RSxNQUFNLEtBQUssR0FBRyx5Q0FBeUMsQ0FBQTtZQUV2RCxNQUFNLFdBQVcsR0FBRyxZQUFZLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFBO1lBQzdDLEVBQUUsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQztnQkFDakIsRUFBRSxDQUFDLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLEtBQUssQ0FBQyxDQUFDLENBQUM7b0JBQ3JDLE1BQU0sQ0FBQyxRQUFRLENBQUE7Z0JBQ2pCLENBQUM7Z0JBQUMsSUFBSSxDQUFDLENBQUM7b0JBQ04sTUFBTSxDQUFDLENBQUMsQ0FBQTtnQkFDVixDQUFDO1lBQ0gsQ0FBQztZQUFDLElBQUksQ0FBQyxDQUFDO2dCQUNOLE1BQU0sQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFBO1lBQ3JDLENBQUM7UUFDSCxDQUFDO0tBQUE7SUFFTyxXQUFXLENBQUMsU0FBaUI7UUFDbkMsTUFBTSxRQUFRLEdBQUcsQ0FBQztnQkFDaEIsT0FBTyxFQUFFLDhEQUE4RDtnQkFDdkUsSUFBSSxFQUFFLENBQUMsS0FBSyxLQUFLLENBQUM7b0JBQ2hCLFFBQVEsRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDO29CQUNsQixLQUFLLEVBQUUsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDO3dCQUNoRSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO2lCQUNsRCxDQUFDO2FBQ0gsRUFBRTtnQkFDRCxPQUFPLEVBQUUsOENBQThDO2dCQUN2RCxJQUFJLEVBQUUsQ0FBQyxLQUFLLEtBQUssQ0FBQztvQkFDaEIsUUFBUSxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUM7b0JBQ2xCLEtBQUssRUFBRSxDQUFDLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUM7d0JBQ2hFLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO2lCQUN0RCxDQUFDO2FBQ0gsRUFBRTtnQkFDRCxPQUFPLEVBQUUsNkJBQTZCO2dCQUN0QyxJQUFJLEVBQUUsTUFBTSxTQUFTLENBQUMsYUFBYTthQUNwQyxFQUFFO2dCQUNELE9BQU8sRUFBRSxPQUFPO2dCQUNoQixJQUFJLEVBQUUsTUFBTSxTQUFTLENBQUMsaUJBQWlCO2FBQ3hDLENBQThFLENBQUE7UUFDL0UsR0FBRyxDQUFDLENBQUMsTUFBTSxPQUFPLElBQUksUUFBUSxDQUFDLENBQUMsQ0FBQztZQUMvQixNQUFNLFdBQVcsR0FBRyxTQUFTLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQTtZQUNwRCxFQUFFLENBQUMsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDO2dCQUNoQixNQUFNLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQTtZQUNsQyxDQUFDO1FBQ0gsQ0FBQztRQUNELE1BQU0sSUFBSSxLQUFLLENBQUMsd0JBQXdCLEdBQUcsU0FBUyxDQUFDLENBQUE7SUFDdkQsQ0FBQztJQUVhLGlCQUFpQixDQUFDLE1BQWMsRUFBRSxRQUFnQixFQUFFLGlCQUEwQjs7WUFDMUYsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQTtZQUV2QyxFQUFFLENBQUMsQ0FBQyxNQUFNLEtBQUssU0FBUyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUM7Z0JBQ3ZDLE1BQU0sYUFBYSxHQUFHLE1BQU0sSUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUE7Z0JBRW5ELElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLHFCQUFxQixFQUFFO29CQUN2QyxhQUFhO29CQUNiLGFBQWEsRUFBRSxRQUFRLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7aUJBQzdDLENBQUMsQ0FBQTtZQUNKLENBQUM7WUFBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsTUFBTSxLQUFLLFNBQVMsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUM7Z0JBQ2xELElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLGdCQUFnQixFQUFFLFNBQVMsQ0FBQyxDQUFBO1lBQ2hELENBQUM7WUFBQyxJQUFJLENBQUMsQ0FBQztnQkFDTixNQUFNLFNBQVMsR0FBRyxNQUFtQixDQUFBO2dCQUVyQyxTQUFTLENBQUMsYUFBYSxHQUFHLE1BQU0sSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFBO2dCQUVsRCxFQUFFLENBQUMsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUM7b0JBQ3RCLFNBQVMsQ0FBQyxhQUFhLEdBQUcsTUFBTSxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQTtnQkFDekQsQ0FBQztnQkFFRCxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxjQUFjLEVBQUUsU0FBUyxDQUFDLENBQUE7WUFDOUMsQ0FBQztRQUNILENBQUM7S0FBQTtJQUVPLGdCQUFnQjtRQUV0QixNQUFNLFlBQVksR0FBVyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxDQUFBO1FBQy9DLEVBQUUsQ0FBQyxDQUFDLENBQUMsWUFBWSxJQUFJLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDO1lBQ3ZDLE1BQU0sQ0FBQTtRQUNSLENBQUM7UUFFRCxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsWUFBWSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUE7UUFFbkQsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLG1CQUFtQixLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDcEMsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsT0FBTyxFQUFFO2dCQUNwQyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxJQUFJLENBQUMsbUJBQW1CLENBQUMsQ0FBQTtnQkFDOUQsSUFBSSxDQUFDLG1CQUFtQixHQUFHLEVBQUUsQ0FBQTtnQkFDN0IsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFBO1lBQ2hCLENBQUMsQ0FBQyxDQUFBO1FBQ0osQ0FBQztRQUVELElBQUksQ0FBQyxtQkFBbUIsSUFBSSxZQUFZLENBQUMsUUFBUSxFQUFFLENBQUE7SUFDckQsQ0FBQztJQUVPLGdCQUFnQjtRQUV0QixNQUFNLGFBQWEsR0FBRyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUMsUUFBUSxFQUFFLENBQUE7UUFFM0QsSUFBSSxDQUFDLG9CQUFvQixJQUFJLGFBQWEsQ0FBQTtRQUUxQyxNQUFNLG9CQUFvQixHQUFHLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLHFCQUFxQixDQUFDLENBQUE7UUFDekYsRUFBRSxDQUFDLENBQUMsb0JBQW9CLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2hDLE1BQU0sWUFBWSxHQUFHLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLG9CQUFvQixDQUFDLENBQUE7WUFFN0UsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUM7Z0JBQ3hCLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxDQUFDO29CQUMxQyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxZQUFZLENBQUMsQ0FBQTtnQkFDbkQsQ0FBQztnQkFFRCxJQUFJLENBQUMsY0FBYyxDQUFDLFFBQVEsQ0FBQyxZQUFZLENBQUMsQ0FBQTtZQUM1QyxDQUFDO1lBR0QsSUFBSSxDQUFDLG9CQUFvQixHQUFHLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxLQUFLLENBQ3pELG9CQUFvQixHQUFHLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxNQUFNLENBQUMsQ0FBQTtZQUMzRCxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQTtRQUN6QixDQUFDO0lBQ0gsQ0FBQztJQUVhLHNCQUFzQixDQUFDLFFBQWdCOztZQUNuRCxNQUFNLGdCQUFnQixHQUFHLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUE7WUFDNUQsRUFBRSxDQUFDLENBQUMsZ0JBQWdCLENBQUM7Z0JBQUMsTUFBTSxDQUFDLGdCQUFnQixDQUFBO1lBQzdDLE1BQU0sT0FBTyxHQUFHLENBQUMsTUFBTSxJQUFJLENBQUMsR0FBRyxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQTtZQUMvRCxNQUFNLEtBQUssR0FBRywrQkFBK0IsQ0FBQTtZQUM3QyxHQUFHLENBQUMsQ0FBQyxNQUFNLFNBQVMsSUFBSSxPQUFPLENBQUMsQ0FBQyxDQUFDO2dCQUNoQyxNQUFNLFdBQVcsR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFBO2dCQUN6QyxFQUFFLENBQUMsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDO29CQUNoQixJQUFJLENBQUMsZ0JBQWdCLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsRUFBRSxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQTtnQkFDM0QsQ0FBQztnQkFBQyxJQUFJLENBQUMsQ0FBQztvQkFDTixPQUFPLENBQUMsS0FBSyxDQUFDLCtDQUErQyxTQUFTLEVBQUUsQ0FBQyxDQUFBO2dCQUMzRSxDQUFDO1lBQ0gsQ0FBQztZQUNELE1BQU0sbUJBQW1CLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQTtZQUMvRCxFQUFFLENBQUMsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDLENBQUM7Z0JBQ3hCLE1BQU0sQ0FBQyxtQkFBbUIsQ0FBQTtZQUM1QixDQUFDO1lBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ04sTUFBTSxJQUFJLEtBQUssQ0FBQyxpQ0FBaUMsUUFBUSxFQUFFLENBQUMsQ0FBQTtZQUM5RCxDQUFDO1FBQ0gsQ0FBQztLQUFBOztBQTdaYyx1QkFBYSxHQUFHLE1BQU0sQ0FBQyxpQkFBaUIsQ0FBQyxDQUFBO0FBQ3pDLDJCQUFpQixHQUFHLE1BQU0sQ0FBQyxvQkFBb0IsQ0FBQyxDQUFBO0FBRmpFLDhCQStaQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBjcCA9IHJlcXVpcmUoJ2NoaWxkX3Byb2Nlc3MnKVxuaW1wb3J0IHN0cmVhbSA9IHJlcXVpcmUoJ3N0cmVhbScpXG5pbXBvcnQgb3MgPSByZXF1aXJlKCdvcycpXG5pbXBvcnQgcGF0aCA9IHJlcXVpcmUoJ3BhdGgnKVxuaW1wb3J0IGF0b21BUEkgPSByZXF1aXJlKCdhdG9tJylcblxuZXhwb3J0IGludGVyZmFjZSBCcmVha0luZm8ge1xuICBmaWxlbmFtZTogc3RyaW5nXG4gIHJhbmdlOiBbW251bWJlciwgbnVtYmVyXSwgW251bWJlciwgbnVtYmVyXV1cbiAgaGlzdG9yeUxlbmd0aD86IG51bWJlclxuICBsb2NhbEJpbmRpbmdzOiBzdHJpbmdbXVxufVxuXG5leHBvcnQgaW50ZXJmYWNlIEV4Y2VwdGlvbkluZm8ge1xuICBoaXN0b3J5TGVuZ3RoOiBudW1iZXJcbiAgbG9jYWxCaW5kaW5nczogc3RyaW5nW11cbn1cblxuaW50ZXJmYWNlIENvbW1hbmQge1xuICB0ZXh0OiBzdHJpbmdcbiAgZW1pdENvbW1hbmRPdXRwdXQ6IGJvb2xlYW5cbiAgZnVsZmlsV2l0aFByb21wdDogYm9vbGVhblxuICBvbkZpbmlzaDogKG91dHB1dDogc3RyaW5nKSA9PiBhbnlcbn1cblxuZXhwb3J0IGNsYXNzIEdIQ0lEZWJ1ZyB7XG4gIHByaXZhdGUgc3RhdGljIHBhdXNlZE9uRXJyb3IgPSBTeW1ib2woJ1BhdXNlZCBvbiBFcnJvcicpXG4gIHByaXZhdGUgc3RhdGljIGZpbmlzaGVkRGVidWdnaW5nID0gU3ltYm9sKCdGaW5pc2hlZCBkZWJ1Z2dpbmcnKVxuXG4gIHByaXZhdGUgZW1pdHRlcjogYXRvbUFQSS5URW1pdHRlcjx7XG4gICAgJ3BhdXNlZC1vbi1leGNlcHRpb24nOiBFeGNlcHRpb25JbmZvIC8vLyBFbW1pdGVkIHdoZW4gdGhlIGRlYnVnZ2VyIGlzIGF0IGFuIGV4Y2VwdGlvblxuICAgICdyZWFkeSc6IEV4Y2VwdGlvbkluZm8gfCB1bmRlZmluZWQgLy8vIEVtbWl0ZWQgd2hlbiBnaGNpIGhhcyBqdXN0IHN0b3BwZWQgZXhlY3V0aW5nIGEgY29tbWFuZFxuICAgICdlcnJvcic6IHN0cmluZyAvLy8gRW1taXRlZCB3aGVuIHN0ZGVyciBoYXMgaW5wdXRcbiAgICAnZXJyb3ItY29tcGxldGVkJzogc3RyaW5nIC8vLyBFbW1pdGVkIHdoZW4gZ2hjaSByZXBvcnRzIGFuIGVycm9yIGZvciBhIGdpdmVuIGNvbW1hbmRcbiAgICAnbGluZS1jaGFuZ2VkJzogQnJlYWtJbmZvIC8vLyBFbW1pdGVkIHdoZW4gdGhlIGxpbmUgdGhhdCB0aGUgZGVidWdnZXIgaXMgb24gY2hhbmdlc1xuICAgICdkZWJ1Zy1maW5pc2hlZCc6IHVuZGVmaW5lZCAvLy8gRW1taXRlZCB3aGVuIHRoZSBkZWJ1Z2dlciBoYXMgcmVhY2hlZCB0aGUgZW5kIG9mIHRoZSBwcm9ncmFtXG4gICAgJ2NvbnNvbGUtb3V0cHV0Jzogc3RyaW5nIC8vLyBFbW1pdGVkIHdoZW4gdGhlIGdoY2kgaGFzIG91dHB1dGVkIHNvbWV0aGluZyB0byBzdGRvdXQsIGV4Y2x1ZGluZyB0aGUgZXh0cmEgcHJvbXB0XG4gICAgJ2NvbW1hbmQtaXNzdWVkJzogc3RyaW5nIC8vLyBFbW1pdGVkIHdoZW4gYSBjb21tYW5kIGhhcyBiZWVuIGV4ZWN1dGVkXG4gIH0+ID0gbmV3IGF0b21BUEkuRW1pdHRlcigpXG4gIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTogbWVtYmVyLW9yZGVyaW5nXG4gIHB1YmxpYyByZWFkb25seSBvbiA9IHRoaXMuZW1pdHRlci5vbi5iaW5kKHRoaXMuZW1pdHRlcilcblxuICBwcml2YXRlIGdoY2lDbWQ6IGNwLkNoaWxkUHJvY2Vzc1xuICBwcml2YXRlIHN0ZG91dDogc3RyZWFtLlJlYWRhYmxlXG4gIHByaXZhdGUgc3RkaW46IHN0cmVhbS5Xcml0YWJsZVxuICBwcml2YXRlIHN0ZGVycjogc3RyZWFtLlJlYWRhYmxlXG4gIHByaXZhdGUgc3RhcnRUZXh0OiBQcm9taXNlPHN0cmluZz5cbiAgcHJpdmF0ZSBpZ25vcmVFcnJvcnMgPSBmYWxzZVxuICBwcml2YXRlIGN1cnJlbnRTdGRlcnJPdXRwdXQgPSAnJ1xuICBwcml2YXRlIGN1cnJlbnRDb21tYW5kQnVmZmVyID0gJydcbiAgcHJpdmF0ZSBjb21tYW5kcyA9IFtdIGFzIENvbW1hbmRbXVxuICBwcml2YXRlIGN1cnJlbnRDb21tYW5kPzogQ29tbWFuZFxuICBwcml2YXRlIGNvbW1hbmRGaW5pc2hlZFN0cmluZyA9ICdjb21tYW5kX2ZpbmlzaF9vNHVCMXdoYWd0ZXFFOHhCcTlvcSdcbiAgcHJpdmF0ZSBtb2R1bGVOYW1lQnlQYXRoOiBNYXA8c3RyaW5nLCBzdHJpbmc+ID0gbmV3IE1hcCgpXG5cbiAgY29uc3RydWN0b3IoZ2hjaUNvbW1hbmQgPSAnZ2hjaScsIGdoY2lBcmdzOiBzdHJpbmdbXSA9IFtdLCBmb2xkZXI/OiBzdHJpbmcpIHtcblxuICAgIHRoaXMuZ2hjaUNtZCA9IGNwLnNwYXduKGdoY2lDb21tYW5kLCBnaGNpQXJncywgeyBjd2Q6IGZvbGRlciwgc2hlbGw6IHRydWUgfSlcblxuICAgIHRoaXMuZ2hjaUNtZC5vbignZXhpdCcsICgpID0+IHtcbiAgICAgIHRoaXMuZW1pdHRlci5lbWl0KCdkZWJ1Zy1maW5pc2hlZCcsIHVuZGVmaW5lZClcbiAgICB9KVxuXG4gICAgdGhpcy5zdGRvdXQgPSB0aGlzLmdoY2lDbWQuc3Rkb3V0XG4gICAgdGhpcy5zdGRpbiA9IHRoaXMuZ2hjaUNtZC5zdGRpblxuICAgIHRoaXMuc3RkZXJyID0gdGhpcy5naGNpQ21kLnN0ZGVyclxuICAgIHRoaXMuc3Rkb3V0Lm9uKCdyZWFkYWJsZScsICgpID0+IHRoaXMub25TdGRvdXRSZWFkYWJsZSgpKVxuICAgIHRoaXMuc3RkZXJyLm9uKCdyZWFkYWJsZScsICgpID0+IHRoaXMub25TdGRlcnJSZWFkYWJsZSgpKVxuXG4gICAgdGhpcy5hZGRSZWFkeUV2ZW50KClcblxuICAgIHRoaXMuc3RhcnRUZXh0ID0gdGhpcy5ydW4oYDpzZXQgcHJvbXB0IFwiJXM+ICR7dGhpcy5jb21tYW5kRmluaXNoZWRTdHJpbmd9XCJgLCBmYWxzZSwgZmFsc2UsIGZhbHNlLCB0cnVlKVxuICB9XG5cbiAgcHVibGljIGRlc3Ryb3koKSB7XG4gICAgdGhpcy5zdG9wKClcbiAgfVxuXG4gIHB1YmxpYyBhc3luYyBsb2FkTW9kdWxlKG5hbWU6IHN0cmluZykge1xuICAgIGNvbnN0IGN3ZCA9IHBhdGguZGlybmFtZShuYW1lKVxuXG4gICAgYXdhaXQgdGhpcy5ydW4oYDpjZCAke2N3ZH1gKVxuICAgIGF3YWl0IHRoaXMucnVuKGA6bG9hZCAke25hbWV9YClcbiAgfVxuXG4gIHB1YmxpYyBhc3luYyBzZXRFeGNlcHRpb25CcmVha0xldmVsKGxldmVsOiBFeGNlcHRpb25CcmVha0xldmVscykge1xuICAgIGF3YWl0IHRoaXMucnVuKCc6dW5zZXQgLWZicmVhay1vbi1leGNlcHRpb24nKVxuICAgIGF3YWl0IHRoaXMucnVuKCc6dW5zZXQgLWZicmVhay1vbi1lcnJvcicpXG5cbiAgICBzd2l0Y2ggKGxldmVsKSB7XG4gICAgICBjYXNlICdleGNlcHRpb25zJzpcbiAgICAgICAgYXdhaXQgdGhpcy5ydW4oJzpzZXQgLWZicmVhay1vbi1leGNlcHRpb24nKVxuICAgICAgICBicmVha1xuICAgICAgY2FzZSAnZXJyb3JzJzpcbiAgICAgICAgYXdhaXQgdGhpcy5ydW4oJzpzZXQgLWZicmVhay1vbi1lcnJvcicpXG4gICAgICAgIGJyZWFrXG4gICAgICBjYXNlICdub25lJzogLy8gbm8tb3BcbiAgICAgICAgYnJlYWtcbiAgICB9XG4gIH1cblxuICBwdWJsaWMgYXN5bmMgYWRkQnJlYWtwb2ludChicmVha3BvaW50OiBCcmVha3BvaW50IHwgc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHR5cGVvZiBicmVha3BvaW50ID09PSAnc3RyaW5nJykge1xuICAgICAgYXdhaXQgdGhpcy5ydW4oYDpicmVhayAke2JyZWFrcG9pbnR9YClcbiAgICB9IGVsc2Uge1xuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgbW9kdWxlTmFtZTogc3RyaW5nID0gYXdhaXQgdGhpcy5tb2R1bGVOYW1lRnJvbUZpbGVQYXRoKGJyZWFrcG9pbnQuZmlsZSlcbiAgICAgICAgYXdhaXQgdGhpcy5ydW4oYDpicmVhayAke21vZHVsZU5hbWV9ICR7YnJlYWtwb2ludC5saW5lfWApXG4gICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIC8vIHRzbGludDpkaXNhYmxlOm5vLXVuc2FmZS1hbnlcbiAgICAgICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZEVycm9yKGBGYWlsZWQgdG8gc2V0IGJyZWFrcG9pbnQgb24gJHticmVha3BvaW50LmZpbGV9YCwge1xuICAgICAgICAgIGRldGFpbDogZSxcbiAgICAgICAgICBzdGFjazogZS5zdGFjayxcbiAgICAgICAgICBkaXNtaXNzYWJsZTogdHJ1ZSxcbiAgICAgICAgfSlcbiAgICAgICAgLy8gdHNsaW50OmVuYWJsZTpuby11bnNhZmUtYW55XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqIHJlc29sdmVkIHRoZSBnaXZlbiBleHByZXNzaW9uIHVzaW5nIDpwcmludCwgcmV0dXJucyBudWxsIGlmIGl0IGlzIGludmFsaWRcbiAgKi9cbiAgcHVibGljIGFzeW5jIHJlc29sdmVFeHByZXNzaW9uKGV4cHJlc3Npb246IHN0cmluZykge1xuICAgIGlmICghZXhwcmVzc2lvbi50cmltKCkpIHtcbiAgICAgIHJldHVybiB1bmRlZmluZWRcbiAgICB9XG4gICAgLy8gZXhwcmVzc2lvbnMgY2FuJ3QgaGF2ZSBuZXcgbGluZXNcbiAgICBpZiAoZXhwcmVzc2lvbi5pbmRleE9mKCdcXG4nKSAhPT0gLTEpIHtcbiAgICAgIHJldHVybiB1bmRlZmluZWRcbiAgICB9XG5cbiAgICBjb25zdCBnZXRFeHByZXNzaW9uID0gKGdoY2lPdXRwdXQ6IHN0cmluZywgdmFyaWFibGU6IHN0cmluZykgPT4ge1xuICAgICAgY29uc3QgbWF0Y2hSZXN1bHQgPSBnaGNpT3V0cHV0Lm1hdGNoKC9bXiBdKiA9ICguKikvKVxuICAgICAgaWYgKCFtYXRjaFJlc3VsdCkgeyByZXR1cm4gdW5kZWZpbmVkIH1cbiAgICAgIHJldHVybiBtYXRjaFJlc3VsdFsxXVxuICAgIH1cblxuICAgIC8vIGZvciB0aGUgY29kZSBiZWxvdywgaWdub3JlIGVycm9yc1xuICAgIHRoaXMuaWdub3JlRXJyb3JzID0gdHJ1ZVxuXG4gICAgdHJ5IHtcbiAgICAgIC8vIHRyeSBwcmludGluZyBleHByZXNzaW9uXG4gICAgICBjb25zdCBwcmludGluZ1Jlc3VsdCA9IGdldEV4cHJlc3Npb24oXG4gICAgICAgIGF3YWl0IHRoaXMucnVuKGA6cHJpbnQgJHtleHByZXNzaW9ufWAsIGZhbHNlLCBmYWxzZSwgZmFsc2UpLCBleHByZXNzaW9uKVxuICAgICAgaWYgKHByaW50aW5nUmVzdWx0ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuIHByaW50aW5nUmVzdWx0XG4gICAgICB9XG5cbiAgICAgIC8vIGlmIHRoYXQgZmFpbHMgYXNzaWduIGl0IHRvIGEgdGVtcG9yYXJ5IHZhcmlhYmxlIGFuZCBldmFsdWF0ZSB0aGF0XG4gICAgICBsZXQgdGVtcFZhck51bSA9IDBcbiAgICAgIGxldCBwb3RlbnRpYWxUZW1wVmFyOiBzdHJpbmcgfCB1bmRlZmluZWRcbiAgICAgIGRvIHtcbiAgICAgICAgcG90ZW50aWFsVGVtcFZhciA9IGdldEV4cHJlc3Npb24oXG4gICAgICAgICAgYXdhaXQgdGhpcy5ydW4oYDpwcmludCB0ZW1wJHt0ZW1wVmFyTnVtfWAsIGZhbHNlLCBmYWxzZSwgZmFsc2UpLCBgdGVtcCR7dGVtcFZhck51bX1gKVxuICAgICAgICB0ZW1wVmFyTnVtICs9IDFcbiAgICAgIH0gd2hpbGUgKHBvdGVudGlhbFRlbXBWYXIgIT09IHVuZGVmaW5lZClcblxuICAgICAgYXdhaXQgdGhpcy5ydW4oYGxldCB0ZW1wJHt0ZW1wVmFyTnVtfSA9ICR7ZXhwcmVzc2lvbn1gLCBmYWxzZSwgZmFsc2UsIGZhbHNlKVxuICAgICAgcmV0dXJuIGdldEV4cHJlc3Npb24oYXdhaXQgdGhpcy5ydW4oYDpwcmludCB0ZW1wJHt0ZW1wVmFyTnVtfWAsIGZhbHNlLCBmYWxzZSwgZmFsc2UpLCBgdGVtcCR7dGVtcFZhck51bX1gKVxuICAgIH0gZmluYWxseSB7XG4gICAgICB0aGlzLmlnbm9yZUVycm9ycyA9IGZhbHNlXG4gICAgfVxuICB9XG5cbiAgcHVibGljIGFzeW5jIGZvcndhcmQoKSB7XG4gICAgcmV0dXJuIHRoaXMucnVuKCc6Zm9yd2FyZCcsIHRydWUpXG4gIH1cblxuICBwdWJsaWMgYXN5bmMgYmFjaygpIHtcbiAgICByZXR1cm4gdGhpcy5ydW4oJzpiYWNrJywgdHJ1ZSlcbiAgfVxuXG4gIHB1YmxpYyBhc3luYyBzdGVwKCkge1xuICAgIHJldHVybiB0aGlzLnJ1bignOnN0ZXAnLCB0cnVlLCB0cnVlKVxuICB9XG5cbiAgcHVibGljIHN0b3AoKSB7XG4gICAgc2V0VGltZW91dChcbiAgICAgICgpID0+IHRoaXMuZ2hjaUNtZC5raWxsKCksXG4gICAgICAzMDAwKVxuICAgIHRoaXMucnVuKCc6cXVpdCcpXG4gICAgLmNhdGNoKChlOiBFcnJvcikgPT4ge1xuICAgICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZEVycm9yKCdFcnJvciB3aGlsZSBzdG9wcGluZyBHSENJJywge1xuICAgICAgICBkZXRhaWw6IGUsXG4gICAgICAgIHN0YWNrOiBlLnN0YWNrLFxuICAgICAgICBkaXNtaXNzYWJsZTogdHJ1ZSxcbiAgICAgIH0pXG4gICAgfSlcbiAgfVxuXG4gIHB1YmxpYyBhc3luYyBjb250aW51ZSgpIHtcbiAgICByZXR1cm4gdGhpcy5ydW4oJzpjb250aW51ZScsIHRydWUpXG4gIH1cblxuICBwdWJsaWMgYXN5bmMgYWRkZWRBbGxMaXN0ZW5lcnMoKSB7XG4gICAgcmV0dXJuIHRoaXMuc3RhcnRUZXh0LnRoZW4oKHRleHQpID0+IHtcbiAgICAgIGNvbnN0IGZpcnN0UHJvbXB0ID0gdGV4dC5pbmRleE9mKCc+ICcpXG4gICAgICB0aGlzLmVtaXR0ZXIuZW1pdCgnY29uc29sZS1vdXRwdXQnLCB0ZXh0LnNsaWNlKDAsIGZpcnN0UHJvbXB0ICsgMikpXG4gICAgfSlcbiAgfVxuXG4gIHB1YmxpYyBhc3luYyBzdGFydERlYnVnKG1vZHVsZU5hbWU/OiBzdHJpbmcpIHtcbiAgICBtb2R1bGVOYW1lID0gbW9kdWxlTmFtZSB8fCAnbWFpbidcbiAgICByZXR1cm4gdGhpcy5ydW4oJzp0cmFjZSAnICsgbW9kdWxlTmFtZSwgdHJ1ZSwgdHJ1ZSlcbiAgfVxuXG4gIHB1YmxpYyBhc3luYyBydW4oXG4gICAgY29tbWFuZFRleHQ6IHN0cmluZyxcbiAgICBlbWl0U3RhdHVzQ2hhbmdlczogYm9vbGVhbiA9IGZhbHNlLFxuICAgIGVtaXRIaXN0b3J5TGVuZ3RoOiBib29sZWFuID0gZmFsc2UsXG4gICAgZW1pdENvbW1hbmRPdXRwdXQ6IGJvb2xlYW4gPSB0cnVlLFxuICAgIGZ1bGZpbFdpdGhQcm9tcHQ6IGJvb2xlYW4gPSBmYWxzZSxcbiAgKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCBzaGlmdEFuZFJ1bkNvbW1hbmQgPSAoKSA9PiB7XG4gICAgICBjb25zdCBjb21tYW5kID0gdGhpcy5jb21tYW5kcy5zaGlmdCgpXG5cbiAgICAgIHRoaXMuY3VycmVudENvbW1hbmQgPSBjb21tYW5kXG5cbiAgICAgIGlmIChjb21tYW5kKSB7XG4gICAgICAgIGlmIChjb21tYW5kLmVtaXRDb21tYW5kT3V0cHV0KSB7XG4gICAgICAgICAgdGhpcy5lbWl0dGVyLmVtaXQoJ2NvbW1hbmQtaXNzdWVkJywgY29tbWFuZC50ZXh0KVxuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5zdGRpbi53cml0ZShjb21tYW5kLnRleHQgKyBvcy5FT0wpXG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uc3QgcCA9IG5ldyBQcm9taXNlPHN0cmluZz4oKGZ1bGZpbCkgPT4ge1xuICAgICAgY29uc3QgY29tbWFuZDogQ29tbWFuZCA9IHtcbiAgICAgICAgdGV4dDogY29tbWFuZFRleHQsXG4gICAgICAgIGVtaXRDb21tYW5kT3V0cHV0LFxuICAgICAgICBmdWxmaWxXaXRoUHJvbXB0LFxuICAgICAgICBvbkZpbmlzaDogYXN5bmMgKG91dHB1dCkgPT4ge1xuICAgICAgICAgIHRoaXMuY3VycmVudENvbW1hbmQgPSB1bmRlZmluZWRcblxuICAgICAgICAgIGZ1bmN0aW9uIF9mdWxmaWwobm9Qcm9tcHQ6IHN0cmluZykge1xuICAgICAgICAgICAgaWYgKGZ1bGZpbFdpdGhQcm9tcHQpIHtcbiAgICAgICAgICAgICAgZnVsZmlsKG91dHB1dClcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGZ1bGZpbChub1Byb21wdClcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG5cbiAgICAgICAgICBjb25zdCBsYXN0RW5kT2ZMaW5lUG9zID0gb3V0cHV0Lmxhc3RJbmRleE9mKG9zLkVPTClcblxuICAgICAgICAgIGlmIChsYXN0RW5kT2ZMaW5lUG9zID09PSAtMSkge1xuICAgICAgICAgICAgLyppLmUuIG5vIG91dHB1dCBoYXMgYmVlbiBwcm9kdWNlZCovXG4gICAgICAgICAgICBpZiAoZW1pdFN0YXR1c0NoYW5nZXMpIHtcbiAgICAgICAgICAgICAgYXdhaXQgdGhpcy5lbWl0U3RhdHVzQ2hhbmdlcyhvdXRwdXQsICcnLCBlbWl0SGlzdG9yeUxlbmd0aClcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIF9mdWxmaWwoJycpXG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0IHByb21wdEJlZ2luUG9zaXRpb24gPSBsYXN0RW5kT2ZMaW5lUG9zICsgb3MuRU9MLmxlbmd0aFxuXG4gICAgICAgICAgICBpZiAoZW1pdFN0YXR1c0NoYW5nZXMpIHtcbiAgICAgICAgICAgICAgYXdhaXQgdGhpcy5lbWl0U3RhdHVzQ2hhbmdlcyhcbiAgICAgICAgICAgICAgICBvdXRwdXQuc2xpY2UocHJvbXB0QmVnaW5Qb3NpdGlvbiwgb3V0cHV0Lmxlbmd0aCksXG4gICAgICAgICAgICAgICAgb3V0cHV0LnNsaWNlKDAsIGxhc3RFbmRPZkxpbmVQb3MpLFxuICAgICAgICAgICAgICAgIGVtaXRIaXN0b3J5TGVuZ3RoLFxuICAgICAgICAgICAgICApXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBfZnVsZmlsKG91dHB1dC5zbGljZSgwLCBsYXN0RW5kT2ZMaW5lUG9zKSlcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICB9XG5cbiAgICAgIHRoaXMuY29tbWFuZHMucHVzaChjb21tYW5kKVxuXG4gICAgICBpZiAodGhpcy5jdXJyZW50Q29tbWFuZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHNoaWZ0QW5kUnVuQ29tbWFuZCgpXG4gICAgICB9XG4gICAgfSlcbiAgICBwLnRoZW4gKCgpID0+IHtcbiAgICAgIGlmICh0aGlzLmNvbW1hbmRzLmxlbmd0aCAhPT0gMCkge1xuICAgICAgICBzaGlmdEFuZFJ1bkNvbW1hbmQoKVxuICAgICAgfVxuICAgIH0pLmNhdGNoKChlOiBFcnJvcikgPT4ge1xuICAgICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZEVycm9yKCdBbiBlcnJvciBoYXBwZW5lZCcsIHtcbiAgICAgICAgZGV0YWlsOiBlLFxuICAgICAgICBzdGFjazogZS5zdGFjayxcbiAgICAgICAgZGlzbWlzc2FibGU6IHRydWUsXG4gICAgICB9KVxuICAgIH0pXG4gICAgcmV0dXJuIHBcbiAgfVxuXG4gIHByaXZhdGUgYWRkUmVhZHlFdmVudCgpIHtcbiAgICBjb25zdCBldmVudFN1YnMgPSBbXG4gICAgICAncGF1c2VkLW9uLWV4Y2VwdGlvbicsXG4gICAgICAnbGluZS1jaGFuZ2VkJyxcbiAgICAgICdkZWJ1Zy1maW5pc2hlZCcsXG4gICAgXVxuXG4gICAgZm9yIChjb25zdCBldmVudE5hbWUgb2YgZXZlbnRTdWJzKSB7XG4gICAgICAodGhpcy5lbWl0dGVyLm9uIGFzIGFueSkoZXZlbnROYW1lLCAoKSA9PiB0aGlzLmVtaXR0ZXIuZW1pdCgncmVhZHknLCB1bmRlZmluZWQpKVxuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgZ2V0QmluZGluZ3MoKSB7XG4gICAgY29uc3Qgb3V0cHV0U3RyID0gYXdhaXQgdGhpcy5ydW4oJzpzaG93IGJpbmRpbmdzJywgZmFsc2UsIGZhbHNlLCBmYWxzZSlcbiAgICByZXR1cm4gb3V0cHV0U3RyLnNwbGl0KG9zLkVPTClcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgZ2V0SGlzdG9yeUxlbmd0aCgpIHtcbiAgICBjb25zdCBoaXN0b3J5UXVlcnkgPSBhd2FpdCB0aGlzLnJ1bignOmhpc3RvcnkgMTAwJywgZmFsc2UsIGZhbHNlLCBmYWxzZSlcbiAgICBjb25zdCByZWdleCA9IC8tKFxcZCopLiooPzpcXG58XFxyfFxcclxcbik8ZW5kIG9mIGhpc3Rvcnk+JC9cblxuICAgIGNvbnN0IG1hdGNoUmVzdWx0ID0gaGlzdG9yeVF1ZXJ5Lm1hdGNoKHJlZ2V4KVxuICAgIGlmICghbWF0Y2hSZXN1bHQpIHtcbiAgICAgIGlmIChoaXN0b3J5UXVlcnkuc2xpY2UoLTMpID09PSAnLi4uJykge1xuICAgICAgICByZXR1cm4gSW5maW5pdHkgLy8gaGlzdG9yeSBpcyB2ZXJ5IGxvbmdcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiAwXG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBwYXJzZUludChtYXRjaFJlc3VsdFsxXSwgMTApXG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBwYXJzZVByb21wdChzdGRPdXRwdXQ6IHN0cmluZyk6IEJyZWFrSW5mbyB8IFN5bWJvbCB7XG4gICAgY29uc3QgcGF0dGVybnMgPSBbe1xuICAgICAgcGF0dGVybjogL1xcWyg/OlstXFxkXSo6ICk/KC4qKTpcXCgoXFxkKyksKFxcZCspXFwpLVxcKChcXGQrKSwoXFxkKylcXCkuKlxcXS4qPiAkLyxcbiAgICAgIGZ1bmM6IChtYXRjaCkgPT4gKHtcbiAgICAgICAgZmlsZW5hbWU6IG1hdGNoWzFdLFxuICAgICAgICByYW5nZTogW1twYXJzZUludChtYXRjaFsyXSwgMTApIC0gMSwgcGFyc2VJbnQobWF0Y2hbM10sIDEwKSAtIDFdLFxuICAgICAgICBbcGFyc2VJbnQobWF0Y2hbNF0sIDEwKSwgcGFyc2VJbnQobWF0Y2hbNV0sIDEwKV1dLFxuICAgICAgfSksXG4gICAgfSwge1xuICAgICAgcGF0dGVybjogL1xcWyg/OlstXFxkXSo6ICk/KC4qKTooXFxkKik6KFxcZCopLShcXGQqKVxcXS4qPiAkLyxcbiAgICAgIGZ1bmM6IChtYXRjaCkgPT4gKHtcbiAgICAgICAgZmlsZW5hbWU6IG1hdGNoWzFdLFxuICAgICAgICByYW5nZTogW1twYXJzZUludChtYXRjaFsyXSwgMTApIC0gMSwgcGFyc2VJbnQobWF0Y2hbM10sIDEwKSAtIDFdLFxuICAgICAgICBbcGFyc2VJbnQobWF0Y2hbMl0sIDEwKSAtIDEsIHBhcnNlSW50KG1hdGNoWzRdLCAxMCldXSxcbiAgICAgIH0pLFxuICAgIH0sIHtcbiAgICAgIHBhdHRlcm46IC9cXFs8ZXhjZXB0aW9uIHRocm93bj5cXF0uKj4gJC8sXG4gICAgICBmdW5jOiAoKSA9PiBHSENJRGVidWcucGF1c2VkT25FcnJvcixcbiAgICB9LCB7XG4gICAgICBwYXR0ZXJuOiAvLio+ICQvLFxuICAgICAgZnVuYzogKCkgPT4gR0hDSURlYnVnLmZpbmlzaGVkRGVidWdnaW5nLFxuICAgIH1dIGFzIEFycmF5PHsgcGF0dGVybjogUmVnRXhwOyBmdW5jOiAobWF0Y2g6IHN0cmluZ1tdKSA9PiBCcmVha0luZm8gfCBTeW1ib2wgfT5cbiAgICBmb3IgKGNvbnN0IHBhdHRlcm4gb2YgcGF0dGVybnMpIHtcbiAgICAgIGNvbnN0IG1hdGNoUmVzdWx0ID0gc3RkT3V0cHV0Lm1hdGNoKHBhdHRlcm4ucGF0dGVybilcbiAgICAgIGlmIChtYXRjaFJlc3VsdCkge1xuICAgICAgICByZXR1cm4gcGF0dGVybi5mdW5jKG1hdGNoUmVzdWx0KVxuICAgICAgfVxuICAgIH1cbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0Nhbm5vdCByZWFkIHByb21wdDogXFxuJyArIHN0ZE91dHB1dClcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgZW1pdFN0YXR1c0NoYW5nZXMocHJvbXB0OiBzdHJpbmcsIG1haW5Cb2R5OiBzdHJpbmcsIGVtaXRIaXN0b3J5TGVuZ3RoOiBib29sZWFuKSB7XG4gICAgY29uc3QgcmVzdWx0ID0gdGhpcy5wYXJzZVByb21wdChwcm9tcHQpXG5cbiAgICBpZiAocmVzdWx0ID09PSBHSENJRGVidWcucGF1c2VkT25FcnJvcikge1xuICAgICAgY29uc3QgaGlzdG9yeUxlbmd0aCA9IGF3YWl0IHRoaXMuZ2V0SGlzdG9yeUxlbmd0aCgpXG5cbiAgICAgIHRoaXMuZW1pdHRlci5lbWl0KCdwYXVzZWQtb24tZXhjZXB0aW9uJywge1xuICAgICAgICBoaXN0b3J5TGVuZ3RoLFxuICAgICAgICBsb2NhbEJpbmRpbmdzOiBtYWluQm9keS5zcGxpdCgnXFxuJykuc2xpY2UoMSksXG4gICAgICB9KVxuICAgIH0gZWxzZSBpZiAocmVzdWx0ID09PSBHSENJRGVidWcuZmluaXNoZWREZWJ1Z2dpbmcpIHtcbiAgICAgIHRoaXMuZW1pdHRlci5lbWl0KCdkZWJ1Zy1maW5pc2hlZCcsIHVuZGVmaW5lZClcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgYnJlYWtJbmZvID0gcmVzdWx0IGFzIEJyZWFrSW5mb1xuXG4gICAgICBicmVha0luZm8ubG9jYWxCaW5kaW5ncyA9IGF3YWl0IHRoaXMuZ2V0QmluZGluZ3MoKVxuXG4gICAgICBpZiAoZW1pdEhpc3RvcnlMZW5ndGgpIHtcbiAgICAgICAgYnJlYWtJbmZvLmhpc3RvcnlMZW5ndGggPSBhd2FpdCB0aGlzLmdldEhpc3RvcnlMZW5ndGgoKVxuICAgICAgfVxuXG4gICAgICB0aGlzLmVtaXR0ZXIuZW1pdCgnbGluZS1jaGFuZ2VkJywgYnJlYWtJbmZvKVxuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgb25TdGRlcnJSZWFkYWJsZSgpIHtcbiAgICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6bm8tdW5zYWZlLWFueVxuICAgIGNvbnN0IHN0ZGVyck91dHB1dDogQnVmZmVyID0gdGhpcy5zdGRlcnIucmVhZCgpXG4gICAgaWYgKCFzdGRlcnJPdXRwdXQgfHwgdGhpcy5pZ25vcmVFcnJvcnMpIHtcbiAgICAgIHJldHVybiAvLyB0aGlzIGlzIHRoZSBlbmQgb2YgdGhlIGlucHV0IHN0cmVhbVxuICAgIH1cblxuICAgIHRoaXMuZW1pdHRlci5lbWl0KCdlcnJvcicsIHN0ZGVyck91dHB1dC50b1N0cmluZygpKVxuXG4gICAgaWYgKHRoaXMuY3VycmVudFN0ZGVyck91dHB1dCA9PT0gJycpIHtcbiAgICAgIGNvbnN0IGRpc3AgPSB0aGlzLmVtaXR0ZXIub24oJ3JlYWR5JywgKCkgPT4ge1xuICAgICAgICB0aGlzLmVtaXR0ZXIuZW1pdCgnZXJyb3ItY29tcGxldGVkJywgdGhpcy5jdXJyZW50U3RkZXJyT3V0cHV0KVxuICAgICAgICB0aGlzLmN1cnJlbnRTdGRlcnJPdXRwdXQgPSAnJ1xuICAgICAgICBkaXNwLmRpc3Bvc2UoKVxuICAgICAgfSlcbiAgICB9XG5cbiAgICB0aGlzLmN1cnJlbnRTdGRlcnJPdXRwdXQgKz0gc3RkZXJyT3V0cHV0LnRvU3RyaW5nKClcbiAgfVxuXG4gIHByaXZhdGUgb25TdGRvdXRSZWFkYWJsZSgpIHtcbiAgICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6bm8tdW5zYWZlLWFueVxuICAgIGNvbnN0IGN1cnJlbnRTdHJpbmcgPSAodGhpcy5zdGRvdXQucmVhZCgpIHx8ICcnKS50b1N0cmluZygpXG5cbiAgICB0aGlzLmN1cnJlbnRDb21tYW5kQnVmZmVyICs9IGN1cnJlbnRTdHJpbmdcblxuICAgIGNvbnN0IGZpbmlzaFN0cmluZ1Bvc2l0aW9uID0gdGhpcy5jdXJyZW50Q29tbWFuZEJ1ZmZlci5zZWFyY2godGhpcy5jb21tYW5kRmluaXNoZWRTdHJpbmcpXG4gICAgaWYgKGZpbmlzaFN0cmluZ1Bvc2l0aW9uICE9PSAtMSkge1xuICAgICAgY29uc3Qgb3V0cHV0U3RyaW5nID0gdGhpcy5jdXJyZW50Q29tbWFuZEJ1ZmZlci5zbGljZSgwLCBmaW5pc2hTdHJpbmdQb3NpdGlvbilcblxuICAgICAgaWYgKHRoaXMuY3VycmVudENvbW1hbmQpIHtcbiAgICAgICAgaWYgKHRoaXMuY3VycmVudENvbW1hbmQuZW1pdENvbW1hbmRPdXRwdXQpIHtcbiAgICAgICAgICB0aGlzLmVtaXR0ZXIuZW1pdCgnY29uc29sZS1vdXRwdXQnLCBvdXRwdXRTdHJpbmcpXG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmN1cnJlbnRDb21tYW5kLm9uRmluaXNoKG91dHB1dFN0cmluZylcbiAgICAgIH1cblxuICAgICAgLy8gVGFrZSB0aGUgZmluaXNoZWQgc3RyaW5nIG9mZiB0aGUgYnVmZmVyIGFuZCBwcm9jZXNzIHRoZSBuZXh0IG91cHV0XG4gICAgICB0aGlzLmN1cnJlbnRDb21tYW5kQnVmZmVyID0gdGhpcy5jdXJyZW50Q29tbWFuZEJ1ZmZlci5zbGljZShcbiAgICAgICAgZmluaXNoU3RyaW5nUG9zaXRpb24gKyB0aGlzLmNvbW1hbmRGaW5pc2hlZFN0cmluZy5sZW5ndGgpXG4gICAgICB0aGlzLm9uU3Rkb3V0UmVhZGFibGUoKVxuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgbW9kdWxlTmFtZUZyb21GaWxlUGF0aChmaWxlUGF0aDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCBjYWNoZWRNb2R1bGVOYW1lID0gdGhpcy5tb2R1bGVOYW1lQnlQYXRoLmdldChmaWxlUGF0aClcbiAgICBpZiAoY2FjaGVkTW9kdWxlTmFtZSkgcmV0dXJuIGNhY2hlZE1vZHVsZU5hbWVcbiAgICBjb25zdCBtb2R1bGVzID0gKGF3YWl0IHRoaXMucnVuKCc6c2hvdyBtb2R1bGVzJykpLnNwbGl0KG9zLkVPTClcbiAgICBjb25zdCByZWdleCA9IC9eKFteIF0rKSArXFwoICsoLispLCArXFx3KyArXFwpJC9cbiAgICBmb3IgKGNvbnN0IG1vZHVsZVN0ciBvZiBtb2R1bGVzKSB7XG4gICAgICBjb25zdCBtYXRjaFJlc3VsdCA9IHJlZ2V4LmV4ZWMobW9kdWxlU3RyKVxuICAgICAgaWYgKG1hdGNoUmVzdWx0KSB7XG4gICAgICAgIHRoaXMubW9kdWxlTmFtZUJ5UGF0aC5zZXQobWF0Y2hSZXN1bHRbMl0sIG1hdGNoUmVzdWx0WzFdKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihgVW5leHBlY3RlZCByZXBseSBmcm9tIEdIQ0kgJzpzaG93IG1vZHVsZXMnOiAke21vZHVsZVN0cn1gKVxuICAgICAgfVxuICAgIH1cbiAgICBjb25zdCBuZXdDYWNoZWRNb2R1bGVOYW1lID0gdGhpcy5tb2R1bGVOYW1lQnlQYXRoLmdldChmaWxlUGF0aClcbiAgICBpZiAobmV3Q2FjaGVkTW9kdWxlTmFtZSkge1xuICAgICAgcmV0dXJuIG5ld0NhY2hlZE1vZHVsZU5hbWVcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBDb3VsZG4ndCBmaW5kIG1vZHVsZSBuYW1lIGZvciAke2ZpbGVQYXRofWApXG4gICAgfVxuICB9XG59XG4iXX0=