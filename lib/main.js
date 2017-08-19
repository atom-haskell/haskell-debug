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
const atomAPI = require("atom");
const os = require("os");
const path = require("path");
const cp = require("child_process");
const config_1 = require("./config");
var config_2 = require("./config");
exports.config = config_2.config;
const breakpointUI = new BreakpointUI();
let debuggerInst;
let upi;
let state;
let disposables;
const commands = {
    'debug': ({ currentTarget }) => __awaiter(this, void 0, void 0, function* () {
        const ob = upi && (yield upi.getOthersConfigParam('ide-haskell-cabal', 'builder'));
        if (ob) {
            debuggerInst = new Debugger(breakpointUI.breakpoints, currentTarget.getModel(), ob.name);
        }
        else {
            debuggerInst = new Debugger(breakpointUI.breakpoints, currentTarget.getModel());
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
        const selectDebugModeView = require('./views/SelectDebugModeView');
        const result = yield selectDebugModeView(config_1.debugModes, atom.config.get('haskell-debug.breakOnException'));
        if (result !== undefined) {
            atom.config.set('haskell-debug.breakOnException', result);
        }
    })
};
function onFirstRun() {
    state = {
        properlyActivated: false
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
    const tooltipOverride = new TooltipOverride((expression) => __awaiter(this, void 0, void 0, function* () {
        if (debuggerInst === undefined) {
            return;
        }
        return debuggerInst.resolveExpression(expression);
    }));
    upi = reg({
        name: 'haskell-debug',
        tooltip: {
            priority: 100,
            handler: tooltipOverride.tooltipHandler.bind(tooltipOverride)
        }
    });
    return upi;
}
exports.consumeHaskellUpi = consumeHaskellUpi;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9saWIvbWFpbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O0FBQUEsdUNBQXVDO0FBQ3ZDLCtDQUErQztBQUMvQyxxREFBcUQ7QUFDckQsZ0NBQWdDO0FBQ2hDLHlCQUF5QjtBQUN6Qiw2QkFBNkI7QUFDN0Isb0NBQW9DO0FBQ3BDLHFDQUFxQztBQUNyQyxtQ0FBaUM7QUFBeEIsMEJBQUEsTUFBTSxDQUFBO0FBRWYsTUFBTSxZQUFZLEdBQUcsSUFBSSxZQUFZLEVBQUUsQ0FBQTtBQUV2QyxJQUFJLFlBQWtDLENBQUE7QUFDdEMsSUFBSSxHQUFpQyxDQUFBO0FBQ3JDLElBQUksS0FBb0MsQ0FBQTtBQUN4QyxJQUFJLFdBQW9ELENBQUE7QUFFeEQsTUFBTSxRQUFRLEdBQUc7SUFDZixPQUFPLEVBQUUsQ0FBTyxFQUFFLGFBQWEsRUFBc0I7UUFDbkQsTUFBTSxFQUFFLEdBQUcsR0FBRyxLQUFJLE1BQU0sR0FBRyxDQUFDLG9CQUFvQixDQUFtQixtQkFBbUIsRUFBRSxTQUFTLENBQUMsQ0FBQSxDQUFBO1FBQ2xHLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDUCxZQUFZLEdBQUcsSUFBSSxRQUFRLENBQUMsWUFBWSxDQUFDLFdBQVcsRUFBRSxhQUFhLENBQUMsUUFBUSxFQUFFLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFBO1FBQzFGLENBQUM7UUFBQyxJQUFJLENBQUMsQ0FBQztZQUNOLFlBQVksR0FBRyxJQUFJLFFBQVEsQ0FBQyxZQUFZLENBQUMsV0FBVyxFQUFFLGFBQWEsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFBO1FBQ2pGLENBQUM7SUFDSCxDQUFDLENBQUE7SUFDRCxZQUFZLEVBQUU7UUFDWixFQUFFLENBQUMsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDO1lBQ2pCLFlBQVksQ0FBQyxJQUFJLEVBQUUsQ0FBQTtRQUNyQixDQUFD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RCw0QkFrQkM7QUFFRDtJQUNFLFdBQVcsSUFBSSxXQUFXLENBQUMsT0FBTyxFQUFFLENBQUE7QUFDdEMsQ0FBQztBQUZELGdDQUVDO0FBRUQ7SUFDRSxNQUFNLENBQUMsS0FBSyxDQUFBO0FBQ2QsQ0FBQztBQUZELDhCQUVDO0FBRUQsMkJBQWtDLEdBQXlCO0lBQ3pELE1BQU0sZUFBZSxHQUFHLElBQUksZUFBZSxDQUFDLENBQU8sVUFBVTtRQUMzRCxFQUFFLENBQUMsQ0FBQyxZQUFZLEtBQUssU0FBUyxDQUFDLENBQUMsQ0FBQztZQUFDLE1BQU0sQ0FBQTtRQUFDLENBQUM7UUFDMUMsTUFBTSxDQUFDLFlBQVksQ0FBQyxpQkFBaUIsQ0FBQyxVQUFVLENBQUMsQ0FBQTtJQUNuRCxDQUFDLENBQUEsQ0FBQyxDQUFBO0lBQ0YsR0FBRyxHQUFHLEdBQUcsQ0FBQztRQUNSLElBQUksRUFBRSxlQUFlO1FBQ3JCLE9BQU8sRUFBRTtZQUNQLFFBQVEsRUFBRSxHQUFHO1lBQ2IsT0FBTyxFQUFFLGVBQWUsQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQztTQUM5RDtLQUNGLENBQUMsQ0FBQTtJQUNGLE1BQU0sQ0FBQyxHQUFHLENBQUE7QUFDWixDQUFDO0FBYkQsOENBYUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgRGVidWdnZXIgPSByZXF1aXJlKCcuL0RlYnVnZ2VyJylcbmltcG9ydCBCcmVha3BvaW50VUkgPSByZXF1aXJlKCcuL0JyZWFrcG9pbnRVSScpXG5pbXBvcnQgVG9vbHRpcE92ZXJyaWRlID0gcmVxdWlyZSgnLi9Ub29sdGlwT3ZlcnJpZGUnKVxuaW1wb3J0IGF0b21BUEkgPSByZXF1aXJlKCdhdG9tJylcbmltcG9ydCBvcyA9IHJlcXVpcmUoJ29zJylcbmltcG9ydCBwYXRoID0gcmVxdWlyZSgncGF0aCcpXG5pbXBvcnQgY3AgPSByZXF1aXJlKCdjaGlsZF9wcm9jZXNzJylcbmltcG9ydCB7IGRlYnVnTW9kZXMgfSBmcm9tICcuL2NvbmZpZydcbmV4cG9ydCB7IGNvbmZpZyB9IGZyb20gJy4vY29uZmlnJ1xuXG5jb25zdCBicmVha3BvaW50VUkgPSBuZXcgQnJlYWtwb2ludFVJKClcblxubGV0IGRlYnVnZ2VySW5zdDogRGVidWdnZXIgfCB1bmRlZmluZWRcbmxldCB1cGk6IFVQSS5JVVBJSW5zdGFuY2UgfCB1bmRlZmluZWRcbmxldCBzdGF0ZTogSGFza2VsbERlYnVnU3RhdGUgfCB1bmRlZmluZWRcbmxldCBkaXNwb3NhYmxlczogYXRvbUFQSS5Db21wb3NpdGVEaXNwb3NhYmxlIHwgdW5kZWZpbmVkXG5cbmNvbnN0IGNvbW1hbmRzID0ge1xuICAnZGVidWcnOiBhc3luYyAoeyBjdXJyZW50VGFyZ2V0IH06IGF0b21BUEkuSUV2ZW50RGVzYykgPT4ge1xuICAgIGNvbnN0IG9iID0gdXBpICYmIGF3YWl0IHVwaS5nZXRPdGhlcnNDb25maWdQYXJhbTx7IG5hbWU6IHN0cmluZyB9PignaWRlLWhhc2tlbGwtY2FiYWwnLCAnYnVpbGRlcicpXG4gICAgaWYgKG9iKSB7XG4gICAgICBkZWJ1Z2dlckluc3QgPSBuZXcgRGVidWdnZXIoYnJlYWtwb2ludFVJLmJyZWFrcG9pbnRzLCBjdXJyZW50VGFyZ2V0LmdldE1vZGVsKCksIG9iLm5hbWUpXG4gICAgfSBlbHNlIHtcbiAgICAgIGRlYnVnZ2VySW5zdCA9IG5ldyBEZWJ1Z2dlcihicmVha3BvaW50VUkuYnJlYWtwb2ludHMsIGN1cnJlbnRUYXJnZXQuZ2V0TW9kZWwoKSlcbiAgICB9XG4gIH0sXG4gICdkZWJ1Zy1iYWNrJzogKCkgPT4ge1xuICAgIGlmIChkZWJ1Z2dlckluc3QpIHtcbiAgICAgIGRlYnVnZ2VySW5zdC5iYWNrKClcbiAgICB9XG4gIH0sXG4gICdkZWJ1Zy1mb3J3YXJkJzogKCkgPT4ge1xuICAgIGlmIChkZWJ1Z2dlckluc3QpIHtcbiAgICAgIGRlYnVnZ2VySW5zdC5mb3J3YXJkKClcbiAgICB9XG4gIH0sXG4gICdkZWJ1Zy1zdGVwJzogKCkgPT4ge1xuICAgIGlmIChkZWJ1Z2dlckluc3QpIHtcbiAgICAgIGRlYnVnZ2VySW5zdC5zdGVwKClcbiAgICB9XG4gIH0sXG4gICdkZWJ1Zy1zdG9wJzogKCkgPT4ge1xuICAgIGlmIChkZWJ1Z2dlckluc3QpIHtcbiAgICAgIGRlYnVnZ2VySW5zdC5zdG9wKClcbiAgICB9XG4gIH0sXG4gICdkZWJ1Zy1jb250aW51ZSc6ICgpID0+IHtcbiAgICBpZiAoZGVidWdnZXJJbnN0KSB7XG4gICAgICBkZWJ1Z2dlckluc3QuY29udGludWUoKVxuICAgIH1cbiAgfSxcbiAgJ3RvZ2dsZS1icmVha3BvaW50JzogKHsgY3VycmVudFRhcmdldCB9OiBhdG9tQVBJLklFdmVudERlc2MpID0+IHtcbiAgICBicmVha3BvaW50VUkudG9nZ2xlQnJlYWtwb2ludChcbiAgICAgIGN1cnJlbnRUYXJnZXQuZ2V0TW9kZWwoKS5nZXRDdXJzb3JCdWZmZXJQb3NpdGlvbigpLnJvdyArIDEsXG4gICAgICBjdXJyZW50VGFyZ2V0LmdldE1vZGVsKClcbiAgICApXG4gIH0sXG4gICdzZXQtYnJlYWstb24tZXhjZXB0aW9uJzogYXN5bmMgKCkgPT4ge1xuICAgIGNvbnN0IHNlbGVjdERlYnVnTW9kZVZpZXcgPSByZXF1aXJlKCcuL3ZpZXdzL1NlbGVjdERlYnVnTW9kZVZpZXcnKVxuICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHNlbGVjdERlYnVnTW9kZVZpZXcoZGVidWdNb2RlcywgYXRvbS5jb25maWcuZ2V0KCdoYXNrZWxsLWRlYnVnLmJyZWFrT25FeGNlcHRpb24nKSlcbiAgICBpZiAocmVzdWx0ICE9PSB1bmRlZmluZWQpIHsgYXRvbS5jb25maWcuc2V0KCdoYXNrZWxsLWRlYnVnLmJyZWFrT25FeGNlcHRpb24nLCByZXN1bHQpIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBvbkZpcnN0UnVuKCkge1xuICBzdGF0ZSA9IHtcbiAgICBwcm9wZXJseUFjdGl2YXRlZDogZmFsc2VcbiAgfVxuXG4gIC8vIGZyb20gaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8zNDk1MzE2OC9ub2RlLWNoZWNrLWV4aXN0ZW5jZS1vZi1jb21tYW5kLWluLXBhdGhcbiAgY29uc3QgaXNXaW4gPSBvcy5wbGF0Zm9ybSgpLmluZGV4T2YoJ3dpbicpID4gLTFcbiAgY29uc3Qgd2hlcmUgPSBpc1dpbiA/ICd3aGVyZScgOiAnd2hlcmVpcydcblxuICBjb25zdCBvdXQgPSBjcC5leGVjKHdoZXJlICsgJyBub2RlJylcblxuICBvdXQub24oJ2Nsb3NlJywgKGNvZGUpID0+IHtcbiAgICBpZiAoY29kZSA9PT0gMSkgey8vIG5vdCBmb3VuZFxuICAgICAgLy8gZmFsbGJhY2sgdG8gdGhlIG5vZGUgaW4gYXBtXG4gICAgICBhdG9tLmNvbmZpZy5zZXQoJ2hhc2tlbGwtZGVidWcubm9kZUNvbW1hbmQnLCBwYXRoLnJlc29sdmUoYXRvbS5wYWNrYWdlcy5nZXRBcG1QYXRoKCksICcuLi8uLi9iaW4vYXRvbScpKVxuICAgICAgaWYgKHN0YXRlKSB7IHN0YXRlLnByb3Blcmx5QWN0aXZhdGVkID0gdHJ1ZSB9XG4gICAgfVxuICB9KVxufVxuXG5mdW5jdGlvbiBhY3RpdmVQYW5lT2JzZXJ2ZXIocGFuZTogYXRvbUFQSS5QYW5lKSB7XG4gIGlmIChhdG9tLndvcmtzcGFjZS5pc1RleHRFZGl0b3IocGFuZSkpIHtcbiAgICBjb25zdCB0ZTogYXRvbUFQSS5UZXh0RWRpdG9yICYgeyBoYXNIYXNrZWxsQnJlYWtwb2ludHM/OiBib29sZWFuIH0gPSBwYW5lXG4gICAgY29uc3Qgc2NvcGVzID0gdGUuZ2V0Um9vdFNjb3BlRGVzY3JpcHRvcigpLmdldFNjb3Blc0FycmF5KClcbiAgICBpZiAoc2NvcGVzLmxlbmd0aCA9PT0gMSAmJiBzY29wZXNbMF0gPT09ICdzb3VyY2UuaGFza2VsbCcpIHtcbiAgICAgIGlmICghdGUuaGFzSGFza2VsbEJyZWFrcG9pbnRzKSB7XG4gICAgICAgIGJyZWFrcG9pbnRVSS5hdHRhY2hUb05ld1RleHRFZGl0b3IodGUpXG4gICAgICAgIHRlLmhhc0hhc2tlbGxCcmVha3BvaW50cyA9IHRydWVcbiAgICAgIH1cbiAgICAgIGlmIChkZWJ1Z2dlckluc3QpIHtcbiAgICAgICAgZGVidWdnZXJJbnN0LnNob3dQYW5lbHMoKVxuICAgICAgfVxuICAgICAgcmV0dXJuICAvLyBkb24ndCBkbyBiZWxvd1xuICAgIH1cbiAgfVxuICAvLyBpZiBhbnkgcGFuZSB0aGF0IGlzbid0IGEgaGFza2VsbCBzb3VyY2UgZmlsZSBhbmQgd2UncmUgZGVidWdnaW5nXG4gIGlmIChkZWJ1Z2dlckluc3QpIHtcbiAgICBkZWJ1Z2dlckluc3QuaGlkZVBhbmVscygpXG4gIH1cbn1cblxuaW50ZXJmYWNlIEhhc2tlbGxEZWJ1Z1N0YXRlIHtcbiAgcHJvcGVybHlBY3RpdmF0ZWQ6IGJvb2xlYW5cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGFjdGl2YXRlKF9zdGF0ZT86IEhhc2tlbGxEZWJ1Z1N0YXRlKSB7XG4gIGRpc3Bvc2FibGVzID0gbmV3IGF0b21BUEkuQ29tcG9zaXRlRGlzcG9zYWJsZSgpXG4gIHN0YXRlID0gX3N0YXRlXG5cbiAgaWYgKHN0YXRlID09PSB1bmRlZmluZWQgfHwgc3RhdGUucHJvcGVybHlBY3RpdmF0ZWQgIT09IHRydWUpIHtcbiAgICBvbkZpcnN0UnVuKClcbiAgfVxuICBkaXNwb3NhYmxlcy5hZGQoYXRvbS53b3Jrc3BhY2Uub2JzZXJ2ZUFjdGl2ZVBhbmVJdGVtKGFjdGl2ZVBhbmVPYnNlcnZlcikpXG5cbiAgZm9yIChjb25zdCBjb21tYW5kIG9mIE9iamVjdC5rZXlzKGNvbW1hbmRzKSkge1xuICAgIGRpc3Bvc2FibGVzLmFkZChcbiAgICAgIGF0b20uY29tbWFuZHMuYWRkKFxuICAgICAgICBcImF0b20tdGV4dC1lZGl0b3JbZGF0YS1ncmFtbWFyPSdzb3VyY2UgaGFza2VsbCddXCIsXG4gICAgICAgICdoYXNrZWxsOicgKyBjb21tYW5kLFxuICAgICAgICBjb21tYW5kc1tjb21tYW5kXVxuICAgICAgKVxuICAgIClcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gZGVhY3RpdmF0ZSgpIHtcbiAgZGlzcG9zYWJsZXMgJiYgZGlzcG9zYWJsZXMuZGlzcG9zZSgpXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXJpYWxpemUoKSB7XG4gIHJldHVybiBzdGF0ZVxufVxuXG5leHBvcnQgZnVuY3Rpb24gY29uc3VtZUhhc2tlbGxVcGkocmVnOiBVUEkuSVVQSVJlZ2lzdHJhdGlvbikge1xuICBjb25zdCB0b29sdGlwT3ZlcnJpZGUgPSBuZXcgVG9vbHRpcE92ZXJyaWRlKGFzeW5jIChleHByZXNzaW9uKSA9PiB7XG4gICAgaWYgKGRlYnVnZ2VySW5zdCA9PT0gdW5kZWZpbmVkKSB7IHJldHVybiB9XG4gICAgcmV0dXJuIGRlYnVnZ2VySW5zdC5yZXNvbHZlRXhwcmVzc2lvbihleHByZXNzaW9uKVxuICB9KVxuICB1cGkgPSByZWcoe1xuICAgIG5hbWU6ICdoYXNrZWxsLWRlYnVnJyxcbiAgICB0b29sdGlwOiB7XG4gICAgICBwcmlvcml0eTogMTAwLFxuICAgICAgaGFuZGxlcjogdG9vbHRpcE92ZXJyaWRlLnRvb2x0aXBIYW5kbGVyLmJpbmQodG9vbHRpcE92ZXJyaWRlKVxuICAgIH1cbiAgfSlcbiAgcmV0dXJuIHVwaVxufVxuIl19