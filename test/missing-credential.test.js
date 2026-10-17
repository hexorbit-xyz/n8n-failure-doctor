const test = require('node:test');
const assert = require('node:assert/strict');
const { diagnose } = require('../diagnose.js');

test('a credential id this instance does not have is not an expired login', () => {
  const report = diagnose({
    errorMessage: 'Credential with ID "EnXWG1D4uATtPECh" does not exist for type "redis".',
    n8nDetails: { n8nVersion: '1.84.3 (Self Hosted)' },
  });
  assert.equal(report.cause, 'missing_credential');
  assert.equal(report.apply, false);
  assert.equal(report.summary.includes('EnXWG1D4uATtPECh'), false);
});
