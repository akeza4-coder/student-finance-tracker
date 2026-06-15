import { loadLocalLedger, saveLocalLedger, getSystemSettings, saveSystemSettings } from './storage.js';

let appState = {
  transactions: loadLocalLedger(),
  settings: getSystemSettings(),
  activeSearchQuery: null,
  sortField: 'date',
  sortOrder: 'desc'
};

export const StateManager = {
  getState: () => appState,
  
  addOrUpdateTransaction: (record) => {
    const idx = appState.transactions.findIndex(t => t.id === record.id);
    const timestamp = new Date().toISOString();
    
    if (idx !== -1) {
      // Execution path for modifications on existing models
      const original = appState.transactions[idx];
      appState.transactions[idx] = { ...original, ...record, updatedAt: timestamp };
    } else {
      // Pure data addition pipeline logic execution
      const newRecord = {
        ...record,
        id: `txn_${crypto.randomUUID ? crypto.randomUUID().split('-')[0] : Math.random().toString(36).substring(2,9)}`,
        createdAt: timestamp,
        updatedAt: timestamp
      };
      appState.transactions.push(newRecord);
    }
    saveLocalLedger(appState.transactions);
  },

  deleteTransaction: (id) => {
    appState.transactions = appState.transactions.filter(t => t.id !== id);
    saveLocalLedger(appState.transactions);
  },

  updateSettings: (newCap, newCurrency) => {
    appState.settings.budgetCap = parseFloat(newCap) || 500;
    appState.settings.currency = newCurrency || "USD";
    saveSystemSettings(appState.settings);
  },

  ingestImportedArray: (validatedArray) => {
    appState.transactions = validatedArray;
    saveLocalLedger(appState.transactions);
  },

  setSort: (field, order) => {
    appState.sortField = field;
    appState.sortOrder = order;
  },

  setSearchPattern: (regexObj) => {
    appState.activeSearchQuery = regexObj;
  }
};