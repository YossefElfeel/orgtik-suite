import { Users } from "@phosphor-icons/react";
import { HeaderedCard } from ".";

import CandidateCardsGrid, {
  CandidateCardsGridSkeleton,
} from "../CandidateCardsGrid";
import { useParams } from "next/navigation";
import { useGetJobApplicationsQuery } from "@/redux/features/job/jobApi";
import { useState } from "react";
import { CustomPagination } from "@/components/shared/CustomPagination";
import { useTranslations } from "next-intl";

function CandidatesTab() {
  const t = useTranslations("jobs");
  const params = useParams();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const openingId = Number(params.openingId as string);

  const { data, isLoading, isError } = useGetJobApplicationsQuery({
    jobId: openingId,
    page,
    limit,
  });

  return (
    <HeaderedCard title={t("candidatesPage.title")} icon={Users}>
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
    </HeaderedCard>
  );
}

export default CandidatesTab;
