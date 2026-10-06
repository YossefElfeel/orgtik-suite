// Local stand-in for the SOS identity backend (sosback.orgtik.*): users, scopes, tokens, /api/auth/*.
// Every app module shares these people so the same names show up across all tools.
const config = require("../config");
const { nowIso, daysFromNow, ok, fail } = require("./util");

// Password for every local test account. Local only; documented in local-dev/README.md.
const LOCAL_PASSWORD = "Local@2026";

// key → person. Keys are what app modules use in `grants`.
const PEOPLE = [
  { key: "admin", firstName: "Mona", lastName: "Adel", email: "mona.adel@orgtik.test", userType: "admin", jobTitle: "Chief Executive Officer", department: "Management" },
  { key: "manager", firstName: "Karim", lastName: "Hassan", email: "karim.hassan@orgtik.test", userType: "manager", jobTitle: "Operations Manager", department: "Operations" },
  { key: "employee", firstName: "Salma", lastName: "Nabil", email: "salma.nabil@orgtik.test", userType: "employee", jobTitle: "Frontend Developer", department: "Engineering" },
  { key: "sales", firstName: "Omar", lastName: "Farouk", email: "omar.farouk@orgtik.test", userType: "salesman", jobTitle: "Sales Executive", department: "Sales" },
  { key: "customer", firstName: "Nour", lastName: "Khaled", email: "nour.khaled@nilefoods.test", userType: "customer", jobTitle: "Marketing Director", department: "Nile Foods" },
  { key: "finance", firstName: "Hany", lastName: "Samir", email: "hany.samir@orgtik.test", userType: "employee", jobTitle: "Finance Manager", department: "Finance" },
  { key: "u7", firstName: "Youssef", lastName: "Ibrahim", email: "youssef.ibrahim@orgtik.test", userType: "employee", jobTitle: "Backend Developer", department: "Engineering" },
  { key: "u8", firstName: "Laila", lastName: "Mostafa", email: "laila.mostafa@orgtik.test", userType: "employee", jobTitle: "UI/UX Designer", department: "Design" },
  { key: "u9", firstName: "Ahmed", lastName: "Tarek", email: "ahmed.tarek@orgtik.test", userType: "employee", jobTitle: "QA Engineer", department: "Engineering" },
  { key: "u10", firstName: "Rana", lastName: "Saad", email: "rana.saad@orgtik.test", userType: "employee", jobTitle: "HR Specialist", department: "Human Resources" },
  { key: "u11", firstName: "Mahmoud", lastName: "Gamal", email: "mahmoud.gamal@orgtik.test", userType: "employee", jobTitle: "DevOps Engineer", department: "Engineering" },
  { key: "u12", firstName: "Dina", lastName: "Fathy", email: "dina.fathy@orgtik.test", userType: "employee", jobTitle: "Marketing Specialist", department: "Marketing" },
  { key: "u13", firstName: "Tamer", lastName: "Wagdy", email: "tamer.wagdy@orgtik.test", userType: "salesman", jobTitle: "Account Manager", department: "Sales" },
  { key: "u14", firstName: "Hoda", lastName: "Ashraf", email: "hoda.ashraf@orgtik.test", userType: "employee", jobTitle: "Content Writer", department: "Marketing" },
  { key: "u15", firstName: "Sherif", lastName: "Magdy", email: "sherif.magdy@orgtik.test", userType: "manager", jobTitle: "Project Manager", department: "Engineering" },
  { key: "u16", firstName: "Aya", lastName: "Hamed", email: "aya.hamed@orgtik.test", userType: "employee", jobTitle: "Accountant", department: "Finance" },
];

const users = PEOPLE.map((p, i) => {
  const createdAt = daysFromNow(-400 + i * 11);
  return {
    id: i + 1,
    key: p.key,
    email: p.email,
    username: `${p.firstName}.${p.lastName}`.toLowerCase(),
    firstName: p.firstName,
    lastName: p.lastName,
    avatar: null,
    isActive: true,
    isEmailVerified: true,
    managerId: p.key === "admin" ? null : p.key === "manager" || p.key === "u15" ? 1 : 2,
    userType: p.userType,
    phone: `+2010${String(12345670 + i * 137).slice(0, 8)}`,
    password: LOCAL_PASSWORD,
    createdAt,
    updatedAt: createdAt,
    profile: {
      id: i + 1,
      jobTitle: p.jobTitle,
      department: p.department,
      about: null,
      language: "en",
      timeZone: "Africa/Cairo",
      weekStartDay: "saturday",
      dateFormat: "DD/MM/YYYY",
      timeFormat: "24h",
      flyoutToastMessage: true,
      timezoneChangeNotification: true,
      createdAt,
      updatedAt: createdAt,
    },
  };
});

// ---- scopes & grants (filled by server.js from each app module) ----
const scopes = [];
const grants = {}; // scopeName -> { userKey: { roles, permissions } }

function addScope(def, appKey) {
  if (scopes.some((s) => s.name === def.name)) return;
  const createdAt = daysFromNow(-420);
  scopes.push({
    id: scopes.length + 1,
    name: def.name,
    displayName: def.displayName || def.name,
    domain: def.domain || (appKey ? config.webUrl(appKey) : config.webUrl("sos")),
    description: def.description || "",
    isActive: def.isActive !== false,
    metadata: def.metadata || { icon: "solar:widget-bold", color: "#8135cd" },
    createdAt,
    updatedAt: createdAt,
  });
}

function addGrants(scopeName, map) {
  grants[scopeName] = grants[scopeName] || {};
  for (const [userKey, v] of Object.entries(map || {})) {
    const entry = Array.isArray(v) ? { roles: v, permissions: [] } : { roles: v.roles || [], permissions: v.permissions || [] };
    grants[scopeName][userKey] = entry;
  }
}

// Called once by server.js with every loaded app module.
function registerModules(modules) {
  addScope({ name: "global", displayName: "Global", description: "Access to the whole Orgtik suite.", metadata: { icon: "solar:home-2-bold", color: "#BBBBBB" } }, "sos");
  for (const m of modules) {
    for (const s of m.scopes || []) addScope(s, s.web || m.key);
    for (const [scopeName, map] of Object.entries(m.grants || {})) addGrants(scopeName, map);
  }
  // Every seeded person is at least a member of the global scope; the admin is super admin.
  const g = grants.global || (grants.global = {});
  for (const u of users) if (!g[u.key]) g[u.key] = { roles: [], permissions: [] };
  if (!g.admin || g.admin.roles.length === 0) g.admin = { roles: ["super_admin"], permissions: [] };
}

// [{ scope, roles, permissions }] for a user, only scopes where they have an entry.
function userScopes(user) {
  const out = [];
  for (const s of scopes) {
    const e = grants[s.name]?.[user.key];
    if (e) out.push({ scope: s.name, roles: [...e.roles], permissions: [...e.permissions] });
  }
  return out;
}

const scopeByName = (name) => scopes.find((s) => s.name === name);

// ---- users ----
const findUser = (id) => users.find((u) => String(u.id) === String(id));
const findByKey = (key) => users.find((u) => u.key === key);
const findByEmail = (email) => users.find((u) => u.email.toLowerCase() === String(email || "").toLowerCase());
const fullName = (u) => `${u.firstName} ${u.lastName}`;

// The IApiUser/IUser shape the SOS API returns (no password, no internal key).
function publicUser(u) {
  if (!u) return null;
  const { password, key, ...rest } = u;
  return { ...rest, deletedAt: u.deletedAt ?? null };
}

// ---- tokens (JWT-shaped, unsigned; the frontends never verify signatures) ----
const b64 = (obj) => Buffer.from(JSON.stringify(obj)).toString("base64url");
function makeToken(user, type, ttlSec, extra = {}) {
  const iat = Math.floor(Date.now() / 1000);
  return `${b64({ alg: "HS256", typ: "JWT" })}.${b64({ sub: user.id, id: user.id, email: user.email, userType: user.userType, type, iat, exp: iat + ttlSec, ...extra })}.local-dev-signature`;
}
function issueTokens(user, extra = {}) {
  const expiresIn = 30 * 24 * 3600;
  return { accessToken: makeToken(user, "access", expiresIn, extra), refreshToken: makeToken(user, "refresh", 90 * 24 * 3600, extra), expiresIn };
}
function decode(token) {
  try {
    const payload = JSON.parse(Buffer.from(String(token).split(".")[1], "base64url").toString("utf8"));
    if (payload.exp && payload.exp * 1000 < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

// Token from "Authorization: Bearer x", a JSON-stringified token object, ?token=, or a socket handshake.
function tokenFrom(req) {
  let t = req.headers?.authorization || req.headers?.Authorization || "";
  if (t.toLowerCase().startsWith("bearer ")) t = t.slice(7);
  if (!t && req.query?.token) t = req.query.token;
  t = String(t || "").trim().replace(/^"|"$/g, "");
  if (t.startsWith("{")) {
    try { t = JSON.parse(t).accessToken || ""; } catch { /* keep as is */ }
  }
  return t || null;
}

// Deactivated or deleted users are signed out even if they still hold a token.
function userFromToken(token) {
  const p = token && decode(token);
  const u = p ? findUser(p.sub ?? p.id) : null;
  return u && u.isActive !== false && !u.deletedAt ? u : null;
}
const userFromReq = (req) => userFromToken(tokenFrom(req));

// Express middleware-ish helper: returns the user or sends 401 and returns null.
function requireUser(req, res) {
  const u = userFromReq(req);
  if (!u) {
    fail(res, 401, "Unauthorized");
    return null;
  }
  return u;
}

function authPayload(user, extraTokenClaims) {
  return { user: publicUser(user), tokens: issueTokens(user, extraTokenClaims), scopes: userScopes(user), roles: [...new Set(userScopes(user).flatMap((s) => s.roles))], permissions: [] };
}

// ---- /api/auth/* core routes (mounted on the SOS API port before the SOS module) ----
function routes(app) {
  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body || {};
    const u = findByEmail(email);
    if (!u || password !== u.password) return fail(res, 401, "Invalid email or password. Please try again.");
    if (!u.isActive) return fail(res, 403, "This account is deactivated.");
    return ok(res, authPayload(u), "Login successful");
  });

  app.get("/api/auth/me", (req, res) => {
    const u = requireUser(req, res);
    if (!u) return;
    return ok(res, { user: publicUser(u), scopes: userScopes(u) }, "Profile fetched");
  });

  // Scopes the SoSBar launcher shows (it adds "global" itself).
  app.get("/api/auth/my-scopes", (req, res) => {
    const u = requireUser(req, res);
    if (!u) return;
    const names = new Set(userScopes(u).map((s) => s.scope));
    return ok(res, scopes.filter((s) => s.name !== "global" && s.isActive && names.has(s.name)), "Scopes fetched");
  });

  app.post("/api/auth/refresh", (req, res) => {
    const u = userFromToken(req.body?.refreshToken) || userFromReq(req);
    if (!u) return fail(res, 401, "Invalid refresh token");
    // Keep an impersonation session alive across refreshes.
    const claims = decode(req.body?.refreshToken) || {};
    return ok(res, issueTokens(u, claims.impersonatedBy ? { impersonatedBy: claims.impersonatedBy, ...(claims.readOnly ? { readOnly: true } : {}) } : {}), "Token refreshed");
  });

  app.post("/api/auth/logout", (req, res) => ok(res, null, "Logged out"));

  // The hand-off between suite apps without a token in the address (FS-SOS-2, D-017 as proposed):
  // the launcher asks for a one-time code from the signed-in session; the app it opens sends the
  // code back here and gets the session's access token in the response body. A code works once,
  // for 60 seconds. (A proposal for the real API; the mock keeps codes in memory.)
  app.post("/api/auth/handoff", (req, res) => {
    const token = tokenFrom(req);
    if (!token || !userFromToken(token)) return fail(res, 401, "Unauthorized");
    const code = require("crypto").randomBytes(24).toString("base64url");
    handoffs.set(code, { token, expiresAt: Date.now() + 60 * 1000 });
    return ok(res, { code, expiresIn: 60 }, "Hand-off code created");
  });

  app.post("/api/auth/handoff/exchange", (req, res) => {
    const code = String(req.body?.code || "");
    const h = handoffs.get(code);
    handoffs.delete(code);
    if (!h || h.expiresAt < Date.now() || !userFromToken(h.token)) return fail(res, 400, "This sign-in link has expired or was already used.");
    return ok(res, { accessToken: h.token }, "Signed in");
  });
}
const handoffs = new Map(); // code -> { token, expiresAt }

module.exports = {
  LOCAL_PASSWORD, users, scopes, grants,
  registerModules, userScopes, scopeByName,
  findUser, findByKey, findByEmail, fullName, publicUser,
  issueTokens, decode, tokenFrom, userFromToken, userFromReq, requireUser, authPayload,
  routes, nowIso,
};
