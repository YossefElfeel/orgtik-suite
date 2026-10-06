// Serves the website's build (dist/client) the way its host does, from its vercel.json: the
// redirects first, then a file (an address's own index.html), then the rewrites, else 404.html
// with a 404. Lets the harness and the flows check what visitors and search engines really get.
//
//   node host.mjs              http://127.0.0.1:4280
//   PORT=4181 node host.mjs
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
// SITE_APP serves another checkout's build (a worktree).
const APP = process.env.SITE_APP ?? path.resolve(here, "..", "..", "..", "orgtik-website", "landing-directions");
const vercel = JSON.parse(fs.readFileSync(path.join(APP, "vercel.json"), "utf8"));
const ROOT = path.join(APP, vercel.outputDirectory ?? "dist/client");
// Not 4190: that is on the Fetch standard's blocked-port list, so Node's fetch refuses it.
// Not 4190: it's on the Fetch standard's blocked-port list, so Node's fetch refuses to connect.
const PORT = Number(process.env.PORT ?? 4280);
const TYPES = { html: "text/html; charset=utf-8", js: "text/javascript", css: "text/css", svg: "image/svg+xml", webp: "image/webp", png: "image/png", jpg: "image/jpeg", mp4: "video/mp4", webm: "video/webm", woff2: "font/woff2", json: "application/json", xml: "application/xml", txt: "text/plain; charset=utf-8", ico: "image/x-icon" };

// "/projects/:path*" → a matcher that captures the named parts.
function pattern(source) {
  const names = [];
  const re = source.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\/:(\w+)\*/g, (_, n) => (names.push(n), "(?:/(.*))?")).replace(/:(\w+)\*/g, (_, n) => (names.push(n), "(.*)")).replace(/:(\w+)/g, (_, n) => (names.push(n), "([^/]+)"));
  const rx = new RegExp(`^${re}$`);
  return (p) => {
    const m = rx.exec(p);
    return m && Object.fromEntries(names.map((n, i) => [n, m[i + 1] ?? ""]));
  };
}
const fill = (dest, params) => dest.replace(/:(\w+)\*?/g, (_, n) => params[n] ?? "").replace(/\/$/, "") || "/";
// Read again whenever vercel.json changes: a pull writes new redirects, as a new deploy would.
let seen = "", redirects = [], rewrites = [];
function config() {
  const text = fs.readFileSync(path.join(APP, "vercel.json"), "utf8");
  if (text !== seen) {
    const v = JSON.parse(text);
    redirects = (v.redirects ?? []).map((r) => ({ ...r, match: pattern(r.source) }));
    rewrites = (v.rewrites ?? []).map((r) => ({ ...r, match: pattern(r.source) }));
    seen = text;
  }
}

function fileFor(p) {
  const full = path.join(ROOT, decodeURIComponent(p));
  if (!full.startsWith(ROOT)) return null;
  if (fs.existsSync(full) && fs.statSync(full).isFile()) return full;
  const index = path.join(full, "index.html");
  return fs.existsSync(index) ? index : null;
}
function send(res, file, status = 200) {
  if (!fs.existsSync(file)) {
    res.writeHead(500, { "content-type": "text/plain" });
    return res.end(`Not built: ${path.relative(ROOT, file)} (npm run build)`);
  }
  const ext = path.extname(file).slice(1).toLowerCase();
  res.writeHead(status, { "content-type": TYPES[ext] ?? "application/octet-stream" });
  fs.createReadStream(file).pipe(res);
}

http
  .createServer((req, res) => {
    config();
    const url = new URL(req.url, `http://${req.headers.host}`);
    const p = url.pathname.length > 1 ? url.pathname.replace(/\/$/, "") : url.pathname;
    for (const r of redirects) {
      const params = r.match(p);
      if (params) {
        res.writeHead(r.permanent ? 308 : 307, { location: fill(r.destination, params) + (r.destination.includes("#") ? "" : url.search) });
        return res.end();
      }
    }
    const file = fileFor(p);
    if (file) return send(res, file);
    for (const r of rewrites) {
      const params = r.match(p);
      if (params) return send(res, path.join(ROOT, fill(r.destination, params)));
    }
    send(res, path.join(ROOT, "404.html"), 404);
  })
  .listen(PORT, "127.0.0.1", () => console.log(`website build on http://127.0.0.1:${PORT}`));
