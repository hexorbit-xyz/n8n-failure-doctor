const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('the page explains the limit with the three guide images', () => {
  const page = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  assert.match(page, /does not fix JSON/);
  assert.match(page, /images\/paste\.svg/);
  assert.match(page, /images\/match\.svg/);
  assert.match(page, /images\/you-fix\.svg/);
  assert.doesNotMatch(page, /I don’t know|I don't know/);
});
