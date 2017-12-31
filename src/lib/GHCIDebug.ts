import cp = require('child_process')
import stream = require('stream')
import os = require('os')
import path = require('path')
import atomAPI = require('atom')

export interface BreakInfo {
  filename: string
  range: [[number, number], [number, number]]
  historyLength?: number
  localBindings: string[]
}

export interface ExceptionInfo {
  historyLength: number
  localBindings: string[]
}

interface Command {
  text: string
  emitCommandOutput: boolean
  fulfilWithPrompt: boolean
  onFinish: (output: string) => any
}

export interface Breakpoint {
  line: number // 1 is the greatest number this can contain
  file: string | undefined // absolute path
}

export type ExceptionBreakLevels = 'none' | 'exceptions' | 'errors'

export class GHCIDebug {
  private static pausedOnError = Symbol('Paused on Error')
  private static finishedDebugging = Symbol('Finished debugging')

  private emitter: atomAPI.Emitter<{
    'debug-finished': undefined /// Emmited when the debugger has reached the end of the program
    'ready': ExceptionInfo | undefined /// Emmited when ghci has just stopped executing a command
  }, {
    'paused-on-exception': ExceptionInfo /// Emmited when the debugger is at an exception
    'error': string /// Emmited when stderr has input
    'error-completed': string /// Emmited when ghci reports an error for a given command
    'line-changed': BreakInfo /// Emmited when the line that the debugger is on changes
    'console-output': string /// Emmited when the ghci has outputed something to stdout, excluding the extra prompt
    'command-issued': string /// Emmited when a command has been executed
  }> = new atomAPI.Emitter()
  // tslint:disable-next-line: member-ordering
  public readonly on = this.emitter.on.bind(this.emitter)

  private ghciCmd: cp.ChildProcess
  private stdout: stream.Readable
  private stdin: stream.Writable
  private stderr: stream.Readable
  private startText: Promise<string>
  private ignoreErrors = false
  private currentStderrOutput = ''
  private currentCommandBuffer = ''
  private commands = [] as Command[]
  private currentCommand?: Command
  private commandFinishedString = 'command_finish_o4uB1whagteqE8xBq9oq'
  private moduleNameByPath: Map<string, string> = new Map()

  constructor(ghciCommand = 'ghci', ghciArgs: string[] = [], folder?: string) {

    this.ghciCmd = cp.spawn(ghciCommand, ghciArgs, { cwd: folder, shell: true })

    this.ghciCmd.on('exit', () => {
      this.emitter.emit('debug-finished', undefined)
    })

    this.stdout = this.ghciCmd.stdout
    this.stdin = this.ghciCmd.stdin
    this.stderr = this.ghciCmd.stderr
    this.stdout.on('readable', () => this.onStdoutReadable())
    this.stderr.on('readable', () => this.onStderrReadable())

    this.addReadyEvent()

    this.startText = this.run(`:set prompt "%s> ${this.commandFinishedString}"`, false, false, false, true)
  }

  public destroy() {
    this.stop()
  }

  public async loadModule(name: string) {
    const cwd = path.dirname(name)

    await this.run(`:cd ${cwd}`)
    await this.run(`:load ${name}`)
  }

  public async setExceptionBreakLevel(level: ExceptionBreakLevels) {
    await this.run(':unset -fbreak-on-exception')
    await this.run(':unset -fbreak-on-error')

    switch (level) {
      case 'exceptions':
        await this.run(':set -fbreak-on-exception')
        break
      case 'errors':
        await this.run(':set -fbreak-on-error')
        break
      case 'none': // no-op
        break
    }
  }

  public async addBreakpoint(breakpoint: Breakpoint | string): Promise<void> {
    if (typeof breakpoint === 'string') {
      await this.run(`:break ${breakpoint}`)
    } else if (breakpoint.file) {
      try {
        const moduleName: string = await this.moduleNameFromFilePath(breakpoint.file)
        await this.run(`:break ${moduleName} ${breakpoint.line}`)
      } catch (e) {
        atom.notifications.addError(`Failed to set breakpoint on ${breakpoint.file}`, {
          detail: (e as Error).toString(),
          stack: (e as Error).stack,
          dismissable: true,
        })
      }
    } else {
      atom.notifications.addError('Failed to set breakpoint', {
        detail: 'Text editor has no filename',
        dismissable: true,
      })
    }
  }

  /** resolved the given expression using :print, returns null if it is invalid
  */
  public async resolveExpression(expression: string) {
    if (!expression.trim()) {
      return undefined
    }
    // expressions can't have new lines
    if (expression.indexOf('\n') !== -1) {
      return undefined
    }

    const getExpression = (ghciOutput: string) => {
      const matchResult = ghciOutput.match(/[^ ]* = (.*)/)
      if (!matchResult) { return undefined }
      return matchResult[1]
    }

    // for the code below, ignore errors
    this.ignoreErrors = true

    try {
      // try printing expression
      const printingResult = getExpression(
        await this.run(`:print ${expression}`, false, false, false))
      if (printingResult !== undefined) {
        return printingResult
      }

      // if that fails assign it to a temporary variable and evaluate that
      let tempVarNum = 0
      let potentialTempVar: string | undefined
      do {
        tempVarNum += 1
        potentialTempVar = getExpression(
          await this.run(`:print temp${tempVarNum}`, false, false, false))
      } while (potentialTempVar !== undefined)

      await this.run(`let temp${tempVarNum} = ${expression}`, false, false, false)
      return getExpression(await this.run(`:print temp${tempVarNum}`, false, false, false))
    } finally {
      this.ignoreErrors = false
    }
  }

  public forward() {
    this.run(':forward', true)
  }

  public back() {
    this.run(':back', true)
  }

  public step() {
    this.run(':step', true, true)
  }

  public stop() {
    this.run(':quit')
    setTimeout(
      () => {
        this.ghciCmd.kill()
      },
      3000)
  }

  public continue() {
    this.run(':continue', true)
  }

  public async addedAllListeners() {
    return this.startText.then((text) => {
      const firstPrompt = text.indexOf('> ')
      this.emitter.emit('console-output', text.slice(0, firstPrompt + 2))
    })
  }

  public async startDebug(moduleName?: string) {
    moduleName = moduleName || 'main'
    await this.run(':trace ' + moduleName, true, true)
  }

  public async run(
    commandText: string,
    emitStatusChanges: boolean = false,
    emitHistoryLength: boolean = false,
    emitCommandOutput: boolean = true,
    fulfilWithPrompt: boolean = false,
  ): Promise<string> {
    const shiftAndRunCommand = () => {
      const command = this.commands.shift()

      this.currentCommand = command

      if (command) {
        if (command.emitCommandOutput) {
          this.emitter.emit('command-issued', command.text)
        }

        this.stdin.write(command.text + os.EOL)
      }
    }

    const p = new Promise<string>((fulfil) => {
      const command: Command = {
        text: commandText,
        emitCommandOutput,
        fulfilWithPrompt,
        onFinish: async (output) => {
          this.currentCommand = undefined

          function _fulfil(noPrompt: string) {
            if (fulfilWithPrompt) {
              fulfil(output)
            } else {
              fulfil(noPrompt)
            }
          }

          const lastEndOfLinePos = output.lastIndexOf(os.EOL)

          if (lastEndOfLinePos === -1) {
            /*i.e. no output has been produced*/
            if (emitStatusChanges) {
              await this.emitStatusChanges(output, '', emitHistoryLength)
            }
            _fulfil('')
          } else {
            const promptBeginPosition = lastEndOfLinePos + os.EOL.length

            if (emitStatusChanges) {
              await this.emitStatusChanges(
                output.slice(promptBeginPosition, output.length),
                output.slice(0, lastEndOfLinePos),
                emitHistoryLength,
              )
            }
            _fulfil(output.slice(0, lastEndOfLinePos))
          }
        },
      }

      this.commands.push(command)

      if (this.currentCommand === undefined) {
        shiftAndRunCommand()
      }
    })
    p.then(() => {
      if (this.commands.length !== 0) {
        shiftAndRunCommand()
      }
    }).catch((e: Error) => {
      atom.notifications.addError('An error happened', {
        detail: e.toString(),
        stack: e.stack,
        dismissable: true,
      })
    })
    return p
  }

  private addReadyEvent() {
    const eventSubs = [
      'paused-on-exception',
      'line-changed',
      'debug-finished',
    ]

    for (const eventName of eventSubs) {
      (this.emitter.on as any)(eventName, () => this.emitter.emit('ready', undefined))
    }
  }

  private async getBindings() {
    const outputStr = await this.run(':show bindings', false, false, false)
    return outputStr.split(os.EOL)
  }

  private async getHistoryLength() {
    const historyQuery = await this.run(':history 100', false, false, false)
    const regex = /-(\d*).*(?:\n|\r|\r\n)<end of history>$/

    const matchResult = historyQuery.match(regex)
    if (!matchResult) {
      if (historyQuery.slice(-3) === '...') {
        return Infinity // history is very long
      } else {
        return 0
      }
    } else {
      return parseInt(matchResult[1], 10)
    }
  }

  private parsePrompt(stdOutput: string): BreakInfo | Symbol {
    const patterns = [{
      pattern: /\[(?:[-\d]*: )?(.*):\((\d+),(\d+)\)-\((\d+),(\d+)\).*\].*> $/,
      func: (match) => ({
        filename: match[1],
        range: [[parseInt(match[2], 10) - 1, parseInt(match[3], 10) - 1],
        [parseInt(match[4], 10), parseInt(match[5], 10)]],
      }),
    }, {
      pattern: /\[(?:[-\d]*: )?(.*):(\d*):(\d*)-(\d*)\].*> $/,
      func: (match) => ({
        filename: match[1],
        range: [[parseInt(match[2], 10) - 1, parseInt(match[3], 10) - 1],
        [parseInt(match[2], 10) - 1, parseInt(match[4], 10)]],
      }),
    }, {
      pattern: /\[<exception thrown>\].*> $/,
      func: () => GHCIDebug.pausedOnError,
    }, {
      pattern: /.*> $/,
      func: () => GHCIDebug.finishedDebugging,
    }] as Array<{ pattern: RegExp; func: (match: string[]) => BreakInfo | Symbol }>
    for (const pattern of patterns) {
      const matchResult = stdOutput.match(pattern.pattern)
      if (matchResult) {
        return pattern.func(matchResult)
      }
    }
    throw new Error('Cannot read prompt: \n' + stdOutput)
  }

  private async emitStatusChanges(prompt: string, mainBody: string, emitHistoryLength: boolean) {
    const result = this.parsePrompt(prompt)

    if (result === GHCIDebug.pausedOnError) {
      const historyLength = await this.getHistoryLength()

      this.emitter.emit('paused-on-exception', {
        historyLength,
        localBindings: mainBody.split('\n').slice(1),
      })
    } else if (result === GHCIDebug.finishedDebugging) {
      this.emitter.emit('debug-finished', undefined)
    } else {
      const breakInfo = result as BreakInfo

      breakInfo.localBindings = await this.getBindings()

      if (emitHistoryLength) {
        breakInfo.historyLength = await this.getHistoryLength()
      }

      this.emitter.emit('line-changed', breakInfo)
    }
  }

  private onStderrReadable() {
    const stderrOutput = this.stderr.read() as string | Buffer | null
    if (!stderrOutput || this.ignoreErrors) {
      return // this is the end of the input stream
    }

    this.emitter.emit('error', stderrOutput.toString())

    if (this.currentStderrOutput === '') {
      const disp = this.emitter.on('ready', () => {
        this.emitter.emit('error-completed', this.currentStderrOutput)
        this.currentStderrOutput = ''
        disp.dispose()
      })
    }

    this.currentStderrOutput += stderrOutput.toString()
  }

  private onStdoutReadable() {
    const currentString = (this.stdout.read() as string | Buffer | null || '').toString()

    this.currentCommandBuffer += currentString

    const finishStringPosition = this.currentCommandBuffer.search(this.commandFinishedString)
    if (finishStringPosition !== -1) {
      const outputString = this.currentCommandBuffer.slice(0, finishStringPosition)

      if (this.currentCommand) {
        if (this.currentCommand.emitCommandOutput) {
          this.emitter.emit('console-output', outputString)
        }

        this.currentCommand.onFinish(outputString)
      }

      // Take the finished string off the buffer and process the next ouput
      this.currentCommandBuffer = this.currentCommandBuffer.slice(
        finishStringPosition + this.commandFinishedString.length)
      this.onStdoutReadable()
    }
  }

  private async moduleNameFromFilePath(filePath: string): Promise<string> {
    const cachedModuleName = this.moduleNameByPath.get(filePath)
    if (cachedModuleName) return cachedModuleName
    const modules = (await this.run(':show modules')).split(os.EOL)
    const regex = /^([^ ]+) +\( +(.+), +\w+ +\)$/
    for (const moduleStr of modules) {
      const matchResult = regex.exec(moduleStr)
      if (matchResult) {
        this.moduleNameByPath.set(matchResult[2], matchResult[1])
      } else {
        console.error(`Unexpected reply from GHCI ':show modules': ${moduleStr}`)
      }
    }
    const newCachedModuleName = this.moduleNameByPath.get(filePath)
    if (newCachedModuleName) {
      return newCachedModuleName
    } else {
      throw new Error(`Couldn't find module name for ${filePath}`)
    }
  }
}
