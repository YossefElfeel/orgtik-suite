// Loaded only by the local Services entrypoint/development command.
process.env.ORGTIK_SERVICES_DEV = "1";
process.env.VERCEL_ENV = "development";
process.env.MOCK_SANDBOX = "services-local";
process.env.MOCK_AUTH_STORE = "file";
process.env.MOCK_JOURNAL = "file";
for (const key of Object.keys(process.env)) {
  if (/^(KV_|UPSTASH_|REDIS_|SUPABASE_)/i.test(key) || key === "MOCK_PERSISTENCE") delete process.env[key];
}
