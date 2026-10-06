"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { DotsThreeVertical, DownloadSimple, EyeSlash, MagnifyingGlass, X } from "@phosphor-icons/react";
import {
  Badge,
  Button,
  ConfirmDialog,
  DialogBody,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Field,
  IconButton,
  Input,
  Menu,
  MenuContent,
  MenuItem,
  MenuTrigger,
  PageHeader,
  Select,
  Sheet,
  SheetContent,
  StatusBadge,
  Tabs,
  TabsList,
  Textarea,
  toast,
  useFormatter,
  useStatusLabel,
} from "@orgtik/ui";
import { DataTable, type ColumnDef } from "@orgtik/ui/table";
import { RequirePermission } from "@/components/frame/RequirePermission";
import { useCan } from "@/lib/permissions";
import {
  downloadLeads,
  statusOf,
  useAssignLeadMutation,
  useEraseLeadMutation,
  useLeadQuery,
  useLeadsQuery,
  useMembersQuery,
  useMoveLeadMutation,
  useNoteLeadMutation,
  type ApiError,
  type Lead,
  type LeadAction,
  type LeadStatus,
} from "@/store/api";

const TABS = ["open", "new", "contacted", "qualified", "quoted", "won", "closed"] as const;
type Tab = (typeof TABS)[number];
// What can happen next (status matrix: lead). The first is the main action.
const NEXT: Partial<Record<LeadStatus, LeadAction[]>> = {
  new: ["contact", "qualify", "unqualify", "spam", "duplicate"],
  contacted: ["qualify", "unqualify", "lose"],
  qualified: ["quote", "lose"],
  quoted: ["win", "lose"],
  unqualified: ["reopen"],
};
const NEEDS_REASON: LeadAction[] = ["unqualify", "lose"];

function useMove(lead: Lead) {
  const t = useTranslations("Leads");
  const [move] = useMoveLeadMutation();
  return (action: LeadAction, extra: { reason?: string; of?: string } = {}) =>
    move({ id: lead.id, version: lead.version, action, ...extra })
      .unwrap()
      .then(() => toast.success(t(`done.${action}`)))
      .catch((e: ApiError) => {
        toast.error(e.status === 412 ? t("stale") : t("failed"));
        throw e;
      });
}

/** The actions a lead's status allows; the ones that close it ask why. */
function LeadActions({ lead, compact }: { lead: Lead; compact?: boolean }) {
  const t = useTranslations("Leads");
  const run = useMove(lead);
  const [asking, setAsking] = useState<LeadAction | null>(null);
  const next = NEXT[lead.status] ?? [];
  if (!next.length) return null;
  const [main, ...more] = next;
  const start = (a: LeadAction) => (NEEDS_REASON.includes(a) || a === "duplicate" ? setAsking(a) : run(a).catch(() => {}));
  return (
    <span className="inline-flex items-center gap-1">
      <Button size="sm" variant={compact ? "secondary" : "primary"} onClick={() => start(main)}>
        {t(`actions.${main}`)}
      </Button>
      {more.length ? (
        <Menu>
          <MenuTrigger render={<IconButton size="sm" variant="ghost" label={t("moreFor", { topic: lead.topic })} icon={<DotsThreeVertical weight="bold" />} />} />
          <MenuContent align="end">
            {more.map((a) => (
              <MenuItem key={a} tone={a === "spam" ? "danger" : "default"} onClick={() => start(a)}>
                {t(`actions.${a}`)}
              </MenuItem>
            ))}
          </MenuContent>
        </Menu>
      ) : null}
      {asking ? (
        <ConfirmDialog
          open
          onOpenChange={(o) => !o && setAsking(null)}
          tone="primary"
          title={t(`confirm.${asking}`)}
          impact={t(`impact.${asking}`)}
          reason={asking === "duplicate" ? { label: t("duplicateOf"), required: true, placeholder: "ld_01" } : { label: t("reason"), required: true }}
          confirmLabel={t(`actions.${asking}`)}
          onConfirm={({ reason }) => run(asking, asking === "duplicate" ? { of: reason.trim() } : { reason }).then(() => setAsking(null))}
        />
      ) : null}
    </span>
  );
}

function LeadSheet({ id, onClose }: { id: string; onClose: () => void }) {
  const t = useTranslations("Leads");
  const f = useFormatter();
  const can = useCan();
  const { data: lead } = useLeadQuery(id);
  const members = useMembersQuery();
  const [assign] = useAssignLeadMutation();
  const [addNote, noting] = useNoteLeadMutation();
  const [erase] = useEraseLeadMutation();
  const [note, setNote] = useState("");
  if (!lead) return null;
  const editable = can("marketing:edit");
  const owners = (members.data?.items ?? []).filter((m) => m.permissions.includes("marketing:edit"));
  const ctx = lead.context;
  return (
    <Sheet open onOpenChange={(o) => !o && onClose()}>
      <SheetContent>
        <DialogHeader>
          <DialogTitle>
            <span dir="auto">{lead.erased ? t("erasedName") : lead.name}</span>
          </DialogTitle>
          <DialogDescription>
            <span className="inline-flex flex-wrap items-center gap-2">
              <StatusBadge entity="lead" state={lead.status} size="sm" />
              <span dir="auto">{lead.topic}</span>
              {lead.sample ? <Badge size="sm">{t("sample")}</Badge> : null}
            </span>
          </DialogDescription>
        </DialogHeader>
        <DialogBody className="flex flex-col gap-5">
          {editable ? <LeadActions lead={lead} /> : null}
          <section aria-labelledby="lead-contact" className="flex flex-col gap-1 text-body-sm">
            <h3 id="lead-contact" className="text-label text-fg">{t("contactTitle")}</h3>
            {lead.masked ? (
              <p className="flex items-center gap-2 text-fg-muted">
                <EyeSlash aria-hidden="true" className="size-4" />
                {t("masked")}
              </p>
            ) : null}
            <dl className="grid grid-cols-[8rem_1fr] gap-x-3 gap-y-1">
              <dt className="text-fg-muted">{t("email")}</dt>
              <dd dir="ltr" className="text-start text-fg">{lead.email || "—"}</dd>
              <dt className="text-fg-muted">{t("phone")}</dt>
              <dd dir="ltr" className="text-start text-fg">{lead.phone || "—"}</dd>
              <dt className="text-fg-muted">{t("company")}</dt>
              <dd dir="auto" className="text-fg">{lead.company || "—"}</dd>
            </dl>
          </section>
          <section aria-labelledby="lead-message" className="flex flex-col gap-1">
            <h3 id="lead-message" className="text-label text-fg">{t("message")}</h3>
            <p dir="auto" className="text-body text-fg">{lead.message || "—"}</p>
          </section>
          <section aria-labelledby="lead-context" className="flex flex-col gap-1 text-body-sm">
            <h3 id="lead-context" className="text-label text-fg">{t("contextTitle")}</h3>
            <dl className="grid grid-cols-[8rem_1fr] gap-x-3 gap-y-1">
              <dt className="text-fg-muted">{t("page")}</dt>
              <dd dir="ltr" className="text-start font-mono text-fg">{lead.page || "—"}</dd>
              {ctx.plan || ctx.modules ? (
                <>
                  <dt className="text-fg-muted">{t("selection")}</dt>
                  <dd dir="ltr" className="text-start text-fg">{[ctx.plan, ctx.modules?.join(" + "), ctx.duration].filter(Boolean).join(" · ")}</dd>
                </>
              ) : null}
              {ctx.bundle ? (
                <>
                  <dt className="text-fg-muted">{t("bundle")}</dt>
                  <dd dir="auto" className="text-fg">{ctx.bundle}</dd>
                </>
              ) : null}
              <dt className="text-fg-muted">{t("campaign")}</dt>
              <dd dir="ltr" className="text-start text-fg">{[lead.utm.source, lead.utm.medium, lead.utm.campaign].filter(Boolean).join(" / ") || t("direct")}</dd>
              <dt className="text-fg-muted">{t("consent")}</dt>
              <dd className="text-fg">{t("consentShown", { version: lead.consent.privacyVersion || "—", date: f.date(lead.consent.at, { dateStyle: "medium" }) })}</dd>
            </dl>
          </section>
          <Field label={t("owner")}>
            <Select
              readOnly={!editable}
              value={lead.owner?.key ?? "none"}
              onValueChange={(v) => v && assign({ id: lead.id, version: lead.version, owner: v === "none" ? null : v }).unwrap().then(() => toast.success(t("assigned"))).catch(() => toast.error(t("failed")))}
              options={[{ value: "none", label: t("noOwner") }, ...owners.map((m) => ({ value: m.key, label: <bdi dir="auto">{m.name}</bdi> }))]}
            />
          </Field>
          <section aria-labelledby="lead-notes" className="flex flex-col gap-2">
            <h3 id="lead-notes" className="text-label text-fg">{t("notes")}</h3>
            {editable ? (
              <div className="flex flex-col gap-2">
                <Textarea dir="auto" rows={2} aria-label={t("newNote")} placeholder={t("newNote")} value={note} onChange={(e) => setNote(e.target.value)} />
                <Button size="sm" variant="secondary" className="self-start" loading={noting.isLoading} disabled={!note.trim()} onClick={() => addNote({ id: lead.id, text: note }).unwrap().then(() => setNote(""))}>
                  {t("addNote")}
                </Button>
              </div>
            ) : null}
            <ol className="flex flex-col gap-2">
              {lead.notes.map((n, i) => (
                <li key={i} className="border-b border-line pb-2 text-body-sm last:border-0">
                  <p dir="auto" className="text-fg">{n.text}</p>
                  <p className="text-caption text-fg-subtle">{f.date(n.at, { dateStyle: "medium", timeStyle: "short" })} · <bdi dir="auto">{n.by.name}</bdi></p>
                </li>
              ))}
            </ol>
          </section>
          <section aria-labelledby="lead-history" className="flex flex-col gap-2">
            <h3 id="lead-history" className="text-label text-fg">{t("history")}</h3>
            <ol className="flex flex-col gap-1 text-body-sm">
              {lead.history.map((h, i) => (
                <li key={i} className="text-fg-muted">
                  <span className="text-fg">{t(`log.${h.action}`)}</span> · {f.date(h.at, { dateStyle: "medium", timeStyle: "short" })} · <bdi dir="auto">{h.by.name ?? t("visitor")}</bdi>
                  {h.reason ? <span dir="auto" className="block">{h.reason}</span> : null}
                </li>
              ))}
            </ol>
          </section>
          {can("leads:pii") && !lead.erased ? (
            <ConfirmDialog
              trigger={<Button variant="ghost" className="self-start text-danger">{t("erase")}</Button>}
              tone="danger"
              irreversible
              title={t("eraseTitle")}
              impact={t("eraseImpact")}
              acknowledgement={t("eraseAck")}
              confirmLabel={t("erase")}
              onConfirm={() => erase(lead.id).unwrap().then(() => toast.success(t("erased")))}
            />
          ) : null}
        </DialogBody>
      </SheetContent>
    </Sheet>
  );
}

function LeadsList() {
  const t = useTranslations("Leads");
  const f = useFormatter();
  const can = useCan();
  const statusLabel = useStatusLabel();
  const [tab, setTab] = useState<Tab>("open");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const { data, isLoading, error, refetch, isFetching } = useLeadsQuery({ status: tab, search: search || undefined, pageSize: 100 });
  const counts = data?.counts ?? {};
  const countOf = (x: Tab) =>
    x === "open" ? (["new", "contacted", "qualified", "quoted"] as const).reduce((n, k) => n + (counts[k] ?? 0), 0) : x === "closed" ? (["lost", "unqualified", "spam", "duplicate"] as const).reduce((n, k) => n + (counts[k] ?? 0), 0) : counts[x] ?? 0;

  const columns = useMemo<ColumnDef<Lead, any>[]>(
    () => [
      {
        id: "lead",
        header: t("colLead"),
        meta: { truncate: true },
        cell: ({ row }) => {
          const l = row.original;
          return (
            <span className="flex min-w-0 flex-col items-start">
              <span className="flex max-w-full items-center gap-2">
                <button type="button" dir="auto" onClick={() => setOpen(l.id)} className="truncate text-start font-semibold text-fg hover:underline focus-visible:outline-2 focus-visible:outline-focus">
                  {l.erased ? t("erasedName") : l.name}
                </button>
                {l.sample ? <Badge size="sm">{t("sample")}</Badge> : null}
              </span>
              <span dir="auto" className="max-w-full truncate text-caption text-fg-subtle">{l.message}</span>
            </span>
          );
        },
      },
      { id: "topic", header: t("colTopic"), cell: ({ row }) => <span dir="auto" className="text-fg-muted">{row.original.topic}</span> },
      { id: "from", header: t("colFrom"), cell: ({ row }) => <span dir="ltr" className="font-mono text-caption text-fg-muted">{row.original.page}{row.original.utm.source ? ` · ${row.original.utm.source}` : ""}</span> },
      { id: "owner", header: t("owner"), cell: ({ row }) => <span className="text-fg-muted"><bdi dir="auto">{row.original.owner?.name ?? t("noOwner")}</bdi></span> },
      { id: "created", header: t("colCreated"), meta: { numeric: true }, cell: ({ row }) => <span className="text-fg-muted">{f.date(row.original.createdAt, { dateStyle: "medium" })}</span> },
      { id: "status", header: t("colStatus"), cell: ({ row }) => <StatusBadge entity="lead" state={row.original.status} size="sm" /> },
      { id: "actions", header: () => <span className="sr-only">{t("colActions")}</span>, meta: { numeric: true }, cell: ({ row }) => (can("marketing:edit") ? <LeadActions lead={row.original} compact /> : null) },
    ],
    [t, f, can],
  );
  const status = isLoading ? "loading" : error ? (statusOf(error) === 403 ? "forbidden" : "error") : "ready";
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={
          <Button variant="secondary" startIcon={<DownloadSimple />} onClick={() => downloadLeads().catch(() => toast.error(t("failed")))}>
            {data?.pii ? t("export") : t("exportMasked")}
          </Button>
        }
      />
      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
        <TabsList items={TABS.map((x) => ({ value: x, label: x === "open" ? t("open") : x === "closed" ? t("closed") : statusLabel("lead", x), count: countOf(x) }))} />
      </Tabs>
      <Input size="sm" type="search" value={search} onChange={(e) => setSearch(e.target.value)} aria-label={t("search")} placeholder={data?.pii ? t("search") : t("searchMasked")} startIcon={<MagnifyingGlass className="size-4" />} className="w-full sm:w-80" />
      <DataTable
        label={t("title")}
        columns={columns}
        data={data?.items ?? []}
        getRowId={(r) => r.id}
        status={status}
        paginate={(data?.total ?? 0) > 25}
        onRetry={refetch}
        className={isFetching && !isLoading ? "opacity-70" : undefined}
        empty={search ? { title: t("noMatch"), action: <Button size="sm" variant="secondary" startIcon={<X />} onClick={() => setSearch("")}>{t("clear")}</Button> } : { title: t(`empty.${tab}`) }}
      />
      {open ? <LeadSheet id={open} onClose={() => setOpen(null)} /> : null}
    </div>
  );
}

export default function LeadsPage() {
  return (
    <RequirePermission permission="marketing:view">
      <LeadsList />
    </RequirePermission>
  );
}
