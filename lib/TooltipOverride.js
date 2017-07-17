"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
function isTextTooltip(tooltip) {
    return typeof (tooltip) === 'object' && tooltip.text !== undefined;
}
class TooltipOverride {
    constructor(resolveExpression) {
        this.resolveExpression = resolveExpression;
    }
    consumeHaskellUpi(upi) {
        if (!upi['__proto__'].showTooltip) {
            return;
        }
        const prevShowTooltip = upi.showTooltip;
        const _this = this;
        upi['__proto__'].showTooltip = function (arg) {
            const prevTooltipFunc = arg.tooltip;
            arg.tooltip = (range) => __awaiter(this, void 0, void 0, function* () {
                const tooltipAndRange = yield prevTooltipFunc(range);
                const tooltip = tooltipAndRange.text;
                const debugValue = yield _this.resolveExpression(arg.editor.getTextInBufferRange(tooltipAndRange.range));
                if (debugValue !== undefined && isTextTooltip(tooltip)) {
                    tooltip.text = `--type\n${tooltip.text}\n--current debug value\n${debugValue}`;
                }
                return tooltipAndRange;
            });
            prevShowTooltip.call(this, arg);
        };
    }
}
module.exports = TooltipOverride;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVG9vbHRpcE92ZXJyaWRlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2xpYi9Ub29sdGlwT3ZlcnJpZGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBRUEsdUJBQXdCLE9BQTJCO0lBQ2pELE1BQU0sQ0FBQyxPQUFNLENBQUMsT0FBTyxDQUFDLEtBQUssUUFBUSxJQUFLLE9BQWtDLENBQUMsSUFBSSxLQUFLLFNBQVMsQ0FBQTtBQUMvRixDQUFDO0FBRUQ7SUF3QkksWUFBcUIsaUJBQXNFO1FBQXRFLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBcUQ7SUFDM0YsQ0FBQztJQXhCRCxpQkFBaUIsQ0FBRSxHQUEwQjtRQUN6QyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDO1lBQUMsTUFBTSxDQUFBO1FBQUMsQ0FBQztRQUU3QyxNQUFNLGVBQWUsR0FBRyxHQUFHLENBQUMsV0FBVyxDQUFBO1FBQ3ZDLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQTtRQUNsQixHQUFHLENBQUMsV0FBVyxDQUFDLENBQUMsV0FBVyxHQUFHLFVBQVUsR0FBK0I7WUFDcEUsTUFBTSxlQUFlLEdBQUcsR0FBRyxDQUFDLE9BQU8sQ0FBQTtZQUNuQyxHQUFHLENBQUMsT0FBTyxHQUFHLENBQU8sS0FBSztnQkFDdEIsTUFBTSxlQUFlLEdBQUcsTUFBTSxlQUFlLENBQUMsS0FBSyxDQUFDLENBQUE7Z0JBQ3BELE1BQU0sT0FBTyxHQUFHLGVBQWUsQ0FBQyxJQUFJLENBQUE7Z0JBRXBDLE1BQU0sVUFBVSxHQUFHLE1BQU0sS0FBSyxDQUFDLGlCQUFpQixDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsb0JBQW9CLENBQUMsZUFBZSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUE7Z0JBRXhHLEVBQUUsQ0FBQyxDQUFDLFVBQVUsS0FBSyxTQUFTLElBQUksYUFBYSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDckQsT0FBTyxDQUFDLElBQUksR0FBRyxXQUFXLE9BQU8sQ0FBQyxJQUFJLDRCQUE0QixVQUFVLEVBQUUsQ0FBQTtnQkFDbEYsQ0FBQztnQkFFRCxNQUFNLENBQUMsZUFBZSxDQUFBO1lBQzFCLENBQUMsQ0FBQSxDQUFBO1lBQ0QsZUFBZSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUE7UUFDbkMsQ0FBQyxDQUFBO0lBQ0wsQ0FBQztDQUlKO0FBRUQsaUJBQVMsZUFBZSxDQUFBIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgaWRlSGFza2VsbCBmcm9tICcuL2lkZS1oYXNrZWxsJ1xuXG5mdW5jdGlvbiBpc1RleHRUb29sdGlwICh0b29sdGlwOiBpZGVIYXNrZWxsLlRvb2x0aXApOiB0b29sdGlwIGlzIGlkZUhhc2tlbGwuVGV4dFRvb2x0aXAge1xuICByZXR1cm4gdHlwZW9mKHRvb2x0aXApID09PSAnb2JqZWN0JyAmJiAodG9vbHRpcCBhcyBpZGVIYXNrZWxsLlRleHRUb29sdGlwKS50ZXh0ICE9PSB1bmRlZmluZWRcbn1cblxuY2xhc3MgVG9vbHRpcE92ZXJyaWRlIHtcbiAgICBjb25zdW1lSGFza2VsbFVwaSAodXBpOiBpZGVIYXNrZWxsLkhhc2tlbGxVUEkpIHtcbiAgICAgICAgaWYgKCF1cGlbJ19fcHJvdG9fXyddLnNob3dUb29sdGlwKSB7IHJldHVybiB9XG4gICAgICAgIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTogbm8tdW5ib3VuZC1tZXRob2RcbiAgICAgICAgY29uc3QgcHJldlNob3dUb29sdGlwID0gdXBpLnNob3dUb29sdGlwXG4gICAgICAgIGNvbnN0IF90aGlzID0gdGhpc1xuICAgICAgICB1cGlbJ19fcHJvdG9fXyddLnNob3dUb29sdGlwID0gZnVuY3Rpb24gKGFyZzogaWRlSGFza2VsbC5TaG93VG9vbHRpcEFyZ3MpIHtcbiAgICAgICAgICAgIGNvbnN0IHByZXZUb29sdGlwRnVuYyA9IGFyZy50b29sdGlwXG4gICAgICAgICAgICBhcmcudG9vbHRpcCA9IGFzeW5jIChyYW5nZSkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IHRvb2x0aXBBbmRSYW5nZSA9IGF3YWl0IHByZXZUb29sdGlwRnVuYyhyYW5nZSlcbiAgICAgICAgICAgICAgICBjb25zdCB0b29sdGlwID0gdG9vbHRpcEFuZFJhbmdlLnRleHRcblxuICAgICAgICAgICAgICAgIGNvbnN0IGRlYnVnVmFsdWUgPSBhd2FpdCBfdGhpcy5yZXNvbHZlRXhwcmVzc2lvbihhcmcuZWRpdG9yLmdldFRleHRJbkJ1ZmZlclJhbmdlKHRvb2x0aXBBbmRSYW5nZS5yYW5nZSkpXG5cbiAgICAgICAgICAgICAgICBpZiAoZGVidWdWYWx1ZSAhPT0gdW5kZWZpbmVkICYmIGlzVGV4dFRvb2x0aXAodG9vbHRpcCkpIHtcbiAgICAgICAgICAgICAgICAgICAgdG9vbHRpcC50ZXh0ID0gYC0tdHlwZVxcbiR7dG9vbHRpcC50ZXh0fVxcbi0tY3VycmVudCBkZWJ1ZyB2YWx1ZVxcbiR7ZGVidWdWYWx1ZX1gXG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRvb2x0aXBBbmRSYW5nZVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcHJldlNob3dUb29sdGlwLmNhbGwodGhpcywgYXJnKVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgY29uc3RydWN0b3IgKHByaXZhdGUgcmVzb2x2ZUV4cHJlc3Npb246IChleHByZXNzaW9uOiBzdHJpbmcpID0+IFByb21pc2U8c3RyaW5nIHwgdW5kZWZpbmVkPikge1xuICAgIH1cbn1cblxuZXhwb3J0ID0gVG9vbHRpcE92ZXJyaWRlXG4iXX0=