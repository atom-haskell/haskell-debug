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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9saWIvbWFpbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFDQSwrQ0FBZ0Q7QUFDaEQscURBQXNEO0FBRXRELGdDQUFpQztBQUNqQyx5QkFBMEI7QUFDMUIsNkJBQThCO0FBQzlCLG9DQUFxQztBQUdyQyxJQUFPLElBQUksQ0E2T1Y7QUE3T0QsV0FBTyxJQUFJO0lBQ0ksaUJBQVksR0FBRyxJQUFJLFlBQVksRUFBRSxDQUFDO0lBQ2xDLGNBQVMsR0FBYSxJQUFJLENBQUM7SUFDM0Isb0JBQWUsR0FBRyxJQUFJLGVBQWUsQ0FBQyxDQUFPLFVBQVU7UUFDOUQsRUFBRSxDQUFBLENBQUMsS0FBQSxTQUFTLEtBQUssSUFBSSxDQUFDO1lBQUMsTUFBTSxDQUFDLElBQUksQ0FBQTtRQUNsQyxNQUFNLENBQUMsS0FBQSxTQUFTLENBQUMsaUJBQWlCLENBQUMsVUFBVSxDQUFDLENBQUM7SUFDbkQsQ0FBQyxDQUFBLENBQUMsQ0FBQztJQUVRLGFBQVEsR0FBRztRQUNsQixZQUFZLEVBQUUsSUFBSTtLQUNyQixDQUFBO0lBRVUsYUFBUSxHQUFHO1FBQ2xCLE9BQU8sRUFBRTtZQUNMLElBQUksUUFBUSxHQUFHLE9BQU8sQ0FBQyxZQUFZLENBQUMsQ0FBQztZQUVyQyxHQUFHLENBQUMsY0FBYyxDQUFDLG1CQUFtQixFQUFFLFNBQVMsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFO2dCQUN0RCxLQUFBLFNBQVMsR0FBRyxJQUFJLFFBQVEsQ0FBQyxLQUFBLFlBQVksQ0FBQyxXQUFXLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ2hFLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQztnQkFDTCxLQUFBLFNBQVMsR0FBRyxJQUFJLFFBQVEsQ0FBQyxLQUFBLFlBQVksQ0FBQyxXQUFXLENBQUMsQ0FBQztZQUN2RCxDQUFDLENBQUMsQ0FBQTtRQUNOLENBQUM7UUFDRCxZQUFZ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QUFPLEVBQUUsSUFBSTtZQUNiLEtBQUssRUFBRSxDQUFDO1NBQ1g7UUFDRCxjQUFjLEVBQUU7WUFDWixJQUFJLEVBQUUsU0FBUztZQUNmLFdBQVcsRUFBRSxvREFBb0Q7WUFDakUsT0FBTyxFQUFFLElBQUk7WUFDYixLQUFLLEVBQUUsQ0FBQztTQUNYO1FBQ0QsaUJBQWlCLEVBQUU7WUFDZixJQUFJLEVBQUUsUUFBUTtZQUNkLFdBQVcsRUFBRSxvQ0FBb0M7WUFDakQsT0FBTyxFQUFFLE1BQU07WUFDZixLQUFLLEVBQUUsQ0FBQztTQUNYO1FBQ0Qsa0JBQWtCLEVBQUU7WUFDaEIsV0FBVyxFQUFFO2tLQUN5STtZQUN0SixJQUFJLEVBQUUsUUFBUTtZQUNkLE9BQU8sRUFBRSxNQUFNO1lBQ2YsSUFBSSxFQUFFLEtBQUEsVUFBVTtZQUNoQixLQUFLLEVBQUUsQ0FBQztTQUNYO0tBQ0osQ0FBQTtJQUVELElBQUksR0FBMEIsQ0FBQztJQUUvQiwyQkFBa0MsWUFBNEM7UUFDMUUsSUFBSSxnQkFBZ0IsR0FBRyxJQUFJLE9BQU8sQ0FBQyxtQkFBbUIsRUFBRSxDQUFDO1FBQ3pELElBQUksSUFBSSxHQUFHLFlBQVksQ0FBQyxjQUFjLENBQUMsZ0JBQWdCLEVBQUUsZUFBZSxDQUFDLENBQUM7UUFDMUUsS0FBQSxlQUFlLENBQUMsaUJBQWlCLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDeEMsR0FBRyxHQUFHLElBQUksQ0FBQztJQUNmLENBQUM7SUFMZSxzQkFBaUIsb0JBS2hDLENBQUE7QUFDTCxDQUFDLEVBN09NLElBQUksS0FBSixJQUFJLFFBNk9WO0FBRUQsaUJBQVMsSUFBSSxDQUFBIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IERlYnVnZ2VyID0gcmVxdWlyZShcIi4vRGVidWdnZXJcIik7XG5pbXBvcnQgQnJlYWtwb2ludFVJID0gcmVxdWlyZShcIi4vQnJlYWtwb2ludFVJXCIpO1xuaW1wb3J0IFRvb2x0aXBPdmVycmlkZSA9IHJlcXVpcmUoXCIuL1Rvb2x0aXBPdmVycmlkZVwiKTtcbmltcG9ydCBTZWxlY3REZWJ1Z01vZGVWaWV3ID0gcmVxdWlyZShcIi4vdmlld3MvU2VsZWN0RGVidWdNb2RlVmlld1wiKTtcbmltcG9ydCBhdG9tQVBJID0gcmVxdWlyZShcImF0b21cIik7XG5pbXBvcnQgb3MgPSByZXF1aXJlKFwib3NcIik7XG5pbXBvcnQgcGF0aCA9IHJlcXVpcmUoXCJwYXRoXCIpO1xuaW1wb3J0IGNwID0gcmVxdWlyZShcImNoaWxkX3Byb2Nlc3NcIik7XG5pbXBvcnQgKiBhcyBoYXNrZWxsSWRlIGZyb20gXCIuL2lkZS1oYXNrZWxsXCJcblxubW9kdWxlIE1haW4ge1xuICAgIGV4cG9ydCB2YXIgYnJlYWtwb2ludFVJID0gbmV3IEJyZWFrcG9pbnRVSSgpO1xuICAgIGV4cG9ydCB2YXIgZGVidWdnZXJfOiBEZWJ1Z2dlciA9IG51bGw7XG4gICAgZXhwb3J0IHZhciB0b29sdGlwT3ZlcnJpZGUgPSBuZXcgVG9vbHRpcE92ZXJyaWRlKGFzeW5jIChleHByZXNzaW9uKSA9PiB7XG4gICAgICAgIGlmKGRlYnVnZ2VyXyA9PT0gbnVsbCkgcmV0dXJuIG51bGxcbiAgICAgICAgcmV0dXJuIGRlYnVnZ2VyXy5yZXNvbHZlRXhwcmVzc2lvbihleHByZXNzaW9uKTtcbiAgICB9KTtcblxuICAgIGV4cG9ydCB2YXIgc2V0dGluZ3MgPSB7XG4gICAgICAgIGJyZWFrT25FcnJvcjogdHJ1ZVxuICAgIH1cblxuICAgIGV4cG9ydCB2YXIgY29tbWFuZHMgPSB7XG4gICAgICAgIFwiZGVidWdcIjogKCkgPT4ge1xuICAgICAgICAgICAgdmFyIERlYnVnZ2VyID0gcmVxdWlyZShcIi4vRGVidWdnZXJcIik7XG5cbiAgICAgICAgICAgIHVwaS5nZXRDb25maWdQYXJhbShcImlkZS1oYXNrZWxsLWNhYmFsXCIsIFwiYnVpbGRlclwiKS50aGVuKG9iID0+IHtcbiAgICAgICAgICAgICAgICBkZWJ1Z2dlcl8gPSBuZXcgRGVidWdnZXIoYnJlYWtwb2ludFVJLmJyZWFrcG9pbnRzLCBvYi5uYW1lKTtcbiAgICAgICAgICAgIH0pLmNhdGNoKCgpID0+IHtcbiAgICAgICAgICAgICAgICBkZWJ1Z2dlcl8gPSBuZXcgRGVidWdnZXIoYnJlYWtwb2ludFVJLmJyZWFrcG9pbnRzKTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH0sXG4gICAgICAgIFwiZGVidWctYmFja1wiOiAoKSA9PiB7XG4gICAgICAgICAgICBpZihkZWJ1Z2dlcl8gIT0gbnVsbCl7XG4gICAgICAgICAgICAgICAgZGVidWdnZXJfLmJhY2soKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgXCJkZWJ1Zy1mb3J3YXJkXCI6ICgpID0+IHtcbiAgICAgICAgICAgIGlmKGRlYnVnZ2VyXyAhPSBudWxsKXtcbiAgICAgICAgICAgICAgICBkZWJ1Z2dlcl8uZm9yd2FyZCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBcImRlYnVnLXN0ZXBcIjogKCkgPT4ge1xuICAgICAgICAgICAgaWYoZGVidWdnZXJfICE9IG51bGwpe1xuICAgICAgICAgICAgICAgIGRlYnVnZ2VyXy5zdGVwKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIFwiZGVidWctc3RvcFwiOiAoKSA9PiB7XG4gICAgICAgICAgICBpZihkZWJ1Z2dlcl8gIT0gbnVsbCl7XG4gICAgICAgICAgICAgICAgZGVidWdnZXJfLnN0b3AoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgXCJkZWJ1Zy1jb250aW51ZVwiOiAoKSA9PiB7XG4gICAgICAgICAgICBpZihkZWJ1Z2dlcl8gIT0gbnVsbCl7XG4gICAgICAgICAgICAgICAgZGVidWdnZXJfLmNvbnRpbnVlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIFwidG9nZ2xlLWJyZWFrcG9pbnRcIjogKCkgPT4ge1xuICAgICAgICAgICAgdmFyIHRlID0gYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlVGV4dEVkaXRvcigpO1xuXG4gICAgICAgICAgICBicmVha3BvaW50VUkudG9nZ2xlQnJlYWtwb2ludChcbiAgICAgICAgICAgICAgICB0ZS5nZXRDdXJzb3JCdWZmZXJQb3NpdGlvbigpLnJvdyxcbiAgICAgICAgICAgICAgICB0ZVxuICAgICAgICAgICAgKTtcbiAgICAgICAgfSxcbiAgICAgICAgXCJzZXQtYnJlYWstb24tZXhjZXB0aW9uXCI6ICgpID0+IHtcbiAgICAgICAgICAgIHZhciBTZWxlY3REZWJ1Z01vZGVWaWV3ID0gcmVxdWlyZShcIi4vdmlld3MvU2VsZWN0RGVidWdNb2RlVmlld1wiKTtcbiAgICAgICAgICAgIHZhciB2aWV3ID0gbmV3IFNlbGVjdERlYnVnTW9kZVZpZXcoZGVidWdNb2RlcywgYXRvbS5jb25maWcuZ2V0KFwiaGFza2VsbC1kZWJ1Zy5icmVha09uRXhjZXB0aW9uXCIpKTtcblxuICAgICAgICAgICAgdmFyIHBhbmVsID0gYXRvbS53b3Jrc3BhY2UuYWRkTW9kYWxQYW5lbCh7XG4gICAgICAgICAgICAgICAgaXRlbTogdmlld1xuICAgICAgICAgICAgfSlcblxuICAgICAgICAgICAgdmlldy5mb2N1c0ZpbHRlckVkaXRvcigpO1xuXG4gICAgICAgICAgICB2aWV3LmVtaXR0ZXIub24oXCJzZWxlY3RlZFwiLCAoaXRlbTogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICAgICAgYXRvbS5jb25maWcuc2V0KFwiaGFza2VsbC1kZWJ1Zy5icmVha09uRXhjZXB0aW9uXCIsIGl0ZW0pO1xuICAgICAgICAgICAgfSlcblxuICAgICAgICAgICAgdmlldy5lbWl0dGVyLm9uKFwiY2FuY2VsZWRcIiwgKCkgPT4ge1xuICAgICAgICAgICAgICAgIHBhbmVsLmRlc3Ryb3koKTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBleHBvcnQgZnVuY3Rpb24gb25GaXJzdFJ1bigpe1xuICAgICAgICBzdGF0ZSA9IHtcbiAgICAgICAgICAgIHByb3Blcmx5QWN0aXZhdGVkOiBmYWxzZVxuICAgICAgICB9O1xuXG4gICAgICAgIC8vIGZyb20gaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8zNDk1MzE2OC9ub2RlLWNoZWNrLWV4aXN0ZW5jZS1vZi1jb21tYW5kLWluLXBhdGhcbiAgICAgICAgdmFyIGlzV2luID0gb3MucGxhdGZvcm0oKS5pbmRleE9mKCd3aW4nKSA+IC0xO1xuICAgICAgICB2YXIgd2hlcmUgPSBpc1dpbiA/ICd3aGVyZScgOiAnd2hlcmVpcyc7XG5cbiAgICAgICAgdmFyIG91dCA9IGNwLmV4ZWMod2hlcmUgKyAnIG5vZGUnKTtcblxuICAgICAgICBvdXQub24oJ2Nsb3NlJywgZnVuY3Rpb24gKGNvZGUpIHtcbiAgICAgICAgICAgIGlmKGNvZGUgPT0gMSl7Ly8gbm90IGZvdW5kXG4gICAgICAgICAgICAgICAgLy8gZmFsbGJhY2sgdG8gdGhlIG5vZGUgaW4gYXBtXG4gICAgICAgICAgICAgICAgYXRvbS5jb25maWcuc2V0KFwiaGFza2VsbC1kZWJ1Zy5ub2RlQ29tbWFuZFwiLCBwYXRoLnJlc29sdmUoYXRvbS5wYWNrYWdlcy5nZXRBcG1QYXRoKCksIFwiLi4vLi4vYmluL2F0b21cIikpO1xuICAgICAgICAgICAgICAgIHN0YXRlLnByb3Blcmx5QWN0aXZhdGVkID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgaW50ZXJmYWNlIEhhc2tlbGxEZWJ1Z1N0YXRle1xuICAgICAgICBwcm9wZXJseUFjdGl2YXRlZDogYm9vbGVhblxuICAgIH1cblxuICAgIGV4cG9ydCB2YXIgc3RhdGU6IEhhc2tlbGxEZWJ1Z1N0YXRlO1xuXG4gICAgZXhwb3J0IGZ1bmN0aW9uIGFjdGl2YXRlKF9zdGF0ZT86IEhhc2tlbGxEZWJ1Z1N0YXRlKXtcbiAgICAgICAgc3RhdGUgPSBfc3RhdGU7XG5cbiAgICAgICAgaWYoc3RhdGUgPT09IHVuZGVmaW5lZCB8fCBzdGF0ZS5wcm9wZXJseUFjdGl2YXRlZCAhPT0gdHJ1ZSl7XG4gICAgICAgICAgICBvbkZpcnN0UnVuKCk7XG4gICAgICAgIH1cbiAgICAgICAgYXRvbS53b3Jrc3BhY2Uub2JzZXJ2ZUFjdGl2ZVBhbmVJdGVtKChwYW5lKSA9PiB7XG4gICAgICAgICAgICBpZihhdG9tLndvcmtzcGFjZS5pc1RleHRFZGl0b3IocGFuZSkpe1xuICAgICAgICAgICAgICAgIHZhciB0ZTogQXRvbUNvcmUuSUVkaXRvciA9IHBhbmU7XG4gICAgICAgICAgICAgICAgdmFyIHNjb3BlcyA9IHRlLmdldFJvb3RTY29wZURlc2NyaXB0b3IoKS5zY29wZXM7XG4gICAgICAgICAgICAgICAgaWYoc2NvcGVzLmxlbmd0aCA9PSAxICYmIHNjb3Blc1swXSA9PSBcInNvdXJjZS5oYXNrZWxsXCIpe1xuICAgICAgICAgICAgICAgICAgICBpZighdGVbXCJoYXNIYXNrZWxsQnJlYWtwb2ludHNcIl0pe1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWtwb2ludFVJLmF0dGFjaFRvTmV3VGV4dEVkaXRvcih0ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0ZVtcImhhc0hhc2tlbGxCcmVha3BvaW50c1wiXSA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBpZihkZWJ1Z2dlcl8gIT0gbnVsbCl7XG4gICAgICAgICAgICAgICAgICAgICAgICBkZWJ1Z2dlcl8uc2hvd1BhbmVscygpO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuOyAgLy8gZG9uJ3QgZG8gYmVsb3dcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIGlmIGFueSBwYW5lIHRoYXQgaXNuJ3QgYSBoYXNrZWxsIHNvdXJjZSBmaWxlIGFuZCB3ZSdyZSBkZWJ1Z2dpbmdcbiAgICAgICAgICAgIGlmKGRlYnVnZ2VyXyAhPSBudWxsKXtcbiAgICAgICAgICAgICAgICBkZWJ1Z2dlcl8uaGlkZVBhbmVscygpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KVxuXG4gICAgICAgIGZvcih2YXIgY29tbWFuZCBvZiBPYmplY3Qua2V5cyhjb21tYW5kcykpe1xuICAgICAgICAgICAgYXRvbS5jb21tYW5kcy5hZGQoXCJhdG9tLXRleHQtZWRpdG9yW2RhdGEtZ3JhbW1hcj0nc291cmNlIGhhc2tlbGwnXVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJoYXNrZWxsOlwiICsgY29tbWFuZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbW1hbmRzW2NvbW1hbmRdKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGV4cG9ydCBmdW5jdGlvbiBzZXJpYWxpemUoKXtcbiAgICAgICAgcmV0dXJuIHN0YXRlO1xuICAgIH1cblxuICAgIGV4cG9ydCB2YXIgZGVidWdNb2RlcyA9IFtcbiAgICAgICAge3ZhbHVlOiBcIm5vbmVcIiwgZGVzY3JpcHRpb246ICdEb25cXCd0IHBhdXNlIG9uIGFueSBleGNlcHRpb25zJ30sXG4gICAgICAgIHt2YWx1ZTogXCJlcnJvcnNcIiwgZGVzY3JpcHRpb246ICdQYXVzZSBvbiBlcnJvcnMgKHVuY2F1Z2h0IGV4Y2VwdGlvbnMpJ30sXG4gICAgICAgIHt2YWx1ZTogXCJleGNlcHRpb25zXCIsIGRlc2NyaXB0aW9uOiAnUGF1c2Ugb24gZXhjZXB0aW9ucyd9LFxuICAgIF1cblxuICAgIGV4cG9ydCBmdW5jdGlvbiBnZXRUZXJtaW5hbENvbW1hbmQoKXtcbiAgICAgICAgaWYob3MudHlwZSgpID09IFwiV2luZG93c19OVFwiKXtcbiAgICAgICAgICAgIHJldHVybiBcInN0YXJ0ICVzXCJcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmKG9zLnR5cGUoKSA9PSBcIkxpbnV4XCIpe1xuICAgICAgICAgICAgcmV0dXJuIGB4LXRlcm1pbmFsLWVtdWxhdG9yIC1lIFwiYmFzaCAtYyBcXFxcXCIlc1xcXFxcIlwiYFxuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYob3MudHlwZSgpID09IFwiRGFyd2luXCIpe1xuICAgICAgICAgICAgcmV0dXJuIGBvc2FzY3JpcHQgLWUgJ3RlbGwgYXBwIFwiVGVybWluYWxcIiB0byBkbyBzY3JpcHQgXCIlc1wiJ2BcbiAgICAgICAgfVxuICAgICAgICBlbHNle1xuICAgICAgICAgICAgLy8gbm90IHJlY29nbmlzZWQsIGhvcGUgeHRlcm0gd29ya3NcbiAgICAgICAgICAgIHJldHVybiBgeHRlcm0gLWUgXCJiYXNoIC1jIFxcXFxcIiVzXFxcXFwiXCJgXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBleHBvcnQgdmFyIGNvbmZpZyA9IHtcbiAgICAgICAgXCJ1c2VJZGVIYXNrZWxsQ2FiYWxCdWlsZGVyXCI6IHtcbiAgICAgICAgICAgIHRpdGxlOiBcIlVzZSBpZGUtaGFza2VsbC1jYWJhbCBidWlsZGVyXCIsXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJVc2UgdGhlIGlkZS1oYXNrZWxsLWNhYmFsIGJ1aWxkZXIncyBjb21tYW5kIHdoZW4gcnVubmluZyBnaGNpIC0gXCIgK1xuICAgICAgICAgICAgICAgIFwid2lsbCBydW4gYHN0YWNrIGdoY2lgIHdoZW4gc3RhY2sgaXMgdGhlIGJ1aWxkZXIsIGBjYWJhbCByZXBsYCBmb3IgY2FiYWwgYW5kIFwiICtcbiAgICAgICAgICAgICAgICBcImBnaGNpYCBmb3Igbm9uZVwiLFxuICAgICAgICAgICAgZGVmYXVsdDogdHJ1ZSxcbiAgICAgICAgICAgIHR5cGU6IFwiYm9vbGVhblwiLFxuICAgICAgICAgICAgb3JkZXI6IDBcbiAgICAgICAgfSxcbiAgICAgICAgXCJHSENJQ29tbWFuZFwiOiB7XG4gICAgICAgICAgICB0aXRsZTogXCJHSENJIENvbW1hbmRcIixcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIlRoZSBjb21tYW5kIHRvIHJ1biB0byBleGVjdXRlIGBnaGNpYCwgdGhpcyB3aWxsIGdldCBpZ25vcmUgaWYgdGhlXCIgK1xuICAgICAgICAgICAgICAgIFwiIHByZXZpb3VzIHNldHRpbmcgaXMgc2V0IHRvIHRydWVcIixcbiAgICAgICAgICAgIHR5cGU6IFwic3RyaW5nXCIsXG4gICAgICAgICAgICBkZWZhdWx0OiBcImdoY2lcIixcbiAgICAgICAgICAgIG9yZGVyOiAxXG4gICAgICAgIH0sXG4gICAgICAgIFwiR0hDSUFyZ3VtZW50c1wiOiB7XG4gICAgICAgICAgICB0aXRsZTogXCJHSENJIEFyZ3VtZW50c1wiLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiQXJndW1lbnRzIHRvIGdpdmUgdG8gYGdoY2lgLCBzZXBhcmF0ZWQgYnkgYSBzcGFjZVwiLFxuICAgICAgICAgICAgdHlwZTogXCJzdHJpbmdcIixcbiAgICAgICAgICAgIGRlZmF1bHQ6IFwiXCIsXG4gICAgICAgICAgICBvcmRlcjogMlxuICAgICAgICB9LFxuICAgICAgICBcIm5vZGVDb21tYW5kXCI6IHtcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIlRoZSBjb21tYW5kIHRvIHJ1biB0byBleGVjdXRlIG5vZGUuanNcIixcbiAgICAgICAgICAgIHR5cGU6IFwic3RyaW5nXCIsXG4gICAgICAgICAgICBkZWZhdWx0OiBcIm5vZGVcIixcbiAgICAgICAgICAgIG9yZGVyOiAzXG4gICAgICAgIH0sXG4gICAgICAgIFwidGVybWluYWxDb21tYW5kXCI6IHtcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIlRoZSBjb21tYW5kIHRvIHJ1biB0byBsYXVuY2ggYSB0ZXJtaW5hbCwgd2hlcmUgdGhlIGNvbW1hbmQgbGF1bmNoZWQgaW4gdGhlIHRlcm1pbmFsIGlzIGAlc2AuXCIsXG4gICAgICAgICAgICB0eXBlOiBcInN0cmluZ1wiLFxuICAgICAgICAgICAgZGVmYXVsdDogZ2V0VGVybWluYWxDb21tYW5kKCksXG4gICAgICAgICAgICBvcmRlcjogNFxuICAgICAgICB9LFxuICAgICAgICBcImNsaWNrR3V0dGVyVG9Ub2dnbGVCcmVha3BvaW50XCI6IHtcbiAgICAgICAgICAgIHR5cGU6IFwiYm9vbGVhblwiLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiSW5zZXJ0IGEgYnJlYWtwb2ludCB3aGVuIHRoZSBndXR0ZXIgaXMgY2xpY2tlZCBpbiBhIGhhc2tlbGwgc291cmNlIGZpbGVcIixcbiAgICAgICAgICAgIGRlZmF1bHQ6IHRydWUsXG4gICAgICAgICAgICBvcmRlcjogNVxuICAgICAgICB9LFxuICAgICAgICBcInNob3dUZXJtaW5hbFwiOiB7XG4gICAgICAgICAgICB0eXBlOiBcImJvb2xlYW5cIixcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIlNob3cgYSB0ZXJtaW5hbCB3aXRoIGBnaGNpYCBydW5uaW5nIHdoZW4gZGVidWdnaW5nXCIsXG4gICAgICAgICAgICBkZWZhdWx0OiB0cnVlLFxuICAgICAgICAgICAgb3JkZXI6IDZcbiAgICAgICAgfSxcbiAgICAgICAgXCJmdW5jdGlvblRvRGVidWdcIjoge1xuICAgICAgICAgICAgdHlwZTogXCJzdHJpbmdcIixcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIlRoZSBmdW5jdGlvbiB0byBydW4gd2hlbiBkZWJ1Z2dpbmdcIixcbiAgICAgICAgICAgIGRlZmF1bHQ6IFwibWFpblwiLFxuICAgICAgICAgICAgb3JkZXI6IDdcbiAgICAgICAgfSxcbiAgICAgICAgXCJicmVha09uRXhjZXB0aW9uXCI6IHtcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBgV2hldGhlciB0byBicmVhayBvbiBleGNlcHRpb25zLCBlcnJvcnMgb3IgbmVpdGhlci5cbiAgICAgICAgICAgICAgICBOb3RlOiBicmVha2luZyBvbiBleGNlcHRpb24gbWF5IGNhdXNlIHRoZSBkZWJ1Z2dlciB0byBmcmVlemUgaW4gc29tZSBpbnN0YW5jZXMuIFNlZSBbIzNdKGh0dHBzOi8vZ2l0aHViLmNvbS9UaG9tYXNIaWNrbWFuL2hhc2tlbGwtZGVidWcvaXNzdWVzLzMpYCxcbiAgICAgICAgICAgIHR5cGU6IFwic3RyaW5nXCIsXG4gICAgICAgICAgICBkZWZhdWx0OiBcIm5vbmVcIixcbiAgICAgICAgICAgIGVudW06IGRlYnVnTW9kZXMsXG4gICAgICAgICAgICBvcmRlcjogOFxuICAgICAgICB9XG4gICAgfVxuXG4gICAgdmFyIHVwaTogaGFza2VsbElkZS5IYXNrZWxsVVBJO1xuXG4gICAgZXhwb3J0IGZ1bmN0aW9uIGNvbnN1bWVIYXNrZWxsVXBpKHVwaUNvbnRhaW5lcjogaGFza2VsbElkZS5IYXNrZWxsVVBJQ29udGFpbmVyKXtcbiAgICAgICAgdmFyIHBsdWdpbkRpc3Bvc2FibGUgPSBuZXcgYXRvbUFQSS5Db21wb3NpdGVEaXNwb3NhYmxlKCk7XG4gICAgICAgIHZhciBfdXBpID0gdXBpQ29udGFpbmVyLnJlZ2lzdGVyUGx1Z2luKHBsdWdpbkRpc3Bvc2FibGUsIFwiaGFza2VsbC1kZWJ1Z1wiKTtcbiAgICAgICAgdG9vbHRpcE92ZXJyaWRlLmNvbnN1bWVIYXNrZWxsVXBpKF91cGkpO1xuICAgICAgICB1cGkgPSBfdXBpO1xuICAgIH1cbn1cblxuZXhwb3J0ID0gTWFpblxuIl19