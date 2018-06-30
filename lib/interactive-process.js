"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const CP = require("child_process");
const Queue = require("promise-queue");
const tkill = require("tree-kill");
const os_1 = require("os");
if (!Symbol.asyncIterator) {
    Object.defineProperty(Symbol, 'asyncIterator', {
        value: Symbol.for('Symbol.asyncIterator'),
    });
}
class InteractiveProcess {
    constructor(cmd, args, onDidExit, opts, endPattern) {
        this.endPattern = endPattern;
        this.requestQueue = new Queue(1, 100);
        opts.stdio = ['pipe', 'pipe', 'pipe'];
        try {
            this.process = CP.spawn(cmd, args, opts);
            this.process.stdout.setMaxListeners(100);
            this.process.stderr.setMaxListeners(100);
            this.process.stdout.setEncoding('utf-8');
            this.process.stderr.setEncoding('utf-8');
            this.process.on('exit', (code) => {
                onDidExit(code);
                this.process = undefined;
                this.destroy();
            });
        }
        catch (error) {
            atom.notifications.addFatalError('Error spawning REPL', {
                dismissable: true,
                stack: error.stack,
                detail: `Tried to run "${cmd}" with arguments: ${args}`,
            });
            this.destroy();
        }
    }
    async request(command, lineCallback, endPattern = this.endPattern) {
        return this.requestQueue.add(async () => {
            if (!this.process) {
                throw new Error('Interactive process is not running');
            }
            this.process.stdout.pause();
            this.process.stderr.pause();
            this.writeStdin(command);
            if (lineCallback) {
                lineCallback({ type: 'stdin', line: command });
            }
            const res = {
                stdout: [],
                stderr: [],
                prompt: [],
            };
            const isEnded = () => res.prompt.length > 0;
            const stdErrLine = (line) => {
                if (lineCallback) {
                    lineCallback({ type: 'stderr', line });
                }
                res.stderr.push(line);
            };
            const stderr = this.process.stderr;
            setImmediate(async () => {
                try {
                    for (var _a = tslib_1.__asyncValues(this.readgen(stderr, isEnded)), _b; _b = await _a.next(), !_b.done;) {
                        const line = await _b.value;
                        stdErrLine(line);
                    }
                }
                catch (e_1_1) { e_1 = { error: e_1_1 }; }
                finally {
                    try {
                        if (_b && !_b.done && (_c = _a.return)) await _c.call(_a);
                    }
                    finally { if (e_1) throw e_1.error; }
                }
                var e_1, _c;
            });
            try {
                for (var _a = tslib_1.__asyncValues(this.readgen(this.process.stdout, isEnded)), _b; _b = await _a.next(), !_b.done;) {
                    const line = await _b.value;
                    const pattern = line.match(endPattern);
                    if (pattern) {
                        if (lineCallback) {
                            lineCallback({ type: 'prompt', prompt: pattern });
                        }
                        res.prompt = pattern;
                    }
                    else {
                        if (lineCallback) {
                            lineCallback({ type: 'stdout', line });
                        }
                        res.stdout.push(line);
                    }
                }
            }
            catch (e_2_1) { e_2 = { error: e_2_1 }; }
            finally {
                try {
                    if (_b && !_b.done && (_c = _a.return)) await _c.call(_a);
                }
                finally { if (e_2) throw e_2.error; }
            }
            const restErr = this.process.stderr.read();
            if (restErr) {
                restErr.split('\n').forEach(stdErrLine);
            }
            this.process.stdout.resume();
            this.process.stderr.resume();
            return res;
            var e_2, _c;
        });
    }
    destroy() {
        if (this.process) {
            tkill(this.process.pid, 'SIGTERM');
        }
    }
    interrupt() {
        if (this.process) {
            tkill(this.process.pid, 'SIGINT');
        }
    }
    isBusy() {
        return this.requestQueue.getPendingLength() > 0;
    }
    writeStdin(str) {
        if (!this.process) {
            throw new Error('Interactive process is not running');
        }
        this.process.stdin.write(str);
    }
    async waitReadable(stream) {
        return new Promise((resolve) => stream.once('readable', () => {
            resolve();
        }));
    }
    readgen(out, isEnded) {
        return tslib_1.__asyncGenerator(this, arguments, function* readgen_1() {
            let buffer = '';
            while (!isEnded()) {
                const read = out.read();
                if (read != null) {
                    buffer += read;
                    if (buffer.match(os_1.EOL)) {
                        const arr = buffer.split(os_1.EOL);
                        buffer = arr.pop() || '';
                        yield tslib_1.__await(yield* tslib_1.__asyncDelegator(tslib_1.__asyncValues(arr)));
                    }
                }
                else {
                    yield tslib_1.__await(this.waitReadable(out));
                }
            }
            if (buffer) {
                out.unshift(buffer);
            }
        });
    }
}
exports.InteractiveProcess = InteractiveProcess;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW50ZXJhY3RpdmUtcHJvY2Vzcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL2xpYi1zcmMvaW50ZXJhY3RpdmUtcHJvY2Vzcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxvQ0FBbUM7QUFDbkMsdUNBQXVDO0FBQ3ZDLG1DQUFtQztBQUNuQywyQkFBd0I7QUFFeEIsRUFBRSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQztJQUMxQixNQUFNLENBQUMsY0FBYyxDQUFDLE1BQU0sRUFBRSxlQUFlLEVBQUU7UUFDN0MsS0FBSyxFQUFFLE1BQU0sQ0FBQyxHQUFHLENBQUMsc0JBQXNCLENBQUM7S0FDMUMsQ0FBQyxDQUFBO0FBQ0osQ0FBQztBQW1CRDtJQUlFLFlBQ0UsR0FBVyxFQUNYLElBQWMsRUFDZCxTQUF1QixFQUN2QixJQUFxQixFQUNyQixVQUFrQjtRQUVsQixJQUFJLENBQUMsVUFBVSxHQUFHLFVBQVUsQ0FBQTtRQUM1QixJQUFJLENBQUMsWUFBWSxHQUFHLElBQUksS0FBSyxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQTtRQUVyQyxJQUFJLENBQUMsS0FBSyxHQUFHLENBQUMsTUFBTSxFQUFFLE1BQU0sRUFBRSxNQUFNLENBQUMsQ0FBQTtRQUVyQyxJQUFJLENBQUM7WUFDSCxJQUFJLENBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQyxLQUFLLENBQUMsR0FBRyxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQTtZQUN4QyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxlQUFlLENBQUMsR0FBRyxDQUFDLENBQUE7WUFDeEMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsZUFBZSxDQUFDLEdBQUcsQ0FBQyxDQUFBO1lBQ3hDLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsQ0FBQTtZQUN4QyxJQUFJLENBQUMsT0FBTyxDQUFD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LEVBQUUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsUUFBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO3dCQUN0QixNQUFNLEdBQUcsR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDLFFBQUcsQ0FBQyxDQUFBO3dCQUM3QixNQUFNLEdBQUcsR0FBRyxDQUFDLEdBQUcsRUFBRSxJQUFJLEVBQUUsQ0FBQTt3QkFDeEIsc0JBQUEsS0FBSyxDQUFDLENBQUMseUJBQUEsc0JBQUEsR0FBRyxDQUFBLENBQUEsQ0FBQSxDQUFBO29CQUNaLENBQUM7Z0JBQ0gsQ0FBQztnQkFBQyxJQUFJLENBQUMsQ0FBQztvQkFDTixzQkFBTSxJQUFJLENBQUMsWUFBWSxDQUFDLEdBQUcsQ0FBQyxDQUFBLENBQUE7Z0JBQzlCLENBQUM7WUFDSCxDQUFDO1lBQ0QsRUFBRSxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztnQkFDWCxHQUFHLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFBO1lBQ3JCLENBQUM7UUFDSCxDQUFDO0tBQUE7Q0FDRjtBQTNKRCxnREEySkMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBDUCBmcm9tICdjaGlsZF9wcm9jZXNzJ1xuaW1wb3J0IFF1ZXVlID0gcmVxdWlyZSgncHJvbWlzZS1xdWV1ZScpXG5pbXBvcnQgdGtpbGwgPSByZXF1aXJlKCd0cmVlLWtpbGwnKVxuaW1wb3J0IHsgRU9MIH0gZnJvbSAnb3MnXG5cbmlmICghU3ltYm9sLmFzeW5jSXRlcmF0b3IpIHtcbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KFN5bWJvbCwgJ2FzeW5jSXRlcmF0b3InLCB7XG4gICAgdmFsdWU6IFN5bWJvbC5mb3IoJ1N5bWJvbC5hc3luY0l0ZXJhdG9yJyksXG4gIH0pXG59XG5cbnR5cGUgRXhpdENhbGxiYWNrID0gKGV4aXRDb2RlOiBudW1iZXIpID0+IHZvaWRcbmV4cG9ydCBpbnRlcmZhY2UgSVJlcXVlc3RSZXN1bHQge1xuICBzdGRvdXQ6IHN0cmluZ1tdXG4gIHN0ZGVycjogc3RyaW5nW11cbiAgcHJvbXB0OiBSZWdFeHBNYXRjaEFycmF5XG59XG5leHBvcnQgaW50ZXJmYWNlIElMaW5lSU8ge1xuICB0eXBlOiAnc3RkaW4nIHwgJ3N0ZG91dCcgfCAnc3RkZXJyJ1xuICBsaW5lOiBzdHJpbmdcbn1cbmV4cG9ydCBpbnRlcmZhY2UgSUxpbmVQcm9tcHQge1xuICB0eXBlOiAncHJvbXB0J1xuICBwcm9tcHQ6IFJlZ0V4cE1hdGNoQXJyYXlcbn1cbmV4cG9ydCB0eXBlIFRMaW5lVHlwZSA9IElMaW5lSU8gfCBJTGluZVByb21wdFxuZXhwb3J0IHR5cGUgVExpbmVDYWxsYmFjayA9IChsaW5lOiBUTGluZVR5cGUpID0+IHZvaWRcblxuZXhwb3J0IGNsYXNzIEludGVyYWN0aXZlUHJvY2VzcyB7XG4gIHByaXZhdGUgcHJvY2Vzcz86IENQLkNoaWxkUHJvY2Vzc1xuICBwcml2YXRlIHJlcXVlc3RRdWV1ZTogUXVldWVcbiAgcHJpdmF0ZSBlbmRQYXR0ZXJuOiBSZWdFeHBcbiAgY29uc3RydWN0b3IoXG4gICAgY21kOiBzdHJpbmcsXG4gICAgYXJnczogc3RyaW5nW10sXG4gICAgb25EaWRFeGl0OiBFeGl0Q2FsbGJhY2ssXG4gICAgb3B0czogQ1AuU3Bhd25PcHRpb25zLFxuICAgIGVuZFBhdHRlcm46IFJlZ0V4cCxcbiAgKSB7XG4gICAgdGhpcy5lbmRQYXR0ZXJuID0gZW5kUGF0dGVyblxuICAgIHRoaXMucmVxdWVzdFF1ZXVlID0gbmV3IFF1ZXVlKDEsIDEwMClcblxuICAgIG9wdHMuc3RkaW8gPSBbJ3BpcGUnLCAncGlwZScsICdwaXBlJ11cblxuICAgIHRyeSB7XG4gICAgICB0aGlzLnByb2Nlc3MgPSBDUC5zcGF3bihjbWQsIGFyZ3MsIG9wdHMpXG4gICAgICB0aGlzLnByb2Nlc3Muc3Rkb3V0LnNldE1heExpc3RlbmVycygxMDApXG4gICAgICB0aGlzLnByb2Nlc3Muc3RkZXJyLnNldE1heExpc3RlbmVycygxMDApXG4gICAgICB0aGlzLnByb2Nlc3Muc3Rkb3V0LnNldEVuY29kaW5nKCd1dGYtOCcpXG4gICAgICB0aGlzLnByb2Nlc3Muc3RkZXJyLnNldEVuY29kaW5nKCd1dGYtOCcpXG5cbiAgICAgIHRoaXMucHJvY2Vzcy5vbignZXhpdCcsIChjb2RlKSA9PiB7XG4gICAgICAgIG9uRGlkRXhpdChjb2RlKVxuICAgICAgICB0aGlzLnByb2Nlc3MgPSB1bmRlZmluZWRcbiAgICAgICAgdGhpcy5kZXN0cm95KClcbiAgICAgIH0pXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRGYXRhbEVycm9yKCdFcnJvciBzcGF3bmluZyBSRVBMJywge1xuICAgICAgICBkaXNtaXNzYWJsZTogdHJ1ZSxcbiAgICAgICAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOm5vLXVuc2FmZS1hbnlcbiAgICAgICAgc3RhY2s6IGVycm9yLnN0YWNrLFxuICAgICAgICBkZXRhaWw6IGBUcmllZCB0byBydW4gXCIke2NtZH1cIiB3aXRoIGFyZ3VtZW50czogJHthcmdzfWAsXG4gICAgICB9KVxuICAgICAgdGhpcy5kZXN0cm95KClcbiAgICB9XG4gIH1cblxuICBwdWJsaWMgYXN5bmMgcmVxdWVzdChcbiAgICBjb21tYW5kOiBzdHJpbmcsXG4gICAgbGluZUNhbGxiYWNrPzogVExpbmVDYWxsYmFjayxcbiAgICBlbmRQYXR0ZXJuOiBSZWdFeHAgPSB0aGlzLmVuZFBhdHRlcm4sXG4gICk6IFByb21pc2U8SVJlcXVlc3RSZXN1bHQ+IHtcbiAgICByZXR1cm4gdGhpcy5yZXF1ZXN0UXVldWUuYWRkKGFzeW5jICgpID0+IHtcbiAgICAgIGlmICghdGhpcy5wcm9jZXNzKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignSW50ZXJhY3RpdmUgcHJvY2VzcyBpcyBub3QgcnVubmluZycpXG4gICAgICB9XG5cbiAgICAgIHRoaXMucHJvY2Vzcy5zdGRvdXQucGF1c2UoKVxuICAgICAgdGhpcy5wcm9jZXNzLnN0ZGVyci5wYXVzZSgpXG5cbiAgICAgIHRoaXMud3JpdGVTdGRpbihjb21tYW5kKVxuICAgICAgaWYgKGxpbmVDYWxsYmFjaykge1xuICAgICAgICBsaW5lQ2FsbGJhY2soeyB0eXBlOiAnc3RkaW4nLCBsaW5lOiBjb21tYW5kIH0pXG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHJlczogSVJlcXVlc3RSZXN1bHQgPSB7XG4gICAgICAgIHN0ZG91dDogW10sXG4gICAgICAgIHN0ZGVycjogW10sXG4gICAgICAgIHByb21wdDogW10sXG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGlzRW5kZWQgPSAoKSA9PiByZXMucHJvbXB0Lmxlbmd0aCA+IDBcblxuICAgICAgY29uc3Qgc3RkRXJyTGluZSA9IChsaW5lOiBzdHJpbmcpID0+IHtcbiAgICAgICAgaWYgKGxpbmVDYWxsYmFjaykge1xuICAgICAgICAgIGxpbmVDYWxsYmFjayh7IHR5cGU6ICdzdGRlcnInLCBsaW5lIH0pXG4gICAgICAgIH1cbiAgICAgICAgcmVzLnN0ZGVyci5wdXNoKGxpbmUpXG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHN0ZGVyciA9IHRoaXMucHJvY2Vzcy5zdGRlcnJcbiAgICAgIHNldEltbWVkaWF0ZShhc3luYyAoKSA9PiB7XG4gICAgICAgIGZvciBhd2FpdCAoY29uc3QgbGluZSBvZiB0aGlzLnJlYWRnZW4oc3RkZXJyLCBpc0VuZGVkKSkge1xuICAgICAgICAgIHN0ZEVyckxpbmUobGluZSlcbiAgICAgICAgfVxuICAgICAgfSlcblxuICAgICAgZm9yIGF3YWl0IChjb25zdCBsaW5lIG9mIHRoaXMucmVhZGdlbih0aGlzLnByb2Nlc3Muc3Rkb3V0LCBpc0VuZGVkKSkge1xuICAgICAgICBjb25zdCBwYXR0ZXJuID0gbGluZS5tYXRjaChlbmRQYXR0ZXJuKVxuICAgICAgICBpZiAocGF0dGVybikge1xuICAgICAgICAgIGlmIChsaW5lQ2FsbGJhY2spIHtcbiAgICAgICAgICAgIGxpbmVDYWxsYmFjayh7IHR5cGU6ICdwcm9tcHQnLCBwcm9tcHQ6IHBhdHRlcm4gfSlcbiAgICAgICAgICB9XG4gICAgICAgICAgcmVzLnByb21wdCA9IHBhdHRlcm5cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpZiAobGluZUNhbGxiYWNrKSB7XG4gICAgICAgICAgICBsaW5lQ2FsbGJhY2soeyB0eXBlOiAnc3Rkb3V0JywgbGluZSB9KVxuICAgICAgICAgIH1cbiAgICAgICAgICByZXMuc3Rkb3V0LnB1c2gobGluZSlcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOm5vLXVuc2FmZS1hbnlcbiAgICAgIGNvbnN0IHJlc3RFcnI6IHN0cmluZyA9IHRoaXMucHJvY2Vzcy5zdGRlcnIucmVhZCgpXG4gICAgICBpZiAocmVzdEVycikge1xuICAgICAgICByZXN0RXJyLnNwbGl0KCdcXG4nKS5mb3JFYWNoKHN0ZEVyckxpbmUpXG4gICAgICB9XG4gICAgICB0aGlzLnByb2Nlc3Muc3Rkb3V0LnJlc3VtZSgpXG4gICAgICB0aGlzLnByb2Nlc3Muc3RkZXJyLnJlc3VtZSgpXG4gICAgICByZXR1cm4gcmVzXG4gICAgfSlcbiAgfVxuXG4gIHB1YmxpYyBkZXN0cm95KCkge1xuICAgIGlmICh0aGlzLnByb2Nlc3MpIHtcbiAgICAgIHRraWxsKHRoaXMucHJvY2Vzcy5waWQsICdTSUdURVJNJylcbiAgICB9XG4gIH1cblxuICBwdWJsaWMgaW50ZXJydXB0KCkge1xuICAgIGlmICh0aGlzLnByb2Nlc3MpIHtcbiAgICAgIHRraWxsKHRoaXMucHJvY2Vzcy5waWQsICdTSUdJTlQnKVxuICAgIH1cbiAgfVxuXG4gIHB1YmxpYyBpc0J1c3koKSB7XG4gICAgcmV0dXJuIHRoaXMucmVxdWVzdFF1ZXVlLmdldFBlbmRpbmdMZW5ndGgoKSA+IDBcbiAgfVxuXG4gIHB1YmxpYyB3cml0ZVN0ZGluKHN0cjogc3RyaW5nKSB7XG4gICAgaWYgKCF0aGlzLnByb2Nlc3MpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignSW50ZXJhY3RpdmUgcHJvY2VzcyBpcyBub3QgcnVubmluZycpXG4gICAgfVxuICAgIHRoaXMucHJvY2Vzcy5zdGRpbi53cml0ZShzdHIpXG4gIH1cblxuICBwcml2YXRlIGFzeW5jIHdhaXRSZWFkYWJsZShzdHJlYW06IE5vZGVKUy5SZWFkYWJsZVN0cmVhbSkge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT5cbiAgICAgIHN0cmVhbS5vbmNlKCdyZWFkYWJsZScsICgpID0+IHtcbiAgICAgICAgcmVzb2x2ZSgpXG4gICAgICB9KSxcbiAgICApXG4gIH1cblxuICBwcml2YXRlIGFzeW5jICpyZWFkZ2VuKG91dDogTm9kZUpTLlJlYWRhYmxlU3RyZWFtLCBpc0VuZGVkOiAoKSA9PiBib29sZWFuKSB7XG4gICAgbGV0IGJ1ZmZlciA9ICcnXG4gICAgd2hpbGUgKCFpc0VuZGVkKCkpIHtcbiAgICAgIGNvbnN0IHJlYWQgPSBvdXQucmVhZCgpXG4gICAgICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6IG5vLW51bGwta2V5d29yZCBzdHJpY3QtdHlwZS1wcmVkaWNhdGVzXG4gICAgICBpZiAocmVhZCAhPSBudWxsKSB7XG4gICAgICAgIGJ1ZmZlciArPSByZWFkXG4gICAgICAgIGlmIChidWZmZXIubWF0Y2goRU9MKSkge1xuICAgICAgICAgIGNvbnN0IGFyciA9IGJ1ZmZlci5zcGxpdChFT0wpXG4gICAgICAgICAgYnVmZmVyID0gYXJyLnBvcCgpIHx8ICcnXG4gICAgICAgICAgeWllbGQqIGFyclxuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBhd2FpdCB0aGlzLndhaXRSZWFkYWJsZShvdXQpXG4gICAgICB9XG4gICAgfVxuICAgIGlmIChidWZmZXIpIHtcbiAgICAgIG91dC51bnNoaWZ0KGJ1ZmZlcilcbiAgICB9XG4gIH1cbn1cbiJdfQ==