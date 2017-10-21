"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
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
exports.LineHighlighter = LineHighlighter;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTGluZUhpZ2hsaWdodGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2xpYi9MaW5lSGlnaGxpZ2h0ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQUdBO0lBSWUsY0FBYyxDQUFDLElBQWU7O1lBQ3pDLE1BQU0sTUFBTSxHQUFHLENBQUMsTUFBTSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLEVBQUUsY0FBYyxFQUFFLElBQUksRUFBRSxDQUFDLENBQThCLENBQUE7WUFDaEgsTUFBTSxDQUFDLHNCQUFzQixDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQTtZQUU1QyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsbUJBQW1CLEtBQUssTUFBTSxJQUFJLElBQUksQ0FBQyxlQUFlLEtBQUssU0FBUyxDQUFDLENBQUMsQ0FBQztnQkFDOUUsSUFBSSxDQUFDLGVBQWUsQ0FBQyxPQUFPLEVBQUUsQ0FBQTtnQkFDOUIsSUFBSSxDQUFDLGVBQWUsR0FBRyxTQUFTLENBQUE7WUFDbEMsQ0FBQztZQUVELElBQUksQ0FBQyxtQkFBbUIsR0FBRyxNQUFNLENBQUE7WUFFakMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLGVBQWUsS0FBSyxTQUFTLENBQUMsQ0FBQyxDQUFDO2dCQUN2QyxJQUFJLENBQUMsZUFBZSxHQUFHLE1BQU0sQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxFQUFFLFVBQVUsRUFBRSxPQUFPLEVBQUUsQ0FBQyxDQUFBO2dCQUNsRixNQUFNLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxlQUFlLEVBQUU7b0JBQzFDLElBQUksRUFBRSxXQUFXO29CQUNqQixLQUFLLEVBQUUsaUJBQWlCO2lCQUN6QixDQUFDLENBQUE7Z0JBQ0YsTUFBTSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsZUFBZSxFQUFFO29CQUMxQyxJQUFJLEVBQUUsYUFBYTtvQkFDbkIsS0FBSyxFQUFFLGlCQUFpQjtpQkFDekIsQ0FBQyxDQUFBO2dCQUNGLE1BQU0sQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLGVBQWUsRUFBRTtvQkFDMUMsSUFBSSxFQUFFLFFBQVE7b0JBQ2QsS0FBSyxFQUFFLGlCQUFpQjtpQkFDekIsQ0FBQyxDQUFBO1lBQ0osQ0FBQztZQUFDLElBQUksQ0FBQyxDQUFDO2dCQUNOLElBQUksQ0FBQyxlQUFlLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLENBQUE7WUFDckQsQ0FBQztRQUNILENBQUM7S0FBQTtJQUVNLE9BQU87UUFDWixFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsZUFBZSxLQUFLLFNBQVMsQ0FBQyxDQUFDLENBQUM7WUFDdkMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxPQUFPLEVBQUUsQ0FBQTtZQUM5QixJQUFJLENBQUMsZUFBZSxHQUFHLFNBQVMsQ0FBQTtRQUNsQyxDQUFDO0lBQ0gsQ0FBQztDQUNGO0FBeENELDBDQXdDQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEJyZWFrSW5mbyB9IGZyb20gJy4vR0hDSURlYnVnJ1xuaW1wb3J0IGF0b21BUEkgPSByZXF1aXJlKCdhdG9tJylcblxuZXhwb3J0IGNsYXNzIExpbmVIaWdobGlnaHRlciB7XG4gIHByaXZhdGUgZGVidWdMaW5lTWFya2VyPzogYXRvbUFQSS5EaXNwbGF5TWFya2VyXG4gIHByaXZhdGUgY3VycmVudE1hcmtlZEVkaXRvcj86IGF0b21BUEkuVGV4dEVkaXRvclxuXG4gIHB1YmxpYyBhc3luYyBoaWdodGxpZ2h0TGluZShpbmZvOiBCcmVha0luZm8pIHtcbiAgICBjb25zdCBlZGl0b3IgPSAoYXdhaXQgYXRvbS53b3Jrc3BhY2Uub3BlbihpbmZvLmZpbGVuYW1lLCB7IHNlYXJjaEFsbFBhbmVzOiB0cnVlIH0pKSBhcyBhbnkgYXMgYXRvbUFQSS5UZXh0RWRpdG9yXG4gICAgZWRpdG9yLnNjcm9sbFRvQnVmZmVyUG9zaXRpb24oaW5mby5yYW5nZVswXSlcblxuICAgIGlmICh0aGlzLmN1cnJlbnRNYXJrZWRFZGl0b3IgIT09IGVkaXRvciAmJiB0aGlzLmRlYnVnTGluZU1hcmtlciAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzLmRlYnVnTGluZU1hcmtlci5kZXN0cm95KClcbiAgICAgIHRoaXMuZGVidWdMaW5lTWFya2VyID0gdW5kZWZpbmVkXG4gICAgfVxuXG4gICAgdGhpcy5jdXJyZW50TWFya2VkRWRpdG9yID0gZWRpdG9yXG5cbiAgICBpZiAodGhpcy5kZWJ1Z0xpbmVNYXJrZXIgPT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhpcy5kZWJ1Z0xpbmVNYXJrZXIgPSBlZGl0b3IubWFya0J1ZmZlclJhbmdlKGluZm8ucmFuZ2UsIHsgaW52YWxpZGF0ZTogJ25ldmVyJyB9KVxuICAgICAgZWRpdG9yLmRlY29yYXRlTWFya2VyKHRoaXMuZGVidWdMaW5lTWFya2VyLCB7XG4gICAgICAgIHR5cGU6ICdoaWdobGlnaHQnLFxuICAgICAgICBjbGFzczogJ2hpZ2hsaWdodC1ncmVlbicsXG4gICAgICB9KVxuICAgICAgZWRpdG9yLmRlY29yYXRlTWFya2VyKHRoaXMuZGVidWdMaW5lTWFya2VyLCB7XG4gICAgICAgIHR5cGU6ICdsaW5lLW51bWJlcicsXG4gICAgICAgIGNsYXNzOiAnaGlnaGxpZ2h0LWdyZWVuJyxcbiAgICAgIH0pXG4gICAgICBlZGl0b3IuZGVjb3JhdGVNYXJrZXIodGhpcy5kZWJ1Z0xpbmVNYXJrZXIsIHtcbiAgICAgICAgdHlwZTogJ2d1dHRlcicsXG4gICAgICAgIGNsYXNzOiAnaGlnaGxpZ2h0LWdyZWVuJyxcbiAgICAgIH0pXG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuZGVidWdMaW5lTWFya2VyLnNldEJ1ZmZlclJhbmdlKGluZm8ucmFuZ2UsIHt9KVxuICAgIH1cbiAgfVxuXG4gIHB1YmxpYyBkZXN0cm95KCkge1xuICAgIGlmICh0aGlzLmRlYnVnTGluZU1hcmtlciAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzLmRlYnVnTGluZU1hcmtlci5kZXN0cm95KClcbiAgICAgIHRoaXMuZGVidWdMaW5lTWFya2VyID0gdW5kZWZpbmVkXG4gICAgfVxuICB9XG59XG4iXX0=