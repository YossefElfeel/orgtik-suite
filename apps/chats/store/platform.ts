"use client";

import { readClientSession, subscribeClientSession, type WorkspaceContext } from "@orgtik/ui/auth";
import type { ServerEvent } from "@/entities/events";
import type { WorkspaceState } from "./index";

type DataKey = "me" | "users" | "presence" | "floor" | "channels" | "messages" | "threadReplies" | "meetings" | "pastMeetings" | "notifications" | "insight" | "myTime" | "settings" | "historicalUsers" | "readState" | "workspaceId" | "fixtureId";
export type BootstrapData = Pick<WorkspaceState, DataKey> & { dataRevision: number; access: { canWrite: boolean; readOnly: boolean; roles: string[] } };
export type SyncState = { status: "loading" | "ready" | "error" | "no_access"; namespace: string; canWrite: boolean; pending: number; errorCode?: string };
type Callbacks = { clear: (state: SyncState) => void; hydrate: (data: BootstrapData, state: SyncState) => void; status: (state: SyncState) => void };
const API = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "").replace(/\/api$/, "");
const supported = new Set(["message.created", "message.edited", "message.deleted", "message.reaction_toggled", "message.pin_toggled", "channel.created", "channel.updated", "channel.members_added", "channel.member_removed", "channel.left", "channel.read", "channel.all_read"]);
export const isPersistentEvent = (event: ServerEvent) => supported.has(event.type);
let callbacks: Callbacks | null = null;
let generation = 0, pending = 0, queue: Promise<void> = Promise.resolve(), namespace = "", writeAllowed = false;
let revision = -1;
let permissionBlocked = false;
const uuid = () => crypto.randomUUID();
const failure = (code: string) => Object.assign(new Error(code), { code });

function authority() {
  const session = readClientSession();
  const context = session?.workspaceContext, tool = context?.tools.chat;
  const key = context ? `${context.realm}:${context.workspace.id}:${context.actor.effectiveUserId}:${context.member.revision}:${context.actor.readOnly}:${tool?.access}:${tool?.roles.join(",")}:${tool?.canWrite}` : "";
  const readable = Boolean(session && context && tool && !["no_access", "not_subscribed"].includes(tool.access) && tool.roles.some(role => ["owner", "admin", "member"].includes(role)));
  return { session, context, key, readable, canWrite: Boolean(readable && tool?.canWrite && !context?.actor.readOnly) };
}
function sync(status: SyncState["status"], errorCode?: string): SyncState { return { status, namespace, canWrite: writeAllowed, pending, ...(errorCode ? { errorCode } : {}) }; }
export const currentWorkspaceNamespace = () => authority().key;
function deny() { generation++; pending = 0; writeAllowed = false; permissionBlocked = true; callbacks?.clear(sync("no_access", "access_denied")); }
function headers(context: WorkspaceContext, token: string, operationId?: string) {
  return { Authorization: `Bearer ${token}`, "X-Workspace": context.workspace.id, ...(operationId ? { "Content-Type": "application/json", "Idempotency-Key": operationId } : {}) };
}
async function request(token: string, context: WorkspaceContext, event?: ServerEvent, operationId?: string): Promise<BootstrapData> {
  if (!API) throw failure("missing_api");
  let response: Response;
  try { response = await fetch(`${API}/api/hq/${event ? "commands" : "bootstrap"}`, { method: event ? "POST" : "GET", headers: headers(context, token, operationId), ...(event ? { body: JSON.stringify({ event }) } : {}), cache: "no-store" }); }
  catch { throw failure("transport_unavailable"); }
  let envelope: { success: boolean; data?: BootstrapData; code?: string };
  try { envelope = await response.json() as typeof envelope; } catch { throw failure("transport_unavailable"); }
  if (!response.ok || !envelope.success) throw failure(response.status === 401 || response.status === 403 ? "access_denied" : envelope.code || "save_failed");
  const data = envelope.data;
  if (!data || data.workspaceId !== context.workspace.id || data.me !== String(context.actor.effectiveUserId) || !Array.isArray(data.users) || !data.users.some(user => user.id === data.me) || !Number.isSafeInteger(data.dataRevision) || typeof data.access?.canWrite !== "boolean" || !Array.isArray(data.channels) || !Array.isArray(data.messages) || !Array.isArray(data.historicalUsers) || !Array.isArray(data.floor?.rooms)) throw failure("invalid_bootstrap");
  return data;
}
function publish(data: BootstrapData, expected: number) {
  if (expected !== generation || data.dataRevision < revision) return;
  revision = data.dataRevision; writeAllowed = authority().canWrite && data.access.canWrite && !data.access.readOnly; callbacks?.hydrate(data, sync("ready"));
}
export async function reloadWorkspace(): Promise<void> {
  const current = authority(), expected = generation;
  if (!current.readable || !current.session || !current.context) { callbacks?.status(sync("no_access", "access_denied")); return; }
  try { publish(await request(current.session.tokens.accessToken, current.context), expected); }
  catch (error) { if (expected === generation) { const code = (error as { code?: string }).code || "transport_unavailable"; if (code === "access_denied") deny(); else callbacks?.status(sync("error", code)); } }
}

/** One tab owns one bound context. An old request never hydrates a new workspace. */
export function startWorkspacePlatform(next: Callbacks): () => void {
  callbacks = next;
  const bind = () => {
    permissionBlocked = false;
    const current = authority();
    if (current.key !== namespace) {
      generation++; namespace = current.key; revision = -1; pending = 0; queue = Promise.resolve(); writeAllowed = current.canWrite;
      callbacks?.clear(sync(current.readable ? "loading" : "no_access"));
    } else { writeAllowed = current.canWrite; if (!current.readable) callbacks?.clear(sync("no_access")); else callbacks?.status(sync("loading")); }
    if (current.readable) void reloadWorkspace();
  };
  bind();
  const unsubscribe = subscribeClientSession(bind);
  const timer = window.setInterval(() => { if (!pending && !permissionBlocked) void reloadWorkspace(); }, 5000);
  return () => { unsubscribe(); window.clearInterval(timer); generation++; callbacks = null; namespace = ""; pending = 0; };
}

/** Commands are staged in order; only a committed API response changes business data. */
export function persistEvent(event: ServerEvent): void {
  const current = authority();
  if (!callbacks || !current.readable || !current.canWrite || !current.session || !current.context) { callbacks?.status(sync("no_access", "access_denied")); return; }
  if (!isPersistentEvent(event)) { callbacks.status(sync("ready", "chat_flow_deferred")); return; }
  const expected = generation, operationId = uuid(), token = current.session.tokens.accessToken, context = current.context;
  // Clone before queuing so later caller changes cannot mutate the submitted command.
  const command = JSON.parse(JSON.stringify(event)) as ServerEvent;
  pending++; callbacks.status(sync("ready"));
  queue = queue.then(async () => {
    if (expected !== generation) return;
    try {
      let data: BootstrapData;
      try { data = await request(token, context, command, operationId); }
      catch (error) {
        if ((error as { code?: string }).code !== "transport_unavailable") throw error;
        // A lost success response retries the exact operation, never another message.
        data = await request(token, context, command, operationId);
      }
      if (expected !== generation) return;
      pending--; publish(data, expected);
    } catch (error) {
      if (expected !== generation) return;
      pending--; const code = (error as { code?: string }).code || "save_failed";
      if (code === "access_denied") deny(); else callbacks?.status(sync("error", code));
    }
  });
}
