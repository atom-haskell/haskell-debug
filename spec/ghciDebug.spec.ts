import GHCIDebug = require('../src/lib/GHCIDebug')
import path = require('path')
import { expect } from 'chai'

describe('GHCIDebug', function () {
  let session: GHCIDebug.GHCIDebug
  async function wrapPromise<
    T extends { on: (arg: U, cb: (val: V) => void) => void},
    U extends string, V
  >(s: T, evt: U, cb?: (val: V) => void) {
    return new Promise((resolve, reject) => {
      s.on(evt, (val) => {
        try {
          if (cb) cb(val)
          resolve()
        } catch (e) {
          reject(e)
        }
      })
    })
  }

  this.timeout(10000)

  beforeEach(async () => {
    session = new GHCIDebug.GHCIDebug('stack', ['repl'])
    await session.loadModule(path.resolve(__dirname, './test.hs'))
    // reload the module for a clean copy every time
  })

  it('breaks at breakpoints', async () => {
    await session.addBreakpoint('test1')
    const p = wrapPromise(session, 'line-changed')
    await session.startDebug('test1')
    await p
  })

  it('reports no history', async () => {
    await session.addBreakpoint('test1')
    const p = wrapPromise(session, 'line-changed', (info: GHCIDebug.BreakInfo) => {
      expect(info.historyLength).to.equal(0)
    })
    await session.startDebug('test1')
    await p
  })

  it('reports history', async () => {
    await session.addBreakpoint('test2_helper')
    const p = wrapPromise(session, 'line-changed', (info: GHCIDebug.BreakInfo) => {
      expect(info.historyLength).to.equal(1)
    })
    await session.startDebug('test2')
    await p
  })

  it('reports bindings', async () => {
    await session.addBreakpoint('test2_helper')
    const p = wrapPromise(session, 'line-changed', (info: GHCIDebug.BreakInfo) => {
      expect(info.localBindings).to.deep.equal(['_result :: [Char] = _'])
    })
    await session.startDebug('test2')
    await p
  })

  describe('expressions', () => {
    it('evaluates variables', async () => {
      await session.run('test3_value')
      expect((await session.resolveExpression('test3_value'))).to.equal('3')
    })

    it('evaluates expressions', async () => {
      expect((await session.resolveExpression('test3_value + 3'))).to.equal('(_t1::Integer)')
    })

    it("doesn't override temp(n) values", async () => {
      await session.run('let temp1 = -4')
      expect(await session.run('temp1')).to.equal('-4')
      await session.resolveExpression('2+3')
      console.log(await session.run(':show bindings'))
      expect((await session.run('temp1'))).to.equal('-4')
    })
  })
})
