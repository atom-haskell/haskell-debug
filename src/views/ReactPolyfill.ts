module React{
    export function createElement(tagName: string, attributes: Object, ...extraElements: (HTMLElement | {toString: () => string})[]){
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

export = React
