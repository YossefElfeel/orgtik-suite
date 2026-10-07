// Vercel returns JSON to agents and a URL in ordinary CI. Accept either without treating
// progress output as a deployment address.
import fs from "node:fs";
const text = fs.readFileSync(0, "utf8").trim();
let url;
try { const value = JSON.parse(text); url = value.deployment?.url || value.url; }
catch { url = text.split(/\r?\n/).map(line => line.trim()).find(line => /^https:\/\/[\w.-]+\.vercel\.app\/?$/.test(line)); }
if (url && /^[\w.-]+\.vercel\.app\/?$/.test(url)) url = `https://${url}`;
const parsed = url && URL.parse(url);
if (!parsed || parsed.protocol !== "https:" || !parsed.hostname.endsWith(".vercel.app") || parsed.username || parsed.password || parsed.search || parsed.hash) throw new Error("Vercel did not return a valid deployment URL");
console.log(parsed.origin);
