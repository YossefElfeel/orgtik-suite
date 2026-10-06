"use client";

// Pick who reviews a post or a campaign. The old picker used clickable rows with a decorative
// checkbox inside, palette colours per avatar, and English strings; now each person is a real
// checkbox with their name, email and job title, and the list has loading, error and no-match
// states. The props are the same, so the campaign screens keep working.
import { isValidElement, useEffect, useMemo, useState, type ReactElement, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { MagnifyingGlass } from "@phosphor-icons/react";
import {
  Avatar,
  Button,
  Checkbox,
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  EmptyState,
  ErrorState,
  Input,
  LoadingState,
} from "@orgtik/ui";
import { useAddReviewersQuery } from "@/redux/features/posts/postsApi";

export interface ApproverOption {
  id: number;
  name: string;
  email: string;
  avatar?: string;
  role?: string;
}

interface AddApproversDialogProps {
  /** The element that opens the dialog (a button). */
  children?: ReactNode;
  /** Currently assigned approvers: pre-selected when the dialog opens. */
  selectedApprovers?: ApproverOption[];
  onApply: (selected: ApproverOption[]) => void;
  /** Controlled open state (optional, for flows without a trigger). */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const key = (ids: (string | number)[]) => ids.map(String).sort().join(",");

export default function AddApproversDialog({ children, selectedApprovers = [], onApply, open: controlledOpen, onOpenChange }: AddApproversDialogProps) {
  const t = useTranslations("ApproversDialog");
  const [ownOpen, setOwnOpen] = useState(false);
  const open = controlledOpen ?? ownOpen;
  const setOpen = (next: boolean) => {
    if (controlledOpen === undefined) setOwnOpen(next);
    onOpenChange?.(next);
    if (!next) setSearch("");
  };
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<number[]>([]);

  useEffect(() => {
    const id = setTimeout(() => setQuery(search.trim()), 250);
    return () => clearTimeout(id);
  }, [search]);

  const initial = useMemo(() => key(selectedApprovers.map((a) => a.id)), [selectedApprovers]);
  useEffect(() => {
    if (open) setSelected(selectedApprovers.map((a) => Number(a.id)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const { data, isLoading, isError, refetch } = useAddReviewersQuery({ search: query || undefined, limit: 50 }, { skip: !open });

  const people = useMemo<ApproverOption[]>(
    () =>
      (data?.data?.items ?? []).map((u) => {
        const name = `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || u.email;
        return { id: Number(u.id), name, email: u.email, avatar: u.avatar ?? undefined, role: u.profile?.jobTitle ?? undefined };
      }),
    [data],
  );
  // People already chosen but outside the current search stay listed, so they can be unticked.
  const extra = selectedApprovers.filter((a) => selected.includes(Number(a.id)) && !people.some((p) => p.id === Number(a.id)) && !query);
  const rows = [...extra, ...people];

  const toggle = (id: number, on: boolean) => setSelected((prev) => (on ? [...new Set([...prev, id])] : prev.filter((x) => x !== id)));
  const changed = key(selected) !== initial;

  const apply = () => {
    const byId = new Map<number, ApproverOption>();
    for (const a of selectedApprovers) byId.set(Number(a.id), a);
    for (const p of people) byId.set(p.id, p);
    onApply(selected.map((id) => byId.get(id)).filter((x): x is ApproverOption => Boolean(x)));
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {children && isValidElement(children) ? <DialogTrigger render={children as ReactElement<Record<string, unknown>>} /> : null}
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>
        <DialogBody className="flex flex-col gap-3">
          <Input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            startIcon={<MagnifyingGlass />}
            placeholder={t("search")}
            aria-label={t("search")}
          />
          {isLoading ? (
            <LoadingState rows={4} label={t("loading")} />
          ) : isError ? (
            <ErrorState size="compact" title={t("errorTitle")} description={t("errorBody")} onRetry={() => refetch()} />
          ) : rows.length === 0 ? (
            <EmptyState size="compact" title={query ? t("noMatch") : t("emptyTitle")} description={query ? t("noMatchBody") : t("emptyBody")} />
          ) : (
            <ul className="flex max-h-80 flex-col gap-1 overflow-y-auto" aria-label={t("people")}>
              {rows.map((p) => (
                <li key={p.id} className="flex items-center gap-3 rounded-field px-2 py-2 hover:bg-hover">
                  <Checkbox
                    checked={selected.includes(p.id)}
                    onCheckedChange={(on) => toggle(p.id, Boolean(on))}
                    label={
                      <span className="flex min-w-0 items-center gap-3">
                        <Avatar name={p.name} src={p.avatar} size="sm" decorative />
                        <span className="flex min-w-0 flex-col">
                          <span dir="auto" className="truncate text-body text-fg">
                            {p.name}
                          </span>
                          <span className="truncate text-caption text-fg-muted">
                            <bdi dir="ltr">{p.email}</bdi>
                            {p.role ? <> · <span dir="auto">{p.role}</span></> : null}
                          </span>
                        </span>
                      </span>
                    }
                  />
                </li>
              ))}
            </ul>
          )}
          <p className="text-caption text-fg-muted" aria-live="polite">
            {t("selectedCount", { count: selected.length })}
          </p>
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
            {t("cancel")}
          </Button>
          <Button type="button" variant="primary" onClick={apply} disabled={!changed}>
            {t("apply")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
