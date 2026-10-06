"use client";

import { useState, type ReactElement } from "react";
import { useRole } from "@/hooks/useRole";
import {
  useResumeCustomerSubscriptionMutation,
  useResumeSubscriptionMutation,
} from "@/redux/features/subscriptions/subscriptionsApi";
import { ReusableDialog } from "@/components/dialogs/shared/ReusableDialog";
import { useTranslations } from "next-intl";

type Props = {
  trigger: ReactElement;
  id: string;
};

export default function ResumeSubscriptionDialog({ trigger, id }: Props) {
  const t = useTranslations("subscriptions");
  const tCommon = useTranslations("common");
  const [open, setOpen] = useState(false);
  const { isCustomer } = useRole();
  const [resumeAdminSubscription, { isLoading: isAdminResuming }] =
    useResumeSubscriptionMutation();
  const [resumeCustomerSubscription, { isLoading: isCustomerResuming }] =
    useResumeCustomerSubscriptionMutation();
  const isLoading = isAdminResuming || isCustomerResuming;

  const handleConfirm = async () => {
    const resumeSubscription = isCustomer
      ? resumeCustomerSubscription
      : resumeAdminSubscription;
    await resumeSubscription(id).unwrap();
    setOpen(false);
  };

  return (
    <ReusableDialog
      open={open}
      onOpenChange={setOpen}
      trigger={trigger}
      title={t("resumeSubscriptionTitle", { fallback: "Resume this subscription?" })}
      size="xl"
      className="sm:max-w-[630px]"
      onCancelText={tCommon("cancel", { fallback: "Cancel" })}
      onSuccessText={t("resume", { fallback: "Resume" })}
      onSuccess={handleConfirm}
      isLoading={isLoading}
    >
      <p className="text-base text-muted-foreground">
        {t("resumeSubscriptionDesc", { fallback: "Future installments will resume on their normal monthly cadence." })}
      </p>
    </ReusableDialog>
  );
}
