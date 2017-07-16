"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const Draggable = require("draggable");
const React = require("./ReactPolyfill");
class CurrentVariablesView {
    update(localBindings, isPausedOnException) {
        return __awaiter(this, void 0, void 0, function* () {
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
        });
    }
    destroy() {
    }
    constructor() {
        this.exceptionPanel = React.createElement("span", { style: "display: none", class: "error-messages" }, "(Paused on exception)");
        this.list = React.createElement("ul", { class: "list-group" });
        this.element =
            React.createElement("atom-panel", { style: "z-index: 10", class: "padded" },
                React.createElement("div", { class: "inset-panel" },
                    React.createElement("div", { class: "panel-heading" },
                        React.createElement("span", null, "Local Variables "),
                        this.exceptionPanel),
                    React.createElement("div", { class: "panel-body padded" }, this.list)));
        this.draggable = new Draggable(this.element, {});
        this.draggable.set(atom.workspace.getActiveTextEditor().getWidth() / 2 + 200, 30);
    }
}
module.exports = CurrentVariablesView;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ3VycmVudFZhcmlhYmxlc1ZpZXcuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvbGliL3ZpZXdzL0N1cnJlbnRWYXJpYWJsZXNWaWV3LnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQSx1Q0FBdUM7QUFDdkMseUNBQXlDO0FBRXpDO0lBTVUsTUFBTSxDQUFFLGFBQXVCLEVBQUUsbUJBQTRCOztZQUUvRCxPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7Z0JBQzFCLElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUE7WUFDL0MsQ0FBQztZQUNELEdBQUcsQ0FBQyxDQUFDLE1BQU0sT0FBTyxJQUFJLGFBQWEsQ0FBQyxDQUFBLENBQUM7Z0JBQ2pDLElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUNqQixnQ0FDSyxPQUFPLENBQ1AsQ0FDUixDQUFBO1lBQ0wsQ0FBQztZQUVELEVBQUUsQ0FBQyxDQUFDLG1CQUFtQixDQUFDLENBQUMsQ0FBQztnQkFDdEIsSUFBSSxDQUFDLGNBQWMsQ0FBQyxLQUFLLENBQUMsT0FBTyxHQUFHLFFBQVEsQ0FBQTtZQUNoRCxDQUFDO1lBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ0osSUFBSSxDQUFDLGNBQWMsQ0FBQyxLQUFLLENBQUMsT0FBTyxHQUFHLE1BQU0sQ0FBQTtZQUM5QyxDQUFDO1FBQ0wsQ0FBQztLQUFBO0lBRUQsT0FBTztJQUVQLENBQUM7SUFFRDtRQUNJLElBQUksQ0FBQyxjQUFjLEdBQUcsOEJBQU0sS0FBSyxFQUFDLGVBQWUsRUFBQyxLQUFLLEVBQUMsZ0JBQWdCLDRCQUE2QixDQUFBO1FBQ3JHLElBQUksQ0FBQyxJQUFJLEdBQUcsNEJBQUksS0FBSyxFQUFDLFlBQVksR0FBTSxDQUFBO1FBQ3hDLElBQUksQ0FBQyxPQUFPO1lBQ1osb0NBQVksS0FBSyxFQUFDLGFBQWEsRUFBQyxLQUFLLEVBQUMsUUFBUTtnQkFDMUMsNkJBQUssS0FBSyxFQUFDLGFBQWE7b0JBQ3BCLDZCQUFLLEtBQUssRUFBQyxlQUFlO3dCQUN0QixxREFBNkI7d0JBQzVCLElBQUksQ0FBQyxjQUFjLENBQ2xCO29CQUNOLDZCQUFLLEtBQUssRUFBQyxtQkFBbUIsSUFDekIsSUFBSSxDQUFDLElBQUksQ0FDUixDQUNKLENBQ0csQ0FBQTtRQUViLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxTQUFTLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxFQUFFLENBQUMsQ0FBQTtRQUNoRCxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLG1CQUFtQixFQUFFLENBQUMsUUFBUSxFQUFFLEdBQUcsQ0FBQyxHQUFHLEdBQUcsRUFBRSxFQUFFLENBQUMsQ0FBQTtJQUNyRixDQUFDO0NBQ0o7QUFFRCxpQkFBUyxvQkFBb0IsQ0FBQSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBEcmFnZ2FibGUgPSByZXF1aXJlKCdkcmFnZ2FibGUnKVxuaW1wb3J0IFJlYWN0ID0gcmVxdWlyZSgnLi9SZWFjdFBvbHlmaWxsJylcblxuY2xhc3MgQ3VycmVudFZhcmlhYmxlc1ZpZXcge1xuICAgIGVsZW1lbnQ6IEhUTUxFbGVtZW50XG4gICAgcHJpdmF0ZSBkcmFnZ2FibGU6IERyYWdnYWJsZVxuICAgIHByaXZhdGUgbGlzdDogSFRNTEVsZW1lbnRcbiAgICBwcml2YXRlIGV4Y2VwdGlvblBhbmVsOiBIVE1MRWxlbWVudFxuXG4gICAgYXN5bmMgdXBkYXRlIChsb2NhbEJpbmRpbmdzOiBzdHJpbmdbXSwgaXNQYXVzZWRPbkV4Y2VwdGlvbjogYm9vbGVhbikge1xuICAgICAgICAvLyByZW1vdmUgYWxsIGxpc3QgZWxlbWVudHNcbiAgICAgICAgd2hpbGUgKHRoaXMubGlzdC5maXJzdENoaWxkKSB7XG4gICAgICAgICAgICB0aGlzLmxpc3QucmVtb3ZlQ2hpbGQodGhpcy5saXN0LmZpcnN0Q2hpbGQpXG4gICAgICAgIH1cbiAgICAgICAgZm9yIChjb25zdCBiaW5kaW5nIG9mIGxvY2FsQmluZGluZ3Mpe1xuICAgICAgICAgICAgdGhpcy5saXN0LmFwcGVuZENoaWxkKFxuICAgICAgICAgICAgICAgIDxsaT5cbiAgICAgICAgICAgICAgICAgICAge2JpbmRpbmd9XG4gICAgICAgICAgICAgICAgPC9saT5cbiAgICAgICAgICAgIClcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChpc1BhdXNlZE9uRXhjZXB0aW9uKSB7XG4gICAgICAgICAgICB0aGlzLmV4Y2VwdGlvblBhbmVsLnN0eWxlLmRpc3BsYXkgPSAnaW5saW5lJ1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5leGNlcHRpb25QYW5lbC5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBkZXN0cm95ICgpIHtcbiAgICAgIC8vIFRPRE86IG5vb3A/XG4gICAgfVxuXG4gICAgY29uc3RydWN0b3IgKCkge1xuICAgICAgICB0aGlzLmV4Y2VwdGlvblBhbmVsID0gPHNwYW4gc3R5bGU9XCJkaXNwbGF5OiBub25lXCIgY2xhc3M9XCJlcnJvci1tZXNzYWdlc1wiPihQYXVzZWQgb24gZXhjZXB0aW9uKTwvc3Bhbj5cbiAgICAgICAgdGhpcy5saXN0ID0gPHVsIGNsYXNzPVwibGlzdC1ncm91cFwiPjwvdWw+XG4gICAgICAgIHRoaXMuZWxlbWVudCA9XG4gICAgICAgIDxhdG9tLXBhbmVsIHN0eWxlPVwiei1pbmRleDogMTBcIiBjbGFzcz1cInBhZGRlZFwiPlxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cImluc2V0LXBhbmVsXCI+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInBhbmVsLWhlYWRpbmdcIj5cbiAgICAgICAgICAgICAgICAgICAgPHNwYW4+TG9jYWwgVmFyaWFibGVzIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAge3RoaXMuZXhjZXB0aW9uUGFuZWx9XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInBhbmVsLWJvZHkgcGFkZGVkXCI+XG4gICAgICAgICAgICAgICAgICAgIHt0aGlzLmxpc3R9XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9hdG9tLXBhbmVsPlxuXG4gICAgICAgIHRoaXMuZHJhZ2dhYmxlID0gbmV3IERyYWdnYWJsZSh0aGlzLmVsZW1lbnQsIHt9KVxuICAgICAgICB0aGlzLmRyYWdnYWJsZS5zZXQoYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlVGV4dEVkaXRvcigpLmdldFdpZHRoKCkgLyAyICsgMjAwLCAzMClcbiAgICB9XG59XG5cbmV4cG9ydCA9IEN1cnJlbnRWYXJpYWJsZXNWaWV3XG4iXX0=