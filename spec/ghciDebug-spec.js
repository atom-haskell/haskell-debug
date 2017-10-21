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
    beforeEach(() => __awaiter(this, void 0, void 0, function* () {
        session = new GHCIDebug.GHCIDebug();
        return session.loadModule(path.resolve(__dirname, '../spec/test.hs'));
    }));
    it('breaks at breakpoints', (done) => __awaiter(this, void 0, void 0, function* () {
        yield session.addBreakpoint('test1');
        session.on('line-changed', (info) => {
            done();
        });
        yield session.startDebug('test1');
    }));
    it('reports no history', (done) => __awaiter(this, void 0, void 0, function* () {
        yield session.addBreakpoint('test1');
        session.on('line-changed', (info) => {
            expect(info.historyLength).toBe(0);
            done();
        });
        yield session.startDebug('test1');
    }));
    it('reports history', (done) => __awaiter(this, void 0, void 0, function* () {
        yield session.addBreakpoint('test2_helper');
        session.on('line-changed', (info) => {
            expect(info.historyLength).toBe(1);
            done();
        });
        yield session.startDebug('test2');
    }));
    it('reports bindings', (done) => __awaiter(this, void 0, void 0, function* () {
        yield session.addBreakpoint('test2_helper');
        session.on('line-changed', (info) => {
            expect(info.localBindings).toEqual(['_result :: [Char] = _']);
            done();
        });
        yield session.startDebug('test2');
    }));
    describe('expressions', () => {
        it('evaluates variables', (done) => {
            (() => __awaiter(this, void 0, void 0, function* () {
                yield session.run('test3_value');
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
                yield session.run('let temp1 = -4');
                yield session.run('temp1');
                yield session.resolveExpression('test3_value + 3');
                expect((yield session.run('temp1'))).toBe('-4');
            }))().then(() => done()).catch(() => done.fail());
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2hjaURlYnVnLXNwZWMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvc3BlYy9naGNpRGVidWctc3BlYy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O0FBQUEsOENBQThDO0FBQzlDLDZCQUE2QjtBQUU3QixJQUFJLGVBQWUsR0FBRyxRQUFRLENBQUE7QUFJOUIsRUFBRSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBRXhCLE9BQU8sQ0FBQyxJQUFJLENBQUMscURBQXFELENBQUMsQ0FBQTtJQUNuRSxlQUFlLEdBQUcsU0FBUyxDQUFBO0FBQzdCLENBQUM7QUFFRCxlQUFlLENBQUMsV0FBVyxFQUFFO0lBQzNCLElBQUksT0FBNEIsQ0FBQTtJQUVoQyxVQUFVLENBQUM7UUFDVCxPQUFPLEdBQUcsSUFBSSxTQUFTLENBQUMsU0FBUyxFQUFFLENBQUE7UUFDbkMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUUsaUJBQWlCLENBQUMsQ0FBQyxDQUFBO0lBRXZFLENBQUMsQ0FBQSxDQUFDLENBQUE7SUFFRixFQUFFLENBQUMsdUJBQXVCLEVBQUUsQ0FBTyxJQUFJO1FBQ3JDLE1BQU0sT0FBTyxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUMsQ0FBQTtRQUNwQyxPQUFPLENBQUMsRUFBRSxDQUFDLGNBQWMsRUFBRSxDQUFDLElBQXlCO1lBQ25ELElBQUksRUFBRSxDQUFBO1FBQ1IsQ0FBQyxDQUFDLENBQUE7UUFDRixNQUFNLE9BQU8sQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLENBQUE7SUFDbkMsQ0FBQyxDQUFBLENBQUMsQ0FBQTtJQUVGLEVBQUUsQ0FBQyxvQkFBb0IsRUFBRSxDQUFPLElBQUk7UUFDbEMsTUFBTSxPQUFPLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxDQUFBO1FBQ3BDLE9BQU8sQ0FBQyxFQUFFLENB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SUFBSSxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsTUFBTSxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQTtRQUNsRCxDQUFDLENBQUMsQ0FBQTtJQUNKLENBQUMsQ0FBQyxDQUFBO0FBQ0osQ0FBQyxDQUFDLENBQUEiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgR0hDSURlYnVnID0gcmVxdWlyZSgnLi4vbGliL0dIQ0lEZWJ1ZycpXG5pbXBvcnQgcGF0aCA9IHJlcXVpcmUoJ3BhdGgnKVxuXG5sZXQgdG9wRGVzY3JpYmVGdW5jID0gZGVzY3JpYmVcblxuLy8gcnVuIHRoaXMgd2l0aCBqYXNtaW5lIHYyLjRcbi8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTogbm8tc3RyaW5nLWxpdGVyYWxcbmlmICghamFzbWluZVsndmVyc2lvbiddKSB7LypkZWZpbmVkIGluIDIueCovXG4gIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTogbm8tY29uc29sZVxuICBjb25zb2xlLndhcm4oJ1dBUk46IGdoY2lEZWJ1Zy1zcGVjIGNhbm5vdCBiZSBydW4gaW4gamFzbWluZSB2IDwgMicpXG4gIHRvcERlc2NyaWJlRnVuYyA9IHhkZXNjcmliZVxufVxuXG50b3BEZXNjcmliZUZ1bmMoJ0dIQ0lEZWJ1ZycsICgpID0+IHtcbiAgbGV0IHNlc3Npb246IEdIQ0lEZWJ1Zy5HSENJRGVidWdcblxuICBiZWZvcmVFYWNoKGFzeW5jICgpID0+IHtcbiAgICBzZXNzaW9uID0gbmV3IEdIQ0lEZWJ1Zy5HSENJRGVidWcoKVxuICAgIHJldHVybiBzZXNzaW9uLmxvYWRNb2R1bGUocGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJy4uL3NwZWMvdGVzdC5ocycpKVxuICAgIC8vIHJlbG9hZCB0aGUgbW9kdWxlIGZvciBhIGNsZWFuIGNvcHkgZXZlcnkgdGltZVxuICB9KVxuXG4gIGl0KCdicmVha3MgYXQgYnJlYWtwb2ludHMnLCBhc3luYyAoZG9uZSkgPT4ge1xuICAgIGF3YWl0IHNlc3Npb24uYWRkQnJlYWtwb2ludCgndGVzdDEnKVxuICAgIHNlc3Npb24ub24oJ2xpbmUtY2hhbmdlZCcsIChpbmZvOiBHSENJRGVidWcuQnJlYWtJbmZvKSA9PiB7XG4gICAgICBkb25lKClcbiAgICB9KVxuICAgIGF3YWl0IHNlc3Npb24uc3RhcnREZWJ1ZygndGVzdDEnKVxuICB9KVxuXG4gIGl0KCdyZXBvcnRzIG5vIGhpc3RvcnknLCBhc3luYyAoZG9uZSkgPT4ge1xuICAgIGF3YWl0IHNlc3Npb24uYWRkQnJlYWtwb2ludCgndGVzdDEnKVxuICAgIHNlc3Npb24ub24oJ2xpbmUtY2hhbmdlZCcsIChpbmZvOiBHSENJRGVidWcuQnJlYWtJbmZvKSA9PiB7XG4gICAgICBleHBlY3QoaW5mby5oaXN0b3J5TGVuZ3RoKS50b0JlKDApXG4gICAgICBkb25lKClcbiAgICB9KVxuICAgIGF3YWl0IHNlc3Npb24uc3RhcnREZWJ1ZygndGVzdDEnKVxuICB9KVxuXG4gIGl0KCdyZXBvcnRzIGhpc3RvcnknLCBhc3luYyAoZG9uZSkgPT4ge1xuICAgIGF3YWl0IHNlc3Npb24uYWRkQnJlYWtwb2ludCgndGVzdDJfaGVscGVyJylcbiAgICBzZXNzaW9uLm9uKCdsaW5lLWNoYW5nZWQnLCAoaW5mbzogR0hDSURlYnVnLkJyZWFrSW5mbykgPT4ge1xuICAgICAgZXhwZWN0KGluZm8uaGlzdG9yeUxlbmd0aCkudG9CZSgxKVxuICAgICAgZG9uZSgpXG4gICAgfSlcbiAgICBhd2FpdCBzZXNzaW9uLnN0YXJ0RGVidWcoJ3Rlc3QyJylcbiAgfSlcblxuICBpdCgncmVwb3J0cyBiaW5kaW5ncycsIGFzeW5jIChkb25lKSA9PiB7XG4gICAgYXdhaXQgc2Vzc2lvbi5hZGRCcmVha3BvaW50KCd0ZXN0Ml9oZWxwZXInKVxuICAgIHNlc3Npb24ub24oJ2xpbmUtY2hhbmdlZCcsIChpbmZvOiBHSENJRGVidWcuQnJlYWtJbmZvKSA9PiB7XG4gICAgICBleHBlY3QoaW5mby5sb2NhbEJpbmRpbmdzKS50b0VxdWFsKFsnX3Jlc3VsdCA6OiBbQ2hhcl0gPSBfJ10pXG4gICAgICBkb25lKClcbiAgICB9KVxuICAgIGF3YWl0IHNlc3Npb24uc3RhcnREZWJ1ZygndGVzdDInKVxuICB9KVxuXG4gIGRlc2NyaWJlKCdleHByZXNzaW9ucycsICgpID0+IHtcbiAgICBpdCgnZXZhbHVhdGVzIHZhcmlhYmxlcycsIChkb25lKSA9PiB7XG4gICAgICAoYXN5bmMgKCkgPT4ge1xuICAgICAgICBhd2FpdCBzZXNzaW9uLnJ1bigndGVzdDNfdmFsdWUnKVxuICAgICAgICBleHBlY3QoKGF3YWl0IHNlc3Npb24ucmVzb2x2ZUV4cHJlc3Npb24oJ3Rlc3QzX3ZhbHVlJykpKS50b0JlKCczJylcbiAgICAgIH0pKCkudGhlbigoKSA9PiBkb25lKCkpLmNhdGNoKCgpID0+IGRvbmUuZmFpbCgpKVxuICAgIH0pXG5cbiAgICBpdCgnZXZhbHVhdGVzIGV4cHJlc3Npb25zJywgKGRvbmUpID0+IHtcbiAgICAgIChhc3luYyAoKSA9PiB7XG4gICAgICAgIGV4cGVjdCgoYXdhaXQgc2Vzc2lvbi5yZXNvbHZlRXhwcmVzc2lvbigndGVzdDNfdmFsdWUgKyAzJykpKS50b0JlKCcoX3QxOjpJbnRlZ2VyKScpXG4gICAgICB9KSgpLnRoZW4oKCkgPT4gZG9uZSgpKS5jYXRjaCgoKSA9PiBkb25lLmZhaWwoKSlcbiAgICB9KVxuXG4gICAgaXQoXCJkb2Vzbid0IG92ZXJyaWRlIHRlbXAobikgdmFsdWVzXCIsIChkb25lKSA9PiB7XG4gICAgICAoYXN5bmMgKCkgPT4ge1xuICAgICAgICBhd2FpdCBzZXNzaW9uLnJ1bignbGV0IHRlbXAxID0gLTQnKVxuICAgICAgICBhd2FpdCBzZXNzaW9uLnJ1bigndGVtcDEnKVxuICAgICAgICBhd2FpdCBzZXNzaW9uLnJlc29sdmVFeHByZXNzaW9uKCd0ZXN0M192YWx1ZSArIDMnKVxuICAgICAgICBleHBlY3QoKGF3YWl0IHNlc3Npb24ucnVuKCd0ZW1wMScpKSkudG9CZSgnLTQnKVxuICAgICAgfSkoKS50aGVuKCgpID0+IGRvbmUoKSkuY2F0Y2goKCkgPT4gZG9uZS5mYWlsKCkpXG4gICAgfSlcbiAgfSlcbn0pXG4iXX0=