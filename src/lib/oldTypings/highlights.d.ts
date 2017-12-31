declare class Highlights{
    highlightSync(args: Object): any;
    highlight(args: Object): Promise<any>;
    requireGrammarsSync(args: Object): any;
    requireGrammars(args: Object): Promise<any>;
    registry: any;
    constructor(args: Object);
}

declare module "highlights"{
    export = Highlights
}
