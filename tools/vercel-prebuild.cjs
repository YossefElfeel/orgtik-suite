// Runs before `next build` on Vercel (see each app's vercel.json). It points the installed
// @somion/sos-bar launcher at the hosted prototype's SOS app and mock API instead of the real
// sos.orgtik.xyz servers, the same edit local-dev/patch.js makes for localhost.
//   SUITE_SOS_URL   e.g. https://orgtik-suite-sos.vercel.app
//   SUITE_SOS_API   e.g. https://orgtik-suite-mock.vercel.app/sos/api
const fs = require("fs");
const path = require("path");

const SOS_URL = process.env.SUITE_SOS_URL;
const SOS_API = process.env.SUITE_SOS_API;
const file = path.join(process.cwd(), "node_modules", "@somion", "sos-bar", "dist", "constants", "index.js");

if (!fs.existsSync(file)) {
  console.log("[prebuild] @somion/sos-bar not installed here; nothing to patch");
  process.exit(0);
}
if (!SOS_URL || !SOS_API) {
  console.error("[prebuild] SUITE_SOS_URL and SUITE_SOS_API must be set");
  process.exit(1);
}
let src = fs.readFileSync(file, "utf8");
src = src
  .replace(/export const SOS_URL = [^\n]*/, `export const SOS_URL = ${JSON.stringify(SOS_URL)}; // [vercel prebuild]`)
  .replace(/export const API_URL = [^\n]*/, `export const API_URL = ${JSON.stringify(SOS_API)}; // [vercel prebuild]`);
// pnpm hard-links installed files to its shared store: replace the file instead of writing
// through the link, so the store itself stays untouched.
fs.rmSync(file);
fs.writeFileSync(file, src);
console.log(`[prebuild] sos-bar -> ${SOS_URL} (API ${SOS_API})`);
