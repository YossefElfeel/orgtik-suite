"use client";

import { useTranslations } from "next-intl";
import { Badge, ErrorState, LoadingState, PageHeader, StatusBadge, useFormatter } from "@orgtik/ui";
import { DateText, Facts, Money, Nothing, Section } from "@/components/customers/shared";
import { Link } from "@/i18n/routing";
import { useCan } from "@/lib/permissions";
import { statusOf } from "@/store/api";
import { useInvoiceQuery } from "@/store/billing";
import { InvoiceActions } from "./InvoiceActions";
import { PaginatedTable } from "@orgtik/ui/table";

/** One invoice (ADM-23): its lines and tax, payments with gateway and USD rate, credit notes, what's refundable. */
export function InvoiceDetail({ id }: { id: string }) {
  const t = useTranslations("Billing");
  const tc = useTranslations("Common");
  const f = useFormatter();
  const can = useCan();
  const editable = can("billing:edit");
  const { data: inv, isLoading, error, refetch } = useInvoiceQuery(id);
  const crumbs = [{ label: t("list.title"), href: "/invoices" }];
  if (isLoading) return <LoadingState rows={6} label={tc("loading")} />;
  if (error || !inv) {
    if (statusOf(error) === 404)
      return (
        <div className="flex flex-col gap-6">
          <PageHeader title={t("detail.notFound")} breadcrumb={crumbs} />
          <ErrorState title={t("detail.notFound")} description={t("detail.notFoundBody")} action={<Link href="/invoices" className="text-fg-brand hover:underline">{t("detail.back")}</Link>} />
        </div>
      );
    return <ErrorState title={tc("loadFailed")} description={tc("loadFailedBody")} onRetry={() => refetch()} />;
  }
  const method = (m: string) => (t.has(`method.${m}`) ? t(`method.${m}`) : m);
  const taxRate = inv.taxRate ?? Number(/([\d.]+)\s*%/.exec(inv.taxLabel ?? "")?.[1] ?? 0);
  const taxLabel = inv.reverseCharge ? t("detail.taxReverseCharge") : inv.taxDisplay ? t(inv.taxDisplay === "inclusive" ? "detail.taxIncluded" : "detail.taxAdded", { rate: f.percent(taxRate / 100) }) : null;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={<span dir="ltr">{inv.number}</span>}
        breadcrumb={[...crumbs, { label: <span dir="ltr">{inv.number}</span> }]}
        status={<StatusBadge entity="invoice" state={inv.state} />}
        actions={editable ? <InvoiceActions invoice={inv} /> : undefined}
      />
      {!editable ? <p className="text-body-sm text-fg-muted">{tc("viewOnly")}</p> : null}

      <Section id="inv-summary" title={t("detail.summary")}>
        <Facts
          items={[
            {
              label: t("detail.workspace"),
              value: can("workspaces:view") ? (
                <Link href={`/workspaces/${inv.workspaceId}`} className="font-semibold text-fg hover:underline focus-visible:outline-2 focus-visible:outline-focus">
                  <bdi dir="auto">{inv.workspace ?? inv.workspaceId}</bdi>
                </Link>
              ) : (
                <bdi dir="auto">{inv.workspace ?? inv.workspaceId}</bdi>
              ),
            },
            { label: t("detail.kind"), value: t.has(`kind.${inv.kind}`) ? t(`kind.${inv.kind}`) : inv.kind },
            { label: t("detail.currency"), value: <span dir="ltr">{inv.currency}</span> },
            { label: t("detail.issued"), value: inv.issuedAt ? <DateText value={inv.issuedAt} /> : t("list.notIssued") },
            { label: t("detail.due"), value: <DateText value={inv.dueAt} /> },
            ...(inv.paidAt ? [{ label: t("detail.paid"), value: <DateText value={inv.paidAt} /> }] : []),
            ...(inv.voidedAt
              ? [
                  {
                    label: t("detail.voided"),
                    value: (
                      <span className="flex flex-col">
                        <DateText value={inv.voidedAt} />
                        {inv.voidReason ? <span className="text-fg-muted"><bdi dir="auto">{inv.voidReason}</bdi></span> : null}
                      </span>
                    ),
                  },
                ]
              : []),
            { label: t("detail.refundable"), value: <Money amount={inv.refundable ?? 0} currency={inv.currency} className="font-semibold" /> },
          ]}
        />
      </Section>

      <Section id="inv-lines" title={t("detail.lines")}>
        <div className="overflow-x-auto">
          <PaginatedTable><table aria-labelledby="inv-lines" className="w-full border-collapse text-body-sm">
            <thead>
              <tr className="border-b border-line">
                <th scope="col" className="py-2 text-start text-caption font-semibold text-fg-muted">
                  {t("detail.item")}
                </th>
                <th scope="col" className="py-2 text-end text-caption font-semibold text-fg-muted">
                  {t("detail.amount")}
                </th>
              </tr>
            </thead>
            <tbody>
              {inv.lines.map((l, i) => (
                <tr key={i} className="border-b border-line">
                  <td className="py-2 text-start text-fg">
                    {l.kind && t.has(`detail.ledger.${l.kind}`) ? (
                      <span>{t(`detail.ledger.${l.kind}`)}{l.kind === "coupon_discount" && l.label !== "Coupon" ? <> · <bdi dir="ltr">{l.label}</bdi></> : null}</span>
                    ) : <span><bdi dir="auto">{l.label}</bdi></span>}
                  </td>
                  <td className="py-2 text-end">
                    <Money amount={l.amount} currency={inv.currency} />
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <th scope="row" className="pt-3 text-start font-normal text-fg-muted">
                  {t("detail.subtotal")}
                </th>
                <td className="pt-3 text-end">
                  <Money amount={inv.subtotal} currency={inv.currency} />
                </td>
              </tr>
              <tr>
                <th scope="row" className="py-1 text-start font-normal text-fg-muted">
                  {taxLabel ?? (inv.taxLabel ? (
                    <>
                      {t("detail.tax")} · <span><bdi dir="auto">{inv.taxLabel}</bdi></span>
                    </>
                  ) : (
                    t("detail.noTax")
                  ))}
                </th>
                <td className="py-1 text-end">
                  <Money amount={inv.tax} currency={inv.currency} />
                </td>
              </tr>
              <tr>
                <th scope="row" className="py-1 text-start font-semibold text-fg">
                  {t("detail.total")}
                </th>
                <td className="py-1 text-end font-semibold text-fg">
                  <Money amount={inv.total} currency={inv.currency} />
                </td>
              </tr>
              {inv.refunded > 0 ? (
                <tr>
                  <th scope="row" className="py-1 text-start font-normal text-fg-muted">
                    {t("detail.refunded")}
                  </th>
                  <td className="py-1 text-end text-fg-muted">
                    <Money amount={-inv.refunded} currency={inv.currency} />
                  </td>
                </tr>
              ) : null}
            </tfoot>
          </table></PaginatedTable>
        </div>
      </Section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section id="inv-payments" title={t("detail.payments")}>
          {inv.payments.length ? (
            <ul className="flex flex-col divide-y divide-line">
              {inv.payments.map((p) => (
                <li key={p.id} className="flex flex-col gap-1 py-2 text-body-sm">
                  <span className="flex flex-wrap items-center justify-between gap-2">
                    <span className="flex flex-wrap items-center gap-2">
                      <Money amount={p.amount} currency={p.currency} className="font-semibold text-fg" />
                      <Badge size="sm" tone={p.status === "succeeded" ? "success" : "danger"}>
                        {t.has(`payment.${p.status}`) ? t(`payment.${p.status}`) : p.status}
                      </Badge>
                    </span>
                    <span className="text-caption text-fg-muted">
                      <DateText value={p.at} time />
                    </span>
                  </span>
                  <span className="text-fg-muted">
                    {method(p.method)}
                    {p.gateway ? (
                      <>
                        {" · "}
                        {t("detail.gateway")} <span dir="ltr">{p.gateway}</span>
                      </>
                    ) : null}
                    {p.reference ? (
                      <>
                        {" · "}
                        {t("detail.reference")} <span dir="ltr">{p.reference}</span>
                      </>
                    ) : null}
                  </span>
                  {p.usdRate ? (
                    <span className="text-caption text-fg-muted">
                      {t("detail.usdRate", { rate: f.number(p.usdRate, { maximumFractionDigits: 4 }) })} · <Money amount={p.usdAmount ?? null} currency="USD" />
                    </span>
                  ) : null}
                  {p.reason ? <span className="text-caption text-danger">{t.has(`failure.${p.reason}`) ? t(`failure.${p.reason}`) : <span dir="ltr">{p.reason}</span>}</span> : null}
                </li>
              ))}
            </ul>
          ) : (
            <Nothing>{t("detail.noPayments")}</Nothing>
          )}
        </Section>

        <Section id="inv-credit" title={t("detail.creditNotes")}>
          {inv.creditNotes.length ? (
            <ul className="flex flex-col divide-y divide-line">
              {inv.creditNotes.map((c) => (
                <li key={c.id} className="flex flex-col gap-1 py-2 text-body-sm">
                  <span className="flex flex-wrap items-center justify-between gap-2">
                    <span dir="ltr" className="font-semibold text-fg">{c.number}</span>
                    <Money amount={c.amount} currency={inv.currency} className="text-fg" />
                  </span>
                  <span className="text-fg-muted"><bdi dir="auto">{c.reason}</bdi></span>
                  <span className="text-caption text-fg-subtle">
                    <DateText value={c.at} time />
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <Nothing>{t("detail.noCreditNotes")}</Nothing>
          )}
        </Section>
      </div>
    </div>
  );
}
