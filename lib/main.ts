import atomAPI = require("atom");
import Debugger = require("./Debugger");
import BreakpointUI = require("./BreakpointUI");
import TooltipOverride = require("./TooltipOverride");

module Main{
    export var breakpointUI: BreakpointUI;
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
            breakpointUI.toggleBreakpoint(atom.workspace.getActiveTextEditor().getCursorBufferPosition().row);
        }
    }

    export function activate(){
        atom.workspace.observeTextEditors((te: AtomCore.IEditor) => {
            var scopes = te.getRootScopeDescriptor().scopes;
            if(scopes.length == 1 &&
                scopes[0] == "source.haskell"){
                    breakpointUI = new BreakpointUI();
            }
        })

        atom.workspace.observeActivePaneItem((pane) => {
            if(debugger_ == null){
                return;
            }
            if(pane instanceof atomAPI.TextEditor){
                var te: AtomCore.IEditor = pane;
                var scopes = te.getRootScopeDescriptor().scopes;
                if(scopes.length == 1 &&
                    scopes[0] == "source.haskell"){
                        debugger_.showPanels();
                        return;
                }
            }
            debugger_.hidePanels();
        })

        for(var command of Object.keys(commands)){
            atom.commands.add("atom-text-editor[data-grammar='source haskell']",
                              "haskell:" + command,
                              commands[command]);
        }
    }

    export function consumeHaskellUpi(upi){
        tooltipOverride.consumeHaskellUpi(upi);
    }
}

export = Main
