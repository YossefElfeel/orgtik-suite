"use client";

// One reward the customer can redeem: what it gives, what it costs, and Redeem (which asks first and
// names the points). A reward out of reach says how many more points it needs.
import { useTranslations } from "next-intl";
import { Gift } from "@phosphor-icons/react";
import { Badge, Button, Card, ConfirmDialog } from "@orgtik/ui";
import { useRedeemMeRewardMutation } from "@/redux/features/loyalty/loyaltyApi";
import { useTeamFormat } from "@/lib/commissions";
import { isolate } from "@/lib/bidi";
import type { LoyaltyMeRedeemResponse, LoyaltyMeReward } from "@/types/loyalty";

type Props = {
  reward: LoyaltyMeReward;
  balance: number;
  baseCurrency: string;
  programActive: boolean;
  canRedeem: boolean;
  onRedeemed: (result: LoyaltyMeRedeemResponse) => void;
};

export default function CustomerLoyaltyRedeemCard({ reward, balance, baseCurrency, programActive, canRedeem, onRedeemed }: Props) {
  const t = useTranslations("Team.loyalty");
  const f = useTeamFormat();
  const [redeem] = useRedeemMeRewardMutation();
  const short = Math.max(0, reward.pointCost - balance);
  const affordable = short === 0;
  const discount = f.discount(reward.discountType, reward.discountValue, baseCurrency);

  return (
    <Card className="flex h-full flex-col gap-4">
      <div className="flex items-start gap-3">
        <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-pill bg-brand-subtle text-fg-brand">
          <Gift className="size-5" />
        </span>
        <div className="flex min-w-0 flex-col gap-1">
          <h3 dir="auto" className="font-display text-title-sm text-fg">
            {reward.name}
          </h3>
          <p className="text-body-sm text-fg-muted">
            {t("rewardGives", { discount, count: reward.validForDays, days: f.number(reward.validForDays) })}
            {reward.categoryName ? (
              <>
                {" "}
                <span dir="auto">{t("rewardValidOn", { category: isolate(reward.categoryName) })}</span>
              </>
            ) : null}
          </p>
        </div>
      </div>
      <div className="mt-auto flex flex-wrap items-center justify-between gap-3">
        <Badge tone={affordable ? "success" : "neutral"}>{t("pointsValue", { count: reward.pointCost, points: f.number(reward.pointCost) })}</Badge>
        {canRedeem ? (
          affordable && programActive ? (
            <ConfirmDialog
              tone="primary"
              trigger={<Button variant="primary" size="sm">{t("redeem")}</Button>}
              title={t("redeemTitle", { name: isolate(reward.name), count: reward.pointCost, points: f.number(reward.pointCost) })}
              impact={t("redeemImpact", { before: f.number(balance), after: f.number(balance - reward.pointCost), count: reward.validForDays, days: f.number(reward.validForDays) })}
              confirmLabel={t("redeemConfirm", { count: reward.pointCost, points: f.number(reward.pointCost) })}
              onConfirm={async () => {
                const res = await redeem(reward.id).unwrap();
                onRedeemed(res.data);
              }}
            />
          ) : (
            <span className="text-body-sm text-fg-subtle">{programActive ? t("pointsShort", { count: short, points: f.number(short) }) : t("redeemPaused")}</span>
          )
        ) : null}
      </div>
    </Card>
  );
}
