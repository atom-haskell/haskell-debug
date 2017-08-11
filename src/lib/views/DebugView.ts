import Draggable = require('draggable')
import Button = require('./Button')
import atomAPI = require('atom')

type ButtonTypes = 'step' | 'back' | 'forward' | 'continue' | 'stop'

class DebugView  {
    element: HTMLElement
    private container: HTMLElement
    private draggable: Draggable

    /** Event Handler
      *
      * Events correspond to the button pressed. These are: forward, back, continue or stop.
      */
    public emitter: atomAPI.TEmitter<{
      [K in ButtonTypes]: undefined
    }> = new atomAPI.Emitter()

    buttons: {
      [K in ButtonTypes]: Button
    }

    private addButton (description: string, icon: string, eventName: ButtonTypes) {
        const button = new Button(description, icon)
        button.emitter.on('click', () => this.emitter.emit(eventName, undefined))
        this.container.appendChild(button.element)

        return button
    }

    private cancelButtonsClick () {
        for (const button of Object.values(this.buttons)) {
          button.startClick = false
        }
    }

    disableAllDebugButtons () {
        for (const button of Object.values(this.buttons)) {
            if (button !== this.buttons.stop) {
                button.isEnabled = false
            }
        }
    }

    enableAllDebugButtons () {
        for (const button of Object.values(this.buttons)) {
            if (button !== this.buttons.stop) {
                button.isEnabled = true
            }
        }
    }

    destroy () {
        for (const button of Object.values(this.buttons)){
            button.destroy()
        }
    }

    constructor () {
        this.element = document.createElement('atom-panel')
        this.element.className = 'debug-toolbar padded'

        this.container = document.createElement('div')
        this.container.classList.add('btn-group')
        this.container.classList.add('btn-group-lg')

        this.element.appendChild(this.container)

        this.buttons = {
          step: this.addButton('Step forward', 'arrow-down', 'step'),
          back: this.addButton('Back in history', 'chevron-up', 'back'),
          forward: this.addButton('Forward in history', 'chevron-down', 'forward'),
          continue: this.addButton('Continue', 'playback-play', 'continue'),
          stop: this.addButton('Stop', 'primitive-square', 'stop')
        }

        this.draggable = new Draggable(this.element, {
            onDragStart: () => this.cancelButtonsClick()
        })

        this.draggable.set(atom.getSize().width / 2 - 87/*size of the element*/, 30)
    }
}

export = DebugView
