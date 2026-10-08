"use client";

import { useMemo, useState } from "react";
import MainHeader from "@/components/shared/MainHeader";
import DataTable from "@/components/shared/Table";
import { Button } from "@/components/ui/button";
import PackageManagement from "@/components/dialogs/packages/PackageManagement";
import { usePackageColumns } from "./columns";
import { useTranslations } from "next-intl";
import { useGetPackagesQuery } from "@/redux/features/packages/packagesApi";
import SearchField from "@/components/shared/SearchField";
import { useRole } from "@/hooks/useRole";
import { pickDisplayData } from "@/lib/api-display";

export default function PackagesPage() {
  const { isAdmin, isSalesman } = useRole();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const t = useTranslations("packages");

  const { data, isFetching } = useGetPackagesQuery({
    page,
    limit,
    q: searchQuery || undefined,
  });

  const payload = pickDisplayData(data);
  const packages = payload?.items || [];
  const meta = payload?.meta;

  const columns = usePackageColumns();

  return (
    <section className="flex flex-col gap-6">
      <MainHeader
        title={t("title")}
        description={t("description")}
      >
        {isAdmin && (
          <PackageManagement
            trigger={
              <Button icon="solar:add-circle-linear">{t("newPackages")}</Button>
            }
          />
        )}
      </MainHeader>

      <div className="flex flex-col gap-5">
        {/* <div className="flex justify-start">
          <SearchField
            search={{
              placeholder: "Search packages...",
              setSearchValue: (val) => {
                setSearchQuery(val);
                setPage(1);
              },
            }}
          />
        </div> */}

        <DataTable
          columns={columns}
          data={packages}
          isLoading={isFetching}
          pagination={
            meta
              ? {
                  currentPage: meta.page,
                  totalPages: meta.totalPages,
                  limit: meta.limit,
                  totalItems: meta.total,
                  onPageChange: setPage,
                  onLimitChange: (nextLimit) => {
                    setLimit(nextLimit);
                    setPage(1);
                  },
                }
              : undefined
          }
        />
      </div>
    </section>
  );
}
