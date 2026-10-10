"use client";
// One service request (USR-18/19, spec 05): its state, the quote with its validity, milestones,
// deliveries (approved by themselves after the setting's days, G-30) and the conversation with
// OrgTik. What can be done depends on the state and the role: accepting, paying and declining a
// quote are the owner's (they're payments); approving a delivery, asking for revisions and
// cancelling before work starts are the owner's and admins'; everyone here can write.
import { useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { CheckCircle, CreditCard, FileText, PencilSimpleLine, X } from "@phosphor-icons/react";
import { Badge, Button, Card, ConfirmDialog, Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, ErrorState, Field, LoadingState, PageHeader, StatusBadge, Textarea, toast, useFormatter } from "@orgtik/ui";
import useWorkspace from "@/hooks/use-workspace";
import { ButtonLink } from "@/components/shared/ButtonLink";
import { statusOf, type AppMe } from "@/redux/features/platform/platformApi";
import { useGetServiceRequestQuery, useServiceRequestActionMutation, type RequestAction, type ServiceRequest } from "@/redux/features/platform/services";
import { useGetTeamQuery } from "@/redux/features/platform/team";
import { useLocalized, usePlatformProblem } from "@/components/workspace/account/problems";
import { Notice } from "@/components/workspace/account/Notice";
import { Composer, Thread } from "@/components/workspace/support/Thread";
import { cancellable, quoteExpired, requestBadge } from "./status";
import { API_URL } from "@/constants/env";
import { readClientSession } from "@orgtik/ui/auth";
import { PaginatedTable } from "@orgtik/ui/table";

type Dialogs = "accept" | "pay" | "decline" | "approve" | "revise" | "cancel" | null;
type Problem = { text: string; kind?: "payment" | "card" } | null;

export function RequestDetail() {
  const t = useTranslations("Services.detail");
  const ts = useTranslations("Services");
  const { id } = useParams<{ id: string }>();
  const ws = useWorkspace();
  const me = ws.me as AppMe;
  const { data: r, isLoading, error, refetch } = useGetServiceRequestQuery(id);
  const [act] = useServiceRequestActionMutation();
  const problemOf = usePlatformProblem();
  const [open, setOpen] = useState<Dialogs>(null);
  const [problem, setProblem] = useState<Problem>(null);
  const [messageError, setMessageError] = useState<string | null>(null);

  const crumbs = [
    { label: ts("title"), href: "/services" },
    { label: ts("requests.title"), href: "/services/requests" },
  ];
  if (isLoading) return <LoadingState rows={6} />;
  if (error || !r) {
    const missing = statusOf(error) === 404;
    return (
      <ErrorState
        titleAs="h1"
        title={missing ? t("missingTitle") : t("failedTitle")}
        description={missing ? t("missingBody", { name: me.workspace.name }) : t("failedBody")}
        onRetry={missing ? undefined : refetch}
        action={<ButtonLink href="/services/requests">{t("toRequests")}</ButtonLink>}
      />
    );
  }

  // Runs an action; a refusal is said on the page (with the way forward), the dialog closes.
  const run = async (body: RequestAction, done: string) => {
    setProblem(null);
    try {
      await act({ id: r.id, ...body } as { id: string } & RequestAction).unwrap();
      toast.success(done);
    } catch (e) {
      const err = e as { status?: number; code?: string; fieldErrors?: Record<string, string> };
      if (err.status === 402) setProblem({ text: t("errors.paymentFailed"), kind: "payment" });
      else if (err.status === 422 && err.fieldErrors?.paymentMethodId) setProblem({ text: t("errors.noCard"), kind: "card" });
      else if (err.code === "expired") setProblem({ text: t("errors.expired") });
      else if (err.status === 403) setProblem({ text: t("errors.ownerOnly") });
      else setProblem({ text: problemOf(e) });
    }
  };

  const total = r.quote ? <Money amount={r.quote.total} currency={r.quote.currency} /> : null;
  const canDecide = ws.isOwner;
  const canManage = ws.isAdmin;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={<bdi dir="auto">{r.title}</bdi>}
        breadcrumb={[...crumbs, { label: <span dir="ltr">{r.number}</span> }]}
        status={<StatusBadge entity="service_request" state={requestBadge(r.state)} viewer="customer" />}
        actions={
          canManage && cancellable(r) ? (
            <Button variant="secondary" startIcon={<X />} onClick={() => setOpen("cancel")}>
              {t("cancel")}
            </Button>
          ) : null
        }
      />
      {problem ? (
        <Notice
          tone="danger"
          action={
            problem.kind ? (
              <ButtonLink href="/billing/payment-methods" variant="secondary">
                {t("toPaymentMethods")}
              </ButtonLink>
            ) : undefined
          }
        >
          {problem.text}
        </Notice>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-6">
          {r.quote ? <QuoteCard r={r} canDecide={canDecide} onOpen={setOpen} /> : <AwaitingQuote r={r} />}
          {r.deliveries.length ? <Deliveries r={r} canManage={canManage} onOpen={setOpen} /> : null}
          <Card className="flex flex-col gap-4" id="messages">
            <h2 className="font-display text-title-sm text-fg">{t("messages")}</h2>
            <Messages r={r} me={me} />
            <Composer
              label={t("messageLabel")}
              submitLabel={t("send")}
              note={t("messageNote")}
              error={messageError}
              onSend={async (text) => {
                setMessageError(null);
                try {
                  await act({ id: r.id, action: "message", text }).unwrap();
                } catch (e) {
                  setMessageError(problemOf(e));
                  throw e;
                }
              }}
            />
          </Card>
        </div>
        <div className="flex min-w-0 flex-col gap-6">
          <Summary r={r} />
          {r.milestones.length ? <Milestones r={r} /> : null}
        </div>
      </div>

      <ConfirmDialog
        open={open === "accept"}
        onOpenChange={(o) => !o && setOpen(null)}
        title={t("acceptTitle", { number: r.number })}
        impact={t.rich("acceptImpact", { total: () => total })}
        confirmLabel={t("accept")}
        tone="primary"
        onConfirm={() => run({ action: "accept" }, t("accepted"))}
      />
      <ConfirmDialog
        open={open === "pay"}
        onOpenChange={(o) => !o && setOpen(null)}
        title={t.rich("payTitle", { total: () => total })}
        impact={t("payImpact")}
        confirmLabel={t("pay")}
        tone="primary"
        onConfirm={() => run({ action: "pay" }, t("paid"))}
      />
      <ConfirmDialog
        open={open === "decline"}
        onOpenChange={(o) => !o && setOpen(null)}
        title={t("declineTitle", { number: r.number })}
        impact={t("declineImpact")}
        confirmLabel={t("decline")}
        tone="danger"
        reason={{ label: t("declineReason") }}
        onConfirm={({ reason }) => run({ action: "decline", reason: reason.trim() || undefined }, t("declined"))}
      />
      <ConfirmDialog
        open={open === "approve"}
        onOpenChange={(o) => !o && setOpen(null)}
        title={t("approveTitle")}
        impact={t("approveImpact")}
        confirmLabel={t("approve")}
        tone="primary"
        onConfirm={() => run({ action: "approve" }, t("approved"))}
      />
      <ConfirmDialog
        open={open === "cancel"}
        onOpenChange={(o) => !o && setOpen(null)}
        title={t("cancelTitle", { number: r.number })}
        impact={t("cancelImpact")}
        confirmLabel={t("cancel")}
        cancelLabel={t("keep")}
        tone="danger"
        onConfirm={() => run({ action: "cancel" }, t("cancelled"))}
      />
      <ReviseDialog open={open === "revise"} onOpenChange={(o) => !o && setOpen(null)} onSend={(text) => run({ action: "revise", text }, t("revisionAsked"))} />
    </div>
  );
}

function Money({ amount, currency }: { amount: number; currency: string }) {
  const f = useFormatter();
  return (
    <span dir="ltr" className="tabular-nums">
      {f.money(amount, currency)}
    </span>
  );
}

function AwaitingQuote({ r }: { r: ServiceRequest }) {
  const t = useTranslations("Services.detail");
  if (r.state === "cancelled") return <Notice tone="info">{t("cancelledNote")}</Notice>;
  return (
    <Card className="flex flex-col gap-2">
      <h2 className="font-display text-title-sm text-fg">{t("quote")}</h2>
      <p className="text-body-sm text-fg-muted">{t("noQuoteYet")}</p>
    </Card>
  );
}

function QuoteCard({ r, canDecide, onOpen }: { r: ServiceRequest; canDecide: boolean; onOpen: (d: Dialogs) => void }) {
  const t = useTranslations("Services.detail");
  const f = useFormatter();
  const q = r.quote!;
  const expired = quoteExpired(r);
  const total = <Money amount={q.total} currency={q.currency} />;
  return (
    <Card className="flex flex-col gap-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-title-sm text-fg">{t("quote")}</h2>
        <p className={expired ? "text-body-sm font-semibold text-danger" : "text-body-sm text-fg-muted"}>
          {expired ? t("expiredOn", { date: f.date(q.validUntil, { dateStyle: "medium" }) }) : t("validUntil", { date: f.date(q.validUntil, { dateStyle: "medium" }) })}
        </p>
      </div>
      <PaginatedTable><table className="w-full text-body-sm">
        <caption className="sr-only">{t("quoteLines")}</caption>
        <thead>
          <tr className="border-b border-line text-fg-muted">
            <th scope="col" className="py-2 text-start font-normal">
              {t("item")}
            </th>
            <th scope="col" className="py-2 text-end font-normal">
              {t("amount")}
            </th>
          </tr>
        </thead>
        <tbody>
          {q.lines.map((l, i) => (
            <tr key={i} className="border-b border-line">
              <td dir="auto" className="py-2 text-start text-fg">
                {l.label}
              </td>
              <td className="py-2 text-end">
                <Money amount={l.amount} currency={q.currency} />
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <th scope="row" className="pt-3 text-start font-semibold text-fg">
              {t("total")}
            </th>
            <td className="pt-3 text-end font-display text-title-sm text-fg">{total}</td>
          </tr>
        </tfoot>
      </table></PaginatedTable>

      {expired ? (
        <Notice
          tone="warning"
          title={t("expiredTitle")}
          action={
            <a href="#messages" className="text-body-sm font-semibold text-fg underline underline-offset-2">
              {t("askNewQuote")}
            </a>
          }
        >
          {t("expiredBody")}
        </Notice>
      ) : r.state === "quoted" ? (
        canDecide ? (
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="secondary" onClick={() => onOpen("decline")}>
              {t("decline")}
            </Button>
            <Button variant="primary" startIcon={<CheckCircle />} onClick={() => onOpen("accept")}>
              {t("accept")}
            </Button>
          </div>
        ) : (
          <Notice tone="info">{t("ownerDecides")}</Notice>
        )
      ) : r.state === "awaiting_payment" ? (
        canDecide ? (
          <Notice
            tone="warning"
            title={t("toPayTitle")}
            action={
              <Button variant="primary" startIcon={<CreditCard />} onClick={() => onOpen("pay")}>
                {t("payAmount")}
              </Button>
            }
          >
            {t.rich("toPayBody", { total: () => total })}
          </Notice>
        ) : (
          <Notice tone="info">{t("ownerPays")}</Notice>
        )
      ) : r.state === "rejected" ? (
        <Notice tone="info" title={t("declinedTitle")}>
          {r.declineReason ? <span dir="auto">{r.declineReason}</span> : t("declinedBody")}
        </Notice>
      ) : r.invoiceId || ["in_progress", "in_review", "completed", "on_hold"].includes(r.state) ? (
        <p className="flex items-center gap-2 text-body-sm text-success">
          <CheckCircle aria-hidden="true" weight="fill" />
          {t("quotePaid")}
        </p>
      ) : null}
    </Card>
  );
}

function Deliveries({ r, canManage, onOpen }: { r: ServiceRequest; canManage: boolean; onOpen: (d: Dialogs) => void }) {
  const t = useTranslations("Services.detail");
  const f = useFormatter();
  const day = (d?: string) => (d ? f.date(d, { dateStyle: "medium" }) : "");
  const tv = useTranslations("AccountV3");
  const [downloadError, setDownloadError] = useState(false);
  const download = async (file: { name: string; contentPath?: string }) => { if (!file.contentPath) return; setDownloadError(false); try { const session = readClientSession(); const response = await fetch(API_URL.replace(/\/api$/, "") + file.contentPath, { headers: { Authorization: "Bearer " + session?.tokens.accessToken, "X-Workspace": session?.workspaceContext?.workspace.id || "" } }); if (!response.ok) throw Error("delivery_unavailable"); const url = URL.createObjectURL(await response.blob()), link = document.createElement("a"); link.href = url; link.download = file.name; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); } catch { setDownloadError(true); } };
  const last = r.deliveries.at(-1);
  return (
    <Card className="flex flex-col gap-4">
      <h2 className="font-display text-title-sm text-fg">{t("deliveries")}</h2>
      <ol className="flex flex-col gap-3">
        {r.deliveries
          .slice()
          .reverse()
          .map((d) => (
            <li key={d.id} className="flex flex-col gap-2 rounded-field border border-line p-4">
              <p className="text-caption text-fg-muted">{t("deliveredOn", { date: day(d.at) })}</p>
              <p dir="auto" className="whitespace-pre-line text-body text-fg">
                {d.note}
              </p>
              {d.files.length ? (
                <ul className="flex flex-wrap gap-2">
                  {d.files.map((file, index) => (
                    <li key={index} className="flex items-center gap-1 text-body-sm text-fg-muted">
                      <FileText aria-hidden="true" />
                      <span dir="auto">{typeof file === "string" ? file : file.name}</span>{typeof file !== "string" && file.contentPath ? <Button size="sm" variant="ghost" onClick={() => void download(file)}>{tv("downloadDelivery")}</Button> : null}
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          ))}
      </ol>
      {downloadError ? <p role="alert" className="text-body-sm text-danger">{tv("deliveryUnavailable")}</p> : null}
      {r.state === "in_review" && last ? (
        <>
          {last.autoApproveAt ? <Notice tone="info">{t("autoApprove", { date: day(last.autoApproveAt) })}</Notice> : null}
          {canManage ? (
            <div className="flex flex-wrap justify-end gap-2">
              <Button variant="secondary" startIcon={<PencilSimpleLine />} onClick={() => onOpen("revise")}>
                {t("revise")}
              </Button>
              <Button variant="primary" startIcon={<CheckCircle />} onClick={() => onOpen("approve")}>
                {t("approve")}
              </Button>
            </div>
          ) : (
            <p className="text-body-sm text-fg-muted">{t("adminApproves")}</p>
          )}
        </>
      ) : r.state === "completed" ? (
        <p className="flex items-center gap-2 text-body-sm text-success">
          <CheckCircle aria-hidden="true" weight="fill" />
          {r.autoApproved ? t("autoApproved", { date: day(r.completedAt) }) : t("completedOn", { date: day(r.completedAt) })}
        </p>
      ) : null}
    </Card>
  );
}

function Summary({ r }: { r: ServiceRequest }) {
  const t = useTranslations("Services.detail");
  const f = useFormatter();
  const name = useLocalized();
  const ws = useWorkspace();
  const currency = ws.me?.workspace.currency ?? "";
  const rows: [string, React.ReactNode][] = [
    [t("number"), <span dir="ltr">{r.number}</span>],
    [t("service"), name(r.service)],
    [t("requested"), f.date(r.createdAt, { dateStyle: "medium" })],
    [t("budget"), r.budget == null || r.budget === "" ? t("notGiven") : typeof r.budget === "number" ? <Money amount={r.budget} currency={currency} /> : <span dir="auto">{r.budget}</span>],
    [t("deadline"), r.deadline ? f.date(r.deadline, { dateStyle: "medium" }) : t("notGiven")],
  ];
  return (
    <Card className="flex flex-col gap-4">
      <h2 className="font-display text-title-sm text-fg">{t("details")}</h2>
      <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-2 text-body-sm">
        {rows.map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="text-fg-muted">{k}</dt>
            <dd className="text-end text-fg">{v}</dd>
          </div>
        ))}
      </dl>
      <div className="flex flex-col gap-1">
        <h3 className="text-label text-fg">{t("brief")}</h3>
        {r.brief ? (
          <p dir="auto" className="whitespace-pre-line break-words text-body-sm text-fg">
            {r.brief}
          </p>
        ) : (
          <p className="text-body-sm text-fg-muted">{t("noBrief")}</p>
        )}
      </div>
    </Card>
  );
}

function Milestones({ r }: { r: ServiceRequest }) {
  const t = useTranslations("Services.detail");
  const f = useFormatter();
  return (
    <Card className="flex flex-col gap-4">
      <h2 className="font-display text-title-sm text-fg">{t("milestones")}</h2>
      <ol className="flex flex-col gap-3">
        {r.milestones.map((m, i) => (
          <li key={i} className="flex flex-wrap items-center justify-between gap-2">
            <span className="flex min-w-0 flex-col">
              <bdi dir="auto" className="font-semibold text-fg">
                {m.title}
              </bdi>
              {m.due ? <span className="text-caption text-fg-muted">{t("due", { date: f.date(m.due, { dateStyle: "medium" }) })}</span> : null}
            </span>
            <Badge tone={m.state === "done" ? "success" : m.state === "delivered" ? "info" : "neutral"} emphasis="subtle">
              {t(`milestone.${m.state}`)}
            </Badge>
          </li>
        ))}
      </ol>
    </Card>
  );
}

function Messages({ r, me }: { r: ServiceRequest; me: AppMe }) {
  const t = useTranslations("Services.detail");
  const { data: team } = useGetTeamQuery();
  const nameOf = (key: string) => team?.items.find((m) => m.userKey === key || m.id === key)?.name ?? t("someone");
  return (
    <Thread
      label={t("messages")}
      empty={t("noMessages")}
      messages={r.messages.map((m, i) => ({
        key: `${m.at}-${i}`,
        staff: m.by === "staff",
        mine: m.by === "customer" && m.author === me.user.key,
        author: m.by === "staff" ? t("staff") : nameOf(m.author),
        at: m.at,
        text: m.text,
      }))}
    />
  );
}

function ReviseDialog({ open, onOpenChange, onSend }: { open: boolean; onOpenChange: (o: boolean) => void; onSend: (text: string) => Promise<unknown> }) {
  const t = useTranslations("Services.detail");
  const [text, setText] = useState("");
  const [missing, setMissing] = useState(false);
  const [sending, setSending] = useState(false);
  const send = async () => {
    if (!text.trim()) return setMissing(true);
    setSending(true);
    await onSend(text.trim());
    setSending(false);
    setText("");
    onOpenChange(false);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>{t("reviseTitle")}</DialogTitle>
          <DialogDescription>{t("reviseBody")}</DialogDescription>
        </DialogHeader>
        <DialogBody>
          <Field label={t("reviseLabel")} required error={missing ? t("reviseMissing") : undefined}>
            <Textarea
              value={text}
              rows={5}
              dir="auto"
              onChange={(e) => {
                setText(e.target.value);
                setMissing(false);
              }}
            />
          </Field>
        </DialogBody>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            {t("notNow")}
          </Button>
          <Button variant="primary" loading={sending} onClick={send}>
            {t("revise")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
