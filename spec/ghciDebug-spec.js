"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
const GHCIDebug = require("../lib/GHCIDebug");
const path = require("path");
var topDescribeFunc = describe;
if (!jasmine["version"]) {
    console.warn("WARN: ghciDebug-spec cannot be run in jasmine v < 2");
    topDescribeFunc = xdescribe;
}
topDescribeFunc("GHCIDebug", () => {
    var session;
    beforeEach(() => {
        session = new GHCIDebug.GHCIDebug();
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
    it("reports bindings", function (done) {
        session.addBreakpoint("test2_helper");
        session.emitter.on("line-changed", (info) => {
            expect(info.localBindings).toEqual(["_result :: [Char] = _"]);
            done();
        });
        session.startDebug("test2");
    });
    describe("expressions", () => {
        it("evaluates variables", function (done) {
            (() => __awaiter(this, void 0, void 0, function* () {
                session.run("test3_value");
                expect((yield session.resolveExpression("test3_value"))).toBe("3");
            }))().then(() => done()).catch(() => done.fail());
        });
        it("evaluates expressions", function (done) {
            (() => __awaiter(this, void 0, void 0, function* () {
                expect((yield session.resolveExpression("test3_value + 3"))).toBe("(_t1::Integer)");
            }))().then(() => done()).catch(() => done.fail());
        });
        it("doesn't override temp(n) values", function (done) {
            (() => __awaiter(this, void 0, void 0, function* () {
                session.run("let temp1 = -4");
                session.run("temp1");
                session.resolveExpression("test3_value + 3");
                expect((yield session.run("temp1"))).toBe("-4");
            }))().then(() => done()).catch(() => done.fail());
        });
    });
});
