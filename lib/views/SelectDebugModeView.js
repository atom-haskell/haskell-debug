"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
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
exports.selectDebugModeView = selectDebugModeView;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU2VsZWN0RGVidWdNb2RlVmlldy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9saWIvdmlld3MvU2VsZWN0RGVidWdNb2RlVmlldy50c3giXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQUFBLG1EQUFtRDtBQUNuRCx5Q0FBeUM7QUFVekMsNkJBQTBDLFVBQWtCLEVBQUUsVUFBa0I7O1FBRzlFLElBQUksS0FBc0QsQ0FBQTtRQUMxRCxJQUFJLEdBQXVCLENBQUE7UUFDM0IsSUFBSSxDQUFDO1lBQ0gsR0FBRyxHQUFHLE1BQU0sSUFBSSxPQUFPLENBQXFCLENBQUMsT0FBTyxFQUFFLE1BQU07Z0JBQzFELE1BQU0sTUFBTSxHQUFHLElBQUksY0FBYyxDQUFDO29CQUNoQyxLQUFLLEVBQUUsVUFBVTtvQkFDakIsY0FBYyxFQUFFLENBQUMsYUFBYSxDQUFDO29CQUUvQixjQUFjLEVBQUUsQ0FBQyxJQUFVLEtBQUssNEJBQUksS0FBSyxFQUFFLElBQUksQ0FBQyxLQUFLLEtBQUssVUFBVSxHQUFHLFFBQVEsR0FBRyxFQUFFLElBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBTTtvQkFDN0csZ0JBQWdCLEVBQUUsQ0FBQyxJQUFJLEtBQUssSUFBSSxDQUFDLEtBQUs7b0JBQ3RDLGtCQUFrQixFQUFFO3dCQUNsQixPQUFPLEVBQUUsQ0FBQTtvQkFDWCxDQUFDO29CQUNELG1CQUFtQixFQUFFLENBQUMsSUFBVTt3QkFDOUIsT0FBTyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQTtvQkFDckIsQ0FBQztpQkFDRixDQUFDLENBQUE7Z0JBQ0YsS0FBSyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsYUFBYSxDQUFDO29CQUNuQyxJQUFJLEVBQUUsTUFBTTtvQkFDWixPQUFPLEVBQUUsSUFBSTtpQkFDZCxDQUFDLENBQUE7Z0JBQ0YsTUFBTSxDQUFDLEtBQUssRUFBRSxDQUFBO1lBQ2hCLENBQUMsQ0FBQyxDQUFBO1FBQ0osQ0FBQztnQkFBUyxDQUFDO1lBQ1QsS0FBSyxJQUFJLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQTtRQUMxQixDQUFDO1FBQ0QsTUFBTSxDQUFDLEdBQUcsQ0FBQTtJQUNaLENBQUM7Q0FBQTtBQTlCRCxrREE4QkMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgU2VsZWN0TGlzdFZpZXcgPSByZXF1aXJlKCdhdG9tLXNlbGVjdC1saXN0JylcbmltcG9ydCBSZWFjdCA9IHJlcXVpcmUoJy4vUmVhY3RQb2x5ZmlsbCcpXG5pbXBvcnQgYXRvbUFQSSA9IHJlcXVpcmUoJ2F0b20nKVxuXG5pbnRlcmZhY2UgSXRlbSB7XG4gIHZhbHVlOiBWYWx1ZXNcbiAgZGVzY3JpcHRpb246IHN0cmluZ1xufVxuXG50eXBlIFZhbHVlcyA9ICdub25lJyB8ICdlcnJvcnMnIHwgJ2V4Y2VwdGlvbnMnXG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBzZWxlY3REZWJ1Z01vZGVWaWV3KGRlYnVnTW9kZXM6IEl0ZW1bXSwgYWN0aXZlSXRlbTogc3RyaW5nKTogUHJvbWlzZTxWYWx1ZXMgfCB1bmRlZmluZWQ+IHtcbiAgLy8gdGhpcy5zdG9yZUZvY3VzZWRFbGVtZW50KClcbiAgLy8gdGhpcy5zZXRJdGVtcyhkZWJ1Z01vZGVzKVxuICBsZXQgcGFuZWw6IGF0b21BUEkuUGFuZWw8U2VsZWN0TGlzdFZpZXc8SXRlbT4+IHwgdW5kZWZpbmVkXG4gIGxldCByZXM6IFZhbHVlcyB8IHVuZGVmaW5lZFxuICB0cnkge1xuICAgIHJlcyA9IGF3YWl0IG5ldyBQcm9taXNlPFZhbHVlcyB8IHVuZGVmaW5lZD4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgY29uc3Qgc2VsZWN0ID0gbmV3IFNlbGVjdExpc3RWaWV3KHtcbiAgICAgICAgaXRlbXM6IGRlYnVnTW9kZXMsXG4gICAgICAgIGl0ZW1zQ2xhc3NMaXN0OiBbJ21hcmstYWN0aXZlJ10sXG4gICAgICAgIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTpuby11bnNhZmUtYW55XG4gICAgICAgIGVsZW1lbnRGb3JJdGVtOiAoaXRlbTogSXRlbSkgPT4gPGxpIGNsYXNzPXtpdGVtLnZhbHVlID09PSBhY3RpdmVJdGVtID8gJ2FjdGl2ZScgOiAnJ30+e2l0ZW0uZGVzY3JpcHRpb259PC9saT4sXG4gICAgICAgIGZpbHRlcktleUZvckl0ZW06IChpdGVtKSA9PiBpdGVtLnZhbHVlLFxuICAgICAgICBkaWRDYW5jZWxTZWxlY3Rpb246ICgpID0+IHtcbiAgICAgICAgICByZXNvbHZlKClcbiAgICAgICAgfSxcbiAgICAgICAgZGlkQ29uZmlybVNlbGVjdGlvbjogKGl0ZW06IEl0ZW0pID0+IHtcbiAgICAgICAgICByZXNvbHZlKGl0ZW0udmFsdWUpXG4gICAgICAgIH0sXG4gICAgICB9KVxuICAgICAgcGFuZWwgPSBhdG9tLndvcmtzcGFjZS5hZGRNb2RhbFBhbmVsKHtcbiAgICAgICAgaXRlbTogc2VsZWN0LFxuICAgICAgICB2aXNpYmxlOiB0cnVlLFxuICAgICAgfSlcbiAgICAgIHNlbGVjdC5mb2N1cygpXG4gICAgfSlcbiAgfSBmaW5hbGx5IHtcbiAgICBwYW5lbCAmJiBwYW5lbC5kZXN0cm95KClcbiAgfVxuICByZXR1cm4gcmVzXG59XG4iXX0=