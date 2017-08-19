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
    hidePanels() {
        this.debugPanel.hide();
        this.currentVariablesPanel.hide();
    }
    showPanels() {
        this.debugPanel.show();
        this.currentVariablesPanel.show();
    }
    displayGUI() {
        this.debugView = new DebugView();
        this.debugPanel = atom.workspace.addTopPanel({
            item: this.debugView.element
        });
        this.debugView.emitter.on('step', () => this.step());
        this.debugView.emitter.on('back', () => this.back());
        this.debugView.emitter.on('forward', () => this.forward());
        this.debugView.emitter.on('continue', () => this.continue());
        this.debugView.emitter.on('stop', () => this.stop());
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
        this.debugView.buttons.back.isEnabled = this.historyState.backEnabled;
        this.debugView.buttons.forward.isEnabled = this.historyState.forwardEnabled;
        this.debuggerEnabled = true;
    }
    launchGHCIDebugAndConsole(breakpoints) {
        this.ghciDebug.emitter.on('line-changed', (info) => {
            this.lineHighlighter.hightlightLine(info);
            this.updateHistoryLengthAndEnableButtons(info.historyLength);
            this.currentVariablesView.update(info.localBindings, false);
        });
        this.ghciDebug.emitter.on('paused-on-exception', (info) => {
            this.lineHighlighter.destroy();
            this.updateHistoryLengthAndEnableButtons(info.historyLength);
            this.currentVariablesView.update(info.localBindings, true);
        });
        this.ghciDebug.emitter.on('debug-finished', () => {
            this.destroy();
        });
        this.ghciDebug.emitter.on('command-issued', (command) => {
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
        this.ghciDebug.emitter.on('console-output', (output) => {
            this.terminalReporter.write(output);
        });
        this.ghciDebug.emitter.on('error-completed', (errorText) => {
            if (!this.executingCommandFromConsole) {
                atom.notifications.addError('GHCI Error', {
                    detail: errorText,
                    dismissable: true
                });
            }
        });
        this.ghciDebug.emitter.on('error', (errorText) => {
            this.terminalReporter.write(errorText);
        });
        this.ghciDebug.addedAllListeners();
        this.terminalReporter.emitter.on('command', (command) => __awaiter(this, void 0, void 0, function* () {
            this.executingCommandFromConsole = true;
            yield this.ghciDebug.run(command, true, true);
            this.executingCommandFromConsole = false;
        }));
        this.terminalReporter.emitter.on('close', () => {
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
    getWorkingFolder() {
        const fileToDebug = this.editor.getPath();
        return path.dirname(fileToDebug);
    }
}
module.exports = Debugger;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRGVidWdnZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvbGliL0RlYnVnZ2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBLGdDQUFnQztBQUNoQywwQ0FBMEM7QUFDMUMsK0NBQStDO0FBQy9DLHFFQUFxRTtBQUNyRSwrQ0FBK0M7QUFDL0MscURBQXFEO0FBQ3JELHVEQUF1RDtBQUN2RCxJQUFPLFNBQVMsR0FBRyxVQUFVLENBQUMsU0FBUyxDQUFBO0FBR3ZDLDZCQUE2QjtBQUU3QjtJQXdMRSxZQUNFLFdBQXlCLEVBQ2pCLE1BQTBCLEVBQzFCLHNCQUErQjtRQUQvQixXQUFNLEdBQU4sTUFBTSxDQUFvQjtRQUMxQiwyQkFBc0IsR0FBdEIsc0JBQXNCLENBQVM7UUExTGpDLG9CQUFlLEdBQUcsSUFBSSxlQUFlLEVBQUUsQ0FBQTtRQUN2QyxjQUFTLEdBQUcsSUFBSSxTQUFTLENBQUMsSUFBSSxDQUFDLGNBQWMsRUFBRSxFQUFFLElBQUksQ0FBQyxXQUFXLEVBQUUsRUFBRSxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQyxDQUFBO1FBQzdGLGNBQVMsR0FBRyxJQUFJLFNBQVMsRUFBRSxDQUFBO1FBQzNCLGlCQUFZLEdBQUcsSUFBSSxZQUFZLEVBQUUsQ0FBQTtRQUdqQyx5QkFBb0IsR0FBRyxJQUFJLG9CQUFvQixFQUFFLENBQUE7UUFHakQscUJBQWdCLEdBQUcsSUFBSSxnQkFBZ0IsRUFBRSxDQUFBO1FBQ3pDLGdCQUFXLEdBQUcsSUFBSSxPQUFPLENBQUMsbUJBQW1CLEVBQUUsQ0FBQTtRQStFL0Msb0JBQWUsR0FBRyxLQUFLLENBQUE7UUFhdkIsZ0NBQTJCLEdBQUcsS0FBSyxDQUFBO1FBc0Z6QyxJQUFJLENBQUMseUJBQXlCLENBQUMsV0FBVyxDQUFDLENBQUE7UUFDM0MsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFBO1FBQ2pCLElBQUksQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxN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QUFDLElBQUksRUFBRSxDQUFBO0lBQ3ZCLENBQUM7SUFFRCxJQUFJO1FBQ0YsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsQ0FBQTtJQUN2QixDQUFDO0lBRU8sZ0JBQWdCO1FBQ3RCLE1BQU0sV0FBVyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxFQUFFLENBQUE7UUFDekMsTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLENBQUE7SUFDbEMsQ0FBQztDQUNGO0FBRUQsaUJBQVMsUUFBUSxDQUFBIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGF0b21BUEkgPSByZXF1aXJlKCdhdG9tJylcbmltcG9ydCBfR0hDSURlYnVnID0gcmVxdWlyZSgnLi9HSENJRGVidWcnKVxuaW1wb3J0IERlYnVnVmlldyA9IHJlcXVpcmUoJy4vdmlld3MvRGVidWdWaWV3JylcbmltcG9ydCBDdXJyZW50VmFyaWFibGVzVmlldyA9IHJlcXVpcmUoJy4vdmlld3MvQ3VycmVudFZhcmlhYmxlc1ZpZXcnKVxuaW1wb3J0IEhpc3RvcnlTdGF0ZSA9IHJlcXVpcmUoJy4vSGlzdG9yeVN0YXRlJylcbmltcG9ydCBMaW5lSGlnaGxpZ2h0ZXIgPSByZXF1aXJlKCcuL0xpbmVIaWdobGlnaHRlcicpXG5pbXBvcnQgVGVybWluYWxSZXBvcnRlciA9IHJlcXVpcmUoJy4vVGVybWluYWxSZXBvcnRlcicpXG5pbXBvcnQgR0hDSURlYnVnID0gX0dIQ0lEZWJ1Zy5HSENJRGVidWdcbmltcG9ydCBCcmVha0luZm8gPSBfR0hDSURlYnVnLkJyZWFrSW5mb1xuaW1wb3J0IEV4Y2VwdGlvbkluZm8gPSBfR0hDSURlYnVnLkV4Y2VwdGlvbkluZm9cbmltcG9ydCBwYXRoID0gcmVxdWlyZSgncGF0aCcpXG5cbmNsYXNzIERlYnVnZ2VyIHtcbiAgcHJpdmF0ZSBsaW5lSGlnaGxpZ2h0ZXIgPSBuZXcgTGluZUhpZ2hsaWdodGVyKClcbiAgcHJpdmF0ZSBnaGNpRGVidWcgPSBuZXcgR0hDSURlYnVnKHRoaXMuZ2V0R2hjaUNvbW1hbmQoKSwgdGhpcy5nZXRHaGNpQXJncygpLCB0aGlzLmdldFdvcmtpbmdGb2xkZXIoKSlcbiAgcHJpdmF0ZSBkZWJ1Z1ZpZXcgPSBuZXcgRGVidWdWaWV3KClcbiAgcHJpdmF0ZSBoaXN0b3J5U3RhdGUgPSBuZXcgSGlzdG9yeVN0YXRlKClcbiAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOiBuby11bmluaXRpYWxpemVkLWNsYXNzLXByb3BlcnRpZXNcbiAgcHJpdmF0ZSBkZWJ1Z1BhbmVsOiBhdG9tQVBJLlBhbmVsXG4gIHByaXZhdGUgY3VycmVudFZhcmlhYmxlc1ZpZXcgPSBuZXcgQ3VycmVudFZhcmlhYmxlc1ZpZXcoKVxuICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6IG5vLXVuaW5pdGlhbGl6ZWQtY2xhc3MtcHJvcGVydGllc1xuICBwcml2YXRlIGN1cnJlbnRWYXJpYWJsZXNQYW5lbDogYXRvbUFQSS5QYW5lbFxuICBwcml2YXRlIHRlcm1pbmFsUmVwb3J0ZXIgPSBuZXcgVGVybWluYWxSZXBvcnRlcigpXG4gIHByaXZhdGUgZGlzcG9zYWJsZXMgPSBuZXcgYXRvbUFQSS5Db21wb3NpdGVEaXNwb3NhYmxlKClcblxuICBwcml2YXRlIGdldEdoY2lDb21tYW5kKCkge1xuICAgIGlmIChhdG9tLmNvbmZpZy5nZXQoJ2hhc2tlbGwtZGVidWcudXNlSWRlSGFza2VsbENhYmFsQnVpbGRlcicpKSB7XG4gICAgICBzd2l0Y2ggKHRoaXMuaWRlQ2FiYWxCdWlsZGVyQ29tbWFuZCkge1xuICAgICAgICBjYXNlICdjYWJhbCc6XG4gICAgICAgICAgcmV0dXJuICdjYWJhbCdcbiAgICAgICAgY2FzZSAnc3RhY2snOlxuICAgICAgICAgIHJldHVybiAnc3RhY2snXG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgcmV0dXJuIGF0b20uY29uZmlnLmdldCgnaGFza2VsbC1kZWJ1Zy5HSENJQ29tbWFuZCcpXG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBhdG9tLmNvbmZpZy5nZXQoJ2hhc2tlbGwtZGVidWcuR0hDSUNvbW1hbmQnKVxuICB9XG5cbiAgcHJpdmF0ZSBnZXRHaGNpQXJncygpIHtcbiAgICBjb25zdCBhcmdzOiBzdHJpbmdbXSA9IFtdXG4gICAgY29uc3QgZ2hjaUFyZ3MgPSBhdG9tLmNvbmZpZy5nZXQoJ2hhc2tlbGwtZGVidWcuR0hDSUFyZ3VtZW50cycpXG5cbiAgICBpZiAoYXRvbS5jb25maWcuZ2V0KCdoYXNrZWxsLWRlYnVnLnVzZUlkZUhhc2tlbGxDYWJhbEJ1aWxkZXInKSkge1xuICAgICAgc3dpdGNoICh0aGlzLmlkZUNhYmFsQnVpbGRlckNvbW1hbmQpIHtcbiAgICAgICAgY2FzZSAnY2FiYWwnOlxuICAgICAgICAgIGFyZ3MucHVzaCgncmVwbCcpXG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgY2FzZSAnc3RhY2snOlxuICAgICAgICAgIGFyZ3MucHVzaCgnZ2hjaScpXG4gICAgICAgICAgYnJlYWtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoZ2hjaUFyZ3MubGVuZ3RoID4gMFxuICAgICAgJiYgKHRoaXMuaWRlQ2FiYWxCdWlsZGVyQ29tbWFuZCA9PT0gJ2NhYmFsJ1xuICAgICAgICB8fCB0aGlzLmlkZUNhYmFsQnVpbGRlckNvbW1hbmQgPT09ICdzdGFjaycpKSB7XG4gICAgICByZXR1cm4gYXJncy5jb25jYXQoYC0tZ2hjLW9wdGlvbnM9XCIke2F0b20uY29uZmlnLmdldCgnaGFza2VsbC1kZWJ1Zy5HSENJQXJndW1lbnRzJyl9XCJgKVxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gYXJncy5jb25jYXQoYXRvbS5jb25maWcuZ2V0KCdoYXNrZWxsLWRlYnVnLkdIQ0lBcmd1bWVudHMnKS5zcGxpdCgnICcpKVxuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgZGVzdHJveSgpIHtcbiAgICB0aGlzLmxpbmVIaWdobGlnaHRlci5kZXN0cm95KClcbiAgICB0aGlzLmdoY2lEZWJ1Zy5kZXN0cm95KClcbiAgICB0aGlzLmRlYnVnVmlldy5kZXN0cm95KClcbiAgICB0aGlzLmRlYnVnUGFuZWwuZGVzdHJveSgpXG4gICAgdGhpcy5jdXJyZW50VmFyaWFibGVzUGFuZWwuZGVzdHJveSgpXG4gICAgdGhpcy5jdXJyZW50VmFyaWFibGVzVmlldy5kZXN0cm95KClcbiAgICB0aGlzLnRlcm1pbmFsUmVwb3J0ZXIuZGVzdHJveSgpXG4gICAgdGhpcy5kaXNwb3NhYmxlcy5kaXNwb3NlKClcbiAgfVxuXG4gIGhpZGVQYW5lbHMoKSB7XG4gICAgdGhpcy5kZWJ1Z1BhbmVsLmhpZGUoKVxuICAgIHRoaXMuY3VycmVudFZhcmlhYmxlc1BhbmVsLmhpZGUoKVxuICB9XG5cbiAgc2hvd1BhbmVscygpIHtcbiAgICB0aGlzLmRlYnVnUGFuZWwuc2hvdygpXG4gICAgdGhpcy5jdXJyZW50VmFyaWFibGVzUGFuZWwuc2hvdygpXG4gIH1cblxuICBwcml2YXRlIGRpc3BsYXlHVUkoKSB7XG4gICAgdGhpcy5kZWJ1Z1ZpZXcgPSBuZXcgRGVidWdWaWV3KClcbiAgICB0aGlzLmRlYnVnUGFuZWwgPSBhdG9tLndvcmtzcGFjZS5hZGRUb3BQYW5lbCh7XG4gICAgICBpdGVtOiB0aGlzLmRlYnVnVmlldy5lbGVtZW50XG4gICAgfSlcblxuICAgIHRoaXMuZGVidWdWaWV3LmVtaXR0ZXIub24oJ3N0ZXAnLCAoKSA9PiB0aGlzLnN0ZXAoKSlcbiAgICB0aGlzLmRlYnVnVmlldy5lbWl0dGVyLm9uKCdiYWNrJywgKCkgPT4gdGhpcy5iYWNrKCkpXG4gICAgdGhpcy5kZWJ1Z1ZpZXcuZW1pdHRlci5vbignZm9yd2FyZCcsICgpID0+IHRoaXMuZm9yd2FyZCgpKVxuICAgIHRoaXMuZGVidWdWaWV3LmVtaXR0ZXIub24oJ2NvbnRpbnVlJywgKCkgPT4gdGhpcy5jb250aW51ZSgpKVxuICAgIHRoaXMuZGVidWdWaWV3LmVtaXR0ZXIub24oJ3N0b3AnLCAoKSA9PiB0aGlzLnN0b3AoKSlcblxuICAgIHRoaXMuY3VycmVudFZhcmlhYmxlc1ZpZXcgPSBuZXcgQ3VycmVudFZhcmlhYmxlc1ZpZXcoKVxuICAgIHRoaXMuY3VycmVudFZhcmlhYmxlc1BhbmVsID0gYXRvbS53b3Jrc3BhY2UuYWRkVG9wUGFuZWwoe1xuICAgICAgaXRlbTogdGhpcy5jdXJyZW50VmFyaWFibGVzVmlldy5lbGVtZW50XG4gICAgfSlcbiAgfVxuXG4gIHByaXZhdGUgZGVidWdnZXJFbmFibGVkID0gZmFsc2VcblxuICBwcml2YXRlIHVwZGF0ZUhpc3RvcnlMZW5ndGhBbmRFbmFibGVCdXR0b25zKGhpc3RvcnlMZW5ndGg/OiBudW1iZXIpIHtcbiAgICBpZiAoaGlzdG9yeUxlbmd0aCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzLmhpc3RvcnlTdGF0ZS5zZXRNYXhQb3NpdGlvbihoaXN0b3J5TGVuZ3RoKVxuICAgIH1cblxuICAgIHRoaXMuZGVidWdWaWV3LmVuYWJsZUFsbERlYnVnQnV0dG9ucygpXG4gICAgdGhpcy5kZWJ1Z1ZpZXcuYnV0dG9ucy5iYWNrLmlzRW5hYmxlZCA9IHRoaXMuaGlzdG9yeVN0YXRlLmJhY2tFbmFibGVkXG4gICAgdGhpcy5kZWJ1Z1ZpZXcuYnV0dG9ucy5mb3J3YXJkLmlzRW5hYmxlZCA9IHRoaXMuaGlzdG9yeVN0YXRlLmZvcndhcmRFbmFibGVkXG4gICAgdGhpcy5kZWJ1Z2dlckVuYWJsZWQgPSB0cnVlXG4gIH1cblxuICBwcml2YXRlIGV4ZWN1dGluZ0NvbW1hbmRGcm9tQ29uc29sZSA9IGZhbHNlXG4gIHByaXZhdGUgbGF1bmNoR0hDSURlYnVnQW5kQ29uc29sZShicmVha3BvaW50czogQnJlYWtwb2ludFtdKSB7XG4gICAgdGhpcy5naGNpRGVidWcuZW1pdHRlci5vbignbGluZS1jaGFuZ2VkJywgKGluZm86IEJyZWFrSW5mbykgPT4ge1xuICAgICAgdGhpcy5saW5lSGlnaGxpZ2h0ZXIuaGlnaHRsaWdodExpbmUoaW5mbylcbiAgICAgIHRoaXMudXBkYXRlSGlzdG9yeUxlbmd0aEFuZEVuYWJsZUJ1dHRvbnMoaW5mby5oaXN0b3J5TGVuZ3RoKVxuICAgICAgdGhpcy5jdXJyZW50VmFyaWFibGVzVmlldy51cGRhdGUoaW5mby5sb2NhbEJpbmRpbmdzLCBmYWxzZSlcbiAgICB9KVxuXG4gICAgdGhpcy5naGNpRGVidWcuZW1pdHRlci5vbigncGF1c2VkLW9uLWV4Y2VwdGlvbicsIChpbmZvOiBFeGNlcHRpb25JbmZvKSA9PiB7XG4gICAgICB0aGlzLmxpbmVIaWdobGlnaHRlci5kZXN0cm95KClcbiAgICAgIHRoaXMudXBkYXRlSGlzdG9yeUxlbmd0aEFuZEVuYWJsZUJ1dHRvbnMoaW5mby5oaXN0b3J5TGVuZ3RoKVxuICAgICAgdGhpcy5jdXJyZW50VmFyaWFibGVzVmlldy51cGRhdGUoaW5mby5sb2NhbEJpbmRpbmdzLCB0cnVlKVxuICAgIH0pXG5cbiAgICB0aGlzLmdoY2lEZWJ1Zy5lbWl0dGVyLm9uKCdkZWJ1Zy1maW5pc2hlZCcsICgpID0+IHtcbiAgICAgIHRoaXMuZGVzdHJveSgpXG4gICAgfSlcblxuICAgIHRoaXMuZ2hjaURlYnVnLmVtaXR0ZXIub24oJ2NvbW1hbmQtaXNzdWVkJywgKGNvbW1hbmQ6IHN0cmluZykgPT4ge1xuICAgICAgaWYgKCF0aGlzLmV4ZWN1dGluZ0NvbW1hbmRGcm9tQ29uc29sZSkge1xuICAgICAgICB0aGlzLnRlcm1pbmFsUmVwb3J0ZXIuZGlzcGxheUNvbW1hbmQoY29tbWFuZClcbiAgICAgIH1cblxuICAgICAgdGhpcy5kZWJ1Z2dlckVuYWJsZWQgPSBmYWxzZVxuICAgICAgc2V0VGltZW91dChcbiAgICAgICAgKCkgPT4ge1xuICAgICAgICAgIGlmICghdGhpcy5kZWJ1Z2dlckVuYWJsZWQpIHtcbiAgICAgICAgICAgIHRoaXMuZGVidWdWaWV3LmRpc2FibGVBbGxEZWJ1Z0J1dHRvbnMoKVxuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgMTAwXG4gICAgICApXG4gICAgfSlcblxuICAgIHRoaXMuZ2hjaURlYnVnLmVtaXR0ZXIub24oJ2NvbnNvbGUtb3V0cHV0JywgKG91dHB1dDogc3RyaW5nKSA9PiB7XG4gICAgICB0aGlzLnRlcm1pbmFsUmVwb3J0ZXIud3JpdGUob3V0cHV0KVxuICAgIH0pXG5cbiAgICB0aGlzLmdoY2lEZWJ1Zy5lbWl0dGVyLm9uKCdlcnJvci1jb21wbGV0ZWQnLCAoZXJyb3JUZXh0OiBzdHJpbmcpID0+IHtcbiAgICAgIGlmICghdGhpcy5leGVjdXRpbmdDb21tYW5kRnJvbUNvbnNvbGUpIHtcbiAgICAgICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZEVycm9yKCdHSENJIEVycm9yJywge1xuICAgICAgICAgIGRldGFpbDogZXJyb3JUZXh0LFxuICAgICAgICAgIGRpc21pc3NhYmxlOiB0cnVlXG4gICAgICAgIH0pXG4gICAgICB9XG4gICAgfSlcblxuICAgIHRoaXMuZ2hjaURlYnVnLmVtaXR0ZXIub24oJ2Vycm9yJywgKGVycm9yVGV4dDogc3RyaW5nKSA9PiB7XG4gICAgICB0aGlzLnRlcm1pbmFsUmVwb3J0ZXIud3JpdGUoZXJyb3JUZXh0KVxuICAgIH0pXG5cbiAgICB0aGlzLmdoY2lEZWJ1Zy5hZGRlZEFsbExpc3RlbmVycygpXG5cbiAgICB0aGlzLnRlcm1pbmFsUmVwb3J0ZXIuZW1pdHRlci5vbignY29tbWFuZCcsIGFzeW5jIChjb21tYW5kOiBzdHJpbmcpID0+IHtcbiAgICAgIHRoaXMuZXhlY3V0aW5nQ29tbWFuZEZyb21Db25zb2xlID0gdHJ1ZVxuICAgICAgYXdhaXQgdGhpcy5naGNpRGVidWcucnVuKGNvbW1hbmQsIHRydWUsIHRydWUpXG4gICAgICB0aGlzLmV4ZWN1dGluZ0NvbW1hbmRGcm9tQ29uc29sZSA9IGZhbHNlXG4gICAgfSlcblxuICAgIHRoaXMudGVybWluYWxSZXBvcnRlci5lbWl0dGVyLm9uKCdjbG9zZScsICgpID0+IHtcbiAgICAgIHRoaXMuZ2hjaURlYnVnLnN0b3AoKVxuICAgIH0pXG5cbiAgICB0aGlzLmdoY2lEZWJ1Zy5zZXRFeGNlcHRpb25CcmVha0xldmVsKGF0b20uY29uZmlnLmdldCgnaGFza2VsbC1kZWJ1Zy5icmVha09uRXhjZXB0aW9uJykpXG5cbiAgICB0aGlzLmRlYnVnVmlldy5kaXNhYmxlQWxsRGVidWdCdXR0b25zKClcblxuICAgIGNvbnN0IGZpbGVUb0RlYnVnID0gdGhpcy5lZGl0b3IuZ2V0UGF0aCgpXG4gICAgdGhpcy5naGNpRGVidWcubG9hZE1vZHVsZShmaWxlVG9EZWJ1ZylcblxuICAgIGJyZWFrcG9pbnRzLmZvckVhY2goKG9iKSA9PiB7XG4gICAgICBpZiAob2IuZmlsZSA9PT0gZmlsZVRvRGVidWcpIHtcbiAgICAgICAgdGhpcy5naGNpRGVidWcuYWRkQnJlYWtwb2ludChvYi5saW5lLnRvU3RyaW5nKCkpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLmdoY2lEZWJ1Zy5hZGRCcmVha3BvaW50KG9iKSAvLyBUT0RPOiBtYWtlIHRoaXMgd29yayBwcm9wZXJseVxuICAgICAgfVxuICAgIH0pXG5cbiAgICB0aGlzLmdoY2lEZWJ1Zy5zdGFydERlYnVnKGF0b20uY29uZmlnLmdldCgnaGFza2VsbC1kZWJ1Zy5mdW5jdGlvblRvRGVidWcnKSlcbiAgfVxuXG4gIGNvbnN0cnVjdG9yKFxuICAgIGJyZWFrcG9pbnRzOiBCcmVha3BvaW50W10sXG4gICAgcHJpdmF0ZSBlZGl0b3I6IGF0b21BUEkuVGV4dEVkaXRvcixcbiAgICBwcml2YXRlIGlkZUNhYmFsQnVpbGRlckNvbW1hbmQ/OiBzdHJpbmdcbiAgKSB7XG4gICAgdGhpcy5sYXVuY2hHSENJRGVidWdBbmRDb25zb2xlKGJyZWFrcG9pbnRzKVxuICAgIHRoaXMuZGlzcGxheUdVSSgpXG4gICAgdGhpcy5kaXNwb3NhYmxlcy5hZGQoYXRvbS5jb25maWcub25EaWRDaGFuZ2UoJ2hhc2tlbGwtZGVidWcuYnJlYWtPbkV4Y2VwdGlvbicsICh7IG5ld1ZhbHVlIH0pID0+IHtcbiAgICAgIHRoaXMuZ2hjaURlYnVnLnNldEV4Y2VwdGlvbkJyZWFrTGV2ZWwobmV3VmFsdWUgYXMgRXhjZXB0aW9uQnJlYWtMZXZlbHMpXG4gICAgfSkpXG4gIH1cblxuICAvKiogRm9yIHRoZSB0b29sdGlwIG92ZXJyaWRlKi9cbiAgYXN5bmMgcmVzb2x2ZUV4cHJlc3Npb24oZXhwcmVzc2lvbjogc3RyaW5nKSB7XG4gICAgcmV0dXJuIHRoaXMuZ2hjaURlYnVnLnJlc29sdmVFeHByZXNzaW9uKGV4cHJlc3Npb24pXG4gIH1cblxuICBiYWNrKCkge1xuICAgIGlmICh0aGlzLmhpc3RvcnlTdGF0ZS5zZXRDdXJyZW50UG9zaXRpb24odGhpcy5oaXN0b3J5U3RhdGUuZ2V0Q3VycmVudFBvc2l0aW9uKCkgKyAxKSkge1xuICAgICAgdGhpcy5naGNpRGVidWcuYmFjaygpXG4gICAgfVxuICB9XG5cbiAgZm9yd2FyZCgpIHtcbiAgICBpZiAodGhpcy5oaXN0b3J5U3RhdGUuc2V0Q3VycmVudFBvc2l0aW9uKHRoaXMuaGlzdG9yeVN0YXRlLmdldEN1cnJlbnRQb3NpdGlvbigpIC0gMSkpIHtcbiAgICAgIHRoaXMuZ2hjaURlYnVnLmZvcndhcmQoKVxuICAgIH1cbiAgfVxuXG4gIGNvbnRpbnVlKCkge1xuICAgIHRoaXMuZ2hjaURlYnVnLmNvbnRpbnVlKClcbiAgfVxuXG4gIHN0ZXAoKSB7XG4gICAgdGhpcy5naGNpRGVidWcuc3RlcCgpXG4gIH1cblxuICBzdG9wKCkge1xuICAgIHRoaXMuZ2hjaURlYnVnLnN0b3AoKSAvLyB0aGlzIHdpbGwgdHJpZ2dlciBkZWJ1Zy1maW5pc2hlZCBldmVudFxuICB9XG5cbiAgcHJpdmF0ZSBnZXRXb3JraW5nRm9sZGVyKCkge1xuICAgIGNvbnN0IGZpbGVUb0RlYnVnID0gdGhpcy5lZGl0b3IuZ2V0UGF0aCgpXG4gICAgcmV0dXJuIHBhdGguZGlybmFtZShmaWxlVG9EZWJ1ZylcbiAgfVxufVxuXG5leHBvcnQgPSBEZWJ1Z2dlclxuIl19