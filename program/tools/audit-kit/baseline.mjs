// Runs the audits one app at a time, for machines with little free disk. For each app it starts
// only that app's dev server (with the same command as local-dev/start-all.js), runs the sweep and
// then the dead-end detector, and stops the server. With --clean it also deletes the app's .next
// build output before and after, so at most one app's build is on disk at any moment. Finally it
// writes the report.
//
//   node baseline.mjs --clean                         every app, in wave order
//   node baseline.mjs --apps hr,marketing --clean
//   node baseline.mjs --no-deadends                   sweeps only
//
// Needs the local-dev mock running (node server.js in local-dev), and no dev server of an app in
// the run: it stops if an app's port is already taken rather than audit a server it didn't start.
// Dev server output goes to local-dev/logs/devserver-<app>.log.
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { APPS, MIN_FREE_MB, WORKSPACE, apiUrl, args, freeMB, webUrl } from "./lib/suite.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const config = require(path.join(WORKSPACE, "local-dev", "config.js"));
const LOGS = path.join(WORKSPACE, "local-dev", "logs");

// Wave order: if a long run is interrupted, the apps refactored first are done first.
const ORDER = ["files", "sos", "tasks", "chats", "hr", "marketing", "sales", "content"];
const opt = args({ label: "baseline", "min-free-mb": String(MIN_FREE_MB) });
const wanted = opt.apps ? String(opt.apps).split(",") : ORDER.filter((a) => APPS[a]);
const minFree = Number(opt["min-free-mb"]);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const clock = () => new Date().toTimeString().slice(0, 8);
const say = (m) => console.log(`\n[baseline ${clock()}] ${m}`);

const answers = async (url, ms = 3000) => {
  try {
    await fetch(url, { signal: AbortSignal.timeout(ms), redirect: "manual" });
    return true;
  } catch {
    return false;
  }
};

// Deletes <app dir>/.next, and nothing else: the path is checked before anything is removed.
async function cleanBuild(app) {
  const dir = path.join(WORKSPACE, config.apps[app].dir, ".next");
  if (path.basename(dir) !== ".next" || !dir.startsWith(WORKSPACE + path.sep) || !fs.existsSync(dir)) return;
  for (let i = 0; i < 10; i++) {
    try {
      fs.rmSync(dir, { recursive: true, force: true });
      return;
    } catch {
      await sleep(2000); // Windows keeps files locked for a moment after the server exits
    }
  }
  console.log(`  couldn't delete ${dir}`);
}

function startServer(app) {
  const a = config.apps[app];
  const dir = path.join(WORKSPACE, a.dir);
  const devScript = JSON.parse(fs.readFileSync(path.join(dir, "package.json"), "utf8")).scripts?.dev || "";
  const argv = a.devArgs || (/\s-p\s|--port/.test(devScript) ? ["run", "dev"] : ["run", "dev", "--", "-p", String(a.web)]);
  fs.mkdirSync(LOGS, { recursive: true });
  const log = fs.openSync(path.join(LOGS, `devserver-${app}.log`), "w");
  // Same cookie-size reason as start-all.js: raise Node's 16 KB header limit.
  const env = { ...process.env, NODE_OPTIONS: `${process.env.NODE_OPTIONS || ""} --max-http-header-size=65536`.trim() };
  return spawn("npm", argv, { cwd: dir, shell: true, stdio: ["ignore", log, log], env });
}

async function waitReady(app, ms = 300000) {
  const url = webUrl(app) + APPS[app].auth.split("?")[0];
  const until = Date.now() + ms;
  while (Date.now() < until) {
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(90000), redirect: "manual" });
      if (r.status < 500) return true;
    } catch {}
    await sleep(2000);
  }
  return false;
}

async function stopServer(app, child) {
  if (process.platform === "win32") spawnSync("taskkill", ["/pid", String(child.pid), "/T", "/F"], { stdio: "ignore" });
  else child.kill("SIGINT");
  for (let i = 0; i < 20 && (await answers(webUrl(app))); i++) await sleep(1000);
}

const step = (script, app, extra = []) =>
  spawnSync(process.execPath, [path.join(here, script), ...(app ? ["--apps", app] : []), ...extra], { cwd: here, stdio: "inherit" }).status;

if (!(await answers(`${apiUrl("sos")}/__health`))) {
  console.error(`The mock isn't running on ${apiUrl("sos")}: start it with "node server.js" in local-dev.`);
  process.exit(1);
}
for (const app of wanted) {
  if (!APPS[app] || !config.apps[app]) {
    console.error(`Unknown app: ${app}`);
    process.exit(1);
  }
  if (await answers(webUrl(app))) {
    console.error(`${app}'s port is already in use (${webUrl(app)}). Stop that dev server first.`);
    process.exit(1);
  }
}
if (opt.clean) {
  say(`deleting the build output of ${wanted.join(", ")} (rebuilt on the next start)`);
  for (const app of wanted) await cleanBuild(app);
}

const done = [];
let failure = "";
for (const app of wanted) {
  const free = freeMB();
  if (free < minFree) {
    failure = `only ${free} MB free on the workspace drive (the floor is ${minFree} MB)`;
    break;
  }
  const started = Date.now();
  say(`${app}: starting its dev server (${free} MB free)`);
  const child = startServer(app);
  try {
    if (!(await waitReady(app))) {
      failure = `${app}'s dev server didn't answer within 5 minutes (see local-dev/logs/devserver-${app}.log)`;
      break;
    }
    say(`${app}: sweep`);
    const s = step("sweep.mjs", app, ["--label", opt.label]);
    if (s !== 0) {
      failure = `the ${app} sweep exited with ${s}`;
      break;
    }
    if (!opt["no-deadends"]) {
      say(`${app}: dead-end detector`);
      const d = step("deadends.mjs", app, ["--from", opt.label, "--label", opt.label]);
      if (d !== 0) {
        failure = `the ${app} dead-end run exited with ${d}`;
        break;
      }
    }
    done.push({ app, minutes: Math.round((Date.now() - started) / 60000) });
  } finally {
    await stopServer(app, child);
    if (opt.clean) await cleanBuild(app);
  }
}

if (done.length) {
  say("report");
  step("report.mjs", null, ["--label", opt.label]);
  console.table(done);
}
if (failure) {
  console.log(`\nStopped: ${failure}.`);
  process.exitCode = 2;
}
