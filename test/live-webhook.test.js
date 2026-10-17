const test = require('node:test');
const assert = require('node:assert/strict');
const { diagnose } = require('../diagnose.js');

test('an inactive production webhook is unpublished, not a test url', () => {
  const report = diagnose({
    calledUrl: 'http://127.0.0.1:5678/webhook/hexorbit-evidence-intake',
    execution: {
      status: 'error',
      data: {
        resultData: {
          error: {
            message: 'The requested webhook "POST hexorbit-evidence-intake" is not registered. The workflow must be active for a production URL to run successfully.',
          },
        },
      },
    },
  });
  assert.equal(report.cause, 'unpublished');
  assert.equal(report.apply, false);
});
