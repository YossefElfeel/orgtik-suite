"use client";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { z } from "zod";
import { Button, Input, PasswordInput } from "@orgtik/ui";
import { createRHFField } from "@orgtik/ui/rhf";
import { PASSWORD_MIN, PASSWORD_MAX } from "@/lib/password";
const TextField = createRHFField(Input), PasswordField = createRHFField(PasswordInput);
export type InvitationAccount = { name: string; password: string };

export function InvitationAccountForm({ onAccept, onChange, busy, creating }: { onAccept: (values: InvitationAccount) => Promise<void>; onChange: () => void; busy: boolean; creating: boolean }) {
  const t = useTranslations("WorkspaceInvite");
  const schema = useMemo(() => z.object({ name: z.string().trim().refine(value => !creating || value.length > 0, t("nameRequired")), password: z.string().min(PASSWORD_MIN, t("passwordMin")).max(PASSWORD_MAX, t("passwordMax")), confirm: z.string() }).refine(values => values.password === values.confirm, { path: ["confirm"], message: t("passwordMatch") }), [t, creating]);
  const { control, handleSubmit } = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema), defaultValues: { name: "", password: "", confirm: "" } });
  return <form method="post" noValidate onSubmit={handleSubmit(({ name, password }) => onAccept({ name, password }))} onChange={onChange} className="flex flex-col gap-5">
    {creating ? <TextField control={control} name="name" label={t("name")} autoComplete="name" disabled={busy} required /> : null}
    <PasswordField control={control} name="password" label={t("password")} autoComplete="new-password" disabled={busy} required />
    <PasswordField control={control} name="confirm" label={t("confirm")} autoComplete="new-password" disabled={busy} required />
    <p className="text-body-sm text-fg-muted">{t(creating ? "passwordHelp" : "activationHelp")}</p>
    <Button type="submit" size="lg" loading={busy} disabled={busy} className="w-full">{t(creating ? "createAndAccept" : "activateAndAccept")}</Button>
  </form>;
}
