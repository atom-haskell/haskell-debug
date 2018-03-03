import * as atomAPI from 'atom'
import {
  GHCIDebug,
  BreakInfo,
  ExceptionInfo,
  Breakpoint,
  ExceptionBreakLevels,
} from './GHCIDebug'
import { DebugView } from './views/DebugView'
import { CurrentVariablesView } from './views/CurrentVariablesView'
import { HistoryState } from './HistoryState'
import { LineHighlighter } from './LineHighlighter'
import { TerminalReporter } from './TerminalReporter'

export class Debugger {
  private readonly lineHighlighter = new LineHighlighter()
  private readonly ghciDebug = new GHCIDebug(
    this.getGhciCommand(),
    this.getGhciArgs(),
    this.editor.getPath(),
  )
  private readonly debugView = new DebugView()
  private readonly historyState = new HistoryState()
  private debugPanel: atomAPI.Panel<HTMLElement>
  private readonly currentVariablesView = new CurrentVariablesView()
  private currentVariablesPanel: atomAPI.Panel<HTMLElement>
  private readonly terminalReporter = new TerminalReporter()
  private readonly disposables = new atomAPI.CompositeDisposable()
  private debuggerEnabled = false
  private executingCommandFromConsole = false

  constructor(
    breakpoints: Breakpoint[],
    private editor: atomAPI.TextEditor,
    private ideCabalBuilderCommand?: string,
  ) {
    this.launchGHCIDebugAndConsole(breakpoints)

    this.debugPanel = atom.workspace.addTopPanel({
      item: this.debugView.element,
    })

    this.debugView.on('step', () => this.step())
    this.debugView.on('back', () => this.back())
    this.debugView.on('forward', () => this.forward())
    this.debugView.on('continue', () => this.continue())
    this.debugView.on('stop', () => this.stop())

    this.currentVariablesPanel = atom.workspace.addTopPanel({
      item: this.currentVariablesView.element,
    })

    this.disposables.add(
      atom.config.onDidChange(
        'haskell-debug.breakOnException',
        ({ newValue }) => {
          this.ghciDebug.setExceptionBreakLevel(
            newValue as ExceptionBreakLevels,
          )
        },
      ),
    )
  }

  /** For the tooltip override*/
  public async resolveExpression(expression: string) {
    return this.ghciDebug.resolveExpression(expression)
  }

  public back() {
    if (
      this.historyState.setCurrentPosition(
        this.historyState.getCurrentPosition() + 1,
      )
    ) {
      this.ghciDebug.back()
    }
  }

  public forward() {
    if (
      this.historyState.setCurrentPosition(
        this.historyState.getCurrentPosition() - 1,
      )
    ) {
      this.ghciDebug.forward()
    }
  }

  public continue() {
    this.ghciDebug.continue()
  }

  public step() {
    this.ghciDebug.step()
  }

  public stop() {
    this.ghciDebug.stop() // this will trigger debug-finished event
  }

  public hidePanels() {
    this.debugPanel.hide()
    this.currentVariablesPanel.hide()
  }

  public showPanels() {
    this.debugPanel.show()
    this.currentVariablesPanel.show()
  }

  private getGhciCommand() {
    if (atom.config.get('haskell-debug.useIdeHaskellCabalBuilder')) {
      switch (this.ideCabalBuilderCommand) {
        case 'cabal':
          return 'cabal'
        case 'stack':
          return 'stack'
        default:
          return atom.config.get('haskell-debug.GHCICommand')
      }
    }
    return atom.config.get('haskell-debug.GHCICommand')
  }

  private getGhciArgs() {
    const args: string[] = []
    const ghciArgs = atom.config.get('haskell-debug.GHCIArguments')

    if (atom.config.get('haskell-debug.useIdeHaskellCabalBuilder')) {
      switch (this.ideCabalBuilderCommand) {
        case 'cabal':
          args.push('repl')
          break
        case 'stack':
          args.push('ghci')
          break
      }
    }

    if (
      ghciArgs.length > 0 &&
      (this.ideCabalBuilderCommand === 'cabal' ||
        this.ideCabalBuilderCommand === 'stack')
    ) {
      return args.concat(
        `--ghc-options="${atom.config.get('haskell-debug.GHCIArguments')}"`,
      )
    } else {
      return args.concat(
        atom.config.get('haskell-debug.GHCIArguments').split(' '),
      )
    }
  }

  private destroy() {
    this.lineHighlighter.destroy()
    this.ghciDebug.destroy()
    this.debugView.destroy()
    this.debugPanel.destroy()
    this.currentVariablesPanel.destroy()
    this.currentVariablesView.destroy()
    this.terminalReporter.destroy()
    this.disposables.dispose()
  }

  private updateHistoryLengthAndEnableButtons(historyLength?: number) {
    if (historyLength !== undefined) {
      this.historyState.setMaxPosition(historyLength)
    }

    this.debugView.enableAllDebugButtons()
    this.debugView.setButtonEnabled('back', this.historyState.backEnabled)
    this.debugView.setButtonEnabled('forward', this.historyState.forwardEnabled)
    this.debuggerEnabled = true
  }

  private async launchGHCIDebugAndConsole(breakpoints: Breakpoint[]) {
    this.ghciDebug.on('line-changed', (info: BreakInfo) => {
      this.lineHighlighter.hightlightLine(info)
      this.updateHistoryLengthAndEnableButtons(info.historyLength)
      this.currentVariablesView.update(info.localBindings, false)
    })

    this.ghciDebug.on('paused-on-exception', (info: ExceptionInfo) => {
      this.lineHighlighter.destroy()
      this.updateHistoryLengthAndEnableButtons(info.historyLength)
      this.currentVariablesView.update(info.localBindings, true)
    })

    this.ghciDebug.on('debug-finished', () => {
      this.destroy()
    })

    this.ghciDebug.on('command-issued', (command: string) => {
      if (!this.executingCommandFromConsole) {
        this.terminalReporter.displayCommand(command)
      }

      this.debuggerEnabled = false
      setTimeout(() => {
        if (!this.debuggerEnabled) {
          this.debugView.disableAllDebugButtons()
        }
      }, 100)
    })

    this.ghciDebug.on('console-output', (output: string) => {
      this.terminalReporter.write(output)
    })

    this.ghciDebug.on('error-completed', (errorText: string) => {
      if (!this.executingCommandFromConsole) {
        atom.notifications.addError('GHCI Error', {
          detail: errorText,
          dismissable: true,
        })
      }
    })

    this.ghciDebug.on('error', (errorText: string) => {
      this.terminalReporter.write(errorText)
    })

    await this.ghciDebug.addedAllListeners()

    this.terminalReporter.on('command', async (command: string) => {
      this.executingCommandFromConsole = true
      await this.ghciDebug.run(command, true, true)
      this.executingCommandFromConsole = false
    })

    this.terminalReporter.on('close', () => {
      this.ghciDebug.stop()
    })

    this.ghciDebug.setExceptionBreakLevel(
      atom.config.get('haskell-debug.breakOnException'),
    )

    this.debugView.disableAllDebugButtons()

    const fileToDebug = this.editor.getPath()
    if (!fileToDebug) {
      throw new Error('Trying to debug on a text editor with no filename')
    }
    this.ghciDebug.loadModule(fileToDebug)

    breakpoints.forEach((ob) => {
      if (ob.file === fileToDebug) {
        this.ghciDebug.addBreakpoint(ob.line.toString())
      } else {
        this.ghciDebug.addBreakpoint(ob) // TODO: make this work properly
      }
    })

    this.ghciDebug.startDebug(atom.config.get('haskell-debug.functionToDebug'))
  }
}
