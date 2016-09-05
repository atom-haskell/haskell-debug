import cp = require("child_process");
import stream = require("stream");
import os = require("os");
import emissary = require("emissary")
import atomAPI = require("atom");
import path = require("path");

var atom = atom || {devMode: true};

module GHCIDebug {
    export interface BreakInfo{
        filename: string;
        range: number[][];
        historyLength?: number;
        localBindings: string[]
    }

    export interface ExceptionInfo {
        historyLength: number;
        localBindings: string[];
    }

    export interface GHCIDebugEmitter extends Emissary.IEmitter{
        on(eventName: "ready", handler: () => any): AtomCore.Disposable;
        on(eventName: "paused-on-exception", handler: (info: ExceptionInfo) => any): AtomCore.Disposable;
        on(eventName: "error", handler: (text: string) => any): AtomCore.Disposable;
        on(eventName: "line-changed", handler: (info: BreakInfo) => any): AtomCore.Disposable;
        on(eventName: "debug-finished", handler: () => any): AtomCore.Disposable;
        on(eventName: "console-output", handler: (output: string) => any): AtomCore.Disposable;
        on(eventName: "command-issued", handler: (command: string) => any): AtomCore.Disposable;

        emit(eventName: "paused-on-exception", value: ExceptionInfo): void;
        emit(eventName: "ready", value: ExceptionInfo): void;
        emit(eventName: "error", text: string): void;
        emit(eventName: "line-changed", value: BreakInfo): void;
        emit(eventName: "debug-finished", value: any): void;
        emit(eventName: "console-output", value: string): void;
        emit(eventName: "command-issued", value: string): void;
    }

    interface Command{
        text: string;
        shouldEmit: boolean;
        onFinish: (output: string) => any;
    }

    export class GHCIDebug{
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
          * ready: ()
          *     Emmited when ghci has just stopped executing a command
          *
          * paused-on-exception: (info: ExceptionInfo)
          *     Emmited when the debugger is at an exception
          *
          * error: (text: string)
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
        public emitter: GHCIDebugEmitter = new emissary.Emitter();

        constructor(){
            atom = atom || {devMode: true};

            this.ghci_cmd = cp.spawn("ghci");

            this.stdout = this.ghci_cmd.stdout;
            this.stdin = this.ghci_cmd.stdin;
            this.stderr = this.ghci_cmd.stderr;
            this.stdout.on("readable", () => this.onStdoutReadable());
            this.stderr.on("readable", () => this.onStderrReadable())

            this.addReadyEvent();

            this.run(`:set prompt "%s> ${this.commandFinishedString}"`);
        }

        private addReadyEvent(){
            const eventSubs = [
                "paused-on-exception",
                "line-changed",
                "debug-finished",
            ]

            for(var eventName of eventSubs){
                (<any>this.emitter.on)(eventName, () => this.emitter.emit("ready", null));
            }
        }

        public destroy(){
            this.stop();
        }

        public loadModule(name: string){
            var cwd = path.dirname(name);

            this.run(`:cd ${cwd}`);
            this.run(`:load ${name}`);
        }

        public setExceptionBreakLevel(level: ExceptionBreakLevels){
            this.run(":unset -fbreak-on-exception");
            this.run(":unset -fbreak-on-error");

            if(level == "exceptions"){
                this.run(":set -fbreak-on-exception");
            }
            else if(level == "errors"){
                this.run(":set -fbreak-on-error");
            }
        }

        public addBreakpoint(breakpoint: Breakpoint | string){
            if(typeof breakpoint == "string")
                this.run(`:break ${breakpoint}`);
            else
                this.run(`:break ${breakpoint.file} ${breakpoint.line}`);
        }

        /** resolved the given expression using :print, returns null if it is invalid
        */
        public async resolveExpression(expression: string){
            // expressions can't have new lines
            if(expression.indexOf("\n") != -1){
                return null;
            }

            var getExpression = (ghciOutput: string, variable: string): string => {
                var matchResult = ghciOutput.match(/[^ ]* = (.*)/);
                if(matchResult === null) return null;
                return matchResult[1];
            }

            // for the code below, ignore errors
            this.ignoreErrors = true;

            try{
                // try printing expression
                var printingResult = getExpression(await this.run(`:print ${expression}`), expression);
                if(printingResult !== null){
                    return printingResult;
                }

                // if that fails assign it to a temporary variable and evaluate that
                var tempVarNum = 0;
                var potentialTempVar: string | boolean;
                do{
                    potentialTempVar = getExpression(await this.run(`:print temp${tempVarNum}`), `temp${tempVarNum}`)
                } while(potentialTempVar !== null);

                await this.run(`let temp${tempVarNum} = ${expression}`);
                return getExpression(await this.run(`:print temp${tempVarNum}`), `temp${tempVarNum}`);
            }
            finally{
                this.ignoreErrors = false;
            }
        }

        public forward(){
            this.run(":forward", true);
        }

        public back(){
            this.run(":back", true);
        }

        public step(){
            this.run(":step", true, true);
        }

        public stop() {
            this.run(":quit");
            this.emitter.emit("debug-finished", null);
        }

        public continue() {
            this.run(":continue", true);
        }

        async startDebug(moduleName?: string){
            moduleName = moduleName || "main";
            await this.run(":trace " + moduleName, true, true);
        }

        async getBindings(){
            var outputStr = await this.run(":show bindings");
            var lines = outputStr.split(os.EOL)
            return lines.slice(0, lines.length - 2);
        }

        private async getHistoryLength(){
            var historyQuery = await this.run(":history 100");
            const regex = /-(\d*).*(?:\n|\r|\r\n)<end of history>$/;

            var matchResult = historyQuery.match(regex);
            if(matchResult === null){
                return 0;
            }
            else if(historyQuery.slice(-3) == "..."){
                return Infinity;// history is very long
            }
            else{
                return parseInt(matchResult[1]);
            }
        }

        static pausedOnError = Symbol("Paused on Error");
        static finishedDebugging = Symbol("Finished debugging");

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
                            [parseInt(match[2]) - 1, parseInt(match[4])]]
                })
            },{
                pattern: /\[<exception thrown>\].*> $/,
                func: () => GHCIDebug.pausedOnError
            },{
                pattern: /.*> $/,
                func: () => GHCIDebug.finishedDebugging
            }]
            for (var pattern of patterns){
                var matchResult = stdOutput.match(pattern.pattern);
                if(matchResult != null){
                    return pattern.func(matchResult);
                }
            }
            throw new Error("Cannot read prompt: \n" + stdOutput);
        }

        private async emitStatusChanges(prompt: string, mainBody: string, emitHistoryLength: boolean){
            var result = this.parsePrompt(prompt);

            if(result == GHCIDebug.pausedOnError) {
                var historyLength = await this.getHistoryLength();

                this.emitter.emit("paused-on-exception", {
                    historyLength: historyLength,
                    localBindings: mainBody.split("\n").slice(1)
                });
            }
            else if(result == GHCIDebug.finishedDebugging){
                this.emitter.emit("debug-finished", undefined);
            }
            else{
                var breakInfo = <BreakInfo>result;

                breakInfo.localBindings = mainBody.split("\n").slice(1);

                if(emitHistoryLength)
                    breakInfo.historyLength = await this.getHistoryLength();

                this.emitter.emit("line-changed", breakInfo);
            }
        }

        private ignoreErrors = false;
        private currentStderrOutput = "";
        private onStderrReadable(){
            var stderrOutput = this.stderr.read();
            if(stderrOutput === null || this.ignoreErrors)
                return; // this is the end of the input stream

            if(this.currentStderrOutput == ""){
                var readyPromise = new Promise(resolve => this.emitter.once("ready", () => resolve()));
                var timeoutPromise = new Promise(resolve => setTimeout(() => resolve(), 2000));// emit after 2 seconds anyway

                Promise.race([readyPromise, timeoutPromise]).then(() => {
                    this.emitter.emit("error", this.currentStderrOutput);
                    this.currentStderrOutput = "";
                })
            }

            this.currentStderrOutput += stderrOutput;
        }

        private currentCommandBuffer = "";
        private commands = <Command[]>[];
        private currentCommandCallback: (output: string) => any = null;
        private commandFinishedString = "command_finish_o4uB1whagteqE8xBq9oq";

        private onStdoutReadable(){
            var currentString = (this.stdout.read() || "").toString();

            this.currentCommandBuffer += currentString;

            var finishStringPosition = this.currentCommandBuffer.search(this.commandFinishedString);
            if(finishStringPosition !== -1){
                let outputString = this.currentCommandBuffer.slice(0, finishStringPosition);

                this.emitter.emit("console-output", outputString);
                this.currentCommandCallback(outputString);

                // Take the finished string off the buffer and process the next ouput
                this.currentCommandBuffer = this.currentCommandBuffer.slice(
                    finishStringPosition + this.commandFinishedString.length);
                this.onStdoutReadable();
            }
        }

        public run(commandText: string,
                emitStatusChanges?: boolean, // emits on command issued and finished with line position
                emitHistoryLength?: boolean): Promise<string>{
            var shiftAndRunCommand = () => {
                var command = this.commands.shift();

                this.currentCommandCallback = command.onFinish;

                console.log(command.text)

                if(command.shouldEmit)
                    this.emitter.emit("command-issued", command.text);

                this.stdin.write(command.text + os.EOL);
            }

            emitStatusChanges = emitStatusChanges || false;
            emitHistoryLength = emitHistoryLength || false;
            return new Promise(fulfil => {
                var command: Command = {
                    text: commandText,
                    shouldEmit: emitStatusChanges,
                    onFinish: (output) => {
                        this.currentCommandCallback = null;

                        var lastEndOfLinePos = output.lastIndexOf(os.EOL);

                        if(lastEndOfLinePos == -1){
                            /*i.e. no output has been produced*/
                            if(emitStatusChanges){
                                this.emitStatusChanges(output, "", emitHistoryLength).then(() => {
                                    fulfil("");
                                })
                            }
                            fulfil("");
                        }
                        else{
                            var promptBeginPosition = lastEndOfLinePos + os.EOL.length;

                            if(emitStatusChanges){
                                this.emitStatusChanges(output.slice(promptBeginPosition, output.length),
                                    output.slice(0, lastEndOfLinePos),
                                    emitHistoryLength).then(() => {
                                    fulfil(output.slice(0, lastEndOfLinePos));
                                })
                            }
                            else{
                                fulfil(output.slice(0, lastEndOfLinePos));
                            }
                        }
                        if(this.commands.length !== 0 && this.currentCommandCallback === null)
                            shiftAndRunCommand();
                    }
                }

                this.commands.push(command);

                if(this.currentCommandCallback === null){
                    shiftAndRunCommand();
                }
            })
        }
    }
}

export = GHCIDebug
