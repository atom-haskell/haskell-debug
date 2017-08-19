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
}
module.exports = CurrentVariablesView;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ3VycmVudFZhcmlhYmxlc1ZpZXcuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvbGliL3ZpZXdzL0N1cnJlbnRWYXJpYWJsZXNWaWV3LnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQSx1Q0FBdUM7QUFDdkMseUNBQXlDO0FBRXpDO0lBTUU7UUFDRSxJQUFJLENBQUMsY0FBYyxHQUFHLDhCQUFNLEtBQUssRUFBQyxlQUFlLEVBQUMsS0FBSyxFQUFDLGdCQUFnQiw0QkFBNkIsQ0FBQTtRQUNyRyxJQUFJLENBQUMsSUFBSSxHQUFHLDRCQUFJLEtBQUssRUFBQyxZQUFZLEdBQUcsQ0FBQTtRQUNyQyxJQUFJLENBQUMsT0FBTyxHQUFHLENBQ2Isb0NBQVksS0FBSyxFQUFDLGFBQWEsRUFBQyxLQUFLLEVBQUMsUUFBUTtZQUM1Qyw2QkFBSyxLQUFLLEVBQUMsYUFBYTtnQkFDdEIsNkJBQUssS0FBSyxFQUFDLGVBQWU7b0JBQ3hCLHFEQUE2QjtvQkFDNUIsSUFBSSxDQUFDLGNBQWMsQ0FDaEI7Z0JBQ04sNkJBQUssS0FBSyxFQUFDLG1CQUFtQixJQUMzQixJQUFJLENBQUMsSUFBSSxDQUNOLENBQ0YsQ0FDSyxDQUNkLENBQUE7UUFFRCxJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksU0FBUyxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsRUFBRSxDQUFDLENBQUE7UUFDaEQsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDLEtBQUssR0FBRyxDQUFDLEdBQUcsR0FBRyxFQUFFLEVBQUUsQ0FBQyxDQUFBO0lBQ3hELENBQUM7SUFFWSxNQUFNLENBQUMsYUFBdUIsRUFBRSxtQkFBNEI7O1lBRXZFLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztnQkFDNUIsSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQTtZQUM3QyxDQUFDO1lBQ0QsR0FBRyxDQUFDLENBQUMsTUFBTSxPQUFPLElBQUksYUFBYSxDQUFDLENBQUMsQ0FBQztnQkFDcEMsSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQ25CLGdDQUNHLE9BQU8sQ0FDTCxDQUNOLENBQUE7WUFDSCxDQUFDO1lBRUQsRUFBRSxDQUFDLENBQUMsbUJBQW1CLENBQUMsQ0FBQyxDQUFDO2dCQUN4QixJQUFJLENBQUMsY0FBYyxDQUFDLEtBQUssQ0FBQyxPQUFPLEdBQUcsUUFBUSxDQUFBO1lBQzlDLENBQUM7WUFBQyxJQUFJLENBQUMsQ0FBQztnQkFDTixJQUFJLENBQUMsY0FBYyxDQUFDLEtBQUssQ0FBQyxPQUFPLEdBQUcsTUFBTSxDQUFBO1lBQzVDLENBQUM7UUFDSCxDQUFDO0tBQUE7SUFFTSxPQUFPO0lBRWQsQ0FBQztDQUNGO0FBRUQsaUJBQVMsb0JBQW9CLENBQUEiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgRHJhZ2dhYmxlID0gcmVxdWlyZSgnZHJhZ2dhYmxlJylcbmltcG9ydCBSZWFjdCA9IHJlcXVpcmUoJy4vUmVhY3RQb2x5ZmlsbCcpXG5cbmNsYXNzIEN1cnJlbnRWYXJpYWJsZXNWaWV3IHtcbiAgcHVibGljIGVsZW1lbnQ6IEhUTUxFbGVtZW50XG4gIHByaXZhdGUgZHJhZ2dhYmxlOiBEcmFnZ2FibGVcbiAgcHJpdmF0ZSBsaXN0OiBIVE1MRWxlbWVudFxuICBwcml2YXRlIGV4Y2VwdGlvblBhbmVsOiBIVE1MRWxlbWVudFxuXG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHRoaXMuZXhjZXB0aW9uUGFuZWwgPSA8c3BhbiBzdHlsZT1cImRpc3BsYXk6IG5vbmVcIiBjbGFzcz1cImVycm9yLW1lc3NhZ2VzXCI+KFBhdXNlZCBvbiBleGNlcHRpb24pPC9zcGFuPlxuICAgIHRoaXMubGlzdCA9IDx1bCBjbGFzcz1cImxpc3QtZ3JvdXBcIiAvPlxuICAgIHRoaXMuZWxlbWVudCA9IChcbiAgICAgIDxhdG9tLXBhbmVsIHN0eWxlPVwiei1pbmRleDogMTBcIiBjbGFzcz1cInBhZGRlZFwiPlxuICAgICAgICA8ZGl2IGNsYXNzPVwiaW5zZXQtcGFuZWxcIj5cbiAgICAgICAgICA8ZGl2IGNsYXNzPVwicGFuZWwtaGVhZGluZ1wiPlxuICAgICAgICAgICAgPHNwYW4+TG9jYWwgVmFyaWFibGVzIDwvc3Bhbj5cbiAgICAgICAgICAgIHt0aGlzLmV4Y2VwdGlvblBhbmVsfVxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJwYW5lbC1ib2R5IHBhZGRlZFwiPlxuICAgICAgICAgICAge3RoaXMubGlzdH1cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2F0b20tcGFuZWw+XG4gICAgKVxuXG4gICAgdGhpcy5kcmFnZ2FibGUgPSBuZXcgRHJhZ2dhYmxlKHRoaXMuZWxlbWVudCwge30pXG4gICAgdGhpcy5kcmFnZ2FibGUuc2V0KGF0b20uZ2V0U2l6ZSgpLndpZHRoIC8gMiArIDIwMCwgMzApXG4gIH1cblxuICBwdWJsaWMgYXN5bmMgdXBkYXRlKGxvY2FsQmluZGluZ3M6IHN0cmluZ1tdLCBpc1BhdXNlZE9uRXhjZXB0aW9uOiBib29sZWFuKSB7XG4gICAgLy8gcmVtb3ZlIGFsbCBsaXN0IGVsZW1lbnRzXG4gICAgd2hpbGUgKHRoaXMubGlzdC5maXJzdENoaWxkKSB7XG4gICAgICB0aGlzLmxpc3QucmVtb3ZlQ2hpbGQodGhpcy5saXN0LmZpcnN0Q2hpbGQpXG4gICAgfVxuICAgIGZvciAoY29uc3QgYmluZGluZyBvZiBsb2NhbEJpbmRpbmdzKSB7XG4gICAgICB0aGlzLmxpc3QuYXBwZW5kQ2hpbGQoXG4gICAgICAgIDxsaT5cbiAgICAgICAgICB7YmluZGluZ31cbiAgICAgICAgPC9saT4sXG4gICAgICApXG4gICAgfVxuXG4gICAgaWYgKGlzUGF1c2VkT25FeGNlcHRpb24pIHtcbiAgICAgIHRoaXMuZXhjZXB0aW9uUGFuZWwuc3R5bGUuZGlzcGxheSA9ICdpbmxpbmUnXG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuZXhjZXB0aW9uUGFuZWwuc3R5bGUuZGlzcGxheSA9ICdub25lJ1xuICAgIH1cbiAgfVxuXG4gIHB1YmxpYyBkZXN0cm95KCkge1xuICAgIC8vIFRPRE86IG5vb3A/XG4gIH1cbn1cblxuZXhwb3J0ID0gQ3VycmVudFZhcmlhYmxlc1ZpZXdcbiJdfQ==