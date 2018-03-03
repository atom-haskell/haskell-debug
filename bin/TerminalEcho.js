"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var net = require("net");
var os = require("os");
var readline = require("readline");
var PIPE_NAME = 'haskell-debug';
var connectionPath = os.platform() === 'win32'
    ? '\\\\.\\pipe\\' + PIPE_NAME
    : "/tmp/" + PIPE_NAME + ".sock";
var client = net.connect(connectionPath);
var rl = readline.createInterface({
    input: process.stdin,
});
rl.on('line', function (text) {
    client.write(text + '\n');
});
var totalData = [];
client.on('data', function (data) {
    onData(data.toString());
});
function onData(data) {
    totalData.push(data);
    var packets = totalData.join('').split('\n');
    var last = packets.pop();
    totalData = last ? [last] : [];
    packets.forEach(function (packet) { return onMessage(JSON.parse(packet)); });
}
function onMessage(message) {
    if (message.type === 'message') {
        process.stdout.write(message.content);
    }
    else if (message.type === 'display-command') {
        process.stdout.write(message.command);
    }
    else if (message.type === 'destroy-prompt') {
        rl.close();
    }
    else if (message.type === 'close') {
        process.exit();
    }
}
