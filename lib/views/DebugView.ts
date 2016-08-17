import Draggable = require("draggable");

class DebugView {
    element: HTMLElement;
    private container: HTMLElement;
    private draggable: Draggable;

    private addButton(description: string, icon: string, onclick?: () => any){
        var button = document.createElement("button");

        button.className = "btn btn-primary icon";
        button.classList.add("icon-" + icon);

        atom.tooltips.add(button, {
            title: description
        })

        this.container.appendChild(button);
    }

    constructor(){
        this.element = document.createElement("atom-panel");
        this.element.className = "debug-toolbar padded";

        this.container = document.createElement("div");
        this.container.classList.add("btn-group");
        this.container.classList.add("btn-group-lg");

        this.element.appendChild(this.container);

        this.addButton("Step in", "arrow-down")
        this.addButton("Step out", "arrow-up")
        this.addButton("Continue", "playback-play")
        this.addButton("Stop", "primitive-square");

        this.draggable = new Draggable(this.element);
        this.draggable.set(atom.workspace.getActiveTextEditor()["width"] / 2 - 87/*size of the element*/, 30);
    }
}

export = DebugView;
