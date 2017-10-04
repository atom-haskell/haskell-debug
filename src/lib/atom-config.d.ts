declare namespace AtomTypes {
  interface ConfigInterface {
    'haskell-debug.useIdeHaskellCabalBuilder': boolean
    'haskell-debug.GHCICommand': string
    'haskell-debug.GHCIArguments': string
    'haskell-debug.nodeCommand': string
    'haskell-debug.terminalCommand': string
    'haskell-debug.clickGutterToToggleBreakpoint': boolean
    'haskell-debug.showTerminal': boolean
    'haskell-debug.functionToDebug': string
    'haskell-debug.breakOnException': 'none' | 'errors' | 'exceptions'
  }
}
