// This file handles saving data to the browser's local memory
const StateManager = {
  storageKey: 'student_finance_records',

  getState() {
    const rawData = localStorage.getItem(this.storageKey);
    if (!rawData) {
      return {
        transactions: [],
        settings: { currency: 'RWF', budgetCap: 50000, categories: ["Food", "Housing", "Transport", "Books", "Other"] },
        activeSearchQuery: null
      };
    }
    const parsed = JSON.parse(rawData);
    parsed.activeSearchQuery = null; // reset search on load
    return parsed;
  },

  saveState(state) {
    const clone = { ...state };
    delete clone.activeSearchQuery; // don't save raw regex objects
    localStorage.setItem(this.storageKey, JSON.stringify(clone));
  },

  addOrUpdateTransaction(record) {
    const state = this.getState();
    const index = state.transactions.findIndex(t => t.id === record.id);
    
    if (index !== -1) {
      state.transactions[index] = record;
    } else {
      state.transactions.push(record);
    }
    
    this.saveState(state);
  },

  deleteTransaction(id) {
    const state = this.getState();
    state.transactions = state.transactions.filter(t => t.id !== id);
    this.saveState(state);
  },

  updateSettings(budgetCap, currency) {
    const state = this.getState();
    state.settings.budgetCap = parseFloat(budgetCap) || 50000;
    state.settings.currency = currency || 'RWF';
    this.saveState(state);
  },

  setSearchPattern(regex) {
    // Temporary runtime storage, not saved to localStorage
    window.currentSearchRegex = regex;
  }
};

function validateIncomingJSON(data) {
  return Array.isArray(data) && data.every(item => item.id && item.description && item.amount);
}