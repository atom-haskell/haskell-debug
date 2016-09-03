declare module "atom-space-pen-views"{
    abstract class SelectListView<Item> extends View{
        element: HTMLElement;
        setItems(listOfItems: Item[]);
        addClass(names: string);
        initialize(...args: any[]);
        cancel();
        focusFilterEditor();
        storeFocusedElement();
        abstract viewForItem(item: Item): string | HTMLElement | View;
        abstract confirmed(item: Item): any;
        abstract cancelled(): any;
    }
}
