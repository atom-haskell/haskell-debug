"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const SelectListView = require("atom-select-list");
const React = require("./ReactPolyfill");
function selectDebugModeView(debugModes, activeItem) {
    return __awaiter(this, void 0, void 0, function* () {
        let panel;
        let res;
        try {
            res = yield new Promise((resolve, reject) => {
                const select = new SelectListView({
                    items: debugModes,
                    itemsClassList: ['mark-active'],
                    elementForItem: (item) => React.createElement("li", { class: item.value === activeItem ? 'active' : '' }, item.description),
                    filterKeyForItem: (item) => item.value,
                    didCancelSelection: () => {
                        resolve();
                    },
                    didConfirmSelection: (item) => {
                        resolve(item.value);
                    }
                });
                panel = atom.workspace.addModalPanel({
                    item: select,
                    visible: true
                });
                select.focus();
            });
        }
        finally {
            panel && panel.destroy();
        }
        return res;
    });
}
module.exports = selectDebugModeView;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU2VsZWN0RGVidWdNb2RlVmlldy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9saWIvdmlld3MvU2VsZWN0RGVidWdNb2RlVmlldy50c3giXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUEsbURBQW1EO0FBQ25ELHlDQUF5QztBQVF6Qyw2QkFBb0MsVUFBa0IsRUFBRSxVQUFrQjs7UUFHdEUsSUFBSSxLQUFnQyxDQUFBO1FBQ3BDLElBQUksR0FBdUIsQ0FBQTtRQUMzQixJQUFJLENBQUM7WUFDSCxHQUFHLEdBQUcsTUFBTSxJQUFJLE9BQU8sQ0FBbUIsQ0FBQyxPQUFPLEVBQUUsTUFBTTtnQkFDeEQsTUFBTSxNQUFNLEdBQUcsSUFBSSxjQUFjLENBQUM7b0JBQ2hDLEtBQUssRUFBRSxVQUFVO29CQUNqQixjQUFjLEVBQUUsQ0FBQyxhQUFhLENBQUM7b0JBQy9CLGNBQWMsRUFBRSxDQUFDLElBQVUsS0FBSyw0QkFBSSxLQUFLLEVBQUUsSUFBSSxDQUFDLEtBQUssS0FBSyxVQUFVLEdBQUcsUUFBUSxHQUFHLEVBQUUsSUFBRyxJQUFJLENBQUMsV0FBVyxDQUFNO29CQUM3RyxnQkFBZ0IsRUFBRSxDQUFDLElBQUksS0FBSyxJQUFJLENBQUMsS0FBSztvQkFDdEMsa0JBQWtCLEVBQUU7d0JBQ2xCLE9BQU8sRUFBRSxDQUFBO29CQUNYLENBQUM7b0JBQ0QsbUJBQW1CLEVBQUUsQ0FBQyxJQUFVO3dCQUM5QixPQUFPLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFBO29CQUNyQixDQUFDO2lCQUNGLENBQUMsQ0FBQTtnQkFDRixLQUFLLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxhQUFhLENBQUM7b0JBQ25DLElBQUksRUFBRSxNQUFNO29CQUNaLE9BQU8sRUFBRSxJQUFJO2lCQUNkLENBQUMsQ0FBQTtnQkFDRixNQUFNLENBQUMsS0FBSyxFQUFFLENBQUE7WUFDaEIsQ0FBQyxDQUFDLENBQUE7UUFDSixDQUFDO2dCQUFTLENBQUM7WUFDVCxLQUFLLElBQUksS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFBO1FBQzFCLENBQUM7UUFDRCxNQUFNLENBQUMsR0FBRyxDQUFBO0lBQ2QsQ0FBQztDQUFBO0FBRUQsaUJBQVMsbUJBQW1CLENBQUEiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgU2VsZWN0TGlzdFZpZXcgPSByZXF1aXJlKCdhdG9tLXNlbGVjdC1saXN0JylcbmltcG9ydCBSZWFjdCA9IHJlcXVpcmUoJy4vUmVhY3RQb2x5ZmlsbCcpXG5pbXBvcnQgYXRvbUFQSSA9IHJlcXVpcmUoJ2F0b20nKVxuXG5pbnRlcmZhY2UgSXRlbSB7XG4gICAgdmFsdWU6IHN0cmluZ1xuICAgIGRlc2NyaXB0aW9uOiBzdHJpbmdcbn1cblxuYXN5bmMgZnVuY3Rpb24gc2VsZWN0RGVidWdNb2RlVmlldyAoZGVidWdNb2RlczogSXRlbVtdLCBhY3RpdmVJdGVtOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZyB8IHVuZGVmaW5lZD4ge1xuICAgIC8vIHRoaXMuc3RvcmVGb2N1c2VkRWxlbWVudCgpXG4gICAgLy8gdGhpcy5zZXRJdGVtcyhkZWJ1Z01vZGVzKVxuICAgIGxldCBwYW5lbDogYXRvbUFQSS5QYW5lbCB8IHVuZGVmaW5lZFxuICAgIGxldCByZXM6IHN0cmluZyB8IHVuZGVmaW5lZFxuICAgIHRyeSB7XG4gICAgICByZXMgPSBhd2FpdCBuZXcgUHJvbWlzZTxzdHJpbmd8dW5kZWZpbmVkPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIGNvbnN0IHNlbGVjdCA9IG5ldyBTZWxlY3RMaXN0Vmlldyh7XG4gICAgICAgICAgaXRlbXM6IGRlYnVnTW9kZXMsXG4gICAgICAgICAgaXRlbXNDbGFzc0xpc3Q6IFsnbWFyay1hY3RpdmUnXSxcbiAgICAgICAgICBlbGVtZW50Rm9ySXRlbTogKGl0ZW06IEl0ZW0pID0+IDxsaSBjbGFzcz17aXRlbS52YWx1ZSA9PT0gYWN0aXZlSXRlbSA/ICdhY3RpdmUnIDogJyd9PntpdGVtLmRlc2NyaXB0aW9ufTwvbGk+LFxuICAgICAgICAgIGZpbHRlcktleUZvckl0ZW06IChpdGVtKSA9PiBpdGVtLnZhbHVlLFxuICAgICAgICAgIGRpZENhbmNlbFNlbGVjdGlvbjogKCkgPT4ge1xuICAgICAgICAgICAgcmVzb2x2ZSgpXG4gICAgICAgICAgfSxcbiAgICAgICAgICBkaWRDb25maXJtU2VsZWN0aW9uOiAoaXRlbTogSXRlbSkgPT4ge1xuICAgICAgICAgICAgcmVzb2x2ZShpdGVtLnZhbHVlKVxuICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgICAgcGFuZWwgPSBhdG9tLndvcmtzcGFjZS5hZGRNb2RhbFBhbmVsKHtcbiAgICAgICAgICBpdGVtOiBzZWxlY3QsXG4gICAgICAgICAgdmlzaWJsZTogdHJ1ZVxuICAgICAgICB9KVxuICAgICAgICBzZWxlY3QuZm9jdXMoKVxuICAgICAgfSlcbiAgICB9IGZpbmFsbHkge1xuICAgICAgcGFuZWwgJiYgcGFuZWwuZGVzdHJveSgpXG4gICAgfVxuICAgIHJldHVybiByZXNcbn1cblxuZXhwb3J0ID0gc2VsZWN0RGVidWdNb2RlVmlld1xuIl19