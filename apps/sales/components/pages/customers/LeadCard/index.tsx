"use client";

// A lead on the pipeline board, under its name (which the board renders as the card's button):
// the company, where it came from (a website lead names its page, bundle and campaign), who owns
// it, how old it is, and why it was lost.
import { useTranslations } from "next-intl";
import { Avatar } from "@orgtik/ui";
import type { Customer } from "@/types/customers";
import LeadSource from "../LeadSource";
import { useCustomerDates } from "../leads";

type Props = {
  lead: Customer;
  showOwner: boolean;
};

export default function LeadCard({ lead, showOwner }: Props) {
  const t = useTranslations("Customers.card");
  const dates = useCustomerDates();
  return (
    <div className="flex flex-col gap-2 text-body-sm">
      {lead.companyName ? (
        <span className="truncate text-fg-muted" dir="auto">
          {lead.companyName}
        </span>
      ) : null}
      <LeadSource lead={lead} withContext />
      {lead.status === "lost" && lead.lostReason ? (
        <p className="line-clamp-2 text-caption text-fg-muted">
          {t("lostReason")} <span dir="auto">{lead.lostReason}</span>
        </p>
      ) : null}
      <div className="flex items-center justify-between gap-2 text-caption text-fg-muted">
        {showOwner ? (
          lead.salesName ? (
            <span className="flex min-w-0 items-center gap-1.5">
              <Avatar name={lead.salesName} size="xs" decorative />
              <span className="truncate" dir="auto">
                {lead.salesName}
              </span>
            </span>
          ) : (
            <span className="text-fg-subtle">{t("unassigned")}</span>
          )
        ) : (
          <span />
        )}
        <time dateTime={lead.createdAt} title={dates.date(lead.createdAt)} className="shrink-0">
          {dates.relative(lead.createdAt)}
        </time>
      </div>
    </div>
  );
}
