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
const atomAPI = require("atom");
const GHCIDebug_1 = require("./GHCIDebug");
const DebugView_1 = require("./views/DebugView");
const CurrentVariablesView_1 = require("./views/CurrentVariablesView");
const HistoryState_1 = require("./HistoryState");
const LineHighlighter_1 = require("./LineHighlighter");
const TerminalReporter_1 = require("./TerminalReporter");
const path = require("path");
class Debugger {
    constructor(breakpoints, editor, ideCabalBuilderCommand) {
        this.editor = editor;
        this.ideCabalBuilderCommand = ideCabalBuilderCommand;
        this.lineHighlighter = new LineHighlighter_1.LineHighlighter();
        this.ghciDebug = new GHCIDebug_1.GHCIDebug(this.getGhciCommand(), this.getGhciArgs(), this.getWorkingFolder());
        this.debugView = new DebugView_1.DebugView();
        this.historyState = new HistoryState_1.HistoryState();
        this.currentVariablesView = new CurrentVariablesView_1.CurrentVariablesView();
        this.terminalReporter = new TerminalReporter_1.TerminalReporter();
        this.disposables = new atomAPI.CompositeDisposable();
        this.debuggerEnabled = false;
        this.executingCommandFromConsole = false;
        this.launchGHCIDebugAndConsole(breakpoints);
        this.displayGUI();
        this.disposables.add(atom.config.onDidChange('haskell-debug.breakOnException', ({ newValue }) => {
            this.ghciDebug.setExceptionBreakLevel(newValue);
        }));
    }
    resolveExpression(expression) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.ghciDebug.resolveExpression(expression);
        });
    }
    back() {
        if (this.historyState.setCurrentPosition(this.historyState.getCurrentPosition() + 1)) {
            this.ghciDebug.back();
        }
    }
    forward() {
        if (this.historyState.setCurrentPosition(this.historyState.getCurrentPosition() - 1)) {
            this.ghciDebug.forward();
        }
    }
    continue() {
        this.ghciDebug.continue();
    }
    step() {
        this.ghciDebug.step();
    }
    stop() {
        this.ghciDebug.stop();
    }
    hidePanels() {
        this.debugPanel.hide();
        this.currentVariablesPanel.hide();
    }
    showPanels() {
        this.debugPanel.show();
        this.currentVariablesPanel.show();
    }
    getGhciCommand() {
        if (atom.config.get('haskell-debug.useIdeHaskellCabalBuilder')) {
            switch (this.ideCabalBuilderCommand) {
                case 'cabal':
                    return 'cabal';
                case 'stack':
                    return 'stack';
                default:
                    return atom.config.get('haskell-debug.GHCICommand');
            }
        }
        return atom.config.get('haskell-debug.GHCICommand');
    }
    getGhciArgs() {
        const args = [];
        const ghciArgs = atom.config.get('haskell-debug.GHCIArguments');
        if (atom.config.get('haskell-debug.useIdeHaskellCabalBuilder')) {
            switch (this.ideCabalBuilderCommand) {
                case 'cabal':
                    args.push('repl');
                    break;
                case 'stack':
                    args.push('ghci');
                    break;
            }
        }
        if (ghciArgs.length > 0
            && (this.ideCabalBuilderCommand === 'cabal'
                || this.ideCabalBuilderCommand === 'stack')) {
            return args.concat(`--ghc-options="${atom.config.get('haskell-debug.GHCIArguments')}"`);
        }
        else {
            return args.concat(atom.config.get('haskell-debug.GHCIArguments').split(' '));
        }
    }
    destroy() {
        this.lineHighlighter.destroy();
        this.ghciDebug.destroy();
        this.debugView.destroy();
        this.debugPanel.destroy();
        this.currentVariablesPanel.destroy();
        this.currentVariablesView.destroy();
        this.terminalReporter.destroy();
        this.disposables.dispose();
    }
    displayGUI() {
        this.debugPanel = atom.workspace.addTopPanel({
            item: this.debugView.element,
        });
        this.debugView.on('step', () => this.step());
        this.debugView.on('back', () => this.back());
        this.debugView.on('forward', () => this.forward());
        this.debugView.on('continue', () => this.continue());
        this.debugView.on('stop', () => this.stop());
        this.currentVariablesPanel = atom.workspace.addTopPanel({
            item: this.currentVariablesView.element,
        });
    }
    updateHistoryLengthAndEnableButtons(historyLength) {
        if (historyLength !== undefined) {
            this.historyState.setMaxPosition(historyLength);
        }
        this.debugView.enableAllDebugButtons();
        this.debugView.setButtonEnabled('back', this.historyState.backEnabled);
        this.debugView.setButtonEnabled('forward', this.historyState.forwardEnabled);
        this.debuggerEnabled = true;
    }
    launchGHCIDebugAndConsole(breakpoints) {
        return __awaiter(this, void 0, void 0, function* () {
            this.ghciDebug.on('line-changed', (info) => {
                this.lineHighlighter.hightlightLine(info);
                this.updateHistoryLengthAndEnableButtons(info.historyLength);
                this.currentVariablesView.update(info.localBindings, false);
            });
            this.ghciDebug.on('paused-on-exception', (info) => {
                this.lineHighlighter.destroy();
                this.updateHistoryLengthAndEnableButtons(info.historyLength);
                this.currentVariablesView.update(info.localBindings, true);
            });
            this.ghciDebug.on('debug-finished', () => {
                this.destroy();
            });
            this.ghciDebug.on('command-issued', (command) => {
                if (!this.executingCommandFromConsole) {
                    this.terminalReporter.displayCommand(command);
                }
                this.debuggerEnabled = false;
                setTimeout(() => {
                    if (!this.debuggerEnabled) {
                        this.debugView.disableAllDebugButtons();
                    }
                }, 100);
            });
            this.ghciDebug.on('console-output', (output) => {
                this.terminalReporter.write(output);
            });
            this.ghciDebug.on('error-completed', (errorText) => {
                if (!this.executingCommandFromConsole) {
                    atom.notifications.addError('GHCI Error', {
                        detail: errorText,
                        dismissable: true,
                    });
                }
            });
            this.ghciDebug.on('error', (errorText) => {
                this.terminalReporter.write(errorText);
            });
            yield this.ghciDebug.addedAllListeners();
            this.terminalReporter.on('command', (command) => __awaiter(this, void 0, void 0, function* () {
                this.executingCommandFromConsole = true;
                yield this.ghciDebug.run(command, true, true);
                this.executingCommandFromConsole = false;
            }));
            this.terminalReporter.on('close', () => {
                this.ghciDebug.stop();
            });
            this.ghciDebug.setExceptionBreakLevel(atom.config.get('haskell-debug.breakOnException'));
            this.debugView.disableAllDebugButtons();
            const fileToDebug = this.editor.getPath();
            this.ghciDebug.loadModule(fileToDebug);
            breakpoints.forEach((ob) => {
                if (ob.file === fileToDebug) {
                    this.ghciDebug.addBreakpoint(ob.line.toString());
                }
                else {
                    this.ghciDebug.addBreakpoint(ob);
                }
            });
            this.ghciDebug.startDebug(atom.config.get('haskell-debug.functionToDebug'));
        });
    }
    getWorkingFolder() {
        const fileToDebug = this.editor.getPath();
        return path.dirname(fileToDebug);
    }
}
exports.Debugger = Debugger;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRGVidWdnZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvbGliL0RlYnVnZ2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7QUFBQSxnQ0FBK0I7QUFDL0IsMkNBQWlFO0FBQ2pFLGlEQUE2QztBQUM3Qyx1RUFBbUU7QUFDbkUsaURBQTZDO0FBQzdDLHVEQUFtRDtBQUNuRCx5REFBcUQ7QUFDckQsNkJBQTZCO0FBRTdCO0lBZUUsWUFDRSxXQUF5QixFQUNqQixNQUEwQixFQUMxQixzQkFBK0I7UUFEL0IsV0FBTSxHQUFOLE1BQU0sQ0FBb0I7UUFDMUIsMkJBQXNCLEdBQXRCLHNCQUFzQixDQUFTO1FBakJ4QixvQkFBZSxHQUFHLElBQUksaUNBQWUsRUFBRSxDQUFBO1FBQ3ZDLGNBQVMsR0FBRyxJQUFJLHFCQUFTLENBQUMsSUFBSSxDQUFDLGNBQWMsRUFBRSxFQUFFLElBQUksQ0FBQyxXQUFXLEVBQUUsRUFBRSxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQyxDQUFBO1FBQzdGLGNBQVMsR0FBRyxJQUFJLHFCQUFTLEVBQUUsQ0FBQTtRQUMzQixpQkFBWSxHQUFHLElBQUksMkJBQVksRUFBRSxDQUFBO1FBR2pDLHlCQUFvQixHQUFHLElBQUksMkNBQW9CLEVBQUUsQ0FBQTtRQUdqRCxxQkFBZ0IsR0FBRyxJQUFJLG1DQUFnQixFQUFFLENBQUE7UUFDekMsZ0JBQVcsR0FBRyxJQUFJLE9BQU8sQ0FBQyxtQkFBbUIsRUFBRSxDQUFBO1FBQ3hELG9CQUFlLEdBQUcsS0FBSyxDQUFBO1FBQ3ZCLGdDQUEyQixHQUFHLEtBQUssQ0FBQTtRQU96QyxJQUFJLENBQUMseUJBQXlCLENBQUMsV0FBVyxDQUFDLENBQUE7UUFDM0MsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFBO1FBQ2pCLElBQUksQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUFDLGdDQUFnQyxFQUFFLENBQUMsRUFB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c0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgYXRvbUFQSSBmcm9tICdhdG9tJ1xuaW1wb3J0IHsgR0hDSURlYnVnLCBCcmVha0luZm8sIEV4Y2VwdGlvbkluZm8gfSBmcm9tICcuL0dIQ0lEZWJ1ZydcbmltcG9ydCB7IERlYnVnVmlldyB9IGZyb20gJy4vdmlld3MvRGVidWdWaWV3J1xuaW1wb3J0IHsgQ3VycmVudFZhcmlhYmxlc1ZpZXcgfSBmcm9tICcuL3ZpZXdzL0N1cnJlbnRWYXJpYWJsZXNWaWV3J1xuaW1wb3J0IHsgSGlzdG9yeVN0YXRlIH0gZnJvbSAnLi9IaXN0b3J5U3RhdGUnXG5pbXBvcnQgeyBMaW5lSGlnaGxpZ2h0ZXIgfSBmcm9tICcuL0xpbmVIaWdobGlnaHRlcidcbmltcG9ydCB7IFRlcm1pbmFsUmVwb3J0ZXIgfSBmcm9tICcuL1Rlcm1pbmFsUmVwb3J0ZXInXG5pbXBvcnQgcGF0aCA9IHJlcXVpcmUoJ3BhdGgnKVxuXG5leHBvcnQgY2xhc3MgRGVidWdnZXIge1xuICBwcml2YXRlIHJlYWRvbmx5IGxpbmVIaWdobGlnaHRlciA9IG5ldyBMaW5lSGlnaGxpZ2h0ZXIoKVxuICBwcml2YXRlIHJlYWRvbmx5IGdoY2lEZWJ1ZyA9IG5ldyBHSENJRGVidWcodGhpcy5nZXRHaGNpQ29tbWFuZCgpLCB0aGlzLmdldEdoY2lBcmdzKCksIHRoaXMuZ2V0V29ya2luZ0ZvbGRlcigpKVxuICBwcml2YXRlIHJlYWRvbmx5IGRlYnVnVmlldyA9IG5ldyBEZWJ1Z1ZpZXcoKVxuICBwcml2YXRlIHJlYWRvbmx5IGhpc3RvcnlTdGF0ZSA9IG5ldyBIaXN0b3J5U3RhdGUoKVxuICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6IG5vLXVuaW5pdGlhbGl6ZWRcbiAgcHJpdmF0ZSBkZWJ1Z1BhbmVsOiBhdG9tQVBJLlBhbmVsPEhUTUxFbGVtZW50PlxuICBwcml2YXRlIHJlYWRvbmx5IGN1cnJlbnRWYXJpYWJsZXNWaWV3ID0gbmV3IEN1cnJlbnRWYXJpYWJsZXNWaWV3KClcbiAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOiBuby11bmluaXRpYWxpemVkXG4gIHByaXZhdGUgY3VycmVudFZhcmlhYmxlc1BhbmVsOiBhdG9tQVBJLlBhbmVsPEhUTUxFbGVtZW50PlxuICBwcml2YXRlIHJlYWRvbmx5IHRlcm1pbmFsUmVwb3J0ZXIgPSBuZXcgVGVybWluYWxSZXBvcnRlcigpXG4gIHByaXZhdGUgcmVhZG9ubHkgZGlzcG9zYWJsZXMgPSBuZXcgYXRvbUFQSS5Db21wb3NpdGVEaXNwb3NhYmxlKClcbiAgcHJpdmF0ZSBkZWJ1Z2dlckVuYWJsZWQgPSBmYWxzZVxuICBwcml2YXRlIGV4ZWN1dGluZ0NvbW1hbmRGcm9tQ29uc29sZSA9IGZhbHNlXG5cbiAgY29uc3RydWN0b3IoXG4gICAgYnJlYWtwb2ludHM6IEJyZWFrcG9pbnRbXSxcbiAgICBwcml2YXRlIGVkaXRvcjogYXRvbUFQSS5UZXh0RWRpdG9yLFxuICAgIHByaXZhdGUgaWRlQ2FiYWxCdWlsZGVyQ29tbWFuZD86IHN0cmluZyxcbiAgKSB7XG4gICAgdGhpcy5sYXVuY2hHSENJRGVidWdBbmRDb25zb2xlKGJyZWFrcG9pbnRzKVxuICAgIHRoaXMuZGlzcGxheUdVSSgpXG4gICAgdGhpcy5kaXNwb3NhYmxlcy5hZGQoYXRvbS5jb25maWcub25EaWRDaGFuZ2UoJ2hhc2tlbGwtZGVidWcuYnJlYWtPbkV4Y2VwdGlvbicsICh7IG5ld1ZhbHVlIH0pID0+IHtcbiAgICAgIHRoaXMuZ2hjaURlYnVnLnNldEV4Y2VwdGlvbkJyZWFrTGV2ZWwobmV3VmFsdWUgYXMgRXhjZXB0aW9uQnJlYWtMZXZlbHMpXG4gICAgfSkpXG4gIH1cblxuICAvKiogRm9yIHRoZSB0b29sdGlwIG92ZXJyaWRlKi9cbiAgcHVibGljIGFzeW5jIHJlc29sdmVFeHByZXNzaW9uKGV4cHJlc3Npb246IHN0cmluZykge1xuICAgIHJldHVybiB0aGlzLmdoY2lEZWJ1Zy5yZXNvbHZlRXhwcmVzc2lvbihleHByZXNzaW9uKVxuICB9XG5cbiAgcHVibGljIGJhY2soKSB7XG4gICAgaWYgKHRoaXMuaGlzdG9yeVN0YXRlLnNldEN1cnJlbnRQb3NpdGlvbih0aGlzLmhpc3RvcnlTdGF0ZS5nZXRDdXJyZW50UG9zaXRpb24oKSArIDEpKSB7XG4gICAgICB0aGlzLmdoY2lEZWJ1Zy5iYWNrKClcbiAgICB9XG4gIH1cblxuICBwdWJsaWMgZm9yd2FyZCgpIHtcbiAgICBpZiAodGhpcy5oaXN0b3J5U3RhdGUuc2V0Q3VycmVudFBvc2l0aW9uKHRoaXMuaGlzdG9yeVN0YXRlLmdldEN1cnJlbnRQb3NpdGlvbigpIC0gMSkpIHtcbiAgICAgIHRoaXMuZ2hjaURlYnVnLmZvcndhcmQoKVxuICAgIH1cbiAgfVxuXG4gIHB1YmxpYyBjb250aW51ZSgpIHtcbiAgICB0aGlzLmdoY2lEZWJ1Zy5jb250aW51ZSgpXG4gIH1cblxuICBwdWJsaWMgc3RlcCgpIHtcbiAgICB0aGlzLmdoY2lEZWJ1Zy5zdGVwKClcbiAgfVxuXG4gIHB1YmxpYyBzdG9wKCkge1xuICAgIHRoaXMuZ2hjaURlYnVnLnN0b3AoKSAvLyB0aGlzIHdpbGwgdHJpZ2dlciBkZWJ1Zy1maW5pc2hlZCBldmVudFxuICB9XG5cbiAgcHVibGljIGhpZGVQYW5lbHMoKSB7XG4gICAgdGhpcy5kZWJ1Z1BhbmVsLmhpZGUoKVxuICAgIHRoaXMuY3VycmVudFZhcmlhYmxlc1BhbmVsLmhpZGUoKVxuICB9XG5cbiAgcHVibGljIHNob3dQYW5lbHMoKSB7XG4gICAgdGhpcy5kZWJ1Z1BhbmVsLnNob3coKVxuICAgIHRoaXMuY3VycmVudFZhcmlhYmxlc1BhbmVsLnNob3coKVxuICB9XG5cbiAgcHJpdmF0ZSBnZXRHaGNpQ29tbWFuZCgpIHtcbiAgICBpZiAoYXRvbS5jb25maWcuZ2V0KCdoYXNrZWxsLWRlYnVnLnVzZUlkZUhhc2tlbGxDYWJhbEJ1aWxkZXInKSkge1xuICAgICAgc3dpdGNoICh0aGlzLmlkZUNhYmFsQnVpbGRlckNvbW1hbmQpIHtcbiAgICAgICAgY2FzZSAnY2FiYWwnOlxuICAgICAgICAgIHJldHVybiAnY2FiYWwnXG4gICAgICAgIGNhc2UgJ3N0YWNrJzpcbiAgICAgICAgICByZXR1cm4gJ3N0YWNrJ1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIHJldHVybiBhdG9tLmNvbmZpZy5nZXQoJ2hhc2tlbGwtZGVidWcuR0hDSUNvbW1hbmQnKVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gYXRvbS5jb25maWcuZ2V0KCdoYXNrZWxsLWRlYnVnLkdIQ0lDb21tYW5kJylcbiAgfVxuXG4gIHByaXZhdGUgZ2V0R2hjaUFyZ3MoKSB7XG4gICAgY29uc3QgYXJnczogc3RyaW5nW10gPSBbXVxuICAgIGNvbnN0IGdoY2lBcmdzID0gYXRvbS5jb25maWcuZ2V0KCdoYXNrZWxsLWRlYnVnLkdIQ0lBcmd1bWVudHMnKVxuXG4gICAgaWYgKGF0b20uY29uZmlnLmdldCgnaGFza2VsbC1kZWJ1Zy51c2VJZGVIYXNrZWxsQ2FiYWxCdWlsZGVyJykpIHtcbiAgICAgIHN3aXRjaCAodGhpcy5pZGVDYWJhbEJ1aWxkZXJDb21tYW5kKSB7XG4gICAgICAgIGNhc2UgJ2NhYmFsJzpcbiAgICAgICAgICBhcmdzLnB1c2goJ3JlcGwnKVxuICAgICAgICAgIGJyZWFrXG4gICAgICAgIGNhc2UgJ3N0YWNrJzpcbiAgICAgICAgICBhcmdzLnB1c2goJ2doY2knKVxuICAgICAgICAgIGJyZWFrXG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGdoY2lBcmdzLmxlbmd0aCA+IDBcbiAgICAgICYmICh0aGlzLmlkZUNhYmFsQnVpbGRlckNvbW1hbmQgPT09ICdjYWJhbCdcbiAgICAgICAgfHwgdGhpcy5pZGVDYWJhbEJ1aWxkZXJDb21tYW5kID09PSAnc3RhY2snKSkge1xuICAgICAgcmV0dXJuIGFyZ3MuY29uY2F0KGAtLWdoYy1vcHRpb25zPVwiJHthdG9tLmNvbmZpZy5nZXQoJ2hhc2tlbGwtZGVidWcuR0hDSUFyZ3VtZW50cycpfVwiYClcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGFyZ3MuY29uY2F0KGF0b20uY29uZmlnLmdldCgnaGFza2VsbC1kZWJ1Zy5HSENJQXJndW1lbnRzJykuc3BsaXQoJyAnKSlcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGRlc3Ryb3koKSB7XG4gICAgdGhpcy5saW5lSGlnaGxpZ2h0ZXIuZGVzdHJveSgpXG4gICAgdGhpcy5naGNpRGVidWcuZGVzdHJveSgpXG4gICAgdGhpcy5kZWJ1Z1ZpZXcuZGVzdHJveSgpXG4gICAgdGhpcy5kZWJ1Z1BhbmVsLmRlc3Ryb3koKVxuICAgIHRoaXMuY3VycmVudFZhcmlhYmxlc1BhbmVsLmRlc3Ryb3koKVxuICAgIHRoaXMuY3VycmVudFZhcmlhYmxlc1ZpZXcuZGVzdHJveSgpXG4gICAgdGhpcy50ZXJtaW5hbFJlcG9ydGVyLmRlc3Ryb3koKVxuICAgIHRoaXMuZGlzcG9zYWJsZXMuZGlzcG9zZSgpXG4gIH1cblxuICBwcml2YXRlIGRpc3BsYXlHVUkoKSB7XG4gICAgdGhpcy5kZWJ1Z1BhbmVsID0gYXRvbS53b3Jrc3BhY2UuYWRkVG9wUGFuZWwoe1xuICAgICAgaXRlbTogdGhpcy5kZWJ1Z1ZpZXcuZWxlbWVudCxcbiAgICB9KVxuXG4gICAgdGhpcy5kZWJ1Z1ZpZXcub24oJ3N0ZXAnLCAoKSA9PiB0aGlzLnN0ZXAoKSlcbiAgICB0aGlzLmRlYnVnVmlldy5vbignYmFjaycsICgpID0+IHRoaXMuYmFjaygpKVxuICAgIHRoaXMuZGVidWdWaWV3Lm9uKCdmb3J3YXJkJywgKCkgPT4gdGhpcy5mb3J3YXJkKCkpXG4gICAgdGhpcy5kZWJ1Z1ZpZXcub24oJ2NvbnRpbnVlJywgKCkgPT4gdGhpcy5jb250aW51ZSgpKVxuICAgIHRoaXMuZGVidWdWaWV3Lm9uKCdzdG9wJywgKCkgPT4gdGhpcy5zdG9wKCkpXG5cbiAgICB0aGlzLmN1cnJlbnRWYXJpYWJsZXNQYW5lbCA9IGF0b20ud29ya3NwYWNlLmFkZFRvcFBhbmVsKHtcbiAgICAgIGl0ZW06IHRoaXMuY3VycmVudFZhcmlhYmxlc1ZpZXcuZWxlbWVudCxcbiAgICB9KVxuICB9XG5cbiAgcHJpdmF0ZSB1cGRhdGVIaXN0b3J5TGVuZ3RoQW5kRW5hYmxlQnV0dG9ucyhoaXN0b3J5TGVuZ3RoPzogbnVtYmVyKSB7XG4gICAgaWYgKGhpc3RvcnlMZW5ndGggIT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhpcy5oaXN0b3J5U3RhdGUuc2V0TWF4UG9zaXRpb24oaGlzdG9yeUxlbmd0aClcbiAgICB9XG5cbiAgICB0aGlzLmRlYnVnVmlldy5lbmFibGVBbGxEZWJ1Z0J1dHRvbnMoKVxuICAgIHRoaXMuZGVidWdWaWV3LnNldEJ1dHRvbkVuYWJsZWQoJ2JhY2snLCB0aGlzLmhpc3RvcnlTdGF0ZS5iYWNrRW5hYmxlZClcbiAgICB0aGlzLmRlYnVnVmlldy5zZXRCdXR0b25FbmFibGVkKCdmb3J3YXJkJywgdGhpcy5oaXN0b3J5U3RhdGUuZm9yd2FyZEVuYWJsZWQpXG4gICAgdGhpcy5kZWJ1Z2dlckVuYWJsZWQgPSB0cnVlXG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGxhdW5jaEdIQ0lEZWJ1Z0FuZENvbnNvbGUoYnJlYWtwb2ludHM6IEJyZWFrcG9pbnRbXSkge1xuICAgIHRoaXMuZ2hjaURlYnVnLm9uKCdsaW5lLWNoYW5nZWQnLCAoaW5mbzogQnJlYWtJbmZvKSA9PiB7XG4gICAgICB0aGlzLmxpbmVIaWdobGlnaHRlci5oaWdodGxpZ2h0TGluZShpbmZvKVxuICAgICAgdGhpcy51cGRhdGVIaXN0b3J5TGVuZ3RoQW5kRW5hYmxlQnV0dG9ucyhpbmZvLmhpc3RvcnlMZW5ndGgpXG4gICAgICB0aGlzLmN1cnJlbnRWYXJpYWJsZXNWaWV3LnVwZGF0ZShpbmZvLmxvY2FsQmluZGluZ3MsIGZhbHNlKVxuICAgIH0pXG5cbiAgICB0aGlzLmdoY2lEZWJ1Zy5vbigncGF1c2VkLW9uLWV4Y2VwdGlvbicsIChpbmZvOiBFeGNlcHRpb25JbmZvKSA9PiB7XG4gICAgICB0aGlzLmxpbmVIaWdobGlnaHRlci5kZXN0cm95KClcbiAgICAgIHRoaXMudXBkYXRlSGlzdG9yeUxlbmd0aEFuZEVuYWJsZUJ1dHRvbnMoaW5mby5oaXN0b3J5TGVuZ3RoKVxuICAgICAgdGhpcy5jdXJyZW50VmFyaWFibGVzVmlldy51cGRhdGUoaW5mby5sb2NhbEJpbmRpbmdzLCB0cnVlKVxuICAgIH0pXG5cbiAgICB0aGlzLmdoY2lEZWJ1Zy5vbignZGVidWctZmluaXNoZWQnLCAoKSA9PiB7XG4gICAgICB0aGlzLmRlc3Ryb3koKVxuICAgIH0pXG5cbiAgICB0aGlzLmdoY2lEZWJ1Zy5vbignY29tbWFuZC1pc3N1ZWQnLCAoY29tbWFuZDogc3RyaW5nKSA9PiB7XG4gICAgICBpZiAoIXRoaXMuZXhlY3V0aW5nQ29tbWFuZEZyb21Db25zb2xlKSB7XG4gICAgICAgIHRoaXMudGVybWluYWxSZXBvcnRlci5kaXNwbGF5Q29tbWFuZChjb21tYW5kKVxuICAgICAgfVxuXG4gICAgICB0aGlzLmRlYnVnZ2VyRW5hYmxlZCA9IGZhbHNlXG4gICAgICBzZXRUaW1lb3V0KFxuICAgICAgICAoKSA9PiB7XG4gICAgICAgICAgaWYgKCF0aGlzLmRlYnVnZ2VyRW5hYmxlZCkge1xuICAgICAgICAgICAgdGhpcy5kZWJ1Z1ZpZXcuZGlzYWJsZUFsbERlYnVnQnV0dG9ucygpXG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICAxMDAsXG4gICAgICApXG4gICAgfSlcblxuICAgIHRoaXMuZ2hjaURlYnVnLm9uKCdjb25zb2xlLW91dHB1dCcsIChvdXRwdXQ6IHN0cmluZykgPT4ge1xuICAgICAgdGhpcy50ZXJtaW5hbFJlcG9ydGVyLndyaXRlKG91dHB1dClcbiAgICB9KVxuXG4gICAgdGhpcy5naGNpRGVidWcub24oJ2Vycm9yLWNvbXBsZXRlZCcsIChlcnJvclRleHQ6IHN0cmluZykgPT4ge1xuICAgICAgaWYgKCF0aGlzLmV4ZWN1dGluZ0NvbW1hbmRGcm9tQ29uc29sZSkge1xuICAgICAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkRXJyb3IoJ0dIQ0kgRXJyb3InLCB7XG4gICAgICAgICAgZGV0YWlsOiBlcnJvclRleHQsXG4gICAgICAgICAgZGlzbWlzc2FibGU6IHRydWUsXG4gICAgICAgIH0pXG4gICAgICB9XG4gICAgfSlcblxuICAgIHRoaXMuZ2hjaURlYnVnLm9uKCdlcnJvcicsIChlcnJvclRleHQ6IHN0cmluZykgPT4ge1xuICAgICAgdGhpcy50ZXJtaW5hbFJlcG9ydGVyLndyaXRlKGVycm9yVGV4dClcbiAgICB9KVxuXG4gICAgYXdhaXQgdGhpcy5naGNpRGVidWcuYWRkZWRBbGxMaXN0ZW5lcnMoKVxuXG4gICAgdGhpcy50ZXJtaW5hbFJlcG9ydGVyLm9uKCdjb21tYW5kJywgYXN5bmMgKGNvbW1hbmQ6IHN0cmluZykgPT4ge1xuICAgICAgdGhpcy5leGVjdXRpbmdDb21tYW5kRnJvbUNvbnNvbGUgPSB0cnVlXG4gICAgICBhd2FpdCB0aGlzLmdoY2lEZWJ1Zy5ydW4oY29tbWFuZCwgdHJ1ZSwgdHJ1ZSlcbiAgICAgIHRoaXMuZXhlY3V0aW5nQ29tbWFuZEZyb21Db25zb2xlID0gZmFsc2VcbiAgICB9KVxuXG4gICAgdGhpcy50ZXJtaW5hbFJlcG9ydGVyLm9uKCdjbG9zZScsICgpID0+IHtcbiAgICAgIHRoaXMuZ2hjaURlYnVnLnN0b3AoKVxuICAgIH0pXG5cbiAgICB0aGlzLmdoY2lEZWJ1Zy5zZXRFeGNlcHRpb25CcmVha0xldmVsKGF0b20uY29uZmlnLmdldCgnaGFza2VsbC1kZWJ1Zy5icmVha09uRXhjZXB0aW9uJykpXG5cbiAgICB0aGlzLmRlYnVnVmlldy5kaXNhYmxlQWxsRGVidWdCdXR0b25zKClcblxuICAgIGNvbnN0IGZpbGVUb0RlYnVnID0gdGhpcy5lZGl0b3IuZ2V0UGF0aCgpXG4gICAgdGhpcy5naGNpRGVidWcubG9hZE1vZHVsZShmaWxlVG9EZWJ1ZylcblxuICAgIGJyZWFrcG9pbnRzLmZvckVhY2goKG9iKSA9PiB7XG4gICAgICBpZiAob2IuZmlsZSA9PT0gZmlsZVRvRGVidWcpIHtcbiAgICAgICAgdGhpcy5naGNpRGVidWcuYWRkQnJlYWtwb2ludChvYi5saW5lLnRvU3RyaW5nKCkpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLmdoY2lEZWJ1Zy5hZGRCcmVha3BvaW50KG9iKSAvLyBUT0RPOiBtYWtlIHRoaXMgd29yayBwcm9wZXJseVxuICAgICAgfVxuICAgIH0pXG5cbiAgICB0aGlzLmdoY2lEZWJ1Zy5zdGFydERlYnVnKGF0b20uY29uZmlnLmdldCgnaGFza2VsbC1kZWJ1Zy5mdW5jdGlvblRvRGVidWcnKSlcbiAgfVxuXG4gIHByaXZhdGUgZ2V0V29ya2luZ0ZvbGRlcigpIHtcbiAgICBjb25zdCBmaWxlVG9EZWJ1ZyA9IHRoaXMuZWRpdG9yLmdldFBhdGgoKVxuICAgIHJldHVybiBwYXRoLmRpcm5hbWUoZmlsZVRvRGVidWcpXG4gIH1cbn1cbiJdfQ==