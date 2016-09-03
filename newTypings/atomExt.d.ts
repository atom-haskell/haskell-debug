/// <reference path="../typings/emissary/emissary.d.ts" />

import Emissary = require("emissary");

declare module "atom"{
    class Emitter extends Emissary.Emitter{
    }
    class CompositeDisposable{
        dispose(): void;
        add(...disposables: AtomCore.Disposable[]): void;
        remove(disposable: AtomCore.Disposable[]): void;
        clear(): void;
    }
    var TextEditor: {
        new(): AtomCore.IEditor;
    }
}
