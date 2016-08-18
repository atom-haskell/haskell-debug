"use strict";
const HaskellDebug = require("../lib/HaskellDebug");
const path = require("path");
describe("HaskellDebug", () => {
    var session;
    var spy;
    beforeEach(() => {
        session = new HaskellDebug.HaskellDebug();
        session.loadModule(path.resolve(__dirname, "../spec/test.hs"));
    });
    it("breaks at breakpoints", function (done) {
        session.addBreakpoint("test1");
        session.emitter.on("line-changed", (info) => {
            done();
        });
        session.startDebug("test1");
    });
    it("reports no history", function (done) {
        session.addBreakpoint("test1");
        session.emitter.on("line-changed", (info) => {
            expect(info.historyLength).toBe(0);
            done();
        });
        session.startDebug("test1");
    });
    it("reports history", function (done) {
        session.addBreakpoint("test2_helper");
        session.emitter.on("line-changed", (info) => {
            expect(info.historyLength).toBe(1);
            done();
        });
        session.startDebug("test2");
    });
});
