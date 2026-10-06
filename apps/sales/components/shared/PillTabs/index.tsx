"use client";

import { useState } from "react";
import { Icon } from "@iconify/react";
import { Link, usePathname } from "@/i18n/routing";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type {
  PillTabItem,
  PillTabsProps,
  PillTabsSize,
  PillTabsVariant,
} from "@/types/tabs";

const pillTabsSizeStyles: Record<
  PillTabsSize,
  {
    navPadding: string;
    listHeight: string;
    text: string;
    icon: string;
    itemPadding: string;
    itemGap: string;
  }
> = {
  xs: {
    navPadding: "p-1",
    listHeight: "h-8",
    text: "text-[11px]",
    icon: "size-3.5",
    itemPadding: "px-3",
    itemGap: "gap-1.5",
  },
  sm: {
    navPadding: "p-1.5",
    listHeight: "h-9",
    text: "text-xs",
    icon: "size-4",
    itemPadding: "px-4",
    itemGap: "gap-2",
  },
  md: {
    navPadding: "p-2",
    listHeight: "h-11",
    text: "text-sm",
    icon: "size-4.5",
    itemPadding: "px-4",
    itemGap: "gap-2",
  },
};

function getTabStateClasses(
  variant: PillTabsVariant,
  isActive: boolean,
  readOnly: boolean,
  disabled: boolean,
) {
  const activeClasses =
    variant === "surface"
      ? "bg-background text-foreground shadow-[0px_10px_25px_rgba(9,25,72,0.06)]"
      : "bg-primary text-primary-foreground";

  const inactiveClasses =
    variant === "surface"
      ? "text-secondary hover:text-foreground"
      : "text-secondary hover:bg-primary/10 hover:text-primary";

  return cn(
    isActive ? activeClasses : inactiveClasses,
    (disabled || readOnly) &&
      !isActive &&
      "hover:bg-transparent hover:text-secondary",
    disabled && "pointer-events-none opacity-50",
  );
}

function isPathActive(
  pathname: string,
  href: string,
  match: "exact" | "prefix",
) {
  if (match === "exact") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function resolveActiveId(
  items: readonly PillTabItem[],
  pathname: string,
  value: string | undefined,
  uncontrolledValue: string | undefined,
) {
  if (value !== undefined) {
    return value;
  }

  if (uncontrolledValue !== undefined) {
    return uncontrolledValue;
  }

  const linkedActive = items.find(
    (item) =>
      item.href && isPathActive(pathname, item.href, item.match ?? "prefix"),
  );

  return linkedActive?.id ?? items[0]?.id;
}

function PillTabs({
  items,
  value,
  defaultValue,
  onValueChange,
  readOnly = false,
  variant = "primary",
  size = "md",
  equalWidth = true,
  ariaLabel = "Tabs",
  className,
  navClassName,
  listClassName,
  itemClassName,
  activeTooltip,
  onActiveTooltipOpenChange,
}: PillTabsProps) {
  const pathname = usePathname();
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
  const activeId = resolveActiveId(items, pathname, value, uncontrolledValue);
  const isControlled = value !== undefined;

  const handleSelect = (id: string) => {
    if (!isControlled) {
      setUncontrolledValue(id);
    }
    onValueChange?.(id);
  };

  const sizeStyle = pillTabsSizeStyles[size];

  return (
    <TooltipProvider delay={0}>
      <div
        className={cn("min-w-0 max-w-full", !equalWidth && "w-fit", className)}
      >
        <nav
          className={cn(
            "min-w-0 rounded-full border border-border/70 bg-muted/60",
            equalWidth ? "w-full" : "w-fit max-w-full",
            sizeStyle.navPadding,
            navClassName,
          )}
          aria-label={ariaLabel}
        >
          <div
            className={cn(
              "min-w-0 overflow-x-auto overscroll-x-contain",
              "[scrollbar-width:thin] [scrollbar-color:var(--border)_transparent]",
              "[&::-webkit-scrollbar]:h-1",
              "[&::-webkit-scrollbar-track]:bg-transparent",
              "[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border/80",
              "[&::-webkit-scrollbar-thumb]:hover:bg-secondary/50",
            )}
          >
            <div
              className={cn(
                "flex w-max items-stretch gap-1",
                equalWidth && "min-w-full",
                sizeStyle.listHeight,
                listClassName,
              )}
            >
              {items.map((item) => {
                const isActive = item.id === activeId;
                const sharedClassName = cn(
                  "flex h-full shrink-0 items-center justify-center rounded-full font-semibold uppercase tracking-wide whitespace-nowrap transition-all duration-300",
                  sizeStyle.itemGap,
                  sizeStyle.itemPadding,
                  sizeStyle.text,
                  equalWidth && "lg:flex-1",
                  getTabStateClasses(
                    variant,
                    isActive,
                    readOnly,
                    Boolean(item.disabled),
                  ),
                  itemClassName,
                );
                const icon = item.icon ? (
                  <Icon
                    icon={item.icon}
                    className={cn("shrink-0", sizeStyle.icon)}
                  />
                ) : null;
                const countBadge =
                  item.count !== undefined ? (
                    <span
                      className={cn(
                        "inline-flex min-w-5 min-h-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[12px] bg-white text-primary font-semibold leading-none",
                      )}
                    >
                      {item.count}
                    </span>
                  ) : null;
                const content = (
                  <>
                    {icon}
                    <span className="truncate">{item.label}</span>
                    {countBadge}
                  </>
                );

                if (!readOnly && item.href && !item.disabled) {
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      role="tab"
                      aria-selected={isActive}
                      aria-current={isActive ? "page" : undefined}
                      onClick={() => handleSelect(item.id)}
                      className={sharedClassName}
                    >
                      {content}
                    </Link>
                  );
                }

                if (!readOnly && !item.disabled) {
                  const showTooltip = activeTooltip?.tabId === item.id;

                  if (showTooltip) {
                    return (
                      <Tooltip
                        key={item.id}
                        open
                        onOpenChange={(open) => {
                          if (!open) {
                            onActiveTooltipOpenChange?.(false);
                          }
                        }}
                      >
                        <TooltipTrigger
                          closeOnClick={false}
                          delay={9999}
                          render={
                            <button
                              type="button"
                              role="tab"
                              aria-selected={isActive}
                              onClick={() => handleSelect(item.id)}
                              className={sharedClassName}
                            />
                          }
                        >
                          {content}
                        </TooltipTrigger>
                        <TooltipContent
                          side="bottom"
                          className="max-w-[260px] px-3 py-2 text-left text-xs leading-relaxed font-normal whitespace-normal"
                        >
                          {activeTooltip.content}
                        </TooltipContent>
                      </Tooltip>
                    );
                  }

                  return (
                    <button
                      key={item.id}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => handleSelect(item.id)}
                      className={sharedClassName}
                    >
                      {content}
                    </button>
                  );
                }

                return (
                  <div
                    key={item.id}
                    role="tab"
                    aria-selected={isActive}
                    aria-current={isActive ? "step" : undefined}
                    className={sharedClassName}
                  >
                    {content}
                  </div>
                );
              })}
            </div>
          </div>
        </nav>
      </div>
    </TooltipProvider>
  );
}

export default PillTabs;
