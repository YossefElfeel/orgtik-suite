"use client";

// Payroll batches waiting for the admin (FS-HR-7, HR-010). Review is one link (it was a button
// inside a link with a handler that did nothing); words and money come in the reader's language,
// in the batch's own currency (it said "CHF" with three decimals whatever the currency was).
import { useFormatter, useTranslations } from "next-intl";
import { ArrowRight } from "@phosphor-icons/react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import StatusBadge from "@/components/shared/StatusBadge";
import { Link } from "@/i18n/routing";
import type { AdminApprovalsSectionProps } from "@/types/payroll";

export type { IPendingBatch } from "@/types/payroll";

export default function AdminApprovalsSection({ batches }: AdminApprovalsSectionProps) {
  const t = useTranslations("payroll.admin");
  const tFreq = useTranslations("payroll.filters");
  const format = useFormatter();
  const money = (amount: number, currency: string | null) =>
    currency
      ? format.number(amount, { style: "currency", currency })
      : format.number(amount, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="w-full space-y-4">
      <div className="space-y-1">
        <h2 className="text-title-lg font-semibold text-gray-black">{t("title")}</h2>
        <p className="text-body text-secondary">{t("description")}</p>
      </div>

      {!batches?.length ? (
        <div className="w-full border-2 border-dashed border-primary bg-raised rounded-[24px] py-14 flex flex-col items-center justify-center text-center">
          <h3 className="text-title-sm font-medium text-gray-black mb-1">{t("emptyTitle")}</h3>
          <p className="text-body text-secondary">{t("emptyBody")}</p>
        </div>
      ) : (
        <ul className="space-y-4">
          {batches.map((batch) => (
            <li key={batch.id} className="w-full bg-raised border border-line rounded-[10px] overflow-hidden transition-shadow duration-200 hover:shadow-md">
              <div className="p-5 flex items-start justify-between gap-4 border-b border-line">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-title-sm font-semibold text-gray-black">
                      <bdi>{batch.title}</bdi>
                    </h3>
                    <span className="text-caption text-secondary">
                      {tFreq.has(batch.frequency === "biweekly" ? "biWeekly" : batch.frequency)
                        ? tFreq(batch.frequency === "biweekly" ? "biWeekly" : batch.frequency)
                        : batch.frequency}
                    </span>
                  </div>
                  <StatusBadge status={batch.status} />
                </div>

                {/* A link that looks like a button: it opens a page, so it is announced as a link. */}
                <Link href={`/payroll/${batch.id}`} className={cn(buttonVariants({ variant: "outline", size: "lg" }), "text-secondary")}>
                  {t("review")}
                  <ArrowRight className="size-4 text-fg-subtle rtl:-scale-x-100" aria-hidden="true" />
                </Link>
              </div>

              <dl className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-raised p-5">
                <div className="space-y-0.5">
                  <dt className="text-body-lg font-semibold text-gray-black">{t("pendingReview")}</dt>
                  <dd className="text-body-lg text-secondary">{t("people", { count: batch.pendingReviewCount })}</dd>
                </div>
                <div className="space-y-0.5">
                  <dt className="text-body-lg font-semibold text-gray-black">{t("netPay")}</dt>
                  <dd className="text-body-lg text-secondary tabular-nums">{money(batch.netPayableTotal, batch.displayCurrency)}</dd>
                </div>
                <div className="space-y-0.5">
                  <dt className="text-body-lg font-semibold text-gray-black">{t("decided")}</dt>
                  <dd className="text-body-lg text-secondary">
                    {t("decidedValue", { decided: batch.decidedCount, flagged: batch.flaggedCount })}
                  </dd>
                </div>
              </dl>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
