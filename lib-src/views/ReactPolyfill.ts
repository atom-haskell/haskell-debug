export function createElement(
  tagName: string,
  attributes: null | { [index: string]: string },
  ...extraElements: Array<HTMLElement | { toString: () => string }>
): JSX.Element {
  const element = document.createElement(tagName)

  if (attributes) {
    for (const attribute in attributes) {
      if (attributes.hasOwnProperty(attribute)) {
        const value = attributes[attribute]

        element.setAttribute(attribute, value)
      }
    }
  }

  for (const extraElement of extraElements) {
    if (extraElement instanceof HTMLElement) {
      element.appendChild(extraElement)
    } else {
      element.appendChild(document.createTextNode(extraElement.toString()))
    }
  }
  return element
}
