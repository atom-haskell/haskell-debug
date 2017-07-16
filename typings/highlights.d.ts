declare class Highlights{
    highlightSync(args: Object);
    highlight(args: Object): Promise<any>;
    requireGrammarsSync(args: Object);
    requireGrammars(args: Object): Promise<any>;
    registry: any;
    constructor(args: Object);
}

declare module "highlights"{
    export = Highlights
}
