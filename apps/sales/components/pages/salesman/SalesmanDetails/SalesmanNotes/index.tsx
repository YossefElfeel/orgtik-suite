"use client";

// Notes on a salesperson, newest first, each kept by its id. Admins add them; a failed save keeps
// the draft. The API has no edit or delete for these notes yet (reported), so there is none here.
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Avatar, Button, Card, CardHeader, EmptyState, ErrorState, LoadingState, Textarea } from "@orgtik/ui";
import { RHFField } from "@orgtik/ui/rhf";
import { useRole } from "@/hooks/useRole";
import { useCreateSalesmanNoteMutation, useGetSalesmanNotesQuery } from "@/redux/features/salesman/salesmanApi";
import { useTeamFormat } from "@/lib/commissions";
import { salesmanNoteSchema, type SalesmanNoteFormValues } from "@/schemas/salesman";

export default function SalesmanNotes({ salesmanId }: { salesmanId: string }) {
  const t = useTranslations("Team.salespeople");
  const tForm = useTranslations("Team.form");
  const f = useTeamFormat();
  const { isAdmin, canEdit } = useRole();
  const notes = useGetSalesmanNotesQuery(salesmanId);
  const [createNote, { isLoading: saving }] = useCreateSalesmanNoteMutation();
  const schema = useMemo(() => salesmanNoteSchema(tForm), [tForm]);
  const form = useForm<SalesmanNoteFormValues>({ resolver: zodResolver(schema), defaultValues: { content: "" } });
  const list = notes.data?.data ?? [];
  const canAdd = isAdmin && canEdit;

  const add = form.handleSubmit(async ({ content }) => {
    try {
      await createNote({ id: salesmanId, body: { content } }).unwrap();
      form.reset({ content: "" });
    } catch {
      // The draft stays; the request's toast says why.
    }
  });

  return (
    <Card className="flex flex-col gap-5">
      <CardHeader title={t("notesTitle")} description={canAdd ? undefined : t("notesReadOnly")} />
      {canAdd ? (
        <form onSubmit={add} noValidate className="flex flex-col gap-3">
          <RHFField
            control={form.control}
            name="content"
            label={t("noteLabel")}
            render={(field) => <Textarea dir="auto" rows={3} placeholder={t("notePlaceholder")} {...field} />}
          />
          <div className="flex justify-end">
            <Button type="submit" variant="primary" loading={saving}>
              {t("addNote")}
            </Button>
          </div>
        </form>
      ) : null}
      {notes.isLoading ? (
        <LoadingState rows={3} label={t("notesTitle")} />
      ) : notes.isError ? (
        <ErrorState size="compact" title={t("notesErrorTitle")} onRetry={() => void notes.refetch()} />
      ) : list.length === 0 ? (
        <EmptyState size="compact" title={t("notesEmptyTitle")} description={canAdd ? t("notesEmptyBody") : undefined} />
      ) : (
        <ul className="flex flex-col gap-3">
          {list.map((n) => (
            <li key={n.id} className="flex gap-3 rounded-card border border-line bg-sunken p-4">
              <Avatar size="sm" name={n.createdBy || "?"} decorative />
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <p className="flex flex-wrap items-baseline gap-x-2 text-body-sm">
                  <span dir="auto" className="font-semibold text-fg">
                    {n.createdBy || t("someone")}
                  </span>
                  <time dateTime={n.createdAt} className="text-caption text-fg-subtle">
                    {f.dateTime(n.createdAt)}
                  </time>
                </p>
                <p dir="auto" className="whitespace-pre-wrap break-words text-body text-fg">
                  {n.content}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
