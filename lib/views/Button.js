"use strict";
const emissary = require("emissary");
class Button {
    constructor(description, icon) {
        this.emitter = new emissary.Emitter();
        this.startClick = false;
        this._isEnabled = true;
        this.element = document.createElement("button");
        this.element.className = "btn btn-primary icon";
        this.element.classList.add("icon-" + icon);
        this.tooltip = atom.tooltips.add(this.element, {
            title: description
        });
        this.element.addEventListener("mousedown", () => {
            this.startClick = true;
        });
        this.element.addEventListener("click", () => {
            if (this.startClick && this._isEnabled)
                this.emitter.emit("click", null);
        });
    }
    set isEnabled(enabled) {
        if (enabled) {
            this.element.classList.remove("disabled");
        }
        else {
            this.element.classList.add("disabled");
        }
        this._isEnabled = enabled;
    }
    destroy() {
        this.tooltip.dispose();
    }
}
module.exports = Button;
