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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTGluZUhpZ2hsaWdodGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL0xpbmVIaWdobGlnaHRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFFQTtJQUFBO1FBQ1ksb0JBQWUsR0FBa0MsSUFBSSxDQUFDO1FBQ3RELHdCQUFtQixHQUFxQixJQUFJLENBQUM7SUF1Q3pELENBQUM7SUFyQ1MsY0FBYyxDQUFDLElBQWU7O1lBQ2hDLElBQUksTUFBTSxHQUEwQixDQUFDLE1BQU0sSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxFQUFDLGNBQWMsRUFBRSxJQUFJLEVBQUMsQ0FBQyxDQUFDLENBQUM7WUFDdkcsTUFBTSxDQUFDLHNCQUFzQixDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUU3QyxFQUFFLENBQUEsQ0FBQyxJQUFJLENBQUMsbUJBQW1CLEtBQUssTUFBTSxJQUFJLElBQUksQ0FBQyxlQUFlLEtBQUssSUFBSSxDQUFDLENBQUEsQ0FBQztnQkFDckUsSUFBSSxDQUFDLGVBQWUsQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFDL0IsSUFBSSxDQUFDLGVBQWUsR0FBRyxJQUFJLENBQUM7WUFDaEMsQ0FBQztZQUVELElBQUksQ0FBQyxtQkFBbUIsR0FBRyxNQUFNLENBQUM7WUFFbEMsRUFBRSxDQUFBLENBQUMsSUFBSSxDQUFDLGVBQWUsS0FBSyxJQUFJLENBQUMsQ0FBQSxDQUFDO2dCQUM5QixJQUFJLENBQUMsZUFBZSxHQUFHLE1BQU0sQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxFQUFDLFVBQVUsRUFBRSxPQUFPLEVBQUMsQ0FBQyxDQUFBO2dCQUNoRixNQUFNLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxlQUFlLEVBQUU7b0JBQ3hDLElBQUksRUFBRSxXQUFXO29CQUNqQixLQUFLLEVBQUUsaUJBQWlCO2lCQUMzQixDQUFDLENBQUE7Z0JBQ0YsTUFBTSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsZUFBZSxFQUFFO29CQUN4QyxJQUFJLEVBQUUsYUFBYTtvQkFDbkIsS0FBSyxFQUFFLGlCQUFpQjtpQkFDM0IsQ0FBQyxDQUFBO2dCQUNGLE1BQU0sQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLGVBQWUsRUFBRTtvQkFDeEMsSUFBSSxFQUFFLFFBQVE7b0JBQ2QsS0FBSyxFQUFFLGlCQUFpQjtpQkFDM0IsQ0FBQyxDQUFBO1lBQ04sQ0FBQztZQUNELElBQUksQ0FBQSxDQUFDO2dCQUNELElBQUksQ0FBQyxlQUFlLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFDeEQsQ0FBQztRQUNMLENBQUM7S0FBQTtJQUVELE9BQU87UUFDSCxFQUFFLENBQUEsQ0FBQyxJQUFJLENBQUMsZUFBZSxLQUFLLElBQUksQ0FBQyxDQUFBLENBQUM7WUFDOUIsSUFBSSxDQUFDLGVBQWUsQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUMvQixJQUFJLENBQUMsZUFBZSxHQUFHLElBQUksQ0FBQztRQUNoQyxDQUFDO0lBQ0wsQ0FBQztDQUNKO0FBRUQsaUJBQVMsZUFBZSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtCcmVha0luZm99IGZyb20gXCIuL0dIQ0lEZWJ1Z1wiO1xuXG5jbGFzcyBMaW5lSGlnaGxpZ2h0ZXJ7XG4gICAgcHJpdmF0ZSBkZWJ1Z0xpbmVNYXJrZXI6IEF0b21Db3JlLklEaXNwbGF5QnVmZmVyTWFya2VyID0gbnVsbDtcbiAgICBwcml2YXRlIGN1cnJlbnRNYXJrZWRFZGl0b3I6IEF0b21Db3JlLklFZGl0b3IgPSBudWxsO1xuXG4gICAgYXN5bmMgaGlnaHRsaWdodExpbmUoaW5mbzogQnJlYWtJbmZvKXtcbiAgICAgICAgdmFyIGVkaXRvciA9IDxBdG9tQ29yZS5JRWRpdG9yPjxhbnk+KGF3YWl0IGF0b20ud29ya3NwYWNlLm9wZW4oaW5mby5maWxlbmFtZSwge3NlYXJjaEFsbFBhbmVzOiB0cnVlfSkpO1xuICAgICAgICBlZGl0b3Iuc2Nyb2xsVG9CdWZmZXJQb3NpdGlvbihpbmZvLnJhbmdlWzBdKTtcblxuICAgICAgICBpZih0aGlzLmN1cnJlbnRNYXJrZWRFZGl0b3IgIT09IGVkaXRvciAmJiB0aGlzLmRlYnVnTGluZU1hcmtlciAhPT0gbnVsbCl7XG4gICAgICAgICAgICB0aGlzLmRlYnVnTGluZU1hcmtlci5kZXN0cm95KCk7XG4gICAgICAgICAgICB0aGlzLmRlYnVnTGluZU1hcmtlciA9IG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmN1cnJlbnRNYXJrZWRFZGl0b3IgPSBlZGl0b3I7XG5cbiAgICAgICAgaWYodGhpcy5kZWJ1Z0xpbmVNYXJrZXIgPT09IG51bGwpe1xuICAgICAgICAgICAgdGhpcy5kZWJ1Z0xpbmVNYXJrZXIgPSBlZGl0b3IubWFya0J1ZmZlclJhbmdlKGluZm8ucmFuZ2UsIHtpbnZhbGlkYXRlOiAnbmV2ZXInfSlcbiAgICAgICAgICAgIGVkaXRvci5kZWNvcmF0ZU1hcmtlcih0aGlzLmRlYnVnTGluZU1hcmtlciwge1xuICAgICAgICAgICAgICAgIHR5cGU6IFwiaGlnaGxpZ2h0XCIsXG4gICAgICAgICAgICAgICAgY2xhc3M6IFwiaGlnaGxpZ2h0LWdyZWVuXCJcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICBlZGl0b3IuZGVjb3JhdGVNYXJrZXIodGhpcy5kZWJ1Z0xpbmVNYXJrZXIsIHtcbiAgICAgICAgICAgICAgICB0eXBlOiBcImxpbmUtbnVtYmVyXCIsXG4gICAgICAgICAgICAgICAgY2xhc3M6IFwiaGlnaGxpZ2h0LWdyZWVuXCJcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICBlZGl0b3IuZGVjb3JhdGVNYXJrZXIodGhpcy5kZWJ1Z0xpbmVNYXJrZXIsIHtcbiAgICAgICAgICAgICAgICB0eXBlOiBcImd1dHRlclwiLFxuICAgICAgICAgICAgICAgIGNsYXNzOiBcImhpZ2hsaWdodC1ncmVlblwiXG4gICAgICAgICAgICB9KVxuICAgICAgICB9XG4gICAgICAgIGVsc2V7XG4gICAgICAgICAgICB0aGlzLmRlYnVnTGluZU1hcmtlci5zZXRCdWZmZXJSYW5nZShpbmZvLnJhbmdlLCB7fSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBkZXN0cm95KCkge1xuICAgICAgICBpZih0aGlzLmRlYnVnTGluZU1hcmtlciAhPT0gbnVsbCl7XG4gICAgICAgICAgICB0aGlzLmRlYnVnTGluZU1hcmtlci5kZXN0cm95KCk7XG4gICAgICAgICAgICB0aGlzLmRlYnVnTGluZU1hcmtlciA9IG51bGw7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmV4cG9ydCA9IExpbmVIaWdobGlnaHRlcjtcbiJdfQ==