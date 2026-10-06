"use client";

// A social or ad platform: its mark and its name, the same everywhere (post targets, connected
// accounts, campaigns, reports). The marks were iconify ids fetched at runtime and SVG files in
// /public, three ways for one thing (MKT-078). Brand names are proper nouns: they stay as written
// in every language, isolated so they don't flip a right-to-left sentence.
import type { ComponentType } from "react";
import {
  FacebookLogo,
  GlobeSimple,
  GoogleLogo,
  InstagramLogo,
  LinkedinLogo,
  TiktokLogo,
  XLogo,
  YoutubeLogo,
  type IconProps,
} from "@phosphor-icons/react";
import { cn } from "@orgtik/ui";

type Meta = { name: string; Icon: ComponentType<IconProps> };

export const PLATFORMS: Record<string, Meta> = {
  FACEBOOK: { name: "Facebook", Icon: FacebookLogo },
  INSTAGRAM: { name: "Instagram", Icon: InstagramLogo },
  X: { name: "X", Icon: XLogo },
  TWITTER: { name: "X", Icon: XLogo },
  LINKEDIN: { name: "LinkedIn", Icon: LinkedinLogo },
  TIKTOK: { name: "TikTok", Icon: TiktokLogo },
  YOUTUBE: { name: "YouTube", Icon: YoutubeLogo },
  GOOGLE: { name: "Google Ads", Icon: GoogleLogo },
};

export const platformMeta = (platform: string | null | undefined): Meta => PLATFORMS[String(platform ?? "").toUpperCase()] ?? { name: String(platform ?? ""), Icon: GlobeSimple };

/** The mark alone. Decorative by default: give it `label` when nothing next to it names the platform. */
export function PlatformIcon({ platform, label, className }: { platform: string | null | undefined; label?: string; className?: string }) {
  const { Icon, name } = platformMeta(platform);
  return label ? <Icon weight="fill" role="img" aria-label={label || name} className={cn("size-5 shrink-0", className)} /> : <Icon weight="fill" aria-hidden className={cn("size-5 shrink-0", className)} />;
}

/** Mark and name, e.g. in a list of a post's targets. */
export function PlatformBadge({ platform, className }: { platform: string | null | undefined; className?: string }) {
  const { name } = platformMeta(platform);
  return (
    <span className={cn("inline-flex min-w-0 items-center gap-1.5 text-body-sm text-fg", className)}>
      <PlatformIcon platform={platform} />
      <bdi className="truncate">{name}</bdi>
    </span>
  );
}
