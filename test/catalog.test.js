const test = require('node:test');
const assert = require('node:assert/strict');
const { diagnose } = require('../diagnose.js');
const { rows } = require('../catalog.js');

test('every catalog row names the cause it claims, and never applies a fix', () => {
  assert.ok(rows.length >= 6);
  for (const row of rows) {
    const report = diagnose(row.paste);
    assert.equal(report.cause, row.cause, row.id);
    assert.equal(report.apply, false, row.id);
    if (row.mustNotEcho) {
      assert.equal(report.summary.includes(row.mustNotEcho), false, row.id);
    }
  }
});
