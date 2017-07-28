import cp = require('child_process')
import net = require('net')
import os = require('os')
import util = require('util')
import atomAPI = require('atom')

const PIPE_PATH = 'haskell-debug'

class TerminalReporter {
    private process?: cp.ChildProcess
    private server: net.Server
    private socket?: net.Socket

    /**Events:  command(command: string)
                close()
    */
    emitter = new atomAPI.Emitter()

    prompt () {
        this.send({
            type: 'user_input'
        })
    }

    write (output: string) {
        this.send({
            type: 'message',
            content: output
        })
    }

    displayCommand (command: string) {
        this.send({
            type: 'display-command',
            command
        })
    }

    private streamData = ''
    private send (data: Object) {
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

    private totalData = ''
    private onData (data: Buffer) {
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

    destroy () {
        if (this.process) {
            this.send({
                type: 'close'
            })
            this.process.kill()
        }
        this.server.close()
    }

    constructor () {
        const connectionPath = os.platform() === 'win32' ?
            '\\\\.\\pipe\\' + PIPE_PATH : `/tmp/${PIPE_PATH}.sock`
        const terminalEchoPath = `${__dirname}/TerminalEcho.js`

        this.server = net.createServer((socket) => {
            this.socket = socket
            if (this.streamData !== '') {
                this.socket.write(this.streamData)
            }
            socket.on('data', (data) => this.onData(data))
            socket.on('end', () => {
                this.emitter.emit('close')
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
}

export = TerminalReporter
