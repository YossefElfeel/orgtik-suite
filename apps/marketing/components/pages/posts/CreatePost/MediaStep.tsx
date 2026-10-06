"use client";

// Step 2: images and videos from the gallery, the same for every platform or chosen per platform.
// Each platform's limits are checked here, not by the platform after publishing.
import { useState } from "react";
import { useTranslations } from "next-intl";
import { ImagesSquare, X } from "@phosphor-icons/react";
import { Button, IconButton, Switch } from "@orgtik/ui";
import { PlatformIcon, platformMeta } from "@/components/shared/PlatformBadge";
import { isolate } from "@/lib/bidi";
import type { IGalleryItem } from "@/types/post";
import { MediaPicker } from "../media/MediaPicker";
import { MediaThumb } from "../media/MediaThumb";
import type { Draft, Problems } from "./draft";

type Limits = Record<string, { maxItems: number; maxVideos: number }>;

function MediaGroup({
  title,
  platform,
  items,
  onChange,
  maxItems,
  maxVideos,
  error,
}: {
  title: string;
  platform?: string;
  items: IGalleryItem[];
  onChange: (items: IGalleryItem[]) => void;
  maxItems?: number;
  maxVideos?: number;
  error?: string;
}) {
  const t = useTranslations("PostComposer");
  const [open, setOpen] = useState(false);
  return (
    <section className="flex flex-col gap-3 rounded-card border border-line bg-raised p-4" aria-label={title}>
      <div className="flex flex-wrap items-center gap-2">
        {platform ? <PlatformIcon platform={platform} /> : <ImagesSquare aria-hidden className="size-5 text-fg-muted" />}
        <h3 className="me-auto text-title-sm font-display text-fg">{title}</h3>
        <span className="text-caption text-fg-muted">{t("mediaCount", { count: items.length })}</span>
        <Button size="sm" variant="secondary" onClick={() => setOpen(true)}>
          {items.length ? t("changeMedia") : t("chooseMedia")}
        </Button>
      </div>
      {items.length ? (
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-5" aria-label={t("chosenMedia")}>
          {items.map((m) => (
            <li key={m.id} className="relative">
              <MediaThumb item={m} />
              <IconButton
                size="sm"
                variant="secondary"
                label={t("removeMedia", { name: isolate(m.alt || t("untitledMedia")) })}
                icon={<X />}
                onClick={() => onChange(items.filter((x) => x.id !== m.id))}
                className="absolute end-1 top-1"
              />
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-body-sm text-fg-muted">{t("noMedia")}</p>
      )}
      {error ? (
        <p role="alert" className="text-body-sm text-danger">
          {error}
        </p>
      ) : null}
      <MediaPicker open={open} onOpenChange={setOpen} value={items} onApply={onChange} forName={platform ? platformMeta(platform).name : undefined} maxItems={maxItems} maxVideos={maxVideos} />
    </section>
  );
}

export function MediaStep({
  draft,
  update,
  problems,
  show,
  limits,
  msg,
}: {
  draft: Draft;
  update: (patch: Partial<Draft>) => void;
  problems: Problems;
  show: boolean;
  limits: Limits;
  msg: (p: Problems[string] | undefined) => string | undefined;
}) {
  const t = useTranslations("PostComposer");
  const err = (field: string) => (show ? msg(problems[field]) : undefined);
  const strictest = (keys: string[]) => {
    const l = keys.map((k) => limits[k]).filter(Boolean);
    return l.length ? { maxItems: Math.min(...l.map((x) => x.maxItems)), maxVideos: Math.min(...l.map((x) => x.maxVideos)) } : { maxItems: undefined, maxVideos: undefined };
  };

  return (
    <div className="flex flex-col gap-5">
      <p className="text-body text-fg-muted">{t("mediaIntro")}</p>
      {draft.platforms.length > 1 ? (
        <Switch
          checked={draft.sameMedia}
          onCheckedChange={(on) =>
            update(
              on
                ? { sameMedia: true, media: draft.media.length ? draft.media : (draft.mediaByPlatform[draft.platforms[0]] ?? []) }
                : { sameMedia: false, mediaByPlatform: Object.fromEntries(draft.platforms.map((p) => [p, draft.mediaByPlatform[p]?.length ? draft.mediaByPlatform[p] : draft.media])) },
            )
          }
          label={t("sameMedia")}
          description={draft.sameMedia ? t("sameMediaOn") : t("sameMediaOff")}
        />
      ) : null}
      {draft.sameMedia || draft.platforms.length < 2 ? (
        <MediaGroup
          title={t("mediaAll")}
          items={draft.media}
          onChange={(items) => update({ media: items })}
          error={err("media")}
          {...strictest(draft.platforms)}
        />
      ) : (
        draft.platforms.map((p) => (
          <MediaGroup
            key={p}
            title={t("mediaFor", { name: platformMeta(p).name })}
            platform={p}
            items={draft.mediaByPlatform[p] ?? []}
            onChange={(items) => update({ mediaByPlatform: { ...draft.mediaByPlatform, [p]: items } })}
            error={err(`media.${p}`)}
            {...strictest([p])}
          />
        ))
      )}
    </div>
  );
}
