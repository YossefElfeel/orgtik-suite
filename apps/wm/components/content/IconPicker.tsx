"use client";
import { useTranslations } from "next-intl";
import { Button } from "@orgtik/ui";
import { MediaPicker } from "@/components/media/MediaPicker";
import { mediaUrl } from "@/lib/env";
import {
  ArrowsClockwise,
  Browser,
  CalendarBlank,
  CalendarCheck,
  ChartLineUp,
  CheckSquare,
  CirclesThreePlus,
  Code,
  CursorClick,
  EnvelopeSimple,
  FileText,
  Flag,
  FolderSimple,
  HardDrives,
  IdentificationBadge,
  Lifebuoy,
  ListChecks,
  Megaphone,
  Note,
  Palette,
  RocketLaunch,
  Target,
  TrendUp,
  User,
  UserCircleCheck,
  UsersThree,
} from "@phosphor-icons/react";
const icons = {
  "ph-users-three": UsersThree,
  "ph-chart-line-up": ChartLineUp,
  "ph-folder-simple": FolderSimple,
  "ph-check-square": CheckSquare,
  "ph-megaphone": Megaphone,
  "ph-browser": Browser,
  "ph-palette": Palette,
  "ph-code": Code,
  "ph-lifebuoy": Lifebuoy,
  "ph-hard-drives": HardDrives,
  "ph-flag": Flag,
  "ph-arrows-clockwise": ArrowsClockwise,
  "ph-trend-up": TrendUp,
  "ph-user": User,
  "ph-calendar-check": CalendarCheck,
  "ph-user-circle-check": UserCircleCheck,
  "ph-list-checks": ListChecks,
  "ph-file-text": FileText,
  "ph-identification-badge": IdentificationBadge,
  "ph-calendar-blank": CalendarBlank,
  "ph-target": Target,
  "ph-note": Note,
  "ph-cursor-click": CursorClick,
  "ph-envelope-simple": EnvelopeSimple,
  "ph-circles-three-plus": CirclesThreePlus,
  "ph-rocket-launch": RocketLaunch,
};

export function IconPicker({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const t = useTranslations("Fields");
  const Selected = Object.hasOwn(icons, value) ? icons[value as keyof typeof icons] : undefined;
  return (
    <div className="flex flex-col gap-3">
      <div aria-label={t("icon")} className="flex size-14 items-center justify-center rounded-field border border-line bg-sunken">
        {Selected ? <Selected className="size-8" aria-hidden /> : value ? <img src={mediaUrl(value)} alt={t("icon")} className="size-8 object-contain" /> : null}
      </div>
      <div role="group" aria-label={t("icon")} className="flex flex-wrap gap-2">
        {Object.entries(icons).map(([key, Icon]) => <Button key={key} size="sm" variant={key === value ? "primary" : "secondary"} disabled={disabled} aria-label={key.replace(/^ph-/, "").replaceAll("-", " ")} aria-pressed={key === value} onClick={() => onChange(key)} className="size-10 p-0"><Icon aria-hidden className="size-6" /></Button>)}
      </div>
      <MediaPicker iconOnly value={Selected ? "" : value} onChange={onChange} disabled={disabled} />
    </div>
  );
}
