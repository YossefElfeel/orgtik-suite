"use client";

// Choose the platform for a new ad set or a platform's posts. Platforms without a connected
// account are listed but can't be chosen, and say so; the menu links to Integrations.
import type { ReactElement } from "react";
import { useTranslations } from "next-intl";
import { Plugs } from "@phosphor-icons/react";
import { Menu, MenuContent, MenuItem, MenuLinkItem, MenuSeparator, MenuTrigger } from "@orgtik/ui";
import { PlatformIcon, platformMeta } from "@/components/shared/PlatformBadge";
import { Link } from "@/i18n/routing";

type Props = {
  /** The button that opens the menu. */
  trigger: ReactElement;
  /** Platform ids offered (FACEBOOK, INSTAGRAM, …). */
  platforms: readonly string[];
  /** Platforms with a connected account; others are shown off. */
  connected: readonly string[];
  /** Platforms already added, when each may be added once. */
  taken?: readonly string[];
  onSelect: (platform: string) => void;
};

export default function AddSocialMediaPlatformDialog({ trigger, platforms, connected, taken = [], onSelect }: Props) {
  const t = useTranslations("CampaignDialogs");
  return (
    <Menu>
      <MenuTrigger render={trigger} />
      <MenuContent align="end">
        {platforms.map((p) => {
          const isConnected = connected.includes(p);
          const isTaken = taken.includes(p);
          return (
            <MenuItem key={p} icon={<PlatformIcon platform={p} />} disabled={!isConnected || isTaken} onClick={() => onSelect(p)}>
              <span className="flex flex-col">
                <bdi>{platformMeta(p).name}</bdi>
                {!isConnected ? <span className="text-caption text-fg-muted">{t("platform.notConnected")}</span> : isTaken ? <span className="text-caption text-fg-muted">{t("platform.added")}</span> : null}
              </span>
            </MenuItem>
          );
        })}
        <MenuSeparator />
        <MenuLinkItem icon={<Plugs />} render={<Link href="/integrations" />}>
          {t("platform.connectMore")}
        </MenuLinkItem>
      </MenuContent>
    </Menu>
  );
}
