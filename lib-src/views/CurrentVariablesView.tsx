import Draggable = require('draggable')
import React = require('./ReactPolyfill')

export class CurrentVariablesView {
  public element: HTMLElement
  private draggable: Draggable
  private list: HTMLElement
  private exceptionPanel: HTMLElement

  constructor() {
    this.exceptionPanel = (
      <span style="display: none" class="error-messages">
        (Paused on exception)
      </span>
    )
    this.list = <ul class="list-group" />
    this.element = (
      <atom-panel style="z-index: 10" class="padded">
        <div class="inset-panel">
          <div class="panel-heading">
            <span>Local Variables </span>
            {this.exceptionPanel}
          </div>
          <div class="panel-body padded">{this.list}</div>
        </div>
      </atom-panel>
    )

    this.draggable = new Draggable(this.element, {})
    this.draggable.set(atom.getSize().width / 2 + 200, 30)
  }

  public async update(localBindings: string[], isPausedOnException: boolean) {
    // remove all list elements
    while (this.list.firstChild) {
      this.list.removeChild(this.list.firstChild)
    }
    for (const binding of localBindings) {
      this.list.appendChild(<li>{binding}</li>)
    }

    if (isPausedOnException) {
      this.exceptionPanel.style.display = 'inline'
    } else {
      this.exceptionPanel.style.display = 'none'
    }
  }

  public destroy() {
    // TODO: noop?
  }
}
