"use client";

// The four kinds of file at a glance (FS-FILES-10): how many, how much space, when last updated.
import { useTranslations } from "next-intl";
import { FileText, Folder, Image as ImageIcon, VideoCamera } from "@phosphor-icons/react";
import { ErrorState, Skeleton, useFormatter } from "@orgtik/ui";
import { useDashboardOverviewQuery } from "@/redux/features/file/fileApi";

const KIND: Record<string, { icon: React.ReactNode; tone: string }> = {
  documents: { icon: <FileText weight="duotone" />, tone: "bg-brand-subtle text-fg-brand" },
  images: { icon: <ImageIcon weight="duotone" />, tone: "bg-info-subtle text-info" },
  videos: { icon: <VideoCamera weight="duotone" />, tone: "bg-warning-subtle text-warning" },
  other: { icon: <Folder weight="duotone" />, tone: "bg-success-subtle text-success" },
};

export default function FolderCards() {
  const t = useTranslations("Dashboard");
  const tc = useTranslations("Common");
  const f = useFormatter();
  const { data, isLoading, isError, refetch } = useDashboardOverviewQuery();
  if (isLoading)
    return (
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-28 w-full rounded-card" />
        ))}
      </div>
    );
  if (isError) return <ErrorState size="compact" onRetry={refetch} />;
  const groups = (data?.data?.grouped || []) as { key: string; totalFiles: number; totalStorage: number; lastFileUpdatedAt?: string | null }[];
  return (
    <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
      {groups.map((g) => {
        const kind = KIND[g.key] ?? KIND.other;
        return (
          <li key={g.key} className="flex flex-col gap-4 rounded-card border border-line bg-raised p-4">
            <div className="flex items-center gap-3">
              <span aria-hidden="true" className={`grid size-10 place-items-center rounded-field [&>svg]:size-6 ${kind.tone}`}>
                {kind.icon}
              </span>
              <div className="flex min-w-0 flex-col">
                <h3 className="text-body-sm font-semibold text-fg">{tc((KIND[g.key] ? g.key : "other") as "documents")}</h3>
                <p className="text-caption text-fg-subtle">{g.lastFileUpdatedAt ? t("updatedOn", { date: f.date(g.lastFileUpdatedAt, { dateStyle: "medium" }) }) : t("noUpdates")}</p>
              </div>
            </div>
            <dl className="flex items-center justify-between gap-3 text-body-sm">
              <div className="flex items-center gap-2">
                <dt className="text-fg-muted">{t("filesLabel")}</dt>
                <dd className="font-semibold text-fg tabular-nums">{f.number(g.totalFiles)}</dd>
              </div>
              <div className="flex items-center gap-2">
                <dt className="text-fg-muted">{t("storageLabel")}</dt>
                <dd className="font-semibold text-fg tabular-nums">{f.bytes(g.totalStorage)}</dd>
              </div>
            </dl>
          </li>
        );
      })}
    </ul>
  );
}
