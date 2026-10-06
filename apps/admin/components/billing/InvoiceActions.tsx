"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowCounterClockwise, ArrowsClockwise, CheckCircle, DotsThreeVertical, PaperPlaneTilt, Prohibit } from "@phosphor-icons/react";
import {
  Button,
  ConfirmDialog,
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Field,
  IconButton,
  Input,
  Menu,
  MenuContent,
  MenuItem,
  MenuTrigger,
  MoneyField,
  Select,
  Textarea,
  toast,
  useFormatter,
} from "@orgtik/ui";
import { useErrorText } from "@/components/customers/shared";
import type { ApiError } from "@/store/api";
import { useInvoiceActionMutation, type Invoice } from "@/store/billing";

export const METHODS = ["bank_transfer", "cash", "cheque", "card", "other"] as const;

function FormError({ text }: { text?: string }) {
  if (!text) return null;
  return (
    <p role="alert" className="rounded-field bg-danger-subtle px-3 py-2 text-body-sm text-danger">
      {text}
    </p>
  );
}

/** Records a payment made outside the gateway (ADM-23): method and reference, then the invoice is paid. */
function MarkPaidDialog({ invoice, onClose }: { invoice: Invoice; onClose: () => void }) {
  const t = useTranslations("Billing");
  const tc = useTranslations("Common");
  const f = useFormatter();
  const errorText = useErrorText();
  const [act, state] = useInvoiceActionMutation();
  const [method, setMethod] = useState<string>("bank_transfer");
  const [reference, setReference] = useState("");
  const [error, setError] = useState<string>();
  const submit = () =>
    act({ id: invoice.id, action: "mark-paid", method, reference: reference.trim() || undefined })
      .unwrap()
      .then(() => {
        toast.success(t("done.markPaid", { number: invoice.number }));
        onClose();
      })
      .catch((e: ApiError) => setError(errorText(e)));
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>{t("markPaid.title", { number: invoice.number })}</DialogTitle>
          <DialogDescription>{t("markPaid.impact", { amount: f.money(invoice.total, invoice.currency) })}</DialogDescription>
        </DialogHeader>
        <DialogBody className="flex flex-col gap-4">
          <Field label={t("markPaid.method")} required>
            <Select value={method} onValueChange={(v) => v && setMethod(v)} options={METHODS.map((m) => ({ value: m, label: t(`method.${m}`) }))} required />
          </Field>
          <Field label={t("markPaid.reference")} description={t("markPaid.referenceHint")} optional>
            <Input dir="ltr" value={reference} onChange={(e) => setReference(e.target.value)} />
          </Field>
          <FormError text={error} />
        </DialogBody>
        <DialogFooter>
          <Button variant="secondary" onClick={onClose} disabled={state.isLoading}>
            {tc("cancel")}
          </Button>
          <Button variant="primary" loading={state.isLoading} onClick={submit}>
            {t("actions.markPaid")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * A refund (R4, G-14): in the invoice's own currency, up to what is refundable; it makes a numbered
 * credit note. The API caps it again and answers 422 with `max` if the amount is over.
 */
function RefundDialog({ invoice, onClose }: { invoice: Invoice; onClose: () => void }) {
  const t = useTranslations("Billing");
  const tc = useTranslations("Common");
  const f = useFormatter();
  const errorText = useErrorText();
  const [act, state] = useInvoiceActionMutation();
  const [amount, setAmount] = useState<number | null>(null);
  const [reason, setReason] = useState("");
  const [errors, setErrors] = useState<{ amount?: string; reason?: string; form?: string }>({});
  const refundable = invoice.refundable ?? 0;
  const submit = () => {
    const e: typeof errors = {};
    if (!(amount && amount > 0)) e.amount = t("refund.amountMin");
    if (!reason.trim()) e.reason = tc("required");
    setErrors(e);
    if (Object.keys(e).length) return;
    act({ id: invoice.id, action: "refund", amount: amount!, reason: reason.trim() })
      .unwrap()
      .then((inv) => {
        const cn = inv.creditNotes.at(-1);
        toast.success(t("done.refund", { amount: f.money(amount!, invoice.currency), note: cn?.number ?? "" }));
        onClose();
      })
      .catch((err: ApiError) => {
        const max = typeof err.extra?.max === "number" ? (err.extra.max as number) : null;
        const fe = err.fieldErrors ?? {};
        if (max !== null) setErrors({ amount: t("refund.overMax", { max: f.money(max, invoice.currency) }) });
        else setErrors({ amount: fe.amount ? t("refund.amountMin") : undefined, reason: fe.reason ? tc("required") : undefined, form: fe.amount || fe.reason ? undefined : errorText(err) });
      });
  };
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>{t("refund.title", { number: invoice.number })}</DialogTitle>
          <DialogDescription>{t("refund.impact")}</DialogDescription>
        </DialogHeader>
        <DialogBody className="flex flex-col gap-4">
          <Field label={t("refund.amount", { currency: invoice.currency })} description={t("refund.upTo", { max: f.money(refundable, invoice.currency) })} error={errors.amount} required>
            <MoneyField currency={invoice.currency} value={amount} onValueChange={setAmount} min={0} required />
          </Field>
          <Field label={t("reason")} description={tc("reasonHint")} error={errors.reason} required>
            <Textarea dir="auto" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} required />
          </Field>
          <FormError text={errors.form} />
        </DialogBody>
        <DialogFooter>
          <Button variant="secondary" onClick={onClose} disabled={state.isLoading}>
            {tc("cancel")}
          </Button>
          <Button variant="danger" loading={state.isLoading} onClick={submit}>
            {t("actions.refund")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type Asking = "issue" | "void" | "retry" | "markPaid" | "refund" | null;

/** What an invoice's state allows (spec 06 "Invoice"); the main one is a button, the rest in a menu. */
export function InvoiceActions({ invoice }: { invoice: Invoice }) {
  const t = useTranslations("Billing");
  const f = useFormatter();
  const errorText = useErrorText();
  const [act] = useInvoiceActionMutation();
  const [asking, setAsking] = useState<Asking>(null);
  const s = invoice.state;
  const unpaid = s === "open" || s === "past_due";
  const refundable = (s === "paid" || s === "partially_refunded") && (invoice.refundable ?? 0) > 0;
  const voidable = s === "draft" || unpaid;
  const run = (body: Parameters<typeof act>[0], done: string) =>
    act(body)
      .unwrap()
      .then((inv) => {
        // A retry that fails is still an answer: the invoice stays past due.
        if (body.action === "retry" && inv.state !== "paid") toast.warning(t("done.retryFailed", { number: invoice.number }));
        else toast.success(done);
      })
      .catch((e) => {
        toast.error(errorText(e));
        throw e;
      });

  const main =
    s === "draft" ? (
      <Button variant="primary" startIcon={<PaperPlaneTilt className="rtl:-scale-x-100" />} onClick={() => setAsking("issue")}>
        {t("actions.issue")}
      </Button>
    ) : unpaid ? (
      <Button variant="primary" startIcon={<CheckCircle />} onClick={() => setAsking("markPaid")}>
        {t("actions.markPaid")}
      </Button>
    ) : refundable ? (
      <Button variant="secondary" startIcon={<ArrowCounterClockwise />} onClick={() => setAsking("refund")}>
        {t("actions.refund")}
      </Button>
    ) : null;
  const more = [...(unpaid ? (["retry"] as const) : []), ...(voidable ? (["void"] as const) : [])];
  if (!main && !more.length) return null;
  const close = (o: boolean) => !o && setAsking(null);
  return (
    <div className="flex flex-wrap items-center gap-2">
      {unpaid ? (
        <Button variant="secondary" startIcon={<ArrowsClockwise />} onClick={() => setAsking("retry")}>
          {t("actions.retry")}
        </Button>
      ) : null}
      {main}
      {voidable ? (
        <Menu>
          <MenuTrigger render={<IconButton variant="secondary" label={t("actions.more", { number: invoice.number })} icon={<DotsThreeVertical weight="bold" />} />} />
          <MenuContent align="end">
            <MenuItem icon={<Prohibit />} tone="danger" onClick={() => setAsking("void")}>
              {t("actions.void")}
            </MenuItem>
          </MenuContent>
        </Menu>
      ) : null}

      <ConfirmDialog
        open={asking === "issue"}
        onOpenChange={close}
        tone="primary"
        title={t("confirm.issueTitle", { number: invoice.number })}
        impact={t("confirm.issueImpact", { amount: f.money(invoice.total, invoice.currency) })}
        confirmLabel={t("actions.issue")}
        onConfirm={() => run({ id: invoice.id, action: "issue" }, t("done.issue", { number: invoice.number }))}
      />
      <ConfirmDialog
        open={asking === "retry"}
        onOpenChange={close}
        tone="primary"
        title={t("confirm.retryTitle", { number: invoice.number })}
        impact={t("confirm.retryImpact", { amount: f.money(invoice.total, invoice.currency) })}
        confirmLabel={t("actions.retry")}
        onConfirm={() => run({ id: invoice.id, action: "retry" }, t("done.retry", { number: invoice.number }))}
      />
      <ConfirmDialog
        open={asking === "void"}
        onOpenChange={close}
        tone="danger"
        irreversible
        title={t("confirm.voidTitle", { number: invoice.number })}
        impact={t("confirm.voidImpact", { amount: f.money(invoice.total, invoice.currency) })}
        reason={{ label: t("reason"), required: true }}
        confirmLabel={t("actions.void")}
        onConfirm={({ reason }) => run({ id: invoice.id, action: "void", reason }, t("done.void", { number: invoice.number }))}
      />
      {asking === "markPaid" ? <MarkPaidDialog invoice={invoice} onClose={() => setAsking(null)} /> : null}
      {asking === "refund" ? <RefundDialog invoice={invoice} onClose={() => setAsking(null)} /> : null}
    </div>
  );
}
