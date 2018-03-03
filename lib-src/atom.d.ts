export {}
declare module 'atom' {
  interface ConfigValues {
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
  interface CommandRegistryTargetMap {
    "atom-text-editor[data-grammar='source haskell']": TextEditorElement
  }
  // hacks to be upstreamed
  interface Workspace {
    isTextEditor(object: object): object is TextEditor
  }
  interface Config {
    get<T extends keyof ConfigValues>(
      keyPath: T,
      options?: {
        sources?: string[]
        excludeSources?: string[]
        scope?: string[] | ScopeDescriptor
      },
    ): ConfigValues[T]
  }
}
