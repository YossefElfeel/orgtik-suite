"use client";
import { Columns as Columns3, List } from "@phosphor-icons/react";

import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

type ViewMode = "table" | "grid";

export type MenuTabItem = {
  key: string;
  label: string;
  icon?: ReactNode;
  path?: string;
};

type TabMenuProps = {
  items: MenuTabItem[];
  onChange?: (key: string) => void;
  className?: string;
  defaultActive?: string;
  showViewToggle?: boolean;
  viewDefault?: ViewMode;
  viewParam?: string;
};

export function TabMenu({
  items,
  onChange,
  className,
  defaultActive,
  showViewToggle = false,
  viewDefault = "table",
  viewParam = "view",
}: TabMenuProps) {
  const tCommon = useTranslations("common");
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const locale = useMemo(() => pathname.split("/")[1] ?? "", [pathname]);

  const initialActiveKey = useMemo(
    () => defaultActive ?? items[0]?.key ?? "",
    [items, defaultActive],
  );
  const [activeKey, setActiveKey] = useState(initialActiveKey);

  const anyItemHasPath = useMemo(
    () => items.some((item) => Boolean(item.path)),
    [items],
  );
  const urlActiveKey = useMemo(() => {
    if (!anyItemHasPath) return undefined;
    const match = items.find(
      (item) => item.path && pathname.endsWith(item.path),
    );
    return match?.key;
  }, [anyItemHasPath, items, pathname]);

  useEffect(() => {
    if (!anyItemHasPath) {
      if (!items.some((item) => item.key === activeKey))
        setActiveKey(initialActiveKey);
      return;
    }

    // When paths are provided, keep active key driven by the URL.
    if (urlActiveKey && urlActiveKey !== activeKey) {
      setActiveKey(urlActiveKey);
    }
  }, [activeKey, anyItemHasPath, initialActiveKey, items, urlActiveKey]);

  const getHref = (path?: string) => {
    if (!path) return "";
    if (!locale) return path; // fallback if locale isn't in URL yet
    // Ensure we don't end up with `//` in the final href.
    const normalized = path.startsWith("/") ? path : `/${path}`;
    return `/${locale}${normalized}`;
  };

  const activeIndex = Math.max(
    0,
    items.findIndex((item) => item.key === activeKey),
  );
  const containerRef = useRef<HTMLDivElement | null>(null);
  const tabRefs = useRef<Array<HTMLAnchorElement | null>>([]);

  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  const updateIndicator = () => {
    const container = containerRef.current;
    const tab = tabRefs.current[activeIndex];
    if (!container || !tab) return;

    const containerRect = container.getBoundingClientRect();
    const tabRect = tab.getBoundingClientRect();

    setIndicator({
      left: tabRect.left - containerRect.left,
      width: tabRect.width,
    });
  };

  useLayoutEffect(() => {
    updateIndicator();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex]);

  useEffect(() => {
    const onResize = () => updateIndicator();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const urlViewMode = searchParams.get(viewParam);
  const selectedViewMode: ViewMode =
    urlViewMode === "grid"
      ? "grid"
      : urlViewMode === "table"
        ? "table"
        : viewDefault;

  const buildViewHref = (nextView: ViewMode) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(viewParam, nextView);
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  };

  return (
    <section className={cn("w-full --border-b", className)}>
      <div className="flex items-center justify-between gap-6">
        <div
          className="relative flex items-center gap-[30px]"
          ref={containerRef}
        >
          {/* Animated active indicator */}
          <span
            aria-hidden="true"
            className="absolute -bottom-[13px] start-0 h-0.5 bg-primary transition-[transform,width] duration-300 ease-out"
            style={{
              width: indicator.width,
              transform: `translateX(${indicator.left}px)`,
            }}
          />

          {items.map((item, idx) => {
            const isActive = item.key === activeKey;
            const linkHref = item.path ? getHref(item.path) : "";

            return (
              <Link
                key={item.key}
                href={linkHref || "#"} // fallback, if a caller didn't provide path
                aria-current={isActive ? "page" : undefined}
                ref={(el) => {
                  tabRefs.current[idx] =
                    el as unknown as HTMLAnchorElement | null;
                }}
                onClick={(e) => {
                  if (!item.path) {
                    // If no path is provided, keep the legacy button-like behavior.
                    e.preventDefault();
                    setActiveKey(item.key);
                    onChange?.(item.key);
                  } else {
                    setActiveKey(item.key);
                    onChange?.(item.key);
                  }
                }}
                className={cn(
                  "relative flex h-[21px] items-center justify-center gap-1.5 text-sm leading-[18px] font-medium transition-colors",
                  isActive ? "text-primary" : "text-secondary",
                )}
              >
                {item.icon && <span className="size-5">{item.icon}</span>}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {showViewToggle ? (
          <div className="--pb-1 --border-b border-line w-fit">
            <div className="flex items-center gap-1 bg-sunken rounded-[8px] p-1 shrink-0">
              <Link
                href={buildViewHref("grid")}
                aria-current={selectedViewMode === "grid" ? "page" : undefined}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-[6px] transition-all duration-200 text-sm font-medium ${
                  selectedViewMode === "grid"
                    ? "bg-raised text-fg shadow-sm"
                    : "text-fg-subtle hover:text-fg-muted"
                }`}
              >
                <Columns3 className="w-4 h-4" aria-hidden="true" />
                {tCommon("viewBoard")}
              </Link>

              <Link
                href={buildViewHref("table")}
                aria-current={selectedViewMode === "table" ? "page" : undefined}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-[6px] transition-all duration-200 text-sm font-medium ${
                  selectedViewMode === "table"
                    ? "bg-raised text-fg shadow-sm"
                    : "text-fg-subtle hover:text-fg-muted"
                }`}
              >
                <List className="w-4 h-4" aria-hidden="true" />
                {tCommon("viewList")}
              </Link>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
