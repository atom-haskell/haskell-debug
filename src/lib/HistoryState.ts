
export class HistoryState {
  private _maxPosition = 0
  private _backEnabled = true
  private _forwardEnabled = true
  private _currentPosition = 0

  public get backEnabled() {
    return this._backEnabled
  }

  public get forwardEnabled() {
    return this._forwardEnabled
  }

  public setMaxPosition(newLength: number) {
    this._maxPosition = newLength
    this._currentPosition = 0
    this.updateButtonsState()
  }
  public getMaxPosition() {
    return this._maxPosition
  }

  /**
    * sets the current history position, returns false if newPosition is invalid
  */
  public setCurrentPosition(newPosition: number) {
    if (newPosition < 0 || newPosition > this._maxPosition) {
      return false
    }
    this._currentPosition = newPosition
    this.updateButtonsState()

    return true
  }
  public getCurrentPosition() {
    return this._currentPosition
  }

  private updateButtonsState() {
    this._forwardEnabled = this._currentPosition !== 0
    this._backEnabled = this._currentPosition !== this._maxPosition
  }
}
