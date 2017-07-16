import atomAPI = require("atom");

interface HaskellUPIContainer{
    registerPlugin(plugin: atomAPI.CompositeDisposable, name: string): HaskellUPI;
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
    getConfigParam(pluginName: string, name: string): Promise<any>;
}
