import HaskellDebug = require("../lib/HaskellDebug");
import path = require("path");

describe("breakpoints", () => {
    var session = new HaskellDebug.HaskellDebug();

    session.loadModule(path.resolve(__dirname, "../spec/test.hs"));
    session.addBreakpoint("main");
    var line_changed = false;
    it("breaks at breakpoints", function (done){
        this.timeout(0);
        session.emitter.on("line-changed", (info: HaskellDebug.BreakInfo) => {
            done();
        })
    })
    session.startDebug();
})
