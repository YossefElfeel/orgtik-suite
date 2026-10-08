#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const net = require('node:net');
const { spawn, spawnSync } = require('node:child_process');
const { createRequire } = require('node:module');

const ROOT = path.resolve(__dirname, '../..');
const APPS = {
  sos: { dir: 'apps/sos', web: 3500, api: 7500 },
  tasks: { dir: 'apps/tasks', web: 3501, api: 7501 },
  files: { dir: 'apps/files', web: 3502, api: 7502 },
  sales: { dir: 'apps/sales', web: 3503, api: 7503 },
  hr: { dir: 'apps/hr', web: 3504, api: 7504 },
  marketing: { dir: 'apps/marketing', web: 3505, api: 7505 },
  wm: { dir: 'apps/wm', web: 3507, api: 7507 },
  admin: { dir: 'apps/admin', web: 3508, api: 7508 },
  chats: { dir: 'apps/chats', web: 3509, api: 7509 },
  website: { dir: 'apps/website/landing-directions', web: 4597 },
};
const web = key => `http://localhost:${APPS[key].web}`;
const api = key => `http://localhost:${APPS[key].api}`;
const args = process.argv.slice(2).filter(value => value !== '--');
const selection = args.find(value => !value.startsWith('--')) || 'tasks';
const wanted = selection === 'all' ? Object.keys(APPS) : selection.split(',');
if (args.some(value => value === '--help' || value === '-h')) {
  console.log('pnpm demo [tasks,files | wm,website | all] [--list | --dry-run]\nDefaults to SOS + Tasks. See tools/demo/README.md.');
  process.exit(0);
}
const unknown = wanted.filter(key => !APPS[key]);
if (unknown.length || args.some(value => value.startsWith('--') && !['--list', '--dry-run'].includes(value))) {
  console.error(`Unknown app or option. Available apps: ${Object.keys(APPS).join(', ')}`);
  process.exit(1);
}
const keys = [...new Set(['sos', ...wanted])];
// The existing server always starts the platform API for workspace context.
const apiKeys = [...new Set(['sos', 'admin', ...keys.filter(key => APPS[key].api), ...(keys.includes('website') ? ['wm'] : [])])];
const now = '2026-10-07T09:00:00.000Z';
console.log('OrgTik presentation sandbox · simulated data');
console.log(`Frozen clock: ${now} · journal/accounts: memory`);
for (const key of keys) console.log(`  ${key.padEnd(10)} ${web(key)}`);
console.log(`  sign in    ${web('sos')}/auth/login`);
console.log(`API ports: ${apiKeys.map(key => APPS[key].api).join(', ')} · icons: 7599`);
if (args.includes('--list') || args.includes('--dry-run')) {
  console.log('No services started or files changed.');
  process.exit(0);
}

const children = new Set();
let stopping = false;
let runDir;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) {
    if (!child.pid) continue;
    if (process.platform === 'win32') spawnSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], { windowsHide: true, stdio: 'ignore' });
    else { try { process.kill(-child.pid, 'SIGTERM'); } catch {} }
  }
  console.log('\nStopped this presentation run. Restart pnpm demo for fresh seed data.');
  process.exitCode = code;
}
process.on('SIGINT', () => stop());
process.on('SIGTERM', () => stop());

function childEnv() {
  const env = { ...process.env };
  for (const key of Object.keys(env)) {
    if (/^(KV_|UPSTASH_|REDIS_|VERCEL|MOCK_|ORGTIK_MOCK_|SUITE_|NEXT_PUBLIC_|VITE_)/i.test(key)) delete env[key];
  }
  return {
    ...env,
    NODE_ENV: 'development',
    NODE_OPTIONS: '--max-http-header-size=65536',
    MOCK_JOURNAL: 'memory', MOCK_AUTH_STORE: 'memory',
    MOCK_SANDBOX: path.basename(runDir), MOCK_NOW: now, MOCK_CLOCK: 'frozen',
    MOCK_PORT_OFFSET: '3500', ORGTIK_DEMO_RUN_DIR: runDir,
    // Session metadata uses the existing file adapter in this private folder.
    MOCK_AUTH_FILE: path.join(runDir, 'data', 'session-metadata'),
    SUITE_WEB_URLS: JSON.stringify(Object.fromEntries(Object.keys(APPS).map(key => [key, web(key)]))),
    NEXT_PUBLIC_DEMO_PANEL: '1', NEXT_TELEMETRY_DISABLED: '1',
    NEXT_DIST_DIR: '.next-demo',
    NEXT_PUBLIC_SOS_URL: web('sos'), NEXT_PUBLIC_SOS_API_URL: api('sos'),
    NEXT_PUBLIC_WM_URL: web('wm'), NEXT_PUBLIC_ADMIN_URL: web('admin'),
    NEXT_PUBLIC_WEBSITE_URL: web('website'),
    NEXT_PUBLIC_WM_API_URL: api('wm'), NEXT_PUBLIC_ADMIN_API_URL: api('admin'),
    NEXT_PUBLIC_ORG_TIME_ZONE: 'Africa/Cairo',
    NEXT_PUBLIC_REDIRECT_URL: `${web('sos')}/auth/login`,
    NEXT_PUBLIC_AUTH_API_URL: `${api('sos')}/api`,
    NEXT_PUBLIC_API_URL_TASK: `${api('tasks')}/api`,
    VITE_SUITE_URL: web('sos'), VITE_SUITE_API: `${api('sos')}/api`,
    VITE_CMS_API: `${api('wm')}/v2`, VITE_WM_ORIGIN: web('wm'),
  };
}

function link(source, destination) {
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.symlinkSync(fs.realpathSync(source), destination, process.platform === 'win32' ? 'junction' : 'dir');
}
function stage(key) {
  const original = path.join(ROOT, APPS[key].dir);
  const staged = path.join(runDir, APPS[key].dir);
  const excluded = name => name === 'node_modules' || name === '.git' || name === '.turbo' || name === 'dist' || name === 'tests' || name.startsWith('.next') || name.startsWith('.env') || name.endsWith('.tsbuildinfo') || name.endsWith('.log');
  fs.cpSync(original, staged, { recursive: true, dereference: true, filter: file => !excluded(path.basename(file)) });
  const packageJson = JSON.parse(fs.readFileSync(path.join(original, 'package.json')));
  const modules = path.join(staged, 'node_modules');
  fs.mkdirSync(modules, { recursive: true });
  for (const name of Object.keys({ ...packageJson.dependencies, ...packageJson.devDependencies })) {
    const source = path.join(original, 'node_modules', name);
    if (!fs.existsSync(source)) throw new Error(`${key}: dependencies missing. Run pnpm install first.`);
    const destination = path.join(modules, name);
    if (name !== '@somion/sos-bar') { link(source, destination); continue; }
    // Legacy launcher URLs are patched only in this run's copy, never installed dependencies.
    fs.cpSync(fs.realpathSync(source), destination, { recursive: true, dereference: true, filter: file => path.basename(file) !== 'node_modules' });
    const legacy = JSON.parse(fs.readFileSync(path.join(source, 'package.json')));
    const originalRequire = createRequire(path.join(fs.realpathSync(source), 'package.json'));
    for (const dependency of Object.keys({ ...legacy.dependencies, ...legacy.peerDependencies })) {
      const dependencySource = originalRequire.resolve.paths(dependency).map(base => path.join(base, dependency)).find(file => fs.existsSync(file));
      if (dependencySource) link(dependencySource, path.join(destination, 'node_modules', dependency));
    }
    const constants = path.join(destination, 'dist/constants/index.js');
    fs.writeFileSync(constants, fs.readFileSync(constants, 'utf8')
      .replace(/export const SOS_URL = [^\n]*/, `export const SOS_URL = ${JSON.stringify(web('sos'))};`)
      .replace(/export const API_URL = [^\n]*/, `export const API_URL = ${JSON.stringify(`${api('sos')}/api`)};`));
  }
  return staged;
}

function start(name, script, commandArgs, cwd, env) {
  const child = spawn(process.execPath, [script, ...commandArgs], { cwd, env, windowsHide: true, detached: process.platform !== 'win32', stdio: ['ignore', 'pipe', 'pipe'] });
  children.add(child);
  for (const stream of [child.stdout, child.stderr]) {
    let pending = '';
    stream.on('data', data => {
      pending += data;
      const lines = pending.split(/\r?\n/); pending = lines.pop();
      for (const line of lines) {
        // Existing mock startup prints a fixture password; keep the presentation log password-free.
        if (line && !line.includes('password for all:')) console.log(`[${name}] ${line}`);
      }
    });
  }
  child.on('error', error => { console.error(`${name}: ${error.message}`); stop(1); });
  child.on('exit', code => { children.delete(child); if (!stopping) { console.error(`${name} exited (${code}); stopping the run.`); stop(code || 1); } });
}
function portFree(port) {
  return new Promise((resolve, reject) => {
    const probe = net.createServer();
    probe.once('error', () => reject(new Error(`Port ${port} is occupied. Existing services were left running.`)));
    // Bind all interfaces to detect existing localhost and 127.0.0.1 listeners.
    probe.listen(port, () => probe.close(resolve));
  });
}

(async () => {
  const ports = [...new Set([...keys.map(key => APPS[key].web), ...apiKeys.map(key => APPS[key].api), 7599])];
  for (const port of ports) await portFree(port);
  if (stopping) return;
  for (const key of keys) if (!fs.existsSync(path.join(ROOT, APPS[key].dir, 'node_modules'))) throw new Error(`${key}: dependencies missing. Run pnpm install first.`);
  const runtime = path.join(__dirname, '.runtime');
  fs.mkdirSync(runtime, { recursive: true });
  runDir = fs.mkdtempSync(path.join(runtime, 'presentation-'));
  fs.writeFileSync(path.join(runDir, 'package.json'), JSON.stringify({ name: 'orgtik-presentation-run', private: true }));
  link(path.join(ROOT, 'node_modules'), path.join(runDir, 'node_modules'));
  const staged = new Map(keys.map(key => [key, stage(key)]));
  if (stopping) return;
  const env = childEnv();
  console.log(`Private runtime: ${path.relative(ROOT, runDir)}\nUse a separate private browser window for presentation sessions. Ctrl+C stops only this run.`);
  start('mock', path.join(__dirname, 'api.cjs'), ['--only', apiKeys.join(',')], ROOT, env);
  for (const key of keys) {
    const cwd = staged.get(key);
    const appEnv = { ...env, NEXT_PUBLIC_API_URL: APPS[key].api ? `${api(key)}${['sos', 'sales', 'hr', 'marketing'].includes(key) ? '/api' : ''}` : '' };
    if (['hr', 'chats'].includes(key)) appEnv.NEXT_PUBLIC_SOS_API_URL = `${api('sos')}/api`;
    const script = key === 'website' ? path.join(path.dirname(require.resolve('vite/package.json', { paths: [cwd] })), 'bin/vite.js') : require.resolve('next/dist/bin/next', { paths: [cwd] });
    const commandArgs = key === 'website' ? ['--host', '127.0.0.1', '--port', String(APPS[key].web), '--strictPort'] : ['dev', '--hostname', '127.0.0.1', '-p', String(APPS[key].web)];
    start(key, script, commandArgs, cwd, appEnv);
  }
})().catch(error => { console.error(error.message); stop(1); });
