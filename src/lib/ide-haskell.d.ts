import atomAPI = require("atom");

interface HaskellUPIContainer{
    registerPlugin(plugin: atomAPI.CompositeDisposable, name: string): HaskellUPI;
}

type TextTooltip = {
    text: string;
    highlighter: string
}
type HTMLTooltip = {
    html: string;
}
type Tooltip = TextTooltip | HTMLTooltip | string;

interface TooltipAndRange{
    range: atomAPI.IRange;
    text: Tooltip;
}

type TooltipContainer = TooltipAndRange | Promise<TooltipAndRange>

interface ShowTooltipArgs{
    pos: atomAPI.IPoint;
    editor: atomAPI.TextEditor;
    eventType: "mouse" | "selection" | "context";
    tooltip: (range: atomAPI.IRange) => TooltipContainer;
}

interface HaskellUPI{
    onShouldShowTooltip(callback: (editor: atomAPI.TextEditor, crange: atomAPI.IRange,
        type: "mouse" | "selection") => TooltipContainer);
    showTooltip(arg: ShowTooltipArgs);
    getConfigParam(pluginName: string, name: string): Promise<any>;
}
