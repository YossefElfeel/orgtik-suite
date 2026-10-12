// Replay a read-only copy of production history. Never log account data,
// request bodies, tokens or checkpoints, or issue storage mutations.
const path = require('node:path'), os = require('node:os'), fs = require('node:fs');
async function main() {
  // The CLI's dotenv export can omit integration values. Use Vercel's documented
  // authenticated GET endpoints for ordinary encrypted variables only; never
  // change Secret protections or print any values.
  if (process.env.VERCEL_TOKEN && process.env.VERCEL_PROJECT_ID && process.env.VERCEL_ORG_ID) {
    const base = `https://api.vercel.com`, query = `?teamId=${encodeURIComponent(process.env.VERCEL_ORG_ID)}`;
    const get = async route => {
      const response = await fetch(base + route + query, { headers: { authorization: `Bearer ${process.env.VERCEL_TOKEN}` }, signal: AbortSignal.timeout(20000) });
      if (!response.ok) throw new Error(`Vercel configuration read answered ${response.status}`);
      return response.json();
    };
    const project = encodeURIComponent(process.env.VERCEL_PROJECT_ID);
    const { envs } = await get(`/v10/projects/${project}/env`);
    for (const variable of envs || []) {
      if (!['KV_REST_API_URL', 'KV_REST_API_TOKEN'].includes(variable.key) || !variable.target?.includes('production')) continue;
      console.log(JSON.stringify({ variable: variable.key, type: variable.type }));
      if (variable.type === 'sensitive' || variable.type === 'secret') continue;
      const resolved = await get(`/v1/projects/${project}/env/${encodeURIComponent(variable.id)}`);
      if (typeof resolved.value === 'string' && resolved.value) process.env[variable.key] = resolved.value;
    }
  }
  process.env.ORGTIK_MOCK_NO_LISTEN = '1';
  const config = require('../../mock/config');
  config.dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'orgtik-diagnose-'));
  const journal = require('../../mock/lib/journal');
  const picked = journal.pickStore(config);
  console.log(JSON.stringify({ storageConfiguration: {
    url: Boolean(process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL),
    token: Boolean(process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN),
    variableNames: Object.keys(process.env).filter(name => /KV_|REDIS|UPSTASH|MOCK_|SUITE_WEB/.test(name)),
  } }));
  if (picked.store?.kind !== 'redis') throw new Error('A configured Redis store is required.');
  const saved = await picked.store.snapshot(0);
  if (!saved.meta) throw new Error('Journal metadata is missing; nothing was changed.');
  const denied = () => { throw new Error('Diagnostic runs cannot write production storage.'); };
  journal.pickStore = () => ({ sandbox: picked.sandbox, store: {
    kind: 'redis', initialize: async () => saved.meta,
    snapshot: async (from = 0) => ({ ...saved, entries: saved.entries.slice(from) }),
    commit: denied, reset: denied, push: denied, clear: denied, setMeta: denied,
  } });
  const auth = require('../../mock/lib/auth-store');
  const accounts = await auth.pickStore(config).accounts();
  auth.pickStore = () => ({ kind: 'redis', accounts: async () => accounts, commit: denied });
  const { ready } = require('../../mock/server');
  try {
    await ready();
    console.log(JSON.stringify({ sandbox: picked.sandbox, revision: saved.revision, restored: true }));
  } catch (error) {
    console.error(JSON.stringify({ sandbox: picked.sandbox, revision: saved.revision, code: error.code || null, message: error.message, stack: error.stack?.split('\n').slice(1, 6) }));
    process.exitCode = 1;
  }
}
main().catch(error => { console.error(JSON.stringify({ code: error.code || null, message: error.message })); process.exitCode = 1; });
