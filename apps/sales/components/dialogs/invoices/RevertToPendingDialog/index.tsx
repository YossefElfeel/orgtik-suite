"use client";

import type { ReactElement } from "react";
import { ReusableDialog } from "@/components/dialogs/shared/ReusableDialog";
import { useTranslations } from "next-intl";

type Props = {
  invoiceId: string;
  trigger: ReactElement;
  onConfirm?: () => void;
  isLoading?: boolean;
};

export default function RevertToPendingDialog({
  invoiceId,
  trigger,
  onConfirm,
  isLoading = false,
}: Props) {
  const t = useTranslations("invoices");
  const tCommon = useTranslations("common");

  return (
    <ReusableDialog
      trigger={trigger}
      title={t("revertToPendingTitle", { id: invoiceId, fallback: `Revert ${invoiceId} to pending?` })}
      size="xl"
      onCancelText={tCommon("cancel", { fallback: "Cancel" })}
      onSuccessText={t("revertToPending", { fallback: "Revert to Pending" })}
      onSuccess={onConfirm}
      isLoading={isLoading}
    >
      <p className="text-base text-muted-foreground">
        {t("revertToPendingDesc", { id: invoiceId, fallback: `This will change invoice ${invoiceId} from Paid back to Pending. Payment will no longer be recorded as received.` })}
      </p>
    </ReusableDialog>
  );
}
