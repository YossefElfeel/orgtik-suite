"use client";

// Social media: the campaign's schedule, and its posts per platform (picked from Posts or written
// now). A platform left without posts used to be dropped on save without a word (MKT-059): it is
// now marked, so the person adds a post or removes the platform.
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { CalendarBlank, Eye, Plus, ShareNetwork, Trash } from "@phosphor-icons/react";
import { Badge, Button, EmptyState, IconButton } from "@orgtik/ui";
import AddSocialMediaPlatformDialog from "@/components/dialogs/AddSocialMediaPlatformDialog";
import SocialMediaPostCreativeActions from "@/components/dialogs/SocialMediaPostCreativeActions";
import SocialMediaPostPreviewDialog from "@/components/dialogs/SocialMediaPostPreviewDialog";
import { MarketingStatus } from "@/components/shared/MarketingStatus";
import { PlatformBadge, platformMeta } from "@/components/shared/PlatformBadge";
import { useCampaignStepNavigation, useStepGuard } from "@/hooks/useCampaignStepNavigation";
import { useUpdateCampaignOnboardingMutation } from "@/redux/features/campaigns/campaignsApi";
import { useGetAvailablePlatformsQuery } from "@/redux/features/posts/postsApi";
import { useDraft } from "@/lib/campaigns/use-draft";
import { scheduleErrors } from "@/lib/campaigns/schedule";
import { SOCIAL_MEDIA_PLATFORM_IDS } from "@/constants/campaigns";
import { isolate } from "@/lib/bidi";
import type { CampaignLinkedPost } from "@/lib/campaigns/types";
import type { ICampaignOnboardingPostsPayload, ICreatedCampaign } from "@/types/campaigns";
import { ScheduleFields } from "../../../shared/ScheduleFields";
import { StepFrame, StepSection } from "../../StepFrame";

type PlatformSet = { id: string; platform: string; name: string; integrationId: string; posts: (CampaignLinkedPost & { key: string })[] };
type Values = { startAt: string | null; endAt: string | null; sets: PlatformSet[] };

function fromCampaign(c: ICreatedCampaign | undefined): Values {
  return {
    startAt: c?.startAt ?? null,
    endAt: c?.endAt ?? null,
    sets: (c?.adSets ?? []).map((s) => ({
      id: s.id || crypto.randomUUID(),
      platform: String(s.platform ?? "").toUpperCase(),
      name: s.name ?? "",
      integrationId: s.integrationId ?? "",
      posts: (s.ads ?? []).filter((a) => a.unifiedPostTargetId).map((a) => ({ key: a.id || crypto.randomUUID(), postId: a.unifiedPostTargetId!, title: a.creative?.title || a.name || "", source: "EXISTING" as const })),
    })),
  };
}

function payload(v: Values): ICampaignOnboardingPostsPayload {
  return {
    step: "POSTS",
    ...(v.startAt ? { startAt: v.startAt } : {}),
    ...(v.endAt ? { endAt: v.endAt } : {}),
    adSets: v.sets.map((s) => ({ name: s.name, integrationId: s.integrationId, ads: s.posts.map((p) => ({ name: p.title, unifiedPostTargetId: p.postId })) })),
  };
}

export default function SocialPostsStep() {
  const t = useTranslations("CampaignSocial");
  const tw = useTranslations("CampaignWizard");
  const { campaign, campaignId, goNext } = useCampaignStepNavigation();
  const draft = useDraft<Values>(fromCampaign(campaign));
  const v = draft.value;
  const [errors, setErrors] = useState<{ list?: string; schedule?: ReturnType<typeof scheduleErrors>; sets: Record<string, string> }>({ sets: {} });
  const [preview, setPreview] = useState<{ platform: string; post: CampaignLinkedPost } | null>(null);
  const [update, { isLoading }] = useUpdateCampaignOnboardingMutation();
  const available = useGetAvailablePlatformsQuery().data?.data ?? [];
  const integrationFor = useMemo(() => new Map(available.map((p) => [String(p.platform).toUpperCase(), p.integrationId])), [available]);
  const connected = SOCIAL_MEDIA_PLATFORM_IDS.filter((p) => integrationFor.has(p));

  const setSets = (sets: PlatformSet[]) => draft.patch({ sets });
  const patchSet = (id: string, p: Partial<PlatformSet>) => setSets(v.sets.map((s) => (s.id === id ? { ...s, ...p } : s)));
  const addPlatform = (platform: string) => setSets([...v.sets, { id: crypto.randomUUID(), platform, name: t("setName", { platform: platformMeta(platform).name }), integrationId: integrationFor.get(platform) ?? "", posts: [] }]);

  const save = async () => {
    const e: typeof errors = { sets: {} };
    const s = scheduleErrors(v, { savedStartAt: campaign?.startAt, requireStart: true, requireEnd: true });
    if (s.start || s.end) e.schedule = s;
    if (!v.sets.length) e.list = t("platformsRequired");
    for (const set of v.sets) {
      if (!set.integrationId) e.sets[set.id] = t("noAccount", { platform: platformMeta(set.platform).name });
      else if (!set.posts.length) e.sets[set.id] = t("postsRequired");
    }
    setErrors(e);
    if (e.schedule || e.list || Object.keys(e.sets).length || !campaignId) return false;
    try {
      await update({ campaignId, body: payload(v) }).unwrap();
      draft.reset(v);
      return true;
    } catch {
      return false;
    }
  };
  useStepGuard(draft.dirty, save);

  const addMenu = (
    <AddSocialMediaPlatformDialog
      trigger={
        <Button type="button" variant="secondary" startIcon={<Plus />}>
          {t("addPlatform")}
        </Button>
      }
      platforms={SOCIAL_MEDIA_PLATFORM_IDS}
      connected={connected}
      taken={v.sets.map((s) => s.platform)}
      onSelect={addPlatform}
    />
  );

  return (
    <StepFrame title={t("title")} description={t("description")} onSubmit={() => void save().then((ok) => ok && goNext())} busy={isLoading}>
      <StepSection icon={<CalendarBlank className="size-5" />} title={tw("schedule.title")}>
        <ScheduleFields startAt={v.startAt} endAt={v.endAt} onChange={(sc) => draft.patch(sc)} errors={errors.schedule} requireStart requireEnd />
      </StepSection>

      <StepSection icon={<ShareNetwork className="size-5" />} title={t("platformsTitle")} description={t("platformsDescription")} actions={v.sets.length ? addMenu : null}>
        {v.sets.length === 0 ? <EmptyState size="compact" title={t("noPlatformsTitle")} description={t("noPlatformsBody")} action={addMenu} /> : null}
        {errors.list ? <p className="text-body-sm text-danger">{errors.list}</p> : null}
        {v.sets.map((set) => {
          const name = platformMeta(set.platform).name;
          return (
            <div key={set.id} className="flex flex-col gap-3 rounded-field border border-line p-3">
              <div className="flex items-center justify-between gap-3">
                <PlatformBadge platform={set.platform} />
                <div className="flex items-center gap-2">
                  <Badge size="sm">{t("postsCount", { count: set.posts.length })}</Badge>
                  <IconButton type="button" variant="ghost" label={t("removePlatform", { platform: isolate(name) })} icon={<Trash />} onClick={() => setSets(v.sets.filter((x) => x.id !== set.id))} />
                </div>
              </div>
              {set.posts.length ? (
                <ul className="flex flex-col gap-2">
                  {set.posts.map((p) => (
                    <li key={p.key} className="flex items-center gap-3 rounded-field bg-sunken p-2.5">
                      <span dir="auto" className="min-w-0 flex-1 truncate text-body text-fg">
                        {p.title}
                      </span>
                      {p.status === "DRAFT" ? <MarketingStatus kind="post" value="DRAFT" size="sm" /> : null}
                      <IconButton type="button" variant="ghost" size="sm" label={t("previewPost", { title: isolate(p.title) })} icon={<Eye />} onClick={() => setPreview({ platform: set.platform, post: p })} />
                      <IconButton type="button" variant="ghost" size="sm" label={t("removePost", { title: isolate(p.title) })} icon={<Trash />} onClick={() => patchSet(set.id, { posts: set.posts.filter((x) => x.key !== p.key) })} />
                    </li>
                  ))}
                </ul>
              ) : null}
              {errors.sets[set.id] ? <p className="text-caption text-danger">{errors.sets[set.id]}</p> : null}
              <SocialMediaPostCreativeActions
                platform={set.platform}
                context={name}
                excludeIds={set.posts.map((p) => p.postId)}
                onLinked={(post) => patchSet(set.id, { posts: [...set.posts, { ...post, key: crypto.randomUUID() }] })}
              />
            </div>
          );
        })}
      </StepSection>

      <SocialMediaPostPreviewDialog open={preview !== null} onOpenChange={(o) => !o && setPreview(null)} platform={preview?.platform ?? ""} post={preview?.post ?? null} />
    </StepFrame>
  );
}
