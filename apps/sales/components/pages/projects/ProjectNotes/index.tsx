"use client";

// The team's contact notes on a project, newest first: who wrote each and when, with edit and a
// confirmed delete. Loading, an error with Retry and the empty state each say so.
import { useState } from "react";
import { useTranslations } from "next-intl";
import { PencilSimple, Plus, Trash } from "@phosphor-icons/react";
import { Button, Card, CardHeader, ConfirmDialog, ErrorState, IconButton, Skeleton } from "@orgtik/ui";
import ContactNoteDialog from "@/components/dialogs/projects/ContactNoteDialog";
import { useRole } from "@/hooks/useRole";
import { useDeleteContactNoteMutation, useGetContactNotesQuery } from "@/redux/features/projects/projectsApi";
import { useDealFormat } from "@/lib/deals/format";
import type { ProjectContactNote } from "@/types/projects";

export default function ProjectNotes({ projectId }: { projectId: string }) {
  const t = useTranslations("Projects");
  const fmt = useDealFormat();
  const { canEdit } = useRole();
  const { data, isLoading, isError, refetch } = useGetContactNotesQuery(projectId);
  const [remove] = useDeleteContactNoteMutation();
  // The note being edited stays set while its dialog closes, so the dialog doesn't change under the animation.
  const [editing, setEditing] = useState<ProjectContactNote | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<ProjectContactNote | null>(null);
  const notes = data?.data ?? [];

  return (
    <Card className="flex flex-col gap-4">
      <CardHeader
        title={t("notesTitle")}
        actions={
          canEdit ? (
            <Button variant="secondary" size="sm" onClick={() => setAdding(true)} startIcon={<Plus aria-hidden className="size-4" />}>
              {t("noteAdd")}
            </Button>
          ) : null
        }
      />
      {isLoading ? (
        <div className="flex flex-col gap-2" aria-busy="true">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : isError ? (
        <ErrorState size="compact" title={t("notesError")} onRetry={() => void refetch()} />
      ) : notes.length === 0 ? (
        <p className="text-body-sm text-fg-muted">{t("notesEmpty")}</p>
      ) : (
        <ul className="flex flex-col divide-y divide-line">
          {notes.map((n) => (
            <li key={n.id} className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
              <div className="flex min-w-0 flex-col gap-1">
                <p dir="auto" className="text-body whitespace-pre-line text-fg">
                  {n.content}
                </p>
                <span className="text-caption text-fg-muted">
                  <span dir="auto">{n.createdBy}</span> · <time dateTime={n.createdAt}>{fmt.dateTime(n.createdAt)}</time>
                </span>
              </div>
              {canEdit ? (
                <span className="flex shrink-0 gap-1">
                  <IconButton variant="ghost" size="sm" label={t("noteEdit")} icon={<PencilSimple />} onClick={() => {
                      setEditing(n);
                      setEditOpen(true);
                    }}
                  />
                  <IconButton variant="ghost" size="sm" label={t("noteDelete")} icon={<Trash />} onClick={() => setDeleting(n)} />
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      )}
      <ContactNoteDialog projectId={projectId} open={adding} onOpenChange={setAdding} />
      {editing ? <ContactNoteDialog projectId={projectId} note={editing} open={editOpen} onOpenChange={setEditOpen} /> : null}
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={t("noteDeleteTitle")}
        impact={t("noteDeleteImpact")}
        confirmLabel={t("noteDeleteConfirm")}
        irreversible
        onConfirm={() => (deleting ? remove({ id: projectId, noteId: deleting.id }).unwrap() : undefined)}
      />
    </Card>
  );
}
