"use client";
import { useTranslations } from "next-intl";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import DataTable from "@/components/shared/Table";
import MainTitle from "@/components/shared/MainTitle";
import { useGetContactsQuery } from "@/redux/features/contacts/contactsApi";
// import CreateContacts from "@/components/pages/Contacts/CreateContacts";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useColumns } from "./columns";


function Contacts() {
  const t = useTranslations("ContactsPage");
  const searchParams = useSearchParams();

  const [search, setSearch] = useState<string>("");
  const [status, setStatus] = useState<string | number>("");
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);

  const filterContacts = [
    { id: "new", name: t("filter_new"), value: "new" },
    { id: "replied", name: t("filter_replied"), value: "replied" },
  ];

  const columns = useColumns();

  useEffect(() => {
    const pageParam = searchParams.get("page");
    const limitParam = searchParams.get("limit");
    const searchParam = searchParams.get("search");
    const statusParam = searchParams.get("status");

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPage(pageParam ? parseInt(pageParam) : 1);
    setLimit(limitParam ? parseInt(limitParam) : 10);
    setSearch(searchParam || "");
    setStatus(statusParam || "");
  }, [searchParams]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const queryOptions: any = { page, limit, search };
  if (status) queryOptions.status = status;

  const { data, isLoading } = useGetContactsQuery(queryOptions);

  const paginationData = data?.data?.meta;

  // mm

  return (
    <section className="space-y-6">
      <div className="">
        <MainTitle
          title={t("page_title")}
          subTitle={t("page_subtitle")}
        >
          {/* <CreateContacts>
            <Button>
              Create Contacts
              <Plus />
            </Button>
          </CreateContacts> */}
        </MainTitle>
      </div>

      <DataTable
        searchFunctions={{
          search,
          setSearch,
        }}
        filterFunctions={{
          activeFilter: status,
          setActiveFilter: setStatus,
          filterData: filterContacts,
        }}
        pagination={{
          baseUrl: "/contacts",
          currentPage: Number(paginationData?.page || page),
          limit: limit,
          totalPages: Number(paginationData?.totalPages || 1),
          totalItems: Number(paginationData?.total || 0),
        }}
        data={data?.data?.items || []}
        columns={columns}
        isLoading={isLoading}
      />
    </section>
  );
}

export default Contacts;
