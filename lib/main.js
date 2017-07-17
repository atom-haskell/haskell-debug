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
const os = require("os");
const path = require("path");
const cp = require("child_process");
exports.breakpointUI = new BreakpointUI();
exports.tooltipOverride = new TooltipOverride((expression) => __awaiter(this, void 0, void 0, function* () {
    if (exports.debuggerInst === undefined) {
        return;
    }
    return exports.debuggerInst.resolveExpression(expression);
}));
exports.settings = {
    breakOnError: true
};
exports.commands = {
    'debug': () => {
        const Debugger = require('./Debugger');
        upi.getOthersConfigParam('ide-haskell-cabal', 'builder').then((ob) => {
            exports.debuggerInst = new Debugger(exports.breakpointUI.breakpoints, ob['name']);
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
    'set-break-on-exception': () => __awaiter(this, void 0, void 0, function* () {
        const selectDebugModeView = require('./views/SelectDebugModeView');
        const result = yield selectDebugModeView(exports.debugModes, atom.config.get('haskell-debug.breakOnException'));
        if (result !== undefined) {
            atom.config.set('haskell-debug.breakOnException', result);
        }
    })
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
function consumeHaskellUpi(reg) {
    upi = reg({
        name: 'haskell-debug',
        tooltip: {
            priority: 100,
            handler: exports.tooltipOverride.tooltipHandler.bind(exports.tooltipOverride)
        }
    });
    return upi;
}
exports.consumeHaskellUpi = consumeHaskellUpi;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9saWIvbWFpbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O0FBQ0EsK0NBQStDO0FBQy9DLHFEQUFxRDtBQUVyRCx5QkFBeUI7QUFDekIsNkJBQTZCO0FBQzdCLG9DQUFvQztBQUV6QixRQUFBLFlBQVksR0FBRyxJQUFJLFlBQVksRUFBRSxDQUFBO0FBRWpDLFFBQUEsZUFBZSxHQUFHLElBQUksZUFBZSxDQUFDLENBQU8sVUFBVTtJQUM5RCxFQUFFLENBQUMsQ0FBQyxvQkFBWSxLQUFLLFNBQVMsQ0FBQyxDQUFDLENBQUM7UUFBQyxNQUFNLENBQUE7SUFBQyxDQUFDO0lBQzFDLE1BQU0sQ0FBQyxvQkFBWSxDQUFDLGlCQUFpQixDQUFDLFVBQVUsQ0FBQyxDQUFBO0FBQ3JELENBQUMsQ0FBQSxDQUFDLENBQUE7QUFFUyxRQUFBLFFBQVEsR0FBRztJQUNsQixZQUFZLEVBQUUsSUFBSTtDQUNyQixDQUFBO0FBRVUsUUFBQSxRQUFRLEdBQUc7SUFDbEIsT0FBTyxFQUFFO1FBRUwsTUFBTSxRQUFRLEdBQUcsT0FBTyxDQUFDLFlBQVksQ0FBQyxDQUFBO1FBRXRDLEdBQUcsQ0FBQyxvQkFBb0IsQ0FBQyxtQkFBbUIsRUFBRSxTQUFTLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFO1lBQzdELG9CQUFZLEdBQUcsSUFBSSxRQUFRLENBQUMsb0JBQVksQ0FBQyxXQUFXLEVBQUUsRUFBRSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUE7UUFDckUsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDO1lBQ0wsb0JBQVksR0FBRyxJQUFJLFFBQVEsQ0FBQyxvQkFBWSxDQUFDLFdBQVcsQ0FBQyxDQUFBO1FBQ3pELENBQUMsQ0FBQyxDQUFBO0lBQ04sQ0FBQztJQUNELFlBQVksRUFBRTtRQUNWLEVBQUUsQ0FBQyxDQUFDLG9CQUFZLENBQUMsQ0FBQyxDQUFDO1lBQ2Ysb0JBQVksQ0FB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O1FBQ3JCLE9BQU8sRUFBRTtZQUNQLFFBQVEsRUFBRSxHQUFHO1lBQ2IsT0FBTyxFQUFFLHVCQUFlLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyx1QkFBZSxDQUFDO1NBQzlEO0tBQ0YsQ0FBQyxDQUFBO0lBQ0YsTUFBTSxDQUFDLEdBQUcsQ0FBQTtBQUNkLENBQUM7QUFURCw4Q0FTQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBEZWJ1Z2dlciA9IHJlcXVpcmUoJy4vRGVidWdnZXInKVxuaW1wb3J0IEJyZWFrcG9pbnRVSSA9IHJlcXVpcmUoJy4vQnJlYWtwb2ludFVJJylcbmltcG9ydCBUb29sdGlwT3ZlcnJpZGUgPSByZXF1aXJlKCcuL1Rvb2x0aXBPdmVycmlkZScpXG5pbXBvcnQgYXRvbUFQSSA9IHJlcXVpcmUoJ2F0b20nKVxuaW1wb3J0IG9zID0gcmVxdWlyZSgnb3MnKVxuaW1wb3J0IHBhdGggPSByZXF1aXJlKCdwYXRoJylcbmltcG9ydCBjcCA9IHJlcXVpcmUoJ2NoaWxkX3Byb2Nlc3MnKVxuXG5leHBvcnQgbGV0IGJyZWFrcG9pbnRVSSA9IG5ldyBCcmVha3BvaW50VUkoKVxuZXhwb3J0IGxldCBkZWJ1Z2dlckluc3Q6IERlYnVnZ2VyIHwgdW5kZWZpbmVkXG5leHBvcnQgbGV0IHRvb2x0aXBPdmVycmlkZSA9IG5ldyBUb29sdGlwT3ZlcnJpZGUoYXN5bmMgKGV4cHJlc3Npb24pID0+IHtcbiAgICBpZiAoZGVidWdnZXJJbnN0ID09PSB1bmRlZmluZWQpIHsgcmV0dXJuIH1cbiAgICByZXR1cm4gZGVidWdnZXJJbnN0LnJlc29sdmVFeHByZXNzaW9uKGV4cHJlc3Npb24pXG59KVxuXG5leHBvcnQgbGV0IHNldHRpbmdzID0ge1xuICAgIGJyZWFrT25FcnJvcjogdHJ1ZVxufVxuXG5leHBvcnQgbGV0IGNvbW1hbmRzID0ge1xuICAgICdkZWJ1Zyc6ICgpID0+IHtcbiAgICAgICAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOiB2YXJpYWJsZS1uYW1lXG4gICAgICAgIGNvbnN0IERlYnVnZ2VyID0gcmVxdWlyZSgnLi9EZWJ1Z2dlcicpXG5cbiAgICAgICAgdXBpLmdldE90aGVyc0NvbmZpZ1BhcmFtKCdpZGUtaGFza2VsbC1jYWJhbCcsICdidWlsZGVyJykudGhlbigob2IpID0+IHtcbiAgICAgICAgICAgIGRlYnVnZ2VySW5zdCA9IG5ldyBEZWJ1Z2dlcihicmVha3BvaW50VUkuYnJlYWtwb2ludHMsIG9iWyduYW1lJ10pXG4gICAgICAgIH0pLmNhdGNoKCgpID0+IHtcbiAgICAgICAgICAgIGRlYnVnZ2VySW5zdCA9IG5ldyBEZWJ1Z2dlcihicmVha3BvaW50VUkuYnJlYWtwb2ludHMpXG4gICAgICAgIH0pXG4gICAgfSxcbiAgICAnZGVidWctYmFjayc6ICgpID0+IHtcbiAgICAgICAgaWYgKGRlYnVnZ2VySW5zdCkge1xuICAgICAgICAgICAgZGVidWdnZXJJbnN0LmJhY2soKVxuICAgICAgICB9XG4gICAgfSxcbiAgICAnZGVidWctZm9yd2FyZCc6ICgpID0+IHtcbiAgICAgICAgaWYgKGRlYnVnZ2VySW5zdCkge1xuICAgICAgICAgICAgZGVidWdnZXJJbnN0LmZvcndhcmQoKVxuICAgICAgICB9XG4gICAgfSxcbiAgICAnZGVidWctc3RlcCc6ICgpID0+IHtcbiAgICAgICAgaWYgKGRlYnVnZ2VySW5zdCkge1xuICAgICAgICAgICAgZGVidWdnZXJJbnN0LnN0ZXAoKVxuICAgICAgICB9XG4gICAgfSxcbiAgICAnZGVidWctc3RvcCc6ICgpID0+IHtcbiAgICAgICAgaWYgKGRlYnVnZ2VySW5zdCkge1xuICAgICAgICAgICAgZGVidWdnZXJJbnN0LnN0b3AoKVxuICAgICAgICB9XG4gICAgfSxcbiAgICAnZGVidWctY29udGludWUnOiAoKSA9PiB7XG4gICAgICAgIGlmIChkZWJ1Z2dlckluc3QpIHtcbiAgICAgICAgICAgIGRlYnVnZ2VySW5zdC5jb250aW51ZSgpXG4gICAgICAgIH1cbiAgICB9LFxuICAgICd0b2dnbGUtYnJlYWtwb2ludCc6ICgpID0+IHtcbiAgICAgICAgY29uc3QgdGUgPSBhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVUZXh0RWRpdG9yKClcblxuICAgICAgICBicmVha3BvaW50VUkudG9nZ2xlQnJlYWtwb2ludChcbiAgICAgICAgICAgIHRlLmdldEN1cnNvckJ1ZmZlclBvc2l0aW9uKCkucm93ICsgMSxcbiAgICAgICAgICAgIHRlXG4gICAgICAgIClcbiAgICB9LFxuICAgICdzZXQtYnJlYWstb24tZXhjZXB0aW9uJzogYXN5bmMgKCkgPT4ge1xuICAgICAgICBjb25zdCBzZWxlY3REZWJ1Z01vZGVWaWV3ID0gcmVxdWlyZSgnLi92aWV3cy9TZWxlY3REZWJ1Z01vZGVWaWV3JylcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgc2VsZWN0RGVidWdNb2RlVmlldyhkZWJ1Z01vZGVzLCBhdG9tLmNvbmZpZy5nZXQoJ2hhc2tlbGwtZGVidWcuYnJlYWtPbkV4Y2VwdGlvbicpKVxuICAgICAgICBpZiAocmVzdWx0ICE9PSB1bmRlZmluZWQpIHsgYXRvbS5jb25maWcuc2V0KCdoYXNrZWxsLWRlYnVnLmJyZWFrT25FeGNlcHRpb24nLCByZXN1bHQpIH1cbiAgICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBvbkZpcnN0UnVuICgpIHtcbiAgICBzdGF0ZSA9IHtcbiAgICAgICAgcHJvcGVybHlBY3RpdmF0ZWQ6IGZhbHNlXG4gICAgfVxuXG4gICAgLy8gZnJvbSBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzM0OTUzMTY4L25vZGUtY2hlY2stZXhpc3RlbmNlLW9mLWNvbW1hbmQtaW4tcGF0aFxuICAgIGNvbnN0IGlzV2luID0gb3MucGxhdGZvcm0oKS5pbmRleE9mKCd3aW4nKSA+IC0xXG4gICAgY29uc3Qgd2hlcmUgPSBpc1dpbiA/ICd3aGVyZScgOiAnd2hlcmVpcydcblxuICAgIGNvbnN0IG91dCA9IGNwLmV4ZWMod2hlcmUgKyAnIG5vZGUnKVxuXG4gICAgb3V0Lm9uKCdjbG9zZScsIChjb2RlKSA9PiB7XG4gICAgICAgIGlmIChjb2RlID09PSAxKSB7Ly8gbm90IGZvdW5kXG4gICAgICAgICAgICAvLyBmYWxsYmFjayB0byB0aGUgbm9kZSBpbiBhcG1cbiAgICAgICAgICAgIGF0b20uY29uZmlnLnNldCgnaGFza2VsbC1kZWJ1Zy5ub2RlQ29tbWFuZCcsIHBhdGgucmVzb2x2ZShhdG9tLnBhY2thZ2VzLmdldEFwbVBhdGgoKSwgJy4uLy4uL2Jpbi9hdG9tJykpXG4gICAgICAgICAgICBpZiAoc3RhdGUpIHsgc3RhdGUucHJvcGVybHlBY3RpdmF0ZWQgPSB0cnVlIH1cbiAgICAgICAgfVxuICAgIH0pXG59XG5cbmludGVyZmFjZSBIYXNrZWxsRGVidWdTdGF0ZSB7XG4gICAgcHJvcGVybHlBY3RpdmF0ZWQ6IGJvb2xlYW5cbn1cblxuZXhwb3J0IGxldCBzdGF0ZTogSGFza2VsbERlYnVnU3RhdGUgfCB1bmRlZmluZWRcblxuZXhwb3J0IGZ1bmN0aW9uIGFjdGl2YXRlIChfc3RhdGU/OiBIYXNrZWxsRGVidWdTdGF0ZSkge1xuICAgIHN0YXRlID0gX3N0YXRlXG5cbiAgICBpZiAoc3RhdGUgPT09IHVuZGVmaW5lZCB8fCBzdGF0ZS5wcm9wZXJseUFjdGl2YXRlZCAhPT0gdHJ1ZSkge1xuICAgICAgICBvbkZpcnN0UnVuKClcbiAgICB9XG4gICAgYXRvbS53b3Jrc3BhY2Uub2JzZXJ2ZUFjdGl2ZVBhbmVJdGVtKChwYW5lKSA9PiB7XG4gICAgICAgIGlmIChhdG9tLndvcmtzcGFjZS5pc1RleHRFZGl0b3IocGFuZSkpIHtcbiAgICAgICAgICAgIGNvbnN0IHRlOiBhdG9tQVBJLlRleHRFZGl0b3IgJiB7IGhhc0hhc2tlbGxCcmVha3BvaW50cz86IGJvb2xlYW4gfSA9IHBhbmVcbiAgICAgICAgICAgIGNvbnN0IHNjb3BlcyA9IHRlLmdldFJvb3RTY29wZURlc2NyaXB0b3IoKS5nZXRTY29wZXNBcnJheSgpXG4gICAgICAgICAgICBpZiAoc2NvcGVzLmxlbmd0aCA9PT0gMSAmJiBzY29wZXNbMF0gPT09ICdzb3VyY2UuaGFza2VsbCcpIHtcbiAgICAgICAgICAgICAgICBpZiAoIXRlLmhhc0hhc2tlbGxCcmVha3BvaW50cykge1xuICAgICAgICAgICAgICAgICAgICBicmVha3BvaW50VUkuYXR0YWNoVG9OZXdUZXh0RWRpdG9yKHRlKVxuICAgICAgICAgICAgICAgICAgICB0ZS5oYXNIYXNrZWxsQnJlYWtwb2ludHMgPSB0cnVlXG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKGRlYnVnZ2VySW5zdCkge1xuICAgICAgICAgICAgICAgICAgICBkZWJ1Z2dlckluc3Quc2hvd1BhbmVscygpXG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuICAvLyBkb24ndCBkbyBiZWxvd1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gaWYgYW55IHBhbmUgdGhhdCBpc24ndCBhIGhhc2tlbGwgc291cmNlIGZpbGUgYW5kIHdlJ3JlIGRlYnVnZ2luZ1xuICAgICAgICBpZiAoZGVidWdnZXJJbnN0KSB7XG4gICAgICAgICAgICBkZWJ1Z2dlckluc3QuaGlkZVBhbmVscygpXG4gICAgICAgIH1cbiAgICB9KVxuXG4gICAgZm9yIChjb25zdCBjb21tYW5kIG9mIE9iamVjdC5rZXlzKGNvbW1hbmRzKSl7XG4gICAgICAgIGF0b20uY29tbWFuZHMuYWRkKFwiYXRvbS10ZXh0LWVkaXRvcltkYXRhLWdyYW1tYXI9J3NvdXJjZSBoYXNrZWxsJ11cIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgJ2hhc2tlbGw6JyArIGNvbW1hbmQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGNvbW1hbmRzW2NvbW1hbmRdKVxuICAgIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNlcmlhbGl6ZSAoKSB7XG4gICAgcmV0dXJuIHN0YXRlXG59XG5cbmV4cG9ydCBsZXQgZGVidWdNb2RlcyA9IFtcbiAgICB7dmFsdWU6ICdub25lJywgZGVzY3JpcHRpb246ICdEb25cXCd0IHBhdXNlIG9uIGFueSBleGNlcHRpb25zJ30sXG4gICAge3ZhbHVlOiAnZXJyb3JzJywgZGVzY3JpcHRpb246ICdQYXVzZSBvbiBlcnJvcnMgKHVuY2F1Z2h0IGV4Y2VwdGlvbnMpJ30sXG4gICAge3ZhbHVlOiAnZXhjZXB0aW9ucycsIGRlc2NyaXB0aW9uOiAnUGF1c2Ugb24gZXhjZXB0aW9ucyd9LFxuXVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0VGVybWluYWxDb21tYW5kICgpIHtcbiAgICBpZiAob3MudHlwZSgpID09PSAnV2luZG93c19OVCcpIHtcbiAgICAgICAgcmV0dXJuICdzdGFydCAlcydcbiAgICB9IGVsc2UgaWYgKG9zLnR5cGUoKSA9PT0gJ0xpbnV4Jykge1xuICAgICAgICByZXR1cm4gYHgtdGVybWluYWwtZW11bGF0b3IgLWUgXCJiYXNoIC1jIFxcXFxcIiVzXFxcXFwiXCJgXG4gICAgfSBlbHNlIGlmIChvcy50eXBlKCkgPT09ICdEYXJ3aW4nKSB7XG4gICAgICAgIHJldHVybiBgb3Nhc2NyaXB0IC1lICd0ZWxsIGFwcCBcIlRlcm1pbmFsXCIgdG8gZG8gc2NyaXB0IFwiJXNcIidgXG4gICAgfSBlbHNlIHtcbiAgICAgICAgLy8gbm90IHJlY29nbmlzZWQsIGhvcGUgeHRlcm0gd29ya3NcbiAgICAgICAgcmV0dXJuIGB4dGVybSAtZSBcImJhc2ggLWMgXFxcXFwiJXNcXFxcXCJcImBcbiAgICB9XG59XG5cbmV4cG9ydCBsZXQgY29uZmlnID0ge1xuICAgIHVzZUlkZUhhc2tlbGxDYWJhbEJ1aWxkZXI6IHtcbiAgICAgICAgdGl0bGU6ICdVc2UgaWRlLWhhc2tlbGwtY2FiYWwgYnVpbGRlcicsXG4gICAgICAgIGRlc2NyaXB0aW9uOiBcIlVzZSB0aGUgaWRlLWhhc2tlbGwtY2FiYWwgYnVpbGRlcidzIGNvbW1hbmQgd2hlbiBydW5uaW5nIGdoY2kgLSBcIiArXG4gICAgICAgICAgICAnd2lsbCBydW4gYHN0YWNrIGdoY2lgIHdoZW4gc3RhY2sgaXMgdGhlIGJ1aWxkZXIsIGBjYWJhbCByZXBsYCBmb3IgY2FiYWwgYW5kICcgK1xuICAgICAgICAgICAgJ2BnaGNpYCBmb3Igbm9uZScsXG4gICAgICAgIGRlZmF1bHQ6IHRydWUsXG4gICAgICAgIHR5cGU6ICdib29sZWFuJyxcbiAgICAgICAgb3JkZXI6IDBcbiAgICB9LFxuICAgIEdIQ0lDb21tYW5kOiB7XG4gICAgICAgIHRpdGxlOiAnR0hDSSBDb21tYW5kJyxcbiAgICAgICAgZGVzY3JpcHRpb246ICdUaGUgY29tbWFuZCB0byBydW4gdG8gZXhlY3V0ZSBgZ2hjaWAsIHRoaXMgd2lsbCBnZXQgaWdub3JlIGlmIHRoZScgK1xuICAgICAgICAgICAgJyBwcmV2aW91cyBzZXR0aW5nIGlzIHNldCB0byB0cnVlJyxcbiAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgIGRlZmF1bHQ6ICdnaGNpJyxcbiAgICAgICAgb3JkZXI6IDFcbiAgICB9LFxuICAgIEdIQ0lBcmd1bWVudHM6IHtcbiAgICAgICAgdGl0bGU6ICdHSENJIEFyZ3VtZW50cycsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnQXJndW1lbnRzIHRvIGdpdmUgdG8gYGdoY2lgLCBzZXBhcmF0ZWQgYnkgYSBzcGFjZScsXG4gICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICBkZWZhdWx0OiAnJyxcbiAgICAgICAgb3JkZXI6IDJcbiAgICB9LFxuICAgIG5vZGVDb21tYW5kOiB7XG4gICAgICAgIGRlc2NyaXB0aW9uOiAnVGhlIGNvbW1hbmQgdG8gcnVuIHRvIGV4ZWN1dGUgbm9kZS5qcycsXG4gICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICBkZWZhdWx0OiAnbm9kZScsXG4gICAgICAgIG9yZGVyOiAzXG4gICAgfSxcbiAgICB0ZXJtaW5hbENvbW1hbmQ6IHtcbiAgICAgICAgZGVzY3JpcHRpb246ICdUaGUgY29tbWFuZCB0byBydW4gdG8gbGF1bmNoIGEgdGVybWluYWwsIHdoZXJlIHRoZSBjb21tYW5kIGxhdW5jaGVkIGluIHRoZSB0ZXJtaW5hbCBpcyBgJXNgLicsXG4gICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICBkZWZhdWx0OiBnZXRUZXJtaW5hbENvbW1hbmQoKSxcbiAgICAgICAgb3JkZXI6IDRcbiAgICB9LFxuICAgIGNsaWNrR3V0dGVyVG9Ub2dnbGVCcmVha3BvaW50OiB7XG4gICAgICAgIHR5cGU6ICdib29sZWFuJyxcbiAgICAgICAgZGVzY3JpcHRpb246ICdJbnNlcnQgYSBicmVha3BvaW50IHdoZW4gdGhlIGd1dHRlciBpcyBjbGlja2VkIGluIGEgaGFza2VsbCBzb3VyY2UgZmlsZScsXG4gICAgICAgIGRlZmF1bHQ6IHRydWUsXG4gICAgICAgIG9yZGVyOiA1XG4gICAgfSxcbiAgICBzaG93VGVybWluYWw6IHtcbiAgICAgICAgdHlwZTogJ2Jvb2xlYW4nLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ1Nob3cgYSB0ZXJtaW5hbCB3aXRoIGBnaGNpYCBydW5uaW5nIHdoZW4gZGVidWdnaW5nJyxcbiAgICAgICAgZGVmYXVsdDogdHJ1ZSxcbiAgICAgICAgb3JkZXI6IDZcbiAgICB9LFxuICAgIGZ1bmN0aW9uVG9EZWJ1Zzoge1xuICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgZGVzY3JpcHRpb246ICdUaGUgZnVuY3Rpb24gdG8gcnVuIHdoZW4gZGVidWdnaW5nJyxcbiAgICAgICAgZGVmYXVsdDogJ21haW4nLFxuICAgICAgICBvcmRlcjogN1xuICAgIH0sXG4gICAgYnJlYWtPbkV4Y2VwdGlvbjoge1xuICAgICAgICBkZXNjcmlwdGlvbjogYFdoZXRoZXIgdG8gYnJlYWsgb24gZXhjZXB0aW9ucywgZXJyb3JzIG9yIG5laXRoZXIuXG4gICAgICAgICAgICBOb3RlOiBicmVha2luZyBvbiBleGNlcHRpb24gbWF5IGNhdXNlIHRoZSBkZWJ1Z2dlciB0byBmcmVlemUgaW4gc29tZSBpbnN0YW5jZXMuXG4gICAgICAgICAgICBTZWUgWyMzXShodHRwczovL2dpdGh1Yi5jb20vVGhvbWFzSGlja21hbi9oYXNrZWxsLWRlYnVnL2lzc3Vlcy8zKWAsXG4gICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICBkZWZhdWx0OiAnbm9uZScsXG4gICAgICAgIGVudW06IGRlYnVnTW9kZXMsXG4gICAgICAgIG9yZGVyOiA4XG4gICAgfVxufVxuXG5sZXQgdXBpOiBVUEkuSVVQSUluc3RhbmNlXG5cbmV4cG9ydCBmdW5jdGlvbiBjb25zdW1lSGFza2VsbFVwaSAocmVnOiBVUEkuSVVQSVJlZ2lzdHJhdGlvbikge1xuICAgIHVwaSA9IHJlZyh7XG4gICAgICBuYW1lOiAnaGFza2VsbC1kZWJ1ZycsXG4gICAgICB0b29sdGlwOiB7XG4gICAgICAgIHByaW9yaXR5OiAxMDAsXG4gICAgICAgIGhhbmRsZXI6IHRvb2x0aXBPdmVycmlkZS50b29sdGlwSGFuZGxlci5iaW5kKHRvb2x0aXBPdmVycmlkZSlcbiAgICAgIH1cbiAgICB9KVxuICAgIHJldHVybiB1cGlcbn1cbiJdfQ==