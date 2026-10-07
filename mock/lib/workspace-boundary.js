const crypto = require("node:crypto");
const path = require("node:path");
const express = require("express");
const cors = require('cors');
const { AsyncLocalStorage } = require("node:async_hooks");
const { createSessionAuthority } = require("./session-authority");
const sessionStorage = require("./session-store");
const { createContextService } = require("./session-context");
const { createRuntimeRegistry } = require("./workspace-runtime");
const { initializeWorkspaceAuthority, assignInitialOwnerSeats, APP_TO_TOOL } = require("./workspace-context");
const authStorage = require("./auth-store");
const { encodeDomainCheckpoint } = require("./domain-checkpoint");
const clock = require("./clock");
const people = require("./workspace-people");
const journeys = require('./workspace-people-journeys');
const { createTaskSampleRouter, isTaskSampleRequest } = require('./task-sample-assets');
const { makeWorkspaceOperation } = require("./workspace-command");
const { seatCounts, TOOL_DEFINITIONS } = require("./workspace-context");
const clone = value => JSON.parse(JSON.stringify(value));
const failure = (status, code, message) => Object.assign(new Error(message), { status, code });

function createWorkspaceBoundary({ realm, config, store, accountStore, platform, identity: identityFor, dispatch, persist, util, makeCtx, staffAvailable = () => true }) {
  const requests = new AsyncLocalStorage(), privateFrames = new Map();
  let initialized = false;
  const contextService = snapshot => createContextService({ realm, identity: identityFor(), platform: () => snapshot ? { db: snapshot.db, workspace: id => snapshot.db.workspaces.find(row => row.id === id), now: () => clock.now() } : platform().getStore() });
  const authority = createSessionAuthority({
    realm, store: sessionStorage.pickStore(config, { realm }),
    loadUser: async id => { const accounts = await accountStore.accounts(), raw = accounts.get(String(id)); return raw ? JSON.parse(raw).user : identityFor().findUser(id); },
    resolveWorkspace: (user, options) => contextService(options.revalidate ? options.frame?.authorizationSnapshot : undefined).resolveWorkspace(user, options),
    contextFor: (user, options) => contextService().contextFor(user, options),
  });
  function currentPrincipal(req) {
    const principal = req ? authority.verifiedFromReq(req) : requests.getStore()?.frame.principal;
    return principal ? { ...principal, workspaceContext: principal.context.workspaceContext } : null;
  }
  const registry = createRuntimeRegistry({
    realm, identity: new Proxy({}, { get: (_target, name) => identityFor()[name] }), config, util,
    platform: () => platform().getStore(), currentPrincipal, businessClock: clock,
    servicesFor({ workspace, appKey, identity }) {
      if (!/^[\w-]{1,200}$/.test(workspace.id)) throw failure(503, "invalid_workspace_id", "Workspace storage is unavailable.");
      const ctx = { ...makeCtx(appKey, identity, util), realm, workspaceId: workspace.id, currentContext: () => currentPrincipal()?.workspaceContext, uploadsDir: path.join(config.dataDir, "uploads", "workspaces", workspace.id, appKey), io: null };
      const upload = () => (req, res, next) => /multipart\/form-data|application\/octet-stream/i.test(req.headers["content-type"] || "") ? res.status(501).json({ success: false, code: "packaged_assets_only", message: "Choose a packaged sample asset." }) : next();
      ctx.upload = Object.fromEntries(["single", "array", "any", "fields", "none"].map(name => [name, upload]));
      return {
        ctx, assets: { kind: "packaged", workspaceId: workspace.id },
        verifyActorPassword: password => { const principal = currentPrincipal(); return principal && authStorage.passwordMatches(principal.user, password); },
        commands: { execute: (...args) => executeCommand(...args) }, lifecycle: { execute: (...args) => executeCommand(...args) },
      };
    },
  });
  function executeCommand(kind, payload, metadata = {}) {
    const request = requests.getStore(), principal = request?.frame.principal, runtime = request?.runtime;
    if (!principal?.context.workspaceContext || !runtime || metadata.workspaceId !== runtime.workspaceId || (metadata.actor?.effectiveUserId ?? metadata.actor?.userId) !== principal.user.id) throw failure(403, "workspace_command_forbidden", "This workspace action is not authorized.");
    const S = platform().getStore(), workspace = S.workspace(runtime.workspaceId), tool = APP_TO_TOOL[runtime.appKey], access = principal.context.workspaceContext.tools[tool];
    const readOptions = kind === 'hr.offboarding.options';
    if (!readOptions && (principal.readOnly || access?.access === "read_only")) throw failure(423, "workspace_read_only", "This workspace is read-only.");
    if (!readOptions && !access?.canWrite) throw failure(403, 'tool_permission_required', 'Your tool role cannot perform this action.');
    const args = { S, identity: identityFor(), workspace, actor: principal.user, runtime, payload, transferOwned: row => transferOwned(workspace, row, runtime) };
    const hr = require("./workspace-hr");
    const shared = ["profile.self_update", "workspace.tool.roles", "workspace.member.remove"].includes(kind);
    const allowed = shared || tool === "hr" && (kind === "hr.leave.approve" ? access.roles.some(role => ["super_admin", "hr", "manager"].includes(role)) : ["hr.hire", "hr.offboard", "hr.offboarding.options", "hr.offboarding.action"].includes(kind) && access.roles.some(role => ["super_admin", "hr"].includes(role)));
    if (allowed) {
      if (shared) require('./workspace-commands').authorize({ ...args, principal, tool, kind });
      if (kind === 'hr.hire') hr.validateHirePayload(payload);
      if (kind === 'hr.offboard' && runtime.exportSnapshot().data.employees.some(employee => employee.id === Number(payload.employeeId) && employee.authUserId === principal.user.id)) throw failure(400, 'self_offboarding_forbidden', 'Ask another HR administrator to schedule your offboarding.');
      if (kind === 'hr.offboarding.options') {
        const result = hr.offboardingOptions(args), readOnly = principal.readOnly || access.access === 'read_only';
        return { ...result, readOnly, canOffboard: result.canOffboard && !readOnly, canTrackActions: !readOnly };
      }
      const id = metadata.operationId;
      if (id && !/^[\w.:-]{1,200}$/.test(id)) throw failure(422, "invalid_operation_id", "Use a valid action reference.");
      const operation = id && makeWorkspaceOperation({ id, workspaceId: workspace.id, actor: { userId: principal.user.id, ...(principal.readOnly ? { impersonatedBy: principal.actor.id } : {}) }, method: "POST", path: `/commands/${kind}`, body: payload });
      workspace.commandOperations ??= {};
      const key = id && `${principal.user.id}:${kind}:${id}`, prior = key && workspace.commandOperations[key];
      if (prior) {
        if (prior.fingerprint !== operation.fingerprint) throw failure(409, "operation_conflict", "This action reference was already used differently.");
        return clone(prior.result);
      }
      const result = shared ? require('./workspace-commands').execute({ ...args, principal, tool, kind }) : kind === "hr.hire" ? hr.hire(args) : kind === "hr.offboard" ? hr.offboard(args) : kind === 'hr.offboarding.action' ? hr.offboardingAction(args) : hr.approveLeave(args);
      if (key) workspace.commandOperations[key] = { fingerprint: operation.fingerprint, result: clone(result) };
      return result;
    }
    throw failure(501, "workspace_command_required", "This workspace action is not available yet.");
  }
  function transferOwned(workspace, row, currentRuntime) {
    const identity = identityFor();
    const target = workspace.members.find(member => member.id === row.transfer.ownerMemberId && member.status === 'active');
    const targetPerson = target && identity.findByKey(target.userKey), result = {};
    for (const appKey of Object.keys(APP_TO_TOOL)) {
      const runtime = currentRuntime?.appKey === appKey ? currentRuntime : registry.create(workspace.id, appKey);
      try {
        if (runtime.transferOwnership) {
          const grant = target?.toolGrants?.[APP_TO_TOOL[appKey]];
          result[appKey] = runtime.transferOwnership({ operationId: `offboard:${row.id}:${appKey}`, fromUserId: row.userId, target: targetPerson && require('./workspace-custody').eligible(target, APP_TO_TOOL[appKey], identity) ? { kind: 'member', userId: targetPerson.id } : { kind: 'archive' } });
          if (runtime !== currentRuntime) registry.commit(runtime);
        }
      } finally { if (runtime !== currentRuntime) runtime.close(); }
    }
    return result;
  }
  function billingCommand(frame, req, kind, workspaceId) {
    const p = frame.principal, S = platform().getStore(), ws = S.workspace(workspaceId);
    const system = kind === 'billing.run';
    if (!p || p.readOnly || !ws || (system ? p.claims.mode !== 'staff' || !p.context.staffAccess?.permissions.admin?.includes('billing:full') : p.context.workspaceContext?.workspace.id !== workspaceId || p.context.workspaceContext.member.role !== 'owner')) throw failure(403, 'billing_forbidden', 'Current billing authority is required.');
    const allowed = system ? ['workspaceId', 'operationId'] : ['operationId', 'lineId', 'paymentMethodId', 'quantity', 'quoteId'];
    if (Object.keys(req.body || {}).some(key => !allowed.includes(key))) throw failure(422, 'invalid_billing_command', 'Only the billing selection can be sent.');
    const operationId = req.get('idempotency-key') || req.body?.operationId;
    if (!/^[\w.:-]{1,200}$/.test(operationId || '')) throw failure(422, 'operation_id_required', 'Supply the original billing attempt reference.');
    const requestOperation = makeWorkspaceOperation({ id: operationId, workspaceId, actor: { userId: p.actor.id }, method: 'POST', path: req.path, body: req.body });
    ws.billingRequests ??= {};
    const requestKey = `${p.actor.id}:${kind}:${operationId}`, prior = ws.billingRequests[requestKey];
    if (prior) {
      if (prior.fingerprint !== requestOperation.fingerprint) throw failure(409, 'operation_conflict', 'Retry the original billing request unchanged.');
      return clone(prior.result);
    }
    const command = { ...req.body, operationId, kind, workspaceId, at: S.iso(S.now()) };
    const value = require('./workspace-billing-lifecycle').executeBillingCommand({ db: S.db, command, authority: { kind: system ? 'system' : 'user', workspaceId, userId: p.user.id, canManageBilling: !system, readOnly: p.readOnly } });
    platform().importState({ ...platform().exportState(), db: value.db });
    const current = platform().getStore().workspace(workspaceId);
    current.billingRequests ??= {}; current.billingRequests[requestKey] = { fingerprint: requestOperation.fingerprint, result: clone(value.result) };
    if (!value.duplicate) platform().getStore().log(p.actor.key, 'billing_command', workspaceId, { kind, operationId, initiatedBy: p.actor.id });
    return value.result;
  }
  async function initialize() {
    identityFor().configureAuthority(authority);
    if (initialized) return;
    const before = await accountStore.accounts();
    identityFor().hydrate(before);
    if (store.kind !== "redis") {
      await store.initializeIdentity(new Map([...authStorage.snapshot(identityFor()), ...before]));
      accountStore.accounts = () => store.identityAccounts();
    } else {
      const seeds = [...authStorage.snapshot(identityFor())].filter(([id]) => !before.has(id)).map(([id, value]) => ({ id, value, expected: null }));
      if (seeds.length) await accountStore.commit(seeds);
    }
    initializeWorkspaceAuthority(platform().getStore(), identityFor(), { seedAt: new clock.RealDate(persist.seedAt).toISOString() });
    initialized = true;
  }
  function importState(state) { registry.importState(state); }
  function exportStaffState() {
    if (!staffAvailable('wm')) return {};
    const value = require('../apps/wm').exportState?.();
    return value ? { wm: value } : {};
  }
  function importStaffState(state) {
    if (state?.wm) {
      if (!staffAvailable('wm')) throw failure(503, 'staff_runtime_unavailable', 'Website Manager is required to restore this history.');
      require('../apps/wm').importState(state.wm);
    }
  }
  function frameApp(capability, req, fallback) {
    const value = privateFrames.get(capability);
    if (!value || value.key !== req.headers["x-mock-app"] || value.method !== req.method || value.url !== req.url) return (_req, res) => res.status(403).json({ success: false, code: 'invalid_dispatch_capability' });
    privateFrames.delete(capability); delete req.headers["x-orgtik-dispatch"];
    authority.bindPreparedRequest(req, value.frame);
    req.workspaceContext = value.frame.principal?.context.workspaceContext || null;
    return (incoming, response) => authority.runPrepared(value.frame, () => requests.run(value.request, () => value.app(incoming, response)));
  }
  const expectedAudience = (key, url) => {
    if (APP_TO_TOOL[key] && /^\/api\/auth\/(profile|avatar)(?:$|\?|\/)/.test(url)) return `tool:${key}`;
    if (/^\/api\/auth\//.test(url)) return undefined;
    if (/^\/v1\/app\//.test(url)) return "suite";
    if (key === "admin" && /^\/v1\/admin\//.test(url)) return "staff:admin";
    if (key === "wm") return "staff:wm";
    if (APP_TO_TOOL[key]) return `tool:${key}`;
    return undefined;
  };
  function accountRoutes(legacyApp, frame) {
    const app = express(); app.use(cors({ origin: true, credentials: true })); app.use(express.json({ limit: "1mb" }));
    const principal = () => frame.principal;
    const answer = (res, data, message = "Success") => res.json({ success: true, statusCode: 200, message, data });
    const safeUser = user => identityFor().publicUser(user);
    const ownContext = () => principal()?.context.workspaceContext;
    const workspace = () => {
      const context = ownContext();
      if (!context) throw failure(403, "workspace_required", "Choose a workspace to continue.");
      return platform().getStore().workspace(context.workspace.id);
    };
    const writable = () => {
      if (principal()?.readOnly || workspace().state === "suspended") throw failure(423, "workspace_read_only", "This workspace is read-only.");
    };
    const route = fn => (req, res, next) => { try { const result = fn(req); if (result?.then) result.then(data => answer(res, data), next); else answer(res, result); } catch (error) { next(error); } };
    const ownedPeople = () => {
      const context = ownContext();
      if (!context) return principal() ? [principal().user] : [];
      const workspace = platform().getStore().workspace(context.workspace.id);
      const keys = new Set(workspace.members.filter(member => member.status === "active").map(member => member.userKey));
      return identityFor().users.filter(user => keys.has(user.key) && (context.member.role !== "guest" || user.id === context.actor.effectiveUserId));
    };
    app.get("/api/auth/me", (req, res) => {
      const p = principal(); if (!p) return res.status(401).json({ success: false, code: "unauthenticated" });
      answer(res, { user: safeUser(p.user), scopes: p.context.scopes, workspaceContext: p.context.workspaceContext, staffAccess: p.context.staffAccess }, "Profile fetched");
    });
    app.get('/api/auth/mailbox', route(() => {
      return journeys.mailbox(platform().getStore(), principal().user, { readOnly: principal().readOnly });
    }));
    app.get("/api/auth/my-scopes", (req, res) => {
      const p = principal(); if (!p) return res.status(401).json({ success: false, code: "unauthenticated" });
      const names = new Set(p.context.scopes.map(scope => scope.scope));
      const descriptors = identityFor().scopes.filter(scope => names.has(scope.name));
      for (const key of p.context.staffAccess?.apps || []) {
        const scope = identityFor().scopeByName(key === "admin" ? "platform_admin" : "website_manager");
        if (scope && !names.has(scope.name)) descriptors.push({ ...scope, mode: "staff", target: key });
      }
      answer(res, descriptors);
    });
    app.post("/api/auth/workspace", (req, res, next) => {
      const body = req.body || {}, mode = body.mode || "workspace";
      const audience = contextService().audienceFor(body.target || (mode === "staff" ? "admin" : "suite"));
      authority.switchContext(identityFor().tokenFrom(req), { mode, workspaceId: mode === "staff" ? null : body.workspaceId, audience }).then(value => answer(res, value, "Workspace selected"), next);
    });
    app.patch('/v1/admin/people/:id/status', route(req => {
      const p = principal();
      if (p?.claims.mode !== 'staff' || p.claims.aud !== 'staff:admin' || !p.context.staffAccess?.permissions.admin?.includes('staff:full')) throw failure(403, 'staff_permission_required', 'Only authorized OrgTik staff can change account status.');
      const user = identityFor().findUser(req.params.id);
      if (!user) throw failure(404, 'person_not_found', 'This account was not found.');
      if (typeof req.body.isActive !== 'boolean' || user.id === p.user.id && !req.body.isActive) throw failure(422, 'invalid_account_status', 'Choose a valid account status.');
      if (user.isActive !== req.body.isActive) { user.isActive = req.body.isActive; user.authVersion = (user.authVersion || 0) + 1; user.updatedAt = platform().getStore().iso(platform().getStore().now()); }
      platform().getStore().log(p.actor.key, 'account_status_changed', String(user.id), { isActive: user.isActive });
      return safeUser(user);
    }));
    app.post('/v1/admin/billing/lifecycle', route(req => billingCommand(frame, req, 'billing.run', req.body.workspaceId)));
    app.post('/v1/app/billing/recover', route(req => billingCommand(frame, req, 'billing.recover', workspace().id)));
    app.post('/v1/app/subscriptions/:id/retry', (req, res, next) => {
      try {
        const ws = workspace(), method = req.body.paymentMethodId || ws.paymentMethods.find(row => row.isDefault && !row.expired)?.id;
        req.body = { lineId: req.params.id, paymentMethodId: method };
        const result = billingCommand(frame, req, 'billing.recover', ws.id);
        if (result.paymentStatus === 'failed') { frame.commitRefusal = true; return res.status(402).json({ error: { code: 'payment_failed', message: 'The payment did not go through. Choose another saved method.', invoiceId: result.invoiceId } }); }
        res.json({ data: platform().getStore().workspace(ws.id).lines.find(line => line.id === result.lineId), meta: {} });
      } catch (error) { next(error); }
    });
    app.post('/v1/app/billing/seats/quote', route(req => billingCommand(frame, req, 'billing.seats.quote', workspace().id)));
    app.post('/v1/app/billing/seats/confirm', route(req => billingCommand(frame, req, 'billing.seats.confirm', workspace().id)));
    app.post('/v1/app/billing/seats/reduce', route(req => billingCommand(frame, req, 'billing.seats.reduce', workspace().id)));
    app.post('/v1/app/billing/seats/cancel-reduction', route(req => billingCommand(frame, req, 'billing.seats.cancel-reduction', workspace().id)));
    app.get("/v1/app/invitations", route(() => { const ws = workspace(); people.requireAdmin(ws, principal().user); return (ws.invitations || []).map(({ tokenHash, grants, ...row }) => ({ ...row, tools: Object.keys(grants), status: row.status === "pending" && Date.parse(row.expiresAt) <= platform().getStore().now() ? "expired" : row.status })); }));
    app.get('/v1/app/team', (req, res, next) => {
      try {
        const ws = workspace(), S = platform().getStore();
        const data = ws.members.filter(member => !['removed', 'offboarded', 'cancelled'].includes(member.status)).map(member => {
          const user = identityFor().findByKey(member.userKey);
          return { id: member.id, userKey: member.userKey, name: user ? identityFor().fullName(user) : member.name, email: user?.email || member.email, role: member.role, status: member.status, tools: Object.keys(member.toolGrants || {}).filter(tool => member.toolGrants[tool].assigned), joinedAt: member.joinedAt, invitationId: member.invitationId || null };
        });
        const filtered = ownContext().member.role === 'guest' ? data.filter(member => member.userKey === principal().user.key) : data;
        res.json({ data: filtered, meta: { seats: S.seats(ws), seatModel: 'B', perTool: Object.fromEntries(Object.keys(TOOL_DEFINITIONS).map(tool => [tool, seatCounts(S, ws, tool)])), perUserLines: ws.lines.filter(line => S.db.plans.find(plan => plan.id === line.planId)?.perUser).map(line => ({ id: line.id, tool: line.tool, unit: line.snapshot.unit, currency: line.snapshot.currency, cycle: line.cycle })) } });
      } catch (error) { next(error); }
    });
    app.post('/v1/app/team/invite', (req, res, next) => {
      try { writable(); const data = people.invite(platform().getStore(), identityFor(), workspace(), principal().user, req.body, { operationId: req.get('idempotency-key') }); res.status(201).json({ data, meta: {} }); } catch (error) { next(error); }
    });
    app.patch('/v1/app/team/:id', (req, res, next) => {
      try { writable(); const data = people.changeMember(platform().getStore(), workspace(), principal().user, req.params.id, req.body); res.json({ data, meta: {} }); } catch (error) { next(error); }
    });
    app.post("/v1/app/invitations", route(req => { writable(); return people.invite(platform().getStore(), identityFor(), workspace(), principal().user, req.body, { operationId: req.get('idempotency-key') }); }));
    app.post("/v1/app/invitations/:id/cancel", route(req => { writable(); return people.changeInvitation(platform().getStore(), workspace(), principal().user, req.params.id, "cancel", { operationId: req.get('idempotency-key') }); }));
    app.post("/v1/app/invitations/:id/resend", route(req => { writable(); return people.changeInvitation(platform().getStore(), workspace(), principal().user, req.params.id, "resend", { operationId: req.get('idempotency-key') }); }));
    app.get('/v1/app/invitations/:id/delivery', route(req => journeys.delivery(platform().getStore(), workspace(), principal().user, req.params.id, { readOnly: principal().readOnly })));
    app.get("/v1/public/invitations/:token", route(req => journeys.metadata(platform().getStore(), identityFor(), req.params.token)));
    app.post("/v1/public/invitations/:token/accept", route(req => {
      if (principal()?.readOnly) throw failure(423, "impersonation_read_only", "View-as sessions cannot accept invitations.");
      const result = journeys.accept(platform().getStore(), identityFor(), req.params.token, principal()?.user, req.body, req.get('idempotency-key'));
      const user = identityFor().findUser(result.userId);
      const hrRuntime = registry.create(result.workspaceId, 'hr');
      try {
        if (require('./workspace-hr').activateEmployee({ S: platform().getStore(), runtime: hrRuntime, userId: result.userId })) registry.commit(hrRuntime);
      } finally { hrRuntime.close(); }
      const tokens = identityFor().issueTokens(user, { mode: "workspace", workspaceId: result.workspaceId, audience: "suite" });
      return { ...result, tokens, workspaceContext: contextService().resolveWorkspace(user, { mode: "workspace", workspaceId: result.workspaceId, audience: "suite" }).workspaceContext };
    }));
    app.post("/v1/app/ownership-transfer", route(req => { writable(); return journeys.transfer(platform().getStore(), identityFor(), workspace(), principal().user, req.body.memberId, req.get('idempotency-key')); }));
    app.post('/v1/app/people-lifecycle', route(() => {
      writable(); const ws = workspace(); people.requireAdmin(ws, principal().user);
      const hrRuntime = registry.create(ws.id, 'hr');
      try { const result = require('./workspace-hr').runOffboarding({ S: platform().getStore(), identity: identityFor(), workspace: ws, actor: principal().user, runtime: hrRuntime, transferOwned: row => transferOwned(ws, row, hrRuntime) }); registry.commit(hrRuntime); return result; }
      finally { hrRuntime.close(); }
    }));
    app.get("/v1/app/mailbox", route(() => {
      return journeys.mailbox(platform().getStore(), principal().user, { workspaceId: workspace().id, readOnly: principal().readOnly });
    }));
    app.get("/v1/app/seats", route(() => {
      const ws = workspace();
      return Object.fromEntries(Object.keys(TOOL_DEFINITIONS).map(tool => [tool, seatCounts(platform().getStore(), ws, tool)]));
    }));
    app.get(["/api/users", "/api/users/all", "/api/staff"], (req, res) => {
      if (!ownContext()) return res.status(403).json({ success: false, code: "workspace_required" });
      const data = ownedPeople().map(user => ({ id: user.id, key: user.key, firstName: user.firstName, lastName: user.lastName, email: user.email, avatar: user.avatar, isActive: user.isActive }));
      answer(res, data);
    });
    app.get(["/api/users/me", "/api/users/profile"], (req, res) => {
      const p = principal(); if (!p) return res.status(401).json({ success: false });
      answer(res, { ...safeUser(p.user), scopes: p.context.scopes, workspaceContext: p.context.workspaceContext, staffAccess: p.context.staffAccess });
    });
    app.get("/api/users/:id", (req, res) => {
      const user = ownedPeople().find(row => String(row.id) === req.params.id);
      if (!user) return res.status(404).json({ success: false, message: "This person was not found in your workspace." });
      answer(res, user.id === principal()?.user.id ? safeUser(user) : { id: user.id, firstName: user.firstName, lastName: user.lastName, email: user.email, avatar: user.avatar });
    });
    // General-tool APIs must not expose the old global demo stores in customer mode.
    app.use((req, res, next) => {
      if (principal()?.claims.mode === "workspace" && /^\/api\//.test(req.path) && !/^\/api\/auth\//.test(req.path)) return res.status(403).json({ success: false, code: "workspace_route_required", message: "Use the workspace application for this action." });
      next();
    });
    app.use(legacyApp);
    app.use((error, req, res, next) => res.status(error.status || 503).json({ success: false, code: error.code || 'workspace_unavailable', message: error.message }));
    return app;
  }
  async function handle({ key, req, body, legacyApp, send, sendJson, sync }) {
    await initialize();
    await sync();
    const identity = identityFor(), S = platform().getStore();
    identity.configureAuthority(authority);
    const saved = await accountStore.accounts(); identity.hydrate(saved);
    let json;
    try { json = body.length && /application\/json/.test(req.headers["content-type"] || "") ? JSON.parse(body.toString("utf8")) : {}; }
    catch { return sendJson(400, { success: false, code: "invalid_json", message: "Check the request and try again." }); }
    req.body = json;
    const url = req.url || "/", authPublic = /^\/api\/auth\/(login|register|handoff\/exchange)(?:$|\?)/.test(url);
    const publicFile = key === 'files' && /^\/api\/v1\/public\/shares\/([\w-]+)(?:$|\/|\?)/.exec(url);
    const taskSample = key === 'tasks' && isTaskSampleRequest(req);
    const publicCms = key === 'wm' && (['GET', 'HEAD'].includes(req.method) && /^\/v2\/public(?:\/|$)/.test(url) || req.method === 'POST' && /^\/v2\/public\/(leads|ideas)(?:$|\?)/.test(url));
    const cmsPreview = key === 'wm' && ['GET', 'HEAD'].includes(req.method) && /^\/v2\/preview\/entries\/[\w-]+(?:$|\?)/.test(url);
    const anonymous = authPublic || publicFile || taskSample || publicCms || cmsPreview || /^\/v1\/public\//.test(url) || /^\/(__health|__mock\/status|__mock\/clock)(?:$|\?)/.test(url);
    let frame, runtime, commitAttempted = false;
    const requestEpoch = persist.epoch;
    initializeWorkspaceAuthority(S, identity, { seedAt: new clock.RealDate(persist.seedAt).toISOString() });
    const platformBefore = platform().exportState(), accountsBefore = authStorage.snapshot(identity), runtimesBefore = registry.exportState(), staffBefore = exportStaffState();
    try {
      const refresh = /^\/api\/auth\/refresh(?:$|\?)/.test(url);
      frame = await authority.prepareRequest(req, { audience: publicCms || cmsPreview || taskSample ? undefined : expectedAudience(key, url), allowAnonymous: anonymous, ...(authPublic || publicFile || publicCms || cmsPreview || taskSample ? { token: null } : {}), ...(refresh ? { token: json.refreshToken, type: "refresh" } : {}) });
      frame.authorizationSnapshot = platformBefore;
      const principal = frame.principal;
      if (['POST', 'PUT', 'PATCH'].includes(req.method) && /multipart\/form-data|application\/octet-stream/i.test(req.headers['content-type'] || '')) throw failure(501, 'packaged_assets_only', 'Choose a packaged sample asset in this prototype.');
      if (cmsPreview) {
        const token = /^Preview (\S+)$/.exec(req.headers.authorization || '')?.[1];
        if (!require('../apps/wm').validatePreviewGrant?.(token)) throw failure(401, 'preview_expired', 'Open a new preview from Website Manager.');
      }
      if (/^\/(?:__mock\/|v[12]\/__mock\/)/.test(url) && req.method !== "GET" && (principal?.claims.mode !== 'staff' || !principal?.context.staffAccess?.permissions.admin?.includes("settings:full"))) throw failure(403, "mock_control_forbidden", "Only an authorized mock administrator can do this.");
      const request = { frame, key, req, principal, runtime: null };
      const result = await authority.runPrepared(frame, () => requests.run(request, async () => {
        let app = key === "sos" || key === "admin" ? accountRoutes(legacyApp, frame) : legacyApp;
        if (taskSample) { app = express(); app.use(createTaskSampleRouter({ config })); }
        else if (publicFile) {
          const workspaceId = registry.publicFileWorkspace(publicFile[1]);
          if (!workspaceId) throw failure(404, 'public_grant_not_found', 'This link is not available.');
          runtime = registry.create(workspaceId, 'files'); request.runtime = runtime; app = runtime.router;
        } else if (APP_TO_TOOL[key] && (!/^\/(__|api\/auth\/)/.test(url) || /^\/api\/auth\/(profile|avatar)(?:$|\?|\/)/.test(url))) {
          const context = principal?.context.workspaceContext;
          if (!context) throw failure(403, "workspace_required", "Choose a workspace to continue.");
          const access = context.tools[APP_TO_TOOL[key]];
          if (!access || ["no_access", "not_subscribed"].includes(access.access)) throw failure(403, "tool_access_denied", "Ask your workspace owner for access.");
          if (req.method !== "GET" && req.method !== "HEAD" && (principal.readOnly || access.access === "read_only")) throw failure(423, "workspace_read_only", "This workspace tool is read-only.");
          runtime = registry.create(context.workspace.id, key); request.runtime = runtime; app = runtime.router;
        }
        const capability = crypto.randomFillSync(Buffer.alloc(24)).toString("base64url");
        privateFrames.set(capability, { key, method: req.method, url, frame, request, app });
        const headers = { ...req.headers, "x-orgtik-dispatch": capability };
        try { return await dispatch(key, { method: req.method, url, headers, body }); }
        finally { privateFrames.delete(capability); }
      }));
      const persistPublicRefusal = publicFile && req.method === 'POST' && /\/session(?:$|\?)/.test(url) && [401, 404, 429].includes(result.statusCode);
      if (result.statusCode >= 400 && !persistPublicRefusal && !frame.commitRefusal) {
        identity.hydrate(accountsBefore, { replace: true }); platform().importState(platformBefore); registry.importState(runtimesBefore); importStaffState(staffBefore);
        return send(result);
      }
      if (persist.epoch !== requestEpoch) {
        // Authorized fixture resets already persisted a new epoch and rebuilt its seed.
        // Never append the pre-reset candidate or old runtime snapshots to that epoch.
        await authority.commitPending(frame); return send(result);
      }
      assignInitialOwnerSeats(S);
      if (runtime) registry.commit(runtime);
      const after = platform().exportState(), workspaceState = registry.exportState(), staffState = exportStaffState();
      const changes = [...authStorage.snapshot(identity)].filter(([id, value]) => saved.get(id) !== value).map(([id, value]) => ({ id, value, expected: saved.get(id) ?? null }));
      const changed = JSON.stringify(after) !== JSON.stringify(platformBefore) || JSON.stringify(workspaceState) !== JSON.stringify(runtimesBefore) || JSON.stringify(staffState) !== JSON.stringify(staffBefore) || changes.length;
      if (changed) {
        const identityEffect = { changes, ...(store.kind === "redis" ? { accountsKey: `orgtik:identity:${realm}:accounts`, emailsKey: `orgtik:identity:${realm}:emails` } : {}) };
        const entry = { epoch: persist.epoch, kind: "workspace-v1", app: key, method: req.method, url, headers: {}, body: null, at: clock.now(), checkpoint: encodeDomainCheckpoint({ platformState: after, workspaceState, staffState }) };
        if (!/^\/api\/auth\/logout(?:-all)?(?:$|\?)/.test(url)) await authority.revalidatePrepared(frame);
        commitAttempted = true;
        const committed = await store.commit(entry, { expectedEpoch: persist.epoch, expectedRevision: persist.applied, identity: identityEffect });
        persist.applied = committed.sequence; persist.modern = true; persist.workspaceModern = true;
      }
      await authority.commitPending(frame);
      return send(result);
    } catch (error) {
      identity.hydrate(accountsBefore, { replace: true }); platform().importState(platformBefore); registry.importState(runtimesBefore); importStaffState(staffBefore);
      if (commitAttempted) persist.rebuild = true;
      return sendJson(error.status || 503, { success: false, code: error.code || "workspace_unavailable", message: error.message });
    } finally { if (frame) authority.discardPending(frame); runtime?.close(); }
  }
  return { authority, registry, initialize, handle, importState, exportStaffState, importStaffState, frameApp, currentPrincipal, contextService };
}
module.exports = { createWorkspaceBoundary };
