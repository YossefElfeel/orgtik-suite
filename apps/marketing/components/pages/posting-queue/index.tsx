"use client";
import { useTranslations, useFormatter } from "next-intl";
import { useState } from "react";
import {
  Badge,
  Button,
  EmptyState,
  ErrorState,
  LoadingState,
  useSuite,
} from "@orgtik/ui";
import { Board } from "@orgtik/ui";
import {
  useMarketingChangeMutation,
  useMarketingQueueQuery,
} from "@/redux/features/marketing-v3/marketingApi";
import { useMarketingRoles } from "@/lib/permissions";
import { useProjectContext } from "@/lib/project-context";
import { useRouter } from "@/i18n/routing";
import { ButtonLink } from "@/components/shared/ButtonLink";
import { ZonedDateTimeField } from "@/components/pages/campaigns/shared/ZonedDateTimeField";
import MarketingProjectFrame from "@/components/shared/MarketingProjectFrame";
import { MarketingStatus } from "@/components/shared/MarketingStatus";
import type { QueuePost } from "@/types/marketing-v3";
const stage = (status: string) =>
  status === "PENDING"
    ? "review"
    : ["PUBLISHED", "PARTIAL"].includes(status)
      ? "published"
      : ["FAILED", "CANCELED"].includes(status)
        ? "failed"
        : status.toLowerCase();
function ScheduleRow({ post }: { post: QueuePost }) {
  const t = useTranslations("MarketingV3"),
    suite = useSuite(),
    [value, setValue] = useState(post.scheduledAt),
    [change, state] = useMarketingChangeMutation();
  return (
    <li className="flex flex-wrap items-end gap-4 py-4">
      <p className="min-w-48 flex-1 text-body font-semibold" dir="auto">
        {post.title}
      </p>
      <ZonedDateTimeField
        legend={t("schedule")}
        value={value}
        onChange={setValue}
        min={suite.snapshot?.now}
        required
        disabled={state.isLoading}
      />
      <Button
        variant="secondary"
        disabled={!value}
        loading={state.isLoading}
        onClick={async () => {
          try {
            await change({
              path: `/v3/queue/${encodeURIComponent(post.id)}`,
              method: "PATCH",
              body: { scheduledAt: value, status: "SCHEDULED" },
            }).unwrap();
          } catch {}
        }}
      >
        {t("save")}
      </Button>
    </li>
  );
}
export default function PostingQueue() {
  const t = useTranslations("MarketingV3"),
    f = useFormatter(),
    query = useMarketingQueueQuery(),
    [change] = useMarketingChangeMutation(),
    can = useMarketingRoles(),
    project = useProjectContext(),
    router = useRouter();
  return (
    <MarketingProjectFrame title={t("queue")}>
      <p className="max-w-prose text-body-sm text-fg-muted">{t("queueHint")}</p>
      {can.editPosts ? (
        <ButtonLink className="self-start" href="/posts/create-post">
          {t("newPost")}
        </ButtonLink>
      ) : null}
      {query.isError ? (
        <ErrorState
          title={t("loadError")}
          onRetry={() => void query.refetch()}
        />
      ) : query.isLoading ? (
        <LoadingState rows={6} />
      ) : !query.data?.length ? (
        <EmptyState title={t("empty")} />
      ) : (
        <>
          <Board
            label={t("queue")}
            columns={[
              "draft",
              "scheduled",
              "review",
              "published",
              "failed",
            ].map((id) => ({
              id,
              title: t(id),
              locked: !["draft", "scheduled"].includes(id),
            }))}
            items={query.data.map((post) => ({
              ...post,
              columnId: stage(post.status),
            }))}
            readOnly={!can.editPosts}
            canDrag={(item) => item.canMove}
            canDrop={(item, column) =>
              column.id === "draft" ||
              (column.id === "scheduled" &&
                Boolean(item.scheduledAt) &&
                ["APPROVED", "NOT_REQUIRED"].includes(item.approvalStatus))
            }
            onOpen={(item) => router.push(`/posts/${item.id}`)}
            onMove={async (move) => {
              await change({
                path: `/v3/queue/${encodeURIComponent(move.itemId)}`,
                method: "PATCH",
                body: {
                  status: move.toColumnId.toUpperCase(),
                  beforeId: move.beforeId,
                  afterId: move.afterId,
                },
              }).unwrap();
            }}
            renderCard={(item) => (
              <div className="flex flex-col gap-2">
                <MarketingStatus
                  kind="approval"
                  value={item.approvalStatus}
                  size="sm"
                />
                {item.scheduledAt ? (
                  <p className="text-caption text-fg-muted">
                    {f.dateTime(new Date(item.scheduledAt), {
                      dateStyle: "medium",
                      timeStyle: "short",
                      timeZone: project.timeZone,
                    })}
                  </p>
                ) : null}
              </div>
            )}
          />
          {can.editPosts ? (
            <ul className="divide-y divide-line">
              {query.data
                .filter(
                  (post) =>
                    post.canMove &&
                    ["APPROVED", "NOT_REQUIRED"].includes(post.approvalStatus),
                )
                .map((post) => (
                  <ScheduleRow
                    key={`${post.id}:${post.scheduledAt}`}
                    post={post}
                  />
                ))}
            </ul>
          ) : null}
        </>
      )}
    </MarketingProjectFrame>
  );
}
