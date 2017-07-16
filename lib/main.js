"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const BreakpointUI = require("./BreakpointUI");
const TooltipOverride = require("./TooltipOverride");
const atomAPI = require("atom");
const os = require("os");
const path = require("path");
const cp = require("child_process");
var Main;
(function (Main) {
    Main.breakpointUI = new BreakpointUI();
    Main.debugger_ = null;
    Main.tooltipOverride = new TooltipOverride((expression) => __awaiter(this, void 0, void 0, function* () {
        if (Main.debugger_ === null)
            return null;
        return Main.debugger_.resolveExpression(expression);
    }));
    Main.settings = {
        breakOnError: true
    };
    Main.commands = {
        "debug": () => {
            var Debugger = require("./Debugger");
            upi.getConfigParam("ide-haskell-cabal", "builder").then(ob => {
                Main.debugger_ = new Debugger(Main.breakpointUI.breakpoints, ob.name);
            }).catch(() => {
                Main.debugger_ = new Debugger(Main.breakpointUI.breakpoints);
            });
        },
        "debug-back": () => {
            if (Main.debugger_ != null) {
                Main.debugger_.back();
            }
        },
        "debug-forward": () => {
            if (Main.debugger_ != null) {
                Main.debugger_.forward();
            }
        },
        "debug-step": () => {
            if (Main.debugger_ != null) {
                Main.debugger_.step();
            }
        },
        "debug-stop": () => {
            if (Main.debugger_ != null) {
                Main.debugger_.stop();
            }
        },
        "debug-continue": () => {
            if (Main.debugger_ != null) {
                Main.debugger_.continue();
            }
        },
        "toggle-breakpoint": () => {
            var te = atom.workspace.getActiveTextEditor();
            Main.breakpointUI.toggleBreakpoint(te.getCursorBufferPosition().row, te);
        },
        "set-break-on-exception": () => {
            var SelectDebugModeView = require("./views/SelectDebugModeView");
            var view = new SelectDebugModeView(Main.debugModes, atom.config.get("haskell-debug.breakOnException"));
            var panel = atom.workspace.addModalPanel({
                item: view
            });
            view.focusFilterEditor();
            view.emitter.on("selected", (item) => {
                atom.config.set("haskell-debug.breakOnException", item);
            });
            view.emitter.on("canceled", () => {
                panel.destroy();
            });
        }
    };
    function onFirstRun() {
        Main.state = {
            properlyActivated: false
        };
        var isWin = os.platform().indexOf('win') > -1;
        var where = isWin ? 'where' : 'whereis';
        var out = cp.exec(where + ' node');
        out.on('close', function (code) {
            if (code == 1) {
                atom.config.set("haskell-debug.nodeCommand", path.resolve(atom.packages.getApmPath(), "../../bin/atom"));
                Main.state.properlyActivated = true;
            }
        });
    }
    Main.onFirstRun = onFirstRun;
    function activate(_state) {
        Main.state = _state;
        if (Main.state === undefined || Main.state.properlyActivated !== true) {
            onFirstRun();
        }
        atom.workspace.observeActivePaneItem((pane) => {
            if (atom.workspace.isTextEditor(pane)) {
                var te = pane;
                var scopes = te.getRootScopeDescriptor().scopes;
                if (scopes.length == 1 && scopes[0] == "source.haskell") {
                    if (!te["hasHaskellBreakpoints"]) {
                        Main.breakpointUI.attachToNewTextEditor(te);
                        te["hasHaskellBreakpoints"] = true;
                    }
                    if (Main.debugger_ != null) {
                        Main.debugger_.showPanels();
                    }
                    return;
                }
            }
            if (Main.debugger_ != null) {
                Main.debugger_.hidePanels();
            }
        });
        for (var command of Object.keys(Main.commands)) {
            atom.commands.add("atom-text-editor[data-grammar='source haskell']", "haskell:" + command, Main.commands[command]);
        }
    }
    Main.activate = activate;
    function serialize() {
        return Main.state;
    }
    Main.serialize = serialize;
    Main.debugModes = [
        { value: "none", description: 'Don\'t pause on any exceptions' },
        { value: "errors", description: 'Pause on errors (uncaught exceptions)' },
        { value: "exceptions", description: 'Pause on exceptions' },
    ];
    function getTerminalCommand() {
        if (os.type() == "Windows_NT") {
            return "start %s";
        }
        else if (os.type() == "Linux") {
            return `x-terminal-emulator -e "bash -c \\"%s\\""`;
        }
        else if (os.type() == "Darwin") {
            return `osascript -e 'tell app "Terminal" to do script "%s"'`;
        }
        else {
            return `xterm -e "bash -c \\"%s\\""`;
        }
    }
    Main.getTerminalCommand = getTerminalCommand;
    Main.config = {
        "useIdeHaskellCabalBuilder": {
            title: "Use ide-haskell-cabal builder",
            description: "Use the ide-haskell-cabal builder's command when running ghci - " +
                "will run `stack ghci` when stack is the builder, `cabal repl` for cabal and " +
                "`ghci` for none",
            default: true,
            type: "boolean",
            order: 0
        },
        "GHCICommand": {
            title: "GHCI Command",
            description: "The command to run to execute `ghci`, this will get ignore if the" +
                " previous setting is set to true",
            type: "string",
            default: "ghci",
            order: 1
        },
        "GHCIArguments": {
            title: "GHCI Arguments",
            description: "Arguments to give to `ghci`, separated by a space",
            type: "string",
            default: "",
            order: 2
        },
        "nodeCommand": {
            description: "The command to run to execute node.js",
            type: "string",
            default: "node",
            order: 3
        },
        "terminalCommand": {
            description: "The command to run to launch a terminal, where the command launched in the terminal is `%s`.",
            type: "string",
            default: getTerminalCommand(),
            order: 4
        },
        "clickGutterToToggleBreakpoint": {
            type: "boolean",
            description: "Insert a breakpoint when the gutter is clicked in a haskell source file",
            default: true,
            order: 5
        },
        "showTerminal": {
            type: "boolean",
            description: "Show a terminal with `ghci` running when debugging",
            default: true,
            order: 6
        },
        "functionToDebug": {
            type: "string",
            description: "The function to run when debugging",
            default: "main",
            order: 7
        },
        "breakOnException": {
            description: `Whether to break on exceptions, errors or neither.
                Note: breaking on exception may cause the debugger to freeze in some instances. See [#3](https://github.com/ThomasHickman/haskell-debug/issues/3)`,
            type: "string",
            default: "none",
            enum: Main.debugModes,
            order: 8
        }
    };
    var upi;
    function consumeHaskellUpi(upiContainer) {
        var pluginDisposable = new atomAPI.CompositeDisposable();
        var _upi = upiContainer.registerPlugin(pluginDisposable, "haskell-debug");
        Main.tooltipOverride.consumeHaskellUpi(_upi);
        upi = _upi;
    }
    Main.consumeHaskellUpi = consumeHaskellUpi;
})(Main || (Main = {}));
module.exports = Main;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9tYWluLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUNBLCtDQUFnRDtBQUNoRCxxREFBc0Q7QUFFdEQsZ0NBQWlDO0FBQ2pDLHlCQUEwQjtBQUMxQiw2QkFBOEI7QUFDOUIsb0NBQXFDO0FBR3JDLElBQU8sSUFBSSxDQTZPVjtBQTdPRCxXQUFPLElBQUk7SUFDSSxpQkFBWSxHQUFHLElBQUksWUFBWSxFQUFFLENBQUM7SUFDbEMsY0FBUyxHQUFhLElBQUksQ0FBQztJQUMzQixvQkFBZSxHQUFHLElBQUksZUFBZSxDQUFDLENBQU8sVUFBVTtRQUM5RCxFQUFFLENBQUEsQ0FBQyxLQUFBLFNBQVMsS0FBSyxJQUFJLENBQUM7WUFBQyxNQUFNLENBQUMsSUFBSSxDQUFBO1FBQ2xDLE1BQU0sQ0FBQyxLQUFBLFNBQVMsQ0FBQyxpQkFBaUIsQ0FBQyxVQUFVLENBQUMsQ0FBQztJQUNuRCxDQUFDLENBQUEsQ0FBQyxDQUFDO0lBRVEsYUFBUSxHQUFHO1FBQ2xCLFlBQVksRUFBRSxJQUFJO0tBQ3JCLENBQUE7SUFFVSxhQUFRLEdBQUc7UUFDbEIsT0FBTyxFQUFFO1lBQ0wsSUFBSSxRQUFRLEdBQUcsT0FBTyxDQUFDLFlBQVksQ0FBQyxDQUFDO1lBRXJDLEdBQUcsQ0FBQyxjQUFjLENBQUMsbUJBQW1CLEVBQUUsU0FBUyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUU7Z0JBQ3RELEtBQUEsU0FBUyxHQUFHLElBQUksUUFBUSxDQUFDLEtBQUEsWUFBWSxDQUFDLFdBQVcsRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDaEUsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDO2dCQUNMLEtBQUEsU0FBUyxHQUFHLElBQUksUUFBUSxDQUFDLEtBQUEsWUFBWSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1lBQ3ZELENBQUMsQ0FBQyxDQUFBO1FBQ04sQ0FBQztRQUNELFlBQVksRUFB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RUFBRSxJQUFJO1lBQ2IsS0FBSyxFQUFFLENBQUM7U0FDWDtRQUNELGNBQWMsRUFBRTtZQUNaLElBQUksRUFBRSxTQUFTO1lBQ2YsV0FBVyxFQUFFLG9EQUFvRDtZQUNqRSxPQUFPLEVBQUUsSUFBSTtZQUNiLEtBQUssRUFBRSxDQUFDO1NBQ1g7UUFDRCxpQkFBaUIsRUFBRTtZQUNmLElBQUksRUFBRSxRQUFRO1lBQ2QsV0FBVyxFQUFFLG9DQUFvQztZQUNqRCxPQUFPLEVBQUUsTUFBTTtZQUNmLEtBQUssRUFBRSxDQUFDO1NBQ1g7UUFDRCxrQkFBa0IsRUFBRTtZQUNoQixXQUFXLEVBQUU7a0tBQ3lJO1lBQ3RKLElBQUksRUFBRSxRQUFRO1lBQ2QsT0FBTyxFQUFFLE1BQU07WUFDZixJQUFJLEVBQUUsS0FBQSxVQUFVO1lBQ2hCLEtBQUssRUFBRSxDQUFDO1NBQ1g7S0FDSixDQUFBO0lBRUQsSUFBSSxHQUEwQixDQUFDO0lBRS9CLDJCQUFrQyxZQUE0QztRQUMxRSxJQUFJLGdCQUFnQixHQUFHLElBQUksT0FBTyxDQUFDLG1CQUFtQixFQUFFLENBQUM7UUFDekQsSUFBSSxJQUFJLEdBQUcsWUFBWSxDQUFDLGNBQWMsQ0FBQyxnQkFBZ0IsRUFBRSxlQUFlLENBQUMsQ0FBQztRQUMxRSxLQUFBLGVBQWUsQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUN4QyxHQUFHLEdBQUcsSUFBSSxDQUFDO0lBQ2YsQ0FBQztJQUxlLHNCQUFpQixvQkFLaEMsQ0FBQTtBQUNMLENBQUMsRUE3T00sSUFBSSxLQUFKLElBQUksUUE2T1Y7QUFFRCxpQkFBUyxJQUFJLENBQUEiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgRGVidWdnZXIgPSByZXF1aXJlKFwiLi9EZWJ1Z2dlclwiKTtcbmltcG9ydCBCcmVha3BvaW50VUkgPSByZXF1aXJlKFwiLi9CcmVha3BvaW50VUlcIik7XG5pbXBvcnQgVG9vbHRpcE92ZXJyaWRlID0gcmVxdWlyZShcIi4vVG9vbHRpcE92ZXJyaWRlXCIpO1xuaW1wb3J0IFNlbGVjdERlYnVnTW9kZVZpZXcgPSByZXF1aXJlKFwiLi92aWV3cy9TZWxlY3REZWJ1Z01vZGVWaWV3XCIpO1xuaW1wb3J0IGF0b21BUEkgPSByZXF1aXJlKFwiYXRvbVwiKTtcbmltcG9ydCBvcyA9IHJlcXVpcmUoXCJvc1wiKTtcbmltcG9ydCBwYXRoID0gcmVxdWlyZShcInBhdGhcIik7XG5pbXBvcnQgY3AgPSByZXF1aXJlKFwiY2hpbGRfcHJvY2Vzc1wiKTtcbmltcG9ydCAqIGFzIGhhc2tlbGxJZGUgZnJvbSBcIi4vaWRlLWhhc2tlbGxcIlxuXG5tb2R1bGUgTWFpbiB7XG4gICAgZXhwb3J0IHZhciBicmVha3BvaW50VUkgPSBuZXcgQnJlYWtwb2ludFVJKCk7XG4gICAgZXhwb3J0IHZhciBkZWJ1Z2dlcl86IERlYnVnZ2VyID0gbnVsbDtcbiAgICBleHBvcnQgdmFyIHRvb2x0aXBPdmVycmlkZSA9IG5ldyBUb29sdGlwT3ZlcnJpZGUoYXN5bmMgKGV4cHJlc3Npb24pID0+IHtcbiAgICAgICAgaWYoZGVidWdnZXJfID09PSBudWxsKSByZXR1cm4gbnVsbFxuICAgICAgICByZXR1cm4gZGVidWdnZXJfLnJlc29sdmVFeHByZXNzaW9uKGV4cHJlc3Npb24pO1xuICAgIH0pO1xuXG4gICAgZXhwb3J0IHZhciBzZXR0aW5ncyA9IHtcbiAgICAgICAgYnJlYWtPbkVycm9yOiB0cnVlXG4gICAgfVxuXG4gICAgZXhwb3J0IHZhciBjb21tYW5kcyA9IHtcbiAgICAgICAgXCJkZWJ1Z1wiOiAoKSA9PiB7XG4gICAgICAgICAgICB2YXIgRGVidWdnZXIgPSByZXF1aXJlKFwiLi9EZWJ1Z2dlclwiKTtcblxuICAgICAgICAgICAgdXBpLmdldENvbmZpZ1BhcmFtKFwiaWRlLWhhc2tlbGwtY2FiYWxcIiwgXCJidWlsZGVyXCIpLnRoZW4ob2IgPT4ge1xuICAgICAgICAgICAgICAgIGRlYnVnZ2VyXyA9IG5ldyBEZWJ1Z2dlcihicmVha3BvaW50VUkuYnJlYWtwb2ludHMsIG9iLm5hbWUpO1xuICAgICAgICAgICAgfSkuY2F0Y2goKCkgPT4ge1xuICAgICAgICAgICAgICAgIGRlYnVnZ2VyXyA9IG5ldyBEZWJ1Z2dlcihicmVha3BvaW50VUkuYnJlYWtwb2ludHMpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgfSxcbiAgICAgICAgXCJkZWJ1Zy1iYWNrXCI6ICgpID0+IHtcbiAgICAgICAgICAgIGlmKGRlYnVnZ2VyXyAhPSBudWxsKXtcbiAgICAgICAgICAgICAgICBkZWJ1Z2dlcl8uYmFjaygpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBcImRlYnVnLWZvcndhcmRcIjogKCkgPT4ge1xuICAgICAgICAgICAgaWYoZGVidWdnZXJfICE9IG51bGwpe1xuICAgICAgICAgICAgICAgIGRlYnVnZ2VyXy5mb3J3YXJkKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIFwiZGVidWctc3RlcFwiOiAoKSA9PiB7XG4gICAgICAgICAgICBpZihkZWJ1Z2dlcl8gIT0gbnVsbCl7XG4gICAgICAgICAgICAgICAgZGVidWdnZXJfLnN0ZXAoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgXCJkZWJ1Zy1zdG9wXCI6ICgpID0+IHtcbiAgICAgICAgICAgIGlmKGRlYnVnZ2VyXyAhPSBudWxsKXtcbiAgICAgICAgICAgICAgICBkZWJ1Z2dlcl8uc3RvcCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBcImRlYnVnLWNvbnRpbnVlXCI6ICgpID0+IHtcbiAgICAgICAgICAgIGlmKGRlYnVnZ2VyXyAhPSBudWxsKXtcbiAgICAgICAgICAgICAgICBkZWJ1Z2dlcl8uY29udGludWUoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgXCJ0b2dnbGUtYnJlYWtwb2ludFwiOiAoKSA9PiB7XG4gICAgICAgICAgICB2YXIgdGUgPSBhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVUZXh0RWRpdG9yKCk7XG5cbiAgICAgICAgICAgIGJyZWFrcG9pbnRVSS50b2dnbGVCcmVha3BvaW50KFxuICAgICAgICAgICAgICAgIHRlLmdldEN1cnNvckJ1ZmZlclBvc2l0aW9uKCkucm93LFxuICAgICAgICAgICAgICAgIHRlXG4gICAgICAgICAgICApO1xuICAgICAgICB9LFxuICAgICAgICBcInNldC1icmVhay1vbi1leGNlcHRpb25cIjogKCkgPT4ge1xuICAgICAgICAgICAgdmFyIFNlbGVjdERlYnVnTW9kZVZpZXcgPSByZXF1aXJlKFwiLi92aWV3cy9TZWxlY3REZWJ1Z01vZGVWaWV3XCIpO1xuICAgICAgICAgICAgdmFyIHZpZXcgPSBuZXcgU2VsZWN0RGVidWdNb2RlVmlldyhkZWJ1Z01vZGVzLCBhdG9tLmNvbmZpZy5nZXQoXCJoYXNrZWxsLWRlYnVnLmJyZWFrT25FeGNlcHRpb25cIikpO1xuXG4gICAgICAgICAgICB2YXIgcGFuZWwgPSBhdG9tLndvcmtzcGFjZS5hZGRNb2RhbFBhbmVsKHtcbiAgICAgICAgICAgICAgICBpdGVtOiB2aWV3XG4gICAgICAgICAgICB9KVxuXG4gICAgICAgICAgICB2aWV3LmZvY3VzRmlsdGVyRWRpdG9yKCk7XG5cbiAgICAgICAgICAgIHZpZXcuZW1pdHRlci5vbihcInNlbGVjdGVkXCIsIChpdGVtOiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgICAgICBhdG9tLmNvbmZpZy5zZXQoXCJoYXNrZWxsLWRlYnVnLmJyZWFrT25FeGNlcHRpb25cIiwgaXRlbSk7XG4gICAgICAgICAgICB9KVxuXG4gICAgICAgICAgICB2aWV3LmVtaXR0ZXIub24oXCJjYW5jZWxlZFwiLCAoKSA9PiB7XG4gICAgICAgICAgICAgICAgcGFuZWwuZGVzdHJveSgpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGV4cG9ydCBmdW5jdGlvbiBvbkZpcnN0UnVuKCl7XG4gICAgICAgIHN0YXRlID0ge1xuICAgICAgICAgICAgcHJvcGVybHlBY3RpdmF0ZWQ6IGZhbHNlXG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gZnJvbSBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzM0OTUzMTY4L25vZGUtY2hlY2stZXhpc3RlbmNlLW9mLWNvbW1hbmQtaW4tcGF0aFxuICAgICAgICB2YXIgaXNXaW4gPSBvcy5wbGF0Zm9ybSgpLmluZGV4T2YoJ3dpbicpID4gLTE7XG4gICAgICAgIHZhciB3aGVyZSA9IGlzV2luID8gJ3doZXJlJyA6ICd3aGVyZWlzJztcblxuICAgICAgICB2YXIgb3V0ID0gY3AuZXhlYyh3aGVyZSArICcgbm9kZScpO1xuXG4gICAgICAgIG91dC5vbignY2xvc2UnLCBmdW5jdGlvbiAoY29kZSkge1xuICAgICAgICAgICAgaWYoY29kZSA9PSAxKXsvLyBub3QgZm91bmRcbiAgICAgICAgICAgICAgICAvLyBmYWxsYmFjayB0byB0aGUgbm9kZSBpbiBhcG1cbiAgICAgICAgICAgICAgICBhdG9tLmNvbmZpZy5zZXQoXCJoYXNrZWxsLWRlYnVnLm5vZGVDb21tYW5kXCIsIHBhdGgucmVzb2x2ZShhdG9tLnBhY2thZ2VzLmdldEFwbVBhdGgoKSwgXCIuLi8uLi9iaW4vYXRvbVwiKSk7XG4gICAgICAgICAgICAgICAgc3RhdGUucHJvcGVybHlBY3RpdmF0ZWQgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBpbnRlcmZhY2UgSGFza2VsbERlYnVnU3RhdGV7XG4gICAgICAgIHByb3Blcmx5QWN0aXZhdGVkOiBib29sZWFuXG4gICAgfVxuXG4gICAgZXhwb3J0IHZhciBzdGF0ZTogSGFza2VsbERlYnVnU3RhdGU7XG5cbiAgICBleHBvcnQgZnVuY3Rpb24gYWN0aXZhdGUoX3N0YXRlPzogSGFza2VsbERlYnVnU3RhdGUpe1xuICAgICAgICBzdGF0ZSA9IF9zdGF0ZTtcblxuICAgICAgICBpZihzdGF0ZSA9PT0gdW5kZWZpbmVkIHx8IHN0YXRlLnByb3Blcmx5QWN0aXZhdGVkICE9PSB0cnVlKXtcbiAgICAgICAgICAgIG9uRmlyc3RSdW4oKTtcbiAgICAgICAgfVxuICAgICAgICBhdG9tLndvcmtzcGFjZS5vYnNlcnZlQWN0aXZlUGFuZUl0ZW0oKHBhbmUpID0+IHtcbiAgICAgICAgICAgIGlmKGF0b20ud29ya3NwYWNlLmlzVGV4dEVkaXRvcihwYW5lKSl7XG4gICAgICAgICAgICAgICAgdmFyIHRlOiBBdG9tQ29yZS5JRWRpdG9yID0gcGFuZTtcbiAgICAgICAgICAgICAgICB2YXIgc2NvcGVzID0gdGUuZ2V0Um9vdFNjb3BlRGVzY3JpcHRvcigpLnNjb3BlcztcbiAgICAgICAgICAgICAgICBpZihzY29wZXMubGVuZ3RoID09IDEgJiYgc2NvcGVzWzBdID09IFwic291cmNlLmhhc2tlbGxcIil7XG4gICAgICAgICAgICAgICAgICAgIGlmKCF0ZVtcImhhc0hhc2tlbGxCcmVha3BvaW50c1wiXSl7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVha3BvaW50VUkuYXR0YWNoVG9OZXdUZXh0RWRpdG9yKHRlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRlW1wiaGFzSGFza2VsbEJyZWFrcG9pbnRzXCJdID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGlmKGRlYnVnZ2VyXyAhPSBudWxsKXtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlYnVnZ2VyXy5zaG93UGFuZWxzKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICByZXR1cm47ICAvLyBkb24ndCBkbyBiZWxvd1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gaWYgYW55IHBhbmUgdGhhdCBpc24ndCBhIGhhc2tlbGwgc291cmNlIGZpbGUgYW5kIHdlJ3JlIGRlYnVnZ2luZ1xuICAgICAgICAgICAgaWYoZGVidWdnZXJfICE9IG51bGwpe1xuICAgICAgICAgICAgICAgIGRlYnVnZ2VyXy5oaWRlUGFuZWxzKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pXG5cbiAgICAgICAgZm9yKHZhciBjb21tYW5kIG9mIE9iamVjdC5rZXlzKGNvbW1hbmRzKSl7XG4gICAgICAgICAgICBhdG9tLmNvbW1hbmRzLmFkZChcImF0b20tdGV4dC1lZGl0b3JbZGF0YS1ncmFtbWFyPSdzb3VyY2UgaGFza2VsbCddXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImhhc2tlbGw6XCIgKyBjb21tYW5kLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29tbWFuZHNbY29tbWFuZF0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZXhwb3J0IGZ1bmN0aW9uIHNlcmlhbGl6ZSgpe1xuICAgICAgICByZXR1cm4gc3RhdGU7XG4gICAgfVxuXG4gICAgZXhwb3J0IHZhciBkZWJ1Z01vZGVzID0gW1xuICAgICAgICB7dmFsdWU6IFwibm9uZVwiLCBkZXNjcmlwdGlvbjogJ0RvblxcJ3QgcGF1c2Ugb24gYW55IGV4Y2VwdGlvbnMnfSxcbiAgICAgICAge3ZhbHVlOiBcImVycm9yc1wiLCBkZXNjcmlwdGlvbjogJ1BhdXNlIG9uIGVycm9ycyAodW5jYXVnaHQgZXhjZXB0aW9ucyknfSxcbiAgICAgICAge3ZhbHVlOiBcImV4Y2VwdGlvbnNcIiwgZGVzY3JpcHRpb246ICdQYXVzZSBvbiBleGNlcHRpb25zJ30sXG4gICAgXVxuXG4gICAgZXhwb3J0IGZ1bmN0aW9uIGdldFRlcm1pbmFsQ29tbWFuZCgpe1xuICAgICAgICBpZihvcy50eXBlKCkgPT0gXCJXaW5kb3dzX05UXCIpe1xuICAgICAgICAgICAgcmV0dXJuIFwic3RhcnQgJXNcIlxuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYob3MudHlwZSgpID09IFwiTGludXhcIil7XG4gICAgICAgICAgICByZXR1cm4gYHgtdGVybWluYWwtZW11bGF0b3IgLWUgXCJiYXNoIC1jIFxcXFxcIiVzXFxcXFwiXCJgXG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZihvcy50eXBlKCkgPT0gXCJEYXJ3aW5cIil7XG4gICAgICAgICAgICByZXR1cm4gYG9zYXNjcmlwdCAtZSAndGVsbCBhcHAgXCJUZXJtaW5hbFwiIHRvIGRvIHNjcmlwdCBcIiVzXCInYFxuICAgICAgICB9XG4gICAgICAgIGVsc2V7XG4gICAgICAgICAgICAvLyBub3QgcmVjb2duaXNlZCwgaG9wZSB4dGVybSB3b3Jrc1xuICAgICAgICAgICAgcmV0dXJuIGB4dGVybSAtZSBcImJhc2ggLWMgXFxcXFwiJXNcXFxcXCJcImBcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGV4cG9ydCB2YXIgY29uZmlnID0ge1xuICAgICAgICBcInVzZUlkZUhhc2tlbGxDYWJhbEJ1aWxkZXJcIjoge1xuICAgICAgICAgICAgdGl0bGU6IFwiVXNlIGlkZS1oYXNrZWxsLWNhYmFsIGJ1aWxkZXJcIixcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIlVzZSB0aGUgaWRlLWhhc2tlbGwtY2FiYWwgYnVpbGRlcidzIGNvbW1hbmQgd2hlbiBydW5uaW5nIGdoY2kgLSBcIiArXG4gICAgICAgICAgICAgICAgXCJ3aWxsIHJ1biBgc3RhY2sgZ2hjaWAgd2hlbiBzdGFjayBpcyB0aGUgYnVpbGRlciwgYGNhYmFsIHJlcGxgIGZvciBjYWJhbCBhbmQgXCIgK1xuICAgICAgICAgICAgICAgIFwiYGdoY2lgIGZvciBub25lXCIsXG4gICAgICAgICAgICBkZWZhdWx0OiB0cnVlLFxuICAgICAgICAgICAgdHlwZTogXCJib29sZWFuXCIsXG4gICAgICAgICAgICBvcmRlcjogMFxuICAgICAgICB9LFxuICAgICAgICBcIkdIQ0lDb21tYW5kXCI6IHtcbiAgICAgICAgICAgIHRpdGxlOiBcIkdIQ0kgQ29tbWFuZFwiLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiVGhlIGNvbW1hbmQgdG8gcnVuIHRvIGV4ZWN1dGUgYGdoY2lgLCB0aGlzIHdpbGwgZ2V0IGlnbm9yZSBpZiB0aGVcIiArXG4gICAgICAgICAgICAgICAgXCIgcHJldmlvdXMgc2V0dGluZyBpcyBzZXQgdG8gdHJ1ZVwiLFxuICAgICAgICAgICAgdHlwZTogXCJzdHJpbmdcIixcbiAgICAgICAgICAgIGRlZmF1bHQ6IFwiZ2hjaVwiLFxuICAgICAgICAgICAgb3JkZXI6IDFcbiAgICAgICAgfSxcbiAgICAgICAgXCJHSENJQXJndW1lbnRzXCI6IHtcbiAgICAgICAgICAgIHRpdGxlOiBcIkdIQ0kgQXJndW1lbnRzXCIsXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJBcmd1bWVudHMgdG8gZ2l2ZSB0byBgZ2hjaWAsIHNlcGFyYXRlZCBieSBhIHNwYWNlXCIsXG4gICAgICAgICAgICB0eXBlOiBcInN0cmluZ1wiLFxuICAgICAgICAgICAgZGVmYXVsdDogXCJcIixcbiAgICAgICAgICAgIG9yZGVyOiAyXG4gICAgICAgIH0sXG4gICAgICAgIFwibm9kZUNvbW1hbmRcIjoge1xuICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiVGhlIGNvbW1hbmQgdG8gcnVuIHRvIGV4ZWN1dGUgbm9kZS5qc1wiLFxuICAgICAgICAgICAgdHlwZTogXCJzdHJpbmdcIixcbiAgICAgICAgICAgIGRlZmF1bHQ6IFwibm9kZVwiLFxuICAgICAgICAgICAgb3JkZXI6IDNcbiAgICAgICAgfSxcbiAgICAgICAgXCJ0ZXJtaW5hbENvbW1hbmRcIjoge1xuICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiVGhlIGNvbW1hbmQgdG8gcnVuIHRvIGxhdW5jaCBhIHRlcm1pbmFsLCB3aGVyZSB0aGUgY29tbWFuZCBsYXVuY2hlZCBpbiB0aGUgdGVybWluYWwgaXMgYCVzYC5cIixcbiAgICAgICAgICAgIHR5cGU6IFwic3RyaW5nXCIsXG4gICAgICAgICAgICBkZWZhdWx0OiBnZXRUZXJtaW5hbENvbW1hbmQoKSxcbiAgICAgICAgICAgIG9yZGVyOiA0XG4gICAgICAgIH0sXG4gICAgICAgIFwiY2xpY2tHdXR0ZXJUb1RvZ2dsZUJyZWFrcG9pbnRcIjoge1xuICAgICAgICAgICAgdHlwZTogXCJib29sZWFuXCIsXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJJbnNlcnQgYSBicmVha3BvaW50IHdoZW4gdGhlIGd1dHRlciBpcyBjbGlja2VkIGluIGEgaGFza2VsbCBzb3VyY2UgZmlsZVwiLFxuICAgICAgICAgICAgZGVmYXVsdDogdHJ1ZSxcbiAgICAgICAgICAgIG9yZGVyOiA1XG4gICAgICAgIH0sXG4gICAgICAgIFwic2hvd1Rlcm1pbmFsXCI6IHtcbiAgICAgICAgICAgIHR5cGU6IFwiYm9vbGVhblwiLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiU2hvdyBhIHRlcm1pbmFsIHdpdGggYGdoY2lgIHJ1bm5pbmcgd2hlbiBkZWJ1Z2dpbmdcIixcbiAgICAgICAgICAgIGRlZmF1bHQ6IHRydWUsXG4gICAgICAgICAgICBvcmRlcjogNlxuICAgICAgICB9LFxuICAgICAgICBcImZ1bmN0aW9uVG9EZWJ1Z1wiOiB7XG4gICAgICAgICAgICB0eXBlOiBcInN0cmluZ1wiLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiVGhlIGZ1bmN0aW9uIHRvIHJ1biB3aGVuIGRlYnVnZ2luZ1wiLFxuICAgICAgICAgICAgZGVmYXVsdDogXCJtYWluXCIsXG4gICAgICAgICAgICBvcmRlcjogN1xuICAgICAgICB9LFxuICAgICAgICBcImJyZWFrT25FeGNlcHRpb25cIjoge1xuICAgICAgICAgICAgZGVzY3JpcHRpb246IGBXaGV0aGVyIHRvIGJyZWFrIG9uIGV4Y2VwdGlvbnMsIGVycm9ycyBvciBuZWl0aGVyLlxuICAgICAgICAgICAgICAgIE5vdGU6IGJyZWFraW5nIG9uIGV4Y2VwdGlvbiBtYXkgY2F1c2UgdGhlIGRlYnVnZ2VyIHRvIGZyZWV6ZSBpbiBzb21lIGluc3RhbmNlcy4gU2VlIFsjM10oaHR0cHM6Ly9naXRodWIuY29tL1Rob21hc0hpY2ttYW4vaGFza2VsbC1kZWJ1Zy9pc3N1ZXMvMylgLFxuICAgICAgICAgICAgdHlwZTogXCJzdHJpbmdcIixcbiAgICAgICAgICAgIGRlZmF1bHQ6IFwibm9uZVwiLFxuICAgICAgICAgICAgZW51bTogZGVidWdNb2RlcyxcbiAgICAgICAgICAgIG9yZGVyOiA4XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB2YXIgdXBpOiBoYXNrZWxsSWRlLkhhc2tlbGxVUEk7XG5cbiAgICBleHBvcnQgZnVuY3Rpb24gY29uc3VtZUhhc2tlbGxVcGkodXBpQ29udGFpbmVyOiBoYXNrZWxsSWRlLkhhc2tlbGxVUElDb250YWluZXIpe1xuICAgICAgICB2YXIgcGx1Z2luRGlzcG9zYWJsZSA9IG5ldyBhdG9tQVBJLkNvbXBvc2l0ZURpc3Bvc2FibGUoKTtcbiAgICAgICAgdmFyIF91cGkgPSB1cGlDb250YWluZXIucmVnaXN0ZXJQbHVnaW4ocGx1Z2luRGlzcG9zYWJsZSwgXCJoYXNrZWxsLWRlYnVnXCIpO1xuICAgICAgICB0b29sdGlwT3ZlcnJpZGUuY29uc3VtZUhhc2tlbGxVcGkoX3VwaSk7XG4gICAgICAgIHVwaSA9IF91cGk7XG4gICAgfVxufVxuXG5leHBvcnQgPSBNYWluXG4iXX0=