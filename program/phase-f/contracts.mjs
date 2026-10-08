import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const root = path.resolve(import.meta.dirname, '../..');
const require = createRequire(path.join(root, 'mock/package.json'));
const { parse } = require('@babel/parser');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'mock/lib/workspace-runtime-manifest.json'), 'utf8'));
const result = { schemaVersion: 1, sourceInventory: true, enforcement: 'workspace-boundary and current app route guards; legacy-only source definitions do not imply mounted customer routes', routes: [] };
function visit(node, fn) { if (!node || typeof node !== 'object') return; fn(node); for (const [key, value] of Object.entries(node)) if (!['loc', 'start', 'end', 'extra'].includes(key)) { if (Array.isArray(value)) value.forEach(child => visit(child, fn)); else if (value && typeof value === 'object') visit(value, fn); } }
function collect(source, app, audience) {
  const tree = parse(fs.readFileSync(path.join(root, 'mock', source), 'utf8'), { sourceType: 'script' });
  visit(tree, node => {
    const callee = node.type === 'CallExpression' && node.callee;
    if (callee?.type !== 'MemberExpression' || !['app', 'router'].includes(callee.object?.name) || !['get', 'post', 'put', 'patch', 'delete'].includes(callee.property?.name)) return;
    const argument = node.arguments[0], paths = argument?.type === 'ArrayExpression' ? argument.elements : [argument];
    for (const value of paths) if (value?.type === 'StringLiteral') {
      const route = value.value, publicInvitation = route.startsWith('/v1/public/invitations/'), publicShare = route.includes('/public/shares/'), publicCms = app === 'wm' && route.startsWith('/v2/public/'), preview = app === 'wm' && route.startsWith('/v2/preview/'), publicAuth = app === 'identity' && /^\/api\/auth\/(login|register|handoff\/exchange)$/.test(route);
      const staff = route.startsWith('/v1/admin/') || app === 'wm' && !publicCms && !preview;
      const availability = app === 'shared' && route === '/api/calendar/availability';
      const sharedFile = app === 'shared' && route.startsWith('/api/shared/files');
      const samples = app === 'files' && route === '/api/v1/files/samples';
      const board = app === 'chats' && route.startsWith('/api/hq/whiteboards');
      const fileVersion = app === 'files' && route.includes('/versions/');
      const permission = board ? 'current Chats grant and standalone author/channel member/canonical meeting participant intersected with current Files grant and ACL; writes require both current write capabilities before permanent receipt recovery' : fileVersion ? 'current Files grant and inherited record ACL; structured board versions also require current Chats source association; pinned bytes never follow current head' : sharedFile ? 'current consuming tool and record/channel membership intersected with current Files grant and inherited file ACL; content also requires the stored pinned reference' : samples ? 'current Files grant; creation requires current write capability and writable parent before idempotent receipt recovery; packaged catalog only' : availability ? 'current consuming tool grant; final-approved active assigned coworkers only; guests receive an empty projection' : route.includes('/billing/') || route.endsWith('/retry') ? staff ? 'current OrgTik billing:full permission' : 'current workspace owner' : route.endsWith('/ownership-transfer') ? 'current workspace owner for a new transfer; exact original receipt may be recovered by its still-active administrator' : staff ? 'current OrgTik staff permission and current internal membership' : app === 'shared' ? route.includes('invitations') || route.includes('team') || route.includes('lifecycle') ? 'current workspace administrator; owner for administrator appointment' : 'current session or recipient' : 'current tool grant and app record/role guard';
      result.routes.push({ app, method: callee.property.name.toUpperCase(), path: route, source, authorization: { audience: availability || sharedFile ? 'tool:tasks or tool:chats on its own API origin' : publicAuth ? 'public identity entry; opaque handoff capability when exchanging' : publicInvitation ? 'invitation capability; existing recipients sign in' : publicShare ? 'workspace-scoped public Files grant' : publicCms ? 'public published content or validated public form' : preview ? 'hashed preview capability; current staff issuer and real expiry' : staff ? 'staff:wm or staff:admin for this route' : audience, workspaceBinding: staff || publicAuth || publicCms || preview ? 'OrgTik internal or identity context; no customer workspace privilege' : publicInvitation || publicShare ? 'resolved by server capability index' : 'signed selected workspace', permission, writes: ['get'].includes(callee.property.name) ? 'read' : 'current write capability; billing and impersonation restrictions' } });
    }
  });
}
collect('lib/workspace-boundary.js', 'shared', 'suite or identity route session');
collect('lib/identity.js', 'identity', 'current signed session; refresh token only on refresh');
for (const [app, files] of Object.entries(manifest.apps)) for (const file of files.filter(file => (file.startsWith(`apps/${app}`) || file === `lib/tool-adapters/${app}.js`) && file.endsWith('.js'))) collect(file, app, `tool:${app}`);
for (const file of manifest.staff?.wm || []) if (file.startsWith('apps/wm') && file.endsWith('.js')) collect(file, 'wm', 'staff:wm');
result.routes.sort((a, b) => `${a.app}:${a.path}:${a.method}:${a.source}`.localeCompare(`${b.app}:${b.path}:${b.method}:${b.source}`, 'en'));
const value = JSON.stringify(result, null, 2) + '\n', target = path.join(import.meta.dirname, 'api-contracts.json');
if (process.argv.includes('--check')) { if (!fs.existsSync(target) || fs.readFileSync(target, 'utf8').replaceAll('\r\n', '\n') !== value) throw new Error('Workspace API contracts are stale; run node program/phase-f/contracts.mjs'); }
else fs.writeFileSync(target, value);
console.log(`workspace contracts: ${result.routes.length} routes`);
