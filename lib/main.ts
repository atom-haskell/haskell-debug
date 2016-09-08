import atomAPI = require("atom");
import Debugger = require("./Debugger");
import BreakpointUI = require("./BreakpointUI");
import TooltipOverride = require("./TooltipOverride");
import SelectDebugModeView = require("./views/SelectDebugModeView");
import os = require("os");
import path = require("path");
import cp = require("child_process");

module Main{
    export var breakpointUI = new BreakpointUI();;
    export var debugger_: Debugger = null;
    export var tooltipOverride = new TooltipOverride(async (expression) => {
        if(debugger_ === null) return null
        return debugger_.resolveExpression(expression);
    });

    export var settings = {
        breakOnError: true
    }

    export var commands = {
        "debug": () => {
            debugger_ = new Debugger(breakpointUI.breakpoints);
        },
        "debug-back": () => {
            if(debugger_ != null){
                debugger_.back();
            }
        },
        "debug-forward": () => {
            if(debugger_ != null){
                debugger_.forward();
            }
        },
        "debug-step": () => {
            if(debugger_ != null){
                debugger_.step();
            }
        },
        "debug-stop": () => {
            if(debugger_ != null){
                debugger_.stop();
            }
        },
        "debug-continue": () => {
            if(debugger_ != null){
                debugger_.continue();
            }
        },
        "toggle-breakpoint": () => {
            var te = atom.workspace.getActiveTextEditor();

            breakpointUI.toggleBreakpoint(
                te.getCursorBufferPosition().row,
                te
            );
        },
        "set-break-on-exception": () => {
            var view = new SelectDebugModeView(debugModes, atom.config.get("haskell-debug.breakOnException"));

            var panel = atom.workspace.addModalPanel({
                item: view
            })

            view.focusFilterEditor();

            view.emitter.on("selected", (item: string) => {
                atom.config.set("haskell-debug.breakOnException", item);
            })

            view.emitter.on("canceled", () => {
                panel.destroy();
            })
        }
    }

    export function onFirstRun(){
        state = {
            properlyActivated: false
        };

        // from http://stackoverflow.com/questions/34953168/node-check-existence-of-command-in-path
        var isWin = os.platform().indexOf('win') > -1;
        var where = isWin ? 'where' : 'whereis';

        var out = cp.exec(where + ' node');

        out.on('close', function (code) {
            if(code == 1){// not found
                // fallback to the node in apm
                atom.config.set("haskell-debug.nodeCommand", path.resolve(atom.packages.getApmPath(), "../../bin/atom"));
                state.properlyActivated = true;
            }
        });
    }

    interface HaskellDebugState{
        properlyActivated: boolean
    }

    export var state: HaskellDebugState;

    export function activate(_state?: HaskellDebugState){
        state = _state;

        if(state === undefined || state.properlyActivated !== true){
            onFirstRun();
        }
        atom.workspace.observeActivePaneItem((pane) => {
            if(atom.workspace.isTextEditor(pane)){
                var te: AtomCore.IEditor = pane;
                var scopes = te.getRootScopeDescriptor().scopes;
                if(scopes.length == 1 && scopes[0] == "source.haskell"){
                    if(!te["hasHaskellBreakpoints"]){
                        breakpointUI.patchTextEditor(te);
                        te["hasHaskellBreakpoints"] = true;
                    }

                    if(debugger_ != null){
                        debugger_.showPanels();
                    }
                    return;
                }
            }

            if(debugger_ != null){
                debugger_.hidePanels();
            }
        })

        for(var command of Object.keys(commands)){
            atom.commands.add("atom-text-editor[data-grammar='source haskell']",
                              "haskell:" + command,
                              commands[command]);
        }
    }

    export function serialize(){
        return state;
    }

    export var debugModes = [
        {value: "none", description: 'Don\'t pause on any exceptions'},
        {value: "errors", description: 'Pause on errors (uncaught exceptions)'},
        {value: "exceptions", description: 'Pause on exceptions'},
    ]

    export function getTerminalCommand(){
        if(os.type() == "Windows_NT"){
            return "start %s"
        }
        else if(os.type() == "Linux"){
            return `x-terminal-emulator -e "bash -c \\"%s\\""`
        }
        else if(os.type() == "Darwin"){
            return `osascript -e 'tell app "Terminal" to do script "%s"'`
        }
        else{
            // not recognised, hope xterm works
            return `xterm -e "bash -c \\"%s\\""`
        }
    }

    export var config = {
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
            enum: debugModes
        }
    }

    export function consumeHaskellUpi(upi){
        tooltipOverride.consumeHaskellUpi(upi);
    }
}

export = Main
