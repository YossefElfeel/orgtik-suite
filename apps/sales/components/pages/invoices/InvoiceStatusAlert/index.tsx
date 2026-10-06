"use client";

import { Icon } from "@iconify/react";
import type { InvoiceStatus } from "@/types/invoices";
import { formatTimeAgo } from "@/lib/format-date";

type Props = {
  status: InvoiceStatus;
  dueDate?: string;
  issueDate?: string;
  voidedAt?: string;
  voidReason?: string;
};

function toDate(dateStr: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return new Date(`${dateStr}T00:00:00`);
  }
  return new Date(dateStr);
}

function getDaysSince(dateStr: string) {
  const date = toDate(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);

  return Math.max(
    Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)),
    0,
  );
}

import { useTranslations } from "next-intl";

export default function InvoiceStatusAlert({
  status,
  dueDate,
  issueDate,
  voidedAt,
  voidReason,
}: Props) {
  const t = useTranslations("invoices");

  if (status === "overdue") {
    const daysPastDue = dueDate ? getDaysSince(dueDate) : 0;

    return (
      <div className="flex items-start gap-3 rounded-xl border border-red/30 bg-red/10 px-4 py-3.5">
        <Icon
          icon="solar:danger-triangle-bold"
          className="mt-0.5 size-5 shrink-0 text-red"
        />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-red">
            {t("invoicePastDue", { days: daysPastDue })}
          </p>
          <p className="mt-0.5 text-sm text-secondary">
            {t("invoicePastDueAction")}
          </p>
        </div>
      </div>
    );
  }

  if (status === "pending" || status === "partial") {
    const daysPending = issueDate ? getDaysSince(issueDate) : 0;

    return (
      <div className="flex items-start gap-3 rounded-xl border border-yellow/40 bg-yellow/10 px-4 py-3.5">
        <Icon
          icon="solar:danger-triangle-linear"
          className="mt-0.5 size-5 shrink-0 text-yellow"
        />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-yellow">
            {t("invoicePendingDays", { days: daysPending })}
          </p>
          <p className="mt-0.5 text-sm text-secondary">
            {t("invoicePastDueAction")}
          </p>
        </div>
      </div>
    );
  }

  if (status === "void") {
    const voidedLabel = voidedAt
      ? t("voidedAgo", { time: formatTimeAgo(voidedAt) })
      : t("voided");

    return (
      <div className="flex items-start gap-3 rounded-xl border border-border bg-muted px-4 py-3.5">
        <Icon
          icon="solar:danger-triangle-linear"
          className="mt-0.5 size-5 shrink-0 text-secondary"
        />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">{voidedLabel}</p>
          {voidReason ? (
            <p className="mt-0.5 text-sm text-secondary">&quot;{voidReason}&quot;</p>
          ) : null}
        </div>
      </div>
    );
  }

  return null;
}
