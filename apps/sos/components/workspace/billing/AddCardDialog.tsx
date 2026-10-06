"use client";
// Adding a card (USR-11). In production the card is typed into the payment gateway's own hosted
// form, so OrgTik never holds its number; the local mock stands in for it and takes a test card's
// brand, last 4 digits and expiry. Expired dates are refused here and again by the API.
import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { Controller, useForm } from "react-hook-form";
import { LockSimple } from "@phosphor-icons/react";
import { Button, Checkbox, Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Field, Input, Select, toast } from "@orgtik/ui";
import { RHFField } from "@orgtik/ui/rhf";
import type { PlatformError } from "@/redux/features/platform/platformApi";
import { useBillingAddCardMutation } from "@/redux/features/platform/billing";
import { Notice, cardExpired } from "./shared";

const BRANDS = ["Visa", "Mastercard", "American Express", "mada", "Meeza"] as const;
type Form = { brand: string; last4: string; expires: string; makeDefault: boolean };

export function AddCardDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const t = useTranslations("Billing.cards.add");
  const [add, { isLoading, error, reset: clearError }] = useBillingAddCardMutation();
  const form = useForm<Form>({ defaultValues: { brand: "Visa", last4: "", expires: "", makeDefault: false }, mode: "onTouched" });

  useEffect(() => {
    if (open) {
      form.reset({ brand: "Visa", last4: "", expires: "", makeDefault: false });
      clearError();
    }
  }, [open, form, clearError]);

  const submit = form.handleSubmit(async (v) => {
    try {
      await add({ brand: v.brand, last4: v.last4.trim(), expires: v.expires.trim(), makeDefault: v.makeDefault }).unwrap();
      toast.success(t("added", { brand: v.brand, last4: v.last4.trim() }));
      onOpenChange(false);
    } catch (e) {
      // The API's field answers go on their fields; anything else is said above the buttons.
      const fe = (e as PlatformError)?.fieldErrors ?? {};
      if (fe.last4) form.setError("last4", { message: t("last4Invalid") });
      if (fe.expires) form.setError("expires", { message: fe.expires === "expired" ? t("expired") : t("expiresInvalid") });
    }
  });
  const err = error as PlatformError | undefined;
  const other = err && !err.fieldErrors;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm">
        <form onSubmit={submit} noValidate className="contents">
          <DialogHeader>
            <DialogTitle>{t("title")}</DialogTitle>
            <DialogDescription>{t("description")}</DialogDescription>
          </DialogHeader>
          <DialogBody className="flex flex-col gap-4">
            <Notice tone="info" title={t("hostedTitle")}>
              <span className="inline-flex items-start gap-1">
                <LockSimple aria-hidden="true" className="mt-[0.2em] shrink-0" />
                {t("hostedBody")}
              </span>
            </Notice>
            <Controller
              control={form.control}
              name="brand"
              render={({ field }) => (
                <Field label={t("brand")}>
                  <Select options={BRANDS.map((b) => ({ value: b, label: <span dir="ltr">{b}</span> }))} value={field.value} onValueChange={(v) => field.onChange(v ?? "Visa")} />
                </Field>
              )}
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <RHFField
                control={form.control}
                name="last4"
                label={t("last4")}
                description={t("last4Help")}
                required
                rules={{ required: t("required"), pattern: { value: /^\d{4}$/, message: t("last4Invalid") } }}
                render={(f) => <Input dir="ltr" inputMode="numeric" autoComplete="off" maxLength={4} placeholder="4242" {...f} />}
              />
              <RHFField
                control={form.control}
                name="expires"
                label={t("expires")}
                description={t("expiresHelp")}
                required
                rules={{
                  required: t("required"),
                  validate: (v: string) => {
                    const s = v.trim();
                    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(s)) return t("expiresInvalid");
                    if (cardExpired({ expires: s })) return t("expired");
                    return true;
                  },
                }}
                render={(f) => <Input dir="ltr" inputMode="numeric" autoComplete="off" maxLength={5} placeholder="MM/YY" {...f} />}
              />
            </div>
            <Controller control={form.control} name="makeDefault" render={({ field }) => <Checkbox label={t("makeDefault")} description={t("makeDefaultHelp")} checked={field.value} onCheckedChange={(v) => field.onChange(Boolean(v))} />} />
            {other ? <Notice tone="danger" title={err.status === 423 ? t("suspended") : t("failed")} /> : null}
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              {t("cancel")}
            </Button>
            <Button type="submit" variant="primary" loading={isLoading}>
              {t("submit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
