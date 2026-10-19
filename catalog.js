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
    source: 'Held back on purpose. https://community.n8n.io/t/321544',
    sentence: 'Error: Failed to receive response',
    fix: 'The page does not guess. Read the failed node in n8n.',
    paste: { errorMessage: 'Error: Failed to receive response' },
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

// Rows taken from public community.n8n.io posts. The paste defaults to the
// sentence itself as the error message; pass a paste when the shape differs.
const forumRow = (slug, cause, topic, sentence, fix, paste) => ({
  id: `forum-${slug}`,
  cause,
  source: `https://community.n8n.io/t/${topic}`,
  sentence,
  fix,
  paste: paste || { errorMessage: sentence },
});

rows.push(
  forumRow('quota', 'quota_exceeded', 308453, '429 Too Many Requests — You exceeded your current quota.', 'Waiting will not help. Check the plan, billing, or quota of that service.'),
  forumRow('rate', 'rate_limited', 316212, 'The service is receiving too many requests from you', 'Send fewer per minute: smaller batches with a Wait node, the HTTP Request Batching option, or Retry On Fail with a wait.', { errorMessage: '429 Rate limit exceeded', errorDescription: 'The service is receiving too many requests from you' }),
  forumRow('bot', 'bot_protection', 322046, '403 Forbidden – Cloudflare Attention Required', 'The site blocks automated callers. Use its official API or ask the owner to allow your n8n address.'),
  forumRow('oauth', 'oauth_redirect', 313928, 'Grant failed: Invalid redirect_uri: not registered for this client', 'Make the Redirect URL on the n8n credential match the one registered at the provider exactly.'),
  forumRow('ssl', 'ssl_certificate', 125485, 'unable to verify the first certificate', 'Install a valid certificate on the target server. Only for hosts you control, use Ignore SSL Issues on the HTTP Request node.'),
  forumRow('code-return', 'code_return_shape', 137170, 'Code doesn\'t return items properly', 'Return an array of objects shaped like [{ json: { ... } }].'),
  forumRow('ref-node', 'referenced_node', 185150, 'Referenced node is unexecuted', 'Check the node name in the expression, and that node runs before this one on the same path.'),
  forumRow('paired', 'paired_item', 317807, 'Paired item data could not be resolved', 'Refer to the earlier node with $(\'Node name\').first() or .all(), or keep pairedItem in Code output.', { errorMessage: 'ExpressionError: Paired item data could not be resolved' }),
  forumRow('undefined', 'undefined_field', 317564, 'Cannot read properties of undefined (reading \'json\')', 'Check the earlier node actually returned items and the field name matches. Guard with ?. in Code nodes.'),
  forumRow('js', 'js_error', 81167, 'axios is not defined [line 5]', 'Fix the line named in the error. This page cannot read your code.'),
  forumRow('tool-schema', 'tool_schema_mismatch', 316371, 'Received tool input did not match expected schema', 'Simplify or describe the AI tool\'s input fields so the model fills them correctly.'),
  forumRow('runner', 'runner_unresponsive', 314100, 'Task execution aborted because runner became unresponsive.', 'Split the data into smaller batches or give the host more memory.'),
  forumRow('no-response', 'no_webhook_response', 307499, 'The workflow did not return a response', 'Make every path reach a Respond to Webhook node, or respond immediately from the Webhook node.'),
  forumRow('data-table', 'data_table_limit', 322205, 'Data table size limit exceeded: 50MB used, limit is 50MB', 'Delete rows you no longer need, or store the data elsewhere.'),
  forumRow('url', 'invalid_url', 311727, 'Failed to parse URL from [object Request]', 'Check the URL starts with https:// and that any expression in it resolved to a value.', { errorMessage: 'TypeError: Failed to parse URL from [object Request]' }),
  forumRow('404', 'not_found', 158630, 'The resource you are requesting could not be found', 'Check the URL and ID in the node. Try the same request in a browser or curl.'),
  forumRow('400', 'bad_request', 315909, '400 Bad request', 'Read the description field of the error in n8n. It usually names the rejected parameter.'),
  forumRow('5xx', 'server_error', 317348, '502 Bad Gateway', 'The other service failed. Turn on Retry On Fail and try later.'),
  forumRow('refused', 'connection_refused', 221262, 'The service refused the connection - perhaps it is offline', 'Check host and port and that the service runs. In Docker, localhost is the n8n container itself.'),
  forumRow('reset', 'connection_reset', 314953, 'ECONNRESET: Client network socket disconnected before a secure TLS connection was established', 'Turn on Retry On Fail. If it repeats, check the other service and any proxy or firewall.', { errorMessage: 'ECONNRESET', errorDescription: 'Client network socket disconnected before a secure TLS connection was established' }),
  forumRow('dns', 'host_not_found', 314105, 'getaddrinfo ENOTFOUND', 'Check the domain spelling and that this n8n can resolve it.'),
  forumRow('timeout', 'timeout', 246217, 'The connection timed out', 'Turn on Retry On Fail, raise the node timeout, or ask for less per call.'),
  forumRow('forbidden', 'forbidden', 308924, 'Forbidden - perhaps check your credentials?', 'The sign-in worked but this action is not allowed. Check permissions and scopes, IP allow-lists, and the error description.'),
  forumRow('webhook-not-registered', 'webhook_not_registered', 316928, 'The requested webhook "GET …/webhook" is not registered.', 'Check which URL was called. /webhook-test/ needs Execute workflow clicked. /webhook/ needs the workflow published.', { errorMessage: 'The requested webhook "GET xxxxxxxx/webhook" is not registered.' }),
  forumRow('task-runner', 'task_runner_timeout', 309689, 'Task request timed out. Your Code node task was not matched to a runner within the timeout period', 'Retry once. If every Code node fails, this is on the n8n side: check the status page or contact support.', { errorMessage: 'Task request timed out' }),
  forumRow('code-timeout', 'code_node_timeout', 306079, 'Task execution timed out after 300 seconds', 'Process fewer items per run, split the work with Loop Over Items, or simplify the code.', { errorMessage: 'Error: Task execution timed out after 300 seconds' }),
  forumRow('db-locked', 'database_locked', 307886, 'Error: database is locked', 'Stop whatever else uses the database file, or move n8n to Postgres. On n8n Cloud, contact support.'),
  forumRow('db-connect', 'database_connect_timeout', 311994, 'timeout exceeded when trying to connect', 'Check the database is up, reachable from n8n, and not out of connections.'),
  forumRow('meta-verify', 'meta_webhook_verify', 309513, 'The callback URL or verify token couldn\'t be validated.', 'Use the callback URL n8n shows, publish the workflow, and match the verify token exactly.'),
);

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { rows };
}
if (typeof window !== 'undefined') {
  window.N8nCatalog = { rows };
}
