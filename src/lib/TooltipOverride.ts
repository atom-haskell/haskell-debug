import * as ideHaskell from './ide-haskell'

function isTextTooltip (tooltip: ideHaskell.Tooltip): tooltip is ideHaskell.TextTooltip {
  return typeof(tooltip) === 'object' && (tooltip as ideHaskell.TextTooltip).text !== undefined
}

class TooltipOverride {
    consumeHaskellUpi (upi: ideHaskell.HaskellUPI) {
        if (!upi['__proto__'].showTooltip) { return }
        // tslint:disable-next-line: no-unbound-method
        const prevShowTooltip = upi.showTooltip
        const _this = this
        upi['__proto__'].showTooltip = function (arg: ideHaskell.ShowTooltipArgs) {
            const prevTooltipFunc = arg.tooltip
            arg.tooltip = async (range) => {
                const tooltipAndRange = await prevTooltipFunc(range)
                const tooltip = tooltipAndRange.text

                const debugValue = await _this.resolveExpression(arg.editor.getTextInBufferRange(tooltipAndRange.range))

                if (debugValue !== undefined && isTextTooltip(tooltip)) {
                    tooltip.text = `--type\n${tooltip.text}\n--current debug value\n${debugValue}`
                }

                return tooltipAndRange
            }
            prevShowTooltip.call(this, arg)
        }
    }

    constructor (private resolveExpression: (expression: string) => Promise<string | undefined>) {
    }
}

export = TooltipOverride
