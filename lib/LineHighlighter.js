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
                    class: 'highlight-green'
                });
                editor.decorateMarker(this.debugLineMarker, {
                    type: 'line-number',
                    class: 'highlight-green'
                });
                editor.decorateMarker(this.debugLineMarker, {
                    type: 'gutter',
                    class: 'highlight-green'
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTGluZUhpZ2hsaWdodGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2xpYi9MaW5lSGlnaGxpZ2h0ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBRUE7SUFJVSxjQUFjLENBQUUsSUFBZTs7WUFDakMsTUFBTSxNQUFNLEdBQUcsQ0FBQyxNQUFNLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsRUFBQyxjQUFjLEVBQUUsSUFBSSxFQUFDLENBQUMsQ0FBNEIsQ0FBQTtZQUM1RyxNQUFNLENBQUMsc0JBQXNCLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFBO1lBRTVDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxtQkFBbUIsS0FBSyxNQUFNLElBQUksSUFBSSxDQUFDLGVBQWUsS0FBSyxTQUFTLENBQUMsQ0FBQyxDQUFDO2dCQUM1RSxJQUFJLENBQUMsZUFBZSxDQUFDLE9BQU8sRUFBRSxDQUFBO2dCQUM5QixJQUFJLENBQUMsZUFBZSxHQUFHLFNBQVMsQ0FBQTtZQUNwQyxDQUFDO1lBRUQsSUFBSSxDQUFDLG1CQUFtQixHQUFHLE1BQU0sQ0FBQTtZQUVqQyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsZUFBZSxLQUFLLFNBQVMsQ0FBQyxDQUFDLENBQUM7Z0JBQ3JDLElBQUksQ0FBQyxlQUFlLEdBQUcsTUFBTSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLEVBQUMsVUFBVSxFQUFFLE9BQU8sRUFBQyxDQUFDLENBQUE7Z0JBQ2hGLE1BQU0sQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLGVBQWUsRUFBRTtvQkFDeEMsSUFBSSxFQUFFLFdBQVc7b0JBQ2pCLEtBQUssRUFBRSxpQkFBaUI7aUJBQzNCLENBQUMsQ0FBQTtnQkFDRixNQUFNLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxlQUFlLEVBQUU7b0JBQ3hDLElBQUksRUFBRSxhQUFhO29CQUNuQixLQUFLLEVBQUUsaUJBQWlCO2lCQUMzQixDQUFDLENBQUE7Z0JBQ0YsTUFBTSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsZUFBZSxFQUFFO29CQUN4QyxJQUFJLEVBQUUsUUFBUTtvQkFDZCxLQUFLLEVBQUUsaUJBQWlCO2lCQUMzQixDQUFDLENBQUE7WUFDTixDQUFDO1lBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ0osSUFBSSxDQUFDLGVBQWUsQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsQ0FBQTtZQUN2RCxDQUFDO1FBQ0wsQ0FBQztLQUFBO0lBRUQsT0FBTztRQUNILEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxlQUFlLEtBQUssU0FBUyxDQUFDLENBQUMsQ0FBQztZQUNyQyxJQUFJLENBQUMsZUFBZSxDQUFDLE9BQU8sRUFBRSxDQUFBO1lBQzlCLElBQUksQ0FBQyxlQUFlLEdBQUcsU0FBUyxDQUFBO1FBQ3BDLENBQUM7SUFDTCxDQUFDO0NBQ0o7QUFFRCxpQkFBUyxlQUFlLENBQUEiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge0JyZWFrSW5mb30gZnJvbSAnLi9HSENJRGVidWcnXG5cbmNsYXNzIExpbmVIaWdobGlnaHRlciB7XG4gICAgcHJpdmF0ZSBkZWJ1Z0xpbmVNYXJrZXI/OiBBdG9tQ29yZS5JRGlzcGxheUJ1ZmZlck1hcmtlclxuICAgIHByaXZhdGUgY3VycmVudE1hcmtlZEVkaXRvcj86IEF0b21Db3JlLklFZGl0b3JcblxuICAgIGFzeW5jIGhpZ2h0bGlnaHRMaW5lIChpbmZvOiBCcmVha0luZm8pIHtcbiAgICAgICAgY29uc3QgZWRpdG9yID0gKGF3YWl0IGF0b20ud29ya3NwYWNlLm9wZW4oaW5mby5maWxlbmFtZSwge3NlYXJjaEFsbFBhbmVzOiB0cnVlfSkpIGFzIGFueSBhcyBBdG9tQ29yZS5JRWRpdG9yXG4gICAgICAgIGVkaXRvci5zY3JvbGxUb0J1ZmZlclBvc2l0aW9uKGluZm8ucmFuZ2VbMF0pXG5cbiAgICAgICAgaWYgKHRoaXMuY3VycmVudE1hcmtlZEVkaXRvciAhPT0gZWRpdG9yICYmIHRoaXMuZGVidWdMaW5lTWFya2VyICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHRoaXMuZGVidWdMaW5lTWFya2VyLmRlc3Ryb3koKVxuICAgICAgICAgICAgdGhpcy5kZWJ1Z0xpbmVNYXJrZXIgPSB1bmRlZmluZWRcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuY3VycmVudE1hcmtlZEVkaXRvciA9IGVkaXRvclxuXG4gICAgICAgIGlmICh0aGlzLmRlYnVnTGluZU1hcmtlciA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICB0aGlzLmRlYnVnTGluZU1hcmtlciA9IGVkaXRvci5tYXJrQnVmZmVyUmFuZ2UoaW5mby5yYW5nZSwge2ludmFsaWRhdGU6ICduZXZlcid9KVxuICAgICAgICAgICAgZWRpdG9yLmRlY29yYXRlTWFya2VyKHRoaXMuZGVidWdMaW5lTWFya2VyLCB7XG4gICAgICAgICAgICAgICAgdHlwZTogJ2hpZ2hsaWdodCcsXG4gICAgICAgICAgICAgICAgY2xhc3M6ICdoaWdobGlnaHQtZ3JlZW4nXG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgZWRpdG9yLmRlY29yYXRlTWFya2VyKHRoaXMuZGVidWdMaW5lTWFya2VyLCB7XG4gICAgICAgICAgICAgICAgdHlwZTogJ2xpbmUtbnVtYmVyJyxcbiAgICAgICAgICAgICAgICBjbGFzczogJ2hpZ2hsaWdodC1ncmVlbidcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICBlZGl0b3IuZGVjb3JhdGVNYXJrZXIodGhpcy5kZWJ1Z0xpbmVNYXJrZXIsIHtcbiAgICAgICAgICAgICAgICB0eXBlOiAnZ3V0dGVyJyxcbiAgICAgICAgICAgICAgICBjbGFzczogJ2hpZ2hsaWdodC1ncmVlbidcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmRlYnVnTGluZU1hcmtlci5zZXRCdWZmZXJSYW5nZShpbmZvLnJhbmdlLCB7fSlcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGRlc3Ryb3kgKCkge1xuICAgICAgICBpZiAodGhpcy5kZWJ1Z0xpbmVNYXJrZXIgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdGhpcy5kZWJ1Z0xpbmVNYXJrZXIuZGVzdHJveSgpXG4gICAgICAgICAgICB0aGlzLmRlYnVnTGluZU1hcmtlciA9IHVuZGVmaW5lZFxuICAgICAgICB9XG4gICAgfVxufVxuXG5leHBvcnQgPSBMaW5lSGlnaGxpZ2h0ZXJcbiJdfQ==