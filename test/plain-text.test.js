const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { parseInput } = require('../parse-input.js');
const { diagnose } = require('../diagnose.js');

test('a JSON object is passed through as JSON', () => {
  const result = parseInput('{"errorMessage":"x"}');
  assert.deepEqual(result, { mode: 'json', value: { errorMessage: 'x' } });
});

test('a plain error sentence is read as the error message', () => {
  const result = parseInput('  Authorization failed - please check your credentials \n');
  assert.equal(result.mode, 'text');
  assert.deepEqual(result.value, { errorMessage: 'Authorization failed - please check your credentials' });
});

test('a plain sentence reaches the same cause as the JSON form', () => {
  const sentence = 'n8n may have run out of memory while running this execution.';
  const fromText = diagnose(parseInput(sentence).value);
  const fromJson = diagnose(parseInput(JSON.stringify({ errorMessage: sentence })).value);
  assert.equal(fromText.cause, 'out_of_memory');
  assert.equal(fromText.cause, fromJson.cause);
  assert.equal(fromText.apply, false);
});

test('a quoted string or a number is read as text, not as a broken object', () => {
  assert.deepEqual(parseInput('"Forbidden"').value, { errorMessage: 'Forbidden' });
  assert.deepEqual(parseInput('401').value, { errorMessage: '401' });
});

test('broken JSON is refused, not repaired and not guessed', () => {
  for (const broken of ['{"errorMessage": "x"', '[1, 2', '{ errorMessage: x }']) {
    const result = parseInput(broken);
    assert.equal(result.mode, 'error', broken);
    assert.match(result.message, /not JSON/i);
  }
});

test('an empty paste asks for something to read', () => {
  for (const empty of ['', '   \n  ', 'null']) {
    const result = parseInput(empty);
    assert.equal(result.mode, 'error', JSON.stringify(empty));
    assert.match(result.message, /paste/i);
  }
});

test('a long log is cut so the note stays small', () => {
  const result = parseInput('Error: boom\n' + 'x'.repeat(20000));
  assert.equal(result.mode, 'text');
  assert.ok(result.value.errorMessage.length <= 5000);
});

test('the page reads plain text through parse-input and says so', () => {
  const page = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  assert.match(page, /<script src="parse-input\.js">/);
  assert.match(page, /parseInput\(/);
  assert.match(page, /error sentence/i);
  assert.match(page, /read as plain text/i);
  assert.doesNotMatch(page, /JSON\.parse\(document/);
  assert.match(page, /does not fix JSON/);
});

test('a log line that starts with a bracket is plain text, not broken JSON', () => {
  const result = parseInput('[ERROR] Authorization failed - please check your credentials');
  assert.equal(result.mode, 'text');
  assert.equal(diagnose(result.value).cause, 'expired_auth');
});
