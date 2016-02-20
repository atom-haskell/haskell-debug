import cp = require("child_process");
import stream = require("stream");
import atomAPI = require("atom");

function getPenultimateLine(str: string){
    var lines = str.split("\n")
    return lines[lines.length - 1];
}

module HaskellDebug {
    interface BreakInfo{
        filename: string;
        range: TextBuffer.IRange;
        onError?: boolean;
    }

    class HaskellDebug{
        private ghci_cmd: cp.ChildProcess;
        private stdout: stream.Readable;
        private stdin: stream.Writable;

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

        constructor(filename: string){
            this.ghci_cmd = cp.spawn("ghci", [filename]);
            this.stdout = this.ghci_cmd.stdout;
            this.stdin = this.ghci_cmd.stdin;
        }

        pauseOnException(){
            this.out(":set -fbreak-on-exception");
        }

        static pausedOnError = Symbol("Paused on Error");
        static finishedDebugging = Symbol("Finished debugging")

        async getBindings(){
            this.out(":show bindings");
            var outputStr = await this.in();
            var lines = outputStr.split("\n")
            return lines.slice(0, lines.length - 2);
        }

        private readPrompt(stdOutput: string): BreakInfo | Symbol{
            var breakInfoOb: BreakInfo;

            var multiLine = /\[(?:[-\d]*:)?(.*):\((\d+),\d+\)-\(\d+,\d+\).*\]/;
            var mutliLineMatch = stdOutput.match(stdOutput);
            var singleLine = /\[(?:[-\d]*:)?(.*):\d*:\d*-\d*\]/;
            var singleLineMatch = stdOutput.match(stdOutput);
            var errorPattern = /\[<exception thrown>\]/;
            var errorMatch = stdOutput.match(errorPattern);

            if(mutliLineMatch != null){
                return {
                    filename: mutliLineMatch[0],
                    range: new atomAPI.Range([multiLine[1], multiLine[2]],
                        [multiLine[3], multiLine[4]])
                }
            }
            else if(singleLineMatch != null){
                return {
                    filename: mutliLineMatch[0],
                    range: new atomAPI.Range([multiLine[1], multiLine[2]],
                        [multiLine[1], multiLine[3]])
                }
            }
            else if(errorMatch != null){
                return HaskellDebug.pausedOnError
            }
            else{
                return HaskellDebug.finishedDebugging;
            }
        }

        private observeInput(){
            this.stdout.cork();
            var listenerFunc = (data: string) => {
                var input = this.readPrompt(data);

                if(input == HaskellDebug.pausedOnError){
                    observer.removeListener("data", listenerFunc);
                    this.out("print _exception")
                    observer.once("data", (data) => {
                        var errorMes = getPenultimateLine(data);
                        this.emitter.emit("paused-on-exception", errorMes);

                        observer.addListener("data", listenerFunc);
                        this.out(":back");
                    })
                }
                else if(input == HaskellDebug.finishedDebugging){
                    this.emitter.emit("debug-finished", undefined);
                }
                else{
                    this.emitter.emit("line-changed", input);
                }
            };

            var observer = this.stdout.once("data", listenerFunc);
        }

        async startDebug(pauseOnException: boolean){
            await this.in();
            this.out(":trace main")

            if (pauseOnException)
                this.pauseOnException();

            this.observeInput();

            this.out("print _exception")
            var errorMes = getPenultimateLine(await this.in())
            this.out(":back");
            console.log("Broken on error: '" + errorMes + "'");
        }

        private in(): Promise<string>{
            return new Promise((fulfil) => {
                this.stdout.once("data", (data: Buffer) => fulfil(data.toString()))
            })
        }

        private out(str: string){
            this.stdin.write(str)
        }
    }
}

export = HaskellDebug
