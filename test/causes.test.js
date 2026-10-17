const test = require('node:test');
const assert = require('node:assert/strict');
const { diagnose } = require('../diagnose.js');

test('flags an inactive workflow that has a webhook', () => {
  const report = diagnose({
    workflow: {
      active: false,
      nodes: [{ name: 'Evidence Webhook', type: 'n8n-nodes-base.webhook', parameters: { path: 'evidence' } }],
    },
  });
  assert.equal(report.cause, 'unpublished');
  assert.equal(report.apply, false);
  assert.equal(report.confident, true);
});

test('flags a test webhook url', () => {
  const report = diagnose({
    workflow: { active: true, nodes: [{ name: 'Hook', type: 'n8n-nodes-base.webhook' }] },
    execution: {
      status: 'error',
      data: {
        resultData: {
          error: { message: 'The requested webhook is not registered', node: { name: 'Hook' } },
        },
      },
    },
    calledUrl: 'https://n8n.example/webhook-test/evidence',
  });
  assert.equal(report.cause, 'test_webhook');
  assert.equal(report.node, 'Hook');
});

test('flags the host running out of memory', () => {
  const report = diagnose({
    execution: {
      status: 'error',
      data: {
        resultData: {
          error: { message: 'JavaScript heap out of memory', node: { name: 'Code' } },
        },
      },
    },
  });
  assert.equal(report.cause, 'out_of_memory');
  assert.equal(report.node, 'Code');
});

test('says it does not know when the workflow only runs if you click it', () => {
  const report = diagnose({
    workflow: {
      active: true,
      nodes: [{ name: 'Manual Test', type: 'n8n-nodes-base.manualTrigger' }],
    },
    execution: { status: 'success', mode: 'manual' },
  });
  assert.equal(report.cause, 'click_never_schedule');
  assert.equal(report.confident, false);
  assert.match(report.summary, /don’t know|do not know|never run on its own/i);
});

test('says it does not know for an unfamiliar error', () => {
  const report = diagnose({
    execution: {
      status: 'error',
      data: { resultData: { error: { message: 'something novel happened', node: { name: 'X' } } } },
    },
  });
  assert.equal(report.cause, 'unknown');
  assert.equal(report.confident, false);
  assert.match(report.summary, /don’t know|do not know/i);
});

test('strips a credential sitting in the workflow before it can be echoed', () => {
  const report = diagnose({
    workflow: {
      active: true,
      nodes: [{
        name: 'HTTP',
        type: 'n8n-nodes-base.httpRequest',
        parameters: { headerParameters: { api_key: 'sk-live-secret-value' } },
      }],
    },
    execution: {
      status: 'error',
      data: { resultData: { error: { message: '401 unauthorized api_key=sk-live-secret-value', node: { name: 'HTTP' } } } },
    },
  });
  assert.equal(report.cause, 'expired_auth');
  assert.doesNotMatch(JSON.stringify(report), /sk-live/);
});
