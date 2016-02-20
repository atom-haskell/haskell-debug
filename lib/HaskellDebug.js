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
function getPenultimateLine(str) {
    var lines = str.split("\n");
    return lines[lines.length - 1];
}
var HaskellDebug;
(function (HaskellDebug_1) {
    class HaskellDebug {
        constructor(filename) {
            this.emitter = new atomAPI.Emitter();
            this.ghci_cmd = cp.spawn("ghci", [filename]);
            this.stdout = this.ghci_cmd.stdout;
            this.stdin = this.ghci_cmd.stdin;
        }
        pauseOnException() {
            this.out(":set -fbreak-on-exception");
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
            var multiLine = /\[(?:[-\d]*:)?(.*):\((\d+),\d+\)-\(\d+,\d+\).*\]/;
            var mutliLineMatch = stdOutput.match(stdOutput);
            var singleLine = /\[(?:[-\d]*:)?(.*):\d*:\d*-\d*\]/;
            var singleLineMatch = stdOutput.match(stdOutput);
            var errorPattern = /\[<exception thrown>\]/;
            var errorMatch = stdOutput.match(errorPattern);
            if (mutliLineMatch != null) {
                return {
                    filename: mutliLineMatch[0],
                    range: new atomAPI.Range([multiLine[1], multiLine[2]], [multiLine[3], multiLine[4]])
                };
            }
            else if (singleLineMatch != null) {
                return {
                    filename: mutliLineMatch[0],
                    range: new atomAPI.Range([multiLine[1], multiLine[2]], [multiLine[1], multiLine[3]])
                };
            }
            else if (errorMatch != null) {
                return HaskellDebug.pausedOnError;
            }
            else {
                return HaskellDebug.finishedDebugging;
            }
        }
        observeInput() {
            this.stdout.cork();
            var listenerFunc = (data) => {
                var input = this.readPrompt(data);
                if (input == HaskellDebug.pausedOnError) {
                    observer.removeListener("data", listenerFunc);
                    this.out("print _exception");
                    observer.once("data", (data) => {
                        var errorMes = getPenultimateLine(data);
                        this.emitter.emit("paused-on-exception", errorMes);
                        observer.addListener("data", listenerFunc);
                        this.out(":back");
                    });
                }
                else if (input == HaskellDebug.finishedDebugging) {
                    this.emitter.emit("debug-finished", undefined);
                }
                else {
                    this.emitter.emit("line-changed", input);
                }
            };
            var observer = this.stdout.once("data", listenerFunc);
        }
        startDebug(pauseOnException) {
            return __awaiter(this, void 0, void 0, function* () {
                yield this.in();
                this.out(":trace main");
                if (pauseOnException)
                    this.pauseOnException();
                this.observeInput();
                this.out("print _exception");
                var errorMes = getPenultimateLine(yield this.in());
                this.out(":back");
                console.log("Broken on error: '" + errorMes + "'");
            });
        }
        in() {
            return new Promise((fulfil) => {
                this.stdout.once("data", (data) => fulfil(data.toString()));
            });
        }
        out(str) {
            this.stdin.write(str);
        }
    }
    HaskellDebug.pausedOnError = Symbol("Paused on Error");
    HaskellDebug.finishedDebugging = Symbol("Finished debugging");
})(HaskellDebug || (HaskellDebug = {}));
module.exports = HaskellDebug;
