"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Archive, CheckCircle, LockSimple, UserSwitch } from "@phosphor-icons/react";
import { Badge, Button, Card, Checkbox, ConfirmDialog, EmptyState, ErrorState, Field, LoadingState, PageHeader, Select, Textarea, toast, useFormatter } from "@orgtik/ui";
import { RequirePermission } from "@/components/frame/RequirePermission";
import { PRIORITIES, TicketStatus } from "@/components/support/status";
import { AssignDialog, useAssignees } from "@/components/system/AssignDialog";
import { asApiError } from "@/components/system/kit";
import { useCan } from "@/lib/permissions";
import { statusOf } from "@/store/api";
import { useTicketActionMutation, useTicketQuery, useTicketsQuery, type TicketAction } from "@/store/support";

const CATEGORIES = ["billing", "sales", "product", "technical"];

function TicketDetail({ id }: { id: string }) {
  const t = useTranslations("Support");
  const tc = useTranslations("Common");
  const tn = useTranslations("Nav");
  const locale = useLocale();
  const f = useFormatter();
  const can = useCan();
  const editable = can("tickets:edit");
  const { data: tk, isLoading, error, refetch } = useTicketQuery(id);
  const known = useTicketsQuery({ pageSize: 100 });
  const [act, acting] = useTicketActionMutation();
  const [text, setText] = useState("");
  const [internal, setInternal] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [problem, setProblem] = useState<string | undefined>();
  const { people, partial } = useAssignees(
    ["support", "sales", "super_admin"],
    (known.data?.items ?? []).filter((x) => x.assignee).map((x) => ({ key: x.assignee!, name: x.assigneeName ?? x.assignee! })),
  );

  if (isLoading) return <LoadingState rows={6} label={tc("loading")} />;
  if (statusOf(error) === 404) return <EmptyState size="page" titleAs="h1" title={t("detail.notFound")} description={t("detail.notFoundBody")} />;
  if (error || !tk) return <ErrorState size="page" titleAs="h1" title={tc("loadFailed")} description={tc("loadFailedBody")} onRetry={() => refetch()} />;

  const closed = tk.state === "closed";
  const run = (body: TicketAction, done: string) => {
    setProblem(undefined);
    return act({ id: tk.id, body })
      .unwrap()
      .then(() => toast.success(done))
      .catch((x) => {
        const a = asApiError(x);
        setProblem(a.status === 409 ? tc("wrongState") : a.status === 403 ? tc("forbidden") : a.status === 422 ? t("detail.writeFirst") : tc("saveFailed"));
        throw x;
      });
  };
  const quiet = (p: Promise<unknown>) => p.catch(() => undefined);
  const reply = (waitForCustomer: boolean) =>
    quiet(
      run({ action: "reply", text: text.trim(), internal, waitForCustomer: !internal && waitForCustomer }, internal ? t("detail.noteAdded") : waitForCustomer ? t("detail.sentWaiting") : t("detail.sent")).then(() => {
        setText("");
        setInternal(false);
      }),
    );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        breadcrumb={[{ label: tn("tickets"), href: `/${locale}/tickets` }, { label: tk.number }]}
        title={<span dir="auto">{tk.subject}</span>}
        status={<TicketStatus state={tk.state} />}
        description={
          <span>
            <span dir="ltr">{tk.number}</span> · <bdi dir="auto">{tk.workspace ?? tk.workspaceId}</bdi> · {CATEGORIES.includes(tk.category) ? t(`categories.${tk.category}`) : tk.category}
          </span>
        }
        actions={
          editable && !closed ? (
            <div className="flex flex-wrap gap-2">
              {tk.state !== "resolved" ? (
                <ConfirmDialog
                  trigger={<Button variant="secondary" startIcon={<CheckCircle />}>{t("detail.resolve")}</Button>}
                  tone="primary"
                  title={t("detail.resolveTitle", { number: tk.number })}
                  impact={t("detail.resolveImpact")}
                  confirmLabel={t("detail.resolve")}
                  onConfirm={() => run({ action: "resolve" }, t("detail.resolved"))}
                />
              ) : null}
              <ConfirmDialog
                trigger={<Button variant="ghost" startIcon={<Archive />}>{t("detail.close")}</Button>}
                tone="danger"
                title={t("detail.closeTitle", { number: tk.number })}
                impact={t("detail.closeImpact")}
                confirmLabel={t("detail.close")}
                onConfirm={() => run({ action: "close" }, t("detail.closed"))}
              />
            </div>
          ) : null
        }
      />
      {problem ? (
        <p role="alert" className="rounded-card border border-line bg-danger-subtle p-3 text-body-sm text-fg">
          {problem}
        </p>
      ) : null}
      {!editable ? <p className="rounded-card border border-line bg-sunken p-3 text-body-sm text-fg-muted">{tc("viewOnly")}</p> : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Card className="flex min-w-0 flex-col gap-4">
          <h2 className="font-display text-title-sm text-fg">{t("detail.conversation")}</h2>
          <ol aria-label={t("detail.conversation")} className="flex flex-col gap-3">
            {tk.messages.map((m, i) => (
              <li
                key={i}
                className={`flex flex-col gap-1 rounded-card p-3 ${m.internal ? "border border-dashed border-line-strong bg-warning-subtle" : m.by === "staff" ? "bg-brand-subtle" : "border border-line bg-raised"}`}
              >
                <span className="flex flex-wrap items-center gap-2 text-caption text-fg-muted">
                  <bdi dir="auto" className="font-medium text-fg">
                    {m.authorName ?? m.author}
                  </bdi>
                  <span>{m.by === "staff" ? t("detail.staff") : t("detail.customer")}</span>
                  <span>· {f.date(m.at, { dateStyle: "medium", timeStyle: "short" })}</span>
                  {m.internal ? (
                    <Badge size="sm" tone="warning" icon={<LockSimple />}>
                      {t("detail.internalBadge")}
                    </Badge>
                  ) : null}
                </span>
                <p dir="auto" className="whitespace-pre-line text-body text-fg">
                  {m.text}
                </p>
              </li>
            ))}
          </ol>
          {editable && !closed ? (
            <form
              className={`flex flex-col gap-3 rounded-card border p-3 ${internal ? "border-dashed border-line-strong bg-warning-subtle" : "border-line"}`}
              onSubmit={(e) => {
                e.preventDefault();
                if (text.trim()) reply(false);
              }}
            >
              <Field label={internal ? t("detail.noteLabel") : t("detail.replyLabel")} description={internal ? t("detail.noteHelp") : t("detail.replyHelp")}>
                <Textarea dir="auto" value={text} onChange={(e) => setText(e.target.value)} maxRows={8} />
              </Field>
              <Checkbox checked={internal} onCheckedChange={(v) => setInternal(Boolean(v))} label={t("detail.internal")} description={t("detail.internalHelp")} />
              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={!text.trim()} loading={acting.isLoading} startIcon={internal ? <LockSimple /> : undefined}>
                  {internal ? t("detail.addNote") : t("detail.send")}
                </Button>
                {!internal ? (
                  <Button type="button" variant="secondary" disabled={!text.trim()} loading={acting.isLoading} onClick={() => reply(true)}>
                    {t("detail.sendWait")}
                  </Button>
                ) : null}
              </div>
            </form>
          ) : closed ? (
            <p className="text-body-sm text-fg-muted">{t("detail.closedBody")}</p>
          ) : null}
        </Card>

        <aside aria-label={t("detail.about")} className="flex flex-col gap-6">
          <Card className="flex flex-col gap-4">
            <h2 className="font-display text-title-sm text-fg">{t("detail.about")}</h2>
            <dl className="flex flex-col gap-3 text-body-sm">
              <div>
                <dt className="text-fg-muted">{t("list.assignee")}</dt>
                <dd className="flex flex-wrap items-center gap-2 text-fg">
                  {tk.assigneeName ? <bdi dir="auto">{tk.assigneeName}</bdi> : <span className="text-fg-subtle">{t("list.unassigned")}</span>}
                  {editable && !closed ? (
                    <Button size="sm" variant="ghost" startIcon={<UserSwitch />} onClick={() => setAssigning(true)}>
                      {tk.assignee ? t("detail.reassign") : t("detail.assign")}
                    </Button>
                  ) : null}
                </dd>
              </div>
              <div>
                <dt className="text-fg-muted">{t("list.priority")}</dt>
                <dd className="text-fg">
                  {editable && !closed ? (
                    <Select
                      aria-label={t("list.priority")}
                      size="sm"
                      className="w-40"
                      value={tk.priority}
                      onValueChange={(v) => v && v !== tk.priority && quiet(run({ action: "priority", priority: v }, t("detail.prioritySaved", { priority: t(`priorities.${v}`) })))}
                      options={PRIORITIES.map((p) => ({ value: p, label: t(`priorities.${p}`) }))}
                    />
                  ) : (
                    t(`priorities.${(PRIORITIES as readonly string[]).includes(tk.priority) ? tk.priority : "normal"}`)
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-fg-muted">{t("detail.opened")}</dt>
                <dd className="text-fg">{f.date(tk.createdAt, { dateStyle: "medium" })}</dd>
              </div>
              {tk.state === "waiting_for_you" && tk.autoCloseAt ? (
                <div>
                  <dt className="text-fg-muted">{t("detail.autoClose")}</dt>
                  <dd className="text-fg">{f.date(tk.autoCloseAt, { dateStyle: "medium" })}</dd>
                </div>
              ) : null}
              {tk.state === "resolved" && tk.reopenUntil ? (
                <div>
                  <dt className="text-fg-muted">{t("detail.reopenUntil")}</dt>
                  <dd className="text-fg">{f.date(tk.reopenUntil, { dateStyle: "medium" })}</dd>
                </div>
              ) : null}
            </dl>
          </Card>
        </aside>
      </div>

      {assigning ? (
        <AssignDialog
          title={t("detail.assignTitle", { number: tk.number })}
          current={tk.assignee}
          people={people}
          partial={partial}
          busy={acting.isLoading}
          error={problem}
          onAssign={(key) => quiet(run({ action: "assign", assignee: key }, t("detail.assigned", { name: people.find((p) => p.key === key)?.name ?? key })).then(() => setAssigning(false)))}
          onClose={() => setAssigning(false)}
        />
      ) : null}
    </div>
  );
}

export default function TicketPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <RequirePermission permission="tickets:view">
      <TicketDetail id={id} />
    </RequirePermission>
  );
}
