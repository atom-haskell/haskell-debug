"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const BreakpointUI = require("./BreakpointUI");
const TooltipOverride = require("./TooltipOverride");
const atomAPI = require("atom");
const os = require("os");
const path = require("path");
const cp = require("child_process");
exports.breakpointUI = new BreakpointUI();
exports.tooltipOverride = new TooltipOverride((expression) => __awaiter(this, void 0, void 0, function* () {
    if (exports.debuggerInst === undefined) {
        return exports.debuggerInst;
    }
    return exports.debuggerInst.resolveExpression(expression);
}));
exports.settings = {
    breakOnError: true
};
exports.commands = {
    'debug': () => {
        const Debugger = require('./Debugger');
        upi.getConfigParam('ide-haskell-cabal', 'builder').then((ob) => {
            exports.debuggerInst = new Debugger(exports.breakpointUI.breakpoints, ob.name);
        }).catch(() => {
            exports.debuggerInst = new Debugger(exports.breakpointUI.breakpoints);
        });
    },
    'debug-back': () => {
        if (exports.debuggerInst) {
            exports.debuggerInst.back();
        }
    },
    'debug-forward': () => {
        if (exports.debuggerInst) {
            exports.debuggerInst.forward();
        }
    },
    'debug-step': () => {
        if (exports.debuggerInst) {
            exports.debuggerInst.step();
        }
    },
    'debug-stop': () => {
        if (exports.debuggerInst) {
            exports.debuggerInst.stop();
        }
    },
    'debug-continue': () => {
        if (exports.debuggerInst) {
            exports.debuggerInst.continue();
        }
    },
    'toggle-breakpoint': () => {
        const te = atom.workspace.getActiveTextEditor();
        exports.breakpointUI.toggleBreakpoint(te.getCursorBufferPosition().row, te);
    },
    'set-break-on-exception': () => {
        const SelectDebugModeView = require('./views/SelectDebugModeView');
        const view = new SelectDebugModeView(exports.debugModes, atom.config.get('haskell-debug.breakOnException'));
        const panel = atom.workspace.addModalPanel({
            item: view
        });
        view.focusFilterEditor();
        view.emitter.on('selected', (item) => {
            atom.config.set('haskell-debug.breakOnException', item);
        });
        view.emitter.on('canceled', () => {
            panel.destroy();
        });
    }
};
function onFirstRun() {
    exports.state = {
        properlyActivated: false
    };
    const isWin = os.platform().indexOf('win') > -1;
    const where = isWin ? 'where' : 'whereis';
    const out = cp.exec(where + ' node');
    out.on('close', (code) => {
        if (code === 1) {
            atom.config.set('haskell-debug.nodeCommand', path.resolve(atom.packages.getApmPath(), '../../bin/atom'));
            if (exports.state) {
                exports.state.properlyActivated = true;
            }
        }
    });
}
exports.onFirstRun = onFirstRun;
function activate(_state) {
    exports.state = _state;
    if (exports.state === undefined || exports.state.properlyActivated !== true) {
        onFirstRun();
    }
    atom.workspace.observeActivePaneItem((pane) => {
        if (atom.workspace.isTextEditor(pane)) {
            const te = pane;
            const scopes = te.getRootScopeDescriptor().scopes;
            if (scopes.length === 1 && scopes[0] === 'source.haskell') {
                if (!te.hasHaskellBreakpoints) {
                    exports.breakpointUI.attachToNewTextEditor(te);
                    te.hasHaskellBreakpoints = true;
                }
                if (exports.debuggerInst) {
                    exports.debuggerInst.showPanels();
                }
                return;
            }
        }
        if (exports.debuggerInst) {
            exports.debuggerInst.hidePanels();
        }
    });
    for (const command of Object.keys(exports.commands)) {
        atom.commands.add("atom-text-editor[data-grammar='source haskell']", 'haskell:' + command, exports.commands[command]);
    }
}
exports.activate = activate;
function serialize() {
    return exports.state;
}
exports.serialize = serialize;
exports.debugModes = [
    { value: 'none', description: 'Don\'t pause on any exceptions' },
    { value: 'errors', description: 'Pause on errors (uncaught exceptions)' },
    { value: 'exceptions', description: 'Pause on exceptions' },
];
function getTerminalCommand() {
    if (os.type() === 'Windows_NT') {
        return 'start %s';
    }
    else if (os.type() === 'Linux') {
        return `x-terminal-emulator -e "bash -c \\"%s\\""`;
    }
    else if (os.type() === 'Darwin') {
        return `osascript -e 'tell app "Terminal" to do script "%s"'`;
    }
    else {
        return `xterm -e "bash -c \\"%s\\""`;
    }
}
exports.getTerminalCommand = getTerminalCommand;
exports.config = {
    useIdeHaskellCabalBuilder: {
        title: 'Use ide-haskell-cabal builder',
        description: "Use the ide-haskell-cabal builder's command when running ghci - " +
            'will run `stack ghci` when stack is the builder, `cabal repl` for cabal and ' +
            '`ghci` for none',
        default: true,
        type: 'boolean',
        order: 0
    },
    GHCICommand: {
        title: 'GHCI Command',
        description: 'The command to run to execute `ghci`, this will get ignore if the' +
            ' previous setting is set to true',
        type: 'string',
        default: 'ghci',
        order: 1
    },
    GHCIArguments: {
        title: 'GHCI Arguments',
        description: 'Arguments to give to `ghci`, separated by a space',
        type: 'string',
        default: '',
        order: 2
    },
    nodeCommand: {
        description: 'The command to run to execute node.js',
        type: 'string',
        default: 'node',
        order: 3
    },
    terminalCommand: {
        description: 'The command to run to launch a terminal, where the command launched in the terminal is `%s`.',
        type: 'string',
        default: getTerminalCommand(),
        order: 4
    },
    clickGutterToToggleBreakpoint: {
        type: 'boolean',
        description: 'Insert a breakpoint when the gutter is clicked in a haskell source file',
        default: true,
        order: 5
    },
    showTerminal: {
        type: 'boolean',
        description: 'Show a terminal with `ghci` running when debugging',
        default: true,
        order: 6
    },
    functionToDebug: {
        type: 'string',
        description: 'The function to run when debugging',
        default: 'main',
        order: 7
    },
    breakOnException: {
        description: `Whether to break on exceptions, errors or neither.
            Note: breaking on exception may cause the debugger to freeze in some instances.
            See [#3](https://github.com/ThomasHickman/haskell-debug/issues/3)`,
        type: 'string',
        default: 'none',
        enum: exports.debugModes,
        order: 8
    }
};
let upi;
function consumeHaskellUpi(upiContainer) {
    const pluginDisposable = new atomAPI.CompositeDisposable();
    const _upi = upiContainer.registerPlugin(pluginDisposable, 'haskell-debug');
    exports.tooltipOverride.consumeHaskellUpi(_upi);
    upi = _upi;
}
exports.consumeHaskellUpi = consumeHaskellUpi;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9saWIvbWFpbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O0FBQ0EsK0NBQStDO0FBQy9DLHFEQUFxRDtBQUNyRCxnQ0FBZ0M7QUFDaEMseUJBQXlCO0FBQ3pCLDZCQUE2QjtBQUM3QixvQ0FBb0M7QUFHekIsUUFBQSxZQUFZLEdBQUcsSUFBSSxZQUFZLEVBQUUsQ0FBQTtBQUVqQyxRQUFBLGVBQWUsR0FBRyxJQUFJLGVBQWUsQ0FBQyxDQUFPLFVBQVU7SUFDOUQsRUFBRSxDQUFDLENBQUMsb0JBQVksS0FBSyxTQUFTLENBQUMsQ0FBQyxDQUFDO1FBQUMsTUFBTSxDQUFDLG9CQUFZLENBQUE7SUFBQyxDQUFDO0lBQ3ZELE1BQU0sQ0FBQyxvQkFBWSxDQUFDLGlCQUFpQixDQUFDLFVBQVUsQ0FBQyxDQUFBO0FBQ3JELENBQUMsQ0FBQSxDQUFDLENBQUE7QUFFUyxRQUFBLFFBQVEsR0FBRztJQUNsQixZQUFZLEVBQUUsSUFBSTtDQUNyQixDQUFBO0FBRVUsUUFBQSxRQUFRLEdBQUc7SUFDbEIsT0FBTyxFQUFFO1FBRUwsTUFBTSxRQUFRLEdBQUcsT0FBTyxDQUFDLFlBQVksQ0FBQyxDQUFBO1FBRXRDLEdBQUcsQ0FBQyxjQUFjLENBQUMsbUJBQW1CLEVBQUUsU0FBUyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRTtZQUN2RCxvQkFBWSxHQUFHLElBQUksUUFBUSxDQUFDLG9CQUFZLENBQUMsV0FBVyxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQTtRQUNsRSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUM7WUFDTCxvQkFBWSxHQUFHLElBQUksUUFBUSxDQUFDLG9CQUFZLENBQUMsV0FBVyxDQUFDLENBQUE7UUFDekQsQ0FBQyxDQUFDLENBQUE7SUFDTixDQUFDO0lBQ0QsWUFBWSxFQUFFO1FBQ1YsRUFBRSxDQUFDLENBQUMsb0JBQVksQ0FBQyxDQUFDLENB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O0tBQ1g7SUFDRCxnQkFBZ0IsRUFBRTtRQUNkLFdBQVcsRUFBRTs7OEVBRXlEO1FBQ3RFLElBQUksRUFBRSxRQUFRO1FBQ2QsT0FBTyxFQUFFLE1BQU07UUFDZixJQUFJLEVBQUUsa0JBQVU7UUFDaEIsS0FBSyxFQUFFLENBQUM7S0FDWDtDQUNKLENBQUE7QUFFRCxJQUFJLEdBQTBCLENBQUE7QUFFOUIsMkJBQW1DLFlBQTRDO0lBQzNFLE1BQU0sZ0JBQWdCLEdBQUcsSUFBSSxPQUFPLENBQUMsbUJBQW1CLEVBQUUsQ0FBQTtJQUMxRCxNQUFNLElBQUksR0FBRyxZQUFZLENBQUMsY0FBYyxDQUFDLGdCQUFnQixFQUFFLGVBQWUsQ0FBQyxDQUFBO0lBQzNFLHVCQUFlLENBQUMsaUJBQWlCLENBQUMsSUFBSSxDQUFDLENBQUE7SUFDdkMsR0FBRyxHQUFHLElBQUksQ0FBQTtBQUNkLENBQUM7QUFMRCw4Q0FLQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBEZWJ1Z2dlciA9IHJlcXVpcmUoJy4vRGVidWdnZXInKVxuaW1wb3J0IEJyZWFrcG9pbnRVSSA9IHJlcXVpcmUoJy4vQnJlYWtwb2ludFVJJylcbmltcG9ydCBUb29sdGlwT3ZlcnJpZGUgPSByZXF1aXJlKCcuL1Rvb2x0aXBPdmVycmlkZScpXG5pbXBvcnQgYXRvbUFQSSA9IHJlcXVpcmUoJ2F0b20nKVxuaW1wb3J0IG9zID0gcmVxdWlyZSgnb3MnKVxuaW1wb3J0IHBhdGggPSByZXF1aXJlKCdwYXRoJylcbmltcG9ydCBjcCA9IHJlcXVpcmUoJ2NoaWxkX3Byb2Nlc3MnKVxuaW1wb3J0ICogYXMgaGFza2VsbElkZSBmcm9tICcuL2lkZS1oYXNrZWxsJ1xuXG5leHBvcnQgbGV0IGJyZWFrcG9pbnRVSSA9IG5ldyBCcmVha3BvaW50VUkoKVxuZXhwb3J0IGxldCBkZWJ1Z2dlckluc3Q6IERlYnVnZ2VyIHwgdW5kZWZpbmVkXG5leHBvcnQgbGV0IHRvb2x0aXBPdmVycmlkZSA9IG5ldyBUb29sdGlwT3ZlcnJpZGUoYXN5bmMgKGV4cHJlc3Npb24pID0+IHtcbiAgICBpZiAoZGVidWdnZXJJbnN0ID09PSB1bmRlZmluZWQpIHsgcmV0dXJuIGRlYnVnZ2VySW5zdCB9XG4gICAgcmV0dXJuIGRlYnVnZ2VySW5zdC5yZXNvbHZlRXhwcmVzc2lvbihleHByZXNzaW9uKVxufSlcblxuZXhwb3J0IGxldCBzZXR0aW5ncyA9IHtcbiAgICBicmVha09uRXJyb3I6IHRydWVcbn1cblxuZXhwb3J0IGxldCBjb21tYW5kcyA9IHtcbiAgICAnZGVidWcnOiAoKSA9PiB7XG4gICAgICAgIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTogdmFyaWFibGUtbmFtZVxuICAgICAgICBjb25zdCBEZWJ1Z2dlciA9IHJlcXVpcmUoJy4vRGVidWdnZXInKVxuXG4gICAgICAgIHVwaS5nZXRDb25maWdQYXJhbSgnaWRlLWhhc2tlbGwtY2FiYWwnLCAnYnVpbGRlcicpLnRoZW4oKG9iKSA9PiB7XG4gICAgICAgICAgICBkZWJ1Z2dlckluc3QgPSBuZXcgRGVidWdnZXIoYnJlYWtwb2ludFVJLmJyZWFrcG9pbnRzLCBvYi5uYW1lKVxuICAgICAgICB9KS5jYXRjaCgoKSA9PiB7XG4gICAgICAgICAgICBkZWJ1Z2dlckluc3QgPSBuZXcgRGVidWdnZXIoYnJlYWtwb2ludFVJLmJyZWFrcG9pbnRzKVxuICAgICAgICB9KVxuICAgIH0sXG4gICAgJ2RlYnVnLWJhY2snOiAoKSA9PiB7XG4gICAgICAgIGlmIChkZWJ1Z2dlckluc3QpIHtcbiAgICAgICAgICAgIGRlYnVnZ2VySW5zdC5iYWNrKClcbiAgICAgICAgfVxuICAgIH0sXG4gICAgJ2RlYnVnLWZvcndhcmQnOiAoKSA9PiB7XG4gICAgICAgIGlmIChkZWJ1Z2dlckluc3QpIHtcbiAgICAgICAgICAgIGRlYnVnZ2VySW5zdC5mb3J3YXJkKClcbiAgICAgICAgfVxuICAgIH0sXG4gICAgJ2RlYnVnLXN0ZXAnOiAoKSA9PiB7XG4gICAgICAgIGlmIChkZWJ1Z2dlckluc3QpIHtcbiAgICAgICAgICAgIGRlYnVnZ2VySW5zdC5zdGVwKClcbiAgICAgICAgfVxuICAgIH0sXG4gICAgJ2RlYnVnLXN0b3AnOiAoKSA9PiB7XG4gICAgICAgIGlmIChkZWJ1Z2dlckluc3QpIHtcbiAgICAgICAgICAgIGRlYnVnZ2VySW5zdC5zdG9wKClcbiAgICAgICAgfVxuICAgIH0sXG4gICAgJ2RlYnVnLWNvbnRpbnVlJzogKCkgPT4ge1xuICAgICAgICBpZiAoZGVidWdnZXJJbnN0KSB7XG4gICAgICAgICAgICBkZWJ1Z2dlckluc3QuY29udGludWUoKVxuICAgICAgICB9XG4gICAgfSxcbiAgICAndG9nZ2xlLWJyZWFrcG9pbnQnOiAoKSA9PiB7XG4gICAgICAgIGNvbnN0IHRlID0gYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlVGV4dEVkaXRvcigpXG5cbiAgICAgICAgYnJlYWtwb2ludFVJLnRvZ2dsZUJyZWFrcG9pbnQoXG4gICAgICAgICAgICB0ZS5nZXRDdXJzb3JCdWZmZXJQb3NpdGlvbigpLnJvdyxcbiAgICAgICAgICAgIHRlXG4gICAgICAgIClcbiAgICB9LFxuICAgICdzZXQtYnJlYWstb24tZXhjZXB0aW9uJzogKCkgPT4ge1xuICAgICAgICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6IHZhcmlhYmxlLW5hbWVcbiAgICAgICAgY29uc3QgU2VsZWN0RGVidWdNb2RlVmlldyA9IHJlcXVpcmUoJy4vdmlld3MvU2VsZWN0RGVidWdNb2RlVmlldycpXG4gICAgICAgIGNvbnN0IHZpZXcgPSBuZXcgU2VsZWN0RGVidWdNb2RlVmlldyhkZWJ1Z01vZGVzLCBhdG9tLmNvbmZpZy5nZXQoJ2hhc2tlbGwtZGVidWcuYnJlYWtPbkV4Y2VwdGlvbicpKVxuXG4gICAgICAgIGNvbnN0IHBhbmVsID0gYXRvbS53b3Jrc3BhY2UuYWRkTW9kYWxQYW5lbCh7XG4gICAgICAgICAgICBpdGVtOiB2aWV3XG4gICAgICAgIH0pXG5cbiAgICAgICAgdmlldy5mb2N1c0ZpbHRlckVkaXRvcigpXG5cbiAgICAgICAgdmlldy5lbWl0dGVyLm9uKCdzZWxlY3RlZCcsIChpdGVtOiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgIGF0b20uY29uZmlnLnNldCgnaGFza2VsbC1kZWJ1Zy5icmVha09uRXhjZXB0aW9uJywgaXRlbSlcbiAgICAgICAgfSlcblxuICAgICAgICB2aWV3LmVtaXR0ZXIub24oJ2NhbmNlbGVkJywgKCkgPT4ge1xuICAgICAgICAgICAgcGFuZWwuZGVzdHJveSgpXG4gICAgICAgIH0pXG4gICAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gb25GaXJzdFJ1biAoKSB7XG4gICAgc3RhdGUgPSB7XG4gICAgICAgIHByb3Blcmx5QWN0aXZhdGVkOiBmYWxzZVxuICAgIH1cblxuICAgIC8vIGZyb20gaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8zNDk1MzE2OC9ub2RlLWNoZWNrLWV4aXN0ZW5jZS1vZi1jb21tYW5kLWluLXBhdGhcbiAgICBjb25zdCBpc1dpbiA9IG9zLnBsYXRmb3JtKCkuaW5kZXhPZignd2luJykgPiAtMVxuICAgIGNvbnN0IHdoZXJlID0gaXNXaW4gPyAnd2hlcmUnIDogJ3doZXJlaXMnXG5cbiAgICBjb25zdCBvdXQgPSBjcC5leGVjKHdoZXJlICsgJyBub2RlJylcblxuICAgIG91dC5vbignY2xvc2UnLCAoY29kZSkgPT4ge1xuICAgICAgICBpZiAoY29kZSA9PT0gMSkgey8vIG5vdCBmb3VuZFxuICAgICAgICAgICAgLy8gZmFsbGJhY2sgdG8gdGhlIG5vZGUgaW4gYXBtXG4gICAgICAgICAgICBhdG9tLmNvbmZpZy5zZXQoJ2hhc2tlbGwtZGVidWcubm9kZUNvbW1hbmQnLCBwYXRoLnJlc29sdmUoYXRvbS5wYWNrYWdlcy5nZXRBcG1QYXRoKCksICcuLi8uLi9iaW4vYXRvbScpKVxuICAgICAgICAgICAgaWYgKHN0YXRlKSB7IHN0YXRlLnByb3Blcmx5QWN0aXZhdGVkID0gdHJ1ZSB9XG4gICAgICAgIH1cbiAgICB9KVxufVxuXG5pbnRlcmZhY2UgSGFza2VsbERlYnVnU3RhdGUge1xuICAgIHByb3Blcmx5QWN0aXZhdGVkOiBib29sZWFuXG59XG5cbmV4cG9ydCBsZXQgc3RhdGU6IEhhc2tlbGxEZWJ1Z1N0YXRlIHwgdW5kZWZpbmVkXG5cbmV4cG9ydCBmdW5jdGlvbiBhY3RpdmF0ZSAoX3N0YXRlPzogSGFza2VsbERlYnVnU3RhdGUpIHtcbiAgICBzdGF0ZSA9IF9zdGF0ZVxuXG4gICAgaWYgKHN0YXRlID09PSB1bmRlZmluZWQgfHwgc3RhdGUucHJvcGVybHlBY3RpdmF0ZWQgIT09IHRydWUpIHtcbiAgICAgICAgb25GaXJzdFJ1bigpXG4gICAgfVxuICAgIGF0b20ud29ya3NwYWNlLm9ic2VydmVBY3RpdmVQYW5lSXRlbSgocGFuZSkgPT4ge1xuICAgICAgICBpZiAoYXRvbS53b3Jrc3BhY2UuaXNUZXh0RWRpdG9yKHBhbmUpKSB7XG4gICAgICAgICAgICBjb25zdCB0ZTogQXRvbUNvcmUuSUVkaXRvciAmIHsgaGFzSGFza2VsbEJyZWFrcG9pbnRzPzogYm9vbGVhbiB9ID0gcGFuZVxuICAgICAgICAgICAgY29uc3Qgc2NvcGVzID0gdGUuZ2V0Um9vdFNjb3BlRGVzY3JpcHRvcigpLnNjb3Blc1xuICAgICAgICAgICAgaWYgKHNjb3Blcy5sZW5ndGggPT09IDEgJiYgc2NvcGVzWzBdID09PSAnc291cmNlLmhhc2tlbGwnKSB7XG4gICAgICAgICAgICAgICAgaWYgKCF0ZS5oYXNIYXNrZWxsQnJlYWtwb2ludHMpIHtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWtwb2ludFVJLmF0dGFjaFRvTmV3VGV4dEVkaXRvcih0ZSlcbiAgICAgICAgICAgICAgICAgICAgdGUuaGFzSGFza2VsbEJyZWFrcG9pbnRzID0gdHJ1ZVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChkZWJ1Z2dlckluc3QpIHtcbiAgICAgICAgICAgICAgICAgICAgZGVidWdnZXJJbnN0LnNob3dQYW5lbHMoKVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJldHVybiAgLy8gZG9uJ3QgZG8gYmVsb3dcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGlmIGFueSBwYW5lIHRoYXQgaXNuJ3QgYSBoYXNrZWxsIHNvdXJjZSBmaWxlIGFuZCB3ZSdyZSBkZWJ1Z2dpbmdcbiAgICAgICAgaWYgKGRlYnVnZ2VySW5zdCkge1xuICAgICAgICAgICAgZGVidWdnZXJJbnN0LmhpZGVQYW5lbHMoKVxuICAgICAgICB9XG4gICAgfSlcblxuICAgIGZvciAoY29uc3QgY29tbWFuZCBvZiBPYmplY3Qua2V5cyhjb21tYW5kcykpe1xuICAgICAgICBhdG9tLmNvbW1hbmRzLmFkZChcImF0b20tdGV4dC1lZGl0b3JbZGF0YS1ncmFtbWFyPSdzb3VyY2UgaGFza2VsbCddXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICdoYXNrZWxsOicgKyBjb21tYW5kLFxuICAgICAgICAgICAgICAgICAgICAgICAgICBjb21tYW5kc1tjb21tYW5kXSlcbiAgICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXJpYWxpemUgKCkge1xuICAgIHJldHVybiBzdGF0ZVxufVxuXG5leHBvcnQgbGV0IGRlYnVnTW9kZXMgPSBbXG4gICAge3ZhbHVlOiAnbm9uZScsIGRlc2NyaXB0aW9uOiAnRG9uXFwndCBwYXVzZSBvbiBhbnkgZXhjZXB0aW9ucyd9LFxuICAgIHt2YWx1ZTogJ2Vycm9ycycsIGRlc2NyaXB0aW9uOiAnUGF1c2Ugb24gZXJyb3JzICh1bmNhdWdodCBleGNlcHRpb25zKSd9LFxuICAgIHt2YWx1ZTogJ2V4Y2VwdGlvbnMnLCBkZXNjcmlwdGlvbjogJ1BhdXNlIG9uIGV4Y2VwdGlvbnMnfSxcbl1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFRlcm1pbmFsQ29tbWFuZCAoKSB7XG4gICAgaWYgKG9zLnR5cGUoKSA9PT0gJ1dpbmRvd3NfTlQnKSB7XG4gICAgICAgIHJldHVybiAnc3RhcnQgJXMnXG4gICAgfSBlbHNlIGlmIChvcy50eXBlKCkgPT09ICdMaW51eCcpIHtcbiAgICAgICAgcmV0dXJuIGB4LXRlcm1pbmFsLWVtdWxhdG9yIC1lIFwiYmFzaCAtYyBcXFxcXCIlc1xcXFxcIlwiYFxuICAgIH0gZWxzZSBpZiAob3MudHlwZSgpID09PSAnRGFyd2luJykge1xuICAgICAgICByZXR1cm4gYG9zYXNjcmlwdCAtZSAndGVsbCBhcHAgXCJUZXJtaW5hbFwiIHRvIGRvIHNjcmlwdCBcIiVzXCInYFxuICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIG5vdCByZWNvZ25pc2VkLCBob3BlIHh0ZXJtIHdvcmtzXG4gICAgICAgIHJldHVybiBgeHRlcm0gLWUgXCJiYXNoIC1jIFxcXFxcIiVzXFxcXFwiXCJgXG4gICAgfVxufVxuXG5leHBvcnQgbGV0IGNvbmZpZyA9IHtcbiAgICB1c2VJZGVIYXNrZWxsQ2FiYWxCdWlsZGVyOiB7XG4gICAgICAgIHRpdGxlOiAnVXNlIGlkZS1oYXNrZWxsLWNhYmFsIGJ1aWxkZXInLFxuICAgICAgICBkZXNjcmlwdGlvbjogXCJVc2UgdGhlIGlkZS1oYXNrZWxsLWNhYmFsIGJ1aWxkZXIncyBjb21tYW5kIHdoZW4gcnVubmluZyBnaGNpIC0gXCIgK1xuICAgICAgICAgICAgJ3dpbGwgcnVuIGBzdGFjayBnaGNpYCB3aGVuIHN0YWNrIGlzIHRoZSBidWlsZGVyLCBgY2FiYWwgcmVwbGAgZm9yIGNhYmFsIGFuZCAnICtcbiAgICAgICAgICAgICdgZ2hjaWAgZm9yIG5vbmUnLFxuICAgICAgICBkZWZhdWx0OiB0cnVlLFxuICAgICAgICB0eXBlOiAnYm9vbGVhbicsXG4gICAgICAgIG9yZGVyOiAwXG4gICAgfSxcbiAgICBHSENJQ29tbWFuZDoge1xuICAgICAgICB0aXRsZTogJ0dIQ0kgQ29tbWFuZCcsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnVGhlIGNvbW1hbmQgdG8gcnVuIHRvIGV4ZWN1dGUgYGdoY2lgLCB0aGlzIHdpbGwgZ2V0IGlnbm9yZSBpZiB0aGUnICtcbiAgICAgICAgICAgICcgcHJldmlvdXMgc2V0dGluZyBpcyBzZXQgdG8gdHJ1ZScsXG4gICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICBkZWZhdWx0OiAnZ2hjaScsXG4gICAgICAgIG9yZGVyOiAxXG4gICAgfSxcbiAgICBHSENJQXJndW1lbnRzOiB7XG4gICAgICAgIHRpdGxlOiAnR0hDSSBBcmd1bWVudHMnLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ0FyZ3VtZW50cyB0byBnaXZlIHRvIGBnaGNpYCwgc2VwYXJhdGVkIGJ5IGEgc3BhY2UnLFxuICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgZGVmYXVsdDogJycsXG4gICAgICAgIG9yZGVyOiAyXG4gICAgfSxcbiAgICBub2RlQ29tbWFuZDoge1xuICAgICAgICBkZXNjcmlwdGlvbjogJ1RoZSBjb21tYW5kIHRvIHJ1biB0byBleGVjdXRlIG5vZGUuanMnLFxuICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgZGVmYXVsdDogJ25vZGUnLFxuICAgICAgICBvcmRlcjogM1xuICAgIH0sXG4gICAgdGVybWluYWxDb21tYW5kOiB7XG4gICAgICAgIGRlc2NyaXB0aW9uOiAnVGhlIGNvbW1hbmQgdG8gcnVuIHRvIGxhdW5jaCBhIHRlcm1pbmFsLCB3aGVyZSB0aGUgY29tbWFuZCBsYXVuY2hlZCBpbiB0aGUgdGVybWluYWwgaXMgYCVzYC4nLFxuICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgZGVmYXVsdDogZ2V0VGVybWluYWxDb21tYW5kKCksXG4gICAgICAgIG9yZGVyOiA0XG4gICAgfSxcbiAgICBjbGlja0d1dHRlclRvVG9nZ2xlQnJlYWtwb2ludDoge1xuICAgICAgICB0eXBlOiAnYm9vbGVhbicsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnSW5zZXJ0IGEgYnJlYWtwb2ludCB3aGVuIHRoZSBndXR0ZXIgaXMgY2xpY2tlZCBpbiBhIGhhc2tlbGwgc291cmNlIGZpbGUnLFxuICAgICAgICBkZWZhdWx0OiB0cnVlLFxuICAgICAgICBvcmRlcjogNVxuICAgIH0sXG4gICAgc2hvd1Rlcm1pbmFsOiB7XG4gICAgICAgIHR5cGU6ICdib29sZWFuJyxcbiAgICAgICAgZGVzY3JpcHRpb246ICdTaG93IGEgdGVybWluYWwgd2l0aCBgZ2hjaWAgcnVubmluZyB3aGVuIGRlYnVnZ2luZycsXG4gICAgICAgIGRlZmF1bHQ6IHRydWUsXG4gICAgICAgIG9yZGVyOiA2XG4gICAgfSxcbiAgICBmdW5jdGlvblRvRGVidWc6IHtcbiAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnVGhlIGZ1bmN0aW9uIHRvIHJ1biB3aGVuIGRlYnVnZ2luZycsXG4gICAgICAgIGRlZmF1bHQ6ICdtYWluJyxcbiAgICAgICAgb3JkZXI6IDdcbiAgICB9LFxuICAgIGJyZWFrT25FeGNlcHRpb246IHtcbiAgICAgICAgZGVzY3JpcHRpb246IGBXaGV0aGVyIHRvIGJyZWFrIG9uIGV4Y2VwdGlvbnMsIGVycm9ycyBvciBuZWl0aGVyLlxuICAgICAgICAgICAgTm90ZTogYnJlYWtpbmcgb24gZXhjZXB0aW9uIG1heSBjYXVzZSB0aGUgZGVidWdnZXIgdG8gZnJlZXplIGluIHNvbWUgaW5zdGFuY2VzLlxuICAgICAgICAgICAgU2VlIFsjM10oaHR0cHM6Ly9naXRodWIuY29tL1Rob21hc0hpY2ttYW4vaGFza2VsbC1kZWJ1Zy9pc3N1ZXMvMylgLFxuICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgZGVmYXVsdDogJ25vbmUnLFxuICAgICAgICBlbnVtOiBkZWJ1Z01vZGVzLFxuICAgICAgICBvcmRlcjogOFxuICAgIH1cbn1cblxubGV0IHVwaTogaGFza2VsbElkZS5IYXNrZWxsVVBJXG5cbmV4cG9ydCBmdW5jdGlvbiBjb25zdW1lSGFza2VsbFVwaSAodXBpQ29udGFpbmVyOiBoYXNrZWxsSWRlLkhhc2tlbGxVUElDb250YWluZXIpIHtcbiAgICBjb25zdCBwbHVnaW5EaXNwb3NhYmxlID0gbmV3IGF0b21BUEkuQ29tcG9zaXRlRGlzcG9zYWJsZSgpXG4gICAgY29uc3QgX3VwaSA9IHVwaUNvbnRhaW5lci5yZWdpc3RlclBsdWdpbihwbHVnaW5EaXNwb3NhYmxlLCAnaGFza2VsbC1kZWJ1ZycpXG4gICAgdG9vbHRpcE92ZXJyaWRlLmNvbnN1bWVIYXNrZWxsVXBpKF91cGkpXG4gICAgdXBpID0gX3VwaVxufVxuIl19