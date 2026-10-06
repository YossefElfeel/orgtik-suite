"use client";

// The rewards a customer can redeem, as cards with the page in the address. After redeeming, the
// coupon code is shown at once, with a copy button (it is also under "My coupons").
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Copy } from "@phosphor-icons/react";
import {
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  EmptyState,
  ErrorState,
  LoadingState,
  Pagination,
  toast,
} from "@orgtik/ui";
import { useRole } from "@/hooks/useRole";
import CustomerLoyaltyRedeemCard from "@/components/pages/loyalty/CustomerLoyaltyRedeemCard";
import { useGetMeLoyaltyOverviewQuery, useGetMeRewardsQuery } from "@/redux/features/loyalty/loyaltyApi";
import { useTeamFormat, useUrlState } from "@/lib/commissions";
import type { LoyaltyMeRedeemResponse } from "@/types/loyalty";

const PAGE_SIZE = 9;

export default function CustomerLoyaltyRedeem() {
  const t = useTranslations("Team.loyalty");
  const f = useTeamFormat();
  const { canEdit } = useRole();
  const url = useUrlState();
  const overview = useGetMeLoyaltyOverviewQuery();
  const rewards = useGetMeRewardsQuery({ page: url.page, limit: PAGE_SIZE });
  const [redeemed, setRedeemed] = useState<LoyaltyMeRedeemResponse | null>(null);
  const o = overview.data?.data;
  const items = rewards.data?.data?.items ?? [];
  const total = rewards.data?.data?.meta?.total ?? 0;

  const copy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success(t("copied"));
    } catch {
      toast.error(t("copyFailed"));
    }
  };

  return (
    <section aria-labelledby="loyalty-rewards" className="flex flex-col gap-4">
      <h2 id="loyalty-rewards" className="font-display text-title-sm text-fg">
        {t("redeemTitleSection")}
      </h2>
      {rewards.isLoading || overview.isLoading ? (
        <LoadingState rows={3} label={t("redeemTitleSection")} />
      ) : rewards.isError ? (
        <ErrorState title={t("rewardsErrorTitle")} description={t("errorBody")} onRetry={() => void rewards.refetch()} />
      ) : items.length === 0 ? (
        <EmptyState title={t("myRewardsEmptyTitle")} description={t("myRewardsEmptyBody")} />
      ) : (
        <>
          <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {items.map((r) => (
              <li key={r.id}>
                <CustomerLoyaltyRedeemCard
                  reward={r}
                  balance={o?.balance ?? 0}
                  baseCurrency={o?.baseCurrency ?? "USD"}
                  programActive={o?.programActive ?? true}
                  canRedeem={canEdit}
                  onRedeemed={setRedeemed}
                />
              </li>
            ))}
          </ul>
          {total > PAGE_SIZE ? <Pagination page={url.page} pageSize={PAGE_SIZE} total={total} onPageChange={(p) => url.set({ page: p })} /> : null}
        </>
      )}

      <Dialog open={Boolean(redeemed)} onOpenChange={(next) => (next ? null : setRedeemed(null))}>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>{t("redeemedTitle")}</DialogTitle>
            {redeemed ? <DialogDescription>{t("redeemedBody", { count: redeemed.pointsSpent, points: f.number(redeemed.pointsSpent), balance: f.number(redeemed.balance), date: f.date(redeemed.expiresAt) ?? "" })}</DialogDescription> : null}
          </DialogHeader>
          <DialogBody>
            {redeemed ? (
              <p className="flex items-center justify-between gap-3 rounded-field border border-line bg-sunken px-4 py-3">
                <bdi dir="ltr" className="font-mono text-title-sm text-fg">
                  {redeemed.couponCode}
                </bdi>
                <Button variant="secondary" size="sm" startIcon={<Copy />} onClick={() => void copy(redeemed.couponCode)}>
                  {t("copyCode")}
                </Button>
              </p>
            ) : null}
          </DialogBody>
          <DialogFooter>
            <Button variant="primary" onClick={() => setRedeemed(null)}>
              {t("done")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
