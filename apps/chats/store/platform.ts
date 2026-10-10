"use client";

import { readClientSession, refreshClientSession, subscribeClientSession, type WorkspaceContext } from "@orgtik/ui/auth";
import type { ServerEvent } from "@/entities/events";
import type { WorkspaceState } from "./index";

type DataKey = "me" | "users" | "presence" | "floor" | "channels" | "messages" | "threadReplies" | "meetings" | "pastMeetings" | "notifications" | "insight" | "myTime" | "settings" | "historicalUsers" | "readState" | "workspaceId" | "fixtureId" | "now" | "typing" | "knocks";
export type BootstrapData = Pick<WorkspaceState, DataKey> & { dataRevision: number; access: { canWrite: boolean; readOnly: boolean; roles: string[] } };
export type SyncState = { status: "loading" | "ready" | "error" | "no_access"; namespace: string; canWrite: boolean; pending: number; errorCode?: string; uncertain?: boolean };
type Callbacks = { clear: (state: SyncState) => void; hydrate: (data: BootstrapData, state: SyncState) => void; status: (state: SyncState) => void };
const API = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "").replace(/\/api$/, "");
const SOS_API = process.env.NEXT_PUBLIC_SOS_API_URL || "";
const supported = new Set(["message.created", "message.edited", "message.deleted", "message.reaction_toggled", "message.pin_toggled", "channel.created", "channel.updated", "channel.members_added", "channel.member_removed", "channel.left", "channel.read", "channel.all_read","channel.joined","channel.typing","message.saved_toggled","message.reminder_set","message.reminder_delivered","message.schedule_sent","message.schedule_cancelled","message.poll_voted","message.poll_closed","message.task_linked","presence.status_changed","presence.moved","presence.room_changed","presence.speaking","presence.muted","presence.deafened","room.added","room.updated","room.removed","floor.template_changed","knock.ended","knock.sent","knock.answered","knock.delivered","notification.read","notification.all_read","meeting.scheduled","meeting.chat_opened","meeting.share_changed","meeting.ended","meeting.recording_requested","meeting.recording_started","meeting.recording_declined","meeting.recording_stopped","meeting.recording_ready","meeting.guest_link_reset","meeting.guest_admitted","meeting.guest_declined","settings.updated"]);
export const isPersistentEvent = (event: ServerEvent) => supported.has(event.type);
let callbacks: Callbacks | null = null;
let generation = 0, pending = 0, queue: Promise<void> = Promise.resolve(), namespace = "", writeAllowed = false;
let revision = -1;
let permissionBlocked = false;
const uuid = () => crypto.randomUUID();
const failure = (code: string, uncertain = false) => Object.assign(new Error(code), { code, uncertain });

function authority() {
  const session = readClientSession();
  const context = session?.workspaceContext, tool = context?.tools.chat;
  const fileGrant = context?.tools.files;
  const key = context ? `${context.realm}:${context.workspace.id}:${context.actor.effectiveUserId}:${context.member.id}:${context.member.role}:${context.member.revision}:${context.member.accessEpoch}:${context.actor.userId}:${context.actor.impersonatedBy}:${context.actor.readOnly}:${tool?.access}:${tool?.roles.join(",")}:${tool?.canWrite}:${fileGrant?.access}:${fileGrant?.roles.join(",")}:${fileGrant?.canWrite}` : "";
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
  const bound = authority().key;
  if (originalScope(context) !== originalScope()) throw failure("workspace_changed", Boolean(event));
  const wire = event ? wireEvent(event) : undefined;
  let response: Response;
  const send = () => fetch(`${API}/api/hq/${event ? "commands" : "bootstrap"}`, { method: event ? "POST" : "GET", headers: headers(context, authority().session?.tokens.accessToken || token, operationId), ...(event ? { body: JSON.stringify({ event: wire }) } : {}), cache: "no-store" });
  try { response = await send(); }
  catch { throw failure("transport_unavailable", Boolean(event)); }
  if (bound !== authority().key) throw failure("workspace_changed", Boolean(event));
  if (response.status === 401) {
    try { await refreshClientSession(SOS_API); } catch (error) {
      if (bound !== authority().key) throw failure("workspace_changed", Boolean(event));
      const status = (error as { status?: number }).status;
      throw failure(status === 401 || status === 403 ? "access_denied" : "session_unavailable", status !== 401 && status !== 403 && Boolean(event));
    }
    if (bound !== authority().key) throw failure("workspace_changed", Boolean(event));
    try { response = await send(); } catch { throw failure("transport_unavailable", Boolean(event)); }
    if (bound !== authority().key) throw failure("workspace_changed", Boolean(event));
  }
  let envelope: { success: boolean; data?: BootstrapData; code?: string };
  try { envelope = await response.json() as typeof envelope; } catch { throw failure("transport_unavailable", Boolean(event)); }
  if (bound !== authority().key) throw failure("workspace_changed", Boolean(event));
  if (!response.ok || !envelope.success) throw failure(response.status === 401 || response.status === 403 ? "access_denied" : envelope.code || "save_failed", response.status >= 500 && Boolean(event));
  const data = envelope.data;
  if (!data || data.workspaceId !== context.workspace.id || data.me !== String(context.actor.effectiveUserId) || !Array.isArray(data.users) || !data.users.some(user => user.id === data.me) || !Number.isSafeInteger(data.dataRevision) || typeof data.access?.canWrite !== "boolean" || !Array.isArray(data.channels) || !Array.isArray(data.messages) || !Array.isArray(data.historicalUsers) || !Array.isArray(data.floor?.rooms)) throw failure("invalid_bootstrap", Boolean(event));
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

type PendingCommand = { scope: string; id: string; event: ServerEvent; uncertain: boolean };
const PENDING_KEY = "orgtik:chats:unconfirmed-commands";
const attempts = new Map<string, PendingCommand>();
const originalScope = (c = readClientSession()?.workspaceContext) => c ? JSON.stringify([c.realm, c.workspace.id, c.actor.userId, c.actor.effectiveUserId, c.actor.impersonatedBy ?? null]) : "";
function wireEvent(event: ServerEvent): ServerEvent {
  return (event.type === "message.created" ? { ...event, message: { ...event.message, attachments: (event.message.attachments || []).map(file => file.reference || file) } } : event) as ServerEvent;
}
const commandKey = (event: ServerEvent, scope = originalScope()) => scope + ":" + JSON.stringify(wireEvent(event));
function saveAttempts() {
  try { if (typeof sessionStorage !== "undefined") sessionStorage.setItem(PENDING_KEY, JSON.stringify([...attempts.entries()])); } catch { /* In-memory recovery remains available. */ }
}
try {
  if (typeof sessionStorage !== "undefined") {
    const rows = JSON.parse(sessionStorage.getItem(PENDING_KEY) || "[]") as [string, PendingCommand][];
    for (const [key, item] of rows) if (item && typeof item.scope === "string" && typeof item.id === "string" && item.event && typeof item.event.type === "string") attempts.set(key, { ...item, uncertain: true });
  }
} catch { /* Corrupt local drafts cannot mint commands. */ }
export function eventUnconfirmed(event: ServerEvent, scope: string): boolean { return attempts.has(commandKey(event, scope)); }
export function recoverableMessage(channelId: string, threadId?: string): Extract<ServerEvent, { type: "message.created" }>["message"] | null {
  for (const item of attempts.values()) {
    if (item.scope !== originalScope() || item.event.type !== "message.created" || item.event.message.channelId !== channelId || (item.event.message.threadId || "") !== (threadId || "")) continue;
    return { ...item.event.message, attachments: (item.event.message.attachments || []).map(file => {
      const reference = file.reference || file as unknown as { workspaceId: string; fileId: string; versionId: string };
      return { id: reference.fileId + ":" + reference.versionId, reference, name: "", size: "", kind: "other" as const };
    }) };
  }
  return null;
}
export const currentMessageScope = originalScope;

export async function persistEvent(event: ServerEvent): Promise<boolean> {
  const current = authority();
  if (!callbacks || !current.readable || !current.canWrite || !current.session || !current.context) { callbacks?.status(sync("no_access", "access_denied")); return false; }
  if (!isPersistentEvent(event)) { callbacks.status(sync("ready", "chat_flow_deferred")); return false; }
  const attemptKey = commandKey(event), existing = attempts.get(attemptKey);
  const expected = generation, operationId = existing?.id || uuid(), token = current.session.tokens.accessToken, context = current.context;
  // Clone before queuing so later caller changes cannot mutate the submitted command.
  const command = JSON.parse(JSON.stringify(event)) as ServerEvent;
  const record: PendingCommand = existing || { scope: originalScope(), id: operationId, event: wireEvent(command), uncertain: false };
  attempts.set(attemptKey, record); saveAttempts();
  let saved = false;
  pending++; callbacks.status(sync("ready"));
  const work = queue.then(async () => {
    if (expected !== generation) { if (!existing?.uncertain) attempts.delete(attemptKey); saveAttempts(); return; }
    try {
      let data: BootstrapData;
      try { data = await request(token, context, command, operationId); }
      catch (error) {
        if (!(error as { uncertain?: boolean }).uncertain) throw error;
        record.uncertain = true; saveAttempts();
        // A lost success response retries the exact operation, never another message.
        data = await request(token, context, command, operationId);
      }
      if (expected !== generation) { record.uncertain = true; saveAttempts(); return; }
      pending--; publish(data, expected); saved = true; attempts.delete(attemptKey); saveAttempts();
    } catch (error) {
      if (expected !== generation) { record.uncertain = true; saveAttempts(); return; }
      pending--; const code = (error as { code?: string }).code || "save_failed";
      const uncertain = Boolean((error as { uncertain?: boolean }).uncertain);
      if (!uncertain && !record.uncertain) attempts.delete(attemptKey); else record.uncertain = true;
      saveAttempts();
      if (code === "access_denied") deny(); else callbacks?.status({ ...sync("error", code), uncertain: attempts.has(attemptKey) });
    }
  });
  queue = work;
  await work;
  return saved;
}
