// Vercel returns JSON to agents and a URL in ordinary CI. Accept either without treating
// progress output as a deployment address.
import fs from "node:fs";
const text = fs.readFileSync(0, "utf8").trim();
let url;
try { const value = JSON.parse(text); url = value.deployment?.url || value.url; }
catch { url = text.split(/\r?\n/).map(line => line.trim()).find(line => /^https:\/\/[\w.-]+\.vercel\.app\/?$/.test(line)); }
if (!url || new URL(url).protocol !== "https:") throw new Error("Vercel did not return a valid deployment URL");
console.log(url);
