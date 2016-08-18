import HaskellDebug = require("../lib/HaskellDebug");
import path = require("path");

describe("HaskellDebug", () => {
    var session: HaskellDebug.HaskellDebug;
    var spy: jasmine.Spy;

    beforeEach(() => {
        session = new HaskellDebug.HaskellDebug();
        session.loadModule(path.resolve(__dirname, "../spec/test.hs"));
        // reload the module for a clean copy every time
    })

    it("breaks at breakpoints", function (done){
        session.addBreakpoint("test1");
        session.emitter.on("line-changed", (info: HaskellDebug.BreakInfo) => {
            done();
        })
        session.startDebug("test1");
    })

    it("reports no history", function (done){
        session.addBreakpoint("test1");
        session.emitter.on("line-changed", (info: HaskellDebug.BreakInfo) => {
            expect(info.historyLength).toBe(0);
            done();
        })
        session.startDebug("test1");
    })

    fit("reports history", function (done){
        session.addBreakpoint("test2_helper");
        session.emitter.on("line-changed", (info: HaskellDebug.BreakInfo) => {
            expect(info.historyLength).toBe(1);
            done();
        })
        session.startDebug("test2");
    })
})
