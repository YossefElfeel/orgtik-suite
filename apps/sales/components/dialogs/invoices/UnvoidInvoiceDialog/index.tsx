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

export default function UnvoidInvoiceDialog({
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
      title={t("unvoidTitle", { id: invoiceId, fallback: `Unvoid ${invoiceId}?` })}
      size="xl"
      onCancelText={tCommon("cancel", { fallback: "Cancel" })}
      onSuccessText={t("unvoidInvoice", { fallback: "Unvoid Invoice" })}
      onSuccess={onConfirm}
      isLoading={isLoading}
    >
      <p className="text-base text-muted-foreground">
        {t("unvoidDesc", { id: invoiceId, fallback: `This will restore invoice ${invoiceId} from Void back to Pending so it can be paid again.` })}
      </p>
    </ReusableDialog>
  );
}
