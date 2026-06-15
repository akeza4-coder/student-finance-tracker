/**
 * Structural Domain Form Rules Core Engine Mapping
 */
export const FormRules = {
  // Description rule: forbids leading/trailing whitespace, forces space reduction collapse
  description: /^\S(?:.*\S)?$/,
  
  // Volume numeric quantification mapping logic rule
  amount: /^(0|[1-9]\d*)(\.\d{1,2})?$/,
  
  // High precision compliance execution ISO standard date layout
  date: /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/,
  
  // Continuous alphabetic strings with valid internal hyphenation or individual empty spacing
  category: /^[A-Za-z]+(?:[ -][A-Za-z]+)*$/,
  
  // ADVANCED PATTERN: Back-reference extraction to flag accidental sequential duplicated strings
  duplicateWords: /\b(\w+)\s+\1\b/i
};

export function runFieldDiagnostic(fieldKey, rawStringValue) {
  const stringified = String(rawStringValue).trim();
  
  if (!stringified) {
    return { valid: false, message: "Field cannot remain void." };
  }

  if (fieldKey === 'description') {
    if (!FormRules.description.test(rawStringValue)) {
      return { valid: false, message: "Invalid characters or spacing present." };
    }
    if (FormRules.duplicateWords.test(rawStringValue)) {
      return { valid: false, message: "Duplicate sequential tokens detected." };
    }
  } else if (fieldKey === 'amount') {
    if (!FormRules.amount.test(rawStringValue) || parseFloat(rawStringValue) <= 0) {
      return { valid: false, message: "Must be a positive value (up to 2 decimals)." };
    }
  } else if (fieldKey === 'date') {
    if (!FormRules.date.test(rawStringValue)) {
      return { valid: false, message: "Date format must adhere to YYYY-MM-DD." };
    }
  }

  return { valid: true, message: "" };
}