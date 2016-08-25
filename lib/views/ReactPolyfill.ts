module React{
    function createElement(tagName: string, attributes: Object, ...extraElements: (HTMLElement | {toString: () => string})[]){
        var element = document.createElement(tagName);

        if(attributes !== null){
            for(var attribute in attributes){
                if(attributes.hasOwnProperty(attribute)){
                    var value = attributes[attribute];

                    element.setAttribute(attribute, value);
                }
            }
        }

        for(var extraElement of extraElements){
            if(extraElement instanceof HTMLElement){
                element.appendChild(extraElement);
            }
            else{
                element.appendChild(document.createTextNode(extraElement.toString()));
            }
        }
        return element;
    }
}

declare namespace JSX {
    interface Element extends HTMLElement { }

    interface IntrinsicElements {
        // HTML
        a: any;
        abbr: any;
        address: any;
        area: any;
        article: any;
        aside: any;
        audio: any;
        b: any;
        base: any;
        bdi: any;
        bdo: any;
        big: any;
        blockquote: any;
        body: any;
        br: any;
        button: any;
        canvas: any;
        caption: any;
        cite: any;
        code: any;
        col: any;
        colgroup: any;
        data: any;
        datalist: any;
        dd: any;
        del: any;
        details: any;
        dfn: any;
        dialog: any;
        div: any;
        dl: any;
        dt: any;
        em: any;
        embed: any;
        fieldset: any;
        figcaption: any;
        figure: any;
        footer: any;
        form: any;
        h1: any;
        h2: any;
        h3: any;
        h4: any;
        h5: any;
        h6: any;
        head: any;
        header: any;
        hgroup: any;
        hr: any;
        html: any;
        i: any;
        iframe: any;
        img: any;
        input: any;
        ins: any;
        kbd: any;
        keygen: any;
        label: any;
        legend: any;
        li: any;
        link: any;
        main: any;
        map: any;
        mark: any;
        menu: any;
        menuitem: any;
        meta: any;
        meter: any;
        nav: any;
        noscript: any;
        object: any;
        ol: any;
        optgroup: any;
        option: any;
        output: any;
        p: any;
        param: any;
        picture: any;
        pre: any;
        progress: any;
        q: any;
        rp: any;
        rt: any;
        ruby: any;
        s: any;
        samp: any;
        script: any;
        section: any;
        select: any;
        small: any;
        source: any;
        span: any;
        strong: any;
        style: any;
        sub: any;
        summary: any;
        sup: any;
        table: any;
        tbody: any;
        td: any;
        textarea: any;
        tfoot: any;
        th: any;
        thead: any;
        time: any;
        title: any;
        tr: any;
        track: any;
        u: any;
        ul: any;
        "var": any;
        video: any;
        wbr: any;

        // SVG
        svg: any;

        circle: any;
        clipPath: any;
        defs: any;
        desc: any;
        ellipse: any;
        feBlend: any;
        feColorMatrix: any;
        feComponentTransfer: any;
        feComposite: any;
        feConvolveMatrix: any;
        feDiffuseLighting: any;
        feDisplacementMap: any;
        feDistantLight: any;
        feFlood: any;
        feFuncA: any;
        feFuncB: any;
        feFuncG: any;
        feFuncR: any;
        feGaussianBlur: any;
        feImage: any;
        feMerge: any;
        feMergeNode: any;
        feMorphology: any;
        feOffset: any;
        fePointLight: any;
        feSpecularLighting: any;
        feSpotLight: any;
        feTile: any;
        feTurbulence: any;
        filter: any;
        foreignObject: any;
        g: any;
        image: any;
        line: any;
        linearGradient: any;
        marker: any;
        mask: any;
        metadata: any;
        path: any;
        pattern: any;
        polygon: any;
        polyline: any;
        radialGradient: any;
        rect: any;
        stop: any;
        switch: any;
        symbol: any;
        text: any;
        textPath: any;
        tspan: any;
        use: any;
        view: any;
    }
}
