import Draggable = require("draggable");
import atomAPI = require("atom");

interface DebugViewEmitter extends atomAPI.Emitter{
    on(eventName: "forward" | "back" | "continue" | "stop", handler: () => any);
}

class DebugView {
    element: HTMLElement;
    private container: HTMLElement;
    private draggable: Draggable;

    /** Event Handler
      *
      * Events corrispond to the button pressed. These are: forward, back, continue or stop.
      */
    public emitter: DebugViewEmitter = new atomAPI.Emitter();

    private addButton(description: string, icon: string, eventName: string){
        var button = document.createElement("button");

        button.className = "btn btn-primary icon";
        button.classList.add("icon-" + icon);

        atom.tooltips.add(button, {
            title: description
        })

        button.addEventListener("click", () => this.emitter.emit(eventName, null));

        this.container.appendChild(button);
    }

    constructor(){
        this.element = document.createElement("atom-panel");
        this.element.className = "debug-toolbar padded";

        this.container = document.createElement("div");
        this.container.classList.add("btn-group");
        this.container.classList.add("btn-group-lg");

        this.element.appendChild(this.container);

        this.addButton("Go forward", "arrow-down", "forward")
        this.addButton("Go back", "arrow-up", "back")
        this.addButton("Continue", "playback-play", "continue")
        this.addButton("Stop", "primitive-square", "stop");

        this.draggable = new Draggable(this.element);
        this.draggable.set(atom.workspace.getActiveTextEditor()["width"] / 2 - 87/*size of the element*/, 30);
    }
}

export = DebugView;
