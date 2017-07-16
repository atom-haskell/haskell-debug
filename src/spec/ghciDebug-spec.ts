import GHCIDebug = require("../lib/GHCIDebug");
import path = require("path");

var topDescribeFunc = describe;

// run this with jasmine v2.4
if(!jasmine["version"]){/*defined in 2.x*/
    console.warn("WARN: ghciDebug-spec cannot be run in jasmine v < 2");
    topDescribeFunc = xdescribe;
}

topDescribeFunc("GHCIDebug", () => {
    var session: GHCIDebug.GHCIDebug;

    beforeEach(() => {
        session = new GHCIDebug.GHCIDebug();
        session.loadModule(path.resolve(__dirname, "../spec/test.hs"));
        // reload the module for a clean copy every time
    })

    it("breaks at breakpoints", function (done){
        session.addBreakpoint("test1");
        session.emitter.on("line-changed", (info: GHCIDebug.BreakInfo) => {
            done();
        })
        session.startDebug("test1");
    })

    it("reports no history", function (done){
        session.addBreakpoint("test1");
        session.emitter.on("line-changed", (info: GHCIDebug.BreakInfo) => {
            expect(info.historyLength).toBe(0);
            done();
        })
        session.startDebug("test1");
    })

    it("reports history", function (done){
        session.addBreakpoint("test2_helper");
        session.emitter.on("line-changed", (info: GHCIDebug.BreakInfo) => {
            expect(info.historyLength).toBe(1);
            done();
        })
        session.startDebug("test2");
    })

    it("reports bindings", function (done){
        session.addBreakpoint("test2_helper");
        session.emitter.on("line-changed", (info: GHCIDebug.BreakInfo) => {
            expect(info.localBindings).toEqual(["_result :: [Char] = _"]);
            done();
        })
        session.startDebug("test2");
    })

    describe("expressions" , () => {
        it("evaluates variables", function (done){
            (async () => {
                session.run("test3_value");
                expect((await session.resolveExpression("test3_value"))).toBe("3");
            })().then(() => done()).catch(() => done.fail());
        })

        it("evaluates expressions", function (done){
            (async () => {
                expect((await session.resolveExpression("test3_value + 3"))).toBe("(_t1::Integer)");
            })().then(() => done()).catch(() => done.fail());
        })

        it("doesn't override temp(n) values", function (done){
            (async () => {
                session.run("let temp1 = -4");
                session.run("temp1");
                session.resolveExpression("test3_value + 3");
                expect((await session.run("temp1"))).toBe("-4");
            })().then(() => done()).catch(() => done.fail());
        })
    })
})
