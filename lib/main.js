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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9saWIvbWFpbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O0FBQ0EsK0NBQStDO0FBQy9DLHFEQUFxRDtBQUNyRCxnQ0FBZ0M7QUFDaEMseUJBQXlCO0FBQ3pCLDZCQUE2QjtBQUM3QixvQ0FBb0M7QUFHekIsUUFBQSxZQUFZLEdBQUcsSUFBSSxZQUFZLEVBQUUsQ0FBQTtBQUVqQyxRQUFBLGVBQWUsR0FBRyxJQUFJLGVBQWUsQ0FBQyxDQUFPLFVBQVU7SUFDOUQsRUFBRSxDQUFDLENBQUMsb0JBQVksS0FBSyxTQUFTLENBQUMsQ0FBQyxDQUFDO1FBQUMsTUFBTSxDQUFDLG9CQUFZLENBQUE7SUFBQyxDQUFDO0lBQ3ZELE1BQU0sQ0FBQyxvQkFBWSxDQUFDLGlCQUFpQixDQUFDLFVBQVUsQ0FBQyxDQUFBO0FBQ3JELENBQUMsQ0FBQSxDQUFDLENBQUE7QUFFUyxRQUFBLFFBQVEsR0FBRztJQUNsQixZQUFZLEVBQUUsSUFBSTtDQUNyQixDQUFBO0FBRVUsUUFBQSxRQUFRLEdBQUc7SUFDbEIsT0FBTyxFQUFFO1FBRUwsTUFBTSxRQUFRLEdBQUcsT0FBTyxDQUFDLFlBQVksQ0FBQyxDQUFBO1FBRXRDLEdBQUcsQ0FBQyxjQUFjLENBQUMsbUJBQW1CLEVBQUUsU0FBUyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRTtZQUN2RCxvQkFBWSxHQUFHLElBQUksUUFBUSxDQUFDLG9CQUFZLENBQUMsV0FBVyxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQTtRQUNsRSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUM7WUFDTCxvQkFBWSxHQUFHLElBQUksUUFBUSxDQUFDLG9CQUFZLENBQUMsV0FBVyxDQUFDLENBQUE7UUFDekQsQ0FBQyxDQUFDLENBQUE7SUFDTixDQUFDO0lBQ0QsWUFBWSxFQUFFO1FBQ1YsRUFBRSxDQUFDLENBQUMsb0JBQVksQ0FBQyxDQUFDLENB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LEVBQUUsQ0FBQztLQUNYO0lBQ0QsZ0JBQWdCLEVBQUU7UUFDZCxXQUFXLEVBQUU7OzhFQUV5RDtRQUN0RSxJQUFJLEVBQUUsUUFBUTtRQUNkLE9BQU8sRUFBRSxNQUFNO1FBQ2YsSUFBSSxFQUFFLGtCQUFVO1FBQ2hCLEtBQUssRUFBRSxDQUFDO0tBQ1g7Q0FDSixDQUFBO0FBRUQsSUFBSSxHQUEwQixDQUFBO0FBRTlCLDJCQUFtQyxZQUE0QztJQUMzRSxNQUFNLGdCQUFnQixHQUFHLElBQUksT0FBTyxDQUFDLG1CQUFtQixFQUFFLENBQUE7SUFDMUQsTUFBTSxJQUFJLEdBQUcsWUFBWSxDQUFDLGNBQWMsQ0FBQyxnQkFBZ0IsRUFBRSxlQUFlLENBQUMsQ0FBQTtJQUMzRSx1QkFBZSxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxDQUFBO0lBQ3ZDLEdBQUcsR0FBRyxJQUFJLENBQUE7QUFDZCxDQUFDO0FBTEQsOENBS0MiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgRGVidWdnZXIgPSByZXF1aXJlKCcuL0RlYnVnZ2VyJylcbmltcG9ydCBCcmVha3BvaW50VUkgPSByZXF1aXJlKCcuL0JyZWFrcG9pbnRVSScpXG5pbXBvcnQgVG9vbHRpcE92ZXJyaWRlID0gcmVxdWlyZSgnLi9Ub29sdGlwT3ZlcnJpZGUnKVxuaW1wb3J0IGF0b21BUEkgPSByZXF1aXJlKCdhdG9tJylcbmltcG9ydCBvcyA9IHJlcXVpcmUoJ29zJylcbmltcG9ydCBwYXRoID0gcmVxdWlyZSgncGF0aCcpXG5pbXBvcnQgY3AgPSByZXF1aXJlKCdjaGlsZF9wcm9jZXNzJylcbmltcG9ydCAqIGFzIGhhc2tlbGxJZGUgZnJvbSAnLi9pZGUtaGFza2VsbCdcblxuZXhwb3J0IGxldCBicmVha3BvaW50VUkgPSBuZXcgQnJlYWtwb2ludFVJKClcbmV4cG9ydCBsZXQgZGVidWdnZXJJbnN0OiBEZWJ1Z2dlciB8IHVuZGVmaW5lZFxuZXhwb3J0IGxldCB0b29sdGlwT3ZlcnJpZGUgPSBuZXcgVG9vbHRpcE92ZXJyaWRlKGFzeW5jIChleHByZXNzaW9uKSA9PiB7XG4gICAgaWYgKGRlYnVnZ2VySW5zdCA9PT0gdW5kZWZpbmVkKSB7IHJldHVybiBkZWJ1Z2dlckluc3QgfVxuICAgIHJldHVybiBkZWJ1Z2dlckluc3QucmVzb2x2ZUV4cHJlc3Npb24oZXhwcmVzc2lvbilcbn0pXG5cbmV4cG9ydCBsZXQgc2V0dGluZ3MgPSB7XG4gICAgYnJlYWtPbkVycm9yOiB0cnVlXG59XG5cbmV4cG9ydCBsZXQgY29tbWFuZHMgPSB7XG4gICAgJ2RlYnVnJzogKCkgPT4ge1xuICAgICAgICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6IHZhcmlhYmxlLW5hbWVcbiAgICAgICAgY29uc3QgRGVidWdnZXIgPSByZXF1aXJlKCcuL0RlYnVnZ2VyJylcblxuICAgICAgICB1cGkuZ2V0Q29uZmlnUGFyYW0oJ2lkZS1oYXNrZWxsLWNhYmFsJywgJ2J1aWxkZXInKS50aGVuKChvYikgPT4ge1xuICAgICAgICAgICAgZGVidWdnZXJJbnN0ID0gbmV3IERlYnVnZ2VyKGJyZWFrcG9pbnRVSS5icmVha3BvaW50cywgb2IubmFtZSlcbiAgICAgICAgfSkuY2F0Y2goKCkgPT4ge1xuICAgICAgICAgICAgZGVidWdnZXJJbnN0ID0gbmV3IERlYnVnZ2VyKGJyZWFrcG9pbnRVSS5icmVha3BvaW50cylcbiAgICAgICAgfSlcbiAgICB9LFxuICAgICdkZWJ1Zy1iYWNrJzogKCkgPT4ge1xuICAgICAgICBpZiAoZGVidWdnZXJJbnN0KSB7XG4gICAgICAgICAgICBkZWJ1Z2dlckluc3QuYmFjaygpXG4gICAgICAgIH1cbiAgICB9LFxuICAgICdkZWJ1Zy1mb3J3YXJkJzogKCkgPT4ge1xuICAgICAgICBpZiAoZGVidWdnZXJJbnN0KSB7XG4gICAgICAgICAgICBkZWJ1Z2dlckluc3QuZm9yd2FyZCgpXG4gICAgICAgIH1cbiAgICB9LFxuICAgICdkZWJ1Zy1zdGVwJzogKCkgPT4ge1xuICAgICAgICBpZiAoZGVidWdnZXJJbnN0KSB7XG4gICAgICAgICAgICBkZWJ1Z2dlckluc3Quc3RlcCgpXG4gICAgICAgIH1cbiAgICB9LFxuICAgICdkZWJ1Zy1zdG9wJzogKCkgPT4ge1xuICAgICAgICBpZiAoZGVidWdnZXJJbnN0KSB7XG4gICAgICAgICAgICBkZWJ1Z2dlckluc3Quc3RvcCgpXG4gICAgICAgIH1cbiAgICB9LFxuICAgICdkZWJ1Zy1jb250aW51ZSc6ICgpID0+IHtcbiAgICAgICAgaWYgKGRlYnVnZ2VySW5zdCkge1xuICAgICAgICAgICAgZGVidWdnZXJJbnN0LmNvbnRpbnVlKClcbiAgICAgICAgfVxuICAgIH0sXG4gICAgJ3RvZ2dsZS1icmVha3BvaW50JzogKCkgPT4ge1xuICAgICAgICBjb25zdCB0ZSA9IGF0b20ud29ya3NwYWNlLmdldEFjdGl2ZVRleHRFZGl0b3IoKVxuXG4gICAgICAgIGJyZWFrcG9pbnRVSS50b2dnbGVCcmVha3BvaW50KFxuICAgICAgICAgICAgdGUuZ2V0Q3Vyc29yQnVmZmVyUG9zaXRpb24oKS5yb3cgKyAxLFxuICAgICAgICAgICAgdGVcbiAgICAgICAgKVxuICAgIH0sXG4gICAgJ3NldC1icmVhay1vbi1leGNlcHRpb24nOiAoKSA9PiB7XG4gICAgICAgIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTogdmFyaWFibGUtbmFtZVxuICAgICAgICBjb25zdCBTZWxlY3REZWJ1Z01vZGVWaWV3ID0gcmVxdWlyZSgnLi92aWV3cy9TZWxlY3REZWJ1Z01vZGVWaWV3JylcbiAgICAgICAgY29uc3QgdmlldyA9IG5ldyBTZWxlY3REZWJ1Z01vZGVWaWV3KGRlYnVnTW9kZXMsIGF0b20uY29uZmlnLmdldCgnaGFza2VsbC1kZWJ1Zy5icmVha09uRXhjZXB0aW9uJykpXG5cbiAgICAgICAgY29uc3QgcGFuZWwgPSBhdG9tLndvcmtzcGFjZS5hZGRNb2RhbFBhbmVsKHtcbiAgICAgICAgICAgIGl0ZW06IHZpZXdcbiAgICAgICAgfSlcblxuICAgICAgICB2aWV3LmZvY3VzRmlsdGVyRWRpdG9yKClcblxuICAgICAgICB2aWV3LmVtaXR0ZXIub24oJ3NlbGVjdGVkJywgKGl0ZW06IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgYXRvbS5jb25maWcuc2V0KCdoYXNrZWxsLWRlYnVnLmJyZWFrT25FeGNlcHRpb24nLCBpdGVtKVxuICAgICAgICB9KVxuXG4gICAgICAgIHZpZXcuZW1pdHRlci5vbignY2FuY2VsZWQnLCAoKSA9PiB7XG4gICAgICAgICAgICBwYW5lbC5kZXN0cm95KClcbiAgICAgICAgfSlcbiAgICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBvbkZpcnN0UnVuICgpIHtcbiAgICBzdGF0ZSA9IHtcbiAgICAgICAgcHJvcGVybHlBY3RpdmF0ZWQ6IGZhbHNlXG4gICAgfVxuXG4gICAgLy8gZnJvbSBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzM0OTUzMTY4L25vZGUtY2hlY2stZXhpc3RlbmNlLW9mLWNvbW1hbmQtaW4tcGF0aFxuICAgIGNvbnN0IGlzV2luID0gb3MucGxhdGZvcm0oKS5pbmRleE9mKCd3aW4nKSA+IC0xXG4gICAgY29uc3Qgd2hlcmUgPSBpc1dpbiA/ICd3aGVyZScgOiAnd2hlcmVpcydcblxuICAgIGNvbnN0IG91dCA9IGNwLmV4ZWMod2hlcmUgKyAnIG5vZGUnKVxuXG4gICAgb3V0Lm9uKCdjbG9zZScsIChjb2RlKSA9PiB7XG4gICAgICAgIGlmIChjb2RlID09PSAxKSB7Ly8gbm90IGZvdW5kXG4gICAgICAgICAgICAvLyBmYWxsYmFjayB0byB0aGUgbm9kZSBpbiBhcG1cbiAgICAgICAgICAgIGF0b20uY29uZmlnLnNldCgnaGFza2VsbC1kZWJ1Zy5ub2RlQ29tbWFuZCcsIHBhdGgucmVzb2x2ZShhdG9tLnBhY2thZ2VzLmdldEFwbVBhdGgoKSwgJy4uLy4uL2Jpbi9hdG9tJykpXG4gICAgICAgICAgICBpZiAoc3RhdGUpIHsgc3RhdGUucHJvcGVybHlBY3RpdmF0ZWQgPSB0cnVlIH1cbiAgICAgICAgfVxuICAgIH0pXG59XG5cbmludGVyZmFjZSBIYXNrZWxsRGVidWdTdGF0ZSB7XG4gICAgcHJvcGVybHlBY3RpdmF0ZWQ6IGJvb2xlYW5cbn1cblxuZXhwb3J0IGxldCBzdGF0ZTogSGFza2VsbERlYnVnU3RhdGUgfCB1bmRlZmluZWRcblxuZXhwb3J0IGZ1bmN0aW9uIGFjdGl2YXRlIChfc3RhdGU/OiBIYXNrZWxsRGVidWdTdGF0ZSkge1xuICAgIHN0YXRlID0gX3N0YXRlXG5cbiAgICBpZiAoc3RhdGUgPT09IHVuZGVmaW5lZCB8fCBzdGF0ZS5wcm9wZXJseUFjdGl2YXRlZCAhPT0gdHJ1ZSkge1xuICAgICAgICBvbkZpcnN0UnVuKClcbiAgICB9XG4gICAgYXRvbS53b3Jrc3BhY2Uub2JzZXJ2ZUFjdGl2ZVBhbmVJdGVtKChwYW5lKSA9PiB7XG4gICAgICAgIGlmIChhdG9tLndvcmtzcGFjZS5pc1RleHRFZGl0b3IocGFuZSkpIHtcbiAgICAgICAgICAgIGNvbnN0IHRlOiBBdG9tQ29yZS5JRWRpdG9yICYgeyBoYXNIYXNrZWxsQnJlYWtwb2ludHM/OiBib29sZWFuIH0gPSBwYW5lXG4gICAgICAgICAgICBjb25zdCBzY29wZXMgPSB0ZS5nZXRSb290U2NvcGVEZXNjcmlwdG9yKCkuc2NvcGVzXG4gICAgICAgICAgICBpZiAoc2NvcGVzLmxlbmd0aCA9PT0gMSAmJiBzY29wZXNbMF0gPT09ICdzb3VyY2UuaGFza2VsbCcpIHtcbiAgICAgICAgICAgICAgICBpZiAoIXRlLmhhc0hhc2tlbGxCcmVha3BvaW50cykge1xuICAgICAgICAgICAgICAgICAgICBicmVha3BvaW50VUkuYXR0YWNoVG9OZXdUZXh0RWRpdG9yKHRlKVxuICAgICAgICAgICAgICAgICAgICB0ZS5oYXNIYXNrZWxsQnJlYWtwb2ludHMgPSB0cnVlXG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKGRlYnVnZ2VySW5zdCkge1xuICAgICAgICAgICAgICAgICAgICBkZWJ1Z2dlckluc3Quc2hvd1BhbmVscygpXG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuICAvLyBkb24ndCBkbyBiZWxvd1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gaWYgYW55IHBhbmUgdGhhdCBpc24ndCBhIGhhc2tlbGwgc291cmNlIGZpbGUgYW5kIHdlJ3JlIGRlYnVnZ2luZ1xuICAgICAgICBpZiAoZGVidWdnZXJJbnN0KSB7XG4gICAgICAgICAgICBkZWJ1Z2dlckluc3QuaGlkZVBhbmVscygpXG4gICAgICAgIH1cbiAgICB9KVxuXG4gICAgZm9yIChjb25zdCBjb21tYW5kIG9mIE9iamVjdC5rZXlzKGNvbW1hbmRzKSl7XG4gICAgICAgIGF0b20uY29tbWFuZHMuYWRkKFwiYXRvbS10ZXh0LWVkaXRvcltkYXRhLWdyYW1tYXI9J3NvdXJjZSBoYXNrZWxsJ11cIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgJ2hhc2tlbGw6JyArIGNvbW1hbmQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGNvbW1hbmRzW2NvbW1hbmRdKVxuICAgIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNlcmlhbGl6ZSAoKSB7XG4gICAgcmV0dXJuIHN0YXRlXG59XG5cbmV4cG9ydCBsZXQgZGVidWdNb2RlcyA9IFtcbiAgICB7dmFsdWU6ICdub25lJywgZGVzY3JpcHRpb246ICdEb25cXCd0IHBhdXNlIG9uIGFueSBleGNlcHRpb25zJ30sXG4gICAge3ZhbHVlOiAnZXJyb3JzJywgZGVzY3JpcHRpb246ICdQYXVzZSBvbiBlcnJvcnMgKHVuY2F1Z2h0IGV4Y2VwdGlvbnMpJ30sXG4gICAge3ZhbHVlOiAnZXhjZXB0aW9ucycsIGRlc2NyaXB0aW9uOiAnUGF1c2Ugb24gZXhjZXB0aW9ucyd9LFxuXVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0VGVybWluYWxDb21tYW5kICgpIHtcbiAgICBpZiAob3MudHlwZSgpID09PSAnV2luZG93c19OVCcpIHtcbiAgICAgICAgcmV0dXJuICdzdGFydCAlcydcbiAgICB9IGVsc2UgaWYgKG9zLnR5cGUoKSA9PT0gJ0xpbnV4Jykge1xuICAgICAgICByZXR1cm4gYHgtdGVybWluYWwtZW11bGF0b3IgLWUgXCJiYXNoIC1jIFxcXFxcIiVzXFxcXFwiXCJgXG4gICAgfSBlbHNlIGlmIChvcy50eXBlKCkgPT09ICdEYXJ3aW4nKSB7XG4gICAgICAgIHJldHVybiBgb3Nhc2NyaXB0IC1lICd0ZWxsIGFwcCBcIlRlcm1pbmFsXCIgdG8gZG8gc2NyaXB0IFwiJXNcIidgXG4gICAgfSBlbHNlIHtcbiAgICAgICAgLy8gbm90IHJlY29nbmlzZWQsIGhvcGUgeHRlcm0gd29ya3NcbiAgICAgICAgcmV0dXJuIGB4dGVybSAtZSBcImJhc2ggLWMgXFxcXFwiJXNcXFxcXCJcImBcbiAgICB9XG59XG5cbmV4cG9ydCBsZXQgY29uZmlnID0ge1xuICAgIHVzZUlkZUhhc2tlbGxDYWJhbEJ1aWxkZXI6IHtcbiAgICAgICAgdGl0bGU6ICdVc2UgaWRlLWhhc2tlbGwtY2FiYWwgYnVpbGRlcicsXG4gICAgICAgIGRlc2NyaXB0aW9uOiBcIlVzZSB0aGUgaWRlLWhhc2tlbGwtY2FiYWwgYnVpbGRlcidzIGNvbW1hbmQgd2hlbiBydW5uaW5nIGdoY2kgLSBcIiArXG4gICAgICAgICAgICAnd2lsbCBydW4gYHN0YWNrIGdoY2lgIHdoZW4gc3RhY2sgaXMgdGhlIGJ1aWxkZXIsIGBjYWJhbCByZXBsYCBmb3IgY2FiYWwgYW5kICcgK1xuICAgICAgICAgICAgJ2BnaGNpYCBmb3Igbm9uZScsXG4gICAgICAgIGRlZmF1bHQ6IHRydWUsXG4gICAgICAgIHR5cGU6ICdib29sZWFuJyxcbiAgICAgICAgb3JkZXI6IDBcbiAgICB9LFxuICAgIEdIQ0lDb21tYW5kOiB7XG4gICAgICAgIHRpdGxlOiAnR0hDSSBDb21tYW5kJyxcbiAgICAgICAgZGVzY3JpcHRpb246ICdUaGUgY29tbWFuZCB0byBydW4gdG8gZXhlY3V0ZSBgZ2hjaWAsIHRoaXMgd2lsbCBnZXQgaWdub3JlIGlmIHRoZScgK1xuICAgICAgICAgICAgJyBwcmV2aW91cyBzZXR0aW5nIGlzIHNldCB0byB0cnVlJyxcbiAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgIGRlZmF1bHQ6ICdnaGNpJyxcbiAgICAgICAgb3JkZXI6IDFcbiAgICB9LFxuICAgIEdIQ0lBcmd1bWVudHM6IHtcbiAgICAgICAgdGl0bGU6ICdHSENJIEFyZ3VtZW50cycsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnQXJndW1lbnRzIHRvIGdpdmUgdG8gYGdoY2lgLCBzZXBhcmF0ZWQgYnkgYSBzcGFjZScsXG4gICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICBkZWZhdWx0OiAnJyxcbiAgICAgICAgb3JkZXI6IDJcbiAgICB9LFxuICAgIG5vZGVDb21tYW5kOiB7XG4gICAgICAgIGRlc2NyaXB0aW9uOiAnVGhlIGNvbW1hbmQgdG8gcnVuIHRvIGV4ZWN1dGUgbm9kZS5qcycsXG4gICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICBkZWZhdWx0OiAnbm9kZScsXG4gICAgICAgIG9yZGVyOiAzXG4gICAgfSxcbiAgICB0ZXJtaW5hbENvbW1hbmQ6IHtcbiAgICAgICAgZGVzY3JpcHRpb246ICdUaGUgY29tbWFuZCB0byBydW4gdG8gbGF1bmNoIGEgdGVybWluYWwsIHdoZXJlIHRoZSBjb21tYW5kIGxhdW5jaGVkIGluIHRoZSB0ZXJtaW5hbCBpcyBgJXNgLicsXG4gICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICBkZWZhdWx0OiBnZXRUZXJtaW5hbENvbW1hbmQoKSxcbiAgICAgICAgb3JkZXI6IDRcbiAgICB9LFxuICAgIGNsaWNrR3V0dGVyVG9Ub2dnbGVCcmVha3BvaW50OiB7XG4gICAgICAgIHR5cGU6ICdib29sZWFuJyxcbiAgICAgICAgZGVzY3JpcHRpb246ICdJbnNlcnQgYSBicmVha3BvaW50IHdoZW4gdGhlIGd1dHRlciBpcyBjbGlja2VkIGluIGEgaGFza2VsbCBzb3VyY2UgZmlsZScsXG4gICAgICAgIGRlZmF1bHQ6IHRydWUsXG4gICAgICAgIG9yZGVyOiA1XG4gICAgfSxcbiAgICBzaG93VGVybWluYWw6IHtcbiAgICAgICAgdHlwZTogJ2Jvb2xlYW4nLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ1Nob3cgYSB0ZXJtaW5hbCB3aXRoIGBnaGNpYCBydW5uaW5nIHdoZW4gZGVidWdnaW5nJyxcbiAgICAgICAgZGVmYXVsdDogdHJ1ZSxcbiAgICAgICAgb3JkZXI6IDZcbiAgICB9LFxuICAgIGZ1bmN0aW9uVG9EZWJ1Zzoge1xuICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgZGVzY3JpcHRpb246ICdUaGUgZnVuY3Rpb24gdG8gcnVuIHdoZW4gZGVidWdnaW5nJyxcbiAgICAgICAgZGVmYXVsdDogJ21haW4nLFxuICAgICAgICBvcmRlcjogN1xuICAgIH0sXG4gICAgYnJlYWtPbkV4Y2VwdGlvbjoge1xuICAgICAgICBkZXNjcmlwdGlvbjogYFdoZXRoZXIgdG8gYnJlYWsgb24gZXhjZXB0aW9ucywgZXJyb3JzIG9yIG5laXRoZXIuXG4gICAgICAgICAgICBOb3RlOiBicmVha2luZyBvbiBleGNlcHRpb24gbWF5IGNhdXNlIHRoZSBkZWJ1Z2dlciB0byBmcmVlemUgaW4gc29tZSBpbnN0YW5jZXMuXG4gICAgICAgICAgICBTZWUgWyMzXShodHRwczovL2dpdGh1Yi5jb20vVGhvbWFzSGlja21hbi9oYXNrZWxsLWRlYnVnL2lzc3Vlcy8zKWAsXG4gICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICBkZWZhdWx0OiAnbm9uZScsXG4gICAgICAgIGVudW06IGRlYnVnTW9kZXMsXG4gICAgICAgIG9yZGVyOiA4XG4gICAgfVxufVxuXG5sZXQgdXBpOiBoYXNrZWxsSWRlLkhhc2tlbGxVUElcblxuZXhwb3J0IGZ1bmN0aW9uIGNvbnN1bWVIYXNrZWxsVXBpICh1cGlDb250YWluZXI6IGhhc2tlbGxJZGUuSGFza2VsbFVQSUNvbnRhaW5lcikge1xuICAgIGNvbnN0IHBsdWdpbkRpc3Bvc2FibGUgPSBuZXcgYXRvbUFQSS5Db21wb3NpdGVEaXNwb3NhYmxlKClcbiAgICBjb25zdCBfdXBpID0gdXBpQ29udGFpbmVyLnJlZ2lzdGVyUGx1Z2luKHBsdWdpbkRpc3Bvc2FibGUsICdoYXNrZWxsLWRlYnVnJylcbiAgICB0b29sdGlwT3ZlcnJpZGUuY29uc3VtZUhhc2tlbGxVcGkoX3VwaSlcbiAgICB1cGkgPSBfdXBpXG59XG4iXX0=