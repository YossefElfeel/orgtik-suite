"use client";
// Support (USR-21..23, spec 05 USR-25): the tickets list, a new ticket, and one ticket's
// conversation. Admins and the owner see the workspace's tickets; everyone else sees their own.
// OrgTik's people answer as "OrgTik support". A reply reopens a resolved ticket; a closed one
// says to open a new one. /support/new is where the "suspended" banner sends people.
import { useState } from "react";
import Link from "next/link";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { CheckCircle, PaperPlaneRight, Plus } from "@phosphor-icons/react";
import { Button, Card, ConfirmDialog, ErrorState, Field, Input, LoadingState, PageHeader, Select, StatusBadge, Textarea, toast, useFormatter, type StatusState } from "@orgtik/ui";
import { DataTable, type ColumnDef, type PaginationState } from "@orgtik/ui/table";
import useWorkspace from "@/hooks/use-workspace";
import { ButtonLink } from "@/components/shared/ButtonLink";
import { statusOf, type AppMe } from "@/redux/features/platform/platformApi";
import { useCreateTicketMutation, useGetTicketQuery, useGetTicketsQuery, useTicketActionMutation, type Ticket, type TicketCategory, type TicketState } from "@/redux/features/platform/support";
import { fieldErrorsOf, usePlatformProblem } from "@/components/workspace/account/problems";
import { Notice } from "@/components/workspace/account/Notice";
import { TicketFiles } from "@/components/account/TicketFiles";
import { Composer, Thread } from "./Thread";

const PAGE_SIZE = 10;
export const CATEGORIES: TicketCategory[] = ["billing", "product", "sales", "technical", "other"];
// The API says waiting_for_you where the status matrix says awaiting_reply.
const ticketBadge = (s: TicketState): StatusState<"support_ticket"> => (s === "waiting_for_you" ? "awaiting_reply" : s) as StatusState<"support_ticket">;

export function TicketsList() {
  const t = useTranslations("Support");
  const f = useFormatter();
  const ws = useWorkspace();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const page = Math.max(1, Number(params.get("page")) || 1);
  const { data, isLoading, isError, isFetching, refetch } = useGetTicketsQuery({ page, pageSize: PAGE_SIZE });
  const meKey = ws.me?.user.key;

  const columns: ColumnDef<Ticket>[] = [
    {
      id: "number",
      header: t("colNumber"),
      cell: ({ row }) => (
        <Link href={`/support/${encodeURIComponent(row.original.id)}`} dir="ltr" className="font-semibold whitespace-nowrap text-fg-brand underline-offset-2 hover:underline">
          {row.original.number}
        </Link>
      ),
    },
    {
      id: "subject",
      header: t("colSubject"),
      meta: { truncate: true },
      cell: ({ row }) => (
        <span dir="auto" className="truncate text-fg">
          {row.original.subject}
        </span>
      ),
    },
    { id: "category", header: t("colCategory"), cell: ({ row }) => <span className="whitespace-nowrap text-fg-muted">{t(`categories.${row.original.category}`)}</span> },
    { id: "status", header: t("colStatus"), cell: ({ row }) => <StatusBadge entity="support_ticket" state={ticketBadge(row.original.state)} viewer="customer" /> },
    {
      id: "last",
      header: t("colLastReply"),
      cell: ({ row }) => {
        const last = row.original.messages.at(-1);
        if (!last) return <span className="text-fg-muted">{t("noReply")}</span>;
        const who = last.by === "staff" ? t("thread.staff") : last.author === meKey ? t("thread.you") : last.authorName;
        return (
          <span className="flex flex-col whitespace-nowrap">
            <bdi dir="auto" className="text-fg">
              {who}
            </bdi>
            <span className="text-caption text-fg-muted">{f.date(last.at, { dateStyle: "medium" })}</span>
          </span>
        );
      },
    },
    { id: "created", header: t("colCreated"), meta: { numeric: true }, cell: ({ row }) => <span className="whitespace-nowrap text-fg-muted">{f.date(row.original.createdAt, { dateStyle: "medium" })}</span> },
  ];
  const pagination: PaginationState = { pageIndex: page - 1, pageSize: PAGE_SIZE };
  const newButton = (
    <ButtonLink href="/support/new" variant="primary">
      <Plus aria-hidden="true" />
      {t("newTicket")}
    </ButtonLink>
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("title")} description={ws.isAdmin ? t("descriptionAdmin", { name: ws.me?.workspace.name ?? "" }) : t("descriptionMember")} actions={newButton} />
      <DataTable
        label={t("tableLabel")}
        columns={columns}
        data={data?.items ?? []}
        getRowId={(r) => r.id}
        mode="server"
        rowCount={data?.total ?? 0}
        pagination={pagination}
        onPaginationChange={(u) => {
          const next = typeof u === "function" ? u(pagination) : u;
          const q = new URLSearchParams(params.toString());
          if (next.pageIndex) q.set("page", String(next.pageIndex + 1));
          else q.delete("page");
          router.replace(`${pathname}${q.size ? `?${q}` : ""}`, { scroll: false });
        }}
        pageSizes={[PAGE_SIZE]}
        status={isLoading ? "loading" : isError ? "error" : "ready"}
        onRetry={refetch}
        className={isFetching && !isLoading ? "opacity-70 transition-opacity" : undefined}
        empty={{ title: t("emptyTitle"), description: t("emptyBody"), action: newButton }}
      />
    </div>
  );
}

export function NewTicketForm() {
  const t = useTranslations("Support.new");
  const ts = useTranslations("Support");
  const router = useRouter();
  const params = useSearchParams();
  const problem = usePlatformProblem();
  const [create, { isLoading }] = useCreateTicketMutation();
  const preset = params.get("category") as TicketCategory | null;
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState<TicketCategory | null>(preset && CATEGORIES.includes(preset) ? preset : null);
  const [text, setText] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [failed, setFailed] = useState<string | null>(null);

  const submit = async () => {
    const e: Record<string, string> = {};
    if (!subject.trim()) e.subject = "required";
    if (!category) e.category = "required";
    if (!text.trim()) e.text = "required";
    setErrors(e);
    setFailed(null);
    if (Object.keys(e).length) return;
    try {
      const tk = await create({ subject: subject.trim(), category: category!, text: text.trim() }).unwrap();
      toast.success(t("sent", { number: tk.number }));
      router.push(`/support/${encodeURIComponent(tk.id)}`);
    } catch (err) {
      const fe = fieldErrorsOf(err);
      if (Object.keys(fe).length) setErrors(fe);
      else setFailed(problem(err));
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("title")} description={t("description")} breadcrumb={[{ label: ts("title"), href: "/support" }, { label: t("title") }]} />
      <Card className="max-w-3xl">
        <form
          className="flex flex-col gap-5"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <Field label={t("subject")} required error={errors.subject ? t("subjectMissing") : undefined}>
            <Input value={subject} maxLength={150} dir="auto" required onChange={(e) => setSubject(e.target.value)} />
          </Field>
          <Field label={t("category")} required error={errors.category ? t("categoryMissing") : undefined}>
            <Select<TicketCategory> options={CATEGORIES.map((c) => ({ value: c, label: ts(`categories.${c}`) }))} value={category} onValueChange={setCategory} placeholder={t("categoryPlaceholder")} required />
          </Field>
          <Field label={t("message")} required error={errors.text ? t("messageMissing") : undefined} description={t("messageHint")}>
            <Textarea value={text} rows={6} maxRows={16} dir="auto" required onChange={(e) => setText(e.target.value)} />
          </Field>
          {failed ? <Notice tone="danger">{failed}</Notice> : null}
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="secondary" onClick={() => router.push("/support")}>
              {t("cancel")}
            </Button>
            <Button type="submit" variant="primary" loading={isLoading} startIcon={<PaperPlaneRight className="rtl:-scale-x-100" />}>
              {t("submit")}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

export function TicketDetail() {
  const t = useTranslations("Support.detail");
  const ts = useTranslations("Support");
  const f = useFormatter();
  const { id } = useParams<{ id: string }>();
  const ws = useWorkspace();
  const me = ws.me as AppMe;
  const { data: tk, isLoading, error, refetch } = useGetTicketQuery(id);
  const [act] = useTicketActionMutation();
  const problem = usePlatformProblem();
  const [resolving, setResolving] = useState(false);
  const [replyError, setReplyError] = useState<string | null>(null);
  const [pageProblem, setPageProblem] = useState<string | null>(null);

  if (isLoading) return <LoadingState rows={6} />;
  if (error || !tk) {
    const missing = statusOf(error) === 404;
    return (
      <ErrorState
        titleAs="h1"
        title={missing ? t("missingTitle") : t("failedTitle")}
        description={missing ? t("missingBody") : t("failedBody")}
        onRetry={missing ? undefined : refetch}
        action={<ButtonLink href="/support">{t("toTickets")}</ButtonLink>}
      />
    );
  }
  const closed = tk.state === "closed";
  const resolved = tk.state === "resolved";
  const day = (d?: string) => (d ? f.date(d, { dateStyle: "medium" }) : "");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={<bdi dir="auto">{tk.subject}</bdi>}
        breadcrumb={[{ label: ts("title"), href: "/support" }, { label: <span dir="ltr">{tk.number}</span> }]}
        status={<StatusBadge entity="support_ticket" state={ticketBadge(tk.state)} viewer="customer" />}
        description={t("meta", { category: ts(`categories.${tk.category}`), date: day(tk.createdAt) })}
        actions={
          !closed && !resolved ? (
            <Button variant="secondary" startIcon={<CheckCircle />} onClick={() => setResolving(true)}>
              {t("resolve")}
            </Button>
          ) : null
        }
      />
      {pageProblem ? <Notice tone="danger">{pageProblem}</Notice> : null}
      {tk.state === "waiting_for_you" ? <Notice tone="warning">{tk.autoCloseAt ? t("waitingUntil", { date: day(tk.autoCloseAt) }) : t("waiting")}</Notice> : null}
      <Card className="flex max-w-4xl flex-col gap-4">
        <h2 className="font-display text-title-sm text-fg">{t("conversation")}</h2>
        <TicketFiles ticketId={tk.id} />
        <Thread
          label={t("conversation")}
          empty={t("noMessages")}
          messages={tk.messages.map((m, i) => ({
            key: `${m.at}-${i}`,
            staff: m.by === "staff",
            mine: m.by === "customer" && m.author === me.user.key,
            author: m.by === "staff" ? ts("thread.staff") : m.authorName,
            at: m.at,
            text: m.text,
          }))}
        />
        {closed ? (
          <Notice
            tone="info"
            title={t("closedTitle")}
            action={
              <ButtonLink href="/support/new" variant="secondary">
                {t("openNew")}
              </ButtonLink>
            }
          >
            {t("closedBody")}
          </Notice>
        ) : (
          <Composer
            label={t("replyLabel")}
            submitLabel={t("reply")}
            note={resolved ? (tk.reopenUntil ? t("reopensUntil", { date: day(tk.reopenUntil) }) : t("reopens")) : undefined}
            error={replyError}
            onSend={async (text) => {
              setReplyError(null);
              try {
                await act({ id: tk.id, action: "reply", text }).unwrap();
                toast.success(resolved ? t("reopened") : t("replied"));
              } catch (e) {
                setReplyError((e as { code?: string }).code === "closed" ? t("closedBody") : problem(e));
                throw e;
              }
            }}
          />
        )}
      </Card>
      <ConfirmDialog
        open={resolving}
        onOpenChange={setResolving}
        title={t("resolveTitle", { number: tk.number })}
        impact={t("resolveImpact")}
        confirmLabel={t("resolve")}
        tone="primary"
        onConfirm={async () => {
          setPageProblem(null);
          try {
            await act({ id: tk.id, action: "resolve" }).unwrap();
            toast.success(t("resolved"));
          } catch (e) {
            setPageProblem(problem(e));
          }
        }}
      />
    </div>
  );
}
