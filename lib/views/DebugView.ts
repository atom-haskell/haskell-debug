import Draggable = require("draggable");
import atomAPI = require("atom");

interface DebugViewEmitter extends atomAPI.Emitter{
    on(eventName: "forward" | "back" | "continue" | "stop" | "step", handler: () => any);
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

    private buttons: {
        forward: HTMLElement;
        back: HTMLElement;
    } = {
        forward: null,
        back: null
    };

    private addButton(description: string, icon: string, eventName: string){
        var button = document.createElement("button");

        button.className = "btn btn-primary icon";
        button.classList.add("icon-" + icon);

        atom.tooltips.add(button, {
            title: description
        })

        button.addEventListener("click", () => this.emitter.emit(eventName, null));

        return <HTMLElement>this.container.appendChild(button);
    }

    public setButtonEnabled(button: "forward" | "back", enabled: boolean){
        if(enabled){
            (<HTMLElement>this.buttons[button]).classList.remove("disabled");
        }
        else{
            (<HTMLElement>this.buttons[button]).classList.add("disabled");
        }
    }

    constructor(){
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
        this.draggable.set(atom.workspace.getActiveTextEditor()["width"] / 2 - 87/*size of the element*/, 30);
    }
}

export = DebugView;
