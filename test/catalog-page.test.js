const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { rows } = require('../catalog.js');

test('the catalog page lists every known sentence and does not offer to apply a fix', () => {
  const page = fs.readFileSync(path.join(__dirname, '..', 'catalog.html'), 'utf8');
  const box = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  assert.match(box, /catalog\.html/);
  assert.match(page, /will not change the workflow/i);
  for (const row of rows) {
    assert.match(page, new RegExp(row.cause));
    assert.match(page, new RegExp(row.sentence.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});
