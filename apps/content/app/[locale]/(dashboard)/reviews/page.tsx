"use client";


import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import DataTable from "@/components/shared/Table";
import MainTitle from "@/components/shared/MainTitle";
import { useGetAllReviewsQuery } from "@/redux/features/reviews/reviewsApi";
import { useColumns } from "./columns";
import { CreateReviewDialog } from "@/components/pages/reviews/CreateReviewDialog";
import { useTranslations } from "next-intl";

function ReviewsPage() {
  const t = useTranslations("ReviewsPage");
  const searchParams = useSearchParams();

  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [isPublicFilter, setIsPublicFilter] = useState<string | number>("all");
  const columns = useColumns();

  useEffect(() => {
    const pageParam = searchParams.get("page");
    const limitParam = searchParams.get("limit");

    setPage(pageParam ? parseInt(pageParam) : 1);
    setLimit(limitParam ? parseInt(limitParam) : 10);
  }, [searchParams]);
  const { data, isLoading } = useGetAllReviewsQuery({
    page,
    limit,
    search: searchQuery,
    isPublic: isPublicFilter === "all" ? undefined : isPublicFilter === "true",
  });

  const paginationData = data?.data?.meta;

  return (
    <section className="space-y-6">
      <MainTitle
        title={t("page_title")}
        subTitle={t("page_subtitle")}
      >
        <CreateReviewDialog />
      </MainTitle>

      <DataTable
        filterFunctions={{
          activeFilter: isPublicFilter,
          setActiveFilter: setIsPublicFilter,
          filterData: [
            { id: "all", name: t("filter_all") },
            { id: "true", name: t("filter_public") },
            { id: "false", name: t("filter_private") },
          ],
        }}
        searchFunctions={{
          search: searchQuery,
          setSearch: setSearchQuery,
        }}
        pagination={{
          baseUrl: "/reviews",
          currentPage: Number(paginationData?.page ?? page),
          limit: Number(paginationData?.limit ?? limit),
          totalPages: Number(paginationData?.totalPages ?? 1),
          totalItems: Number(paginationData?.total ?? 0),
        }}
        data={data?.data?.items || []}
        columns={columns}
        isLoading={isLoading}
      />
    </section>
  );
}

export default ReviewsPage;
