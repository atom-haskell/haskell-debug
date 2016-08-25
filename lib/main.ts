import atomAPI = require("atom");
import _GHCIDebug = require("./GHCIDebug");
import DebugView = require("./views/DebugView");
import BreakpointUI = require("./BreakpointUI");
import LineHighlighter = require("./LineHighlighter");
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
    }

    export var currentDebug: GHCIDebug = null;
    export var debugView: DebugView;
    export var debugPanel: AtomCore.Panel;

    export var commands = {
        "debug": () => {
            currentDebug = new GHCIDebug();
            currentDebug.emitter.on("line-changed", (info: BreakInfo) => {
                lineHighlighter.hightlightLine(info);
                if(info.historyLength !== undefined){
                    historyState.setMaxPosition(info.historyLength);
                }
            })
            currentDebug.emitter.on("paused-on-exception", (errorMes: string) => {
                console.log("Error: " + errorMes)
            })
            currentDebug.emitter.on("debug-finished", () => debuggerEnd())
            var fileToDebug = atom.workspace.getActiveTextEditor().getPath()
            currentDebug.loadModule(fileToDebug);
            breakpointUI.breakpoints.forEach(ob => {
                if(ob.file == fileToDebug)
                    currentDebug.addBreakpoint(ob.line.toString());
                else
                    currentDebug.addBreakpoint(ob) //TODO: make this work properly
            });
            if(settings.breakOnError){
                currentDebug.pauseOnException();
            }
            currentDebug.startDebug();
            displayDebuggingToolbar();
        },
        "debug-back": () => {
            if(currentDebug != null){
                if(historyState.setCurrentPosition(historyState.getCurrentPosition() + 1))
                    currentDebug.back();
            }
        },
        "debug-forward": () => {
            if(currentDebug != null){
                if(historyState.setCurrentPosition(historyState.getCurrentPosition() - 1))
                    currentDebug.forward();
            }
        },
        "debug-step": () => {
            if(currentDebug != null){
                currentDebug.step();
            }
        },
        "debug-stop": () => {
            if(currentDebug != null){
                currentDebug.stop(); // this will trigger debug-finished event
            }
        },
        "debug-continue": () => {
            if(currentDebug != null){
                currentDebug.continue();
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

    interface HaskellUPIContainer{
        registerPlugin(plugin: atomAPI.CompositeDisposable): HaskellUPI;
    }

    type Tooltip = {
        text: string;
        highlighter: string
    } | {
        html: string;
    } | string;

    interface TooltipAndRange{
        range: TextBuffer.IRange;
        text: Tooltip;
    }

    type TooltipContainer = TooltipAndRange | Promise<TooltipAndRange>

    interface ShowTooltipArgs{
        pos: TextBuffer.IPoint;
        editor: AtomCore.IEditor;
        eventType: "mouse" | "selection" | "context";
        tooltip: (range: TextBuffer.IRange) => TooltipContainer;
    }

    interface HaskellUPI{
        onShouldShowTooltip(callback: (editor: AtomCore.IEditor, crange: TextBuffer.IRange,
            type: "mouse" | "selection") => TooltipContainer);
        showTooltip(arg: ShowTooltipArgs);
    }

    export function consumeHaskellUpi(_upi: HaskellUPIContainer){
        var pluginDisposable = new atomAPI.CompositeDisposable();
        var upi = _upi.registerPlugin(pluginDisposable);
        console.log(upi);
        var prevShowTooltip = upi.showTooltip;
        upi["__proto__"].showTooltip = function (arg: ShowTooltipArgs) {
            var prevTooltipFunc = arg.tooltip;
            arg.tooltip = async (range) => {
                var tooltipAndRange = await prevTooltipFunc(range);
                var tooltip = tooltipAndRange.text;

                if(currentDebug != null){
                    var debugValue = await currentDebug.resolveExpression(arg.editor.getTextInRange(tooltipAndRange.range));

                    if(typeof(tooltip) == "object" && tooltip["text"] !== undefined){
                        tooltip["text"] = `--type ${tooltip["text"]}\n--current debug value ${debugValue}"`
                    }
                }

                return tooltipAndRange;
            }
            prevShowTooltip.call(this, arg);
        }

        /*upi.onShouldShowTooltip(async (editor, range, type) => {
            if(type == "mouse") return;
            /*
            var text = editor.getTextInRange(range);
            var result = await currentDebug.resolveExpression(text)
            return {
                    range: range,
                    text: {
                        text: result,
                        highlighter: "text/haskell"
                    }
                }
                */
        //})
    }
}

export = Main
