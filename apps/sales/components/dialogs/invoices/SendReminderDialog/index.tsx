"use client";

import type { ReactElement } from "react";
import { ReusableDialog } from "@/components/dialogs/shared/ReusableDialog";
import { useTranslations } from "next-intl";

type Props = {
  invoiceId: string;
  customerName: string;
  trigger: ReactElement;
  onConfirm?: () => void;
  isLoading?: boolean;
};

export default function SendReminderDialog({
  invoiceId,
  customerName,
  trigger,
  onConfirm,
  isLoading = false,
}: Props) {
  const t = useTranslations("invoices");
  const tCommon = useTranslations("common");

  return (
    <ReusableDialog
      trigger={trigger}
      title={t("sendReminderTitle", { id: invoiceId, fallback: `Send reminder for ${invoiceId}?` })}
      size="xl"
      onCancelText={tCommon("cancel", { fallback: "Cancel" })}
      onSuccessText={t("sendReminder", { fallback: "Send Reminder" })}
      onSuccess={onConfirm}
      isLoading={isLoading}
    >
      <p className="text-base text-muted-foreground">
        {t("sendReminderDesc", { customerName, id: invoiceId, fallback: `A payment reminder email will be sent to ${customerName} for invoice ${invoiceId}.` })}
      </p>
    </ReusableDialog>
  );
}
