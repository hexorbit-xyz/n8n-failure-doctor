const test = require('node:test');
const assert = require('node:assert/strict');
const { diagnose } = require('../diagnose.js');

test('names the node when Google auth has expired and does not echo the token', () => {
  const report = diagnose({
    workflow: { active: true, nodes: [{ name: 'Gmail', type: 'n8n-nodes-base.gmail' }] },
    execution: {
      status: 'error',
      data: {
        resultData: {
          lastNodeExecuted: 'Gmail',
          error: {
            message: '401 invalid_grant',
            node: { name: 'Gmail' },
          },
          runData: {
            Gmail: [{
              executionStatus: 'error',
              error: { message: 'invalid_grant access_token=ya29.secret-token' },
            }],
          },
        },
      },
    },
  });

  assert.equal(report.cause, 'expired_auth');
  assert.equal(report.node, 'Gmail');
  assert.equal(report.confident, true);
  assert.equal(report.apply, false);
  assert.doesNotMatch(JSON.stringify(report), /ya29/);
});
