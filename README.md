# haskell-debug
Implements a graphical haskell debugger in atom, using `ghci`.

![main screenshot](https://cloud.githubusercontent.com/assets/6304200/18360164/cce580e8-75f4-11e6-9945-279fc55dabcc.png)

## Dependencies

- [ghci](https://www.haskell.org/downloads)
- [language-haskell](https://atom.io/packages/language-haskell)
- [ide-haskell](https://atom.io/packages/ide-haskell)

## Installation

1. Install [language-haskell](https://atom.io/packages/language-haskell) and [ide-haskell](https://atom.io/packages/ide-haskell)
    apm install language-haskell ide-haskell
2. Install this package
    apm install haskell-debug

## How to use
### Setting breakpoints

In a haskell source file, click on a line number to set a breakpoint for that line.

### Debugging

To debug the main function of a file, press <kbd>cmd-shift-p</kbd> (Mac) or <kbd>ctrl-shift-p</kbd> (Linux/Windows) to launch the  command palette, type in `haskell debug` and press <kbd>enter</kbd>.

### Exceptions

To break on exceptions, launch the command palette, type in `set break on exception`, press <kbd>enter</kbd> and select the appropriate option. Note: breaking on exception may cause the debugger to freeze in some instances. See [#3](https://github.com/ThomasHickman/haskell-debug/issues/3]).
