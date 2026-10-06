"use client";

// Add or edit a client CMS (FS-SOS-9): its name, the site's address, the API it signs in through,
// and a logo. Addresses read left to right in every language.
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { Button, Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Field, Input } from "@orgtik/ui";
import { RHFField } from "@orgtik/ui/rhf";
import { useCreateCMSInstanceMutation, useUpdateCMSInstanceMutation } from "@/redux/features/cms/cmsApi";
import { ICMSInstance } from "@/types/CMS";

type Values = { name: string; domain: string; apiUrl: string; loginEndpointPath: string };
const blank: Values = { name: "", domain: "", apiUrl: "", loginEndpointPath: "/auth/login" };

export function CmsDialog({ cms, open, onOpenChange }: { cms: ICMSInstance | null; open: boolean; onOpenChange: (open: boolean) => void }) {
  const t = useTranslations("Cms");
  const ts = useTranslations("Systems");
  const [create, { isLoading: creating }] = useCreateCMSInstanceMutation();
  const [update, { isLoading: updating }] = useUpdateCMSInstanceMutation();
  const [logo, setLogo] = useState<File | null>(null);
  const form = useForm<Values>({ defaultValues: blank, mode: "onTouched" });

  useEffect(() => {
    if (!open) return;
    setLogo(null);
    form.reset(cms ? { name: cms.name, domain: cms.domain ?? "", apiUrl: cms.apiUrl, loginEndpointPath: cms.loginEndpointPath } : blank);
  }, [open, cms, form]);

  const save = form.handleSubmit(async (v) => {
    const body = new FormData();
    body.append("name", v.name.trim());
    body.append("domain", v.domain.trim());
    body.append("apiUrl", v.apiUrl.trim());
    body.append("loginEndpointPath", v.loginEndpointPath.trim());
    if (logo) body.append("logo", logo);
    try {
      if (cms) await update({ id: cms.id, data: body }).unwrap();
      else await create(body).unwrap();
      onOpenChange(false);
    } catch {
      // Said by lib/api-feedback.
    }
  });

  const url = { required: ts("required"), pattern: { value: /^https?:\/\/[^\s]+$/, message: ts("urlInvalid") } };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>{cms ? t("editTitle") : t("addTitle")}</DialogTitle>
          <DialogDescription>{t("dialogBody")}</DialogDescription>
        </DialogHeader>
        <DialogBody>
          <form id="cms-form" onSubmit={save} noValidate className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <RHFField control={form.control} name="name" rules={{ required: ts("required") }} label={t("name")} required className="sm:col-span-2" render={(f) => <Input dir="auto" {...f} />} />
            <RHFField control={form.control} name="domain" rules={url} label={t("site")} required render={(f) => <Input type="url" dir="ltr" placeholder="https://" {...f} />} />
            <RHFField control={form.control} name="apiUrl" rules={url} label={t("api")} required render={(f) => <Input type="url" dir="ltr" placeholder="https://" {...f} />} />
            <RHFField control={form.control} name="loginEndpointPath" rules={{ required: ts("required") }} label={t("loginPath")} description={t("loginPathHelp")} required render={(f) => <Input dir="ltr" {...f} />} />
            <Field label={t("logo")} description={t("logoHelp")} optional>
              <Input type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" onChange={(e) => setLogo(e.target.files?.[0] ?? null)} />
            </Field>
          </form>
        </DialogBody>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            {ts("cancel")}
          </Button>
          <Button type="submit" form="cms-form" variant="primary" loading={creating || updating}>
            {cms ? ts("save") : t("add")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
