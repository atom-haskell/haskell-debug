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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ3VycmVudFZhcmlhYmxlc1ZpZXcuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvdmlld3MvQ3VycmVudFZhcmlhYmxlc1ZpZXcudHN4Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBLHVDQUF3QztBQUV4Qyx5Q0FBMEM7QUFHMUM7SUFNVSxNQUFNLENBQUMsYUFBdUIsRUFBRSxtQkFBNEI7O1lBRTlELE9BQU0sSUFBSSxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUMsQ0FBQztnQkFDeEIsSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUNoRCxDQUFDO1lBQ0QsR0FBRyxDQUFBLENBQUMsSUFBSSxPQUFPLElBQUksYUFBYSxDQUFDLENBQUEsQ0FBQztnQkFDOUIsSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQ2pCLGdDQUNLLE9BQU8sQ0FDUCxDQUNSLENBQUE7WUFDTCxDQUFDO1lBRUQsRUFBRSxDQUFBLENBQUMsbUJBQW1CLENBQUMsQ0FBQSxDQUFDO2dCQUNwQixJQUFJLENBQUMsY0FBYyxDQUFDLEtBQUssQ0FBQyxPQUFPLEdBQUcsUUFBUSxDQUFDO1lBQ2pELENBQUM7WUFDRCxJQUFJLENBQUEsQ0FBQztnQkFDRCxJQUFJLENBQUMsY0FBYyxDQUFDLEtBQUssQ0FBQyxPQUFPLEdBQUcsTUFBTSxDQUFDO1lBQy9DLENBQUM7UUFDTCxDQUFDO0tBQUE7SUFFRCxPQUFPO0lBRVAsQ0FBQztJQUVEO1FBQ0ksSUFBSSxDQUFDLE9BQU87WUFDWixvQ0FBWSxLQUFLLEVBQUMsYUFBYSxFQUFDLEtBQUssRUFBQyxRQUFRO2dCQUMxQyw2QkFBSyxLQUFLLEVBQUMsYUFBYTtvQkFDcEIsNkJBQUssS0FBSyxFQUFDLGVBQWU7d0JBQ3RCLHFEQUE2Qjt3QkFDNUIsSUFBSSxDQUFDLGNBQWMsR0FBRyw4QkFBTSxLQUFLLEVBQUMsZUFBZSxFQUFDLEtBQUssRUFBQyxnQkFBZ0IsNEJBQTZCLENBQ3BHO29CQUNOLDZCQUFLLEtBQUssRUFBQyxtQkFBbUIsSUFDekIsSUFBSSxDQUFDLElBQUksR0FBRyw0QkFBSSxLQUFLLEVBQUMsWUFBWSxHQUFNLENBQ3ZDLENBQ0osQ0FDRyxDQUFDO1FBRWQsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLFNBQVMsQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQ2pELElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsbUJBQW1CLEVBQUUsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsR0FBRyxFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBQ3BGLENBQUM7Q0FDSjtBQUVELGlCQUFTLG9CQUFvQixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IERyYWdnYWJsZSA9IHJlcXVpcmUoXCJkcmFnZ2FibGVcIik7XG5pbXBvcnQgYXRvbUFQSSA9IHJlcXVpcmUoXCJhdG9tXCIpO1xuaW1wb3J0IFJlYWN0ID0gcmVxdWlyZShcIi4vUmVhY3RQb2x5ZmlsbFwiKTtcbmltcG9ydCBIaWdobGlnaHRzID0gcmVxdWlyZShcImhpZ2hsaWdodHNcIik7XG5cbmNsYXNzIEN1cnJlbnRWYXJpYWJsZXNWaWV3IHtcbiAgICBlbGVtZW50OiBIVE1MRWxlbWVudDtcbiAgICBwcml2YXRlIGRyYWdnYWJsZTogRHJhZ2dhYmxlO1xuICAgIHByaXZhdGUgbGlzdDogSFRNTEVsZW1lbnQ7XG4gICAgcHJpdmF0ZSBleGNlcHRpb25QYW5lbDogSFRNTEVsZW1lbnQ7XG5cbiAgICBhc3luYyB1cGRhdGUobG9jYWxCaW5kaW5nczogc3RyaW5nW10sIGlzUGF1c2VkT25FeGNlcHRpb246IGJvb2xlYW4pe1xuICAgICAgICAvLyByZW1vdmUgYWxsIGxpc3QgZWxlbWVudHNcbiAgICAgICAgd2hpbGUodGhpcy5saXN0LmZpcnN0Q2hpbGQpe1xuICAgICAgICAgICAgdGhpcy5saXN0LnJlbW92ZUNoaWxkKHRoaXMubGlzdC5maXJzdENoaWxkKTtcbiAgICAgICAgfVxuICAgICAgICBmb3IodmFyIGJpbmRpbmcgb2YgbG9jYWxCaW5kaW5ncyl7XG4gICAgICAgICAgICB0aGlzLmxpc3QuYXBwZW5kQ2hpbGQoXG4gICAgICAgICAgICAgICAgPGxpPlxuICAgICAgICAgICAgICAgICAgICB7YmluZGluZ31cbiAgICAgICAgICAgICAgICA8L2xpPlxuICAgICAgICAgICAgKVxuICAgICAgICB9XG5cbiAgICAgICAgaWYoaXNQYXVzZWRPbkV4Y2VwdGlvbil7XG4gICAgICAgICAgICB0aGlzLmV4Y2VwdGlvblBhbmVsLnN0eWxlLmRpc3BsYXkgPSBcImlubGluZVwiO1xuICAgICAgICB9XG4gICAgICAgIGVsc2V7XG4gICAgICAgICAgICB0aGlzLmV4Y2VwdGlvblBhbmVsLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGRlc3Ryb3koKXtcblxuICAgIH1cblxuICAgIGNvbnN0cnVjdG9yKCl7XG4gICAgICAgIHRoaXMuZWxlbWVudCA9XG4gICAgICAgIDxhdG9tLXBhbmVsIHN0eWxlPVwiei1pbmRleDogMTBcIiBjbGFzcz1cInBhZGRlZFwiPlxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cImluc2V0LXBhbmVsXCI+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInBhbmVsLWhlYWRpbmdcIj5cbiAgICAgICAgICAgICAgICAgICAgPHNwYW4+TG9jYWwgVmFyaWFibGVzIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAge3RoaXMuZXhjZXB0aW9uUGFuZWwgPSA8c3BhbiBzdHlsZT1cImRpc3BsYXk6IG5vbmVcIiBjbGFzcz1cImVycm9yLW1lc3NhZ2VzXCI+KFBhdXNlZCBvbiBleGNlcHRpb24pPC9zcGFuPn1cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwicGFuZWwtYm9keSBwYWRkZWRcIj5cbiAgICAgICAgICAgICAgICAgICAge3RoaXMubGlzdCA9IDx1bCBjbGFzcz0nbGlzdC1ncm91cCc+PC91bD59XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9hdG9tLXBhbmVsPjtcblxuICAgICAgICB0aGlzLmRyYWdnYWJsZSA9IG5ldyBEcmFnZ2FibGUodGhpcy5lbGVtZW50LCB7fSk7XG4gICAgICAgIHRoaXMuZHJhZ2dhYmxlLnNldChhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVUZXh0RWRpdG9yKClbXCJ3aWR0aFwiXSAvIDIgKyAyMDAsIDMwKTtcbiAgICB9XG59XG5cbmV4cG9ydCA9IEN1cnJlbnRWYXJpYWJsZXNWaWV3O1xuIl19