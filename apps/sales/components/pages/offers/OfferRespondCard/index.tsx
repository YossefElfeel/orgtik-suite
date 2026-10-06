"use client";

// Answering an offer, for the side whose turn it is: accept at the amount on the table, send a
// counter, or decline. Each one asks first and names the amount (SAL-064); accepting creates the
// project, which the page then links to.
import { useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowsLeftRight, Check, X } from "@phosphor-icons/react";
import { Button, Card, CardHeader, ConfirmDialog } from "@orgtik/ui";
import CounterOfferDialog from "@/components/dialogs/offers/CounterOfferDialog";
import { useAcceptOfferMutation, useRejectOfferMutation } from "@/redux/features/offers/offersApi";
import { useRole } from "@/hooks/useRole";
import { isolate } from "@/lib/bidi";
import { num, useDealFormat } from "@/lib/deals/format";
import type { OfferDetail } from "@/types/offers";

export default function OfferRespondCard({ offer }: { offer: OfferDetail }) {
  const t = useTranslations("Offers");
  const fmt = useDealFormat();
  const { isCustomer } = useRole();
  const [accept] = useAcceptOfferMutation();
  const [reject] = useRejectOfferMutation();
  const [accepting, setAccepting] = useState(false);
  const [declining, setDeclining] = useState(false);
  const [countering, setCountering] = useState(false);
  // What accepting agrees to: the latest counter, else the quote.
  const onTable = offer.status === "countered" && offer.counterTotal != null ? num(offer.counterTotal) : num(offer.summary.total);
  const amount = fmt.money(onTable, offer.currencyCode);
  const other = isCustomer ? t("sideStaff") : isolate(offer.customer.fullName);

  return (
    <Card className="flex flex-col gap-4">
      <CardHeader title={t("respondTitle")} description={t("respondBody", { amount })} />
      {offer.status === "countered" && offer.counterNote ? (
        <blockquote dir="auto" className="rounded-field bg-sunken px-3 py-2 text-body-sm whitespace-pre-line text-fg">
          {offer.counterNote}
        </blockquote>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button variant="primary" onClick={() => setAccepting(true)} startIcon={<Check aria-hidden className="size-4" />}>
          {t("accept")}
        </Button>
        <Button variant="secondary" onClick={() => setCountering(true)} startIcon={<ArrowsLeftRight aria-hidden className="size-4" />}>
          {t("counter")}
        </Button>
        <Button variant="ghost" onClick={() => setDeclining(true)} startIcon={<X aria-hidden className="size-4" />}>
          {t("decline")}
        </Button>
      </div>

      <ConfirmDialog
        open={accepting}
        onOpenChange={setAccepting}
        tone="primary"
        title={t("acceptTitle", { amount })}
        impact={isCustomer ? t("acceptImpactCustomer", { amount }) : t("acceptImpactStaff", { amount, customer: isolate(offer.customer.fullName) })}
        confirmLabel={t("acceptConfirm", { amount })}
        onConfirm={() => accept({ offerId: offer.id, body: {} }).unwrap()}
      />
      <ConfirmDialog
        open={declining}
        onOpenChange={setDeclining}
        title={t("declineTitle", { name: isolate(offer.name) })}
        impact={t("declineImpact", { other })}
        confirmLabel={t("declineConfirm")}
        reason={{ label: t("declineReason") }}
        onConfirm={({ reason }) => reject({ offerId: offer.id, body: reason ? { note: reason } : {} }).unwrap()}
      />
      <CounterOfferDialog offer={offer} onTable={onTable} open={countering} onOpenChange={setCountering} />
    </Card>
  );
}
