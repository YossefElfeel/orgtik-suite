"use client";

// Pick a post from the library for a platform: search, a list with each post's status, and one
// choice (radio). Loading, error with retry, and empty states say what is going on.
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { MagnifyingGlass } from "@phosphor-icons/react";
import { Button, Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Input, ListStates, cn } from "@orgtik/ui";
import { MarketingStatus } from "@/components/shared/MarketingStatus";
import { platformMeta } from "@/components/shared/PlatformBadge";
import { ButtonLink } from "@/components/shared/ButtonLink";
import { useGetPostsQuery } from "@/redux/features/posts/postsApi";
import { isolate } from "@/lib/bidi";
import type { CampaignLinkedPost } from "@/lib/campaigns/types";
import type { IPostListItem } from "@/types/post";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  platform: string;
  onSelect: (post: CampaignLinkedPost) => void;
  /** Posts already linked here: shown as such and not offered again. */
  excludeIds?: string[];
};

export default function PickSocialMediaPostDialog({ open, onOpenChange, platform, onSelect, excludeIds = [] }: Props) {
  const t = useTranslations("CampaignDialogs");
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  useEffect(() => {
    const id = setTimeout(() => setQ(search.trim()), 300);
    return () => clearTimeout(id);
  }, [search]);
  const { data, isLoading, isError, refetch } = useGetPostsQuery({ page: 1, limit: 50, platforms: [platform], ...(q ? { search: q } : {}) }, { skip: !open });
  const posts = ((data?.data?.items ?? []) as IPostListItem[]).filter((p) => !excludeIds.includes(p.id));
  const name = platformMeta(platform).name;

  const close = (o: boolean) => {
    onOpenChange(o);
    if (!o) {
      setSearch("");
      setSelected(null);
    }
  };
  const use = () => {
    const post = posts.find((p) => p.id === selected);
    if (!post) return;
    onSelect({ postId: post.id, title: post.postTitle || post.title || "", source: "EXISTING", status: post.status === "DRAFT" ? "DRAFT" : "READY" });
    close(false);
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>{t("pick.title", { platform: isolate(name) })}</DialogTitle>
          <DialogDescription>{t("pick.description")}</DialogDescription>
        </DialogHeader>
        <DialogBody className="flex flex-col gap-3">
          <Input type="search" value={search} onChange={(e) => setSearch(e.target.value)} startIcon={<MagnifyingGlass />} placeholder={t("pick.search")} aria-label={t("pick.search")} />
          <ListStates
            size="compact"
            status={isLoading ? "loading" : isError ? "error" : posts.length ? "ready" : "empty"}
            onRetry={() => void refetch()}
            loadingRows={3}
            error={{ title: t("pick.errorTitle"), description: t("pick.errorBody") }}
            empty={
              q
                ? { title: t("pick.noMatchTitle"), description: t("pick.noMatchBody") }
                : {
                    title: t("pick.emptyTitle", { platform: isolate(name) }),
                    description: t("pick.emptyBody"),
                    action: (
                      <ButtonLink href="/posts/create-post" variant="secondary">
                        {t("pick.createInPosts")}
                      </ButtonLink>
                    ),
                  }
            }
          >
            <fieldset>
              <legend className="sr-only">{t("pick.listLabel")}</legend>
              <ul className="flex max-h-80 flex-col gap-2 overflow-y-auto">
                {posts.map((p) => {
                  const on = selected === p.id;
                  return (
                    <li key={p.id}>
                      <label
                        className={cn(
                          "flex cursor-pointer items-center gap-3 rounded-field border p-3",
                          "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-focus",
                          on ? "border-action-primary bg-brand-subtle" : "border-line hover:bg-hover",
                        )}
                      >
                        <input type="radio" name="pick-post" value={p.id} checked={on} onChange={() => setSelected(p.id)} className="size-4 shrink-0 accent-action-primary" />
                        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                          <span dir="auto" className="truncate text-body font-semibold text-fg">
                            {p.postTitle || p.title}
                          </span>
                          <span className="text-caption text-fg-muted">{t("pick.platforms", { count: p.platforms?.length ?? 0 })}</span>
                        </span>
                        <MarketingStatus kind="post" value={p.status} size="sm" />
                      </label>
                    </li>
                  );
                })}
              </ul>
            </fieldset>
          </ListStates>
        </DialogBody>
        <DialogFooter>
          <Button variant="ghost" onClick={() => close(false)}>
            {t("cancel")}
          </Button>
          <Button variant="primary" disabled={!selected} onClick={use}>
            {t("pick.use")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
