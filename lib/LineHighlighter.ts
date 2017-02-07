import {BreakInfo} from "./GHCIDebug";

class LineHighlighter{
    private debugLineMarker: AtomCore.IDisplayBufferMarker = null;
    private currentMarkedEditor: AtomCore.IEditor = null;

    async hightlightLine(info: BreakInfo){
        var editor = <AtomCore.IEditor><any>(await atom.workspace.open(info.filename, {searchAllPanes: true}));
        editor.scrollToBufferPosition(info.range[0]);

        if(this.currentMarkedEditor !== editor && this.debugLineMarker !== null){
            this.debugLineMarker.destroy();
            this.debugLineMarker = null;
        }

        this.currentMarkedEditor = editor;

        if(this.debugLineMarker === null){
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
