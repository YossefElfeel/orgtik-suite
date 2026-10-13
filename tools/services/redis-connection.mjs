// Connect the already approved mock store; never create storage or read secret values.
export async function ensureRedisConnection(api, { storeId, projectId, envVarPrefix }) {
  const resource = await api(`/v1/storage/stores/${storeId}`);
  if (resource.store?.id !== storeId) throw new Error("The existing Redis resource identity does not match.");
  const connections = resource.store.projectsMetadata || [];
  const destinations = connections.filter(row => row.projectId === projectId);
  if (destinations.length === 0) {
    await api(`/v1/storage/stores/${storeId}/connections`, "POST", {
      projectId, type: "integration", envVarEnvironments: ["production", "preview"],
      ...(typeof envVarPrefix === "string" ? { envVarPrefix } : {}),
    });
  } else if (!["production", "preview"].every(target => destinations.some(row => row.environments?.includes(target)))) {
    throw new Error("The new project's existing Redis connection does not cover both confirmed environments.");
  }
  const target = await api(`/v10/projects/${projectId}/env`);
  const rows = Array.isArray(target) ? target : target.envs || [];
  const inEnvironment = (row, env) => !row.gitBranch && (Array.isArray(row.target) ? row.target.includes(env) : row.target === env);
  const pairs = [["KV_REST_API_URL", "KV_REST_API_TOKEN"], ["UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN"]];
  if (!["production", "preview"].every(env => pairs.some(pair => pair.every(key => rows.some(row => row.key === key && inEnvironment(row, env)))))) {
    throw new Error("The connected Redis integration did not provide both required credential pairs.");
  }
}
