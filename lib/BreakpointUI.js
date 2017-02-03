"use strict";
const atomAPI = require("atom");
const _ = require("lodash");
class BreakpointUI {
    constructor() {
        this.breakpoints = [];
        this.markers = new WeakMap();
    }
    setBreakpoint(breakpoint, te) {
        let breakpointMarker = te.markBufferRange(new atomAPI.Range([breakpoint.line - 1, 0], [breakpoint.line, 0]), {
            invalidate: "inside"
        });
        te.decorateMarker(breakpointMarker, {
            type: "line-number",
            class: "haskell-debug-breakpoint"
        });
        breakpointMarker.onDidChange(change => {
            breakpoint.line = change.newHeadBufferPosition.row;
            if (!change.isValid) {
                _.remove(this.breakpoints, breakpoint);
            }
        });
        this.markers.set(breakpoint, breakpointMarker);
        this.breakpoints.push(breakpoint);
    }
    setFileBreakpoints(te) {
        _.filter(this.breakpoints, {
            file: te.getPath()
        }).forEach(breakpoint => this.setBreakpoint(breakpoint, te));
    }
    toggleBreakpoint(lineNumber, te) {
        var breakpoints = _.remove(this.breakpoints, {
            file: te.getPath(),
            line: lineNumber
        });
        if (breakpoints.length === 0) {
            this.setBreakpoint({
                line: lineNumber,
                file: te.getPath()
            }, te);
        }
        else {
            breakpoints.forEach(breakpoint => {
                this.markers.get(breakpoint).destroy();
            });
        }
    }
    attachToNewTextEditor(te) {
        var lineNumbersModal = te.gutterWithName("line-number");
        var view = atom.views.getView(lineNumbersModal);
        view.addEventListener("click", ev => {
            var scopes = te.getRootScopeDescriptor().scopes;
            if (scopes.length == 1 && scopes[0] == "source.haskell"
                && atom.config.get("haskell-debug.clickGutterToToggleBreakpoint")) {
                if (ev["path"][0].dataset.bufferRow === undefined) {
                    console.warn("haskell-debug: click on gutter doesn't have a buffer row property");
                    return;
                }
                var lineNumber = parseInt(ev["path"][0].dataset.bufferRow) + 1;
                this.toggleBreakpoint(lineNumber, te);
            }
        });
        this.setFileBreakpoints(te);
    }
}
module.exports = BreakpointUI;
