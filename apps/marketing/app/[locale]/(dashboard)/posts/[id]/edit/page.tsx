"use client";

// Edit opens the composer on the post (MKT-045: the row's Edit did nothing). A post that can't be
// changed any more (published, canceled, or the role can't edit) says so and links back to it.
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { EmptyState, ErrorState, LoadingState, NoPermissionState } from "@orgtik/ui";
import { ButtonLink } from "@/components/shared/ButtonLink";
import { PostComposer } from "@/components/pages/posts/CreatePost/PostComposer";
import { useMarketingRoles } from "@/lib/permissions";
import { useGetPostDetailsQuery } from "@/redux/features/posts/postsApi";

export default function EditPostPage() {
  const t = useTranslations("PostComposer");
  const can = useMarketingRoles();
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, isError, error, refetch } = useGetPostDetailsQuery(id);
  const status = (error as { status?: number } | undefined)?.status;
  const post = data?.data;
  const back = (
    <ButtonLink href={post ? `/posts/${id}` : "/posts"} variant="secondary">
      {post ? t("toPost") : t("toPosts")}
    </ButtonLink>
  );

  if (isLoading) return <LoadingState rows={6} label={t("loadingPost")} />;
  if (isError && status === 404) return <EmptyState size="page" titleAs="h1" title={t("notFoundTitle")} description={t("notFoundBody")} action={back} />;
  if (isError && status === 403) return <NoPermissionState size="page" titleAs="h1" title={t("noAccessTitle")} description={t("noAccessBody")} action={back} />;
  if (isError || !post) return <ErrorState size="page" titleAs="h1" title={t("loadErrorTitle")} description={t("loadErrorBody")} onRetry={() => refetch()} />;
  if (!can.editPosts) {
    return <NoPermissionState size="page" titleAs="h1" title={t("noAccessTitle")} description={can.readOnlySession ? t("noAccessReadOnly") : t("noAccessBody")} action={back} />;
  }
  if (!post.actions?.canEdit) return <EmptyState size="page" titleAs="h1" title={t("lockedTitle")} description={t("lockedBody")} action={back} />;
  return <PostComposer key={post.id} post={post} />;
}
