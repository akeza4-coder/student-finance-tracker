export function compileSafeRegex(rawString, flags = 'i') {
  if (!rawString) return null;
  try {
    return new RegExp(rawString, flags);
  } catch (e) {
    throw new Error(e.message);
  }
}

export function executeHighlightMark(targetText, compiledRegex) {
  const textString = String(targetText);
  if (!compiledRegex) return textString;
  
  // Resets lastIndex state on global regular expression configurations
  compiledRegex.lastIndex = 0; 
  return textString.replace(compiledRegex, match => `<mark>${match}</mark>`);
}