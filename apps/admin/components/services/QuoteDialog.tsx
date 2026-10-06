"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, Trash } from "@phosphor-icons/react";
import { Button, Checkbox, Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Field, IconButton, Input, MoneyField, NumberField, useFormatter } from "@orgtik/ui";
import type { QuoteLine, ServiceRequest } from "@/store/services";

type Draft = { label: string; amount: number | null };
const DECIMALS: Record<string, number> = { KWD: 3, BHD: 3, OMR: 3, JPY: 0 };
const round = (n: number, cur: string | null) => {
  const d = cur ? (DECIMALS[cur] ?? 2) : 2;
  return Math.round(n * 10 ** d) / 10 ** d;
};

/**
 * A quote in the workspace's currency (R03-V2): the lines, the subscriber discount as a line of its
 * own (R03-V3), the total and how long it's valid.
 */
export function QuoteDialog({
  request,
  serviceName,
  currency,
  discountPct,
  busy,
  error,
  onSend,
  onClose,
}: {
  request: ServiceRequest;
  serviceName: string;
  currency: string | null;
  discountPct: number;
  busy: boolean;
  error?: string;
  onSend: (lines: QuoteLine[], validDays: number) => void;
  onClose: () => void;
}) {
  const t = useTranslations("Services");
  const tc = useTranslations("Common");
  const f = useFormatter();
  const previous = request.quote?.lines ?? [];
  const [lines, setLines] = useState<Draft[]>(previous.filter((l) => l.amount > 0).map((l): Draft => ({ ...l })).concat(previous.length ? [] : [{ label: serviceName, amount: null }]));
  const [discount, setDiscount] = useState(previous.length ? previous.some((l) => l.amount < 0) : discountPct > 0);
  const [days, setDays] = useState<number | null>(14);
  const [tried, setTried] = useState(false);

  const subtotal = lines.reduce((s, l) => s + (l.amount ?? 0), 0);
  const discountAmount = discount ? -round((subtotal * discountPct) / 100, currency) : 0;
  const total = round(subtotal + discountAmount, currency);
  const money = (n: number) => (currency ? f.money(n, currency) : f.number(n, { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
  const until = new Date(Date.now() + (days ?? 14) * 86400000);
  const valid = lines.length > 0 && lines.every((l) => l.label.trim() && l.amount !== null && l.amount > 0) && (days ?? 0) > 0;
  const set = (i: number, p: Partial<Draft>) => setLines(lines.map((l, j) => (j === i ? { ...l, ...p } : l)));

  const send = () => {
    setTried(true);
    if (!valid) return;
    const out: QuoteLine[] = lines.map((l) => ({ label: l.label.trim(), amount: round(l.amount ?? 0, currency) }));
    if (discount && discountAmount) out.push({ label: t("quote.discountLine", { pct: discountPct }), amount: discountAmount });
    onSend(out, days ?? 14);
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>{request.quote ? t("quote.reviseTitle", { number: request.number }) : t("quote.title", { number: request.number })}</DialogTitle>
          <DialogDescription>{currency ? t("quote.currencyNote", { currency }) : t("quote.currencyUnknown")}</DialogDescription>
        </DialogHeader>
        <DialogBody className="flex flex-col gap-5">
          {error ? (
            <p role="alert" className="rounded-card bg-danger-subtle p-3 text-body-sm text-fg">
              {error}
            </p>
          ) : null}
          {tried && !valid ? (
            <p role="alert" className="text-body-sm text-danger">
              {t("quote.fixLines")}
            </p>
          ) : null}
          <fieldset className="flex flex-col gap-3">
            <legend className="mb-1 text-label text-fg">{t("quote.lines")}</legend>
            <ul className="flex flex-col gap-3">
              {lines.map((l, i) => (
                <li key={i} className="flex flex-wrap items-end gap-2">
                  <Field label={t("quote.lineLabel", { n: i + 1 })} className="min-w-48 flex-[2]">
                    <Input dir="auto" value={l.label} onChange={(e) => set(i, { label: e.target.value })} />
                  </Field>
                  <Field label={t("quote.lineAmount", { n: i + 1 })} className="min-w-32 flex-1">
                    {currency ? <MoneyField currency={currency} value={l.amount} onValueChange={(v) => set(i, { amount: v })} /> : <NumberField value={l.amount} onValueChange={(v) => set(i, { amount: v })} min={0} steppers={false} />}
                  </Field>
                  <IconButton variant="ghost" icon={<Trash />} label={t("quote.removeLine", { n: i + 1 })} onClick={() => setLines(lines.filter((_, j) => j !== i))} disabled={lines.length === 1} />
                </li>
              ))}
            </ul>
            <div>
              <Button variant="secondary" size="sm" startIcon={<Plus />} onClick={() => setLines([...lines, { label: "", amount: null }])}>
                {t("quote.addLine")}
              </Button>
            </div>
          </fieldset>
          <Checkbox checked={discount} onCheckedChange={(v) => setDiscount(Boolean(v))} disabled={!discountPct} label={t("quote.discount", { pct: discountPct })} description={t("quote.discountHelp")} />
          <Field label={t("quote.validDays")} description={t("quote.validUntil", { date: f.date(until, { dateStyle: "medium" }) })}>
            <NumberField value={days} onValueChange={setDays} min={1} max={90} step={1} />
          </Field>
          <dl className="flex flex-col gap-1 rounded-card border border-line bg-sunken p-4 text-body-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-fg-muted">{t("quote.subtotal")}</dt>
              <dd dir="ltr" className="tabular-nums text-fg">{money(subtotal)}</dd>
            </div>
            {discount && discountAmount ? (
              <div className="flex justify-between gap-4">
                <dt className="text-fg-muted">{t("quote.discountLine", { pct: discountPct })}</dt>
                <dd dir="ltr" className="tabular-nums text-fg">{money(discountAmount)}</dd>
              </div>
            ) : null}
            <div className="flex justify-between gap-4 border-t border-line pt-2 font-medium">
              <dt className="text-fg">{t("quote.total")}</dt>
              <dd dir="ltr" className="tabular-nums text-fg">{money(total)}</dd>
            </div>
          </dl>
        </DialogBody>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            {tc("cancel")}
          </Button>
          <Button loading={busy} onClick={send}>
            {t("quote.send")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
