# n8n failure doctor

No install. Open the page, paste the JSON, read the note. Nothing is sent, and nothing is installed into n8n.

## Use

1. Open https://hexorbit-xyz.github.io/n8n-failure-doctor/ , or download this repo and open `index.html`.
2. Paste the error sentence, an execution export, an Error Trigger payload, or a workflow export. Broken JSON is refused, not repaired.
3. Apply the fix yourself in n8n. This page will not change the workflow.

The paste stays in the browser. Do not upload a file that still contains a live token. The page strips a few known token shapes from the note. That does not make the paste safe to send anywhere.

## Cause classes

Every class is listed with a real example sentence in [catalog.html](catalog.html). That page is generated from `catalog.js`, so run `node scripts/build-catalog.js` after you add a row.

| Group | Classes |
|---|---|
| Sign-in and access | `expired_auth`, `not_logged_in`, `missing_credential`, `forbidden`, `bot_protection`, `oauth_redirect`, `meta_webhook_verify` |
| Limits | `rate_limited`, `quota_exceeded`, `out_of_memory`, `data_table_limit` |
| Network | `connection_refused`, `connection_reset`, `host_not_found`, `timeout`, `ssl_certificate`, `server_error`, `not_found`, `bad_request`, `invalid_url` |
| Webhooks | `test_webhook`, `unpublished`, `webhook_not_registered`, `no_webhook_response`, `click_never_schedule` |
| Code and data | `code_return_shape`, `undefined_field`, `referenced_node`, `paired_item`, `js_error`, `code_node_timeout`, `tool_schema_mismatch` |
| n8n itself | `task_runner_timeout`, `runner_unresponsive`, `database_locked`, `database_connect_timeout` |
| Anything else | `unknown`: the note says it is not in the catalog |

## Adding a sentence

1. Find a real paste of that shape (a public forum post is fine) that the page cannot name, or names wrongly.
2. Add it to `fixtures/forum-posts.json` with the topic id and the class it should get. Run `node --test` and watch it fail.
3. Change the rule in `diagnose.js`, add a row to `catalog.js`, run `node scripts/build-catalog.js`, and run the tests again.

Rules that mention only a number or a common word (429, 404, timeout) are the riskiest. Keep a fixture that must stay `unknown` for each false match you fix.

`apply` is always false.

## Run

```bash
node --test
open index.html
open catalog.html
```

Do not paste a file that still contains live tokens into a chat. The page strips known token shapes from the note. It does not make the paste safe to upload.
