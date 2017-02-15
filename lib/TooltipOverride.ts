import atomAPI = require("atom");
import {GHCIDebug} from "./GHCIDebug"
import * as ideHaskell from "./ide-haskell"

class TooltipOverride {
    consumeHaskellUpi(upi: ideHaskell.HaskellUPI){
        var prevShowTooltip = upi.showTooltip;
        var _this = this;
        upi["__proto__"].showTooltip = function (arg: ideHaskell.ShowTooltipArgs) {
            var prevTooltipFunc = arg.tooltip;
            arg.tooltip = async (range) => {
                var tooltipAndRange = await prevTooltipFunc(range);
                var tooltip = tooltipAndRange.text;

                var debugValue = await _this.resolveExpression(arg.editor.getTextInRange(tooltipAndRange.range));

                if(debugValue !== null && typeof(tooltip) == "object" && tooltip["text"] !== undefined){
                    tooltip["text"] = `--type\n${tooltip["text"]}\n--current debug value\n${debugValue}`
                }

                return tooltipAndRange;
            }
            prevShowTooltip.call(this, arg);
        }
    }

    constructor(private resolveExpression: (expression: string) => Promise<string>){
    }
}

export = TooltipOverride
