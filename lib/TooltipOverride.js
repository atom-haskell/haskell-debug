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
            const debugValue = yield this.resolveExpression(editor.getTextInBufferRange(crange));
            if (debugValue !== undefined) {
                return {
                    range: crange,
                    text: debugValue
                };
            }
            return;
        });
    }
}
module.exports = TooltipOverride;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVG9vbHRpcE92ZXJyaWRlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2xpYi9Ub29sdGlwT3ZlcnJpZGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUE7SUFhSSxZQUFxQixpQkFBc0U7UUFBdEUsc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFxRDtJQUMzRixDQUFDO0lBYkssY0FBYyxDQUFFLE1BQTRCLEVBQUUsTUFBdUIsRUFBRSxJQUF5Qjs7WUFFcEcsTUFBTSxVQUFVLEdBQUcsTUFBTSxJQUFJLENBQUMsaUJBQWlCLENBQUMsTUFBTSxDQUFDLG9CQUFvQixDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUE7WUFDcEYsRUFBRSxDQUFDLENBQUMsVUFBVSxLQUFLLFNBQVMsQ0FBQyxDQUFDLENBQUM7Z0JBQzNCLE1BQU0sQ0FBQztvQkFDTCxLQUFLLEVBQUUsTUFBTTtvQkFDYixJQUFJLEVBQUUsVUFBVTtpQkFDakIsQ0FBQTtZQUNMLENBQUM7WUFDRCxNQUFNLENBQUE7UUFDUixDQUFDO0tBQUE7Q0FJSjtBQUVELGlCQUFTLGVBQWUsQ0FBQSIsInNvdXJjZXNDb250ZW50IjpbImNsYXNzIFRvb2x0aXBPdmVycmlkZSB7XG4gICAgYXN5bmMgdG9vbHRpcEhhbmRsZXIgKGVkaXRvcjogQXRvbVR5cGVzLlRleHRFZGl0b3IsIGNyYW5nZTogQXRvbVR5cGVzLlJhbmdlLCB0eXBlOiBVUEkuVEV2ZW50UmFuZ2VUeXBlKVxuICAgICAgOiBQcm9taXNlPFVQSS5JVG9vbHRpcERhdGEgfCB1bmRlZmluZWQ+IHtcbiAgICAgIGNvbnN0IGRlYnVnVmFsdWUgPSBhd2FpdCB0aGlzLnJlc29sdmVFeHByZXNzaW9uKGVkaXRvci5nZXRUZXh0SW5CdWZmZXJSYW5nZShjcmFuZ2UpKVxuICAgICAgaWYgKGRlYnVnVmFsdWUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByYW5nZTogY3JhbmdlLFxuICAgICAgICAgICAgdGV4dDogZGVidWdWYWx1ZVxuICAgICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIGNvbnN0cnVjdG9yIChwcml2YXRlIHJlc29sdmVFeHByZXNzaW9uOiAoZXhwcmVzc2lvbjogc3RyaW5nKSA9PiBQcm9taXNlPHN0cmluZyB8IHVuZGVmaW5lZD4pIHtcbiAgICB9XG59XG5cbmV4cG9ydCA9IFRvb2x0aXBPdmVycmlkZVxuIl19