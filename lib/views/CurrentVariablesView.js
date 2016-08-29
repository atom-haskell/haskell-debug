"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
const Draggable = require("draggable");
const React = require("./ReactPolyfill");
const Highlights = require("highlights");
class CurrentVariablesView {
    constructor() {
        this.highlighter = new Highlights({ registry: atom.grammars });
        this.element =
            React.createElement("atom-panel", {style: "z-index: 10;", class: "padded"}, 
                React.createElement("div", {class: "inset-panel"}, 
                    React.createElement("div", {class: "panel-heading"}, "Local Variables"), 
                    React.createElement("div", {class: "panel-body padded"}, this.list = React.createElement("ul", {class: 'list-group'})))
            );
        this.draggable = new Draggable(this.element);
        this.draggable.set(atom.workspace.getActiveTextEditor()["width"] / 2 + 500, 100);
    }
    updateList(localBindings) {
        return __awaiter(this, void 0, void 0, function* () {
            while (this.list.firstChild) {
                this.list.removeChild(this.list.firstChild);
            }
            for (var binding of localBindings) {
                this.list.appendChild(React.createElement("li", null, yield this.highlighter.highlight({
                    fileContents: binding,
                    scopeName: "source.haskell"
                })));
            }
        });
    }
    destroy() {
    }
}
module.exports = CurrentVariablesView;
