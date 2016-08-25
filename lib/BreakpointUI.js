"use strict";
const atomAPI = require("atom");
class BreakpointUI {
    constructor() {
        this.breakpoints = new Map();
        setTimeout(() => {
            var te = atom.workspace.getActiveTextEditor();
            var lineNumbersModal = te.gutterWithName("line-number");
            var view = atom.views.getView(lineNumbersModal);
            view.addEventListener("click", ev => {
                var scopes = te.getRootScopeDescriptor().scopes;
                if (scopes.length == 1 && scopes[0] == "source.haskell") {
                    var lineNumber = parseInt(ev["path"][0].dataset.bufferRow);
                    this.toggleBreakpoint(lineNumber);
                }
            });
        }, 0);
    }
    toggleBreakpoint(lineNumber) {
        var te = atom.workspace.getActiveTextEditor();
        if (this.breakpoints.has(lineNumber)) {
            te.destroyMarker(this.breakpoints.get(lineNumber).marker.id);
            this.breakpoints.delete(lineNumber);
        }
        else {
            let breakpointMarker = te.markBufferRange(new atomAPI.Range([lineNumber, 0], [lineNumber + 1, 0]));
            te.decorateMarker(breakpointMarker, {
                type: "line-number",
                class: "breakpoint"
            });
            this.breakpoints.set(lineNumber, {
                line: lineNumber + 1,
                file: te.getPath(),
                marker: breakpointMarker
            });
        }
    }
}
module.exports = BreakpointUI;