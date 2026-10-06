"use client";

// The negotiation as a timeline: who sent what amount, with their note, oldest first, each step in
// words and with the time in the organisation's time zone.
import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { ArrowsLeftRight, CheckCircle, PaperPlaneTilt, PencilSimple, XCircle } from "@phosphor-icons/react";
import { Card, CardHeader } from "@orgtik/ui";
import { useRole } from "@/hooks/useRole";
import { useDealFormat } from "@/lib/deals/format";
import type { OfferDetail } from "@/types/offers";

const ICONS: Record<string, ReactNode> = {
  quote_created: <PaperPlaneTilt />,
  quote_updated: <PencilSimple />,
  counter_offer: <ArrowsLeftRight />,
  accepted: <CheckCircle weight="fill" />,
  rejected: <XCircle weight="fill" />,
};
const KNOWN = new Set(Object.keys(ICONS));

export default function OfferTimeline({ offer }: { offer: OfferDetail }) {
  const t = useTranslations("Offers");
  const fmt = useDealFormat();
  const { isCustomer } = useRole();
  const events = [...offer.events].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const who = (side: string) => (side === "customer" ? (isCustomer ? t("sideYou") : t("sideCustomer")) : isCustomer ? t("sideSalesTeam") : t("sideTeam"));

  return (
    <Card className="flex flex-col gap-4">
      <CardHeader title={t("historyTitle")} />
      {events.length === 0 ? (
        <p className="text-body-sm text-fg-muted">{t("historyEmpty")}</p>
      ) : (
        <ol className="flex flex-col">
          {events.map((e, i) => (
            <li key={e.id} className="relative flex gap-3 pb-5 last:pb-0">
              {i < events.length - 1 ? <span aria-hidden className="absolute start-[0.9375rem] top-8 bottom-0 w-px bg-line" /> : null}
              <span
                aria-hidden
                className={
                  e.type === "rejected"
                    ? "grid size-8 shrink-0 place-items-center rounded-pill bg-danger-subtle text-danger [&_svg]:size-4"
                    : "grid size-8 shrink-0 place-items-center rounded-pill bg-brand-subtle text-fg-brand [&_svg]:size-4"
                }
              >
                {ICONS[e.type] ?? <PencilSimple />}
              </span>
              <div className="flex min-w-0 flex-col gap-0.5 pt-1">
                <p className="text-body text-fg">
                  {t(`event.${KNOWN.has(e.type) ? e.type : "other"}`, { amount: fmt.money(e.amount, e.currencyCode || offer.currencyCode) })}
                </p>
                <p className="text-caption text-fg-muted">
                  {who(e.actorType)} · <time dateTime={e.createdAt}>{fmt.dateTime(e.createdAt)}</time>
                </p>
                {e.note ? (
                  <p dir="auto" className="mt-1 rounded-field bg-sunken px-3 py-2 text-body-sm whitespace-pre-line text-fg">
                    {e.note}
                  </p>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}
