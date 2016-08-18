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
    }

    interface IGutter{
        hide(): void;
        show(): void;
        isVisible(): boolean;

        decorateMarker(marker, decorationParams): any;
    }

    interface IWorkspace{
        observeTextEditors(callback: (editor: IEditor) => any): Disposable;
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
	}
}
