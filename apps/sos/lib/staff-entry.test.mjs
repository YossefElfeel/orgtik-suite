import assert from "node:assert/strict";
import { test } from "node:test";
import { staffRedirect, staffSessionAllowed } from "./staff-entry.ts";

const profile = () => ({ user: { id: 1 }, workspaceContext: null, scopes: [{ scope: "platform_admin", roles: ["super_admin"] }], staffAccess: { actorUserId: 1, apps: ["admin", "wm"], permissions: { admin: ["staff:view", "staff:full"] } } });

test("central people requires the actual staff administration profile and directory permission", () => {
  assert.equal(staffSessionAllowed(profile(), "admin", "staff:view"), true);
  const workspace = { ...profile(), workspaceContext: { actor: { readOnly: false } } };
  assert.equal(staffSessionAllowed(workspace, "admin", "staff:view"), false);
  const wm = { ...profile(), scopes: [{ scope: "website_manager", roles: ["wm_super_admin"] }] };
  assert.equal(staffSessionAllowed(wm, "admin", "staff:view"), false);
  const changed = profile(); changed.staffAccess.actorUserId = 2;
  assert.equal(staffSessionAllowed(changed, "admin", "staff:view"), false);
});

test("directory permission is specific to People without revoking other staff pages", () => {
  const finance = profile(); finance.scopes[0].roles = ["finance"]; finance.staffAccess.permissions.admin = ["billing:view", "billing:full"];
  assert.equal(staffSessionAllowed(finance, "admin", "staff:view"), false);
  assert.equal(staffSessionAllowed(finance, "admin"), true);
  finance.staffAccess.apps = ["wm"];
  assert.equal(staffSessionAllowed(finance, "admin"), false);
});

test("staff handoff redirects remain within normalized central-management routes", () => {
  assert.equal(staffRedirect("/people/123/scopes?tool=website_manager"), "/people/123/scopes?tool=website_manager");
  assert.equal(staffRedirect("/systems/../people?search=Demo"), "/people?search=Demo");
  for (const value of [null, "https://other.test", "//other.test/people", "/\\other.test", "/people/../../auth/login", "/people/%2e%2e/account", "/people/%2e%2e%2fauth", "/people/123\\..\\auth", "/people\n//other.test", "/account/preferences"])
    assert.equal(staffRedirect(value), "/people", String(value));
});
