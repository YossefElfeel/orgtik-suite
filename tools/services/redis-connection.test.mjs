import test from "node:test";
import assert from "node:assert/strict";
import { ensureRedisConnection } from "./redis-connection.mjs";
const storeId = "store_fixture", projectId = "prj_fixture";
function fixture({ connections = [], env = ["production", "preview"], identity = storeId } = {}) {
  const calls = [];
  const api = async (route, method = "GET", body) => {
    calls.push({ route, method, body });
    if (route === `/v1/storage/stores/${storeId}`) return { store: { id: identity, projectsMetadata: connections } };
    if (route.endsWith("/connections")) return {};
    return { envs: ["UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN"].map(key => ({ key, target: env, value: "[SENSITIVE]" })) };
  };
  return { api, calls };
}
test("reconnects the approved store without a surviving source project or exporting credentials", async () => {
  const { api, calls } = fixture();
  await ensureRedisConnection(api, { storeId, projectId });
  assert.deepEqual(calls.filter(call => call.method === "POST"), [{ route: `/v1/storage/stores/${storeId}/connections`, method: "POST", body: { projectId, type: "integration", envVarEnvironments: ["production", "preview"] } }]);
  assert.ok(!JSON.stringify(calls).includes("[SENSITIVE]"));
});
test("existing complete connections are reused and an inherited variable prefix is preserved", async () => {
  const complete = fixture({ connections: [{ projectId, environments: ["production", "preview"] }] });
  await ensureRedisConnection(complete.api, { storeId, projectId });
  assert.equal(complete.calls.filter(call => call.method === "POST").length, 0);
  const fresh = fixture();
  await ensureRedisConnection(fresh.api, { storeId, projectId, envVarPrefix: "KV" });
  assert.equal(fresh.calls.find(call => call.method === "POST").body.envVarPrefix, "KV");
});
test("wrong resources, partial connections and missing preview credentials stop provisioning", async () => {
  for (const options of [{ identity: "store_wrong" }, { connections: [{ projectId, environments: ["production"] }] }, { env: ["production"] }]) {
    const { api } = fixture(options);
    await assert.rejects(ensureRedisConnection(api, { storeId, projectId }));
  }
});
