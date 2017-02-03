interface Breakpoint{
    line: number // 1 is the greatest number this can contain
    file: string // absolute path
}

type ExceptionBreakLevels = "none" | "exceptions" | "errors";
