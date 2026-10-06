"use client";

// Add or edit a CMS account (FS-SOS-9). The password is write-only: it's never shown or filled in,
// and an empty field when editing keeps the current one (the form was filled with what the API
// returned, so saving a name change sent that value back as the password: SOS-006).
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { Button, Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Input, PasswordInput } from "@orgtik/ui";
import { RHFField } from "@orgtik/ui/rhf";
import { useCreateCMSAccountMutation, useUpdateCMSAccountMutation } from "@/redux/features/cmsAccounts/cmsAccountsApi";
import { ICMSAccount } from "@/types/CMSAccount";
import { PASSWORD_MAX, PASSWORD_MIN } from "@/lib/password";

type Values = { name: string; email: string; password: string };

export function CmsAccountDialog({ cmsId, account, open, onOpenChange }: { cmsId: number; account: ICMSAccount | null; open: boolean; onOpenChange: (open: boolean) => void }) {
  const t = useTranslations("Cms");
  const ts = useTranslations("Systems");
  const tr = useTranslations("Recovery");
  const [create, { isLoading: creating }] = useCreateCMSAccountMutation();
  const [update, { isLoading: updating }] = useUpdateCMSAccountMutation();
  const form = useForm<Values>({ defaultValues: { name: "", email: "", password: "" }, mode: "onTouched" });

  useEffect(() => {
    if (open) form.reset({ name: account?.name ?? "", email: account?.email ?? "", password: "" });
  }, [open, account, form]);

  const save = form.handleSubmit(async (v) => {
    try {
      if (account) {
        await update({ id: account.id, data: { name: v.name.trim(), email: v.email.trim(), ...(v.password ? { password: v.password } : {}) } }).unwrap();
      } else {
        await create({ cmsId, name: v.name.trim(), email: v.email.trim(), password: v.password }).unwrap();
      }
      onOpenChange(false);
    } catch {
      // Said by lib/api-feedback.
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>{account ? t("editAccountTitle") : t("addAccountTitle")}</DialogTitle>
          <DialogDescription>{t("accountDialogBody")}</DialogDescription>
        </DialogHeader>
        <DialogBody>
          <form id="cms-account-form" onSubmit={save} noValidate className="flex flex-col gap-4">
            <RHFField control={form.control} name="name" rules={{ required: ts("required") }} label={t("accountName")} required render={(f) => <Input dir="auto" {...f} />} />
            <RHFField
              control={form.control}
              name="email"
              rules={{ required: ts("required"), pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: tr("emailInvalid") } }}
              label={t("accountEmail")}
              required
              render={(f) => <Input type="email" dir="ltr" autoComplete="off" {...f} />}
            />
            <RHFField
              control={form.control}
              name="password"
              rules={{
                validate: (val: string) =>
                  (!account && !val ? ts("required") : val && val.length < PASSWORD_MIN ? tr("passwordMin", { min: PASSWORD_MIN }) : val.length > PASSWORD_MAX ? tr("passwordMax", { max: PASSWORD_MAX }) : true),
              }}
              label={t("accountPassword")}
              description={account ? t("passwordKeep") : t("passwordNew")}
              required={!account}
              render={(f) => <PasswordInput autoComplete="new-password" {...f} />}
            />
          </form>
        </DialogBody>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            {ts("cancel")}
          </Button>
          <Button type="submit" form="cms-account-form" variant="primary" loading={creating || updating}>
            {account ? ts("save") : t("addAccount")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
