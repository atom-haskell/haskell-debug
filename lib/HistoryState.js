"use strict";
class HistoryState {
    constructor() {
        this._maxPosition = 0;
        this.backEnabled = true;
        this.forwardEnabled = true;
        this._currentPosition = 0;
    }
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
        this.forwardEnabled = this._currentPosition !== 0;
        this.backEnabled = this._currentPosition !== this._maxPosition;
    }
}
module.exports = HistoryState;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiSGlzdG9yeVN0YXRlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2xpYi9IaXN0b3J5U3RhdGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUNBO0lBQUE7UUFDVSxpQkFBWSxHQUFHLENBQUMsQ0FBQTtRQUN4QixnQkFBVyxHQUFHLElBQUksQ0FBQTtRQUNsQixtQkFBYyxHQUFHLElBQUksQ0FBQTtRQVdiLHFCQUFnQixHQUFHLENBQUMsQ0FBQTtJQXFCOUIsQ0FBQztJQTlCUSxjQUFjLENBQUMsU0FBaUI7UUFDckMsSUFBSSxDQUFDLFlBQVksR0FBRyxTQUFTLENBQUE7UUFDN0IsSUFBSSxDQUFDLGdCQUFnQixHQUFHLENBQUMsQ0FBQTtRQUN6QixJQUFJLENBQUMsa0JBQWtCLEVBQUUsQ0FBQTtJQUMzQixDQUFDO0lBQ00sY0FBYztRQUNuQixNQUFNLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQTtJQUMxQixDQUFDO0lBTU0sa0JBQWtCLENBQUMsV0FBbUI7UUFDM0MsRUFBRSxDQUFDLENBQUMsV0FBVyxHQUFHLENBQUMsSUFBSSxXQUFXLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUM7WUFDdkQsTUFBTSxDQUFDLEtBQUssQ0FBQTtRQUNkLENBQUM7UUFDRCxJQUFJLENBQUMsZ0JBQWdCLEdBQUcsV0FBVyxDQUFBO1FBQ25DLElBQUksQ0FBQyxrQkFBa0IsRUFBRSxDQUFBO1FBRXpCLE1BQU0sQ0FBQyxJQUFJLENBQUE7SUFDYixDQUFDO0lBQ00sa0JBQWtCO1FBQ3ZCLE1BQU0sQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUE7SUFDOUIsQ0FBQztJQUVPLGtCQUFrQjtRQUN4QixJQUFJLENBQUMsY0FBYyxHQUFHLElBQUksQ0FBQyxnQkFBZ0IsS0FBSyxDQUFDLENBQUE7UUFDakQsSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUMsZ0JBQWdCLEtBQUssSUFBSSxDQUFDLFlBQVksQ0FBQTtJQUNoRSxDQUFDO0NBQ0Y7QUFFRCxpQkFBUyxZQUFZLENBQUEiLCJzb3VyY2VzQ29udGVudCI6WyJcbmNsYXNzIEhpc3RvcnlTdGF0ZSB7XG4gIHByaXZhdGUgX21heFBvc2l0aW9uID0gMFxuICBiYWNrRW5hYmxlZCA9IHRydWVcbiAgZm9yd2FyZEVuYWJsZWQgPSB0cnVlXG5cbiAgcHVibGljIHNldE1heFBvc2l0aW9uKG5ld0xlbmd0aDogbnVtYmVyKSB7XG4gICAgdGhpcy5fbWF4UG9zaXRpb24gPSBuZXdMZW5ndGhcbiAgICB0aGlzLl9jdXJyZW50UG9zaXRpb24gPSAwXG4gICAgdGhpcy51cGRhdGVCdXR0b25zU3RhdGUoKVxuICB9XG4gIHB1YmxpYyBnZXRNYXhQb3NpdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5fbWF4UG9zaXRpb25cbiAgfVxuXG4gIHByaXZhdGUgX2N1cnJlbnRQb3NpdGlvbiA9IDBcbiAgLyoqXG4gICAgKiBzZXRzIHRoZSBjdXJyZW50IGhpc3RvcnkgcG9zaXRpb24sIHJldHVybnMgZmFsc2UgaWYgbmV3UG9zaXRpb24gaXMgaW52YWxpZFxuICAqL1xuICBwdWJsaWMgc2V0Q3VycmVudFBvc2l0aW9uKG5ld1Bvc2l0aW9uOiBudW1iZXIpIHtcbiAgICBpZiAobmV3UG9zaXRpb24gPCAwIHx8IG5ld1Bvc2l0aW9uID4gdGhpcy5fbWF4UG9zaXRpb24pIHtcbiAgICAgIHJldHVybiBmYWxzZVxuICAgIH1cbiAgICB0aGlzLl9jdXJyZW50UG9zaXRpb24gPSBuZXdQb3NpdGlvblxuICAgIHRoaXMudXBkYXRlQnV0dG9uc1N0YXRlKClcblxuICAgIHJldHVybiB0cnVlXG4gIH1cbiAgcHVibGljIGdldEN1cnJlbnRQb3NpdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5fY3VycmVudFBvc2l0aW9uXG4gIH1cblxuICBwcml2YXRlIHVwZGF0ZUJ1dHRvbnNTdGF0ZSgpIHtcbiAgICB0aGlzLmZvcndhcmRFbmFibGVkID0gdGhpcy5fY3VycmVudFBvc2l0aW9uICE9PSAwXG4gICAgdGhpcy5iYWNrRW5hYmxlZCA9IHRoaXMuX2N1cnJlbnRQb3NpdGlvbiAhPT0gdGhpcy5fbWF4UG9zaXRpb25cbiAgfVxufVxuXG5leHBvcnQgPSBIaXN0b3J5U3RhdGVcbiJdfQ==