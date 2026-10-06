"use client";

// "Needs attention" for admins and managers: commissions waiting to be paid and overdue invoices,
// each with how many, how much per currency, and a link to the list where it's handled. The old
// block had iconify icons on tinted circles, a count bubble with no words, and no way on.
import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { CheckCircle, Receipt, Wallet } from "@phosphor-icons/react";
import { EmptyState, LoadingState, useFormatter } from "@orgtik/ui";
import { Link } from "@/i18n/routing";
import { useRole } from "@/hooks/useRole";
import { canAccessRoute } from "@/lib/role-access";
import HomeSection from "@/components/pages/home/HomeSection";
import type { DashboardData } from "@/types/dashboard";
import type { ZoneMoneyGroup } from "@/types/money";

type Item = { id: string; icon: ReactNode; title: string; amounts: ZoneMoneyGroup[]; href: string; link: string };

export default function NeedsAttention({ data, loading }: { data: DashboardData["needAttention"]; loading?: boolean }) {
  const t = useTranslations("SalesHome");
  const f = useFormatter();
  const { role } = useRole();
  if (loading) {
    return (
      <HomeSection title={t("attentionTitle")}>
        <LoadingState rows={2} />
      </HomeSection>
    );
  }
  if (!data) return null;

  const items: Item[] = [];
  if (data.commissionsReadyToPay?.count) {
    items.push({
      id: "commissions",
      icon: <Wallet />,
      title: t("attentionCommissions", { count: data.commissionsReadyToPay.count }),
      amounts: data.commissionsReadyToPay.totalAmount ?? [],
      href: "/commissions",
      link: t("openCommissions"),
    });
  }
  if (data.overdueInvoices?.count) {
    items.push({
      id: "invoices",
      icon: <Receipt />,
      title: t("attentionInvoices", { count: data.overdueInvoices.count }),
      amounts: data.overdueInvoices.totalAmount ?? [],
      href: "/invoices",
      link: t("openInvoices"),
    });
  }

  return (
    <HomeSection title={t("attentionTitle")} description={items.length ? t("attentionBody") : undefined}>
      {items.length ? (
        <ul className="flex flex-col gap-3">
          {items.map((item) => (
            <li key={item.id} className="flex items-start gap-3 rounded-card border border-line p-4">
              <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-pill bg-warning-subtle text-warning [&>svg]:size-5">
                {item.icon}
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <p className="text-body font-medium text-fg">{item.title}</p>
                {item.amounts.length ? (
                  <p className="flex flex-wrap gap-x-3 gap-y-0.5 text-body-sm text-fg-muted tabular-nums">
                    {item.amounts.map((a) => (
                      <span key={`${a.zoneId ?? "none"}-${a.currencyCode}`}>{f.money(Number(a.amount) || 0, a.currencyCode)}</span>
                    ))}
                  </p>
                ) : null}
                {canAccessRoute(role, item.href) ? (
                  <Link href={item.href} className="w-fit text-label text-fg-brand hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus">
                    {item.link}
                  </Link>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState size="compact" icon={<CheckCircle />} title={t("attentionEmpty")} />
      )}
    </HomeSection>
  );
}
