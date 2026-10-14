const { createHash, randomUUID } = require("node:crypto");
const { ROLES, PERMISSIONS, permissionsFor } = require("./permissions");
const { capabilities } = require("./users");
const codec = require("./state-codec");
const PROTECTED = new Set(["wm_owner", "wm_super_admin"]);
const versionOf = (label, permissions) =>
  createHash("sha256")
    .update(JSON.stringify([label, [...permissions].sort()]))
    .digest("hex");

function validateRoleDefinitions(value) {
  const definitions = codec.object(value ?? {});
  for (const [key, definition] of Object.entries(definitions)) {
    if ((!Object.hasOwn(ROLES, key) && !/^wm_custom_[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/.test(key)) ||
      !definition || typeof definition !== "object" || Array.isArray(definition) ||
      Object.keys(definition).some(key => key !== "label") ||
      typeof definition.label !== "string" || !definition.label.trim() || definition.label.trim() !== definition.label || definition.label.length > 100)
      throw codec.fail("Website Manager role definitions are invalid.");
  }
  const labels = Object.keys({...ROLES, ...definitions}).map(key => (definitions[key]?.label ?? ROLES[key].label).toLocaleLowerCase());
  if (new Set(labels).size !== labels.length) throw codec.fail("Website Manager role names must be unique.");
  return definitions;
}

function validateRoleOverrides(value, definitions = {}) {
  const overrides = codec.object(value ?? {});
  for (const [key, permissions] of Object.entries(overrides)) {
    if (
      (!Object.hasOwn(ROLES, key) && !Object.hasOwn(definitions, key)) ||
      !Array.isArray(permissions) ||
      permissions.some((p) => !PERMISSIONS.includes(p)) ||
      new Set(permissions).size !== permissions.length
    )
      throw codec.fail("Website Manager role permissions are invalid.");
  }
  for (const key of Object.keys(definitions)) {
    if (!Object.hasOwn(ROLES, key) && !Object.hasOwn(overrides, key))
      throw codec.fail("Website Manager custom role permissions are missing.");
  }
  return overrides;
}

function registerRoles(app, { identity, store, overrides, definitions = {}, need, ok, fail }) {
  const keys = () => [...new Set([...Object.keys(ROLES), ...Object.keys(definitions)])];
  const assigned = key => {
    const people = new Set(Object.entries(identity.grants?.website_manager ?? {}).filter(([, grant]) => grant.roles?.includes(key)).map(([person]) => person));
    for (const user of identity.users ?? []) {
      if (identity.userScopes?.(user).some(scope => scope.scope === "website_manager" && scope.roles.includes(key))) people.add(user.key);
    }
    return people.size;
  };
  const labelOf = key => definitions[key]?.label ?? ROLES[key]?.label;
  const role = (key) => ({
    key,
    label: labelOf(key),
    permissions: permissionsFor([key], overrides),
    version: versionOf(labelOf(key), permissionsFor([key], overrides)),
    protected: PROTECTED.has(key),
    builtin: Object.hasOwn(ROLES, key),
    labelOverridden: Boolean(definitions[key]),
    assignedCount: assigned(key),
  });
  const permissionsValid = permissions => Array.isArray(permissions) && permissions.every(p => PERMISSIONS.includes(p)) && new Set(permissions).size === permissions.length;
  const labelValid = (label, except) => typeof label === "string" && label.trim().length > 0 && label.trim().length <= 100 && !keys().some(key => key !== except && labelOf(key).toLocaleLowerCase() === label.trim().toLocaleLowerCase());
  const log = (req, key, action) => store.audit.unshift({at: new Date().toISOString(), by: req.who.user.key, type: "role", action, entry: key, targetName: labelOf(key)});
  app.get("/v2/admin/roles", need("settings:view"), (_req, res) =>
    ok(res, keys().map(role)),
  );
  app.post("/v2/admin/roles", need("roles:manage"), (req, res) => {
    const { label, permissions } = req.body ?? {};
    if (!labelValid(label)) return fail(res, 422, "invalid_label", "Choose a unique role name, up to 100 characters.");
    if (!permissionsValid(permissions)) return fail(res, 422, "invalid_permissions", "Choose valid capabilities.");
    if (Object.keys(definitions).filter(key => !Object.hasOwn(ROLES, key)).length >= 100) return fail(res, 409, "role_limit", "There are too many custom roles.");
    const key = "wm_custom_" + randomUUID();
    definitions[key] = {label: label.trim()};
    overrides[key] = [...permissions].sort();
    log(req, key, "role_create");
    ok(res, role(key), {}, 201);
  });
  app.patch("/v2/admin/roles/:key", need("roles:manage"), (req, res) => {
    const key = req.params.key;
    if (!keys().includes(key))
      return fail(res, 404, "not_found", "Role not found.");
    if (PROTECTED.has(key) && !capabilities(identity, req.who.user).accounts)
      return fail(
        res,
        403,
        "suite_admin_required",
        "Only central super administrators can change this role.",
      );
    if (req.get("if-match") !== role(key).version)
      return fail(
        res,
        412,
        "stale",
        "This role changed. Reload it before saving.",
      );
    const label = Object.hasOwn(req.body ?? {}, "label") ? req.body.label : labelOf(key);
    if (!labelValid(label, key)) return fail(res, 422, "invalid_label", "Choose a unique role name, up to 100 characters.");
    const permissions = Object.hasOwn(req.body ?? {}, "permissions") ? req.body.permissions : role(key).permissions;
    if (!permissionsValid(permissions))
      return fail(
        res,
        422,
        "invalid_permissions",
        "Choose valid capabilities.",
      );
    const next = permissionsFor(req.who.roles, {
      ...overrides,
      [key]: permissions,
    });
    if (
      ["roles:manage", "users:manage", "settings:view"].some(
        (p) => req.who.permissions.includes(p) && !next.includes(p),
      )
    )
      return fail(
        res,
        409,
        "self_lockout",
        "You cannot remove your own administration access.",
      );
    if (req.body?.label !== undefined) {
      if (ROLES[key]?.label === label.trim()) delete definitions[key];
      else definitions[key] = {label: label.trim()};
    }
    overrides[key] = [...permissions].sort();
    log(req, key, req.body?.label !== undefined ? "role_update" : "role_permissions");
    ok(res, role(key));
  });
  app.delete("/v2/admin/roles/:key", need("roles:manage"), (req, res) => {
    const key = req.params.key;
    if (!keys().includes(key)) return fail(res, 404, "not_found", "Role not found.");
    if (Object.hasOwn(ROLES, key)) return fail(res, 409, "builtin_role", "Built-in roles cannot be deleted.");
    if (req.get("if-match") !== role(key).version) return fail(res, 412, "stale", "This role changed. Reload it before deleting.");
    if (assigned(key)) return fail(res, 409, "role_in_use", "Reassign every user before deleting this role.");
    log(req, key, "role_delete");
    delete definitions[key];
    delete overrides[key];
    res.status(204).end();
  });
}
module.exports = { registerRoles, validateRoleOverrides, validateRoleDefinitions, PROTECTED };
