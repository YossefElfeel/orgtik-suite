"use client";
import { createElement, useMemo, type ReactNode } from "react";
import { useTranslations } from "next-intl";

// The activity-log API sends either an action code (TICKET_CREATED, created) or its friendly
// English verb ("assigned people on"). Both map to the same catalog key.
const VERB: Record<string, string> = {
  created: "created",
  ticket_created: "created",
  "assigned people on": "assignedPeopleOn",
  ticket_users_assigned: "assignedPeopleOn",
  "updated the status of": "updatedStatusOf",
  ticket_status_updated: "updatedStatusOf",
  "replied on": "repliedOn",
  ticket_message_added: "repliedOn",
  requested: "requested",
  cancelled: "cancelled",
  deleted: "deleted",
  posted: "posted",
  scheduled: "scheduled",
  updated: "updated",
  approved: "approved",
  rejected: "rejected",
};

const ENTITY: Record<string, string> = {
  ticket: "ticket",
  timeoffrequest: "timeOffRequest",
  employee: "employee",
  department: "department",
  job: "job",
  meeting: "meeting",
  settings: "settings",
  payrollbatch: "payrollBatch",
};

/**
 * An activity entry ("Aya Hamed created Ticket") in the reader's language: the person's name is
 * isolated (<bdi>), the subject translated. Returns null for an action the catalog doesn't know,
 * so the caller can show it as sent.
 */
export function useActivityLogLabels() {
  const t = useTranslations("employees.details.activity");
  return useMemo(
    () => ({
      entity: (entityType: string) => {
        const key = ENTITY[entityType.trim().toLowerCase()];
        return key ? t(`entities.${key}`) : entityType;
      },
      sentence: (action: string, entityType: string, name: string): ReactNode | null => {
        const verb = VERB[action.trim().toLowerCase()];
        if (!verb) return null;
        const key = ENTITY[entityType.trim().toLowerCase()];
        return t.rich(`entries.${verb}`, {
          name,
          entity: key ? t(`entities.${key}`) : entityType,
          who: (chunks) => createElement("span", { className: "font-semibold text-foreground" }, createElement("bdi", null, chunks)),
          what: (chunks) => createElement("span", { className: "font-semibold text-foreground" }, chunks),
        });
      },
    }),
    [t],
  );
}
