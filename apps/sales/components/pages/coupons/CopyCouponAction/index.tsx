"use client";
import { useTranslations } from "next-intl";

import { toast } from "sonner";
import { ActionItem } from "@/components/shared/Table/cell/ActionCell";

type CopyCouponActionProps = {
  code: string;
};

export function CopyCouponAction({ code }: CopyCouponActionProps) {
  const tCommon = useTranslations("common");

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success("Coupon code copied");
    } catch {
      toast.error("Failed to copy coupon code");
    }
  };

  return (
    <ActionItem
      icon="solar:copy-linear"
      label={tCommon("copy")}
      onClick={handleCopy}
    />
  );
}
