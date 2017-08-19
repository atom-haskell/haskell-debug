class TooltipOverride {
  async tooltipHandler(editor: AtomTypes.TextEditor, crange: AtomTypes.Range, type: UPI.TEventRangeType)
    : Promise<UPI.ITooltipData | undefined> {
    let range: AtomTypes.Range | undefined = crange
    if (range.isEmpty()) {
      range = editor.bufferRangeForScopeAtPosition('identifier.haskell', range.start)
    }
    if (!range || range.isEmpty()) {
      return
    }
    const debugValue = await this.resolveExpression(editor.getTextInBufferRange(range))
    if (debugValue !== undefined) {
      return { range, text: debugValue }
    }
    return
  }

  constructor(private resolveExpression: (expression: string) => Promise<string | undefined>) {
  }
}

export = TooltipOverride
