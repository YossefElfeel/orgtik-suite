"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Info, Plus, Trash } from "@phosphor-icons/react";
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
  MoneyField,
  NumberField,
  PercentField,
  RadioGroup,
  Select,
  Textarea,
  toast,
  useFormatter,
} from "@orgtik/ui";
import { DatePicker } from "@orgtik/ui/dates";
import { asApiError } from "@/components/system/kit";
import { useCommerceCurrenciesQuery, useCreateCouponMutation, useUpdateCouponMutation, type Coupon, type CouponKind } from "@/store/commerce";
import { usePlanNames } from "./plans";

type Row = { currency: string; amount: number | null };
const isoDay = (iso: string) => iso.slice(0, 10);
const today = () => new Date().toISOString().slice(0, 10);
const plusDays = (n: number) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);

/** The currencies a fixed coupon works in, as a sentence list ("SAR and AED"). */
export function useCurrencyList() {
  const locale = useLocale();
  return (codes: string[]) => new Intl.ListFormat(locale, { style: "long", type: "conjunction" }).format(codes);
}

/** Ends a coupon: nobody can redeem it any more; what was redeemed keeps its discount. */
export function EndCouponButton({ coupon, onEnded, variant = "secondary" }: { coupon: Coupon; onEnded?: () => void; variant?: "secondary" | "danger" }) {
  const t = useTranslations("Commerce");
  const [update] = useUpdateCouponMutation();
  return (
    <ConfirmDialog
      trigger={<Button variant={variant} size="sm">{t("coupons.end")}</Button>}
      tone="danger"
      title={t("coupons.endTitle", { code: coupon.code })}
      impact={t("coupons.endImpact", { count: coupon.redeemed })}
      confirmLabel={t("coupons.end")}
      onConfirm={() =>
        update({ code: coupon.code, active: false })
          .unwrap()
          .then(() => {
            toast.success(t("coupons.ended", { code: coupon.code }));
            onEnded?.();
          })
      }
    />
  );
}

/** Create a coupon, or edit one. A coupon already redeemed keeps its discount (the API answers 409). */
export function CouponDialog({ coupon, onClose }: { coupon: Coupon | null; onClose: () => void }) {
  const t = useTranslations("Commerce");
  const tc = useTranslations("Common");
  const f = useFormatter();
  const currencyList = useCurrencyList();
  const { plans, label } = usePlanNames();
  const currencies = useCommerceCurrenciesQuery();
  const [create, creating] = useCreateCouponMutation();
  const [update, updating] = useUpdateCouponMutation();
  const locked = Boolean(coupon && coupon.redeemed > 0);

  const [code, setCode] = useState(coupon?.code ?? "");
  const [kind, setKind] = useState<CouponKind>(coupon?.kind ?? "percent");
  const [value, setValue] = useState<number | null>(coupon?.value ?? 10);
  const [rows, setRows] = useState<Row[]>(coupon?.amounts ? Object.entries(coupon.amounts).map(([currency, amount]) => ({ currency, amount })) : [{ currency: "", amount: null }]);
  const [appliesTo, setAppliesTo] = useState(coupon?.appliesTo ?? "all");
  const [max, setMax] = useState<number | null>(coupon?.maxRedemptions ?? 100);
  const [from, setFrom] = useState<string | null>(coupon ? isoDay(coupon.validFrom) : today());
  const [to, setTo] = useState<string | null>(coupon ? isoDay(coupon.validTo) : plusDays(30));
  const [note, setNote] = useState(coupon?.note ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [refused, setRefused] = useState(false);

  const active = (currencies.data ?? []).filter((c) => c.active);
  const chosen = rows.map((r) => r.currency).filter(Boolean);
  const err = (k: string) => (errors[k] ? t(`coupons.errors.${errors[k]}`) : undefined);

  const check = () => {
    const e: Record<string, string> = {};
    if (!coupon && !/^[A-Z0-9]{4,20}$/.test(code)) e.code = "invalid";
    if (!locked && kind === "percent" && !(value !== null && value >= 1 && value <= 100)) e.value = "range";
    if (!locked && kind === "fixed" && (!rows.length || rows.some((r) => !r.currency || !(r.amount && r.amount > 0)))) e.amounts = "required";
    if (!to || (from && to <= from)) e.validTo = "after_start";
    return e;
  };

  const submit = () => {
    const e = check();
    setErrors(e);
    setRefused(false);
    if (Object.keys(e).length) return;
    const discount = locked ? {} : kind === "percent" ? { kind, value: value ?? undefined } : { kind, amounts: Object.fromEntries(rows.map((r) => [r.currency, r.amount ?? 0])) };
    const common = { appliesTo, maxRedemptions: max ?? undefined, validFrom: from ? `${from}T00:00:00.000Z` : undefined, validTo: `${to}T23:59:59.000Z`, note };
    const op = coupon ? update({ code: coupon.code, ...discount, ...common }) : create({ code, ...discount, ...common });
    op.unwrap()
      .then(() => {
        toast.success(coupon ? t("coupons.saved", { code: coupon.code }) : t("coupons.created", { code }));
        onClose();
      })
      .catch((x) => {
        const a = asApiError(x);
        if (a.status === 409) setRefused(true);
        else if (a.status === 422 && a.fieldErrors) setErrors(a.fieldErrors);
        else toast.error(a.status === 403 ? tc("forbidden") : tc("saveFailed"));
      });
  };

  const setRow = (i: number, patch: Partial<Row>) => setRows(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>{coupon ? t("coupons.editTitle", { code: coupon.code }) : t("coupons.createTitle")}</DialogTitle>
          <DialogDescription>{coupon ? t("coupons.redeemedSoFar", { count: coupon.redeemed, max: coupon.maxRedemptions }) : t("coupons.dialogHelp")}</DialogDescription>
        </DialogHeader>
        <DialogBody className="flex flex-col gap-5">
          {Object.keys(errors).length ? (
            <p role="alert" className="text-body-sm text-danger">
              {tc("fixFields")}
            </p>
          ) : null}
          {refused ? (
            <div role="alert" className="flex flex-col gap-3 rounded-card border border-line bg-warning-subtle p-4 text-body-sm text-fg">
              <p>{t("coupons.refused")}</p>
              {coupon ? <EndCouponButton coupon={coupon} onEnded={onClose} /> : null}
            </div>
          ) : null}
          {!coupon ? (
            <Field label={t("coupons.code")} description={t("coupons.codeHelp")} error={err("code")} required>
              <Input dir="ltr" value={code} onChange={(e) => setCode(e.target.value.toUpperCase().replace(/\s/g, ""))} maxLength={20} autoComplete="off" />
            </Field>
          ) : null}

          {locked ? (
            <section aria-labelledby="cp-locked" className="flex flex-col gap-3 rounded-card border border-line bg-sunken p-4">
              <h3 id="cp-locked" className="inline-flex items-center gap-2 text-label text-fg">
                <Info aria-hidden="true" className="size-4 text-info" />
                {t("coupons.discountLocked")}
              </h3>
              <p className="text-body-sm text-fg">
                {coupon!.kind === "percent" ? t("coupons.percentOff", { value: coupon!.value ?? 0 }) : Object.entries(coupon!.amounts ?? {}).map(([c, a]) => f.money(a, c)).join(" · ")}
              </p>
              <p className="text-body-sm text-fg-muted">{t("coupons.lockedBody", { count: coupon!.redeemed })}</p>
              <div>
                <EndCouponButton coupon={coupon!} onEnded={onClose} />
              </div>
            </section>
          ) : (
            <>
              <Field label={t("coupons.kind")} group required>
                <RadioGroup
                  orientation="horizontal"
                  value={kind}
                  onValueChange={setKind}
                  options={[
                    { value: "percent", label: t("coupons.kindPercent") },
                    { value: "fixed", label: t("coupons.kindFixed") },
                  ]}
                />
              </Field>
              {kind === "percent" ? (
                <Field label={t("coupons.percent")} description={t("coupons.percentHelp")} error={err("value")} required>
                  <PercentField value={value} onValueChange={setValue} min={1} max={100} />
                </Field>
              ) : (
                <fieldset className="flex flex-col gap-3">
                  <legend className="mb-1 text-label text-fg">{t("coupons.amounts")}</legend>
                  <p className="text-body-sm text-fg-muted">{t("coupons.amountsHelp")}</p>
                  <ul className="flex flex-col gap-2">
                    {rows.map((r, i) => (
                      <li key={i} className="flex flex-wrap items-end gap-2">
                        <Field label={t("coupons.currency")} className="min-w-32 flex-1">
                          <Select
                            value={r.currency || null}
                            onValueChange={(v) => setRow(i, { currency: v ?? "" })}
                            placeholder={t("coupons.chooseCurrency")}
                            options={active.map((c) => ({ value: c.code, label: c.code, disabled: c.code !== r.currency && chosen.includes(c.code) }))}
                          />
                        </Field>
                        <Field label={t("coupons.amount")} className="min-w-32 flex-1">
                          <MoneyField currency={r.currency || "USD"} value={r.amount} onValueChange={(v) => setRow(i, { amount: v })} disabled={!r.currency} />
                        </Field>
                        <IconButton variant="ghost" icon={<Trash />} label={t("coupons.removeCurrency", { currency: r.currency || "—" })} onClick={() => setRows(rows.filter((_, j) => j !== i))} disabled={rows.length === 1} />
                      </li>
                    ))}
                  </ul>
                  {errors.amounts ? (
                    <p className="text-body-sm text-danger">{t("coupons.errors.required")}</p>
                  ) : null}
                  <div>
                    <Button variant="secondary" size="sm" startIcon={<Plus />} onClick={() => setRows([...rows, { currency: "", amount: null }])} disabled={rows.length >= active.length}>
                      {t("coupons.addCurrency")}
                    </Button>
                  </div>
                  <p role="status" className="flex items-start gap-2 rounded-card bg-info-subtle p-3 text-body-sm text-fg">
                    <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-info" />
                    {chosen.length ? t("coupons.onlyIn", { currencies: currencyList(chosen) }) : t("coupons.onlyInNone")}
                  </p>
                </fieldset>
              )}
            </>
          )}

          <Field label={t("coupons.appliesTo")}>
            <Select value={appliesTo} onValueChange={(v) => setAppliesTo(v ?? "all")} options={[{ value: "all", label: t("coupons.allPlans") }, ...plans.map((p) => ({ value: p.id, label: label(p) }))]} />
          </Field>
          <Field label={t("coupons.max")} description={t("coupons.maxHelp")}>
            <NumberField value={max} onValueChange={setMax} min={coupon?.redeemed || 1} step={1} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("coupons.validFrom")}>
              <DatePicker value={from} onChange={setFrom} aria-label={t("coupons.validFrom")} />
            </Field>
            <Field label={t("coupons.validTo")} error={err("validTo")} required>
              <DatePicker value={to} onChange={setTo} min={from ?? undefined} aria-label={t("coupons.validTo")} />
            </Field>
          </div>
          <Field label={t("coupons.note")} description={t("coupons.noteHelp")} optional>
            <Textarea dir="auto" value={note} onChange={(e) => setNote(e.target.value)} maxRows={4} />
          </Field>
        </DialogBody>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            {tc("cancel")}
          </Button>
          <Button loading={creating.isLoading || updating.isLoading} onClick={submit}>
            {coupon ? tc("save") : t("coupons.create")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
