"use client";

import { useTranslations } from "next-intl";
import { NoPermissionState } from "@orgtik/ui";
import { ButtonLink } from "@/components/shared/ButtonLink";
import { PostComposer } from "@/components/pages/posts/CreatePost/PostComposer";
import { useMarketingRoles } from "@/lib/permissions";

export default function CreatePostPage() {
  const t = useTranslations("PostComposer");
  const can = useMarketingRoles();
  if (!can.editPosts) {
    return (
      <NoPermissionState
        size="page"
        titleAs="h1"
        title={t("noAccessTitle")}
        description={can.readOnlySession ? t("noAccessReadOnly") : t("noAccessBody")}
        action={<ButtonLink href="/posts" variant="secondary">{t("toPosts")}</ButtonLink>}
      />
    );
  }
  return <PostComposer />;
}
