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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVG9vbHRpcE92ZXJyaWRlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2xpYi9Ub29sdGlwT3ZlcnJpZGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBSUE7SUF1QkksWUFBb0IsaUJBQTBEO1FBQTFELHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBeUM7SUFDOUUsQ0FBQztJQXZCRCxpQkFBaUIsQ0FBQyxHQUEwQjtRQUN4QyxFQUFFLENBQUEsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDO1lBQUMsTUFBTSxDQUFBO1FBQUMsQ0FBQztRQUM1QyxJQUFJLGVBQWUsR0FBRyxHQUFHLENBQUMsV0FBVyxDQUFDO1FBQ3RDLElBQUksS0FBSyxHQUFHLElBQUksQ0FBQztRQUNqQixHQUFHLENBQUMsV0FBVyxDQUFDLENBQUMsV0FBVyxHQUFHLFVBQVUsR0FBK0I7WUFDcEUsSUFBSSxlQUFlLEdBQUcsR0FBRyxDQUFDLE9BQU8sQ0FBQztZQUNsQyxHQUFHLENBQUMsT0FBTyxHQUFHLENBQU8sS0FBSztnQkFDdEIsSUFBSSxlQUFlLEdBQUcsTUFBTSxlQUFlLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQ25ELElBQUksT0FBTyxHQUFHLGVBQWUsQ0FBQyxJQUFJLENBQUM7Z0JBRW5DLElBQUksVUFBVSxHQUFHLE1BQU0sS0FBSyxDQUFDLGlCQUFpQixDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsY0FBYyxDQUFDLGVBQWUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO2dCQUVqRyxFQUFFLENBQUEsQ0FBQyxVQUFVLEtBQUssSUFBSSxJQUFJLE9BQU0sQ0FBQyxPQUFPLENBQUMsSUFBSSxRQUFRLElBQUksT0FBTyxDQUFDLE1BQU0sQ0FBQyxLQUFLLFNBQVMsQ0FBQyxDQUFBLENBQUM7b0JBQ3BGLE9BQU8sQ0FBQyxNQUFNLENBQUMsR0FBRyxXQUFXLE9BQU8sQ0FBQyxNQUFNLENBQUMsNEJBQTRCLFVBQVUsRUFBRSxDQUFBO2dCQUN4RixDQUFDO2dCQUVELE1BQU0sQ0FBQyxlQUFlLENBQUM7WUFDM0IsQ0FBQyxDQUFBLENBQUE7WUFDRCxlQUFlLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxHQUFHLENBQUMsQ0FBQztRQUNwQyxDQUFDLENBQUE7SUFDTCxDQUFDO0NBSUo7QUFFRCxpQkFBUyxlQUFlLENBQUEiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgYXRvbUFQSSA9IHJlcXVpcmUoXCJhdG9tXCIpO1xuaW1wb3J0IHtHSENJRGVidWd9IGZyb20gXCIuL0dIQ0lEZWJ1Z1wiXG5pbXBvcnQgKiBhcyBpZGVIYXNrZWxsIGZyb20gXCIuL2lkZS1oYXNrZWxsXCJcblxuY2xhc3MgVG9vbHRpcE92ZXJyaWRlIHtcbiAgICBjb25zdW1lSGFza2VsbFVwaSh1cGk6IGlkZUhhc2tlbGwuSGFza2VsbFVQSSl7XG4gICAgICAgIGlmKCF1cGlbXCJfX3Byb3RvX19cIl0uc2hvd1Rvb2x0aXApIHsgcmV0dXJuIH1cbiAgICAgICAgdmFyIHByZXZTaG93VG9vbHRpcCA9IHVwaS5zaG93VG9vbHRpcDtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgdXBpW1wiX19wcm90b19fXCJdLnNob3dUb29sdGlwID0gZnVuY3Rpb24gKGFyZzogaWRlSGFza2VsbC5TaG93VG9vbHRpcEFyZ3MpIHtcbiAgICAgICAgICAgIHZhciBwcmV2VG9vbHRpcEZ1bmMgPSBhcmcudG9vbHRpcDtcbiAgICAgICAgICAgIGFyZy50b29sdGlwID0gYXN5bmMgKHJhbmdlKSA9PiB7XG4gICAgICAgICAgICAgICAgdmFyIHRvb2x0aXBBbmRSYW5nZSA9IGF3YWl0IHByZXZUb29sdGlwRnVuYyhyYW5nZSk7XG4gICAgICAgICAgICAgICAgdmFyIHRvb2x0aXAgPSB0b29sdGlwQW5kUmFuZ2UudGV4dDtcblxuICAgICAgICAgICAgICAgIHZhciBkZWJ1Z1ZhbHVlID0gYXdhaXQgX3RoaXMucmVzb2x2ZUV4cHJlc3Npb24oYXJnLmVkaXRvci5nZXRUZXh0SW5SYW5nZSh0b29sdGlwQW5kUmFuZ2UucmFuZ2UpKTtcblxuICAgICAgICAgICAgICAgIGlmKGRlYnVnVmFsdWUgIT09IG51bGwgJiYgdHlwZW9mKHRvb2x0aXApID09IFwib2JqZWN0XCIgJiYgdG9vbHRpcFtcInRleHRcIl0gIT09IHVuZGVmaW5lZCl7XG4gICAgICAgICAgICAgICAgICAgIHRvb2x0aXBbXCJ0ZXh0XCJdID0gYC0tdHlwZVxcbiR7dG9vbHRpcFtcInRleHRcIl19XFxuLS1jdXJyZW50IGRlYnVnIHZhbHVlXFxuJHtkZWJ1Z1ZhbHVlfWBcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gdG9vbHRpcEFuZFJhbmdlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcHJldlNob3dUb29sdGlwLmNhbGwodGhpcywgYXJnKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgcmVzb2x2ZUV4cHJlc3Npb246IChleHByZXNzaW9uOiBzdHJpbmcpID0+IFByb21pc2U8c3RyaW5nPil7XG4gICAgfVxufVxuXG5leHBvcnQgPSBUb29sdGlwT3ZlcnJpZGVcbiJdfQ==