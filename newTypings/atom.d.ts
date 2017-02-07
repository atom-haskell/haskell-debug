declare module AtomCore{
    interface IGutterInput{
        name: string;
        priority?: number;
        visible?: boolean;
    }

    interface IEditor{
        gutterWithName(name: string): IGutter;
        addGutter(options: IGutterInput): IGutter;
        getRootScopeDescriptor(): {
            scopes: string[]
        }
        scrollToBufferPosition(bufferPosition:any):any;
    }

    interface IConfig {
        set(keyPath: string, value: string): any;
        onDidChange(keyPath: string, func: (options: {newValue: string, oldValue: string}) => any): Disposable;
	}

    interface IGutter{
        hide(): void;
        show(): void;
        isVisible(): boolean;

        decorateMarker(marker, decorationParams): any;
    }

    interface IWorkspace{
        observeTextEditors(callback: (editor: IEditor) => any): Disposable;
        observeActivePaneItem(func: (paneItem: any) => any);
    }

    interface IDisplayBufferMarker{
        onDidChange(callback: (event: {
            newHeadBufferPosition: TextBuffer.IPoint,
            newTailBufferPosition: TextBuffer.IPoint
            isValid: boolean
        }) => any): Disposable;

        getProperties(): Object;
    }

    interface TooltipOptions{
        /*More options at http://getbootstrap.com/javascript/#tooltips-options*/
        title: string | (() => any);
        trigger?: "click" | "hover" | "focus" | "manual";
        keyBindingCommand?: string;
        keyBindingTarget?: HTMLElement;
    }

    interface Panel {
        destroy();
    }

    interface IAtom {
        tooltips: ITooltipManager;
        devMode: boolean;
    }

    interface ITooltipManager{
        add(target: HTMLElement, options: TooltipOptions): Disposable;
    }

    interface IViewRegistry {
		getView(selector: any): HTMLElement;
        addViewProvider(modelConstructor: Function, createView: () => HTMLElement): Disposable;
        addViewProvider(createView: () => HTMLElement): Disposable;
	}
}
