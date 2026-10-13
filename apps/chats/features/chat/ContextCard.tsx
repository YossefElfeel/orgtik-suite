"use client";

/**
 * SOMION HQ - CONTEXT CARD
 *
 * The differentiator. A live card for an object that lives in one of the other
 * six modules, rendered inside the conversation about it. HQ owns the rendering;
 * the owning module supplies the fields.
 *
 * Four states matter and all four ship, because the interesting cases are the
 * ones where the object has moved on since the conversation started:
 *   live          the normal case, fields current
 *   stale         the object changed after this thread began
 *   no_permission you can see the thread but not the record
 *   deleted       the record is gone; the conversation is not
 */

import {
  ArrowSquareOut,
  Briefcase,
  CheckSquare,
  FileText,
  Receipt,
  UserCircle,
  Warning,
} from "@phosphor-icons/react";
import Link from "next/link";
import { Chip } from "@/components/ui/Primitives";
import { Avatar } from "@/components/ui/Avatar";
import { useUser } from "@/store/hooks";
import { useWorkspace } from "@/store";
import { useT } from "@/lib/i18n";
import { formatShortDay } from "@/lib/time";
import type { ObjectRef } from "@/entities";

const ICON = {
  task: CheckSquare,
  client: Briefcase,
  deal: Briefcase,
  invoice: Receipt,
  employee: UserCircle,
  file: FileText,
} as const;

export function ContextCard({ object, compact = false }: { object: ObjectRef; compact?: boolean }) {
  const t = useT();
  const moduleLabel = (m: string) => (MODULE_KEYS[m] ? t(`suite.app.${MODULE_KEYS[m]}`, m) : m);
  const notify = useWorkspace((st) => st.notify);
  const owner = useUser(object.owner ?? "");
  const Icon = ICON[object.type];

  if (object.state === "no_permission") {
    return (
      <Frame muted>
        <div className="flex items-center gap-2">
          <Warning size={15} aria-hidden="true" className={"ch-color-var---color-ink-subtle"}  />
          <span className={"text-body-sm "+("ch-color-var---color-ink-muted")} >
            {t("card.noPermission", "This conversation is about a record you cannot open.")}
          </span>
        </div>
      </Frame>
    );
  }

  if (object.state === "deleted") {
    return (
      <Frame muted>
        <div className="flex items-center gap-2">
          <Warning size={15} aria-hidden="true" className={"ch-color-var---color-ink-subtle"}  />
          <span className={"text-body-sm "+("ch-color-var---color-ink-muted")} >
            {t("card.deleted", "{title} was deleted. The conversation is kept.", { title: object.title })}
          </span>
        </div>
      </Frame>
    );
  }

  return (
    <Frame>
      <div className="flex items-start gap-2.5">
        <span
          aria-hidden="true"
          className={"flex shrink-0 items-center justify-center "+("ch-width-28px"+' '+"ch-height-28px"+' '+"ch-border-radius-var---radius-control"+' '+"ch-background-var---color-surface-sunken"+' '+"ch-color-var---color-ink-muted")}

        >
          <Icon size={15} weight="bold" />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span className={"text-micro font-medium "+("ch-color-var---color-ink-subtle")} >
              {moduleLabel(object.module)}
            </span>
            {object.state === "stale" && (
              <Chip tone="neutral">{t("card.stale", "changed since")}</Chip>
            )}
          </div>

          <p className={"mt-0.5 truncate text-body-sm font-semibold "+("ch-color-var---color-ink")} >
            <bdi>{object.title}</bdi>
          </p>

          {/* Only the fields that answer "should I act on this" - never a dump
              of the record. */}
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
            <Meta label={t("card.status", "Status")} value={object.status} />
            {object.amount && <Meta label={t("card.amount", "Amount")} value={object.amount} />}
            {object.due && <Meta label={t("card.due", "Due")} value={formatShortDay(object.due)} />}
            {owner && (
              <span className="flex items-center gap-1.5">
                <span className={"text-micro "+("ch-color-var---color-ink-subtle")} >
                  {t("card.owner", "Owner")}
                </span>
                <Avatar name={owner.name} initials={owner.initials} tint={owner.tint} size={20} hideStatus />
                <span className={"text-caption "+("ch-color-var---color-ink")} >
                  <bdi>{owner.name.split(" ")[0]}</bdi>
                </span>
              </span>
            )}
          </div>
        </div>

        {!compact && object.type === "task" && (
          <Link
            href={`/tasks/${object.id}`}
            className={"hq-btn flex shrink-0 items-center gap-1 px-2 text-caption font-medium "+("ch-min-height-28px"+' '+"ch-color-var---color-ink-muted"+' '+"ch-border-1px-solid-var---color-hairline-strong"+' '+"ch-border-radius-var---radius-control")}

          >
            {t("card.open", "Open")}
            <ArrowSquareOut size={12} weight="bold" aria-hidden="true" />
          </Link>
        )}
        {!compact && object.type !== "task" && (
          /* The record lives in another module. The button says which, rather
             than being absent and leaving the card a dead end. */
          <button
            type="button"
            onClick={() =>
              notify(
                t("card.otherModuleTitle", "This {type} lives in another module", { type: object.type }),
                t("card.otherModuleBody", "In the product, Open goes to the record in its own module of the Business OS. That module is not part of this prototype."),
              )
            }
            className={"hq-btn flex shrink-0 items-center gap-1 px-2 text-caption font-medium "+("ch-min-height-28px"+' '+"ch-color-var---color-ink-muted"+' '+"ch-border-1px-solid-var---color-hairline-strong"+' '+"ch-border-radius-var---radius-control")}

          >
            {t("card.open", "Open")}
            <ArrowSquareOut size={12} weight="bold" aria-hidden="true" />
          </button>
        )}
      </div>
    </Frame>
  );
}

function Frame({ children, muted = false }: { children: React.ReactNode; muted?: boolean }) {
  return (
    <div
      className={"p-2.5 "+((muted?"ch-background-var---color-surface-sunken":"ch-background-var---color-surface")+' '+"ch-border-1px-solid-var---color-hairline-strong"+' '+"ch-border-radius-var---radius-card")}

    >
      {children}
    </div>
  );
}

/** The suite's tools by the names the records carry, shown with the suite's own (translated) names. */
const MODULE_KEYS: Record<string, string> = {
  "Task Manager": "task_manager",
  "Sales CRM": "sales",
  "File Manager": "file_manager",
  "HR": "hr_system",
  "Marketing Hub": "digital_marketing",
};

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <span className="flex items-baseline gap-1.5">
      <span className={"text-micro "+("ch-color-var---color-ink-subtle")} >
        {label}
      </span>
      <span className={"text-caption font-medium "+("ch-color-var---color-ink")} >
        <bdi>{value}</bdi>
      </span>
    </span>
  );
}
