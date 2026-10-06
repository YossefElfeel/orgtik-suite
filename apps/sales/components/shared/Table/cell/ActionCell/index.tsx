"use client";

import { useTranslations } from "next-intl";
import type { ComponentProps, ReactNode } from "react";
import { Icon } from "@iconify/react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type ActionItemProps = {
  icon: string;
  label: string;
  onClick?: ComponentProps<"button">["onClick"];
  destructive?: boolean;
} & Omit<ComponentProps<"button">, "children">;

type ActionCellProps = {
  children: ReactNode;
  className?: string;
  side?: "top" | "bottom" | "left" | "right";
  align?: "end" | "start" | "center";
};

export function ActionItem({
  icon,
  label,
  onClick,
  destructive = false,
  className,
  ...props
}: ActionItemProps) {
  return (
    <button
      type="button"
      {...props}
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm transition-colors hover:bg-secondary/10",
        destructive
          ? "text-destructive hover:bg-destructive/10"
          : "text-secondary",
        className,
      )}
    >
      <Icon icon={icon} className="size-4 shrink-0" />
      {label}
    </button>
  );
}

export function ActionCell({
  children,
  className,
  side,
  align = "end",
}: ActionCellProps) {
  const tCommon = useTranslations("common");
  return (
    <Popover>
      <PopoverTrigger
        render={<Button variant="outline" size="icon-sm" className="p-0" />}
      >
        <Icon icon="solar:menu-dots-bold" className="rotate-90" />
      </PopoverTrigger>
      <PopoverContent
        side={side}
        align={align}
        className={cn("flex w-45 flex-col gap-0 p-2", className)}
      >
        <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
          {tCommon("actions")}
        </p>
        {children}
      </PopoverContent>
    </Popover>
  );
}
