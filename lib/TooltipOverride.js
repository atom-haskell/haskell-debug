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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVG9vbHRpcE92ZXJyaWRlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2xpYi9Ub29sdGlwT3ZlcnJpZGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUE7SUFDRSxZQUFvQixpQkFBc0U7UUFBdEUsc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFxRDtJQUMxRixDQUFDO0lBRVksY0FBYyxDQUFDLE1BQTRCLEVBQUUsTUFBdUIsRUFBRSxJQUF5Qjs7WUFFMUcsSUFBSSxLQUFLLEdBQWdDLE1BQU0sQ0FBQTtZQUMvQyxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUNwQixLQUFLLEdBQUcsTUFBTSxDQUFDLDZCQUE2QixDQUFDLG9CQUFvQixFQUFFLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQTtZQUNqRixDQUFDO1lBQ0QsRUFBRSxDQUFDLENBQUMsQ0FBQyxLQUFLLElBQUksS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDOUIsTUFBTSxDQUFBO1lBQ1IsQ0FBQztZQUNELE1BQU0sVUFBVSxHQUFHLE1BQU0sSUFBSSxDQUFDLGlCQUFpQixDQUFDLE1BQU0sQ0FBQyxvQkFBb0IsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFBO1lBQ25GLEVBQUUsQ0FBQyxDQUFDLFVBQVUsS0FBSyxTQUFTLENBQUMsQ0FBQyxDQUFDO2dCQUM3QixNQUFNLENBQUMsRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLFVBQVUsRUFBRSxDQUFBO1lBQ3BDLENBQUM7WUFDRCxNQUFNLENBQUE7UUFDUixDQUFDO0tBQUE7Q0FDRjtBQUVELGlCQUFTLGVBQWUsQ0FBQSIsInNvdXJjZXNDb250ZW50IjpbImNsYXNzIFRvb2x0aXBPdmVycmlkZSB7XG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgcmVzb2x2ZUV4cHJlc3Npb246IChleHByZXNzaW9uOiBzdHJpbmcpID0+IFByb21pc2U8c3RyaW5nIHwgdW5kZWZpbmVkPikge1xuICB9XG5cbiAgcHVibGljIGFzeW5jIHRvb2x0aXBIYW5kbGVyKGVkaXRvcjogQXRvbVR5cGVzLlRleHRFZGl0b3IsIGNyYW5nZTogQXRvbVR5cGVzLlJhbmdlLCB0eXBlOiBVUEkuVEV2ZW50UmFuZ2VUeXBlKVxuICAgIDogUHJvbWlzZTxVUEkuSVRvb2x0aXBEYXRhIHwgdW5kZWZpbmVkPiB7XG4gICAgbGV0IHJhbmdlOiBBdG9tVHlwZXMuUmFuZ2UgfCB1bmRlZmluZWQgPSBjcmFuZ2VcbiAgICBpZiAocmFuZ2UuaXNFbXB0eSgpKSB7XG4gICAgICByYW5nZSA9IGVkaXRvci5idWZmZXJSYW5nZUZvclNjb3BlQXRQb3NpdGlvbignaWRlbnRpZmllci5oYXNrZWxsJywgcmFuZ2Uuc3RhcnQpXG4gICAgfVxuICAgIGlmICghcmFuZ2UgfHwgcmFuZ2UuaXNFbXB0eSgpKSB7XG4gICAgICByZXR1cm5cbiAgICB9XG4gICAgY29uc3QgZGVidWdWYWx1ZSA9IGF3YWl0IHRoaXMucmVzb2x2ZUV4cHJlc3Npb24oZWRpdG9yLmdldFRleHRJbkJ1ZmZlclJhbmdlKHJhbmdlKSlcbiAgICBpZiAoZGVidWdWYWx1ZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4geyByYW5nZSwgdGV4dDogZGVidWdWYWx1ZSB9XG4gICAgfVxuICAgIHJldHVyblxuICB9XG59XG5cbmV4cG9ydCA9IFRvb2x0aXBPdmVycmlkZVxuIl19