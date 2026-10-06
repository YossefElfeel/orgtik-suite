import { isolate } from "@/lib/bidi";

// What a notification says and where it leads (FS-TASKS-12). The API's title and message were
// English sentences; they're worded here from the type, the actor and the data, in the reader's
// language. Each one leads to a page that exists: the task's sheet on its board, the project, or
// the team (TASKS-058: they led to /chat, /profile and /users, which Tasks doesn't have, or to the
// project without the task).

export type NotificationLike = {
  id: number;
  type: string;
  group?: string;
  status?: string;
  readAt: string | null;
  clearedAt?: string | null;
  createdAt: string;
  actor?: { firstName?: string; lastName?: string; avatar?: string | null } | null;
  data?: { taskId?: number; projectId?: number; taskTitle?: string; projectTitle?: string; teamId?: number; teamName?: string; status?: string; messageContent?: string };
};

export const KNOWN_TYPES = [
  "task_assigned",
  "task_status_changed",
  "task_due_date_changed",
  "comment_mention",
  "comment_reply",
  "project_member_added",
  "project_team_added",
  "project_updated",
  "team_member_added",
] as const;

export function actorName(n: NotificationLike): string {
  const a = n.actor;
  return a ? `${a.firstName ?? ""} ${a.lastName ?? ""}`.trim() : "";
}

/** The page a notification opens, or null when Tasks has none for it (chat lives in Chats). */
export function notificationHref(n: NotificationLike): string | null {
  const d = n.data ?? {};
  if (d.taskId && d.projectId) return `/projects/${d.projectId}/board?task-id=${d.taskId}`;
  if (d.projectId) return `/projects/${d.projectId}/board`;
  if (d.teamId) return `/teams/${d.teamId}/overview`;
  return null;
}

/** Message key and values for next-intl's "NotificationText" namespace. */
export function notificationText(n: NotificationLike): { key: string; values: Record<string, string> } {
  const d = n.data ?? {};
  const values = { actor: isolate(actorName(n) || "–"), task: isolate(d.taskTitle), project: isolate(d.projectTitle), team: isolate(d.teamName), status: d.status ?? "" };
  const key = (KNOWN_TYPES as readonly string[]).includes(n.type) ? n.type : "other";
  return { key, values };
}
