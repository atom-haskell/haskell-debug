import atomAPI = require("atom");
import Debugger = require("./Debugger");
import BreakpointUI = require("./BreakpointUI");
import TooltipOverride = require("./TooltipOverride");
import SelectDebugModeView = require("./views/SelectDebugModeView");

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

    export function activate(){
        atom.workspace.observeActivePaneItem((pane) => {
            if(pane instanceof atomAPI.TextEditor){
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

    export var debugModes = [
        {value: "none", description: 'Don\'t pause on any exceptions'},
        {value: "errors", description: 'Pause on errors (uncaught exceptions)'},
        {value: "exceptions", description: 'Pause on exceptions'},
    ]

    export var config = {
        "GHCICommand": {
            type: "string",
            default: "ghci"
        },
        "breakOnException": {
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
