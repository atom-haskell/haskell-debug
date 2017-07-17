declare module "atom-space-pen-views"{
    abstract class SelectListView<Item> extends View{
        element: HTMLElement;
        setItems(listOfItems: Item[]): void;
        addClass(names: string): void;
        initialize(...args: any[]): void;
        cancel(): void;
        focusFilterEditor(): void;
        storeFocusedElement(): HTMLElement;
        abstract viewForItem(item: Item): string | HTMLElement | View;
        abstract confirmed(item: Item): any;
        abstract cancelled(): any;
    }
}
