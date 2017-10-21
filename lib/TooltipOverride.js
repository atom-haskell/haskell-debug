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
                return undefined;
            }
            const debugValue = yield this.resolveExpression(editor.getTextInBufferRange(range));
            if (debugValue !== undefined) {
                return { range, text: debugValue };
            }
            return undefined;
        });
    }
}
exports.TooltipOverride = TooltipOverride;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVG9vbHRpcE92ZXJyaWRlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2xpYi9Ub29sdGlwT3ZlcnJpZGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQUFBO0lBQ0UsWUFBb0IsaUJBQXNFO1FBQXRFLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBcUQ7SUFDMUYsQ0FBQztJQUVZLGNBQWMsQ0FBQyxNQUE0QixFQUFFLE1BQXVCLEVBQUUsSUFBeUI7O1lBRTFHLElBQUksS0FBSyxHQUFnQyxNQUFNLENBQUE7WUFDL0MsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDcEIsS0FBSyxHQUFHLE1BQU0sQ0FBQyw2QkFBNkIsQ0FBQyxvQkFBb0IsRUFBRSxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUE7WUFDakYsQ0FBQztZQUNELEVBQUUsQ0FBQyxDQUFDLENBQUMsS0FBSyxJQUFJLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQzlCLE1BQU0sQ0FBQyxTQUFTLENBQUE7WUFDbEIsQ0FBQztZQUNELE1BQU0sVUFBVSxHQUFHLE1BQU0sSUFBSSxDQUFDLGlCQUFpQixDQUFDLE1BQU0sQ0FBQyxvQkFBb0IsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFBO1lBQ25GLEVBQUUsQ0FBQyxDQUFDLFVBQVUsS0FBSyxTQUFTLENBQUMsQ0FBQyxDQUFDO2dCQUM3QixNQUFNLENBQUMsRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLFVBQVUsRUFBRSxDQUFBO1lBQ3BDLENBQUM7WUFDRCxNQUFNLENBQUMsU0FBUyxDQUFBO1FBQ2xCLENBQUM7S0FBQTtDQUNGO0FBbkJELDBDQW1CQyIsInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCBjbGFzcyBUb29sdGlwT3ZlcnJpZGUge1xuICBjb25zdHJ1Y3Rvcihwcml2YXRlIHJlc29sdmVFeHByZXNzaW9uOiAoZXhwcmVzc2lvbjogc3RyaW5nKSA9PiBQcm9taXNlPHN0cmluZyB8IHVuZGVmaW5lZD4pIHtcbiAgfVxuXG4gIHB1YmxpYyBhc3luYyB0b29sdGlwSGFuZGxlcihlZGl0b3I6IEF0b21UeXBlcy5UZXh0RWRpdG9yLCBjcmFuZ2U6IEF0b21UeXBlcy5SYW5nZSwgdHlwZTogVVBJLlRFdmVudFJhbmdlVHlwZSlcbiAgICA6IFByb21pc2U8VVBJLklUb29sdGlwRGF0YSB8IHVuZGVmaW5lZD4ge1xuICAgIGxldCByYW5nZTogQXRvbVR5cGVzLlJhbmdlIHwgdW5kZWZpbmVkID0gY3JhbmdlXG4gICAgaWYgKHJhbmdlLmlzRW1wdHkoKSkge1xuICAgICAgcmFuZ2UgPSBlZGl0b3IuYnVmZmVyUmFuZ2VGb3JTY29wZUF0UG9zaXRpb24oJ2lkZW50aWZpZXIuaGFza2VsbCcsIHJhbmdlLnN0YXJ0KVxuICAgIH1cbiAgICBpZiAoIXJhbmdlIHx8IHJhbmdlLmlzRW1wdHkoKSkge1xuICAgICAgcmV0dXJuIHVuZGVmaW5lZFxuICAgIH1cbiAgICBjb25zdCBkZWJ1Z1ZhbHVlID0gYXdhaXQgdGhpcy5yZXNvbHZlRXhwcmVzc2lvbihlZGl0b3IuZ2V0VGV4dEluQnVmZmVyUmFuZ2UocmFuZ2UpKVxuICAgIGlmIChkZWJ1Z1ZhbHVlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiB7IHJhbmdlLCB0ZXh0OiBkZWJ1Z1ZhbHVlIH1cbiAgICB9XG4gICAgcmV0dXJuIHVuZGVmaW5lZFxuICB9XG59XG4iXX0=