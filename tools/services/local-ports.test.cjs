const { test } = require('node:test');
const assert = require('node:assert/strict');
const { availableLocalPort } = require('./local-ports.cjs');
test('on-demand services skip a free port that Next.js rejects', async () => {
  const candidates = [2049, 3101];
  assert.equal(await availableLocalPort(0, { getPort: async () => candidates.shift(), isReserved: port => port === 2049 }), 3101);
});
test('an explicitly reserved public port is rejected before binding', async () => {
  await assert.rejects(availableLocalPort(2049, { getPort: () => assert.fail('reserved port was bound'), isReserved: port => port === 2049 }), /reserved/);
});
