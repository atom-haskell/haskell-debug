import cp = require('child_process')
import net = require('net')
import os = require('os')
import util = require('util')
import atomAPI = require('atom')
import { Message } from '../bin/message'

const PIPE_PATH = 'haskell-debug'

export class TerminalReporter {
  private emitter: atomAPI.Emitter<{
    'close': undefined
  }, {
    'command': string
  }> = new atomAPI.Emitter()
  // tslint:disable-next-line: member-ordering
  public readonly on = this.emitter.on.bind(this.emitter)

  private process?: cp.ChildProcess
  private server: net.Server
  private socket?: net.Socket
  private streamData = ''
  private totalData = ''

  constructor() {
    const connectionPath = os.platform() === 'win32' ?
      '\\\\.\\pipe\\' + PIPE_PATH : `/tmp/${PIPE_PATH}.sock`
    const terminalEchoPath = `${__dirname}/../bin/TerminalEcho.js`

    this.server = net.createServer((socket) => {
      this.socket = socket
      if (this.streamData !== '') {
        this.socket.write(this.streamData)
      }
      socket.on('data', (data) => this.onData(data))
      socket.on('end', () => {
        this.emitter.emit('close', undefined)
      })
    })

    this.server.listen(connectionPath, () => {
      if (atom.config.get('haskell-debug.showTerminal')) {
        const nodeCommand = `${atom.config.get('haskell-debug.nodeCommand')} ${terminalEchoPath}`
        const commandToRun = util.format(atom.config.get('haskell-debug.terminalCommand'), nodeCommand)

        this.process = cp.exec(commandToRun)
      }
    })
  }

  public destroy() {
    if (this.process) {
      this.send({
        type: 'close',
      })
      this.process.kill()
    }
    this.server.close()
  }

  public write(output: string) {
    this.send({
      type: 'message',
      content: output,
    })
  }

  public displayCommand(command: string) {
    this.send({
      type: 'display-command',
      command,
    })
  }

  private send(data: Message) {
    try {
      const sendingData = JSON.stringify(data) + '\n'

      if (this.socket === undefined) {
        this.streamData += sendingData
      } else {
        this.socket.write(sendingData)
      }
    } catch (e) {
      // ignore erros
    }
  }

  private onData(data: Buffer) {
    const newLinePos = data.indexOf('\n')
    if (newLinePos !== -1) {
      this.totalData += data.slice(0, newLinePos)
      this.emitter.emit('command', this.totalData)
      this.totalData = ''
      this.onData(data.slice(newLinePos + 1))
    } else {
      this.totalData += data
    }
  }
}
