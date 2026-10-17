const test = require('node:test');
const assert = require('node:assert/strict');
const { diagnose } = require('../diagnose.js');

test('n8n 401 wording is expired auth even without a separate http code', () => {
  const report = diagnose({
    execution: {
      status: 'error',
      data: {
        resultData: {
          lastNodeExecuted: 'Expect 401',
          error: {
            message: 'Authorization failed - please check your credentials',
            node: { name: 'Expect 401' },
          },
        },
      },
    },
  });
  assert.equal(report.cause, 'expired_auth');
  assert.equal(report.node, 'Expect 401');
  assert.equal(report.apply, false);
});
