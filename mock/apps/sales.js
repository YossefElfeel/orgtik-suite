// Local mock backend for sales-dashboardv2-main (OrgTik Sales). All routes live under /api on this app's
// API port (NEXT_PUBLIC_API_URL=http://localhost:4003/api). Code is split across ./sales/*.js:
//   reference.js  currencies / countries / languages / VAT     catalog-data.js  multilingual catalog content
//   seed.js       catalog + people seed                          seed-deals.js    deal history via the services
//   core.js       request context, notifications, files          catalog.js       zones → plans/packages + pricing
//   deals.js      projects, contracts, offers                    billing.js       subscriptions, invoices, commissions, coupons, loyalty
//   crm.js        customers, salesmen, staff                     engage.js        notifications, activity feed, tickets, dashboards, currency
const fs = require("fs");

const { seedCatalog, seedPeople, seedCoupons, seedLoyalty } = require("./sales/seed");

const S = { db: {}, io: null };

function init(ctx) {
  Object.assign(S, { ctx, util: ctx.util, identity: ctx.identity, config: ctx.config });
  const db = S.db;
  Object.assign(db, {
    projects: [], contracts: [], offers: [], subscriptions: [], invoices: [], commissions: [], tickets: [],
    notifications: [], notificationPrefs: {}, couponUses: [],
  });
  // Seeded documents are regenerated on every start; keep uploads made at runtime.
  fs.mkdirSync(ctx.uploadsDir, { recursive: true });
  S.core = require("./sales/core")(S);
  seedCatalog(db, S.identity);
  seedPeople(db, S.identity, { writeSeed: S.core.writeSeed, sosWeb: S.config.webUrl("sos") });
  seedCoupons(db);
  seedLoyalty(db);
  S.catalog = require("./sales/catalog")(S);
  S.billing = require("./sales/billing")(S);
  S.deals = require("./sales/deals")(S);
  S.crm = require("./sales/crm")(S);
  S.engage = require("./sales/engage")(S);
  require("./sales/seed-deals")(S);
  ctx.log(`seeded ${db.plans.length} plans, ${db.features.length} features, ${db.customers.length} customers, ${db.projects.length} projects, ${db.subscriptions.length} subscriptions, ${db.invoices.length} invoices, ${db.notifications.length} notifications`);
}

// Profile preferences the sales UI stores in its own vocabulary (kept apart from the shared SOS profile).
const profilePrefs = {};
const DATE_FORMATS = { "DD/MM/YYYY": "dd/mm/yyyy", "MM/DD/YYYY": "mm/dd/yyyy", "YYYY/MM/DD": "yyyy/mm/dd" };
const LANG_NAMES = { en: "English", fr: "French", de: "German", es: "Spanish", it: "Italian", ar: "Arabic" };

module.exports = {
  scopes: [
    {
      name: "sales",
      displayName: "Sales",
      description: "Plans, deals, subscriptions, invoices and commissions for the OrgTik sales team and customers.",
      metadata: { icon: "solar:graph-up-bold", color: "#0EA5E9" },
    },
  ],
  // The app and this mock take the role from these grants (wave 6); they also feed SOS / the launcher.
  // The SOS app forwards customers that hold the "sales" scope straight to this app.
  grants: {
    sales: {
      admin: ["admin"],
      manager: ["manager"],
      u15: ["manager"],
      sales: ["salesman"],
      u13: ["salesman"],
      customer: ["customer"],
    },
  },

  routes(app, ctx) {
    init(ctx);
    S.engage.publicRoutes(app);
    S.crm.publicRoutes(app); // website lead intake (D-028), before the auth context
    app.use("/api", S.core.contextMiddleware);
    S.catalog.routes(app);
    S.deals.routes(app);
    S.billing.routes(app);
    S.crm.routes(app);
    S.engage.routes(app);
  },

  // socket.io namespace /notifications (spec/notifications-api.md §5): token from auth / query / header.
  sockets(io, ctx) {
    S.io = io;
    io.on("connection", () => {});
    io.of("/notifications").on("connection", (socket) => {
      const hs = socket.handshake || {};
      const raw = hs.auth?.token || hs.query?.token || hs.headers?.authorization || "";
      const tokenValue = String(raw).replace(/^Bearer\s+/i, "").replace(/^"|"$/g, "").trim();
      const user = ctx.identity.userFromToken(tokenValue);
      if (!user) {
        socket.disconnect(true);
        return;
      }
      socket.join(`user:${user.id}`);
      socket.emit("connected", { message: "Connected to notifications", userId: user.id });
      socket.on("ping", () => socket.emit("pong", { timestamp: new Date().toISOString() }));
    });
  },

  // Fallbacks on the shared SOS/auth API (port 4000) for the profile screen (authSosApi): only used when the
  // SOS module itself does not implement these paths.
  mounts: {
    sos(app, ctx) {
      const identity = ctx.identity;
      const { ok, fail } = ctx.util;
      function profileOut(u) {
        const p = u.profile || {};
        const o = profilePrefs[u.id] || {};
        return {
          id: u.id, email: u.email, username: u.username, firstName: u.firstName, lastName: u.lastName, avatar: u.avatar, userType: u.userType,
          isActive: u.isActive, isEmailVerified: u.isEmailVerified, createdAt: u.createdAt, updatedAt: u.updatedAt, phone: u.phone || null,
          jobTitle: p.jobTitle ?? null, department: p.department ?? null, bio: p.about ?? null,
          language: o.language || LANG_NAMES[p.language] || p.language || "English", timeZone: p.timeZone || "UTC", weekStartDay: p.weekStartDay || "sunday",
          dateFormat: o.dateFormat || DATE_FORMATS[p.dateFormat] || "dd/mm/yyyy", timeFormat: o.timeFormat || (p.timeFormat === "12h" ? "12 hour" : "24 hour"),
          flyoutToastMessage: p.flyoutToastMessage ?? true, timezoneChangeNotification: p.timezoneChangeNotification ?? true,
        };
      }
      // The sales UI reads the profile both unwrapped (authProfileData.firstName) and wrapped (data.firstName).
      const send = (res, u, message) => {
        const profile = profileOut(u);
        res.status(200).json({ success: true, statusCode: 200, message, data: profile, ...profile });
      };
      app.get("/api/auth/profile", (req, res) => {
        const u = identity.requireUser(req, res);
        if (u) send(res, u, "Profile fetched");
      });
      app.put("/api/auth/profile", (req, res) => {
        const u = identity.requireUser(req, res);
        if (!u) return;
        const b = req.body || {};
        if (b.firstName !== undefined) u.firstName = String(b.firstName).trim() || u.firstName;
        if (b.lastName !== undefined) u.lastName = String(b.lastName).trim() || u.lastName;
        if (b.phone !== undefined) u.phone = b.phone || null;
        u.profile = u.profile || {};
        if (b.jobTitle !== undefined) u.profile.jobTitle = b.jobTitle || null;
        if (b.department !== undefined) u.profile.department = b.department || null;
        if (b.bio !== undefined) u.profile.about = b.bio || null;
        if (b.timeZone !== undefined) u.profile.timeZone = b.timeZone;
        if (b.weekStartDay !== undefined) u.profile.weekStartDay = b.weekStartDay;
        if (b.flyoutToastMessage !== undefined) u.profile.flyoutToastMessage = !!b.flyoutToastMessage;
        if (b.timezoneChangeNotification !== undefined) u.profile.timezoneChangeNotification = !!b.timezoneChangeNotification;
        profilePrefs[u.id] = { ...(profilePrefs[u.id] || {}), ...(b.language ? { language: b.language } : {}), ...(b.dateFormat ? { dateFormat: b.dateFormat } : {}), ...(b.timeFormat ? { timeFormat: b.timeFormat } : {}) };
        u.updatedAt = new Date().toISOString();
        send(res, u, "Profile updated successfully");
      });
      app.post("/api/auth/change-password", (req, res) => {
        const u = identity.requireUser(req, res);
        if (!u) return;
        const { oldPassword, newPassword } = req.body || {};
        if (oldPassword !== u.password) return fail(res, 400, "Current password is incorrect");
        if (!newPassword || String(newPassword).length < 8) return fail(res, 422, "New password must be at least 8 characters");
        // The shared local password stays unchanged so every tester can keep signing in.
        ok(res, null, "Password changed successfully (local mock: the shared local password is kept)");
      });
      app.post("/api/auth/avatar", ctx.upload.single("avatar"), (req, res) => {
        const u = identity.requireUser(req, res);
        if (!u) return;
        if (!req.file) return fail(res, 422, "Choose an image to upload");
        u.avatar = ctx.fileUrl(req.file.filename);
        u.updatedAt = new Date().toISOString();
        send(res, u, "Avatar updated");
      });
      app.delete("/api/auth/avatar", (req, res) => {
        const u = identity.requireUser(req, res);
        if (!u) return;
        u.avatar = null;
        u.updatedAt = new Date().toISOString();
        send(res, u, "Avatar removed");
      });
    },
  },
};

