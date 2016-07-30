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
var HaskellDebug = _HaskellDebug.HaskellDebug;
var Main;
(function (Main) {
    var settings = {
        breakOnError: true
    };
    var currentMarker = null;
    function hightlightLine(info) {
        return __awaiter(this, void 0, void 0, function* () {
            var editor = yield atom.workspace.open(info.filename, { searchAllPanes: true });
            if (currentMarker == null) {
                currentMarker = editor.markBufferRange(info.range, { invalidate: 'never' });
                editor.decorateMarker(currentMarker, {
                    type: "highlight",
                    class: "highlight-green"
                });
                editor.decorateMarker(currentMarker, {
                    type: "line-number",
                    class: "highlight-green"
                });
                editor.decorateMarker(currentMarker, {
                    type: "gutter",
                    class: "highlight-green"
                });
            }
            else {
                currentMarker.setBufferRange(info.range, {});
            }
        });
    }
    var breakpoints = new Map();
    var sourceButton = null;
    function getReplButton() {
        var cont = document.createElement("div");
        cont.innerHTML = '<ide-haskell-button data-caption="console" data-count="0" class="active"></ide-haskell-button>';
        sourceButton = cont.children[0];
        return sourceButton;
    }
    var replActive = false;
    function replButtonClicked() {
        if (replActive) {
        }
    }
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
    function debuggerEnd() {
    }
    var currentDebug = null;
    var toolBar;
    function consumeAutoreload(reloader) {
        return reloader({ pkg: "haskell-debug", files: ["package.json", "lib/main.js", "lib/HaskellDebug.js"], folders: ["lib/"] });
    }
    Main.consumeAutoreload = consumeAutoreload;
    function activate() {
        atom.workspace.observeTextEditors((te) => {
            var scopes = te.getRootScopeDescriptor().scopes;
            if (scopes.length == 1 &&
                scopes[0] == "source.haskell") {
                setUpBreakpointsUI();
            }
        });
        atom.commands.add("atom-text-editor[data-grammar='source haskell']", "haskell:debug", () => {
            currentDebug = new HaskellDebug();
            currentDebug.emitter.on("line-changed", (info) => {
                hightlightLine(info);
            });
            currentDebug.emitter.on("paused-on-exception", (errorMes) => {
                console.log("Error: " + errorMes);
            });
            currentDebug.emitter.on("debug-finished", () => debuggerEnd());
            var fileToDebug = atom.workspace.getActiveTextEditor().getPath();
            currentDebug.loadModule(fileToDebug);
            breakpoints.forEach(ob => {
                if (ob.file == fileToDebug)
                    currentDebug.addBreakpoint(ob.line.toString());
                else
                    currentDebug.addBreakpoint(ob);
            });
            if (settings.breakOnError) {
                currentDebug.pauseOnException();
            }
            currentDebug.startDebug();
        });
        atom.commands.add("atom-text-editor[data-grammar='source haskell']", "haskell:debug-back", () => {
            if (currentDebug != null) {
                currentDebug.back();
            }
        });
        atom.commands.add("atom-text-editor[data-grammar='source haskell']", "haskell:debug-forward", () => {
            if (currentDebug != null) {
                currentDebug.forward();
            }
        });
        atom.commands.add("atom-text-editor[data-grammar='source haskell']", "haskell:toggle-break-on-line", () => {
            var currentLine = atom.workspace.getActiveTextEditor().getCursorBufferPosition().row;
        });
    }
    Main.activate = activate;
    function consumeUpi(upi) {
    }
    Main.consumeUpi = consumeUpi;
    function consumeToolBar(Toolbar) {
        var toolBar = Toolbar("haskell-debug");
        toolBar.addButton({
            icon: 'bug',
            callback: 'haskell:debug',
            tooltip: 'Debug'
        });
        toolBar.addButton({
            icon: 'arrow-small-left',
            callback: 'haskell:debug-back',
            tooltip: 'Debug back'
        });
        toolBar.addButton({
            icon: 'arrow-small-right',
            callback: 'haskell:debug-forward',
            tooltip: 'Debug forward'
        });
        return toolBar;
    }
    Main.consumeToolBar = consumeToolBar;
    function deactivate() {
        toolBar.removeItems();
    }
    Main.deactivate = deactivate;
})(Main || (Main = {}));
module.exports = Main;
