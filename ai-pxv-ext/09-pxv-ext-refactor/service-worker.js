const SHEET_URL = 'https://script.google.com/macros/s/AKfycbyD10xPFTq5hDtkR1Y2zHPEJbVfP7S_iQd3RscuMdxhGMrhQ0qjjQYk-NmTYwRw5pD_6w/exec'

class SheetDatabase {
  #webAppUrl
  #data = {};
  #loaded = false;

  // Controle de fila
  #isWriting = false;
  #writeQueue = {}; // { sheetName: { key: values } }
  #queuePromises = []; // resolves/rejects from put

  constructor(webAppUrl) {
    this.#webAppUrl = webAppUrl
    logToTabs('debug', 'SheetDatabase', '2.1.0', 'initialized')
  }

  get data() { return this.#data }
  get loaded() { return this.#loaded }

  async load() {
    logToTabs('info', 'SheetDatabase', 'loading data')
    try {
      const response = await fetch(this.#webAppUrl)
      if (!response.ok) throw new Error(`Error loading data: ${response.statusText}`)

      this.#data = await response.json()
      this.#loaded = true
      logToTabs('info', 'SheetDatabase', 'load OK!')
      return this.#data
    } catch (error) {
      logToTabs('error', 'SheetDatabase', 'load error!', error)
      this.#loaded = false
      throw error
    }
  }

  get(tab, key) {
    if (!this.#data[tab]) return undefined
    if (key === undefined) return this.#data[tab]
    return this.#data[tab][key]
  }

  async put(tab, key, valueObject = {}) {
    if (!this.#data[tab]) this.#data[tab] = {}

    const mergedRecord = { ...(this.#data[tab][key] || {}), ...valueObject }
    this.#data[tab][key] = mergedRecord

    return this.#enqueue(tab, [{ key, values: mergedRecord }])
  }

  async putMany(tab, items) {
    if (!this.#data[tab]) this.#data[tab] = {}

    const itemsToQueue = []

    items.forEach(({ key, values }) => {
      const mergedRecord = { ...(this.#data[tab][key] || {}), ...values }
      this.#data[tab][key] = mergedRecord
      itemsToQueue.push({ key, values: mergedRecord })
    })

    return this.#enqueue(tab, itemsToQueue)
  }

  getSheets() {
    return Object.keys(this.#data)
  }

  getSheetData(tab) {
    return this.#data[tab] || undefined
  }

  #enqueue(tab, items) {
    return new Promise((resolve, reject) => {
      if (!this.#writeQueue[tab]) this.#writeQueue[tab] = {}
      items.forEach(item => this.#writeQueue[tab][item.key] = item.values)
      this.#queuePromises.push({ resolve, reject })
      this.#processQueue()
    })
  }

  async #processQueue() {
    if (this.#isWriting) {
      logToTabs('debug', 'SheetDB-Queue', 'Already recording. Items added to queue.')
      return
    }

    const pendingTabs = Object.keys(this.#writeQueue)
    if (pendingTabs.length === 0) return

    this.#isWriting = true

    // Separa a fila atual da próxima fila
    // (itens que chegarem a partir de agora vão para o próximo lote)
    const currentBatch = this.#writeQueue
    const currentPromises = this.#queuePromises

    this.#writeQueue = {}
    this.#queuePromises = []

    logToTabs('debug', 'SheetDB-Queue', `Sending batch. Tabs: "${pendingTabs.join('", "')}"`)

    try {
      // O Google Apps Script atual exige a aba ("sheetName") na raiz do JSON.
      // Logo, enviamos um putMany para cada aba afetada neste lote.
      for (const tab of pendingTabs) {
        const keys = Object.keys(currentBatch[tab])
        const itemsPayload = keys.map(key => ({ key, values: currentBatch[tab][key] }))

        logToTabs('debug', 'SheetDB-Queue', `Sending putMany to tab "${tab}" with ${itemsPayload.length} records...`)

        const response = await fetch(this.#webAppUrl, {
          method: 'POST', mode: 'cors', redirect: 'follow',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ action: 'putMany', sheetName: tab, items: itemsPayload })
        })

        const resJson = await response.json()
        if (resJson.status !== "success") {
          throw new Error(resJson.message || "Unknown error batch saving.")
        }
        logToTabs('info', 'SheetDB-Queue', `Tab "${tab}" batch saved successfully!`)
      }

      // Resolve todas as chamadas de put/putMany que estavam aguardando esse lote
      currentPromises.forEach(p => p.resolve({ success: true }))

    } catch (error) {
      logToTabs('error', 'SheetDB-Queue', 'Critical error processing batch!', error)
      // Rejeita todas as promises que dependiam desse lote
      currentPromises.forEach(p => p.reject(error))
    } finally {
      this.#isWriting = false

      // Verifica se enquanto gravávamos chegaram novos itens na fila
      if (Object.keys(this.#writeQueue).length > 0) {
        logToTabs('debug', 'SheetDB-Queue', 'Triggering new batch due to new data arrival during current batch storage...')
        this.#processQueue()
      } else {
        logToTabs('debug', 'SheetDB-Queue', 'Empty queue. Waiting for more data.')
      }
    }
  }
}
const db = new SheetDatabase(SHEET_URL)
db.load()

// -------------------------------------------------------------

const listeners = {
  DB_LOAD: {
    isAsync: true,
    fn: (sendResponse) => db.load()
      .then(data => sendResponse({ success: true, data }))
      .catch(error => sendResponse({ success: false, error: error.message }))
  },
  DB_GET: {
    isAsync: false,
    fn: (sendResponse, x) => !db.loaded
      ? sendResponse({ success: false, error: 'DB not loaded' })
      : sendResponse({ success: true, data: db.get(x.tab, x.key) })
  },
  DB_PUT: {
    isAsync: true,
    fn: (sendResponse, x) => db.put(x.tab, x.key, x.valueObj)
      .then(res => sendResponse(res))
      .catch(error => sendResponse({ success: false, error: error.message }))
  },
  DB_PUT_MANY: {
    isAsync: true,
    fn: (sendResponse, x) => db.putMany(x.tab, x.items)
        .then(res => sendResponse(res))
        .catch(error => sendResponse({ success: false, error: error.message }))
  },
  DB_GET_SHEETS: {
    isAsync: false,
    fn: (sendResponse) => !db.loaded
      ? sendResponse({ success: false, error: 'DB not loaded' })
      : sendResponse({ success: true, data: db.getSheets() })
  },
  DB_GET_SHEET_DATA: {
    isAsync: false,
    fn: (sendResponse, x) => (!db.loaded)
      ? sendResponse({ success: false, error: 'DB not loaded' })
      : sendResponse({ success: true, data: db.getSheetData(x.tab) })
  }
}
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  const { action, payload } = request
  const { fn, isAsync } = listeners[action]
  fn(sendResponse, payload)
  return isAsync
})

// Type = 'info', 'success', 'warn', 'error'
async function logToTabs(type, ...message) {
  try {
    const tabs = await chrome.tabs.query({ url: '*://www.pixiv.net/*' })
    if (!tabs.length) console[type](...message)
    for (const tab of tabs) {
      chrome.tabs.sendMessage(tab.id, { action: 'PXTRA_LOG', data: { type, message } })
        .catch(() => console[type](...message))
    }
  } catch (err) {
    logToTabs('error', 'Error sending log:', err)
  }
}