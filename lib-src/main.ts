import { Debugger } from './Debugger'
import { BreakpointUI } from './BreakpointUI'
import { TooltipOverride } from './TooltipOverride'
import * as atomAPI from 'atom'
import os = require('os')
import path = require('path')
import cp = require('child_process')
import { debugModes } from './config'
import { selectDebugModeView } from './views/SelectDebugModeView'
import * as UPI from 'atom-haskell-upi'
export { config } from './config'

const breakpointUI = new BreakpointUI()

let debuggerInst: Debugger | undefined
let upi: UPI.IUPIInstance | undefined
let state: HaskellDebugState | undefined
let disposables: atomAPI.CompositeDisposable | undefined

export type TECE = atomAPI.CommandEvent<atomAPI.TextEditorElement>

const commands = {
  debug: async ({ currentTarget }: TECE) => {
    const ob =
      upi &&
      (await upi.getOthersConfigParam<{ name: string }>(
        'ide-haskell-cabal',
        'builder',
      ))
    if (ob) {
      debuggerInst = new Debugger(
        breakpointUI.breakpoints,
        currentTarget.getModel(),
        ob.name,
      )
    } else {
      debuggerInst = new Debugger(
        breakpointUI.breakpoints,
        currentTarget.getModel(),
      )
    }
  },
  'debug-back': () => {
    if (debuggerInst) {
      debuggerInst.back()
    }
  },
  'debug-forward': () => {
    if (debuggerInst) {
      debuggerInst.forward()
    }
  },
  'debug-step': () => {
    if (debuggerInst) {
      debuggerInst.step()
    }
  },
  'debug-stop': () => {
    if (debuggerInst) {
      debuggerInst.stop()
    }
  },
  'debug-continue': () => {
    if (debuggerInst) {
      debuggerInst.continue()
    }
  },
  'toggle-breakpoint': ({ currentTarget }: TECE) => {
    breakpointUI.toggleBreakpoint(
      currentTarget.getModel().getCursorBufferPosition().row + 1,
      currentTarget.getModel(),
    )
  },
  'set-break-on-exception': async () => {
    const result = await selectDebugModeView(
      debugModes,
      atom.config.get('haskell-debug.breakOnException'),
    )
    if (result !== undefined) {
      atom.config.set('haskell-debug.breakOnException', result)
    }
  },
}

function onFirstRun() {
  state = {
    properlyActivated: false,
  }

  // from http://stackoverflow.com/questions/34953168/node-check-existence-of-command-in-path
  const isWin = os.platform().indexOf('win') > -1
  const where = isWin ? 'where' : 'whereis'

  const out = cp.exec(where + ' node')

  out.on('close', (code) => {
    if (code === 1) {
      // not found
      // fallback to the node in apm
      atom.config.set(
        'haskell-debug.nodeCommand',
        path.resolve(atom.packages.getApmPath(), '../../bin/atom'),
      )
      if (state) {
        state.properlyActivated = true
      }
    }
  })
}

function activePaneObserver(pane: object) {
  if (atom.workspace.isTextEditor(pane)) {
    const te: atomAPI.TextEditor & { hasHaskellBreakpoints?: boolean } = pane
    const scopes = te.getRootScopeDescriptor().getScopesArray()
    if (scopes.length === 1 && scopes[0] === 'source.haskell') {
      if (!te.hasHaskellBreakpoints) {
        breakpointUI.attachToNewTextEditor(te)
        te.hasHaskellBreakpoints = true
      }
      if (debuggerInst) {
        debuggerInst.showPanels()
      }
      return // don't do below
    }
  }
  // if any pane that isn't a haskell source file and we're debugging
  if (debuggerInst) {
    debuggerInst.hidePanels()
  }
}

interface HaskellDebugState {
  properlyActivated: boolean
}

export function activate(_state?: HaskellDebugState) {
  disposables = new atomAPI.CompositeDisposable()
  state = _state

  if (state === undefined || state.properlyActivated !== true) {
    onFirstRun()
  }
  disposables.add(atom.workspace.observeActivePaneItem(activePaneObserver))

  for (const command of Object.keys(commands)) {
    disposables.add(
      atom.commands.add(
        "atom-text-editor[data-grammar='source haskell']",
        'haskell:' + command,
        commands[command],
      ),
    )
  }
}

export function deactivate() {
  disposables && disposables.dispose()
}

export function serialize() {
  return state
}

export function consumeHaskellUpi(reg: UPI.IUPIRegistration) {
  const tooltipOverride = new TooltipOverride(async (expression) => {
    if (debuggerInst === undefined) {
      return undefined
    }
    return debuggerInst.resolveExpression(expression)
  })
  upi = reg({
    name: 'haskell-debug',
    tooltip: {
      priority: 100,
      handler: tooltipOverride.tooltipHandler.bind(tooltipOverride),
    },
  })
  return upi
}
