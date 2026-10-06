"use client";

// How the post reads on each platform: the account, the text, the media and, once it is live, the
// reactions. The old card toasted every target's error on each render and drew a LinkedIn frame
// for every platform.
import { useTranslations } from "next-intl";
import { Avatar, Card, CardHeader, Tabs, TabsList, TabsPanel, useFormatter } from "@orgtik/ui";
import { PlatformBadge, platformMeta } from "@/components/shared/PlatformBadge";
import { useProjectContext } from "@/lib/project-context";
import type { IPostDetail } from "@/types/post";
import { MediaThumb } from "../media/MediaThumb";

export function PostPreview({ post }: { post: IPostDetail }) {
  const t = useTranslations("PostDetails");
  const f = useFormatter();
  const { timeZone } = useProjectContext();
  if (!post.targets.length) return null;

  return (
    <Card padding="lg" className="flex flex-col gap-4">
      <CardHeader title={t("previewTitle")} description={t("previewHint")} />
      <Tabs defaultValue={post.targets[0].id}>
        <TabsList items={post.targets.map((x) => ({ value: x.id, label: <PlatformBadge platform={x.platformKey} /> }))} />
        {post.targets.map((x) => {
          const account = x.integrationPublishPageData;
          const at = x.publishedAt ?? x.scheduledAt ?? post.scheduledAt;
          const m = x.analyticsAvailable ? x.performanceMatrix : null;
          return (
            <TabsPanel key={x.id} value={x.id} className="pt-4">
              <article className="mx-auto flex max-w-xl flex-col gap-3 rounded-card border border-line bg-raised p-4" aria-label={t("previewOn", { platform: platformMeta(x.platformKey).name })}>
                <header className="flex items-center gap-3">
                  <Avatar name={account?.name || platformMeta(x.platformKey).name} src={account?.image} size="md" decorative />
                  <div className="flex min-w-0 flex-col">
                    <span dir="auto" className="truncate text-body font-semibold text-fg">
                      {account?.name || platformMeta(x.platformKey).name}
                    </span>
                    <span className="text-caption text-fg-muted">
                      {account?.followers ? t("followers", { count: account.followers }) : null}
                      {account?.followers && at ? " · " : null}
                      {at ? f.date(at, { dateStyle: "medium", timeStyle: "short", timeZone }) : t("notScheduled")}
                    </span>
                  </div>
                </header>
                <p dir="auto" className="whitespace-pre-wrap text-body text-fg">
                  {x.effectiveText || t("noText")}
                </p>
                {x.galleries?.length ? (
                  <ul className="grid grid-cols-2 gap-1.5 sm:grid-cols-3" aria-label={t("mediaOf", { count: x.galleries.length })}>
                    {x.galleries.map((g) => (
                      <li key={g.id}>
                        <MediaThumb item={g} />
                      </li>
                    ))}
                  </ul>
                ) : null}
                {m ? (
                  <footer className="flex flex-wrap gap-x-4 gap-y-1 border-t border-line pt-3 text-caption text-fg-muted">
                    <span>{t("likes", { count: m.likes?.value ?? 0 })}</span>
                    <span>{t("comments", { count: m.comments?.value ?? 0 })}</span>
                    <span>{t("shares", { count: m.shares?.value ?? m.reposts?.value ?? 0 })}</span>
                  </footer>
                ) : null}
              </article>
            </TabsPanel>
          );
        })}
      </Tabs>
    </Card>
  );
}
