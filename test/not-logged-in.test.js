const test = require('node:test');
const assert = require('node:assert/strict');
const { diagnose } = require('../diagnose.js');

test('a forum 403 from the error panel is not an expired n8n login', () => {
  const report = diagnose({
    errorMessage: 'Forbidden - perhaps check your credentials?',
    errorDescription: 'You need to be logged in to do that.',
    errorDetails: {
      rawErrorMessage: ['403 - "{\\"errors\\":[\\"You need to be logged in to do that.\\"],\\"error_type\\":\\"not_logged_in\\"}"'],
      httpCode: '403',
    },
    n8nDetails: {
      nodeName: 'Read comment notifications',
      nodeType: 'n8n-nodes-base.httpRequest',
    },
  });
  assert.equal(report.cause, 'not_logged_in');
  assert.equal(report.node, 'Read comment notifications');
  assert.equal(report.apply, false);
  assert.doesNotMatch(report.summary, /reconnect that credential/i);
});
