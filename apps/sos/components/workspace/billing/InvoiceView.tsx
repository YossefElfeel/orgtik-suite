"use client";
// One invoice (USR-10): seller and buyer, the lines, discounts, the tax as it applied, the total,
// and what happened to it since: payments (failed ones too), refunds and credit notes. Printing
// prints the invoice alone: the page is copied into a print-only layer (Tailwind print: variants)
// that hides everything else while printing.
import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { Printer } from "@phosphor-icons/react";
import { Badge, Button, Card, ErrorState, LoadingState, PageHeader, StatusBadge, useFormatter, useStatusLabel } from "@orgtik/ui";
import { statusOf } from "@/redux/features/platform/platformApi";
import { useBillingInvoiceQuery, useBillingSubscriptionsQuery, type Invoice, type SubscriptionLine } from "@/redux/features/platform/billing";
import { ButtonLink } from "@/components/shared/ButtonLink";
import { Money, useCountryName, useDay, useLocalized, useTaxName } from "./shared";

export function InvoiceView({ id }: { id: string }) {
  const t = useTranslations("Billing.invoice");
  const tb = useTranslations("Billing");
  const { data, isLoading, isError, error, refetch } = useBillingInvoiceQuery(id);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (isLoading) return <LoadingState rows={8} label={tb("loading")} />;
  if (statusOf(error) === 404)
    return <ErrorState titleAs="h1" title={t("notFound")} description={t("notFoundBody")} action={<ButtonLink href="/billing/invoices">{t("back")}</ButtonLink>} />;
  if (isError || !data) return <ErrorState titleAs="h1" title={t("failed")} description={tb("tryAgain")} onRetry={refetch} />;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        breadcrumb={[{ label: tb("invoices.title"), href: "/billing/invoices" }, { label: <span dir="ltr">{data.number}</span> }]}
        title={t("title", { number: data.number })}
        status={<StatusBadge entity="invoice" state={data.state} viewer="customer" />}
        actions={
          <Button variant="secondary" startIcon={<Printer />} onClick={() => window.print()}>
            {t("print")}
          </Button>
        }
      />
      <Card padding="none" className="overflow-hidden">
        <InvoiceDocument invoice={data} />
      </Card>
      {/* The same invoice, alone on paper. Hidden on screen; while printing, everything else is. */}
      {mounted
        ? createPortal(
            <div aria-hidden="true" className="hidden print:block print:[body:has(&)>*:not(&)]:hidden">
              <InvoiceDocument invoice={data} printing />
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

function InvoiceDocument({ invoice: inv, printing = false }: { invoice: Invoice; printing?: boolean }) {
  const t = useTranslations("Billing.invoice");
  const f = useFormatter();
  const day = useDay();
  const country = useCountryName();
  const taxName = useTaxName();
  const name = useLocalized();
  // Line labels come written in English; the subscription line they bill names the tool and plan
  // in the reader's language.
  const subs = useBillingSubscriptionsQuery();
  const statusLabel = useStatusLabel();
  const lineLabel = (label: string, lineId?: string, kind?: string, amount = 0) => {
    const l: SubscriptionLine | undefined = subs.data?.lines.find((x) => x.id === lineId);
    if (kind && t.has(`ledger.${kind}`)) return (
      <>
        {t(`ledger.${kind}`)}
        {kind === "coupon_discount" && label !== "Coupon" ? <> · <bdi dir="ltr">{label}</bdi></> : null}
        {l ? <span className="text-fg-muted"> · {name(l.toolName, l.tool)}</span> : null}
      </>
    );
    if (kind && kind !== "charge") return <span dir="auto">{label}</span>;
    if (!kind && amount < 0) return <><span className="text-fg-muted">{t("discount")}</span> <span dir="auto">{label}</span></>;
    if (!l) return <span dir="auto">{label}</span>;
    const qty = /×\s*(\d+)\s*$/.exec(label)?.[1];
    const capacity = /\bcapacity\s+(\d+)\s*$/.exec(label)?.[1];
    return (
      <>
        {t("lineLabel", { tool: name(l.toolName, l.tool), plan: name(l.planName, l.planId) })}
        {qty ? (
          <>
            {" "}
            <span dir="ltr">× {qty}</span>
          </>
        ) : null}
        {capacity ? <> · {t("lineCapacity", { count: Number(capacity) })}</> : null}
      </>
    );
  };
  const tax = /^(.*?)\s+([\d.]+)\s*%(?:\s+\((?:included|excluded)\))?$/.exec(inv.taxLabel ?? "");
  const rate = f.percent((inv.taxRate ?? Number(tax?.[2] ?? 0)) / 100);
  const taxText = inv.reverseCharge ? t("taxReverseCharge") : inv.taxDisplay ? t(inv.taxDisplay === "inclusive" ? "taxIncluded" : "taxAdded", { rate }) : inv.taxLabel ? (tax ? t("taxLine", { name: taxName(tax[1]), rate: tax[2] }) : inv.taxLabel) : t("noTax");
  const cur = inv.currency;
  const refunds = inv.refunds ?? [];
  const H = printing ? "p" : "h2";

  return (
    <div className="flex flex-col gap-6 p-5 sm:p-8 print:p-0">
      {printing ? (
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="font-display text-title-lg">{t("title", { number: inv.number })}</p>
          <p className="text-body text-fg-muted">{statusLabel("invoice", inv.state, "customer")}</p>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Party label={t("from")} heading={H}>
          <span className="font-medium">
            <bdi>{inv.seller.name}</bdi>
          </span>
        </Party>
        <Party label={t("billedTo")} heading={H}>
          {inv.buyer ? (
            <>
              <span className="font-medium">
                <bdi>{inv.buyer.legalName || "—"}</bdi>
              </span>
              {inv.buyer.address ? (
                <span>
                  <bdi>{inv.buyer.address}</bdi>
                </span>
              ) : null}
              {inv.buyer.country ? <span>{country(inv.buyer.country)}</span> : null}
              {inv.buyer.email ? (
                <span>
                  <span dir="ltr">{inv.buyer.email}</span>
                </span>
              ) : null}
              {inv.buyer.taxId ? (
                <span>
                  {t("taxId")} <span dir="ltr">{inv.buyer.taxId}</span>
                </span>
              ) : null}
            </>
          ) : (
            <span className="text-fg-muted">—</span>
          )}
        </Party>
      </div>

      <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Meta label={t("number")}>
          <span dir="ltr">{inv.number}</span>
        </Meta>
        <Meta label={t("issued")}>{day(inv.issuedAt) || "—"}</Meta>
        <Meta label={t("due")}>{day(inv.dueAt) || "—"}</Meta>
        <Meta label={inv.state === "void" ? t("voided") : t("paidOn")}>{(inv.state === "void" ? day(inv.voidedAt) : day(inv.paidAt)) || "—"}</Meta>
      </dl>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-body">
          <caption className="sr-only">{t("linesCaption")}</caption>
          <thead>
            <tr className="border-b border-line-strong text-start text-caption text-fg-muted">
              <th scope="col" className="py-2 text-start font-semibold">
                {t("description")}
              </th>
              <th scope="col" className="py-2 text-end font-semibold">
                {t("amount")}
              </th>
            </tr>
          </thead>
          <tbody>
            {inv.lines.map((l, i) => (
              <tr key={i} className="border-b border-line">
                <td className="py-2.5 pe-4">{lineLabel(l.label, l.lineId, l.kind, l.amount)}</td>
                <td className="py-2.5 text-end">
                  <Money amount={l.amount} currency={cur} />
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <Total label={t("subtotal")}>
              <Money amount={inv.subtotal} currency={cur} />
            </Total>
            <Total label={taxText}>
              <Money amount={inv.tax} currency={cur} />
            </Total>
            <Total label={t("total")} strong>
              <Money amount={inv.total} currency={cur} />
            </Total>
            {inv.refunded > 0 ? (
              <Total label={t("refundedTotal")}>
                <Money amount={-inv.refunded} currency={cur} />
              </Total>
            ) : null}
          </tfoot>
        </table>
      </div>

      <Section title={t("payments")} heading={H}>
        {inv.payments.length ? (
          <ul className="flex flex-col divide-y divide-line text-body">
            {inv.payments.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2.5">
                <span className="flex flex-col">
                  <span>{t("paymentLine", { date: day(p.at), method: t.has(`methods.${p.method}`) ? t(`methods.${p.method}`) : p.method })}</span>
                  {p.status === "failed" && p.reason ? <span className="text-caption text-fg-muted">{t.has(`reasons.${p.reason}`) ? t(`reasons.${p.reason}`) : t("reasons.other")}</span> : null}
                </span>
                <span className="flex items-center gap-3">
                  <Money amount={p.amount} currency={p.currency} />
                  <Badge tone={p.status === "succeeded" ? "success" : p.status === "failed" ? "danger" : "neutral"}>{t.has(`paymentStates.${p.status}`) ? t(`paymentStates.${p.status}`) : p.status}</Badge>
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-body-sm text-fg-muted">{t("noPayments")}</p>
        )}
      </Section>

      {refunds.length ? (
        <Section title={t("refunds")} heading={H}>
          <ul className="flex flex-col divide-y divide-line text-body">
            {refunds.map((r, i) => (
              <li key={r.id ?? i} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2.5">
                <span className="flex flex-col">
                  <span>{day(r.at) || "—"}</span>
                  {r.reason ? <span dir="auto" className="text-caption text-fg-muted">{r.reason}</span> : null}
                </span>
                <Money amount={r.amount} currency={cur} />
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {inv.creditNotes.length ? (
        <Section title={t("creditNotes")} heading={H}>
          <ul className="flex flex-col divide-y divide-line text-body">
            {inv.creditNotes.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2.5">
                <span className="flex flex-col">
                  <span>
                    <span dir="ltr">{c.number}</span> · {day(c.at)}
                  </span>
                  {c.reason ? <span dir="auto" className="text-caption text-fg-muted">{c.reason}</span> : null}
                </span>
                <Money amount={c.amount} currency={cur} />
              </li>
            ))}
          </ul>
        </Section>
      ) : null}
    </div>
  );
}

function Party({ label, heading: H, children }: { label: string; heading: "h2" | "p"; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <H className="text-caption font-semibold text-fg-muted">{label}</H>
      <div className="flex flex-col text-body text-fg">{children}</div>
    </div>
  );
}

function Meta({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <dt className="text-caption text-fg-muted">{label}</dt>
      <dd className="text-body text-fg">{children}</dd>
    </div>
  );
}

function Total({ label, strong, children }: { label: string; strong?: boolean; children: ReactNode }) {
  return (
    <tr className={strong ? "border-t border-line-strong" : undefined}>
      <th scope="row" className={`py-2 pe-4 text-end ${strong ? "font-semibold text-fg" : "font-normal text-fg-muted"}`}>
        {label}
      </th>
      <td className={`py-2 text-end ${strong ? "text-body-lg font-semibold" : ""}`}>{children}</td>
    </tr>
  );
}

function Section({ title, heading: H, children }: { title: string; heading: "h2" | "p"; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <H className="font-display text-title-sm text-fg">{title}</H>
      {children}
    </section>
  );
}
