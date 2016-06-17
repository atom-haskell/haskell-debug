"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
const cp = require("child_process");
const atomAPI = require("atom");
var HaskellDebug;
(function (HaskellDebug_1) {
    function getPenultimateLine(str) {
        var lines = str.split("\n");
        return lines[lines.length - 1];
    }
    class HaskellDebug {
        constructor() {
            this.breakpoints = [];
            this.isRunning = false;
            this.emitter = new atomAPI.Emitter();
            this.ghci_cmd = cp.spawn("ghci");
            this.stdout = this.ghci_cmd.stdout;
            this.stdin = this.ghci_cmd.stdin;
            this.stdout.on("message", (...args) => {
                console.log(args);
            });
        }
        loadModule(name) {
            return __awaiter(this, void 0, void 0, function* () {
                yield this.out(`:load ${name}`);
            });
        }
        pauseOnException() {
            return __awaiter(this, void 0, void 0, function* () {
                yield this.out(":set -fbreak-on-exception");
            });
        }
        addBreakpoint(breakpoint) {
            return __awaiter(this, void 0, void 0, function* () {
                yield this.out(`:break ${breakpoint.module} ${breakpoint.line}`);
            });
        }
        getBindings() {
            return __awaiter(this, void 0, void 0, function* () {
                this.out(":show bindings");
                var outputStr = yield this.in();
                var lines = outputStr.split("\n");
                return lines.slice(0, lines.length - 2);
            });
        }
        readPrompt(stdOutput) {
            var breakInfoOb;
            var patterns = [{
                    pattern: /\[(?:[-\d]*: )?(.*):\((\d+),(\d+)\)-\((\d+),(\d+)\).*\].*> $/,
                    func: match => ({
                        filename: match[1],
                        range: new atomAPI.Range([parseInt(match[2]) - 1, parseInt(match[3]) - 1], [parseInt(match[4]), parseInt(match[5])])
                    })
                }, {
                    pattern: /\[(?:[-\d]*: )?(.*):(\d*):(\d*)-(\d*)\].*> $/,
                    func: match => ({
                        filename: match[1],
                        range: new atomAPI.Range([parseInt(match[2]) - 1, parseInt(match[3]) - 1], [parseInt(match[2]), parseInt(match[4])])
                    })
                }, {
                    pattern: /\[<exception thrown>\].*> $/,
                    func: () => HaskellDebug.pausedOnError
                }, {
                    pattern: /.*> $/,
                    func: () => HaskellDebug.finishedDebugging
                }];
            for (var pattern of patterns) {
                var matchResult = stdOutput.match(pattern.pattern);
                if (matchResult != null) {
                    return pattern.func(matchResult);
                }
            }
            return HaskellDebug.notFinal;
        }
        forward() {
            this.observeInput();
            this.out(":forward");
        }
        back() {
            this.observeInput();
            this.out(":back");
        }
        observeInput() {
            return __awaiter(this, void 0, void 0, function* () {
                this.stdout.cork();
                var str = yield this.in();
                var input = this.readPrompt(str.toString());
                if (input == HaskellDebug.pausedOnError) {
                    this.stdout.cork();
                    this.stdout.pause();
                    this.out("print _exception");
                    this.stdout.once("data", (newData) => {
                        this.observeInput();
                        this.out(":back");
                    });
                    this.stdout.unpause();
                }
                else if (input == HaskellDebug.finishedDebugging) {
                    this.emitter.emit("debug-finished", undefined);
                }
                else if (input == HaskellDebug.notFinal) {
                    this.observeInput();
                }
                else {
                    this.emitter.emit("line-changed", input);
                }
            });
        }
        startDebug(pauseOnException) {
            return __awaiter(this, void 0, void 0, function* () {
                yield this.in();
                this.out(":trace main");
                this.observeInput();
            });
        }
        in() {
            return new Promise((fulfil) => {
                this.stdout.once("data", (data) => fulfil(data.toString()));
            });
        }
        out(str) {
            this.stdin.write(str + "\n");
        }
    }
    HaskellDebug.pausedOnError = Symbol("Paused on Error");
    HaskellDebug.finishedDebugging = Symbol("Finished debugging");
    HaskellDebug.notFinal = Symbol("Not final");
    HaskellDebug_1.HaskellDebug = HaskellDebug;
})(HaskellDebug || (HaskellDebug = {}));
module.exports = HaskellDebug;
