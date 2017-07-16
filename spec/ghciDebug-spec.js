"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2hjaURlYnVnLXNwZWMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvc3BlYy9naGNpRGVidWctc3BlYy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O0FBQUEsOENBQStDO0FBQy9DLDZCQUE4QjtBQUU5QixJQUFJLGVBQWUsR0FBRyxRQUFRLENBQUM7QUFHL0IsRUFBRSxDQUFBLENBQUMsQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQSxDQUFDO0lBQ3BCLE9BQU8sQ0FBQyxJQUFJLENBQUMscURBQXFELENBQUMsQ0FBQztJQUNwRSxlQUFlLEdBQUcsU0FBUyxDQUFDO0FBQ2hDLENBQUM7QUFFRCxlQUFlLENBQUMsV0FBVyxFQUFFO0lBQ3pCLElBQUksT0FBNEIsQ0FBQztJQUVqQyxVQUFVLENBQUM7UUFDUCxPQUFPLEdBQUcsSUFBSSxTQUFTLENBQUMsU0FBUyxFQUFFLENBQUM7UUFDcEMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRSxpQkFBaUIsQ0FBQyxDQUFDLENBQUM7SUFFbkUsQ0FBQyxDQUFDLENBQUE7SUFFRixFQUFFLENBQUMsdUJBQXVCLEVBQUUsVUFBVSxJQUFJO1FBQ3RDLE9BQU8sQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDL0IsT0FBTyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsY0FBYyxFQUFFLENBQUMsSUFBeUI7WUFDekQsSUFBSSxFQUFFLENBQUM7UUFDWCxDQUFDLENBQUMsQ0FBQTtRQUNGLE9BQU8sQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDaEMsQ0FBQyxDQUFDLENBQUE7SUFFRixFQUFFLENBQUMsb0JBQW9CLEVBQUUsVUFBVSxJQUFJO1FBQ25DLE9BQU8sQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDL0IsT0FBTyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsY0FBYyxFQUFFLENB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Q0FBQyxDQUFDO1FBQ3JELENBQUMsQ0FBQyxDQUFBO0lBQ04sQ0FBQyxDQUFDLENBQUE7QUFDTixDQUFDLENBQUMsQ0FBQSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBHSENJRGVidWcgPSByZXF1aXJlKFwiLi4vbGliL0dIQ0lEZWJ1Z1wiKTtcbmltcG9ydCBwYXRoID0gcmVxdWlyZShcInBhdGhcIik7XG5cbnZhciB0b3BEZXNjcmliZUZ1bmMgPSBkZXNjcmliZTtcblxuLy8gcnVuIHRoaXMgd2l0aCBqYXNtaW5lIHYyLjRcbmlmKCFqYXNtaW5lW1widmVyc2lvblwiXSl7LypkZWZpbmVkIGluIDIueCovXG4gICAgY29uc29sZS53YXJuKFwiV0FSTjogZ2hjaURlYnVnLXNwZWMgY2Fubm90IGJlIHJ1biBpbiBqYXNtaW5lIHYgPCAyXCIpO1xuICAgIHRvcERlc2NyaWJlRnVuYyA9IHhkZXNjcmliZTtcbn1cblxudG9wRGVzY3JpYmVGdW5jKFwiR0hDSURlYnVnXCIsICgpID0+IHtcbiAgICB2YXIgc2Vzc2lvbjogR0hDSURlYnVnLkdIQ0lEZWJ1ZztcblxuICAgIGJlZm9yZUVhY2goKCkgPT4ge1xuICAgICAgICBzZXNzaW9uID0gbmV3IEdIQ0lEZWJ1Zy5HSENJRGVidWcoKTtcbiAgICAgICAgc2Vzc2lvbi5sb2FkTW9kdWxlKHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIFwiLi4vc3BlYy90ZXN0LmhzXCIpKTtcbiAgICAgICAgLy8gcmVsb2FkIHRoZSBtb2R1bGUgZm9yIGEgY2xlYW4gY29weSBldmVyeSB0aW1lXG4gICAgfSlcblxuICAgIGl0KFwiYnJlYWtzIGF0IGJyZWFrcG9pbnRzXCIsIGZ1bmN0aW9uIChkb25lKXtcbiAgICAgICAgc2Vzc2lvbi5hZGRCcmVha3BvaW50KFwidGVzdDFcIik7XG4gICAgICAgIHNlc3Npb24uZW1pdHRlci5vbihcImxpbmUtY2hhbmdlZFwiLCAoaW5mbzogR0hDSURlYnVnLkJyZWFrSW5mbykgPT4ge1xuICAgICAgICAgICAgZG9uZSgpO1xuICAgICAgICB9KVxuICAgICAgICBzZXNzaW9uLnN0YXJ0RGVidWcoXCJ0ZXN0MVwiKTtcbiAgICB9KVxuXG4gICAgaXQoXCJyZXBvcnRzIG5vIGhpc3RvcnlcIiwgZnVuY3Rpb24gKGRvbmUpe1xuICAgICAgICBzZXNzaW9uLmFkZEJyZWFrcG9pbnQoXCJ0ZXN0MVwiKTtcbiAgICAgICAgc2Vzc2lvbi5lbWl0dGVyLm9uKFwibGluZS1jaGFuZ2VkXCIsIChpbmZvOiBHSENJRGVidWcuQnJlYWtJbmZvKSA9PiB7XG4gICAgICAgICAgICBleHBlY3QoaW5mby5oaXN0b3J5TGVuZ3RoKS50b0JlKDApO1xuICAgICAgICAgICAgZG9uZSgpO1xuICAgICAgICB9KVxuICAgICAgICBzZXNzaW9uLnN0YXJ0RGVidWcoXCJ0ZXN0MVwiKTtcbiAgICB9KVxuXG4gICAgaXQoXCJyZXBvcnRzIGhpc3RvcnlcIiwgZnVuY3Rpb24gKGRvbmUpe1xuICAgICAgICBzZXNzaW9uLmFkZEJyZWFrcG9pbnQoXCJ0ZXN0Ml9oZWxwZXJcIik7XG4gICAgICAgIHNlc3Npb24uZW1pdHRlci5vbihcImxpbmUtY2hhbmdlZFwiLCAoaW5mbzogR0hDSURlYnVnLkJyZWFrSW5mbykgPT4ge1xuICAgICAgICAgICAgZXhwZWN0KGluZm8uaGlzdG9yeUxlbmd0aCkudG9CZSgxKTtcbiAgICAgICAgICAgIGRvbmUoKTtcbiAgICAgICAgfSlcbiAgICAgICAgc2Vzc2lvbi5zdGFydERlYnVnKFwidGVzdDJcIik7XG4gICAgfSlcblxuICAgIGl0KFwicmVwb3J0cyBiaW5kaW5nc1wiLCBmdW5jdGlvbiAoZG9uZSl7XG4gICAgICAgIHNlc3Npb24uYWRkQnJlYWtwb2ludChcInRlc3QyX2hlbHBlclwiKTtcbiAgICAgICAgc2Vzc2lvbi5lbWl0dGVyLm9uKFwibGluZS1jaGFuZ2VkXCIsIChpbmZvOiBHSENJRGVidWcuQnJlYWtJbmZvKSA9PiB7XG4gICAgICAgICAgICBleHBlY3QoaW5mby5sb2NhbEJpbmRpbmdzKS50b0VxdWFsKFtcIl9yZXN1bHQgOjogW0NoYXJdID0gX1wiXSk7XG4gICAgICAgICAgICBkb25lKCk7XG4gICAgICAgIH0pXG4gICAgICAgIHNlc3Npb24uc3RhcnREZWJ1ZyhcInRlc3QyXCIpO1xuICAgIH0pXG5cbiAgICBkZXNjcmliZShcImV4cHJlc3Npb25zXCIgLCAoKSA9PiB7XG4gICAgICAgIGl0KFwiZXZhbHVhdGVzIHZhcmlhYmxlc1wiLCBmdW5jdGlvbiAoZG9uZSl7XG4gICAgICAgICAgICAoYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgICAgIHNlc3Npb24ucnVuKFwidGVzdDNfdmFsdWVcIik7XG4gICAgICAgICAgICAgICAgZXhwZWN0KChhd2FpdCBzZXNzaW9uLnJlc29sdmVFeHByZXNzaW9uKFwidGVzdDNfdmFsdWVcIikpKS50b0JlKFwiM1wiKTtcbiAgICAgICAgICAgIH0pKCkudGhlbigoKSA9PiBkb25lKCkpLmNhdGNoKCgpID0+IGRvbmUuZmFpbCgpKTtcbiAgICAgICAgfSlcblxuICAgICAgICBpdChcImV2YWx1YXRlcyBleHByZXNzaW9uc1wiLCBmdW5jdGlvbiAoZG9uZSl7XG4gICAgICAgICAgICAoYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgICAgIGV4cGVjdCgoYXdhaXQgc2Vzc2lvbi5yZXNvbHZlRXhwcmVzc2lvbihcInRlc3QzX3ZhbHVlICsgM1wiKSkpLnRvQmUoXCIoX3QxOjpJbnRlZ2VyKVwiKTtcbiAgICAgICAgICAgIH0pKCkudGhlbigoKSA9PiBkb25lKCkpLmNhdGNoKCgpID0+IGRvbmUuZmFpbCgpKTtcbiAgICAgICAgfSlcblxuICAgICAgICBpdChcImRvZXNuJ3Qgb3ZlcnJpZGUgdGVtcChuKSB2YWx1ZXNcIiwgZnVuY3Rpb24gKGRvbmUpe1xuICAgICAgICAgICAgKGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgICAgICBzZXNzaW9uLnJ1bihcImxldCB0ZW1wMSA9IC00XCIpO1xuICAgICAgICAgICAgICAgIHNlc3Npb24ucnVuKFwidGVtcDFcIik7XG4gICAgICAgICAgICAgICAgc2Vzc2lvbi5yZXNvbHZlRXhwcmVzc2lvbihcInRlc3QzX3ZhbHVlICsgM1wiKTtcbiAgICAgICAgICAgICAgICBleHBlY3QoKGF3YWl0IHNlc3Npb24ucnVuKFwidGVtcDFcIikpKS50b0JlKFwiLTRcIik7XG4gICAgICAgICAgICB9KSgpLnRoZW4oKCkgPT4gZG9uZSgpKS5jYXRjaCgoKSA9PiBkb25lLmZhaWwoKSk7XG4gICAgICAgIH0pXG4gICAgfSlcbn0pXG4iXX0=