import atomAPI = require("atom");
import _GHCIDebug = require("./GHCIDebug");
import DebugView = require("./views/DebugView");
import BreakpointUI = require("./BreakpointUI");
import LineHighlighter = require("./LineHighlighter");
import TooltipManager = require("./TooltipManager");
import GHCIDebug = _GHCIDebug.GHCIDebug;
import BreakInfo = _GHCIDebug.BreakInfo;

module Main{
    class History{
        private _maxPosition = 0;
        public setMaxPosition(newLength: number){
            this._maxPosition = newLength;
            this._currentPosition = 0;
            this.updateButtonsState();
        }
        public getMaxPosition(){
            return this._maxPosition;
        }

        private _currentPosition = 0;
        /**
          * sets the current history position, returns false if newPosition is invalid
        */
        public setCurrentPosition(newPosition: number){
            if(newPosition < 0 || newPosition > this._maxPosition){
                return false;
            }
            this._currentPosition = newPosition;
            this.updateButtonsState();

            return true;
        }
        public getCurrentPosition(){
            return this._currentPosition;
        }

        private updateButtonsState(){
            debugView.buttons.forward.isEnabled = this._currentPosition != 0;
            debugView.buttons.back.isEnabled = this._currentPosition != this._maxPosition;
        }
    }

    export var historyState = new History();
    export var breakpointUI: BreakpointUI;
    export var lineHighlighter = new LineHighlighter();
    export var ghciDebug: GHCIDebug = null;
    export var debugView: DebugView;
    export var debugPanel: AtomCore.Panel;
    export var tooltipManager = new TooltipManager(async (expression) => {
        if(ghciDebug === null) return null
        return ghciDebug.resolveExpression(expression);
    });
    export var settings = {
        breakOnError: true
    }


    export function displayDebuggingToolbar(){
        debugView = new DebugView();
        debugPanel = atom.workspace.addTopPanel({
            item: debugView.element
        });

        debugView.emitter.on("step", () => commands["debug-step"]())
        debugView.emitter.on("back", () => commands["debug-back"]())
        debugView.emitter.on("forward", () => commands["debug-forward"]())
        debugView.emitter.on("continue", () => commands["debug-continue"]())
        debugView.emitter.on("stop", () => commands["debug-stop"]())
    }

    function debuggerEnd(){
        lineHighlighter.destroy();
        debugPanel.destroy();
        debugView.destroy();
    }

    export var commands = {
        "debug": () => {
            ghciDebug = new GHCIDebug();
            ghciDebug.emitter.on("line-changed", (info: BreakInfo) => {
                lineHighlighter.hightlightLine(info);
                if(info.historyLength !== undefined){
                    historyState.setMaxPosition(info.historyLength);
                }
            })
            ghciDebug.emitter.on("paused-on-exception", (errorMes: string) => {
                console.log("Error: " + errorMes)
            })
            ghciDebug.emitter.on("debug-finished", () => debuggerEnd())
            var fileToDebug = atom.workspace.getActiveTextEditor().getPath()
            ghciDebug.loadModule(fileToDebug);
            breakpointUI.breakpoints.forEach(ob => {
                if(ob.file == fileToDebug)
                    ghciDebug.addBreakpoint(ob.line.toString());
                else
                    ghciDebug.addBreakpoint(ob) //TODO: make this work properly
            });
            if(settings.breakOnError){
                ghciDebug.pauseOnException();
            }
            ghciDebug.startDebug();
            displayDebuggingToolbar();
        },
        "debug-back": () => {
            if(ghciDebug != null){
                if(historyState.setCurrentPosition(historyState.getCurrentPosition() + 1))
                    ghciDebug.back();
            }
        },
        "debug-forward": () => {
            if(ghciDebug != null){
                if(historyState.setCurrentPosition(historyState.getCurrentPosition() - 1))
                    ghciDebug.forward();
            }
        },
        "debug-step": () => {
            if(ghciDebug != null){
                ghciDebug.step();
            }
        },
        "debug-stop": () => {
            if(ghciDebug != null){
                ghciDebug.stop(); // this will trigger debug-finished event
            }
        },
        "debug-continue": () => {
            if(ghciDebug != null){
                ghciDebug.continue();
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
        for(var command of Object.keys(commands)){
            atom.commands.add("atom-text-editor[data-grammar='source haskell']",
                              "haskell:" + command,
                              commands[command]);
        }
    }

    export function consumeHaskellUpi(upi){
        tooltipManager.consumeHaskellUpi(upi);
    }
}

export = Main
