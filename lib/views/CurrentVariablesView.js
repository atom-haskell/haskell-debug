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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ3VycmVudFZhcmlhYmxlc1ZpZXcuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvdmlld3MvQ3VycmVudFZhcmlhYmxlc1ZpZXcudHN4Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsdUNBQXVDO0FBQ3ZDLHlDQUF5QztBQUV6QztJQU1FO1FBQ0UsSUFBSSxDQUFDLGNBQWMsR0FBRyw4QkFBTSxLQUFLLEVBQUMsZUFBZSxFQUFDLEtBQUssRUFBQyxnQkFBZ0IsNEJBQTZCLENBQUE7UUFDckcsSUFBSSxDQUFDLElBQUksR0FBRyw0QkFBSSxLQUFLLEVBQUMsWUFBWSxHQUFHLENBQUE7UUFDckMsSUFBSSxDQUFDLE9BQU8sR0FBRyxDQUNiLG9DQUFZLEtBQUssRUFBQyxhQUFhLEVBQUMsS0FBSyxFQUFDLFFBQVE7WUFDNUMsNkJBQUssS0FBSyxFQUFDLGFBQWE7Z0JBQ3RCLDZCQUFLLEtBQUssRUFBQyxlQUFlO29CQUN4QixxREFBNkI7b0JBQzVCLElBQUksQ0FBQyxjQUFjLENBQ2hCO2dCQUNOLDZCQUFLLEtBQUssRUFBQyxtQkFBbUIsSUFDM0IsSUFBSSxDQUFDLElBQUksQ0FDTixDQUNGLENBQ0ssQ0FDZCxDQUFBO1FBRUQsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLFNBQVMsQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLEVBQUUsQ0FBQyxDQUFBO1FBQ2hELElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxHQUFHLEdBQUcsRUFBRSxFQUFFLENBQUMsQ0FBQTtJQUN4RCxDQUFDO0lBRU0sS0FBSyxDQUFDLE1BQU0sQ0FBQyxhQUF1QixFQUFFLG1CQUE0QjtRQUV2RSxPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7WUFDNUIsSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQTtRQUM3QyxDQUFDO1FBQ0QsR0FBRyxDQUFDLENBQUMsTUFBTSxPQUFPLElBQUksYUFBYSxDQUFDLENBQUMsQ0FBQztZQUNwQyxJQUFJLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FDbkIsZ0NBQUssT0FBTyxDQUFNLENBQ25CLENBQUE7UUFDSCxDQUFDO1FBRUQsRUFBRSxDQUFDLENBQUMsbUJBQW1CLENBQUMsQ0FBQyxDQUFDO1lBQ3hCLElBQUksQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDLE9BQU8sR0FBRyxRQUFRLENBQUE7UUFDOUMsQ0FBQztRQUFDLElBQUksQ0FBQyxDQUFDO1lBQ04sSUFBSSxDQUFDLGNBQWMsQ0FBQyxLQUFLLENBQUMsT0FBTyxHQUFHLE1BQU0sQ0FBQTtRQUM1QyxDQUFDO0lBQ0gsQ0FBQztJQUVNLE9BQU87SUFFZCxDQUFDO0NBQ0Y7QUFoREQsb0RBZ0RDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IERyYWdnYWJsZSA9IHJlcXVpcmUoJ2RyYWdnYWJsZScpXG5pbXBvcnQgUmVhY3QgPSByZXF1aXJlKCcuL1JlYWN0UG9seWZpbGwnKVxuXG5leHBvcnQgY2xhc3MgQ3VycmVudFZhcmlhYmxlc1ZpZXcge1xuICBwdWJsaWMgZWxlbWVudDogSFRNTEVsZW1lbnRcbiAgcHJpdmF0ZSBkcmFnZ2FibGU6IERyYWdnYWJsZVxuICBwcml2YXRlIGxpc3Q6IEhUTUxFbGVtZW50XG4gIHByaXZhdGUgZXhjZXB0aW9uUGFuZWw6IEhUTUxFbGVtZW50XG5cbiAgY29uc3RydWN0b3IoKSB7XG4gICAgdGhpcy5leGNlcHRpb25QYW5lbCA9IDxzcGFuIHN0eWxlPVwiZGlzcGxheTogbm9uZVwiIGNsYXNzPVwiZXJyb3ItbWVzc2FnZXNcIj4oUGF1c2VkIG9uIGV4Y2VwdGlvbik8L3NwYW4+XG4gICAgdGhpcy5saXN0ID0gPHVsIGNsYXNzPVwibGlzdC1ncm91cFwiIC8+XG4gICAgdGhpcy5lbGVtZW50ID0gKFxuICAgICAgPGF0b20tcGFuZWwgc3R5bGU9XCJ6LWluZGV4OiAxMFwiIGNsYXNzPVwicGFkZGVkXCI+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJpbnNldC1wYW5lbFwiPlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJwYW5lbC1oZWFkaW5nXCI+XG4gICAgICAgICAgICA8c3Bhbj5Mb2NhbCBWYXJpYWJsZXMgPC9zcGFuPlxuICAgICAgICAgICAge3RoaXMuZXhjZXB0aW9uUGFuZWx9XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPGRpdiBjbGFzcz1cInBhbmVsLWJvZHkgcGFkZGVkXCI+XG4gICAgICAgICAgICB7dGhpcy5saXN0fVxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvYXRvbS1wYW5lbD5cbiAgICApXG5cbiAgICB0aGlzLmRyYWdnYWJsZSA9IG5ldyBEcmFnZ2FibGUodGhpcy5lbGVtZW50LCB7fSlcbiAgICB0aGlzLmRyYWdnYWJsZS5zZXQoYXRvbS5nZXRTaXplKCkud2lkdGggLyAyICsgMjAwLCAzMClcbiAgfVxuXG4gIHB1YmxpYyBhc3luYyB1cGRhdGUobG9jYWxCaW5kaW5nczogc3RyaW5nW10sIGlzUGF1c2VkT25FeGNlcHRpb246IGJvb2xlYW4pIHtcbiAgICAvLyByZW1vdmUgYWxsIGxpc3QgZWxlbWVudHNcbiAgICB3aGlsZSAodGhpcy5saXN0LmZpcnN0Q2hpbGQpIHtcbiAgICAgIHRoaXMubGlzdC5yZW1vdmVDaGlsZCh0aGlzLmxpc3QuZmlyc3RDaGlsZClcbiAgICB9XG4gICAgZm9yIChjb25zdCBiaW5kaW5nIG9mIGxvY2FsQmluZGluZ3MpIHtcbiAgICAgIHRoaXMubGlzdC5hcHBlbmRDaGlsZChcbiAgICAgICAgPGxpPntiaW5kaW5nfTwvbGk+LFxuICAgICAgKVxuICAgIH1cblxuICAgIGlmIChpc1BhdXNlZE9uRXhjZXB0aW9uKSB7XG4gICAgICB0aGlzLmV4Y2VwdGlvblBhbmVsLnN0eWxlLmRpc3BsYXkgPSAnaW5saW5lJ1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmV4Y2VwdGlvblBhbmVsLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSdcbiAgICB9XG4gIH1cblxuICBwdWJsaWMgZGVzdHJveSgpIHtcbiAgICAvLyBUT0RPOiBub29wP1xuICB9XG59XG4iXX0=