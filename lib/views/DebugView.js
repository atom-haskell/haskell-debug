"use strict";
const Draggable = require("draggable");
const emissary = require("emissary");
const Button = require("./Button");
const _ = require("lodash");
class DebugView {
    constructor() {
        this.emitter = new emissary.Emitter();
        this.buttons = {
            step: null,
            back: null,
            forward: null,
            continue: null,
            stop: null
        };
        this.element = document.createElement("atom-panel");
        this.element.className = "debug-toolbar padded";
        this.container = document.createElement("div");
        this.container.classList.add("btn-group");
        this.container.classList.add("btn-group-lg");
        this.element.appendChild(this.container);
        this.buttons.step = this.addButton("Step forward", "arrow-down", "step");
        this.buttons.back = this.addButton("Back in history", "chevron-up", "back");
        this.buttons.forward = this.addButton("Forward in history", "chevron-down", "forward");
        this.buttons.continue = this.addButton("Continue", "playback-play", "continue");
        this.buttons.stop = this.addButton("Stop", "primitive-square", "stop");
        this.draggable = new Draggable(this.element, {
            onDragStart: () => this.cancelButtonsClick()
        });
        this.draggable.set(atom.workspace.getActiveTextEditor()["width"] / 2 - 87, 30);
    }
    addButton(description, icon, eventName) {
        var button = new Button(description, icon);
        button.emitter.on("click", () => this.emitter.emit(eventName, null));
        this.container.appendChild(button.element);
        return button;
    }
    cancelButtonsClick() {
        _.values(this.buttons).forEach((button) => button.startClick = false);
    }
    disableAllDebugButtons() {
        _.values(this.buttons).forEach(button => {
            if (button != this.buttons.stop)
                button.isEnabled = false;
        });
    }
    enableAllDebugButtons() {
        _.values(this.buttons).forEach(button => {
            if (button != this.buttons.stop)
                button.isEnabled = true;
        });
    }
    destroy() {
        for (var buttonName of Object.keys(this.buttons)) {
            var button = this.buttons[buttonName];
            button.destroy();
        }
    }
}
module.exports = DebugView;
