"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button, Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Field, MoneyField, NumberField, Skeleton, toast, useFormatter } from "@orgtik/ui";
import type { ApiError } from "@/store/api";
import { useQuoteCustomPlanMutation, useWorkspaceQuery, type CustomPlanRequest } from "@/store/customers";
import { useErrorText } from "./shared";

const DAY = 86400000;

/** Sends a custom plan quote (ADM-22, ALG-1): a price in the workspace's own currency, valid for some days. */
export function QuoteDialog({ request, onClose }: { request: CustomPlanRequest; onClose: () => void }) {
  const t = useTranslations("Customers");
  const tc = useTranslations("Common");
  const f = useFormatter();
  const errorText = useErrorText();
  const ws = useWorkspaceQuery(request.workspaceId);
  const currency = ws.data?.currency ?? request.quote?.currency;
  const [quote, state] = useQuoteCustomPlanMutation();
  const [amount, setAmount] = useState<number | null>(request.quote?.amount ?? null);
  const [days, setDays] = useState<number | null>(30);
  const [errors, setErrors] = useState<{ amount?: string; days?: string; form?: string }>({});
  const name = request.workspace ?? request.workspaceId;
  const until = days && days >= 1 && days <= 90 ? new Date(Date.now() + days * DAY) : null;

  const submit = () => {
    const e: typeof errors = {};
    if (!(amount && amount > 0)) e.amount = t("quote.amountMin");
    if (!(days && days >= 1 && days <= 90)) e.days = t("quote.daysRange");
    setErrors(e);
    if (Object.keys(e).length) return;
    quote({ id: request.id, amount: amount!, validDays: days! })
      .unwrap()
      .then(() => {
        toast.success(t("quote.sent", { name }));
        onClose();
      })
      .catch((err: ApiError) => {
        const fe = err.fieldErrors ?? {};
        setErrors({ amount: fe.amount ? t("quote.amountMin") : undefined, form: fe.amount ? undefined : errorText(err) });
      });
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>{t("quote.title", { name })}</DialogTitle>
          <DialogDescription>{t("quote.description", { seats: request.seats })}</DialogDescription>
        </DialogHeader>
        <DialogBody className="flex flex-col gap-4">
          {currency ? (
            <Field label={t("quote.amount", { currency })} description={t("quote.amountHint")} error={errors.amount} required>
              <MoneyField currency={currency} value={amount} onValueChange={setAmount} min={0} required />
            </Field>
          ) : ws.isError ? (
            <p role="alert" className="text-body-sm text-danger">{tc("loadFailed")}</p>
          ) : (
            <Skeleton className="h-16" aria-busy="true" />
          )}
          <Field label={t("quote.validDays")} description={until ? t("quote.validUntil", { date: f.date(until, { dateStyle: "medium" }) }) : t("quote.daysRange")} error={errors.days} required>
            <NumberField value={days} onValueChange={setDays} min={1} max={90} required />
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
          <Button variant="primary" loading={state.isLoading} disabled={!currency} onClick={submit}>
            {t("quote.send")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
