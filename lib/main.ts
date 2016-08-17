import atomAPI = require("atom");
import _HaskellDebug = require("./HaskellDebug");
import DebugView = require("./views/DebugView");
import HaskellDebug = _HaskellDebug.HaskellDebug;
import BreakInfo = _HaskellDebug.BreakInfo;

module Main{
    var settings = {
        breakOnError: true
    }

    var debugLineMarker: AtomCore.IDisplayBufferMarker = null;
    async function hightlightLine(info: BreakInfo){
        var editor = await atom.workspace.open(info.filename, {searchAllPanes: true});

        if(debugLineMarker == null){
            debugLineMarker = editor.markBufferRange(info.range, {invalidate: 'never'})
            editor.decorateMarker(debugLineMarker, {
                type: "highlight",
                class: "highlight-green"
            })
            editor.decorateMarker(debugLineMarker, {
                type: "line-number",
                class: "highlight-green"
            })
            editor.decorateMarker(debugLineMarker, {
                type: "gutter",
                class: "highlight-green"
            })
        }
        else{
            debugLineMarker.setBufferRange(info.range, {});
        }
    }

    var breakpoints: Map<number, Breakpoint> = new Map();
    function toggleBreakpoint(lineNumber: number){
        var te = atom.workspace.getActiveTextEditor();

        if(breakpoints.has(lineNumber)){
            te.destroyMarker(breakpoints.get(lineNumber).marker.id);
            breakpoints.delete(lineNumber);
        }
        else{
            let breakpointMarker = te.markBufferRange(new atomAPI.Range([lineNumber, 0], [lineNumber + 1, 0]));
            te.decorateMarker(breakpointMarker, {
                type: "line-number",
                class: "breakpoint"
            })

            breakpoints.set(lineNumber, {
                line: lineNumber + 1,
                file: te.getPath(),
                marker: breakpointMarker
            })
        }
    }

    function setUpBreakpointsUI(){
        setTimeout(() => {
            var te = atom.workspace.getActiveTextEditor();
            var lineNumbersModal = te.gutterWithName("line-number");
            var view = <HTMLElement>atom.views.getView(lineNumbersModal);
            view.addEventListener("click", ev => {
                var scopes = te.getRootScopeDescriptor().scopes;
                if(scopes.length == 1 && scopes[0] == "source.haskell"){
                    var lineNumber: number = parseInt(ev["path"][0].dataset.bufferRow);
                    toggleBreakpoint(lineNumber);
                }
            })
        }, 0)
    }

    export function displayDebuggingToolbar(){
        atom.workspace.addTopPanel({
            item: debugView.element
        });
    }

    function debuggerEnd(){
        debugLineMarker.destroy();
        debugLineMarker = null;
    }

    export var currentDebug: HaskellDebug = null;
    export var debugView = new DebugView();

    export function activate(){
        atom.workspace.observeTextEditors((te: AtomCore.IEditor) => {
            var scopes = te.getRootScopeDescriptor().scopes;
            if(scopes.length == 1 &&
                scopes[0] == "source.haskell"){
                    setUpBreakpointsUI();
            }
        })
        atom.commands.add("atom-text-editor[data-grammar='source haskell']", "haskell:debug", () => {
            currentDebug = new HaskellDebug();
            currentDebug.emitter.on("line-changed", (info: BreakInfo) => {
                hightlightLine(info);
            })
            currentDebug.emitter.on("paused-on-exception", (errorMes: string) => {
                console.log("Error: " + errorMes)
            })
            currentDebug.emitter.on("debug-finished", () => debuggerEnd())
            var fileToDebug = atom.workspace.getActiveTextEditor().getPath()
            currentDebug.loadModule(fileToDebug);
            breakpoints.forEach(ob => {
                if(ob.file == fileToDebug)
                    currentDebug.addBreakpoint(ob.line.toString());
                else
                    currentDebug.addBreakpoint(ob) //TODO: make this work properly
            });
            if(settings.breakOnError){
                currentDebug.pauseOnException();
            }
            currentDebug.startDebug();
        })
        atom.commands.add("atom-text-editor[data-grammar='source haskell']", "haskell:debug-back", () => {
            if(currentDebug != null){
                currentDebug.back();
            }
        })
        atom.commands.add("atom-text-editor[data-grammar='source haskell']", "haskell:debug-forward", () => {
            if(currentDebug != null){
                currentDebug.forward();
            }
        })
        atom.commands.add("atom-text-editor[data-grammar='source haskell']", "haskell:toggle-breakpoint", () => {
            toggleBreakpoint(atom.workspace.getActiveTextEditor().getCursorBufferPosition().row);
        })
    }
}

export = Main
