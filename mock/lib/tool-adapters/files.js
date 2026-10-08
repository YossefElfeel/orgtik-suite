const express = require("express");
const stateCodec = require("../../apps/files/runtime-state");
const lib = require("../../apps/files/lib");
const { buildSeed } = require('../../apps/files/seed');
const { createWorkspaceFiles } = require('../workspace-files');
const path = require('node:path');
let created = false;
const schema = "orgtik.tool.files";
const fail = message => { throw Object.assign(new Error(message), { status: 503, code: "invalid_tool_runtime" }); };

function createWorkspaceRuntime(input, tool, manifest) {
  if (created) fail("A Files graph can own only one workspace runtime.");
  const ctx = input.services?.ctx, realm = input.realm ?? input.identity?.realm ?? ctx?.realm;
  if (!ctx || typeof realm !== 'string' || !realm || !input.workspace?.id || !input.identity?.workspaceMode || input.identity.workspaceId !== input.workspace.id) fail("Files requires a verified workspace identity and context.");
  if (!['empty', 'fixture'].includes(input.initialization?.kind) || !Number.isFinite(Date.parse(input.initialization.seedAt))) fail("Files initialization is invalid.");
  const fixtureId = input.initialization.fixtureId;
  if (input.initialization.kind === 'fixture' && !['orgtik-v1', 'nile-v1'].includes(fixtureId)) fail("Files fixture is not registered.");
  if (input.initialization.kind === 'fixture' && input.workspace.id !== (fixtureId === 'orgtik-v1' ? 'ws_orgtik' : 'ws_nile')) fail("Files fixture is not assigned to this workspace.");
  const snapshot = input.snapshot;
  if (snapshot && (snapshot.schema !== schema || snapshot.version !== 1 || snapshot.realm !== realm || snapshot.workspaceId !== input.workspace.id || snapshot.appKey !== 'files')) fail("Files snapshot belongs to a different runtime.");
  let state;
  if (snapshot) { state = stateCodec.decode(snapshot.data, manifest); lib.importCounters(snapshot.sequences); }
  else {
    lib.importCounters({ ids: 0, secrets: 0 });
    if (input.initialization.kind === 'empty') state = stateCodec.empty();
    else if (fixtureId === 'nile-v1') state = stateCodec.nileFixture(input.identity, manifest, input.initialization.seedAt);
    else state = buildSeed({ identity: input.identity, manifest, seedAt: input.initialization.seedAt });
  }
  const router = express.Router();
  let shared;
  const ownRoute = fn => (req, res) => {
    const user = input.identity.requireUser(req, res); if (!user) return;
    try { ctx.util.ok(res, fn(req, user), 'Files sample request completed', req.method === 'POST' ? 201 : 200); }
    catch (error) { res.status(error.status || 503).json({ success: false, code: error.code || 'files_unavailable', message: error.message }); }
  };
  router.get('/api/v1/files/samples', ownRoute((_req, user) => shared.sampleCatalog({ actorId: user.id })));
  router.post('/api/v1/files/samples', ownRoute((req, user) => {
    const body = req.body;
    if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).some(key => !['sampleId', 'parentId'].includes(key))) throw Object.assign(new Error('Only the sample and destination folder can be supplied.'), { status: 422, code: 'invalid_sample_payload' });
    return shared.createSample({ actorId: user.id, ...body, operationId: req.get('idempotency-key') });
  }));
  router.get('/api/v1/files/:fileId/versions/:versionId', ownRoute((req, user) => shared.getVersionMetadata({ actorId: user.id, fileId: req.params.fileId, versionId: req.params.versionId })));
  const versionBytes = preview => (req, res, next) => {
    const user = input.identity.requireUser(req, res); if (!user) return;
    try {
      const args = { actorId: user.id, fileId: req.params.fileId, versionId: req.params.versionId };
      const content = preview ? shared.previewWhiteboard(args) : shared.contentSharedFile(args);
      res.set('Cache-Control', 'private, no-store').set('X-Content-Type-Options', 'nosniff');
      if (preview) res.set('X-OrgTik-Preview', 'sample').type(content.mimetype);
      else res.attachment(content.name).type(content.mimetype);
      if (content.bytes) return res.send(content.bytes);
      res.sendFile(content.path, error => { if (error) next(error); });
    } catch (error) { res.status(error.status || 503).json({ success: false, code: error.code || 'files_unavailable', message: error.status ? error.message : 'Files could not be loaded.' }); }
  };
  router.get('/api/v1/files/:fileId/versions/:versionId/download', versionBytes(false));
  router.get('/api/v1/files/:fileId/versions/:versionId/preview', versionBytes(true));
  created = true;
  const hooks = tool.routes(router, { ...ctx, identity: input.identity, workspaceServices: input.services, commands: input.services.commands }, { state, seedAt: input.initialization.seedAt });
  shared = createWorkspaceFiles({ state, identity: input.identity, workspaceId: input.workspace.id, realm, manifest, assetDir: path.resolve(__dirname, '../../apps/files/assets'), boardAuthority: ctx.boardAuthority, now: () => new Date().toISOString(), fileOut: hooks.serializeFile });
  return {
    router,
    exportSnapshot: () => ({ schema, version: 1, realm, workspaceId: input.workspace.id, appKey: 'files', ...hooks.exportState(), ...(fixtureId ? { fixtureId } : {}) }),
    bootstrap: context => {
      if (!context?.actor || context.mode === 'public_resource') throw Object.assign(new Error("Files bootstrap is not authorized."), { status: 403 });
      const user = input.identity.findUser(context.actor.effectiveUserId), access = context.tools?.files;
      if (!user || user.isActive === false || context.realm !== realm || context.workspace?.id !== input.workspace.id || !access || ['no_access', 'not_subscribed'].includes(access.access) || !access.roles?.length || !input.identity.userScopes(user).some(scope => scope.scope === 'file_manager' && scope.roles.length)) throw Object.assign(new Error("Files bootstrap is not authorized."), { status: 403 });
      return hooks.bootstrap(user);
    },
    listSharedFiles: shared.listSharedFiles, resolveSharedFile: shared.resolveSharedFile, contentSharedFile: shared.contentSharedFile,
    createSample: shared.createSample, sampleCatalog: shared.sampleCatalog,
    authorizeWhiteboard: shared.authorizeWhiteboard, createWhiteboard: shared.createWhiteboard, saveWhiteboard: shared.saveWhiteboard, resolveWhiteboard: shared.resolveWhiteboard, getVersionMetadata: shared.getVersionMetadata,
    usage: hooks.usage, transferOwnership: hooks.transferOwnership, close() { shared.close(); hooks.close(); },
  };
}

module.exports = { createWorkspaceRuntime, schema };
