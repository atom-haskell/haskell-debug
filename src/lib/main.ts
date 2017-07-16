import Debugger = require("./Debugger");
import BreakpointUI = require("./BreakpointUI");
import TooltipOverride = require("./TooltipOverride");
import SelectDebugModeView = require("./views/SelectDebugModeView");
import atomAPI = require("atom");
import os = require("os");
import path = require("path");
import cp = require("child_process");
import * as haskellIde from "./ide-haskell"

module Main {
    export var breakpointUI = new BreakpointUI();
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
            var Debugger = require("./Debugger");

            upi.getConfigParam("ide-haskell-cabal", "builder").then(ob => {
                debugger_ = new Debugger(breakpointUI.breakpoints, ob.name);
            }).catch(() => {
                debugger_ = new Debugger(breakpointUI.breakpoints);
            })
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
            var SelectDebugModeView = require("./views/SelectDebugModeView");
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
                        breakpointUI.attachToNewTextEditor(te);
                        te["hasHaskellBreakpoints"] = true;
                    }

                    if(debugger_ != null){
                        debugger_.showPanels();
                    }

                    return;  // don't do below
                }
            }

            // if any pane that isn't a haskell source file and we're debugging
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
        "useIdeHaskellCabalBuilder": {
            title: "Use ide-haskell-cabal builder",
            description: "Use the ide-haskell-cabal builder's command when running ghci - " +
                "will run `stack ghci` when stack is the builder, `cabal repl` for cabal and " +
                "`ghci` for none",
            default: true,
            type: "boolean",
            order: 0
        },
        "GHCICommand": {
            title: "GHCI Command",
            description: "The command to run to execute `ghci`, this will get ignore if the" +
                " previous setting is set to true",
            type: "string",
            default: "ghci",
            order: 1
        },
        "GHCIArguments": {
            title: "GHCI Arguments",
            description: "Arguments to give to `ghci`, separated by a space",
            type: "string",
            default: "",
            order: 2
        },
        "nodeCommand": {
            description: "The command to run to execute node.js",
            type: "string",
            default: "node",
            order: 3
        },
        "terminalCommand": {
            description: "The command to run to launch a terminal, where the command launched in the terminal is `%s`.",
            type: "string",
            default: getTerminalCommand(),
            order: 4
        },
        "clickGutterToToggleBreakpoint": {
            type: "boolean",
            description: "Insert a breakpoint when the gutter is clicked in a haskell source file",
            default: true,
            order: 5
        },
        "showTerminal": {
            type: "boolean",
            description: "Show a terminal with `ghci` running when debugging",
            default: true,
            order: 6
        },
        "functionToDebug": {
            type: "string",
            description: "The function to run when debugging",
            default: "main",
            order: 7
        },
        "breakOnException": {
            description: `Whether to break on exceptions, errors or neither.
                Note: breaking on exception may cause the debugger to freeze in some instances. See [#3](https://github.com/ThomasHickman/haskell-debug/issues/3)`,
            type: "string",
            default: "none",
            enum: debugModes,
            order: 8
        }
    }

    var upi: haskellIde.HaskellUPI;

    export function consumeHaskellUpi(upiContainer: haskellIde.HaskellUPIContainer){
        var pluginDisposable = new atomAPI.CompositeDisposable();
        var _upi = upiContainer.registerPlugin(pluginDisposable, "haskell-debug");
        tooltipOverride.consumeHaskellUpi(_upi);
        upi = _upi;
    }
}

export = Main
