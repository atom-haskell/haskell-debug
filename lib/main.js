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
const BreakpointUI = require("./BreakpointUI");
const LineHighlighter = require("./LineHighlighter");
const TooltipManager = require("./TooltipManager");
var GHCIDebug = _GHCIDebug.GHCIDebug;
var Main;
(function (Main) {
    class History {
        constructor() {
            this._maxPosition = 0;
            this._currentPosition = 0;
        }
        setMaxPosition(newLength) {
            this._maxPosition = newLength;
            this._currentPosition = 0;
            this.updateButtonsState();
        }
        getMaxPosition() {
            return this._maxPosition;
        }
        setCurrentPosition(newPosition) {
            if (newPosition < 0 || newPosition > this._maxPosition) {
                return false;
            }
            this._currentPosition = newPosition;
            this.updateButtonsState();
            return true;
        }
        getCurrentPosition() {
            return this._currentPosition;
        }
        updateButtonsState() {
            Main.debugView.buttons.forward.isEnabled = this._currentPosition != 0;
            Main.debugView.buttons.back.isEnabled = this._currentPosition != this._maxPosition;
        }
    }
    Main.historyState = new History();
    Main.lineHighlighter = new LineHighlighter();
    Main.ghciDebug = null;
    Main.tooltipManager = new TooltipManager((expression) => __awaiter(this, void 0, void 0, function* () {
        if (Main.ghciDebug === null)
            return null;
        return Main.ghciDebug.resolveExpression(expression);
    }));
    Main.settings = {
        breakOnError: true
    };
    function displayDebuggingToolbar() {
        Main.debugView = new DebugView();
        Main.debugPanel = atom.workspace.addTopPanel({
            item: Main.debugView.element
        });
        Main.debugView.emitter.on("step", () => Main.commands["debug-step"]());
        Main.debugView.emitter.on("back", () => Main.commands["debug-back"]());
        Main.debugView.emitter.on("forward", () => Main.commands["debug-forward"]());
        Main.debugView.emitter.on("continue", () => Main.commands["debug-continue"]());
        Main.debugView.emitter.on("stop", () => Main.commands["debug-stop"]());
    }
    Main.displayDebuggingToolbar = displayDebuggingToolbar;
    function debuggerEnd() {
        Main.lineHighlighter.destroy();
        Main.debugPanel.destroy();
    }
    Main.commands = {
        "debug": () => {
            Main.ghciDebug = new GHCIDebug();
            Main.ghciDebug.emitter.on("line-changed", (info) => {
                Main.lineHighlighter.hightlightLine(info);
                if (info.historyLength !== undefined) {
                    Main.historyState.setMaxPosition(info.historyLength);
                }
            });
            Main.ghciDebug.emitter.on("paused-on-exception", (errorMes) => {
                console.log("Error: " + errorMes);
            });
            Main.ghciDebug.emitter.on("debug-finished", () => debuggerEnd());
            var fileToDebug = atom.workspace.getActiveTextEditor().getPath();
            Main.ghciDebug.loadModule(fileToDebug);
            Main.breakpointUI.breakpoints.forEach(ob => {
                if (ob.file == fileToDebug)
                    Main.ghciDebug.addBreakpoint(ob.line.toString());
                else
                    Main.ghciDebug.addBreakpoint(ob);
            });
            if (Main.settings.breakOnError) {
                Main.ghciDebug.pauseOnException();
            }
            Main.ghciDebug.startDebug();
            displayDebuggingToolbar();
        },
        "debug-back": () => {
            if (Main.ghciDebug != null) {
                if (Main.historyState.setCurrentPosition(Main.historyState.getCurrentPosition() + 1))
                    Main.ghciDebug.back();
            }
        },
        "debug-forward": () => {
            if (Main.ghciDebug != null) {
                if (Main.historyState.setCurrentPosition(Main.historyState.getCurrentPosition() - 1))
                    Main.ghciDebug.forward();
            }
        },
        "debug-step": () => {
            if (Main.ghciDebug != null) {
                Main.ghciDebug.step();
            }
        },
        "debug-stop": () => {
            if (Main.ghciDebug != null) {
                Main.ghciDebug.stop();
            }
        },
        "debug-continue": () => {
            if (Main.ghciDebug != null) {
                Main.ghciDebug.continue();
            }
        },
        "toggle-breakpoint": () => {
            Main.breakpointUI.toggleBreakpoint(atom.workspace.getActiveTextEditor().getCursorBufferPosition().row);
        }
    };
    function activate() {
        atom.workspace.observeTextEditors((te) => {
            var scopes = te.getRootScopeDescriptor().scopes;
            if (scopes.length == 1 &&
                scopes[0] == "source.haskell") {
                Main.breakpointUI = new BreakpointUI();
            }
        });
        for (var command of Object.keys(Main.commands)) {
            atom.commands.add("atom-text-editor[data-grammar='source haskell']", "haskell:" + command, Main.commands[command]);
        }
    }
    Main.activate = activate;
    function consumeHaskellUpi(upi) {
        Main.tooltipManager.consumeHaskellUpi(upi);
    }
    Main.consumeHaskellUpi = consumeHaskellUpi;
})(Main || (Main = {}));
module.exports = Main;
