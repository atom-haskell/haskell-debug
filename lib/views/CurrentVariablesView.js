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
            for (var binding of localBindings) {
                this.list.appendChild(React.createElement("li", null, binding));
            }
            if (isPausedOnException) {
                this.exceptionPanel.style.display = "inline";
            }
            else {
                this.exceptionPanel.style.display = "none";
            }
        });
    }
    destroy() {
    }
    constructor() {
        this.element =
            React.createElement("atom-panel", { style: "z-index: 10", class: "padded" },
                React.createElement("div", { class: "inset-panel" },
                    React.createElement("div", { class: "panel-heading" },
                        React.createElement("span", null, "Local Variables "),
                        this.exceptionPanel = React.createElement("span", { style: "display: none", class: "error-messages" }, "(Paused on exception)")),
                    React.createElement("div", { class: "panel-body padded" }, this.list = React.createElement("ul", { class: 'list-group' }))));
        this.draggable = new Draggable(this.element, {});
        this.draggable.set(atom.workspace.getActiveTextEditor()["width"] / 2 + 200, 30);
    }
}
module.exports = CurrentVariablesView;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ3VycmVudFZhcmlhYmxlc1ZpZXcuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvbGliL3ZpZXdzL0N1cnJlbnRWYXJpYWJsZXNWaWV3LnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQSx1Q0FBd0M7QUFFeEMseUNBQTBDO0FBRzFDO0lBTVUsTUFBTSxDQUFDLGFBQXVCLEVBQUUsbUJBQTRCOztZQUU5RCxPQUFNLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFDLENBQUM7Z0JBQ3hCLElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDaEQsQ0FBQztZQUNELEdBQUcsQ0FBQSxDQUFDLElBQUksT0FBTyxJQUFJLGFBQWEsQ0FBQyxDQUFBLENBQUM7Z0JBQzlCLElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUNqQixnQ0FDSyxPQUFPLENBQ1AsQ0FDUixDQUFBO1lBQ0wsQ0FBQztZQUVELEVBQUUsQ0FBQSxDQUFDLG1CQUFtQixDQUFDLENBQUEsQ0FBQztnQkFDcEIsSUFBSSxDQUFDLGNBQWMsQ0FBQyxLQUFLLENBQUMsT0FBTyxHQUFHLFFBQVEsQ0FBQztZQUNqRCxDQUFDO1lBQ0QsSUFBSSxDQUFBLENBQUM7Z0JBQ0QsSUFBSSxDQUFDLGNBQWMsQ0FBQyxLQUFLLENBQUMsT0FBTyxHQUFHLE1BQU0sQ0FBQztZQUMvQyxDQUFDO1FBQ0wsQ0FBQztLQUFBO0lBRUQsT0FBTztJQUVQLENBQUM7SUFFRDtRQUNJLElBQUksQ0FBQyxPQUFPO1lBQ1osb0NBQVksS0FBSyxFQUFDLGFBQWEsRUFBQyxLQUFLLEVBQUMsUUFBUTtnQkFDMUMsNkJBQUssS0FBSyxFQUFDLGFBQWE7b0JBQ3BCLDZCQUFLLEtBQUssRUFBQyxlQUFlO3dCQUN0QixxREFBNkI7d0JBQzVCLElBQUksQ0FBQyxjQUFjLEdBQUcsOEJBQU0sS0FBSyxFQUFDLGVBQWUsRUFBQyxLQUFLLEVBQUMsZ0JBQWdCLDRCQUE2QixDQUNwRztvQkFDTiw2QkFBSyxLQUFLLEVBQUMsbUJBQW1CLElBQ3pCLElBQUksQ0FBQyxJQUFJLEdBQUcsNEJBQUksS0FBSyxFQUFDLFlBQVksR0FBTSxDQUN2QyxDQUNKLENBQ0csQ0FBQztRQUVkLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxTQUFTLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxFQUFFLENBQUMsQ0FBQztRQUNqRCxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLG1CQUFtQixFQUFFLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEdBQUcsRUFBRSxFQUFFLENBQUMsQ0FBQztJQUNwRixDQUFDO0NBQ0o7QUFFRCxpQkFBUyxvQkFBb0IsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBEcmFnZ2FibGUgPSByZXF1aXJlKFwiZHJhZ2dhYmxlXCIpO1xuaW1wb3J0IGF0b21BUEkgPSByZXF1aXJlKFwiYXRvbVwiKTtcbmltcG9ydCBSZWFjdCA9IHJlcXVpcmUoXCIuL1JlYWN0UG9seWZpbGxcIik7XG5pbXBvcnQgSGlnaGxpZ2h0cyA9IHJlcXVpcmUoXCJoaWdobGlnaHRzXCIpO1xuXG5jbGFzcyBDdXJyZW50VmFyaWFibGVzVmlldyB7XG4gICAgZWxlbWVudDogSFRNTEVsZW1lbnQ7XG4gICAgcHJpdmF0ZSBkcmFnZ2FibGU6IERyYWdnYWJsZTtcbiAgICBwcml2YXRlIGxpc3Q6IEhUTUxFbGVtZW50O1xuICAgIHByaXZhdGUgZXhjZXB0aW9uUGFuZWw6IEhUTUxFbGVtZW50O1xuXG4gICAgYXN5bmMgdXBkYXRlKGxvY2FsQmluZGluZ3M6IHN0cmluZ1tdLCBpc1BhdXNlZE9uRXhjZXB0aW9uOiBib29sZWFuKXtcbiAgICAgICAgLy8gcmVtb3ZlIGFsbCBsaXN0IGVsZW1lbnRzXG4gICAgICAgIHdoaWxlKHRoaXMubGlzdC5maXJzdENoaWxkKXtcbiAgICAgICAgICAgIHRoaXMubGlzdC5yZW1vdmVDaGlsZCh0aGlzLmxpc3QuZmlyc3RDaGlsZCk7XG4gICAgICAgIH1cbiAgICAgICAgZm9yKHZhciBiaW5kaW5nIG9mIGxvY2FsQmluZGluZ3Mpe1xuICAgICAgICAgICAgdGhpcy5saXN0LmFwcGVuZENoaWxkKFxuICAgICAgICAgICAgICAgIDxsaT5cbiAgICAgICAgICAgICAgICAgICAge2JpbmRpbmd9XG4gICAgICAgICAgICAgICAgPC9saT5cbiAgICAgICAgICAgIClcbiAgICAgICAgfVxuXG4gICAgICAgIGlmKGlzUGF1c2VkT25FeGNlcHRpb24pe1xuICAgICAgICAgICAgdGhpcy5leGNlcHRpb25QYW5lbC5zdHlsZS5kaXNwbGF5ID0gXCJpbmxpbmVcIjtcbiAgICAgICAgfVxuICAgICAgICBlbHNle1xuICAgICAgICAgICAgdGhpcy5leGNlcHRpb25QYW5lbC5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBkZXN0cm95KCl7XG5cbiAgICB9XG5cbiAgICBjb25zdHJ1Y3Rvcigpe1xuICAgICAgICB0aGlzLmVsZW1lbnQgPVxuICAgICAgICA8YXRvbS1wYW5lbCBzdHlsZT1cInotaW5kZXg6IDEwXCIgY2xhc3M9XCJwYWRkZWRcIj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJpbnNldC1wYW5lbFwiPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJwYW5lbC1oZWFkaW5nXCI+XG4gICAgICAgICAgICAgICAgICAgIDxzcGFuPkxvY2FsIFZhcmlhYmxlcyA8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgIHt0aGlzLmV4Y2VwdGlvblBhbmVsID0gPHNwYW4gc3R5bGU9XCJkaXNwbGF5OiBub25lXCIgY2xhc3M9XCJlcnJvci1tZXNzYWdlc1wiPihQYXVzZWQgb24gZXhjZXB0aW9uKTwvc3Bhbj59XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInBhbmVsLWJvZHkgcGFkZGVkXCI+XG4gICAgICAgICAgICAgICAgICAgIHt0aGlzLmxpc3QgPSA8dWwgY2xhc3M9J2xpc3QtZ3JvdXAnPjwvdWw+fVxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvYXRvbS1wYW5lbD47XG5cbiAgICAgICAgdGhpcy5kcmFnZ2FibGUgPSBuZXcgRHJhZ2dhYmxlKHRoaXMuZWxlbWVudCwge30pO1xuICAgICAgICB0aGlzLmRyYWdnYWJsZS5zZXQoYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlVGV4dEVkaXRvcigpW1wid2lkdGhcIl0gLyAyICsgMjAwLCAzMCk7XG4gICAgfVxufVxuXG5leHBvcnQgPSBDdXJyZW50VmFyaWFibGVzVmlldztcbiJdfQ==