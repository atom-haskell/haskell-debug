declare module "atom"{
    class Emitter{
        clear(): void;
        dispose(): void;

        on(eventName: string, handler: Function): AtomCore.Disposable;
        preempt(eventName: string, handler: Function): AtomCore.Disposable;

        emit(eventName: string, value: any): void;
    }
}

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

    interface IViewRegistry {
		getView(selector: any): HTMLElement;
	}
}
