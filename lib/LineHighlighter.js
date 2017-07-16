"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
class LineHighlighter {
    constructor() {
        this.debugLineMarker = null;
        this.currentMarkedEditor = null;
    }
    hightlightLine(info) {
        return __awaiter(this, void 0, void 0, function* () {
            var editor = (yield atom.workspace.open(info.filename, { searchAllPanes: true }));
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTGluZUhpZ2hsaWdodGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2xpYi9MaW5lSGlnaGxpZ2h0ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBRUE7SUFBQTtRQUNZLG9CQUFlLEdBQWtDLElBQUksQ0FBQztRQUN0RCx3QkFBbUIsR0FBcUIsSUFBSSxDQUFDO0lBdUN6RCxDQUFDO0lBckNTLGNBQWMsQ0FBQyxJQUFlOztZQUNoQyxJQUFJLE1BQU0sR0FBMEIsQ0FBQyxNQUFNLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsRUFBQyxjQUFjLEVBQUUsSUFBSSxFQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3ZHLE1BQU0sQ0FBQyxzQkFBc0IsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFN0MsRUFBRSxDQUFBLENBQUMsSUFBSSxDQUFDLG1CQUFtQixLQUFLLE1BQU0sSUFBSSxJQUFJLENBQUMsZUFBZSxLQUFLLElBQUksQ0FBQyxDQUFBLENBQUM7Z0JBQ3JFLElBQUksQ0FBQyxlQUFlLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQy9CLElBQUksQ0FBQyxlQUFlLEdBQUcsSUFBSSxDQUFDO1lBQ2hDLENBQUM7WUFFRCxJQUFJLENBQUMsbUJBQW1CLEdBQUcsTUFBTSxDQUFDO1lBRWxDLEVBQUUsQ0FBQSxDQUFDLElBQUksQ0FBQyxlQUFlLEtBQUssSUFBSSxDQUFDLENBQUEsQ0FBQztnQkFDOUIsSUFBSSxDQUFDLGVBQWUsR0FBRyxNQUFNLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsRUFBQyxVQUFVLEVBQUUsT0FBTyxFQUFDLENBQUMsQ0FBQTtnQkFDaEYsTUFBTSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsZUFBZSxFQUFFO29CQUN4QyxJQUFJLEVBQUUsV0FBVztvQkFDakIsS0FBSyxFQUFFLGlCQUFpQjtpQkFDM0IsQ0FBQyxDQUFBO2dCQUNGLE1BQU0sQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLGVBQWUsRUFBRTtvQkFDeEMsSUFBSSxFQUFFLGFBQWE7b0JBQ25CLEtBQUssRUFBRSxpQkFBaUI7aUJBQzNCLENBQUMsQ0FBQTtnQkFDRixNQUFNLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxlQUFlLEVBQUU7b0JBQ3hDLElBQUksRUFBRSxRQUFRO29CQUNkLEtBQUssRUFBRSxpQkFBaUI7aUJBQzNCLENBQUMsQ0FBQTtZQUNOLENBQUM7WUFDRCxJQUFJLENBQUEsQ0FBQztnQkFDRCxJQUFJLENBQUMsZUFBZSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQ3hELENBQUM7UUFDTCxDQUFDO0tBQUE7SUFFRCxPQUFPO1FBQ0gsRUFBRSxDQUFBLENBQUMsSUFBSSxDQUFDLGVBQWUsS0FBSyxJQUFJLENBQUMsQ0FBQSxDQUFDO1lBQzlCLElBQUksQ0FBQyxlQUFlLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDL0IsSUFBSSxDQUFDLGVBQWUsR0FBRyxJQUFJLENBQUM7UUFDaEMsQ0FBQztJQUNMLENBQUM7Q0FDSjtBQUVELGlCQUFTLGVBQWUsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7QnJlYWtJbmZvfSBmcm9tIFwiLi9HSENJRGVidWdcIjtcblxuY2xhc3MgTGluZUhpZ2hsaWdodGVye1xuICAgIHByaXZhdGUgZGVidWdMaW5lTWFya2VyOiBBdG9tQ29yZS5JRGlzcGxheUJ1ZmZlck1hcmtlciA9IG51bGw7XG4gICAgcHJpdmF0ZSBjdXJyZW50TWFya2VkRWRpdG9yOiBBdG9tQ29yZS5JRWRpdG9yID0gbnVsbDtcblxuICAgIGFzeW5jIGhpZ2h0bGlnaHRMaW5lKGluZm86IEJyZWFrSW5mbyl7XG4gICAgICAgIHZhciBlZGl0b3IgPSA8QXRvbUNvcmUuSUVkaXRvcj48YW55Pihhd2FpdCBhdG9tLndvcmtzcGFjZS5vcGVuKGluZm8uZmlsZW5hbWUsIHtzZWFyY2hBbGxQYW5lczogdHJ1ZX0pKTtcbiAgICAgICAgZWRpdG9yLnNjcm9sbFRvQnVmZmVyUG9zaXRpb24oaW5mby5yYW5nZVswXSk7XG5cbiAgICAgICAgaWYodGhpcy5jdXJyZW50TWFya2VkRWRpdG9yICE9PSBlZGl0b3IgJiYgdGhpcy5kZWJ1Z0xpbmVNYXJrZXIgIT09IG51bGwpe1xuICAgICAgICAgICAgdGhpcy5kZWJ1Z0xpbmVNYXJrZXIuZGVzdHJveSgpO1xuICAgICAgICAgICAgdGhpcy5kZWJ1Z0xpbmVNYXJrZXIgPSBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5jdXJyZW50TWFya2VkRWRpdG9yID0gZWRpdG9yO1xuXG4gICAgICAgIGlmKHRoaXMuZGVidWdMaW5lTWFya2VyID09PSBudWxsKXtcbiAgICAgICAgICAgIHRoaXMuZGVidWdMaW5lTWFya2VyID0gZWRpdG9yLm1hcmtCdWZmZXJSYW5nZShpbmZvLnJhbmdlLCB7aW52YWxpZGF0ZTogJ25ldmVyJ30pXG4gICAgICAgICAgICBlZGl0b3IuZGVjb3JhdGVNYXJrZXIodGhpcy5kZWJ1Z0xpbmVNYXJrZXIsIHtcbiAgICAgICAgICAgICAgICB0eXBlOiBcImhpZ2hsaWdodFwiLFxuICAgICAgICAgICAgICAgIGNsYXNzOiBcImhpZ2hsaWdodC1ncmVlblwiXG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgZWRpdG9yLmRlY29yYXRlTWFya2VyKHRoaXMuZGVidWdMaW5lTWFya2VyLCB7XG4gICAgICAgICAgICAgICAgdHlwZTogXCJsaW5lLW51bWJlclwiLFxuICAgICAgICAgICAgICAgIGNsYXNzOiBcImhpZ2hsaWdodC1ncmVlblwiXG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgZWRpdG9yLmRlY29yYXRlTWFya2VyKHRoaXMuZGVidWdMaW5lTWFya2VyLCB7XG4gICAgICAgICAgICAgICAgdHlwZTogXCJndXR0ZXJcIixcbiAgICAgICAgICAgICAgICBjbGFzczogXCJoaWdobGlnaHQtZ3JlZW5cIlxuICAgICAgICAgICAgfSlcbiAgICAgICAgfVxuICAgICAgICBlbHNle1xuICAgICAgICAgICAgdGhpcy5kZWJ1Z0xpbmVNYXJrZXIuc2V0QnVmZmVyUmFuZ2UoaW5mby5yYW5nZSwge30pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZGVzdHJveSgpIHtcbiAgICAgICAgaWYodGhpcy5kZWJ1Z0xpbmVNYXJrZXIgIT09IG51bGwpe1xuICAgICAgICAgICAgdGhpcy5kZWJ1Z0xpbmVNYXJrZXIuZGVzdHJveSgpO1xuICAgICAgICAgICAgdGhpcy5kZWJ1Z0xpbmVNYXJrZXIgPSBudWxsO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5leHBvcnQgPSBMaW5lSGlnaGxpZ2h0ZXI7XG4iXX0=