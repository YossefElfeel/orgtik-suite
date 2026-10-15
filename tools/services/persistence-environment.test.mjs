import test from "node:test";
import assert from "node:assert/strict";
import { supabaseEnvironment } from "./persistence-environment.mjs";

const project = "abcdefghijklmnopqrst";
const fixture = () => ({ MOCK_PERSISTENCE: "supabase", SUPABASE_URL: `https://${project}.supabase.co`, SUPABASE_SECRET_KEY: ["sb", "secret", "fixture_key_for_unit_tests_only"].join("_"), MOCK_SESSION_SECRET: "session-key-for-deployment-fixtures-only" });
const legacyKey = payload => `eyJhbGciOiJIUzI1NiJ9.${Buffer.from(JSON.stringify(payload)).toString("base64url")}.fixture_signature`;

test("explicit CI Supabase configuration keeps credentials sensitive in both datasets", () => {
  const env = fixture(), rows = supabaseEnvironment({ ...env, VERCEL_TOKEN: "never-copy", NEXT_PUBLIC_SUPABASE_KEY: "never-copy" });
  assert.deepEqual(Object.fromEntries(rows.map(row => [row.key, row.value])), env);
  assert.ok(rows.every(row => row.target.join(",") === "production,preview"));
  assert.ok(rows.filter(row => ["SUPABASE_SECRET_KEY", "MOCK_SESSION_SECRET"].includes(row.key)).every(row => row.type === "sensitive"));
  assert.ok(rows.filter(row => ["MOCK_PERSISTENCE", "SUPABASE_URL"].includes(row.key)).every(row => row.type === "plain"));
  assert.ok(rows.every(row => !row.key.startsWith("NEXT_PUBLIC_") && !row.key.startsWith("VITE_")));
});

test("legacy service keys must have the privileged role and the matching project", () => {
  assert.ok(supabaseEnvironment({ ...fixture(), SUPABASE_SECRET_KEY: legacyKey({ role: "service_role", ref: project }) }));
  for (const payload of [{ role: "anon", ref: project }, { role: "service_role", ref: "other-project" }, { role: "service_role" }]) {
    assert.throws(() => supabaseEnvironment({ ...fixture(), SUPABASE_SECRET_KEY: legacyKey(payload) }), /provider values are omitted/);
  }
});

test("the preferred secret overrides retained legacy credentials and compatibility input is normalized", () => {
  const env = fixture();
  assert.equal(supabaseEnvironment({ ...env, SUPABASE_SERVICE_ROLE_KEY: "retained-legacy-key" }).find(row => row.key === "SUPABASE_SECRET_KEY").value, env.SUPABASE_SECRET_KEY);
  const rows = supabaseEnvironment({ ...env, SUPABASE_SECRET_KEY: undefined, SUPABASE_SERVICE_ROLE_KEY: env.SUPABASE_SECRET_KEY });
  assert.equal(rows.find(row => row.key === "SUPABASE_SECRET_KEY").value, env.SUPABASE_SECRET_KEY);
  assert.ok(rows.every(row => row.key !== "SUPABASE_SERVICE_ROLE_KEY"));
});

test("missing, redacted, malformed and public credentials fail closed without including a value in errors", () => {
  const invalid = [
    { MOCK_PERSISTENCE: "unknown-provider-private-value" },
    ...["SUPABASE_URL", "SUPABASE_SECRET_KEY", "MOCK_SESSION_SECRET"].flatMap(key => [{ [key]: undefined }, { [key]: "" }, { [key]: "[SENSITIVE]" }, { [key]: " private-value " }]),
    ...["https://outside.invalid", `http://${project}.supabase.co`, `https://private@${project}.supabase.co`, `https://${project}.supabase.co/private`, `https://${project}.supabase.co?private`, `https://${project}.supabase.co:444`].map(SUPABASE_URL => ({ SUPABASE_URL })),
    { SUPABASE_SECRET_KEY: "sb_publishable_private_fixture" }, { MOCK_SESSION_SECRET: "too-short-private-value" },
  ];
  for (const overrides of invalid) {
    assert.throws(() => supabaseEnvironment({ ...fixture(), ...overrides }), error => error.message.includes("provider values are omitted") && !error.message.includes("private-value"));
  }
});

test("legacy default remains Redis and an explicit Redis rollback ignores retained Supabase credentials", () => {
  assert.equal(supabaseEnvironment({ KV_REST_API_TOKEN: "private" }), null);
  assert.equal(supabaseEnvironment({ ...fixture(), MOCK_PERSISTENCE: "redis" }), null);
  assert.equal(supabaseEnvironment({ ...fixture(), MOCK_PERSISTENCE: "" }), null);
  assert.equal(supabaseEnvironment({ ...fixture(), MOCK_PERSISTENCE: undefined }), null);
});
