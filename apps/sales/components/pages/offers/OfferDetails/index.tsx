"use client";

// An offer: what was quoted, where the negotiation stands and what both sides agreed. The agreed
// total is the counter once one was accepted, here as in the list (SAL-014). The page always ends
// in a state: loading, the offer, not found, no access, or an error with Retry (SAL-094).
import { useTranslations } from "next-intl";
import { ArrowRight, CheckCircle, HourglassMedium, XCircle } from "@phosphor-icons/react";
import { EmptyState, ErrorState, NoPermissionState, PageHeader, Skeleton } from "@orgtik/ui";
import { ButtonLink } from "@/components/shared/ButtonLink";
import { SalesStatus } from "@/components/shared/SalesStatus";
import OfferCustomerCard from "@/components/pages/offers/OfferCustomerCard";
import OfferDealCard from "@/components/pages/offers/OfferDealCard";
import OfferHeaderActions from "@/components/pages/offers/OfferHeaderActions";
import OfferRespondCard from "@/components/pages/offers/OfferRespondCard";
import OfferTimeline from "@/components/pages/offers/OfferTimeline";
import { useRole } from "@/hooks/useRole";
import { useGetOfferByIdQuery } from "@/redux/features/offers/offersApi";
import { useDealFormat } from "@/lib/deals/format";
import { agreedTotal, awaiting } from "@/lib/deals/offer";
import { detailState } from "@/lib/deals/query-state";

export default function OfferDetails({ id }: { id: string }) {
  const t = useTranslations("Offers");
  const fmt = useDealFormat();
  const { isCustomer, canEdit } = useRole();
  const { data, isLoading, isError, error, refetch } = useGetOfferByIdQuery(id);
  const offer = data?.data;
  const state = detailState({ isLoading, isError, error, hasData: Boolean(offer) });
  const back = (
    <ButtonLink href="/offers" variant="secondary">
      {t("backToOffers")}
    </ButtonLink>
  );

  if (state === "loading")
    return (
      <div className="flex flex-col gap-6" aria-busy="true" aria-label={t("loading")}>
        <Skeleton className="h-8 w-72" />
        <div className="grid gap-5 lg:grid-cols-2">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  if (state === "not-found") return <EmptyState titleAs="h1" title={t("notFoundTitle")} description={t("notFoundBody")} action={back} />;
  if (state === "forbidden") return <NoPermissionState titleAs="h1" title={t("forbiddenTitle")} description={t("forbiddenBody")} action={back} />;
  if (state === "error" || !offer) return <ErrorState titleAs="h1" title={t("errorTitle")} description={t("errorBody")} onRetry={() => void refetch()} />;

  const side = awaiting(offer);
  const mySide = isCustomer ? "customer" : "staff";
  const myTurn = canEdit && side === mySide;
  const total = agreedTotal(offer);

  const banner =
    offer.status === "accepted" ? (
      <div role="status" className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-line bg-raised p-4">
        <p className="flex items-center gap-2 text-body text-fg">
          <CheckCircle aria-hidden weight="fill" className="size-5 shrink-0 text-fg-brand" />
          {t("acceptedBanner", { amount: fmt.money(total, offer.currencyCode) })}
        </p>
        {offer.projectId ? (
          <ButtonLink href={`/projects/${offer.projectId}`} variant="secondary">
            {t("openProject")}
            <ArrowRight aria-hidden className="size-4 rtl:-scale-x-100" />
          </ButtonLink>
        ) : null}
      </div>
    ) : offer.status === "rejected" ? (
      <p role="status" className="flex items-center gap-2 rounded-card border border-line bg-raised p-4 text-body text-fg">
        <XCircle aria-hidden weight="fill" className="size-5 shrink-0 text-danger" />
        {t("declinedBanner")}
      </p>
    ) : (
      <p role="status" className="flex items-center gap-2 rounded-card border border-line bg-raised p-4 text-body text-fg">
        <HourglassMedium aria-hidden className="size-5 shrink-0 text-fg-muted" />
        {side === mySide ? t("yourTurn") : side === "customer" ? t("waitingCustomer") : t("waitingStaff")}
      </p>
    );

  return (
    <section className="flex flex-col gap-6">
      <PageHeader
        breadcrumb={[{ label: t("title"), href: "/offers" }, { label: offer.name }]}
        title={<span dir="auto">{offer.name}</span>}
        status={<SalesStatus kind="offer" value={offer.status} />}
        description={t("submittedOn", { date: fmt.date(offer.submittedAt) })}
        actions={!isCustomer && canEdit ? <OfferHeaderActions offer={offer} /> : null}
      />
      {banner}
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-5">
          {myTurn ? <OfferRespondCard offer={offer} /> : null}
          <OfferDealCard offer={offer} />
        </div>
        <div className="flex flex-col gap-5">
          {isCustomer ? null : <OfferCustomerCard customer={offer.customer} />}
          <OfferTimeline offer={offer} />
        </div>
      </div>
    </section>
  );
}
