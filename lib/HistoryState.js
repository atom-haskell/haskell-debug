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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiSGlzdG9yeVN0YXRlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2xpYi9IaXN0b3J5U3RhdGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFDQTtJQUFBO1FBQ1UsaUJBQVksR0FBRyxDQUFDLENBQUE7UUFDaEIsaUJBQVksR0FBRyxJQUFJLENBQUE7UUFDbkIsb0JBQWUsR0FBRyxJQUFJLENBQUE7UUFDdEIscUJBQWdCLEdBQUcsQ0FBQyxDQUFBO0lBdUM5QixDQUFDO0lBckNDLElBQVcsV0FBVztRQUNwQixNQUFNLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQTtJQUMxQixDQUFDO0lBRUQsSUFBVyxjQUFjO1FBQ3ZCLE1BQU0sQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFBO0lBQzdCLENBQUM7SUFFTSxjQUFjLENBQUMsU0FBaUI7UUFDckMsSUFBSSxDQUFDLFlBQVksR0FBRyxTQUFTLENBQUE7UUFDN0IsSUFBSSxDQUFDLGdCQUFnQixHQUFHLENBQUMsQ0FBQTtRQUN6QixJQUFJLENBQUMsa0JBQWtCLEVBQUUsQ0FBQTtJQUMzQixDQUFDO0lBQ00sY0FBYztRQUNuQixNQUFNLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQTtJQUMxQixDQUFDO0lBS00sa0JBQWtCLENBQUMsV0FBbUI7UUFDM0MsRUFBRSxDQUFDLENBQUMsV0FBVyxHQUFHLENBQUMsSUFBSSxXQUFXLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUM7WUFDdkQsTUFBTSxDQUFDLEtBQUssQ0FBQTtRQUNkLENBQUM7UUFDRCxJQUFJLENBQUMsZ0JBQWdCLEdBQUcsV0FBVyxDQUFBO1FBQ25DLElBQUksQ0FBQyxrQkFBa0IsRUFBRSxDQUFBO1FBRXpCLE1BQU0sQ0FBQyxJQUFJLENBQUE7SUFDYixDQUFDO0lBQ00sa0JBQWtCO1FBQ3ZCLE1BQU0sQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUE7SUFDOUIsQ0FBQztJQUVPLGtCQUFrQjtRQUN4QixJQUFJLENBQUMsZUFBZSxHQUFHLElBQUksQ0FBQyxnQkFBZ0IsS0FBSyxDQUFDLENBQUE7UUFDbEQsSUFBSSxDQUFDLFlBQVksR0FBRyxJQUFJLENBQUMsZ0JBQWdCLEtBQUssSUFBSSxDQUFDLFlBQVksQ0FBQTtJQUNqRSxDQUFDO0NBQ0Y7QUEzQ0Qsb0NBMkNDIiwic291cmNlc0NvbnRlbnQiOlsiXG5leHBvcnQgY2xhc3MgSGlzdG9yeVN0YXRlIHtcbiAgcHJpdmF0ZSBfbWF4UG9zaXRpb24gPSAwXG4gIHByaXZhdGUgX2JhY2tFbmFibGVkID0gdHJ1ZVxuICBwcml2YXRlIF9mb3J3YXJkRW5hYmxlZCA9IHRydWVcbiAgcHJpdmF0ZSBfY3VycmVudFBvc2l0aW9uID0gMFxuXG4gIHB1YmxpYyBnZXQgYmFja0VuYWJsZWQoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2JhY2tFbmFibGVkXG4gIH1cblxuICBwdWJsaWMgZ2V0IGZvcndhcmRFbmFibGVkKCkge1xuICAgIHJldHVybiB0aGlzLl9mb3J3YXJkRW5hYmxlZFxuICB9XG5cbiAgcHVibGljIHNldE1heFBvc2l0aW9uKG5ld0xlbmd0aDogbnVtYmVyKSB7XG4gICAgdGhpcy5fbWF4UG9zaXRpb24gPSBuZXdMZW5ndGhcbiAgICB0aGlzLl9jdXJyZW50UG9zaXRpb24gPSAwXG4gICAgdGhpcy51cGRhdGVCdXR0b25zU3RhdGUoKVxuICB9XG4gIHB1YmxpYyBnZXRNYXhQb3NpdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5fbWF4UG9zaXRpb25cbiAgfVxuXG4gIC8qKlxuICAgICogc2V0cyB0aGUgY3VycmVudCBoaXN0b3J5IHBvc2l0aW9uLCByZXR1cm5zIGZhbHNlIGlmIG5ld1Bvc2l0aW9uIGlzIGludmFsaWRcbiAgKi9cbiAgcHVibGljIHNldEN1cnJlbnRQb3NpdGlvbihuZXdQb3NpdGlvbjogbnVtYmVyKSB7XG4gICAgaWYgKG5ld1Bvc2l0aW9uIDwgMCB8fCBuZXdQb3NpdGlvbiA+IHRoaXMuX21heFBvc2l0aW9uKSB7XG4gICAgICByZXR1cm4gZmFsc2VcbiAgICB9XG4gICAgdGhpcy5fY3VycmVudFBvc2l0aW9uID0gbmV3UG9zaXRpb25cbiAgICB0aGlzLnVwZGF0ZUJ1dHRvbnNTdGF0ZSgpXG5cbiAgICByZXR1cm4gdHJ1ZVxuICB9XG4gIHB1YmxpYyBnZXRDdXJyZW50UG9zaXRpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuX2N1cnJlbnRQb3NpdGlvblxuICB9XG5cbiAgcHJpdmF0ZSB1cGRhdGVCdXR0b25zU3RhdGUoKSB7XG4gICAgdGhpcy5fZm9yd2FyZEVuYWJsZWQgPSB0aGlzLl9jdXJyZW50UG9zaXRpb24gIT09IDBcbiAgICB0aGlzLl9iYWNrRW5hYmxlZCA9IHRoaXMuX2N1cnJlbnRQb3NpdGlvbiAhPT0gdGhpcy5fbWF4UG9zaXRpb25cbiAgfVxufVxuIl19