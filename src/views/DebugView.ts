import Draggable = require("draggable");
import emissary = require("emissary")
import Button = require("./Button");
import _ = require("lodash");

interface DebugViewEmitter extends Emissary.IEmitter{
    on(eventName: "forward" | "back" | "continue" | "stop" | "step", handler: () => any);
}

class DebugView  {
    element: HTMLElement;
    private container: HTMLElement;
    private draggable: Draggable;

    /** Event Handler
      *
      * Events correspond to the button pressed. These are: forward, back, continue or stop.
      */
    public emitter: DebugViewEmitter = new emissary.Emitter();

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

    private cancelButtonsClick(){
        _.values(this.buttons).forEach((button) => button.startClick = false);
    }

    disableAllDebugButtons(){
        _.values(this.buttons).forEach(button => {
            if(button != this.buttons.stop)
                button.isEnabled = false
        });
    }

    enableAllDebugButtons(){
        _.values(this.buttons).forEach(button => {
            if(button != this.buttons.stop)
                button.isEnabled = true
        });
    }

    destroy(){
        for(var buttonName of Object.keys(this.buttons)){
            var button = <Button>this.buttons[buttonName];
            button.destroy();
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

        this.draggable = new Draggable(this.element, {
            onDragStart: () => this.cancelButtonsClick()
        });

        this.draggable.set(atom.workspace.getActiveTextEditor()["width"] / 2 - 87/*size of the element*/, 30);
    }
}

export = DebugView;
