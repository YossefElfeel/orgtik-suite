// Keep the local Services configuration outside Vercel's Git-root discovery.
const fs = require("node:fs");
const path = require("node:path");
const net = require("node:net");
const { spawn, spawnSync } = require("node:child_process");
const root = path.resolve(__dirname, "../..");
const origin = "http://localhost:3000";
const stateFile = path.join(root, ".vercel/local-suite/running.json");

async function available() {
  return new Promise((resolve, reject) => {
    const probe = net.createServer();
    probe.once("error", error => error.code === "EADDRINUSE" ? resolve(false) : reject(error));
    probe.listen(3000, "127.0.0.1", () => probe.close(() => resolve(true)));
  });
}
async function main() {
  if (!fs.existsSync(path.join(root, "node_modules", ".modules.yaml"))) throw new Error("Install dependencies first: pnpm install --frozen-lockfile");
  if (!(await available())) {
    let state;
    try {
      state = JSON.parse(fs.readFileSync(stateFile, "utf8"));
      if (!Number.isInteger(state.pid) || state.pid < 1) throw new Error("Invalid local process marker.");
      process.kill(state.pid, 0);
    }
    catch { throw new Error("Port 3000 is occupied. The existing process was left running."); }
    if (state.url !== origin || !Number.isInteger(state.pid)) throw new Error("Port 3000 is occupied by an unrecognized local process.");
    const response = await fetch(`${origin}/sos/api/backend/wm/v2/public/site`, { signal: AbortSignal.timeout(30000) });
    if (!response.ok) throw new Error("The existing local suite is still starting or needs attention; no second copy was started.");
    console.log(`OrgTik is already running at ${origin}\nSign in: ${origin}/sos/auth/login`);
    return;
  }
  const staging = path.join(path.dirname(root), ".orgtik-local");
  fs.mkdirSync(staging, { recursive: true });
  const workspace = fs.mkdtempSync(path.join(staging, "suite-"));
  for (const directory of ["apps", "mock", "packages", "tools", "node_modules", "tests"]) {
    const source = path.join(root, directory);
    if (fs.existsSync(source)) fs.symlinkSync(source, path.join(workspace, directory), process.platform === "win32" ? "junction" : "dir");
  }
  for (const file of ["package.json", "pnpm-lock.yaml", "pnpm-workspace.yaml", "turbo.json"]) fs.copyFileSync(path.join(root, file), path.join(workspace, file));
  fs.copyFileSync(path.join(root, "vercel.dev.json"), path.join(workspace, "vercel.json"));
  const env = { ...process.env };
  for (const key of Object.keys(env)) if (/^(KV_|UPSTASH_|REDIS_|VERCEL|MOCK_|ORGTIK_MOCK_|NEXT_PUBLIC_|VITE_)/i.test(key)) delete env[key];
  Object.assign(env, {
    SUITE_SERVICES_PUBLIC_URL: origin, ORGTIK_SERVICES_DEV: "1", VERCEL_ENV: "development",
    MOCK_AUTH_STORE: "file", MOCK_JOURNAL: "file", MOCK_SANDBOX: "services-local",
    VERCEL_TELEMETRY_DISABLED: "1", NEXT_TELEMETRY_DISABLED: "1",
  });
  // Older frontends still use the installed sos-bar's URL constants. Patch
  // them before starting any app so navigation and logout stay in this run.
  const launcherEnv = { ...env, SUITE_SOS_URL: `${origin}/sos`, SUITE_SOS_API: `${origin}/sos/api/backend/sos/api` };
  for (const key of require("./config.cjs").apps) {
    const result = spawnSync(process.execPath, [path.join(root, "tools/vercel-prebuild.cjs")], { cwd: path.join(root, "apps", key), env: launcherEnv, stdio: "inherit", windowsHide: true });
    if (result.error) throw result.error;
    if (result.status !== 0) throw new Error(`Could not configure ${key}'s local launcher.`);
  }
  console.log(`Starting the local website, nine apps and file-backed mock at ${origin}\nCtrl+C stops this run.`);
  const child = spawn(process.platform === "win32" ? "npx.cmd" : "npx", ["--yes", "vercel@63.1.2", "dev", "-L", "--listen", "127.0.0.1:3000", "--yes"], {
    cwd: workspace, env, stdio: "inherit", windowsHide: true, shell: process.platform === "win32",
  });
  fs.mkdirSync(path.dirname(stateFile), { recursive: true });
  fs.writeFileSync(stateFile, JSON.stringify({ pid: child.pid, url: origin, workspace, config: "vercel.dev.json", cliVersion: "63.1.2" }, null, 2));
  let stopping = false;
  const stop = () => {
    if (stopping || child.exitCode !== null) return;
    stopping = true;
    if (process.platform === "win32") spawnSync("taskkill", ["/PID", String(child.pid), "/T", "/F"], { windowsHide: true, stdio: "ignore" });
    else child.kill("SIGTERM");
  };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
  child.on("error", error => { console.error(error.message); process.exitCode = 1; });
  child.on("exit", code => { process.exitCode = stopping ? 0 : code || 0; });
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
