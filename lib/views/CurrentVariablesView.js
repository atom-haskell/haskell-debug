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
        this.draggable.set(atom.getSize().width / 2 + 200, 30);
    }
}
module.exports = CurrentVariablesView;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ3VycmVudFZhcmlhYmxlc1ZpZXcuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvbGliL3ZpZXdzL0N1cnJlbnRWYXJpYWJsZXNWaWV3LnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQSx1Q0FBdUM7QUFDdkMseUNBQXlDO0FBRXpDO0lBTVUsTUFBTSxDQUFFLGFBQXVCLEVBQUUsbUJBQTRCOztZQUUvRCxPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7Z0JBQzFCLElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUE7WUFDL0MsQ0FBQztZQUNELEdBQUcsQ0FBQyxDQUFDLE1BQU0sT0FBTyxJQUFJLGFBQWEsQ0FBQyxDQUFBLENBQUM7Z0JBQ2pDLElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUNqQixnQ0FDSyxPQUFPLENBQ1AsQ0FDUixDQUFBO1lBQ0wsQ0FBQztZQUVELEVBQUUsQ0FBQyxDQUFDLG1CQUFtQixDQUFDLENBQUMsQ0FBQztnQkFDdEIsSUFBSSxDQUFDLGNBQWMsQ0FBQyxLQUFLLENBQUMsT0FBTyxHQUFHLFFBQVEsQ0FBQTtZQUNoRCxDQUFDO1lBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ0osSUFBSSxDQUFDLGNBQWMsQ0FBQyxLQUFLLENBQUMsT0FBTyxHQUFHLE1BQU0sQ0FBQTtZQUM5QyxDQUFDO1FBQ0wsQ0FBQztLQUFBO0lBRUQsT0FBTztJQUVQLENBQUM7SUFFRDtRQUNJLElBQUksQ0FBQyxjQUFjLEdBQUcsOEJBQU0sS0FBSyxFQUFDLGVBQWUsRUFBQyxLQUFLLEVBQUMsZ0JBQWdCLDRCQUE2QixDQUFBO1FBQ3JHLElBQUksQ0FBQyxJQUFJLEdBQUcsNEJBQUksS0FBSyxFQUFDLFlBQVksR0FBTSxDQUFBO1FBQ3hDLElBQUksQ0FBQyxPQUFPO1lBQ1osb0NBQVksS0FBSyxFQUFDLGFBQWEsRUFBQyxLQUFLLEVBQUMsUUFBUTtnQkFDMUMsNkJBQUssS0FBSyxFQUFDLGFBQWE7b0JBQ3BCLDZCQUFLLEtBQUssRUFBQyxlQUFlO3dCQUN0QixxREFBNkI7d0JBQzVCLElBQUksQ0FBQyxjQUFjLENBQ2xCO29CQUNOLDZCQUFLLEtBQUssRUFBQyxtQkFBbUIsSUFDekIsSUFBSSxDQUFDLElBQUksQ0FDUixDQUNKLENBQ0csQ0FBQTtRQUViLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxTQUFTLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxFQUFFLENBQUMsQ0FBQTtRQUNoRCxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUMsS0FBSyxHQUFHLENBQUMsR0FBRyxHQUFHLEVBQUUsRUFBRSxDQUFDLENBQUE7SUFDMUQsQ0FBQztDQUNKO0FBRUQsaUJBQVMsb0JBQW9CLENBQUEiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgRHJhZ2dhYmxlID0gcmVxdWlyZSgnZHJhZ2dhYmxlJylcbmltcG9ydCBSZWFjdCA9IHJlcXVpcmUoJy4vUmVhY3RQb2x5ZmlsbCcpXG5cbmNsYXNzIEN1cnJlbnRWYXJpYWJsZXNWaWV3IHtcbiAgICBlbGVtZW50OiBIVE1MRWxlbWVudFxuICAgIHByaXZhdGUgZHJhZ2dhYmxlOiBEcmFnZ2FibGVcbiAgICBwcml2YXRlIGxpc3Q6IEhUTUxFbGVtZW50XG4gICAgcHJpdmF0ZSBleGNlcHRpb25QYW5lbDogSFRNTEVsZW1lbnRcblxuICAgIGFzeW5jIHVwZGF0ZSAobG9jYWxCaW5kaW5nczogc3RyaW5nW10sIGlzUGF1c2VkT25FeGNlcHRpb246IGJvb2xlYW4pIHtcbiAgICAgICAgLy8gcmVtb3ZlIGFsbCBsaXN0IGVsZW1lbnRzXG4gICAgICAgIHdoaWxlICh0aGlzLmxpc3QuZmlyc3RDaGlsZCkge1xuICAgICAgICAgICAgdGhpcy5saXN0LnJlbW92ZUNoaWxkKHRoaXMubGlzdC5maXJzdENoaWxkKVxuICAgICAgICB9XG4gICAgICAgIGZvciAoY29uc3QgYmluZGluZyBvZiBsb2NhbEJpbmRpbmdzKXtcbiAgICAgICAgICAgIHRoaXMubGlzdC5hcHBlbmRDaGlsZChcbiAgICAgICAgICAgICAgICA8bGk+XG4gICAgICAgICAgICAgICAgICAgIHtiaW5kaW5nfVxuICAgICAgICAgICAgICAgIDwvbGk+XG4gICAgICAgICAgICApXG4gICAgICAgIH1cblxuICAgICAgICBpZiAoaXNQYXVzZWRPbkV4Y2VwdGlvbikge1xuICAgICAgICAgICAgdGhpcy5leGNlcHRpb25QYW5lbC5zdHlsZS5kaXNwbGF5ID0gJ2lubGluZSdcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuZXhjZXB0aW9uUGFuZWwuc3R5bGUuZGlzcGxheSA9ICdub25lJ1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZGVzdHJveSAoKSB7XG4gICAgICAvLyBUT0RPOiBub29wP1xuICAgIH1cblxuICAgIGNvbnN0cnVjdG9yICgpIHtcbiAgICAgICAgdGhpcy5leGNlcHRpb25QYW5lbCA9IDxzcGFuIHN0eWxlPVwiZGlzcGxheTogbm9uZVwiIGNsYXNzPVwiZXJyb3ItbWVzc2FnZXNcIj4oUGF1c2VkIG9uIGV4Y2VwdGlvbik8L3NwYW4+XG4gICAgICAgIHRoaXMubGlzdCA9IDx1bCBjbGFzcz1cImxpc3QtZ3JvdXBcIj48L3VsPlxuICAgICAgICB0aGlzLmVsZW1lbnQgPVxuICAgICAgICA8YXRvbS1wYW5lbCBzdHlsZT1cInotaW5kZXg6IDEwXCIgY2xhc3M9XCJwYWRkZWRcIj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJpbnNldC1wYW5lbFwiPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJwYW5lbC1oZWFkaW5nXCI+XG4gICAgICAgICAgICAgICAgICAgIDxzcGFuPkxvY2FsIFZhcmlhYmxlcyA8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgIHt0aGlzLmV4Y2VwdGlvblBhbmVsfVxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJwYW5lbC1ib2R5IHBhZGRlZFwiPlxuICAgICAgICAgICAgICAgICAgICB7dGhpcy5saXN0fVxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvYXRvbS1wYW5lbD5cblxuICAgICAgICB0aGlzLmRyYWdnYWJsZSA9IG5ldyBEcmFnZ2FibGUodGhpcy5lbGVtZW50LCB7fSlcbiAgICAgICAgdGhpcy5kcmFnZ2FibGUuc2V0KGF0b20uZ2V0U2l6ZSgpLndpZHRoIC8gMiArIDIwMCwgMzApXG4gICAgfVxufVxuXG5leHBvcnQgPSBDdXJyZW50VmFyaWFibGVzVmlld1xuIl19