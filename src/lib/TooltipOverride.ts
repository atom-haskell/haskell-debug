class TooltipOverride {
    async tooltipHandler (editor: AtomTypes.TextEditor, crange: AtomTypes.Range, type: UPI.TEventRangeType)
      : Promise<UPI.ITooltipData | undefined> {
      if (crange.isEmpty()) {
        crange = editor.bufferRangeForScopeAtPosition('identifier.haskell', crange.start)
      }
      if (crange.isEmpty()) {
        return
      }
      const debugValue = await this.resolveExpression(editor.getTextInBufferRange(crange))
      if (debugValue !== undefined) {
          return {
            range: crange,
            text: debugValue
          }
      }
      return
    }

    constructor (private resolveExpression: (expression: string) => Promise<string | undefined>) {
    }
}

export = TooltipOverride
