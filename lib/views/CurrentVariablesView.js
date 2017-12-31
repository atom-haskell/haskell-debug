"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Draggable = require("draggable");
const React = require("./ReactPolyfill");
class CurrentVariablesView {
    constructor() {
        this.exceptionPanel = React.createElement("span", { style: "display: none", class: "error-messages" }, "(Paused on exception)");
        this.list = React.createElement("ul", { class: "list-group" });
        this.element = (React.createElement("atom-panel", { style: "z-index: 10", class: "padded" },
            React.createElement("div", { class: "inset-panel" },
                React.createElement("div", { class: "panel-heading" },
                    React.createElement("span", null, "Local Variables "),
                    this.exceptionPanel),
                React.createElement("div", { class: "panel-body padded" }, this.list))));
        this.draggable = new Draggable(this.element, {});
        this.draggable.set(atom.getSize().width / 2 + 200, 30);
    }
    async update(localBindings, isPausedOnException) {
        while (this.list.firstChild) {
            this.list.removeChild(this.list.firstChild);
        }
        for (const binding of localBindings) {
            this.list.appendChild(React.createElement("li", null, binding));
        }
        if (isPausedOnException) {
            this.exceptionPanel.style.display = 'inline';
        }
        else {
            this.exceptionPanel.style.display = 'none';
        }
    }
    destroy() {
    }
}
exports.CurrentVariablesView = CurrentVariablesView;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ3VycmVudFZhcmlhYmxlc1ZpZXcuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvbGliL3ZpZXdzL0N1cnJlbnRWYXJpYWJsZXNWaWV3LnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLHVDQUF1QztBQUN2Qyx5Q0FBeUM7QUFFekM7SUFNRTtRQUNFLElBQUksQ0FBQyxjQUFjLEdBQUcsOEJBQU0sS0FBSyxFQUFDLGVBQWUsRUFBQyxLQUFLLEVBQUMsZ0JBQWdCLDRCQUE2QixDQUFBO1FBQ3JHLElBQUksQ0FBQyxJQUFJLEdBQUcsNEJBQUksS0FBSyxFQUFDLFlBQVksR0FBRyxDQUFBO1FBQ3JDLElBQUksQ0FBQyxPQUFPLEdBQUcsQ0FDYixvQ0FBWSxLQUFLLEVBQUMsYUFBYSxFQUFDLEtBQUssRUFBQyxRQUFRO1lBQzVDLDZCQUFLLEtBQUssRUFBQyxhQUFhO2dCQUN0Qiw2QkFBSyxLQUFLLEVBQUMsZUFBZTtvQkFDeEIscURBQTZCO29CQUM1QixJQUFJLENBQUMsY0FBYyxDQUNoQjtnQkFDTiw2QkFBSyxLQUFLLEVBQUMsbUJBQW1CLElBQzNCLElBQUksQ0FBQyxJQUFJLENBQ04sQ0FDRixDQUNLLENBQ2QsQ0FBQTtRQUVELElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxTQUFTLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxFQUFFLENBQUMsQ0FBQTtRQUNoRCxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUMsS0FBSyxHQUFHLENBQUMsR0FBRyxHQUFHLEVBQUUsRUFBRSxDQUFDLENBQUE7SUFDeEQsQ0FBQztJQUVNLEtBQUssQ0FBQyxNQUFNLENBQUMsYUFBdUIsRUFBRSxtQkFBNEI7UUFFdkUsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO1lBQzVCLElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUE7UUFDN0MsQ0FBQztRQUNELEdBQUcsQ0FBQyxDQUFDLE1BQU0sT0FBTyxJQUFJLGFBQWEsQ0FBQyxDQUFDLENBQUM7WUFDcEMsSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQ25CLGdDQUFLLE9BQU8sQ0FBTSxDQUNuQixDQUFBO1FBQ0gsQ0FBQztRQUVELEVBQUUsQ0FBQyxDQUFDLG1CQUFtQixDQUFDLENBQUMsQ0FBQztZQUN4QixJQUFJLENBQUMsY0FBYyxDQUFDLEtBQUssQ0FBQyxPQUFPLEdBQUcsUUFBUSxDQUFBO1FBQzlDLENBQUM7UUFBQyxJQUFJLENBQUMsQ0FBQztZQUNOLElBQUksQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDLE9BQU8sR0FBRyxNQUFNLENBQUE7UUFDNUMsQ0FBQztJQUNILENBQUM7SUFFTSxPQUFPO0lBRWQsQ0FBQztDQUNGO0FBaERELG9EQWdEQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBEcmFnZ2FibGUgPSByZXF1aXJlKCdkcmFnZ2FibGUnKVxuaW1wb3J0IFJlYWN0ID0gcmVxdWlyZSgnLi9SZWFjdFBvbHlmaWxsJylcblxuZXhwb3J0IGNsYXNzIEN1cnJlbnRWYXJpYWJsZXNWaWV3IHtcbiAgcHVibGljIGVsZW1lbnQ6IEhUTUxFbGVtZW50XG4gIHByaXZhdGUgZHJhZ2dhYmxlOiBEcmFnZ2FibGVcbiAgcHJpdmF0ZSBsaXN0OiBIVE1MRWxlbWVudFxuICBwcml2YXRlIGV4Y2VwdGlvblBhbmVsOiBIVE1MRWxlbWVudFxuXG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHRoaXMuZXhjZXB0aW9uUGFuZWwgPSA8c3BhbiBzdHlsZT1cImRpc3BsYXk6IG5vbmVcIiBjbGFzcz1cImVycm9yLW1lc3NhZ2VzXCI+KFBhdXNlZCBvbiBleGNlcHRpb24pPC9zcGFuPlxuICAgIHRoaXMubGlzdCA9IDx1bCBjbGFzcz1cImxpc3QtZ3JvdXBcIiAvPlxuICAgIHRoaXMuZWxlbWVudCA9IChcbiAgICAgIDxhdG9tLXBhbmVsIHN0eWxlPVwiei1pbmRleDogMTBcIiBjbGFzcz1cInBhZGRlZFwiPlxuICAgICAgICA8ZGl2IGNsYXNzPVwiaW5zZXQtcGFuZWxcIj5cbiAgICAgICAgICA8ZGl2IGNsYXNzPVwicGFuZWwtaGVhZGluZ1wiPlxuICAgICAgICAgICAgPHNwYW4+TG9jYWwgVmFyaWFibGVzIDwvc3Bhbj5cbiAgICAgICAgICAgIHt0aGlzLmV4Y2VwdGlvblBhbmVsfVxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJwYW5lbC1ib2R5IHBhZGRlZFwiPlxuICAgICAgICAgICAge3RoaXMubGlzdH1cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2F0b20tcGFuZWw+XG4gICAgKVxuXG4gICAgdGhpcy5kcmFnZ2FibGUgPSBuZXcgRHJhZ2dhYmxlKHRoaXMuZWxlbWVudCwge30pXG4gICAgdGhpcy5kcmFnZ2FibGUuc2V0KGF0b20uZ2V0U2l6ZSgpLndpZHRoIC8gMiArIDIwMCwgMzApXG4gIH1cblxuICBwdWJsaWMgYXN5bmMgdXBkYXRlKGxvY2FsQmluZGluZ3M6IHN0cmluZ1tdLCBpc1BhdXNlZE9uRXhjZXB0aW9uOiBib29sZWFuKSB7XG4gICAgLy8gcmVtb3ZlIGFsbCBsaXN0IGVsZW1lbnRzXG4gICAgd2hpbGUgKHRoaXMubGlzdC5maXJzdENoaWxkKSB7XG4gICAgICB0aGlzLmxpc3QucmVtb3ZlQ2hpbGQodGhpcy5saXN0LmZpcnN0Q2hpbGQpXG4gICAgfVxuICAgIGZvciAoY29uc3QgYmluZGluZyBvZiBsb2NhbEJpbmRpbmdzKSB7XG4gICAgICB0aGlzLmxpc3QuYXBwZW5kQ2hpbGQoXG4gICAgICAgIDxsaT57YmluZGluZ308L2xpPixcbiAgICAgIClcbiAgICB9XG5cbiAgICBpZiAoaXNQYXVzZWRPbkV4Y2VwdGlvbikge1xuICAgICAgdGhpcy5leGNlcHRpb25QYW5lbC5zdHlsZS5kaXNwbGF5ID0gJ2lubGluZSdcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5leGNlcHRpb25QYW5lbC5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnXG4gICAgfVxuICB9XG5cbiAgcHVibGljIGRlc3Ryb3koKSB7XG4gICAgLy8gVE9ETzogbm9vcD9cbiAgfVxufVxuIl19