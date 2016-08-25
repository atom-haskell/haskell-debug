import Draggable = require("draggable");
import atomAPI = require("atom");
import SpacePen = require("space-pen");
import _ = require("lodash");

interface DebugViewEmitter extends atomAPI.Emitter{
    on(eventName: "forward" | "back" | "continue" | "stop" | "step", handler: () => any);
}

class Button{
    element: HTMLElement;
    emitter = new atomAPI.Emitter();
    private _isEnabled: boolean;
    private tooltip: AtomCore.Disposable;

    set isEnabled(enabled: boolean){
        if(enabled){
            this.element.classList.remove("disabled");
        }
        else{
            this.element.classList.add("disabled");
        }
    }

    dispose(){
        this.tooltip.dispose();
    }

    constructor(description: string, icon: string){
        this.element = document.createElement("button");

        this.element.className = "btn btn-primary icon";
        this.element.classList.add("icon-" + icon);

        this.tooltip = atom.tooltips.add(this.element, {
            title: description
        })

        this.element.addEventListener("click", () => this.emitter.emit("click", null));
    }
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

    buttons = {
        step: <Button>null,
        back: <Button>null,
        forward: <Button>null,
        continue: <Button>null,
        stop: <Button>null
    }

    private addButton(description: string, icon: string, eventName: string){
        var button = new Button(description, icon);
        button.emitter.on("click", () => this.emitter.emit(eventName, null));
        this.container.appendChild(button.element)

        return button;
    }

    disabledAllButtons(){
        _.values(this.buttons).forEach(button => button.isEnabled = false);
    }

    dispose(){
        for(var buttonName of Object.keys(this.buttons)){
            var button = <Button>this.buttons[buttonName];
            button.dispose();
        }
    }

    constructor(){
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
        this.draggable.set(atom.workspace.getActiveTextEditor()["width"] / 2 - 87/*size of the element*/, 30);
    }
}

export = DebugView;
