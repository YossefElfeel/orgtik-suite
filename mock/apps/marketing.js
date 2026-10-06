// Local mock backend for digital-marketing-frontend-main (web :3014, API :4005).
// Brands (projects), publishing (posts, approvals, comments, targets), labels, media gallery
// (@somion/gallery contract), campaigns (4 types with the onboarding wizard), boost, integrations
// (with a fully local OAuth wizard), audiences/segments/CSV imports, messaging senders/templates and
// analytics reports. All state is in memory and rebuilt from seed on restart (or POST /__reset).
const { buildSeed } = require("./marketing/seed");
const { makeViews } = require("./marketing/views");
const { makeHelpers } = require("./marketing/routes/common");
const media = require("./marketing/media");
const { DAY, nowIso, send } = require("./marketing/lib");

let db = buildSeed();
const getDb = () => db;

module.exports = {
  scopes: [
    {
      name: "digital_marketing",
      displayName: "Digital Marketing",
      description: "Plan, approve and publish social posts, run paid campaigns and track results across brands.",
      metadata: { icon: "solar:chart-square-bold", color: "#EC4899" },
    },
  ],

  // The app and this mock check these roles (marketing/roles.js); they also make the launcher tile show up for the marketing team
  // and the client (Nour Khaled reviews Nile Foods content). Reviewer lists are built from this grant.
  grants: {
    digital_marketing: {
      admin: ["super_admin"],
      manager: ["marketing_manager"],
      u12: ["marketing_specialist"],
      u14: ["content_writer"],
      customer: ["client_reviewer"],
    },
  },

  routes(app, ctx) {
    const views = makeViews(ctx, getDb);
    const h = makeHelpers(ctx, getDb, views);
    const svc = {};

    // Lazy scheduler, run by list/detail reads: publishes due posts, starts queued boosts, starts campaigns.
    function tick() {
      const now = Date.now();
      for (const p of db.posts) {
        if (p.status !== "SCHEDULED" || !svc.publishPost) continue;
        const when = views.effectiveScheduledAt(p);
        if (when && new Date(when).getTime() <= now) svc.publishPost(p);
      }
      for (const e of db.executions) {
        if (e.status === "QUEUED" && e.scheduledAt && new Date(e.scheduledAt).getTime() <= now) {
          Object.assign(e, { status: "ACTIVE", startedAt: e.scheduledAt, queueState: "completed", updatedAt: nowIso() });
          e.externalCampaignId = e.externalCampaignId || `23851${Date.now().toString().slice(-9)}`;
        }
        if (["ACTIVE", "RUNNING"].includes(e.status) && e.startedAt && new Date(e.startedAt).getTime() + e.durationDays * DAY <= now) {
          Object.assign(e, { status: "STOPPED", completedAt: new Date(new Date(e.startedAt).getTime() + e.durationDays * DAY).toISOString(), updatedAt: nowIso() });
        }
      }
      for (const c of db.campaigns) {
        if (c.status === "READY" && c.publishedAt && ["APPROVED", "NOT_REQUIRED"].includes(c.approvalStatus) && c.startAt && new Date(c.startAt).getTime() <= now) {
          c.status = "RUNNING";
          if (c.workflowState === "READY") c.workflowState = "RUNNING";
        }
      }
    }

    const deps = { ctx, getDb, views, h, tick, svc };
    // Role checks for every change (wave 5): see marketing/roles.js.
    app.use(require("./marketing/roles").roleGuard(ctx, getDb));
    media.routes(app);
    require("./marketing/routes/projects")(app, deps);
    require("./marketing/routes/posts")(app, deps);
    require("./marketing/routes/library")(app, deps);
    require("./marketing/routes/campaigns")(app, deps);
    require("./marketing/routes/integrations")(app, deps);
    require("./marketing/routes/insights")(app, deps);
    require("./marketing/routes/audience")(app, deps);

    // Rebuild the seed without restarting the servers (handy between QA runs).
    app.post("/__reset", (req, res) => {
      db = buildSeed();
      ctx.log("seed data reset");
      send(res, { ok: true }, "Marketing mock data reset");
    });

    ctx.log(`seeded ${db.projects.length} brands, ${db.posts.length} posts, ${db.campaigns.length} campaigns, ${db.integrations.length} integrations, ${db.gallery.length} media items`);
  },
};
