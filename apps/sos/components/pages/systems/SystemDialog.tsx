"use client";

// Add or edit a suite app (FS-SOS-9). The address reads left to right in every language; the
// brand colour is a native colour picker with its value shown; the icon is the Iconify id the
// older launcher (sos-bar, still used by apps not yet migrated) draws; the new rail uses its own.
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { Button, Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Input, Textarea } from "@orgtik/ui";
import { RHFField } from "@orgtik/ui/rhf";
import { IScope, useCreateScopeMutation, useUpdateScopeMutation } from "@/redux/features/scopes/scopesApi";

type Values = { displayName: string; domain: string; description: string; icon: string; color: string };
const blank: Values = { displayName: "", domain: "", description: "", icon: "solar:widget-bold-duotone", color: "#6C3CAA" };

export function SystemDialog({ system, open, onOpenChange }: { system: IScope | null; open: boolean; onOpenChange: (open: boolean) => void }) {
  const t = useTranslations("Systems");
  const [createScope, { isLoading: creating }] = useCreateScopeMutation();
  const [updateScope, { isLoading: updating }] = useUpdateScopeMutation();
  const form = useForm<Values>({ defaultValues: blank, mode: "onTouched" });

  useEffect(() => {
    if (!open) return;
    form.reset(
      system
        ? { displayName: system.displayName, domain: system.domain, description: system.description ?? "", icon: system.metadata?.icon ?? blank.icon, color: system.metadata?.color ?? blank.color }
        : blank,
    );
  }, [open, system, form]);

  const save = form.handleSubmit(async (v) => {
    const data = { displayName: v.displayName.trim(), domain: v.domain.trim(), description: v.description.trim(), metadata: { icon: v.icon.trim(), color: v.color } };
    try {
      if (system) await updateScope({ id: system.id, data } as never).unwrap();
      else
        await createScope({
          ...data,
          name: data.displayName.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, ""),
        }).unwrap();
      onOpenChange(false);
    } catch {
      // Said by lib/api-feedback; the dialog keeps what was typed.
    }
  });

  const required = { required: t("required") };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>{system ? t("editTitle") : t("addTitle")}</DialogTitle>
          <DialogDescription>{t("dialogBody")}</DialogDescription>
        </DialogHeader>
        <DialogBody>
          <form id="system-form" onSubmit={save} noValidate className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <RHFField control={form.control} name="displayName" rules={required} label={t("name")} required render={(f) => <Input dir="auto" {...f} />} />
            <RHFField
              control={form.control}
              name="domain"
              rules={{ ...required, pattern: { value: /^https?:\/\/[^\s]+$/, message: t("urlInvalid") } }}
              label={t("address")}
              description={t("addressHelp")}
              required
              render={(f) => <Input type="url" dir="ltr" placeholder="https://" {...f} />}
            />
            <RHFField control={form.control} name="description" rules={required} label={t("descriptionField")} required className="sm:col-span-2" render={(f) => <Textarea dir="auto" maxRows={4} {...f} />} />
            <RHFField control={form.control} name="icon" rules={required} label={t("icon")} description={t("iconHelp")} required render={(f) => <Input dir="ltr" {...f} />} />
            <RHFField
              control={form.control}
              name="color"
              label={t("color")}
              render={(f) => (
                <span className="flex items-center gap-3">
                  <input type="color" aria-label={t("color")} value={f.value} onChange={(e) => f.onChange(e.target.value)} onBlur={f.onBlur} className="size-10 cursor-pointer rounded-field border border-line-control bg-raised p-1" />
                  <code dir="ltr" className="text-body-sm text-fg-muted">{f.value.toUpperCase()}</code>
                </span>
              )}
            />
          </form>
        </DialogBody>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button type="submit" form="system-form" variant="primary" loading={creating || updating}>
            {system ? t("save") : t("add")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
