"use client";

import { Icon } from "@iconify/react";
import { Switch } from "@/components/ui/switch";
import { useRole } from "@/hooks/useRole";
import { useUpdateSubscriptionAutoRenewMutation } from "@/redux/features/subscriptions/subscriptionsApi";
import { useTranslations } from "next-intl";

type Props = {
  id: string;
  autoRenew: boolean;
};

export default function SubscriptionDetailsAutoRenew({ id, autoRenew }: Props) {
  const { isCustomer } = useRole();
  const [updateAutoRenew, { isLoading }] =
    useUpdateSubscriptionAutoRenewMutation();
  const tSub = useTranslations("subscriptions");

  if (isCustomer) return null;

  const handleCheckedChange = async (enabled: boolean) => {
    await updateAutoRenew({ id, body: { enabled } }).unwrap();
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border px-4 py-3.5">
      <div className="flex min-w-0 items-start gap-3">
        <Icon
          icon="solar:refresh-circle-linear"
          className="mt-0.5 size-5 shrink-0 text-secondary"
        />
        <div className="flex min-w-0 flex-col gap-0.5">
          <p className="text-sm font-semibold text-foreground">
            {tSub("autoRenewTitle")}
          </p>
          <p className="text-sm text-secondary">
            {tSub("autoRenewDescription")}
          </p>
        </div>
      </div>
      <Switch
        checked={autoRenew}
        onCheckedChange={handleCheckedChange}
        disabled={isLoading}
      />
    </div>
  );
}
