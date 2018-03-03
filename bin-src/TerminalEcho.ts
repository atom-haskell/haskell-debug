import net = require('net')
import os = require('os')
import readline = require('readline')
import { Message } from './message'

const PIPE_NAME = 'haskell-debug'

const connectionPath =
  os.platform() === 'win32'
    ? '\\\\.\\pipe\\' + PIPE_NAME
    : `/tmp/${PIPE_NAME}.sock`
const client = net.connect(connectionPath)

const rl = readline.createInterface({
  input: process.stdin,
})

rl.on('line', (text: string) => {
  client.write(text + '\n')
})

let totalData: string[] = []
client.on('data', (data: Buffer) => {
  onData(data.toString())
})

function onData(data: string) {
  totalData.push(data)
  const packets = totalData.join('').split('\n')
  const last = packets.pop()
  totalData = last ? [last] : []
  packets.forEach((packet) => onMessage(JSON.parse(packet) as Message))
}

function onMessage(message: Message) {
  if (message.type === 'message') {
    process.stdout.write(message.content)
  } else if (message.type === 'display-command') {
    process.stdout.write(message.command)
  } else if (message.type === 'destroy-prompt') {
    rl.close()
  } else if (message.type === 'close') {
    process.exit()
  }
}
