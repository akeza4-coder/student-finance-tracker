export const FormRules = {
  description: /^\S(?:.*\S)?$/,
  amount: /^(0|[1-9]\d*)(\.\d{1,2})?$/,
  date: /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/,
  category: /^[A-Za-z]+(?:[ -][A-Za-z]+)*$/,
  duplicateWords: /\b(\w+)\s+\1\b/i
};

export function runFieldDiagnostic(fieldKey, rawValue) {
  const trimmedStringValue = String(rawValue).trim();
  if (!trimmedStringValue) { return { valid: false, message: "This field cannot be left blank." }; }

  if (fieldKey === 'description') {
    if (!FormRules.description.test(rawValue)) { return { valid: false, message: "Invalid spacing or characters typed." }; }
    if (FormRules.duplicateWords.test(rawValue)) { return { valid: false, message: "Warning: You typed a duplicate word by accident." }; }
  } else if (fieldKey === 'amount') {
    if (!FormRules.amount.test(rawValue) || parseFloat(rawValue) <= 0) { return { valid: false, message: "Please enter a valid amount greater than zero." }; }
  } else if (fieldKey === 'date') {
    if (!FormRules.date.test(rawValue)) { return { valid: false, message: "Please enter a valid calendar date." }; }
  }
  return { valid: true, message: "" };
}