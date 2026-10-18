const test = require('node:test');
const assert = require('node:assert/strict');
const posts = require('../fixtures/forum-posts.json');
const { diagnose } = require('../diagnose.js');

// Error sentences quoted from public posts on community.n8n.io (https://community.n8n.io/t/<topic>).
// Each one is a real shape the checklist must name, or must refuse to name.
for (const post of posts) {
  test(`forum topic ${post.topic} -> ${post.expect}`, () => {
    const paste = { errorMessage: post.errorMessage };
    if (post.errorDescription) paste.errorDescription = post.errorDescription;
    const report = diagnose(paste);
    assert.equal(report.cause, post.expect, post.errorMessage);
    assert.equal(report.apply, false);
  });
}
