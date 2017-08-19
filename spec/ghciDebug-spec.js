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
let topDescribeFunc = describe;
if (!jasmine['version']) {
    console.warn('WARN: ghciDebug-spec cannot be run in jasmine v < 2');
    topDescribeFunc = xdescribe;
}
topDescribeFunc('GHCIDebug', () => {
    let session;
    beforeEach(() => {
        session = new GHCIDebug.GHCIDebug();
        session.loadModule(path.resolve(__dirname, '../spec/test.hs'));
    });
    it('breaks at breakpoints', (done) => {
        session.addBreakpoint('test1');
        session.on('line-changed', (info) => {
            done();
        });
        session.startDebug('test1');
    });
    it('reports no history', (done) => {
        session.addBreakpoint('test1');
        session.on('line-changed', (info) => {
            expect(info.historyLength).toBe(0);
            done();
        });
        session.startDebug('test1');
    });
    it('reports history', (done) => {
        session.addBreakpoint('test2_helper');
        session.on('line-changed', (info) => {
            expect(info.historyLength).toBe(1);
            done();
        });
        session.startDebug('test2');
    });
    it('reports bindings', (done) => {
        session.addBreakpoint('test2_helper');
        session.on('line-changed', (info) => {
            expect(info.localBindings).toEqual(['_result :: [Char] = _']);
            done();
        });
        session.startDebug('test2');
    });
    describe('expressions', () => {
        it('evaluates variables', (done) => {
            (() => __awaiter(this, void 0, void 0, function* () {
                session.run('test3_value');
                expect((yield session.resolveExpression('test3_value'))).toBe('3');
            }))().then(() => done()).catch(() => done.fail());
        });
        it('evaluates expressions', (done) => {
            (() => __awaiter(this, void 0, void 0, function* () {
                expect((yield session.resolveExpression('test3_value + 3'))).toBe('(_t1::Integer)');
            }))().then(() => done()).catch(() => done.fail());
        });
        it("doesn't override temp(n) values", (done) => {
            (() => __awaiter(this, void 0, void 0, function* () {
                session.run('let temp1 = -4');
                session.run('temp1');
                session.resolveExpression('test3_value + 3');
                expect((yield session.run('temp1'))).toBe('-4');
            }))().then(() => done()).catch(() => done.fail());
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2hjaURlYnVnLXNwZWMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvc3BlYy9naGNpRGVidWctc3BlYy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O0FBQUEsOENBQThDO0FBQzlDLDZCQUE2QjtBQUU3QixJQUFJLGVBQWUsR0FBRyxRQUFRLENBQUE7QUFJOUIsRUFBRSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBRXhCLE9BQU8sQ0FBQyxJQUFJLENBQUMscURBQXFELENBQUMsQ0FBQTtJQUNuRSxlQUFlLEdBQUcsU0FBUyxDQUFBO0FBQzdCLENBQUM7QUFFRCxlQUFlLENBQUMsV0FBVyxFQUFFO0lBQzNCLElBQUksT0FBNEIsQ0FBQTtJQUVoQyxVQUFVLENBQUM7UUFDVCxPQUFPLEdBQUcsSUFBSSxTQUFTLENBQUMsU0FBUyxFQUFFLENBQUE7UUFDbkMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRSxpQkFBaUIsQ0FBQyxDQUFDLENBQUE7SUFFaEUsQ0FBQyxDQUFDLENBQUE7SUFFRixFQUFFLENBQUMsdUJBQXVCLEVBQUUsQ0FBQyxJQUFJO1FBQy9CLE9BQU8sQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDLENBQUE7UUFDOUIsT0FBTyxDQUFDLEVBQUUsQ0FBQyxjQUFjLEVBQUUsQ0FBQyxJQUF5QjtZQUNuRCxJQUFJLEVBQUUsQ0FBQTtRQUNSLENBQUMsQ0FBQyxDQUFBO1FBQ0YsT0FBTyxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsQ0FBQTtJQUM3QixDQUFDLENBQUMsQ0FBQTtJQUVGLEVBQUUsQ0FBQyxvQkFBb0IsRUFBRSxDQUFDLElBQUk7UUFDNUIsT0FBTyxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUMsQ0FBQTtRQUM5QixPQUFPLENBQUMsRUFBRSxDQUFDLGNBQWMsRUFBRSxDQUFDLElBQXlCO1lBQ25ELE1BQU0s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LENBQUMsQ0FBQTtBQUNKLENBQUMsQ0FBQyxDQUFBIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IEdIQ0lEZWJ1ZyA9IHJlcXVpcmUoJy4uL2xpYi9HSENJRGVidWcnKVxuaW1wb3J0IHBhdGggPSByZXF1aXJlKCdwYXRoJylcblxubGV0IHRvcERlc2NyaWJlRnVuYyA9IGRlc2NyaWJlXG5cbi8vIHJ1biB0aGlzIHdpdGggamFzbWluZSB2Mi40XG4vLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6IG5vLXN0cmluZy1saXRlcmFsXG5pZiAoIWphc21pbmVbJ3ZlcnNpb24nXSkgey8qZGVmaW5lZCBpbiAyLngqL1xuICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6IG5vLWNvbnNvbGVcbiAgY29uc29sZS53YXJuKCdXQVJOOiBnaGNpRGVidWctc3BlYyBjYW5ub3QgYmUgcnVuIGluIGphc21pbmUgdiA8IDInKVxuICB0b3BEZXNjcmliZUZ1bmMgPSB4ZGVzY3JpYmVcbn1cblxudG9wRGVzY3JpYmVGdW5jKCdHSENJRGVidWcnLCAoKSA9PiB7XG4gIGxldCBzZXNzaW9uOiBHSENJRGVidWcuR0hDSURlYnVnXG5cbiAgYmVmb3JlRWFjaCgoKSA9PiB7XG4gICAgc2Vzc2lvbiA9IG5ldyBHSENJRGVidWcuR0hDSURlYnVnKClcbiAgICBzZXNzaW9uLmxvYWRNb2R1bGUocGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJy4uL3NwZWMvdGVzdC5ocycpKVxuICAgIC8vIHJlbG9hZCB0aGUgbW9kdWxlIGZvciBhIGNsZWFuIGNvcHkgZXZlcnkgdGltZVxuICB9KVxuXG4gIGl0KCdicmVha3MgYXQgYnJlYWtwb2ludHMnLCAoZG9uZSkgPT4ge1xuICAgIHNlc3Npb24uYWRkQnJlYWtwb2ludCgndGVzdDEnKVxuICAgIHNlc3Npb24ub24oJ2xpbmUtY2hhbmdlZCcsIChpbmZvOiBHSENJRGVidWcuQnJlYWtJbmZvKSA9PiB7XG4gICAgICBkb25lKClcbiAgICB9KVxuICAgIHNlc3Npb24uc3RhcnREZWJ1ZygndGVzdDEnKVxuICB9KVxuXG4gIGl0KCdyZXBvcnRzIG5vIGhpc3RvcnknLCAoZG9uZSkgPT4ge1xuICAgIHNlc3Npb24uYWRkQnJlYWtwb2ludCgndGVzdDEnKVxuICAgIHNlc3Npb24ub24oJ2xpbmUtY2hhbmdlZCcsIChpbmZvOiBHSENJRGVidWcuQnJlYWtJbmZvKSA9PiB7XG4gICAgICBleHBlY3QoaW5mby5oaXN0b3J5TGVuZ3RoKS50b0JlKDApXG4gICAgICBkb25lKClcbiAgICB9KVxuICAgIHNlc3Npb24uc3RhcnREZWJ1ZygndGVzdDEnKVxuICB9KVxuXG4gIGl0KCdyZXBvcnRzIGhpc3RvcnknLCAoZG9uZSkgPT4ge1xuICAgIHNlc3Npb24uYWRkQnJlYWtwb2ludCgndGVzdDJfaGVscGVyJylcbiAgICBzZXNzaW9uLm9uKCdsaW5lLWNoYW5nZWQnLCAoaW5mbzogR0hDSURlYnVnLkJyZWFrSW5mbykgPT4ge1xuICAgICAgZXhwZWN0KGluZm8uaGlzdG9yeUxlbmd0aCkudG9CZSgxKVxuICAgICAgZG9uZSgpXG4gICAgfSlcbiAgICBzZXNzaW9uLnN0YXJ0RGVidWcoJ3Rlc3QyJylcbiAgfSlcblxuICBpdCgncmVwb3J0cyBiaW5kaW5ncycsIChkb25lKSA9PiB7XG4gICAgc2Vzc2lvbi5hZGRCcmVha3BvaW50KCd0ZXN0Ml9oZWxwZXInKVxuICAgIHNlc3Npb24ub24oJ2xpbmUtY2hhbmdlZCcsIChpbmZvOiBHSENJRGVidWcuQnJlYWtJbmZvKSA9PiB7XG4gICAgICBleHBlY3QoaW5mby5sb2NhbEJpbmRpbmdzKS50b0VxdWFsKFsnX3Jlc3VsdCA6OiBbQ2hhcl0gPSBfJ10pXG4gICAgICBkb25lKClcbiAgICB9KVxuICAgIHNlc3Npb24uc3RhcnREZWJ1ZygndGVzdDInKVxuICB9KVxuXG4gIGRlc2NyaWJlKCdleHByZXNzaW9ucycsICgpID0+IHtcbiAgICBpdCgnZXZhbHVhdGVzIHZhcmlhYmxlcycsIChkb25lKSA9PiB7XG4gICAgICAoYXN5bmMgKCkgPT4ge1xuICAgICAgICBzZXNzaW9uLnJ1bigndGVzdDNfdmFsdWUnKVxuICAgICAgICBleHBlY3QoKGF3YWl0IHNlc3Npb24ucmVzb2x2ZUV4cHJlc3Npb24oJ3Rlc3QzX3ZhbHVlJykpKS50b0JlKCczJylcbiAgICAgIH0pKCkudGhlbigoKSA9PiBkb25lKCkpLmNhdGNoKCgpID0+IGRvbmUuZmFpbCgpKVxuICAgIH0pXG5cbiAgICBpdCgnZXZhbHVhdGVzIGV4cHJlc3Npb25zJywgKGRvbmUpID0+IHtcbiAgICAgIChhc3luYyAoKSA9PiB7XG4gICAgICAgIGV4cGVjdCgoYXdhaXQgc2Vzc2lvbi5yZXNvbHZlRXhwcmVzc2lvbigndGVzdDNfdmFsdWUgKyAzJykpKS50b0JlKCcoX3QxOjpJbnRlZ2VyKScpXG4gICAgICB9KSgpLnRoZW4oKCkgPT4gZG9uZSgpKS5jYXRjaCgoKSA9PiBkb25lLmZhaWwoKSlcbiAgICB9KVxuXG4gICAgaXQoXCJkb2Vzbid0IG92ZXJyaWRlIHRlbXAobikgdmFsdWVzXCIsIChkb25lKSA9PiB7XG4gICAgICAoYXN5bmMgKCkgPT4ge1xuICAgICAgICBzZXNzaW9uLnJ1bignbGV0IHRlbXAxID0gLTQnKVxuICAgICAgICBzZXNzaW9uLnJ1bigndGVtcDEnKVxuICAgICAgICBzZXNzaW9uLnJlc29sdmVFeHByZXNzaW9uKCd0ZXN0M192YWx1ZSArIDMnKVxuICAgICAgICBleHBlY3QoKGF3YWl0IHNlc3Npb24ucnVuKCd0ZW1wMScpKSkudG9CZSgnLTQnKVxuICAgICAgfSkoKS50aGVuKCgpID0+IGRvbmUoKSkuY2F0Y2goKCkgPT4gZG9uZS5mYWlsKCkpXG4gICAgfSlcbiAgfSlcbn0pXG4iXX0=