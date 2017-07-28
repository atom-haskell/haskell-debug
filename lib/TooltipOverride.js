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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVG9vbHRpcE92ZXJyaWRlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2xpYi9Ub29sdGlwT3ZlcnJpZGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUE7SUFpQkksWUFBcUIsaUJBQXNFO1FBQXRFLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBcUQ7SUFDM0YsQ0FBQztJQWpCSyxjQUFjLENBQUUsTUFBNEIsRUFBRSxNQUF1QixFQUFFLElBQXlCOztZQUVwRyxJQUFJLEtBQUssR0FBZ0MsTUFBTSxDQUFBO1lBQy9DLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQ3BCLEtBQUssR0FBRyxNQUFNLENBQUMsNkJBQTZCLENBQUMsb0JBQW9CLEVBQUUsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFBO1lBQ2pGLENBQUM7WUFDRCxFQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUssSUFBSSxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUM5QixNQUFNLENBQUE7WUFDUixDQUFDO1lBQ0QsTUFBTSxVQUFVLEdBQUcsTUFBTSxJQUFJLENBQUMsaUJBQWlCLENBQUMsTUFBTSxDQUFDLG9CQUFvQixDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUE7WUFDbkYsRUFBRSxDQUFDLENBQUMsVUFBVSxLQUFLLFNBQVMsQ0FBQyxDQUFDLENBQUM7Z0JBQzNCLE1BQU0sQ0FBQyxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsVUFBVSxFQUFFLENBQUE7WUFDdEMsQ0FBQztZQUNELE1BQU0sQ0FBQTtRQUNSLENBQUM7S0FBQTtDQUlKO0FBRUQsaUJBQVMsZUFBZSxDQUFBIiwic291cmNlc0NvbnRlbnQiOlsiY2xhc3MgVG9vbHRpcE92ZXJyaWRlIHtcbiAgICBhc3luYyB0b29sdGlwSGFuZGxlciAoZWRpdG9yOiBBdG9tVHlwZXMuVGV4dEVkaXRvciwgY3JhbmdlOiBBdG9tVHlwZXMuUmFuZ2UsIHR5cGU6IFVQSS5URXZlbnRSYW5nZVR5cGUpXG4gICAgICA6IFByb21pc2U8VVBJLklUb29sdGlwRGF0YSB8IHVuZGVmaW5lZD4ge1xuICAgICAgbGV0IHJhbmdlOiBBdG9tVHlwZXMuUmFuZ2UgfCB1bmRlZmluZWQgPSBjcmFuZ2VcbiAgICAgIGlmIChyYW5nZS5pc0VtcHR5KCkpIHtcbiAgICAgICAgcmFuZ2UgPSBlZGl0b3IuYnVmZmVyUmFuZ2VGb3JTY29wZUF0UG9zaXRpb24oJ2lkZW50aWZpZXIuaGFza2VsbCcsIHJhbmdlLnN0YXJ0KVxuICAgICAgfVxuICAgICAgaWYgKCFyYW5nZSB8fCByYW5nZS5pc0VtcHR5KCkpIHtcbiAgICAgICAgcmV0dXJuXG4gICAgICB9XG4gICAgICBjb25zdCBkZWJ1Z1ZhbHVlID0gYXdhaXQgdGhpcy5yZXNvbHZlRXhwcmVzc2lvbihlZGl0b3IuZ2V0VGV4dEluQnVmZmVyUmFuZ2UocmFuZ2UpKVxuICAgICAgaWYgKGRlYnVnVmFsdWUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIHJldHVybiB7IHJhbmdlLCB0ZXh0OiBkZWJ1Z1ZhbHVlIH1cbiAgICAgIH1cbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIGNvbnN0cnVjdG9yIChwcml2YXRlIHJlc29sdmVFeHByZXNzaW9uOiAoZXhwcmVzc2lvbjogc3RyaW5nKSA9PiBQcm9taXNlPHN0cmluZyB8IHVuZGVmaW5lZD4pIHtcbiAgICB9XG59XG5cbmV4cG9ydCA9IFRvb2x0aXBPdmVycmlkZVxuIl19