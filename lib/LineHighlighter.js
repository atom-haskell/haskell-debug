"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class LineHighlighter {
    async hightlightLine(info) {
        const editor = (await atom.workspace.open(info.filename, { searchAllPanes: true }));
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
            this.debugLineMarker.setBufferRange(info.range);
        }
    }
    destroy() {
        if (this.debugLineMarker !== undefined) {
            this.debugLineMarker.destroy();
            this.debugLineMarker = undefined;
        }
    }
}
exports.LineHighlighter = LineHighlighter;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTGluZUhpZ2hsaWdodGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL0xpbmVIaWdobGlnaHRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUdBO0lBSVMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxJQUFlO1FBQ3pDLE1BQU0sTUFBTSxHQUFHLENBQUMsTUFBTSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLEVBQUUsY0FBYyxFQUFFLElBQUksRUFBRSxDQUFDLENBQThCLENBQUE7UUFDaEgsTUFBTSxDQUFDLHNCQUFzQixDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQTtRQUU1QyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsbUJBQW1CLEtBQUssTUFBTSxJQUFJLElBQUksQ0FBQyxlQUFlLEtBQUssU0FBUyxDQUFDLENBQUMsQ0FBQztZQUM5RSxJQUFJLENBQUMsZUFBZSxDQUFDLE9BQU8sRUFBRSxDQUFBO1lBQzlCLElBQUksQ0FBQyxlQUFlLEdBQUcsU0FBUyxDQUFBO1FBQ2xDLENBQUM7UUFFRCxJQUFJLENBQUMsbUJBQW1CLEdBQUcsTUFBTSxDQUFBO1FBRWpDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxlQUFlLEtBQUssU0FBUyxDQUFDLENBQUMsQ0FBQztZQUN2QyxJQUFJLENBQUMsZUFBZSxHQUFHLE1BQU0sQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxFQUFFLFVBQVUsRUFBRSxPQUFPLEVBQUUsQ0FBQyxDQUFBO1lBQ2xGLE1BQU0sQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLGVBQWUsRUFBRTtnQkFDMUMsSUFBSSxFQUFFLFdBQVc7Z0JBQ2pCLEtBQUssRUFBRSxpQkFBaUI7YUFDekIsQ0FBQyxDQUFBO1lBQ0YsTUFBTSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsZUFBZSxFQUFFO2dCQUMxQyxJQUFJLEVBQUUsYUFBYTtnQkFDbkIsS0FBSyxFQUFFLGlCQUFpQjthQUN6QixDQUFDLENBQUE7WUFDRixNQUFNLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxlQUFlLEVBQUU7Z0JBQzFDLElBQUksRUFBRSxRQUFRO2dCQUNkLEtBQUssRUFBRSxpQkFBaUI7YUFDekIsQ0FBQyxDQUFBO1FBQ0osQ0FBQztRQUFDLElBQUksQ0FBQyxDQUFDO1lBQ04sSUFBSSxDQUFDLGVBQWUsQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFBO1FBQ2pELENBQUM7SUFDSCxDQUFDO0lBRU0sT0FBTztRQUNaLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxlQUFlLEtBQUssU0FBUyxDQUFDLENBQUMsQ0FBQztZQUN2QyxJQUFJLENBQUMsZUFBZSxDQUFDLE9BQU8sRUFBRSxDQUFBO1lBQzlCLElBQUksQ0FBQyxlQUFlLEdBQUcsU0FBUyxDQUFBO1FBQ2xDLENBQUM7SUFDSCxDQUFDO0NBQ0Y7QUF4Q0QsMENBd0NDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQnJlYWtJbmZvIH0gZnJvbSAnLi9HSENJRGVidWcnXG5pbXBvcnQgYXRvbUFQSSA9IHJlcXVpcmUoJ2F0b20nKVxuXG5leHBvcnQgY2xhc3MgTGluZUhpZ2hsaWdodGVyIHtcbiAgcHJpdmF0ZSBkZWJ1Z0xpbmVNYXJrZXI/OiBhdG9tQVBJLkRpc3BsYXlNYXJrZXJcbiAgcHJpdmF0ZSBjdXJyZW50TWFya2VkRWRpdG9yPzogYXRvbUFQSS5UZXh0RWRpdG9yXG5cbiAgcHVibGljIGFzeW5jIGhpZ2h0bGlnaHRMaW5lKGluZm86IEJyZWFrSW5mbykge1xuICAgIGNvbnN0IGVkaXRvciA9IChhd2FpdCBhdG9tLndvcmtzcGFjZS5vcGVuKGluZm8uZmlsZW5hbWUsIHsgc2VhcmNoQWxsUGFuZXM6IHRydWUgfSkpIGFzIGFueSBhcyBhdG9tQVBJLlRleHRFZGl0b3JcbiAgICBlZGl0b3Iuc2Nyb2xsVG9CdWZmZXJQb3NpdGlvbihpbmZvLnJhbmdlWzBdKVxuXG4gICAgaWYgKHRoaXMuY3VycmVudE1hcmtlZEVkaXRvciAhPT0gZWRpdG9yICYmIHRoaXMuZGVidWdMaW5lTWFya2VyICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHRoaXMuZGVidWdMaW5lTWFya2VyLmRlc3Ryb3koKVxuICAgICAgdGhpcy5kZWJ1Z0xpbmVNYXJrZXIgPSB1bmRlZmluZWRcbiAgICB9XG5cbiAgICB0aGlzLmN1cnJlbnRNYXJrZWRFZGl0b3IgPSBlZGl0b3JcblxuICAgIGlmICh0aGlzLmRlYnVnTGluZU1hcmtlciA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzLmRlYnVnTGluZU1hcmtlciA9IGVkaXRvci5tYXJrQnVmZmVyUmFuZ2UoaW5mby5yYW5nZSwgeyBpbnZhbGlkYXRlOiAnbmV2ZXInIH0pXG4gICAgICBlZGl0b3IuZGVjb3JhdGVNYXJrZXIodGhpcy5kZWJ1Z0xpbmVNYXJrZXIsIHtcbiAgICAgICAgdHlwZTogJ2hpZ2hsaWdodCcsXG4gICAgICAgIGNsYXNzOiAnaGlnaGxpZ2h0LWdyZWVuJyxcbiAgICAgIH0pXG4gICAgICBlZGl0b3IuZGVjb3JhdGVNYXJrZXIodGhpcy5kZWJ1Z0xpbmVNYXJrZXIsIHtcbiAgICAgICAgdHlwZTogJ2xpbmUtbnVtYmVyJyxcbiAgICAgICAgY2xhc3M6ICdoaWdobGlnaHQtZ3JlZW4nLFxuICAgICAgfSlcbiAgICAgIGVkaXRvci5kZWNvcmF0ZU1hcmtlcih0aGlzLmRlYnVnTGluZU1hcmtlciwge1xuICAgICAgICB0eXBlOiAnZ3V0dGVyJyxcbiAgICAgICAgY2xhc3M6ICdoaWdobGlnaHQtZ3JlZW4nLFxuICAgICAgfSlcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5kZWJ1Z0xpbmVNYXJrZXIuc2V0QnVmZmVyUmFuZ2UoaW5mby5yYW5nZSlcbiAgICB9XG4gIH1cblxuICBwdWJsaWMgZGVzdHJveSgpIHtcbiAgICBpZiAodGhpcy5kZWJ1Z0xpbmVNYXJrZXIgIT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhpcy5kZWJ1Z0xpbmVNYXJrZXIuZGVzdHJveSgpXG4gICAgICB0aGlzLmRlYnVnTGluZU1hcmtlciA9IHVuZGVmaW5lZFxuICAgIH1cbiAgfVxufVxuIl19