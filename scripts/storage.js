const METRIC_STORAGE_KEY = 'apex:finance:ledger';
const CONFIG_STORAGE_KEY = 'apex:finance:settings';

export const initialCategories = ["Food", "Books", "Transport", "Entertainment", "Fees", "Other"];

export function getSystemSettings() {
  const defaults = { budgetCap: 500, currency: "USD", categories: initialCategories };
  try {
    const data = localStorage.getItem(CONFIG_STORAGE_KEY);
    return data ? JSON.parse(data) : defaults;
  } catch {
    return defaults;
  }
}

export function saveSystemSettings(settings) {
  localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(settings));
}

export function loadLocalLedger() {
  try {
    return JSON.parse(localStorage.getItem(METRIC_STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

export function saveLocalLedger(ledgerArray) {
  localStorage.setItem(METRIC_STORAGE_KEY, JSON.stringify(ledgerArray));
}

export function validateIncomingJSON(payload) {
  if (!Array.isArray(payload)) return false;
  
  // High-fidelity integrity scanning of fields inside the schema runtime
  return payload.every(record => {
    return (
      typeof record.id === 'string' &&
      typeof record.description === 'string' &&
      typeof record.amount === 'number' &&
      typeof record.category === 'string' &&
      /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(record.date) &&
      typeof record.createdAt === 'string' &&
      typeof record.updatedAt === 'string'
    );
  });
}