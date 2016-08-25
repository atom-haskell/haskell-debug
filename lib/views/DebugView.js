"use strict";
const Draggable = require("draggable");
const atomAPI = require("atom");
const _ = require("lodash");
class Button {
    constructor(description, icon) {
        this.emitter = new atomAPI.Emitter();
        this.element = document.createElement("button");
        this.element.className = "btn btn-primary icon";
        this.element.classList.add("icon-" + icon);
        this.tooltip = atom.tooltips.add(this.element, {
            title: description
        });
        this.element.addEventListener("click", () => this.emitter.emit("click", null));
    }
    set isEnabled(enabled) {
        if (enabled) {
            this.element.classList.remove("disabled");
        }
        else {
            this.element.classList.add("disabled");
        }
    }
    dispose() {
        this.tooltip.dispose();
    }
}
class DebugView {
    constructor() {
        this.emitter = new atomAPI.Emitter();
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
        this.draggable = new Draggable(this.element);
        this.draggable.set(atom.workspace.getActiveTextEditor()["width"] / 2 - 87, 30);
    }
    addButton(description, icon, eventName) {
        var button = new Button(description, icon);
        button.emitter.on("click", () => this.emitter.emit(eventName, null));
        this.container.appendChild(button.element);
        return button;
    }
    disabledAllButtons() {
        _.values(this.buttons).forEach(button => button.isEnabled = false);
    }
    dispose() {
        for (var buttonName of Object.keys(this.buttons)) {
            var button = this.buttons[buttonName];
            button.dispose();
        }
    }
}
module.exports = DebugView;
