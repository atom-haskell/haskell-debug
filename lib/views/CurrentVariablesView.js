"use strict";
const Draggable = require("draggable");
const React = require("./ReactPolyfill");
class CurrentVariablesView {
    constructor() {
        this.element =
            React.createElement("atom-panel", null, 
                React.createElement("h3", null, "Local Variables"), 
                this.list = React.createElement("table", null));
        this.draggable = new Draggable(this.element);
        this.draggable.set(atom.workspace.getActiveTextEditor()["width"] / 2 - 87, 30);
    }
    updateList(localBindings) {
        while (this.list.firstChild) {
            this.list.removeChild(this.list.firstChild);
        }
        for (var binding of localBindings) {
            this.list.appendChild(React.createElement("tr", null, 
                React.createElement("th", null, binding.name), 
                React.createElement("th", null, binding.value)));
        }
    }
}
module.exports = CurrentVariablesView;
