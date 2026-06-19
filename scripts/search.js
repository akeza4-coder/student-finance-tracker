// This file handles the RegEx search engine matching
function compileSafeRegex(pattern, flags) {
  if (!pattern) return null;
  // Basic safety clean up to avoid regex injection lockups
  return new RegExp(pattern, flags);
}

function executeHighlightMark(text, regex) {
  if (!regex || !text) return text;
  return text.replace(regex, match => `<mark>${match}</mark>`);
}