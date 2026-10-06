"use client";

import { useState, type ReactElement } from "react";
import { useRole } from "@/hooks/useRole";
import {
  usePauseCustomerSubscriptionMutation,
  usePauseSubscriptionMutation,
} from "@/redux/features/subscriptions/subscriptionsApi";
import { ReusableDialog } from "@/components/dialogs/shared/ReusableDialog";
import { useTranslations } from "next-intl";

type Props = {
  trigger: ReactElement;
  id: string;
};

export default function PauseSubscriptionDialog({ trigger, id }: Props) {
  const t = useTranslations("subscriptions");
  const tCommon = useTranslations("common");
  const [open, setOpen] = useState(false);
  const { isCustomer } = useRole();
  const [pauseAdminSubscription, { isLoading: isAdminPausing }] =
    usePauseSubscriptionMutation();
  const [pauseCustomerSubscription, { isLoading: isCustomerPausing }] =
    usePauseCustomerSubscriptionMutation();
  const isLoading = isAdminPausing || isCustomerPausing;

  const handleConfirm = async () => {
    const pauseSubscription = isCustomer
      ? pauseCustomerSubscription
      : pauseAdminSubscription;
    await pauseSubscription(id).unwrap();
    setOpen(false);
  };

  return (
    <ReusableDialog
      open={open}
      onOpenChange={setOpen}
      trigger={trigger}
      title={t("pauseSubscription", { fallback: "Pause this subscription?" })}
      size="xl"
      className="sm:max-w-[630px]"
      onCancelText={tCommon("cancel", { fallback: "Cancel" })}
      onSuccessText={t("pause", { fallback: "Pause" })}
      onSuccess={handleConfirm}
      isLoading={isLoading}
    >
      <p className="text-base text-muted-foreground">
        {t("pauseSubscriptionDesc", { fallback: "No new installment due dates will fire until you resume. The end date will not extend automatically." })}
      </p>
    </ReusableDialog>
  );
}
