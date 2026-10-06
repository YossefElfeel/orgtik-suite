"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { FolderOpen } from "@phosphor-icons/react";
import { EmptyState, ErrorState, Skeleton } from "@orgtik/ui";
import { useDashboardOverviewQuery } from "@/redux/features/file/fileApi";
import { IFile } from "@/types";
import { FilePreview } from "@/components/shared/FilePreview";
import { FileCard } from "@/components/shared/FileCard";

const RecentFiles = () => {
  const t = useTranslations("Dashboard");
  const { data, isLoading, isError, refetch } = useDashboardOverviewQuery();
  const recentFiles: IFile[] = data?.data?.recentAddedFiles || [];
  const imageFiles = recentFiles.filter((f) => f.mimeType?.startsWith("image/"));
  const [active, setActive] = useState<number | null>(null);
  return (
    <section aria-labelledby="recent-files" className="flex flex-col gap-4">
      <h2 id="recent-files" className="font-display text-title-sm text-fg">
        {t("recentFiles")}
      </h2>
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-64 w-full rounded-card" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState size="compact" onRetry={refetch} />
      ) : recentFiles.length === 0 ? (
        <EmptyState size="compact" icon={<FolderOpen />} title={t("noRecentFiles")} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {recentFiles.map((file, idx) => (
            <FileCard
              key={file.id || idx}
              file={file}
              onPreview={() => {
                const i = imageFiles.findIndex((img) => img.id === file.id);
                if (i !== -1) setActive(i);
              }}
            />
          ))}
        </div>
      )}
      {active !== null && imageFiles[active] ? (
        <FilePreview file={imageFiles[active]} images={imageFiles} currentIndex={active} onIndexChange={setActive} open onOpenChange={(open) => !open && setActive(null)} />
      ) : null}
    </section>
  );
};

export default RecentFiles;
