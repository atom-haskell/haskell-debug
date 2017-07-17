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
            if (crange.isEmpty()) {
                crange = editor.bufferRangeForScopeAtPosition('identifier.haskell', crange.start);
            }
            if (crange.isEmpty()) {
                return;
            }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVG9vbHRpcE92ZXJyaWRlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2xpYi9Ub29sdGlwT3ZlcnJpZGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUE7SUFtQkksWUFBcUIsaUJBQXNFO1FBQXRFLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBcUQ7SUFDM0YsQ0FBQztJQW5CSyxjQUFjLENBQUUsTUFBNEIsRUFBRSxNQUF1QixFQUFFLElBQXlCOztZQUVwRyxFQUFFLENBQUMsQ0FBQyxNQUFNLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUNyQixNQUFNLEdBQUcsTUFBTSxDQUFDLDZCQUE2QixDQUFDLG9CQUFvQixFQUFFLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQTtZQUNuRixDQUFDO1lBQ0QsRUFBRSxDQUFDLENBQUMsTUFBTSxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDckIsTUFBTSxDQUFBO1lBQ1IsQ0FBQztZQUNELE1BQU0sVUFBVSxHQUFHLE1BQU0sSUFBSSxDQUFDLGlCQUFpQixDQUFDLE1BQU0sQ0FBQyxvQkFBb0IsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFBO1lBQ3BGLEVBQUUsQ0FBQyxDQUFDLFVBQVUsS0FBSyxTQUFTLENBQUMsQ0FBQyxDQUFDO2dCQUMzQixNQUFNLENBQUM7b0JBQ0wsS0FBSyxFQUFFLE1BQU07b0JBQ2IsSUFBSSxFQUFFLFVBQVU7aUJBQ2pCLENBQUE7WUFDTCxDQUFDO1lBQ0QsTUFBTSxDQUFBO1FBQ1IsQ0FBQztLQUFBO0NBSUo7QUFFRCxpQkFBUyxlQUFlLENBQUEiLCJzb3VyY2VzQ29udGVudCI6WyJjbGFzcyBUb29sdGlwT3ZlcnJpZGUge1xuICAgIGFzeW5jIHRvb2x0aXBIYW5kbGVyIChlZGl0b3I6IEF0b21UeXBlcy5UZXh0RWRpdG9yLCBjcmFuZ2U6IEF0b21UeXBlcy5SYW5nZSwgdHlwZTogVVBJLlRFdmVudFJhbmdlVHlwZSlcbiAgICAgIDogUHJvbWlzZTxVUEkuSVRvb2x0aXBEYXRhIHwgdW5kZWZpbmVkPiB7XG4gICAgICBpZiAoY3JhbmdlLmlzRW1wdHkoKSkge1xuICAgICAgICBjcmFuZ2UgPSBlZGl0b3IuYnVmZmVyUmFuZ2VGb3JTY29wZUF0UG9zaXRpb24oJ2lkZW50aWZpZXIuaGFza2VsbCcsIGNyYW5nZS5zdGFydClcbiAgICAgIH1cbiAgICAgIGlmIChjcmFuZ2UuaXNFbXB0eSgpKSB7XG4gICAgICAgIHJldHVyblxuICAgICAgfVxuICAgICAgY29uc3QgZGVidWdWYWx1ZSA9IGF3YWl0IHRoaXMucmVzb2x2ZUV4cHJlc3Npb24oZWRpdG9yLmdldFRleHRJbkJ1ZmZlclJhbmdlKGNyYW5nZSkpXG4gICAgICBpZiAoZGVidWdWYWx1ZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJhbmdlOiBjcmFuZ2UsXG4gICAgICAgICAgICB0ZXh0OiBkZWJ1Z1ZhbHVlXG4gICAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgY29uc3RydWN0b3IgKHByaXZhdGUgcmVzb2x2ZUV4cHJlc3Npb246IChleHByZXNzaW9uOiBzdHJpbmcpID0+IFByb21pc2U8c3RyaW5nIHwgdW5kZWZpbmVkPikge1xuICAgIH1cbn1cblxuZXhwb3J0ID0gVG9vbHRpcE92ZXJyaWRlXG4iXX0=