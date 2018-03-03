import atomAPI = require('atom')

export class Button {
  public element: HTMLElement
  private emitter: atomAPI.Emitter<{
    click: undefined
  }> = new atomAPI.Emitter()
  // tslint:disable-next-line: member-ordering
  public on = this.emitter.on.bind(this.emitter)
  private startClick = false
  private _isEnabled = true
  private tooltip: atomAPI.Disposable

  constructor(description: string, icon: string) {
    this.element = document.createElement('button')

    this.element.className = 'btn btn-primary icon'
    this.element.classList.add('icon-' + icon)

    this.tooltip = atom.tooltips.add(this.element, {
      title: description,
    })

    this.element.addEventListener('mousedown', () => {
      this.startClick = true
    })
    this.element.addEventListener('click', () => {
      if (this.startClick && this._isEnabled) {
        this.emitter.emit('click', undefined)
      }
    })
  }

  set isEnabled(enabled: boolean) {
    if (enabled) {
      this.element.classList.remove('disabled')
    } else {
      this.element.classList.add('disabled')
    }

    this._isEnabled = enabled
  }

  public cancelClick() {
    this.startClick = false
  }

  public destroy() {
    this.tooltip.dispose()
  }
}
