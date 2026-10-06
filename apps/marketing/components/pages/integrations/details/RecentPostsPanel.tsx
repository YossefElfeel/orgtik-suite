"use client";

// The account's latest published posts and how each did. The old table said every post was an
// image, and formatted dates in English whatever the language.
import { useTranslations } from "next-intl";
import { ArrowSquareOut } from "@phosphor-icons/react";
import { useFormatter } from "@orgtik/ui";
import { DataTable, type ColumnDef } from "@orgtik/ui/table";
import { platformMeta } from "@/components/shared/PlatformBadge";
import { useProjectContext } from "@/lib/project-context";
import type { IntegrationResponse, RecentPostItem } from "@/types/integrations";

type Posts = IntegrationResponse["analytics"]["recentPosts"] | undefined;

export function RecentPostsPanel({ posts, platform }: { posts: Posts; platform: string }) {
  const t = useTranslations("IntegrationDetail");
  const f = useFormatter();
  const { timeZone } = useProjectContext();
  const items = posts?.items ?? [];
  const name = platformMeta(platform).name;
  const num = (v: number | null | undefined) => f.number(v ?? 0);

  const columns: ColumnDef<RecentPostItem>[] = [
    {
      id: "content",
      header: t("colPost"),
      meta: { truncate: true },
      cell: ({ row }) => (
        <span dir="auto" className="block truncate text-fg" title={row.original.content}>
          {row.original.content || t("noText")}
        </span>
      ),
    },
    {
      id: "postedAt",
      header: t("colPublished"),
      meta: { numeric: true },
      cell: ({ row }) => f.date(row.original.postedAt, { dateStyle: "medium", timeStyle: "short", timeZone }),
    },
    { id: "impressions", header: t("impressions"), meta: { numeric: true }, cell: ({ row }) => num(row.original.impressions) },
    { id: "likes", header: t("colLikes"), meta: { numeric: true }, cell: ({ row }) => num(row.original.likeCount) },
    { id: "comments", header: t("colComments"), meta: { numeric: true }, cell: ({ row }) => num(row.original.commentCount) },
    { id: "shares", header: t("colShares"), meta: { numeric: true }, cell: ({ row }) => num(row.original.shareCount) },
    {
      id: "rate",
      header: t("engagementRate"),
      meta: { numeric: true },
      cell: ({ row }) => f.percent((row.original.engagementRate ?? 0) / 100, 2),
    },
    {
      id: "link",
      header: () => <span className="sr-only">{t("colLink")}</span>,
      meta: { width: "1%" },
      cell: ({ row }) =>
        row.original.url ? (
          <a
            href={row.original.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-field text-body-sm text-fg-brand hover:underline focus-visible:outline-2 focus-visible:outline-focus"
          >
            {t("viewOn", { platform: name })}
            <ArrowSquareOut aria-hidden className="size-4 rtl:-scale-x-100" />
            <span className="sr-only">{t("opensNewTab")}</span>
          </a>
        ) : null,
    },
  ];

  return (
    <DataTable
      label={t("postsLabel")}
      columns={columns}
      data={items}
      getRowId={(r) => r.id}
      status="ready"
      paginate={items.length > 25}
      empty={{ title: t("postsEmptyTitle"), description: t("postsEmptyBody", { platform: name }) }}
    />
  );
}
