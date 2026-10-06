"use client";
import { ArrowUpRight, CalendarDots as CalendarDays, CaretDown as ChevronDown, ShareNetwork as Share2 } from "@phosphor-icons/react";

import type { MouseEventHandler, ReactNode } from "react";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import JobStatusDropdown from "@/components/shared/JobStatusDropdown";

export type JobOpeningCardStatusTone =
  | "success"
  | "warning"
  | "info"
  | "neutral";

export type JobOpeningCardMetaItem = {
  icon: ReactNode;
  label: string;
  /** The label is user data (a location): isolated with <bdi> so it reads right in RTL. */
  userContent?: boolean;
};

export type JobOpeningCardStat = {
  label: string;
  value: ReactNode;
};

export type JobOpeningCardStatusOption = {
  value: string;
  label?: string;
  tone?: JobOpeningCardStatusTone;
};

type JobOpeningCardProps = {
  status: string;
  title: string;
  metadata: JobOpeningCardMetaItem[];
  stats: JobOpeningCardStat[];
  dateRangeLabel: string;
  remainingLabel: string;
  department: string;
  className?: string;
  detailsHref?: string;
  detailsLabel?: string;
  hideShareAction?: boolean;
  level?: string;
  onDetailsClick?: MouseEventHandler<HTMLButtonElement>;
  onShareClick?: MouseEventHandler<HTMLButtonElement>;
  onStatusClick?: MouseEventHandler<HTMLButtonElement>;
  onStatusChange?: (value: string) => void;
  shareUrl?: string;
  shareLabel?: string;
  statusTone?: JobOpeningCardStatusTone;
  statusOptions?: JobOpeningCardStatusOption[];
};


function renderDetailsAction({
  detailsHref,
  detailsLabel,
  onDetailsClick,
}: Pick<
  JobOpeningCardProps,
  "detailsHref" | "detailsLabel" | "onDetailsClick"
>) {
  const actionContent = (
    <>
      <span>{detailsLabel}</span>
      <ArrowUpRight className="size-4 stroke-[1.8] rtl:-scale-x-100" />
    </>
  );

  const baseClassName =
    "inline-flex items-center gap-2 text-[12px] leading-4 font-normal text-fg-brand";

  if (detailsHref) {
    return (
      <Link
        href={detailsHref}
        className={cn(baseClassName, "transition-opacity hover:opacity-80")}
      >
        {actionContent}
      </Link>
    );
  }

  if (onDetailsClick) {
    return (
      <button
        type="button"
        onClick={onDetailsClick}
        className={cn(
          baseClassName,
          "cursor-pointer transition-opacity hover:opacity-80",
        )}
      >
        {actionContent}
      </button>
    );
  }

  return <div className={baseClassName}>{actionContent}</div>;
}

/**
 * Compact recruitment card with typed content slots so it can be reused
 * across dashboards, lists, and hiring overviews without hardcoded copy.
 */
export function JobOpeningCard({
  className,
  dateRangeLabel,
  department,
  detailsHref,
  detailsLabel,
  hideShareAction = false,
  level,
  metadata,
  onDetailsClick,
  onShareClick,
  onStatusClick,
  onStatusChange,
  remainingLabel,
  shareUrl,
  shareLabel,
  stats,
  status,
  statusTone = "success",
  statusOptions,
  title,
}: JobOpeningCardProps) {
  const t = useTranslations("jobOpeningCard");
  const resolvedDetailsLabel = detailsLabel ?? t("showDetails");
  const resolvedShareLabel = shareLabel ?? t("shareOpening");
  const resolvedStatusOptions =
    statusOptions && statusOptions.length > 0
      ? statusOptions
      : [{ value: status, label: status, tone: statusTone }];

  const [shareState, setShareState] = useState<"idle" | "copied">("idle");

  useEffect(() => {
    if (shareState !== "copied") {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setShareState("idle");
    }, 1800);

    return () => window.clearTimeout(timeoutId);
  }, [shareState]);

  const handleDefaultShare = async () => {
    if (typeof window === "undefined") {
      return;
    }

    const targetUrl = (() => {
      const sourceUrl = shareUrl ?? detailsHref ?? window.location.pathname;

      try {
        return new URL(sourceUrl, window.location.origin).toString();
      } catch {
        return window.location.href;
      }
    })();

    try {
      if (typeof navigator !== "undefined" && "share" in navigator) {
        await navigator.share({
          title,
          text: title,
          url: targetUrl,
        });
        return;
      }

      if (
        typeof navigator !== "undefined" &&
        (navigator as any)?.clipboard &&
        typeof (navigator as any)?.clipboard?.writeText === "function"
      ) {
        await (navigator as any)?.clipboard.writeText(targetUrl);
        setShareState("copied");
        return;
      }
    } catch {}

    window.open(targetUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <article
      className={cn(
        "flex h-full w-full min-w-0 flex-col gap-3 rounded-[8px] border border-line bg-raised p-3",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        {resolvedStatusOptions.length > 1 ? (
          <JobStatusDropdown
            status={status}
            options={resolvedStatusOptions}
            defaultTone={statusTone}
            onChange={onStatusChange}
          />
        ) : onStatusClick ? (
          <button
            type="button"
            onClick={onStatusClick}
            className="inline-flex items-center gap-1 rounded-[4px] border px-1 pe-2 py-[3px] text-[14px] leading-[18px] font-medium transition-opacity hover:opacity-90"
          >
            <span>{status}</span>
            <ChevronDown className="size-4 stroke-[1.8]" />
          </button>
        ) : (
          <JobStatusDropdown
            status={status}
            options={resolvedStatusOptions}
            defaultTone={statusTone}
          />
        )}

        {!hideShareAction ? (
          <button
            type="button"
            onClick={onShareClick ?? handleDefaultShare}
            aria-label={shareState === "copied" ? t("linkCopied") : resolvedShareLabel}
            title={shareState === "copied" ? t("linkCopied") : resolvedShareLabel}
            className={cn(
              "inline-flex size-6 shrink-0 items-center justify-center rounded-full text-fg transition-colors hover:bg-sunken",
              shareState === "copied" && "bg-brand-subtle text-fg-brand",
            )}
          >
            <Share2 className="size-4 stroke-[1.8]" />
          </button>
        ) : null}
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-end gap-x-2 gap-y-1">
            <h3 className="text-[16px] leading-6 font-medium text-fg">
              <bdi>{title}</bdi>
            </h3>
            {level ? (
              <p className="text-[12px] leading-4 font-normal text-secondary">
                ({level})
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap items-start gap-x-4 gap-y-2">
            {metadata.map((item, index) => (
              <div
                key={`${item.label}-${index}`}
                className="flex items-center gap-2 text-fg-muted"
              >
                <span className="shrink-0 [&_svg]:size-4 [&_svg]:stroke-[1.8]">
                  {item.icon}
                </span>
                <span className="text-[12px] leading-4 font-normal">
                  {item.userContent ? <bdi>{item.label}</bdi> : item.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {stats.map((stat, index) => (
            <div
              key={`${stat.label}-${index}`}
              className="flex min-w-0 flex-col gap-1 rounded-[10px] bg-gray p-3"
            >
              <p className="text-[12px] leading-4 font-normal text-secondary">
                {stat.label}
              </p>
              <div className="text-[16px] leading-5 font-medium text-fg">
                {stat.value}
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-fg-muted">
            <CalendarDays className="size-4 shrink-0 stroke-[1.8]" />
            <span className="text-[12px] leading-4 font-normal text-fg-muted">
              {dateRangeLabel}
            </span>
          </div>
          <p className="text-[12px] leading-4 font-normal text-secondary">
            {remainingLabel}
          </p>
        </div>
      </div>

      <div className="h-px w-full bg-line" />

      <div className="flex items-center justify-between gap-3">
        <p className="min-w-0 flex-1 truncate text-[14px] leading-[18px] font-medium text-fg">
          <bdi>{department}</bdi>
        </p>
        {renderDetailsAction({ detailsHref, detailsLabel: resolvedDetailsLabel, onDetailsClick })}
      </div>

      <span className="sr-only" aria-live="polite">
        {shareState === "copied" ? t("linkCopiedToClipboard") : ""}
      </span>
    </article>
  );
}
