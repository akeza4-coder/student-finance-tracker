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
    const index = appState.transactions.findIndex(t => t.id === record.id);
    const now = new Date().toISOString();
    
    if (index !== -1) {
      appState.transactions[index] = { ...appState.transactions[index], ...record, updatedAt: now };
    } else {
      appState.transactions.push({
        ...record,
        id: 'item_' + Math.random().toString(36).substring(2, 9),
        createdAt: now,
        updatedAt: now
      });
    }
    saveLocalLedger(appState.transactions);
  },

  deleteTransaction: (id) => {
    appState.transactions = appState.transactions.filter(t => t.id !== id);
    saveLocalLedger(appState.transactions);
  },

  updateSettings: (newCap, newCurrency) => {
    appState.settings.budgetCap = parseFloat(newCap) || 50000;
    appState.settings.currency = newCurrency || "RWF";
    saveSystemSettings(appState.settings);
  },

  ingestImportedArray: (array) => {
    appState.transactions = array;
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