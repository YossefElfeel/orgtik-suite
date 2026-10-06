"use client";

import TextFormEle from "@/components/ui/form/text-form-element";
import { Button } from "@/components/ui/button";
import type { SubscribePlanCouponFieldProps } from "@/types/subscriptions";
import { useTranslations } from "next-intl";

export default function SubscribePlanCouponField({
  form,
  appliedCoupon,
  couponError,
  appliedCouponDiscountLabel,
  isApplying = false,
  applyDisabled = false,
  onApply,
}: SubscribePlanCouponFieldProps) {
  const t = useTranslations("planManagement.subscribe");
  const tCommon = useTranslations("common");

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-end gap-2">
        <div className="min-w-0 flex-1">
          <TextFormEle
            form={form}
            name="couponCode"
            label={t("coupon")}
            placeholder={t("couponPlaceholder")}
            optional
          />
        </div>
        <Button
          type="button"
          variant="outline"
          className="mb-0.5 shrink-0"
          disabled={isApplying || applyDisabled}
          onClick={onApply}
        >
          {tCommon("apply")}
        </Button>
      </div>
      {couponError ? <p className="text-xs text-red">{couponError}</p> : null}
      {appliedCoupon && appliedCouponDiscountLabel ? (
        <p className="text-xs text-green">
          {t("couponApplied", { code: appliedCoupon, amount: appliedCouponDiscountLabel })}
        </p>
      ) : null}
    </div>
  );
}
