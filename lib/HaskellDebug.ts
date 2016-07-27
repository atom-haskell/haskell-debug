import cp = require("child_process");
import stream = require("stream");
import os = require("os");
var Emitter = require("./Emitter");

module HaskellDebug {
    function getPenultimateLine(str: string){
        var lines = str.split("\n");
        return lines[lines.length - 1];
    }

    export interface BreakInfo{
        filename: string;
        range: number[][];
        onError?: boolean;
    }

    export class HaskellDebug{
        private ghci_cmd: cp.ChildProcess;
        stdout: stream.Readable;
        stdin: stream.Writable;
        stderr: stream.Readable;
        private breakpoints: Breakpoint[] = []; //Lines to break on
        private isRunning = false;

        /** Event Handler
          *
          * Events:
          *
          * paused-on-exception: (name: string)
          *     Emmited when the debugger is at an exception. Will raise on-line-change later
          *
          * line-changed: (info: BreakInfo)
          *     Emmited when the line that the debugger is on changes
          *
          * debug-finished: (void)
          *     Emmited when the debugger has reached the end of the program
          */
        public emitter = new Emitter();

        constructor(){
            this.ghci_cmd = cp.spawn("ghci");
            this.stdout = this.ghci_cmd.stdout;
            this.stdin = this.ghci_cmd.stdin;
            this.stderr = this.ghci_cmd.stderr;
            this.stdout.on("readable", () => this.onReadable());
            this.stderr.on("readable", () => console.log(`stderr: %c ${this.stderr.read().toString()}`, "color: red"))
        }

        public loadModule(name: string){
            this.run(`:load ${name}`);
        }

        public pauseOnException(){
            this.run(":set -fbreak-on-exception");
        }

        public addBreakpoint(breakpoint: Breakpoint | string){
            if(typeof breakpoint == "string")
                this.run(`:break ${breakpoint}`);
            else
                this.run(`:break ${breakpoint.file} ${breakpoint.line}`);
        }


        public forward(){
            this.run(":forward", true);
        }

        public back(){
            this.run(":back", true);
        }

        async startDebug(){
            await this.run(":trace main", true);
        }

        async getBindings(){
            var outputStr = await this.run(":show bindings");
            var lines = outputStr.split(os.EOL)
            return lines.slice(0, lines.length - 2);
        }

        static pausedOnError = Symbol("Paused on Error");
        static finishedDebugging = Symbol("Finished debugging")

        private parsePrompt(stdOutput: string): BreakInfo | Symbol{
            var breakInfoOb: BreakInfo;
            var patterns = <{pattern: RegExp; func: (match: string[]) => BreakInfo | Symbol}[]>[{
                pattern: /\[(?:[-\d]*: )?(.*):\((\d+),(\d+)\)-\((\d+),(\d+)\).*\].*> $/,
                func: match => ({
                    filename: match[1],
                    range: [[parseInt(match[2]) - 1, parseInt(match[3]) - 1],
                        [parseInt(match[4]), parseInt(match[5])]]
                })
            },{
                pattern: /\[(?:[-\d]*: )?(.*):(\d*):(\d*)-(\d*)\].*> $/,
                func: match => ({
                        filename: match[1],
                        range: [[parseInt(match[2]) - 1, parseInt(match[3]) - 1],
                            [parseInt(match[2]), parseInt(match[4])]]
                })
            },{
                pattern: /\[<exception thrown>\].*> $/,
                func: () => HaskellDebug.pausedOnError
            },{
                pattern: /.*> $/,
                func: () => HaskellDebug.finishedDebugging
            }]
            for (var pattern of patterns){
                var matchResult = stdOutput.match(pattern.pattern);
                if(matchResult != null){
                    return pattern.func(matchResult);
                }
            }
            throw new Error("Cannot read prompt: \n" + stdOutput);
        }

        private async emitStatusChanges(prompt: string){
            var result = this.parsePrompt(prompt);

            if(result == HaskellDebug.pausedOnError) {
                var exceptionString = await this.run("print _exception");
            }
            else if(result == HaskellDebug.finishedDebugging){
                this.emitter.emit("debug-finished", undefined);
            }
            else{
                this.emitter.emit("line-changed", result);
            }
        }

        private currentCommandBuffer = "";
        private commandListeners = <((output: string) => any)[]>[];
        private commandFinishedString = "\"command_finish_o4uB1whagteqE8xBq9oq\"" + os.EOL;

        private onReadable(){
            var currentString = (this.stdout.read() || "").toString();
            console.log(currentString);
            this.currentCommandBuffer += currentString;

            var finishStringPosition = this.currentCommandBuffer.search(this.commandFinishedString);
            if(finishStringPosition !== -1){
                var callback = this.commandListeners.shift();
                callback(this.currentCommandBuffer.slice(0, finishStringPosition));

                // Take the finished string off the buffer and process the next ouput
                this.currentCommandBuffer = this.currentCommandBuffer.slice(
                    finishStringPosition + this.commandFinishedString.length);
                this.onReadable();
            }
        }

        private run(command: string, emitStatusChanges?: boolean): Promise<string>{
            emitStatusChanges = emitStatusChanges || false;
            return new Promise(fulfil => {
                this.stdin.write(command + os.EOL);
                this.stdin.write(this.commandFinishedString);
                this.commandListeners.push(output => {
                    console.log(command);
                    var commandPosition = output.search(">");
                    var promptPosition = output.lastIndexOf(os.EOL) + os.EOL.length;
                    if(emitStatusChanges){
                        this.emitStatusChanges(output.slice(promptPosition)).then(() => {
                            fulfil(output.slice(commandPosition + os.EOL.length, promptPosition - os.EOL.length));
                        })
                    }
                })
            })
        }
    }
}

export = HaskellDebug
