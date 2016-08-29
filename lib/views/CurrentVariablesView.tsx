import Draggable = require("draggable");
import atomAPI = require("atom");
import React = require("./ReactPolyfill");
import Highlights = require("highlights");

class CurrentVariablesView {
    element: HTMLElement;
    private draggable: Draggable;
    private list: HTMLElement;
    private highlighter = new Highlights({registry: atom.grammars});

    async updateList(localBindings: string[]){
        // remove all list elements
        while(this.list.firstChild){
            this.list.removeChild(this.list.firstChild);
        }
        for(var binding of localBindings){
            this.list.appendChild(
                <li>
                    {await this.highlighter.highlight({
                        fileContents: binding,
                        scopeName: "source.haskell"
                    })}
                </li>
            )
        }
    }

    destroy(){

    }

    constructor(){
        this.element =
        <atom-panel style="z-index: 10;" class="padded">
            <div class="inset-panel">
                <div class="panel-heading">Local Variables</div>
                <div class="panel-body padded">
                    {this.list = <ul class='list-group'></ul>}
                </div>
            </div>
        </atom-panel>;

        this.draggable = new Draggable(this.element);
        this.draggable.set(atom.workspace.getActiveTextEditor()["width"] / 2 + 500, 100);
    }
}

export = CurrentVariablesView;
