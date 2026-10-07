// D-059 reconciliation of the existing website work order. R0 replaces its old payment
// adapter separately; this regression proves fulfilment never creates a CMS entitlement.
const { test } = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const net = require("node:net");
const express = require("express");
const { makeStore } = require("./store");
const appApi = require("./app-api");

test("Website Manager purchase creates one managed-service request and no tool access", async () => {
  const user = { id: 1, key: "admin", email: "buyer@fixture.test", firstName: "Buyer", lastName: "Fixture" };
  const identity = { users: [user], userFromReq: () => user, findByKey: key => key === user.key ? user : null, fullName: () => "Buyer Fixture" };
  const S = makeStore({ identity }), ws = S.workspace("ws_orgtik"), app = express();
  const H = { ok: (res, data, meta = {}, status = 200) => res.status(status).json({ data, meta }), fail: (res, status, code, message) => res.status(status).json({ error: { code, message } }), page: (req, res, data) => res.json({ data, meta: {} }) };
  appApi(app, { identity }, S, H);
  const body = { reference: "managed-service-one", currency: "EGP", lines: [{ catalogId: "website", kind: "software", name: "Website Manager", total: 5900, months: 3, autoRenew: true }] };
  const call = () => new Promise(resolve => {
    const req = new http.IncomingMessage(new net.Socket()); req.method = "POST"; req.url = "/v1/app/website-orders"; req.headers = { "x-workspace": ws.id }; req.body = body;
    const res = new http.ServerResponse(req); res.end = payload => { resolve({ status: res.statusCode, body: JSON.parse(String(payload)) }); return res; };
    app.handle(req, res);
  });
  const requestCount = S.db.serviceRequests.length;
  const before = S.db.invoices.length, first = await call(), repeat = await call();
  assert.equal(first.status, 201); assert.equal(repeat.status, 200);
  assert.deepEqual(repeat.body.data, first.body.data);
  assert.equal(first.body.data.tools.length, 0); assert.equal(first.body.data.requests.length, 1);
  assert.equal(S.db.serviceRequests.find(row => row.id === first.body.data.requests[0].id).serviceId, "svc_website");
  assert.equal(S.db.invoices.length, before + 1);
  assert.equal(S.db.serviceRequests.length, requestCount + 1);
  assert.equal(ws.lines.some(line => line.tool === "website"), false);
  assert.equal(S.db.plans.some(plan => plan.id === "website_pro"), false);
});
