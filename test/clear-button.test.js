const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('clear empties the paste box and hides the last note', () => {
  const page = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  assert.match(page, /id="clear"[\s\S]*getElementById\('raw'\)\.value = ''[\s\S]*getElementById\('out'\)\.hidden = true[\s\S]*getElementById\('err'\)\.hidden = true/);
});
