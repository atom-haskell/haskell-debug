"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
const Debugger = require("./Debugger");
const BreakpointUI = require("./BreakpointUI");
const TooltipOverride = require("./TooltipOverride");
const SelectDebugModeView = require("./views/SelectDebugModeView");
const os = require("os");
const path = require("path");
const cp = require("child_process");
var Main;
(function (Main) {
    Main.breakpointUI = new BreakpointUI();
    ;
    Main.debugger_ = null;
    Main.tooltipOverride = new TooltipOverride((expression) => __awaiter(this, void 0, void 0, function* () {
        if (Main.debugger_ === null)
            return null;
        return Main.debugger_.resolveExpression(expression);
    }));
    Main.settings = {
        breakOnError: true
    };
    Main.commands = {
        "debug": () => {
            Main.debugger_ = new Debugger(Main.breakpointUI.breakpoints);
        },
        "debug-back": () => {
            if (Main.debugger_ != null) {
                Main.debugger_.back();
            }
        },
        "debug-forward": () => {
            if (Main.debugger_ != null) {
                Main.debugger_.forward();
            }
        },
        "debug-step": () => {
            if (Main.debugger_ != null) {
                Main.debugger_.step();
            }
        },
        "debug-stop": () => {
            if (Main.debugger_ != null) {
                Main.debugger_.stop();
            }
        },
        "debug-continue": () => {
            if (Main.debugger_ != null) {
                Main.debugger_.continue();
            }
        },
        "toggle-breakpoint": () => {
            var te = atom.workspace.getActiveTextEditor();
            Main.breakpointUI.toggleBreakpoint(te.getCursorBufferPosition().row, te);
        },
        "set-break-on-exception": () => {
            var view = new SelectDebugModeView(Main.debugModes, atom.config.get("haskell-debug.breakOnException"));
            var panel = atom.workspace.addModalPanel({
                item: view
            });
            view.focusFilterEditor();
            view.emitter.on("selected", (item) => {
                atom.config.set("haskell-debug.breakOnException", item);
            });
            view.emitter.on("canceled", () => {
                panel.destroy();
            });
        }
    };
    function onFirstRun() {
        Main.state = {
            properlyActivated: false
        };
        var isWin = os.platform().indexOf('win') > -1;
        var where = isWin ? 'where' : 'whereis';
        var out = cp.exec(where + ' node');
        out.on('close', function (code) {
            if (code == 1) {
                atom.config.set("haskell-debug.nodeCommand", path.resolve(atom.packages.getApmPath(), "../../bin/atom"));
                Main.state.properlyActivated = true;
            }
        });
    }
    Main.onFirstRun = onFirstRun;
    function activate(_state) {
        Main.state = _state;
        if (Main.state === undefined || Main.state.properlyActivated !== true) {
            onFirstRun();
        }
        atom.workspace.observeActivePaneItem((pane) => {
            if (atom.workspace.isTextEditor(pane)) {
                var te = pane;
                var scopes = te.getRootScopeDescriptor().scopes;
                if (scopes.length == 1 && scopes[0] == "source.haskell") {
                    if (!te["hasHaskellBreakpoints"]) {
                        Main.breakpointUI.patchTextEditor(te);
                        te["hasHaskellBreakpoints"] = true;
                    }
                    if (Main.debugger_ != null) {
                        Main.debugger_.showPanels();
                    }
                    return;
                }
            }
            if (Main.debugger_ != null) {
                Main.debugger_.hidePanels();
            }
        });
        for (var command of Object.keys(Main.commands)) {
            atom.commands.add("atom-text-editor[data-grammar='source haskell']", "haskell:" + command, Main.commands[command]);
        }
    }
    Main.activate = activate;
    function serialize() {
        return Main.state;
    }
    Main.serialize = serialize;
    Main.debugModes = [
        { value: "none", description: 'Don\'t pause on any exceptions' },
        { value: "errors", description: 'Pause on errors (uncaught exceptions)' },
        { value: "exceptions", description: 'Pause on exceptions' },
    ];
    function getTerminalCommand() {
        if (os.type() == "Windows_NT") {
            return "start %s";
        }
        else if (os.type() == "Linux") {
            return `x-terminal-emulator -e "bash -c \\"%s\\""`;
        }
        else if (os.type() == "Darwin") {
            return `osascript -e 'tell app "Terminal" to do script "%s"'`;
        }
        else {
            return `xterm -e "bash -c \\"%s\\""`;
        }
    }
    Main.getTerminalCommand = getTerminalCommand;
    Main.config = {
        "GHCICommand": {
            title: "GHCI Command",
            description: "The command to run, in order to execute `ghci`",
            type: "string",
            default: "ghci"
        },
        "GHCIArguments": {
            title: "GHCI Arguments",
            description: "Arguments to give to `ghci`, separated by a space",
            type: "string",
            default: ""
        },
        "nodeCommand": {
            description: "The command to run, in order to execute node.js",
            type: "string",
            default: "node"
        },
        "terminalCommand": {
            description: "The command to run, in order to launch a terminal, where the command launched in a terminal is denoted %s",
            type: "string",
            default: getTerminalCommand()
        },
        "clickGutterToToggleBreakpoint": {
            type: "boolean",
            description: "In a haskell source file, make clicking on a line number in the gutter toggle the insertion of a breakpoint",
            default: true
        },
        "showTerminal": {
            type: "boolean",
            description: "Show a terminal with `ghci` running, when debugging",
            default: true
        },
        "functionToDebug": {
            type: "string",
            description: "The function to run, when debugging",
            default: "main"
        },
        "breakOnException": {
            description: `Whether to break on exceptions, errors or neither.
                Note: breaking on exception may cause the debugger to freeze in some instances. See [#4](https://github.com/ThomasHickman/haskell-debug/issues/3])`,
            type: "string",
            default: "none",
            enum: Main.debugModes
        }
    };
    function consumeHaskellUpi(upi) {
        Main.tooltipOverride.consumeHaskellUpi(upi);
    }
    Main.consumeHaskellUpi = consumeHaskellUpi;
})(Main || (Main = {}));
module.exports = Main;
