import emissary = require("emissary")

class Button{
    element: HTMLElement;
    emitter = new emissary.Emitter();
    startClick = false;
    private _isEnabled = true;
    private tooltip: AtomCore.Disposable;

    set isEnabled(enabled: boolean){
        if(enabled){
            this.element.classList.remove("disabled");
        }
        else{
            this.element.classList.add("disabled");
        }

        this._isEnabled = enabled;
    }

    destroy(){
        this.tooltip.dispose();
    }

    constructor(description: string, icon: string){
        this.element = document.createElement("button");

        this.element.className = "btn btn-primary icon";
        this.element.classList.add("icon-" + icon);

        this.tooltip = atom.tooltips.add(this.element, {
            title: description
        })

        this.element.addEventListener("mousedown", () => {
            this.startClick = true;
        })
        this.element.addEventListener("click", () => {
            if(this.startClick && this._isEnabled)
                this.emitter.emit("click", null)
        });
    }
}

export = Button;
