# n8n failure doctor

No install. Open the page, paste the JSON, read the note. Nothing is sent, and nothing is installed into n8n.

## Use

1. Open the hosted page, or download this repo and open `index.html`.
2. Paste an execution export, an Error Trigger payload, or a workflow export.
3. Apply the fix yourself in n8n. This page will not change the workflow.

The paste stays in the browser. Do not upload a file that still contains a live token. The page strips a few known token shapes from the note. That does not make the paste safe to send anywhere.

## Cause classes

| Class | When |
|---|---|
| `expired_auth` | 401, invalid_grant, unauthorized, “authorization failed” |
| `missing_credential` | “Credential with ID … does not exist” — the id is not echoed |
| `out_of_memory` | heap / allocation failure |
| `test_webhook` | `/webhook-test/` or “webhook is not registered” |
| `unpublished` | `active: false` and a webhook, cron, or schedule trigger |
| `click_never_schedule` | the only trigger is manual |
| `unknown` | anything else — the note says it does not know |

`apply` is always false.

## Run

```bash
node --test
open index.html
open catalog.html
```

Do not paste a file that still contains live tokens into a chat. The page strips known token shapes from the note. It does not make the paste safe to upload.
