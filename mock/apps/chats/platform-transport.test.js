const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const compiler = require(require.resolve('typescript', { paths: [path.resolve(__dirname, '../../../apps/chats')] }));
const file = path.resolve(__dirname, '../../../apps/chats/store/platform.ts');
const plain = value => JSON.parse(JSON.stringify(value));
const settle = async () => { for (let index = 0; index < 4; index++) await new Promise(setImmediate); };
function session(workspaceId = 'a', role = 'owner') {
  return { tokens: { accessToken: 'unit-only-token' }, workspaceContext: { realm: 'test', workspace: { id: workspaceId }, actor: { effectiveUserId: 1, readOnly: false }, member: { revision: 1 }, tools: { chat: { access: 'active', canWrite: true, roles: [role] } } } };
}
function data(workspaceId, revision = 0, messages = []) {
  return { workspaceId, me: '1', dataRevision: revision, access: { canWrite: true, readOnly: false, roles: ['owner'] }, users: [{ id: '1' }], historicalUsers: [], floor: { rooms: [] }, channels: [], messages };
}
const response = (value, status = 200) => ({ ok: status < 400, status, json: async () => status < 400 ? { success: true, data: value } : { success: false, code: value } });
function load(fetch, initial = session()) {
  let current = initial;
  const listeners = new Set(), module = { exports: {} }, effects = [];
  const source = compiler.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: compiler.ModuleKind.CommonJS, target: compiler.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(source, { module, exports: module.exports, process: { env: { NEXT_PUBLIC_API_URL: 'http://fixture.test/chats' } }, crypto: crypto.webcrypto, fetch, window: { setInterval() { return 1; }, clearInterval() {} }, require(name) { if (name !== '@orgtik/ui/auth') throw new Error('Unexpected runtime import: ' + name); return { readClientSession: () => current, subscribeClientSession(listener) { listeners.add(listener); return () => listeners.delete(listener); } }; } });
  const transport = module.exports, close = transport.startWorkspacePlatform({ clear: state => effects.push({ clear: plain(state) }), status: state => effects.push({ status: plain(state) }), hydrate: (data, state) => effects.push({ data: plain(data), status: plain(state) }) });
  return { transport, effects, close, switch(next) { current = next; for (const listener of listeners) listener(); } };
}

test('Chats transport retries a lost command response with one operation ID and hydrates only committed data', async () => {
  const requests = [], commits = new Map(); let loss = true;
  const runtime = load(async (_url, options) => {
    requests.push(options);
    if (options.method === 'GET') return response(data('a'));
    const id = options.headers['Idempotency-Key'];
    if (!commits.has(id)) commits.set(id, data('a', 1, [{ id: 'm-unit', text: 'Saved once' }]));
    if (loss) { loss = false; throw new Error('Socket closed after commit'); }
    return response(commits.get(id));
  });
  try {
    await settle(); runtime.transport.persistEvent({ type: 'message.created', message: { channelId: 'c', text: 'Saved once' } }); await settle();
    const writes = requests.filter(request => request.method === 'POST'); assert.equal(writes.length, 2); assert.equal(writes[0].headers['Idempotency-Key'], writes[1].headers['Idempotency-Key']);
    assert.equal(writes[0].body, writes[1].body); assert.equal(writes[0].headers['X-Workspace'], 'a'); assert.equal(commits.size, 1);
    assert.equal(runtime.effects.filter(effect => effect.data?.dataRevision === 1).length, 1);
    assert.equal(runtime.effects.at(-1).status.pending, 0);
  } finally { runtime.close(); }
});

test('Chats clears before switching workspace and ignores a delayed old-workspace response', async () => {
  let finishOld;
  const runtime = load(async (_url, options) => options.headers['X-Workspace'] === 'a' ? new Promise(resolve => { finishOld = resolve; }) : response(data('b', 0)));
  try {
    await settle(); runtime.switch(session('b')); assert.equal(runtime.effects.at(-1).clear.namespace.includes(':b:'), true); await settle();
    finishOld(response(data('a', 10, [{ id: 'private-a' }]))); await settle();
    assert.equal(runtime.effects.filter(effect => effect.data?.workspaceId === 'a').length, 0);
    assert.equal(runtime.effects.at(-1).data.workspaceId, 'b');
  } finally { runtime.close(); }
});

test('Chats storage/transport failures show failure without inventing a saved message', async () => {
  const runtime = load(async (_url, options) => options.method === 'GET' ? response(data('a')) : response('persistence_unavailable', 503));
  try {
    await settle(); runtime.transport.persistEvent({ type: 'message.created', message: { text: 'Not committed' } }); await settle();
    assert.equal(runtime.effects.at(-1).status.status, 'error'); assert.equal(runtime.effects.at(-1).status.errorCode, 'persistence_unavailable');
    assert.equal(runtime.effects.filter(effect => effect.data).length, 1);
    assert.deepEqual(runtime.effects.find(effect => effect.data).data.messages, []);
  } finally { runtime.close(); }
});

test('Chats guest or revoked context clears the directory and never falls back to seeded data', async () => {
  let calls = 0;
  const runtime = load(async () => { calls++; return response(data('a')); }, session('a', 'guest'));
  try {
    await settle(); assert.equal(calls, 0); assert.equal(runtime.effects.at(-1).clear.status, 'no_access');
    runtime.switch(session()); await settle(); assert.equal(calls, 1);
    runtime.switch(null); await settle(); assert.equal(runtime.effects.at(-1).clear.status, 'no_access');
  } finally { runtime.close(); }
});
