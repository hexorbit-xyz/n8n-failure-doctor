const MAX_TEXT = 5000;

function asText(raw) {
  return { mode: 'text', value: { errorMessage: raw.slice(0, MAX_TEXT) } };
}

// Reads what a person pasted. JSON is passed through. Anything that does not
// look like JSON is read as the error sentence itself. Broken JSON is refused:
// this page does not repair it and does not guess what it meant.
function parseInput(input) {
  const raw = String(input == null ? '' : input).trim();
  if (!raw) return { mode: 'error', message: 'Paste an error first.' };

  const looksLikeJson = raw[0] === '{' || /^\[\s*[\[\]{"\d\-tfn]/.test(raw);
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    if (looksLikeJson) return { mode: 'error', message: 'That is not JSON. This page does not repair JSON.' };
    return asText(raw);
  }
  if (parsed === null) return { mode: 'error', message: 'Paste an error first.' };
  if (typeof parsed === 'object') return { mode: 'json', value: parsed };
  return asText(String(parsed));
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { parseInput };
}
if (typeof window !== 'undefined') {
  window.N8nParseInput = { parseInput };
}
