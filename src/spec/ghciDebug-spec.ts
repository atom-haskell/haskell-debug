import GHCIDebug = require('../lib/GHCIDebug')
import path = require('path')

let topDescribeFunc = describe

// run this with jasmine v2.4
// tslint:disable-next-line: no-string-literal
if (!jasmine['version']) {/*defined in 2.x*/
    // tslint:disable-next-line: no-console
    console.warn('WARN: ghciDebug-spec cannot be run in jasmine v < 2')
    topDescribeFunc = xdescribe
}

topDescribeFunc('GHCIDebug', () => {
    let session: GHCIDebug.GHCIDebug

    beforeEach(() => {
        session = new GHCIDebug.GHCIDebug()
        session.loadModule(path.resolve(__dirname, '../spec/test.hs'))
        // reload the module for a clean copy every time
    })

    it('breaks at breakpoints', (done) => {
        session.addBreakpoint('test1')
        session.emitter.on('line-changed', (info: GHCIDebug.BreakInfo) => {
            done()
        })
        session.startDebug('test1')
    })

    it('reports no history', (done) => {
        session.addBreakpoint('test1')
        session.emitter.on('line-changed', (info: GHCIDebug.BreakInfo) => {
            expect(info.historyLength).toBe(0)
            done()
        })
        session.startDebug('test1')
    })

    it('reports history', (done) => {
        session.addBreakpoint('test2_helper')
        session.emitter.on('line-changed', (info: GHCIDebug.BreakInfo) => {
            expect(info.historyLength).toBe(1)
            done()
        })
        session.startDebug('test2')
    })

    it('reports bindings', (done) => {
        session.addBreakpoint('test2_helper')
        session.emitter.on('line-changed', (info: GHCIDebug.BreakInfo) => {
            expect(info.localBindings).toEqual(['_result :: [Char] = _'])
            done()
        })
        session.startDebug('test2')
    })

    describe('expressions' , () => {
        it('evaluates variables', (done) => {
            (async () => {
                session.run('test3_value')
                expect((await session.resolveExpression('test3_value'))).toBe('3')
            })().then(() => done()).catch(() => done.fail())
        })

        it('evaluates expressions', (done) => {
            (async () => {
                expect((await session.resolveExpression('test3_value + 3'))).toBe('(_t1::Integer)')
            })().then(() => done()).catch(() => done.fail())
        })

        it("doesn't override temp(n) values", (done) => {
            (async () => {
                session.run('let temp1 = -4')
                session.run('temp1')
                session.resolveExpression('test3_value + 3')
                expect((await session.run('temp1'))).toBe('-4')
            })().then(() => done()).catch(() => done.fail())
        })
    })
})
