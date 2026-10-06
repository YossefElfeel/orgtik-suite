"use client";
// OrgTik's services (USR-16, spec 05): packages with their price in the workspace currency, and
// the quote-only ones marked as such. A subscriber's discount comes off on the quote, as its own
// line. Admins and the owner request; members read.
import { useTranslations } from "next-intl";
import { ArrowRight, ClockCountdown, Tag as TagIcon } from "@phosphor-icons/react";
import { Badge, Card, ErrorState, LoadingState, PageHeader, useFormatter } from "@orgtik/ui";
import useWorkspace from "@/hooks/use-workspace";
import { ButtonLink } from "@/components/shared/ButtonLink";
import { useGetServicesQuery, type Service } from "@/redux/features/platform/services";
import { useLocalized } from "@/components/workspace/account/problems";
import { Notice } from "@/components/workspace/account/Notice";

export function ServicesCatalog() {
  const t = useTranslations("Services");
  const ws = useWorkspace();
  const { data, isLoading, isError, refetch } = useGetServicesQuery();
  const discount = Math.max(0, ...(data ?? []).map((s) => s.subscriberDiscountPct));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t("title")}
        description={t("description", { currency: ws.me?.workspace.currency ?? "" })}
        actions={
          <ButtonLink href="/services/requests" variant="secondary">
            {t("yourRequests")}
          </ButtonLink>
        }
      />
      {isLoading ? (
        <LoadingState rows={4} />
      ) : isError || !data ? (
        <ErrorState title={t("catalog.failedTitle")} description={t("catalog.failedBody")} onRetry={refetch} />
      ) : (
        <>
          {discount > 0 ? <Notice tone="success">{t("catalog.subscriber", { pct: discount })}</Notice> : <Notice tone="info">{t("catalog.notSubscriber")}</Notice>}
          {!ws.isAdmin ? <p className="text-body-sm text-fg-muted">{t("catalog.memberNote")}</p> : null}
          <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {data.map((s) => (
              <li key={s.id} className="flex">
                <ServiceCard service={s} canRequest={ws.isAdmin} />
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function ServiceCard({ service: s, canRequest }: { service: Service; canRequest: boolean }) {
  const t = useTranslations("Services.catalog");
  const f = useFormatter();
  const name = useLocalized();
  const family = s.family.replace(/-/g, "_");
  return (
    <Card className="flex w-full flex-col gap-4">
      <div className="flex flex-col gap-1">
        <p className="text-eyebrow text-fg-muted">{t.has(`families.${family}`) ? t(`families.${family}`) : s.family}</p>
        <h2 className="font-display text-title-sm text-fg">{name(s.name)}</h2>
      </div>
      <div className="flex flex-wrap items-baseline gap-2">
        {s.kind === "package" && s.price ? (
          <>
            <span dir="ltr" className="font-display text-title text-fg tabular-nums">
              {f.money(s.price.amount, s.price.currency)}
            </span>
            <span className="text-body-sm text-fg-muted">{s.billing === "monthly" ? t("perMonth") : t("once")}</span>
          </>
        ) : (
          <>
            <Badge tone="info" emphasis="subtle" icon={<TagIcon />}>
              {t("quoteOnly")}
            </Badge>
            <span className="text-body-sm text-fg-muted">{t("quoteHint")}</span>
          </>
        )}
      </div>
      <ul className="flex flex-col gap-1 text-body-sm text-fg-muted">
        <li className="flex items-center gap-2">
          <ClockCountdown aria-hidden="true" className="shrink-0" />
          {t("delivery", { days: s.deliveryDays })}
        </li>
        {s.subscriberDiscountPct > 0 ? <li>{t("discount", { pct: s.subscriberDiscountPct })}</li> : null}
      </ul>
      {canRequest ? (
        <div className="mt-auto flex">
          <ButtonLink href={`/services/new?service=${encodeURIComponent(s.id)}`} variant="primary">
            {t("request")}
            <span className="sr-only">: {name(s.name)}</span>
            <ArrowRight aria-hidden="true" className="rtl:-scale-x-100" />
          </ButtonLink>
        </div>
      ) : null}
    </Card>
  );
}
