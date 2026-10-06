"use client";
import { useCallback } from "react";
import { useTranslations } from "next-intl";
import { useFormatter, useStatusLabel, type StatusState } from "@orgtik/ui";
import { isolate } from "@/lib/bidi";
import { dueDay } from "@/lib/dates";
import type { IActivity } from "@/types/tasks";

type TaskState = StatusState<"task">;
const TASK_STATES: readonly TaskState[] = ["backlog", "todo", "in_progress", "in_review", "done"];

/** The API sends a status as its English label ("In Progress") or as its key; read either. */
function taskState(value: string): TaskState | null {
  const key = value.trim().toLowerCase().replace(/[\s-]+/g, "_");
  if (key === "to_do") return "todo";
  return (TASK_STATES as readonly string[]).includes(key) ? (key as TaskState) : null;
}

type Details = IActivity["details"] & {
  assigneeName?: string;
  field?: string;
};

/**
 * What an activity says, in the reader's language: one message per `action`, filled from
 * `details`, `oldValue` and `newValue`. The actor's name is shown beside it, so the sentence is the
 * predicate only ("changed the status from To Do to Done"). User text (titles, file and section
 * names, people) is isolated so it can't reorder the sentence around it.
 */
export function useActivitySentence() {
  const t = useTranslations("TaskActivity");
  const tPriority = useTranslations("Priority");
  const statusLabel = useStatusLabel();
  const f = useFormatter();

  const status = useCallback(
    (v: string) => {
      const s = taskState(v);
      return s ? statusLabel("task", s) : isolate(v);
    },
    [statusLabel]
  );
  const priority = useCallback(
    (v: string) => (tPriority.has(v.toLowerCase()) ? tPriority(v.toLowerCase()) : isolate(v)),
    [tPriority]
  );
  const day = useCallback(
    (v: string) => f.date(dueDay(v), { dateStyle: "medium", timeZone: "UTC" }),
    [f]
  );

  return useCallback(
    (a: IActivity): string => {
      const d = (a.details ?? {}) as Details;
      const from = a.oldValue;
      const to = a.newValue;
      switch (a.action) {
        case "created":
          return t("created");
        case "status_changed":
          if (to && from) return t("status_changed", { from: status(from), to: status(to) });
          if (to) return t("status_set", { to: status(to) });
          break;
        case "priority_changed":
          if (to && from) return t("priority_changed", { from: priority(from), to: priority(to) });
          if (to) return t("priority_set", { to: priority(to) });
          break;
        case "due_date_changed":
          if (to && from) return t("due_date_changed", { from: day(from), to: day(to) });
          if (to) return t("due_date_set", { to: day(to) });
          return t("due_date_removed");
        case "assigned": {
          const name = d.assigneeName ?? to;
          return name ? t("assigned", { name: isolate(name) }) : t("assigned_someone");
        }
        case "unassigned": {
          const name = d.assigneeName ?? from;
          return name ? t("unassigned", { name: isolate(name) }) : t("unassigned_someone");
        }
        case "subtask_added":
        case "subtask_completed":
        case "subtask_uncompleted":
        case "subtask_deleted":
          return t(a.action, { title: isolate(d.subtaskTitle) });
        case "subtask_updated":
          if (from && to) return t("subtask_renamed", { from: isolate(from), to: isolate(to) });
          return t("subtask_updated", { title: isolate(d.subtaskTitle) });
        case "attachment_added":
        case "attachment_deleted": {
          const size = d.filesize && d.filesize > 0 ? f.bytes(d.filesize) : "";
          return t(a.action, { name: isolate(d.filename), size, hasSize: size ? "yes" : "no" });
        }
        case "commented":
          return t("commented");
        case "moved":
          if (from && to) return t("moved", { from: isolate(from), to: isolate(to) });
          break;
        case "archived":
          return t("archived");
        case "updated": {
          // "title" says from what to what, so it needs both; without them it's a plain update.
          const field = d.field === "title" && !(from && to) ? "other" : (d.field ?? "other");
          return t("updated", { field, from: isolate(from), to: isolate(to) });
        }
      }
      return t("other");
    },
    [day, f, priority, status, t]
  );
}
