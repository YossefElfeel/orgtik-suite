// Image bytes live outside the business journal's bounded JSON checkpoint. In
// hosted previews, reuse the realm's Redis storage so cold starts retain them.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const CHUNK = 128 * 1024;
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const unavailable = () => Object.assign(new Error('media_content_unavailable'), {status:503, code:'media_content_unavailable'});

function imageStorage({uploadsDir, realm = process.env.MOCK_SANDBOX || 'demo', hosted = false, env = process.env, fetcher = (...args) => fetch(...args)}) {
  const url = env.KV_REST_API_URL || env.UPSTASH_REDIS_REST_URL;
  const credential = env.KV_REST_API_TOKEN || env.UPSTASH_REDIS_REST_TOKEN;
  const durable = Boolean(url && credential);
  const prefix = `orgtik:wm-images:${realm}:`;
  async function command(args) {
    if (!durable) throw unavailable();
    try {
      const response = await fetcher(url.replace(/\/$/, ''), {method:'POST', headers:{authorization:`Bearer ${credential}`, 'content-type':'application/json'}, body:JSON.stringify(args), signal:AbortSignal.timeout(10000)});
      if (!response.ok) throw unavailable();
      const body = await response.json();
      if (body.error) throw unavailable();
      return body.result;
    } catch { throw unavailable(); }
  }
  async function batches(count, action) {
    const result = [];
    for (let i = 0; i < count; i += 4) result.push(...await Promise.all(Array.from({length:Math.min(4, count-i)}, (_, n) => action(i+n))));
    return result;
  }
  function filename(file) {
    if (!/^md_\d+-[\w.-]+$/.test(file)) throw unavailable();
    return path.join(uploadsDir, file);
  }
  return {
    async write(file, bytes) {
      const target = filename(file);
      if (!Buffer.isBuffer(bytes) || !bytes.length || bytes.length > 15*1024*1024) throw unavailable();
      if (hosted && !durable) throw unavailable();
      if (durable) {
        const digest = hash(bytes);
        const saved = await batches(Math.ceil(bytes.length/CHUNK), i => command(['SET', `${prefix}${digest}:${i}`, bytes.subarray(i*CHUNK, (i+1)*CHUNK).toString('base64')]));
        if (saved.some(result => result !== 'OK')) throw unavailable();
      }
      fs.mkdirSync(uploadsDir, {recursive:true});
      fs.writeFileSync(target, bytes);
    },
    async read(row) {
      const target = filename(row.file);
      if (!/^[a-f0-9]{64}$/.test(row.hash) || !Number.isSafeInteger(row.bytes) || row.bytes < 1 || row.bytes > 15*1024*1024) throw unavailable();
      if (fs.existsSync(target)) {
        const bytes = fs.readFileSync(target);
        if (bytes.length === row.bytes && hash(bytes) === row.hash) return bytes;
      }
      const parts = await batches(Math.ceil(row.bytes/CHUNK), i => command(['GET', `${prefix}${row.hash}:${i}`]));
      if (parts.some(part => typeof part !== 'string')) throw unavailable();
      const bytes = Buffer.concat(parts.map(part => Buffer.from(part, 'base64')));
      if (bytes.length !== row.bytes || hash(bytes) !== row.hash) throw unavailable();
      return bytes;
    },
  };
}
module.exports = {imageStorage};
