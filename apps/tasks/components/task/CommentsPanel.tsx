"use client";

// A task's comments: the composer, then the thread as the API orders it (newest first), the
// first few with "Show all" for the rest. Viewers and "View as" sessions read only.
import { useState } from "react";
import { useTranslations } from "next-intl";
import { ChatCircle } from "@phosphor-icons/react";
import { Button, EmptyState, ErrorState, LoadingState } from "@orgtik/ui";
import { useGetCommentsQuery } from "@/redux/features/comments/commentsApi";
import type { IProjectMember } from "@/types/projects";
import { CommentComposer } from "./comments/CommentComposer";
import { CommentItem } from "./comments/CommentItem";

const FIRST_PAGE = 5;

export function CommentsPanel({ taskId, members, readOnly }: { taskId: number; members: IProjectMember[]; readOnly: boolean }) {
  const t = useTranslations("TaskComments");
  const [showAll, setShowAll] = useState(false);
  const { data, isLoading, isError, isFetching, refetch } = useGetCommentsQuery(taskId, { skip: !taskId });
  const comments = data?.data ?? [];
  const visible = showAll ? comments : comments.slice(0, FIRST_PAGE);

  return (
    <section className="flex flex-col gap-4" aria-label={t("sectionLabel")}>
      {readOnly ? null : <CommentComposer key={taskId} taskId={taskId} members={members} mode="new" />}

      {isLoading ? (
        <LoadingState rows={3} label={t("loading")} />
      ) : isError && !data ? (
        <ErrorState title={t("errorTitle")} description={t("errorBody")} onRetry={() => void refetch()} size="compact" />
      ) : comments.length === 0 ? (
        <EmptyState
          size="compact"
          icon={<ChatCircle aria-hidden="true" />}
          title={t("emptyTitle")}
          description={readOnly ? t("emptyReadOnly") : t("emptyBody")}
        />
      ) : (
        <>
          <ul className="flex flex-col gap-5" aria-label={t("listLabel", { count: comments.length })} aria-busy={isFetching || undefined}>
            {visible.map((c) => (
              <CommentItem key={c.id} comment={c} taskId={taskId} members={members} readOnly={readOnly} />
            ))}
          </ul>
          {comments.length > FIRST_PAGE ? (
            <Button variant="secondary" size="sm" className="self-start" aria-expanded={showAll} onClick={() => setShowAll((v) => !v)}>
              {showAll ? t("showFewer") : t("showAll", { count: comments.length })}
            </Button>
          ) : null}
        </>
      )}
    </section>
  );
}
