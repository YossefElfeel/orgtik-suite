// Signing in on the website signs in to the OrgTik suite (2026-10-07): the suite's identity API
// checks the email and password, gives a one-time code for the session, and SOS takes it at
// /auth/handoff, so no token travels in the address. The password is sent once and never kept.
//   VITE_SUITE_URL   the suite's home (SOS), e.g. https://orgtik-suite-sos.vercel.app
//   VITE_SUITE_API   its identity API, e.g. https://orgtik-suite-mock.vercel.app/sos/api
export const SUITE_URL = (
  import.meta.env?.VITE_SUITE_URL || "http://localhost:3013"
).replace(/\/$/, "");
const SUITE_API = (
  import.meta.env?.VITE_SUITE_API || "http://localhost:4000/api"
).replace(/\/$/, "");

const post = (path, body, token) =>
  fetch(`${SUITE_API}${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

// Resolves to { user, href } (href opens the suite signed in), or rejects with
// Error("credentials") for a wrong email or password and Error("unavailable") otherwise.
export async function signInToSuite(email, password) {
  let res;
  try {
    res = await post("/auth/login", { email, password });
  } catch {
    throw new Error("unavailable");
  }
  if (res.status === 401 || res.status === 403) throw new Error("credentials");
  if (!res.ok) throw new Error("unavailable");
  const { data } = await res.json();
  const token = data?.tokens?.accessToken;
  const handoff = token
    ? await post("/auth/handoff", null, token).catch(() => null)
    : null;
  if (!handoff?.ok) throw new Error("unavailable");
  const code = (await handoff.json())?.data?.code;
  if (!code) throw new Error("unavailable");
  return {
    user: data.user,
    href: `${SUITE_URL}/auth/handoff?code=${encodeURIComponent(code)}`,
  };
}
