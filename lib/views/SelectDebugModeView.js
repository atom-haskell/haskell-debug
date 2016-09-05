"use strict";
const spacePen = require("atom-space-pen-views");
const emissary = require("emissary");
const React = require("./ReactPolyfill");
class SelectDebugModeView extends spacePen.SelectListView {
    constructor(debugModes, activeItem) {
        super(debugModes, activeItem);
        this.emitter = new emissary.Emitter();
    }
    ;
    initialize(debugModes, activeItem) {
        this.debugModes = debugModes;
        this.activeItem = activeItem;
        super.initialize();
        this.storeFocusedElement();
        this.setItems(debugModes);
        this.element.querySelector("ol").classList.add("mark-active");
    }
    viewForItem(item) {
        var element = React.createElement("li", null, item.description);
        if (item.value == this.activeItem) {
            element.classList.add("active");
        }
        return element;
    }
    confirmed(item) {
        this.emitter.emit("selected", item.value);
        this.cancel();
    }
    cancelled() {
        this.emitter.emit("canceled");
    }
}
module.exports = SelectDebugModeView;
