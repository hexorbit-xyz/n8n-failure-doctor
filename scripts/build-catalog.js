// Rewrites the table in catalog.html from catalog.js so the two cannot drift.
const fs = require('node:fs');
const path = require('node:path');
const { rows } = require('../catalog.js');

const file = path.join(__dirname, '..', 'catalog.html');
const esc = (t) => String(t).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const body = rows.map((r) => `      <tr>
        <td><code>${esc(r.cause)}</code></td>
        <td>${esc(r.sentence)}</td>
        <td>${esc(r.fix)}</td>
      </tr>`).join('\n');

const html = fs.readFileSync(file, 'utf8');
const next = html.replace(/(<tbody>\n)[\s\S]*?(\n {4}<\/tbody>)/, `$1${body}$2`);
fs.writeFileSync(file, next);
console.log(`catalog.html: ${rows.length} rows`);
