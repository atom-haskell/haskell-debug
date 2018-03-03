import Draggable = require('draggable')
import { Button } from './Button'
import * as atomAPI from 'atom'

type ButtonTypes = 'step' | 'back' | 'forward' | 'continue' | 'stop'

export class DebugView {
  public element: HTMLElement
  private emitter: atomAPI.Emitter<
    { [K in ButtonTypes]: undefined }
  > = new atomAPI.Emitter()
  // tslint:disable-next-line: member-ordering
  public on = this.emitter.on.bind(this.emitter)
  private container: HTMLElement
  private draggable: Draggable

  private buttons: { [K in ButtonTypes]: Button }

  constructor() {
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
      stop: this.addButton('Stop', 'primitive-square', 'stop'),
    }

    this.draggable = new Draggable(this.element, {
      onDragStart: () => this.cancelButtonsClick(),
    })

    this.draggable.set(
      atom.getSize().width / 2 - 87 /*size of the element*/,
      30,
    )
  }

  public setButtonEnabled(type: ButtonTypes, enabled: boolean) {
    this.buttons[type].isEnabled = enabled
  }

  public disableAllDebugButtons() {
    for (const button of Object.values(this.buttons)) {
      if (button !== this.buttons.stop) {
        button.isEnabled = false
      }
    }
  }

  public enableAllDebugButtons() {
    for (const button of Object.values(this.buttons)) {
      if (button !== this.buttons.stop) {
        button.isEnabled = true
      }
    }
  }

  public destroy() {
    for (const button of Object.values(this.buttons)) {
      button.destroy()
    }
  }

  private addButton(description: string, icon: string, eventName: ButtonTypes) {
    const button = new Button(description, icon)
    button.on('click', () => this.emitter.emit(eventName, undefined))
    this.container.appendChild(button.element)

    return button
  }

  private cancelButtonsClick() {
    for (const button of Object.values(this.buttons)) {
      button.cancelClick()
    }
  }
}
