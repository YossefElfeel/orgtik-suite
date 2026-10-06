"use client";
// Invite someone (USR-14, spec 05 USR-20): email, role, tool access, and what it costs before it
// goes. Admins and the owner invite; only the owner makes admins (the API answers 422 owner_only,
// shown on the role). After it goes, the toast says how many seats the workspace will count.
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { PaperPlaneRight } from "@phosphor-icons/react";
import { Button, Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Field, Input, RadioGroup, toast } from "@orgtik/ui";
import type { AppMe } from "@/redux/features/platform/platformApi";
import { useInviteMemberMutation, type InviteBody, type Team } from "@/redux/features/platform/team";
import { fieldErrorsOf, usePlatformProblem } from "@/components/workspace/account/problems";
import { Notice } from "@/components/workspace/account/Notice";
import { SeatCost } from "./SeatCost";
import { ToolAccess, accessibleTools } from "./ToolAccess";

type Role = InviteBody["role"];
const EMAIL = /^\S+@\S+\.\S+$/;

export function InviteDialog({ open, onOpenChange, me, team }: { open: boolean; onOpenChange: (open: boolean) => void; me: AppMe; team: Team }) {
  const t = useTranslations("Team.invite");
  const tr = useTranslations("Workspace.roles");
  const problem = usePlatformProblem();
  const [invite, { isLoading }] = useInviteMemberMutation();
  const isOwner = me.workspace.role === "owner";
  const tools = accessibleTools(me.tools);

  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("member");
  const [access, setAccess] = useState<string[] | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [failed, setFailed] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setEmail("");
    setRole("member");
    setAccess(null);
    setErrors({});
    setFailed(null);
  }, [open]);

  const roleError = (code?: string) => (code === "owner_only" ? t("errors.ownerOnly") : code ? t("errors.role") : undefined);
  const emailError = (code?: string) => (code === "taken" ? t("errors.taken") : code ? t("errors.email") : undefined);

  const send = async () => {
    const e: Record<string, string> = {};
    if (!EMAIL.test(email.trim())) e.email = "invalid";
    if (access !== null && access.length === 0) e.tools = "required";
    setErrors(e);
    setFailed(null);
    if (Object.keys(e).length) return;
    try {
      const res = await invite({ email: email.trim(), role, tools: access }).unwrap();
      toast.success(t("sent", { email: email.trim() }), { description: role === "guest" ? t("sentGuest") : t("sentSeats", { seats: res.seatsAfter }) });
      onOpenChange(false);
    } catch (err) {
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
              <Input type="email" dir="ltr" autoComplete="off" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@company.com" />
            </Field>
            <Field label={t("role")} group required error={roleError(errors.role)} description={isOwner ? undefined : t("adminOwnerOnly")}>
              <RadioGroup<Role>
                value={role}
                onValueChange={(v) => {
                  setRole(v);
                  if (errors.role) setErrors(({ role: _r, ...rest }) => rest);
                }}
                options={[
                  { value: "admin", label: tr("admin"), description: t("roleAdmin"), disabled: !isOwner },
                  { value: "member", label: tr("member"), description: t("roleMember") },
                  { value: "guest", label: tr("guest"), description: t("roleGuest") },
                ]}
              />
            </Field>
            <ToolAccess tools={tools} value={access} onChange={setAccess} error={errors.tools ? t("errors.tools") : undefined} />
            <SeatCost team={team} tools={me.tools} role={role} access={access} currency={me.workspace.currency} />
            {failed ? <Notice tone="danger">{failed}</Notice> : null}
          </form>
        </DialogBody>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button type="submit" form="invite-form" variant="primary" loading={isLoading} startIcon={<PaperPlaneRight className="rtl:-scale-x-100" />}>
            {t("send")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
