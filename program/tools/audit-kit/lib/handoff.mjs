// Match the suite launcher: select the app's current context, then issue a
// single-use handoff code. Access tokens never belong in browser navigation URLs.
const send = (sosApi, request, endpoint, body, accessToken) => request(`${sosApi}/auth/${endpoint}`, {
  method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${accessToken}` },
  body: JSON.stringify(body), signal: AbortSignal.timeout(60000),
});

export async function selectAppSession(sosApi, appKey, token, request = globalThis.fetch) {
  const selected = await send(sosApi, request, "workspace", { mode: ["admin", "wm"].includes(appKey) ? "staff" : "workspace", target: appKey }, token);
  if (!selected.ok) throw Object.assign(new Error(`${appKey}: session selection answered ${selected.status}`), { status: selected.status });
  const accessToken = (await selected.json()).data?.tokens?.accessToken;
  if (!accessToken) throw new Error(`${appKey}: session selection returned no session`);
  return accessToken;
}

export async function createAppHandoff(sosApi, appKey, token, request = globalThis.fetch) {
  const accessToken = await selectAppSession(sosApi, appKey, token, request);
  const issued = await send(sosApi, request, "handoff", {}, accessToken);
  if (!issued.ok) throw new Error(`${appKey}: handoff creation answered ${issued.status}`);
  const code = (await issued.json()).data?.code;
  if (!code) throw new Error(`${appKey}: handoff creation returned no code`);
  return code;
}
