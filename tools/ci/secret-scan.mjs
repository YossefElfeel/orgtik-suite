// Fails when a tracked file holds something that looks like a real secret: private keys, signed
// JWTs, cloud or GitHub tokens, or a Vercel/Upstash token. (The mock's own test tokens are unsigned
// and generated at run time, so they never appear in the source.)
//   node tools/ci/secret-scan.mjs
import { execFileSync } from "node:child_process";
import fs from "node:fs";

const PATTERNS = [
  ["private key", /-----BEGIN [A-Z ]*PRIVATE KEY-----/],
  ["signed JWT", /\beyJ[\w-]{10,}\.eyJ[\w-]{10,}\.(?!local-dev-signature)[\w-]{20,}/],
  ["AWS access key", /\bAKIA[0-9A-Z]{16}\b/],
  ["GitHub token", /\b(ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{30,}\b|\bgithub_pat_[A-Za-z0-9_]{40,}\b/],
  ["Slack token", /\bxox[abprs]-[A-Za-z0-9-]{10,}/],
  ["Upstash/Vercel KV token", /\b(KV_REST_API_TOKEN|UPSTASH_REDIS_REST_TOKEN)\s*[=:]\s*["']?[A-Za-z0-9=_-]{20,}/],
  ["Vercel token", /\bVERCEL_TOKEN\s*[=:]\s*["']?[A-Za-z0-9]{20,}/],
];
const SKIP = /(^|\/)(pnpm-lock\.yaml|package-lock\.json)$|\.(png|jpe?g|gif|webp|avif|ico|pdf|zip|tgz|woff2?|ttf|otf|mp4|webm|docx)$/i;

const files = execFileSync("git", ["ls-files", "-z"], { encoding: "utf8", maxBuffer: 1 << 28 }).split("\0").filter((f) => f && !SKIP.test(f));
const hits = [];
for (const f of files) {
  let text;
  try { text = fs.readFileSync(f, "utf8"); } catch { continue; }
  if (text.length > 5_000_000) continue;
  text.split(/\r?\n/).forEach((line, i) => {
    for (const [what, re] of PATTERNS) if (re.test(line)) hits.push(`${f}:${i + 1}: ${what}`);
  });
}
if (hits.length) {
  console.error(`secret scan: ${hits.length} finding(s)`);
  for (const h of hits) console.error(`  ${h}`);
  process.exit(1);
}
console.log(`secret scan: ${files.length} files, nothing found`);
