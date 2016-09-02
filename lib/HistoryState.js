"use strict";
class HistoryState {
    constructor() {
        this._maxPosition = 0;
        this.backEnabled = true;
        this.forwardEnabled = true;
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
        this.forwardEnabled = this._currentPosition != 0;
        this.backEnabled = this._currentPosition != this._maxPosition;
    }
}
module.exports = HistoryState;
