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
        session.emitter.on('line-changed', (info) => {
            done();
        });
        session.startDebug('test1');
    });
    it('reports no history', (done) => {
        session.addBreakpoint('test1');
        session.emitter.on('line-changed', (info) => {
            expect(info.historyLength).toBe(0);
            done();
        });
        session.startDebug('test1');
    });
    it('reports history', (done) => {
        session.addBreakpoint('test2_helper');
        session.emitter.on('line-changed', (info) => {
            expect(info.historyLength).toBe(1);
            done();
        });
        session.startDebug('test2');
    });
    it('reports bindings', (done) => {
        session.addBreakpoint('test2_helper');
        session.emitter.on('line-changed', (info) => {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2hjaURlYnVnLXNwZWMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvc3BlYy9naGNpRGVidWctc3BlYy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O0FBQUEsOENBQThDO0FBQzlDLDZCQUE2QjtBQUU3QixJQUFJLGVBQWUsR0FBRyxRQUFRLENBQUE7QUFHOUIsRUFBRSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBRXRCLE9BQU8sQ0FBQyxJQUFJLENBQUMscURBQXFELENBQUMsQ0FBQTtJQUNuRSxlQUFlLEdBQUcsU0FBUyxDQUFBO0FBQy9CLENBQUM7QUFFRCxlQUFlLENBQUMsV0FBVyxFQUFFO0lBQ3pCLElBQUksT0FBNEIsQ0FBQTtJQUVoQyxVQUFVLENBQUM7UUFDUCxPQUFPLEdBQUcsSUFBSSxTQUFTLENBQUMsU0FBUyxFQUFFLENBQUE7UUFDbkMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRSxpQkFBaUIsQ0FBQyxDQUFDLENBQUE7SUFFbEUsQ0FBQyxDQUFDLENBQUE7SUFFRixFQUFFLENBQUMsdUJBQXVCLEVBQUUsQ0FBQyxJQUFJO1FBQzdCLE9BQU8sQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDLENBQUE7UUFDOUIsT0FBTyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsY0FBYyxFQUFFLENBQUMsSUFBeUI7WUFDekQsSUFBSSxFQUFFLENBQUE7UUFDVixDQUFDLENBQUMsQ0FBQTtRQUNGLE9BQU8sQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLENBQUE7SUFDL0IsQ0FBQyxDQUFDLENBQUE7SUFFRixFQUFFLENBQUMsb0JBQW9CLEVBQUUsQ0FBQyxJQUFJO1FBQzFCLE9BQU8sQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDLENBQUE7UUFDOUIsT0FBTyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsY0FBYyxFQUFFLENB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Q0FBQyxDQUFBO1FBQ3BELENBQUMsQ0FBQyxDQUFBO0lBQ04sQ0FBQyxDQUFDLENBQUE7QUFDTixDQUFDLENBQUMsQ0FBQSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBHSENJRGVidWcgPSByZXF1aXJlKCcuLi9saWIvR0hDSURlYnVnJylcbmltcG9ydCBwYXRoID0gcmVxdWlyZSgncGF0aCcpXG5cbmxldCB0b3BEZXNjcmliZUZ1bmMgPSBkZXNjcmliZVxuXG4vLyBydW4gdGhpcyB3aXRoIGphc21pbmUgdjIuNFxuaWYgKCFqYXNtaW5lWyd2ZXJzaW9uJ10pIHsvKmRlZmluZWQgaW4gMi54Ki9cbiAgICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6IG5vLWNvbnNvbGVcbiAgICBjb25zb2xlLndhcm4oJ1dBUk46IGdoY2lEZWJ1Zy1zcGVjIGNhbm5vdCBiZSBydW4gaW4gamFzbWluZSB2IDwgMicpXG4gICAgdG9wRGVzY3JpYmVGdW5jID0geGRlc2NyaWJlXG59XG5cbnRvcERlc2NyaWJlRnVuYygnR0hDSURlYnVnJywgKCkgPT4ge1xuICAgIGxldCBzZXNzaW9uOiBHSENJRGVidWcuR0hDSURlYnVnXG5cbiAgICBiZWZvcmVFYWNoKCgpID0+IHtcbiAgICAgICAgc2Vzc2lvbiA9IG5ldyBHSENJRGVidWcuR0hDSURlYnVnKClcbiAgICAgICAgc2Vzc2lvbi5sb2FkTW9kdWxlKHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICcuLi9zcGVjL3Rlc3QuaHMnKSlcbiAgICAgICAgLy8gcmVsb2FkIHRoZSBtb2R1bGUgZm9yIGEgY2xlYW4gY29weSBldmVyeSB0aW1lXG4gICAgfSlcblxuICAgIGl0KCdicmVha3MgYXQgYnJlYWtwb2ludHMnLCAoZG9uZSkgPT4ge1xuICAgICAgICBzZXNzaW9uLmFkZEJyZWFrcG9pbnQoJ3Rlc3QxJylcbiAgICAgICAgc2Vzc2lvbi5lbWl0dGVyLm9uKCdsaW5lLWNoYW5nZWQnLCAoaW5mbzogR0hDSURlYnVnLkJyZWFrSW5mbykgPT4ge1xuICAgICAgICAgICAgZG9uZSgpXG4gICAgICAgIH0pXG4gICAgICAgIHNlc3Npb24uc3RhcnREZWJ1ZygndGVzdDEnKVxuICAgIH0pXG5cbiAgICBpdCgncmVwb3J0cyBubyBoaXN0b3J5JywgKGRvbmUpID0+IHtcbiAgICAgICAgc2Vzc2lvbi5hZGRCcmVha3BvaW50KCd0ZXN0MScpXG4gICAgICAgIHNlc3Npb24uZW1pdHRlci5vbignbGluZS1jaGFuZ2VkJywgKGluZm86IEdIQ0lEZWJ1Zy5CcmVha0luZm8pID0+IHtcbiAgICAgICAgICAgIGV4cGVjdChpbmZvLmhpc3RvcnlMZW5ndGgpLnRvQmUoMClcbiAgICAgICAgICAgIGRvbmUoKVxuICAgICAgICB9KVxuICAgICAgICBzZXNzaW9uLnN0YXJ0RGVidWcoJ3Rlc3QxJylcbiAgICB9KVxuXG4gICAgaXQoJ3JlcG9ydHMgaGlzdG9yeScsIChkb25lKSA9PiB7XG4gICAgICAgIHNlc3Npb24uYWRkQnJlYWtwb2ludCgndGVzdDJfaGVscGVyJylcbiAgICAgICAgc2Vzc2lvbi5lbWl0dGVyLm9uKCdsaW5lLWNoYW5nZWQnLCAoaW5mbzogR0hDSURlYnVnLkJyZWFrSW5mbykgPT4ge1xuICAgICAgICAgICAgZXhwZWN0KGluZm8uaGlzdG9yeUxlbmd0aCkudG9CZSgxKVxuICAgICAgICAgICAgZG9uZSgpXG4gICAgICAgIH0pXG4gICAgICAgIHNlc3Npb24uc3RhcnREZWJ1ZygndGVzdDInKVxuICAgIH0pXG5cbiAgICBpdCgncmVwb3J0cyBiaW5kaW5ncycsIChkb25lKSA9PiB7XG4gICAgICAgIHNlc3Npb24uYWRkQnJlYWtwb2ludCgndGVzdDJfaGVscGVyJylcbiAgICAgICAgc2Vzc2lvbi5lbWl0dGVyLm9uKCdsaW5lLWNoYW5nZWQnLCAoaW5mbzogR0hDSURlYnVnLkJyZWFrSW5mbykgPT4ge1xuICAgICAgICAgICAgZXhwZWN0KGluZm8ubG9jYWxCaW5kaW5ncykudG9FcXVhbChbJ19yZXN1bHQgOjogW0NoYXJdID0gXyddKVxuICAgICAgICAgICAgZG9uZSgpXG4gICAgICAgIH0pXG4gICAgICAgIHNlc3Npb24uc3RhcnREZWJ1ZygndGVzdDInKVxuICAgIH0pXG5cbiAgICBkZXNjcmliZSgnZXhwcmVzc2lvbnMnICwgKCkgPT4ge1xuICAgICAgICBpdCgnZXZhbHVhdGVzIHZhcmlhYmxlcycsIChkb25lKSA9PiB7XG4gICAgICAgICAgICAoYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgICAgIHNlc3Npb24ucnVuKCd0ZXN0M192YWx1ZScpXG4gICAgICAgICAgICAgICAgZXhwZWN0KChhd2FpdCBzZXNzaW9uLnJlc29sdmVFeHByZXNzaW9uKCd0ZXN0M192YWx1ZScpKSkudG9CZSgnMycpXG4gICAgICAgICAgICB9KSgpLnRoZW4oKCkgPT4gZG9uZSgpKS5jYXRjaCgoKSA9PiBkb25lLmZhaWwoKSlcbiAgICAgICAgfSlcblxuICAgICAgICBpdCgnZXZhbHVhdGVzIGV4cHJlc3Npb25zJywgKGRvbmUpID0+IHtcbiAgICAgICAgICAgIChhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICAgICAgZXhwZWN0KChhd2FpdCBzZXNzaW9uLnJlc29sdmVFeHByZXNzaW9uKCd0ZXN0M192YWx1ZSArIDMnKSkpLnRvQmUoJyhfdDE6OkludGVnZXIpJylcbiAgICAgICAgICAgIH0pKCkudGhlbigoKSA9PiBkb25lKCkpLmNhdGNoKCgpID0+IGRvbmUuZmFpbCgpKVxuICAgICAgICB9KVxuXG4gICAgICAgIGl0KFwiZG9lc24ndCBvdmVycmlkZSB0ZW1wKG4pIHZhbHVlc1wiLCAoZG9uZSkgPT4ge1xuICAgICAgICAgICAgKGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgICAgICBzZXNzaW9uLnJ1bignbGV0IHRlbXAxID0gLTQnKVxuICAgICAgICAgICAgICAgIHNlc3Npb24ucnVuKCd0ZW1wMScpXG4gICAgICAgICAgICAgICAgc2Vzc2lvbi5yZXNvbHZlRXhwcmVzc2lvbigndGVzdDNfdmFsdWUgKyAzJylcbiAgICAgICAgICAgICAgICBleHBlY3QoKGF3YWl0IHNlc3Npb24ucnVuKCd0ZW1wMScpKSkudG9CZSgnLTQnKVxuICAgICAgICAgICAgfSkoKS50aGVuKCgpID0+IGRvbmUoKSkuY2F0Y2goKCkgPT4gZG9uZS5mYWlsKCkpXG4gICAgICAgIH0pXG4gICAgfSlcbn0pXG4iXX0=