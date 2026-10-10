import { ArrowUpRight, CaretDown as ChevronDown } from "@phosphor-icons/react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/bindings/avatar";
import { cn } from "@/lib/utils";
import { IJobApplication, JobApplicationStage } from "@/types/job";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function CandidateStatusPill({ label }: { label: string }) {
  const t = useTranslations("jobs");
  const toneClasses: Record<JobApplicationStage, string> = {
    applying: "border-border bg-gray text-primary",
    screening: "border-border bg-gray text-secondary",
    interview: "border-border bg-gray text-foreground",
    hiring: "border-border bg-gray text-foreground",
    accepted: "border-border bg-gray text-foreground",
    offer: "border-border bg-gray text-foreground",
    hired: "border-border bg-gray text-foreground",
    rejected: "border-border bg-gray text-foreground",
  };

  const dotClasses: Record<JobApplicationStage, string> = {
    applying: "bg-primary",
    screening: "bg-secondary",
    interview: "bg-foreground",
    hiring: "bg-foreground",
    accepted: "bg-foreground",
    offer: "bg-foreground",
    hired: "bg-foreground",
    rejected: "bg-foreground",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-2 py-[3px] text-xs leading-4 font-medium",
        toneClasses[label as JobApplicationStage],
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          dotClasses[label as JobApplicationStage],
        )}
      />
      <span>{t(`stages.${label}`)}</span>
      <ChevronDown className="size-3.5" />
    </div>
  );
}

export function CandidateCard({
  candidate,
  showStatus = true,
}: {
  candidate: IJobApplication;
  showStatus?: boolean;
}) {
  const t = useTranslations("jobs");
  return (
    <article className="rounded-lg border border-border bg-card p-3">
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-base leading-6 font-medium text-foreground">
          <bdi>{candidate.fullName}</bdi>
        </h4>
        {showStatus ? (
          <CandidateStatusPill label={candidate.currentStage} />
        ) : null}
      </div>

      <p className="mt-3 text-xs leading-[18px] text-secondary">
        {candidate.email ? <bdi>{candidate.email}</bdi> : "-"}
      </p>

      <div className="mt-3">
        <p className="text-sm leading-5 font-medium text-foreground">
          {candidate.job?.title ? <bdi>{candidate.job.title}</bdi> : candidate.currentStage}
        </p>

        <div className="mt-2.5 flex items-start gap-2">
          <Avatar size="md" className="size-8">
            {/* {candidate.avatarUrl ? (
              <AvatarImage src={candidate.avatarUrl} alt={candidate.name} />
            ) : null} */}
            <AvatarFallback className="bg-primary text-[10px] font-semibold text-primary-foreground">
              {getInitials(candidate.fullName)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-sm leading-5 font-medium text-foreground">
              <bdi>{candidate.qualification}</bdi>
            </p>
            <p className="mt-0.5 truncate text-xs leading-[18px] text-tertiary">
              <bdi>{candidate.university}</bdi>
            </p>
          </div>
        </div>
      </div>

      <div className="mt-3 h-px w-full bg-border" />

      <Link href={`/candidates/${candidate.id}`}>
        <button
          type="button"
          className="mt-3 cursor-pointer inline-flex w-full items-center justify-center gap-1 text-xs font-medium text-primary"
        >
          {t("common.viewProfile")}
          <ArrowUpRight className="size-3.5 rtl:-scale-x-100" />
        </button>
      </Link>
    </article>
  );
}

type CandidateCardsGridProps = {
  candidates: IJobApplication[];
  emptyMessage?: string;
  className?: string;
  showStatus?: boolean;
};

export default function CandidateCardsGrid({
  candidates,
  emptyMessage,
  className,
  showStatus = true,
}: CandidateCardsGridProps) {
  const t = useTranslations("jobs");
  if (candidates && candidates.length === 0) {
    return (
      <div
        className={cn(
          "rounded-xl border border-dashed border-border bg-background px-6 py-10 text-center text-sm text-secondary",
          className,
        )}
      >
        {emptyMessage || t("common.noCandidatesYet")}
      </div>
    );
  }

  return (
    <div className={cn("grid gap-3 md:grid-cols-2 xl:grid-cols-3", className)}>
      {candidates.map((candidate) => (
        <CandidateCard
          key={candidate.id}
          candidate={candidate}
          showStatus={showStatus}
        />
      ))}
    </div>
  );
}

export function CandidateCardsGridSkeleton() {
  return (
    <div className="rounded-lg border border-border bg-card p-3 animate-pulse">
      <div className="h-5 w-1/2 rounded bg-gray" />
      <div className="mt-3 h-4 w-full rounded bg-gray" />
      <div className="mt-2 h-4 w-5/6 rounded bg-gray" />
      <div className="mt-3 h-px w-full bg-border" />
      <div className="mt-3 h-4 w-1/3 rounded bg-gray" />
    </div>
  );
}
