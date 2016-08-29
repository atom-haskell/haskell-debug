"use strict";
class HistoryState {
    constructor(buttons) {
        this.buttons = buttons;
        this._maxPosition = 0;
        this._currentPosition = 0;
    }
    ;
    setMaxPosition(newLength) {
        this._maxPosition = newLength;
        this._currentPosition = 0;
        this.updateButtonsState();
    }
    getMaxPosition() {
        return this._maxPosition;
    }
    setCurrentPosition(newPosition) {
        if (newPosition < 0 || newPosition > this._maxPosition) {
            return false;
        }
        this._currentPosition = newPosition;
        this.updateButtonsState();
        return true;
    }
    getCurrentPosition() {
        return this._currentPosition;
    }
    updateButtonsState() {
        this.buttons.forward.isEnabled = this._currentPosition != 0;
        this.buttons.back.isEnabled = this._currentPosition != this._maxPosition;
    }
}
module.exports = HistoryState;
