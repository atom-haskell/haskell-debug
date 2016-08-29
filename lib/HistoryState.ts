import Button = require("./views/Button");

class HistoryState{
    private _maxPosition = 0;

    constructor(private buttons: {
        forward: Button;
        back: Button
    }){};

    public setMaxPosition(newLength: number){
        this._maxPosition = newLength;
        this._currentPosition = 0;
        this.updateButtonsState();
    }
    public getMaxPosition(){
        return this._maxPosition;
    }

    private _currentPosition = 0;
    /**
      * sets the current history position, returns false if newPosition is invalid
    */
    public setCurrentPosition(newPosition: number){
        if(newPosition < 0 || newPosition > this._maxPosition){
            return false;
        }
        this._currentPosition = newPosition;
        this.updateButtonsState();

        return true;
    }
    public getCurrentPosition(){
        return this._currentPosition;
    }

    private updateButtonsState(){
        this.buttons.forward.isEnabled = this._currentPosition != 0;
        this.buttons.back.isEnabled = this._currentPosition != this._maxPosition;
    }
}

export = HistoryState;
