"use client";

import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";

type Props = {
  label: string;
  /** Iconify Flagpack icon suffix, e.g. `gb-ukm`, `de` */
  flagCode: string;
  className?: string;
  size?: "xs" | "sm" | "md" | "lg";
};

const sizeMap = {
  xs: "h-3 w-4",
  sm: "h-3.5 w-[18px]",
  md: "h-4 w-[22px]",
  lg: "h-[18px] w-6",
} as const;

export default function LanguageFlag({
  label,
  flagCode,
  className,
  size = "md",
}: Props) {
  return (
    <Icon
      icon={`flagpack:${flagCode.toLowerCase()}`}
      aria-label={label}
      className={cn(
        "shrink-0 overflow-hidden rounded-[2px] object-cover",
        sizeMap[size],
        className,
      )}
    />
  );
}
