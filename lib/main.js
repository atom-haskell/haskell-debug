"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
const Debugger = require("./Debugger");
const BreakpointUI = require("./BreakpointUI");
const TooltipOverride = require("./TooltipOverride");
var Main;
(function (Main) {
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
            Main.debugger_ = new Debugger(Main.breakpointUI.breakpoints);
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
            Main.breakpointUI.toggleBreakpoint(atom.workspace.getActiveTextEditor().getCursorBufferPosition().row);
        }
    };
    function activate() {
        console.log("YAY!!");
        atom.workspace.observeTextEditors((te) => {
            var scopes = te.getRootScopeDescriptor().scopes;
            if (scopes.length == 1 &&
                scopes[0] == "source.haskell") {
                Main.breakpointUI = new BreakpointUI();
            }
        });
        for (var command of Object.keys(Main.commands)) {
            atom.commands.add("atom-text-editor[data-grammar='source haskell']", "haskell:" + command, Main.commands[command]);
        }
    }
    Main.activate = activate;
    function consumeHaskellUpi(upi) {
        Main.tooltipOverride.consumeHaskellUpi(upi);
    }
    Main.consumeHaskellUpi = consumeHaskellUpi;
})(Main || (Main = {}));
module.exports = Main;
