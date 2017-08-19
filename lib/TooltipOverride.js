"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
class TooltipOverride {
    constructor(resolveExpression) {
        this.resolveExpression = resolveExpression;
    }
    tooltipHandler(editor, crange, type) {
        return __awaiter(this, void 0, void 0, function* () {
            let range = crange;
            if (range.isEmpty()) {
                range = editor.bufferRangeForScopeAtPosition('identifier.haskell', range.start);
            }
            if (!range || range.isEmpty()) {
                return;
            }
            const debugValue = yield this.resolveExpression(editor.getTextInBufferRange(range));
            if (debugValue !== undefined) {
                return { range, text: debugValue };
            }
            return;
        });
    }
}
module.exports = TooltipOverride;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVG9vbHRpcE92ZXJyaWRlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2xpYi9Ub29sdGlwT3ZlcnJpZGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUE7SUFpQkUsWUFBb0IsaUJBQXNFO1FBQXRFLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBcUQ7SUFDMUYsQ0FBQztJQWpCSyxjQUFjLENBQUMsTUFBNEIsRUFBRSxNQUF1QixFQUFFLElBQXlCOztZQUVuRyxJQUFJLEtBQUssR0FBZ0MsTUFBTSxDQUFBO1lBQy9DLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQ3BCLEtBQUssR0FBRyxNQUFNLENBQUMsNkJBQTZCLENBQUMsb0JBQW9CLEVBQUUsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFBO1lBQ2pGLENBQUM7WUFDRCxFQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUssSUFBSSxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUM5QixNQUFNLENBQUE7WUFDUixDQUFDO1lBQ0QsTUFBTSxVQUFVLEdBQUcsTUFBTSxJQUFJLENBQUMsaUJBQWlCLENBQUMsTUFBTSxDQUFDLG9CQUFvQixDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUE7WUFDbkYsRUFBRSxDQUFDLENBQUMsVUFBVSxLQUFLLFNBQVMsQ0FBQyxDQUFDLENBQUM7Z0JBQzdCLE1BQU0sQ0FBQyxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsVUFBVSxFQUFFLENBQUE7WUFDcEMsQ0FBQztZQUNELE1BQU0sQ0FBQTtRQUNSLENBQUM7S0FBQTtDQUlGO0FBRUQsaUJBQVMsZUFBZSxDQUFBIiwic291cmNlc0NvbnRlbnQiOlsiY2xhc3MgVG9vbHRpcE92ZXJyaWRlIHtcbiAgYXN5bmMgdG9vbHRpcEhhbmRsZXIoZWRpdG9yOiBBdG9tVHlwZXMuVGV4dEVkaXRvciwgY3JhbmdlOiBBdG9tVHlwZXMuUmFuZ2UsIHR5cGU6IFVQSS5URXZlbnRSYW5nZVR5cGUpXG4gICAgOiBQcm9taXNlPFVQSS5JVG9vbHRpcERhdGEgfCB1bmRlZmluZWQ+IHtcbiAgICBsZXQgcmFuZ2U6IEF0b21UeXBlcy5SYW5nZSB8IHVuZGVmaW5lZCA9IGNyYW5nZVxuICAgIGlmIChyYW5nZS5pc0VtcHR5KCkpIHtcbiAgICAgIHJhbmdlID0gZWRpdG9yLmJ1ZmZlclJhbmdlRm9yU2NvcGVBdFBvc2l0aW9uKCdpZGVudGlmaWVyLmhhc2tlbGwnLCByYW5nZS5zdGFydClcbiAgICB9XG4gICAgaWYgKCFyYW5nZSB8fCByYW5nZS5pc0VtcHR5KCkpIHtcbiAgICAgIHJldHVyblxuICAgIH1cbiAgICBjb25zdCBkZWJ1Z1ZhbHVlID0gYXdhaXQgdGhpcy5yZXNvbHZlRXhwcmVzc2lvbihlZGl0b3IuZ2V0VGV4dEluQnVmZmVyUmFuZ2UocmFuZ2UpKVxuICAgIGlmIChkZWJ1Z1ZhbHVlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiB7IHJhbmdlLCB0ZXh0OiBkZWJ1Z1ZhbHVlIH1cbiAgICB9XG4gICAgcmV0dXJuXG4gIH1cblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIHJlc29sdmVFeHByZXNzaW9uOiAoZXhwcmVzc2lvbjogc3RyaW5nKSA9PiBQcm9taXNlPHN0cmluZyB8IHVuZGVmaW5lZD4pIHtcbiAgfVxufVxuXG5leHBvcnQgPSBUb29sdGlwT3ZlcnJpZGVcbiJdfQ==