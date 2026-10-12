const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const compiler = require('typescript');
const moduleUnderTest = { exports: {} };
const source = compiler.transpileModule(fs.readFileSync(require.resolve('./api-url.ts'), 'utf8'), { compilerOptions: { module: compiler.ModuleKind.CommonJS } }).outputText;
vm.runInNewContext(source, { module: moduleUnderTest, exports: moduleUnderTest.exports, URL, process: { env: {} } });
const { resolveChatsApiUrl } = moduleUnderTest.exports;

test('Chats uses an explicit API URL for separate local servers and hosted previews', () => {
  assert.equal(resolveChatsApiUrl('http://localhost:7509/api/', 'http://localhost:7500/api'), 'http://localhost:7509');
  assert.equal(resolveChatsApiUrl('https://mock-preview.fixture.test/chats', 'https://mock.fixture.test/sos/api'), 'https://mock-preview.fixture.test/chats');
});

test('Older hosted configuration derives Chats from the same SOS namespace and environment', () => {
  assert.equal(resolveChatsApiUrl(undefined, 'https://mock.fixture.test/sos/api'), 'https://mock.fixture.test/chats');
  assert.equal(resolveChatsApiUrl('', 'https://mock-preview.fixture.test/sos/'), 'https://mock-preview.fixture.test/chats');
});

test('Missing or invalid configuration never guesses a local port or sends session credentials to an unrelated path', () => {
  for (const sos of [undefined, '', 'http://localhost:7500/api', 'https://mock.fixture.test/other/api', 'https://user:password@mock.fixture.test/sos/api', 'https://mock.fixture.test/sos/api?redirect=other', 'file:///sos/api']) assert.equal(resolveChatsApiUrl(undefined, sos), '');
  assert.equal(resolveChatsApiUrl('/relative', 'https://mock.fixture.test/sos/api'), '');
});
