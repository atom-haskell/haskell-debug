import atomAPI = require("atom");
import _GHCIDebug = require("./GHCIDebug");
import DebugView = require("./views/DebugView");
import CurrentVariablesView = require("./views/CurrentVariablesView");
import BreakpointUI = require("./BreakpointUI");
import HistoryState = require("./HistoryState");
import LineHighlighter = require("./LineHighlighter");
import GHCIDebug = _GHCIDebug.GHCIDebug;
import BreakInfo = _GHCIDebug.BreakInfo;

class Debugger{
    private lineHighlighter = new LineHighlighter();
    private ghciDebug = new GHCIDebug();
    private debugView = new DebugView();
    private historyState = new HistoryState();
    private debugPanel: AtomCore.Panel;
    private currentVariablesView = new CurrentVariablesView();
    private currentVariablesPanel: AtomCore.Panel;

    private destroy(){
        this.lineHighlighter.destroy();
        if(this.ghciDebug)
            this.ghciDebug.stop();
        this.debugView.destroy();
        this.debugPanel.destroy();
        this.currentVariablesPanel.destroy();
        this.currentVariablesView.destroy();
    }

    hidePanels(){
        this.debugPanel.hide();
        this.currentVariablesPanel.hide();
    }

    showPanels(){
        this.debugPanel.show();
        this.currentVariablesPanel.show();
    }

    private displayGUI(){
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

    private debuggerEnabled = false;

    private launchGHCIDebug(breakpoints: Map<number, Breakpoint>){
        this.ghciDebug.emitter.on("line-changed", (info: BreakInfo) => {
            this.lineHighlighter.hightlightLine(info);

            if(info.historyLength !== undefined){
                this.historyState.setMaxPosition(info.historyLength);
            }
            this.debugView.enableAllDebugButtons();
            this.debugView.buttons.back.isEnabled = this.historyState.backEnabled;
            this.debugView.buttons.forward.isEnabled = this.historyState.forwardEnabled;
            this.debuggerEnabled = true;

            this.currentVariablesView.updateList(info.localBindings);
        })

        this.ghciDebug.emitter.on("paused-on-exception", (errorMes: string) => {
            console.log("Error: " + errorMes)
        })

        this.ghciDebug.emitter.on("debug-finished", () => {
            this.ghciDebug = null;
            this.destroy()
        })

        this.ghciDebug.emitter.on("command-issued", () => {
            this.debuggerEnabled = false;
            setTimeout(() => {
                if(!this.debuggerEnabled)
                    this.debugView.disableAllDebugButtons();
            }, 100);
        })

        this.debugView.disableAllDebugButtons();

        var fileToDebug = atom.workspace.getActiveTextEditor().getPath()
        this.ghciDebug.loadModule(fileToDebug);
        breakpoints.forEach(ob => {
            if(ob.file == fileToDebug)
                this.ghciDebug.addBreakpoint(ob.line.toString());
            else
                this.ghciDebug.addBreakpoint(ob) //TODO: make this work properly
        });
        if(/*settings.breakOnError*/ true){
            this.ghciDebug.pauseOnException();
        }
        this.ghciDebug.startDebug();
    }

    constructor(breakpoints: Map<number, Breakpoint>){
        this.launchGHCIDebug(breakpoints);
        this.displayGUI();
        var listener = atom.config.onDidChange("haskell-debug.breakOnException", ({newValue}) => {
            this.ghciDebug.setExceptionBreakLevel(<ExceptionBreakLevels> newValue);
        })
    }

    /** For the tooltip override*/
    async resolveExpression(expression: string){
        return this.ghciDebug.resolveExpression(expression);
    }

    back(){
        if(this.historyState.setCurrentPosition(this.historyState.getCurrentPosition() + 1))
            this.ghciDebug.back();
    }

    forward(){
        if(this.historyState.setCurrentPosition(this.historyState.getCurrentPosition() - 1))
            this.ghciDebug.forward();
    }

    continue(){
        this.ghciDebug.continue();
    }

    step(){
        this.ghciDebug.step();
    }

    stop(){
        this.ghciDebug.stop(); // this will trigger debug-finished event
    }
}

export = Debugger;
