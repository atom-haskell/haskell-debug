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
                const debugValue = yield _this.resolveExpression(arg.editor.getTextInRange(tooltipAndRange.range));
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVG9vbHRpcE92ZXJyaWRlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2xpYi9Ub29sdGlwT3ZlcnJpZGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBRUEsdUJBQXdCLE9BQTJCO0lBQ2pELE1BQU0sQ0FBQyxPQUFNLENBQUMsT0FBTyxDQUFDLEtBQUssUUFBUSxJQUFLLE9BQWtDLENBQUMsSUFBSSxLQUFLLFNBQVMsQ0FBQTtBQUMvRixDQUFDO0FBRUQ7SUF3QkksWUFBcUIsaUJBQXNFO1FBQXRFLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBcUQ7SUFDM0YsQ0FBQztJQXhCRCxpQkFBaUIsQ0FBRSxHQUEwQjtRQUN6QyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDO1lBQUMsTUFBTSxDQUFBO1FBQUMsQ0FBQztRQUU3QyxNQUFNLGVBQWUsR0FBRyxHQUFHLENBQUMsV0FBVyxDQUFBO1FBQ3ZDLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQTtRQUNsQixHQUFHLENBQUMsV0FBVyxDQUFDLENBQUMsV0FBVyxHQUFHLFVBQVUsR0FBK0I7WUFDcEUsTUFBTSxlQUFlLEdBQUcsR0FBRyxDQUFDLE9BQU8sQ0FBQTtZQUNuQyxHQUFHLENBQUMsT0FBTyxHQUFHLENBQU8sS0FBSztnQkFDdEIsTUFBTSxlQUFlLEdBQUcsTUFBTSxlQUFlLENBQUMsS0FBSyxDQUFDLENBQUE7Z0JBQ3BELE1BQU0sT0FBTyxHQUFHLGVBQWUsQ0FBQyxJQUFJLENBQUE7Z0JBRXBDLE1BQU0sVUFBVSxHQUFHLE1BQU0sS0FBSyxDQUFDLGlCQUFpQixDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsY0FBYyxDQUFDLGVBQWUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFBO2dCQUVsRyxFQUFFLENBQUMsQ0FBQyxVQUFVLEtBQUssU0FBUyxJQUFJLGFBQWEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQ3JELE9BQU8sQ0FBQyxJQUFJLEdBQUcsV0FBVyxPQUFPLENBQUMsSUFBSSw0QkFBNEIsVUFBVSxFQUFFLENBQUE7Z0JBQ2xGLENBQUM7Z0JBRUQsTUFBTSxDQUFDLGVBQWUsQ0FBQTtZQUMxQixDQUFDLENBQUEsQ0FBQTtZQUNELGVBQWUsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxDQUFBO1FBQ25DLENBQUMsQ0FBQTtJQUNMLENBQUM7Q0FJSjtBQUVELGlCQUFTLGVBQWUsQ0FBQSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGlkZUhhc2tlbGwgZnJvbSAnLi9pZGUtaGFza2VsbCdcblxuZnVuY3Rpb24gaXNUZXh0VG9vbHRpcCAodG9vbHRpcDogaWRlSGFza2VsbC5Ub29sdGlwKTogdG9vbHRpcCBpcyBpZGVIYXNrZWxsLlRleHRUb29sdGlwIHtcbiAgcmV0dXJuIHR5cGVvZih0b29sdGlwKSA9PT0gJ29iamVjdCcgJiYgKHRvb2x0aXAgYXMgaWRlSGFza2VsbC5UZXh0VG9vbHRpcCkudGV4dCAhPT0gdW5kZWZpbmVkXG59XG5cbmNsYXNzIFRvb2x0aXBPdmVycmlkZSB7XG4gICAgY29uc3VtZUhhc2tlbGxVcGkgKHVwaTogaWRlSGFza2VsbC5IYXNrZWxsVVBJKSB7XG4gICAgICAgIGlmICghdXBpWydfX3Byb3RvX18nXS5zaG93VG9vbHRpcCkgeyByZXR1cm4gfVxuICAgICAgICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6IG5vLXVuYm91bmQtbWV0aG9kXG4gICAgICAgIGNvbnN0IHByZXZTaG93VG9vbHRpcCA9IHVwaS5zaG93VG9vbHRpcFxuICAgICAgICBjb25zdCBfdGhpcyA9IHRoaXNcbiAgICAgICAgdXBpWydfX3Byb3RvX18nXS5zaG93VG9vbHRpcCA9IGZ1bmN0aW9uIChhcmc6IGlkZUhhc2tlbGwuU2hvd1Rvb2x0aXBBcmdzKSB7XG4gICAgICAgICAgICBjb25zdCBwcmV2VG9vbHRpcEZ1bmMgPSBhcmcudG9vbHRpcFxuICAgICAgICAgICAgYXJnLnRvb2x0aXAgPSBhc3luYyAocmFuZ2UpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCB0b29sdGlwQW5kUmFuZ2UgPSBhd2FpdCBwcmV2VG9vbHRpcEZ1bmMocmFuZ2UpXG4gICAgICAgICAgICAgICAgY29uc3QgdG9vbHRpcCA9IHRvb2x0aXBBbmRSYW5nZS50ZXh0XG5cbiAgICAgICAgICAgICAgICBjb25zdCBkZWJ1Z1ZhbHVlID0gYXdhaXQgX3RoaXMucmVzb2x2ZUV4cHJlc3Npb24oYXJnLmVkaXRvci5nZXRUZXh0SW5SYW5nZSh0b29sdGlwQW5kUmFuZ2UucmFuZ2UpKVxuXG4gICAgICAgICAgICAgICAgaWYgKGRlYnVnVmFsdWUgIT09IHVuZGVmaW5lZCAmJiBpc1RleHRUb29sdGlwKHRvb2x0aXApKSB7XG4gICAgICAgICAgICAgICAgICAgIHRvb2x0aXAudGV4dCA9IGAtLXR5cGVcXG4ke3Rvb2x0aXAudGV4dH1cXG4tLWN1cnJlbnQgZGVidWcgdmFsdWVcXG4ke2RlYnVnVmFsdWV9YFxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJldHVybiB0b29sdGlwQW5kUmFuZ2VcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHByZXZTaG93VG9vbHRpcC5jYWxsKHRoaXMsIGFyZylcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0cnVjdG9yIChwcml2YXRlIHJlc29sdmVFeHByZXNzaW9uOiAoZXhwcmVzc2lvbjogc3RyaW5nKSA9PiBQcm9taXNlPHN0cmluZyB8IHVuZGVmaW5lZD4pIHtcbiAgICB9XG59XG5cbmV4cG9ydCA9IFRvb2x0aXBPdmVycmlkZVxuIl19