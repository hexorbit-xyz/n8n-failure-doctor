const rows = [
  {
    id: 'n8n-401-wording',
    cause: 'expired_auth',
    source: 'Staging synthetic 401. No live key.',
    sentence: 'Authorization failed - please check your credentials',
    fix: 'Reconnect that credential in n8n.',
    paste: {
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
    },
  },
  {
    id: 'forum-missing-credential',
    cause: 'missing_credential',
    source: 'https://community.n8n.io/t/credential-with-id-xxxxx-does-not-exist-for-type-xxxxx/123863',
    sentence: 'Credential with ID … does not exist for type "redis".',
    fix: 'Open the node and pick a credential this instance actually has.',
    mustNotEcho: 'catalog-example-id',
    paste: {
      errorMessage: 'Credential with ID "catalog-example-id" does not exist for type "redis".',
    },
  },
  {
    id: 'forum-out-of-memory',
    cause: 'out_of_memory',
    source: 'https://community.n8n.io/t/error-workflow-did-not-finish-possible-out-of-memory-issue/141326',
    sentence: 'n8n may have run out of memory while running this execution.',
    fix: 'Raise the container memory or split the payload. Do not rerun the same load.',
    paste: {
      execution: {
        status: 'error',
        data: {
          resultData: {
            error: { message: 'n8n may have run out of memory while running this execution.' },
          },
        },
      },
    },
  },
  {
    id: 'staging-unpublished-webhook',
    cause: 'unpublished',
    source: 'Staging production URL. Workflow left inactive.',
    sentence: 'The workflow must be active for a production URL to run successfully.',
    fix: 'Publish the workflow in n8n. This page will not do that.',
    paste: {
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
    },
  },
  {
    id: 'staging-test-webhook',
    cause: 'test_webhook',
    source: 'Staging test URL.',
    sentence: 'In test mode, the webhook only works for one call after you click this button.',
    fix: 'Click Execute workflow, then call the test URL once.',
    paste: {
      calledUrl: 'http://127.0.0.1:5678/webhook-test/hexorbit-evidence-intake',
      execution: {
        status: 'error',
        data: {
          resultData: {
            error: {
              message: 'The requested webhook "hexorbit-evidence-intake" is not registered. Click the Execute workflow button on the canvas, then try again. (In test mode, the webhook only works for one call after you click this button)',
            },
          },
        },
      },
    },
  },
  {
    id: 'manual-only',
    cause: 'click_never_schedule',
    source: 'A workflow whose only trigger is manual.',
    sentence: 'No runtime error. The only trigger is manual.',
    fix: 'Add a schedule or webhook if it is supposed to run on its own.',
    paste: {
      workflow: {
        active: true,
        nodes: [{ name: 'When clicking', type: 'n8n-nodes-base.manualTrigger' }],
      },
    },
  },
  {
    id: 'unfamiliar',
    cause: 'unknown',
    source: 'Held back on purpose. A new sentence must stay unknown.',
    sentence: 'ECONNREFUSED 10.0.0.8:5432',
    fix: 'The page does not guess. Read the failed node in n8n.',
    paste: {
      execution: {
        status: 'error',
        data: { resultData: { error: { message: 'ECONNREFUSED 10.0.0.8:5432' } } },
      },
    },
  },
  {
    id: 'error-trigger-401',
    cause: 'expired_auth',
    source: 'n8n Error Trigger payload. https://docs.n8n.io/integrations/core-nodes/n8n-nodes-base.errortrigger',
    sentence: 'Authorization failed - please check your credentials',
    fix: 'Reconnect that credential in n8n.',
    paste: {
      execution: {
        id: '231',
        error: { message: 'Authorization failed - please check your credentials', stack: 'Stacktrace' },
        lastNodeExecuted: 'OpenAI',
        mode: 'manual',
      },
      workflow: { id: '1', name: 'Example Workflow' },
    },
  },
  {
    id: 'error-trigger-activation',
    cause: 'missing_credential',
    source: 'n8n Error Trigger payload when the trigger node itself fails.',
    sentence: 'Credential with ID … does not exist for type "redis".',
    fix: 'Open the node and pick a credential this instance actually has.',
    mustNotEcho: 'catalog-example-id',
    paste: {
      trigger: {
        error: {
          name: 'WorkflowActivationError',
          message: 'Credential with ID "catalog-example-id" does not exist for type "smtp".',
          node: { name: 'Send Email' },
        },
        mode: 'trigger',
      },
      workflow: { id: '2', name: 'Activation' },
    },
  },
  {
    id: 'forum-not-logged-in',
    cause: 'not_logged_in',
    source: 'Staging run on Community mention check. Error panel copy.',
    sentence: 'You need to be logged in to do that.',
    fix: 'Add that site\'s login on the HTTP node, or stop calling a private URL.',
    paste: {
      errorMessage: 'Forbidden - perhaps check your credentials?',
      errorDescription: 'You need to be logged in to do that.',
      errorDetails: { httpCode: '403' },
      n8nDetails: { nodeName: 'Read comment notifications' },
    },
  },
];

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { rows };
}
if (typeof window !== 'undefined') {
  window.N8nCatalog = { rows };
}
