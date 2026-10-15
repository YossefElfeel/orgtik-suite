// GitHub Actions supplies server credentials only to the configure step. Never
// pull secret values back out of Vercel or weaken their sensitive protection.
const required = ["SUPABASE_URL", "MOCK_SESSION_SECRET"];
const unavailable = () => new Error("The confirmed Supabase persistence configuration is incomplete or invalid; provider values are omitted.");

export function supabaseEnvironment(env) {
  const provider = env?.MOCK_PERSISTENCE;
  // An unset repository variable keeps the legacy provider, even when credentials
  // have already been installed in repository secrets for a later migration.
  if (provider === "redis" || provider === undefined || provider === "") return null;
  if (provider !== "supabase") throw unavailable();
  if (required.some(key => typeof env?.[key] !== "string" || !env[key] || env[key] === "[SENSITIVE]" || env[key] !== env[key].trim())) throw unavailable();
  let url;
  try { url = new URL(env.SUPABASE_URL); } catch { throw unavailable(); }
  // A hosted Supabase project origin is the only approved credential destination.
  // Paths, user-info and custom origins could redirect privileged API requests.
  const project = /^([a-z]{20})\.supabase\.co$/.exec(url.hostname)?.[1];
  if (!project || url.protocol !== "https:" || url.port || url.username || url.password || url.pathname !== "/" || url.search || url.hash) throw unavailable();
  const key = env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY;
  if (typeof key !== "string" || !key || key === "[SENSITIVE]" || key !== key.trim()) throw unavailable();
  if (!/^sb_secret_[A-Za-z0-9_-]{20,}$/.test(key)) {
    // Validate the role and project of a legacy key without treating its unsigned
    // payload as authentication. Supabase verifies its signature on every call.
    let payload;
    try {
      if (!/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(key)) throw unavailable();
      payload = JSON.parse(Buffer.from(key.split(".")[1], "base64url").toString("utf8"));
    } catch { throw unavailable(); }
    if (payload?.role !== "service_role" || payload.ref !== project) throw unavailable();
  }
  if (Buffer.byteLength(env.MOCK_SESSION_SECRET, "utf8") < 32) throw unavailable();
  return [
    { key: "MOCK_PERSISTENCE", value: "supabase", type: "plain", target: ["production", "preview"] },
    { key: "SUPABASE_SECRET_KEY", value: key, type: "sensitive", target: ["production", "preview"] },
    ...required.map(key => ({ key, value: env[key], type: key === "SUPABASE_URL" ? "plain" : "sensitive", target: ["production", "preview"] })),
  ];
}
