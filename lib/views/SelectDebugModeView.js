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
                    },
                });
                panel = atom.workspace.addModalPanel({
                    item: select,
                    visible: true,
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU2VsZWN0RGVidWdNb2RlVmlldy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9saWIvdmlld3MvU2VsZWN0RGVidWdNb2RlVmlldy50c3giXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUEsbURBQW1EO0FBQ25ELHlDQUF5QztBQVF6Qyw2QkFBbUMsVUFBa0IsRUFBRSxVQUFrQjs7UUFHdkUsSUFBSSxLQUFnQyxDQUFBO1FBQ3BDLElBQUksR0FBdUIsQ0FBQTtRQUMzQixJQUFJLENBQUM7WUFDSCxHQUFHLEdBQUcsTUFBTSxJQUFJLE9BQU8sQ0FBcUIsQ0FBQyxPQUFPLEVBQUUsTUFBTTtnQkFDMUQsTUFBTSxNQUFNLEdBQUcsSUFBSSxjQUFjLENBQUM7b0JBQ2hDLEtBQUssRUFBRSxVQUFVO29CQUNqQixjQUFjLEVBQUUsQ0FBQyxhQUFhLENBQUM7b0JBQy9CLGNBQWMsRUFBRSxDQUFDLElBQVUsS0FBSyw0QkFBSSxLQUFLLEVBQUUsSUFBSSxDQUFDLEtBQUssS0FBSyxVQUFVLEdBQUcsUUFBUSxHQUFHLEVBQUUsSUFBRyxJQUFJLENBQUMsV0FBVyxDQUFNO29CQUM3RyxnQkFBZ0IsRUFBRSxDQUFDLElBQUksS0FBSyxJQUFJLENBQUMsS0FBSztvQkFDdEMsa0JBQWtCLEVBQUU7d0JBQ2xCLE9BQU8sRUFBRSxDQUFBO29CQUNYLENBQUM7b0JBQ0QsbUJBQW1CLEVBQUUsQ0FBQyxJQUFVO3dCQUM5QixPQUFPLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFBO29CQUNyQixDQUFDO2lCQUNGLENBQUMsQ0FBQTtnQkFDRixLQUFLLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxhQUFhLENBQUM7b0JBQ25DLElBQUksRUFBRSxNQUFNO29CQUNaLE9BQU8sRUFBRSxJQUFJO2lCQUNkLENBQUMsQ0FBQTtnQkFDRixNQUFNLENBQUMsS0FBSyxFQUFFLENBQUE7WUFDaEIsQ0FBQyxDQUFDLENBQUE7UUFDSixDQUFDO2dCQUFTLENBQUM7WUFDVCxLQUFLLElBQUksS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFBO1FBQzFCLENBQUM7UUFDRCxNQUFNLENBQUMsR0FBRyxDQUFBO0lBQ1osQ0FBQztDQUFBO0FBRUQsaUJBQVMsbUJBQW1CLENBQUEiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgU2VsZWN0TGlzdFZpZXcgPSByZXF1aXJlKCdhdG9tLXNlbGVjdC1saXN0JylcbmltcG9ydCBSZWFjdCA9IHJlcXVpcmUoJy4vUmVhY3RQb2x5ZmlsbCcpXG5pbXBvcnQgYXRvbUFQSSA9IHJlcXVpcmUoJ2F0b20nKVxuXG5pbnRlcmZhY2UgSXRlbSB7XG4gIHZhbHVlOiBzdHJpbmdcbiAgZGVzY3JpcHRpb246IHN0cmluZ1xufVxuXG5hc3luYyBmdW5jdGlvbiBzZWxlY3REZWJ1Z01vZGVWaWV3KGRlYnVnTW9kZXM6IEl0ZW1bXSwgYWN0aXZlSXRlbTogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmcgfCB1bmRlZmluZWQ+IHtcbiAgLy8gdGhpcy5zdG9yZUZvY3VzZWRFbGVtZW50KClcbiAgLy8gdGhpcy5zZXRJdGVtcyhkZWJ1Z01vZGVzKVxuICBsZXQgcGFuZWw6IGF0b21BUEkuUGFuZWwgfCB1bmRlZmluZWRcbiAgbGV0IHJlczogc3RyaW5nIHwgdW5kZWZpbmVkXG4gIHRyeSB7XG4gICAgcmVzID0gYXdhaXQgbmV3IFByb21pc2U8c3RyaW5nIHwgdW5kZWZpbmVkPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICBjb25zdCBzZWxlY3QgPSBuZXcgU2VsZWN0TGlzdFZpZXcoe1xuICAgICAgICBpdGVtczogZGVidWdNb2RlcyxcbiAgICAgICAgaXRlbXNDbGFzc0xpc3Q6IFsnbWFyay1hY3RpdmUnXSxcbiAgICAgICAgZWxlbWVudEZvckl0ZW06IChpdGVtOiBJdGVtKSA9PiA8bGkgY2xhc3M9e2l0ZW0udmFsdWUgPT09IGFjdGl2ZUl0ZW0gPyAnYWN0aXZlJyA6ICcnfT57aXRlbS5kZXNjcmlwdGlvbn08L2xpPixcbiAgICAgICAgZmlsdGVyS2V5Rm9ySXRlbTogKGl0ZW0pID0+IGl0ZW0udmFsdWUsXG4gICAgICAgIGRpZENhbmNlbFNlbGVjdGlvbjogKCkgPT4ge1xuICAgICAgICAgIHJlc29sdmUoKVxuICAgICAgICB9LFxuICAgICAgICBkaWRDb25maXJtU2VsZWN0aW9uOiAoaXRlbTogSXRlbSkgPT4ge1xuICAgICAgICAgIHJlc29sdmUoaXRlbS52YWx1ZSlcbiAgICAgICAgfSxcbiAgICAgIH0pXG4gICAgICBwYW5lbCA9IGF0b20ud29ya3NwYWNlLmFkZE1vZGFsUGFuZWwoe1xuICAgICAgICBpdGVtOiBzZWxlY3QsXG4gICAgICAgIHZpc2libGU6IHRydWUsXG4gICAgICB9KVxuICAgICAgc2VsZWN0LmZvY3VzKClcbiAgICB9KVxuICB9IGZpbmFsbHkge1xuICAgIHBhbmVsICYmIHBhbmVsLmRlc3Ryb3koKVxuICB9XG4gIHJldHVybiByZXNcbn1cblxuZXhwb3J0ID0gc2VsZWN0RGVidWdNb2RlVmlld1xuIl19