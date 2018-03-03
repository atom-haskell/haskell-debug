"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Draggable = require("draggable");
const React = require("./ReactPolyfill");
class CurrentVariablesView {
    constructor() {
        this.exceptionPanel = (React.createElement("span", { style: "display: none", class: "error-messages" }, "(Paused on exception)"));
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ3VycmVudFZhcmlhYmxlc1ZpZXcuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9saWItc3JjL3ZpZXdzL0N1cnJlbnRWYXJpYWJsZXNWaWV3LnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLHVDQUF1QztBQUN2Qyx5Q0FBeUM7QUFFekM7SUFNRTtRQUNFLElBQUksQ0FBQyxjQUFjLEdBQUcsQ0FDcEIsOEJBQU0sS0FBSyxFQUFDLGVBQWUsRUFBQyxLQUFLLEVBQUMsZ0JBQWdCLDRCQUUzQyxDQUNSLENBQUE7UUFDRCxJQUFJLENBQUMsSUFBSSxHQUFHLDRCQUFJLEtBQUssRUFBQyxZQUFZLEdBQUcsQ0FBQTtRQUNyQyxJQUFJLENBQUMsT0FBTyxHQUFHLENBQ2Isb0NBQVksS0FBSyxFQUFDLGFBQWEsRUFBQyxLQUFLLEVBQUMsUUFBUTtZQUM1Qyw2QkFBSyxLQUFLLEVBQUMsYUFBYTtnQkFDdEIsNkJBQUssS0FBSyxFQUFDLGVBQWU7b0JBQ3hCLHFEQUE2QjtvQkFDNUIsSUFBSSxDQUFDLGNBQWMsQ0FDaEI7Z0JBQ04sNkJBQUssS0FBSyxFQUFDLG1CQUFtQixJQUFFLElBQUksQ0FBQyxJQUFJLENBQU8sQ0FDNUMsQ0FDSyxDQUNkLENBQUE7UUFFRCxJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksU0FBUyxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsRUFBRSxDQUFDLENBQUE7UUFDaEQsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDLEtBQUssR0FBRyxDQUFDLEdBQUcsR0FBRyxFQUFFLEVBQUUsQ0FBQyxDQUFBO0lBQ3hELENBQUM7SUFFTSxLQUFLLENBQUMsTUFBTSxDQUFDLGFBQXVCLEVBQUUsbUJBQTRCO1FBRXZFLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztZQUM1QixJQUFJLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFBO1FBQzdDLENBQUM7UUFDRCxHQUFHLENBQUMsQ0FBQyxNQUFNLE9BQU8sSUFBSSxhQUFhLENBQUMsQ0FBQyxDQUFDO1lBQ3BDLElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLGdDQUFLLE9BQU8sQ0FBTSxDQUFDLENBQUE7UUFDM0MsQ0FBQztRQUVELEVBQUUsQ0FBQyxDQUFDLG1CQUFtQixDQUFDLENBQUMsQ0FBQztZQUN4QixJQUFJLENBQUMsY0FBYyxDQUFDLEtBQUssQ0FBQyxPQUFPLEdBQUcsUUFBUSxDQUFBO1FBQzlDLENBQUM7UUFBQyxJQUFJLENBQUMsQ0FBQztZQUNOLElBQUksQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDLE9BQU8sR0FBRyxNQUFNLENBQUE7UUFDNUMsQ0FBQztJQUNILENBQUM7SUFFTSxPQUFPO0lBRWQsQ0FBQztDQUNGO0FBaERELG9EQWdEQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBEcmFnZ2FibGUgPSByZXF1aXJlKCdkcmFnZ2FibGUnKVxuaW1wb3J0IFJlYWN0ID0gcmVxdWlyZSgnLi9SZWFjdFBvbHlmaWxsJylcblxuZXhwb3J0IGNsYXNzIEN1cnJlbnRWYXJpYWJsZXNWaWV3IHtcbiAgcHVibGljIGVsZW1lbnQ6IEhUTUxFbGVtZW50XG4gIHByaXZhdGUgZHJhZ2dhYmxlOiBEcmFnZ2FibGVcbiAgcHJpdmF0ZSBsaXN0OiBIVE1MRWxlbWVudFxuICBwcml2YXRlIGV4Y2VwdGlvblBhbmVsOiBIVE1MRWxlbWVudFxuXG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHRoaXMuZXhjZXB0aW9uUGFuZWwgPSAoXG4gICAgICA8c3BhbiBzdHlsZT1cImRpc3BsYXk6IG5vbmVcIiBjbGFzcz1cImVycm9yLW1lc3NhZ2VzXCI+XG4gICAgICAgIChQYXVzZWQgb24gZXhjZXB0aW9uKVxuICAgICAgPC9zcGFuPlxuICAgIClcbiAgICB0aGlzLmxpc3QgPSA8dWwgY2xhc3M9XCJsaXN0LWdyb3VwXCIgLz5cbiAgICB0aGlzLmVsZW1lbnQgPSAoXG4gICAgICA8YXRvbS1wYW5lbCBzdHlsZT1cInotaW5kZXg6IDEwXCIgY2xhc3M9XCJwYWRkZWRcIj5cbiAgICAgICAgPGRpdiBjbGFzcz1cImluc2V0LXBhbmVsXCI+XG4gICAgICAgICAgPGRpdiBjbGFzcz1cInBhbmVsLWhlYWRpbmdcIj5cbiAgICAgICAgICAgIDxzcGFuPkxvY2FsIFZhcmlhYmxlcyA8L3NwYW4+XG4gICAgICAgICAgICB7dGhpcy5leGNlcHRpb25QYW5lbH1cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8ZGl2IGNsYXNzPVwicGFuZWwtYm9keSBwYWRkZWRcIj57dGhpcy5saXN0fTwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvYXRvbS1wYW5lbD5cbiAgICApXG5cbiAgICB0aGlzLmRyYWdnYWJsZSA9IG5ldyBEcmFnZ2FibGUodGhpcy5lbGVtZW50LCB7fSlcbiAgICB0aGlzLmRyYWdnYWJsZS5zZXQoYXRvbS5nZXRTaXplKCkud2lkdGggLyAyICsgMjAwLCAzMClcbiAgfVxuXG4gIHB1YmxpYyBhc3luYyB1cGRhdGUobG9jYWxCaW5kaW5nczogc3RyaW5nW10sIGlzUGF1c2VkT25FeGNlcHRpb246IGJvb2xlYW4pIHtcbiAgICAvLyByZW1vdmUgYWxsIGxpc3QgZWxlbWVudHNcbiAgICB3aGlsZSAodGhpcy5saXN0LmZpcnN0Q2hpbGQpIHtcbiAgICAgIHRoaXMubGlzdC5yZW1vdmVDaGlsZCh0aGlzLmxpc3QuZmlyc3RDaGlsZClcbiAgICB9XG4gICAgZm9yIChjb25zdCBiaW5kaW5nIG9mIGxvY2FsQmluZGluZ3MpIHtcbiAgICAgIHRoaXMubGlzdC5hcHBlbmRDaGlsZCg8bGk+e2JpbmRpbmd9PC9saT4pXG4gICAgfVxuXG4gICAgaWYgKGlzUGF1c2VkT25FeGNlcHRpb24pIHtcbiAgICAgIHRoaXMuZXhjZXB0aW9uUGFuZWwuc3R5bGUuZGlzcGxheSA9ICdpbmxpbmUnXG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuZXhjZXB0aW9uUGFuZWwuc3R5bGUuZGlzcGxheSA9ICdub25lJ1xuICAgIH1cbiAgfVxuXG4gIHB1YmxpYyBkZXN0cm95KCkge1xuICAgIC8vIFRPRE86IG5vb3A/XG4gIH1cbn1cbiJdfQ==