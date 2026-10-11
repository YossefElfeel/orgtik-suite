// Test controls use the same current staff authority as the application. A Vercel
// preview access token only passes deployment protection; it is not an app session.
export async function mockAdministratorToken(sosApi, target = "admin", request = globalThis.fetch) {
  const send = (endpoint, body, token) => request(`${sosApi}/api/auth/${endpoint}`, {
    method: "POST",
    headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(60000),
  });
  const login = await send("login", { email: "mona.adel@orgtik.test", password: "Local@2026" });
  if (!login.ok) throw new Error(`Mock administrator sign-in answered ${login.status}`);
  const identityToken = (await login.json()).data?.tokens?.accessToken;
  if (!identityToken) throw new Error("Mock administrator sign-in returned no session");
  const switched = await send("workspace", { mode: "staff", target }, identityToken);
  if (!switched.ok) throw new Error(`Mock administrator context answered ${switched.status}`);
  const token = (await switched.json()).data?.tokens?.accessToken;
  if (!token) throw new Error("Mock administrator context returned no session");
  return token;
}

export async function mockControlRequest({ sosApi, url, method = "POST", body, target = "admin" }, request = globalThis.fetch) {
  const token = await mockAdministratorToken(sosApi, target, request);
  return request(url, {
    method,
    headers: { authorization: `Bearer ${token}`, ...(body === undefined ? {} : { "content-type": "application/json" }) },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(60000),
  });
}
