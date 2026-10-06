"use client";

// The posts table's columns (FS-MKT-7). A post's title is the link to it (MKT-045: the only way in
// used to be "View" inside a closed popover), and the row's actions are a named menu (MKT-046).
import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Copy, DotsThreeVertical, Eye, PencilSimple, Trash } from "@phosphor-icons/react";
import { IconButton, Menu, MenuContent, MenuItem, MenuLinkItem, MenuSeparator, MenuTrigger, useFormatter } from "@orgtik/ui";
import type { ColumnDef } from "@orgtik/ui/table";
import { Link, useRouter } from "@/i18n/routing";
import { PlatformIcon, platformMeta } from "@/components/shared/PlatformBadge";
import { DeletePostDialog } from "@/components/pages/posts/DeletePostDialog";
import { AvatarStack } from "@/components/pages/posts/shared/AvatarStack";
import { LabelTag } from "@/components/pages/posts/shared/LabelTag";
import { PostStatusBadge } from "@/components/pages/posts/shared/PostStatusBadge";
import { useMarketingRoles } from "@/lib/permissions";
import { useProjectContext } from "@/lib/project-context";
import { isolate } from "@/lib/bidi";
import { useDuplicatePostMutation } from "@/redux/features/posts/postsApi";
import type { IPostListItem } from "@/types/post";

/** A component per row, so the hooks aren't called inside a cell renderer. */
function PostActions({ post }: { post: IPostListItem }) {
  const t = useTranslations("Posts");
  const locale = useLocale();
  const router = useRouter();
  const can = useMarketingRoles();
  const [duplicate] = useDuplicatePostMutation();
  const [deleting, setDeleting] = useState(false);
  const canEdit = can.editPosts && post.actions?.canEdit !== false;
  const live = post.platforms.filter((p) => p.status === "PUBLISHED").map((p) => p.platform);
  const title = post.postTitle || t("untitled");

  const copy = async () => {
    try {
      const res = await duplicate(post.id).unwrap();
      const id = res.data?.id;
      if (id) router.push(`/posts/${id}`);
    } catch {
      // The request's toast says why.
    }
  };

  return (
    <>
      <Menu>
        <MenuTrigger render={<IconButton size="sm" variant="ghost" label={t("actionsFor", { name: isolate(title) })} icon={<DotsThreeVertical weight="bold" />} />} />
        <MenuContent align="end">
          <MenuLinkItem href={`/${locale}/posts/${post.id}`} icon={<Eye />}>
            {t("view")}
          </MenuLinkItem>
          {canEdit ? (
            <MenuLinkItem href={`/${locale}/posts/${post.id}/edit`} icon={<PencilSimple />}>
              {t("edit")}
            </MenuLinkItem>
          ) : null}
          {can.editPosts ? (
            <MenuItem icon={<Copy />} onClick={copy}>
              {t("duplicate")}
            </MenuItem>
          ) : null}
          {can.editPosts ? (
            <>
              <MenuSeparator />
              <MenuItem icon={<Trash />} tone="danger" onClick={() => setDeleting(true)}>
                {t("delete")}
              </MenuItem>
            </>
          ) : null}
        </MenuContent>
      </Menu>
      {can.editPosts ? <DeletePostDialog postId={post.id} title={title} livePlatforms={live} open={deleting} onOpenChange={setDeleting} /> : null}
    </>
  );
}

export function usePostColumns(): ColumnDef<IPostListItem>[] {
  const t = useTranslations("Posts");
  const f = useFormatter();
  const { timeZone } = useProjectContext();

  return useMemo<ColumnDef<IPostListItem>[]>(
    () => [
      {
        id: "title",
        header: t("colPost"),
        meta: { truncate: true },
        cell: ({ row }) => (
          <Link href={`/posts/${row.original.id}`} dir="auto" className="block truncate font-semibold text-fg hover:underline focus-visible:outline-2 focus-visible:outline-focus">
            {row.original.postTitle || t("untitled")}
          </Link>
        ),
      },
      {
        id: "when",
        header: t("colWhen"),
        meta: { numeric: true },
        cell: ({ row }) => {
          const p = row.original;
          const at = p.publishedAt || p.effectiveScheduledAt;
          if (!at) return <span className="text-fg-subtle">{t("notScheduled")}</span>;
          return <time dateTime={at}>{f.date(at, { dateStyle: "medium", timeStyle: "short", timeZone })}</time>;
        },
      },
      { id: "status", header: t("colStatus"), cell: ({ row }) => <PostStatusBadge value={row.original.status} /> },
      {
        id: "platforms",
        header: t("colPlatforms"),
        cell: ({ row }) => (
          <ul className="flex flex-wrap items-center gap-1.5" aria-label={t("platformsOf", { count: row.original.platforms.length })}>
            {row.original.platforms.map((p) => (
              <li key={p.id}>
                <PlatformIcon platform={p.platform} label={platformMeta(p.platform).name} className="size-5 text-fg-muted" />
              </li>
            ))}
          </ul>
        ),
      },
      {
        id: "labels",
        header: t("colLabels"),
        meta: { wrap: true },
        cell: ({ row }) =>
          row.original.labels.length ? (
            <div className="flex max-w-72 flex-wrap gap-1.5">
              {row.original.labels.map((l) => (
                <LabelTag key={l.id} name={l.name} color={l.color} />
              ))}
            </div>
          ) : (
            <span className="text-fg-subtle">{t("noLabelsShort")}</span>
          ),
      },
      {
        id: "approvers",
        header: t("colApprovers"),
        cell: ({ row }) => <AvatarStack people={row.original.approvers} label={t("approversOf", { count: row.original.approvers.length })} />,
      },
      { id: "actions", header: () => <span className="sr-only">{t("colActions")}</span>, meta: { width: "1%" }, cell: ({ row }) => <PostActions post={row.original} /> },
    ],
    [t, f, timeZone],
  );
}
