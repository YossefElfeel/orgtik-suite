"use client";

// The customer's invitation link, to copy and send. It says when the link stops working, in the
// reader's language and the organisation's time zone.
import { useTranslations } from "next-intl";
import { Copy, EnvelopeSimple, User } from "@phosphor-icons/react";
import { Button, Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Field, Input, toast } from "@orgtik/ui";
import { useCustomerDates } from "@/components/pages/customers/leads";

type InviteLinkDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fullName: string;
  email: string;
  inviteLink: string;
  expiresAt?: string | null;
};

export function InviteLinkDialog({ open, onOpenChange, fullName, email, inviteLink, expiresAt }: InviteLinkDialogProps) {
  const t = useTranslations("Customers.invite");
  const dates = useCustomerDates();

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      toast.success(t("copied"));
    } catch {
      toast.error(t("copyFailed"));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>
        <DialogBody className="flex flex-col gap-4 text-start">
          <div className="flex flex-col gap-1 rounded-md border border-line bg-sunken px-4 py-3">
            <span className="flex items-center gap-2 font-semibold text-fg">
              <User aria-hidden className="size-4 shrink-0 text-fg-muted" />
              <span dir="auto">{fullName}</span>
            </span>
            <span className="flex items-center gap-2 text-body-sm text-fg-muted">
              <EnvelopeSimple aria-hidden className="size-4 shrink-0" />
              <bdi dir="ltr" className="truncate">
                {email}
              </bdi>
            </span>
          </div>
          <Field label={t("link")} description={expiresAt ? t("expires", { date: dates.shortDateTime(expiresAt) }) : t("expiresSoon")}>
            <Input readOnly value={inviteLink} dir="ltr" onFocus={(e) => e.currentTarget.select()} />
          </Field>
        </DialogBody>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {t("done")}
          </Button>
          <Button variant="primary" startIcon={<Copy />} onClick={copy}>
            {t("copy")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default InviteLinkDialog;
