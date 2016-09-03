interface Breakpoint{
    line: number
    file: string
    marker: AtomCore.IDisplayBufferMarker
}

type ExceptionBreakLevels = "none" | "exceptions" | "errors";
