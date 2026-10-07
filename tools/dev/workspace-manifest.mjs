import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve(import.meta.dirname, '../../mock');
function list(folder) {
  return fs.readdirSync(folder, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? list(path.join(folder, entry.name)) : /\.(js|json)$/.test(entry.name) && !entry.name.endsWith('.test.js') && !entry.name.endsWith('harness.js') ? [path.relative(root, path.join(folder, entry.name)).replaceAll('\\', '/')] : []);
}
const shared = list(path.join(root, 'lib')).filter(file => !file.includes('platform-replay') && !file.includes('legacy-tool-replay') && !/lib\/session-/.test(file) && !file.includes('workspace-boundary'));
const value = JSON.stringify({ version: 1, apps: Object.fromEntries(['tasks', 'files', 'hr', 'sales', 'marketing', 'chats'].map(app => [app, [`apps/${app}.js`, ...list(path.join(root, 'apps', app)), ...shared].sort()])), staff: { wm: ['apps/wm.js', ...list(path.join(root, 'apps/wm')), ...shared].sort() } }, null, 2) + '\n';
const target = path.join(root, 'lib/workspace-runtime-manifest.json');
if (process.argv.includes('--check')) { if (fs.readFileSync(target, 'utf8').replaceAll('\r\n', '\n') !== value) throw new Error('Workspace runtime manifest is stale; run node tools/dev/workspace-manifest.mjs'); }
else fs.writeFileSync(target, value);
