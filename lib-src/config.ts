import * as os from 'os'

export const debugModes: Array<{
  value: 'none' | 'errors' | 'exceptions'
  description: string
}> = [
  { value: 'none', description: "Don't pause on any exceptions" },
  { value: 'errors', description: 'Pause on errors (uncaught exceptions)' },
  { value: 'exceptions', description: 'Pause on exceptions' },
]

function getTerminalCommand() {
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

export const config = {
  useIdeHaskellCabalBuilder: {
    title: 'Use ide-haskell-cabal builder',
    description:
      "Use the ide-haskell-cabal builder's command when running ghci - " +
      'will run `stack ghci` when stack is the builder, `cabal repl` for cabal and ' +
      '`ghci` for none',
    default: true,
    type: 'boolean',
    order: 0,
  },
  GHCICommand: {
    title: 'GHCI Command',
    description:
      'The command to run to execute `ghci`, this will get ignore if the' +
      ' previous setting is set to true',
    type: 'string',
    default: 'ghci',
    order: 1,
  },
  GHCIArguments: {
    title: 'GHCI Arguments',
    description: 'Arguments to give to `ghci`, separated by a space',
    type: 'string',
    default: '',
    order: 2,
  },
  nodeCommand: {
    description: 'The command to run to execute node.js',
    type: 'string',
    default: 'node',
    order: 3,
  },
  terminalCommand: {
    description:
      'The command to run to launch a terminal, where the command launched in the terminal is `%s`.',
    type: 'string',
    default: getTerminalCommand(),
    order: 4,
  },
  clickGutterToToggleBreakpoint: {
    type: 'boolean',
    description:
      'Insert a breakpoint when the gutter is clicked in a haskell source file',
    default: true,
    order: 5,
  },
  showTerminal: {
    type: 'boolean',
    description: 'Show a terminal with `ghci` running when debugging',
    default: true,
    order: 6,
  },
  functionToDebug: {
    type: 'string',
    description: 'The function to run when debugging',
    default: 'main',
    order: 7,
  },
  breakOnException: {
    description: `Whether to break on exceptions, errors or neither.
            Note: breaking on exception may cause the debugger to freeze in some instances.
            See [#3](https://github.com/ThomasHickman/haskell-debug/issues/3)`,
    type: 'string',
    default: 'none',
    enum: debugModes,
    order: 8,
  },
}
