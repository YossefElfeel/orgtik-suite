"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowRight, PencilSimple, Plus, Trash } from "@phosphor-icons/react";
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
  PageHeader,
  Select,
  toast,
} from "@orgtik/ui";
import { DataTable, type ColumnDef } from "@orgtik/ui/table";
import { RequirePermission } from "@/components/frame/RequirePermission";
import { useCan } from "@/lib/permissions";
import { statusOf, useDeleteRedirectMutation, useRedirectsQuery, useSaveRedirectMutation, type ApiError, type Redirect } from "@/store/api";

type Draft = { id?: string; version?: number; from: string; to: string; code: number; note: string };

function RedirectDialog({ initial, onClose }: { initial: Draft; onClose: () => void }) {
  const t = useTranslations("Seo");
  const [d, setD] = useState<Draft>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [save, saving] = useSaveRedirectMutation();
  const err = (k: string) => (errors[k] ? t(`redirectErrors.${errors[k]}`) : undefined);
  const submit = () => {
    setErrors({});
    save({ ...d, note: d.note || undefined })
      .unwrap()
      .then(() => {
        toast.success(t(initial.id ? "redirectSaved" : "redirectAdded"));
        onClose();
      })
      .catch((e: ApiError) => {
        if (e.status === 422 && e.fieldErrors) setErrors(e.fieldErrors);
        else if (e.status === 412) toast.error(t("stale"));
        else toast.error(t("failed"));
      });
  };
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>{t(initial.id ? "editRedirect" : "addRedirect")}</DialogTitle>
          <DialogDescription>{t("redirectHelp")}</DialogDescription>
        </DialogHeader>
        <DialogBody className="flex flex-col gap-4">
          <Field label={t("from")} description={t("fromHelp")} error={err("from")}>
            <Input dir="ltr" value={d.from} onChange={(e) => setD({ ...d, from: e.target.value })} placeholder="/old-address" />
          </Field>
          <Field label={t("to")} description={t("toHelp")} error={err("to")}>
            <Input dir="ltr" value={d.to} onChange={(e) => setD({ ...d, to: e.target.value })} placeholder="/new-address" />
          </Field>
          <Field label={t("code")} error={err("code")}>
            <Select value={String(d.code)} onValueChange={(v) => v && setD({ ...d, code: Number(v) })} options={[{ value: "301", label: t("code301") }, { value: "302", label: t("code302") }]} />
          </Field>
          <Field label={t("note")}>
            <Input dir="auto" value={d.note} onChange={(e) => setD({ ...d, note: e.target.value })} />
          </Field>
        </DialogBody>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            {t("cancel")}
          </Button>
          <Button loading={saving.isLoading} disabled={!d.from || !d.to} onClick={submit}>
            {t(initial.id ? "save" : "addRedirect")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Redirects() {
  const t = useTranslations("Seo");
  const can = useCan();
  const editable = can("seo:edit");
  const { data, isLoading, error, refetch } = useRedirectsQuery({ pageSize: 100 });
  const [remove] = useDeleteRedirectMutation();
  const [editing, setEditing] = useState<Draft | null>(null);

  const columns = useMemo<ColumnDef<Redirect, any>[]>(
    () => [
      {
        id: "route",
        header: t("colRoute"),
        cell: ({ row }) => (
          // Addresses read left to right in every language.
          <span dir="ltr" className="inline-flex flex-wrap items-center gap-2 font-mono text-body-sm">
            <span className="text-fg">{row.original.from}</span>
            <ArrowRight aria-label={t("to")} className="size-4 text-fg-subtle" />
            <span className="text-fg-muted">{row.original.to}</span>
          </span>
        ),
      },
      { id: "code", header: t("code"), cell: ({ row }) => <Badge size="sm">{row.original.code}</Badge> },
      {
        id: "source",
        header: t("colSource"),
        cell: ({ row }) => (
          <span className="flex flex-col">
            <span className="text-fg-muted">{t(row.original.source === "website" ? "fromWebsite" : row.original.source === "address_change" ? "fromAddressChange" : "addedHere")}</span>
            {row.original.handledBy === "browser" ? <span className="text-caption text-fg-subtle">{t("handledByBrowser")}</span> : null}
            {row.original.note ? <span dir="auto" className="text-caption text-fg-subtle">{row.original.note}</span> : null}
          </span>
        ),
      },
      {
        id: "actions",
        header: () => <span className="sr-only">{t("colActions")}</span>,
        meta: { numeric: true },
        cell: ({ row }) =>
          editable ? (
            <span className="inline-flex gap-1">
              <IconButton size="sm" variant="ghost" icon={<PencilSimple />} label={t("editFor", { from: row.original.from })} onClick={() => setEditing({ ...row.original, note: row.original.note ?? "" })} />
              <ConfirmDialog
                trigger={<IconButton size="sm" variant="ghost" icon={<Trash />} label={t("deleteFor", { from: row.original.from })} />}
                tone="danger"
                title={t("deleteTitle", { from: row.original.from })}
                impact={t("deleteImpact")}
                confirmLabel={t("delete")}
                onConfirm={() => remove(row.original.id).unwrap().then(() => toast.success(t("deleted")))}
              />
            </span>
          ) : null,
      },
    ],
    [t, editable, remove],
  );

  const status = isLoading ? "loading" : error ? (statusOf(error) === 403 ? "forbidden" : "error") : "ready";
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t("redirectsTitle")}
        description={t("redirectsDescription")}
        actions={editable ? <Button startIcon={<Plus />} onClick={() => setEditing({ from: "", to: "", code: 301, note: "" })}>{t("addRedirect")}</Button> : null}
      />
      <DataTable label={t("redirectsTitle")} columns={columns} data={data?.items ?? []} getRowId={(r) => r.id} status={status} paginate={(data?.total ?? 0) > 25} onRetry={refetch} empty={{ title: t("noRedirects") }} />
      {editing ? <RedirectDialog initial={editing} onClose={() => setEditing(null)} /> : null}
    </div>
  );
}

export default function RedirectsPage() {
  return (
    <RequirePermission permission="seo:view">
      <Redirects />
    </RequirePermission>
  );
}
