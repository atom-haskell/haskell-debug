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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiSGlzdG9yeVN0YXRlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vbGliLXNyYy9IaXN0b3J5U3RhdGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTtJQUFBO1FBQ1UsaUJBQVksR0FBRyxDQUFDLENBQUE7UUFDaEIsaUJBQVksR0FBRyxJQUFJLENBQUE7UUFDbkIsb0JBQWUsR0FBRyxJQUFJLENBQUE7UUFDdEIscUJBQWdCLEdBQUcsQ0FBQyxDQUFBO0lBdUM5QixDQUFDO0lBckNDLElBQVcsV0FBVztRQUNwQixNQUFNLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQTtJQUMxQixDQUFDO0lBRUQsSUFBVyxjQUFjO1FBQ3ZCLE1BQU0sQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFBO0lBQzdCLENBQUM7SUFFTSxjQUFjLENBQUMsU0FBaUI7UUFDckMsSUFBSSxDQUFDLFlBQVksR0FBRyxTQUFTLENBQUE7UUFDN0IsSUFBSSxDQUFDLGdCQUFnQixHQUFHLENBQUMsQ0FBQTtRQUN6QixJQUFJLENBQUMsa0JBQWtCLEVBQUUsQ0FBQTtJQUMzQixDQUFDO0lBQ00sY0FBYztRQUNuQixNQUFNLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQTtJQUMxQixDQUFDO0lBS00sa0JBQWtCLENBQUMsV0FBbUI7UUFDM0MsRUFBRSxDQUFDLENBQUMsV0FBVyxHQUFHLENBQUMsSUFBSSxXQUFXLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUM7WUFDdkQsTUFBTSxDQUFDLEtBQUssQ0FBQTtRQUNkLENBQUM7UUFDRCxJQUFJLENBQUMsZ0JBQWdCLEdBQUcsV0FBVyxDQUFBO1FBQ25DLElBQUksQ0FBQyxrQkFBa0IsRUFBRSxDQUFBO1FBRXpCLE1BQU0sQ0FBQyxJQUFJLENBQUE7SUFDYixDQUFDO0lBQ00sa0JBQWtCO1FBQ3ZCLE1BQU0sQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUE7SUFDOUIsQ0FBQztJQUVPLGtCQUFrQjtRQUN4QixJQUFJLENBQUMsZUFBZSxHQUFHLElBQUksQ0FBQyxnQkFBZ0IsS0FBSyxDQUFDLENBQUE7UUFDbEQsSUFBSSxDQUFDLFlBQVksR0FBRyxJQUFJLENBQUMsZ0JBQWdCLEtBQUssSUFBSSxDQUFDLFlBQVksQ0FBQTtJQUNqRSxDQUFDO0NBQ0Y7QUEzQ0Qsb0NBMkNDIiwic291cmNlc0NvbnRlbnQiOlsiZXhwb3J0IGNsYXNzIEhpc3RvcnlTdGF0ZSB7XG4gIHByaXZhdGUgX21heFBvc2l0aW9uID0gMFxuICBwcml2YXRlIF9iYWNrRW5hYmxlZCA9IHRydWVcbiAgcHJpdmF0ZSBfZm9yd2FyZEVuYWJsZWQgPSB0cnVlXG4gIHByaXZhdGUgX2N1cnJlbnRQb3NpdGlvbiA9IDBcblxuICBwdWJsaWMgZ2V0IGJhY2tFbmFibGVkKCkge1xuICAgIHJldHVybiB0aGlzLl9iYWNrRW5hYmxlZFxuICB9XG5cbiAgcHVibGljIGdldCBmb3J3YXJkRW5hYmxlZCgpIHtcbiAgICByZXR1cm4gdGhpcy5fZm9yd2FyZEVuYWJsZWRcbiAgfVxuXG4gIHB1YmxpYyBzZXRNYXhQb3NpdGlvbihuZXdMZW5ndGg6IG51bWJlcikge1xuICAgIHRoaXMuX21heFBvc2l0aW9uID0gbmV3TGVuZ3RoXG4gICAgdGhpcy5fY3VycmVudFBvc2l0aW9uID0gMFxuICAgIHRoaXMudXBkYXRlQnV0dG9uc1N0YXRlKClcbiAgfVxuICBwdWJsaWMgZ2V0TWF4UG9zaXRpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuX21heFBvc2l0aW9uXG4gIH1cblxuICAvKipcbiAgICogc2V0cyB0aGUgY3VycmVudCBoaXN0b3J5IHBvc2l0aW9uLCByZXR1cm5zIGZhbHNlIGlmIG5ld1Bvc2l0aW9uIGlzIGludmFsaWRcbiAgICovXG4gIHB1YmxpYyBzZXRDdXJyZW50UG9zaXRpb24obmV3UG9zaXRpb246IG51bWJlcikge1xuICAgIGlmIChuZXdQb3NpdGlvbiA8IDAgfHwgbmV3UG9zaXRpb24gPiB0aGlzLl9tYXhQb3NpdGlvbikge1xuICAgICAgcmV0dXJuIGZhbHNlXG4gICAgfVxuICAgIHRoaXMuX2N1cnJlbnRQb3NpdGlvbiA9IG5ld1Bvc2l0aW9uXG4gICAgdGhpcy51cGRhdGVCdXR0b25zU3RhdGUoKVxuXG4gICAgcmV0dXJuIHRydWVcbiAgfVxuICBwdWJsaWMgZ2V0Q3VycmVudFBvc2l0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLl9jdXJyZW50UG9zaXRpb25cbiAgfVxuXG4gIHByaXZhdGUgdXBkYXRlQnV0dG9uc1N0YXRlKCkge1xuICAgIHRoaXMuX2ZvcndhcmRFbmFibGVkID0gdGhpcy5fY3VycmVudFBvc2l0aW9uICE9PSAwXG4gICAgdGhpcy5fYmFja0VuYWJsZWQgPSB0aGlzLl9jdXJyZW50UG9zaXRpb24gIT09IHRoaXMuX21heFBvc2l0aW9uXG4gIH1cbn1cbiJdfQ==