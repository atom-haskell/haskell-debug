"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
const _GHCIDebug = require("./GHCIDebug");
const DebugView = require("./views/DebugView");
const CurrentVariablesView = require("./views/CurrentVariablesView");
const HistoryState = require("./HistoryState");
const LineHighlighter = require("./LineHighlighter");
var GHCIDebug = _GHCIDebug.GHCIDebug;
class Debugger {
    constructor(breakpoints) {
        this.lineHighlighter = new LineHighlighter();
        this.ghciDebug = new GHCIDebug();
        this.debugView = new DebugView();
        this.historyState = new HistoryState(this.debugView.buttons);
        this.currentVariablesView = new CurrentVariablesView();
        this.launchGHCIDebug(breakpoints);
        this.displayGUI();
    }
    destory() {
        this.lineHighlighter.destroy();
        if (this.ghciDebug)
            this.ghciDebug.stop();
        this.debugView.destroy();
        this.debugPanel.destroy();
        this.currentVariablesPanel.destroy();
        this.currentVariablesView.destroy();
    }
    displayGUI() {
        this.debugView = new DebugView();
        this.debugPanel = atom.workspace.addTopPanel({
            item: this.debugView.element
        });
        this.debugView.emitter.on("step", () => this.step());
        this.debugView.emitter.on("back", () => this.back());
        this.debugView.emitter.on("forward", () => this.forward());
        this.debugView.emitter.on("continue", () => this.continue());
        this.debugView.emitter.on("stop", () => this.stop());
        this.currentVariablesView = new CurrentVariablesView();
        this.currentVariablesPanel = atom.workspace.addTopPanel({
            item: this.currentVariablesView.element
        });
    }
    launchGHCIDebug(breakpoints) {
        this.ghciDebug.emitter.on("line-changed", (info) => {
            this.lineHighlighter.hightlightLine(info);
            if (info.historyLength !== undefined) {
                this.historyState.setMaxPosition(info.historyLength);
            }
            this.currentVariablesView.updateList(info.localBindings);
        });
        this.ghciDebug.emitter.on("paused-on-exception", (errorMes) => {
            console.log("Error: " + errorMes);
        });
        this.ghciDebug.emitter.on("debug-finished", () => {
            this.ghciDebug = null;
            this.destory();
        });
        var fileToDebug = atom.workspace.getActiveTextEditor().getPath();
        this.ghciDebug.loadModule(fileToDebug);
        breakpoints.forEach(ob => {
            if (ob.file == fileToDebug)
                this.ghciDebug.addBreakpoint(ob.line.toString());
            else
                this.ghciDebug.addBreakpoint(ob);
        });
        if (true) {
            this.ghciDebug.pauseOnException();
        }
        this.ghciDebug.startDebug();
    }
    resolveExpression(expression) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.ghciDebug.resolveExpression(expression);
        });
    }
    back() {
        if (this.historyState.setCurrentPosition(this.historyState.getCurrentPosition() + 1))
            this.ghciDebug.back();
    }
    forward() {
        if (this.historyState.setCurrentPosition(this.historyState.getCurrentPosition() - 1))
            this.ghciDebug.forward();
    }
    continue() {
        this.ghciDebug.continue();
    }
    step() {
        this.ghciDebug.step();
    }
    stop() {
        this.ghciDebug.stop();
    }
}
module.exports = Debugger;
