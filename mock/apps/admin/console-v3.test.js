const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const http = require('node:http');

test('ordinary Console uses current staff authority, actual records and immutable document receipts', { timeout: 90000 }, async () => {
  const folder = fs.mkdtempSync(path.join(os.tmpdir(), 'orgtik-console-v3-'));
  Object.assign(process.env, { MOCK_AUTH_FILE: path.join(folder, 'accounts.json'), MOCK_AUTH_STORE: 'file', MOCK_JOURNAL: 'memory', MOCK_SANDBOX: `console-v3-${process.pid}`, MOCK_PUBLIC_URL: '', VERCEL: '', KV_REST_API_URL: '', KV_REST_API_TOKEN: '', UPSTASH_REDIS_REST_URL: '', UPSTASH_REDIS_REST_TOKEN: '', MOCK_CLOCK: 'frozen', MOCK_NOW: '2026-10-07T09:00:00Z' });
  process.argv.push('--only=sos,admin');
  const server = http.createServer(require('../../api/index'));
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  async function call(app, endpoint, token, method = 'GET', body, operationId) {
    const response = await fetch(`${base}/${app}${endpoint}`, { method, signal: AbortSignal.timeout(25000), headers: { connection: 'close', ...(token ? { authorization: `Bearer ${token}` } : {}), ...(body === undefined ? {} : { 'content-type': 'application/json' }), ...(operationId ? { 'Idempotency-Key': operationId } : {}) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    const raw = await response.json(); return { status: response.status, raw, data: raw.data };
  }
  const good = result => { assert.ok(result.status < 300, JSON.stringify(result.raw)); return result.data; };
  try {
    const mona = good(await call('sos', '/api/auth/login', null, 'POST', { email: 'mona.adel@orgtik.test', password: 'Local@2026' }));
    const staff = good(await call('sos', '/api/auth/workspace', mona.tokens.accessToken, 'POST', { mode: 'staff', target: 'admin' })), token = staff.tokens.accessToken;
    const frame = good(await call('admin', '/v1/admin/console/frame', token)); assert.equal(frame.staff.id, mona.user.id); assert.equal(frame.scope, 'staff:admin'); assert.equal('workspace' in frame, false);
    good(await call('admin', '/v1/admin/console/preferences', token, 'PATCH', { theme: 'dark' }));
    assert.equal(good(await call('sos', '/api/suite/preferences', mona.tokens.accessToken)).theme, 'dark');
    const store = require('../../apps/admin').getStore(), financialBefore = JSON.stringify(store.db.invoices);
    assert.ok(good(await call('admin', '/v1/admin/console/search?q=Nile', token)).some(row => row.path.startsWith('/workspaces/')));
    const notes = good(await call('admin', '/v1/admin/console/notifications', token));
    good(await call('admin', '/v1/admin/console/notifications/read', token, 'POST', { all: true }));
    assert.ok(good(await call('admin', '/v1/admin/console/notifications', token)).every(row => row.read));
    assert.deepEqual(notes.map(row => row.id), good(await call('admin', '/v1/admin/console/notifications', token)).map(row => row.id));
    const metrics = good(await call('admin', '/v1/admin/console/metrics', token)); assert.ok(metrics.mrrUsd >= 0); assert.equal(metrics.cohorts.reduce((sum, row) => sum + row.workspaces, 0), store.db.workspaces.filter(row => row.state !== 'deleted').length);
    assert.equal(good(await call('admin', '/v1/admin/console/ecosystem', token)).connectors.length, 9);
    const publication = { tool: 'tasks', kind: 'changelog', title: 'Actual Tasks change', body: 'A recorded mock release note.', version: 'v3' };
    const release = good(await call('admin', '/v1/admin/console/releases', token, 'POST', publication, 'console-release-proof'));
    assert.equal(good(await call('admin', '/v1/admin/console/releases', token, 'POST', publication, 'console-release-proof')).id, release.id);
    assert.equal((await call('admin', '/v1/admin/console/releases', token, 'POST', { ...publication, title: 'Changed' }, 'console-release-proof')).status, 409);
    const invoice = store.db.invoices.find(row => row.state === 'paid'), workspace = store.workspace(invoice.workspaceId), entity = workspace.billing.country || workspace.country;
    good(await call('admin', '/v1/admin/console/billing/series', token, 'POST', { entity, prefix: 'TEST', nextNumber: 2000 }, 'console-series-proof'));
    const document = good(await call('admin', `/v1/admin/console/billing/invoices/${invoice.id}/document`, token, 'POST', {}, 'console-document-proof'));
    assert.equal(document.documentNumber, 'TEST-002000'); assert.equal(document.invoice.total, invoice.total); assert.equal(document.number, invoice.number);
    assert.equal(good(await call('admin', `/v1/admin/console/billing/invoices/${invoice.id}/document`, token, 'POST', {}, 'console-document-proof')).documentNumber, document.documentNumber);
    assert.equal(good(await call('admin', '/v1/admin/console/billing', token)).series[entity].nextNumber, 2001);
    assert.equal((await call('admin', '/v1/admin/console/billing/series', token, 'POST', { entity, prefix: 'TEST', nextNumber: 2000 }, 'console-series-reuse')).status, 409);
    const check = good(await call('admin', '/v1/admin/console/tax/verify', token, 'POST', { workspaceId: workspace.id, taxId: 'CH-DEMO-001' }, 'console-tax-proof')); assert.equal(check.state, 'accepted_mock'); assert.equal(check.submitted, false);
    assert.equal((await call('admin', '/v1/admin/console/staff/security', token, 'POST', { enabled: true, code: 'bad' }, 'console-2fa-bad')).status, 422);
    const security = good(await call('admin', '/v1/admin/console/staff/security', token, 'POST', { enabled: true, code: '246810' }, 'console-2fa-proof')); assert.equal(security.simulated, true);
    assert.equal(JSON.stringify(store.db.invoices), financialBefore);
    const identities = require('../../lib/identity');
    const customer = good(await call('sos', '/api/auth/login', null, 'POST', { email: identities.findByKey('customer').email, password: 'Local@2026' }));
    assert.ok((await call('admin', '/v1/admin/console/frame', customer.tokens.accessToken)).status >= 400);
    const colleague = identities.findByKey('manager');
    good(await call('admin', `/v1/admin/staff/${colleague.key}/roles`, token, 'PUT', { roles: [...store.db.staffRoles[colleague.key], 'super_admin'] }));
    const colleagueLogin = good(await call('sos', '/api/auth/login', null, 'POST', { email: colleague.email, password: 'Local@2026' }));
    const colleagueStaff = good(await call('sos', '/api/auth/workspace', colleagueLogin.tokens.accessToken, 'POST', { mode: 'staff', target: 'admin' }));
    good(await call('admin', `/v1/admin/staff/${identities.findUser(mona.user.id).key}/roles`, colleagueStaff.tokens.accessToken, 'PUT', { roles: ['finance'] }));
    assert.ok((await call('admin', '/v1/admin/console/releases', token, 'POST', publication, 'console-release-proof')).status >= 400);
  } finally {
    await new Promise(resolve => server.close(resolve));
    const target = fs.realpathSync(folder);
    if (!target.startsWith(path.resolve(os.tmpdir()) + path.sep) || !path.basename(target).startsWith('orgtik-console-v3-')) throw Error('Unexpected test cleanup target.');
    fs.rmSync(target, { recursive: true, force: true });
  }
});
