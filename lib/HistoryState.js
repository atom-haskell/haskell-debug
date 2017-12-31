"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class HistoryState {
    constructor() {
        this._maxPosition = 0;
        this._backEnabled = true;
        this._forwardEnabled = true;
        this._currentPosition = 0;
    }
    get backEnabled() {
        return this._backEnabled;
    }
    get forwardEnabled() {
        return this._forwardEnabled;
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
        this._forwardEnabled = this._currentPosition !== 0;
        this._backEnabled = this._currentPosition !== this._maxPosition;
    }
}
exports.HistoryState = HistoryState;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiSGlzdG9yeVN0YXRlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL0hpc3RvcnlTdGF0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUNBO0lBQUE7UUFDVSxpQkFBWSxHQUFHLENBQUMsQ0FBQTtRQUNoQixpQkFBWSxHQUFHLElBQUksQ0FBQTtRQUNuQixvQkFBZSxHQUFHLElBQUksQ0FBQTtRQUN0QixxQkFBZ0IsR0FBRyxDQUFDLENBQUE7SUF1QzlCLENBQUM7SUFyQ0MsSUFBVyxXQUFXO1FBQ3BCLE1BQU0sQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFBO0lBQzFCLENBQUM7SUFFRCxJQUFXLGNBQWM7UUFDdkIsTUFBTSxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUE7SUFDN0IsQ0FBQztJQUVNLGNBQWMsQ0FBQyxTQUFpQjtRQUNyQyxJQUFJLENBQUMsWUFBWSxHQUFHLFNBQVMsQ0FBQTtRQUM3QixJQUFJLENBQUMsZ0JBQWdCLEdBQUcsQ0FBQyxDQUFBO1FBQ3pCLElBQUksQ0FBQyxrQkFBa0IsRUFBRSxDQUFBO0lBQzNCLENBQUM7SUFDTSxjQUFjO1FBQ25CLE1BQU0sQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFBO0lBQzFCLENBQUM7SUFLTSxrQkFBa0IsQ0FBQyxXQUFtQjtRQUMzQyxFQUFFLENBQUMsQ0FBQyxXQUFXLEdBQUcsQ0FBQyxJQUFJLFdBQVcsR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQztZQUN2RCxNQUFNLENBQUMsS0FBSyxDQUFBO1FBQ2QsQ0FBQztRQUNELElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxXQUFXLENBQUE7UUFDbkMsSUFBSSxDQUFDLGtCQUFrQixFQUFFLENBQUE7UUFFekIsTUFBTSxDQUFDLElBQUksQ0FBQTtJQUNiLENBQUM7SUFDTSxrQkFBa0I7UUFDdkIsTUFBTSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQTtJQUM5QixDQUFDO0lBRU8sa0JBQWtCO1FBQ3hCLElBQUksQ0FBQyxlQUFlLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixLQUFLLENBQUMsQ0FBQTtRQUNsRCxJQUFJLENBQUMsWUFBWSxHQUFHLElBQUksQ0FBQyxnQkFBZ0IsS0FBSyxJQUFJLENBQUMsWUFBWSxDQUFBO0lBQ2pFLENBQUM7Q0FDRjtBQTNDRCxvQ0EyQ0MiLCJzb3VyY2VzQ29udGVudCI6WyJcbmV4cG9ydCBjbGFzcyBIaXN0b3J5U3RhdGUge1xuICBwcml2YXRlIF9tYXhQb3NpdGlvbiA9IDBcbiAgcHJpdmF0ZSBfYmFja0VuYWJsZWQgPSB0cnVlXG4gIHByaXZhdGUgX2ZvcndhcmRFbmFibGVkID0gdHJ1ZVxuICBwcml2YXRlIF9jdXJyZW50UG9zaXRpb24gPSAwXG5cbiAgcHVibGljIGdldCBiYWNrRW5hYmxlZCgpIHtcbiAgICByZXR1cm4gdGhpcy5fYmFja0VuYWJsZWRcbiAgfVxuXG4gIHB1YmxpYyBnZXQgZm9yd2FyZEVuYWJsZWQoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2ZvcndhcmRFbmFibGVkXG4gIH1cblxuICBwdWJsaWMgc2V0TWF4UG9zaXRpb24obmV3TGVuZ3RoOiBudW1iZXIpIHtcbiAgICB0aGlzLl9tYXhQb3NpdGlvbiA9IG5ld0xlbmd0aFxuICAgIHRoaXMuX2N1cnJlbnRQb3NpdGlvbiA9IDBcbiAgICB0aGlzLnVwZGF0ZUJ1dHRvbnNTdGF0ZSgpXG4gIH1cbiAgcHVibGljIGdldE1heFBvc2l0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLl9tYXhQb3NpdGlvblxuICB9XG5cbiAgLyoqXG4gICAgKiBzZXRzIHRoZSBjdXJyZW50IGhpc3RvcnkgcG9zaXRpb24sIHJldHVybnMgZmFsc2UgaWYgbmV3UG9zaXRpb24gaXMgaW52YWxpZFxuICAqL1xuICBwdWJsaWMgc2V0Q3VycmVudFBvc2l0aW9uKG5ld1Bvc2l0aW9uOiBudW1iZXIpIHtcbiAgICBpZiAobmV3UG9zaXRpb24gPCAwIHx8IG5ld1Bvc2l0aW9uID4gdGhpcy5fbWF4UG9zaXRpb24pIHtcbiAgICAgIHJldHVybiBmYWxzZVxuICAgIH1cbiAgICB0aGlzLl9jdXJyZW50UG9zaXRpb24gPSBuZXdQb3NpdGlvblxuICAgIHRoaXMudXBkYXRlQnV0dG9uc1N0YXRlKClcblxuICAgIHJldHVybiB0cnVlXG4gIH1cbiAgcHVibGljIGdldEN1cnJlbnRQb3NpdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5fY3VycmVudFBvc2l0aW9uXG4gIH1cblxuICBwcml2YXRlIHVwZGF0ZUJ1dHRvbnNTdGF0ZSgpIHtcbiAgICB0aGlzLl9mb3J3YXJkRW5hYmxlZCA9IHRoaXMuX2N1cnJlbnRQb3NpdGlvbiAhPT0gMFxuICAgIHRoaXMuX2JhY2tFbmFibGVkID0gdGhpcy5fY3VycmVudFBvc2l0aW9uICE9PSB0aGlzLl9tYXhQb3NpdGlvblxuICB9XG59XG4iXX0=