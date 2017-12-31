import os = require('os')
import atomAPI = require('atom')
import * as ahu from 'atom-haskell-utils'
import { InteractiveProcess, IRequestResult } from './interactive-process'
import { EOL } from 'os'

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

  private process?: InteractiveProcess
  private readyPromise: Promise<IRequestResult>
  private moduleNameByPath: Map<string, string> = new Map()

  constructor(ghciCommand = 'ghci', ghciArgs: string[] = [], bufferPath?: string) {
    this.addReadyEvent()
    this.readyPromise = this.init(ghciCommand, ghciArgs, bufferPath)

    this.readyPromise.then((response) => {
      console.warn(response.stderr.join(EOL))
    })
  }

  public destroy() {
    this.stop()
  }

  public async loadModule(name: string) {
    await this.run(`:load ${name}`)
  }

  public async setExceptionBreakLevel(level: ExceptionBreakLevels) {
    await this.run(':unset -fbreak-on-exception', false, false, false, false)
    await this.run(':unset -fbreak-on-error', false, false, false, false)

    switch (level) {
      case 'exceptions':
        await this.run(':set -fbreak-on-exception', false, false, false, false)
        break
      case 'errors':
        await this.run(':set -fbreak-on-error', false, false, false, false)
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

    // TODO: for the code below, ignore errors

    // try printing expression
    const printingResult = getExpression(
      await this.run(`:print ${expression}`, false, false, false, false))
    if (printingResult !== undefined) {
      return printingResult
    }

    // if that fails assign it to a temporary variable and evaluate that
    let tempVarNum = 0
    let potentialTempVar: string | undefined
    do {
      tempVarNum += 1
      potentialTempVar = getExpression(
        await this.run(`:print temp${tempVarNum}`, false, false, false, false))
    } while (potentialTempVar !== undefined)

    await this.run(`let temp${tempVarNum} = ${expression}`, false, false, false, false)
    return getExpression(await this.run(`:print temp${tempVarNum}`, false, false, false, false))
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
        this.process && this.process.destroy()
      },
      3000)
  }

  public continue() {
    this.run(':continue', true)
  }

  public async addedAllListeners() {
    return this.readyPromise
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
    emitErrors: boolean = true,
  ): Promise<string> {
    await this.readyPromise
    if (!this.process) throw new Error('No interactive process')
    let prompt = ''
    let tail = ''

    const response = await this.process.request(commandText + EOL, (arg) => {
      if (arg.type === 'stdin') {
        if (emitCommandOutput) this.emitter.emit('command-issued', arg.line)
      } else if (arg.type === 'prompt') {
        tail = arg.prompt[1]
        prompt = arg.prompt[2]
        if (emitCommandOutput) this.emitter.emit('console-output', `${tail}${prompt}> `)
      } else if (arg.type === 'stdout') {
        if (emitCommandOutput) this.emitter.emit('console-output', arg.line + EOL)
      } else if (arg.type === 'stderr') {
        if (emitErrors) this.emitter.emit('error', arg.line + EOL)
      }
    })

    const result = response.stdout
    const err = response.stderr

    if (tail) result.push(tail)

    if (emitErrors && err.length) this.emitter.emit('error-completed', err.join(EOL))

    if (emitStatusChanges) {
      await this.emitStatusChanges(
        prompt,
        result.join(EOL),
        emitHistoryLength,
      )
    }
    return result.join(EOL)
  }

  private async init(ghciCommand = 'ghci', ghciArgs: string[] = [], bufferPath?: string) {
    // tslint:disable-next-line:no-null-keyword
    const cwd = (await ahu.getRootDir(bufferPath || null)).getPath()
    this.process = new InteractiveProcess(
      ghciCommand, ghciArgs,
      () => { this.emitter.emit('debug-finished', undefined) },
      { cwd, shell: true },
      /^(.*)#~IDEHASKELLREPL~(.*)~#$/,
    )

    return this.process.request(
      `:set prompt2 \"\"${EOL}` +
      `:set prompt-cont \"\"${EOL}` +
      `:set prompt \"#~IDEHASKELLREPL~%s~#\\n\"${EOL}`,
      (arg) => {
        // tslint:disable-next-line:totality-check
        if (arg.type === 'stdout') {
          this.emitter.emit('console-output', arg.line + EOL)
        // tslint:disable-next-line:totality-check
        } else if (arg.type === 'stderr') {
          this.emitter.emit('error', arg.line + EOL)
        // tslint:disable-next-line:totality-check
        } else if (arg.type === 'prompt') {
          this.emitter.emit('console-output', `${arg.prompt[1]}${arg.prompt[2]}> `)
        }
      },
    )
  }

  private addReadyEvent() {
    this.emitter.on('paused-on-exception', () => this.emitter.emit('ready', undefined))
    this.emitter.on('line-changed', () => this.emitter.emit('ready', undefined))
    this.emitter.on('debug-finished', () => this.emitter.emit('ready', undefined))
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
      pattern: /^\[(?:[-\d]*: )?(.*):\((\d+),(\d+)\)-\((\d+),(\d+)\).*\].*$/,
      func: (match) => ({
        filename: match[1],
        range: [[parseInt(match[2], 10) - 1, parseInt(match[3], 10) - 1],
        [parseInt(match[4], 10), parseInt(match[5], 10)]],
      }),
    }, {
      pattern: /^\[(?:[-\d]*: )?(.*):(\d*):(\d*)-(\d*)\].*$/,
      func: (match) => ({
        filename: match[1],
        range: [[parseInt(match[2], 10) - 1, parseInt(match[3], 10) - 1],
        [parseInt(match[2], 10) - 1, parseInt(match[4], 10)]],
      }),
    }, {
      pattern: /^\[<exception thrown>\].*$/,
      func: () => GHCIDebug.pausedOnError,
    }, {
      pattern: /^.*$/,
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
