declare module "draggable"{
    interface DraggableOptions{
        grid?: number;
        filterTarget?: (target: HTMLElement) => boolean;
        limit?: HTMLElement | Object | ((x: number, y: number, x0: number, y0:number) => any);
        onDragStart?: (element: HTMLElement, x: number, y: number, event: Event) => any;
        // TODO: do more
    }

    class Draggable{
        constructor(element: HTMLElement, options?: DraggableOptions);

        get(): {x: number, y: number};
        set(x: number, y: number): Draggable;
        setOption(property: string, value: any): Draggable;
        destroy(): void;
    }
    export = Draggable
}
