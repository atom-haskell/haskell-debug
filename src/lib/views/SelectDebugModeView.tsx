import SelectListView = require('atom-select-list')
import React = require('./ReactPolyfill')
import atomAPI = require('atom')

interface Item {
  value: string
  description: string
}

async function selectDebugModeView(debugModes: Item[], activeItem: string): Promise<string | undefined> {
  // this.storeFocusedElement()
  // this.setItems(debugModes)
  let panel: atomAPI.Panel | undefined
  let res: string | undefined
  try {
    res = await new Promise<string | undefined>((resolve, reject) => {
      const select = new SelectListView({
        items: debugModes,
        itemsClassList: ['mark-active'],
        elementForItem: (item: Item) => <li class={item.value === activeItem ? 'active' : ''}>{item.description}</li>,
        filterKeyForItem: (item) => item.value,
        didCancelSelection: () => {
          resolve()
        },
        didConfirmSelection: (item: Item) => {
          resolve(item.value)
        },
      })
      panel = atom.workspace.addModalPanel({
        item: select,
        visible: true,
      })
      select.focus()
    })
  } finally {
    panel && panel.destroy()
  }
  return res
}

export = selectDebugModeView
