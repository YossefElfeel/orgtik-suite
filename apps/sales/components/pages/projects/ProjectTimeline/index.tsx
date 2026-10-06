"use client";

// What happened to the project, from the record's own dates: created, contract issued, signed,
// approved or rejected. It was made up from createdAt and updatedAt (SAL-081).
import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { CheckCircle, FilePlus, FolderPlus, SealCheck, XCircle } from "@phosphor-icons/react";
import { Card, CardHeader } from "@orgtik/ui";
import { isolate } from "@/lib/bidi";
import { useDealFormat } from "@/lib/deals/format";
import type { ProjectDetail } from "@/types/projects";

type Entry = { key: string; at: string; icon: ReactNode; text: string; note?: string | null; danger?: boolean };

export default function ProjectTimeline({ project }: { project: ProjectDetail }) {
  const t = useTranslations("Projects");
  const fmt = useDealFormat();
  const c = project.latestContract;
  const entries: Entry[] = [{ key: "created", at: project.createdAt, icon: <FolderPlus />, text: t("eventCreated") }];
  if (c) {
    entries.push({ key: "contract", at: c.createdAt, icon: <FilePlus />, text: t("eventContract", { amount: fmt.money(c.grandTotal, c.currency) }) });
    if (c.confirmedAt) entries.push({ key: "signed", at: c.confirmedAt, icon: <SealCheck />, text: t("eventSigned") });
    if (c.approvedAt) entries.push({ key: "approved", at: c.approvedAt, icon: <CheckCircle weight="fill" />, text: c.approvedBy ? t("eventApprovedBy", { who: isolate(c.approvedBy) }) : t("eventApproved") });
    const rejectedAt = c.rejectedAt ?? (c.status === "rejected" ? c.updatedAt : null);
    if (rejectedAt) entries.push({ key: "rejected", at: rejectedAt, icon: <XCircle weight="fill" />, text: t("eventRejected"), note: c.rejectionReason, danger: true });
  }
  entries.sort((a, b) => a.at.localeCompare(b.at));

  return (
    <Card className="flex flex-col gap-4">
      <CardHeader title={t("timelineTitle")} />
      <ol className="flex flex-col">
        {entries.map((e, i) => (
          <li key={e.key} className="relative flex gap-3 pb-5 last:pb-0">
            {i < entries.length - 1 ? <span aria-hidden className="absolute start-[0.9375rem] top-8 bottom-0 w-px bg-line" /> : null}
            <span
              aria-hidden
              className={
                e.danger
                  ? "grid size-8 shrink-0 place-items-center rounded-pill bg-danger-subtle text-danger [&_svg]:size-4"
                  : "grid size-8 shrink-0 place-items-center rounded-pill bg-brand-subtle text-fg-brand [&_svg]:size-4"
              }
            >
              {e.icon}
            </span>
            <div className="flex min-w-0 flex-col gap-0.5 pt-1">
              <p className="text-body text-fg">{e.text}</p>
              <time dateTime={e.at} className="text-caption text-fg-muted">
                {fmt.dateTime(e.at)}
              </time>
              {e.note ? (
                <p dir="auto" className="mt-1 rounded-field bg-sunken px-3 py-2 text-body-sm text-fg">
                  {e.note}
                </p>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </Card>
  );
}
