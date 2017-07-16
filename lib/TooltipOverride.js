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
    consumeHaskellUpi(upi) {
        if (!upi["__proto__"].showTooltip) {
            return;
        }
        var prevShowTooltip = upi.showTooltip;
        var _this = this;
        upi["__proto__"].showTooltip = function (arg) {
            var prevTooltipFunc = arg.tooltip;
            arg.tooltip = (range) => __awaiter(this, void 0, void 0, function* () {
                var tooltipAndRange = yield prevTooltipFunc(range);
                var tooltip = tooltipAndRange.text;
                var debugValue = yield _this.resolveExpression(arg.editor.getTextInRange(tooltipAndRange.range));
                if (debugValue !== null && typeof (tooltip) == "object" && tooltip["text"] !== undefined) {
                    tooltip["text"] = `--type\n${tooltip["text"]}\n--current debug value\n${debugValue}`;
                }
                return tooltipAndRange;
            });
            prevShowTooltip.call(this, arg);
        };
    }
}
module.exports = TooltipOverride;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVG9vbHRpcE92ZXJyaWRlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL1Rvb2x0aXBPdmVycmlkZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFJQTtJQXVCSSxZQUFvQixpQkFBMEQ7UUFBMUQsc0JBQWlCLEdBQWpCLGlCQUFpQixDQUF5QztJQUM5RSxDQUFDO0lBdkJELGlCQUFpQixDQUFDLEdBQTBCO1FBQ3hDLEVBQUUsQ0FBQSxDQUFDLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUM7WUFBQyxNQUFNLENBQUE7UUFBQyxDQUFDO1FBQzVDLElBQUksZUFBZSxHQUFHLEdBQUcsQ0FBQyxXQUFXLENBQUM7UUFDdEMsSUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDO1FBQ2pCLEdBQUcsQ0FBQyxXQUFXLENBQUMsQ0FBQyxXQUFXLEdBQUcsVUFBVSxHQUErQjtZQUNwRSxJQUFJLGVBQWUsR0FBRyxHQUFHLENBQUMsT0FBTyxDQUFDO1lBQ2xDLEdBQUcsQ0FBQyxPQUFPLEdBQUcsQ0FBTyxLQUFLO2dCQUN0QixJQUFJLGVBQWUsR0FBRyxNQUFNLGVBQWUsQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDbkQsSUFBSSxPQUFPLEdBQUcsZUFBZSxDQUFDLElBQUksQ0FBQztnQkFFbkMsSUFBSSxVQUFVLEdBQUcsTUFBTSxLQUFLLENBQUMsaUJBQWlCLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxjQUFjLENBQUMsZUFBZSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7Z0JBRWpHLEVBQUUsQ0FBQSxDQUFDLFVBQVUsS0FBSyxJQUFJLElBQUksT0FBTSxDQUFDLE9BQU8sQ0FBQyxJQUFJLFFBQVEsSUFBSSxPQUFPLENBQUMsTUFBTSxDQUFDLEtBQUssU0FBUyxDQUFDLENBQUEsQ0FBQztvQkFDcEYsT0FBTyxDQUFDLE1BQU0sQ0FBQyxHQUFHLFdBQVcsT0FBTyxDQUFDLE1BQU0sQ0FBQyw0QkFBNEIsVUFBVSxFQUFFLENBQUE7Z0JBQ3hGLENBQUM7Z0JBRUQsTUFBTSxDQUFDLGVBQWUsQ0FBQztZQUMzQixDQUFDLENBQUEsQ0FBQTtZQUNELGVBQWUsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBQ3BDLENBQUMsQ0FBQTtJQUNMLENBQUM7Q0FJSjtBQUVELGlCQUFTLGVBQWUsQ0FBQSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBhdG9tQVBJID0gcmVxdWlyZShcImF0b21cIik7XG5pbXBvcnQge0dIQ0lEZWJ1Z30gZnJvbSBcIi4vR0hDSURlYnVnXCJcbmltcG9ydCAqIGFzIGlkZUhhc2tlbGwgZnJvbSBcIi4vaWRlLWhhc2tlbGxcIlxuXG5jbGFzcyBUb29sdGlwT3ZlcnJpZGUge1xuICAgIGNvbnN1bWVIYXNrZWxsVXBpKHVwaTogaWRlSGFza2VsbC5IYXNrZWxsVVBJKXtcbiAgICAgICAgaWYoIXVwaVtcIl9fcHJvdG9fX1wiXS5zaG93VG9vbHRpcCkgeyByZXR1cm4gfVxuICAgICAgICB2YXIgcHJldlNob3dUb29sdGlwID0gdXBpLnNob3dUb29sdGlwO1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICB1cGlbXCJfX3Byb3RvX19cIl0uc2hvd1Rvb2x0aXAgPSBmdW5jdGlvbiAoYXJnOiBpZGVIYXNrZWxsLlNob3dUb29sdGlwQXJncykge1xuICAgICAgICAgICAgdmFyIHByZXZUb29sdGlwRnVuYyA9IGFyZy50b29sdGlwO1xuICAgICAgICAgICAgYXJnLnRvb2x0aXAgPSBhc3luYyAocmFuZ2UpID0+IHtcbiAgICAgICAgICAgICAgICB2YXIgdG9vbHRpcEFuZFJhbmdlID0gYXdhaXQgcHJldlRvb2x0aXBGdW5jKHJhbmdlKTtcbiAgICAgICAgICAgICAgICB2YXIgdG9vbHRpcCA9IHRvb2x0aXBBbmRSYW5nZS50ZXh0O1xuXG4gICAgICAgICAgICAgICAgdmFyIGRlYnVnVmFsdWUgPSBhd2FpdCBfdGhpcy5yZXNvbHZlRXhwcmVzc2lvbihhcmcuZWRpdG9yLmdldFRleHRJblJhbmdlKHRvb2x0aXBBbmRSYW5nZS5yYW5nZSkpO1xuXG4gICAgICAgICAgICAgICAgaWYoZGVidWdWYWx1ZSAhPT0gbnVsbCAmJiB0eXBlb2YodG9vbHRpcCkgPT0gXCJvYmplY3RcIiAmJiB0b29sdGlwW1widGV4dFwiXSAhPT0gdW5kZWZpbmVkKXtcbiAgICAgICAgICAgICAgICAgICAgdG9vbHRpcFtcInRleHRcIl0gPSBgLS10eXBlXFxuJHt0b29sdGlwW1widGV4dFwiXX1cXG4tLWN1cnJlbnQgZGVidWcgdmFsdWVcXG4ke2RlYnVnVmFsdWV9YFxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJldHVybiB0b29sdGlwQW5kUmFuZ2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBwcmV2U2hvd1Rvb2x0aXAuY2FsbCh0aGlzLCBhcmcpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgY29uc3RydWN0b3IocHJpdmF0ZSByZXNvbHZlRXhwcmVzc2lvbjogKGV4cHJlc3Npb246IHN0cmluZykgPT4gUHJvbWlzZTxzdHJpbmc+KXtcbiAgICB9XG59XG5cbmV4cG9ydCA9IFRvb2x0aXBPdmVycmlkZVxuIl19