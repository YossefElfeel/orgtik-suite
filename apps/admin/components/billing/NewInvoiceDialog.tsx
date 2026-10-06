"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, Trash } from "@phosphor-icons/react";
import { Button, Combobox, Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Field, IconButton, Input, MoneyField, toast, useFormatter } from "@orgtik/ui";
import { useErrorText } from "@/components/customers/shared";
import { useRouter } from "@/i18n/routing";
import type { ApiError } from "@/store/api";
import { useCreateInvoiceMutation } from "@/store/billing";
import { useWorkspacesQuery } from "@/store/customers";

type Row = { key: number; label: string; amount: number | null };

/** A manual invoice (ADM-23): a workspace and its lines, saved as a draft in the workspace's currency. */
export function NewInvoiceDialog({ onClose, workspaceId }: { onClose: () => void; workspaceId?: string }) {
  const t = useTranslations("Billing");
  const tc = useTranslations("Common");
  const f = useFormatter();
  const router = useRouter();
  const errorText = useErrorText();
  const workspaces = useWorkspacesQuery({ pageSize: 100 });
  const [create, state] = useCreateInvoiceMutation();
  const [ws, setWs] = useState<string | null>(workspaceId ?? null);
  const [rows, setRows] = useState<Row[]>([{ key: 1, label: "", amount: null }]);
  const [errors, setErrors] = useState<{ workspace?: string; lines?: string; form?: string }>({});
  const chosen = workspaces.data?.items.find((w) => w.id === ws);
  const currency = chosen?.currency;
  const subtotal = rows.reduce((s, r) => s + (r.amount ?? 0), 0);
  const update = (key: number, patch: Partial<Row>) => setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  const submit = () => {
    const e: typeof errors = {};
    if (!ws) e.workspace = tc("required");
    if (!rows.length || rows.some((r) => !r.label.trim() || !(r.amount && r.amount > 0))) e.lines = t("create.linesInvalid");
    setErrors(e);
    if (Object.keys(e).length) return;
    create({ workspaceId: ws!, lines: rows.map((r) => ({ label: r.label.trim(), amount: r.amount! })) })
      .unwrap()
      .then((inv) => {
        toast.success(t("create.done", { number: inv.number }));
        onClose();
        router.push(`/invoices/${inv.id}`);
      })
      .catch((err: ApiError) => {
        const fe = err.fieldErrors ?? {};
        setErrors({ workspace: fe.workspaceId ? tc("required") : undefined, lines: fe.lines ? t("create.linesInvalid") : undefined, form: fe.workspaceId || fe.lines ? undefined : errorText(err) });
      });
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>{t("create.title")}</DialogTitle>
          <DialogDescription>{t("create.description")}</DialogDescription>
        </DialogHeader>
        <DialogBody className="flex flex-col gap-4">
          <Field label={t("create.workspace")} description={currency ? t("create.currency", { currency }) : undefined} error={errors.workspace} required>
            <Combobox
              value={ws}
              onValueChange={setWs}
              placeholder={workspaces.isLoading ? tc("loading") : t("create.pickWorkspace")}
              emptyText={t("create.noWorkspace")}
              options={(workspaces.data?.items ?? []).map((w) => ({ value: w.id, label: w.name, hint: w.currency }))}
              required
            />
          </Field>
          <fieldset className="flex flex-col gap-3">
            <legend className="mb-1 text-label text-fg">{t("create.lines")}</legend>
            {rows.map((r, i) => (
              <div key={r.key} className="flex flex-col gap-2 rounded-card border border-line p-3 sm:flex-row sm:items-end">
                <Field label={t("create.lineLabel", { n: i + 1 })} className="flex-1">
                  <Input dir="auto" value={r.label} onChange={(e) => update(r.key, { label: e.target.value })} />
                </Field>
                <Field label={t("create.lineAmount", { n: i + 1 })} className="sm:w-40">
                  {currency ? <MoneyField currency={currency} value={r.amount} onValueChange={(v) => update(r.key, { amount: v })} min={0} /> : <Input disabled placeholder={t("create.pickFirst")} />}
                </Field>
                {rows.length > 1 ? <IconButton variant="ghost" label={t("create.removeLine", { n: i + 1 })} icon={<Trash />} onClick={() => setRows((rs) => rs.filter((x) => x.key !== r.key))} /> : null}
              </div>
            ))}
            {errors.lines ? (
              <p role="alert" className="text-body-sm text-danger">
                {errors.lines}
              </p>
            ) : null}
            <Button size="sm" variant="ghost" className="self-start" startIcon={<Plus />} onClick={() => setRows((rs) => [...rs, { key: Math.max(0, ...rs.map((x) => x.key)) + 1, label: "", amount: null }])}>
              {t("create.addLine")}
            </Button>
          </fieldset>
          {currency ? <p className="text-body-sm text-fg-muted">{t("create.subtotal", { amount: f.money(subtotal, currency) })}</p> : null}
          {errors.form ? (
            <p role="alert" className="rounded-field bg-danger-subtle px-3 py-2 text-body-sm text-danger">
              {errors.form}
            </p>
          ) : null}
        </DialogBody>
        <DialogFooter>
          <Button variant="secondary" onClick={onClose} disabled={state.isLoading}>
            {tc("cancel")}
          </Button>
          <Button variant="primary" loading={state.isLoading} onClick={submit}>
            {t("create.submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
