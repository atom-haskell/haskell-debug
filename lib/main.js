"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
const atomAPI = require("atom");
const _HaskellDebug = require("./HaskellDebug");
const DebugView = require("./views/DebugView");
var HaskellDebug = _HaskellDebug.HaskellDebug;
var Main;
(function (Main) {
    var settings = {
        breakOnError: true
    };
    var debugLineMarker = null;
    function hightlightLine(info) {
        return __awaiter(this, void 0, void 0, function* () {
            var editor = yield atom.workspace.open(info.filename, { searchAllPanes: true });
            if (debugLineMarker == null) {
                debugLineMarker = editor.markBufferRange(info.range, { invalidate: 'never' });
                editor.decorateMarker(debugLineMarker, {
                    type: "highlight",
                    class: "highlight-green"
                });
                editor.decorateMarker(debugLineMarker, {
                    type: "line-number",
                    class: "highlight-green"
                });
                editor.decorateMarker(debugLineMarker, {
                    type: "gutter",
                    class: "highlight-green"
                });
            }
            else {
                debugLineMarker.setBufferRange(info.range, {});
            }
        });
    }
    var breakpoints = new Map();
    function toggleBreakpoint(lineNumber) {
        var te = atom.workspace.getActiveTextEditor();
        if (breakpoints.has(lineNumber)) {
            te.destroyMarker(breakpoints.get(lineNumber).marker.id);
            breakpoints.delete(lineNumber);
        }
        else {
            let breakpointMarker = te.markBufferRange(new atomAPI.Range([lineNumber, 0], [lineNumber + 1, 0]));
            te.decorateMarker(breakpointMarker, {
                type: "line-number",
                class: "breakpoint"
            });
            breakpoints.set(lineNumber, {
                line: lineNumber + 1,
                file: te.getPath(),
                marker: breakpointMarker
            });
        }
    }
    function setUpBreakpointsUI() {
        setTimeout(() => {
            var te = atom.workspace.getActiveTextEditor();
            var lineNumbersModal = te.gutterWithName("line-number");
            var view = atom.views.getView(lineNumbersModal);
            view.addEventListener("click", ev => {
                var scopes = te.getRootScopeDescriptor().scopes;
                if (scopes.length == 1 && scopes[0] == "source.haskell") {
                    var lineNumber = parseInt(ev["path"][0].dataset.bufferRow);
                    toggleBreakpoint(lineNumber);
                }
            });
        }, 0);
    }
    function displayDebuggingToolbar() {
        atom.workspace.addTopPanel({
            item: Main.debugView.element
        });
    }
    Main.displayDebuggingToolbar = displayDebuggingToolbar;
    function debuggerEnd() {
        debugLineMarker.destroy();
        debugLineMarker = null;
    }
    Main.currentDebug = null;
    Main.debugView = new DebugView();
    function activate() {
        atom.workspace.observeTextEditors((te) => {
            var scopes = te.getRootScopeDescriptor().scopes;
            if (scopes.length == 1 &&
                scopes[0] == "source.haskell") {
                setUpBreakpointsUI();
            }
        });
        atom.commands.add("atom-text-editor[data-grammar='source haskell']", "haskell:debug", () => {
            Main.currentDebug = new HaskellDebug();
            Main.currentDebug.emitter.on("line-changed", (info) => {
                hightlightLine(info);
            });
            Main.currentDebug.emitter.on("paused-on-exception", (errorMes) => {
                console.log("Error: " + errorMes);
            });
            Main.currentDebug.emitter.on("debug-finished", () => debuggerEnd());
            var fileToDebug = atom.workspace.getActiveTextEditor().getPath();
            Main.currentDebug.loadModule(fileToDebug);
            breakpoints.forEach(ob => {
                if (ob.file == fileToDebug)
                    Main.currentDebug.addBreakpoint(ob.line.toString());
                else
                    Main.currentDebug.addBreakpoint(ob);
            });
            if (settings.breakOnError) {
                Main.currentDebug.pauseOnException();
            }
            Main.currentDebug.startDebug();
        });
        atom.commands.add("atom-text-editor[data-grammar='source haskell']", "haskell:debug-back", () => {
            if (Main.currentDebug != null) {
                Main.currentDebug.back();
            }
        });
        atom.commands.add("atom-text-editor[data-grammar='source haskell']", "haskell:debug-forward", () => {
            if (Main.currentDebug != null) {
                Main.currentDebug.forward();
            }
        });
        atom.commands.add("atom-text-editor[data-grammar='source haskell']", "haskell:toggle-breakpoint", () => {
            toggleBreakpoint(atom.workspace.getActiveTextEditor().getCursorBufferPosition().row);
        });
    }
    Main.activate = activate;
})(Main || (Main = {}));
module.exports = Main;
