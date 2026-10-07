const express = require("express");
const stateCodec = require("../../apps/files/runtime-state");
const lib = require("../../apps/files/lib");
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
  }
  const router = express.Router();
  created = true;
  const hooks = tool.routes(router, { ...ctx, identity: input.identity, workspaceServices: input.services, commands: input.services.commands }, { state, seedAt: input.initialization.seedAt });
  return {
    router,
    exportSnapshot: () => ({ schema, version: 1, realm, workspaceId: input.workspace.id, appKey: 'files', ...hooks.exportState(), ...(fixtureId ? { fixtureId } : {}) }),
    bootstrap: context => {
      if (!context?.actor || context.mode === 'public_resource') throw Object.assign(new Error("Files bootstrap is not authorized."), { status: 403 });
      const user = input.identity.findUser(context.actor.effectiveUserId), access = context.tools?.files;
      if (!user || user.isActive === false || context.realm !== realm || context.workspace?.id !== input.workspace.id || !access || ['no_access', 'not_subscribed'].includes(access.access) || !access.roles?.length || !input.identity.userScopes(user).some(scope => scope.scope === 'file_manager' && scope.roles.length)) throw Object.assign(new Error("Files bootstrap is not authorized."), { status: 403 });
      return hooks.bootstrap(user);
    },
    usage: hooks.usage, transferOwnership: hooks.transferOwnership, close: hooks.close,
  };
}

module.exports = { createWorkspaceRuntime, schema };
