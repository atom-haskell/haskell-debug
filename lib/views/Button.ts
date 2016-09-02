import atomAPI = require("atom");


class Button{
    element: HTMLElement;
    emitter = new atomAPI.Emitter();
    startClick = false;
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
            if(this.startClick)
                this.emitter.emit("click", null)
        });
    }
}

export = Button;
