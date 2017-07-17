import cp = require('child_process')
import stream = require('stream')
import os = require('os')
import emissary = require('emissary')
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

interface EmitterOnMap {
  'ready': () => any
  'debug-finished': () => any
  'paused-on-exception': (info: ExceptionInfo) => any
  'error': (text: string) => any
  'error-completed': (text: string) => any
  'line-changed': (info: BreakInfo) => any
  'console-output': (output: string) => any
  'command-issued': (command: string) => any
}

interface EmitterEmitMap {
  'paused-on-exception': ExceptionInfo
  'ready': ExceptionInfo | undefined
  'error': string
  'error-completed': string
  'line-changed': BreakInfo
  'debug-finished': any
  'console-output': string
  'command-issued': string
}

export interface GHCIDebugEmitter extends Emissary.IEmitter {
    on<K extends keyof EmitterOnMap> (eventName: K, handler: EmitterOnMap[K]): atomAPI.Disposable
    emit<K extends keyof EmitterEmitMap> (eventName: K, value: EmitterEmitMap[K]): void
}

interface Command {
    text: string
    emitCommandOutput: boolean
    fulfilWithPrompt: boolean
    onFinish: (output: string) => any
}

export class GHCIDebug {
    private ghciCmd: cp.ChildProcess
    stdout: stream.Readable
    stdin: stream.Writable
    stderr: stream.Readable

    /** Event Handler
      *
      * Events:
      *
      * ready: ()
      *     Emmited when ghci has just stopped executing a command
      *
      * paused-on-exception: (info: ExceptionInfo)
      *     Emmited when the debugger is at an exception
      *
      * error: (text: string)
      *     Emmited when stderr has input
      *
      * error-completed: (text: string)
      *     Emmited when ghci reports an error for a given command
      *
      * line-changed: (info: BreakInfo)
      *     Emmited when the line that the debugger is on changes
      *
      * debug-finished: (void)
      *     Emmited when the debugger has reached the end of the program
      *
      * console-output: (output: string)
      *     Emmited when the ghci has outputed something to stdout, excluding the extra prompt
      *
      * command-issued: (command: string)
      *     Emmited when a command has been executed
      */
    public emitter: GHCIDebugEmitter = new emissary.Emitter()

    private startText: Promise<string>

    constructor (ghciCommand= 'ghci', ghciArgs: string[] = [], folder?: string) {

        this.ghciCmd = cp.spawn(ghciCommand, ghciArgs, {cwd: folder, shell: true})

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

    private addReadyEvent () {
        const eventSubs = [
            'paused-on-exception',
            'line-changed',
            'debug-finished',
        ]

        for (const eventName of eventSubs){
            (this.emitter.on as any)(eventName, () => this.emitter.emit('ready', undefined))
        }
    }

    public destroy () {
        this.stop()
    }

    public loadModule (name: string) {
        const cwd = path.dirname(name)

        this.run(`:cd ${cwd}`)
        this.run(`:load ${name}`)
    }

    public setExceptionBreakLevel (level: ExceptionBreakLevels) {
        this.run(':unset -fbreak-on-exception')
        this.run(':unset -fbreak-on-error')

        if (level === 'exceptions') {
            this.run(':set -fbreak-on-exception')
        } else if (level === 'errors') {
            this.run(':set -fbreak-on-error')
        }
    }

    public addBreakpoint (breakpoint: Breakpoint | string) {
        if (typeof breakpoint === 'string') {
            this.run(`:break ${breakpoint}`)
        } else {
            this.run(`:break ${breakpoint.file} ${breakpoint.line}`)
        }
    }

    /** resolved the given expression using :print, returns null if it is invalid
    */
    public async resolveExpression (expression: string) {
        // expressions can't have new lines
        if (expression.indexOf('\n') !== -1) {
            return
        }

        const getExpression = (ghciOutput: string, variable: string) => {
            const matchResult = ghciOutput.match(/[^ ]* = (.*)/)
            if (! matchResult) { return }
            return matchResult[1]
        }

        // for the code below, ignore errors
        this.ignoreErrors = true

        try {
            // try printing expression
            const printingResult = getExpression(
              await this.run(`:print ${expression}`, false, false, false), expression)
            if (printingResult !== undefined) {
                return printingResult
            }

            // if that fails assign it to a temporary variable and evaluate that
            let tempVarNum = 0
            let potentialTempVar: string | undefined
            do {
                potentialTempVar = getExpression(
                  await this.run(`:print temp${tempVarNum}`, false, false, false), `temp${tempVarNum}`)
                tempVarNum += 1
            } while (potentialTempVar !== undefined)

            await this.run(`let temp${tempVarNum} = ${expression}`, false, false, false)
            return getExpression(await this.run(`:print temp${tempVarNum}`, false, false, false), `temp${tempVarNum}`)
        } finally {
            this.ignoreErrors = false
        }
    }

    public forward () {
        this.run(':forward', true)
    }

    public back () {
        this.run(':back', true)
    }

    public step () {
        this.run(':step', true, true)
    }

    public stop () {
        this.run(':quit')
        setTimeout(
        () => {
          this.ghciCmd.kill()
        },
        3000)
    }

    public continue () {
        this.run(':continue', true)
    }

    public async addedAllListeners () {
        this.startText.then((text) => {
            const firstPrompt = text.indexOf('> ')
            this.emitter.emit('console-output', text.slice(0, firstPrompt + 2))
        })
    }

    async startDebug (moduleName?: string) {
        moduleName = moduleName || 'main'
        await this.run(':trace ' + moduleName, true, true)
    }

    async getBindings () {
        const outputStr = await this.run(':show bindings', false, false, false)
        return outputStr.split(os.EOL)
    }

    private async getHistoryLength () {
        const historyQuery = await this.run(':history 100', false, false, false)
        const regex = /-(\d*).*(?:\n|\r|\r\n)<end of history>$/

        const matchResult = historyQuery.match(regex)
        if (! matchResult) {
            return 0
        } else if (historyQuery.slice(-3) === '...') {
            return Infinity // history is very long
        } else {
            return parseInt(matchResult[1], 10)
        }
    }

    static pausedOnError = Symbol('Paused on Error')
    static finishedDebugging = Symbol('Finished debugging')

    private parsePrompt (stdOutput: string): BreakInfo | Symbol {
        const patterns = [{
            pattern: /\[(?:[-\d]*: )?(.*):\((\d+),(\d+)\)-\((\d+),(\d+)\).*\].*> $/,
            func: (match) => ({
                filename: match[1],
                range: [[parseInt(match[2], 10) - 1, parseInt(match[3], 10) - 1],
                    [parseInt(match[4], 10), parseInt(match[5], 10)]]
            })
        }, {
            pattern: /\[(?:[-\d]*: )?(.*):(\d*):(\d*)-(\d*)\].*> $/,
            func: (match) => ({
                    filename: match[1],
                    range: [[parseInt(match[2], 10) - 1, parseInt(match[3], 10) - 1],
                        [parseInt(match[2], 10) - 1, parseInt(match[4], 10)]]
            })
        }, {
            pattern: /\[<exception thrown>\].*> $/,
            func: () => GHCIDebug.pausedOnError
        }, {
            pattern: /.*> $/,
            func: () => GHCIDebug.finishedDebugging
        }] as Array<{pattern: RegExp; func: (match: string[]) => BreakInfo | Symbol}>
        for (const pattern of patterns){
            const matchResult = stdOutput.match(pattern.pattern)
            if (matchResult) {
                return pattern.func(matchResult)
            }
        }
        throw new Error('Cannot read prompt: \n' + stdOutput)
    }

    private async emitStatusChanges (prompt: string, mainBody: string, emitHistoryLength: boolean) {
        const result = this.parsePrompt(prompt)

        if (result === GHCIDebug.pausedOnError) {
            const historyLength = await this.getHistoryLength()

            this.emitter.emit('paused-on-exception', {
                historyLength,
                localBindings: mainBody.split('\n').slice(1)
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

    private ignoreErrors = false
    private currentStderrOutput = ''
    private onStderrReadable () {
        const stderrOutput: Buffer = this.stderr.read()
        if (! stderrOutput || this.ignoreErrors) {
            return // this is the end of the input stream
        }

        this.emitter.emit('error', stderrOutput.toString())

        if (this.currentStderrOutput === '') {
            this.emitter.once('ready', () => {
                this.emitter.emit('error-completed', this.currentStderrOutput)
                this.currentStderrOutput = ''
            })
        }

        this.currentStderrOutput += stderrOutput.toString()
    }

    private currentCommandBuffer = ''
    private commands = [] as Command[]
    private currentCommand?: Command
    private commandFinishedString = 'command_finish_o4uB1whagteqE8xBq9oq'

    private onStdoutReadable () {
        const currentString = (this.stdout.read() || '').toString()

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

    public async run (commandText: string,
                      emitStatusChanges: boolean = false,
                      emitHistoryLength: boolean = false,
                      emitCommandOutput: boolean = true,
                      fulfilWithPrompt: boolean = false): Promise<string> {
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

        let currentPromise: Promise<string>
        return currentPromise = new Promise<string>((fulfil) => {
            const command: Command = {
                text: commandText,
                emitCommandOutput,
                fulfilWithPrompt,
                onFinish: async (output) => {
                    this.currentCommand = undefined

                    function _fulfil (noPrompt: string) {
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
                            this.emitStatusChanges(output, '', emitHistoryLength).then(() => {
                                _fulfil('')
                            })
                        } else {
                            _fulfil('')
                        }
                    } else {
                        const promptBeginPosition = lastEndOfLinePos + os.EOL.length

                        if (emitStatusChanges) {
                            this.emitStatusChanges(output.slice(promptBeginPosition, output.length),
                                                   output.slice(0, lastEndOfLinePos),
                                                   emitHistoryLength).then(() => {
                                _fulfil(output.slice(0, lastEndOfLinePos))
                            })
                        } else {
                            _fulfil(output.slice(0, lastEndOfLinePos))
                        }
                    }

                    await currentPromise

                    if (this.commands.length !== 0 && this.currentCommand === undefined) {
                        shiftAndRunCommand()
                    }
                }
            }

            this.commands.push(command)

            if (this.currentCommand === undefined) {
                shiftAndRunCommand()
            }
        })
    }
}
