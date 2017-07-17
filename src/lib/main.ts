import Debugger = require('./Debugger')
import BreakpointUI = require('./BreakpointUI')
import TooltipOverride = require('./TooltipOverride')
import atomAPI = require('atom')
import os = require('os')
import path = require('path')
import cp = require('child_process')
import * as haskellIde from './ide-haskell'

export let breakpointUI = new BreakpointUI()
export let debuggerInst: Debugger | undefined
export let tooltipOverride = new TooltipOverride(async (expression) => {
    if (debuggerInst === undefined) { return debuggerInst }
    return debuggerInst.resolveExpression(expression)
})

export let settings = {
    breakOnError: true
}

export let commands = {
    'debug': () => {
        // tslint:disable-next-line: variable-name
        const Debugger = require('./Debugger')

        upi.getConfigParam('ide-haskell-cabal', 'builder').then((ob) => {
            debuggerInst = new Debugger(breakpointUI.breakpoints, ob.name)
        }).catch(() => {
            debuggerInst = new Debugger(breakpointUI.breakpoints)
        })
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
    'toggle-breakpoint': () => {
        const te = atom.workspace.getActiveTextEditor()

        breakpointUI.toggleBreakpoint(
            te.getCursorBufferPosition().row + 1,
            te
        )
    },
    'set-break-on-exception': () => {
        // tslint:disable-next-line: variable-name
        const SelectDebugModeView = require('./views/SelectDebugModeView')
        const view = new SelectDebugModeView(debugModes, atom.config.get('haskell-debug.breakOnException'))

        const panel = atom.workspace.addModalPanel({
            item: view
        })

        view.focusFilterEditor()

        view.emitter.on('selected', (item: string) => {
            atom.config.set('haskell-debug.breakOnException', item)
        })

        view.emitter.on('canceled', () => {
            panel.destroy()
        })
    }
}

export function onFirstRun () {
    state = {
        properlyActivated: false
    }

    // from http://stackoverflow.com/questions/34953168/node-check-existence-of-command-in-path
    const isWin = os.platform().indexOf('win') > -1
    const where = isWin ? 'where' : 'whereis'

    const out = cp.exec(where + ' node')

    out.on('close', (code) => {
        if (code === 1) {// not found
            // fallback to the node in apm
            atom.config.set('haskell-debug.nodeCommand', path.resolve(atom.packages.getApmPath(), '../../bin/atom'))
            if (state) { state.properlyActivated = true }
        }
    })
}

interface HaskellDebugState {
    properlyActivated: boolean
}

export let state: HaskellDebugState | undefined

export function activate (_state?: HaskellDebugState) {
    state = _state

    if (state === undefined || state.properlyActivated !== true) {
        onFirstRun()
    }
    atom.workspace.observeActivePaneItem((pane) => {
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

                return  // don't do below
            }
        }

        // if any pane that isn't a haskell source file and we're debugging
        if (debuggerInst) {
            debuggerInst.hidePanels()
        }
    })

    for (const command of Object.keys(commands)){
        atom.commands.add("atom-text-editor[data-grammar='source haskell']",
                          'haskell:' + command,
                          commands[command])
    }
}

export function serialize () {
    return state
}

export let debugModes = [
    {value: 'none', description: 'Don\'t pause on any exceptions'},
    {value: 'errors', description: 'Pause on errors (uncaught exceptions)'},
    {value: 'exceptions', description: 'Pause on exceptions'},
]

export function getTerminalCommand () {
    if (os.type() === 'Windows_NT') {
        return 'start %s'
    } else if (os.type() === 'Linux') {
        return `x-terminal-emulator -e "bash -c \\"%s\\""`
    } else if (os.type() === 'Darwin') {
        return `osascript -e 'tell app "Terminal" to do script "%s"'`
    } else {
        // not recognised, hope xterm works
        return `xterm -e "bash -c \\"%s\\""`
    }
}

export let config = {
    useIdeHaskellCabalBuilder: {
        title: 'Use ide-haskell-cabal builder',
        description: "Use the ide-haskell-cabal builder's command when running ghci - " +
            'will run `stack ghci` when stack is the builder, `cabal repl` for cabal and ' +
            '`ghci` for none',
        default: true,
        type: 'boolean',
        order: 0
    },
    GHCICommand: {
        title: 'GHCI Command',
        description: 'The command to run to execute `ghci`, this will get ignore if the' +
            ' previous setting is set to true',
        type: 'string',
        default: 'ghci',
        order: 1
    },
    GHCIArguments: {
        title: 'GHCI Arguments',
        description: 'Arguments to give to `ghci`, separated by a space',
        type: 'string',
        default: '',
        order: 2
    },
    nodeCommand: {
        description: 'The command to run to execute node.js',
        type: 'string',
        default: 'node',
        order: 3
    },
    terminalCommand: {
        description: 'The command to run to launch a terminal, where the command launched in the terminal is `%s`.',
        type: 'string',
        default: getTerminalCommand(),
        order: 4
    },
    clickGutterToToggleBreakpoint: {
        type: 'boolean',
        description: 'Insert a breakpoint when the gutter is clicked in a haskell source file',
        default: true,
        order: 5
    },
    showTerminal: {
        type: 'boolean',
        description: 'Show a terminal with `ghci` running when debugging',
        default: true,
        order: 6
    },
    functionToDebug: {
        type: 'string',
        description: 'The function to run when debugging',
        default: 'main',
        order: 7
    },
    breakOnException: {
        description: `Whether to break on exceptions, errors or neither.
            Note: breaking on exception may cause the debugger to freeze in some instances.
            See [#3](https://github.com/ThomasHickman/haskell-debug/issues/3)`,
        type: 'string',
        default: 'none',
        enum: debugModes,
        order: 8
    }
}

let upi: haskellIde.HaskellUPI

export function consumeHaskellUpi (upiContainer: haskellIde.HaskellUPIContainer) {
    const pluginDisposable = new atomAPI.CompositeDisposable()
    const _upi = upiContainer.registerPlugin(pluginDisposable, 'haskell-debug')
    tooltipOverride.consumeHaskellUpi(_upi)
    upi = _upi
}
