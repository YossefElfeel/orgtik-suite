"use client";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { Button, Field, Input, Select, useSuite } from "@orgtik/ui";
import { RHFField } from "@orgtik/ui/rhf";
import { useAccountResource, useAccountAction } from "./useAccount";
import { AccountState } from "./AccountState";
import { AccountFilePicker } from "./AccountFilePicker";
import { WorkspaceLogo } from "./WorkspaceLogo";
import { AccountFileLink } from "./AccountFileLink";
import type { WorkspaceBranding as Branding } from "@/types/file-references";
export function WorkspaceBranding() {
  const t = useTranslations("Roadmap"), suite = useSuite(), data = useAccountResource<Branding>("/workspace"), action = useAccountAction(), [saved, setSaved] = useState(false);
  const form = useForm<Branding>({ resolver: zodResolver(z.object({ name: z.string().trim().min(1).max(80), defaultLanguage: z.string().min(2), timeZone: z.string().min(1), logo: z.object({ workspaceId: z.string(), fileId: z.string(), versionId: z.string() }).nullable() })), defaultValues: { name: "", defaultLanguage: "en", timeZone: "Africa/Cairo", logo: null } });
  const scope = JSON.stringify([suite.session?.user.id, suite.snapshot?.workspace.id, suite.snapshot?.actor.effectiveUserId]), initialized = useRef(scope);
  useEffect(() => { if (scope !== initialized.current) { form.reset({ name: "", defaultLanguage: "en", timeZone: "Africa/Cairo", logo: null }); initialized.current = scope; setSaved(false); } if (data.data && !form.formState.isDirty) form.reset(data.data); }, [scope, data.data, form]);
  const readOnly = !suite.isOwner || Boolean(suite.snapshot?.actor.readOnly || ["suspended", "deleted", "cancelled"].includes(suite.snapshot?.workspace.state || ""));
  return <AccountState loading={data.loading} error={data.error} retry={data.refetch}><form className="flex flex-col gap-5" onSubmit={form.handleSubmit(async values => { setSaved(false); try { await action.act("/workspace", "PATCH", values); form.reset(values); await data.refetch(); setSaved(true); } catch { form.setError("root", { message: t("saveError") }); } })}><RHFField control={form.control} name="name" label={t("title")} required render={field => <Input {...field} disabled={readOnly} dir="auto" />} /><RHFField control={form.control} name="defaultLanguage" label={t("defaultLanguage")} render={({ value, onChange }) => <Select disabled={readOnly} value={value} onValueChange={onChange} options={[{ value: "en", label: "English" }, { value: "ar", label: "العربية" }, { value: "de", label: "Deutsch" }, { value: "fr", label: "Français" }, { value: "it", label: "Italiano" }]} />} /><RHFField control={form.control} name="timeZone" label={t("timeZone")} required render={field => <Input {...field} disabled={readOnly} />} />{suite.accessibleTools.includes("files") ? <Field label={t("logo")}><AccountFilePicker imagesOnly disabled={readOnly} onPick={logo => form.setValue("logo", logo, { shouldDirty: true })} />{form.watch("logo") ? <div className="flex items-center gap-3"><WorkspaceLogo reference={form.watch("logo")} name={form.watch("name")} /><AccountFileLink reference={form.watch("logo")!} /><Button type="button" variant="ghost" disabled={readOnly} onClick={() => form.setValue("logo", null, { shouldDirty: true })}>{t("remove")}</Button></div> : null}</Field> : null}<Button className="self-start" type="submit" loading={action.busy} disabled={readOnly}>{t("save")}</Button>{form.formState.errors.root ? <p role="alert" className="text-danger">{form.formState.errors.root.message}</p> : saved ? <p role="status" className="text-success">{t("saved")}</p> : null}</form></AccountState>;
}
