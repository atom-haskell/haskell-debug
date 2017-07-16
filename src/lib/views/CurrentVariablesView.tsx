import Draggable = require("draggable");
import atomAPI = require("atom");
import React = require("./ReactPolyfill");
import Highlights = require("highlights");

class CurrentVariablesView {
    element: HTMLElement;
    private draggable: Draggable;
    private list: HTMLElement;
    private exceptionPanel: HTMLElement;

    async update(localBindings: string[], isPausedOnException: boolean){
        // remove all list elements
        while(this.list.firstChild){
            this.list.removeChild(this.list.firstChild);
        }
        for(var binding of localBindings){
            this.list.appendChild(
                <li>
                    {binding}
                </li>
            )
        }

        if(isPausedOnException){
            this.exceptionPanel.style.display = "inline";
        }
        else{
            this.exceptionPanel.style.display = "none";
        }
    }

    destroy(){

    }

    constructor(){
        this.element =
        <atom-panel style="z-index: 10" class="padded">
            <div class="inset-panel">
                <div class="panel-heading">
                    <span>Local Variables </span>
                    {this.exceptionPanel = <span style="display: none" class="error-messages">(Paused on exception)</span>}
                </div>
                <div class="panel-body padded">
                    {this.list = <ul class='list-group'></ul>}
                </div>
            </div>
        </atom-panel>;

        this.draggable = new Draggable(this.element, {});
        this.draggable.set(atom.workspace.getActiveTextEditor()["width"] / 2 + 200, 30);
    }
}

export = CurrentVariablesView;
