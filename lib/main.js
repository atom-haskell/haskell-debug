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
const Debugger_1 = require("./Debugger");
const BreakpointUI_1 = require("./BreakpointUI");
const TooltipOverride_1 = require("./TooltipOverride");
const atomAPI = require("atom");
const os = require("os");
const path = require("path");
const cp = require("child_process");
const config_1 = require("./config");
const SelectDebugModeView_1 = require("./views/SelectDebugModeView");
var config_2 = require("./config");
exports.config = config_2.config;
const breakpointUI = new BreakpointUI_1.BreakpointUI();
let debuggerInst;
let upi;
let state;
let disposables;
const commands = {
    'debug': ({ currentTarget }) => __awaiter(this, void 0, void 0, function* () {
        const ob = upi && (yield upi.getOthersConfigParam('ide-haskell-cabal', 'builder'));
        if (ob) {
            debuggerInst = new Debugger_1.Debugger(breakpointUI.breakpoints, currentTarget.getModel(), ob.name);
        }
        else {
            debuggerInst = new Debugger_1.Debugger(breakpointUI.breakpoints, currentTarget.getModel());
        }
    }),
    'debug-back': () => {
        if (debuggerInst) {
            debuggerInst.back();
        }
    },
    'debug-forward': () => {
        if (debuggerInst) {
            debuggerInst.forward();
        }
    },
    'debug-step': () => {
        if (debuggerInst) {
            debuggerInst.step();
        }
    },
    'debug-stop': () => {
        if (debuggerInst) {
            debuggerInst.stop();
        }
    },
    'debug-continue': () => {
        if (debuggerInst) {
            debuggerInst.continue();
        }
    },
    'toggle-breakpoint': ({ currentTarget }) => {
        breakpointUI.toggleBreakpoint(currentTarget.getModel().getCursorBufferPosition().row + 1, currentTarget.getModel());
    },
    'set-break-on-exception': () => __awaiter(this, void 0, void 0, function* () {
        const result = yield SelectDebugModeView_1.selectDebugModeView(config_1.debugModes, atom.config.get('haskell-debug.breakOnException'));
        if (result !== undefined) {
            atom.config.set('haskell-debug.breakOnException', result);
        }
    }),
};
function onFirstRun() {
    state = {
        properlyActivated: false,
    };
    const isWin = os.platform().indexOf('win') > -1;
    const where = isWin ? 'where' : 'whereis';
    const out = cp.exec(where + ' node');
    out.on('close', (code) => {
        if (code === 1) {
            atom.config.set('haskell-debug.nodeCommand', path.resolve(atom.packages.getApmPath(), '../../bin/atom'));
            if (state) {
                state.properlyActivated = true;
            }
        }
    });
}
function activePaneObserver(pane) {
    if (atom.workspace.isTextEditor(pane)) {
        const te = pane;
        const scopes = te.getRootScopeDescriptor().getScopesArray();
        if (scopes.length === 1 && scopes[0] === 'source.haskell') {
            if (!te.hasHaskellBreakpoints) {
                breakpointUI.attachToNewTextEditor(te);
                te.hasHaskellBreakpoints = true;
            }
            if (debuggerInst) {
                debuggerInst.showPanels();
            }
            return;
        }
    }
    if (debuggerInst) {
        debuggerInst.hidePanels();
    }
}
function activate(_state) {
    disposables = new atomAPI.CompositeDisposable();
    state = _state;
    if (state === undefined || state.properlyActivated !== true) {
        onFirstRun();
    }
    disposables.add(atom.workspace.observeActivePaneItem(activePaneObserver));
    for (const command of Object.keys(commands)) {
        disposables.add(atom.commands.add("atom-text-editor[data-grammar='source haskell']", 'haskell:' + command, commands[command]));
    }
}
exports.activate = activate;
function deactivate() {
    disposables && disposables.dispose();
}
exports.deactivate = deactivate;
function serialize() {
    return state;
}
exports.serialize = serialize;
function consumeHaskellUpi(reg) {
    const tooltipOverride = new TooltipOverride_1.TooltipOverride((expression) => __awaiter(this, void 0, void 0, function* () {
        if (debuggerInst === undefined) {
            return undefined;
        }
        return debuggerInst.resolveExpression(expression);
    }));
    upi = reg({
        name: 'haskell-debug',
        tooltip: {
            priority: 100,
            handler: tooltipOverride.tooltipHandler.bind(tooltipOverride),
        },
    });
    return upi;
}
exports.consumeHaskellUpi = consumeHaskellUpi;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9saWIvbWFpbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O0FBQUEseUNBQW1DO0FBQ25DLGlEQUEyQztBQUMzQyx1REFBaUQ7QUFDakQsZ0NBQStCO0FBQy9CLHlCQUF5QjtBQUN6Qiw2QkFBNkI7QUFDN0Isb0NBQW9DO0FBQ3BDLHFDQUFxQztBQUNyQyxxRUFBaUU7QUFDakUsbUNBQWlDO0FBQXhCLDBCQUFBLE1BQU0sQ0FBQTtBQUVmLE1BQU0sWUFBWSxHQUFHLElBQUksMkJBQVksRUFBRSxDQUFBO0FBRXZDLElBQUksWUFBa0MsQ0FBQTtBQUN0QyxJQUFJLEdBQWlDLENBQUE7QUFDckMsSUFBSSxLQUFvQyxDQUFBO0FBQ3hDLElBQUksV0FBb0QsQ0FBQTtBQUV4RCxNQUFNLFFBQVEsR0FBRztJQUNmLE9BQU8sRUFBRSxDQUFPLEVBQUUsYUFBYSxFQUFzQjtRQUNuRCxNQUFNLEVBQUUsR0FBRyxHQUFHLEtBQUksTUFBTSxHQUFHLENBQUMsb0JBQW9CLENBQW1CLG1CQUFtQixFQUFFLFNBQVMsQ0FBQyxDQUFBLENBQUE7UUFDbEcsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNQLFlBQVksR0FBRyxJQUFJLG1CQUFRLENBQUMsWUFBWSxDQUFDLFdBQVcsRUFBRSxhQUFhLENBQUMsUUFBUSxFQUFFLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFBO1FBQzFGLENBQUM7UUFBQyxJQUFJLENBQUMsQ0FBQztZQUNOLFlBQVksR0FBRyxJQUFJLG1CQUFRLENBQUMsWUFBWSxDQUFDLFdBQVcsRUFBRSxhQUFhLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQTtRQUNqRixDQUFDO0lBQ0gsQ0FBQyxDQUFBO0lBQ0QsWUFBWSxFQUFFO1FBQ1osRUFBRSxDQUFDLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQztZQUNqQixZQUFZLENBQUMsSUFBSSxFQUFF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Q0FBQyxPQUFPLEVBQUUsQ0FBQTtBQUN0QyxDQUFDO0FBRkQsZ0NBRUM7QUFFRDtJQUNFLE1BQU0sQ0FBQyxLQUFLLENBQUE7QUFDZCxDQUFDO0FBRkQsOEJBRUM7QUFFRCwyQkFBa0MsR0FBeUI7SUFDekQsTUFBTSxlQUFlLEdBQUcsSUFBSSxpQ0FBZSxDQUFDLENBQU8sVUFBVTtRQUMzRCxFQUFFLENBQUMsQ0FBQyxZQUFZLEtBQUssU0FBUyxDQUFDLENBQUMsQ0FBQztZQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUE7UUFBQyxDQUFDO1FBQ3BELE1BQU0sQ0FBQyxZQUFZLENBQUMsaUJBQWlCLENBQUMsVUFBVSxDQUFDLENBQUE7SUFDbkQsQ0FBQyxDQUFBLENBQUMsQ0FBQTtJQUNGLEdBQUcsR0FBRyxHQUFHLENBQUM7UUFDUixJQUFJLEVBQUUsZUFBZTtRQUNyQixPQUFPLEVBQUU7WUFDUCxRQUFRLEVBQUUsR0FBRztZQUNiLE9BQU8sRUFBRSxlQUFlLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUM7U0FDOUQ7S0FDRixDQUFDLENBQUE7SUFDRixNQUFNLENBQUMsR0FBRyxDQUFBO0FBQ1osQ0FBQztBQWJELDhDQWFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtEZWJ1Z2dlcn0gZnJvbSAnLi9EZWJ1Z2dlcidcbmltcG9ydCB7QnJlYWtwb2ludFVJfSBmcm9tICcuL0JyZWFrcG9pbnRVSSdcbmltcG9ydCB7VG9vbHRpcE92ZXJyaWRlfSBmcm9tICcuL1Rvb2x0aXBPdmVycmlkZSdcbmltcG9ydCAqIGFzIGF0b21BUEkgZnJvbSAnYXRvbSdcbmltcG9ydCBvcyA9IHJlcXVpcmUoJ29zJylcbmltcG9ydCBwYXRoID0gcmVxdWlyZSgncGF0aCcpXG5pbXBvcnQgY3AgPSByZXF1aXJlKCdjaGlsZF9wcm9jZXNzJylcbmltcG9ydCB7IGRlYnVnTW9kZXMgfSBmcm9tICcuL2NvbmZpZydcbmltcG9ydCB7IHNlbGVjdERlYnVnTW9kZVZpZXcgfSBmcm9tICcuL3ZpZXdzL1NlbGVjdERlYnVnTW9kZVZpZXcnXG5leHBvcnQgeyBjb25maWcgfSBmcm9tICcuL2NvbmZpZydcblxuY29uc3QgYnJlYWtwb2ludFVJID0gbmV3IEJyZWFrcG9pbnRVSSgpXG5cbmxldCBkZWJ1Z2dlckluc3Q6IERlYnVnZ2VyIHwgdW5kZWZpbmVkXG5sZXQgdXBpOiBVUEkuSVVQSUluc3RhbmNlIHwgdW5kZWZpbmVkXG5sZXQgc3RhdGU6IEhhc2tlbGxEZWJ1Z1N0YXRlIHwgdW5kZWZpbmVkXG5sZXQgZGlzcG9zYWJsZXM6IGF0b21BUEkuQ29tcG9zaXRlRGlzcG9zYWJsZSB8IHVuZGVmaW5lZFxuXG5jb25zdCBjb21tYW5kcyA9IHtcbiAgJ2RlYnVnJzogYXN5bmMgKHsgY3VycmVudFRhcmdldCB9OiBhdG9tQVBJLklFdmVudERlc2MpID0+IHtcbiAgICBjb25zdCBvYiA9IHVwaSAmJiBhd2FpdCB1cGkuZ2V0T3RoZXJzQ29uZmlnUGFyYW08eyBuYW1lOiBzdHJpbmcgfT4oJ2lkZS1oYXNrZWxsLWNhYmFsJywgJ2J1aWxkZXInKVxuICAgIGlmIChvYikge1xuICAgICAgZGVidWdnZXJJbnN0ID0gbmV3IERlYnVnZ2VyKGJyZWFrcG9pbnRVSS5icmVha3BvaW50cywgY3VycmVudFRhcmdldC5nZXRNb2RlbCgpLCBvYi5uYW1lKVxuICAgIH0gZWxzZSB7XG4gICAgICBkZWJ1Z2dlckluc3QgPSBuZXcgRGVidWdnZXIoYnJlYWtwb2ludFVJLmJyZWFrcG9pbnRzLCBjdXJyZW50VGFyZ2V0LmdldE1vZGVsKCkpXG4gICAgfVxuICB9LFxuICAnZGVidWctYmFjayc6ICgpID0+IHtcbiAgICBpZiAoZGVidWdnZXJJbnN0KSB7XG4gICAgICBkZWJ1Z2dlckluc3QuYmFjaygpXG4gICAgfVxuICB9LFxuICAnZGVidWctZm9yd2FyZCc6ICgpID0+IHtcbiAgICBpZiAoZGVidWdnZXJJbnN0KSB7XG4gICAgICBkZWJ1Z2dlckluc3QuZm9yd2FyZCgpXG4gICAgfVxuICB9LFxuICAnZGVidWctc3RlcCc6ICgpID0+IHtcbiAgICBpZiAoZGVidWdnZXJJbnN0KSB7XG4gICAgICBkZWJ1Z2dlckluc3Quc3RlcCgpXG4gICAgfVxuICB9LFxuICAnZGVidWctc3RvcCc6ICgpID0+IHtcbiAgICBpZiAoZGVidWdnZXJJbnN0KSB7XG4gICAgICBkZWJ1Z2dlckluc3Quc3RvcCgpXG4gICAgfVxuICB9LFxuICAnZGVidWctY29udGludWUnOiAoKSA9PiB7XG4gICAgaWYgKGRlYnVnZ2VySW5zdCkge1xuICAgICAgZGVidWdnZXJJbnN0LmNvbnRpbnVlKClcbiAgICB9XG4gIH0sXG4gICd0b2dnbGUtYnJlYWtwb2ludCc6ICh7IGN1cnJlbnRUYXJnZXQgfTogYXRvbUFQSS5JRXZlbnREZXNjKSA9PiB7XG4gICAgYnJlYWtwb2ludFVJLnRvZ2dsZUJyZWFrcG9pbnQoXG4gICAgICBjdXJyZW50VGFyZ2V0LmdldE1vZGVsKCkuZ2V0Q3Vyc29yQnVmZmVyUG9zaXRpb24oKS5yb3cgKyAxLFxuICAgICAgY3VycmVudFRhcmdldC5nZXRNb2RlbCgpLFxuICAgIClcbiAgfSxcbiAgJ3NldC1icmVhay1vbi1leGNlcHRpb24nOiBhc3luYyAoKSA9PiB7XG4gICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgc2VsZWN0RGVidWdNb2RlVmlldyhkZWJ1Z01vZGVzLCBhdG9tLmNvbmZpZy5nZXQoJ2hhc2tlbGwtZGVidWcuYnJlYWtPbkV4Y2VwdGlvbicpKVxuICAgIGlmIChyZXN1bHQgIT09IHVuZGVmaW5lZCkgeyBhdG9tLmNvbmZpZy5zZXQoJ2hhc2tlbGwtZGVidWcuYnJlYWtPbkV4Y2VwdGlvbicsIHJlc3VsdCkgfVxuICB9LFxufVxuXG5mdW5jdGlvbiBvbkZpcnN0UnVuKCkge1xuICBzdGF0ZSA9IHtcbiAgICBwcm9wZXJseUFjdGl2YXRlZDogZmFsc2UsXG4gIH1cblxuICAvLyBmcm9tIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvMzQ5NTMxNjgvbm9kZS1jaGVjay1leGlzdGVuY2Utb2YtY29tbWFuZC1pbi1wYXRoXG4gIGNvbnN0IGlzV2luID0gb3MucGxhdGZvcm0oKS5pbmRleE9mKCd3aW4nKSA+IC0xXG4gIGNvbnN0IHdoZXJlID0gaXNXaW4gPyAnd2hlcmUnIDogJ3doZXJlaXMnXG5cbiAgY29uc3Qgb3V0ID0gY3AuZXhlYyh3aGVyZSArICcgbm9kZScpXG5cbiAgb3V0Lm9uKCdjbG9zZScsIChjb2RlKSA9PiB7XG4gICAgaWYgKGNvZGUgPT09IDEpIHsvLyBub3QgZm91bmRcbiAgICAgIC8vIGZhbGxiYWNrIHRvIHRoZSBub2RlIGluIGFwbVxuICAgICAgYXRvbS5jb25maWcuc2V0KCdoYXNrZWxsLWRlYnVnLm5vZGVDb21tYW5kJywgcGF0aC5yZXNvbHZlKGF0b20ucGFja2FnZXMuZ2V0QXBtUGF0aCgpLCAnLi4vLi4vYmluL2F0b20nKSlcbiAgICAgIGlmIChzdGF0ZSkgeyBzdGF0ZS5wcm9wZXJseUFjdGl2YXRlZCA9IHRydWUgfVxuICAgIH1cbiAgfSlcbn1cblxuZnVuY3Rpb24gYWN0aXZlUGFuZU9ic2VydmVyKHBhbmU6IGF0b21BUEkuUGFuZSkge1xuICBpZiAoYXRvbS53b3Jrc3BhY2UuaXNUZXh0RWRpdG9yKHBhbmUpKSB7XG4gICAgY29uc3QgdGU6IGF0b21BUEkuVGV4dEVkaXRvciAmIHsgaGFzSGFza2VsbEJyZWFrcG9pbnRzPzogYm9vbGVhbiB9ID0gcGFuZVxuICAgIGNvbnN0IHNjb3BlcyA9IHRlLmdldFJvb3RTY29wZURlc2NyaXB0b3IoKS5nZXRTY29wZXNBcnJheSgpXG4gICAgaWYgKHNjb3Blcy5sZW5ndGggPT09IDEgJiYgc2NvcGVzWzBdID09PSAnc291cmNlLmhhc2tlbGwnKSB7XG4gICAgICBpZiAoIXRlLmhhc0hhc2tlbGxCcmVha3BvaW50cykge1xuICAgICAgICBicmVha3BvaW50VUkuYXR0YWNoVG9OZXdUZXh0RWRpdG9yKHRlKVxuICAgICAgICB0ZS5oYXNIYXNrZWxsQnJlYWtwb2ludHMgPSB0cnVlXG4gICAgICB9XG4gICAgICBpZiAoZGVidWdnZXJJbnN0KSB7XG4gICAgICAgIGRlYnVnZ2VySW5zdC5zaG93UGFuZWxzKClcbiAgICAgIH1cbiAgICAgIHJldHVybiAgLy8gZG9uJ3QgZG8gYmVsb3dcbiAgICB9XG4gIH1cbiAgLy8gaWYgYW55IHBhbmUgdGhhdCBpc24ndCBhIGhhc2tlbGwgc291cmNlIGZpbGUgYW5kIHdlJ3JlIGRlYnVnZ2luZ1xuICBpZiAoZGVidWdnZXJJbnN0KSB7XG4gICAgZGVidWdnZXJJbnN0LmhpZGVQYW5lbHMoKVxuICB9XG59XG5cbmludGVyZmFjZSBIYXNrZWxsRGVidWdTdGF0ZSB7XG4gIHByb3Blcmx5QWN0aXZhdGVkOiBib29sZWFuXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhY3RpdmF0ZShfc3RhdGU/OiBIYXNrZWxsRGVidWdTdGF0ZSkge1xuICBkaXNwb3NhYmxlcyA9IG5ldyBhdG9tQVBJLkNvbXBvc2l0ZURpc3Bvc2FibGUoKVxuICBzdGF0ZSA9IF9zdGF0ZVxuXG4gIGlmIChzdGF0ZSA9PT0gdW5kZWZpbmVkIHx8IHN0YXRlLnByb3Blcmx5QWN0aXZhdGVkICE9PSB0cnVlKSB7XG4gICAgb25GaXJzdFJ1bigpXG4gIH1cbiAgZGlzcG9zYWJsZXMuYWRkKGF0b20ud29ya3NwYWNlLm9ic2VydmVBY3RpdmVQYW5lSXRlbShhY3RpdmVQYW5lT2JzZXJ2ZXIpKVxuXG4gIGZvciAoY29uc3QgY29tbWFuZCBvZiBPYmplY3Qua2V5cyhjb21tYW5kcykpIHtcbiAgICBkaXNwb3NhYmxlcy5hZGQoXG4gICAgICBhdG9tLmNvbW1hbmRzLmFkZChcbiAgICAgICAgXCJhdG9tLXRleHQtZWRpdG9yW2RhdGEtZ3JhbW1hcj0nc291cmNlIGhhc2tlbGwnXVwiLFxuICAgICAgICAnaGFza2VsbDonICsgY29tbWFuZCxcbiAgICAgICAgY29tbWFuZHNbY29tbWFuZF0sXG4gICAgICApLFxuICAgIClcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gZGVhY3RpdmF0ZSgpIHtcbiAgZGlzcG9zYWJsZXMgJiYgZGlzcG9zYWJsZXMuZGlzcG9zZSgpXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXJpYWxpemUoKSB7XG4gIHJldHVybiBzdGF0ZVxufVxuXG5leHBvcnQgZnVuY3Rpb24gY29uc3VtZUhhc2tlbGxVcGkocmVnOiBVUEkuSVVQSVJlZ2lzdHJhdGlvbikge1xuICBjb25zdCB0b29sdGlwT3ZlcnJpZGUgPSBuZXcgVG9vbHRpcE92ZXJyaWRlKGFzeW5jIChleHByZXNzaW9uKSA9PiB7XG4gICAgaWYgKGRlYnVnZ2VySW5zdCA9PT0gdW5kZWZpbmVkKSB7IHJldHVybiB1bmRlZmluZWQgfVxuICAgIHJldHVybiBkZWJ1Z2dlckluc3QucmVzb2x2ZUV4cHJlc3Npb24oZXhwcmVzc2lvbilcbiAgfSlcbiAgdXBpID0gcmVnKHtcbiAgICBuYW1lOiAnaGFza2VsbC1kZWJ1ZycsXG4gICAgdG9vbHRpcDoge1xuICAgICAgcHJpb3JpdHk6IDEwMCxcbiAgICAgIGhhbmRsZXI6IHRvb2x0aXBPdmVycmlkZS50b29sdGlwSGFuZGxlci5iaW5kKHRvb2x0aXBPdmVycmlkZSksXG4gICAgfSxcbiAgfSlcbiAgcmV0dXJuIHVwaVxufVxuIl19