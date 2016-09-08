import atomAPI = require("atom");
import {GHCIDebug} from "./GHCIDebug"

interface HaskellUPIContainer{
    registerPlugin(plugin: atomAPI.CompositeDisposable): HaskellUPI;
}

type Tooltip = {
    text: string;
    highlighter: string
} | {
    html: string;
} | string;

interface TooltipAndRange{
    range: TextBuffer.IRange;
    text: Tooltip;
}

type TooltipContainer = TooltipAndRange | Promise<TooltipAndRange>

interface ShowTooltipArgs{
    pos: TextBuffer.IPoint;
    editor: AtomCore.IEditor;
    eventType: "mouse" | "selection" | "context";
    tooltip: (range: TextBuffer.IRange) => TooltipContainer;
}

interface HaskellUPI{
    onShouldShowTooltip(callback: (editor: AtomCore.IEditor, crange: TextBuffer.IRange,
        type: "mouse" | "selection") => TooltipContainer);
    showTooltip(arg: ShowTooltipArgs);
}

class TooltipOverride {
    consumeHaskellUpi(_upi: HaskellUPIContainer){
        var pluginDisposable = new atomAPI.CompositeDisposable();
        var upi = _upi.registerPlugin(pluginDisposable);
        var prevShowTooltip = upi.showTooltip;
        var _this = this;
        upi["__proto__"].showTooltip = function (arg: ShowTooltipArgs) {
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
