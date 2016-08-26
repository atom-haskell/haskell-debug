import Draggable = require("draggable");
import atomAPI = require("atom");
import React = require("./ReactPolyfill");

class CurrentVariablesView {
    element: HTMLElement;
    private draggable: Draggable;
    private list: HTMLElement;

    updateList(localBindings: {name: string; value: string}[]){
        // remove all list elements
        while(this.list.firstChild){
            this.list.removeChild(this.list.firstChild);
        }
        for(var binding of localBindings){
            this.list.appendChild(
                <tr>
                    <th>{binding.name}</th>
                    <th>{binding.value}</th>
                </tr>
            )
        }
    }

    constructor(){
        this.element =
        <atom-panel>
            <h3>Local Variables</h3>
            {this.list = <table></table>}
        </atom-panel>;

        this.draggable = new Draggable(this.element);
        this.draggable.set(atom.workspace.getActiveTextEditor()["width"] / 2 - 87/*size of the element*/, 30);
    }
}

export = CurrentVariablesView;
