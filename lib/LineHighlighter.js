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
    hightlightLine(info) {
        return __awaiter(this, void 0, void 0, function* () {
            const editor = (yield atom.workspace.open(info.filename, { searchAllPanes: true }));
            editor.scrollToBufferPosition(info.range[0]);
            if (this.currentMarkedEditor !== editor && this.debugLineMarker !== undefined) {
                this.debugLineMarker.destroy();
                this.debugLineMarker = undefined;
            }
            this.currentMarkedEditor = editor;
            if (this.debugLineMarker === undefined) {
                this.debugLineMarker = editor.markBufferRange(info.range, { invalidate: 'never' });
                editor.decorateMarker(this.debugLineMarker, {
                    type: 'highlight',
                    class: 'highlight-green',
                });
                editor.decorateMarker(this.debugLineMarker, {
                    type: 'line-number',
                    class: 'highlight-green',
                });
                editor.decorateMarker(this.debugLineMarker, {
                    type: 'gutter',
                    class: 'highlight-green',
                });
            }
            else {
                this.debugLineMarker.setBufferRange(info.range, {});
            }
        });
    }
    destroy() {
        if (this.debugLineMarker !== undefined) {
            this.debugLineMarker.destroy();
            this.debugLineMarker = undefined;
        }
    }
}
module.exports = LineHighlighter;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTGluZUhpZ2hsaWdodGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2xpYi9MaW5lSGlnaGxpZ2h0ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBR0E7SUFJZSxjQUFjLENBQUMsSUFBZTs7WUFDekMsTUFBTSxNQUFNLEdBQUcsQ0FBQyxNQUFNLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsRUFBRSxjQUFjLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBOEIsQ0FBQTtZQUNoSCxNQUFNLENBQUMsc0JBQXNCLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFBO1lBRTVDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxtQkFBbUIsS0FBSyxNQUFNLElBQUksSUFBSSxDQUFDLGVBQWUsS0FBSyxTQUFTLENBQUMsQ0FBQyxDQUFDO2dCQUM5RSxJQUFJLENBQUMsZUFBZSxDQUFDLE9BQU8sRUFBRSxDQUFBO2dCQUM5QixJQUFJLENBQUMsZUFBZSxHQUFHLFNBQVMsQ0FBQTtZQUNsQyxDQUFDO1lBRUQsSUFBSSxDQUFDLG1CQUFtQixHQUFHLE1BQU0sQ0FBQTtZQUVqQyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsZUFBZSxLQUFLLFNBQVMsQ0FBQyxDQUFDLENBQUM7Z0JBQ3ZDLElBQUksQ0FBQyxlQUFlLEdBQUcsTUFBTSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLEVBQUUsVUFBVSxFQUFFLE9BQU8sRUFBRSxDQUFDLENBQUE7Z0JBQ2xGLE1BQU0sQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLGVBQWUsRUFBRTtvQkFDMUMsSUFBSSxFQUFFLFdBQVc7b0JBQ2pCLEtBQUssRUFBRSxpQkFBaUI7aUJBQ3pCLENBQUMsQ0FBQTtnQkFDRixNQUFNLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxlQUFlLEVBQUU7b0JBQzFDLElBQUksRUFBRSxhQUFhO29CQUNuQixLQUFLLEVBQUUsaUJBQWlCO2lCQUN6QixDQUFDLENBQUE7Z0JBQ0YsTUFBTSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsZUFBZSxFQUFFO29CQUMxQyxJQUFJLEVBQUUsUUFBUTtvQkFDZCxLQUFLLEVBQUUsaUJBQWlCO2lCQUN6QixDQUFDLENBQUE7WUFDSixDQUFDO1lBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ04sSUFBSSxDQUFDLGVBQWUsQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsQ0FBQTtZQUNyRCxDQUFDO1FBQ0gsQ0FBQztLQUFBO0lBRU0sT0FBTztRQUNaLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxlQUFlLEtBQUssU0FBUyxDQUFDLENBQUMsQ0FBQztZQUN2QyxJQUFJLENBQUMsZUFBZSxDQUFDLE9BQU8sRUFBRSxDQUFBO1lBQzlCLElBQUksQ0FBQyxlQUFlLEdBQUcsU0FBUyxDQUFBO1FBQ2xDLENBQUM7SUFDSCxDQUFDO0NBQ0Y7QUFFRCxpQkFBUyxlQUFlLENBQUEiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBCcmVha0luZm8gfSBmcm9tICcuL0dIQ0lEZWJ1ZydcbmltcG9ydCBhdG9tQVBJID0gcmVxdWlyZSgnYXRvbScpXG5cbmNsYXNzIExpbmVIaWdobGlnaHRlciB7XG4gIHByaXZhdGUgZGVidWdMaW5lTWFya2VyPzogYXRvbUFQSS5EaXNwbGF5TWFya2VyXG4gIHByaXZhdGUgY3VycmVudE1hcmtlZEVkaXRvcj86IGF0b21BUEkuVGV4dEVkaXRvclxuXG4gIHB1YmxpYyBhc3luYyBoaWdodGxpZ2h0TGluZShpbmZvOiBCcmVha0luZm8pIHtcbiAgICBjb25zdCBlZGl0b3IgPSAoYXdhaXQgYXRvbS53b3Jrc3BhY2Uub3BlbihpbmZvLmZpbGVuYW1lLCB7IHNlYXJjaEFsbFBhbmVzOiB0cnVlIH0pKSBhcyBhbnkgYXMgYXRvbUFQSS5UZXh0RWRpdG9yXG4gICAgZWRpdG9yLnNjcm9sbFRvQnVmZmVyUG9zaXRpb24oaW5mby5yYW5nZVswXSlcblxuICAgIGlmICh0aGlzLmN1cnJlbnRNYXJrZWRFZGl0b3IgIT09IGVkaXRvciAmJiB0aGlzLmRlYnVnTGluZU1hcmtlciAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzLmRlYnVnTGluZU1hcmtlci5kZXN0cm95KClcbiAgICAgIHRoaXMuZGVidWdMaW5lTWFya2VyID0gdW5kZWZpbmVkXG4gICAgfVxuXG4gICAgdGhpcy5jdXJyZW50TWFya2VkRWRpdG9yID0gZWRpdG9yXG5cbiAgICBpZiAodGhpcy5kZWJ1Z0xpbmVNYXJrZXIgPT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhpcy5kZWJ1Z0xpbmVNYXJrZXIgPSBlZGl0b3IubWFya0J1ZmZlclJhbmdlKGluZm8ucmFuZ2UsIHsgaW52YWxpZGF0ZTogJ25ldmVyJyB9KVxuICAgICAgZWRpdG9yLmRlY29yYXRlTWFya2VyKHRoaXMuZGVidWdMaW5lTWFya2VyLCB7XG4gICAgICAgIHR5cGU6ICdoaWdobGlnaHQnLFxuICAgICAgICBjbGFzczogJ2hpZ2hsaWdodC1ncmVlbicsXG4gICAgICB9KVxuICAgICAgZWRpdG9yLmRlY29yYXRlTWFya2VyKHRoaXMuZGVidWdMaW5lTWFya2VyLCB7XG4gICAgICAgIHR5cGU6ICdsaW5lLW51bWJlcicsXG4gICAgICAgIGNsYXNzOiAnaGlnaGxpZ2h0LWdyZWVuJyxcbiAgICAgIH0pXG4gICAgICBlZGl0b3IuZGVjb3JhdGVNYXJrZXIodGhpcy5kZWJ1Z0xpbmVNYXJrZXIsIHtcbiAgICAgICAgdHlwZTogJ2d1dHRlcicsXG4gICAgICAgIGNsYXNzOiAnaGlnaGxpZ2h0LWdyZWVuJyxcbiAgICAgIH0pXG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuZGVidWdMaW5lTWFya2VyLnNldEJ1ZmZlclJhbmdlKGluZm8ucmFuZ2UsIHt9KVxuICAgIH1cbiAgfVxuXG4gIHB1YmxpYyBkZXN0cm95KCkge1xuICAgIGlmICh0aGlzLmRlYnVnTGluZU1hcmtlciAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzLmRlYnVnTGluZU1hcmtlci5kZXN0cm95KClcbiAgICAgIHRoaXMuZGVidWdMaW5lTWFya2VyID0gdW5kZWZpbmVkXG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCA9IExpbmVIaWdobGlnaHRlclxuIl19