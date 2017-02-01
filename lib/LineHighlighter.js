"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
class LineHighlighter {
    constructor() {
        this.debugLineMarker = null;
        this.currentMarkedEditor = null;
    }
    hightlightLine(info) {
        return __awaiter(this, void 0, void 0, function* () {
            var editor = yield atom.workspace.open(info.filename, { searchAllPanes: true });
            editor.scrollToBufferPosition(info.range[0]);
            if (this.currentMarkedEditor !== editor && this.debugLineMarker !== null) {
                this.debugLineMarker.destroy();
                this.debugLineMarker = null;
            }
            this.currentMarkedEditor = editor;
            if (this.debugLineMarker === null) {
                this.debugLineMarker = editor.markBufferRange(info.range, { invalidate: 'never' });
                editor.decorateMarker(this.debugLineMarker, {
                    type: "highlight",
                    class: "highlight-green"
                });
                editor.decorateMarker(this.debugLineMarker, {
                    type: "line-number",
                    class: "highlight-green"
                });
                editor.decorateMarker(this.debugLineMarker, {
                    type: "gutter",
                    class: "highlight-green"
                });
            }
            else {
                this.debugLineMarker.setBufferRange(info.range, {});
            }
        });
    }
    destroy() {
        if (this.debugLineMarker !== null) {
            this.debugLineMarker.destroy();
            this.debugLineMarker = null;
        }
    }
}
module.exports = LineHighlighter;
