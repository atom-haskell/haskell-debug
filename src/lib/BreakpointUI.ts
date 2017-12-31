import atomAPI = require('atom')
import _ = require('lodash')
import { Breakpoint } from './GHCIDebug'

export class BreakpointUI {
  private _breakpoints: Breakpoint[] = []
  private markers: WeakMap<Breakpoint, atomAPI.DisplayMarker> = new WeakMap()

  public get breakpoints() {
    return this._breakpoints
  }

  public toggleBreakpoint(lineNumber: number, te: atomAPI.TextEditor) {
    const breakpoints = _.remove(this.breakpoints, {
      file: te.getPath(),
      line: lineNumber,
    })

    if (breakpoints.length === 0) {
      this.setBreakpoint(
        {
          line: lineNumber,
          file: te.getPath(),
        },
        te,
      )
    } else {
      breakpoints.forEach((breakpoint) => {
        const m = this.markers.get(breakpoint)
        if (m) { m.destroy() }
      })
    }
  }

  public attachToNewTextEditor(te: atomAPI.TextEditor) {
    // patch the text editor to add breakpoints on click
    const lineNumbersModal = te.gutterWithName('line-number')
    if (!lineNumbersModal) throw new Error('No line-number gutter on editor')
    const view = atom.views.getView(lineNumbersModal) as HTMLElement

    view.addEventListener('click', (ev) => {
      const scopes = te.getRootScopeDescriptor().getScopesArray()
      if (scopes.length === 1 && scopes[0] === 'source.haskell'
        && atom.config.get('haskell-debug.clickGutterToToggleBreakpoint')) {
        const bufferRow = (ev.target as HTMLElement).dataset.bufferRow
        if (bufferRow === undefined) {
          console.warn("haskell-debug: click on gutter doesn't have a buffer row property")
          return
        }

        const lineNumber = parseInt(bufferRow, 10) + 1
        this.toggleBreakpoint(lineNumber, te)
      }
    })

    this.setFileBreakpoints(te)
  }

  private setBreakpoint(breakpoint: Breakpoint, te: atomAPI.TextEditor) {
    const breakpointMarker = te.markBufferRange(
      [[breakpoint.line - 1, 0], [breakpoint.line, 0]],
      { invalidate: 'inside' })

    te.decorateMarker(breakpointMarker, {
      type: 'line-number',
      class: 'haskell-debug-breakpoint',
    })

    breakpointMarker.onDidChange((change) => {
      breakpoint.line = change.newHeadBufferPosition.row
      if (!change.isValid) {
        _.remove(this.breakpoints, breakpoint)
      }
    })

    this.markers.set(breakpoint, breakpointMarker)

    this.breakpoints.push(breakpoint)
  }

  private setFileBreakpoints(te: atomAPI.TextEditor) {
    _.filter(this.breakpoints, {
      file: te.getPath(),
    }).forEach((breakpoint) => this.setBreakpoint(breakpoint, te))
  }
}
