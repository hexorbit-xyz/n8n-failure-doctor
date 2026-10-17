const test = require('node:test');
const assert = require('node:assert/strict');
const { diagnose } = require('../diagnose.js');

test('an Error Trigger payload names the failed node and the cause', () => {
  const report = diagnose({
    execution: {
      id: '231',
      url: 'https://n8n.example.com/execution/231',
      error: { message: 'Authorization failed - please check your credentials', stack: 'Stacktrace' },
      lastNodeExecuted: 'OpenAI',
      mode: 'manual',
    },
    workflow: { id: '1', name: 'Example Workflow' },
  });
  assert.equal(report.cause, 'expired_auth');
  assert.equal(report.node, 'OpenAI');
  assert.equal(report.apply, false);
});

test('a trigger-node failure still uses the error message', () => {
  const report = diagnose({
    trigger: {
      error: {
        name: 'WorkflowActivationError',
        message: 'Credential with ID "catalog-example-id" does not exist for type "smtp".',
        node: { name: 'Send Email' },
      },
      mode: 'trigger',
    },
    workflow: { id: '2', name: 'Activation' },
  });
  assert.equal(report.cause, 'missing_credential');
  assert.equal(report.node, 'Send Email');
  assert.equal(report.summary.includes('catalog-example-id'), false);
  assert.equal(report.apply, false);
});
