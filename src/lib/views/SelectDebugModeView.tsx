import spacePen = require('atom-space-pen-views')
import emissary = require('emissary')
import React = require('./ReactPolyfill')

interface Item {
    value: string
    description: string
}

class SelectDebugModeView extends spacePen.SelectListView<Item> {
    emitter = new emissary.Emitter()

    constructor (private debugModes: Item[], private activeItem: string) {
        super(debugModes, activeItem)
    }

    initialize (debugModes: Item[], activeItem: string) {
        this.debugModes = debugModes
        this.activeItem = activeItem

        super.initialize()
        this.storeFocusedElement()
        this.setItems(debugModes)
        const ol = this.element.querySelector('ol')
        if (ol) { ol.classList.add('mark-active') }
    }

    viewForItem (item: Item) {
        const element = <li>{item.description}</li>
        if (item.value === this.activeItem) {
            element.classList.add('active')
        }
        return element
    }

    confirmed (item: Item) {
        this.emitter.emit('selected', item.value)
        this.cancel()
    }

    cancelled () {
        this.emitter.emit('canceled')
    }
}

export = SelectDebugModeView
