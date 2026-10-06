// Generates platform-api.yaml (OpenAPI 3.1) from the platform mock itself, so the contract the
// backend team gets is exactly what the ADM and USR screens are built against.
//   node orgtik-program/phase-e/openapi.mjs            writes platform-api.yaml
//   node orgtik-program/phase-e/openapi.mjs --check    exits 1 if the file is out of date
// Paths, methods and guards (staff permission / workspace role) are read from the mock's routes;
// summaries and spec IDs come from SUMMARY below, and a route without one fails the run.
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const LOCAL = path.resolve(HERE, "../../local-dev");
const require = createRequire(path.join(LOCAL, "package.json"));
const express = require("express");
const identity = require(path.join(LOCAL, "lib/identity.js"));
const mod = require(path.join(LOCAL, "apps/admin.js"));

const app = express();
mod.routes(app, { identity, apiUrl: () => "", webUrl: () => "" });

// "METHOD /path" -> [summary, spec IDs, tag]
const SUMMARY = {
  "GET /v1/admin/me": ["The signed-in staff member: roles, permissions, links to the Website Manager", "ADM-01", "Staff"],
  "GET /v1/admin/overview": ["Platform overview: MRR (USD), workspaces, lines, invoices, requests and tickets by state", "ADM-02", "Overview"],
  "GET /v1/admin/tools": ["Tools with their status, plan, workspace and waitlist counts, and allowed next statuses", "ADM-03", "Tools"],
  "POST /v1/admin/tools": ["Add a tool (starts as coming soon; EN and AR names required)", "ADM-04", "Tools"],
  "GET /v1/admin/tools/{key}": ["One tool with its features and plans", "ADM-04", "Tools"],
  "PATCH /v1/admin/tools/{key}": ["Edit a tool or move its status; going beta or live notifies the waitlist", "ADM-03, ADM-04, US-A-04", "Tools"],
  "GET /v1/admin/features": ["Feature keys and limits (?tool=), with how many plans use each", "ADM-05", "Plans"],
  "POST /v1/admin/features": ["Add a feature flag or limit, keyed <tool>.<feature>", "ADM-05, G-20", "Plans"],
  "DELETE /v1/admin/features/{key}": ["Remove a feature no plan uses (409 lists the plans otherwise)", "ADM-05", "Plans"],
  "GET /v1/admin/plans": ["Plans (?tool=) with subscriber counts", "ADM-06", "Plans"],
  "POST /v1/admin/plans": ["Create a plan", "ADM-07", "Plans"],
  "GET /v1/admin/plans/{id}": ["One plan", "ADM-07", "Plans"],
  "PATCH /v1/admin/plans/{id}": ["Edit a plan's limits, flags, seats, trial and visibility (prices go through the grid)", "ADM-07", "Plans"],
  "GET /v1/admin/currencies": ["Currencies with decimals, rounding step and mode, and whether each is in use", "ADM-08", "Pricing"],
  "POST /v1/admin/currencies": ["Add a currency", "ADM-08", "Pricing"],
  "PATCH /v1/admin/currencies/{code}": ["Edit rounding or turn a currency off (409 while in use, R03-C5)", "ADM-08", "Pricing"],
  "GET /v1/admin/zones": ["Price zones with their currency and countries", "ADM-09", "Pricing"],
  "POST /v1/admin/zones": ["Add a zone", "ADM-10", "Pricing"],
  "PATCH /v1/admin/zones/{id}": ["Edit or turn off a zone; its workspaces queue for migration (R03-X5)", "ADM-10", "Pricing"],
  "GET /v1/admin/countries": ["Countries: zone, currency override, fixed prices", "ADM-11", "Pricing"],
  "PATCH /v1/admin/countries/{iso}": ["Move a country, override its currency (needs a rate, R03-X2) or fix prices", "ADM-11", "Pricing"],
  "GET /v1/admin/rates": ["Exchange rates", "ADM-15", "Pricing"],
  "PUT /v1/admin/rates": ["Set a rate; new purchases only (R03-P6)", "ADM-15", "Pricing"],
  "GET /v1/admin/grid": ["The price grid: plans × active zones, monthly and yearly, plus the open draft", "ADM-12", "Pricing"],
  "POST /v1/admin/price-drafts": ["Add cell changes to the open draft", "ADM-12", "Pricing"],
  "DELETE /v1/admin/price-drafts/{id}": ["Discard the draft", "ADM-12", "Pricing"],
  "POST /v1/admin/price-drafts/{id}/publish": ["Publish: new customers only, existing at next renewal with notice, or existing now (decreases only, R03-P5)", "ADM-12, R03-P3…P6", "Pricing"],
  "GET /v1/admin/price-preview": ["Resolve a plan's price for one or every country (R03-ALG-1…9)", "ADM-13", "Pricing"],
  "GET /v1/admin/pricing-log": ["Pricing change log", "ADM-14", "Pricing"],
  "GET /v1/admin/bundles": ["Bundles with example prices in four countries (R03-B1)", "ADM-16", "Bundles & coupons"],
  "POST /v1/admin/bundles": ["Create a bundle (2+ plans, a percentage)", "ADM-16", "Bundles & coupons"],
  "PATCH /v1/admin/bundles/{id}": ["Edit or turn off a bundle", "ADM-16", "Bundles & coupons"],
  "GET /v1/admin/coupons": ["Coupons with exhausted and expired flags", "ADM-17", "Bundles & coupons"],
  "POST /v1/admin/coupons": ["Create a coupon: percent, or fixed with one amount per currency (R03-K1, G-06)", "ADM-17", "Bundles & coupons"],
  "PATCH /v1/admin/coupons/{code}": ["Edit a coupon (its discount is frozen once redeemed)", "ADM-17", "Bundles & coupons"],
  "GET /v1/admin/tax-rules": ["Tax rules per country, with the G-12 display decision", "ADM-18, G-12", "Tax & gateways"],
  "PUT /v1/admin/tax-rules/{country}": ["Set a country's tax rule", "ADM-18", "Tax & gateways"],
  "GET /v1/admin/gateways": ["Payment gateways", "ADM-19", "Tax & gateways"],
  "PATCH /v1/admin/gateways/{id}": ["Edit a gateway: methods, countries, priority, active", "ADM-19", "Tax & gateways"],
  "GET /v1/admin/gateways/route": ["Which gateways serve a country and currency, in order", "ADM-19, G-11", "Tax & gateways"],
  "GET /v1/admin/workspaces": ["Customer workspaces (?q, state, country, tool), paged", "ADM-20", "Workspaces"],
  "GET /v1/admin/workspaces/{id}": ["One workspace: members, lines, invoices, tickets, requests, migration, audit", "ADM-21", "Workspaces"],
  "POST /v1/admin/workspaces/{id}/actions": ["suspend, reactivate, cancel, extend_trial, note, view_as (read-only, reason required, audited)", "ADM-21, D-017, G-25", "Workspaces"],
  "GET /v1/admin/migrations": ["Currency and country migrations", "ADM-21, R03-C4", "Workspaces"],
  "POST /v1/admin/migrations/{id}/approve": ["Approve a migration (applies at the next renewal)", "ADM-21, R03-C4", "Workspaces"],
  "POST /v1/admin/migrations/{id}/reject": ["Reject a migration", "ADM-21", "Workspaces"],
  "GET /v1/admin/custom-plans": ["Custom plan requests", "ADM-22", "Workspaces"],
  "POST /v1/admin/custom-plans/{id}/quote": ["Quote a custom plan in the workspace's currency", "ADM-22", "Workspaces"],
  "GET /v1/admin/invoices": ["Invoices (?state, workspaceId, currency), paged, with USD totals", "ADM-23", "Billing"],
  "POST /v1/admin/invoices": ["Create a manual invoice (draft)", "ADM-23", "Billing"],
  "GET /v1/admin/invoices/{id}": ["One invoice with payments, credit notes and the refundable amount", "ADM-23", "Billing"],
  "POST /v1/admin/invoices/{id}/void": ["Void an unpaid invoice (reason required)", "ADM-23", "Billing"],
  "POST /v1/admin/invoices/{id}/mark-paid": ["Record an offline payment", "ADM-23", "Billing"],
  "POST /v1/admin/invoices/{id}/refund": ["Refund in the original currency; issues a numbered credit note (R4, G-14)", "ADM-23", "Billing"],
  "POST /v1/admin/invoices/{id}/retry": ["Retry the payment", "ADM-23", "Billing"],
  "POST /v1/admin/invoices/{id}/issue": ["Issue a draft invoice", "ADM-23", "Billing"],
  "GET /v1/admin/services": ["Services with zone prices for packages", "ADM-24", "Services"],
  "PATCH /v1/admin/services/{id}": ["Edit a service", "ADM-24", "Services"],
  "GET /v1/admin/service-requests": ["Service requests (?state, mine), paged", "ADM-25", "Services"],
  "GET /v1/admin/service-requests/{id}": ["One service request", "ADM-25", "Services"],
  "POST /v1/admin/service-requests/{id}/actions": ["assign, review, quote, start, hold, deliver, milestone, message, cancel (Service Team: assigned only)", "ADM-25", "Services"],
  "GET /v1/admin/tickets": ["Support tickets (?state, mine), paged", "ADM-26", "Support"],
  "GET /v1/admin/tickets/{id}": ["One ticket with the conversation", "ADM-26", "Support"],
  "POST /v1/admin/tickets/{id}/actions": ["reply (or internal note), assign, resolve, close, priority", "ADM-26", "Support"],
  "GET /v1/admin/waitlist": ["Waitlist (?tool), paged", "ADM-29", "Tools"],
  "GET /v1/admin/staff/options": ["Who requests (?for=services) or tickets (?for=tickets) can be assigned to, for the people who assign them", "ADM-25, ADM-26", "Staff"],
  "GET /v1/admin/staff": ["Staff with their roles, plus the role and module matrix", "ADM-30", "Staff"],
  "PUT /v1/admin/staff/{key}/roles": ["Set a person's staff roles (no self lock-out)", "ADM-30", "Staff"],
  "GET /v1/admin/templates": ["Message templates with missing translations", "ADM-31", "Settings"],
  "PATCH /v1/admin/templates/{key}": ["Edit a template's subject and body per language", "ADM-31", "Settings"],
  "GET /v1/admin/reports": ["Reports in USD: MRR by tool and country, revenue, refunds, trials, churn (R03-R1…R3)", "ADM-32", "Reports"],
  "GET /v1/admin/settings": ["Platform settings and the open-gap switches", "ADM-33", "Settings"],
  "PATCH /v1/admin/settings": ["Edit retention, dunning, trial, services, limits, price-change notice, switches", "ADM-33", "Settings"],
  "GET /v1/admin/audit": ["Audit log, paged", "ADM-33", "Settings"],

  "GET /v1/app/me": ["The person, their workspace and others, tool states and the one banner to show", "USR-00, D-026", "Workspace"],
  "GET /v1/app/tools": ["Tool catalogue with state, trial days and the lowest price", "USR-04", "Tools"],
  "GET /v1/app/tools/{key}": ["One tool's plans priced for this workspace", "USR-05", "Tools"],
  "POST /v1/app/tools/{key}/waitlist": ["Join a coming-soon tool's waitlist", "USR-04, US-C-03", "Tools"],
  "POST /v1/app/tools/{key}/trial": ["Start a trial (one per tool per workspace, G-17)", "USR-06, F-02", "Tools"],
  "POST /v1/app/checkout/preview": ["Price a basket: proration, bundle, coupon, tax (R03-ALG-8)", "USR-07", "Checkout"],
  "POST /v1/app/checkout/confirm": ["Pay and activate; 402 changes nothing; the first payment locks the currency (R03-C2)", "USR-08, F-04", "Checkout"],
  "GET /v1/app/subscriptions": ["Subscription lines and the monthly total", "USR-09", "Subscriptions"],
  "POST /v1/app/subscriptions/{id}/cancel": ["Cancel at period end (a trial ends now)", "USR-09, F-07", "Subscriptions"],
  "POST /v1/app/subscriptions/{id}/resume": ["Undo a cancellation before it ends", "USR-09", "Subscriptions"],
  "POST /v1/app/subscriptions/{id}/downgrade": ["Schedule a downgrade for the period's end", "USR-09, F-07", "Subscriptions"],
  "POST /v1/app/subscriptions/{id}/cancel-downgrade": ["Cancel a scheduled downgrade", "USR-09", "Subscriptions"],
  "POST /v1/app/subscriptions/{id}/retry": ["Pay a failed renewal now", "USR-09, F-06", "Subscriptions"],
  "GET /v1/app/invoices": ["Invoices, paged", "USR-10", "Billing"],
  "GET /v1/app/invoices/{id}": ["One invoice with seller and buyer", "USR-10", "Billing"],
  "GET /v1/app/payment-methods": ["Payment methods", "USR-11", "Billing"],
  "POST /v1/app/payment-methods": ["Add a card (the gateway's hosted fields in production)", "USR-11", "Billing"],
  "PATCH /v1/app/payment-methods/{id}": ["Make a method the default", "USR-11", "Billing"],
  "DELETE /v1/app/payment-methods/{id}": ["Remove a method (not the last one renewals use)", "USR-11", "Billing"],
  "GET /v1/app/billing": ["Billing details, currency and tax", "USR-12", "Billing"],
  "PUT /v1/app/billing": ["Edit billing details; a new country after the lock queues a migration (R03-C4)", "USR-12", "Billing"],
  "GET /v1/app/team": ["Members, seats and the per-user lines (G-04 as a switch)", "USR-13", "Team"],
  "POST /v1/app/team/invite": ["Invite someone; returns the seat count after", "USR-14", "Team"],
  "PATCH /v1/app/team/{id}": ["Change a member's role or tools, or remove them", "USR-13", "Team"],
  "GET /v1/app/services": ["Service catalogue with prices and the subscriber discount", "USR-16", "Services"],
  "GET /v1/app/service-requests": ["The workspace's service requests, paged", "USR-18", "Services"],
  "POST /v1/app/service-requests": ["Request a service", "USR-17", "Services"],
  "GET /v1/app/service-requests/{id}": ["One request with quote, milestones, deliveries and messages", "USR-19", "Services"],
  "POST /v1/app/service-requests/{id}/actions": ["accept, pay, decline, approve, revise, message, cancel", "USR-19, USR-20", "Services"],
  "GET /v1/app/tickets": ["Tickets (admins see all, others their own), paged", "USR-21", "Support"],
  "POST /v1/app/tickets": ["Open a ticket", "USR-22", "Support"],
  "GET /v1/app/tickets/{id}": ["One ticket (internal notes hidden)", "USR-23", "Support"],
  "POST /v1/app/tickets/{id}/actions": ["reply (reopens), resolve", "USR-23", "Support"],
  "GET /v1/app/notifications": ["Notifications, paged", "USR-24", "Workspace"],
  "POST /v1/app/notifications/read": ["Mark notifications read (all, or ids)", "USR-24", "Workspace"],
  "GET /v1/app/custom-plans": ["Custom plan requests", "USR-25", "Checkout"],
  "POST /v1/app/custom-plans": ["Ask for a custom plan", "USR-25", "Checkout"],
  "POST /v1/app/custom-plans/{id}/accept": ["Accept a custom plan quote", "USR-25", "Checkout"],
  "PATCH /v1/app/workspace": ["Rename the workspace", "USR-26", "Workspace"],
  "POST /v1/app/workspace/delete": ["Delete the workspace (type its name; retention applies, G-22)", "USR-27", "Workspace"],

  "POST /v1/__mock/fail-next-payment": ["Mock only: make the next N payments fail", "", "Mock controls"],
  "POST /v1/__mock/advance": ["Mock only: run the lifecycle now", "", "Mock controls"],
};

// Express path -> OpenAPI paths (":a(x|y)" expands into one path per alternative).
function expand(p) {
  const m = p.match(/:(\w+)\(([^)]+)\)/);
  if (m) return m[2].split("|").flatMap((alt) => expand(p.replace(m[0], alt)));
  return [p.replace(/:(\w+)/g, "{$1}")];
}

const ops = [];
for (const layer of app._router.stack) {
  if (!layer.route) continue;
  const guard = layer.route.stack[0]?.handle ?? {};
  for (const method of Object.keys(layer.route.methods)) for (const p of expand(layer.route.path)) ops.push({ method: method.toUpperCase(), path: p, permission: guard.permission ?? null, role: guard.role ?? null, write: Boolean(guard.write) });
}
const missing = ops.filter((o) => !SUMMARY[`${o.method} ${o.path}`]).map((o) => `${o.method} ${o.path}`);
const stale = Object.keys(SUMMARY).filter((k) => !ops.some((o) => `${o.method} ${o.path}` === k));
if (missing.length || stale.length) {
  if (missing.length) console.error("Routes without a summary:\n  " + missing.join("\n  "));
  if (stale.length) console.error("Summaries for routes that don't exist:\n  " + stale.join("\n  "));
  process.exit(1);
}

const ROLE_TEXT = { guest: "any member of the workspace", member: "member or above", admin: "workspace admin or owner", owner: "workspace owner" };
const errorRef = (d) => ({ description: d, content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } });
const doc = {
  openapi: "3.1.0",
  info: {
    title: "OrgTik platform API (ADM and USR)",
    version: "0.1.0",
    description: [
      "The SaaS core of OrgTik_00–06: the staff back office (ADM, /v1/admin) and the customer workspace (USR, /v1/app).",
      "Generated from the local platform mock (local-dev/apps/admin.js) by orgtik-program/phase-e/openapi.mjs; the frontends are built against it.",
      "Envelope: success `{ data, meta }`, error `{ error: { code, message, requestId, fieldErrors?, required? } }`. Lists page with `page` and `pageSize` (25, at most 100).",
      "Staff routes need the permission named in `x-permission` (spec 02 matrix, 8 roles); 403 names it in `error.required`.",
      "Customer routes act in one workspace (`X-Workspace` header, else the person's first) and need the role in `x-workspace-role`; writes to a suspended workspace answer 423.",
      "Open decisions are switches in GET /v1/admin/settings: G-04 seat model, G-12 tax display, G-18 add-ons, G-21 General paid plans, G-24 hosting ops, G-28 mailboxes.",
    ].join("\n\n"),
  },
  servers: [{ url: "http://localhost:4008", description: "Local platform mock (ADM)" }, { url: "http://localhost:4000", description: "Local SOS API (USR routes only)" }],
  security: [{ bearer: [] }],
  tags: [...new Set(Object.values(SUMMARY).map((s) => s[2]))].map((name) => ({ name })),
  paths: {},
  components: {
    securitySchemes: { bearer: { type: "http", scheme: "bearer", description: "The SOS access token (handed over with a one-time code, never in a URL; D-017)." } },
    parameters: {
      Workspace: { name: "X-Workspace", in: "header", required: false, schema: { type: "string" }, description: "Workspace id; defaults to the person's first workspace." },
      Page: { name: "page", in: "query", schema: { type: "integer", minimum: 1 } },
      PageSize: { name: "pageSize", in: "query", schema: { type: "integer", minimum: 1, maximum: 100, default: 25 } },
    },
    schemas: {
      Error: { type: "object", required: ["error"], properties: { error: { type: "object", required: ["code", "message", "requestId"], properties: { code: { type: "string", examples: ["invalid", "forbidden", "wrong_state", "not_found", "payment_failed"] }, message: { type: "string" }, requestId: { type: "string" }, fieldErrors: { type: "object", additionalProperties: { type: "string" } }, required: { type: "string", description: "The missing permission or role" } } } } },
      Envelope: { type: "object", required: ["data", "meta"], properties: { data: {}, meta: { type: "object" } } },
      Localized: { type: "object", properties: Object.fromEntries(["en", "ar", "de", "fr", "it"].map((l) => [l, { type: "string" }])), required: ["en"] },
      Money: { type: "object", properties: { amount: { type: "number" }, currency: { type: "string", pattern: "^[A-Z]{3}$" } }, description: "Amounts are in the currency's minor-unit precision (KWD/BHD/OMR 3 decimals)." },
      Tool: { type: "object", properties: { key: { type: "string" }, name: { $ref: "#/components/schemas/Localized" }, status: { enum: ["coming_soon", "beta", "live", "retired"] }, mandatory: { type: "boolean" } } },
      ToolState: { enum: ["active", "trial", "beta", "read_only", "not_subscribed", "no_access", "coming_soon"], description: "USR-00 derived tool state" },
      Plan: { type: "object", properties: { id: { type: "string" }, tool: { type: "string" }, tier: { type: "string" }, name: { $ref: "#/components/schemas/Localized" }, perUser: { type: "boolean" }, minSeats: { type: "integer" }, trialDays: { type: "integer" }, yearlyDiscountPct: { type: "number" }, limits: { type: "object" }, flags: { type: "object" }, visibility: { enum: ["public", "private"] } } },
      Line: { type: "object", description: "A subscription line (state table: Subscription line)", properties: { id: { type: "string" }, tool: { type: "string" }, planId: { type: "string" }, cycle: { enum: ["monthly", "yearly"] }, state: { enum: ["free", "trialing", "active", "past_due", "read_only", "cancelling", "ended", "deleted"] }, periodEnd: { type: "string", format: "date-time" }, trialEndsAt: { type: "string", format: "date-time" }, graceEndsAt: { type: "string", format: "date-time" }, cancelAt: { type: "string", format: "date-time" }, snapshot: { type: "object", description: "The price the line pays (R03-P1)", properties: { amount: { type: "number" }, unit: { type: "number" }, quantity: { type: "integer" }, currency: { type: "string" }, source: { enum: ["Zone", "Zone (converted)", "Country", "Default", "Free"] }, priceVersion: { type: "integer" } } }, scheduled: { type: "object", properties: { kind: { enum: ["price_change", "downgrade"] }, effectiveAt: { type: "string", format: "date-time" } } } } },
      Workspace: { type: "object", properties: { id: { type: "string" }, name: { type: "string" }, country: { type: "string" }, currency: { type: "string" }, currencyLocked: { type: "boolean" }, state: { enum: ["active", "past_due", "suspended", "cancelled", "deleted"] } } },
      Invoice: { type: "object", description: "State table: Invoice", properties: { id: { type: "string" }, number: { type: "string", examples: ["INV-2026-001041"] }, state: { enum: ["draft", "open", "paid", "past_due", "void", "partially_refunded", "refunded"] }, currency: { type: "string" }, subtotal: { type: "number" }, tax: { type: "number" }, taxLabel: { type: ["string", "null"] }, total: { type: "number" }, refunded: { type: "number" }, payments: { type: "array", items: { type: "object" } }, creditNotes: { type: "array", items: { type: "object" } } } },
      Banner: { type: "object", properties: { kind: { enum: ["suspended", "read_only", "payment_failed", "trial_ending", "beta_billing", "price_change", "downgrade_scheduled"] }, tone: { enum: ["danger", "warning", "info", "neutral"] }, audience: { type: "string" }, action: { type: ["string", "null"] } } },
      ServiceRequest: { type: "object", description: "State table: Service request", properties: { id: { type: "string" }, number: { type: "string" }, state: { enum: ["new", "under_review", "quoted", "awaiting_payment", "in_progress", "in_review", "on_hold", "completed", "rejected", "expired", "cancelled"] } } },
      Ticket: { type: "object", description: "State table: Support ticket", properties: { id: { type: "string" }, number: { type: "string" }, state: { enum: ["open", "in_progress", "waiting_for_you", "resolved", "closed"] }, category: { type: "string" }, priority: { type: "string" } } },
    },
  },
};

for (const o of ops) {
  const [summary, spec, tag] = SUMMARY[`${o.method} ${o.path}`];
  const params = [...o.path.matchAll(/\{(\w+)\}/g)].map((m) => ({ name: m[1], in: "path", required: true, schema: { type: "string" } }));
  if (o.path.startsWith("/v1/app/")) params.push({ $ref: "#/components/parameters/Workspace" });
  const op = {
    tags: [tag],
    summary,
    ...(spec ? { description: `Spec: ${spec}.` } : {}),
    operationId: `${o.method.toLowerCase()}_${o.path.replace(/^\/v1\//, "").replace(/[{}]/g, "").replace(/[^a-zA-Z0-9]+/g, "_")}`,
    ...(params.length ? { parameters: params } : {}),
    ...(o.permission ? { "x-permission": o.permission } : {}),
    ...(o.role ? { "x-workspace-role": o.role, "x-role-text": ROLE_TEXT[o.role] } : {}),
    ...(["POST", "PUT", "PATCH"].includes(o.method) ? { requestBody: { required: false, content: { "application/json": { schema: { type: "object" } } } } } : {}),
    responses: {
      [o.method === "POST" && /\/(tools|plans|features|currencies|zones|bundles|coupons|invoices|payment-methods|service-requests|tickets|custom-plans|invite|trial|waitlist|confirm)$/.test(o.path) ? "201" : o.method === "DELETE" ? "204" : "200"]: o.method === "DELETE" ? { description: "Done" } : { description: "OK", content: { "application/json": { schema: { $ref: "#/components/schemas/Envelope" } } } },
      ...(o.path.startsWith("/v1/__mock") ? {} : { 401: errorRef("No session"), 403: errorRef(o.permission ? `Missing ${o.permission}` : "Not allowed for this role") }),
      ...(o.method !== "GET" && !o.path.startsWith("/v1/__mock") ? { 409: errorRef("Wrong state"), 422: errorRef("Invalid: see fieldErrors") } : {}),
      ...(o.write ? { 423: errorRef("The workspace is suspended") } : {}),
      ...(/checkout\/confirm|retry|actions$/.test(o.path) && o.path.startsWith("/v1/app/") ? { 402: errorRef("The payment failed; nothing changed") } : {}),
    },
  };
  if (o.path.startsWith("/v1/__mock")) op.security = [];
  (doc.paths[o.path] ??= {})[o.method.toLowerCase()] = op;
}

// Minimal YAML writer (quotes every string that YAML could misread).
function y(v, ind = "") {
  const q = (s) => (/^[\w./{}<>()$+-][\w ./{}()<>,#$@+:*'…→×-]*$/.test(s) && !/: | #|\s$|^(true|false|null|yes|no|on|off|\d.*)$/i.test(s) ? s : JSON.stringify(s));
  if (Array.isArray(v)) return v.length ? v.map((x) => `\n${ind}- ${y(x, ind + "  ").replace(/^\s+/, "")}`).join("") : " []";
  if (v && typeof v === "object") {
    const ks = Object.keys(v);
    if (!ks.length) return " {}";
    return ks.map((k) => {
      const val = v[k];
      const key = /^[\w$-]+$/.test(k) && !/^\d/.test(k) ? k : JSON.stringify(k);
      if (val && typeof val === "object") return `\n${ind}${key}:${y(val, ind + "  ")}`;
      return `\n${ind}${key}: ${typeof val === "string" ? q(val) : JSON.stringify(val)}`;
    }).join("");
  }
  return ` ${typeof v === "string" ? q(v) : JSON.stringify(v)}`;
}
if (process.argv.includes("--json")) { process.stdout.write(JSON.stringify(doc)); process.exit(0); }
const out = `# Generated by orgtik-program/phase-e/openapi.mjs from local-dev/apps/admin.js. Don't edit by hand.${y(doc)}\n`;
const file = path.join(HERE, "platform-api.yaml");
if (process.argv.includes("--check")) {
  const same = fs.existsSync(file) && fs.readFileSync(file, "utf8") === out;
  console.log(same ? "platform-api.yaml is up to date" : "platform-api.yaml is out of date: run node orgtik-program/phase-e/openapi.mjs");
  process.exit(same ? 0 : 1);
}
fs.writeFileSync(file, out);
console.log(`platform-api.yaml: ${Object.keys(doc.paths).length} paths, ${ops.length} operations`);
