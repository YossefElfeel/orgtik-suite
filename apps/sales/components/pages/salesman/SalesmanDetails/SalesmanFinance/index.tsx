"use client";

// The salesperson's money: sales and commissions per zone currency, what has been paid out, and the
// wallet balance (the wallet is kept in the zone's currency). "Pay all" settles the whole wallet
// through the wallet-withdraw endpoint (SAL-016), for admins only (SAL-017). The fake "See all
// invoices" toast and the always-empty invoice list are gone (SAL-097): the salesperson's
// commissions open on the Commissions page instead.
import { useTranslations } from "next-intl";
import { ArrowRight, ChartLineUp, CheckCircle, Coins, Wallet } from "@phosphor-icons/react";
import { Button, Card, CardHeader, Stat } from "@orgtik/ui";
import { useRole } from "@/hooks/useRole";
import { ButtonLink } from "@/components/shared/ButtonLink";
import MoneyList from "@/components/pages/commissions/MoneyList";
import PayoutDialog from "@/components/dialogs/salesman/PayoutDialog";
import { toAmount, useTeamFormat } from "@/lib/commissions";
import type { SalesmanDetail } from "@/types/salesman";
import type { ZoneMoneyGroup } from "@/types/money";

const byZone = (groups: ZoneMoneyGroup[] | undefined) => (groups ?? []).map((g) => ({ currency: g.currencyCode, amount: toAmount(g.amount), label: g.zoneName }));

export default function SalesmanFinance({ salesman }: { salesman: SalesmanDetail }) {
  const t = useTranslations("Team.salespeople");
  const f = useTeamFormat();
  const { isAdmin, canEdit } = useRole();
  const finance = salesman.finance;
  const currency = finance.currencyCode || "USD";
  const balance = toAmount(finance.walletBalance);
  const sales = finance.salesByZone?.length ? byZone(finance.salesByZone) : [{ currency, amount: toAmount(finance.totalSalesAmount) }];
  const earned = finance.commissionByZone?.length ? byZone(finance.commissionByZone) : [{ currency, amount: toAmount(finance.totalCommission) }];

  return (
    <Card className="flex flex-col gap-5">
      <CardHeader
        title={t("financeTitle")}
        description={t("financeHint", { currency })}
        actions={
          <>
            <ButtonLink href={`/commissions?salesman=${encodeURIComponent(salesman.id)}`} variant="ghost">
              {t("seeCommissions")}
              <ArrowRight aria-hidden className="size-4 rtl:-scale-x-100" />
            </ButtonLink>
            {isAdmin && canEdit && balance > 0 ? (
              <PayoutDialog
                target={{ kind: "wallet", salesmanId: salesman.id, salesmanName: salesman.fullName, balance, currency }}
                trigger={<Button variant="primary">{t("payAll", { amount: f.money(balance, currency) })}</Button>}
              />
            ) : null}
          </>
        }
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon={<ChartLineUp />} label={t("statSales")} value={<MoneyList amounts={sales} />} hint={t("statSalesHint", { count: finance.contractCount ?? 0, deals: f.number(finance.contractCount ?? 0) })} />
        <Stat icon={<Coins />} label={t("statEarned")} value={<MoneyList amounts={earned} />} />
        <Stat icon={<CheckCircle />} label={t("statPaidOut")} value={f.money(finance.totalWithdrawAmount, currency)} />
        <Stat icon={<Wallet />} label={t("statWallet")} value={f.money(balance, currency)} hint={balance > 0 ? t("statWalletHint") : t("statWalletClear")} />
      </div>
    </Card>
  );
}
