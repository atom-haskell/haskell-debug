"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class LineHighlighter {
    async hightlightLine(info) {
        const editor = (await atom.workspace.open(info.filename, {
            searchAllPanes: true,
        }));
        editor.scrollToBufferPosition(info.range[0]);
        if (this.currentMarkedEditor !== editor &&
            this.debugLineMarker !== undefined) {
            this.debugLineMarker.destroy();
            this.debugLineMarker = undefined;
        }
        this.currentMarkedEditor = editor;
        if (this.debugLineMarker === undefined) {
            this.debugLineMarker = editor.markBufferRange(info.range, {
                invalidate: 'never',
            });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTGluZUhpZ2hsaWdodGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vbGliLXNyYy9MaW5lSGlnaGxpZ2h0ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFHQTtJQUlTLEtBQUssQ0FBQyxjQUFjLENBQUMsSUFBZTtRQUN6QyxNQUFNLE1BQU0sR0FBSSxDQUFDLE1BQU0sSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRTtZQUN4RCxjQUFjLEVBQUUsSUFBSTtTQUNyQixDQUFDLENBQStCLENBQUE7UUFDakMsTUFBTSxDQUFDLHNCQUFzQixDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQTtRQUU1QyxFQUFFLENBQUMsQ0FDRCxJQUFJLENBQUMsbUJBQW1CLEtBQUssTUFBTTtZQUNuQyxJQUFJLENBQUMsZUFBZSxLQUFLLFNBQzNCLENBQUMsQ0FBQyxDQUFDO1lBQ0QsSUFBSSxDQUFDLGVBQWUsQ0FBQyxPQUFPLEVBQUUsQ0FBQTtZQUM5QixJQUFJLENBQUMsZUFBZSxHQUFHLFNBQVMsQ0FBQTtRQUNsQyxDQUFDO1FBRUQsSUFBSSxDQUFDLG1CQUFtQixHQUFHLE1BQU0sQ0FBQTtRQUVqQyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsZUFBZSxLQUFLLFNBQVMsQ0FBQyxDQUFDLENBQUM7WUFDdkMsSUFBSSxDQUFDLGVBQWUsR0FBRyxNQUFNLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUU7Z0JBQ3hELFVBQVUsRUFBRSxPQUFPO2FBQ3BCLENBQUMsQ0FBQTtZQUNGLE1BQU0sQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLGVBQWUsRUFBRTtnQkFDMUMsSUFBSSxFQUFFLFdBQVc7Z0JBQ2pCLEtBQUssRUFBRSxpQkFBaUI7YUFDekIsQ0FBQyxDQUFBO1lBQ0YsTUFBTSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsZUFBZSxFQUFFO2dCQUMxQyxJQUFJLEVBQUUsYUFBYTtnQkFDbkIsS0FBSyxFQUFFLGlCQUFpQjthQUN6QixDQUFDLENBQUE7WUFDRixNQUFNLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxlQUFlLEVBQUU7Z0JBQzFDLElBQUksRUFBRSxRQUFRO2dCQUNkLEtBQUssRUFBRSxpQkFBaUI7YUFDekIsQ0FBQyxDQUFBO1FBQ0osQ0FBQztRQUFDLElBQUksQ0FBQyxDQUFDO1lBQ04sSUFBSSxDQUFDLGVBQWUsQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFBO1FBQ2pELENBQUM7SUFDSCxDQUFDO0lBRU0sT0FBTztRQUNaLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxlQUFlLEtBQUssU0FBUyxDQUFDLENBQUMsQ0FBQztZQUN2QyxJQUFJLENBQUMsZUFBZSxDQUFDLE9BQU8sRUFBRSxDQUFBO1lBQzlCLElBQUksQ0FBQyxlQUFlLEdBQUcsU0FBUyxDQUFBO1FBQ2xDLENBQUM7SUFDSCxDQUFDO0NBQ0Y7QUEvQ0QsMENBK0NDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQnJlYWtJbmZvIH0gZnJvbSAnLi9HSENJRGVidWcnXG5pbXBvcnQgYXRvbUFQSSA9IHJlcXVpcmUoJ2F0b20nKVxuXG5leHBvcnQgY2xhc3MgTGluZUhpZ2hsaWdodGVyIHtcbiAgcHJpdmF0ZSBkZWJ1Z0xpbmVNYXJrZXI/OiBhdG9tQVBJLkRpc3BsYXlNYXJrZXJcbiAgcHJpdmF0ZSBjdXJyZW50TWFya2VkRWRpdG9yPzogYXRvbUFQSS5UZXh0RWRpdG9yXG5cbiAgcHVibGljIGFzeW5jIGhpZ2h0bGlnaHRMaW5lKGluZm86IEJyZWFrSW5mbykge1xuICAgIGNvbnN0IGVkaXRvciA9ICgoYXdhaXQgYXRvbS53b3Jrc3BhY2Uub3BlbihpbmZvLmZpbGVuYW1lLCB7XG4gICAgICBzZWFyY2hBbGxQYW5lczogdHJ1ZSxcbiAgICB9KSkgYXMgYW55KSBhcyBhdG9tQVBJLlRleHRFZGl0b3JcbiAgICBlZGl0b3Iuc2Nyb2xsVG9CdWZmZXJQb3NpdGlvbihpbmZvLnJhbmdlWzBdKVxuXG4gICAgaWYgKFxuICAgICAgdGhpcy5jdXJyZW50TWFya2VkRWRpdG9yICE9PSBlZGl0b3IgJiZcbiAgICAgIHRoaXMuZGVidWdMaW5lTWFya2VyICE9PSB1bmRlZmluZWRcbiAgICApIHtcbiAgICAgIHRoaXMuZGVidWdMaW5lTWFya2VyLmRlc3Ryb3koKVxuICAgICAgdGhpcy5kZWJ1Z0xpbmVNYXJrZXIgPSB1bmRlZmluZWRcbiAgICB9XG5cbiAgICB0aGlzLmN1cnJlbnRNYXJrZWRFZGl0b3IgPSBlZGl0b3JcblxuICAgIGlmICh0aGlzLmRlYnVnTGluZU1hcmtlciA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzLmRlYnVnTGluZU1hcmtlciA9IGVkaXRvci5tYXJrQnVmZmVyUmFuZ2UoaW5mby5yYW5nZSwge1xuICAgICAgICBpbnZhbGlkYXRlOiAnbmV2ZXInLFxuICAgICAgfSlcbiAgICAgIGVkaXRvci5kZWNvcmF0ZU1hcmtlcih0aGlzLmRlYnVnTGluZU1hcmtlciwge1xuICAgICAgICB0eXBlOiAnaGlnaGxpZ2h0JyxcbiAgICAgICAgY2xhc3M6ICdoaWdobGlnaHQtZ3JlZW4nLFxuICAgICAgfSlcbiAgICAgIGVkaXRvci5kZWNvcmF0ZU1hcmtlcih0aGlzLmRlYnVnTGluZU1hcmtlciwge1xuICAgICAgICB0eXBlOiAnbGluZS1udW1iZXInLFxuICAgICAgICBjbGFzczogJ2hpZ2hsaWdodC1ncmVlbicsXG4gICAgICB9KVxuICAgICAgZWRpdG9yLmRlY29yYXRlTWFya2VyKHRoaXMuZGVidWdMaW5lTWFya2VyLCB7XG4gICAgICAgIHR5cGU6ICdndXR0ZXInLFxuICAgICAgICBjbGFzczogJ2hpZ2hsaWdodC1ncmVlbicsXG4gICAgICB9KVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmRlYnVnTGluZU1hcmtlci5zZXRCdWZmZXJSYW5nZShpbmZvLnJhbmdlKVxuICAgIH1cbiAgfVxuXG4gIHB1YmxpYyBkZXN0cm95KCkge1xuICAgIGlmICh0aGlzLmRlYnVnTGluZU1hcmtlciAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzLmRlYnVnTGluZU1hcmtlci5kZXN0cm95KClcbiAgICAgIHRoaXMuZGVidWdMaW5lTWFya2VyID0gdW5kZWZpbmVkXG4gICAgfVxuICB9XG59XG4iXX0=