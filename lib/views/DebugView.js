"use strict";
const Draggable = require("draggable");
const atomAPI = require("atom");
class DebugView {
    constructor() {
        this.emitter = new atomAPI.Emitter();
        this.buttons = {
            forward: null,
            back: null
        };
        this.element = document.createElement("atom-panel");
        this.element.className = "debug-toolbar padded";
        this.container = document.createElement("div");
        this.container.classList.add("btn-group");
        this.container.classList.add("btn-group-lg");
        this.element.appendChild(this.container);
        this.addButton("Step forward", "arrow-down", "step");
        this.buttons.back = this.addButton("Back in history", "chevron-up", "back");
        this.buttons.forward = this.addButton("Forward in history", "chevron-down", "forward");
        this.addButton("Continue", "playback-play", "continue");
        this.addButton("Stop", "primitive-square", "stop");
        this.draggable = new Draggable(this.element);
        this.draggable.set(atom.workspace.getActiveTextEditor()["width"] / 2 - 87, 30);
    }
    addButton(description, icon, eventName) {
        var button = document.createElement("button");
        button.className = "btn btn-primary icon";
        button.classList.add("icon-" + icon);
        atom.tooltips.add(button, {
            title: description
        });
        button.addEventListener("click", () => this.emitter.emit(eventName, null));
        return this.container.appendChild(button);
    }
    setButtonEnabled(button, enabled) {
        if (enabled) {
            this.buttons[button].classList.remove("disabled");
        }
        else {
            this.buttons[button].classList.add("disabled");
        }
    }
}
module.exports = DebugView;
