"use client";

// Marking a lead lost asks why (D-028): the reason is required and kept on the record. The dialog
// stays open and busy until the change is saved; a refused change keeps it open with the reason.
import { useTranslations } from "next-intl";
import { ConfirmDialog } from "@orgtik/ui";
import { isolate } from "@/lib/bidi";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The lead's name, for the question. */
  name: string;
  onConfirm: (reason: string) => Promise<unknown>;
};

export default function LostLeadDialog({ open, onOpenChange, name, onConfirm }: Props) {
  const t = useTranslations("Customers.lost");
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      tone="primary"
      title={t("title", { name: isolate(name) })}
      impact={t("impact")}
      reason={{ label: t("reason"), required: true, placeholder: t("reasonPlaceholder") }}
      confirmLabel={t("confirm")}
      cancelLabel={t("cancel")}
      onConfirm={({ reason }) => onConfirm(reason.trim())}
    />
  );
}
