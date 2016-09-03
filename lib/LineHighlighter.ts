import {BreakInfo} from "./GHCIDebug";

class LineHighlighter{
    debugLineMarker: AtomCore.IDisplayBufferMarker = null;

    async hightlightLine(info: BreakInfo){
        var editor = await atom.workspace.open(info.filename, {searchAllPanes: true});
        editor.scrollToBufferPosition(info.range[0]);

        if(this.debugLineMarker == null){
            this.debugLineMarker = editor.markBufferRange(info.range, {invalidate: 'never'})
            editor.decorateMarker(this.debugLineMarker, {
                type: "highlight",
                class: "highlight-green"
            })
            editor.decorateMarker(this.debugLineMarker, {
                type: "line-number",
                class: "highlight-green"
            })
            editor.decorateMarker(this.debugLineMarker, {
                type: "gutter",
                class: "highlight-green"
            })
        }
        else{
            this.debugLineMarker.setBufferRange(info.range, {});
        }
    }

    destroy() {
        if(this.debugLineMarker !== null){
            this.debugLineMarker.destroy();
            this.debugLineMarker = null;
        }
    }
}

export = LineHighlighter;
