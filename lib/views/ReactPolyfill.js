"use strict";
var React;
(function (React) {
    function createElement(tagName, attributes, ...extraElements) {
        var element = document.createElement(tagName);
        if (attributes !== null) {
            for (var attribute in attributes) {
                if (attributes.hasOwnProperty(attribute)) {
                    var value = attributes[attribute];
                    element.setAttribute(attribute, value);
                }
            }
        }
        for (var extraElement of extraElements) {
            if (extraElement instanceof HTMLElement) {
                element.appendChild(extraElement);
            }
            else {
                element.appendChild(document.createTextNode(extraElement.toString()));
            }
        }
        return element;
    }
    React.createElement = createElement;
})(React || (React = {}));
module.exports = React;
