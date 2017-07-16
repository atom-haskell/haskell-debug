import atomAPI = require("atom");
import _ = require("lodash");

class BreakpointUI {
    breakpoints: Breakpoint[] = [];
    markers: WeakMap<Breakpoint, AtomCore.IDisplayBufferMarker> = new WeakMap();

    private setBreakpoint(breakpoint: Breakpoint, te: AtomCore.IEditor){
        let breakpointMarker = te.markBufferRange(
            new atomAPI.Range([breakpoint.line - 1, 0], [breakpoint.line, 0]), {
                invalidate: "inside"
            });

        te.decorateMarker(breakpointMarker, {
            type: "line-number",
            class: "haskell-debug-breakpoint"
        })

        breakpointMarker.onDidChange(change => {
            breakpoint.line = change.newHeadBufferPosition.row;
            if(!change.isValid){
                _.remove(this.breakpoints, breakpoint);
            }
        })

        this.markers.set(breakpoint, breakpointMarker);

        this.breakpoints.push(breakpoint);
    }

    private setFileBreakpoints(te: AtomCore.IEditor){
        _.filter(this.breakpoints, {
            file: te.getPath()
        }).forEach(breakpoint => this.setBreakpoint(breakpoint, te));
    }

    toggleBreakpoint(lineNumber: number, te: AtomCore.IEditor){
        var breakpoints = _.remove(this.breakpoints, {
            file: te.getPath(),
            line: lineNumber
        })

        if(breakpoints.length === 0){
            this.setBreakpoint({
                line: lineNumber,
                file: te.getPath()
            }, te);
        }
        else{
            breakpoints.forEach(breakpoint => {
                this.markers.get(breakpoint).destroy();
            })
        }
    }

    attachToNewTextEditor(te: AtomCore.IEditor){
        // patch the text editor to add breakpoints on click
        var lineNumbersModal = te.gutterWithName("line-number");
        var view = <HTMLElement>atom.views.getView(lineNumbersModal);

        view.addEventListener("click", ev => {
            var scopes = te.getRootScopeDescriptor().scopes;
            if(scopes.length == 1 && scopes[0] == "source.haskell"
            && atom.config.get("haskell-debug.clickGutterToToggleBreakpoint")){
                if(ev["path"][0].dataset.bufferRow === undefined){
                    console.warn("haskell-debug: click on gutter doesn't have a buffer row property");
                    return;
                }

                var lineNumber = parseInt(ev["path"][0].dataset.bufferRow) + 1;
                this.toggleBreakpoint(lineNumber, te);
            }
        })

        this.setFileBreakpoints(te);
    }
}

export = BreakpointUI;
