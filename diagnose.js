const SECRET = /(?:bearer\s+)?(?:ya29|sk-|xox[baprs]-)[a-z0-9._\-]+|access_token=[^\s&"]+|api[_-]?key["']?\s*[:=]\s*["']?[^"'\s,}]+/gi;

function stripSecrets(value) {
  return String(value).replace(SECRET, '[stripped]');
}

function resultOf(input) {
  return input.execution?.data?.resultData || input.data?.resultData || {};
}

function errorText(input) {
  const result = resultOf(input);
  const bits = [];
  if (result.error) bits.push(result.error.message, result.error.errorMessage, result.error.description, result.error.name);
  if (input.errorMessage) bits.push(input.errorMessage);
  if (input.errorDescription) bits.push(input.errorDescription);
  if (input.errorDetails) bits.push(input.errorDetails.httpCode, ...(input.errorDetails.rawErrorMessage || []));
  if (input.execution?.errorMessage) bits.push(input.execution.errorMessage);
  if (input.execution?.error) bits.push(input.execution.error.message, input.execution.error.description);
  if (input.trigger?.error) bits.push(input.trigger.error.message, input.trigger.error.cause?.message);
  for (const runs of Object.values(result.runData || {})) {
    for (const run of runs || []) {
      if (run?.error) bits.push(run.error.message, run.error.description, run.error.httpCode);
    }
  }
  return bits.filter(Boolean).join(' ');
}

function failedNode(input) {
  const result = resultOf(input);
  if (result.error?.node?.name) return result.error.node.name;
  if (result.lastNodeExecuted) return result.lastNodeExecuted;
  for (const [name, runs] of Object.entries(result.runData || {})) {
    if ((runs || []).some((run) => run.executionStatus === 'error' || run.error)) return name;
  }
  if (input.execution?.lastNodeExecuted) return input.execution.lastNodeExecuted;
  if (input.trigger?.error?.node?.name) return input.trigger.error.node.name;
  if (input.n8nDetails?.nodeName) return input.n8nDetails.nodeName;
  return null;
}

function workflowOf(input) {
  if (input.workflow) return input.workflow;
  if (Array.isArray(input.nodes)) return input;
  return {};
}

function triggers(workflow) {
  return (workflow.nodes || []).filter((node) => /trigger|webhook|cron|schedule/i.test(node.type || ''));
}

// Ordered. More specific sentences come before more general ones.
const TEXT_RULES = [
  { cause: 'quota_exceeded', confident: true, test: /exceeded your current quota|insufficient_quota|quota exceeded|quota metric/i,
    summary: (n) => `${n} hit a usage quota on the other service. Waiting will not help. Check the plan, billing, or quota page of that service, or raise the limit.` },
  { cause: 'rate_limited', confident: true, test: /\b429\b|too many requests|receiving too many requests|rate.?limit/i,
    summary: (n) => `${n} is sending requests faster than the other service allows. Slow it down: process items in smaller batches with a Wait node between them, use the Batching option on the HTTP Request node, or turn on Retry On Fail with a wait between tries.` },
  { cause: 'bot_protection', confident: true, test: /attention required|captcha|just a moment|you have been blocked|cloudflare ray id|blocked by cloudflare|cloudflare.{0,40}(blocked|challenge)/i,
    summary: (n) => `${n} was stopped by the site's bot protection, not by a bad credential. n8n cannot get past it. Use the service's official API, ask the site owner to allow your n8n address, or stop calling that page.` },
  { cause: 'oauth_redirect', confident: true, test: /redirect_uri|redirect uri|oauth callback state|insufficient parameters for oauth2? callback/i,
    summary: () => 'The OAuth sign-in handshake failed before a token was issued. Compare the OAuth Redirect URL shown on the n8n credential with the one registered at the provider, character for character. On a self-hosted n8n, the public URL setting must match the address you open in the browser.' },
  { cause: 'meta_webhook_verify', confident: true, test: /callback url or verify token/i,
    summary: () => 'Meta could not verify the webhook. Meta calls the n8n webhook URL and expects the verify token back. Check the callback URL is the one n8n shows for this trigger, the workflow is published, the verify token matches exactly, and the n8n address is reachable from the internet.' },
  { cause: 'ssl_certificate', confident: true, test: /self[- ]signed|unable to verify the first certificate|unable_to_verify_leaf_signature|certificate has expired|cert_has_expired|depth_zero_self_signed/i,
    summary: (n) => `${n} does not trust the certificate of the server it called. Install a valid certificate on that server. For a host you control and trust, the HTTP Request node has an Ignore SSL Issues option. Do not turn it on for hosts you do not control.` },
  { cause: 'code_return_shape', confident: true, test: /code doesn.t return items properly/i,
    summary: (n) => `${n} returned something n8n cannot read as items. Return an array of objects shaped like [{ json: { ... } }]. This page will not edit the code.` },
  { cause: 'referenced_node', confident: true, test: /referenced node is unexecuted|referenced node doesn.t exist/i,
    summary: (n) => `${n} has an expression that points at a node that did not run in this execution, or no longer exists under that name. Check the node name in the expression and make sure that node runs before this one on the same path.` },
  { cause: 'paired_item', confident: true, test: /paired item data/i,
    summary: (n) => `${n} cannot trace its item back to the earlier node, because a node in between did not keep the link (Code, Merge and Aggregate nodes often do not). Refer to the earlier node with $('Node name').first() or .all(), or keep pairedItem in your Code node output.` },
  { cause: 'undefined_field', confident: true, test: /cannot read propert(y|ies) of (undefined|null)/i,
    summary: (n) => `${n} tried to read a field from something that is empty. Usually the earlier node returned no items, or the field name is different. Open the earlier node's output and check the field exists. In a Code node, guard with ?. before reading it.` },
  { cause: 'js_error', confident: false, test: /\b(syntax|reference)error\b|\bis not defined\b|is not a function|unexpected token/i,
    summary: (n) => `${n} stopped on a JavaScript error in code you or a template wrote. The line number is in the error. This page cannot read the code. Fix that line in n8n.` },
  { cause: 'tool_schema_mismatch', confident: true, test: /tool input did not match expected schema/i,
    summary: () => 'The AI agent called a tool with arguments that do not fit the tool\'s input schema. Make the tool\'s fields optional or simpler, or describe each field more clearly in the tool, so the model fills them correctly.' },
  { cause: 'runner_unresponsive', confident: true, test: /runner became unresponsive|task execution aborted/i,
    summary: (n) => `The process that runs ${n} stopped responding, most often because the Code node is processing too much data or the host is short of memory. Split the data into smaller batches or give the host more memory.` },
  { cause: 'no_webhook_response', confident: true, test: /did not return a response|no respond to webhook node/i,
    summary: () => 'The Webhook node is set to answer through a Respond to Webhook node, but the run ended without reaching one. Make every path, including error paths, reach a Respond to Webhook node, or change the Webhook node to respond immediately.' },
  { cause: 'data_table_limit', confident: true, test: /data table size limit/i,
    summary: () => 'The n8n data table is full. Delete rows you no longer need, or move the data elsewhere. This page will not do that.' },
  { cause: 'invalid_url', confident: true, test: /invalid url|failed to parse url|err_invalid_url/i,
    summary: (n) => `${n} was given a URL it cannot read. Check it starts with https:// or http://, and that any expression in it resolved to a value and not an empty string.` },
  { cause: 'not_found', confident: true, test: /\b404\b|resource you are requesting could not be found/i,
    summary: (n) => `${n} asked for something that is not there: a wrong URL, a wrong ID, or a record that was deleted. Check the URL and the ID in the node, and try the same request in a browser or curl.` },
  { cause: 'bad_request', confident: false, test: /bad request/i,
    summary: (n) => `${n} sent something the other service refused (HTTP 400). The reason is usually in the error's description field in n8n, which names the parameter. Read that, then fix the field in the node.` },
  { cause: 'server_error', confident: true, test: /\bstatus code 5\d\d\b|\b50[234]\b|bad gateway|service unavailable|gateway time-?out|internal server error|service was not able to process your request/i,
    summary: (n) => `The other service, or a proxy in front of it, failed while ${n} was waiting. This is usually not a fault in your workflow. Turn on Retry On Fail for the node and try later. If the service is yours, check its logs. If you see this when opening n8n itself, the instance is down: check its status page or logs.` },
  { cause: 'connection_refused', confident: true, test: /econnrefused|service refused the connection|connection refused/i,
    summary: (n) => `${n} reached the machine, but nothing is listening on that port. Check the host and port, and that the service is running. If n8n runs in Docker, localhost means the n8n container itself, not your computer.` },
  { cause: 'connection_reset', confident: true, test: /econnreset|closed unexpectedly|socket hang up|client network socket disconnected/i,
    summary: (n) => `The other side closed the connection while ${n} was talking to it. Turn on Retry On Fail. If it keeps happening, check the other service's logs and any proxy or firewall in between.` },
  { cause: 'host_not_found', confident: true, test: /enotfound|eai_again|getaddrinfo|connection cannot be established/i,
    summary: (n) => `${n} could not find that host name. Check the spelling of the domain, and that this n8n can resolve it (a private name may not resolve from n8n Cloud or from inside a container).` },
  { cause: 'task_runner_timeout', confident: true, test: /task request timed out|not matched to a runner/i,
    summary: () => 'The service that runs Code nodes did not pick the task up in time. This is a problem on the n8n side, not in your workflow. Retry once. If every Code node fails, check the n8n status page or contact n8n support (on self-hosted, check the task runner container).' },
  { cause: 'code_node_timeout', confident: true, test: /task execution timed out/i,
    summary: (n) => `${n} ran longer than the Code node is allowed to. Process fewer items per run, split the work with Loop Over Items, or simplify the code.` },
  { cause: 'database_locked', confident: true, test: /database is locked|sqlite_busy|timeout waiting for lock/i,
    summary: () => 'n8n\'s own database is locked by another process, so it cannot write. This is not a fault in your workflow. Stop whatever else is using the database file (backups, a second n8n), or move to Postgres. On n8n Cloud, contact n8n support.' },
  { cause: 'database_connect_timeout', confident: true, test: /timeout exceeded when trying to connect/i,
    summary: () => 'A database connection could not be opened in time. Check the database is up, reachable from n8n, and not out of connections. If this is n8n\'s own database, fix that first. If it is a Postgres node, check its host, port and firewall.' },
  { cause: 'timeout', confident: true, test: /etimedout|esockettimedout|timed out|timeout exceeded|timeout of \d+ ?ms|connection timed out|\btimeout\b/i,
    summary: (n) => `${n} waited and got no answer in time. The service may be slow or blocked by a firewall. Turn on Retry On Fail, raise the node's timeout if it has one, or reduce what you ask for in one call.` },
  { cause: 'forbidden', confident: false, test: /\b403\b|forbidden|insufficient (authentication )?scopes?|insufficient permission|permission denied|access denied/i,
    summary: (n) => `${n} was refused access (HTTP 403). The sign-in worked, but the account is not allowed to do this. Common reasons: a missing permission or scope on the credential, an IP allow-list on the other service that does not include this n8n, or a resource the account does not own. The error's description field often says which.` },
];

function report(cause, node, confident, summary) {
  return { cause, node, confident, apply: false, summary: stripSecrets(summary) };
}

function diagnose(input) {
  const source = input || {};
  const text = errorText(source);
  const node = failedNode(source);
  const workflow = workflowOf(source);
  const called = source.calledUrl || source.execution?.webhookUrl || '';

  if (/you need to be logged in|not_logged_in/i.test(text)) {
    return report('not_logged_in', node, true, `${node || 'This node'} called a page that wants a login. Add that site's login on the HTTP node, or stop calling a private URL. This page will not do that.`);
  }
  if (/invalid_grant|\bunauthori[sz]ed\b|authorization failed|please check your credentials|credentials are not set|\b401\b|session has expired|invalid oauth 2\.0 access token/i.test(text)) {
    return report('expired_auth', node, true, `${node} rejected the sign-in. Reconnect that credential in n8n. The error was: ${text}`);
  }
  if (/credential with id .+ does not exist/i.test(text)) {
    return report('missing_credential', node, true, `${node || 'This node'} points at a credential this n8n instance does not have. Open the node and pick the credential again. This page will not do that.`);
  }
  if (/out of memory|javascript heap|allocation failed|enomem/i.test(text)) {
    return report('out_of_memory', node, true, `${node || 'The host'} ran out of memory. Raise the container memory or split the payload. The error was: ${text}`);
  }
  if (/must be active/i.test(text) && !/webhook-test/i.test(called)) {
    return report('unpublished', node, true, 'The production webhook is not registered because the workflow is not active. Publish it in n8n. This page will not do that.');
  }
  if (/webhook-test/i.test(called) || /in test mode/i.test(text) || /execute workflow/i.test(text)) {
    return report('test_webhook', node, true, 'This is the test webhook. In n8n, click Execute workflow, then call the test URL once. A production URL will not work until the workflow is published.');
  }
  if (/webhook .*is not registered/i.test(text)) {
    return report('webhook_not_registered', node, false, 'n8n has no webhook registered at that address. Check which URL was called. A /webhook-test/ URL needs Execute workflow clicked first. A /webhook/ URL needs the workflow published. If it is published and still not registered, the page cannot say why.');
  }
  for (const rule of TEXT_RULES) {
    if (rule.test.test(text)) return report(rule.cause, node, rule.confident, rule.summary(node || 'This node'));
  }
  const liveTriggers = triggers(workflow).filter((item) => !/manual/i.test(item.type || ''));
  if (workflow.active === false && liveTriggers.length) {
    return report('unpublished', liveTriggers[0].name, true, `${liveTriggers[0].name} will not receive calls until the workflow is published. This file is inactive.`);
  }
  const onlyManual = triggers(workflow).length > 0 && liveTriggers.length === 0;
  if (onlyManual) {
    return report('click_never_schedule', null, false, 'No runtime error in this paste. This workflow can never run on its own: the only trigger is manual.');
  }
  return report('unknown', node, false, 'Not in the catalog. This page will not guess a fix. Open the failed node in n8n and read the error there.');
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { diagnose, stripSecrets };
}
if (typeof window !== 'undefined') {
  window.N8nDoctor = { diagnose, stripSecrets };
}
