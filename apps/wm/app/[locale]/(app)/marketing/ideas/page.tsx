"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { DotsThreeVertical, MagnifyingGlass, X } from "@phosphor-icons/react";
import {
  Badge,
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
  toast,
  useFormatter,
  useStatusLabel,
} from "@orgtik/ui";
import { DataTable, type ColumnDef } from "@orgtik/ui/table";
import { RequirePermission } from "@/components/frame/RequirePermission";
import { useCan } from "@/lib/permissions";
import { statusOf, useIdeasQuery, useModerateIdeaMutation, useEraseIdeaMutation, type ApiError, type Idea, type IdeaAction, type IdeaStatus } from "@/store/api";

// The tabs: what needs a decision first, then the public lifecycle, then everything closed.
const TABS = ["pending", "open", "planned", "in_progress", "shipped", "closed"] as const;
type Tab = (typeof TABS)[number];
// What can be done from each status (status matrix roadmap_idea). The first one is the main action.
const NEXT: Partial<Record<IdeaStatus, IdeaAction[]>> = {
  pending: ["publish", "merge", "decline", "hide"],
  open: ["plan", "merge", "decline"],
  planned: ["start"],
  in_progress: ["ship"],
};
const VISIBLE: IdeaStatus[] = ["open", "planned", "in_progress", "shipped"];

/** One action on one idea, with what it asks for: a reason, a link, or the idea to merge into. */
function ActionDialog({ idea, action, onClose }: { idea: Idea; action: IdeaAction; onClose: () => void }) {
  const t = useTranslations("Ideas");
  const [moderate] = useModerateIdeaMutation();
  const others = useIdeasQuery({ pageSize: 100 }, { skip: action !== "merge" });
  const [into, setInto] = useState<string | null>(null);
  const run = (extra: { reason?: string; link?: string; into?: string } = {}) =>
    moderate({ id: idea.id, version: idea.version, action, ...extra })
      .unwrap()
      .then(() => {
        toast.success(t(`done.${action}`));
        onClose();
      })
      .catch((e: ApiError) => {
        if (e.status === 412) toast.error(t("stale"));
        else if (e.fieldErrors?.link) toast.error(t("errorLink"));
        else toast.error(t("failed"));
        throw e;
      });

  if (action === "merge") {
    const targets = (others.data?.items ?? []).filter((x) => x.id !== idea.id && VISIBLE.includes(x.status));
    return (
      <Dialog open onOpenChange={(o) => !o && onClose()}>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>{t("mergeTitle")}</DialogTitle>
            <DialogDescription>{t("mergeImpact", { votes: idea.votes })}</DialogDescription>
          </DialogHeader>
          <DialogBody>
            <Field label={t("mergeInto")}>
              <Select value={into} onValueChange={setInto} placeholder={t("mergePick")} options={targets.map((x) => ({ value: x.id, label: <span dir="auto">{x.title}</span> }))} />
            </Field>
          </DialogBody>
          <DialogFooter>
            <Button variant="ghost" onClick={onClose}>
              {t("cancel")}
            </Button>
            <Button disabled={!into} onClick={() => into && run({ into }).catch(() => {})}>
              {t("actions.merge")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }
  const asks = action === "ship" ? { label: t("shipLink"), required: true, placeholder: "/software" } : action === "decline" || action === "hide" ? { label: t(`reason.${action}`), required: true } : undefined;
  return (
    <ConfirmDialog
      open
      onOpenChange={(o) => !o && onClose()}
      tone={action === "hide" ? "danger" : "primary"}
      title={t(`confirm.${action}`, { title: idea.title })}
      impact={t(`impact.${action}`)}
      reason={asks}
      confirmLabel={t(`actions.${action}`)}
      onConfirm={({ reason }) => run(action === "ship" ? { link: reason } : asks ? { reason } : {})}
    />
  );
}

function IdeaSheet({ idea, onClose }: { idea: Idea; onClose: () => void }) {
  const t = useTranslations("Ideas");
  const f = useFormatter();
  const can = useCan();
  const [erase] = useEraseIdeaMutation();
  return (
    <Sheet open onOpenChange={(o) => !o && onClose()}>
      <SheetContent>
        <DialogHeader>
          <DialogTitle>
            <span dir="auto">{idea.title}</span>
          </DialogTitle>
          <DialogDescription>
            <span className="inline-flex flex-wrap items-center gap-2">
              <StatusBadge entity="roadmap_idea" state={idea.status} size="sm" />
              <span dir="auto">{idea.theme}</span>
            </span>
          </DialogDescription>
        </DialogHeader>
        <DialogBody className="flex flex-col gap-5">
          <p dir="auto" className="text-body text-fg">{idea.body}</p>
          <p className="text-body-sm text-fg-muted">{t("counts", { votes: idea.votes, comments: idea.comments })}</p>
          {idea.source ? <p className="text-body-sm text-fg-muted">{t("source")}: <bdi>{idea.source === "website" ? t("sourceWebsite") : idea.source}</bdi></p> : null}
          {idea.submitter ? <section className="flex flex-col gap-2" aria-labelledby="idea-submitter">
            <h3 id="idea-submitter" className="text-label">{t("submitter")}</h3>
            {idea.submitter.erased ? <p>{t("erased")}</p> : <>
              <p dir="auto">{idea.submitter.name}</p><p dir="ltr" className="break-words text-start">{idea.submitter.email}</p>
              {idea.submitter.masked ? <p className="text-body-sm text-fg-muted">{t("masked")}</p> : null}
              {can("leads:pii") ? <ConfirmDialog tone="danger" trigger={<Button size="sm" variant="secondary">{t("erase")}</Button>} title={t("eraseTitle")} impact={t("eraseImpact")} confirmLabel={t("erase")} onConfirm={() => erase({ id: idea.id, version: idea.version }).unwrap().then(() => { toast.success(t("erased")); onClose(); }).catch((error: ApiError) => { toast.error(t(error.status === 412 ? "stale" : "failed")); throw error; })} /> : null}
            </>}
          </section> : null}
          {idea.commentPreview?.length ? <section className="flex flex-col gap-2" aria-labelledby="idea-comments"><h3 id="idea-comments" className="text-label">{t("sampleComments")}</h3><ol className="flex flex-col gap-3">{idea.commentPreview.map(comment => <li key={comment.id} className="rounded-field border border-line p-3"><p dir="auto" className="text-label">{comment.author}</p><p dir="auto" className="mt-1 text-body-sm">{comment.body}</p></li>)}</ol></section> : null}
          {idea.reason ? <p className="text-body-sm text-fg"><span className="font-semibold">{t("reasonLabel")}:</span> <span dir="auto">{idea.reason}</span></p> : null}
          {idea.link ? <p className="text-body-sm text-fg"><span className="font-semibold">{t("shipLink")}:</span> <span dir="ltr">{idea.link}</span></p> : null}
          {idea.mergedInto ? <p className="text-body-sm text-fg"><span className="font-semibold">{t("mergedInto")}:</span> <span dir="ltr">{idea.mergedInto}</span></p> : null}
          <section aria-labelledby="idea-history" className="flex flex-col gap-2">
            <h3 id="idea-history" className="text-label text-fg">{t("history")}</h3>
            <ol className="flex flex-col gap-2">
              {idea.history.map((h, i) => (
                <li key={i} className="border-b border-line pb-2 text-body-sm last:border-0">
                  <span className="text-fg">{t(`log.${h.action}`)}</span>
                  <span className="text-fg-muted"> · {f.date(h.at, { dateStyle: "medium", timeStyle: "short" })} · <bdi dir="auto">{h.by.name ?? t("visitor")}</bdi></span>
                  {h.reason ? <span dir="auto" className="block text-fg-muted">{h.reason}</span> : null}
                </li>
              ))}
            </ol>
          </section>
        </DialogBody>
      </SheetContent>
    </Sheet>
  );
}

function IdeasList() {
  const t = useTranslations("Ideas");
  const f = useFormatter();
  const statusLabel = useStatusLabel();
  const can = useCan();
  const canModerate = can("marketing:edit");
  const [tab, setTab] = useState<Tab>("pending");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState<Idea | null>(null);
  const [acting, setActing] = useState<{ idea: Idea; action: IdeaAction } | null>(null);
  const { data, isLoading, error, refetch, isFetching } = useIdeasQuery({ status: tab, search: search || undefined, pageSize: 100 });
  const counts = data?.counts ?? {};
  const countOf = (x: Tab) => (x === "closed" ? (counts.declined ?? 0) + (counts.merged ?? 0) + (counts.hidden ?? 0) : counts[x] ?? 0);

  const columns = useMemo<ColumnDef<Idea, any>[]>(
    () => [
      {
        id: "idea",
        header: t("colIdea"),
        meta: { truncate: true },
        cell: ({ row }) => {
          const x = row.original;
          return (
            <span className="flex min-w-0 flex-col items-start">
              <span className="flex max-w-full items-center gap-2">
                <button type="button" dir="auto" onClick={() => setOpen(x)} className="truncate text-start font-semibold text-fg hover:underline focus-visible:outline-2 focus-visible:outline-focus">
                  {x.title}
                </button>
                {x.sample ? <Badge size="sm">{t("sample")}</Badge> : null}
              </span>
              <span dir="auto" className="max-w-full truncate text-caption text-fg-subtle">{x.body}</span>
            </span>
          );
        },
      },
      { id: "theme", header: t("colTheme"), cell: ({ row }) => <span dir="auto" className="text-fg-muted">{row.original.theme}</span> },
      { id: "votes", header: t("colVotes"), meta: { numeric: true }, cell: ({ row }) => <span className="tabular-nums">{f.number(row.original.votes)}</span> },
      { id: "submitted", header: t("colSubmitted"), meta: { numeric: true }, cell: ({ row }) => <span className="text-fg-muted">{f.date(row.original.submittedAt, { dateStyle: "medium" })}</span> },
      { id: "status", header: t("colStatus"), cell: ({ row }) => <StatusBadge entity="roadmap_idea" state={row.original.status} size="sm" /> },
      {
        id: "actions",
        header: () => <span className="sr-only">{t("colActions")}</span>,
        meta: { numeric: true },
        cell: ({ row }) => {
          const x = row.original;
          const next = canModerate ? NEXT[x.status] ?? [] : [];
          if (!next.length) return null;
          const [main, ...more] = next;
          return (
            <span className="inline-flex items-center gap-1">
              <Button size="sm" variant="secondary" onClick={() => setActing({ idea: x, action: main })}>
                {t(`actions.${main}`)}
              </Button>
              {more.length ? (
                <Menu>
                  <MenuTrigger render={<IconButton size="sm" variant="ghost" label={t("moreActions", { title: x.title })} icon={<DotsThreeVertical weight="bold" />} />} />
                  <MenuContent align="end">
                    {more.map((a) => (
                      <MenuItem key={a} tone={a === "hide" ? "danger" : "default"} onClick={() => setActing({ idea: x, action: a })}>
                        {t(`actions.${a}`)}
                      </MenuItem>
                    ))}
                  </MenuContent>
                </Menu>
              ) : null}
            </span>
          );
        },
      },
    ],
    [t, f, canModerate],
  );

  const status = isLoading ? "loading" : error ? (statusOf(error) === 403 ? "forbidden" : "error") : "ready";
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("title")} description={t("description")} />
      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
        <TabsList items={TABS.map((x) => ({ value: x, label: x === "closed" ? t("closed") : statusLabel("roadmap_idea", x), count: countOf(x) }))} />
      </Tabs>
      <Input
        size="sm"
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        aria-label={t("search")}
        placeholder={t("search")}
        startIcon={<MagnifyingGlass className="size-4" />}
        className="w-full sm:w-72"
      />
      <DataTable
        label={t("tableLabel")}
        columns={columns}
        data={data?.items ?? []}
        getRowId={(r) => r.id}
        status={status}
        paginate={(data?.total ?? 0) > 25}
        onRetry={refetch}
        className={isFetching && !isLoading ? "opacity-70" : undefined}
        empty={
          search
            ? {
                title: t("noMatch"),
                action: (
                  <Button size="sm" variant="secondary" startIcon={<X />} onClick={() => setSearch("")}>
                    {t("clear")}
                  </Button>
                ),
              }
            : { title: t(`empty.${tab}`) }
        }
      />
      {open ? <IdeaSheet idea={open} onClose={() => setOpen(null)} /> : null}
      {acting ? <ActionDialog idea={acting.idea} action={acting.action} onClose={() => setActing(null)} /> : null}
    </div>
  );
}

export default function IdeasPage() {
  return (
    <RequirePermission permission="marketing:view">
      <IdeasList />
    </RequirePermission>
  );
}
