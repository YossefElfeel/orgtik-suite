const { test } = require('node:test');
const assert = require('node:assert/strict');
const { ideaView, eraseSubmitter, ideaSubmissions, ideaCategory, ideaTags } = require('./ideas');
test('idea submitters are masked without personal-data permission', () => {
  const idea = { submitter: { name: 'Visitor', email: 'visitor@example.test', privacyVersion: '0.2' } };
  const masked = ideaView(idea, false);
  assert.notEqual(masked.submitter.name, idea.submitter.name);
  assert.notEqual(masked.submitter.email, idea.submitter.email);
  assert.equal(masked.submitter.masked, true);
  assert.deepEqual(ideaView(idea, true).submitter, idea.submitter);
});
test('erasure removes submitter data, increments the version and audits it', () => {
  const idea = { id: 'idea-test', version: 1, submitter: { name: 'Visitor', email: 'visitor@example.test', privacyVersion: '0.2' }, history: [] }, audit = [];
  eraseSubmitter(idea, 'moderator', '2026-10-06T10:00:00Z', audit);
  assert.deepEqual(idea.submitter, { erased: true, privacyVersion: '0.2' });
  assert.equal(idea.version, 2);assert.equal(audit[0].action, 'idea_erase');
  assert.deepEqual(ideaView(idea, false).submitter, idea.submitter);
});
test('duplicate submissions reuse the idea, reject conflicting keys, and expire', () => {
  let clock = 0;const ideas = new Map([['test', {}]]), submissions = ideaSubmissions(ideas, () => clock);
  const body = { email: 'VISITOR@example.test', message: 'An idea', topic: 'Product' };
  assert.equal(submissions.duplicate(body, 'key'), null);submissions.remember(body, 'key', 'test');
  assert.equal(submissions.duplicate(body, 'key').id, 'test');
  assert.equal(submissions.duplicate({ ...body, email: body.email.toLowerCase() }).id, 'test');
  assert.equal(submissions.duplicate({ ...body, message: 'Different idea' }, 'key').conflict, true);
  clock = 600000;assert.equal(submissions.duplicate(body, 'key'), null);
});
test('legacy topic tags and submitted form categories remain distinct without rewriting stored ideas', () => {
  const legacy = { theme: 'SaaS products' }, snapshot = structuredClone(legacy);
  assert.deepEqual(ideaTags(legacy), ['SaaS products']); assert.equal(ideaCategory(legacy), null); assert.deepEqual(legacy, snapshot);
  assert.equal(ideaCategory({ theme: 'A product idea' }), 'product_idea'); assert.deepEqual(ideaTags({ theme: 'A product idea' }), []);
  assert.equal(ideaCategory({ theme: 'فكرة منتج' }), 'product_idea');
  assert.equal(ideaCategory({ theme: 'Custom translated label', category: 'hosting_support' }), 'hosting_support');
  assert.equal(ideaCategory({ theme: 'A product idea', category: null }), null);
  assert.deepEqual(ideaTags({ theme: 'SaaS products', tags: [] }), []);
  assert.equal(ideaCategory({ theme: 'constructor' }), null); assert.deepEqual(ideaTags({ theme: '__proto__' }), ['__proto__']);
});
