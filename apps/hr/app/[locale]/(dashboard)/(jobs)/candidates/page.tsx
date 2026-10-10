"use client";
import MainHeader from "@/components/layout/ResourceHeader";
import { CustomPagination } from "@/components/shared/CustomPagination";
import CandidateCardsGrid, {
  CandidateCardsGridSkeleton,
} from "@/components/pages/hiring/CandidateCardsGrid";
import { useGetApplicationsQuery } from "@/redux/features/job/jobApi";
import { useState } from "react";
import { useTranslations } from "next-intl";

function CandidatePage() {
  const t = useTranslations("jobs");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const { data, isLoading, isError } = useGetApplicationsQuery({
    page,
    limit,
  });

  return (
    <main className="bg-background">
      <MainHeader title={t("candidatesPage.title")} />

      <section className="main-padding">
        {isLoading ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <CandidateCardsGridSkeleton key={`candidate-skeleton-${index}`} />
            ))}
          </div>
        ) : isError ? (
          <p className="text-sm text-destructive">
            {t("common.failedLoadCandidates")}
          </p>
        ) : (
          <CandidateCardsGrid
            candidates={data?.data?.items ?? []}
            emptyMessage={t("common.noCandidatesForJob")}
          />
        )}

        {data?.data.meta && data?.data.meta.totalPages > 1 && (
          <CustomPagination
            currentPage={data?.data.meta.page}
            totalPages={data?.data.meta.totalPages}
            limit={data?.data.meta.limit}
            totalItems={data?.data.meta.total}
            onPageChange={(page) => setPage(page)}
            onLimitChange={(limit) => {
              setLimit(limit);
              setPage(1);
            }}
          />
        )}
      </section>
    </main>
  );
}

export default CandidatePage;
