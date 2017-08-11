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
const Debugger = require("./Debugger");
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
    'debug': ({ currentTarget }) => __awaiter(this, void 0, void 0, function* () {
        const ob = yield upi.getOthersConfigParam('ide-haskell-cabal', 'builder');
        if (ob) {
            exports.debuggerInst = new Debugger(exports.breakpointUI.breakpoints, currentTarget.getModel(), ob.name);
        }
        else {
            exports.debuggerInst = new Debugger(exports.breakpointUI.breakpoints, currentTarget.getModel());
        }
    }),
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
    'toggle-breakpoint': ({ currentTarget }) => {
        exports.breakpointUI.toggleBreakpoint(currentTarget.getModel().getCursorBufferPosition().row + 1, currentTarget.getModel());
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9saWIvbWFpbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O0FBQUEsdUNBQXVDO0FBQ3ZDLCtDQUErQztBQUMvQyxxREFBcUQ7QUFFckQseUJBQXlCO0FBQ3pCLDZCQUE2QjtBQUM3QixvQ0FBb0M7QUFFekIsUUFBQSxZQUFZLEdBQUcsSUFBSSxZQUFZLEVBQUUsQ0FBQTtBQUVqQyxRQUFBLGVBQWUsR0FBRyxJQUFJLGVBQWUsQ0FBQyxDQUFPLFVBQVU7SUFDOUQsRUFBRSxDQUFDLENBQUMsb0JBQVksS0FBSyxTQUFTLENBQUMsQ0FBQyxDQUFDO1FBQUMsTUFBTSxDQUFBO0lBQUMsQ0FBQztJQUMxQyxNQUFNLENBQUMsb0JBQVksQ0FBQyxpQkFBaUIsQ0FBQyxVQUFVLENBQUMsQ0FBQTtBQUNyRCxDQUFDLENBQUEsQ0FBQyxDQUFBO0FBRVMsUUFBQSxRQUFRLEdBQUc7SUFDbEIsWUFBWSxFQUFFLElBQUk7Q0FDckIsQ0FBQTtBQU1VLFFBQUEsUUFBUSxHQUFHO0lBQ2xCLE9BQU8sRUFBRSxDQUFPLEVBQUMsYUFBYSxFQUFjO1FBQ3hDLE1BQU0sRUFBRSxHQUFHLE1BQU0sR0FBRyxDQUFDLG9CQUFvQixDQUFpQixtQkFBbUIsRUFBRSxTQUFTLENBQUMsQ0FBQTtRQUN6RixFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ1Asb0JBQVksR0FBRyxJQUFJLFFBQVEsQ0FBQyxvQkFBWSxDQUFDLFdBQVcsRUFBRSxhQUFhLENBQUMsUUFBUSxFQUFFLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFBO1FBQzFGLENBQUM7UUFBQyxJQUFJLENBQUMsQ0FBQztZQUNOLG9CQUFZLEdBQUcsSUFBSSxRQUFRLENBQUMsb0JBQVksQ0FBQyxXQUFXLEVBQUUsYUFBYSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUE7UUFDakYsQ0FBQztJQUNMLENBQUMsQ0FBQTtJ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RXpCLDJCQUFtQyxHQUF5QjtJQUN4RCxHQUFHLEdBQUcsR0FBRyxDQUFDO1FBQ1IsSUFBSSxFQUFFLGVBQWU7UUFDckIsT0FBTyxFQUFFO1lBQ1AsUUFBUSxFQUFFLEdBQUc7WUFDYixPQUFPLEVBQUUsdUJBQWUsQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLHVCQUFlLENBQUM7U0FDOUQ7S0FDRixDQUFDLENBQUE7SUFDRixNQUFNLENBQUMsR0FBRyxDQUFBO0FBQ2QsQ0FBQztBQVRELDhDQVNDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IERlYnVnZ2VyID0gcmVxdWlyZSgnLi9EZWJ1Z2dlcicpXG5pbXBvcnQgQnJlYWtwb2ludFVJID0gcmVxdWlyZSgnLi9CcmVha3BvaW50VUknKVxuaW1wb3J0IFRvb2x0aXBPdmVycmlkZSA9IHJlcXVpcmUoJy4vVG9vbHRpcE92ZXJyaWRlJylcbmltcG9ydCBhdG9tQVBJID0gcmVxdWlyZSgnYXRvbScpXG5pbXBvcnQgb3MgPSByZXF1aXJlKCdvcycpXG5pbXBvcnQgcGF0aCA9IHJlcXVpcmUoJ3BhdGgnKVxuaW1wb3J0IGNwID0gcmVxdWlyZSgnY2hpbGRfcHJvY2VzcycpXG5cbmV4cG9ydCBsZXQgYnJlYWtwb2ludFVJID0gbmV3IEJyZWFrcG9pbnRVSSgpXG5leHBvcnQgbGV0IGRlYnVnZ2VySW5zdDogRGVidWdnZXIgfCB1bmRlZmluZWRcbmV4cG9ydCBsZXQgdG9vbHRpcE92ZXJyaWRlID0gbmV3IFRvb2x0aXBPdmVycmlkZShhc3luYyAoZXhwcmVzc2lvbikgPT4ge1xuICAgIGlmIChkZWJ1Z2dlckluc3QgPT09IHVuZGVmaW5lZCkgeyByZXR1cm4gfVxuICAgIHJldHVybiBkZWJ1Z2dlckluc3QucmVzb2x2ZUV4cHJlc3Npb24oZXhwcmVzc2lvbilcbn0pXG5cbmV4cG9ydCBsZXQgc2V0dGluZ3MgPSB7XG4gICAgYnJlYWtPbkVycm9yOiB0cnVlXG59XG5cbmludGVyZmFjZSBFZGl0b3JFdmVudCB7XG4gIGN1cnJlbnRUYXJnZXQ6IHsgZ2V0TW9kZWwgKCk6IGF0b21BUEkuVGV4dEVkaXRvciB9XG59XG5cbmV4cG9ydCBsZXQgY29tbWFuZHMgPSB7XG4gICAgJ2RlYnVnJzogYXN5bmMgKHtjdXJyZW50VGFyZ2V0fTogRWRpdG9yRXZlbnQpID0+IHtcbiAgICAgICAgY29uc3Qgb2IgPSBhd2FpdCB1cGkuZ2V0T3RoZXJzQ29uZmlnUGFyYW08e25hbWU6IHN0cmluZ30+KCdpZGUtaGFza2VsbC1jYWJhbCcsICdidWlsZGVyJylcbiAgICAgICAgaWYgKG9iKSB7XG4gICAgICAgICAgZGVidWdnZXJJbnN0ID0gbmV3IERlYnVnZ2VyKGJyZWFrcG9pbnRVSS5icmVha3BvaW50cywgY3VycmVudFRhcmdldC5nZXRNb2RlbCgpLCBvYi5uYW1lKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGRlYnVnZ2VySW5zdCA9IG5ldyBEZWJ1Z2dlcihicmVha3BvaW50VUkuYnJlYWtwb2ludHMsIGN1cnJlbnRUYXJnZXQuZ2V0TW9kZWwoKSlcbiAgICAgICAgfVxuICAgIH0sXG4gICAgJ2RlYnVnLWJhY2snOiAoKSA9PiB7XG4gICAgICAgIGlmIChkZWJ1Z2dlckluc3QpIHtcbiAgICAgICAgICAgIGRlYnVnZ2VySW5zdC5iYWNrKClcbiAgICAgICAgfVxuICAgIH0sXG4gICAgJ2RlYnVnLWZvcndhcmQnOiAoKSA9PiB7XG4gICAgICAgIGlmIChkZWJ1Z2dlckluc3QpIHtcbiAgICAgICAgICAgIGRlYnVnZ2VySW5zdC5mb3J3YXJkKClcbiAgICAgICAgfVxuICAgIH0sXG4gICAgJ2RlYnVnLXN0ZXAnOiAoKSA9PiB7XG4gICAgICAgIGlmIChkZWJ1Z2dlckluc3QpIHtcbiAgICAgICAgICAgIGRlYnVnZ2VySW5zdC5zdGVwKClcbiAgICAgICAgfVxuICAgIH0sXG4gICAgJ2RlYnVnLXN0b3AnOiAoKSA9PiB7XG4gICAgICAgIGlmIChkZWJ1Z2dlckluc3QpIHtcbiAgICAgICAgICAgIGRlYnVnZ2VySW5zdC5zdG9wKClcbiAgICAgICAgfVxuICAgIH0sXG4gICAgJ2RlYnVnLWNvbnRpbnVlJzogKCkgPT4ge1xuICAgICAgICBpZiAoZGVidWdnZXJJbnN0KSB7XG4gICAgICAgICAgICBkZWJ1Z2dlckluc3QuY29udGludWUoKVxuICAgICAgICB9XG4gICAgfSxcbiAgICAndG9nZ2xlLWJyZWFrcG9pbnQnOiAoe2N1cnJlbnRUYXJnZXR9OiBFZGl0b3JFdmVudCkgPT4ge1xuICAgICAgICBicmVha3BvaW50VUkudG9nZ2xlQnJlYWtwb2ludChcbiAgICAgICAgICAgIGN1cnJlbnRUYXJnZXQuZ2V0TW9kZWwoKS5nZXRDdXJzb3JCdWZmZXJQb3NpdGlvbigpLnJvdyArIDEsXG4gICAgICAgICAgICBjdXJyZW50VGFyZ2V0LmdldE1vZGVsKClcbiAgICAgICAgKVxuICAgIH0sXG4gICAgJ3NldC1icmVhay1vbi1leGNlcHRpb24nOiBhc3luYyAoKSA9PiB7XG4gICAgICAgIGNvbnN0IHNlbGVjdERlYnVnTW9kZVZpZXcgPSByZXF1aXJlKCcuL3ZpZXdzL1NlbGVjdERlYnVnTW9kZVZpZXcnKVxuICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBzZWxlY3REZWJ1Z01vZGVWaWV3KGRlYnVnTW9kZXMsIGF0b20uY29uZmlnLmdldCgnaGFza2VsbC1kZWJ1Zy5icmVha09uRXhjZXB0aW9uJykpXG4gICAgICAgIGlmIChyZXN1bHQgIT09IHVuZGVmaW5lZCkgeyBhdG9tLmNvbmZpZy5zZXQoJ2hhc2tlbGwtZGVidWcuYnJlYWtPbkV4Y2VwdGlvbicsIHJlc3VsdCkgfVxuICAgIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG9uRmlyc3RSdW4gKCkge1xuICAgIHN0YXRlID0ge1xuICAgICAgICBwcm9wZXJseUFjdGl2YXRlZDogZmFsc2VcbiAgICB9XG5cbiAgICAvLyBmcm9tIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvMzQ5NTMxNjgvbm9kZS1jaGVjay1leGlzdGVuY2Utb2YtY29tbWFuZC1pbi1wYXRoXG4gICAgY29uc3QgaXNXaW4gPSBvcy5wbGF0Zm9ybSgpLmluZGV4T2YoJ3dpbicpID4gLTFcbiAgICBjb25zdCB3aGVyZSA9IGlzV2luID8gJ3doZXJlJyA6ICd3aGVyZWlzJ1xuXG4gICAgY29uc3Qgb3V0ID0gY3AuZXhlYyh3aGVyZSArICcgbm9kZScpXG5cbiAgICBvdXQub24oJ2Nsb3NlJywgKGNvZGUpID0+IHtcbiAgICAgICAgaWYgKGNvZGUgPT09IDEpIHsvLyBub3QgZm91bmRcbiAgICAgICAgICAgIC8vIGZhbGxiYWNrIHRvIHRoZSBub2RlIGluIGFwbVxuICAgICAgICAgICAgYXRvbS5jb25maWcuc2V0KCdoYXNrZWxsLWRlYnVnLm5vZGVDb21tYW5kJywgcGF0aC5yZXNvbHZlKGF0b20ucGFja2FnZXMuZ2V0QXBtUGF0aCgpLCAnLi4vLi4vYmluL2F0b20nKSlcbiAgICAgICAgICAgIGlmIChzdGF0ZSkgeyBzdGF0ZS5wcm9wZXJseUFjdGl2YXRlZCA9IHRydWUgfVxuICAgICAgICB9XG4gICAgfSlcbn1cblxuaW50ZXJmYWNlIEhhc2tlbGxEZWJ1Z1N0YXRlIHtcbiAgICBwcm9wZXJseUFjdGl2YXRlZDogYm9vbGVhblxufVxuXG5leHBvcnQgbGV0IHN0YXRlOiBIYXNrZWxsRGVidWdTdGF0ZSB8IHVuZGVmaW5lZFxuXG5leHBvcnQgZnVuY3Rpb24gYWN0aXZhdGUgKF9zdGF0ZT86IEhhc2tlbGxEZWJ1Z1N0YXRlKSB7XG4gICAgc3RhdGUgPSBfc3RhdGVcblxuICAgIGlmIChzdGF0ZSA9PT0gdW5kZWZpbmVkIHx8IHN0YXRlLnByb3Blcmx5QWN0aXZhdGVkICE9PSB0cnVlKSB7XG4gICAgICAgIG9uRmlyc3RSdW4oKVxuICAgIH1cbiAgICBhdG9tLndvcmtzcGFjZS5vYnNlcnZlQWN0aXZlUGFuZUl0ZW0oKHBhbmUpID0+IHtcbiAgICAgICAgaWYgKGF0b20ud29ya3NwYWNlLmlzVGV4dEVkaXRvcihwYW5lKSkge1xuICAgICAgICAgICAgY29uc3QgdGU6IGF0b21BUEkuVGV4dEVkaXRvciAmIHsgaGFzSGFza2VsbEJyZWFrcG9pbnRzPzogYm9vbGVhbiB9ID0gcGFuZVxuICAgICAgICAgICAgY29uc3Qgc2NvcGVzID0gdGUuZ2V0Um9vdFNjb3BlRGVzY3JpcHRvcigpLmdldFNjb3Blc0FycmF5KClcbiAgICAgICAgICAgIGlmIChzY29wZXMubGVuZ3RoID09PSAxICYmIHNjb3Blc1swXSA9PT0gJ3NvdXJjZS5oYXNrZWxsJykge1xuICAgICAgICAgICAgICAgIGlmICghdGUuaGFzSGFza2VsbEJyZWFrcG9pbnRzKSB7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrcG9pbnRVSS5hdHRhY2hUb05ld1RleHRFZGl0b3IodGUpXG4gICAgICAgICAgICAgICAgICAgIHRlLmhhc0hhc2tlbGxCcmVha3BvaW50cyA9IHRydWVcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoZGVidWdnZXJJbnN0KSB7XG4gICAgICAgICAgICAgICAgICAgIGRlYnVnZ2VySW5zdC5zaG93UGFuZWxzKClcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gIC8vIGRvbid0IGRvIGJlbG93XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBpZiBhbnkgcGFuZSB0aGF0IGlzbid0IGEgaGFza2VsbCBzb3VyY2UgZmlsZSBhbmQgd2UncmUgZGVidWdnaW5nXG4gICAgICAgIGlmIChkZWJ1Z2dlckluc3QpIHtcbiAgICAgICAgICAgIGRlYnVnZ2VySW5zdC5oaWRlUGFuZWxzKClcbiAgICAgICAgfVxuICAgIH0pXG5cbiAgICBmb3IgKGNvbnN0IGNvbW1hbmQgb2YgT2JqZWN0LmtleXMoY29tbWFuZHMpKXtcbiAgICAgICAgYXRvbS5jb21tYW5kcy5hZGQoXCJhdG9tLXRleHQtZWRpdG9yW2RhdGEtZ3JhbW1hcj0nc291cmNlIGhhc2tlbGwnXVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAnaGFza2VsbDonICsgY29tbWFuZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgY29tbWFuZHNbY29tbWFuZF0pXG4gICAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gc2VyaWFsaXplICgpIHtcbiAgICByZXR1cm4gc3RhdGVcbn1cblxuZXhwb3J0IGxldCBkZWJ1Z01vZGVzID0gW1xuICAgIHt2YWx1ZTogJ25vbmUnLCBkZXNjcmlwdGlvbjogJ0RvblxcJ3QgcGF1c2Ugb24gYW55IGV4Y2VwdGlvbnMnfSxcbiAgICB7dmFsdWU6ICdlcnJvcnMnLCBkZXNjcmlwdGlvbjogJ1BhdXNlIG9uIGVycm9ycyAodW5jYXVnaHQgZXhjZXB0aW9ucyknfSxcbiAgICB7dmFsdWU6ICdleGNlcHRpb25zJywgZGVzY3JpcHRpb246ICdQYXVzZSBvbiBleGNlcHRpb25zJ30sXG5dXG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRUZXJtaW5hbENvbW1hbmQgKCkge1xuICAgIGlmIChvcy50eXBlKCkgPT09ICdXaW5kb3dzX05UJykge1xuICAgICAgICByZXR1cm4gJ3N0YXJ0ICVzJ1xuICAgIH0gZWxzZSBpZiAob3MudHlwZSgpID09PSAnTGludXgnKSB7XG4gICAgICAgIHJldHVybiBgeC10ZXJtaW5hbC1lbXVsYXRvciAtZSBcImJhc2ggLWMgXFxcXFwiJXNcXFxcXCJcImBcbiAgICB9IGVsc2UgaWYgKG9zLnR5cGUoKSA9PT0gJ0RhcndpbicpIHtcbiAgICAgICAgcmV0dXJuIGBvc2FzY3JpcHQgLWUgJ3RlbGwgYXBwIFwiVGVybWluYWxcIiB0byBkbyBzY3JpcHQgXCIlc1wiJ2BcbiAgICB9IGVsc2Uge1xuICAgICAgICAvLyBub3QgcmVjb2duaXNlZCwgaG9wZSB4dGVybSB3b3Jrc1xuICAgICAgICByZXR1cm4gYHh0ZXJtIC1lIFwiYmFzaCAtYyBcXFxcXCIlc1xcXFxcIlwiYFxuICAgIH1cbn1cblxuZXhwb3J0IGxldCBjb25maWcgPSB7XG4gICAgdXNlSWRlSGFza2VsbENhYmFsQnVpbGRlcjoge1xuICAgICAgICB0aXRsZTogJ1VzZSBpZGUtaGFza2VsbC1jYWJhbCBidWlsZGVyJyxcbiAgICAgICAgZGVzY3JpcHRpb246IFwiVXNlIHRoZSBpZGUtaGFza2VsbC1jYWJhbCBidWlsZGVyJ3MgY29tbWFuZCB3aGVuIHJ1bm5pbmcgZ2hjaSAtIFwiICtcbiAgICAgICAgICAgICd3aWxsIHJ1biBgc3RhY2sgZ2hjaWAgd2hlbiBzdGFjayBpcyB0aGUgYnVpbGRlciwgYGNhYmFsIHJlcGxgIGZvciBjYWJhbCBhbmQgJyArXG4gICAgICAgICAgICAnYGdoY2lgIGZvciBub25lJyxcbiAgICAgICAgZGVmYXVsdDogdHJ1ZSxcbiAgICAgICAgdHlwZTogJ2Jvb2xlYW4nLFxuICAgICAgICBvcmRlcjogMFxuICAgIH0sXG4gICAgR0hDSUNvbW1hbmQ6IHtcbiAgICAgICAgdGl0bGU6ICdHSENJIENvbW1hbmQnLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ1RoZSBjb21tYW5kIHRvIHJ1biB0byBleGVjdXRlIGBnaGNpYCwgdGhpcyB3aWxsIGdldCBpZ25vcmUgaWYgdGhlJyArXG4gICAgICAgICAgICAnIHByZXZpb3VzIHNldHRpbmcgaXMgc2V0IHRvIHRydWUnLFxuICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgZGVmYXVsdDogJ2doY2knLFxuICAgICAgICBvcmRlcjogMVxuICAgIH0sXG4gICAgR0hDSUFyZ3VtZW50czoge1xuICAgICAgICB0aXRsZTogJ0dIQ0kgQXJndW1lbnRzJyxcbiAgICAgICAgZGVzY3JpcHRpb246ICdBcmd1bWVudHMgdG8gZ2l2ZSB0byBgZ2hjaWAsIHNlcGFyYXRlZCBieSBhIHNwYWNlJyxcbiAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgIGRlZmF1bHQ6ICcnLFxuICAgICAgICBvcmRlcjogMlxuICAgIH0sXG4gICAgbm9kZUNvbW1hbmQ6IHtcbiAgICAgICAgZGVzY3JpcHRpb246ICdUaGUgY29tbWFuZCB0byBydW4gdG8gZXhlY3V0ZSBub2RlLmpzJyxcbiAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgIGRlZmF1bHQ6ICdub2RlJyxcbiAgICAgICAgb3JkZXI6IDNcbiAgICB9LFxuICAgIHRlcm1pbmFsQ29tbWFuZDoge1xuICAgICAgICBkZXNjcmlwdGlvbjogJ1RoZSBjb21tYW5kIHRvIHJ1biB0byBsYXVuY2ggYSB0ZXJtaW5hbCwgd2hlcmUgdGhlIGNvbW1hbmQgbGF1bmNoZWQgaW4gdGhlIHRlcm1pbmFsIGlzIGAlc2AuJyxcbiAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgIGRlZmF1bHQ6IGdldFRlcm1pbmFsQ29tbWFuZCgpLFxuICAgICAgICBvcmRlcjogNFxuICAgIH0sXG4gICAgY2xpY2tHdXR0ZXJUb1RvZ2dsZUJyZWFrcG9pbnQ6IHtcbiAgICAgICAgdHlwZTogJ2Jvb2xlYW4nLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ0luc2VydCBhIGJyZWFrcG9pbnQgd2hlbiB0aGUgZ3V0dGVyIGlzIGNsaWNrZWQgaW4gYSBoYXNrZWxsIHNvdXJjZSBmaWxlJyxcbiAgICAgICAgZGVmYXVsdDogdHJ1ZSxcbiAgICAgICAgb3JkZXI6IDVcbiAgICB9LFxuICAgIHNob3dUZXJtaW5hbDoge1xuICAgICAgICB0eXBlOiAnYm9vbGVhbicsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnU2hvdyBhIHRlcm1pbmFsIHdpdGggYGdoY2lgIHJ1bm5pbmcgd2hlbiBkZWJ1Z2dpbmcnLFxuICAgICAgICBkZWZhdWx0OiB0cnVlLFxuICAgICAgICBvcmRlcjogNlxuICAgIH0sXG4gICAgZnVuY3Rpb25Ub0RlYnVnOiB7XG4gICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ1RoZSBmdW5jdGlvbiB0byBydW4gd2hlbiBkZWJ1Z2dpbmcnLFxuICAgICAgICBkZWZhdWx0OiAnbWFpbicsXG4gICAgICAgIG9yZGVyOiA3XG4gICAgfSxcbiAgICBicmVha09uRXhjZXB0aW9uOiB7XG4gICAgICAgIGRlc2NyaXB0aW9uOiBgV2hldGhlciB0byBicmVhayBvbiBleGNlcHRpb25zLCBlcnJvcnMgb3IgbmVpdGhlci5cbiAgICAgICAgICAgIE5vdGU6IGJyZWFraW5nIG9uIGV4Y2VwdGlvbiBtYXkgY2F1c2UgdGhlIGRlYnVnZ2VyIHRvIGZyZWV6ZSBpbiBzb21lIGluc3RhbmNlcy5cbiAgICAgICAgICAgIFNlZSBbIzNdKGh0dHBzOi8vZ2l0aHViLmNvbS9UaG9tYXNIaWNrbWFuL2hhc2tlbGwtZGVidWcvaXNzdWVzLzMpYCxcbiAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgIGRlZmF1bHQ6ICdub25lJyxcbiAgICAgICAgZW51bTogZGVidWdNb2RlcyxcbiAgICAgICAgb3JkZXI6IDhcbiAgICB9XG59XG5cbmxldCB1cGk6IFVQSS5JVVBJSW5zdGFuY2VcblxuZXhwb3J0IGZ1bmN0aW9uIGNvbnN1bWVIYXNrZWxsVXBpIChyZWc6IFVQSS5JVVBJUmVnaXN0cmF0aW9uKSB7XG4gICAgdXBpID0gcmVnKHtcbiAgICAgIG5hbWU6ICdoYXNrZWxsLWRlYnVnJyxcbiAgICAgIHRvb2x0aXA6IHtcbiAgICAgICAgcHJpb3JpdHk6IDEwMCxcbiAgICAgICAgaGFuZGxlcjogdG9vbHRpcE92ZXJyaWRlLnRvb2x0aXBIYW5kbGVyLmJpbmQodG9vbHRpcE92ZXJyaWRlKVxuICAgICAgfVxuICAgIH0pXG4gICAgcmV0dXJuIHVwaVxufVxuIl19