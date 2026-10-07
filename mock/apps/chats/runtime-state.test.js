const { test } = require('node:test');
const assert = require('node:assert/strict');
const codec = require('./runtime-state');

test('Chats snapshot codec fails closed on uncovered state, counters and historical authority', () => {
  const initialized = codec.initialize({ workspace: { id: 'fresh', name: 'Fresh' }, identity: { users: [] } });
  assert.throws(() => codec.decode({ ...initialized.data, users: [{ id: 1, roles: ['owner'] }] }, initialized.sequences), /uncovered/);
  assert.throws(() => codec.decode(initialized.data, { ...initialized.sequences, hiddenId: 3 }), /counters/);
  assert.throws(() => codec.decode({ ...initialized.data, historicalUsers: [{ id: 'old', name: 'Old', role: 'owner' }] }, initialized.sequences), /authority/);
  assert.throws(() => codec.decode({ ...initialized.data, readState: { '1': { foreign: 1 } } }, initialized.sequences), /cursor/);
  assert.equal(codec.id('__proto__'), false);
});
