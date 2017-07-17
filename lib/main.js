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
        exports.breakpointUI.toggleBreakpoint(te.getCursorBufferPosition().row + 1, te);
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
            const scopes = te.getRootScopeDescriptor().getScopesArray();
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9saWIvbWFpbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O0FBQ0EsK0NBQStDO0FBQy9DLHFEQUFxRDtBQUNyRCxnQ0FBZ0M7QUFDaEMseUJBQXlCO0FBQ3pCLDZCQUE2QjtBQUM3QixvQ0FBb0M7QUFHekIsUUFBQSxZQUFZLEdBQUcsSUFBSSxZQUFZLEVBQUUsQ0FBQTtBQUVqQyxRQUFBLGVBQWUsR0FBRyxJQUFJLGVBQWUsQ0FBQyxDQUFPLFVBQVU7SUFDOUQsRUFBRSxDQUFDLENBQUMsb0JBQVksS0FBSyxTQUFTLENBQUMsQ0FBQyxDQUFDO1FBQUMsTUFBTSxDQUFDLG9CQUFZLENBQUE7SUFBQyxDQUFDO0lBQ3ZELE1BQU0sQ0FBQyxvQkFBWSxDQUFDLGlCQUFpQixDQUFDLFVBQVUsQ0FBQyxDQUFBO0FBQ3JELENBQUMsQ0FBQSxDQUFDLENBQUE7QUFFUyxRQUFBLFFBQVEsR0FBRztJQUNsQixZQUFZLEVBQUUsSUFBSTtDQUNyQixDQUFBO0FBRVUsUUFBQSxRQUFRLEdBQUc7SUFDbEIsT0FBTyxFQUFFO1FBRUwsTUFBTSxRQUFRLEdBQUcsT0FBTyxDQUFDLFlBQVksQ0FBQyxDQUFBO1FBRXRDLEdBQUcsQ0FBQyxjQUFjLENBQUMsbUJBQW1CLEVBQUUsU0FBUyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRTtZQUN2RCxvQkFBWSxHQUFHLElBQUksUUFBUSxDQUFDLG9CQUFZLENBQUMsV0FBVyxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQTtRQUNsRSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUM7WUFDTCxvQkFBWSxHQUFHLElBQUksUUFBUSxDQUFDLG9CQUFZLENBQUMsV0FBVyxDQUFDLENBQUE7UUFDekQsQ0FBQyxDQUFDLENBQUE7SUFDTixDQUFDO0lBQ0QsWUFBWSxFQUFFO1FBQ1YsRUFBRSxDQUFDLENBQUMsb0JBQVksQ0FBQyxDQUFDLENB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LEtBQUssRUFBRSxDQUFDO0tBQ1g7SUFDRCxnQkFBZ0IsRUFBRTtRQUNkLFdBQVcsRUFBRTs7OEVBRXlEO1FBQ3RFLElBQUksRUFBRSxRQUFRO1FBQ2QsT0FBTyxFQUFFLE1BQU07UUFDZixJQUFJLEVBQUUsa0JBQVU7UUFDaEIsS0FBSyxFQUFFLENBQUM7S0FDWDtDQUNKLENBQUE7QUFFRCxJQUFJLEdBQTBCLENBQUE7QUFFOUIsMkJBQW1DLFlBQTRDO0lBQzNFLE1BQU0sZ0JBQWdCLEdBQUcsSUFBSSxPQUFPLENBQUMsbUJBQW1CLEVBQUUsQ0FBQTtJQUMxRCxNQUFNLElBQUksR0FBRyxZQUFZLENBQUMsY0FBYyxDQUFDLGdCQUFnQixFQUFFLGVBQWUsQ0FBQyxDQUFBO0lBQzNFLHVCQUFlLENBQUMsaUJBQWlCLENBQUMsSUFBSSxDQUFDLENBQUE7SUFDdkMsR0FBRyxHQUFHLElBQUksQ0FBQTtBQUNkLENBQUM7QUFMRCw4Q0FLQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBEZWJ1Z2dlciA9IHJlcXVpcmUoJy4vRGVidWdnZXInKVxuaW1wb3J0IEJyZWFrcG9pbnRVSSA9IHJlcXVpcmUoJy4vQnJlYWtwb2ludFVJJylcbmltcG9ydCBUb29sdGlwT3ZlcnJpZGUgPSByZXF1aXJlKCcuL1Rvb2x0aXBPdmVycmlkZScpXG5pbXBvcnQgYXRvbUFQSSA9IHJlcXVpcmUoJ2F0b20nKVxuaW1wb3J0IG9zID0gcmVxdWlyZSgnb3MnKVxuaW1wb3J0IHBhdGggPSByZXF1aXJlKCdwYXRoJylcbmltcG9ydCBjcCA9IHJlcXVpcmUoJ2NoaWxkX3Byb2Nlc3MnKVxuaW1wb3J0ICogYXMgaGFza2VsbElkZSBmcm9tICcuL2lkZS1oYXNrZWxsJ1xuXG5leHBvcnQgbGV0IGJyZWFrcG9pbnRVSSA9IG5ldyBCcmVha3BvaW50VUkoKVxuZXhwb3J0IGxldCBkZWJ1Z2dlckluc3Q6IERlYnVnZ2VyIHwgdW5kZWZpbmVkXG5leHBvcnQgbGV0IHRvb2x0aXBPdmVycmlkZSA9IG5ldyBUb29sdGlwT3ZlcnJpZGUoYXN5bmMgKGV4cHJlc3Npb24pID0+IHtcbiAgICBpZiAoZGVidWdnZXJJbnN0ID09PSB1bmRlZmluZWQpIHsgcmV0dXJuIGRlYnVnZ2VySW5zdCB9XG4gICAgcmV0dXJuIGRlYnVnZ2VySW5zdC5yZXNvbHZlRXhwcmVzc2lvbihleHByZXNzaW9uKVxufSlcblxuZXhwb3J0IGxldCBzZXR0aW5ncyA9IHtcbiAgICBicmVha09uRXJyb3I6IHRydWVcbn1cblxuZXhwb3J0IGxldCBjb21tYW5kcyA9IHtcbiAgICAnZGVidWcnOiAoKSA9PiB7XG4gICAgICAgIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTogdmFyaWFibGUtbmFtZVxuICAgICAgICBjb25zdCBEZWJ1Z2dlciA9IHJlcXVpcmUoJy4vRGVidWdnZXInKVxuXG4gICAgICAgIHVwaS5nZXRDb25maWdQYXJhbSgnaWRlLWhhc2tlbGwtY2FiYWwnLCAnYnVpbGRlcicpLnRoZW4oKG9iKSA9PiB7XG4gICAgICAgICAgICBkZWJ1Z2dlckluc3QgPSBuZXcgRGVidWdnZXIoYnJlYWtwb2ludFVJLmJyZWFrcG9pbnRzLCBvYi5uYW1lKVxuICAgICAgICB9KS5jYXRjaCgoKSA9PiB7XG4gICAgICAgICAgICBkZWJ1Z2dlckluc3QgPSBuZXcgRGVidWdnZXIoYnJlYWtwb2ludFVJLmJyZWFrcG9pbnRzKVxuICAgICAgICB9KVxuICAgIH0sXG4gICAgJ2RlYnVnLWJhY2snOiAoKSA9PiB7XG4gICAgICAgIGlmIChkZWJ1Z2dlckluc3QpIHtcbiAgICAgICAgICAgIGRlYnVnZ2VySW5zdC5iYWNrKClcbiAgICAgICAgfVxuICAgIH0sXG4gICAgJ2RlYnVnLWZvcndhcmQnOiAoKSA9PiB7XG4gICAgICAgIGlmIChkZWJ1Z2dlckluc3QpIHtcbiAgICAgICAgICAgIGRlYnVnZ2VySW5zdC5mb3J3YXJkKClcbiAgICAgICAgfVxuICAgIH0sXG4gICAgJ2RlYnVnLXN0ZXAnOiAoKSA9PiB7XG4gICAgICAgIGlmIChkZWJ1Z2dlckluc3QpIHtcbiAgICAgICAgICAgIGRlYnVnZ2VySW5zdC5zdGVwKClcbiAgICAgICAgfVxuICAgIH0sXG4gICAgJ2RlYnVnLXN0b3AnOiAoKSA9PiB7XG4gICAgICAgIGlmIChkZWJ1Z2dlckluc3QpIHtcbiAgICAgICAgICAgIGRlYnVnZ2VySW5zdC5zdG9wKClcbiAgICAgICAgfVxuICAgIH0sXG4gICAgJ2RlYnVnLWNvbnRpbnVlJzogKCkgPT4ge1xuICAgICAgICBpZiAoZGVidWdnZXJJbnN0KSB7XG4gICAgICAgICAgICBkZWJ1Z2dlckluc3QuY29udGludWUoKVxuICAgICAgICB9XG4gICAgfSxcbiAgICAndG9nZ2xlLWJyZWFrcG9pbnQnOiAoKSA9PiB7XG4gICAgICAgIGNvbnN0IHRlID0gYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlVGV4dEVkaXRvcigpXG5cbiAgICAgICAgYnJlYWtwb2ludFVJLnRvZ2dsZUJyZWFrcG9pbnQoXG4gICAgICAgICAgICB0ZS5nZXRDdXJzb3JCdWZmZXJQb3NpdGlvbigpLnJvdyArIDEsXG4gICAgICAgICAgICB0ZVxuICAgICAgICApXG4gICAgfSxcbiAgICAnc2V0LWJyZWFrLW9uLWV4Y2VwdGlvbic6ICgpID0+IHtcbiAgICAgICAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOiB2YXJpYWJsZS1uYW1lXG4gICAgICAgIGNvbnN0IFNlbGVjdERlYnVnTW9kZVZpZXcgPSByZXF1aXJlKCcuL3ZpZXdzL1NlbGVjdERlYnVnTW9kZVZpZXcnKVxuICAgICAgICBjb25zdCB2aWV3ID0gbmV3IFNlbGVjdERlYnVnTW9kZVZpZXcoZGVidWdNb2RlcywgYXRvbS5jb25maWcuZ2V0KCdoYXNrZWxsLWRlYnVnLmJyZWFrT25FeGNlcHRpb24nKSlcblxuICAgICAgICBjb25zdCBwYW5lbCA9IGF0b20ud29ya3NwYWNlLmFkZE1vZGFsUGFuZWwoe1xuICAgICAgICAgICAgaXRlbTogdmlld1xuICAgICAgICB9KVxuXG4gICAgICAgIHZpZXcuZm9jdXNGaWx0ZXJFZGl0b3IoKVxuXG4gICAgICAgIHZpZXcuZW1pdHRlci5vbignc2VsZWN0ZWQnLCAoaXRlbTogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICBhdG9tLmNvbmZpZy5zZXQoJ2hhc2tlbGwtZGVidWcuYnJlYWtPbkV4Y2VwdGlvbicsIGl0ZW0pXG4gICAgICAgIH0pXG5cbiAgICAgICAgdmlldy5lbWl0dGVyLm9uKCdjYW5jZWxlZCcsICgpID0+IHtcbiAgICAgICAgICAgIHBhbmVsLmRlc3Ryb3koKVxuICAgICAgICB9KVxuICAgIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG9uRmlyc3RSdW4gKCkge1xuICAgIHN0YXRlID0ge1xuICAgICAgICBwcm9wZXJseUFjdGl2YXRlZDogZmFsc2VcbiAgICB9XG5cbiAgICAvLyBmcm9tIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvMzQ5NTMxNjgvbm9kZS1jaGVjay1leGlzdGVuY2Utb2YtY29tbWFuZC1pbi1wYXRoXG4gICAgY29uc3QgaXNXaW4gPSBvcy5wbGF0Zm9ybSgpLmluZGV4T2YoJ3dpbicpID4gLTFcbiAgICBjb25zdCB3aGVyZSA9IGlzV2luID8gJ3doZXJlJyA6ICd3aGVyZWlzJ1xuXG4gICAgY29uc3Qgb3V0ID0gY3AuZXhlYyh3aGVyZSArICcgbm9kZScpXG5cbiAgICBvdXQub24oJ2Nsb3NlJywgKGNvZGUpID0+IHtcbiAgICAgICAgaWYgKGNvZGUgPT09IDEpIHsvLyBub3QgZm91bmRcbiAgICAgICAgICAgIC8vIGZhbGxiYWNrIHRvIHRoZSBub2RlIGluIGFwbVxuICAgICAgICAgICAgYXRvbS5jb25maWcuc2V0KCdoYXNrZWxsLWRlYnVnLm5vZGVDb21tYW5kJywgcGF0aC5yZXNvbHZlKGF0b20ucGFja2FnZXMuZ2V0QXBtUGF0aCgpLCAnLi4vLi4vYmluL2F0b20nKSlcbiAgICAgICAgICAgIGlmIChzdGF0ZSkgeyBzdGF0ZS5wcm9wZXJseUFjdGl2YXRlZCA9IHRydWUgfVxuICAgICAgICB9XG4gICAgfSlcbn1cblxuaW50ZXJmYWNlIEhhc2tlbGxEZWJ1Z1N0YXRlIHtcbiAgICBwcm9wZXJseUFjdGl2YXRlZDogYm9vbGVhblxufVxuXG5leHBvcnQgbGV0IHN0YXRlOiBIYXNrZWxsRGVidWdTdGF0ZSB8IHVuZGVmaW5lZFxuXG5leHBvcnQgZnVuY3Rpb24gYWN0aXZhdGUgKF9zdGF0ZT86IEhhc2tlbGxEZWJ1Z1N0YXRlKSB7XG4gICAgc3RhdGUgPSBfc3RhdGVcblxuICAgIGlmIChzdGF0ZSA9PT0gdW5kZWZpbmVkIHx8IHN0YXRlLnByb3Blcmx5QWN0aXZhdGVkICE9PSB0cnVlKSB7XG4gICAgICAgIG9uRmlyc3RSdW4oKVxuICAgIH1cbiAgICBhdG9tLndvcmtzcGFjZS5vYnNlcnZlQWN0aXZlUGFuZUl0ZW0oKHBhbmUpID0+IHtcbiAgICAgICAgaWYgKGF0b20ud29ya3NwYWNlLmlzVGV4dEVkaXRvcihwYW5lKSkge1xuICAgICAgICAgICAgY29uc3QgdGU6IGF0b21BUEkuVGV4dEVkaXRvciAmIHsgaGFzSGFza2VsbEJyZWFrcG9pbnRzPzogYm9vbGVhbiB9ID0gcGFuZVxuICAgICAgICAgICAgY29uc3Qgc2NvcGVzID0gdGUuZ2V0Um9vdFNjb3BlRGVzY3JpcHRvcigpLmdldFNjb3Blc0FycmF5KClcbiAgICAgICAgICAgIGlmIChzY29wZXMubGVuZ3RoID09PSAxICYmIHNjb3Blc1swXSA9PT0gJ3NvdXJjZS5oYXNrZWxsJykge1xuICAgICAgICAgICAgICAgIGlmICghdGUuaGFzSGFza2VsbEJyZWFrcG9pbnRzKSB7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrcG9pbnRVSS5hdHRhY2hUb05ld1RleHRFZGl0b3IodGUpXG4gICAgICAgICAgICAgICAgICAgIHRlLmhhc0hhc2tlbGxCcmVha3BvaW50cyA9IHRydWVcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoZGVidWdnZXJJbnN0KSB7XG4gICAgICAgICAgICAgICAgICAgIGRlYnVnZ2VySW5zdC5zaG93UGFuZWxzKClcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gIC8vIGRvbid0IGRvIGJlbG93XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBpZiBhbnkgcGFuZSB0aGF0IGlzbid0IGEgaGFza2VsbCBzb3VyY2UgZmlsZSBhbmQgd2UncmUgZGVidWdnaW5nXG4gICAgICAgIGlmIChkZWJ1Z2dlckluc3QpIHtcbiAgICAgICAgICAgIGRlYnVnZ2VySW5zdC5oaWRlUGFuZWxzKClcbiAgICAgICAgfVxuICAgIH0pXG5cbiAgICBmb3IgKGNvbnN0IGNvbW1hbmQgb2YgT2JqZWN0LmtleXMoY29tbWFuZHMpKXtcbiAgICAgICAgYXRvbS5jb21tYW5kcy5hZGQoXCJhdG9tLXRleHQtZWRpdG9yW2RhdGEtZ3JhbW1hcj0nc291cmNlIGhhc2tlbGwnXVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAnaGFza2VsbDonICsgY29tbWFuZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgY29tbWFuZHNbY29tbWFuZF0pXG4gICAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gc2VyaWFsaXplICgpIHtcbiAgICByZXR1cm4gc3RhdGVcbn1cblxuZXhwb3J0IGxldCBkZWJ1Z01vZGVzID0gW1xuICAgIHt2YWx1ZTogJ25vbmUnLCBkZXNjcmlwdGlvbjogJ0RvblxcJ3QgcGF1c2Ugb24gYW55IGV4Y2VwdGlvbnMnfSxcbiAgICB7dmFsdWU6ICdlcnJvcnMnLCBkZXNjcmlwdGlvbjogJ1BhdXNlIG9uIGVycm9ycyAodW5jYXVnaHQgZXhjZXB0aW9ucyknfSxcbiAgICB7dmFsdWU6ICdleGNlcHRpb25zJywgZGVzY3JpcHRpb246ICdQYXVzZSBvbiBleGNlcHRpb25zJ30sXG5dXG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRUZXJtaW5hbENvbW1hbmQgKCkge1xuICAgIGlmIChvcy50eXBlKCkgPT09ICdXaW5kb3dzX05UJykge1xuICAgICAgICByZXR1cm4gJ3N0YXJ0ICVzJ1xuICAgIH0gZWxzZSBpZiAob3MudHlwZSgpID09PSAnTGludXgnKSB7XG4gICAgICAgIHJldHVybiBgeC10ZXJtaW5hbC1lbXVsYXRvciAtZSBcImJhc2ggLWMgXFxcXFwiJXNcXFxcXCJcImBcbiAgICB9IGVsc2UgaWYgKG9zLnR5cGUoKSA9PT0gJ0RhcndpbicpIHtcbiAgICAgICAgcmV0dXJuIGBvc2FzY3JpcHQgLWUgJ3RlbGwgYXBwIFwiVGVybWluYWxcIiB0byBkbyBzY3JpcHQgXCIlc1wiJ2BcbiAgICB9IGVsc2Uge1xuICAgICAgICAvLyBub3QgcmVjb2duaXNlZCwgaG9wZSB4dGVybSB3b3Jrc1xuICAgICAgICByZXR1cm4gYHh0ZXJtIC1lIFwiYmFzaCAtYyBcXFxcXCIlc1xcXFxcIlwiYFxuICAgIH1cbn1cblxuZXhwb3J0IGxldCBjb25maWcgPSB7XG4gICAgdXNlSWRlSGFza2VsbENhYmFsQnVpbGRlcjoge1xuICAgICAgICB0aXRsZTogJ1VzZSBpZGUtaGFza2VsbC1jYWJhbCBidWlsZGVyJyxcbiAgICAgICAgZGVzY3JpcHRpb246IFwiVXNlIHRoZSBpZGUtaGFza2VsbC1jYWJhbCBidWlsZGVyJ3MgY29tbWFuZCB3aGVuIHJ1bm5pbmcgZ2hjaSAtIFwiICtcbiAgICAgICAgICAgICd3aWxsIHJ1biBgc3RhY2sgZ2hjaWAgd2hlbiBzdGFjayBpcyB0aGUgYnVpbGRlciwgYGNhYmFsIHJlcGxgIGZvciBjYWJhbCBhbmQgJyArXG4gICAgICAgICAgICAnYGdoY2lgIGZvciBub25lJyxcbiAgICAgICAgZGVmYXVsdDogdHJ1ZSxcbiAgICAgICAgdHlwZTogJ2Jvb2xlYW4nLFxuICAgICAgICBvcmRlcjogMFxuICAgIH0sXG4gICAgR0hDSUNvbW1hbmQ6IHtcbiAgICAgICAgdGl0bGU6ICdHSENJIENvbW1hbmQnLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ1RoZSBjb21tYW5kIHRvIHJ1biB0byBleGVjdXRlIGBnaGNpYCwgdGhpcyB3aWxsIGdldCBpZ25vcmUgaWYgdGhlJyArXG4gICAgICAgICAgICAnIHByZXZpb3VzIHNldHRpbmcgaXMgc2V0IHRvIHRydWUnLFxuICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgZGVmYXVsdDogJ2doY2knLFxuICAgICAgICBvcmRlcjogMVxuICAgIH0sXG4gICAgR0hDSUFyZ3VtZW50czoge1xuICAgICAgICB0aXRsZTogJ0dIQ0kgQXJndW1lbnRzJyxcbiAgICAgICAgZGVzY3JpcHRpb246ICdBcmd1bWVudHMgdG8gZ2l2ZSB0byBgZ2hjaWAsIHNlcGFyYXRlZCBieSBhIHNwYWNlJyxcbiAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgIGRlZmF1bHQ6ICcnLFxuICAgICAgICBvcmRlcjogMlxuICAgIH0sXG4gICAgbm9kZUNvbW1hbmQ6IHtcbiAgICAgICAgZGVzY3JpcHRpb246ICdUaGUgY29tbWFuZCB0byBydW4gdG8gZXhlY3V0ZSBub2RlLmpzJyxcbiAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgIGRlZmF1bHQ6ICdub2RlJyxcbiAgICAgICAgb3JkZXI6IDNcbiAgICB9LFxuICAgIHRlcm1pbmFsQ29tbWFuZDoge1xuICAgICAgICBkZXNjcmlwdGlvbjogJ1RoZSBjb21tYW5kIHRvIHJ1biB0byBsYXVuY2ggYSB0ZXJtaW5hbCwgd2hlcmUgdGhlIGNvbW1hbmQgbGF1bmNoZWQgaW4gdGhlIHRlcm1pbmFsIGlzIGAlc2AuJyxcbiAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgIGRlZmF1bHQ6IGdldFRlcm1pbmFsQ29tbWFuZCgpLFxuICAgICAgICBvcmRlcjogNFxuICAgIH0sXG4gICAgY2xpY2tHdXR0ZXJUb1RvZ2dsZUJyZWFrcG9pbnQ6IHtcbiAgICAgICAgdHlwZTogJ2Jvb2xlYW4nLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ0luc2VydCBhIGJyZWFrcG9pbnQgd2hlbiB0aGUgZ3V0dGVyIGlzIGNsaWNrZWQgaW4gYSBoYXNrZWxsIHNvdXJjZSBmaWxlJyxcbiAgICAgICAgZGVmYXVsdDogdHJ1ZSxcbiAgICAgICAgb3JkZXI6IDVcbiAgICB9LFxuICAgIHNob3dUZXJtaW5hbDoge1xuICAgICAgICB0eXBlOiAnYm9vbGVhbicsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnU2hvdyBhIHRlcm1pbmFsIHdpdGggYGdoY2lgIHJ1bm5pbmcgd2hlbiBkZWJ1Z2dpbmcnLFxuICAgICAgICBkZWZhdWx0OiB0cnVlLFxuICAgICAgICBvcmRlcjogNlxuICAgIH0sXG4gICAgZnVuY3Rpb25Ub0RlYnVnOiB7XG4gICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ1RoZSBmdW5jdGlvbiB0byBydW4gd2hlbiBkZWJ1Z2dpbmcnLFxuICAgICAgICBkZWZhdWx0OiAnbWFpbicsXG4gICAgICAgIG9yZGVyOiA3XG4gICAgfSxcbiAgICBicmVha09uRXhjZXB0aW9uOiB7XG4gICAgICAgIGRlc2NyaXB0aW9uOiBgV2hldGhlciB0byBicmVhayBvbiBleGNlcHRpb25zLCBlcnJvcnMgb3IgbmVpdGhlci5cbiAgICAgICAgICAgIE5vdGU6IGJyZWFraW5nIG9uIGV4Y2VwdGlvbiBtYXkgY2F1c2UgdGhlIGRlYnVnZ2VyIHRvIGZyZWV6ZSBpbiBzb21lIGluc3RhbmNlcy5cbiAgICAgICAgICAgIFNlZSBbIzNdKGh0dHBzOi8vZ2l0aHViLmNvbS9UaG9tYXNIaWNrbWFuL2hhc2tlbGwtZGVidWcvaXNzdWVzLzMpYCxcbiAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgIGRlZmF1bHQ6ICdub25lJyxcbiAgICAgICAgZW51bTogZGVidWdNb2RlcyxcbiAgICAgICAgb3JkZXI6IDhcbiAgICB9XG59XG5cbmxldCB1cGk6IGhhc2tlbGxJZGUuSGFza2VsbFVQSVxuXG5leHBvcnQgZnVuY3Rpb24gY29uc3VtZUhhc2tlbGxVcGkgKHVwaUNvbnRhaW5lcjogaGFza2VsbElkZS5IYXNrZWxsVVBJQ29udGFpbmVyKSB7XG4gICAgY29uc3QgcGx1Z2luRGlzcG9zYWJsZSA9IG5ldyBhdG9tQVBJLkNvbXBvc2l0ZURpc3Bvc2FibGUoKVxuICAgIGNvbnN0IF91cGkgPSB1cGlDb250YWluZXIucmVnaXN0ZXJQbHVnaW4ocGx1Z2luRGlzcG9zYWJsZSwgJ2hhc2tlbGwtZGVidWcnKVxuICAgIHRvb2x0aXBPdmVycmlkZS5jb25zdW1lSGFza2VsbFVwaShfdXBpKVxuICAgIHVwaSA9IF91cGlcbn1cbiJdfQ==