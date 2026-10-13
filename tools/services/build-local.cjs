const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const { spawn, spawnSync, execFileSync } = require('node:child_process');
const { apps, packages, clientEnvironment } = require('./config.cjs');
const root = path.resolve(__dirname, '../..'), marker = path.join(root, '.vercel/local-suite/build.json');
function sourceDigest() {
  const files = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], { cwd: root, encoding: 'utf8', windowsHide: true }).split(/\r?\n/).filter(file => /^(apps\/(admin|chats|files|hr|marketing|sales|sos|tasks|wm|website\/landing-directions)\/|packages\/ui\/|tools\/(services\/(config\.cjs|proxy\.ts|build-local\.cjs)|vercel-prebuild)|pnpm-lock\.yaml|pnpm-workspace\.yaml)/.test(file) && !/\/(dist|\.next|node_modules|qa|tests\/results)\//.test(file));
  const hash = crypto.createHash('sha256');
  for (const file of [...new Set(files)].sort()) if (fs.existsSync(path.join(root, file))) hash.update(file).update(fs.readFileSync(path.join(root, file)));
  return hash.digest('hex');
}
function ready(origin) {
  try { const value = JSON.parse(fs.readFileSync(marker, 'utf8')); return value.origin === origin && value.digest === sourceDigest() && [...apps.map(key => `apps/${key}/.next/BUILD_ID`), 'apps/website/landing-directions/dist/client/index.html'].every(file => fs.existsSync(path.join(root, file))); } catch { return false; }
}
async function build(origin) {
  const environment = { ...process.env, SUITE_SERVICES_PUBLIC_URL: origin, VERCEL_ENV: 'development', ORGTIK_SERVICES: '1', ORGTIK_SERVICES_DEV: '1', ORGTIK_LOCAL_PREVIEW_BUILD: '1', NEXT_TELEMETRY_DISABLED: '1' };
  const executable = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
  const ui = spawnSync(executable, ['--filter', '@orgtik/ui', 'build'], { cwd: root, env: environment, stdio: 'inherit', windowsHide: true, shell: process.platform === 'win32' });
  if (ui.error || ui.status !== 0) throw ui.error || Error('Shared UI build failed.');
  const queue = [...apps, 'website'];
  async function worker() {
    while (queue.length) {
      const key = queue.shift(), env = { ...environment, ...clientEnvironment(key, environment), NODE_ENV: 'production', SUITE_SOS_URL: `${origin}/sos`, SUITE_SOS_API: `${origin}/sos/api/backend/sos/api` };
      if (key !== 'website') {
        const prepared = spawnSync(process.execPath, [path.join(root, 'tools/vercel-prebuild.cjs')], { cwd: path.join(root, 'apps', key), env, stdio: 'inherit', windowsHide: true });
        if (prepared.error || prepared.status !== 0) throw prepared.error || Error(`${key} launcher setup failed.`);
      }
      console.log(`[local build] ${key}`);
      await new Promise((resolve, reject) => {
        const child = spawn(executable, ['--filter', packages[key], 'build'], { cwd: root, env, stdio: 'inherit', windowsHide: true, shell: process.platform === 'win32' });
        child.once('error', reject); child.once('exit', code => code === 0 ? resolve() : reject(Error(`${key} build failed (${code}).`)));
      });
      if (key !== 'website') {
        const cache = path.resolve(root, 'apps', key, '.next/cache');
        if (!cache.startsWith(root + path.sep + 'apps' + path.sep) || !apps.includes(key)) throw Error('Unsafe build cache target.');
        fs.rmSync(cache, { recursive: true, force: true });
      }
    }
  }
  await worker();
  fs.mkdirSync(path.dirname(marker), { recursive: true }); fs.writeFileSync(marker, JSON.stringify({ origin, digest: sourceDigest(), builtAt: new Date().toISOString() }, null, 2));
}
module.exports = { ready, build, sourceDigest };
if (require.main === module) {
  const host = process.env.ORGTIK_LOCAL_HOST || 'localhost', port = Number(process.env.ORGTIK_LOCAL_PORT || 3000);
  if (!['localhost','127.0.0.1'].includes(host) || !Number.isInteger(port) || port < 1024 || port > 65535) throw Error('Choose a valid local host and port.');
  build(`http://${host}:${port}`).catch(error => { console.error(error.message); process.exitCode = 1; });
}
