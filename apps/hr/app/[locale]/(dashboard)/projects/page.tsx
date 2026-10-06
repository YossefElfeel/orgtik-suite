"use client";
import { FolderOpen } from "@phosphor-icons/react";

import React, { useState } from "react";
import ProjectCard from "@/components/pages/projects/ProjectCard";
import { CustomPagination } from "@/components/shared/CustomPagination";
import { useGetAllProjectsQuery } from "@/redux/features/projects/projectApi";
import { ToolbarSearchAndFilter } from "@/components/shared/ToolbarSearchAndFilter";
import { useLocale, useTranslations } from "next-intl";
import { formatDate } from "@/utils/formateDate";

export default function ProjectsPage() {
  const t = useTranslations("projectsPage");
  const locale = useLocale();
  const [status, setStatus] = useState<string | undefined>(undefined);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(9);
  const statusFilterOptions = [
    { id: "all", name: t("filters.all") },
    { id: "in_progress", name: t("filters.inProgress") },
    { id: "done", name: t("filters.done") },
    { id: "rejected", name: t("filters.rejected") },
    { id: "cancelled", name: t("filters.cancelled") },
  ];

  const {
    data: projectsResponse,
    isLoading,
    isError,
    error,
  } = useGetAllProjectsQuery({
    page: currentPage,
    limit,
    search: search || undefined,
    status: status || undefined,
  });

  // const projects: IProjects[] =
  //   projectsResponse?.data || projectsResponse || [];
  const totalPages = projectsResponse?.data?.meta?.totalPages || 1;
  const totalItems = projectsResponse?.data?.meta?.total;

  // Loading
  if (isLoading) {
    return (
      <section className="main-padding bg-raised min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
          <p className="mt-4 text-muted-foreground">{t("states.loading")}</p>
        </div>
      </section>
    );
  }

  // Error
  if (isError) {
    return (
      <section className="main-padding bg-raised min-h-screen flex items-center justify-center">
        <div className="text-center text-danger">
          {t("states.failedToLoad")}
          <p className="text-sm mt-2">
            {(error as any)?.message || t("states.somethingWentWrong")}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="main-padding bg-raised min-h-screen">
      <div className="mt-6">
        <div className="mb-6">
          <ToolbarSearchAndFilter
            searchFunctions={{ search, setSearch }}
            filterFunctions={{
              activeFilter: status ?? "all",
              setActiveFilter: (filterId) => {
                const id = String(filterId);
                setStatus(id === "all" ? undefined : id);
                setCurrentPage(1);
              },
              filterData: statusFilterOptions,
            }}
          />
        </div>

        {projectsResponse?.data?.items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <FolderOpen className="w-16 h-16 text-fg-subtle mb-4" />
            <p className="text-muted-foreground">{t("states.empty")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {projectsResponse?.data?.items.map((project) => (
              <ProjectCard
                key={project.id}
                project={{
                  ...project,
                  progress:
                    project.progress ?? project.completedTasksPercentage ?? 0,
                  date: formatDate(new Date()),
                  teams: project.teams || [],
                }}
              />
            ))}
          </div>
        )}

        <div className=" pt-4">
          <CustomPagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            limit={limit}
            onLimitChange={(val: number) => {
              setCurrentPage(1);
              setLimit(val);
            }}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>
    </section>
  );
}
