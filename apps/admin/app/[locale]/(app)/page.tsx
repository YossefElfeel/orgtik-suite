"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { ArrowRight, Buildings, CurrencyCircleDollar, Headset, Hourglass, Invoice, Receipt, Swap, Handshake, ListChecks } from "@phosphor-icons/react";
import { ErrorState, PageHeader, Stat, useFormatter } from "@orgtik/ui";
import { RequirePermission } from "@/components/frame/RequirePermission";
import { Link } from "@/i18n/routing";
import { useCan } from "@/lib/permissions";
import { useOverviewQuery } from "@/store/overview";

/** A piece of work waiting for someone, linking to the list that holds it (when the role can open it). */
function Queue({ count, label, href, permission, icon }: { count: number; label: string; href: string; permission: string; icon: ReactNode }) {
  const can = useCan();
  const f = useFormatter();
  const body = (
    <>
      <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-pill bg-brand-subtle text-fg-brand [&_svg]:size-5">{icon}</span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="font-display text-title-sm tabular-nums text-fg">{f.number(count)}</span>
        <span className="text-body-sm text-fg-muted">{label}</span>
      </span>
      {can(permission) ? <ArrowRight aria-hidden="true" className="size-4 text-fg-subtle rtl:-scale-x-100" /> : null}
    </>
  );
  const cls = "flex items-center gap-3 rounded-card border border-line bg-raised p-4";
  return can(permission) ? (
    <Link href={href} className={`${cls} hover:bg-hover focus-visible:outline-2 focus-visible:outline-focus`}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

function OverviewPage() {
  const t = useTranslations("Overview");
  const tc = useTranslations("Common");
  const f = useFormatter();
  const { data, isLoading, isError, refetch } = useOverviewQuery();
  if (isError) return <ErrorState title={tc("loadFailed")} description={tc("loadFailedBody")} onRetry={() => refetch()} />;
  const ws = data?.workspaces ?? {};
  const totalWs = Object.entries(ws).filter(([k]) => k !== "deleted").reduce((s, [, n]) => s + n, 0);
  return (
    <div className="flex flex-col gap-8">
      <PageHeader title={t("title")} description={t("description")} />
      <section aria-labelledby="ov-numbers" aria-busy={isLoading || undefined} className="flex flex-col gap-4">
        <h2 id="ov-numbers" className="sr-only">{t("numbers")}</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Stat loading={isLoading} icon={<CurrencyCircleDollar />} label={t("mrr")} value={data ? f.money(data.mrrUsd, "USD") : "—"} hint={t("mrrHint")} />
          <Stat loading={isLoading} icon={<Buildings />} label={t("workspaces")} value={f.number(totalWs)} hint={t("workspacesHint", { active: ws.active ?? 0, pastDue: ws.past_due ?? 0, suspended: ws.suspended ?? 0 })} />
          <Stat loading={isLoading} icon={<Hourglass />} label={t("trials")} value={f.number(data?.lines.trialing ?? 0)} hint={t("trialsHint", { count: data?.trialsEndingIn3Days ?? 0 })} />
          <Stat loading={isLoading} icon={<Invoice />} label={t("pastDue")} value={f.number(data?.invoices.past_due ?? 0)} hint={t("pastDueHint", { open: data?.invoices.open ?? 0 })} />
        </div>
      </section>
      <section aria-labelledby="ov-queue" className="flex flex-col gap-4">
        <h2 id="ov-queue" className="font-display text-title-sm text-fg">{t("queue")}</h2>
        {data ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <Queue count={data.invoices.past_due ?? 0} label={t("q.pastDue")} href="/invoices?state=past_due" permission="billing:view" icon={<Invoice />} />
            <Queue count={data.serviceRequests.new ?? 0} label={t("q.newRequests")} href="/service-requests?state=new" permission="services:view" icon={<Receipt />} />
            <Queue count={data.tickets.open ?? 0} label={t("q.openTickets")} href="/tickets?state=open" permission="tickets:view" icon={<Headset />} />
            <Queue count={data.customPlanRequests} label={t("q.customPlans")} href="/custom-plans" permission="workspaces:view" icon={<Handshake />} />
            <Queue count={data.migrations} label={t("q.migrations")} href="/migrations" permission="workspaces:view" icon={<Swap />} />
            <Queue count={data.waitlist} label={t("q.waitlist")} href="/waitlist" permission="waitlist:view" icon={<ListChecks />} />
          </div>
        ) : null}
      </section>
    </div>
  );
}

export default function Page() {
  return (
    <RequirePermission permission="overview:view">
      <OverviewPage />
    </RequirePermission>
  );
}
