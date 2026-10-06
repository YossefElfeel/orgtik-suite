"use client";

/**
 * TASK MANAGER (stand-in)
 *
 * Not part of HQ. This is a small facsimile of a sibling module, and it exists
 * for one reason: to show the two components HQ publishes into the rest of the
 * suite doing their job in someone else's screen.
 *
 *   1. the presence dot on the assignee - the same dot as on the floor
 *   2. the Discuss button, and the conversations list it fills
 *
 * Everything else here is deliberately plain. It is not trying to be a task
 * manager; it is trying to be somewhere else.
 */

import Link from "next/link";
import { ArrowLeft, CheckSquare } from "@phosphor-icons/react";
import { Avatar } from "@/components/ui/Avatar";
import { Panel, SectionHead } from "@/components/ui/Primitives";
import { DiscussButton, ObjectConversations } from "@/features/chat/DiscussButton";
import { usePresenceOf, useUser } from "@/store/hooks";
import { useWorkspace } from "@/store";
import { useT } from "@/lib/i18n";
import { formatShortDay } from "@/lib/time";
import { tasks } from "@/mock/seed";
import type { ObjectRef } from "@/entities";
import { SOS_URL } from "@/lib/suite-session";

export function TaskScreen({ taskId }: { taskId: string }) {
  const t = useT();
  const task = tasks.find((x) => x.id === taskId) ?? tasks[0];

  const assignee = useUser(task?.assigneeId ?? "");
  const assigneePresence = usePresenceOf(task?.assigneeId ?? "");
  const owner = useUser(task?.ownerId ?? "");
  const focusOnPerson = useWorkspace((s) => s.focusOnPerson);

  if (!task) return null;

  const object: ObjectRef = {
    type: "task",
    id: task.id,
    title: task.title,
    status: task.status,
    owner: task.ownerId,
    due: task.due,
    module: "Task Manager",
    state: "live",
  };

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto w-full max-w-[860px] px-6 py-6">
        <Link
          href="/hq/office"
          className="mb-3 -ms-2 inline-flex min-h-[32px] items-center gap-1.5 rounded-[var(--radius-control)] px-2 text-[12.5px]"
          style={{ color: "var(--color-ink-muted)" }}
        >
          <ArrowLeft size={13} weight="bold" aria-hidden="true" className="rtl:-scale-x-100" />
          {t("task.backToHq", "Back to Chats")}
        </Link>
        {/* This page is the prototype's stand-in for a task, so Discuss can be shown where it lives.
            The real task is in Tasks, opened through the suite with a one-time code (CHT-042). */}
        {SOS_URL ? (
          <a
            href={`${SOS_URL}/go/task_manager`}
            className="mb-3 ms-3 inline-flex min-h-[32px] items-center gap-1.5 px-2 text-[12.5px] font-medium"
            style={{ color: "var(--color-ink-brand)" }}
          >
            {t("task.openInTasks", "Open Tasks")}
          </a>
        ) : null}

        <div className="flex items-start gap-3">
          <span
            aria-hidden="true"
            className="flex shrink-0 items-center justify-center"
            style={{
              width: 36,
              height: 36,
              borderRadius: "var(--radius-control)",
              background: "var(--color-surface-sunken)",
              color: "var(--color-ink-muted)",
            }}
          >
            <CheckSquare size={18} weight="bold" />
          </span>
          <div className="min-w-0">
            <p className="text-[12px] font-medium" style={{ color: "var(--color-ink-subtle)" }}>
              {t("task.module", "Task Manager")} · {task.id.toUpperCase()}
            </p>
            <h1
              className="hq-display mt-1"
              style={{ color: "var(--color-ink)" }}
            >
              <bdi>{task.title}</bdi>
            </h1>
          </div>
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_260px]">
          <div className="flex flex-col gap-5">
            <Panel>
              <p className="text-[13.5px] leading-relaxed" style={{ color: "var(--color-ink)", maxWidth: "68ch" }}>
                {task.description}
              </p>
            </Panel>

            <section>
              <SectionHead title={t("task.conversations", "Conversations")} />
              <ObjectConversations object={object} />
            </section>
          </div>

          <aside className="flex flex-col gap-4">
            <Panel>
              <dl className="flex flex-col gap-3">
                <Row label={t("task.status", "Status")}>
                  <span className="text-[13px] font-medium" style={{ color: "var(--color-ink)" }}>
                    <bdi>{task.status}</bdi>
                  </span>
                </Row>

                {/* The presence dot, on a screen that is not HQ. This is the
                    whole cross-module argument in one component. */}
                <Row label={t("task.assignee", "Assignee")}>
                  {assignee && (
                    <span className="flex items-center gap-1.5">
                      <Avatar
                        name={assignee.name}
                        initials={assignee.initials}
                        tint={assignee.tint}
                        status={assigneePresence?.status}
                        size={20}
                      />
                      <span className="text-[13px]" style={{ color: "var(--color-ink)" }}>
                        <bdi>{assignee.name}</bdi>
                      </span>
                      {assigneePresence && assigneePresence.status !== "offline" && (
                        <Link
                          href="/hq/office"
                          onClick={() => focusOnPerson(assignee.id)}
                          className="text-[12px] font-medium"
                          style={{ color: "var(--color-ink-brand)" }}
                        >
                          {t("task.findOnFloor", "Find on floor")}
                        </Link>
                      )}
                    </span>
                  )}
                </Row>

                <Row label={t("task.owner", "Owner")}>
                  {owner && (
                    <span className="text-[13px]" style={{ color: "var(--color-ink)" }}>
                      <bdi>{owner.name}</bdi>
                    </span>
                  )}
                </Row>

                <Row label={t("task.due", "Due")}>
                  <span className="tabular text-[13px]" style={{ color: "var(--color-ink)" }}>
                    {formatShortDay(task.due)}
                  </span>
                </Row>

                <Row label={t("task.client", "Client")}>
                  <span className="text-[13px]" style={{ color: "var(--color-ink)" }}>
                    {task.client}
                  </span>
                </Row>
              </dl>
            </Panel>

            <DiscussButton object={object} suggestedParticipants={[task.assigneeId, task.ownerId]} />
          </aside>
        </div>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-[12px]" style={{ color: "var(--color-ink-muted)" }}>
        {label}
      </dt>
      <dd className="min-w-0 text-end">{children}</dd>
    </div>
  );
}
