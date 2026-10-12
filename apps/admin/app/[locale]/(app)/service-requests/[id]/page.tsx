"use client";

import { useState, type ReactNode } from "react";
import { useParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { CheckCircle, FileText, PaperPlaneRight, Pause, Play, UserSwitch, XCircle } from "@phosphor-icons/react";
import { Badge, Button, Card, ConfirmDialog, EmptyState, ErrorState, Field, LoadingState, PageHeader, Select, Textarea, toast, useFormatter } from "@orgtik/ui";
import { RequirePermission } from "@/components/frame/RequirePermission";
import { DeliverDialog } from "@/components/services/DeliverDialog";
import { QuoteDialog } from "@/components/services/QuoteDialog";
import { SrStatus } from "@/components/services/status";
import { AssignDialog, useAssignees } from "@/components/system/AssignDialog";
import { asApiError, usePick } from "@/components/system/kit";
import { useCan } from "@/lib/permissions";
import { statusOf, useMeQuery } from "@/store/api";
import { useRequestWorkspaceQuery, useServiceRequestActionMutation, useServiceRequestQuery, useServiceRequestsQuery, useServicesQuery, type QuoteLine, type SrAction, type SrState } from "@/store/services";
import { PaginatedTable } from "@orgtik/ui/table";

const CAN_QUOTE: SrState[] = ["under_review", "rejected", "expired", "cancelled", "quoted"];
const CAN_CANCEL: SrState[] = ["new", "under_review", "awaiting_payment", "on_hold"];
const MILESTONE_STATES = ["open", "in_progress", "delivered", "done"];

function Section({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <Card className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-title-sm text-fg">
          {title}
        </h2>
        {action}
      </div>
      {children}
    </Card>
  );
}

function RequestDetail({ id }: { id: string }) {
  const t = useTranslations("Services");
  const tc = useTranslations("Common");
  const tn = useTranslations("Nav");
  const locale = useLocale();
  const f = useFormatter();
  const pick = usePick();
  const can = useCan();
  const me = useMeQuery();
  const { data: sr, isLoading, error, refetch } = useServiceRequestQuery(id);
  const services = useServicesQuery();
  const known = useServiceRequestsQuery({ pageSize: 100 });
  const ws = useRequestWorkspaceQuery(sr?.workspaceId ?? "", { skip: !sr || Boolean(sr.quote) || !can("workspaces:view") });
  const [act, acting] = useServiceRequestActionMutation();
  const [dialog, setDialog] = useState<"quote" | "deliver" | "assign" | null>(null);
  const [problem, setProblem] = useState<string | undefined>();
  const [message, setMessage] = useState("");
  const { people, partial } = useAssignees(
    ["service_mgr", "service_team", "super_admin"],
    (known.data?.items ?? []).filter((r) => r.assignee).map((r) => ({ key: r.assignee!, name: r.assigneeName ?? r.assignee! })),
  );

  if (isLoading) return <LoadingState rows={6} label={tc("loading")} />;
  if (statusOf(error) === 404) return <EmptyState size="page" titleAs="h1" title={t("detail.notFound")} description={t("detail.notFoundBody")} />;
  if (error || !sr) return <ErrorState size="page" titleAs="h1" title={tc("loadFailed")} description={tc("loadFailedBody")} onRetry={() => refetch()} />;

  const service = services.data?.find((s) => s.id === sr.serviceId);
  const myKey = me.data?.user.key;
  const full = can("services:edit");
  const mineOnly = !full && can("services:edit:assigned");
  const canAct = full || (mineOnly && sr.assignee === myKey);
  const currency = sr.quote?.currency ?? ws.data?.currency ?? null;
  const authorName = (key: string, by: string) => (by === "customer" ? t("detail.customer") : key === sr.assignee && sr.assigneeName ? sr.assigneeName : key === myKey && me.data ? `${me.data.user.firstName} ${me.data.user.lastName}` : t("detail.staff"));

  const run = (body: SrAction, done: string, close = true) => {
    setProblem(undefined);
    return act({ id: sr.id, body })
      .unwrap()
      .then(() => {
        toast.success(done);
        if (close) setDialog(null);
      })
      .catch((x) => {
        const a = asApiError(x);
        const msg = a.status === 409 ? tc("wrongState") : a.status === 403 ? t("detail.notYours") : a.status === 422 ? t("detail.invalid") : tc("saveFailed");
        setProblem(msg);
        if (a.status === 409) refetch();
        throw x;
      });
  };
  const quiet = (p: Promise<unknown>) => p.catch(() => undefined);

  const next: ReactNode[] = [];
  if (canAct) {
    if (sr.state === "new") next.push(<Button key="review" startIcon={<CheckCircle />} loading={acting.isLoading} onClick={() => quiet(run({ action: "review" }, t("detail.reviewed")))}>{t("detail.review")}</Button>);
    if (CAN_QUOTE.includes(sr.state)) next.push(<Button key="quote" variant={sr.state === "quoted" ? "secondary" : "primary"} startIcon={<FileText />} onClick={() => setDialog("quote")}>{sr.state === "quoted" ? t("detail.revise") : t("detail.quote")}</Button>);
    if (sr.state === "awaiting_payment" || sr.state === "on_hold") next.push(<Button key="start" startIcon={<Play />} loading={acting.isLoading} onClick={() => quiet(run({ action: "start" }, t("detail.started")))}>{sr.state === "on_hold" ? t("detail.resume") : t("detail.start")}</Button>);
    if (sr.state === "in_progress") {
      next.push(<Button key="deliver" startIcon={<PaperPlaneRight className="rtl:-scale-x-100" />} onClick={() => setDialog("deliver")}>{t("detail.deliver")}</Button>);
      next.push(<Button key="hold" variant="secondary" startIcon={<Pause />} loading={acting.isLoading} onClick={() => quiet(run({ action: "hold" }, t("detail.held")))}>{t("detail.hold")}</Button>);
    }
    if (CAN_CANCEL.includes(sr.state))
      next.push(
        <ConfirmDialog
          key="cancel"
          trigger={<Button variant="ghost" startIcon={<XCircle />}>{t("detail.cancel")}</Button>}
          tone="danger"
          title={t("detail.cancelTitle", { number: sr.number })}
          impact={t("detail.cancelImpact", { workspace: sr.workspace ?? sr.workspaceId })}
          confirmLabel={t("detail.cancelConfirm")}
          reason={{ label: tc("reason"), required: true }}
          onConfirm={({ reason }) => run({ action: "cancel", reason }, t("detail.cancelled"))}
        />,
      );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        breadcrumb={[{ label: tn("serviceRequests"), href: `/${locale}/service-requests` }, { label: sr.number }]}
        title={<span dir="auto">{sr.title}</span>}
        status={<SrStatus state={sr.state} />}
        description={
          <span>
            <span dir="ltr">{sr.number}</span> · <bdi dir="auto">{sr.workspace ?? sr.workspaceId}</bdi> · {pick(sr.service)}
          </span>
        }
        actions={next.length ? <div className="flex flex-wrap gap-2">{next}</div> : null}
      />
      {problem && !dialog ? (
        <p role="alert" className="rounded-card border border-line bg-danger-subtle p-3 text-body-sm text-fg">
          {problem}
        </p>
      ) : null}
      {!canAct ? (
        <p className="rounded-card border border-line bg-sunken p-3 text-body-sm text-fg-muted">{mineOnly ? (sr.assigneeName ? t("detail.othersRequest", { name: sr.assigneeName }) : t("detail.unassignedTeam")) : tc("viewOnly")}</p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-6">
          <Section title={t("detail.brief")}>
            <p dir="auto" className="whitespace-pre-line text-body text-fg">
              {sr.brief || t("detail.noBrief")}
            </p>
            {sr.budget || sr.deadline ? (
              <dl className="grid gap-3 sm:grid-cols-2">
                {sr.budget ? (
                  <div>
                    <dt className="text-caption text-fg-muted">{t("detail.budget")}</dt>
                    <dd dir="auto" className="text-body text-fg">{sr.budget}</dd>
                  </div>
                ) : null}
                {sr.deadline ? (
                  <div>
                    <dt className="text-caption text-fg-muted">{t("detail.deadline")}</dt>
                    <dd className="text-body text-fg">{f.date(sr.deadline, { dateStyle: "medium" })}</dd>
                  </div>
                ) : null}
              </dl>
            ) : null}
          </Section>

          <Section title={t("detail.quoteTitle")}>
            {sr.quote ? (
              <div className="flex flex-col gap-3">
                <PaginatedTable><table className="w-full text-body-sm">
                  <caption className="sr-only">{t("detail.quoteTitle")}</caption>
                  <thead>
                    <tr className="border-b border-line text-fg-muted">
                      <th scope="col" className="py-2 text-start font-medium">{t("quote.item")}</th>
                      <th scope="col" className="py-2 text-end font-medium">{t("quote.amountCol", { currency: sr.quote.currency })}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sr.quote.lines.map((l, i) => (
                      <tr key={i} className="border-b border-line">
                        <td dir="auto" className={`py-2 ${l.amount < 0 ? "text-fg-muted" : "text-fg"}`}>{l.label}</td>
                        <td dir="ltr" className="py-2 text-end tabular-nums text-fg">{f.money(l.amount, sr.quote!.currency)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <th scope="row" className="py-2 text-start font-medium text-fg">{t("quote.total")}</th>
                      <td dir="ltr" className="py-2 text-end font-medium tabular-nums text-fg">{f.money(sr.quote.total, sr.quote.currency)}</td>
                    </tr>
                  </tfoot>
                </table></PaginatedTable>
                <p className="text-body-sm text-fg-muted">{t("detail.quoteMeta", { sent: f.date(sr.quote.sentAt, { dateStyle: "medium" }), until: f.date(sr.quote.validUntil, { dateStyle: "medium" }) })}</p>
              </div>
            ) : (
              <p className="text-body-sm text-fg-muted">{t("detail.noQuote")}</p>
            )}
          </Section>

          <Section title={t("detail.milestones")}>
            {sr.milestones.length ? (
              <ol className="flex flex-col divide-y divide-line">
                {sr.milestones.map((m, i) => (
                  <li key={i} className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span dir="auto" className="text-body text-fg">{m.title}</span>
                      {m.due ? <span className="text-caption text-fg-subtle">{t("detail.due", { date: f.date(m.due, { dateStyle: "medium" }) })}</span> : null}
                    </span>
                    {canAct ? (
                      <Select
                        aria-label={t("detail.milestoneState", { title: m.title })}
                        className="w-44"
                        size="sm"
                        value={MILESTONE_STATES.includes(m.state) ? m.state : null}
                        onValueChange={(v) => v && v !== m.state && quiet(run({ action: "milestone", index: i, state: v }, t("detail.milestoneSaved", { title: m.title })))}
                        options={MILESTONE_STATES.map((s) => ({ value: s, label: t(`detail.milestoneStates.${s}`) }))}
                      />
                    ) : (
                      <Badge size="sm" tone={m.state === "done" ? "success" : m.state === "delivered" ? "info" : "neutral"}>
                        {MILESTONE_STATES.includes(m.state) ? t(`detail.milestoneStates.${m.state}`) : m.state}
                      </Badge>
                    )}
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-body-sm text-fg-muted">{t("detail.noMilestones")}</p>
            )}
          </Section>

          <Section title={t("detail.deliveries")}>
            {sr.deliveries.length ? (
              <ol className="flex flex-col gap-3">
                {sr.deliveries.map((d) => {
                  const pending = sr.state === "in_review" && Date.parse(d.autoApproveAt) > Date.now();
                  return (
                    <li key={d.id} className="flex flex-col gap-2 rounded-card border border-line p-4">
                      <span className="text-caption text-fg-subtle">{t("detail.deliveredOn", { date: f.date(d.at, { dateStyle: "medium" }) })}</span>
                      <p dir="auto" className="whitespace-pre-line text-body text-fg">{d.note}</p>
                      {d.files.length ? (
                        <ul aria-label={t("deliver.files")} className="flex flex-wrap gap-2">
                          {d.files.map((file) => (
                            <li key={file}>
                              <Badge size="sm" emphasis="outline" icon={<FileText />}>
                                <span dir="ltr">{file}</span>
                              </Badge>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                      <p className={`text-body-sm ${pending ? "text-fg" : "text-fg-muted"}`}>{pending ? t("detail.autoApproveOn", { date: f.date(d.autoApproveAt, { dateStyle: "medium" }) }) : t("detail.autoApproveWas", { date: f.date(d.autoApproveAt, { dateStyle: "medium" }) })}</p>
                    </li>
                  );
                })}
              </ol>
            ) : (
              <p className="text-body-sm text-fg-muted">{t("detail.noDeliveries")}</p>
            )}
          </Section>

          <Section title={t("detail.messages")}>
            {sr.messages.length ? (
              <ol className="flex flex-col gap-3">
                {sr.messages.map((m, i) => (
                  <li key={i} className={`flex flex-col gap-1 rounded-card p-3 ${m.by === "staff" ? "bg-brand-subtle" : "bg-sunken"}`}>
                    <span className="text-caption text-fg-muted">
                      <bdi dir="auto">{authorName(m.author, m.by)}</bdi> · {f.date(m.at, { dateStyle: "medium", timeStyle: "short" })}
                    </span>
                    <p dir="auto" className="whitespace-pre-line text-body text-fg">{m.text}</p>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-body-sm text-fg-muted">{t("detail.noMessages")}</p>
            )}
            {canAct ? (
              <form
                className="flex flex-col gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (message.trim()) quiet(run({ action: "message", text: message.trim() }, t("detail.messageSent")).then(() => setMessage("")));
                }}
              >
                <Field label={t("detail.writeMessage")} description={t("detail.writeMessageHelp")}>
                  <Textarea dir="auto" value={message} onChange={(e) => setMessage(e.target.value)} maxRows={6} />
                </Field>
                <div>
                  <Button type="submit" variant="secondary" disabled={!message.trim()} loading={acting.isLoading}>
                    {t("detail.send")}
                  </Button>
                </div>
              </form>
            ) : null}
          </Section>
        </div>

        <aside aria-label={t("detail.about")} className="flex flex-col gap-6">
          <Card className="flex flex-col gap-4">
            <h2 className="font-display text-title-sm text-fg">{t("detail.about")}</h2>
            <dl className="flex flex-col gap-3 text-body-sm">
              <div>
                <dt className="text-fg-muted">{t("requests.workspace")}</dt>
                <dd className="text-fg"><bdi dir="auto">{sr.workspace ?? sr.workspaceId}</bdi></dd>
              </div>
              <div>
                <dt className="text-fg-muted">{t("detail.service")}</dt>
                <dd dir="auto" className="text-fg">{pick(sr.service)}</dd>
              </div>
              <div>
                <dt className="text-fg-muted">{t("requests.assignee")}</dt>
                <dd className="flex flex-wrap items-center gap-2 text-fg">
                  {sr.assigneeName ? <bdi dir="auto">{sr.assigneeName}</bdi> : <span className="text-fg-subtle">{t("requests.unassigned")}</span>}
                  {canAct ? (
                    <Button size="sm" variant="ghost" startIcon={<UserSwitch />} onClick={() => setDialog("assign")}>
                      {sr.assignee ? t("detail.reassign") : t("detail.assign")}
                    </Button>
                  ) : null}
                </dd>
              </div>
              <div>
                <dt className="text-fg-muted">{t("requests.created")}</dt>
                <dd className="text-fg">{f.date(sr.createdAt, { dateStyle: "medium" })}</dd>
              </div>
              {service ? (
                <div>
                  <dt className="text-fg-muted">{t("catalogue.subscriberDiscount")}</dt>
                  <dd className="text-fg">{f.percent(service.subscriberDiscountPct / 100)}</dd>
                </div>
              ) : null}
            </dl>
          </Card>
        </aside>
      </div>

      {dialog === "quote" ? (
        <QuoteDialog
          request={sr}
          serviceName={service ? pick(service.name) : pick(sr.service)}
          currency={currency}
          discountPct={service?.subscriberDiscountPct ?? 0}
          busy={acting.isLoading}
          error={problem}
          onSend={(lines: QuoteLine[], validDays: number) => quiet(run({ action: "quote", lines, validDays }, t("detail.quoted", { number: sr.number })))}
          onClose={() => {
            setDialog(null);
            setProblem(undefined);
          }}
        />
      ) : null}
      {dialog === "deliver" ? (
        <DeliverDialog number={sr.number} busy={acting.isLoading} error={problem} onDeliver={(note, files) => quiet(run({ action: "deliver", note, files }, t("detail.delivered")))} onClose={() => { setDialog(null); setProblem(undefined); }} />
      ) : null}
      {dialog === "assign" ? (
        <AssignDialog
          title={t("detail.assignTitle", { number: sr.number })}
          current={sr.assignee}
          people={people}
          partial={partial}
          busy={acting.isLoading}
          error={problem}
          onAssign={(key) => quiet(run({ action: "assign", assignee: key }, t("detail.assigned", { name: people.find((p) => p.key === key)?.name ?? key })))}
          onClose={() => { setDialog(null); setProblem(undefined); }}
        />
      ) : null}
    </div>
  );
}

export default function ServiceRequestPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <RequirePermission permission="services:view">
      <RequestDetail id={id} />
    </RequirePermission>
  );
}
