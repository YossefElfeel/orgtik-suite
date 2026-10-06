"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button, Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Field, NumberField, Textarea, toast, useFormatter } from "@orgtik/ui";
import type { ApiError } from "@/store/api";
import { useWorkspaceActionMutation, type Line } from "@/store/customers";
import { useErrorText, useToolName } from "./shared";

const DAY = 86400000;

/** Extends one trial by 1–30 days (ADM-21), with a reason for the audit log. Shows the new end first. */
export function ExtendTrialDialog({ workspaceId, line, onClose }: { workspaceId: string; line: Line; onClose: () => void }) {
  const t = useTranslations("Customers");
  const tc = useTranslations("Common");
  const f = useFormatter();
  const toolName = useToolName();
  const errorText = useErrorText();
  const [act, state] = useWorkspaceActionMutation();
  const [days, setDays] = useState<number | null>(7);
  const [reason, setReason] = useState("");
  const [errors, setErrors] = useState<{ days?: string; reason?: string; form?: string }>({});
  const current = line.trialEndsAt ? Date.parse(line.trialEndsAt) : null;
  const valid = days !== null && days >= 1 && days <= 30;
  const newEnd = current !== null && valid ? new Date(current + days * DAY) : null;
  const tool = toolName(line.tool);

  const submit = () => {
    const e: typeof errors = {};
    if (!valid) e.days = t("trial.daysRange");
    if (!reason.trim()) e.reason = tc("required");
    setErrors(e);
    if (Object.keys(e).length) return;
    act({ id: workspaceId, action: "extend_trial", lineId: line.id, days: days!, reason: reason.trim() })
      .unwrap()
      .then((r) => {
        const end = "line" in r && r.line?.trialEndsAt ? r.line.trialEndsAt : newEnd?.toISOString();
        toast.success(t("trial.done", { tool, date: end ? f.date(end, { dateStyle: "medium" }) : "—" }));
        onClose();
      })
      .catch((err: ApiError) => {
        const fe = err.fieldErrors ?? {};
        setErrors({ days: fe.days ? t("trial.daysRange") : undefined, reason: fe.reason ? tc("required") : undefined, form: fe.days || fe.reason ? undefined : errorText(err) });
      });
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>{t("trial.title", { tool })}</DialogTitle>
          <DialogDescription>{t("trial.current", { date: line.trialEndsAt ? f.date(line.trialEndsAt, { dateStyle: "medium" }) : "—" })}</DialogDescription>
        </DialogHeader>
        <DialogBody className="flex flex-col gap-4">
          <Field label={t("trial.days")} description={newEnd ? t("trial.newEnd", { date: f.date(newEnd, { dateStyle: "medium" }) }) : t("trial.daysRange")} error={errors.days} required>
            <NumberField value={days} onValueChange={setDays} min={1} max={30} required />
          </Field>
          <Field label={t("reason")} description={tc("reasonHint")} error={errors.reason} required>
            <Textarea dir="auto" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} required />
          </Field>
          {errors.form ? (
            <p role="alert" className="rounded-field bg-danger-subtle px-3 py-2 text-body-sm text-danger">
              {errors.form}
            </p>
          ) : null}
        </DialogBody>
        <DialogFooter>
          <Button variant="secondary" onClick={onClose} disabled={state.isLoading}>
            {tc("cancel")}
          </Button>
          <Button variant="primary" loading={state.isLoading} onClick={submit}>
            {t("trial.submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
