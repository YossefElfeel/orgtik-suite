"use client";

// A post's page (FS-MKT-7): what it says and its next step, how it reads per platform, when it
// goes out, its results, its approvals and comments. A missing post and a failed load are their
// own states (MKT-050: both showed a "Pending approval" banner). The actions follow the server's
// `actions` and the person's role (MKT-049).
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Copy, DotsThreeVertical, Lightning, PencilSimple, Trash } from "@phosphor-icons/react";
import { Button, EmptyState, ErrorState, IconButton, LoadingState, Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger, NoPermissionState, PageHeader } from "@orgtik/ui";
import { useRouter } from "@/i18n/routing";
import { ButtonLink } from "@/components/shared/ButtonLink";
import { useMarketingRoles } from "@/lib/permissions";
import { useDuplicatePostMutation, useGetPostDetailsQuery } from "@/redux/features/posts/postsApi";
import { DeletePostDialog } from "../DeletePostDialog";
import { PostStatusBadge } from "../shared/PostStatusBadge";
import { BoostDialog, boostableTargets } from "./BoostDialog";
import { PostApprovals } from "./PostApprovals";
import { PostComments } from "./PostComments";
import { PostContentCard } from "./PostContentCard";
import { PostPerformance } from "./PostPerformance";
import { PostPreview } from "./PostPreview";
import { PostScheduleCard } from "./PostScheduleCard";
import { PostStatusBanner } from "./PostStatusBanner";

export function PostDetailsView({ postId }: { postId: string }) {
  const t = useTranslations("PostDetails");
  const locale = useLocale();
  const router = useRouter();
  const can = useMarketingRoles();
  const { data, isLoading, isError, error, refetch } = useGetPostDetailsQuery(postId);
  const [duplicate] = useDuplicatePostMutation();
  const [boosting, setBoosting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const code = (error as { status?: number } | undefined)?.status;
  const post = data?.data;
  const toPosts = (
    <ButtonLink href="/posts" variant="secondary">
      {t("toPosts")}
    </ButtonLink>
  );

  if (isLoading) return <LoadingState rows={8} label={t("loading")} />;
  if (isError && code === 404) return <EmptyState size="page" titleAs="h1" title={t("notFoundTitle")} description={t("notFoundBody")} action={toPosts} />;
  if (isError && code === 403) return <NoPermissionState size="page" titleAs="h1" title={t("noAccessTitle")} description={t("noAccessBody")} action={toPosts} />;
  if (isError || !post) return <ErrorState size="page" titleAs="h1" title={t("errorTitle")} description={t("errorBody")} onRetry={() => refetch()} />;

  const canBoost = can.boost && boostableTargets(post).length > 0;
  const live = post.targets.filter((x) => x.publishedAt && !x.isDeletedOnPlatform).map((x) => x.platformKey);
  const copy = async () => {
    try {
      const res = await duplicate(post.id).unwrap();
      if (res.data?.id) router.push(`/posts/${res.data.id}`);
    } catch {
      // The request's toast says why.
    }
  };

  const actions = (
    <>
      {canBoost ? (
        <Button variant="secondary" startIcon={<Lightning weight="fill" />} onClick={() => setBoosting(true)}>
          {t("boost")}
        </Button>
      ) : null}
      {can.editPosts && post.actions.canEdit ? (
        <ButtonLink href={`/posts/${post.id}/edit`} variant="primary">
          <PencilSimple aria-hidden className="size-4" />
          {t("edit")}
        </ButtonLink>
      ) : null}
      {can.editPosts ? (
        <Menu>
          <MenuTrigger render={<IconButton variant="secondary" label={t("moreActions")} icon={<DotsThreeVertical weight="bold" />} />} />
          <MenuContent align="end">
            <MenuItem icon={<Copy />} onClick={copy}>
              {t("duplicate")}
            </MenuItem>
            <MenuSeparator />
            <MenuItem icon={<Trash />} tone="danger" onClick={() => setDeleting(true)}>
              {t("delete")}
            </MenuItem>
          </MenuContent>
        </Menu>
      ) : null}
    </>
  );

  return (
    <section className="flex flex-col gap-6">
      <PageHeader
        title={<span dir="auto">{post.title || t("untitled")}</span>}
        status={<PostStatusBadge value={post.uiStatus ?? post.status} size="md" />}
        breadcrumb={[{ label: t("crumbPosts"), href: `/${locale}/posts` }, { label: <span dir="auto">{post.title}</span> }]}
        actions={actions}
      />
      <PostStatusBanner post={post} />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex min-w-0 flex-col gap-6 lg:col-span-2">
          <PostContentCard post={post} />
          <PostPreview post={post} />
          <PostScheduleCard post={post} />
          <PostPerformance post={post} />
        </div>
        <div className="flex min-w-0 flex-col gap-6">
          <PostApprovals post={post} />
          <PostComments postId={post.id} />
        </div>
      </div>
      {canBoost ? <BoostDialog post={post} open={boosting} onOpenChange={setBoosting} /> : null}
      {can.editPosts ? (
        <DeletePostDialog
          postId={post.id}
          title={post.title || t("untitled")}
          livePlatforms={live}
          open={deleting}
          onOpenChange={setDeleting}
          onDeleted={() => router.replace("/posts")}
        />
      ) : null}
    </section>
  );
}
