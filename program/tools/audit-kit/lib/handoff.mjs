// Match the suite launcher: select the app's current context, then issue a
// single-use handoff code. Access tokens never belong in browser navigation URLs.
export async function createAppHandoff(sosApi, appKey, token, request = globalThis.fetch) {
  const send = (endpoint, body, accessToken) => request(`${sosApi}/auth/${endpoint}`, {
    method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(body), signal: AbortSignal.timeout(60000),
  });
  const selected = await send("workspace", { mode: ["admin", "wm"].includes(appKey) ? "staff" : "workspace", target: appKey }, token);
  if (!selected.ok) throw new Error(`${appKey}: session selection answered ${selected.status}`);
  const accessToken = (await selected.json()).data?.tokens?.accessToken;
  if (!accessToken) throw new Error(`${appKey}: session selection returned no session`);
  const issued = await send("handoff", {}, accessToken);
  if (!issued.ok) throw new Error(`${appKey}: handoff creation answered ${issued.status}`);
  const code = (await issued.json()).data?.code;
  if (!code) throw new Error(`${appKey}: handoff creation returned no code`);
  return code;
}
