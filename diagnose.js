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
  if (/invalid_grant|unauthorized|authorization failed|please check your credentials|credentials are not set|\b401\b/i.test(text)) {
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
  if (/webhook-test/i.test(called) || /webhook .*is not registered/i.test(text) || /in test mode/i.test(text)) {
    return report('test_webhook', node, true, 'This is the test webhook. In n8n, click Execute workflow, then call the test URL once. A production URL will not work until the workflow is published.');
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
