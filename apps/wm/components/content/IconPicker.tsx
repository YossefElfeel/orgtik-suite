"use client";
import { useTranslations } from "next-intl";
import { Select } from "@orgtik/ui";
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
  const options = Object.entries(icons).map(([key, Icon]) => ({
    value: key,
    label: (
      <span className="inline-flex items-center gap-2">
        <Icon aria-hidden className="size-5" />
        <span>{key.replace(/^ph-/, "").replaceAll("-", " ")}</span>
      </span>
    ),
  }));
  return (
    <Select
      aria-label={t("icon")}
      disabled={disabled}
      value={value}
      onValueChange={(next) => next && onChange(next)}
      options={options}
    />
  );
}
