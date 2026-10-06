"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ArrowRight, Lock, LockOpen, Plus, Timer } from "@phosphor-icons/react";
import { Badge, Button, ErrorState, LoadingState, PageHeader, STATUS_MATRIX, StatusBadge, useFormatter, type StatusEntity } from "@orgtik/ui";
import { Link } from "@/i18n/routing";
import { useCan } from "@/lib/permissions";
import { statusOf, type Localized } from "@/store/api";
import { useWorkspaceQuery, type Line, type ViewAsResult, type WorkspaceDetail as WS } from "@/store/customers";
import { NewInvoiceDialog } from "@/components/billing/NewInvoiceDialog";
import { ExtendTrialDialog } from "./ExtendTrialDialog";
import { DateText, Facts, Money, Nothing, Section, useRegionNames, useToolName } from "./shared";
import { ViewAsNotice, WorkspaceActions } from "./WorkspaceActions";

// The status matrix names some states differently from the API: map them, else show a plain badge.
const ALIAS: Record<string, string> = { waiting_for_you: "awaiting_reply", in_review: "customer_review" };
function AnyStatus({ entity, state }: { entity: StatusEntity; state: string }) {
  const s = ALIAS[state] ?? state;
  if (s in STATUS_MATRIX[entity]) return <StatusBadge entity={entity} state={s as never} size="sm" />;
  return (
    <Badge size="sm" tone="neutral">
      <span dir="ltr">{state}</span>
    </Badge>
  );
}

function useLocalized() {
  const locale = useLocale() as keyof Localized;
  return (v: Localized | undefined, fallback: string) => (v ? (v[locale] ?? v.en) : fallback);
}

function LineCard({ ws, line, editable, onExtend }: { ws: WS; line: Line; editable: boolean; onExtend: () => void }) {
  const t = useTranslations("Customers");
  const f = useFormatter();
  const loc = useLocalized();
  const toolName = useToolName();
  const s = line.snapshot;
  const items: { label: string; value: React.ReactNode }[] = [
    { label: t("line.cycle"), value: t.has(`cycle.${line.cycle}`) ? t(`cycle.${line.cycle}`) : line.cycle },
    {
      label: t("line.price"),
      value: (
        <span className="flex flex-col gap-0.5">
          <span>
            <Money amount={s.amount} currency={s.currency} />
            {s.quantity > 1 ? (
              <span className="text-fg-muted">
                {" "}
                (<Money amount={s.unit} currency={s.currency} /> × <span className="tabular-nums">{s.quantity}</span>)
              </span>
            ) : null}
          </span>
          <span className="text-caption text-fg-muted">{t("line.snapshot", { source: t.has(`source.${sourceKey(s.source)}`) ? t(`source.${sourceKey(s.source)}`) : s.source, version: s.priceVersion })}</span>
        </span>
      ),
    },
  ];
  if (line.periodEnd) items.push({ label: t("line.periodEnd"), value: <DateText value={line.periodEnd} /> });
  if (line.trialEndsAt) items.push({ label: t("line.trialEnd"), value: <DateText value={line.trialEndsAt} /> });
  if (line.graceEndsAt) items.push({ label: t("line.graceEnd"), value: <DateText value={line.graceEndsAt} /> });
  if (line.readOnlySince) items.push({ label: t("line.readOnlySince"), value: <DateText value={line.readOnlySince} /> });
  if (line.cancelAt) items.push({ label: t("line.cancelAt"), value: <DateText value={line.cancelAt} /> });
  if (line.endedAt) items.push({ label: t("line.endedAt"), value: <DateText value={line.endedAt} /> });
  if (line.lastFailure)
    items.push({
      label: t("line.lastFailure"),
      value: (
        <span>
          {t.has(`failure.${line.lastFailure.reason}`) ? t(`failure.${line.lastFailure.reason}`) : <span dir="ltr">{line.lastFailure.reason}</span>} · <DateText value={line.lastFailure.at} />
        </span>
      ),
    });
  items.push({
    label: t("line.scheduled"),
    value: line.scheduled ? (
      <span className="flex flex-col gap-0.5">
        <span>
          {t.has(`scheduledKind.${line.scheduled.kind}`) ? t(`scheduledKind.${line.scheduled.kind}`) : line.scheduled.kind} · {f.date(line.scheduled.effectiveAt, { dateStyle: "medium" })}
        </span>
        {line.scheduled.note ? <span className="text-caption text-fg-muted"><bdi dir="auto">{line.scheduled.note}</bdi></span> : null}
      </span>
    ) : (
      <span className="text-fg-muted">{t("line.noScheduled")}</span>
    ),
  });
  const title = `${loc(line.toolName, toolName(line.tool))} · ${loc(line.planName, line.planId)}`;
  return (
    <li className="flex flex-col gap-3 rounded-card border border-line p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-label text-fg">{title}</h3>
        <StatusBadge entity="subscription_line" state={line.state} size="sm" />
      </div>
      <Facts items={items} />
      {editable && line.state === "trialing" ? (
        <Button size="sm" variant="secondary" className="self-start" startIcon={<Timer />} onClick={onExtend}>
          {t("trial.extend")}
        </Button>
      ) : null}
      {ws.currency !== s.currency ? <p className="text-caption text-fg-muted">{t("line.otherCurrency", { currency: s.currency })}</p> : null}
    </li>
  );
}

const LINE_ORDER = ["past_due", "read_only", "trialing", "cancelling", "active", "free", "ended", "deleted"];
const sourceKey = (s: string) => ({ Private: "private", Country: "country", Zone: "zone", "Zone (converted)": "zoneConverted", Default: "default" })[s] ?? s;

export function WorkspaceDetail({ id }: { id: string }) {
  const t = useTranslations("Customers");
  const tc = useTranslations("Common");
  const names = useRegionNames();
  const toolName = useToolName();
  const can = useCan();
  const editable = can("workspaces:edit");
  const billing = can("billing:view");
  const { data: ws, isLoading, error, refetch } = useWorkspaceQuery(id);
  const [extending, setExtending] = useState<Line | null>(null);
  const [viewAs, setViewAs] = useState<ViewAsResult | null>(null);
  const [invoicing, setInvoicing] = useState(false);
  const tb = useTranslations("Billing");

  const crumbs = [{ label: t("list.title"), href: "/workspaces" }];
  if (isLoading) return <LoadingState rows={6} label={tc("loading")} />;
  if (error || !ws) {
    if (statusOf(error) === 404)
      return (
        <div className="flex flex-col gap-6">
          <PageHeader title={t("detail.notFound")} breadcrumb={crumbs} />
          <ErrorState title={t("detail.notFound")} description={t("detail.notFoundBody")} action={<Link href="/workspaces" className="text-fg-brand hover:underline">{t("detail.back")}</Link>} />
        </div>
      );
    return <ErrorState title={tc("loadFailed")} description={tc("loadFailedBody")} onRetry={() => refetch()} />;
  }

  // Notes carry the author's key; the audit trail has the names.
  const nameOf = (key: string) => ws.audit.find((a) => a.by === key)?.byName ?? key;
  // Lines that need someone first: past due, read-only, trials.
  const visibleLines = ws.lines.filter((l) => l.state !== "deleted").sort((a, b) => LINE_ORDER.indexOf(a.state) - LINE_ORDER.indexOf(b.state));
  const zone = ws.zone ? (t.has(`zones.${ws.zone}`) ? t(`zones.${ws.zone}`) : ws.zone) : "—";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={<bdi dir="auto">{ws.name}</bdi>}
        breadcrumb={[...crumbs, { label: <bdi dir="auto">{ws.name}</bdi> }]}
        status={<StatusBadge entity="workspace" state={ws.state} />}
        actions={editable && ws.state !== "deleted" ? <WorkspaceActions ws={ws} onViewAs={setViewAs} /> : undefined}
      />
      {!editable ? <p className="text-body-sm text-fg-muted">{tc("viewOnly")}</p> : null}
      {viewAs ? <ViewAsNotice result={viewAs} onDismiss={() => setViewAs(null)} /> : null}
      {ws.state === "suspended" && ws.flags.suspendedReason ? (
        <p className="rounded-card border border-line bg-danger-subtle px-4 py-3 text-body-sm text-danger">
          {t("detail.suspendedBecause")} <span><bdi dir="auto">{ws.flags.suspendedReason}</bdi></span>
        </p>
      ) : null}

      <Section id="ws-summary" title={t("detail.summary")}>
        <Facts
          items={[
            { label: t("detail.country"), value: names.country(ws.country) },
            {
              label: t("detail.currency"),
              value: (
                <span className="inline-flex flex-wrap items-center gap-2">
                  <span>
                    {names.currency(ws.currency)} (<span dir="ltr">{ws.currency}</span>)
                  </span>
                  <Badge size="sm" tone={ws.currencyLocked ? "neutral" : "info"} icon={ws.currencyLocked ? <Lock /> : <LockOpen />}>
                    {ws.currencyLocked ? t("detail.locked") : t("detail.notLocked")}
                  </Badge>
                </span>
              ),
            },
            { label: t("detail.zone"), value: zone },
            { label: t("detail.state"), value: <StatusBadge entity="workspace" state={ws.state} size="sm" /> },
            { label: t("detail.seats"), value: <span className="tabular-nums">{ws.seats}</span> },
            {
              label: t("detail.mrr"),
              value: (
                <span>
                  <Money amount={ws.mrr} currency={ws.currency} /> · <Money amount={ws.mrrUsd} currency="USD" className="text-fg-muted" />
                </span>
              ),
            },
            { label: t("detail.created"), value: <DateText value={ws.createdAt} /> },
          ]}
        />
      </Section>

      {ws.migration ? (
        <Section
          id="ws-migration"
          title={t("detail.migration")}
          actions={
            <Link href="/migrations" className="inline-flex items-center gap-1 text-body-sm font-semibold text-fg-brand hover:underline focus-visible:outline-2 focus-visible:outline-focus">
              {t("detail.reviewMigration")}
              <ArrowRight aria-hidden="true" className="size-4 rtl:-scale-x-100" />
            </Link>
          }
        >
          <p className="text-body-sm text-fg">
            {t("detail.migrationLine", {
              from: `${names.country(ws.migration.from.country)} · ${ws.migration.from.currency}`,
              to: `${names.country(ws.migration.to.country)} · ${ws.migration.to.currency}`,
            })}
          </p>
          {ws.migration.reason ? <p className="text-body-sm text-fg-muted"><bdi dir="auto">{ws.migration.reason}</bdi></p> : null}
        </Section>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="flex min-w-0 flex-col gap-6 xl:col-span-2">
          <Section id="ws-lines" title={t("detail.lines")}>
            {visibleLines.length ? (
              <ul className="grid gap-3 lg:grid-cols-2">
                {visibleLines.map((l) => (
                  <LineCard key={l.id} ws={ws} line={l} editable={editable && ws.state !== "suspended" && ws.state !== "cancelled"} onExtend={() => setExtending(l)} />
                ))}
              </ul>
            ) : (
              <Nothing>{t("detail.noLines")}</Nothing>
            )}
          </Section>

          <Section
            id="ws-invoices"
            title={t("detail.invoices")}
            actions={
              can("billing:edit") ? (
                <Button size="sm" variant="secondary" startIcon={<Plus />} onClick={() => setInvoicing(true)}>
                  {tb("create.open")}
                </Button>
              ) : undefined
            }
          >
            {ws.invoices.length ? (
              <ul className="flex flex-col divide-y divide-line">
                {ws.invoices.map((i) => (
                  <li key={i.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-body-sm">
                    <span className="flex flex-wrap items-center gap-2">
                      {billing ? (
                        <Link href={`/invoices/${i.id}`} dir="ltr" className="font-semibold text-fg hover:underline focus-visible:outline-2 focus-visible:outline-focus">
                          {i.number}
                        </Link>
                      ) : (
                        <span dir="ltr" className="font-semibold text-fg">{i.number}</span>
                      )}
                      <StatusBadge entity="invoice" state={i.state as never} size="sm" />
                    </span>
                    <span className="flex items-center gap-3 text-fg-muted">
                      <DateText value={i.issuedAt} />
                      <Money amount={i.total} currency={i.currency} className="text-fg" />
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <Nothing>{t("detail.noInvoices")}</Nothing>
            )}
          </Section>

          <Section id="ws-members" title={t("detail.members", { count: ws.members.length })}>
            <ul className="flex flex-col divide-y divide-line">
              {ws.members.map((m, i) => (
                <li key={m.email ?? i} className="flex flex-wrap items-center justify-between gap-2 py-2 text-body-sm">
                  <span className="flex min-w-0 flex-col">
                    <bdi dir="auto" className="font-semibold text-fg">{m.name}</bdi>
                    <span dir="ltr" className="truncate text-caption text-fg-subtle">{m.email}</span>
                  </span>
                  <span className="flex flex-wrap items-center gap-2">
                    <Badge size="sm" tone={m.role === "owner" ? "brand" : "neutral"}>{t.has(`role.${m.role}`) ? t(`role.${m.role}`) : m.role}</Badge>
                    {m.status !== "active" ? <Badge size="sm" tone="warning">{t.has(`memberStatus.${m.status}`) ? t(`memberStatus.${m.status}`) : m.status}</Badge> : null}
                    <span className="text-caption text-fg-muted">{m.tools ? m.tools.map(toolName).join(", ") : t("detail.allTools")}</span>
                  </span>
                </li>
              ))}
            </ul>
          </Section>

          <Section id="ws-payment" title={t("detail.paymentMethods")}>
            {ws.paymentMethods.length ? (
              <ul className="flex flex-col divide-y divide-line">
                {ws.paymentMethods.map((p) => (
                  <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-body-sm">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="text-fg">{t.has(`method.${p.kind}`) ? t(`method.${p.kind}`) : p.kind}</span>
                      <span dir="ltr" className="text-fg">
                        {p.brand} •••• {p.last4}
                      </span>
                    </span>
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="text-caption text-fg-muted">
                        {t("detail.expires")} <span dir="ltr">{p.expires}</span>
                      </span>
                      {p.isDefault ? <Badge size="sm" tone="neutral">{t("detail.default")}</Badge> : null}
                      {p.expired ? <Badge size="sm" tone="danger">{t("detail.expired")}</Badge> : null}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <Nothing>{t("detail.noPaymentMethods")}</Nothing>
            )}
          </Section>
        </div>

        <div className="flex min-w-0 flex-col gap-6">
          <Section id="ws-billing" title={t("detail.billing")}>
            {ws.billing ? (
              <Facts
                items={[
                  { label: t("detail.legalName"), value: ws.billing.legalName ? <span><bdi dir="auto">{ws.billing.legalName}</bdi></span> : <span className="text-fg-muted">{t("detail.notGiven")}</span> },
                  { label: t("detail.billingEmail"), value: ws.billing.email ? <span dir="ltr">{ws.billing.email}</span> : <span className="text-fg-muted">{t("detail.notGiven")}</span> },
                  { label: t("detail.address"), value: ws.billing.address ? <span><bdi dir="auto">{ws.billing.address}</bdi></span> : <span className="text-fg-muted">{t("detail.notGiven")}</span> },
                  { label: t("detail.taxId"), value: ws.billing.taxId ? <span dir="ltr">{ws.billing.taxId}</span> : <span className="text-fg-muted">{t("detail.notGiven")}</span> },
                ]}
              />
            ) : (
              <Nothing>{t("detail.notGiven")}</Nothing>
            )}
          </Section>

          <Section id="ws-support" title={t("detail.tickets")}>
            {ws.tickets.length ? (
              <ul className="flex flex-col gap-2">
                {ws.tickets.map((k) => (
                  <li key={k.id} className="flex flex-col gap-1 text-body-sm">
                    <span className="flex flex-wrap items-center gap-2">
                      {can("tickets:view") ? (
                        <Link href={`/tickets/${k.id}`} dir="ltr" className="font-semibold text-fg hover:underline focus-visible:outline-2 focus-visible:outline-focus">
                          {k.number}
                        </Link>
                      ) : (
                        <span dir="ltr" className="font-semibold text-fg">{k.number}</span>
                      )}
                      <AnyStatus entity="support_ticket" state={k.state} />
                    </span>
                    <span className="text-fg-muted"><bdi dir="auto">{k.subject}</bdi></span>
                  </li>
                ))}
              </ul>
            ) : (
              <Nothing>{t("detail.noTickets")}</Nothing>
            )}
          </Section>

          <Section id="ws-requests" title={t("detail.serviceRequests")}>
            {ws.serviceRequests.length ? (
              <ul className="flex flex-col gap-2">
                {ws.serviceRequests.map((r) => (
                  <li key={r.id} className="flex flex-col gap-1 text-body-sm">
                    <span className="flex flex-wrap items-center gap-2">
                      {can("services:view") ? (
                        <Link href={`/service-requests/${r.id}`} dir="ltr" className="font-semibold text-fg hover:underline focus-visible:outline-2 focus-visible:outline-focus">
                          {r.number}
                        </Link>
                      ) : (
                        <span dir="ltr" className="font-semibold text-fg">{r.number}</span>
                      )}
                      <AnyStatus entity="service_request" state={r.state} />
                    </span>
                    <span className="text-fg-muted"><bdi dir="auto">{r.title}</bdi></span>
                  </li>
                ))}
              </ul>
            ) : (
              <Nothing>{t("detail.noRequests")}</Nothing>
            )}
          </Section>

          <Section id="ws-notes" title={t("detail.notes")}>
            {ws.notes.length ? (
              <ol className="flex flex-col gap-2">
                {ws.notes.map((n, i) => (
                  <li key={i} className="border-b border-line pb-2 text-body-sm last:border-0">
                    <p className="text-fg"><bdi dir="auto">{n.text}</bdi></p>
                    <p className="text-caption text-fg-subtle">
                      <DateText value={n.at} time /> · <bdi dir="auto">{nameOf(n.by)}</bdi>
                    </p>
                  </li>
                ))}
              </ol>
            ) : (
              <Nothing>{editable ? t("detail.noNotesEdit") : t("detail.noNotes")}</Nothing>
            )}
          </Section>

          <Section id="ws-audit" title={t("detail.audit")}>
            {ws.audit.length ? (
              <ol className="flex flex-col gap-2">
                {ws.audit.map((a, i) => {
                  const key = a.action.replace(/-/g, "_");
                  return (
                    <li key={i} className="border-b border-line pb-2 text-body-sm last:border-0">
                      <p className="text-fg">
                        {t.has(`audit.${key}`) ? t(`audit.${key}`) : <span dir="ltr">{a.action}</span>}
                        {a.invoice ? (
                          <>
                            {" "}
                            <span dir="ltr">{a.invoice}</span>
                          </>
                        ) : null}
                        {a.days ? <> · {t("detail.days", { count: a.days })}</> : null}
                      </p>
                      {a.reason ? <p className="text-fg-muted"><bdi dir="auto">{a.reason}</bdi></p> : null}
                      <p className="text-caption text-fg-subtle">
                        <DateText value={a.at} time /> · {a.by === "system" ? t("detail.system") : <bdi dir="auto">{a.byName ?? a.by}</bdi>}
                      </p>
                    </li>
                  );
                })}
              </ol>
            ) : (
              <Nothing>{t("detail.noAudit")}</Nothing>
            )}
          </Section>
        </div>
      </div>
      {invoicing ? <NewInvoiceDialog workspaceId={ws.id} onClose={() => setInvoicing(false)} /> : null}
      {extending ? <ExtendTrialDialog workspaceId={ws.id} line={extending} onClose={() => setExtending(null)} /> : null}
    </div>
  );
}
