"use client";

import { memo, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronDown, ChevronLeft, ChevronRight, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSidebarCollapsed } from "@/hooks/use-sidebar-collapsed";
import { cn } from "@/lib/utils";

export type SidebarChild = {
  label: string;
  href?: string;
  children?: SidebarChild[];
};

export type SidebarItem = {
  label: string;
  Icon: React.ElementType;
  path?: string;
  children?: SidebarChild[];
  badge?: React.ReactNode;
};

export type UnifiedSidebarProps = {
  filteredItems?: SidebarItem[];
  isActive: (props: { path: string }) => boolean;
  isActiveStartsWith: (props: { path: string }) => boolean;
  logo?: {
    src: string;
    alt?: string;
    width?: number;
    height?: number;
  };
  desktopClassName?: string;
  mobileTrigger?: React.ReactNode;
};

function renderIcon(Icon: React.ElementType, size: number) {
  return <Icon width={size} height={size} className="shrink-0" />;
}

function SidebarLogo({
  logo,
  className,
}: {
  logo?: UnifiedSidebarProps["logo"];
  className?: string;
}) {
  if (!logo) return null;

  return (
    <div className={cn("flex justify-start", className)}>
      <Image
        src={logo.src}
        width={logo.width ?? 160}
        height={logo.height ?? 160}
        alt={logo.alt ?? "logo"}
        className="max-h-16 h-10 p-0.5 object-contain"
      />
    </div>
  );
}

function wrapWithTooltip(
  content: React.ReactNode,
  label: string,
  collapsed: boolean
) {
  if (!collapsed) return content;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{content}</TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
}

function childLinkClass(active: boolean) {
  return cn(
    "w-full h-10 justify-start text-gray-600 text-sm transition-all",
    "hover:bg-primary/70 hover:text-white",
    active && "bg-primary text-white border border-primary"
  );
}

function PopoverChildLinks({
  items,
  isActive,
  onItemClick,
}: {
  items: SidebarChild[];
  isActive: (props: { path: string }) => boolean;
  onItemClick?: () => void;
}) {
  return (
    <>
      {items.map((child, index) => {
        if (child.href) {
          return (
            <Link
              key={child.href ?? index}
              href={child.href}
              className="block w-full"
            >
              <Button
                variant="ghost"
                className={childLinkClass(isActive({ path: child.href }))}
                onClick={onItemClick}
              >
                {child.label}
              </Button>
            </Link>
          );
        }

        if (child.children?.length) {
          return (
            <div key={child.label + index} className="flex flex-col gap-1">
              <p className="px-2 py-1 text-xs font-semibold text-gray-500">
                {child.label}
              </p>
              {child.children.map((nested, nestedIndex) =>
                nested.href ? (
                  <Link
                    key={nested.href ?? nestedIndex}
                    href={nested.href}
                    className="block w-full"
                  >
                    <Button
                      variant="ghost"
                      className={childLinkClass(
                        isActive({ path: nested.href })
                      )}
                      onClick={onItemClick}
                    >
                      {nested.label}
                    </Button>
                  </Link>
                ) : null
              )}
            </div>
          );
        }

        return null;
      })}
    </>
  );
}

function SidebarItemRenderer({
  item,
  isActive,
  isActiveStartsWith,
  collapsed = false,
  onItemClick,
}: {
  item: SidebarItem;
  isActive: (props: { path: string }) => boolean;
  isActiveStartsWith: (props: { path: string }) => boolean;
  collapsed?: boolean;
  onItemClick?: () => void;
}) {
  const isRoot = item.path === "/";
  const active = isRoot
    ? isActive({ path: item.path ?? "" })
    : isActiveStartsWith({ path: item.path ?? "" });

  const itemButtonClass = cn(
    "font-semibold transition-all text-gray-600",
    "hover:bg-primary/70 hover:text-white",
    active && "bg-primary text-white border border-primary",
    collapsed
      ? "w-full justify-center px-0 h-10"
      : "w-full justify-start gap-2 h-10"
  );

  if (!item.children && item.path) {
    const badge = item.badge;

    return wrapWithTooltip(
      <Link href={item.path} className="block w-full">
        <Button
          variant="ghost"
          className={itemButtonClass}
          onClick={onItemClick}
        >
          {renderIcon(item.Icon, 20)}
          {!collapsed && (
            <>
              {item.label}
              {badge}
            </>
          )}
        </Button>
      </Link>,
      item.label,
      collapsed
    );
  }

  if (item.children?.length) {
    return (
      <SidebarItemWithChildren
        item={item}
        isActive={isActiveStartsWith}
        collapsed={collapsed}
        onItemClick={onItemClick}
      />
    );
  }

  return null;
}

const MemoSidebarItem = memo(SidebarItemRenderer);

function SidebarItemWithChildren({
  item,
  isActive,
  collapsed = false,
  onItemClick,
}: {
  item: SidebarItem;
  isActive: (props: { path: string }) => boolean;
  collapsed?: boolean;
  onItemClick?: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const children = item.children ?? [];

  const active = children.some((child) => {
    if (child.href && isActive({ path: child.href })) return true;
    if (child.children) {
      return child.children.some((nestedChild) =>
        isActive({ path: nestedChild.href ?? "" })
      );
    }
    return false;
  });

  useEffect(() => {
    if (collapsed) {
      setIsOpen(false);
      return;
    }
    if (active && !isOpen) setIsOpen(true);
  }, [active, isOpen, collapsed]);

  const itemButtonClass = cn(
    "font-semibold transition-all text-gray-600",
    "hover:bg-primary/70 hover:text-white",
    active && "bg-primary text-white border border-primary",
    collapsed
      ? "w-full justify-center px-0 h-10"
      : "w-full justify-between gap-2 h-10"
  );

  if (collapsed) {
    return (
      <Popover>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                className={itemButtonClass}
                aria-label={item.label}
              >
                {renderIcon(item.Icon, 20)}
              </Button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent side="right" avoidCollisions={false}>
            {item.label}
          </TooltipContent>
        </Tooltip>
        <PopoverContent
          side="right"
          align="start"
          avoidCollisions={false}
          className="w-56 p-2"
        >
          <p className="px-2 py-1.5 text-sm font-semibold text-gray-700">
            {item.label}
          </p>
          <div className="flex flex-col gap-1">
            <PopoverChildLinks
              items={children}
              isActive={isActive}
              onItemClick={onItemClick}
            />
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="w-full border-t border-gray-200/60 pt-3 pb-1"
    >
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className={itemButtonClass}>
          <span className="flex items-center gap-2">
            {renderIcon(item.Icon, 20)}
            {item.label}
          </span>
          <ChevronDown
            className={cn(
              "h-4 w-4 transition-transform duration-300 ml-auto shrink-0",
              isOpen && "rotate-180"
            )}
          />
        </Button>
      </CollapsibleTrigger>

      <CollapsibleContent className="animate-collapsible-down border-l border-l-gray-200 ml-3">
        <div className="flex flex-col gap-2 mt-2 px-2">
          {children.map((child, index) => (
            <NestedSidebarItem
              key={child.href ?? child.label + index}
              child={child}
              isActive={isActive}
              onItemClick={onItemClick}
            />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function NestedSidebarItem({
  child,
  isActive,
  onItemClick,
}: {
  child: SidebarChild;
  isActive: (props: { path: string }) => boolean;
  onItemClick?: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const active = child.children
    ? child.children.some((nestedChild) =>
        isActive({ path: nestedChild.href ?? "" })
      )
    : child.href
      ? isActive({ path: child.href })
      : false;

  useEffect(() => {
    if (active && child.children) setIsOpen(true);
  }, [active, child.children]);

  if (!child.children && child.href) {
    return (
      <Link href={child.href} className="block w-full">
        <Button
          variant="ghost"
          className={childLinkClass(isActive({ path: child.href }))}
          onClick={onItemClick}
        >
          <span>{child.label}</span>
        </Button>
      </Link>
    );
  }

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="w-full"
    >
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            "w-full h-10 justify-between text-gray-600 transition-all",
            "hover:bg-primary/70 hover:text-white",
            active && "bg-primary text-white border border-primary"
          )}
        >
          <span>{child.label}</span>
          <ChevronDown
            className={cn(
              "h-4 w-4 transition-transform duration-300 shrink-0",
              isOpen && "rotate-180"
            )}
          />
        </Button>
      </CollapsibleTrigger>

      <CollapsibleContent className="animate-collapsible-down border-l border-l-gray-200 ml-3">
        <div className="flex flex-col gap-2 mt-2">
          {child.children?.map((nestedChild, index) =>
            nestedChild.href ? (
              <Link
                key={nestedChild.href ?? index}
                href={nestedChild.href}
                className="block w-full"
              >
                <Button
                  variant="ghost"
                  className={childLinkClass(
                    isActive({ path: nestedChild.href })
                  )}
                  onClick={onItemClick}
                >
                  <span>{nestedChild.label}</span>
                </Button>
              </Link>
            ) : null
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function UnifiedSidebar({
  filteredItems,
  isActive,
  isActiveStartsWith,
  logo,
  desktopClassName,
  mobileTrigger,
}: UnifiedSidebarProps) {
  const [open, setOpen] = useState(false);
  const { isCollapsed, toggleCollapsed } = useSidebarCollapsed();

  const handleItemClick = () => setOpen(false);

  return (
    <>
      <aside
        className={cn(
          "hidden lg:flex shrink-0 border-x flex-col bg-[#F7F9FB] max-h-screen overflow-x-hidden overflow-hidden transition-[width] duration-300 ease-in-out",
          isCollapsed ? "w-[72px]" : "w-64",
          desktopClassName
        )}
      >
        <div
          className={cn(
            "flex items-center border-b border-gray-200/60 shrink-0",
            isCollapsed ? "justify-center p-2" : "justify-between gap-2 p-4"
          )}
        >
          {!isCollapsed && <SidebarLogo logo={logo} className="p-0" />}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleCollapsed}
            className="shrink-0 size-8 text-gray-500 hover:text-gray-700"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <ChevronRight className="size-4" />
            ) : (
              <ChevronLeft className="size-4" />
            )}
          </Button>
        </div>

        <TooltipProvider delayDuration={0}>
          <nav
            key={isCollapsed ? "collapsed" : "expanded"}
            className={cn(
              "flex flex-col gap-2 overflow-y-auto overflow-x-hidden flex-1 min-h-0",
              isCollapsed ? "p-2" : "p-4"
            )}
          >
            {filteredItems?.map((item, index) => (
              <MemoSidebarItem
                key={item.path ?? item.label + index}
                item={item}
                isActive={isActive}
                isActiveStartsWith={isActiveStartsWith}
                collapsed={isCollapsed}
              />
            ))}
          </nav>
        </TooltipProvider>
      </aside>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          {mobileTrigger ?? (
            <Button variant="ghost" size="icon" className="lg:hidden">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          )}
        </SheetTrigger>
        <SheetContent
          side="left"
          className="p-0 bg-[#F7F9FB] overflow-y-auto"
        >
          <SheetTitle className="sr-only">Navigation menu</SheetTitle>
          <SidebarLogo logo={logo} className="p-4 border-b border-gray-200/60" />
          <nav className="flex flex-col gap-2 p-4">
            {filteredItems?.map((item, index) => (
              <MemoSidebarItem
                key={item.path ?? item.label + index}
                item={item}
                isActive={isActive}
                isActiveStartsWith={isActiveStartsWith}
                onItemClick={handleItemClick}
              />
            ))}
          </nav>
        </SheetContent>
      </Sheet>
    </>
  );
}

export default UnifiedSidebar;
