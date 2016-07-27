import HaskellDebug = require("../lib/HaskellDebug");

describe("breakpoints", () => {
    var session = new HaskellDebug.HaskellDebug();

    session.loadModule("./test.hs");
    session.addBreakpoint("main");
    var line_changed = false;
    session.emitter.on("line-changed", (info: HaskellDebug.BreakInfo) => {
        line_changed = true;
    })
    session.emitter.on("debug-finished", () => {
        it("breaks at breakpoints", () => expect(line_changed).toBeTruthy)
    })
    session.startDebug();
})
