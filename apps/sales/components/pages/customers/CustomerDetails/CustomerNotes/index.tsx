"use client";

// Notes on the customer. A note is edited and deleted by its id, so a note someone else adds in
// the meantime can't make you change the wrong one (SAL-076). A note that fails to save stays in
// the box (SAL-077); deleting asks first (SAL-078); Edit and Delete are always visible, not only on
// hover (SAL-117); the Add button is a real button beside the box (SAL-098).
import { useState } from "react";
import { useTranslations } from "next-intl";
import { PencilSimple, Trash } from "@phosphor-icons/react";
import { Button, Card, CardHeader, ConfirmDialog, EmptyState, Field, IconButton, Textarea, toast } from "@orgtik/ui";
import { NOTE_GONE, useCreateNoteMutation, useDeleteNoteMutation, useUpdateNoteMutation } from "@/redux/features/customers/customersApi";
import { useRole } from "@/hooks/useRole";
import type { CustomerDetail, CustomerNote } from "@/types/customers";
import { useCustomerDates } from "../../leads";

const textOf = (n: CustomerNote) => n.note ?? n.content ?? "";
const gone = (e: unknown) => (e as { data?: { code?: string } })?.data?.code === NOTE_GONE;

export default function CustomerNotes({ customer }: { customer: CustomerDetail }) {
  const t = useTranslations("Customers.notes");
  const dates = useCustomerDates();
  const { canEdit } = useRole();
  const [createNote, creating] = useCreateNoteMutation();
  const [updateNote, updating] = useUpdateNoteMutation();
  const [deleteNote] = useDeleteNoteMutation();
  const [draft, setDraft] = useState("");
  const [editing, setEditing] = useState<{ id: string; text: string } | null>(null);
  const [removing, setRemoving] = useState<CustomerNote | null>(null);
  const notes = customer.notes ?? [];

  const add = async () => {
    const note = draft.trim();
    if (!note) return;
    try {
      await createNote({ id: customer.id, note }).unwrap();
      setDraft("");
    } catch {
      // The draft stays; the app's toast says why.
    }
  };

  const save = async () => {
    if (!editing || !editing.text.trim()) return;
    try {
      await updateNote({ id: customer.id, noteId: editing.id, note: editing.text.trim() }).unwrap();
      setEditing(null);
    } catch (e) {
      if (gone(e)) {
        toast.error(t("gone"));
        setEditing(null);
      }
    }
  };

  return (
    <Card padding="lg" className="flex flex-col gap-4">
      <CardHeader title={t("title")} description={t("count", { count: notes.length })} />
      {notes.length ? (
        <ul className="flex flex-col divide-y divide-line">
          {notes.map((n) => (
            <li key={n.id} className="flex flex-col gap-2 py-3 first:pt-0">
              <div className="flex items-start justify-between gap-3">
                <p className="text-caption text-fg-muted">
                  {n.createdBy ? <span dir="auto">{n.createdBy}</span> : null}
                  {n.createdBy ? " · " : null}
                  <time dateTime={n.createdAt} title={dates.shortDateTime(n.createdAt)}>
                    {dates.relative(n.createdAt)}
                  </time>
                </p>
                {canEdit && editing?.id !== n.id ? (
                  <span className="flex shrink-0 items-center gap-1">
                    <IconButton size="sm" variant="ghost" label={t("edit", { date: dates.shortDateTime(n.createdAt) })} icon={<PencilSimple />} onClick={() => setEditing({ id: n.id, text: textOf(n) })} />
                    <IconButton size="sm" variant="ghost" label={t("delete", { date: dates.shortDateTime(n.createdAt) })} icon={<Trash />} onClick={() => setRemoving(n)} />
                  </span>
                ) : null}
              </div>
              {editing?.id === n.id ? (
                <form
                  className="flex flex-col gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void save();
                  }}
                >
                  <Field label={t("editLabel")}>
                    <Textarea dir="auto" rows={3} maxRows={10} autoFocus value={editing.text} onChange={(e) => setEditing({ id: n.id, text: e.target.value })} />
                  </Field>
                  <span className="flex justify-end gap-2">
                    <Button type="button" variant="ghost" size="sm" disabled={updating.isLoading} onClick={() => setEditing(null)}>
                      {t("cancel")}
                    </Button>
                    <Button type="submit" variant="primary" size="sm" loading={updating.isLoading} disabled={!editing.text.trim()}>
                      {t("save")}
                    </Button>
                  </span>
                </form>
              ) : (
                <p className="whitespace-pre-line text-body text-fg" dir="auto">
                  {textOf(n)}
                </p>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState size="compact" title={t("emptyTitle")} description={canEdit ? t("emptyBody") : undefined} />
      )}

      {canEdit ? (
        <form
          className="flex flex-col gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void add();
          }}
        >
          <Field label={t("newLabel")}>
            <Textarea dir="auto" rows={2} maxRows={8} value={draft} placeholder={t("placeholder")} onChange={(e) => setDraft(e.target.value)} />
          </Field>
          <span className="flex justify-end">
            <Button type="submit" variant="primary" size="sm" loading={creating.isLoading} disabled={!draft.trim()}>
              {t("add")}
            </Button>
          </span>
        </form>
      ) : null}

      <ConfirmDialog
        open={Boolean(removing)}
        onOpenChange={(o) => !o && setRemoving(null)}
        tone="danger"
        irreversible
        title={t("deleteTitle")}
        impact={removing ? t("deleteImpact", { date: dates.shortDateTime(removing.createdAt) }) : ""}
        confirmLabel={t("deleteConfirm")}
        cancelLabel={t("cancel")}
        onConfirm={async () => {
          if (!removing) return;
          try {
            await deleteNote({ id: customer.id, noteId: removing.id }).unwrap();
          } catch (e) {
            if (!gone(e)) throw e;
            toast.error(t("gone"));
          }
        }}
      />
    </Card>
  );
}
