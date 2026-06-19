const STORAGE_KEY_DATA = 'student:tracker:expenses';
const STORAGE_KEY_CONFIG = 'student:tracker:settings';

export const initialCategories = ["Food", "Books", "Transport", "Entertainment", "Fees", "Other"];

export function getSystemSettings() {
  const defaultSettings = { budgetCap: 50000, currency: "RWF", categories: initialCategories };
  try {
    const data = localStorage.getItem(STORAGE_KEY_CONFIG);
    return data ? JSON.parse(data) : defaultSettings;
  } catch {
    return defaultSettings;
  }
}

export function saveSystemSettings(settings) {
  localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(settings));
}

export function loadLocalLedger() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY_DATA) || '[]');
  } catch {
    return [];
  }
}

export function saveLocalLedger(ledgerArray) {
  localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(ledgerArray));
}

export function validateIncomingJSON(payload) {
  if (!Array.isArray(payload)) return false;
  return payload.every(item => {
    return (
      typeof item.id === 'string' &&
      typeof item.description === 'string' &&
      typeof item.amount === 'number' &&
      typeof item.category === 'string' &&
      /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(item.date) &&
      typeof item.createdAt === 'string' &&
      typeof item.updatedAt === 'string'
    );
  });
}