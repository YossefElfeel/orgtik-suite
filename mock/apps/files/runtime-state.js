const lib = require("./lib");
const MAPS = ["folders", "files", "pins", "shares", "sessions", "failures", "previewPages"];
const clone = value => JSON.parse(JSON.stringify(value));
const invalid = message => { throw Object.assign(new Error(message), { status: 503, code: "invalid_tool_snapshot" }); };
const empty = () => ({ ...Object.fromEntries(MAPS.map(key => [key, new Map()])), activities: [] });

function encode(state) {
  if (Object.keys(state).some(key => ![...MAPS, "activities"].includes(key))) invalid("Files codec does not cover every store field.");
  const data = { activities: clone(state.activities) };
  for (const key of MAPS) data[key] = [...state[key]].map(([id, value]) => [id, key === "pins" ? [...value] : clone(value)]);
  return data;
}

function decode(data, manifest) {
  if (!data || Object.keys(data).some(key => ![...MAPS, "activities"].includes(key)) || !Array.isArray(data.activities)) invalid("Files snapshot has incomplete state.");
  const state = empty();
  for (const key of MAPS) {
    if (!Array.isArray(data[key])) invalid(`Files snapshot ${key} is missing.`);
    const seen = new Set();
    for (const pair of data[key]) {
      if (!Array.isArray(pair) || pair.length !== 2 || !["string", "number"].includes(typeof pair[0]) || seen.has(pair[0])) invalid(`Files snapshot ${key} has invalid keys.`);
      seen.add(pair[0]);
      if (key === "pins") {
        if (!Array.isArray(pair[1]) || pair[1].some(pin => !Array.isArray(pin) || pin.length !== 2 || typeof pin[0] !== "string" || typeof pin[1] !== "string") || new Set(pair[1].map(pin => pin[0])).size !== pair[1].length) invalid("Files pin snapshot is invalid.");
        state.pins.set(pair[0], new Map(clone(pair[1])));
      } else state[key].set(pair[0], clone(pair[1]));
    }
  }
  for (const [id, row] of state.folders) {
    if (row.id !== id || row.parentId != null && !state.folders.has(row.parentId)) invalid("Files snapshot has an invalid folder reference.");
    const ancestors = new Set();
    for (let folder = row; folder; folder = state.folders.get(folder.parentId)) {
      if (ancestors.has(folder.id)) invalid("Files snapshot has a folder cycle.");
      ancestors.add(folder.id);
    }
  }
  for (const [id, row] of state.files) {
    if (row.id !== id || row.folderId != null && !state.folders.has(row.folderId)) invalid("Files snapshot has an invalid file reference.");
    if (row.storage?.kind !== "asset" || !Object.hasOwn(manifest, row.storage.key)) invalid("Files snapshots support packaged sample assets only.");
  }
  for (const [id, row] of state.shares) if (row.id !== id || !["file", "folder"].includes(row.resourceType) || !(row.resourceType === "file" ? state.files : state.folders).has(row.resourceId)) invalid("Files snapshot has an invalid share reference.");
  state.activities = clone(data.activities);
  return state;
}

function nileFixture(identity, manifest, at) {
  const owner = identity.users.find(person => identity.userScopes(person).some(scope => scope.scope === "file_manager" && scope.roles.includes("super_admin"))) || identity.users[0];
  const asset = manifest.pdf_msa_nilefoods;
  if (!owner || !asset) invalid("Nile Files fixture needs its admitted owner and packaged agreement.");
  const state = empty();
  const rootId = lib.seedId("folder:contracts"), folderId = lib.seedId("folder:contracts-clients"), fileId = lib.seedId("file:pdf_msa_nilefoods");
  const timestamp = new Date(Date.parse(at) - 47 * 864e5).toISOString();
  const folder = (id, name, parentId) => ({ id, name, parentId, ownerId: owner.id, visibility: "only_me", allowedUserIds: [], grantedBy: owner.id, grantsAt: timestamp, inheritedAccess: Boolean(parentId), createdAt: timestamp, updatedAt: timestamp, deletedAt: null, archivedBy: null, archiveBatch: null });
  state.folders.set(rootId, folder(rootId, "Contracts", null));
  state.folders.set(folderId, folder(folderId, "Client Agreements", rootId));
  state.files.set(fileId, { id: fileId, name: "Nile Foods - Master Service Agreement 2026.pdf", originalName: "Nile Foods - Master Service Agreement 2026.pdf", ownerId: owner.id, size: asset.size, mimeType: asset.mimeType, folderId, isUsed: false, usedNote: null, usedAt: null, usedBy: null, createdAt: timestamp, updatedAt: timestamp, deletedAt: null, archivedBy: null, archiveBatch: null, storage: { kind: "asset", key: "pdf_msa_nilefoods" }, accessOverride: null });
  return state;
}

module.exports = { MAPS, empty, encode, decode, nileFixture };
