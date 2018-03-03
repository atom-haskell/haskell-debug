import { BreakInfo } from './GHCIDebug'
import atomAPI = require('atom')

export class LineHighlighter {
  private debugLineMarker?: atomAPI.DisplayMarker
  private currentMarkedEditor?: atomAPI.TextEditor

  public async hightlightLine(info: BreakInfo) {
    const editor = ((await atom.workspace.open(info.filename, {
      searchAllPanes: true,
    })) as any) as atomAPI.TextEditor
    editor.scrollToBufferPosition(info.range[0])

    if (
      this.currentMarkedEditor !== editor &&
      this.debugLineMarker !== undefined
    ) {
      this.debugLineMarker.destroy()
      this.debugLineMarker = undefined
    }

    this.currentMarkedEditor = editor

    if (this.debugLineMarker === undefined) {
      this.debugLineMarker = editor.markBufferRange(info.range, {
        invalidate: 'never',
      })
      editor.decorateMarker(this.debugLineMarker, {
        type: 'highlight',
        class: 'highlight-green',
      })
      editor.decorateMarker(this.debugLineMarker, {
        type: 'line-number',
        class: 'highlight-green',
      })
      editor.decorateMarker(this.debugLineMarker, {
        type: 'gutter',
        class: 'highlight-green',
      })
    } else {
      this.debugLineMarker.setBufferRange(info.range)
    }
  }

  public destroy() {
    if (this.debugLineMarker !== undefined) {
      this.debugLineMarker.destroy()
      this.debugLineMarker = undefined
    }
  }
}
