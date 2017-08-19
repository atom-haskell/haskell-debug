"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const atomAPI = require("atom");
const _GHCIDebug = require("./GHCIDebug");
const DebugView = require("./views/DebugView");
const CurrentVariablesView = require("./views/CurrentVariablesView");
const HistoryState = require("./HistoryState");
const LineHighlighter = require("./LineHighlighter");
const TerminalReporter = require("./TerminalReporter");
var GHCIDebug = _GHCIDebug.GHCIDebug;
const path = require("path");
class Debugger {
    constructor(breakpoints, editor, ideCabalBuilderCommand) {
        this.editor = editor;
        this.ideCabalBuilderCommand = ideCabalBuilderCommand;
        this.lineHighlighter = new LineHighlighter();
        this.ghciDebug = new GHCIDebug(this.getGhciCommand(), this.getGhciArgs(), this.getWorkingFolder());
        this.debugView = new DebugView();
        this.historyState = new HistoryState();
        this.currentVariablesView = new CurrentVariablesView();
        this.terminalReporter = new TerminalReporter();
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
        this.debugView = new DebugView();
        this.debugPanel = atom.workspace.addTopPanel({
            item: this.debugView.element
        });
        this.debugView.on('step', () => this.step());
        this.debugView.on('back', () => this.back());
        this.debugView.on('forward', () => this.forward());
        this.debugView.on('continue', () => this.continue());
        this.debugView.on('stop', () => this.stop());
        this.currentVariablesView = new CurrentVariablesView();
        this.currentVariablesPanel = atom.workspace.addTopPanel({
            item: this.currentVariablesView.element
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
                    dismissable: true
                });
            }
        });
        this.ghciDebug.on('error', (errorText) => {
            this.terminalReporter.write(errorText);
        });
        this.ghciDebug.addedAllListeners();
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
    }
    getWorkingFolder() {
        const fileToDebug = this.editor.getPath();
        return path.dirname(fileToDebug);
    }
}
module.exports = Debugger;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRGVidWdnZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvbGliL0RlYnVnZ2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBLGdDQUFnQztBQUNoQywwQ0FBMEM7QUFDMUMsK0NBQStDO0FBQy9DLHFFQUFxRTtBQUNyRSwrQ0FBK0M7QUFDL0MscURBQXFEO0FBQ3JELHVEQUF1RDtBQUN2RCxJQUFPLFNBQVMsR0FBRyxVQUFVLENBQUMsU0FBUyxDQUFBO0FBR3ZDLDZCQUE2QjtBQUU3QjtJQWVFLFlBQ0UsV0FBeUIsRUFDakIsTUFBMEIsRUFDMUIsc0JBQStCO1FBRC9CLFdBQU0sR0FBTixNQUFNLENBQW9CO1FBQzFCLDJCQUFzQixHQUF0QixzQkFBc0IsQ0FBUztRQWpCakMsb0JBQWUsR0FBRyxJQUFJLGVBQWUsRUFBRSxDQUFBO1FBQ3ZDLGNBQVMsR0FBRyxJQUFJLFNBQVMsQ0FBQyxJQUFJLENBQUMsY0FBYyxFQUFFLEVBQUUsSUFBSSxDQUFDLFdBQVcsRUFBRSxFQUFFLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDLENBQUE7UUFDN0YsY0FBUyxHQUFHLElBQUksU0FBUyxFQUFFLENBQUE7UUFDM0IsaUJBQVksR0FBRyxJQUFJLFlBQVksRUFBRSxDQUFBO1FBR2pDLHlCQUFvQixHQUFHLElBQUksb0JBQW9CLEVBQUUsQ0FBQTtRQUdqRCxxQkFBZ0IsR0FBRyxJQUFJLGdCQUFnQixFQUFFLENBQUE7UUFDekMsZ0JBQVcsR0FBRyxJQUFJLE9BQU8sQ0FBQyxtQkFBbUIsRUFBRSxDQUFBO1FBQy9DLG9CQUFlLEdBQUcsS0FBSyxDQUFBO1FBQ3ZCLGdDQUEyQixHQUFHLEtBQUssQ0FBQTtRQU96QyxJQUFJLENBQUMseUJBQXlCLENBQUMsV0FBVyxDQUFDLENBQUE7UUFDM0MsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFBO1FBQ2pCLElBQUksQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxNQUFN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QUFFLENBQUE7UUFDekMsTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLENBQUE7SUFDbEMsQ0FBQztDQUNGO0FBRUQsaUJBQVMsUUFBUSxDQUFBIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGF0b21BUEkgPSByZXF1aXJlKCdhdG9tJylcbmltcG9ydCBfR0hDSURlYnVnID0gcmVxdWlyZSgnLi9HSENJRGVidWcnKVxuaW1wb3J0IERlYnVnVmlldyA9IHJlcXVpcmUoJy4vdmlld3MvRGVidWdWaWV3JylcbmltcG9ydCBDdXJyZW50VmFyaWFibGVzVmlldyA9IHJlcXVpcmUoJy4vdmlld3MvQ3VycmVudFZhcmlhYmxlc1ZpZXcnKVxuaW1wb3J0IEhpc3RvcnlTdGF0ZSA9IHJlcXVpcmUoJy4vSGlzdG9yeVN0YXRlJylcbmltcG9ydCBMaW5lSGlnaGxpZ2h0ZXIgPSByZXF1aXJlKCcuL0xpbmVIaWdobGlnaHRlcicpXG5pbXBvcnQgVGVybWluYWxSZXBvcnRlciA9IHJlcXVpcmUoJy4vVGVybWluYWxSZXBvcnRlcicpXG5pbXBvcnQgR0hDSURlYnVnID0gX0dIQ0lEZWJ1Zy5HSENJRGVidWdcbmltcG9ydCBCcmVha0luZm8gPSBfR0hDSURlYnVnLkJyZWFrSW5mb1xuaW1wb3J0IEV4Y2VwdGlvbkluZm8gPSBfR0hDSURlYnVnLkV4Y2VwdGlvbkluZm9cbmltcG9ydCBwYXRoID0gcmVxdWlyZSgncGF0aCcpXG5cbmNsYXNzIERlYnVnZ2VyIHtcbiAgcHJpdmF0ZSBsaW5lSGlnaGxpZ2h0ZXIgPSBuZXcgTGluZUhpZ2hsaWdodGVyKClcbiAgcHJpdmF0ZSBnaGNpRGVidWcgPSBuZXcgR0hDSURlYnVnKHRoaXMuZ2V0R2hjaUNvbW1hbmQoKSwgdGhpcy5nZXRHaGNpQXJncygpLCB0aGlzLmdldFdvcmtpbmdGb2xkZXIoKSlcbiAgcHJpdmF0ZSBkZWJ1Z1ZpZXcgPSBuZXcgRGVidWdWaWV3KClcbiAgcHJpdmF0ZSBoaXN0b3J5U3RhdGUgPSBuZXcgSGlzdG9yeVN0YXRlKClcbiAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOiBuby11bmluaXRpYWxpemVkLWNsYXNzLXByb3BlcnRpZXNcbiAgcHJpdmF0ZSBkZWJ1Z1BhbmVsOiBhdG9tQVBJLlBhbmVsXG4gIHByaXZhdGUgY3VycmVudFZhcmlhYmxlc1ZpZXcgPSBuZXcgQ3VycmVudFZhcmlhYmxlc1ZpZXcoKVxuICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6IG5vLXVuaW5pdGlhbGl6ZWQtY2xhc3MtcHJvcGVydGllc1xuICBwcml2YXRlIGN1cnJlbnRWYXJpYWJsZXNQYW5lbDogYXRvbUFQSS5QYW5lbFxuICBwcml2YXRlIHRlcm1pbmFsUmVwb3J0ZXIgPSBuZXcgVGVybWluYWxSZXBvcnRlcigpXG4gIHByaXZhdGUgZGlzcG9zYWJsZXMgPSBuZXcgYXRvbUFQSS5Db21wb3NpdGVEaXNwb3NhYmxlKClcbiAgcHJpdmF0ZSBkZWJ1Z2dlckVuYWJsZWQgPSBmYWxzZVxuICBwcml2YXRlIGV4ZWN1dGluZ0NvbW1hbmRGcm9tQ29uc29sZSA9IGZhbHNlXG5cbiAgY29uc3RydWN0b3IoXG4gICAgYnJlYWtwb2ludHM6IEJyZWFrcG9pbnRbXSxcbiAgICBwcml2YXRlIGVkaXRvcjogYXRvbUFQSS5UZXh0RWRpdG9yLFxuICAgIHByaXZhdGUgaWRlQ2FiYWxCdWlsZGVyQ29tbWFuZD86IHN0cmluZ1xuICApIHtcbiAgICB0aGlzLmxhdW5jaEdIQ0lEZWJ1Z0FuZENvbnNvbGUoYnJlYWtwb2ludHMpXG4gICAgdGhpcy5kaXNwbGF5R1VJKClcbiAgICB0aGlzLmRpc3Bvc2FibGVzLmFkZChhdG9tLmNvbmZpZy5vbkRpZENoYW5nZSgnaGFza2VsbC1kZWJ1Zy5icmVha09uRXhjZXB0aW9uJywgKHsgbmV3VmFsdWUgfSkgPT4ge1xuICAgICAgdGhpcy5naGNpRGVidWcuc2V0RXhjZXB0aW9uQnJlYWtMZXZlbChuZXdWYWx1ZSBhcyBFeGNlcHRpb25CcmVha0xldmVscylcbiAgICB9KSlcbiAgfVxuXG4gIC8qKiBGb3IgdGhlIHRvb2x0aXAgb3ZlcnJpZGUqL1xuICBwdWJsaWMgYXN5bmMgcmVzb2x2ZUV4cHJlc3Npb24oZXhwcmVzc2lvbjogc3RyaW5nKSB7XG4gICAgcmV0dXJuIHRoaXMuZ2hjaURlYnVnLnJlc29sdmVFeHByZXNzaW9uKGV4cHJlc3Npb24pXG4gIH1cblxuICBwdWJsaWMgYmFjaygpIHtcbiAgICBpZiAodGhpcy5oaXN0b3J5U3RhdGUuc2V0Q3VycmVudFBvc2l0aW9uKHRoaXMuaGlzdG9yeVN0YXRlLmdldEN1cnJlbnRQb3NpdGlvbigpICsgMSkpIHtcbiAgICAgIHRoaXMuZ2hjaURlYnVnLmJhY2soKVxuICAgIH1cbiAgfVxuXG4gIHB1YmxpYyBmb3J3YXJkKCkge1xuICAgIGlmICh0aGlzLmhpc3RvcnlTdGF0ZS5zZXRDdXJyZW50UG9zaXRpb24odGhpcy5oaXN0b3J5U3RhdGUuZ2V0Q3VycmVudFBvc2l0aW9uKCkgLSAxKSkge1xuICAgICAgdGhpcy5naGNpRGVidWcuZm9yd2FyZCgpXG4gICAgfVxuICB9XG5cbiAgcHVibGljIGNvbnRpbnVlKCkge1xuICAgIHRoaXMuZ2hjaURlYnVnLmNvbnRpbnVlKClcbiAgfVxuXG4gIHB1YmxpYyBzdGVwKCkge1xuICAgIHRoaXMuZ2hjaURlYnVnLnN0ZXAoKVxuICB9XG5cbiAgcHVibGljIHN0b3AoKSB7XG4gICAgdGhpcy5naGNpRGVidWcuc3RvcCgpIC8vIHRoaXMgd2lsbCB0cmlnZ2VyIGRlYnVnLWZpbmlzaGVkIGV2ZW50XG4gIH1cblxuICBwdWJsaWMgaGlkZVBhbmVscygpIHtcbiAgICB0aGlzLmRlYnVnUGFuZWwuaGlkZSgpXG4gICAgdGhpcy5jdXJyZW50VmFyaWFibGVzUGFuZWwuaGlkZSgpXG4gIH1cblxuICBwdWJsaWMgc2hvd1BhbmVscygpIHtcbiAgICB0aGlzLmRlYnVnUGFuZWwuc2hvdygpXG4gICAgdGhpcy5jdXJyZW50VmFyaWFibGVzUGFuZWwuc2hvdygpXG4gIH1cblxuICBwcml2YXRlIGdldEdoY2lDb21tYW5kKCkge1xuICAgIGlmIChhdG9tLmNvbmZpZy5nZXQoJ2hhc2tlbGwtZGVidWcudXNlSWRlSGFza2VsbENhYmFsQnVpbGRlcicpKSB7XG4gICAgICBzd2l0Y2ggKHRoaXMuaWRlQ2FiYWxCdWlsZGVyQ29tbWFuZCkge1xuICAgICAgICBjYXNlICdjYWJhbCc6XG4gICAgICAgICAgcmV0dXJuICdjYWJhbCdcbiAgICAgICAgY2FzZSAnc3RhY2snOlxuICAgICAgICAgIHJldHVybiAnc3RhY2snXG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgcmV0dXJuIGF0b20uY29uZmlnLmdldCgnaGFza2VsbC1kZWJ1Zy5HSENJQ29tbWFuZCcpXG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBhdG9tLmNvbmZpZy5nZXQoJ2hhc2tlbGwtZGVidWcuR0hDSUNvbW1hbmQnKVxuICB9XG5cbiAgcHJpdmF0ZSBnZXRHaGNpQXJncygpIHtcbiAgICBjb25zdCBhcmdzOiBzdHJpbmdbXSA9IFtdXG4gICAgY29uc3QgZ2hjaUFyZ3MgPSBhdG9tLmNvbmZpZy5nZXQoJ2hhc2tlbGwtZGVidWcuR0hDSUFyZ3VtZW50cycpXG5cbiAgICBpZiAoYXRvbS5jb25maWcuZ2V0KCdoYXNrZWxsLWRlYnVnLnVzZUlkZUhhc2tlbGxDYWJhbEJ1aWxkZXInKSkge1xuICAgICAgc3dpdGNoICh0aGlzLmlkZUNhYmFsQnVpbGRlckNvbW1hbmQpIHtcbiAgICAgICAgY2FzZSAnY2FiYWwnOlxuICAgICAgICAgIGFyZ3MucHVzaCgncmVwbCcpXG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgY2FzZSAnc3RhY2snOlxuICAgICAgICAgIGFyZ3MucHVzaCgnZ2hjaScpXG4gICAgICAgICAgYnJlYWtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoZ2hjaUFyZ3MubGVuZ3RoID4gMFxuICAgICAgJiYgKHRoaXMuaWRlQ2FiYWxCdWlsZGVyQ29tbWFuZCA9PT0gJ2NhYmFsJ1xuICAgICAgICB8fCB0aGlzLmlkZUNhYmFsQnVpbGRlckNvbW1hbmQgPT09ICdzdGFjaycpKSB7XG4gICAgICByZXR1cm4gYXJncy5jb25jYXQoYC0tZ2hjLW9wdGlvbnM9XCIke2F0b20uY29uZmlnLmdldCgnaGFza2VsbC1kZWJ1Zy5HSENJQXJndW1lbnRzJyl9XCJgKVxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gYXJncy5jb25jYXQoYXRvbS5jb25maWcuZ2V0KCdoYXNrZWxsLWRlYnVnLkdIQ0lBcmd1bWVudHMnKS5zcGxpdCgnICcpKVxuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgZGVzdHJveSgpIHtcbiAgICB0aGlzLmxpbmVIaWdobGlnaHRlci5kZXN0cm95KClcbiAgICB0aGlzLmdoY2lEZWJ1Zy5kZXN0cm95KClcbiAgICB0aGlzLmRlYnVnVmlldy5kZXN0cm95KClcbiAgICB0aGlzLmRlYnVnUGFuZWwuZGVzdHJveSgpXG4gICAgdGhpcy5jdXJyZW50VmFyaWFibGVzUGFuZWwuZGVzdHJveSgpXG4gICAgdGhpcy5jdXJyZW50VmFyaWFibGVzVmlldy5kZXN0cm95KClcbiAgICB0aGlzLnRlcm1pbmFsUmVwb3J0ZXIuZGVzdHJveSgpXG4gICAgdGhpcy5kaXNwb3NhYmxlcy5kaXNwb3NlKClcbiAgfVxuXG4gIHByaXZhdGUgZGlzcGxheUdVSSgpIHtcbiAgICB0aGlzLmRlYnVnVmlldyA9IG5ldyBEZWJ1Z1ZpZXcoKVxuICAgIHRoaXMuZGVidWdQYW5lbCA9IGF0b20ud29ya3NwYWNlLmFkZFRvcFBhbmVsKHtcbiAgICAgIGl0ZW06IHRoaXMuZGVidWdWaWV3LmVsZW1lbnRcbiAgICB9KVxuXG4gICAgdGhpcy5kZWJ1Z1ZpZXcub24oJ3N0ZXAnLCAoKSA9PiB0aGlzLnN0ZXAoKSlcbiAgICB0aGlzLmRlYnVnVmlldy5vbignYmFjaycsICgpID0+IHRoaXMuYmFjaygpKVxuICAgIHRoaXMuZGVidWdWaWV3Lm9uKCdmb3J3YXJkJywgKCkgPT4gdGhpcy5mb3J3YXJkKCkpXG4gICAgdGhpcy5kZWJ1Z1ZpZXcub24oJ2NvbnRpbnVlJywgKCkgPT4gdGhpcy5jb250aW51ZSgpKVxuICAgIHRoaXMuZGVidWdWaWV3Lm9uKCdzdG9wJywgKCkgPT4gdGhpcy5zdG9wKCkpXG5cbiAgICB0aGlzLmN1cnJlbnRWYXJpYWJsZXNWaWV3ID0gbmV3IEN1cnJlbnRWYXJpYWJsZXNWaWV3KClcbiAgICB0aGlzLmN1cnJlbnRWYXJpYWJsZXNQYW5lbCA9IGF0b20ud29ya3NwYWNlLmFkZFRvcFBhbmVsKHtcbiAgICAgIGl0ZW06IHRoaXMuY3VycmVudFZhcmlhYmxlc1ZpZXcuZWxlbWVudFxuICAgIH0pXG4gIH1cblxuICBwcml2YXRlIHVwZGF0ZUhpc3RvcnlMZW5ndGhBbmRFbmFibGVCdXR0b25zKGhpc3RvcnlMZW5ndGg/OiBudW1iZXIpIHtcbiAgICBpZiAoaGlzdG9yeUxlbmd0aCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzLmhpc3RvcnlTdGF0ZS5zZXRNYXhQb3NpdGlvbihoaXN0b3J5TGVuZ3RoKVxuICAgIH1cblxuICAgIHRoaXMuZGVidWdWaWV3LmVuYWJsZUFsbERlYnVnQnV0dG9ucygpXG4gICAgdGhpcy5kZWJ1Z1ZpZXcuc2V0QnV0dG9uRW5hYmxlZCgnYmFjaycsIHRoaXMuaGlzdG9yeVN0YXRlLmJhY2tFbmFibGVkKVxuICAgIHRoaXMuZGVidWdWaWV3LnNldEJ1dHRvbkVuYWJsZWQoJ2ZvcndhcmQnLCB0aGlzLmhpc3RvcnlTdGF0ZS5mb3J3YXJkRW5hYmxlZClcbiAgICB0aGlzLmRlYnVnZ2VyRW5hYmxlZCA9IHRydWVcbiAgfVxuXG4gIHByaXZhdGUgbGF1bmNoR0hDSURlYnVnQW5kQ29uc29sZShicmVha3BvaW50czogQnJlYWtwb2ludFtdKSB7XG4gICAgdGhpcy5naGNpRGVidWcub24oJ2xpbmUtY2hhbmdlZCcsIChpbmZvOiBCcmVha0luZm8pID0+IHtcbiAgICAgIHRoaXMubGluZUhpZ2hsaWdodGVyLmhpZ2h0bGlnaHRMaW5lKGluZm8pXG4gICAgICB0aGlzLnVwZGF0ZUhpc3RvcnlMZW5ndGhBbmRFbmFibGVCdXR0b25zKGluZm8uaGlzdG9yeUxlbmd0aClcbiAgICAgIHRoaXMuY3VycmVudFZhcmlhYmxlc1ZpZXcudXBkYXRlKGluZm8ubG9jYWxCaW5kaW5ncywgZmFsc2UpXG4gICAgfSlcblxuICAgIHRoaXMuZ2hjaURlYnVnLm9uKCdwYXVzZWQtb24tZXhjZXB0aW9uJywgKGluZm86IEV4Y2VwdGlvbkluZm8pID0+IHtcbiAgICAgIHRoaXMubGluZUhpZ2hsaWdodGVyLmRlc3Ryb3koKVxuICAgICAgdGhpcy51cGRhdGVIaXN0b3J5TGVuZ3RoQW5kRW5hYmxlQnV0dG9ucyhpbmZvLmhpc3RvcnlMZW5ndGgpXG4gICAgICB0aGlzLmN1cnJlbnRWYXJpYWJsZXNWaWV3LnVwZGF0ZShpbmZvLmxvY2FsQmluZGluZ3MsIHRydWUpXG4gICAgfSlcblxuICAgIHRoaXMuZ2hjaURlYnVnLm9uKCdkZWJ1Zy1maW5pc2hlZCcsICgpID0+IHtcbiAgICAgIHRoaXMuZGVzdHJveSgpXG4gICAgfSlcblxuICAgIHRoaXMuZ2hjaURlYnVnLm9uKCdjb21tYW5kLWlzc3VlZCcsIChjb21tYW5kOiBzdHJpbmcpID0+IHtcbiAgICAgIGlmICghdGhpcy5leGVjdXRpbmdDb21tYW5kRnJvbUNvbnNvbGUpIHtcbiAgICAgICAgdGhpcy50ZXJtaW5hbFJlcG9ydGVyLmRpc3BsYXlDb21tYW5kKGNvbW1hbmQpXG4gICAgICB9XG5cbiAgICAgIHRoaXMuZGVidWdnZXJFbmFibGVkID0gZmFsc2VcbiAgICAgIHNldFRpbWVvdXQoXG4gICAgICAgICgpID0+IHtcbiAgICAgICAgICBpZiAoIXRoaXMuZGVidWdnZXJFbmFibGVkKSB7XG4gICAgICAgICAgICB0aGlzLmRlYnVnVmlldy5kaXNhYmxlQWxsRGVidWdCdXR0b25zKClcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIDEwMFxuICAgICAgKVxuICAgIH0pXG5cbiAgICB0aGlzLmdoY2lEZWJ1Zy5vbignY29uc29sZS1vdXRwdXQnLCAob3V0cHV0OiBzdHJpbmcpID0+IHtcbiAgICAgIHRoaXMudGVybWluYWxSZXBvcnRlci53cml0ZShvdXRwdXQpXG4gICAgfSlcblxuICAgIHRoaXMuZ2hjaURlYnVnLm9uKCdlcnJvci1jb21wbGV0ZWQnLCAoZXJyb3JUZXh0OiBzdHJpbmcpID0+IHtcbiAgICAgIGlmICghdGhpcy5leGVjdXRpbmdDb21tYW5kRnJvbUNvbnNvbGUpIHtcbiAgICAgICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZEVycm9yKCdHSENJIEVycm9yJywge1xuICAgICAgICAgIGRldGFpbDogZXJyb3JUZXh0LFxuICAgICAgICAgIGRpc21pc3NhYmxlOiB0cnVlXG4gICAgICAgIH0pXG4gICAgICB9XG4gICAgfSlcblxuICAgIHRoaXMuZ2hjaURlYnVnLm9uKCdlcnJvcicsIChlcnJvclRleHQ6IHN0cmluZykgPT4ge1xuICAgICAgdGhpcy50ZXJtaW5hbFJlcG9ydGVyLndyaXRlKGVycm9yVGV4dClcbiAgICB9KVxuXG4gICAgdGhpcy5naGNpRGVidWcuYWRkZWRBbGxMaXN0ZW5lcnMoKVxuXG4gICAgdGhpcy50ZXJtaW5hbFJlcG9ydGVyLm9uKCdjb21tYW5kJywgYXN5bmMgKGNvbW1hbmQ6IHN0cmluZykgPT4ge1xuICAgICAgdGhpcy5leGVjdXRpbmdDb21tYW5kRnJvbUNvbnNvbGUgPSB0cnVlXG4gICAgICBhd2FpdCB0aGlzLmdoY2lEZWJ1Zy5ydW4oY29tbWFuZCwgdHJ1ZSwgdHJ1ZSlcbiAgICAgIHRoaXMuZXhlY3V0aW5nQ29tbWFuZEZyb21Db25zb2xlID0gZmFsc2VcbiAgICB9KVxuXG4gICAgdGhpcy50ZXJtaW5hbFJlcG9ydGVyLm9uKCdjbG9zZScsICgpID0+IHtcbiAgICAgIHRoaXMuZ2hjaURlYnVnLnN0b3AoKVxuICAgIH0pXG5cbiAgICB0aGlzLmdoY2lEZWJ1Zy5zZXRFeGNlcHRpb25CcmVha0xldmVsKGF0b20uY29uZmlnLmdldCgnaGFza2VsbC1kZWJ1Zy5icmVha09uRXhjZXB0aW9uJykpXG5cbiAgICB0aGlzLmRlYnVnVmlldy5kaXNhYmxlQWxsRGVidWdCdXR0b25zKClcblxuICAgIGNvbnN0IGZpbGVUb0RlYnVnID0gdGhpcy5lZGl0b3IuZ2V0UGF0aCgpXG4gICAgdGhpcy5naGNpRGVidWcubG9hZE1vZHVsZShmaWxlVG9EZWJ1ZylcblxuICAgIGJyZWFrcG9pbnRzLmZvckVhY2goKG9iKSA9PiB7XG4gICAgICBpZiAob2IuZmlsZSA9PT0gZmlsZVRvRGVidWcpIHtcbiAgICAgICAgdGhpcy5naGNpRGVidWcuYWRkQnJlYWtwb2ludChvYi5saW5lLnRvU3RyaW5nKCkpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLmdoY2lEZWJ1Zy5hZGRCcmVha3BvaW50KG9iKSAvLyBUT0RPOiBtYWtlIHRoaXMgd29yayBwcm9wZXJseVxuICAgICAgfVxuICAgIH0pXG5cbiAgICB0aGlzLmdoY2lEZWJ1Zy5zdGFydERlYnVnKGF0b20uY29uZmlnLmdldCgnaGFza2VsbC1kZWJ1Zy5mdW5jdGlvblRvRGVidWcnKSlcbiAgfVxuXG4gIHByaXZhdGUgZ2V0V29ya2luZ0ZvbGRlcigpIHtcbiAgICBjb25zdCBmaWxlVG9EZWJ1ZyA9IHRoaXMuZWRpdG9yLmdldFBhdGgoKVxuICAgIHJldHVybiBwYXRoLmRpcm5hbWUoZmlsZVRvRGVidWcpXG4gIH1cbn1cblxuZXhwb3J0ID0gRGVidWdnZXJcbiJdfQ==