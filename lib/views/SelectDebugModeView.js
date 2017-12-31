"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const SelectListView = require("atom-select-list");
const React = require("./ReactPolyfill");
async function selectDebugModeView(debugModes, activeItem) {
    let panel;
    let res;
    try {
        res = await new Promise((resolve) => {
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
}
exports.selectDebugModeView = selectDebugModeView;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU2VsZWN0RGVidWdNb2RlVmlldy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy92aWV3cy9TZWxlY3REZWJ1Z01vZGVWaWV3LnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLG1EQUFtRDtBQUNuRCx5Q0FBeUM7QUFVbEMsS0FBSyw4QkFBOEIsVUFBa0IsRUFBRSxVQUFrQjtJQUc5RSxJQUFJLEtBQXNELENBQUE7SUFDMUQsSUFBSSxHQUF1QixDQUFBO0lBQzNCLElBQUksQ0FBQztRQUNILEdBQUcsR0FBRyxNQUFNLElBQUksT0FBTyxDQUFxQixDQUFDLE9BQU8sRUFBRSxFQUFFO1lBQ3RELE1BQU0sTUFBTSxHQUFHLElBQUksY0FBYyxDQUFDO2dCQUNoQyxLQUFLLEVBQUUsVUFBVTtnQkFDakIsY0FBYyxFQUFFLENBQUMsYUFBYSxDQUFDO2dCQUMvQixjQUFjLEVBQUUsQ0FBQyxJQUFVLEVBQUUsRUFBRSxDQUFDLDRCQUFJLEtBQUssRUFBRSxJQUFJLENBQUMsS0FBSyxLQUFLLFVBQVUsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBTTtnQkFDN0csZ0JBQWdCLEVBQUUsQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxLQUFLO2dCQUN0QyxrQkFBa0IsRUFBRSxHQUFHLEVBQUU7b0JBQ3ZCLE9BQU8sRUFBRSxDQUFBO2dCQUNYLENBQUM7Z0JBQ0QsbUJBQW1CLEVBQUUsQ0FBQyxJQUFVLEVBQUUsRUFBRTtvQkFDbEMsT0FBTyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQTtnQkFDckIsQ0FBQzthQUNGLENBQUMsQ0FBQTtZQUNGLEtBQUssR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLGFBQWEsQ0FBQztnQkFDbkMsSUFBSSxFQUFFLE1BQU07Z0JBQ1osT0FBTyxFQUFFLElBQUk7YUFDZCxDQUFDLENBQUE7WUFDRixNQUFNLENBQUMsS0FBSyxFQUFFLENBQUE7UUFDaEIsQ0FBQyxDQUFDLENBQUE7SUFDSixDQUFDO1lBQVMsQ0FBQztRQUNULEtBQUssSUFBSSxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUE7SUFDMUIsQ0FBQztJQUNELE1BQU0sQ0FBQyxHQUFHLENBQUE7QUFDWixDQUFDO0FBN0JELGtEQTZCQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBTZWxlY3RMaXN0VmlldyA9IHJlcXVpcmUoJ2F0b20tc2VsZWN0LWxpc3QnKVxuaW1wb3J0IFJlYWN0ID0gcmVxdWlyZSgnLi9SZWFjdFBvbHlmaWxsJylcbmltcG9ydCBhdG9tQVBJID0gcmVxdWlyZSgnYXRvbScpXG5cbmludGVyZmFjZSBJdGVtIHtcbiAgdmFsdWU6IFZhbHVlc1xuICBkZXNjcmlwdGlvbjogc3RyaW5nXG59XG5cbnR5cGUgVmFsdWVzID0gJ25vbmUnIHwgJ2Vycm9ycycgfCAnZXhjZXB0aW9ucydcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHNlbGVjdERlYnVnTW9kZVZpZXcoZGVidWdNb2RlczogSXRlbVtdLCBhY3RpdmVJdGVtOiBzdHJpbmcpOiBQcm9taXNlPFZhbHVlcyB8IHVuZGVmaW5lZD4ge1xuICAvLyB0aGlzLnN0b3JlRm9jdXNlZEVsZW1lbnQoKVxuICAvLyB0aGlzLnNldEl0ZW1zKGRlYnVnTW9kZXMpXG4gIGxldCBwYW5lbDogYXRvbUFQSS5QYW5lbDxTZWxlY3RMaXN0VmlldzxJdGVtPj4gfCB1bmRlZmluZWRcbiAgbGV0IHJlczogVmFsdWVzIHwgdW5kZWZpbmVkXG4gIHRyeSB7XG4gICAgcmVzID0gYXdhaXQgbmV3IFByb21pc2U8VmFsdWVzIHwgdW5kZWZpbmVkPigocmVzb2x2ZSkgPT4ge1xuICAgICAgY29uc3Qgc2VsZWN0ID0gbmV3IFNlbGVjdExpc3RWaWV3KHtcbiAgICAgICAgaXRlbXM6IGRlYnVnTW9kZXMsXG4gICAgICAgIGl0ZW1zQ2xhc3NMaXN0OiBbJ21hcmstYWN0aXZlJ10sXG4gICAgICAgIGVsZW1lbnRGb3JJdGVtOiAoaXRlbTogSXRlbSkgPT4gPGxpIGNsYXNzPXtpdGVtLnZhbHVlID09PSBhY3RpdmVJdGVtID8gJ2FjdGl2ZScgOiAnJ30+e2l0ZW0uZGVzY3JpcHRpb259PC9saT4sXG4gICAgICAgIGZpbHRlcktleUZvckl0ZW06IChpdGVtKSA9PiBpdGVtLnZhbHVlLFxuICAgICAgICBkaWRDYW5jZWxTZWxlY3Rpb246ICgpID0+IHtcbiAgICAgICAgICByZXNvbHZlKClcbiAgICAgICAgfSxcbiAgICAgICAgZGlkQ29uZmlybVNlbGVjdGlvbjogKGl0ZW06IEl0ZW0pID0+IHtcbiAgICAgICAgICByZXNvbHZlKGl0ZW0udmFsdWUpXG4gICAgICAgIH0sXG4gICAgICB9KVxuICAgICAgcGFuZWwgPSBhdG9tLndvcmtzcGFjZS5hZGRNb2RhbFBhbmVsKHtcbiAgICAgICAgaXRlbTogc2VsZWN0LFxuICAgICAgICB2aXNpYmxlOiB0cnVlLFxuICAgICAgfSlcbiAgICAgIHNlbGVjdC5mb2N1cygpXG4gICAgfSlcbiAgfSBmaW5hbGx5IHtcbiAgICBwYW5lbCAmJiBwYW5lbC5kZXN0cm95KClcbiAgfVxuICByZXR1cm4gcmVzXG59XG4iXX0=