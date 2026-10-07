import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { workspaceRuntimeFiles, copyWorkspaceRuntime, checkWorkspaceRuntime } from './workspace-runtime.mjs';
test('private runtime function packaging preserves every owned source and rejects omission or transformation', () => {
  const folder = fs.mkdtempSync(path.join(os.tmpdir(), 'orgtik-workspace-artifact-'));
  try {
    const files = copyWorkspaceRuntime(folder);
    assert.equal(checkWorkspaceRuntime(folder), files.length);
    assert.ok(files.includes('apps/chats/fixture.json'));
    assert.ok(files.includes('lib/tool-adapters/hr.js'));
    fs.appendFileSync(path.join(folder, 'mock', files[0]), '\n// altered');
    assert.throws(() => checkWorkspaceRuntime(folder), /altered or omitted/);
  } finally {
    const relative = path.relative(path.resolve(os.tmpdir()), path.resolve(folder));
    assert.ok(relative.startsWith('orgtik-workspace-artifact-') && !relative.includes(path.sep));
    fs.rmSync(folder, { recursive: true, force: true });
  }
});
test('all six app manifests exclude tests and harnesses and include their entry', () => {
  const files = workspaceRuntimeFiles();
  for (const app of ['tasks', 'files', 'hr', 'sales', 'marketing', 'chats']) assert.ok(files.includes(`apps/${app}.js`));
  assert.equal(files.some(file => /test\.js$|harness\.js$/.test(file)), false);
});
