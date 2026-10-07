"use client";
// Invitations reserve existing capacity. An uncertain response retains its original attempt.
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { PaperPlaneRight } from "@phosphor-icons/react";
import { Button, Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Field, Input, RadioGroup, toast } from "@orgtik/ui";
import type { AppMe } from "@/redux/features/platform/platformApi";
import { useInviteMemberMutation, type InviteBody, type Team } from "@/redux/features/platform/team";
import { fieldErrorsOf, usePlatformProblem } from "@/components/workspace/account/problems";
import { Notice } from "@/components/workspace/account/Notice";
import { SeatCost } from "./SeatCost";
import { ToolAccess } from "./ToolAccess";
import { selection, supportedTools, unavailableCapacity } from './seats';
import { attemptNamespace, readAttempt, saveAttempt, uncertainResult, type InviteAttempt } from './attempts';

type Role = InviteBody["role"];
const EMAIL = /^\S+@\S+\.\S+$/;

export function InviteDialog({ open, onOpenChange, me, team }: { open: boolean; onOpenChange: (open: boolean) => void; me: AppMe; team: Team }) {
  const t = useTranslations("Team.invite");
  const tr = useTranslations("Workspace.roles");
  const problem = usePlatformProblem();
  const [invite, { isLoading }] = useInviteMemberMutation();
  const isOwner = me.workspace.role === "owner";

  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("member");
  const [access, setAccess] = useState<string[] | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [failed, setFailed] = useState<string | null>(null);
  const [attempt, setAttempt] = useState<InviteAttempt | null>(null);
  const namespace = attemptNamespace(me.workspaceContext?.realm || 'demo', me.workspace.id, me.user.id);
  const tools = supportedTools(me.tools, team.meta.perTool, role);
  const frozen = isLoading || Boolean(attempt?.uncertain);
  const selected = selection(me.tools, team.meta.perTool, role, access);
  const blocked = unavailableCapacity(team.meta.perTool, selected);

  useEffect(() => {
    if (!open) return;
    const pending = readAttempt(namespace);
    setAttempt(pending); setEmail(pending?.email || ''); setRole(pending?.role || 'member'); setAccess(pending?.tools || null);
    setErrors({});
    setFailed(pending?.uncertain ? t('uncertain') : null);
  }, [open, namespace, t]);

  const roleError = (code?: string) => (code === "owner_only" ? t("errors.ownerOnly") : code ? t("errors.role") : undefined);
  const emailError = (code?: string) => (code === "taken" ? t("errors.taken") : code ? t("errors.email") : undefined);

  const send = async () => {
    const e: Record<string, string> = {};
    if (!EMAIL.test(email.trim())) e.email = "invalid";
    if (!attempt?.uncertain && blocked.length > 0) e.tools = 'required';
    setErrors(e);
    setFailed(null);
    if (Object.keys(e).length) return;
    const submitted = attempt || { email: email.trim(), role, tools: selected, operationId: crypto.randomUUID(), uncertain: false };
    try {
      const pending = submitted;
      setAttempt(pending); saveAttempt(namespace, pending);
      const res = await invite({ email: pending.email, role: pending.role, tools: pending.tools, operationId: pending.operationId }).unwrap();
      saveAttempt(namespace, null); setAttempt(null);
      toast.success(res.status === 'pending' ? t('sent', { email: pending.email }) : t('confirmed'), { description: t(res.tools.length ? 'sentReserved' : 'sentMembership') });
      onOpenChange(false);
    } catch (err) {
      const pending = readAttempt(namespace) || submitted;
      if (pending && (pending.uncertain || uncertainResult(err))) { const uncertain = { ...pending, uncertain: true }; saveAttempt(namespace, uncertain); setAttempt(uncertain); setFailed(t('uncertain')); return; }
      saveAttempt(namespace, null); setAttempt(null);
      const fe = fieldErrorsOf(err);
      if (Object.keys(fe).length) setErrors(fe);
      else setFailed(problem(err));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("body", { name: me.workspace.name })}</DialogDescription>
        </DialogHeader>
        <DialogBody>
          <form
            id="invite-form"
            className="flex flex-col gap-5"
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
          >
            <Field label={t("email")} required error={emailError(errors.email)}>
              <Input type="email" dir="ltr" autoComplete="off" disabled={frozen} required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@company.com" />
            </Field>
            <Field label={t("role")} group required error={roleError(errors.role)} description={isOwner ? undefined : t("adminOwnerOnly")}>
              <RadioGroup<Role>
                value={role}
                onValueChange={(v) => {
                  setRole(v);
                  setAccess(current => current === null ? null : selection(me.tools, team.meta.perTool, v, current));
                  if (errors.role) setErrors(({ role: _r, ...rest }) => rest);
                }}
                options={[
                  { value: "admin", label: tr("admin"), description: t("roleAdmin"), disabled: frozen || !isOwner },
                  { value: "member", label: tr("member"), description: t("roleMember"), disabled: frozen },
                  { value: "guest", label: tr("guest"), description: t("roleGuest"), disabled: frozen },
                ]}
              />
            </Field>
            <ToolAccess tools={tools} value={access} onChange={setAccess} disabled={frozen} error={errors.tools ? t("errors.tools") : undefined} />
            <SeatCost team={team} tools={me.tools} role={role} access={access} />
            {failed ? <Notice tone="danger">{failed}</Notice> : null}
          </form>
        </DialogBody>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button type="submit" form="invite-form" variant="primary" loading={isLoading} disabled={!attempt?.uncertain && blocked.length > 0} startIcon={<PaperPlaneRight className="rtl:-scale-x-100" />}>
            {t(attempt?.uncertain ? 'recover' : 'send')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
