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
    const tooltipOverride = new TooltipOverride((expression) => __awaiter(this, void 0, void 0, function* () {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9saWIvbWFpbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O0FBQUEsdUNBQXVDO0FBQ3ZDLCtDQUErQztBQUMvQyxxREFBcUQ7QUFDckQsZ0NBQWdDO0FBQ2hDLHlCQUF5QjtBQUN6Qiw2QkFBNkI7QUFDN0Isb0NBQW9DO0FBQ3BDLHFDQUFxQztBQUNyQyxtQ0FBaUM7QUFBeEIsMEJBQUEsTUFBTSxDQUFBO0FBRWYsTUFBTSxZQUFZLEdBQUcsSUFBSSxZQUFZLEVBQUUsQ0FBQTtBQUV2QyxJQUFJLFlBQWtDLENBQUE7QUFDdEMsSUFBSSxHQUFpQyxDQUFBO0FBQ3JDLElBQUksS0FBb0MsQ0FBQTtBQUN4QyxJQUFJLFdBQW9ELENBQUE7QUFFeEQsTUFBTSxRQUFRLEdBQUc7SUFDZixPQUFPLEVBQUUsQ0FBTyxFQUFFLGFBQWEsRUFBc0I7UUFDbkQsTUFBTSxFQUFFLEdBQUcsR0FBRyxLQUFJLE1BQU0sR0FBRyxDQUFDLG9CQUFvQixDQUFtQixtQkFBbUIsRUFBRSxTQUFTLENBQUMsQ0FBQSxDQUFBO1FBQ2xHLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDUCxZQUFZLEdBQUcsSUFBSSxRQUFRLENBQUMsWUFBWSxDQUFDLFdBQVcsRUFBRSxhQUFhLENBQUMsUUFBUSxFQUFFLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFBO1FBQzFGLENBQUM7UUFBQyxJQUFJLENBQUMsQ0FBQztZQUNOLFlBQVksR0FBRyxJQUFJLFFBQVEsQ0FBQyxZQUFZLENBQUMsV0FBVyxFQUFFLGFBQWEsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFBO1FBQ2pGLENBQUM7SUFDSCxDQUFDLENBQUE7SUFDRCxZQUFZLEVBQUU7UUFDWixFQUFFLENBQUMsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDO1lBQ2pCLFlBQVksQ0FBQyxJQUFJLEVBQUUsQ0FBQTtRQUNyQixDQUFDO0lBQ0gsQ0FBQztJQUNELGVBQWUsRUFBRTtRQUNmLEVBQUUsQ0FBQyxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUM7WUFDakIsWUFBWSxDQUFDLE9BQU8sRUFBRSxDQUFBO1FBQ3hCLENBQUM7SUFDSCxDQUFDO0lBQ0QsWUFBWSxFQUFFO1FBQ1osRUFBRSxDQUFDLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQztZQUNqQixZQUFZLENBQUMsSUFBSSxFQUFFLENBQUE7UUFDckIsQ0FBQztJQUNILENBQUM7SUFDRCxZQUFZLEVBQUU7UUFDWixFQUFFLENBQUMsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDO1lBQ2pCLFlBQVksQ0FBQyxJQUFJLEVBQUUsQ0FBQTtRQUNyQixDQUFDO0lBQ0gsQ0FBQztJQUNELGdCQUFnQixFQUFFO1FBQ2hCLEVBQUUsQ0FBQyxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUM7WUFDakIsWUFBWSxDQUFDLFFBQVEsRUFBRSxDQUFBO1FBQ3pCLENBQUM7SUFDSCxDQUFDO0lBQ0QsbUJBQW1CLEVBQUUsQ0FBQyxFQUFFLGFBQWEsRUFBc0I7UUFDekQsWUFBWSxDQUFDLGdCQUFnQixDQUMzQixhQUFhLENBQUMsUUFBUSxFQUFFLENBQUMsdUJBQXVCLEVBQUUsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxFQUMxRCxhQUFhLENBQUMsUUFBUSxFQUFFLENBQ3pCLENBQUE7SUFDSCxDQUFDO0lBQ0Qsd0JBQXdCLEVBQUU7UUFDeEIsTUFBTSxtQkFBbUIsR0FBRyxPQUFPLENBQUMsNkJBQTZCLENBQUMsQ0FBQTtRQUNsRSxNQUFNLE1BQU0sR0FBRyxNQUFNLG1CQUFtQixDQUFDLG1CQUFVLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsZ0NBQWdDLENBQUMsQ0FBQyxDQUFBO1FBQ3ZHLEVBQUUsQ0FBQyxDQUFDLE1BQU0sS0FBSyxTQUFTLENBQUMsQ0FBQyxDQUFDO1lBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsZ0NBQWdDLEVBQUUsTUFBTSxDQUFDLENBQUE7UUFBQyxDQUFDO0lBQ3pGLENBQUMsQ0FBQTtDQUNGLENBQUE7QUFFRDtJQUNFLEtBQUssR0FBRztRQUNOLGlCQUFpQixFQUFFLEtBQUs7S0FDekIsQ0FBQTtJQUdELE1BQU0sS0FBSyxHQUFHLEVBQUUsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUE7SUFDL0MsTUFBTSxLQUFLLEdBQUcsS0FBSyxHQUFHLE9BQU8sR0FBRyxTQUFTLENBQUE7SUFFekMsTUFBTSxHQUFHLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxLQUFLLEdBQUcsT0FBTyxDQUFDLENBQUE7SUFFcEMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxJQUFJO1FBQ25CLEVBQUUsQ0FBQyxDQUFDLElBQUksS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRWYsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsMkJBQTJCLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLFVBQVUsRUFBRSxFQUFFLGdCQUFnQixDQUFDLENBQUMsQ0FBQTtZQUN4RyxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO2dCQUFDLEtBQUssQ0FBQyxpQkFBaUIsR0FBRyxJQUFJLENBQUE7WUFBQyxDQUFDO1FBQy9DLENBQUM7SUFDSCxDQUFDLENBQUMsQ0FBQTtBQUNKLENBQUM7QUFFRCw0QkFBNEIsSUFBa0I7SUFDNUMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3RDLE1BQU0sRUFBRSxHQUE2RCxJQUFJLENBQUE7UUFDekUsTUFBTSxNQUFNLEdBQUcsRUFBRSxDQUFDLHNCQUFzQixFQUFFLENBQUMsY0FBYyxFQUFFLENBQUE7UUFDM0QsRUFBRSxDQUFDLENBQUMsTUFBTSxDQUFDLE1BQU0sS0FBSyxDQUFDLElBQUksTUFBTSxDQUFDLENBQUMsQ0FBQyxLQUFLLGdCQUFnQixDQUFDLENBQUMsQ0FBQztZQUMxRCxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDLENBQUM7Z0JBQzlCLFlBQVksQ0FBQyxxQkFBcUIsQ0FBQyxFQUFFLENBQUMsQ0FBQTtnQkFDdEMsRUFBRSxDQUFDLHFCQUFxQixHQUFHLElBQUksQ0FBQTtZQUNqQyxDQUFDO1lBQ0QsRUFBRSxDQUFDLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQztnQkFDakIsWUFBWSxDQUFDLFVBQVUsRUFBRSxDQUFBO1lBQzNCLENBQUM7WUFDRCxNQUFNLENBQUE7UUFDUixDQUFDO0lBQ0gsQ0FBQztJQUVELEVBQUUsQ0FBQyxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUM7UUFDakIsWUFBWSxDQUFDLFVBQVUsRUFBRSxDQUFBO0lBQzNCLENBQUM7QUFDSCxDQUFDO0FBTUQsa0JBQXlCLE1BQTBCO0lBQ2pELFdBQVcsR0FBRyxJQUFJLE9BQU8sQ0FBQyxtQkFBbUIsRUFBRSxDQUFBO0lBQy9DLEtBQUssR0FBRyxNQUFNLENBQUE7SUFFZCxFQUFFLENBQUMsQ0FBQyxLQUFLLEtBQUssU0FBUyxJQUFJLEtBQUssQ0FBQyxpQkFBaUIsS0FBSyxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBQzVELFVBQVUsRUFBRSxDQUFBO0lBQ2QsQ0FBQztJQUNELFdBQVcsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxxQkFBcUIsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLENBQUE7SUFFekUsR0FBRyxDQUFDLENBQUMsTUFBTSxPQUFPLElBQUksTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDNUMsV0FBVyxDQUFDLEdBQUcsQ0FDYixJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FDZixpREFBaUQsRUFDakQsVUFBVSxHQUFHLE9BQU8sRUFDcEIsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUNsQixDQUNGLENBQUE7SUFDSCxDQUFDO0FBQ0gsQ0FBQztBQWxCRCw0QkFrQkM7QUFFRDtJQUNFLFdBQVcsSUFBSSxXQUFXLENBQUMsT0FBTyxFQUFFLENBQUE7QUFDdEMsQ0FBQztBQUZELGdDQUVDO0FBRUQ7SUFDRSxNQUFNLENBQUMsS0FBSyxDQUFBO0FBQ2QsQ0FBQztBQUZELDhCQUVDO0FBRUQsMkJBQWtDLEdBQXlCO0lBQ3pELE1BQU0sZUFBZSxHQUFHLElBQUksZUFBZSxDQUFDLENBQU8sVUFBVTtRQUMzRCxFQUFFLENBQUMsQ0FBQyxZQUFZLEtBQUssU0FBUyxDQUFDLENBQUMsQ0FBQztZQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUE7UUFBQyxDQUFDO1FBQ3BELE1BQU0sQ0FBQyxZQUFZLENBQUMsaUJBQWlCLENBQUMsVUFBVSxDQUFDLENBQUE7SUFDbkQsQ0FBQyxDQUFBLENBQUMsQ0FBQTtJQUNGLEdBQUcsR0FBRyxHQUFHLENBQUM7UUFDUixJQUFJLEVBQUUsZUFBZTtRQUNyQixPQUFPLEVBQUU7WUFDUCxRQUFRLEVBQUUsR0FBRztZQUNiLE9BQU8sRUFBRSxlQUFlLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUM7U0FDOUQ7S0FDRixDQUFDLENBQUE7SUFDRixNQUFNLENBQUMsR0FBRyxDQUFBO0FBQ1osQ0FBQztBQWJELDhDQWFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IERlYnVnZ2VyID0gcmVxdWlyZSgnLi9EZWJ1Z2dlcicpXG5pbXBvcnQgQnJlYWtwb2ludFVJID0gcmVxdWlyZSgnLi9CcmVha3BvaW50VUknKVxuaW1wb3J0IFRvb2x0aXBPdmVycmlkZSA9IHJlcXVpcmUoJy4vVG9vbHRpcE92ZXJyaWRlJylcbmltcG9ydCBhdG9tQVBJID0gcmVxdWlyZSgnYXRvbScpXG5pbXBvcnQgb3MgPSByZXF1aXJlKCdvcycpXG5pbXBvcnQgcGF0aCA9IHJlcXVpcmUoJ3BhdGgnKVxuaW1wb3J0IGNwID0gcmVxdWlyZSgnY2hpbGRfcHJvY2VzcycpXG5pbXBvcnQgeyBkZWJ1Z01vZGVzIH0gZnJvbSAnLi9jb25maWcnXG5leHBvcnQgeyBjb25maWcgfSBmcm9tICcuL2NvbmZpZydcblxuY29uc3QgYnJlYWtwb2ludFVJID0gbmV3IEJyZWFrcG9pbnRVSSgpXG5cbmxldCBkZWJ1Z2dlckluc3Q6IERlYnVnZ2VyIHwgdW5kZWZpbmVkXG5sZXQgdXBpOiBVUEkuSVVQSUluc3RhbmNlIHwgdW5kZWZpbmVkXG5sZXQgc3RhdGU6IEhhc2tlbGxEZWJ1Z1N0YXRlIHwgdW5kZWZpbmVkXG5sZXQgZGlzcG9zYWJsZXM6IGF0b21BUEkuQ29tcG9zaXRlRGlzcG9zYWJsZSB8IHVuZGVmaW5lZFxuXG5jb25zdCBjb21tYW5kcyA9IHtcbiAgJ2RlYnVnJzogYXN5bmMgKHsgY3VycmVudFRhcmdldCB9OiBhdG9tQVBJLklFdmVudERlc2MpID0+IHtcbiAgICBjb25zdCBvYiA9IHVwaSAmJiBhd2FpdCB1cGkuZ2V0T3RoZXJzQ29uZmlnUGFyYW08eyBuYW1lOiBzdHJpbmcgfT4oJ2lkZS1oYXNrZWxsLWNhYmFsJywgJ2J1aWxkZXInKVxuICAgIGlmIChvYikge1xuICAgICAgZGVidWdnZXJJbnN0ID0gbmV3IERlYnVnZ2VyKGJyZWFrcG9pbnRVSS5icmVha3BvaW50cywgY3VycmVudFRhcmdldC5nZXRNb2RlbCgpLCBvYi5uYW1lKVxuICAgIH0gZWxzZSB7XG4gICAgICBkZWJ1Z2dlckluc3QgPSBuZXcgRGVidWdnZXIoYnJlYWtwb2ludFVJLmJyZWFrcG9pbnRzLCBjdXJyZW50VGFyZ2V0LmdldE1vZGVsKCkpXG4gICAgfVxuICB9LFxuICAnZGVidWctYmFjayc6ICgpID0+IHtcbiAgICBpZiAoZGVidWdnZXJJbnN0KSB7XG4gICAgICBkZWJ1Z2dlckluc3QuYmFjaygpXG4gICAgfVxuICB9LFxuICAnZGVidWctZm9yd2FyZCc6ICgpID0+IHtcbiAgICBpZiAoZGVidWdnZXJJbnN0KSB7XG4gICAgICBkZWJ1Z2dlckluc3QuZm9yd2FyZCgpXG4gICAgfVxuICB9LFxuICAnZGVidWctc3RlcCc6ICgpID0+IHtcbiAgICBpZiAoZGVidWdnZXJJbnN0KSB7XG4gICAgICBkZWJ1Z2dlckluc3Quc3RlcCgpXG4gICAgfVxuICB9LFxuICAnZGVidWctc3RvcCc6ICgpID0+IHtcbiAgICBpZiAoZGVidWdnZXJJbnN0KSB7XG4gICAgICBkZWJ1Z2dlckluc3Quc3RvcCgpXG4gICAgfVxuICB9LFxuICAnZGVidWctY29udGludWUnOiAoKSA9PiB7XG4gICAgaWYgKGRlYnVnZ2VySW5zdCkge1xuICAgICAgZGVidWdnZXJJbnN0LmNvbnRpbnVlKClcbiAgICB9XG4gIH0sXG4gICd0b2dnbGUtYnJlYWtwb2ludCc6ICh7IGN1cnJlbnRUYXJnZXQgfTogYXRvbUFQSS5JRXZlbnREZXNjKSA9PiB7XG4gICAgYnJlYWtwb2ludFVJLnRvZ2dsZUJyZWFrcG9pbnQoXG4gICAgICBjdXJyZW50VGFyZ2V0LmdldE1vZGVsKCkuZ2V0Q3Vyc29yQnVmZmVyUG9zaXRpb24oKS5yb3cgKyAxLFxuICAgICAgY3VycmVudFRhcmdldC5nZXRNb2RlbCgpLFxuICAgIClcbiAgfSxcbiAgJ3NldC1icmVhay1vbi1leGNlcHRpb24nOiBhc3luYyAoKSA9PiB7XG4gICAgY29uc3Qgc2VsZWN0RGVidWdNb2RlVmlldyA9IHJlcXVpcmUoJy4vdmlld3MvU2VsZWN0RGVidWdNb2RlVmlldycpXG4gICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgc2VsZWN0RGVidWdNb2RlVmlldyhkZWJ1Z01vZGVzLCBhdG9tLmNvbmZpZy5nZXQoJ2hhc2tlbGwtZGVidWcuYnJlYWtPbkV4Y2VwdGlvbicpKVxuICAgIGlmIChyZXN1bHQgIT09IHVuZGVmaW5lZCkgeyBhdG9tLmNvbmZpZy5zZXQoJ2hhc2tlbGwtZGVidWcuYnJlYWtPbkV4Y2VwdGlvbicsIHJlc3VsdCkgfVxuICB9LFxufVxuXG5mdW5jdGlvbiBvbkZpcnN0UnVuKCkge1xuICBzdGF0ZSA9IHtcbiAgICBwcm9wZXJseUFjdGl2YXRlZDogZmFsc2UsXG4gIH1cblxuICAvLyBmcm9tIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvMzQ5NTMxNjgvbm9kZS1jaGVjay1leGlzdGVuY2Utb2YtY29tbWFuZC1pbi1wYXRoXG4gIGNvbnN0IGlzV2luID0gb3MucGxhdGZvcm0oKS5pbmRleE9mKCd3aW4nKSA+IC0xXG4gIGNvbnN0IHdoZXJlID0gaXNXaW4gPyAnd2hlcmUnIDogJ3doZXJlaXMnXG5cbiAgY29uc3Qgb3V0ID0gY3AuZXhlYyh3aGVyZSArICcgbm9kZScpXG5cbiAgb3V0Lm9uKCdjbG9zZScsIChjb2RlKSA9PiB7XG4gICAgaWYgKGNvZGUgPT09IDEpIHsvLyBub3QgZm91bmRcbiAgICAgIC8vIGZhbGxiYWNrIHRvIHRoZSBub2RlIGluIGFwbVxuICAgICAgYXRvbS5jb25maWcuc2V0KCdoYXNrZWxsLWRlYnVnLm5vZGVDb21tYW5kJywgcGF0aC5yZXNvbHZlKGF0b20ucGFja2FnZXMuZ2V0QXBtUGF0aCgpLCAnLi4vLi4vYmluL2F0b20nKSlcbiAgICAgIGlmIChzdGF0ZSkgeyBzdGF0ZS5wcm9wZXJseUFjdGl2YXRlZCA9IHRydWUgfVxuICAgIH1cbiAgfSlcbn1cblxuZnVuY3Rpb24gYWN0aXZlUGFuZU9ic2VydmVyKHBhbmU6IGF0b21BUEkuUGFuZSkge1xuICBpZiAoYXRvbS53b3Jrc3BhY2UuaXNUZXh0RWRpdG9yKHBhbmUpKSB7XG4gICAgY29uc3QgdGU6IGF0b21BUEkuVGV4dEVkaXRvciAmIHsgaGFzSGFza2VsbEJyZWFrcG9pbnRzPzogYm9vbGVhbiB9ID0gcGFuZVxuICAgIGNvbnN0IHNjb3BlcyA9IHRlLmdldFJvb3RTY29wZURlc2NyaXB0b3IoKS5nZXRTY29wZXNBcnJheSgpXG4gICAgaWYgKHNjb3Blcy5sZW5ndGggPT09IDEgJiYgc2NvcGVzWzBdID09PSAnc291cmNlLmhhc2tlbGwnKSB7XG4gICAgICBpZiAoIXRlLmhhc0hhc2tlbGxCcmVha3BvaW50cykge1xuICAgICAgICBicmVha3BvaW50VUkuYXR0YWNoVG9OZXdUZXh0RWRpdG9yKHRlKVxuICAgICAgICB0ZS5oYXNIYXNrZWxsQnJlYWtwb2ludHMgPSB0cnVlXG4gICAgICB9XG4gICAgICBpZiAoZGVidWdnZXJJbnN0KSB7XG4gICAgICAgIGRlYnVnZ2VySW5zdC5zaG93UGFuZWxzKClcbiAgICAgIH1cbiAgICAgIHJldHVybiAgLy8gZG9uJ3QgZG8gYmVsb3dcbiAgICB9XG4gIH1cbiAgLy8gaWYgYW55IHBhbmUgdGhhdCBpc24ndCBhIGhhc2tlbGwgc291cmNlIGZpbGUgYW5kIHdlJ3JlIGRlYnVnZ2luZ1xuICBpZiAoZGVidWdnZXJJbnN0KSB7XG4gICAgZGVidWdnZXJJbnN0LmhpZGVQYW5lbHMoKVxuICB9XG59XG5cbmludGVyZmFjZSBIYXNrZWxsRGVidWdTdGF0ZSB7XG4gIHByb3Blcmx5QWN0aXZhdGVkOiBib29sZWFuXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhY3RpdmF0ZShfc3RhdGU/OiBIYXNrZWxsRGVidWdTdGF0ZSkge1xuICBkaXNwb3NhYmxlcyA9IG5ldyBhdG9tQVBJLkNvbXBvc2l0ZURpc3Bvc2FibGUoKVxuICBzdGF0ZSA9IF9zdGF0ZVxuXG4gIGlmIChzdGF0ZSA9PT0gdW5kZWZpbmVkIHx8IHN0YXRlLnByb3Blcmx5QWN0aXZhdGVkICE9PSB0cnVlKSB7XG4gICAgb25GaXJzdFJ1bigpXG4gIH1cbiAgZGlzcG9zYWJsZXMuYWRkKGF0b20ud29ya3NwYWNlLm9ic2VydmVBY3RpdmVQYW5lSXRlbShhY3RpdmVQYW5lT2JzZXJ2ZXIpKVxuXG4gIGZvciAoY29uc3QgY29tbWFuZCBvZiBPYmplY3Qua2V5cyhjb21tYW5kcykpIHtcbiAgICBkaXNwb3NhYmxlcy5hZGQoXG4gICAgICBhdG9tLmNvbW1hbmRzLmFkZChcbiAgICAgICAgXCJhdG9tLXRleHQtZWRpdG9yW2RhdGEtZ3JhbW1hcj0nc291cmNlIGhhc2tlbGwnXVwiLFxuICAgICAgICAnaGFza2VsbDonICsgY29tbWFuZCxcbiAgICAgICAgY29tbWFuZHNbY29tbWFuZF0sXG4gICAgICApLFxuICAgIClcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gZGVhY3RpdmF0ZSgpIHtcbiAgZGlzcG9zYWJsZXMgJiYgZGlzcG9zYWJsZXMuZGlzcG9zZSgpXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXJpYWxpemUoKSB7XG4gIHJldHVybiBzdGF0ZVxufVxuXG5leHBvcnQgZnVuY3Rpb24gY29uc3VtZUhhc2tlbGxVcGkocmVnOiBVUEkuSVVQSVJlZ2lzdHJhdGlvbikge1xuICBjb25zdCB0b29sdGlwT3ZlcnJpZGUgPSBuZXcgVG9vbHRpcE92ZXJyaWRlKGFzeW5jIChleHByZXNzaW9uKSA9PiB7XG4gICAgaWYgKGRlYnVnZ2VySW5zdCA9PT0gdW5kZWZpbmVkKSB7IHJldHVybiB1bmRlZmluZWQgfVxuICAgIHJldHVybiBkZWJ1Z2dlckluc3QucmVzb2x2ZUV4cHJlc3Npb24oZXhwcmVzc2lvbilcbiAgfSlcbiAgdXBpID0gcmVnKHtcbiAgICBuYW1lOiAnaGFza2VsbC1kZWJ1ZycsXG4gICAgdG9vbHRpcDoge1xuICAgICAgcHJpb3JpdHk6IDEwMCxcbiAgICAgIGhhbmRsZXI6IHRvb2x0aXBPdmVycmlkZS50b29sdGlwSGFuZGxlci5iaW5kKHRvb2x0aXBPdmVycmlkZSksXG4gICAgfSxcbiAgfSlcbiAgcmV0dXJuIHVwaVxufVxuIl19