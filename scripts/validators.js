// This file checks that the inputs aren't empty before saving
function runFieldDiagnostic(fieldName, value) {
  if (!value || value.trim() === '') {
    return { valid: false, message: 'This field is required.' };
  }
  if (fieldName === 'amount' && (isNaN(value) || parseFloat(value) <= 0)) {
    return { valid: false, message: 'Please enter a valid amount above 0.' };
  }
  return { valid: true, message: '' };
}