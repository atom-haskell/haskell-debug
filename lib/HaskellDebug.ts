import cp = require("child_process");
import stream = require("stream");
import atomAPI = require("atom");

module HaskellDebug {
    function getPenultimateLine(str: string){
        var lines = str.split("\n")
        return lines[lines.length - 1];
    }

    export interface BreakInfo{
        filename: string;
        range: TextBuffer.IRange;
        onError?: boolean;
    }

    export interface Breakpoint{
        line: number;
        module: string;
    }

    export class HaskellDebug{
        private ghci_cmd: cp.ChildProcess;
        stdout: stream.Readable;
        stdin: stream.Writable;
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
        public emitter = new atomAPI.Emitter();

        constructor(){
            this.ghci_cmd = cp.spawn("ghci");
            this.stdout = this.ghci_cmd.stdout;
            this.stdin = this.ghci_cmd.stdin;
            this.stdout.on("message", (...args) => {
                console.log(args);
            })
        }

        public async loadModule(name: string){
            await this.out(`:load ${name}`);
        }

        public async pauseOnException(){
            await this.out(":set -fbreak-on-exception");
        }

        public async addBreakpoint(breakpoint: Breakpoint){
            await this.out(`:break ${breakpoint.module} ${breakpoint.line}`)
        }

        async getBindings(){
            this.out(":show bindings");
            var outputStr = await this.in();
            var lines = outputStr.split("\n")
            return lines.slice(0, lines.length - 2);
        }

        static pausedOnError = Symbol("Paused on Error");
        static finishedDebugging = Symbol("Finished debugging")
        static notFinal = Symbol("Not final");

        private readPrompt(stdOutput: string): BreakInfo | Symbol{
            var breakInfoOb: BreakInfo;
            var patterns = <{pattern: RegExp; func: (match: string[]) => BreakInfo | Symbol}[]>[{
                pattern: /\[(?:[-\d]*: )?(.*):\((\d+),(\d+)\)-\((\d+),(\d+)\).*\].*> $/,
                func: match => ({
                    filename: match[1],
                    range: new atomAPI.Range([parseInt(match[2]) - 1, parseInt(match[3]) - 1],
                        [parseInt(match[4]), parseInt(match[5])])
                })
            },{
                pattern: /\[(?:[-\d]*: )?(.*):(\d*):(\d*)-(\d*)\].*> $/,
                func: match => ({
                        filename: match[1],
                        range: new atomAPI.Range([parseInt(match[2]) - 1, parseInt(match[3]) - 1],
                            [parseInt(match[2]), parseInt(match[4])])
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
            return HaskellDebug.notFinal;
        }

        public forward(){
            this.observeInput();
            this.out(":forward");
        }

        public back(){
            this.observeInput()
            this.out(":back");
        }

        private async observeInput(){
            this.stdout.cork();
            var str = await this.in();
            var input = this.readPrompt(str.toString());

            if(input == HaskellDebug.pausedOnError){
                this.stdout.cork();
                this.stdout.pause();
                this.out("print _exception")
                this.stdout.once("data", (newData) => {/*
                    var errorMes = getPenultimateLine(newData.toString());
                    this.emitter.emit("paused-on-exception", errorMes);*/
                    //Doesn't work at the moment - print _exception doesn't work
                    //TODO: make work

                    this.observeInput();
                    this.out(":back");
                })
                this.stdout.unpause();
            }
            else if(input == HaskellDebug.finishedDebugging){
                this.emitter.emit("debug-finished", undefined);
            }
            else if(input == HaskellDebug.notFinal){
                this.observeInput();
            }
            else{
                this.emitter.emit("line-changed", input);
            }
        }

        async startDebug(pauseOnException: boolean){
            await this.in();

            this.out(":trace main")

            this.observeInput();
        }

        private in(): Promise<string>{
            return new Promise((fulfil) => {
                this.stdout.once("data", (data: Buffer) => fulfil(data.toString()))
            })
        }

        private out(str: string){
            this.stdin.write(str + "\n");
        }
    }
}

export = HaskellDebug
