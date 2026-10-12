const { test } = require('node:test');
const assert = require('node:assert/strict');
const { validate } = require('./validate-env.cjs');
const configured = {
  VERCEL: '1',
  NEXT_PUBLIC_API_URL: 'https://mock.fixture.test/chats',
  NEXT_PUBLIC_SOS_API_URL: 'https://mock.fixture.test/sos/api',
  NEXT_PUBLIC_SOS_URL: 'https://sos.fixture.test',
};

test('Hosted Chats accepts the explicit API and the recoverable older SOS-only configuration', () => {
  const { NEXT_PUBLIC_API_URL, ...oldConfiguration } = configured;
  assert.doesNotThrow(() => validate('chats', oldConfiguration));
  assert.doesNotThrow(() => validate('chats', configured));
});

test('Hosted Chats cannot build without a usable API origin', () => {
  assert.throws(() => validate('chats', { ...configured, NEXT_PUBLIC_API_URL: undefined, NEXT_PUBLIC_SOS_API_URL: undefined }), /NEXT_PUBLIC_API_URL is missing or invalid/);
});

test('Hosted Chats rejects the SOS namespace or an API path appended twice', () => {
  for (const suffix of ['/sos/api', '/chats/api']) assert.throws(() => validate('chats', { ...configured, NEXT_PUBLIC_API_URL: `https://mock.fixture.test${suffix}` }), /NEXT_PUBLIC_API_URL must use the path \/chats/);
});
