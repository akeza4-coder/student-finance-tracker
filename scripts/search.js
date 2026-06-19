export function compileSafeRegex(input, flags = 'i') {
  if (!input) return null;
  try {
    return new RegExp(input, flags);
  } catch (e) {
    throw new Error(e.message);
  }
}

export function executeHighlightMark(text, regex) {
  const standardString = String(text);
  if (!regex) return standardString;
  regex.lastIndex = 0; 
  return standardString.replace(regex, match => `<mark>${match}</mark>`);
}